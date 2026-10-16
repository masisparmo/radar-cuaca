// High Performance Canvas Active Fire Hotspots Layer
import L from 'leaflet';

export class FireLayer {
  constructor(options = {}) {
    this.options = Object.assign({
      active: true,
      minFrp: 0,
      onlyHighConfidence: false,
      glowPulse: true
    }, options);

    this.hotspots = [];
    this.visibleHotspots = [];
    this.map = null;
    this.canvas = null;
    this.ctx = null;
    this.pulsePhase = 0;
    this.animId = null;
    this.onSelectFire = null;
  }

  addTo(map) {
    this.map = map;
    this.initCanvas();
    this.bindEvents();
    this.startPulse();
    return this;
  }

  initCanvas() {
    this.canvas = L.DomUtil.create('canvas', 'fire-hotspot-canvas');
    this.canvas.style.position = 'absolute';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.zIndex = '400';
    this.canvas.style.cursor = 'crosshair';

    this.map.getPanes().overlayPane.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');
    this.resizeCanvas();
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

    // Hit test on canvas click
    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      this.handleClick(clickX, clickY);
    });
  }

  setData(hotspots) {
    this.hotspots = hotspots || [];
    this.applyFilters();
  }

  applyFilters() {
    this.visibleHotspots = this.hotspots.filter(h => {
      if (this.options.onlyHighConfidence && h.rawConfidence !== 'h') return false;
      if (h.frp < this.options.minFrp) return false;
      return true;
    });
    this.render();
  }

  setFilter(options) {
    Object.assign(this.options, options);
    this.applyFilters();
  }

  startPulse() {
    if (this.animId) return;
    const pulseLoop = () => {
      this.pulsePhase = (this.pulsePhase + 0.05) % (Math.PI * 2);
      this.render();
      this.animId = requestAnimationFrame(pulseLoop);
    };
    this.animId = requestAnimationFrame(pulseLoop);
  }

  stopPulse() {
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
  }

  render() {
    if (!this.ctx || !this.map || !this.options.active) {
      if (this.ctx && this.width && this.height) {
        this.ctx.clearRect(0, 0, this.width, this.height);
      }
      return;
    }

    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    const bounds = this.map.getBounds();
    const zoom = this.map.getZoom();
    const pulseFactor = 1.0 + Math.sin(this.pulsePhase) * 0.25;

    // Filter points in viewport
    const inView = [];
    for (let i = 0; i < this.visibleHotspots.length; i++) {
      const h = this.visibleHotspots[i];
      if (h.lat >= bounds.getSouth() && h.lat <= bounds.getNorth() &&
          h.lon >= bounds.getWest() && h.lon <= bounds.getEast()) {
        const pt = this.map.latLngToContainerPoint([h.lat, h.lon]);
        h._px = pt.x;
        h._py = pt.y;
        inView.push(h);
      }
    }

    // Pass 1: Outer fire glow & thermal heat blur
    ctx.save();
    ctx.globalCompositeOperation = 'screen';

    for (let i = 0; i < inView.length; i++) {
      const h = inView[i];
      const isHigh = h.rawConfidence === 'h';
      const baseRadius = Math.max(3, Math.min(18, (h.frp ? Math.sqrt(h.frp) * 2.2 : 4) * (zoom >= 7 ? 1.4 : 0.9)));
      const radius = baseRadius * pulseFactor;

      const grad = ctx.createRadialGradient(h._px, h._py, 0, h._px, h._py, radius);
      if (isHigh || h.frp > 15) {
        grad.addColorStop(0, 'rgba(255, 255, 200, 0.95)');
        grad.addColorStop(0.25, 'rgba(255, 120, 20, 0.85)');
        grad.addColorStop(0.6, 'rgba(230, 20, 10, 0.45)');
        grad.addColorStop(1, 'rgba(160, 0, 0, 0)');
      } else {
        grad.addColorStop(0, 'rgba(255, 180, 50, 0.8)');
        grad.addColorStop(0.4, 'rgba(240, 70, 20, 0.5)');
        grad.addColorStop(1, 'rgba(180, 20, 0, 0)');
      }

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(h._px, h._py, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Pass 2: Sharp core flame center
    ctx.save();
    for (let i = 0; i < inView.length; i++) {
      const h = inView[i];
      const isHigh = h.rawConfidence === 'h';
      const coreRadius = isHigh ? 2.5 : 1.8;

      ctx.beginPath();
      ctx.arc(h._px, h._py, coreRadius, 0, Math.PI * 2);
      ctx.fillStyle = isHigh ? '#FFF7ED' : '#FDE047';
      ctx.fill();
    }
    ctx.restore();
  }

  handleClick(clickX, clickY) {
    if (!this.visibleHotspots.length) return;

    // Find closest hotspot within 16px radius
    let closest = null;
    let minDistance = 18;

    for (const h of this.visibleHotspots) {
      if (h._px !== undefined && h._py !== undefined) {
        const dist = Math.hypot(h._px - clickX, h._py - clickY);
        if (dist < minDistance) {
          minDistance = dist;
          closest = h;
        }
      }
    }

    if (closest && this.onSelectFire) {
      this.onSelectFire(closest);
    }
  }

  toggle() {
    this.options.active = !this.options.active;
    if (this.canvas) {
      this.canvas.style.display = this.options.active ? 'block' : 'none';
    }
    this.render();
    return this.options.active;
  }
}
