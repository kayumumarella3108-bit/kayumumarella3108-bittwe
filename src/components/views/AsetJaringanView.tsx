import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Trash2, 
  Pencil, 
  X, 
  Save, 
  Network,
  ChevronRight,
  Database,
  ArrowRight
} from 'lucide-react';
import { AsetJaringan, Penyulang } from '../../types';

interface AsetJaringanViewProps {
  asetList: AsetJaringan[];
  penyulangList: Penyulang[];
  onAdd: (data: Omit<AsetJaringan, 'id'>) => void;
  onUpdate: (id: string, data: Partial<AsetJaringan>) => void;
  onDelete: (id: string) => void;
}

export const AsetJaringanView: React.FC<AsetJaringanViewProps> = ({
  asetList,
  penyulangList,
  onAdd,
  onUpdate,
  onDelete
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form State
  const [formData, setFormData] = useState<Omit<AsetJaringan, 'id' | 'lastUpdate'>>({
    namaPenyulang: '',
    panjangJtmSutm: 0,
    panjangJtmSktm: 0,
    panjangJtmMvtic: 0,
    panjangJtmTotal: 0,
    lbsManual: 0,
    lbsMotorized: 0,
    lbsThreeWay: 0,
    recloser: 0,
    garduHubung: 0,
    pmcb: 0,
    autoLink: 0,
    fco: 0,
    scada: 0,
    nonScada: 0,
    panjangJtr: 0
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'number' ? parseFloat(value) || 0 : value;
    
    setFormData(prev => {
      const next = { ...prev, [name]: val };
      
      // Auto-calculate total JTM if parts change
      if (['panjangJtmSutm', 'panjangJtmSktm', 'panjangJtmMvtic'].includes(name)) {
        next.panjangJtmTotal = 
          (next.panjangJtmSutm || 0) + 
          (next.panjangJtmSktm || 0) + 
          (next.panjangJtmMvtic || 0);
      }
      
      return next;
    });
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
      namaPenyulang: '',
      panjangJtmSutm: 0,
      panjangJtmSktm: 0,
      panjangJtmMvtic: 0,
      panjangJtmTotal: 0,
      lbsManual: 0,
      lbsMotorized: 0,
      lbsThreeWay: 0,
      recloser: 0,
      garduHubung: 0,
      pmcb: 0,
      autoLink: 0,
      fco: 0,
      scada: 0,
      nonScada: 0,
      panjangJtr: 0
    });
  };

  const handleEdit = (item: AsetJaringan) => {
    setFormData({
      namaPenyulang: item.namaPenyulang,
      panjangJtmSutm: item.panjangJtmSutm,
      panjangJtmSktm: item.panjangJtmSktm,
      panjangJtmMvtic: item.panjangJtmMvtic,
      panjangJtmTotal: item.panjangJtmTotal,
      lbsManual: item.lbsManual,
      lbsMotorized: item.lbsMotorized,
      lbsThreeWay: item.lbsThreeWay,
      recloser: item.recloser,
      garduHubung: item.garduHubung,
      pmcb: item.pmcb,
      autoLink: item.autoLink,
      fco: item.fco,
      scada: item.scada,
      nonScada: item.nonScada,
      panjangJtr: item.panjangJtr
    });
    setEditingId(item.id);
    setIsAdding(true);
  };

  const filteredList = asetList.filter(item => 
    item.namaPenyulang.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <div className="p-2 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-200">
              <Network className="w-6 h-6" />
            </div>
            Data Aset Jaringan (JTM & JTR)
          </h2>
          <p className="text-slate-500 font-medium mt-1">Inventarisasi infrastruktur jaringan distribusi 20kV</p>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => {
              setIsAdding(!isAdding);
              if (isAdding) setEditingId(null);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-md shadow-blue-100"
          >
            {isAdding ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {isAdding ? 'Batal' : 'Tambah Aset'}
          </button>
          <button className="p-2.5 text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all shadow-sm">
            <Download className="w-5 h-5" />
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
                <Database className="w-5 h-5 text-blue-600" />
                {editingId ? 'Edit Data Aset' : 'Input Data Aset Baru'}
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Basic Info */}
              <div className="md:col-span-1 space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Penyulang</label>
                  <select
                    name="namaPenyulang"
                    value={formData.namaPenyulang}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                    required
                  >
                    <option value="">Pilih Penyulang</option>
                    {penyulangList.map(p => (
                      <option key={p.id} value={p.namaPenyulang}>{p.namaPenyulang}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Panjang JTR (kms)</label>
                  <input
                    type="number"
                    step="0.001"
                    name="panjangJtr"
                    value={formData.panjangJtr}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                  />
                </div>
              </div>

              {/* JTM Section */}
              <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                <div className="md:col-span-4 flex items-center gap-2 mb-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  <span className="text-xs font-black text-blue-900 uppercase tracking-widest">Panjang JTM (kms)</span>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-blue-700/60 uppercase mb-1">SUTM</label>
                  <input
                    type="number"
                    step="0.001"
                    name="panjangJtmSutm"
                    value={formData.panjangJtmSutm}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-blue-700/60 uppercase mb-1">SKTM</label>
                  <input
                    type="number"
                    step="0.001"
                    name="panjangJtmSktm"
                    value={formData.panjangJtmSktm}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-blue-700/60 uppercase mb-1">MVTIC</label>
                  <input
                    type="number"
                    step="0.001"
                    name="panjangJtmMvtic"
                    value={formData.panjangJtmMvtic}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-blue-700/60 uppercase mb-1">TOTAL JTM</label>
                  <input
                    type="number"
                    readOnly
                    value={formData.panjangJtmTotal}
                    className="w-full px-3 py-2 bg-blue-100 border border-blue-200 rounded-lg text-sm font-bold text-blue-900 outline-none"
                  />
                </div>
              </div>

              {/* Peralatan Section */}
              <div className="md:col-span-4 grid grid-cols-2 md:grid-cols-6 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">LBS Manual</label>
                  <input type="number" name="lbsManual" value={formData.lbsManual} onChange={handleInputChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">LBS Motorized</label>
                  <input type="number" name="lbsMotorized" value={formData.lbsMotorized} onChange={handleInputChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">LBS 3-Way</label>
                  <input type="number" name="lbsThreeWay" value={formData.lbsThreeWay} onChange={handleInputChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Recloser</label>
                  <input type="number" name="recloser" value={formData.recloser} onChange={handleInputChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Gardu Hubung</label>
                  <input type="number" name="garduHubung" value={formData.garduHubung} onChange={handleInputChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">PMCB</label>
                  <input type="number" name="pmcb" value={formData.pmcb} onChange={handleInputChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Auto Link</label>
                  <input type="number" name="autoLink" value={formData.autoLink} onChange={handleInputChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">FCO</label>
                  <input type="number" name="fco" value={formData.fco} onChange={handleInputChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">SCADA</label>
                  <input type="number" name="scada" value={formData.scada} onChange={handleInputChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Non-SCADA</label>
                  <input type="number" name="nonScada" value={formData.nonScada} onChange={handleInputChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
                </div>
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
                className="flex items-center gap-2 px-8 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
              >
                <Save className="w-4 h-4" />
                {editingId ? 'Simpan Perubahan' : 'Simpan Data'}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Table Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari penyulang..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">
              <Filter className="w-3.5 h-3.5" />
              Filter
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white text-[10px] font-bold uppercase tracking-wider">
                <th rowSpan={2} className="px-4 py-4 border border-slate-800 text-center sticky left-0 bg-slate-900 z-10">Nama Penyulang</th>
                <th colSpan={4} className="px-4 py-2 border border-slate-800 text-center">Panjang JTM (kms)</th>
                <th rowSpan={2} className="px-4 py-4 border border-slate-800 text-center">LBS Manual</th>
                <th rowSpan={2} className="px-4 py-4 border border-slate-800 text-center">LBS Motorized</th>
                <th rowSpan={2} className="px-4 py-4 border border-slate-800 text-center">LBS 3-Way</th>
                <th rowSpan={2} className="px-4 py-4 border border-slate-800 text-center">Recloser</th>
                <th rowSpan={2} className="px-4 py-4 border border-slate-800 text-center">Gardu Hubung</th>
                <th rowSpan={2} className="px-4 py-4 border border-slate-800 text-center">PMCB</th>
                <th rowSpan={2} className="px-4 py-4 border border-slate-800 text-center">Auto Link</th>
                <th rowSpan={2} className="px-4 py-4 border border-slate-800 text-center">FCO</th>
                <th rowSpan={2} className="px-4 py-4 border border-slate-800 text-center">SCADA</th>
                <th rowSpan={2} className="px-4 py-4 border border-slate-800 text-center">Non-SCADA</th>
                <th rowSpan={2} className="px-4 py-4 border border-slate-800 text-center">Panjang JTR (kms)</th>
                <th rowSpan={2} className="px-4 py-4 border border-slate-800 text-center">Aksi</th>
              </tr>
              <tr className="bg-slate-800 text-white text-[9px] font-bold uppercase tracking-wider">
                <th className="px-3 py-2 border border-slate-700 text-center">SUTM</th>
                <th className="px-3 py-2 border border-slate-700 text-center">SKTM</th>
                <th className="px-3 py-2 border border-slate-700 text-center">MVTIC</th>
                <th className="px-3 py-2 border border-slate-700 text-center bg-blue-900">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredList.length > 0 ? (
                filteredList.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-4 py-4 text-sm font-bold text-slate-900 sticky left-0 bg-white group-hover:bg-slate-50 border-r border-slate-100">
                      {item.namaPenyulang}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600 text-center">{item.panjangJtmSutm.toFixed(3)}</td>
                    <td className="px-4 py-4 text-sm text-slate-600 text-center">{item.panjangJtmSktm.toFixed(3)}</td>
                    <td className="px-4 py-4 text-sm text-slate-600 text-center">{item.panjangJtmMvtic.toFixed(3)}</td>
                    <td className="px-4 py-4 text-sm font-black text-blue-700 text-center bg-blue-50/30">{item.panjangJtmTotal.toFixed(3)}</td>
                    <td className="px-4 py-4 text-sm text-slate-600 text-center font-medium">{item.lbsManual}</td>
                    <td className="px-4 py-4 text-sm text-slate-600 text-center font-medium">{item.lbsMotorized}</td>
                    <td className="px-4 py-4 text-sm text-slate-600 text-center font-medium">{item.lbsThreeWay}</td>
                    <td className="px-4 py-4 text-sm text-slate-600 text-center font-medium">{item.recloser}</td>
                    <td className="px-4 py-4 text-sm text-slate-600 text-center font-medium">{item.garduHubung}</td>
                    <td className="px-4 py-4 text-sm text-slate-600 text-center font-medium">{item.pmcb}</td>
                    <td className="px-4 py-4 text-sm text-slate-600 text-center font-medium">{item.autoLink}</td>
                    <td className="px-4 py-4 text-sm text-slate-600 text-center font-medium">{item.fco}</td>
                    <td className="px-4 py-4 text-sm text-slate-600 text-center font-medium">{item.scada}</td>
                    <td className="px-4 py-4 text-sm text-slate-600 text-center font-medium">{item.nonScada}</td>
                    <td className="px-4 py-4 text-sm text-slate-600 text-center font-medium">{item.panjangJtr.toFixed(3)}</td>
                    <td className="px-4 py-4 text-center border-l border-slate-100">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all cursor-pointer"
                          title="Edit Aset"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm('Hapus data aset ini?')) {
                              onDelete(item.id);
                            }
                          }}
                          className="p-2 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-all cursor-pointer"
                          title="Hapus Aset"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={17} className="px-4 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="p-4 bg-slate-50 text-slate-300 rounded-full">
                        <Database className="w-12 h-12" />
                      </div>
                      <p className="text-slate-400 font-medium">Belum ada data aset jaringan.</p>
                      <button 
                        onClick={() => setIsAdding(true)}
                        className="text-blue-600 font-bold hover:underline"
                      >
                        Tambah data pertama &raquo;
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
            {filteredList.length > 0 && (
              <tfoot className="bg-slate-50/50 font-black text-slate-900 border-t border-slate-200">
                <tr>
                  <td className="px-4 py-4 text-xs uppercase sticky left-0 bg-slate-50 border-r border-slate-200">TOTAL UNIT/KMS</td>
                  <td className="px-4 py-4 text-sm text-center">{filteredList.reduce((acc, curr) => acc + curr.panjangJtmSutm, 0).toFixed(3)}</td>
                  <td className="px-4 py-4 text-sm text-center">{filteredList.reduce((acc, curr) => acc + curr.panjangJtmSktm, 0).toFixed(3)}</td>
                  <td className="px-4 py-4 text-sm text-center">{filteredList.reduce((acc, curr) => acc + curr.panjangJtmMvtic, 0).toFixed(3)}</td>
                  <td className="px-4 py-4 text-sm text-center text-blue-700 bg-blue-100/50">{filteredList.reduce((acc, curr) => acc + curr.panjangJtmTotal, 0).toFixed(3)}</td>
                  <td className="px-4 py-4 text-sm text-center">{filteredList.reduce((acc, curr) => acc + curr.lbsManual, 0)}</td>
                  <td className="px-4 py-4 text-sm text-center">{filteredList.reduce((acc, curr) => acc + curr.lbsMotorized, 0)}</td>
                  <td className="px-4 py-4 text-sm text-center">{filteredList.reduce((acc, curr) => acc + curr.lbsThreeWay, 0)}</td>
                  <td className="px-4 py-4 text-sm text-center">{filteredList.reduce((acc, curr) => acc + curr.recloser, 0)}</td>
                  <td className="px-4 py-4 text-sm text-center">{filteredList.reduce((acc, curr) => acc + curr.garduHubung, 0)}</td>
                  <td className="px-4 py-4 text-sm text-center">{filteredList.reduce((acc, curr) => acc + curr.pmcb, 0)}</td>
                  <td className="px-4 py-4 text-sm text-center">{filteredList.reduce((acc, curr) => acc + curr.autoLink, 0)}</td>
                  <td className="px-4 py-4 text-sm text-center">{filteredList.reduce((acc, curr) => acc + curr.fco, 0)}</td>
                  <td className="px-4 py-4 text-sm text-center">{filteredList.reduce((acc, curr) => acc + curr.scada, 0)}</td>
                  <td className="px-4 py-4 text-sm text-center">{filteredList.reduce((acc, curr) => acc + curr.nonScada, 0)}</td>
                  <td className="px-4 py-4 text-sm text-center">{filteredList.reduce((acc, curr) => acc + curr.panjangJtr, 0).toFixed(3)}</td>
                  <td className="px-4 py-4"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-blue-600 rounded-2xl p-6 text-white shadow-xl shadow-blue-200 flex flex-col md:flex-row md:items-center justify-between gap-6 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
        <div className="relative z-10">
          <h3 className="text-xl font-black flex items-center gap-2">
            Ringkasan Asset Jaringan Terdata
          </h3>
          <p className="text-blue-100 mt-1 max-w-lg">
            Gunakan data ini untuk perencanaan pemeliharaan preventif dan estimasi kebutuhan material perbaikan jaringan 20kV.
          </p>
        </div>
        <div className="flex gap-4 relative z-10">
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20">
            <p className="text-[10px] font-bold text-blue-100 uppercase tracking-widest mb-1">Total JTM</p>
            <p className="text-2xl font-black">{filteredList.reduce((acc, curr) => acc + curr.panjangJtmTotal, 0).toFixed(2)} <span className="text-xs">kms</span></p>
          </div>
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20">
            <p className="text-[10px] font-bold text-blue-100 uppercase tracking-widest mb-1">Total JTR</p>
            <p className="text-2xl font-black">{filteredList.reduce((acc, curr) => acc + curr.panjangJtr, 0).toFixed(2)} <span className="text-xs">kms</span></p>
          </div>
        </div>
      </div>
    </div>
  );
};
