import React, { useState, useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Zap,
  MapPin,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Search,
  Download,
  Crosshair,
  Layers,
  Sliders,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  X,
  AlertTriangle,
  RotateCcw,
  Navigation,
  Compass,
  ExternalLink,
  Eye,
  Maximize2,
  Sparkles,
  Info
} from 'lucide-react';
import { MasterGarduHubung, KomponenPenyulangGH, Penyulang } from '../../types';
import { exportToCSV } from '../../utils/exportCsv';

interface GarduHubungMasterSectionProps {
  penyulangList: Penyulang[];
}

const NAMA_GH_OPTIONS = [
  'GH Baguala',
  'GH Area',
  'GH Poka',
  'GH Hative Kecil',
  'GH Box Pante Poka',
  'GH Box Pante Galala',
  'GH Wayame',
  'GH Bandara',
  'GH Aston'
];

const PRESET_COORDINATES: Record<string, { lat: number; lng: number; lokasi: string }> = {
  'GH Baguala': { lat: -3.642100, lng: 128.231500, lokasi: 'Passo - Baguala, Kota Ambon' },
  'GH Area': { lat: -3.663595, lng: 128.204330, lokasi: 'Kantor UP3 Ambon, Jl. Sultan Hasanuddin, Sirimau' },
  'GH Poka': { lat: -3.655800, lng: 128.188400, lokasi: 'Jl. Ir. M. Putuhena, Poka, Teluk Ambon' },
  'GH Hative Kecil': { lat: -3.678100, lng: 128.204500, lokasi: 'Jl. Jenderal Sudirman, Hative Kecil, Sirimau' },
  'GH Box Pante Poka': { lat: -3.658200, lng: 128.191200, lokasi: 'Kawasan Pesisir Pante Poka, Teluk Ambon' },
  'GH Box Pante Galala': { lat: -3.671000, lng: 128.201000, lokasi: 'Pesisir Galala, Sirimau, Kota Ambon' },
  'GH Wayame': { lat: -3.664500, lng: 128.163200, lokasi: 'Jl. Dr. J. Leimena, Wayame, Teluk Ambon' },
  'GH Bandara': { lat: -3.708900, lng: 128.089100, lokasi: 'Kawasan Bandara Internasional Pattimura, Laha' },
  'GH Aston': { lat: -3.669500, lng: 128.215000, lokasi: 'Kawasan Komersial Hotel Aston / Natsepa Baguala' }
};

const INITIAL_GH_DATA: MasterGarduHubung[] = [
  {
    id: 'gh-1',
    nama: 'GH Area',
    lokasi: 'Kantor UP3 Ambon',
    latitude: -3.663595,
    longitude: 128.204330,
    status: 'Operasi',
    tahunOperasi: 2026,
    komponenPenyulang: [
      { id: 'kp-1', penamaan: 'Incoming', penyulang: 'Lateri 1' },
      { id: 'kp-2', penamaan: 'Outgoing', penyulang: 'Lateri 1' }
    ]
  },
  {
    id: 'gh-2',
    nama: 'GH Baguala',
    lokasi: 'Passo - Baguala, Kota Ambon',
    latitude: -3.642100,
    longitude: 128.231500,
    status: 'Operasi',
    tahunOperasi: 2018,
    komponenPenyulang: [
      { id: 'kp-3', penamaan: 'Incoming', penyulang: 'Passo' },
      { id: 'kp-4', penamaan: 'Outgoing', penyulang: 'Waiheru 1' },
      { id: 'kp-5', penamaan: 'Outgoing', penyulang: 'ACC' },
      { id: 'kp-6', penamaan: 'Coupling 3', penyulang: 'Passo' },
      { id: 'kp-7', penamaan: 'Coupling 4', penyulang: 'Passo' },
      { id: 'kp-8', penamaan: 'Incoming', penyulang: 'Waiheru 3 GI Passo' },
      { id: 'kp-9', penamaan: 'Outgoing', penyulang: 'Waiheru 3 Poka' }
    ]
  },
  {
    id: 'gh-3',
    nama: 'GH Poka',
    lokasi: 'Jl. Ir. M. Putuhena, Poka, Teluk Ambon',
    latitude: -3.655800,
    longitude: 128.188400,
    status: 'Operasi',
    tahunOperasi: 2020,
    komponenPenyulang: [
      { id: 'kp-10', penamaan: 'Incoming Waiheru 3', penyulang: 'Waiheru 3 Poka' },
      { id: 'kp-11', penamaan: 'Outgoing Wayame 1', penyulang: 'Wayame 1' }
    ]
  },
  {
    id: 'gh-4',
    nama: 'GH Hative Kecil',
    lokasi: 'Jl. Jenderal Sudirman, Hative Kecil',
    latitude: -3.678100,
    longitude: 128.204500,
    status: 'Operasi',
    tahunOperasi: 2019,
    komponenPenyulang: [
      { id: 'kp-12', penamaan: 'Incoming Lateri 2', penyulang: 'Lateri 2' },
      { id: 'kp-13', penamaan: 'Outgoing Lateri 1', penyulang: 'Lateri 1' },
      { id: 'kp-14', penamaan: 'Coupling Busbar', penyulang: 'Lateri 2' }
    ]
  },
  {
    id: 'gh-5',
    nama: 'GH Box Pante Poka',
    lokasi: 'Kawasan Pesisir Pante Poka, Teluk Ambon',
    latitude: -3.658200,
    longitude: 128.191200,
    status: 'Operasi',
    tahunOperasi: 2021,
    komponenPenyulang: [
      { id: 'kp-15', penamaan: 'Incoming Waiheru 3', penyulang: 'Waiheru 3 Poka' },
      { id: 'kp-16', penamaan: 'Outgoing Box Distribusi', penyulang: 'Waiheru 3 Poka' }
    ]
  },
  {
    id: 'gh-6',
    nama: 'GH Box Pante Galala',
    lokasi: 'Pesisir Galala, Sirimau, Kota Ambon',
    latitude: -3.671000,
    longitude: 128.201000,
    status: 'Operasi',
    tahunOperasi: 2021,
    komponenPenyulang: [
      { id: 'kp-17', penamaan: 'Incoming Galala 1', penyulang: 'Galala 1' },
      { id: 'kp-18', penamaan: 'Outgoing Galala 2', penyulang: 'Galala 2' }
    ]
  },
  {
    id: 'gh-7',
    nama: 'GH Wayame',
    lokasi: 'Jl. Dr. J. Leimena, Wayame, Teluk Ambon',
    latitude: -3.664500,
    longitude: 128.163200,
    status: 'Operasi',
    tahunOperasi: 2017,
    komponenPenyulang: [
      { id: 'kp-19', penamaan: 'Incoming Wayame 2', penyulang: 'Wayame 2' },
      { id: 'kp-20', penamaan: 'Outgoing Wayame 3', penyulang: 'Wayame 3' },
      { id: 'kp-21', penamaan: 'Coupling Busbar', penyulang: 'Wayame 2' }
    ]
  },
  {
    id: 'gh-8',
    nama: 'GH Bandara',
    lokasi: 'Kawasan Bandara Internasional Pattimura, Laha',
    latitude: -3.708900,
    longitude: 128.089100,
    status: 'Operasi',
    tahunOperasi: 2015,
    komponenPenyulang: [
      { id: 'kp-22', penamaan: 'Incoming Bandara 1', penyulang: 'Bandara 1' },
      { id: 'kp-23', penamaan: 'Incoming Bandara 2', penyulang: 'Bandara 2' },
      { id: 'kp-24', penamaan: 'Outgoing ATS Bandara', penyulang: 'Bandara 1' }
    ]
  },
  {
    id: 'gh-9',
    nama: 'GH Aston',
    lokasi: 'Kawasan Komersial Hotel Aston / Natsepa Baguala',
    latitude: -3.669500,
    longitude: 128.215000,
    status: 'Operasi',
    tahunOperasi: 2019,
    komponenPenyulang: [
      { id: 'kp-25', penamaan: 'Incoming Tulehu', penyulang: 'Tulehu' },
      { id: 'kp-26', penamaan: 'Outgoing Pelanggan Premium', penyulang: 'Tulehu' }
    ]
  }
];

export const GarduHubungMasterSection: React.FC<GarduHubungMasterSectionProps> = ({
  penyulangList
}) => {
  // Load stored GH list or default
  const [ghList, setGhList] = useState<MasterGarduHubung[]>(() => {
    try {
      const saved = localStorage.getItem('perang_padam_master_gardu_hubung');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Error loading gardu hubung from localStorage', e);
    }
    return INITIAL_GH_DATA;
  });

  // Toggle state to open/close the input menu
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);

  // Modal confirmation for delete
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<{ id: string; nama: string } | null>(null);

  // Save to localStorage on change
  const saveToStorage = (list: MasterGarduHubung[]) => {
    try {
      localStorage.setItem('perang_padam_master_gardu_hubung', JSON.stringify(list));
    } catch (e) {
      console.error('Error saving gardu hubung to localStorage', e);
    }
  };

  useEffect(() => {
    saveToStorage(ghList);
  }, [ghList]);

  // Form states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedNamaPreset, setSelectedNamaPreset] = useState<string>('GH Baguala');
  const [customNama, setCustomNama] = useState<string>('');
  const [lokasi, setLokasi] = useState<string>('Passo - Baguala, Kota Ambon');
  const [latitude, setLatitude] = useState<number>(-3.642100);
  const [longitude, setLongitude] = useState<number>(128.231500);
  const [status, setStatus] = useState<'Operasi' | 'Standby' | 'Pemeliharaan'>('Operasi');
  const [tahunOperasi, setTahunOperasi] = useState<number>(new Date().getFullYear());
  
  // Penamaan dan Penyulang (Dinamis Tambah/Kurang)
  const [komponenList, setKomponenList] = useState<KomponenPenyulangGH[]>([
    { id: 'kp-init-1', penamaan: 'Incoming', penyulang: penyulangList[0]?.namaPenyulang || 'Passo' },
    { id: 'kp-init-2', penamaan: 'Outgoing', penyulang: penyulangList[1]?.namaPenyulang || 'Hutumuri' },
    { id: 'kp-init-3', penamaan: 'Coupling Busbar', penyulang: penyulangList[0]?.namaPenyulang || 'Passo' }
  ]);

  // Map references for Form Mini Map
  const formMapContainerRef = useRef<HTMLDivElement>(null);
  const formMapInstanceRef = useRef<L.Map | null>(null);
  const formMarkerRef = useRef<L.Marker | null>(null);
  const formTileLayerRef = useRef<L.TileLayer | null>(null);
  const [formMapLayerType, setFormMapLayerType] = useState<'street' | 'satellite' | 'dark'>('street');

  // OVERVIEW GIS MAP FOR ALL GARDU HUBUNG
  const allGhMapContainerRef = useRef<HTMLDivElement>(null);
  const allGhMapInstanceRef = useRef<L.Map | null>(null);
  const allGhMarkersRef = useRef<Record<string, L.Marker>>({});
  const allGhTileLayerRef = useRef<L.TileLayer | null>(null);
  const [allMapLayerType, setAllMapLayerType] = useState<'street' | 'satellite' | 'dark'>('street');
  const [allMapFilterStatus, setAllMapFilterStatus] = useState<string>('Semua');
  const [selectedGhIdOnMap, setSelectedGhIdOnMap] = useState<string | null>(null);

  // Success / Alert message
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Table search & filter
  const [searchQuery, setSearchQuery] = useState('');

  // Helper to approximate location description from coordinates
  const approximateLocationName = (lat: number, lng: number): string => {
    if (lat > -3.655 && lng > 128.22) {
      return `Passo - Baguala, Kota Ambon (Titik: ${lat}, ${lng})`;
    } else if (lat < -3.69 && lng < 128.12) {
      return `Kawasan Bandara Pattimura / Laha (Titik: ${lat}, ${lng})`;
    } else if (lng < 128.18 && lat > -3.67) {
      return `Wayame - Teluk Ambon (Titik: ${lat}, ${lng})`;
    } else if (lat > -3.665 && lng > 128.18 && lng < 128.20) {
      return `Poka - Teluk Ambon (Titik: ${lat}, ${lng})`;
    } else if (lat < -3.67 && lng > 128.19 && lng < 128.21) {
      return `Hative Kecil / Galala - Sirimau (Titik: ${lat}, ${lng})`;
    }
    return `Kawasan Wilayah ULP Baguala (Titik: ${lat}, ${lng})`;
  };

  // ----------------------------------------------------
  // 1. ALL GARDU HUBUNG OVERVIEW MAP INITIALIZATION
  // ----------------------------------------------------
  useEffect(() => {
    if (!allGhMapContainerRef.current) return;
    if (allGhMapInstanceRef.current) return;

    let resizeObserver: ResizeObserver | null = null;

    try {
      const map = L.map(allGhMapContainerRef.current, {
        center: [-3.665, 128.195],
        zoom: 12,
        zoomControl: false
      });

      L.control.zoom({ position: 'topright' }).addTo(map);

      let tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      let tileAttr = '&copy; OpenStreetMap contributors';

      const tileLayer = L.tileLayer(tileUrl, { attribution: tileAttr, maxZoom: 19 }).addTo(map);
      allGhTileLayerRef.current = tileLayer;
      allGhMapInstanceRef.current = map;

      // Invalidate sizes at multiple intervals to guarantee tile rendering
      [100, 300, 600, 1000, 1500].forEach(delay => {
        setTimeout(() => {
          if (allGhMapInstanceRef.current) {
            allGhMapInstanceRef.current.invalidateSize();
          }
        }, delay);
      });

      // Automatically fit bounds to all valid GH markers
      setTimeout(() => {
        if (!allGhMapInstanceRef.current) return;
        const validGhs = ghList.filter(g => g.latitude && g.longitude);
        if (validGhs.length > 0) {
          const bounds = L.latLngBounds(validGhs.map(g => [g.latitude!, g.longitude!]));
          allGhMapInstanceRef.current.fitBounds(bounds, { padding: [45, 45], maxZoom: 14 });
        }
      }, 400);

      // Setup ResizeObserver for fluid responsiveness
      if (typeof ResizeObserver !== 'undefined' && allGhMapContainerRef.current) {
        resizeObserver = new ResizeObserver(() => {
          if (allGhMapInstanceRef.current) {
            allGhMapInstanceRef.current.invalidateSize();
          }
        });
        resizeObserver.observe(allGhMapContainerRef.current);
      }
    } catch (e) {
      console.error('Error initializing All GH Map:', e);
    }

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      if (allGhMapInstanceRef.current) {
        allGhMapInstanceRef.current.remove();
        allGhMapInstanceRef.current = null;
        allGhMarkersRef.current = {};
        allGhTileLayerRef.current = null;
      }
    };
  }, []);

  // Update Tile Layer for All GH Map
  useEffect(() => {
    const map = allGhMapInstanceRef.current;
    if (!map) return;

    if (allGhTileLayerRef.current) {
      allGhTileLayerRef.current.remove();
    }

    let tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    let tileAttr = '&copy; OpenStreetMap';
    let maxZ = 19;

    if (allMapLayerType === 'satellite') {
      tileUrl = 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}';
      tileAttr = '&copy; Google Hybrid Satellite';
      maxZ = 20;
    } else if (allMapLayerType === 'dark') {
      tileUrl = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
      tileAttr = '&copy; CARTO Voyager';
      maxZ = 19;
    }

    const newTile = L.tileLayer(tileUrl, { attribution: tileAttr, maxZoom: maxZ }).addTo(map);
    allGhTileLayerRef.current = newTile;
    map.invalidateSize();
  }, [allMapLayerType]);

  // Update Markers for All Gardu Hubung on the Overview Map
  useEffect(() => {
    const map = allGhMapInstanceRef.current;
    if (!map) return;

    // Filter displayed list by status if any
    const displayList = ghList.filter(g => {
      if (!g.latitude || !g.longitude) return false;
      if (allMapFilterStatus === 'Semua') return true;
      return g.status === allMapFilterStatus;
    });

    // Remove obsolete markers
    Object.keys(allGhMarkersRef.current).forEach(id => {
      if (!displayList.some(g => g.id === id)) {
        map.removeLayer(allGhMarkersRef.current[id]);
        delete allGhMarkersRef.current[id];
      }
    });

    // Add or update markers
    displayList.forEach(gh => {
      if (!gh.latitude || !gh.longitude) return;

      const position: [number, number] = [gh.latitude, gh.longitude];
      const isOperasi = gh.status === 'Operasi';
      const isStandby = gh.status === 'Standby';
      
      const pinColor = isOperasi ? '#059669' : isStandby ? '#D97706' : '#DC2626'; // Green, Amber, Red
      const bayCount = gh.komponenPenyulang?.length || 0;

      // Custom high-contrast electric icon with pulse animation
      const customIcon = L.divIcon({
        className: 'custom-all-gh-marker',
        html: `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer; transform: translate(-50%, -100%);">
            <!-- Pulsing ring for operational GH -->
            <div style="
              position: absolute;
              top: 4px;
              width: 38px;
              height: 38px;
              border-radius: 50%;
              background: ${pinColor}25;
              border: 2px solid ${pinColor};
              animation: ping 2.5s cubic-bezier(0, 0, 0.2, 1) infinite;
            "></div>

            <!-- Main Pin Icon Body -->
            <div style="
              width: 36px;
              height: 36px;
              border-radius: 12px;
              background: ${pinColor};
              border: 2.5px solid #FFFFFF;
              display: flex;
              align-items: center;
              justify-content: center;
              color: #FFFFFF;
              box-shadow: 0 6px 16px rgba(0,0,0,0.35);
              position: relative;
              z-index: 2;
            ">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            </div>

            <!-- Bottom Arrow -->
            <div style="
              width: 0;
              height: 0;
              border-left: 6px solid transparent;
              border-right: 6px solid transparent;
              border-top: 7px solid ${pinColor};
              margin-top: -1px;
              z-index: 1;
            "></div>

            <!-- Ground Shadow -->
            <div style="
              width: 14px;
              height: 4px;
              background: rgba(0,0,0,0.3);
              border-radius: 50%;
              margin-top: 1px;
            "></div>

            <!-- Floating Title Pill -->
            <div style="
              margin-top: 2px;
              background: #0F172A;
              color: #FFFFFF;
              font-size: 10px;
              font-weight: 800;
              padding: 2px 7px;
              border-radius: 8px;
              border: 1px solid ${pinColor};
              white-space: nowrap;
              box-shadow: 0 3px 8px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              gap: 4px;
            ">
              <span>${gh.nama}</span>
              <span style="color: ${pinColor}; font-size: 8px; background: rgba(255,255,255,0.1); padding: 0 4px; border-radius: 4px;">${bayCount} Bay</span>
            </div>
          </div>
        `,
        iconSize: [0, 0],
        iconAnchor: [0, 0]
      });

      // Build rich popup HTML
      const bayComponentsHtml = gh.komponenPenyulang && gh.komponenPenyulang.length > 0
        ? gh.komponenPenyulang.map(kp => {
            const isInc = (kp.penamaan || '').toLowerCase().includes('in');
            const isCoup = (kp.penamaan || '').toLowerCase().includes('coup');
            const badgeBg = isInc ? '#ECFDF5' : isCoup ? '#FFFBEB' : '#EFF6FF';
            const badgeColor = isInc ? '#047857' : isCoup ? '#B45309' : '#1D4ED8';
            const badgeBorder = isInc ? '#A7F3D0' : isCoup ? '#FDE68A' : '#BFDBFE';

            return `
              <div style="
                background: ${badgeBg};
                color: ${badgeColor};
                border: 1px solid ${badgeBorder};
                padding: 3px 6px;
                border-radius: 6px;
                font-size: 10px;
                font-weight: 700;
                display: flex;
                align-items: center;
                gap: 4px;
                margin-bottom: 3px;
              ">
                <span>${kp.penamaan}</span>
                <span style="color: #94A3B8;">→</span>
                <strong style="text-decoration: underline;">${kp.penyulang}</strong>
              </div>
            `;
          }).join('')
        : '<div style="font-size: 10px; color: #94A3B8;">Belum ada bay terkonfigurasi</div>';

      const popupContent = `
        <div style="font-family: system-ui, -apple-system, sans-serif; padding: 2px; width: 260px;">
          <!-- Header -->
          <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #E2E8F0; padding-bottom: 6px; margin-bottom: 6px;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <div style="width: 24px; height: 24px; border-radius: 6px; background: ${pinColor}20; color: ${pinColor}; display: flex; align-items: center; justify-content: center; font-weight: 900;">
                ⚡
              </div>
              <div>
                <div style="font-size: 13px; font-weight: 900; color: #0F172A; line-height: 1.2;">
                  ${gh.nama}
                </div>
                <div style="font-size: 10px; color: #64748B;">
                  Tahun Operasi: <b>${gh.tahunOperasi || 2020}</b>
                </div>
              </div>
            </div>
            <span style="
              font-size: 9px;
              font-weight: 800;
              text-transform: uppercase;
              padding: 2px 6px;
              border-radius: 6px;
              background: ${isOperasi ? '#DCFCE7' : '#FEF3C7'};
              color: ${isOperasi ? '#166534' : '#92400E'};
            ">
              ${gh.status || 'Operasi'}
            </span>
          </div>

          <!-- Location & Coordinates -->
          <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 6px; margin-bottom: 8px;">
            <div style="font-size: 10px; color: #475569; font-weight: 600; line-height: 1.3;">
              📍 ${gh.lokasi}
            </div>
            <div style="font-size: 10px; color: #059669; font-family: monospace; font-weight: 700; margin-top: 4px;">
              🌐 Lat: ${gh.latitude}, Lng: ${gh.longitude}
            </div>
          </div>

          <!-- Bay Components -->
          <div style="margin-bottom: 8px;">
            <div style="font-size: 10px; font-weight: 800; color: #334155; text-transform: uppercase; margin-bottom: 4px; display: flex; justify-content: space-between;">
              <span>Bay & Penyulang Terhubung:</span>
              <span style="color: #059669;">${bayCount} Bay</span>
            </div>
            <div style="max-height: 110px; overflow-y: auto; padding-right: 2px;">
              ${bayComponentsHtml}
            </div>
          </div>

          <!-- Direct Google Maps link -->
          <a
            href="https://www.google.com/maps/search/?api=1&query=${gh.latitude},${gh.longitude}"
            target="_blank"
            rel="noreferrer"
            style="
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 4px;
              width: 100%;
              background: #0F172A;
              color: #FFFFFF;
              font-size: 10px;
              font-weight: 700;
              padding: 6px;
              border-radius: 8px;
              text-decoration: none;
            "
          >
            🗺️ Buka Rute di Google Maps ↗
          </a>
        </div>
      `;

      if (allGhMarkersRef.current[gh.id]) {
        // Move & update existing
        allGhMarkersRef.current[gh.id].setLatLng(position);
        allGhMarkersRef.current[gh.id].setIcon(customIcon);
        allGhMarkersRef.current[gh.id].setPopupContent(popupContent);
      } else {
        // Create new marker
        const marker = L.marker(position, { icon: customIcon }).addTo(map);
        marker.bindPopup(popupContent);
        marker.on('click', () => {
          setSelectedGhIdOnMap(gh.id);
        });
        allGhMarkersRef.current[gh.id] = marker;
      }
    });

  }, [ghList, allMapFilterStatus]);

  // Helper: Zoom Fit All GHs
  const handleZoomFitAllGh = () => {
    const map = allGhMapInstanceRef.current;
    if (!map) return;

    const validGhs = ghList.filter(g => g.latitude && g.longitude);
    if (validGhs.length === 0) return;

    const bounds = L.latLngBounds(validGhs.map(g => [g.latitude!, g.longitude!]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
  };

  // Helper: Focus on specific GH on the map
  const handleFocusGhOnMap = (gh: MasterGarduHubung) => {
    setSelectedGhIdOnMap(gh.id);
    const map = allGhMapInstanceRef.current;
    if (map && gh.latitude && gh.longitude) {
      // Scroll smoothly to map
      const mapEl = allGhMapContainerRef.current;
      if (mapEl) {
        mapEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }

      map.setView([gh.latitude, gh.longitude], 16, { animate: true });

      // Open marker popup
      setTimeout(() => {
        if (allGhMarkersRef.current[gh.id]) {
          allGhMarkersRef.current[gh.id].openPopup();
        }
      }, 300);
    }
  };

  // ----------------------------------------------------
  // 2. FORM MINI-MAP LIFECYCLE (When Form is Open)
  // ----------------------------------------------------
  useEffect(() => {
    if (!isFormOpen) {
      if (formMapInstanceRef.current) {
        formMapInstanceRef.current.remove();
        formMapInstanceRef.current = null;
        formMarkerRef.current = null;
        formTileLayerRef.current = null;
      }
      return;
    }

    const initTimer = setTimeout(() => {
      if (!formMapContainerRef.current) return;
      if (formMapInstanceRef.current) {
        formMapInstanceRef.current.remove();
        formMapInstanceRef.current = null;
      }

      const initialLat = latitude || -3.642100;
      const initialLng = longitude || 128.231500;

      try {
        const map = L.map(formMapContainerRef.current, {
          center: [initialLat, initialLng],
          zoom: 15,
          zoomControl: true,
          scrollWheelZoom: true
        });

        let tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
        let tileAttr = '&copy; OpenStreetMap';
        let maxZ = 19;

        if (formMapLayerType === 'satellite') {
          tileUrl = 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}';
          tileAttr = '&copy; Google Satellite';
          maxZ = 20;
        } else if (formMapLayerType === 'dark') {
          tileUrl = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
          tileAttr = '&copy; CARTO';
          maxZ = 19;
        }

        const tileLayer = L.tileLayer(tileUrl, { attribution: tileAttr, maxZoom: maxZ }).addTo(map);
        formTileLayerRef.current = tileLayer;

        const customPinIcon = L.divIcon({
          className: 'custom-gh-form-pin',
          html: `
            <div style="display:flex; flex-direction:column; align-items:center; transform: translate(-50%, -100%); cursor: grab;">
              <div style="background-color: #059669; color: white; padding: 6px; border-radius: 12px; border: 2px solid white; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center;">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></svg>
              </div>
              <div style="width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 8px solid #059669; margin-top: -1px;"></div>
              <div style="width: 12px; height: 4px; background: rgba(0,0,0,0.3); border-radius: 50%; margin-top: 2px;"></div>
            </div>
          `,
          iconSize: [0, 0],
          iconAnchor: [0, 0]
        });

        const marker = L.marker([initialLat, initialLng], {
          icon: customPinIcon,
          draggable: true
        }).addTo(map);

        const currentTitle = selectedNamaPreset === 'CUSTOM' ? customNama || 'Gardu Hubung' : selectedNamaPreset;
        marker.bindPopup(`<b>${currentTitle}</b><br/>${lokasi}`).openPopup();

        map.on('click', (e: L.LeafletMouseEvent) => {
          const lat = parseFloat(e.latlng.lat.toFixed(6));
          const lng = parseFloat(e.latlng.lng.toFixed(6));
          setLatitude(lat);
          setLongitude(lng);

          marker.setLatLng([lat, lng]);
          const detectedLokasi = approximateLocationName(lat, lng);
          setLokasi(detectedLokasi);

          const title = selectedNamaPreset === 'CUSTOM' ? customNama || 'Gardu Hubung' : selectedNamaPreset;
          marker.setPopupContent(`<b>${title}</b><br/>${detectedLokasi}`).openPopup();
        });

        marker.on('dragend', () => {
          const pos = marker.getLatLng();
          const lat = parseFloat(pos.lat.toFixed(6));
          const lng = parseFloat(pos.lng.toFixed(6));
          setLatitude(lat);
          setLongitude(lng);

          const detectedLokasi = approximateLocationName(lat, lng);
          setLokasi(detectedLokasi);

          const title = selectedNamaPreset === 'CUSTOM' ? customNama || 'Gardu Hubung' : selectedNamaPreset;
          marker.setPopupContent(`<b>${title}</b><br/>${detectedLokasi}`).openPopup();
        });

        formMapInstanceRef.current = map;
        formMarkerRef.current = marker;

        setTimeout(() => {
          map.invalidateSize();
        }, 150);
      } catch (err) {
        console.error('Error initializing form map:', err);
      }
    }, 100);

    return () => {
      clearTimeout(initTimer);
      if (formMapInstanceRef.current) {
        formMapInstanceRef.current.remove();
        formMapInstanceRef.current = null;
        formMarkerRef.current = null;
        formTileLayerRef.current = null;
      }
    };
  }, [isFormOpen]);

  // Update Form Map Layer
  useEffect(() => {
    if (!formMapInstanceRef.current) return;
    if (formTileLayerRef.current) formTileLayerRef.current.remove();

    let tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    let tileAttr = '&copy; OpenStreetMap';
    let maxZ = 19;

    if (formMapLayerType === 'satellite') {
      tileUrl = 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}';
      tileAttr = '&copy; Google Satellite';
      maxZ = 20;
    } else if (formMapLayerType === 'dark') {
      tileUrl = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
      tileAttr = '&copy; CARTO';
      maxZ = 19;
    }

    const newTile = L.tileLayer(tileUrl, { attribution: tileAttr, maxZoom: maxZ }).addTo(formMapInstanceRef.current);
    formTileLayerRef.current = newTile;
    formMapInstanceRef.current.invalidateSize();
  }, [formMapLayerType]);

  // Synchronize preset change
  const handleSelectNamaPreset = (val: string) => {
    setSelectedNamaPreset(val);
    if (val !== 'CUSTOM' && PRESET_COORDINATES[val]) {
      const preset = PRESET_COORDINATES[val];
      setLatitude(preset.lat);
      setLongitude(preset.lng);
      setLokasi(preset.lokasi);

      if (formMapInstanceRef.current && formMarkerRef.current) {
        formMarkerRef.current.setLatLng([preset.lat, preset.lng]);
        formMapInstanceRef.current.setView([preset.lat, preset.lng], 16);
        formMarkerRef.current.setPopupContent(`<b>${val}</b><br/>${preset.lokasi}`).openPopup();
      }
    }
  };

  // Add / Remove / Update Penamaan & Penyulang
  const handleAddKomponen = () => {
    const nextNum = komponenList.length + 1;
    const defaultPenyulang = penyulangList[0]?.namaPenyulang || 'Passo';
    setKomponenList([
      ...komponenList,
      {
        id: `kp-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        penamaan: `Outgoing ${nextNum}`,
        penyulang: defaultPenyulang
      }
    ]);
  };

  const handleRemoveKomponen = (id: string) => {
    if (komponenList.length <= 1) {
      setAlertMessage({ type: 'error', text: 'Minimal harus ada 1 Penamaan & Penyulang untuk Gardu Hubung!' });
      setTimeout(() => setAlertMessage(null), 3500);
      return;
    }
    setKomponenList(komponenList.filter(k => k.id !== id));
  };

  const handleUpdateKomponen = (id: string, field: 'penamaan' | 'penyulang', value: string) => {
    setKomponenList(komponenList.map(k => k.id === id ? { ...k, [field]: value } : k));
  };

  // Save Gardu Hubung data
  const handleSaveGarduHubung = (e: React.FormEvent) => {
    e.preventDefault();

    const finalNama = selectedNamaPreset === 'CUSTOM' ? customNama.trim() : selectedNamaPreset;

    if (!finalNama) {
      setAlertMessage({ type: 'error', text: 'Silakan tentukan Nama Gardu Hubung terlebih dahulu!' });
      setTimeout(() => setAlertMessage(null), 3500);
      return;
    }

    if (!lokasi.trim()) {
      setAlertMessage({ type: 'error', text: 'Silakan masukkan Lokasi Gardu Hubung!' });
      setTimeout(() => setAlertMessage(null), 3500);
      return;
    }

    if (komponenList.length === 0) {
      setAlertMessage({ type: 'error', text: 'Minimal harus memiliki 1 penamaan & penyulang!' });
      setTimeout(() => setAlertMessage(null), 3500);
      return;
    }

    let updatedList: MasterGarduHubung[];

    if (editingId) {
      // Update existing
      updatedList = ghList.map(item => {
        if (item.id === editingId) {
          return {
            ...item,
            nama: finalNama,
            lokasi: lokasi.trim(),
            latitude: latitude,
            longitude: longitude,
            status: status,
            tahunOperasi: tahunOperasi,
            komponenPenyulang: komponenList
          };
        }
        return item;
      });

      setGhList(updatedList);
      saveToStorage(updatedList);
      setAlertMessage({ type: 'success', text: `Data ${finalNama} berhasil diperbarui di sistem dan peta GIS!` });
      setEditingId(null);
    } else {
      // Add new
      const newGH: MasterGarduHubung = {
        id: `gh-${Date.now()}`,
        nama: finalNama,
        lokasi: lokasi.trim(),
        latitude: latitude,
        longitude: longitude,
        status: status,
        tahunOperasi: tahunOperasi,
        komponenPenyulang: komponenList,
        createdAt: new Date().toISOString()
      };

      updatedList = [newGH, ...ghList];
      setGhList(updatedList);
      saveToStorage(updatedList);
      setAlertMessage({ type: 'success', text: `Data ${finalNama} berhasil ditambahkan ke sistem dan peta GIS!` });
    }

    // Reset form to defaults
    setSelectedNamaPreset('GH Baguala');
    setCustomNama('');
    setLokasi('Passo - Baguala, Kota Ambon');
    setLatitude(-3.642100);
    setLongitude(128.231500);
    setStatus('Operasi');

    // Auto close form
    setIsFormOpen(false);

    setTimeout(() => setAlertMessage(null), 4000);
  };

  // Edit action
  const handleStartEdit = (item: MasterGarduHubung) => {
    setEditingId(item.id);
    if (NAMA_GH_OPTIONS.includes(item.nama)) {
      setSelectedNamaPreset(item.nama);
      setCustomNama('');
    } else {
      setSelectedNamaPreset('CUSTOM');
      setCustomNama(item.nama);
    }
    setLokasi(item.lokasi);
    setLatitude(item.latitude || -3.642100);
    setLongitude(item.longitude || 128.231500);
    setStatus(item.status || 'Operasi');
    setTahunOperasi(item.tahunOperasi || new Date().getFullYear());
    setKomponenList(item.komponenPenyulang && item.komponenPenyulang.length > 0
      ? item.komponenPenyulang
      : [{ id: 'kp-1', penamaan: 'Incoming', penyulang: penyulangList[0]?.namaPenyulang || 'Passo' }]
    );

    setIsFormOpen(true);
    window.scrollTo({ top: 400, behavior: 'smooth' });
  };

  // Cancel edit / Close form
  const handleCancelEdit = () => {
    setEditingId(null);
    setIsFormOpen(false);
    setSelectedNamaPreset('GH Baguala');
    setCustomNama('');
    setLokasi('Passo - Baguala, Kota Ambon');
    setLatitude(-3.642100);
    setLongitude(128.231500);
  };

  // Trigger Delete confirmation modal
  const handleRequestDelete = (item: MasterGarduHubung) => {
    setDeleteConfirmItem({ id: item.id, nama: item.nama });
  };

  // Execute Delete
  const handleConfirmDelete = () => {
    if (!deleteConfirmItem) return;
    const { id, nama } = deleteConfirmItem;

    const updated = ghList.filter(g => g.id !== id);
    setGhList(updated);
    saveToStorage(updated);

    if (editingId === id) {
      setEditingId(null);
      setIsFormOpen(false);
    }

    setDeleteConfirmItem(null);
    setAlertMessage({ type: 'success', text: `Data ${nama} berhasil dihapus dari sistem!` });
    setTimeout(() => setAlertMessage(null), 3500);
  };

  // Filtered List for Table
  const filteredGHList = ghList.filter(g => {
    const q = searchQuery.toLowerCase();
    const matchNama = (g.nama || '').toLowerCase().includes(q);
    const matchLokasi = (g.lokasi || '').toLowerCase().includes(q);
    const matchPenyulang = g.komponenPenyulang?.some(kp => 
      (kp.penamaan || '').toLowerCase().includes(q) || 
      (kp.penyulang || '').toLowerCase().includes(q)
    );
    return matchNama || matchLokasi || matchPenyulang;
  });

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'Nama Gardu Hubung',
      'Lokasi',
      'Titik Koordinat',
      'Status Operasi',
      'Tahun Operasi',
      'Jumlah Penamaan/Penyulang',
      'Rincian Komponen Penyulang'
    ];

    const rows = filteredGHList.map(g => [
      g.nama,
      g.lokasi,
      g.latitude && g.longitude ? `${g.latitude}, ${g.longitude}` : '-',
      g.status,
      g.tahunOperasi || '-',
      g.komponenPenyulang?.length || 0,
      g.komponenPenyulang?.map(kp => `${kp.penamaan} (${kp.penyulang})`).join(' | ') || '-'
    ]);

    exportToCSV('Master_Data_Gardu_Hubung_ULP_Baguala', headers, rows);
  };

  const totalOperasi = ghList.filter(g => g.status === 'Operasi').length;
  const totalStandby = ghList.filter(g => g.status === 'Standby').length;
  const totalWithCoordinates = ghList.filter(g => g.latitude && g.longitude).length;

  return (
    <div className="space-y-6">
      
      {/* Alert Notification Toast */}
      {alertMessage && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200 shadow-sm ${
            alertMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-3">
            {alertMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <div className="text-xs font-bold">{alertMessage.text}</div>
          </div>
          <button
            onClick={() => setAlertMessage(null)}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* TOP STATS & ACTION HEADER */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-slate-900">
                Master Data Gardu Hubung (GH)
              </h3>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black border border-emerald-200">
                {ghList.length} Unit Terdaftar
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Pemetaan GIS titik koordinat seluruh Gardu Hubung dan konfigurasi bay penyulang ULP Baguala
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isFormOpen ? (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setIsFormOpen(true);
              }}
              className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Input Gardu Hubung Baru</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setIsFormOpen(false);
                setEditingId(null);
              }}
              className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <ChevronUp className="w-4 h-4" />
              <span>Tutup Menu Input</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 🗺️ PETA INTERAKTIF SELURUH GARDU HUBUNG TERDAFTAR (GIS MAPPING) */}
      {/* ========================================================================= */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-3xl overflow-hidden flex flex-col space-y-0">
        {/* Map Header Toolbar */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm sm:text-base font-black text-white uppercase tracking-wider">
                  Peta GIS Titik Koordinat Semua Gardu Hubung ({totalWithCoordinates} Lokasi)
                </h4>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Visualisasi spasial seluruh Gardu Hubung 20kV di wilayah kerja PLN ULP Baguala (Ambon)
              </p>
            </div>
          </div>

          {/* Controls: Filter & Layer Switcher & Zoom All */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter */}
            <select
              value={allMapFilterStatus}
              onChange={(e) => setAllMapFilterStatus(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-white text-xs font-bold rounded-xl px-3 py-1.5 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="Semua">Semua Status ({ghList.length})</option>
              <option value="Operasi">Status: Operasi ({totalOperasi})</option>
              <option value="Standby">Status: Standby ({totalStandby})</option>
            </select>

            {/* Layer Switcher */}
            <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700">
              <button
                type="button"
                onClick={() => setAllMapLayerType('street')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  allMapLayerType === 'street'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Peta Jalan
              </button>
              <button
                type="button"
                onClick={() => setAllMapLayerType('satellite')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  allMapLayerType === 'satellite'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Satelit
              </button>
              <button
                type="button"
                onClick={() => setAllMapLayerType('dark')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  allMapLayerType === 'dark'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Voyager
              </button>
            </div>

            {/* Reset / Fit Bounds */}
            <button
              type="button"
              onClick={handleZoomFitAllGh}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              title="Pusatkan Peta ke Seluruh Gardu Hubung"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Pusatkan Peta</span>
            </button>
          </div>
        </div>

        {/* Leaflet Map Canvas */}
        <div className="relative w-full bg-slate-900 overflow-hidden" style={{ minHeight: '500px', height: '500px' }}>
          <div
            ref={allGhMapContainerRef}
            className="w-full h-full relative z-0"
            style={{ width: '100%', height: '500px', minHeight: '500px' }}
          />

          {/* Floating Map Legend & Summary */}
          <div className="absolute bottom-4 left-4 z-[400] bg-slate-950/95 backdrop-blur-md border border-slate-700 text-white p-3.5 rounded-2xl shadow-2xl text-xs space-y-2 max-w-xs pointer-events-auto">
            <div className="font-extrabold text-emerald-400 uppercase tracking-wider text-[10px] flex items-center justify-between gap-4">
              <span>Legenda Gardu Hubung</span>
              <span className="text-slate-300 font-mono font-bold">{totalWithCoordinates} Titik Terpetakan</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-md bg-emerald-600 border border-white flex items-center justify-center text-[9px] font-bold shadow-sm">⚡</span>
                <span className="text-slate-200 font-semibold">Operasi Normal</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-md bg-amber-600 border border-white flex items-center justify-center text-[9px] font-bold shadow-sm">⚡</span>
                <span className="text-slate-200 font-semibold">Standby</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-300 flex items-center gap-1.5 leading-snug">
              <Info className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span>Klik ikon pin pada peta untuk melihat rincian bay & penyulang terhubung.</span>
            </div>
          </div>
        </div>
      </div>

      {/* FORM INPUT MASTER GARDU HUBUNG (COLLAPSIBLE) */}
      {isFormOpen && (
        <div className="bg-white border border-emerald-200 shadow-md shadow-emerald-500/5 rounded-3xl p-6 md:p-8 space-y-6 relative overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200">
          
          {/* Header Form */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100/70 border border-emerald-200 flex items-center justify-center text-emerald-700 font-bold">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-extrabold text-slate-900">
                    {editingId ? 'Edit Data Master Gardu Hubung' : 'Form Input Master Gardu Hubung'}
                  </h4>
                  {editingId && (
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold animate-pulse">
                      Mode Edit
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Lengkapi data berikut lalu tekan simpan. Form input akan tertutup otomatis setelah tersimpan.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCancelEdit}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors self-start md:self-auto cursor-pointer"
              title="Tutup Form"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSaveGarduHubung} className="space-y-6">
            
            {/* STEP 1: PILIHAN NAMA GARDU HUBUNG */}
            <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2 text-xs font-black text-slate-800 uppercase tracking-wider">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[11px] font-mono">1</span>
                <span>Pilihan Nama Gardu Hubung</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Nama Gardu Hubung (Preset GH Baguala) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={selectedNamaPreset}
                    onChange={(e) => handleSelectNamaPreset(e.target.value)}
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer shadow-sm"
                  >
                    {NAMA_GH_OPTIONS.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                    <option value="CUSTOM">+ Masukkan Nama GH Lainnya (Kustom)...</option>
                  </select>
                </div>

                {selectedNamaPreset === 'CUSTOM' && (
                  <div className="space-y-1.5 animate-in fade-in duration-150">
                    <label className="text-xs font-bold text-slate-700">
                      Ketik Nama Gardu Hubung Baru <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={customNama}
                      onChange={(e) => setCustomNama(e.target.value)}
                      placeholder="Contoh: GH Natsepa Baru..."
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm"
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Status Operasi</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer shadow-sm"
                  >
                    <option value="Operasi">Operasi (Aktif Bertegangan)</option>
                    <option value="Standby">Standby (Siap Operasi)</option>
                    <option value="Pemeliharaan">Pemeliharaan / Off</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Tahun Operasi</label>
                  <input
                    type="number"
                    value={tahunOperasi}
                    onChange={(e) => setTahunOperasi(parseInt(e.target.value) || new Date().getFullYear())}
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm"
                  />
                </div>
              </div>
            </div>

            {/* STEP 2: LOKASI & PETA INTERAKTIF PICKER */}
            <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-black text-slate-800 uppercase tracking-wider">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[11px] font-mono">2</span>
                  <span>Lokasi & Titik Koordinat Peta</span>
                </div>

                {/* Map Layer Switcher */}
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setFormMapLayerType('street')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        formMapLayerType === 'street' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Peta Jalan
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormMapLayerType('satellite')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        formMapLayerType === 'satellite' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Satelit
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-3 space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Nama Lokasi / Alamat Gardu Hubung <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={lokasi}
                    onChange={(e) => setLokasi(e.target.value)}
                    placeholder="Contoh: Jl. Raya Passo, Baguala, Kota Ambon..."
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={latitude}
                    onChange={(e) => setLatitude(parseFloat(e.target.value) || 0)}
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={longitude}
                    onChange={(e) => setLongitude(parseFloat(e.target.value) || 0)}
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => {
                      if (formMapInstanceRef.current && formMarkerRef.current) {
                        formMarkerRef.current.setLatLng([latitude, longitude]);
                        formMapInstanceRef.current.setView([latitude, longitude], 16);
                        formMarkerRef.current.setPopupContent(`<b>Titik Terpilih</b><br/>${latitude}, ${longitude}`).openPopup();
                      }
                    }}
                    className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Crosshair className="w-4 h-4 text-emerald-400" />
                    <span>Sinkronkan ke Peta</span>
                  </button>
                </div>
              </div>

              {/* Form Leaflet Mini Map */}
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-inner">
                <div
                  ref={formMapContainerRef}
                  className="w-full h-64 z-0 bg-slate-100"
                />
                <div className="absolute bottom-2 left-2 z-10 bg-slate-900/80 text-white text-[10px] font-bold px-3 py-1.5 rounded-xl backdrop-blur-xs flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Klik pada peta atau geser pin hijau untuk mengubah lokasi</span>
                </div>
              </div>
            </div>

            {/* STEP 3: PENAMAAN & PENYULANG TERHUBUNG */}
            <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
                <div className="flex items-center gap-2 text-xs font-black text-slate-800 uppercase tracking-wider">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[11px] font-mono">3</span>
                  <span>Penamaan & Penyulang Terhubung ({komponenList.length} Bay)</span>
                </div>

                <button
                  type="button"
                  onClick={handleAddKomponen}
                  className="px-3.5 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Tambah Penamaan & Penyulang</span>
                </button>
              </div>

              <div className="space-y-3">
                {komponenList.map((item, idx) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-1 sm:grid-cols-12 gap-3 p-3.5 bg-white border border-slate-200 rounded-xl items-center shadow-xs"
                  >
                    <div className="sm:col-span-1 text-center font-bold text-xs text-slate-400 font-mono">
                      #{idx + 1}
                    </div>

                    <div className="sm:col-span-5">
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">
                        Penamaan Bay / Komponen
                      </label>
                      <input
                        type="text"
                        required
                        value={item.penamaan}
                        onChange={(e) => handleUpdateKomponen(item.id, 'penamaan', e.target.value)}
                        placeholder="Contoh: Incoming 1, Outgoing Passo..."
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>

                    <div className="sm:col-span-5">
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">
                        Penyulang Terkait
                      </label>
                      <select
                        value={item.penyulang}
                        onChange={(e) => handleUpdateKomponen(item.id, 'penyulang', e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer"
                      >
                        {penyulangList.map(p => (
                          <option key={p.id} value={p.namaPenyulang}>
                            {p.namaPenyulang} ({p.namaGi})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-1 flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleRemoveKomponen(item.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                        title="Hapus baris ini"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ACTION BUTTONS: SIMPAN / BATAL */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="submit"
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/25 flex items-center gap-2 transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{editingId ? 'Simpan Perubahan Gardu Hubung' : 'Simpan Data Gardu Hubung'}</span>
              </button>

              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Tutup & Batal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* DAFTAR MASTER GARDU HUBUNG TERDAFTAR */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-6 md:p-8 space-y-5">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Zap className="w-5 h-5 text-emerald-600" />
              Daftar Master Gardu Hubung Terdaftar ({filteredGHList.length})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Data operasional Gardu Hubung di wilayah kerja PLN ULP Baguala
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari GH, lokasi, penyulang..."
                className="pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition-all w-60"
              />
            </div>

            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span>Ekspor CSV</span>
            </button>
          </div>
        </div>

        {/* Tabel Data Gardu Hubung */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-left text-xs text-slate-800">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[11px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3.5 text-center w-12">No</th>
                <th className="px-4 py-3.5">Nama Gardu Hubung</th>
                <th className="px-4 py-3.5">Lokasi & Titik Koordinat</th>
                <th className="px-4 py-3.5">Penamaan & Penyulang Terhubung</th>
                <th className="px-4 py-3.5 text-center">Status</th>
                <th className="px-4 py-3.5 text-center w-28">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredGHList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                    Tidak ada data Gardu Hubung yang sesuai filter.
                  </td>
                </tr>
              ) : (
                filteredGHList.map((gh, idx) => (
                  <tr key={gh.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3.5 text-center font-mono text-slate-400 font-bold text-[11px]">
                      {idx + 1}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                        <Zap className="w-4 h-4 text-emerald-600" />
                        <span>{gh.nama}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Tahun Operasi: {gh.tahunOperasi || 2020}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 max-w-xs">
                      <div className="text-slate-800 font-semibold">{gh.lokasi}</div>
                      {gh.latitude && gh.longitude && (
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-emerald-700 font-mono font-bold flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                            <span>{gh.latitude}, {gh.longitude}</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => handleFocusGhOnMap(gh)}
                            className="px-2 py-0.5 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-bold border border-emerald-200 flex items-center gap-1 cursor-pointer transition-colors"
                            title="Fokuskan Gardu Hubung ini di Peta GIS"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Lihat di Peta</span>
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-wrap gap-1.5 max-w-md">
                        {gh.komponenPenyulang && gh.komponenPenyulang.length > 0 ? (
                          gh.komponenPenyulang.map(kp => {
                            const isIncoming = (kp.penamaan || '').toLowerCase().includes('in');
                            const isCoupling = (kp.penamaan || '').toLowerCase().includes('coup');
                            const badgeColor = isIncoming
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : isCoupling
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-blue-50 text-blue-700 border-blue-200';

                            return (
                              <div
                                key={kp.id}
                                className={`px-2 py-1 rounded-lg border text-[10px] font-bold flex items-center gap-1 ${badgeColor}`}
                              >
                                <span>{kp.penamaan}</span>
                                <span className="text-slate-400">→</span>
                                <span className="underline decoration-slate-300">{kp.penyulang}</span>
                              </div>
                            );
                          })
                        ) : (
                          <span className="text-slate-400 text-[11px]">-</span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium mt-1">
                        Total: {gh.komponenPenyulang?.length || 0} Bay / Komponen
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                          gh.status === 'Operasi'
                            ? 'bg-emerald-100 text-emerald-800'
                            : gh.status === 'Standby'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {gh.status || 'Operasi'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleFocusGhOnMap(gh)}
                          className="p-1.5 rounded-lg hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer"
                          title="Fokuskan di Peta GIS"
                        >
                          <Compass className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStartEdit(gh)}
                          className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                          title="Edit Gardu Hubung"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRequestDelete(gh)}
                          className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                          title="Hapus Gardu Hubung"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* IN-APP CONFIRMATION MODAL FOR DELETING (Reliable in iFrames) */}
      {deleteConfirmItem && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-extrabold text-slate-900">
                  Konfirmasi Hapus Data
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tindakan ini akan menghapus aset dari master data dan peta
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
              Apakah Anda yakin ingin menghapus data master <strong className="text-rose-700 font-extrabold font-mono">{deleteConfirmItem.nama}</strong>?
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmItem(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold shadow-md shadow-rose-500/25 flex items-center gap-2 transition-all cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Ya, Hapus Data</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
