// NASA FIRMS (Fire Information for Resource Management System) Service
// Official API documentation: https://firms.modaps.eosdis.nasa.gov/api/area/

export const FIRMS_CONFIG = {
  defaultKey: 'dcd66ef0fce7a526e35474158db8a7d1',
  // Extent for Indonesia & ASEAN: West, South, East, North
  defaultExtent: '95,-11,141,10',
  defaultSource: 'VIIRS_SNPP_NRT', // 375m high resolution active fire detection
  cacheDurationMs: 15 * 60 * 1000 // 15 minutes cache
};

export class FirmsService {
  constructor() {
    this.apiKey = localStorage.getItem('firms_api_key') || FIRMS_CONFIG.defaultKey;
    this.cache = new Map();
  }

  setApiKey(key) {
    this.apiKey = key.trim();
    localStorage.setItem('firms_api_key', this.apiKey);
  }

  getApiKey() {
    return this.apiKey;
  }

  async fetchHotspots(options = {}) {
    const {
      source = FIRMS_CONFIG.defaultSource,
      extent = FIRMS_CONFIG.defaultExtent,
      days = 1,
      forceRefresh = false
    } = options;

    const cacheKey = `merged_${extent}_${days}`;
    const cached = this.cache.get(cacheKey);

    if (!forceRefresh && cached && (Date.now() - cached.timestamp < FIRMS_CONFIG.cacheDurationMs)) {
      console.log(`[FIRMS] Serving ${cached.data.length} hotspots from local memory cache`);
      return {
        hotspots: cached.data,
        stats: cached.stats,
        fromCache: true,
        timestamp: cached.timestamp
      };
    }

    try {
      // Query both VIIRS SNPP and VIIRS NOAA-20 to ensure 24h satellite coverage across passes
      const queryDays = Math.max(2, days);
      const urlSnpp = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${this.apiKey}/VIIRS_SNPP_NRT/${extent}/${queryDays}`;
      const urlNoaa20 = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${this.apiKey}/VIIRS_NOAA20_NRT/${extent}/${days === 1 ? 1 : queryDays}`;

      console.log(`[FIRMS] Fetching live multi-satellite fire data (SNPP + NOAA-20)...`);

      const [resSnpp, resNoaa20] = await Promise.allSettled([
        fetch(urlSnpp, { headers: { 'Accept': 'text/plain, text/csv, */*' } }).then(r => r.text()),
        fetch(urlNoaa20, { headers: { 'Accept': 'text/plain, text/csv, */*' } }).then(r => r.text())
      ]);

      let allHotspots = [];

      if (resSnpp.status === 'fulfilled' && !resSnpp.value.includes('Invalid API call')) {
        const snppPoints = this.parseCSV(resSnpp.value);
        allHotspots = allHotspots.concat(snppPoints);
      }

      if (resNoaa20.status === 'fulfilled' && !resNoaa20.value.includes('Invalid API call')) {
        const noaaPoints = this.parseCSV(resNoaa20.value);
        allHotspots = allHotspots.concat(noaaPoints);
      }

      // Deduplicate overlapping detections within 0.005 deg (~500m)
      const seen = new Set();
      let uniqueHotspots = [];
      for (const h of allHotspots) {
        const geoKey = `${h.lat.toFixed(3)}_${h.lon.toFixed(3)}`;
        if (!seen.has(geoKey)) {
          seen.add(geoKey);
          uniqueHotspots.push(h);
        }
      }

      // If user specifically requested 1 day (24 hours):
      // Filter for the most recent calendar date or timestamps within 24 hours
      if (days === 1 && uniqueHotspots.length > 0) {
        // Find most recent acquisition date present in dataset
        const dates = [...new Set(uniqueHotspots.map(h => h.acqDate))].sort().reverse();
        const latestDate = dates[0];
        const prevDate = dates[1];

        // Include all from latest date plus previous date if latest has few points
        const latestPoints = uniqueHotspots.filter(h => h.acqDate === latestDate);
        if (latestPoints.length > 300) {
          uniqueHotspots = latestPoints;
        } else if (prevDate) {
          // If today's pass is early in progress, include the 24h preceding cycle
          const prevPoints = uniqueHotspots.filter(h => h.acqDate === prevDate);
          uniqueHotspots = latestPoints.concat(prevPoints.slice(0, 1800));
        }
      }

      const stats = this.computeStats(uniqueHotspots);

      this.cache.set(cacheKey, {
        data: uniqueHotspots,
        stats,
        timestamp: Date.now()
      });

      return {
        hotspots: uniqueHotspots,
        stats,
        fromCache: false,
        timestamp: Date.now()
      };
    } catch (err) {
      console.warn('[FIRMS] API Fetch failed, checking cache:', err);
      if (cached) {
        return {
          hotspots: cached.data,
          stats: cached.stats,
          fromCache: true,
          error: err.message,
          timestamp: cached.timestamp
        };
      }
      throw err;
    }
  }

  parseCSV(csvText) {
    const lines = csvText.trim().split(/\r?\n/);
    if (lines.length <= 1) return [];

    const headers = lines[0].split(',').map(h => h.trim());
    const latIdx = headers.indexOf('latitude');
    const lonIdx = headers.indexOf('longitude');
    const bright4Idx = headers.indexOf('bright_ti4') !== -1 ? headers.indexOf('bright_ti4') : headers.indexOf('brightness');
    const bright5Idx = headers.indexOf('bright_ti5');
    const frpIdx = headers.indexOf('frp');
    const confIdx = headers.indexOf('confidence');
    const dateIdx = headers.indexOf('acq_date');
    const timeIdx = headers.indexOf('acq_time');
    const dayNightIdx = headers.indexOf('daynight');
    const satIdx = headers.indexOf('satellite');
    const instIdx = headers.indexOf('instrument');

    const results = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const parts = line.split(',');
      if (parts.length < headers.length) continue;

      const lat = parseFloat(parts[latIdx]);
      const lon = parseFloat(parts[lonIdx]);
      if (isNaN(lat) || isNaN(lon)) continue;

      const bright4 = bright4Idx !== -1 ? parseFloat(parts[bright4Idx]) : 300;
      const frp = frpIdx !== -1 ? parseFloat(parts[frpIdx]) : 0;
      const conf = confIdx !== -1 ? parts[confIdx] : 'nominal';
      const date = dateIdx !== -1 ? parts[dateIdx] : '';
      const rawTime = timeIdx !== -1 ? parts[timeIdx] : '';
      const daynight = dayNightIdx !== -1 ? parts[dayNightIdx] : 'D';

      // Format time into HH:MM UTC & WIB
      const paddedTime = rawTime.padStart(4, '0');
      const hoursUtc = parseInt(paddedTime.slice(0, 2), 10) || 0;
      const minsUtc = parseInt(paddedTime.slice(2, 4), 10) || 0;
      const hoursWib = (hoursUtc + 7) % 24;
      const timeWib = `${String(hoursWib).padStart(2, '0')}:${String(minsUtc).padStart(2, '0')} WIB`;

      const tempCelsius = bright4 > 0 ? (bright4 - 273.15).toFixed(1) : null;

      // Identify island / region
      const region = this.identifyRegion(lat, lon);

      results.push({
        id: `fire_${i}_${lat.toFixed(3)}_${lon.toFixed(3)}`,
        lat,
        lon,
        brightness: bright4,
        tempCelsius: parseFloat(tempCelsius),
        frp: isNaN(frp) ? 0 : Math.round(frp * 10) / 10,
        confidence: conf === 'h' ? 'Tinggi' : (conf === 'l' ? 'Rendah' : 'Sedang'),
        rawConfidence: conf,
        acqDate: date,
        acqTime: timeWib,
        daynight: daynight === 'D' ? 'Siang' : 'Malam',
        satellite: satIdx !== -1 ? parts[satIdx] : 'VIIRS',
        region
      });
    }

    return results;
  }

  identifyRegion(lat, lon) {
    if (lon < 106.0 && lat > -6.0) return 'Sumatera';
    if (lon >= 106.0 && lon <= 118.0 && lat >= -5.0 && lat <= 7.0) return 'Kalimantan';
    if (lat < -5.5 && lon >= 105.0 && lon <= 116.0) return 'Jawa - Bali';
    if (lon > 118.0 && lon <= 126.0 && lat >= -6.0 && lat <= 4.0) return 'Sulawesi';
    if (lat < -7.5 && lon > 115.0 && lon <= 128.0) return 'Nusa Tenggara';
    if (lon > 126.0 && lon <= 133.0) return 'Maluku';
    if (lon > 133.0) return 'Papua';
    return 'Lainnya';
  }

  computeStats(hotspots) {
    const total = hotspots.length;
    let highConf = 0;
    let maxFrp = 0;
    let maxTemp = 0;
    const regionCounts = {};

    for (const h of hotspots) {
      if (h.rawConfidence === 'h') highConf++;
      if (h.frp > maxFrp) maxFrp = h.frp;
      if (h.tempCelsius > maxTemp) maxTemp = h.tempCelsius;
      regionCounts[h.region] = (regionCounts[h.region] || 0) + 1;
    }

    const sortedRegions = Object.entries(regionCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([region, count]) => ({ region, count }));

    return {
      total,
      highConfidence: highConf,
      maxFrp,
      maxTemp,
      regions: sortedRegions,
      topRegion: sortedRegions[0] ? sortedRegions[0].region : 'N/A'
    };
  }
}

export const firmsService = new FirmsService();
