// Initialize Meta WhatsApp Cloud API config
const accessToken = process.env.META_WA_ACCESS_TOKEN;
const phoneNumberId = process.env.META_WA_PHONE_NUMBER_ID;

// API endpoint URL for sending messages (using v18.0)
const getApiUrl = () => `https://graph.facebook.com/v22.0/${phoneNumberId}/messages`;

interface TicketDetails {
  name: string;
  event: string;
  category: string;
  type: string;
  quantity: number;
  ticketId: string;
  paymentId: string;
  amount: number | string;
}

export async function sendWhatsAppTicket(phone: string, ticketDetails: TicketDetails) {
  if (!accessToken || !phoneNumberId) {
    console.warn('[WHATSAPP] Meta WhatsApp Cloud API credentials are not configured in environment variables. Message skipped.');
    return { success: false, error: 'Meta WhatsApp credentials not configured' };
  }

  try {
    // Forcing the number to the user's specific number for all messages as requested
    const formattedPhone = '918851454740';

    const messageBody = `🎉 *Payment Successful!* 🎉\n\nHi *${ticketDetails.name}*,\nThank you for booking with HubO Events. Your payment of *₹${ticketDetails.amount}* was successful.\n\n*Ticket Details:*\n📅 *Event:* ${ticketDetails.event.replace('-', ' ').toUpperCase()}\n🎫 *Category:* ${ticketDetails.category}\n⭐ *Type:* ${ticketDetails.type.toUpperCase()}\n🎟️ *Quantity:* ${ticketDetails.quantity}\n\n*Ticket ID:* ${ticketDetails.ticketId}\n*Payment ID:* ${ticketDetails.paymentId}\n\nPresent this message at the venue entrance. See you at the event! 🥳\n\n_HubO Events_`;

    const response = await fetch(getApiUrl(), {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: formattedPhone,
        type: 'text',
        text: {
          preview_url: false,
          body: messageBody,
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to send WhatsApp message via Meta API');
    }

    console.log(`[WHATSAPP] Successfully sent ticket via Meta to ${formattedPhone}`);
    return { success: true, messageId: data.messages?.[0]?.id };
  } catch (error) {
    console.error(`[WHATSAPP] Failed to send message to ${phone}:`, error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}
