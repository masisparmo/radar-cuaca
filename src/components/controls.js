// Sidebar Controls & Layer Switcher Component
import { FIRMS_CONFIG } from '../services/firmsService.js';

export class ControlsPanel {
  constructor(containerEl, callbacks = {}) {
    this.container = containerEl;
    this.callbacks = callbacks;
    this.init();
  }

  init() {
    this.container.innerHTML = `
      <div class="sidebar-wrapper">
        <!-- Floating Toggle Button for Mobile / Small Screens -->
        <button id="sidebar-toggle-btn" class="sidebar-toggle-btn" title="Toggle Panel Menu">
          <svg class="open-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          <svg class="close-icon hidden" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>

        <aside id="sidebar-panel" class="sidebar-panel">
          <!-- App Header -->
          <div class="app-brand">
            <div class="brand-left">
              <div class="brand-logo-icon">
                <span class="radar-ping"></span>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z"/><path d="M12 6a6 6 0 1 0 6 6 6 6 0 0 0-6-6zm0 8a2 2 0 1 1 2-2 2 2 0 0 1-2 2z"/></svg>
              </div>
              <div>
                <h1 class="brand-title">RADAR CUACA</h1>
                <span class="brand-subtitle">Pantauan Hotspot Api & Indeks Udara</span>
              </div>
            </div>
            <!-- Theme Toggle Button (Light/Dark) -->
            <button id="btn-theme-toggle" class="theme-toggle-btn" title="Ganti Mode Gelap / Terang">
              <svg class="sun-icon hidden" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
              <svg class="moon-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            </button>
          </div>

          <!-- Live Stats Highlight Box -->
          <div class="stats-card">
            <div class="stats-row">
              <div class="stat-box">
                <span class="stat-label">TITIK API AKTIF</span>
                <div class="stat-value-row">
                  <span class="stat-num text-fire" id="stat-total-fires">Memuat...</span>
                  <span class="stat-badge-pulse">LIVE</span>
                </div>
                <span class="stat-sub" id="stat-high-conf">Satelit VIIRS 375m</span>
              </div>
              <div class="stat-box">
                <span class="stat-label">KLASTER TERBANYAK</span>
                <span class="stat-num text-smoke" id="stat-top-region">Menganalisis...</span>
                <span class="stat-sub" id="stat-max-frp">FRP Tertinggi: --</span>
              </div>
            </div>
            <button id="btn-refresh-data" class="btn-refresh" title="Muat Ulang Data Satelit">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
              Sinkronisasi Ulang Satelit
            </button>
          </div>

          <!-- Layer Switches Section -->
          <div class="controls-section">
            <h3 class="section-heading">LAYER PEMANTAUAN</h3>

            <!-- Fire Hotspots Layer -->
            <div class="control-card">
              <div class="control-header">
                <div class="control-title-wrap">
                  <span class="layer-dot bg-fire"></span>
                  <span class="control-title">Titik Api (NASA FIRMS)</span>
                </div>
                <label class="toggle-switch">
                  <input type="checkbox" id="toggle-fire-layer" checked>
                  <span class="slider round"></span>
                </label>
              </div>

              <!-- Time Range Selector -->
              <div class="sub-controls">
                <span class="sub-label">Rentang Waktu:</span>
                <div class="time-btn-group">
                  <button class="time-btn" data-days="1">24 Jam</button>
                  <button class="time-btn active" data-days="2">48 Jam</button>
                  <button class="time-btn" data-days="3">72 Jam</button>
                </div>
                <div class="checkbox-row">
                  <input type="checkbox" id="chk-high-conf">
                  <label for="chk-high-conf">Hanya Keyakinan Tinggi (High Confidence)</label>
                </div>
              </div>
            </div>

            <!-- Smoke Plume & Air Quality Layer -->
            <div class="control-card">
              <div class="control-header">
                <div class="control-title-wrap">
                  <span class="layer-dot bg-smoke"></span>
                  <span class="control-title">Sebaran Asap & AQI (Open-Meteo)</span>
                </div>
                <label class="toggle-switch">
                  <input type="checkbox" id="toggle-smoke-layer" checked>
                  <span class="slider round"></span>
                </label>
              </div>
              <p class="control-desc">Heatmap dispersi asap PM2.5 & AOD (Aerosol Optical Depth) pekat ala Windy.</p>
            </div>

            <!-- Wind Streamlines Layer -->
            <div class="control-card">
              <div class="control-header">
                <div class="control-title-wrap">
                  <span class="layer-dot bg-wind"></span>
                  <span class="control-title">Aliran Angin (Wind Particles)</span>
                </div>
                <label class="toggle-switch">
                  <input type="checkbox" id="toggle-wind-layer" checked>
                  <span class="slider round"></span>
                </label>
              </div>
              <p class="control-desc">Simulasi partikel vektor arah & kecepatan hembusan angin bergerak.</p>
            </div>

            <!-- Stations / City Labels Layer -->
            <div class="control-card">
              <div class="control-header">
                <div class="control-title-wrap">
                  <span class="layer-dot bg-city"></span>
                  <span class="control-title">Stasiun & Label Kota</span>
                </div>
                <label class="toggle-switch">
                  <input type="checkbox" id="toggle-station-layer">
                  <span class="slider round"></span>
                </label>
              </div>
            </div>
          </div>

          <!-- Basemap Style Selector -->
          <div class="controls-section">
            <h3 class="section-heading">GAYA PETA DASAR</h3>
            <div class="basemap-grid">
              <button class="basemap-btn" data-style="dark">
                <div class="basemap-preview bg-dark-preview"></div>
                <span>Mode Gelap</span>
              </button>
              <button class="basemap-btn active" data-style="light">
                <div class="basemap-preview bg-light-preview"></div>
                <span>Mode Terang</span>
              </button>
              <button class="basemap-btn" data-style="satellite">
                <div class="basemap-preview bg-sat-preview"></div>
                <span>Satelit Nyata</span>
              </button>
              <button class="basemap-btn" data-style="streets">
                <div class="basemap-preview bg-street-preview"></div>
                <span>Peta Jalan</span>
              </button>
            </div>
          </div>

          <!-- NASA API Key & Data Info -->
          <div class="controls-section">
            <div class="api-info-box">
              <div class="api-header">
                <span class="api-label">NASA FIRMS API KEY</span>
                <button id="btn-edit-key" class="btn-text">Ubah</button>
              </div>
              <div class="api-key-display" id="display-api-key">••••••••••••••••••••••••••••••••</div>
              <span class="api-status text-emerald">✓ Terhubung ke NASA FIRMS NRT Feed</span>
            </div>
          </div>

          <!-- Footer Attribution -->
          <div class="sidebar-footer">
            <p>Data bersumber resmi dari <strong>NASA FIRMS</strong> (MODIS/VIIRS) & <strong>Open-Meteo</strong> Air Quality. Dibuat responsif untuk pemantauan kebakaran hutan dan mitigasi asap.</p>
          </div>
        </aside>
      </div>
    `;

    this.bindEvents();
  }

  bindEvents() {
    const toggleBtn = document.getElementById('sidebar-toggle-btn');
    const panel = document.getElementById('sidebar-panel');
    const openIcon = toggleBtn.querySelector('.open-icon');
    const closeIcon = toggleBtn.querySelector('.close-icon');

    toggleBtn.addEventListener('click', () => {
      panel.classList.toggle('open');
      const isOpen = panel.classList.contains('open');
      openIcon.classList.toggle('hidden', isOpen);
      closeIcon.classList.toggle('hidden', !isOpen);
    });

    // Theme Toggle (Light/Dark Mode)
    const themeBtn = document.getElementById('btn-theme-toggle');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        if (this.callbacks.onToggleTheme) {
          this.callbacks.onToggleTheme();
        }
      });
    }

    // Layer Toggles
    document.getElementById('toggle-fire-layer').addEventListener('change', (e) => {
      if (this.callbacks.onToggleFire) this.callbacks.onToggleFire(e.target.checked);
    });

    document.getElementById('toggle-smoke-layer').addEventListener('change', (e) => {
      if (this.callbacks.onToggleSmoke) this.callbacks.onToggleSmoke(e.target.checked);
    });

    document.getElementById('toggle-wind-layer').addEventListener('change', (e) => {
      if (this.callbacks.onToggleWind) this.callbacks.onToggleWind(e.target.checked);
    });

    document.getElementById('toggle-station-layer').addEventListener('change', (e) => {
      if (this.callbacks.onToggleStations) this.callbacks.onToggleStations(e.target.checked);
    });

    // Time Range buttons
    const timeBtns = this.container.querySelectorAll('.time-btn');
    timeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        timeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const days = parseInt(btn.getAttribute('data-days'), 10);
        if (this.callbacks.onChangeDays) this.callbacks.onChangeDays(days);
      });
    });

    // High confidence checkbox
    document.getElementById('chk-high-conf').addEventListener('change', (e) => {
      if (this.callbacks.onFilterHighConf) this.callbacks.onFilterHighConf(e.target.checked);
    });

    // Basemap selector
    const basemapBtns = this.container.querySelectorAll('.basemap-btn');
    basemapBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        basemapBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const style = btn.getAttribute('data-style');
        if (this.callbacks.onChangeBasemap) this.callbacks.onChangeBasemap(style);
      });
    });

    // Refresh button
    const refreshBtn = document.getElementById('btn-refresh-data');
    refreshBtn.addEventListener('click', () => {
      refreshBtn.classList.add('rotating');
      if (this.callbacks.onRefresh) {
        this.callbacks.onRefresh().finally(() => {
          refreshBtn.classList.remove('rotating');
        });
      }
    });

    // Edit API Key
    document.getElementById('btn-edit-key').addEventListener('click', () => {
      const current = localStorage.getItem('firms_api_key') || FIRMS_CONFIG.defaultKey;
      const newKey = prompt('Masukkan NASA FIRMS MAP_KEY Anda:', current);
      if (newKey && newKey.trim() !== '') {
        if (this.callbacks.onUpdateApiKey) {
          this.callbacks.onUpdateApiKey(newKey.trim());
        }
      }
    });
  }

  updateStats(stats) {
    if (!stats) return;
    const totalEl = document.getElementById('stat-total-fires');
    const highConfEl = document.getElementById('stat-high-conf');
    const topRegionEl = document.getElementById('stat-top-region');
    const maxFrpEl = document.getElementById('stat-max-frp');

    if (totalEl) totalEl.textContent = stats.total.toLocaleString();
    if (highConfEl) highConfEl.textContent = `${stats.highConfidence.toLocaleString()} Keyakinan Tinggi`;
    if (topRegionEl) topRegionEl.textContent = stats.topRegion;
    if (maxFrpEl) maxFrpEl.textContent = `FRP Maks: ${stats.maxFrp} MW`;
  }

  updateTheme(theme) {
    const sunIcon = this.container.querySelector('.sun-icon');
    const moonIcon = this.container.querySelector('.moon-icon');
    if (sunIcon && moonIcon) {
      if (theme === 'light') {
        sunIcon.classList.remove('hidden');
        moonIcon.classList.add('hidden');
      } else {
        sunIcon.classList.add('hidden');
        moonIcon.classList.remove('hidden');
      }
    }
  }

  setActiveBasemap(style) {
    const basemapBtns = this.container.querySelectorAll('.basemap-btn');
    basemapBtns.forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-style') === style);
    });
  }
}
