import React, { useState, useEffect } from 'react';
import {
  Target,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Download,
  Search,
  Filter,
  Trees,
  ClipboardList,
  Search as SearchIcon,
  Zap,
  ChevronRight,
  TrendingUp,
  Pencil,
  Plus,
  Save,
  X,
  Building2,
  Check,
  FileSpreadsheet
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ROWItem, Tier1Item, Tier2Item, User, TargetPemeliharaanPenyulang } from '../../types';
import { canEditData } from '../../utils/permissions';
import { exportToCSV } from '../../utils/exportCsv';
import { db, doc, setDoc, onSnapshot, collection, handleFirestoreError, OperationType } from '../../lib/firebase';
import { sanitizeForFirestore } from '../../utils/firestoreHelper';
import { PLN_LOGO_BASE64 } from '../../utils/plnLogo';

interface MonitoringTargetRealisasiProps {
  currentUser: User;
  rowList: ROWItem[];
  tier1List: Tier1Item[];
  tier2List: Tier2Item[];
}

// Default target standard per penyulang
const DEFAULT_TARGETS: Record<string, { targetRow: number; targetTier1: number; targetTier2: number }> = {
  'TULEHU': { targetRow: 35, targetTier1: 25, targetTier2: 12 },
  'PASSO': { targetRow: 25, targetTier1: 20, targetTier2: 10 },
  'LATERI 2': { targetRow: 30, targetTier1: 18, targetTier2: 8 },
  'WAIHERU 1': { targetRow: 28, targetTier1: 22, targetTier2: 10 },
  'KARPAN 1': { targetRow: 20, targetTier1: 15, targetTier2: 8 },
  'WAIHERU 2': { targetRow: 22, targetTier1: 16, targetTier2: 6 },
  'HATIVE': { targetRow: 24, targetTier1: 18, targetTier2: 8 },
  'BATU MERAH': { targetRow: 18, targetTier1: 14, targetTier2: 6 },
  'AIR MANIS': { targetRow: 15, targetTier1: 10, targetTier2: 5 },
  'PASSO 2': { targetRow: 25, targetTier1: 18, targetTier2: 8 },
  'PASSO 3': { targetRow: 20, targetTier1: 15, targetTier2: 6 },
  'SIRIMAU': { targetRow: 22, targetTier1: 16, targetTier2: 7 }
};

export const MonitoringTargetRealisasiView: React.FC<MonitoringTargetRealisasiProps> = ({
  currentUser,
  rowList,
  tier1List,
  tier2List
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBulan, setSelectedBulan] = useState('2026-08');
  const [activeTab, setActiveTab] = useState<'matriks' | 'grafik' | 'kendala'>('matriks');
  const [customTargets, setCustomTargets] = useState<Record<string, TargetPemeliharaanPenyulang>>({});
  
  // Modal Edit Target State
  const [isEditTargetModalOpen, setIsEditTargetModalOpen] = useState(false);
  const [editTargetPenyulang, setEditTargetPenyulang] = useState('');
  const [editTargetRow, setEditTargetRow] = useState<number>(30);
  const [editTargetTier1, setEditTargetTier1] = useState<number>(20);
  const [editTargetTier2, setEditTargetTier2] = useState<number>(10);

  // Subscribe to real-time custom targets from Firestore
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'target_pemeliharaan_config'),
      (snapshot) => {
        const map: Record<string, TargetPemeliharaanPenyulang> = {};
        snapshot.docs.forEach((docSnap) => {
          const data = docSnap.data() as TargetPemeliharaanPenyulang;
          if (data && data.penyulang) {
            map[data.penyulang.toUpperCase()] = data;
          }
        });
        setCustomTargets(map);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'target_pemeliharaan_config');
      }
    );
    return () => unsub();
  }, []);

  // List of all unique Penyulang names from data & defaults
  const allPenyulangNames = Array.from(
    new Set([
      ...Object.keys(DEFAULT_TARGETS),
      ...rowList.map((r) => (r.penyulang || r.namaPenyulang || '').toUpperCase()).filter(Boolean),
      ...tier1List.map((t) => (t.penyulang || '').toUpperCase()).filter(Boolean),
      ...tier2List.map((t) => (t.penyulang || '').toUpperCase()).filter(Boolean)
    ])
  ).sort();

  // Calculate stats per Penyulang
  const penyulangStats = allPenyulangNames.map((pName) => {
    // Custom target override or default
    const customConfig = customTargets[pName];
    const targetRow = customConfig?.targetRowPohon ?? DEFAULT_TARGETS[pName]?.targetRow ?? 25;
    const targetTier1 = customConfig?.targetInspeksiTier1 ?? DEFAULT_TARGETS[pName]?.targetTier1 ?? 18;
    const targetTier2 = customConfig?.targetInspeksiTier2 ?? DEFAULT_TARGETS[pName]?.targetTier2 ?? 8;

    // Realisasi ROW (Sum of realisasiPangkas or jumlahPohon for this penyulang)
    const rowRecords = rowList.filter((r) => (r.penyulang || r.namaPenyulang || '').toUpperCase() === pName);
    const realisasiRowPohon = rowRecords.reduce((acc, r) => {
      const realisasiVal = typeof r.realisasiPangkas === 'number' ? r.realisasiPangkas : Number(r.realisasiPangkas);
      if (!isNaN(realisasiVal) && realisasiVal > 0) return acc + realisasiVal;
      if (r.status === 'Selesai') return acc + (typeof r.jumlahPohon === 'number' ? r.jumlahPohon : Number(r.jumlahPohon) || 0);
      return acc;
    }, 0);

    const totalTemuanRowPohon = rowRecords.reduce((acc, r) => {
      const temuanVal = typeof r.jumlahTemuanInspeksi === 'number' ? r.jumlahTemuanInspeksi : Number(r.jumlahTemuanInspeksi);
      if (!isNaN(temuanVal) && temuanVal > 0) return acc + temuanVal;
      return acc + (typeof r.jumlahPohon === 'number' ? r.jumlahPohon : Number(r.jumlahPohon) || 0);
    }, 0);

    const sisaRowPohon = Math.max(0, totalTemuanRowPohon - realisasiRowPohon);
    const perluIzin = rowRecords.reduce((acc, r) => acc + (Number(r.perluIzin) || 0), 0);
    const perluPadam = rowRecords.reduce((acc, r) => acc + (Number(r.perluPadam) || 0), 0);

    // Realisasi Inspeksi Tier 1
    const tier1Records = tier1List.filter((t) => (t.penyulang || '').toUpperCase() === pName);
    const realisasiTier1 = tier1Records.length;

    // Realisasi Inspeksi Tier 2
    const tier2Records = tier2List.filter((t) => (t.penyulang || '').toUpperCase() === pName);
    const realisasiTier2 = tier2Records.length;

    // Percentage Progresses
    const pctRow = Math.min(100, Math.round((realisasiRowPohon / Math.max(1, targetRow)) * 100));
    const pctTier1 = Math.min(100, Math.round((realisasiTier1 / Math.max(1, targetTier1)) * 100));
    const pctTier2 = Math.min(100, Math.round((realisasiTier2 / Math.max(1, targetTier2)) * 100));
    const pctOverall = Math.round((pctRow + pctTier1 + pctTier2) / 3);

    let statusLabel: 'Sangat Baik' | 'On-Track' | 'Perlu Percepatan' = 'Perlu Percepatan';
    if (pctOverall >= 85) statusLabel = 'Sangat Baik';
    else if (pctOverall >= 65) statusLabel = 'On-Track';

    return {
      penyulang: pName,
      targetRow,
      realisasiRowPohon,
      totalTemuanRowPohon,
      sisaRowPohon,
      pctRow,
      targetTier1,
      realisasiTier1,
      pctTier1,
      targetTier2,
      realisasiTier2,
      pctTier2,
      perluIzin,
      perluPadam,
      pctOverall,
      statusLabel
    };
  });

  // Filtered Penyulang list based on searchQuery
  const filteredStats = penyulangStats.filter((item) =>
    item.penyulang.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Overall totals across all Penyulang
  const totalTargetRow = penyulangStats.reduce((acc, i) => acc + i.targetRow, 0);
  const totalRealisasiRow = penyulangStats.reduce((acc, i) => acc + i.realisasiRowPohon, 0);
  const totalSisaRow = penyulangStats.reduce((acc, i) => acc + i.sisaRowPohon, 0);
  const totalPerluIzin = penyulangStats.reduce((acc, i) => acc + i.perluIzin, 0);
  const totalPerluPadam = penyulangStats.reduce((acc, i) => acc + i.perluPadam, 0);

  const totalTargetTier1 = penyulangStats.reduce((acc, i) => acc + i.targetTier1, 0);
  const totalRealisasiTier1 = penyulangStats.reduce((acc, i) => acc + i.realisasiTier1, 0);

  const totalTargetTier2 = penyulangStats.reduce((acc, i) => acc + i.targetTier2, 0);
  const totalRealisasiTier2 = penyulangStats.reduce((acc, i) => acc + i.realisasiTier2, 0);

  const overallPctRow = Math.min(100, Math.round((totalRealisasiRow / Math.max(1, totalTargetRow)) * 100));
  const overallPctTier1 = Math.min(100, Math.round((totalRealisasiTier1 / Math.max(1, totalTargetTier1)) * 100));
  const overallPctTier2 = Math.min(100, Math.round((totalRealisasiTier2 / Math.max(1, totalTargetTier2)) * 100));
  const overallPctTotal = Math.round((overallPctRow + overallPctTier1 + overallPctTier2) / 3);

  // Handler to open Edit Target modal
  const handleOpenEditTarget = (penyulangName: string) => {
    const stat = penyulangStats.find((s) => s.penyulang === penyulangName);
    setEditTargetPenyulang(penyulangName);
    setEditTargetRow(stat?.targetRow ?? 30);
    setEditTargetTier1(stat?.targetTier1 ?? 20);
    setEditTargetTier2(stat?.targetTier2 ?? 10);
    setIsEditTargetModalOpen(true);
  };

  // Handler to save Target Configuration
  const handleSaveTarget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTargetPenyulang) return;

    try {
      const docId = `target_${editTargetPenyulang.toUpperCase()}`;
      const payload: TargetPemeliharaanPenyulang = {
        id: docId,
        penyulang: editTargetPenyulang.toUpperCase(),
        targetRowPohon: Number(editTargetRow) || 0,
        targetInspeksiTier1: Number(editTargetTier1) || 0,
        targetInspeksiTier2: Number(editTargetTier2) || 0,
        bulanTarget: selectedBulan,
        catatan: `Diatur oleh ${currentUser.name || 'User'} pada ${new Date().toLocaleDateString('id-ID')}`
      };

      await setDoc(doc(db, 'target_pemeliharaan_config', docId), sanitizeForFirestore(payload));
      setIsEditTargetModalOpen(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'target_pemeliharaan_config');
    }
  };

  // Export to PDF
  const handleExportPdf = () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('MONITORING TARGET DAN REALISASI PEMELIHARAAN (INSPEKSI & ROW)', 14, 15);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`PT PLN (Persero) ULP Baguala — Periode: ${selectedBulan}`, 14, 21);

    const tableRows = filteredStats.map((s, idx) => [
      idx + 1,
      s.penyulang,
      `${s.realisasiRowPohon} / ${s.targetRow}`,
      `${s.pctRow}%`,
      `${s.realisasiTier1} / ${s.targetTier1}`,
      `${s.pctTier1}%`,
      `${s.realisasiTier2} / ${s.targetTier2}`,
      `${s.pctTier2}%`,
      s.sisaRowPohon,
      `${s.perluIzin} Izin / ${s.perluPadam} Padam`,
      `${s.pctOverall}% (${s.statusLabel})`
    ]);

    autoTable(doc, {
      startY: 26,
      head: [
        [
          'No',
          'Penyulang',
          'Realisasi/Target ROW',
          '% ROW',
          'Realisasi/Target Tier 1',
          '% Tier 1',
          'Realisasi/Target Tier 2',
          '% Tier 2',
          'Sisa Pohon',
          'Kendala',
          'Capaian Total'
        ]
      ],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 2 }
    });

    doc.save(`Monitoring_Target_Realisasi_Pemeliharaan_${selectedBulan}.pdf`);
  };

  // Export to CSV
  const handleExportCsv = () => {
    const headers = [
      'Penyulang',
      'Target ROW (Pohon)',
      'Realisasi ROW (Pohon)',
      '% ROW',
      'Target Inspeksi Tier 1',
      'Realisasi Inspeksi Tier 1',
      '% Tier 1',
      'Target Inspeksi Tier 2',
      'Realisasi Inspeksi Tier 2',
      '% Tier 2',
      'Sisa Pohon Pending',
      'Perlu Izin Warga',
      'Perlu Padam Pemeliharaan',
      'Persentase Capaian Overall',
      'Status Pencapaian'
    ];

    const rows = filteredStats.map((s) => [
      s.penyulang,
      s.targetRow,
      s.realisasiRowPohon,
      `${s.pctRow}%`,
      s.targetTier1,
      s.realisasiTier1,
      `${s.pctTier1}%`,
      s.targetTier2,
      s.realisasiTier2,
      `${s.pctTier2}%`,
      s.sisaRowPohon,
      s.perluIzin,
      s.perluPadam,
      `${s.pctOverall}%`,
      s.statusLabel
    ]);

    exportToCSV(`Monitoring_Target_Realisasi_Inspeksi_ROW_${selectedBulan}`, headers, rows);
  };

  return (
    <div className="space-y-6 font-sans pb-10">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded-2xl shrink-0">
            <Target className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
              Monitoring Target & Realisasi Inspeksi dan ROW 20kV
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Pemantauan kumulatif volume target bulanan vs realisasi lapangan pemangkasan pohon (ROW), Inspeksi Visual Tier 1, dan Thermovision / Ultrasound Tier 2.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={handleExportPdf}
            className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export PDF</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Metric Overview Cards (4 Key Target Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* ROW Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 flex items-center gap-1.5">
              <Trees className="w-4 h-4 text-emerald-500" />
              Pangkas Pohon (ROW)
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-extrabold text-[10px]">
              {overallPctRow}% Realisasi
            </span>
          </div>

          <div className="flex items-baseline justify-between">
            <div className="text-3xl font-black text-slate-900">
              {totalRealisasiRow} <span className="text-xs text-slate-400 font-bold">/ {totalTargetRow} Pohon</span>
            </div>
          </div>

          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${overallPctRow}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium pt-1 border-t border-slate-100">
            <span>Sisa: <strong className="text-slate-800">{totalSisaRow} Pohon</strong></span>
            <span>Perlu Izin: <strong className="text-amber-600">{totalPerluIzin}</strong></span>
          </div>
        </div>

        {/* Tier 1 Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 flex items-center gap-1.5">
              <ClipboardList className="w-4 h-4 text-blue-500" />
              Inspeksi Tier 1 (Visual)
            </span>
            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-extrabold text-[10px]">
              {overallPctTier1}% Realisasi
            </span>
          </div>

          <div className="flex items-baseline justify-between">
            <div className="text-3xl font-black text-slate-900">
              {totalRealisasiTier1} <span className="text-xs text-slate-400 font-bold">/ {totalTargetTier1} Titik</span>
            </div>
          </div>

          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-blue-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${overallPctTier1}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium pt-1 border-t border-slate-100">
            <span>Progress: <strong className="text-slate-800">{totalRealisasiTier1} Selesai</strong></span>
            <span>Target: <strong className="text-blue-600">{totalTargetTier1} Titik</strong></span>
          </div>
        </div>

        {/* Tier 2 Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-purple-600 flex items-center gap-1.5">
              <SearchIcon className="w-4 h-4 text-purple-500" />
              Inspeksi Tier 2 (Thermo/Ultrasound)
            </span>
            <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 font-extrabold text-[10px]">
              {overallPctTier2}% Realisasi
            </span>
          </div>

          <div className="flex items-baseline justify-between">
            <div className="text-3xl font-black text-slate-900">
              {totalRealisasiTier2} <span className="text-xs text-slate-400 font-bold">/ {totalTargetTier2} Titik</span>
            </div>
          </div>

          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-purple-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${overallPctTier2}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium pt-1 border-t border-slate-100">
            <span>Pengukuran: <strong className="text-slate-800">{totalRealisasiTier2} Titik</strong></span>
            <span>Target: <strong className="text-purple-600">{totalTargetTier2} Titik</strong></span>
          </div>
        </div>

        {/* Capaian Overall Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-amber-400" />
              Capaian Program Total
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
              overallPctTotal >= 85 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
            }`}>
              {overallPctTotal >= 85 ? 'Sangat Baik' : 'On Track'}
            </span>
          </div>

          <div className="text-3xl font-black text-amber-300">
            {overallPctTotal}% <span className="text-xs text-slate-400 font-normal">Tercapai</span>
          </div>

          <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-amber-400 to-emerald-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${overallPctTotal}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium pt-1 border-t border-slate-800">
            <span>Penyulang Aktif: <strong className="text-white">{allPenyulangNames.length} Feeder</strong></span>
            <span>Total Realisasi: <strong className="text-amber-300">{totalRealisasiRow + totalRealisasiTier1 + totalRealisasiTier2} Kegiatan</strong></span>
          </div>
        </div>
      </div>

      {/* Tabs & Search Controls */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Sub Navigation Tabs */}
          <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl w-fit">
            <button
              onClick={() => setActiveTab('matriks')}
              className={`px-4 py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                activeTab === 'matriks'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Matriks Target vs Realisasi Per Penyulang
            </button>
            <button
              onClick={() => setActiveTab('grafik')}
              className={`px-4 py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                activeTab === 'grafik'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Kartu Progres Per Feeder
            </button>
            <button
              onClick={() => setActiveTab('kendala')}
              className={`px-4 py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                activeTab === 'kendala'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Daftar Kendala & Perlu Izin ({totalPerluIzin + totalPerluPadam})
            </button>
          </div>

          {/* Search Field */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama penyulang..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
          </div>
        </div>

        {/* TAB 1: Matriks Tabel Per Penyulang */}
        {activeTab === 'matriks' && (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-900 text-white font-extrabold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-3">No</th>
                  <th className="py-3 px-3">Nama Penyulang</th>
                  <th className="py-3 px-3 text-center">ROW Pohon (Realisasi/Target)</th>
                  <th className="py-3 px-3 text-center">% ROW</th>
                  <th className="py-3 px-3 text-center">Inspeksi T1 (Realisasi/Target)</th>
                  <th className="py-3 px-3 text-center">% T1</th>
                  <th className="py-3 px-3 text-center">Inspeksi T2 (Realisasi/Target)</th>
                  <th className="py-3 px-3 text-center">% T2</th>
                  <th className="py-3 px-3 text-center">Sisa Pohon</th>
                  <th className="py-3 px-3 text-center">Kendala ROW</th>
                  <th className="py-3 px-3 text-center">Status Performance</th>
                  {canEditData(currentUser) && <th className="py-3 px-3 text-center">Aksi Target</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredStats.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="py-8 text-center text-slate-400">
                      Tidak ada data penyulang ditemukan.
                    </td>
                  </tr>
                ) : (
                  filteredStats.map((item, index) => (
                    <tr key={item.penyulang} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 text-slate-400 font-bold">{index + 1}</td>
                      <td className="py-3 px-3 font-black text-slate-900 flex items-center gap-2">
                        <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span>{item.penyulang}</span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="font-extrabold text-slate-900">{item.realisasiRowPohon}</span>
                        <span className="text-slate-400 font-normal"> / {item.targetRow} Pohon</span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                          item.pctRow >= 80 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {item.pctRow}%
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="font-extrabold text-slate-900">{item.realisasiTier1}</span>
                        <span className="text-slate-400 font-normal"> / {item.targetTier1} Titik</span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                          item.pctTier1 >= 80 ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {item.pctTier1}%
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="font-extrabold text-slate-900">{item.realisasiTier2}</span>
                        <span className="text-slate-400 font-normal"> / {item.targetTier2} Titik</span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                          item.pctTier2 >= 80 ? 'bg-purple-50 text-purple-700' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {item.pctTier2}%
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        {item.sisaRowPohon > 0 ? (
                          <span className="font-extrabold text-rose-600">{item.sisaRowPohon} Pohon</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-emerald-600 font-bold">
                            <Check className="w-3.5 h-3.5" /> Tuntas
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {item.perluIzin > 0 || item.perluPadam > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold">
                            {item.perluIzin > 0 ? `${item.perluIzin} Izin` : ''} {item.perluPadam > 0 ? `${item.perluPadam} Padam` : ''}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[10px]">Lancar</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                          item.statusLabel === 'Sangat Baik'
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.statusLabel === 'On-Track'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {item.statusLabel}
                        </span>
                      </td>
                      {canEditData(currentUser) && (
                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={() => handleOpenEditTarget(item.penyulang)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-amber-500 hover:text-white text-slate-600 transition-colors cursor-pointer"
                            title="Edit Angka Target Feeder"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 2: Kartu Visual Progres Per Feeder */}
        {activeTab === 'grafik' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStats.map((item) => (
              <div key={item.penyulang} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-slate-900 text-amber-400">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-black text-slate-900 text-sm">{item.penyulang}</h3>
                      <span className="text-[10px] text-slate-500 font-semibold">Capaian Overall: {item.pctOverall}%</span>
                    </div>
                  </div>
                  {canEditData(currentUser) && (
                    <button
                      onClick={() => handleOpenEditTarget(item.penyulang)}
                      className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-amber-50 hover:border-amber-300 text-slate-600 text-[10px] font-extrabold flex items-center gap-1"
                    >
                      <Pencil className="w-3 h-3 text-amber-600" />
                      <span>Set Target</span>
                    </button>
                  )}
                </div>

                {/* ROW Progress */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-extrabold text-slate-700">
                    <span className="flex items-center gap-1">
                      <Trees className="w-3.5 h-3.5 text-emerald-600" /> ROW Pangkas Pohon
                    </span>
                    <span className="text-emerald-700">{item.realisasiRowPohon} / {item.targetRow} ({item.pctRow}%)</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${item.pctRow}%` }} />
                  </div>
                </div>

                {/* Tier 1 Progress */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-extrabold text-slate-700">
                    <span className="flex items-center gap-1">
                      <ClipboardList className="w-3.5 h-3.5 text-blue-600" /> Inspeksi Tier 1
                    </span>
                    <span className="text-blue-700">{item.realisasiTier1} / {item.targetTier1} ({item.pctTier1}%)</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div className="bg-blue-500 h-full rounded-full" style={{ width: `${item.pctTier1}%` }} />
                  </div>
                </div>

                {/* Tier 2 Progress */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-extrabold text-slate-700">
                    <span className="flex items-center gap-1">
                      <SearchIcon className="w-3.5 h-3.5 text-purple-600" /> Inspeksi Tier 2
                    </span>
                    <span className="text-purple-700">{item.realisasiTier2} / {item.targetTier2} ({item.pctTier2}%)</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div className="bg-purple-500 h-full rounded-full" style={{ width: `${item.pctTier2}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 3: Daftar Kendala ROW & Perlu Padam */}
        {activeTab === 'kendala' && (
          <div className="space-y-3">
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-900 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Daftar titik pohon yang membutuhkan koordinasi izin pemilik lahan/warga atau pemadaman terencana oleh tim pemeliharaan.</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {rowList.filter((r) => Number(r.perluIzin) > 0 || Number(r.perluPadam) > 0).length === 0 ? (
                <div className="col-span-2 p-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
                  Tidak ada kendala izin warga atau pemadaman pada daftar ROW aktif.
                </div>
              ) : (
                rowList
                  .filter((r) => Number(r.perluIzin) > 0 || Number(r.perluPadam) > 0)
                  .map((r) => (
                    <div key={r.id} className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                          <Zap className="w-3.5 h-3.5 text-amber-500" />
                          {r.penyulang || r.namaPenyulang || 'Penyulang'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold">{r.tanggal || r.tanggalInspeksi || '-'}</span>
                      </div>
                      <p className="text-xs text-slate-600 font-medium">Lokasi Section: {r.section || r.lokasi || '-'}</p>
                      <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                        {Number(r.perluIzin) > 0 && (
                          <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-extrabold">
                            {r.perluIzin} Titik Perlu Izin Warga
                          </span>
                        )}
                        {Number(r.perluPadam) > 0 && (
                          <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 text-[10px] font-extrabold">
                            {r.perluPadam} Titik Perlu Padam
                          </span>
                        )}
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal Edit Target Pemeliharaan Penyulang */}
      {isEditTargetModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-extrabold text-slate-900">Set Target Feeder: {editTargetPenyulang}</h3>
              </div>
              <button
                onClick={() => setIsEditTargetModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTarget} className="space-y-4 text-xs font-semibold text-slate-700">
              <div>
                <label className="block mb-1 text-slate-600 font-bold">Target ROW Pemangkasan (Pohon):</label>
                <input
                  type="number"
                  min="0"
                  value={editTargetRow}
                  onChange={(e) => setEditTargetRow(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block mb-1 text-slate-600 font-bold">Target Inspeksi Tier 1 (Visual / Titik):</label>
                <input
                  type="number"
                  min="0"
                  value={editTargetTier1}
                  onChange={(e) => setEditTargetTier1(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block mb-1 text-slate-600 font-bold">Target Inspeksi Tier 2 (Thermo/Ultrasound Titik):</label>
                <input
                  type="number"
                  min="0"
                  value={editTargetTier2}
                  onChange={(e) => setEditTargetTier2(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  required
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditTargetModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Target</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
