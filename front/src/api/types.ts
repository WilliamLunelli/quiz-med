export type Difficulty = 'facil' | 'media' | 'dificil' | 'mista';

export interface GameListItem {
  id: string;
  title: string;
  subjectTitle: string;
  groupName: string;
  createdAt: string;
}

export interface Game {
  id: string;
  title: string;
  groupName: string;
  subjectTitle: string;
  coverPhotoUrl: string | null;
  primaryColor: string;
  createdAt: string;
  questionCounts: Partial<Record<Difficulty, number>>;
}

/** Pergunta enviada ao participante — SEM gabarito nem fundamentação. */
export interface PlayQuestion {
  id: string;
  text: string;
  difficulty: Difficulty;
  hint: string | null;
  order: number;
}

export interface AttemptSummaryAttempt {
  id: string;
  gameId?: string;
  participantName: string;
  difficulty: Difficulty;
  score: number;
  startedAt: string;
  finishedAt: string | null;
}

export interface CreateAttemptResponse {
  attempt: AttemptSummaryAttempt;
  totalQuestions: number;
  questions: PlayQuestion[];
}

export interface AnswerResponse {
  isCorrect: boolean;
  pointsEarned: number;
  explanation: string;
  correctAnswer: boolean;
}

export interface FinishSummary {
  totalScore: number;
  totalQuestions: number;
  answeredCount: number;
  correctCount: number;
  wrongCount: number;
  hintsUsed: number;
  accuracy: number;
  correctByLevel: Record<string, { correct: number; answered: number }>;
  alreadyFinished: boolean;
}

export interface FinishResponse {
  attempt: AttemptSummaryAttempt;
  summary: FinishSummary;
}

export interface CreateQuestionInput {
  text: string;
  correctAnswer: boolean;
  difficulty: Difficulty;
  hint?: string | null;
  explanation: string;
  order?: number;
}

export interface CreateGamePayload {
  title: string;
  groupName?: string;
  subjectTitle: string;
  coverPhotoUrl?: string | null;
  primaryColor?: string;
  questions: CreateQuestionInput[];
}

export interface CreatedGame {
  id: string;
  title: string;
}
