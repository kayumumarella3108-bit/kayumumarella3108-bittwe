import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend
} from 'recharts';
import {
  Calculator,
  Calendar,
  Clock,
  Filter,
  Download,
  Printer,
  Search,
  Zap,
  TrendingUp,
  Users,
  AlertTriangle,
  Layers,
  ChevronDown,
  RefreshCw,
  FileSpreadsheet,
  Info,
  FileText,
  X
} from 'lucide-react';
import { GangguanLog, Penyulang, SectionJaringan, User } from '../../types';
import { generateSaidiSaifiPDF } from '../../utils/pdfGenerator';

interface EstimasiSaidiSaifiViewProps {
  currentUser?: User | null;
  gangguanList: GangguanLog[];
  penyulangList: Penyulang[];
  sectionList: SectionJaringan[];
  onSelectView?: (view: any) => void;
}

export const EstimasiSaidiSaifiView: React.FC<EstimasiSaidiSaifiViewProps> = ({
  currentUser,
  gangguanList,
  penyulangList,
  sectionList,
  onSelectView
}) => {
  // Filters
  const [selectedYear, setSelectedYear] = useState<string>('2026');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedPenyulangId, setSelectedPenyulangId] = useState<string>('all');
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [customerSearchQuery, setCustomerSearchQuery] = useState<string>('');
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);
  const [syncWithDataPadam, setSyncWithDataPadam] = useState<boolean>(true);
  const [trendChartMode, setTrendChartMode] = useState<'saidi' | 'saifi' | 'both'>('saidi');
  // Calculate total ULP customers from Master Data (sum of all penyulangs or sections)
  const masterDataTotalUlp = useMemo(() => {
    const sumFromPenyulang = penyulangList.reduce((acc, p) => {
      const fSections = sectionList.filter(
        (s) => s.penyulangId === p.id || s.namaPenyulang?.toLowerCase() === p.namaPenyulang?.toLowerCase()
      );
      const sumSec = fSections.reduce((sAcc, s) => sAcc + (s.jumlahPelanggan || 0), 0);
      const pPlg = p.jumlahPelanggan && p.jumlahPelanggan > 0 ? p.jumlahPelanggan : sumSec;
      return acc + pPlg;
    }, 0);

    if (sumFromPenyulang > 0) return sumFromPenyulang;

    const sumFromSections = sectionList.reduce(
      (acc, s) => acc + (s.jumlahPelanggan || 0),
      0
    );
    return sumFromSections > 0 ? sumFromSections : 91740;
  }, [sectionList, penyulangList]);

  const [totalPelangganUlp, setTotalPelangganUlp] = useState<number>(masterDataTotalUlp || 91740);

  // Sync initial state when master data loads
  React.useEffect(() => {
    if (masterDataTotalUlp > 0) {
      setTotalPelangganUlp(masterDataTotalUlp);
    }
  }, [masterDataTotalUlp]);

  // Selected feeder customer calculation
  const selectedFeederInfo = useMemo(() => {
    if (selectedPenyulangId === 'all') return null;
    const p = penyulangList.find((item) => item.id === selectedPenyulangId);
    if (!p) return null;
    
    const fSections = sectionList.filter(
      (s) => s.penyulangId === p.id || s.namaPenyulang?.toLowerCase() === p.namaPenyulang?.toLowerCase()
    );
    const sumSecPlg = fSections.reduce((acc, curr) => acc + (curr.jumlahPelanggan || 0), 0);
    const totalPlgFeeder = p.jumlahPelanggan && p.jumlahPelanggan > 0 ? p.jumlahPelanggan : sumSecPlg;

    return {
      penyulang: p,
      sections: fSections,
      totalPlgFeeder
    };
  }, [selectedPenyulangId, penyulangList, sectionList]);

  // Master Data Customer Monitoring list
  const penyulangWithStats = useMemo(() => {
    return penyulangList.map((p) => {
      const fSections = sectionList.filter(
        (s) => s.penyulangId === p.id || s.namaPenyulang?.toLowerCase() === p.namaPenyulang?.toLowerCase()
      );
      const sumSecPlg = fSections.reduce((acc, curr) => acc + (curr.jumlahPelanggan || 0), 0);
      const calculatedPlg = p.jumlahPelanggan && p.jumlahPelanggan > 0 ? p.jumlahPelanggan : sumSecPlg;
      const pctUlp = masterDataTotalUlp > 0 ? (calculatedPlg / masterDataTotalUlp) * 100 : 0;

      return {
        ...p,
        sections: fSections,
        calculatedPlg,
        pctUlp
      };
    }).filter((item) => {
      if (!customerSearchQuery) return true;
      const q = customerSearchQuery.toLowerCase();
      return (
        item.namaPenyulang.toLowerCase().includes(q) ||
        (item.kodeId && item.kodeId.toLowerCase().includes(q)) ||
        (item.namaGi && item.namaGi.toLowerCase().includes(q))
      );
    });
  }, [penyulangList, sectionList, masterDataTotalUlp, customerSearchQuery]);

  // Helper to parse duration into minutes
  const parseDurasiMenit = (log: GangguanLog): number => {
    if (log.jamKeluar && log.jamMasuk) {
      try {
        const [hOut, mOut] = log.jamKeluar.split(':').map(Number);
        const [hIn, mIn] = log.jamMasuk.split(':').map(Number);
        let diffMinutes = (hIn * 60 + mIn) - (hOut * 60 + mOut);
        if (diffMinutes < 0) diffMinutes += 24 * 60;
        return diffMinutes;
      } catch {
        return 60;
      }
    }
    return 60;
  };

  // Helper to get customers for a log synced with Master Data Section & Penyulang
  const getJumlahPelangganPadam = (log: GangguanLog): number => {
    // If syncWithDataPadam is true, prioritize direct input from "Data Padam" (GangguanLog)
    if (syncWithDataPadam && log.jumlahPelangganPadam && log.jumlahPelangganPadam > 0) {
      return log.jumlahPelangganPadam;
    }

    const normalize = (str?: string) => (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');

    // 1. Check section match in Master Data Section
    if (log.section) {
      const logNorm = normalize(log.section);
      const matchSec = sectionList.find((s) => {
        const sNorm = normalize(s.namaSection);
        return sNorm === logNorm || sNorm.includes(logNorm) || logNorm.includes(sNorm);
      });
      if (matchSec && matchSec.jumlahPelanggan !== undefined && matchSec.jumlahPelanggan !== null && matchSec.jumlahPelanggan > 0) {
        return matchSec.jumlahPelanggan;
      }
    }

    // 2. Check penyulang match in Master Data Penyulang (for feeder trip or whole feeder)
    if (log.penyulangId || log.namaPenyulang) {
      const pMatch = penyulangList.find(
        (p) => p.id === log.penyulangId || normalize(p.namaPenyulang) === normalize(log.namaPenyulang)
      );
      if (pMatch) {
        const fSections = sectionList.filter(
          (s) => s.penyulangId === pMatch.id || normalize(s.namaPenyulang) === normalize(pMatch.namaPenyulang)
        );
        const sumSec = fSections.reduce((acc, curr) => acc + (curr.jumlahPelanggan || 0), 0);
        const pPlg = pMatch.jumlahPelanggan && pMatch.jumlahPelanggan > 0 ? pMatch.jumlahPelanggan : sumSec;
        if (pPlg > 0) {
          return pPlg;
        }
      }
    }

    // 3. Fallback to saved customer count on log
    if (log.jumlahPelangganPadam && log.jumlahPelangganPadam > 0) {
      return log.jumlahPelangganPadam;
    }
    return 0;
  };

  // Filtered Gangguan Logs
  const filteredLogs = useMemo(() => {
    return gangguanList.filter((log) => {
      if (!log.tanggal) return false;
      const [year, monthStr] = log.tanggal.split('-');

      // Year filter
      if (selectedYear !== 'all' && year !== selectedYear) return false;

      // Month filter
      if (selectedMonth !== 'all') {
        const monthNum = parseInt(monthStr, 10);
        if (monthNum !== parseInt(selectedMonth, 10)) return false;
      }

      // Date range filter
      if (startDate && log.tanggal < startDate) return false;
      if (endDate && log.tanggal > endDate) return false;

      // Penyulang filter
      if (selectedPenyulangId !== 'all') {
        const selPenyulang = penyulangList.find((p) => p.id === selectedPenyulangId);
        if (selPenyulang) {
          if (
            log.penyulangId !== selectedPenyulangId &&
            log.namaPenyulang?.toLowerCase() !== (selPenyulang?.namaPenyulang || '').toLowerCase()
          ) {
            return false;
          }
        }
      }

      // Section filter
      if (selectedSection !== 'all' && log.section) {
        if (log.section.toLowerCase() !== selectedSection.toLowerCase()) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchFeeder = (log.namaPenyulang || '').toLowerCase().includes(q);
        const matchSec = (log.section || '').toLowerCase().includes(q);
        const matchLokasi = (log.detailLokasi || '').toLowerCase().includes(q);
        const matchPenyebab = (log.penyebab || '').toLowerCase().includes(q);
        const matchKode = (log.kodeGangguan || '').toLowerCase().includes(q);
        if (!matchFeeder && !matchSec && !matchLokasi && !matchPenyebab && !matchKode) {
          return false;
        }
      }

      return true;
    });
  }, [
    gangguanList,
    selectedYear,
    selectedMonth,
    startDate,
    endDate,
    selectedPenyulangId,
    selectedSection,
    searchQuery,
    penyulangList
  ]);

  // Calculations
  const metrics = useMemo(() => {
    let totalSaidiMenit = 0;
    let totalSaifi = 0;
    let totalPelangganPadamAccum = 0;
    let totalDurasiPadamMenit = 0;

    const safeUlp = totalPelangganUlp > 0 ? totalPelangganUlp : masterDataTotalUlp || 91740;

    filteredLogs.forEach((log) => {
      if (log.sectionRestorations && log.sectionRestorations.length > 0) {
        let logSaidi = 0;
        let logSaifi = 0;
        let logPlg = 0;
        let maxLogDur = 0;

        log.sectionRestorations.forEach((sec) => {
          const secDur = sec.durasiMenit || parseDurasiMenit({ ...log, jamKeluar: sec.jamKeluar, jamMasuk: sec.jamMasuk });
          const secPlg = sec.jumlahPelanggan || 0;
          logSaidi += safeUlp > 0 ? (secPlg * secDur) / safeUlp : 0;
          logSaifi += safeUlp > 0 ? secPlg / safeUlp : 0;
          logPlg += secPlg;
          if (secDur > maxLogDur) maxLogDur = secDur;
        });

        totalSaidiMenit += logSaidi;
        totalSaifi += logSaifi;
        totalPelangganPadamAccum += logPlg;
        totalDurasiPadamMenit += maxLogDur;
      } else {
        const durasiMenit = parseDurasiMenit(log);
        const jmlPlg = getJumlahPelangganPadam(log);

        const eventSaifi = jmlPlg / safeUlp;
        const eventSaidiMenit = (jmlPlg * durasiMenit) / safeUlp;

        totalSaidiMenit += eventSaidiMenit;
        totalSaifi += eventSaifi;
        totalPelangganPadamAccum += jmlPlg;
        totalDurasiPadamMenit += durasiMenit;
      }
    });

    const totalSaidiJam = totalSaidiMenit / 60;
    const totalDurasiPadamJam = totalDurasiPadamMenit / 60;

    return {
      totalSaidiMenit,
      totalSaidiJam,
      totalSaifi,
      totalPelangganPadamAccum,
      totalDurasiPadamMenit,
      totalDurasiPadamJam,
      totalEvents: filteredLogs.length
    };
  }, [filteredLogs, totalPelangganUlp, sectionList, syncWithDataPadam, penyulangList]);

  const {
    totalSaidiMenit,
    totalSaidiJam,
    totalSaifi,
    totalPelangganPadamAccum,
    totalDurasiPadamMenit
  } = metrics;

  // Monthly 12-Month SAIDI / SAIFI Trend Calculation from gangguanList
  const monthlyTrendData = useMemo(() => {
    const months = [
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

    const safeUlp = totalPelangganUlp > 0 ? totalPelangganUlp : masterDataTotalUlp || 91740;

    return months.map((m) => {
      let saidiMenit = 0;
      let saifi = 0;
      let eventCount = 0;

      gangguanList.forEach((log) => {
        if (!log.tanggal) return;
        const [yStr, mStr] = log.tanggal.split('-');
        if (selectedYear !== 'all' && yStr !== selectedYear) return;
        if (parseInt(mStr, 10) !== m.key) return;

        eventCount += 1;

        if (log.sectionRestorations && log.sectionRestorations.length > 0) {
          log.sectionRestorations.forEach((sec) => {
            const secDur = sec.durasiMenit || parseDurasiMenit({ ...log, jamKeluar: sec.jamKeluar, jamMasuk: sec.jamMasuk });
            const secPlg = sec.jumlahPelanggan || 0;
            saidiMenit += safeUlp > 0 ? (secPlg * secDur) / safeUlp : 0;
            saifi += safeUlp > 0 ? secPlg / safeUlp : 0;
          });
        } else {
          const durasiMenit = parseDurasiMenit(log);
          const jmlPlg = getJumlahPelangganPadam(log);
          saidiMenit += safeUlp > 0 ? (jmlPlg * durasiMenit) / safeUlp : 0;
          saifi += safeUlp > 0 ? jmlPlg / safeUlp : 0;
        }
      });

      return {
        bulanShort: m.name,
        bulanFull: m.full,
        saidiMenit: parseFloat(saidiMenit.toFixed(3)),
        saidiJam: parseFloat((saidiMenit / 60).toFixed(4)),
        saifi: parseFloat(saifi.toFixed(4)),
        eventCount
      };
    });
  }, [gangguanList, selectedYear, totalPelangganUlp, masterDataTotalUlp]);

  const CustomTrendTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs space-y-1.5 max-w-xs">
          <div className="flex items-center justify-between font-extrabold border-b border-slate-800 pb-1 text-amber-300">
            <span>{data.bulanFull} {selectedYear !== 'all' ? selectedYear : ''}</span>
            <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 text-[10px] font-extrabold">
              {data.eventCount} Kejadian Padam
            </span>
          </div>

          <div className="space-y-1 font-mono text-[11px]">
            {trendChartMode === 'saidi' && (
              <div className="flex justify-between text-blue-300 font-bold">
                <span>Estimasi SAIDI:</span>
                <span>{data.saidiMenit.toFixed(3)} m/plg ({data.saidiJam.toFixed(3)} jam)</span>
              </div>
            )}

            {trendChartMode === 'saifi' && (
              <div className="flex justify-between text-purple-300 font-bold">
                <span>Estimasi SAIFI:</span>
                <span>{data.saifi.toFixed(4)} kali/plg</span>
              </div>
            )}

            {trendChartMode === 'both' && (
              <>
                <div className="flex justify-between text-blue-300">
                  <span>Estimasi SAIDI:</span>
                  <span className="font-bold">{data.saidiMenit.toFixed(3)} m/plg</span>
                </div>
                <div className="flex justify-between text-purple-300">
                  <span>Estimasi SAIFI:</span>
                  <span className="font-bold">{data.saifi.toFixed(4)} kali/plg</span>
                </div>
              </>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  // Group by Penyulang for Charts & Summary
  const feederBreakdown = useMemo(() => {
    const map: Record<
      string,
      {
        namaPenyulang: string;
        count: number;
        saidiMenit: number;
        saifi: number;
        pelangganPadam: number;
        durasiMenit: number;
        feederCustomerCount: number;
      }
    > = {};

    const safeUlp = totalPelangganUlp > 0 ? totalPelangganUlp : masterDataTotalUlp || 88281;

    filteredLogs.forEach((log) => {
      const name = log.namaPenyulang || 'Lainnya';
      const durasiMenit = parseDurasiMenit(log);
      const jmlPlg = getJumlahPelangganPadam(log);
      const eventSaifi = jmlPlg / safeUlp;
      const eventSaidiMenit = (jmlPlg * durasiMenit) / safeUlp;

      if (!map[name]) {
        const pMatch = penyulangList.find((p) => p.namaPenyulang?.toLowerCase() === name.toLowerCase());
        const feederPlg = pMatch?.jumlahPelanggan || 0;

        map[name] = {
          namaPenyulang: name,
          count: 0,
          saidiMenit: 0,
          saifi: 0,
          pelangganPadam: 0,
          durasiMenit: 0,
          feederCustomerCount: feederPlg > 0 ? feederPlg : jmlPlg
        };
      }

      map[name].count += 1;
      map[name].saidiMenit += eventSaidiMenit;
      map[name].saifi += eventSaifi;
      map[name].pelangganPadam += jmlPlg;
      map[name].durasiMenit += durasiMenit;
    });

    return Object.values(map).sort((a, b) => b.saidiMenit - a.saidiMenit);
  }, [filteredLogs, totalPelangganUlp, masterDataTotalUlp, penyulangList]);

  // Section Breakdown
  const sectionBreakdown = useMemo(() => {
    const map: Record<
      string,
      {
        section: string;
        namaPenyulang: string;
        count: number;
        saidiMenit: number;
        pelangganPadam: number;
        sectionCustomerCount: number;
      }
    > = {};

    const safeUlp = totalPelangganUlp > 0 ? totalPelangganUlp : masterDataTotalUlp || 88281;

    filteredLogs.forEach((log) => {
      const secName = log.section || 'General Section';
      const durasiMenit = parseDurasiMenit(log);
      const jmlPlg = getJumlahPelangganPadam(log);
      const eventSaidiMenit = (jmlPlg * durasiMenit) / safeUlp;

      if (!map[secName]) {
        map[secName] = {
          section: secName,
          namaPenyulang: log.namaPenyulang || '-',
          count: 0,
          saidiMenit: 0,
          pelangganPadam: 0,
          sectionCustomerCount: jmlPlg
        };
      }

      map[secName].count += 1;
      map[secName].saidiMenit += eventSaidiMenit;
      map[secName].pelangganPadam += jmlPlg;
    });

    return Object.values(map).sort((a, b) => b.saidiMenit - a.saidiMenit);
  }, [filteredLogs, totalPelangganUlp, masterDataTotalUlp]);

  // Export PDF directly using jsPDF
  const handleExportPDF = () => {
    const selectedMonthObj = monthsList.find((m) => m.value === selectedMonth);
    generateSaidiSaifiPDF({
      filteredLogs,
      totalPelangganUlp: totalPelangganUlp || masterDataTotalUlp || 88281,
      totalSaidiMenit,
      totalSaidiJam,
      totalSaifi,
      totalPelangganPadamAccum,
      totalDurasiPadamMenit,
      topSections: sectionBreakdown,
      selectedMonthLabel: selectedMonthObj ? selectedMonthObj.label : 'Semua Bulan'
    });
  };

  // Open Printable Preview Modal
  const handlePrintReport = () => {
    setShowPrintModal(true);
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'Tanggal',
      'Penyulang',
      'Section Padam',
      'Jam Out',
      'Jam In',
      'Durasi (Menit)',
      'Pelanggan Padam (Section)',
      'Total Pelanggan ULP',
      'Estimasi SAIDI (Menit/Plg)',
      'Estimasi SAIDI (Jam/Plg)',
      'Estimasi SAIFI (Kali/Plg)',
      'Penyebab',
      'Kode Gangguan',
      'Detail Lokasi'
    ];

    const safeUlp = totalPelangganUlp > 0 ? totalPelangganUlp : masterDataTotalUlp || 91740;

    const rows = filteredLogs.map((log) => {
      const durasiMenit = parseDurasiMenit(log);
      const jmlPlg = getJumlahPelangganPadam(log);
      const eSaifi = jmlPlg / safeUlp;
      const eSaidiM = (jmlPlg * durasiMenit) / safeUlp;
      const eSaidiJ = eSaidiM / 60;

      return [
        `"${log.tanggal || ''}"`,
        `"${log.namaPenyulang || ''}"`,
        `"${log.section || ''}"`,
        `"${log.jamKeluar || ''}"`,
        `"${log.jamMasuk || ''}"`,
        durasiMenit,
        jmlPlg,
        safeUlp,
        eSaidiM.toFixed(4),
        eSaidiJ.toFixed(5),
        eSaifi.toFixed(5),
        `"${log.penyebab || ''}"`,
        `"${log.kodeGangguan || ''}"`,
        `"${log.detailLokasi || ''}"`
      ];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Estimasi_SAIDI_SAIFI_Event_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const monthsList = [
    { value: 'all', label: 'Semua Bulan' },
    { value: '1', label: 'Januari' },
    { value: '2', label: 'Februari' },
    { value: '3', label: 'Maret' },
    { value: '4', label: 'April' },
    { value: '5', label: 'Mei' },
    { value: '6', label: 'Juni' },
    { value: '7', label: 'Juli' },
    { value: '8', label: 'Agustus' },
    { value: '9', label: 'September' },
    { value: '10', label: 'Oktober' },
    { value: '11', label: 'November' },
    { value: '12', label: 'Desember' }
  ];

  return (
    <div className="p-4 sm:p-6 space-y-6 bg-slate-50 min-h-screen text-slate-800 font-sans print:bg-white print:p-0">
      
      {/* HEADER BAR */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm print:border-none print:shadow-none">
        <div className="flex items-start gap-3">
          <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-2xl shadow-md shadow-blue-500/20 shrink-0">
            <Calculator className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                Monitoring Estimasi SAIDI & SAIFI Gangguan
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-100 border border-blue-200 text-blue-700 text-[10px] font-extrabold uppercase tracking-wide">
                Dedicated Per Event
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
              Kalkulasi estimasi indeks keandalan SAIDI & SAIFI berdasarkan data section padam & durasi gangguan trip pada setiap event. Monitoring ini <strong>terpisah dan terpisah independen</strong> dari SAIDI/SAIFI komulatif bulanan.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 shrink-0 print:hidden">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl font-bold text-xs transition-all shadow-xs cursor-pointer"
            title="Export data ke format CSV Spreadsheet"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs transition-all shadow-sm cursor-pointer"
            title="Unduh langsung file laporan PDF"
          >
            <Download className="w-4 h-4" />
            <span>Export PDF</span>
          </button>

          <button
            onClick={handlePrintReport}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs transition-all shadow-md shadow-blue-500/20 cursor-pointer"
            title="Buka pratinjau & cetak dokumen laporan"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Laporan PDF</span>
          </button>
        </div>
      </div>

      {/* ISOLATION NOTICE BOX */}
      <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-amber-900 text-xs shadow-xs print:hidden">
        <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-extrabold text-amber-900">
            Penjelasan Metode Estimasi SAIDI / SAIFI Per Event & Section:
          </span>
          <p className="text-amber-800 leading-relaxed">
            • <strong>Rumus Estimasi SAIFI Event</strong> = <span className="font-mono bg-amber-100 px-1 py-0.5 rounded">Jumlah Pelanggan Padam Section / Total Pelanggan ULP</span><br />
            • <strong>Rumus Estimasi SAIDI Event</strong> = <span className="font-mono bg-amber-100 px-1 py-0.5 rounded">(Jumlah Pelanggan Padam Section × Durasi Padam Menit) / Total Pelanggan ULP</span><br />
            • Nilai ini dihitung langsung dari log input gangguan trip dan dikelompokkan per section padam tanpa mengubah nilai realisasi kumulatif SAIDI SAIFI ULP.
          </p>
        </div>
      </div>

      {/* FILTER TOOLBAR */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-3 print:hidden">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <Filter className="w-4 h-4 text-blue-600" />
            <span>Filter Data Event Gangguan</span>
          </div>

          {/* Customer Base Setting & Sync Mode Toggle */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
              <Users className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-slate-600 font-semibold">Total Plg ULP:</span>
              <input
                type="number"
                value={totalPelangganUlp}
                onChange={(e) => setTotalPelangganUlp(Number(e.target.value))}
                className="w-20 px-2 py-0.5 bg-white border border-slate-300 rounded text-center font-bold text-blue-700 focus:outline-none focus:border-blue-500"
              />
              {masterDataTotalUlp !== totalPelangganUlp && (
                <button
                  onClick={() => setTotalPelangganUlp(masterDataTotalUlp)}
                  className="text-[10px] text-blue-600 font-bold hover:underline cursor-pointer"
                  title="Reset ke total ULP dari Master Data"
                >
                  Sync ({masterDataTotalUlp.toLocaleString('id-ID')})
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
              <input
                type="checkbox"
                id="syncWithDataPadamCheckbox"
                checked={syncWithDataPadam}
                onChange={(e) => setSyncWithDataPadam(e.target.checked)}
                className="w-3.5 h-3.5 text-blue-600 focus:ring-blue-500 border-slate-300 rounded cursor-pointer"
              />
              <label htmlFor="syncWithDataPadamCheckbox" className="text-slate-700 font-bold cursor-pointer select-none">
                Sinkron dengan Data Padam (Rill Log)
              </label>
            </div>
          </div>
        </div>

        {selectedFeederInfo && (
          <div className="p-2.5 bg-blue-50/80 border border-blue-200 rounded-xl text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-blue-600 text-white font-extrabold text-[10px]">
                {selectedFeederInfo.penyulang.kodeId || 'FEEDER'}
              </span>
              <span className="font-bold text-blue-900">
                Penyulang {selectedFeederInfo.penyulang.namaPenyulang}
              </span>
              <span className="text-slate-500">
                ({selectedFeederInfo.sections.length} Section)
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-bold text-blue-800">
                Total Pelanggan Feeder: <span className="font-mono text-blue-900">{selectedFeederInfo.totalPlgFeeder.toLocaleString('id-ID')}</span> Plg
              </span>
              <span className="text-slate-400">|</span>
              <span className="text-slate-600 text-[11px]">
                {((selectedFeederInfo.totalPlgFeeder / (totalPelangganUlp || 1)) * 100).toFixed(1)}% dari Total ULP
              </span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 text-xs">
          {/* Filter Year */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Tahun</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500 cursor-pointer"
            >
              <option value="all">Semua Tahun</option>
              <option value="2026">2026</option>
              <option value="2025">2025</option>
            </select>
          </div>

          {/* Filter Month */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Bulan</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500 cursor-pointer"
            >
              {monthsList.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Dari Tanggal</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Sampai Tanggal</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500"
            />
          </div>

          {/* Filter Penyulang */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Penyulang</label>
            <select
              value={selectedPenyulangId}
              onChange={(e) => {
                setSelectedPenyulangId(e.target.value);
                setSelectedSection('all');
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500 cursor-pointer"
            >
              <option value="all">Semua Penyulang</option>
              {penyulangList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.namaPenyulang}
                </option>
              ))}
            </select>
          </div>

          {/* Search Query */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Cari Keyword</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Lokasi / Kode..."
                className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Reset Filter Button */}
        {(selectedYear !== '2026' ||
          selectedMonth !== 'all' ||
          startDate ||
          endDate ||
          selectedPenyulangId !== 'all' ||
          selectedSection !== 'all' ||
          searchQuery) && (
          <div className="flex justify-end pt-1">
            <button
              onClick={() => {
                setSelectedYear('2026');
                setSelectedMonth('all');
                setStartDate('');
                setEndDate('');
                setSelectedPenyulangId('all');
                setSelectedSection('all');
                setSearchQuery('');
              }}
              className="flex items-center gap-1 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-semibold transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              Reset Filter
            </button>
          </div>
        )}
      </div>

      {/* METRICS SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Estimasi SAIDI Total */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Estimasi SAIDI Total
            </span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              {metrics.totalSaidiMenit.toFixed(3)}
            </span>
            <span className="text-xs font-bold text-blue-600">Menit/Plg</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center justify-between border-t border-slate-100 pt-2">
            <span>Setara Jam Padam:</span>
            <span className="font-bold text-slate-700">{metrics.totalSaidiJam.toFixed(4)} Jam/Plg</span>
          </div>
        </div>

        {/* Estimasi SAIFI Total */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Estimasi SAIFI Total
            </span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <Zap className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              {metrics.totalSaifi.toFixed(4)}
            </span>
            <span className="text-xs font-bold text-purple-600">Kali/Plg</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center justify-between border-t border-slate-100 pt-2">
            <span>Total Frekuensi Padam:</span>
            <span className="font-bold text-slate-700">{metrics.totalEvents} Event Trip</span>
          </div>
        </div>

        {/* Total Pelanggan Padam */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Pelanggan Terdampak (Akumulasi)
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              {metrics.totalPelangganPadamAccum.toLocaleString('id-ID')}
            </span>
            <span className="text-xs font-bold text-emerald-600">Pelanggan</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center justify-between border-t border-slate-100 pt-2">
            <span>Persentase ULP:</span>
            <span className="font-bold text-slate-700">
              {((metrics.totalPelangganPadamAccum / (totalPelangganUlp || 48500)) * 100).toFixed(1)}% Cum
            </span>
          </div>
        </div>

        {/* Total Durasi Padam */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Durasi Gangguan
            </span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              {metrics.totalDurasiPadamJam.toFixed(2)}
            </span>
            <span className="text-xs font-bold text-rose-600">Jam Total</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center justify-between border-t border-slate-100 pt-2">
            <span>Total Menit Off:</span>
            <span className="font-bold text-slate-700">{metrics.totalDurasiPadamMenit.toLocaleString('id-ID')} Menit</span>
          </div>
        </div>
      </div>

      {/* 12-MONTH SAIDI & SAIFI BAR CHART */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">
                  Grafik Batang Perbandingan SAIDI & SAIFI Bulanan (12 Bulan)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Visualisasi tren keandalan 12 bulan terakhir berdasarkan data kalkulasi gangguan terintegrasi (Tahun {selectedYear !== 'all' ? selectedYear : 'Semua'})
                </p>
              </div>
            </div>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold self-start lg:self-auto">
            <button
              type="button"
              onClick={() => setTrendChartMode('saidi')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                trendChartMode === 'saidi'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              Mode SAIDI (m/plg)
            </button>
            <button
              type="button"
              onClick={() => setTrendChartMode('saifi')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                trendChartMode === 'saifi'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              Mode SAIFI (kali/plg)
            </button>
            <button
              type="button"
              onClick={() => setTrendChartMode('both')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                trendChartMode === 'both'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              Keduanya
            </button>
          </div>
        </div>

        {/* Chart Container */}
        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyTrendData} margin={{ top: 15, right: 15, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="bulanShort" stroke="#64748b" fontSize={11} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
              <Tooltip content={<CustomTrendTooltip />} />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />

              {(trendChartMode === 'saidi' || trendChartMode === 'both') && (
                <Bar
                  dataKey="saidiMenit"
                  name="Estimasi SAIDI (Menit/Plg)"
                  fill="#2563eb"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={32}
                />
              )}

              {(trendChartMode === 'saifi' || trendChartMode === 'both') && (
                <Bar
                  dataKey="saifi"
                  name="Estimasi SAIFI (Kali/Plg)"
                  fill="#9333ea"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={32}
                />
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* FEEDER BREAKDOWN CHARTS & TABLES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Estimasi SAIDI per Penyulang */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              Kontribusi Estimasi SAIDI per Penyulang
            </h3>
            <span className="text-xs text-slate-500 font-semibold">(Menit/Plg)</span>
          </div>

          <div className="space-y-3">
            {feederBreakdown.slice(0, 5).map((f, idx) => {
              const maxSaidi = feederBreakdown[0]?.saidiMenit || 1;
              const pct = Math.min(100, Math.max(8, (f.saidiMenit / maxSaidi) * 100));

              return (
                <div key={idx} className="space-y-1 text-xs">
                  <div className="flex items-center justify-between font-bold text-slate-800">
                    <span className="flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-md bg-blue-50 text-blue-700 flex items-center justify-center text-[10px]">
                        {idx + 1}
                      </span>
                      {f.namaPenyulang}
                    </span>
                    <span className="font-mono text-blue-700">
                      {f.saidiMenit.toFixed(3)} m/plg <span className="text-slate-400 font-normal">({f.count} trip)</span>
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}

            {feederBreakdown.length === 0 && (
              <div className="py-8 text-center text-slate-400 text-xs font-medium">
                Tidak ada data gangguan trip untuk filter terpilih.
              </div>
            )}
          </div>
        </div>

        {/* Section Breakdown Ranking */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-600" />
              Top Section Padam dengan Estimasi SAIDI Terbesar
            </h3>
            <span className="text-xs text-slate-500 font-semibold">(Ranked)</span>
          </div>

          <div className="space-y-2.5">
            {sectionBreakdown.slice(0, 5).map((sec, idx) => (
              <div
                key={idx}
                className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs hover:bg-white hover:border-purple-200 transition-all"
              >
                <div>
                  <div className="font-bold text-slate-900 flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 text-[10px] font-extrabold">
                      #{idx + 1}
                    </span>
                    {sec.section}
                  </div>
                  <span className="text-[11px] text-slate-500 mt-0.5 block">
                    Penyulang: {sec.namaPenyulang} • <span className="font-semibold text-slate-700">{sec.sectionCustomerCount.toLocaleString('id-ID')} Plg</span> <span className="text-purple-600 font-medium">({sec.count}x Event)</span>
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-extrabold text-purple-700 block text-sm">
                    {sec.saidiMenit.toFixed(3)}
                  </span>
                  <span className="text-[10px] text-slate-400">Menit/Plg</span>
                </div>
              </div>
            ))}

            {sectionBreakdown.length === 0 && (
              <div className="py-8 text-center text-slate-400 text-xs font-medium">
                Belum ada data section padam.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MONITORING DATA PELANGGAN MASTER ULP */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm text-slate-900">
                  Monitoring Data Pelanggan ULP (Hasil Penjumlahan Master Data)
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold border border-emerald-200 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  100% Sinkron Master
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Total jumlah pelanggan ULP yang dijumlahkan secara otomatis dari seluruh {penyulangList.length} Penyulang dan {sectionList.length} Section di Data Master.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={customerSearchQuery}
                onChange={(e) => setCustomerSearchQuery(e.target.value)}
                placeholder="Cari Penyulang / GI..."
                className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500"
              />
            </div>
            {onSelectView && (
              <button
                onClick={() => onSelectView('master_data')}
                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Kelola Master Data
              </button>
            )}
          </div>
        </div>

        {/* Master Summary KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-xl space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Total Pelanggan ULP</span>
            <div className="text-lg font-black text-blue-900 font-mono">
              {masterDataTotalUlp.toLocaleString('id-ID')} <span className="text-xs font-normal text-blue-700">Plg</span>
            </div>
            <span className="text-[10px] text-blue-600 block">Sum dari {penyulangList.length} Penyulang Master</span>
          </div>

          <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Total Penyulang (Feeder)</span>
            <div className="text-lg font-black text-indigo-900 font-mono">
              {penyulangList.length} <span className="text-xs font-normal text-indigo-700">Feeder</span>
            </div>
            <span className="text-[10px] text-indigo-600 block">Terhubung GI Passo & Native</span>
          </div>

          <div className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-xl space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Total Section Jaringan</span>
            <div className="text-lg font-black text-emerald-900 font-mono">
              {sectionList.length} <span className="text-xs font-normal text-emerald-700">Section</span>
            </div>
            <span className="text-[10px] text-emerald-600 block">Detail per LBS / Sakelar</span>
          </div>

          <div className="p-3 bg-amber-50/60 border border-amber-100 rounded-xl space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Rata-Rata Plg / Penyulang</span>
            <div className="text-lg font-black text-amber-900 font-mono">
              {Math.round(masterDataTotalUlp / (penyulangList.length || 1)).toLocaleString('id-ID')} <span className="text-xs font-normal text-amber-700">Plg</span>
            </div>
            <span className="text-[10px] text-amber-600 block">Beban rata-rata per feeder</span>
          </div>
        </div>

        {/* Penyulang & Customer Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-3.5 py-2.5">Nama Gardu Induk</th>
                <th className="px-3.5 py-2.5">Kode & Nama Penyulang</th>
                <th className="px-3.5 py-2.5 text-center">Status</th>
                <th className="px-3.5 py-2.5 text-center">Jumlah Section</th>
                <th className="px-3.5 py-2.5 text-right">Jumlah Pelanggan Master</th>
                <th className="px-3.5 py-2.5 text-right">% Kontribusi ULP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {penyulangWithStats.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-3.5 py-2.5 font-bold text-amber-800">{p.namaGi}</td>
                  <td className="px-3.5 py-2.5 font-bold text-slate-900 flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-mono text-[10px]">
                      {p.kodeId}
                    </span>
                    <span>{p.namaPenyulang}</span>
                  </td>
                  <td className="px-3.5 py-2.5 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      p.status === 'Utama' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-3.5 py-2.5 text-center">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-[10px]">
                      {p.sections.length} Section
                    </span>
                  </td>
                  <td className="px-3.5 py-2.5 text-right font-mono font-bold text-blue-700">
                    {p.calculatedPlg.toLocaleString('id-ID')} <span className="text-[10px] text-slate-400 font-normal">Plg</span>
                  </td>
                  <td className="px-3.5 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-blue-600 h-full rounded-full transition-all"
                          style={{ width: `${Math.min(100, p.pctUlp * 4)}%` }}
                        />
                      </div>
                      <span className="font-mono text-[11px] font-bold text-slate-700">
                        {p.pctUlp.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAILED EVENT GANGGUAN TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden space-y-0">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h3 className="font-black text-slate-900 text-sm tracking-tight flex items-center gap-2">
              <Zap className="w-4 h-4 text-rose-600" />
              Log Rincian Event Gangguan Trip & Estimasi SAIDI SAIFI
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Daftar seluruh event gangguan trip penyulang berserta kalkulasi per event
            </p>
          </div>
          <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-bold text-xs shrink-0">
            Total {filteredLogs.length} Event Log
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Tanggal & Jam</th>
                <th className="py-3 px-4">Penyulang & Section</th>
                <th className="py-3 px-4 text-center">Plg Padam (Sec)</th>
                <th className="py-3 px-4 text-center">Durasi Padam</th>
                <th className="py-3 px-4 text-right bg-blue-50/50 text-blue-900">Est. SAIDI (m/plg)</th>
                <th className="py-3 px-4 text-right bg-purple-50/50 text-purple-900">Est. SAIFI (kali/plg)</th>
                <th className="py-3 px-4">Penyebab & Kode</th>
                <th className="py-3 px-4">Detail Lokasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {filteredLogs.map((log) => {
                const durasiMenit = parseDurasiMenit(log);
                const safeUlp = totalPelangganUlp > 0 ? totalPelangganUlp : masterDataTotalUlp || 91740;
                
                let eSaidiM = 0;
                let eSaifi = 0;
                let logJmlPlg = 0;

                if (log.sectionRestorations && log.sectionRestorations.length > 0) {
                  log.sectionRestorations.forEach((sec) => {
                    const secDur = sec.durasiMenit || parseDurasiMenit({ ...log, jamKeluar: sec.jamKeluar, jamMasuk: sec.jamMasuk });
                    const secPlg = sec.jumlahPelanggan || 0;
                    eSaidiM += safeUlp > 0 ? (secPlg * secDur) / safeUlp : 0;
                    eSaifi += safeUlp > 0 ? secPlg / safeUlp : 0;
                    logJmlPlg += secPlg;
                  });
                } else {
                  logJmlPlg = getJumlahPelangganPadam(log);
                  eSaifi = logJmlPlg / safeUlp;
                  eSaidiM = (logJmlPlg * durasiMenit) / safeUlp;
                }
                const eSaidiJ = eSaidiM / 60;

                return (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Tanggal & Jam */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-bold text-slate-900">{log.tanggal}</div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {log.jamKeluar || '08:00'} - {log.jamMasuk || '09:30'}
                      </div>
                    </td>

                    {/* Penyulang & Section */}
                    <td className="py-3 px-4">
                      <div className="font-extrabold text-blue-900">{log.namaPenyulang}</div>
                      <div className="text-[11px] text-slate-600 font-medium">
                        {log.section || '-'}
                      </div>
                      {log.sectionRestorations && log.sectionRestorations.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {log.sectionRestorations.map((sec, sIdx) => (
                            <span
                              key={sIdx}
                              className="px-1.5 py-0.5 rounded bg-amber-50 border border-amber-200 text-[9px] font-mono text-amber-900 font-bold"
                              title={`${sec.namaSection}: Lepas ${sec.jamKeluar} -> Masuk ${sec.jamMasuk} (${sec.durasiMenit}m, ${sec.jumlahPelanggan?.toLocaleString('id-ID')} Plg)`}
                            >
                              {sec.namaSection}: Masuk {sec.jamMasuk}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>

                    {/* Plg Padam */}
                    <td className="py-3 px-4 text-center font-bold text-slate-800">
                      <span className="px-2 py-1 rounded-lg bg-slate-100 border border-slate-200">
                        {logJmlPlg.toLocaleString('id-ID')}
                      </span>
                    </td>

                    {/* Durasi Padam */}
                    <td className="py-3 px-4 text-center">
                      <span className="font-extrabold text-slate-900 block">{log.durasi || `${durasiMenit}m`}</span>
                      <span className="text-[10px] text-slate-400 font-mono">({durasiMenit} menit)</span>
                    </td>

                    {/* Est SAIDI */}
                    <td className="py-3 px-4 text-right bg-blue-50/20 font-mono font-bold text-blue-700">
                      <div>{eSaidiM.toFixed(3)} <span className="text-[10px] font-normal text-slate-500">m/plg</span></div>
                      <div className="text-[10px] text-slate-400">({eSaidiJ.toFixed(4)} j/plg)</div>
                    </td>

                    {/* Est SAIFI */}
                    <td className="py-3 px-4 text-right bg-purple-50/20 font-mono font-bold text-purple-700">
                      <div>{eSaifi.toFixed(4)} <span className="text-[10px] font-normal text-slate-500">kali</span></div>
                    </td>

                    {/* Penyebab & Kode */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 font-bold text-[10px]">
                          {log.kodeGangguan || 'E-3'}
                        </span>
                        <span className="font-medium text-slate-700 truncate max-w-[140px]" title={log.penyebab}>
                          {log.penyebab || 'Gangguan Trip'}
                        </span>
                      </div>
                    </td>

                    {/* Detail Lokasi */}
                    <td className="py-3 px-4 text-slate-600 text-[11px] max-w-[180px] truncate" title={log.detailLokasi}>
                      {log.detailLokasi || '-'}
                    </td>
                  </tr>
                );
              })}

              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                    Tidak ada data event log gangguan yang cocok dengan filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PRINT & PDF PREVIEW MODAL */}
      {showPrintModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 z-50 font-sans print:p-0 print:bg-white print:static">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden print:max-h-none print:shadow-none print:border-none print:rounded-none">
            
            {/* Modal Control Top Bar (Hidden on print) */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0 print:hidden">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-sm">Pratinjau Laporan Estimasi SAIDI & SAIFI</h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportPDF}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh File PDF</span>
                </button>

                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-blue-500/20"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Langsung</span>
                </button>

                <button
                  onClick={() => setShowPrintModal(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer transition-colors"
                  title="Tutup"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Document Sheet */}
            <div className="p-8 overflow-y-auto bg-white text-slate-900 printable-document space-y-6">
              {/* Kop Surat PLN */}
              <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-start">
                <div>
                  <h2 className="text-base font-black text-blue-900 tracking-wider uppercase">
                    PT PLN (PERSERO) UIW MMU - UP3 AMBON
                  </h2>
                  <h3 className="text-sm font-bold text-slate-800">
                    UNIT LAYANAN PELANGGAN (ULP) PASSO
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Jl. Transit Passo, Ambon - Maluku | Telp: (0311) 361-XXXX
                  </p>
                </div>
                <div className="text-right text-xs">
                  <span className="font-bold text-slate-900 block">DOKUMEN RESMI ULP</span>
                  <span className="text-[10px] text-slate-500">
                    Dicetak: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              {/* Title & Periode */}
              <div className="text-center space-y-1">
                <h1 className="text-base font-black text-slate-900 uppercase tracking-wide">
                  LAPORAN ESTIMASI INDEKS KEANDALAN SAIDI & SAIFI GANGGUAN
                </h1>
                <p className="text-xs text-slate-600 font-medium">
                  Periode: <span className="font-bold">{selectedMonth === 'all' ? 'Semua Bulan' : monthsList.find(m => m.value === selectedMonth)?.label}</span> | Reference Master ULP: <span className="font-mono font-bold text-blue-700">{(totalPelangganUlp || masterDataTotalUlp || 88281).toLocaleString('id-ID')} Pelanggan</span>
                </p>
              </div>

              {/* KPI Summaries */}
              <div className="grid grid-cols-4 gap-3 text-xs font-sans">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Estimasi SAIDI</span>
                  <span className="text-sm font-black text-blue-900 font-mono block">{totalSaidiMenit.toFixed(3)} mnt/plg</span>
                  <span className="text-[10px] text-slate-600 font-mono">({totalSaidiJam.toFixed(4)} jam/plg)</span>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Estimasi SAIFI</span>
                  <span className="text-sm font-black text-emerald-800 font-mono block">{totalSaifi.toFixed(4)} kali/plg</span>
                  <span className="text-[10px] text-emerald-600">Frekuensi gangguan</span>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Total Event Padam</span>
                  <span className="text-sm font-black text-slate-900 font-mono block">{filteredLogs.length} Event</span>
                  <span className="text-[10px] text-slate-500">Log gangguan trip</span>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Akumulasi Plg Padam</span>
                  <span className="text-sm font-black text-rose-800 font-mono block">{totalPelangganPadamAccum.toLocaleString('id-ID')} Plg</span>
                  <span className="text-[10px] text-slate-500">Total terdampak</span>
                </div>
              </div>

              {/* Top 5 Section Padam */}
              <div className="space-y-2">
                <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wide">
                  Top 5 Section Padam dengan Dampak SAIDI Terbesar:
                </h4>
                <table className="w-full text-left text-xs border border-slate-300">
                  <thead className="bg-slate-100 font-bold text-[10px] uppercase text-slate-700">
                    <tr>
                      <th className="p-2 border border-slate-300">Rank</th>
                      <th className="p-2 border border-slate-300">Section Padam</th>
                      <th className="p-2 border border-slate-300">Penyulang</th>
                      <th className="p-2 border border-slate-300 text-center">Jumlah Event</th>
                      <th className="p-2 border border-slate-300 text-right">Plg Section</th>
                      <th className="p-2 border border-slate-300 text-right">Estimasi SAIDI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sectionBreakdown.slice(0, 5).map((sec, idx) => (
                      <tr key={sec.section} className="border-b border-slate-200">
                        <td className="p-2 border border-slate-300 font-bold text-center">#{idx + 1}</td>
                        <td className="p-2 border border-slate-300 font-bold">{sec.section}</td>
                        <td className="p-2 border border-slate-300">{sec.namaPenyulang}</td>
                        <td className="p-2 border border-slate-300 text-center">{sec.count}x Event</td>
                        <td className="p-2 border border-slate-300 text-right font-mono">{sec.sectionCustomerCount.toLocaleString('id-ID')} Plg</td>
                        <td className="p-2 border border-slate-300 text-right font-mono font-bold text-blue-800">{sec.saidiMenit.toFixed(3)} mnt/plg</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Event Logs Table */}
              <div className="space-y-2">
                <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wide">
                  Detail Rincian Log Event Gangguan:
                </h4>
                <table className="w-full text-left text-xs border border-slate-300">
                  <thead className="bg-slate-100 font-bold text-[10px] uppercase text-slate-700">
                    <tr>
                      <th className="p-1.5 border border-slate-300">No</th>
                      <th className="p-1.5 border border-slate-300">Tanggal</th>
                      <th className="p-1.5 border border-slate-300">Penyulang</th>
                      <th className="p-1.5 border border-slate-300">Section</th>
                      <th className="p-1.5 border border-slate-300 text-center">Durasi</th>
                      <th className="p-1.5 border border-slate-300 text-right">Plg Padam</th>
                      <th className="p-1.5 border border-slate-300 text-right">SAIDI (Mnt)</th>
                      <th className="p-1.5 border border-slate-300 text-right">SAIFI (Kali)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.map((log, idx) => {
                      const durasiMenit = parseDurasiMenit(log);
                      const jmlPlg = getJumlahPelangganPadam(log);
                      const safeUlp = totalPelangganUlp || masterDataTotalUlp || 88281;
                      const eSaifi = jmlPlg / safeUlp;
                      const eSaidiM = (jmlPlg * durasiMenit) / safeUlp;

                      return (
                        <tr key={log.id} className="border-b border-slate-200">
                          <td className="p-1.5 border border-slate-300 text-center">{idx + 1}</td>
                          <td className="p-1.5 border border-slate-300 whitespace-nowrap">{log.tanggal}</td>
                          <td className="p-1.5 border border-slate-300 font-semibold">{log.namaPenyulang}</td>
                          <td className="p-1.5 border border-slate-300 max-w-[150px] truncate">{log.section}</td>
                          <td className="p-1.5 border border-slate-300 text-center font-mono">{durasiMenit} mnt</td>
                          <td className="p-1.5 border border-slate-300 text-right font-mono">{jmlPlg.toLocaleString('id-ID')}</td>
                          <td className="p-1.5 border border-slate-300 text-right font-mono font-bold text-blue-800">{eSaidiM.toFixed(3)}</td>
                          <td className="p-1.5 border border-slate-300 text-right font-mono font-bold text-purple-800">{eSaifi.toFixed(4)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Tanda Tangan */}
              <div className="pt-8 flex justify-between text-xs text-slate-800 font-serif">
                <div className="text-center space-y-12">
                  <p>Disiapkan Oleh,<br /><strong>Supervisor Teknik ULP Passo</strong></p>
                  <p className="font-bold underline">( ___________________________ )</p>
                </div>
                <div className="text-center space-y-12">
                  <p>Mengetahui,<br /><strong>Manager ULP Passo</strong></p>
                  <p className="font-bold underline">( ___________________________ )</p>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};
