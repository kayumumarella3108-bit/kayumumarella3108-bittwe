import React, { useState, useEffect } from 'react';
import {
  Trees,
  ClipboardList,
  Search,
  Wrench,
  Plus,
  X,
  Trash2,
  Pencil,
  Download,
  FileSpreadsheet,
  Target,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  List,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Zap,
  Sparkles,
  Layers,
  Info,
  ShieldCheck,
  Eye,
  Activity,
  ArrowRight,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ROWItem, InspeksiItem, ViewType, Tier1Item, Tier2Item, MonitoringPemeliharaanItem, User } from '../../types';
import { exportToCSV } from '../../utils/exportCsv';
import { db, doc, setDoc, deleteDoc, handleFirestoreError, OperationType, registerDeletedId } from '../../lib/firebase';
import { sanitizeForFirestore } from '../../utils/firestoreHelper';
import { TableSkeletonLoader } from '../common/TableSkeletonLoader';

interface PemeliharaanViewProps {
  currentSubView: ViewType;
  rowList: ROWItem[];
  tier1List: Tier1Item[];
  tier2List: Tier2Item[];
  monitoringList: MonitoringPemeliharaanItem[];
  currentUser?: User;
  onSelectSubView?: (view: ViewType) => void;
  isLoading?: boolean;
}

const INITIAL_ROW_DATA: ROWItem[] = [
  {
    id: 'row_1',
    tanggal: '2026-02-08',
    penyulang: 'TULEHU',
    section: 'GH Asten - Ujung Jaringan',
    jumlahTemuanInspeksi: 12,
    realisasiPangkas: 8,
    perluIzin: 3,
    perluPadam: 1,
    pohonBesar: 4,
    luarTemuan: '2 Pohon kelapa miring dekat fasa R'
  },
  {
    id: 'row_2',
    tanggal: '2026-02-06',
    penyulang: 'PASSO',
    section: 'LBS Air Besar - IC Lateri',
    jumlahTemuanInspeksi: 7,
    realisasiPangkas: 7,
    perluIzin: 0,
    perluPadam: 0,
    pohonBesar: 1,
    luarTemuan: 'Ranting pohon trambesi rimbun'
  }
];

const INITIAL_TIER1: Tier1Item[] = [
  {
    id: 't1_1',
    tanggal: '2026-02-08',
    penyulang: 'TULEHU',
    section: 'GH Asten - Ujung Jaringan',
    temuanRow: 'Dahan pohon kelapa mendekati SUTM (1.5 meter)',
    konstruksi: 'Isolator Tumpu retak pada tiang TLH-42 & Arrester korosi'
  },
  {
    id: 't1_2',
    tanggal: '2026-02-06',
    penyulang: 'LATERI 2',
    section: 'GI Passo - IC Lateri 2 GH Hative',
    temuanRow: 'Ranting pohon trambesi menyentuh fasa R',
    konstruksi: 'Jumperan kendor pada tiang LTR2-18'
  }
];

const INITIAL_TIER2: Tier2Item[] = [
  {
    id: 't2_1',
    tanggal: '2026-02-07',
    penyulang: 'PASSO',
    section: 'LBS Air Besar Passo',
    jenisTier2: 'Thermovision',
    temuanThermoUltrasound: 'Hotspot temperatur 82°C pada klem jumper LBS Passo'
  },
  {
    id: 't2_2',
    tanggal: '2026-02-05',
    penyulang: 'WAIHERU 1',
    section: 'GI Passo - LBS Transit',
    jenisTier2: 'Ultrasound',
    temuanThermoUltrasound: 'Deteksi bunyi parsial discharge (PD) 42dB pada isolator Gantung'
  }
];

const INITIAL_MONITORING: MonitoringPemeliharaanItem[] = [
  {
    id: 'm1',
    tanggal: '2026-02-08',
    penyulang: 'TULEHU',
    section: 'GH Asten - Ujung Jaringan',
    jenisPemeliharaan: ['SUTM', 'Peralatan SUTM', 'Tekep Isolator', 'Cover Trafo'],
    keterangan: 'Pemasangan cover trafo dan penggantian tekep isolator rusak'
  },
  {
    id: 'm2',
    tanggal: '2026-02-04',
    penyulang: 'KARPAN 1',
    section: 'LBS SMA 5 - LBS Tantui',
    jenisPemeliharaan: ['SUTR', 'Gardu', 'PHBTR', 'Protective Sleeve'],
    keterangan: 'Pembersihan PHBTR dan perbaikan grounding tiang gardu'
  }
];

const JENIS_PEMELIHARAAN_OPTIONS = [
  'SUTM',
  'SUTR',
  'Komponen SUTM',
  'Peralatan SUTM',
  'Gardu',
  'Cover Trafo',
  'Tekep Isolator',
  'Protective Sleeve',
  'Jumperan',
  'Konduktor',
  'Tiang',
  'PHBTR',
  'Pemeliharaan Lain'
];

export const PemeliharaanView: React.FC<PemeliharaanViewProps> = ({
  currentSubView,
  rowList,
  tier1List,
  tier2List,
  monitoringList,
  currentUser,
  onSelectSubView,
  isLoading = false
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // View mode and card expansion states
  const [viewLayout, setViewLayout] = useState<'cards' | 'table'>('cards');
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [expandedTier1Id, setExpandedTier1Id] = useState<string | null>(null);
  const [expandedTier2Id, setExpandedTier2Id] = useState<string | null>(null);
  const [expandedMonitoringId, setExpandedMonitoringId] = useState<string | null>(null);
  const [expandedMetricCard, setExpandedMetricCard] = useState<string | null>(null);

  // States for ROW Execution modal
  const [isExecModalOpen, setIsExecModalOpen] = useState(false);
  const [selectedRowForExecution, setSelectedRowForExecution] = useState<ROWItem | null>(null);
  const [execTanggal, setExecTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [execRealisasi, setExecRealisasi] = useState('');
  const [execIzin, setExecIzin] = useState('0');
  const [execPadam, setExecPadam] = useState('0');
  const [execNotes, setExecNotes] = useState('');

  // States mapped directly from real-time database props
  const rowData = rowList;
  const tier1Data = tier1List;
  const tier2Data = tier2List;
  const monitoringData = monitoringList;

  // Filtered lists based on searchQuery
  const filteredRowData = rowData.filter((r) => {
    const q = searchQuery.toLowerCase();
    const penyulangStr = r.penyulang || r.namaPenyulang || '';
    const sectionStr = r.section || r.lokasi || '';
    const luarStr = r.luarTemuan || r.jenisPohon || '';
    return (
      penyulangStr.toLowerCase().includes(q) ||
      sectionStr.toLowerCase().includes(q) ||
      luarStr.toLowerCase().includes(q)
    );
  });

  const filteredTier1Data = tier1Data.filter((t) => {
    const q = searchQuery.toLowerCase();
    return (
      (t.penyulang || '').toLowerCase().includes(q) ||
      (t.section || '').toLowerCase().includes(q) ||
      (t.temuanRow && t.temuanRow.toLowerCase().includes(q)) ||
      (t.konstruksi && t.konstruksi.toLowerCase().includes(q))
    );
  });

  const filteredTier2Data = tier2Data.filter((t) => {
    const q = searchQuery.toLowerCase();
    return (
      (t.penyulang || '').toLowerCase().includes(q) ||
      (t.section || '').toLowerCase().includes(q) ||
      (t.jenisTier2 && t.jenisTier2.toLowerCase().includes(q)) ||
      (t.temuanThermoUltrasound && t.temuanThermoUltrasound.toLowerCase().includes(q))
    );
  });

  const filteredMonitoringData = monitoringData.filter((m) => {
    const q = searchQuery.toLowerCase();
    return (
      (m.penyulang || '').toLowerCase().includes(q) ||
      (m.section || '').toLowerCase().includes(q) ||
      (m.keterangan && m.keterangan.toLowerCase().includes(q)) ||
      (Array.isArray(m.jenisPemeliharaan) && m.jenisPemeliharaan.some((j) => (j || '').toLowerCase().includes(q)))
    );
  });

  // ROW Form State (all fields non-mandatory)
  const [rTanggal, setRTanggal] = useState('2026-08-08'); // Tanggal Eksekusi
  const [rTanggalInspeksi, setRTanggalInspeksi] = useState('2026-08-08'); // Tanggal Inspeksi
  const [rPenyulang, setRPenyulang] = useState('');
  const [rSection, setRSection] = useState('');
  const [rJumlahTemuan, setRJumlahTemuan] = useState('');
  const [rRealisasiPangkas, setRRealisasiPangkas] = useState('');
  const [rPerluIzin, setRPerluIzin] = useState('');
  const [rPerluPadam, setRPerluPadam] = useState('');
  const [rPohonBesar, setRPohonBesar] = useState('');
  const [rLuarTemuan, setRLuarTemuan] = useState('');
  const [rJumlahPersonil, setRJumlahPersonil] = useState('');
  const [rBelumEksekusi, setRBelumEksekusi] = useState('');
  const [rJumlahSisaTemuan, setRJumlahSisaTemuan] = useState('');

  useEffect(() => {
    if (!editingId) {
      // 1. Try to sync with Inspection date if provided
      if (rTanggalInspeksi) {
        const matchingInspeksi = tier1Data.find(t => t.tanggal === rTanggalInspeksi);
        if (matchingInspeksi) {
          setRPenyulang(matchingInspeksi.penyulang || '');
          setRSection(matchingInspeksi.section || '');
          
          // Sync jumlah temuan with inspection's jumlahTemuanPohon or fallback to parsed row number
          const matchNumber = (matchingInspeksi.temuanRow || '').match(/\d+/);
          const defaultTemuan = matchingInspeksi.jumlahTemuanPohon !== undefined && matchingInspeksi.jumlahTemuanPohon !== ''
            ? String(matchingInspeksi.jumlahTemuanPohon) 
            : (matchNumber ? matchNumber[0] : '0');
          setRJumlahTemuan(defaultTemuan);

          const calculatedSisa = Math.max(0, Number(defaultTemuan) - Number(rRealisasiPangkas || 0));
          setRBelumEksekusi(String(calculatedSisa));
          setRJumlahSisaTemuan(String(calculatedSisa));
        }
      } 
      // 2. Otherwise try to sync with previous ROW entry for this feeder/section
      else if (rPenyulang && rSection) {
        const previousRecords = rowData
          .filter(r => r.penyulang === rPenyulang && r.section === rSection && r.id !== editingId)
          .sort((a, b) => new Date(b.tanggal || '').getTime() - new Date(a.tanggal || '').getTime());
        
        if (previousRecords.length > 0) {
          const lastRecord = previousRecords[0];
          const lastSisa = lastRecord.temuanBelumDieksekusi || 0;
          setRJumlahTemuan(String(lastSisa));

          const calculatedSisa = Math.max(0, lastSisa - Number(rRealisasiPangkas || 0));
          setRBelumEksekusi(String(calculatedSisa));
          setRJumlahSisaTemuan(String(calculatedSisa));
        }
      }
    }
  }, [rTanggalInspeksi, rPenyulang, rSection, tier1Data, rowData, editingId]);

  // Tier 1 Form State
  const [t1Tanggal, setT1Tanggal] = useState('2026-08-08');
  const [t1Penyulang, setT1Penyulang] = useState('');
  const [t1Section, setT1Section] = useState('');
  const [t1TemuanRow, setT1TemuanRow] = useState('');
  const [t1Konstruksi, setT1Konstruksi] = useState('');
  const [t1JumlahTemuanPohon, setT1JumlahTemuanPohon] = useState('');
  const [t1JumlahTemuanKonstruksi, setT1JumlahTemuanKonstruksi] = useState('');
  const [t1TemuanLain, setT1TemuanLain] = useState('');

  // Tier 2 Form State
  const [t2Tanggal, setT2Tanggal] = useState('2026-08-08');
  const [t2Penyulang, setT2Penyulang] = useState('');
  const [t2Section, setT2Section] = useState('');
  const [t2Jenis, setT2Jenis] = useState<'Thermovision' | 'Ultrasound'>('Thermovision');
  const [t2Temuan, setT2Temuan] = useState('');

  // Monitoring Pemeliharaan Form State
  const [mTanggal, setMTanggal] = useState('2026-08-08');
  const [mPenyulang, setMPenyulang] = useState('');
  const [mSection, setMSection] = useState('');
  const [mJenisList, setMJenisList] = useState<string[]>(['SUTM', 'Komponen SUTM']);
  const [mKeterangan, setMKeterangan] = useState('');

  // Title info mapping
  const getSubTitle = () => {
    switch (currentSubView) {
      case 'row':
        return { title: 'ROW (Pemangkasan Pohon & Dahan)', icon: <Trees className="w-5 h-5 text-emerald-400" />, desc: 'Input & Monitoring Temuan Inspeksi ROW, Realisasi Pangkas, Perlu Izin, Perlu Padam & Pohon Besar' };
      case 'inspeksi_tier1':
        return { title: 'Inspeksi Pohon & SUTM (Tier 1 Visual)', icon: <ClipboardList className="w-5 h-5 text-amber-500" />, desc: 'Pencatatan data inspeksi visual pohon, dahan rimbun, temuan konstruksi, serta temuan lain yang tersingkronisasi dengan Realisasi ROW' };
      case 'inspeksi_tier2':
        return { title: 'Inspeksi Tier 2 (Thermovision & Ultrasound)', icon: <Search className="w-5 h-5 text-indigo-400" />, desc: 'Input data inspeksi tanggal, penyulang, section, jenis Tier 2 (Thermo/Ultrasound) & temuan' };
      case 'pemeliharaan_20kv':
      default:
        return { title: 'Monitoring Pemeliharaan 20kV', icon: <Wrench className="w-5 h-5 text-cyan-400" />, desc: 'Input monitoring pemeliharaan penyulang, section, jenis pemeliharaan (SUTM, SUTR, Komponen, Peralatan SUTM) & keterangan' };
    }
  };

  const { title, icon, desc } = getSubTitle();

  // Handlers
  const handleSaveROW = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const id = editingId || `row_${Date.now()}`;
      const statusValue = (Number(rRealisasiPangkas) >= Number(rJumlahTemuan) && Number(rJumlahTemuan) > 0) ? 'Selesai' : 'Perlu Pangkas';
      const sisa = Math.max(0, Number(rJumlahTemuan) - Number(rRealisasiPangkas));
      const newItem: ROWItem = {
        id,
        tanggal: rTanggal || '-', // Tanggal Eksekusi
        tanggalInspeksi: rTanggalInspeksi || '-',
        tanggalEksekusi: rTanggal || '-',
        penyulang: rPenyulang || '-',
        section: rSection || '-',
        jumlahTemuanInspeksi: rJumlahTemuan !== '' ? rJumlahTemuan : '-',
        realisasiPangkas: rRealisasiPangkas !== '' ? rRealisasiPangkas : '-',
        perluIzin: rPerluIzin !== '' ? rPerluIzin : '-',
        perluPadam: rPerluPadam !== '' ? rPerluPadam : '-',
        pohonBesar: rPohonBesar !== '' ? rPohonBesar : '-',
        luarTemuan: rLuarTemuan || '-',
        temuanBelumDieksekusi: sisa,
        jumlahPersonil: rJumlahPersonil !== '' ? rJumlahPersonil : '-',
        belumEksekusi: rBelumEksekusi !== '' ? rBelumEksekusi : '-',
        jumlahSisaTemuan: rJumlahSisaTemuan !== '' ? rJumlahSisaTemuan : '-',
        // Backward-compatibility properties for DashboardView
        tiangId: 'T-Custom',
        namaPenyulang: rPenyulang || '-',
        lokasi: rSection || '-',
        jumlahPohon: Number(rJumlahTemuan) || 0,
        jenisPohon: rLuarTemuan || 'Pohon Rimbun',
        status: statusValue as any,
        prioritas: 'Sedang',
        tanggalTemuan: rTanggalInspeksi || rTanggal || '-'
      };
      await setDoc(doc(db, 'pemeliharaan_row', id), sanitizeForFirestore(newItem));
      setIsModalOpen(false);
      setEditingId(null);
      // Reset
      setRPenyulang('');
      setRSection('');
      setRJumlahTemuan('');
      setRRealisasiPangkas('');
      setRPerluIzin('');
      setRPerluPadam('');
      setRPohonBesar('');
      setRLuarTemuan('');
      setRJumlahPersonil('');
      setRBelumEksekusi('');
      setRJumlahSisaTemuan('');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'pemeliharaan_row');
    }
  };

  const handleExecuteROWSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRowForExecution) return;

    try {
      const row = selectedRowForExecution;
      const temuanInspeksi = Number(row.jumlahTemuanInspeksi) || Number(row.jumlahPohon) || 0;
      const newRealisasi = Number(execRealisasi) || 0;
      const sisa = Math.max(0, temuanInspeksi - newRealisasi);
      const statusValue = sisa === 0 ? 'Selesai' : 'Perlu Pangkas';

      const updatedItem: ROWItem = {
        ...row,
        tanggal: execTanggal, // Tanggal Eksekusi
        tanggalEksekusi: execTanggal,
        realisasiPangkas: newRealisasi,
        perluIzin: Number(execIzin) || 0,
        perluPadam: Number(execPadam) || 0,
        luarTemuan: execNotes || row.luarTemuan || '-',
        temuanBelumDieksekusi: sisa,
        // Update backward compatibility fields
        status: statusValue as any,
        tanggalTemuan: row.tanggalInspeksi || row.tanggalTemuan || '-'
      };

      await setDoc(doc(db, 'pemeliharaan_row', row.id), sanitizeForFirestore(updatedItem));

      // Also automatically create an entry in Monitoring Pemeliharaan 20kV
      const monId = `m_auto_row_${row.id}`;
      const monItem = {
        id: monId,
        tanggal: execTanggal,
        penyulang: row.penyulang || '-',
        section: row.section || '-',
        jenisPemeliharaan: ['SUTM'],
        keterangan: `Eksekusi Pangkas ROW: Berhasil memangkas ${newRealisasi} pohon. Sisa temuan: ${sisa} pohon.`
      };
      await setDoc(doc(db, 'pemeliharaan_monitoring', monId), sanitizeForFirestore(monItem));

      setIsExecModalOpen(false);
      setSelectedRowForExecution(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'pemeliharaan_row');
    }
  };

  const handleSaveTier1 = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const id = editingId || `t1_${Date.now()}`;
      const newItem: Tier1Item = {
        id,
        tanggal: t1Tanggal || '-',
        penyulang: t1Penyulang || '-',
        section: t1Section || '-',
        temuanRow: t1TemuanRow || '-',
        konstruksi: t1Konstruksi || '-',
        jumlahTemuanPohon: t1JumlahTemuanPohon !== '' ? Number(t1JumlahTemuanPohon) : '',
        jumlahTemuanKonstruksi: t1JumlahTemuanKonstruksi !== '' ? Number(t1JumlahTemuanKonstruksi) : '',
        temuanLain: t1TemuanLain || '-'
      };
      await setDoc(doc(db, 'pemeliharaan_tier1', id), sanitizeForFirestore(newItem));

      // AUTOMATICALLY CREATE ROW ITEM FROM TIER 1 INSPECTION
      if ((t1TemuanRow && t1TemuanRow.trim() !== '' && t1TemuanRow !== '-') || (t1JumlahTemuanPohon !== '' && Number(t1JumlahTemuanPohon) > 0)) {
        const rowId = `row_auto_t1_${id}`;
        // Extract a number if any, otherwise default to user's input count or 1
        const matchNumber = (t1TemuanRow || '').match(/\d+/);
        const qty = t1JumlahTemuanPohon !== '' ? Number(t1JumlahTemuanPohon) : (matchNumber ? Number(matchNumber[0]) : 1);
        const rowItem: ROWItem = {
          id: rowId,
          tanggal: '-',
          tanggalInspeksi: t1Tanggal || '-',
          tanggalEksekusi: '-',
          penyulang: t1Penyulang || '-',
          section: t1Section || '-',
          jumlahTemuanInspeksi: qty,
          realisasiPangkas: 0,
          perluIzin: 0,
          perluPadam: 0,
          pohonBesar: (t1TemuanRow || '').toLowerCase().includes('besar') || (t1TemuanRow || '').toLowerCase().includes('kelapa') ? 1 : 0,
          luarTemuan: t1TemuanRow || 'Temuan dari Inspeksi Visual',
          temuanBelumDieksekusi: qty,
          belumEksekusi: qty,
          jumlahSisaTemuan: qty,
          tiangId: 'T-Custom',
          namaPenyulang: t1Penyulang || '-',
          lokasi: t1Section || '-',
          jumlahPohon: qty,
          jenisPohon: t1TemuanRow || 'Pohon Rimbun',
          status: 'Perlu Pangkas',
          prioritas: (t1TemuanRow || '').toLowerCase().includes('dekat') || (t1TemuanRow || '').toLowerCase().includes('sentuh') ? 'Tinggi' : 'Sedang',
          tanggalTemuan: t1Tanggal || '-',
          isFromInspection: true,
          inspectionId: id
        };
        await setDoc(doc(db, 'pemeliharaan_row', rowId), sanitizeForFirestore(rowItem));
      }

      setIsModalOpen(false);
      setEditingId(null);
      setT1Penyulang('');
      setT1Section('');
      setT1TemuanRow('');
      setT1Konstruksi('');
      setT1JumlahTemuanPohon('');
      setT1JumlahTemuanKonstruksi('');
      setT1TemuanLain('');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'pemeliharaan_tier1');
    }
  };

  const handleSaveTier2 = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const id = editingId || `t2_${Date.now()}`;
      const newItem: Tier2Item = {
        id,
        tanggal: t2Tanggal || '-',
        penyulang: t2Penyulang || '-',
        section: t2Section || '-',
        jenisTier2: t2Jenis,
        temuanThermoUltrasound: t2Temuan || '-'
      };
      await setDoc(doc(db, 'pemeliharaan_tier2', id), sanitizeForFirestore(newItem));
      setIsModalOpen(false);
      setEditingId(null);
      setT2Penyulang('');
      setT2Section('');
      setT2Temuan('');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'pemeliharaan_tier2');
    }
  };

  const handleSaveMonitoring = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const id = editingId || `m_${Date.now()}`;
      const newItem: MonitoringPemeliharaanItem = {
        id,
        tanggal: mTanggal || '-',
        penyulang: mPenyulang || '-',
        section: mSection || '-',
        jenisPemeliharaan: mJenisList.length > 0 ? mJenisList : ['SUTM'],
        keterangan: mKeterangan || '-'
      };
      await setDoc(doc(db, 'pemeliharaan_monitoring', id), sanitizeForFirestore(newItem));
      setIsModalOpen(false);
      setEditingId(null);
      setMPenyulang('');
      setMSection('');
      setMKeterangan('');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'pemeliharaan_monitoring');
    }
  };

  const toggleJenisPemeliharaan = (option: string) => {
    if (mJenisList.includes(option)) {
      setMJenisList(mJenisList.filter((item) => item !== option));
    } else {
      setMJenisList([...mJenisList, option]);
    }
  };

  const handleExportPDF = () => {
    const doc = new jsPDF('landscape');
    doc.setFontSize(14);
    let title = 'Laporan Pemeliharaan - PT PLN (Persero)';
    
    let headers: string[][] = [];
    let dataRows: any[][] = [];

    if (currentSubView === 'row') {
      title = 'Laporan Pemeliharaan ROW / Pohon - PT PLN (Persero)';
      headers = [['Tanggal', 'Penyulang', 'Section', 'Jml Temuan', 'Realisasi', 'Perlu Izin', 'Perlu Padam', 'Phn Besar', 'Luar Temuan']];
      dataRows = rowData.map((r) => [
        r.tanggal, r.penyulang, r.section, r.jumlahTemuanInspeksi, r.realisasiPangkas, r.perluIzin, r.perluPadam, r.pohonBesar, r.luarTemuan
      ]);
    } else if (currentSubView === 'inspeksi_tier1') {
      title = 'Laporan Inspeksi Tier 1 (Visual) - PT PLN (Persero)';
      headers = [['Tanggal', 'Penyulang', 'Section', 'Temuan ROW', 'Temuan Konstruksi']];
      dataRows = tier1Data.map((t) => [
        t.tanggal, t.penyulang, t.section, t.temuanRow, t.konstruksi
      ]);
    } else if (currentSubView === 'inspeksi_tier2') {
      title = 'Laporan Inspeksi Tier 2 - PT PLN (Persero)';
      headers = [['Tanggal', 'Penyulang', 'Section', 'Jenis Tier 2', 'Temuan Thermo/Ultrasound']];
      dataRows = tier2Data.map((t) => [
        t.tanggal, t.penyulang, t.section, t.jenisTier2, t.temuanThermoUltrasound
      ]);
    } else {
      title = 'Monitoring Eksekusi Pemeliharaan - PT PLN (Persero)';
      headers = [['Tanggal', 'Penyulang', 'Section', 'Jenis Pemeliharaan', 'Keterangan']];
      dataRows = monitoringData.map((m) => [
        m.tanggal, m.penyulang, m.section, m.jenisPemeliharaan, m.keteranganPekerjaan
      ]);
    }

    doc.text(title, 14, 15);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}`, 14, 22);

    autoTable(doc, {
      head: headers,
      body: dataRows,
      startY: 28,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });

    const filename = title.replace(/ /g, '_').replace(/[^a-zA-Z0-9_]/g, '') + `_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
  };

  // Export CSV handler for active subview
  const handleExportCurrentPemeliharaan = () => {
    if (currentSubView === 'row') {
      const headers = ['Tanggal', 'Penyulang', 'Section', 'Jumlah Temuan Inspeksi', 'Realisasi Pangkas', 'Perlu Izin', 'Perlu Padam', 'Pohon Besar', 'Luar Temuan'];
      const rows = rowData.map((r) => [
        r.tanggal,
        r.penyulang,
        r.section,
        r.jumlahTemuanInspeksi,
        r.realisasiPangkas,
        r.perluIzin,
        r.perluPadam,
        r.pohonBesar,
        r.luarTemuan
      ]);
      exportToCSV('Laporan_Pemeliharaan_ROW_Pohon', headers, rows);
    } else if (currentSubView === 'inspeksi_tier1') {
      const headers = ['Tanggal', 'Penyulang', 'Section', 'Temuan ROW', 'Temuan Konstruksi'];
      const rows = tier1Data.map((t) => [
        t.tanggal,
        t.penyulang,
        t.section,
        t.temuanRow,
        t.konstruksi
      ]);
      exportToCSV('Laporan_Inspeksi_Tier1_Visual', headers, rows);
    } else if (currentSubView === 'inspeksi_tier2') {
      const headers = ['Tanggal', 'Penyulang', 'Section', 'Jenis Tier 2', 'Temuan Thermo / Ultrasound'];
      const rows = tier2Data.map((t) => [
        t.tanggal,
        t.penyulang,
        t.section,
        t.jenisTier2,
        t.temuanThermoUltrasound
      ]);
      exportToCSV('Laporan_Inspeksi_Tier2_Thermo_Ultrasound', headers, rows);
    } else {
      const headers = ['Tanggal', 'Penyulang', 'Section', 'Jenis Pemeliharaan', 'Keterangan Pekerjaan'];
      const rows = monitoringData.map((m) => [
        m.tanggal,
        m.penyulang,
        m.section,
        Array.isArray(m.jenisPemeliharaan) ? m.jenisPemeliharaan.join('; ') : m.jenisPemeliharaan,
        m.keterangan
      ]);
      exportToCSV('Laporan_Monitoring_Pemeliharaan_20kV', headers, rows);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 bg-slate-50 text-slate-900 font-sans min-h-screen">
      
      {/* Sub Header */}
      <div className="p-5 bg-gradient-to-r from-[#022623] via-[#044c45] to-[#022e2a] border-2 border-teal-500/60 shadow-xl rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-white relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center gap-3.5 z-10">
          <div className="p-3 rounded-2xl bg-teal-950/80 border border-teal-500/40 text-teal-300 shadow-inner">
            {icon}
          </div>
          <div>
            <h2 className="text-base font-extrabold text-white uppercase tracking-wider drop-shadow-xs">
              {title}
            </h2>
            <p className="text-xs text-teal-100/90 mt-0.5 max-w-2xl">{desc}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 z-10 flex-wrap">
          <button
            onClick={handleExportPDF}
            className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm shadow-rose-600/20 active:scale-95"
            title="Unduh data laporan pemeliharaan ke format PDF"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export PDF</span>
          </button>
          <button
            onClick={handleExportCurrentPemeliharaan}
            className="px-3.5 py-2 bg-[#012521] hover:bg-[#02312b] text-teal-200 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer border border-teal-500/50 shadow-sm active:scale-95"
            title="Unduh data laporan pemeliharaan ke format CSV/Excel"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export CSV/Excel</span>
          </button>
          <button
            onClick={() => {
              setEditingId(null);
              // Reset ROW fields
              setRPenyulang('');
              setRSection('');
              setRJumlahTemuan('');
              setRRealisasiPangkas('');
              setRPerluIzin('');
              setRPerluPadam('');
              setRPohonBesar('');
              setRLuarTemuan('');
              // Reset Tier 1 fields
              setT1Penyulang('');
              setT1Section('');
              setT1TemuanRow('');
              setT1Konstruksi('');
              // Reset Tier 2 fields
              setT2Penyulang('');
              setT2Section('');
              setT2Temuan('');
              // Reset Monitoring fields
              setMPenyulang('');
              setMSection('');
              setMKeterangan('');
              setMJenisList(['SUTM', 'Komponen SUTM']);
              
              setIsModalOpen(true);
            }}
            className="px-4 py-2 bg-gradient-to-r from-teal-400 to-emerald-400 hover:from-teal-300 hover:to-emerald-300 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-teal-950/40 border border-teal-200 active:scale-95"
          >
            <Plus className="w-4 h-4 text-slate-950" />
            <span>+ Input Data Baru</span>
          </button>
        </div>
      </div>

      {/* ROW View */}
      {currentSubView === 'row' && (
        <div className="space-y-6">
          {/* Expandable Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Metric 1: Total Temuan */}
            {(() => {
              const totalTemuan = rowData.reduce((acc, r) => acc + (typeof r.jumlahTemuanInspeksi === 'number' ? r.jumlahTemuanInspeksi : Number(r.jumlahTemuanInspeksi) || typeof r.jumlahPohon === 'number' ? r.jumlahPohon : Number(r.jumlahPohon) || 0), 0);
              const isExpanded = expandedMetricCard === 'temuan';

              return (
                <motion.div
                  layout
                  onClick={() => setExpandedMetricCard(isExpanded ? null : 'temuan')}
                  className={`p-5 bg-white border rounded-2xl transition-all shadow-xs cursor-pointer select-none ${
                    isExpanded ? 'border-blue-400 ring-2 ring-blue-500/10' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">TOTAL TEMUAN INSPEKSI</span>
                    <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    </motion.div>
                  </div>
                  <div className="text-2xl font-extrabold text-slate-900 mt-1">
                    {totalTemuan} Temuan
                  </div>
                  <span className="text-[11px] text-slate-400">Kumulatif seluruh section</span>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}
                        className="mt-3 pt-3 border-t border-slate-100 space-y-1.5 text-xs"
                      >
                        <div className="text-[10px] font-bold uppercase text-slate-400">Distribusi Temuan Terbanyak:</div>
                        {rowData.slice(0, 3).map((r, i) => (
                          <div key={i} className="flex justify-between items-center text-slate-600">
                            <span className="truncate max-w-[140px] font-medium">{r.penyulang || r.namaPenyulang}</span>
                            <span className="font-bold text-slate-900">{r.jumlahTemuanInspeksi || r.jumlahPohon || 0} pohon</span>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })()}

            {/* Metric 2: Realisasi Pangkas */}
            {(() => {
              const totalPangkas = rowData.reduce((acc, r) => {
                if (typeof r.realisasiPangkas === 'number') return acc + r.realisasiPangkas;
                const val = Number(r.realisasiPangkas);
                if (!isNaN(val)) return acc + val;
                if (r.status === 'Selesai') return acc + (typeof r.jumlahPohon === 'number' ? r.jumlahPohon : Number(r.jumlahPohon) || 0);
                return acc;
              }, 0);
              const totalTemuan = rowData.reduce((acc, r) => acc + (typeof r.jumlahTemuanInspeksi === 'number' ? r.jumlahTemuanInspeksi : Number(r.jumlahTemuanInspeksi) || typeof r.jumlahPohon === 'number' ? r.jumlahPohon : Number(r.jumlahPohon) || 0), 0);
              const percentage = totalTemuan > 0 ? Math.round((totalPangkas / totalTemuan) * 100) : 0;
              const isExpanded = expandedMetricCard === 'pangkas';

              return (
                <motion.div
                  layout
                  onClick={() => setExpandedMetricCard(isExpanded ? null : 'pangkas')}
                  className={`p-5 bg-white border rounded-2xl transition-all shadow-xs cursor-pointer select-none ${
                    isExpanded ? 'border-emerald-400 ring-2 ring-emerald-500/10' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase text-emerald-600 tracking-wider">REALISASI PANGKAS</span>
                    <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                      <ChevronDown className="w-4 h-4 text-emerald-500" />
                    </motion.div>
                  </div>
                  <div className="text-2xl font-extrabold text-emerald-600 mt-1">
                    {totalPangkas} Pohon
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${percentage}%` }} />
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700">{percentage}%</span>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}
                        className="mt-3 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600"
                      >
                        <div className="flex justify-between">
                          <span>Sisa Target ROW:</span>
                          <span className="font-bold text-amber-700">{Math.max(0, totalTemuan - totalPangkas)} pohon</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Status ROW:</span>
                          <span className="font-bold text-emerald-700">{percentage >= 80 ? 'Optimal' : 'Butuh Percepatan'}</span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })()}

            {/* Metric 3: Perlu Izin / Padam */}
            {(() => {
              const totalIzin = rowData.reduce((acc, r) => acc + (typeof r.perluIzin === 'number' ? r.perluIzin : Number(r.perluIzin) || 0), 0);
              const totalPadam = rowData.reduce((acc, r) => acc + (typeof r.perluPadam === 'number' ? r.perluPadam : Number(r.perluPadam) || 0), 0);
              const isExpanded = expandedMetricCard === 'izin';

              return (
                <motion.div
                  layout
                  onClick={() => setExpandedMetricCard(isExpanded ? null : 'izin')}
                  className={`p-5 bg-white border rounded-2xl transition-all shadow-xs cursor-pointer select-none ${
                    isExpanded ? 'border-amber-400 ring-2 ring-amber-500/10' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase text-amber-600 tracking-wider">PERLU IZIN / PADAM</span>
                    <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                      <ChevronDown className="w-4 h-4 text-amber-500" />
                    </motion.div>
                  </div>
                  <div className="text-2xl font-extrabold text-amber-600 mt-1">
                    {totalIzin + totalPadam} Titik
                  </div>
                  <span className="text-[11px] text-slate-400">Perlu koordinasi warga & tim padam</span>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}
                        className="mt-3 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600"
                      >
                        <div className="flex justify-between">
                          <span>Izin Pemilik Lahan:</span>
                          <span className="font-bold text-amber-700">{totalIzin} titik</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Butuh Padam Terencana:</span>
                          <span className="font-bold text-purple-700">{totalPadam} titik</span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })()}

            {/* Metric 4: Pohon Besar */}
            {(() => {
              const totalPohonBesar = rowData.reduce((acc, r) => acc + (typeof r.pohonBesar === 'number' ? r.pohonBesar : Number(r.pohonBesar) || 0), 0);
              const isExpanded = expandedMetricCard === 'besar';

              return (
                <motion.div
                  layout
                  onClick={() => setExpandedMetricCard(isExpanded ? null : 'besar')}
                  className={`p-5 bg-white border rounded-2xl transition-all shadow-xs cursor-pointer select-none ${
                    isExpanded ? 'border-rose-400 ring-2 ring-rose-500/10' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase text-rose-600 tracking-wider">POHON BESAR</span>
                    <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                      <ChevronDown className="w-4 h-4 text-rose-500" />
                    </motion.div>
                  </div>
                  <div className="text-2xl font-extrabold text-rose-600 mt-1">
                    {totalPohonBesar} Batang
                  </div>
                  <span className="text-[11px] text-slate-400">Butuh penebangan khusus</span>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}
                        className="mt-3 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600"
                      >
                        <div className="flex justify-between">
                          <span>Tingkat Kerawanan:</span>
                          <span className="font-bold text-rose-700">Tinggi (Berpotensi Roboh)</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Peralatan:</span>
                          <span className="font-bold text-slate-800">Chainsaw & Tambang</span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })()}
          </div>

          <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative max-w-sm w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari penyulang, section, temuan..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                />
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center p-1 bg-slate-100 border border-slate-200 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setViewLayout('cards')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      viewLayout === 'cards'
                        ? 'bg-white text-emerald-700 shadow-xs border border-slate-200/80'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>Card Interaktif</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewLayout('table')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      viewLayout === 'table'
                        ? 'bg-white text-emerald-700 shadow-xs border border-slate-200/80'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <List className="w-3.5 h-3.5" />
                    <span>Tabel Data</span>
                  </button>
                </div>

                <span className="text-xs text-slate-500 font-bold hidden sm:inline">
                  Total {filteredRowData.length} Data ROW
                </span>
              </div>
            </div>
 
          {isLoading ? (
            <TableSkeletonLoader columns={14} rows={6} headerTitle="Tabel Data ROW" />
          ) : viewLayout === 'cards' ? (
            <div className="space-y-3">
              {filteredRowData.length === 0 ? (
                <div className="p-12 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-slate-400 text-xs">
                  Tidak ada data ROW yang sesuai dengan kriteria pencarian.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3.5">
                  {filteredRowData.map((r) => {
                    const temuanInspeksi = Number(r.jumlahTemuanInspeksi) || Number(r.jumlahPohon) || 0;
                    const pangkas = Number(r.realisasiPangkas) || 0;
                    const izin = Number(r.perluIzin) || 0;
                    const padam = Number(r.perluPadam) || 0;
                    const besar = Number(r.pohonBesar) || 0;
                    const calculatedSisa = Math.max(0, temuanInspeksi - pangkas);
                    const sisa = r.jumlahSisaTemuan !== undefined && r.jumlahSisaTemuan !== '-' ? Number(r.jumlahSisaTemuan) : calculatedSisa;
                    const belum = r.belumEksekusi !== undefined && r.belumEksekusi !== '-' ? r.belumEksekusi : calculatedSisa;
                    const isComplete = r.status === 'Selesai' || sisa === 0;
                    const progressPct = temuanInspeksi > 0 ? Math.min(100, Math.round((pangkas / temuanInspeksi) * 100)) : 0;
                    const isExpanded = expandedRowId === r.id;

                    return (
                      <motion.div
                        layout
                        key={r.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ layout: { duration: 0.28, type: 'spring', stiffness: 350, damping: 28 } }}
                        className={`border rounded-2xl transition-all shadow-xs overflow-hidden ${
                          isExpanded
                            ? 'border-emerald-300 bg-white ring-2 ring-emerald-500/10'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div
                          onClick={() => setExpandedRowId(isExpanded ? null : r.id)}
                          className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/70 transition-colors select-none"
                        >
                          <div className="flex items-start md:items-center gap-3.5">
                            <div className={`p-2.5 rounded-xl shrink-0 ${
                              isComplete
                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                                : 'bg-amber-50 text-amber-600 border border-amber-200'
                            }`}>
                              <Trees className="w-5 h-5" />
                            </div>

                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-extrabold text-sm text-slate-900">{r.penyulang || r.namaPenyulang}</span>
                                <span className="text-xs font-bold text-slate-600">({r.section || r.lokasi})</span>
                                <span className={`px-2 py-0.5 rounded-md font-extrabold text-[9px] uppercase tracking-wider ${
                                  isComplete
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {isComplete ? 'Selesai / 100%' : `Sisa ${sisa} Temuan`}
                                </span>
                              </div>

                              <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                                <span className="flex items-center gap-1 font-mono text-[11px] text-emerald-700">
                                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                  Inspeksi: {r.tanggalInspeksi || r.tanggalTemuan || '-'}
                                </span>
                                <span className="text-slate-300">•</span>
                                <span className="flex items-center gap-1 font-mono text-[11px] text-slate-600">
                                  Eksekusi: {r.tanggal || r.tanggalEksekusi || '-'}
                                </span>
                                <span className="text-slate-300">•</span>
                                <span className="text-slate-600">
                                  Temuan: <strong className="text-slate-900">{temuanInspeksi}</strong> | Pangkas: <strong className="text-emerald-600">{pangkas}</strong>
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between md:justify-end gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                            <div className="w-24">
                              <div className="flex justify-between text-[10px] font-bold mb-1">
                                <span className="text-slate-500">Progress</span>
                                <span className="text-emerald-700">{progressPct}%</span>
                              </div>
                              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${progressPct}%` }} />
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-bold text-emerald-700 hidden sm:inline">
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
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-2 shadow-2xs">
                                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
                                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                      <span>Realisasi & Sisa Pohon</span>
                                    </div>
                                    <div className="space-y-1.5 text-slate-600">
                                      <div className="flex justify-between">
                                        <span>Total Temuan:</span>
                                        <span className="font-bold text-blue-600">{temuanInspeksi} Pohon</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span>Realisasi Pangkas:</span>
                                        <span className="font-bold text-emerald-600">{pangkas} Pohon</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span>Belum Eksekusi:</span>
                                        <span className="font-bold text-amber-700">{belum} Pohon</span>
                                      </div>
                                      <div className="flex justify-between pt-1 border-t border-slate-100">
                                        <span>Sisa Temuan Akhir:</span>
                                        <span className="font-extrabold text-red-600 bg-red-50 px-2 py-0.5 rounded">
                                          {sisa} Pohon
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-2 shadow-2xs">
                                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
                                      <AlertCircle className="w-4 h-4 text-amber-600" />
                                      <span>Kondisi & Izin Lapangan</span>
                                    </div>
                                    <div className="space-y-1.5 text-slate-600">
                                      <div className="flex justify-between">
                                        <span>Perlu Izin Warga:</span>
                                        <span className="font-bold text-amber-600">{izin} Titik</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span>Perlu Padam Jaringan:</span>
                                        <span className="font-bold text-purple-600">{padam} Titik</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span>Pohon Besar (Chainsaw):</span>
                                        <span className="font-bold text-rose-600">{besar} Batang</span>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-2 shadow-2xs">
                                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
                                      <Info className="w-4 h-4 text-blue-600" />
                                      <span>Catatan & Personil</span>
                                    </div>
                                    <div className="space-y-1 text-slate-600">
                                      <div>
                                        <span className="text-[10px] text-slate-400 block font-bold uppercase">Jumlah Personil:</span>
                                        <span className="font-bold text-indigo-700">{r.jumlahPersonil || '-'} Orang</span>
                                      </div>
                                      <div>
                                        <span className="text-[10px] text-slate-400 block font-bold uppercase">Keterangan / Luar Temuan:</span>
                                        <span className="text-slate-800 font-medium">
                                          {r.luarTemuan !== undefined && r.luarTemuan !== '-' ? r.luarTemuan : r.jenisPohon || 'Tidak ada catatan spesifik'}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200">
                                  <div className="flex items-center gap-2">
                                    {r.status !== 'Selesai' && sisa > 0 && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setSelectedRowForExecution(r);
                                          setExecTanggal(new Date().toISOString().split('T')[0]);
                                          setExecRealisasi(String(sisa));
                                          setExecIzin(String(izin));
                                          setExecPadam(String(padam));
                                          const textVal = r.luarTemuan !== '-' ? r.luarTemuan || '' : '';
                                          setExecNotes(textVal);
                                          setIsExecModalOpen(true);
                                        }}
                                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
                                      >
                                        <Wrench className="w-3.5 h-3.5" />
                                        <span>Eksekusi Pangkas / Tebang</span>
                                      </button>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingId(r.id);
                                        setRTanggalInspeksi(r.tanggalInspeksi || r.tanggalTemuan || '');
                                        setRTanggal(r.tanggal || r.tanggalEksekusi || '');
                                        setRPenyulang(r.penyulang || r.namaPenyulang || '');
                                        setRSection(r.section || r.lokasi || '');
                                        setRJumlahTemuan(r.jumlahTemuanInspeksi !== undefined && r.jumlahTemuanInspeksi !== '-' ? String(r.jumlahTemuanInspeksi) : r.jumlahPohon !== undefined ? String(r.jumlahPohon) : '');
                                        setRRealisasiPangkas(r.realisasiPangkas !== undefined && r.realisasiPangkas !== '-' ? String(r.realisasiPangkas) : (r.status === 'Selesai' ? String(r.jumlahPohon) : ''));
                                        setRPerluIzin(r.perluIzin !== undefined && r.perluIzin !== '-' ? String(r.perluIzin) : '');
                                        setRPerluPadam(r.perluPadam !== undefined && r.perluPadam !== '-' ? String(r.perluPadam) : '');
                                        setRPohonBesar(r.pohonBesar !== undefined && r.pohonBesar !== '-' ? String(r.pohonBesar) : '');
                                        setRLuarTemuan(r.luarTemuan !== undefined && r.luarTemuan !== '-' ? r.luarTemuan : r.jenisPohon || '');
                                        setRJumlahPersonil(r.jumlahPersonil !== undefined && r.jumlahPersonil !== '-' ? String(r.jumlahPersonil) : '');
                                        setRBelumEksekusi(r.belumEksekusi !== undefined && r.belumEksekusi !== '-' ? String(r.belumEksekusi) : '');
                                        setRJumlahSisaTemuan(r.jumlahSisaTemuan !== undefined && r.jumlahSisaTemuan !== '-' ? String(r.jumlahSisaTemuan) : '');
                                        setIsModalOpen(true);
                                      }}
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                                    >
                                      <Pencil className="w-3.5 h-3.5 text-blue-600" />
                                      <span>Edit Record</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={async () => {
                                        registerDeletedId(r.id);
                                        try {
                                          await deleteDoc(doc(db, 'pemeliharaan_row', r.id));
                                        } catch (error) {
                                          handleFirestoreError(error, OperationType.DELETE, 'pemeliharaan_row');
                                        }
                                      }}
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
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs text-slate-800">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[11px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3.5">Tgl Inspeksi</th>
                    <th className="px-4 py-3.5">Tgl Eksekusi</th>
                    <th className="px-4 py-3.5">Penyulang</th>
                    <th className="px-4 py-3.5">Section</th>
                    <th className="px-4 py-3.5 text-center">Jml Personil</th>
                    <th className="px-4 py-3.5 text-center">Jml Temuan</th>
                    <th className="px-4 py-3.5 text-center">Realisasi Eksekusi</th>
                    <th className="px-4 py-3.5 text-center">Belum Eksekusi</th>
                    <th className="px-4 py-3.5 text-center">Perlu Izin</th>
                    <th className="px-4 py-3.5 text-center">Perlu Padam</th>
                    <th className="px-4 py-3.5 text-center">Pohon Besar</th>
                    <th className="px-4 py-3.5 text-center">Sisa Temuan</th>
                    <th className="px-4 py-3.5">Luar Temuan</th>
                    <th className="px-4 py-3.5 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredRowData.map((r) => {
                    const temuanInspeksi = Number(r.jumlahTemuanInspeksi) || Number(r.jumlahPohon) || 0;
                    const pangkas = Number(r.realisasiPangkas) || 0;
                    const izin = Number(r.perluIzin) || 0;
                    const padam = Number(r.perluPadam) || 0;
                    const besar = Number(r.pohonBesar) || 0;
                    const calculatedSisa = Math.max(0, temuanInspeksi - pangkas);
                    const sisa = r.jumlahSisaTemuan !== undefined && r.jumlahSisaTemuan !== '-' ? Number(r.jumlahSisaTemuan) : calculatedSisa;
                    const belum = r.belumEksekusi !== undefined && r.belumEksekusi !== '-' ? r.belumEksekusi : calculatedSisa;
                    const personil = r.jumlahPersonil !== undefined ? r.jumlahPersonil : '-';
                    return (
                      <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3.5 font-mono text-emerald-700 text-[11px] whitespace-nowrap">{r.tanggalInspeksi || r.tanggalTemuan || '-'}</td>
                        <td className="px-4 py-3.5 font-mono text-slate-600 text-[11px] whitespace-nowrap">{r.tanggal || r.tanggalEksekusi || '-'}</td>
                        <td className="px-4 py-3.5 font-bold text-emerald-700">{r.penyulang || r.namaPenyulang || '-'}</td>
                        <td className="px-4 py-3.5 font-semibold text-slate-800">{r.section || r.lokasi || '-'}</td>
                        <td className="px-4 py-3.5 text-center font-bold text-indigo-600">{personil}</td>
                        <td className="px-4 py-3.5 text-center font-bold text-blue-600">{temuanInspeksi}</td>
                        <td className="px-4 py-3.5 text-center font-bold text-emerald-600">{pangkas}</td>
                        <td className="px-4 py-3.5 text-center font-extrabold text-amber-700 bg-amber-50">{belum}</td>
                        <td className="px-4 py-3.5 text-center font-bold text-amber-600">{izin}</td>
                        <td className="px-4 py-3.5 text-center font-bold text-purple-600">{padam}</td>
                        <td className="px-4 py-3.5 text-center font-bold text-rose-600">{besar}</td>
                        <td className="px-4 py-3.5 text-center font-extrabold text-red-600 bg-red-50">{sisa}</td>
                        <td className="px-4 py-3.5 text-slate-600 text-[11px] max-w-xs">{r.luarTemuan !== undefined && r.luarTemuan !== '-' ? r.luarTemuan : r.jenisPohon || '-'}</td>
                        <td className="px-4 py-3.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {r.status !== 'Selesai' && sisa > 0 && (
                              <button
                                onClick={() => {
                                  setSelectedRowForExecution(r);
                                  setExecTanggal(new Date().toISOString().split('T')[0]);
                                  setExecRealisasi(String(sisa));
                                  setExecIzin(String(izin));
                                  setExecPadam(String(padam));
                                  const textVal = r.luarTemuan !== '-' ? r.luarTemuan || '' : '';
                                  setExecNotes(textVal);
                                  setIsExecModalOpen(true);
                                }}
                                className="px-2 py-1 mr-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition-all shadow-xs cursor-pointer shrink-0"
                                title="Eksekusi Penebangan/Pemangkasan Pohon"
                              >
                                <Wrench className="w-3 h-3 text-emerald-700" />
                                <span>Eksekusi</span>
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setEditingId(r.id);
                                setRTanggalInspeksi(r.tanggalInspeksi || r.tanggalTemuan || '');
                                setRTanggal(r.tanggal || r.tanggalEksekusi || '');
                                setRPenyulang(r.penyulang || r.namaPenyulang || '');
                                setRSection(r.section || r.lokasi || '');
                                setRJumlahTemuan(r.jumlahTemuanInspeksi !== undefined && r.jumlahTemuanInspeksi !== '-' ? String(r.jumlahTemuanInspeksi) : r.jumlahPohon !== undefined ? String(r.jumlahPohon) : '');
                                setRRealisasiPangkas(r.realisasiPangkas !== undefined && r.realisasiPangkas !== '-' ? String(r.realisasiPangkas) : (r.status === 'Selesai' ? String(r.jumlahPohon) : ''));
                                setRPerluIzin(r.perluIzin !== undefined && r.perluIzin !== '-' ? String(r.perluIzin) : '');
                                setRPerluPadam(r.perluPadam !== undefined && r.perluPadam !== '-' ? String(r.perluPadam) : '');
                                setRPohonBesar(r.pohonBesar !== undefined && r.pohonBesar !== '-' ? String(r.pohonBesar) : '');
                                setRLuarTemuan(r.luarTemuan !== undefined && r.luarTemuan !== '-' ? r.luarTemuan : r.jenisPohon || '');
                                setRJumlahPersonil(r.jumlahPersonil !== undefined && r.jumlahPersonil !== '-' ? String(r.jumlahPersonil) : '');
                                setRBelumEksekusi(r.belumEksekusi !== undefined && r.belumEksekusi !== '-' ? String(r.belumEksekusi) : '');
                                setRJumlahSisaTemuan(r.jumlahSisaTemuan !== undefined && r.jumlahSisaTemuan !== '-' ? String(r.jumlahSisaTemuan) : '');
                                setIsModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                              title="Edit Data ROW"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                             <button
                               onClick={async () => {
                                 registerDeletedId(r.id);
                                 try {
                                   await deleteDoc(doc(db, 'pemeliharaan_row', r.id));
                                 } catch (error) {
                                   handleFirestoreError(error, OperationType.DELETE, 'pemeliharaan_row');
                                 }
                               }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Hapus Data ROW"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          </div>
        </div>
      )}

      {/* INSPEKSI TIER 1 VIEW */}
      {currentSubView === 'inspeksi_tier1' && (
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative max-w-sm w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari penyulang, section, temuan..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
              />
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center p-1 bg-slate-100 border border-slate-200 rounded-xl">
                <button
                  type="button"
                  onClick={() => setViewLayout('cards')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    viewLayout === 'cards'
                      ? 'bg-white text-blue-700 shadow-xs border border-slate-200/80'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Card Interaktif</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewLayout('table')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    viewLayout === 'table'
                      ? 'bg-white text-blue-700 shadow-xs border border-slate-200/80'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <List className="w-3.5 h-3.5" />
                  <span>Tabel Data</span>
                </button>
              </div>

              <span className="text-xs text-slate-500 font-bold hidden sm:inline">
                Total {filteredTier1Data.length} Records Tier 1
              </span>
            </div>
          </div>

          {isLoading ? (
            <TableSkeletonLoader columns={9} rows={6} headerTitle="Inspeksi Tier 1 (Visual)" />
          ) : viewLayout === 'cards' ? (
            <div className="space-y-3">
              {filteredTier1Data.length === 0 ? (
                <div className="p-12 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-slate-400 text-xs">
                  Tidak ada data Inspeksi Tier 1 yang sesuai dengan kriteria pencarian.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3.5">
                  {filteredTier1Data.map((item) => {
                    const isExpanded = expandedTier1Id === item.id;
                    const jmlPohon = item.jumlahTemuanPohon !== undefined && item.jumlahTemuanPohon !== '' ? item.jumlahTemuanPohon : '-';
                    const jmlKonstruksi = item.jumlahTemuanKonstruksi !== undefined && item.jumlahTemuanKonstruksi !== '' ? item.jumlahTemuanKonstruksi : '-';

                    return (
                      <motion.div
                        layout
                        key={item.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ layout: { duration: 0.28, type: 'spring', stiffness: 350, damping: 28 } }}
                        className={`border rounded-2xl transition-all shadow-xs overflow-hidden ${
                          isExpanded
                            ? 'border-blue-300 bg-white ring-2 ring-blue-500/10'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div
                          onClick={() => setExpandedTier1Id(isExpanded ? null : item.id)}
                          className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/70 transition-colors select-none"
                        >
                          <div className="flex items-start md:items-center gap-3.5">
                            <div className="p-2.5 rounded-xl shrink-0 bg-blue-50 text-blue-600 border border-blue-200">
                              <Eye className="w-5 h-5" />
                            </div>

                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-extrabold text-sm text-slate-900">{item.penyulang}</span>
                                <span className="text-xs font-bold text-slate-600">({item.section})</span>
                                <span className="px-2 py-0.5 rounded-md font-extrabold text-[9px] uppercase tracking-wider bg-blue-100 text-blue-800">
                                  Tier 1 Visual
                                </span>
                              </div>

                              <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                                <span className="flex items-center gap-1 font-mono text-[11px] text-blue-700">
                                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                  Tanggal: {item.tanggal}
                                </span>
                                <span className="text-slate-300">•</span>
                                <span className="text-slate-600">
                                  Temuan ROW: <strong className="text-emerald-700">{item.temuanRow || '-'}</strong> ({jmlPohon} pohon)
                                </span>
                                <span className="text-slate-300">•</span>
                                <span className="text-slate-600">
                                  Konstruksi: <strong className="text-amber-700">{item.konstruksi || '-'}</strong> ({jmlKonstruksi})
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between md:justify-end gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-bold text-blue-700 hidden sm:inline">
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
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-2 shadow-2xs">
                                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 uppercase tracking-wider border-b border-slate-100 pb-2">
                                      <Trees className="w-4 h-4 text-emerald-600" />
                                      <span>Temuan ROW</span>
                                    </div>
                                    <div className="space-y-1.5 text-slate-600">
                                      <div>
                                        <span className="text-[10px] text-slate-400 block font-bold uppercase">Deskripsi:</span>
                                        <span className="font-semibold text-slate-800">{item.temuanRow || '-'}</span>
                                      </div>
                                      <div className="flex justify-between pt-1 border-t border-slate-100">
                                        <span>Jumlah Pohon:</span>
                                        <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">{jmlPohon} Batang</span>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-2 shadow-2xs">
                                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-800 uppercase tracking-wider border-b border-slate-100 pb-2">
                                      <Wrench className="w-4 h-4 text-amber-600" />
                                      <span>Temuan Konstruksi</span>
                                    </div>
                                    <div className="space-y-1.5 text-slate-600">
                                      <div>
                                        <span className="text-[10px] text-slate-400 block font-bold uppercase">Deskripsi:</span>
                                        <span className="font-semibold text-slate-800">{item.konstruksi || '-'}</span>
                                      </div>
                                      <div className="flex justify-between pt-1 border-t border-slate-100">
                                        <span>Jumlah Item:</span>
                                        <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">{jmlKonstruksi} Titik</span>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-2 shadow-2xs">
                                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-800 uppercase tracking-wider border-b border-slate-100 pb-2">
                                      <Info className="w-4 h-4 text-indigo-600" />
                                      <span>Temuan Lainnya</span>
                                    </div>
                                    <div className="space-y-1.5 text-slate-600">
                                      <div>
                                        <span className="text-[10px] text-slate-400 block font-bold uppercase">Catatan Tambahan:</span>
                                        <span className="font-medium text-slate-800">{item.temuanLain !== undefined && item.temuanLain !== '-' ? item.temuanLain : 'Tidak ada temuan tambahan.'}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingId(item.id);
                                      setT1Tanggal(item.tanggal);
                                      setT1Penyulang(item.penyulang);
                                      setT1Section(item.section);
                                      setT1TemuanRow(item.temuanRow);
                                      setT1Konstruksi(item.konstruksi);
                                      setT1JumlahTemuanPohon(item.jumlahTemuanPohon !== undefined && item.jumlahTemuanPohon !== '-' ? String(item.jumlahTemuanPohon) : '');
                                      setT1JumlahTemuanKonstruksi(item.jumlahTemuanKonstruksi !== undefined && item.jumlahTemuanKonstruksi !== '-' ? String(item.jumlahTemuanKonstruksi) : '');
                                      setT1TemuanLain(item.temuanLain !== undefined && item.temuanLain !== '-' ? item.temuanLain : '');
                                      setIsModalOpen(true);
                                    }}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                                  >
                                    <Pencil className="w-3.5 h-3.5 text-blue-600" />
                                    <span>Edit Record</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={async () => {
                                      registerDeletedId(item.id);
                                      try {
                                        await deleteDoc(doc(db, 'pemeliharaan_tier1', item.id));
                                      } catch (error) {
                                        handleFirestoreError(error, OperationType.DELETE, 'pemeliharaan_tier1');
                                      }
                                    }}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                                    <span>Hapus</span>
                                  </button>
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
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs text-slate-800">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[11px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3.5">Tanggal</th>
                    <th className="px-4 py-3.5">Penyulang</th>
                    <th className="px-4 py-3.5">Section Jaringan</th>
                    <th className="px-4 py-3.5">Temuan ROW</th>
                    <th className="px-4 py-3.5 text-center">Jml Pohon</th>
                    <th className="px-4 py-3.5">Temuan Konstruksi</th>
                    <th className="px-4 py-3.5 text-center">Jml Konstruksi</th>
                    <th className="px-4 py-3.5">Temuan Lain</th>
                    <th className="px-4 py-3.5 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredTier1Data.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3.5 font-mono text-slate-600 text-[11px] whitespace-nowrap">{item.tanggal}</td>
                      <td className="px-4 py-3.5 font-bold text-blue-600">{item.penyulang}</td>
                      <td className="px-4 py-3.5 text-slate-800 font-semibold">{item.section}</td>
                      <td className="px-4 py-3.5 text-emerald-700 bg-emerald-50/50 rounded-lg">{item.temuanRow}</td>
                      <td className="px-4 py-3.5 text-center font-bold text-emerald-600">{item.jumlahTemuanPohon !== undefined && item.jumlahTemuanPohon !== '' ? item.jumlahTemuanPohon : '-'}</td>
                      <td className="px-4 py-3.5 text-slate-700">{item.konstruksi}</td>
                      <td className="px-4 py-3.5 text-center font-bold text-amber-600">{item.jumlahTemuanKonstruksi !== undefined && item.jumlahTemuanKonstruksi !== '' ? item.jumlahTemuanKonstruksi : '-'}</td>
                      <td className="px-4 py-3.5 text-slate-500 text-[11px]">{item.temuanLain !== undefined && item.temuanLain !== '-' ? item.temuanLain : '-'}</td>
                      <td className="px-4 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => {
                              setEditingId(item.id);
                              setT1Tanggal(item.tanggal);
                              setT1Penyulang(item.penyulang);
                              setT1Section(item.section);
                              setT1TemuanRow(item.temuanRow);
                              setT1Konstruksi(item.konstruksi);
                              setT1JumlahTemuanPohon(item.jumlahTemuanPohon !== undefined && item.jumlahTemuanPohon !== '-' ? String(item.jumlahTemuanPohon) : '');
                              setT1JumlahTemuanKonstruksi(item.jumlahTemuanKonstruksi !== undefined && item.jumlahTemuanKonstruksi !== '-' ? String(item.jumlahTemuanKonstruksi) : '');
                              setT1TemuanLain(item.temuanLain !== undefined && item.temuanLain !== '-' ? item.temuanLain : '');
                              setIsModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                            title="Edit Inspeksi Tier 1"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={async () => {
                              registerDeletedId(item.id);
                              try {
                                await deleteDoc(doc(db, 'pemeliharaan_tier1', item.id));
                              } catch (error) {
                                handleFirestoreError(error, OperationType.DELETE, 'pemeliharaan_tier1');
                              }
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Hapus Inspeksi Tier 1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* INSPEKSI TIER 2 VIEW */}
      {currentSubView === 'inspeksi_tier2' && (
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative max-w-sm w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari penyulang, section, temuan..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
              />
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center p-1 bg-slate-100 border border-slate-200 rounded-xl">
                <button
                  type="button"
                  onClick={() => setViewLayout('cards')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    viewLayout === 'cards'
                      ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/80'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Card Interaktif</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewLayout('table')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    viewLayout === 'table'
                      ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/80'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <List className="w-3.5 h-3.5" />
                  <span>Tabel Data</span>
                </button>
              </div>

              <span className="text-xs text-slate-500 font-bold hidden sm:inline">
                Total {filteredTier2Data.length} Records Tier 2
              </span>
            </div>
          </div>

          {isLoading ? (
            <TableSkeletonLoader columns={6} rows={6} headerTitle="Inspeksi Tier 2" />
          ) : viewLayout === 'cards' ? (
            <div className="space-y-3">
              {filteredTier2Data.length === 0 ? (
                <div className="p-12 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-slate-400 text-xs">
                  Tidak ada data Inspeksi Tier 2 yang sesuai dengan kriteria pencarian.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3.5">
                  {filteredTier2Data.map((item) => {
                    const isExpanded = expandedTier2Id === item.id;
                    const isThermo = item.jenisTier2 === 'Thermovision';

                    return (
                      <motion.div
                        layout
                        key={item.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ layout: { duration: 0.28, type: 'spring', stiffness: 350, damping: 28 } }}
                        className={`border rounded-2xl transition-all shadow-xs overflow-hidden ${
                          isExpanded
                            ? 'border-indigo-300 bg-white ring-2 ring-indigo-500/10'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div
                          onClick={() => setExpandedTier2Id(isExpanded ? null : item.id)}
                          className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/70 transition-colors select-none"
                        >
                          <div className="flex items-start md:items-center gap-3.5">
                            <div className={`p-2.5 rounded-xl shrink-0 border ${
                              isThermo
                                ? 'bg-amber-50 text-amber-600 border-amber-200'
                                : 'bg-purple-50 text-purple-600 border-purple-200'
                            }`}>
                              <Layers className="w-5 h-5" />
                            </div>

                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-extrabold text-sm text-slate-900">{item.penyulang}</span>
                                <span className="text-xs font-bold text-slate-600">({item.section})</span>
                                <span className={`px-2 py-0.5 rounded-md font-extrabold text-[9px] uppercase tracking-wider ${
                                  isThermo ? 'bg-amber-100 text-amber-800' : 'bg-purple-100 text-purple-800'
                                }`}>
                                  {item.jenisTier2}
                                </span>
                              </div>

                              <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                                <span className="flex items-center gap-1 font-mono text-[11px] text-indigo-700">
                                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                  Tanggal: {item.tanggal}
                                </span>
                                <span className="text-slate-300">•</span>
                                <span className="text-slate-600 truncate max-w-md">
                                  Temuan: <strong className="text-slate-900">{item.temuanThermoUltrasound || '-'}</strong>
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between md:justify-end gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-bold text-indigo-700 hidden sm:inline">
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
                                <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2 shadow-2xs">
                                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-800 uppercase tracking-wider border-b border-slate-100 pb-2">
                                    <Sparkles className="w-4 h-4 text-indigo-600" />
                                    <span>Detail Temuan {item.jenisTier2}</span>
                                  </div>
                                  <p className="text-slate-800 text-sm font-medium leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                                    {item.temuanThermoUltrasound || 'Tidak ada detail temuan yang dicatat.'}
                                  </p>
                                </div>

                                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingId(item.id);
                                      setT2Tanggal(item.tanggal);
                                      setT2Penyulang(item.penyulang);
                                      setT2Section(item.section);
                                      setT2Jenis(item.jenisTier2);
                                      setT2Temuan(item.temuanThermoUltrasound);
                                      setIsModalOpen(true);
                                    }}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                                  >
                                    <Pencil className="w-3.5 h-3.5 text-blue-600" />
                                    <span>Edit Record</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={async () => {
                                      registerDeletedId(item.id);
                                      try {
                                        await deleteDoc(doc(db, 'pemeliharaan_tier2', item.id));
                                      } catch (error) {
                                        handleFirestoreError(error, OperationType.DELETE, 'pemeliharaan_tier2');
                                      }
                                    }}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                                    <span>Hapus</span>
                                  </button>
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
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs text-slate-800">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[11px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3.5">Tanggal</th>
                    <th className="px-4 py-3.5">Penyulang</th>
                    <th className="px-4 py-3.5">Section Jaringan</th>
                    <th className="px-4 py-3.5 text-center">Jenis Tier 2</th>
                    <th className="px-4 py-3.5">Temuan Thermovision / Ultrasound</th>
                    <th className="px-4 py-3.5 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredTier2Data.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3.5 font-mono text-slate-600 text-[11px] whitespace-nowrap">{item.tanggal}</td>
                      <td className="px-4 py-3.5 font-bold text-indigo-600">{item.penyulang}</td>
                      <td className="px-4 py-3.5 text-slate-800 font-semibold">{item.section}</td>
                      <td className="px-4 py-3.5 text-center">
                        <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] ${
                          item.jenisTier2 === 'Thermovision' ? 'bg-amber-100 text-amber-800' : 'bg-purple-100 text-purple-800'
                        }`}>
                          {item.jenisTier2}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-700 font-medium">{item.temuanThermoUltrasound}</td>
                      <td className="px-4 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => {
                              setEditingId(item.id);
                              setT2Tanggal(item.tanggal);
                              setT2Penyulang(item.penyulang);
                              setT2Section(item.section);
                              setT2Jenis(item.jenisTier2);
                              setT2Temuan(item.temuanThermoUltrasound);
                              setIsModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                            title="Edit Inspeksi Tier 2"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={async () => {
                              registerDeletedId(item.id);
                              try {
                                await deleteDoc(doc(db, 'pemeliharaan_tier2', item.id));
                              } catch (error) {
                                handleFirestoreError(error, OperationType.DELETE, 'pemeliharaan_tier2');
                              }
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Hapus Inspeksi Tier 2"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MONITORING PEMELIHARAAN VIEW */}
      {currentSubView === 'pemeliharaan_20kv' && (
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative max-w-sm w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari penyulang, section, jenis pemeliharaan..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
              />
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center p-1 bg-slate-100 border border-slate-200 rounded-xl">
                <button
                  type="button"
                  onClick={() => setViewLayout('cards')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    viewLayout === 'cards'
                      ? 'bg-white text-cyan-700 shadow-xs border border-slate-200/80'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Card Interaktif</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewLayout('table')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    viewLayout === 'table'
                      ? 'bg-white text-cyan-700 shadow-xs border border-slate-200/80'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <List className="w-3.5 h-3.5" />
                  <span>Tabel Data</span>
                </button>
              </div>

              <span className="text-xs text-slate-500 font-bold hidden sm:inline">
                Total {filteredMonitoringData.length} Records Monitoring
              </span>
            </div>
          </div>

          {isLoading ? (
            <TableSkeletonLoader columns={6} rows={6} headerTitle="Monitoring Pemeliharaan 20 kV" />
          ) : viewLayout === 'cards' ? (
            <div className="space-y-3">
              {filteredMonitoringData.length === 0 ? (
                <div className="p-12 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-slate-400 text-xs">
                  Tidak ada data Monitoring Pemeliharaan yang sesuai dengan kriteria pencarian.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3.5">
                  {filteredMonitoringData.map((item) => {
                    const isExpanded = expandedMonitoringId === item.id;

                    return (
                      <motion.div
                        layout
                        key={item.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ layout: { duration: 0.28, type: 'spring', stiffness: 350, damping: 28 } }}
                        className={`border rounded-2xl transition-all shadow-xs overflow-hidden ${
                          isExpanded
                            ? 'border-cyan-300 bg-white ring-2 ring-cyan-500/10'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div
                          onClick={() => setExpandedMonitoringId(isExpanded ? null : item.id)}
                          className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/70 transition-colors select-none"
                        >
                          <div className="flex items-start md:items-center gap-3.5">
                            <div className="p-2.5 rounded-xl shrink-0 bg-cyan-50 text-cyan-600 border border-cyan-200">
                              <Activity className="w-5 h-5" />
                            </div>

                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-extrabold text-sm text-slate-900">{item.penyulang}</span>
                                <span className="text-xs font-bold text-slate-600">({item.section})</span>
                                <span className="px-2 py-0.5 rounded-md font-extrabold text-[9px] uppercase tracking-wider bg-cyan-100 text-cyan-800">
                                  20 kV Monitoring
                                </span>
                              </div>

                              <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                                <span className="flex items-center gap-1 font-mono text-[11px] text-cyan-700">
                                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                  Tanggal: {item.tanggal}
                                </span>
                                <span className="text-slate-300">•</span>
                                <div className="flex flex-wrap gap-1">
                                  {item.jenisPemeliharaan.map((j) => (
                                    <span key={j} className="px-2 py-0.5 rounded-md bg-cyan-50 border border-cyan-200 text-cyan-800 text-[10px] font-bold">
                                      {j}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between md:justify-end gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-bold text-cyan-700 hidden sm:inline">
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
                                <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2 shadow-2xs">
                                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-cyan-800 uppercase tracking-wider border-b border-slate-100 pb-2">
                                    <FileText className="w-4 h-4 text-cyan-600" />
                                    <span>Keterangan Pemeliharaan</span>
                                  </div>
                                  <p className="text-slate-800 text-sm font-medium leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                                    {item.keterangan || 'Tidak ada keterangan spesifik.'}
                                  </p>
                                </div>

                                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingId(item.id);
                                      setMTanggal(item.tanggal);
                                      setMPenyulang(item.penyulang);
                                      setMSection(item.section);
                                      setMJenisList(item.jenisPemeliharaan);
                                      setMKeterangan(item.keterangan);
                                      setIsModalOpen(true);
                                    }}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                                  >
                                    <Pencil className="w-3.5 h-3.5 text-blue-600" />
                                    <span>Edit Record</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={async () => {
                                      registerDeletedId(item.id);
                                      try {
                                        await deleteDoc(doc(db, 'pemeliharaan_monitoring', item.id));
                                      } catch (error) {
                                        handleFirestoreError(error, OperationType.DELETE, 'pemeliharaan_monitoring');
                                      }
                                    }}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                                    <span>Hapus</span>
                                  </button>
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
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs text-slate-800">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[11px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3.5">Tanggal</th>
                    <th className="px-4 py-3.5">Penyulang</th>
                    <th className="px-4 py-3.5">Section Jaringan</th>
                    <th className="px-4 py-3.5">Jenis Pemeliharaan</th>
                    <th className="px-4 py-3.5">Keterangan</th>
                    <th className="px-4 py-3.5 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredMonitoringData.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3.5 font-mono text-slate-600 text-[11px] whitespace-nowrap">{item.tanggal}</td>
                      <td className="px-4 py-3.5 font-bold text-cyan-600">{item.penyulang}</td>
                      <td className="px-4 py-3.5 text-slate-800 font-semibold">{item.section}</td>
                      <td className="px-4 py-3.5">
                        <div className="flex flex-wrap gap-1">
                          {item.jenisPemeliharaan.map((j) => (
                            <span key={j} className="px-2 py-0.5 rounded-md bg-cyan-50 border border-cyan-200 text-cyan-800 text-[10px] font-bold">
                              {j}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-slate-700">{item.keterangan}</td>
                      <td className="px-4 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => {
                              setEditingId(item.id);
                              setMTanggal(item.tanggal);
                              setMPenyulang(item.penyulang);
                              setMSection(item.section);
                              setMJenisList(item.jenisPemeliharaan);
                              setMKeterangan(item.keterangan);
                              setIsModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                            title="Edit Data Monitoring"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={async () => {
                              registerDeletedId(item.id);
                              try {
                                await deleteDoc(doc(db, 'pemeliharaan_monitoring', item.id));
                              } catch (error) {
                                handleFirestoreError(error, OperationType.DELETE, 'pemeliharaan_monitoring');
                              }
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Hapus Data Monitoring"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* DYNAMIC MODALS FOR ROW, TIER 1, TIER 2 & MONITORING PEMELIHARAAN */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md font-sans">
          <div className="relative w-full max-w-lg max-h-[90vh] bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl text-slate-800 flex flex-col my-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  {icon}
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    {currentSubView === 'row' && 'Input Temuan & Realisasi ROW Pohon'}
                    {currentSubView === 'inspeksi_tier1' && 'Input Inspeksi Tier 1'}
                    {currentSubView === 'inspeksi_tier2' && 'Input Inspeksi Tier 2'}
                    {currentSubView === 'pemeliharaan_20kv' && 'Input Monitoring Pemeliharaan'}
                  </h3>
                  <p className="text-[11px] text-slate-500">Perang Padam Baguala • System 20kV</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* FORM FOR ROW (All non-mandatory as explicitly requested!) */}
            {currentSubView === 'row' && (
              <form onSubmit={handleSaveROW} className="flex-1 overflow-y-auto py-4 space-y-3.5 text-xs pr-1">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Tanggal Inspeksi</label>
                    <input
                      type="date"
                      value={rTanggalInspeksi}
                      onChange={(e) => setRTanggalInspeksi(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Tanggal Eksekusi</label>
                    <input
                      type="date"
                      value={rTanggal}
                      onChange={(e) => setRTanggal(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500 font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Penyulang</label>
                    <input
                      type="text"
                      value={rPenyulang}
                      onChange={(e) => setRPenyulang(e.target.value)}
                      placeholder="e.g. TULEHU"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Section</label>
                    <input
                      type="text"
                      value={rSection}
                      onChange={(e) => setRSection(e.target.value)}
                      placeholder="e.g. GH Asten - Ujung Jaringan"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500 font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Jumlah Temuan Inspeksi</label>
                    <input
                      type="number"
                      value={rJumlahTemuan}
                      onChange={(e) => {
                        const val = e.target.value;
                        setRJumlahTemuan(val);
                        // Auto-calculate defaults for convenience
                        const calculatedSisa = Math.max(0, Number(val) - Number(rRealisasiPangkas));
                        setRBelumEksekusi(String(calculatedSisa));
                        setRJumlahSisaTemuan(String(calculatedSisa));
                      }}
                      placeholder="0"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Realisasi Eksekusi (Pangkas)</label>
                    <input
                      type="number"
                      value={rRealisasiPangkas}
                      onChange={(e) => {
                        const val = e.target.value;
                        setRRealisasiPangkas(val);
                        // Auto-calculate defaults for convenience
                        const calculatedSisa = Math.max(0, Number(rJumlahTemuan) - Number(val));
                        setRBelumEksekusi(String(calculatedSisa));
                        setRJumlahSisaTemuan(String(calculatedSisa));
                      }}
                      placeholder="0"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500 font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Jumlah Personil</label>
                    <input
                      type="number"
                      value={rJumlahPersonil}
                      onChange={(e) => setRJumlahPersonil(e.target.value)}
                      placeholder="0"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Belum Eksekusi</label>
                    <input
                      type="number"
                      value={rBelumEksekusi}
                      onChange={(e) => setRBelumEksekusi(e.target.value)}
                      placeholder="0"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Jumlah Sisa Temuan</label>
                    <input
                      type="number"
                      value={rJumlahSisaTemuan}
                      onChange={(e) => setRJumlahSisaTemuan(e.target.value)}
                      placeholder="0"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500 font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Perlu Izin</label>
                    <input
                      type="number"
                      value={rPerluIzin}
                      onChange={(e) => setRPerluIzin(e.target.value)}
                      placeholder="0"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Perlu Padam</label>
                    <input
                      type="number"
                      value={rPerluPadam}
                      onChange={(e) => setRPerluPadam(e.target.value)}
                      placeholder="0"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Pohon Besar</label>
                    <input
                      type="number"
                      value={rPohonBesar}
                      onChange={(e) => setRPohonBesar(e.target.value)}
                      placeholder="0"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Luar Temuan</label>
                  <textarea
                    rows={2}
                    value={rLuarTemuan}
                    onChange={(e) => setRLuarTemuan(e.target.value)}
                    placeholder="Catatan luar temuan..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500 font-medium"
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 shrink-0 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer shadow-sm shadow-emerald-500/20"
                  >
                    Simpan Data ROW
                  </button>
                </div>
              </form>
            )}

            {/* FORM FOR TIER 1 */}
            {currentSubView === 'inspeksi_tier1' && (
              <form onSubmit={handleSaveTier1} className="flex-1 overflow-y-auto py-4 space-y-4 text-xs pr-1">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tanggal Inspeksi</label>
                  <input
                    type="date"
                    value={t1Tanggal}
                    onChange={(e) => setT1Tanggal(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Penyulang</label>
                  <input
                    type="text"
                    value={t1Penyulang}
                    onChange={(e) => setT1Penyulang(e.target.value)}
                    placeholder="e.g. TULEHU / LATERI 2 / PASSO"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Section Jaringan</label>
                  <input
                    type="text"
                    value={t1Section}
                    onChange={(e) => setT1Section(e.target.value)}
                    placeholder="e.g. GH Asten - Ujung Jaringan"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500 font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Temuan ROW Pohon</label>
                    <textarea
                      rows={2}
                      value={t1TemuanRow}
                      onChange={(e) => setT1TemuanRow(e.target.value)}
                      placeholder="Masukkan detail temuan pohon..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Jumlah Temuan Pohon</label>
                    <input
                      type="number"
                      value={t1JumlahTemuanPohon}
                      onChange={(e) => setT1JumlahTemuanPohon(e.target.value)}
                      placeholder="0"
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500 font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Temuan Konstruksi SUTM</label>
                    <textarea
                      rows={2}
                      value={t1Konstruksi}
                      onChange={(e) => setT1Konstruksi(e.target.value)}
                      placeholder="Masukkan detail temuan konstruksi..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Jumlah Temuan Konstruksi</label>
                    <input
                      type="number"
                      value={t1JumlahTemuanKonstruksi}
                      onChange={(e) => setT1JumlahTemuanKonstruksi(e.target.value)}
                      placeholder="0"
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Temuan Lain</label>
                  <textarea
                    rows={2}
                    value={t1TemuanLain}
                    onChange={(e) => setT1TemuanLain(e.target.value)}
                    placeholder="Masukkan temuan lain di luar ROW & Konstruksi..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500 font-medium"
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 shrink-0 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer shadow-sm shadow-blue-500/20"
                  >
                    Simpan Data Tier 1
                  </button>
                </div>
              </form>
            )}

            {/* FORM FOR TIER 2 */}
            {currentSubView === 'inspeksi_tier2' && (
              <form onSubmit={handleSaveTier2} className="flex-1 overflow-y-auto py-4 space-y-4 text-xs pr-1">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tanggal Inspeksi</label>
                  <input
                    type="date"
                    value={t2Tanggal}
                    onChange={(e) => setT2Tanggal(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Penyulang</label>
                  <input
                    type="text"
                    value={t2Penyulang}
                    onChange={(e) => setT2Penyulang(e.target.value)}
                    placeholder="e.g. PASSO / WAIHERU 1"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Section Jaringan</label>
                  <input
                    type="text"
                    value={t2Section}
                    onChange={(e) => setT2Section(e.target.value)}
                    placeholder="e.g. LBS Air Besar Passo"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jenis Tier 2</label>
                  <select
                    value={t2Jenis}
                    onChange={(e) => setT2Jenis(e.target.value as 'Thermovision' | 'Ultrasound')}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500 font-medium cursor-pointer"
                  >
                    <option value="Thermovision" className="bg-white">Thermovision (Hotspot Testing)</option>
                    <option value="Ultrasound" className="bg-white">Ultrasound (Corona & Discharge Testing)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Temuan Thermovision / Ultrasound</label>
                  <textarea
                    rows={3}
                    value={t2Temuan}
                    onChange={(e) => setT2Temuan(e.target.value)}
                    placeholder="Masukkan detail temuan suhu hotspot (°C) atau decibel discharge (dB)..."
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500 font-medium"
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 shrink-0 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs cursor-pointer shadow-sm shadow-indigo-500/20"
                  >
                    Simpan Data Tier 2
                  </button>
                </div>
              </form>
            )}

            {/* FORM FOR MONITORING PEMELIHARAAN */}
            {currentSubView === 'pemeliharaan_20kv' && (
              <form onSubmit={handleSaveMonitoring} className="flex-1 overflow-y-auto py-4 space-y-4 text-xs pr-1">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tanggal Pemeliharaan</label>
                  <input
                    type="date"
                    value={mTanggal}
                    onChange={(e) => setMTanggal(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Penyulang</label>
                  <input
                    type="text"
                    value={mPenyulang}
                    onChange={(e) => setMPenyulang(e.target.value)}
                    placeholder="e.g. BAGUALA UTAMA"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Section Jaringan</label>
                  <input
                    type="text"
                    value={mSection}
                    onChange={(e) => setMSection(e.target.value)}
                    placeholder="e.g. GIS Passo - IC Waiheru 2"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    Jenis Pemeliharaan (Pilih Satu atau Lebih)
                  </label>
                  <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                    {JENIS_PEMELIHARAAN_OPTIONS.map((opt) => (
                      <label key={opt} className="flex items-center gap-2 cursor-pointer text-slate-800 font-medium hover:text-blue-600 transition-colors">
                        <input
                          type="checkbox"
                          checked={mJenisList.includes(opt)}
                          onChange={() => toggleJenisPemeliharaan(opt)}
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 accent-blue-600 cursor-pointer"
                        />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Keterangan Pemeliharaan</label>
                  <textarea
                    rows={3}
                    value={mKeterangan}
                    onChange={(e) => setMKeterangan(e.target.value)}
                    placeholder="Masukkan keterangan detail tindakan pemeliharaan..."
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500 font-medium"
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 shrink-0 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs cursor-pointer shadow-sm shadow-cyan-500/20"
                  >
                    Simpan Monitoring
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* EKSEKUSI ROW MODAL */}
      {isExecModalOpen && selectedRowForExecution && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md font-sans">
          <div className="relative w-full max-w-lg max-h-[90vh] bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl text-slate-800 flex flex-col my-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Eksekusi Pemotongan / Pemangkasan ROW
                  </h3>
                  <p className="text-[11px] text-slate-500">Penyulang: {selectedRowForExecution.penyulang || selectedRowForExecution.namaPenyulang || '-'}</p>
                </div>
              </div>
              <button
                onClick={() => setIsExecModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExecuteROWSubmit} className="flex-1 overflow-y-auto py-4 space-y-4 text-xs pr-1">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-150 space-y-2">
                <div className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Detail Temuan Inspeksi</div>
                <div className="grid grid-cols-2 gap-2 text-slate-700">
                  <div><strong>Lokasi/Section:</strong> {selectedRowForExecution.section || selectedRowForExecution.lokasi || '-'}</div>
                  <div><strong>Tanggal Temuan:</strong> {selectedRowForExecution.tanggalInspeksi || selectedRowForExecution.tanggalTemuan || '-'}</div>
                  <div><strong>Jumlah Temuan:</strong> {Number(selectedRowForExecution.jumlahTemuanInspeksi) || Number(selectedRowForExecution.jumlahPohon) || 0} Pohon</div>
                  <div><strong>Jenis/Keterangan:</strong> {selectedRowForExecution.luarTemuan !== '-' ? selectedRowForExecution.luarTemuan : selectedRowForExecution.jenisPohon || '-'}</div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tanggal Eksekusi (Realisasi)</label>
                <input
                  type="date"
                  value={execTanggal}
                  onChange={(e) => setExecTanggal(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-emerald-500 font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jumlah Realisasi Pangkas</label>
                  <input
                    type="number"
                    value={execRealisasi}
                    onChange={(e) => setExecRealisasi(e.target.value)}
                    placeholder="e.g. 2"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-emerald-500 font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Perlu Izin (Pohon)</label>
                  <input
                    type="number"
                    value={execIzin}
                    onChange={(e) => setExecIzin(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-emerald-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Perlu Padam (Pohon)</label>
                  <input
                    type="number"
                    value={execPadam}
                    onChange={(e) => setExecPadam(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-emerald-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Catatan Pelaksanaan / Eksekusi</label>
                <textarea
                  rows={2}
                  value={execNotes}
                  onChange={(e) => setExecNotes(e.target.value)}
                  placeholder="e.g. Berhasil dipangkas bersama tim yantek, tuntas..."
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-emerald-500 font-medium"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 shrink-0 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsExecModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer shadow-sm shadow-emerald-500/20"
                >
                  Simpan Realisasi Eksekusi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
