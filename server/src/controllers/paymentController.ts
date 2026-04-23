import { Request, Response, NextFunction } from 'express';
import prisma from '../services/prismaService';
import { createRazorpayOrder, verifyPaymentSignature, verifyWebhookSignature } from '../services/razorpayService';
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
    const receipt = `ORD_${tempId}_${Date.now()}`;
    const friendlyTicketId = `HB-${tempId}`;

    const razorpayOrder = await createRazorpayOrder(amount, receipt);

    await prisma.registration.create({
      data: {
        name: ticketData.name,
        email: ticketData.email,
        phone: ticketData.phone,
        address: ticketData.address ?? 'NA',
        category: ticketData.category ?? 'NA',
        amount,
        status: 'initiated',
        paytm_order_id: razorpayOrder.id,   // stores razorpay order id
        ticket_id: friendlyTicketId,        // permanent friendly ticket ID (HB-XXXXXXXX)
      },
    });

    res.status(200).json({
      success: true,
      orderId: razorpayOrder.id,
      key: config.razorpay.keyId,
      amount: razorpayOrder.amount, // in paise
    });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────
// POST /api/verify-payment  (called from client after Razorpay modal success)
// ─────────────────────────────────────────────
export async function verifyPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body as {
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
    };

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      res.status(400).json({ success: false, message: 'Missing payment details' });
      return;
    }

    const isValid = verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);

    if (!isValid) {
      res.status(400).json({ success: false, message: 'Invalid payment signature' });
      return;
    }

    const registration = await prisma.registration.findUnique({
      where: { paytm_order_id: razorpay_order_id },
    });

    if (!registration) {
      res.status(404).json({ success: false, message: 'Registration not found' });
      return;
    }

    await prisma.payment.create({
      data: {
        registration_id: registration.id,
        paytm_order_id: razorpay_order_id,
        paytm_payment_id: razorpay_payment_id,
        amount: registration.amount,
        status: 'paid',
      },
    }).catch((err: unknown) => console.error('[verifyPayment] Payment insert error:', err));

    await prisma.registration.update({
      where: { id: registration.id },
      data: { status: 'paid', paytm_payment_id: razorpay_payment_id },
    });

    // Fire WhatsApp on success (non-blocking)
    sendWhatsAppTicket(registration.phone, {
      name: registration.name,
      event: 'dhurandhar',
      ticketId: registration.ticket_id ?? razorpay_payment_id,
      venue: 'Pitampura',
    }).catch((msgErr: unknown) => console.error('[verifyPayment] WhatsApp error:', msgErr));

    res.status(200).json({ success: true, message: 'Payment verified successfully' });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────
// POST /api/webhook  (Razorpay server-to-server, raw body required)
// ─────────────────────────────────────────────
export async function webhook(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const signature = req.headers['x-razorpay-signature'] as string | undefined;

    if (!signature) {
      res.status(400).json({ success: false, message: 'Missing signature header' });
      return;
    }

    const isValid = verifyWebhookSignature(req.body as Buffer, signature);

    if (!isValid) {
      res.status(400).json({ success: false, message: 'Invalid webhook signature' });
      return;
    }

    const event = JSON.parse((req.body as Buffer).toString()) as {
      event: string;
      payload: { payment: { entity: { order_id: string; id: string; amount: number } } };
    };

    if (event.event === 'payment.captured') {
      const { order_id, id: paymentId, amount } = event.payload.payment.entity;

      const registration = await prisma.registration.findUnique({
        where: { paytm_order_id: order_id },
      });

      // Acknowledge even if registration not found — avoid Razorpay retries
      if (!registration || registration.status === 'paid') {
        res.status(200).json({ success: true });
        return;
      }

      const existingPayment = await prisma.payment.findFirst({
        where: { registration_id: registration.id, paytm_payment_id: paymentId },
        select: { id: true },
      });

      if (!existingPayment) {
        await prisma.payment.create({
          data: {
            registration_id: registration.id,
            paytm_order_id: order_id,
            paytm_payment_id: paymentId,
            amount: amount / 100, // paise → rupees
            status: 'paid',
          },
        });
      }

      await prisma.registration.update({
        where: { id: registration.id },
        data: { status: 'paid', paytm_payment_id: paymentId },
      });

      sendWhatsAppTicket(registration.phone, {
        name: registration.name,
        event: 'dhurandhar',
        ticketId: registration.ticket_id ?? paymentId,
        venue: 'TBD',
      }).catch((msgErr: unknown) => console.error('[webhook] WhatsApp error:', msgErr));
    }

    res.status(200).json({ success: true });
  } catch (err) {
    next(err);
  }
}
