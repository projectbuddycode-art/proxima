export type WhatsAppMode = 'MANUAL_OPEN' | 'OFFICIAL_API' | 'HUMAN_TAKEOVER';

export interface WhatsAppLinkResult {
  mode: WhatsAppMode;
  phone: string;
  clickToChatUrl?: string;
  verifiedSourceUrl: string;
  isUsable: boolean;
}

export class WhatsAppChannelAdapter {
  /**
   * Generates legitimate click-to-chat or API payload for verified WhatsApp contact numbers
   */
  static generateWhatsAppAction(phone: string | undefined, verifiedSourceUrl: string, initialMessage: string): WhatsAppLinkResult {
    if (!phone || phone.trim() === '') {
      return {
        mode: 'MANUAL_OPEN',
        phone: '',
        verifiedSourceUrl,
        isUsable: false
      };
    }

    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const encodedMsg = encodeURIComponent(initialMessage);
    const clickToChatUrl = `https://wa.me/${cleanPhone}?text=${encodedMsg}`;

    return {
      mode: 'MANUAL_OPEN',
      phone: cleanPhone,
      clickToChatUrl,
      verifiedSourceUrl,
      isUsable: true
    };
  }
}
