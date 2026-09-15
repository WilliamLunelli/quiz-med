import type {
  AnswerResponse,
  CreateAttemptResponse,
  CreatedGame,
  CreateGamePayload,
  Difficulty,
  FinishResponse,
  Game,
  GameListItem,
} from './types';

/**
 * Base da API. Se VITE_API_URL estiver vazia, usamos caminho relativo (/api),
 * servido pelo proxy do Vite em dev. Em produção, defina VITE_API_URL.
 */
const BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      headers: options?.body ? { 'content-type': 'application/json' } : undefined,
      ...options,
    });
  } catch {
    throw new ApiError(0, 'Não foi possível conectar ao servidor.');
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const message =
      (data && typeof data.error === 'string' && data.error) ||
      `Erro ${res.status} ao chamar a API.`;
    throw new ApiError(res.status, message);
  }
  return data as T;
}

export const api = {
  listGames: () => request<{ count: number; games: GameListItem[] }>('/api/games'),

  getGame: (id: string) => request<Game>(`/api/games/${id}`),

  createGame: (body: CreateGamePayload) =>
    request<CreatedGame>('/api/games', { method: 'POST', body: JSON.stringify(body) }),

  createAttempt: (body: { gameId: string; participantName: string; difficulty: Difficulty }) =>
    request<CreateAttemptResponse>('/api/attempts', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  submitAnswer: (
    attemptId: string,
    body: { questionId: string; answerGiven: boolean; usedHint: boolean },
  ) =>
    request<AnswerResponse>(`/api/attempts/${attemptId}/answers`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  finishAttempt: (attemptId: string) =>
    request<FinishResponse>(`/api/attempts/${attemptId}/finish`, { method: 'POST' }),
};
