// Leaflet Map Controller with Dark Matter & Satellite basemaps
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { REGIONAL_STATIONS } from '../data/stations.js';

export class MapController {
  constructor(containerId, options = {}) {
    this.containerId = containerId;
    this.options = options;
    this.map = null;
    this.tileLayers = {};
    this.activeBaseLayer = 'light';
    this.stationMarkers = [];
    this.stationsLayerGroup = L.layerGroup();
    this.onSelectStation = null;
    this.onMapClick = null;
    this.init();
  }

  init() {
    // Center of Indonesia & Southeast Asia
    this.map = L.map(this.containerId, {
      center: [-1.8, 116.5],
      zoom: 5,
      minZoom: 3,
      maxZoom: 14,
      zoomControl: false,
      attributionControl: false
    });

    // 1. Dark Mode Basemap (Clean, No Watermark, Esri Dark Gray Canvas + Labels)
    const darkBase = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 16,
      attribution: 'Esri, HERE, Garmin'
    });
    const darkLabels = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 16,
      pane: 'shadowPane'
    });
    this.tileLayers.dark = L.layerGroup([darkBase, darkLabels]);

    // 2. Light Mode Basemap (Clean, No Watermark, Esri Light Gray Canvas + Labels)
    const lightBase = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 16,
      attribution: 'Esri, HERE, Garmin'
    });
    const lightLabels = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 16,
      pane: 'shadowPane'
    });
    this.tileLayers.light = L.layerGroup([lightBase, lightLabels]);

    // 3. Satellite Imagery with Political Boundaries & Labels
    const satBase = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 18,
      attribution: 'Esri, Maxar, Earthstar Geographics'
    });
    const satLabels = L.tileLayer('https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 18,
      pane: 'shadowPane'
    });
    this.tileLayers.satellite = L.layerGroup([satBase, satLabels]);

    // 4. Standard OpenStreetMap
    this.tileLayers.streets = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: 'OpenStreetMap'
    });

    // Default to Light Mode basemap; stationsLayerGroup starts OFF
    this.tileLayers.light.addTo(this.map);

    this.bindMapEvents();
  }

  setBaseLayer(type) {
    if (this.tileLayers[type] && this.activeBaseLayer !== type) {
      this.map.removeLayer(this.tileLayers[this.activeBaseLayer]);
      this.tileLayers[type].addTo(this.map);
      this.activeBaseLayer = type;
    }
  }

  bindMapEvents() {
    this.map.on('click', (e) => {
      if (this.onMapClick) {
        this.onMapClick(e.latlng.lat, e.latlng.lng);
      }
    });
  }

  renderStations(stationsData) {
    this.stationsLayerGroup.clearLayers();
    this.stationMarkers = [];

    for (const st of stationsData) {
      const aqiCat = st.category || { color: '#10B981', label: 'BAIK' };
      const temp = st.temperature !== undefined ? `${st.temperature}°` : '';
      const aqi = st.aqi !== undefined ? st.aqi : '--';

      // Custom Windy-styled city badge HTML with clear AQI indicator
      const html = `
        <div class="city-marker-badge" data-id="${st.id}" title="Stasiun ${st.name}: Suhu ${temp}, Indeks Kualitas Udara US AQI ${aqi} (${aqiCat.label})">
          <span class="city-name">${st.name}</span>
          <span class="city-temp">${temp}</span>
          <span class="city-aqi-pill" style="background-color: ${aqiCat.color};">
            AQI ${aqi}
          </span>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-city-marker-container',
        html: html,
        iconSize: [110, 26],
        iconAnchor: [55, 13]
      });

      const marker = L.marker([st.lat, st.lon], { icon: customIcon });

      marker.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        if (this.onSelectStation) {
          this.onSelectStation(st);
        }
      });

      marker.addTo(this.stationsLayerGroup);
      this.stationMarkers.push(marker);
    }
  }

  toggleStations(visible) {
    if (visible) {
      if (!this.map.hasLayer(this.stationsLayerGroup)) {
        this.stationsLayerGroup.addTo(this.map);
      }
    } else {
      if (this.map.hasLayer(this.stationsLayerGroup)) {
        this.map.removeLayer(this.stationsLayerGroup);
      }
    }
  }

  flyTo(lat, lon, zoom = 7) {
    this.map.flyTo([lat, lon], zoom, {
      duration: 1.5,
      easeLinearity: 0.25
    });
  }

  zoomIn() {
    this.map.zoomIn();
  }

  zoomOut() {
    this.map.zoomOut();
  }

  locateUser() {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          this.flyTo(lat, lon, 8);
          if (this.onMapClick) {
            this.onMapClick(lat, lon);
          }
        },
        (err) => {
          alert('Tidak dapat mendeteksi lokasi: ' + err.message);
        }
      );
    }
  }
}
