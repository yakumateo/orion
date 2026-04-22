import 'dotenv/config';
import * as readline from 'readline';
import { chat } from './agent/orchestrator';
import { connectDB, disconnectDB } from './database/prisma.client';
import { logger } from './config/logger';

const SESSION_ID = 'cli-session';

async function main() {
  await connectDB();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log('\n🌌 Orion está listo. Escribe "salir" para terminar.\n');

  const ask = () => {
    rl.question('Tú → ', async (input) => {
      const message = input.trim();
      if (!message) return ask();
      if (message.toLowerCase() === 'salir') {
        await disconnectDB();
        rl.close();
        return;
      }

      try {
        const response = await chat(SESSION_ID, message);
        console.log(`\nOrion → ${response}\n`);
      } catch (err) {
        logger.error('Error in chat', { error: err });
        console.log('Orion → Hubo un error, intenta de nuevo.\n');
      }

      ask();
    });
  };

  ask();
}

main().catch((err) => {
  logger.error('Fatal error', { error: err });
  process.exit(1);
});
