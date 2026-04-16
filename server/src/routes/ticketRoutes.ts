import { Router } from 'express';
import { getTicket } from '../controllers/ticketController';

const router = Router();

router.get('/ticket/:id', getTicket);

export default router;
