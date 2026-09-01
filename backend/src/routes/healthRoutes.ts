import { Router, Request, Response } from 'express';
import { checkDbConnection } from '../db/index.js';
import { env } from '../config/env.js';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  const dbHealth = await checkDbConnection();

  const isHealthy = dbHealth.ok;

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    database: dbHealth,
    config: {
      cohereConfigured: Boolean(env.COHERE_API_KEY),
      anthropicConfigured: Boolean(env.ANTHROPIC_API_KEY),
      geminiConfigured: Boolean(env.GEMINI_API_KEY),

      cohereEmbeddingModel: env.COHERE_EMBEDDING_MODEL,
      anthropicModel: env.ANTHROPIC_MODEL,
      geminiModel: env.GEMINI_MODEL,

      environment: env.NODE_ENV,
    },
  });
});

export default router;
