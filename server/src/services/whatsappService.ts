import config from '../config/env';

const { accessToken, phoneNumberId } = config.whatsapp;

const getApiUrl = (): string =>
  `https://graph.facebook.com/v22.0/${phoneNumberId}/messages`;

export interface TicketDetails {
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
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!accessToken || !phoneNumberId) {
    console.warn('[WHATSAPP] Missing credentials — set META_WA_ACCESS_TOKEN and META_WA_PHONE_NUMBER_ID');
    return { success: false };
  }

  try {
    // Normalise phone: strip non-digits, prepend 91 if 10-digit Indian number
    let formattedPhone = phone.replace(/\D/g, '');
    if (!formattedPhone.startsWith('91') && formattedPhone.length === 10) {
      formattedPhone = '91' + formattedPhone;
    }

    const { name, ticketId, venue = 'TBD' } = ticketDetails;

    console.log(
      `[WHATSAPP] Sending ticket_confirmation to +${formattedPhone} | name=${name} | ticketId=${ticketId} | venue=${venue}`
    );

    const payload = {
      messaging_product: 'whatsapp',
      to: formattedPhone,
      type: 'template',
      template: {
        name: 'ticket_confirmation',
        language: { code: 'en' },
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', parameter_name: 'name', text: name },
              { type: 'text', parameter_name: 'ticket_id', text: ticketId },
              { type: 'text', parameter_name: 'venue', text: venue },
            ],
          },
        ],
      },
    };

    const response = await fetch(getApiUrl(), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    console.log('[WHATSAPP RESPONSE]', JSON.stringify(data, null, 2));

    if (!response.ok) {
      throw new Error((data as any).error?.message ?? 'WhatsApp API Error');
    }

    return {
      success: true,
      messageId: (data as any).messages?.[0]?.id,
    };
  } catch (error) {
    console.error('[WHATSAPP ERROR]', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
