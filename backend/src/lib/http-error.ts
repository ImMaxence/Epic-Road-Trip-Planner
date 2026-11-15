export class HttpError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(status: number, code: string, message?: string, details?: unknown) {
    super(message ?? code);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const badRequest = (code: string, details?: unknown) => new HttpError(400, code, code, details);
export const unauthorized = (code = "unauthorized") => new HttpError(401, code);
export const forbidden = (code = "forbidden") => new HttpError(403, code);
export const notFound = (code = "not_found") => new HttpError(404, code);
export const conflict = (code: string) => new HttpError(409, code);
export const tooMany = (code: string) => new HttpError(429, code);
export const unavailable = (code: string) => new HttpError(503, code);
