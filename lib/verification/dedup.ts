import { getDb } from '../db';

export interface CanonicalCompany {
  id: string;
  name: string;
  normalized_name: string;
  website?: string;
  normalized_domain?: string;
  industry: string;
  location: string;
  city: string;
  country: string;
  phone?: string;
  osm_id?: string;
  created_at: string;
}

export class CanonicalDeduplicationEngine {
  /**
   * Normalizes domain name from URL (e.g., https://www.abcinteriors.com/contact -> abcinteriors.com)
   */
  static normalizeDomain(url?: string): string | undefined {
    if (!url || typeof url !== 'string') return undefined;
    let clean = url.trim().toLowerCase();
    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      clean = 'https://' + clean;
    }
    try {
      const parsed = new URL(clean);
      let hostname = parsed.hostname.replace(/^www\./, '');
      if (hostname === 'localhost' || hostname === 'example.com' || hostname.includes('openstreetmap.org')) {
        return undefined;
      }
      return hostname;
    } catch (e) {
      return undefined;
    }
  }

  /**
   * Normalizes company name by stripping legal suffixes and address fragments
   */
  static normalizeCompanyName(name: string, city?: string): string {
    if (!name) return '';
    let clean = name.trim().toLowerCase();
    // Remove location fragments separated by comma
    clean = clean.split(',')[0].trim();
    // Remove common legal suffixes
    clean = clean
      .replace(/\b(pvt|ltd|private|limited|inc|corp|llp|co|company|enterprises|store|shop)\b/gi, '')
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    return clean;
  }

  /**
   * Searches for existing canonical company record across multiple matching keys
   */
  static async findCanonicalCompany(candidate: {
    company_name: string;
    website?: string;
    city?: string;
    phone?: string;
    osm_id?: string;
  }): Promise<any | null> {
    const db = getDb();

    const normDomain = this.normalizeDomain(candidate.website);
    const normName = this.normalizeCompanyName(candidate.company_name, candidate.city);
    const cleanCity = (candidate.city || '').trim().toLowerCase();

    // 1. Match by normalized domain
    if (normDomain) {
      try {
        const companies = await db.queryAllAsync('SELECT * FROM companies');
        const domainMatch = companies.find(c => this.normalizeDomain(c.website) === normDomain);
        if (domainMatch) return domainMatch;
      } catch (e) {
        // Ignore
      }
    }

    // 2. Match by OSM ID if available
    if (candidate.osm_id) {
      try {
        const osmMatch = await db.queryOneAsync('SELECT * FROM map_businesses WHERE osm_id = ?', [candidate.osm_id]);
        if (osmMatch && osmMatch.company_id) {
          const comp = await db.queryOneAsync('SELECT * FROM companies WHERE id = ?', [osmMatch.company_id]);
          if (comp) return comp;
        }
      } catch (e) {
        // Ignore
      }
    }

    // 3. Match by normalized name + city
    if (normName && cleanCity) {
      try {
        const companies = await db.queryAllAsync('SELECT * FROM companies');
        const nameCityMatch = companies.find(c => {
          const cNormName = this.normalizeCompanyName(c.name, c.location);
          const cCity = (c.location || '').toLowerCase();
          return cNormName === normName && (cCity.includes(cleanCity) || cleanCity.includes(cCity));
        });
        if (nameCityMatch) return nameCityMatch;
      } catch (e) {
        // Ignore
      }
    }

    // 4. Match by phone number
    if (candidate.phone && candidate.phone.replace(/[^0-9]/g, '').length >= 8) {
      const cleanPhone = candidate.phone.replace(/[^0-9]/g, '');
      try {
        const prospects = await db.queryAllAsync('SELECT * FROM prospects');
        const phoneMatch = prospects.find(p => (p.phone || '').replace(/[^0-9]/g, '') === cleanPhone);
        if (phoneMatch) {
          const comp = await db.queryOneAsync('SELECT * FROM companies WHERE id = ?', [phoneMatch.company_id]);
          if (comp) return comp;
        }
      } catch (e) {
        // Ignore
      }
    }

    return null;
  }
}
