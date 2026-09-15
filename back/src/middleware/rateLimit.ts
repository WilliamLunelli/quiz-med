import rateLimit from 'express-rate-limit';
import type { Request, Response, RequestHandler } from 'express';

/**
 * Liga/desliga o rate limit inteiro por env.
 * DESABILITADO por padrão: o primeiro teste será numa faculdade, onde vários
 * alunos saem pelo mesmo IP (NAT do Wi-Fi) e estourariam o limite juntos.
 * Para reativar: RATE_LIMIT_ENABLED=true no .env.
 */
export const RATE_LIMIT_ENABLED = process.env.RATE_LIMIT_ENABLED === 'true';

/** Middleware que não faz nada (usado quando o rate limit está desligado). */
const passthrough: RequestHandler = (_req, _res, next) => next();

/** Lê um número de env var com fallback seguro. */
function num(value: string | undefined, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

/** Resposta 429 em JSON, no mesmo formato dos outros erros da API. */
function tooManyRequests(_req: Request, res: Response) {
  res.status(429).json({
    error: 'Muitas requisições deste IP. Aguarde um instante e tente novamente.',
  });
}

/**
 * Limitador GLOBAL da API — protege contra sobrecarga/flood.
 * Conta requisições por IP dentro de uma janela; ao estourar, bloqueia com 429
 * até a janela reiniciar.
 *
 * Padrões generosos de propósito: numa sala de aula muitos alunos podem
 * compartilhar o mesmo IP público (NAT do Wi-Fi). Ajuste por env se precisar:
 *   RATE_LIMIT_WINDOW_MS (padrão 60000)
 *   RATE_LIMIT_MAX       (padrão 300)
 */
export const apiLimiter: RequestHandler = RATE_LIMIT_ENABLED
  ? rateLimit({
      windowMs: num(process.env.RATE_LIMIT_WINDOW_MS, 60_000),
      limit: num(process.env.RATE_LIMIT_MAX, 300),
      standardHeaders: 'draft-7',
      legacyHeaders: false,
      handler: tooManyRequests,
    })
  : passthrough;

/**
 * Limitador ESTRITO para criação de jogos (POST /api/games).
 * É ação de autoria, rara — não é feita por participantes — então pode ser
 * apertada sem afetar a sala. Bloqueia scripts que tentem criar jogos em massa.
 *   GAME_RATE_LIMIT_WINDOW_MS (padrão 3600000 = 1h)
 *   GAME_RATE_LIMIT_MAX       (padrão 20)
 */
export const createGameLimiter: RequestHandler = RATE_LIMIT_ENABLED
  ? rateLimit({
      windowMs: num(process.env.GAME_RATE_LIMIT_WINDOW_MS, 60 * 60_000),
      limit: num(process.env.GAME_RATE_LIMIT_MAX, 20),
      standardHeaders: 'draft-7',
      legacyHeaders: false,
      handler: tooManyRequests,
    })
  : passthrough;
