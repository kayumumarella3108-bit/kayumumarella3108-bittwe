import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet.markercluster';
import JSZip from 'jszip';
import {
  Upload,
  Search,
  Plus,
  Eye,
  EyeOff,
  Trash2,
  MapPin,
  Moon,
  Globe,
  Layers,
  Trees,
  ClipboardList,
  Wrench,
  Target,
  FileCode,
  Pencil,
  X,
  Check,
  Zap,
  GitBranch,
  Building2,
  Activity,
  Shield,
  Cpu,
  ToggleRight,
  Power,
  RotateCcw
} from 'lucide-react';
import { MapLayerItem, MasterUnitPLN, Penyulang } from '../../types';
import {
  IconGarduTrafo,
  IconTiangSingleCrossarm,
  IconTiangDoubleCrossarm,
  IconTiangLBS,
  IconGarduPortal,
  IconGarduBeton,
  IconTiangPortal3Pole,
  ELECTRIC_ICON_SVG_STRINGS
} from '../common/ElectricIcons';

interface PetaPenyulangViewProps {
  layers: MapLayerItem[];
  onToggleLayer: (id: string) => void;
  onDeleteLayer: (id: string) => void;
  onAddLayer: (layer: MapLayerItem) => void;
  onUpdateLayer?: (layer: MapLayerItem) => void;
  masterUnits?: MasterUnitPLN[];
  masterPenyulangs?: Penyulang[];
}

export const PetaPenyulangView: React.FC<PetaPenyulangViewProps> = ({
  layers,
  onToggleLayer,
  onDeleteLayer,
  onAddLayer,
  onUpdateLayer,
  masterUnits = [],
  masterPenyulangs = []
}) => {
  const getLayerIconComponent = (type?: string) => {
    switch (type) {
      case 'tiang-single':
      case 'tiang-listrik': return IconTiangSingleCrossarm;
      case 'tiang-double': return IconTiangDoubleCrossarm;
      case 'gardu-trafo': return IconGarduTrafo;
      case 'gardu-beton': return IconGarduBeton;
      case 'gardu-cantol': return IconGarduPortal;
      case 'gardu-portal': return IconTiangPortal3Pole;
      case 'git-branch': return GitBranch;
      case 'map-pin': return MapPin;
      case 'building': return Building2;
      case 'gardu-dist': return Cpu;
      case 'lbs': return ToggleRight;
      case 'pmcb': return Power;
      case 'recloser': return RotateCcw;
      case 'trees': return Trees;
      case 'wrench': return Wrench;
      case 'activity': return Activity;
      case 'shield': return Shield;
      case 'zap':
      default:
        return Zap;
    }
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'Semua' | 'ROW' | 'Inspeksi' | 'Maintenance'>('Semua');
  const [mapStyle, setMapStyle] = useState<'dark' | 'satellite' | 'street'>('dark');
  const [fileImporting, setFileImporting] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importUlp, setImportUlp] = useState('');
  const [importKodeUnit, setImportKodeUnit] = useState('');
  const [importPenyulang, setImportPenyulang] = useState('');
  const [importFiles, setImportFiles] = useState<FileList | null>(null);
  const [editingLayer, setEditingLayer] = useState<MapLayerItem | null>(null);
  const [editingMarkerModal, setEditingMarkerModal] = useState<{
    layerId: string;
    layerName: string;
    nodeIndex: number;
    poleName: string;
    coord: [number, number];
    currentIcon: string;
    currentStatus: string;
  } | null>(null);

  const [manualStatuses, setManualStatuses] = useState<Record<string, 'PENYULANG' | 'POHON' | 'KONSTRUKSI' | 'GANGGUAN' | 'PEMELIHARAAN' | 'NORMAL'>>({
    'ml1_0': 'PENYULANG',
    'ml1_1': 'POHON',
    'ml1_2': 'KONSTRUKSI',
    'ml2_0': 'PENYULANG',
    'ml2_1': 'POHON',
    'ml3_0': 'KONSTRUKSI',
    'ml4_1': 'PENYULANG'
  });

  const [nodeIcons, setNodeIcons] = useState<Record<string, string>>({});
  const [densityMode, setDensityMode] = useState<'cluster' | 'smart' | 'all'>('cluster');
  const [showPolyline, setShowPolyline] = useState<boolean>(true);
  const [visibleMarkerCount, setVisibleMarkerCount] = useState<number>(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const canvasRendererRef = useRef<L.Canvas | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const polylineGroupRef = useRef<L.FeatureGroup | null>(null);
  const markerGroupRef = useRef<L.FeatureGroup | null>(null);
  const clusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);

  const layersRef = useRef(layers);
  const onUpdateLayerRef = useRef(onUpdateLayer);
  const manualStatusesRef = useRef(manualStatuses);
  const nodeIconsRef = useRef(nodeIcons);
  const densityModeRef = useRef(densityMode);
  const showPolylineRef = useRef(showPolyline);

  useEffect(() => {
    layersRef.current = layers;
    onUpdateLayerRef.current = onUpdateLayer;
    manualStatusesRef.current = manualStatuses;
    nodeIconsRef.current = nodeIcons;
    densityModeRef.current = densityMode;
    showPolylineRef.current = showPolyline;
  }, [layers, onUpdateLayer, manualStatuses, nodeIcons, densityMode, showPolyline]);

  // Sync layer customIcons & customStatuses to local state
  useEffect(() => {
    const syncedIcons: Record<string, string> = {};
    const syncedStatuses: Record<string, 'PENYULANG' | 'POHON' | 'KONSTRUKSI' | 'GANGGUAN' | 'PEMELIHARAAN' | 'NORMAL'> = {};

    layers.forEach((layer) => {
      if (layer.customIcons) {
        Object.entries(layer.customIcons).forEach(([idxStr, iconVal]) => {
          if (iconVal) {
            syncedIcons[`${layer.id}_${idxStr}`] = iconVal as string;
          }
        });
      }
      if (layer.customStatuses) {
        Object.entries(layer.customStatuses).forEach(([idxStr, statusVal]) => {
          if (statusVal) {
            syncedStatuses[`${layer.id}_${idxStr}`] = statusVal as any;
          }
        });
      }
    });

    setNodeIcons((prev) => ({ ...syncedIcons, ...prev }));
    setManualStatuses((prev) => ({ ...syncedStatuses, ...prev }));
  }, [layers]);

  // Attach global window handler for manual tiang status & icon selection with real-time Firestore persistence
  useEffect(() => {
    (window as any).setTiangManualStatus = (layerId: string, nodeIdx: number, status: 'PENYULANG' | 'POHON' | 'KONSTRUKSI' | 'GANGGUAN' | 'PEMELIHARAAN' | 'NORMAL') => {
      const key = `${layerId}_${nodeIdx}`;
      setManualStatuses((prev) => {
        const next = { ...prev };
        if (status === 'NORMAL' || status === 'PENYULANG') {
          delete next[key];
        } else {
          next[key] = status;
        }
        return next;
      });

      const targetLayer = layersRef.current.find((l) => l.id === layerId);
      if (targetLayer && onUpdateLayerRef.current) {
        const nextCustomStatuses = { ...(targetLayer.customStatuses || {}) };
        if (status === 'NORMAL' || status === 'PENYULANG') {
          delete nextCustomStatuses[nodeIdx.toString()];
        } else {
          nextCustomStatuses[nodeIdx.toString()] = status;
        }
        onUpdateLayerRef.current({
          ...targetLayer,
          customStatuses: nextCustomStatuses
        });
      }
    };

    (window as any).setTiangCustomIcon = (layerId: string, nodeIdx: number, iconType: string) => {
      const key = `${layerId}_${nodeIdx}`;
      setNodeIcons((prev) => {
        const next = { ...prev };
        if (iconType === 'RESET') {
          delete next[key];
        } else {
          next[key] = iconType;
        }
        return next;
      });

      const targetLayer = layersRef.current.find((l) => l.id === layerId);
      if (targetLayer && onUpdateLayerRef.current) {
        const nextCustomIcons = { ...(targetLayer.customIcons || {}) };
        if (iconType === 'RESET') {
          delete nextCustomIcons[nodeIdx.toString()];
        } else {
          nextCustomIcons[nodeIdx.toString()] = iconType;
        }
        onUpdateLayerRef.current({
          ...targetLayer,
          customIcons: nextCustomIcons
        });
      }
    };

    (window as any).openEditMarkerModal = (layerId: string, nodeIdx: number) => {
      const targetLayer = layersRef.current.find((l) => l.id === layerId);
      if (!targetLayer) return;
      const key = `${layerId}_${nodeIdx}`;
      const poleName = targetLayer.poleNames?.[nodeIdx] || `${targetLayer.nama}-${nodeIdx + 1}`;
      const coord = targetLayer.coordinates[nodeIdx] || [0, 0];
      const currentIcon = targetLayer.customIcons?.[nodeIdx.toString()] || targetLayer.iconType || 'zap';
      const currentStatus = targetLayer.customStatuses?.[nodeIdx.toString()] || 'PENYULANG';

      setEditingMarkerModal({
        layerId,
        layerName: targetLayer.nama,
        nodeIndex: nodeIdx,
        poleName,
        coord,
        currentIcon,
        currentStatus
      });
    };

    return () => {
      delete (window as any).setTiangManualStatus;
      delete (window as any).setTiangCustomIcon;
      delete (window as any).openEditMarkerModal;
    };
  }, []);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Ambon / Baguala coordinates
    const map = L.map(mapContainerRef.current, {
      center: [-3.63, 128.23],
      zoom: 12,
      zoomControl: false,
      preferCanvas: true,
      fadeAnimation: true,
      zoomAnimation: true,
      markerZoomAnimation: true
    });

    const canvasRenderer = L.canvas({ padding: 0.5 });
    canvasRendererRef.current = canvasRenderer;

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const tileUrl = getTileUrl('dark');
    const tileLayer = L.tileLayer(tileUrl, {
      maxZoom: 19,
      attribution: '&copy; Leaflet | OpenStreetMap contributors & CARTO'
    }).addTo(map);

    tileLayerRef.current = tileLayer;
    polylineGroupRef.current = L.featureGroup().addTo(map);
    markerGroupRef.current = L.featureGroup().addTo(map);
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

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

  // Change Map Tile Style
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;
    mapInstanceRef.current.removeLayer(tileLayerRef.current);
    const newTile = L.tileLayer(getTileUrl(mapStyle), { maxZoom: 19 }).addTo(mapInstanceRef.current);
    tileLayerRef.current = newTile;
  }, [mapStyle]);

const getIconSvgHtml = (iconType?: string) => {
  switch (iconType) {
    case 'tiang-single':
    case 'tiang-listrik':
      return ELECTRIC_ICON_SVG_STRINGS.tiangSingle;
    case 'tiang-double':
      return ELECTRIC_ICON_SVG_STRINGS.tiangDouble;
    case 'gardu-trafo':
      return ELECTRIC_ICON_SVG_STRINGS.garduTrafo;
    case 'gardu-beton':
      return ELECTRIC_ICON_SVG_STRINGS.garduBeton;
    case 'gardu-cantol':
      return ELECTRIC_ICON_SVG_STRINGS.garduTrafo;
    case 'gardu-portal':
      return ELECTRIC_ICON_SVG_STRINGS.garduPortal;
    case 'tiang-portal':
      return ELECTRIC_ICON_SVG_STRINGS.tiangPortal3Pole;
    case 'lbs':
      return ELECTRIC_ICON_SVG_STRINGS.tiangLBS;
    case 'recloser':
    case 'pmcb':
      return ELECTRIC_ICON_SVG_STRINGS.tiangLBS;
    case 'trees':
      return ELECTRIC_ICON_SVG_STRINGS.trees;
    case 'wrench':
      return ELECTRIC_ICON_SVG_STRINGS.wrench;
    case 'activity':
      return ELECTRIC_ICON_SVG_STRINGS.activity;
    case 'zap':
      return ELECTRIC_ICON_SVG_STRINGS.zap;
    default:
      return ELECTRIC_ICON_SVG_STRINGS.tiangSingle;
  }
};

const createLeafletDivIcon = (iconType: string | undefined, isCustomNode: boolean, color: string = '#3b82f6') => {
  const html = `
    <div style="
      width: 12px;
      height: 12px;
      background-color: ${color};
      border: 2px solid #ffffff;
      border-radius: 50%;
      box-shadow: 0 2px 5px rgba(0,0,0,0.6);
    "></div>
  `;
  return L.divIcon({
    html: html,
    className: 'lightweight-dot-icon',
    iconSize: [12, 12],
    iconAnchor: [6, 6],
    popupAnchor: [0, -6]
  });
};

  // Smart High-Performance Marker & Feeder Line Rendering Engine with Canvas & Clustering
  useEffect(() => {
    if (!mapInstanceRef.current || !polylineGroupRef.current || !markerGroupRef.current) return;
    const map = mapInstanceRef.current;
    const polyFg = polylineGroupRef.current;
    const markerFg = markerGroupRef.current;

    let renderTimeout: any = null;

    const renderMapContent = () => {
      if (!mapInstanceRef.current) return;

      const curLayers = layersRef.current;
      const curManualStatuses = manualStatusesRef.current;
      const curNodeIcons = nodeIconsRef.current;
      const curDensity = densityModeRef.current;
      const curShowPoly = showPolylineRef.current;

      const visibleLayers = curLayers.filter((l) => l.visible);

      // 1. GARIS FEEDER DIHILANGKAN SESUAI PERMINTAAN AGAR PETA RINGAN
      polyFg.clearLayers();

      // 2. RENDER MARKERS DENGAN ICON DEFAULT LEAFLET YANG RINGAN & CEPAT
      markerFg.clearLayers();

      if (clusterGroupRef.current) {
        map.removeLayer(clusterGroupRef.current);
        clusterGroupRef.current = null;
      }

      let clusterGroup: L.MarkerClusterGroup | null = null;
      if (curDensity === 'cluster') {
        clusterGroup = L.markerClusterGroup({
          chunkedLoading: true,
          chunkInterval: 50,
          chunkDelay: 10,
          maxClusterRadius: 50,
          spiderfyOnMaxZoom: true,
          showCoverageOnHover: true,
          zoomToBoundsOnClick: true,
          animate: true,
          disableClusteringAtZoom: 18,
          iconCreateFunction: (cluster) => {
            const count = cluster.getChildCount();
            const childMarkers = cluster.getAllChildMarkers();
            
            // Check for transformers or alerts in this cluster
            let trafoCount = 0;
            let hasAlert = false;

            childMarkers.forEach((m: any) => {
              const iconT = m._activeIconType || '';
              const stat = m._manualStatus || '';
              if (iconT.includes('gardu') || iconT.includes('trafo') || iconT.includes('beton') || iconT.includes('cantol') || iconT.includes('portal')) {
                trafoCount++;
              }
              if (stat === 'GANGGUAN' || stat === 'POHON' || stat === 'KONSTRUKSI') {
                hasAlert = true;
              }
            });

            let size = 40;
            let fontSize = '11px';
            if (count < 10) {
              size = 36;
              fontSize = '10.5px';
            } else if (count > 50) {
              size = 46;
              fontSize = '12px';
            }

            const borderColor = hasAlert ? '#f43f5e' : '#3b82f6';
            const glowColor = hasAlert ? 'rgba(244, 63, 94, 0.5)' : 'rgba(59, 130, 246, 0.4)';

            const html = `
              <div class="cluster-feeder-badge" style="
                width: ${size}px;
                height: ${size}px;
                border: 2px solid ${borderColor};
                box-shadow: 0 4px 12px rgba(0,0,0,0.7), 0 0 12px ${glowColor};
                position: relative;
              ">
                ${trafoCount > 0 ? `<span style="position: absolute; top: -3px; right: -3px; background: #eab308; color: #000; font-size: 8px; font-weight: 900; padding: 1px 3.5px; border-radius: 9999px; border: 1px solid #000;" title="${trafoCount} Gardu Trafo">⚡${trafoCount}</span>` : ''}
                <div style="color: #f8fafc; font-weight: 900; font-size: ${fontSize}; line-height: 1;">
                  ${count}
                </div>
                <div style="font-size: 7px; font-weight: 800; color: #94a3b8; letter-spacing: 0.5px; text-transform: uppercase;">
                  Titik
                </div>
              </div>
            `;

            return L.divIcon({
              html: html,
              className: 'cluster-trafo-icon',
              iconSize: [size, size],
              iconAnchor: [size / 2, size / 2]
            });
          }
        });
        clusterGroupRef.current = clusterGroup;
        map.addLayer(clusterGroup);
      }

      const targetMarkerLayer = curDensity === 'cluster' && clusterGroup ? clusterGroup : markerFg;

      const currentZoom = map.getZoom();
      const bounds = map.getBounds().pad(0.15); // Buffer 15% di luar viewport layar

      // Tentukan sampling rate berdasarkan zoom level jika mode smart
      let sampleStep = 1;
      if (curDensity === 'smart') {
        if (currentZoom >= 16) sampleStep = 1;
        else if (currentZoom === 15) sampleStep = 2;
        else if (currentZoom === 14) sampleStep = 4;
        else if (currentZoom === 13) sampleStep = 8;
        else if (currentZoom === 12) sampleStep = 16;
        else sampleStep = 32;
      }

      let renderedCount = 0;

      visibleLayers.forEach((layer) => {
        if (!layer.coordinates || layer.coordinates.length === 0) return;
        const totalCoords = layer.coordinates.length;

        layer.coordinates.forEach((coord, idx) => {
          // Viewport Culling for non-clustered modes
          if (curDensity !== 'cluster' && !bounds.contains(coord)) return;

          const key = `${layer.id}_${idx}`;
          const manualStatus = curManualStatuses[key] || 'NORMAL';
          const customIcon = curNodeIcons[key];

          let markerColor = layer.color || '#3b82f6';
          let activeIconType = customIcon || layer.iconType || 'zap';
          let statusBadgeHtml = '';

          if (manualStatus === 'POHON') {
            markerColor = '#22c55e'; // Hijau Pohon
            if (!customIcon) activeIconType = 'trees';
            statusBadgeHtml = `
              <div class="mt-2 p-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-black text-[11px] flex items-center gap-1.5">
                <span class="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                🌳 TEMUAN POHON (HIJAU)
              </div>
            `;
          } else if (manualStatus === 'KONSTRUKSI') {
            markerColor = '#a855f7'; // Ungu Temuan Konstruksi
            if (!customIcon) activeIconType = 'wrench';
            statusBadgeHtml = `
              <div class="mt-2 p-1.5 rounded-lg bg-purple-50 border border-purple-200 text-purple-800 font-black text-[11px] flex items-center gap-1.5">
                <span class="w-2.5 h-2.5 rounded-full bg-purple-600"></span>
                🏗️ TEMUAN KONSTRUKSI (UNGU)
              </div>
            `;
          } else if (manualStatus === 'GANGGUAN') {
            markerColor = '#ef4444'; // Red Merah
            if (!customIcon) activeIconType = 'activity';
            statusBadgeHtml = `
              <div class="mt-2 p-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-black text-[11px] flex items-center gap-1.5 animate-pulse">
                <span class="w-2.5 h-2.5 rounded-full bg-rose-600"></span>
                ⚡ LOKASI GANGGUAN (MERAH)
              </div>
            `;
          } else if (manualStatus === 'PEMELIHARAAN') {
            markerColor = '#f97316'; // Orange Oranye
            if (!customIcon) activeIconType = 'wrench';
            statusBadgeHtml = `
              <div class="mt-2 p-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 font-black text-[11px] flex items-center gap-1.5">
                <span class="w-2.5 h-2.5 rounded-full bg-amber-600"></span>
                🔧 LOKASI PEMELIHARAAN (ORANYE)
              </div>
            `;
          } else {
            // Default / PENYULANG -> Menggunakan Warna Pilihan File Import / Layer Peta
            markerColor = layer.color || '#3b82f6';
            if (!customIcon) activeIconType = layer.iconType || 'zap';
            statusBadgeHtml = `
              <div class="mt-2 p-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 font-black text-[11px] flex items-center gap-1.5">
                <span class="w-2.5 h-2.5 rounded-full inline-block" style="background-color: ${markerColor}"></span>
                📍 WARNA LAYER (${layer.nama})
              </div>
            `;
          }

          // Prioritas: Titik temuan, titik berkustom icon, atau ujung awal & akhir SELALU dirender
          const isCustomNode = manualStatus !== 'NORMAL' || !!customIcon || idx === 0 || idx === totalCoords - 1;
          const shouldRender = curDensity === 'cluster' || isCustomNode || (idx % sampleStep === 0);

          if (!shouldRender) return;

          // Popup Content standar untuk semua titik
          const popupContent = `
            <div class="p-2 text-slate-900 font-sans min-w-[240px]">
              <div class="font-black text-xs text-blue-800 flex items-center justify-between gap-2 mb-1 border-b border-slate-100 pb-1">
                <span class="flex items-center gap-1.5">
                  <span class="w-2.5 h-2.5 rounded-full inline-block shadow-xs" style="background-color: ${markerColor}"></span>
                  Penyulang ${layer.nama}
                </span>
                <span class="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10px]">
                  No. Urut: ${idx + 1}
                </span>
              </div>

              <div class="text-[11px] text-slate-600 space-y-0.5 mt-1">
                <div class="font-bold text-blue-600">ID Tiang: ${layer.poleNames?.[idx] || `${layer.nama}-${idx + 1}`}</div>
                <div><span class="font-semibold">Koordinat:</span> ${coord[0].toFixed(5)}, ${coord[1].toFixed(5)}</div>
                <div><span class="font-semibold">Kategori Feeder:</span> <span class="font-bold text-amber-600">${layer.kategori}</span></div>
                <div><span class="font-semibold">Icon Aktif:</span> <span class="font-bold text-indigo-600 uppercase">${activeIconType}</span></div>
              </div>

              ${statusBadgeHtml}

              <!-- EDIT ICON PER TITIK -->
              <div class="mt-2.5 pt-2 border-t border-slate-200">
                <div class="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>🎨 Edit Icon Titik Ini:</span>
                  ${customIcon ? `<span class="text-blue-600 font-bold">Kustom</span>` : `<span class="text-slate-400">Layer</span>`}
                </div>
                <div class="grid grid-cols-4 gap-1">
                  <button
                    onclick="window.setTiangCustomIcon('${layer.id}', ${idx}, 'tiang-single')"
                    class="p-1 rounded ${activeIconType === 'tiang-single' ? 'bg-blue-600 text-white font-black' : 'bg-slate-100 hover:bg-blue-100 text-slate-800'} text-[10px] font-bold flex flex-col items-center justify-center cursor-pointer transition-all"
                    title="Tiang Listrik Single"
                  >💈 Tiang</button>
                  <button
                    onclick="window.setTiangCustomIcon('${layer.id}', ${idx}, 'tiang-double')"
                    class="p-1 rounded ${activeIconType === 'tiang-double' ? 'bg-blue-600 text-white font-black' : 'bg-slate-100 hover:bg-blue-100 text-slate-800'} text-[10px] font-bold flex flex-col items-center justify-center cursor-pointer transition-all"
                    title="Tiang 2 Travers"
                  >🗼 2-Trv</button>
                  <button
                    onclick="window.setTiangCustomIcon('${layer.id}', ${idx}, 'gardu-trafo')"
                    class="p-1 rounded ${activeIconType === 'gardu-trafo' ? 'bg-blue-600 text-white font-black' : 'bg-slate-100 hover:bg-blue-100 text-slate-800'} text-[10px] font-bold flex flex-col items-center justify-center cursor-pointer transition-all"
                    title="Gardu Trafo"
                  >⚡ Trafo</button>
                  <button
                    onclick="window.setTiangCustomIcon('${layer.id}', ${idx}, 'gardu-beton')"
                    class="p-1 rounded ${activeIconType === 'gardu-beton' ? 'bg-blue-600 text-white font-black' : 'bg-slate-100 hover:bg-blue-100 text-slate-800'} text-[10px] font-bold flex flex-col items-center justify-center cursor-pointer transition-all"
                    title="Gardu Beton"
                  >🏢 Beton</button>
                  <button
                    onclick="window.setTiangCustomIcon('${layer.id}', ${idx}, 'gardu-cantol')"
                    class="p-1 rounded ${activeIconType === 'gardu-cantol' ? 'bg-blue-600 text-white font-black' : 'bg-slate-100 hover:bg-blue-100 text-slate-800'} text-[10px] font-bold flex flex-col items-center justify-center cursor-pointer transition-all"
                    title="Gardu Cantol"
                  >🔌 Cantol</button>
                  <button
                    onclick="window.setTiangCustomIcon('${layer.id}', ${idx}, 'gardu-portal')"
                    class="p-1 rounded ${activeIconType === 'gardu-portal' ? 'bg-blue-600 text-white font-black' : 'bg-slate-100 hover:bg-blue-100 text-slate-800'} text-[10px] font-bold flex flex-col items-center justify-center cursor-pointer transition-all"
                    title="Gardu Portal"
                  >📐 Portal</button>
                  <button
                    onclick="window.setTiangCustomIcon('${layer.id}', ${idx}, 'lbs')"
                    class="p-1 rounded ${activeIconType === 'lbs' ? 'bg-blue-600 text-white font-black' : 'bg-slate-100 hover:bg-blue-100 text-slate-800'} text-[10px] font-bold flex flex-col items-center justify-center cursor-pointer transition-all"
                    title="LBS Switch"
                  >🔘 LBS</button>
                  <button
                    onclick="window.setTiangCustomIcon('${layer.id}', ${idx}, 'recloser')"
                    class="p-1 rounded ${activeIconType === 'recloser' ? 'bg-blue-600 text-white font-black' : 'bg-slate-100 hover:bg-blue-100 text-slate-800'} text-[10px] font-bold flex flex-col items-center justify-center cursor-pointer transition-all"
                    title="Recloser"
                  >🔄 Rec</button>
                  <button
                    onclick="window.setTiangCustomIcon('${layer.id}', ${idx}, 'trees')"
                    class="p-1 rounded ${activeIconType === 'trees' ? 'bg-emerald-600 text-white font-black' : 'bg-slate-100 hover:bg-emerald-100 text-slate-800'} text-[10px] font-bold flex flex-col items-center justify-center cursor-pointer transition-all"
                    title="Pohon ROW"
                  >🌳 Pohon</button>
                  <button
                    onclick="window.setTiangCustomIcon('${layer.id}', ${idx}, 'wrench')"
                    class="p-1 rounded ${activeIconType === 'wrench' ? 'bg-purple-600 text-white font-black' : 'bg-slate-100 hover:bg-purple-100 text-slate-800'} text-[10px] font-bold flex flex-col items-center justify-center cursor-pointer transition-all"
                    title="Har / Maint."
                  >🔧 Har</button>
                  <button
                    onclick="window.setTiangCustomIcon('${layer.id}', ${idx}, 'activity')"
                    class="p-1 rounded ${activeIconType === 'activity' ? 'bg-rose-600 text-white font-black' : 'bg-slate-100 hover:bg-rose-100 text-slate-800'} text-[10px] font-bold flex flex-col items-center justify-center cursor-pointer transition-all"
                    title="Gangguan / Trip"
                  >💥 Trip</button>
                  <button
                    onclick="window.setTiangCustomIcon('${layer.id}', ${idx}, 'zap')"
                    class="p-1 rounded ${activeIconType === 'zap' ? 'bg-amber-500 text-white font-black' : 'bg-slate-100 hover:bg-amber-100 text-slate-800'} text-[10px] font-bold flex flex-col items-center justify-center cursor-pointer transition-all"
                    title="Zap Feeder"
                  >⚡ Zap</button>
                </div>
                ${customIcon ? `
                  <button
                    onclick="window.setTiangCustomIcon('${layer.id}', ${idx}, 'RESET')"
                    class="w-full mt-1.5 py-1 px-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-[10px] rounded flex items-center justify-center gap-1 cursor-pointer transition-all"
                  >
                    ✓ Reset Icon Ke Default Layer
                  </button>
                ` : ''}
              </div>

              <!-- PILIHAN STATUS / WARNA TIANG -->
              <div class="mt-2.5 pt-2 border-t border-slate-200 space-y-1">
                <div class="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Pilihan Status / Warna Tiang:
                </div>
                <div class="grid grid-cols-1 gap-1">
                  <button
                    onclick="window.setTiangManualStatus('${layer.id}', ${idx}, 'PENYULANG')"
                    class="w-full py-1.5 px-2 text-white font-bold text-[11px] rounded-lg shadow-xs flex items-center justify-start gap-1.5 cursor-pointer transition-all hover:brightness-110"
                    style="background-color: ${layer.color || '#3b82f6'}"
                  >
                    <span class="w-2 h-2 rounded-full bg-white"></span>
                    📍 Warna Layer File (${layer.nama})
                  </button>
                  <button
                    onclick="window.setTiangManualStatus('${layer.id}', ${idx}, 'POHON')"
                    class="w-full py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-[11px] rounded-lg shadow-xs flex items-center justify-start gap-1.5 cursor-pointer transition-all"
                  >
                    <span class="w-2 h-2 rounded-full bg-white"></span>
                    🌳 Pohon / ROW (Hijau)
                  </button>
                  <button
                    onclick="window.setTiangManualStatus('${layer.id}', ${idx}, 'KONSTRUKSI')"
                    class="w-full py-1.5 px-2 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white font-bold text-[11px] rounded-lg shadow-xs flex items-center justify-start gap-1.5 cursor-pointer transition-all"
                  >
                    <span class="w-2 h-2 rounded-full bg-white"></span>
                    🏗️ Temuan Konstruksi (Ungu)
                  </button>
                  <button
                    onclick="window.setTiangManualStatus('${layer.id}', ${idx}, 'GANGGUAN')"
                    class="w-full py-1.5 px-2 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold text-[11px] rounded-lg shadow-xs flex items-center justify-start gap-1.5 cursor-pointer transition-all"
                  >
                    <span class="w-2 h-2 rounded-full bg-white"></span>
                    ⚡ Lokasi Gangguan (Merah)
                  </button>
                  <button
                    onclick="window.setTiangManualStatus('${layer.id}', ${idx}, 'PEMELIHARAAN')"
                    class="w-full py-1.5 px-2 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-bold text-[11px] rounded-lg shadow-xs flex items-center justify-start gap-1.5 cursor-pointer transition-all"
                  >
                    <span class="w-2 h-2 rounded-full bg-white"></span>
                    🔧 Lokasi Pemeliharaan (Oranye)
                  </button>
                  ${manualStatus !== 'NORMAL' ? `
                    <button
                      onclick="window.setTiangManualStatus('${layer.id}', ${idx}, 'NORMAL')"
                      class="w-full py-1 px-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-[10px] rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-all mt-1"
                    >
                      ✓ Reset Ke Default File
                    </button>
                  ` : ''}
                </div>
              </div>

              <!-- TOMBOL BUKA MODAL EDIT INDIVIDUAL TITIK -->
              <div class="mt-2.5 pt-2 border-t border-slate-200">
                <button
                  onclick="window.openEditMarkerModal('${layer.id}', ${idx})"
                  class="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                >
                  ✏️ Edit Marker Individual (Modal)
                </button>
              </div>
            </div>
          `;

          // Render Marker DivIcon Realistis atau Dot Ringan
          const markerDivIcon = createLeafletDivIcon(activeIconType, isCustomNode, markerColor);
          const marker = L.marker(coord, { icon: markerDivIcon });

          // Attach metadata for clustering
          (marker as any)._activeIconType = activeIconType;
          (marker as any)._manualStatus = manualStatus;

          marker.bindPopup(popupContent);
          marker.bindTooltip(layer.poleNames?.[idx] || `${layer.nama}-${idx + 1}`, { 
            permanent: false, 
            direction: 'top',
            className: 'font-bold text-[10px] px-1.5 py-0.5 rounded-lg bg-slate-900/80 text-white border-none shadow-sm'
          });

          targetMarkerLayer.addLayer(marker);
          renderedCount++;
        });
      });

      setVisibleMarkerCount(renderedCount);
    };

    // Debounced Map Events (moveend & zoomend) for 60 FPS performance
    const handleMapMovement = () => {
      if (renderTimeout) clearTimeout(renderTimeout);
      renderTimeout = setTimeout(() => {
        renderMapContent();
      }, 70);
    };

    // Initial render
    renderMapContent();

    map.on('moveend', handleMapMovement);
    map.on('zoomend', handleMapMovement);

    return () => {
      if (renderTimeout) clearTimeout(renderTimeout);
      map.off('moveend', handleMapMovement);
      map.off('zoomend', handleMapMovement);
    };
  }, [layers, manualStatuses, nodeIcons, densityMode, showPolyline]);

  // Center map on specific feeder route
  const handleLocateLayer = (layer: MapLayerItem) => {
    if (!mapInstanceRef.current || layer.coordinates.length === 0) return;
    const bounds = L.latLngBounds(layer.coordinates);
    mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // KML Text Parser
  const parseKMLText = (kmlText: string, fileName: string): MapLayerItem => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(kmlText, 'text/xml');

    // Extract name
    const docNameNode = xmlDoc.querySelector('Document > name');
    const feederName = docNameNode?.textContent?.trim() || (fileName || 'LAYER').replace(/\.(kml|kmz|xml|zip)$/i, '').toUpperCase();

    const placemarks = xmlDoc.getElementsByTagName('Placemark');
    const parsedCoords: [number, number][] = [];
    const poleNames: string[] = [];

    if (placemarks.length > 0) {
      for (let i = 0; i < placemarks.length; i++) {
        const pm = placemarks[i];
        const coordNode = pm.getElementsByTagName('coordinates')[0];
        if (coordNode) {
          const text = coordNode.textContent || '';
          const rawTokens = text.trim().split(/\s+/);
          rawTokens.forEach((token) => {
            const parts = token.split(',').map(Number);
            if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
              const lng = parts[0];
              const lat = parts[1];
              if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
                parsedCoords.push([lat, lng]);
                const pmName = pm.querySelector('name')?.textContent?.trim();
                const sequenceNum = parsedCoords.length;
                poleNames.push(pmName || `${feederName}-${sequenceNum}`);
              }
            }
          });
        }
      }
    }

    // Fallback if no placemarks with coordinates were found
    if (parsedCoords.length === 0) {
      const coordNodes = xmlDoc.getElementsByTagName('coordinates');
      for (let i = 0; i < coordNodes.length; i++) {
        const text = coordNodes[i].textContent || '';
        const rawTokens = text.trim().split(/\s+/);
        rawTokens.forEach((token) => {
          const parts = token.split(',').map(Number);
          if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
            const lng = parts[0];
            const lat = parts[1];
            if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
              parsedCoords.push([lat, lng]);
              poleNames.push(`${feederName}-${parsedCoords.length}`);
            }
          }
        });
      }
    }

    const colors = ['#10b981', '#3b82f6', '#a855f7', '#f59e0b', '#ec4899', '#06b6d4', '#f97316'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    let finalCoords = parsedCoords;
    let finalPoleNames = poleNames;

    if (finalCoords.length === 0) {
      const baseLat = -3.63 + (Math.random() - 0.5) * 0.04;
      const baseLng = 128.23 + (Math.random() - 0.5) * 0.04;
      finalCoords = [
        [baseLat, baseLng],
        [baseLat + 0.006, baseLng + 0.009],
        [baseLat + 0.013, baseLng + 0.016],
        [baseLat + 0.019, baseLng + 0.024]
      ];
      finalPoleNames = finalCoords.map((_, i) => `${feederName}-${i + 1}`);
    }

    return {
       id: `imported_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
       nama: feederName,
       tiangCount: finalCoords.length,
       ruteLength: `${finalCoords.length} Titik Tiang`,
       tanggalImport: new Date().toLocaleDateString('id-ID'),
       kategori: 'Inspeksi',
       visible: true,
       color: randomColor,
       coordinates: finalCoords,
       poleNames: finalPoleNames
     };
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setImportFiles(files);
    setShowImportModal(true);
  };

  const processImportFiles = async () => {
    if (!importFiles || importFiles.length === 0) return;

    setFileImporting(true);
    try {
      for (let i = 0; i < importFiles.length; i++) {
        const file = importFiles[i];
        const nameLower = file.name.toLowerCase();
        let layer: MapLayerItem;

        if (nameLower.endsWith('.kmz') || nameLower.endsWith('.zip')) {
          const zip = await JSZip.loadAsync(file);
          const kmlFileName = Object.keys(zip.files).find((fn) => fn.toLowerCase().endsWith('.kml'));
          if (kmlFileName) {
            const kmlText = await zip.files[kmlFileName].async('text');
            layer = parseKMLText(kmlText, file.name);
          } else {
            layer = parseKMLText('', file.name);
          }
        } else {
          const text = await file.text();
          layer = parseKMLText(text, file.name);
        }

        // Attach master data metadata
        layer.ulp = importUlp;
        layer.kodeUnit = importKodeUnit;
        layer.namaPenyulang = importPenyulang || layer.nama;
        if (importPenyulang) {
          layer.nama = importPenyulang;
        }

        onAddLayer(layer);
        handleLocateLayer(layer);
      }
    } catch (err) {
      console.error('Error importing KML/KMZ file:', err);
    } finally {
      setFileImporting(false);
      setShowImportModal(false);
      setImportFiles(null);
      setImportUlp('');
      setImportKodeUnit('');
      setImportPenyulang('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Sample Generator
  const handleSimulateImport = () => {
    setFileImporting(true);
    setTimeout(() => {
      const names = ['WAIHERU 1', 'PASSO 2', 'HUTUMURI EXT', 'LATERI 3', 'MCM UTAMA'];
      const randomName = names[Math.floor(Math.random() * names.length)];
      const colors = ['#10b981', '#3b82f6', '#a855f7', '#f59e0b', '#ec4899'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      const categories: ('Inspeksi' | 'Maintenance')[] = ['Inspeksi', 'Maintenance'];
      const randomCat = categories[Math.floor(Math.random() * categories.length)];

      const baseLat = -3.63 + (Math.random() - 0.5) * 0.05;
      const baseLng = 128.23 + (Math.random() - 0.5) * 0.05;

      const tiangCount = Math.floor(Math.random() * 25) + 10;
      const newLayer: MapLayerItem = {
        id: `imported_${Date.now()}`,
        nama: randomName,
        tiangCount: tiangCount,
        ruteLength: `${tiangCount} Titik Tiang`,
        tanggalImport: new Date().toLocaleDateString('id-ID'),
        kategori: randomCat,
        visible: true,
        color: randomColor,
        coordinates: [
          [baseLat, baseLng],
          [baseLat + 0.005, baseLng + 0.008],
          [baseLat + 0.012, baseLng + 0.015],
          [baseLat + 0.018, baseLng + 0.022]
        ],
        poleNames: Array.from({ length: 4 }).map((_, i) => `${randomName}-${i + 1}`)
      };

      onAddLayer(newLayer);
      setFileImporting(false);
      handleLocateLayer(newLayer);
    }, 400);
  };

  const filteredLayers = layers.filter((layer) => {
    const matchesSearch = (layer.nama || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'Semua' || layer.kategori === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const handleSaveMarkerModal = (modalData: {
    layerId: string;
    layerName: string;
    nodeIndex: number;
    poleName: string;
    coord: [number, number];
    currentIcon: string;
    currentStatus: string;
  }) => {
    const { layerId, nodeIndex, poleName, currentIcon, currentStatus } = modalData;
    const key = `${layerId}_${nodeIndex}`;

    // 1. Update local state
    setNodeIcons((prev) => {
      const next = { ...prev };
      if (currentIcon === 'RESET') {
        delete next[key];
      } else {
        next[key] = currentIcon;
      }
      return next;
    });

    setManualStatuses((prev) => {
      const next = { ...prev };
      if (currentStatus === 'PENYULANG' || currentStatus === 'NORMAL') {
        delete next[key];
      } else {
        next[key] = currentStatus as any;
      }
      return next;
    });

    // 2. Prepare updated layer and save to Firestore real-time
    const targetLayer = layers.find((l) => l.id === layerId);
    if (targetLayer && onUpdateLayer) {
      const nextCustomIcons = { ...(targetLayer.customIcons || {}) };
      if (currentIcon === 'RESET') {
        delete nextCustomIcons[nodeIndex.toString()];
      } else {
        nextCustomIcons[nodeIndex.toString()] = currentIcon;
      }

      const nextCustomStatuses = { ...(targetLayer.customStatuses || {}) };
      if (currentStatus === 'PENYULANG' || currentStatus === 'NORMAL') {
        delete nextCustomStatuses[nodeIndex.toString()];
      } else {
        nextCustomStatuses[nodeIndex.toString()] = currentStatus;
      }

      const updatedPoleNames = [...(targetLayer.poleNames || [])];
      while (updatedPoleNames.length <= nodeIndex) {
        updatedPoleNames.push(`${targetLayer.nama}-${updatedPoleNames.length + 1}`);
      }
      updatedPoleNames[nodeIndex] = poleName;

      const updatedLayer: MapLayerItem = {
        ...targetLayer,
        customIcons: nextCustomIcons,
        customStatuses: nextCustomStatuses,
        poleNames: updatedPoleNames
      };

      onUpdateLayer(updatedLayer);
    }

    setEditingMarkerModal(null);
  };

  return (
    <div className="relative w-full h-[calc(100vh-3.5rem)] flex overflow-hidden bg-slate-50 font-sans">
      
      {/* Hidden File Input for KML / KMZ */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".kml,.kmz,.xml,.zip"
        onChange={handleFileUpload}
        multiple
        className="hidden"
      />

      {/* Left Overlay Control Panel */}
      <div className="w-80 md:w-96 bg-white/95 backdrop-blur-xl border-r border-slate-200 flex flex-col justify-between shrink-0 z-10 shadow-lg overflow-hidden">
        
        {/* Panel Header */}
        <div className="p-4 border-b border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-600" />
              PETA SEBARAN JARINGAN
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold text-[10px]">
              {filteredLayers.length} Feeder
            </span>
          </div>

          {/* Action Import Buttons */}
          <div className="grid grid-cols-3 gap-1.5">
            <button
              onClick={triggerFileInput}
              disabled={fileImporting}
              className="col-span-1 py-1.5 px-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer shadow-sm shadow-blue-500/20"
              title="Pilih file KML / KMZ dari perangkat"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{fileImporting ? '...' : '+ Impor'}</span>
            </button>
            <button
              onClick={triggerFileInput}
              className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
              title="Upload File Format .KML"
            >
              <FileCode className="w-3 h-3 text-emerald-600" />
              .KML
            </button>
            <button
              onClick={triggerFileInput}
              className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
              title="Upload File Format .KMZ (Zip)"
            >
              <FileCode className="w-3 h-3 text-blue-600" />
              .KMZ
            </button>
          </div>

          {/* Search & Category Filter Box */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari file feeder import..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none text-[10px] font-bold">
              {(['Semua', 'ROW', 'Inspeksi', 'Maintenance'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg border transition-all shrink-0 cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Feeder Import Layer List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          <div className="flex items-center justify-between px-1 mb-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              PETA FEEDER ({filteredLayers.length} FILE)
            </span>
            <div className="flex items-center gap-2">
              {filteredLayers.length > 0 && (
                <button
                  onClick={() => {
                    const allVis = filteredLayers.every((l) => l.visible);
                    filteredLayers.forEach((l) => {
                      if (l.visible === allVis) {
                        onToggleLayer(l.id);
                      }
                    });
                  }}
                  className="text-[10px] font-bold text-slate-600 hover:text-blue-600 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded-md transition-colors cursor-pointer flex items-center gap-1"
                  title="Toggle Tampilkan / Sembunyikan Semua Layer"
                >
                  {filteredLayers.every((l) => l.visible) ? (
                    <>
                      <EyeOff className="w-3 h-3 text-slate-500" /> Sembunyikan Semua
                    </>
                  ) : (
                    <>
                      <Eye className="w-3 h-3 text-blue-600" /> Tampilkan Semua
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {filteredLayers.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              Tidak ada lokasi feeder cocok.
            </div>
          ) : (
            filteredLayers.map((layer) => {
              const LayerIcon = getLayerIconComponent(layer.iconType);
              return (
                <div
                  key={layer.id}
                  className={`p-2.5 rounded-xl border transition-all flex items-center justify-between gap-2 ${
                    layer.visible
                      ? 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                      : 'bg-slate-50 border-slate-100 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {/* Toggle Switch Visibility */}
                    <button
                      onClick={() => onToggleLayer(layer.id)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        layer.visible ? 'bg-blue-600' : 'bg-slate-300'
                      }`}
                      title={layer.visible ? 'Sembunyikan Layer' : 'Tampilkan Layer'}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                          layer.visible ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>

                    {/* Color Pill & Icon */}
                    <button
                      onClick={() => setEditingLayer(layer)}
                      className="w-4 h-4 rounded-full shrink-0 shadow-xs ring-2 ring-white flex items-center justify-center hover:scale-110 transition-transform cursor-pointer"
                      style={{ backgroundColor: layer.color || '#3b82f6' }}
                      title="Klik untuk mengubah warna atau ikon layer"
                    />

                    {/* Text Details */}
                    <div className="min-w-0 flex-1">
                      <h3 className="text-xs font-bold text-slate-800 truncate leading-tight flex items-center gap-1.5">
                        <LayerIcon className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span className="truncate">{layer.nama}</span>
                      </h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] text-slate-500 truncate">
                          {layer.ruteLength || 'Feeder Line'}
                        </span>
                        {layer.kategori && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 uppercase">
                            {layer.kategori}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                {/* Right Actions: Edit, Center & Delete */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => setEditingLayer(layer)}
                    className="p-1 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-blue-600 transition-colors cursor-pointer"
                    title="Edit File Peta"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleLocateLayer(layer)}
                    className="p-1 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-blue-600 transition-colors cursor-pointer"
                    title="Fokus ke Peta"
                  >
                    <Target className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDeleteLayer(layer.id)}
                    className="p-1 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                    title="Hapus Layer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
        </div>
      </div>

      {/* Main Map Container */}
      <div className="relative flex-1 h-full">
        {/* Leaflet Map Div */}
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Top Floating Status Indicator Overlay */}
        <div className="absolute top-4 left-4 z-10 hidden md:flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-900/90 text-white backdrop-blur-md border border-slate-700/80 rounded-2xl shadow-xl font-sans text-xs">
          <div className="px-2.5 py-1 rounded-xl bg-slate-800 border border-slate-700 flex items-center gap-1.5 text-[11px]">
            <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span className="font-bold">Klik Tiang di Peta:</span>
          </div>

          {/* Biru: Penyulang */}
          <div className="px-2.5 py-1 rounded-xl bg-blue-500/20 text-blue-300 border border-blue-500/40 flex items-center gap-1.5 font-bold text-[11px]">
            <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></span>
            <span>Penyulang</span>
          </div>

          {/* Hijau: Pohon */}
          <div className={`px-2.5 py-1 rounded-xl flex items-center gap-1.5 font-bold text-[11px] ${
            Object.values(manualStatuses).filter(s => s === 'POHON').length > 0
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'bg-slate-800 text-slate-400'
          }`}>
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
            <span>Pohon</span>
          </div>

          {/* Ungu: Temuan Konstruksi */}
          <div className={`px-2.5 py-1 rounded-xl flex items-center gap-1.5 font-bold text-[11px] ${
            Object.values(manualStatuses).filter(s => s === 'KONSTRUKSI').length > 0
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
              : 'bg-slate-800 text-slate-400'
          }`}>
            <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0"></span>
            <span>Konstruksi</span>
          </div>

          {/* Merah: Gangguan */}
          <div className={`px-2.5 py-1 rounded-xl flex items-center gap-1.5 font-bold text-[11px] ${
            Object.values(manualStatuses).filter(s => s === 'GANGGUAN').length > 0
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
              : 'bg-slate-800 text-slate-400'
          }`}>
            <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span>
            <span>Gangguan</span>
          </div>

          {/* Oranye: Pemeliharaan */}
          <div className={`px-2.5 py-1 rounded-xl flex items-center gap-1.5 font-bold text-[11px] ${
            Object.values(manualStatuses).filter(s => s === 'PEMELIHARAAN').length > 0
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              : 'bg-slate-800 text-slate-400'
          }`}>
            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span>
            <span>Pemeliharaan</span>
          </div>

          {Object.keys(manualStatuses).length > 0 && (
            <button
              onClick={() => setManualStatuses({})}
              className="px-2 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all text-[10px] font-bold cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>

        {/* Top Right Controls: Map Base Style Only */}
        <div className="absolute top-4 right-4 z-10 flex flex-wrap items-center gap-2">
          {/* Map Base Style Selector */}
          <div className="flex items-center gap-1 p-1 bg-white/95 backdrop-blur-md border border-slate-200 rounded-xl shadow-md">
            <button
              onClick={() => setMapStyle('dark')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                mapStyle === 'dark'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Moon className="w-3.5 h-3.5" /> Dark
            </button>
            <button
              onClick={() => setMapStyle('satellite')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                mapStyle === 'satellite'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Globe className="w-3.5 h-3.5" /> Satelit
            </button>
            <button
              onClick={() => setMapStyle('street')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                mapStyle === 'street'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" /> Street Map
            </button>
          </div>
        </div>
      </div>

      {/* Edit File Layer Modal */}
      {editingLayer && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
                  <Pencil className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Edit File Peta Feeder</h3>
                  <p className="text-[11px] text-slate-500">Ubah atribut layer penyulang / KML</p>
                </div>
              </div>
              <button
                onClick={() => setEditingLayer(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (editingLayer) {
                  if (onUpdateLayer) onUpdateLayer(editingLayer);
                  setEditingLayer(null);
                }
              }}
              className="p-5 space-y-4"
            >
              {/* Nama Feeder / File */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Feeder / Layer Peta
                </label>
                <input
                  type="text"
                  value={editingLayer.nama}
                  onChange={(e) => setEditingLayer({ ...editingLayer, nama: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              {/* Kategori */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Kategori Feeder
                </label>
                <select
                  value={editingLayer.kategori}
                  onChange={(e) => setEditingLayer({ ...editingLayer, kategori: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-bold focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="Utama">Penyulang Utama</option>
                  <option value="Percabangan">Penyulang Percabangan</option>
                  <option value="Inspeksi">Inspeksi Jaringan</option>
                  <option value="Maintenance">Maintenance / Pemeliharaan</option>
                  <option value="ROW">Perintisan Pohon (ROW)</option>
                </select>
              </div>

              {/* Pemilihan Icon Marker Feeder */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Pemilihan Icon Marker Feeder
                </label>
                <div className="grid grid-cols-4 gap-2 max-h-60 overflow-y-auto p-1">
                  {[
                    { id: 'zap', label: 'Feeder (Zap)', icon: Zap },
                    { id: 'tiang-single', label: 'Tiang Listrik', icon: IconTiangSingleCrossarm },
                    { id: 'tiang-double', label: 'Tiang 2 Travers', icon: IconTiangDoubleCrossarm },
                    { id: 'gardu-trafo', label: 'Gardu Trafo', icon: IconGarduTrafo },
                    { id: 'gardu-beton', label: 'Gardu Beton', icon: IconGarduBeton },
                    { id: 'gardu-cantol', label: 'Gardu Cantol', icon: IconGarduPortal },
                    { id: 'gardu-portal', label: 'Gardu Portal', icon: IconTiangPortal3Pole },
                    { id: 'git-branch', label: 'Percabangan', icon: GitBranch },
                    { id: 'map-pin', label: 'Titik Lokasi', icon: MapPin },
                    { id: 'building', label: 'Gardu GI', icon: Building2 },
                    { id: 'gardu-dist', label: 'Gardu Dist.', icon: Cpu },
                    { id: 'lbs', label: 'LBS (Switch)', icon: ToggleRight },
                    { id: 'pmcb', label: 'PMCB / PMT', icon: Power },
                    { id: 'recloser', label: 'Recloser', icon: RotateCcw },
                    { id: 'trees', label: 'ROW / Pohon', icon: Trees },
                    { id: 'wrench', label: 'Har / Maint.', icon: Wrench },
                    { id: 'activity', label: 'Status / Trip', icon: Activity },
                    { id: 'shield', label: 'Proteksi', icon: Shield }
                  ].map((item) => {
                    const IconComponent = item.icon;
                    const isSelected = (editingLayer.iconType || 'zap') === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setEditingLayer({ ...editingLayer, iconType: item.id })}
                        className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50 border-blue-600 text-blue-700 font-bold ring-2 ring-blue-500/30'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                        title={item.label}
                      >
                        <IconComponent className="w-4 h-4" />
                        <span className="text-[10px] truncate max-w-full">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Warna Marker Titik */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Warna Marker Titik Peta
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {[
                    { color: '#22c55e', label: 'Hijau (Pohon / ROW)' },
                    { color: '#3b82f6', label: 'Biru (Penyulang Utama)' },
                    { color: '#a855f7', label: 'Ungu (Temuan Konstruksi)' },
                    { color: '#f59e0b', label: 'Kuning / Amber' },
                    { color: '#ec4899', label: 'Pink' },
                    { color: '#06b6d4', label: 'Cyan' },
                    { color: '#f97316', label: 'Oranye (Pemeliharaan)' },
                    { color: '#ef4444', label: 'Merah (Lokasi Gangguan)' }
                  ].map((c) => (
                    <button
                      key={c.color}
                      type="button"
                      onClick={() => setEditingLayer({ ...editingLayer, color: c.color })}
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                        editingLayer.color === c.color ? 'ring-2 ring-offset-2 ring-slate-800 scale-110' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: c.color }}
                      title={c.label}
                    >
                      {editingLayer.color === c.color && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Detail Rute / Tiang */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Keterangan Jumlah Titik
                </label>
                <input
                  type="text"
                  value={editingLayer.ruteLength}
                  onChange={(e) => setEditingLayer({ ...editingLayer, ruteLength: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              {/* Form Buttons */}
              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingLayer(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-blue-500/20 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDIT MARKER INDIVIDUAL DENGAN REAL-TIME FIRESTORE */}
      {editingMarkerModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-600/30 text-blue-400 border border-blue-500/30">
                  <Pencil className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-white flex items-center gap-2">
                    Edit Marker Individual
                    <span className="px-2 py-0.5 rounded bg-blue-600/40 text-blue-200 text-xs font-mono font-bold">
                      Titik #{editingMarkerModal.nodeIndex + 1}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Feeder: <span className="text-amber-400 font-semibold">{editingMarkerModal.layerName}</span> | {editingMarkerModal.coord[0].toFixed(5)}, {editingMarkerModal.coord[1].toFixed(5)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingMarkerModal(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4">
              {/* Input ID / Nama Tiang */}
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                  🏷️ ID / Nama Tiang Listrik:
                </label>
                <input
                  type="text"
                  value={editingMarkerModal.poleName}
                  onChange={(e) => setEditingMarkerModal({ ...editingMarkerModal, poleName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 font-bold text-slate-800 text-sm outline-none transition-all"
                  placeholder="Contoh: BGL-12A"
                />
              </div>

              {/* Opsi Icon Marker */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">
                    🎨 Opsi Icon Marker Titik:
                  </label>
                  <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                    Aktif: {editingMarkerModal.currentIcon.toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-56 overflow-y-auto p-1 bg-slate-50 rounded-xl border border-slate-200">
                  {[
                    { id: 'tiang-single', label: 'Tiang 1 Travers', icon: IconTiangSingleCrossarm },
                    { id: 'tiang-double', label: 'Tiang 2 Travers', icon: IconTiangDoubleCrossarm },
                    { id: 'gardu-trafo', label: 'Gardu Trafo GTT', icon: IconGarduTrafo },
                    { id: 'gardu-beton', label: 'Gardu Beton', icon: IconGarduBeton },
                    { id: 'gardu-cantol', label: 'Gardu Cantol', icon: IconGarduPortal },
                    { id: 'gardu-portal', label: 'Gardu Portal 3 Pole', icon: IconTiangPortal3Pole },
                    { id: 'lbs', label: 'LBS Switch', icon: ToggleRight },
                    { id: 'recloser', label: 'Recloser', icon: RotateCcw },
                    { id: 'pmcb', label: 'PMCB Saklar', icon: Power },
                    { id: 'git-branch', label: 'Cabang Feeder', icon: GitBranch },
                    { id: 'map-pin', label: 'Titik Lokasi', icon: MapPin },
                    { id: 'building', label: 'Gardu GI', icon: Building2 },
                    { id: 'gardu-dist', label: 'Gardu Distribusi', icon: Cpu },
                    { id: 'trees', label: 'Pohon ROW', icon: Trees },
                    { id: 'wrench', label: 'Pemeliharaan', icon: Wrench },
                    { id: 'activity', label: 'Lokasi Gangguan', icon: Activity },
                    { id: 'shield', label: 'Proteksi', icon: Shield },
                    { id: 'zap', label: 'Zap Feeder', icon: Zap }
                  ].map((iconItem) => {
                    const IconComponent = iconItem.icon;
                    const isSelected = editingMarkerModal.currentIcon === iconItem.id;
                    return (
                      <button
                        key={iconItem.id}
                        type="button"
                        onClick={() => setEditingMarkerModal({ ...editingMarkerModal, currentIcon: iconItem.id })}
                        className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer text-center ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-700 shadow-md scale-[1.02] font-black'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-blue-400 hover:bg-blue-50/50'
                        }`}
                      >
                        <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-800'}`}>
                          <IconComponent className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-bold leading-tight">{iconItem.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Opsi Status / Highlight Warna */}
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                  🚦 Status Condition / Highlight Warna Peta:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'PENYULANG', label: '📍 Sesuai Warna Layer', bg: 'bg-slate-100 text-slate-800 border-slate-300' },
                    { id: 'POHON', label: '🌳 Temuan Pohon (Hijau)', bg: 'bg-emerald-50 text-emerald-800 border-emerald-300' },
                    { id: 'KONSTRUKSI', label: '🏗️ Temuan Konstruksi (Ungu)', bg: 'bg-purple-50 text-purple-800 border-purple-300' },
                    { id: 'GANGGUAN', label: '⚡ Lokasi Gangguan (Merah)', bg: 'bg-rose-50 text-rose-800 border-rose-300' },
                    { id: 'PEMELIHARAAN', label: '🔧 Pemeliharaan (Oranye)', bg: 'bg-amber-50 text-amber-800 border-amber-300' }
                  ].map((statusOpt) => {
                    const isSelected = editingMarkerModal.currentStatus === statusOpt.id;
                    return (
                      <button
                        key={statusOpt.id}
                        type="button"
                        onClick={() => setEditingMarkerModal({ ...editingMarkerModal, currentStatus: statusOpt.id })}
                        className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                          isSelected
                            ? 'ring-2 ring-blue-600 font-black shadow-xs ' + statusOpt.bg
                            : 'hover:bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        <span className={`w-3 h-3 rounded-full shrink-0 ${isSelected ? 'scale-110' : 'opacity-60'}`} />
                        <span>{statusOpt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setEditingMarkerModal({
                    ...editingMarkerModal,
                    currentIcon: 'RESET',
                    currentStatus: 'PENYULANG'
                  });
                }}
                className="px-3 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-200 hover:bg-slate-300 rounded-xl transition-all cursor-pointer"
              >
                🔄 Reset Ke Default Layer
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingMarkerModal(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveMarkerModal(editingMarkerModal)}
                  className="px-5 py-2 text-xs font-black text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  Simpan Real-Time
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Import Modal */}
      {showImportModal && importFiles && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowImportModal(false)}></div>
          <div className="bg-white w-[500px] max-w-[95vw] rounded-2xl shadow-2xl flex flex-col overflow-hidden relative z-10 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-blue-600 px-5 py-4 flex items-center justify-between">
              <h3 className="font-black text-white flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Input Data Peta Penyulang
              </h3>
              <button 
                onClick={() => setShowImportModal(false)}
                className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col gap-1">
                <span className="text-xs font-bold text-slate-500 uppercase">File Terpilih:</span>
                <span className="text-sm font-semibold text-slate-800 break-all">{importFiles[0]?.name} {importFiles.length > 1 ? `(+${importFiles.length - 1} lainnya)` : ''}</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  ULP (Sinkron Master Data Unit) <span className="text-red-500">*</span>
                </label>
                <select 
                  value={importUlp}
                  onChange={(e) => setImportUlp(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                >
                  <option value="">-- Pilih ULP --</option>
                  {Array.from(new Set(masterUnits.map(u => u.ulp))).map(ulp => (
                    <option key={ulp} value={ulp}>{ulp}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Kode Unit (Sinkron Master Data Unit) <span className="text-red-500">*</span>
                </label>
                <select 
                  value={importKodeUnit}
                  onChange={(e) => setImportKodeUnit(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                >
                  <option value="">-- Pilih Kode Unit --</option>
                  {Array.from(new Set(masterUnits.map(u => u.kodeUlp))).map(kode => (
                    <option key={kode} value={kode}>{kode}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Nama Penyulang (Sinkron Master Data) <span className="text-red-500">*</span>
                </label>
                <select 
                  value={importPenyulang}
                  onChange={(e) => setImportPenyulang(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                >
                  <option value="">-- Pilih Nama Penyulang --</option>
                  {masterPenyulangs.map(p => (
                    <option key={p.id} value={p.namaPenyulang}>{p.namaPenyulang}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={processImportFiles}
                disabled={fileImporting || !importUlp || !importKodeUnit || !importPenyulang}
                className="px-5 py-2 text-sm font-black text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2"
              >
                {fileImporting ? (
                  <span className="animate-pulse">Memproses...</span>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Simpan & Impor Peta
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
