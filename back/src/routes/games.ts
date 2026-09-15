import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { asyncHandler } from '../lib/asyncHandler';
import { notFound } from '../lib/errors';
import { createGameSchema, difficultyQuerySchema } from '../lib/schemas';
import { createGameLimiter } from '../middleware/rateLimit';

export const gamesRouter = Router();

/**
 * GET /api/games?owner=<token>
 * Lista SÓ os jogos de um dono (metadados, sem perguntas/gabarito), do mais
 * novo ao mais antigo. Sem `owner`, não lista nada — não há como enumerar os
 * jogos de todo mundo. É o que garante que um criador não veja os jogos dos
 * outros, mesmo sem sistema de login: o token é o segredo de cada criador.
 */
gamesRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const owner = typeof req.query.owner === 'string' ? req.query.owner.trim() : '';
    if (!owner) {
      return res.json({ count: 0, games: [] });
    }

    const games = await prisma.game.findMany({
      where: { ownerToken: owner },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        subjectTitle: true,
        groupName: true,
        createdAt: true,
      },
    });
    res.json({ count: games.length, games });
  }),
);

/**
 * POST /api/games
 * Cria o jogo (título, grupo, matéria, foto, cor) + lista de perguntas.
 * Retorna o jogo completo (lado autoria — inclui gabarito).
 */
gamesRouter.post(
  '/',
  createGameLimiter,
  asyncHandler(async (req, res) => {
    const data = createGameSchema.parse(req.body);

    const game = await prisma.game.create({
      data: {
        ownerToken: data.ownerToken,
        title: data.title,
        groupName: data.groupName,
        subjectTitle: data.subjectTitle,
        coverPhotoUrl: data.coverPhotoUrl ?? null,
        ...(data.primaryColor ? { primaryColor: data.primaryColor } : {}),
        questions: {
          create: data.questions.map((q) => ({
            text: q.text,
            correctAnswer: q.correctAnswer,
            difficulty: q.difficulty,
            hint: q.hint ?? null,
            explanation: q.explanation,
            order: q.order,
          })),
        },
      },
      include: {
        questions: { orderBy: [{ difficulty: 'asc' }, { order: 'asc' }] },
      },
    });

    res.status(201).json(game);
  }),
);

/**
 * GET /api/games/:id
 * Dados do jogo para a tela de capa + contagem de perguntas por nível
 * (para a tela mostrar quais níveis estão disponíveis).
 */
gamesRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const game = await prisma.game.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        title: true,
        groupName: true,
        subjectTitle: true,
        coverPhotoUrl: true,
        primaryColor: true,
        createdAt: true,
      },
    });

    if (!game) throw notFound('Jogo não encontrado.');

    const grouped = await prisma.question.groupBy({
      by: ['difficulty'],
      where: { gameId: game.id },
      _count: { _all: true },
    });

    const questionCounts = grouped.reduce<Record<string, number>>((acc, row) => {
      acc[row.difficulty] = row._count._all;
      return acc;
    }, {});

    res.json({ ...game, questionCounts });
  }),
);

/**
 * GET /api/games/:id/questions?difficulty=facil
 * Retorna as 10 perguntas do nível escolhido, ordenadas por `order`.
 * NUNCA expõe correctAnswer nem explanation (só após responder).
 * A dica (hint) é enviada — ela é opcional e revelada sob demanda pela UI.
 */
gamesRouter.get(
  '/:id/questions',
  asyncHandler(async (req, res) => {
    const { difficulty } = difficultyQuerySchema.parse(req.query);

    const game = await prisma.game.findUnique({
      where: { id: req.params.id },
      select: { id: true },
    });
    if (!game) throw notFound('Jogo não encontrado.');

    const questions = await prisma.question.findMany({
      where: { gameId: game.id, difficulty },
      orderBy: { order: 'asc' },
      select: {
        id: true,
        text: true,
        difficulty: true,
        hint: true,
        order: true,
        // correctAnswer e explanation propositalmente OMITIDOS.
      },
    });

    res.json({ gameId: game.id, difficulty, count: questions.length, questions });
  }),
);
