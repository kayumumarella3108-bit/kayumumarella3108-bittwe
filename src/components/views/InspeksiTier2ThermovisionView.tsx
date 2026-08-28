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
  Thermometer,
  Zap,
  ShieldCheck,
  Settings,
  ChevronDown,
  ChevronUp,
  Printer,
  Building2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User, InspeksiTier2Thermovision, Penyulang, SectionJaringan, ThermovisionPoint, MasterUnitPLN } from '../../types';
import { DAFTAR_UNIT_PLN } from '../../utils/unitConfig';
import { db, doc, setDoc, deleteDoc, handleFirestoreError, OperationType, registerDeletedId } from '../../lib/firebase';
import { sanitizeForFirestore } from '../../utils/firestoreHelper';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface InspeksiTier2ThermovisionViewProps {
  currentUser: User | null;
  thermovisionList: InspeksiTier2Thermovision[];
  penyulangList: Penyulang[];
  sectionList: SectionJaringan[];
  masterUnitList?: MasterUnitPLN[];
}

const EMPTY_POINT: ThermovisionPoint = { tempR: '', tempS: '', tempT: '', status: 'Baik' };
const EMPTY_POINT_N: ThermovisionPoint = { tempR: '', tempS: '', tempT: '', tempN: '', status: 'Baik' };

const INITIAL_FORM_STATE: Omit<InspeksiTier2Thermovision, 'id'> = {
  tglPelaksanaan: new Date().toISOString().split('T')[0],
  area: 'AMBON',
  ulp: 'ULP BAGUALA',
  giPembangkit: '',
  penyulang: '',
  section: '',
  noTiang: '',
  konstruksi: '',
  pelaksana: '',
  koordinatX: '',
  koordinatY: '',

  // KONEKTOR/ JUMPERAN
  konektorJumperan: { ...EMPTY_POINT },
  konektorJumperanCO: { ...EMPTY_POINT },
  konektorJumperanLA: { ...EMPTY_POINT },
  sepatuKabelTanah: { ...EMPTY_POINT },
  sepatuKabelMVTIC: { ...EMPTY_POINT },

  // GTT
  bushingPrimerGTT: { ...EMPTY_POINT },
  bushingSekunderGTT: { ...EMPTY_POINT_N },
  sepatuKabelInfoer: { ...EMPTY_POINT_N },
  contactVeerUtama: { ...EMPTY_POINT },
  contactVeerJurusanA: { ...EMPTY_POINT },
  contactVeerJurusanB: { ...EMPTY_POINT },
  contactVeerJurusanC: { ...EMPTY_POINT },
  contactVeerJurusanD: { ...EMPTY_POINT },
  sepatuKabelTofoerA: { ...EMPTY_POINT_N },
  sepatuKabelTofoerB: { ...EMPTY_POINT_N },
  sepatuKabelTofoerC: { ...EMPTY_POINT_N },
  sepatuKabelTofoerD: { ...EMPTY_POINT_N },

  // RECLOSER/ PMCB/ LBS
  pisauLBS: { ...EMPTY_POINT },
  peredamBusurApi: { ...EMPTY_POINT },
  bushing: { ...EMPTY_POINT },

  kondisiTemuanLain: ''
};

export const InspeksiTier2ThermovisionView: React.FC<InspeksiTier2ThermovisionViewProps> = ({
  currentUser,
  thermovisionList,
  penyulangList,
  sectionList,
  masterUnitList = []
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<InspeksiTier2Thermovision, 'id'>>(INITIAL_FORM_STATE);
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

  const filteredList = thermovisionList.filter(item => {
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

  const handleInputChange = (field: keyof Omit<InspeksiTier2Thermovision, 'id'>, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePointChange = (pointField: keyof Omit<InspeksiTier2Thermovision, 'id'>, subField: keyof ThermovisionPoint, value: string) => {
    setFormData(prev => {
      const point = (prev[pointField] as ThermovisionPoint);
      const newPoint = { ...point, [subField]: value };
      
      // Auto-calculate status based on temperatures
      if (subField.startsWith('temp')) {
        const temps = [newPoint.tempR, newPoint.tempS, newPoint.tempT, newPoint.tempN]
          .filter(t => t !== undefined && t !== '')
          .map(t => parseFloat(t!));
        
        if (temps.length > 0) {
          const maxTemp = Math.max(...temps);
          if (maxTemp > 100) newPoint.status = 'Sangat Tinggi';
          else if (maxTemp >= 60) newPoint.status = 'Tinggi';
          else if (maxTemp >= 30) newPoint.status = 'Cukup';
          else newPoint.status = 'Baik';
        }
      }
      
      return { ...prev, [pointField]: newPoint };
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = editingId || `tv_${Date.now()}`;
    const newItem: InspeksiTier2Thermovision = { id, ...formData };

    try {
      await setDoc(doc(db, 'inspeksi_tier2_thermovision', id), sanitizeForFirestore(newItem));
      setIsModalOpen(false);
      setEditingId(null);
      setFormData(INITIAL_FORM_STATE);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'inspeksi_tier2_thermovision');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Hapus data inspeksi thermovision ini?')) return;
    registerDeletedId(id);
    try {
      await deleteDoc(doc(db, 'inspeksi_tier2_thermovision', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'inspeksi_tier2_thermovision');
    }
  };

  const handleEdit = (item: InspeksiTier2Thermovision) => {
    setEditingId(item.id);
    const { id, ...rest } = item;
    setFormData(rest);
    setIsModalOpen(true);
  };

  const exportToPDF = (item: InspeksiTier2Thermovision) => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('TIER 2 - CHECK LIST INSPEKSI THERMOVISION', 105, 15, { align: 'center' });
    
    doc.setFontSize(9);
    const headerData = [
      ['Tgl Pelaksanaan', item.tglPelaksanaan, 'No Tiang', item.noTiang, 'Area', item.area],
      ['Penyulang', item.penyulang, 'Section', item.section, 'ULP', item.ulp],
      ['Pelaksana', item.pelaksana, 'Koordinat', `${item.koordinatX}, ${item.koordinatY}`, 'Konstruksi', item.konstruksi]
    ];

    autoTable(doc, {
      body: headerData,
      startY: 25,
      theme: 'grid',
      styles: { fontSize: 8 }
    });

    const formatPoint = (p: ThermovisionPoint) => `R:${p.tempR} S:${p.tempS} T:${p.tempT}${p.tempN ? ' N:'+p.tempN : ''} [${p.status}]`;

    const sections = [
      { title: 'KONEKTOR/ JUMPERAN', data: [
        ['Konektor Jumperan', formatPoint(item.konektorJumperan)],
        ['Konektor Jumperan CO', formatPoint(item.konektorJumperanCO)],
        ['Konektor Jumperan LA', formatPoint(item.konektorJumperanLA)],
        ['Sepatu Kabel Tanah', formatPoint(item.sepatuKabelTanah)],
        ['Sepatu Kabel MVTIC', formatPoint(item.sepatuKabelMVTIC)]
      ]},
      { title: 'GTT', data: [
        ['Bushing Primer GTT', formatPoint(item.bushingPrimerGTT)],
        ['Bushing Sekunder GTT', formatPoint(item.bushingSekunderGTT)],
        ['Sepatu Kabel Infoer', formatPoint(item.sepatuKabelInfoer)],
        ['Contact Veer Utama', formatPoint(item.contactVeerUtama)],
        ['Contact Veer Jurusan A', formatPoint(item.contactVeerJurusanA)],
        ['Contact Veer Jurusan B', formatPoint(item.contactVeerJurusanB)],
        ['Contact Veer Jurusan C', formatPoint(item.contactVeerJurusanC)],
        ['Contact Veer Jurusan D', formatPoint(item.contactVeerJurusanD)],
        ['Sepatu Kabel Tofoer A', formatPoint(item.sepatuKabelTofoerA)],
        ['Sepatu Kabel Tofoer B', formatPoint(item.sepatuKabelTofoerB)],
        ['Sepatu Kabel Tofoer C', formatPoint(item.sepatuKabelTofoerC)],
        ['Sepatu Kabel Tofoer D', formatPoint(item.sepatuKabelTofoerD)]
      ]},
      { title: 'RECLOSER/ PMCB/ LBS', data: [
        ['Pisau LBS', formatPoint(item.pisauLBS)],
        ['Peredam Busur Api', formatPoint(item.peredamBusurApi)],
        ['Bushing', formatPoint(item.bushing)]
      ]}
    ];

    let currentY = (doc as any).lastAutoTable.finalY + 10;

    sections.forEach(sec => {
      if (currentY > 260) {
        doc.addPage();
        currentY = 20;
      }
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(sec.title, 14, currentY);
      doc.setFont('helvetica', 'normal');
      autoTable(doc, {
        body: sec.data,
        startY: currentY + 2,
        theme: 'grid',
        styles: { fontSize: 7 },
        margin: { top: 10 }
      });
      currentY = (doc as any).lastAutoTable.finalY + 8;
    });

    doc.setFontSize(9);
    doc.text(`Temuan Lain: ${item.kondisiTemuanLain || 'Tidak ada'}`, 14, currentY + 5);

    doc.save(`Thermovision_${item.noTiang}_${item.penyulang}.pdf`);
  };

  const exportTableToPDF = () => {
    const doc = new jsPDF('l', 'mm', 'a4');
    doc.setFontSize(16);
    doc.text('LAPORAN RINGKASAN INSPEKSI THERMOVISION (TIER 2)', 148, 15, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, 14, 22);
    doc.text(`Total Data: ${filteredList.length}`, 14, 27);

    const tableData = filteredList.map(item => [
      item.tglPelaksanaan,
      item.penyulang,
      item.noTiang,
      item.section,
      item.pelaksana,
      item.konektorJumperan.status,
      item.bushingPrimerGTT.status,
      item.bushing.status
    ]);

    autoTable(doc, {
      head: [['Tanggal', 'Penyulang', 'No Tiang', 'Section', 'Pelaksana', 'Jumperan', 'GTT', 'Switching']],
      body: tableData,
      startY: 35,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [234, 88, 12] }
    });

    doc.save(`Laporan_Inspeksi_Thermovision_${new Date().getTime()}.pdf`);
  };

  const renderThermovisionInput = (title: string, field: keyof Omit<InspeksiTier2Thermovision, 'id'>, hasNeutral: boolean = false) => {
    const point = (formData[field] as ThermovisionPoint);
    return (
      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-black text-slate-600 uppercase tracking-wider">{title}</label>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            point.status === 'Baik' ? 'bg-emerald-100 text-emerald-700' :
            point.status === 'Cukup' ? 'bg-amber-100 text-amber-700' :
            point.status === 'Tinggi' ? 'bg-orange-100 text-orange-700' :
            'bg-rose-100 text-rose-700'
          }`}>
            {point.status}
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-slate-400 uppercase text-center block">Phase R (°C)</label>
            <input 
              type="number" 
              step="0.1"
              value={point.tempR} 
              onChange={(e) => handlePointChange(field, 'tempR', e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-bold text-center outline-none focus:border-orange-500"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-slate-400 uppercase text-center block">Phase S (°C)</label>
            <input 
              type="number" 
              step="0.1"
              value={point.tempS} 
              onChange={(e) => handlePointChange(field, 'tempS', e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-bold text-center outline-none focus:border-orange-500"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-slate-400 uppercase text-center block">Phase T (°C)</label>
            <input 
              type="number" 
              step="0.1"
              value={point.tempT} 
              onChange={(e) => handlePointChange(field, 'tempT', e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-bold text-center outline-none focus:border-orange-500"
            />
          </div>
          {hasNeutral && (
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-400 uppercase text-center block">Netral (°C)</label>
              <input 
                type="number" 
                step="0.1"
                value={point.tempN || ''} 
                onChange={(e) => handlePointChange(field, 'tempN', e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-bold text-center outline-none focus:border-orange-500"
              />
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 md:p-6 space-y-6 bg-slate-50 min-h-screen font-sans">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-orange-50 text-orange-600 rounded-2xl border border-orange-100">
            <Thermometer className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">TIER 2 - CHECKLIST INSPEKSI THERMOVISION</h1>
            <p className="text-sm text-slate-500 font-medium">Monitoring suhu peralatan jaringan menggunakan kamera thermal</p>
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
            className="flex items-center gap-2 px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-orange-600/20 active:scale-95 cursor-pointer"
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
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap md:flex-nowrap">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-orange-700">
              <Building2 className="w-3.5 h-3.5 text-orange-600 shrink-0" />
              <span className="text-orange-500 font-bold">ULP:</span>
              <select
                value={selectedUlpFilter}
                onChange={(e) => setSelectedUlpFilter(e.target.value)}
                className="bg-transparent text-orange-800 font-bold focus:outline-none cursor-pointer max-w-[160px] truncate"
              >
                <option value="all">Semua ULP</option>
                {ulpOptions.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-orange-700">
              <span className="text-orange-500 font-bold">Penyulang:</span>
              <select
                value={selectedPenyulangFilter}
                onChange={(e) => setSelectedPenyulangFilter(e.target.value)}
                className="bg-transparent text-orange-800 font-bold focus:outline-none cursor-pointer max-w-[150px] truncate"
              >
                <option value="all">Semua Penyulang</option>
                {penyulangList.map((p) => (
                  <option key={p.id} value={p.nama || p.namaPenyulang}>
                    {p.nama || p.namaPenyulang}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-orange-700">
              <span className="text-orange-500 font-bold">Bulan:</span>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent text-orange-800 font-bold focus:outline-none cursor-pointer"
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

            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-orange-700">
              <span className="text-orange-500">Tahun:</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="bg-transparent text-orange-800 font-bold focus:outline-none cursor-pointer"
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
                <th className="px-6 py-4">Pelaksana</th>
                <th className="px-6 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredList.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4 font-bold text-slate-900">{item.tglPelaksanaan}</td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-extrabold text-orange-600">{item.penyulang}</div>
                    <div className="text-xs font-semibold text-slate-500">Tiang: {item.noTiang}</div>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-700">{item.pelaksana}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => exportToPDF(item)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Download className="w-4 h-4" /></button>
                      <button onClick={() => handleEdit(item)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(item.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredList.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400 font-medium">Belum ada data thermovision.</td>
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
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-orange-50/30">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-orange-600 text-white rounded-2xl">
                    <Thermometer className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900 uppercase">
                      {editingId ? 'Edit Checklist Thermovision' : 'Checklist Thermovision Baru'}
                    </h2>
                  </div>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl"><Plus className="w-6 h-6 rotate-45" /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8 scroll-smooth">
                {/* Form Sections Navigation */}
                <div className="flex flex-wrap gap-2 sticky top-0 bg-white/80 backdrop-blur-md pb-4 z-10">
                  {[
                    { id: 'header', label: 'Umum' },
                    { id: 'konektor', label: 'Konektor' },
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
                        activeSection === sec.id ? 'bg-orange-600 border-orange-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
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
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Pelaksana</label>
                      <input type="text" required value={formData.pelaksana} onChange={(e) => handleInputChange('pelaksana', e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold" />
                    </div>
                  </div>

                  <div id="sec-konektor" className="space-y-6">
                    <div className="flex items-center gap-3 border-l-4 border-orange-500 pl-4 py-1">
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">KONEKTOR / JUMPERAN</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {renderThermovisionInput('Konektor Jumperan', 'konektorJumperan')}
                      {renderThermovisionInput('Konektor Jumperan CO', 'konektorJumperanCO')}
                      {renderThermovisionInput('Konektor Jumperan LA', 'konektorJumperanLA')}
                      {renderThermovisionInput('Sepatu Kabel Kabel Tanah', 'sepatuKabelTanah')}
                      {renderThermovisionInput('Sepatu Kabel Kabel MVTIC', 'sepatuKabelMVTIC')}
                    </div>
                  </div>

                  <div id="sec-gtt" className="space-y-6">
                    <div className="flex items-center gap-3 border-l-4 border-emerald-500 pl-4 py-1">
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">GTT (GARDU TIANG TRAFO)</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {renderThermovisionInput('Bushing Primer GTT', 'bushingPrimerGTT')}
                      {renderThermovisionInput('Bushing Sekunder GTT', 'bushingSekunderGTT', true)}
                      {renderThermovisionInput('Sepatu Kabel Infoer', 'sepatuKabelInfoer', true)}
                      {renderThermovisionInput('Contact Veer Utama', 'contactVeerUtama')}
                      {renderThermovisionInput('Contact Veer Jurusan A', 'contactVeerJurusanA')}
                      {renderThermovisionInput('Contact Veer Jurusan B', 'contactVeerJurusanB')}
                      {renderThermovisionInput('Contact Veer Jurusan C', 'contactVeerJurusanC')}
                      {renderThermovisionInput('Contact Veer Jurusan D', 'contactVeerJurusanD')}
                      {renderThermovisionInput('Sepatu Kabel Kabel Tofoer A', 'sepatuKabelTofoerA', true)}
                      {renderThermovisionInput('Sepatu Kabel Kabel Tofoer B', 'sepatuKabelTofoerB', true)}
                      {renderThermovisionInput('Sepatu Kabel Kabel Tofoer C', 'sepatuKabelTofoerC', true)}
                      {renderThermovisionInput('Sepatu Kabel Kabel Tofoer D', 'sepatuKabelTofoerD', true)}
                    </div>
                  </div>

                  <div id="sec-switching" className="space-y-6">
                    <div className="flex items-center gap-3 border-l-4 border-rose-500 pl-4 py-1">
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">RECLOSER / PMCB / LBS</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {renderThermovisionInput('Pisau LBS', 'pisauLBS')}
                      {renderThermovisionInput('Peredam Busur Api', 'peredamBusurApi')}
                      {renderThermovisionInput('Bushing', 'bushing')}
                    </div>
                  </div>

                  <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-sm font-bold">Batal</button>
                    <button type="submit" className="px-10 py-2.5 bg-orange-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-orange-600/20">Simpan Laporan</button>
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
