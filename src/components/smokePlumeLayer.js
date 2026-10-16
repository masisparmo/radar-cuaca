// Continuous Ambient & Regional Air Quality Heatmap Layer (Windy Style)
import L from 'leaflet';

export class SmokePlumeLayer {
  constructor(options = {}) {
    this.options = Object.assign({
      active: true,
      opacity: 0.76
    }, options);

    this.map = null;
    this.canvas = null;
    this.ctx = null;
    this.stations = [];
    this.fireClusters = [];
    this.isLightMode = false;
  }

  addTo(map) {
    this.map = map;
    this.initCanvas();
    this.bindEvents();
    return this;
  }

  initCanvas() {
    this.canvas = L.DomUtil.create('canvas', 'smoke-plume-canvas');
    this.canvas.style.position = 'absolute';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.pointerEvents = 'none';
    this.canvas.style.zIndex = '300';
    this.canvas.style.opacity = this.options.opacity;
    this.canvas.style.mixBlendMode = this.isLightMode ? 'multiply' : 'screen';

    this.map.getPanes().overlayPane.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');
    this.resizeCanvas();
  }

  setTheme(isLight) {
    this.isLightMode = isLight;
    if (this.canvas) {
      this.canvas.style.mixBlendMode = isLight ? 'multiply' : 'screen';
      this.canvas.style.opacity = isLight ? '0.62' : this.options.opacity;
    }
    this.render();
  }

  resizeCanvas() {
    if (!this.map || !this.canvas) return;
    const size = this.map.getSize();
    const bounds = this.map.getBounds();
    const nw = this.map.latLngToLayerPoint(bounds.getNorthWest());

    L.DomUtil.setPosition(this.canvas, nw);

    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = size.x * dpr;
    this.canvas.height = size.y * dpr;
    this.canvas.style.width = `${size.x}px`;
    this.canvas.style.height = `${size.y}px`;

    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(dpr, dpr);
    this.width = size.x;
    this.height = size.y;

    this.render();
  }

  bindEvents() {
    this.map.on('moveend resize zoomend', () => {
      this.resizeCanvas();
    });
  }

  // Called when stations air quality data is loaded
  updateStations(stationsData) {
    if (!stationsData) return;
    this.stations = stationsData;
    this.render();
  }

  // Called when NASA FIRMS active fire hotspots are loaded
  updateFromHotspots(hotspots) {
    if (!hotspots || hotspots.length === 0) {
      this.fireClusters = [];
      this.render();
      return;
    }

    // Cluster hotspots into density centers (~1 degree / 111km grid)
    const clusters = {};
    const step = 0.9;

    for (const h of hotspots) {
      const gLat = Math.round(h.lat / step) * step;
      const gLon = Math.round(h.lon / step) * step;
      const key = `${gLat.toFixed(1)}_${gLon.toFixed(1)}`;
      if (!clusters[key]) {
        clusters[key] = { lat: gLat, lon: gLon, count: 0, sumFrp: 0 };
      }
      clusters[key].count++;
      clusters[key].sumFrp += h.frp || 1;
    }

    const sorted = Object.values(clusters)
      .sort((a, b) => b.count - a.count)
      .slice(0, 18);

    this.fireClusters = sorted.map(c => ({
      lat: c.lat,
      lon: c.lon,
      count: c.count,
      intensity: Math.min(1.0, 0.45 + (c.count / 200) * 0.55),
      radiusKm: Math.min(380, 150 + Math.sqrt(c.count) * 14)
    }));

    this.render();
  }

  render() {
    if (!this.ctx || !this.map || !this.options.active || !this.width || !this.height) {
      if (this.ctx && this.width && this.height) {
        this.ctx.clearRect(0, 0, this.width, this.height);
      }
      return;
    }

    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    const bounds = this.map.getBounds();
    const kmPerDegree = 111.32;

    ctx.save();

    // ==============================================================
    // PASS 1: Regional Air Quality Field from all 32 monitoring stations
    // Covers ALL of Indonesia (Sumatera, Jawa, Bali, NTB, NTT, Kalimantan,
    // Sulawesi, Maluku, Papua) with smooth AQI radial color fields.
    // ==============================================================
    const stationsToRender = this.stations.length > 0 ? this.stations : [];

    for (const st of stationsToRender) {
      // Check if within or near viewport
      if (st.lat < bounds.getSouth() - 4 || st.lat > bounds.getNorth() + 4 ||
          st.lon < bounds.getWest() - 4 || st.lon > bounds.getEast() + 4) {
        continue;
      }

      const pt = this.map.latLngToContainerPoint([st.lat, st.lon]);
      const radiusKm = 360; // ~360km dispersion radius per station
      const degRadius = radiusKm / kmPerDegree;
      const edgePt = this.map.latLngToContainerPoint(L.latLng(st.lat, st.lon + degRadius));
      const pixelRadius = Math.max(40, Math.hypot(edgePt.x - pt.x, edgePt.y - pt.y));

      const grad = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, pixelRadius);
      const aqi = st.aqi || 50;

      // Color based on AQI category
      if (aqi > 200) {
        // Very Unhealthy / Hazardous (e.g. Palembang, Jambi, Jakarta)
        grad.addColorStop(0, 'rgba(239, 68, 68, 0.85)');
        grad.addColorStop(0.35, 'rgba(220, 38, 38, 0.65)');
        grad.addColorStop(0.65, 'rgba(185, 28, 28, 0.35)');
        grad.addColorStop(1, 'rgba(153, 27, 27, 0)');
      } else if (aqi > 150) {
        // Unhealthy (e.g. Pekanbaru, Bandung, Surabaya, Banjarmasin)
        grad.addColorStop(0, 'rgba(248, 113, 113, 0.80)');
        grad.addColorStop(0.35, 'rgba(239, 68, 68, 0.55)');
        grad.addColorStop(0.65, 'rgba(220, 38, 38, 0.28)');
        grad.addColorStop(1, 'rgba(180, 20, 20, 0)');
      } else if (aqi > 100) {
        // Sensitive (e.g. Pontianak, Palu, Manado, Merauke)
        grad.addColorStop(0, 'rgba(251, 146, 60, 0.72)');
        grad.addColorStop(0.40, 'rgba(249, 115, 22, 0.48)');
        grad.addColorStop(0.70, 'rgba(217, 119, 6, 0.22)');
        grad.addColorStop(1, 'rgba(180, 83, 9, 0)');
      } else if (aqi > 50) {
        // Moderate (e.g. Bali, Kupang, Kendari, Ambon, Jayapura)
        grad.addColorStop(0, 'rgba(251, 191, 36, 0.60)');
        grad.addColorStop(0.45, 'rgba(245, 158, 11, 0.35)');
        grad.addColorStop(0.75, 'rgba(217, 119, 6, 0.15)');
        grad.addColorStop(1, 'rgba(180, 100, 10, 0)');
      } else {
        // Good / Clean Air
        grad.addColorStop(0, 'rgba(52, 211, 153, 0.55)');
        grad.addColorStop(0.45, 'rgba(16, 185, 129, 0.30)');
        grad.addColorStop(0.75, 'rgba(5, 150, 105, 0.12)');
        grad.addColorStop(1, 'rgba(4, 120, 87, 0)');
      }

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pixelRadius, 0, Math.PI * 2);
      ctx.fill();
    }

    // ==============================================================
    // PASS 2: Intense Fire Plumes from active fire hotspots
    // Blazes over active fire clusters (Sumatra, Kalimantan, Papua)
    // ==============================================================
    for (const plume of this.fireClusters) {
      if (plume.lat < bounds.getSouth() - 4 || plume.lat > bounds.getNorth() + 4 ||
          plume.lon < bounds.getWest() - 4 || plume.lon > bounds.getEast() + 4) {
        continue;
      }

      const pt = this.map.latLngToContainerPoint([plume.lat, plume.lon]);
      const degRadius = plume.radiusKm / kmPerDegree;
      const edgePt = this.map.latLngToContainerPoint(L.latLng(plume.lat, plume.lon + degRadius));
      const pixelRadius = Math.max(35, Math.hypot(edgePt.x - pt.x, edgePt.y - pt.y));

      const grad = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, pixelRadius);
      const int = plume.intensity;

      // Intense fiery red smoke plume (matching Windy screenshot)
      grad.addColorStop(0, `rgba(255, 10, 10, ${0.94 * int})`);
      grad.addColorStop(0.22, `rgba(240, 20, 20, ${0.84 * int})`);
      grad.addColorStop(0.48, `rgba(180, 10, 15, ${0.62 * int})`);
      grad.addColorStop(0.72, `rgba(100, 15, 10, ${0.35 * int})`);
      grad.addColorStop(0.90, `rgba(60, 45, 10, ${0.15 * int})`);
      grad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pixelRadius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  toggle() {
    this.options.active = !this.options.active;
    if (this.canvas) {
      this.canvas.style.display = this.options.active ? 'block' : 'none';
    }
    this.render();
    return this.options.active;
  }

  setOpacity(val) {
    this.options.opacity = val;
    if (this.canvas) {
      this.canvas.style.opacity = val;
    }
  }
}
