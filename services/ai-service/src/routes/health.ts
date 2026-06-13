import { Router, Request, Response } from 'express';
import { config } from '../config';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'ai-service',
    version: '2.0.0',
    mode: config.mockAgent ? 'mock' : 'live',
    model: config.bedrockModelId,
    sqsEnabled: Boolean(config.sqsQueueUrl),
  });
});

export default router;
