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
        // We now look up by razorpay_order_id because the ORDERID coming from Paytm 
        // matches the one we generated and stored there.
        const { data: registration, error: fetchError } = await supabase
            .from('registrations')
            .select('*')
            .eq('paytm_order_id', ORDERID)
            .single();

        if (fetchError || !registration) {
            console.error("No registration found for ORDERID:", ORDERID, fetchError);
            return NextResponse.redirect(new URL(`/checkout?payment=failed&msg=RegistrationNotFound`, req.url), { status: 303 });
        }

        const ticketData = {
            name: registration.name,
            email: registration.email,
            phone: registration.phone,
            event: 'dhurandhar',
            category: registration.category,
            address: registration.address,
            friendlyTicketId: registration.paytm_payment_id // This stored our HB-XXXX ID
        };

        // 2. Record the payment attempt in the 'payments' table
        const amount = TXNAMOUNT || statusData?.body?.txnAmount || registration.amount || '0';
        const finalStatus = isSuccess ? 'paid' : 'failed';
        const paytmTxnId = TXNID || statusData?.body?.txnId || 'N/A';

        console.log(`Recording payment for registration ${registration.id} with status: ${finalStatus}`);

        const { error: paymentInsertError } = await supabase
            .from('payments')
            .insert([{
                registration_id: registration.id,
                paytm_order_id: ORDERID,
                paytm_payment_id: paytmTxnId,
                amount: amount,
                status: finalStatus
            }]);

        if (paymentInsertError) {
            console.error("Failed to record payment entry:", JSON.stringify(paymentInsertError, null, 2));
        }

        // 3. Update the registration status
        console.log(`Updating registration ${registration.id} status to: ${finalStatus}`);

        const { error: updateError } = await supabase
            .from('registrations')
            .update({
                status: finalStatus,
                amount: amount
            })
            .eq('id', registration.id);

        if (updateError) {
            console.error("Database Update Error (Registrations):", JSON.stringify(updateError, null, 2));
        }

        if (!isSuccess) {
            const msg = statusData?.body?.resultInfo?.resultMsg || "Payment Failed";
            return NextResponse.redirect(new URL(`/checkout?payment=failed&msg=${encodeURIComponent(msg)}`, req.url), { status: 303 });
        }

        // Send WhatsApp only on success
        try {
            await sendWhatsAppTicket(ticketData.phone, {
                name:     ticketData.name,
                event:    'dhurandhar',
                ticketId: ticketData.friendlyTicketId || registration.id,
                venue:    'lajpat',
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
