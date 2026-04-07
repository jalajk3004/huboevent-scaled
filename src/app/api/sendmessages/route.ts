import { NextResponse } from "next/server";
import { sendTestMessage } from "@/lib/email";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        console.log("[API /sendmessages] Received body:", body);
        const { toEmail, subject, message } = body;

        if (!toEmail || !subject || !message) {
            return NextResponse.json({ success: false, message: "toEmail, subject, and message are required" }, { status: 400 });
        }

        await sendTestMessage(toEmail, subject, message);

        return NextResponse.json({ 
            success: true, 
            message: `Message sent successfully to ${toEmail}` 
        });
    } catch (error: any) {
        console.error("SES Send Message Error:", error);
        return NextResponse.json({ success: false, message: error.message || "Failed to send message" }, { status: 500 });
    }
}
