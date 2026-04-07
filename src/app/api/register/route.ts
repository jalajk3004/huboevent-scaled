import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, email, phone, event, type, address, category, amount } = body;

        if (!name || !email || !phone || !event || !type || !address || !category || !amount) {
            return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('registrations')
            .insert([
                {
                    name,
                    email,
                    phone,
                    event,
                    type,
                    address,
                    category,
                    amount,
                    status: 'pending' // Initial status
                }
            ])
            .select('id')
            .single();

        if (error) {
            console.error("Supabase insert error:", error);
            return NextResponse.json({ success: false, message: "Database error" }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            id: data.id,
            message: "Registration created successfully"
        }, { status: 200 });

    } catch (error) {
        console.error("Register Error:", error);
        return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
    }
}
