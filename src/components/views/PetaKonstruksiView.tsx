import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import {
  Wrench,
  Search,
  Plus,
  Filter,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Trash2,
  Edit2,
  X,
  Check,
  Download,
  Upload,
  Calendar,
  Layers,
  Moon,
  Globe,
  Info,
  DollarSign,
  TrendingUp,
  HardHat,
  Building,
  Hammer,
  ShieldCheck,
  Activity,
  ArrowRight
} from 'lucide-react';
import { KonstruksiGisItem, User, Penyulang } from '../../types';
import { ImportKonstruksiModal } from '../modals/ImportKonstruksiModal';

interface PetaKonstruksiViewProps {
  currentUser?: User | null;
  konstruksiList: KonstruksiGisItem[];
  penyulangList?: Penyulang[];
  onAddKonstruksi: (item: KonstruksiGisItem) => void;
  onImportBatch?: (items: KonstruksiGisItem[]) => void;
  onUpdateKonstruksi: (item: KonstruksiGisItem) => void;
  onDeleteKonstruksi: (id: string) => void;
}

export const PetaKonstruksiView: React.FC<PetaKonstruksiViewProps> = ({
  currentUser,
  konstruksiList,
  penyulangList = [],
  onAddKonstruksi,
  onImportBatch,
  onUpdateKonstruksi,
  onDeleteKonstruksi
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPenyulang, setSelectedPenyulang] = useState<string>('Semua');
  const [selectedKategori, setSelectedKategori] = useState<string>('Semua');
  const [selectedStatus, setSelectedStatus] = useState<string>('Semua');
  const [mapStyle, setMapStyle] = useState<'dark' | 'satellite' | 'street'>('dark');
  const [activeTab, setActiveTab] = useState<'peta' | 'tabel' | 'proyek'>('peta');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<KonstruksiGisItem | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<KonstruksiGisItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<KonstruksiGisItem | null>(null);

  // Form State
  const [formNamaProyek, setFormNamaProyek] = useState('');
  const [formNomorSpk, setFormNomorSpk] = useState('');
  const [formNoTiang, setFormNoTiang] = useState('');
  const [formPenyulang, setFormPenyulang] = useState('PASSO');
  const [formSection, setFormSection] = useState('');
  const [formLokasi, setFormLokasi] = useState('');
  const [formLat, setFormLat] = useState<number>(-3.6260);
  const [formLng, setFormLng] = useState<number>(128.2380);
  const [formKategori, setFormKategori] = useState<KonstruksiGisItem['kategoriKonstruksi']>('TRAVERS / Cross Arm');
  const [formJenisAnomali, setFormJenisAnomali] = useState('');
  const [formTingkatBahaya, setFormTingkatBahaya] = useState<KonstruksiGisItem['tingkatBahaya']>('Kritis (Potensi Gangguan Segera)');
  const [formKebutuhanMaterial, setFormKebutuhanMaterial] = useState('');
  const [formStatus, setFormStatus] = useState<KonstruksiGisItem['statusProyek']>('Sedang Dikerjakan');
  const [formProgres, setFormProgres] = useState<number>(50);
  const [formTargetSelesai, setFormTargetSelesai] = useState<string>('2026-03-31');
  const [formTglMulai, setFormTglMulai] = useState<string>(new Date().toISOString().split('T')[0]);
  const [formAnggaran, setFormAnggaran] = useState<number>(4500000);
  const [formPelaksana, setFormPelaksana] = useState('Tim Pemeliharaan JTM ULP Baguala');
  const [formPengawas, setFormPengawas] = useState('Samsul Bahri (Supervisor Teknik)');
  const [formVolume, setFormVolume] = useState('1 Set Travers + 2 Beugel Tiang 8"');
  const [formKeterangan, setFormKeterangan] = useState('');

  // Map refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const layerGroupRef = useRef<L.FeatureGroup | null>(null);

  const getTileUrl = (style: 'dark' | 'satellite' | 'street') => {
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

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [-3.62, 128.25],
      zoom: 12,
      zoomControl: false
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const tile = L.tileLayer(getTileUrl(mapStyle), {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap | Leaflet GIS'
    }).addTo(map);

    tileLayerRef.current = tile;
    layerGroupRef.current = L.featureGroup().addTo(map);
    mapInstanceRef.current = map;

    map.on('click', (e: L.LeafletMouseEvent) => {
      setFormLat(Number(e.latlng.lat.toFixed(6)));
      setFormLng(Number(e.latlng.lng.toFixed(6)));
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Tile Style
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;
    mapInstanceRef.current.removeLayer(tileLayerRef.current);
    const newTile = L.tileLayer(getTileUrl(mapStyle), { maxZoom: 19 }).addTo(mapInstanceRef.current);
    tileLayerRef.current = newTile;
  }, [mapStyle]);

  // Filtered List
  const filteredList = konstruksiList.filter((item) => {
    const matchSearch =
      (item.namaProyek || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.nomorSpk || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.noTiang || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.penyulang || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.lokasi || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.jenisAnomali || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.kebutuhanMaterial || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.pelaksanaVendor || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.pengawasPln || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchPenyulang = selectedPenyulang === 'Semua' || item.penyulang === selectedPenyulang;
    const matchKategori = selectedKategori === 'Semua' || item.kategoriKonstruksi === selectedKategori;
    const matchStatus = selectedStatus === 'Semua' || item.statusProyek === selectedStatus;

    return matchSearch && matchPenyulang && matchKategori && matchStatus;
  });

  // Calculate Statistics
  const totalProyek = konstruksiList.length;
  const onGoingProyek = konstruksiList.filter((k) => k.statusProyek === 'Sedang Dikerjakan' || k.statusProyek === 'Uji Komisioning' || k.statusProyek === 'Terjadwal WO / Pemeliharaan').length;
  const selesaiProyek = konstruksiList.filter((k) => k.statusProyek === 'Selesai Beroperasi' || k.statusProyek === 'Selesai Diperbaiki').length;
  const kritisCount = konstruksiList.filter((k) => k.tingkatBahaya?.includes('Kritis')).length;
  const totalAnggaran = konstruksiList.reduce((acc, curr) => acc + (curr.anggaranRp || 0), 0);
  const avgProgres = totalProyek > 0 ? Math.round(konstruksiList.reduce((acc, curr) => acc + (curr.progresPersen || 0), 0) / totalProyek) : 0;

  // Render Polylines & Markers
  useEffect(() => {
    if (!mapInstanceRef.current || !layerGroupRef.current) return;
    const lg = layerGroupRef.current;
    lg.clearLayers();

    filteredList.forEach((item) => {
      if (!item.lat || !item.lng) return;

      // Status Color
      let statusColor = '#3B82F6'; // Blue (Rencana / Belum)
      if (item.statusProyek === 'Sedang Dikerjakan' || item.statusProyek === 'Terjadwal WO / Pemeliharaan') statusColor = '#F59E0B'; // Amber
      if (item.statusProyek === 'Uji Komisioning') statusColor = '#8B5CF6'; // Purple
      if (item.statusProyek === 'Selesai Beroperasi' || item.statusProyek === 'Selesai Diperbaiki') statusColor = '#10B981'; // Emerald
      if (item.tingkatBahaya?.includes('Kritis') && item.progresPersen < 100) statusColor = '#EF4444'; // Red for critical

      // Category Icon SVG Path
      let catIconSvg = '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>';
      if (item.kategoriKonstruksi?.includes('TRAVERS') || item.kategoriKonstruksi?.includes('BEUGEL')) {
        catIconSvg = '<path d="M2 12h20M12 2v20M6 8l4-4M18 16l-4 4"/>';
      } else if (item.kategoriKonstruksi?.includes('GARDU') || item.kategoriKonstruksi?.includes('GTT')) {
        catIconSvg = '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M9 9h6v6H9zM9 1v3M15 1v3M9 20v3M15 20v3"/>';
      } else if (item.kategoriKonstruksi?.includes('KABEL') || item.kategoriKonstruksi?.includes('Konduktor')) {
        catIconSvg = '<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>';
      }

      // Draw polyline if exists
      if (item.coordinatesPolyline && item.coordinatesPolyline.length > 1) {
        const polyline = L.polyline(item.coordinatesPolyline, {
          color: statusColor,
          weight: 5,
          opacity: 0.85,
          dashArray: item.progresPersen < 100 ? '8, 8' : undefined
        }).addTo(lg);

        polyline.bindTooltip(`${item.namaProyek} (${item.progresPersen}%)`, {
          sticky: true,
          className: 'custom-leaflet-tooltip'
        });
      }

      // Marker Icon
      const customIcon = L.divIcon({
        className: 'custom-construction-pin',
        html: `
          <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
            <div style="width: 32px; height: 32px; border-radius: 10px; background: ${statusColor}; border: 2.5px solid #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; color: #ffffff;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                ${catIconSvg}
              </svg>
            </div>
            <div style="position: absolute; bottom: -8px; background: #0f172a; color: #f8fafc; font-size: 9px; font-weight: 900; padding: 1px 5px; border-radius: 5px; border: 1px solid ${statusColor}; white-space: nowrap;">
              ${item.progresPersen}%
            </div>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -20]
      });

      const marker = L.marker([item.lat, item.lng], { icon: customIcon }).addTo(lg);

      const formatRupiah = (num?: number) => {
        if (!num) return 'Rp 0';
        return 'Rp ' + num.toLocaleString('id-ID');
      };

      const popupHtml = `
        <div style="font-family: sans-serif; min-width: 280px; padding: 4px;">
          <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #334155; padding-bottom: 6px; margin-bottom: 8px;">
            <div style="font-weight: 800; font-size: 13px; color: #f8fafc; display: flex; align-items: center; gap: 6px;">
              <span style="display: inline-block; width: 8px; height: 8px; border-radius: 2px; background: ${statusColor};"></span>
              ${item.penyulang}
            </div>
            <span style="font-size: 10px; font-weight: 800; background: ${statusColor}25; color: ${statusColor}; border: 1px solid ${statusColor}60; padding: 2px 6px; border-radius: 6px;">
              ${item.statusProyek} (${item.progresPersen}%)
            </span>
          </div>

          <div style="font-size: 12.5px; font-weight: 800; color: #38bdf8; margin-bottom: 4px; line-height: 1.3;">
            ${item.namaProyek}
          </div>

          ${item.noTiang ? `<div style="font-size: 11px; font-weight: 700; color: #fbbf24; margin-bottom: 6px;">📍 No Tiang / Gardu: ${item.noTiang}</div>` : ''}

          <div style="font-size: 11px; color: #cbd5e1; space-y: 4px; line-height: 1.5;">
            <div><strong>📜 Laporan/SPK:</strong> ${item.nomorSpk || '-'}</div>
            <div><strong>🏗️ Kategori:</strong> <span style="color: #facc15; font-weight: 700;">${item.kategoriKonstruksi}</span></div>
            ${item.tingkatBahaya ? `<div><strong>⚠️ Tingkat Bahaya:</strong> <span style="color: ${item.tingkatBahaya.includes('Kritis') ? '#ef4444' : '#f59e0b'}; font-weight: 800;">${item.tingkatBahaya}</span></div>` : ''}
            <div><strong>📍 Lokasi:</strong> ${item.lokasi}</div>
            ${item.jenisAnomali ? `<div style="margin-top: 4px; padding: 5px 7px; background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 6px; color: #fca5a5; font-size: 10.5px;"><strong>Temuan:</strong> ${item.jenisAnomali}</div>` : ''}
            ${item.kebutuhanMaterial ? `<div style="margin-top: 4px; padding: 5px 7px; background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 6px; color: #fde68a; font-size: 10.5px;"><strong>Material PLN:</strong> ${item.kebutuhanMaterial}</div>` : ''}
            <div style="margin-top: 4px;"><strong>💰 Estimasi Biaya:</strong> <span style="color: #4ade80; font-weight: 700;">${formatRupiah(item.anggaranRp)}</span></div>
            <div><strong>👷 Tim Pelaksana:</strong> ${item.pelaksanaVendor}</div>
            <div><strong>🎯 Target:</strong> ${item.targetSelesai}</div>
            ${item.keterangan ? `<div style="margin-top: 4px; padding: 5px; background: rgba(30,41,59,0.7); border-radius: 6px; font-style: italic; color: #94a3b8; font-size: 10.5px;">${item.keterangan}</div>` : ''}
          </div>

          <div style="margin-top: 10px; display: flex; gap: 6px;">
            <button onclick="window.viewKonstruksiDetail('${item.id}')" style="flex: 1; background: #0284c7; color: white; border: none; padding: 5px 8px; border-radius: 6px; font-size: 11px; font-weight: 700; cursor: pointer;">
              🔍 Detail & Material
            </button>
            <button onclick="window.quickDoneKonstruksi('${item.id}')" style="background: #059669; color: white; border: none; padding: 5px 8px; border-radius: 6px; font-size: 11px; font-weight: 700; cursor: pointer;">
              ✓ Tuntas
            </button>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, { className: 'custom-leaflet-popup' });
    });

    if (filteredList.length > 0) {
      const bounds = lg.getBounds();
      if (bounds.isValid()) {
        mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
      }
    }
  }, [filteredList]);

  // Window Callbacks
  useEffect(() => {
    (window as any).viewKonstruksiDetail = (id: string) => {
      const found = konstruksiList.find((k) => k.id === id);
      if (found) setSelectedDetail(found);
    };

    (window as any).quickDoneKonstruksi = (id: string) => {
      const found = konstruksiList.find((k) => k.id === id);
      if (found) {
        onUpdateKonstruksi({
          ...found,
          statusProyek: 'Selesai Beroperasi',
          progresPersen: 100
        });
      }
    };

    return () => {
      delete (window as any).viewKonstruksiDetail;
      delete (window as any).quickDoneKonstruksi;
    };
  }, [konstruksiList, onUpdateKonstruksi]);

  // Form Reset / Open
  const openAddModal = () => {
    setEditingItem(null);
    setFormNamaProyek('');
    setFormNomorSpk(`INSP/KNST/${new Date().getFullYear()}/${Math.floor(Math.random() * 900 + 100)}`);
    setFormNoTiang('PAS-48');
    setFormPenyulang(penyulangList[0]?.namaPenyulang || 'PASSO');
    setFormSection('');
    setFormLokasi('');
    setFormLat(-3.6260);
    setFormLng(128.2380);
    setFormKategori('TRAVERS / Cross Arm');
    setFormJenisAnomali('');
    setFormTingkatBahaya('Kritis (Potensi Gangguan Segera)');
    setFormKebutuhanMaterial('1 Set Travers UNP 10 + 2 Set Beugel Tiang 8" + Mur Baut M16');
    setFormStatus('Sedang Dikerjakan');
    setFormProgres(50);
    setFormTargetSelesai('2026-03-31');
    setFormTglMulai(new Date().toISOString().split('T')[0]);
    setFormAnggaran(4500000);
    setFormPelaksana('Tim Pemeliharaan JTM ULP Baguala');
    setFormPengawas('Samsul Bahri (Supervisor Teknik)');
    setFormVolume('1 Set Travers UNP + 2 Beugel Tiang');
    setFormKeterangan('');
    setIsModalOpen(true);
  };

  const openEditModal = (item: KonstruksiGisItem) => {
    setEditingItem(item);
    setFormNamaProyek(item.namaProyek);
    setFormNomorSpk(item.nomorSpk || '');
    setFormNoTiang(item.noTiang || '');
    setFormPenyulang(item.penyulang);
    setFormSection(item.section || '');
    setFormLokasi(item.lokasi);
    setFormLat(item.lat);
    setFormLng(item.lng);
    setFormKategori(item.kategoriKonstruksi);
    setFormJenisAnomali(item.jenisAnomali || '');
    setFormTingkatBahaya(item.tingkatBahaya || 'Tinggi (Perlu Tindak Lanjut Cepat)');
    setFormKebutuhanMaterial(item.kebutuhanMaterial || '');
    setFormStatus(item.statusProyek);
    setFormProgres(item.progresPersen);
    setFormTargetSelesai(item.targetSelesai);
    setFormTglMulai(item.tglMulai || '');
    setFormAnggaran(item.anggaranRp || 0);
    setFormPelaksana(item.pelaksanaVendor);
    setFormPengawas(item.pengawasPln);
    setFormVolume(item.volumeAset);
    setFormKeterangan(item.keterangan || '');
    setIsModalOpen(true);
    setSelectedDetail(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNamaProyek || !formPenyulang || !formLokasi || !formLat || !formLng) {
      alert('Mohon lengkapi Judul Temuan/Proyek, Penyulang, Lokasi, dan Koordinat GIS!');
      return;
    }

    const payload: KonstruksiGisItem = {
      id: editingItem ? editingItem.id : `kst-${Date.now()}`,
      namaProyek: formNamaProyek,
      nomorSpk: formNomorSpk,
      noTiang: formNoTiang,
      penyulang: formPenyulang,
      section: formSection,
      lokasi: formLokasi,
      lat: Number(formLat),
      lng: Number(formLng),
      kategoriKonstruksi: formKategori,
      jenisAnomali: formJenisAnomali,
      tingkatBahaya: formTingkatBahaya,
      kebutuhanMaterial: formKebutuhanMaterial,
      statusProyek: formStatus,
      progresPersen: Number(formProgres),
      targetSelesai: formTargetSelesai,
      tglMulai: formTglMulai,
      anggaranRp: Number(formAnggaran),
      pelaksanaVendor: formPelaksana,
      pengawasPln: formPengawas,
      volumeAset: formVolume,
      keterangan: formKeterangan,
      coordinatesPolyline: editingItem?.coordinatesPolyline || [
        [Number(formLat) - 0.0008, Number(formLng) - 0.0008],
        [Number(formLat), Number(formLng)],
        [Number(formLat) + 0.0008, Number(formLng) + 0.0008]
      ]
    };

    if (editingItem) {
      onUpdateKonstruksi(payload);
    } else {
      onAddKonstruksi(payload);
    }

    setIsModalOpen(false);
  };

  const handleBatchImport = (items: KonstruksiGisItem[]) => {
    if (onImportBatch) {
      onImportBatch(items);
    } else {
      items.forEach((it) => onAddKonstruksi(it));
    }
  };

  const handleExportCsv = () => {
    const headers = [
      'ID',
      'Nama Temuan / Proyek',
      'No SPK / Laporan',
      'No Tiang / Gardu',
      'Penyulang',
      'Section',
      'Lokasi',
      'Latitude',
      'Longitude',
      'Kategori Konstruksi',
      'Jenis Anomali',
      'Tingkat Bahaya',
      'Kebutuhan Material PLN',
      'Status',
      'Progres (%)',
      'Anggaran / Biaya (Rp)',
      'Vendor / Tim Pelaksana',
      'Pengawas PLN',
      'Target Selesai',
      'Volume Aset',
      'Keterangan'
    ];

    const rows = filteredList.map((k) => [
      k.id,
      `"${(k.namaProyek || '').replace(/"/g, '""')}"`,
      k.nomorSpk || '-',
      k.noTiang || '-',
      k.penyulang,
      k.section || '-',
      `"${(k.lokasi || '').replace(/"/g, '""')}"`,
      k.lat,
      k.lng,
      `"${k.kategoriKonstruksi}"`,
      `"${(k.jenisAnomali || '').replace(/"/g, '""')}"`,
      `"${(k.tingkatBahaya || '').replace(/"/g, '""')}"`,
      `"${(k.kebutuhanMaterial || '').replace(/"/g, '""')}"`,
      k.statusProyek,
      k.progresPersen,
      k.anggaranRp || 0,
      `"${(k.pelaksanaVendor || '').replace(/"/g, '""')}"`,
      `"${(k.pengawasPln || '').replace(/"/g, '""')}"`,
      k.targetSelesai,
      `"${(k.volumeAset || '').replace(/"/g, '""')}"`,
      `"${(k.keterangan || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Rekap_GIS_Temuan_Inspeksi_Konstruksi_PLN_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatRupiah = (num?: number) => {
    if (!num) return 'Rp 0';
    return 'Rp ' + num.toLocaleString('id-ID');
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 overflow-hidden">
      {/* Header Bar */}
      <div className="bg-slate-900/90 border-b border-slate-800 px-6 py-4 flex flex-wrap items-center justify-between gap-4 shrink-0 shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl shadow-inner">
            <HardHat className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-white tracking-wide">PETA KONSTRUKSI & TEMUAN INSPEKSI GIS</h1>
              <span className="bg-amber-500/20 text-amber-400 text-xs px-2.5 py-0.5 rounded-full font-bold border border-amber-500/30">
                Material & Konstruksi Jaringan PLN
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Monitoring Spasial Temuan Travers, Beugel, Gardu/GTT, Kabel, Isolator, Tiang, & Material Konstruksi ULP Baguala
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center gap-1">
            <button
              onClick={() => setActiveTab('peta')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'peta' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              Peta GIS
            </button>
            <button
              onClick={() => setActiveTab('tabel')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'tabel' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Daftar Temuan ({filteredList.length})
            </button>
          </div>

          <button
            onClick={handleExportCsv}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
            title="Download rekap data GIS temuan inspeksi konstruksi format CSV"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            Export CSV
          </button>

          <button
            onClick={() => setIsImportModalOpen(true)}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40 hover:border-amber-500/80 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm cursor-pointer"
            title="Import data KML, KMZ, GeoJSON, atau CSV/Excel Temuan Inspeksi Konstruksi"
          >
            <Upload className="w-4 h-4 text-amber-400" />
            Import File
          </button>

          <button
            onClick={openAddModal}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-black flex items-center gap-2 transition-all shadow-lg shadow-amber-900/30 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Tambah Temuan Inspeksi
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-900/50 border-b border-slate-800 shrink-0">
        <div className="bg-slate-900/80 border border-slate-800/80 p-3 rounded-xl flex items-center gap-3">
          <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg shrink-0">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Temuan Konstruksi</div>
            <div className="text-lg font-black text-white">{totalProyek} Titik / Item</div>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-amber-500/20 p-3 rounded-xl flex items-center gap-3">
          <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-amber-300 uppercase tracking-wider">Proses Tindak Lanjut</div>
            <div className="text-lg font-black text-amber-400">{onGoingProyek} Titik</div>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-rose-500/20 p-3 rounded-xl flex items-center gap-3">
          <div className="p-2 bg-rose-500/20 text-rose-400 rounded-lg shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-rose-300 uppercase tracking-wider">Temuan Kritis</div>
            <div className="text-lg font-black text-rose-400">{kritisCount} Titik Bahaya</div>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-slate-900/70 border-b border-slate-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2 flex-1 min-w-[260px] max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari tiang, travers, beugel, kabel, gardu, anomali, vendor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap text-xs">
          {/* Filter Penyulang */}
          <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800">
            <span className="text-slate-400 font-bold">Feeder:</span>
            <select
              value={selectedPenyulang}
              onChange={(e) => setSelectedPenyulang(e.target.value)}
              className="bg-transparent text-slate-200 font-bold focus:outline-none cursor-pointer"
            >
              <option value="Semua" className="bg-slate-900">Semua Penyulang</option>
              {Array.from(new Set(konstruksiList.map((k) => k.penyulang))).map((pName) => (
                <option key={pName} value={pName} className="bg-slate-900">
                  {pName}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Kategori */}
          <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800">
            <span className="text-slate-400 font-bold">Material:</span>
            <select
              value={selectedKategori}
              onChange={(e) => setSelectedKategori(e.target.value)}
              className="bg-transparent text-slate-200 font-bold focus:outline-none cursor-pointer max-w-[180px] truncate"
            >
              <option value="Semua" className="bg-slate-900">Semua Material & Konstruksi</option>
              <option value="TRAVERS / Cross Arm" className="bg-slate-900">TRAVERS / Cross Arm</option>
              <option value="BEUGEL & Aksesoris Tiang" className="bg-slate-900">BEUGEL & Aksesoris Tiang</option>
              <option value="GARDU DISTRIBUSI & GTT" className="bg-slate-900">GARDU DISTRIBUSI & GTT</option>
              <option value="KABEL, Konduktor & Jumper" className="bg-slate-900">KABEL & Konduktor</option>
              <option value="ISOLATOR & Arrester" className="bg-slate-900">ISOLATOR & Arrester</option>
              <option value="TIANG DISTRIBUSI" className="bg-slate-900">TIANG DISTRIBUSI</option>
              <option value="PERALATAN HUBUNG (LBS/FCO/DS)" className="bg-slate-900">PERALATAN HUBUNG (LBS/FCO)</option>
              <option value="GROUNDING & Animal Guard" className="bg-slate-900">GROUNDING & Animal Guard</option>
              <option value="MATERIAL / Konstruksi Lainnya" className="bg-slate-900">MATERIAL Lainnya</option>
            </select>
          </div>

          {/* Filter Status */}
          <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800">
            <span className="text-slate-400 font-bold">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-transparent text-slate-200 font-bold focus:outline-none cursor-pointer"
            >
              <option value="Semua" className="bg-slate-900">Semua Status</option>
              <option value="Rencana" className="bg-slate-900 text-blue-400">Rencana / Temuan Baru</option>
              <option value="Sedang Dikerjakan" className="bg-slate-900 text-amber-400">Sedang Dikerjakan</option>
              <option value="Terjadwal WO / Pemeliharaan" className="bg-slate-900 text-amber-400">Terjadwal WO</option>
              <option value="Uji Komisioning" className="bg-slate-900 text-purple-400">Uji Komisioning</option>
              <option value="Selesai Beroperasi" className="bg-slate-900 text-emerald-400">Selesai Beroperasi / Diperbaiki</option>
            </select>
          </div>

          {/* Map Layer Mode */}
          {activeTab === 'peta' && (
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 ml-auto">
              <button
                onClick={() => setMapStyle('dark')}
                className={`p-1.5 rounded-lg transition-all ${mapStyle === 'dark' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                title="Dark Mode"
              >
                <Moon className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setMapStyle('satellite')}
                className={`p-1.5 rounded-lg transition-all ${mapStyle === 'satellite' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                title="Satelit Mode"
              >
                <Globe className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setMapStyle('street')}
                className={`p-1.5 rounded-lg transition-all ${mapStyle === 'street' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                title="Street Map"
              >
                <MapPin className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 relative overflow-hidden">
        {activeTab === 'peta' && (
          <div className="w-full h-full relative">
            <div ref={mapContainerRef} className="w-full h-full z-10" />
          </div>
        )}

        {activeTab === 'tabel' && (
          <div className="w-full h-full overflow-y-auto p-4 space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="font-black text-white text-sm">Daftar Temuan Inspeksi & Proyek Konstruksi Jaringan 20kV</h3>
                  <p className="text-xs text-slate-400">Total {filteredList.length} item temuan/proyek sesuai filter</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-950/80 text-slate-400 font-bold border-b border-slate-800">
                      <th className="py-3 px-4">Temuan & No Tiang</th>
                      <th className="py-3 px-4">Penyulang & Lokasi</th>
                      <th className="py-3 px-4">Kategori & Bahaya</th>
                      <th className="py-3 px-4">Material PLN & Volume</th>
                      <th className="py-3 px-4">Status & Progres</th>
                      <th className="py-3 px-4">Estimasi Biaya</th>
                      <th className="py-3 px-4">Pelaksana & Target</th>
                      <th className="py-3 px-4 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredList.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-slate-500 font-medium">
                          Tidak ada data temuan inspeksi / proyek konstruksi GIS yang cocok dengan filter.
                        </td>
                      </tr>
                    ) : (
                      filteredList.map((item) => {
                        let statusBadge = 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
                        if (item.statusProyek === 'Sedang Dikerjakan' || item.statusProyek === 'Terjadwal WO / Pemeliharaan') statusBadge = 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
                        if (item.statusProyek === 'Uji Komisioning') statusBadge = 'bg-purple-500/20 text-purple-400 border border-purple-500/30';
                        if (item.statusProyek === 'Selesai Beroperasi' || item.statusProyek === 'Selesai Diperbaiki') statusBadge = 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';

                        let bahayaColor = 'text-slate-300';
                        if (item.tingkatBahaya?.includes('Kritis')) bahayaColor = 'text-rose-400 font-extrabold';
                        else if (item.tingkatBahaya?.includes('Tinggi')) bahayaColor = 'text-amber-400 font-bold';

                        return (
                          <tr key={item.id} className="hover:bg-slate-800/40 transition-all">
                            <td className="py-3 px-4 max-w-xs">
                              <div className="font-extrabold text-white line-clamp-1">{item.namaProyek}</div>
                              <div className="flex items-center gap-2 mt-0.5">
                                {item.noTiang && (
                                  <span className="text-[10px] bg-amber-500/20 text-amber-300 font-mono font-bold px-1.5 py-0.5 rounded border border-amber-500/30">
                                    {item.noTiang}
                                  </span>
                                )}
                                <span className="text-[10px] text-slate-400 font-mono">{item.nomorSpk || '-'}</span>
                              </div>
                              {item.jenisAnomali && (
                                <div className="text-[10.5px] text-slate-300 mt-1 line-clamp-1 italic">
                                  {item.jenisAnomali}
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-bold text-emerald-400">{item.penyulang}</div>
                              <div className="text-[11px] text-slate-300 line-clamp-1">{item.lokasi}</div>
                            </td>
                            <td className="py-3 px-4 max-w-xs">
                              <div className="font-semibold text-yellow-300">{item.kategoriKonstruksi}</div>
                              {item.tingkatBahaya && (
                                <div className={`text-[10px] ${bahayaColor}`}>
                                  {item.tingkatBahaya}
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-4 max-w-xs">
                              <div className="font-semibold text-slate-200 line-clamp-2">
                                {item.kebutuhanMaterial || item.volumeAset || '-'}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <div className="w-14 bg-slate-800 rounded-full h-2 overflow-hidden">
                                  <div
                                    className={`h-full ${item.progresPersen === 100 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                                    style={{ width: `${item.progresPersen}%` }}
                                  />
                                </div>
                                <span className="font-extrabold text-white font-mono">{item.progresPersen}%</span>
                              </div>
                              <span className={`inline-block px-1.5 py-0.5 mt-1 rounded text-[9px] font-bold ${statusBadge}`}>
                                {item.statusProyek}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                              {formatRupiah(item.anggaranRp)}
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-bold text-slate-200">{item.pelaksanaVendor}</div>
                              <div className="text-[10px] text-slate-400 font-mono">Target: {item.targetSelesai}</div>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => setSelectedDetail(item)}
                                  className="p-1.5 bg-blue-500/20 hover:bg-blue-500/40 text-blue-400 rounded-lg transition-all cursor-pointer"
                                  title="Lihat Detail Temuan & Material"
                                >
                                  <Info className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => openEditModal(item)}
                                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-all cursor-pointer"
                                  title="Edit"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setDeletingItem(item)}
                                  className="p-1.5 bg-rose-500/20 hover:bg-rose-500/40 text-rose-400 rounded-lg transition-all cursor-pointer"
                                  title="Hapus Temuan"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal Add / Edit Proyek */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg">
                  <HardHat className="w-5 h-5" />
                </div>
                <h3 className="text-base font-black text-white">
                  {editingItem ? 'Edit Temuan Inspeksi / Proyek Konstruksi GIS' : 'Tambah Temuan Inspeksi Konstruksi Baru'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-bold mb-1">Judul Temuan / Nama Proyek Konstruksi *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Temuan Travers Keropos & Miring JTM 20kV"
                    value={formNamaProyek}
                    onChange={(e) => setFormNamaProyek(e.target.value)}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Nomor Tiang / Gardu *</label>
                  <input
                    type="text"
                    placeholder="Contoh: PAS-48 / GTT BG-12"
                    value={formNoTiang}
                    onChange={(e) => setFormNoTiang(e.target.value)}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-amber-300 font-mono font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Nomor Laporan / SPK</label>
                  <input
                    type="text"
                    placeholder="Contoh: INSP/KNST/2026/045"
                    value={formNomorSpk}
                    onChange={(e) => setFormNomorSpk(e.target.value)}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Nama Penyulang *</label>
                  <select
                    value={formPenyulang}
                    onChange={(e) => setFormPenyulang(e.target.value)}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 font-bold focus:outline-none focus:border-amber-500"
                  >
                    {penyulangList.length > 0 ? (
                      penyulangList.map((p) => (
                        <option key={p.id} value={p.namaPenyulang}>
                          {p.namaPenyulang} ({p.namaGi})
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="PASSO">PASSO</option>
                        <option value="LATERI 1">LATERI 1</option>
                        <option value="LATERI 2">LATERI 2</option>
                        <option value="TULEHU">TULEHU</option>
                        <option value="WAIHERU 1">WAIHERU 1</option>
                        <option value="WAIHERU 2">WAIHERU 2</option>
                        <option value="GALALA 1">GALALA 1</option>
                        <option value="HUTUMURI">HUTUMURI</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Kategori Material & Konstruksi *</label>
                  <select
                    value={formKategori}
                    onChange={(e) => setFormKategori(e.target.value as any)}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 font-bold focus:outline-none focus:border-amber-500"
                  >
                    <option value="TRAVERS / Cross Arm">TRAVERS / Cross Arm</option>
                    <option value="BEUGEL & Aksesoris Tiang">BEUGEL & Aksesoris Tiang</option>
                    <option value="GARDU DISTRIBUSI & GTT">GARDU DISTRIBUSI & GTT</option>
                    <option value="KABEL, Konduktor & Jumper">KABEL, Konduktor & Jumper</option>
                    <option value="ISOLATOR & Arrester">ISOLATOR & Arrester</option>
                    <option value="TIANG DISTRIBUSI">TIANG DISTRIBUSI</option>
                    <option value="PERALATAN HUBUNG (LBS/FCO/DS)">PERALATAN HUBUNG (LBS/FCO/DS)</option>
                    <option value="GROUNDING & Animal Guard">GROUNDING & Animal Guard</option>
                    <option value="MATERIAL / Konstruksi Lainnya">MATERIAL / Konstruksi Lainnya</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-bold mb-1">Lokasi Pekerjaan *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Jl. Wolter Monginsidi RT 03/02 Passo Baguala"
                    value={formLokasi}
                    onChange={(e) => setFormLokasi(e.target.value)}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Latitude *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={formLat}
                    onChange={(e) => setFormLat(parseFloat(e.target.value))}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Longitude *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={formLng}
                    onChange={(e) => setFormLng(parseFloat(e.target.value))}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-bold mb-1">Deskripsi Temuan / Anomali Lapangan</label>
                  <input
                    type="text"
                    placeholder="Contoh: Travers UNP keropos akibat korosi laut dan miring 15 derajat"
                    value={formJenisAnomali}
                    onChange={(e) => setFormJenisAnomali(e.target.value)}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-rose-300 font-semibold focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-bold mb-1">Kebutuhan Material PLN</label>
                  <input
                    type="text"
                    placeholder="Contoh: 1 Set Travers UNP 10-2000 + 2 Beugel Tiang 8 inch + Mur Baut M16 Hotdip"
                    value={formKebutuhanMaterial}
                    onChange={(e) => setFormKebutuhanMaterial(e.target.value)}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-amber-300 font-semibold focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Tingkat Bahaya / Prioritas</label>
                  <select
                    value={formTingkatBahaya}
                    onChange={(e) => setFormTingkatBahaya(e.target.value as any)}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 font-bold focus:outline-none focus:border-amber-500"
                  >
                    <option value="Kritis (Potensi Gangguan Segera)">Kritis (Potensi Gangguan Segera)</option>
                    <option value="Tinggi (Perlu Tindak Lanjut Cepat)">Tinggi (Perlu Tindak Lanjut Cepat)</option>
                    <option value="Sedang (Jadwal Pemeliharaan Rutin)">Sedang (Jadwal Pemeliharaan Rutin)</option>
                    <option value="Rendah (Monitoring Berkala)">Rendah (Monitoring Berkala)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Status Pekerjaan *</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 font-bold focus:outline-none focus:border-amber-500"
                  >
                    <option value="Rencana">Rencana / Temuan Baru</option>
                    <option value="Sedang Dikerjakan">Sedang Dikerjakan (In Progress)</option>
                    <option value="Terjadwal WO / Pemeliharaan">Terjadwal WO / Pemeliharaan</option>
                    <option value="Uji Komisioning">Uji Komisioning (Testing)</option>
                    <option value="Selesai Beroperasi">Selesai Diperbaiki / Beroperasi</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Progres Pekerjaan (%)</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={formProgres}
                      onChange={(e) => setFormProgres(parseInt(e.target.value))}
                      className="flex-1 accent-amber-500 cursor-pointer"
                    />
                    <span className="font-mono font-extrabold text-amber-400 w-12 text-right">{formProgres}%</span>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Estimasi Anggaran / Biaya (Rp)</label>
                  <input
                    type="number"
                    step={100000}
                    value={formAnggaran}
                    onChange={(e) => setFormAnggaran(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 font-mono font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Tim Pelaksana / Vendor Har</label>
                  <input
                    type="text"
                    placeholder="Contoh: Tim Pemeliharaan JTM ULP Baguala"
                    value={formPelaksana}
                    onChange={(e) => setFormPelaksana(e.target.value)}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Pengawas Lapangan PLN</label>
                  <input
                    type="text"
                    placeholder="Contoh: Samsul Bahri (Spv Teknik)"
                    value={formPengawas}
                    onChange={(e) => setFormPengawas(e.target.value)}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Target Selesai Perbaikan</label>
                  <input
                    type="date"
                    value={formTargetSelesai}
                    onChange={(e) => setFormTargetSelesai(e.target.value)}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Volume Aset</label>
                  <input
                    type="text"
                    placeholder="Contoh: 1 Set Travers UNP + 2 Beugel Tiang"
                    value={formVolume}
                    onChange={(e) => setFormVolume(e.target.value)}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-bold mb-1">Keterangan & Catatan Teknis</label>
                  <textarea
                    rows={3}
                    placeholder="Deskripsi teknis kendala, kronologi inspeksi, atau instruksi SOP pemadaman..."
                    value={formKeterangan}
                    onChange={(e) => setFormKeterangan(e.target.value)}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-black transition-all shadow-lg shadow-amber-900/30"
                >
                  {editingItem ? 'Simpan Perubahan' : 'Simpan Temuan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detail Proyek */}
      {selectedDetail && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HardHat className="w-5 h-5 text-amber-400" />
                <h3 className="font-black text-white text-base truncate max-w-xs">
                  {selectedDetail.namaProyek}
                </h3>
              </div>
              <button
                onClick={() => setSelectedDetail(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs overflow-y-auto">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="flex justify-between items-center pb-2 border-b border-slate-800/80">
                  <span className="text-slate-400 font-bold">Status & Progres</span>
                  <div className="flex items-center gap-2">
                    <span className="text-amber-400 font-mono font-black text-sm">{selectedDetail.progresPersen}%</span>
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold border border-amber-500/30">
                      {selectedDetail.statusProyek}
                    </span>
                  </div>
                </div>
                {selectedDetail.noTiang && (
                  <div className="flex justify-between items-center pb-2 border-b border-slate-800/80">
                    <span className="text-slate-400 font-bold">No Tiang / Gardu</span>
                    <span className="text-amber-300 font-mono font-extrabold text-sm">{selectedDetail.noTiang}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pb-2 border-b border-slate-800/80">
                  <span className="text-slate-400 font-bold">No Laporan / SPK</span>
                  <span className="text-slate-300 font-mono font-bold">{selectedDetail.nomorSpk || '-'}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-800/80">
                  <span className="text-slate-400 font-bold">Penyulang</span>
                  <span className="text-emerald-400 font-extrabold">{selectedDetail.penyulang}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-800/80">
                  <span className="text-slate-400 font-bold">Lokasi</span>
                  <span className="text-slate-200 font-semibold text-right max-w-[65%]">{selectedDetail.lokasi}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-800/80">
                  <span className="text-slate-400 font-bold">Kategori Material</span>
                  <span className="text-yellow-300 font-bold">{selectedDetail.kategoriKonstruksi}</span>
                </div>
                {selectedDetail.tingkatBahaya && (
                  <div className="flex justify-between items-center pb-2 border-b border-slate-800/80">
                    <span className="text-slate-400 font-bold">Tingkat Bahaya</span>
                    <span className={`font-black ${selectedDetail.tingkatBahaya.includes('Kritis') ? 'text-rose-400' : 'text-amber-400'}`}>
                      {selectedDetail.tingkatBahaya}
                    </span>
                  </div>
                )}
                {selectedDetail.jenisAnomali && (
                  <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-lg">
                    <div className="text-rose-400 font-bold mb-0.5">Temuan Lapangan / Anomali:</div>
                    <div className="text-slate-200 font-medium">{selectedDetail.jenisAnomali}</div>
                  </div>
                )}
                {selectedDetail.kebutuhanMaterial && (
                  <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                    <div className="text-amber-400 font-bold mb-0.5">Kebutuhan Material PLN:</div>
                    <div className="text-slate-200 font-medium">{selectedDetail.kebutuhanMaterial}</div>
                  </div>
                )}
                <div className="flex justify-between items-center pb-2 border-b border-slate-800/80">
                  <span className="text-slate-400 font-bold">Estimasi Anggaran</span>
                  <span className="text-emerald-400 font-mono font-black text-sm">{formatRupiah(selectedDetail.anggaranRp)}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-800/80">
                  <span className="text-slate-400 font-bold">Tim Pelaksana Har</span>
                  <span className="text-slate-200 font-bold">{selectedDetail.pelaksanaVendor}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-800/80">
                  <span className="text-slate-400 font-bold">Pengawas PLN</span>
                  <span className="text-slate-300">{selectedDetail.pengawasPln}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-bold">Target Selesai</span>
                  <span className="text-cyan-400 font-mono font-bold">{selectedDetail.targetSelesai}</span>
                </div>
              </div>

              {selectedDetail.keterangan && (
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                  <div className="text-slate-400 font-bold mb-1">Catatan Teknis Inspeksi:</div>
                  <p className="text-slate-300 italic">{selectedDetail.keterangan}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => {
                    onUpdateKonstruksi({
                      ...selectedDetail,
                      statusProyek: 'Selesai Beroperasi',
                      progresPersen: 100
                    });
                    setSelectedDetail(null);
                  }}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl transition-all shadow-lg flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  Tandai Selesai / Tuntas (100%)
                </button>
                <button
                  onClick={() => openEditModal(selectedDetail)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl transition-all cursor-pointer"
                >
                  Edit Temuan
                </button>
                <button
                  onClick={() => {
                    const itemToDelete = selectedDetail;
                    setSelectedDetail(null);
                    setDeletingItem(itemToDelete);
                  }}
                  className="p-2.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 font-bold rounded-xl transition-all cursor-pointer"
                  title="Hapus Temuan"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Temuan Konstruksi */}
      {deletingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden text-slate-100 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-rose-500/20 text-rose-400 rounded-xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">Hapus Proyek Konstruksi?</h3>
                <p className="text-xs text-slate-400">Data anomali/konstruksi ini akan dihapus permanen.</p>
              </div>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs space-y-1.5 text-slate-300">
              <div><strong className="text-slate-400">Nama Temuan:</strong> {deletingItem.namaProyek}</div>
              <div><strong className="text-slate-400">Penyulang / Tiang:</strong> {deletingItem.penyulang} - {deletingItem.noTiang || '-'}</div>
              <div><strong className="text-slate-400">Kategori:</strong> {deletingItem.kategoriKonstruksi}</div>
              <div><strong className="text-slate-400">Lokasi:</strong> {deletingItem.lokasi}</div>
              <div><strong className="text-slate-400">Status:</strong> {deletingItem.statusProyek} ({deletingItem.progresPersen}%)</div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingItem(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteKonstruksi(deletingItem.id);
                  setDeletingItem(null);
                }}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-rose-900/40 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Hapus Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import File Modal */}
      <ImportKonstruksiModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleBatchImport}
        penyulangList={penyulangList}
      />
    </div>
  );
};
