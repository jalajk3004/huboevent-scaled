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
    console.warn("[WHATSAPP] Missing credentials");
    return { success: false };
  }

  try {
    // Clean phone number
    const formattedPhone = phone.replace(/\D/g, "");

    console.log(
      `[WHATSAPP] Sending template to ${formattedPhone} using phoneNumberId ${phoneNumberId}`
    );

    const payload = {
      messaging_product: "whatsapp",
      to: formattedPhone,
      type: "template",
      template: {
        name: "hello_world",
        language: {
          code: "en_US",
        },
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

    console.log("[WHATSAPP RESPONSE]", data);

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