import { NextResponse } from "next/server";
import { verifyEmailAddress } from "@/lib/email";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        console.log("[API /verifyemailaddress] Received body:", body);
        const { email } = body;

        if (!email) {
            return NextResponse.json({ success: false, message: "Email is required" }, { status: 400 });
        }

        await verifyEmailAddress(email);

        return NextResponse.json({ 
            success: true, 
            message: `Verification email sent to ${email}. Please check your inbox and click the verification link.` 
        });
    } catch (error: any) {
        console.error("SES Verify Email Error:", error);
        return NextResponse.json({ success: false, message: error.message || "Failed to verify email address" }, { status: 500 });
    }
}
