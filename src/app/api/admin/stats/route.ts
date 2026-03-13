import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyAdmin } from '@/lib/auth';

export async function GET() {
    try {
        const isAdmin = await verifyAdmin();
        if (!isAdmin) {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }

        const { data, error } = await supabase
            .from('registrations')
            .select('amount, type, category, status');

        if (error) {
            console.error("Supabase stats error:", error);
            return NextResponse.json({ success: false, message: "Database error" }, { status: 500 });
        }

        // Calculate stats client/edge side
        const totalRevenue = data.filter(d => d.status === 'paid').reduce((sum, d) => sum + Number(d.amount), 0);
        const totalTicketsSold = data.filter(d => d.status === 'paid').length;
        const totalRegistrations = data.length;

        const categoryCounts = data.reduce((acc, curr) => {
            acc[curr.category] = (acc[curr.category] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return NextResponse.json({
            success: true,
            stats: {
                totalRevenue,
                totalTicketsSold,
                totalRegistrations,
                categoryCounts
            }
        }, { status: 200 });

    } catch (error) {
        console.error("Stats API Error:", error);
        return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
    }
}
