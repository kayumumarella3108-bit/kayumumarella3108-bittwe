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
  RefreshCw
} from 'lucide-react';
import { ViewType, User } from '../types';
import { canManageUsers, isPemasaranUser, isInspeksiUser, isPetugasRowUser, canAccessMenu, canEditData, isOwnerUser } from '../utils/permissions';
import { getOfflineQueue, clearOfflineQueue } from '../lib/offlineQueue';

import { LoginBackgroundModal } from './LoginBackgroundModal';
import { DAFTAR_UNIT_PLN, getKodeUnitByUnitName } from '../utils/unitConfig';

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
  const [inspeksiOpen, setInspeksiOpen] = useState(
    ['inspeksi_tier1', 'inspeksi_tier1_jtm', 'inspeksi_tier1_gtt', 'inspeksi_tier1_switching', 'inspeksi_tier2', 'inspeksi_tier2_thermovision', 'inspeksi_tier2_ultrasound', 'inspeksi_gardu'].includes(activeView)
  );

  const [suratSpkOpen, setSuratSpkOpen] = useState(
    ['perintah_kerja', 'format_surat'].includes(activeView)
  );

  const [saidiSaifiOpen, setSaidiSaifiOpen] = useState(
    ['saidi_saifi', 'estimasi_saidi_saifi'].includes(activeView)
  );

  const [monitoringYantekOpen, setMonitoringYantekOpen] = useState(
    ['monitoring_yantek', 'peta_pohon', 'row', 'inspeksi_tier1', 'inspeksi_tier1_jtm', 'inspeksi_tier1_gtt', 'inspeksi_tier1_switching', 'inspeksi_tier2', 'inspeksi_tier2_thermovision', 'inspeksi_tier2_ultrasound', 'alker_apd', 'material', 'jadwal_piket', 'kendaraan_operasional'].includes(activeView)
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
    if (['inspeksi_tier1', 'inspeksi_tier1_jtm', 'inspeksi_tier1_gtt', 'inspeksi_tier1_switching', 'inspeksi_tier2', 'inspeksi_tier2_thermovision', 'inspeksi_tier2_ultrasound', 'inspeksi_gardu'].includes(activeView)) {
      setInspeksiOpen(true);
    }
    if (['perintah_kerja', 'format_surat'].includes(activeView)) {
      setSuratSpkOpen(true);
    }
    if (['saidi_saifi', 'estimasi_saidi_saifi'].includes(activeView)) {
      setSaidiSaifiOpen(true);
    }
    if (['monitoring_yantek', 'peta_pohon', 'row', 'inspeksi_tier1', 'inspeksi_tier1_jtm', 'inspeksi_tier1_gtt', 'inspeksi_tier1_switching', 'inspeksi_tier2', 'inspeksi_tier2_thermovision', 'inspeksi_tier2_ultrasound', 'alker_apd', 'material', 'jadwal_piket', 'kendaraan_operasional'].includes(activeView)) {
      setMonitoringYantekOpen(true);
    }
  }, [activeView]);

  if (!isOpen) return null;

  const isInspeksiActive = ['inspeksi_tier1', 'inspeksi_tier1_jtm', 'inspeksi_tier1_gtt', 'inspeksi_tier1_switching', 'inspeksi_tier2', 'inspeksi_tier2_thermovision', 'inspeksi_tier2_ultrasound', 'inspeksi_gardu'].includes(activeView);
  const isSuratSpkActive = ['perintah_kerja', 'format_surat'].includes(activeView);
  const isMasterAsetActive = ['master_data', 'aset_jaringan', 'sld_visio'].includes(activeView);
  const isSaidiSaifiActive = ['saidi_saifi', 'estimasi_saidi_saifi'].includes(activeView);
  const isMonitoringYantekActive = ['monitoring_yantek', 'peta_pohon', 'row', 'inspeksi_tier1', 'inspeksi_tier1_jtm', 'inspeksi_tier1_gtt', 'inspeksi_tier1_switching', 'inspeksi_tier2', 'inspeksi_tier2_thermovision', 'inspeksi_tier2_ultrasound', 'alker_apd', 'material', 'jadwal_piket', 'kendaraan_operasional'].includes(activeView);

  const isPemasaran = isPemasaranUser(currentUser);
  const isInspeksi = isInspeksiUser(currentUser);
  const isRow = isPetugasRowUser(currentUser);

  return (
    <aside className="w-64 bg-gradient-to-b from-[#032b28] via-[#053d38] to-[#021f1d] border-r border-teal-700/60 flex flex-col justify-between shrink-0 h-full text-white font-sans z-20 select-none overflow-y-auto shadow-2xl">
      <div className="p-4 space-y-4">
        {/* FULL DYNAMIC NAVIGATION ACCORDING TO USER'S ALLOWED MENUS */}
        <nav className="space-y-1.5">
          {/* User Profile Card above Dashboard Menu */}
          {currentUser && (
            <div className="p-3.5 bg-[#022320]/80 border border-teal-600/40 rounded-2xl mb-3.5 shadow-lg backdrop-blur-xs">
              <div className="flex items-start gap-3">
                {currentUser.avatarUrl ? (
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.name}
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-amber-400 shadow-md shrink-0 mt-0.5"
                  />
                ) : (
                  <div className={`w-10 h-10 rounded-full ring-2 ring-amber-400 shadow-md flex items-center justify-center font-black text-xs text-slate-950 shrink-0 mt-0.5 ${
                    canEditData(currentUser) ? 'bg-gradient-to-tr from-emerald-400 to-teal-300' : 'bg-gradient-to-tr from-amber-400 to-yellow-300'
                  }`}>
                    {currentUser.name ? currentUser.name.substring(0, 2).toUpperCase() : 'PLN'}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] text-amber-300 font-extrabold uppercase tracking-wider">Welcome</div>
                  
                  {/* Nama Pengguna */}
                  <div className="text-xs font-black text-white truncate drop-shadow-xs" title={currentUser.name}>
                    {currentUser.name}
                  </div>

                  {/* Posisi Di Bawah Nama Pengguna: Akses Semua Unit / Unit Info */}
                  {isOwnerUser(currentUser) ? (
                    <div className="mt-1">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-400/20 border border-amber-400/60 text-amber-300 text-[9px] font-black uppercase tracking-tight shadow-xs">
                        👑 OWNER (AKSES SEMUA UNIT)
                      </span>
                    </div>
                  ) : (
                    <div className="mt-1 flex items-center gap-1">
                      <span className="px-2 py-0.5 rounded-md bg-teal-500/25 text-teal-100 border border-teal-400/40 text-[9px] font-black uppercase inline-block shadow-xs">
                        {currentUser.role || 'Pengguna'}
                      </span>
                      {currentUser.unit && (
                        <span className="px-1.5 py-0.5 rounded-md bg-teal-800/80 text-teal-200 text-[9px] font-bold">
                          {currentUser.unit}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Posisi Di Bawah Nama Pengguna: Filter Data Dropdown */}
                  {isOwnerUser(currentUser) && onSelectUnitFilter && (
                    <div className="mt-2.5 pt-2 border-t border-teal-700/60">
                      <label className="block text-[10px] font-bold text-teal-200 mb-1 flex items-center gap-1">
                        <Filter className="w-3 h-3 text-amber-400" />
                        <span>Filter Data Unit:</span>
                      </label>
                      <select
                        value={ownerSelectedUnitFilter}
                        onChange={(e) => onSelectUnitFilter(e.target.value)}
                        className="w-full bg-[#012823] text-white text-xs font-black px-2 py-1.5 rounded-xl border border-teal-500/80 focus:outline-none focus:border-amber-400 cursor-pointer shadow-sm"
                      >
                        <option value="SEMUA">🌐 Semua Unit (Global)</option>
                        {DAFTAR_UNIT_PLN.map((u, idx) => (
                          <option key={`sb_unit_${u.kodeUnit}_${u.namaUnit}_${idx}`} value={u.namaUnit}>
                            {u.namaUnit} ({u.kodeUnit})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
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

          {canAccessMenu(currentUser, 'peta') && (
            <button
              onClick={() => onSelectView('peta_penyulang')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer group ${
                activeView === 'peta_penyulang' || activeView === 'peta'
                  ? 'bg-gradient-to-r from-teal-500/35 via-teal-500/20 to-teal-900/10 text-white border-l-4 border-l-teal-300 border-y border-r border-teal-500/50 shadow-md shadow-teal-950/60'
                  : 'text-white/95 hover:text-white hover:bg-teal-800/45 border border-transparent hover:border-teal-600/40'
              }`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200 ${
                activeView === 'peta_penyulang' || activeView === 'peta'
                  ? 'bg-gradient-to-tr from-teal-400 via-teal-300 to-emerald-300 text-teal-950 shadow-md shadow-teal-400/40 border border-white/80 scale-105'
                  : 'bg-teal-900/70 text-teal-200 border border-teal-600/40 group-hover:bg-teal-700/80 group-hover:text-white group-hover:border-teal-400 group-hover:scale-105 shadow-xs'
              }`}>
                <Map className="w-4 h-4" />
              </div>
              <span className="font-bold">Peta Penyulang</span>
            </button>
          )}

          {canAccessMenu(currentUser, 'peta') && (
            <button
              onClick={() => onSelectView('input_peta_penyulang')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer group ${
                activeView === 'input_peta_penyulang'
                  ? 'bg-gradient-to-r from-teal-500/35 via-teal-500/20 to-teal-900/10 text-white border-l-4 border-l-teal-300 border-y border-r border-teal-500/50 shadow-md shadow-teal-950/60'
                  : 'text-white/95 hover:text-white hover:bg-teal-800/45 border border-transparent hover:border-teal-600/40'
              }`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200 ${
                activeView === 'input_peta_penyulang'
                  ? 'bg-gradient-to-tr from-teal-400 via-teal-300 to-emerald-300 text-teal-950 shadow-md shadow-teal-400/40 border border-white/80 scale-105'
                  : 'bg-teal-900/70 text-teal-200 border border-teal-600/40 group-hover:bg-teal-700/80 group-hover:text-white group-hover:border-teal-400 group-hover:scale-105 shadow-xs'
              }`}>
                <Upload className="w-4 h-4" />
              </div>
              <span className="font-bold">Input Peta Penyulang</span>
            </button>
          )}

          {canAccessMenu(currentUser, 'master_data') && (
            <button
              onClick={() => onSelectView('master_data')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer group ${
                activeView === 'master_data'
                  ? 'bg-gradient-to-r from-teal-500/35 via-teal-500/20 to-teal-900/10 text-white border-l-4 border-l-teal-300 border-y border-r border-teal-500/50 shadow-md shadow-teal-950/60'
                  : 'text-white/95 hover:text-white hover:bg-teal-800/45 border border-transparent hover:border-teal-600/40'
              }`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200 ${
                activeView === 'master_data'
                  ? 'bg-gradient-to-tr from-teal-400 via-teal-300 to-emerald-300 text-teal-950 shadow-md shadow-teal-400/40 border border-white/80 scale-105'
                  : 'bg-teal-900/70 text-teal-200 border border-teal-600/40 group-hover:bg-teal-700/80 group-hover:text-white group-hover:border-teal-400 group-hover:scale-105 shadow-xs'
              }`}>
                <Database className="w-4 h-4" />
              </div>
              <span className="font-bold">Master Data Penyulang</span>
            </button>
          )}

          {/* Master Data Unit (Khusus Owner) */}
          {isOwnerUser(currentUser) && (
            <button
              onClick={() => onSelectView('master_unit')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer group ${
                activeView === 'master_unit'
                  ? 'bg-gradient-to-r from-amber-500/35 via-teal-500/25 to-teal-900/10 text-white border-l-4 border-l-amber-300 border-y border-r border-amber-500/50 shadow-md shadow-teal-950/60'
                  : 'text-white/95 hover:text-white hover:bg-teal-800/45 border border-amber-500/30'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200 ${
                  activeView === 'master_unit'
                    ? 'bg-gradient-to-tr from-amber-400 via-yellow-300 to-teal-300 text-teal-950 shadow-md shadow-amber-400/40 border border-white/80 scale-105'
                    : 'bg-teal-900/70 text-amber-300 border border-teal-600/40 group-hover:bg-teal-700/80 group-hover:text-white group-hover:border-teal-400 group-hover:scale-105 shadow-xs'
                }`}>
                  <Building2 className="w-4 h-4" />
                </div>
                <span className="font-bold">Master Data Unit PLN</span>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-amber-500/30 text-amber-200 text-[9px] font-black uppercase tracking-wider border border-amber-400/40 shadow-xs">
                Owner
              </span>
            </button>
          )}

          {canAccessMenu(currentUser, 'health_index') && (
            <button
              onClick={() => onSelectView('health_index')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer group ${
                activeView === 'health_index'
                  ? 'bg-gradient-to-r from-teal-500/35 via-teal-500/20 to-teal-900/10 text-white border-l-4 border-l-teal-300 border-y border-r border-teal-500/50 shadow-md shadow-teal-950/60'
                  : 'text-white/95 hover:text-white hover:bg-teal-800/45 border border-transparent hover:border-teal-600/40'
              }`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200 ${
                activeView === 'health_index'
                  ? 'bg-gradient-to-tr from-teal-400 via-teal-300 to-emerald-300 text-teal-950 shadow-md shadow-teal-400/40 border border-white/80 scale-105'
                  : 'bg-teal-900/70 text-teal-200 border border-teal-600/40 group-hover:bg-teal-700/80 group-hover:text-white group-hover:border-teal-400 group-hover:scale-105 shadow-xs'
              }`}>
                <TrendingUp className="w-4 h-4" />
              </div>
              <span className="font-bold">Health Index Penyulang</span>
            </button>
          )}

          {/* 5. Gangguan Trip Feeder */}
          {canAccessMenu(currentUser, 'gangguan') && (
            <button
              onClick={() => onSelectView('matriks_gangguan')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer group ${
                activeView === 'matriks_gangguan'
                  ? 'bg-gradient-to-r from-teal-500/35 via-teal-500/20 to-teal-900/10 text-white border-l-4 border-l-teal-300 border-y border-r border-teal-500/50 shadow-md shadow-teal-950/60'
                  : 'text-white/95 hover:text-white hover:bg-teal-800/45 border border-transparent hover:border-teal-600/40'
              }`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200 ${
                activeView === 'matriks_gangguan'
                  ? 'bg-gradient-to-tr from-amber-400 via-yellow-300 to-teal-300 text-teal-950 shadow-md shadow-amber-400/40 border border-white/80 scale-105'
                  : 'bg-teal-900/70 text-amber-300 border border-teal-600/40 group-hover:bg-teal-700/80 group-hover:text-white group-hover:border-teal-400 group-hover:scale-105 shadow-xs'
              }`}>
                <Zap className="w-4 h-4" />
              </div>
              <span className="font-bold">Gangguan Trip Feeder</span>
            </button>
          )}

          {/* 6. Pemeliharaan 20kV (Monitoring) */}
          {canAccessMenu(currentUser, 'pemeliharaan') && (
            <button
              onClick={() => onSelectView('pemeliharaan_20kv')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer group ${
                activeView === 'pemeliharaan_20kv'
                  ? 'bg-gradient-to-r from-teal-500/35 via-teal-500/20 to-teal-900/10 text-white border-l-4 border-l-teal-300 border-y border-r border-teal-500/50 shadow-md shadow-teal-950/60'
                  : 'text-white/95 hover:text-white hover:bg-teal-800/45 border border-transparent hover:border-teal-600/40'
              }`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200 ${
                activeView === 'pemeliharaan_20kv'
                  ? 'bg-gradient-to-tr from-teal-400 via-teal-300 to-emerald-300 text-teal-950 shadow-md shadow-teal-400/40 border border-white/80 scale-105'
                  : 'bg-teal-900/70 text-teal-200 border border-teal-600/40 group-hover:bg-teal-700/80 group-hover:text-white group-hover:border-teal-400 group-hover:scale-105 shadow-xs'
              }`}>
                <Wrench className="w-4 h-4" />
              </div>
              <span className="font-bold">Monitoring Pemeliharaan</span>
            </button>
          )}

          {/* 7. Format Surat & SPK (ACCORDION) */}
          {canAccessMenu(currentUser, 'spk') && (
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
                  <span className="font-bold">Format Surat & SPK</span>
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
                    <ClipboardList className="w-3.5 h-3.5 text-teal-300 shrink-0" />
                    <span>Perintah Kerja Harian (SPK)</span>
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
                    <span>Format Pembuatan Surat</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 8. Pengukuran & Beban Gardu */}
          {canAccessMenu(currentUser, 'pengukuran_gardu') && (
            <button
              onClick={() => onSelectView('pengukuran_gardu')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer group ${
                activeView === 'pengukuran_gardu'
                  ? 'bg-gradient-to-r from-teal-500/35 via-teal-500/20 to-teal-900/10 text-white border-l-4 border-l-teal-300 border-y border-r border-teal-500/50 shadow-md shadow-teal-950/60'
                  : 'text-white/95 hover:text-white hover:bg-teal-800/45 border border-transparent hover:border-teal-600/40'
              }`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200 ${
                activeView === 'pengukuran_gardu'
                  ? 'bg-gradient-to-tr from-teal-400 via-teal-300 to-emerald-300 text-teal-950 shadow-md shadow-teal-400/40 border border-white/80 scale-105'
                  : 'bg-teal-900/70 text-teal-200 border border-teal-600/40 group-hover:bg-teal-700/80 group-hover:text-white group-hover:border-teal-400 group-hover:scale-105 shadow-xs'
              }`}>
                <Gauge className="w-4 h-4" />
              </div>
              <span className="font-bold">Pengukuran & Beban Gardu</span>
            </button>
          )}

          {/* 9. Survey PB PD */}
          {canAccessMenu(currentUser, 'survey_pb_pd') && (
            <button
              onClick={() => onSelectView('survey_pb_pd')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer group ${
                activeView === 'survey_pb_pd'
                  ? 'bg-gradient-to-r from-teal-500/35 via-teal-500/20 to-teal-900/10 text-white border-l-4 border-l-teal-300 border-y border-r border-teal-500/50 shadow-md shadow-teal-950/60'
                  : 'text-white/95 hover:text-white hover:bg-teal-800/45 border border-transparent hover:border-teal-600/40'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200 ${
                  activeView === 'survey_pb_pd'
                    ? 'bg-gradient-to-tr from-teal-400 via-teal-300 to-emerald-300 text-teal-950 shadow-md shadow-teal-400/40 border border-white/80 scale-105'
                    : 'bg-teal-900/70 text-teal-200 border border-teal-600/40 group-hover:bg-teal-700/80 group-hover:text-white group-hover:border-teal-400 group-hover:scale-105 shadow-xs'
                }`}>
                  <Zap className="w-4 h-4" />
                </div>
                <span className="font-bold">Survey PB & PD</span>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-amber-400/25 text-amber-200 text-[9px] font-black uppercase border border-amber-400/40 shadow-xs">
                PB PD
              </span>
            </button>
          )}

          {/* 10. Saidi Saifi (ACCORDION) */}
          {canAccessMenu(currentUser, 'saidi_saifi') && (
            <div>
              <button
                onClick={() => setSaidiSaifiOpen(!saidiSaifiOpen)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer group ${
                  isSaidiSaifiActive && !saidiSaifiOpen
                    ? 'bg-gradient-to-r from-teal-500/35 via-teal-500/20 to-teal-900/10 text-white border-l-4 border-l-teal-300 border-y border-r border-teal-500/50 shadow-md shadow-teal-950/60'
                    : 'text-white/95 hover:text-white hover:bg-teal-800/45 border border-transparent hover:border-teal-600/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200 ${
                    isSaidiSaifiActive
                      ? 'bg-gradient-to-tr from-teal-400 via-teal-300 to-emerald-300 text-teal-950 shadow-md shadow-teal-400/40 border border-white/80 scale-105'
                      : 'bg-teal-900/70 text-teal-200 border border-teal-600/40 group-hover:bg-teal-700/80 group-hover:text-white group-hover:border-teal-400 group-hover:scale-105 shadow-xs'
                  }`}>
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <span className="font-bold">Saidi Saifi</span>
                </div>
                <div>
                  {saidiSaifiOpen ? (
                    <ChevronDown className="w-4 h-4 text-teal-300" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-teal-400/70 group-hover:text-white" />
                  )}
                </div>
              </button>

              {saidiSaifiOpen && (
                <div className="pl-4 mt-1.5 space-y-1 border-l-2 border-teal-500/40 ml-5">
                  <button
                    onClick={() => onSelectView('saidi_saifi')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all text-left cursor-pointer ${
                      activeView === 'saidi_saifi'
                        ? 'bg-teal-600/35 text-white font-extrabold border border-teal-400/50 shadow-xs'
                        : 'text-teal-100 hover:text-white hover:bg-teal-800/50'
                    }`}
                  >
                    <Activity className="w-3.5 h-3.5 text-teal-300 shrink-0" />
                    <span>Realisasi SAIDI & SAIFI</span>
                  </button>

                  <button
                    onClick={() => onSelectView('estimasi_saidi_saifi')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all text-left cursor-pointer ${
                      activeView === 'estimasi_saidi_saifi'
                        ? 'bg-teal-600/35 text-white font-extrabold border border-teal-400/50 shadow-xs'
                        : 'text-teal-100 hover:text-white hover:bg-teal-800/50'
                    }`}
                  >
                    <Calculator className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                    <span>Estimasi SAIDI/SAIFI (Event)</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 6.5. Monitoring Yantek (ACCORDION) */}
          {canAccessMenu(currentUser, 'monitoring_yantek') && (
            <div>
              <button
                onClick={() => {
                  setMonitoringYantekOpen(!monitoringYantekOpen);
                  if (!monitoringYantekOpen) {
                    onSelectView('monitoring_yantek');
                  }
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer group ${
                  isMonitoringYantekActive && !monitoringYantekOpen
                    ? 'bg-gradient-to-r from-teal-500/35 via-teal-500/20 to-teal-900/10 text-white border-l-4 border-l-teal-300 border-y border-r border-teal-500/50 shadow-md shadow-teal-950/60'
                    : 'text-white/95 hover:text-white hover:bg-teal-800/45 border border-transparent hover:border-teal-600/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200 ${
                    isMonitoringYantekActive
                      ? 'bg-gradient-to-tr from-teal-400 via-teal-300 to-emerald-300 text-teal-950 shadow-md shadow-teal-400/40 border border-white/80 scale-105'
                      : 'bg-teal-900/70 text-teal-200 border border-teal-600/40 group-hover:bg-teal-700/80 group-hover:text-white group-hover:border-teal-400 group-hover:scale-105 shadow-xs'
                  }`}>
                    <HardHat className="w-4 h-4" />
                  </div>
                  <span className="font-bold">Monitoring Yantek</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded bg-teal-500/30 text-teal-200 border border-teal-400/40 text-[9px] font-black uppercase">
                    Live GPS
                  </span>
                  {monitoringYantekOpen ? (
                    <ChevronDown className="w-4 h-4 text-teal-300" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-teal-400/70 group-hover:text-white" />
                  )}
                </div>
              </button>

              {monitoringYantekOpen && (
                <div className="pl-4 mt-1.5 space-y-1 border-l-2 border-teal-500/40 ml-5">
                  <button
                    onClick={() => onSelectView('peta_pohon')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all text-left cursor-pointer ${
                      activeView === 'peta_pohon'
                        ? 'bg-teal-600/35 text-white font-extrabold border border-teal-400/50 shadow-xs'
                        : 'text-teal-100 hover:text-white hover:bg-teal-800/50'
                    }`}
                  >
                    <Trees className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                    <span>Peta Titik Pohon (GIS)</span>
                  </button>

                  <button
                    onClick={() => onSelectView('row')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all text-left cursor-pointer ${
                      activeView === 'row'
                        ? 'bg-teal-600/35 text-white font-extrabold border border-teal-400/50 shadow-xs'
                        : 'text-teal-100 hover:text-white hover:bg-teal-800/50'
                    }`}
                  >
                    <Trees className="w-3.5 h-3.5 text-teal-300 shrink-0" />
                    <span>Realisasi ROW (Pangkas)</span>
                  </button>

                  {/* Menu Inspeksi Tier 1 */}
                  <div className="pt-2.5 pb-1 px-3 text-[10px] font-black uppercase text-amber-300 tracking-wider border-t border-teal-800/60">
                    Inspeksi Tier 1 (Visual)
                  </div>
                  <button
                    onClick={() => onSelectView('inspeksi_tier1')}
                    className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all text-left cursor-pointer ${
                      activeView === 'inspeksi_tier1'
                        ? 'bg-teal-600/35 text-white font-extrabold border border-teal-400/50 shadow-xs'
                        : 'text-teal-100 hover:text-white hover:bg-teal-800/50'
                    }`}
                  >
                    <Search className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                    <span className="truncate font-extrabold text-amber-200">Inspeksi Pohon & SUTM</span>
                  </button>
                  <button
                    onClick={() => onSelectView('inspeksi_tier1_jtm')}
                    className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all text-left cursor-pointer ${
                      activeView === 'inspeksi_tier1_jtm'
                        ? 'bg-teal-600/35 text-white font-extrabold border border-teal-400/50 shadow-xs'
                        : 'text-teal-100 hover:text-white hover:bg-teal-800/50'
                    }`}
                  >
                    <Search className="w-3.5 h-3.5 text-teal-300 shrink-0" />
                    <span className="truncate">Checklist JTM (Jaringan)</span>
                  </button>
                  <button
                    onClick={() => onSelectView('inspeksi_tier1_gtt')}
                    className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all text-left cursor-pointer ${
                      activeView === 'inspeksi_tier1_gtt'
                        ? 'bg-teal-600/35 text-white font-extrabold border border-teal-400/50 shadow-xs'
                        : 'text-teal-100 hover:text-white hover:bg-teal-800/50'
                    }`}
                  >
                    <Search className="w-3.5 h-3.5 text-teal-300 shrink-0" />
                    <span className="truncate">Checklist GTT (Gardu)</span>
                  </button>
                  <button
                    onClick={() => onSelectView('inspeksi_tier1_switching')}
                    className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all text-left cursor-pointer ${
                      activeView === 'inspeksi_tier1_switching'
                        ? 'bg-teal-600/35 text-white font-extrabold border border-teal-400/50 shadow-xs'
                        : 'text-teal-100 hover:text-white hover:bg-teal-800/50'
                    }`}
                  >
                    <Search className="w-3.5 h-3.5 text-teal-300 shrink-0" />
                    <span className="truncate">Checklist Switching</span>
                  </button>

                  {/* Menu Inspeksi Tier 2 */}
                  <div className="pt-2.5 pb-1 px-3 text-[10px] font-black uppercase text-teal-300 tracking-wider border-t border-teal-800/60">
                    Inspeksi Tier 2 (Alat)
                  </div>
                  <button
                    onClick={() => onSelectView('inspeksi_tier2_thermovision')}
                    className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all text-left cursor-pointer ${
                      activeView === 'inspeksi_tier2_thermovision'
                        ? 'bg-teal-600/35 text-white font-extrabold border border-teal-400/50 shadow-xs'
                        : 'text-teal-100 hover:text-white hover:bg-teal-800/50'
                    }`}
                  >
                    <Search className="w-3.5 h-3.5 text-teal-300 shrink-0" />
                    <span className="truncate">Thermovision (Hotspot)</span>
                  </button>
                  <button
                    onClick={() => onSelectView('inspeksi_tier2_ultrasound')}
                    className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all text-left cursor-pointer ${
                      activeView === 'inspeksi_tier2_ultrasound'
                        ? 'bg-teal-600/35 text-white font-extrabold border border-teal-400/50 shadow-xs'
                        : 'text-teal-100 hover:text-white hover:bg-teal-800/50'
                    }`}
                  >
                    <Search className="w-3.5 h-3.5 text-teal-300 shrink-0" />
                    <span className="truncate">Ultrasound (Corona)</span>
                  </button>

                  <button
                    onClick={() => onSelectView('jadwal_piket')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all text-left cursor-pointer ${
                      activeView === 'jadwal_piket'
                        ? 'bg-teal-600/35 text-white font-extrabold border border-teal-400/50 shadow-xs'
                        : 'text-teal-100 hover:text-white hover:bg-teal-800/50'
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5 text-teal-300 shrink-0" />
                    <span>Jadwal Piket Yantek</span>
                  </button>

                  <button
                    onClick={() => onSelectView('kendaraan_operasional')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all text-left cursor-pointer ${
                      activeView === 'kendaraan_operasional'
                        ? 'bg-teal-600/35 text-white font-extrabold border border-teal-400/50 shadow-xs'
                        : 'text-teal-100 hover:text-white hover:bg-teal-800/50'
                    }`}
                  >
                    <Car className="w-3.5 h-3.5 text-teal-300 shrink-0" />
                    <span className="flex-1 truncate">Kendaraan Live GPS</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  </button>

                  <button
                    onClick={() => onSelectView('material')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all text-left cursor-pointer ${
                      activeView === 'material'
                        ? 'bg-teal-600/35 text-white font-extrabold border border-teal-400/50 shadow-xs'
                        : 'text-teal-100 hover:text-white hover:bg-teal-800/50'
                    }`}
                  >
                    <Package className="w-3.5 h-3.5 text-teal-300 shrink-0" />
                    <span className="truncate">Manajemen Material</span>
                  </button>

                  <button
                    onClick={() => onSelectView('alker_apd')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all text-left cursor-pointer ${
                      activeView === 'alker_apd'
                        ? 'bg-teal-600/35 text-white font-extrabold border border-teal-400/50 shadow-xs'
                        : 'text-teal-100 hover:text-white hover:bg-teal-800/50'
                    }`}
                  >
                    <Wrench className="w-3.5 h-3.5 text-teal-300 shrink-0" />
                    <span className="truncate">Peralatan & APD (Alker)</span>
                  </button>
                </div>
              )}
            </div>
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

          {/* Live Chat */}
          {canAccessMenu(currentUser, 'live_chat') && (
            <button
              onClick={() => onSelectView('live_chat')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer group ${
                activeView === 'live_chat'
                  ? 'bg-gradient-to-r from-teal-500/35 via-teal-500/20 to-teal-900/10 text-white border-l-4 border-l-teal-300 border-y border-r border-teal-500/50 shadow-md shadow-teal-950/60'
                  : 'text-white/95 hover:text-white hover:bg-teal-800/45 border border-transparent hover:border-teal-600/40'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 relative transition-all duration-200 ${
                  activeView === 'live_chat'
                    ? 'bg-gradient-to-tr from-teal-400 via-teal-300 to-emerald-300 text-teal-950 shadow-md shadow-teal-400/40 border border-white/80 scale-105'
                    : 'bg-teal-900/70 text-teal-200 border border-teal-600/40 group-hover:bg-teal-700/80 group-hover:text-white group-hover:border-teal-400 group-hover:scale-105 shadow-xs'
                }`}>
                  <MessageCircle className="w-4 h-4" />
                  <span className="absolute -top-1 -right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-300 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-400"></span>
                  </span>
                </div>
                <span className="font-bold">Live Chat</span>
              </div>
            </button>
          )}

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
              Apakah Anda yakin ingin keluar dari sistem Digitalisasi Monitoring PLN ULP Baguala?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                Batal
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
                <span>Ya, Keluar</span>
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
