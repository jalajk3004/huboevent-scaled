import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config/env';

export interface AdminRequest extends Request {
  admin?: { role: string };
  cookies: Record<string, string>;
}

/**
 * Verifies the admin_token JWT cookie.
 * Attaches decoded payload to req.admin on success.
 */
export function authMiddleware(
  req: AdminRequest,
  res: Response,
  next: NextFunction
): void {
  const token: string | undefined = req.cookies?.admin_token;

  if (!token) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret) as { role: string };

    if (decoded.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Forbidden' });
      return;
    }

    req.admin = decoded;
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}
