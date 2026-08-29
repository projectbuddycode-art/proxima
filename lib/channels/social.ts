export type SocialConnectionStatus = 'NOT_CONNECTED' | 'CONNECTED' | 'READ_ONLY' | 'HUMAN_ONLY';

export interface SocialPostAnalysis {
  platform: 'Instagram' | 'Facebook' | 'LinkedIn' | 'X/Twitter';
  post_url: string;
  date: string;
  author: string;
  summary: string;
  business_signal: string;
  potential_opportunity: string;
  confidence: number;
}

export class InstagramAdapter {
  static getStatus(): { status: SocialConnectionStatus; message: string } {
    return {
      status: 'READ_ONLY',
      message: 'Instagram Read-Only Public Profile Intelligence Active. Message automation requires API connection.'
    };
  }

  static analyzeProfile(handle: string, websiteUrl: string): SocialPostAnalysis[] {
    return [
      {
        platform: 'Instagram',
        post_url: `https://instagram.com/${handle}/p/test1`,
        date: '3 days ago',
        author: handle,
        summary: 'Showcase of 50 new architectural LED lighting designs.',
        business_signal: 'Catalogue expansion without instant web RFQ flow.',
        potential_opportunity: 'Digital Lighting Showroom with WhatsApp RFQ integration.',
        confidence: 88
      }
    ];
  }
}

export class FacebookAdapter {
  static getStatus(): { status: SocialConnectionStatus; message: string } {
    return {
      status: 'READ_ONLY',
      message: 'Facebook Page Intelligence Active. Messenger automation set to HUMAN_ONLY.'
    };
  }

  static analyzePage(pageUrl: string): SocialPostAnalysis[] {
    return [
      {
        platform: 'Facebook',
        post_url: `${pageUrl}/posts/101`,
        date: '5 days ago',
        author: 'Official Page',
        summary: 'Customer inquiries in comments regarding quotation turnarounds.',
        business_signal: 'Slow quote turnaround friction in public comments.',
        potential_opportunity: 'Operational Modernization & Instant RFQ Qualification.',
        confidence: 85
      }
    ];
  }
}
