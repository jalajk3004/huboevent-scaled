import { NextResponse } from 'next/server';
// @ts-expect-error - paytmchecksum is not typed
import PaytmChecksum from 'paytmchecksum';
import nodemailer from 'nodemailer';
import { supabase } from '@/lib/supabase';
import { sendWhatsAppTicket } from '@/lib/whatsapp';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const {
            ORDERID,
            TXNID,
            RESPCODE,
            RESPMSG,
            CHECKSUMHASH,
            ticketData,
            registrationId,
            amount
        } = body;

        const merchantKey = process.env.PAYTM_MERCHANT_KEY;

        if (!merchantKey) {
            console.error("PAYTM_MERCHANT_KEY is not defined in environment variables.");
            return NextResponse.json({ success: false, message: "Server configuration error" }, { status: 500 });
        }

        // We only want to verify the checksum against the parameters returned by Paytm, excluding CHECKSUMHASH and frontend-injected data
        const paytmParams: Record<string, string> = {};
        for (const key in body) {
            if (key !== 'CHECKSUMHASH' && key !== 'ticketData' && key !== 'registrationId' && key !== 'amount') {
                paytmParams[key] = body[key];
            }
        }

        const isVerifySignature = PaytmChecksum.verifySignature(paytmParams, merchantKey, CHECKSUMHASH);
        
        if (!isVerifySignature) {
            console.warn("Invalid Paytm signature provided.");
            return NextResponse.json({ success: false, message: "Invalid payment signature" }, { status: 400 });
        }

        if (RESPCODE !== '01') {
            console.log(`[VERIFY] Payment Failed or Pending for Order: ${ORDERID}. Status: ${RESPMSG}`);
            return NextResponse.json({ success: false, message: `Payment failed: ${RESPMSG}` }, { status: 400 });
        }

        console.log(`[VERIFY] Signature valid and Payment Successful for TXNID: ${TXNID}. Proceeding to update DB.`);

        // Update database status
        let ticketId = 'TICKET_NOT_FOUND';
        if (registrationId) {
            const { error: updateError } = await supabase
                .from('registrations')
                .update({
                    status: 'confirmed',
                    razorpay_order_id: ORDERID, // Keeping existing DB column name to avoid migration
                    razorpay_payment_id: TXNID
                })
                .eq('id', registrationId);

            if (updateError) {
                console.error("Failed to update database record:", updateError);
                // Depending on requirements, we can still proceed to send email or fail
            } else {
                ticketId = registrationId; // The ID from the database acts as the ticket ID
            }
        }

        // Configure Nodemailer
        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST || "smtp.gmail.com",
            port: parseInt(process.env.EMAIL_PORT || "587"),
            secure: false, // true for 465, false for other ports
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        // HTML Email Template
        const mailOptions = {
            from: `"HubO Events" <${process.env.EMAIL_USER}>`,
            to: ticketData.email,
            subject: `Your Tickets for ${ticketData.event.replace('-', ' ').toUpperCase()} 🎉`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
                    <h1 style="color: #f70a7d; text-align: center;">HUBO EVENTS</h1>
                    <h2 style="text-align: center;">Payment Successful!</h2>
                    <p>Hi <b>${ticketData.name}</b>,</p>
                    <p>Thank you for booking with HubO Events. Your payment of <b>₹${amount}</b> was successful!</p>
                    
                    <div style="background: #fdfdfd; padding: 15px; border-radius: 8px; margin-top: 20px; border: 1px dashed #ccc;">
                        <h3 style="margin-top: 0; color: #333;">Ticket Details</h3>
                        <p><b>Event:</b> ${ticketData.event.replace('-', ' ').toUpperCase()}</p>
                        <p><b>Category:</b> ${ticketData.category}</p>
                        <p><b>Type:</b> ${ticketData.type.toUpperCase()}</p>
                        <p><b>Quantity:</b> 1</p>
                        <p><b>Ticket ID:</b> ${ticketId}</p>
                        <p><b>Payment ID:</b> ${TXNID}</p>
                    </div>

                    <p style="margin-top: 30px;">Present this email at the venue entrance. See you at the event!</p>
                    <div style="text-align: center; margin-top: 40px; color: #888; font-size: 12px;">
                        &copy; ${new Date().getFullYear()} HubO Events. All rights reserved.
                    </div>
                </div>
            `
        };

        // Attempt to send email and WhatsApp
        try {
            // Run email and WhatsApp concurrently
            await Promise.allSettled([
                transporter.sendMail(mailOptions)
                    .then(() => console.log(`[EMAIL] Successfully sent ticket to ${ticketData.email}`))
                    .catch((err) => console.error("Failed to send email. Ensure EMAIL credentials are correct in .env.local:", err)),
                
                sendWhatsAppTicket(ticketData.phone, {
                    name: ticketData.name,
                    event: ticketData.event,
                    category: ticketData.category,
                    type: ticketData.type,
                    quantity: 1,
                    ticketId: ticketId,
                    paymentId: TXNID,
                    amount: amount
                })
            ]);
        } catch (messagingError) {
            console.error("Error during messaging dispatch:", messagingError);
            // We still return success: true because the payment was verified, but the email failed.
            // In a robust system, you might queue this or return a warning.
        }

        return NextResponse.json({ success: true, message: "Payment verified successfully" }, { status: 200 });

    } catch (error) {
        console.error("Payment Verification Error:", error);
        return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
    }
}
