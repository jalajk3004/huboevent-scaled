import { NextResponse } from 'next/server';
// @ts-expect-error - paytmchecksum is not typed
import PaytmChecksum from 'paytmchecksum';
import nodemailer from 'nodemailer';
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
            const transporter = nodemailer.createTransport({
                host: process.env.EMAIL_HOST || "smtp.gmail.com",
                port: parseInt(process.env.EMAIL_PORT || "587"),
                secure: false,
                auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
            });

            const mailOptions = {
                from: `"HubO Events" <${process.env.EMAIL_USER}>`,
                to: ticketData.email,
                subject: `Your Tickets for ${ticketData.event.replace('-', ' ').toUpperCase()} 🎉`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
                        <h1 style="color: #f70a7d; text-align: center;">HUBO EVENTS</h1>
                        <h2 style="text-align: center;">Payment Successful!</h2>
                        <p>Hi <b>${ticketData.name}</b>,</p>
                        <p>Your payment of <b>₹${amount}</b> was successful!</p>
                        <div style="background: #fdfdfd; padding: 15px; border-radius: 8px; margin-top: 20px; border: 1px dashed #ccc;">
                            <h3>Ticket Details</h3>
                            <p><b>Event:</b> ${ticketData.event.replace('-', ' ').toUpperCase()}</p>
                            <p><b>Category:</b> ${ticketData.category}</p>
                            <p><b>Type:</b> ${ticketData.type.toUpperCase()}</p>
                            <p><b>Ticket ID:</b> ${registration.id}</p>
                        </div>
                        <p style="margin-top: 30px;">Present this email at the venue entrance. See you there!</p>
                    </div>
                `
            };

            const eventDetails: Record<string, { date: string, time: string, venue: string }> = {
                'neon-nights': { date: 'Oct 15, 2026', time: '08:00 PM', venue: 'Mumbai Arena' },
                'rhythm-project': { date: 'Nov 02, 2026', time: '07:00 PM', venue: 'Delhi State' },
                'midnight-sun': { date: 'Dec 31, 2026', time: '09:00 PM', venue: 'Goa Beach Club' }
            };

            const eventInfo = eventDetails[ticketData.event] || { date: 'TBD', time: 'TBD', venue: 'TBD' };

            await Promise.allSettled([
                transporter.sendMail(mailOptions),
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
