import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { config } from './config';
import { errorHandler } from './middleware/errorHandler';
import { swaggerSpec } from './swagger';

// Routes
import healthRoutes from './routes/health';
import authRoutes from './routes/auth';
import shipmentRoutes from './routes/shipments';
import trackingRoutes from './routes/tracking';
import documentRoutes from './routes/documents';
import notificationRoutes from './routes/notifications';
import reportRoutes from './routes/reports';
import adminRoutes from './routes/admin';

const app = express();

// Middleware
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());

// Serve uploaded files
app.use('/uploads', express.static(config.uploadDir));

// Swagger docs
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// API routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/shipments', shipmentRoutes);
app.use('/api/tracking', trackingRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/admin', adminRoutes);

// Error handler
app.use(errorHandler);

app.listen(config.port, '0.0.0.0', () => {
  console.log(`CargoTrack API running on port ${config.port}`);
  console.log(`Swagger docs available at http://localhost:${config.port}/api/docs`);
  console.log(`Environment: ${config.nodeEnv}`);
});

export default app;
