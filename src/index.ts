import express from 'express';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import type { IncomingMessage } from 'node:http';
import { config } from './config.js';
import { logger } from './logger.js';
import { FinanceTrackerApiClient } from './api-client.js';
import { getCatalog } from './mcp/catalog.js';
import { createMcpProtocolRouter } from './mcp/protocol.js';
import { createReadResourcesRouter } from './mcp/read-resources.js';
import { createToolsRouter } from './mcp/tools.js';

export function createApp(): express.Express {
  const app = express();
  const apiClient = new FinanceTrackerApiClient();

  app.set('trust proxy', 1);
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(express.json({ limit: '1mb' }));
  app.use(
    pinoHttp({
      logger,
      autoLogging: {
        ignore: (req: IncomingMessage) => req.url === '/health' || req.url === '/ready',
      },
    }),
  );

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.get('/ready', async (_req, res) => {
    try {
      await apiClient.health();
      res.json({ status: 'ready' });
    } catch (err) {
      reqLogError(err, 'Finance Tracker API readiness check failed');
      res.status(503).json({ status: 'not-ready' });
    }
  });

  app.get('/mcp/catalog', (_req, res) => {
    res.json(getCatalog());
  });

  app.use('/mcp', createMcpProtocolRouter(apiClient));
  app.use('/mcp/resources', createReadResourcesRouter(apiClient));
  app.use('/mcp/tools', createToolsRouter(apiClient));

  app.use((_req, res) => {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found' } });
  });

  return app;
}

function reqLogError(err: unknown, message: string): void {
  logger.error({ err }, message);
}

async function main(): Promise<void> {
  const app = createApp();
  const server = app.listen(config.PORT, () => {
    logger.info({ port: config.PORT, apiBaseUrl: config.FINTRACK_API_BASE_URL }, 'MCP service listening');
  });

  let shuttingDown = false;
  const shutdown = (sig: string): void => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info({ sig }, 'Shutting down');
    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
    setTimeout(() => {
      logger.warn('Forcing exit after 10s');
      process.exit(1);
    }, 10_000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('unhandledRejection', (reason) => {
    logger.error({ reason }, 'unhandledRejection');
  });
  process.on('uncaughtException', (err) => {
    logger.error({ err }, 'uncaughtException');
  });
}

if (process.env.NODE_ENV !== 'test') {
  void main();
}
