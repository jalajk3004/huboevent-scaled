import { NextResponse } from 'next/server';
// @ts-expect-error - paytmchecksum is not typed
import PaytmChecksum from 'paytmchecksum';
import { sendTicketEmail } from '@/lib/email';
import { supabase } from '@/lib/supabase';
import { sendWhatsAppTicket } from '@/lib/whatsapp';

export async function POST(req: Request) {
    try {
        let body: Record<string, any> = {};
        const contentType = req.headers.get("content-type") || "";

        if (contentType.includes("application/json")) {
            body = await req.json();
        } else if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
            const formData = await req.formData();
            body = Object.fromEntries(formData.entries()) as Record<string, string>;
        } else {
            const text = await req.text();
            try { body = JSON.parse(text); } catch { /* ignore */ }
        }

        const merchantKey = process.env.PAYTM_MERCHANT_KEY!;

        // Validate Paytm Webhook signature if possible, but the best approach 
        // is to use the v3 order status API to verify the order details from Paytm directly
        const { ORDERID, TXNID } = body;
        
        // Paytm might send order ID in 'ORDERID' or 'orderId'
        const orderId = ORDERID || body.orderId;

        if (!orderId) {
            return NextResponse.json({ success: false, message: "Missing Order ID" }, { status: 400 });
        }

        const mid = process.env.PAYTM_MID!;
        const host = process.env.PAYTM_HOST || 'https://securestage.paytmpayments.com';

        // 1. Server-Side Verification using v3 order status
        const paytmParams: any = {};
        paytmParams.body = {
            "mid": mid,
            "orderId": orderId,
        };

        const signature = await PaytmChecksum.generateSignature(JSON.stringify(paytmParams.body), merchantKey);
        paytmParams.head = { "signature": signature };

        const statusResponse = await fetch(`${host}/v3/order/status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(paytmParams)
        });

        const statusData = await statusResponse.json();
        const isSuccess = statusData?.body?.resultInfo?.resultStatus === 'TXN_SUCCESS';

        // 2. Fetch the existing record
        const { data: registration, error: fetchError } = await supabase
            .from('registrations')
            .select('*')
            .eq('id', orderId)
            .single();

        if (fetchError || !registration) {
            console.error("Webhook Error: No registration found for ORDERID:", orderId, fetchError);
            return NextResponse.json({ success: false, message: "Registration not found" }, { status: 404 });
        }

        // Check if it's already processed to avoid duplicate emails/updates
        if (registration.status === 'paid' && isSuccess) {
            return NextResponse.json({ success: true, message: "Webhook processed already" }, { status: 200 });
        }

        const amount = statusData?.body?.txnAmount || registration.amount || '0';
        const finalStatus = isSuccess ? 'paid' : 'failed';
        const paytmTxnId = statusData?.body?.txnId || TXNID || 'N/A';

        console.log(`Webhook: Recording payment for registration ${registration.id} with status: ${finalStatus}`);

        // 3. Record the payment attempt in the 'payments' table (Optional, for redundancy)
        const { data: existingPayment } = await supabase
            .from('payments')
            .select('id')
            .eq('registration_id', registration.id)
            .eq('paytm_payment_id', paytmTxnId)
            .single();
            
        if (!existingPayment) {
            await supabase
                .from('payments')
                .insert([{
                    registration_id: registration.id,
                    paytm_order_id: orderId,
                    paytm_payment_id: paytmTxnId,
                    amount: amount,
                    status: finalStatus
                }]);
        }

        // 4. Update the registration status
        console.log(`Webhook: Updating registration ${registration.id} status to: ${finalStatus}`);

        await supabase
            .from('registrations')
            .update({
                status: finalStatus,
                razorpay_order_id: orderId,
                razorpay_payment_id: paytmTxnId,
                amount: amount
            })
            .eq('id', registration.id);

        if (!isSuccess) {
            console.log("Webhook: Payment failed or pending, not sending tickets.");
            return NextResponse.json({ success: true, message: "Webhook received, payment not successful" });
        }

        // 5. Send Email & WhatsApp only on success
        const ticketData = {
            name: registration.name,
            email: registration.email,
            phone: registration.phone,
            event: registration.event,
            category: registration.category,
            type: registration.type,
        };

        try {
            const eventDetails: Record<string, { date: string, time: string, venue: string }> = {
                'neon-nights': { date: 'Oct 15, 2026', time: '08:00 PM', venue: 'Mumbai Arena' },
                'rhythm-project': { date: 'Nov 02, 2026', time: '07:00 PM', venue: 'Delhi State' },
                'midnight-sun': { date: 'Dec 31, 2026', time: '09:00 PM', venue: 'Goa Beach Club' }
            };

            const eventInfo = eventDetails[ticketData.event] || { date: 'TBD', time: 'TBD', venue: 'TBD' };

            await Promise.allSettled([
                sendTicketEmail(ticketData.email, ticketData, amount, registration.id),
                sendWhatsAppTicket(ticketData.phone, {
                    name: ticketData.name,
                    event: ticketData.event,
                    category: ticketData.category,
                    type: ticketData.type,
                    quantity: 1,
                    ticketId: registration.id,
                    paymentId: paytmTxnId,
                    amount: amount,
                    date: eventInfo.date,
                    time: eventInfo.time,
                    venue: eventInfo.venue
                })
            ]);
        } catch (msgErr) {
            console.error("Webhook Messaging error:", msgErr);
        }

        return NextResponse.json({ success: true, message: "Webhook processed successfully" }, { status: 200 });

    } catch (error) {
        console.error("Webhook Route Error:", error);
        return NextResponse.json({ success: false, message: "Webhook handler failed" }, { status: 500 });
    }
}
