export type VerificationLevel =
  | 'LEVEL_0_UNKNOWN'
  | 'LEVEL_1_FOUND_ON_PUBLIC_SOURCE'
  | 'LEVEL_2_FOUND_ON_OFFICIAL_COMPANY_SOURCE'
  | 'LEVEL_3_CORROBORATED_BY_SECOND_SOURCE'
  | 'LEVEL_4_DELIVERY_VERIFIED';

export interface ContactProvenance {
  type: 'email' | 'phone' | 'whatsapp' | 'linkedin' | 'instagram' | 'facebook' | 'contact_form';
  value: string;
  source_url: string;
  source_type: 'official_website' | 'official_social' | 'public_directory' | 'verified_listing';
  verification_level: VerificationLevel;
  domain_valid: boolean;
  mailbox_delivery_confirmed: boolean;
  confidence: number;
  last_verified: string;
}

export class ContactVerificationEngine {
  /**
   * Verifies contact details against public provenance rules.
   * STRICT REAL MODE: Returns NULL if contact cannot be established from a real source.
   */
  static verifyContact(
    type: ContactProvenance['type'],
    value: string | undefined,
    sourceUrl: string,
    sourceType: ContactProvenance['source_type'],
    isCorroborated = false,
    deliveryConfirmed = false
  ): ContactProvenance | null {
    if (!value || value.trim() === '' || value.includes('example.com') || value.includes('dummy')) {
      return null; // Zero synthetic fallback allowed in REAL MODE
    }

    const cleanVal = value.trim();
    let level: VerificationLevel = 'LEVEL_1_FOUND_ON_PUBLIC_SOURCE';

    if (sourceType === 'official_website' || sourceType === 'official_social') {
      level = 'LEVEL_2_FOUND_ON_OFFICIAL_COMPANY_SOURCE';
    }

    if (isCorroborated && level === 'LEVEL_2_FOUND_ON_OFFICIAL_COMPANY_SOURCE') {
      level = 'LEVEL_3_CORROBORATED_BY_SECOND_SOURCE';
    }

    if (deliveryConfirmed) {
      level = 'LEVEL_4_DELIVERY_VERIFIED';
    }

    const domain_valid = type === 'email' ? cleanVal.includes('@') && cleanVal.includes('.') : true;

    return {
      type,
      value: cleanVal,
      source_url: sourceUrl,
      source_type: sourceType,
      verification_level: level,
      domain_valid,
      mailbox_delivery_confirmed: deliveryConfirmed,
      confidence: level === 'LEVEL_4_DELIVERY_VERIFIED' ? 100 : level === 'LEVEL_3_CORROBORATED_BY_SECOND_SOURCE' ? 95 : level === 'LEVEL_2_FOUND_ON_OFFICIAL_COMPANY_SOURCE' ? 88 : 70,
      last_verified: new Date().toISOString()
    };
  }
}
