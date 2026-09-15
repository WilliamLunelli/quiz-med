/**
 * Regras de negócio centrais do quiz.
 * Todo cálculo de pontos acontece no servidor — o cliente nunca decide pontuação.
 */

export const DIFFICULTIES = ['facil', 'media', 'dificil', 'mista'] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export function isDifficulty(value: unknown): value is Difficulty {
  return typeof value === 'string' && (DIFFICULTIES as readonly string[]).includes(value);
}

/** Quantas perguntas cada nível deve ter (conjuntos fixos). */
export const QUESTIONS_PER_LEVEL = 10;

/** Pontuação cheia por dificuldade (acerto sem usar dica). */
export const FULL_POINTS: Record<Difficulty, number> = {
  facil: 10,
  media: 20,
  dificil: 30,
  mista: 20,
};

/**
 * Calcula os pontos de UMA resposta.
 * - Errar sempre vale 0 (com ou sem dica).
 * - Acertar sem dica vale a pontuação cheia.
 * - Acertar usando a dica vale metade (5 / 10 / 15 / 10).
 *
 * A dificuldade usada é a do NÍVEL ESCOLHIDO na tentativa (attempt.difficulty),
 * que é a chave da tabela de pontuação.
 */
export function computePoints(
  difficulty: Difficulty,
  isCorrect: boolean,
  usedHint: boolean,
): number {
  if (!isCorrect) return 0;
  const full = FULL_POINTS[difficulty];
  return usedHint ? Math.floor(full / 2) : full;
}
