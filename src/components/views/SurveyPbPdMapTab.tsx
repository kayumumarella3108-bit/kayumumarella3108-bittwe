import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import {
  MapPin,
  Zap,
  Building,
  Filter,
  Search,
  Maximize2,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Compass,
  FileText,
  Share2,
  ExternalLink,
  ChevronRight,
  TrendingDown
} from 'lucide-react';
import { SurveyPbPdItem, Penyulang } from '../../types';
import { calculateDistanceMeters } from '../modals/SurveyMapPicker';

interface SurveyPbPdMapTabProps {
  surveyList: SurveyPbPdItem[];
  penyulangList: Penyulang[];
  onSelectDetail: (item: SurveyPbPdItem) => void;
  onExportPDF: (item: SurveyPbPdItem) => void;
  onShareWA: (item: SurveyPbPdItem) => void;
}

export const SurveyPbPdMapTab: React.FC<SurveyPbPdMapTabProps> = ({
  surveyList,
  penyulangList,
  onSelectDetail,
  onExportPDF,
  onShareWA
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPenyulang, setSelectedPenyulang] = useState('Semua');
  const [selectedStatus, setSelectedStatus] = useState('Semua');
  const [selectedJenis, setSelectedJenis] = useState<'Semua' | 'PB' | 'PD'>('Semua');
  const [mapStyle, setMapStyle] = useState<'satellite' | 'dark' | 'street'>('satellite');
  const [selectedItem, setSelectedItem] = useState<SurveyPbPdItem | null>(null);

  // Map refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const layerGroupRef = useRef<L.FeatureGroup | null>(null);

  const getTileUrl = (style: 'satellite' | 'dark' | 'street') => {
    switch (style) {
      case 'satellite':
        return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      case 'street':
        return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      case 'dark':
      default:
        return 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
    }
  };

  // Filter list
  const filteredSurveys = surveyList.filter((item) => {
    const matchSearch =
      searchQuery === '' ||
      item.namaPelanggan.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.noAgenda && item.noAgenda.toLowerCase().includes(searchQuery.toLowerCase())) ||
      item.noGardu.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.penyulang.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.lokasi.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.titikSambung.toLowerCase().includes(searchQuery.toLowerCase());

    const matchPenyulang = selectedPenyulang === 'Semua' || item.penyulang === selectedPenyulang;
    const matchStatus = selectedStatus === 'Semua' || item.statusKelayakan === selectedStatus;
    const matchJenis =
      selectedJenis === 'Semua' ||
      (selectedJenis === 'PB' && item.jenisTransaksi.includes('PB')) ||
      (selectedJenis === 'PD' && item.jenisTransaksi.includes('PD'));

    return matchSearch && matchPenyulang && matchStatus && matchJenis;
  });

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [-3.6375, 128.2435], // Center at Baguala / Passo
      zoom: 13,
      zoomControl: false
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const tile = L.tileLayer(getTileUrl(mapStyle), {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap | Esri World Imagery'
    }).addTo(map);

    tileLayerRef.current = tile;
    layerGroupRef.current = L.featureGroup().addTo(map);
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Tile Layer
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;
    mapInstanceRef.current.removeLayer(tileLayerRef.current);
    const newTile = L.tileLayer(getTileUrl(mapStyle), { maxZoom: 19 }).addTo(mapInstanceRef.current);
    tileLayerRef.current = newTile;
  }, [mapStyle]);

  // Render Markers and SR Lines
  useEffect(() => {
    if (!mapInstanceRef.current || !layerGroupRef.current) return;
    const lg = layerGroupRef.current;
    lg.clearLayers();

    filteredSurveys.forEach((item) => {
      // Default lat/lng if not present (just fallback)
      const bLat = item.lat;
      const bLng = item.lng;
      const sLat = item.titikSambungLat || (bLat ? bLat - 0.00018 : undefined);
      const sLng = item.titikSambungLng || (bLng ? bLng - 0.00018 : undefined);

      if (!bLat || !bLng) return;

      const dropVolt = Math.max(0, item.tegPangkal - item.tegTetangga);
      const dropPct = (dropVolt / (item.tegPangkal || 220)) * 100;

      let statusColor = '#10b981'; // Layak - Green
      if (item.statusKelayakan === 'Perlu Sisip Tiang' || item.statusKelayakan === 'Perlu Perluasan JTR') {
        statusColor = '#f59e0b'; // Yellow / Amber
      } else if (item.statusKelayakan === 'Drop Tegangan (Tidak Layak)' || dropPct >= 10) {
        statusColor = '#ef4444'; // Red
      } else if (item.statusKelayakan === 'Selesai Penyambungan') {
        statusColor = '#38bdf8'; // Sky Blue
      }

      // 1. Bangunan Icon
      const buildingIcon = L.divIcon({
        className: 'custom-survey-b-pin',
        html: `
          <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
            <div style="width: 28px; height: 28px; border-radius: 9px; background: ${statusColor}; border: 2px solid #ffffff; box-shadow: 0 0 10px ${statusColor}99, 0 4px 8px rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; color: #ffffff;">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
            </div>
            <div style="position: absolute; bottom: -8px; background: #0f172a; color: #f8fafc; font-size: 8px; font-weight: 900; padding: 1px 4px; border-radius: 4px; border: 1px solid ${statusColor}; white-space: nowrap;">
              ${item.jenisTransaksi.includes('PB') ? 'PB' : 'PD'}
            </div>
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
        popupAnchor: [0, -18]
      });

      const bMarker = L.marker([bLat, bLng], { icon: buildingIcon }).addTo(lg);

      const fotoBangunanSrc = item.fotoBangunan || item.fotoLokasi;
      const fotoTitikSambungSrc = item.fotoTitikSambung;

      bMarker.bindPopup(`
        <div style="font-family: system-ui, -apple-system, sans-serif; min-width: 220px; max-width: 280px; padding: 2px;">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 6px; margin-bottom: 6px;">
            <span style="font-size: 10px; font-weight: 800; padding: 2px 6px; border-radius: 4px; background: ${statusColor}20; color: ${statusColor}; border: 1px solid ${statusColor}50;">
              ${item.jenisTransaksi}
            </span>
            <span style="font-size: 10px; font-weight: 700; color: #64748b;">
              Gardu ${item.noGardu}
            </span>
          </div>
          <div style="font-size: 13px; font-weight: 800; color: #0f172a; margin-bottom: 2px;">
            ${item.namaPelanggan}
          </div>
          <div style="font-size: 11px; color: #475569; margin-bottom: 6px;">
            📍 ${item.lokasi}
          </div>
          <div style="font-size: 11px; font-family: monospace; background: #f8fafc; padding: 4px 6px; border-radius: 6px; border: 1px solid #e2e8f0; color: #334155; margin-bottom: 6px;">
            Lat: <strong>${bLat.toFixed(6)}</strong><br/>
            Lng: <strong>${bLng.toFixed(6)}</strong>
          </div>
          ${
            fotoBangunanSrc
              ? `<div style="margin-top: 6px; border-radius: 8px; overflow: hidden; border: 1px solid #cbd5e1; max-height: 120px;">
                  <img src="${fotoBangunanSrc}" alt="Foto Bangunan" style="width: 100%; height: 100px; object-fit: cover; display: block;" />
                </div>`
              : `<div style="font-size: 10px; color: #94a3b8; font-style: italic;">(Belum ada foto bangunan)</div>`
          }
          <div style="margin-top: 8px; font-size: 11px; font-weight: 700; color: ${statusColor};">
            Status: ${item.statusKelayakan}
          </div>
        </div>
      `);

      // 2. Tiang Sambung Icon (if sLat & sLng exist)
      if (sLat && sLng) {
        const poleIcon = L.divIcon({
          className: 'custom-survey-p-pin',
          html: `
            <div style="position: relative; width: 26px; height: 26px; display: flex; align-items: center; justify-content: center;">
              <div style="width: 20px; height: 20px; border-radius: 6px; background: #f59e0b; border: 2px solid #ffffff; box-shadow: 0 2px 6px rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; color: #000000;">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                </svg>
              </div>
            </div>
          `,
          iconSize: [26, 26],
          iconAnchor: [13, 13],
          popupAnchor: [0, -14]
        });

        const pMarker = L.marker([sLat, sLng], { icon: poleIcon }).addTo(lg);
        pMarker.bindTooltip(`⚡ ${item.titikSambung} (Gardu ${item.noGardu})`, { direction: 'top' });

        pMarker.bindPopup(`
          <div style="font-family: system-ui, -apple-system, sans-serif; min-width: 220px; max-width: 280px; padding: 2px;">
            <div style="display: flex; align-items: center; gap: 4px; color: #b45309; font-weight: 800; font-size: 11px; margin-bottom: 4px;">
              ⚡ TITIK SAMBUNG (TIANG JTR)
            </div>
            <div style="font-size: 12px; font-weight: 700; color: #0f172a; margin-bottom: 2px;">
              ${item.titikSambung}
            </div>
            <div style="font-size: 11px; color: #475569; margin-bottom: 4px;">
              Gardu: <strong>${item.noGardu}</strong> | Penyulang: <strong>${item.penyulang}</strong>
            </div>
            <div style="font-size: 11px; font-family: monospace; background: #fffbeb; padding: 4px 6px; border-radius: 6px; border: 1px solid #fde68a; color: #92400e; margin-bottom: 6px;">
              Lat: <strong>${sLat.toFixed(6)}</strong><br/>
              Lng: <strong>${sLng.toFixed(6)}</strong>
            </div>
            ${
              fotoTitikSambungSrc
                ? `<div style="margin-top: 6px; border-radius: 8px; overflow: hidden; border: 1px solid #fde68a; max-height: 120px;">
                    <img src="${fotoTitikSambungSrc}" alt="Foto Titik Sambung" style="width: 100%; height: 100px; object-fit: cover; display: block;" />
                  </div>`
                : `<div style="font-size: 10px; color: #94a3b8; font-style: italic;">(Belum ada foto titik sambung)</div>`
            }
          </div>
        `);

        // 3. Connect with SR Line
        const srLine = L.polyline(
          [
            [sLat, sLng],
            [bLat, bLng]
          ],
          {
            color: statusColor,
            weight: 3,
            dashArray: '6, 6',
            opacity: 0.85
          }
        ).addTo(lg);

        const dist = calculateDistanceMeters(bLat, bLng, sLat, sLng);
        srLine.bindTooltip(`SR: ${item.panjangSrMeter || dist}m (${item.jenisKabelSr || 'TIC 2x10mm²'})`, {
          sticky: true,
          className: 'custom-leaflet-tooltip'
        });
      }

      bMarker.on('click', () => {
        setSelectedItem(item);
      });
    });
  }, [filteredSurveys]);

  const handleFlyTo = (item: SurveyPbPdItem) => {
    if (!item.lat || !item.lng || !mapInstanceRef.current) return;
    mapInstanceRef.current.flyTo([item.lat, item.lng], 18, { animate: true, duration: 1.2 });
    setSelectedItem(item);
  };

  return (
    <div className="space-y-4">
      {/* Top Filter and Controls Bar */}
      <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow-md space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari pemohon, gardu, titik sambung..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Penyulang */}
          <div>
            <select
              value={selectedPenyulang}
              onChange={(e) => setSelectedPenyulang(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
            >
              <option value="Semua">Semua Penyulang Feeder</option>
              {penyulangList.map((p) => (
                <option key={p.id} value={p.namaPenyulang}>
                  {p.namaPenyulang}
                </option>
              ))}
            </select>
          </div>

          {/* Jenis */}
          <div>
            <select
              value={selectedJenis}
              onChange={(e) => setSelectedJenis(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
            >
              <option value="Semua">Semua Transaksi (PB & PD)</option>
              <option value="PB">Pasang Baru (PB)</option>
              <option value="PD">Perubahan Daya (PD)</option>
            </select>
          </div>

          {/* Status Kelayakan */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
            >
              <option value="Semua">Semua Status Kelayakan</option>
              <option value="Layak Sambung">Layak Sambung</option>
              <option value="Perlu Sisip Tiang">Perlu Sisip Tiang</option>
              <option value="Perlu Perluasan JTR">Perlu Perluasan JTR</option>
              <option value="Drop Tegangan (Tidak Layak)">Drop Tegangan Kritis</option>
              <option value="Selesai Penyambungan">Selesai Penyambungan</option>
            </select>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-[11px]">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-slate-400 font-bold">Legenda Peta:</span>
            <div className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span>Layak Sambung</span>
            </div>
            <div className="flex items-center gap-1.5 text-amber-400">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <span>Perlu Sisip Tiang / JTR</span>
            </div>
            <div className="flex items-center gap-1.5 text-rose-400">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
              <span>Drop Tegangan Kritis</span>
            </div>
            <div className="flex items-center gap-1.5 text-sky-400">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-400"></span>
              <span>Selesai Nyala</span>
            </div>
            <div className="flex items-center gap-1.5 text-amber-300 font-mono">
              <span className="w-2 h-2 rounded bg-amber-400"></span>
              <span>⚡ Tiang Titik Sambung</span>
            </div>
          </div>

          {/* Basemap buttons */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setMapStyle('satellite')}
              className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                mapStyle === 'satellite' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400'
              }`}
            >
              Satelit
            </button>
            <button
              onClick={() => setMapStyle('dark')}
              className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                mapStyle === 'dark' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400'
              }`}
            >
              Dark
            </button>
            <button
              onClick={() => setMapStyle('street')}
              className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                mapStyle === 'street' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400'
              }`}
            >
              Jalan
            </button>
          </div>
        </div>
      </div>

      {/* Map & Sidebar Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Leaflet Map (2 Cols) */}
        <div className="lg:col-span-2 relative h-[550px] bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
          <div ref={mapContainerRef} className="w-full h-full z-10" />

          {/* Floating count badge */}
          <div className="absolute top-3 left-3 z-20 bg-slate-950/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 shadow-xl text-xs flex items-center gap-2">
            <Compass className="w-4 h-4 text-amber-400" />
            <span className="text-slate-300">Menampilkan:</span>
            <strong className="text-white font-mono">{filteredSurveys.length} Titik Survey</strong>
          </div>
        </div>

        {/* List of Surveys sidebar (1 Col) */}
        <div className="h-[550px] flex flex-col bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
          <div className="p-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Building className="w-4 h-4 text-amber-400" />
              Daftar Titik Permohonan
            </h4>
            <span className="text-[10px] px-2 py-0.5 bg-slate-800 text-slate-300 rounded font-bold">
              {filteredSurveys.length} Lokasi
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 divide-y divide-slate-800/40">
            {filteredSurveys.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                Tidak ada titik survey yang cocok dengan filter.
              </div>
            ) : (
              filteredSurveys.map((item) => {
                const dropVolt = Math.max(0, item.tegPangkal - item.tegTetangga);
                const isSelected = selectedItem?.id === item.id;

                return (
                  <div
                    key={item.id}
                    onClick={() => handleFlyTo(item)}
                    className={`pt-2.5 first:pt-0 p-2.5 rounded-xl transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-500/50 shadow-md'
                        : 'bg-slate-950/50 border-transparent hover:border-slate-700 hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span
                          className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-extrabold mb-1 ${
                            item.jenisTransaksi.includes('PB')
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                          }`}
                        >
                          {item.jenisTransaksi}
                        </span>
                        <h5 className="text-xs font-bold text-white leading-snug">{item.namaPelanggan}</h5>
                        <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{item.lokasi}</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFlyTo(item);
                        }}
                        className="p-1 text-amber-400 hover:text-white bg-slate-900 rounded-lg border border-slate-800"
                        title="Fokus ke Peta"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-800/60 pt-1.5">
                      <div>
                        <strong className="text-indigo-300">{item.penyulang}</strong> • Gardu {item.noGardu}
                      </div>
                      <div className="font-mono text-emerald-400">
                        ΔV: {dropVolt}V ({item.tegTetangga}V)
                      </div>
                    </div>

                    {isSelected && (
                      <div className="mt-2.5 pt-2 border-t border-amber-500/30 flex items-center gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectDetail(item);
                          }}
                          className="flex-1 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-[10px] font-black transition-all"
                        >
                          Buka Detail
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onExportPDF(item);
                          }}
                          className="p-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-[10px]"
                          title="Cetak BA PDF"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onShareWA(item);
                          }}
                          className="p-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-[10px]"
                          title="Kirim WA"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
