import React, { useState } from 'react';
import { 
  ClipboardCheck, 
  Search, 
  Plus, 
  FileText, 
  Download, 
  Trash2, 
  Pencil, 
  ChevronDown, 
  ChevronUp,
  MapPin,
  Calendar,
  User as UserIcon,
  Zap,
  ShieldCheck,
  Trees,
  Wrench,
  Factory,
  ZapOff,
  Printer,
  Building2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User, InspeksiTier1GTT, Penyulang, SectionJaringan, MasterGardu, MasterUnitPLN } from '../../types';
import { DAFTAR_UNIT_PLN } from '../../utils/unitConfig';
import { db, doc, setDoc, deleteDoc, handleFirestoreError, OperationType, registerDeletedId } from '../../lib/firebase';
import { sanitizeForFirestore } from '../../utils/firestoreHelper';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { TableSkeletonLoader } from '../common/TableSkeletonLoader';

interface InspeksiTier1GTTViewProps {
  currentUser: User | null;
  tier1GttList: InspeksiTier1GTT[];
  penyulangList: Penyulang[];
  sectionList: SectionJaringan[];
  masterGarduList: MasterGardu[];
  masterUnitList?: MasterUnitPLN[];
  isLoading?: boolean;
}

const INITIAL_FORM_STATE: Omit<InspeksiTier1GTT, 'id'> = {
  tglPelaksanaan: new Date().toISOString().split('T')[0],
  giPembangkit: '',
  section: '',
  tipeGardu: 'Portal',
  pelaksana: '',
  area: 'AMBON',
  penyulang: '',
  noGtt: '',
  alamat: '',
  ulp: 'ULP BAGUALA',
  koordinatX: '',
  koordinatY: '',

  // TIANG GTT
  konstruksiTiang: '2 Tiang',
  tinggiTiang: '12',
  pondasi: 'Baik',
  jenisTiang: 'Beton',
  kondisiTiang: [],

  // PENGAMAN TM
  konektorJumperJtm: 'Baik',
  konektorJumperFco: 'Baik',
  jumperanJtmCo: 'Baik',
  dudukanFco: 'Baik',
  konektorFcoBushing: 'Baik',
  jumperanJtmCo2: 'Baik',
  statusPhaseR: 'Normal',
  statusPhaseS: 'Normal',
  statusPhaseT: 'Normal',
  posisiLaThdFco: 'Sebelum FCO',
  koneksiLaTanah: 'Baik',

  // DATA GTT
  jumlahTrafo: '1',
  noSeri: '',
  merk: '',
  daya: '',
  tahunBuat: '',
  teganganPrimer: '20000',
  teganganSekunder: '400',
  arusPrimer: '',
  arusSekunder: '',
  impedansi: '',
  beratTrafo: '',
  teganganTap: '',
  hubBelitan: 'Dyn-5',
  statusTrafo: 'Operasi',
  volumeMinyak: '',
  kwhMeter: 'Ada',

  // DATA INSPEKSI GTT
  bodyTrafo: 'Baik',
  suaraTrafo: 'Normal',
  bushingPrimer: 'Baik',
  bushingSekunder: 'Baik',
  platCopperBushing: 'Baik',
  groundingNetral: 'Baik',
  dudukanTrafo: 'Baik',
  lingkunganGardu: 'Bersih',

  // LV PANEL
  bodyLvPanel: 'Baik',
  kebersihanLvPanel: 'Bersih',
  kondisiCat: 'Baik',
  kunciLvPanel: 'Ada',
  relBusBar: 'Baik',

  kondisiTemuanLain: ''
};

export const InspeksiTier1GTTView: React.FC<InspeksiTier1GTTViewProps> = ({
  currentUser,
  tier1GttList,
  penyulangList,
  sectionList,
  masterGarduList,
  masterUnitList = [],
  isLoading = false
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<InspeksiTier1GTT, 'id'>>(INITIAL_FORM_STATE);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUlpFilter, setSelectedUlpFilter] = useState('all');
  const [selectedPenyulangFilter, setSelectedPenyulangFilter] = useState('all');
  const [selectedYear, setSelectedYear] = useState('2026');
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [activeSection, setActiveSection] = useState<string | null>('header');

  const ulpOptions = React.useMemo(() => {
    const unitsMap = new Map<string, string>();
    DAFTAR_UNIT_PLN.forEach((u) => {
      if (u.tipe === 'ULP' || !u.tipe) {
        unitsMap.set(u.namaUnit, u.kodeUnit);
      }
    });
    if (masterUnitList) {
      masterUnitList.forEach((m) => {
        if (m.ulp) unitsMap.set(m.ulp, m.kodeUlp || '');
      });
    }
    return Array.from(unitsMap.keys());
  }, [masterUnitList]);

  const filteredList = tier1GttList.filter(item => {
    const matchesSearch = item.penyulang.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.noGtt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.alamat.toLowerCase().includes(searchQuery.toLowerCase());
    
    const parts = (item.tglPelaksanaan || '').split('-');
    const matchesYear = parts[0] === selectedYear;
    const matchesMonth = selectedMonth === 'all' || parts[1] === selectedMonth;
    const matchesPenyulang = selectedPenyulangFilter === 'all' || 
      item.penyulang.toLowerCase() === selectedPenyulangFilter.toLowerCase();

    const matchesUlp = selectedUlpFilter === 'all' || (() => {
      const target = selectedUlpFilter.toLowerCase().replace(/^ulp\s+/i, '').trim();
      const rawTarget = selectedUlpFilter.toLowerCase().trim();

      const itemUlp = (item.ulp || (item as any).unit || '').toLowerCase().trim();
      const itemUlpClean = itemUlp.replace(/^ulp\s+/i, '').trim();
      if (itemUlp && (itemUlp === rawTarget || itemUlpClean === target || itemUlp.includes(target) || target.includes(itemUlpClean))) return true;

      const pMatch = penyulangList.find(p => p.nama.toLowerCase().trim() === item.penyulang.toLowerCase().trim());
      if (pMatch) {
        const pUlp = (pMatch.ulp || pMatch.unit || '').toLowerCase().trim();
        const pClean = pUlp.replace(/^ulp\s+/i, '').trim();
        if (pUlp && (pUlp === rawTarget || pClean === target || pUlp.includes(target) || target.includes(pClean))) return true;
        if (pMatch.kodeUlp && (pMatch.kodeUlp === selectedUlpFilter || pMatch.kodeUlp === target)) return true;
      }
      return false;
    })();

    return matchesSearch && matchesYear && matchesMonth && matchesPenyulang && matchesUlp;
  });

  const handleInputChange = (field: keyof Omit<InspeksiTier1GTT, 'id'>, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleGarduSelect = (noGardu: string) => {
    const gardu = masterGarduList.find(g => g.noGarduBaru === noGardu || g.noGarduLama === noGardu);
    if (gardu) {
      setFormData(prev => ({
        ...prev,
        noGtt: gardu.noGarduBaru,
        penyulang: gardu.penyulang,
        alamat: gardu.lokasi,
        daya: gardu.kapasitas,
        merk: gardu.merk,
        noSeri: gardu.noSeri,
        tahunBuat: gardu.thnBuat
      }));
    } else {
      handleInputChange('noGtt', noGardu);
    }
  };

  const handleToggleKondisiTiang = (val: string) => {
    setFormData(prev => {
      const current = prev.kondisiTiang || [];
      if (current.includes(val)) {
        return { ...prev, kondisiTiang: current.filter(item => item !== val) };
      } else {
        return { ...prev, kondisiTiang: [...current, val] };
      }
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = editingId || `gtt_${Date.now()}`;
    const newItem: InspeksiTier1GTT = { id, ...formData };

    try {
      await setDoc(doc(db, 'inspeksi_tier1_gtt', id), sanitizeForFirestore(newItem));
      setIsModalOpen(false);
      setEditingId(null);
      setFormData(INITIAL_FORM_STATE);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'inspeksi_tier1_gtt');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Hapus data inspeksi GTT ini?')) return;
    registerDeletedId(id);
    try {
      await deleteDoc(doc(db, 'inspeksi_tier1_gtt', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'inspeksi_tier1_gtt');
    }
  };

  const handleEdit = (item: InspeksiTier1GTT) => {
    setEditingId(item.id);
    const { id, ...rest } = item;
    setFormData(rest);
    setIsModalOpen(true);
  };

  const exportToPDF = (item: InspeksiTier1GTT) => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('TIER 1 - CHECK LIST INSPEKSI GTT', 105, 15, { align: 'center' });
    
    doc.setFontSize(10);
    const headerData = [
      ['Tgl Pelaksanaan', item.tglPelaksanaan, 'No GTT', item.noGtt, 'Tipe Gardu', item.tipeGardu],
      ['Penyulang', item.penyulang, 'Section', item.section, 'Alamat', item.alamat],
      ['Pelaksana', item.pelaksana, 'Koordinat', `${item.koordinatX}, ${item.koordinatY}`, 'ULP', item.ulp]
    ];

    autoTable(doc, {
      body: headerData,
      startY: 25,
      theme: 'grid',
      styles: { fontSize: 8 }
    });

    const sections = [
      { title: 'TIANG GTT', data: [
        ['Konstruksi', item.konstruksiTiang, 'Tinggi Tiang', item.tinggiTiang],
        ['Jenis Tiang', item.jenisTiang, 'Pondasi', item.pondasi],
        ['Kondisi Tiang', item.kondisiTiang?.join(', ') || '-', '', '']
      ]},
      { title: 'PENGAMAN TM', data: [
        ['Jumper JTM-FCO', item.konektorJumperJtm, 'Jumper FCO-Bushing', item.konektorFcoBushing],
        ['Dudukan FCO', item.dudukanFco, 'Posisi LA', item.posisiLaThdFco],
        ['Phase R', item.statusPhaseR, 'Phase S', item.statusPhaseS],
        ['Phase T', item.statusPhaseT, 'Grounding LA', item.koneksiLaTanah]
      ]},
      { title: 'DATA TRANSFORMATOR', data: [
        ['Merk', item.merk, 'No Seri', item.noSeri],
        ['Daya (kVA)', item.daya, 'Tahun Buat', item.tahunBuat],
        ['V Primer', item.teganganPrimer, 'V Sekunder', item.teganganSekunder],
        ['Status', item.statusTrafo, 'KWH Meter', item.kwhMeter]
      ]},
      { title: 'INSPEKSI VISUAL GTT', data: [
        ['Body Trafo', item.bodyTrafo, 'Suara Trafo', item.suaraTrafo],
        ['Bushing P', item.bushingPrimer, 'Bushing S', item.bushingSekunder],
        ['Lingkungan', item.lingkunganGardu, 'Dudukan Trafo', item.dudukanTrafo]
      ]},
      { title: 'LV PANEL', data: [
        ['Body Panel', item.bodyLvPanel, 'Kebersihan', item.kebersihanLvPanel],
        ['Kondisi Cat', item.kondisiCat, 'Kunci Panel', item.kunciLvPanel],
        ['Busbar', item.relBusBar, '', '']
      ]}
    ];

    let currentY = (doc as any).lastAutoTable.finalY + 10;

    sections.forEach(sec => {
      doc.setFontSize(11);
      doc.text(sec.title, 14, currentY);
      autoTable(doc, {
        body: sec.data,
        startY: currentY + 2,
        theme: 'grid',
        styles: { fontSize: 8 },
        margin: { top: 10 }
      });
      currentY = (doc as any).lastAutoTable.finalY + 10;
    });

    doc.save(`Checklist_GTT_${item.noGtt}_${item.penyulang}.pdf`);
  };

  const exportTableToPDF = () => {
    const doc = new jsPDF('l', 'mm', 'a4');
    doc.setFontSize(16);
    doc.text('LAPORAN RINGKASAN INSPEKSI GTT (TIER 1)', 148, 15, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, 14, 22);
    doc.text(`Total Data: ${filteredList.length}`, 14, 27);

    const tableData = filteredList.map(item => [
      item.tglPelaksanaan,
      item.penyulang,
      item.noGtt,
      item.alamat,
      item.daya,
      item.merk,
      item.pelaksana,
      item.suaraTrafo
    ]);

    autoTable(doc, {
      head: [['Tanggal', 'Penyulang', 'No GTT', 'Alamat', 'Daya', 'Merk', 'Pelaksana', 'Suara']],
      body: tableData,
      startY: 35,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [245, 158, 11] }
    });

    doc.save(`Laporan_Inspeksi_GTT_${new Date().getTime()}.pdf`);
  };

  return (
    <div className="p-4 md:p-6 space-y-6 bg-slate-50 min-h-screen font-sans">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl border border-amber-100">
            <Factory className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">TIER 1 - CHECKLIST INSPEKSI GTT</h1>
            <p className="text-sm text-slate-500 font-medium">Manajemen inspeksi visual Gardu Tiang Transformator (GTT)</p>
          </div>
        </div>
        <div className="flex flex-col md:flex-row gap-2">
          <button
            onClick={exportTableToPDF}
            disabled={filteredList.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-sm font-bold transition-all shadow-sm active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Laporan</span>
          </button>
          <button
            onClick={() => {
              setEditingId(null);
              setFormData(INITIAL_FORM_STATE);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-600/20 active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Checklist Baru</span>
          </button>
        </div>
      </div>

      {/* Main List Table */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari berdasarkan penyulang, No GTT, atau alamat..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap md:flex-nowrap">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold">
              <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="text-slate-500 font-bold">ULP:</span>
              <select
                value={selectedUlpFilter}
                onChange={(e) => setSelectedUlpFilter(e.target.value)}
                className="bg-transparent text-slate-800 font-bold focus:outline-none cursor-pointer max-w-[160px] truncate"
              >
                <option value="all">Semua ULP</option>
                {ulpOptions.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold">
              <span className="text-slate-500 font-bold">Penyulang:</span>
              <select
                value={selectedPenyulangFilter}
                onChange={(e) => setSelectedPenyulangFilter(e.target.value)}
                className="bg-transparent text-slate-800 font-bold focus:outline-none cursor-pointer max-w-[150px] truncate"
              >
                <option value="all">Semua Penyulang</option>
                {penyulangList.map((p) => (
                  <option key={p.id} value={p.nama || p.namaPenyulang}>
                    {p.nama || p.namaPenyulang}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold">
              <span className="text-slate-500 font-bold">Bulan:</span>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent text-slate-800 font-bold focus:outline-none cursor-pointer"
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

            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold">
              <span className="text-slate-500">Tahun:</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="bg-transparent text-slate-800 font-bold focus:outline-none cursor-pointer"
              >
                <option value="2026">2026</option>
                <option value="2025">2025</option>
              </select>
            </div>
          </div>
        </div>

        {isLoading ? (
          <TableSkeletonLoader columns={6} rows={7} headerTitle="Checklist Inspeksi Gardu Trafo Tiang (GTT)" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                <th className="px-6 py-4">Tanggal</th>
                <th className="px-6 py-4">Penyulang / No GTT</th>
                <th className="px-6 py-4">Alamat</th>
                <th className="px-6 py-4">Trafo (Daya/Merk)</th>
                <th className="px-6 py-4">Pelaksana</th>
                <th className="px-6 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredList.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold text-slate-900">{item.tglPelaksanaan}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-extrabold text-blue-600">{item.penyulang}</div>
                    <div className="text-xs font-semibold text-slate-500">GTT No: {item.noGtt}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-slate-700 font-medium truncate max-w-[200px]">{item.alamat}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold text-slate-900">{item.daya} kVA</div>
                    <div className="text-xs text-slate-500">{item.merk}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">
                        {item.pelaksana ? item.pelaksana.substring(0, 2).toUpperCase() : 'US'}
                      </div>
                      <span className="text-xs font-semibold text-slate-600">{item.pelaksana}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => exportToPDF(item)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        title="Export PDF"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleEdit(item)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        title="Edit Data"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(item.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                        title="Hapus Data"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredList.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-medium">
                    Belum ada data checklist inspeksi GTT.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        )}
      </div>

      {/* Modal Form */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[32px] shadow-2xl overflow-hidden flex flex-col border border-slate-200"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-600/20">
                    <Factory className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900 uppercase">
                      {editingId ? 'Edit Checklist Inspeksi GTT' : 'Checklist Inspeksi GTT Baru'}
                    </h2>
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Lengkapi detail inspeksi Gardu di bawah ini</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
                >
                  <Plus className="w-6 h-6 rotate-45" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-8 scroll-smooth">
                
                {/* Form Sections Navigation */}
                <div className="flex flex-wrap gap-2 sticky top-0 bg-white/80 backdrop-blur-md pb-4 z-10">
                  {[
                    { id: 'header', label: 'Umum', icon: <FileText className="w-3.5 h-3.5" /> },
                    { id: 'tiang', label: 'Tiang GTT', icon: <Zap className="w-3.5 h-3.5" /> },
                    { id: 'pengaman', label: 'Pengaman TM', icon: <ShieldCheck className="w-3.5 h-3.5" /> },
                    { id: 'trafo', label: 'Data Trafo', icon: <ZapOff className="w-3.5 h-3.5" /> },
                    { id: 'visual', label: 'Inspeksi Visual', icon: <ClipboardCheck className="w-3.5 h-3.5" /> },
                    { id: 'lvpanel', label: 'LV Panel', icon: <Wrench className="w-3.5 h-3.5" /> }
                  ].map(sec => (
                    <button
                      key={sec.id}
                      onClick={() => {
                        setActiveSection(sec.id);
                        document.getElementById(`sec-${sec.id}`)?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border ${
                        activeSection === sec.id 
                          ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-600/20' 
                          : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      {sec.icon}
                      <span>{sec.label}</span>
                    </button>
                  ))}
                </div>

                <form onSubmit={handleSave} className="space-y-12 pb-12">
                  
                  {/* SECTION: HEADER / UMUM */}
                  <div id="sec-header" className="space-y-6 pt-4">
                    <div className="flex items-center gap-3 border-l-4 border-blue-500 pl-4 py-1">
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Informasi Umum</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tgl Pelaksanaan</label>
                        <input 
                          type="date" 
                          required
                          value={formData.tglPelaksanaan}
                          onChange={(e) => handleInputChange('tglPelaksanaan', e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none" 
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Pilih No GTT (Master)</label>
                        <select 
                          value={formData.noGtt}
                          onChange={(e) => handleGarduSelect(e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none"
                        >
                          <option value="">-- Pilih Gardu --</option>
                          {masterGarduList.map(g => (
                            <option key={g.id} value={g.noGarduBaru}>{g.noGarduBaru} - {g.lokasi}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">No GTT (Manual)</label>
                        <input 
                          type="text" 
                          value={formData.noGtt}
                          onChange={(e) => handleInputChange('noGtt', e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none" 
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Penyulang</label>
                        <input 
                          type="text" 
                          readOnly
                          value={formData.penyulang}
                          className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-2xl text-sm font-bold text-slate-500" 
                        />
                      </div>
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Alamat / Lokasi</label>
                        <input 
                          type="text" 
                          value={formData.alamat}
                          onChange={(e) => handleInputChange('alamat', e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none" 
                        />
                      </div>
                    </div>
                  </div>

                  {/* SECTION: TIANG GTT */}
                  <div id="sec-tiang" className="space-y-6 pt-4">
                    <div className="flex items-center gap-3 border-l-4 border-emerald-500 pl-4 py-1">
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Bagian 1: TIANG GTT</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Konstruksi Tiang</label>
                        <div className="flex gap-2">
                          {['1 Tiang', '2 Tiang'].map(val => (
                            <button
                              key={val}
                              type="button"
                              onClick={() => handleInputChange('konstruksiTiang', val)}
                              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border ${
                                formData.konstruksiTiang === val 
                                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-md' 
                                  : 'bg-white border-slate-200 text-slate-600'
                              }`}
                            >
                              {val}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tinggi Tiang</label>
                        <select 
                          value={formData.tinggiTiang}
                          onChange={(e) => handleInputChange('tinggiTiang', e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none"
                        >
                          {['9', '11', '12', '13', '14'].map(v => <option key={v} value={v}>{v} m</option>)}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Jenis Tiang</label>
                        <select 
                          value={formData.jenisTiang}
                          onChange={(e) => handleInputChange('jenisTiang', e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none"
                        >
                          {['Beton', 'Besi', 'Kayu'].map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* SECTION: PENGAMAN TM */}
                  <div id="sec-pengaman" className="space-y-6 pt-4">
                    <div className="flex items-center gap-3 border-l-4 border-amber-500 pl-4 py-1">
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Bagian 2: PENGAMAN TM</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {[
                        { id: 'konektorJumperJtm', label: 'Konektor Jumper JTM', options: ['Baik', 'Kotor', 'Berkarat'] },
                        { id: 'dudukanFco', label: 'Dudukan FCO', options: ['Baik', 'Kotor', 'Berkarat', 'Retak'] },
                        { id: 'posisiLaThdFco', label: 'Posisi LA thd FCO', options: ['Sebelum FCO', 'Sesudah FCO'] },
                        { id: 'koneksiLaTanah', label: 'Koneksi LA ke Tanah', options: ['Baik', 'Putus', 'Tdk Ada'] },
                        { id: 'statusPhaseR', label: 'Kondisi FCO Phase R', options: ['Normal', 'Putus', 'Tdk Ada'] },
                        { id: 'statusPhaseS', label: 'Kondisi FCO Phase S', options: ['Normal', 'Putus', 'Tdk Ada'] },
                        { id: 'statusPhaseT', label: 'Kondisi FCO Phase T', options: ['Normal', 'Putus', 'Tdk Ada'] }
                      ].map(field => (
                        <div key={field.id} className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{field.label}</label>
                          <select 
                            value={(formData as any)[field.id]}
                            onChange={(e) => handleInputChange(field.id as any, e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                          >
                            {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* SECTION: DATA TRAFO */}
                  <div id="sec-trafo" className="space-y-6 pt-4">
                    <div className="flex items-center gap-3 border-l-4 border-rose-500 pl-4 py-1">
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Bagian 3: DATA TRANSFORMATOR</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Merk Trafo</label>
                        <input type="text" value={formData.merk} onChange={(e) => handleInputChange('merk', e.target.value)} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">No Seri</label>
                        <input type="text" value={formData.noSeri} onChange={(e) => handleInputChange('noSeri', e.target.value)} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Daya (kVA)</label>
                        <input type="text" value={formData.daya} onChange={(e) => handleInputChange('daya', e.target.value)} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tahun Buat</label>
                        <input type="text" value={formData.tahunBuat} onChange={(e) => handleInputChange('tahunBuat', e.target.value)} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold" />
                      </div>
                    </div>
                  </div>

                  {/* Bottom Actions */}
                  <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-6 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-200 transition-all cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-10 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all cursor-pointer"
                    >
                      Simpan Laporan
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
