import { Request, Response, NextFunction } from 'express';

/**
 * Centralized Express error handler.
 * Must be the LAST middleware registered in app.ts.
 */
export function errorHandler(
  err: Error & { status?: number; statusCode?: number },
  req: Request,
  res: Response,
  // next is required by Express for error handler signature even if unused
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  const status = err.status ?? err.statusCode ?? 500;
  const message = err.message ?? 'Internal Server Error';

  console.error(`[ERROR] ${req.method} ${req.url} →`, err);

  res.status(status).json({ success: false, message });
}
