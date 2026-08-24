import React, { useState } from 'react';
import { X } from 'lucide-react';
import { SectionJaringan, Penyulang } from '../../types';

interface TambahSectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (section: SectionJaringan) => void;
  penyulangList: Penyulang[];
  initialData?: SectionJaringan | null;
}

export const TambahSectionModal: React.FC<TambahSectionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  penyulangList,
  initialData
}) => {
  const [namaSection, setNamaSection] = useState('');
  const [penyulangId, setPenyulangId] = useState('');
  const [jumlahPelanggan, setJumlahPelanggan] = useState(0);
  const [sistemOperasi, setSistemOperasi] = useState<'Radial' | 'Loop'>('Radial');
  const [penyulangDiSupply, setPenyulangDiSupply] = useState('- Tidak Ada -');

  React.useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setNamaSection(initialData.namaSection);
        setPenyulangId(initialData.penyulangId);
        setJumlahPelanggan(initialData.jumlahPelanggan);
        setSistemOperasi(initialData.sistemOperasi);
        setPenyulangDiSupply(initialData.penyulangDiSupply);
      } else {
        setNamaSection('');
        setPenyulangId(penyulangList[0]?.id || '1');
        setJumlahPelanggan(0);
        setSistemOperasi('Radial');
        setPenyulangDiSupply('- Tidak Ada -');
      }
    }
  }, [isOpen, initialData, penyulangList]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaSection.trim()) return;

    const selectedP = penyulangList.find((p) => p.id === penyulangId);

    const savedSection: SectionJaringan = {
      id: initialData ? initialData.id : `s_${Date.now()}`,
      namaSection,
      penyulangId,
      namaPenyulang: selectedP?.namaPenyulang || 'LATERI 1',
      jumlahPelanggan: Number(jumlahPelanggan) || 0,
      sistemOperasi,
      penyulangDiSupply
    };

    onSave(savedSection);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md font-sans">
      <div className="relative w-full max-w-md max-h-[90vh] bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl text-slate-800 flex flex-col my-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
          <h3 className="text-base font-extrabold text-slate-900">
            Tambah Section Baru
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-4 space-y-3.5 text-xs pr-1">
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              NAMA SECTION
            </label>
            <input
              type="text"
              value={namaSection}
              onChange={(e) => setNamaSection(e.target.value)}
              placeholder="e.g. REC POHON / GH BAGUALA"
              required
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              PENYULANG TERKAIT
            </label>
            <select
              value={penyulangId}
              onChange={(e) => setPenyulangId(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium cursor-pointer"
            >
              {penyulangList.map((p) => (
                <option key={p.id} value={p.id} className="bg-white">
                  {p.namaPenyulang} ({p.namaGi})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              JUMLAH PELANGGAN
            </label>
            <input
              type="number"
              value={jumlahPelanggan}
              onChange={(e) => setJumlahPelanggan(Number(e.target.value))}
              placeholder="0"
              required
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              SISTEM OPERASI
            </label>
            <select
              value={sistemOperasi}
              onChange={(e) => setSistemOperasi(e.target.value as 'Radial' | 'Loop')}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium cursor-pointer"
            >
              <option value="Radial" className="bg-white">Radial</option>
              <option value="Loop" className="bg-white">Loop</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              PENYULANG DI-SUPPLY
            </label>
            <input
              type="text"
              value={penyulangDiSupply}
              onChange={(e) => setPenyulangDiSupply(e.target.value)}
              placeholder="- Tidak Ada - / UTAMA WKH GI"
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors cursor-pointer shadow-sm shadow-blue-500/20"
            >
              Simpan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
