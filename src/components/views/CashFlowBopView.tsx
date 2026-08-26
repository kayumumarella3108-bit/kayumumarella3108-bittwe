import React, { useState, useMemo } from 'react';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Search,
  Filter,
  Trash2,
  Pencil,
  FileText,
  Printer,
  CheckCircle2,
  Clock,
  XCircle,
  Building2,
  Calendar,
  Layers,
  Download,
  Receipt,
  AlertCircle,
  PieChart,
  DollarSign,
  TrendingUp,
  X
} from 'lucide-react';
import { CashFlowBopItem, KategoriBiayaBop, User } from '../../types';
import { canEditData } from '../../utils/permissions';
import { isDataAccessibleByUser, DAFTAR_UNIT_PLN } from '../../utils/unitConfig';

interface CashFlowBopViewProps {
  currentUser?: User;
  cashFlowList: CashFlowBopItem[];
  onAddTransaction: (item: CashFlowBopItem) => void;
  onUpdateTransaction: (item: CashFlowBopItem) => void;
  onDeleteTransaction: (id: string) => void;
  isLoading?: boolean;
}

export const KATEGORI_BIAYA_BOP_OPTIONS: KategoriBiayaBop[] = [
  'Dropping Dana BOP',
  'BBM & Pelumas Operasional',
  'ATK & Cetak Dokumen',
  'Konsumsi & Snack Piket/Kegiatan',
  'Pemeliharaan Kendaraan & Alat Kerja',
  'Pemeliharaan Gedung & Fasilitas ULP',
  'Perlengkapan K3 & Kebersihan',
  'Biaya Utility & Jasa Pelanggan',
  'Honor / Lembur / Transport Petugas',
  'Lain-lain'
];

export const CashFlowBopView: React.FC<CashFlowBopViewProps> = ({
  currentUser,
  cashFlowList,
  onAddTransaction,
  onUpdateTransaction,
  onDeleteTransaction,
  isLoading = false
}) => {
  const canEdit = currentUser ? canEditData(currentUser) : true;

  const [activeTab, setActiveTab] = useState<'jurnal' | 'rekap_kategori' | 'pagu_unit'>('jurnal');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTipe, setFilterTipe] = useState<'ALL' | 'PEMASUKAN' | 'PENGELUARAN'>('ALL');
  const [filterKategori, setFilterKategori] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterUnit, setFilterUnit] = useState<string>('ALL');

  // Modals state
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<CashFlowBopItem | null>(null);
  const [detailItem, setDetailItem] = useState<CashFlowBopItem | null>(null);

  // Form states
  const [formData, setFormData] = useState<Partial<CashFlowBopItem>>({
    tanggal: new Date().toISOString().split('T')[0],
    noVoucher: '',
    tipe: 'PENGELUARAN',
    kategori: 'BBM & Pelumas Operasional',
    jumlah: 0,
    keterangan: '',
    penerimaOrPemohon: currentUser?.name || '',
    penanggungJawab: 'Supervisor K3L & Adum',
    unit: currentUser?.unit || 'ULP Baguala',
    kodeUnit: currentUser?.kodeUnit || '54110',
    status: 'DISETUJUI',
    noNotaOrRef: ''
  });

  // Filtered List based on User Unit Access & Filters
  const accessibleList = useMemo(() => {
    return cashFlowList.filter(item => {
      // Unit access isolation
      if (currentUser && !isDataAccessibleByUser(currentUser, item.unit, item.kodeUnit)) {
        return false;
      }
      return true;
    });
  }, [cashFlowList, currentUser]);

  const filteredList = useMemo(() => {
    return accessibleList.filter(item => {
      // Search
      const matchesSearch =
        item.noVoucher.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.keterangan.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.penerimaOrPemohon.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.noNotaOrRef && item.noNotaOrRef.toLowerCase().includes(searchQuery.toLowerCase()));

      // Tipe filter
      const matchesTipe = filterTipe === 'ALL' || item.tipe === filterTipe;

      // Kategori filter
      const matchesKategori = filterKategori === 'ALL' || item.kategori === filterKategori;

      // Status filter
      const matchesStatus = filterStatus === 'ALL' || item.status === filterStatus;

      // Unit filter
      const matchesUnit = filterUnit === 'ALL' || item.unit === filterUnit;

      return matchesSearch && matchesTipe && matchesKategori && matchesStatus && matchesUnit;
    });
  }, [accessibleList, searchQuery, filterTipe, filterKategori, filterStatus, filterUnit]);

  // Financial Summaries
  const stats = useMemo(() => {
    const totalPemasakan = accessibleList
      .filter(i => i.tipe === 'PEMASUKAN' && i.status === 'DISETUJUI')
      .reduce((acc, i) => acc + (Number(i.jumlah) || 0), 0);

    const totalPengeluaran = accessibleList
      .filter(i => i.tipe === 'PENGELUARAN' && i.status === 'DISETUJUI')
      .reduce((acc, i) => acc + (Number(i.jumlah) || 0), 0);

    const pendingApprovalCount = accessibleList.filter(i => i.status === 'MENUNGGU_APPROVAL').length;

    const saldo = totalPemasakan - totalPengeluaran;
    const persentaseSerapan = totalPemasakan > 0 ? ((totalPengeluaran / totalPemasakan) * 100).toFixed(1) : '0';

    return {
      totalPemasakan,
      totalPengeluaran,
      saldo,
      persentaseSerapan,
      pendingApprovalCount
    };
  }, [accessibleList]);

  // Breakdown per Category
  const rekapKategoriStats = useMemo(() => {
    const map: Record<string, number> = {};
    KATEGORI_BIAYA_BOP_OPTIONS.filter(k => k !== 'Dropping Dana BOP').forEach(cat => {
      map[cat] = 0;
    });

    accessibleList
      .filter(i => i.tipe === 'PENGELUARAN' && i.status === 'DISETUJUI')
      .forEach(item => {
        map[item.kategori] = (map[item.kategori] || 0) + Number(item.jumlah);
      });

    const items = Object.entries(map).map(([kategori, total]) => ({
      kategori,
      total,
      persentase: stats.totalPengeluaran > 0 ? ((total / stats.totalPengeluaran) * 100).toFixed(1) : '0'
    }));

    items.sort((a, b) => b.total - a.total);
    return items;
  }, [accessibleList, stats.totalPengeluaran]);

  const handleOpenAdd = () => {
    setEditingItem(null);
    const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const autoVoucher = `BKK/BOP/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${Math.floor(100 + Math.random() * 900)}`;

    setFormData({
      tanggal: new Date().toISOString().split('T')[0],
      noVoucher: autoVoucher,
      tipe: 'PENGELUARAN',
      kategori: 'BBM & Pelumas Operasional',
      jumlah: 0,
      keterangan: '',
      penerimaOrPemohon: currentUser?.name || '',
      penanggungJawab: 'Supervisor K3L & Adum',
      unit: currentUser?.unit || 'ULP Baguala',
      kodeUnit: currentUser?.kodeUnit || '54110',
      status: 'DISETUJUI',
      noNotaOrRef: ''
    });
    setShowModal(true);
  };

  const handleOpenEdit = (item: CashFlowBopItem) => {
    setEditingItem(item);
    setFormData({ ...item });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.noVoucher || !formData.jumlah || !formData.keterangan) {
      alert('Mohon lengkapi No. Voucher, Jumlah Nominal, dan Keterangan transaksi.');
      return;
    }

    if (editingItem) {
      onUpdateTransaction({
        ...editingItem,
        ...(formData as CashFlowBopItem),
        jumlah: Number(formData.jumlah),
        updatedAt: new Date().toISOString()
      });
    } else {
      const newItem: CashFlowBopItem = {
        id: `bop-${Date.now()}`,
        tanggal: formData.tanggal || new Date().toISOString().split('T')[0],
        noVoucher: formData.noVoucher || '',
        tipe: formData.tipe || 'PENGELUARAN',
        kategori: (formData.kategori as KategoriBiayaBop) || 'Lain-lain',
        jumlah: Number(formData.jumlah) || 0,
        keterangan: formData.keterangan || '',
        penerimaOrPemohon: formData.penerimaOrPemohon || '',
        penanggungJawab: formData.penanggungJawab || '',
        unit: formData.unit || 'ULP Baguala',
        kodeUnit: formData.kodeUnit || '54110',
        status: formData.status || 'DISETUJUI',
        noNotaOrRef: formData.noNotaOrRef || '',
        createdAt: new Date().toISOString()
      };
      onAddTransaction(newItem);
    }
    setShowModal(false);
  };

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const handlePrintVoucher = (item: CashFlowBopItem) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Voucher Kas BOP - ${item.noVoucher}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; color: #1e293b; }
            .header { text-align: center; border-bottom: 2px solid #0f766e; padding-bottom: 10px; margin-bottom: 20px; }
            .header h2 { margin: 0; color: #0f766e; font-size: 18px; }
            .header p { margin: 3px 0; font-size: 12px; color: #64748b; }
            .voucher-title { font-size: 16px; font-weight: bold; text-align: center; margin-bottom: 15px; text-decoration: underline; }
            .table-info { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            .table-info td { padding: 6px 8px; font-size: 12px; }
            .table-info tr td:first-child { font-weight: bold; width: 160px; color: #334155; }
            .amount-box { border: 2px solid #0f766e; background: #f0fdf4; padding: 12px; font-size: 16px; font-weight: bold; text-align: center; margin: 15px 0; border-radius: 8px; }
            .signatures { margin-top: 40px; display: flex; justify-content: space-between; text-align: center; }
            .sig-box { width: 30%; font-size: 11px; }
            .sig-line { margin-top: 60px; border-top: 1px solid #000; padding-top: 4px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>PT PLN (PERSERO) - UNIT PELAKSANA PELAYANAN PELANGGAN</h2>
            <p>BUKTI VOUCHER KAS ${item.tipe === 'PEMASUKAN' ? 'MASUK (BKM)' : 'KELUAR (BKK)'} BOP - ${item.unit}</p>
          </div>

          <div class="voucher-title">
            VOUCHER ${item.tipe === 'PEMASUKAN' ? 'KAS MASUK' : 'KAS KELUAR'} (BOP)
          </div>

          <table class="table-info">
            <tr><td>No. Voucher</td><td>: ${item.noVoucher}</td></tr>
            <tr><td>Tanggal Transaksi</td><td>: ${item.tanggal}</td></tr>
            <tr><td>Unit / Kode Unit</td><td>: ${item.unit} (${item.kodeUnit || '-'})</td></tr>
            <tr><td>Jenis Transaksi</td><td>: ${item.tipe}</td></tr>
            <tr><td>Kategori Biaya</td><td>: ${item.kategori}</td></tr>
            <tr><td>Penerima / Pemohon</td><td>: ${item.penerimaOrPemohon}</td></tr>
            <tr><td>Penanggung Jawab</td><td>: ${item.penanggungJawab}</td></tr>
            <tr><td>No. Ref / Nota Struk</td><td>: ${item.noNotaOrRef || '-'}</td></tr>
            <tr><td>Uraian / Keterangan</td><td>: ${item.keterangan}</td></tr>
          </table>

          <div class="amount-box">
            TOTAL: ${formatRupiah(item.jumlah)}
          </div>

          <div class="signatures">
            <div class="sig-box">
              <p>Mengetahui / Menyetujui,</p>
              <p style="font-weight:bold;">Manager ULP</p>
              <div class="sig-line">( ____________________ )</div>
            </div>
            <div class="sig-box">
              <p>Diperiksa Oleh,</p>
              <p style="font-weight:bold;">Supervisor Adum / K3L</p>
              <div class="sig-line">( ${item.penanggungJawab} )</div>
            </div>
            <div class="sig-box">
              <p>Penerima / Pemohon,</p>
              <p style="font-style:italic;">Yang Menerima</p>
              <div class="sig-line">( ${item.penerimaOrPemohon} )</div>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-teal-900 via-emerald-900 to-slate-900 p-6 rounded-3xl text-white shadow-xl border border-teal-500/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-gradient-to-tr from-amber-400 to-yellow-500 text-slate-950 rounded-2xl shadow-lg shadow-amber-500/20">
              <Wallet className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-black tracking-tight">Monitoring Cash Flow</h1>
                <span className="px-2.5 py-0.5 rounded-full bg-teal-500/30 text-teal-200 text-xs font-bold border border-teal-400/40">
                  Biaya Operasional
                </span>
              </div>
              <p className="text-xs md:text-sm text-teal-200/80 mt-1">
                Pencatatan Pemasukan (Dropping Dana) & Pengeluaran Kas Operasional Unit Layanan Pelanggan (BKM / BKK)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {canEdit && (
              <button
                onClick={handleOpenAdd}
                className="px-4 py-2.5 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-black text-xs md:text-sm rounded-xl transition-all shadow-md shadow-amber-500/30 flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>+ Catat Transaksi BOP</span>
              </button>
            )}
          </div>
        </div>

        {/* Financial Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
            <div className="flex items-center justify-between text-xs text-teal-200 font-semibold">
              <span>Total Dropping Pemasukan</span>
              <ArrowDownRight className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xl md:text-2xl font-black text-white mt-1">
              {formatRupiah(stats.totalPemasakan)}
            </div>
            <div className="text-[10px] text-teal-300/70 mt-1">Dana alokasi resmi dari UP3</div>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
            <div className="flex items-center justify-between text-xs text-teal-200 font-semibold">
              <span>Total Pengeluaran BOP</span>
              <ArrowUpRight className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-xl md:text-2xl font-black text-amber-300 mt-1">
              {formatRupiah(stats.totalPengeluaran)}
            </div>
            <div className="text-[10px] text-amber-200/70 mt-1">Serapan Anggaran: {stats.persentaseSerapan}%</div>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
            <div className="flex items-center justify-between text-xs text-teal-200 font-semibold">
              <span>Sisa Saldo Kas BOP</span>
              <Wallet className="w-4 h-4 text-cyan-300" />
            </div>
            <div className={`text-xl md:text-2xl font-black mt-1 ${stats.saldo >= 0 ? 'text-emerald-300' : 'text-red-400'}`}>
              {formatRupiah(stats.saldo)}
            </div>
            <div className="text-[10px] text-teal-300/70 mt-1">Kas siap pakai di ULP</div>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
            <div className="flex items-center justify-between text-xs text-teal-200 font-semibold">
              <span>Approval Menunggu</span>
              <Clock className="w-4 h-4 text-yellow-300" />
            </div>
            <div className="text-xl md:text-2xl font-black text-yellow-300 mt-1">
              {stats.pendingApprovalCount} Transaksi
            </div>
            <div className="text-[10px] text-yellow-200/70 mt-1">Memerlukan verifikasi SPV/Manager</div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 rounded-2xl shadow-xs">
        <div className="flex items-center gap-1 overflow-x-auto py-2">
          <button
            onClick={() => setActiveTab('jurnal')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'jurnal'
                ? 'bg-teal-700 text-white shadow-md shadow-teal-700/20'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Jurnal Transaksi Kas (BKK / BKM)</span>
            <span className="ml-1 px-1.5 py-0.5 rounded-md text-[10px] font-black bg-white/20">
              {filteredList.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('rekap_kategori')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'rekap_kategori'
                ? 'bg-teal-700 text-white shadow-md shadow-teal-700/20'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <PieChart className="w-4 h-4" />
            <span>Rekapitulasi per Kategori Biaya</span>
          </button>

          <button
            onClick={() => setActiveTab('pagu_unit')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'pagu_unit'
                ? 'bg-teal-700 text-white shadow-md shadow-teal-700/20'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Alokasi Pagu BOP Unit PLN</span>
          </button>
        </div>
      </div>

      {/* TAB 1: JURNAL TRANSAKSI KAS */}
      {activeTab === 'jurnal' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* Search */}
              <div className="relative lg:col-span-2">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari No. Voucher, Keterangan, Pemohon..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:bg-white font-medium"
                />
              </div>

              {/* Filter Tipe */}
              <div>
                <select
                  value={filterTipe}
                  onChange={e => setFilterTipe(e.target.value as any)}
                  className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-teal-500"
                >
                  <option value="ALL">Semua Jenis (Masuk/Keluar)</option>
                  <option value="PEMASUKAN">Pemasukan (Dropping Dana)</option>
                  <option value="PENGELUARAN">Pengeluaran (Belanja BOP)</option>
                </select>
              </div>

              {/* Filter Kategori */}
              <div>
                <select
                  value={filterKategori}
                  onChange={e => setFilterKategori(e.target.value)}
                  className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-teal-500"
                >
                  <option value="ALL">Semua Kategori Biaya</option>
                  {KATEGORI_BIAYA_BOP_OPTIONS.map((cat, idx) => (
                    <option key={idx} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter Unit */}
              <div>
                <select
                  value={filterUnit}
                  onChange={e => setFilterUnit(e.target.value)}
                  className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-teal-500"
                >
                  <option value="ALL">Semua Unit ULP</option>
                  {DAFTAR_UNIT_PLN.map(u => (
                    <option key={u.kodeUnit} value={u.namaUnit}>
                      {u.namaUnit}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-extrabold border-b border-slate-200">
                    <th className="py-3.5 px-4">TANGGAL & NO. VOUCHER</th>
                    <th className="py-3.5 px-4">JENIS & KATEGORI BIAYA</th>
                    <th className="py-3.5 px-4">KETERANGAN TRANSAKSI</th>
                    <th className="py-3.5 px-4">NOMINAL (RP)</th>
                    <th className="py-3.5 px-4">PENERIMA / PEMOHON</th>
                    <th className="py-3.5 px-4">UNIT</th>
                    <th className="py-3.5 px-4 text-center">STATUS</th>
                    <th className="py-3.5 px-4 text-center">AKSI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
                  {filteredList.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        <Wallet className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                        <p className="font-bold text-sm text-slate-600">Belum Ada Transaksi BOP</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Gunakan tombol '+ Catat Transaksi BOP' untuk menambahkan catatan kas baru.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredList.map(item => (
                      <tr key={item.id} className="hover:bg-teal-50/50 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{item.noVoucher}</div>
                          <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <span>{item.tanggal}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                                item.tipe === 'PEMASUKAN'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : 'bg-amber-100 text-amber-800 border border-amber-300'
                              }`}
                            >
                              {item.tipe}
                            </span>
                          </div>
                          <div className="text-xs font-bold text-slate-700 mt-1">{item.kategori}</div>
                        </td>

                        <td className="py-3.5 px-4 max-w-xs">
                          <p className="line-clamp-2 text-slate-800 font-medium">{item.keterangan}</p>
                          {item.noNotaOrRef && (
                            <span className="text-[10px] text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200 mt-1 inline-block">
                              Ref/Nota: {item.noNotaOrRef}
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`text-sm font-black ${
                              item.tipe === 'PEMASUKAN' ? 'text-emerald-700' : 'text-slate-900'
                            }`}
                          >
                            {formatRupiah(item.jumlah)}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-bold text-slate-800">{item.penerimaOrPemohon}</div>
                          <div className="text-[10px] text-slate-500">PJ: {item.penanggungJawab}</div>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="px-2 py-1 rounded-lg bg-slate-100 text-slate-700 font-bold text-[11px] border border-slate-200">
                            {item.unit}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          {item.status === 'DISETUJUI' && (
                            <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold inline-flex items-center gap-1 border border-emerald-300">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              Disetujui
                            </span>
                          )}
                          {item.status === 'MENUNGGU_APPROVAL' && (
                            <span className="px-2.5 py-1 rounded-full bg-yellow-100 text-yellow-800 text-[11px] font-bold inline-flex items-center gap-1 border border-yellow-300">
                              <Clock className="w-3.5 h-3.5 text-yellow-600" />
                              Menunggu
                            </span>
                          )}
                          {item.status === 'DRAFT' && (
                            <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold border border-slate-300">
                              Draft
                            </span>
                          )}
                          {item.status === 'DITOLAK' && (
                            <span className="px-2.5 py-1 rounded-full bg-red-100 text-red-800 text-[11px] font-bold inline-flex items-center gap-1 border border-red-300">
                              <XCircle className="w-3.5 h-3.5 text-red-600" />
                              Ditolak
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handlePrintVoucher(item)}
                              className="p-1.5 hover:bg-teal-100 text-teal-700 rounded-lg transition-colors cursor-pointer"
                              title="Cetak Voucher BKK / BKM"
                            >
                              <Printer className="w-4 h-4" />
                            </button>

                            {canEdit && (
                              <>
                                <button
                                  onClick={() => handleOpenEdit(item)}
                                  className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors cursor-pointer"
                                  title="Edit Transaksi"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm(`Hapus voucher ${item.noVoucher}?`)) {
                                      onDeleteTransaction(item.id);
                                    }
                                  }}
                                  className="p-1.5 hover:bg-red-100 text-red-600 rounded-lg transition-colors cursor-pointer"
                                  title="Hapus Transaksi"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: REKAPITULASI PER KATEGORI BIAYA */}
      {activeTab === 'rekap_kategori' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="text-base font-black text-slate-800 mb-1 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-teal-600" />
              <span>Rekapitulasi Pengeluaran BOP per Kategori Biaya</span>
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Persentase serapan anggaran belanja operasional ULP berdasarkan jenis pengeluaran
            </p>

            <div className="space-y-4">
              {rekapKategoriStats.map((item, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                    <span>{item.kategori}</span>
                    <span>
                      {formatRupiah(item.total)}{' '}
                      <span className="text-[10px] text-teal-600 font-extrabold ml-1">({item.persentase}%)</span>
                    </span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                    <div
                      className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Number(item.persentase))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-lg flex flex-col justify-between">
            <div>
              <h4 className="text-sm font-black uppercase text-amber-400 tracking-wider">
                Petunjuk Kelola Cash Flow BOP
              </h4>
              <ul className="mt-4 space-y-3 text-xs text-slate-300 font-medium">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Pemasukan:</strong> Catat setiap pengiriman/dropping dana BOP bulanan dari UP3 dengan nomor voucher BKM.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Pengeluaran:</strong> Sertakan nomor kwitansi/nota SPBU/toko dan penanggung jawab regu/supervisor terkait.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Cetak Voucher:</strong> Gunakan ikon Printer pada tabel jurnal untuk mencetak form bukti kas fisik resmi ULP.
                  </span>
                </li>
              </ul>
            </div>

            <div className="mt-6 p-4 bg-teal-950 border border-teal-700/50 rounded-xl text-xs text-teal-200">
              <p className="font-bold">Total Pemasukan: {formatRupiah(stats.totalPemasakan)}</p>
              <p className="font-bold mt-1 text-amber-300">Total Pengeluaran: {formatRupiah(stats.totalPengeluaran)}</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PAGU BOP UNIT PLN */}
      {activeTab === 'pagu_unit' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-slate-800">Alokasi Pagu Anggaran BOP per Unit Layanan</h3>
              <p className="text-xs text-slate-500">Batas anggaran belanja operasional bulanan & tahunan ULP PLN</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {DAFTAR_UNIT_PLN.map((unit, idx) => (
              <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <span className="font-black text-slate-900 text-sm">{unit.namaUnit}</span>
                  <span className="px-2 py-0.5 bg-teal-100 text-teal-800 text-[10px] font-bold rounded">
                    {unit.kodeUnit}
                  </span>
                </div>
                <div className="mt-3 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Pagu Tahunan (2026):</span>
                    <span className="font-bold text-slate-900">Rp 300.000.000</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Pagu Bulanan:</span>
                    <span className="font-bold text-slate-900">Rp 25.000.000</span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden mt-2">
                    <div className="h-full bg-teal-600 w-3/4 rounded-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL INPUT / EDIT TRANSAKSI */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-teal-100 text-teal-800 rounded-xl">
                  <Wallet className="w-5 h-5" />
                </div>
                <h3 className="text-base font-black text-slate-900">
                  {editingItem ? 'Edit Transaksi Cash Flow BOP' : 'Catat Transaksi BOP Baru'}
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 block mb-1">Jenis Transaksi</label>
                  <select
                    value={formData.tipe}
                    onChange={e => setFormData({ ...formData, tipe: e.target.value as any })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 font-bold"
                  >
                    <option value="PENGELUARAN">Pengeluaran (BKK - Belanja BOP)</option>
                    <option value="PEMASUKAN">Pemasukan (BKM - Dropping Dana)</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 block mb-1">Tanggal Transaksi</label>
                  <input
                    type="date"
                    value={formData.tanggal}
                    onChange={e => setFormData({ ...formData, tanggal: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 block mb-1">No. Voucher (BKK / BKM)</label>
                  <input
                    type="text"
                    value={formData.noVoucher}
                    onChange={e => setFormData({ ...formData, noVoucher: e.target.value })}
                    placeholder="BKK/BOP/2026/08/001"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="text-slate-700 block mb-1">Nominal (Rp)</label>
                  <input
                    type="number"
                    value={formData.jumlah || ''}
                    onChange={e => setFormData({ ...formData, jumlah: Number(e.target.value) })}
                    placeholder="Contoh: 1500000"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 font-bold text-teal-800"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 block mb-1">Kategori Biaya Operasional</label>
                <select
                  value={formData.kategori}
                  onChange={e => setFormData({ ...formData, kategori: e.target.value as any })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 font-bold"
                >
                  {KATEGORI_BIAYA_BOP_OPTIONS.map((cat, idx) => (
                    <option key={idx} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-700 block mb-1">Uraian / Keterangan Transaksi Detail</label>
                <textarea
                  rows={3}
                  value={formData.keterangan}
                  onChange={e => setFormData({ ...formData, keterangan: e.target.value })}
                  placeholder="Deskripsikan kebutuhan belanja operasional, lokasi, atau keperluan piket..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 block mb-1">Penerima / Pemohon Dana</label>
                  <input
                    type="text"
                    value={formData.penerimaOrPemohon}
                    onChange={e => setFormData({ ...formData, penerimaOrPemohon: e.target.value })}
                    placeholder="Nama Staf / Petugas"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-slate-700 block mb-1">Penanggung Jawab / Supervisor</label>
                  <input
                    type="text"
                    value={formData.penanggungJawab}
                    onChange={e => setFormData({ ...formData, penanggungJawab: e.target.value })}
                    placeholder="Supervisor K3L / Adum / Teknik"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-700 block mb-1">Unit PLN</label>
                  <select
                    value={formData.unit}
                    onChange={e => {
                      const selUnit = DAFTAR_UNIT_PLN.find(u => u.namaUnit === e.target.value);
                      setFormData({
                        ...formData,
                        unit: e.target.value,
                        kodeUnit: selUnit?.kodeUnit || formData.kodeUnit
                      });
                    }}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500"
                  >
                    {DAFTAR_UNIT_PLN.map(u => (
                      <option key={u.kodeUnit} value={u.namaUnit}>
                        {u.namaUnit}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 block mb-1">No. Ref / Struk Nota</label>
                  <input
                    type="text"
                    value={formData.noNotaOrRef}
                    onChange={e => setFormData({ ...formData, noNotaOrRef: e.target.value })}
                    placeholder="STRUK-1092"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="text-slate-700 block mb-1">Status Transaksi</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="DISETUJUI">Disetujui</option>
                    <option value="MENUNGGU_APPROVAL">Menunggu Approval</option>
                    <option value="DRAFT">Draft</option>
                    <option value="DITOLAK">Ditolak</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-black shadow-md shadow-teal-700/30 cursor-pointer"
                >
                  Simpan Transaksi BOP
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
