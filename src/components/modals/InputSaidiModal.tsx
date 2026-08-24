import React, { useState } from 'react';
import { X, BarChart3 } from 'lucide-react';
import { SaidiSaifiData } from '../../types';

interface InputSaidiModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: SaidiSaifiData) => void;
  editItem?: SaidiSaifiData | null;
}

export const InputSaidiModal: React.FC<InputSaidiModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editItem
}) => {
  const [bulan, setBulan] = useState('Juli');
  const [tahun, setTahun] = useState(2026);
  const [ensKwh, setEnsKwh] = useState(0);
  const [targetSaidi, setTargetSaidi] = useState(0.200);
  const [realisasiSaidi, setRealisasiSaidi] = useState(0.085);
  const [targetSaifi, setTargetSaifi] = useState(0.050);
  const [realisasiSaifi, setRealisasiSaifi] = useState(0.022);
  const [tarifListrik, setTarifListrik] = useState(1444.7);
  const [catatan, setCatatan] = useState('Catatan mengenai keandalan per tahun...');

  React.useEffect(() => {
    if (editItem) {
      setBulan(editItem.bulan || 'Juli');
      setTahun(editItem.tahun || 2026);
      setEnsKwh(editItem.ensKumulatifKwh || 0);
      setTargetSaidi(editItem.targetSaidi || 0.2);
      setRealisasiSaidi(editItem.realisasiSaidi || 0.085);
      setTargetSaifi(editItem.targetSaifi || 0.05);
      setRealisasiSaifi(editItem.realisasiSaifi || 0.022);
      setTarifListrik(editItem.tarifListrik || 1444.7);
      setCatatan(editItem.catatan || '');
    } else {
      setBulan('Juli');
      setTahun(2026);
      setEnsKwh(0);
      setTargetSaidi(0.200);
      setRealisasiSaidi(0.085);
      setTargetSaifi(0.050);
      setRealisasiSaifi(0.022);
      setTarifListrik(1444.7);
      setCatatan('Catatan mengenai keandalan per tahun...');
    }
  }, [editItem, isOpen]);

  if (!isOpen) return null;

  const estimasiRupiah = Math.round(ensKwh * tarifListrik);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newData: SaidiSaifiData = {
      id: editItem ? editItem.id : `saidi_${Date.now()}`,
      bulan,
      tahun: Number(tahun),
      ensKumulatifKwh: Number(ensKwh) || 0,
      targetSaidi: Number(targetSaidi) || 0,
      realisasiSaidi: Number(realisasiSaidi) || 0,
      targetSaifi: Number(targetSaifi) || 0,
      realisasiSaifi: Number(realisasiSaifi) || 0,
      tarifListrik: Number(tarifListrik) || 1444.7,
      estimasiKerugianRp: estimasiRupiah,
      catatan
    };

    onSave(newData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md font-sans">
      <div className="relative w-full max-w-lg max-h-[90vh] bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl text-slate-800 flex flex-col my-auto">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                Input Data SAIDI, SAIFI & ENS Kumulatif
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                PLN ULP Baguala • Sistem Keandalan 20kV
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-4 space-y-3.5 text-xs pr-1">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Bulan *</label>
              <select
                value={bulan}
                onChange={(e) => setBulan(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium cursor-pointer"
              >
                {['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'].map((m) => (
                  <option key={m} value={m} className="bg-white">{m}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Tahun *</label>
              <select
                value={tahun}
                onChange={(e) => setTahun(Number(e.target.value))}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium cursor-pointer"
              >
                <option value={2026} className="bg-white">2026</option>
                <option value={2025} className="bg-white">2025</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-bold text-amber-700 mb-1">ENS Kumulatif (kWh) *</label>
              <input
                type="number"
                step="0.1"
                value={ensKwh}
                onChange={(e) => setEnsKwh(Number(e.target.value))}
                placeholder="0"
                required
                className="w-full px-3 py-2.5 bg-slate-50 border border-amber-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Target SAIDI Kumulatif (Jam/Plg)</label>
              <input
                type="number"
                step="0.001"
                value={targetSaidi}
                onChange={(e) => setTargetSaidi(Number(e.target.value))}
                placeholder="e.g. 0.200"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Realisasi SAIDI Kumulatif (Jam/Plg)</label>
              <input
                type="number"
                step="0.001"
                value={realisasiSaidi}
                onChange={(e) => setRealisasiSaidi(Number(e.target.value))}
                placeholder="0"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Target SAIFI Kumulatif (Kali/Plg)</label>
              <input
                type="number"
                step="0.001"
                value={targetSaifi}
                onChange={(e) => setTargetSaifi(Number(e.target.value))}
                placeholder="e.g. 0.050"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Realisasi SAIFI Kumulatif (Kali/Plg)</label>
              <input
                type="number"
                step="0.001"
                value={realisasiSaifi}
                onChange={(e) => setRealisasiSaifi(Number(e.target.value))}
                placeholder="0"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-blue-700 mb-1">Tarif Listrik (Rp/kWh)</label>
              <input
                type="number"
                step="0.1"
                value={tarifListrik}
                onChange={(e) => setTarifListrik(Number(e.target.value))}
                className="w-full px-3 py-2.5 bg-slate-50 border border-blue-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
              />
            </div>
          </div>

          {/* Auto Calculated Rupiah Banner */}
          <div className="p-3 rounded-2xl bg-blue-50 border border-blue-100 text-center font-mono text-blue-800 font-extrabold text-sm">
            Estimasi Kerugian Rupiah Hilang: Rp {estimasiRupiah.toLocaleString('id-ID')}
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Catatan / Keterangan Operasional</label>
            <textarea
              rows={2}
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Catatan keandalan..."
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 shrink-0 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors cursor-pointer shadow-sm shadow-blue-500/20"
            >
              Simpan Data
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
