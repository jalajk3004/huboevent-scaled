import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 're_Z47tMT91_HyrJWdPuP9EyspCvHTAwQx6o');

export async function verifyEmailAddress(email: string) {
    console.log(`[Resend] Note: Resend does not have a direct single-email verification like SES. 
    Domain verification is recommended. Skipping verification for ${email}.`);
    // Stubbed as Resend uses different verification mechanism (API key/domain)
    return { success: true };
}

export async function sendTicketEmail(toEmail: string, ticketData: any, amount: any, registrationId: string) {
    const sourceEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev"; 
    // Note: If using onboading@resend.dev, you can only send to your own email.
    // The user should update RESEND_FROM_EMAIL to a verified domain.

    const htmlBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
            <h1 style="color: #f70a7d; text-align: center;">HUBO EVENTS</h1>
            <h2 style="text-align: center;">Payment Successful!</h2>
            <p>Hi <b>${ticketData.name}</b>,</p>
            <p>Your payment of <b>₹${amount}</b> was successful!</p>
            <div style="background: #fdfdfd; padding: 15px; border-radius: 8px; margin-top: 20px; border: 1px dashed #ccc;">
                <h3>Ticket Details</h3>
                <p><b>Event:</b> ${ticketData.event.replace('-', ' ').toUpperCase()}</p>
                <p><b>Category:</b> ${ticketData.category}</p>
                <p><b>Type:</b> ${(ticketData.type || "").toUpperCase()}</p>
                <p><b>Ticket ID:</b> ${registrationId}</p>
            </div>
            <p style="margin-top: 30px;">Present this email at the venue entrance. See you there!</p>
        </div>
    `;

    try {
        console.log(`[Resend] Attempting to send ticket email to ${toEmail} from ${sourceEmail}`);
        const { data, error } = await resend.emails.send({
            from: `HubO Events <${sourceEmail}>`,
            to: [toEmail],
            subject: `Your Tickets for ${ticketData.event.replace('-', ' ').toUpperCase()} 🎉`,
            html: htmlBody,
        });

        if (error) {
            console.error(`[Resend] Error sending ticket email to ${toEmail}:`, error);
            throw error;
        }

        console.log(`[Resend] Successfully sent ticket email to ${toEmail}. ID: ${data?.id}`);
        return data;
    } catch (error) {
        console.error(`[Resend] Exception sending ticket email to ${toEmail}:`, error);
        throw error;
    }
}

export async function sendTestMessage(toEmail: string, subject: string, message: string) {
    const sourceEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

    try {
        console.log(`[Resend] Attempting to send test message to ${toEmail} from ${sourceEmail}`);
        const { data, error } = await resend.emails.send({
            from: `HubO Events <${sourceEmail}>`,
            to: [toEmail],
            subject: subject,
            text: message,
        });

        if (error) {
            console.error(`[Resend] Error sending test message to ${toEmail}:`, error);
            throw error;
        }

        console.log(`[Resend] Successfully sent test message to ${toEmail}. ID: ${data?.id}`);
        return data;
    } catch (error) {
        console.error(`[Resend] Exception sending test message to ${toEmail}:`, error);
        throw error;
    }
}
