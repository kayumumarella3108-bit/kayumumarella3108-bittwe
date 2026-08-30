import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, 
  Search, 
  Filter, 
  Download, 
  Plus, 
  ChevronLeft, 
  ChevronRight,
  Zap,
  Trees,
  Search as SearchIcon,
  MoreVertical,
  Edit,
  Trash2,
  CheckCircle2,
  Clock,
  X,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { JadwalInspeksiRow } from '../../types';
import { CustomDropdown } from '../common/CustomDropdown';
import { DAFTAR_UNIT_PLN } from '../../utils/unitConfig';
import { InputJadwalInspeksiModal } from '../modals/InputJadwalInspeksiModal';

// Mock data for initial development
const MOCK_DATA: JadwalInspeksiRow[] = [
  {
    id: '1',
    ulp: 'ULP Baguala',
    kodeUlp: '54110',
    penyulang: 'BAGUALA UTAMA',
    kms: 12.4,
    tahun: 2026,
    schedule: {
      '2026-01-05': { type: 'INSPEKSI', isRealized: true, section: 'Sec 1-4', jumlahGawang: 12 },
      '2026-01-15': { type: 'ROW', isRealized: false, section: 'Span 10-25', jumlahGawang: 15 },
      '2026-02-10': { type: 'BOTH', isRealized: true, section: 'Main Trunk', jumlahGawang: 20 },
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    ulp: 'ULP Namlea',
    kodeUlp: '54120',
    penyulang: 'TULEHU',
    kms: 55.9,
    tahun: 2026,
    schedule: {
      '2026-01-10': { type: 'INSPEKSI', isRealized: false },
      '2026-01-20': { type: 'ROW', isRealized: true },
      '2026-03-05': { type: 'INSPEKSI', isRealized: true },
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '3',
    ulp: 'ULP Ambon Kota',
    kodeUlp: '54130',
    penyulang: 'PASSO',
    kms: 28.6,
    tahun: 2026,
    schedule: {
      '2026-01-08': { type: 'BOTH', isRealized: true, section: 'Laha - Hitu' },
      '2026-01-22': { type: 'INSPEKSI', isRealized: true, section: 'Passo Lama' },
      '2026-02-14': { type: 'ROW', isRealized: false },
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '4',
    ulp: 'ULP Sirimau',
    kodeUlp: '54140',
    penyulang: 'SIRIMAU EKSPRES',
    kms: 34.2,
    tahun: 2026,
    schedule: {
      '2026-01-12': { type: 'ROW', isRealized: true },
      '2026-02-04': { type: 'INSPEKSI', isRealized: true },
      '2026-02-25': { type: 'BOTH', isRealized: false },
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '5',
    ulp: 'ULP Lease',
    kodeUlp: '54150',
    penyulang: 'SAPARUA',
    kms: 42.1,
    tahun: 2026,
    schedule: {
      '2026-01-18': { type: 'INSPEKSI', isRealized: true },
      '2026-03-02': { type: 'ROW', isRealized: false },
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

const MONTHS = [
  { name: 'JAN', days: 31, color: 'bg-sky-400/30' },
  { name: 'FEB', days: 28, color: 'bg-rose-400/30' },
  { name: 'MAR', days: 31, color: 'bg-sky-400/30' },
  { name: 'APR', days: 30, color: 'bg-rose-400/30' },
  { name: 'MEI', days: 31, color: 'bg-sky-400/30' },
  { name: 'JUN', days: 30, color: 'bg-rose-400/30' },
  { name: 'JUL', days: 31, color: 'bg-sky-400/30' },
  { name: 'AGU', days: 31, color: 'bg-rose-400/30' },
  { name: 'SEP', days: 30, color: 'bg-sky-400/30' },
  { name: 'OKT', days: 31, color: 'bg-rose-400/30' },
  { name: 'NOV', days: 30, color: 'bg-sky-400/30' },
  { name: 'DES', days: 31, color: 'bg-rose-400/30' },
];

const DAYS_ID = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

// Indonesian Public Holidays 2026 (Approximate/Fixed)
const HOLIDAYS_2026: Record<string, string> = {
  '01-01': 'Tahun Baru Masehi',
  '01-29': 'Tahun Baru Imlek',
  '02-15': 'Isra Mikraj',
  '03-20': 'Hari Suci Nyepi / Idul Fitri',
  '03-21': 'Idul Fitri',
  '04-03': 'Wafat Isa Almasih',
  '05-01': 'Hari Buruh',
  '05-14': 'Kenaikan Isa Almasih',
  '05-27': 'Idul Adha',
  '06-01': 'Hari Lahir Pancasila',
  '06-16': 'Tahun Baru Islam',
  '08-17': 'Hari Kemerdekaan RI',
  '08-25': 'Maulid Nabi Muhammad SAW',
  '12-25': 'Hari Raya Natal',
};

export const JadwalInspeksiRowView: React.FC = () => {
  const [data, setData] = useState<JadwalInspeksiRow[]>(MOCK_DATA);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterUnit, setFilterUnit] = useState('SEMUA');
  const [selectedYear, setSelectedYear] = useState('2026');
  const [viewMonth, setViewMonth] = useState(0); // 0 = JAN, 1 = FEB...
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [isCompact, setIsCompact] = useState<boolean>(false);
  
  // Helper to check if a day is "red" (weekend or holiday)
  const getRedDayInfo = (monthIdx: number, day: number) => {
    const date = new Date(parseInt(selectedYear), monthIdx, day);
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    const mm = String(monthIdx + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    const holidayKey = `${mm}-${dd}`;
    const holidayName = HOLIDAYS_2026[holidayKey];
    
    return { isRed: isWeekend || !!holidayName, holidayName };
  };
  
  // New states for cell modal details
  const [cellSection, setCellSection] = useState('');
  const [cellJumlahGawang, setCellJumlahGawang] = useState<number>(0);

  // Modal states
  const [isInputModalOpen, setIsInputModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<JadwalInspeksiRow | null>(null);
  const [isCellModalOpen, setIsCellModalOpen] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{rowId: string, date: string} | null>(null);

  // Helper to calculate row completion progress
  const getRowProgress = (item: JadwalInspeksiRow) => {
    const scheduleValues = Object.values(item.schedule || {});
    const total = scheduleValues.length;
    if (total === 0) return { total: 0, realized: 0, percentage: 0 };
    const realized = scheduleValues.filter((s: any) => Boolean(s?.isRealized)).length;
    const percentage = Math.round((realized / total) * 100);
    return { total, realized, percentage };
  };

  // Filtering logic
  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchUnit = filterUnit === 'SEMUA' || item.ulp === filterUnit;
      const matchSearch = item.penyulang.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.ulp.toLowerCase().includes(searchTerm.toLowerCase());
      const matchYear = item.tahun === parseInt(selectedYear);
      return matchUnit && matchSearch && matchYear;
    });
  }, [data, searchTerm, filterUnit, selectedYear]);

  // Overall statistics for footer
  const overallStats = useMemo(() => {
    let totalSchedules = 0;
    let totalRealized = 0;
    filteredData.forEach(item => {
      const values = Object.values(item.schedule || {});
      totalSchedules += values.length;
      totalRealized += values.filter((s: any) => Boolean(s?.isRealized)).length;
    });
    const percentage = totalSchedules > 0 ? Math.round((totalRealized / totalSchedules) * 100) : 0;
    return { totalSchedules, totalRealized, percentage };
  }, [filteredData]);

  const handleSaveData = (newData: Partial<JadwalInspeksiRow>) => {
    if (editItem) {
      setData(prev => prev.map(item => item.id === editItem.id ? { ...item, ...newData } as JadwalInspeksiRow : item));
    } else {
      const newItem: JadwalInspeksiRow = {
        ...newData,
        id: `row_${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as JadwalInspeksiRow;
      setData(prev => [...prev, newItem]);
    }
    setIsInputModalOpen(false);
    setEditItem(null);
  };

  const handleCellClick = (rowId: string, monthIdx: number, day: number) => {
    const month = String(monthIdx + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const dateKey = `${selectedYear}-${month}-${dayStr}`;
    
    // Pre-fill existing data
    const existing = data.find(item => item.id === rowId)?.schedule[dateKey];
    if (existing) {
      setCellSection(existing.section || '');
      setCellJumlahGawang(existing.jumlahGawang || 0);
    } else {
      setCellSection('');
      setCellJumlahGawang(0);
    }

    setSelectedCell({ rowId, date: dateKey });
    setIsCellModalOpen(true);
  };

  const handleUpdateSchedule = (type: 'INSPEKSI' | 'ROW' | 'BOTH' | 'NONE', isRealized: boolean) => {
    if (!selectedCell) return;
    
    setData(prev => prev.map(item => {
      if (item.id === selectedCell.rowId) {
        const newSchedule = { ...item.schedule };
        if (type === 'NONE') {
          delete newSchedule[selectedCell.date];
        } else {
          newSchedule[selectedCell.date] = { 
            type, 
            isRealized,
            section: cellSection,
            jumlahGawang: (type === 'INSPEKSI' || type === 'BOTH') ? cellJumlahGawang : undefined
          };
        }
        return { ...item, schedule: newSchedule };
      }
      return item;
    }));
    setIsCellModalOpen(false);
    setSelectedCell(null);
  };

  const getCellContent = (item: JadwalInspeksiRow, monthIdx: number, day: number) => {
    const month = String(monthIdx + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const dateKey = `${selectedYear}-${month}-${dayStr}`;
    const schedule = item.schedule[dateKey];

    if (!schedule) return null;

    let bgColor = '';
    let icon = null;
    const iconSize = isCompact ? "w-1.5 h-1.5" : "w-2 h-2";

    if (schedule.type === 'INSPEKSI') {
      bgColor = schedule.isRealized ? 'bg-amber-500' : 'bg-amber-500/40';
      icon = <SearchIcon className={`${iconSize} text-white`} />;
    } else if (schedule.type === 'ROW') {
      bgColor = schedule.isRealized ? 'bg-emerald-500' : 'bg-emerald-500/40';
      icon = <Trees className={`${iconSize} text-white`} />;
    } else if (schedule.type === 'BOTH') {
      bgColor = schedule.isRealized ? 'bg-blue-500' : 'bg-blue-500/40';
      icon = <Zap className={`${iconSize} text-white`} />;
    }

    return (
      <div 
        className={`w-full h-full flex items-center justify-center ${bgColor} transition-all cursor-help`}
        title={`${schedule.type} ${schedule.isRealized ? '(Realisasi)' : '(Rencana)'}${schedule.section ? `\nSection: ${schedule.section}` : ''}${schedule.jumlahGawang ? `\nGawang: ${schedule.jumlahGawang}` : ''}`}
      >
        {icon}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#011a18] p-4 lg:p-6 space-y-4 overflow-hidden">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-400/20 border border-amber-400/30">
              <Calendar className="w-6 h-6 text-amber-400" />
            </div>
            JADWAL INSPEKSI & ROW JTM
          </h2>
          <p className="text-teal-400/70 text-xs font-bold mt-1 ml-12 uppercase tracking-widest">
            Perencanaan dan Realisasi Pemeliharaan Jaringan 20kV
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Toggle Mode Compact Button */}
          <button 
            onClick={() => setIsCompact(!isCompact)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border shadow-sm ${
              isCompact 
                ? 'bg-amber-400 text-teal-950 border-amber-300 font-black shadow-amber-900/30 ring-2 ring-amber-400/40' 
                : 'bg-teal-900/40 text-teal-300 border-teal-500/30 hover:bg-teal-800/60'
            }`}
            title={isCompact ? 'Kembali ke Tampilan Normal' : 'Tampilkan Lebih Banyak Data per Layar (Mode Ringkas)'}
          >
            {isCompact ? <Maximize2 className="w-4 h-4 text-teal-950" /> : <Minimize2 className="w-4 h-4 text-teal-300" />}
            <span>{isCompact ? 'MODE RINGKAS' : 'MODE RINGKAS'}</span>
            <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-black uppercase ${
              isCompact ? 'bg-teal-950 text-amber-300' : 'bg-teal-800 text-teal-400'
            }`}>
              {isCompact ? 'ON' : 'OFF'}
            </span>
          </button>

          <button 
            onClick={() => {
              setEditItem(null);
              setIsInputModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-teal-950 rounded-xl text-xs font-black transition-all shadow-lg shadow-amber-900/20 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            TAMBAH JADWAL
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-teal-900/40 hover:bg-teal-800/60 text-teal-300 border border-teal-500/30 rounded-xl text-xs font-bold transition-all">
            <Download className="w-4 h-4" />
            EXPORT PDF
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 bg-teal-950/30 border border-teal-500/20 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <CustomDropdown
            options={[
              { value: 'SEMUA', label: 'Semua Unit' },
              ...DAFTAR_UNIT_PLN.map(u => ({ value: u.namaUnit, label: u.namaUnit }))
            ]}
            value={filterUnit}
            onChange={setFilterUnit}
            labelPrefix="ULP:"
            variant="teal"
          />

          <CustomDropdown
            options={['2026', '2025', '2024']}
            value={selectedYear}
            onChange={setSelectedYear}
            labelPrefix="Tahun:"
            variant="teal"
          />

          <div className="relative group min-w-[200px]">
            <Search className="w-4 h-4 text-teal-500 absolute left-3 top-2.5 group-focus-within:text-amber-400 transition-colors" />
            <input
              type="text"
              placeholder="Cari Penyulang..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-teal-900/40 border border-teal-500/30 rounded-xl py-2 pl-9 pr-4 text-xs font-bold text-white placeholder-teal-600 focus:outline-none focus:border-amber-400/50 transition-all"
            />
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 px-4 py-2 bg-teal-900/20 rounded-xl border border-teal-800/30">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-amber-500 rounded-sm"></div>
            <span className="text-[10px] font-black text-teal-400 uppercase">Inspeksi</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-emerald-500 rounded-sm"></div>
            <span className="text-[10px] font-black text-teal-400 uppercase">ROW</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-sm"></div>
            <span className="text-[10px] font-black text-teal-400 uppercase">Keduanya</span>
          </div>
          <div className="flex items-center gap-2 ml-2 pl-4 border-l border-teal-800/50">
            <div className="w-3 h-3 bg-teal-500/20 rounded-sm border border-teal-500/40"></div>
            <span className="text-[10px] font-black text-teal-500/50 uppercase">Rencana</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-teal-500 rounded-sm"></div>
            <span className="text-[10px] font-black text-teal-400 uppercase">Realisasi</span>
          </div>
        </div>
      </div>

      {/* Grid Container */}
      <div className="flex-1 overflow-hidden flex flex-col bg-teal-950/20 border border-teal-500/20 rounded-2xl">
        {/* Month Selector for smaller screens or for jumping */}
        <div className="flex items-center justify-between p-3 border-b border-teal-500/20 bg-teal-900/20">
          <button 
            onClick={() => setViewMonth(Math.max(0, viewMonth - 1))}
            disabled={viewMonth === 0}
            className="p-1.5 rounded-lg hover:bg-teal-800/40 text-teal-400 disabled:opacity-30 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar px-4">
            {MONTHS.map((m, idx) => (
              <button
                key={m.name}
                onClick={() => setViewMonth(idx)}
                className={`px-3 py-1 rounded-full text-[10px] font-black transition-all whitespace-nowrap ${
                  viewMonth === idx 
                    ? 'bg-amber-400 text-teal-950 shadow-md scale-105' 
                    : 'text-teal-500 hover:text-teal-300'
                }`}
              >
                {m.name}
              </button>
            ))}
          </div>

          <button 
            onClick={() => setViewMonth(Math.min(11, viewMonth + 1))}
            disabled={viewMonth === 11}
            className="p-1.5 rounded-lg hover:bg-teal-800/40 text-teal-400 disabled:opacity-30 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Table Area */}
        <div className="flex-1 overflow-auto">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="bg-[#022e2a] text-white">
                <th rowSpan={2} className={`px-2.5 ${isCompact ? 'py-1 text-[10px]' : 'py-3 text-xs'} font-black uppercase tracking-wider border-r border-teal-800/50 sticky left-0 z-20 bg-[#022e2a]`}>NO</th>
                <th rowSpan={2} className={`px-3 ${isCompact ? 'py-1 text-[10px]' : 'py-3 text-xs'} font-black uppercase tracking-wider border-r border-teal-800/50 sticky ${isCompact ? 'left-9' : 'left-12'} z-20 bg-[#022e2a] ${isCompact ? 'min-w-[100px]' : 'min-w-[120px]'}`}>ULP</th>
                <th rowSpan={2} className={`px-2 ${isCompact ? 'py-1 text-[10px]' : 'py-3 text-xs'} font-black uppercase tracking-wider border-r border-teal-800/50 ${isCompact ? 'min-w-[80px]' : 'min-w-[100px]'}`}>KODE ULP</th>
                <th rowSpan={2} className={`px-3 ${isCompact ? 'py-1 text-[10px]' : 'py-3 text-xs'} font-black uppercase tracking-wider border-r border-teal-800/50 ${isCompact ? 'min-w-[120px]' : 'min-w-[150px]'}`}>PENYULANG</th>
                <th rowSpan={2} className={`px-2 ${isCompact ? 'py-1 text-[10px]' : 'py-3 text-xs'} font-black uppercase tracking-wider border-r border-teal-800/50`}>KMS</th>
                <th rowSpan={2} className={`px-3 ${isCompact ? 'py-1 text-[10px]' : 'py-3 text-xs'} font-black uppercase tracking-wider border-r border-teal-800/50 ${isCompact ? 'min-w-[100px]' : 'min-w-[140px]'}`}>PROGRESS</th>
                <th rowSpan={2} className={`px-2 ${isCompact ? 'py-1 text-[10px]' : 'py-3 text-xs'} font-black uppercase tracking-wider border-r border-teal-800/50 ${isCompact ? 'min-w-[70px]' : 'min-w-[90px]'}`}>AKSI</th>
                
                {/* Single Month View for clarity on all screens, but with enough space for days */}
                <th colSpan={MONTHS[viewMonth].days} className={`px-3 ${isCompact ? 'py-1 text-[9px]' : 'py-2 text-[10px]'} font-black border-b border-teal-800/50 ${MONTHS[viewMonth].color} text-teal-100 uppercase tracking-[0.2em]`}>
                  {MONTHS[viewMonth].name} {selectedYear}
                </th>
              </tr>
              <tr className="bg-[#033f3a] text-teal-400">
                {Array.from({ length: MONTHS[viewMonth].days }).map((_, i) => {
                  const dayNum = i + 1;
                  const date = new Date(parseInt(selectedYear), viewMonth, dayNum);
                  const dayOfWeek = date.getDay(); 
                  const { isRed, holidayName } = getRedDayInfo(viewMonth, dayNum);
                  const dayName = DAYS_ID[dayOfWeek];

                  return (
                    <th 
                      key={i} 
                      className={`${isCompact ? 'w-6 min-w-[26px] py-0.5 text-[7px]' : 'w-8 min-w-[40px] py-2 text-[8px]'} font-black border-r border-teal-800/30 leading-tight ${
                        isRed ? 'text-rose-400 bg-rose-900/30' : ''
                      }`}
                      title={holidayName}
                    >
                      <div className="flex flex-col items-center">
                        <span className="opacity-50">{dayName}</span>
                        <span className={isCompact ? 'text-[9px]' : 'text-[10px]'}>{dayNum}</span>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item, idx) => (
                <tr 
                  key={item.id} 
                  onClick={() => setSelectedRowId(selectedRowId === item.id ? null : item.id)}
                  className={`border-b border-teal-500/10 hover:bg-teal-900/20 transition-all group cursor-pointer ${
                    selectedRowId === item.id ? 'bg-teal-800/40 ring-1 ring-inset ring-teal-500/30 shadow-lg' : ''
                  }`}
                >
                  <td className={`px-2.5 ${isCompact ? 'py-1 text-[10px]' : 'py-3 text-[11px]'} font-black text-teal-500 border-r border-teal-800/30 sticky left-0 z-10 transition-colors group-hover:bg-[#022e2a] ${
                    selectedRowId === item.id ? 'bg-teal-700/50 text-white' : 'bg-[#011a18]'
                  }`}>
                    {idx + 1}
                  </td>
                  <td className={`px-3 ${isCompact ? 'py-1 text-[10px]' : 'py-3 text-[11px]'} font-bold text-white border-r border-teal-800/30 sticky ${isCompact ? 'left-9' : 'left-12'} z-10 transition-colors group-hover:bg-[#022e2a] ${
                    selectedRowId === item.id ? 'bg-teal-700/50 text-amber-300' : 'bg-[#011a18]'
                  }`}>
                    {item.ulp}
                  </td>
                  <td className={`px-2 ${isCompact ? 'py-1 text-[10px]' : 'py-3 text-[11px]'} font-medium text-teal-400 border-r border-teal-800/30 text-center`}>
                    {item.kodeUlp}
                  </td>
                  <td className={`px-3 ${isCompact ? 'py-1 text-[10px]' : 'py-3 text-[11px]'} font-medium text-teal-100 border-r border-teal-800/30`}>
                    {item.penyulang}
                  </td>
                  <td className={`px-2 ${isCompact ? 'py-1 text-[10px]' : 'py-3 text-[11px]'} font-bold text-teal-300 border-r border-teal-800/30 text-center`}>
                    {item.kms}
                  </td>
                  {/* Progress Bar Column */}
                  <td className={`px-2 ${isCompact ? 'py-0.5' : 'py-2.5'} border-r border-teal-800/30`}>
                    {(() => {
                      const { total, realized, percentage } = getRowProgress(item);
                      let barGradient = 'from-slate-600 to-slate-500';
                      let badgeColor = 'text-slate-400 bg-slate-800/60 border-slate-700/50';

                      if (total > 0) {
                        if (percentage === 100) {
                          barGradient = 'from-emerald-500 via-teal-400 to-emerald-300';
                          badgeColor = 'text-emerald-300 bg-emerald-500/20 border-emerald-500/40 shadow-sm shadow-emerald-950';
                        } else if (percentage >= 50) {
                          barGradient = 'from-amber-500 to-amber-300';
                          badgeColor = 'text-amber-300 bg-amber-500/20 border-amber-500/40';
                        } else if (percentage > 0) {
                          barGradient = 'from-sky-500 to-teal-400';
                          badgeColor = 'text-sky-300 bg-sky-500/20 border-sky-500/40';
                        }
                      }

                      return (
                        <div className={`flex flex-col ${isCompact ? 'gap-0.5 min-w-[90px]' : 'gap-1.5 min-w-[120px]'}`}>
                          <div className={`flex items-center justify-between ${isCompact ? 'text-[9px]' : 'text-[10px]'}`}>
                            <span className={`rounded-md border font-mono font-black tracking-tight ${badgeColor} ${isCompact ? 'px-1 py-0 text-[8px]' : 'px-1.5 py-0.5 text-[9px]'}`}>
                              {percentage}%
                            </span>
                            <span className={`${isCompact ? 'text-[9px]' : 'text-[10px]'} text-teal-300/80 font-bold`}>
                              {realized}/{total} <span className="opacity-60 font-normal">Selesai</span>
                            </span>
                          </div>
                          <div className={`w-full ${isCompact ? 'h-1.5' : 'h-2'} bg-teal-950/90 rounded-full overflow-hidden border border-teal-800/40 p-[1px] shadow-inner`}>
                            <div 
                              className={`h-full rounded-full transition-all duration-500 bg-gradient-to-r ${barGradient}`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })()}
                  </td>
                  <td className={`px-2 ${isCompact ? 'py-0.5' : 'py-3'} text-[11px] font-bold border-r border-teal-800/30 text-center`}>
                    <div className="flex items-center justify-center gap-1.5">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditItem(item);
                          setIsInputModalOpen(true);
                        }}
                        className={`${isCompact ? 'p-1' : 'p-1.5'} rounded-lg bg-teal-900/40 hover:bg-amber-500 hover:text-teal-950 text-amber-500 transition-all`}
                        title="Edit Data"
                      >
                        <Edit className={isCompact ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Hapus data ${item.penyulang}?`)) {
                            setData(prev => prev.filter(i => i.id !== item.id));
                          }
                        }}
                        className={`${isCompact ? 'p-1' : 'p-1.5'} rounded-lg bg-teal-900/40 hover:bg-rose-500 hover:text-white text-rose-500 transition-all`}
                        title="Hapus Data"
                      >
                        <Trash2 className={isCompact ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
                      </button>
                    </div>
                  </td>

                  {/* Calendar Days */}
                  {Array.from({ length: MONTHS[viewMonth].days }).map((_, i) => {
                    const day = i + 1;
                    const { isRed, holidayName } = getRedDayInfo(viewMonth, day);
                    return (
                      <td 
                        key={i} 
                        className={`${isCompact ? 'w-6 h-6' : 'w-8 h-10'} border-r border-teal-800/20 p-0 relative ${isRed ? 'bg-rose-950/20' : ''}`}
                        title={holidayName}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCellClick(item.id, viewMonth, day);
                        }}
                      >
                        {getCellContent(item, viewMonth, day)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Info */}
      <div className="flex flex-wrap items-center justify-between text-[10px] font-bold text-teal-600 uppercase tracking-widest px-2 gap-2">
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Total Realisasi: <strong className="text-emerald-300 font-mono">{overallStats.percentage}%</strong> ({overallStats.totalRealized}/{overallStats.totalSchedules} Jadwal)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span>Belum Realisasi: <strong className="text-amber-300 font-mono">{overallStats.totalSchedules - overallStats.totalRealized}</strong> Jadwal</span>
          </div>
        </div>
        <div>Total Penyulang: {filteredData.length} Data</div>
      </div>

      {/* Modals */}
      <InputJadwalInspeksiModal 
        isOpen={isInputModalOpen}
        onClose={() => {
          setIsInputModalOpen(false);
          setEditItem(null);
        }}
        onSave={handleSaveData}
        editItem={editItem}
      />

      <AnimatePresence>
        {isCellModalOpen && selectedCell && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-sm bg-[#011a18] border border-teal-500/30 rounded-3xl p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-teal-500/20 border border-teal-500/30">
                    <Calendar className="w-5 h-5 text-teal-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white uppercase">UPDATE JADWAL</h3>
                    <p className="text-[10px] font-bold text-teal-500 uppercase">{selectedCell.date}</p>
                  </div>
                </div>
                <button onClick={() => setIsCellModalOpen(false)} className="text-teal-600 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Detail Inputs */}
              <div className="space-y-4 mb-6 p-4 rounded-2xl bg-teal-950/30 border border-teal-500/10">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-teal-500 uppercase tracking-widest ml-1">Nama Section / Lokasi</label>
                  <input
                    type="text"
                    placeholder="e.g. Section 1 - Gawang 5-10"
                    value={cellSection}
                    onChange={(e) => setCellSection(e.target.value)}
                    className="w-full bg-teal-900/20 border border-teal-500/30 rounded-xl px-4 py-2 text-xs font-bold text-white placeholder-teal-800 focus:outline-none focus:border-amber-400/50 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-teal-500 uppercase tracking-widest ml-1">Jumlah Gawang (Inspeksi Saja)</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      value={cellJumlahGawang}
                      onChange={(e) => setCellJumlahGawang(parseInt(e.target.value) || 0)}
                      className="w-24 bg-teal-900/20 border border-teal-500/30 rounded-xl px-4 py-2 text-xs font-bold text-white focus:outline-none focus:border-amber-400/50 transition-all text-center"
                    />
                    <span className="text-[10px] font-bold text-teal-600 uppercase">Gawang</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2 mb-6">
                <button 
                  onClick={() => handleUpdateSchedule('INSPEKSI', false)}
                  className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-500 text-xs font-black transition-all"
                >
                  <SearchIcon className="w-4 h-4" />
                  RENCANA INSPEKSI
                </button>
                <button 
                  onClick={() => handleUpdateSchedule('INSPEKSI', true)}
                  className="flex items-center gap-3 p-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-teal-950 text-xs font-black transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  REALISASI INSPEKSI
                </button>
                <div className="h-px bg-teal-500/10 my-2" />
                <button 
                  onClick={() => handleUpdateSchedule('ROW', false)}
                  className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-500 text-xs font-black transition-all"
                >
                  <Trees className="w-4 h-4" />
                  RENCANA ROW
                </button>
                <button 
                  onClick={() => handleUpdateSchedule('ROW', true)}
                  className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-teal-950 text-xs font-black transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  REALISASI ROW
                </button>
                <div className="h-px bg-teal-500/10 my-2" />
                <button 
                  onClick={() => handleUpdateSchedule('NONE', false)}
                  className="flex items-center justify-center gap-3 p-3 rounded-xl bg-teal-900/20 hover:bg-teal-900/40 text-teal-500 text-[10px] font-black transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                  HAPUS JADWAL
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
