import { Router, Request, Response } from 'express';
import { PrismaClient, ShipmentStatus } from '@prisma/client';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { notificationProvider } from '../providers/notification';
import { eventPublisher } from '../providers/event';

const prisma = new PrismaClient();
const router = Router();

function generateTrackingNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(100000 + Math.random() * 900000);
  return `CT-${year}-${random}`;
}

const createShipmentSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  senderName: z.string().min(1, 'Sender name is required'),
  receiverName: z.string().min(1, 'Receiver name is required'),
  origin: z.string().min(1, 'Origin is required'),
  destination: z.string().min(1, 'Destination is required'),
  shipmentType: z.string().min(1, 'Shipment type is required'),
  weight: z.number().positive('Weight must be positive'),
  description: z.string().optional(),
  estimatedDeliveryDate: z.string().optional(),
});

const updateShipmentSchema = z.object({
  title: z.string().min(1).optional(),
  senderName: z.string().min(1).optional(),
  receiverName: z.string().min(1).optional(),
  origin: z.string().min(1).optional(),
  destination: z.string().min(1).optional(),
  shipmentType: z.string().min(1).optional(),
  weight: z.number().positive().optional(),
  description: z.string().optional(),
  estimatedDeliveryDate: z.string().optional(),
});

/**
 * @swagger
 * /api/shipments:
 *   get:
 *     summary: List user's shipments
 *     tags: [Shipments]
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
 *         description: List of shipments
 */
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as ShipmentStatus | undefined;
    const search = req.query.search as string | undefined;
    const skip = (page - 1) * limit;

    const where: any = { userId: req.user!.userId };
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
        include: { trackingEvents: { orderBy: { timestamp: 'desc' }, take: 1 } },
      }),
      prisma.shipment.count({ where }),
    ]);

    res.json({
      data: shipments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('List shipments error:', error);
    res.status(500).json({ error: 'Failed to fetch shipments' });
  }
});

/**
 * @swagger
 * /api/shipments:
 *   post:
 *     summary: Create a new shipment
 *     tags: [Shipments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, senderName, receiverName, origin, destination, shipmentType, weight]
 *             properties:
 *               title: { type: string }
 *               senderName: { type: string }
 *               receiverName: { type: string }
 *               origin: { type: string }
 *               destination: { type: string }
 *               shipmentType: { type: string }
 *               weight: { type: number }
 *               description: { type: string }
 *               estimatedDeliveryDate: { type: string }
 *     responses:
 *       201:
 *         description: Shipment created
 */
router.post('/', authenticate, validate(createShipmentSchema), async (req: Request, res: Response) => {
  try {
    const trackingNumber = generateTrackingNumber();
    const shipment = await prisma.shipment.create({
      data: {
        ...req.body,
        trackingNumber,
        userId: req.user!.userId,
        weight: parseFloat(req.body.weight),
        estimatedDeliveryDate: req.body.estimatedDeliveryDate
          ? new Date(req.body.estimatedDeliveryDate)
          : null,
      },
    });

    // Create initial tracking event
    await prisma.trackingEvent.create({
      data: {
        shipmentId: shipment.id,
        status: ShipmentStatus.CREATED,
        description: 'Shipment has been created',
        location: req.body.origin,
      },
    });

    // Send notification
    await notificationProvider.send(
      req.user!.userId,
      'Shipment Created',
      `Your shipment ${trackingNumber} has been created successfully.`
    );

    // Publish event
    await eventPublisher.publish('shipment.created', { trackingNumber, shipmentId: shipment.id });

    res.status(201).json(shipment);
  } catch (error) {
    console.error('Create shipment error:', error);
    res.status(500).json({ error: 'Failed to create shipment' });
  }
});

/**
 * @swagger
 * /api/shipments/{id}:
 *   get:
 *     summary: Get shipment details
 *     tags: [Shipments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Shipment details
 */
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const shipment = await prisma.shipment.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
      include: {
        trackingEvents: { orderBy: { timestamp: 'asc' } },
        documents: true,
      },
    });

    if (!shipment) {
      res.status(404).json({ error: 'Shipment not found' });
      return;
    }

    res.json(shipment);
  } catch (error) {
    console.error('Get shipment error:', error);
    res.status(500).json({ error: 'Failed to fetch shipment' });
  }
});

/**
 * @swagger
 * /api/shipments/{id}:
 *   put:
 *     summary: Update a shipment
 *     tags: [Shipments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Shipment updated
 */
router.put('/:id', authenticate, validate(updateShipmentSchema), async (req: Request, res: Response) => {
  try {
    const existing = await prisma.shipment.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
    });

    if (!existing) {
      res.status(404).json({ error: 'Shipment not found' });
      return;
    }

    if (existing.status === ShipmentStatus.DELIVERED || existing.status === ShipmentStatus.CANCELLED) {
      res.status(400).json({ error: 'Cannot update a delivered or cancelled shipment' });
      return;
    }

    const data: any = { ...req.body };
    if (data.weight) data.weight = parseFloat(data.weight);
    if (data.estimatedDeliveryDate) data.estimatedDeliveryDate = new Date(data.estimatedDeliveryDate);

    const shipment = await prisma.shipment.update({
      where: { id: req.params.id },
      data,
    });

    res.json(shipment);
  } catch (error) {
    console.error('Update shipment error:', error);
    res.status(500).json({ error: 'Failed to update shipment' });
  }
});

/**
 * @swagger
 * /api/shipments/{id}:
 *   delete:
 *     summary: Cancel a shipment
 *     tags: [Shipments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Shipment cancelled
 */
router.delete('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const existing = await prisma.shipment.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
    });

    if (!existing) {
      res.status(404).json({ error: 'Shipment not found' });
      return;
    }

    if (existing.status === ShipmentStatus.DELIVERED) {
      res.status(400).json({ error: 'Cannot cancel a delivered shipment' });
      return;
    }

    const shipment = await prisma.shipment.update({
      where: { id: req.params.id },
      data: { status: ShipmentStatus.CANCELLED },
    });

    await prisma.trackingEvent.create({
      data: {
        shipmentId: shipment.id,
        status: ShipmentStatus.CANCELLED,
        description: 'Shipment has been cancelled',
      },
    });

    await notificationProvider.send(
      req.user!.userId,
      'Shipment Cancelled',
      `Your shipment ${shipment.trackingNumber} has been cancelled.`
    );

    await eventPublisher.publish('shipment.cancelled', { trackingNumber: shipment.trackingNumber });

    res.json(shipment);
  } catch (error) {
    console.error('Cancel shipment error:', error);
    res.status(500).json({ error: 'Failed to cancel shipment' });
  }
});

export default router;
