import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import {
  MapPin,
  Zap,
  Building,
  Navigation,
  Layers,
  Ruler,
  Check,
  RotateCcw,
  Compass,
  AlertTriangle,
  CheckCircle2,
  Crosshair,
  Info
} from 'lucide-react';

interface SurveyMapPickerProps {
  bangunanLat?: number;
  bangunanLng?: number;
  titikSambungLat?: number;
  titikSambungLng?: number;
  namaPelanggan?: string;
  titikSambungNama?: string;
  penyulang?: string;
  noGardu?: string;
  fotoBangunan?: string;
  fotoTitikSambung?: string;
  onChangeCoordinates: (coords: {
    lat?: number;
    lng?: number;
    titikSambungLat?: number;
    titikSambungLng?: number;
    distanceMeter?: number;
  }) => void;
}

// Calculate geodesic distance between two points in meters (Haversine formula)
export function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

const PRESET_LOCATIONS = [
  { name: 'Passo (Baguala)', lat: -3.6375, lng: 128.2435 },
  { name: 'Lateri Indah', lat: -3.6450, lng: 128.2310 },
  { name: 'Halong / Galala', lat: -3.6620, lng: 128.2140 },
  { name: 'Tulehu (Pelabuhan)', lat: -3.5620, lng: 128.3410 },
  { name: 'Liang (Dermaga)', lat: -3.5080, lng: 128.3490 },
  { name: 'Hutumuri / Hukurila', lat: -3.7120, lng: 128.2910 },
  { name: 'Laha (Bandara)', lat: -3.7050, lng: 128.0950 },
  { name: 'Ambon Kota (Pusat)', lat: -3.6950, lng: 128.1810 }
];

export const SurveyMapPicker: React.FC<SurveyMapPickerProps> = ({
  bangunanLat,
  bangunanLng,
  titikSambungLat,
  titikSambungLng,
  namaPelanggan = 'Bangunan Pelanggan',
  titikSambungNama = 'Tiang Sambung TR',
  penyulang,
  noGardu,
  fotoBangunan,
  fotoTitikSambung,
  onChangeCoordinates
}) => {
  // Active target mode: 'bangunan' or 'titik_sambung'
  const [activeMode, setActiveMode] = useState<'bangunan' | 'titik_sambung'>('bangunan');
  const [mapStyle, setMapStyle] = useState<'satellite' | 'dark' | 'street'>('satellite');
  const [geoLocating, setGeoLocating] = useState(false);
  const [manualInputOpen, setManualInputOpen] = useState(false);

  // Local coordinates state
  const [bLat, setBLat] = useState<number | undefined>(bangunanLat || -3.6375);
  const [bLng, setBLng] = useState<number | undefined>(bangunanLng || 128.2435);
  const [sLat, setSLat] = useState<number | undefined>(titikSambungLat || (bangunanLat ? bangunanLat - 0.00015 : -3.6376));
  const [sLng, setSLng] = useState<number | undefined>(titikSambungLng || (bangunanLng ? bangunanLng - 0.00015 : 128.2433));

  // Distance calculation
  const distance =
    bLat && bLng && sLat && sLng
      ? calculateDistanceMeters(bLat, bLng, sLat, sLng)
      : undefined;

  // Map DOM and instance refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const layerGroupRef = useRef<L.FeatureGroup | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);
  const bangunanMarkerRef = useRef<L.Marker | null>(null);
  const sambungMarkerRef = useRef<L.Marker | null>(null);

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

  // Sync props changes to internal state
  useEffect(() => {
    if (bangunanLat !== undefined) setBLat(bangunanLat);
    if (bangunanLng !== undefined) setBLng(bangunanLng);
    if (titikSambungLat !== undefined) setSLat(titikSambungLat);
    if (titikSambungLng !== undefined) setSLng(titikSambungLng);
  }, [bangunanLat, bangunanLng, titikSambungLat, titikSambungLng]);

  // Invalidate Map size on render and resize
  useEffect(() => {
    const handleResize = () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    };

    const timers = [
      setTimeout(handleResize, 100),
      setTimeout(handleResize, 350),
      setTimeout(handleResize, 700),
      setTimeout(handleResize, 1200)
    ];

    let resizeObserver: ResizeObserver | null = null;
    if (mapContainerRef.current && window.ResizeObserver) {
      resizeObserver = new ResizeObserver(() => {
        handleResize();
      });
      resizeObserver.observe(mapContainerRef.current);
    }

    return () => {
      timers.forEach(t => clearTimeout(t));
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, []);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const initialCenterLat = bLat || -3.6375;
    const initialCenterLng = bLng || 128.2435;

    const map = L.map(mapContainerRef.current, {
      center: [initialCenterLat, initialCenterLng],
      zoom: 17,
      zoomControl: false
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const tile = L.tileLayer(getTileUrl(mapStyle), {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap | Esri Satellite'
    }).addTo(map);

    tileLayerRef.current = tile;
    layerGroupRef.current = L.featureGroup().addTo(map);
    mapInstanceRef.current = map;

    // Trigger invalidateSize once ready
    setTimeout(() => {
      map.invalidateSize();
    }, 250);

    // Handle map click
    map.on('click', (e: L.LeafletMouseEvent) => {
      const clickLat = Number(e.latlng.lat.toFixed(6));
      const clickLng = Number(e.latlng.lng.toFixed(6));

      if (activeModeRef.current === 'bangunan') {
        setBLat(clickLat);
        setBLng(clickLng);
        const currentSLat = sLatRef.current;
        const currentSLng = sLngRef.current;
        const dist = currentSLat && currentSLng ? calculateDistanceMeters(clickLat, clickLng, currentSLat, currentSLng) : undefined;
        onChangeCoordinates({
          lat: clickLat,
          lng: clickLng,
          titikSambungLat: currentSLat,
          titikSambungLng: currentSLng,
          distanceMeter: dist ? Math.round(dist) : undefined
        });
      } else {
        setSLat(clickLat);
        setSLng(clickLng);
        const currentBLat = bLatRef.current;
        const currentBLng = bLngRef.current;
        const dist = currentBLat && currentBLng ? calculateDistanceMeters(currentBLat, currentBLng, clickLat, clickLng) : undefined;
        onChangeCoordinates({
          lat: currentBLat,
          lng: currentBLng,
          titikSambungLat: clickLat,
          titikSambungLng: clickLng,
          distanceMeter: dist ? Math.round(dist) : undefined
        });
      }
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Mutable refs to prevent stale closure inside leaflet event listener
  const activeModeRef = useRef(activeMode);
  activeModeRef.current = activeMode;
  const bLatRef = useRef(bLat);
  bLatRef.current = bLat;
  const bLngRef = useRef(bLng);
  bLngRef.current = bLng;
  const sLatRef = useRef(sLat);
  sLatRef.current = sLat;
  const sLngRef = useRef(sLng);
  sLngRef.current = sLng;

  // Change Tile Layer when mapStyle changes
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;
    mapInstanceRef.current.removeLayer(tileLayerRef.current);
    const newTile = L.tileLayer(getTileUrl(mapStyle), { maxZoom: 19 }).addTo(mapInstanceRef.current);
    tileLayerRef.current = newTile;
  }, [mapStyle]);

  // Update Markers and Polyline on coordinate changes
  useEffect(() => {
    if (!mapInstanceRef.current || !layerGroupRef.current) return;
    const lg = layerGroupRef.current;
    lg.clearLayers();

    // 1. Bangunan Marker (Cyan / Blue House)
    if (bLat && bLng) {
      const buildingIcon = L.divIcon({
        className: 'custom-building-pin',
        html: `
          <div style="position: relative; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; cursor: grab;">
            <div style="position: absolute; width: 34px; height: 34px; border-radius: 12px; background: #0284c7; border: 3px solid #ffffff; box-shadow: 0 0 15px rgba(2,132,199,0.8), 0 4px 10px rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; color: #ffffff;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
            </div>
            <div style="position: absolute; top: -20px; background: #0f172a; color: #38bdf8; font-size: 10px; font-weight: 800; padding: 2px 6px; border-radius: 6px; border: 1px solid #0284c7; white-space: nowrap; box-shadow: 0 2px 8px rgba(0,0,0,0.5);">
              🏠 Bangunan Pelanggan
            </div>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        popupAnchor: [0, -22]
      });

      const bMarker = L.marker([bLat, bLng], { icon: buildingIcon, draggable: true }).addTo(lg);
      bangunanMarkerRef.current = bMarker;

      bMarker.bindPopup(`
        <div style="font-family: sans-serif; min-width: 220px; padding: 2px;">
          <div style="font-weight: 800; font-size: 13px; color: #0284c7; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 6px;">
            🏠 Bangunan yang Mau Disambung
          </div>
          <div style="font-size: 12px; color: #0f172a; font-weight: 700; margin-bottom: 4px;">
            ${namaPelanggan}
          </div>
          <div style="font-size: 11px; color: #64748b; font-family: monospace;">
            Lat: <strong>${bLat.toFixed(6)}</strong><br/>
            Lng: <strong>${bLng.toFixed(6)}</strong>
          </div>
          <div style="margin-top: 6px; font-size: 10px; color: #059669; font-weight: bold;">
            (Bisa digeser/drag langsung untuk koreksi posisi)
          </div>
        </div>
      `);

      bMarker.on('dragend', (e) => {
        const marker = e.target;
        const position = marker.getLatLng();
        const newLat = Number(position.lat.toFixed(6));
        const newLng = Number(position.lng.toFixed(6));
        setBLat(newLat);
        setBLng(newLng);
        const dist = sLat && sLng ? calculateDistanceMeters(newLat, newLng, sLat, sLng) : undefined;
        onChangeCoordinates({
          lat: newLat,
          lng: newLng,
          titikSambungLat: sLat,
          titikSambungLng: sLng,
          distanceMeter: dist ? Math.round(dist) : undefined
        });
      });
    }

    // 2. Titik Sambung Marker (Amber / Orange Pole / Lightning)
    if (sLat && sLng) {
      const sambungIcon = L.divIcon({
        className: 'custom-sambung-pin',
        html: `
          <div style="position: relative; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; cursor: grab;">
            <div style="position: absolute; width: 34px; height: 34px; border-radius: 12px; background: #f59e0b; border: 3px solid #ffffff; box-shadow: 0 0 15px rgba(245,158,11,0.8), 0 4px 10px rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; color: #000000;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
              </svg>
            </div>
            <div style="position: absolute; top: -20px; background: #0f172a; color: #fbbf24; font-size: 10px; font-weight: 800; padding: 2px 6px; border-radius: 6px; border: 1px solid #f59e0b; white-space: nowrap; box-shadow: 0 2px 8px rgba(0,0,0,0.5);">
              ⚡ Titik Sambung TR
            </div>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        popupAnchor: [0, -22]
      });

      const sMarker = L.marker([sLat, sLng], { icon: sambungIcon, draggable: true }).addTo(lg);
      sambungMarkerRef.current = sMarker;

      sMarker.bindPopup(`
        <div style="font-family: sans-serif; min-width: 220px; padding: 2px;">
          <div style="font-weight: 800; font-size: 13px; color: #d97706; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 6px;">
            ⚡ Titik Sambung / Tiang JTR
          </div>
          <div style="font-size: 12px; color: #0f172a; font-weight: 700; margin-bottom: 4px;">
            ${titikSambungNama}
          </div>
          <div style="font-size: 11px; color: #64748b; font-family: monospace;">
            Lat: <strong>${sLat.toFixed(6)}</strong><br/>
            Lng: <strong>${sLng.toFixed(6)}</strong>
          </div>
          ${noGardu ? `<div style="font-size: 11px; color: #475569; margin-top: 4px;">Gardu: <strong>${noGardu}</strong> | ${penyulang || ''}</div>` : ''}
          <div style="margin-top: 6px; font-size: 10px; color: #059669; font-weight: bold;">
            (Bisa digeser/drag langsung untuk koreksi posisi)
          </div>
        </div>
      `);

      sMarker.on('dragend', (e) => {
        const marker = e.target;
        const position = marker.getLatLng();
        const newLat = Number(position.lat.toFixed(6));
        const newLng = Number(position.lng.toFixed(6));
        setSLat(newLat);
        setSLng(newLng);
        const dist = bLat && bLng ? calculateDistanceMeters(bLat, bLng, newLat, newLng) : undefined;
        onChangeCoordinates({
          lat: bLat,
          lng: bLng,
          titikSambungLat: newLat,
          titikSambungLng: newLng,
          distanceMeter: dist ? Math.round(dist) : undefined
        });
      });
    }

    // 3. Connect both points with an SR Cable Polyline
    if (bLat && bLng && sLat && sLng) {
      const lineCoords: [number, number][] = [
        [sLat, sLng],
        [bLat, bLng]
      ];

      const distMeter = calculateDistanceMeters(bLat, bLng, sLat, sLng);
      const isOverLimit = distMeter > 50;
      const lineColor = isOverLimit ? '#ef4444' : '#f59e0b';

      const polyline = L.polyline(lineCoords, {
        color: lineColor,
        weight: 4,
        dashArray: '8, 8',
        opacity: 0.95
      }).addTo(lg);
      polylineRef.current = polyline;

      // Midpoint tooltip showing distance
      const midLat = (bLat + sLat) / 2;
      const midLng = (bLng + sLng) / 2;

      polyline.bindTooltip(
        `📏 Panjang Tarikan SR: <strong>${distMeter} Meter</strong> ${isOverLimit ? '(⚠️ Melebihi 50m - Butuh Tiang Sisip)' : '(✅ Sesuai Standar)'}`,
        {
          permanent: true,
          direction: 'top',
          className: 'custom-sr-tooltip',
          offset: [0, -10]
        }
      );
    }
  }, [bLat, bLng, sLat, sLng, namaPelanggan, titikSambungNama, noGardu, penyulang]);

  // Fly to current GPS
  const handleUseCurrentGPS = () => {
    if (!navigator.geolocation) {
      alert('Fitur Geolocation tidak didukung di browser ini.');
      return;
    }
    setGeoLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoLocating(false);
        const curLat = Number(pos.coords.latitude.toFixed(6));
        const curLng = Number(pos.coords.longitude.toFixed(6));

        if (activeMode === 'bangunan') {
          setBLat(curLat);
          setBLng(curLng);
          const dist = sLat && sLng ? calculateDistanceMeters(curLat, curLng, sLat, sLng) : undefined;
          onChangeCoordinates({
            lat: curLat,
            lng: curLng,
            titikSambungLat: sLat,
            titikSambungLng: sLng,
            distanceMeter: dist ? Math.round(dist) : undefined
          });
        } else {
          setSLat(curLat);
          setSLng(curLng);
          const dist = bLat && bLng ? calculateDistanceMeters(bLat, bLng, curLat, curLng) : undefined;
          onChangeCoordinates({
            lat: bLat,
            lng: bLng,
            titikSambungLat: curLat,
            titikSambungLng: curLng,
            distanceMeter: dist ? Math.round(dist) : undefined
          });
        }

        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([curLat, curLng], 18, { animate: true, duration: 1.2 });
        }
      },
      (err) => {
        setGeoLocating(false);
        alert(`Gagal mengambil titik GPS: ${err.message}. Pastikan izin lokasi aktif.`);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Jump to Preset Location
  const handleJumpToPreset = (lat: number, lng: number) => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([lat, lng], 17, { animate: true, duration: 1.0 });
    }
  };

  // Fit bounds to show both points
  const handleFitBothPoints = () => {
    if (!mapInstanceRef.current || !bLat || !bLng || !sLat || !sLng) return;
    const bounds = L.latLngBounds([
      [bLat, bLng],
      [sLat, sLng]
    ]);
    mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 18 });
  };

  return (
    <div className="space-y-3 bg-slate-950 border border-slate-800 rounded-2xl p-4 shadow-inner">
      {/* Header Bar & Mode Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div>
          <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-2">
            <Compass className="w-4 h-4 text-amber-400" />
            Penentuan Koordinat Geografis (Klik Peta Langsung)
          </h4>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Pilih mode di bawah, lalu klik di atas peta untuk meletakkan titik koordinat secara presisi.
          </p>
        </div>

        {/* Action Mode Toggle */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveMode('bangunan')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeMode === 'bangunan'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30 border border-sky-400'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>1. Titik Bangunan</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('titik_sambung')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeMode === 'titik_sambung'
                ? 'bg-amber-600 text-slate-950 shadow-md shadow-amber-600/30 border border-amber-300 font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>2. Titik Sambung (Tiang)</span>
          </button>
        </div>
      </div>

      {/* Active Mode Notice Banner */}
      <div
        className={`p-2.5 rounded-xl text-xs flex items-center justify-between border ${
          activeMode === 'bangunan'
            ? 'bg-sky-950/40 border-sky-800/60 text-sky-200'
            : 'bg-amber-950/40 border-amber-800/60 text-amber-200'
        }`}
      >
        <div className="flex items-center gap-2">
          <Crosshair className={`w-4 h-4 animate-spin ${activeMode === 'bangunan' ? 'text-sky-400' : 'text-amber-400'}`} style={{ animationDuration: '6s' }} />
          <span>
            {activeMode === 'bangunan' ? (
              <>
                Mode Aktif: <strong>Klik pada Peta untuk Posisi Bangunan / Rumah Pelanggan</strong>
              </>
            ) : (
              <>
                Mode Aktif: <strong>Klik pada Peta untuk Posisi Tiang TR / Titik Sambung</strong>
              </>
            )}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleUseCurrentGPS}
            disabled={geoLocating}
            className="flex items-center gap-1 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-lg text-[11px] font-bold border border-slate-700 transition-all cursor-pointer"
            title="Gunakan koordinat GPS perangkat surveyor saat ini"
          >
            <Navigation className={`w-3 h-3 text-emerald-400 ${geoLocating ? 'animate-spin' : ''}`} />
            <span>{geoLocating ? 'Mencari GPS...' : 'GPS Lapangan'}</span>
          </button>

          {bLat && sLat && (
            <button
              type="button"
              onClick={handleFitBothPoints}
              className="flex items-center gap-1 px-2 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg text-[11px] font-semibold border border-slate-700 cursor-pointer"
              title="Fokuskan kedua titik di layar"
            >
              <Ruler className="w-3 h-3 text-amber-400" />
              <span>Fokus 2 Titik</span>
            </button>
          )}
        </div>
      </div>

      {/* Interactive Leaflet Map Container */}
      <div className="relative w-full h-[320px] rounded-xl overflow-hidden border border-slate-800 shadow-xl bg-slate-900">
        <div ref={mapContainerRef} className="w-full h-full z-10" />

        {/* Map Layer Switcher Floating on Top Right */}
        <div className="absolute top-2.5 right-2.5 z-20 flex items-center bg-slate-950/90 backdrop-blur-md p-1 rounded-xl border border-slate-800 shadow-xl text-[11px]">
          <button
            type="button"
            onClick={() => setMapStyle('satellite')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
              mapStyle === 'satellite'
                ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            🛰️ Satelit
          </button>
          <button
            type="button"
            onClick={() => setMapStyle('dark')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
              mapStyle === 'dark'
                ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            🌙 Gelap
          </button>
          <button
            type="button"
            onClick={() => setMapStyle('street')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
              mapStyle === 'street'
                ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            🗺️ Jalan
          </button>
        </div>

        {/* Quick Area Jump Selector Floating on Top Left */}
        <div className="absolute top-2.5 left-2.5 z-20 hidden sm:flex items-center gap-1 bg-slate-950/90 backdrop-blur-md px-2 py-1 rounded-xl border border-slate-800 shadow-xl text-[10px]">
          <span className="text-slate-400 font-bold">Lompat Area:</span>
          <select
            onChange={(e) => {
              const val = e.target.value;
              const preset = PRESET_LOCATIONS.find((p) => p.name === val);
              if (preset) handleJumpToPreset(preset.lat, preset.lng);
            }}
            className="bg-slate-900 text-amber-300 font-bold border border-slate-700 rounded-lg px-2 py-0.5 focus:outline-none"
            defaultValue=""
          >
            <option value="" disabled>Pilih Area Baguala/Ambon...</option>
            {PRESET_LOCATIONS.map((loc) => (
              <option key={loc.name} value={loc.name}>
                {loc.name}
              </option>
            ))}
          </select>
        </div>

        {/* Live Distance & Validity Floating Badge at Bottom Center */}
        {distance !== undefined && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 bg-slate-950/95 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-amber-500/50 shadow-2xl flex items-center gap-2.5 text-xs">
            <div className="p-1 bg-amber-500/20 text-amber-400 rounded-full">
              <Ruler className="w-3.5 h-3.5" />
            </div>
            <div className="flex items-center gap-1.5 text-slate-200">
              <span>Panjang Saluran Rumah (SR):</span>
              <strong className="text-amber-400 font-mono text-sm">{distance} Meter</strong>
            </div>
            {distance > 50 ? (
              <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-bold">
                ⚠️ &gt; 50m (Perlu Sisip Tiang)
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                ✅ Sesuai Standar (&le; 50m)
              </span>
            )}
          </div>
        )}
      </div>

      {/* Coordinate Details Box & Manual Fine-Tune Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 text-xs">
        {/* Titik 1: Bangunan */}
        <div className="p-3 bg-slate-900/90 border border-sky-900/50 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-sky-400 flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-sky-400" />
              1. Koordinat Bangunan / Pelanggan
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800">
              {namaPelanggan}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] text-slate-400 font-semibold mb-0.5">Latitude (Lintang)</label>
              <input
                type="number"
                step="any"
                value={bLat !== undefined ? bLat : ''}
                onChange={(e) => {
                  const val = e.target.value ? Number(e.target.value) : undefined;
                  setBLat(val);
                  const dist = val && bLng && sLat && sLng ? calculateDistanceMeters(val, bLng, sLat, sLng) : undefined;
                  onChangeCoordinates({
                    lat: val,
                    lng: bLng,
                    titikSambungLat: sLat,
                    titikSambungLng: sLng,
                    distanceMeter: dist ? Math.round(dist) : undefined
                  });
                }}
                placeholder="-3.6375"
                className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 font-semibold mb-0.5">Longitude (Bujur)</label>
              <input
                type="number"
                step="any"
                value={bLng !== undefined ? bLng : ''}
                onChange={(e) => {
                  const val = e.target.value ? Number(e.target.value) : undefined;
                  setBLng(val);
                  const dist = bLat && val && sLat && sLng ? calculateDistanceMeters(bLat, val, sLat, sLng) : undefined;
                  onChangeCoordinates({
                    lat: bLat,
                    lng: val,
                    titikSambungLat: sLat,
                    titikSambungLng: sLng,
                    distanceMeter: dist ? Math.round(dist) : undefined
                  });
                }}
                placeholder="128.2435"
                className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>
        </div>

        {/* Titik 2: Titik Sambung */}
        <div className="p-3 bg-slate-900/90 border border-amber-900/50 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-amber-400 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              2. Koordinat Titik Sambung (Tiang JTR)
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
              {titikSambungNama}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] text-slate-400 font-semibold mb-0.5">Latitude (Lintang)</label>
              <input
                type="number"
                step="any"
                value={sLat !== undefined ? sLat : ''}
                onChange={(e) => {
                  const val = e.target.value ? Number(e.target.value) : undefined;
                  setSLat(val);
                  const dist = bLat && bLng && val && sLng ? calculateDistanceMeters(bLat, bLng, val, sLng) : undefined;
                  onChangeCoordinates({
                    lat: bLat,
                    lng: bLng,
                    titikSambungLat: val,
                    titikSambungLng: sLng,
                    distanceMeter: dist ? Math.round(dist) : undefined
                  });
                }}
                placeholder="-3.6376"
                className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 font-semibold mb-0.5">Longitude (Bujur)</label>
              <input
                type="number"
                step="any"
                value={sLng !== undefined ? sLng : ''}
                onChange={(e) => {
                  const val = e.target.value ? Number(e.target.value) : undefined;
                  setSLng(val);
                  const dist = bLat && bLng && sLat && val ? calculateDistanceMeters(bLat, bLng, sLat, val) : undefined;
                  onChangeCoordinates({
                    lat: bLat,
                    lng: bLng,
                    titikSambungLat: sLat,
                    titikSambungLng: val,
                    distanceMeter: dist ? Math.round(dist) : undefined
                  });
                }}
                placeholder="128.2433"
                className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
