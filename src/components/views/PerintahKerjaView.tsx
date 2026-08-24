import React, { useState, useMemo } from 'react';
import {
  FileText,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Trash2,
  Edit3,
  Printer,
  Users,
  Trees,
  Wrench,
  Layers,
  Calendar,
  Building2,
  ChevronRight,
  Target,
  X,
  Download,
  MessageSquare,
  QrCode,
  Camera
} from 'lucide-react';
import { PerintahKerja, Penyulang, SectionJaringan, User } from '../../types';
import { InputSpkModal } from '../modals/InputSpkModal';
import { generateSpkPDF } from '../../utils/spkPdfGenerator';
import { sendSpkToWhatsApp } from '../../utils/whatsappNotifier';
import { PLN_LOGO_BASE64 } from '../../utils/plnLogo';
import { getUnitDetails } from '../../utils/unitConfig';

interface PerintahKerjaViewProps {
  currentUser?: User | null;
  spkList: PerintahKerja[];
  penyulangList: Penyulang[];
  sectionList: SectionJaringan[];
  onAddSpk: (spk: PerintahKerja) => void;
  onUpdateSpk: (spk: PerintahKerja) => void;
  onDeleteSpk: (id: string) => void;
}

export const PerintahKerjaView: React.FC<PerintahKerjaViewProps> = ({
  currentUser,
  spkList,
  penyulangList,
  sectionList,
  onAddSpk,
  onUpdateSpk,
  onDeleteSpk
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<PerintahKerja | null>(null);
  const [printItem, setPrintItem] = useState<PerintahKerja | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  
  // QR Code & scanning states
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [selectedSpkForQrUpdate, setSelectedSpkForQrUpdate] = useState<PerintahKerja | null>(null);

  // Deep-link check on load / update
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const action = params.get('action');
    const spkId = params.get('spkId');
    if (action === 'update-spk-status' && spkId) {
      const spk = spkList.find(s => s.id === spkId);
      if (spk) {
        setSelectedSpkForQrUpdate(spk);
        // Clear search query parameters to avoid re-triggering on reload
        const newUrl = window.location.pathname + window.location.hash;
        window.history.replaceState({}, document.title, newUrl);
      }
    }
  }, [spkList]);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJenis, setSelectedJenis] = useState<string>('Semua');
  const [selectedStatus, setSelectedStatus] = useState<string>('Semua');

  // Stats calculation
  const totalSpk = spkList.length;
  const countRow = spkList.filter((s) => s.jenisPekerjaan === 'ROW').length;
  const countInspeksi = spkList.filter((s) => s.jenisPekerjaan === 'Inspeksi').length;
  const countPemeliharaan = spkList.filter((s) => s.jenisPekerjaan === 'Pemeliharaan').length;
  const totalPersonil = spkList.reduce((acc, curr) => acc + (curr.jumlahPersonil || 0), 0);
  const countSelesai = spkList.filter((s) => s.status === 'Selesai').length;
  const countProses = spkList.filter((s) => s.status === 'Dalam Proses').length;

  // Filtered List
  const filteredSpkList = useMemo(() => {
    return spkList.filter((spk) => {
      const matchSearch =
        spk.noSpk.toLowerCase().includes(searchQuery.toLowerCase()) ||
        spk.namaPenyulang.toLowerCase().includes(searchQuery.toLowerCase()) ||
        spk.section.toLowerCase().includes(searchQuery.toLowerCase()) ||
        spk.target.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (spk.timAtauPetugas || '').toLowerCase().includes(searchQuery.toLowerCase());

      const matchJenis = selectedJenis === 'Semua' || spk.jenisPekerjaan === selectedJenis;
      const matchStatus = selectedStatus === 'Semua' || spk.status === selectedStatus;

      return matchSearch && matchJenis && matchStatus;
    });
  }, [spkList, searchQuery, selectedJenis, selectedStatus]);

  const handleOpenAddModal = () => {
    setEditItem(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (spk: PerintahKerja) => {
    setEditItem(spk);
    setIsModalOpen(true);
  };

  const handleSaveSpk = (spk: PerintahKerja) => {
    if (editItem) {
      onUpdateSpk(spk);
    } else {
      onAddSpk(spk);
    }
  };

  const handleApproveSpk = (spk: PerintahKerja) => {
    const updated: PerintahKerja = {
      ...spk,
      isApproved: true,
      approvalDate: new Date().toISOString().split('T')[0],
      namaManager: currentUser?.name || spk.namaManager || 'DWI SURYA PERMANA'
    };
    onUpdateSpk(updated);
    setPrintItem(updated);
  };

  const handleStatusChange = (spk: PerintahKerja, newStatus: 'Terencana' | 'Dalam Proses' | 'Selesai' | 'Dibatalkan') => {
    const updated = { ...spk, status: newStatus };
    onUpdateSpk(updated);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Selesai':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Selesai</span>
          </span>
        );
      case 'Dalam Proses':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <Clock className="w-3.5 h-3.5 text-blue-600 animate-spin-slow" />
            <span>Dalam Proses</span>
          </span>
        );
      case 'Terencana':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
            <span>Terencana</span>
          </span>
        );
      case 'Dibatalkan':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>Dibatalkan</span>
          </span>
        );
      default:
        return null;
    }
  };

  const getJenisBadge = (jenis: string) => {
    switch (jenis) {
      case 'ROW':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100/70 text-emerald-800">
            <Trees className="w-3.5 h-3.5 text-emerald-700" />
            <span>ROW</span>
          </span>
        );
      case 'Inspeksi':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-100/70 text-blue-800">
            <Search className="w-3.5 h-3.5 text-blue-700" />
            <span>Inspeksi</span>
          </span>
        );
      case 'Pemeliharaan':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-100/70 text-amber-800">
            <Wrench className="w-3.5 h-3.5 text-amber-700" />
            <span>Pemeliharaan</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 bg-slate-50 text-slate-900 font-sans min-h-screen">
      {/* Header View */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl text-white shadow-md shadow-blue-500/20">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-tight text-slate-900">Perintah Kerja Harian (SPK)</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[11px] font-bold">
                ULP Baguala
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Manajemen penerbitan dan pemantauan Surat Perintah Kerja (SPK) ROW, Inspeksi, dan Pemeliharaan 20kV
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsScannerOpen(true)}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-all border border-slate-200 flex items-center justify-center gap-2 cursor-pointer shrink-0 shadow-sm"
          >
            <QrCode className="w-4.5 h-4.5 text-blue-600" />
            <span>Pindai QR Code SPK</span>
          </button>

          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Input SPK Baru</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total SPK</span>
            <div className="p-2 bg-slate-100 text-slate-700 rounded-xl">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{totalSpk}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            <span className="text-emerald-600 font-bold">{countSelesai} selesai</span> • {countProses} proses
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Pekerjaan ROW</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <Trees className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-700 mt-2">{countRow}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Pangkas & pembersihan</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Inspeksi</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Search className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-blue-700 mt-2">{countInspeksi}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Tier 1 & Tier 2</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Pemeliharaan</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-700 mt-2">{countPemeliharaan}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Perbaikan & Penggantian</p>
        </div>

        <div className="col-span-2 md:col-span-1 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Personil</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-indigo-700 mt-2">{totalPersonil} <span className="text-xs font-bold text-slate-500">Orang</span></p>
          <p className="text-[11px] text-slate-500 mt-0.5">Petugas Yantek & Tim</p>
        </div>
      </div>

      {/* Filter & Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 justify-between items-center">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari No. SPK, Penyulang, Section, Target..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            {['Semua', 'ROW', 'Inspeksi', 'Pemeliharaan'].map((jenis) => (
              <button
                key={jenis}
                onClick={() => setSelectedJenis(jenis)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedJenis === jenis
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {jenis}
              </button>
            ))}
          </div>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="Semua">Semua Status</option>
            <option value="Terencana">Terencana</option>
            <option value="Dalam Proses">Dalam Proses</option>
            <option value="Selesai">Selesai</option>
            <option value="Dibatalkan">Dibatalkan</option>
          </select>
        </div>
      </div>

      {/* Table SPK List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-slate-300 text-[11px] font-bold uppercase tracking-wider">
                <th className="p-4">No. SPK & Tanggal</th>
                <th className="p-4">Jenis</th>
                <th className="p-4">Penyulang & Section</th>
                <th className="p-4">Target Pekerjaan</th>
                <th className="p-4">Personil / Tim</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredSpkList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400 font-medium">
                    <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    Belum ada data Surat Perintah Kerja (SPK) yang sesuai filter.
                  </td>
                </tr>
              ) : (
                filteredSpkList.map((spk) => (
                  <tr key={spk.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* No SPK & Tanggal */}
                    <td className="p-4">
                      <div className="font-mono font-bold text-slate-900">{spk.noSpk}</div>
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{spk.tanggal}</span>
                      </div>
                    </td>

                    {/* Jenis */}
                    <td className="p-4">
                      {getJenisBadge(spk.jenisPekerjaan)}
                    </td>

                    {/* Penyulang & Section */}
                    <td className="p-4">
                      <div className="font-bold text-slate-800">{spk.namaPenyulang}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Layers className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[200px]">{spk.section}</span>
                      </div>
                    </td>

                    {/* Target Pekerjaan */}
                    <td className="p-4">
                      <div className="font-semibold text-slate-800 max-w-[260px] line-clamp-2">
                        {spk.target}
                      </div>
                      {spk.catatan && (
                        <div className="text-[10px] text-slate-500 italic mt-0.5 truncate max-w-[260px]">
                          Ket: {spk.catatan}
                        </div>
                      )}
                    </td>

                    {/* Personil / Tim */}
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 text-slate-900 font-bold">
                        <Users className="w-3.5 h-3.5 text-indigo-600" />
                        <span>{spk.jumlahPersonil} Personil</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 truncate max-w-[150px]">
                        {spk.timAtauPetugas || 'Tim Yantek'}
                      </div>
                    </td>

                    {/* Status Toggle Badge */}
                    <td className="p-4">
                      <div className="relative group inline-block">
                        {getStatusBadge(spk.status)}
                        {/* Quick Status Selector dropdown */}
                        <div className="mt-1 flex gap-1">
                          {(['Terencana', 'Dalam Proses', 'Selesai', 'Dibatalkan'] as const).map((st) => (
                            <button
                              key={st}
                              onClick={() => handleStatusChange(spk, st)}
                              disabled={spk.status === st}
                              title={`Ubah status ke ${st}`}
                              className={`px-1.5 py-0.5 text-[9px] font-bold rounded cursor-pointer transition-all ${
                                spk.status === st
                                  ? 'bg-slate-900 text-white font-black'
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                              }`}
                            >
                              {st === 'Dalam Proses' ? 'Proses' : st}
                            </button>
                          ))}
                        </div>
                      </div>
                    </td>

                    {/* Aksi */}
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* WhatsApp Share Button */}
                        <button
                          onClick={() => sendSpkToWhatsApp(spk)}
                          title="Kirim Notifikasi SPK via WhatsApp"
                          className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors cursor-pointer"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>

                        {/* Approve Button */}
                        {!spk.isApproved && (
                          <button
                            onClick={() => handleApproveSpk(spk)}
                            title="Approve SPK (Manager ULP)"
                            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-sm"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Approve</span>
                          </button>
                        )}

                        {/* Print Button */}
                        <button
                          onClick={() => setPrintItem(spk)}
                          title="Cetak / Lihat SPK Resmi"
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-blue-100 text-slate-600 hover:text-blue-700 transition-colors cursor-pointer"
                        >
                          <Printer className="w-4 h-4" />
                        </button>

                        {/* Edit Button */}
                        <button
                          onClick={() => handleOpenEditModal(spk)}
                          title="Edit SPK"
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-amber-100 text-slate-600 hover:text-amber-700 transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => setDeleteConfirmId(spk.id)}
                          title="Hapus SPK"
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-100 text-slate-600 hover:text-rose-700 transition-colors cursor-pointer"
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

      {/* Input / Edit Modal */}
      <InputSpkModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveSpk}
        penyulangList={penyulangList}
        sectionList={sectionList}
        editItem={editItem}
        spkList={spkList}
        currentUser={currentUser}
      />

      {/* Print / View Official SPK Document Modal */}
      {printItem && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 font-sans">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] overflow-hidden flex flex-col border border-slate-200">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-sm">Pratinjau Surat Perintah Kerja (SPK)</h3>
              </div>
              <div className="flex items-center gap-2">
                {!printItem.isApproved && (
                  <button
                    onClick={() => handleApproveSpk(printItem)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-sm animate-pulse"
                    title="Approve SPK dan Terbitkan Digital Signature"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approve SPK</span>
                  </button>
                )}
                <button
                  onClick={() => sendSpkToWhatsApp(printItem)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                  title="Kirim Notifikasi SPK ke WhatsApp"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Kirim WA</span>
                </button>
                <button
                  onClick={async () => { await generateSpkPDF(printItem, currentUser); }}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh File PDF</span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Dokumen</span>
                </button>
                <button
                  onClick={() => setPrintItem(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Document Body */}
            <div className="p-8 overflow-y-auto bg-white text-slate-900 font-serif leading-relaxed">
              {/* Document Header */}
              <div className="border-2 border-slate-900 p-3 mb-6 flex justify-between items-stretch font-sans">
                <div className="flex items-center gap-3 pr-3 border-r-2 border-slate-900">
                  <img src={PLN_LOGO_BASE64} alt="PLN Logo" className="w-14 h-16 object-contain shrink-0" />
                  <div>
                    <h2 className="text-xs font-black tracking-normal text-slate-900 leading-tight">PT PLN (Persero)</h2>
                    <h3 className="text-[10px] font-bold text-slate-900 leading-tight">{getUnitDetails(printItem.unit || currentUser?.unit || 'ULP Baguala').uiw}</h3>
                    <h4 className="text-[10px] font-bold text-slate-900 leading-tight">{getUnitDetails(printItem.unit || currentUser?.unit || 'ULP Baguala').up3}</h4>
                    <h4 className="text-[10px] font-bold text-slate-900 leading-tight">{getUnitDetails(printItem.unit || currentUser?.unit || 'ULP Baguala').namaUnit.toUpperCase()}</h4>
                  </div>
                </div>
                <div className="text-right flex items-center pl-3">
                  <span className="inline-block px-3 py-1 bg-slate-100 border border-slate-300 rounded font-mono font-bold text-xs text-slate-800">
                    {printItem.noSpk}
                  </span>
                </div>
              </div>

              {/* Document Title */}
              <div className="text-center my-6 font-sans">
                <h1 className="text-lg font-black uppercase text-slate-900 underline underline-offset-4">
                  SURAT PERINTAH KERJA (SPK)
                </h1>
                <p className="text-xs text-slate-600 mt-1">Jenis Pekerjaan: <strong className="uppercase">{printItem.jenisPekerjaan} 20kV</strong></p>
              </div>

              {/* Document Details Grid */}
              <div className="space-y-4 font-sans text-xs mb-8">
                <div className="grid grid-cols-3 border-b border-slate-200 pb-2">
                  <span className="font-bold text-slate-600">Tanggal Pelaksanaan:</span>
                  <span className="col-span-2 font-semibold text-slate-900">{printItem.tanggal}</span>
                </div>

                <div className="grid grid-cols-3 border-b border-slate-200 pb-2">
                  <span className="font-bold text-slate-600">Penyulang Target:</span>
                  <span className="col-span-2 font-bold text-blue-900">{printItem.namaPenyulang}</span>
                </div>

                <div className="grid grid-cols-3 border-b border-slate-200 pb-2">
                  <span className="font-bold text-slate-600">Section / Lokasi:</span>
                  <span className="col-span-2 font-semibold text-slate-900">{printItem.section}</span>
                </div>

                <div className="grid grid-cols-3 border-b border-slate-200 pb-2">
                  <span className="font-bold text-slate-600">Target Pekerjaan:</span>
                  <span className="col-span-2 font-bold text-slate-900 bg-amber-50 p-2 rounded border border-amber-200">{printItem.target}</span>
                </div>

                <div className="grid grid-cols-3 border-b border-slate-200 pb-2">
                  <span className="font-bold text-slate-600">Jumlah Personil:</span>
                  <span className="col-span-2 font-semibold text-slate-900">{printItem.jumlahPersonil} Orang Petugas</span>
                </div>

                <div className="grid grid-cols-3 border-b border-slate-200 pb-2">
                  <span className="font-bold text-slate-600">Tim / Pelaksana:</span>
                  <span className="col-span-2 font-semibold text-slate-900">{printItem.timAtauPetugas || 'Tim Yantek ULP Baguala'}</span>
                </div>

                {printItem.daftarPetugas && (
                  <div className="grid grid-cols-3 border-b border-slate-200 pb-2">
                    <span className="font-bold text-slate-600">Daftar Petugas Pelaksana:</span>
                    <span className="col-span-2 text-slate-800 font-medium whitespace-pre-line bg-slate-50 p-2 rounded border border-slate-200 text-xs">{printItem.daftarPetugas}</span>
                  </div>
                )}

                <div className="grid grid-cols-3 border-b border-slate-200 pb-2">
                  <span className="font-bold text-slate-600">Status Saat Ini:</span>
                  <span className="col-span-2">{getStatusBadge(printItem.status)}</span>
                </div>

                {printItem.catatan && (
                  <div className="grid grid-cols-3 border-b border-slate-200 pb-2">
                    <span className="font-bold text-slate-600">Instruksi K3:</span>
                    <span className="col-span-2 italic text-slate-700">{printItem.catatan}</span>
                  </div>
                )}
              </div>

              {/* Signatures & QR Code */}
              <div className="flex flex-col sm:flex-row justify-between items-end pt-6 border-t border-slate-300 font-sans text-xs mt-8 px-4 gap-6">
                {/* QR Code Section */}
                <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200 shadow-xs max-w-sm">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(
                      window.location.origin + '?action=update-spk-status&spkId=' + printItem.id
                    )}`}
                    alt="QR Code SPK"
                    className="w-20 h-20 bg-white border border-slate-300 p-1 rounded-lg shrink-0"
                  />
                  <div>
                    <span className="text-[10px] font-extrabold text-blue-800 uppercase tracking-wider block">QR Code Unik SPK</span>
                    <p className="text-[10px] text-slate-500 font-bold leading-normal mt-0.5">
                      Pindai QR ini di lapangan untuk memperbarui status pekerjaan secara otomatis ke <strong className="text-blue-700">Dalam Proses</strong> atau <strong className="text-emerald-700">Selesai</strong>.
                    </p>
                  </div>
                </div>

                {/* Manager Signature Block */}
                <div className="flex flex-col justify-between min-h-[110px] items-center w-64 shrink-0">
                  <p className="font-semibold text-slate-600 mb-1">{getUnitDetails(printItem.unit || currentUser?.unit || 'ULP Baguala').managerTitle}</p>

                  {printItem.tandaTanganManager ? (
                    <div className="my-1.5 p-1.5 bg-slate-50/80 border border-emerald-200 rounded-lg flex flex-col items-center justify-center relative w-full">
                      <img
                        src={printItem.tandaTanganManager}
                        alt="Tanda Tangan Manager"
                        className="h-14 max-w-[180px] object-contain"
                      />
                      <div className="absolute top-1 right-1 px-1.5 py-0.2 text-[7px] font-extrabold bg-emerald-600 text-white rounded flex items-center gap-0.5 shadow-2xs">
                        <CheckCircle2 className="w-2 h-2 text-white" />
                        <span>VERIFIED TTD</span>
                      </div>
                    </div>
                  ) : printItem.isApproved ?? true ? (
                    <div className="my-2 p-2.5 bg-emerald-50 border border-emerald-300 rounded-lg flex flex-col items-center justify-center space-y-0.5 shadow-xs w-full">
                      <div className="font-mono text-xs font-black tracking-widest text-emerald-800 select-none">
                        |||| || ||| |||| || |
                      </div>
                      <div className="flex items-center gap-1 text-[9px] font-extrabold text-emerald-700 uppercase">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span>OFFICIAL DIGITAL SIGNATURE</span>
                      </div>
                      <div className="text-[8px] text-emerald-600 font-mono">
                        ID: {printItem.noSpk.replace(/[^a-zA-Z0-9]/g, '')}
                      </div>
                    </div>
                  ) : (
                    <div className="my-2 p-2.5 border-2 border-dashed border-amber-300 bg-amber-50 rounded-lg text-center w-full">
                      <p className="text-[10px] font-bold text-amber-800 uppercase flex items-center justify-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-amber-600" /> MENUNGGU APPROVAL MANAGER
                      </p>
                    </div>
                  )}

                  <div className="mt-1">
                    <p className="font-bold text-slate-900 uppercase underline text-xs text-center">
                      ( {printItem.namaManager || 'DWI SURYA PERMANA'} )
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 font-sans">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center border border-slate-200">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">Konfirmasi Hapus SPK</h3>
            <p className="text-xs text-slate-500 mb-6">
              Apakah Anda yakin ingin menghapus data Surat Perintah Kerja ini?
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  onDeleteSpk(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="px-4 py-2 bg-rose-600 text-white text-xs font-bold rounded-xl hover:bg-rose-700 transition-all shadow-md shadow-rose-500/20 cursor-pointer"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Scanner / Simulator Modal */}
      {isScannerOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 z-50 font-sans">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-4 bg-slate-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-blue-400 animate-pulse" />
                <h3 className="font-bold text-sm">Pindai / Simulasi QR Code SPK</h3>
              </div>
              <button
                onClick={() => setIsScannerOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 flex-1 overflow-y-auto">
              {/* Animated Scan Target Grid */}
              <div className="relative aspect-video bg-slate-950 rounded-2xl border-2 border-slate-800 overflow-hidden flex flex-col items-center justify-center shadow-inner group">
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px]"></div>
                
                {/* Laser scan line anim */}
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-blue-500 to-transparent shadow-[0_0_10px_#3b82f6] animate-[bounce_3s_infinite]" />

                {/* Corner Bracket Reticles */}
                <div className="absolute top-4 left-4 w-5 h-5 border-t-2 border-l-2 border-blue-400 rounded-tl-md"></div>
                <div className="absolute top-4 right-4 w-5 h-5 border-t-2 border-r-2 border-blue-400 rounded-tr-md"></div>
                <div className="absolute bottom-4 left-4 w-5 h-5 border-b-2 border-l-2 border-blue-400 rounded-bl-md"></div>
                <div className="absolute bottom-4 right-4 w-5 h-5 border-b-2 border-r-2 border-blue-400 rounded-br-md"></div>

                <div className="z-10 text-center space-y-2 px-6">
                  <QrCode className="w-12 h-12 text-blue-400 mx-auto animate-pulse" />
                  <p className="text-xs font-black text-slate-300 tracking-wider uppercase">Mencari QR Code SPK...</p>
                  <p className="text-[10px] text-slate-500 font-semibold max-w-xs mx-auto">
                    Arahkan kamera ke lembar cetak SPK ULP Baguala atau gunakan simulator instan di bawah ini.
                  </p>
                </div>
              </div>

              {/* Instant SPK Scan Selector Simulator */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                  <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wide">
                    Simulator Pindai Lapangan (Rekomendasi)
                  </h4>
                </div>
                <p className="text-[11px] text-slate-500 leading-normal font-semibold">
                  Karena keterbatasan izin kamera browser di dalam sandbox, Anda dapat mensimulasikan pemindaian fisik dengan memilih salah satu SPK aktif di bawah ini:
                </p>

                <div className="max-h-52 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl bg-slate-50">
                  {spkList.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400 font-medium">
                      Belum ada data SPK terdaftar.
                    </div>
                  ) : (
                    spkList.map((spk) => (
                      <button
                        key={spk.id}
                        onClick={() => {
                          setSelectedSpkForQrUpdate(spk);
                          setIsScannerOpen(false);
                        }}
                        className="w-full text-left p-3 hover:bg-blue-50/70 active:bg-blue-100/50 transition-colors flex items-center justify-between text-xs cursor-pointer group"
                      >
                        <div>
                          <div className="font-mono font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                            {spk.noSpk}
                          </div>
                          <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                            {spk.namaPenyulang} • {spk.section}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] px-1.5 py-0.5 bg-slate-200 text-slate-700 font-bold rounded-md">
                            {spk.status}
                          </span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Action Dialog Modal (After Scanned) */}
      {selectedSpkForQrUpdate && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 font-sans">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-4 bg-blue-900 text-white flex items-center gap-2.5">
              <QrCode className="w-5 h-5 text-blue-300" />
              <h3 className="font-bold text-sm">QR Code Berhasil Dipindai!</h3>
            </div>

            <div className="p-6 space-y-4 text-slate-900">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                  SURAT PERINTAH KERJA (SPK) DETECTED
                </div>
                <div className="text-sm font-black text-slate-900 font-mono">
                  {selectedSpkForQrUpdate.noSpk}
                </div>
                <div className="grid grid-cols-3 text-xs gap-y-1.5 pt-2 border-t border-slate-200/60 font-semibold text-slate-600">
                  <span>Pekerjaan:</span>
                  <span className="col-span-2 text-slate-900">{selectedSpkForQrUpdate.jenisPekerjaan}</span>
                  <span>Feeder:</span>
                  <span className="col-span-2 text-slate-900">{selectedSpkForQrUpdate.namaPenyulang}</span>
                  <span>Target:</span>
                  <span className="col-span-2 text-slate-900 line-clamp-1">{selectedSpkForQrUpdate.target}</span>
                  <span>Tim:</span>
                  <span className="col-span-2 text-slate-900">{selectedSpkForQrUpdate.timAtauPetugas || 'Yantek Baguala'}</span>
                  <span>Status:</span>
                  <span className="col-span-2">{getStatusBadge(selectedSpkForQrUpdate.status)}</span>
                </div>
              </div>

              <div className="text-xs text-slate-500 font-semibold leading-relaxed text-center">
                Pilih status terbaru pekerjaan untuk memperbarui sistem keandalan secara otomatis:
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => {
                    handleStatusChange(selectedSpkForQrUpdate, 'Dalam Proses');
                    setSelectedSpkForQrUpdate(null);
                  }}
                  className="px-4 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5"
                >
                  <Clock className="w-5 h-5 animate-spin-slow" />
                  <span>Mulai Bekerja</span>
                  <span className="text-[9px] opacity-75 font-medium">(Dalam Proses)</span>
                </button>

                <button
                  onClick={() => {
                    handleStatusChange(selectedSpkForQrUpdate, 'Selesai');
                    setSelectedSpkForQrUpdate(null);
                  }}
                  className="px-4 py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-500/20 transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Selesaikan</span>
                  <span className="text-[9px] opacity-75 font-medium">(Pekerjaan Selesai)</span>
                </button>
              </div>

              <div className="flex justify-center pt-2">
                <button
                  onClick={() => setSelectedSpkForQrUpdate(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
