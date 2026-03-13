import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyAdmin } from '@/lib/auth';
import nodemailer from 'nodemailer';
import { sendWhatsAppTicket } from '@/lib/whatsapp';

export async function POST(req: Request) {
    try {
        const isAdmin = await verifyAdmin();
        if (!isAdmin) {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { registrationId } = body;

        if (!registrationId) {
            return NextResponse.json({ success: false, message: "Registration ID is required" }, { status: 400 });
        }

        const { data: user, error } = await supabase
            .from('registrations')
            .select('*')
            .eq('id', registrationId)
            .single();

        if (error || !user) {
            return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
        }

        if (user.status !== 'paid') {
            return NextResponse.json({ success: false, message: "Cannot send ticket for unpaid registration" }, { status: 400 });
        }

        // Configure Nodemailer
        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST || "smtp.gmail.com",
            port: parseInt(process.env.EMAIL_PORT!),
            secure: false,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        // HTML Email Template
        const mailOptions = {
            from: `"HubO Events" <${process.env.EMAIL_USER}>`,
            to: user.email,
            subject: `[RESEND] Your Tickets for ${user.event.replace('-', ' ').toUpperCase()} 🎉`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
                    <h1 style="color: #f70a7d; text-align: center;">HUBO EVENTS</h1>
                    <h2 style="text-align: center;">Here is your ticket!</h2>
                    <p>Hi <b>${user.name}</b>,</p>
                    <p>This is a resent ticket confirmation for your booking.</p>
                    
                    <div style="background: #fdfdfd; padding: 15px; border-radius: 8px; margin-top: 20px; border: 1px dashed #ccc;">
                        <h3 style="margin-top: 0; color: #333;">Ticket Details</h3>
                        <p><b>Event:</b> ${user.event.replace('-', ' ').toUpperCase()}</p>
                        <p><b>Category:</b> ${user.category}</p>
                        <p><b>Type:</b> ${user.type.toUpperCase()}</p>
                        <p><b>Quantity:</b> ${user.quantity}</p>
                        <p><b>Ticket ID:</b> ${user.id}</p>
                        <p><b>Payment ID:</b> ${user.razorpay_payment_id || 'N/A'}</p>
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
                    .then(() => console.log(`[EMAIL] Successfully resent ticket to ${user.email}`))
                    .catch((err) => console.error("Failed to resend email:", err)),
                
                sendWhatsAppTicket(user.phone, {
                    name: user.name,
                    event: user.event,
                    category: user.category,
                    type: user.type,
                    quantity: user.quantity,
                    ticketId: user.id,
                    paymentId: user.razorpay_payment_id || 'N/A',
                    amount: user.amount || 'N/A' // fallback if amount isn't saved directly in registrations table
                })
            ]);
        } catch (messagingError) {
            console.error("Error during resending messaging dispatch:", messagingError);
        }

        return NextResponse.json({
            success: true,
            message: "Ticket resent successfully"
        }, { status: 200 });

    } catch (error) {
        console.error("Resend Ticket API Error:", error);
        return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
    }
}
