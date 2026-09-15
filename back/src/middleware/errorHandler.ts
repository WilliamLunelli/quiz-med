import type { NextFunction, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { AppError } from '../lib/errors';

/** Rota não encontrada -> 404 JSON. */
export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ error: `Rota não encontrada: ${req.method} ${req.path}` });
}

/** Middleware central de erros. Sempre responde JSON. */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // O Express exige a assinatura de 4 argumentos para reconhecer como error handler.
  _next: NextFunction,
) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message, details: err.details });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Dados inválidos.',
      details: err.flatten(),
    });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // P2025: registro não encontrado; P2002: violação de unicidade.
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Registro não encontrado.' });
    }
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'Registro duplicado.' });
    }
    return res.status(400).json({ error: 'Erro de banco de dados.', code: err.code });
  }

  console.error('[erro não tratado]', err);
  return res.status(500).json({ error: 'Erro interno do servidor.' });
}
