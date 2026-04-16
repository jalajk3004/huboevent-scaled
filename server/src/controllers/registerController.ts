import { Request, Response, NextFunction } from 'express';
import prisma from '../services/prismaService';

// ─────────────────────────────────────────────
// POST /api/register
// ─────────────────────────────────────────────
export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, email, phone, address, category, amount } = req.body as {
      name: string;
      email: string;
      phone: string;
      address: string;
      category: string;
      amount: number;
    };

    if (!name || !email || !phone || !address || !category || !amount) {
      res.status(400).json({ success: false, message: 'Missing required fields' });
      return;
    }

    const registration = await prisma.registration.create({
      data: { name, email, phone, address, category, amount, status: 'pending' },
      select: { id: true },
    });

    res.status(200).json({
      success: true,
      id: registration.id,
      message: 'Registration created successfully',
    });
  } catch (err) {
    next(err);
  }
}
