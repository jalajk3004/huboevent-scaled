// Initialize Meta WhatsApp Cloud API config
const accessToken = process.env.META_WA_ACCESS_TOKEN;
const phoneNumberId = process.env.META_WA_PHONE_NUMBER_ID;

const getApiUrl = () =>
  `https://graph.facebook.com/v22.0/${phoneNumberId}/messages`;

interface TicketDetails {
  name: string;
  event: string;
  ticketId: string;
  date?: string;
  time?: string;
  venue?: string;
  category?: string;
  type?: string;
  quantity?: number;
  paymentId?: string;
  amount?: string;
}

export async function sendWhatsAppTicket(
  phone: string,
  ticketDetails: TicketDetails
) {
  if (!accessToken || !phoneNumberId) {
    console.warn("[WHATSAPP] Missing credentials — set META_WA_ACCESS_TOKEN and META_WA_PHONE_NUMBER_ID");
    return { success: false };
  }

  try {
    // Ensure phone is digits-only and has country code (default to India +91)
    let formattedPhone = phone.replace(/\D/g, "");
    if (!formattedPhone.startsWith("91") && formattedPhone.length === 10) {
      formattedPhone = "91" + formattedPhone;
    }

    const { name, ticketId, venue = "TBD" } = ticketDetails;

    console.log(
      `[WHATSAPP] Sending ticket_confirmation to +${formattedPhone} | name=${name} | ticketId=${ticketId} | venue=${venue}`
    );

    /**
     * Template: ticket_confirmation
     * Body variables (in order):
     *   {{1}} = name       → "Hello 🎉 You're officially in, {{name}}!"
     *   {{2}} = ticket_id  → "Ticket ID: {{ticket_id}}"
     *   {{3}} = venue      → "Venue: {{venue}}"
     *
     * Date "10th May 2026" is hardcoded in the template itself, so no variable needed.
     */
    const payload = {
      messaging_product: "whatsapp",
      to: formattedPhone,
      type: "template",
      template: {
        name: "ticket_confirmation",
        language: {
          code: "en",
        },
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: name },       // {{name}}
              { type: "text", text: ticketId },   // {{ticket_id}}
              { type: "text", text: venue },       // {{venue}}
            ],
          },
        ],
      },
    };

    const response = await fetch(getApiUrl(), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    console.log("[WHATSAPP RESPONSE]", JSON.stringify(data, null, 2));

    if (!response.ok) {
      throw new Error(data.error?.message || "WhatsApp API Error");
    }

    return {
      success: true,
      messageId: data.messages?.[0]?.id,
    };
  } catch (error) {
    console.error("[WHATSAPP ERROR]", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}