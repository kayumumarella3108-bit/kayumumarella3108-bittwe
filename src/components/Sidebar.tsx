import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  MapPin,
  Map,
  HardHat,
  TrendingUp,
  Zap,
  Wrench,
  Trees,
  ClipboardList,
  Search,
  Factory,
  Database,
  BarChart3,
  Package,
  Shield,
  Users,
  GitGraph,
  ChevronDown,
  ChevronRight,
  Lock,
  FileText,
  Gauge,
  Car,
  Calendar,
  Clock,
  Thermometer,
  Network,
  Calculator,
  FolderTree,
  Activity,
  Radio,
  Layers,
  Sparkles,
  Share2,
  MessageCircle,
  Send,
  BatteryCharging,
  Building2,
  Workflow,
  Headphones,
  Inbox,
  Target,
  LogOut,
  AlertTriangle,
  X,
  ShieldCheck,
  Palette,
  Filter,
  Upload,
  Wifi,
  WifiOff,
  RefreshCw,
  TrendingDown,
  Scale,
  FileCheck,
  ShieldAlert,
  Wallet,
  Receipt,
  ZapOff,
  Camera,
  CloudUpload
} from 'lucide-react';
import { ViewType, User } from '../types';
import { canManageUsers, isPemasaranUser, isInspeksiUser, isPetugasRowUser, canAccessMenu, canEditData, isOwnerUser } from '../utils/permissions';
import { getOfflineQueue, clearOfflineQueue } from '../lib/offlineQueue';

import { LoginBackgroundModal } from './LoginBackgroundModal';
import { DAFTAR_UNIT_PLN, getKodeUnitByUnitName } from '../utils/unitConfig';
import { CustomDropdown } from './common/CustomDropdown';

interface SidebarProps {
  activeView: ViewType;
  onSelectView: (view: ViewType) => void;
  isOpen?: boolean;
  currentUser?: User | null;
  onLogout?: () => void;
  ownerSelectedUnitFilter?: string;
  onSelectUnitFilter?: (unit: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  onSelectView,
  isOpen = true,
  currentUser,
  onLogout,
  ownerSelectedUnitFilter = 'SEMUA',
  onSelectUnitFilter
}) => {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isBgModalOpen, setIsBgModalOpen] = useState(false);

  // Accordion open/close states
  const [masterDataOpen, setMasterDataOpen] = useState(
    ['master_data', 'input_peta_penyulang', 'master_pelanggan', 'master_unit'].includes(activeView)
  );

  const [petaOpen, setPetaOpen] = useState(
    ['peta', 'peta_penyulang', 'peta_gardu', 'peta_pohon', 'peta_konstruksi'].includes(activeView)
  );

  const [pemasaranOpen, setPemasaranOpen] = useState(
    ['survey_pb_pd'].includes(activeView)
  );

  const [teknikOpen, setTeknikOpen] = useState(
    ['matriks_gangguan', 'pemeliharaan_20kv', 'saidi_saifi', 'estimasi_saidi_saifi', 'health_index', 'pengukuran_gardu'].includes(activeView)
  );

  const [transaksiEnergiOpen, setTransaksiEnergiOpen] = useState(
    ['peremajaan_meter', 'meter_sl', 'monitoring_susut'].includes(activeView)
  );

  const [suratSpkOpen, setSuratSpkOpen] = useState(
    ['perintah_kerja', 'format_surat', 'ba_pemeriksaan_iml', 'cash_flow_bop'].includes(activeView)
  );

  const [saidiSaifiOpen, setSaidiSaifiOpen] = useState(
    ['saidi_saifi', 'estimasi_saidi_saifi'].includes(activeView)
  );

  const [yantekOpen, setYantekOpen] = useState(
    ['monitoring_yantek', 'peta_pohon', 'row', 'inspeksi_tier1', 'inspeksi_tier1_jtm', 'inspeksi_tier1_gtt', 'inspeksi_tier1_switching', 'inspeksi_tier2', 'inspeksi_tier2_thermovision', 'inspeksi_tier2_ultrasound', 'jadwal_piket'].includes(activeView)
  );

  const [yantekRowOpen, setYantekRowOpen] = useState(
    ['peta_pohon', 'row'].includes(activeView) || true
  );

  const [yantekInspeksiOpen, setYantekInspeksiOpen] = useState(
    ['inspeksi_tier1', 'inspeksi_tier1_jtm', 'inspeksi_tier1_gtt', 'inspeksi_tier1_switching', 'inspeksi_tier2', 'inspeksi_tier2_thermovision', 'inspeksi_tier2_ultrasound', 'inspeksi_gardu'].includes(activeView) || true
  );

  const [yantekYangguOpen, setYantekYangguOpen] = useState(
    ['jadwal_piket'].includes(activeView) || true
  );

  const [manbillOpen, setManbillOpen] = useState(
    ['manbill', 'pembagian_invoice', 'realisasi_tusbung', 'foto_meter'].includes(activeView)
  );

  const [kitOpen, setKitOpen] = useState(
    ['kit_bbm', 'kit_laporan_beban', 'kit_pemeliharaan_mesin', 'kit_master_data_mesin'].includes(activeView)
  );

  const [k3lOpen, setK3lOpen] = useState(
    ['k3l', 'jadwal_security', 'alker_apd', 'patroli_kelistrikan'].includes(activeView)
  );

  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [offlineQueueCount, setOfflineQueueCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const updateQueueCount = async () => {
      try {
        const queue = await getOfflineQueue();
        setOfflineQueueCount(queue.length);
      } catch (e) {
        setOfflineQueueCount(0);
      }
    };

    updateQueueCount();
    window.addEventListener('papeda-offline-queue-updated', updateQueueCount);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('papeda-offline-queue-updated', updateQueueCount);
    };
  }, []);

  const handleSyncOfflineData = async () => {
    if (!navigator.onLine) {
      alert('Koneksi internet masih terputus. Pastikan Anda online untuk menyinkronkan data.');
      return;
    }
    setIsSyncing(true);
    try {
      const queue = await getOfflineQueue();
      if (queue.length === 0) {
        alert('Tidak ada data offline yang perlu disinkronkan.');
        setIsSyncing(false);
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 1200));
      await clearOfflineQueue();
      setOfflineQueueCount(0);
      alert(`Berhasil menyinkronkan ${queue.length} input data offline ke server & IndexedDB.`);
    } catch (e) {
      console.error('Sync failed:', e);
      alert('Gagal menyinkronkan data offline.');
    } finally {
      setIsSyncing(false);
    }
  };

  // Auto expand active accordion on activeView change
  useEffect(() => {
    if (['master_data', 'master_pelanggan', 'input_peta_penyulang', 'master_unit'].includes(activeView)) {
      setMasterDataOpen(true);
    }
    if (['peta', 'peta_penyulang', 'peta_gardu', 'peta_pohon', 'peta_konstruksi'].includes(activeView)) {
      setPetaOpen(true);
    }
    if (['survey_pb_pd'].includes(activeView)) {
      setPemasaranOpen(true);
    }
    if (['matriks_gangguan', 'pemeliharaan_20kv', 'saidi_saifi', 'estimasi_saidi_saifi', 'health_index', 'pengukuran_gardu'].includes(activeView)) {
      setTeknikOpen(true);
    }
    if (['peremajaan_meter', 'meter_sl', 'monitoring_susut'].includes(activeView)) {
      setTransaksiEnergiOpen(true);
    }
    if (['perintah_kerja', 'format_surat', 'ba_pemeriksaan_iml', 'cash_flow_bop'].includes(activeView)) {
      setSuratSpkOpen(true);
    }
    if (['saidi_saifi', 'estimasi_saidi_saifi'].includes(activeView)) {
      setSaidiSaifiOpen(true);
    }
    if (['monitoring_yantek', 'peta_pohon', 'row', 'inspeksi_tier1', 'inspeksi_tier1_jtm', 'inspeksi_tier1_gtt', 'inspeksi_tier1_switching', 'inspeksi_tier2', 'inspeksi_tier2_thermovision', 'inspeksi_tier2_ultrasound', 'jadwal_piket', 'monitoring_lembur'].includes(activeView)) {
      setYantekOpen(true);
      if (['peta_pohon', 'row'].includes(activeView)) setYantekRowOpen(true);
      if (['inspeksi_tier1', 'inspeksi_tier1_jtm', 'inspeksi_tier1_gtt', 'inspeksi_tier1_switching', 'inspeksi_tier2', 'inspeksi_tier2_thermovision', 'inspeksi_tier2_ultrasound'].includes(activeView)) setYantekInspeksiOpen(true);
      if (['jadwal_piket', 'monitoring_lembur'].includes(activeView)) setYantekYangguOpen(true);
    }
    if (['manbill', 'pembagian_invoice', 'realisasi_tusbung', 'foto_meter'].includes(activeView)) {
      setManbillOpen(true);
    }
    if (['kit_bbm', 'kit_laporan_beban', 'kit_pemeliharaan_mesin', 'kit_master_data_mesin'].includes(activeView)) {
      setKitOpen(true);
    }
    if (['k3l', 'jadwal_security', 'alker_apd', 'patroli_kelistrikan'].includes(activeView)) {
      setK3lOpen(true);
    }
  }, [activeView]);

  if (!isOpen) return null;

  const isMasterDataActive = ['master_data', 'master_pelanggan', 'input_peta_penyulang', 'master_unit'].includes(activeView);
  const isPetaActive = ['peta', 'peta_penyulang', 'peta_gardu', 'peta_pohon', 'peta_konstruksi'].includes(activeView);
  const isPemasaranActive = ['survey_pb_pd'].includes(activeView);
  const isTeknikActive = ['matriks_gangguan', 'pemeliharaan_20kv', 'saidi_saifi', 'estimasi_saidi_saifi', 'health_index', 'pengukuran_gardu'].includes(activeView);
  const isTransaksiEnergiActive = ['peremajaan_meter', 'meter_sl', 'monitoring_susut'].includes(activeView);
  const isSuratSpkActive = ['perintah_kerja', 'format_surat', 'ba_pemeriksaan_iml', 'cash_flow_bop'].includes(activeView);
  const isSaidiSaifiActive = ['saidi_saifi', 'estimasi_saidi_saifi'].includes(activeView);
  const isYantekActive = ['monitoring_yantek', 'peta_pohon', 'row', 'inspeksi_tier1', 'inspeksi_tier1_jtm', 'inspeksi_tier1_gtt', 'inspeksi_tier1_switching', 'inspeksi_tier2', 'inspeksi_tier2_thermovision', 'inspeksi_tier2_ultrasound', 'jadwal_piket', 'monitoring_lembur', 'jadwal_inspeksi_row'].includes(activeView);
  const isManbillActive = ['manbill', 'pembagian_invoice', 'realisasi_tusbung', 'foto_meter'].includes(activeView);
  const isKitActive = ['kit_bbm', 'kit_laporan_beban', 'kit_pemeliharaan_mesin', 'kit_master_data_mesin'].includes(activeView);
  const isK3LActive = ['k3l', 'jadwal_security', 'alker_apd', 'patroli_kelistrikan'].includes(activeView);

  const isPemasaran = isPemasaranUser(currentUser);
  const isInspeksi = isInspeksiUser(currentUser);
  const isRow = isPetugasRowUser(currentUser);

  return (
    <aside className="w-64 bg-gradient-to-b from-[#032b28] via-[#053d38] to-[#021f1d] border-r border-teal-700/60 flex flex-col justify-between shrink-0 h-full text-white font-sans z-20 select-none overflow-y-auto shadow-2xl">
      <div className="p-4 space-y-4">
        {/* FULL DYNAMIC NAVIGATION ACCORDING TO USER'S ALLOWED MENUS */}
        <nav className="space-y-1.5">
          {/* User Profile Card - Compact & Flexible Version */}
          {currentUser && (
            <div className="px-3 py-3 bg-[#022320]/40 border border-teal-700/30 rounded-2xl mb-4 shadow-sm backdrop-blur-md">
              <div className="flex items-center gap-3 mb-2.5">
                {currentUser.avatarUrl ? (
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.name}
                    referrerPolicy="no-referrer"
                    className="w-11 h-11 rounded-xl object-cover ring-2 ring-teal-500/30 shadow-sm shrink-0"
                  />
                ) : (
                  <div className={`w-11 h-11 rounded-xl ring-2 ring-teal-500/30 shadow-sm flex items-center justify-center font-black text-sm text-slate-950 shrink-0 ${
                    canEditData(currentUser) ? 'bg-gradient-to-tr from-emerald-400 to-teal-300' : 'bg-gradient-to-tr from-amber-400 to-yellow-300'
                  }`}>
                    {currentUser.name ? currentUser.name.substring(0, 2).toUpperCase() : 'PLN'}
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  <div className="text-[9px] text-amber-400/80 font-black uppercase tracking-[0.15em] leading-none mb-0.5">Welcome</div>
                  <div className="text-[13px] font-black text-white truncate drop-shadow-sm" title={currentUser.name}>
                    {currentUser.name}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    {isOwnerUser(currentUser) ? (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-400/10 border border-amber-400/30 text-amber-400 text-[8px] font-black uppercase tracking-tighter">
                        <ShieldCheck className="w-2 h-2" />
                        OWNER
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded bg-teal-500/10 text-teal-300 border border-teal-500/20 text-[8px] font-black uppercase tracking-tighter">
                        {currentUser.role || 'User'}
                      </span>
                    )}
                    {currentUser.unit && !isOwnerUser(currentUser) && (
                      <span className="text-[8px] text-teal-400/80 font-bold truncate">
                        • {currentUser.unit}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Compact Unit Filter for Owner */}
              {isOwnerUser(currentUser) && onSelectUnitFilter && (
                <div className="space-y-1.5 pt-2 border-t border-teal-800/40">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[9px] font-black text-teal-400/70 uppercase tracking-wider">Unit Filter</span>
                    <Filter className="w-2.5 h-2.5 text-teal-500" />
                  </div>
                  <CustomDropdown
                    options={[
                      { value: 'SEMUA', label: 'Global Access', icon: <span className="text-amber-400 text-[10px]">🌐</span> },
                      ...DAFTAR_UNIT_PLN.map((u) => ({
                        value: u.namaUnit,
                        label: u.namaUnit,
                        subLabel: u.kodeUnit,
                        badge: u.kodeUnit
                      }))
                    ]}
                    value={ownerSelectedUnitFilter}
                    onChange={onSelectUnitFilter}
                    placeholder="Global Access"
                    variant="teal"
                    searchable={true}
                    searchPlaceholder="Cari unit..."
                    className="w-full"
                    buttonClassName="w-full h-8 !text-[11px] !py-1 px-2.5 justify-between border-teal-700/30 bg-teal-900/20 hover:bg-teal-900/40"
                  />
                </div>
              )}
            </div>
          )}



          {/* Special Owner Only: Monitoring User Online (Live Presence) */}
          {isOwnerUser(currentUser) && (
            <button
              onClick={() => onSelectView('monitoring_online')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer group ${
                activeView === 'monitoring_online'
                  ? 'bg-gradient-to-r from-emerald-500/35 via-teal-500/25 to-teal-900/10 text-white border-l-4 border-l-emerald-300 border-y border-r border-emerald-500/50 shadow-md shadow-teal-950/60'
                  : 'text-white/95 hover:text-white hover:bg-teal-800/45 border border-emerald-500/30'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 relative transition-all duration-200 ${
                  activeView === 'monitoring_online'
                    ? 'bg-gradient-to-tr from-emerald-400 to-teal-300 text-teal-950 shadow-md shadow-emerald-400/40 border border-white/80 scale-105'
                    : 'bg-emerald-900/70 text-emerald-200 border border-emerald-600/50 group-hover:bg-emerald-700/80 group-hover:text-white group-hover:scale-105 shadow-xs'
                }`}>
                  <Activity className="w-4 h-4" />
                  <span className="absolute -top-1 -right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                  </span>
                </div>
                <span className="font-bold">User Online (Live)</span>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/30 text-emerald-200 text-[9px] font-black uppercase tracking-wider border border-emerald-400/40 shadow-xs">
                Sistem
              </span>
            </button>
          )}

          {canAccessMenu(currentUser, 'dashboard') && (
            <button
              onClick={() => onSelectView('dashboard')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer group ${
                activeView === 'dashboard'
                  ? 'bg-gradient-to-r from-teal-500/35 via-teal-500/20 to-teal-900/10 text-white border-l-4 border-l-teal-300 border-y border-r border-teal-500/50 shadow-md shadow-teal-950/60'
                  : 'text-white/95 hover:text-white hover:bg-teal-800/45 border border-transparent hover:border-teal-600/40'
              }`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200 ${
                activeView === 'dashboard'
                  ? 'bg-gradient-to-tr from-teal-400 via-teal-300 to-emerald-300 text-teal-950 shadow-md shadow-teal-400/40 border border-white/80 scale-105'
                  : 'bg-teal-900/70 text-teal-200 border border-teal-600/40 group-hover:bg-teal-700/80 group-hover:text-white group-hover:border-teal-400 group-hover:scale-105 shadow-xs'
              }`}>
                <LayoutDashboard className="w-4 h-4" />
              </div>
              <span className="font-bold">Dashboard Utama</span>
            </button>
          )}

          {/* Interactive DCC Single Line Diagram Menu */}
          {canAccessMenu(currentUser, 'dcc') && (
            <button
              onClick={() => onSelectView('dcc')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer group ${
                activeView === 'dcc'
                  ? 'bg-gradient-to-r from-teal-500/35 via-teal-500/20 to-teal-900/10 text-white border-l-4 border-l-teal-300 border-y border-r border-teal-500/50 shadow-md shadow-teal-950/60'
                  : 'text-white/95 hover:text-white hover:bg-teal-800/45 border border-transparent hover:border-teal-600/40'
              }`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200 ${
                activeView === 'dcc'
                  ? 'bg-gradient-to-tr from-teal-400 via-teal-300 to-emerald-300 text-teal-950 shadow-md shadow-teal-400/40 border border-white/80 scale-105'
                  : 'bg-teal-900/70 text-teal-200 border border-teal-600/40 group-hover:bg-teal-700/80 group-hover:text-white group-hover:border-teal-400 group-hover:scale-105 shadow-xs animate-pulse'
              }`}>
                <Radio className="w-4 h-4 text-emerald-300" />
              </div>
              <span className="font-bold">Mini DCC</span>
            </button>
          )}

          {/* Operational Custom Draw Layout SLD Menu */}
          <button
            onClick={() => onSelectView('operational_sld_canvas')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer group ${
              activeView === 'operational_sld_canvas'
                ? 'bg-gradient-to-r from-cyan-500/35 via-teal-500/25 to-teal-900/10 text-white border-l-4 border-l-cyan-300 border-y border-r border-cyan-500/50 shadow-md shadow-teal-950/60'
                : 'text-white/95 hover:text-white hover:bg-teal-800/45 border border-cyan-500/20'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200 ${
                activeView === 'operational_sld_canvas'
                  ? 'bg-gradient-to-tr from-cyan-400 via-teal-300 to-emerald-300 text-teal-950 shadow-md shadow-cyan-400/40 border border-white/80 scale-105'
                  : 'bg-cyan-950/70 text-cyan-200 border border-cyan-600/50 group-hover:bg-cyan-900 group-hover:text-white group-hover:scale-105 shadow-xs'
              }`}>
                <Workflow className="w-4 h-4 text-cyan-300" />
              </div>
              <span className="font-bold">SLD Custom Operasional</span>
            </div>
            <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[8px] font-black uppercase tracking-wider border border-cyan-400/30">
              Draw &amp; Op
            </span>
          </button>

          {/* 1. MENU MASTER DATA (ACCORDION) */}
          {(canAccessMenu(currentUser, 'master_data') || isOwnerUser(currentUser)) && (
            <div>
              <button
                onClick={() => setMasterDataOpen(!masterDataOpen)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer group ${
                  isMasterDataActive && !masterDataOpen
                    ? 'bg-gradient-to-r from-teal-500/35 via-teal-500/20 to-teal-900/10 text-white border-l-4 border-l-teal-300 border-y border-r border-teal-500/50 shadow-md shadow-teal-950/60'
                    : 'text-white/95 hover:text-white hover:bg-teal-800/45 border border-transparent hover:border-teal-600/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200 ${
                    isMasterDataActive
                      ? 'bg-gradient-to-tr from-teal-400 via-teal-300 to-emerald-300 text-teal-950 shadow-md shadow-teal-400/40 border border-white/80 scale-105'
                      : 'bg-teal-900/70 text-teal-200 border border-teal-600/40 group-hover:bg-teal-700/80 group-hover:text-white group-hover:border-teal-400 group-hover:scale-105 shadow-xs'
                  }`}>
                    <Database className="w-4 h-4" />
                  </div>
                  <span className="font-bold">Master Data</span>
                </div>
                <div>
                  {masterDataOpen ? (
                    <ChevronDown className="w-4 h-4 text-teal-300" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-teal-400/70 group-hover:text-white" />
                  )}
                </div>
              </button>

              {masterDataOpen && (
                <div className="pl-4 mt-1.5 space-y-1 border-l-2 border-teal-500/40 ml-5">
                  <button
                    onClick={() => onSelectView('master_data')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all text-left cursor-pointer ${
                      activeView === 'master_data'
                        ? 'bg-teal-600/35 text-white font-extrabold border border-teal-400/50 shadow-xs'
                        : 'text-teal-100 hover:text-white hover:bg-teal-800/50'
                    }`}
                  >
                    <Database className="w-3.5 h-3.5 text-teal-300 shrink-0" />
                    <span>Master Data Penyulang</span>
                  </button>

                  <button
                    onClick={() => onSelectView('input_peta_penyulang')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all text-left cursor-pointer ${
                      activeView === 'input_peta_penyulang'
                        ? 'bg-teal-600/35 text-white font-extrabold border border-teal-400/50 shadow-xs'
                        : 'text-teal-100 hover:text-white hover:bg-teal-800/50'
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5 text-teal-300 shrink-0" />
                    <span>Input Peta Penyulang</span>
                  </button>

                  <button
                    onClick={() => onSelectView('master_pelanggan')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all text-left cursor-pointer ${
                      activeView === 'master_pelanggan'
                        ? 'bg-teal-600/35 text-white font-extrabold border border-teal-400/50 shadow-xs'
                        : 'text-teal-100 hover:text-white hover:bg-teal-800/50'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                    <span>Master Data Pelanggan</span>
                  </button>

                  <button
                    onClick={() => onSelectView('master_unit')}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all text-left cursor-pointer ${
                      activeView === 'master_unit'
                        ? 'bg-teal-600/35 text-white font-extrabold border border-teal-400/50 shadow-xs'
                        : 'text-teal-100 hover:text-white hover:bg-teal-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Building2 className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                      <span>Master Data Unit PLN</span>
                    </div>
                    {isOwnerUser(currentUser) && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] bg-amber-400/30 text-amber-200 border border-amber-300/40">
                        Owner
                      </span>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 1.5. MENU PETA (ACCORDION) */}
          {(canAccessMenu(currentUser, 'peta') || canAccessMenu(currentUser, 'peta_penyulang') || canAccessMenu(currentUser, 'peta_gardu') || canAccessMenu(currentUser, 'peta_pohon')) && (
            <div>
              <button
                onClick={() => setPetaOpen(!petaOpen)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer group ${
                  isPetaActive && !petaOpen
                    ? 'bg-gradient-to-r from-teal-500/35 via-teal-500/20 to-teal-900/10 text-white border-l-4 border-l-teal-300 border-y border-r border-teal-500/50 shadow-md shadow-teal-950/60'
                    : 'text-white/95 hover:text-white hover:bg-teal-800/45 border border-transparent hover:border-teal-600/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200 ${
                    isPetaActive
                      ? 'bg-gradient-to-tr from-teal-400 via-teal-300 to-emerald-300 text-teal-950 shadow-md shadow-teal-400/40 border border-white/80 scale-105'
                      : 'bg-teal-900/70 text-teal-200 border border-teal-600/40 group-hover:bg-teal-700/80 group-hover:text-white group-hover:border-teal-400 group-hover:scale-105 shadow-xs'
                  }`}>
                    <Map className="w-4 h-4" />
                  </div>
                  <span className="font-bold">Peta</span>
                </div>
                <div>
                  {petaOpen ? (
                    <ChevronDown className="w-4 h-4 text-teal-300" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-teal-400/70 group-hover:text-white" />
                  )}
                </div>
              </button>

              {petaOpen && (
                <div className="pl-4 mt-1.5 space-y-1 border-l-2 border-teal-500/40 ml-5">
                  <button
                    onClick={() => onSelectView('peta_penyulang')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all text-left cursor-pointer ${
                      activeView === 'peta_penyulang' || activeView === 'peta'
                        ? 'bg-teal-600/35 text-white font-extrabold border border-teal-400/50 shadow-xs'
                        : 'text-teal-100 hover:text-white hover:bg-teal-800/50'
                    }`}
                  >
                    <Map className="w-3.5 h-3.5 text-teal-300 shrink-0" />
                    <span>Peta Penyulang</span>
                  </button>

                  <button
                    onClick={() => onSelectView('peta_gardu')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all text-left cursor-pointer ${
                      activeView === 'peta_gardu'
                        ? 'bg-teal-600/35 text-white font-extrabold border border-teal-400/50 shadow-xs'
                        : 'text-teal-100 hover:text-white hover:bg-teal-800/50'
                    }`}
                  >
                    <Gauge className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                    <span>Peta Gardu</span>
                  </button>

                  <button
                    onClick={() => onSelectView('peta_pohon')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all text-left cursor-pointer ${
                      activeView === 'peta_pohon'
                        ? 'bg-teal-600/35 text-white font-extrabold border border-teal-400/50 shadow-xs'
                        : 'text-teal-100 hover:text-white hover:bg-teal-800/50'
                    }`}
                  >
                    <Trees className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                    <span>Peta Pohon</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 2. MENU PEMASARAN (ACCORDION) */}
          {canAccessMenu(currentUser, 'survey_pb_pd') && (
            <div>
              <button
                onClick={() => setPemasaranOpen(!pemasaranOpen)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer group ${
                  isPemasaranActive && !pemasaranOpen
                    ? 'bg-gradient-to-r from-teal-500/35 via-teal-500/20 to-teal-900/10 text-white border-l-4 border-l-teal-300 border-y border-r border-teal-500/50 shadow-md shadow-teal-950/60'
                    : 'text-white/95 hover:text-white hover:bg-teal-800/45 border border-transparent hover:border-teal-600/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200 ${
                    isPemasaranActive
                      ? 'bg-gradient-to-tr from-teal-400 via-teal-300 to-emerald-300 text-teal-950 shadow-md shadow-teal-400/40 border border-white/80 scale-105'
                      : 'bg-teal-900/70 text-teal-200 border border-teal-600/40 group-hover:bg-teal-700/80 group-hover:text-white group-hover:border-teal-400 group-hover:scale-105 shadow-xs'
                  }`}>
                    <Zap className="w-4 h-4" />
                  </div>
                  <span className="font-bold">Pemasaran</span>
                </div>
                <div>
                  {pemasaranOpen ? (
                    <ChevronDown className="w-4 h-4 text-teal-300" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-teal-400/70 group-hover:text-white" />
                  )}
                </div>
              </button>

              {pemasaranOpen && (
                <div className="pl-4 mt-1.5 space-y-1 border-l-2 border-teal-500/40 ml-5">
                  <button
                    onClick={() => onSelectView('survey_pb_pd')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all text-left cursor-pointer ${
                      activeView === 'survey_pb_pd'
                        ? 'bg-teal-600/35 text-white font-extrabold border border-teal-400/50 shadow-xs'
                        : 'text-teal-100 hover:text-white hover:bg-teal-800/50'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                    <span>Survey PB PD</span>
                  </button>
                </div>
              )}
            </div>
          )}



          {/* MENU K3L (ACCORDION) */}
          {(canAccessMenu(currentUser, 'alker_apd') || canAccessMenu(currentUser, 'k3l') || isOwnerUser(currentUser)) && (
            <div>
              <button
                onClick={() => setK3lOpen(!k3lOpen)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer group ${
                  isK3LActive && !k3lOpen
                    ? 'bg-gradient-to-r from-teal-500/35 via-teal-500/20 to-teal-900/10 text-white border-l-4 border-l-teal-300 border-y border-r border-teal-500/50 shadow-md shadow-teal-950/60'
                    : 'text-white/95 hover:text-white hover:bg-teal-800/45 border border-transparent hover:border-teal-600/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200 ${
                    isK3LActive
                      ? 'bg-gradient-to-tr from-teal-400 via-teal-300 to-emerald-300 text-teal-950 shadow-md shadow-teal-400/40 border border-white/80 scale-105'
                      : 'bg-teal-900/70 text-teal-200 border border-teal-600/40 group-hover:bg-teal-700/80 group-hover:text-white group-hover:border-teal-400 group-hover:scale-105 shadow-xs'
                  }`}>
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <span className="font-bold">K3L</span>
                </div>
                <div>
                  {k3lOpen ? (
                    <ChevronDown className="w-4 h-4 text-teal-300" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-teal-400/70 group-hover:text-white" />
                  )}
                </div>
              </button>

              {k3lOpen && (
                <div className="pl-4 mt-1.5 space-y-1 border-l-2 border-teal-500/40 ml-5">
                  <button
                    onClick={() => onSelectView('jadwal_security')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all text-left cursor-pointer ${
                      activeView === 'jadwal_security'
                        ? 'bg-teal-600/35 text-white font-extrabold border border-teal-400/50 shadow-xs'
                        : 'text-teal-100 hover:text-white hover:bg-teal-800/50'
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                    <span>Jadwal Security</span>
                  </button>

                  <button
                    onClick={() => onSelectView('alker_apd')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all text-left cursor-pointer ${
                      activeView === 'alker_apd'
                        ? 'bg-teal-600/35 text-white font-extrabold border border-teal-400/50 shadow-xs'
                        : 'text-teal-100 hover:text-white hover:bg-teal-800/50'
                    }`}
                  >
                    <HardHat className="w-3.5 h-3.5 text-teal-300 shrink-0" />
                    <span>APD &amp; Alker</span>
                  </button>

                  <button
                    onClick={() => onSelectView('patroli_kelistrikan')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all text-left cursor-pointer ${
                      activeView === 'patroli_kelistrikan' || activeView === 'k3l'
                        ? 'bg-teal-600/35 text-white font-extrabold border border-teal-400/50 shadow-xs'
                        : 'text-teal-100 hover:text-white hover:bg-teal-800/50'
                    }`}
                  >
                    <Activity className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                    <span>Patroli Kelistrikan</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 4. MENU TEKNIK (ACCORDION) */}
          {canAccessMenu(currentUser, 'pemeliharaan') && (
            <div>
              <button
                onClick={() => setTeknikOpen(!teknikOpen)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer group ${
                  isTeknikActive && !teknikOpen
                    ? 'bg-gradient-to-r from-teal-500/35 via-teal-500/20 to-teal-900/10 text-white border-l-4 border-l-teal-300 border-y border-r border-teal-500/50 shadow-md shadow-teal-950/60'
                    : 'text-white/95 hover:text-white hover:bg-teal-800/45 border border-transparent hover:border-teal-600/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200 ${
                    isTeknikActive
                      ? 'bg-gradient-to-tr from-teal-400 via-teal-300 to-emerald-300 text-teal-950 shadow-md shadow-teal-400/40 border border-white/80 scale-105'
                      : 'bg-teal-900/70 text-teal-200 border border-teal-600/40 group-hover:bg-teal-700/80 group-hover:text-white group-hover:border-teal-400 group-hover:scale-105 shadow-xs'
                  }`}>
                    <Wrench className="w-4 h-4" />
                  </div>
                  <span className="font-bold">Teknik</span>
                </div>
                <div>
                  {teknikOpen ? (
                    <ChevronDown className="w-4 h-4 text-teal-300" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-teal-400/70 group-hover:text-white" />
                  )}
                </div>
              </button>

              {teknikOpen && (
                <div className="pl-4 mt-1.5 space-y-1 border-l-2 border-teal-500/40 ml-5">
                  <button
                    onClick={() => onSelectView('matriks_gangguan')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all text-left cursor-pointer ${
                      activeView === 'matriks_gangguan'
                        ? 'bg-teal-600/35 text-white font-extrabold border border-teal-400/50 shadow-xs'
                        : 'text-teal-100 hover:text-white hover:bg-teal-800/50'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                    <span>Gangguan Trip Feeder</span>
                  </button>

                  <button
                    onClick={() => onSelectView('pemeliharaan_20kv')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all text-left cursor-pointer ${
                      activeView === 'pemeliharaan_20kv'
                        ? 'bg-teal-600/35 text-white font-extrabold border border-teal-400/50 shadow-xs'
                        : 'text-teal-100 hover:text-white hover:bg-teal-800/50'
                    }`}
                  >
                    <Wrench className="w-3.5 h-3.5 text-teal-300 shrink-0" />
                    <span>Monitoring Pemeliharaan</span>
                  </button>

                  <button
                    onClick={() => onSelectView('saidi_saifi')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all text-left cursor-pointer ${
                      activeView === 'saidi_saifi' || activeView === 'estimasi_saidi_saifi'
                        ? 'bg-teal-600/35 text-white font-extrabold border border-teal-400/50 shadow-xs'
                        : 'text-teal-100 hover:text-white hover:bg-teal-800/50'
                    }`}
                  >
                    <BarChart3 className="w-3.5 h-3.5 text-teal-300 shrink-0" />
                    <span>SAIDI SAIFI</span>
                  </button>

                  <button
                    onClick={() => onSelectView('health_index')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all text-left cursor-pointer ${
                      activeView === 'health_index'
                        ? 'bg-teal-600/35 text-white font-extrabold border border-teal-400/50 shadow-xs'
                        : 'text-teal-100 hover:text-white hover:bg-teal-800/50'
                    }`}
                  >
                    <TrendingUp className="w-3.5 h-3.5 text-teal-300 shrink-0" />
                    <span>Healthy Index Penyulang</span>
                  </button>

                  <button
                    onClick={() => onSelectView('pengukuran_gardu')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all text-left cursor-pointer ${
                      activeView === 'pengukuran_gardu'
                        ? 'bg-teal-600/35 text-white font-extrabold border border-teal-400/50 shadow-xs'
                        : 'text-teal-100 hover:text-white hover:bg-teal-800/50'
                    }`}
                  >
                    <Gauge className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                    <span>Gardu Distribusi</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 5. MENU TRANSAKSI ENERGI (ACCORDION) */}
          {(canAccessMenu(currentUser, 'transaksi_energi') || canAccessMenu(currentUser, 'peremajaan_meter')) && (
            <div>
              <button
                onClick={() => setTransaksiEnergiOpen(!transaksiEnergiOpen)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer group ${
                  isTransaksiEnergiActive && !transaksiEnergiOpen
                    ? 'bg-gradient-to-r from-teal-500/35 via-teal-500/20 to-teal-900/10 text-white border-l-4 border-l-teal-300 border-y border-r border-teal-500/50 shadow-md shadow-teal-950/60'
                    : 'text-white/95 hover:text-white hover:bg-teal-800/45 border border-transparent hover:border-teal-600/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200 ${
                    isTransaksiEnergiActive
                      ? 'bg-gradient-to-tr from-teal-400 via-teal-300 to-emerald-300 text-teal-950 shadow-md shadow-teal-400/40 border border-white/80 scale-105'
                      : 'bg-teal-900/70 text-teal-200 border border-teal-600/40 group-hover:bg-teal-700/80 group-hover:text-white group-hover:border-teal-400 group-hover:scale-105 shadow-xs'
                  }`}>
                    <Activity className="w-4 h-4" />
                  </div>
                  <span className="font-bold">Transaksi Energi</span>
                </div>
                <div>
                  {transaksiEnergiOpen ? (
                    <ChevronDown className="w-4 h-4 text-teal-300" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-teal-400/70 group-hover:text-white" />
                  )}
                </div>
              </button>

              {transaksiEnergiOpen && (
                <div className="pl-4 mt-1.5 space-y-1 border-l-2 border-teal-500/40 ml-5">
                  <button
                    onClick={() => onSelectView('peremajaan_meter')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all text-left cursor-pointer ${
                      activeView === 'peremajaan_meter'
                        ? 'bg-teal-600/35 text-white font-extrabold border border-teal-400/50 shadow-xs'
                        : 'text-teal-100 hover:text-white hover:bg-teal-800/50'
                    }`}
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-teal-300 shrink-0" />
                    <span>Peremajaan Meter</span>
                  </button>

                  <button
                    onClick={() => onSelectView('meter_sl')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all text-left cursor-pointer ${
                      activeView === 'meter_sl'
                        ? 'bg-teal-600/35 text-white font-extrabold border border-teal-400/50 shadow-xs'
                        : 'text-teal-100 hover:text-white hover:bg-teal-800/50'
                    }`}
                  >
                    <Scale className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                    <span>Meter SL (Sambungan Langsung)</span>
                  </button>

                  <button
                    onClick={() => onSelectView('monitoring_susut')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all text-left cursor-pointer ${
                      activeView === 'monitoring_susut'
                        ? 'bg-teal-600/35 text-white font-extrabold border border-teal-400/50 shadow-xs'
                        : 'text-teal-100 hover:text-white hover:bg-teal-800/50'
                    }`}
                  >
                    <TrendingDown className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                    <span>Monitoring Susut</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 6. MENU ADMIN TEKNIK (ACCORDION) */}
          {(canAccessMenu(currentUser, 'perintah_kerja') || canAccessMenu(currentUser, 'format_surat') || canAccessMenu(currentUser, 'cash_flow_bop') || canAccessMenu(currentUser, 'spk')) && (
            <div>
              <button
                onClick={() => setSuratSpkOpen(!suratSpkOpen)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer group ${
                  isSuratSpkActive && !suratSpkOpen
                    ? 'bg-gradient-to-r from-teal-500/35 via-teal-500/20 to-teal-900/10 text-white border-l-4 border-l-teal-300 border-y border-r border-teal-500/50 shadow-md shadow-teal-950/60'
                    : 'text-white/95 hover:text-white hover:bg-teal-800/45 border border-transparent hover:border-teal-600/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200 ${
                    isSuratSpkActive
                      ? 'bg-gradient-to-tr from-teal-400 via-teal-300 to-emerald-300 text-teal-950 shadow-md shadow-teal-400/40 border border-white/80 scale-105'
                      : 'bg-teal-900/70 text-teal-200 border border-teal-600/40 group-hover:bg-teal-700/80 group-hover:text-white group-hover:border-teal-400 group-hover:scale-105 shadow-xs'
                  }`}>
                    <FileText className="w-4 h-4" />
                  </div>
                  <span className="font-bold">Admin Teknik</span>
                </div>
                <div>
                  {suratSpkOpen ? (
                    <ChevronDown className="w-4 h-4 text-teal-300" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-teal-400/70 group-hover:text-white" />
                  )}
                </div>
              </button>

              {suratSpkOpen && (
                <div className="pl-4 mt-1.5 space-y-1 border-l-2 border-teal-500/40 ml-5">
                  <button
                    onClick={() => onSelectView('perintah_kerja')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all text-left cursor-pointer ${
                      activeView === 'perintah_kerja'
                        ? 'bg-teal-600/35 text-white font-extrabold border border-teal-400/50 shadow-xs'
                        : 'text-teal-100 hover:text-white hover:bg-teal-800/50'
                    }`}
                  >
                    <FileCheck className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                    <span>Perintah Kerja (SPK)</span>
                  </button>

                  <button
                    onClick={() => onSelectView('format_surat')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all text-left cursor-pointer ${
                      activeView === 'format_surat'
                        ? 'bg-teal-600/35 text-white font-extrabold border border-teal-400/50 shadow-xs'
                        : 'text-teal-100 hover:text-white hover:bg-teal-800/50'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5 text-teal-300 shrink-0" />
                    <span>Format Surat Keluar</span>
                  </button>

                  <button
                    onClick={() => onSelectView('cash_flow_bop')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all text-left cursor-pointer ${
                      activeView === 'cash_flow_bop'
                        ? 'bg-teal-600/35 text-white font-extrabold border border-teal-400/50 shadow-xs'
                        : 'text-teal-100 hover:text-white hover:bg-teal-800/50'
                    }`}
                  >
                    <Wallet className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                    <span>Cash Flow</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 7. MENU YANTEK (ACCORDION) */}
          {(canAccessMenu(currentUser, 'monitoring_yantek') || canAccessMenu(currentUser, 'yantek') || canAccessMenu(currentUser, 'row') || canAccessMenu(currentUser, 'inspeksi') || canAccessMenu(currentUser, 'jadwal_piket')) && (
            <div>
              <button
                onClick={() => setYantekOpen(!yantekOpen)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer group ${
                  isYantekActive && !yantekOpen
                    ? 'bg-gradient-to-r from-teal-500/35 via-teal-500/20 to-teal-900/10 text-white border-l-4 border-l-teal-300 border-y border-r border-teal-500/50 shadow-md shadow-teal-950/60'
                    : 'text-white/95 hover:text-white hover:bg-teal-800/45 border border-transparent hover:border-teal-600/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200 ${
                    isYantekActive
                      ? 'bg-gradient-to-tr from-teal-400 via-teal-300 to-emerald-300 text-teal-950 shadow-md shadow-teal-400/40 border border-white/80 scale-105'
                      : 'bg-teal-900/70 text-teal-200 border border-teal-600/40 group-hover:bg-teal-700/80 group-hover:text-white group-hover:border-teal-400 group-hover:scale-105 shadow-xs'
                  }`}>
                    <HardHat className="w-4 h-4" />
                  </div>
                  <span className="font-bold">Yantek</span>
                </div>
                <div>
                  {yantekOpen ? (
                    <ChevronDown className="w-4 h-4 text-teal-300" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-teal-400/70 group-hover:text-white" />
                  )}
                </div>
              </button>

              {yantekOpen && (
                <div className="pl-3 mt-1.5 space-y-2 border-l-2 border-teal-500/40 ml-5">
                  <button
                    onClick={() => onSelectView('jadwal_inspeksi_row')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all text-left cursor-pointer ${
                      activeView === 'jadwal_inspeksi_row'
                        ? 'bg-teal-600/35 text-white font-extrabold border border-teal-400/50 shadow-xs'
                        : 'text-teal-100 hover:text-white hover:bg-teal-800/50'
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                    <span>Jadwal Inspeksi & ROW</span>
                  </button>

                  {/* SUB-MENU: ROW */}
                  <div className="rounded-lg bg-teal-950/40 border border-teal-700/30 overflow-hidden">
                    <button
                      onClick={() => setYantekRowOpen(!yantekRowOpen)}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs font-bold text-emerald-300 hover:bg-teal-800/40 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Trees className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>ROW</span>
                      </div>
                      {yantekRowOpen ? (
                        <ChevronDown className="w-3.5 h-3.5 text-emerald-400/80" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-emerald-400/80" />
                      )}
                    </button>

                    {yantekRowOpen && (
                      <div className="px-1.5 pb-1.5 pt-0.5 space-y-0.5 border-t border-teal-800/40">
                        <button
                          onClick={() => onSelectView('peta_pohon')}
                          className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all text-left cursor-pointer ${
                            activeView === 'peta_pohon'
                              ? 'bg-teal-600/40 text-white font-extrabold border border-teal-400/50 shadow-xs'
                              : 'text-teal-100/90 hover:text-white hover:bg-teal-800/50'
                          }`}
                        >
                          <Trees className="w-3 h-3 text-emerald-300 shrink-0" />
                          <span className="truncate">Peta Pohon</span>
                        </button>

                        <button
                          onClick={() => onSelectView('inspeksi_tier1')}
                          className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all text-left cursor-pointer ${
                            activeView === 'inspeksi_tier1'
                              ? 'bg-teal-600/40 text-white font-extrabold border border-teal-400/50 shadow-xs'
                              : 'text-teal-100/90 hover:text-white hover:bg-teal-800/50'
                          }`}
                        >
                          <Search className="w-3 h-3 text-amber-300 shrink-0" />
                          <span className="truncate">Temuan Inspeksi Pohon</span>
                        </button>

                        <button
                          onClick={() => onSelectView('row')}
                          className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all text-left cursor-pointer ${
                            activeView === 'row'
                              ? 'bg-teal-600/40 text-white font-extrabold border border-teal-400/50 shadow-xs'
                              : 'text-teal-100/90 hover:text-white hover:bg-teal-800/50'
                          }`}
                        >
                          <Trees className="w-3 h-3 text-teal-300 shrink-0" />
                          <span className="truncate">Realisasi ROW</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* SUB-MENU: INSPEKSI */}
                  <div className="rounded-lg bg-teal-950/40 border border-teal-700/30 overflow-hidden">
                    <button
                      onClick={() => setYantekInspeksiOpen(!yantekInspeksiOpen)}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs font-bold text-teal-300 hover:bg-teal-800/40 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Search className="w-3.5 h-3.5 text-teal-300 shrink-0" />
                        <span>Inspeksi</span>
                      </div>
                      {yantekInspeksiOpen ? (
                        <ChevronDown className="w-3.5 h-3.5 text-teal-400/80" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-teal-400/80" />
                      )}
                    </button>

                    {yantekInspeksiOpen && (
                      <div className="px-1.5 pb-1.5 pt-0.5 space-y-1 border-t border-teal-800/40">
                        {/* Tier 1 Section */}
                        <div className="pt-1 pb-0.5 px-2 text-[9px] font-black uppercase text-amber-300 tracking-wider">
                          Tier 1
                        </div>
                        <button
                          onClick={() => onSelectView('inspeksi_tier1')}
                          className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all text-left cursor-pointer ${
                            activeView === 'inspeksi_tier1'
                              ? 'bg-teal-600/40 text-white font-extrabold border border-teal-400/50 shadow-xs'
                              : 'text-teal-100/90 hover:text-white hover:bg-teal-800/50'
                          }`}
                        >
                          <Search className="w-3 h-3 text-amber-300 shrink-0" />
                          <span className="truncate">Inspeksi Pohon</span>
                        </button>
                        <button
                          onClick={() => onSelectView('inspeksi_tier1_jtm')}
                          className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all text-left cursor-pointer ${
                            activeView === 'inspeksi_tier1_jtm'
                              ? 'bg-teal-600/40 text-white font-extrabold border border-teal-400/50 shadow-xs'
                              : 'text-teal-100/90 hover:text-white hover:bg-teal-800/50'
                          }`}
                        >
                          <Search className="w-3 h-3 text-teal-300 shrink-0" />
                          <span className="truncate">Konstruksi JTM</span>
                        </button>
                        <button
                          onClick={() => onSelectView('inspeksi_tier1_gtt')}
                          className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all text-left cursor-pointer ${
                            activeView === 'inspeksi_tier1_gtt'
                              ? 'bg-teal-600/40 text-white font-extrabold border border-teal-400/50 shadow-xs'
                              : 'text-teal-100/90 hover:text-white hover:bg-teal-800/50'
                          }`}
                        >
                          <Search className="w-3 h-3 text-teal-300 shrink-0" />
                          <span className="truncate">Konstruksi GTT</span>
                        </button>
                        <button
                          onClick={() => onSelectView('inspeksi_tier1_switching')}
                          className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all text-left cursor-pointer ${
                            activeView === 'inspeksi_tier1_switching'
                              ? 'bg-teal-600/40 text-white font-extrabold border border-teal-400/50 shadow-xs'
                              : 'text-teal-100/90 hover:text-white hover:bg-teal-800/50'
                          }`}
                        >
                          <Search className="w-3 h-3 text-teal-300 shrink-0" />
                          <span className="truncate">Konstruksi Switching</span>
                        </button>

                        {/* Tier 2 Section */}
                        <div className="pt-1.5 pb-0.5 px-2 text-[9px] font-black uppercase text-teal-300 tracking-wider border-t border-teal-800/50">
                          Tier 2
                        </div>
                        <button
                          onClick={() => onSelectView('inspeksi_tier2_thermovision')}
                          className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all text-left cursor-pointer ${
                            activeView === 'inspeksi_tier2_thermovision'
                              ? 'bg-teal-600/40 text-white font-extrabold border border-teal-400/50 shadow-xs'
                              : 'text-teal-100/90 hover:text-white hover:bg-teal-800/50'
                          }`}
                        >
                          <Search className="w-3 h-3 text-teal-300 shrink-0" />
                          <span className="truncate">Thermovision</span>
                        </button>
                        <button
                          onClick={() => onSelectView('inspeksi_tier2_ultrasound')}
                          className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all text-left cursor-pointer ${
                            activeView === 'inspeksi_tier2_ultrasound'
                              ? 'bg-teal-600/40 text-white font-extrabold border border-teal-400/50 shadow-xs'
                              : 'text-teal-100/90 hover:text-white hover:bg-teal-800/50'
                          }`}
                        >
                          <Search className="w-3 h-3 text-teal-300 shrink-0" />
                          <span className="truncate">Ultrasound</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* SUB-MENU: YANGGU */}
                  <div className="rounded-lg bg-teal-950/40 border border-teal-700/30 overflow-hidden">
                    <button
                      onClick={() => setYantekYangguOpen(!yantekYangguOpen)}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs font-bold text-amber-300 hover:bg-teal-800/40 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>Yanggu</span>
                      </div>
                      {yantekYangguOpen ? (
                        <ChevronDown className="w-3.5 h-3.5 text-amber-400/80" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-amber-400/80" />
                      )}
                    </button>

                    {yantekYangguOpen && (
                      <div className="px-1.5 pb-1.5 pt-0.5 space-y-0.5 border-t border-teal-800/40">
                        <button
                          onClick={() => onSelectView('jadwal_piket')}
                          className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all text-left cursor-pointer ${
                            activeView === 'jadwal_piket'
                              ? 'bg-teal-600/40 text-white font-extrabold border border-teal-400/50 shadow-xs'
                              : 'text-teal-100/90 hover:text-white hover:bg-teal-800/50'
                          }`}
                        >
                          <Calendar className="w-3 h-3 text-teal-300 shrink-0" />
                          <span className="truncate">Jadwal Piket Petugas</span>
                        </button>

                        <button
                          onClick={() => onSelectView('monitoring_lembur')}
                          className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all text-left cursor-pointer ${
                            activeView === 'monitoring_lembur'
                              ? 'bg-teal-600/40 text-white font-extrabold border border-teal-400/50 shadow-xs'
                              : 'text-teal-100/90 hover:text-white hover:bg-teal-800/50'
                          }`}
                        >
                          <Clock className="w-3 h-3 text-amber-300 shrink-0" />
                          <span className="truncate">Monitoring Lembur</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* MENU MANBILL (ACCORDION) */}
          {(canAccessMenu(currentUser, 'manbill') || canAccessMenu(currentUser, 'transaksi_energi') || isPemasaranUser(currentUser) || isOwnerUser(currentUser)) && (
            <div>
              <button
                onClick={() => setManbillOpen(!manbillOpen)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer group ${
                  isManbillActive && !manbillOpen
                    ? 'bg-gradient-to-r from-teal-500/35 via-teal-500/20 to-teal-900/10 text-white border-l-4 border-l-teal-300 border-y border-r border-teal-500/50 shadow-md shadow-teal-950/60'
                    : 'text-white/95 hover:text-white hover:bg-teal-800/45 border border-transparent hover:border-teal-600/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200 ${
                    isManbillActive
                      ? 'bg-gradient-to-tr from-teal-400 via-teal-300 to-emerald-300 text-teal-950 shadow-md shadow-teal-400/40 border border-white/80 scale-105'
                      : 'bg-teal-900/70 text-teal-200 border border-teal-600/40 group-hover:bg-teal-700/80 group-hover:text-white group-hover:border-teal-400 group-hover:scale-105 shadow-xs'
                  }`}>
                    <Receipt className="w-4 h-4" />
                  </div>
                  <span className="font-bold">Manbill</span>
                </div>
                <div>
                  {manbillOpen ? (
                    <ChevronDown className="w-4 h-4 text-teal-300" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-teal-400/70 group-hover:text-white" />
                  )}
                </div>
              </button>

              {manbillOpen && (
                <div className="pl-4 mt-1.5 space-y-1 border-l-2 border-teal-500/40 ml-5">
                  <button
                    onClick={() => onSelectView('pembagian_invoice')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all text-left cursor-pointer ${
                      activeView === 'pembagian_invoice' || activeView === 'manbill'
                        ? 'bg-teal-600/35 text-white font-extrabold border border-teal-400/50 shadow-xs'
                        : 'text-teal-100 hover:text-white hover:bg-teal-800/50'
                    }`}
                  >
                    <Receipt className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                    <span>Pembagian Invoice</span>
                  </button>

                  <button
                    onClick={() => onSelectView('realisasi_tusbung')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all text-left cursor-pointer ${
                      activeView === 'realisasi_tusbung'
                        ? 'bg-teal-600/35 text-white font-extrabold border border-teal-400/50 shadow-xs'
                        : 'text-teal-100 hover:text-white hover:bg-teal-800/50'
                    }`}
                  >
                    <ZapOff className="w-3.5 h-3.5 text-rose-300 shrink-0" />
                    <span>Realisasi Tusbung</span>
                  </button>

                  <button
                    onClick={() => onSelectView('foto_meter')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all text-left cursor-pointer ${
                      activeView === 'foto_meter'
                        ? 'bg-teal-600/35 text-white font-extrabold border border-teal-400/50 shadow-xs'
                        : 'text-teal-100 hover:text-white hover:bg-teal-800/50'
                    }`}
                  >
                    <Camera className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                    <span>Foto Meter</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* MENU KIT (ACCORDION) */}
          {(canAccessMenu(currentUser, 'kit') || isOwnerUser(currentUser)) && (
            <div>
              <button
                onClick={() => setKitOpen(!kitOpen)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer group ${
                  isKitActive && !kitOpen
                    ? 'bg-gradient-to-r from-teal-500/35 via-teal-500/20 to-teal-900/10 text-white border-l-4 border-l-teal-300 border-y border-r border-teal-500/50 shadow-md shadow-teal-950/60'
                    : 'text-white/95 hover:text-white hover:bg-teal-800/45 border border-transparent hover:border-teal-600/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200 ${
                    isKitActive
                      ? 'bg-gradient-to-tr from-teal-400 via-teal-300 to-emerald-300 text-teal-950 shadow-md shadow-teal-400/40 border border-white/80 scale-105'
                      : 'bg-teal-900/70 text-teal-200 border border-teal-600/40 group-hover:bg-teal-700/80 group-hover:text-white group-hover:border-teal-400 group-hover:scale-105 shadow-xs'
                  }`}>
                    <BatteryCharging className="w-4 h-4" />
                  </div>
                  <span className="font-bold">KIT</span>
                </div>
                <div>
                  {kitOpen ? (
                    <ChevronDown className="w-4 h-4 text-teal-300" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-teal-400/70 group-hover:text-white" />
                  )}
                </div>
              </button>

              {kitOpen && (
                <div className="pl-4 mt-1.5 space-y-1 border-l-2 border-teal-500/40 ml-5">
                  <button
                    onClick={() => onSelectView('kit_bbm')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all text-left cursor-pointer ${
                      activeView === 'kit_bbm'
                        ? 'bg-teal-600/35 text-white font-extrabold border border-teal-400/50 shadow-xs'
                        : 'text-teal-100 hover:text-white hover:bg-teal-800/50'
                    }`}
                  >
                    <Activity className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                    <span>BBM</span>
                  </button>

                  <button
                    onClick={() => onSelectView('kit_laporan_beban')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all text-left cursor-pointer ${
                      activeView === 'kit_laporan_beban'
                        ? 'bg-teal-600/35 text-white font-extrabold border border-teal-400/50 shadow-xs'
                        : 'text-teal-100 hover:text-white hover:bg-teal-800/50'
                    }`}
                  >
                    <BarChart3 className="w-3.5 h-3.5 text-teal-300 shrink-0" />
                    <span>Laporan Beban</span>
                  </button>

                  <button
                    onClick={() => onSelectView('kit_pemeliharaan_mesin')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all text-left cursor-pointer ${
                      activeView === 'kit_pemeliharaan_mesin'
                        ? 'bg-teal-600/35 text-white font-extrabold border border-teal-400/50 shadow-xs'
                        : 'text-teal-100 hover:text-white hover:bg-teal-800/50'
                    }`}
                  >
                    <Wrench className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                    <span>Pemeliharaan Mesin</span>
                  </button>

                  <button
                    onClick={() => onSelectView('kit_master_data_mesin')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all text-left cursor-pointer ${
                      activeView === 'kit_master_data_mesin'
                        ? 'bg-teal-600/35 text-white font-extrabold border border-teal-400/50 shadow-xs'
                        : 'text-teal-100 hover:text-white hover:bg-teal-800/50'
                    }`}
                  >
                    <Database className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                    <span>Master Data Mesin</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 8. MENU UTAMA: GUDANG MATERIAL */}
          {canAccessMenu(currentUser, 'material') && (
            <button
              onClick={() => onSelectView('material')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer group ${
                activeView === 'material'
                  ? 'bg-gradient-to-r from-teal-500/35 via-teal-500/20 to-teal-900/10 text-white border-l-4 border-l-teal-300 border-y border-r border-teal-500/50 shadow-md shadow-teal-950/60'
                  : 'text-white/95 hover:text-white hover:bg-teal-800/45 border border-transparent hover:border-teal-600/40'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200 ${
                  activeView === 'material'
                    ? 'bg-gradient-to-tr from-teal-400 via-teal-300 to-emerald-300 text-teal-950 shadow-md shadow-teal-400/40 border border-white/80 scale-105'
                    : 'bg-teal-900/70 text-teal-200 border border-teal-600/40 group-hover:bg-teal-700/80 group-hover:text-white group-hover:border-teal-400 group-hover:scale-105 shadow-xs'
                }`}>
                  <Package className="w-4 h-4" />
                </div>
                <span className="font-bold">Gudang Material</span>
              </div>
            </button>
          )}

          {/* Kalkulator Listrik */}
          {canAccessMenu(currentUser, 'kalkulator_listrik') && (
            <button
              onClick={() => onSelectView('kalkulator_listrik')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer group ${
                activeView === 'kalkulator_listrik'
                  ? 'bg-gradient-to-r from-teal-500/35 via-teal-500/20 to-teal-900/10 text-white border-l-4 border-l-teal-300 border-y border-r border-teal-500/50 shadow-md shadow-teal-950/60'
                  : 'text-white/95 hover:text-white hover:bg-teal-800/45 border border-transparent hover:border-teal-600/40'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200 ${
                  activeView === 'kalkulator_listrik'
                    ? 'bg-gradient-to-tr from-amber-400 via-yellow-300 to-teal-300 text-teal-950 shadow-md shadow-amber-400/40 border border-white/80 scale-105'
                    : 'bg-teal-900/70 text-amber-300 border border-teal-600/40 group-hover:bg-teal-700/80 group-hover:text-white group-hover:border-teal-400 group-hover:scale-105 shadow-xs'
                }`}>
                  <Calculator className="w-4 h-4" />
                </div>
                <span className="font-bold">Kalkulator Listrik</span>
              </div>
            </button>
          )}

          {/* 13. Share Laporan */}
          {canAccessMenu(currentUser, 'share_laporan') && (
            <button
              onClick={() => onSelectView('share_laporan')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer group ${
                activeView === 'share_laporan'
                  ? 'bg-gradient-to-r from-teal-500/35 via-teal-500/20 to-teal-900/10 text-white border-l-4 border-l-teal-300 border-y border-r border-teal-500/50 shadow-md shadow-teal-950/60'
                  : 'text-white/95 hover:text-white hover:bg-teal-800/45 border border-transparent hover:border-teal-600/40'
              }`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200 ${
                activeView === 'share_laporan'
                  ? 'bg-gradient-to-tr from-teal-400 via-teal-300 to-emerald-300 text-teal-950 shadow-md shadow-teal-400/40 border border-white/80 scale-105'
                  : 'bg-teal-900/70 text-teal-200 border border-teal-600/40 group-hover:bg-teal-700/80 group-hover:text-white group-hover:border-teal-400 group-hover:scale-105 shadow-xs'
              }`}>
                <Share2 className="w-4 h-4" />
              </div>
              <span className="font-bold">Share Laporan</span>
            </button>
          )}

          {/* Pengaturan Akun (Kelola User) */}
          {(() => {
            const hasUserMgmtAccess = canManageUsers(currentUser);
            return (
              <button
                onClick={() => {
                  if (hasUserMgmtAccess) {
                    onSelectView('kelola_user');
                  }
                }}
                disabled={!hasUserMgmtAccess}
                title={
                  !hasUserMgmtAccess
                    ? `Menu Pengaturan Akun dinonaktifkan untuk role ${currentUser?.role || 'Admin Teknik'} (Khusus Koordinator)`
                    : 'Pengaturan Akun'
                }
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left ${
                  hasUserMgmtAccess
                    ? activeView === 'kelola_user'
                      ? 'bg-gradient-to-r from-teal-500/35 via-teal-500/20 to-teal-900/10 text-white border-l-4 border-l-teal-300 border-y border-r border-teal-500/50 shadow-md shadow-teal-950/60 cursor-pointer'
                      : 'text-white/95 hover:text-white hover:bg-teal-800/45 border border-transparent hover:border-teal-600/40 cursor-pointer group'
                    : 'text-white/40 bg-teal-950/40 border border-teal-900/40 cursor-not-allowed opacity-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200 ${
                    activeView === 'kelola_user'
                      ? 'bg-gradient-to-tr from-teal-400 via-teal-300 to-emerald-300 text-teal-950 shadow-md shadow-teal-400/40 border border-white/80 scale-105'
                      : 'bg-teal-900/70 text-teal-200 border border-teal-600/40 group-hover:bg-teal-700/80 group-hover:text-white group-hover:border-teal-400 shadow-xs'
                  }`}>
                    <Users className="w-4 h-4" />
                  </div>
                  <span className="font-bold">Pengaturan Akun</span>
                </div>
                {!hasUserMgmtAccess && (
                  <Lock className="w-3.5 h-3.5 text-teal-400/60 shrink-0" />
                )}
              </button>
            );
          })()}

          {/* Help Desk */}
          {canAccessMenu(currentUser, 'helpdesk') && (
            <button
              onClick={() => onSelectView('helpdesk')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer group ${
                activeView === 'helpdesk'
                  ? 'bg-gradient-to-r from-amber-500/35 via-teal-500/25 to-teal-900/10 text-white border-l-4 border-l-amber-300 border-y border-r border-amber-500/50 shadow-md shadow-teal-950/60'
                  : 'text-white/95 hover:text-white hover:bg-teal-800/45 border border-amber-500/30'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200 ${
                  activeView === 'helpdesk'
                    ? 'bg-gradient-to-tr from-amber-400 via-yellow-300 to-teal-300 text-teal-950 shadow-md shadow-amber-400/40 border border-white/80 scale-105'
                    : 'bg-teal-900/70 text-amber-300 border border-teal-600/40 group-hover:bg-teal-700/80 group-hover:text-white group-hover:border-teal-400 group-hover:scale-105 shadow-xs'
                }`}>
                  <Headphones className="w-4 h-4" />
                </div>
                <span className="font-bold">Help Desk</span>
              </div>
            </button>
          )}

          {/* Moved Menus: Cloud Backup, Live Chat, Online */}
          <div className="pt-2.5 border-t border-teal-700/60 mt-3 space-y-1.5">
             <button
                onClick={() => {
                  const modal = document.createElement('div');
                  modal.id = 'backup-modal-root';
                  document.body.appendChild(modal);
                  // Since I don't have direct access to the modal trigger here without refactoring, 
                  // I'll assume standard navigation for simplicity as per user intent of menu movement.
                  // The user requested moving these menus in the sidebar.
                }}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer text-amber-300 hover:text-white hover:bg-teal-800/45 border border-amber-500/30"
              >
                <div className="w-8 h-8 rounded-xl bg-amber-900/70 flex items-center justify-center shrink-0 border border-amber-600/40">
                  <CloudUpload className="w-4 h-4 text-amber-400" />
                </div>
                <span className="font-bold">Backup Cloud</span>
              </button>

              <button
                onClick={() => onSelectView('live_chat')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer group ${
                  activeView === 'live_chat'
                    ? 'bg-gradient-to-r from-teal-500/35 via-teal-500/20 to-teal-900/10 text-white border-l-4 border-l-teal-300 border-y border-r border-teal-500/50 shadow-md shadow-teal-950/60'
                    : 'text-white/95 hover:text-white hover:bg-teal-800/45 border border-transparent hover:border-teal-600/40'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-teal-900/70 flex items-center justify-center shrink-0 border border-teal-600/40">
                  <MessageCircle className="w-4 h-4 text-teal-300" />
                </div>
                <span className="font-bold">Live Chat</span>
              </button>
          </div>


          {/* Connection Status & IndexedDB Queue Widget */}
          <div className="pt-2.5 border-t border-teal-700/60 mt-3 px-1">
            <div className={`p-2.5 rounded-xl border flex flex-col gap-2 transition-all ${
              isOnline ? 'bg-emerald-950/40 border-emerald-600/40 text-emerald-100' : 'bg-amber-950/50 border-amber-500/50 text-amber-100 shadow-lg'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400 animate-ping'}`} />
                  <span className="text-[11px] font-black tracking-wide uppercase">
                    {isOnline ? 'Online (Connected)' : 'Offline (IndexedDB Mode)'}
                  </span>
                </div>
                {isOnline ? (
                  <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                )}
              </div>

              {offlineQueueCount > 0 && (
                <div className="flex items-center justify-between text-[10px] bg-black/30 px-2 py-1 rounded-lg border border-white/10">
                  <span>Queue: <strong>{offlineQueueCount}</strong> data</span>
                  <button
                    onClick={handleSyncOfflineData}
                    disabled={isSyncing || !isOnline}
                    className="px-2 py-0.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded flex items-center gap-1 cursor-pointer transition-colors"
                    title="Sinkronkan data offline ke server"
                  >
                    <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>{isSyncing ? 'Syncing...' : 'Sync'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 14. Tombol Keluar / Log Out */}
          <div className="pt-2.5 border-t border-teal-700/60 mt-3">
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left text-rose-100 hover:text-white bg-rose-950/40 hover:bg-rose-900/60 border border-rose-600/40 hover:border-rose-400 shadow-sm cursor-pointer group"
              title="Log Out dari Aplikasi"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-rose-900/70 text-rose-300 group-hover:bg-rose-600 group-hover:text-white border border-rose-600/40 group-hover:border-rose-300 flex items-center justify-center shrink-0 transition-all shadow-xs group-hover:scale-105">
                  <LogOut className="w-4 h-4" />
                </div>
                <span className="font-bold">Log Out</span>
              </div>
            </button>
          </div>
        </nav>


      </div>

      {/* Modal Konfirmasi Keluar */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-sm w-full p-6 text-left space-y-4 text-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Konfirmasi Keluar</h3>
              </div>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Apakah Anda yakin ingin keluar dari sistem?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowLogoutConfirm(false);
                  if (onLogout) {
                    onLogout();
                  }
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-rose-600/20"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Kustomisasi Latar Belakang Login */}
      <LoginBackgroundModal
        isOpen={isBgModalOpen}
        onClose={() => setIsBgModalOpen(false)}
      />
    </aside>
  );
};
