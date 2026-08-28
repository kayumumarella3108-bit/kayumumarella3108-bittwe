import React, { useState } from 'react';
import { X, Factory, Plus, Building2, Zap, Server } from 'lucide-react';
import { Penyulang, MasterUnitPLN } from '../../types';
import { getDynamicUnitList } from '../../utils/unitConfig';
import { addToOfflineQueue } from '../../lib/offlineQueue';

interface TambahPenyulangModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (penyulang: Penyulang) => void;
  initialData?: Penyulang | null;
  penyulangList?: Penyulang[];
  masterUnitList?: MasterUnitPLN[];
}

export const TambahPenyulangModal: React.FC<TambahPenyulangModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  penyulangList = [],
  masterUnitList = []
}) => {
  const [namaGi, setNamaGi] = useState('PASSO');
  const [penyulangUtama, setPenyulangUtama] = useState('BAGUALA UTAMA');
  const [namaPenyulang, setNamaPenyulang] = useState('BAGUALA');
  const [status, setStatus] = useState<'Utama' | 'Percabangan'>('Utama');
  const [kodeId, setKodeId] = useState('BGL');
  const [panjangJaringanKms, setPanjangJaringanKms] = useState(12.5);
  const [jumlahPelanggan, setJumlahPelanggan] = useState<number | ''>(9800);
  const [unit, setUnit] = useState('ULP Baguala');
  const [kodeUnit, setKodeUnit] = useState('54110');
  const [tipeSumber, setTipeSumber] = useState<'GI' | 'PLTD'>('GI');
  const [garduHubung, setGarduHubung] = useState('');
  const [jumlahTiang, setJumlahTiang] = useState<number | ''>('');
  const [jumlahLbs, setJumlahLbs] = useState<number | ''>('');
  const [jumlahPmcb, setJumlahPmcb] = useState<number | ''>('');
  const [jumlahRecloser, setJumlahRecloser] = useState<number | ''>('');
  const [jumlahFco, setJumlahFco] = useState<number | ''>('');
  const [jumlahGardu, setJumlahGardu] = useState<number | ''>('');
  const [sistemOperasi, setSistemOperasi] = useState<'Radial' | 'Looping'>('Radial');

  const unitList = getDynamicUnitList(masterUnitList);

  React.useEffect(() => {
    if (isOpen) {
      if (initialData) {
        // Normalize name: remove "GI " or "PLTD " prefix for edit form display if needed
        const rawName = initialData.namaGi || '';
        const cleanName = rawName.replace(/^(GI|PLTD)\s+/i, '');
        setNamaGi(cleanName || 'PASSO');
        setPenyulangUtama(initialData.penyulangUtama || '');
        setNamaPenyulang(initialData.namaPenyulang);
        setStatus(initialData.status);
        setKodeId(initialData.kodeId);
        setPanjangJaringanKms(initialData.panjangJaringanKms);
        setJumlahPelanggan(initialData.jumlahPelanggan || 0);
        setUnit(initialData.unit || 'ULP Baguala');
        setKodeUnit(initialData.kodeUnit || '54110');
        setTipeSumber(initialData.tipeSumber || (rawName.toUpperCase().startsWith('PLTD') ? 'PLTD' : 'GI'));
        setGarduHubung(initialData.garduHubung || '');
        setJumlahTiang(initialData.jumlahTiang || '');
        setJumlahLbs(initialData.jumlahLbs || '');
        setJumlahPmcb(initialData.jumlahPmcb || '');
        setJumlahRecloser(initialData.jumlahRecloser || '');
        setJumlahFco(initialData.jumlahFco || '');
        setJumlahGardu(initialData.jumlahGardu || '');
        setSistemOperasi(initialData.sistemOperasi || 'Radial');
      } else {
        setNamaGi('PASSO');
        setPenyulangUtama('BAGUALA UTAMA');
        setNamaPenyulang('BAGUALA');
        setStatus('Utama');
        setKodeId('BGL');
        setPanjangJaringanKms(12.5);
        setJumlahPelanggan(9800);
        setUnit('ULP Baguala');
        setKodeUnit('54110');
        setTipeSumber('GI');
        setGarduHubung('');
        setJumlahTiang('');
        setJumlahLbs('');
        setJumlahPmcb('');
        setJumlahRecloser('');
        setJumlahFco('');
        setJumlahGardu('');
        setSistemOperasi('Radial');
      }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleUnitChange = (selectedUnitName: string) => {
    setUnit(selectedUnitName);
    const matchedUnit = unitList.find((u) => u.namaUnit === selectedUnitName);
    if (matchedUnit) {
      setKodeUnit(matchedUnit.kodeUnit);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaPenyulang.trim()) return;

    // Build the full namaGi including prefix GI or PLTD
    const finalNamaGi = tipeSumber === 'PLTD' ? `PLTD ${namaGi.toUpperCase().trim()}` : `GI ${namaGi.toUpperCase().trim()}`;

    const savedPenyulang: Penyulang = {
      id: initialData ? initialData.id : `p_${Date.now()}`,
      namaGi: finalNamaGi,
      penyulangUtama,
      namaPenyulang,
      status,
      kodeId,
      panjangJaringanKms: Number(panjangJaringanKms) || 0,
      jumlahPelanggan: Number(jumlahPelanggan) || 0,
      frekuensiGangguan: initialData ? initialData.frekuensiGangguan : 0,
      healthIndexStatus: initialData ? initialData.healthIndexStatus : 'Sempurna',
      unit,
      kodeUnit,
      tipeSumber,
      garduHubung: garduHubung.trim() || undefined,
      jumlahTiang: Number(jumlahTiang) || 0,
      jumlahLbs: Number(jumlahLbs) || 0,
      jumlahPmcb: Number(jumlahPmcb) || 0,
      jumlahRecloser: Number(jumlahRecloser) || 0,
      jumlahFco: Number(jumlahFco) || 0,
      jumlahGardu: Number(jumlahGardu) || 0,
      sistemOperasi,
    };

    onSave(savedPenyulang);
    if (!navigator.onLine) {
      addToOfflineQueue('save_penyulang', savedPenyulang);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md font-sans">
      <div className="relative w-full max-w-md max-h-[90vh] bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl text-slate-800 flex flex-col my-auto">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
          <h3 className="text-base font-extrabold text-slate-900">
            {initialData ? 'Edit Penyulang' : 'Tambah Penyulang Baru'}
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
          {/* Synchronized Unit Selection */}
          <div>
            <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-blue-600" />
              PILIHAN UNIT ULP (SINKRON DATA MASTER)
            </label>
            <select
              value={unit}
              onChange={(e) => handleUnitChange(e.target.value)}
              className="w-full px-3 py-2.5 bg-blue-50/50 border border-blue-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-semibold cursor-pointer"
            >
              {unitList.map((u, idx) => (
                <option key={`modal_unit_${u.kodeUnit}_${idx}`} value={u.namaUnit}>
                  {u.namaUnit} ({u.kodeUnit})
                </option>
              ))}
            </select>
          </div>

          {/* Tipe Sumber GI / PLTD */}
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                TIPE SUMBER UTAMA (GI / PLTD)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTipeSumber('GI')}
                  className={`py-2 px-3 rounded-xl border text-center font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    tipeSumber === 'GI'
                      ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  GARDU INDUK (GI)
                </button>
                <button
                  type="button"
                  onClick={() => setTipeSumber('PLTD')}
                  className={`py-2 px-3 rounded-xl border text-center font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    tipeSumber === 'PLTD'
                      ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Server className="w-3.5 h-3.5" />
                  PLTD
                </button>
              </div>
            </div>

            {/* Nama GI / PLTD */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                NAMA {tipeSumber === 'PLTD' ? 'PLTD' : 'GARDU INDUK (GI)'}
              </label>
              <input
                type="text"
                value={namaGi}
                onChange={(e) => setNamaGi(e.target.value)}
                placeholder={tipeSumber === 'PLTD' ? "e.g. NAMLEA, PASSO" : "e.g. PASSO, AMBON"}
                required
                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
              />
            </div>

            {/* Gardu Hubung (GH) di bawahnya */}
            <div>
              <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Factory className="w-3.5 h-3.5 text-slate-500" />
                GARDU HUBUNG (GH) - Opsional
              </label>
              <input
                type="text"
                value={garduHubung}
                onChange={(e) => setGarduHubung(e.target.value)}
                placeholder="e.g. GH PASSO, GH NAMLEA (Kosongkan jika tidak ada)"
                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              PENYULANG UTAMA
            </label>
            <input
              type="text"
              list="penyulang-utama-list"
              value={penyulangUtama}
              onChange={(e) => setPenyulangUtama(e.target.value)}
              placeholder="e.g. BAGUALA UTAMA"
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
            />
            {penyulangList && penyulangList.length > 0 && (
              <datalist id="penyulang-utama-list">
                {penyulangList
                  .filter((p) => p.status === 'Utama')
                  .map((p) => (
                    <option key={p.id} value={p.namaPenyulang} />
                  ))}
              </datalist>
            )}
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              NAMA PENYULANG
            </label>
            <input
              type="text"
              value={namaPenyulang}
              onChange={(e) => setNamaPenyulang(e.target.value)}
              placeholder="e.g. BAGUALA"
              required
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              STATUS PENYULANG
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as 'Utama' | 'Percabangan')}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium cursor-pointer"
            >
              <option value="Utama" className="bg-white">Utama</option>
              <option value="Percabangan" className="bg-white">Percabangan</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              SISTEM OPERASI / TOPOLOGI
            </label>
            <select
              value={sistemOperasi}
              onChange={(e) => setSistemOperasi(e.target.value as 'Radial' | 'Looping')}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium cursor-pointer"
            >
              <option value="Radial" className="bg-white">Radial (Satu Arah)</option>
              <option value="Looping" className="bg-white">Looping / Ring (Maneuver Cadangan)</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              KODE / ID
            </label>
            <input
              type="text"
              value={kodeId}
              onChange={(e) => setKodeId(e.target.value)}
              placeholder="e.g. BGL"
              required
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              TOTAL PANJANG JARINGAN (KMS)
            </label>
            <input
              type="number"
              step="0.1"
              value={panjangJaringanKms}
              onChange={(e) => setPanjangJaringanKms(Number(e.target.value))}
              placeholder="0"
              required
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              JUMLAH PELANGGAN PENYULANG (TOTAL)
            </label>
            <input
              type="number"
              value={jumlahPelanggan}
              onChange={(e) => setJumlahPelanggan(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="e.g. 9800"
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              Total pelanggan penyulang. Jika kosong, akan diakumulasi dari total pelanggan section-section di bawahnya.
            </p>
          </div>

          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-3 mt-4">
            <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-blue-600" />
              INVENTARIS PERALATAN JARINGAN
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-600 text-[10px] mb-1">JUMLAH TIANG</label>
                <input
                  type="number"
                  value={jumlahTiang}
                  onChange={(e) => setJumlahTiang(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="0"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-blue-500 transition-all"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-600 text-[10px] mb-1">JUMLAH LBS</label>
                <input
                  type="number"
                  value={jumlahLbs}
                  onChange={(e) => setJumlahLbs(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="0"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-blue-500 transition-all"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-600 text-[10px] mb-1">JUMLAH PMCB</label>
                <input
                  type="number"
                  value={jumlahPmcb}
                  onChange={(e) => setJumlahPmcb(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="0"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-blue-500 transition-all"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-600 text-[10px] mb-1">JUMLAH RECLOSER</label>
                <input
                  type="number"
                  value={jumlahRecloser}
                  onChange={(e) => setJumlahRecloser(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="0"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-blue-500 transition-all"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-600 text-[10px] mb-1">JUMLAH FCO</label>
                <input
                  type="number"
                  value={jumlahFco}
                  onChange={(e) => setJumlahFco(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="0"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-blue-500 transition-all"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-600 text-[10px] mb-1">JUMLAH GARDU</label>
                <input
                  type="number"
                  value={jumlahGardu}
                  onChange={(e) => setJumlahGardu(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="0"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-blue-500 transition-all"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 shrink-0 mt-4">
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
