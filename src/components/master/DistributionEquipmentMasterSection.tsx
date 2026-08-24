import React, { useState, useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import {
  Zap,
  MapPin,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Search,
  Download,
  Layers,
  ArrowRightLeft,
  Sliders,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  X,
  RotateCcw,
  Shield,
  Activity,
  Cpu
} from 'lucide-react';
import { MasterDistributionEquipment, ItemPeralatanDetail, Penyulang } from '../../types';
import { exportToCSV } from '../../utils/exportCsv';

export type EquipmentCategory = 'lbs' | 'pmcb' | 'recloser' | 'fco';

interface DistributionEquipmentMasterSectionProps {
  type: EquipmentCategory;
  penyulangList: Penyulang[];
}

const EQUIPMENT_META: Record<EquipmentCategory, {
  title: string;
  shortTitle: string;
  colorBg: string;
  colorBorder: string;
  colorText: string;
  pinColor: string;
  badgeBg: string;
  badgeText: string;
  icon: React.FC<{ className?: string }>;
  description: string;
  placeholderName: string;
  storageKey: string;
}> = {
  lbs: {
    title: 'Load Break Switch (LBS)',
    shortTitle: 'LBS',
    colorBg: 'bg-amber-50',
    colorBorder: 'border-amber-200',
    colorText: 'text-amber-700',
    pinColor: '#d97706',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-800',
    icon: Zap,
    description: 'Pencatatan data master saklar pemutus beban (LBS) motorized/manual pada penyulang 20kV',
    placeholderName: 'LBS Passo 01',
    storageKey: 'perang_padam_master_lbs'
  },
  pmcb: {
    title: 'Pole Mounted Circuit Breaker (PMCB)',
    shortTitle: 'PMCB',
    colorBg: 'bg-purple-50',
    colorBorder: 'border-purple-200',
    colorText: 'text-purple-700',
    pinColor: '#7c3aed',
    badgeBg: 'bg-purple-100',
    badgeText: 'text-purple-800',
    icon: Cpu,
    description: 'Pencatatan data master pemutus tenaga tiang (PMCB) proteksi dan manuver jaringan',
    placeholderName: 'PMCB Waiheru 01',
    storageKey: 'perang_padam_master_pmcb'
  },
  recloser: {
    title: 'Automatic Circuit Recloser (REC)',
    shortTitle: 'RECLOSER',
    colorBg: 'bg-blue-50',
    colorBorder: 'border-blue-200',
    colorText: 'text-blue-700',
    pinColor: '#2563eb',
    badgeBg: 'bg-blue-100',
    badgeText: 'text-blue-800',
    icon: Shield,
    description: 'Pencatatan data master penutup balik otomatis (Recloser) proteksi arus lebih dan gangguan temporer',
    placeholderName: 'REC Passo 01',
    storageKey: 'perang_padam_master_recloser'
  },
  fco: {
    title: 'Fuse Cut Out (FCO)',
    shortTitle: 'FCO',
    colorBg: 'bg-rose-50',
    colorBorder: 'border-rose-200',
    colorText: 'text-rose-700',
    pinColor: '#e11d48',
    badgeBg: 'bg-rose-100',
    badgeText: 'text-rose-800',
    icon: Activity,
    description: 'Pencatatan data master pengaman lebur (FCO) pada percabangan dan trafo distribusi',
    placeholderName: 'FCO Percabangan Passo Atas',
    storageKey: 'perang_padam_master_fco'
  }
};

const INITIAL_DEFAULT_DATA: Record<EquipmentCategory, MasterDistributionEquipment[]> = {
  lbs: [
    {
      id: 'lbs-1',
      jenis: 'LBS',
      lokasi: 'Tiang No. 45 - Jl. Raya Passo, Baguala, Kota Ambon',
      latitude: -3.641500,
      longitude: 128.232100,
      peralatanList: [
        { id: 'eq-1', namaPeralatan: 'LBS Passo 01 (Motorized)', penyulang: 'PASSO' },
        { id: 'eq-2', namaPeralatan: 'LBS Percabangan Passo Atas', penyulang: 'PASSO' }
      ]
    },
    {
      id: 'lbs-2',
      jenis: 'LBS',
      lokasi: 'Tiang No. 82 - Jl. Jenderal Sudirman, Hative Kecil',
      latitude: -3.677500,
      longitude: 128.203900,
      peralatanList: [
        { id: 'eq-3', namaPeralatan: 'LBS Lateri 02', penyulang: 'LATERI 2' },
        { id: 'eq-4', namaPeralatan: 'LBS Tie Lateri-Galala', penyulang: 'LATERI 1' }
      ]
    },
    {
      id: 'lbs-3',
      jenis: 'LBS',
      lokasi: 'Tiang No. 28 - Jl. Dr. J. Leimena, Wayame',
      latitude: -3.663800,
      longitude: 128.164100,
      peralatanList: [
        { id: 'eq-5', namaPeralatan: 'LBS Wayame 01', penyulang: 'WAYAME 1' }
      ]
    },
    {
      id: 'lbs-4',
      jenis: 'LBS',
      lokasi: 'Tiang No. 120 - Kawasan Bandara Pattimura, Laha',
      latitude: -3.709200,
      longitude: 128.088500,
      peralatanList: [
        { id: 'eq-6', namaPeralatan: 'LBS Bandara Utama (ATS)', penyulang: 'BANDARA 1' },
        { id: 'eq-7', namaPeralatan: 'LBS Bandara Cadangan', penyulang: 'BANDARA 2' }
      ]
    }
  ],
  pmcb: [
    {
      id: 'pmcb-1',
      jenis: 'PMCB',
      lokasi: 'Tiang No. 18 - Kawasan Simpang Waiheru, Baguala',
      latitude: -3.635200,
      longitude: 128.241500,
      peralatanList: [
        { id: 'pmcb-eq-1', namaPeralatan: 'PMCB Waiheru 01', penyulang: 'WAIHERU 3 POKA' }
      ]
    },
    {
      id: 'pmcb-2',
      jenis: 'PMCB',
      lokasi: 'Tiang No. 55 - Kawasan Galala, Sirimau',
      latitude: -3.670500,
      longitude: 128.200800,
      peralatanList: [
        { id: 'pmcb-eq-2', namaPeralatan: 'PMCB Galala 01', penyulang: 'GALALA 1' }
      ]
    }
  ],
  recloser: [
    {
      id: 'rec-1',
      jenis: 'RECLOSER',
      lokasi: 'Tiang No. 34 - Jl. Wolter Monginsidi, Passo',
      latitude: -3.644500,
      longitude: 128.229800,
      peralatanList: [
        { id: 'rec-eq-1', namaPeralatan: 'REC Passo 01', penyulang: 'PASSO' },
        { id: 'rec-eq-2', namaPeralatan: 'REC Hutumuri 01', penyulang: 'HUTUMURI' }
      ]
    },
    {
      id: 'rec-2',
      jenis: 'RECLOSER',
      lokasi: 'Tiang No. 90 - Jl. Ir. M. Putuhena, Poka',
      latitude: -3.656200,
      longitude: 128.187900,
      peralatanList: [
        { id: 'rec-eq-3', namaPeralatan: 'REC Poka 01', penyulang: 'WAIHERU 3 POKA' }
      ]
    },
    {
      id: 'rec-3',
      jenis: 'RECLOSER',
      lokasi: 'Tiang No. 110 - Kawasan Laha / Akses Bandara',
      latitude: -3.707500,
      longitude: 128.091200,
      peralatanList: [
        { id: 'rec-eq-4', namaPeralatan: 'REC Bandara 01', penyulang: 'BANDARA 1' }
      ]
    }
  ],
  fco: [
    {
      id: 'fco-1',
      jenis: 'FCO',
      lokasi: 'Tiang Percabangan No. 12 - Passo Atas',
      latitude: -3.640200,
      longitude: 128.234500,
      peralatanList: [
        { id: 'fco-eq-1', namaPeralatan: 'FCO Percabangan Passo Atas', penyulang: 'PASSO' }
      ]
    },
    {
      id: 'fco-2',
      jenis: 'FCO',
      lokasi: 'Tiang No. 64 - Jalur Wisata Hutumuri',
      latitude: -3.692500,
      longitude: 128.275000,
      peralatanList: [
        { id: 'fco-eq-2', namaPeralatan: 'FCO Percabangan Hutumuri', penyulang: 'HUTUMURI' }
      ]
    },
    {
      id: 'fco-3',
      jenis: 'FCO',
      lokasi: 'Tiang No. 41 - Perumahan Dosen Unpatti Poka',
      latitude: -3.654800,
      longitude: 128.189500,
      peralatanList: [
        { id: 'fco-eq-3', namaPeralatan: 'FCO Percabangan Poka Indah', penyulang: 'WAIHERU 3 POKA' }
      ]
    }
  ]
};

export const DistributionEquipmentMasterSection: React.FC<DistributionEquipmentMasterSectionProps> = ({
  type,
  penyulangList
}) => {
  const meta = EQUIPMENT_META[type] || EQUIPMENT_META.lbs;
  const IconComponent = meta.icon;

  // Load from local storage or default
  const [dataList, setDataList] = useState<MasterDistributionEquipment[]>(() => {
    try {
      const saved = localStorage.getItem(meta.storageKey);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error(`Error loading ${type} from localStorage`, e);
    }
    return INITIAL_DEFAULT_DATA[type] || [];
  });

  // Reload when type changes
  useEffect(() => {
    try {
      const saved = localStorage.getItem(meta.storageKey);
      if (saved) {
        setDataList(JSON.parse(saved));
      } else {
        setDataList(INITIAL_DEFAULT_DATA[type] || []);
      }
    } catch (e) {
      setDataList(INITIAL_DEFAULT_DATA[type] || []);
    }
    setIsFormOpen(false);
    setEditingId(null);
  }, [type, meta.storageKey]);

  // Save to localStorage helper
  const saveToStorage = (list: MasterDistributionEquipment[]) => {
    try {
      localStorage.setItem(meta.storageKey, JSON.stringify(list));
    } catch (e) {
      console.error(`Error saving ${type} to localStorage`, e);
    }
  };

  // Form toggle state
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form fields
  const [lokasiTiang, setLokasiTiang] = useState<string>('Tiang No. 01 - Jl. Raya Passo, Baguala');
  const [latitude, setLatitude] = useState<number>(-3.642100);
  const [longitude, setLongitude] = useState<number>(128.231500);

  // Dynamic Equipment Names & Penyulang (Tambah / Kurang Sesuai Kebutuhan)
  const [peralatanItems, setPeralatanItems] = useState<ItemPeralatanDetail[]>([
    {
      id: 'item-init-1',
      namaPeralatan: `${meta.shortTitle} Passo 01`,
      penyulang: penyulangList[0]?.namaPenyulang || 'PASSO'
    }
  ]);

  // Map state and refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const [mapLayerType, setMapLayerType] = useState<'street' | 'satellite' | 'dark'>('street');

  // Alert and confirmation modals
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<{ id: string; lokasi: string } | null>(null);

  // Search & filter
  const [searchQuery, setSearchQuery] = useState('');

  // Location name approximation helper
  const approximatePoleLocation = (lat: number, lng: number): string => {
    if (lat > -3.655 && lng > 128.22) {
      return `Tiang Kawasan Passo - Baguala (Titik: ${lat.toFixed(6)}, ${lng.toFixed(6)})`;
    } else if (lat < -3.69 && lng < 128.12) {
      return `Tiang Kawasan Bandara Pattimura / Laha (Titik: ${lat.toFixed(6)}, ${lng.toFixed(6)})`;
    } else if (lng < 128.18 && lat > -3.67) {
      return `Tiang Kawasan Wayame - Teluk Ambon (Titik: ${lat.toFixed(6)}, ${lng.toFixed(6)})`;
    } else if (lat < -3.665 && lng > 128.18 && lng < 128.20) {
      return `Tiang Kawasan Poka - Teluk Ambon (Titik: ${lat.toFixed(6)}, ${lng.toFixed(6)})`;
    } else if (lat < -3.67 && lng > 128.19 && lng < 128.21) {
      return `Tiang Kawasan Hative Kecil / Galala (Titik: ${lat.toFixed(6)}, ${lng.toFixed(6)})`;
    }
    return `Tiang Kawasan Jaringan 20kV ULP Baguala (Titik: ${lat.toFixed(6)}, ${lng.toFixed(6)})`;
  };

  // Helper to update marker position
  const updateMapMarkerPosition = useCallback((lat: number, lng: number, popupContent?: string) => {
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
      const currentLabel = popupContent || `${meta.shortTitle}<br/><b>${lat.toFixed(6)}, ${lng.toFixed(6)}</b>`;
      markerRef.current.setPopupContent(currentLabel);
    }
    if (mapInstanceRef.current) {
      mapInstanceRef.current.panTo([lat, lng]);
    }
  }, [meta.shortTitle]);

  // Leaflet Map Lifecycle Management
  useEffect(() => {
    if (!isFormOpen) {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
        tileLayerRef.current = null;
      }
      return;
    }

    const timer = setTimeout(() => {
      if (!mapContainerRef.current) return;

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const initialLat = latitude || -3.642100;
      const initialLng = longitude || 128.231500;

      try {
        const map = L.map(mapContainerRef.current, {
          center: [initialLat, initialLng],
          zoom: 15,
          zoomControl: true,
          scrollWheelZoom: true
        });

        let tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
        let tileAttr = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
        let maxZ = 19;

        if (mapLayerType === 'satellite') {
          tileUrl = 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}';
          tileAttr = '&copy; Google Maps Satellite';
          maxZ = 20;
        } else if (mapLayerType === 'dark') {
          tileUrl = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
          tileAttr = '&copy; CARTO Voyager';
          maxZ = 19;
        }

        const tileLayer = L.tileLayer(tileUrl, {
          attribution: tileAttr,
          maxZoom: maxZ
        }).addTo(map);

        tileLayerRef.current = tileLayer;

        // Custom Pin Icon based on equipment color
        const pinDivIcon = L.divIcon({
          className: 'custom-equipment-map-pin',
          html: `
            <div style="display:flex; flex-direction:column; align-items:center; transform: translate(-50%, -100%); cursor: grab;">
              <div style="background-color: ${meta.pinColor}; color: white; padding: 6px; border-radius: 12px; border: 2px solid white; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 11px; min-width: 28px; height: 28px;">
                ${meta.shortTitle}
              </div>
              <div style="width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 8px solid ${meta.pinColor}; margin-top: -1px;"></div>
              <div style="width: 12px; height: 4px; background: rgba(0,0,0,0.3); border-radius: 50%; margin-top: 2px;"></div>
            </div>
          `,
          iconSize: [0, 0],
          iconAnchor: [0, 0]
        });

        const marker = L.marker([initialLat, initialLng], {
          icon: pinDivIcon,
          draggable: true
        }).addTo(map);

        marker.bindPopup(`<b>Titik Tiang ${meta.shortTitle}</b><br/>${lokasiTiang}`).openPopup();

        // Click event on map: updates position and outputs location/coordinates
        map.on('click', (e: L.LeafletMouseEvent) => {
          const lat = parseFloat(e.latlng.lat.toFixed(6));
          const lng = parseFloat(e.latlng.lng.toFixed(6));
          setLatitude(lat);
          setLongitude(lng);

          marker.setLatLng([lat, lng]);
          const detectedLokasi = approximatePoleLocation(lat, lng);
          setLokasiTiang(detectedLokasi);
          marker.setPopupContent(`<b>Titik Tiang ${meta.shortTitle}</b><br/>${detectedLokasi}`).openPopup();
        });

        // Drag marker event
        marker.on('dragend', () => {
          const pos = marker.getLatLng();
          const lat = parseFloat(pos.lat.toFixed(6));
          const lng = parseFloat(pos.lng.toFixed(6));
          setLatitude(lat);
          setLongitude(lng);

          const detectedLokasi = approximatePoleLocation(lat, lng);
          setLokasiTiang(detectedLokasi);
          marker.setPopupContent(`<b>Titik Tiang ${meta.shortTitle}</b><br/>${detectedLokasi}`).openPopup();
        });

        mapInstanceRef.current = map;
        markerRef.current = marker;

        setTimeout(() => {
          map.invalidateSize();
        }, 150);
      } catch (err) {
        console.error('Error initializing equipment Leaflet map:', err);
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
        tileLayerRef.current = null;
      }
    };
  }, [isFormOpen, meta.pinColor, meta.shortTitle]);

  // Tile layer update on style switch
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (tileLayerRef.current) {
      tileLayerRef.current.remove();
    }

    let tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    let tileAttr = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
    let maxZ = 19;

    if (mapLayerType === 'satellite') {
      tileUrl = 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}';
      tileAttr = '&copy; Google Maps Satellite';
      maxZ = 20;
    } else if (mapLayerType === 'dark') {
      tileUrl = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
      tileAttr = '&copy; CARTO Voyager';
      maxZ = 19;
    }

    const newTile = L.tileLayer(tileUrl, { attribution: tileAttr, maxZoom: maxZ }).addTo(mapInstanceRef.current);
    tileLayerRef.current = newTile;
    mapInstanceRef.current.invalidateSize();
  }, [mapLayerType]);

  // DYNAMIC EQUIPMENT LIST HANDLERS (Tambah / Kurang sesuai kebutuhan)
  const handleAddEquipmentItem = () => {
    const count = peralatanItems.length + 1;
    const defaultFeeder = penyulangList[0]?.namaPenyulang || 'PASSO';
    setPeralatanItems([
      ...peralatanItems,
      {
        id: `eq-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        namaPeralatan: `${meta.shortTitle} ${defaultFeeder} 0${count}`,
        penyulang: defaultFeeder
      }
    ]);
  };

  const handleRemoveEquipmentItem = (id: string) => {
    if (peralatanItems.length <= 1) {
      setAlertMessage({
        type: 'error',
        text: `Minimal harus ada 1 nama peralatan ${meta.shortTitle} yang terdaftar!`
      });
      setTimeout(() => setAlertMessage(null), 3500);
      return;
    }
    setPeralatanItems(peralatanItems.filter(item => item.id !== id));
  };

  const handleUpdateEquipmentItem = (id: string, field: 'namaPeralatan' | 'penyulang', value: string) => {
    setPeralatanItems(peralatanItems.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  // SAVE HANDLER (AUTOMATICALLY CLOSES FORM ON SAVE)
  const handleSaveEquipment = (e: React.FormEvent) => {
    e.preventDefault();

    if (!lokasiTiang.trim()) {
      setAlertMessage({ type: 'error', text: 'Silakan tentukan Lokasi / Tiang terlebih dahulu!' });
      setTimeout(() => setAlertMessage(null), 3500);
      return;
    }

    if (peralatanItems.length === 0) {
      setAlertMessage({ type: 'error', text: `Minimal harus memiliki 1 nama peralatan ${meta.shortTitle}!` });
      setTimeout(() => setAlertMessage(null), 3500);
      return;
    }

    // Check that all items have names
    const hasEmptyName = peralatanItems.some(it => !it.namaPeralatan.trim());
    if (hasEmptyName) {
      setAlertMessage({ type: 'error', text: 'Semua baris nama peralatan harus diisi!' });
      setTimeout(() => setAlertMessage(null), 3500);
      return;
    }

    let updated: MasterDistributionEquipment[];

    if (editingId) {
      updated = dataList.map(item => {
        if (item.id === editingId) {
          return {
            ...item,
            lokasi: lokasiTiang.trim(),
            latitude: latitude,
            longitude: longitude,
            peralatanList: peralatanItems
          };
        }
        return item;
      });

      setDataList(updated);
      saveToStorage(updated);
      setAlertMessage({ type: 'success', text: `Data ${meta.title} berhasil diperbarui!` });
      setEditingId(null);
    } else {
      const newEntry: MasterDistributionEquipment = {
        id: `${type}-${Date.now()}`,
        jenis: meta.shortTitle as any,
        lokasi: lokasiTiang.trim(),
        latitude: latitude,
        longitude: longitude,
        peralatanList: peralatanItems,
        createdAt: new Date().toISOString()
      };

      updated = [newEntry, ...dataList];
      setDataList(updated);
      saveToStorage(updated);
      setAlertMessage({ type: 'success', text: `Data ${meta.title} berhasil disimpan ke sistem!` });
    }

    // Reset form fields
    setLokasiTiang('Tiang No. 01 - Jl. Raya Passo, Baguala');
    setLatitude(-3.642100);
    setLongitude(128.231500);
    setPeralatanItems([
      {
        id: `item-init-${Date.now()}`,
        namaPeralatan: `${meta.shortTitle} Passo 01`,
        penyulang: penyulangList[0]?.namaPenyulang || 'PASSO'
      }
    ]);

    // OTOMATIS MENUTUP MENU INPUT
    setIsFormOpen(false);

    setTimeout(() => setAlertMessage(null), 4000);
  };

  // EDIT ACTION
  const handleStartEdit = (entry: MasterDistributionEquipment) => {
    setEditingId(entry.id);
    setLokasiTiang(entry.lokasi);
    setLatitude(entry.latitude || -3.642100);
    setLongitude(entry.longitude || 128.231500);
    setPeralatanItems(
      entry.peralatanList && entry.peralatanList.length > 0
        ? entry.peralatanList
        : [
            {
              id: `item-${Date.now()}`,
              namaPeralatan: `${meta.shortTitle} Passo 01`,
              penyulang: penyulangList[0]?.namaPenyulang || 'PASSO'
            }
          ]
    );

    setIsFormOpen(true);
    window.scrollTo({ top: 250, behavior: 'smooth' });
  };

  // CANCEL / CLOSE
  const handleCancelForm = () => {
    setEditingId(null);
    setIsFormOpen(false);
    setLokasiTiang('Tiang No. 01 - Jl. Raya Passo, Baguala');
    setLatitude(-3.642100);
    setLongitude(128.231500);
  };

  // DELETE CONFIRMATION
  const handleRequestDelete = (entry: MasterDistributionEquipment) => {
    setDeleteConfirmItem({ id: entry.id, lokasi: entry.lokasi });
  };

  const handleConfirmDelete = () => {
    if (!deleteConfirmItem) return;
    const { id } = deleteConfirmItem;

    const updated = dataList.filter(item => item.id !== id);
    setDataList(updated);
    saveToStorage(updated);

    if (editingId === id) {
      setEditingId(null);
      setIsFormOpen(false);
    }

    setDeleteConfirmItem(null);
    setAlertMessage({ type: 'success', text: `Data peralatan ${meta.shortTitle} berhasil dihapus!` });
    setTimeout(() => setAlertMessage(null), 3500);
  };

  // FILTERED LIST
  const filteredList = dataList.filter(item => {
    const q = searchQuery.toLowerCase();
    const matchLokasi = (item.lokasi || '').toLowerCase().includes(q);
    const matchItems = item.peralatanList?.some(
      eq =>
        (eq.namaPeralatan || '').toLowerCase().includes(q) ||
        (eq.penyulang || '').toLowerCase().includes(q)
    );
    return matchLokasi || matchItems;
  });

  // CSV EXPORT
  const handleExportCSV = () => {
    const headers = [
      'Jenis Peralatan',
      'Lokasi / Tiang',
      'Latitude',
      'Longitude',
      'Jumlah Unit Terpasang',
      'Rincian Nama Peralatan & Penyulang'
    ];

    const rows = filteredList.map(item => [
      meta.shortTitle,
      item.lokasi,
      item.latitude || '-',
      item.longitude || '-',
      item.peralatanList?.length || 0,
      item.peralatanList?.map(p => `${p.namaPeralatan} [${p.penyulang}]`).join(' | ') || '-'
    ]);

    exportToCSV(`Master_Data_${meta.shortTitle}_ULP_Baguala`, headers, rows);
  };

  return (
    <div className="space-y-6">
      
      {/* Toast Alert Notification */}
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

      {/* TOP HEADER & ACTION BAR */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-2xl ${meta.colorBg} border ${meta.colorBorder} flex items-center justify-center ${meta.colorText} shadow-inner`}>
            <IconComponent className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-slate-900">
                Master Data {meta.title}
              </h3>
              <span className={`px-2.5 py-0.5 rounded-full ${meta.badgeBg} ${meta.badgeText} text-[10px] font-extrabold uppercase`}>
                {meta.shortTitle}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {meta.description}
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
              className={`w-full sm:w-auto px-5 py-2.5 text-white text-xs font-extrabold rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
                type === 'lbs'
                  ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-500/25'
                  : type === 'pmcb'
                  ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-500/25'
                  : type === 'recloser'
                  ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/25'
                  : 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/25'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>+ Input {meta.shortTitle} Baru</span>
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

      {/* FORM INPUT MASTER PERALATAN (COLLAPSIBLE / AUTO CLOSE ON SAVE) */}
      {isFormOpen && (
        <div className={`bg-white border ${meta.colorBorder} shadow-md rounded-3xl p-6 md:p-8 space-y-6 relative overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200`}>
          
          {/* Form Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-2xl ${meta.colorBg} border ${meta.colorBorder} flex items-center justify-center ${meta.colorText} font-bold`}>
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-extrabold text-slate-900">
                    {editingId ? `Edit Master Data ${meta.shortTitle}` : `Form Input Master Data ${meta.shortTitle}`}
                  </h4>
                  {editingId && (
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold animate-pulse">
                      Mode Edit
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tentukan titik tiang pada peta dan tambahkan nama peralatan serta penyulang terkait. Form akan tertutup otomatis setelah tersimpan.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCancelForm}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors self-start md:self-auto cursor-pointer"
              title="Tutup Form"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSaveEquipment} className="space-y-6">
            
            {/* STEP 1: LOKASI TIANG & PETA INTERAKTIF */}
            <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-black text-slate-800 uppercase tracking-wider">
                  <span className={`w-6 h-6 rounded-full text-white flex items-center justify-center text-[11px] font-mono ${
                    type === 'lbs' ? 'bg-amber-600' : type === 'pmcb' ? 'bg-purple-600' : type === 'recloser' ? 'bg-blue-600' : 'bg-rose-600'
                  }`}>1</span>
                  <span>Pilih Lokasi Tiang Dari Peta & Koordinat</span>
                </div>

                {/* Layer Switchers */}
                <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setMapLayerType('street')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      mapLayerType === 'street'
                        ? `${type === 'lbs' ? 'bg-amber-600' : type === 'pmcb' ? 'bg-purple-600' : type === 'recloser' ? 'bg-blue-600' : 'bg-rose-600'} text-white shadow-sm`
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Peta Jalan
                  </button>
                  <button
                    type="button"
                    onClick={() => setMapLayerType('satellite')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      mapLayerType === 'satellite'
                        ? `${type === 'lbs' ? 'bg-amber-600' : type === 'pmcb' ? 'bg-purple-600' : type === 'recloser' ? 'bg-blue-600' : 'bg-rose-600'} text-white shadow-sm`
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Satelit
                  </button>
                  <button
                    type="button"
                    onClick={() => setMapLayerType('dark')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      mapLayerType === 'dark'
                        ? `${type === 'lbs' ? 'bg-amber-600' : type === 'pmcb' ? 'bg-purple-600' : type === 'recloser' ? 'bg-blue-600' : 'bg-rose-600'} text-white shadow-sm`
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Terrain
                  </button>
                </div>
              </div>

              <div className={`p-3 ${meta.colorBg} border ${meta.colorBorder} rounded-xl text-xs ${meta.colorText} flex items-start gap-2.5`}>
                <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <strong>Pilih Langsung dari Peta:</strong> Klik di mana saja pada peta atau geser pin <strong>{meta.shortTitle}</strong> untuk menentukan titik tiang. Nama lokasi dan titik koordinat (Latitude & Longitude) akan otomatis terisi.
                </div>
              </div>

              {/* Map Canvas */}
              <div className="rounded-2xl border border-slate-300 overflow-hidden shadow-inner relative h-80 w-full z-0 bg-slate-100">
                <div ref={mapContainerRef} className="w-full h-full" style={{ minHeight: '320px' }} />
                
                {/* Floating Map Info Badge */}
                <div className="absolute top-3 left-3 z-[1000] bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-200 shadow-md flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></div>
                  <div className="text-xs font-extrabold text-slate-800">
                    Titik Tiang: <span className="font-mono text-blue-700">{latitude.toFixed(6)}, {longitude.toFixed(6)}</span>
                  </div>
                </div>

                {/* Reset Pin to Passo */}
                <button
                  type="button"
                  onClick={() => {
                    const defaultLat = -3.642100;
                    const defaultLng = 128.231500;
                    setLatitude(defaultLat);
                    setLongitude(defaultLng);
                    updateMapMarkerPosition(defaultLat, defaultLng);
                    if (mapInstanceRef.current) {
                      mapInstanceRef.current.setView([defaultLat, defaultLng], 15);
                    }
                  }}
                  className="absolute bottom-3 right-3 z-[1000] bg-white hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-xl border border-slate-200 shadow-md text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Pusatkan Peta ke Passo Baguala"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-blue-600" />
                  <span>Reset Peta (Passo)</span>
                </button>
              </div>

              {/* Lokasi / Tiang & Koordinat Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="space-y-1.5 md:col-span-3">
                  <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>Nama Lokasi / Identitas Tiang <span className="text-rose-500">*</span></span>
                    <span className="text-[10px] font-medium text-slate-400">Otomatis dari Peta / Dapat Diedit Bebas</span>
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={lokasiTiang}
                      onChange={(e) => setLokasiTiang(e.target.value)}
                      placeholder="Contoh: Tiang No. 42 / Jl. Raya Passo, Baguala..."
                      className="w-full pl-10 pr-3 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Latitude (Lintang)</label>
                  <input
                    type="number"
                    step="any"
                    value={latitude}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setLatitude(val);
                      updateMapMarkerPosition(val, longitude);
                    }}
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Longitude (Bujur)</label>
                  <input
                    type="number"
                    step="any"
                    value={longitude}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setLongitude(val);
                      updateMapMarkerPosition(latitude, val);
                    }}
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                  />
                </div>
              </div>
            </div>

            {/* STEP 2: NAMA PERALATAN (DINAMIS BISA DITAMBAH / DIKURANGI SESUAI KEBUTUHAN) */}
            <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/70 pb-3">
                <div className="flex items-center gap-2 text-xs font-black text-slate-800 uppercase tracking-wider">
                  <span className={`w-6 h-6 rounded-full text-white flex items-center justify-center text-[11px] font-mono ${
                    type === 'lbs' ? 'bg-amber-600' : type === 'pmcb' ? 'bg-purple-600' : type === 'recloser' ? 'bg-blue-600' : 'bg-rose-600'
                  }`}>2</span>
                  <span>Nama Peralatan {meta.shortTitle} & Penyulang Terkait</span>
                  <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold">
                    Total: {peralatanItems.length} Peralatan
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleAddEquipmentItem}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm shadow-blue-500/20 cursor-pointer self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Tambah Peralatan {meta.shortTitle}</span>
                </button>
              </div>

              <p className="text-xs text-slate-600">
                Nama peralatan dapat ditambah atau dikurangi sesuai kebutuhan (misal di satu tiang terdapat lebih dari satu unit {meta.shortTitle} atau percabangan jalur).
              </p>

              {/* Dynamic Rows of Equipment */}
              <div className="space-y-2.5">
                {peralatanItems.map((item, idx) => (
                  <div
                    key={item.id}
                    className="p-3.5 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col md:flex-row items-stretch md:items-center gap-3 animate-in fade-in slide-in-from-left-2 duration-150"
                  >
                    <div className="flex items-center gap-2 min-w-[70px]">
                      <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-600 font-mono text-xs font-black flex items-center justify-center">
                        #{idx + 1}
                      </span>
                      <span className="text-xs font-bold text-slate-500 hidden md:inline">Unit:</span>
                    </div>

                    {/* Nama Peralatan Input */}
                    <div className="flex-1 space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider md:hidden">Nama Peralatan</label>
                      <input
                        type="text"
                        required
                        value={item.namaPeralatan}
                        onChange={(e) => handleUpdateEquipmentItem(item.id, 'namaPeralatan', e.target.value)}
                        placeholder={`Contoh: ${meta.placeholderName}...`}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      />
                    </div>

                    {/* Arrow Indicator */}
                    <div className="hidden md:flex items-center justify-center text-slate-400">
                      <ArrowRightLeft className="w-4 h-4" />
                    </div>

                    {/* Penyulang Select */}
                    <div className="flex-1 space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider md:hidden">Penyulang Terkait</label>
                      <select
                        value={item.penyulang}
                        onChange={(e) => handleUpdateEquipmentItem(item.id, 'penyulang', e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                      >
                        <option value="">Pilih Penyulang...</option>
                        {penyulangList.map(p => (
                          <option key={p.id} value={p.namaPenyulang}>
                            {p.namaPenyulang} ({p.namaGi})
                          </option>
                        ))}
                        {!penyulangList.some(p => p.namaPenyulang === item.penyulang) && item.penyulang && (
                          <option value={item.penyulang}>{item.penyulang}</option>
                        )}
                      </select>
                    </div>

                    {/* Delete Row Button */}
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleRemoveEquipmentItem(item.id)}
                        className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                        title="Hapus unit ini"
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
                className={`px-6 py-3 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-2 transition-all cursor-pointer ${
                  type === 'lbs'
                    ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-500/25'
                    : type === 'pmcb'
                    ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-500/25'
                    : type === 'recloser'
                    ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/25'
                    : 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/25'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{editingId ? `Simpan Perubahan ${meta.shortTitle}` : `Simpan Data ${meta.shortTitle}`}</span>
              </button>

              <button
                type="button"
                onClick={handleCancelForm}
                className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Tutup & Batal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* DAFTAR MASTER PERALATAN TERDAFTAR */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-6 md:p-8 space-y-5">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <IconComponent className={`w-5 h-5 ${meta.colorText}`} />
              Daftar Master {meta.title} Terdaftar ({filteredList.length})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Data titik koordinat dan rincian peralatan {meta.shortTitle} di wilayah kerja PLN ULP Baguala
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Cari lokasi, ${meta.shortTitle}, penyulang...`}
                className="pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all w-64"
              />
            </div>

            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4 text-blue-600" />
              <span>Ekspor CSV</span>
            </button>
          </div>
        </div>

        {/* Tabel Data Peralatan */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-left text-xs text-slate-800">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[11px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3.5 text-center w-12">No</th>
                <th className="px-4 py-3.5">Lokasi / Tiang Jaringan</th>
                <th className="px-4 py-3.5">Titik Koordinat GIS</th>
                <th className="px-4 py-3.5">Rincian Nama Peralatan & Penyulang</th>
                <th className="px-4 py-3.5 text-center w-24">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <AlertCircle className="w-8 h-8 text-slate-300" />
                      <span>Belum ada data master peralatan {meta.shortTitle} yang tersimpan atau sesuai pencarian.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredList.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3.5 text-center font-mono text-slate-400 font-bold">
                      {idx + 1}
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <MapPin className={`w-4 h-4 ${meta.colorText} shrink-0`} />
                        <span className="font-extrabold text-slate-900">{item.lokasi}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      {item.latitude && item.longitude ? (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg font-mono text-[11px] font-bold">
                          <span>{item.latitude.toFixed(6)}, {item.longitude.toFixed(6)}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="flex flex-wrap gap-1.5">
                        {item.peralatanList && item.peralatanList.length > 0 ? (
                          item.peralatanList.map((eq, pIdx) => (
                            <div
                              key={eq.id || pIdx}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-800 rounded-lg text-xs border border-slate-200"
                            >
                              <span className="font-extrabold text-slate-900">{eq.namaPeralatan}</span>
                              <span className="text-slate-300">•</span>
                              <span className="text-blue-700 font-bold">{eq.penyulang}</span>
                            </div>
                          ))
                        ) : (
                          <span className="text-slate-400 italic">Belum ada unit terdaftar</span>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(item)}
                          className="p-2 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                          title="Edit Data Peralatan"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRequestDelete(item)}
                          className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Hapus Data Peralatan"
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

      {/* MODAL DIALOG KONFIRMASI HAPUS */}
      {deleteConfirmItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h4 className="text-base font-extrabold text-slate-900">
                Konfirmasi Hapus Data {meta.shortTitle}?
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Apakah Anda yakin ingin menghapus data peralatan di lokasi:
                <br />
                <strong className="text-slate-800">{deleteConfirmItem.lokasi}</strong>?
                Tindakan ini akan menghapus data dari sistem.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmItem(null)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-600/30 transition-all cursor-pointer"
              >
                Ya, Hapus Data
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
