import React, { useState } from 'react';
import {
  Inbox,
  Send,
  Headphones,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Building2,
  MessageSquare,
  Search,
  Filter,
  User,
  Tag,
  Calendar,
  Sparkles,
  CornerDownRight,
  Trash2,
  Check
} from 'lucide-react';
import { User as UserType, HelpDeskMessage } from '../../types';
import { isOwnerUser } from '../../utils/permissions';
import { DAFTAR_UNIT_PLN, getKodeUnitByUnitName } from '../../utils/unitConfig';

interface HelpDeskViewProps {
  currentUser: UserType;
  messages: HelpDeskMessage[];
  onSendMessage: (msg: Omit<HelpDeskMessage, 'id' | 'tanggal' | 'status'>) => Promise<void> | void;
  onUpdateStatus?: (id: string, status: HelpDeskMessage['status'], ownerReply?: string) => Promise<void> | void;
  onDeleteMessage?: (id: string) => Promise<void> | void;
}

export const HelpDeskView: React.FC<HelpDeskViewProps> = ({
  currentUser,
  messages = [],
  onSendMessage,
  onUpdateStatus,
  onDeleteMessage
}) => {
  const isOwner = isOwnerUser(currentUser);
  const [activeTab, setActiveTab] = useState<'inbox' | 'message'>('inbox');

  // Form State for "Message" tab
  const defaultUnitName = currentUser.unit || 'ULP Baguala';
  const defaultKodeUnit = currentUser.kodeUnit || getKodeUnitByUnitName(defaultUnitName) || '54110';

  const [unit, setUnit] = useState<string>(defaultUnitName);
  const [kodeUnit, setKodeUnit] = useState<string>(defaultKodeUnit);
  const [kategori, setKategori] = useState<string>('Pengajuan Fitur Baru');
  const [subjek, setSubjek] = useState<string>('');
  const [pesan, setPesan] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showSuccessToast, setShowSuccessToast] = useState<boolean>(false);

  // Filter & Search State for "Inbox" tab
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('SEMUA');
  const [kategoriFilter, setKategoriFilter] = useState<string>('SEMUA');

  // Modal / Form reply state for Owner
  const [selectedMessageForReply, setSelectedMessageForReply] = useState<HelpDeskMessage | null>(null);
  const [replyText, setReplyText] = useState<string>('');
  const [replyStatus, setReplyStatus] = useState<HelpDeskMessage['status']>('SELESAI');

  // Handle Form Submit (Sending new Message)
  const handleSubmitMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pesan.trim()) {
      alert('Mohon isi pesan atau pengajuan terlebih dahulu.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSendMessage({
        senderId: currentUser.id || currentUser.username,
        senderName: currentUser.name || 'Pengguna PLN',
        senderUsername: currentUser.username,
        senderRole: currentUser.role || 'Staff',
        unit: unit.trim() || 'ULP Baguala',
        kodeUnit: kodeUnit.trim() || '54110',
        kategori,
        subjek: subjek.trim() || `Pengajuan ${kategori}`,
        pesan: pesan.trim()
      });

      // Reset form
      setSubjek('');
      setPesan('');
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 4000);

      // Auto switch to Inbox
      setActiveTab('inbox');
    } catch (err) {
      console.error('Failed to send helpdesk message:', err);
      alert('Gagal mengirim pesan. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Owner Reply / Update Status
  const handleSaveReply = async () => {
    if (!selectedMessageForReply || !onUpdateStatus) return;
    try {
      await onUpdateStatus(selectedMessageForReply.id, replyStatus, replyText.trim() || undefined);
      setSelectedMessageForReply(null);
      setReplyText('');
    } catch (err) {
      console.error('Failed to update message status:', err);
      alert('Gagal memperbarui status pesan.');
    }
  };

  // Filter messages based on User Role & Filter state
  const visibleMessages = messages.filter((msg) => {
    // If not Owner, user can see messages from their own username or senderId or same Unit
    if (!isOwner) {
      const isMyMessage =
        msg.senderUsername === currentUser.username ||
        msg.senderId === currentUser.id ||
        msg.senderName === currentUser.name ||
        msg.unit === currentUser.unit;
      if (!isMyMessage) return false;
    }

    // Status Filter
    if (statusFilter !== 'SEMUA' && msg.status !== statusFilter) return false;

    // Kategori Filter
    if (kategoriFilter !== 'SEMUA' && msg.kategori !== kategoriFilter) return false;

    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchUnit = msg.unit?.toLowerCase().includes(q) || false;
      const matchKode = msg.kodeUnit?.toLowerCase().includes(q) || false;
      const matchPesan = msg.pesan?.toLowerCase().includes(q) || false;
      const matchSubjek = msg.subjek?.toLowerCase().includes(q) || false;
      const matchSender = msg.senderName?.toLowerCase().includes(q) || false;
      if (!matchUnit && !matchKode && !matchPesan && !matchSubjek && !matchSender) return false;
    }

    return true;
  });

  // Calculate statistics
  const totalCount = visibleMessages.length;
  const baruCount = visibleMessages.filter((m) => m.status === 'BARU').length;
  const diprosesCount = visibleMessages.filter((m) => m.status === 'DIPROSES').length;
  const selesaiCount = visibleMessages.filter((m) => m.status === 'SELESAI').length;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto text-slate-100">
      {/* Banner Title */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#022823] via-[#044c45] to-[#02312b] p-6 border border-teal-500/50 shadow-2xl">
        <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
          <Headphones className="w-64 h-64 text-amber-300" />
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-amber-400/20 border border-amber-400/40 text-amber-300 text-xs font-black uppercase tracking-wider">
              <Headphones className="w-3.5 h-3.5" />
              <span>Pusat Layanan & Masukan Pengoperasian App</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
              <span>Help Desk</span>
              <span className="text-teal-300 text-lg font-bold">PLN ULP</span>
            </h1>
            <p className="text-xs md:text-sm text-teal-100/90 max-w-2xl">
              Sarana komunikasi langsung setiap unit untuk mengirimkan pengajuan fitur baru, saran pengembangan, maupun kendala sistem langsung kepada Owner.
            </p>
          </div>

          {/* Sub-Tab Navigation Switcher */}
          <div className="flex items-center p-1.5 rounded-xl bg-[#011d19]/90 border border-teal-500/40 shrink-0 shadow-inner">
            <button
              onClick={() => setActiveTab('inbox')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black transition-all cursor-pointer ${
                activeTab === 'inbox'
                  ? 'bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 shadow-md shadow-amber-400/30'
                  : 'text-teal-200 hover:text-white hover:bg-teal-800/40'
              }`}
            >
              <Inbox className="w-4 h-4" />
              <span>Inbox ({totalCount})</span>
              {baruCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-red-500 text-white text-[10px] font-black animate-pulse">
                  {baruCount} Baru
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('message')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black transition-all cursor-pointer ${
                activeTab === 'message'
                  ? 'bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 shadow-md shadow-amber-400/30'
                  : 'text-teal-200 hover:text-white hover:bg-teal-800/40'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>Message (Kirim Pesan)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Success Notification Toast */}
      {showSuccessToast && (
        <div className="p-4 rounded-xl bg-emerald-950/90 border border-emerald-400/70 text-emerald-200 flex items-center justify-between shadow-xl animate-fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <p className="text-xs font-black text-white">Pesan Berhasil Terkirim!</p>
              <p className="text-[11px] text-emerald-200/90">
                Pengajuan Anda telah masuk ke Inbox Owner dan akan segera ditindaklanjuti.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowSuccessToast(false)}
            className="text-emerald-300 hover:text-white text-xs font-bold px-2 py-1"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Stats Quick Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="p-3.5 rounded-xl bg-teal-950/60 border border-teal-600/40 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-teal-300 uppercase tracking-wider">Total Pesan</p>
            <p className="text-xl font-black text-white mt-0.5">{totalCount}</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-teal-800/50 flex items-center justify-center text-teal-300 border border-teal-500/40">
            <MessageSquare className="w-5 h-5" />
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/40 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-amber-300 uppercase tracking-wider">Pesan Baru</p>
            <p className="text-xl font-black text-amber-200 mt-0.5">{baruCount}</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-amber-800/50 flex items-center justify-center text-amber-300 border border-amber-500/40">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-blue-950/40 border border-blue-500/40 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-blue-300 uppercase tracking-wider">Sedang Diproses</p>
            <p className="text-xl font-black text-blue-200 mt-0.5">{diprosesCount}</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-blue-800/50 flex items-center justify-center text-blue-300 border border-blue-500/40">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider">Selesai / Setuju</p>
            <p className="text-xl font-black text-emerald-200 mt-0.5">{selesaiCount}</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-emerald-800/50 flex items-center justify-center text-emerald-300 border border-emerald-500/40">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* SUB TAB 1: INBOX */}
      {activeTab === 'inbox' && (
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="p-4 rounded-xl bg-[#022320] border border-teal-600/40 space-y-3 md:space-y-0 md:flex md:items-center md:justify-between gap-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-teal-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cari kata kunci pesan, subjek, unit, atau pengirim..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#011815] border border-teal-600/50 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400 placeholder-teal-400/50"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="text-xs font-bold text-teal-200">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-[#011815] border border-teal-600/50 text-xs text-white px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-amber-400 font-semibold"
                >
                  <option value="SEMUA">Semua Status</option>
                  <option value="BARU">🟡 Baru</option>
                  <option value="DIPROSES">🔵 Diproses</option>
                  <option value="SELESAI">🟢 Selesai / Disetujui</option>
                  <option value="DITOLAK">🔴 Ditolak</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-teal-300 shrink-0" />
                <span className="text-xs font-bold text-teal-200">Kategori:</span>
                <select
                  value={kategoriFilter}
                  onChange={(e) => setKategoriFilter(e.target.value)}
                  className="bg-[#011815] border border-teal-600/50 text-xs text-white px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-amber-400 font-semibold"
                >
                  <option value="SEMUA">Semua Kategori</option>
                  <option value="Pengajuan Fitur Baru">Pengajuan Fitur Baru</option>
                  <option value="Masukan & Saran App">Masukan & Saran App</option>
                  <option value="Laporan Kendala / Bug">Laporan Kendala / Bug</option>
                  <option value="Permintaan Akses Data">Permintaan Akses Data</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>
            </div>
          </div>

          {/* Inbox List Cards */}
          {visibleMessages.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-[#022320]/60 border border-teal-800/60 space-y-3">
              <Inbox className="w-12 h-12 text-teal-500/50 mx-auto" />
              <p className="text-sm font-bold text-teal-200">Tidak ada pesan pengajuan yang ditemukan.</p>
              <p className="text-xs text-teal-300/70 max-w-md mx-auto">
                Silakan beralih ke tab <strong>Message (Kirim Pesan)</strong> untuk membuat pengajuan fitur baru atau mengirim masukan ke Owner.
              </p>
              <button
                onClick={() => setActiveTab('message')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-400 text-slate-950 font-black text-xs hover:bg-amber-300 transition-all cursor-pointer shadow-md"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Buat Pengajuan Pesan</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {visibleMessages.map((msg) => {
                const isBaru = msg.status === 'BARU';
                const isDiproses = msg.status === 'DIPROSES';
                const isSelesai = msg.status === 'SELESAI';
                const isDitolak = msg.status === 'DITOLAK';

                return (
                  <div
                    key={msg.id}
                    className={`p-4 md:p-5 rounded-2xl border transition-all shadow-md relative ${
                      isBaru
                        ? 'bg-gradient-to-r from-[#022e28] via-[#043d37] to-[#022823] border-amber-500/60 shadow-amber-500/10'
                        : isDiproses
                        ? 'bg-[#022623] border-blue-500/50'
                        : isSelesai
                        ? 'bg-[#022320] border-emerald-500/40'
                        : 'bg-[#022320] border-red-500/40'
                    }`}
                  >
                    {/* Header Item */}
                    <div className="flex flex-wrap items-start justify-between gap-2 border-b border-teal-600/30 pb-3">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        {/* Status Badge */}
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-xs ${
                            isBaru
                              ? 'bg-amber-400/20 text-amber-300 border-amber-400/60'
                              : isDiproses
                              ? 'bg-blue-400/20 text-blue-300 border-blue-400/60'
                              : isSelesai
                              ? 'bg-emerald-400/20 text-emerald-300 border-emerald-400/60'
                              : 'bg-red-400/20 text-red-300 border-red-400/60'
                          }`}
                        >
                          {isBaru && <AlertCircle className="w-3 h-3" />}
                          {isDiproses && <Clock className="w-3 h-3" />}
                          {isSelesai && <CheckCircle2 className="w-3 h-3" />}
                          {isDitolak && <XCircle className="w-3 h-3" />}
                          <span>{msg.status}</span>
                        </span>

                        {/* Kategori Tag */}
                        <span className="px-2 py-0.5 rounded-md bg-teal-800/60 border border-teal-500/40 text-teal-200 text-[10px] font-extrabold">
                          {msg.kategori}
                        </span>

                        {/* Unit Info */}
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-teal-900/80 text-amber-300 border border-teal-600/40 text-[10px] font-black">
                          <Building2 className="w-3 h-3" />
                          <span>{msg.unit}</span> ({msg.kodeUnit})
                        </span>
                      </div>

                      {/* Timestamp & Actions */}
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] font-bold text-teal-300/80 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{msg.tanggal}</span>
                        </span>

                        {/* Owner / Sender Delete Action */}
                        {(isOwner || msg.senderUsername === currentUser.username) && onDeleteMessage && (
                          <button
                            onClick={() => {
                              if (confirm('Apakah Anda yakin ingin menghapus pesan ini?')) {
                                onDeleteMessage(msg.id);
                              }
                            }}
                            className="text-red-400/70 hover:text-red-300 p-1 rounded-lg hover:bg-red-950/40 transition-all cursor-pointer"
                            title="Hapus Pesan"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Sender Info & Subjek */}
                    <div className="mt-3 space-y-1.5">
                      <div className="flex items-center gap-2 text-xs text-teal-200/90 font-bold">
                        <User className="w-3.5 h-3.5 text-amber-400" />
                        <span>Pengirim: </span>
                        <span className="text-white font-extrabold">{msg.senderName}</span>
                        <span className="text-[10px] text-teal-300/70">({msg.senderRole || 'Staff'})</span>
                      </div>

                      <h3 className="text-sm font-black text-amber-200">{msg.subjek}</h3>

                      {/* Message Content Body */}
                      <div className="p-3.5 rounded-xl bg-[#011815]/90 border border-teal-700/40 text-xs text-teal-100/90 leading-relaxed whitespace-pre-wrap font-medium">
                        {msg.pesan}
                      </div>
                    </div>

                    {/* Owner Response Section (If exists) */}
                    {msg.ownerReply && (
                      <div className="mt-3 p-3.5 rounded-xl bg-gradient-to-r from-teal-950/80 via-emerald-950/60 to-teal-950/80 border border-emerald-500/50 space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-black text-emerald-300">
                          <span className="flex items-center gap-1.5">
                            <CornerDownRight className="w-3.5 h-3.5" />
                            👑 Tanggapan Owner
                          </span>
                          {msg.ownerReplyDate && (
                            <span className="text-[10px] font-bold text-teal-300/80">{msg.ownerReplyDate}</span>
                          )}
                        </div>
                        <p className="text-xs text-white/90 leading-relaxed pl-5 whitespace-pre-wrap">
                          {msg.ownerReply}
                        </p>
                      </div>
                    )}

                    {/* Owner Response Trigger Button */}
                    {isOwner && (
                      <div className="mt-3.5 flex justify-end">
                        <button
                          onClick={() => {
                            setSelectedMessageForReply(msg);
                            setReplyText(msg.ownerReply || '');
                            setReplyStatus(msg.status === 'BARU' ? 'DIPROSES' : msg.status);
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-amber-400 text-slate-950 font-black text-xs hover:bg-amber-300 transition-all cursor-pointer shadow-md flex items-center gap-1.5"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>{msg.ownerReply ? 'Edit Tanggapan / Status' : 'Tanggapi & Update Status'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SUB TAB 2: MESSAGE (KIRIM PESAN / PENGAJUAN FORM) */}
      {activeTab === 'message' && (
        <div className="max-w-3xl mx-auto">
          <form
            onSubmit={handleSubmitMessage}
            className="p-6 md:p-8 rounded-2xl bg-[#022823] border border-teal-500/50 shadow-2xl space-y-5"
          >
            <div className="border-b border-teal-600/40 pb-4">
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <Send className="w-5 h-5 text-amber-400" />
                <span>Form Pengajuan & Masukan Fitur Baru</span>
              </h2>
              <p className="text-xs text-teal-200/80 mt-0.5">
                Isi form di bawah ini untuk menyampaikan ide pengembangan aplikasi, request fitur tambahan, atau laporan kendala teknis.
              </p>
            </div>

            {/* Row 1: Kode Unit & Unit (Requested Fields) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Input Kode Unit */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-amber-300 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-teal-300" />
                  <span>Kode Unit PLN <span className="text-red-400">*</span></span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 54110"
                  value={kodeUnit}
                  onChange={(e) => setKodeUnit(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#011815] border border-teal-600/60 rounded-xl text-xs text-white font-bold focus:outline-none focus:border-amber-400 placeholder-teal-500/50 shadow-inner"
                />
              </div>

              {/* Input Unit */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-amber-300 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-teal-300" />
                  <span>Unit PLN / Layanan <span className="text-red-400">*</span></span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: ULP Baguala"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#011815] border border-teal-600/60 rounded-xl text-xs text-white font-bold focus:outline-none focus:border-amber-400 placeholder-teal-500/50 shadow-inner"
                />
              </div>
            </div>

            {/* Row 2: Kategori & Subjek */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-teal-200">Kategori Pengajuan</label>
                <select
                  value={kategori}
                  onChange={(e) => setKategori(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#011815] border border-teal-600/60 rounded-xl text-xs text-white font-bold focus:outline-none focus:border-amber-400 cursor-pointer shadow-inner"
                >
                  <option value="Pengajuan Fitur Baru">Pengajuan Fitur Baru</option>
                  <option value="Masukan & Saran App">Masukan & Saran App</option>
                  <option value="Laporan Kendala / Bug">Laporan Kendala / Bug</option>
                  <option value="Permintaan Akses Data">Permintaan Akses Data</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-teal-200">Subjek / Judul Pengajuan</label>
                <input
                  type="text"
                  placeholder="Ringkasan judul (cth: Tambah Fitur Export PDF Matriks)"
                  value={subjek}
                  onChange={(e) => setSubjek(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#011815] border border-teal-600/60 rounded-xl text-xs text-white font-medium focus:outline-none focus:border-amber-400 placeholder-teal-500/50 shadow-inner"
                />
              </div>
            </div>

            {/* Row 3: Input Pesan (Requested Field) */}
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-amber-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-teal-300" />
                  <span>Isi Pesan / Rincian Pengajuan <span className="text-red-400">*</span></span>
                </span>
                <span className="text-[10px] text-teal-300/70 font-normal">Sampaikan detail kebutuhan atau masukan Anda</span>
              </label>
              <textarea
                required
                rows={6}
                placeholder="Tuliskan detail pesan, saran pengembangan, alasan pengajuan fitur, atau masukan spesifik untuk aplikasi Perang Padam ULP..."
                value={pesan}
                onChange={(e) => setPesan(e.target.value)}
                className="w-full p-4 bg-[#011815] border border-teal-600/60 rounded-xl text-xs text-white font-medium focus:outline-none focus:border-amber-400 placeholder-teal-500/50 shadow-inner leading-relaxed resize-y"
              />
            </div>

            {/* Info Pengirim Auto-Detect */}
            <div className="p-3.5 rounded-xl bg-[#011d19] border border-teal-600/30 flex items-center justify-between text-xs text-teal-200/90">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Pengirim Otomatis: <strong className="text-white">{currentUser.name}</strong> ({currentUser.role || 'Staff'})</span>
              </div>
              <span className="text-[10px] text-teal-400 font-bold">Akan terhubung langsung ke Owner</span>
            </div>

            {/* Submit Button */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setSubjek('');
                  setPesan('');
                  setActiveTab('inbox');
                }}
                className="px-5 py-2.5 rounded-xl border border-teal-600/50 text-teal-200 hover:text-white hover:bg-teal-800/40 text-xs font-bold transition-all cursor-pointer"
              >
                Batal
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 text-slate-950 font-black text-xs hover:brightness-110 transition-all cursor-pointer shadow-lg shadow-amber-400/20 flex items-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                    <span>Mengirim...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Kirim Pesan ke Owner</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal Reply for Owner */}
      {selectedMessageForReply && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-[#022823] border border-amber-500/60 rounded-2xl p-6 max-w-xl w-full shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-teal-600/40 pb-3">
              <h3 className="text-sm font-black text-amber-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Tanggapi Pesan Pengajuan (Khusus Owner)</span>
              </h3>
              <button
                onClick={() => setSelectedMessageForReply(null)}
                className="text-teal-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Message Detail Summary */}
            <div className="p-3 rounded-xl bg-[#011815] border border-teal-700/40 space-y-1 text-xs">
              <p className="font-bold text-white">{selectedMessageForReply.subjek}</p>
              <p className="text-teal-300/80">
                Dari: {selectedMessageForReply.senderName} ({selectedMessageForReply.unit} - Kode: {selectedMessageForReply.kodeUnit})
              </p>
              <p className="text-teal-100/90 italic mt-1 font-normal">"{selectedMessageForReply.pesan}"</p>
            </div>

            {/* Select Status */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-teal-200">Update Status Pengajuan</label>
              <select
                value={replyStatus}
                onChange={(e) => setReplyStatus(e.target.value as HelpDeskMessage['status'])}
                className="w-full px-3 py-2 bg-[#011815] border border-teal-600/60 rounded-xl text-xs text-white font-black focus:outline-none focus:border-amber-400 cursor-pointer"
              >
                <option value="DIPROSES">🔵 DIPROSES (Sedang dalam peninjauan / pengerjaan)</option>
                <option value="SELESAI">🟢 SELESAI / DISETUJUI (Telah diimplementasikan / selesai)</option>
                <option value="DITOLAK">🔴 DITOLAK (Pengajuan belum dapat disetujui)</option>
              </select>
            </div>

            {/* Textarea Reply */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-teal-200">Tanggapan / Catatan Owner</label>
              <textarea
                rows={4}
                placeholder="Tulis tanggapan resmi Owner untuk user pengirim..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="w-full p-3 bg-[#011815] border border-teal-600/60 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400 placeholder-teal-500/50"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setSelectedMessageForReply(null)}
                className="px-4 py-2 rounded-xl border border-teal-600/50 text-teal-200 text-xs font-bold hover:bg-teal-800/40 cursor-pointer"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleSaveReply}
                className="px-5 py-2 rounded-xl bg-amber-400 text-slate-950 text-xs font-black hover:bg-amber-300 transition-all cursor-pointer shadow-md flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Simpan Tanggapan</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
