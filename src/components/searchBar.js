// Search Bar and Quick Region Jumper
import { REGIONAL_STATIONS, REGIONS_VIEW } from '../data/stations.js';

export class SearchBar {
  constructor(containerEl, onSelectLocation) {
    this.container = containerEl;
    this.onSelectLocation = onSelectLocation;
    this.init();
  }

  init() {
    this.container.innerHTML = `
      <div class="search-container">
        <div class="search-input-wrap">
          <svg class="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <input type="text" id="search-input" class="search-input" placeholder="Cari kota, provinsi, atau koordinat..." autocomplete="off">
          <button id="search-clear-btn" class="search-clear-btn hidden">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <div id="search-results-dropdown" class="search-dropdown hidden"></div>

        <!-- Quick Region Filter Pills -->
        <div class="region-pills-row">
          <button class="region-pill active" data-region="indonesia">Semua RI</button>
          <button class="region-pill" data-region="sumatra">🔥 Sumatera</button>
          <button class="region-pill" data-region="kalimantan">🔥 Kalimantan</button>
          <button class="region-pill" data-region="jawa">Jawa-Bali</button>
          <button class="region-pill" data-region="sulawesi">Sulawesi</button>
          <button class="region-pill" data-region="papua">Papua</button>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  bindEvents() {
    const input = document.getElementById('search-input');
    const clearBtn = document.getElementById('search-clear-btn');
    const dropdown = document.getElementById('search-results-dropdown');

    input.addEventListener('input', (e) => {
      const q = e.target.value.trim().toLowerCase();
      if (q.length > 0) {
        clearBtn.classList.remove('hidden');
        this.renderDropdown(q);
      } else {
        clearBtn.classList.add('hidden');
        dropdown.classList.add('hidden');
      }
    });

    clearBtn.addEventListener('click', () => {
      input.value = '';
      clearBtn.classList.add('hidden');
      dropdown.classList.add('hidden');
      input.focus();
    });

    document.addEventListener('click', (e) => {
      if (!this.container.contains(e.target)) {
        dropdown.classList.add('hidden');
      }
    });

    // Handle Region Pills
    const pills = this.container.querySelectorAll('.region-pill');
    pills.forEach(pill => {
      pill.addEventListener('click', () => {
        pills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        const regKey = pill.getAttribute('data-region');
        const reg = REGIONS_VIEW[regKey];
        if (reg && this.onSelectLocation) {
          this.onSelectLocation({
            name: reg.name,
            lat: reg.center[0],
            lon: reg.center[1],
            zoom: reg.zoom,
            isRegion: true
          });
        }
      });
    });
  }

  renderDropdown(query) {
    const dropdown = document.getElementById('search-results-dropdown');
    const matches = REGIONAL_STATIONS.filter(s =>
      s.name.toLowerCase().includes(query) ||
      (s.province && s.province.toLowerCase().includes(query))
    ).slice(0, 6);

    if (matches.length === 0) {
      dropdown.innerHTML = `<div class="search-empty">Tidak ada lokasi yang cocok</div>`;
      dropdown.classList.remove('hidden');
      return;
    }

    dropdown.innerHTML = matches.map(s => `
      <div class="search-item" data-id="${s.id}" data-lat="${s.lat}" data-lon="${s.lon}" data-name="${s.name}">
        <div class="search-item-info">
          <span class="search-item-name">${s.name}</span>
          <span class="search-item-prov">${s.province}</span>
        </div>
        <span class="search-item-coords">${s.lat.toFixed(2)}°, ${s.lon.toFixed(2)}°</span>
      </div>
    `).join('');

    dropdown.classList.remove('hidden');

    dropdown.querySelectorAll('.search-item').forEach(el => {
      el.addEventListener('click', () => {
        const lat = parseFloat(el.getAttribute('data-lat'));
        const lon = parseFloat(el.getAttribute('data-lon'));
        const name = el.getAttribute('data-name');
        dropdown.classList.add('hidden');
        if (this.onSelectLocation) {
          this.onSelectLocation({ name, lat, lon, zoom: 8 });
        }
      });
    });
  }
}
