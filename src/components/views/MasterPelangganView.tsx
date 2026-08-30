import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Building2,
  Zap,
  TrendingUp,
  Download,
  Printer,
  Pencil,
  CheckCircle2,
  PieChart,
  BarChart3,
  Layers,
  Filter,
  FileText,
  Plus,
  ArrowUpRight,
  ShieldCheck,
  Activity,
  X
} from 'lucide-react';
import { Penyulang, SectionJaringan, User } from '../../types';
import { canEditData } from '../../utils/permissions';
import { isDataAccessibleByUser, DAFTAR_UNIT_PLN } from '../../utils/unitConfig';

interface MasterPelangganViewProps {
  currentUser?: User;
  penyulangList: Penyulang[];
  sectionList: SectionJaringan[];
  onUpdatePenyulang?: (updated: Penyulang) => void;
  onUpdateSection?: (updated: SectionJaringan) => void;
}

export const MasterPelangganView: React.FC<MasterPelangganViewProps> = ({
  currentUser,
  penyulangList,
  sectionList,
  onUpdatePenyulang,
  onUpdateSection
}) => {
  const canEdit = currentUser ? canEditData(currentUser) : true;

  const [activeTab, setActiveTab] = useState<'penyulang' | 'section' | 'distribusi'>('penyulang');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGi, setFilterGi] = useState<string>('ALL');
  const [filterKategoriPelanggan, setFilterKategoriPelanggan] = useState<string>('ALL');
  const [filterUnit, setFilterUnit] = useState<string>('ALL');

  // Modal edit state
  const [editingPenyulang, setEditingPenyulang] = useState<Penyulang | null>(null);
  const [inputJumlahPelanggan, setInputJumlahPelanggan] = useState<number>(0);

  const [editingSection, setEditingSection] = useState<SectionJaringan | null>(null);
  const [inputJumlahPelangganSection, setInputJumlahPelangganSection] = useState<number>(0);

  // Accessible Penyulang list based on user unit
  const accessiblePenyulang = useMemo(() => {
    return penyulangList.filter(p => {
      if (currentUser && !isDataAccessibleByUser(currentUser, p.unit, p.kodeUnit)) {
        return false;
      }
      return true;
    });
  }, [penyulangList, currentUser]);

  // Overall statistics
  const stats = useMemo(() => {
    const totalPelanggan = accessiblePenyulang.reduce((acc, p) => acc + (p.jumlahPelanggan || 0), 0);
    const totalPenyulang = accessiblePenyulang.length;
    const avgPelangganPerPenyulang = totalPenyulang > 0 ? Math.round(totalPelanggan / totalPenyulang) : 0;
    const totalKms = accessiblePenyulang.reduce((acc, p) => acc + (p.panjangJaringanKms || 0), 0);
    const rasioKms = totalKms > 0 ? (totalPelanggan / totalKms).toFixed(1) : '0';

    // Top penyulang with highest customers
    const sorted = [...accessiblePenyulang].sort((a, b) => (b.jumlahPelanggan || 0) - (a.jumlahPelanggan || 0));
    const penyulangTertinggi = sorted[0] || null;

    // Count section customers
    const totalPelangganSection = sectionList.reduce((acc, s) => acc + (s.jumlahPelanggan || 0), 0);

    return {
      totalPelanggan,
      totalPenyulang,
      avgPelangganPerPenyulang,
      totalKms: totalKms.toFixed(1),
      rasioKms,
      penyulangTertinggi,
      totalPelangganSection
    };
  }, [accessiblePenyulang, sectionList]);

  // Filtered Penyulang list
  const filteredPenyulang = useMemo(() => {
    return accessiblePenyulang.filter(p => {
      const matchesSearch =
        p.namaPenyulang.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.namaGi.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.kodeId.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesGi = filterGi === 'ALL' || p.namaGi === filterGi;

      const matchesUnit = filterUnit === 'ALL' || p.unit === filterUnit;

      let matchesKategori = true;
      const jml = p.jumlahPelanggan || 0;
      if (filterKategoriPelanggan === 'JUMBO') matchesKategori = jml >= 10000;
      else if (filterKategoriPelanggan === 'SEDANG') matchesKategori = jml >= 3000 && jml < 10000;
      else if (filterKategoriPelanggan === 'KECIL') matchesKategori = jml < 3000;

      return matchesSearch && matchesGi && matchesUnit && matchesKategori;
    });
  }, [accessiblePenyulang, searchQuery, filterGi, filterUnit, filterKategoriPelanggan]);

  // Filtered Sections
  const filteredSections = useMemo(() => {
    return sectionList.filter(s => {
      const matchesSearch =
        s.namaSection.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.namaPenyulang.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesUnit = filterUnit === 'ALL' || s.unit === filterUnit;

      return matchesSearch && matchesUnit;
    });
  }, [sectionList, searchQuery, filterUnit]);

  // Unique GI list for filter dropdown
  const daftarGi = useMemo(() => {
    const setGi = new Set<string>();
    accessiblePenyulang.forEach(p => {
      if (p.namaGi) setGi.add(p.namaGi);
    });
    return Array.from(setGi);
  }, [accessiblePenyulang]);

  // Handle Edit Penyulang Submit
  const handleSavePenyulang = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPenyulang || !onUpdatePenyulang) return;

    onUpdatePenyulang({
      ...editingPenyulang,
      jumlahPelanggan: Number(inputJumlahPelanggan)
    });
    setEditingPenyulang(null);
  };

  // Handle Edit Section Submit
  const handleSaveSection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSection || !onUpdateSection) return;

    onUpdateSection({
      ...editingSection,
      jumlahPelanggan: Number(inputJumlahPelangganSection)
    });
    setEditingSection(null);
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['No', 'Nama Penyulang', 'Kode ID', 'Gardu Induk', 'Jumlah Pelanggan', 'Panjang Jaringan (KMS)', 'Pelanggan per KMS', '% Total Pelanggan'];
    const rows = filteredPenyulang.map((p, index) => {
      const persentase = stats.totalPelanggan > 0 ? (((p.jumlahPelanggan || 0) / stats.totalPelanggan) * 100).toFixed(2) : '0';
      const rasio = p.panjangJaringanKms ? ((p.jumlahPelanggan || 0) / p.panjangJaringanKms).toFixed(1) : '0';
      return [
        index + 1,
        `"${p.namaPenyulang}"`,
        `"${p.kodeId}"`,
        `"${p.namaGi}"`,
        p.jumlahPelanggan || 0,
        p.panjangJaringanKms || 0,
        rasio,
        `"${persentase}%"`
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Master_Data_Pelanggan_Penyulang_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print PDF
  const handlePrintPDF = () => {
    const printWin = window.open('', '_blank');
    if (!printWin) return;

    printWin.document.write(`
      <html>
        <head>
          <title>Master Data Pelanggan per Penyulang - PLN ULP</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; color: #0f172a; }
            .header { text-align: center; border-bottom: 2px solid #0f766e; padding-bottom: 12px; margin-bottom: 20px; }
            .header h2 { margin: 0; color: #0f766e; font-size: 18px; }
            .header p { margin: 4px 0; font-size: 12px; color: #64748b; }
            .stats-row { display: flex; justify-content: space-between; margin-bottom: 20px; background: #f0fdf4; border: 1px solid #bbf7d0; padding: 12px; border-radius: 8px; }
            .stat-box { text-align: center; font-size: 11px; }
            .stat-box strong { font-size: 16px; color: #0f766e; display: block; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 11px; }
            th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; }
            th { background-color: #f1f5f9; color: #334155; font-weight: bold; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>PT PLN (PERSERO) - MASTER DATA PELANGGAN PER PENYULANG</h2>
            <p>Rekapitulasi Pelanggan Jaringan Distribusi 20kV | Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}</p>
          </div>

          <div class="stats-row">
            <div class="stat-box">Total Pelanggan Keseluruhan<strong>${stats.totalPelanggan.toLocaleString('id-ID')} Pelanggan</strong></div>
            <div class="stat-box">Total Penyulang<strong>${stats.totalPenyulang} Feeder</strong></div>
            <div class="stat-box">Rata-rata per Penyulang<strong>${stats.avgPelangganPerPenyulang.toLocaleString('id-ID')} Pelanggan</strong></div>
            <div class="stat-box">Total Panjang Jaringan<strong>${stats.totalKms} KMS</strong></div>
          </div>

          <table>
            <thead>
              <tr>
                <th class="text-center">NO</th>
                <th>NAMA PENYULANG</th>
                <th>KODE ID</th>
                <th>GARDU INDUK / PLTD</th>
                <th class="text-right">JUMLAH PELANGGAN</th>
                <th class="text-right">PANJANG (KMS)</th>
                <th class="text-right">PELANGGAN / KMS</th>
                <th class="text-right">% DARI TOTAL</th>
              </tr>
            </thead>
            <tbody>
              ${filteredPenyulang.map((p, idx) => {
                const persentase = stats.totalPelanggan > 0 ? (((p.jumlahPelanggan || 0) / stats.totalPelanggan) * 100).toFixed(2) : '0';
                const rasio = p.panjangJaringanKms ? ((p.jumlahPelanggan || 0) / p.panjangJaringanKms).toFixed(1) : '0';
                return `
                  <tr>
                    <td class="text-center">${idx + 1}</td>
                    <td><strong>${p.namaPenyulang}</strong></td>
                    <td>${p.kodeId}</td>
                    <td>${p.namaGi}</td>
                    <td class="text-right"><strong>${(p.jumlahPelanggan || 0).toLocaleString('id-ID')}</strong></td>
                    <td class="text-right">${p.panjangJaringanKms || 0} KMS</td>
                    <td class="text-right">${rasio}</td>
                    <td class="text-right">${persentase}%</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `);
    printWin.document.close();
    printWin.focus();
    setTimeout(() => {
      printWin.print();
    }, 500);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-900 via-emerald-900 to-slate-900 p-6 rounded-3xl text-white shadow-xl border border-teal-500/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-gradient-to-tr from-emerald-400 to-teal-500 text-slate-950 rounded-2xl shadow-lg shadow-emerald-500/20">
              <Users className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-black tracking-tight">Master Data Pelanggan PLN</h1>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 text-xs font-bold border border-emerald-400/40">
                  Integrasi Penyulang & Section
                </span>
              </div>
              <p className="text-xs md:text-sm text-teal-200/80 mt-1">
                Rekapitulasi jumlah pelanggan dalam 1 penyulang dan total akumulasi keseluruhan pelanggan ULP
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4 text-emerald-300" />
              <span>Unduh CSV</span>
            </button>
            <button
              onClick={handlePrintPDF}
              className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl transition-all shadow-md shadow-emerald-500/30 flex items-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Rekap PDF</span>
            </button>
          </div>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
            <div className="flex items-center justify-between text-xs text-teal-200 font-semibold">
              <span>Total Pelanggan Keseluruhan</span>
              <Users className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl md:text-3xl font-black text-white mt-1">
              {stats.totalPelanggan.toLocaleString('id-ID')}
              <span className="text-xs text-emerald-300 font-normal ml-1">Pelanggan</span>
            </div>
            <div className="text-[10px] text-teal-300/70 mt-1">Akumulasi seluruh Penyulang & Section ULP</div>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
            <div className="flex items-center justify-between text-xs text-teal-200 font-semibold">
              <span>Jumlah Penyulang Aktif</span>
              <Building2 className="w-4 h-4 text-cyan-300" />
            </div>
            <div className="text-2xl md:text-3xl font-black text-cyan-300 mt-1">
              {stats.totalPenyulang}
              <span className="text-xs font-normal ml-1">Feeder 20kV</span>
            </div>
            <div className="text-[10px] text-teal-300/70 mt-1">Gardu Induk Passo & Hative Besar</div>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
            <div className="flex items-center justify-between text-xs text-teal-200 font-semibold">
              <span>Rata-rata per Penyulang</span>
              <BarChart3 className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl md:text-3xl font-black text-amber-300 mt-1">
              {stats.avgPelangganPerPenyulang.toLocaleString('id-ID')}
              <span className="text-xs font-normal ml-1">Pik/Feeder</span>
            </div>
            <div className="text-[10px] text-amber-200/70 mt-1">Rasio Kepadatan: {stats.rasioKms} Pelanggan/KMS</div>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
            <div className="flex items-center justify-between text-xs text-teal-200 font-semibold">
              <span>Penyulang Beban Terbesar</span>
              <Zap className="w-4 h-4 text-yellow-300" />
            </div>
            <div className="text-lg md:text-xl font-black text-yellow-300 mt-1 truncate">
              {stats.penyulangTertinggi?.namaPenyulang || '-'}
            </div>
            <div className="text-[10px] text-yellow-200/70 mt-1">
              {stats.penyulangTertinggi?.jumlahPelanggan?.toLocaleString('id-ID')} Pelanggan (
              {stats.totalPelanggan > 0
                ? (((stats.penyulangTertinggi?.jumlahPelanggan || 0) / stats.totalPelanggan) * 100).toFixed(1)
                : 0}
              %)
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 rounded-2xl shadow-xs">
        <div className="flex items-center gap-1 overflow-x-auto py-2">
          <button
            onClick={() => setActiveTab('penyulang')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'penyulang'
                ? 'bg-teal-700 text-white shadow-md shadow-teal-700/20'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Pelanggan per Penyulang (Feeder)</span>
            <span className="ml-1 px-1.5 py-0.5 rounded-md text-[10px] font-black bg-white/20">
              {filteredPenyulang.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('section')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'section'
                ? 'bg-teal-700 text-white shadow-md shadow-teal-700/20'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Pelanggan per Section Jaringan</span>
            <span className="ml-1 px-1.5 py-0.5 rounded-md text-[10px] font-black bg-white/20">
              {filteredSections.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('distribusi')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'distribusi'
                ? 'bg-teal-700 text-white shadow-md shadow-teal-700/20'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <PieChart className="w-4 h-4" />
            <span>Distribusi & Proyeksi Tarif Pelanggan</span>
          </button>
        </div>
      </div>

      {/* TAB 1: REKAP PELANGGAN PER PENYULANG */}
      {activeTab === 'penyulang' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
              {/* Search */}
              <div className="relative lg:col-span-2">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari nama penyulang, kode ID, atau Gardu Induk..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:bg-white font-medium"
                />
              </div>

              {/* Filter ULP */}
              <div>
                <select
                  value={filterUnit}
                  onChange={e => setFilterUnit(e.target.value)}
                  className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-teal-500"
                >
                  <option value="ALL">Semua ULP</option>
                  {DAFTAR_UNIT_PLN.map(u => (
                    <option key={u.kodeUnit} value={u.namaUnit}>
                      {u.namaUnit}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter Gardu Induk */}
              <div>
                <select
                  value={filterGi}
                  onChange={e => setFilterGi(e.target.value)}
                  className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-teal-500"
                >
                  <option value="ALL">Semua Gardu Induk / GI</option>
                  {daftarGi.map((gi, idx) => (
                    <option key={idx} value={gi}>
                      {gi}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter Kategori Beban Pelanggan */}
              <div>
                <select
                  value={filterKategoriPelanggan}
                  onChange={e => setFilterKategoriPelanggan(e.target.value)}
                  className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-teal-500"
                >
                  <option value="ALL">Semua Kategori Beban</option>
                  <option value="JUMBO">Beban Jumbo (&gt; 10.000 Pelanggan)</option>
                  <option value="SEDANG">Beban Sedang (3.000 - 10.000)</option>
                  <option value="KECIL">Beban Kecil (&lt; 3.000 Pelanggan)</option>
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
                    <th className="py-3.5 px-4">NO</th>
                    <th className="py-3.5 px-4">NAMA PENYULANG & KODE ID</th>
                    <th className="py-3.5 px-4">GARDU INDUK / PASOKAN</th>
                    <th className="py-3.5 px-4 text-right">JUMLAH PELANGGAN</th>
                    <th className="py-3.5 px-4 text-right">PANJANG JARINGAN</th>
                    <th className="py-3.5 px-4 text-right">PELANGGAN / KMS</th>
                    <th className="py-3.5 px-4">PORSI DARI TOTAL</th>
                    {canEdit && <th className="py-3.5 px-4 text-center">AKSI</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
                  {filteredPenyulang.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                        <p className="font-bold text-sm text-slate-600">Penyulang Tidak Ditemukan</p>
                        <p className="text-xs text-slate-400 mt-0.5">Silakan sesuaikan kata kunci atau filter pencarian Anda.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredPenyulang.map((penyulang, idx) => {
                      const jml = penyulang.jumlahPelanggan || 0;
                      const persentase = stats.totalPelanggan > 0 ? ((jml / stats.totalPelanggan) * 100).toFixed(2) : '0';
                      const rasioKms = penyulang.panjangJaringanKms ? (jml / penyulang.panjangJaringanKms).toFixed(1) : '0';

                      return (
                        <tr key={penyulang.id} className="hover:bg-teal-50/50 transition-colors">
                          <td className="py-3.5 px-4 text-slate-400 font-bold">{idx + 1}</td>

                          <td className="py-3.5 px-4">
                            <div className="font-extrabold text-slate-900 text-sm">{penyulang.namaPenyulang}</div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="px-1.5 py-0.5 rounded bg-teal-100 text-teal-800 text-[10px] font-black border border-teal-200">
                                Kode: {penyulang.kodeId}
                              </span>
                              <span className="text-[10px] text-slate-500">{penyulang.status}</span>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-800 flex items-center gap-1">
                              <Building2 className="w-3.5 h-3.5 text-teal-600" />
                              <span>{penyulang.namaGi}</span>
                            </div>
                            <div className="text-[10px] text-slate-500 mt-0.5">ULP Baguala</div>
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <span className="text-sm font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 inline-block">
                              {jml.toLocaleString('id-ID')}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-right font-bold text-slate-700">
                            {penyulang.panjangJaringanKms || 0} KMS
                          </td>

                          <td className="py-3.5 px-4 text-right font-bold text-slate-600">
                            {rasioKms} <span className="text-[10px] text-slate-400 font-normal">pel/kms</span>
                          </td>

                          <td className="py-3.5 px-4 max-w-xs">
                            <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 mb-1">
                              <span>{persentase}%</span>
                            </div>
                            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                              <div
                                className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full"
                                style={{ width: `${Math.min(100, Number(persentase) * 4)}%` }}
                              />
                            </div>
                          </td>

                          {canEdit && (
                            <td className="py-3.5 px-4 text-center whitespace-nowrap">
                              <button
                                onClick={() => {
                                  setEditingPenyulang(penyulang);
                                  setInputJumlahPelanggan(penyulang.jumlahPelanggan || 0);
                                }}
                                className="px-3 py-1.5 bg-slate-100 hover:bg-teal-100 text-slate-700 hover:text-teal-800 rounded-lg transition-colors font-bold text-xs flex items-center gap-1.5 mx-auto cursor-pointer border border-slate-200"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                                <span>Edit Data</span>
                              </button>
                            </td>
                          )}
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

      {/* TAB 2: BREAKDOWN PELANGGAN PER SECTION JARINGAN */}
      {activeTab === 'section' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative w-full">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama section atau penyulang..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <select
                value={filterUnit}
                onChange={e => setFilterUnit(e.target.value)}
                className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-teal-500"
              >
                <option value="ALL">Semua ULP</option>
                {DAFTAR_UNIT_PLN.map(u => (
                  <option key={u.kodeUnit} value={u.namaUnit}>
                    {u.namaUnit}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-end text-xs font-bold text-slate-600">
              Total Section: <span className="text-teal-700 font-black ml-1">{filteredSections.length}</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-extrabold border-b border-slate-200">
                    <th className="py-3.5 px-4">NAMA SECTION JARINGAN</th>
                    <th className="py-3.5 px-4">PENYULANG UTAMA</th>
                    <th className="py-3.5 px-4">SISTEM OPERASI</th>
                    <th className="py-3.5 px-4 text-right">JUMLAH PELANGGAN TERDAMPAK</th>
                    <th className="py-3.5 px-4">PASOKAN BACKUP / DISUPPLY</th>
                    {canEdit && <th className="py-3.5 px-4 text-center">AKSI</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
                  {filteredSections.map(sec => (
                    <tr key={sec.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-extrabold text-slate-900">{sec.namaSection}</div>
                        <div className="text-[10px] text-slate-400">ID: {sec.id}</div>
                      </td>

                      <td className="py-3.5 px-4 font-bold text-teal-800">
                        {sec.namaPenyulang}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          sec.sistemOperasi === 'Loop' ? 'bg-indigo-100 text-indigo-800 border border-indigo-200' : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {sec.sistemOperasi}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <span className="font-black text-slate-900 text-sm">
                          {(sec.jumlahPelanggan || 0).toLocaleString('id-ID')}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-600">
                        {sec.penyulangDiSupply || '-'}
                      </td>

                      {canEdit && (
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <button
                            onClick={() => {
                              setEditingSection(sec);
                              setInputJumlahPelangganSection(sec.jumlahPelanggan || 0);
                            }}
                            className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors cursor-pointer"
                            title="Edit Pelanggan Section"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DISTRIBUSI GOLONGAN TARIF & STATISTIK */}
      {activeTab === 'distribusi' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div>
              <h3 className="text-base font-black text-slate-800 mb-1 flex items-center gap-2">
                <PieChart className="w-5 h-5 text-teal-600" />
                <span>Estimasi Sebaran Golongan Tarif Pelanggan</span>
              </h3>
              <p className="text-xs text-slate-500">
                Estimasi komposisi tarif berdasarkan standar rasio beban pelanggan ULP PLN
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-slate-800">
                  <span>Rumah Tangga (R1 / R2 / R3)</span>
                  <span>
                    {Math.round(stats.totalPelanggan * 0.82).toLocaleString('id-ID')} Pelanggan{' '}
                    <span className="text-teal-600 font-black">(82%)</span>
                  </span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                  <div className="h-full bg-emerald-500 rounded-full w-[82%]" />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-slate-800">
                  <span>Bisnis & Komersial (B1 / B2 / B3)</span>
                  <span>
                    {Math.round(stats.totalPelanggan * 0.11).toLocaleString('id-ID')} Pelanggan{' '}
                    <span className="text-teal-600 font-black">(11%)</span>
                  </span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                  <div className="h-full bg-cyan-500 rounded-full w-[11%]" />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-slate-800">
                  <span>Pemerintah & Publik (P1 / P2 / P3)</span>
                  <span>
                    {Math.round(stats.totalPelanggan * 0.04).toLocaleString('id-ID')} Pelanggan{' '}
                    <span className="text-teal-600 font-black">(4%)</span>
                  </span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                  <div className="h-full bg-amber-500 rounded-full w-[4%]" />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-slate-800">
                  <span>Sosial & Rumah Ibadah (S1 / S2)</span>
                  <span>
                    {Math.round(stats.totalPelanggan * 0.02).toLocaleString('id-ID')} Pelanggan{' '}
                    <span className="text-teal-600 font-black">(2%)</span>
                  </span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                  <div className="h-full bg-purple-500 rounded-full w-[2%]" />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-slate-800">
                  <span>Industri & Manufaktur (I1 / I2 / I3)</span>
                  <span>
                    {Math.round(stats.totalPelanggan * 0.01).toLocaleString('id-ID')} Pelanggan{' '}
                    <span className="text-teal-600 font-black">(1%)</span>
                  </span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                  <div className="h-full bg-rose-500 rounded-full w-[1%]" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-lg flex flex-col justify-between">
            <div>
              <h4 className="text-sm font-black uppercase text-emerald-400 tracking-wider">
                Penetapan Beban & Dampak Padam
              </h4>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                Data Master Pelanggan per Penyulang digunakan sebagai acuan dasar perhitungan nilai SAIDI & SAIFI saat terjadi padam jaringan atau trip penyulang.
              </p>

              <div className="mt-6 space-y-3 text-xs">
                <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700">
                  <div className="text-slate-400">Total Pelanggan Terhubung:</div>
                  <div className="text-lg font-black text-white mt-0.5">
                    {stats.totalPelanggan.toLocaleString('id-ID')} Pelanggan
                  </div>
                </div>

                <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700">
                  <div className="text-slate-400">Penyulang Terbesar (LATERI 1):</div>
                  <div className="text-lg font-black text-amber-300 mt-0.5">
                    19.269 Pelanggan (22.5% ULP)
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-teal-950 border border-teal-700/50 rounded-xl text-xs text-teal-200">
              <span className="font-bold">Tips Supervisor:</span> Anda dapat memperbarui jumlah pelanggan per penyulang langsung melalui tombol 'Edit Data' pada tabel rekap.
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDIT JUMLAH PELANGGAN PENYULANG */}
      {editingPenyulang && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                  <Pencil className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Edit Pelanggan Penyulang</h3>
                  <p className="text-xs text-slate-500">{editingPenyulang.namaPenyulang} ({editingPenyulang.kodeId})</p>
                </div>
              </div>
              <button
                onClick={() => setEditingPenyulang(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePenyulang} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="text-slate-700 block mb-1">Gardu Induk / Pasokan</label>
                <input
                  type="text"
                  value={editingPenyulang.namaGi}
                  disabled
                  className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-600 font-bold"
                />
              </div>

              <div>
                <label className="text-slate-700 block mb-1">Jumlah Pelanggan Terdaftar</label>
                <input
                  type="number"
                  value={inputJumlahPelanggan}
                  onChange={e => setInputJumlahPelanggan(Number(e.target.value))}
                  placeholder="Masukkan total pelanggan baru..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 font-extrabold text-sm text-emerald-800"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingPenyulang(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-black shadow-md shadow-teal-700/30 cursor-pointer"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDIT JUMLAH PELANGGAN SECTION */}
      {editingSection && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-100 text-indigo-800 rounded-xl">
                  <Pencil className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Edit Pelanggan Section</h3>
                  <p className="text-xs text-slate-500">{editingSection.namaSection}</p>
                </div>
              </div>
              <button
                onClick={() => setEditingSection(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSection} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="text-slate-700 block mb-1">Penyulang Utama</label>
                <input
                  type="text"
                  value={editingSection.namaPenyulang}
                  disabled
                  className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-600 font-bold"
                />
              </div>

              <div>
                <label className="text-slate-700 block mb-1">Jumlah Pelanggan Section Terdampak</label>
                <input
                  type="number"
                  value={inputJumlahPelangganSection}
                  onChange={e => setInputJumlahPelangganSection(Number(e.target.value))}
                  placeholder="Masukkan jumlah pelanggan section..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 font-extrabold text-sm text-indigo-800"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingSection(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white font-black shadow-md shadow-indigo-700/30 cursor-pointer"
                >
                  Simpan Section
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
