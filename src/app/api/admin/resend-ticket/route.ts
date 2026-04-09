import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyAdmin } from '@/lib/auth';
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

        // Attempt to send WhatsApp
        try {
            // Run WhatsApp concurrently
            await Promise.allSettled([
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
