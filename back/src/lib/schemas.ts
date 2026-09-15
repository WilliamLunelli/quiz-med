import { z } from 'zod';
import { DIFFICULTIES } from '../config/quiz';

const difficultySchema = z.enum(DIFFICULTIES);

export const createQuestionSchema = z.object({
  text: z.string().trim().min(1, 'Texto da pergunta é obrigatório.'),
  correctAnswer: z.boolean(),
  difficulty: difficultySchema,
  hint: z.string().trim().min(1).nullable().optional(),
  explanation: z.string().trim().min(1, 'Fundamentação (explanation) é obrigatória.'),
  order: z.number().int().min(0).optional().default(0),
});

export const createGameSchema = z.object({
  title: z.string().trim().min(1, 'Título é obrigatório.'),
  groupName: z.string().trim().default(''),
  subjectTitle: z.string().trim().min(1, 'Título da matéria é obrigatório.'),
  coverPhotoUrl: z.string().trim().url().nullable().optional(),
  primaryColor: z
    .string()
    .trim()
    .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Cor deve ser hexadecimal (ex: #162052).')
    .optional(),
  questions: z.array(createQuestionSchema).min(1, 'Envie ao menos uma pergunta.'),
});

export const difficultyQuerySchema = z.object({
  difficulty: difficultySchema,
});

export const createAttemptSchema = z.object({
  gameId: z.string().min(1, 'gameId é obrigatório.'),
  participantName: z.string().trim().min(1, 'Nome do participante é obrigatório.'),
  difficulty: difficultySchema,
});

export const submitAnswerSchema = z.object({
  questionId: z.string().min(1, 'questionId é obrigatório.'),
  answerGiven: z.boolean(),
  usedHint: z.boolean().optional().default(false),
});

export type CreateGameInput = z.infer<typeof createGameSchema>;
export type CreateAttemptInput = z.infer<typeof createAttemptSchema>;
export type SubmitAnswerInput = z.infer<typeof submitAnswerSchema>;
