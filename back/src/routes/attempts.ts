import { Router } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { asyncHandler } from '../lib/asyncHandler';
import { badRequest, conflict, notFound } from '../lib/errors';
import { createAttemptSchema, submitAnswerSchema } from '../lib/schemas';
import { computePoints, isDifficulty, type Difficulty } from '../config/quiz';

export const attemptsRouter = Router();

/**
 * POST /api/attempts
 * Cria uma tentativa: { gameId, participantName, difficulty }.
 * Já retorna as perguntas do nível (sem gabarito) para a UI começar direto.
 */
attemptsRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const { gameId, participantName, difficulty } = createAttemptSchema.parse(req.body);

    const game = await prisma.game.findUnique({ where: { id: gameId }, select: { id: true } });
    if (!game) throw notFound('Jogo não encontrado.');

    const questions = await prisma.question.findMany({
      where: { gameId, difficulty },
      orderBy: { order: 'asc' },
      select: { id: true, text: true, difficulty: true, hint: true, order: true },
    });

    if (questions.length === 0) {
      throw badRequest(`Não há perguntas cadastradas para o nível "${difficulty}".`);
    }

    const attempt = await prisma.attempt.create({
      data: { gameId, participantName, difficulty },
      select: {
        id: true,
        gameId: true,
        participantName: true,
        difficulty: true,
        score: true,
        startedAt: true,
        finishedAt: true,
      },
    });

    res.status(201).json({ attempt, totalQuestions: questions.length, questions });
  }),
);

/**
 * POST /api/attempts/:id/answers
 * Registra a resposta de uma pergunta: { questionId, answerGiven, usedHint }.
 * O servidor calcula isCorrect e pointsEarned (nunca confia no cliente).
 * Retorna { isCorrect, pointsEarned, explanation, correctAnswer } para o feedback.
 */
attemptsRouter.post(
  '/:id/answers',
  asyncHandler(async (req, res) => {
    const attemptId = req.params.id;
    const { questionId, answerGiven, usedHint } = submitAnswerSchema.parse(req.body);

    const attempt = await prisma.attempt.findUnique({
      where: { id: attemptId },
      select: { id: true, gameId: true, difficulty: true, finishedAt: true },
    });
    if (!attempt) throw notFound('Tentativa não encontrada.');
    if (attempt.finishedAt) throw conflict('Tentativa já concluída; não aceita novas respostas.');
    if (!isDifficulty(attempt.difficulty)) {
      throw badRequest('Nível da tentativa é inválido.');
    }
    const attemptDifficulty: Difficulty = attempt.difficulty;

    const question = await prisma.question.findUnique({
      where: { id: questionId },
      select: { id: true, gameId: true, difficulty: true, correctAnswer: true, explanation: true },
    });
    if (!question) throw notFound('Pergunta não encontrada.');
    if (question.gameId !== attempt.gameId) {
      throw badRequest('A pergunta não pertence ao jogo desta tentativa.');
    }
    if (question.difficulty !== attempt.difficulty) {
      throw badRequest('A pergunta não pertence ao nível escolhido nesta tentativa.');
    }

    const isCorrect = answerGiven === question.correctAnswer;
    const pointsEarned = computePoints(attemptDifficulty, isCorrect, usedHint);

    try {
      await prisma.$transaction([
        prisma.attemptAnswer.create({
          data: {
            attemptId,
            questionId,
            answerGiven,
            isCorrect,
            usedHint,
            pointsEarned,
          },
        }),
        prisma.attempt.update({
          where: { id: attemptId },
          data: { score: { increment: pointsEarned } },
        }),
      ]);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw conflict('Esta pergunta já foi respondida nesta tentativa.');
      }
      throw err;
    }

    res.status(201).json({
      isCorrect,
      pointsEarned,
      explanation: question.explanation,
      correctAnswer: question.correctAnswer,
    });
  }),
);

/**
 * POST /api/attempts/:id/finish
 * Marca a tentativa como concluída e retorna o resumo final.
 * O score é recomputado a partir das respostas (fonte da verdade).
 * Idempotente: se já concluída, apenas devolve o resumo.
 */
attemptsRouter.post(
  '/:id/finish',
  asyncHandler(async (req, res) => {
    const attemptId = req.params.id;

    const attempt = await prisma.attempt.findUnique({
      where: { id: attemptId },
      include: {
        answers: {
          select: {
            isCorrect: true,
            usedHint: true,
            pointsEarned: true,
            question: { select: { difficulty: true } },
          },
        },
      },
    });
    if (!attempt) throw notFound('Tentativa não encontrada.');

    const totalScore = attempt.answers.reduce((sum, a) => sum + a.pointsEarned, 0);
    const correctCount = attempt.answers.filter((a) => a.isCorrect).length;
    const hintsUsed = attempt.answers.filter((a) => a.usedHint).length;
    const answeredCount = attempt.answers.length;

    // Acertos por nível (para modo misto vira só o total sob a chave "mista").
    const byLevel: Record<string, { correct: number; answered: number }> = {};
    for (const a of attempt.answers) {
      const level = a.question.difficulty;
      byLevel[level] ??= { correct: 0, answered: 0 };
      byLevel[level].answered += 1;
      if (a.isCorrect) byLevel[level].correct += 1;
    }

    const totalQuestions = await prisma.question.count({
      where: { gameId: attempt.gameId, difficulty: attempt.difficulty },
    });

    const finishedAt = attempt.finishedAt ?? new Date();
    const updated = await prisma.attempt.update({
      where: { id: attemptId },
      data: {
        score: totalScore,
        ...(attempt.finishedAt ? {} : { finishedAt }),
      },
      select: {
        id: true,
        participantName: true,
        difficulty: true,
        score: true,
        startedAt: true,
        finishedAt: true,
      },
    });

    res.json({
      attempt: updated,
      summary: {
        totalScore,
        totalQuestions,
        answeredCount,
        correctCount,
        wrongCount: answeredCount - correctCount,
        hintsUsed,
        accuracy: answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0,
        correctByLevel: byLevel,
        alreadyFinished: Boolean(attempt.finishedAt),
      },
    });
  }),
);
