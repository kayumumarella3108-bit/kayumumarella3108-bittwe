import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  Zap,
  ClipboardList,
  AlertTriangle,
  Clock,
  Activity,
  MapPin,
  Layers,
  Wrench,
  ChevronRight,
  FileSpreadsheet,
  Gauge,
  UserCheck,
  ShieldAlert,
  HelpCircle,
  TrendingUp,
  BarChart2,
  CheckCircle2,
  AlertOctagon,
  TrendingDown,
  ArrowUpRight,
  Info,
  Printer,
  Filter,
  Calendar,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  Sparkles,
  Flame,
  CheckSquare
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
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
  Legend,
  AreaChart,
  Area,
  LineChart,
  Line,
  CartesianGrid,
  LabelList
} from 'recharts';
import {
  Penyulang,
  SectionJaringan,
  GangguanLog,
  ROWItem,
  InspeksiItem,
  SaidiSaifiData,
  ActivityLog,
  MaterialStokItem,
  User,
  ViewType,
  PerintahKerja,
  SurveyPbPdItem,
  PengukuranGardu
} from '../../types';
import { DAFTAR_UNIT_PLN, getUnitDetails } from '../../utils/unitConfig';
import { isOwnerUser } from '../../utils/permissions';
import { useSearch } from '../../context/SearchContext';
import {
  MonthlyCategoryTrendSection,
  GANGGUAN_CATEGORIES,
  classifyGangguanCategory,
  GangguanCategoryMeta
} from './MonthlyCategoryTrendSection';
import { MonitoringFrekuensiPenyulangView } from './MonitoringFrekuensiPenyulangView';
import { CustomDropdown } from '../common/CustomDropdown';

interface DashboardViewProps {
  currentUser?: User | null;
  penyulangList: Penyulang[];
  sectionList: SectionJaringan[];
  gangguanList: GangguanLog[];
  rowList: ROWItem[];
  inspeksiList: InspeksiItem[];
  spkList: PerintahKerja[];
  surveyList: SurveyPbPdItem[];
  saidiList: SaidiSaifiData[];
  activities: ActivityLog[];
  stokList: MaterialStokItem[];
  pengukuranList?: PengukuranGardu[];
  ownerSelectedUnitFilter?: string;
  onSelectUnitFilter?: (unit: string) => void;
  masterUnitList?: any[];
  onSelectView: (view: ViewType) => void;
  allPenyulangList?: Penyulang[];
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  currentUser,
  penyulangList,
  sectionList,
  gangguanList,
  rowList,
  inspeksiList,
  spkList,
  surveyList,
  saidiList,
  pengukuranList = [],
  ownerSelectedUnitFilter = 'SEMUA',
  onSelectUnitFilter,
  masterUnitList,
  onSelectView,
  allPenyulangList = []
}) => {
  // Active Tab for the 6 requested dashboards
  const [activeTab, setActiveTab] = useState<'executive' | 'pangkal' | 'kode' | 'gardu' | 'yantek' | 'survey'>('executive');
  const [dateRange, setDateRange] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');
  const [selectedFeeder, setSelectedFeeder] = useState<string | null>(null);
  const [selectedFeederForSections, setSelectedFeederForSections] = useState<string | null>(null);
  const [selectedDashboardUlp, setSelectedDashboardUlp] = useState<string>(ownerSelectedUnitFilter);
  const [selectedDashboardSection, setSelectedDashboardSection] = useState<string>('SEMUA');
  const [isComparisonMode, setIsComparisonMode] = useState<boolean>(false);
  const [selectedComparisonUlps, setSelectedComparisonUlps] = useState<string[]>([]);
  const { searchTerm } = useSearch();

  const [groupingMode, setGroupingMode] = useState<'none' | 'unit' | 'up3'>('none');

  const getUP3ForUnit = (unitName: string, masterUnits?: any[]): string => {
    if (!unitName) return 'UP3 AMBON';
    if (masterUnits && masterUnits.length > 0) {
      const found = masterUnits.find(m => 
        (m.ulp || '').toLowerCase().trim() === unitName.toLowerCase().trim() ||
        (m.id || '').toLowerCase().trim() === unitName.toLowerCase().trim()
      );
      if (found && found.up3) {
        return found.up3.toUpperCase();
      }
    }
    const staticFound = DAFTAR_UNIT_PLN.find(u => 
      u.namaUnit.toLowerCase().trim() === unitName.toLowerCase().trim()
    );
    if (staticFound && staticFound.kabupaten) {
      if (staticFound.kabupaten.toUpperCase().includes('UP3')) {
        return staticFound.kabupaten.toUpperCase();
      }
      if (staticFound.kabupaten.startsWith('Kabupaten') || staticFound.kabupaten.startsWith('Kota')) {
        return `UP3 SEKTOR ${staticFound.kabupaten.replace('Kabupaten ', '').replace('Kota ', '').toUpperCase()}`;
      }
      return staticFound.kabupaten.toUpperCase();
    }
    return 'UP3 AMBON';
  };

  const groupedPerformanceData = useMemo(() => {
    if (groupingMode === 'none') return [];

    const groups: {
      [key: string]: {
        name: string;
        up3: string;
        pelanggan: number;
        gardu: number;
        penyulangCount: number;
        frekuensiGangguan: number;
        durasiGangguan: number;
        spkSelesai: number;
        spkTotal: number;
        surveyTotal: number;
        surveyLayak: number;
        avgTegPangkalSum: number;
        avgTegPangkalCount: number;
        garduOverload: number;
      }
    } = {};

    const getOrCreateGroup = (unitName: string) => {
      let key = unitName || 'Unknown';
      if (groupingMode === 'up3') {
        key = getUP3ForUnit(unitName, masterUnitList);
      }

      if (!groups[key]) {
        groups[key] = {
          name: key,
          up3: groupingMode === 'up3' ? key : getUP3ForUnit(unitName, masterUnitList),
          pelanggan: 0,
          gardu: 0,
          penyulangCount: 0,
          frekuensiGangguan: 0,
          durasiGangguan: 0,
          spkSelesai: 0,
          spkTotal: 0,
          surveyTotal: 0,
          surveyLayak: 0,
          avgTegPangkalSum: 0,
          avgTegPangkalCount: 0,
          garduOverload: 0
        };
      }
      return groups[key];
    };

    // 1. Aggregate Customers, Gardu, and Feeders from penyulangList
    penyulangList.forEach(p => {
      const unitName = p.unit || 'ULP Baguala';
      const g = getOrCreateGroup(unitName);
      g.pelanggan += p.jumlahPelanggan || 0;
      g.gardu += p.jumlahGardu || 0;
      g.penyulangCount += 1;
    });

    // 2. Aggregate Outages from gangguanList
    gangguanList.forEach(g => {
      const unitName = g.unit || 'ULP Baguala';
      const group = getOrCreateGroup(unitName);
      group.frekuensiGangguan += 1;
      group.durasiGangguan += parseFloat(g.durasi) || 45;
    });

    // 3. Aggregate SPKs from spkList
    spkList.forEach(s => {
      const unitName = s.unit || 'ULP Baguala';
      const group = getOrCreateGroup(unitName);
      group.spkTotal += 1;
      if (s.status === 'Selesai') {
        group.spkSelesai += 1;
      }
    });

    // 4. Aggregate Surveys from surveyList
    surveyList.forEach(s => {
      const unitName = s.unit || 'ULP Baguala';
      const group = getOrCreateGroup(unitName);
      group.surveyTotal += 1;
      if (s.statusKelayakan === 'Layak Sambung' || s.statusKelayakan === 'Selesai Penyambungan') {
        group.surveyLayak += 1;
      }
      if (s.tegPangkal && s.tegPangkal > 0) {
        group.avgTegPangkalSum += s.tegPangkal;
        group.avgTegPangkalCount += 1;
      }
    });

    // 5. Aggregate Gardu Overloads from pengukuranList
    pengukuranList.forEach(p => {
      const unitName = p.unit || 'ULP Baguala';
      const group = getOrCreateGroup(unitName);
      const avgCurrent = (p.iRTotal + p.iSTotal + p.iTTotal) / 3;
      const capacityKva = p.dayaKva || 100;
      const calculatedLoadKva = (avgCurrent * 380 * 1.732 * 0.85) / 1000;
      const loadPercent = capacityKva > 0 ? (calculatedLoadKva / capacityKva) * 100 : 0;
      if (loadPercent > 80) {
        group.garduOverload += 1;
      }
    });

    // Handle edge case of completely empty database (inject mock items grouped by unit/up3 for gorgeous visual look)
    const resultList = Object.values(groups);
    if (resultList.length === 0 || resultList.every(r => r.pelanggan === 0 && r.frekuensiGangguan === 0)) {
      const isOwner = isOwnerUser(currentUser);
      const userUnit = currentUser?.unit || 'ULP Baguala';
      const activeUnits = masterUnitList && masterUnitList.length > 0 
        ? masterUnitList.map(m => m.ulp) 
        : DAFTAR_UNIT_PLN.filter(u => u.tipe === 'ULP').map(u => u.namaUnit);

      const filteredActiveUnits = isOwner ? activeUnits : activeUnits.filter(u => u === userUnit);
      const uniqueKeys = new Set(filteredActiveUnits.map(u => groupingMode === 'up3' ? getUP3ForUnit(u, masterUnitList) : u));
      return Array.from(uniqueKeys).map((key, index) => {
        const seedValue = isOwner 
          ? ([48500, 31200, 24500, 20300, 18500, 15000, 12000][index % 7] || 10000)
          : 12450;
        return {
          name: key,
          up3: groupingMode === 'up3' ? key : 'UP3 AMBON',
          pelanggan: seedValue,
          gardu: Math.round(seedValue / 100) || 50,
          penyulangCount: Math.round(seedValue / 4000) || 3,
          frekuensiGangguan: [18, 12, 10, 8, 5, 4, 2][index % 7] || 3,
          durasiGangguan: [810, 540, 450, 360, 225, 180, 90][index % 7] || 120,
          spkSelesai: [15, 10, 8, 6, 4, 3, 2][index % 7] || 2,
          spkTotal: [20, 15, 12, 10, 6, 5, 3][index % 7] || 3,
          surveyTotal: [12, 8, 6, 5, 3, 2, 1][index % 7] || 2,
          surveyLayak: [8, 6, 4, 3, 2, 1, 1][index % 7] || 1,
          avgTegPangkalSum: 218,
          avgTegPangkalCount: 1,
          garduOverload: [3, 2, 1, 1, 0, 0, 0][index % 7] || 0
        };
      });
    }

    return resultList.sort((a, b) => b.pelanggan - a.pelanggan);
  }, [groupingMode, penyulangList, gangguanList, spkList, surveyList, pengukuranList, masterUnitList]);

  // Update local dashboard filter if prop changes
  React.useEffect(() => {
    setSelectedDashboardUlp(ownerSelectedUnitFilter);
  }, [ownerSelectedUnitFilter]);

  const availableSections = useMemo(() => {
    const sections = new Set<string>();
    
    // Extract from sectionList
    sectionList.forEach(s => {
       if (!selectedDashboardUlp || selectedDashboardUlp === 'SEMUA' || s.unit === selectedDashboardUlp) {
           if (s.namaSection) sections.add(s.namaSection);
       }
    });

    // Also extract from gangguanList
    gangguanList.forEach(g => {
       if (!selectedDashboardUlp || selectedDashboardUlp === 'SEMUA' || g.unit === selectedDashboardUlp) {
           if (g.section && g.section.trim() !== '' && g.section.trim() !== '-') sections.add(g.section);
       }
    });
    
    return Array.from(sections).sort();
  }, [sectionList, gangguanList, selectedDashboardUlp]);

  const filteredGangguanList = useMemo(() => {
    let list = gangguanList;
    if (selectedDashboardUlp !== 'SEMUA') {
        list = list.filter(g => g.unit === selectedDashboardUlp);
    }
    if (selectedDashboardSection !== 'SEMUA') {
        list = list.filter(g => g.section === selectedDashboardSection);
    }
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      list = list.filter(g => 
        (g.namaPenyulang || '').toLowerCase().includes(lowerSearch) ||
        (g.section || '').toLowerCase().includes(lowerSearch) ||
        (g.id || '').toLowerCase().includes(lowerSearch)
      );
    }
    return list;
  }, [gangguanList, searchTerm, selectedDashboardUlp, selectedDashboardSection]);

  // Comparative data for all ULPs
  const comparativeStats = useMemo(() => {
    const ulpStats: { [key: string]: number } = {};
    gangguanList.forEach(g => {
        const ulp = g.unit || 'Unknown';
        ulpStats[ulp] = (ulpStats[ulp] || 0) + 1;
    });
    return Object.entries(ulpStats).map(([name, count]) => ({ name, count }));
  }, [gangguanList]);

  // Monthly Outage Trend (Last 12 Months)
  const monthlyOutageData = useMemo(() => {
    const data = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthName = date.toLocaleString('id-ID', { month: 'short' });
        data.push({ name: monthName, count: 0 });
    }
    
    gangguanList.forEach(g => {
        if (g.jamMasuk && g.jamMasuk !== '-' && g.jamMasuk !== '') {
            const gDate = new Date(g.jamMasuk);
            const diffMonths = (now.getFullYear() - gDate.getFullYear()) * 12 + (now.getMonth() - gDate.getMonth());
            if (diffMonths >= 0 && diffMonths < 12) {
                data[11 - diffMonths].count += 1;
            }
        }
    });
    
    return data;
  }, [gangguanList]);

  // 1. UNIT DETAILS & BRANDING
  const unitInfo = useMemo(() => {
    const activeUnit = ownerSelectedUnitFilter && ownerSelectedUnitFilter !== 'SEMUA' 
      ? ownerSelectedUnitFilter 
      : (currentUser?.unit || 'ULP Baguala');
    return getUnitDetails(activeUnit, masterUnitList);
  }, [currentUser, ownerSelectedUnitFilter, masterUnitList]);

  // Global counts for cards
  const totalPelanggan = useMemo(() => {
    const count = penyulangList.reduce((acc, curr) => acc + (curr.jumlahPelanggan || 0), 0);
    return count || (ownerSelectedUnitFilter === 'SEMUA' ? 85250 : 12450);
  }, [penyulangList, ownerSelectedUnitFilter]);

  const totalPelangganSistemOverall = useMemo(() => {
    const isOwner = isOwnerUser(currentUser);
    const allowedList = isOwner 
      ? allPenyulangList 
      : allPenyulangList.filter(p => p.unit === (currentUser?.unit || 'ULP Baguala'));
    const count = allowedList.reduce((acc, curr) => acc + (curr.jumlahPelanggan || 0), 0);
    return count || (isOwner ? 85250 : 12450);
  }, [allPenyulangList, currentUser]);

  const customerDistributionData = useMemo(() => {
    const data = penyulangList
      .filter(p => (p.jumlahPelanggan || 0) > 0 || p.namaPenyulang)
      .map(p => ({
        id: p.id,
        name: p.namaPenyulang || p.id,
        pelanggan: p.jumlahPelanggan || 0,
        panjangKms: p.panjangJaringanKms || 0,
        indeksSehat: p.healthIndexStatus || 'Sehat',
        jumlahGardu: p.jumlahGardu || 0,
        unit: p.unit || 'ULP Baguala'
      }))
      .sort((a, b) => b.pelanggan - a.pelanggan);

    if (data.length === 0) {
      const u = currentUser?.unit || 'ULP Baguala';
      return [
        { id: 'p_1', name: 'Penyulang Passo', pelanggan: 4850, panjangKms: 45.2, indeksSehat: 'Sehat', jumlahGardu: 38, unit: u },
        { id: 'p_2', name: 'Penyulang Hunuth', pelanggan: 3120, panjangKms: 32.8, indeksSehat: 'Sempurna', jumlahGardu: 25, unit: u },
        { id: 'p_3', name: 'Penyulang Tulehu', pelanggan: 2450, panjangKms: 28.5, indeksSehat: 'Sakit', jumlahGardu: 20, unit: u },
        { id: 'p_4', name: 'Penyulang Suli', pelanggan: 2030, panjangKms: 22.4, indeksSehat: 'Sehat', jumlahGardu: 15, unit: u },
        { id: 'p_5', name: 'Penyulang Waai', pelanggan: 1850, panjangKms: 18.2, indeksSehat: 'Kronis', jumlahGardu: 12, unit: u }
      ];
    }
    return data;
  }, [penyulangList]);

  const sectionsForSelectedFeeder = useMemo(() => {
    if (!selectedFeederForSections) return [];
    return sectionList
      .filter(s => 
        s.namaPenyulang?.trim().toUpperCase() === selectedFeederForSections.trim().toUpperCase() ||
        s.penyulangId === selectedFeederForSections
      )
      .map(s => ({
        id: s.id,
        name: s.namaSection || s.id,
        pelanggan: s.jumlahPelanggan || 0,
        sistemOperasi: s.sistemOperasi || 'Radial'
      }))
      .sort((a, b) => b.pelanggan - a.pelanggan);
  }, [sectionList, selectedFeederForSections]);

  // 2. DASHBOARD GANGGUAN PANGKAL DATA CALCULATIONS
  const gangguanPangkalStats = useMemo(() => {
    // Group outages by feeder (penyulang)
    const feederMap: { [key: string]: { count: number; duration: number; maxCurrent: number } } = {};
    filteredGangguanList.forEach(g => {
      const pName = g.namaPenyulang || 'Penyulang Tidak Dikenal';
      const durMin = parseFloat(g.durasi) || 45; // default estimation
      const maxArus = Math.max(g.arusR || 0, g.arusS || 0, g.arusT || 0);

      if (!feederMap[pName]) {
        feederMap[pName] = { count: 0, duration: 0, maxCurrent: 0 };
      }
      feederMap[pName].count += 1;
      feederMap[pName].duration += durMin;
      feederMap[pName].maxCurrent = Math.max(feederMap[pName].maxCurrent, maxArus);
    });

    const list = Object.entries(feederMap).map(([name, data]) => ({
      name,
      jumlahGangguan: data.count,
      totalDurasiMenit: Math.round(data.duration),
      arusMaksimum: data.maxCurrent
    })).sort((a, b) => b.jumlahGangguan - a.jumlahGangguan);

    // Default visualization mock helper to avoid fully empty charts
    if (list.length === 0) {
      return [
        { name: 'Feeder Passo', jumlahGangguan: 8, totalDurasiMenit: 360, arusMaksimum: 120 },
        { name: 'Feeder Hunuth', jumlahGangguan: 5, totalDurasiMenit: 220, arusMaksimum: 95 },
        { name: 'Feeder Tulehu', jumlahGangguan: 4, totalDurasiMenit: 180, arusMaksimum: 80 },
        { name: 'Feeder Suli', jumlahGangguan: 3, totalDurasiMenit: 120, arusMaksimum: 110 }
      ];
    }
    return list;
  }, [filteredGangguanList]);

  // 3. DASHBOARD PER KODE GANGGUAN DATA CALCULATIONS
  const kodeGangguanStats = useMemo(() => {
    const codeMap: { [key: string]: { count: number; penyebab: string } } = {
      'F1 (Pohon / Tanaman)': { count: 0, penyebab: 'Senggolan pelepah kelapa / dahan pohon' },
      'F2 (Hewan / Kelelawar)': { count: 0, penyebab: 'Tupai / kelelawar menyentuh konduktor' },
      'F3 (Petir)': { count: 0, penyebab: 'Induksi petir pada jaringan tanpa LA' },
      'F4 (Material Peralatan)': { count: 0, penyebab: 'Isolator pecah / jumper putus' },
      'F5 (Lain-lain / External)': { count: 0, penyebab: 'Benang layang-layang / tiang tertabrak kendaraan' }
    };

    let classifiedCount = 0;
    filteredGangguanList.forEach(g => {
      const code = (g.kodeGangguan || '').trim().toUpperCase();
      const p = (g.penyebab || '').toLowerCase();

      if (code.includes('F1') || p.includes('pohon') || p.includes('bambu')) {
        codeMap['F1 (Pohon / Tanaman)'].count += 1;
        classifiedCount++;
      } else if (code.includes('F2') || p.includes('hewan') || p.includes('burung') || p.includes('kelelawar') || p.includes('tupai')) {
        codeMap['F2 (Hewan / Kelelawar)'].count += 1;
        classifiedCount++;
      } else if (code.includes('F3') || p.includes('petir') || p.includes('kilat')) {
        codeMap['F3 (Petir)'].count += 1;
        classifiedCount++;
      } else if (code.includes('F4') || p.includes('trafo') || p.includes('fco') || p.includes('isolator') || p.includes('jumper') || p.includes('material')) {
        codeMap['F4 (Material Peralatan)'].count += 1;
        classifiedCount++;
      } else {
        codeMap['F5 (Lain-lain / External)'].count += 1;
        classifiedCount++;
      }
    });

    const colors = ['#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#64748b'];

    const result = Object.entries(codeMap).map(([name, data], idx) => ({
      name,
      value: data.count || (ownerSelectedUnitFilter === 'SEMUA' ? [12, 8, 5, 4, 3][idx] : 0),
      color: colors[idx],
      penyebab: data.penyebab
    }));

    return result;
  }, [gangguanList, ownerSelectedUnitFilter]);

  // Statistik Gangguan Per Bulan (Total per Bulan)
  const monthlyOverallStats = useMemo(() => {
    const monthCounts: Record<string, number> = {
      'Jan': 0, 'Feb': 0, 'Mar': 0, 'Apr': 0, 'May': 0, 'Jun': 0,
      'Jul': 0, 'Aug': 0, 'Sep': 0, 'Oct': 0, 'Nov': 0, 'Dec': 0
    };
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    filteredGangguanList.forEach(g => {
      try {
        const date = new Date(g.waktuTrip);
        if (!isNaN(date.getTime())) {
          const m = months[date.getMonth()];
          monthCounts[m] = (monthCounts[m] || 0) + 1;
        }
      } catch (e) {
        // ignore
      }
    });

    // Jika kosong, injeksi mock data untuk preview UI
    if (filteredGangguanList.length === 0) {
      return [
        { month: 'Jan', total: 12 }, { month: 'Feb', total: 19 }, { month: 'Mar', total: 15 },
        { month: 'Apr', total: 22 }, { month: 'May', total: 18 }, { month: 'Jun', total: 25 },
        { month: 'Jul', total: 14 }, { month: 'Aug', total: 9 },  { month: 'Sep', total: 30 },
        { month: 'Oct', total: 16 }, { month: 'Nov', total: 11 }, { month: 'Dec', total: 8 }
      ];
    }
    
    return months.map(month => ({
      month,
      total: monthCounts[month]
    }));
  }, [filteredGangguanList]);

  // 4. DASHBOARD PENGUKURAN GARDU DATA CALCULATIONS
  const garduMeasurementStats = useMemo(() => {
    let overloadCount = 0;
    let normalCount = 0;
    let underloadCount = 0;

    const list = pengukuranList.map(p => {
      // Estimated loading based on peak phase current
      const avgCurrent = (p.iRTotal + p.iSTotal + p.iTTotal) / 3;
      const capacityKva = p.dayaKva || 100;
      // Formula loading percent = (avgCurrent * 380 * 1.732 * 0.85) / (capacityKva * 1000) * 100
      const calculatedLoadKva = (avgCurrent * 380 * 1.732 * 0.85) / 1000;
      const loadPercent = capacityKva > 0 ? Math.min(120, Math.round((calculatedLoadKva / capacityKva) * 100)) : 0;

      let status: 'NORMAL' | 'OVERLOAD' | 'UNDERLOAD' = 'NORMAL';
      if (loadPercent > 80) {
        status = 'OVERLOAD';
        overloadCount++;
      } else if (loadPercent < 20) {
        status = 'UNDERLOAD';
        underloadCount++;
      } else {
        normalCount++;
      }

      // Calculate imbalance factor (Standard deviation / average current)
      const maxCurrent = Math.max(p.iRTotal, p.iSTotal, p.iTTotal);
      const minCurrent = Math.min(p.iRTotal, p.iSTotal, p.iTTotal);
      const diffPercent = avgCurrent > 0 ? Math.round(((maxCurrent - minCurrent) / avgCurrent) * 100) : 0;

      return {
        id: p.id,
        noGardu: p.noGardu,
        penyulang: p.penyulang || 'Passo',
        dayaKva: capacityKva,
        loadPercent,
        status,
        diffPercent,
        neutralCurrent: p.iNTotal,
        petugas: p.petugas
      };
    });

    // Visual fallbacks if empty
    if (list.length === 0) {
      return {
        overload: ownerSelectedUnitFilter === 'SEMUA' ? 4 : 0,
        normal: ownerSelectedUnitFilter === 'SEMUA' ? 18 : 0,
        underload: ownerSelectedUnitFilter === 'SEMUA' ? 8 : 0,
        avgUnbalance: ownerSelectedUnitFilter === 'SEMUA' ? 18 : 0,
        criticalGardus: [
          { noGardu: 'BG-012', loadPercent: 92, diffPercent: 34, neutralCurrent: 28, dayaKva: 100 },
          { noGardu: 'BG-045', loadPercent: 88, diffPercent: 28, neutralCurrent: 19, dayaKva: 160 },
          { noGardu: 'BG-072', loadPercent: 85, diffPercent: 42, neutralCurrent: 35, dayaKva: 100 }
        ],
        pieData: [
          { name: 'Overload (>80%)', value: 4, color: '#f43f5e' },
          { name: 'Normal (20-80%)', value: 18, color: '#10b981' },
          { name: 'Underload (<20%)', value: 8, color: '#3b82f6' }
        ]
      };
    }

    return {
      overload: overloadCount,
      normal: normalCount,
      underload: underloadCount,
      avgUnbalance: Math.round(list.reduce((sum, x) => sum + x.diffPercent, 0) / list.length),
      criticalGardus: list.filter(x => x.status === 'OVERLOAD' || x.diffPercent > 30).slice(0, 5),
      pieData: [
        { name: 'Overload (>80%)', value: overloadCount, color: '#f43f5e' },
        { name: 'Normal (20-80%)', value: normalCount, color: '#10b981' },
        { name: 'Underload (<20%)', value: underloadCount, color: '#3b82f6' }
      ]
    };
  }, [pengukuranList, ownerSelectedUnitFilter]);

  // 5. DASHBOARD MONITORING YANTEK DATA CALCULATIONS
  const yantekPerformanceStats = useMemo(() => {
    const filteredSpkList = selectedDashboardUlp === 'SEMUA' ? spkList : spkList.filter(s => s.unit === selectedDashboardUlp);
    const totalSpk = filteredSpkList.length;
    const selesaiSpk = filteredSpkList.filter(s => s.status === 'Selesai').length;
    const prosesSpk = filteredSpkList.filter(s => s.status === 'Dalam Proses').length;
    const rencanaSpk = filteredSpkList.filter(s => s.status === 'Terencana' || s.status === 'Draft').length;

    const totalGangguan = filteredGangguanList.length;
    const selesaiGangguan = filteredGangguanList.filter(g => g.jamMasuk && g.jamMasuk !== '-' && g.jamMasuk !== '').length;
    const pendingGangguan = totalGangguan - selesaiGangguan;

    const completionRate = totalSpk > 0 ? Math.round((selesaiSpk / totalSpk) * 100) : 100;

    return {
      totalSpk: totalSpk || (selectedDashboardUlp === 'SEMUA' ? 18 : 0),
      selesaiSpk: selesaiSpk || (selectedDashboardUlp === 'SEMUA' ? 12 : 0),
      prosesSpk: prosesSpk || (selectedDashboardUlp === 'SEMUA' ? 4 : 0),
      rencanaSpk: rencanaSpk || (selectedDashboardUlp === 'SEMUA' ? 2 : 0),
      totalGangguan: totalGangguan || (selectedDashboardUlp === 'SEMUA' ? 34 : 0),
      selesaiGangguan: selesaiGangguan || (selectedDashboardUlp === 'SEMUA' ? 26 : 0),
      pendingGangguan: pendingGangguan || (selectedDashboardUlp === 'SEMUA' ? 8 : 0),
      completionRate: totalSpk > 0 ? completionRate : (selectedDashboardUlp === 'SEMUA' ? 75 : 100),
      spkChartData: [
        { name: 'Selesai', Jumlah: selesaiSpk || 12 },
        { name: 'Dalam Proses', Jumlah: prosesSpk || 4 },
        { name: 'Terencana', Jumlah: rencanaSpk || 2 }
      ]
    };
  }, [spkList, filteredGangguanList, selectedDashboardUlp]);

  // 6. DASHBOARD SURVEY PB PD DATA CALCULATIONS
  const surveyStatsData = useMemo(() => {
    const filteredSurveyList = selectedDashboardUlp === 'SEMUA' ? surveyList : surveyList.filter(s => s.unit === selectedDashboardUlp);
    const totalSurvey = filteredSurveyList.length;
    const pasangBaru = filteredSurveyList.filter(s => s.jenisTransaksi === 'Pasang Baru (PB)').length;
    const perubahanDaya = filteredSurveyList.filter(s => s.jenisTransaksi === 'Perubahan Daya (PD)').length;

    // Feasibility status mapping
    const statusMap: { [key: string]: number } = {};
    filteredSurveyList.forEach(s => {
      const status = s.statusKelayakan || 'Perlu Survey Lapangan';
      statusMap[status] = (statusMap[status] || 0) + 1;
    });

    const listStatus = Object.entries(statusMap).map(([name, val]) => ({
      name,
      value: val
    })).sort((a, b) => b.value - a.value);

    // Calculate voltage statistics
    const validTegangan = filteredSurveyList.filter(s => (s.tegPangkal || 0) > 0);
    const avgTegPangkal = validTegangan.length > 0 
      ? Math.round(validTegangan.reduce((sum, s) => sum + (s.tegPangkal || 220), 0) / validTegangan.length)
      : 218;

    return {
      totalSurvey: totalSurvey || (selectedDashboardUlp === 'SEMUA' ? 14 : 0),
      pasangBaru: pasangBaru || (selectedDashboardUlp === 'SEMUA' ? 10 : 0),
      perubahanDaya: perubahanDaya || (selectedDashboardUlp === 'SEMUA' ? 4 : 0),
      avgTegPangkal,
      listStatus: listStatus.length > 0 ? listStatus : [
        { name: 'Layak Sambung', value: 8 },
        { name: 'WO Survey Diterbitkan', value: 3 },
        { name: 'Perlu Sisip Tiang', value: 2 },
        { name: 'Drop Tegangan', value: 1 }
      ],
      pieData: [
        { name: 'Pasang Baru (PB)', value: pasangBaru || 10, color: '#10b981' },
        { name: 'Perubahan Daya (PD)', value: perubahanDaya || 4, color: '#f59e0b' }
      ]
    };
  }, [surveyList, selectedDashboardUlp]);

  const handleExportPDF = () => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const timestamp = new Date().toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Color definitions (PLN / Corporate theme)
    const primaryColor: [number, number, number] = [13, 148, 136]; // Teal-600

    // Title & Header Branding
    doc.setFillColor(15, 23, 42); // Header background
    doc.rect(0, 0, 210, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('LAPORAN KEANDALAN & DISTRIBUSI TERPADU 20KV', 14, 18);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(204, 251, 241); // Light teal text
    doc.text(`SISTEM MONITORING REALTIME TERPADU - PLN ${unitInfo.namaUnit.toUpperCase()}`, 14, 25);
    doc.text(`Waktu Cetak: ${timestamp} | Filter Unit: ${ownerSelectedUnitFilter}`, 14, 32);

    // 1. RINGKASAN METRIK UTAMA
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('I. RINGKASAN METRIK UTAMA', 14, 50);

    // Table of general metrics
    const summaryData = [
      ['Total Pelanggan Tersambung', totalPelanggan.toLocaleString() + ' Pelanggan'],
      ['Total Gardu Distribusi Aktif', (sectionList.length || (ownerSelectedUnitFilter === 'SEMUA' ? 150 : 0)).toLocaleString() + ' Gardu'],
      ['Total Penyulang SUTM 20kV', (penyulangList.length || (ownerSelectedUnitFilter === 'SEMUA' ? 24 : 0)).toLocaleString() + ' Penyulang'],
      ['Surat Perintah Kerja Yantek Harian', yantekPerformanceStats.totalSpk.toString() + ' SPK'],
      ['Agenda Survey PB/PD Kelayakan', surveyStatsData.totalSurvey.toString() + ' Agenda']
    ];

    autoTable(doc, {
      startY: 55,
      head: [['Metrik Operasional', 'Nilai / Kapasitas']],
      body: summaryData,
      theme: 'grid',
      headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: { 1: { fontStyle: 'bold', halign: 'right' } }
    });

    // 2. GANGGUAN PANGKAL (FEEDER SUTM)
    let currentY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('II. ANALISIS GANGGUAN PANGKAL (FEEDER SUTM 20KV)', 14, currentY);

    const pangkalRows = gangguanPangkalStats.slice(0, 5).map(g => [
      g.name,
      g.jumlahGangguan.toString() + ' kali',
      g.totalDurasiMenit.toString() + ' menit',
      g.arusMaksimum.toString() + ' A'
    ]);

    autoTable(doc, {
      startY: currentY + 5,
      head: [['Nama Penyulang / Feeder', 'Frekuensi Trip PMT', 'Total Durasi Padam', 'Arus Gangguan Puncak']],
      body: pangkalRows.length > 0 ? pangkalRows : [['-', '-', '-', '-']],
      theme: 'striped',
      headStyles: { fillColor: [245, 158, 11] }, // Amber
      styles: { fontSize: 9, cellPadding: 3 }
    });

    // 3. KLASIFIKASI KODE GANGGUAN
    currentY = (doc as any).lastAutoTable.finalY + 10;
    
    // Page break if near bottom
    if (currentY > 230) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('III. KLASIFIKASI PENYEBAB & KODE GANGGUAN (F1 - F5)', 14, currentY);

    const kodeRows = kodeGangguanStats.map((d) => [
      d.name,
      d.value.toString() + ' kali',
      d.value > 0 ? Math.round((d.value / (gangguanList.length || 1)) * 100).toString() + '%' : '0%',
      d.penyebab
    ]);

    autoTable(doc, {
      startY: currentY + 5,
      head: [['Kode Gangguan', 'Jumlah Kasus', 'Persentase', 'Deskripsi Umum']],
      body: kodeRows,
      theme: 'striped',
      headStyles: { fillColor: [16, 185, 129] }, // Emerald
      styles: { fontSize: 8.5, cellPadding: 2.5 }
    });

    // 4. KESEHATAN BEBAN TRAFO GTT & GARDU CRITICAL
    currentY = (doc as any).lastAutoTable.finalY + 10;
    if (currentY > 230) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('IV. KINERJA BEBAN GARDU DISTRIBUSI (TRAFO GTT)', 14, currentY);

    const garduSummary = [
      ['Kategori Overload (>80%)', garduMeasurementStats.overload.toString() + ' Gardu', 'Rekomendasi uprating trafo segera'],
      ['Kategori Normal (20-80%)', garduMeasurementStats.normal.toString() + ' Gardu', 'Pemantauan berkala beban puncak'],
      ['Kategori Underload (<20%)', garduMeasurementStats.underload.toString() + ' Gardu', 'Potensi mutasi trafo idle'],
      ['Rata-Rata Ketidakseimbangan Beban fasa', garduMeasurementStats.avgUnbalance.toString() + '%', 'Diperlukan balancing beban fasa R-S-T']
    ];

    autoTable(doc, {
      startY: currentY + 5,
      head: [['Parameter Pengukuran', 'Hasil / Akumulasi', 'Rekomendasi Teknis']],
      body: garduSummary,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] }, // Blue
      styles: { fontSize: 9, cellPadding: 3 }
    });

    // 5. MONITORING TIM PELAYANAN TEKNIK (YANTEK) & SURVEY PB/PD
    currentY = (doc as any).lastAutoTable.finalY + 10;
    if (currentY > 220) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('V. MONITORING PROGRES YANTEK & LAYANAN SURVEY PB/PD', 14, currentY);

    const yantekSurveyRows = [
      ['Total SPK Yantek', yantekPerformanceStats.totalSpk.toString(), 'Prosentase Selesai', yantekPerformanceStats.completionRate.toString() + '%'],
      ['SPK Selesai', yantekPerformanceStats.selesaiSpk.toString(), 'SPK Dalam Proses', yantekPerformanceStats.prosesSpk.toString()],
      ['Total Agenda Survey', surveyStatsData.totalSurvey.toString(), 'Rata-rata Tegangan Pangkal', surveyStatsData.avgTegPangkal.toString() + ' Volt'],
      ['Layanan Pasang Baru (PB)', surveyStatsData.pasangBaru.toString(), 'Layanan Perubahan Daya (PD)', surveyStatsData.perubahanDaya.toString()]
    ];

    autoTable(doc, {
      startY: currentY + 5,
      head: [['Layanan Teknik', 'Status SPK', 'Layanan Pelanggan', 'Status Survey']],
      body: yantekSurveyRows,
      theme: 'grid',
      headStyles: { fillColor: [139, 92, 246] }, // Purple/Violet
      styles: { fontSize: 8.5, cellPadding: 2.5 }
    });

    // Footer with signature page lines
    const totalPages = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(`Halaman ${i} dari ${totalPages}`, 180, 287);
      doc.text('PT PLN (Persero) Wilayah Maluku dan Maluku Utara - Keandalan Distribusi 20kV', 14, 287);
    }

    // Save PDF
    doc.save(`Laporan_Keandalan_PLN_${unitInfo.namaUnit.replace(/\s+/g, '_')}_${timestamp.split(',')[0].replace(/\//g, '-')}.pdf`);
  };

  return (
    <div id="unified_dashboard_canvas" className="p-4 md:p-6 space-y-6 bg-slate-50 text-slate-950 font-sans min-h-screen">
      
      {/* Upper Brand Card */}
      <div id="brand_header_container" className="p-6 bg-gradient-to-r from-[#022623] via-[#044c45] to-[#022e2a] text-white rounded-2xl shadow-xl border border-teal-500/40 relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Sistem Monitoring Realtime Terpadu
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
            <Activity className="w-6 h-6 text-emerald-400 shrink-0" />
            Dashboard Keandalan &amp; Distribusi 20kV
          </h1>
          <p className="text-xs text-teal-200/90 flex items-center gap-1.5 pt-0.5">
            <MapPin className="w-3.5 h-3.5 text-teal-400 shrink-0" />
            <span>PLN Unit Layanan Pelanggan (ULP): <strong className="text-white uppercase font-extrabold">{unitInfo.namaUnit}</strong></span>
          </p>
        </div>
      </div>

      {/* Control Bar: Filter ULP, Rentang & Cetak PDF / Print (Placed Below Header) */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 relative z-50">
        <div className="flex flex-wrap items-center gap-3">
          {/* Filter ULP (Custom Dropdown locked for non-owner) */}
          <div className="flex items-center gap-2 bg-teal-950/5 border border-teal-800/15 px-2.5 py-1 rounded-xl">
            <Filter className="w-3.5 h-3.5 text-teal-700 shrink-0" />
            <span className="text-[11px] font-extrabold text-teal-950 uppercase tracking-wider whitespace-nowrap">Filter ULP:</span>
            {isOwnerUser(currentUser) ? (
              <CustomDropdown
                options={[
                  { value: 'SEMUA', label: '🌐 Semua Unit ULP' },
                  ...DAFTAR_UNIT_PLN.filter(u => u.tipe === 'ULP').map(u => ({
                    value: u.namaUnit,
                    label: u.namaUnit,
                    subLabel: `Kode: ${u.kodeUnit}`,
                    badge: u.kodeUnit
                  }))
                ]}
                value={ownerSelectedUnitFilter}
                onChange={(val) => onSelectUnitFilter && onSelectUnitFilter(val)}
                variant="light"
                searchable={true}
                searchPlaceholder="Cari ULP..."
                placeholder="Semua Unit ULP"
                buttonClassName="py-1 px-2.5 bg-white text-slate-900 border-slate-300 text-xs font-bold min-w-[170px]"
              />
            ) : (
              <div className="py-1 px-2.5 bg-teal-50/50 text-teal-950 border border-teal-800/20 text-xs font-black rounded-lg flex items-center gap-1">
                <span>🔒 {currentUser?.unit || 'ULP Baguala'}</span>
              </div>
            )}
          </div>

          {/* Filter Section (Custom Dropdown) */}
          <div className="flex items-center gap-2 bg-teal-950/5 border border-teal-800/15 px-2.5 py-1 rounded-xl">
            <Filter className="w-3.5 h-3.5 text-teal-700 shrink-0" />
            <span className="text-[11px] font-extrabold text-teal-950 uppercase tracking-wider whitespace-nowrap">Filter Section:</span>
            <CustomDropdown
              options={[
                { value: 'SEMUA', label: '🌐 Semua Section' },
                ...availableSections.map(s => ({
                  value: s,
                  label: s
                }))
              ]}
              value={selectedDashboardSection}
              onChange={(val) => setSelectedDashboardSection(val)}
              variant="light"
              searchable={true}
              searchPlaceholder="Cari Section..."
              placeholder="Semua Section"
              buttonClassName="py-1 px-2.5 bg-white text-slate-900 border-slate-300 text-xs font-bold min-w-[150px]"
            />
          </div>

          {/* Rentang (Custom Dropdown opens downwards) */}
          <div className="flex items-center gap-2 bg-teal-950/5 border border-teal-800/15 px-2.5 py-1 rounded-xl">
            <Calendar className="w-3.5 h-3.5 text-teal-700 shrink-0" />
            <span className="text-[11px] font-extrabold text-teal-950 uppercase tracking-wider whitespace-nowrap">Rentang:</span>
            <CustomDropdown
              options={[
                { value: 'weekly', label: '📅 Mingguan' },
                { value: 'monthly', label: '📅 Bulanan' },
                { value: 'yearly', label: '📅 Tahunan' }
              ]}
              value={dateRange}
              onChange={(val) => setDateRange(val as any)}
              variant="light"
              placeholder="Pilih Rentang"
              buttonClassName="py-1 px-2.5 bg-white text-slate-900 border-slate-300 text-xs font-bold"
            />
          </div>

          {/* Pengelompokan (Custom Dropdown opens downwards) */}
          <div className="flex items-center gap-2 bg-teal-950/5 border border-teal-800/15 px-2.5 py-1 rounded-xl">
            <Layers className="w-3.5 h-3.5 text-teal-700 shrink-0" />
            <span className="text-[11px] font-extrabold text-teal-950 uppercase tracking-wider whitespace-nowrap">Pengelompokan:</span>
            <CustomDropdown
              options={[
                { value: 'none', label: '❌ Tanpa Pengelompokan' },
                { value: 'unit', label: '🏢 Per Unit (ULP)' },
                { value: 'up3', label: '⚡ Per UP3 / Sektor' }
              ]}
              value={groupingMode}
              onChange={(val) => setGroupingMode(val as any)}
              variant="light"
              placeholder="Pilih Grouping"
              buttonClassName="py-1 px-2.5 bg-white text-slate-900 border-slate-300 text-xs font-bold min-w-[150px]"
            />
          </div>
        </div>

        {/* Cetak PDF / Print */}
        <button
          onClick={handleExportPDF}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-95 text-white text-xs font-extrabold rounded-xl shadow-md shadow-teal-900/15 border border-teal-500/30 transition-all cursor-pointer whitespace-nowrap"
          title="Cetak Laporan PDF Lengkap"
        >
          <Printer className="w-4 h-4 shrink-0" />
          <span>Cetak PDF / Print</span>
        </button>
      </div>

      {/* Grid of Total Unit Metrics */}
      <motion.div 
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4" 
        id="main_summary_counter_grid"
      >
        {[
          { label: 'Total Gardu', value: (sectionList.length || (ownerSelectedUnitFilter === 'SEMUA' ? 150 : 0)).toLocaleString(), desc: 'Gardu Distribusi Aktif', icon: Layers, color: 'text-blue-600 bg-blue-50 border-blue-200' },
          { label: 'Total Penyulang', value: (penyulangList.length || (ownerSelectedUnitFilter === 'SEMUA' ? 24 : 0)).toLocaleString(), desc: 'Feeder SUTM 20kV', icon: Zap, color: 'text-amber-600 bg-amber-50 border-amber-200' },
          { label: 'Yantek SPK Harian', value: yantekPerformanceStats.totalSpk.toString(), desc: 'Penanganan Terbit', icon: Wrench, color: 'text-purple-600 bg-purple-50 border-purple-200' },
          { label: 'Survey Agenda', value: surveyStatsData.totalSurvey.toString(), desc: 'Pasang Baru & PD', icon: FileSpreadsheet, color: 'text-rose-600 bg-rose-50 border-rose-200' }
        ].map((item, idx) => (
          <motion.div
            key={idx}
            layout
            whileHover={{ y: -5, scale: 1.02 }}
            className="bg-[#022e2a]/80 p-4 rounded-xl border border-teal-500/30 backdrop-blur-md shadow-lg flex flex-col justify-between hover:shadow-xl transition-all"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] uppercase font-black text-teal-300 tracking-wider leading-none">{item.label}</span>
              <div className="p-1.5 rounded-lg bg-teal-900/50 border border-teal-500/30 text-teal-200"><item.icon className="w-3.5 h-3.5" /></div>
            </div>
            <div className="mt-3">
              <p className="text-xl md:text-2xl font-black text-white leading-none">{item.value}</p>
              <p className="text-[9px] font-bold text-teal-200/70 mt-1">{item.desc}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Dashboard Sub-Tabs Navigator */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200 scrollbar-none" id="sub_dashboards_navigation_bar">
        {[
          { id: 'executive', label: '📊 Ringkasan Eksekutif ULP', icon: BarChart2, color: 'border-teal-500 text-teal-700 bg-teal-50' },
          { id: 'pangkal', label: '1. Gangguan Pangkal', icon: Zap, color: 'border-amber-500 text-amber-700 bg-amber-50' },
          { id: 'kode', label: '2. Per Kode Gangguan', icon: ShieldAlert, color: 'border-emerald-500 text-emerald-700 bg-emerald-50' },
          { id: 'gardu', label: '3. Pengukuran Gardu', icon: Gauge, color: 'border-blue-500 text-blue-700 bg-blue-50' },
          { id: 'yantek', label: '4. Monitoring Yantek', icon: Activity, color: 'border-purple-500 text-purple-700 bg-purple-50' },
          { id: 'survey', label: '5. Survey PB PD', icon: FileSpreadsheet, color: 'border-rose-500 text-rose-700 bg-rose-50' }
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all duration-200 whitespace-nowrap cursor-pointer flex items-center gap-2 border ${
                isActive 
                  ? `${tab.color} shadow-sm font-black ring-1 ring-slate-200 scale-102` 
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <tab.icon className={`w-4 h-4 ${isActive ? 'animate-pulse' : ''}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Sub-Dashboard Content Panel */}
      <div id="sub_dashboard_active_canvas" className="transition-all duration-300">
        
        {/* TAB 0: DASHBOARD RINGKASAN EKSEKUTIF */}
        {activeTab === 'executive' && (
          <div className="space-y-6 animate-fade-in" id="dashboard_ringkasan_eksekutif">

            {/* Visualisasi Statistik Gangguan Per Bulan (Total) */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="mb-4">
                <h3 className="text-sm font-black text-slate-800">Statistik Gangguan per Bulan</h3>
                <p className="text-[10px] text-slate-500">Tren akumulasi total gangguan jaringan per bulan (Filter ULP: {selectedDashboardUlp === 'SEMUA' ? 'Semua ULP' : selectedDashboardUlp} | Section: {selectedDashboardSection === 'SEMUA' ? 'Semua Section' : selectedDashboardSection})</p>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={monthlyOverallStats}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} 
                      axisLine={false} 
                      tickLine={false} 
                    />
                    <YAxis 
                      tick={{ fontSize: 10, fill: '#64748b' }} 
                      axisLine={false} 
                      tickLine={false} 
                    />
                    <Tooltip 
                      contentStyle={{ fontSize: '11px', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                      formatter={(val: number) => [`${val} Kali`, 'Total Gangguan']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="total" 
                      stroke="#ef4444" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorTotal)" 
                      activeDot={{ r: 6, strokeWidth: 0, fill: '#ef4444' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Ringkasan Grafik Batang Gangguan per Bulan Berdasarkan Kategori Gangguan */}
            <MonthlyCategoryTrendSection
              gangguanList={filteredGangguanList}
              penyulangList={penyulangList}
              selectedUlpFilter={selectedDashboardUlp}
              id="dashboard_executive_monthly_category_trend"
            />

            {/* Rekapitulasi Monitoring Frekuensi Gangguan Per Bulan Per Penyulang (Dark Slate Grid PLN) */}
            <MonitoringFrekuensiPenyulangView
              currentUser={currentUser}
              penyulangList={penyulangList}
              gangguanList={filteredGangguanList}
              masterUnits={masterUnitList}
              selectedUlpFilter={selectedDashboardUlp}
              onSelectUlpFilter={setSelectedDashboardUlp}
              id="dashboard_executive_monitoring_frekuensi_penyulang"
            />

            {/* Interactive Grid Table of Feeders */}
            {groupingMode !== 'none' && (
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                <div>
                  <h3 className="text-sm font-black text-slate-800">
                    Laporan Analisis Performa per Wilayah Kerja ({groupingMode === 'up3' ? 'UP3 / Sektor' : 'ULP'})
                  </h3>
                  <p className="text-[10px] text-slate-500">
                    Menampilkan agregasi keandalan, beban pelanggan, gardu, pembebanan, dan efisiensi pelayanan teknik per wilayah
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-extrabold uppercase text-[10px]">
                        <th className="p-3">Nama Wilayah Kerja ({groupingMode === 'up3' ? 'UP3' : 'ULP'})</th>
                        <th className="p-3 text-right">Jumlah Pelanggan</th>
                        <th className="p-3 text-center">Proporsi Beban</th>
                        <th className="p-3 text-center">Jumlah Gardu</th>
                        <th className="p-3 text-center">Jumlah Penyulang</th>
                        <th className="p-3 text-center">Frekuensi Trip</th>
                        <th className="p-3 text-center">Total Durasi Padam</th>
                        <th className="p-3 text-center">Gardu Overload</th>
                        <th className="p-3 text-center">Kinerja SPK Yantek</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupedPerformanceData.map((item, idx) => {
                        const sumPelanggan = groupedPerformanceData.reduce((acc, curr) => acc + curr.pelanggan, 0);
                        const pct = sumPelanggan > 0 ? ((item.pelanggan / sumPelanggan) * 100).toFixed(1) : '0';
                        
                        let tripColor = 'text-emerald-700 bg-emerald-50 border-emerald-200';
                        if (item.frekuensiGangguan >= 15) {
                          tripColor = 'text-rose-700 bg-rose-50 border-rose-200';
                        } else if (item.frekuensiGangguan >= 8) {
                          tripColor = 'text-amber-700 bg-amber-50 border-amber-200';
                        }

                        const spkPct = item.spkTotal > 0 ? Math.round((item.spkSelesai / item.spkTotal) * 100) : 100;

                        return (
                          <tr key={`exec-group-row-${idx}`} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                            <td className="p-3 font-extrabold text-slate-800 flex items-center gap-2">
                              <span className="text-teal-600">🏢</span>
                              <span>{item.name}</span>
                            </td>
                            <td className="p-3 text-right font-black text-slate-800">{item.pelanggan.toLocaleString()}</td>
                            <td className="p-3 text-center font-bold text-slate-500">{pct}%</td>
                            <td className="p-3 text-center font-bold text-slate-600">{item.gardu} Gardu</td>
                            <td className="p-3 text-center font-bold text-slate-600">{item.penyulangCount} Feeder</td>
                            <td className="p-3 text-center">
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${tripColor}`}>
                                {item.frekuensiGangguan} Trip
                              </span>
                            </td>
                            <td className="p-3 text-center font-bold text-slate-600">
                              {Math.round(item.durasiGangguan)} Menit
                            </td>
                            <td className="p-3 text-center">
                              {item.garduOverload > 0 ? (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                  ⚠️ {item.garduOverload} Gardu
                                </span>
                              ) : (
                                <span className="text-emerald-600 font-bold">✓ Aman</span>
                              )}
                            </td>
                            <td className="p-3 text-center">
                              <div className="flex flex-col items-center">
                                <span className="font-bold text-slate-700 text-[11px]">{item.spkSelesai} / {item.spkTotal} SPK</span>
                                <span className="text-[9px] text-teal-600 font-black">({spkPct}%)</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        )}

        {/* TAB 1: DASHBOARD GANGGUAN PANGKAL */}
        {activeTab === 'pangkal' && (
          <div className="space-y-6 animate-fade-in" id="dashboard_gangguan_pangkal">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              
              {/* Left Column: Metrics & Explanation */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-amber-50 rounded-xl text-amber-600"><Zap className="w-5 h-5" /></div>
                    <div>
                      <h3 className="text-sm font-black text-slate-800">Analisis Outage Pangkal Penyulang</h3>
                      <p className="text-[10px] text-slate-500">Rekapitulasi trip feeder utama pada Gardu Induk (GI)</p>
                    </div>
                  </div>
                  <div className="mt-6 space-y-4">
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Trip Terdeteksi</p>
                      <p className="text-3xl font-black text-slate-900 mt-1">{gangguanList.length}</p>
                      <p className="text-[10px] text-slate-400 mt-1">Kejadian terdokumentasi pada sistem proteksi PMT GI</p>
                    </div>
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Durasi Padam Rata-rata</p>
                      <p className="text-2xl font-black text-slate-900 mt-1">
                        {gangguanList.length > 0 
                          ? Math.round(gangguanList.reduce((acc, g) => acc + (parseFloat(g.durasi) || 45), 0) / gangguanList.length)
                          : 45} Menit
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1">Waktu tanggap pemulihan jaringan dari trip hingga penormalan</p>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => onSelectView('gangguan_feeder')}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-extrabold rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer border border-slate-200"
                >
                  <span>Buka Detail Log Gangguan</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Center Column: Summary Cards of Feeders */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between space-y-4 lg:col-span-2">
                <div>
                  <h3 className="text-sm font-black text-slate-800">
                    {groupingMode !== 'none' ? 'Peringkat Kerawanan Jaringan per Wilayah Kerja' : 'Peringkat Kerawanan Feeder SUTM'}
                  </h3>
                  <p className="text-[10px] text-slate-500">
                    {groupingMode !== 'none' ? 'Tingkat kejadian trip teratas pada wilayah kerja' : 'Feeder dengan tingkat kejadian trip teratas pada sistem 20kV'}
                  </p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {groupingMode !== 'none' ? (
                    groupedPerformanceData.slice(0, 6).map((unit, uIdx) => (
                      <div key={uIdx} className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
                        <div className="text-xs font-bold text-slate-700 truncate" title={unit.name}>{unit.name}</div>
                        <div className="text-lg font-black text-rose-800 mt-1">{unit.frekuensiGangguan} Trip</div>
                        <div className="text-[10px] text-slate-500 font-medium">{Math.round(unit.durasiGangguan)} Menit Padam</div>
                      </div>
                    ))
                  ) : (
                    gangguanPangkalStats.slice(0, 6).map((feeder, fIdx) => (
                      <div key={fIdx} className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
                        <div className="text-xs font-bold text-slate-700 truncate" title={feeder.name}>{feeder.name}</div>
                        <div className="text-lg font-black text-teal-800 mt-1">{feeder.jumlahGangguan} Trip</div>
                        <div className="text-[10px] text-slate-500 font-medium">{feeder.totalDurasiMenit} m / {feeder.arusMaksimum}A</div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

            {/* Outage Pangkal Summary Table */}
            <div className="bg-[#022e2a]/80 p-5 rounded-2xl border border-teal-500/30 backdrop-blur-md shadow-lg">
              <h3 className="text-sm font-black text-white mb-4 tracking-wider uppercase drop-shadow-xs">
                {groupingMode !== 'none' 
                  ? `Daftar Frekuensi Trip & Durasi Pemulihan per Wilayah Kerja (${groupingMode === 'up3' ? 'UP3' : 'ULP'})` 
                  : 'Daftar Frekuensi Trip & Durasi Pemulihan Feeder'}
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-teal-700 bg-[#01221f] text-white font-extrabold uppercase text-[11px]">
                      <th className="p-3 text-white">
                        {groupingMode !== 'none' ? `Wilayah Kerja (${groupingMode === 'up3' ? 'UP3' : 'ULP'})` : 'Nama Penyulang (Feeder)'}
                      </th>
                      <th className="p-3 text-center text-white">Jumlah Outage (Trip)</th>
                      <th className="p-3 text-center text-white">Total Durasi Padam</th>
                      <th className="p-3 text-center text-white">
                        {groupingMode !== 'none' ? 'Rata-Rata Durasi Per Trip' : 'Arus Gangguan Maksimum'}
                      </th>
                      <th className="p-3 text-white">Status Kerawanan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupingMode !== 'none' ? (
                      groupedPerformanceData.map((item, idx) => {
                        let kerawanan = 'RENDAH';
                        let color = 'text-emerald-300 bg-emerald-950/80 border-emerald-500/50 font-black';
                        if (item.frekuensiGangguan >= 15) {
                          kerawanan = 'KRITIS / TINGGI';
                          color = 'text-rose-200 bg-rose-950/80 border-rose-500/50 font-black';
                        } else if (item.frekuensiGangguan >= 8) {
                          kerawanan = 'SEDANG';
                          color = 'text-amber-200 bg-amber-950/80 border-amber-500/50 font-black';
                        }

                        const avgDuration = item.frekuensiGangguan > 0 ? Math.round(item.durasiGangguan / item.frekuensiGangguan) : 0;

                        return (
                          <tr key={idx} className="border-b border-teal-800/60 hover:bg-teal-900/40 transition-colors">
                            <td className="p-3 font-extrabold text-white">{item.name}</td>
                            <td className="p-3 text-center font-black text-white">{item.frekuensiGangguan} kali</td>
                            <td className="p-3 text-center font-bold text-white">{Math.round(item.durasiGangguan)} Menit</td>
                            <td className="p-3 text-center font-mono font-bold text-white">{avgDuration} Menit / Trip</td>
                            <td className="p-3">
                              <span className={`px-2.5 py-1 rounded-md text-[10px] uppercase tracking-wider border shadow-xs ${color}`}>
                                {kerawanan}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      gangguanPangkalStats.filter(item => !selectedFeeder || item.name === selectedFeeder).map((item, idx) => {
                        let kerawanan = 'RENDAH';
                        let color = 'text-emerald-300 bg-emerald-950/80 border-emerald-500/50 font-black';
                        if (item.jumlahGangguan >= 7) {
                          kerawanan = 'KRITIS / TINGGI';
                          color = 'text-rose-200 bg-rose-950/80 border-rose-500/50 font-black';
                        } else if (item.jumlahGangguan >= 4) {
                          kerawanan = 'SEDANG';
                          color = 'text-amber-200 bg-amber-950/80 border-amber-500/50 font-black';
                        }

                        return (
                          <tr key={idx} className="border-b border-teal-800/60 hover:bg-teal-900/40 transition-colors">
                            <td className="p-3 font-extrabold text-white">{item.name}</td>
                            <td className="p-3 text-center font-black text-white">{item.jumlahGangguan} kali</td>
                            <td className="p-3 text-center font-bold text-white">{item.totalDurasiMenit} Menit</td>
                            <td className="p-3 text-center font-mono font-bold text-white">{item.arusMaksimum} Ampere</td>
                            <td className="p-3">
                              <span className={`px-2.5 py-1 rounded-md text-[10px] uppercase tracking-wider border shadow-xs ${color}`}>
                                {kerawanan}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Rekapitulasi Monitoring Frekuensi Gangguan Per Bulan Per Penyulang */}
            <MonitoringFrekuensiPenyulangView
              currentUser={currentUser}
              penyulangList={penyulangList}
              gangguanList={filteredGangguanList}
              masterUnits={masterUnitList}
              selectedUlpFilter={selectedDashboardUlp}
              onSelectUlpFilter={setSelectedDashboardUlp}
              id="dashboard_penyulang_monitoring_frekuensi"
            />
          </div>
        )}

        {/* TAB 2: DASHBOARD PER KODE GANGGUAN */}
        {activeTab === 'kode' && (
          <div className="space-y-6 animate-fade-in" id="dashboard_per_kode_gangguan">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              
              {/* Left Column: Pie Chart distribution */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="text-sm font-black text-slate-800">Distribusi Kategori Kode Gangguan</h3>
                  <p className="text-[10px] text-slate-500">Proporsi penyebab trip sistem SUTM 20kV</p>
                </div>
                
                <div className="h-56 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={kodeGangguanStats}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={65}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {kodeGangguanStats.map((entry, index) => (
                          <Cell key={`cell-code-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ fontSize: '10px', borderRadius: '8px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-1">
                  {kodeGangguanStats.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-[11px] font-bold">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }}></span>
                        <span>{item.name}</span>
                      </div>
                      <span className="font-black text-slate-900">{item.value} kasus</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Code Explanation & Recommendations */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs lg:col-span-2 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="text-sm font-black text-slate-800">Klasifikasi &amp; Detail Koreksi Klas Gangguan</h3>
                  <p className="text-[10px] text-slate-500">Mencatat anomali klasifikasi penyebab trip untuk mitigasi Right of Way (ROW) dan pengaman jaringan</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {kodeGangguanStats.map((item, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50 flex flex-col justify-between space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-slate-800">{item.name}</span>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200">
                          {item.value} Kejadian
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-bold">Penyebab dominan: {item.penyebab}</p>
                      <div className="pt-2 border-t border-slate-200/50 text-[9px] text-slate-400 font-extrabold uppercase">
                        {item.name.includes('F1') ? '📍 Tindakan: Intensifkan ROW Pangkas Pohon' : 
                         item.name.includes('F2') ? '📍 Tindakan: Pemasangan Ijuk / Bat Guard' :
                         item.name.includes('F3') ? '📍 Tindakan: Pasang Lightning Arrester' :
                         item.name.includes('F4') ? '📍 Tindakan: Pemeliharaan Preventif Trafo' :
                         '📍 Tindakan: Patroli & Sosialisasi Layangan'}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-blue-700 font-bold leading-normal">
                    <strong>Pemberitahuan Sistem:</strong> Gangguan dengan kode <strong>F1 (Pohon)</strong> merupakan penyumbang SAIDI/SAIFI terbesar bulan ini. Unit Pelaksana dihimbau berfokus melakukan perintisan berkala.
                  </p>
                </div>
              </div>

            </div>

            {/* Monthly Trend per Category inside Kode Gangguan Tab */}
            <MonthlyCategoryTrendSection
              gangguanList={filteredGangguanList}
              penyulangList={penyulangList}
              selectedUlpFilter={selectedDashboardUlp}
              title="Tren Historis Gangguan Bulanan Berdasarkan Kategori (F1 - F5 / E1 - E5)"
              subtitle="Analisis korelasi penyebab trip per bulan untuk penyusunan RKAP dan jadwal pemeliharaan preventif Right of Way (ROW)"
              id="dashboard_kode_monthly_category_trend"
            />
          </div>
        )}

        {/* TAB 3: DASHBOARD PENGUKURAN GARDU */}
        {activeTab === 'gardu' && (
          <div className="space-y-6 animate-fade-in" id="dashboard_pengukuran_gardu">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              
              {/* Left Column: Overload Pie Status */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="text-sm font-black text-slate-800">Status Pembebanan Trafo Gardu</h3>
                  <p className="text-[10px] text-slate-500">Mendeteksi bahaya overload dan ketidakseimbangan beban fasa</p>
                </div>

                <div className="h-44 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={garduMeasurementStats.pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={35}
                        outerRadius={55}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {garduMeasurementStats.pieData.map((entry, index) => (
                          <Cell key={`cell-gardu-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ fontSize: '10px', borderRadius: '8px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold border-b border-slate-100 pb-1.5">
                    <span className="text-slate-500">Trafo Overload (&gt;80%)</span>
                    <span className="text-rose-600 font-black">{garduMeasurementStats.overload} Gardu</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-bold border-b border-slate-100 pb-1.5">
                    <span className="text-slate-500">Ketidakseimbangan Fasa</span>
                    <span className="text-amber-600 font-black">{garduMeasurementStats.avgUnbalance}% Rata-rata</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-500">Trafo Aman &amp; Underload</span>
                    <span className="text-emerald-600 font-black">{garduMeasurementStats.normal + garduMeasurementStats.underload} Gardu</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Gardu Kritis Overload */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs lg:col-span-2 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="text-sm font-black text-slate-800">
                    {groupingMode !== 'none'
                      ? (groupingMode === 'up3' ? 'Jumlah Gardu Overload per UP3 / Sektor' : 'Jumlah Gardu Overload per Unit (ULP)')
                      : '5 Gardu dengan Pembebanan Tertinggi / Overload'}
                  </h3>
                  <p className="text-[10px] text-slate-500">
                    {groupingMode !== 'none'
                      ? 'Perbandingan kuantitas trafo distribusi overload (>80%) per wilayah kerja'
                      : 'Daftar gardu yang membutuhkan penyeimbangan beban fasa atau up-rating kapasitas daya kVA'}
                  </p>
                </div>

                <div className="space-y-2 flex-1">
                  {groupingMode !== 'none' ? (
                    groupedPerformanceData.map((unit, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50/50">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-extrabold text-slate-800">{unit.name}</span>
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[9px] font-mono font-bold text-slate-600 border border-slate-200">
                              Total: {unit.gardu} Gardu
                            </span>
                          </div>
                          <p className="text-[9px] text-slate-400 mt-0.5">Wilayah Kerja: {unit.up3}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-black text-rose-600">{unit.garduOverload} Overload</span>
                          <div className="w-24 bg-slate-100 rounded-full h-1.5 mt-1 overflow-hidden">
                            <div 
                              className="bg-rose-500 h-1.5 rounded-full" 
                              style={{ width: `${unit.gardu > 0 ? Math.min(100, (unit.garduOverload / unit.gardu) * 100) : 0}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    garduMeasurementStats.criticalGardus.map((gardu, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50/50">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-extrabold text-slate-800">Gardu {gardu.noGardu}</span>
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[9px] font-mono font-bold text-slate-600 border border-slate-200">
                              {gardu.dayaKva} kVA
                            </span>
                          </div>
                          <p className="text-[9px] text-slate-400 mt-0.5">Arus Netral: {gardu.neutralCurrent} A • Imbalance: {gardu.diffPercent}%</p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-black text-rose-600">{gardu.loadPercent}% Load</span>
                          <div className="w-24 bg-slate-100 rounded-full h-1.5 mt-1 overflow-hidden">
                            <div 
                              className="bg-rose-500 h-1.5 rounded-full" 
                              style={{ width: `${Math.min(100, gardu.loadPercent)}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  {groupingMode === 'none' && garduMeasurementStats.criticalGardus.length === 0 && (
                    <div className="h-full flex flex-col justify-center items-center py-8 text-slate-400 font-bold">
                      <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-2" />
                      <p className="text-xs">Hebat! Tidak ada Gardu Overload terdeteksi di Unit ini</p>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => onSelectView('pengukuran_gardu')}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-extrabold rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer border border-slate-200"
                >
                  <span>Buka Lembar Pengukuran Gardu</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          </div>
        )}

        {/* TAB 4: DASHBOARD MONITORING YANTEK */}
        {activeTab === 'yantek' && (
          <div className="space-y-6 animate-fade-in" id="dashboard_monitoring_yantek">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              
              {/* Left Column: Progress status */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="text-sm font-black text-slate-800">
                    {groupingMode !== 'none'
                      ? (groupingMode === 'up3' ? 'Penyelesaian SPK per UP3 / Sektor' : 'Penyelesaian SPK per Unit (ULP)')
                      : 'Penyelesaian Surat Perintah Kerja (SPK)'}
                  </h3>
                  <p className="text-[10px] text-slate-500">
                    {groupingMode !== 'none'
                      ? 'Perbandingan SPK selesai vs rencana per wilayah kerja'
                      : 'Realisasi penugasan tim pemeliharaan preventif & gangguan'}
                  </p>
                </div>

                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={groupingMode !== 'none'
                        ? groupedPerformanceData.map(u => ({ name: u.name, 'Selesai': u.spkSelesai, 'Total': u.spkTotal }))
                        : yantekPerformanceStats.spkChartData
                      } 
                      margin={{ top: 5, right: 10, left: -25, bottom: 0 }}
                    >
                      <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#64748b', fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ fontSize: '10px', borderRadius: '8px' }} />
                      {groupingMode !== 'none' ? (
                        <>
                          <Bar dataKey="Selesai" fill="#10b981" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="Total" fill="#64748b" radius={[4, 4, 0, 0]} />
                        </>
                      ) : (
                        <Bar dataKey="Jumlah" fill="#8b5cf6" radius={[4, 4, 0, 0]}>
                          <Cell fill="#10b981" />
                          <Cell fill="#f59e0b" />
                          <Cell fill="#64748b" />
                        </Bar>
                      )}
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Persentase SPK Selesai</p>
                    <p className="text-lg font-black text-slate-800 mt-0.5">{yantekPerformanceStats.completionRate}% Selesai</p>
                  </div>
                  <div className="w-10 h-10 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin"></div>
                </div>
              </div>

              {/* Center & Right Column: Team Workload */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs lg:col-span-2 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="text-sm font-black text-slate-800">
                    {groupingMode !== 'none' ? 'Kinerja Tindak Lanjut Gangguan per Wilayah' : 'Status Tindak Lanjut Gangguan Lapangan'}
                  </h3>
                  <p className="text-[10px] text-slate-500">
                    {groupingMode !== 'none' ? 'Monitoring realisasi SPK dan laporan padam per wilayah kerja' : 'Melihat status antrean aduan gangguan listrik terintegrasi'}
                  </p>
                </div>

                {groupingMode !== 'none' ? (
                  <div className="space-y-2 flex-1 max-h-[180px] overflow-y-auto pr-1">
                    {groupedPerformanceData.map((unit, idx) => {
                      const pct = unit.spkTotal > 0 ? Math.round((unit.spkSelesai / unit.spkTotal) * 100) : 100;
                      return (
                        <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50/50">
                          <div>
                            <span className="text-xs font-extrabold text-slate-800">{unit.name}</span>
                            <p className="text-[9px] text-slate-400 mt-0.5">Total Aduan Trip: {unit.frekuensiGangguan} • Durasi: {Math.round(unit.durasiGangguan)}m</p>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-black text-emerald-600">{pct}% SPK Selesai</span>
                            <p className="text-[9px] text-slate-400 mt-0.5">{unit.spkSelesai} dari {unit.spkTotal} SPK</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-auto">
                    <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-center">
                      <p className="text-[10px] font-extrabold text-rose-500 uppercase tracking-wider">Total Aduan</p>
                      <p className="text-3xl font-black text-rose-900 mt-1">{yantekPerformanceStats.totalGangguan}</p>
                      <p className="text-[9px] text-rose-400 mt-1">Laporan Gangguan Masuk</p>
                    </div>
                    <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl text-center">
                      <p className="text-[10px] font-extrabold text-amber-500 uppercase tracking-wider">Dalam Penanganan</p>
                      <p className="text-3xl font-black text-amber-900 mt-1">{yantekPerformanceStats.pendingGangguan}</p>
                      <p className="text-[9px] text-amber-400 mt-1">Petugas Menuju Lokasi</p>
                    </div>
                    <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-center">
                      <p className="text-[10px] font-extrabold text-emerald-500 uppercase tracking-wider">Selesai Normal</p>
                      <p className="text-3xl font-black text-emerald-900 mt-1">{yantekPerformanceStats.selesaiGangguan}</p>
                      <p className="text-[9px] text-emerald-400 mt-1">Jaringan Pulih Normal</p>
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-2 mt-4">
                  <button
                    onClick={() => onSelectView('monitoring_yantek')}
                    className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-extrabold rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span>Peta Live Armada GPS</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onSelectView('perintah_kerja')}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-extrabold rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer border border-slate-200"
                  >
                    <span>Kelola SPK Tim Yantek</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 5: DASHBOARD SURVEY PB PD */}
        {activeTab === 'survey' && (
          <div className="space-y-6 animate-fade-in" id="dashboard_survey_pb_pd">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              
              {/* Left Column: PB vs PD Pie Chart */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="text-sm font-black text-slate-800">
                    {groupingMode !== 'none'
                      ? (groupingMode === 'up3' ? 'Kategori PB/PD per UP3 / Sektor' : 'Kategori PB/PD per Unit (ULP)')
                      : 'Proporsi Kategori Transaksi PB/PD'}
                  </h3>
                  <p className="text-[10px] text-slate-500">
                    {groupingMode !== 'none'
                      ? 'Distribusi total survey layak vs rencana per wilayah kerja'
                      : 'Pasang Baru (PB) vs Perubahan Daya (PD) Pelanggan'}
                  </p>
                </div>

                <div className="h-44 w-full flex items-center justify-center">
                  {groupingMode !== 'none' ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={groupedPerformanceData.map(u => ({ name: u.name, 'Total': u.surveyTotal, 'Layak': u.surveyLayak }))}
                        margin={{ top: 5, right: 5, left: -25, bottom: 0 }}
                      >
                        <XAxis dataKey="name" tick={{ fontSize: 8, fill: '#64748b', fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 8, fill: '#64748b' }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ fontSize: '10px', borderRadius: '8px' }} />
                        <Bar dataKey="Total" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                        <Bar dataKey="Layak" fill="#10b981" radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={surveyStatsData.pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={35}
                          outerRadius={55}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {surveyStatsData.pieData.map((entry, index) => (
                            <Cell key={`cell-survey-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ fontSize: '10px', borderRadius: '8px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold border-b border-slate-100 pb-1.5">
                    <span className="text-slate-500">Pasang Baru (PB)</span>
                    <span className="text-emerald-600 font-black">{surveyStatsData.pasangBaru} Agenda</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-500">Perubahan Daya (PD)</span>
                    <span className="text-amber-600 font-black">{surveyStatsData.perubahanDaya} Agenda</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Feasibility statuses */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs lg:col-span-2 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="text-sm font-black text-slate-800">
                    {groupingMode !== 'none' ? 'Kelayakan PB/PD per Wilayah Kerja' : 'Status Kelayakan Penyambungan Jaringan'}
                  </h3>
                  <p className="text-[10px] text-slate-500">
                    {groupingMode !== 'none' ? 'Monitoring realisasi kelayakan survey PB/PD per wilayah kerja' : 'Melihat hasil survey kelaikan teknis calon pelanggan baru'}
                  </p>
                </div>

                <div className="space-y-2 flex-1">
                  {groupingMode !== 'none' ? (
                    groupedPerformanceData.map((unit, idx) => {
                      const avgTeg = unit.avgTegPangkalCount > 0 
                        ? Math.round(unit.avgTegPangkalSum / unit.avgTegPangkalCount) 
                        : 218;
                      return (
                        <div key={idx} className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100">
                          <div>
                            <span className="text-xs font-extrabold text-slate-800">{unit.name}</span>
                            <p className="text-[9px] text-slate-400 mt-0.5">Rata-rata Tegangan Pangkal: {avgTeg}V</p>
                          </div>
                          <div className="text-right">
                            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                              {unit.surveyLayak} / {unit.surveyTotal} Layak
                            </span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    surveyStatsData.listStatus.map((status, idx) => {
                      let badgeColor = 'bg-slate-100 text-slate-700 border-slate-200';
                      if (status.name === 'Layak Sambung' || status.name === 'Selesai Penyambungan') {
                        badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                      } else if (status.name === 'Drop Tegangan (Tidak Layak)') {
                        badgeColor = 'bg-rose-50 text-rose-700 border-rose-200';
                      } else if (status.name.includes('WO Survey')) {
                        badgeColor = 'bg-blue-50 text-blue-700 border-blue-200';
                      }

                      return (
                        <div key={idx} className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${badgeColor}`}>
                            {status.name}
                          </span>
                          <span className="text-xs font-black text-slate-900">{status.value} Pemohon</span>
                        </div>
                      );
                    })
                  )}
                </div>

                <button
                  onClick={() => onSelectView('survey_pb_pd')}
                  className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>Buka Berkas Survey PB/PD</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          </div>
        )}

      </div>

    </div>
  );
};
