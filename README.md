# RADAR CUACA (Weather, Fire & Air Quality Radar)

Web apps pemantauan titik api kebakaran hutan (*active fire hotspots*) dan indeks kualitas udara (*air quality index*) berbasis peta interaktif dengan estetika dan animasi partikel dinamis ala **Windy.com**.

Domain: https://radarcuaca.isparmo.com

---

## 🌟 Fitur Utama

1. **Titik Api Satelit Real-time (NASA FIRMS)**:
   - Terintegrasi langsung dengan API **NASA FIRMS** (instrumen satelit VIIRS SNPP 375m & VIIRS NOAA-20).
   - Menampilkan ribuan titik api aktif (*hotspots*) dengan gradasi suhu kecerahan (*brightness temperature*) dan daya pancar radiasi api (*Fire Radiative Power / FRP* dalam MW).
   - Efek pulsasi nyala api dinamis (*Canvas Glowing Hotspot Layer*).
   - Filter rentang waktu (24 jam, 48 jam, 72 jam) dan filter keyakinan tinggi (*High Confidence*).

2. **Sebaran Asap & Kualitas Udara Seluruh Indonesia (Open-Meteo Air Quality)**:
   - Visualisasi sebaran kabut asap pekat (*smoke plume heatmap*) seperti pada tampilan Windy.
   - Lapisan warna atmosfer kontinu meliputi seluruh kepulauan Indonesia (Sumatera, Jawa, Bali, NTB, NTT, Kalimantan, Sulawesi, Maluku, hingga Papua).
   - Parameter polutan lengkap: **PM2.5**, **PM10**, **CO (Karbon Monoksida)**, **AOD (Aerosol Optical Depth)**, **NO₂**, dan **O₃**.
   - Indeks **US AQI** & **European AQI** dengan kode warna standar internasional:
     - Hijau (Baik: 0–50)
     - Kuning (Sedang: 51–100)
     - Oranye (Sensitif: 101–150)
     - Merah (Tidak Sehat: 151–200)
     - Ungu (Sangat Tidak Sehat: 201–300)
     - Marun/Hitam (Berbahaya: 300+)

3. **Animasi Partikel Aliran Angin (Wind Streamlines ala Windy)**:
   - Engine simulasi partikel angin berbasis HTML5 Canvas yang mengalir secara *real-time* di atas peta Indonesia dan Asia Tenggara.
   - Mengikuti pola sirkulasi angin muson khatulistiwa dan data vektor kecepatan angin.

4. **Inspector Drawer & Grafik Tren 24 Jam**:
   - Klik pada kota, stasiun, titik api, atau sembarang koordinat di peta untuk membuka panel analisis mendalam.
   - Menampilkan grafik prediksi tren per jam (*hourly forecast*) PM2.5 dan AQI menggunakan **Chart.js**.

5. **Pencarian Cepat & Tombol Wilayah**:
   - *Quick jump* ke hotspot utama: **🔥 Sumatera**, **🔥 Kalimantan**, **Jawa-Bali**, **Sulawesi**, **Papua**.
   - Kolom pencarian kota dengan *auto-suggest*.

6. **Gaya Peta Bebas Watermark & Mode Gelap / Terang**:
   - 🌙 **Mode Gelap** (Esri Dark Gray Canvas + UI gelap ala Windy)
   - ☀️ **Mode Terang** (Esri Light Gray Canvas + UI terang bersih)
   - 🛰️ **Citra Satelit Nyata** (Esri World Imagery)
   - 🗺️ **Peta Jalan** (OpenStreetMap)

7. **Desain Mobile-First & Responsif Penuh**:
   - Dioptimalkan untuk desktop widescreen, tablet, dan smartphone dengan navigasi sentuh yang mulus.

---

## 🚀 Cara Menjalankan

### 1. Menjalankan Server Development:
```bash
npm run dev
```
Buka browser di: `http://localhost:5173/`

### 2. Membangun Bundle Produksi:
```bash
npm run build
npm run preview
```

---

## 🔑 Konfigurasi API NASA FIRMS

Kunci API NASA FIRMS telah dikonfigurasi secara otomatis:
- **MAP KEY**: `dcd66ef0fce7a526e35474158db8a7d1`
- Anda juga dapat memperbarui atau mengganti API key langsung dari menu samping aplikasi tanpa perlu mengedit kode.
