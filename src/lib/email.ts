import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || "re_dummy_key_for_build");

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
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html dir="ltr" lang="en">
  <head>
    <meta content="width=device-width" name="viewport" />
    <meta content="text/html; charset=UTF-8" http-equiv="Content-Type" />
    <meta name="x-apple-disable-message-reformatting" />
    <meta content="IE=edge" http-equiv="X-UA-Compatible" />
    <meta name="x-apple-disable-message-reformatting" />
    <meta
      content="telephone=no,address=no,email=no,date=no,url=no"
      name="format-detection" />
  </head>
  <body>
    <table
      border="0"
      width="100%"
      cellpadding="0"
      cellspacing="0"
      role="presentation"
      align="center">
      <tbody>
        <tr>
          <td>
            <table
              align="center"
              width="100%"
              border="0"
              cellpadding="0"
              cellspacing="0"
              role="presentation"
              style="width:100%">
              <tbody>
                <tr style="width:100%">
                  <td>
                    <div
                      style="margin:auto;padding:24px;max-width:600px;background:#ffffff;border-radius:10px">
                      <h2 style="margin:0;padding:0;text-align:center">
                        🎉 You're officially in, ${ticketData.name}! 🎉
                      </h2>
                      <p style="margin:0;padding:0;margin-top:10px;">
                        Your tickets for Dhrundhar Insta ke have been
                        successfully confirmed.
                      </p>
                      <hr style="width:100%;border:none;border-top:1px solid #eaeaea;margin:20px 0;" />
                      <p style="margin:0;padding:0;margin-bottom:8px;">
                        <strong>🎫 Ticket ID:</strong> ${registrationId}
                      </p>
                      <p style="margin:0;padding:0;margin-bottom:8px;">
                        <strong>📍 Venue:</strong> HubOEvents Venue
                      </p>
                      <p style="margin:0;padding:0">
                        <strong>📅 Date:</strong> 10th May
                      </p>
                      <hr style="width:100%;border:none;border-top:1px solid #eaeaea;margin:20px 0;" />
                      <p style="margin:0;padding:0">
                        Please keep this email handy for entry.
                      </p>
                      <p style="margin:0;padding:0;text-align:center;margin-top:20px">
                        ✨ We can't wait to see you there!
                      </p>
                      <p style="margin:0;padding:0;text-align:center;font-size:12px;color:#888;margin-top:20px;">
                        — Team HubOEvents
                      </p>
                    </div>
                    <p style="margin:0;padding:0"><br /></p>
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
  </body>
</html>
    `;

    try {
        console.log(`[Resend] Attempting to send ticket email to ${toEmail} from ${sourceEmail}`);
        const { data, error } = await resend.emails.send({
            from: `HubO Events <${sourceEmail}>`,
            to: [toEmail],
            subject: `Your Tickets for DHRUNDHAR INSTA KE 🎉`,
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
