import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Plus, 
  Search, 
  Download, 
  Trash2, 
  Pencil, 
  X, 
  Save, 
  Calendar,
  ChevronLeft,
  ChevronRight,
  Phone,
  User as UserIcon,
  Building2
} from 'lucide-react';
import { JadwalPiket } from '../../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { TableSkeletonLoader } from '../common/TableSkeletonLoader';

interface JadwalPiketViewProps {
  jadwalList: JadwalPiket[];
  onAdd: (data: Omit<JadwalPiket, 'id'>) => void;
  onUpdate: (id: string, data: Partial<JadwalPiket>) => void;
  onDelete: (id: string) => void;
  isLoading?: boolean;
}

export const JadwalPiketView: React.FC<JadwalPiketViewProps> = ({
  jadwalList,
  onAdd,
  onUpdate,
  onDelete,
  isLoading = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Date selection (default to August 2026 for context)
  const [currentMonth, setCurrentMonth] = useState(7); // 0-indexed, 7 is August
  const [currentYear, setCurrentYear] = useState(2026);

  // Form State
  const [formData, setFormData] = useState<Omit<JadwalPiket, 'id' | 'lastUpdate'>>({
    namaPetugas: '',
    noHp: '',
    unit: 'ULC BAGUALA',
    jadwal: {}
  });

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const monthName = new Intl.DateTimeFormat('id-ID', { month: 'long' }).format(new Date(currentYear, currentMonth));

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleShiftChange = (day: number, shift: string) => {
    setFormData(prev => ({
      ...prev,
      jadwal: {
        ...prev.jadwal,
        [day]: shift
      }
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      onUpdate(editingId, { ...formData, lastUpdate: new Date().toISOString() });
      setEditingId(null);
    } else {
      onAdd({ ...formData, lastUpdate: new Date().toISOString() });
      setIsAdding(false);
    }
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      namaPetugas: '',
      noHp: '',
      unit: 'ULC BAGUALA',
      jadwal: {}
    });
  };

  const handleEdit = (item: JadwalPiket) => {
    setFormData({
      namaPetugas: item.namaPetugas,
      noHp: item.noHp,
      unit: item.unit,
      jadwal: item.jadwal
    });
    setEditingId(item.id);
    setIsAdding(true);
  };

  const filteredList = jadwalList.filter(item => 
    item.namaPetugas.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.unit.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group by unit
  const units: string[] = Array.from(new Set(jadwalList.map(item => item.unit)));
  if (units.length === 0) units.push('ULC BAGUALA');

  const getDayName = (day: number) => {
    const date = new Date(currentYear, currentMonth, day);
    return new Intl.DateTimeFormat('id-ID', { weekday: 'short' }).format(date).toUpperCase();
  };

  const isSunday = (day: number) => {
    const date = new Date(currentYear, currentMonth, day);
    return date.getDay() === 0;
  };

  const handleExportPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

    // Kop Header PLN
    doc.setFillColor(30, 58, 138); // Blue 900
    doc.rect(0, 0, 297, 16, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('PT PLN (PERSERO) UIW MMU - UP3 AMBON - ULP BAGUALA', 10, 10);

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text(`JADWAL PIKET PETUGAS OPERASIONAL & PELAYANAN TEKNIK`, 10, 24);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(
      `Periode: ${monthName.toUpperCase()} ${currentYear} | Total Petugas: ${filteredList.length} Personel | Dicetak: ${new Date().toLocaleDateString('id-ID')}`,
      10,
      30
    );

    // Keterangan Shift
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('Keterangan Shift:  P: Pagi (08:00 - 16:00) | S: Siang (16:00 - 00:00) | M: Malam (00:00 - 08:00) | L: Libur / Off', 10, 35);

    // Build Table Header
    const dayHeaders = Array.from({ length: daysInMonth }, (_, i) => (i + 1).toString());
    const tableHeader = ['No', 'Nama Petugas', 'Unit / KP', 'No HP', ...dayHeaders];

    // Build Table Rows
    const tableBody: any[] = [];

    let counter = 1;
    units.forEach((u) => {
      const unitPetugas = filteredList.filter((p) => p.unit === u);
      if (unitPetugas.length === 0) return;

      // Unit Header Row
      tableBody.push([
        {
          content: `UNIT / KP: ${(u || 'ULP BAGUALA').toUpperCase()}`,
          colSpan: daysInMonth + 4,
          styles: { fillColor: [226, 232, 240], fontStyle: 'bold', textColor: [15, 23, 42], halign: 'left' }
        }
      ]);

      unitPetugas.forEach((p) => {
        const shifts = Array.from({ length: daysInMonth }, (_, i) => p.jadwal[i + 1] || '-');
        tableBody.push([
          counter++,
          p.namaPetugas,
          p.unit,
          p.noHp || '-',
          ...shifts
        ]);
      });
    });

    autoTable(doc, {
      startY: 38,
      head: [tableHeader],
      body: tableBody,
      theme: 'grid',
      styles: { fontSize: 6.5, cellPadding: 1, halign: 'center', valign: 'middle' },
      headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: 'bold', halign: 'center' },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        1: { cellWidth: 35, halign: 'left', fontStyle: 'bold' },
        2: { cellWidth: 20, halign: 'center' },
        3: { cellWidth: 22, halign: 'center' }
      },
      margin: { left: 10, right: 10 }
    });

    const finalY = (doc as any).lastAutoTable?.finalY || 160;

    // Signature Slots if space permits
    if (finalY + 30 < 200) {
      const sigY = finalY + 12;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 41, 59);

      doc.text('Ambon, ' + new Date().toLocaleDateString('id-ID'), 220, sigY);
      doc.text('Manager ULP Baguala', 220, sigY + 4);

      doc.text('Mengetahui,', 20, sigY);
      doc.text('Supervisor Teknik ULP Baguala', 20, sigY + 4);

      doc.setFont('helvetica', 'bold');
      doc.text('( ........................................... )', 220, sigY + 22);
      doc.text('( ........................................... )', 20, sigY + 22);
    }

    doc.save(`Jadwal_Piket_Petugas_${monthName}_${currentYear}.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <div className="p-2 bg-rose-600 text-white rounded-xl shadow-lg shadow-rose-200">
              <Calendar className="w-6 h-6" />
            </div>
            Jadwal Piket Petugas
          </h2>
          <p className="text-slate-500 font-medium mt-1">Manajemen shift dan kehadiran tim lapangan {monthName} {currentYear}</p>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => {
              setIsAdding(!isAdding);
              if (isAdding) setEditingId(null);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-all shadow-md shadow-rose-100 cursor-pointer"
          >
            {isAdding ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {isAdding ? 'Batal' : 'Tambah Petugas'}
          </button>
          <button 
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-4 py-2.5 text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all shadow-sm font-bold text-xs cursor-pointer active:scale-95"
            title="Export PDF Jadwal Piket Petugas"
          >
            <Download className="w-4 h-4 text-rose-600" />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* Add/Edit Form Overlay */}
      {isAdding && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xl"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <UserIcon className="w-5 h-5 text-rose-600" />
                {editingId ? 'Edit Jadwal Petugas' : 'Input Petugas Baru'}
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 text-left">Nama Petugas</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    name="namaPetugas"
                    value={formData.namaPetugas}
                    onChange={handleInputChange}
                    placeholder="Contoh: AKRAMANTO RIDWAN"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 text-left">Nomor HP / WhatsApp</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    name="noHp"
                    value={formData.noHp}
                    onChange={handleInputChange}
                    placeholder="0812xxxx"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 text-left">Unit / KP</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select
                    name="unit"
                    value={formData.unit}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none"
                  >
                    <option value="ULC BAGUALA">ULC BAGUALA</option>
                    <option value="KP POKA">KP POKA</option>
                    <option value="KP LAHA">KP LAHA</option>
                    <option value="KP GALALA">KP GALALA</option>
                    <option value="KP PASSO">KP PASSO</option>
                    <option value="KP TULEHU">KP TULEHU</option>
                    <option value="KP ALLANG">KP ALLANG</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-black text-rose-900 uppercase tracking-widest">Input Jadwal Shift (P: Pagi, S: Siang, M: Malam, L: Libur)</span>
                <div className="flex gap-4 text-[10px] font-bold text-rose-700">
                  <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500" /> P: 08:00 - 16:00</span>
                  <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-500" /> S: 16:00 - 00:00</span>
                  <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-indigo-500" /> M: 00:00 - 08:00</span>
                </div>
              </div>
              
              <div className="grid grid-cols-7 md:grid-cols-10 lg:grid-cols-15 gap-2">
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => (
                  <div key={day} className="space-y-1 text-center">
                    <span className={`text-[9px] font-bold ${isSunday(day) ? 'text-rose-600' : 'text-slate-400'}`}>
                      {day} {getDayName(day).substring(0, 3)}
                    </span>
                    <select
                      value={formData.jadwal[day] || ''}
                      onChange={(e) => handleShiftChange(day, e.target.value)}
                      className={`w-full text-center py-1 text-xs font-bold border rounded-lg appearance-none outline-none ${
                        formData.jadwal[day] === 'L' ? 'bg-slate-100 border-slate-200 text-slate-400' :
                        formData.jadwal[day] === 'P' ? 'bg-blue-100 border-blue-200 text-blue-600' :
                        formData.jadwal[day] === 'S' ? 'bg-amber-100 border-amber-200 text-amber-600' :
                        formData.jadwal[day] === 'M' ? 'bg-indigo-100 border-indigo-200 text-indigo-600' :
                        'bg-white border-slate-200 text-slate-300'
                      }`}
                    >
                      <option value="">-</option>
                      <option value="P">P</option>
                      <option value="S">S</option>
                      <option value="M">M</option>
                      <option value="L">L</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  setEditingId(null);
                }}
                className="px-6 py-2.5 text-slate-600 font-bold hover:bg-slate-50 rounded-xl transition-all"
              >
                Batal
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 px-8 py-2.5 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-all shadow-lg shadow-rose-200"
              >
                <Save className="w-4 h-4" />
                {editingId ? 'Simpan Perubahan' : 'Simpan Jadwal'}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Search & Month Navigation */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari petugas atau unit..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-rose-500/20"
          />
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => setCurrentMonth(prev => prev === 0 ? 11 : prev - 1)}
            className="p-2 text-slate-400 hover:bg-slate-50 rounded-full transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="text-center min-w-[140px]">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Periode</p>
            <p className="text-sm font-black text-slate-900">{monthName} {currentYear}</p>
          </div>
          <button 
            onClick={() => setCurrentMonth(prev => prev === 11 ? 0 : prev + 1)}
            className="p-2 text-slate-400 hover:bg-slate-50 rounded-full transition-all"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Schedule Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden overflow-x-auto">
        {isLoading ? (
          <TableSkeletonLoader columns={12} rows={8} headerTitle="Jadwal Piket Petugas" />
        ) : (
          <table className="w-full text-left border-collapse min-w-[1200px]">
          <thead>
            <tr className="bg-slate-900 text-white text-[10px] font-bold uppercase tracking-wider">
              <th className="px-4 py-4 border border-slate-800 text-center sticky left-0 bg-slate-900 z-10 w-12">NO</th>
              <th className="px-4 py-4 border border-slate-800 sticky left-12 bg-slate-900 z-10 min-w-[200px]">NAMA PETUGAS</th>
              <th className="px-4 py-4 border border-slate-800 text-center min-w-[140px]">NO HP</th>
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => (
                <th 
                  key={day} 
                  className={`px-1 py-4 border border-slate-800 text-center min-w-[40px] ${isSunday(day) ? 'bg-rose-900 text-rose-200' : ''}`}
                >
                  <div className="flex flex-col items-center leading-none gap-1">
                    <span className="text-[8px] opacity-60 font-medium">{getDayName(day)}</span>
                    <span className="text-xs">{day}</span>
                  </div>
                </th>
              ))}
              <th className="px-4 py-4 border border-slate-800 text-center w-24">AKSI</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {units.map((unit, uIdx) => {
              const unitPetugas = filteredList.filter(p => p.unit === unit);
              if (unitPetugas.length === 0) return null;

              return (
                <React.Fragment key={`piket_grp_${unit}_${uIdx}`}>
                  <tr className="bg-slate-50/80">
                    <td colSpan={daysInMonth + 4} className="px-4 py-2.5">
                      <h4 className="text-xs font-black text-slate-900 tracking-widest uppercase flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-rose-600" />
                        {unit}
                      </h4>
                    </td>
                  </tr>
                  {unitPetugas.map((item, index) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-4 py-4 text-xs font-bold text-slate-400 text-center sticky left-0 bg-white group-hover:bg-slate-50 z-10 border-r border-slate-100">
                        {index + 1}
                      </td>
                      <td className="px-4 py-4 text-xs font-black text-slate-900 sticky left-12 bg-white group-hover:bg-slate-50 z-10 border-r border-slate-100">
                        {item.namaPetugas}
                      </td>
                      <td className="px-4 py-4 text-xs font-medium text-slate-500 text-center">
                        {item.noHp || '-'}
                      </td>
                      {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                        const shift = item.jadwal[day];
                        return (
                          <td 
                            key={day} 
                            className={`px-1 py-4 text-xs font-bold text-center border-r border-slate-50 ${isSunday(day) ? 'bg-rose-50/30' : ''}`}
                          >
                            <span className={
                              shift === 'L' ? 'text-slate-300' :
                              shift === 'P' ? 'text-blue-600' :
                              shift === 'S' ? 'text-amber-600' :
                              shift === 'M' ? 'text-indigo-600' :
                              'text-slate-200'
                            }>
                              {shift || '-'}
                            </span>
                          </td>
                        );
                      })}
                      <td className="px-4 py-4 text-center">
                        <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEdit(item)}
                            className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all"
                            title="Edit Jadwal"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm('Hapus data petugas ini?')) {
                                onDelete(item.id);
                              }
                            }}
                            className="p-1.5 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-all"
                            title="Hapus Petugas"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              );
            })}

            {filteredList.length === 0 && (
              <tr>
                <td colSpan={daysInMonth + 4} className="px-4 py-20 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <Calendar className="w-12 h-12 text-slate-200" />
                    <p className="text-slate-400 font-medium">Belum ada data jadwal piket.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
        )}
      </div>

      {/* Legend / Info Footer */}
      <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-wrap gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-black text-xs">P</div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Shift Pagi</p>
              <p className="text-sm font-bold">08:00 - 16:00</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-600 flex items-center justify-center font-black text-xs">S</div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Shift Siang</p>
              <p className="text-sm font-bold">16:00 - 00:00</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-black text-xs">M</div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Shift Malam</p>
              <p className="text-sm font-bold">00:00 - 08:00</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center font-black text-xs">L</div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Status</p>
              <p className="text-sm font-bold">Libur / Off</p>
            </div>
          </div>
        </div>
        
        <div className="text-right hidden md:block">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Keterangan</p>
          <p className="text-sm text-slate-400 max-w-[200px]">Data diperbarui setiap bulan sesuai penetapan unit.</p>
        </div>
      </div>
    </div>
  );
};
