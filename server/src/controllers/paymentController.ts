import { Request, Response, NextFunction } from 'express';
import prisma from '../services/prismaService';
import { initiateTransaction, verifyOrderStatus } from '../services/paytmService';
import { sendWhatsAppTicket } from '../services/whatsappService';
import config from '../config/env';

// ─────────────────────────────────────────────
// POST /api/create-order
// ─────────────────────────────────────────────
export async function createOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { amount, ticketData } = req.body as {
      amount: number;
      ticketData: { name: string; email: string; phone: string; address?: string; category?: string };
    };

    if (!amount || isNaN(amount) || amount <= 0) {
      res.status(400).json({ success: false, message: 'Invalid amount' });
      return;
    }

    if (!ticketData?.email || !ticketData?.phone) {
      res.status(400).json({ success: false, message: 'Missing user details' });
      return;
    }

    const tempId = Math.random().toString(36).substring(2, 10).toUpperCase();
    const friendlyTicketId = `HB-${tempId}`;
    const orderId = `ORD_${tempId}_${Date.now()}`;

    await prisma.registration.create({
      data: {
        name: ticketData.name,
        email: ticketData.email,
        phone: ticketData.phone,
        address: ticketData.address ?? 'NA',
        category: ticketData.category ?? 'NA',
        amount,
        status: 'initiated',
        paytm_order_id: orderId,
        paytm_payment_id: friendlyTicketId,
      },
    });

    // Callback points back to THIS Express server
    const callbackUrl = `${req.protocol}://${req.get('host')}/api/verify-payment`;

    const { txnToken, mid, host } = await initiateTransaction({
      orderId,
      amount,
      callbackUrl,
      userInfo: {
        custId: ticketData.email.replace(/[^a-zA-Z0-9]/g, '_'),
        mobile: ticketData.phone,
        email: ticketData.email,
      },
    });

    res.status(200).json({ success: true, orderId, txnToken, mid, amount: amount.toString(), host });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────
// POST /api/verify-payment  (Paytm form-POST callback)
// ─────────────────────────────────────────────
export async function verifyPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = req.body as Record<string, string>;
    const { ORDERID, TXNID, TXNAMOUNT } = body;
    const frontendUrl = config.frontendUrl;

    if (!ORDERID) {
      res.redirect(303, `${frontendUrl}/checkout?payment=failed&msg=MissingOrderID`);
      return;
    }

    const { isSuccess, txnId, txnAmount, resultMsg } = await verifyOrderStatus(ORDERID);

    const registration = await prisma.registration.findUnique({
      where: { paytm_order_id: ORDERID },
    });

    if (!registration) {
      console.error('[verifyPayment] No registration for ORDERID:', ORDERID);
      res.redirect(303, `${frontendUrl}/checkout?payment=failed&msg=RegistrationNotFound`);
      return;
    }

    const amount = parseFloat(TXNAMOUNT || txnAmount || registration.amount.toString() || '0');
    const finalStatus = isSuccess ? 'paid' : 'failed';
    const paytmTxnId = TXNID || txnId;

    await prisma.payment.create({
      data: {
        registration_id: registration.id,
        paytm_order_id: ORDERID,
        paytm_payment_id: paytmTxnId ?? null,
        amount,
        status: finalStatus,
      },
    }).catch((err: unknown) => console.error('[verifyPayment] Payment insert error:', err));

    await prisma.registration.update({
      where: { id: registration.id },
      data: { status: finalStatus, amount },
    });

    if (!isSuccess) {
      res.redirect(303, `${frontendUrl}/checkout?payment=failed&msg=${encodeURIComponent(resultMsg)}`);
      return;
    }

    // Fire WhatsApp on success (non-blocking)
    sendWhatsAppTicket(registration.phone, {
      name: registration.name,
      event: 'dhurandhar',
      ticketId: registration.paytm_payment_id ?? registration.id,
      venue: 'lajpat',
    }).catch((msgErr: unknown) => console.error('[verifyPayment] WhatsApp error:', msgErr));

    res.redirect(303, `${frontendUrl}/checkout?payment=success`);
  } catch (err) {
    const frontendUrl = config.frontendUrl;
    console.error('[verifyPayment] Unexpected error:', err);
    res.redirect(303, `${frontendUrl}/checkout?payment=error`);
  }
}

// ─────────────────────────────────────────────
// POST /api/webhook  (Paytm server-to-server)
// ─────────────────────────────────────────────
export async function webhook(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = req.body as Record<string, string>;
    const { ORDERID, TXNID } = body;
    const orderId = ORDERID ?? body.orderId;

    if (!orderId) {
      res.status(400).json({ success: false, message: 'Missing Order ID' });
      return;
    }

    const { isSuccess, txnId, txnAmount } = await verifyOrderStatus(orderId);

    const registration = await prisma.registration.findUnique({
      where: { paytm_order_id: orderId },
    });

    if (!registration) {
      console.error('[webhook] No registration for ORDERID:', orderId);
      res.status(404).json({ success: false, message: 'Registration not found' });
      return;
    }

    if (registration.status === 'paid' && isSuccess) {
      res.status(200).json({ success: true, message: 'Webhook already processed' });
      return;
    }

    const amount = parseFloat(txnAmount || registration.amount.toString() || '0');
    const finalStatus = isSuccess ? 'paid' : 'failed';
    const paytmTxnId = txnId || TXNID || 'N/A';

    const existingPayment = await prisma.payment.findFirst({
      where: {
        registration_id: registration.id,
        paytm_payment_id: paytmTxnId,
      },
      select: { id: true },
    });

    if (!existingPayment) {
      await prisma.payment.create({
        data: {
          registration_id: registration.id,
          paytm_order_id: orderId,
          paytm_payment_id: paytmTxnId,
          amount,
          status: finalStatus,
        },
      });
    }

    await prisma.registration.update({
      where: { id: registration.id },
      data: { status: finalStatus, amount },
    });

    if (isSuccess) {
      sendWhatsAppTicket(registration.phone, {
        name: registration.name,
        event: 'dhurandhar',
        ticketId: registration.paytm_payment_id ?? registration.id,
        venue: 'TBD',
      }).catch((msgErr: unknown) => console.error('[webhook] WhatsApp error:', msgErr));
    }

    res.status(200).json({ success: true, message: 'Webhook processed successfully' });
  } catch (err) {
    next(err);
  }
}
