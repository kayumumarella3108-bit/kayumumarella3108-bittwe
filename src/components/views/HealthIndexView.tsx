import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  CheckCircle2,
  ShieldCheck,
  AlertTriangle,
  Flame,
  Plus,
  Download,
  FileSpreadsheet,
  FileText
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
  Cell
} from 'recharts';
import { Penyulang, GangguanLog, SectionJaringan } from '../../types';
import { DAFTAR_UNIT_PLN } from '../../utils/unitConfig';
import { HealthIndexBanner } from '../HealthIndexBanner';
import { InputGangguanModal } from '../modals/InputGangguanModal';

interface HealthIndexViewProps {
  penyulangList: Penyulang[];
  gangguanList?: GangguanLog[];
  sectionList?: SectionJaringan[];
  onAddGangguan?: (log: GangguanLog) => void;
}

const MONTH_MAP: Record<string, string> = {
  'Januari': '01',
  'Februari': '02',
  'Maret': '03',
  'April': '04',
  'Mei': '05',
  'Juni': '06',
  'Juli': '07',
  'Agustus': '08',
  'September': '09',
  'Oktober': '10',
  'November': '11',
  'Desember': '12',
};

export const HealthIndexView: React.FC<HealthIndexViewProps> = ({
  penyulangList,
  gangguanList = [],
  sectionList = [],
  onAddGangguan
}) => {
  const [selectedYear, setSelectedYear] = useState('2026');
  const [selectedMonth, setSelectedMonth] = useState('Semua Bulan');
  const [selectedStatus, setSelectedStatus] = useState('Semua Status');
  const [filterUnit, setFilterUnit] = useState<string>('SEMUA');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPenyulangIdForModal, setSelectedPenyulangIdForModal] = useState<string>('');

  // Dynamically compute synced penyulang list based on gangguanList and active filters
  const syncedPenyulangList = useMemo(() => {
    return penyulangList.filter(p => filterUnit === 'SEMUA' || p.unit === filterUnit).map((p) => {
      // Find logs belonging to this feeder
      const feederLogs = gangguanList.filter((g) => {
        const matchesPenyulang =
          g.penyulangId === p.id ||
          (g.namaPenyulang && p.namaPenyulang && g.namaPenyulang.trim().toUpperCase() === p.namaPenyulang.trim().toUpperCase());
        
        if (!matchesPenyulang) return false;

        const tgl = g.tanggal || '';
        if (selectedYear && selectedYear !== 'Semua Tahun' && !tgl.startsWith(selectedYear)) {
          return false;
        }
        if (selectedMonth && selectedMonth !== 'Semua Bulan') {
          const monthCode = MONTH_MAP[selectedMonth];
          if (monthCode && tgl.slice(5, 7) !== monthCode) {
            return false;
          }
        }
        return true;
      });

      const frekuensiGangguan = feederLogs.length;

      let healthIndexStatus: 'Sempurna' | 'Sehat' | 'Sakit' | 'Kronis' = 'Sempurna';
      if (frekuensiGangguan === 0) healthIndexStatus = 'Sempurna';
      else if (frekuensiGangguan <= 3) healthIndexStatus = 'Sehat';
      else if (frekuensiGangguan <= 6) healthIndexStatus = 'Sakit';
      else healthIndexStatus = 'Kronis';

      // Sort by date descending
      const sortedLogs = [...feederLogs].sort((a, b) => (b.tanggal || '').localeCompare(a.tanggal || ''));
      const latestLog = sortedLogs[0];
      let gangguanTerakhir = '';
      if (latestLog) {
        const kodeDisplay = latestLog.kodeGangguan === 'E-5' ? 'Tidak Ditemukan' : (latestLog.kodeGangguan || '-');
        gangguanTerakhir = `${latestLog.tanggal} (${kodeDisplay})`;
      }

      // Most frequent section or latest log's section
      let sectionTerlama = p.sectionTerlama || '';
      if (sortedLogs.length > 0) {
        const secCounts: Record<string, number> = {};
        sortedLogs.forEach((g) => {
          if (g.section && g.section.trim()) {
            secCounts[g.section.trim()] = (secCounts[g.section.trim()] || 0) + 1;
          }
        });
        let maxSec = '';
        let maxCnt = 0;
        Object.entries(secCounts).forEach(([sec, cnt]) => {
          if (cnt > maxCnt) {
            maxCnt = cnt;
            maxSec = sec;
          }
        });
        sectionTerlama = maxSec || sortedLogs[0].section || p.sectionTerlama || '';
      }

      return {
        ...p,
        frekuensiGangguan,
        healthIndexStatus,
        sectionTerlama,
        gangguanTerakhir
      };
    });
  }, [penyulangList, gangguanList, selectedYear, selectedMonth, filterUnit]);

  const sempurnaCount = syncedPenyulangList.filter((p) => p.healthIndexStatus === 'Sempurna').length;
  const sehatCount = syncedPenyulangList.filter((p) => p.healthIndexStatus === 'Sehat').length;
  const sakitCount = syncedPenyulangList.filter((p) => p.healthIndexStatus === 'Sakit').length;
  const kronisCount = syncedPenyulangList.filter((p) => p.healthIndexStatus === 'Kronis').length;

  // Filtered List based on Search & Status Filter
  const filteredList = syncedPenyulangList.filter((p) => {
    const matchesSearch =
      (p.namaPenyulang || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.kodeId || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === 'Semua Status' || p.healthIndexStatus === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  // Prepare Bar Chart Data (Top Feeders sorted by Outage Frequency)
  const barChartData = useMemo(() => {
    return [...filteredList]
      .sort((a, b) => b.frekuensiGangguan - a.frekuensiGangguan)
      .map((p) => ({
        name: p.namaPenyulang,
        gangguan: p.frekuensiGangguan
      }));
  }, [filteredList]);

  // Prepare Pie Chart Data
  const pieChartData = [
    { name: 'Sempurna (0)', value: sempurnaCount, color: '#10b981' },
    { name: 'Sehat (1-3)', value: sehatCount, color: '#3b82f6' },
    { name: 'Sakit (4-6)', value: sakitCount, color: '#f59e0b' },
    { name: 'Kronis (>=7)', value: kronisCount, color: '#ef4444' }
  ].filter((item) => item.value > 0);

  const handleOpenAddGangguanForPenyulang = (pId: string) => {
    setSelectedPenyulangIdForModal(pId);
    setIsModalOpen(true);
  };

  return (
    <div className="p-4 md:p-6 space-y-5 bg-slate-950 text-slate-100 font-sans min-h-screen">
      {/* Filter Toolbar */}
      <div className="p-4 bg-slate-900 border border-slate-800 shadow-sm rounded-2xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs font-semibold">
            <span className="text-slate-400">ULP:</span>
            <select
              value={filterUnit}
              onChange={(e) => setFilterUnit(e.target.value)}
              className="bg-transparent text-slate-200 font-bold focus:outline-none cursor-pointer"
            >
              <option value="SEMUA">Semua Unit</option>
              {DAFTAR_UNIT_PLN.map((u) => (
                <option key={u.namaUnit} value={u.namaUnit}>{u.namaUnit}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs font-semibold">
            <span className="text-slate-400">Tahun:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-transparent text-slate-200 font-bold focus:outline-none cursor-pointer"
            >
              <option value="2026">2026</option>
              <option value="2025">2025</option>
              <option value="Semua Tahun">Semua Tahun</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs font-semibold">
            <span className="text-slate-400">Bulan:</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-slate-200 font-bold focus:outline-none cursor-pointer"
            >
              <option value="Semua Bulan">Semua Bulan</option>
              <option value="Januari">Januari</option>
              <option value="Februari">Februari</option>
              <option value="Maret">Maret</option>
              <option value="April">April</option>
              <option value="Mei">Mei</option>
              <option value="Juni">Juni</option>
              <option value="Juli">Juli</option>
              <option value="Agustus">Agustus</option>
              <option value="September">September</option>
              <option value="Oktober">Oktober</option>
              <option value="November">November</option>
              <option value="Desember">Desember</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs font-semibold">
            <span className="text-slate-400">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-transparent text-slate-200 font-bold focus:outline-none cursor-pointer"
            >
              <option value="Semua Status">Semua Status</option>
              <option value="Sempurna">Sempurna</option>
              <option value="Sehat">Sehat</option>
              <option value="Sakit">Sakit</option>
              <option value="Kronis">Kronis</option>
            </select>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama penyulang..."
            className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:bg-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
          />
        </div>
      </div>

      {/* Top Banner */}
      <HealthIndexBanner
        totalCount={penyulangList.length}
        sempurnaCount={sempurnaCount}
        sehatCount={sehatCount}
        sakitCount={sakitCount}
        kronisCount={kronisCount}
      />

      {/* Criteria Info Section */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-sm">
        <h3 className="text-xs font-extrabold text-emerald-400 uppercase tracking-wider mb-2">
          KRITERIA KLASIFIKASI HEALTH INDEX PENYULANG:
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 text-xs">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <span className="font-extrabold text-emerald-400">Sempurna (0 Gangguan):</span>
            <p className="text-[11px] text-slate-400 mt-0.5">Kondisi ideal, tanpa kejadian padam.</p>
          </div>
          <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <span className="font-extrabold text-blue-400">Sehat (1 - 3 Gangguan):</span>
            <p className="text-[11px] text-slate-400 mt-0.5">Kondisi terkendali & terpantau.</p>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <span className="font-extrabold text-amber-400">Sakit (4 - 6 Gangguan):</span>
            <p className="text-[11px] text-slate-400 mt-0.5">Perlu inspeksi & pemangkasan ROW.</p>
          </div>
          <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
            <span className="font-extrabold text-rose-400">Kronis (&gt;= 7 Gangguan):</span>
            <p className="text-[11px] text-slate-400 mt-0.5">Prioritas penanganan investigasi khusus.</p>
          </div>
        </div>
      </div>

      {/* Summary Stat Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl">
          <span className="text-[10px] font-black uppercase text-slate-400">TOTAL PENYULANG</span>
          <div className="text-2xl font-black text-white mt-1">{penyulangList.length}</div>
          <span className="text-[10px] text-slate-500">Penyulang Terdata</span>
        </div>
        <div className="p-3.5 bg-slate-900 border border-emerald-500/30 rounded-2xl">
          <span className="text-[10px] font-black uppercase text-emerald-400">SEMPURNA</span>
          <div className="text-2xl font-black text-emerald-400 mt-1">{sempurnaCount}</div>
          <span className="text-[10px] text-slate-500">0 Gangguan</span>
        </div>
        <div className="p-3.5 bg-slate-900 border border-blue-500/30 rounded-2xl">
          <span className="text-[10px] font-black uppercase text-blue-400">SEHAT</span>
          <div className="text-2xl font-black text-blue-400 mt-1">{sehatCount}</div>
          <span className="text-[10px] text-slate-500">1 - 3 Gangguan</span>
        </div>
        <div className="p-3.5 bg-slate-900 border border-amber-500/30 rounded-2xl">
          <span className="text-[10px] font-black uppercase text-amber-400">SAKIT</span>
          <div className="text-2xl font-black text-amber-400 mt-1">{sakitCount}</div>
          <span className="text-[10px] text-slate-500">4 - 6 Gangguan</span>
        </div>
        <div className="p-3.5 bg-slate-900 border border-rose-500/30 rounded-2xl">
          <span className="text-[10px] font-black uppercase text-rose-400">KRONIS</span>
          <div className="text-2xl font-black text-rose-400 mt-1">{kronisCount}</div>
          <span className="text-[10px] text-slate-500">&gt;= 7 Gangguan</span>
        </div>
      </div>

      {/* Visual Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart */}
        <div className="lg:col-span-2 p-6 bg-white border border-slate-200 shadow-sm rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              📊 Frekuensi Gangguan per Penyulang (Bar Chart)
            </h3>
            <span className="text-xs text-slate-500 font-medium">Monitoring Real-time</span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData.slice(0, 12)} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} angle={-30} textAnchor="end" />
                <YAxis stroke="#64748b" fontSize={10} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', fontSize: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="gangguan" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donut Chart */}
        <div className="p-6 bg-white border border-slate-200 shadow-sm rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              🍩 Distribusi Health Index Status
            </h3>
          </div>

          <div className="h-56 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', fontSize: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex justify-center gap-4 text-xs font-medium text-slate-600">
            {pieChartData.map((item) => (
              <div key={item.name} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span>{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">
            Tabel Rekapitulasi Health Index Penyulang ULP Baguala
          </h3>
          <span className="text-xs text-slate-500 font-medium">
            Menampilkan {filteredList.length} Penyulang
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-800">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[11px] tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-5 py-4">No</th>
                <th className="px-5 py-4">Nama Penyulang</th>
                <th className="px-5 py-4 text-center">Frekuensi Gangguan</th>
                <th className="px-5 py-4 text-center">Health Index Status</th>
                <th className="px-5 py-4">Section Terlama Gangguan</th>
                <th className="px-5 py-4">Gangguan Terakhir</th>
                <th className="px-5 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-400">
                    Tidak ada data penyulang yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                filteredList.map((p, index) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4 text-slate-400 font-bold">{index + 1}</td>
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-900">{p.namaPenyulang}</div>
                      <span className="text-[10px] text-slate-400 font-mono">{p.kodeId} • {p.namaGi}</span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        p.frekuensiGangguan === 0
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {p.frekuensiGangguan} Kali Padam
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      {p.healthIndexStatus === 'Sempurna' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Sempurna
                        </span>
                      )}
                      {p.healthIndexStatus === 'Sehat' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
                          <ShieldCheck className="w-3.5 h-3.5" /> Sehat
                        </span>
                      )}
                      {p.healthIndexStatus === 'Sakit' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">
                          <AlertTriangle className="w-3.5 h-3.5" /> Sakit
                        </span>
                      )}
                      {p.healthIndexStatus === 'Kronis' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-100 text-rose-700 text-xs font-bold">
                          <Flame className="w-3.5 h-3.5" /> Kronis
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-slate-600 text-xs">
                      {p.sectionTerlama || 'Nihil Section Gangguan'}
                    </td>
                    <td className="px-5 py-4 text-slate-500 text-xs">
                      {p.gangguanTerakhir ? `${p.gangguanTerakhir} (Gangguan)` : 'Sempurna / Nihil Padam'}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <button
                        onClick={() => handleOpenAddGangguanForPenyulang(p.id)}
                        className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs font-bold cursor-pointer transition-colors"
                      >
                        + Gangguan
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Input Gangguan Modal from Health Index */}
      {onAddGangguan && (
        <InputGangguanModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={(log) => {
            onAddGangguan(log);
            setIsModalOpen(false);
          }}
          penyulangList={penyulangList}
          sectionList={sectionList}
          initialPenyulangId={selectedPenyulangIdForModal}
        />
      )}
    </div>
  );
};
