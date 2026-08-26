import React, { useState } from 'react';
import {
  Activity,
  Building2,
  Plus,
  Search,
  Download,
  FileSpreadsheet,
  Trash2,
  Edit2,
  Zap,
  TrendingUp,
  PieChart,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Gauge,
  Sliders,
  Calendar,
  UserCheck,
  MapPin,
  Layers,
  ArrowUpDown,
  LineChart as LineChartIcon,
  Calculator
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  ReferenceLine
} from 'recharts';
import { PengukuranGardu, MasterGardu, Penyulang, User } from '../../types';
import { canEditData } from '../../utils/permissions';
import { MasterGarduModal } from '../modals/MasterGarduModal';
import { PengukuranGarduModal } from '../modals/PengukuranGarduModal';
import { ImportGarduModal } from '../modals/ImportGarduModal';
import { ImportPengukuranModal } from '../modals/ImportPengukuranModal';
import { KalkulatorPembebananModal } from '../modals/KalkulatorPembebananModal';
import { PetaGarduView } from './PetaGarduView';
import { RiwayatPembebananGarduChart } from './RiwayatPembebananGarduChart';
import { TableSkeletonLoader } from '../common/TableSkeletonLoader';

interface PengukuranGarduViewProps {
  currentUser?: User | null;
  pengukuranList: PengukuranGardu[];
  masterGarduList: MasterGardu[];
  penyulangList: Penyulang[];
  onAddPengukuran: (pkg: PengukuranGardu) => void;
  onDeletePengukuran: (id: string) => void;
  onAddGardu: (g: MasterGardu) => void;
  onDeleteGardu: (id: string) => void;
  onDeleteAllGardu?: () => void;
  onDeleteAllPengukuran?: () => void;
  onImportGardu?: (items: MasterGardu[]) => void;
  onImportPengukuran?: (items: PengukuranGardu[]) => void;
  isLoading?: boolean;
}

export const PengukuranGarduView: React.FC<PengukuranGarduViewProps> = ({
  currentUser,
  pengukuranList,
  masterGarduList,
  penyulangList,
  onAddPengukuran,
  onDeletePengukuran,
  onAddGardu,
  onDeleteGardu,
  onDeleteAllGardu,
  onDeleteAllPengukuran,
  onImportGardu,
  onImportPengukuran,
  isLoading = false
}) => {
  const [activeTab, setActiveTab] = useState<'pengukuran' | 'monitoring' | 'master_gardu' | 'tren_beban' | 'peta_gardu' | 'beban_vs_kapasitas'>('pengukuran');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterUnit, setFilterUnit] = useState<string>('ALL');
  const [filterPenyulang, setFilterPenyulang] = useState<string>('ALL');
  const [filterStatusBeban, setFilterStatusBeban] = useState<string>('ALL');
  const [filterKeseimbangan, setFilterKeseimbangan] = useState<string>('ALL');
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  // Modals state
  const [isPengukuranModalOpen, setIsPengukuranModalOpen] = useState(false);
  const [editingPengukuran, setEditingPengukuran] = useState<PengukuranGardu | null>(null);
  const [isImportPengukuranModalOpen, setIsImportPengukuranModalOpen] = useState(false);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);

  const [isGarduModalOpen, setIsGarduModalOpen] = useState(false);
  const [editingGardu, setEditingGardu] = useState<MasterGardu | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isConfirmDeleteAllOpen, setIsConfirmDeleteAllOpen] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [deleteConfirmPengukuran, setDeleteConfirmPengukuran] = useState<PengukuranGardu | null>(null);
  const [deleteConfirmGardu, setDeleteConfirmGardu] = useState<MasterGardu | null>(null);
  const [isConfirmDeleteAllPengukuranOpen, setIsConfirmDeleteAllPengukuranOpen] = useState(false);

  // Chart state
  const [selectedGarduChart, setSelectedGarduChart] = useState<string>('ALL');

  const canEdit = currentUser ? canEditData(currentUser) : true;

  // Helper calculations for a single Pengukuran record
  const calculateMetrics = (p: PengukuranGardu) => {
    const dayaKva = p.dayaKva || 160;
    // In = Daya(kVA) * 1000 / (sqrt(3) * 400)
    const iNominal = (dayaKva * 1000) / (Math.sqrt(3) * 400);
    const iMax = Math.max(p.iRTotal || 0, p.iSTotal || 0, p.iTTotal || 0);
    const iAvg = ((p.iRTotal || 0) + (p.iSTotal || 0) + (p.iTTotal || 0)) / 3;
    const vAvg = ((p.vRN || 220) + (p.vSN || 220) + (p.vTN || 220)) / 3;
    const pfAvg = ((p.tpfR || 0.92) + (p.tpfS || 0.92) + (p.tpfT || 0.92)) / 3;

    // Load Percentage
    const loadingPct = iNominal > 0 ? (iMax / iNominal) * 100 : 0;

    // Apparent & Active Power
    const dayaPakaiKva = (Math.sqrt(3) * vAvg * iAvg) / 1000;
    const dayaPakaiKw = dayaPakaiKva * pfAvg;

    // Status Beban Category
    let statusBebanGroup: 'Under Load' | 'Normal' | 'Overload' | 'Critical' = 'Normal';
    let statusBebanSub = '40%-60%';

    if (loadingPct === 0) {
      statusBebanGroup = 'Under Load';
      statusBebanSub = '0%';
    } else if (loadingPct > 0 && loadingPct <= 20) {
      statusBebanGroup = 'Under Load';
      statusBebanSub = '0%-20%';
    } else if (loadingPct > 20 && loadingPct <= 40) {
      statusBebanGroup = 'Under Load';
      statusBebanSub = '20%-40%';
    } else if (loadingPct > 40 && loadingPct <= 60) {
      statusBebanGroup = 'Normal';
      statusBebanSub = '40%-60%';
    } else if (loadingPct > 60 && loadingPct <= 80) {
      statusBebanGroup = 'Normal';
      statusBebanSub = '60%-80%';
    } else if (loadingPct > 80 && loadingPct <= 100) {
      statusBebanGroup = 'Overload';
      statusBebanSub = '80%-100%';
    } else {
      statusBebanGroup = 'Critical';
      statusBebanSub = '> 100%';
    }

    // Keseimbangan Beban (Unbalance %)
    const devR = Math.abs((p.iRTotal || 0) - iAvg);
    const devS = Math.abs((p.iSTotal || 0) - iAvg);
    const devT = Math.abs((p.iTTotal || 0) - iAvg);
    const maxDev = Math.max(devR, devS, devT);
    const unbalancePct = iAvg > 0 ? (maxDev / iAvg) * 100 : 0;

    const isSeimbang = unbalancePct < 10;

    return {
      iNominal,
      iMax,
      iAvg,
      vAvg,
      pfAvg,
      loadingPct,
      dayaPakaiKva,
      dayaPakaiKw,
      statusBebanGroup,
      statusBebanSub,
      unbalancePct,
      isSeimbang
    };
  };

  // Filter Pengukuran List
  const filteredPengukuran = pengukuranList.filter((p) => {
    const metrics = calculateMetrics(p);
    const matchesSearch =
      (p.noGardu || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.penyulang || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.petugas || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.unit || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.alamat || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesUnit = filterUnit === 'ALL' || (p.unit || 'ULP Baguala') === filterUnit;
    const matchesPenyulang = filterPenyulang === 'ALL' || p.penyulang === filterPenyulang;
    const matchesStatusBeban =
      filterStatusBeban === 'ALL' ||
      metrics.statusBebanGroup === filterStatusBeban ||
      metrics.statusBebanSub === filterStatusBeban;

    const matchesKeseimbangan =
      filterKeseimbangan === 'ALL' ||
      (filterKeseimbangan === 'SEIMBANG' && metrics.isSeimbang) ||
      (filterKeseimbangan === 'TIDAK_SEIMBANG' && !metrics.isSeimbang);

    return matchesSearch && matchesUnit && matchesPenyulang && matchesStatusBeban && matchesKeseimbangan;
  });

  // Filter Master Gardu
  const filteredGardu = masterGarduList.filter((g) => {
    const matchesSearch =
      (g.noBaru || g.noGarduBaru || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (g.noGarduLama || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (g.penyulang || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (g.alamat || g.alamatGardu || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (g.status || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(g.thnOperasi || g.tahunOperasi || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesUnit = filterUnit === 'ALL' || (g.unit || 'ULP Baguala') === filterUnit;
    const matchesPenyulang = filterPenyulang === 'ALL' || g.penyulang === filterPenyulang;

    return matchesSearch && matchesUnit && matchesPenyulang;
  });

  // Summary Counters for Analytics Dashboard
  const totalMeasurements = pengukuranList.length;
  let countUnder0 = 0, countUnder0_20 = 0, countUnder20_40 = 0;
  let countNormal40_60 = 0, countNormal60_80 = 0;
  let countOverload80_100 = 0;
  let countCriticalOver100 = 0;

  let countSeimbangUnder10 = 0;
  let countTidakSeimbangOver10 = 0;

  pengukuranList.forEach((p) => {
    const m = calculateMetrics(p);
    if (m.loadingPct === 0) countUnder0++;
    else if (m.loadingPct <= 20) countUnder0_20++;
    else if (m.loadingPct <= 40) countUnder20_40++;
    else if (m.loadingPct <= 60) countNormal40_60++;
    else if (m.loadingPct <= 80) countNormal60_80++;
    else if (m.loadingPct <= 100) countOverload80_100++;
    else countCriticalOver100++;

    if (m.isSeimbang) countSeimbangUnder10++;
    else countTidakSeimbangOver10++;
  });

  const handleExportPDF = () => {
    const doc = new jsPDF('landscape');
    doc.setFontSize(14);
    doc.text(`Data Gardu (${activeTab}) - PT PLN (Persero)`, 14, 15);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}`, 14, 22);

    let headers: string[][] = [];
    let dataRows: any[][] = [];

    if (activeTab === 'pengukuran' || activeTab === 'monitoring') {
      headers = [
        ['No Gardu', 'Penyulang', 'Daya (kVA)', 'Tanggal Ukur', 'Status Beban', 'Loading %', 'Unbalance %', 'Keseimbangan']
      ];
      dataRows = pengukuranList.map((p) => {
        const m = calculateMetrics(p);
        return [
          p.noGardu,
          p.penyulang,
          p.dayaKva,
          p.tanggalUkur,
          `${m.statusBebanGroup} (${m.statusBebanSub})`,
          `${m.loadingPct.toFixed(1)}%`,
          `${m.unbalancePct.toFixed(1)}%`,
          m.isSeimbang ? 'Seimbang <10%' : 'Tidak Seimbang >=10%'
        ];
      });
    } else {
      headers = [
        ['NO baru', 'NO GARDU lama', 'ALAMAT', 'PENYULANG', 'DAYA', 'PHASE', 'STATUS', 'AKTIF', 'LATITUDE', 'LONGITUDE', 'THNOPERASI']
      ];
      dataRows = masterGarduList.map((g) => [
        g.noBaru || g.noGarduBaru || '-',
        g.noGarduLama || '-',
        g.alamat || g.alamatGardu || '-',
        g.penyulang || '-',
        `${g.daya || 0} kVA`,
        g.phase || g.jumlahFasa || '3 Fasa',
        g.status || 'Operasi',
        String(g.aktif ?? 'Aktif'),
        g.latitude ?? g.latt ?? '-',
        g.longitude ?? g.long ?? '-',
        g.thnOperasi || g.tahunOperasi || '-'
      ]);
    }

    autoTable(doc, {
      head: headers,
      body: dataRows,
      startY: 28,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });

    doc.save(`Data_Gardu_${activeTab}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // Export CSV Helper
  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    if (activeTab === 'pengukuran' || activeTab === 'monitoring') {
      csvContent += "No Gardu,Penyulang,Daya (kVA),Tanggal Ukur,Petugas,I R,I S,I T,I N,V RN,V SN,V TN,Status Beban,Loading %,Unbalance %,Keseimbangan\n";
      pengukuranList.forEach((p) => {
        const m = calculateMetrics(p);
        csvContent += `"${p.noGardu}","${p.penyulang}",${p.dayaKva},"${p.tanggalUkur}","${p.petugas}",${p.iRTotal},${p.iSTotal},${p.iTTotal},${p.iNTotal},${p.vRN},${p.vSN},${p.vTN},"${m.statusBebanGroup} (${m.statusBebanSub})",${m.loadingPct.toFixed(1)}%,${m.unbalancePct.toFixed(1)}%,"${m.isSeimbang ? 'Seimbang <10%' : 'Tidak Seimbang >=10%'}"\n`;
      });
    } else {
      csvContent += "NO baru,NO GARDU lama,ALAMAT,PENYULANG,DAYA,PHASE,STATUS,AKTIF,LATITUDE,LONGITUDE,THNOPERASI\n";
      masterGarduList.forEach((g) => {
        csvContent += `"${g.noBaru || g.noGarduBaru || ''}","${g.noGarduLama || ''}","${g.alamat || g.alamatGardu || ''}","${g.penyulang || ''}",${g.daya || ''},"${g.phase || g.jumlahFasa || '3 Fasa'}","${g.status || 'Operasi'}","${g.aktif ?? 'Aktif'}",${g.latitude ?? g.latt ?? ''},${g.longitude ?? g.long ?? ''},${g.thnOperasi || g.tahunOperasi || ''}\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Data_Gardu_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // List of unique gardu numbers for the chart dropdown
  const uniqueGarduList = Array.from(new Set(pengukuranList.map(p => p.noGardu))).sort();

  // Selected gardu data for chart
  const chartData = selectedGarduChart !== 'ALL'
    ? pengukuranList
        .filter(p => p.noGardu === selectedGarduChart)
        .sort((a, b) => new Date(a.tanggalUkur).getTime() - new Date(b.tanggalUkur).getTime())
        .map(p => ({
          tanggal: p.tanggalUkur,
          'Arus R (A)': p.iRTotal || 0,
          'Arus S (A)': p.iSTotal || 0,
          'Arus T (A)': p.iTTotal || 0,
          'Arus N (A)': p.iNTotal || 0
        }))
    : [];

  return (
    <div className="p-4 md:p-6 space-y-6 bg-slate-50 text-slate-900 font-sans min-h-screen">
      
      {/* Top Banner Header */}
      {/* HEADER BANNER */}
      <div className="bg-gradient-to-r from-[#022623] via-[#044c45] to-[#022e2a] rounded-2xl p-6 text-white shadow-2xl border-2 border-teal-500/60 flex flex-col gap-5 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-start gap-4 z-10">
          <div className="p-3 bg-teal-950/80 rounded-xl text-teal-300 border border-teal-500/40 shrink-0 shadow-inner">
            <Gauge className="w-8 h-8 text-amber-300" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-white flex flex-wrap items-center gap-2 drop-shadow-xs">
              <span>PENGUKURAN &amp; MONITORING BEBAN GARDU DISTRIBUSI</span>
              <span className="px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 text-[10px] font-bold border border-teal-500/40">
                ULP BAGUALA
              </span>
            </h1>
            <p className="text-xs text-teal-100/90 mt-1 max-w-4xl leading-relaxed">
              Kelola master data gardu, pengukuran arus/tegangan/THD/PF, serta monitoring status beban (Underload, Normal, Overload, Critical) &amp; Keseimbangan Beban Trafo.
            </p>
          </div>
        </div>

        {/* Action Buttons - Positioned neatly below title and description */}
        <div className="pt-4 border-t border-teal-500/30 flex flex-wrap items-center gap-2.5 z-10">
          <button
            onClick={handleExportPDF}
            className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all border border-rose-500 flex items-center gap-2 cursor-pointer shadow-sm active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>Export PDF</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl bg-[#012521] hover:bg-[#02312b] text-teal-200 text-xs font-bold transition-all border border-teal-500/50 flex items-center gap-2 cursor-pointer shadow-sm active:scale-95"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Export CSV / Excel</span>
          </button>

          <button
            onClick={() => setIsCalculatorOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black transition-all shadow-md shadow-amber-500/20 flex items-center gap-2 cursor-pointer border border-amber-300 active:scale-95"
            title="Kalkulator Cepat Pembebanan Trafo"
          >
            <Calculator className="w-4 h-4 text-slate-950" />
            <span>Kalkulator Pembebanan</span>
          </button>

          {activeTab === 'master_gardu' ? (
            <div className="flex flex-wrap items-center gap-2.5">
              {canEdit && (
                <button
                  onClick={() => setIsConfirmDeleteAllOpen(true)}
                  disabled={masterGarduList.length === 0}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-xs ${
                    masterGarduList.length === 0
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                      : 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20 cursor-pointer border border-rose-600 active:scale-95'
                  }`}
                  title="Hapus seluruh master data gardu / trafo"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Hapus Semua Data Trafo</span>
                </button>
              )}
              <button
                onClick={() => setIsImportModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20 flex items-center gap-2 cursor-pointer border border-emerald-500 active:scale-95"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Import Excel Gardu</span>
              </button>
              <button
                onClick={() => {
                  setEditingGardu(null);
                  setIsGarduModalOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-teal-400 to-emerald-400 hover:from-teal-300 hover:to-emerald-300 text-slate-950 text-xs font-black transition-all shadow-lg shadow-teal-950/30 flex items-center gap-2 cursor-pointer border border-teal-200 active:scale-95"
              >
                <Plus className="w-4 h-4 text-slate-950" />
                <span>Tambah Master Gardu</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2.5">
              {onDeleteAllPengukuran && (
                <button
                  onClick={() => setIsConfirmDeleteAllPengukuranOpen(true)}
                  disabled={pengukuranList.length === 0}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-xs ${
                    pengukuranList.length === 0
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                      : 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20 cursor-pointer border border-rose-600'
                  }`}
                  title="Hapus seluruh histori pengukuran gardu"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Hapus Semua Pengukuran</span>
                </button>
              )}
              <button
                onClick={() => setIsImportPengukuranModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20 flex items-center gap-2 cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Import Excel Pengukuran</span>
              </button>
              <button
                onClick={() => {
                  setEditingPengukuran(null);
                  setIsPengukuranModalOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Input Pengukuran Gardu</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tabs Header Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab('pengukuran')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'pengukuran'
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Histori Pengukuran Gardu ({pengukuranList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('monitoring')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'monitoring'
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Monitoring Beban & Keseimbangan Trafo</span>
          </button>

          <button
            onClick={() => setActiveTab('master_gardu')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'master_gardu'
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Master Data Gardu ({masterGarduList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('tren_beban')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'tren_beban'
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            <LineChartIcon className="w-4 h-4" />
            <span>Tren Beban Gardu</span>
          </button>

          <button
            onClick={() => setActiveTab('peta_gardu')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'peta_gardu'
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            <MapPin className="w-4 h-4 text-rose-500" />
            <span>Peta Lokasi Gardu ({masterGarduList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('beban_vs_kapasitas')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'beban_vs_kapasitas'
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            <PieChart className="w-4 h-4 text-amber-500" />
            <span>Beban vs Kapasitas Trafo</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Cari gardu, penyulang..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
          />
        </div>
      </div>

      {/* SUMMARY STATUS METRICS CARDS (Always visible for fast diagnosis) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {/* Underload 0% */}
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-500 uppercase">Under 0%</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-lg font-black text-slate-700">{countUnder0}</span>
            <span className="text-[9px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">Underload</span>
          </div>
        </div>

        {/* Underload 0-20% */}
        <div className="bg-white p-3 rounded-xl border border-sky-200 bg-sky-50/30 shadow-2xs flex flex-col justify-between">
          <span className="text-[10px] font-bold text-sky-800 uppercase">0% - 20%</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-lg font-black text-sky-700">{countUnder0_20}</span>
            <span className="text-[9px] font-bold px-1.5 py-0.5 bg-sky-100 text-sky-800 rounded">Underload</span>
          </div>
        </div>

        {/* Underload 20-40% */}
        <div className="bg-white p-3 rounded-xl border border-cyan-200 bg-cyan-50/30 shadow-2xs flex flex-col justify-between">
          <span className="text-[10px] font-bold text-cyan-800 uppercase">20% - 40%</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-lg font-black text-cyan-700">{countUnder20_40}</span>
            <span className="text-[9px] font-bold px-1.5 py-0.5 bg-cyan-100 text-cyan-800 rounded">Underload</span>
          </div>
        </div>

        {/* Normal 40-60% */}
        <div className="bg-white p-3 rounded-xl border border-emerald-200 bg-emerald-50/30 shadow-2xs flex flex-col justify-between">
          <span className="text-[10px] font-bold text-emerald-800 uppercase">40% - 60%</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-lg font-black text-emerald-700">{countNormal40_60}</span>
            <span className="text-[9px] font-bold px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded">Normal</span>
          </div>
        </div>

        {/* Normal 60-80% */}
        <div className="bg-white p-3 rounded-xl border border-teal-200 bg-teal-50/30 shadow-2xs flex flex-col justify-between">
          <span className="text-[10px] font-bold text-teal-800 uppercase">60% - 80%</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-lg font-black text-teal-700">{countNormal60_80}</span>
            <span className="text-[9px] font-bold px-1.5 py-0.5 bg-teal-100 text-teal-800 rounded">Normal</span>
          </div>
        </div>

        {/* Overload 80-100% */}
        <div className="bg-white p-3 rounded-xl border border-amber-200 bg-amber-50/30 shadow-2xs flex flex-col justify-between">
          <span className="text-[10px] font-bold text-amber-800 uppercase">80% - 100%</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-lg font-black text-amber-700">{countOverload80_100}</span>
            <span className="text-[9px] font-bold px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded">Overload</span>
          </div>
        </div>

        {/* Critical >100% */}
        <div className="bg-white p-3 rounded-xl border border-rose-300 bg-rose-50/40 shadow-2xs flex flex-col justify-between">
          <span className="text-[10px] font-bold text-rose-800 uppercase">&gt; 100%</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-lg font-black text-rose-700">{countCriticalOver100}</span>
            <span className="text-[9px] font-bold px-1.5 py-0.5 bg-rose-100 text-rose-800 rounded">Critical</span>
          </div>
        </div>
      </div>

      {/* KESEIMBANGAN SUMMARY BADGES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500 text-white rounded-xl shadow-xs">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-emerald-900">Beban Seimbang (&lt; 10%)</h4>
              <p className="text-[11px] text-emerald-700">Deviasi antar fasa dalam ambang batas aman standar PLN</p>
            </div>
          </div>
          <span className="text-2xl font-black text-emerald-800">{countSeimbangUnder10} Gardu</span>
        </div>

        <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-500 text-white rounded-xl shadow-xs">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-rose-900">Tidak Seimbang (&ge; 10%)</h4>
              <p className="text-[11px] text-rose-700">Memerlukan penataan fasa / pemindahan beban antar jurusan</p>
            </div>
          </div>
          <span className="text-2xl font-black text-rose-800">{countTidakSeimbangOver10} Gardu</span>
        </div>
      </div>

      {/* TAB 1: HISTORI PENGUKURAN GARDU TABLE */}
      {activeTab === 'pengukuran' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-600" />
              <span>Daftar Histori Pengukuran Gardu ({filteredPengukuran.length})</span>
            </h3>

            {/* Filters */}
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={filterUnit}
                onChange={(e) => setFilterUnit(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold bg-white text-slate-800"
              >
                <option value="ALL">Semua Unit PLN</option>
                <option value="ULP Baguala">ULP Baguala</option>
                <option value="PLN Nusa Daya">PLN Nusa Daya</option>
                <option value="UP3">UP3</option>
                <option value="UIW">UIW</option>
                <option value="PLN">PLN</option>
              </select>

              <select
                value={filterPenyulang}
                onChange={(e) => setFilterPenyulang(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold bg-white text-slate-800"
              >
                <option value="ALL">Semua Penyulang</option>
                {penyulangList.map((p) => (
                  <option key={p.id} value={p.namaPenyulang}>{p.namaPenyulang}</option>
                ))}
              </select>

              <select
                value={filterStatusBeban}
                onChange={(e) => setFilterStatusBeban(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold bg-white"
              >
                <option value="ALL">Semua Status Beban</option>
                <option value="Under Load">Under Load (&le; 40%)</option>
                <option value="Normal">Normal (40% - 80%)</option>
                <option value="Overload">Overload (80% - 100%)</option>
                <option value="Critical">Critical (&gt; 100%)</option>
              </select>
            </div>
          </div>

          {isLoading ? (
            <TableSkeletonLoader columns={8} rows={7} headerTitle="Data Pengukuran Beban Gardu" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
              <thead className="bg-slate-100 text-slate-700 uppercase text-[10px] font-black tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3">No. Gardu</th>
                  <th className="py-3 px-3">Tgl Ukur &amp; Petugas</th>
                  <th className="py-3 px-3">Penyulang &amp; Daya</th>
                  <th className="py-3 px-3 text-center bg-blue-50/50">I (R/S/T/N) Total</th>
                  <th className="py-3 px-3 text-center bg-emerald-50/50">V Phasa (R-N, S-N, T-N)</th>
                  <th className="py-3 px-3 text-center">Status Beban</th>
                  <th className="py-3 px-3 text-center">Keseimbangan</th>
                  <th className="py-3 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800">
                {filteredPengukuran.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400 font-medium">
                      Tidak ada data pengukuran gardu ditemukan.
                    </td>
                  </tr>
                ) : (
                  filteredPengukuran.map((p) => {
                    const m = calculateMetrics(p);
                    return (
                      <React.Fragment key={p.id}>
                      <tr className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3 font-bold text-blue-900">
                          {p.noGardu}
                          <div className="text-[10px] font-normal text-slate-500 truncate max-w-[140px]">
                            {p.alamat || '-'}
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-semibold text-slate-900">{p.tanggalUkur}</div>
                          <div className="text-[10px] text-slate-500">{p.petugas}</div>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-bold text-slate-800">{p.penyulang}</span>
                          <div className="text-[10px] font-bold text-blue-700">{p.dayaKva} kVA</div>
                        </td>
                        <td className="py-3 px-3 bg-blue-50/30 text-center font-bold">
                          <span className="text-blue-700">{p.iRTotal}</span> / {' '}
                          <span className="text-yellow-700">{p.iSTotal}</span> / {' '}
                          <span className="text-rose-700">{p.iTTotal}</span> | {' '}
                          <span className="text-slate-600">N: {p.iNTotal}A</span>
                        </td>
                        <td className="py-3 px-3 bg-emerald-50/30 text-center font-medium">
                          {p.vRN}V / {p.vSN}V / {p.vTN}V
                        </td>
                        <td className="py-3 px-3 text-center">
                          <div className="inline-flex flex-col items-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                              m.statusBebanGroup === 'Under Load'
                                ? 'bg-sky-100 text-sky-800 border border-sky-300'
                                : m.statusBebanGroup === 'Normal'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : m.statusBebanGroup === 'Overload'
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : 'bg-rose-100 text-rose-800 border border-rose-300'
                            }`}>
                              {m.statusBebanGroup} ({m.statusBebanSub})
                            </span>
                            <span className="text-[10px] font-bold text-slate-600 mt-0.5">
                              {m.loadingPct.toFixed(1)}% Loading
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            m.isSeimbang
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {m.isSeimbang ? 'Seimbang (<10%)' : 'Tidak Seimbang (≥10%)'}
                          </span>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            Unbalance: {m.unbalancePct.toFixed(1)}%
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setSelectedGarduChart(p.noGardu);
                                setActiveTab('tren_beban');
                              }}
                              className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition-all flex items-center gap-1 cursor-pointer"
                              title="Lihat riwayat dan grafik tren pembebanan trafo ini"
                            >
                              <LineChartIcon className="w-3.5 h-3.5 text-amber-600" />
                              <span>Tren Beban</span>
                            </button>
                            <button
                              onClick={() => setExpandedRowId(expandedRowId === p.id ? null : p.id)}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                                expandedRowId === p.id
                                  ? 'bg-blue-600 text-white shadow-xs'
                                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                              }`}
                              title="Tampilkan detail pengukuran sampai jurusan 1 s/d 4"
                            >
                              <span>{expandedRowId === p.id ? 'Tutup Jurusan' : 'Jurusan 1-4'}</span>
                            </button>
                            <button
                              onClick={() => {
                                setEditingPengukuran(p);
                                setIsPengukuranModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-slate-100 transition-colors cursor-pointer"
                              title="Edit"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirmPengukuran(p)}
                              className="p-1.5 rounded-lg text-slate-600 hover:text-rose-600 hover:bg-slate-100 transition-colors cursor-pointer"
                              title="Hapus"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {expandedRowId === p.id && (
                        <tr className="bg-slate-50/90 border-b border-slate-200">
                          <td colSpan={8} className="p-4">
                            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm space-y-4">
                              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                <div className="flex items-center gap-2">
                                  <div className="w-2.5 h-2.5 rounded-full bg-blue-600"></div>
                                  <h4 className="font-extrabold text-xs text-slate-900 uppercase tracking-wide">
                                    Rincian Lengkap Pengukuran Gardu: {p.noGardu} ({p.penyulang} - {p.dayaKva} kVA)
                                  </h4>
                                </div>
                                <span className="text-[10px] font-bold text-slate-500">
                                  Jam Ukur: {p.jamUkur || '09:30'} | Petugas: {p.petugas}
                                </span>
                              </div>

                              {/* Total Trafo & Parameter Utama */}
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                                  <span className="text-[10px] font-bold text-blue-700 uppercase">Arus Total (Ampere)</span>
                                  <div className="grid grid-cols-4 gap-1 mt-1 text-center font-bold text-xs">
                                    <div className="bg-white p-1 rounded"><span className="text-[9px] text-slate-400 block">R</span>{p.iRTotal}A</div>
                                    <div className="bg-white p-1 rounded"><span className="text-[9px] text-slate-400 block">S</span>{p.iSTotal}A</div>
                                    <div className="bg-white p-1 rounded"><span className="text-[9px] text-slate-400 block">T</span>{p.iTTotal}A</div>
                                    <div className="bg-white p-1 rounded"><span className="text-[9px] text-slate-400 block">N</span>{p.iNTotal}A</div>
                                  </div>
                                </div>

                                <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
                                  <span className="text-[10px] font-bold text-emerald-700 uppercase">Tegangan (Volt)</span>
                                  <div className="grid grid-cols-3 gap-1 mt-1 text-center font-bold text-xs">
                                    <div className="bg-white p-1 rounded"><span className="text-[9px] text-slate-400 block">R-N</span>{p.vRN}V</div>
                                    <div className="bg-white p-1 rounded"><span className="text-[9px] text-slate-400 block">S-N</span>{p.vSN}V</div>
                                    <div className="bg-white p-1 rounded"><span className="text-[9px] text-slate-400 block">T-N</span>{p.vTN}V</div>
                                  </div>
                                  <div className="grid grid-cols-3 gap-1 mt-1 text-center font-medium text-[11px] text-slate-600">
                                    <div>R-S: {p.vRS || 380}V</div>
                                    <div>S-T: {p.vST || 380}V</div>
                                    <div>R-T: {p.vRT || 380}V</div>
                                  </div>
                                </div>

                                <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-100">
                                  <span className="text-[10px] font-bold amber-700 uppercase">THD, IPEAK &amp; TPF</span>
                                  <div className="grid grid-cols-3 gap-1 mt-1 text-center text-xs font-semibold">
                                    <div className="bg-white p-1 rounded"><span className="text-[9px] text-slate-400 block">THD</span>{p.thdR || 0}%</div>
                                    <div className="bg-white p-1 rounded"><span className="text-[9px] text-slate-400 block">IPEAK</span>{p.iPeakR || 0}A</div>
                                    <div className="bg-white p-1 rounded"><span className="text-[9px] text-slate-400 block">TPF</span>{p.tpfR || 0.92}</div>
                                  </div>
                                </div>
                              </div>

                              {/* Jurusan 1 s/d 4 Grid */}
                              <div className="space-y-2 pt-2">
                                <h5 className="text-[11px] font-black text-slate-700 uppercase tracking-wide">
                                  Parameter Pengukuran Per Jurusan (Outcoming Feeder 1 s/d 4)
                                </h5>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                  {[
                                    { title: 'JURUSAN 1', data: p.jurusan1 },
                                    { title: 'JURUSAN 2', data: p.jurusan2 },
                                    { title: 'JURUSAN 3', data: p.jurusan3 },
                                    { title: 'JURUSAN 4', data: p.jurusan4 },
                                  ].map((j, idx) => (
                                    <div key={idx} className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                                      <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                                        <span className="font-extrabold text-xs text-blue-950">{j.data?.nama || j.title}</span>
                                        <span className="text-[9px] text-slate-500 truncate max-w-[100px]">{j.data?.titikUkur || `PHB-TR J-${idx+1}`}</span>
                                      </div>
                                      <div className="text-[10px] space-y-1">
                                        <div className="flex justify-between font-medium">
                                          <span className="text-slate-500">Arus (R/S/T/N):</span>
                                          <span className="font-bold text-slate-900">
                                            {j.data?.iRTotal || 0}/{j.data?.iSTotal || 0}/{j.data?.iTTotal || 0} | N:{j.data?.iNTotal || 0}A
                                          </span>
                                        </div>
                                        <div className="flex justify-between font-medium">
                                          <span className="text-slate-500">Tegangan (R/S/T-N):</span>
                                          <span className="font-bold text-slate-900">
                                            {j.data?.vRN || 220}V/{j.data?.vSN || 220}V/{j.data?.vTN || 220}V
                                          </span>
                                        </div>
                                        <div className="flex justify-between font-medium">
                                          <span className="text-slate-500">IPEAK-R / TPF:</span>
                                          <span className="font-bold text-slate-900">
                                            {j.data?.iPeakR || 0}A / {j.data?.tpfR || 0.92}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                            </div>
                          </td>
                        </tr>
                      )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          )}
        </div>
      )}

      {/* TAB 2: MONITORING BEBAN & KESEIMBANGAN DETAILED DASHBOARD */}
      {activeTab === 'monitoring' && (
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <Gauge className="w-4 h-4 text-blue-600" />
                <span>Analisis Daya Pakai & Beban per Trafo Gardu</span>
              </h3>
              <p className="text-xs text-slate-500">
                Data terhitung secara real-time berdasarkan daya nominal kVA, pengukuran arus phasa, dan tegangan jaringan.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={filterKeseimbangan}
                onChange={(e) => setFilterKeseimbangan(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold bg-white"
              >
                <option value="ALL">Semua Keseimbangan</option>
                <option value="SEIMBANG">Seimbang (&lt; 10%)</option>
                <option value="TIDAK_SEIMBANG">Tidak Seimbang (&ge; 10%)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPengukuran.map((p) => {
              const m = calculateMetrics(p);
              return (
                <div
                  key={p.id}
                  className={`bg-white rounded-2xl p-5 border shadow-2xs space-y-4 transition-all ${
                    m.loadingPct > 100
                      ? 'border-rose-400 ring-2 ring-rose-500/20'
                      : m.loadingPct > 80
                      ? 'border-amber-300'
                      : 'border-slate-200'
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                    <div>
                      <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                        {p.penyulang}
                      </span>
                      <h4 className="text-base font-black text-slate-900">{p.noGardu}</h4>
                      <p className="text-[11px] text-slate-500 line-clamp-1">{p.alamat || 'Baguala'}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-black text-slate-800">{p.dayaKva} kVA</span>
                      <div className="text-[10px] text-slate-400">{p.tanggalUkur}</div>
                    </div>
                  </div>

                  {/* Meter Loading Bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-600">Persentase Loading Beban</span>
                      <span className={`${
                        m.loadingPct > 100 ? 'text-rose-600 font-black' : m.loadingPct > 80 ? 'text-amber-600' : 'text-emerald-600'
                      }`}>
                        {m.loadingPct.toFixed(1)}%
                      </span>
                    </div>

                    <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden p-0.5 border border-slate-200">
                      <div
                        className={`h-full rounded-full transition-all ${
                          m.loadingPct > 100
                            ? 'bg-rose-500'
                            : m.loadingPct > 80
                            ? 'bg-amber-500'
                            : m.loadingPct > 40
                            ? 'bg-emerald-500'
                            : 'bg-sky-500'
                        }`}
                        style={{ width: `${Math.min(m.loadingPct, 100)}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-[9px] text-slate-400 font-medium pt-0.5">
                      <span>0%</span>
                      <span>40% (Normal)</span>
                      <span>80% (Overload)</span>
                      <span>100%+</span>
                    </div>
                  </div>

                  {/* Calculated Power Metrics */}
                  <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl text-xs">
                    <div>
                      <span className="text-[10px] font-semibold text-slate-500">Daya Semu (kVA)</span>
                      <div className="font-extrabold text-slate-900">{m.dayaPakaiKva.toFixed(1)} kVA</div>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-slate-500">Daya Aktif (kW)</span>
                      <div className="font-extrabold text-blue-700">{m.dayaPakaiKw.toFixed(1)} kW</div>
                    </div>
                  </div>

                  {/* Unbalance & Phase Current Breakdown */}
                  <div className="space-y-2 border-t border-slate-100 pt-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700">Keseimbangan Beban:</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                        m.isSeimbang ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {m.unbalancePct.toFixed(1)}% ({m.isSeimbang ? 'Seimbang <10%' : 'Tidak Seimbang >=10%'})
                      </span>
                    </div>                    <div className="grid grid-cols-4 gap-1 text-center text-[10px] font-bold">
                      <div className="bg-blue-50 p-1.5 rounded-lg text-blue-900">
                        <span className="block text-[8px] text-blue-600">Phase R</span>
                        {p.iRTotal} A
                      </div>
                      <div className="bg-yellow-50 p-1.5 rounded-lg text-yellow-900">
                        <span className="block text-[8px] text-yellow-600">Phase S</span>
                        {p.iSTotal} A
                      </div>
                      <div className="bg-rose-50 p-1.5 rounded-lg text-rose-900">
                        <span className="block text-[8px] text-rose-600">Phase T</span>
                        {p.iTTotal} A
                      </div>
                      <div className="bg-slate-100 p-1.5 rounded-lg text-slate-800">
                        <span className="block text-[8px] text-slate-500">Netral N</span>
                        {p.iNTotal} A
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedGarduChart(p.noGardu);
                        setActiveTab('tren_beban');
                      }}
                      className="w-full py-2 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-2"
                    >
                      <LineChartIcon className="w-3.5 h-3.5 text-blue-600" />
                      <span>Lihat Riwayat &amp; Grafik Tren Beban</span>
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: TREN BEBAN CHART (POWERED BY RECHARTS & RIWAYATPEMBEBANANGARDUCHART) */}
      {activeTab === 'tren_beban' && (
        <RiwayatPembebananGarduChart
          pengukuranList={pengukuranList}
          masterGarduList={masterGarduList}
          penyulangList={penyulangList}
          initialSelectedGardu={selectedGarduChart !== 'ALL' ? selectedGarduChart : undefined}
          onSelectGardu={(g) => setSelectedGarduChart(g)}
          onEditPengukuran={(p) => {
            setEditingPengukuran(p);
            setIsPengukuranModalOpen(true);
          }}
        />
      )}

      {/* TAB: BEBAN VS KAPASITAS TRAFO CHART */}
      {activeTab === 'beban_vs_kapasitas' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden space-y-6 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <PieChart className="w-5 h-5 text-amber-500" />
                <span>Visualisasi Komparasi Beban Aktual vs Kapasitas Trafo</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Monitoring real-time kapasitas nominal trafo (kVA) berbanding daya beban pakai (kVA) dan persentase loading (%) untuk setiap gardu.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600">Filter Penyulang:</span>
              <select
                value={filterPenyulang}
                onChange={(e) => setFilterPenyulang(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold bg-white text-slate-800"
              >
                <option value="ALL">Semua Penyulang</option>
                {penyulangList.map((p) => (
                  <option key={p.id} value={p.namaFeeder}>{p.namaFeeder}</option>
                ))}
              </select>
            </div>
          </div>

          {filteredPengukuran.length === 0 ? (
            <div className="h-[400px] flex items-center justify-center flex-col text-slate-500 gap-3 border-2 border-dashed border-slate-200 rounded-xl">
              <AlertTriangle className="w-12 h-12 text-amber-400" />
              <p className="text-sm font-semibold">Tidak ada data pengukuran gardu yang sesuai filter</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="h-[450px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={filteredPengukuran.map((p) => {
                      const m = calculateMetrics(p);
                      return {
                        noGardu: p.noGardu,
                        penyulang: p.penyulang,
                        'Kapasitas Trafo (kVA)': p.dayaKva,
                        'Beban Aktual (kVA)': Number(m.dayaPakaiKva.toFixed(1)),
                        'Loading (%)': Number(m.loadingPct.toFixed(1)),
                        status: m.statusBebanGroup
                      };
                    })}
                    margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="noGardu" 
                      tick={{fontSize: 10, fill: '#64748b'}} 
                      interval={0} 
                      angle={-45} 
                      textAnchor="end" 
                      height={60}
                      axisLine={{stroke: '#cbd5e1'}}
                      tickLine={false}
                    />
                    <YAxis 
                      tick={{fontSize: 11, fill: '#64748b'}} 
                      axisLine={false}
                      tickLine={false}
                      tickMargin={10}
                      label={{ value: 'Daya (kVA)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fontSize: 12, fill: '#64748b' } }}
                    />
                    <Tooltip 
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          const loading = data['Loading (%)'];
                          const statusColor = loading > 100 ? 'text-rose-600 bg-rose-50 border-rose-200' : loading > 80 ? 'text-amber-600 bg-amber-50 border-amber-200' : 'text-emerald-600 bg-emerald-50 border-emerald-200';
                          return (
                            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xl space-y-1.5 text-xs">
                              <div className="font-black text-slate-900 border-b border-slate-100 pb-1 flex items-center justify-between gap-4">
                                <span>{label}</span>
                                <span className="text-[10px] text-blue-600 font-bold">{data.penyulang}</span>
                              </div>
                              <div className="text-slate-600">Kapasitas Trafo: <b className="text-slate-900">{data['Kapasitas Trafo (kVA)']} kVA</b></div>
                              <div className="text-slate-600">Beban Aktual: <b className="text-blue-700">{data['Beban Aktual (kVA)']} kVA</b></div>
                              <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                                <span className="text-slate-500">Loading:</span>
                                <span className={`px-2 py-0.5 rounded font-black border text-[11px] ${statusColor}`}>
                                  {loading}% ({data.status})
                                </span>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '15px', fontSize: '12px' }} />
                    <Bar dataKey="Kapasitas Trafo (kVA)" fill="#3b82f6" radius={[6, 6, 0, 0]} maxBarSize={40} />
                    <Bar dataKey="Beban Aktual (kVA)" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={40}>
                      {filteredPengukuran.map((p, idx) => {
                        const m = calculateMetrics(p);
                        let fillColor = '#10b981'; // normal
                        if (m.loadingPct > 100) fillColor = '#f43f5e'; // critical
                        else if (m.loadingPct > 80) fillColor = '#f59e0b'; // overload
                        else if (m.loadingPct < 20) fillColor = '#38bdf8'; // underload
                        return <Cell key={`cell-${idx}`} fill={fillColor} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-slate-100">
                <div className="bg-blue-50/70 border border-blue-100 p-4 rounded-2xl flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500 text-white flex items-center justify-center font-black">⚡</div>
                  <div>
                    <span className="text-[11px] font-semibold text-blue-800">Total Kapasitas Trafo</span>
                    <div className="text-lg font-black text-blue-950">
                      {filteredPengukuran.reduce((acc, p) => acc + (p.dayaKva || 0), 0).toLocaleString()} kVA
                    </div>
                  </div>
                </div>

                <div className="bg-emerald-50/70 border border-emerald-100 p-4 rounded-2xl flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-black">📊</div>
                  <div>
                    <span className="text-[11px] font-semibold text-emerald-800">Total Beban Aktual</span>
                    <div className="text-lg font-black text-emerald-950">
                      {filteredPengukuran.reduce((acc, p) => acc + calculateMetrics(p).dayaPakaiKva, 0).toLocaleString(undefined, {maximumFractionDigits: 1})} kVA
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50/70 border border-amber-100 p-4 rounded-2xl flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black">⚠️</div>
                  <div>
                    <span className="text-[11px] font-semibold text-amber-800">Trafo Overload (&gt;80%)</span>
                    <div className="text-lg font-black text-amber-950">
                      {filteredPengukuran.filter(p => calculateMetrics(p).loadingPct > 80).length} Gardu
                    </div>
                  </div>
                </div>

                <div className="bg-rose-50/70 border border-rose-100 p-4 rounded-2xl flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center font-black">🚨</div>
                  <div>
                    <span className="text-[11px] font-semibold text-rose-800">Trafo Kritis (&gt;100%)</span>
                    <div className="text-lg font-black text-rose-950">
                      {filteredPengukuran.filter(p => calculateMetrics(p).loadingPct > 100).length} Gardu
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: MASTER DATA GARDU TABLE */}
      {activeTab === 'master_gardu' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span>Master Data Gardu Distribusi ({filteredGardu.length})</span>
            </h3>
            {canEdit && masterGarduList.length > 0 && (
              <button
                onClick={() => setIsConfirmDeleteAllOpen(true)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 cursor-pointer shadow-2xs"
                title="Hapus seluruh master data gardu / trafo"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Hapus Semua Data Trafo ({masterGarduList.length})</span>
              </button>
            )}
          </div>

          {isLoading ? (
            <TableSkeletonLoader columns={12} rows={7} headerTitle="Master Data Gardu Distribusi" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
              <thead className="bg-slate-100 text-slate-700 uppercase text-[10px] font-black tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3">NO baru</th>
                  <th className="py-3 px-3">NO GARDU lama</th>
                  <th className="py-3 px-3">ALAMAT</th>
                  <th className="py-3 px-3">PENYULANG</th>
                  <th className="py-3 px-3">DAYA</th>
                  <th className="py-3 px-3">PHASE</th>
                  <th className="py-3 px-3">STATUS</th>
                  <th className="py-3 px-3">AKTIF</th>
                  <th className="py-3 px-3">LATITUDE</th>
                  <th className="py-3 px-3">LONGITUDE</th>
                  <th className="py-3 px-3">THNOPERASI</th>
                  <th className="py-3 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800">
                {filteredGardu.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="py-8 text-center text-slate-400 font-medium">
                      Tidak ada data master gardu ditemukan.
                    </td>
                  </tr>
                ) : (
                  filteredGardu.map((g) => (
                    <tr key={g.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 font-bold text-blue-900">
                        {g.noBaru || g.noGarduBaru || '-'}
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-600">
                        {g.noGarduLama || '-'}
                      </td>
                      <td className="py-3 px-3 max-w-[200px] truncate text-slate-700" title={g.alamat || g.alamatGardu || '-'}>
                        {g.alamat || g.alamatGardu || '-'}
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-800">
                        <span className="px-2 py-0.5 bg-slate-100 rounded text-[11px] font-bold text-slate-800">
                          {g.penyulang || '-'}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-bold text-blue-700">
                        {g.daya || 0} kVA
                      </td>
                      <td className="py-3 px-3 text-slate-600 font-medium">
                        {g.phase || g.jumlahFasa || '3 Fasa'}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {g.status || 'Operasi'}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-semibold text-emerald-600">
                        {String(g.aktif ?? 'Aktif')}
                      </td>
                      <td className="py-3 px-3 text-[11px] font-mono text-slate-600">
                        {g.latitude ?? g.latt ?? '-'}
                      </td>
                      <td className="py-3 px-3 text-[11px] font-mono text-slate-600">
                        {g.longitude ?? g.long ?? '-'}
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-700">
                        {g.thnOperasi || g.tahunOperasi || '-'}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setEditingGardu(g);
                              setIsGarduModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmGardu(g)}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-rose-600 hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Hapus"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          )}
        </div>
      )}

      {/* TAB 5: PETA LOKASI GARDU */}
      {activeTab === 'peta_gardu' && (
        <PetaGarduView
          masterGarduList={masterGarduList}
          pengukuranList={pengukuranList}
          onUpdateGardu={onAddGardu}
        />
      )}

      {/* MODALS */}
      <MasterGarduModal
        isOpen={isGarduModalOpen}
        onClose={() => setIsGarduModalOpen(false)}
        onSave={onAddGardu}
        editingGardu={editingGardu}
        penyulangList={penyulangList}
      />

      <PengukuranGarduModal
        isOpen={isPengukuranModalOpen}
        onClose={() => setIsPengukuranModalOpen(false)}
        onSave={onAddPengukuran}
        editingPengukuran={editingPengukuran}
        masterGarduList={masterGarduList}
      />

      {isImportModalOpen && onImportGardu && (
        <ImportGarduModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          onImport={(items) => {
            onImportGardu(items);
            setIsImportModalOpen(false);
          }}
          penyulangList={penyulangList}
        />
      )}

      {isImportPengukuranModalOpen && (
        <ImportPengukuranModal
          isOpen={isImportPengukuranModalOpen}
          onClose={() => setIsImportPengukuranModalOpen(false)}
          onImport={(items) => {
            if (onImportPengukuran) {
              onImportPengukuran(items);
            } else {
              items.forEach(onAddPengukuran);
            }
            setIsImportPengukuranModalOpen(false);
          }}
          masterGarduList={masterGarduList}
          penyulangList={penyulangList}
        />
      )}

      {/* Modal Konfirmasi Hapus Semua Data Trafo */}
      {isConfirmDeleteAllOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3.5 text-rose-600">
              <div className="p-3 bg-rose-100 rounded-xl">
                <AlertTriangle className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Hapus Semua Data Trafo?
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Tindakan ini permanen dan tidak dapat dibatalkan.
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-rose-50 border border-rose-200/80 rounded-xl text-xs text-rose-900 leading-relaxed space-y-1.5">
              <p className="font-bold">
                Anda akan menghapus seluruh data Master Gardu ({masterGarduList.length} gardu / trafo).
              </p>
              <p className="text-rose-700 text-[11px]">
                Semua entri nomor gardu baru/lama, alamat, daya kVA, penyulang, fasa, koordinat, dan status gardu pada database akan dikosongkan.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmDeleteAllOpen(false)}
                disabled={isDeletingAll}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeletingAll || masterGarduList.length === 0}
                onClick={async () => {
                  setIsDeletingAll(true);
                  try {
                    if (onDeleteAllGardu) {
                      await onDeleteAllGardu();
                    } else {
                      masterGarduList.forEach((g) => onDeleteGardu(g.id));
                    }
                    setIsConfirmDeleteAllOpen(false);
                  } finally {
                    setIsDeletingAll(false);
                  }
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-600/20 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isDeletingAll ? 'Sedang Menghapus...' : `Ya, Hapus Semua (${masterGarduList.length} Trafo)`}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Individual Pengukuran */}
      {deleteConfirmPengukuran && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-3 bg-rose-100 rounded-xl">
                <Trash2 className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Hapus Pengukuran?</h3>
                <p className="text-xs text-slate-500 font-medium">Tindakan ini tidak dapat dibatalkan.</p>
              </div>
            </div>
            <p className="text-xs text-slate-600">
              Yakin ingin menghapus data pengukuran gardu <b className="text-slate-900">{deleteConfirmPengukuran.noGardu}</b> tanggal <b className="text-slate-900">{deleteConfirmPengukuran.tanggalUkur}</b>?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmPengukuran(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeletePengukuran(deleteConfirmPengukuran.id);
                  setDeleteConfirmPengukuran(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-600/20 transition cursor-pointer"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Individual Master Gardu */}
      {deleteConfirmGardu && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-3 bg-rose-100 rounded-xl">
                <Trash2 className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Hapus Master Gardu?</h3>
                <p className="text-xs text-slate-500 font-medium">Tindakan ini tidak dapat dibatalkan.</p>
              </div>
            </div>
            <p className="text-xs text-slate-600">
              Yakin ingin menghapus master data gardu <b className="text-slate-900">{deleteConfirmGardu.noBaru || deleteConfirmGardu.noGarduBaru}</b>?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmGardu(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteGardu(deleteConfirmGardu.id);
                  setDeleteConfirmGardu(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-600/20 transition cursor-pointer"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Semua Pengukuran */}
      {isConfirmDeleteAllPengukuranOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3.5 text-rose-600">
              <div className="p-3 bg-rose-100 rounded-xl">
                <AlertTriangle className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Hapus Semua Pengukuran Gardu?
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Tindakan ini permanen dan tidak dapat dibatalkan.
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-rose-50 border border-rose-200/80 rounded-xl text-xs text-rose-900 leading-relaxed space-y-1.5">
              <p className="font-bold">
                Anda akan menghapus seluruh data histori pengukuran ({pengukuranList.length} data).
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmDeleteAllPengukuranOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteAllPengukuran) {
                    onDeleteAllPengukuran();
                  }
                  setIsConfirmDeleteAllPengukuranOpen(false);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-600/20 transition flex items-center gap-2 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Ya, Hapus Semua ({pengukuranList.length} Data)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Kalkulator Pembebanan Trafo Modal */}
      <KalkulatorPembebananModal
        isOpen={isCalculatorOpen}
        onClose={() => setIsCalculatorOpen(false)}
      />

    </div>
  );
};
