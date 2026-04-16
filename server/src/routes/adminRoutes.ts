import { Router } from 'express';
import { login, logout, getStats, getUsers, resendTicket } from '../controllers/adminController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

// Public admin routes
router.post('/admin/login', login);
router.post('/admin/logout', logout);

// Protected admin routes — require valid admin_token cookie
router.get('/admin/stats', authMiddleware, getStats);
router.get('/admin/users', authMiddleware, getUsers);
router.post('/admin/resend-ticket', authMiddleware, resendTicket);

export default router;
