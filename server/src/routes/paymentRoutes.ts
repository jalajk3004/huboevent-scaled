import { Router } from 'express';
import { createOrder, verifyPayment, webhook } from '../controllers/paymentController';

const router = Router();

router.post('/create-order', createOrder);
router.post('/verify-payment', verifyPayment);
router.post('/webhook', webhook);

export default router;
