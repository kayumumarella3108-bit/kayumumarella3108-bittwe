import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Calendar, 
  Zap, 
  Search, 
  Plus, 
  Save,
  Trees,
  Search as SearchIcon,
  MapPin,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { JadwalInspeksiRow } from '../../types';
import { DAFTAR_UNIT_PLN } from '../../utils/unitConfig';
import { INITIAL_PENYULANG } from '../../data/mockData';

interface InputJadwalInspeksiModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<JadwalInspeksiRow>) => void;
  editItem?: JadwalInspeksiRow | null;
}

export const InputJadwalInspeksiModal: React.FC<InputJadwalInspeksiModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editItem
}) => {
  const [ulp, setUlp] = useState('ULP Baguala');
  const [kodeUlp, setKodeUlp] = useState('54110');
  const [penyulang, setPenyulang] = useState('');
  const [kms, setKms] = useState<number>(0);
  const [tahun, setTahun] = useState<number>(new Date().getFullYear());

  useEffect(() => {
    if (isOpen) {
      if (editItem) {
        setUlp(editItem.ulp);
        setKodeUlp(editItem.kodeUlp);
        setPenyulang(editItem.penyulang);
        setKms(editItem.kms);
        setTahun(editItem.tahun);
      } else {
        // Default values for new entry
        setUlp('ULP Baguala');
        setKodeUlp('54110');
        setPenyulang('');
        setKms(0);
        setTahun(new Date().getFullYear());
      }
    }
  }, [isOpen, editItem]);

  const handleUlpChange = (val: string) => {
    setUlp(val);
    const unit = DAFTAR_UNIT_PLN.find(u => u.namaUnit === val);
    if (unit) setKodeUlp(unit.kodeUnit);
  };

  const handlePenyulangChange = (val: string) => {
    setPenyulang(val);
    // Find in master data to auto-fill KMS
    const master = INITIAL_PENYULANG.find(p => p.namaPenyulang === val);
    if (master) {
      setKms(master.panjangJaringanKms);
    }
  };

  const sortedPenyulangs = useMemo(() => {
    return [...INITIAL_PENYULANG].sort((a, b) => a.namaPenyulang.localeCompare(b.namaPenyulang));
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ulp,
      kodeUlp,
      penyulang,
      kms,
      tahun,
      schedule: editItem?.schedule || {}
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="w-full max-w-lg bg-[#011a18] border border-teal-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-6 border-b border-teal-500/20 flex items-center justify-between bg-teal-900/10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-400/20 border border-amber-400/30">
              <Calendar className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white leading-tight uppercase tracking-tight">
                {editItem ? 'EDIT JADWAL' : 'TAMBAH JADWAL BARU'}
              </h3>
              <p className="text-teal-400/70 text-[10px] font-bold uppercase tracking-widest mt-1">
                Data Perencanaan Inspeksi & ROW
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-teal-900/50 text-teal-500 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto max-h-[70vh]">
          {/* ULP Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-teal-500 uppercase tracking-widest ml-1">Unit (ULP)</label>
              <select
                value={ulp}
                onChange={(e) => handleUlpChange(e.target.value)}
                className="w-full bg-teal-900/20 border border-teal-500/30 rounded-xl px-4 py-2.5 text-sm font-bold text-white focus:outline-none focus:border-amber-400/50 transition-all appearance-none cursor-pointer"
              >
                {DAFTAR_UNIT_PLN.map(u => (
                  <option key={u.kodeUnit} value={u.namaUnit} className="bg-[#011a18]">
                    {u.namaUnit}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-teal-500 uppercase tracking-widest ml-1">Kode ULP</label>
              <input
                type="text"
                value={kodeUlp}
                readOnly
                className="w-full bg-teal-950/50 border border-teal-800/50 rounded-xl px-4 py-2.5 text-sm font-mono font-bold text-teal-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Penyulang */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-teal-500 uppercase tracking-widest ml-1">Nama Penyulang</label>
            <div className="relative">
              <SearchIcon className="w-4 h-4 text-teal-600 absolute left-4 top-3" />
              <select
                required
                value={penyulang}
                onChange={(e) => handlePenyulangChange(e.target.value)}
                className="w-full bg-teal-900/20 border border-teal-500/30 rounded-xl pl-11 pr-4 py-2.5 text-sm font-bold text-white focus:outline-none focus:border-amber-400/50 transition-all appearance-none cursor-pointer"
              >
                <option value="" disabled className="bg-[#011a18]">Pilih Penyulang...</option>
                {sortedPenyulangs.map(p => (
                  <option key={p.id} value={p.namaPenyulang} className="bg-[#011a18]">
                    {p.namaPenyulang}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-teal-500 uppercase tracking-widest ml-1">Panjang (KMS)</label>
              <input
                required
                type="number"
                step="0.01"
                value={kms}
                onChange={(e) => setKms(parseFloat(e.target.value) || 0)}
                className="w-full bg-teal-900/20 border border-teal-500/30 rounded-xl px-4 py-2.5 text-sm font-bold text-white focus:outline-none focus:border-amber-400/50 transition-all text-center"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-teal-500 uppercase tracking-widest ml-1">Tahun Perencanaan</label>
              <select
                value={tahun}
                onChange={(e) => setTahun(parseInt(e.target.value))}
                className="w-full bg-teal-900/20 border border-teal-500/30 rounded-xl px-4 py-2.5 text-sm font-bold text-white focus:outline-none focus:border-amber-400/50 transition-all appearance-none cursor-pointer"
              >
                {[2024, 2025, 2026, 2027].map(y => (
                  <option key={y} value={y} className="bg-[#011a18]">{y}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-teal-950/40 border border-teal-800/30 flex items-start gap-3">
            <Clock className="w-5 h-5 text-teal-500 shrink-0 mt-0.5" />
            <p className="text-[11px] font-bold text-teal-500 leading-relaxed">
              Setelah menambahkan data penyulang, Anda dapat mengisi jadwal inspeksi dan ROW dengan cara mengklik langsung pada kolom tanggal di tabel utama.
            </p>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-teal-900/20 hover:bg-teal-900/40 text-teal-400 border border-teal-800/50 rounded-2xl text-xs font-black transition-all uppercase tracking-widest"
            >
              BATAL
            </button>
            <button
              type="submit"
              className="flex-[2] px-4 py-3 bg-amber-500 hover:bg-amber-600 text-teal-950 rounded-2xl text-xs font-black transition-all shadow-lg shadow-amber-900/20 flex items-center justify-center gap-2 uppercase tracking-widest"
            >
              <Save className="w-4 h-4" />
              SIMPAN DATA
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
