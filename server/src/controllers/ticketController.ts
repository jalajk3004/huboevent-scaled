import { Request, Response, NextFunction } from 'express';
import prisma from '../services/prismaService';

// ─────────────────────────────────────────────
// GET /api/ticket/:id
// ─────────────────────────────────────────────
export async function getTicket(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id as string;

    if (!id) {
      res.status(400).json({ success: false, message: 'Ticket ID is required' });
      return;
    }

    const ticket = await prisma.registration.findUnique({
      where: { id },
    });

    if (!ticket) {
      res.status(404).json({ success: false, message: 'Ticket not found' });
      return;
    }

    res.status(200).json({ success: true, ticket });
  } catch (err) {
    next(err);
  }
}
