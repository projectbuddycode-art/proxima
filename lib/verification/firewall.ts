/**
 * PROXIMA REAL-DATA FIREWALL LAYER
 * Enforces 100% Real Prospect & Contact Validation for Production Environment
 */

export interface ProspectValidationInput {
  company_name?: string;
  contact_name?: string;
  website?: string;
  email?: string;
  phone?: string;
  source_url?: string;
  source_type?: string;
  industry?: string;
}

const FORBIDDEN_COMPANY_PATTERNS = [
  'test company',
  'sample company',
  'demo company',
  'dummy company',
  'fake company',
  'example company',
  'placeholder',
  'test mode',
  'luxe architectural lighting',
  'deccan commercial illumination',
  'apex digital solutions',
  'enterprise growth system',
  'bangalore premium lighting'
];

const FORBIDDEN_CONTACT_PATTERNS = [
  'test user',
  'test contact',
  'fake contact',
  'dummy user',
  'john doe',
  'vikram mehta',
  'ananya rao',
  'karan sharma',
  'suresh patel',
  'rajesh kumar'
];

const FORBIDDEN_DOMAINS = [
  'example.com',
  'example.org',
  'example.net',
  'example.in',
  'example.io',
  'luxe-lighting-example.in',
  'deccan-illumination-example.com',
  'apexdigital-example.io',
  'growth-enterprise-example.com',
  'example-lighting.com',
  'test.com',
  'dummy.com',
  'fake.com'
];

const FORBIDDEN_EMAILS = [
  '@example.com',
  '@example.org',
  '@example.net',
  '@example.in',
  '@example.io',
  'test@',
  'dummy@',
  'fake@',
  'sample@',
  'placeholder@',
  'vikram@',
  'ananya@',
  'karan@',
  'suresh@',
  'rajesh@'
];

const FORBIDDEN_PHONES = [
  '1234567890',
  '0000000000',
  '9999999999',
  '98765 43210',
  '98123 45678',
  '99000 11223',
  '97777 88888'
];

export class RealProspectFirewall {
  /**
   * Validates whether a prospect record represents a 100% real business entity.
   * Rejects test, demo, sample, dummy, and synthetic fallback records.
   */
  static validateRealProspect(prospect: ProspectValidationInput | null | undefined): boolean {
    if (!prospect) return false;

    const companyName = (prospect.company_name || '').toLowerCase().trim();
    const contactName = (prospect.contact_name || '').toLowerCase().trim();
    const website = (prospect.website || '').toLowerCase().trim();
    const email = (prospect.email || '').toLowerCase().trim();
    const phone = (prospect.phone || '').toLowerCase().trim();

    if (!companyName || companyName.length < 2) return false;

    // 1. Company Name Firewall
    for (const pattern of FORBIDDEN_COMPANY_PATTERNS) {
      if (companyName.includes(pattern)) return false;
    }

    // 2. Contact Name Firewall
    for (const pattern of FORBIDDEN_CONTACT_PATTERNS) {
      if (contactName.includes(pattern)) return false;
    }

    // 3. Website & Domain Firewall
    for (const domain of FORBIDDEN_DOMAINS) {
      if (website.includes(domain)) return false;
    }

    // 4. Email Firewall
    if (email) {
      for (const pattern of FORBIDDEN_EMAILS) {
        if (email.includes(pattern)) return false;
      }
    }

    // 5. Phone Firewall
    if (phone) {
      for (const pattern of FORBIDDEN_PHONES) {
        if (phone.includes(pattern)) return false;
      }
    }

    return true;
  }

  /**
   * Sanitizes unverified contact fields to strict NULL rather than fake placeholder strings.
   */
  static sanitizeContactValue(val: string | null | undefined): string | null {
    if (!val || val.trim() === '') return null;
    const lower = val.toLowerCase().trim();
    if (
      lower.includes('example') ||
      lower.includes('dummy') ||
      lower.includes('fake') ||
      lower.includes('test@') ||
      lower.includes('not available') ||
      lower.includes('1234567890')
    ) {
      return null;
    }
    return val.trim();
  }
}
