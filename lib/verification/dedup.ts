import { getDb } from '../db';
import { normalizeCanonicalUrl } from '../domain/evidence';

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
  source_ids?: string[];
  all_sources?: string[];
  evidence_ids?: string[];
  created_at: string;
}

export interface MergeEvidenceRecord {
  merged_with_company_id: string;
  match_type: 'DOMAIN' | 'SOURCE_ID' | 'NAME_AND_LOCATION' | 'PHONE';
  matched_key: string;
  matched_at: string;
  original_candidate: Record<string, any>;
}

export class CanonicalDeduplicationEngine {
  /**
   * Normalizes domain name from URL (e.g., https://www.abcinteriors.com/contact -> abcinteriors.com)
   */
  static normalizeDomain(url?: string): string | undefined {
    if (!url || typeof url !== 'string') return undefined;
    const normalized = normalizeCanonicalUrl(url);
    return normalized ? normalized.domain : undefined;
  }

  /**
   * Normalizes company name by stripping legal suffixes and address fragments
   */
  static normalizeCompanyName(name: string, city?: string): string {
    if (!name) return '';
    let clean = name.trim().toLowerCase();
    // Remove location fragments separated by comma or dash or pipe
    clean = clean.split(/[,|\-–]/)[0].trim();
    // Remove common legal and generic suffixes
    clean = clean
      .replace(/\b(pvt|ltd|private|limited|inc|corp|corporation|llp|co|company|enterprises|store|shop|showroom|india|bangalore|mumbai|delhi|hyderabad|chennai)\b/gi, '')
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    return clean;
  }

  /**
   * Normalizes phone number to digits only (stripping country code prefixes if standard)
   */
  static normalizePhone(phone?: string): string | undefined {
    if (!phone || typeof phone !== 'string') return undefined;
    const digits = phone.replace(/[^0-9]/g, '');
    if (digits.length < 8) return undefined;
    // Strip leading 91 or +91 for India if 12 digits
    if (digits.length === 12 && digits.startsWith('91')) {
      return digits.substring(2);
    }
    // Strip leading 0 if 11 digits
    if (digits.length === 11 && digits.startsWith('0')) {
      return digits.substring(1);
    }
    return digits;
  }

  /**
   * Searches for existing canonical company record across multiple matching keys in strict hierarchy
   */
  static async findCanonicalCompany(candidate: {
    company_name: string;
    website?: string;
    city?: string;
    location?: string;
    phone?: string;
    osm_id?: string;
    source_id?: string;
  }): Promise<{ company: any; match_type: 'DOMAIN' | 'SOURCE_ID' | 'NAME_AND_LOCATION' | 'PHONE'; matched_key: string } | null> {
    const db = getDb();

    const normDomain = this.normalizeDomain(candidate.website);
    const candidateCity = (candidate.city || candidate.location || '').trim().toLowerCase();
    const normName = this.normalizeCompanyName(candidate.company_name, candidateCity);
    const normPhone = this.normalizePhone(candidate.phone);
    const sourceId = candidate.source_id || candidate.osm_id;

    // 1. Priority 1: Match by Canonical Normalized Domain
    if (normDomain) {
      const companies = await db.queryAllAsync('SELECT * FROM companies');
      const domainMatch = companies.find(c => {
        const cDomain = c.normalized_domain || this.normalizeDomain(c.website);
        return cDomain === normDomain;
      });
      if (domainMatch) {
        return {
          company: domainMatch,
          match_type: 'DOMAIN',
          matched_key: normDomain
        };
      }
    }

    // 2. Priority 2: Match by Verified Source ID
    if (sourceId) {
      const companies = await db.queryAllAsync('SELECT * FROM companies');
      const sourceMatch = companies.find(c => c.source_id === sourceId);
      if (sourceMatch) {
        return {
          company: sourceMatch,
          match_type: 'SOURCE_ID',
          matched_key: sourceId
        };
      }

      const mapMatch = await db.queryOneAsync('SELECT * FROM map_businesses WHERE osm_id = ?', [sourceId]);
      if (mapMatch && (mapMatch as any).company_id) {
        const comp = await db.queryOneAsync('SELECT * FROM companies WHERE id = ?', [(mapMatch as any).company_id]);
        if (comp) {
          return {
            company: comp,
            match_type: 'SOURCE_ID',
            matched_key: sourceId
          };
        }
      }
    }

    // 3. Priority 3: Match by Normalized Company Name + Location (Strict requirement: both must match with high token overlap)
    if (normName && normName.length >= 3 && candidateCity) {
      const companies = await db.queryAllAsync('SELECT * FROM companies');
      const nameCityMatch = companies.find(c => {
        const cNormName = c.normalized_name || this.normalizeCompanyName(c.name, c.location);
        const cCity = (c.location || '').toLowerCase();
        
        // Exact normalized name match
        const isNameMatch = cNormName === normName;
        // Location token overlap
        const isCityMatch = cCity.includes(candidateCity) || candidateCity.includes(cCity);

        return isNameMatch && isCityMatch;
      });

      if (nameCityMatch) {
        return {
          company: nameCityMatch,
          match_type: 'NAME_AND_LOCATION',
          matched_key: `${normName} in ${candidateCity}`
        };
      }
    }

    // 4. Priority 4: Match by Normalized Phone Number
    if (normPhone) {
      const prospects = await db.queryAllAsync('SELECT * FROM prospects');
      const phoneMatch = prospects.find(p => {
        const pPhone = this.normalizePhone(p.phone);
        return pPhone && pPhone === normPhone;
      });

      if (phoneMatch && phoneMatch.company_id) {
        const comp = await db.queryOneAsync('SELECT * FROM companies WHERE id = ?', [phoneMatch.company_id]);
        if (comp) {
          return {
            company: comp,
            match_type: 'PHONE',
            matched_key: normPhone
          };
        }
      }
    }

    return null;
  }

  /**
   * Merges incoming candidate evidence and sources into an existing canonical company
   */
  static async mergeCandidateIntoCompany(
    existingCompany: any,
    candidate: Record<string, any>,
    matchType: string
  ): Promise<void> {
    const db = getDb();
    const now = new Date().toISOString();

    // Preserve sources
    let sources: string[] = [];
    try {
      sources = typeof existingCompany.all_sources === 'string'
        ? JSON.parse(existingCompany.all_sources)
        : (existingCompany.all_sources || []);
    } catch {
      sources = [];
    }

    if (candidate.source && !sources.includes(candidate.source)) {
      sources.push(candidate.source);
    }

    // Preserve products/services JSON
    let products: any = [];
    try {
      products = typeof existingCompany.products_services_json === 'string'
        ? JSON.parse(existingCompany.products_services_json)
        : (existingCompany.products_services_json || []);
    } catch {
      products = [];
    }

    if (candidate.rawSourceData && Array.isArray(products)) {
      products.push(candidate.rawSourceData);
    }

    try {
      await db.executeAsync(
        `UPDATE companies SET products_services_json = ? WHERE id = ?`,
        [JSON.stringify(products), existingCompany.id]
      );
    } catch (e: any) {
      console.warn('[DEDUP] Merge company update warning:', e.message);
    }
  }
}
