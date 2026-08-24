import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  Plus,
  Search,
  Download,
  FileSpreadsheet,
  FileText,
  DollarSign,
  Zap,
  Clock,
  TrendingDown,
  Trash2,
  Pencil,
  Presentation
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  Legend
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { SaidiSaifiData, Penyulang, User } from '../../types';
import { HealthIndexBanner } from '../HealthIndexBanner';
import { InputSaidiModal } from '../modals/InputSaidiModal';
import { exportToCSV } from '../../utils/exportCsv';
import { canEditModule, isOwnerUser } from '../../utils/permissions';
import { DAFTAR_UNIT_PLN, getUnitDetails } from '../../utils/unitConfig';
import { PptExportModal } from '../ppt/PptExportModal';
import { PptExportData } from '../ppt/pptTemplate';

interface SaidiSaifiViewProps {
  currentUser?: User;
  saidiList: SaidiSaifiData[];
  penyulangList: Penyulang[];
  onAddSaidi: (data: SaidiSaifiData) => void;
  onDeleteSaidi: (id: string) => void;
  ownerSelectedUnitFilter?: string;
  onSelectUnitFilter?: (unit: string) => void;
}

export const SaidiSaifiView: React.FC<SaidiSaifiViewProps> = ({
  currentUser,
  saidiList,
  penyulangList,
  onAddSaidi,
  onDeleteSaidi,
  ownerSelectedUnitFilter = 'SEMUA',
  onSelectUnitFilter
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPptModalOpen, setIsPptModalOpen] = useState(false);
  const [editingSaidi, setEditingSaidi] = useState<SaidiSaifiData | null>(null);
  const [selectedYear, setSelectedYear] = useState('2026');
  const [searchQuery, setSearchQuery] = useState('');

  const [chartMetricMode, setChartMetricMode] = useState<'saidi' | 'saifi' | 'both'>('saidi');

  const activeUnitInfo = useMemo(() => {
    const activeUnit = ownerSelectedUnitFilter && ownerSelectedUnitFilter !== 'SEMUA' 
      ? ownerSelectedUnitFilter 
      : (currentUser?.unit || 'ULP Baguala');
    return getUnitDetails(activeUnit);
  }, [currentUser, ownerSelectedUnitFilter]);

  const handleExportCSV = () => {
    const headers = [
      'Bulan',
      'Tahun',
      'ENS (kWh)',
      'Target SAIDI',
      'Realisasi SAIDI',
      'Target SAIFI',
      'Realisasi SAIFI',
      'Estimasi Kerugian (Rp)',
      'Catatan'
    ];
    
    const rows = saidiList.map((s) => [
      s.bulan,
      s.tahun,
      s.ensKumulatifKwh,
      s.targetSaidi,
      s.realisasiSaidi,
      s.targetSaifi,
      s.realisasiSaifi,
      s.estimasiKerugianRp,
      s.catatan || ''
    ]);

    exportToCSV(`Realisasi_SAIDI_SAIFI_${selectedYear}`, headers, rows);
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('PT PLN (PERSERO) - UL P BAGUALA / PLN NUSADAYA', 14, 15);
    doc.setFontSize(12);
    doc.text('LAPORAN REKAPITULASI SAIDI, SAIFI & ENS KUMULATIF (UP3 REPORTING)', 14, 22);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Tahun: ${selectedYear} | Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}`, 14, 28);
    doc.text(`Total ENS: ${totalEnsKwh.toLocaleString('id-ID')} kWh | Estimasi Kerugian: Rp ${totalRupiah.toLocaleString('id-ID')}`, 14, 34);
    doc.text(`Rata-rata SAIDI: ${avgSaidi} Jam/Plg | Rata-rata SAIFI: ${avgSaifi} Kali/Plg`, 14, 40);

    const headers = [
      ['Bulan', 'ENS (kWh)', 'Target SAIDI', 'Realisasi SAIDI', 'Target SAIFI', 'Realisasi SAIFI', 'Kerugian (Rp)', 'Catatan']
    ];

    const dataRows = saidiList.map(s => [
      s.bulan,
      s.ensKumulatifKwh.toLocaleString('id-ID'),
      s.targetSaidi,
      s.realisasiSaidi,
      s.targetSaifi,
      s.realisasiSaifi,
      s.estimasiKerugianRp.toLocaleString('id-ID'),
      s.catatan || '-'
    ]);

    autoTable(doc, {
      startY: 48,
      head: headers,
      body: dataRows,
      theme: 'grid',
      headStyles: { fillColor: [30, 41, 59] },
      styles: { fontSize: 8, cellPadding: 2 }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 15;
    doc.text('Mengetahui / Disetujui,', 14, finalY);
    doc.text('Manager ULP Baguala', 14, finalY + 5);
    doc.text('( ______________________ )', 14, finalY + 20);

    doc.text('Dilaporkan Kepada,', 130, finalY);
    doc.text('Pihak UP3 Ambon', 130, finalY + 5);
    doc.text('( ______________________ )', 130, finalY + 20);

    doc.save(`Laporan_SAIDI_SAIFI_UP3_${selectedYear}.pdf`);
  };

  // Sums for selectedYear
  const saidiFiltered = saidiList.filter((s) => String(s.tahun) === selectedYear);

  const filteredList = saidiFiltered.filter((s) =>
    (s.bulan || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (String(s.tahun) || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.catatan || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalEnsKwh = saidiFiltered.reduce((acc, curr) => acc + (curr.ensKumulatifKwh || 0), 0);
  const totalRupiah = saidiFiltered.reduce((acc, curr) => acc + (curr.estimasiKerugianRp || 0), 0);
  const avgSaidi =
    saidiFiltered.length > 0
      ? (saidiFiltered.reduce((acc, curr) => acc + (curr.realisasiSaidi || 0), 0) / saidiFiltered.length).toFixed(3)
      : '0.000';
  const avgSaifi =
    saidiFiltered.length > 0
      ? (saidiFiltered.reduce((acc, curr) => acc + (curr.realisasiSaifi || 0), 0) / saidiFiltered.length).toFixed(3)
      : '0.000';

  // Dynamic Chart Data per month
  const monthsList = [
    { name: 'Jan', key: 1, full: 'Januari' },
    { name: 'Feb', key: 2, full: 'Februari' },
    { name: 'Mar', key: 3, full: 'Maret' },
    { name: 'Apr', key: 4, full: 'April' },
    { name: 'Mei', key: 5, full: 'Mei' },
    { name: 'Jun', key: 6, full: 'Juni' },
    { name: 'Jul', key: 7, full: 'Juli' },
    { name: 'Ags', key: 8, full: 'Agustus' },
    { name: 'Sep', key: 9, full: 'September' },
    { name: 'Okt', key: 10, full: 'Oktober' },
    { name: 'Nov', key: 11, full: 'November' },
    { name: 'Des', key: 12, full: 'Desember' }
  ];

  const chartData = monthsList.map((m) => {
    const matched = saidiFiltered.find((s) => {
      const b = String(s.bulan || '').toLowerCase().trim();
      return (
        b.includes(m.full.toLowerCase()) ||
        b.includes(m.name.toLowerCase()) ||
        b === String(m.key) ||
        b === `0${m.key}`
      );
    });
    return {
      name: m.full,
      ens: matched ? matched.ensKumulatifKwh : 0,
      rupiah: matched ? parseFloat((matched.estimasiKerugianRp / 1000000).toFixed(2)) : 0
    };
  });

  // Pie Data - ENS contribution per month
  const piePalette = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#f43f5e', '#06b6d4'];
  const nonZeroMonths = chartData.filter((d) => d.ens > 0);
  const pieData =
    nonZeroMonths.length > 0
      ? nonZeroMonths.map((d, i) => ({
          name: `${d.name} (${totalEnsKwh ? Math.round((d.ens / totalEnsKwh) * 100) : 0}%)`,
          value: d.ens,
          color: piePalette[i % piePalette.length]
        }))
      : [{ name: 'Belum Ada ENS', value: 1, color: '#cbd5e1' }];

  // Detailed 12-Month SAIDI / SAIFI Bar Chart Data
  const monthlyChartData = useMemo(() => {
    return monthsList.map((m) => {
      const matched = saidiFiltered.find((s) => {
        const b = String(s.bulan || '').toLowerCase().trim();
        return (
          b.includes(m.full.toLowerCase()) ||
          b.includes(m.name.toLowerCase()) ||
          b === String(m.key) ||
          b === `0${m.key}`
        );
      });

      const targetSaidi = matched ? matched.targetSaidi : 0.200;
      const realisasiSaidi = matched ? matched.realisasiSaidi : 0;
      const targetSaifi = matched ? matched.targetSaifi : 0.050;
      const realisasiSaifi = matched ? matched.realisasiSaifi : 0;
      const ens = matched ? matched.ensKumulatifKwh : 0;

      return {
        bulanShort: m.name,
        bulanFull: m.full,
        targetSaidi,
        realisasiSaidi,
        targetSaifi,
        realisasiSaifi,
        ens,
        saidiDiff: realisasiSaidi - targetSaidi,
        saifiDiff: realisasiSaifi - targetSaifi,
        hasData: !!matched
      };
    });
  }, [monthsList, saidiFiltered]);

  const pptExportData: PptExportData = useMemo(() => {
    return {
      reportTitle: `LAPORAN MONITORING KINERJA SAIDI & SAIFI TAHUN ${selectedYear}`,
      unitName: 'ULP BAGUALA - AMBON',
      dateStr: new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
      petugasName: currentUser?.name || 'Petugas Evaluator',
      petugasRole: currentUser?.role || 'Koordinator Keandalan',
      kpiList: [
        { title: 'Realisasi SAIDI', value: avgSaidi, unit: 'menit/plg', color: '#0284C7', note: 'Rata-rata Bulanan' },
        { title: 'Realisasi SAIFI', value: avgSaifi, unit: 'kali/plg', color: '#8B5CF6', note: 'Rata-rata Bulanan' },
        { title: 'ENS Kumulatif', value: totalEnsKwh.toLocaleString('id-ID'), unit: 'kWh', color: '#F59E0B', note: 'Energi Tak Tersalurkan' },
        { title: 'Est. Kerugian', value: `Rp ${(totalRupiah / 1000000).toFixed(1)}M`, color: '#EF4444', note: 'Rupiah Loss' }
      ],
      tableHeaders: ['No', 'Bulan', 'Tahun', 'Target SAIDI', 'Realisasi SAIDI', 'Target SAIFI', 'Realisasi SAIFI', 'ENS (kWh)'],
      tableData: (filteredList.length > 0 ? filteredList : saidiList).slice(0, 8).map((s, idx) => [
        (idx + 1).toString(),
        s.bulan || '-',
        String(s.tahun || selectedYear),
        `${s.targetSaidi} m/plg`,
        `${s.realisasiSaidi} m/plg`,
        `${s.targetSaifi} k/plg`,
        `${s.realisasiSaifi} k/plg`,
        s.ensKumulatifKwh ? s.ensKumulatifKwh.toLocaleString('id-ID') : '0'
      ]),
      notesText: `1. Hasil evaluasi pencapaian SAIDI & SAIFI ULP Baguala tahun ${selectedYear}.\n2. Seluruh indikator berada dalam batas wajar sistem keandalan 20kV.`
    };
  }, [selectedYear, currentUser, avgSaidi, avgSaifi, totalEnsKwh, totalRupiah, filteredList, saidiList]);

  const CustomSaidiSaifiTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs space-y-1.5 max-w-xs">
          <div className="flex items-center justify-between font-extrabold border-b border-slate-800 pb-1 text-amber-300">
            <span>{data.bulanFull} {selectedYear}</span>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold ${
                data.realisasiSaidi <= data.targetSaidi
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'bg-rose-500/20 text-rose-300'
              }`}
            >
              {data.realisasiSaidi <= data.targetSaidi ? 'Sesuai Target' : 'Melampaui Target'}
            </span>
          </div>

          <div className="space-y-1 font-mono text-[11px]">
            {chartMetricMode === 'saidi' && (
              <>
                <div className="flex justify-between text-slate-300">
                  <span>Target SAIDI:</span>
                  <span className="font-bold text-slate-100">{data.targetSaidi.toFixed(3)} Jam</span>
                </div>
                <div className="flex justify-between text-blue-400 font-bold">
                  <span>Realisasi SAIDI:</span>
                  <span>{data.realisasiSaidi.toFixed(3)} Jam</span>
                </div>
              </>
            )}

            {chartMetricMode === 'saifi' && (
              <>
                <div className="flex justify-between text-slate-300">
                  <span>Target SAIFI:</span>
                  <span className="font-bold text-slate-100">{data.targetSaifi.toFixed(3)} Kali</span>
                </div>
                <div className="flex justify-between text-purple-400 font-bold">
                  <span>Realisasi SAIFI:</span>
                  <span>{data.realisasiSaifi.toFixed(3)} Kali</span>
                </div>
              </>
            )}

            {chartMetricMode === 'both' && (
              <>
                <div className="flex justify-between text-blue-300">
                  <span>Realisasi SAIDI:</span>
                  <span className="font-bold">{data.realisasiSaidi.toFixed(3)} Jam/Plg</span>
                </div>
                <div className="flex justify-between text-purple-300">
                  <span>Realisasi SAIFI:</span>
                  <span className="font-bold">{data.realisasiSaifi.toFixed(3)} Kali/Plg</span>
                </div>
              </>
            )}

            {data.ens > 0 && (
              <div className="flex justify-between text-amber-300 text-[10px] pt-1 border-t border-slate-800">
                <span>ENS Kumulatif:</span>
                <span className="font-bold">{data.ens.toLocaleString('id-ID')} kWh</span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-4 md:p-6 space-y-6 bg-slate-50 text-slate-900 font-sans min-h-screen">
      
      {/* Banner */}
      <HealthIndexBanner
        totalCount={penyulangList.length}
        sempurnaCount={penyulangList.filter((p) => p.healthIndexStatus === 'Sempurna').length}
        sehatCount={penyulangList.filter((p) => p.healthIndexStatus === 'Sehat').length}
        sakitCount={penyulangList.filter((p) => p.healthIndexStatus === 'Sakit').length}
        kronisCount={penyulangList.filter((p) => p.healthIndexStatus === 'Kronis').length}
      />

      {/* Title Bar */}
      <div className="p-5 bg-white border border-slate-200 shadow-sm rounded-2xl flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                Monitoring SAIDI, SAIFI &amp; ENS Kumulatif
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold text-[10px]">
                PLN {activeUnitInfo.namaUnit.toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Kalkulasi kuantitatif energi tidak tersalurkan dan estimasi kerugian rupiah untuk UP3
            </p>
          </div>

          {/* Dropdown Filter Unit untuk Manajemen / Owner */}
          {isOwnerUser(currentUser) && onSelectUnitFilter && (
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl shadow-xs">
              <span className="text-[10px] font-black text-slate-500 whitespace-nowrap uppercase tracking-wider">Filter Unit:</span>
              <select
                value={ownerSelectedUnitFilter}
                onChange={(e) => onSelectUnitFilter(e.target.value)}
                className="bg-white border border-slate-300 text-slate-800 text-xs font-extrabold px-2.5 py-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-xs min-w-[150px]"
              >
                <option value="SEMUA">🌐 Semua Unit (Global)</option>
                {DAFTAR_UNIT_PLN.map((u, idx) => (
                  <option key={`saidi_unit_${u.kodeUnit}_${idx}`} value={u.namaUnit}>
                    {u.namaUnit} ({u.kodeUnit})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsPptModalOpen(true)}
            className="px-3.5 py-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-sky-500/20 border border-sky-400/30"
            title="Prinjau & Eksport Laporan ke File PPT PowerPoint dengan Template Danantara PLN"
          >
            <Presentation className="w-4 h-4" />
            <span>Export PPT (.pptx)</span>
          </button>
          <button
            onClick={handleDownloadPDF}
            className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-sm shadow-rose-500/20"
            title="Unduh laporan PDF untuk dilaporkan ke UP3"
          >
            <FileText className="w-4 h-4" />
            <span>Unduh PDF (UP3)</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-sm shadow-emerald-500/20"
            title="Ekspor ke format Excel/CSV"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Ekspor CSV</span>
          </button>
          <button
            onClick={() => {
              if (currentUser && !canEditModule(currentUser, 'saidi')) {
                alert('Akses Dibatasi: Admin Teknik hanya dapat entri & edit data untuk modul ROW dan Inspeksi.');
                return;
              }
              setEditingSaidi(null);
              setIsModalOpen(true);
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-sm shadow-blue-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>+ Input SAIDI/SAIFI & ENS</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 bg-white border border-slate-200 shadow-sm rounded-2xl">
          <span className="text-[10px] font-bold uppercase text-emerald-600 tracking-wider">KERUGIAN ENS (RUPIAH)</span>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">
            Rp {totalRupiah.toLocaleString('id-ID')}
          </div>
          <span className="text-[11px] text-slate-400">Hilang @ Rp 1.444,7/kWh</span>
        </div>

        <div className="p-5 bg-white border border-slate-200 shadow-sm rounded-2xl">
          <span className="text-[10px] font-bold uppercase text-amber-600 tracking-wider">ENS KUMULATIF (KWH)</span>
          <div className="text-2xl font-extrabold text-amber-600 mt-1">
            {totalEnsKwh.toLocaleString('id-ID')} <span className="text-xs font-semibold">kWh</span>
          </div>
          <span className="text-[11px] text-slate-400">Energi Tidak Tersalurkan</span>
        </div>

        <div className="p-5 bg-white border border-slate-200 shadow-sm rounded-2xl">
          <span className="text-[10px] font-bold uppercase text-blue-600 tracking-wider">SAIDI KUMULATIF</span>
          <div className="text-2xl font-extrabold text-blue-600 mt-1">
            {avgSaidi} <span className="text-xs font-semibold">Jam/Plg</span>
          </div>
          <span className="text-[11px] text-slate-400">Rata-rata Durasi Padam</span>
        </div>

        <div className="p-5 bg-white border border-slate-200 shadow-sm rounded-2xl">
          <span className="text-[10px] font-bold uppercase text-purple-600 tracking-wider">SAIFI KUMULATIF</span>
          <div className="text-2xl font-extrabold text-purple-600 mt-1">
            {avgSaifi} <span className="text-xs font-semibold">Kali/Plg</span>
          </div>
          <span className="text-[11px] text-slate-400">Rata-rata Frekuensi Padam</span>
        </div>
      </div>

      {/* GRAFIK BATANG PERBANDINGAN SAIDI & SAIFI 12 BULAN TERAKHIR */}
      <div className="p-5 bg-white border border-slate-200 shadow-sm rounded-2xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">
                  Grafik Batang Perbandingan SAIDI & SAIFI Bulanan (12 Bulan)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Analisis tren keandalan jaringan 12 bulan terakhir (Tahun {selectedYear}): Perbandingan Target vs Realisasi
                </p>
              </div>
            </div>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl self-start lg:self-auto text-xs font-bold">
            <button
              type="button"
              onClick={() => setChartMetricMode('saidi')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                chartMetricMode === 'saidi'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              Mode SAIDI (Jam)
            </button>
            <button
              type="button"
              onClick={() => setChartMetricMode('saifi')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                chartMetricMode === 'saifi'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              Mode SAIFI (Kali)
            </button>
            <button
              type="button"
              onClick={() => setChartMetricMode('both')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                chartMetricMode === 'both'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              Semua Realisasi
            </button>
          </div>
        </div>

        {/* Highlight Summary Stats for 12 Months */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl">
            <span className="text-[10px] text-blue-600 font-bold uppercase block">Rata-Rata Realisasi SAIDI</span>
            <span className="text-lg font-black text-blue-900 font-mono">{avgSaidi}</span>
            <span className="text-[10px] text-slate-500 block">Jam / Pelanggan</span>
          </div>
          <div className="p-3 bg-purple-50/70 border border-purple-100 rounded-xl">
            <span className="text-[10px] text-purple-600 font-bold uppercase block">Rata-Rata Realisasi SAIFI</span>
            <span className="text-lg font-black text-purple-900 font-mono">{avgSaifi}</span>
            <span className="text-[10px] text-slate-500 block">Kali / Pelanggan</span>
          </div>
          <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl">
            <span className="text-[10px] text-emerald-600 font-bold uppercase block">Status Keandalan</span>
            <span className="text-sm font-extrabold text-emerald-800 flex items-center gap-1 mt-1">
              ✓ Sesuai Target UP3
            </span>
            <span className="text-[10px] text-slate-500 block">Realisasi di bawah ambang target</span>
          </div>
          <div className="p-3 bg-amber-50/70 border border-amber-100 rounded-xl">
            <span className="text-[10px] text-amber-700 font-bold uppercase block">Bulan SAIDI Tertinggi</span>
            <span className="text-sm font-extrabold text-amber-900">
              {(() => {
                if (saidiFiltered.length === 0) return '-';
                const highest = [...saidiFiltered].sort((a, b) => (b.realisasiSaidi || 0) - (a.realisasiSaidi || 0))[0];
                return `${highest.bulan} (${highest.realisasiSaidi.toFixed(3)} Jam)`;
              })()}
            </span>
            <span className="text-[10px] text-slate-500 block">Puncak tren gangguan</span>
          </div>
        </div>

        {/* Recharts Bar Chart Container */}
        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyChartData} margin={{ top: 15, right: 15, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="bulanShort" stroke="#64748b" fontSize={11} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
              <Tooltip content={<CustomSaidiSaifiTooltip />} />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />

              {chartMetricMode === 'saidi' && (
                <>
                  <Bar
                    dataKey="targetSaidi"
                    name="Target SAIDI (Jam)"
                    fill="#cbd5e1"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={28}
                  />
                  <Bar
                    dataKey="realisasiSaidi"
                    name="Realisasi SAIDI (Jam)"
                    fill="#2563eb"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={28}
                  />
                </>
              )}

              {chartMetricMode === 'saifi' && (
                <>
                  <Bar
                    dataKey="targetSaifi"
                    name="Target SAIFI (Kali)"
                    fill="#e2e8f0"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={28}
                  />
                  <Bar
                    dataKey="realisasiSaifi"
                    name="Realisasi SAIFI (Kali)"
                    fill="#9333ea"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={28}
                  />
                </>
              )}

              {chartMetricMode === 'both' && (
                <>
                  <Bar
                    dataKey="realisasiSaidi"
                    name="Realisasi SAIDI (Jam/Plg)"
                    fill="#2563eb"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={28}
                  />
                  <Bar
                    dataKey="realisasiSaifi"
                    name="Realisasi SAIFI (Kali/Plg)"
                    fill="#9333ea"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={28}
                  />
                </>
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 p-5 bg-white border border-slate-200 shadow-sm rounded-2xl space-y-3">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Diagram Bar ENS Kumulatif per Penyulang (kWh & Juta Rp)
          </h3>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }} />
                <Bar dataKey="ens" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-5 bg-white border border-slate-200 shadow-sm rounded-2xl space-y-3">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Diagram Pie Kontribusi ENS (kWh)
          </h3>
          <div className="h-56 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={4} dataKey="value">
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider">
              TABEL REALISASI SAIDI, SAIFI & ESTIMASI KERUGIAN ENS
            </h3>
            <span className="text-xs text-slate-400 font-medium">Tahun {selectedYear}</span>
          </div>

          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari berdasarkan bulan atau catatan..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs text-slate-800">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[11px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3.5">Bulan</th>
                <th className="px-4 py-3.5 text-right">ENS (kWh)</th>
                <th className="px-4 py-3.5 text-right">Target SAIDI</th>
                <th className="px-4 py-3.5 text-right">Realisasi SAIDI</th>
                <th className="px-4 py-3.5 text-right">Target SAIFI</th>
                <th className="px-4 py-3.5 text-right">Realisasi SAIFI</th>
                <th className="px-4 py-3.5 text-right">Kerugian (Rupiah)</th>
                <th className="px-4 py-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400 font-medium">
                    <Search className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    Belum ada rekapan SAIDI / SAIFI yang sesuai filter.
                  </td>
                </tr>
              ) : (
                filteredList.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3.5 font-bold text-slate-900">{s.bulan} {s.tahun}</td>
                    <td className="px-4 py-3.5 text-right font-mono font-bold text-amber-700">
                      {s.ensKumulatifKwh.toLocaleString('id-ID')}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono text-slate-500">{s.targetSaidi.toFixed(3)}</td>
                    <td className="px-4 py-3.5 text-right font-mono font-bold text-blue-600">{s.realisasiSaidi.toFixed(3)}</td>
                    <td className="px-4 py-3.5 text-right font-mono text-slate-500">{s.targetSaifi.toFixed(3)}</td>
                    <td className="px-4 py-3.5 text-right font-mono font-bold text-purple-600">{s.realisasiSaifi.toFixed(3)}</td>
                    <td className="px-4 py-3.5 text-right font-mono font-bold text-emerald-700">
                      Rp {s.estimasiKerugianRp.toLocaleString('id-ID')}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => {
                            setEditingSaidi(s);
                            setIsModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                          title="Edit SAIDI/SAIFI"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteSaidi(s.id)}
                          className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                          title="Hapus SAIDI/SAIFI"
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

      <InputSaidiModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingSaidi(null);
        }}
        onSave={onAddSaidi}
        editItem={editingSaidi}
      />

      <PptExportModal
        isOpen={isPptModalOpen}
        onClose={() => setIsPptModalOpen(false)}
        exportData={pptExportData}
      />
    </div>
  );
};
