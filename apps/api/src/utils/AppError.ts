// Operational error with an HTTP status. Thrown deliberately by handlers/
// services for expected failures (404, 401, 409, ...). The errorHandler maps
// these to clean JSON responses; anything that is NOT an AppError is treated as
// an unexpected 500 and its details are hidden from the client.
export class AppError extends Error {
  readonly statusCode: number;
  readonly details?: unknown;

  constructor(statusCode: number, message: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.name = 'AppError';
  }

  static badRequest(message: string, details?: unknown) {
    return new AppError(400, message, details);
  }
  static unauthorized(message = 'Authentication required') {
    return new AppError(401, message);
  }
  static forbidden(message = 'You do not have access to this resource') {
    return new AppError(403, message);
  }
  static notFound(message = 'Resource not found') {
    return new AppError(404, message);
  }
  static conflict(message: string) {
    return new AppError(409, message);
  }
}
