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
  Printer
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User, InspeksiTier1JTM, Penyulang, SectionJaringan, ROWItem } from '../../types';
import { db, doc, setDoc, deleteDoc, handleFirestoreError, OperationType, registerDeletedId } from '../../lib/firebase';
import { sanitizeForFirestore } from '../../utils/firestoreHelper';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface InspeksiTier1JTMViewProps {
  currentUser: User | null;
  tier1JtmList: InspeksiTier1JTM[];
  penyulangList: Penyulang[];
  sectionList: SectionJaringan[];
}

const INITIAL_FORM_STATE: Omit<InspeksiTier1JTM, 'id'> = {
  tglPelaksanaan: new Date().toISOString().split('T')[0],
  giPembangkit: '',
  noTiang: '',
  up3: 'UP3 AMBON',
  penyulang: '',
  konstruksi: '',
  ulp: 'ULP BAGUALA',
  section: '',
  pelaksana: '',
  koordinatX: '',
  koordinatY: '',

  // TIANG JTM
  tinggiTiang: '',
  kekuatanTiang: '',
  jenisTiang: '',
  kepemilikan: 'PLN',
  kondisiTiang: [],

  // AKSESORIS TIANG JTM
  verlenkStick3M: 'Baik',
  crossArm: 'Baik',
  armTie: 'Baik',
  bandStrap: 'Baik',
  strainClamp: 'Baik',
  bautCrossArm: 'Baik',
  groundWire: 'Baik',
  wireClip: 'Baik',
  grounding: 'Baik',
  penghalangPanjat: 'Baik',
  flangNet: 'Baik',

  // POLE SUPPORTER JTM
  trackSchoor: 'Baik',
  dragSchoor: 'Baik',
  kontraMast: 'Baik',
  guyInsulator: 'Baik',
  pondasi: 'Baik',

  // KONDUKTOR
  lokasiPenempatan: 'SUTM',
  panjangKonduktor: '',
  penampangKonduktor: '',
  jenisKonduktor: '',
  kondisiKonduktor: 'Baik',
  jenisJumperan: '',
  kondisiJumperan: 'Baik',
  jarakJumperan: '',
  kondisiAndongan: 'Baik',
  bendingIsolator: '',
  kondisiBending: 'Baik',

  // ISOLATOR
  isolatorTumpu: 'Baik',
  isolatorTarik: 'Baik',
  isolatorGantung: 'Baik',
  sepatuKabel: '',
  terminasi: 'Baik',
  lightingArrester: 'Baik',
  cutOut: 'Baik',
  konstruksiSeharusnya: '',

  // ROW
  pohon: 'Tdk Ada',
  jenisPohon: '',
  jumlahPohon: '',
  layangLayang: 'Tdk Ada',
  bangunanBaliho: 'Tdk Ada',
  umbulUmbul: 'Tdk Ada',

  kondisiTemuanLain: ''
};

export const InspeksiTier1JTMView: React.FC<InspeksiTier1JTMViewProps> = ({
  currentUser,
  tier1JtmList,
  penyulangList,
  sectionList
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<InspeksiTier1JTM, 'id'>>(INITIAL_FORM_STATE);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState('2026');
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [selectedPenyulangFilter, setSelectedPenyulangFilter] = useState('all');
  const [activeSection, setActiveSection] = useState<string | null>('header');

  const filteredList = tier1JtmList.filter(item => {
    const matchesSearch = item.penyulang.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.noTiang.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.section.toLowerCase().includes(searchQuery.toLowerCase());
    
    const parts = (item.tglPelaksanaan || '').split('-');
    const matchesYear = parts[0] === selectedYear;
    const matchesMonth = selectedMonth === 'all' || parts[1] === selectedMonth;
    const matchesPenyulang = selectedPenyulangFilter === 'all' || 
      item.penyulang.toLowerCase() === selectedPenyulangFilter.toLowerCase();

    return matchesSearch && matchesYear && matchesMonth && matchesPenyulang;
  });

  const handleInputChange = (field: keyof Omit<InspeksiTier1JTM, 'id'>, value: any) => {
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
    const id = editingId || `jtm_${Date.now()}`;
    const newItem: InspeksiTier1JTM = { id, ...formData };

    try {
      await setDoc(doc(db, 'inspeksi_tier1_jtm', id), sanitizeForFirestore(newItem));
      
      // Automatically send to ROW if there is a tree finding
      if (formData.pohon && formData.pohon !== 'Tdk Ada') {
        const rowId = `row_auto_${id}`;
        const qty = Number(formData.jumlahPohon) || 1;
        const rowItem: ROWItem = {
          id: rowId,
          tanggal: '-', // Execution date is pending
          tanggalInspeksi: formData.tglPelaksanaan || '-',
          tanggalEksekusi: '-',
          penyulang: formData.penyulang || '-',
          section: formData.section || `Tiang No: ${formData.noTiang || '-'}`,
          jumlahTemuanInspeksi: qty,
          realisasiPangkas: 0,
          perluIzin: 0,
          perluPadam: 0,
          pohonBesar: formData.pohon === 'Menempel' || formData.pohon === '< 1 m' ? 1 : 0,
          luarTemuan: `Temuan JTM Tiang ${formData.noTiang}: Jarak ${formData.pohon}. ${formData.jenisPohon ? `Jenis: ${formData.jenisPohon}` : ''}`,
          temuanBelumDieksekusi: qty,
          tiangId: formData.noTiang || 'T-Custom',
          namaPenyulang: formData.penyulang || '-',
          lokasi: formData.section || `Tiang No: ${formData.noTiang || '-'}`,
          jumlahPohon: qty,
          jenisPohon: formData.jenisPohon || 'Pohon Rimbun',
          status: 'Perlu Pangkas',
          prioritas: formData.pohon === 'Menempel' || formData.pohon === '< 1 m' ? 'Tinggi' : 'Sedang',
          tanggalTemuan: formData.tglPelaksanaan || '-',
          isFromInspection: true,
          inspectionId: id
        };
        await setDoc(doc(db, 'pemeliharaan_row', rowId), sanitizeForFirestore(rowItem));
      }

      setIsModalOpen(false);
      setEditingId(null);
      setFormData(INITIAL_FORM_STATE);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'inspeksi_tier1_jtm');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Hapus data inspeksi ini?')) return;
    registerDeletedId(id);
    try {
      await deleteDoc(doc(db, 'inspeksi_tier1_jtm', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'inspeksi_tier1_jtm');
    }
  };

  const handleEdit = (item: InspeksiTier1JTM) => {
    setEditingId(item.id);
    const { id, ...rest } = item;
    setFormData(rest);
    setIsModalOpen(true);
  };

  const exportToPDF = (item: InspeksiTier1JTM) => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('TIER 1 - CHECK LIST INSPEKSI JTM', 105, 15, { align: 'center' });
    
    doc.setFontSize(10);
    const headerData = [
      ['Tgl Pelaksanaan', item.tglPelaksanaan, 'GI/Pembangkit', item.giPembangkit, 'No Tiang', item.noTiang],
      ['UP3', item.up3, 'Penyulang', item.penyulang, 'Konstruksi', item.konstruksi],
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
      { title: 'TIANG JTM', data: [
        ['Tinggi Tiang', item.tinggiTiang, 'Jenis Tiang', item.jenisTiang],
        ['Kekuatan Tiang', item.kekuatanTiang, 'Kepemilikan', item.kepemilikan],
        ['Kondisi Tiang', item.kondisiTiang?.join(', ') || '-', '', '']
      ]},
      { title: 'AKSESORIS TIANG JTM', data: [
        ['Verlenk Stick 3 M', item.verlenkStick3M, 'Baut Cross Arm', item.bautCrossArm],
        ['Cross Arm', item.crossArm, 'Ground Wire', item.groundWire],
        ['Arm Tie', item.armTie, 'Wire Clip', item.wireClip],
        ['Band Strap', item.bandStrap, 'Grounding', item.grounding],
        ['Strain Clamp', item.strainClamp, 'Penghalang Panjat', item.penghalangPanjat],
        ['Flang Net', item.flangNet, '', '']
      ]},
      { title: 'POLE SUPPORTER JTM', data: [
        ['Track Schoor', item.trackSchoor, 'Guy Insulator', item.guyInsulator],
        ['Drag Schoor', item.dragSchoor, 'Pondasi', item.pondasi],
        ['Kontra Mast', item.kontraMast, '', '']
      ]},
      { title: 'KONDUKTOR', data: [
        ['Lokasi Penempatan', item.lokasiPenempatan, 'Jenis Jumperan', item.jenisJumperan],
        ['Panjang Konduktor', item.panjangKonduktor, 'Kondisi Jumperan', item.kondisiJumperan],
        ['Penampang Konduktor', item.penampangKonduktor, 'Jarak Jumperan', item.jarakJumperan],
        ['Jenis Konduktor', item.jenisKonduktor, 'Kondisi Andongan', item.kondisiAndongan],
        ['Kondisi Konduktor', item.kondisiKonduktor, 'Bending Isolator', item.bendingIsolator]
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

    doc.save(`Checklist_JTM_${item.penyulang}_${item.noTiang}.pdf`);
  };

  const exportTableToPDF = () => {
    const doc = new jsPDF('l', 'mm', 'a4');
    doc.setFontSize(16);
    doc.text('LAPORAN RINGKASAN INSPEKSI JTM (TIER 1)', 148, 15, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, 14, 22);
    doc.text(`Total Data: ${filteredList.length}`, 14, 27);

    const tableData = filteredList.map(item => [
      item.tglPelaksanaan,
      item.penyulang,
      item.noTiang,
      item.section,
      item.konstruksi,
      item.pelaksana,
      item.kondisiTiang?.join(', ') || 'Baik',
      item.pohon === 'Tdk Ada' ? 'Aman' : `Ada (${item.jenisPohon})`
    ]);

    autoTable(doc, {
      head: [['Tanggal', 'Penyulang', 'No Tiang', 'Section', 'Konstr.', 'Pelaksana', 'Kondisi Tiang', 'ROW']],
      body: tableData,
      startY: 35,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [16, 185, 129] }
    });

    doc.save(`Laporan_Inspeksi_JTM_${new Date().getTime()}.pdf`);
  };

  return (
    <div className="p-4 md:p-6 space-y-6 bg-slate-50 min-h-screen font-sans">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100">
            <ClipboardCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">TIER 1 - CHECKLIST INSPEKSI JTM</h1>
            <p className="text-sm text-slate-500 font-medium">Manajemen inspeksi visual aset jaringan tegangan menengah</p>
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

      {/* Statistics or info cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{tier1JtmList.length}</div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Laporan</div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">
              {new Set(tier1JtmList.map(i => i.penyulang)).size}
            </div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Penyulang Terinspeksi</div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
            <Trees className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">
              {tier1JtmList.filter(i => i.pohon !== 'Tdk Ada').length}
            </div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Temuan ROW</div>
          </div>
        </div>
      </div>

      {/* Main List Table */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari berdasarkan penyulang, tiang, atau section..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap md:flex-nowrap">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold">
              <span className="text-slate-500">Penyulang:</span>
              <select
                value={selectedPenyulangFilter}
                onChange={(e) => setSelectedPenyulangFilter(e.target.value)}
                className="bg-transparent text-slate-800 font-bold focus:outline-none cursor-pointer max-w-[150px] truncate"
              >
                <option value="all">Semua Penyulang</option>
                {penyulangList.map((p) => (
                  <option key={p.id} value={p.nama}>
                    {p.nama}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold">
              <span className="text-slate-500">Bulan:</span>
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
                <th className="px-6 py-4">Penyulang / Tiang</th>
                <th className="px-6 py-4">Section</th>
                <th className="px-6 py-4">Konstruksi</th>
                <th className="px-6 py-4">Pelaksana</th>
                <th className="px-6 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredList.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold text-slate-900">{item.tglPelaksanaan}</div>
                    <div className="text-[10px] text-slate-400 font-mono">ID: {item.id}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-extrabold text-blue-600">{item.penyulang}</div>
                    <div className="text-xs font-semibold text-slate-500">Tiang No: {item.noTiang}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-slate-700 font-medium truncate max-w-[200px]">{item.section}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold">
                      {item.konstruksi || 'N/A'}
                    </span>
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
                    Belum ada data checklist inspeksi.
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
              className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[32px] shadow-2xl overflow-hidden flex flex-col border border-slate-200"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-600/20">
                    <ClipboardCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900 uppercase">
                      {editingId ? 'Edit Checklist Inspeksi' : 'Checklist Inspeksi JTM Baru'}
                    </h2>
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Lengkapi detail inspeksi aset di bawah ini</p>
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
                    { id: 'header', label: 'Informasi Umum', icon: <FileText className="w-3.5 h-3.5" /> },
                    { id: 'tiang', label: 'Tiang JTM', icon: <Zap className="w-3.5 h-3.5" /> },
                    { id: 'aksesoris', label: 'Aksesoris', icon: <ShieldCheck className="w-3.5 h-3.5" /> },
                    { id: 'supporter', label: 'Pole Supporter', icon: <Wrench className="w-3.5 h-3.5" /> },
                    { id: 'konduktor', label: 'Konduktor', icon: <Zap className="w-3.5 h-3.5" /> },
                    { id: 'isolator', label: 'Isolator', icon: <ShieldCheck className="w-3.5 h-3.5" /> },
                    { id: 'row', label: 'ROW & Lainnya', icon: <Trees className="w-3.5 h-3.5" /> }
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
                  
                  {/* SECTION: HEADER / INFORMASI UMUM */}
                  <div id="sec-header" className="space-y-6 pt-4">
                    <div className="flex items-center gap-3 border-l-4 border-blue-500 pl-4 py-1">
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Informasi Umum</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tgl Pelaksanaan</label>
                        <div className="relative">
                          <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input 
                            type="date" 
                            required
                            value={formData.tglPelaksanaan}
                            onChange={(e) => handleInputChange('tglPelaksanaan', e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all" 
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">GI / Pembangkit</label>
                        <input 
                          type="text" 
                          placeholder="Contoh: GI Passo"
                          value={formData.giPembangkit}
                          onChange={(e) => handleInputChange('giPembangkit', e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all" 
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">No Tiang</label>
                        <input 
                          type="text" 
                          placeholder="Contoh: TLH-42"
                          value={formData.noTiang}
                          onChange={(e) => handleInputChange('noTiang', e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all" 
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Penyulang</label>
                        <select 
                          required
                          value={formData.penyulang}
                          onChange={(e) => handleInputChange('penyulang', e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all appearance-none"
                        >
                          <option value="">Pilih Penyulang</option>
                          {penyulangList.map(p => (
                            <option key={p.id} value={p.namaPenyulang}>{p.namaPenyulang}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Section</label>
                        <input 
                          type="text" 
                          placeholder="Nama Section"
                          value={formData.section}
                          onChange={(e) => handleInputChange('section', e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all" 
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Pelaksana</label>
                        <div className="relative">
                          <UserIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input 
                            type="text" 
                            placeholder="Nama Petugas"
                            value={formData.pelaksana}
                            onChange={(e) => handleInputChange('pelaksana', e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all" 
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Koordinat X</label>
                        <input 
                          type="text" 
                          placeholder="Latitude"
                          value={formData.koordinatX}
                          onChange={(e) => handleInputChange('koordinatX', e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all" 
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Koordinat Y</label>
                        <input 
                          type="text" 
                          placeholder="Longitude"
                          value={formData.koordinatY}
                          onChange={(e) => handleInputChange('koordinatY', e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all" 
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Konstruksi</label>
                        <input 
                          type="text" 
                          placeholder="Contoh: TM-1"
                          value={formData.konstruksi}
                          onChange={(e) => handleInputChange('konstruksi', e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all" 
                        />
                      </div>
                    </div>
                  </div>

                  {/* SECTION: TIANG JTM */}
                  <div id="sec-tiang" className="space-y-6 pt-4">
                    <div className="flex items-center gap-3 border-l-4 border-emerald-500 pl-4 py-1">
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Bagian 1: TIANG JTM</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">1. Tinggi Tiang (m)</label>
                          <div className="flex flex-wrap gap-2">
                            {['7', '9', '11', '12', '13', '14'].map(val => (
                              <button
                                key={val}
                                type="button"
                                onClick={() => handleInputChange('tinggiTiang', val)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                                  formData.tinggiTiang === val 
                                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-600/20' 
                                    : 'bg-white border-slate-200 text-slate-600 hover:border-emerald-300'
                                }`}
                              >
                                {val}m
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">2. Kekuatan Tiang (daN)</label>
                          <div className="flex flex-wrap gap-2">
                            {['90', '100', '156', '200', '350'].map(val => (
                              <button
                                key={val}
                                type="button"
                                onClick={() => handleInputChange('kekuatanTiang', val)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                                  formData.kekuatanTiang === val 
                                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-600/20' 
                                    : 'bg-white border-slate-200 text-slate-600 hover:border-emerald-300'
                                }`}
                              >
                                {val}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">3. Jenis & Kepemilikan</label>
                          <div className="grid grid-cols-2 gap-4">
                            <select 
                              value={formData.jenisTiang}
                              onChange={(e) => handleInputChange('jenisTiang', e.target.value)}
                              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
                            >
                              <option value="">Jenis Tiang</option>
                              <option value="Beton">Beton</option>
                              <option value="Besi">Besi</option>
                              <option value="Kayu">Kayu</option>
                            </select>
                            <select 
                              value={formData.kepemilikan}
                              onChange={(e) => handleInputChange('kepemilikan', e.target.value)}
                              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
                            >
                              <option value="PLN">PLN</option>
                              <option value="Pemda">Pemda</option>
                              <option value="Pihak Lain">Pihak Lain</option>
                            </select>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">4. Kondisi Tiang (Multi-select)</label>
                          <div className="flex flex-wrap gap-2">
                            {['Baik', 'Berkarat', 'Miring', 'Retak', 'Keropos'].map(val => (
                              <button
                                key={val}
                                type="button"
                                onClick={() => handleToggleKondisiTiang(val)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                                  formData.kondisiTiang?.includes(val) 
                                    ? 'bg-rose-500 border-rose-500 text-white shadow-lg shadow-rose-500/20' 
                                    : 'bg-white border-slate-200 text-slate-600 hover:border-rose-300'
                                }`}
                              >
                                {val}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SECTION: AKSESORIS TIANG JTM */}
                  <div id="sec-aksesoris" className="space-y-6 pt-4">
                    <div className="flex items-center gap-3 border-l-4 border-amber-500 pl-4 py-1">
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Bagian 2: AKSESORIS TIANG JTM</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {[
                        { id: 'verlenkStick3M', label: '1. Verlenk Stick 3 M', options: ['Baik', 'Tdk Ada', 'Berkarat', 'Miring'] },
                        { id: 'crossArm', label: '2. Cross Arm', options: ['Baik', 'Berkarat', 'Keropos', 'Pendek'] },
                        { id: 'armTie', label: '3. Arm Tie', options: ['Baik', 'Berkarat', 'Miring', 'Keropos', 'Putus'] },
                        { id: 'bandStrap', label: '4. Band Strap', options: ['Baik', 'Berkarat', 'Putus'] },
                        { id: 'strainClamp', label: '5. Strain Clamp', options: ['Baik', 'Berkarat', 'Longgar', 'Putus'] },
                        { id: 'bautCrossArm', label: '6. Baut Cross Arm', options: ['Baik', 'Bengkok', 'Tdk Lengkap', 'Tdk Ada'] },
                        { id: 'groundWire', label: '7. Ground Wire', options: ['Baik', 'Rantas', 'Berkarat', 'Tdk Ada'] },
                        { id: 'wireClip', label: '8. Wire Clip', options: ['Baik', 'Tdk Ada'] },
                        { id: 'grounding', label: '9. Grounding', options: ['Baik', 'Putus', 'Tdk Ada'] },
                        { id: 'penghalangPanjat', label: '10. Penghalang Panjat', options: ['Baik', 'Tdk Ada'] },
                        { id: 'flangNet', label: '11. Flang Net', options: ['Baik', 'Miring', 'Berkarat', 'Tdk Ada'] }
                      ].map(field => (
                        <div key={field.id} className="space-y-2 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{field.label}</label>
                          <select 
                            value={(formData as any)[field.id]}
                            onChange={(e) => handleInputChange(field.id as any, e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none transition-all"
                          >
                            {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* SECTION: POLE SUPPORTER JTM */}
                  <div id="sec-supporter" className="space-y-6 pt-4">
                    <div className="flex items-center gap-3 border-l-4 border-indigo-500 pl-4 py-1">
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Bagian 3: POLE SUPPORTER JTM</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {[
                        { id: 'trackSchoor', label: '1. Track Schoor', options: ['Baik', 'Kendor', 'Putus', 'Rantas', 'Tdk Ada'] },
                        { id: 'dragSchoor', label: '2. Drag Schoor', options: ['Baik', 'Tdk Ada'] },
                        { id: 'kontraMast', label: '3. Kontra Mast', options: ['Baik', 'Tdk Ada'] },
                        { id: 'guyInsulator', label: '4. Guy Insulator', options: ['Baik', 'Longgar', 'Lepas', 'Tdk Ada'] },
                        { id: 'pondasi', label: '5. Pondasi', options: ['Baik', 'Retak', 'Tdk Ada'] }
                      ].map(field => (
                        <div key={field.id} className="space-y-2 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{field.label}</label>
                          <select 
                            value={(formData as any)[field.id]}
                            onChange={(e) => handleInputChange(field.id as any, e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                          >
                            {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* SECTION: KONDUKTOR */}
                  <div id="sec-konduktor" className="space-y-6 pt-4">
                    <div className="flex items-center gap-3 border-l-4 border-orange-500 pl-4 py-1">
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Bagian 4: KONDUKTOR</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">1. Lokasi Penempatan</label>
                        <div className="flex gap-2">
                          {['SKTM', 'SUTM', 'SKUTM'].map(val => (
                            <button
                              key={val}
                              type="button"
                              onClick={() => handleInputChange('lokasiPenempatan', val)}
                              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border ${
                                formData.lokasiPenempatan === val 
                                  ? 'bg-orange-600 border-orange-600 text-white shadow-lg shadow-orange-600/20' 
                                  : 'bg-white border-slate-200 text-slate-600'
                              }`}
                            >
                              {val}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">2. Penampang (mm2)</label>
                        <select 
                          value={formData.penampangKonduktor}
                          onChange={(e) => handleInputChange('penampangKonduktor', e.target.value)}
                          className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none"
                        >
                          <option value="">Pilih Penampang</option>
                          {['70', '90', '110', '150', '240', '300'].map(val => <option key={val} value={val}>{val} mm2</option>)}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">3. Jenis Konduktor</label>
                        <select 
                          value={formData.jenisKonduktor}
                          onChange={(e) => handleInputChange('jenisKonduktor', e.target.value)}
                          className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none"
                        >
                          <option value="">Pilih Jenis</option>
                          {['A3C', 'ACSR', 'A3Cs', 'A3COC', 'MVTC', 'XLPE'].map(val => <option key={val} value={val}>{val}</option>)}
                        </select>
                      </div>
                      {[
                        { id: 'kondisiKonduktor', label: '4. Kondisi Konduktor', options: ['Baik', 'Rantas'] },
                        { id: 'jenisJumperan', label: '5. Jenis Jumperan', options: ['LLC', 'Joint', 'Line Tap', 'Paralel'] },
                        { id: 'kondisiJumperan', label: '6. Kondisi Jumperan', options: ['Baik', 'Rantas', 'Telanjang'] },
                        { id: 'kondisiAndongan', label: '7. Kondisi Andongan', options: ['Baik', 'Kendor'] },
                        { id: 'bendingIsolator', label: '8. Bending Isolator', options: ['Top Ties', 'Tekep', 'Cover Pin', 'Isolasi', 'Alumunium'] },
                        { id: 'kondisiBending', label: '9. Kondisi Bending', options: ['Baik', 'Rantas'] }
                      ].map(field => (
                        <div key={field.id} className="space-y-2 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{field.label}</label>
                          <select 
                            value={(formData as any)[field.id]}
                            onChange={(e) => handleInputChange(field.id as any, e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all"
                          >
                            {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* SECTION: ISOLATOR */}
                  <div id="sec-isolator" className="space-y-6 pt-4">
                    <div className="flex items-center gap-3 border-l-4 border-rose-500 pl-4 py-1">
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Bagian 5: ISOLATOR</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {[
                        { id: 'isolatorTumpu', label: '1. Isolator Tumpu', options: ['Baik', 'Lama/Kaca', 'Kotor', 'Pecah', 'Flash Over', 'Line Post'] },
                        { id: 'isolatorTarik', label: '2. Isolator Tarik', options: ['Baik', 'Lama/Kaca', 'Kotor', 'Pecah', 'Flash Over'] },
                        { id: 'isolatorGantung', label: '3. Isolator Gantung', options: ['Baik', 'Lama/Kaca', 'Kotor', 'Pecah', 'Flash Over'] },
                        { id: 'sepatuKabel', label: '4. Sepatu Kabel', options: ['2 Lubang', '1 Lubang'] },
                        { id: 'terminasi', label: '5. Terminasi', options: ['Baik', 'Cacat'] },
                        { id: 'lightingArrester', label: '6. Lighting Arrester', options: ['Baik', 'Keramik', 'Retak', 'Lepas/Tdk Ada'] },
                        { id: 'cutOut', label: '7. Cut Out', options: ['Baik', 'Keramik', 'Retak'] }
                      ].map(field => (
                        <div key={field.id} className="space-y-2 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{field.label}</label>
                          <select 
                            value={(formData as any)[field.id]}
                            onChange={(e) => handleInputChange(field.id as any, e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 outline-none transition-all"
                          >
                            {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                          </select>
                        </div>
                      ))}
                      <div className="md:col-span-2 lg:col-span-2 space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">8. Konstruksi Seharusnya</label>
                        <input 
                          type="text" 
                          placeholder="Keterangan Konstruksi Seharusnya"
                          value={formData.konstruksiSeharusnya}
                          onChange={(e) => handleInputChange('konstruksiSeharusnya', e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none" 
                        />
                      </div>
                    </div>
                  </div>

                  {/* SECTION: ROW & LAINNYA */}
                  <div id="sec-row" className="space-y-6 pt-4">
                    <div className="flex items-center gap-3 border-l-4 border-green-500 pl-4 py-1">
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Bagian 6: ROW & LAINNYA</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {[
                        { id: 'pohon', label: '1. Pohon', options: ['Tdk Ada', '> 2.5 m', '1-2.5 m', '< 1 m', 'Menempel'] },
                        { id: 'layangLayang', label: '2. Layang-layang', options: ['Tdk Ada', 'Benang', 'Kerangka', 'Menempel'] },
                        { id: 'bangunanBaliho', label: '3. Bangunan / Baliho', options: ['Tdk Ada', '> 2.5 m', '1-2.5 m', '< 1 m', 'Menempel'] },
                        { id: 'umbulUmbul', label: '4. Umbul-umbul', options: ['Tdk Ada', '> 2.5 m', '1-2.5 m', '< 1 m', 'Menempel'] }
                      ].map(field => (
                        <div key={field.id} className="space-y-2 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{field.label}</label>
                          <select 
                            value={(formData as any)[field.id]}
                            onChange={(e) => handleInputChange(field.id as any, e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all"
                          >
                            {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                          </select>
                        </div>
                      ))}
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Jenis Pohon</label>
                        <input 
                          type="text" 
                          placeholder="Jenis Pohon"
                          value={formData.jenisPohon}
                          onChange={(e) => handleInputChange('jenisPohon', e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Jumlah Pohon</label>
                        <input 
                          type="number" 
                          placeholder="Jumlah"
                          value={formData.jumlahPohon}
                          onChange={(e) => handleInputChange('jumlahPohon', e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none" 
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Kondisi Temuan Lain</label>
                      <textarea 
                        rows={4}
                        placeholder="Catat temuan lainnya di sini..."
                        value={formData.kondisiTemuanLain}
                        onChange={(e) => handleInputChange('kondisiTemuanLain', e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-[24px] text-sm font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all resize-none" 
                      />
                    </div>
                  </div>

                </form>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/50 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2.5 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded-2xl text-sm font-bold transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  onClick={handleSave}
                  className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-sm font-black shadow-xl shadow-blue-600/20 active:scale-95 transition-all cursor-pointer"
                >
                  {editingId ? 'Simpan Perubahan' : 'Simpan Checklist'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
