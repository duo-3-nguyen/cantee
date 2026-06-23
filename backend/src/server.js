import app from './app.js';
import { connectDB } from './db/connection.js';
import config from './config/index.js';
import { logger } from './shared/utils/logger.js';

async function start() {
  await connectDB();

  app.listen(config.port, () => {
    logger.info(`Server running on port ${config.port} in ${config.nodeEnv} mode`);
  });
}

start().catch((err) => {
  logger.error({ err }, 'Failed to start server');
  process.exit(1);
});