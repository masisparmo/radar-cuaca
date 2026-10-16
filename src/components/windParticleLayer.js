// Windy-style Canvas Wind Particle Simulation Layer for Leaflet
import L from 'leaflet';

export class WindParticleLayer {
  constructor(options = {}) {
    this.options = Object.assign({
      particleCount: 1600,
      particleSpeed: 1.4,
      particleTrail: 0.92,
      lineWidth: 1.2,
      color: 'rgba(235, 245, 255, 0.75)',
      active: true
    }, options);

    this.particles = [];
    this.animationId = null;
    this.canvas = null;
    this.ctx = null;
    this.map = null;
    this.windField = null;
  }

  addTo(map) {
    this.map = map;
    this.initCanvas();
    this.initWindField();
    this.initParticles();
    this.bindEvents();
    if (this.options.active) {
      this.start();
    }
    return this;
  }

  initCanvas() {
    this.canvas = L.DomUtil.create('canvas', 'wind-particle-canvas');
    this.canvas.style.position = 'absolute';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.pointerEvents = 'none';
    this.canvas.style.zIndex = '350';

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

    this.resetParticles();
  }

  initWindField() {
    // Generate regional wind vector field across Southeast Asia (Monsoon & trade winds)
    // u = East-West component (+ is East), v = North-South component (+ is North)
    this.windField = (lat, lon) => {
      // Base wind vector modeled after current regional circulation (SE trade winds transitioning near ITCZ)
      let u = 0;
      let v = 0;

      if (lat < -2.0) {
        // Southern Indonesia: East-Southeast winds (blowing towards West-Northwest)
        u = -12.0 + Math.sin(lat * 0.5) * 3;
        v = 4.0 + Math.cos(lon * 0.2) * 2;
      } else if (lat > 2.0) {
        // Northern Indonesia & Malacca / South China Sea: Southwest monsoon
        u = 10.0 + Math.sin(lon * 0.3) * 4;
        v = 11.0 + Math.cos(lat * 0.4) * 3;
      } else {
        // Equatorial convergence zone: Light variable winds with local convection
        u = -4.0 + Math.sin(lon * 0.8) * 6;
        v = 3.0 + Math.cos(lat * 1.2) * 4;
      }

      // Add gentle turbulence
      const turb = Math.sin(lat * 3.0 + lon * 2.0) * 2.5;
      u += turb;
      v += Math.cos(lat * 2.0 - lon * 3.0) * 2.0;

      const speed = Math.sqrt(u * u + v * v);
      return { u, v, speed };
    };
  }

  initParticles() {
    this.particles = [];
    const count = this.options.particleCount;
    for (let i = 0; i < count; i++) {
      this.particles.push(this.createParticle(true));
    }
  }

  createParticle(randomAge = false) {
    const maxAge = 60 + Math.random() * 80;
    return {
      x: Math.random() * (this.width || window.innerWidth),
      y: Math.random() * (this.height || window.innerHeight),
      age: randomAge ? Math.floor(Math.random() * maxAge) : 0,
      maxAge: maxAge,
      speedMult: 0.8 + Math.random() * 0.6
    };
  }

  resetParticles() {
    if (!this.width || !this.height) return;
    for (const p of this.particles) {
      p.x = Math.random() * this.width;
      p.y = Math.random() * this.height;
    }
  }

  bindEvents() {
    this.map.on('moveend resize', () => {
      this.resizeCanvas();
    });

    this.map.on('movestart', () => {
      if (this.ctx) {
        this.ctx.clearRect(0, 0, this.width, this.height);
      }
    });
  }

  start() {
    if (this.animationId) return;
    this.options.active = true;
    if (this.canvas) this.canvas.style.display = 'block';

    const animate = () => {
      this.drawFrame();
      this.animationId = requestAnimationFrame(animate);
    };
    this.animationId = requestAnimationFrame(animate);
  }

  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    this.options.active = false;
    if (this.canvas) {
      this.canvas.style.display = 'none';
      if (this.ctx) this.ctx.clearRect(0, 0, this.width, this.height);
    }
  }

  toggle() {
    if (this.options.active) {
      this.stop();
      return false;
    } else {
      this.start();
      return true;
    }
  }

  drawFrame() {
    if (!this.ctx || !this.map || !this.width || !this.height) return;

    const ctx = this.ctx;
    // Fading trail effect for fluid streamline tails
    ctx.save();
    ctx.globalCompositeOperation = 'destination-in';
    ctx.fillStyle = `rgba(0, 0, 0, ${this.options.particleTrail})`;
    ctx.fillRect(0, 0, this.width, this.height);
    ctx.restore();

    ctx.save();
    ctx.lineWidth = this.options.lineWidth;
    ctx.lineCap = 'round';

    const zoom = this.map.getZoom();
    const zoomScale = Math.pow(1.15, zoom - 5);

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];

      if (p.age >= p.maxAge || p.x < 0 || p.x > this.width || p.y < 0 || p.y > this.height) {
        this.particles[i] = this.createParticle(false);
        continue;
      }

      // Convert pixel position to Lat/Lng
      const containerPoint = L.point(p.x, p.y);
      const latlng = this.map.containerPointToLatLng(containerPoint);

      const vector = this.windField(latlng.lat, latlng.lng);

      // Pixel delta (y in screen coordinates is inverted for North/South)
      const dx = vector.u * 0.12 * this.options.particleSpeed * p.speedMult * zoomScale;
      const dy = -vector.v * 0.12 * this.options.particleSpeed * p.speedMult * zoomScale;

      const nextX = p.x + dx;
      const nextY = p.y + dy;

      // Opacity based on particle age lifecycle (fade in, peak, fade out)
      const lifeRatio = p.age / p.maxAge;
      let alpha = 1.0;
      if (lifeRatio < 0.2) {
        alpha = lifeRatio / 0.2;
      } else if (lifeRatio > 0.7) {
        alpha = (1.0 - lifeRatio) / 0.3;
      }
      alpha = Math.max(0.05, Math.min(0.85, alpha));

      // Color variation according to wind velocity
      if (vector.speed > 16) {
        ctx.strokeStyle = `rgba(255, 230, 160, ${alpha * 0.9})`; // Higher speed warm tint
      } else {
        ctx.strokeStyle = `rgba(220, 240, 255, ${alpha * 0.8})`; // Crisp cool wind
      }

      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(nextX, nextY);
      ctx.stroke();

      p.x = nextX;
      p.y = nextY;
      p.age++;
    }

    ctx.restore();
  }
}
