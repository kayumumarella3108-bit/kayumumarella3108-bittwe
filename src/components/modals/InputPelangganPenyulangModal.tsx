import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Plus,
  Users,
  Building2,
  Zap,
  Info,
  Save
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DAFTAR_UNIT_PLN } from '../../utils/unitConfig';
import { INITIAL_PENYULANG } from '../../data/mockData';

interface InputPelangganPenyulangModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  editItem?: any;
}

export const InputPelangganPenyulangModal: React.FC<InputPelangganPenyulangModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editItem
}) => {
  const [ulp, setUlp] = useState('ULP Baguala');
  const [kodeUnit, setKodeUnit] = useState('54110');
  const [penyulang, setPenyulang] = useState('');
  const [jumlahPelanggan, setJumlahPelanggan] = useState<number>(0);

  useEffect(() => {
    if (isOpen) {
      if (editItem) {
        setUlp(editItem.ulp || editItem.namaUnit);
        setKodeUnit(editItem.kodeId || editItem.kodeUnit);
        setPenyulang(editItem.namaPenyulang || editItem.penyulang);
        setJumlahPelanggan(editItem.jumlahPelanggan || 0);
      } else {
        setUlp('ULP Baguala');
        setKodeUnit('54110');
        setPenyulang('');
        setJumlahPelanggan(0);
      }
    }
  }, [isOpen, editItem]);

  const handleUlpChange = (val: string) => {
    setUlp(val);
    const unit = DAFTAR_UNIT_PLN.find(u => u.namaUnit === val);
    if (unit) setKodeUnit(unit.kodeUnit);
    // Reset penyulang when unit changes if it doesn't belong
    setPenyulang('');
  };

  const sortedPenyulangs = useMemo(() => {
    return [...INITIAL_PENYULANG].sort((a, b) => a.namaPenyulang.localeCompare(b.namaPenyulang));
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: editItem?.id || Math.random().toString(36).substr(2, 9),
      ulp,
      kodeId: kodeUnit,
      penyulang,
      jumlahPelanggan,
      updatedAt: new Date().toISOString()
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200"
      >
        {/* Header */}
        <div className="bg-teal-700 p-6 text-white relative">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/30">
              <Plus className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight leading-tight">
                {editItem ? 'EDIT DATA PELANGGAN' : 'TAMBAH DATA PELANGGAN'}
              </h2>
              <p className="text-teal-100/80 text-[10px] font-bold uppercase tracking-widest mt-1">
                INTEGRASI MASTER DATA PENYULANG & UNIT
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {/* Unit Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Unit (ULP)</label>
              <div className="relative">
                <Building2 className="w-4 h-4 absolute left-4 top-3.5 text-teal-600" />
                <select
                  required
                  value={ulp}
                  onChange={(e) => handleUlpChange(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-11 pr-4 py-3 text-sm font-bold text-slate-800 focus:outline-none focus:border-teal-500 transition-all appearance-none cursor-pointer"
                >
                  {DAFTAR_UNIT_PLN.map(u => (
                    <option key={u.kodeUnit} value={u.namaUnit}>{u.namaUnit}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Kode Unit</label>
              <input
                disabled
                type="text"
                value={kodeUnit}
                className="w-full bg-slate-100 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-black text-slate-500 text-center"
              />
            </div>
          </div>

          {/* Penyulang Selection */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nama Penyulang</label>
            <div className="relative">
              <Zap className="w-4 h-4 absolute left-4 top-3.5 text-amber-500" />
              <select
                required
                value={penyulang}
                onChange={(e) => setPenyulang(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-11 pr-4 py-3 text-sm font-bold text-slate-800 focus:outline-none focus:border-teal-500 transition-all appearance-none cursor-pointer"
              >
                <option value="" disabled>Pilih Penyulang dari Master Data...</option>
                {sortedPenyulangs.map(p => (
                  <option key={p.id} value={p.namaPenyulang}>{p.namaPenyulang}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Jumlah Pelanggan */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Jumlah Pelanggan</label>
            <div className="relative">
              <Users className="w-4 h-4 absolute left-4 top-3.5 text-teal-600" />
              <input
                required
                type="number"
                min="0"
                value={jumlahPelanggan}
                onChange={(e) => setJumlahPelanggan(parseInt(e.target.value) || 0)}
                placeholder="0"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-11 pr-4 py-3 text-sm font-black text-slate-800 focus:outline-none focus:border-teal-500 transition-all"
              />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-teal-50 border border-teal-100 flex items-start gap-3">
            <Info className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
            <p className="text-[11px] text-teal-800 leading-relaxed font-semibold">
              Data ini akan disinkronkan dengan dashboard monitoring susut dan evaluasi pembebanan penyulang secara otomatis.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-black rounded-2xl transition-all uppercase tracking-widest"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 py-4 bg-teal-700 hover:bg-teal-800 text-white text-xs font-black rounded-2xl transition-all shadow-lg shadow-teal-700/20 flex items-center justify-center gap-2 uppercase tracking-widest"
            >
              <Save className="w-4 h-4" />
              Simpan Data
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
