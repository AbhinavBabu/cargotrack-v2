import { Router, Request, Response } from 'express';
import { PrismaClient, ShipmentStatus } from '@prisma/client';
import { z } from 'zod';
import { authenticate, requireAdmin } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { notificationProvider } from '../providers/notification';
import { eventPublisher } from '../providers/event';

const prisma = new PrismaClient();
const router = Router();

const updateStatusSchema = z.object({
  status: z.nativeEnum(ShipmentStatus),
  location: z.string().optional(),
  description: z.string().optional(),
});

/**
 * @swagger
 * /api/admin/shipments:
 *   get:
 *     summary: List all shipments (admin)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: List of all shipments
 */
router.get('/shipments', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as ShipmentStatus | undefined;
    const search = req.query.search as string | undefined;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { trackingNumber: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } },
        { senderName: { contains: search, mode: 'insensitive' } },
        { receiverName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [shipments, total] = await Promise.all([
      prisma.shipment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true } },
          trackingEvents: { orderBy: { timestamp: 'desc' }, take: 1 },
        },
      }),
      prisma.shipment.count({ where }),
    ]);

    res.json({
      data: shipments,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Admin list shipments error:', error);
    res.status(500).json({ error: 'Failed to fetch shipments' });
  }
});

/**
 * @swagger
 * /api/admin/shipments/{id}/status:
 *   put:
 *     summary: Update shipment status (admin)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [CREATED, PICKED_UP, IN_TRANSIT, OUT_FOR_DELIVERY, DELIVERED, DELAYED, CANCELLED] }
 *               location: { type: string }
 *               description: { type: string }
 *     responses:
 *       200:
 *         description: Status updated
 */
router.put('/shipments/:id/status', authenticate, requireAdmin, validate(updateStatusSchema), async (req: Request, res: Response) => {
  try {
    const { status, location, description } = req.body;

    const shipment = await prisma.shipment.findUnique({ where: { id: req.params.id } });
    if (!shipment) {
      res.status(404).json({ error: 'Shipment not found' });
      return;
    }

    const updated = await prisma.shipment.update({
      where: { id: req.params.id },
      data: { status },
    });

    await prisma.trackingEvent.create({
      data: {
        shipmentId: shipment.id,
        status,
        location: location || null,
        description: description || `Shipment status updated to ${status}`,
      },
    });

    // Notify shipment owner
    await notificationProvider.send(
      shipment.userId,
      'Shipment Status Updated',
      `Your shipment ${shipment.trackingNumber} status has been updated to ${status}.`
    );

    if (status === ShipmentStatus.DELIVERED) {
      await notificationProvider.send(
        shipment.userId,
        'Shipment Delivered',
        `Your shipment ${shipment.trackingNumber} has been delivered successfully!`
      );
    }

    await eventPublisher.publish('shipment.status_updated', {
      trackingNumber: shipment.trackingNumber,
      oldStatus: shipment.status,
      newStatus: status,
    });

    res.json(updated);
  } catch (error) {
    console.error('Admin update status error:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

/**
 * @swagger
 * /api/admin/documents/{shipmentId}:
 *   get:
 *     summary: View shipment documents (admin)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: shipmentId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: List of documents
 */
router.get('/documents/:shipmentId', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const documents = await prisma.shipmentDocument.findMany({
      where: { shipmentId: req.params.shipmentId },
      orderBy: { uploadedAt: 'desc' },
    });

    res.json(documents);
  } catch (error) {
    console.error('Admin view documents error:', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

export default router;
