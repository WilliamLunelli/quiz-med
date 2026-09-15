import express from 'express';
import cors from 'cors';
import { gamesRouter } from './routes/games';
import { attemptsRouter } from './routes/attempts';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimit';

/**
 * Interpreta TRUST_PROXY:
 *   ausente/"false" -> não confia (usa o IP do socket)
 *   "true"          -> confia no 1º proxy
 *   número (ex "1") -> confia em N saltos de proxy
 * Necessário quando a API roda atrás de reverse proxy (nginx, Railway, Render...),
 * senão o rate limit contaria o IP do proxy, não o do cliente.
 */
function trustProxySetting(): boolean | number {
  const v = process.env.TRUST_PROXY;
  if (!v || v === 'false') return false;
  if (v === 'true') return 1;
  const n = Number(v);
  return Number.isInteger(n) && n >= 0 ? n : false;
}

export function createApp() {
  const app = express();

  app.set('trust proxy', trustProxySetting());

  // Frontend mobile (QR code) roda em outra origem — CORS liberado.
  app.use(cors());
  // 2mb dá margem para a foto de capa embutida (data URI já comprimida no cliente).
  app.use(express.json({ limit: '2mb' }));

  // Health check fica FORA do rate limit (monitoramento não deve ser bloqueado).
  app.get('/health', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

  // Rate limit por IP em toda a API, contra sobrecarga/flood.
  // Quando desligado (padrão), apiLimiter é um passthrough (não bloqueia nada).
  app.use('/api', apiLimiter);

  app.use('/api/games', gamesRouter);
  app.use('/api/attempts', attemptsRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
