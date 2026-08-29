/**
 * PROXIMA OpenStreetMap / Nominatim Discovery Provider
 * Queries public OpenStreetMap Nominatim API for verified geospatial business listings.
 */

import { DiscoveryProvider, DiscoveryCandidate, DiscoveryProviderResult } from './interface';
import { ProximaOperationError } from '../../domain/errors';

const USER_AGENT = 'ProximaClientAcquisitionOS/2.0 (contact@projectbuddy.in)';
const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org/search';

export class OpenStreetMapProvider implements DiscoveryProvider {
  name = 'OpenStreetMap';

  async isAvailable(): Promise<boolean> {
    try {
      const res = await fetch(`${NOMINATIM_BASE}?q=test&format=json&limit=1`, {
        headers: { 'User-Agent': USER_AGENT },
        signal: AbortSignal.timeout(5000)
      });
      return res.ok;
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
    const cleanCategory = industry.trim();
    const cleanCity = location.trim();
    const queryStr = `${cleanCategory} in ${cleanCity}`;
    const startTime = Date.now();

    console.log(`[OSM PROVIDER] Querying: "${queryStr}" (offset=${offset}, limit=${batchSize})`);

    const maxRetries = 2;
    let attempt = 0;
    let lastError: any = null;

    while (attempt <= maxRetries) {
      try {
        const url = `${NOMINATIM_BASE}?q=${encodeURIComponent(queryStr)}&format=json&addressdetails=1&limit=${batchSize}&offset=${offset}`;
        const response = await fetch(url, {
          headers: { 'User-Agent': USER_AGENT },
          signal: AbortSignal.timeout(12000)
        });

        if (response.status === 429) {
          if (attempt < maxRetries) {
            attempt++;
            const backoffMs = Math.pow(2, attempt) * 1000;
            console.warn(`[OSM PROVIDER] Rate limited (429). Retrying in ${backoffMs}ms...`);
            await new Promise(r => setTimeout(r, backoffMs));
            continue;
          }
          throw new ProximaOperationError({
            code: 'DISCOVERY_RATE_LIMITED',
            message: 'OpenStreetMap Nominatim rate limit exceeded',
            operation: 'OSM_DISCOVER',
            retryable: true
          });
        }

        if (!response.ok) {
          throw new ProximaOperationError({
            code: 'DISCOVERY_PROVIDER_FAILED',
            message: `OpenStreetMap HTTP ${response.status}`,
            operation: 'OSM_DISCOVER',
            retryable: response.status >= 500
          });
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
          throw new ProximaOperationError({
            code: 'DISCOVERY_MALFORMED_RESPONSE',
            message: 'OpenStreetMap returned non-array response',
            operation: 'OSM_DISCOVER',
            retryable: false
          });
        }

        const candidates: DiscoveryCandidate[] = [];

        for (const item of data) {
          const rawName = item.display_name ? item.display_name.split(',')[0].trim() : '';
          if (!rawName || rawName.length < 2) continue;

          const osmIdStr = `${item.osm_type || 'node'}/${item.osm_id || '0'}`;
          const sourceUrl = `https://www.openstreetmap.org/${osmIdStr}`;
          const catName = item.type || item.class || cleanCategory;

          candidates.push({
            source: 'OpenStreetMap',
            sourceId: osmIdStr,
            businessName: rawName,
            category: catName,
            address: item.display_name || `${cleanCity}, India`,
            city: cleanCity,
            country: item.address?.country || 'India',
            website: undefined,
            phone: undefined,
            sourceUrl,
            discovered_name: rawName,
            discovered_domain: undefined,
            discovered_url: sourceUrl,
            discovery_source: 'OpenStreetMap',
            discovery_query: queryStr,
            evidence: {
              claim: `Verified physical location indexed on OpenStreetMap: ${rawName} (${catName})`,
              source: 'OpenStreetMap Nominatim Public Registry',
              sourceUrl,
              confidence: 85
            },
            rawSourceData: {
              osm_type: item.osm_type,
              osm_id: item.osm_id,
              class: item.class,
              type: item.type,
              lat: item.lat,
              lon: item.lon,
              display_name: item.display_name
            }
          });
        }

        console.log(`[OSM PROVIDER] Retrieved ${candidates.length} candidate(s) at offset ${offset}`);

        return {
          provider: this.name,
          success: true,
          candidates,
          offset,
          batchSize,
          latencyMs: Date.now() - startTime
        };
      } catch (err: any) {
        lastError = err;
        if (err instanceof ProximaOperationError && !err.retryable) {
          break;
        }
        attempt++;
        if (attempt <= maxRetries) {
          await new Promise(r => setTimeout(r, 1000 * attempt));
        }
      }
    }

    const errorMsg = lastError?.message || 'OpenStreetMap discovery failed';
    console.warn(`[OSM PROVIDER] Failed: ${errorMsg}`);

    return {
      provider: this.name,
      success: false,
      candidates: [],
      offset,
      batchSize,
      latencyMs: Date.now() - startTime,
      error: errorMsg,
      retryable: lastError instanceof ProximaOperationError ? lastError.retryable : true
    };
  }
}
