import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../services/prismaService';
import { sendWhatsAppTicket } from '../services/whatsappService';
import config from '../config/env';

const IS_PRODUCTION = config.nodeEnv === 'production';

// ─────────────────────────────────────────────
// POST /api/admin/login
// ─────────────────────────────────────────────
export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = req.body as { email: string; password: string };

    if (email !== config.admin.email || password !== config.admin.password) {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
      return;
    }

    const token = jwt.sign({ role: 'admin' }, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn as any,
    });

    res.cookie('admin_token', token, {
      httpOnly: true,
      secure: IS_PRODUCTION,
      sameSite: IS_PRODUCTION ? 'none' : 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 1000, // 1 day ms
    });

    res.status(200).json({ success: true, message: 'Login successful' });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────
// POST /api/admin/logout
// ─────────────────────────────────────────────
export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.cookie('admin_token', '', {
      httpOnly: true,
      secure: IS_PRODUCTION,
      sameSite: IS_PRODUCTION ? 'none' : 'lax',
      path: '/',
      maxAge: 0,
    });
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────
// GET /api/admin/stats  [protected]
// ─────────────────────────────────────────────
export async function getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const [registrations, payments] = await Promise.all([
      prisma.registration.findMany({
        select: { amount: true, category: true, status: true },
      }),
      prisma.payment.findMany({
        where: { status: 'paid' },
        select: { amount: true, status: true },
      }),
    ]);

    const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const totalTicketsSold = payments.length;
    const totalRegistrations = registrations.length;

    const categoryCounts = registrations.reduce((acc: Record<string, number>, curr) => {
      acc[curr.category] = (acc[curr.category] ?? 0) + 1;
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      stats: { totalRevenue, totalTicketsSold, totalRegistrations, categoryCounts },
    });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────
// GET /api/admin/users  [protected]
// ─────────────────────────────────────────────
export async function getUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const users = await prisma.registration.findMany({
      orderBy: { created_at: 'desc' },
      include: {
        payments: {
          select: { paytm_payment_id: true, status: true, amount: true },
        },
      },
    });

    res.status(200).json({ success: true, users });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────
// POST /api/admin/resend-ticket  [protected]
// ─────────────────────────────────────────────
export async function resendTicket(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { registrationId } = req.body as { registrationId: string };

    if (!registrationId) {
      res.status(400).json({ success: false, message: 'Registration ID is required' });
      return;
    }

    const user = await prisma.registration.findUnique({
      where: { id: registrationId },
    });

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    if (user.status !== 'paid') {
      res.status(400).json({ success: false, message: 'Cannot send ticket for unpaid registration' });
      return;
    }

    await Promise.allSettled([
      sendWhatsAppTicket(user.phone, {
        name: user.name,
        event: 'dhurandhar',
        category: user.category,
        ticketId: user.ticket_id ?? user.paytm_payment_id ?? user.id,
        paymentId: user.paytm_payment_id ?? 'N/A',
        amount: user.amount?.toString() ?? 'N/A',
      }),
    ]);

    res.status(200).json({ success: true, message: 'Ticket resent successfully' });
  } catch (err) {
    next(err);
  }
}
