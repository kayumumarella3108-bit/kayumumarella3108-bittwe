import React, { useState, useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import {
  Trees,
  Search,
  Plus,
  Filter,
  MapPin,
  AlertTriangle,
  CheckCircle2,
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
  Camera,
  RefreshCw,
  Target,
  Eye,
  EyeOff,
  Clock,
  Sparkles,
  Info,
  ChevronDown,
  Tag,
  FileCode,
  Pencil,
  FolderOpen,
  FileSpreadsheet
} from 'lucide-react';
import { PohonGisItem, User, Penyulang, MapLayerItem } from '../../types';
import { ImportPohonModal } from '../modals/ImportPohonModal';
import { readGisFileWithValidation, convertToPohonItems } from '../../utils/gisFileParser';

export const FEEDER_PALETTE = [
  '#f97316', // Orange (Hutumuri / Lateri 1 / ACC)
  '#06b6d4', // Cyan (Allang)
  '#10b981', // Green (Lateri 3 / Wayame 3)
  '#8b5cf6', // Purple
  '#3b82f6', // Blue
  '#ec4899', // Pink
  '#f59e0b', // Amber
  '#14b8a6', // Teal
  '#f43f5e'  // Rose
];

export interface TreeIconOption {
  emoji: string;
  label: string;
  desc: string;
  category: 'pohon' | 'tiang' | 'konstruksi';
  categoryLabel: string;
}

export const TREE_ICON_MAP: Record<string, TreeIconOption> = {
  pohon: { emoji: '🌳', label: 'Pohon Rimbun', desc: 'Trembesi, Mahoni, Sengon, pohon pelindung', category: 'pohon', categoryLabel: 'Pohon & ROW' },
  kelapa: { emoji: '🌴', label: 'Kelapa / Palem', desc: 'Pohon kelapa, pinang, palem raja', category: 'pohon', categoryLabel: 'Pohon & ROW' },
  bambu: { emoji: '🎋', label: 'Bambu & Semak', desc: 'Rumpun bambu & semak belukar', category: 'pohon', categoryLabel: 'Pohon & ROW' },
  leaf: { emoji: '🍃', label: 'Daun / Sulur', desc: 'Rambatan tanaman & sulur di kawat JTM', category: 'pohon', categoryLabel: 'Pohon & ROW' },
  saw: { emoji: '🪚', label: 'Gergaji ROW', desc: 'Target eksekusi tim pemangkasan ROW', category: 'pohon', categoryLabel: 'Pohon & ROW' },
  tiang: { emoji: '🗼', label: 'Tiang JTM / Distribusi', desc: 'Tiang SUTM, Span & Pole 20kV', category: 'tiang', categoryLabel: 'Tiang Listrik' },
  tiang_single: { emoji: '💈', label: 'Tiang Listrik Single', desc: 'Tiang beton 1 level travers', category: 'tiang', categoryLabel: 'Tiang Listrik' },
  tiang_besi: { emoji: '📍', label: 'Tiang Percabangan', desc: 'Tiang ujung, sudut, percabangan', category: 'tiang', categoryLabel: 'Tiang Listrik' },
  pin: { emoji: '📍', label: 'Pin Tagging GPS', desc: 'Titik koordinat tagging acuan lapangan', category: 'tiang', categoryLabel: 'Tiang Listrik' },
  konstruksi: { emoji: '🏗️', label: 'Konstruksi & Travers', desc: 'Crossarm, Isolator, Rekonstruksi JTM', category: 'konstruksi', categoryLabel: 'Konstruksi & Gardu' },
  gardu: { emoji: '⚡', label: 'Gardu Trafo / GTT', desc: 'Trafo distribusi 20kV / Gardu tiang', category: 'konstruksi', categoryLabel: 'Konstruksi & Gardu' },
  gardu_beton: { emoji: '🏢', label: 'Gardu Beton (Kios)', desc: 'Bangunan gardu kios PLN Listrik Pintar', category: 'konstruksi', categoryLabel: 'Konstruksi & Gardu' },
  gardu_cantol: { emoji: '🔌', label: 'Gardu Cantol', desc: 'Gardu trafo gantung / cantol 20kV', category: 'konstruksi', categoryLabel: 'Konstruksi & Gardu' },
  gardu_portal: { emoji: '📐', label: 'Gardu Portal (H-Frame)', desc: 'Konstruksi gardu portal 2 tiang', category: 'konstruksi', categoryLabel: 'Konstruksi & Gardu' },
  crane: { emoji: '🚜', label: 'Alat Berat / Har', desc: 'Mobil Skylift & Tim Har Jaringan', category: 'konstruksi', categoryLabel: 'Konstruksi & Gardu' },
  warning: { emoji: '⚠️', label: 'Bahaya Kritis / Anomali', desc: 'Rawan gangguan kawat / pohon roboh', category: 'konstruksi', categoryLabel: 'Konstruksi & Gardu' }
};

interface PetaPohonViewProps {
  currentUser?: User | null;
  pohonList: PohonGisItem[];
  penyulangList?: Penyulang[];
  layers?: MapLayerItem[];
  onAddPohon: (item: PohonGisItem) => void;
  onImportBatch?: (items: PohonGisItem[]) => void;
  onUpdatePohon: (item: PohonGisItem) => void;
  onDeletePohon: (id: string) => void;
}

export const PetaPohonView: React.FC<PetaPohonViewProps> = ({
  currentUser,
  pohonList,
  penyulangList = [],
  layers = [],
  onAddPohon,
  onImportBatch,
  onUpdatePohon,
  onDeletePohon
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPenyulang, setSelectedPenyulang] = useState<string>('Semua');
  const [selectedBahaya, setSelectedBahaya] = useState<string>('Semua');
  const [selectedStatus, setSelectedStatus] = useState<string>('Semua');
  const [mapStyle, setMapStyle] = useState<'dark' | 'satellite' | 'street'>('dark');
  const [showFeederLayer, setShowFeederLayer] = useState<boolean>(false);
  const [globalIconStyle, setGlobalIconStyle] = useState<string>('default');
  const [activeItemIconMenu, setActiveItemIconMenu] = useState<string | null>(null);
  const [itemIconCategory, setItemIconCategory] = useState<'all' | 'pohon' | 'tiang' | 'konstruksi'>('all');
  const [formIconCategory, setFormIconCategory] = useState<'all' | 'pohon' | 'tiang' | 'konstruksi'>('all');

  // View Mode: 'feeders' (File dataset card list like image.png) vs 'trees' (individual tree item list)
  const [viewMode, setViewMode] = useState<'feeders' | 'trees'>('feeders');

  // Feeder layer customizations: visibility, color, custom name
  const [feederSettings, setFeederSettings] = useState<Record<string, { color?: string; visible?: boolean }>>({});
  const [editingFeeder, setEditingFeeder] = useState<{
    originalName: string;
    name: string;
    color: string;
    iconType?: string;
    itemCount: number;
  } | null>(null);
  const [deletingFeeder, setDeletingFeeder] = useState<{
    name: string;
    itemCount: number;
    items: PohonGisItem[];
  } | null>(null);

  // Quick file upload hidden input ref
  const quickFileInputRef = useRef<HTMLInputElement>(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importToast, setImportToast] = useState<{ message: string; count: number } | null>(null);
  const [editingItem, setEditingItem] = useState<PohonGisItem | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<PohonGisItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<PohonGisItem | null>(null);

  // Form states
  const [formPenyulang, setFormPenyulang] = useState('PASSO');
  const [formSection, setFormSection] = useState('');
  const [formNoTiang, setFormNoTiang] = useState('');
  const [formLokasi, setFormLokasi] = useState('');
  const [formLat, setFormLat] = useState<number>(-3.6280);
  const [formLng, setFormLng] = useState<number>(128.2420);
  const [formJarak, setFormJarak] = useState<'< 1 meter' | '1 - 2.5 meter' | '> 2.5 meter' | 'Menempel Kawat'>('< 1 meter');
  const [formBahaya, setFormBahaya] = useState<'Kritis (Bahaya Padam)' | 'Rawan Sentuh' | 'Aman / Terpangkas' | 'Potensi Roboh'>('Kritis (Bahaya Padam)');
  const [formStatus, setFormStatus] = useState<'Perlu Tebas' | 'Perlu Tebang' | 'Perlu Izin Warga' | 'Perlu Padam' | 'Selesai Pangkas'>('Perlu Tebas');
  const [formJenisPohon, setFormJenisPohon] = useState('');
  const [formJumlah, setFormJumlah] = useState<number>(1);
  const [formIconType, setFormIconType] = useState<NonNullable<PohonGisItem['iconType']>>('pohon');
  const [formTglTemuan, setFormTglTemuan] = useState<string>(new Date().toISOString().split('T')[0]);
  const [formTglEksekusi, setFormTglEksekusi] = useState<string>('');
  const [formPelaksana, setFormPelaksana] = useState('Tim ROW Baguala - Valer Demny');
  const [formKeterangan, setFormKeterangan] = useState('');

  // Map refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markerGroupRef = useRef<L.FeatureGroup | null>(null);
  const feederGroupRef = useRef<L.FeatureGroup | null>(null);
  const markersMapRef = useRef<Record<string, L.Marker>>({});
  const hasInitialFittedRef = useRef(false);

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
      center: [-3.625, 128.245],
      zoom: 13,
      zoomControl: false
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const tile = L.tileLayer(getTileUrl(mapStyle), {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap | Leaflet GIS'
    }).addTo(map);

    tileLayerRef.current = tile;
    feederGroupRef.current = L.featureGroup().addTo(map);
    markerGroupRef.current = L.featureGroup().addTo(map);
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Tile on Style Change
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;
    mapInstanceRef.current.removeLayer(tileLayerRef.current);
    const newTile = L.tileLayer(getTileUrl(mapStyle), { maxZoom: 19 }).addTo(mapInstanceRef.current);
    tileLayerRef.current = newTile;
  }, [mapStyle]);

  // Render Feeder Line Routes (Polyline murni tanpa titik-titik tiang berlebih)
  useEffect(() => {
    if (!mapInstanceRef.current || !feederGroupRef.current) return;
    const fg = feederGroupRef.current;
    fg.clearLayers();

    if (!showFeederLayer || !layers || layers.length === 0) return;

    const activeLayers = (layers || []).filter((layer) => {
      if (!layer) return false;
      if (selectedPenyulang === 'Semua') return layer.visible !== false;
      const layerName = (layer.nama || '').toUpperCase();
      const selP = (selectedPenyulang || '').toUpperCase();
      if (!layerName || !selP) return false;
      return layerName.includes(selP) || selP.includes(layerName);
    });

    activeLayers.forEach((layer) => {
      if (!layer.coordinates || layer.coordinates.length < 2) return;

      const layerColor = layer.color || '#38bdf8';

      // Polyline for Feeder Line (Clean line without dots)
      const line = L.polyline(layer.coordinates, {
        color: layerColor,
        weight: 3.5,
        opacity: 0.85,
        dashArray: '6, 6'
      }).addTo(fg);

      line.bindTooltip(`⚡ Jalur JTM: ${layer.nama} (${layer.tiangCount || layer.coordinates.length} Tiang)`, {
        sticky: true,
        className: 'custom-feeder-tooltip'
      });
    });
  }, [layers, showFeederLayer, selectedPenyulang]);

  // Feeder Groups computation (grouping pohonList by Feeder/Layer dataset)
  const feederGroups = useMemo(() => {
    const groups: Record<string, PohonGisItem[]> = {};
    pohonList.forEach((item) => {
      const key = (item.penyulang || 'LAINNYA').trim();
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });

    const allFeederNames = Object.keys(groups);

    return allFeederNames.map((name, index) => {
      const items = groups[name] || [];
      const defaultColor = FEEDER_PALETTE[index % FEEDER_PALETTE.length];
      const setting = feederSettings[name];
      const color = setting?.color || defaultColor;
      const visible = setting?.visible !== false;
      const count = items.length;
      const kritisCount = items.filter(
        (p) => p.tingkatBahaya === 'Kritis (Bahaya Padam)' || p.jarakKeJaringan === '< 1 meter' || p.jarakKeJaringan === 'Menempel Kawat'
      ).length;
      const selesaiCount = items.filter((p) => p.statusEksekusi === 'Selesai Pangkas').length;

      // Extract last updated date
      let lastDate = '15/8/2026';
      if (items.length > 0) {
        const dates = items
          .map((i) => i.tglEksekusi || i.tglTemuan)
          .filter(Boolean)
          .sort()
          .reverse();
        if (dates.length > 0 && dates[0]) {
          const parts = dates[0].split('-');
          if (parts.length === 3) {
            lastDate = `${parseInt(parts[2], 10)}/${parseInt(parts[1], 10)}/${parts[0]}`;
          } else {
            lastDate = dates[0];
          }
        }
      }

      return {
        name,
        items,
        count,
        kritisCount,
        selesaiCount,
        color,
        visible,
        lastDate
      };
    });
  }, [pohonList, feederSettings]);

  // Filtered Feeder Groups for sidebar search
  const filteredFeederGroups = feederGroups.filter((group) => {
    const matchSearch = group.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchPenyulang = selectedPenyulang === 'Semua' || group.name === selectedPenyulang;
    return matchSearch && matchPenyulang;
  });

  // Toggle Feeder visibility on map
  const toggleFeederVisibility = (feederName: string) => {
    setFeederSettings((prev) => {
      const current = prev[feederName]?.visible !== false;
      return {
        ...prev,
        [feederName]: {
          ...(prev[feederName] || {}),
          visible: !current
        }
      };
    });
  };

  // Center and fit bounds to an entire Feeder
  const handleLocateFeeder = (group: { name: string; items: PohonGisItem[] }) => {
    if (!mapInstanceRef.current || group.items.length === 0) return;
    const latLngs = group.items
      .filter((it) => it.lat && it.lng)
      .map((it) => [it.lat, it.lng] as [number, number]);

    if (latLngs.length > 0) {
      const bounds = L.latLngBounds(latLngs);
      if (bounds.isValid()) {
        mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
      }
    }
  };

  // Open Edit Feeder Modal
  const openEditFeederModal = (group: { name: string; color: string; count: number; items: PohonGisItem[] }) => {
    const commonIcon = group.items[0]?.iconType || 'pohon';
    setEditingFeeder({
      originalName: group.name,
      name: group.name,
      color: group.color,
      iconType: commonIcon,
      itemCount: group.count
    });
  };

  // Save Feeder Edit (Rename feeder, change color, mass change icons, status)
  const handleSaveFeederEdit = (
    originalName: string,
    newName: string,
    newColor: string,
    newIconType?: string,
    bulkStatus?: string
  ) => {
    const sanitizedNewName = (newName || originalName).trim();

    // Update settings
    setFeederSettings((prev) => {
      const updated = { ...prev };
      delete updated[originalName];
      updated[sanitizedNewName] = {
        color: newColor,
        visible: prev[originalName]?.visible !== false
      };
      return updated;
    });

    // Update all matching tree items
    pohonList.forEach((item) => {
      if (item.penyulang === originalName) {
        const updatedItem: PohonGisItem = {
          ...item,
          penyulang: sanitizedNewName,
          ...(newIconType ? { iconType: newIconType as any } : {}),
          ...(bulkStatus === 'Selesai Pangkas'
            ? {
                statusEksekusi: 'Selesai Pangkas',
                tingkatBahaya: 'Aman / Terpangkas',
                jarakKeJaringan: '> 2.5 meter',
                tglEksekusi: new Date().toISOString().split('T')[0]
              }
            : bulkStatus === 'Perlu Tebas'
            ? {
                statusEksekusi: 'Perlu Tebas',
                tingkatBahaya: 'Rawan Sentuh',
                jarakKeJaringan: '1 - 2.5 meter',
                tglEksekusi: undefined
              }
            : {})
        };
        onUpdatePohon(updatedItem);
      }
    });

    setImportToast({
      message: `Berhasil memperbarui data dataset Feeder ${sanitizedNewName}.`,
      count: editingFeeder?.itemCount || 1
    });
    setEditingFeeder(null);
    setTimeout(() => {
      setImportToast(null);
    }, 4000);
  };

  // Confirm Delete Feeder (Deletes all trees in that feeder)
  const handleDeleteFeederConfirm = () => {
    if (!deletingFeeder) return;
    deletingFeeder.items.forEach((item) => {
      onDeletePohon(item.id);
    });

    setImportToast({
      message: `Berhasil menghapus seluruh ${deletingFeeder.itemCount} titik pohon pada Feeder ${deletingFeeder.name}.`,
      count: deletingFeeder.itemCount
    });
    setDeletingFeeder(null);
    setTimeout(() => {
      setImportToast(null);
    }, 4000);
  };

  // Quick Direct KML / KMZ Upload Trigger
  const triggerQuickImport = (accept = '.kml,.kmz,.xml,.zip') => {
    if (quickFileInputRef.current) {
      quickFileInputRef.current.accept = accept;
      quickFileInputRef.current.click();
    }
  };

  // Quick Direct File Change Handler
  const handleQuickFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    let totalImported = 0;
    const allImportedItems: PohonGisItem[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const report = await readGisFileWithValidation(file);
        if (report.isValid && report.validCount > 0) {
          const feederName = file.name.replace(/\.[^/.]+$/, '').toUpperCase();
          const items = convertToPohonItems(report.features, feederName, 'pohon');

          if (items.length > 0) {
            allImportedItems.push(...items);
            totalImported += items.length;

            // Auto assign a distinct color for this feeder
            const existingColor = feederSettings[feederName]?.color;
            if (!existingColor) {
              const assignedColor = FEEDER_PALETTE[Object.keys(feederSettings).length % FEEDER_PALETTE.length];
              setFeederSettings((prev) => ({
                ...prev,
                [feederName]: { color: assignedColor, visible: true }
              }));
            }
          }
        }
      } catch (err) {
        console.error('Error importing quick file:', file.name, err);
      }
    }

    if (allImportedItems.length > 0) {
      if (onImportBatch) {
        onImportBatch(allImportedItems);
      } else {
        allImportedItems.forEach((it) => onAddPohon(it));
      }

      setImportToast({
        message: `✓ Berhasil mengimpor ${totalImported} titik pohon dari ${files.length} file.`,
        count: totalImported
      });

      // Fit bounds to newly imported points
      setTimeout(() => {
        if (mapInstanceRef.current && allImportedItems.length > 0) {
          const latLngs = allImportedItems
            .filter((it) => it.lat && it.lng)
            .map((it) => [it.lat, it.lng] as [number, number]);
          if (latLngs.length > 0) {
            const bounds = L.latLngBounds(latLngs);
            if (bounds.isValid()) {
              mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
            }
          }
        }
      }, 300);

      setTimeout(() => {
        setImportToast(null);
      }, 5000);
    }

    if (quickFileInputRef.current) {
      quickFileInputRef.current.value = '';
    }
  };

  // Filtered List
  const filteredList = pohonList.filter((item) => {
    // Check feeder visibility
    const feederSetting = feederSettings[item.penyulang];
    if (feederSetting && feederSetting.visible === false) {
      return false;
    }

    const matchSearch =
      (item.lokasi || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.penyulang || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.noTiangOrSpan || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.jenisPohon || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.keterangan || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchPenyulang = selectedPenyulang === 'Semua' || item.penyulang === selectedPenyulang;
    const matchBahaya = selectedBahaya === 'Semua' || item.tingkatBahaya === selectedBahaya;
    const matchStatus = selectedStatus === 'Semua' || item.statusEksekusi === selectedStatus;

    return matchSearch && matchPenyulang && matchBahaya && matchStatus;
  });

  // Calculate statistics
  const totalTitik = pohonList.length;
  const totalKritis = pohonList.filter(
    (p) => p.tingkatBahaya === 'Kritis (Bahaya Padam)' || p.jarakKeJaringan === '< 1 meter' || p.jarakKeJaringan === 'Menempel Kawat'
  ).length;
  const totalSelesai = pohonList.filter((p) => p.statusEksekusi === 'Selesai Pangkas').length;

  // Focus map to all markers
  const handleFocusMap = () => {
    if (!mapInstanceRef.current || !markerGroupRef.current) return;
    const bounds = markerGroupRef.current.getBounds();
    if (bounds.isValid()) {
      mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    }
  };

  // Center and open popup for a specific tree item
  const handleLocateTree = (item: PohonGisItem) => {
    if (!mapInstanceRef.current || !item.lat || !item.lng) return;
    mapInstanceRef.current.setView([item.lat, item.lng], 17, { animate: true });
    const marker = markersMapRef.current[item.id];
    if (marker) {
      setTimeout(() => {
        marker.openPopup();
      }, 300);
    }
  };

  // Render Markers on Map
  useEffect(() => {
    if (!mapInstanceRef.current || !markerGroupRef.current) return;
    const mg = markerGroupRef.current;
    mg.clearLayers();
    markersMapRef.current = {};

    filteredList.forEach((item) => {
      if (!item.lat || !item.lng) return;

      const isDone = item.statusEksekusi === 'Selesai Pangkas';
      const fSetting = feederSettings[item.penyulang];
      const feederThemeColor = fSetting?.color || '#10B981';

      // Determine color based on hazard, status, and feeder theme
      let markerColor = feederThemeColor;
      let pulseEffect = '';
      if (isDone) {
        markerColor = '#10B981'; // Emerald
      } else if (item.tingkatBahaya === 'Kritis (Bahaya Padam)' || item.jarakKeJaringan === '< 1 meter' || item.jarakKeJaringan === 'Menempel Kawat') {
        markerColor = '#EF4444'; // Red
        pulseEffect = 'animate-ping';
      } else if (item.tingkatBahaya === 'Potensi Roboh') {
        markerColor = '#F97316'; // Orange
      } else if (item.tingkatBahaya === 'Rawan Sentuh') {
        markerColor = '#F59E0B'; // Amber
      }

      const iconKey = globalIconStyle !== 'default' ? globalIconStyle : (item.iconType || 'pohon');
      const iconInfo = TREE_ICON_MAP[iconKey] || TREE_ICON_MAP.pohon;

      const customIcon = L.divIcon({
        className: 'custom-tree-pin',
        html: `
          <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
            ${!isDone && item.tingkatBahaya.includes('Kritis') ? `<div style="position: absolute; width: 100%; height: 100%; border-radius: 50%; background-color: ${markerColor}; opacity: 0.4;" class="${pulseEffect}"></div>` : ''}
            <div style="width: 30px; height: 30px; border-radius: 50%; background: ${isDone ? '#059669' : '#0f172a'}; border: 2.5px solid ${markerColor}; box-shadow: 0 4px 10px rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; color: #ffffff;">
              ${isDone 
                ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`
                : `<span style="font-size: 15px; line-height: 1; user-select: none;">${iconInfo.emoji}</span>`
              }
            </div>
            <div style="position: absolute; bottom: -8px; background: #0f172a; color: ${isDone ? '#34d399' : '#f8fafc'}; font-size: 8.5px; font-weight: 800; padding: 1px 5px; border-radius: 4px; border: 1px solid ${markerColor}; white-space: nowrap; box-shadow: 0 2px 4px rgba(0,0,0,0.5);">
              ${isDone ? `✓ ${item.noTiangOrSpan || item.penyulang}` : (item.noTiangOrSpan || item.penyulang)}
            </div>
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
        popupAnchor: [0, -17]
      });

      const marker = L.marker([item.lat, item.lng], { icon: customIcon }).addTo(mg);
      markersMapRef.current[item.id] = marker;
      markersMapRef.current[item.id] = marker;

      // Popup Content (Clean Tree Information with Quick Categorized Icon Switcher)
      const currentIconKey = item.iconType || 'pohon';
      const pohonIcons = Object.entries(TREE_ICON_MAP).filter(([_, opt]) => opt.category === 'pohon');
      const tiangIcons = Object.entries(TREE_ICON_MAP).filter(([_, opt]) => opt.category === 'tiang');
      const konstruksiIcons = Object.entries(TREE_ICON_MAP).filter(([_, opt]) => opt.category === 'konstruksi');

      const renderIconBtnGroup = (icons: [string, TreeIconOption][]) => {
        return icons.map(([key, opt]) => `
          <button 
            type="button"
            onclick="window.quickChangeIcon('${item.id}', '${key}')" 
            style="min-width: 32px; height: 32px; border-radius: 6px; border: 1.5px solid ${currentIconKey === key ? '#059669' : '#e2e8f0'}; background: ${currentIconKey === key ? '#d1fae5' : '#ffffff'}; font-size: 15px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; transition: all 0.2s; box-shadow: ${currentIconKey === key ? '0 0 0 2px rgba(5,150,105,0.3)' : 'none'};"
            title="${opt.label} - ${opt.desc}">
            ${opt.emoji}
          </button>
        `).join('');
      };

      const popupHtml = `
        <div style="font-family: inherit; width: 280px; padding: 2px; color: #1e293b;">
          <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 8px;">
            <div style="font-size: 13px; font-weight: 800; color: #0f172a; display: flex; align-items: center; gap: 5px;">
              <span style="font-size: 18px;">${iconInfo.emoji}</span>
              <span>${item.penyulang} - ${item.noTiangOrSpan}</span>
            </div>
            <span style="font-size: 9.5px; font-weight: 700; background: ${markerColor}20; color: ${markerColor}; border: 1px solid ${markerColor}50; padding: 2px 6px; border-radius: 4px;">
              ${isDone ? '✓ Terpangkas' : item.tingkatBahaya}
            </span>
          </div>
          
          <div style="font-size: 11.5px; line-height: 1.5; color: #334155;">
            <div><strong>📍 Lokasi:</strong> ${item.lokasi}</div>
            <div><strong>🌳 Jenis:</strong> ${item.jenisPohon} (${item.jumlahPohon || 1} Pohon)</div>
            <div><strong>⚡ Status:</strong> <span style="font-weight: 700; color: ${isDone ? '#059669' : '#0284c7'};">${item.statusEksekusi}</span></div>
            <div><strong>📅 Temuan:</strong> ${item.tglTemuan}</div>
            <div><strong>👷 Pelaksana:</strong> ${item.pelaksana || '-'}</div>
            ${item.keterangan ? `<div style="margin-top: 5px; padding: 5px; background: #f1f5f9; border-radius: 4px; font-style: italic; color: #64748b; font-size: 10.5px;">${item.keterangan}</div>` : ''}
          </div>

          <!-- Quick Categorized Icon Switcher inside Leaflet Popup -->
          <div style="margin-top: 10px; padding-top: 8px; border-top: 1px dashed #cbd5e1;">
            <div style="font-size: 10.5px; font-weight: 800; color: #334155; margin-bottom: 6px; display: flex; align-items: center; justify-content: space-between;">
              <span>🎨 Ganti Ikon Tagging:</span>
              <span style="color: #059669; font-weight: 800; font-size: 10px; background: #ecfdf5; padding: 1px 6px; border-radius: 4px; border: 1px solid #a7f3d0;">
                ${iconInfo.emoji} ${iconInfo.label}
              </span>
            </div>

            <div style="font-size: 9.5px; font-weight: 700; color: #64748b; margin-top: 4px; margin-bottom: 3px;">🌳 Pohon & ROW:</div>
            <div style="display: flex; gap: 4px; flex-wrap: wrap; margin-bottom: 6px;">
              ${renderIconBtnGroup(pohonIcons)}
            </div>

            <div style="font-size: 9.5px; font-weight: 700; color: #64748b; margin-top: 4px; margin-bottom: 3px;">🗼 Tiang Listrik:</div>
            <div style="display: flex; gap: 4px; flex-wrap: wrap; margin-bottom: 6px;">
              ${renderIconBtnGroup(tiangIcons)}
            </div>

            <div style="font-size: 9.5px; font-weight: 700; color: #64748b; margin-top: 4px; margin-bottom: 3px;">🏗️ Konstruksi & Gardu:</div>
            <div style="display: flex; gap: 4px; flex-wrap: wrap;">
              ${renderIconBtnGroup(konstruksiIcons)}
            </div>
          </div>

          <div style="margin-top: 10px; display: flex; gap: 5px;">
            <button onclick="window.viewPohonDetail('${item.id}')" style="flex: 1; background: #0284c7; color: white; border: none; padding: 6px 8px; border-radius: 6px; font-size: 11px; font-weight: 700; cursor: pointer;">
              🔍 Detail / Ubah
            </button>
            ${isDone 
              ? `<button onclick="window.reopenPohon('${item.id}')" style="background: #e11d48; color: white; border: none; padding: 6px 8px; border-radius: 6px; font-size: 11px; font-weight: 700; cursor: pointer;" title="Buka kembali">
                  ↩ Buka
                 </button>`
              : `<button onclick="window.quickDonePohon('${item.id}')" style="background: #059669; color: white; border: none; padding: 6px 8px; border-radius: 6px; font-size: 11px; font-weight: 700; cursor: pointer;">
                  ✓ Selesai
                 </button>`
            }
            <button onclick="window.deletePohonPrompt('${item.id}')" style="background: #ef4444; color: white; border: none; padding: 6px 8px; border-radius: 6px; font-size: 11px; font-weight: 700; cursor: pointer;" title="Hapus titik pohon">
              🗑️
            </button>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, {
        maxWidth: 285,
        className: 'custom-pohon-leaflet-popup'
      });
    });

    if (filteredList.length > 0 && !hasInitialFittedRef.current) {
      const bounds = mg.getBounds();
      if (bounds.isValid()) {
        mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
        hasInitialFittedRef.current = true;
      }
    }
  }, [filteredList, globalIconStyle]);

  // Window callbacks for Leaflet Popups
  useEffect(() => {
    (window as any).viewPohonDetail = (id: string) => {
      const found = pohonList.find((p) => p.id === id);
      if (found) setSelectedDetail(found);
    };

    (window as any).deletePohonPrompt = (id: string) => {
      const found = pohonList.find((p) => p.id === id);
      if (found) setDeletingItem(found);
    };

    (window as any).quickChangeIcon = (id: string, newIconKey: string) => {
      const found = pohonList.find((p) => p.id === id);
      if (found) {
        onUpdatePohon({
          ...found,
          iconType: newIconKey as any
        });
      }
    };

    (window as any).quickDonePohon = (id: string) => {
      const found = pohonList.find((p) => p.id === id);
      if (found) {
        onUpdatePohon({
          ...found,
          statusEksekusi: 'Selesai Pangkas',
          tingkatBahaya: 'Aman / Terpangkas',
          jarakKeJaringan: '> 2.5 meter',
          tglEksekusi: new Date().toISOString().split('T')[0]
        });
      }
    };

    (window as any).reopenPohon = (id: string) => {
      const found = pohonList.find((p) => p.id === id);
      if (found) {
        onUpdatePohon({
          ...found,
          statusEksekusi: 'Perlu Tebas',
          tingkatBahaya: 'Rawan Sentuh',
          jarakKeJaringan: '1 - 2.5 meter',
          tglEksekusi: undefined
        });
      }
    };

    return () => {
      delete (window as any).viewPohonDetail;
      delete (window as any).deletePohonPrompt;
      delete (window as any).quickChangeIcon;
      delete (window as any).quickDonePohon;
      delete (window as any).reopenPohon;
    };
  }, [pohonList, onUpdatePohon]);

  // Form Reset / Load Editing
  const openAddModal = () => {
    setEditingItem(null);
    setFormPenyulang(penyulangList[0]?.nama || 'PASSO');
    setFormSection('');
    setFormNoTiang('');
    setFormLokasi('');
    setFormLat(-3.6280);
    setFormLng(128.2420);
    setFormJarak('< 1 meter');
    setFormBahaya('Kritis (Bahaya Padam)');
    setFormStatus('Perlu Tebas');
    setFormJenisPohon('');
    setFormJumlah(1);
    setFormIconType('pohon');
    setFormTglTemuan(new Date().toISOString().split('T')[0]);
    setFormTglEksekusi('');
    setFormPelaksana('Tim ROW Baguala - Valer Demny');
    setFormKeterangan('');
    setIsModalOpen(true);
  };

  const openEditModal = (item: PohonGisItem) => {
    setEditingItem(item);
    setFormPenyulang(item.penyulang);
    setFormSection(item.section || '');
    setFormNoTiang(item.noTiangOrSpan || '');
    setFormLokasi(item.lokasi || '');
    setFormLat(item.lat);
    setFormLng(item.lng);
    setFormJarak(item.jarakKeJaringan);
    setFormBahaya(item.tingkatBahaya);
    setFormStatus(item.statusEksekusi);
    setFormJenisPohon(item.jenisPohon);
    setFormJumlah(item.jumlahPohon || 1);
    setFormIconType(item.iconType || 'pohon');
    setFormTglTemuan(item.tglTemuan);
    setFormTglEksekusi(item.tglEksekusi || '');
    setFormPelaksana(item.pelaksana || 'Tim ROW Baguala');
    setFormKeterangan(item.keterangan || '');
    setIsModalOpen(true);
    setSelectedDetail(null);
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();

    const payload: PohonGisItem = {
      id: editingItem ? editingItem.id : `pohon_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      penyulang: formPenyulang,
      section: formSection || undefined,
      noTiangOrSpan: formNoTiang,
      lokasi: formLokasi,
      lat: Number(formLat),
      lng: Number(formLng),
      jarakKeJaringan: formJarak,
      tingkatBahaya: formBahaya,
      statusEksekusi: formStatus,
      jenisPohon: formJenisPohon || 'Pohon Campuran',
      jumlahPohon: Number(formJumlah) || 1,
      iconType: formIconType,
      tglTemuan: formTglTemuan,
      tglEksekusi: formStatus === 'Selesai Pangkas' ? (formTglEksekusi || new Date().toISOString().split('T')[0]) : undefined,
      pelaksana: formPelaksana,
      keterangan: formKeterangan,
      fotoTemuan: editingItem?.fotoTemuan,
      fotoEksekusi: editingItem?.fotoEksekusi
    };

    if (editingItem) {
      onUpdatePohon(payload);
    } else {
      onAddPohon(payload);
    }

    setIsModalOpen(false);
  };

  // Batch change icon for all filtered items
  const handleBatchApplyIcon = (newIcon: NonNullable<PohonGisItem['iconType']>) => {
    filteredList.forEach((item) => {
      onUpdatePohon({
        ...item,
        iconType: newIcon
      });
    });
    setGlobalIconStyle('default');
    setImportToast({
      message: `Berhasil mengubah icon ${filteredList.length} titik pohon menjadi ${TREE_ICON_MAP[newIcon]?.emoji} ${TREE_ICON_MAP[newIcon]?.label}.`,
      count: filteredList.length
    });
    setTimeout(() => {
      setImportToast(null);
    }, 4000);
  };

  // Export CSV
  const handleExportCsv = () => {
    const headers = [
      'ID',
      'Penyulang',
      'Section',
      'No Tiang / Span',
      'Lokasi',
      'Latitude',
      'Longitude',
      'Jenis Pohon',
      'Jumlah',
      'Jarak Jaringan',
      'Tingkat Bahaya',
      'Status Eksekusi',
      'Tgl Temuan',
      'Tgl Eksekusi',
      'Pelaksana',
      'Keterangan'
    ];

    const rows = filteredList.map((p) => [
      p.id,
      p.penyulang,
      p.section || '-',
      p.noTiangOrSpan || '-',
      `"${(p.lokasi || '').replace(/"/g, '""')}"`,
      p.lat,
      p.lng,
      `"${(p.jenisPohon || '').replace(/"/g, '""')}"`,
      p.jumlahPohon || 1,
      p.jarakKeJaringan,
      p.tingkatBahaya,
      p.statusEksekusi,
      p.tglTemuan,
      p.tglEksekusi || '-',
      `"${(p.pelaksana || '').replace(/"/g, '""')}"`,
      `"${(p.keterangan || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Rekap_GIS_Peta_Pohon_ROW_PLN_Baguala_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="relative w-full h-[calc(100vh-3.5rem)] flex overflow-hidden bg-slate-50 font-sans">
      {/* Hidden File Input for Quick .KML / .KMZ direct import */}
      <input
        type="file"
        ref={quickFileInputRef}
        onChange={handleQuickFileChange}
        multiple
        className="hidden"
      />

      {/* Left Control Sidebar - matching PetaPenyulang style and screenshot */}
      <div className="w-80 md:w-96 bg-white/95 backdrop-blur-xl border-r border-slate-200 flex flex-col justify-between shrink-0 z-10 shadow-lg overflow-hidden">
        {/* Panel Header */}
        <div className="p-4 border-b border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Trees className="w-4 h-4 text-emerald-600" />
              PETA TITIK POHON & ROW
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px]">
              {filteredList.length} Titik
            </span>
          </div>

          {/* Action Import Buttons (3 columns: + Impor, .KML, .KMZ) */}
          <div className="grid grid-cols-3 gap-1.5">
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer shadow-sm shadow-emerald-500/20"
              title="Upload File Format KML, KMZ, atau CSV dengan Validasi Lengkap"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>+ Impor</span>
            </button>
            <button
              onClick={() => triggerQuickImport('.kml,.xml')}
              className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
              title="Impor Langsung File .KML"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" />
              <span>.KML</span>
            </button>
            <button
              onClick={() => triggerQuickImport('.kmz,.zip')}
              className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
              title="Impor Langsung File .KMZ (Google Earth)"
            >
              <Layers className="w-3.5 h-3.5 text-amber-600" />
              <span>.KMZ</span>
            </button>
          </div>

          {/* Quick Counter Badges */}
          <div className="grid grid-cols-3 gap-1.5 text-center">
            <div className="bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-1">
              <div className="text-[10px] text-slate-500 font-semibold">Total Feeder</div>
              <div className="text-xs font-black text-slate-800">{feederGroups.length}</div>
            </div>
            <div className="bg-rose-50 border border-rose-200 rounded-lg py-1.5 px-1">
              <div className="text-[10px] text-rose-600 font-semibold">Kritis</div>
              <div className="text-xs font-black text-rose-700">{totalKritis}</div>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg py-1.5 px-1">
              <div className="text-[10px] text-emerald-600 font-semibold">Selesai</div>
              <div className="text-xs font-black text-emerald-700">{totalSelesai}</div>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari file feeder import / pohon..."
              className="w-full pl-9 pr-7 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Dropdowns */}
          <div className="grid grid-cols-2 gap-1.5 text-xs">
            <select
              value={selectedPenyulang}
              onChange={(e) => setSelectedPenyulang(e.target.value)}
              className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-[11px] font-bold focus:outline-none focus:border-emerald-500"
            >
              <option value="Semua">Semua Feeder</option>
              {Array.from(new Set(pohonList.map((p) => p.penyulang))).map((pName) => (
                <option key={pName} value={pName}>
                  {pName}
                </option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-[11px] font-bold focus:outline-none focus:border-emerald-500"
            >
              <option value="Semua">Semua Status</option>
              <option value="Perlu Tebas">Perlu Tebas</option>
              <option value="Perlu Tebang">Perlu Tebang</option>
              <option value="Perlu Izin Warga">Perlu Izin Warga</option>
              <option value="Perlu Padam">Perlu Padam</option>
              <option value="Selesai Pangkas">Selesai Pangkas</option>
            </select>
          </div>

          {/* Section Subheader with Subtitle & Import KML/KMZ button */}
          <div className="flex items-center justify-between pt-1 border-t border-slate-100">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-emerald-600" />
              PETA POHON IMPORT ({filteredFeederGroups.length} FILE)
            </span>
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-md transition-colors cursor-pointer flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              <span>Impor KML/KMZ</span>
            </button>
          </div>

          {/* View Mode Switcher Tabs */}
          <div className="grid grid-cols-2 p-0.5 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setViewMode('feeders')}
              className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                viewMode === 'feeders'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-emerald-600" />
              <span>Group Feeder ({filteredFeederGroups.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('trees')}
              className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                viewMode === 'trees'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Trees className="w-3.5 h-3.5 text-emerald-600" />
              <span>Titik Pohon ({filteredList.length})</span>
            </button>
          </div>
        </div>

        {/* Sidebar Content (Feeders Cards vs Individual Tree List) */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {viewMode === 'feeders' ? (
            /* FEEDER CARDS VIEW (Matching the provided UI screenshot) */
            filteredFeederGroups.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <Layers className="w-6 h-6" />
                </div>
                <p>Belum ada file dataset feeder pohon yang diimpor.</p>
                <button
                  onClick={() => setIsImportModalOpen(true)}
                  className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold shadow-xs hover:bg-emerald-700 transition-all cursor-pointer"
                >
                  + Impor KML / KMZ Sekarang
                </button>
              </div>
            ) : (
              filteredFeederGroups.map((group) => {
                return (
                  <div
                    key={group.name}
                    className={`p-2.5 rounded-xl border transition-all flex items-center justify-between gap-2 shadow-xs ${
                      group.visible
                        ? 'bg-white border-slate-200 hover:border-slate-300'
                        : 'bg-slate-50/60 border-slate-200/60 opacity-60'
                    }`}
                  >
                    {/* Left: Checkbox, Eye, Color Indicator, Feeder Name & Subtitle */}
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        checked={group.visible}
                        onChange={() => toggleFeederVisibility(group.name)}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer shrink-0"
                        title={group.visible ? 'Sembunyikan dari peta' : 'Tampilkan di peta'}
                      />

                      {/* Eye Toggle */}
                      <button
                        type="button"
                        onClick={() => toggleFeederVisibility(group.name)}
                        className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors cursor-pointer shrink-0"
                        title={group.visible ? 'Sembunyikan layer' : 'Tampilkan layer'}
                      >
                        {group.visible ? (
                          <Eye className="w-3.5 h-3.5 text-slate-500" />
                        ) : (
                          <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                        )}
                      </button>

                      {/* Color Circle Dot (Click to customize) */}
                      <button
                        type="button"
                        onClick={() => openEditFeederModal(group)}
                        className="w-4 h-4 rounded-full border-2 border-white shadow-xs cursor-pointer shrink-0 transition-transform hover:scale-125"
                        style={{ backgroundColor: group.color }}
                        title="Klik untuk mengubah warna & nama feeder"
                      />

                      {/* Feeder Name & Subtitle Info */}
                      <div className="min-w-0 flex-1">
                        <h3 className="text-xs font-bold text-slate-900 truncate leading-tight flex items-center gap-1.5">
                          <span>{group.name}</span>
                          {group.kritisCount > 0 && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-rose-100 text-rose-700 shrink-0">
                              {group.kritisCount} Kritis
                            </span>
                          )}
                        </h3>
                        <p className="text-[10.5px] text-slate-500 font-medium truncate mt-0.5">
                          {group.count} Titik Tiang • {group.lastDate}
                        </p>
                      </div>
                    </div>

                    {/* Right Action Icons: Edit, Focus, Delete (matching image.png) */}
                    <div className="flex items-center gap-1 shrink-0">
                      {/* Edit Feeder */}
                      <button
                        type="button"
                        onClick={() => openEditFeederModal(group)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-blue-600 transition-colors cursor-pointer"
                        title="Edit nama, warna & icon feeder ini"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Focus Feeder on Map */}
                      <button
                        type="button"
                        onClick={() => handleLocateFeeder(group)}
                        className="p-1.5 rounded-lg hover:bg-emerald-50 text-slate-500 hover:text-emerald-700 transition-colors cursor-pointer"
                        title="Fokuskan tampilan peta ke seluruh titik feeder ini"
                      >
                        <Target className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete Feeder */}
                      <button
                        type="button"
                        onClick={() =>
                          setDeletingFeeder({
                            name: group.name,
                            itemCount: group.count,
                            items: group.items
                          })
                        }
                        className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                        title="Hapus seluruh titik feeder ini"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )
          ) : (
            /* INDIVIDUAL TREE LIST VIEW */
            filteredList.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                Tidak ada titik pohon yang cocok dengan pencarian / filter.
              </div>
            ) : (
              filteredList.map((item) => {
                const isDone = item.statusEksekusi === 'Selesai Pangkas';
                const isKritis = item.tingkatBahaya === 'Kritis (Bahaya Padam)' || item.jarakKeJaringan === '< 1 meter';
                const currentIcon = TREE_ICON_MAP[item.iconType || 'pohon'] || TREE_ICON_MAP.pohon;

                return (
                  <div
                    key={item.id}
                    className={`p-2.5 rounded-xl border transition-all flex flex-col gap-2 ${
                      isDone
                        ? 'bg-emerald-50/40 border-emerald-200/80 hover:border-emerald-300'
                        : isKritis
                        ? 'bg-rose-50/40 border-rose-200 hover:border-rose-300'
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    } shadow-xs`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5 min-w-0">
                        {/* Status & Interactive Icon Indicator */}
                        <div className="relative shrink-0 pt-0.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveItemIconMenu(activeItemIconMenu === item.id ? null : item.id);
                            }}
                            className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-white shadow-xs hover:bg-emerald-50 transition-all cursor-pointer border border-slate-200 hover:border-emerald-400"
                            title="Klik untuk ganti icon titik ini secara cepat"
                          >
                            <span className="text-lg leading-none">{currentIcon.emoji}</span>
                            <div
                              className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-white ${
                                isDone
                                  ? 'bg-emerald-500 ring-1 ring-emerald-200'
                                  : isKritis
                                  ? 'bg-rose-500 ring-1 ring-rose-200 animate-pulse'
                                  : item.tingkatBahaya === 'Potensi Roboh'
                                  ? 'bg-orange-500'
                                  : 'bg-amber-500'
                              }`}
                            />
                          </button>
                        </div>

                        {/* Text Details */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h3 className="text-xs font-bold text-slate-900 truncate leading-tight">
                              {item.penyulang} - {item.noTiangOrSpan}
                            </h3>
                            {isDone && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 bg-emerald-100 text-emerald-700 rounded">
                                Selesai
                              </span>
                            )}
                          </div>
                          <p className="text-[10.5px] text-slate-600 font-medium truncate mt-0.5">
                            {item.jenisPohon} {item.jumlahPohon && item.jumlahPohon > 1 ? `(${item.jumlahPohon} Pohon)` : ''}
                          </p>
                          <p className="text-[9.5px] text-slate-400 truncate">
                            📍 {item.lokasi}
                          </p>
                        </div>
                      </div>

                      {/* Actions: Locate, Toggle Done, Edit, Delete */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleLocateTree(item)}
                          className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-600 hover:text-emerald-700 transition-colors cursor-pointer"
                          title="Fokus ke Titik Peta"
                        >
                          <Target className="w-3.5 h-3.5" />
                        </button>
                        
                        {isDone ? (
                          <button
                            onClick={() => {
                              onUpdatePohon({
                                ...item,
                                statusEksekusi: 'Perlu Tebas',
                                tingkatBahaya: 'Rawan Sentuh',
                                jarakKeJaringan: '1 - 2.5 meter',
                                tglEksekusi: undefined
                              });
                            }}
                            className="p-1.5 rounded-lg hover:bg-rose-100 text-emerald-600 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Buka kembali (Perlu Tebas Ulang)"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              onUpdatePohon({
                                ...item,
                                statusEksekusi: 'Selesai Pangkas',
                                tingkatBahaya: 'Aman / Terpangkas',
                                jarakKeJaringan: '> 2.5 meter',
                                tglEksekusi: new Date().toISOString().split('T')[0]
                              });
                            }}
                            className="p-1.5 rounded-lg hover:bg-emerald-100 text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer"
                            title="Tandai Selesai Pangkas"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          onClick={() => openEditModal(item)}
                          className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-blue-600 transition-colors cursor-pointer"
                          title="Edit Data Pohon"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => setDeletingItem(item)}
                          className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                          title="Hapus Titik Pohon"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Interactive Icon Selection Button & Popover Trigger */}
                    <div className="relative pt-1 border-t border-slate-200/60 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveItemIconMenu(activeItemIconMenu === item.id ? null : item.id);
                        }}
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-white hover:bg-emerald-50 text-[10px] font-bold text-slate-700 hover:text-emerald-800 border border-slate-200 hover:border-emerald-300 transition-all cursor-pointer shadow-2xs"
                        title="Ganti ikon tagging titik ini"
                      >
                        <span className="text-xs">{currentIcon.emoji}</span>
                        <span>Ikon: {currentIcon.label}</span>
                        <ChevronDown className="w-3 h-3 text-slate-400" />
                      </button>

                      <span className="text-[9px] font-semibold text-slate-400">
                        {currentIcon.categoryLabel}
                      </span>

                      {/* Categorized Quick Icon Selector Popover */}
                      {activeItemIconMenu === item.id && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="absolute left-0 right-0 top-full mt-1.5 z-40 bg-slate-900 border border-slate-700 rounded-xl p-2.5 shadow-2xl text-white animate-fadeIn"
                        >
                          <div className="text-[10px] font-bold text-slate-300 mb-2 px-1 flex items-center justify-between border-b border-slate-800 pb-1.5">
                            <span className="flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                              PILIH IKON TAGGING
                            </span>
                            <button
                              type="button"
                              onClick={() => setActiveItemIconMenu(null)}
                              className="text-slate-400 hover:text-white p-0.5 rounded"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>

                          {/* Category Filter Tabs */}
                          <div className="grid grid-cols-4 gap-1 mb-2">
                            <button
                              type="button"
                              onClick={() => setItemIconCategory('all')}
                              className={`px-1 py-1 rounded-md text-[9px] font-bold transition-all cursor-pointer ${
                                itemIconCategory === 'all'
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                              }`}
                            >
                              ✨ Semua
                            </button>
                            <button
                              type="button"
                              onClick={() => setItemIconCategory('pohon')}
                              className={`px-1 py-1 rounded-md text-[9px] font-bold transition-all cursor-pointer ${
                                itemIconCategory === 'pohon'
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                              }`}
                            >
                              🌳 Pohon
                            </button>
                            <button
                              type="button"
                              onClick={() => setItemIconCategory('tiang')}
                              className={`px-1 py-1 rounded-md text-[9px] font-bold transition-all cursor-pointer ${
                                itemIconCategory === 'tiang'
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                              }`}
                            >
                              🗼 Tiang
                            </button>
                            <button
                              type="button"
                              onClick={() => setItemIconCategory('konstruksi')}
                              className={`px-1 py-1 rounded-md text-[9px] font-bold transition-all cursor-pointer ${
                                itemIconCategory === 'konstruksi'
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                              }`}
                            >
                              🏗️ Konstruksi
                            </button>
                          </div>

                          {/* Options Grid */}
                          <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-0.5">
                            {Object.entries(TREE_ICON_MAP)
                              .filter(([_, opt]) => itemIconCategory === 'all' || opt.category === itemIconCategory)
                              .map(([key, opt]) => {
                                const isSelected = (item.iconType || 'pohon') === key;
                                return (
                                  <button
                                    key={key}
                                    type="button"
                                    onClick={() => {
                                      onUpdatePohon({
                                        ...item,
                                        iconType: key as any
                                      });
                                      setActiveItemIconMenu(null);
                                    }}
                                    className={`p-1.5 rounded-lg border text-left transition-all cursor-pointer flex items-center gap-2 ${
                                      isSelected
                                        ? 'bg-emerald-600/90 border-emerald-400 text-white ring-1 ring-emerald-400'
                                        : 'bg-slate-800/90 border-slate-700 text-slate-300 hover:bg-slate-700 hover:border-slate-500'
                                    }`}
                                    title={opt.desc}
                                  >
                                    <span className="text-base shrink-0">{opt.emoji}</span>
                                    <div className="min-w-0 flex-1">
                                      <div className="text-[10px] font-bold truncate leading-tight">{opt.label}</div>
                                      <div className="text-[8.5px] text-slate-400 truncate leading-tight">{opt.categoryLabel}</div>
                                    </div>
                                    {isSelected && <Check className="w-3 h-3 text-white shrink-0" />}
                                  </button>
                                );
                              })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )
          )}
        </div>

        {/* Sidebar Footer Actions */}
        <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-2">
          <button
            onClick={openAddModal}
            className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm shadow-emerald-500/20 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Titik Manual</span>
          </button>
          <button
            onClick={handleExportCsv}
            className="py-2 px-3 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs border border-slate-200 flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
            title="Download CSV"
          >
            <Download className="w-3.5 h-3.5 text-blue-600" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* Main Map Container (Right) */}
      <div className="relative flex-1 h-full">
        {/* Leaflet Map Div */}
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Floating Import Success Toast */}
        {importToast && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2.5 bg-emerald-950/95 text-emerald-100 border border-emerald-500/60 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-2xl animate-fadeIn text-xs font-bold ring-1 ring-emerald-500/20">
            <div className="p-1 bg-emerald-500/20 rounded-lg text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <span>{importToast.message}</span>
            <button
              onClick={() => setImportToast(null)}
              className="p-1 text-emerald-400 hover:text-white rounded-md transition-colors cursor-pointer ml-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Top Control Bar for Map Style, Feeder Layer, Icon Selector & Focus */}
        <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5 bg-slate-900/90 text-white backdrop-blur-md border border-slate-700/80 p-1 rounded-xl shadow-xl">
          {/* Icon Display Selector */}
          <div className="relative group">
            <button
              type="button"
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 border border-slate-700 transition-all cursor-pointer"
              title="Pilihan Icon Marker Pohon"
            >
              <span>{globalIconStyle === 'default' ? '🎨' : TREE_ICON_MAP[globalIconStyle]?.emoji || '🌳'}</span>
              <span className="hidden md:inline">
                {globalIconStyle === 'default' ? 'Icon: Otomatis' : `Icon: ${TREE_ICON_MAP[globalIconStyle]?.emoji} ${TREE_ICON_MAP[globalIconStyle]?.label}`}
              </span>
            </button>
            <div className="absolute right-0 top-full mt-1.5 w-60 bg-slate-900 border border-slate-700 rounded-xl p-2 shadow-2xl z-30 hidden group-hover:block hover:block">
              <div className="text-[10px] font-bold text-slate-400 px-2 py-1 uppercase tracking-wider flex items-center justify-between">
                <span>Tampilan Icon Marker</span>
                <span className="text-emerald-400">Tagging</span>
              </div>
              <button
                type="button"
                onClick={() => setGlobalIconStyle('default')}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer ${
                  globalIconStyle === 'default' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span>✨</span>
                <span>Sesuai Data Item</span>
              </button>
              <div className="my-1 border-t border-slate-800" />
              {Object.entries(TREE_ICON_MAP).map(([key, opt]) => (
                <div key={key} className="flex items-center justify-between gap-1 group/row hover:bg-slate-800/80 rounded-lg p-1">
                  <button
                    type="button"
                    onClick={() => setGlobalIconStyle(key as any)}
                    className={`flex-1 text-left px-1.5 py-1 rounded-md text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer ${
                      globalIconStyle === key ? 'text-emerald-400' : 'text-slate-300'
                    }`}
                  >
                    <span className="text-base">{opt.emoji}</span>
                    <span className="truncate">{opt.label}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBatchApplyIcon(key as any)}
                    className="text-[10px] font-semibold bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white px-1.5 py-0.5 rounded border border-slate-700 hover:border-emerald-500 transition-all cursor-pointer shrink-0"
                    title={`Terapkan icon ${opt.label} ke semua ${filteredList.length} data titik pohon`}
                  >
                    Terapkan Semua
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="w-[1px] h-4 bg-slate-700 mx-0.5" />

          <button
            onClick={() => setShowFeederLayer(!showFeederLayer)}
            className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer font-bold text-xs flex items-center gap-1.5 ${
              showFeederLayer ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Tampilkan / Sembunyikan Jalur Penyulang 20kV"
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Jalur JTM (20kV)</span>
          </button>
          <div className="w-[1px] h-4 bg-slate-700 mx-0.5" />
          <button
            onClick={handleFocusMap}
            className="px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-emerald-400 font-bold text-xs flex items-center gap-1 transition-all cursor-pointer"
            title="Fokuskan Semua Titik Pohon"
          >
            <Target className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Fokus Semua</span>
          </button>
          <div className="w-[1px] h-4 bg-slate-700 mx-0.5" />
          <button
            onClick={() => setMapStyle('dark')}
            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
              mapStyle === 'dark' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Dark Map"
          >
            <Moon className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setMapStyle('satellite')}
            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
              mapStyle === 'satellite' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Satelit"
          >
            <Globe className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setMapStyle('street')}
            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
              mapStyle === 'street' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Street Map"
          >
            <MapPin className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Modal Add / Edit Pohon */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden text-slate-100 max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
                  <Trees className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-white">
                    {editingItem ? 'Edit Data Titik Pohon GIS' : 'Tambah Titik Pohon Baru'}
                  </h3>
                  <p className="text-[11px] text-slate-400">Pemetaan koordinat & rencana pemangkasan ROW 20kV</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Penyulang *</label>
                  <select
                    value={formPenyulang}
                    onChange={(e) => setFormPenyulang(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold focus:outline-none focus:border-emerald-500"
                  >
                    {penyulangList.length > 0 ? (
                      penyulangList.map((p) => (
                        <option key={p.id} value={p.nama}>
                          {p.nama}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="PASSO">PASSO</option>
                        <option value="TULEHU">TULEHU</option>
                        <option value="LIANG">LIANG</option>
                        <option value="WAUR">WAUR</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Nomor Tiang / Span *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: BT.14 - BT.15 / TP-02"
                    value={formNoTiang}
                    onChange={(e) => setFormNoTiang(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Nama Section / Segmen</label>
                  <input
                    type="text"
                    placeholder="Contoh: Section Larier, Passo Indah"
                    value={formSection}
                    onChange={(e) => setFormSection(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Lokasi Detail *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Jl. Wolter Monginsidi RT.02 / Depan Gereja"
                    value={formLokasi}
                    onChange={(e) => setFormLokasi(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Koordinat */}
              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-300 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                    Koordinat GPS (Latitude & Longitude)
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition((pos) => {
                          setFormLat(Number(pos.coords.latitude.toFixed(6)));
                          setFormLng(Number(pos.coords.longitude.toFixed(6)));
                        });
                      }
                    }}
                    className="text-[10.5px] font-bold text-emerald-400 hover:underline"
                  >
                    Ambil Lokasi Saya Sekarang
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 font-medium mb-1">Latitude</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={formLat}
                      onChange={(e) => setFormLat(parseFloat(e.target.value))}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 font-medium mb-1">Longitude</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={formLng}
                      onChange={(e) => setFormLng(parseFloat(e.target.value))}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Pilihan Icon Marker dengan Tab Kategori */}
              <div>
                <label className="block text-slate-400 font-bold mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    Pilihan Ikon Tagging *
                  </span>
                  <span className="text-xs text-emerald-400 font-bold bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-500/40">
                    {TREE_ICON_MAP[formIconType]?.emoji} {TREE_ICON_MAP[formIconType]?.label} ({TREE_ICON_MAP[formIconType]?.categoryLabel})
                  </span>
                </label>

                {/* Category tabs */}
                <div className="flex gap-1.5 mb-2.5">
                  <button
                    type="button"
                    onClick={() => setFormIconCategory('all')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      formIconCategory === 'all'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    ✨ Semua
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormIconCategory('pohon')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      formIconCategory === 'pohon'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    🌳 Pohon & ROW
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormIconCategory('tiang')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      formIconCategory === 'tiang'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    🗼 Tiang Listrik
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormIconCategory('konstruksi')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      formIconCategory === 'konstruksi'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    🏗️ Konstruksi & Gardu
                  </button>
                </div>

                {/* Grid of icons */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {Object.entries(TREE_ICON_MAP)
                    .filter(([_, opt]) => formIconCategory === 'all' || opt.category === formIconCategory)
                    .map(([key, opt]) => {
                      const isSelected = formIconType === key;
                      return (
                        <button
                          type="button"
                          key={key}
                          onClick={() => setFormIconType(key as any)}
                          className={`p-2 rounded-xl border flex items-center gap-2.5 text-left transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-500/20 border-emerald-500 text-white shadow-md shadow-emerald-950 ring-1 ring-emerald-500'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                          }`}
                          title={opt.desc}
                        >
                          <span className="text-2xl shrink-0">{opt.emoji}</span>
                          <div className="min-w-0">
                            <span className="text-[11px] font-bold block truncate text-white">{opt.label}</span>
                            <span className="text-[9px] text-slate-400 block truncate">{opt.categoryLabel}</span>
                          </div>
                        </button>
                      );
                    })}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Jenis Pohon</label>
                  <input
                    type="text"
                    placeholder="Contoh: Pohon Kelapa, Sengon, Bambu"
                    value={formJenisPohon}
                    onChange={(e) => setFormJenisPohon(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Jumlah Batang Pohon</label>
                  <input
                    type="number"
                    min="1"
                    value={formJumlah}
                    onChange={(e) => setFormJumlah(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Jarak ke Kawat 20kV</label>
                  <select
                    value={formJarak}
                    onChange={(e) => setFormJarak(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500 font-bold"
                  >
                    <option value="< 1 meter">🔴 &lt; 1 meter (Kritis)</option>
                    <option value="Menempel Kawat">🔴 Menempel Kawat</option>
                    <option value="1 - 2.5 meter">🟡 1 - 2.5 meter (Rawan)</option>
                    <option value="> 2.5 meter">🟢 &gt; 2.5 meter (Aman)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Tingkat Bahaya</label>
                  <select
                    value={formBahaya}
                    onChange={(e) => setFormBahaya(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500 font-bold"
                  >
                    <option value="Kritis (Bahaya Padam)">Kritis (Bahaya Padam)</option>
                    <option value="Potensi Roboh">Potensi Roboh</option>
                    <option value="Rawan Sentuh">Rawan Sentuh</option>
                    <option value="Aman / Terpangkas">Aman / Terpangkas</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Status Tindakan</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500 font-bold"
                  >
                    <option value="Perlu Tebas">Perlu Tebas</option>
                    <option value="Perlu Tebang">Perlu Tebang</option>
                    <option value="Perlu Izin Warga">Perlu Izin Warga</option>
                    <option value="Perlu Padam">Perlu Padam</option>
                    <option value="Selesai Pangkas">Selesai Pangkas</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Tanggal Temuan</label>
                  <input
                    type="date"
                    value={formTglTemuan}
                    onChange={(e) => setFormTglTemuan(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Pelaksana / Tim Kerja</label>
                  <input
                    type="text"
                    value={formPelaksana}
                    onChange={(e) => setFormPelaksana(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Catatan Tambahan</label>
                <textarea
                  rows={2}
                  placeholder="Catatan kondisi pohon, negosiasi pemilik lahan, dll."
                  value={formKeterangan}
                  onChange={(e) => setFormKeterangan(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-900/30"
                >
                  {editingItem ? 'Simpan Perubahan' : 'Tambah Titik Pohon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detail Pohon */}
      {selectedDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden text-slate-100">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
                  <Trees className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-white">
                    {selectedDetail.penyulang} - {selectedDetail.noTiangOrSpan}
                  </h3>
                  <p className="text-[11px] text-slate-400">{selectedDetail.lokasi}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDetail(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div>
                  <div className="text-slate-500 font-medium">Jenis & Icon Pohon</div>
                  <div className="font-bold text-white text-sm flex items-center gap-1.5 mt-0.5">
                    <span className="text-base">{TREE_ICON_MAP[selectedDetail.iconType || 'pohon']?.emoji || '🌳'}</span>
                    <span>{selectedDetail.jenisPohon}</span>
                  </div>
                  <div className="text-slate-400 text-[11px]">{selectedDetail.jumlahPohon || 1} Pohon ({TREE_ICON_MAP[selectedDetail.iconType || 'pohon']?.label || 'Pohon'})</div>
                </div>
                <div>
                  <div className="text-slate-500 font-medium">Jarak ke Jaringan</div>
                  <div className="font-bold text-rose-400 text-sm">{selectedDetail.jarakKeJaringan}</div>
                  <div className="text-slate-400 text-[11px]">{selectedDetail.tingkatBahaya}</div>
                </div>
                <div>
                  <div className="text-slate-500 font-medium">Status Tindakan</div>
                  <div className="font-bold text-emerald-400">{selectedDetail.statusEksekusi}</div>
                </div>
                <div>
                  <div className="text-slate-500 font-medium">Tanggal Temuan</div>
                  <div className="font-bold text-slate-200">{selectedDetail.tglTemuan}</div>
                </div>
              </div>

              {/* Quick Icon Switcher in Detail Modal */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-slate-400 font-bold text-[11px]">
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    Ganti Ikon Tagging Langsung:
                  </span>
                  <span className="text-emerald-400">
                    {TREE_ICON_MAP[selectedDetail.iconType || 'pohon']?.emoji} {TREE_ICON_MAP[selectedDetail.iconType || 'pohon']?.label}
                  </span>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
                  {Object.entries(TREE_ICON_MAP).map(([key, opt]) => {
                    const isSelected = (selectedDetail.iconType || 'pohon') === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          const updated = {
                            ...selectedDetail,
                            iconType: key as any
                          };
                          onUpdatePohon(updated);
                          setSelectedDetail(updated);
                        }}
                        className={`p-1.5 rounded-lg border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                          isSelected
                            ? 'bg-emerald-600/90 border-emerald-400 text-white ring-1 ring-emerald-400'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                        }`}
                        title={`${opt.label} (${opt.categoryLabel}) - ${opt.desc}`}
                      >
                        <span className="text-base leading-none">{opt.emoji}</span>
                        <span className="text-[8.5px] font-bold truncate max-w-full">{opt.label.split(' ')[0]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {selectedDetail.keterangan && (
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-slate-300 italic">
                  "{selectedDetail.keterangan}"
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2">
                {selectedDetail.statusEksekusi === 'Selesai Pangkas' ? (
                  <button
                    onClick={() => {
                      onUpdatePohon({
                        ...selectedDetail,
                        statusEksekusi: 'Perlu Tebas',
                        tingkatBahaya: 'Rawan Sentuh',
                        jarakKeJaringan: '1 - 2.5 meter',
                        tglEksekusi: undefined
                      });
                      setSelectedDetail(null);
                    }}
                    className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-black rounded-xl transition-all shadow-lg flex items-center justify-center gap-1.5"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Buka Kembali (Perlu Tebas Ulang)
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      onUpdatePohon({
                        ...selectedDetail,
                        statusEksekusi: 'Selesai Pangkas',
                        tingkatBahaya: 'Aman / Terpangkas',
                        jarakKeJaringan: '> 2.5 meter',
                        tglEksekusi: new Date().toISOString().split('T')[0]
                      });
                      setSelectedDetail(null);
                    }}
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl transition-all shadow-lg flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    Tandai Selesai Pangkas
                  </button>
                )}
                <button
                  onClick={() => openEditModal(selectedDetail)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl transition-all cursor-pointer"
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    const itemToDelete = selectedDetail;
                    setSelectedDetail(null);
                    setDeletingItem(itemToDelete);
                  }}
                  className="p-2.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 font-bold rounded-xl transition-all cursor-pointer"
                  title="Hapus Data Pohon"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dialog Konfirmasi Hapus Titik Pohon (Alert Dialog) */}
      {deletingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden text-slate-100 p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-3 bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/30 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-black text-white">Konfirmasi Hapus Titik Pohon</h3>
                <p className="text-xs text-rose-300/90 font-medium">
                  Apakah Anda yakin ingin menghapus data titik pohon ini? Tindakan ini bersifat permanen.
                </p>
              </div>
            </div>

            <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 text-xs space-y-2 text-slate-300">
              <div className="flex justify-between items-center border-b border-slate-800/80 pb-1.5">
                <span className="text-slate-400">Penyulang:</span>
                <span className="font-bold text-white">{deletingItem.penyulang}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-800/80 pb-1.5">
                <span className="text-slate-400">No. Tiang / Span:</span>
                <span className="font-bold text-white">{deletingItem.noTiangOrSpan}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-800/80 pb-1.5">
                <span className="text-slate-400">Jenis & Jumlah Pohon:</span>
                <span className="font-semibold text-emerald-400">{deletingItem.jenisPohon} ({deletingItem.jumlahPohon || 1} Pohon)</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-800/80 pb-1.5">
                <span className="text-slate-400">Lokasi:</span>
                <span className="font-medium text-slate-200 text-right max-w-[220px] truncate">{deletingItem.lokasi}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-800/80 pb-1.5">
                <span className="text-slate-400">Koordinat:</span>
                <span className="font-mono text-slate-400">{deletingItem.latitude.toFixed(5)}, {deletingItem.longitude.toFixed(5)}</span>
              </div>
              <div className="flex justify-between items-center pt-0.5">
                <span className="text-slate-400">Status Saat Ini:</span>
                <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                  deletingItem.statusEksekusi === 'Selesai Pangkas' 
                    ? 'bg-emerald-500/20 text-emerald-300' 
                    : 'bg-amber-500/20 text-amber-300'
                }`}>
                  {deletingItem.statusEksekusi}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingItem(null)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeletePohon(deletingItem.id);
                  setDeletingItem(null);
                }}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-rose-900/40 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                Ya, Hapus Data Pohon
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Edit Feeder Dataset (Warna, Nama, Batch Icon & Status) */}
      {editingFeeder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden text-slate-100 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-5 h-5 rounded-full border-2 border-white shadow-xs"
                  style={{ backgroundColor: editingFeeder.color }}
                />
                <div>
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    Edit Dataset Feeder: <span className="text-emerald-400">{editingFeeder.originalName}</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">{editingFeeder.itemCount} Titik Tiang Terhubung</p>
                </div>
              </div>
              <button
                onClick={() => setEditingFeeder(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* Nama Feeder */}
              <div>
                <label className="block text-slate-300 font-bold mb-1">Nama Feeder / Penyulang</label>
                <input
                  type="text"
                  value={editingFeeder.name}
                  onChange={(e) => setEditingFeeder({ ...editingFeeder, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold focus:outline-none focus:border-emerald-500"
                  placeholder="Contoh: HUTUMURI"
                />
              </div>

              {/* Warna Marker Feeder */}
              <div>
                <label className="block text-slate-300 font-bold mb-1.5">Warna Marker Feeder di Peta</label>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="color"
                    value={editingFeeder.color}
                    onChange={(e) => setEditingFeeder({ ...editingFeeder, color: e.target.value })}
                    className="w-10 h-8 rounded-lg bg-slate-950 border border-slate-700 cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={editingFeeder.color}
                    onChange={(e) => setEditingFeeder({ ...editingFeeder, color: e.target.value })}
                    className="w-28 px-2 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono uppercase text-xs"
                  />
                </div>
                {/* Palette presets */}
                <div className="flex flex-wrap gap-1.5">
                  {[
                    '#10B981', '#3B82F6', '#EF4444', '#F59E0B', '#8B5CF6',
                    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
                  ].map((hex) => (
                    <button
                      key={hex}
                      type="button"
                      onClick={() => setEditingFeeder({ ...editingFeeder, color: hex })}
                      className={`w-6 h-6 rounded-full border-2 transition-transform cursor-pointer ${
                        editingFeeder.color.toLowerCase() === hex.toLowerCase() ? 'border-white scale-110 shadow-md' : 'border-transparent hover:scale-105'
                      }`}
                      style={{ backgroundColor: hex }}
                    />
                  ))}
                </div>
              </div>

              {/* Mass Icon Update for this Feeder */}
              <div className="pt-2 border-t border-slate-800">
                <label className="block text-slate-300 font-bold mb-1">
                  Ubah Icon Seluruh Titik Feeder ({editingFeeder.itemCount} Titik)
                </label>
                <div className="grid grid-cols-3 gap-1.5 max-h-36 overflow-y-auto pr-0.5">
                  {Object.entries(TREE_ICON_MAP).map(([key, opt]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setEditingFeeder({ ...editingFeeder, iconType: key })}
                      className={`p-1.5 rounded-lg border text-left flex items-center gap-1.5 transition-all cursor-pointer ${
                        editingFeeder.iconType === key
                          ? 'bg-emerald-600 border-emerald-400 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <span className="text-base shrink-0">{opt.emoji}</span>
                      <span className="text-[10px] font-bold truncate leading-tight">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingFeeder(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  handleSaveFeederEdit(
                    editingFeeder.originalName,
                    editingFeeder.name,
                    editingFeeder.color,
                    editingFeeder.iconType
                  );
                }}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-emerald-950 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                Simpan Perubahan Feeder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dialog Konfirmasi Hapus Satu Feeder Dataset */}
      {deletingFeeder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden text-slate-100 p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-3 bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/30 shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-black text-white">Hapus Dataset Feeder</h3>
                <p className="text-xs text-rose-300/90 font-medium">
                  Apakah Anda yakin ingin menghapus seluruh data titik pohon untuk feeder{' '}
                  <span className="font-bold text-white underline">{deletingFeeder.name}</span>?
                </p>
              </div>
            </div>

            <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 text-xs space-y-1.5 text-slate-300">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Nama Feeder:</span>
                <span className="font-bold text-white">{deletingFeeder.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Total Titik Terhapus:</span>
                <span className="font-bold text-rose-400">{deletingFeeder.itemCount} Titik Tiang</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingFeeder(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteFeederConfirm}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-rose-900/40 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                Hapus {deletingFeeder.itemCount} Titik
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Pohon Modal */}
      {isImportModalOpen && (
        <ImportPohonModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          onImport={(items) => {
            if (onImportBatch) {
              onImportBatch(items);
            } else {
              items.forEach((it) => onAddPohon(it));
            }
            setImportToast({
              message: `Berhasil mengimpor & memvalidasi ${items.length} titik pohon ke dalam peta.`,
              count: items.length
            });
            setIsImportModalOpen(false);
            setTimeout(() => {
              setImportToast(null);
            }, 6000);
          }}
          penyulangList={penyulangList}
        />
      )}
    </div>
  );
};
