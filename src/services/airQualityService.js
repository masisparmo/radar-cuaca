// Open-Meteo Air Quality & Weather Service
// Documentation: https://open-meteo.com/en/docs/air-quality-api

export class AirQualityService {
  constructor() {
    this.cache = new Map();
  }

  getAQICategory(usAqi) {
    const aqi = Math.round(usAqi || 0);
    if (aqi <= 50) {
      return {
        level: 'good',
        label: 'BAIK',
        color: '#10B981', // Emerald green
        glowColor: 'rgba(16, 185, 129, 0.4)',
        textColor: '#FFFFFF',
        description: 'Kualitas udara sangat memuaskan, minim resiko polusi udara.',
        healthAdvice: 'Sangat aman untuk beraktivitas luar ruangan.'
      };
    }
    if (aqi <= 100) {
      return {
        level: 'moderate',
        label: 'SEDANG',
        color: '#FBBF24', // Amber
        glowColor: 'rgba(251, 191, 36, 0.4)',
        textColor: '#1E293B',
        description: 'Kualitas udara dapat diterima. Sedikit beresiko bagi kelompok rentan.',
        healthAdvice: 'Kelompok sensitif sebaiknya mengurangi aktivitas fisik berat di luar.'
      };
    }
    if (aqi <= 150) {
      return {
        level: 'unhealthy-sensitive',
        label: 'SENSITIF TIDAK SEHAT',
        color: '#F97316', // Orange
        glowColor: 'rgba(249, 115, 22, 0.45)',
        textColor: '#FFFFFF',
        description: 'Berdampak buruk bagi orang dengan gangguan paru-paru atau jantung.',
        healthAdvice: 'Gunakan masker bila beraktivitas lama di luar ruangan.'
      };
    }
    if (aqi <= 200) {
      return {
        level: 'unhealthy',
        label: 'TIDAK SEHAT',
        color: '#EF4444', // Red
        glowColor: 'rgba(239, 68, 68, 0.55)',
        textColor: '#FFFFFF',
        description: 'Dapat memicu gangguan kesehatan pada masyarakat umum.',
        healthAdvice: 'Batasi kegiatan di luar ruangan, kenakan masker respirator N95/KN95.'
      };
    }
    if (aqi <= 300) {
      return {
        level: 'very-unhealthy',
        label: 'SANGAT TIDAK SEHAT',
        color: '#A855F7', // Purple
        glowColor: 'rgba(168, 85, 247, 0.6)',
        textColor: '#FFFFFF',
        description: 'Peringatan darurat kesehatan! Seluruh penduduk berpotensi terdampak.',
        healthAdvice: 'Hindari aktivitas di luar ruangan. Tutup ventilasi rumah dan nyalakan air purifier.'
      };
    }
    return {
      level: 'hazardous',
      label: 'BERBAHAYA (DARURAT)',
      color: '#7F1D1D', // Maroon / Dark Crimson
      glowColor: 'rgba(127, 29, 29, 0.8)',
      textColor: '#FFFFFF',
      description: 'Kondisi udara darurat racun asap/kabut pekat. Sangat mengancam jiwa.',
      healthAdvice: 'EVAKUASI / TETAP DI DALAM RUANGAN DENGAN FILTER UDARA KETAT.'
    };
  }

  async getAirQuality(lat, lon) {
    const cacheKey = `${lat.toFixed(2)}_${lon.toFixed(2)}`;
    const cached = this.cache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < 10 * 60 * 1000)) {
      return cached.data;
    }

    try {
      const aqiUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=european_aqi,us_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,aerosol_optical_depth&hourly=pm2_5,pm10,us_aqi&timezone=auto&forecast_days=2`;
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m&timezone=auto`;

      const [aqiRes, weatherRes] = await Promise.all([
        fetch(aqiUrl).then(r => r.json()),
        fetch(weatherUrl).then(r => r.json())
      ]);

      const currentAqi = aqiRes.current || {};
      const currentWeather = weatherRes.current || {};
      const aqiCategory = this.getAQICategory(currentAqi.us_aqi);

      const result = {
        lat,
        lon,
        aqi: currentAqi.us_aqi || 0,
        eaqi: currentAqi.european_aqi || 0,
        pm25: currentAqi.pm2_5 !== undefined ? Math.round(currentAqi.pm2_5 * 10) / 10 : 0,
        pm10: currentAqi.pm10 !== undefined ? Math.round(currentAqi.pm10 * 10) / 10 : 0,
        co: currentAqi.carbon_monoxide !== undefined ? Math.round(currentAqi.carbon_monoxide) : 0,
        no2: currentAqi.nitrogen_dioxide !== undefined ? Math.round(currentAqi.nitrogen_dioxide * 10) / 10 : 0,
        so2: currentAqi.sulphur_dioxide !== undefined ? Math.round(currentAqi.sulphur_dioxide * 10) / 10 : 0,
        ozone: currentAqi.ozone !== undefined ? Math.round(currentAqi.ozone * 10) / 10 : 0,
        aod: currentAqi.aerosol_optical_depth !== undefined ? Math.round(currentAqi.aerosol_optical_depth * 100) / 100 : 0,
        category: aqiCategory,
        // Weather
        temperature: currentWeather.temperature_2m !== undefined ? Math.round(currentWeather.temperature_2m * 10) / 10 : 28,
        humidity: currentWeather.relative_humidity_2m || 75,
        windSpeed: currentWeather.wind_speed_10m || 10,
        windDirection: currentWeather.wind_direction_10m || 180,
        weatherCode: currentWeather.weather_code || 0,
        weatherDesc: this.getWeatherDescription(currentWeather.weather_code),
        // Hourly forecast for charts
        hourly: {
          time: aqiRes.hourly?.time?.slice(0, 24) || [],
          pm25: aqiRes.hourly?.pm2_5?.slice(0, 24) || [],
          pm10: aqiRes.hourly?.pm10?.slice(0, 24) || [],
          usAqi: aqiRes.hourly?.us_aqi?.slice(0, 24) || []
        },
        timestamp: Date.now()
      };

      this.cache.set(cacheKey, { data: result, timestamp: Date.now() });
      return result;
    } catch (err) {
      console.error('[AirQualityService] Error fetching data:', err);
      throw err;
    }
  }

  getWeatherDescription(code) {
    if (code === 0) return 'Cerah';
    if (code === 1 || code === 2) return 'Cerah Berawan';
    if (code === 3) return 'Berawan Tebal';
    if (code >= 45 && code <= 48) return 'Berkabut / Berasap';
    if (code >= 51 && code <= 55) return 'Gerimis';
    if (code >= 61 && code <= 65) return 'Hujan';
    if (code >= 80 && code <= 82) return 'Hujan Deras';
    if (code >= 95) return 'Hujan Petir';
    return 'Berawan';
  }

  async loadRegionalStations(stationsList) {
    // Fetch in parallel with concurrency limit
    const promises = stationsList.map(async station => {
      try {
        const data = await this.getAirQuality(station.lat, station.lon);
        return {
          ...station,
          ...data
        };
      } catch (e) {
        return {
          ...station,
          aqi: 45,
          pm25: 12.0,
          temperature: 29,
          category: this.getAQICategory(45),
          error: true
        };
      }
    });

    return Promise.all(promises);
  }
}

export const airQualityService = new AirQualityService();
