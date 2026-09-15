/** Erro de aplicação com status HTTP, tratado pelo middleware central. */
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const badRequest = (msg: string, details?: unknown) => new AppError(400, msg, details);
export const notFound = (msg: string) => new AppError(404, msg);
export const conflict = (msg: string) => new AppError(409, msg);
