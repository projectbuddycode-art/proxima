export interface MapBusinessRecord {
  id: string;
  name: string;
  category: string;
  osm_id?: string;
  latitude?: number;
  longitude?: number;
  city: string;
  country: string;
  tags: Record<string, string>;
  source: 'OpenStreetMap Regional Extract' | 'User Dataset' | 'Directory API';
  source_url: string;
  website?: string;
}

export class OfflineMapIntelligenceEngine {
  /**
   * Discovers real operating businesses from OpenStreetMap public registry (Nominatim API)
   */
  static async discoverFromMapData(category: string, city: string): Promise<MapBusinessRecord[]> {
    const cleanCategory = category.trim();
    const cleanCity = city.trim();
    const queryStr = `${cleanCategory} in ${cleanCity}`;

    console.log(`[OSM DISCOVERY] Querying real OpenStreetMap registry for: "${queryStr}"`);

    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(queryStr)}&format=json&addressdetails=1&limit=15`;
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'ProximaClientAcquisitionOS/2.0 (contact@projectbuddy.in)'
        }
      });

      if (!response.ok) {
        console.warn(`[OSM DISCOVERY WARNING] OpenStreetMap HTTP ${response.status}`);
        return [];
      }

      const data = await response.json();
      if (!Array.isArray(data) || data.length === 0) {
        console.log(`[OSM DISCOVERY] OpenStreetMap returned 0 candidates for query: "${queryStr}"`);
        return [];
      }

      const results: MapBusinessRecord[] = [];

      for (const item of data) {
        const rawName = item.display_name ? item.display_name.split(',')[0].trim() : '';
        if (!rawName || rawName.length < 2) continue;

        const osmIdStr = `${item.osm_type || 'node'}/${item.osm_id || Math.floor(Math.random() * 1000000)}`;
        const sourceUrl = `https://www.openstreetmap.org/${osmIdStr}`;
        const catName = item.type || item.class || cleanCategory;

        results.push({
          id: `osm_${item.osm_id || Date.now()}`,
          name: rawName,
          category: catName,
          osm_id: osmIdStr,
          latitude: item.lat ? parseFloat(item.lat) : undefined,
          longitude: item.lon ? parseFloat(item.lon) : undefined,
          city: cleanCity,
          country: item.address?.country || 'India',
          tags: {
            class: item.class || 'shop',
            type: item.type || 'commercial',
            display_name: item.display_name || ''
          },
          source: 'OpenStreetMap Regional Extract',
          source_url: sourceUrl
        });
      }

      console.log(`[OSM DISCOVERY] Successfully retrieved ${results.length} real business candidate(s) from OpenStreetMap.`);
      return results;
    } catch (err: any) {
      console.error(`[OSM DISCOVERY ERROR] OpenStreetMap fetch failed:`, err.message);
      return [];
    }
  }
}
