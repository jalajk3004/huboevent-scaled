import Razorpay from 'razorpay';
import crypto from 'crypto';
import config from '../config/env';

const instance = new Razorpay({
  key_id: config.razorpay.keyId,
  key_secret: config.razorpay.keySecret,
});

/**
 * Creates a Razorpay order. Amount is in INR (rupees), converted to paise internally.
 */
export async function createRazorpayOrder(amountInRupees: number, receipt: string) {
  return instance.orders.create({
    amount: Math.round(amountInRupees * 100), // paise
    currency: 'INR',
    receipt,
  });
}

/**
 * Verifies the Razorpay payment signature returned in the checkout handler callback.
 */
export function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  const expected = crypto
    .createHmac('sha256', config.razorpay.keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

/**
 * Verifies the X-Razorpay-Signature header on incoming webhook events.
 */
export function verifyWebhookSignature(rawBody: Buffer | string, signature: string): boolean {
  if (!config.razorpay.webhookSecret) return false;
  const expected = crypto
    .createHmac('sha256', config.razorpay.webhookSecret)
    .update(rawBody)
    .digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}
