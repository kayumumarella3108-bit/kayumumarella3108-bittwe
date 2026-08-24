import React, { useState, useEffect, useMemo, ClipboardEvent } from 'react';
import { X, Save, Activity, Calendar, Clock, UserCheck, Zap, Shield, HelpCircle, Check, Info, ClipboardPaste } from 'lucide-react';
import { PengukuranGardu, MasterGardu, JurusanData } from '../../types';
import { parseFlexibleDate, formatDateToDMY, formatDateToISO } from '../../utils/dateParser';

interface PengukuranGarduModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (pkg: PengukuranGardu) => void;
  editingPengukuran?: PengukuranGardu | null;
  masterGarduList: MasterGardu[];
}

const defaultJurusan = (nama: string): JurusanData => ({
  nama,
  iRTotal: 0,
  iSTotal: 0,
  iTTotal: 0,
  iNTotal: 0,
  vRN: 220,
  vSN: 220,
  vTN: 220,
  vRS: 380,
  vST: 380,
  vRT: 380,
  iPeakR: 0,
  iPeakS: 0,
  iPeakT: 0,
  tpfR: 0.90,
  tpfS: 0.90,
  tpfT: 0.90,
  titikUkur: 'PHB-TR'
});

export const PengukuranGarduModal: React.FC<PengukuranGarduModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingPengukuran,
  masterGarduList
}) => {
  const [selectedGarduId, setSelectedGarduId] = useState<string>('');
  const [noGarduLama, setNoGarduLama] = useState<string>('');
  const [noGarduBaru, setNoGarduBaru] = useState<string>('');
  const [petugas, setPetugas] = useState<string>('');
  const [jamUkur, setJamUkur] = useState<string>('09:30');
  const [tanggalUkurRaw, setTanggalUkurRaw] = useState<string>('6/8/2026');
  const [dateInputMode, setDateInputMode] = useState<'text' | 'picker'>('text');
  const [penyulang, setPenyulang] = useState<string>('PASSO');
  const [unit, setUnit] = useState<string>('ULP Baguala');
  const [dayaKva, setDayaKva] = useState<number>(160);
  const [alamat, setAlamat] = useState<string>('');

  // Main Trafo Measurements
  const [iRTotal, setIRTotal] = useState<number>(0);
  const [iSTotal, setISTotal] = useState<number>(0);
  const [iTTotal, setITTotal] = useState<number>(0);
  const [iNTotal, setINTotal] = useState<number>(0);
  const [vRN, setVRN] = useState<number>(220);
  const [vSN, setVSN] = useState<number>(220);
  const [vTN, setVTN] = useState<number>(220);
  const [vRS, setVRS] = useState<number>(380);
  const [vST, setVST] = useState<number>(380);
  const [vRT, setVRT] = useState<number>(380);
  const [thdR, setThdR] = useState<number>(2.0);
  const [thdS, setThdS] = useState<number>(2.0);
  const [thdT, setThdT] = useState<number>(2.0);
  const [iPeakR, setIPeakR] = useState<number>(0);
  const [iPeakS, setIPeakS] = useState<number>(0);
  const [iPeakT, setIPeakT] = useState<number>(0);
  const [tpfR, setTpfR] = useState<number>(0.92);
  const [tpfS, setTpfS] = useState<number>(0.92);
  const [tpfT, setTpfT] = useState<number>(0.92);

  // Jurusan 1 s/d 4
  const [jurusan1, setJurusan1] = useState<JurusanData>(defaultJurusan('JURUSAN 1'));
  const [jurusan2, setJurusan2] = useState<JurusanData>(defaultJurusan('JURUSAN 2'));
  const [jurusan3, setJurusan3] = useState<JurusanData>(defaultJurusan('JURUSAN 3'));
  const [jurusan4, setJurusan4] = useState<JurusanData>(defaultJurusan('JURUSAN 4'));

  const [activeJurusanTab, setActiveJurusanTab] = useState<1 | 2 | 3 | 4>(1);

  // Helper function to handle multi-cell Excel paste sequentially
  const handleExcelPaste = (
    e: ClipboardEvent<HTMLInputElement>,
    setters: Array<(val: number) => void>
  ) => {
    const clipboardData = e.clipboardData.getData('text');
    if (!clipboardData) return;

    // Split by tab (Excel cells) or newline or commas
    const rows = clipboardData.split(/\r?\n/).filter(r => r.trim() !== '');
    if (rows.length === 0) return;

    const values = rows[0].split(/\t|,/).map(v => v.trim()).filter(v => v !== '');
    if (values.length > 1) {
      e.preventDefault();
      values.forEach((val, idx) => {
        if (idx < setters.length) {
          const num = parseFloat(val.replace(',', '.'));
          if (!isNaN(num)) {
            setters[idx](num);
          }
        }
      });
    }
  };

  // Parsed date interpretation
  const parsedDate = useMemo(() => {
    return parseFlexibleDate(tanggalUkurRaw);
  }, [tanggalUkurRaw]);

  useEffect(() => {
    if (editingPengukuran) {
      setSelectedGarduId(editingPengukuran.garduId || '');
      setNoGarduLama(editingPengukuran.noGarduLama || editingPengukuran.noGardu || '');
      setNoGarduBaru(editingPengukuran.noGarduBaru || '');
      setUnit(editingPengukuran.unit || 'ULP Baguala');
      setPenyulang(editingPengukuran.penyulang || 'PASSO');
      setDayaKva(editingPengukuran.dayaKva || 160);
      setAlamat(editingPengukuran.alamat || '');
      setTanggalUkurRaw(formatDateToDMY(editingPengukuran.tanggalUkur) || editingPengukuran.tanggalUkur);
      setPetugas(editingPengukuran.petugas || '');
      setJamUkur(editingPengukuran.jamUkur || '09:30');

      setIRTotal(editingPengukuran.iRTotal || 0);
      setISTotal(editingPengukuran.iSTotal || 0);
      setITTotal(editingPengukuran.iTTotal || 0);
      setINTotal(editingPengukuran.iNTotal || 0);

      setVRN(editingPengukuran.vRN || 220);
      setVSN(editingPengukuran.vSN || 220);
      setVTN(editingPengukuran.vTN || 220);
      setVRS(editingPengukuran.vRS || 380);
      setVST(editingPengukuran.vST || 380);
      setVRT(editingPengukuran.vRT || 380);

      setThdR(editingPengukuran.thdR || 2.0);
      setThdS(editingPengukuran.thdS || 2.0);
      setThdT(editingPengukuran.thdT || 2.0);

      setIPeakR(editingPengukuran.iPeakR || 0);
      setIPeakS(editingPengukuran.iPeakS || 0);
      setIPeakT(editingPengukuran.iPeakT || 0);

      setTpfR(editingPengukuran.tpfR || 0.92);
      setTpfS(editingPengukuran.tpfS || 0.92);
      setTpfT(editingPengukuran.tpfT || 0.92);

      setJurusan1(editingPengukuran.jurusan1 || defaultJurusan('JURUSAN 1'));
      setJurusan2(editingPengukuran.jurusan2 || defaultJurusan('JURUSAN 2'));
      setJurusan3(editingPengukuran.jurusan3 || defaultJurusan('JURUSAN 3'));
      setJurusan4(editingPengukuran.jurusan4 || defaultJurusan('JURUSAN 4'));
    } else {
      if (masterGarduList.length > 0) {
        const first = masterGarduList[0];
        setSelectedGarduId(first.id);
        setNoGarduLama(first.noGarduLama || '');
        setNoGarduBaru(first.noBaru || first.noGarduBaru || '');
        setUnit(first.unit || 'ULP Baguala');
        setPenyulang(first.penyulang || 'PASSO');
        setDayaKva(Number(first.daya) || 160);
        setAlamat(first.alamat || first.alamatGardu || '');
      }
    }
  }, [editingPengukuran, isOpen, masterGarduList]);

  const handleSelectGarduChange = (garduId: string) => {
    setSelectedGarduId(garduId);
    const g = masterGarduList.find(x => x.id === garduId);
    if (g) {
      setNoGarduLama(g.noGarduLama || '');
      setNoGarduBaru(g.noBaru || g.noGarduBaru || '');
      setUnit(g.unit || 'ULP Baguala');
      setPenyulang(g.penyulang || 'PASSO');
      setDayaKva(Number(g.daya) || 160);
      setAlamat(g.alamat || g.alamatGardu || '');
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalNoGardu = noGarduLama || noGarduBaru;
    if (!finalNoGardu) {
      alert('Nomor Gardu Lama atau Baru wajib diisi');
      return;
    }

    if (!petugas) {
      alert('Nama Petugas Pengukur wajib diisi');
      return;
    }

    const finalTglUkur = parsedDate ? parsedDate.formattedDMY : tanggalUkurRaw;

    const pkgData: PengukuranGardu = {
      id: editingPengukuran?.id || `pkg_${Date.now()}`,
      garduId: selectedGarduId,
      noGardu: finalNoGardu,
      noGarduLama: noGarduLama || finalNoGardu,
      noGarduBaru: noGarduBaru || '',
      jamUkur: jamUkur || '09:30',
      unit,
      penyulang,
      dayaKva: Number(dayaKva) || 160,
      alamat,
      tanggalUkur: finalTglUkur, // D/M/YYYY standar contoh: 6/8/2026
      petugas,

      iRTotal: Number(iRTotal),
      iSTotal: Number(iSTotal),
      iTTotal: Number(iTTotal),
      iNTotal: Number(iNTotal),

      vRN: Number(vRN),
      vSN: Number(vSN),
      vTN: Number(vTN),
      vRS: Number(vRS),
      vST: Number(vST),
      vRT: Number(vRT),

      thdR: Number(thdR),
      thdS: Number(thdS),
      thdT: Number(thdT),

      iPeakR: Number(iPeakR),
      iPeakS: Number(iPeakS),
      iPeakT: Number(iPeakT),

      tpfR: Number(tpfR),
      tpfS: Number(tpfS),
      tpfT: Number(tpfT),

      jurusan1,
      jurusan2,
      jurusan3,
      jurusan4,

      createdAt: editingPengukuran?.createdAt || new Date().toISOString()
    };

    onSave(pkgData);
    onClose();
  };

  const updateJurusanField = (jurNum: 1 | 2 | 3 | 4, field: keyof JurusanData, val: any) => {
    const setter = jurNum === 1 ? setJurusan1 : jurNum === 2 ? setJurusan2 : jurNum === 3 ? setJurusan3 : setJurusan4;
    setter(prev => ({
      ...prev,
      [field]: val
    }));
  };

  const currentJurusanData = activeJurusanTab === 1 ? jurusan1 : activeJurusanTab === 2 ? jurusan2 : activeJurusanTab === 3 ? jurusan3 : jurusan4;

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-5xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6">
        
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600/30 rounded-lg text-blue-400 border border-blue-500/30">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">
                {editingPengukuran ? 'Edit Form Pengukuran Gardu & Beban Trafo' : 'Form Input Pengukuran Gardu & Beban Trafo'}
              </h3>
              <p className="text-xs text-slate-400">
                Sesuai format standar: TGL Ukur, PETUGAS, Jam Ukur, No Gardu Lama, No Gardu Baru, Penyulang, Arus Total, Tegangan, THD, IPEAK, TPF &amp; Jurusan 1-4
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[82vh] overflow-y-auto font-sans">
          
          {/* Section 1: Informasi Utama Pengukuran (Sesuai Kolom Excel Header Foto 2) */}
          <div className="bg-slate-50 p-4.5 rounded-xl border border-slate-200 space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span>1. Informasi Utama Pengukuran (TGL Ukur, Petugas, Jam, No Gardu, Penyulang)</span>
              </h4>
              <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
                Sesuai Struktur Data Foto 2
              </span>
            </div>

            {/* Quick Auto-Fill from Master Gardu */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Pilih Dari Master Gardu (Auto-Fill Otomatis):
              </label>
              <select
                value={selectedGarduId}
                onChange={(e) => handleSelectGarduChange(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">-- Ketik Manual / Pilih Gardu Terdaftar --</option>
                {masterGarduList.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.noGarduLama || '-'} | {g.noBaru || g.noGarduBaru || '-'} - {g.penyulang} ({g.daya || 160} kVA)
                  </option>
                ))}
              </select>
            </div>

            {/* Main Header 6 Columns in strict order from Photo 2 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
              
              {/* 1. TGL Ukur */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-bold text-slate-800">
                    TGL Ukur <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setDateInputMode(prev => prev === 'text' ? 'picker' : 'text')}
                    className="text-[10px] text-blue-600 hover:underline font-bold"
                  >
                    {dateInputMode === 'text' ? 'Gunakan Kalender' : 'Ketik Manual (contoh: 6 Agustus 2026)'}
                  </button>
                </div>

                {dateInputMode === 'picker' ? (
                  <input
                    type="date"
                    value={formatDateToISO(tanggalUkurRaw)}
                    onChange={(e) => {
                      const res = parseFlexibleDate(e.target.value);
                      if (res) setTanggalUkurRaw(res.formattedDMY);
                    }}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-900 bg-white focus:ring-2 focus:ring-blue-500"
                    required
                  />
                ) : (
                  <input
                    type="text"
                    value={tanggalUkurRaw}
                    onChange={(e) => setTanggalUkurRaw(e.target.value)}
                    placeholder="mis. 6 Agustus 2026 atau 6/8/2026"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-900 bg-white focus:ring-2 focus:ring-blue-500"
                    required
                  />
                )}

                {/* Live Feedback: 6 Agustus 2026 -> 6/8/2026 */}
                {parsedDate ? (
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Terbaca: <strong>{parsedDate.formattedDMY}</strong> ({parsedDate.formattedIndonesian})</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                    <Info className="w-3 h-3 text-amber-600 shrink-0" />
                    <span>Format tanggal fleksibel: "6 Agustus 2026" terbaca "6/8/2026"</span>
                  </div>
                )}
              </div>

              {/* 2. PETUGAS */}
              <div>
                <label className="block text-[11px] font-bold text-slate-800 mb-1">
                  PETUGAS <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={petugas}
                  onChange={(e) => setPetugas(e.target.value)}
                  placeholder="mis. Bpk. Ahmad & Tim Yantek"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-900 bg-white focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* 3. Jam Ukur */}
              <div>
                <label className="block text-[11px] font-bold text-slate-800 mb-1">
                  Jam Ukur
                </label>
                <div className="relative">
                  <Clock className="w-4 h-4 absolute left-2.5 top-2 text-slate-400" />
                  <input
                    type="text"
                    value={jamUkur}
                    onChange={(e) => setJamUkur(e.target.value)}
                    placeholder="09:30 / 10:00 WIT"
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-900 bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* 4. No Gardu Lama */}
              <div>
                <label className="block text-[11px] font-bold text-slate-800 mb-1">
                  No Gardu Lama
                </label>
                <input
                  type="text"
                  value={noGarduLama}
                  onChange={(e) => setNoGarduLama(e.target.value)}
                  placeholder="mis. NAMAHATU DEPAN SMA (AL 01)"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-900 bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* 5. No Gardu Baru */}
              <div>
                <label className="block text-[11px] font-bold text-slate-800 mb-1">
                  No Gardu Baru
                </label>
                <input
                  type="text"
                  value={noGarduBaru}
                  onChange={(e) => setNoGarduBaru(e.target.value)}
                  placeholder="mis. ALGALG005"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-blue-800 bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* 6. Penyulang */}
              <div>
                <label className="block text-[11px] font-bold text-slate-800 mb-1">
                  Penyulang
                </label>
                <input
                  type="text"
                  value={penyulang}
                  onChange={(e) => setPenyulang(e.target.value)}
                  placeholder="mis. ALANG / PASSO"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-900 bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

            </div>

            {/* Info Tambahan Pelengkap */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t border-slate-200/80">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">Daya Trafo (kVA)</label>
                <input
                  type="number"
                  value={dayaKva}
                  onChange={(e) => setDayaKva(Number(e.target.value))}
                  placeholder="160"
                  className="w-full px-2.5 py-1 rounded border border-slate-200 text-xs font-bold text-blue-700 bg-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">Unit PLN</label>
                <input
                  type="text"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="ULP Baguala"
                  className="w-full px-2.5 py-1 rounded border border-slate-200 text-xs bg-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">Alamat / Lokasi</label>
                <input
                  type="text"
                  value={alamat}
                  onChange={(e) => setAlamat(e.target.value)}
                  placeholder="Lokasi gardu"
                  className="w-full px-2.5 py-1 rounded border border-slate-200 text-xs bg-white"
                />
              </div>
            </div>

          </div>

          {/* Section 2: Main / Total Trafo Measurements (Total Ampere, Fasa-Netral, Fasa-Fasa, THD, IPEAK, TPF) */}
          <div className="bg-blue-50/40 p-4.5 rounded-xl border border-blue-200 space-y-3.5">
            <div className="flex items-center justify-between border-b border-blue-200 pb-2">
              <h4 className="text-xs font-black text-blue-950 uppercase tracking-wider flex items-center gap-2">
                <Zap className="w-4 h-4 text-blue-600" />
                <span>2. Pengukuran Total Trafo Utama (Total Ampere, Tegangan, THD, IPEAK, TPF)</span>
              </h4>
              <span className="text-[10px] font-bold text-blue-800 bg-blue-100/80 px-2.5 py-0.5 rounded-full border border-blue-200">
                Induk Trafo Utama
              </span>
            </div>

            {/* Total (ampere) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-800">Total (ampere):</span>
                <span className="text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 flex items-center gap-1 font-semibold">
                  <ClipboardPaste className="w-3 h-3" /> Tip: Copy dari Excel (misal: 120 115 118 5) lalu Paste di kotak R Total
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="bg-white p-2 rounded-lg border border-blue-200">
                  <label className="block text-[10px] font-black text-blue-800 mb-0.5">I (R TOTAL)</label>
                  <input
                    type="number" step="0.1"
                    value={iRTotal} onChange={(e) => setIRTotal(Number(e.target.value))}
                    onPaste={(e) => handleExcelPaste(e, [setIRTotal, setISTotal, setITTotal, setINTotal])}
                    className="w-full px-2 py-1 rounded border border-slate-200 text-xs font-bold text-slate-900 bg-slate-50 focus:bg-white"
                  />
                </div>
                <div className="bg-white p-2 rounded-lg border border-amber-200">
                  <label className="block text-[10px] font-black text-amber-800 mb-0.5">I (S TOTAL)</label>
                  <input
                    type="number" step="0.1"
                    value={iSTotal} onChange={(e) => setISTotal(Number(e.target.value))}
                    onPaste={(e) => handleExcelPaste(e, [setISTotal, setITTotal, setINTotal])}
                    className="w-full px-2 py-1 rounded border border-slate-200 text-xs font-bold text-slate-900 bg-slate-50 focus:bg-white"
                  />
                </div>
                <div className="bg-white p-2 rounded-lg border border-rose-200">
                  <label className="block text-[10px] font-black text-rose-800 mb-0.5">I (T TOTAL)</label>
                  <input
                    type="number" step="0.1"
                    value={iTTotal} onChange={(e) => setITTotal(Number(e.target.value))}
                    onPaste={(e) => handleExcelPaste(e, [setITTotal, setINTotal])}
                    className="w-full px-2 py-1 rounded border border-slate-200 text-xs font-bold text-slate-900 bg-slate-50 focus:bg-white"
                  />
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-200">
                  <label className="block text-[10px] font-black text-slate-700 mb-0.5">I (N TOTAL)</label>
                  <input
                    type="number" step="0.1"
                    value={iNTotal} onChange={(e) => setINTotal(Number(e.target.value))}
                    className="w-full px-2 py-1 rounded border border-slate-200 text-xs font-bold text-slate-900 bg-slate-50 focus:bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Fasa - netral & fasa - fasa */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
              {/* Fasa - netral */}
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-800">Fasa - netral (Volt):</span>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">V (R - N)</label>
                    <input
                      type="number" step="0.1"
                      value={vRN} onChange={(e) => setVRN(Number(e.target.value))}
                      className="w-full px-2 py-1 rounded border border-slate-200 text-xs font-semibold bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">V (S - N)</label>
                    <input
                      type="number" step="0.1"
                      value={vSN} onChange={(e) => setVSN(Number(e.target.value))}
                      className="w-full px-2 py-1 rounded border border-slate-200 text-xs font-semibold bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">V (T - N)</label>
                    <input
                      type="number" step="0.1"
                      value={vTN} onChange={(e) => setVTN(Number(e.target.value))}
                      className="w-full px-2 py-1 rounded border border-slate-200 text-xs font-semibold bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* fasa - fasa */}
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-800">fasa - fasa (Volt):</span>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">V (R - S)</label>
                    <input
                      type="number" step="0.1"
                      value={vRS} onChange={(e) => setVRS(Number(e.target.value))}
                      className="w-full px-2 py-1 rounded border border-slate-200 text-xs font-semibold bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">V (S - T)</label>
                    <input
                      type="number" step="0.1"
                      value={vST} onChange={(e) => setVST(Number(e.target.value))}
                      className="w-full px-2 py-1 rounded border border-slate-200 text-xs font-semibold bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">V (R - T)</label>
                    <input
                      type="number" step="0.1"
                      value={vRT} onChange={(e) => setVRT(Number(e.target.value))}
                      className="w-full px-2 py-1 rounded border border-slate-200 text-xs font-semibold bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* THD, IPEAK, TPF */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1">
              {/* THD-R, THD-S, THD-T */}
              <div className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-1">
                <span className="text-[10px] font-black text-slate-800 uppercase">Harmonisa THD (%):</span>
                <div className="grid grid-cols-3 gap-1.5">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-600">THD-R</label>
                    <input type="number" step="0.1" value={thdR} onChange={(e) => setThdR(Number(e.target.value))} className="w-full px-1.5 py-1 rounded border text-xs bg-slate-50 focus:bg-white" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-600">THD-S</label>
                    <input type="number" step="0.1" value={thdS} onChange={(e) => setThdS(Number(e.target.value))} className="w-full px-1.5 py-1 rounded border text-xs bg-slate-50 focus:bg-white" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-600">THD-T</label>
                    <input type="number" step="0.1" value={thdT} onChange={(e) => setThdT(Number(e.target.value))} className="w-full px-1.5 py-1 rounded border text-xs bg-slate-50 focus:bg-white" />
                  </div>
                </div>
              </div>

              {/* IPEAK-R, IPEAK-S, IPEAK-T */}
              <div className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-1">
                <span className="text-[10px] font-black text-slate-800 uppercase">Arus Puncak IPEAK (A):</span>
                <div className="grid grid-cols-3 gap-1.5">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-600">IPEAK-R</label>
                    <input type="number" step="0.1" value={iPeakR} onChange={(e) => setIPeakR(Number(e.target.value))} className="w-full px-1.5 py-1 rounded border text-xs bg-slate-50 focus:bg-white" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-600">IPEAK-S</label>
                    <input type="number" step="0.1" value={iPeakS} onChange={(e) => setIPeakS(Number(e.target.value))} className="w-full px-1.5 py-1 rounded border text-xs bg-slate-50 focus:bg-white" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-600">IPEAK-T</label>
                    <input type="number" step="0.1" value={iPeakT} onChange={(e) => setIPeakT(Number(e.target.value))} className="w-full px-1.5 py-1 rounded border text-xs bg-slate-50 focus:bg-white" />
                  </div>
                </div>
              </div>

              {/* TPF-R, TPF-S, TPF-T */}
              <div className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-1">
                <span className="text-[10px] font-black text-slate-800 uppercase">Faktor Daya TPF (Cos φ):</span>
                <div className="grid grid-cols-3 gap-1.5">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-600">TPF-R</label>
                    <input type="number" step="0.01" value={tpfR} onChange={(e) => setTpfR(Number(e.target.value))} className="w-full px-1.5 py-1 rounded border text-xs bg-slate-50 focus:bg-white font-bold" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-600">TPF-S</label>
                    <input type="number" step="0.01" value={tpfS} onChange={(e) => setTpfS(Number(e.target.value))} className="w-full px-1.5 py-1 rounded border text-xs bg-slate-50 focus:bg-white font-bold" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-600">TPF-T</label>
                    <input type="number" step="0.01" value={tpfT} onChange={(e) => setTpfT(Number(e.target.value))} className="w-full px-1.5 py-1 rounded border text-xs bg-slate-50 focus:bg-white font-bold" />
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Section 3: Jurusan 1 s/d 4 Tabs (Persis Foto 2: I R/S/T/N Total, V R/S/T-N, V R-S/S-T/R-T, IPEAK, TPF) */}
          <div className="bg-slate-50 p-4.5 rounded-xl border border-slate-200 space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
              <div>
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  3. Parameter Pengukuran Per Jurusan (Outcoming Feeder 1 s/d 4)
                </h4>
                <p className="text-[11px] text-slate-500">
                  Kolom Jurusan: Total (ampere), Fasa-netral, Fasa-fasa, IPEAK, dan TPF
                </p>
              </div>

              {/* Jurusan Tabs */}
              <div className="flex items-center gap-1.5">
                {([1, 2, 3, 4] as const).map((jNum) => (
                  <button
                    key={jNum}
                    type="button"
                    onClick={() => setActiveJurusanTab(jNum)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                      activeJurusanTab === jNum
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    JURUSAN {jNum}
                  </button>
                ))}
              </div>
            </div>

            {/* Form for Active Jurusan Tab */}
            <div className="space-y-3.5 pt-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Label Nama Jurusan {activeJurusanTab}
                  </label>
                  <input
                    type="text"
                    value={currentJurusanData.nama}
                    onChange={(e) => updateJurusanField(activeJurusanTab, 'nama', e.target.value)}
                    placeholder={`JURUSAN ${activeJurusanTab}`}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Titik Ukur Jurusan {activeJurusanTab}
                  </label>
                  <input
                    type="text"
                    value={currentJurusanData.titikUkur}
                    onChange={(e) => updateJurusanField(activeJurusanTab, 'titikUkur', e.target.value)}
                    placeholder="PHB-TR"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                  />
                </div>
              </div>

              {/* Arus Jurusan: I (R TOTAL), I (S TOTAL), I (T TOTAL), I (N TOTAL) */}
              <div>
                <span className="text-[11px] font-bold text-slate-800">
                  Total (ampere) Jurusan {activeJurusanTab}:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-1">
                  <div className="bg-white p-2 rounded-lg border border-blue-200">
                    <label className="block text-[10px] font-bold text-blue-700 mb-0.5">I (R TOTAL)</label>
                    <input
                      type="number" step="0.1"
                      value={currentJurusanData.iRTotal}
                      onChange={(e) => updateJurusanField(activeJurusanTab, 'iRTotal', Number(e.target.value))}
                      onPaste={(e) => handleExcelPaste(e, [
                        (v) => updateJurusanField(activeJurusanTab, 'iRTotal', v),
                        (v) => updateJurusanField(activeJurusanTab, 'iSTotal', v),
                        (v) => updateJurusanField(activeJurusanTab, 'iTTotal', v),
                        (v) => updateJurusanField(activeJurusanTab, 'iNTotal', v)
                      ])}
                      className="w-full px-2 py-1 rounded border border-slate-200 text-xs font-bold bg-slate-50 focus:bg-white"
                    />
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-amber-200">
                    <label className="block text-[10px] font-bold text-amber-700 mb-0.5">I (S TOTAL)</label>
                    <input
                      type="number" step="0.1"
                      value={currentJurusanData.iSTotal}
                      onChange={(e) => updateJurusanField(activeJurusanTab, 'iSTotal', Number(e.target.value))}
                      onPaste={(e) => handleExcelPaste(e, [
                        (v) => updateJurusanField(activeJurusanTab, 'iSTotal', v),
                        (v) => updateJurusanField(activeJurusanTab, 'iTTotal', v),
                        (v) => updateJurusanField(activeJurusanTab, 'iNTotal', v)
                      ])}
                      className="w-full px-2 py-1 rounded border border-slate-200 text-xs font-bold bg-slate-50 focus:bg-white"
                    />
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-rose-200">
                    <label className="block text-[10px] font-bold text-rose-700 mb-0.5">I (T TOTAL)</label>
                    <input
                      type="number" step="0.1"
                      value={currentJurusanData.iTTotal}
                      onChange={(e) => updateJurusanField(activeJurusanTab, 'iTTotal', Number(e.target.value))}
                      onPaste={(e) => handleExcelPaste(e, [
                        (v) => updateJurusanField(activeJurusanTab, 'iTTotal', v),
                        (v) => updateJurusanField(activeJurusanTab, 'iNTotal', v)
                      ])}
                      className="w-full px-2 py-1 rounded border border-slate-200 text-xs font-bold bg-slate-50 focus:bg-white"
                    />
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">I (N TOTAL)</label>
                    <input
                      type="number" step="0.1"
                      value={currentJurusanData.iNTotal}
                      onChange={(e) => updateJurusanField(activeJurusanTab, 'iNTotal', Number(e.target.value))}
                      className="w-full px-2 py-1 rounded border border-slate-200 text-xs font-bold bg-slate-50 focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Tegangan Jurusan: Fasa - netral & fasa - fasa */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-700 block mb-1">Fasa - netral (Volt):</span>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500">V (R - N)</label>
                      <input type="number" step="0.1" value={currentJurusanData.vRN} onChange={(e) => updateJurusanField(activeJurusanTab, 'vRN', Number(e.target.value))} className="w-full px-2 py-1 rounded border text-xs bg-slate-50 focus:bg-white" />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500">V (S - N)</label>
                      <input type="number" step="0.1" value={currentJurusanData.vSN} onChange={(e) => updateJurusanField(activeJurusanTab, 'vSN', Number(e.target.value))} className="w-full px-2 py-1 rounded border text-xs bg-slate-50 focus:bg-white" />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500">V (T - N)</label>
                      <input type="number" step="0.1" value={currentJurusanData.vTN} onChange={(e) => updateJurusanField(activeJurusanTab, 'vTN', Number(e.target.value))} className="w-full px-2 py-1 rounded border text-xs bg-slate-50 focus:bg-white" />
                    </div>
                  </div>
                </div>

                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-700 block mb-1">fasa - fasa (Volt):</span>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500">V (R - S)</label>
                      <input type="number" step="0.1" value={currentJurusanData.vRS} onChange={(e) => updateJurusanField(activeJurusanTab, 'vRS', Number(e.target.value))} className="w-full px-2 py-1 rounded border text-xs bg-slate-50 focus:bg-white" />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500">V (S - T)</label>
                      <input type="number" step="0.1" value={currentJurusanData.vST} onChange={(e) => updateJurusanField(activeJurusanTab, 'vST', Number(e.target.value))} className="w-full px-2 py-1 rounded border text-xs bg-slate-50 focus:bg-white" />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500">V (R - T)</label>
                      <input type="number" step="0.1" value={currentJurusanData.vRT} onChange={(e) => updateJurusanField(activeJurusanTab, 'vRT', Number(e.target.value))} className="w-full px-2 py-1 rounded border text-xs bg-slate-50 focus:bg-white" />
                    </div>
                  </div>
                </div>
              </div>

              {/* IPEAK & TPF Jurusan */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-700 block mb-1">IPEAK (A):</span>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500">IPEAK-R</label>
                      <input type="number" step="0.1" value={currentJurusanData.iPeakR} onChange={(e) => updateJurusanField(activeJurusanTab, 'iPeakR', Number(e.target.value))} className="w-full px-2 py-1 rounded border text-xs bg-slate-50 focus:bg-white" />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500">IPEAK-S</label>
                      <input type="number" step="0.1" value={currentJurusanData.iPeakS} onChange={(e) => updateJurusanField(activeJurusanTab, 'iPeakS', Number(e.target.value))} className="w-full px-2 py-1 rounded border text-xs bg-slate-50 focus:bg-white" />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500">IPEAK-T</label>
                      <input type="number" step="0.1" value={currentJurusanData.iPeakT} onChange={(e) => updateJurusanField(activeJurusanTab, 'iPeakT', Number(e.target.value))} className="w-full px-2 py-1 rounded border text-xs bg-slate-50 focus:bg-white" />
                    </div>
                  </div>
                </div>

                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-700 block mb-1">TPF (Cos φ):</span>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500">TPF-R</label>
                      <input type="number" step="0.01" value={currentJurusanData.tpfR} onChange={(e) => updateJurusanField(activeJurusanTab, 'tpfR', Number(e.target.value))} className="w-full px-2 py-1 rounded border text-xs bg-slate-50 focus:bg-white font-bold" />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500">TPF-S</label>
                      <input type="number" step="0.01" value={currentJurusanData.tpfS} onChange={(e) => updateJurusanField(activeJurusanTab, 'tpfS', Number(e.target.value))} className="w-full px-2 py-1 rounded border text-xs bg-slate-50 focus:bg-white font-bold" />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500">TPF-T</label>
                      <input type="number" step="0.01" value={currentJurusanData.tpfT} onChange={(e) => updateJurusanField(activeJurusanTab, 'tpfT', Number(e.target.value))} className="w-full px-2 py-1 rounded border text-xs bg-slate-50 focus:bg-white font-bold" />
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-slate-200 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20 flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Data Pengukuran Gardu</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
