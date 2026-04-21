import 'dotenv/config';
import { env } from './config/env';
import { logger } from './config/logger';

async function main() {
  logger.info('Orion agent starting...', { mode: env.NODE_ENV });
}

main().catch((err) => {
  logger.error('Fatal error', { error: err });
  process.exit(1);
});
