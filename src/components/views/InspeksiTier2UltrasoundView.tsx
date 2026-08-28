import React, { useState } from 'react';
import { 
  ClipboardCheck, 
  Search, 
  Plus, 
  FileText, 
  Download, 
  Trash2, 
  Pencil, 
  Network,
  Settings,
  ChevronDown,
  ChevronUp,
  Volume2,
  Printer,
  Building2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User, InspeksiTier2Ultrasound, Penyulang, SectionJaringan, MasterUnitPLN } from '../../types';
import { DAFTAR_UNIT_PLN } from '../../utils/unitConfig';
import { db, doc, setDoc, deleteDoc, handleFirestoreError, OperationType, registerDeletedId } from '../../lib/firebase';
import { sanitizeForFirestore } from '../../utils/firestoreHelper';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface InspeksiTier2UltrasoundViewProps {
  currentUser: User | null;
  ultrasoundList: InspeksiTier2Ultrasound[];
  penyulangList: Penyulang[];
  sectionList: SectionJaringan[];
  masterUnitList?: MasterUnitPLN[];
}

const ULTRASOUND_OPTIONS = [
  'Tdk Terdeteksi',
  'Berdengung (Corona)',
  'Meletup (Tracking)',
  'Bergemuruh Disertai Cahaya (Arcing)'
];

const INITIAL_FORM_STATE: Omit<InspeksiTier2Ultrasound, 'id'> = {
  tglPelaksanaan: new Date().toISOString().split('T')[0],
  giPembangkit: '',
  noTiang: '',
  area: 'AMBON',
  penyulang: '',
  konstruksi: '',
  ulp: 'ULP BAGUALA',
  section: '',
  pelaksana: '',
  koordinatX: '-7.000000000',
  koordinatY: '114.000000000',

  // ISOLATOR
  isolatorTumpu: 'Tdk Terdeteksi',
  isolatorTarik: 'Tdk Terdeteksi',
  fuseCutOut: 'Tdk Terdeteksi',
  lightningArrester: 'Tdk Terdeteksi',
  terminasiKabelTanah: 'Tdk Terdeteksi',
  terminasiKabelMVTIC: 'Tdk Terdeteksi',

  // JUMPERAN JTM
  konektorJumperan: 'Tdk Terdeteksi',

  // GTT
  bushingPrimerGTT: 'Tdk Terdeteksi',
  bushingSekunderGTT: 'Tdk Terdeteksi',

  // RECLOSER/ PMCB/ LBS
  bushingSwitching: 'Tdk Terdeteksi',

  kondisiTemuanLain: 'Tidak Ada'
};

export const InspeksiTier2UltrasoundView: React.FC<InspeksiTier2UltrasoundViewProps> = ({
  currentUser,
  ultrasoundList,
  penyulangList,
  sectionList,
  masterUnitList = []
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<InspeksiTier2Ultrasound, 'id'>>(INITIAL_FORM_STATE);
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

  const filteredList = ultrasoundList.filter(item => {
    const matchesSearch = item.penyulang.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.noTiang.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.pelaksana.toLowerCase().includes(searchQuery.toLowerCase());
    
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

  const handleInputChange = (field: keyof Omit<InspeksiTier2Ultrasound, 'id'>, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = editingId || `us_${Date.now()}`;
    const newItem: InspeksiTier2Ultrasound = { id, ...formData };

    try {
      await setDoc(doc(db, 'inspeksi_tier2_ultrasound', id), sanitizeForFirestore(newItem));
      setIsModalOpen(false);
      setEditingId(null);
      setFormData(INITIAL_FORM_STATE);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'inspeksi_tier2_ultrasound');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Hapus data inspeksi ultrasound ini?')) return;
    registerDeletedId(id);
    try {
      await deleteDoc(doc(db, 'inspeksi_tier2_ultrasound', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'inspeksi_tier2_ultrasound');
    }
  };

  const handleEdit = (item: InspeksiTier2Ultrasound) => {
    setEditingId(item.id);
    const { id, ...rest } = item;
    setFormData(rest);
    setIsModalOpen(true);
  };

  const exportToPDF = (item: InspeksiTier2Ultrasound) => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('TIER 2.02 - CHECK LIST INSPEKSI ULTRASOUND', 105, 15, { align: 'center' });
    
    doc.setFontSize(9);
    const headerData = [
      ['Tgl Pelaksanaan', item.tglPelaksanaan, 'GI/Pembangkit', item.giPembangkit, 'No Tiang', item.noTiang],
      ['Area', item.area, 'Penyulang', item.penyulang, 'Konstruksi', item.konstruksi],
      ['ULP', item.ulp, 'Section', item.section, 'Pelaksana', item.pelaksana],
      ['Koordinat X', item.koordinatX, 'Koordinat Y', item.koordinatY, '', '']
    ];

    autoTable(doc, {
      body: headerData,
      startY: 25,
      theme: 'grid',
      styles: { fontSize: 8 }
    });

    const sections = [
      { title: 'ISOLATOR', data: [
        ['Isolator Tumpu', item.isolatorTumpu],
        ['Isolator Tarik', item.isolatorTarik],
        ['Fuse Cut Out', item.fuseCutOut],
        ['Lighting Arrester', item.lightningArrester],
        ['Terminasi Kabel Tanah', item.terminasiKabelTanah],
        ['Terminasi Kabel MVTIC', item.terminasiKabelMVTIC]
      ]},
      { title: 'JUMPERAN JTM', data: [
        ['Konektor Jumperan', item.konektorJumperan]
      ]},
      { title: 'GTT', data: [
        ['Bushing Primer GTT', item.bushingPrimerGTT],
        ['Bushing Sekunder GTT', item.bushingSekunderGTT]
      ]},
      { title: 'RECLOSER/ PMCB/ LBS MOTORIZE/ LBS MANUAL', data: [
        ['Bushing', item.bushingSwitching]
      ]}
    ];

    let currentY = (doc as any).lastAutoTable.finalY + 10;

    sections.forEach(sec => {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(sec.title, 14, currentY);
      doc.setFont('helvetica', 'normal');
      autoTable(doc, {
        body: sec.data,
        startY: currentY + 2,
        theme: 'grid',
        styles: { fontSize: 8 },
        margin: { top: 10 }
      });
      currentY = (doc as any).lastAutoTable.finalY + 8;
    });

    doc.setFontSize(9);
    doc.text(`Temuan Lain: ${item.kondisiTemuanLain}`, 14, currentY + 5);

    // Kriteria Table
    autoTable(doc, {
      head: [['Kriteria', 'Deskripsi']],
      body: [
        ['Baik', 'Tidak Terdeteksi'],
        ['Cukup', 'Berdengung (Corona)'],
        ['Kurang', 'Meletup (Tracking)'],
        ['Buruk', 'Bergemuruh Disertai Cahaya (Arcing)']
      ],
      startY: currentY + 15,
      theme: 'grid',
      styles: { fontSize: 7 },
      columnStyles: { 0: { cellWidth: 30 } }
    });

    doc.save(`Ultrasound_${item.noTiang}_${item.penyulang}.pdf`);
  };

  const exportTableToPDF = () => {
    const doc = new jsPDF('l', 'mm', 'a4');
    doc.setFontSize(16);
    doc.text('LAPORAN RINGKASAN INSPEKSI ULTRASOUND (TIER 2)', 148, 15, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, 14, 22);
    doc.text(`Total Data: ${filteredList.length}`, 14, 27);

    const tableData = filteredList.map(item => [
      item.tglPelaksanaan,
      item.penyulang,
      item.noTiang,
      item.giPembangkit,
      item.pelaksana,
      item.isolatorTumpu,
      item.bushingPrimerGTT,
      item.bushingSwitching
    ]);

    autoTable(doc, {
      head: [['Tanggal', 'Penyulang', 'No Tiang', 'GI', 'Pelaksana', 'Isolator', 'GTT', 'Switching']],
      body: tableData,
      startY: 35,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [79, 70, 229] }
    });

    doc.save(`Laporan_Inspeksi_Ultrasound_${new Date().getTime()}.pdf`);
  };

  const renderRadioGroup = (label: string, field: keyof Omit<InspeksiTier2Ultrasound, 'id'>) => (
    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3 hover:border-indigo-200 transition-colors">
      <label className="text-[11px] font-black text-slate-600 uppercase tracking-wider">{label}</label>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {ULTRASOUND_OPTIONS.map(opt => (
          <label key={opt} className="flex items-center gap-3 p-2 bg-white border border-slate-100 rounded-xl cursor-pointer hover:bg-indigo-50 transition-colors">
            <input 
              type="radio" 
              name={field}
              value={opt}
              checked={formData[field] === opt}
              onChange={() => handleInputChange(field, opt)}
              className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
            />
            <span className={`text-xs font-bold ${formData[field] === opt ? 'text-indigo-700' : 'text-slate-500'}`}>{opt}</span>
          </label>
        ))}
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-6 space-y-6 bg-slate-50 min-h-screen font-sans">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100">
            <Volume2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">TIER 2.02 - CHECKLIST INSPEKSI ULTRASOUND</h1>
            <p className="text-sm text-slate-500 font-medium">Monitoring gangguan corona, tracking, dan arcing menggunakan sensor suara</p>
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
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-600/20 active:scale-95 cursor-pointer"
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
              placeholder="Cari berdasarkan penyulang, No tiang, atau pelaksana..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap md:flex-nowrap">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-indigo-700">
              <Building2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span className="text-indigo-500 font-bold">ULP:</span>
              <select
                value={selectedUlpFilter}
                onChange={(e) => setSelectedUlpFilter(e.target.value)}
                className="bg-transparent text-indigo-800 font-bold focus:outline-none cursor-pointer max-w-[160px] truncate"
              >
                <option value="all">Semua ULP</option>
                {ulpOptions.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-indigo-700">
              <span className="text-indigo-500 font-bold">Penyulang:</span>
              <select
                value={selectedPenyulangFilter}
                onChange={(e) => setSelectedPenyulangFilter(e.target.value)}
                className="bg-transparent text-indigo-800 font-bold focus:outline-none cursor-pointer max-w-[150px] truncate"
              >
                <option value="all">Semua Penyulang</option>
                {penyulangList.map((p) => (
                  <option key={p.id} value={p.nama || p.namaPenyulang}>
                    {p.nama || p.namaPenyulang}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-indigo-700">
              <span className="text-indigo-500 font-bold">Bulan:</span>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent text-indigo-800 font-bold focus:outline-none cursor-pointer"
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

            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-indigo-700">
              <span className="text-indigo-500">Tahun:</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="bg-transparent text-indigo-800 font-bold focus:outline-none cursor-pointer"
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
                <th className="px-6 py-4">Penyulang / No Tiang</th>
                <th className="px-6 py-4">GI / Pelaksana</th>
                <th className="px-6 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredList.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4 font-bold text-slate-900">{item.tglPelaksanaan}</td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-extrabold text-indigo-600">{item.penyulang}</div>
                    <div className="text-xs font-semibold text-slate-500">Tiang: {item.noTiang}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold text-slate-700">{item.giPembangkit}</div>
                    <div className="text-xs text-slate-500 font-medium">{item.pelaksana}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => exportToPDF(item)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"><Download className="w-4 h-4" /></button>
                      <button onClick={() => handleEdit(item)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(item.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredList.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400 font-medium">Belum ada data ultrasound.</td>
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
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-indigo-50/30">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-600 text-white rounded-2xl">
                    <Volume2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                      {editingId ? 'Edit Checklist Ultrasound' : 'Checklist Ultrasound Baru'}
                    </h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Lengkapi hasil deteksi suara pada jaringan</p>
                  </div>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"><Plus className="w-6 h-6 rotate-45" /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8 scroll-smooth">
                {/* Form Sections Navigation */}
                <div className="flex flex-wrap gap-2 sticky top-0 bg-white/80 backdrop-blur-md pb-4 z-10">
                  {[
                    { id: 'header', label: 'Umum' },
                    { id: 'isolator', label: 'Isolator' },
                    { id: 'jtm', label: 'Jumperan' },
                    { id: 'gtt', label: 'GTT' },
                    { id: 'switching', label: 'Switching' }
                  ].map(sec => (
                    <button
                      key={sec.id}
                      onClick={() => {
                        setActiveSection(sec.id);
                        document.getElementById(`sec-${sec.id}`)?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase transition-all border ${
                        activeSection === sec.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      {sec.label}
                    </button>
                  ))}
                </div>

                <form onSubmit={handleSave} className="space-y-12 pb-12">
                  <div id="sec-header" className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tgl Pelaksanaan</label>
                      <input type="date" required value={formData.tglPelaksanaan} onChange={(e) => handleInputChange('tglPelaksanaan', e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">GI / Pembangkit</label>
                      <input type="text" value={formData.giPembangkit} onChange={(e) => handleInputChange('giPembangkit', e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Penyulang</label>
                      <select required value={formData.penyulang} onChange={(e) => handleInputChange('penyulang', e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold">
                        <option value="">-- Pilih --</option>
                        {penyulangList.map(p => <option key={p.id} value={p.namaPenyulang}>{p.namaPenyulang}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">No Tiang</label>
                      <input type="text" required value={formData.noTiang} onChange={(e) => handleInputChange('noTiang', e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Konstruksi</label>
                      <input type="text" value={formData.konstruksi} onChange={(e) => handleInputChange('konstruksi', e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Pelaksana</label>
                      <input type="text" required value={formData.pelaksana} onChange={(e) => handleInputChange('pelaksana', e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold" />
                    </div>
                  </div>

                  <div id="sec-isolator" className="space-y-6">
                    <div className="flex items-center gap-3 border-l-4 border-indigo-500 pl-4 py-1">
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">ISOLATOR</h3>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {renderRadioGroup('Isolator Tumpu', 'isolatorTumpu')}
                      {renderRadioGroup('Isolator Tarik', 'isolatorTarik')}
                      {renderRadioGroup('Fuse Cut Out (FCO)', 'fuseCutOut')}
                      {renderRadioGroup('Lightning Arrester (LA)', 'lightningArrester')}
                      {renderRadioGroup('Terminasi Kabel Tanah', 'terminasiKabelTanah')}
                      {renderRadioGroup('Terminasi Kabel MVTIC', 'terminasiKabelMVTIC')}
                    </div>
                  </div>

                  <div id="sec-jtm" className="space-y-6">
                    <div className="flex items-center gap-3 border-l-4 border-emerald-500 pl-4 py-1">
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">JUMPERAN JTM</h3>
                    </div>
                    {renderRadioGroup('Konektor Jumperan', 'konektorJumperan')}
                  </div>

                  <div id="sec-gtt" className="space-y-6">
                    <div className="flex items-center gap-3 border-l-4 border-amber-500 pl-4 py-1">
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">GTT (GARDU TIANG TRAFO)</h3>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {renderRadioGroup('Bushing Primer GTT', 'bushingPrimerGTT')}
                      {renderRadioGroup('Bushing Sekunder GTT', 'bushingSekunderGTT')}
                    </div>
                  </div>

                  <div id="sec-switching" className="space-y-6">
                    <div className="flex items-center gap-3 border-l-4 border-rose-500 pl-4 py-1">
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">SWITCHING (RECLOSER/PMCB/LBS)</h3>
                    </div>
                    {renderRadioGroup('Bushing Switching', 'bushingSwitching')}
                  </div>

                  <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-sm font-bold cursor-pointer">Batal</button>
                    <button type="submit" className="px-10 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/20 cursor-pointer transition-all active:scale-95">Simpan Laporan</button>
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
