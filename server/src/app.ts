import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import config from './config/env';

// Routes
import paymentRoutes from './routes/paymentRoutes';
import registerRoutes from './routes/registerRoutes';
import ticketRoutes from './routes/ticketRoutes';
import adminRoutes from './routes/adminRoutes';

// Error handler (must be last)
import { errorHandler } from './middlewares/errorHandler';

const app: Application = express();

// ─── CORS ────────────────────────────────────────────────────────────────────
// Allow the Next.js frontend origin; credentials required for cookie-based auth
app.use(
  cors({
    origin: [
      'https://huboevents.in',
      'https://www.huboevents.in',
      'https://jayykayy.sbs',
      'https://www.jayykayy.sbs',
      'https://d2ve7lnplnj6nc.cloudfront.net',
      'http://localhost:3000'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ─── Body Parsers ─────────────────────────────────────────────────────────────
// Raw body for Razorpay webhook signature verification (must come before json())
app.use('/api/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Cookie Parser ────────────────────────────────────────────────────────────
app.use(cookieParser());

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', env: config.nodeEnv, timestamp: new Date().toISOString() });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api', paymentRoutes);
app.use('/api', registerRoutes);
app.use('/api', ticketRoutes);
app.use('/api', adminRoutes);

// ─── 404 fallthrough ──────────────────────────────────────────────────────────
app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ─── Centralized Error Handler (must be last) ─────────────────────────────────
app.use(errorHandler);

export default app;
