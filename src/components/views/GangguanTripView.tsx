import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus,
  Search,
  FileSpreadsheet,
  Download,
  Trash2,
  Edit2,
  Zap,
  Calendar,
  AlertCircle,
  X,
  SlidersHorizontal,
  CheckSquare,
  Square,
  Camera,
  Building2,
  BrainCircuit,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  List,
  Clock,
  Activity,
  Gauge,
  Layers,
  Sparkles,
  Info,
  ShieldAlert
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { GangguanLog, Penyulang, SectionJaringan, User } from '../../types';
import { HealthIndexBanner } from '../HealthIndexBanner';
import { InputGangguanModal } from '../modals/InputGangguanModal';
import { exportToCSV } from '../../utils/exportCsv';
import { canEditModule } from '../../utils/permissions';
import { TableSkeletonLoader } from '../common/TableSkeletonLoader';

interface GangguanTripViewProps {
  currentUser?: User;
  gangguanList: GangguanLog[];
  penyulangList: Penyulang[];
  sectionList: SectionJaringan[];
  onAddGangguan: (log: GangguanLog) => void;
  onDeleteGangguan: (id: string) => void;
  isLoading?: boolean;
}

export const GangguanTripView: React.FC<GangguanTripViewProps> = ({
  currentUser,
  gangguanList,
  penyulangList,
  sectionList,
  onAddGangguan,
  onDeleteGangguan,
  isLoading = false
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGangguan, setEditingGangguan] = useState<GangguanLog | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState('2026');
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedPenyulang, setSelectedPenyulang] = useState('all');
  const [activeGangguanTab, setActiveGangguanTab] = useState<'semua' | 'trip_pangkal'>('trip_pangkal');
  const [penyulangChartType, setPenyulangChartType] = useState<'bar' | 'line'>('bar');
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<{ isOpen: boolean; result: string; loading: boolean }>({ isOpen: false, result: '', loading: false });
  const [viewLayout, setViewLayout] = useState<'cards' | 'table'>('cards');
  const [expandedGangguanId, setExpandedGangguanId] = useState<string | null>(null);
  const [expandedTopMetric, setExpandedTopMetric] = useState<string | null>(null);
  const [expandedStatsMetric, setExpandedStatsMetric] = useState<string | null>(null);

  const analyzeRootCause = async (gangguan: GangguanLog) => {
    setAnalysisResult({ isOpen: true, result: '', loading: true });
    try {
      const response = await fetch("/api/gemini/analyze-root-cause", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gangguan }),
      });
      const data = await response.json();
      setAnalysisResult({ isOpen: true, result: data.analysis, loading: false });
    } catch (error) {
      setAnalysisResult({ isOpen: true, result: "Gagal memproses analisis: " + error, loading: false });
    }
  };
  
  // Independent Matrix filters
  const [matrixStartDate, setMatrixStartDate] = useState('');
  const [matrixEndDate, setMatrixEndDate] = useState('');
  const [matrixSelectedPenyulang, setMatrixSelectedPenyulang] = useState('all');

  // Preset handlers
  const handlePresetToday = () => {
    const today = new Date().toISOString().split('T')[0];
    setStartDate(today);
    setEndDate(today);
  };

  const handlePreset7Days = () => {
    const now = new Date();
    const past = new Date();
    past.setDate(now.getDate() - 7);
    setStartDate(past.toISOString().split('T')[0]);
    setEndDate(now.toISOString().split('T')[0]);
  };

  const handlePresetThisMonth = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    setStartDate(firstDay.toISOString().split('T')[0]);
    setEndDate(now.toISOString().split('T')[0]);
  };

  const handlePreset30Days = () => {
    const now = new Date();
    const past = new Date();
    past.setDate(now.getDate() - 30);
    setStartDate(past.toISOString().split('T')[0]);
    setEndDate(now.toISOString().split('T')[0]);
  };

  const handleResetFilters = () => {
    setStartDate('');
    setEndDate('');
    setSelectedMonth('all');
    setSelectedYear('2026');
    setSelectedPenyulang('all');
  };

  // Export column selection state
  const [exportIncludePenyebab, setExportIncludePenyebab] = useState(true);
  const [exportIncludeKode, setExportIncludeKode] = useState(true);
  const [exportIncludeArus, setExportIncludeArus] = useState(true);
  const [exportIncludeLokasi, setExportIncludeLokasi] = useState(true);
  const [showExportOptions, setShowExportOptions] = useState(false);

  const isSectionFromGi = (sectionStr: string): boolean => {
    if (!sectionStr) return true;
    const s = String(sectionStr).trim().toUpperCase();
    return (
      s.startsWith('GI') ||
      s.startsWith('GIS') ||
      s.startsWith('G.I') ||
      s.startsWith('PMT') ||
      s.startsWith('GARDU INDUK') ||
      s.includes('PANGKAL') ||
      s.includes('OUTGOING') ||
      s.includes('GI ') ||
      /\bGI\b/.test(s) ||
      /\bGIS\b/.test(s)
    );
  };

  const tripPangkalList = gangguanList.filter((g) => {
    return isSectionFromGi(g.section || '');
  });

  const rawActiveList = activeGangguanTab === 'trip_pangkal' ? tripPangkalList : gangguanList;

  const activeList = rawActiveList.filter((g) => {
    if (selectedPenyulang !== 'all') {
      if ((g.namaPenyulang || '').trim().toLowerCase() !== selectedPenyulang.trim().toLowerCase()) {
        return false;
      }
    }
    const tgl = g.tanggal || '';
    if (startDate && tgl < startDate) return false;
    if (endDate && tgl > endDate) return false;
    if (!startDate && !endDate) {
      if (selectedMonth !== 'all') {
        const parts = tgl.split('-');
        if (parts[1] !== selectedMonth) return false;
      }
      if (selectedYear) {
        return tgl.startsWith(selectedYear);
      }
    }
    return true;
  });

  const totalTrip = activeList.length;

  // Chart 1 Data: Proportion by Code
  const codeCounts: Record<string, number> = {};
  activeList.forEach((g) => {
    const code = (g.kodeGangguan || 'E-5').trim().toUpperCase();
    codeCounts[code] = (codeCounts[code] || 0) + 1;
  });

  const CODE_LABELS: Record<string, string> = {
    'I-1': 'I-1 (Komponen JTM)',
    'I-2': 'I-2 (Peralatan JTM)',
    'I-3': 'I-3 (Trafo/Lainnya)',
    'I-4': 'I-4 (Tiang)',
    'E-1': 'E-1 (Pohon)',
    'E-2': 'E-2 (Bencana Alam)',
    'E-3': 'E-3 (Pihak III/Binatang)',
    'E-4': 'E-4 (Layang-layang/Umbul-umbul)',
    'E-5': 'Tidak Ditemukan'
  };

  const pieData = Object.entries(codeCounts).map(([code, count]) => ({
    name: CODE_LABELS[code] || code,
    value: count
  }));

  const COLORS = ['#ef4444', '#3b82f6', '#f59e0b', '#10b981', '#a855f7', '#8b5cf6', '#ec4899'];

  // Dominant Code calculation
  let dominantCode = '-';
  let maxCodeCount = 0;
  Object.entries(codeCounts).forEach(([code, count]) => {
    if (count > maxCodeCount) {
      maxCodeCount = count;
      dominantCode = CODE_LABELS[code] || code;
    }
  });

  // Penyulang Rawan calculation
  const penyulangCounts: Record<string, number> = {};
  activeList.forEach((g) => {
    const pName = g.namaPenyulang || 'Unknown';
    penyulangCounts[pName] = (penyulangCounts[pName] || 0) + 1;
  });
  let rawanPenyulang = '-';
  let maxPenyulangCount = 0;
  Object.entries(penyulangCounts).forEach(([pName, count]) => {
    if (count > maxPenyulangCount) {
      maxPenyulangCount = count;
      rawanPenyulang = pName;
    }
  });

  // Chart 2 Data: Monthly Trend
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
  const monthlyData = months.map((m, idx) => {
    const count = activeList.filter((g) => {
      const parts = (g.tanggal || '').split('-');
      if (parts.length >= 2) {
        return parseInt(parts[1], 10) - 1 === idx;
      }
      return false;
    }).length;
    return { name: m, gangguan: count };
  });

  // Chart 2B Data: 7-Day Trend of Disturbance Frequency
  const last7DaysData = Array.from({ length: 7 }).map((_, idx) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - idx));
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;
    
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
    const label = `${parseInt(day, 10)} ${monthNames[d.getMonth()]}`;
    
    // Count matches in active list
    const count = activeList.filter((g) => g.tanggal === formattedDate).length;
    return {
      name: label,
      gangguan: count,
      date: formattedDate
    };
  });

  // Chart 3 Data: Frequency per Feeder (Penyulang)
  const feederMap: Record<string, number> = {};
  penyulangList.forEach((p) => {
    feederMap[p.namaPenyulang] = 0;
  });
  activeList.forEach((g) => {
    const pName = g.namaPenyulang || 'Lainnya';
    feederMap[pName] = (feederMap[pName] || 0) + 1;
  });

  const penyulangChartData = Object.entries(feederMap)
    .map(([name, count]) => ({
      name,
      gangguan: count
    }))
    .sort((a, b) => b.gangguan - a.gangguan);

  const DEFAULT_MATRIX_CODES = [
    { code: 'I-1', label: 'KOMPONEN JTM' },
    { code: 'I-2', label: 'PERALATAN JTM' },
    { code: 'I-3', label: 'TRAFO DAN LAINNYA' },
    { code: 'I-4', label: 'TIANG' },
    { code: 'E-1', label: 'POHON / ROW' },
    { code: 'E-2', label: 'BENCANA ALAM' },
    { code: 'E-3', label: 'PEKERJAAN PIHAK III / BINATANG' },
    { code: 'E-4', label: 'LAYANG-LAYANG / UMBUL-UMBUL, DLL' },
    { code: 'E-5', label: 'TIDAK DITEMUKAN' }
  ];

  // Matrix calculation per Code & Month with independent filters
  const matrixFilteredList = activeList.filter((g) => {
    if (matrixSelectedPenyulang !== 'all') {
      if ((g.namaPenyulang || '').trim().toLowerCase() !== matrixSelectedPenyulang.trim().toLowerCase()) {
        return false;
      }
    }
    const tgl = g.tanggal || '';
    if (matrixStartDate && tgl < matrixStartDate) return false;
    if (matrixEndDate && tgl > matrixEndDate) return false;
    return true;
  });

  const matrixRowsData = DEFAULT_MATRIX_CODES.map((rowDef) => {
    const monthlyCounts = Array(12).fill(0);
    matrixFilteredList.forEach((g) => {
      if ((g.kodeGangguan || '').trim().toUpperCase() === (rowDef.code || '').toUpperCase()) {
        const parts = (g.tanggal || '').split('-');
        if (parts.length >= 2) {
          const mIdx = parseInt(parts[1], 10) - 1;
          if (mIdx >= 0 && mIdx < 12) {
            monthlyCounts[mIdx] += 1;
          }
        }
      }
    });
    const totalRow = monthlyCounts.reduce((a, b) => a + b, 0);
    return { ...rowDef, monthlyCounts, totalRow };
  });

  const monthlyTotalSums = months.map((_, idx) =>
    matrixRowsData.reduce((acc, row) => acc + row.monthlyCounts[idx], 0)
  );
  const overallMatrixTotal = matrixRowsData.reduce((acc, row) => acc + row.totalRow, 0);

  // Filtered Table List for search
  const filteredList = activeList.filter((g) => {
    return (
      (g.namaPenyulang || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (g.section || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (g.kodeGangguan || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (g.penyebab || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const handleExportPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

    // Kop Header PLN
    doc.setFillColor(30, 58, 138); // Blue 900
    doc.rect(0, 0, 297, 16, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('PT PLN (PERSERO) UIW MMU - UP3 AMBON - ULP BAGUALA', 14, 10);

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('LAPORAN DATA LOG GANGGUAN PENYULANG 20kV', 14, 25);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);

    const filterInfo = (startDate || endDate)
      ? `Filter Rentang Tanggal: ${startDate || 'Awal'} s/d ${endDate || 'Akhir'}`
      : `Periode: ${selectedMonth !== 'all' ? `Bulan ${selectedMonth} ` : ''}Tahun ${selectedYear}`;
    const penyulangFilter = selectedPenyulang !== 'all' ? ` | Penyulang: ${selectedPenyulang}` : '';

    doc.text(
      `${filterInfo}${penyulangFilter} | Total Record: ${filteredList.length} Event | Dicetak: ${new Date().toLocaleDateString('id-ID')}`,
      14,
      31
    );

    const headerRow = ['No', 'Tanggal', 'Penyulang', 'Section', 'Jam Out - In', 'Durasi', 'Relay'];
    if (exportIncludeKode) headerRow.push('Kode');
    if (exportIncludePenyebab) headerRow.push('Penyebab Gangguan');
    if (exportIncludeArus) headerRow.push('Arus RST/IN (A)');
    if (exportIncludeLokasi) headerRow.push('Detail Lokasi');

    const dataRows = filteredList.map((g, idx) => {
      const durasiMenit = g.durasi && g.durasi.includes(':') 
        ? (parseInt(g.durasi.split(':')[0]) * 60 + parseInt(g.durasi.split(':')[1]))
        : 0;
      const row = [
        (idx + 1).toString(),
        g.tanggal || '-',
        g.namaPenyulang || '-',
        g.section || '-',
        `${g.jamKeluar || ''} - ${g.jamMasuk || ''}`,
        `${g.durasi || '-'} (${durasiMenit} mnt)`,
        g.relayBekerja || '-'
      ];
      if (exportIncludeKode) row.push(g.kodeGangguan === 'E-5' ? 'Tidak Ditemukan' : (g.kodeGangguan || '-'));
      if (exportIncludePenyebab) row.push(g.penyebab || '-');
      if (exportIncludeArus) row.push(`R:${g.arusR || 0} A, S:${g.arusS || 0} A, T:${g.arusT || 0} A, IN:${g.arusIN || 0} A`);
      if (exportIncludeLokasi) row.push(g.detailLokasi || '-');
      return row;
    });

    autoTable(doc, {
      head: [headerRow],
      body: dataRows,
      startY: 36,
      theme: 'grid',
      styles: { fontSize: 7.5, cellPadding: 2 },
      headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: 14, right: 14 }
    });

    const fileSuffix = startDate && endDate ? `${startDate}_sd_${endDate}` : `${selectedYear}_${selectedMonth}`;
    doc.save(`Laporan_Gangguan_Penyulang_${fileSuffix}.pdf`);
  };

  // Export to CSV/Excel handler
  const handleExportGangguan = () => {
    const headers = ['No', 'Tanggal', 'Penyulang', 'Section', 'Jam Keluar', 'Jam Masuk', 'Durasi', 'Relay Bekerja'];
    if (exportIncludeKode) headers.push('Kode Gangguan');
    if (exportIncludePenyebab) headers.push('Penyebab Gangguan');
    if (exportIncludeArus) {
      headers.push('Arus R (A)', 'Arus S (A)', 'Arus T (A)', 'Arus IN (A)');
    }
    if (exportIncludeLokasi) headers.push('Detail Lokasi');

    const rows = filteredList.map((g, idx) => {
      const row: (string | number)[] = [
        idx + 1,
        g.tanggal || '-',
        g.namaPenyulang || '-',
        g.section || '-',
        g.jamKeluar || '',
        g.jamMasuk || '',
        g.durasi || '',
        g.relayBekerja || '-'
      ];
      if (exportIncludeKode) row.push(g.kodeGangguan || '-');
      if (exportIncludePenyebab) row.push(g.penyebab || '-');
      if (exportIncludeArus) {
        row.push(g.arusR || 0, g.arusS || 0, g.arusT || 0, g.arusIN || 0);
      }
      if (exportIncludeLokasi) row.push(g.detailLokasi || '-');
      return row;
    });

    const fileSuffix = startDate && endDate ? `${startDate}_sd_${endDate}` : `${selectedYear}_${selectedMonth}`;
    exportToCSV(`Laporan_Gangguan_20kV_ULP_Baguala_${fileSuffix}`, headers, rows);
  };

  // Export Matriks Distribusi Per Kode to PDF
  const handleExportMatriksPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

    // Kop Header PLN
    doc.setFillColor(30, 58, 138); // Blue 900
    doc.rect(0, 0, 297, 16, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('PT PLN (PERSERO) UIW MMU - UP3 AMBON - ULP BAGUALA', 14, 10);

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('LAPORAN MATRIKS DISTRIBUSI GANGGUAN PER KODE & BULAN', 14, 25);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);

    const periodeInfo = (startDate || endDate)
      ? `Rentang Tanggal: ${startDate || 'Awal'} s/d ${endDate || 'Akhir'}`
      : `Tahun: ${selectedYear}${selectedMonth !== 'all' ? ` | Bulan: ${selectedMonth}` : ' (Semua Bulan)'}`;
    const penyulangInfo = selectedPenyulang !== 'all' ? ` | Penyulang: ${selectedPenyulang}` : '';

    doc.text(
      `Periode: ${periodeInfo}${penyulangInfo} | Total Gangguan: ${overallMatrixTotal} Kejadian | Dicetak: ${new Date().toLocaleDateString('id-ID')}`,
      14,
      31
    );

    const headRow = ['Kode', 'Keterangan Jenis Gangguan', ...months, 'TOTAL'];
    const bodyRows = matrixRowsData.map((row) => [
      row.code === 'E-5' ? '-' : row.code,
      row.label,
      ...row.monthlyCounts.map((c) => (c > 0 ? c.toString() : '-')),
      row.totalRow.toString()
    ]);

    bodyRows.push([
      'TOTAL',
      'JUMLAH TOTAL PER BULAN',
      ...monthlyTotalSums.map((s) => (s > 0 ? s.toString() : '-')),
      overallMatrixTotal.toString()
    ]);

    autoTable(doc, {
      startY: 36,
      head: [headRow],
      body: bodyRows,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2.5 },
      headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: 'bold' },
      footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold' },
      margin: { left: 14, right: 14 }
    });

    const fileSuffix = startDate && endDate ? `${startDate}_sd_${endDate}` : `${selectedYear}_${selectedMonth}`;
    doc.save(`Matriks_Distribusi_Gangguan_ULP_Baguala_${fileSuffix}.pdf`);
  };

  // Export Comprehensive Executive PDF Summary (Cetak PDF Ringkasan)
  const handleCetakRingkasanPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

    // Kop Header PLN
    doc.setFillColor(30, 58, 138); // Blue 900
    doc.rect(0, 0, 297, 16, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('PT PLN (PERSERO) UIW MMU - UP3 AMBON - ULP BAGUALA', 14, 10);

    // Title
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('RINGKASAN EKSEKUTIF & MATRIKS DISTRIBUSI GANGGUAN 20kV', 14, 23);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);

    const periodeInfo = (startDate || endDate)
      ? `Rentang Tanggal: ${startDate || 'Awal'} s/d ${endDate || 'Akhir'}`
      : `Tahun: ${selectedYear}${selectedMonth !== 'all' ? ` | Bulan: ${selectedMonth}` : ' (Semua Bulan)'}`;
    const penyulangInfo = selectedPenyulang !== 'all' ? ` | Penyulang: ${selectedPenyulang}` : '';

    doc.text(
      `Periode: ${periodeInfo}${penyulangInfo} | Total Gangguan: ${overallMatrixTotal} Kejadian | Dicetak: ${new Date().toLocaleDateString('id-ID')}`,
      14,
      29
    );

    // Section 1: Matriks Distribusi Table
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text('1. MATRIKS DISTRIBUSI GANGGUAN PER KODE & BULAN', 14, 37);

    const headRow = ['Kode', 'Keterangan Jenis Gangguan', ...months, 'TOTAL'];
    const bodyRows = matrixRowsData.map((row) => [
      row.code === 'E-5' ? '-' : row.code,
      row.label,
      ...row.monthlyCounts.map((c) => (c > 0 ? c.toString() : '-')),
      row.totalRow.toString()
    ]);

    bodyRows.push([
      'TOTAL',
      'JUMLAH TOTAL PER BULAN',
      ...monthlyTotalSums.map((s) => (s > 0 ? s.toString() : '-')),
      overallMatrixTotal.toString()
    ]);

    autoTable(doc, {
      startY: 40,
      head: [headRow],
      body: bodyRows,
      theme: 'grid',
      styles: { fontSize: 7.5, cellPadding: 2 },
      headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: 'bold' },
      footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold' },
      margin: { left: 14, right: 14 }
    });

    const finalY = (doc as any).lastAutoTable.finalY || 120;

    // Section 2: Detailed Event List
    if (finalY > 150) {
      doc.addPage();
    }
    
    const startYDetail = finalY > 150 ? 20 : finalY + 10;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text('2. DAFTAR RINCIAN LOG KEJADIAN GANGGUAN / TRIP', 14, startYDetail);

    const detailHeader = ['No', 'Tanggal', 'Penyulang', 'Section', 'Jam Out - In', 'Durasi', 'Relay', 'Penyebab', 'Kode'];
    const detailRows = filteredList.map((g, idx) => [
      (idx + 1).toString(),
      g.tanggal || '-',
      g.namaPenyulang || '-',
      g.section || '-',
      `${g.jamKeluar || ''} - ${g.jamMasuk || ''}`,
      g.durasi || '-',
      g.relayBekerja || '-',
      g.penyebab || '-',
      g.kodeGangguan === 'E-5' ? 'Tidak Ditemukan' : (g.kodeGangguan || '-')
    ]);

    autoTable(doc, {
      startY: startYDetail + 4,
      head: [detailHeader],
      body: detailRows,
      theme: 'grid',
      styles: { fontSize: 7, cellPadding: 1.8 },
      headStyles: { fillColor: [2, 132, 199], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: 14, right: 14 }
    });

    const fileSuffix = startDate && endDate ? `${startDate}_sd_${endDate}` : `${selectedYear}_${selectedMonth}`;
    doc.save(`Ringkasan_Eksekutif_Matriks_Gangguan_${fileSuffix}.pdf`);
  };

  return (
    <div className="p-4 md:p-6 space-y-6 bg-slate-50 text-slate-900 font-sans min-h-screen">
      
      {/* Dashboard Trip Pangkal Banner */}
      <div className="p-6 bg-gradient-to-r from-[#022623] via-[#044c45] to-[#022e2a] rounded-3xl text-white shadow-2xl border-2 border-teal-500/60 space-y-4 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-teal-500/30 pb-4 z-10 relative">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-teal-950/80 border border-teal-500/40 rounded-2xl text-teal-300 shadow-inner">
              <Zap className="w-6 h-6 animate-pulse text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-black text-base text-white tracking-wide uppercase drop-shadow-xs">
                  DASHBOARD TRIP PANGKAL FEEDER 20kV
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40 font-extrabold text-[10px] uppercase">
                  GANGGUAN TRIP FEEDER
                </span>
              </div>
              <p className="text-xs text-teal-100/90 font-medium mt-0.5">
                Monitoring, rekapitulasi, dan analisis frekuensi Trip Pangkal (PMT GI 20kV) ULP Baguala
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-xs font-bold text-teal-200">
            <span className="px-3.5 py-1.5 bg-[#012521] border border-teal-500/40 rounded-xl shadow-inner">
              Total Feeder: <strong className="text-white">{penyulangList.length} Penyulang</strong>
            </span>
          </div>
        </div>

        {/* Metric Cards Row with Framer Motion Expandable Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Card 1: Total Trip Pangkal */}
          <motion.div
            layout
            onClick={() => setExpandedTopMetric(expandedTopMetric === 'total_trip' ? null : 'total_trip')}
            className={`p-3.5 bg-slate-800/80 border rounded-2xl cursor-pointer transition-colors ${
              expandedTopMetric === 'total_trip' ? 'border-rose-500/80 ring-2 ring-rose-500/30 bg-slate-800' : 'border-slate-700/60 hover:border-slate-600'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span>Total Trip Pangkal</span>
                  <span className="text-[9px] text-rose-400 font-normal underline">
                    {expandedTopMetric === 'total_trip' ? 'Tutup' : 'Lihat'}
                  </span>
                </div>
                <div className="text-2xl font-black text-rose-400 mt-1">{tripPangkalList.length} <span className="text-xs font-semibold text-slate-300">Kali</span></div>
                <div className="text-[10px] text-slate-400 mt-0.5">Filter aktif: {totalTrip} Event</div>
              </div>
              <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <Zap className="w-5 h-5" />
              </div>
            </div>

            <AnimatePresence>
              {expandedTopMetric === 'total_trip' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className="mt-3 pt-3 border-t border-slate-700/60 text-xs space-y-1.5 overflow-hidden"
                >
                  <div className="font-bold text-slate-300 text-[11px]">Distribusi Gangguan:</div>
                  <div className="flex justify-between text-slate-400 text-[10px]">
                    <span>Trip Pangkal (PMT GI):</span>
                    <span className="font-mono text-rose-400 font-bold">{tripPangkalList.length} kali</span>
                  </div>
                  <div className="flex justify-between text-slate-400 text-[10px]">
                    <span>Gangguan Percabangan:</span>
                    <span className="font-mono text-blue-400 font-bold">{Math.max(0, gangguanList.length - tripPangkalList.length)} kali</span>
                  </div>
                  <div className="flex justify-between text-slate-400 text-[10px]">
                    <span>Total Keseluruhan:</span>
                    <span className="font-mono text-emerald-400 font-bold">{gangguanList.length} kali</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Card 2: Penyulang Paling Rawan */}
          <motion.div
            layout
            onClick={() => setExpandedTopMetric(expandedTopMetric === 'rawan' ? null : 'rawan')}
            className={`p-3.5 bg-slate-800/80 border rounded-2xl cursor-pointer transition-colors ${
              expandedTopMetric === 'rawan' ? 'border-amber-500/80 ring-2 ring-amber-500/30 bg-slate-800' : 'border-slate-700/60 hover:border-slate-600'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span>Penyulang Paling Rawan</span>
                  <span className="text-[9px] text-amber-400 font-normal underline">
                    {expandedTopMetric === 'rawan' ? 'Tutup' : 'Lihat'}
                  </span>
                </div>
                <div className="text-base font-black text-amber-300 mt-1 truncate max-w-[150px]">{rawanPenyulang}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{maxPenyulangCount} Kali Trip Pangkal</div>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <AlertCircle className="w-5 h-5" />
              </div>
            </div>

            <AnimatePresence>
              {expandedTopMetric === 'rawan' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className="mt-3 pt-3 border-t border-slate-700/60 text-xs space-y-1.5 overflow-hidden"
                >
                  <div className="font-bold text-slate-300 text-[11px]">Penyulang Rawan Teratas:</div>
                  {penyulangChartData.slice(0, 3).map((item, idx) => (
                    <div key={idx} className="flex justify-between text-slate-400 text-[10px]">
                      <span className="truncate max-w-[120px]">{item.name}</span>
                      <span className="font-mono text-amber-300 font-bold">{item.gangguan} Trip</span>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Card 3: Penyebab Dominan */}
          <motion.div
            layout
            onClick={() => setExpandedTopMetric(expandedTopMetric === 'dominan' ? null : 'dominan')}
            className={`p-3.5 bg-slate-800/80 border rounded-2xl cursor-pointer transition-colors ${
              expandedTopMetric === 'dominan' ? 'border-blue-500/80 ring-2 ring-blue-500/30 bg-slate-800' : 'border-slate-700/60 hover:border-slate-600'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span>Penyebab Dominan</span>
                  <span className="text-[9px] text-blue-400 font-normal underline">
                    {expandedTopMetric === 'dominan' ? 'Tutup' : 'Lihat'}
                  </span>
                </div>
                <div className="text-sm font-black text-blue-300 mt-1 truncate max-w-[150px]">{dominantCode}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{maxCodeCount} Kejadian Terdaftar</div>
              </div>
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <SlidersHorizontal className="w-5 h-5" />
              </div>
            </div>

            <AnimatePresence>
              {expandedTopMetric === 'dominan' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className="mt-3 pt-3 border-t border-slate-700/60 text-xs space-y-1.5 overflow-hidden"
                >
                  <div className="font-bold text-slate-300 text-[11px]">Dominasi Kode Gangguan:</div>
                  {pieData.slice(0, 3).map((item, idx) => (
                    <div key={idx} className="flex justify-between text-slate-400 text-[10px]">
                      <span className="truncate max-w-[120px]">{item.name}</span>
                      <span className="font-mono text-blue-300 font-bold">{item.value}x ({totalTrip > 0 ? ((item.value / totalTrip) * 100).toFixed(0) : 0}%)</span>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Card 4: Rata-rata Durasi Padam */}
          <motion.div
            layout
            onClick={() => setExpandedTopMetric(expandedTopMetric === 'durasi' ? null : 'durasi')}
            className={`p-3.5 bg-slate-800/80 border rounded-2xl cursor-pointer transition-colors ${
              expandedTopMetric === 'durasi' ? 'border-emerald-500/80 ring-2 ring-emerald-500/30 bg-slate-800' : 'border-slate-700/60 hover:border-slate-600'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span>Rata-rata Durasi Padam</span>
                  <span className="text-[9px] text-emerald-400 font-normal underline">
                    {expandedTopMetric === 'durasi' ? 'Tutup' : 'Lihat'}
                  </span>
                </div>
                <div className="text-sm font-black text-emerald-300 mt-1 truncate max-w-[150px]">
                  {activeList.length > 0
                    ? (activeList.reduce((acc, g) => {
                        const mins = g.durasi && g.durasi.includes(':') 
                          ? (parseInt(g.durasi.split(':')[0]) * 60 + parseInt(g.durasi.split(':')[1])) 
                          : 0;
                        return acc + mins;
                      }, 0) / activeList.length).toFixed(1)
                    : 0} mnt
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Per Kejadian</div>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckSquare className="w-5 h-5" />
              </div>
            </div>

            <AnimatePresence>
              {expandedTopMetric === 'durasi' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className="mt-3 pt-3 border-t border-slate-700/60 text-xs space-y-1.5 overflow-hidden"
                >
                  <div className="font-bold text-slate-300 text-[11px]">Statistik Pemulihan:</div>
                  <div className="flex justify-between text-slate-400 text-[10px]">
                    <span>Total Durasi Padam:</span>
                    <span className="font-mono text-emerald-300 font-bold">
                      {(activeList.reduce((acc, g) => {
                        const mins = g.durasi && g.durasi.includes(':') 
                          ? (parseInt(g.durasi.split(':')[0]) * 60 + parseInt(g.durasi.split(':')[1])) 
                          : 0;
                        return acc + mins;
                      }, 0) / 60).toFixed(1)} Jam
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400 text-[10px]">
                    <span>Kecepatan Normalisasi:</span>
                    <span className="font-mono text-emerald-300 font-bold">Optimal (&lt; 45 mnt)</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>

      {/* Header & Filter Bar */}
      <div className="p-4 bg-white border border-slate-200 shadow-sm rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Tab Selector Bar */}
        <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveGangguanTab('trip_pangkal')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeGangguanTab === 'trip_pangkal'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                : 'bg-white text-slate-700 hover:bg-slate-200/70 border border-slate-200/60'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Trip Pangkal ({tripPangkalList.length})</span>
          </button>
          <button
            onClick={() => setActiveGangguanTab('semua')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeGangguanTab === 'semua'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'bg-white text-slate-700 hover:bg-slate-200/70 border border-slate-200/60'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Semua Gangguan ({gangguanList.length})</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCetakRingkasanPDF}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
            title="Cetak Ringkasan Eksekutif PDF"
          >
            <Download className="w-4 h-4 text-amber-400" />
            <span>Cetak PDF</span>
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-blue-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Input Gangguan</span>
          </button>
        </div>
      </div>

      {/* NEW: Dedicated Filter Toolbar */}
      <div className="p-4 bg-white border border-slate-200 shadow-sm rounded-2xl space-y-3">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Rentang Tanggal Filter Box */}
            <div className="flex items-center gap-2.5 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl shadow-2xs">
              <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Rentang Tanggal (Mulai - Sampai)</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-900 font-bold focus:outline-none focus:border-blue-500 shadow-2xs cursor-pointer"
                  />
                  <span className="text-[10px] font-extrabold text-slate-400">s/d</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-900 font-bold focus:outline-none focus:border-blue-500 shadow-2xs cursor-pointer"
                  />
                  {(startDate || endDate) && (
                    <button
                      onClick={() => { setStartDate(''); setEndDate(''); }}
                      className="p-1 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors cursor-pointer"
                      title="Clear Date Range"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Preset Buttons */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={handlePresetToday}
                className="px-2.5 py-1 text-[11px] font-bold rounded-lg text-slate-700 hover:bg-white hover:shadow-2xs transition-all cursor-pointer"
              >
                Hari Ini
              </button>
              <button
                onClick={handlePreset7Days}
                className="px-2.5 py-1 text-[11px] font-bold rounded-lg text-slate-700 hover:bg-white hover:shadow-2xs transition-all cursor-pointer"
              >
                7 Hari
              </button>
              <button
                onClick={handlePresetThisMonth}
                className="px-2.5 py-1 text-[11px] font-bold rounded-lg text-slate-700 hover:bg-white hover:shadow-2xs transition-all cursor-pointer"
              >
                Bulan Ini
              </button>
              <button
                onClick={handlePreset30Days}
                className="px-2.5 py-1 text-[11px] font-bold rounded-lg text-slate-700 hover:bg-white hover:shadow-2xs transition-all cursor-pointer"
              >
                30 Hari
              </button>
            </div>

            {/* Filter Penyulang */}
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl shadow-2xs">
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Filter Penyulang</span>
                <select
                  value={selectedPenyulang}
                  onChange={(e) => setSelectedPenyulang(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-900 focus:outline-none cursor-pointer mt-0.5"
                >
                  <option value="all">Semua Penyulang ({penyulangList.length})</option>
                  {penyulangList.map((p) => (
                    <option key={p.id} value={p.namaPenyulang}>
                      {p.namaPenyulang} ({p.namaGi})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Bulan & Tahun Fallback */}
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl shadow-2xs">
              <div className="flex items-center gap-2">
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Bulan</span>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    disabled={!!(startDate || endDate)}
                    className={`bg-transparent text-xs font-bold text-slate-900 focus:outline-none cursor-pointer mt-0.5 ${
                      startDate || endDate ? 'opacity-40' : ''
                    }`}
                  >
                    <option value="all">Semua Bulan</option>
                    <option value="01">Januari</option>
                    <option value="02">Februari</option>
                    <option value="03">Maret</option>
                    <option value="04">April</option>
                    <option value="05">Mei</option>
                    <option value="06">Juni</option>
                    <option value="07">Juli</option>
                    <option value="08">Agustus</option>
                    <option value="09">September</option>
                    <option value="10">Oktober</option>
                    <option value="11">November</option>
                    <option value="12">Desember</option>
                  </select>
                </div>
                <div className="w-px h-6 bg-slate-200 mx-1" />
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Tahun</span>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    disabled={!!(startDate || endDate)}
                    className={`bg-transparent text-xs font-bold text-slate-900 focus:outline-none cursor-pointer mt-0.5 ${
                      startDate || endDate ? 'opacity-40' : ''
                    }`}
                  >
                    <option value="2026">2026</option>
                    <option value="2025">2025</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1 lg:w-60">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari penyulang/kode..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleExportPDF}
                className="px-3 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-rose-600 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-95"
                title="Export PDF Sesuai Rentang Tanggal"
              >
                <Download className="w-3.5 h-3.5" />
                <span>PDF</span>
              </button>
              <button
                onClick={handleExportGangguan}
                className="px-3 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-emerald-600 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-95"
                title="Export Excel/CSV Sesuai Rentang Tanggal"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Excel</span>
              </button>
            </div>
          </div>
        </div>

        {/* Active Filter Indicator Badge Bar */}
        {(startDate || endDate || selectedPenyulang !== 'all' || selectedMonth !== 'all') && (
          <div className="flex items-center justify-between px-3.5 py-2 bg-blue-50 border border-blue-200 rounded-xl text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-extrabold text-blue-900 uppercase text-[10px] tracking-wider">
                FILTER PERIODE AKTIF:
              </span>
              {startDate || endDate ? (
                <span className="px-2 py-0.5 rounded-md bg-white border border-blue-200 font-bold text-blue-800 text-[11px]">
                  📅 {startDate || 'Awal'} s/d {endDate || 'Akhir'}
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-md bg-white border border-blue-200 font-bold text-blue-800 text-[11px]">
                  🗓️ Periode: {selectedMonth !== 'all' ? `Bulan ${selectedMonth}` : ''} {selectedYear}
                </span>
              )}

              {selectedPenyulang !== 'all' && (
                <span className="px-2 py-0.5 rounded-md bg-white border border-blue-200 font-bold text-blue-800 text-[11px]">
                  ⚡ Penyulang: {selectedPenyulang}
                </span>
              )}

              <span className="text-[11px] text-blue-700 font-semibold">
                ({activeList.length} Event Ditemukan)
              </span>
            </div>

            <button
              onClick={handleResetFilters}
              className="text-rose-600 hover:text-rose-800 font-bold text-[11px] flex items-center gap-1 cursor-pointer underline"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset Filter</span>
            </button>
          </div>
        )}
      </div>

      {/* Metric Cards Row with Framer Motion Animation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          layout
          onClick={() => setExpandedStatsMetric(expandedStatsMetric === 'total' ? null : 'total')}
          className={`p-5 bg-white border rounded-2xl shadow-sm cursor-pointer transition-all ${
            expandedStatsMetric === 'total' ? 'border-rose-300 ring-2 ring-rose-500/20' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase text-rose-600 tracking-wider">TOTAL GANGGUAN</span>
                <span className="text-[9px] text-slate-400">({expandedStatsMetric === 'total' ? 'Tutup' : 'Klik detail'})</span>
              </div>
              <div className="text-3xl font-extrabold text-slate-900 mt-1">{totalTrip} <span className="text-xs font-semibold text-rose-600">Kali Trip</span></div>
              <span className="text-[11px] text-slate-400">
                {startDate || endDate
                  ? `Rentang: ${startDate || 'Awal'} s/d ${endDate || 'Akhir'}`
                  : `Periode: ${selectedMonth !== 'all' ? months[parseInt(selectedMonth, 10) - 1] : ''} ${selectedYear}`} ({activeGangguanTab === 'trip_pangkal' ? 'Trip Pangkal' : 'Semua'})
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100">
              <Zap className="w-6 h-6" />
            </div>
          </div>

          <AnimatePresence>
            {expandedStatsMetric === 'total' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="mt-4 pt-3 border-t border-slate-100 text-xs space-y-1.5 overflow-hidden"
              >
                <div className="flex justify-between text-slate-600">
                  <span>Trip Pangkal (PMT GI):</span>
                  <span className="font-bold text-rose-600">{activeList.filter(g => isSectionFromGi(g.section)).length} Kali</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Trip Percabangan / Section:</span>
                  <span className="font-bold text-blue-600">{activeList.filter(g => !isSectionFromGi(g.section)).length} Kali</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <motion.div
          layout
          onClick={() => setExpandedStatsMetric(expandedStatsMetric === 'kode' ? null : 'kode')}
          className={`p-5 bg-white border rounded-2xl shadow-sm cursor-pointer transition-all ${
            expandedStatsMetric === 'kode' ? 'border-amber-300 ring-2 ring-amber-500/20' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase text-amber-600 tracking-wider">KODE DOMINAN</span>
                <span className="text-[9px] text-slate-400">({expandedStatsMetric === 'kode' ? 'Tutup' : 'Klik detail'})</span>
              </div>
              <div className="text-base font-extrabold text-slate-900 mt-1 uppercase">{dominantCode}</div>
              <span className="text-[11px] text-slate-400">Frekuensi: {maxCodeCount} Kejadian</span>
            </div>
            <div className="p-3 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100">
              <SlidersHorizontal className="w-6 h-6" />
            </div>
          </div>

          <AnimatePresence>
            {expandedStatsMetric === 'kode' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="mt-4 pt-3 border-t border-slate-100 text-xs space-y-1 overflow-hidden"
              >
                <div className="text-[11px] text-slate-500">Peringkat Teratas Penyebab:</div>
                <div className="flex justify-between font-semibold text-slate-700">
                  <span>{dominantCode}</span>
                  <span className="text-amber-600">{maxCodeCount} kali ({totalTrip > 0 ? ((maxCodeCount / totalTrip) * 100).toFixed(0) : 0}%)</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <motion.div
          layout
          onClick={() => setExpandedStatsMetric(expandedStatsMetric === 'penyulang' ? null : 'penyulang')}
          className={`p-5 bg-white border rounded-2xl shadow-sm cursor-pointer transition-all ${
            expandedStatsMetric === 'penyulang' ? 'border-blue-300 ring-2 ring-blue-500/20' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase text-blue-600 tracking-wider">PENYULANG RAWAN</span>
                <span className="text-[9px] text-slate-400">({expandedStatsMetric === 'penyulang' ? 'Tutup' : 'Klik detail'})</span>
              </div>
              <div className="text-xl font-extrabold text-slate-900 mt-1 uppercase">{rawanPenyulang}</div>
              <span className="text-[11px] text-slate-400">Total Trip: {maxPenyulangCount} Kali</span>
            </div>
            <div className="p-3 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100">
              <Building2 className="w-6 h-6" />
            </div>
          </div>

          <AnimatePresence>
            {expandedStatsMetric === 'penyulang' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="mt-4 pt-3 border-t border-slate-100 text-xs space-y-1 overflow-hidden"
              >
                <div className="text-[11px] text-slate-500">Status Penyulang:</div>
                <div className="flex justify-between text-slate-700">
                  <span>Kontribusi Gangguan:</span>
                  <span className="font-bold text-blue-600">{totalTrip > 0 ? ((maxPenyulangCount / totalTrip) * 100).toFixed(0) : 0}% dari total</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Analytics Visuals Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Donut Chart */}
        <div className="p-6 bg-white border border-slate-200 shadow-sm rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold text-slate-900">
              🍩 Proporsi Jenis Kode Gangguan
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
              Pie Diagram
            </span>
          </div>

          <div className="h-52 w-full flex items-center justify-center">
            {pieData.length === 0 ? (
              <div className="text-xs text-slate-400">Belum ada data gangguan</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', fontSize: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Bar Chart - Per Bulan */}
        <div className="p-6 bg-white border border-slate-200 shadow-sm rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold text-slate-900">
              📈 Tren Gangguan Per Bulan
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
              Bar Chart
            </span>
          </div>

          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={10} allowDecimals={false} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', fontSize: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="gangguan" fill="#0284c7" radius={[4, 4, 0, 0]} name="Kejadian" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Line Chart - 7 Hari Terakhir */}
        <div className="p-6 bg-white border border-slate-200 shadow-sm rounded-2xl space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                ⚡ Tren Gangguan 7 Hari Terakhir
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
                Line Chart
              </span>
            </div>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={last7DaysData} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#ffffff', 
                      borderColor: '#e2e8f0', 
                      borderRadius: '12px', 
                      fontSize: '11px', 
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' 
                    }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="gangguan" 
                    stroke="#f43f5e" 
                    strokeWidth={2.5} 
                    dot={{ r: 3, strokeWidth: 1, fill: '#f43f5e' }} 
                    activeDot={{ r: 5 }} 
                    name="Kejadian" 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-500 font-semibold leading-relaxed">
            {last7DaysData.reduce((sum, item) => sum + item.gangguan, 0) === 0 ? (
              <span className="text-amber-600 bg-amber-50 border border-amber-100 rounded-lg p-2 block font-medium">
                💡 <strong>Tip:</strong> Belum ada log gangguan seminggu terakhir. Input gangguan baru dengan tanggal hari ini untuk melihat lonjakan grafik!
              </span>
            ) : (
              <span className="text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg p-2 block font-medium">
                ✅ Terdeteksi <strong>{last7DaysData.reduce((sum, item) => sum + item.gangguan, 0)} gangguan</strong> dalam 7 hari terakhir.
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Matriks Distribusi Per Kode & Bulan */}
      <div className="p-6 bg-white border border-slate-200 shadow-sm rounded-2xl space-y-4 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            📊 MATRIKS DISTRIBUSI GANGGUAN PER KODE & BULAN
          </h3>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Filter Penyulang & Tanggal */}
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl shadow-2xs">
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Filter Penyulang</span>
                <select
                  value={matrixSelectedPenyulang}
                  onChange={(e) => setMatrixSelectedPenyulang(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-900 focus:outline-none cursor-pointer mt-0.5"
                >
                  <option value="all">Semua Penyulang ({penyulangList.length})</option>
                  {penyulangList.map((p) => (
                    <option key={p.id} value={p.namaPenyulang}>
                      {p.namaPenyulang} ({p.namaGi})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl shadow-2xs">
              <div className="flex flex-col">
                 <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Rentang Tanggal</span>
                 <div className="flex items-center gap-1 mt-0.5">
                    <input type="date" value={matrixStartDate} onChange={(e) => setMatrixStartDate(e.target.value)} className="bg-transparent text-[10px] font-bold text-slate-900 cursor-pointer" />
                    <span>-</span>
                    <input type="date" value={matrixEndDate} onChange={(e) => setMatrixEndDate(e.target.value)} className="bg-transparent text-[10px] font-bold text-slate-900 cursor-pointer" />
                 </div>
              </div>
            </div>
            
            {(startDate || endDate) && (
              <span className="text-[10px] px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-bold border border-amber-200">
                PERIODE: {startDate || 'Awal'} s/d {endDate || 'Akhir'}
              </span>
            )}
            <span className="text-[10px] px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 font-bold">
              TOTAL: {overallMatrixTotal} KEJADIAN
            </span>
            <button
              onClick={handleExportMatriksPDF}
              className="px-3 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-bold text-[11px] flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
              title="Cetak/Export Matriks Distribusi ke PDF"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>Export Matriks PDF</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-center text-xs text-slate-700 border-collapse">
            <thead className="bg-slate-50 text-slate-500 font-bold text-[10px] uppercase border-b border-slate-200">
              <tr>
                <th className="px-3 py-2.5 text-left">Kode Gangguan</th>
                <th className="px-3 py-2.5 text-left">Keterangan Jenis</th>
                {months.map((m) => (
                  <th key={m} className="px-2 py-2.5">{m}</th>
                ))}
                <th className="px-3 py-2.5 bg-blue-600 text-white font-bold">TOTAL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {matrixRowsData.map((row) => (
                <tr key={row.code} className="hover:bg-slate-50 transition-colors">
                  <td className="px-3 py-2.5 text-left font-bold text-rose-600">{row.code === 'E-5' ? '-' : row.code}</td>
                  <td className="px-3 py-2.5 text-left text-slate-700 text-[11px] font-semibold">{row.label}</td>
                  {row.monthlyCounts.map((val, idx) => (
                    <td
                      key={idx}
                      className={`px-2 py-2.5 ${
                        val > 0 ? 'font-bold text-emerald-700 bg-emerald-50' : 'text-slate-400'
                      }`}
                    >
                      {val > 0 ? val : '-'}
                    </td>
                  ))}
                  <td className={`px-3 py-2.5 font-bold text-xs ${row.totalRow > 0 ? 'bg-blue-50 text-blue-700' : 'bg-slate-50 text-slate-400'}`}>
                    {row.totalRow}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-100 font-extrabold text-slate-900 border-t-2 border-slate-300">
              <tr>
                <td colSpan={2} className="px-3 py-2.5 text-left uppercase tracking-wider text-[11px]">
                  JUMLAH TOTAL PER BULAN
                </td>
                {monthlyTotalSums.map((sum, idx) => (
                  <td
                    key={idx}
                    className={`px-2 py-2.5 ${sum > 0 ? 'text-blue-700 bg-blue-100/50' : 'text-slate-400'}`}
                  >
                    {sum > 0 ? sum : '-'}
                  </td>
                ))}
                <td className="px-3 py-2.5 bg-blue-600 text-white font-extrabold text-xs">
                  {overallMatrixTotal}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Main Table / Cards Section */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden space-y-4 p-5">
        
        {/* Table Toolbar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari penyulang, section, kode gangguan..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-between lg:justify-end">
            {/* View Mode Switcher: Cards vs Table */}
            <div className="flex items-center p-1 bg-slate-100 border border-slate-200 rounded-xl">
              <button
                type="button"
                onClick={() => setViewLayout('cards')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewLayout === 'cards'
                    ? 'bg-white text-blue-600 shadow-xs border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Tampilan Card Interaktif dengan Animasi Detail"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Card Interaktif</span>
              </button>
              <button
                type="button"
                onClick={() => setViewLayout('table')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewLayout === 'table'
                    ? 'bg-white text-blue-600 shadow-xs border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Tampilan Tabel Data Klasik"
              >
                <List className="w-3.5 h-3.5" />
                <span>Tabel Data</span>
              </button>
            </div>

            <button
              onClick={() => setShowExportOptions(!showExportOptions)}
              className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                showExportOptions
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
              }`}
              title="Pilih kolom yang akan disertakan pada file download"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Kolom Export</span>
            </button>
            <button
              onClick={handleExportPDF}
              className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm shadow-red-600/20"
              title="Unduh data laporan gangguan ke format PDF"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export PDF</span>
            </button>
            <button
              onClick={handleExportGangguan}
              className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm shadow-emerald-700/20"
              title="Unduh data laporan gangguan ke format CSV/Excel"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm shadow-blue-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>Input Gangguan</span>
            </button>
          </div>
        </div>

        {/* Export Column Choices Panel */}
        {showExportOptions && (
          <div className="p-3.5 bg-slate-50 border border-blue-200 rounded-xl space-y-2 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="font-extrabold text-slate-800 flex items-center gap-1.5">
                <SlidersHorizontal className="w-4 h-4 text-blue-600" />
                Pilihan Kolom Laporan Gangguan (Sertakan / Sembunyikan Saat Download):
              </span>
              <button
                onClick={() => setShowExportOptions(false)}
                className="text-slate-400 hover:text-slate-700 text-[11px] font-bold underline cursor-pointer"
              >
                Tutup
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 font-semibold text-slate-700">
              <label className="flex items-center gap-2 cursor-pointer hover:text-slate-900">
                <input
                  type="checkbox"
                  checked={exportIncludePenyebab}
                  onChange={(e) => setExportIncludePenyebab(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <span>Penyebab Gangguan</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer hover:text-slate-900">
                <input
                  type="checkbox"
                  checked={exportIncludeKode}
                  onChange={(e) => setExportIncludeKode(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <span>Kode Gangguan</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer hover:text-slate-900">
                <input
                  type="checkbox"
                  checked={exportIncludeArus}
                  onChange={(e) => setExportIncludeArus(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <span>Arus Proteksi (R/S/T/IN)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer hover:text-slate-900">
                <input
                  type="checkbox"
                  checked={exportIncludeLokasi}
                  onChange={(e) => setExportIncludeLokasi(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <span>Detail Lokasi</span>
              </label>
            </div>
          </div>
        )}

        {/* Content View: Animated Expandable Cards or Table */}
        {isLoading ? (
          <TableSkeletonLoader columns={9} rows={7} headerTitle="Log Gangguan & Trip" />
        ) : viewLayout === 'cards' ? (
          /* Cards Interaktif with Framer Motion layout & expansion */
          <div className="space-y-3">
            {filteredList.length === 0 ? (
              <div className="p-12 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-slate-400 text-xs">
                Tidak ada data log gangguan yang sesuai dengan filter pencarian.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3.5">
                {filteredList.map((g) => {
                  const isExpanded = expandedGangguanId === g.id;
                  const isPangkal = isSectionFromGi(g.section);

                  return (
                    <motion.div
                      layout
                      key={g.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ layout: { duration: 0.28, type: 'spring', stiffness: 350, damping: 28 } }}
                      className={`border rounded-2xl transition-all shadow-xs overflow-hidden ${
                        isExpanded
                          ? 'border-blue-300 bg-white ring-2 ring-blue-500/10'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      {/* Card Header (Summary) - Clickable */}
                      <div
                        onClick={() => setExpandedGangguanId(isExpanded ? null : g.id)}
                        className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/70 transition-colors select-none"
                      >
                        <div className="flex items-start md:items-center gap-3.5">
                          <div className={`p-2.5 rounded-xl shrink-0 ${
                            isPangkal
                              ? 'bg-rose-50 text-rose-600 border border-rose-200'
                              : 'bg-blue-50 text-blue-600 border border-blue-200'
                          }`}>
                            <Zap className="w-5 h-5" />
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-extrabold text-sm text-slate-900">{g.namaPenyulang}</span>
                              <span className="text-xs font-bold text-slate-600">({g.section})</span>
                              {isPangkal && (
                                <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 font-extrabold text-[9px] uppercase tracking-wider">
                                  Trip Pangkal (PMT GI)
                                </span>
                              )}
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[10px]">
                                {g.kodeGangguan === 'E-5' ? 'Kode: Tidak Ditemukan' : `Kode: ${g.kodeGangguan}`}
                              </span>
                            </div>

                            <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                              <span className="flex items-center gap-1 font-mono text-[11px] text-slate-600">
                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                {g.tanggal}
                              </span>
                              <span className="text-slate-300">•</span>
                              <span className="flex items-center gap-1 font-mono text-[11px] text-slate-600">
                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                {g.jamKeluar} - {g.jamMasuk}
                              </span>
                              <span className="text-slate-300">•</span>
                              <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-mono font-bold text-[10px] border border-emerald-200/60">
                                Durasi: {g.durasi}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Right side: Quick stats & Expand toggle */}
                        <div className="flex items-center justify-between md:justify-end gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                          <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/60">
                            <span className="font-bold text-slate-800">Relay:</span> {g.relayBekerja || '-'}
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold text-blue-600 hidden sm:inline">
                              {isExpanded ? 'Tutup Detail' : 'Buka Detail'}
                            </span>
                            <motion.div
                              animate={{ rotate: isExpanded ? 180 : 0 }}
                              transition={{ duration: 0.2 }}
                              className="p-1 rounded-lg bg-slate-100 text-slate-500"
                            >
                              <ChevronDown className="w-4 h-4" />
                            </motion.div>
                          </div>
                        </div>
                      </div>

                      {/* Smoothly Expandable Detailed Content */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                            className="overflow-hidden border-t border-slate-100 bg-slate-50/50"
                          >
                            <div className="p-4 md:p-5 space-y-4 text-xs">
                              {/* 3-Column Technical Breakdown Grid */}
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Section 1: Proteksi & Arus Gangguan */}
                                <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-2.5 shadow-2xs">
                                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
                                    <Activity className="w-4 h-4 text-rose-500" />
                                    <span>Relay & Arus Gangguan</span>
                                  </div>
                                  <div className="space-y-1.5">
                                    <div className="flex justify-between items-center text-slate-600">
                                      <span>Relay Bekerja:</span>
                                      <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">{g.relayBekerja || '-'}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-slate-600">
                                      <span>Kode Gangguan:</span>
                                      <span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
                                        {g.kodeGangguan === 'E-5' ? 'E-5 (Tidak Ditemukan)' : g.kodeGangguan}
                                      </span>
                                    </div>

                                    {/* Arus Meters */}
                                    <div className="pt-2 border-t border-slate-100 space-y-1 font-mono text-[11px]">
                                      <div className="flex justify-between items-center">
                                        <span className="font-bold text-red-600">Fasa R:</span>
                                        <span className="font-semibold text-slate-800">{g.arusR > 0 && g.arusR < 50 ? `${g.arusR} kA` : `${g.arusR || 0} A`}</span>
                                      </div>
                                      <div className="flex justify-between items-center">
                                        <span className="font-bold text-amber-600">Fasa S:</span>
                                        <span className="font-semibold text-slate-800">{g.arusS > 0 && g.arusS < 50 ? `${g.arusS} kA` : `${g.arusS || 0} A`}</span>
                                      </div>
                                      <div className="flex justify-between items-center">
                                        <span className="font-bold text-blue-600">Fasa T:</span>
                                        <span className="font-semibold text-slate-800">{g.arusT > 0 && g.arusT < 50 ? `${g.arusT} kA` : `${g.arusT || 0} A`}</span>
                                      </div>
                                      <div className="flex justify-between items-center">
                                        <span className="font-bold text-emerald-600">Netral (IN):</span>
                                        <span className="font-semibold text-slate-800">{g.arusIN > 0 && g.arusIN < 50 ? `${g.arusIN} kA` : `${g.arusIN || 0} A`}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Section 2: Waktu & Pemadaman */}
                                <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-2.5 shadow-2xs">
                                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
                                    <Clock className="w-4 h-4 text-blue-500" />
                                    <span>Waktu & Pemadaman</span>
                                  </div>
                                  <div className="space-y-2 text-slate-600">
                                    <div className="flex justify-between">
                                      <span>Tanggal Padam:</span>
                                      <span className="font-mono font-bold text-slate-900">{g.tanggal}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>Jam Keluar (Trip):</span>
                                      <span className="font-mono font-bold text-rose-600">{g.jamKeluar || '-'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>Jam Masuk (Normal):</span>
                                      <span className="font-mono font-bold text-emerald-600">{g.jamMasuk || '-'}</span>
                                    </div>
                                    <div className="flex justify-between pt-1 border-t border-slate-100">
                                      <span>Total Durasi Padam:</span>
                                      <span className="font-mono font-black text-slate-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                        {g.durasi || '-'}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Section 3: Titik Lokasi & Penyebab */}
                                <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-2.5 shadow-2xs">
                                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
                                    <Layers className="w-4 h-4 text-emerald-500" />
                                    <span>Lokasi & Investigasi</span>
                                  </div>
                                  <div className="space-y-2">
                                    <div>
                                      <span className="text-[10px] text-slate-400 block font-bold uppercase">Section / Segmen:</span>
                                      <span className="font-bold text-slate-900">{g.section || '-'}</span>
                                    </div>
                                    <div>
                                      <span className="text-[10px] text-slate-400 block font-bold uppercase">Detail Titik Lokasi:</span>
                                      <span className="text-slate-800 font-medium">{g.detailLokasi || 'Tidak ada detail titik spesifik'}</span>
                                    </div>
                                    <div>
                                      <span className="text-[10px] text-slate-400 block font-bold uppercase">Penyebab Lapangan:</span>
                                      <span className="text-slate-800 font-semibold">{g.penyebab || 'Belum teridentifikasi'}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Card Action Bar */}
                              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200">
                                <div className="flex items-center gap-2">
                                  {g.fotoPenyebab && (
                                    <button
                                      type="button"
                                      onClick={() => setSelectedPhoto(g.fotoPenyebab!)}
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                                    >
                                      <Camera className="w-3.5 h-3.5 text-blue-600" />
                                      <span>Lihat Foto Dokumentasi</span>
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() => analyzeRootCause(g)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-violet-50 hover:bg-violet-100 border border-violet-200 text-violet-700 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
                                    title="Gunakan AI untuk analisa pola gangguan & rekomendasi"
                                  >
                                    <BrainCircuit className="w-3.5 h-3.5 text-violet-600" />
                                    <span>Analisis Akar Masalah (AI)</span>
                                  </button>
                                </div>

                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingGangguan(g);
                                      setIsModalOpen(true);
                                    }}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                                  >
                                    <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                                    <span>Edit Record</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => onDeleteGangguan(g.id)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                                    <span>Hapus</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* Table View */
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs text-slate-800">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[11px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3.5">Tanggal</th>
                  <th className="px-4 py-3.5">Penyulang</th>
                  <th className="px-4 py-3.5">Section</th>
                  <th className="px-4 py-3.5">Jam Out / In</th>
                  <th className="px-4 py-3.5">Durasi</th>
                  <th className="px-4 py-3.5">Relay / Kode</th>
                  <th className="px-4 py-3.5">Arus (R/S/T/IN)</th>
                  <th className="px-4 py-3.5">Penyebab / Lokasi</th>
                  <th className="px-4 py-3.5 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredList.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-slate-400">
                      Tidak ada data log gangguan.
                    </td>
                  </tr>
                ) : (
                  filteredList.map((g) => (
                    <tr key={g.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3.5 font-mono text-slate-500">{g.tanggal}</td>
                      <td className="px-4 py-3.5 font-bold text-blue-600">{g.namaPenyulang}</td>
                      <td className="px-4 py-3.5 text-slate-700 text-[11px]">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-slate-800">{g.section}</span>
                          {isSectionFromGi(g.section) && (
                            <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-extrabold text-[9px] uppercase tracking-wider shrink-0">
                              GI / Pangkal
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-slate-500">{g.jamKeluar} - {g.jamMasuk}</td>
                      <td className="px-4 py-3.5">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-mono font-bold text-[11px]">
                          {g.durasi}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-slate-700 font-semibold">{g.relayBekerja}</span>
                        <span className="ml-1.5 px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 font-bold text-[10px]">
                          {g.kodeGangguan === 'E-5' ? 'Tidak Ditemukan' : g.kodeGangguan}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-[11px] text-slate-700 whitespace-nowrap">
                        <span className="font-bold text-slate-800">R:</span> {g.arusR > 0 && g.arusR < 50 ? `${g.arusR} kA` : `${g.arusR || 0} A`} <span className="text-slate-300">|</span>{' '}
                        <span className="font-bold text-slate-800">S:</span> {g.arusS > 0 && g.arusS < 50 ? `${g.arusS} kA` : `${g.arusS || 0} A`} <span className="text-slate-300">|</span>{' '}
                        <span className="font-bold text-slate-800">T:</span> {g.arusT > 0 && g.arusT < 50 ? `${g.arusT} kA` : `${g.arusT || 0} A`} <span className="text-slate-300">|</span>{' '}
                        <span className="font-bold text-slate-800">IN:</span> {g.arusIN > 0 && g.arusIN < 50 ? `${g.arusIN} kA` : `${g.arusIN || 0} A`}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-900">{g.penyebab}</div>
                        <span className="text-[10px] text-slate-400 block">{g.detailLokasi}</span>
                        {g.fotoPenyebab && (
                          <button
                            type="button"
                            onClick={() => setSelectedPhoto(g.fotoPenyebab!)}
                            className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 rounded-md text-[10px] font-bold transition-all cursor-pointer shadow-2xs"
                          >
                            <Camera className="w-3 h-3 text-blue-600" />
                            <span>Lihat Dokumentasi Foto</span>
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => analyzeRootCause(g)}
                            className="p-1.5 rounded-lg hover:bg-violet-50 text-slate-400 hover:text-violet-600 transition-colors cursor-pointer"
                            title="Analisis Penyebab Akar (AI)"
                          >
                            <BrainCircuit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingGangguan(g);
                              setIsModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                            title="Edit Record Gangguan"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDeleteGangguan(g.id)}
                            className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Hapus Record"
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
        )}
      </div>

      {/* Input Gangguan Modal */}
      <InputGangguanModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingGangguan(null);
        }}
        onSave={onAddGangguan}
        penyulangList={penyulangList}
        sectionList={sectionList}
        editItem={editingGangguan}
      />

      {/* Modal Preview Dokumentasi Foto Penyebab Gangguan */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-2xl max-w-2xl w-full flex flex-col space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">Dokumentasi Penyebab Gangguan</h3>
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Foto Dokumentasi Lapangan</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedPhoto(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-950 rounded-2xl overflow-hidden flex items-center justify-center max-h-[65vh] p-2 border border-slate-800">
              <img
                src={selectedPhoto}
                alt="Dokumentasi Penyebab Gangguan"
                className="max-h-[60vh] w-auto object-contain rounded-xl"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <a
                href={selectedPhoto}
                download="dokumentasi-penyebab-gangguan.png"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh File Foto</span>
              </a>
              <button
                onClick={() => setSelectedPhoto(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal Analisis Penyebab Akar */}
      {analysisResult.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xl max-w-2xl w-full flex flex-col space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <BrainCircuit className="w-5 h-5 text-violet-600" />
                Analisis Penyebab Akar (AI)
              </h3>
              <button onClick={() => setAnalysisResult({ ...analysisResult, isOpen: false })} className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="prose prose-sm max-w-none text-slate-700 max-h-[60vh] overflow-y-auto whitespace-pre-line">
              {analysisResult.loading ? "Sedang menganalisis..." : analysisResult.result}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
