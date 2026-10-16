export const REGIONAL_STATIONS = [
  { id: 'jkt', name: 'Jakarta', province: 'DKI Jakarta', lat: -6.2088, lon: 106.8456, keyCity: true },
  { id: 'plg', name: 'Palembang', province: 'Sumatera Selatan', lat: -2.9909, lon: 104.7565, keyCity: true },
  { id: 'pku', name: 'Pekanbaru', province: 'Riau', lat: 0.5071, lon: 101.4478, keyCity: true },
  { id: 'ptk', name: 'Pontianak', province: 'Kalimantan Barat', lat: -0.0263, lon: 109.3425, keyCity: true },
  { id: 'pky', name: 'Palangkaraya', province: 'Kalimantan Tengah', lat: -2.2161, lon: 113.9139, keyCity: true },
  { id: 'jmb', name: 'Jambi', province: 'Jambi', lat: -1.6101, lon: 103.6131, keyCity: true },
  { id: 'bjm', name: 'Banjarmasin', province: 'Kalimantan Selatan', lat: -3.3194, lon: 114.5908, keyCity: true },
  { id: 'smd', name: 'Samarinda', province: 'Kalimantan Timur', lat: -0.5016, lon: 117.1537, keyCity: true },
  { id: 'med', name: 'Medan', province: 'Sumatera Utara', lat: 3.5952, lon: 98.6722, keyCity: true },
  { id: 'pdg', name: 'Padang', province: 'Sumatera Barat', lat: -0.9471, lon: 100.4172, keyCity: true },
  { id: 'bdl', name: 'Bandar Lampung', province: 'Lampung', lat: -5.4297, lon: 105.2625, keyCity: false },
  { id: 'btm', name: 'Batam', province: 'Kepulauan Riau', lat: 1.1301, lon: 104.0529, keyCity: true },
  { id: 'bch', name: 'Banda Aceh', province: 'Aceh', lat: 5.5483, lon: 95.3238, keyCity: true },
  { id: 'bdg', name: 'Bandung', province: 'Jawa Barat', lat: -6.9175, lon: 107.6191, keyCity: true },
  { id: 'smg', name: 'Semarang', province: 'Jawa Tengah', lat: -6.9667, lon: 110.4167, keyCity: false },
  { id: 'sby', name: 'Surabaya', province: 'Jawa Timur', lat: -7.2575, lon: 112.7521, keyCity: true },
  { id: 'dps', name: 'Denpasar', province: 'Bali', lat: -8.6705, lon: 115.2126, keyCity: true },
  { id: 'mtr', name: 'Mataram', province: 'Nusa Tenggara Barat', lat: -8.5833, lon: 116.1167, keyCity: false },
  { id: 'kpg', name: 'Kupang', province: 'Nusa Tenggara Timur', lat: -10.1772, lon: 123.6070, keyCity: true },
  { id: 'mks', name: 'Makassar', province: 'Sulawesi Selatan', lat: -5.1477, lon: 119.4327, keyCity: true },
  { id: 'plu', name: 'Palu', province: 'Sulawesi Tengah', lat: -0.9003, lon: 119.8779, keyCity: true },
  { id: 'mnd', name: 'Manado', province: 'Sulawesi Utara', lat: 1.4748, lon: 124.8421, keyCity: true },
  { id: 'kdi', name: 'Kendari', province: 'Sulawesi Tenggara', lat: -3.9985, lon: 122.5126, keyCity: false },
  { id: 'amb', name: 'Ambon', province: 'Maluku', lat: -3.6954, lon: 128.1814, keyCity: true },
  { id: 'jyp', name: 'Jayapura', province: 'Papua', lat: -2.5916, lon: 140.6690, keyCity: true },
  { id: 'mrk', name: 'Merauke', province: 'Papua Selatan', lat: -8.4991, lon: 140.4018, keyCity: true },
  // Neighboring ASEAN regional hubs (shown in reference screenshot)
  { id: 'sin', name: 'Singapore', province: 'Singapore', lat: 1.3521, lon: 103.8198, keyCity: true },
  { id: 'kul', name: 'Kuala Lumpur', province: 'Malaysia', lat: 3.1390, lon: 101.6869, keyCity: true },
  { id: 'pen', name: 'George Town', province: 'Penang, Malaysia', lat: 5.4141, lon: 100.3288, keyCity: false },
  { id: 'kch', name: 'Kuching', province: 'Sarawak, Malaysia', lat: 1.5533, lon: 110.3592, keyCity: false },
  { id: 'bwn', name: 'Bandar Seri Begawan', province: 'Brunei', lat: 4.9031, lon: 114.9398, keyCity: false },
  { id: 'bkk', name: 'Bangkok', province: 'Thailand', lat: 13.7563, lon: 100.5018, keyCity: true }
];

export const REGIONS_VIEW = {
  indonesia: { name: 'Seluruh Indonesia', center: [-2.5, 118.0], zoom: 5 },
  sumatra: { name: 'Sumatera & Selat Malaka', center: [0.5, 102.5], zoom: 6 },
  kalimantan: { name: 'Kalimantan / Borneo', center: [-1.2, 113.8], zoom: 6 },
  jawa: { name: 'Jawa & Bali', center: [-7.5, 110.5], zoom: 7 },
  sulawesi: { name: 'Sulawesi', center: [-1.5, 120.5], zoom: 6 },
  papua: { name: 'Papua & Maluku', center: [-4.0, 137.0], zoom: 6 }
};
