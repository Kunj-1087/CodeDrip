import type { Request, Response, NextFunction, RequestHandler } from 'express';

// Wraps an async route handler so any rejected promise is forwarded to Express's
// error middleware instead of crashing the request. (express-async-errors also
// covers this globally; this keeps handler signatures explicit and typed.)
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}
