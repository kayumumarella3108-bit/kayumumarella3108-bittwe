import React, { useState, useMemo } from 'react';
import {
  Activity,
  Users,
  Shield,
  Radio,
  Clock,
  Laptop,
  Smartphone,
  Globe,
  Search,
  Filter,
  RefreshCw,
  LogOut,
  Send,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Eye,
  Bell,
  Sparkles,
  LayoutGrid,
  List,
  Flame,
  Layers,
  ArrowUpRight,
  X,
  MessageSquare
} from 'lucide-react';
import { User, UserOnlinePresence, SystemBroadcastMessage, ViewType } from '../../types';
import { isOwnerUser } from '../../utils/permissions';
import { calculatePresenceStatus, getViewDisplayName } from '../../utils/presenceTracker';
import { db, doc, updateDoc, deleteDoc, setDoc } from '../../lib/firebase';

interface MonitoringOnlineViewProps {
  currentUser: User;
  onlineUsersList: UserOnlinePresence[];
  registeredUsersList?: User[];
  onSelectView?: (view: ViewType) => void;
  onSendBroadcast?: (message: string, type: 'info' | 'warning' | 'urgent', targetUser?: string) => Promise<void>;
}

export const MonitoringOnlineView: React.FC<MonitoringOnlineViewProps> = ({
  currentUser,
  onlineUsersList = [],
  registeredUsersList = [],
  onSelectView,
  onSendBroadcast
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'idle' | 'offline'>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [viewLayout, setViewLayout] = useState<'grid' | 'table'>('grid');
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [selectedTargetUser, setSelectedTargetUser] = useState<UserOnlinePresence | null>(null);
  const [broadcastText, setBroadcastText] = useState('');
  const [broadcastType, setBroadcastType] = useState<'info' | 'warning' | 'urgent'>('info');
  const [isSendingBroadcast, setIsSendingBroadcast] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');
  const [confirmDisconnectUser, setConfirmDisconnectUser] = useState<UserOnlinePresence | null>(null);

  const isOwner = isOwnerUser(currentUser);

  // Fallback / Security gate: If non-owner somehow lands here, strictly deny access
  if (!isOwner) {
    return (
      <div className="p-8 max-w-4xl mx-auto min-h-[60vh] flex flex-col items-center justify-center text-center">
        <div className="p-4 bg-rose-100 text-rose-700 rounded-3xl mb-4 border border-rose-200 shadow-xl">
          <Lock className="w-12 h-12" />
        </div>
        <h2 className="text-xl font-black text-slate-900 tracking-tight">
          Akses Terbatas: Khusus Status Sistem
        </h2>
        <p className="text-sm text-slate-500 mt-2 max-w-md leading-relaxed">
          Halaman Monitoring User Online ini dirancang eksklusif dan hanya dapat diakses oleh akun dengan status / kewenangan <strong>Sistem</strong> PLN ULP Baguala.
        </p>
      </div>
    );
  }

  // Calculate live presence statuses for each recorded user
  const processedPresences = useMemo(() => {
    return onlineUsersList.map((p) => {
      const calc = calculatePresenceStatus(p);
      return {
        ...p,
        calculatedStatus: calc.status,
        badgeBg: calc.badgeBg,
        badgeColor: calc.badgeColor,
        badgeBorder: calc.badgeBorder,
        statusLabel: calc.label,
        timeAgoText: calc.timeAgoText
      };
    });
  }, [onlineUsersList]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    const onlineCount = processedPresences.filter((p) => p.calculatedStatus === 'online').length;
    const idleCount = processedPresences.filter((p) => p.calculatedStatus === 'idle').length;
    const offlineCount = processedPresences.filter((p) => p.calculatedStatus === 'offline').length;
    const totalSessions = processedPresences.length;

    // View breakdown count
    const viewCounts: Record<string, number> = {};
    processedPresences
      .filter((p) => p.calculatedStatus === 'online' || p.calculatedStatus === 'idle')
      .forEach((p) => {
        const label = p.activeViewLabel || getViewDisplayName(p.activeView) || 'Dashboard';
        viewCounts[label] = (viewCounts[label] || 0) + 1;
      });

    let topActiveModule = 'Dashboard Utama';
    let topModuleCount = 0;
    Object.entries(viewCounts).forEach(([mod, count]) => {
      if (count > topModuleCount) {
        topActiveModule = mod;
        topModuleCount = count;
      }
    });

    return {
      onlineCount,
      idleCount,
      offlineCount,
      totalSessions,
      topActiveModule,
      topModuleCount
    };
  }, [processedPresences]);

  // Filtered List
  const filteredUsers = useMemo(() => {
    return processedPresences.filter((p) => {
      const matchSearch =
        searchQuery.trim() === '' ||
        (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.username || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.role || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.unit || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.activeViewLabel || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.deviceInfo || '').toLowerCase().includes(searchQuery.toLowerCase());

      const matchStatus =
        statusFilter === 'all' || p.calculatedStatus === statusFilter;

      const matchRole =
        roleFilter === 'all' || (p.role || '').toLowerCase() === roleFilter.toLowerCase();

      return matchSearch && matchStatus && matchRole;
    });
  }, [processedPresences, searchQuery, statusFilter, roleFilter]);

  // Force disconnect user
  const handleForceDisconnect = async (target: UserOnlinePresence) => {
    try {
      const docId = target.id || target.username;
      await updateDoc(doc(db, 'online_users', docId), {
        status: 'offline',
        forceLoggedOut: true,
        lastActive: new Date().toISOString()
      });
      setActionSuccessMsg(`Sesi user ${target.name} (${target.username}) berhasil diputus.`);
      setConfirmDisconnectUser(null);
      setTimeout(() => setActionSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Error disconnecting user:', err);
      try {
        // Fallback: Delete doc if updateDoc fails
        await deleteDoc(doc(db, 'online_users', target.id || target.username));
        setActionSuccessMsg(`Sesi user ${target.name} berhasil dihapus.`);
        setConfirmDisconnectUser(null);
        setTimeout(() => setActionSuccessMsg(''), 4000);
      } catch (innerErr) {
        alert('Gagal memutuskan sesi user. Periksa koneksi Firestore.');
      }
    }
  };

  // Submit Broadcast Notification
  const handleBroadcastSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastText.trim()) return;

    setIsSendingBroadcast(true);
    try {
      if (onSendBroadcast) {
        await onSendBroadcast(
          broadcastText.trim(),
          broadcastType,
          selectedTargetUser ? selectedTargetUser.username : undefined
        );
      } else {
        // Save to Firestore broadcast_messages collection
        const newMsgId = `bcast_${Date.now()}`;
        const newMsg: SystemBroadcastMessage = {
          id: newMsgId,
          sender: currentUser.name || 'Owner Sistem',
          senderRole: 'Owner',
          message: broadcastText.trim(),
          targetUsername: selectedTargetUser ? selectedTargetUser.username : 'all',
          createdAt: new Date().toISOString(),
          type: broadcastType,
          active: true
        };
        await setDoc(doc(db, 'broadcast_messages', newMsgId), newMsg);
      }

      setActionSuccessMsg(
        selectedTargetUser
          ? `Pesan broadcast terkirim khusus ke ${selectedTargetUser.name}!`
          : 'Pesan broadcast terkirim ke seluruh pengguna online!'
      );
      setBroadcastText('');
      setSelectedTargetUser(null);
      setIsBroadcastModalOpen(false);
      setTimeout(() => setActionSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Error sending broadcast:', err);
      alert('Gagal mengirim pesan broadcast.');
    } finally {
      setIsSendingBroadcast(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Header Banner - Owner VIP Theme */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950 p-6 rounded-3xl border border-emerald-500/30 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="w-2 h-2 rounded-full bg-emerald-400 -ml-3.5" />
                Live Monitoring Sistem
              </span>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black uppercase">
                PLN ULP Baguala
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
              <Activity className="w-6 h-6 text-emerald-400" />
              Monitoring User Online & Sesi Aplikasi
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Pantau seluruh pengguna yang sedang aktif membuka aplikasi, modul yang sedang diakses secara real-time, perangkat yang digunakan, serta kendali pemutusan sesi & broadcast khusus Sistem.
            </p>
          </div>

          {/* Quick Action Button for Owner */}
          <div className="flex items-center gap-2.5 self-start md:self-auto shrink-0">
            <button
              onClick={() => {
                setSelectedTargetUser(null);
                setIsBroadcastModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 font-black text-xs transition-all shadow-lg shadow-emerald-500/25 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Kirim Broadcast</span>
            </button>
          </div>
        </div>
      </div>

      {/* Success Alert Banner */}
      {actionSuccessMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center justify-between shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{actionSuccessMsg}</span>
          </div>
          <button
            onClick={() => setActionSuccessMsg('')}
            className="p-1 text-emerald-600 hover:text-emerald-900 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Metric Cards KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: User Online Sekarang */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Online Sekarang
            </span>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 flex items-center justify-center">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-slate-900">
              {metrics.onlineCount}
            </div>
            <p className="text-[11px] text-emerald-600 font-bold mt-1 flex items-center gap-1">
              <span>● Aktif dalam 3 menit terakhir</span>
            </p>
          </div>
        </div>

        {/* Card 2: User Idle / AFK */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Idle / Tidak Aktif
            </span>
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl border border-amber-100">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-slate-900">
              {metrics.idleCount}
            </div>
            <p className="text-[11px] text-amber-600 font-bold mt-1">
              ● Sesi aktif (3 - 10 menit diam)
            </p>
          </div>
        </div>

        {/* Card 3: Total Terdaftar / Terdata */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Total User Terdaftar
            </span>
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-slate-900">
              {registeredUsersList.length || processedPresences.length}
            </div>
            <p className="text-[11px] text-slate-500 font-bold mt-1">
              Akun resmi sistem PLN Baguala
            </p>
          </div>
        </div>

        {/* Card 4: Modul Paling Ramai */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Modul Paling Sering Diakses
            </span>
            <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl border border-purple-100">
              <Flame className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-sm font-black text-slate-900 truncate" title={metrics.topActiveModule}>
              {metrics.topActiveModule}
            </div>
            <p className="text-[11px] text-purple-600 font-bold mt-1">
              Sedang diakses oleh {metrics.topModuleCount} user
            </p>
          </div>
        </div>
      </div>

      {/* Main Filter & Search Control Panel */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama, username, jabatan, modul, atau perangkat..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-emerald-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                Clear
              </button>
            )}
          </div>

          {/* Status Filter Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {[
              { id: 'all', label: 'Semua Status' },
              { id: 'online', label: `🟢 Online (${metrics.onlineCount})` },
              { id: 'idle', label: `🟡 Idle (${metrics.idleCount})` },
              { id: 'offline', label: `⚪ Offline (${metrics.offlineCount})` }
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setStatusFilter(st.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  statusFilter === st.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          {/* View Mode Toggle: Grid vs Table */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0">
            <button
              onClick={() => setViewLayout('grid')}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewLayout === 'grid'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Tampilan Kartu Interaktif"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewLayout('table')}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewLayout === 'table'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Tampilan Tabel Rinci"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Users Display Section */}
      {filteredUsers.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-3xl flex items-center justify-center mx-auto mb-3">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="text-base font-black text-slate-800">
            Tidak Ada User Ditemukan
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Tidak ada riwayat aktivitas user yang cocok dengan filter atau kata kunci pencarian saat ini.
          </p>
        </div>
      ) : viewLayout === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredUsers.map((item) => {
            const isSelf = (currentUser.username || '').toLowerCase() === (item.username || '').toLowerCase();
            return (
              <div
                key={item.id || item.username}
                className={`bg-white rounded-2xl border p-5 shadow-xs transition-all hover:shadow-md flex flex-col justify-between relative group ${
                  item.calculatedStatus === 'online'
                    ? 'border-emerald-200/80 ring-1 ring-emerald-500/15'
                    : item.calculatedStatus === 'idle'
                    ? 'border-amber-200/80 ring-1 ring-amber-500/10'
                    : 'border-slate-200 opacity-80'
                }`}
              >
                <div>
                  {/* Top Row: Avatar, User Details, Status Badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative shrink-0">
                        {item.avatarUrl ? (
                          <img
                            src={item.avatarUrl}
                            alt={item.name}
                            referrerPolicy="no-referrer"
                            className="w-12 h-12 rounded-2xl object-cover border-2 border-white shadow-sm"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white font-black text-sm flex items-center justify-center border-2 border-white shadow-sm">
                            {(item.name || item.username || 'PL').substring(0, 2).toUpperCase()}
                          </div>
                        )}
                        {/* Status Dot Indicator */}
                        <span
                          className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center ${
                            item.calculatedStatus === 'online'
                              ? 'bg-emerald-500'
                              : item.calculatedStatus === 'idle'
                              ? 'bg-amber-400'
                              : 'bg-slate-400'
                          }`}
                        >
                          {item.calculatedStatus === 'online' && (
                            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                          )}
                        </span>
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-black text-slate-900 truncate" title={item.name}>
                            {item.name}
                          </h4>
                          {isSelf && (
                            <span className="px-1.5 py-0.2 bg-blue-100 text-blue-700 text-[9px] font-black rounded-sm uppercase">
                              Anda
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono truncate">
                          @{item.username}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded-lg border border-slate-200">
                            {item.role || 'Petugas'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium truncate">
                            • {item.unit || 'ULP Baguala'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Status Pill Badge */}
                    <div className={`px-2.5 py-1 rounded-xl text-[10px] font-black border uppercase tracking-wider shrink-0 ${item.badgeBg} ${item.badgeColor} ${item.badgeBorder}`}>
                      {item.statusLabel}
                    </div>
                  </div>

                  {/* Active Module Tracker Info */}
                  <div className="mt-4 p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 font-bold flex items-center gap-1">
                        <Radio className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                        Sedang Mengakses:
                      </span>
                      <span className="text-slate-400 text-[10px] font-medium">
                        {item.timeAgoText}
                      </span>
                    </div>
                    <div className="font-bold text-xs text-slate-800 flex items-center gap-1.5 truncate" title={item.activeViewLabel || getViewDisplayName(item.activeView)}>
                      <Layers className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span className="truncate">{item.activeViewLabel || getViewDisplayName(item.activeView) || 'Dashboard Utama'}</span>
                    </div>
                  </div>

                  {/* Device & Client Info */}
                  <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-slate-600 font-medium">
                    <div className="flex items-center gap-1.5 bg-slate-50/70 p-2 rounded-lg border border-slate-100 truncate">
                      {item.deviceInfo?.includes('Smartphone') || item.deviceInfo?.includes('iOS') ? (
                        <Smartphone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      ) : (
                        <Laptop className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      )}
                      <span className="truncate" title={item.deviceInfo}>{item.deviceInfo || 'Perangkat Web'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-slate-50/70 p-2 rounded-lg border border-slate-100 truncate">
                      <Globe className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="truncate" title={item.browserInfo}>{item.browserInfo || 'Browser'}</span>
                    </div>
                  </div>
                </div>

                {/* Owner Actions Bottom Bar */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      setSelectedTargetUser(item);
                      setIsBroadcastModalOpen(true);
                    }}
                    className="flex-1 py-1.5 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    title={`Kirim Pesan Langsung ke ${item.name}`}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Kirim Pesan</span>
                  </button>

                  {!isSelf && (
                    <button
                      onClick={() => setConfirmDisconnectUser(item)}
                      className="py-1.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      title={`Putuskan Sesi / Force Logout User ${item.name}`}
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Putus Sesi</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white font-bold border-b border-slate-800">
                  <th className="py-3.5 px-4">Pengguna / Akun</th>
                  <th className="py-3.5 px-4">Jabatan & Unit</th>
                  <th className="py-3.5 px-4">Status Online</th>
                  <th className="py-3.5 px-4">Modul yang Sedang Dibuka</th>
                  <th className="py-3.5 px-4">Perangkat & Browser</th>
                  <th className="py-3.5 px-4">Terakhir Aktif</th>
                  <th className="py-3.5 px-4 text-center">Aksi Owner</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredUsers.map((item) => {
                  const isSelf = (currentUser.username || '').toLowerCase() === (item.username || '').toLowerCase();
                  return (
                    <tr
                      key={item.id || item.username}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      {/* Name & Avatar */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="relative shrink-0">
                            {item.avatarUrl ? (
                              <img
                                src={item.avatarUrl}
                                alt={item.name}
                                referrerPolicy="no-referrer"
                                className="w-9 h-9 rounded-xl object-cover border border-slate-200 shadow-xs"
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-xl bg-slate-900 text-white font-black text-xs flex items-center justify-center">
                                {(item.name || 'PL').substring(0, 2).toUpperCase()}
                              </div>
                            )}
                            <span
                              className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                                item.calculatedStatus === 'online'
                                  ? 'bg-emerald-500'
                                  : item.calculatedStatus === 'idle'
                                  ? 'bg-amber-400'
                                  : 'bg-slate-400'
                              }`}
                            />
                          </div>
                          <div>
                            <div className="font-black text-slate-900 flex items-center gap-1.5">
                              <span>{item.name}</span>
                              {isSelf && (
                                <span className="px-1.5 py-0.2 bg-blue-100 text-blue-700 text-[9px] font-black rounded-sm">
                                  Anda
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono">
                              @{item.username}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role & Unit */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{item.role || 'Petugas'}</div>
                        <div className="text-[11px] text-slate-500">{item.unit || 'ULP Baguala'}</div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black border uppercase tracking-wider inline-block ${item.badgeBg} ${item.badgeColor} ${item.badgeBorder}`}>
                          {item.statusLabel}
                        </span>
                      </td>

                      {/* Active View */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span>{item.activeViewLabel || getViewDisplayName(item.activeView) || 'Dashboard Utama'}</span>
                        </div>
                      </td>

                      {/* Device & Browser */}
                      <td className="py-3.5 px-4">
                        <div className="text-[11px] text-slate-800 font-medium">
                          {item.deviceInfo || 'Desktop PC'}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {item.browserInfo || 'Modern Browser'}
                        </div>
                      </td>

                      {/* Last Active */}
                      <td className="py-3.5 px-4">
                        <div className="text-slate-900 font-bold">{item.timeAgoText}</div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedTargetUser(item);
                              setIsBroadcastModalOpen(true);
                            }}
                            className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors cursor-pointer"
                            title="Kirim Notifikasi"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>
                          {!isSelf && (
                            <button
                              onClick={() => setConfirmDisconnectUser(item)}
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg transition-colors cursor-pointer"
                              title="Putuskan Sesi User"
                            >
                              <LogOut className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Broadcast Notification Composer */}
      {isBroadcastModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 text-left space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-2xl">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {selectedTargetUser ? `Kirim Pesan ke @${selectedTargetUser.username}` : 'Broadcast Pengumuman ke Seluruh User Online'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {selectedTargetUser
                      ? `Pesan akan muncul sebagai banner notifikasi di layar ${selectedTargetUser.name}`
                      : 'Pesan akan langsung muncul sebagai notifikasi pop-up di layar semua pengguna yang sedang online'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsBroadcastModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleBroadcastSubmit} className="space-y-4">
              {/* Type selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Tipe Notifikasi
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'info', label: 'ℹ️ Informasi', activeBg: 'bg-blue-600 text-white' },
                    { id: 'warning', label: '⚠️ Peringatan K3', activeBg: 'bg-amber-500 text-white' },
                    { id: 'urgent', label: '🚨 Darurat / SPK', activeBg: 'bg-rose-600 text-white' }
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setBroadcastType(t.id as any)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        broadcastType === t.id
                          ? `${t.activeBg} border-transparent shadow-sm`
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message text */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Isi Pesan Notifikasi
                </label>
                <textarea
                  rows={4}
                  value={broadcastText}
                  onChange={(e) => setBroadcastText(e.target.value)}
                  placeholder="Contoh: Perhatian seluruh tim teknik, mohon periksa kelengkapan APD K3 sebelum menuju lokasi Manuver Gardu..."
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-500 transition-all"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsBroadcastModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSendingBroadcast || !broadcastText.trim()}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 text-white text-xs font-black flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-emerald-600/20"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSendingBroadcast ? 'Mengirim...' : 'Kirim Sekarang'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirm Force Disconnect */}
      {confirmDisconnectUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-sm w-full p-6 text-left space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600 pb-2 border-b border-slate-100">
              <div className="p-2 bg-rose-100 rounded-xl">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-black text-slate-900">
                Putuskan Sesi Pengguna?
              </h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Apakah Anda yakin ingin memutuskan sesi aktif untuk user <strong>{confirmDisconnectUser.name}</strong> (@{confirmDisconnectUser.username})?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setConfirmDisconnectUser(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => handleForceDisconnect(confirmDisconnectUser)}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-rose-600/20"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Ya, Putuskan Sesi</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
