import app from './app';
import { connectDatabase, disconnectDatabase } from '@/infra/database/database';
import { logger } from '@/shared/utils/logger';

const PORT = parseInt(process.env.PORT ?? '4000', 10);

async function bootstrap(): Promise<void> {
  try {
    await connectDatabase();

    const server = app.listen(PORT, () => {
      logger.info(`🚀 AVS Backend démarré — http://localhost:${PORT}`);
      logger.info(`📚 Swagger UI : http://localhost:${PORT}/api-docs`);
      logger.info(`📋 Health     : http://localhost:${PORT}/api/v1/health`);
      logger.info(`🌍 Environnement : ${process.env.NODE_ENV ?? 'development'}`);
    });

    // Graceful shutdown
    const shutdown = async (signal: string): Promise<void> => {
      logger.warn(`Signal ${signal} reçu — arrêt gracieux…`);
      server.close(async () => {
        await disconnectDatabase();
        logger.info('Serveur arrêté proprement');
        process.exit(0);
      });
      setTimeout(() => { logger.error('Arrêt forcé après timeout'); process.exit(1); }, 10_000);
    };

    process.on('SIGTERM', () => void shutdown('SIGTERM'));
    process.on('SIGINT',  () => void shutdown('SIGINT'));
    process.on('uncaughtException',  err => { logger.error('uncaughtException', err); process.exit(1); });
    process.on('unhandledRejection', err => { logger.error('unhandledRejection', err); });

  } catch (err) {
    logger.error('Échec du démarrage', err);
    process.exit(1);
  }
}

void bootstrap();
