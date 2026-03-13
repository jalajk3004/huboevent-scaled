import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const ADMIN_EMAIL = 'jalajkumar23989@gmail.com';
const ADMIN_PASSWORD = 'jalaj';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { email, password } = body;

        if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
            return NextResponse.json({ success: false, message: "Invalid credentials" }, { status: 401 });
        }

        const secret = process.env.JWT_SECRET || 'fallback_secret_for_development';
        const token = jwt.sign({ role: 'admin' }, secret, { expiresIn: '1d' });

        const response = NextResponse.json({ success: true, message: "Login successful" }, { status: 200 });

        // Set HTTP-only cookie
        response.cookies.set({
            name: 'admin_token',
            value: token,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/',
            maxAge: 60 * 60 * 24 // 1 day
        });

        return response;

    } catch (error) {
        console.error("Login Error:", error);
        return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
    }
}
