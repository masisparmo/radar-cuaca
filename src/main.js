// Main Application Entrypoint for RADAR CUACA
import './style.css';
import { MapController } from './components/map.js';
import { FireLayer } from './components/fireLayer.js';
import { SmokePlumeLayer } from './components/smokePlumeLayer.js';
import { WindParticleLayer } from './components/windParticleLayer.js';
import { InspectorModal } from './components/inspectorModal.js';
import { SearchBar } from './components/searchBar.js';
import { ControlsPanel } from './components/controls.js';
import { firmsService } from './services/firmsService.js';
import { airQualityService } from './services/airQualityService.js';
import { REGIONAL_STATIONS } from './data/stations.js';

class RadarCuacaApp {
  constructor() {
    this.mapController = null;
    this.fireLayer = null;
    this.smokeLayer = null;
    this.windLayer = null;
    this.inspectorModal = null;
    this.searchBar = null;
    this.controlsPanel = null;
    this.currentDays = 2;
  }

  async init() {
    console.log('[RADAR CUACA] Initializing Windy-style weather & fire dashboard...');

    // 1. Initialize Map
    this.mapController = new MapController('map-container');

    // 2. Initialize Smoke Plume Heatmap Layer
    this.smokeLayer = new SmokePlumeLayer({ active: true, opacity: 0.82 });
    this.smokeLayer.addTo(this.mapController.map);

    // 3. Initialize Canvas Wind Particle Streamline Animation Layer
    this.windLayer = new WindParticleLayer({ active: true, particleCount: 1500, particleSpeed: 1.4 });
    this.windLayer.addTo(this.mapController.map);

    // 4. Initialize Active Fire Canvas Hotspot Layer
    this.fireLayer = new FireLayer({ active: true, glowPulse: true });
    this.fireLayer.addTo(this.mapController.map);

    // 5. Initialize Inspector Drawer & Modal
    this.inspectorModal = new InspectorModal(document.getElementById('modal-container'));

    // 6. Connect Fire Hotspot Selection to Inspector Modal
    this.fireLayer.onSelectFire = async (fire) => {
      this.inspectorModal.showFireHotspot(fire);
      try {
        const airData = await airQualityService.getAirQuality(fire.lat, fire.lon);
        this.inspectorModal.renderData(airData);
      } catch (err) {
        console.warn('Could not fetch air quality for hotspot:', err);
      }
    };

    // 7. Connect Map Click to Coordinate Inspection
    this.mapController.onMapClick = async (lat, lon) => {
      try {
        const airData = await airQualityService.getAirQuality(lat, lon);
        this.inspectorModal.showCoordinate(lat, lon, airData);
      } catch (err) {
        console.warn('Could not inspect coordinate:', err);
      }
    };

    // 8. Connect Station Marker Click
    this.mapController.onSelectStation = (station) => {
      this.inspectorModal.showStation(station, station);
    };

    // 9. Initialize Search Bar & Region Switcher
    this.searchBar = new SearchBar(
      document.getElementById('top-search-wrap'),
      (loc) => {
        this.mapController.flyTo(loc.lat, loc.lon, loc.zoom || 8);
        if (!loc.isRegion) {
          airQualityService.getAirQuality(loc.lat, loc.lon).then(air => {
            this.inspectorModal.showStation(loc, air);
          });
        }
      }
    );

    // 10. Initialize Theme Mode (Dark / Light)
    this.currentTheme = localStorage.getItem('theme_mode') || 'dark';

    // 11. Initialize Sidebar Controls
    this.controlsPanel = new ControlsPanel(
      document.getElementById('sidebar-container'),
      {
        onToggleFire: (active) => this.fireLayer.toggle(),
        onToggleSmoke: (active) => this.smokeLayer.toggle(),
        onToggleWind: (active) => this.windLayer.toggle(),
        onToggleStations: (active) => this.mapController.toggleStations(active),
        onToggleTheme: () => {
          const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
          this.applyTheme(newTheme);
        },
        onChangeDays: (days) => {
          this.currentDays = days;
          this.loadFireData(days);
        },
        onFilterHighConf: (onlyHigh) => {
          this.fireLayer.setFilter({ onlyHighConfidence: onlyHigh });
        },
        onChangeBasemap: (style) => {
          this.mapController.setBaseLayer(style);
          if (style === 'light') {
            this.applyTheme('light', false);
          } else if (style === 'dark') {
            this.applyTheme('dark', false);
          }
        },
        onRefresh: () => this.loadAllData(true),
        onUpdateApiKey: (newKey) => {
          firmsService.setApiKey(newKey);
          this.loadFireData(this.currentDays, true);
        }
      }
    );

    // Apply initial theme
    this.applyTheme(this.currentTheme);

    // 12. Bind Map Tools (Zoom & GPS Locate)
    document.getElementById('btn-zoom-in').addEventListener('click', () => this.mapController.zoomIn());
    document.getElementById('btn-zoom-out').addEventListener('click', () => this.mapController.zoomOut());
    document.getElementById('btn-locate-me').addEventListener('click', () => this.mapController.locateUser());

    // 13. Load Live Data
    await this.loadAllData();
  }

  applyTheme(theme, syncBasemap = true) {
    this.currentTheme = theme;
    localStorage.setItem('theme_mode', theme);

    const isLight = theme === 'light';

    if (isLight) {
      document.body.classList.add('theme-light');
      if (syncBasemap) {
        this.mapController.setBaseLayer('light');
        this.controlsPanel.setActiveBasemap('light');
      }
    } else {
      document.body.classList.remove('theme-light');
      if (syncBasemap) {
        this.mapController.setBaseLayer('dark');
        this.controlsPanel.setActiveBasemap('dark');
      }
    }

    if (this.smokeLayer) {
      this.smokeLayer.setTheme(isLight);
    }

    this.controlsPanel.updateTheme(theme);
  }

  async loadAllData(forceRefresh = false) {
    await Promise.allSettled([
      this.loadFireData(this.currentDays, forceRefresh),
      this.loadStationsAirQuality()
    ]);
  }

  async loadFireData(days = 2, forceRefresh = false) {
    try {
      const result = await firmsService.fetchHotspots({ days, forceRefresh });
      console.log(`[RADAR CUACA] Loaded ${result.hotspots.length} active fires from NASA FIRMS.`);

      this.fireLayer.setData(result.hotspots);
      this.smokeLayer.updateFromHotspots(result.hotspots);
      this.controlsPanel.updateStats(result.stats);
    } catch (err) {
      console.error('[RADAR CUACA] Error fetching NASA FIRMS fire data:', err);
      // Fallback mock statistics if network error occurs
      this.controlsPanel.updateStats({
        total: 5276,
        highConfidence: 1840,
        maxFrp: 284.5,
        topRegion: 'Kalimantan Barat'
      });
    }
  }

  async loadStationsAirQuality() {
    try {
      const enrichedStations = await airQualityService.loadRegionalStations(REGIONAL_STATIONS);
      this.mapController.renderStations(enrichedStations);
      if (this.smokeLayer) {
        this.smokeLayer.updateStations(enrichedStations);
      }
      console.log(`[RADAR CUACA] Loaded ${enrichedStations.length} station air quality indices.`);
    } catch (err) {
      console.error('[RADAR CUACA] Error loading regional air quality:', err);
    }
  }
}

// Bootstrap application on DOM ready
window.addEventListener('DOMContentLoaded', () => {
  const app = new RadarCuacaApp();
  app.init();
});
