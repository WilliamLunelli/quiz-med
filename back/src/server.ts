import 'dotenv/config';
import { createApp } from './app';
import { prisma } from './lib/prisma';
import { RATE_LIMIT_ENABLED } from './middleware/rateLimit';

const PORT = Number(process.env.PORT ?? 3000);

const app = createApp();

const server = app.listen(PORT, () => {
  console.log(`API do quiz rodando em http://localhost:${PORT}`);
  console.log(`Rate limit: ${RATE_LIMIT_ENABLED ? 'ATIVADO' : 'DESATIVADO'}`);
});

async function shutdown(signal: string) {
  console.log(`\n${signal} recebido, encerrando...`);
  server.close();
  await prisma.$disconnect();
  process.exit(0);
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
