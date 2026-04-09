import { NextResponse } from 'next/server';
// @ts-expect-error - paytmchecksum is not typed
import PaytmChecksum from 'paytmchecksum';
import { supabase } from '@/lib/supabase';
import { sendWhatsAppTicket } from '@/lib/whatsapp';

export async function POST(req: Request) {
    try {
        let body: Record<string, string> = {};
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

        const { ORDERID, TXNID, RESPCODE, RESPMSG, CHECKSUMHASH, TXNAMOUNT } = body;
        const merchantKey = process.env.PAYTM_MERCHANT_KEY!;
        const mid = process.env.PAYTM_MID!;
        const host = process.env.PAYTM_HOST || 'https://securestage.paytmpayments.com';

        if (!ORDERID) {
            return NextResponse.redirect(new URL(`/checkout?payment=failed&msg=MissingOrderID`, req.url), { status: 303 });
        }

        // Server-Side Verification using v3 order status
        const paytmParams: any = {};
        paytmParams.body = {
            "mid": mid,
            "orderId": ORDERID,
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

        // 1. Fetch the existing record created during create-order
        const { data: registration, error: fetchError } = await supabase
            .from('registrations')
            .select('*')
            .eq('id', ORDERID)
            .single();

        if (fetchError || !registration) {
            console.error("No registration found for ORDERID:", ORDERID, fetchError);
            // Fallback: If for some reason the row is missing, handle gracefully
            return NextResponse.redirect(new URL(`/checkout?payment=failed&msg=RegistrationNotFound`, req.url), { status: 303 });
        }

        const ticketData = {
            name: registration.name,
            email: registration.email,
            phone: registration.phone,
            event: registration.event,
            category: registration.category,
            type: registration.type,
            aadhaar: registration.aadhaar,
            address: registration.address,
        };

        // 2. Record the payment attempt in the 'payments' table
        const amount = TXNAMOUNT || statusData?.body?.txnAmount || registration.amount || '0';
        const finalStatus = isSuccess ? 'paid' : 'failed';
        const paytmOrderId = ORDERID;
        const paytmTxnId = TXNID || statusData?.body?.txnId || 'N/A';

        console.log(`Recording payment for registration ${registration.id} with status: ${finalStatus}`);

        const { error: paymentInsertError } = await supabase
            .from('payments')
            .insert([{
                registration_id: registration.id,
                paytm_order_id: paytmOrderId,
                paytm_payment_id: paytmTxnId,
                amount: amount,
                status: finalStatus
            }]);

        if (paymentInsertError) {
            console.error("Failed to record payment entry:", JSON.stringify(paymentInsertError, null, 2));
            // We continue even if this fails, as updating the registration is more critical
        }

        // 3. Update the registration status
        console.log(`Updating registration ${registration.id} status to: ${finalStatus}`);

        const { error: updateError } = await supabase
            .from('registrations')
            .update({
                status: finalStatus,
                razorpay_order_id: paytmOrderId, // Keep for backward compatibility/dashboard
                razorpay_payment_id: paytmTxnId, // Keep for backward compatibility/dashboard
                amount: amount
            })
            .eq('id', registration.id);

        if (updateError) {
            console.error("Database Update Error (Registrations):", JSON.stringify(updateError, null, 2));
        } else {
            console.log("Registration updated successfully for ID:", registration.id);
        }

        if (!isSuccess) {
            const msg = statusData?.body?.resultInfo?.resultMsg || "Payment Failed";
            return NextResponse.redirect(new URL(`/checkout?payment=failed&msg=${encodeURIComponent(msg)}`, req.url), { status: 303 });
        }

        // Send Email & WhatsApp only on success
        try {
            // Venue lookup — keyed by event slug stored in DB
            const eventVenues: Record<string, string> = {
                'neon-nights':    'Mumbai Arena',
                'rhythm-project': 'Delhi State',
                'midnight-sun':   'Goa Beach Club',
                'dhurandhar':     'TBD',   // update when venue is confirmed
            };

            const venue = eventVenues[ticketData.event] || 'TBD';

            await sendWhatsAppTicket(ticketData.phone, {
                name:     ticketData.name,
                event:    ticketData.event,
                ticketId: registration.id,
                venue,
            });
        } catch (msgErr) {
            console.error("Messaging error:", msgErr);
        }

        return NextResponse.redirect(new URL(`/checkout?payment=success`, req.url), { status: 303 });

    } catch (error) {
        console.error("Verify Payment Error:", error);
        return NextResponse.redirect(new URL(`/checkout?payment=error`, req.url), { status: 303 });
    }
}
