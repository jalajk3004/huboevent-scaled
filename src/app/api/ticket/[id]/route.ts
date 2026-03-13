import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> } // In Next.js 14/15, params can be a Promise
) {
    try {
        const { id } = await params;

        if (!id) {
            return NextResponse.json({ success: false, message: "Ticket ID is required" }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('registrations')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) {
            console.error("Fetch Ticket Error:", error);
            return NextResponse.json({ success: false, message: "Ticket not found" }, { status: 404 });
        }

        // Do not leak sensitive payment IDs if this is public
        const { razorpay_order_id, razorpay_payment_id, ...safeData } = data;

        return NextResponse.json({
            success: true,
            ticket: safeData
        }, { status: 200 });

    } catch (error) {
        console.error("Ticket API Error:", error);
        return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
    }
}
