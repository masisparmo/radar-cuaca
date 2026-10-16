// Inspector Modal / Drawer Component with Chart.js
import Chart from 'chart.js/auto';

export class InspectorModal {
  constructor(containerEl) {
    this.container = containerEl;
    this.chartInstance = null;
    this.init();
  }

  init() {
    this.container.innerHTML = `
      <div id="inspector-overlay" class="inspector-overlay hidden">
        <div class="inspector-drawer">
          <div class="drawer-header">
            <div class="drawer-drag-handle" title="Klik dan geser untuk memindahkan kotak">
              <div class="drawer-drag-pill"></div>
              <span class="drawer-drag-hint">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/></svg>
                GESER KOTAK
              </span>
            </div>
            <div class="drawer-title-row">
              <div>
                <span class="location-badge" id="insp-type">STASIUN PEMANTAU</span>
                <h2 id="insp-title" class="drawer-title">Jakarta Pusat</h2>
                <p id="insp-subtitle" class="drawer-subtitle">-6.21°, 106.85° • DKI Jakarta</p>
              </div>
              <div class="drawer-header-actions">
                <button id="insp-reset-pos-btn" class="drawer-action-btn" title="Reset posisi ke tengah">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                </button>
                <button id="insp-close-btn" class="drawer-close-btn" title="Tutup (Esc)">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              </div>
            </div>
          </div>

          <div class="drawer-body">
            <!-- AQI Primary Status Banner -->
            <div id="insp-aqi-card" class="aqi-hero-card">
              <div class="aqi-hero-main">
                <div class="aqi-circle-wrap">
                  <div id="insp-aqi-val" class="aqi-circle-value">--</div>
                  <span class="aqi-circle-unit">US AQI</span>
                </div>
                <div class="aqi-hero-info">
                  <div class="aqi-level-badge" id="insp-aqi-badge">MEMUAT...</div>
                  <p id="insp-aqi-desc" class="aqi-desc-text">Mengambil data indeks kualitas udara terkini...</p>
                </div>
              </div>
              <div class="aqi-advice-box">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
                <span id="insp-aqi-advice">Tetap waspada terhadap asap dan partikulat halus.</span>
              </div>
            </div>

            <!-- Weather Quick Overview Bar -->
            <div class="weather-strip">
              <div class="weather-item">
                <span class="weather-label">Suhu</span>
                <span id="insp-temp" class="weather-val">--°C</span>
              </div>
              <div class="weather-item">
                <span class="weather-label">Kelembaban</span>
                <span id="insp-hum" class="weather-val">--%</span>
              </div>
              <div class="weather-item">
                <span class="weather-label">Kecepatan Angin</span>
                <span id="insp-wind" class="weather-val">-- km/jam</span>
              </div>
              <div class="weather-item">
                <span class="weather-label">Kondisi</span>
                <span id="insp-weather-desc" class="weather-val">Cerah</span>
              </div>
            </div>

            <!-- Detailed Pollutants Grid -->
            <h3 class="section-title">Konsentrasi Polutan & Indikator Asap</h3>
            <div class="pollutant-grid">
              <div class="pollutant-card highlight-card">
                <div class="pol-name">PM2.5 (Partikel Halus Asap)</div>
                <div class="pol-val-wrap">
                  <span id="insp-pm25" class="pol-val">--</span>
                  <span class="pol-unit">μg/m³</span>
                </div>
                <div class="pol-bar-bg"><div id="insp-pm25-bar" class="pol-bar-fill" style="width: 0%"></div></div>
                <span class="pol-note">Batas Aman WHO: 15 μg/m³</span>
              </div>

              <div class="pollutant-card">
                <div class="pol-name">PM10 (Debu & Partikulat)</div>
                <div class="pol-val-wrap">
                  <span id="insp-pm10" class="pol-val">--</span>
                  <span class="pol-unit">μg/m³</span>
                </div>
                <div class="pol-bar-bg"><div id="insp-pm10-bar" class="pol-bar-fill" style="width: 0%"></div></div>
                <span class="pol-note">Batas Aman WHO: 45 μg/m³</span>
              </div>

              <div class="pollutant-card">
                <div class="pol-name">CO (Karbon Monoksida)</div>
                <div class="pol-val-wrap">
                  <span id="insp-co" class="pol-val">--</span>
                  <span class="pol-unit">μg/m³</span>
                </div>
                <span class="pol-note">Indikator Pembakaran Hutan/Biomassa</span>
              </div>

              <div class="pollutant-card">
                <div class="pol-name">AOD (Aerosol Optical Depth)</div>
                <div class="pol-val-wrap">
                  <span id="insp-aod" class="pol-val">--</span>
                  <span class="pol-unit">indeks</span>
                </div>
                <span class="pol-note">Ketebalan Kabut Asap Satelit</span>
              </div>

              <div class="pollutant-card">
                <div class="pol-name">NO₂ (Nitrogen Dioksida)</div>
                <div class="pol-val-wrap">
                  <span id="insp-no2" class="pol-val">--</span>
                  <span class="pol-unit">μg/m³</span>
                </div>
                <span class="pol-note">Emisi Gas Buang</span>
              </div>

              <div class="pollutant-card">
                <div class="pol-name">O₃ (Ozon Permukaan)</div>
                <div class="pol-val-wrap">
                  <span id="insp-o3" class="pol-val">--</span>
                  <span class="pol-unit">μg/m³</span>
                </div>
                <span class="pol-note">Fotokimia Atmosfer</span>
              </div>
            </div>

            <!-- 24-Hour Forecast Chart -->
            <div class="chart-container-card">
              <div class="chart-header">
                <h3 class="section-title">Prediksi Tren PM2.5 & AQI (24 Jam ke Depan)</h3>
                <span class="source-tag">Open-Meteo AI Forecast</span>
              </div>
              <div class="chart-canvas-wrap">
                <canvas id="insp-forecast-chart"></canvas>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.drawerEl = this.container.querySelector('.inspector-drawer');
    this.headerEl = this.container.querySelector('.drawer-header');
    this.hasCustomPosition = false;

    document.getElementById('insp-close-btn').addEventListener('click', () => {
      this.close();
    });

    const resetBtn = document.getElementById('insp-reset-pos-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.resetPosition();
      });
    }

    document.getElementById('inspector-overlay').addEventListener('click', (e) => {
      if (e.target.id === 'inspector-overlay') {
        this.close();
      }
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.close();
      }
    });

    this.setupDraggable();
  }

  setupDraggable() {
    const drawer = this.drawerEl;
    const header = this.headerEl;
    if (!drawer || !header) return;

    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let initialLeft = 0;
    let initialTop = 0;

    const onPointerDown = (e) => {
      if (e.target.closest('button') || e.target.closest('input') || e.target.closest('a')) {
        return;
      }
      if (e.button !== undefined && e.button !== 0) return;

      isDragging = true;
      drawer.classList.add('is-dragging');

      const rect = drawer.getBoundingClientRect();
      drawer.style.position = 'fixed';
      drawer.style.left = `${rect.left}px`;
      drawer.style.top = `${rect.top}px`;
      drawer.style.right = 'auto';
      drawer.style.bottom = 'auto';
      drawer.style.transform = 'none';
      drawer.style.margin = '0';

      initialLeft = rect.left;
      initialTop = rect.top;
      startX = e.clientX;
      startY = e.clientY;

      try {
        header.setPointerCapture(e.pointerId);
      } catch (_) {}
      e.preventDefault();
    };

    const onPointerMove = (e) => {
      if (!isDragging) return;

      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;

      const drawerWidth = drawer.offsetWidth;
      const winWidth = window.innerWidth;
      const winHeight = window.innerHeight;

      let targetLeft = initialLeft + deltaX;
      let targetTop = initialTop + deltaY;

      // Ensure header remains reachable on screen
      const minLeft = Math.min(10, winWidth - drawerWidth);
      const maxLeft = Math.max(10, winWidth - 60);
      const minTop = 10;
      const maxTop = Math.max(10, winHeight - 60);

      targetLeft = Math.max(minLeft, Math.min(targetLeft, maxLeft));
      targetTop = Math.max(minTop, Math.min(targetTop, maxTop));

      drawer.style.left = `${targetLeft}px`;
      drawer.style.top = `${targetTop}px`;
      this.hasCustomPosition = true;
    };

    const onPointerUp = (e) => {
      if (!isDragging) return;
      isDragging = false;
      drawer.classList.remove('is-dragging');
      try {
        header.releasePointerCapture(e.pointerId);
      } catch (_) {}
    };

    header.addEventListener('pointerdown', onPointerDown);
    header.addEventListener('pointermove', onPointerMove);
    header.addEventListener('pointerup', onPointerUp);
    header.addEventListener('pointercancel', onPointerUp);

    window.addEventListener('resize', () => {
      if (this.hasCustomPosition) {
        this.clampToBounds();
      }
    });
  }

  resetPosition() {
    this.hasCustomPosition = false;
    if (!this.drawerEl) return;
    this.drawerEl.style.position = 'fixed';
    this.drawerEl.style.bottom = '20px';
    this.drawerEl.style.left = '50%';
    this.drawerEl.style.top = 'auto';
    this.drawerEl.style.right = 'auto';
    this.drawerEl.style.transform = 'translateX(-50%)';
  }

  clampToBounds() {
    if (!this.drawerEl || !this.hasCustomPosition) return;
    const rect = this.drawerEl.getBoundingClientRect();
    const winWidth = window.innerWidth;
    const winHeight = window.innerHeight;

    let left = rect.left;
    let top = rect.top;

    const minLeft = Math.min(10, winWidth - rect.width);
    const maxLeft = Math.max(10, winWidth - 60);
    const minTop = 10;
    const maxTop = Math.max(10, winHeight - 60);

    left = Math.max(minLeft, Math.min(left, maxLeft));
    top = Math.max(minTop, Math.min(top, maxTop));

    this.drawerEl.style.left = `${left}px`;
    this.drawerEl.style.top = `${top}px`;
  }

  open() {
    const overlay = document.getElementById('inspector-overlay');
    if (overlay) overlay.classList.remove('hidden');
    if (this.hasCustomPosition) {
      this.clampToBounds();
    }
  }

  showStation(station, airData) {
    this.open();

    document.getElementById('insp-type').textContent = 'STASIUN PEMANTAU UDARA';
    document.getElementById('insp-title').textContent = station.name;
    document.getElementById('insp-subtitle').textContent = `${station.lat.toFixed(3)}°, ${station.lon.toFixed(3)}° • ${station.province || 'Indonesia'}`;

    this.renderData(airData);
  }

  showCoordinate(lat, lon, airData, customTitle = null) {
    this.open();

    document.getElementById('insp-type').textContent = 'INSPEKSI KOORDINAT';
    document.getElementById('insp-title').textContent = customTitle || `Koordinat [${lat.toFixed(2)}°, ${lon.toFixed(2)}°]`;
    document.getElementById('insp-subtitle').textContent = `Data Atmosfer & Polusi Live`;

    this.renderData(airData);
  }

  showFireHotspot(fire, airData = null) {
    this.open();

    document.getElementById('insp-type').textContent = '🔥 TITIK API SATELIT NASA';
    document.getElementById('insp-title').textContent = `Hotspot ${fire.region} (${fire.confidence})`;
    document.getElementById('insp-subtitle').textContent = `${fire.lat.toFixed(4)}°, ${fire.lon.toFixed(4)}° • ${fire.satellite} • Waktu: ${fire.acqTime || fire.acqDate}`;

    if (airData) {
      this.renderData(airData);
    } else {
      // Show fire parameters while loading
      document.getElementById('insp-aqi-val').textContent = `${fire.frp} MW`;
      document.querySelector('.aqi-circle-unit').textContent = 'Fire Power';
      document.getElementById('insp-aqi-badge').textContent = `Suhu Nyala: ${fire.tempCelsius}°C`;
      document.getElementById('insp-aqi-badge').style.background = '#EF4444';
      document.getElementById('insp-aqi-desc').textContent = `Terdeteksi sensor ${fire.satellite} dengan tingkat keyakinan ${fire.confidence}. Waktu satelit: ${fire.acqTime}.`;
      document.getElementById('insp-aqi-advice').textContent = 'Area berpotensi menjadi sumber asap pekat kebakaran hutan/lahan.';
    }
  }

  renderData(data) {
    if (!data) return;

    const cat = data.category || { label: 'SEDANG', color: '#FBBF24', description: '', healthAdvice: '' };

    // Update Hero Card
    const aqiCard = document.getElementById('insp-aqi-card');
    aqiCard.style.borderColor = cat.color;
    aqiCard.style.boxShadow = `0 4px 24px ${cat.glowColor || 'rgba(0,0,0,0.5)'}`;

    const aqiValEl = document.getElementById('insp-aqi-val');
    aqiValEl.textContent = data.aqi || 0;
    aqiValEl.style.color = cat.color;
    document.querySelector('.aqi-circle-unit').textContent = 'US AQI';

    const badgeEl = document.getElementById('insp-aqi-badge');
    badgeEl.textContent = cat.label;
    badgeEl.style.backgroundColor = cat.color;
    badgeEl.style.color = cat.textColor || '#FFF';

    document.getElementById('insp-aqi-desc').textContent = cat.description;
    document.getElementById('insp-aqi-advice').textContent = cat.healthAdvice;

    // Weather
    document.getElementById('insp-temp').textContent = `${data.temperature || 28}°C`;
    document.getElementById('insp-hum').textContent = `${data.humidity || 75}%`;
    document.getElementById('insp-wind').textContent = `${data.windSpeed || 10} km/j (${data.windDirection || 0}°)`;
    document.getElementById('insp-weather-desc').textContent = data.weatherDesc || 'Cerah';

    // Pollutants
    document.getElementById('insp-pm25').textContent = data.pm25 || 0;
    document.getElementById('insp-pm10').textContent = data.pm10 || 0;
    document.getElementById('insp-co').textContent = data.co ? Number(data.co).toLocaleString() : '0';
    document.getElementById('insp-aod').textContent = data.aod || '0.00';
    document.getElementById('insp-no2').textContent = data.no2 || 0;
    document.getElementById('insp-o3').textContent = data.ozone || 0;

    // Progress bars
    const pm25Pct = Math.min(100, ((data.pm25 || 0) / 120) * 100);
    const pm10Pct = Math.min(100, ((data.pm10 || 0) / 200) * 100);
    const pm25Bar = document.getElementById('insp-pm25-bar');
    const pm10Bar = document.getElementById('insp-pm10-bar');
    pm25Bar.style.width = `${pm25Pct}%`;
    pm25Bar.style.backgroundColor = cat.color;
    pm10Bar.style.width = `${pm10Pct}%`;
    pm10Bar.style.backgroundColor = cat.color;

    // Render Chart
    this.renderChart(data.hourly);
  }

  renderChart(hourly) {
    if (!hourly || !hourly.time || hourly.time.length === 0) return;

    const ctx = document.getElementById('insp-forecast-chart').getContext('2d');
    if (this.chartInstance) {
      this.chartInstance.destroy();
    }

    const labels = hourly.time.map(t => {
      const parts = t.split('T');
      return parts[1] || t;
    });

    this.chartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'PM2.5 (μg/m³)',
            data: hourly.pm25,
            borderColor: '#EF4444',
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            borderWidth: 2.5,
            tension: 0.35,
            fill: true,
            pointRadius: 2,
            pointHoverRadius: 5
          },
          {
            label: 'US AQI',
            data: hourly.usAqi,
            borderColor: '#F59E0B',
            backgroundColor: 'transparent',
            borderWidth: 2,
            borderDash: [5, 4],
            tension: 0.35,
            pointRadius: 0
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: {
              color: '#94A3B8',
              font: { family: "'Plus Jakarta Sans', sans-serif", size: 12 }
            }
          },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            titleColor: '#F8FAFC',
            bodyColor: '#E2E8F0',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            padding: 10
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { color: '#64748B', maxTicksLimit: 8 }
          },
          y: {
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { color: '#64748B' },
            beginAtZero: true
          }
        }
      }
    });
  }

  close() {
    const overlay = document.getElementById('inspector-overlay');
    if (overlay) overlay.classList.add('hidden');
    if (this.chartInstance) {
      this.chartInstance.destroy();
      this.chartInstance = null;
    }
  }
}
