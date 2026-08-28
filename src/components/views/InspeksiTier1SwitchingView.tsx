import React, { useState } from 'react';
import { 
  ClipboardCheck, 
  Search, 
  Plus, 
  FileText, 
  Download, 
  Trash2, 
  Pencil, 
  MapPin,
  GitGraph,
  Zap,
  ShieldCheck,
  Wrench,
  ZapOff,
  Settings,
  Printer,
  Building2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User, InspeksiTier1Switching, Penyulang, SectionJaringan, MasterUnitPLN } from '../../types';
import { DAFTAR_UNIT_PLN } from '../../utils/unitConfig';
import { db, doc, setDoc, deleteDoc, handleFirestoreError, OperationType, registerDeletedId } from '../../lib/firebase';
import { sanitizeForFirestore } from '../../utils/firestoreHelper';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface InspeksiTier1SwitchingViewProps {
  currentUser: User | null;
  tier1SwitchingList: InspeksiTier1Switching[];
  penyulangList: Penyulang[];
  sectionList: SectionJaringan[];
  masterUnitList?: MasterUnitPLN[];
}

const INITIAL_FORM_STATE: Omit<InspeksiTier1Switching, 'id'> = {
  tglPelaksanaan: new Date().toISOString().split('T')[0],
  giPembangkit: '',
  noTiang: '',
  area: 'AMBON',
  penyulang: '',
  konstruksi: '',
  ulp: 'ULP BAGUALA',
  section: '',
  pelaksana: '',
  namaSwitching: '',
  alamat: '',
  koordinatX: '',
  koordinatY: '',

  // TIANG JTM
  tinggiTiang: '12',
  kekuatanTiang: '200',
  jenisTiang: 'Beton',
  kepemilikan: 'PLN',
  kondisiTiang: ['Baik'],

  // PMCB
  merkPmcb: '',
  thnBuatPmcb: '',
  tglPasangPmcb: '',
  tglOperasiPmcb: '',
  lokasiPmcb: 'SUTM',
  ratedCurrentPmcb: '',
  ratedVoltagePmcb: '24',
  normalOperasiPmcb: 'NO',
  kondisiPmcb: 'Baik',
  kotakPmcb: 'Baik',
  panelControlPmcb: 'Baik',
  isolatorPmcb: 'Baik',
  lbsManualPmcb: 'Ada',
  dsOutdoorPmcb: '1 Set',
  kondisiDsOutdoorPmcb: 'Baik',
  groundingPmcb: 'Baik',
  namePlatePmcb: 'Baik',
  fungsiRemotePmcb: 'Ada',
  supply220Pmcb: 'Baik',
  bateraiPmcb: 'Baik',

  // RECLOSER/ LBS MOTORIZE/ LBS MANUAL
  merkRec: '',
  thnBuatRec: '',
  tglPasangRec: '',
  tglOperasiRec: '',
  noSeriRec: '',
  tipeRec: 'Two Way',
  ratedCurrentRec: '',
  ratedVoltageRec: '24',
  breakingCurrentRec: '',
  peredamBusurApiRec: 'SF6',
  teganganMotorRec: 'AC',
  lokasiRec: 'SUTM',
  normalOperasiRec: 'NO',
  kondisiRec: 'Baik',
  kondisiGasSf6Rec: 'Baik',
  cvtBushingRec: 'Ada',
  tutupBushingRec: 'Ada',
  isolatorRec: 'Baik',
  lbsManualRec: 'Ada',
  dsOutdoorRec: '1 Set',
  kondisiDsOutdoorRec: 'Baik',
  groundingRec: 'Baik',
  namePlateRec: 'Baik',
  panelControlRec: 'Baik',
  fungsiRemoteRec: 'Ada',
  supply220Rec: 'Baik',
  bateraiRec: 'Baik',

  kondisiTemuanLain: ''
};

export const InspeksiTier1SwitchingView: React.FC<InspeksiTier1SwitchingViewProps> = ({
  currentUser,
  tier1SwitchingList,
  penyulangList,
  sectionList,
  masterUnitList = []
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<InspeksiTier1Switching, 'id'>>(INITIAL_FORM_STATE);
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

  const filteredList = tier1SwitchingList.filter(item => {
    const matchesSearch = item.penyulang.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.namaSwitching.toLowerCase().includes(searchQuery.toLowerCase()) ||
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

  const handleInputChange = (field: keyof Omit<InspeksiTier1Switching, 'id'>, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
    const id = editingId || `sw_${Date.now()}`;
    const newItem: InspeksiTier1Switching = { id, ...formData };

    try {
      await setDoc(doc(db, 'inspeksi_tier1_switching', id), sanitizeForFirestore(newItem));
      setIsModalOpen(false);
      setEditingId(null);
      setFormData(INITIAL_FORM_STATE);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'inspeksi_tier1_switching');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Hapus data inspeksi switching ini?')) return;
    registerDeletedId(id);
    try {
      await deleteDoc(doc(db, 'inspeksi_tier1_switching', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'inspeksi_tier1_switching');
    }
  };

  const handleEdit = (item: InspeksiTier1Switching) => {
    setEditingId(item.id);
    const { id, ...rest } = item;
    setFormData(rest);
    setIsModalOpen(true);
  };

  const exportToPDF = (item: InspeksiTier1Switching) => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('TIER 1 - CHECK LIST INSPEKSI PERALATAN SWITCHING', 105, 15, { align: 'center' });
    
    doc.setFontSize(10);
    const headerData = [
      ['Tgl Pelaksanaan', item.tglPelaksanaan, 'No Tiang', item.noTiang, 'Nama Switching', item.namaSwitching],
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
      { title: 'TIANG JTM', data: [
        ['Tinggi Tiang', item.tinggiTiang, 'Kekuatan Tiang', item.kekuatanTiang],
        ['Jenis Tiang', item.jenisTiang, 'Kepemilikan', item.kepemilikan],
        ['Kondisi Tiang', item.kondisiTiang?.join(', ') || '-', '', '']
      ]},
      { title: 'PMCB (PROTECTIVE MOUNTED CIRCUIT BREAKER)', data: [
        ['Merk', item.merkPmcb, 'Thn Buat', item.thnBuatPmcb],
        ['Tgl Pasang', item.tglPasangPmcb, 'Rated Current', item.ratedCurrentPmcb],
        ['Kondisi', item.kondisiPmcb, 'Isolator', item.isolatorPmcb],
        ['Grounding', item.groundingPmcb, 'Baterai', item.bateraiPmcb]
      ]},
      { title: 'RECLOSER/ LBS MOTORIZE/ LBS MANUAL', data: [
        ['Merk', item.merkRec, 'Thn Buat', item.thnBuatRec],
        ['No Seri', item.noSeriRec, 'Tipe', item.tipeRec],
        ['Kondisi', item.kondisiRec, 'Gas SF6', item.kondisiGasSf6Rec],
        ['Grounding', item.groundingRec, 'Baterai', item.bateraiRec]
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

    doc.save(`Checklist_Switching_${item.namaSwitching}_${item.penyulang}.pdf`);
  };

  const exportTableToPDF = () => {
    const doc = new jsPDF('l', 'mm', 'a4');
    doc.setFontSize(16);
    doc.text('LAPORAN RINGKASAN INSPEKSI SWITCHING (TIER 1)', 148, 15, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, 14, 22);
    doc.text(`Total Data: ${filteredList.length}`, 14, 27);

    const tableData = filteredList.map(item => [
      item.tglPelaksanaan,
      item.penyulang,
      item.namaSwitching,
      item.noTiang,
      item.alamat,
      item.merkRec || item.merkPmcb || '-',
      item.kondisiRec || item.kondisiPmcb || '-',
      item.pelaksana
    ]);

    autoTable(doc, {
      head: [['Tanggal', 'Penyulang', 'Nama', 'Tiang', 'Alamat', 'Merk', 'Kondisi', 'Pelaksana']],
      body: tableData,
      startY: 35,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [225, 29, 72] }
    });

    doc.save(`Laporan_Inspeksi_Switching_${new Date().getTime()}.pdf`);
  };

  return (
    <div className="p-4 md:p-6 space-y-6 bg-slate-50 min-h-screen font-sans">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100">
            <GitGraph className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight text-uppercase">TIER 1 - INSPEKSI PERALATAN SWITCHING</h1>
            <p className="text-sm text-slate-500 font-medium">Manajemen inspeksi visual Recloser, PMCB, dan LBS</p>
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
              placeholder="Cari berdasarkan penyulang, nama switching, atau alamat..."
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

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                <th className="px-6 py-4">Tanggal</th>
                <th className="px-6 py-4">Penyulang / Nama Switching</th>
                <th className="px-6 py-4">No Tiang / Alamat</th>
                <th className="px-6 py-4">Merk / Tipe</th>
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
                    <div className="text-xs font-semibold text-slate-500">{item.namaSwitching}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold text-slate-900">Tiang: {item.noTiang}</div>
                    <div className="text-xs text-slate-500 truncate max-w-[200px]">{item.alamat}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold text-slate-900">{item.merkRec || item.merkPmcb || '-'}</div>
                    <div className="text-xs text-slate-500">{item.tipeRec || 'PMCB'}</div>
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
                    Belum ada data checklist inspeksi peralatan switching.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-5xl max-h-[95vh] rounded-[32px] shadow-2xl overflow-hidden flex flex-col border border-slate-200"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-rose-600 text-white rounded-2xl shadow-lg shadow-rose-600/20">
                    <GitGraph className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900 uppercase">
                      {editingId ? 'Edit Checklist Inspeksi Switching' : 'Checklist Inspeksi Switching Baru'}
                    </h2>
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Lengkapi detail inspeksi peralatan switching di bawah ini</p>
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
                    { id: 'tiang', label: 'Tiang JTM', icon: <Settings className="w-3.5 h-3.5" /> },
                    { id: 'pmcb', label: 'PMCB', icon: <ShieldCheck className="w-3.5 h-3.5" /> },
                    { id: 'recloser', label: 'Recloser/LBS', icon: <Zap className="w-3.5 h-3.5" /> },
                    { id: 'temuan', label: 'Temuan', icon: <ClipboardCheck className="w-3.5 h-3.5" /> }
                  ].map(sec => (
                    <button
                      key={sec.id}
                      onClick={() => {
                        setActiveSection(sec.id);
                        document.getElementById(`sec-${sec.id}`)?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border ${
                        activeSection === sec.id 
                          ? 'bg-rose-600 border-rose-600 text-white shadow-md shadow-rose-600/20' 
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
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tgl Pelaksanaan</label>
                        <input type="date" required value={formData.tglPelaksanaan} onChange={(e) => handleInputChange('tglPelaksanaan', e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">GI / Pembangkit</label>
                        <input type="text" value={formData.giPembangkit} onChange={(e) => handleInputChange('giPembangkit', e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Switching</label>
                        <input type="text" required value={formData.namaSwitching} onChange={(e) => handleInputChange('namaSwitching', e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Penyulang</label>
                        <select required value={formData.penyulang} onChange={(e) => handleInputChange('penyulang', e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none">
                          <option value="">-- Pilih Penyulang --</option>
                          {penyulangList.map(p => <option key={p.id} value={p.namaPenyulang}>{p.namaPenyulang}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">No Tiang</label>
                        <input type="text" value={formData.noTiang} onChange={(e) => handleInputChange('noTiang', e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Section</label>
                        <input type="text" value={formData.section} onChange={(e) => handleInputChange('section', e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold" />
                      </div>
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Alamat / Lokasi</label>
                        <input type="text" value={formData.alamat} onChange={(e) => handleInputChange('alamat', e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold" />
                      </div>
                    </div>
                  </div>

                  {/* SECTION: TIANG JTM */}
                  <div id="sec-tiang" className="space-y-6 pt-4">
                    <div className="flex items-center gap-3 border-l-4 border-emerald-500 pl-4 py-1">
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Bagian 1: TIANG JTM</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tinggi Tiang (m)</label>
                        <select value={formData.tinggiTiang} onChange={(e) => handleInputChange('tinggiTiang', e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold">
                          {['7', '9', '11', '12', '13', '14'].map(v => <option key={v} value={v}>{v} m</option>)}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Kekuatan Tiang (daN)</label>
                        <select value={formData.kekuatanTiang} onChange={(e) => handleInputChange('kekuatanTiang', e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold">
                          {['90', '100', '156', '200', '350'].map(v => <option key={v} value={v}>{v} daN</option>)}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Jenis Tiang</label>
                        <select value={formData.jenisTiang} onChange={(e) => handleInputChange('jenisTiang', e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold">
                          {['Beton', 'Besi', 'Kayu'].map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Kepemilikan</label>
                        <select value={formData.kepemilikan} onChange={(e) => handleInputChange('kepemilikan', e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold">
                          {['PLN', 'Pemda', 'Pihak Lain'].map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* SECTION: PMCB */}
                  <div id="sec-pmcb" className="space-y-6 pt-4">
                    <div className="flex items-center gap-3 border-l-4 border-amber-500 pl-4 py-1">
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Bagian 2: PMCB</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Merk PMCB</label>
                        <input type="text" value={formData.merkPmcb} onChange={(e) => handleInputChange('merkPmcb', e.target.value)} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Normal Operasi</label>
                        <select value={formData.normalOperasiPmcb} onChange={(e) => handleInputChange('normalOperasiPmcb', e.target.value)} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold">
                          {['NO', 'NC'].map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Kondisi PMCB</label>
                        <select value={formData.kondisiPmcb} onChange={(e) => handleInputChange('kondisiPmcb', e.target.value)} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold">
                          {['Baik', 'Rusak'].map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Grounding</label>
                        <select value={formData.groundingPmcb} onChange={(e) => handleInputChange('groundingPmcb', e.target.value)} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold">
                          {['Baik', 'Putus', 'Tdk Ada'].map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* SECTION: RECLOSER/LBS */}
                  <div id="sec-recloser" className="space-y-6 pt-4">
                    <div className="flex items-center gap-3 border-l-4 border-rose-500 pl-4 py-1">
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Bagian 3: RECLOSER / LBS MOTORIZE / MANUAL</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Merk Recloser</label>
                        <input type="text" value={formData.merkRec} onChange={(e) => handleInputChange('merkRec', e.target.value)} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tipe</label>
                        <select value={formData.tipeRec} onChange={(e) => handleInputChange('tipeRec', e.target.value)} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold">
                          {['Two Way', 'Three Way'].map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Kondisi Gas SF6</label>
                        <select value={formData.kondisiGasSf6Rec} onChange={(e) => handleInputChange('kondisiGasSf6Rec', e.target.value)} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold">
                          {['Baik', 'Batas', 'Habis'].map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Baterai</label>
                        <select value={formData.bateraiRec} onChange={(e) => handleInputChange('bateraiRec', e.target.value)} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold">
                          {['Baik', 'Rusak', 'Tdk Ada'].map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* SECTION: TEMUAN LAIN */}
                  <div id="sec-temuan" className="space-y-6 pt-4">
                    <div className="flex items-center gap-3 border-l-4 border-slate-500 pl-4 py-1">
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Catatan Temuan Lain</h3>
                    </div>
                    <textarea 
                      value={formData.kondisiTemuanLain}
                      onChange={(e) => handleInputChange('kondisiTemuanLain', e.target.value)}
                      placeholder="Masukkan temuan lain jika ada..."
                      className="w-full h-32 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium outline-none"
                    ></textarea>
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
