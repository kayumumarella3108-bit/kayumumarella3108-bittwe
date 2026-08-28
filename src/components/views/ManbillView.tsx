import React, { useState, useMemo } from 'react';
import {
  User,
  InvoiceItem,
  TusbungItem,
  FotoMeterItem
} from '../../types';
import {
  Receipt,
  ZapOff,
  Camera,
  Search,
  Plus,
  Filter,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Trash2,
  Edit,
  Eye,
  Building2,
  Calendar,
  X,
  FileText,
  UserCheck
} from 'lucide-react';
import { canEditData } from '../../utils/permissions';
import { DAFTAR_UNIT_PLN } from '../../utils/unitConfig';

interface ManbillViewProps {
  currentUser: User | null;
  activeSubTab?: 'invoice' | 'tusbung' | 'foto_meter';
  invoiceList: InvoiceItem[];
  tusbungList: TusbungItem[];
  fotoMeterList: FotoMeterItem[];
  onAddInvoice?: (item: Omit<InvoiceItem, 'id'>) => void;
  onUpdateInvoice?: (id: string, item: Partial<InvoiceItem>) => void;
  onDeleteInvoice?: (id: string) => void;
  onAddTusbung?: (item: Omit<TusbungItem, 'id'>) => void;
  onUpdateTusbung?: (id: string, item: Partial<TusbungItem>) => void;
  onDeleteTusbung?: (id: string) => void;
  onAddFotoMeter?: (item: Omit<FotoMeterItem, 'id'>) => void;
  onUpdateFotoMeter?: (id: string, item: Partial<FotoMeterItem>) => void;
  onDeleteFotoMeter?: (id: string) => void;
  isLoading?: boolean;
}

export const ManbillView: React.FC<ManbillViewProps> = ({
  currentUser,
  activeSubTab: initialTab = 'invoice',
  invoiceList = [],
  tusbungList = [],
  fotoMeterList = [],
  onAddInvoice,
  onUpdateInvoice,
  onDeleteInvoice,
  onAddTusbung,
  onUpdateTusbung,
  onDeleteTusbung,
  onAddFotoMeter,
  onUpdateFotoMeter,
  onDeleteFotoMeter,
  isLoading = false
}) => {
  const [activeTab, setActiveTab] = useState<'invoice' | 'tusbung' | 'foto_meter'>(initialTab);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterUnit, setFilterUnit] = useState('Semua');
  const [filterStatus, setFilterStatus] = useState('Semua');

  // Modal States
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isTusbungModalOpen, setIsTusbungModalOpen] = useState(false);
  const [isFotoMeterModalOpen, setIsFotoMeterModalOpen] = useState(false);

  // Form States
  const [editingInvoice, setEditingInvoice] = useState<InvoiceItem | null>(null);
  const [invoiceForm, setInvoiceForm] = useState({
    noInvoice: '',
    idpel: '',
    namaPelanggan: '',
    tarifDaya: 'R1M / 900 VA',
    periodeBulan: 'Agustus 2026',
    jumlahTagihan: 0,
    statusPembayaran: 'Terbit' as 'Lunas' | 'Belum Lunas' | 'Terbit',
    tanggalTerbit: new Date().toISOString().split('T')[0],
    petugasDistribusi: currentUser?.name || 'Petugas Billing',
    unit: currentUser?.unit || 'ULP Passo',
    keterangan: ''
  });

  const [editingTusbung, setEditingTusbung] = useState<TusbungItem | null>(null);
  const [tusbungForm, setTusbungForm] = useState({
    noWOTusbung: '',
    idpel: '',
    namaPelanggan: '',
    alamat: '',
    tarifDaya: 'R1 / 1.300 VA',
    jumlahTunggakan: 0,
    lembarTunggakan: 1,
    statusTusbung: 'Belum Dieksekusi' as 'Belum Dieksekusi' | 'Diputus Temporary' | 'Diputus Permanen' | 'Disambung Kembali' | 'Lunas Lapangan',
    tanggalTindakan: new Date().toISOString().split('T')[0],
    petugasEksekutor: currentUser?.name || 'Tim Tusbung Yantek',
    unit: currentUser?.unit || 'ULP Passo',
    catatan: ''
  });

  const [editingFotoMeter, setEditingFotoMeter] = useState<FotoMeterItem | null>(null);
  const [fotoMeterForm, setFotoMeterForm] = useState({
    idpel: '',
    namaPelanggan: '',
    nomorMeter: '',
    tarifDaya: 'R1 / 1.300 VA',
    standMeter: 0,
    bulanTahun: 'Agustus 2026',
    tanggalFoto: new Date().toISOString().split('T')[0],
    petugasPetam: currentUser?.name || 'Petugas Cater',
    unit: currentUser?.unit || 'ULP Passo',
    fotoMeterUrl: '',
    statusVerifikasi: 'Valid' as 'Valid' | 'Unusual' | 'Koreksi Needed',
    catatan: ''
  });

  // Filtered Lists
  const filteredInvoices = useMemo(() => {
    return invoiceList.filter((item) => {
      const matchesSearch =
        item.namaPelanggan.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.idpel.includes(searchTerm) ||
        item.noInvoice.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesUnit = filterUnit === 'Semua' || item.unit === filterUnit;
      const matchesStatus = filterStatus === 'Semua' || item.statusPembayaran === filterStatus;
      return matchesSearch && matchesUnit && matchesStatus;
    });
  }, [invoiceList, searchTerm, filterUnit, filterStatus]);

  const filteredTusbung = useMemo(() => {
    return tusbungList.filter((item) => {
      const matchesSearch =
        item.namaPelanggan.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.idpel.includes(searchTerm) ||
        item.noWOTusbung.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesUnit = filterUnit === 'Semua' || item.unit === filterUnit;
      const matchesStatus = filterStatus === 'Semua' || item.statusTusbung === filterStatus;
      return matchesSearch && matchesUnit && matchesStatus;
    });
  }, [tusbungList, searchTerm, filterUnit, filterStatus]);

  const filteredFotoMeter = useMemo(() => {
    return fotoMeterList.filter((item) => {
      const matchesSearch =
        item.namaPelanggan.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.idpel.includes(searchTerm) ||
        item.nomorMeter.includes(searchTerm);
      const matchesUnit = filterUnit === 'Semua' || item.unit === filterUnit;
      const matchesStatus = filterStatus === 'Semua' || item.statusVerifikasi === filterStatus;
      return matchesSearch && matchesUnit && matchesStatus;
    });
  }, [fotoMeterList, searchTerm, filterUnit, filterStatus]);

  // Handlers for Invoice
  const handleSaveInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingInvoice) {
      if (onUpdateInvoice) onUpdateInvoice(editingInvoice.id, invoiceForm);
    } else {
      if (onAddInvoice) onAddInvoice(invoiceForm);
    }
    setIsInvoiceModalOpen(false);
    setEditingInvoice(null);
  };

  // Handlers for Tusbung
  const handleSaveTusbung = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTusbung) {
      if (onUpdateTusbung) onUpdateTusbung(editingTusbung.id, tusbungForm);
    } else {
      if (onAddTusbung) onAddTusbung(tusbungForm);
    }
    setIsTusbungModalOpen(false);
    setEditingTusbung(null);
  };

  // Handlers for Foto Meter
  const handleSaveFotoMeter = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingFotoMeter) {
      if (onUpdateFotoMeter) onUpdateFotoMeter(editingFotoMeter.id, fotoMeterForm);
    } else {
      if (onAddFotoMeter) onAddFotoMeter(fotoMeterForm);
    }
    setIsFotoMeterModalOpen(false);
    setEditingFotoMeter(null);
  };

  return (
    <div className="p-4 md:p-6 space-y-6 bg-slate-50 text-slate-900 font-sans min-h-screen">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 bg-gradient-to-r from-[#022623] via-[#044c45] to-[#022e2a] p-6 rounded-2xl border-2 border-teal-500/60 shadow-xl relative overflow-hidden text-white">
        <div className="absolute right-0 top-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        
        {/* Title Section */}
        <div className="flex items-center gap-4 z-10">
          <div className="p-3 bg-teal-950/80 rounded-2xl text-amber-300 border border-teal-500/40 shadow-inner shrink-0">
            <Receipt className="w-6 h-6 text-amber-300" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-white drop-shadow-xs">Manajemen Billing (Manbill)</h1>
            <p className="text-xs text-teal-100/90 mt-0.5">
              Monitoring distribusi invoice penagihan, realisasi pemutusan &amp; penyambungan (Tusbung), serta verifikasi foto stand meter
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="pt-4 border-t border-teal-500/30 flex flex-wrap items-center justify-between gap-3 z-10">
          <div className="flex items-center gap-2 p-1 bg-[#012521] rounded-xl border border-teal-700/60 shadow-inner">
            <button
              onClick={() => setActiveTab('invoice')}
              className={`px-4 py-2 rounded-lg text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'invoice'
                  ? 'bg-gradient-to-r from-teal-400 to-emerald-400 text-slate-950 shadow-md scale-105'
                  : 'text-teal-200 hover:text-white hover:bg-teal-800/40'
              }`}
            >
              <Receipt className="w-4 h-4" />
              <span>Pembagian Invoice</span>
              <span className="ml-1 px-1.5 py-0.2 bg-teal-950/80 text-teal-300 rounded-full text-[10px]">
                {invoiceList.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('tusbung')}
              className={`px-4 py-2 rounded-lg text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'tusbung'
                  ? 'bg-gradient-to-r from-teal-400 to-emerald-400 text-slate-950 shadow-md scale-105'
                  : 'text-teal-200 hover:text-white hover:bg-teal-800/40'
              }`}
            >
              <ZapOff className="w-4 h-4" />
              <span>Realisasi Tusbung</span>
              <span className="ml-1 px-1.5 py-0.2 bg-teal-950/80 text-teal-300 rounded-full text-[10px]">
                {tusbungList.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('foto_meter')}
              className={`px-4 py-2 rounded-lg text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'foto_meter'
                  ? 'bg-gradient-to-r from-teal-400 to-emerald-400 text-slate-950 shadow-md scale-105'
                  : 'text-teal-200 hover:text-white hover:bg-teal-800/40'
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>Foto Meter</span>
              <span className="ml-1 px-1.5 py-0.2 bg-teal-950/80 text-teal-300 rounded-full text-[10px]">
                {fotoMeterList.length}
              </span>
            </button>
          </div>

          {/* Action Button */}
          {canEditData(currentUser) && (
            <button
              onClick={() => {
                if (activeTab === 'invoice') {
                  setEditingInvoice(null);
                  setInvoiceForm({
                    noInvoice: `INV/${new Date().getFullYear()}/${(new Date().getMonth() + 1).toString().padStart(2, '0')}/${Math.floor(1000 + Math.random() * 9000)}`,
                    idpel: '',
                    namaPelanggan: '',
                    tarifDaya: 'R1M / 900 VA',
                    periodeBulan: 'Agustus 2026',
                    jumlahTagihan: 0,
                    statusPembayaran: 'Terbit',
                    tanggalTerbit: new Date().toISOString().split('T')[0],
                    petugasDistribusi: currentUser?.name || 'Petugas Billing',
                    unit: currentUser?.unit || 'ULP Passo',
                    keterangan: ''
                  });
                  setIsInvoiceModalOpen(true);
                } else if (activeTab === 'tusbung') {
                  setEditingTusbung(null);
                  setTusbungForm({
                    noWOTusbung: `WO/TB/${new Date().getFullYear()}/${(new Date().getMonth() + 1).toString().padStart(2, '0')}/${Math.floor(100 + Math.random() * 900)}`,
                    idpel: '',
                    namaPelanggan: '',
                    alamat: '',
                    tarifDaya: 'R1 / 1.300 VA',
                    jumlahTunggakan: 0,
                    lembarTunggakan: 1,
                    statusTusbung: 'Belum Dieksekusi',
                    tanggalTindakan: new Date().toISOString().split('T')[0],
                    petugasEksekutor: currentUser?.name || 'Tim Tusbung Yantek',
                    unit: currentUser?.unit || 'ULP Passo',
                    catatan: ''
                  });
                  setIsTusbungModalOpen(true);
                } else {
                  setEditingFotoMeter(null);
                  setFotoMeterForm({
                    idpel: '',
                    namaPelanggan: '',
                    nomorMeter: '',
                    tarifDaya: 'R1 / 1.300 VA',
                    standMeter: 0,
                    bulanTahun: 'Agustus 2026',
                    tanggalFoto: new Date().toISOString().split('T')[0],
                    petugasPetam: currentUser?.name || 'Petugas Cater',
                    unit: currentUser?.unit || 'ULP Passo',
                    fotoMeterUrl: '',
                    statusVerifikasi: 'Valid',
                    catatan: ''
                  });
                  setIsFotoMeterModalOpen(true);
                }
              }}
              className="px-4 py-2.5 bg-gradient-to-r from-teal-400 via-emerald-400 to-teal-300 hover:from-teal-300 hover:to-emerald-300 text-slate-950 font-black text-xs rounded-xl transition-all shadow-md shadow-teal-950/40 flex items-center gap-2 cursor-pointer shrink-0 border border-teal-200/80 active:scale-95"
            >
              <Plus className="w-4 h-4 text-slate-950 stroke-[3]" />
              <span>
                {activeTab === 'invoice' && '+ Input Invoice Baru'}
                {activeTab === 'tusbung' && '+ Input Realisasi Tusbung'}
                {activeTab === 'foto_meter' && '+ Entri Foto Meter'}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Toolbar Search & Filter */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari IDPEL, Nama, atau No Referensi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={filterUnit}
              onChange={(e) => setFilterUnit(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="Semua">Semua Unit ULP</option>
              {DAFTAR_UNIT_PLN.map((u, i) => (
                <option key={`unit_mb_${i}`} value={u.namaUnit}>
                  {u.namaUnit}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* CONTENT TAB 1: PEMBAGIAN INVOICE */}
      {activeTab === 'invoice' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-500 uppercase">LUNAS</div>
                <div className="text-xl font-black text-slate-800">
                  {invoiceList.filter((i) => i.statusPembayaran === 'Lunas').length} Invoice
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-500 uppercase">BELUM LUNAS</div>
                <div className="text-xl font-black text-slate-800">
                  {invoiceList.filter((i) => i.statusPembayaran === 'Belum Lunas').length} Invoice
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
              <div className="p-3 bg-teal-50 text-teal-600 rounded-xl">
                <Receipt className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-500 uppercase">TOTAL TERBIT</div>
                <div className="text-xl font-black text-slate-800">
                  {invoiceList.length} Invoice
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/80 text-slate-700 font-extrabold border-b border-slate-200">
                    <th className="p-3">NO. INVOICE</th>
                    <th className="p-3">IDPEL &amp; PELANGGAN</th>
                    <th className="p-3">TARIF / DAYA</th>
                    <th className="p-3">PERIODE</th>
                    <th className="p-3 text-right">JUMLAH TAGIHAN</th>
                    <th className="p-3">STATUS</th>
                    <th className="p-3">PETUGAS &amp; UNIT</th>
                    {canEditData(currentUser) && <th className="p-3 text-center">AKSI</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400 font-bold">
                        Belum ada data invoice penagihan.
                      </td>
                    </tr>
                  ) : (
                    filteredInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3 font-bold text-teal-700">{inv.noInvoice}</td>
                        <td className="p-3">
                          <div className="font-extrabold text-slate-900">{inv.namaPelanggan}</div>
                          <div className="text-[11px] font-mono text-slate-500">ID: {inv.idpel}</div>
                        </td>
                        <td className="p-3 font-semibold text-slate-600">{inv.tarifDaya}</td>
                        <td className="p-3 font-semibold text-slate-600">{inv.periodeBulan}</td>
                        <td className="p-3 text-right font-black text-slate-900">
                          Rp {inv.jumlahTagihan.toLocaleString('id-ID')}
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-black inline-flex items-center gap-1 ${
                              inv.statusPembayaran === 'Lunas'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : inv.statusPembayaran === 'Belum Lunas'
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : 'bg-sky-100 text-sky-800 border border-sky-300'
                            }`}
                          >
                            {inv.statusPembayaran}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="font-semibold text-slate-800">{inv.petugasDistribusi}</div>
                          <div className="text-[11px] text-teal-600 font-bold">{inv.unit}</div>
                        </td>
                        {canEditData(currentUser) && (
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => {
                                  setEditingInvoice(inv);
                                  setInvoiceForm({ ...inv });
                                  setIsInvoiceModalOpen(true);
                                }}
                                className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              {onDeleteInvoice && (
                                <button
                                  onClick={() => {
                                    if (confirm(`Hapus data invoice ${inv.noInvoice}?`)) {
                                      onDeleteInvoice(inv.id);
                                    }
                                  }}
                                  className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* CONTENT TAB 2: REALISASI TUSBUNG */}
      {activeTab === 'tusbung' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="text-xs font-bold text-slate-500 uppercase">BELUM DIEKSEKUSI</div>
              <div className="text-xl font-black text-amber-600 mt-1">
                {tusbungList.filter((t) => t.statusTusbung === 'Belum Dieksekusi').length} WO
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="text-xs font-bold text-slate-500 uppercase">DIPUTUS TEMPORARY</div>
              <div className="text-xl font-black text-rose-600 mt-1">
                {tusbungList.filter((t) => t.statusTusbung === 'Diputus Temporary').length} WO
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="text-xs font-bold text-slate-500 uppercase">DISAMBUNG KEMBALI</div>
              <div className="text-xl font-black text-teal-600 mt-1">
                {tusbungList.filter((t) => t.statusTusbung === 'Disambung Kembali').length} WO
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="text-xs font-bold text-slate-500 uppercase">LUNAS LAPANGAN</div>
              <div className="text-xl font-black text-emerald-600 mt-1">
                {tusbungList.filter((t) => t.statusTusbung === 'Lunas Lapangan').length} WO
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/80 text-slate-700 font-extrabold border-b border-slate-200">
                    <th className="p-3">NO. WO TUSBUNG</th>
                    <th className="p-3">IDPEL &amp; PELANGGAN</th>
                    <th className="p-3">ALAMAT</th>
                    <th className="p-3 text-right">TUNGGAKAN</th>
                    <th className="p-3">STATUS EKSEKUSI</th>
                    <th className="p-3">PETUGAS &amp; UNIT</th>
                    {canEditData(currentUser) && <th className="p-3 text-center">AKSI</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredTusbung.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400 font-bold">
                        Belum ada data realisasi pemutusan &amp; penyambungan (Tusbung).
                      </td>
                    </tr>
                  ) : (
                    filteredTusbung.map((tsb) => (
                      <tr key={tsb.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3 font-bold text-rose-700">{tsb.noWOTusbung}</td>
                        <td className="p-3">
                          <div className="font-extrabold text-slate-900">{tsb.namaPelanggan}</div>
                          <div className="text-[11px] font-mono text-slate-500">ID: {tsb.idpel}</div>
                        </td>
                        <td className="p-3 text-slate-600 font-medium">{tsb.alamat}</td>
                        <td className="p-3 text-right font-black text-rose-900">
                          Rp {tsb.jumlahTunggakan.toLocaleString('id-ID')}
                          <div className="text-[10px] text-slate-500 font-semibold">{tsb.lembarTunggakan} Lbr Tagihan</div>
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-black inline-flex items-center gap-1 ${
                              tsb.statusTusbung === 'Lunas Lapangan' || tsb.statusTusbung === 'Disambung Kembali'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : tsb.statusTusbung === 'Diputus Temporary' || tsb.statusTusbung === 'Diputus Permanen'
                                ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                : 'bg-amber-100 text-amber-800 border border-amber-300'
                            }`}
                          >
                            {tsb.statusTusbung}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="font-semibold text-slate-800">{tsb.petugasEksekutor}</div>
                          <div className="text-[11px] text-teal-600 font-bold">{tsb.unit}</div>
                        </td>
                        {canEditData(currentUser) && (
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => {
                                  setEditingTusbung(tsb);
                                  setTusbungForm({ ...tsb });
                                  setIsTusbungModalOpen(true);
                                }}
                                className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              {onDeleteTusbung && (
                                <button
                                  onClick={() => {
                                    if (confirm(`Hapus data WO Tusbung ${tsb.noWOTusbung}?`)) {
                                      onDeleteTusbung(tsb.id);
                                    }
                                  }}
                                  className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* CONTENT TAB 3: FOTO METER */}
      {activeTab === 'foto_meter' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {filteredFotoMeter.length === 0 ? (
              <div className="col-span-full p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 font-bold">
                Belum ada dokumentasi foto meter terverifikasi.
              </div>
            ) : (
              filteredFotoMeter.map((ftm) => (
                <div
                  key={ftm.id}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="relative h-44 bg-slate-100 overflow-hidden group">
                      {ftm.fotoMeterUrl ? (
                        <img
                          src={ftm.fotoMeterUrl}
                          alt={`Meter ${ftm.idpel}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                          <Camera className="w-8 h-8 opacity-40" />
                          <span className="text-[11px]">Tidak Ada Foto</span>
                        </div>
                      )}
                      <div className="absolute top-2 right-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black shadow-sm ${
                            ftm.statusVerifikasi === 'Valid'
                              ? 'bg-emerald-500 text-white'
                              : ftm.statusVerifikasi === 'Unusual'
                              ? 'bg-amber-500 text-white'
                              : 'bg-rose-500 text-white'
                          }`}
                        >
                          {ftm.statusVerifikasi}
                        </span>
                      </div>
                    </div>

                    <div className="p-3.5 space-y-1.5">
                      <div className="font-extrabold text-slate-900 text-xs truncate">{ftm.namaPelanggan}</div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-mono text-slate-500">ID: {ftm.idpel}</span>
                        <span className="font-bold text-teal-700">Meter: {ftm.nomorMeter}</span>
                      </div>
                      <div className="p-2 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-500">Stand Meter:</span>
                        <span className="text-sm font-black text-slate-900 font-mono">{ftm.standMeter} kWh</span>
                      </div>
                      {ftm.catatan && (
                        <div className="text-[11px] text-slate-600 italic line-clamp-2 pt-1 border-t border-slate-100">
                          "{ftm.catatan}"
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span>{ftm.petugasPetam}</span>
                    {canEditData(currentUser) && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingFotoMeter(ftm);
                            setFotoMeterForm({ ...ftm });
                            setIsFotoMeterModalOpen(true);
                          }}
                          className="p-1 text-amber-600 hover:bg-amber-100 rounded cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        {onDeleteFotoMeter && (
                          <button
                            onClick={() => {
                              if (confirm(`Hapus entri foto meter IDPEL ${ftm.idpel}?`)) {
                                onDeleteFotoMeter(ftm.id);
                              }
                            }}
                            className="p-1 text-rose-600 hover:bg-rose-100 rounded cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* MODAL ENTRI INVOICE */}
      {isInvoiceModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-slate-900 text-base">
                {editingInvoice ? 'Edit Data Invoice Penagihan' : 'Tambah Invoice Penagihan Baru'}
              </h3>
              <button
                onClick={() => setIsInvoiceModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveInvoice} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">NO. INVOICE</label>
                  <input
                    type="text"
                    required
                    value={invoiceForm.noInvoice}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, noInvoice: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-teal-700"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">IDPEL</label>
                  <input
                    type="text"
                    required
                    value={invoiceForm.idpel}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, idpel: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                    placeholder="Contoh: 541100982312"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">NAMA PELANGGAN</label>
                <input
                  type="text"
                  required
                  value={invoiceForm.namaPelanggan}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, namaPelanggan: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                  placeholder="Nama Lengkap / Perusahaan"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">TARIF / DAYA</label>
                  <input
                    type="text"
                    value={invoiceForm.tarifDaya}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, tarifDaya: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">PERIODE BULAN</label>
                  <input
                    type="text"
                    value={invoiceForm.periodeBulan}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, periodeBulan: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">JUMLAH TAGIHAN (RP)</label>
                  <input
                    type="number"
                    required
                    value={invoiceForm.jumlahTagihan}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, jumlahTagihan: Number(e.target.value) })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">STATUS PEMBAYARAN</label>
                  <select
                    value={invoiceForm.statusPembayaran}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, statusPembayaran: e.target.value as any })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                  >
                    <option value="Terbit">Terbit</option>
                    <option value="Belum Lunas">Belum Lunas</option>
                    <option value="Lunas">Lunas</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">PETUGAS DISTRIBUSI</label>
                  <input
                    type="text"
                    value={invoiceForm.petugasDistribusi}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, petugasDistribusi: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">UNIT ULP</label>
                  <select
                    value={invoiceForm.unit}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, unit: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                  >
                    {DAFTAR_UNIT_PLN.map((u, i) => (
                      <option key={`inv_u_${i}`} value={u.namaUnit}>
                        {u.namaUnit}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">UNIT ULP</label>
                <select
                  value={invoiceForm.unit}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, unit: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                >
                  {DAFTAR_UNIT_PLN.map((u, i) => (
                    <option key={`inv_u_${i}`} value={u.namaUnit}>
                      {u.namaUnit}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">KETERANGAN / CATATAN</label>
                <textarea
                  rows={2}
                  value={invoiceForm.keterangan}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, keterangan: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  placeholder="Catatan pengiriman invoice..."
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsInvoiceModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl"
                >
                  Simpan Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ENTRI TUSBUNG */}
      {isTusbungModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-slate-900 text-base">
                {editingTusbung ? 'Edit Realisasi Tusbung' : 'Tambah Realisasi Tusbung Baru'}
              </h3>
              <button
                onClick={() => setIsTusbungModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTusbung} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">NO. WO TUSBUNG</label>
                  <input
                    type="text"
                    required
                    value={tusbungForm.noWOTusbung}
                    onChange={(e) => setTusbungForm({ ...tusbungForm, noWOTusbung: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-rose-700"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">IDPEL</label>
                  <input
                    type="text"
                    required
                    value={tusbungForm.idpel}
                    onChange={(e) => setTusbungForm({ ...tusbungForm, idpel: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">NAMA PELANGGAN</label>
                <input
                  type="text"
                  required
                  value={tusbungForm.namaPelanggan}
                  onChange={(e) => setTusbungForm({ ...tusbungForm, namaPelanggan: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">ALAMAT LOKASI</label>
                <input
                  type="text"
                  value={tusbungForm.alamat}
                  onChange={(e) => setTusbungForm({ ...tusbungForm, alamat: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">JUMLAH TUNGGAKAN (RP)</label>
                  <input
                    type="number"
                    value={tusbungForm.jumlahTunggakan}
                    onChange={(e) => setTusbungForm({ ...tusbungForm, jumlahTunggakan: Number(e.target.value) })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">STATUS TUSBUNG</label>
                  <select
                    value={tusbungForm.statusTusbung}
                    onChange={(e) => setTusbungForm({ ...tusbungForm, statusTusbung: e.target.value as any })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                  >
                    <option value="Belum Dieksekusi">Belum Dieksekusi</option>
                    <option value="Diputus Temporary">Diputus Temporary</option>
                    <option value="Diputus Permanen">Diputus Permanen</option>
                    <option value="Disambung Kembali">Disambung Kembali</option>
                    <option value="Lunas Lapangan">Lunas Lapangan</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">PETUGAS EKSEKUTOR</label>
                  <input
                    type="text"
                    value={tusbungForm.petugasEksekutor}
                    onChange={(e) => setTusbungForm({ ...tusbungForm, petugasEksekutor: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">UNIT ULP</label>
                  <select
                    value={tusbungForm.unit}
                    onChange={(e) => setTusbungForm({ ...tusbungForm, unit: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                  >
                    {DAFTAR_UNIT_PLN.map((u, i) => (
                      <option key={`tsb_u_${i}`} value={u.namaUnit}>
                        {u.namaUnit}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsTusbungModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl"
                >
                  Simpan Realisasi Tusbung
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ENTRI FOTO METER */}
      {isFotoMeterModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-slate-900 text-base">
                {editingFotoMeter ? 'Edit Data Foto Meter' : 'Tambah Entri Foto Meter'}
              </h3>
              <button
                onClick={() => setIsFotoMeterModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFotoMeter} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">IDPEL</label>
                  <input
                    type="text"
                    required
                    value={fotoMeterForm.idpel}
                    onChange={(e) => setFotoMeterForm({ ...fotoMeterForm, idpel: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">NOMOR METER</label>
                  <input
                    type="text"
                    required
                    value={fotoMeterForm.nomorMeter}
                    onChange={(e) => setFotoMeterForm({ ...fotoMeterForm, nomorMeter: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-teal-700"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">NAMA PELANGGAN</label>
                <input
                  type="text"
                  required
                  value={fotoMeterForm.namaPelanggan}
                  onChange={(e) => setFotoMeterForm({ ...fotoMeterForm, namaPelanggan: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">STAND METER (KWH)</label>
                  <input
                    type="number"
                    required
                    value={fotoMeterForm.standMeter}
                    onChange={(e) => setFotoMeterForm({ ...fotoMeterForm, standMeter: Number(e.target.value) })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">STATUS VERIFIKASI</label>
                  <select
                    value={fotoMeterForm.statusVerifikasi}
                    onChange={(e) => setFotoMeterForm({ ...fotoMeterForm, statusVerifikasi: e.target.value as any })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                  >
                    <option value="Valid">Valid</option>
                    <option value="Unusual">Unusual (Perlu Cek)</option>
                    <option value="Koreksi Needed">Koreksi Needed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">URL FOTO METER</label>
                <input
                  type="text"
                  value={fotoMeterForm.fotoMeterUrl}
                  onChange={(e) => setFotoMeterForm({ ...fotoMeterForm, fotoMeterUrl: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">UNIT ULP</label>
                <select
                  value={fotoMeterForm.unit}
                  onChange={(e) => setFotoMeterForm({ ...fotoMeterForm, unit: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                >
                  {DAFTAR_UNIT_PLN.map((u, i) => (
                    <option key={`ftm_u_${i}`} value={u.namaUnit}>
                      {u.namaUnit}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFotoMeterModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl"
                >
                  Simpan Foto Meter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
