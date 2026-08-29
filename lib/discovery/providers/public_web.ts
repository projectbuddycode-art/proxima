/**
 * PROXIMA Public Web Discovery Provider
 * Discovers real business websites and commercial domain entities via public web indexing.
 */

import { DiscoveryProvider, DiscoveryCandidate, DiscoveryProviderResult } from './interface';
import { normalizeCanonicalUrl } from '../../domain/evidence';

const USER_AGENT = 'ProximaClientAcquisitionOS/2.0 (contact@projectbuddy.in; public business discovery)';

export class PublicWebDiscoveryProvider implements DiscoveryProvider {
  name = 'PublicWeb';

  async isAvailable(): Promise<boolean> {
    try {
      // Check network connectivity to standard public DNS / web endpoint
      const res = await fetch('https://www.google.com/generate_204', {
        method: 'GET',
        signal: AbortSignal.timeout(4000)
      });
      return res.status === 204 || res.ok;
    } catch {
      return false;
    }
  }

  async discover(params: {
    industry: string;
    location: string;
    offset?: number;
    batchSize?: number;
  }): Promise<DiscoveryProviderResult> {
    const { industry, location, offset = 0, batchSize = 25 } = params;
    const startTime = Date.now();
    const cleanCategory = industry.trim();
    const cleanCity = location.trim();

    console.log(`[PUBLIC WEB PROVIDER] Scanning public web indexes for: "${cleanCategory} in ${cleanCity}" (offset=${offset}, limit=${batchSize})`);

    try {
      // In production, queries public web index endpoints / duckduckgo html search / public business directory search
      const query = encodeURIComponent(`${cleanCategory} ${cleanCity} official website contact`);
      const searchUrl = `https://html.duckduckgo.com/html/?q=${query}`;

      const response = await fetch(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        },
        signal: AbortSignal.timeout(10000)
      });

      const candidates: DiscoveryCandidate[] = [];

      if (response.ok) {
        const html = await response.text();
        
        // Detect DDG structure to see if HTML template has changed or was blocked
        const hasDdgStructure = html.includes('duckduckgo') || html.includes('result__') || html.includes('links_main') || html.includes('ddg');
        if (!hasDdgStructure && html.length > 0 && !html.includes('No results')) {
          throw new Error('PublicWeb provider parsing failure: DuckDuckGo search HTML structure has changed.');
        }

        // Extract real result links and titles from public HTML search results
        const linkMatches = html.matchAll(/<a[^>]+class="[^"]*result__url[^"]*"[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/gi);
        
        let idx = 0;
        for (const match of linkMatches) {
          if (candidates.length >= batchSize) break;
          const rawUrl = match[1]?.trim();
          const displayUrl = match[2]?.trim();

          const norm = normalizeCanonicalUrl(rawUrl || displayUrl);
          if (!norm) continue;

          // Deduplicate if already in batch
          if (candidates.some(c => c.website && c.website.includes(norm.domain))) continue;

          // Extract business name from domain or snippet title
          const domainBase = norm.domain.split('.')[0];
          const candidateName = domainBase.charAt(0).toUpperCase() + domainBase.slice(1);

          candidates.push({
            source: 'PublicWeb',
            sourceId: `web_${norm.domain}`,
            businessName: candidateName,
            category: cleanCategory,
            address: undefined, // NEVER assign city as company location without evidence
            city: undefined,    // NEVER assign city as company location without evidence
            country: 'India',
            website: undefined, // NEVER treat discovered search URL as verified website automatically
            sourceUrl: norm.url,
            discovered_name: candidateName,
            discovered_domain: norm.domain,
            discovered_url: norm.url,
            discovery_source: 'PublicWeb',
            discovery_query: `${cleanCategory} ${cleanCity} official website contact`,
            evidence: {
              claim: `Discovered candidate domain on public web search index matching query: ${cleanCategory} ${cleanCity}`,
              source: 'Public Web Search Index',
              sourceUrl: norm.url,
              confidence: 50 // Candidate discovery starts with low confidence
            },
            rawSourceData: {
              domain: norm.domain,
              discovered_url: norm.url,
              search_query: query
            }
          });
          idx++;
        }
      }

      console.log(`[PUBLIC WEB PROVIDER] Retrieved ${candidates.length} web candidate(s)`);

      return {
        provider: this.name,
        success: true,
        candidates,
        offset,
        batchSize,
        latencyMs: Date.now() - startTime
      };
    } catch (err: any) {
      console.warn(`[PUBLIC WEB PROVIDER] Discovery warning: ${err.message}`);
      return {
        provider: this.name,
        success: false,
        candidates: [],
        offset,
        batchSize,
        latencyMs: Date.now() - startTime,
        error: err.message,
        retryable: true
      };
    }
  }
}
