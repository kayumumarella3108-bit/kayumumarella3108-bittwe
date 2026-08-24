import React, { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea
} from 'recharts';
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Gauge,
  Zap,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Info,
  Sliders,
  Building2,
  Search,
  Sparkles,
  RefreshCw,
  Clock,
  UserCheck
} from 'lucide-react';
import { PengukuranGardu, MasterGardu, Penyulang } from '../../types';

interface RiwayatPembebananGarduChartProps {
  pengukuranList: PengukuranGardu[];
  masterGarduList: MasterGardu[];
  penyulangList: Penyulang[];
  initialSelectedGardu?: string;
  onSelectGardu?: (noGardu: string) => void;
  onEditPengukuran?: (p: PengukuranGardu) => void;
}

export const RiwayatPembebananGarduChart: React.FC<RiwayatPembebananGarduChartProps> = ({
  pengukuranList,
  masterGarduList,
  penyulangList,
  initialSelectedGardu,
  onSelectGardu,
  onEditPengukuran
}) => {
  // Extract all unique gardu numbers from measurements & master
  const allGarduNumbers = useMemo(() => {
    const fromPengukuran = pengukuranList.map((p) => p.noGardu).filter(Boolean);
    const fromMaster = masterGarduList
      .map((g) => g.noBaru || g.noGarduBaru || g.noGarduLama)
      .filter((n): n is string => Boolean(n));
    return Array.from(new Set([...fromPengukuran, ...fromMaster])).sort();
  }, [pengukuranList, masterGarduList]);

  // Default selection: pick first gardu with multiple measurements if available, else first in list
  const defaultGardu = useMemo(() => {
    if (initialSelectedGardu && initialSelectedGardu !== 'ALL') {
      return initialSelectedGardu;
    }
    // Count measurements per gardu
    const counts: Record<string, number> = {};
    pengukuranList.forEach((p) => {
      if (p.noGardu) {
        counts[p.noGardu] = (counts[p.noGardu] || 0) + 1;
      }
    });
    // Pick the one with the most historical points
    const sortedByCount = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    if (sortedByCount.length > 0) {
      return sortedByCount[0][0];
    }
    return allGarduNumbers[0] || 'GD-PSO-004';
  }, [initialSelectedGardu, pengukuranList, allGarduNumbers]);

  const [selectedGardu, setSelectedGardu] = useState<string>(defaultGardu);
  const [chartMode, setChartMode] = useState<'loading_kva' | 'arus_fasa' | 'tegangan' | 'jurusan' | 'all'>('loading_kva');
  const [timeRange, setTimeRange] = useState<'all' | '1year' | '6month' | '3month'>('all');
  const [garduSearch, setGarduSearch] = useState<string>('');

  // Sync when prop changes
  React.useEffect(() => {
    if (initialSelectedGardu && initialSelectedGardu !== 'ALL' && initialSelectedGardu !== selectedGardu) {
      setSelectedGardu(initialSelectedGardu);
    }
  }, [initialSelectedGardu]);

  // Master gardu detail if available
  const currentMasterGardu = useMemo(() => {
    return masterGarduList.find(
      (g) =>
        g.noBaru === selectedGardu ||
        g.noGarduBaru === selectedGardu ||
        g.noGarduLama === selectedGardu
    );
  }, [masterGarduList, selectedGardu]);

  // Filter and sort historical measurements for the selected gardu
  const historicalData = useMemo(() => {
    if (!selectedGardu) return [];

    let filtered = pengukuranList.filter((p) => p.noGardu === selectedGardu);

    // Sort chronologically ascending
    filtered.sort((a, b) => {
      const dateA = new Date(a.tanggalUkur).getTime();
      const dateB = new Date(b.tanggalUkur).getTime();
      if (!isNaN(dateA) && !isNaN(dateB)) {
        return dateA - dateB;
      }
      return (a.tanggalUkur || '').localeCompare(b.tanggalUkur || '');
    });

    // Time range filter
    if (timeRange !== 'all' && filtered.length > 0) {
      const now = new Date();
      let cutOffMonths = 12;
      if (timeRange === '6month') cutOffMonths = 6;
      if (timeRange === '3month') cutOffMonths = 3;

      const cutoffDate = new Date();
      cutoffDate.setMonth(now.getMonth() - cutOffMonths);

      const filteredByDate = filtered.filter((p) => {
        const d = new Date(p.tanggalUkur);
        return !isNaN(d.getTime()) && d >= cutoffDate;
      });

      if (filteredByDate.length > 0) {
        filtered = filteredByDate;
      }
    }

    return filtered;
  }, [pengukuranList, selectedGardu, timeRange]);

  // Nominal calculations helper
  const calculateRecordMetrics = (p: PengukuranGardu) => {
    const dayaKva = p.dayaKva || currentMasterGardu?.daya || 160;
    const iNominal = (dayaKva * 1000) / (Math.sqrt(3) * 400);
    const iMax = Math.max(p.iRTotal || 0, p.iSTotal || 0, p.iTTotal || 0);
    const iAvg = ((p.iRTotal || 0) + (p.iSTotal || 0) + (p.iTTotal || 0)) / 3;
    const vAvg = ((p.vRN || 220) + (p.vSN || 220) + (p.vTN || 220)) / 3;
    const pfAvg = ((p.tpfR || 0.92) + (p.tpfS || 0.92) + (p.tpfT || 0.92)) / 3;

    const loadingPct = iNominal > 0 ? (iMax / iNominal) * 100 : 0;
    const dayaPakaiKva = (Math.sqrt(3) * vAvg * iAvg) / 1000;
    const dayaPakaiKw = dayaPakaiKva * pfAvg;

    const devR = Math.abs((p.iRTotal || 0) - iAvg);
    const devS = Math.abs((p.iSTotal || 0) - iAvg);
    const devT = Math.abs((p.iTTotal || 0) - iAvg);
    const maxDev = Math.max(devR, devS, devT);
    const unbalancePct = iAvg > 0 ? (maxDev / iAvg) * 100 : 0;

    let statusBeban: 'Underload' | 'Normal' | 'Overload' | 'Critical' = 'Normal';
    if (loadingPct <= 40) statusBeban = 'Underload';
    else if (loadingPct <= 80) statusBeban = 'Normal';
    else if (loadingPct <= 100) statusBeban = 'Overload';
    else statusBeban = 'Critical';

    return {
      dayaKva,
      iNominal,
      iMax,
      iAvg,
      vAvg,
      pfAvg,
      loadingPct,
      dayaPakaiKva,
      dayaPakaiKw,
      unbalancePct,
      statusBeban
    };
  };

  // Recharts formatted dataset
  const formattedChartData = useMemo(() => {
    return historicalData.map((p, idx) => {
      const m = calculateRecordMetrics(p);
      const prevP = idx > 0 ? historicalData[idx - 1] : null;
      const prevM = prevP ? calculateRecordMetrics(prevP) : null;
      const deltaLoading = prevM ? m.loadingPct - prevM.loadingPct : 0;
      const deltaKva = prevM ? m.dayaPakaiKva - prevM.dayaPakaiKva : 0;

      // Jurusan currents
      const j1Total = (p.jurusan1?.iRTotal || 0) + (p.jurusan1?.iSTotal || 0) + (p.jurusan1?.iTTotal || 0);
      const j2Total = (p.jurusan2?.iRTotal || 0) + (p.jurusan2?.iSTotal || 0) + (p.jurusan2?.iTTotal || 0);
      const j3Total = (p.jurusan3?.iRTotal || 0) + (p.jurusan3?.iSTotal || 0) + (p.jurusan3?.iTTotal || 0);
      const j4Total = (p.jurusan4?.iRTotal || 0) + (p.jurusan4?.iSTotal || 0) + (p.jurusan4?.iTTotal || 0);

      return {
        id: p.id,
        rawDate: p.tanggalUkur,
        tanggal: p.tanggalUkur,
        jamUkur: p.jamUkur || '09:30 WIT',
        petugas: p.petugas || 'Tim Yantek',
        'Loading (%)': Number(m.loadingPct.toFixed(1)),
        'Beban Nyata (kVA)': Number(m.dayaPakaiKva.toFixed(1)),
        'Daya Aktif (kW)': Number(m.dayaPakaiKw.toFixed(1)),
        'Kapasitas Trafo (kVA)': m.dayaKva,
        'Arus Inominal (A)': Number(m.iNominal.toFixed(1)),
        'Arus R (A)': p.iRTotal || 0,
        'Arus S (A)': p.iSTotal || 0,
        'Arus T (A)': p.iTTotal || 0,
        'Arus N (A)': p.iNTotal || 0,
        'Arus Rata-rata (A)': Number(m.iAvg.toFixed(1)),
        'Tegangan V RN (V)': p.vRN || 220,
        'Tegangan V SN (V)': p.vSN || 220,
        'Tegangan V TN (V)': p.vTN || 220,
        'Ketidakseimbangan (%)': Number(m.unbalancePct.toFixed(1)),
        'Jurusan 1 (A)': j1Total,
        'Jurusan 2 (A)': j2Total,
        'Jurusan 3 (A)': j3Total,
        'Jurusan 4 (A)': j4Total,
        statusBeban: m.statusBeban,
        deltaLoading: Number(deltaLoading.toFixed(1)),
        deltaKva: Number(deltaKva.toFixed(1)),
        rawRecord: p
      };
    });
  }, [historicalData, currentMasterGardu]);

  // Overall Statistics & Growth Insights
  const stats = useMemo(() => {
    if (formattedChartData.length === 0) {
      return {
        totalRecords: 0,
        currentLoading: 0,
        currentKva: 0,
        firstLoading: 0,
        firstKva: 0,
        growthPct: 0,
        growthKva: 0,
        peakLoading: 0,
        peakKva: 0,
        peakDate: '-',
        avgLoading: 0,
        currentUnbalance: 0,
        trafoKva: currentMasterGardu?.daya || 160,
        penyulang: currentMasterGardu?.penyulang || '-',
        lastDate: '-',
        statusTerkini: 'Normal'
      };
    }

    const first = formattedChartData[0];
    const last = formattedChartData[formattedChartData.length - 1];

    let peakLoading = 0;
    let peakKva = 0;
    let peakDate = '';
    let sumLoading = 0;

    formattedChartData.forEach((d) => {
      sumLoading += d['Loading (%)'];
      if (d['Loading (%)'] > peakLoading) {
        peakLoading = d['Loading (%)'];
        peakKva = d['Beban Nyata (kVA)'];
        peakDate = d.tanggal;
      }
    });

    const avgLoading = sumLoading / formattedChartData.length;
    const growthPct = last['Loading (%)'] - first['Loading (%)'];
    const growthKva = last['Beban Nyata (kVA)'] - first['Beban Nyata (kVA)'];

    return {
      totalRecords: formattedChartData.length,
      currentLoading: last['Loading (%)'],
      currentKva: last['Beban Nyata (kVA)'],
      firstLoading: first['Loading (%)'],
      firstKva: first['Beban Nyata (kVA)'],
      growthPct: Number(growthPct.toFixed(1)),
      growthKva: Number(growthKva.toFixed(1)),
      peakLoading: Number(peakLoading.toFixed(1)),
      peakKva: Number(peakKva.toFixed(1)),
      peakDate,
      avgLoading: Number(avgLoading.toFixed(1)),
      currentUnbalance: last['Ketidakseimbangan (%)'],
      trafoKva: last['Kapasitas Trafo (kVA)'],
      penyulang: last.rawRecord.penyulang || currentMasterGardu?.penyulang || 'PASSO',
      lastDate: last.tanggal,
      statusTerkini: last.statusBeban
    };
  }, [formattedChartData, currentMasterGardu]);

  // Filtered gardu list for search picker
  const filteredGarduList = useMemo(() => {
    if (!garduSearch) return allGarduNumbers;
    return allGarduNumbers.filter((g) =>
      g.toLowerCase().includes(garduSearch.toLowerCase())
    );
  }, [allGarduNumbers, garduSearch]);

  const handleSelect = (g: string) => {
    setSelectedGardu(g);
    if (onSelectGardu) onSelectGardu(g);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Gardu Selector Section */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-600/10 text-blue-600 rounded-xl">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                  <span>Riwayat & Tren Pembebanan Trafo Gardu</span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-50 text-blue-700 border border-blue-200">
                    Recharts Analytics
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pantau kurva kenaikan beban trafo secara kronologis, arus 3-fasa, tegangan jaringan, dan rasio pembebanan terhadap kapasitas nominal trafo.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Filter & Time Range Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold text-slate-500 px-2 uppercase">Periode:</span>
              {(['all', '1year', '6month', '3month'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setTimeRange(r)}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    timeRange === r
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {r === 'all' && 'Semua'}
                  {r === '1year' && '1 Tahun'}
                  {r === '6month' && '6 Bulan'}
                  {r === '3month' && '3 Bulan'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Gardu Picker Bar */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
          <div className="flex items-center gap-2 flex-1 w-full">
            <span className="text-xs font-bold text-slate-700 shrink-0 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span>Pilih Gardu:</span>
            </span>

            <div className="relative flex-1 max-w-sm">
              <select
                value={selectedGardu}
                onChange={(e) => handleSelect(e.target.value)}
                className="w-full pl-3 pr-8 py-2 bg-white rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs cursor-pointer"
              >
                {filteredGarduList.map((g) => {
                  const pCount = pengukuranList.filter((p) => p.noGardu === g).length;
                  return (
                    <option key={g} value={g}>
                      {g} ({pCount} data ukur)
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Quick Gardu Search input for fast filter */}
            <div className="relative w-44 hidden sm:block">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari gardu..."
                value={garduSearch}
                onChange={(e) => setGarduSearch(e.target.value)}
                className="w-full pl-8 pr-2.5 py-1.5 bg-white rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Quick Gardu Badges Selection */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            {allGarduNumbers.slice(0, 5).map((g) => {
              const isSelected = g === selectedGardu;
              return (
                <button
                  key={g}
                  onClick={() => handleSelect(g)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  {g}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* KPI STATS CARDS FOR SELECTED GARDU */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* 1. Kapasitas Trafo */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-blue-600" />
            Kapasitas Nominal
          </span>
          <div className="text-xl font-black text-slate-900 mt-1">
            {stats.trafoKva} <span className="text-xs font-bold text-slate-500">kVA</span>
          </div>
          <div className="text-[10px] text-blue-700 font-semibold mt-0.5 truncate">
            Feeder: {stats.penyulang}
          </div>
        </div>

        {/* 2. Beban Terkini (kVA & %) */}
        <div className={`p-3.5 rounded-2xl border shadow-2xs ${
          stats.currentLoading > 100
            ? 'bg-rose-50/60 border-rose-200 text-rose-950'
            : stats.currentLoading > 80
            ? 'bg-amber-50/60 border-amber-200 text-amber-950'
            : 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
        }`}>
          <span className="text-[10px] font-bold opacity-80 uppercase flex items-center gap-1">
            <Gauge className="w-3.5 h-3.5" />
            Beban Terkini ({stats.lastDate})
          </span>
          <div className="text-xl font-black mt-1">
            {stats.currentLoading}%
            <span className="text-xs font-bold opacity-80 ml-1">({stats.currentKva} kVA)</span>
          </div>
          <div className="text-[10px] font-black uppercase mt-0.5">
            Status: {stats.statusTerkini}
          </div>
        </div>

        {/* 3. Beban Puncak (Peak Load) */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
            Peak Load Historis
          </span>
          <div className="text-xl font-black text-amber-600 mt-1">
            {stats.peakLoading}%
            <span className="text-xs font-bold text-slate-500 ml-1">({stats.peakKva} kVA)</span>
          </div>
          <div className="text-[10px] text-slate-500 font-medium mt-0.5">
            Tercatat tgl: {stats.peakDate || '-'}
          </div>
        </div>

        {/* 4. Tren Pertumbuhan Beban (Growth Delta) */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
            <Activity className="w-3.5 h-3.5 text-indigo-600" />
            Tren Kenaikan Beban
          </span>
          <div className={`text-xl font-black mt-1 flex items-center gap-1 ${
            stats.growthPct > 0 ? 'text-rose-600' : stats.growthPct < 0 ? 'text-emerald-600' : 'text-slate-700'
          }`}>
            {stats.growthPct > 0 ? (
              <ArrowUpRight className="w-5 h-5" />
            ) : stats.growthPct < 0 ? (
              <ArrowDownRight className="w-5 h-5" />
            ) : null}
            <span>{stats.growthPct > 0 ? `+${stats.growthPct}%` : `${stats.growthPct}%`}</span>
          </div>
          <div className="text-[10px] text-slate-500 font-medium mt-0.5">
            Selisih: {stats.growthKva > 0 ? `+${stats.growthKva}` : stats.growthKva} kVA
          </div>
        </div>

        {/* 5. Rata-Rata Loading */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
            <Sliders className="w-3.5 h-3.5 text-teal-600" />
            Rata-Rata Beban
          </span>
          <div className="text-xl font-black text-slate-900 mt-1">
            {stats.avgLoading}%
          </div>
          <div className="text-[10px] text-slate-500 font-medium mt-0.5">
            Dari {stats.totalRecords} titik ukur historis
          </div>
        </div>

        {/* 6. Keseimbangan Terkini */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-purple-600" />
            Unbalance Terkini
          </span>
          <div className={`text-xl font-black mt-1 ${
            stats.currentUnbalance < 10 ? 'text-emerald-600' : 'text-rose-600'
          }`}>
            {stats.currentUnbalance}%
          </div>
          <div className={`text-[10px] font-bold mt-0.5 ${
            stats.currentUnbalance < 10 ? 'text-emerald-700' : 'text-rose-700'
          }`}>
            {stats.currentUnbalance < 10 ? 'Seimbang (<10%)' : 'Tidak Seimbang (≥10%)'}
          </div>
        </div>
      </div>

      {/* CHART MODE TABS */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-700 mr-1">Tampilan Grafik:</span>

            <button
              onClick={() => setChartMode('loading_kva')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                chartMode === 'loading_kva'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Gauge className="w-3.5 h-3.5" />
              <span>Persentase Loading (%) & Daya (kVA)</span>
            </button>

            <button
              onClick={() => setChartMode('arus_fasa')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                chartMode === 'arus_fasa'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Arus Fasa 3-Phase (R / S / T / N)</span>
            </button>

            <button
              onClick={() => setChartMode('tegangan')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                chartMode === 'tegangan'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-emerald-500" />
              <span>Tegangan Jaringan (V RN / SN / TN)</span>
            </button>

            <button
              onClick={() => setChartMode('jurusan')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                chartMode === 'jurusan'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-purple-500" />
              <span>Beban Jurusan (1 s/d 4)</span>
            </button>
          </div>

          <div className="text-xs text-slate-500 font-semibold flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{formattedChartData.length} Titik Pengukuran Terdata</span>
          </div>
        </div>

        {/* CHART BODY CONTAINER */}
        <div className="p-4 md:p-6 bg-white min-h-[420px]">
          {formattedChartData.length === 0 ? (
            <div className="h-[380px] flex items-center justify-center flex-col text-slate-500 gap-3 border-2 border-dashed border-slate-200 rounded-2xl">
              <AlertTriangle className="w-12 h-12 text-amber-400" />
              <p className="text-sm font-semibold">
                Belum ada data riwayat pengukuran untuk gardu <span className="font-bold text-slate-900">{selectedGardu}</span>
              </p>
              <p className="text-xs text-slate-400">
                Silakan pilih gardu lain pada menu di atas atau input data pengukuran baru.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* MODE 1: PERSENTASE LOADING (%) & DAYA SEMU (kVA) */}
              {chartMode === 'loading_kva' && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                        <span>Kurva Tren Loading (%) & Beban Daya Aktual (kVA)</span>
                      </h4>
                      <p className="text-xs text-slate-500">
                        Ambang batas SPLN: &le;40% Underload, 40-80% Normal, 80-100% Overload, &gt;100% Kritis.
                      </p>
                    </div>
                  </div>

                  <div className="h-[380px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={formattedChartData}
                        margin={{ top: 20, right: 35, left: 10, bottom: 20 }}
                      >
                        <defs>
                          <linearGradient id="loadingGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                          </linearGradient>
                          <linearGradient id="kvaGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis
                          dataKey="tanggal"
                          tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
                          tickMargin={10}
                          axisLine={{ stroke: '#cbd5e1' }}
                          tickLine={false}
                        />
                        <YAxis
                          yAxisId="left"
                          tick={{ fontSize: 11, fill: '#64748b' }}
                          axisLine={false}
                          tickLine={false}
                          tickMargin={10}
                          domain={[0, (dataMax: number) => Math.max(120, Math.ceil(dataMax * 1.15))]}
                          label={{ value: 'Loading (%)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fontSize: 12, fill: '#3b82f6', fontWeight: 'bold' } }}
                        />
                        <YAxis
                          yAxisId="right"
                          orientation="right"
                          tick={{ fontSize: 11, fill: '#64748b' }}
                          axisLine={false}
                          tickLine={false}
                          tickMargin={10}
                          label={{ value: 'Daya Beban (kVA)', angle: 90, position: 'insideRight', style: { textAnchor: 'middle', fontSize: 12, fill: '#10b981', fontWeight: 'bold' } }}
                        />
                        <Tooltip
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              const d = payload[0].payload;
                              const statusColor =
                                d['Loading (%)'] > 100
                                  ? 'text-rose-600 bg-rose-50 border-rose-200'
                                  : d['Loading (%)'] > 80
                                  ? 'text-amber-600 bg-amber-50 border-amber-200'
                                  : 'text-emerald-600 bg-emerald-50 border-emerald-200';
                              return (
                                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xl space-y-2 text-xs min-w-[220px]">
                                  <div className="font-black text-slate-900 border-b border-slate-100 pb-1.5 flex items-center justify-between">
                                    <span>{label}</span>
                                    <span className="text-[10px] text-slate-400 font-semibold">{d.jamUkur}</span>
                                  </div>
                                  <div className="space-y-1">
                                    <div className="flex justify-between">
                                      <span className="text-slate-600">Loading Trafo:</span>
                                      <b className="text-blue-600 font-black">{d['Loading (%)']}%</b>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-slate-600">Daya Aktual:</span>
                                      <b className="text-emerald-600 font-bold">{d['Beban Nyata (kVA)']} kVA</b>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-slate-600">Kapasitas Trafo:</span>
                                      <b className="text-slate-800">{d['Kapasitas Trafo (kVA)']} kVA</b>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-slate-600">Arus Rata-rata:</span>
                                      <b className="text-slate-800">{d['Arus Rata-rata (A)']} A</b>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-slate-600">Unbalance:</span>
                                      <b className={d['Ketidakseimbangan (%)'] < 10 ? 'text-emerald-600' : 'text-rose-600'}>
                                        {d['Ketidakseimbangan (%)']}%
                                      </b>
                                    </div>
                                  </div>
                                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                                    <span className="text-slate-500 text-[10px]">Status:</span>
                                    <span className={`px-2 py-0.5 rounded font-black border text-[10px] ${statusColor}`}>
                                      {d.statusBeban}
                                    </span>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Legend wrapperStyle={{ paddingTop: '15px', fontSize: '12px' }} />

                        {/* Reference Threshold Lines */}
                        <ReferenceLine yAxisId="left" y={100} stroke="#f43f5e" strokeDasharray="4 4" label={{ value: 'CRITICAL 100%', fill: '#f43f5e', fontSize: 10, position: 'right', fontWeight: 'bold' }} />
                        <ReferenceLine yAxisId="left" y={80} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: 'WARNING 80%', fill: '#f59e0b', fontSize: 10, position: 'right', fontWeight: 'bold' }} />
                        <ReferenceLine yAxisId="left" y={40} stroke="#10b981" strokeDasharray="4 4" label={{ value: 'NORMAL 40%', fill: '#10b981', fontSize: 10, position: 'right' }} />

                        <Area
                          yAxisId="left"
                          type="monotone"
                          dataKey="Loading (%)"
                          stroke="#2563eb"
                          strokeWidth={3}
                          fillOpacity={1}
                          fill="url(#loadingGradient)"
                          dot={{ r: 5, strokeWidth: 2, fill: '#ffffff', stroke: '#2563eb' }}
                          activeDot={{ r: 7 }}
                        />

                        <Area
                          yAxisId="right"
                          type="monotone"
                          dataKey="Beban Nyata (kVA)"
                          stroke="#10b981"
                          strokeWidth={2.5}
                          fillOpacity={1}
                          fill="url(#kvaGradient)"
                          dot={{ r: 4, strokeWidth: 2, fill: '#ffffff', stroke: '#10b981' }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* MODE 2: ARUS FASA 3-PHASE (R / S / T / N) */}
              {chartMode === 'arus_fasa' && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                        <span>Kurva Tren Arus Tiap Fasa (Ampere) & Arus Netral (N)</span>
                      </h4>
                      <p className="text-xs text-slate-500">
                        Evaluasi distribusi beban pada fasa R, S, T untuk mendeteksi ketidakseimbangan dan arus balik netral.
                      </p>
                    </div>
                  </div>

                  <div className="h-[380px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={formattedChartData}
                        margin={{ top: 20, right: 35, left: 10, bottom: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis
                          dataKey="tanggal"
                          tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
                          tickMargin={10}
                          axisLine={{ stroke: '#cbd5e1' }}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 11, fill: '#64748b' }}
                          axisLine={false}
                          tickLine={false}
                          tickMargin={10}
                          label={{ value: 'Arus (Ampere)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fontSize: 12, fill: '#64748b', fontWeight: 'bold' } }}
                        />
                        <Tooltip
                          contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                          labelStyle={{ fontWeight: 'bold', color: '#0f172a', marginBottom: '8px' }}
                        />
                        <Legend wrapperStyle={{ paddingTop: '15px', fontSize: '12px' }} />

                        {/* Reference Line for Nominal Current if available */}
                        {formattedChartData.length > 0 && (
                          <ReferenceLine
                            y={formattedChartData[0]['Arus Inominal (A)']}
                            stroke="#dc2626"
                            strokeDasharray="5 5"
                            label={{
                              value: `Inominal (${formattedChartData[0]['Arus Inominal (A)']}A)`,
                              fill: '#dc2626',
                              fontSize: 10,
                              position: 'right',
                              fontWeight: 'bold'
                            }}
                          />
                        )}

                        <Line type="monotone" dataKey="Arus R (A)" stroke="#ef4444" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#ffffff', stroke: '#ef4444' }} activeDot={{ r: 6 }} />
                        <Line type="monotone" dataKey="Arus S (A)" stroke="#eab308" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#ffffff', stroke: '#eab308' }} activeDot={{ r: 6 }} />
                        <Line type="monotone" dataKey="Arus T (A)" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#ffffff', stroke: '#3b82f6' }} activeDot={{ r: 6 }} />
                        <Line type="monotone" dataKey="Arus N (A)" stroke="#64748b" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 3, strokeWidth: 2 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* MODE 3: TEGANGAN JARINGAN (VOLT) */}
              {chartMode === 'tegangan' && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                        <span>Kurva Tren Tegangan Fasa-Netral (V RN, V SN, V TN)</span>
                      </h4>
                      <p className="text-xs text-slate-500">
                        Standar Tegangan Pelayanan PLN: 220 Volt &plusmn; 5% s/d 10% (198V - 231V).
                      </p>
                    </div>
                  </div>

                  <div className="h-[380px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={formattedChartData}
                        margin={{ top: 20, right: 35, left: 10, bottom: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis
                          dataKey="tanggal"
                          tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
                          tickMargin={10}
                          axisLine={{ stroke: '#cbd5e1' }}
                          tickLine={false}
                        />
                        <YAxis
                          domain={[190, 245]}
                          tick={{ fontSize: 11, fill: '#64748b' }}
                          axisLine={false}
                          tickLine={false}
                          tickMargin={10}
                          label={{ value: 'Tegangan (Volt)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fontSize: 12, fill: '#64748b', fontWeight: 'bold' } }}
                        />
                        <Tooltip
                          contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                          labelStyle={{ fontWeight: 'bold', color: '#0f172a', marginBottom: '8px' }}
                        />
                        <Legend wrapperStyle={{ paddingTop: '15px', fontSize: '12px' }} />

                        {/* Voltage Standard Bands */}
                        <ReferenceLine y={220} stroke="#10b981" strokeDasharray="3 3" label={{ value: 'Nominal 220V', fill: '#10b981', fontSize: 10, position: 'right', fontWeight: 'bold' }} />
                        <ReferenceLine y={231} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: 'Batas Atas +5% (231V)', fill: '#f59e0b', fontSize: 9, position: 'right' }} />
                        <ReferenceLine y={198} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'Batas Bawah -10% (198V)', fill: '#ef4444', fontSize: 9, position: 'right' }} />

                        <Line type="monotone" dataKey="Tegangan V RN (V)" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 4 }} />
                        <Line type="monotone" dataKey="Tegangan V SN (V)" stroke="#eab308" strokeWidth={2.5} dot={{ r: 4 }} />
                        <Line type="monotone" dataKey="Tegangan V TN (V)" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* MODE 4: BEBAN PER JURUSAN 1-4 */}
              {chartMode === 'jurusan' && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                        <span>Distribusi Beban Tiap Jurusan PHB-TR (Outcoming Feeder 1 s/d 4)</span>
                      </h4>
                      <p className="text-xs text-slate-500">
                        Komparasi total arus (Ampere) yang disuplai oleh masing-masing jalur jurusan gardu.
                      </p>
                    </div>
                  </div>

                  <div className="h-[380px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={formattedChartData}
                        margin={{ top: 20, right: 35, left: 10, bottom: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis
                          dataKey="tanggal"
                          tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
                          tickMargin={10}
                          axisLine={{ stroke: '#cbd5e1' }}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 11, fill: '#64748b' }}
                          axisLine={false}
                          tickLine={false}
                          tickMargin={10}
                          label={{ value: 'Total Arus (A)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fontSize: 12, fill: '#64748b', fontWeight: 'bold' } }}
                        />
                        <Tooltip
                          contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                          labelStyle={{ fontWeight: 'bold', color: '#0f172a', marginBottom: '8px' }}
                        />
                        <Legend wrapperStyle={{ paddingTop: '15px', fontSize: '12px' }} />

                        <Bar dataKey="Jurusan 1 (A)" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={30} />
                        <Bar dataKey="Jurusan 2 (A)" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={30} />
                        <Bar dataKey="Jurusan 3 (A)" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={30} />
                        <Bar dataKey="Jurusan 4 (A)" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={30} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* TECHNICAL RECOMMENDATION BANNER */}
              <div className="bg-slate-900 text-white p-4 md:p-5 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-blue-500/20 text-blue-400 rounded-xl border border-blue-500/30 shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="font-bold text-xs uppercase tracking-wider text-blue-400">
                      Rekomendasi Teknis PLN Terhadap Tren Beban Gardu {selectedGardu}
                    </h5>
                    <p className="text-xs text-slate-300 mt-1">
                      {stats.currentLoading > 100 ? (
                        <span className="text-rose-400 font-bold">
                          ⚠️ KRITIS OVERLOAD ({stats.currentLoading}%): Sangat mendesak untuk dilakukan manuver beban ke gardu terdekat atau pengusulan Uprating / Sisip Trafo Distribusi baru guna mencegah trip/kerusakan trafo.
                        </span>
                      ) : stats.currentLoading > 80 ? (
                        <span className="text-amber-400 font-bold">
                          ⚠️ PERINGATAN OVERLOAD ({stats.currentLoading}%): Beban trafo mendekati batas maksimal. Rekomendasi: Pemantauan intensif berkala dan persiapan rencana pembagian beban jurusan.
                        </span>
                      ) : stats.currentUnbalance >= 10 ? (
                        <span className="text-amber-300 font-medium">
                          ⚠️ PERINGATAN KETIDAKSEIMBANGAN FASA ({stats.currentUnbalance}%): Rekomendasi dilakukan penataan fasa (Phase Balancing) pada rak PHB-TR agar arus fasa R, S, T terbagi merata.
                        </span>
                      ) : (
                        <span className="text-emerald-400 font-medium">
                          ✅ KONDISI NORMAL & OPTIMAL ({stats.currentLoading}% Loading): Trafo beroperasi dalam batas efisiensi kerja yang baik. Lanjutkan inspeksi dan pengukuran berkala.
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  <span className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 border border-slate-700 text-xs font-bold">
                    Pertumbuhan: {stats.growthPct > 0 ? `+${stats.growthPct}%` : `${stats.growthPct}%`}
                  </span>
                </div>
              </div>

              {/* CHRONOLOGICAL HISTORICAL LOG TABLE */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span>Log Data Pengukuran Historis ({formattedChartData.length} Titik)</span>
                  </h5>
                  <span className="text-[11px] text-slate-500 font-medium">
                    Diurutkan dari periode terlama ke terbaru
                  </span>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs font-sans">
                    <thead className="bg-slate-100 text-slate-700 uppercase text-[10px] font-black tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Tanggal & Jam</th>
                        <th className="py-2.5 px-3">Petugas</th>
                        <th className="py-2.5 px-3 text-center">Arus R / S / T</th>
                        <th className="py-2.5 px-3 text-center">Arus N</th>
                        <th className="py-2.5 px-3 text-center">Tegangan (V RN/SN/TN)</th>
                        <th className="py-2.5 px-3 text-center">Beban (kVA)</th>
                        <th className="py-2.5 px-3 text-center">Loading (%)</th>
                        <th className="py-2.5 px-3 text-center">Delta Beban</th>
                        <th className="py-2.5 px-3 text-center">Unbalance</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-slate-800">
                      {formattedChartData.map((row, idx) => {
                        const statusBadge =
                          row['Loading (%)'] > 100
                            ? 'bg-rose-100 text-rose-800 border-rose-300'
                            : row['Loading (%)'] > 80
                            ? 'bg-amber-100 text-amber-800 border-amber-300'
                            : 'bg-emerald-100 text-emerald-800 border-emerald-300';
                        return (
                          <tr key={row.id || idx} className="hover:bg-slate-50 transition-colors">
                            <td className="py-2.5 px-3 font-bold text-slate-900">
                              {row.tanggal}
                              <span className="block text-[10px] font-normal text-slate-500">{row.jamUkur}</span>
                            </td>
                            <td className="py-2.5 px-3 text-slate-600 font-medium">
                              {row.petugas}
                            </td>
                            <td className="py-2.5 px-3 text-center font-bold">
                              <span className="text-red-600">{row['Arus R (A)']}</span> /{' '}
                              <span className="text-yellow-600">{row['Arus S (A)']}</span> /{' '}
                              <span className="text-blue-600">{row['Arus T (A)']}</span> A
                            </td>
                            <td className="py-2.5 px-3 text-center font-medium text-slate-600">
                              {row['Arus N (A)']} A
                            </td>
                            <td className="py-2.5 px-3 text-center text-slate-700 font-medium">
                              {row['Tegangan V RN (V)']}V / {row['Tegangan V SN (V)']}V / {row['Tegangan V TN (V)']}V
                            </td>
                            <td className="py-2.5 px-3 text-center font-bold text-blue-900">
                              {row['Beban Nyata (kVA)']} kVA
                            </td>
                            <td className="py-2.5 px-3 text-center font-black text-slate-900">
                              {row['Loading (%)']}%
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              {idx === 0 ? (
                                <span className="text-slate-400 font-medium text-[10px]">- (Awal)</span>
                              ) : row.deltaLoading > 0 ? (
                                <span className="text-rose-600 font-bold text-[11px] flex items-center justify-center gap-0.5">
                                  <ArrowUpRight className="w-3.5 h-3.5" />
                                  +{row.deltaLoading}%
                                </span>
                              ) : row.deltaLoading < 0 ? (
                                <span className="text-emerald-600 font-bold text-[11px] flex items-center justify-center gap-0.5">
                                  <ArrowDownRight className="w-3.5 h-3.5" />
                                  {row.deltaLoading}%
                                </span>
                              ) : (
                                <span className="text-slate-500 font-bold text-[11px]">0%</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                row['Ketidakseimbangan (%)'] < 10
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-rose-50 text-rose-700'
                              }`}>
                                {row['Ketidakseimbangan (%)']}%
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${statusBadge}`}>
                                {row.statusBeban}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
};
