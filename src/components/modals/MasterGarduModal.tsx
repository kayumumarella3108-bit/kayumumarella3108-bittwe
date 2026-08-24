import React, { useState, useEffect } from 'react';
import { X, Save, Building2, MapPin, Zap, Info, Calendar, Power, CheckCircle, Shield } from 'lucide-react';
import { MasterGardu, Penyulang } from '../../types';

interface MasterGarduModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (gardu: MasterGardu) => void;
  editingGardu?: MasterGardu | null;
  penyulangList?: Penyulang[];
}

export const MasterGarduModal: React.FC<MasterGarduModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingGardu,
  penyulangList = []
}) => {
  const [formData, setFormData] = useState<Partial<MasterGardu>>({
    noBaru: '',
    noGarduLama: '',
    alamat: '',
    penyulang: '',
    daya: '',
    phase: '3 Fasa',
    status: 'Operasi',
    aktif: 'Aktif',
    latitude: '',
    longitude: '',
    thnOperasi: ''
  });

  useEffect(() => {
    if (editingGardu) {
      setFormData({
        noBaru: editingGardu.noBaru || editingGardu.noGarduBaru || '',
        noGarduLama: editingGardu.noGarduLama || '',
        alamat: editingGardu.alamat || editingGardu.alamatGardu || '',
        penyulang: editingGardu.penyulang || '',
        daya: editingGardu.daya !== undefined ? editingGardu.daya : '',
        phase: editingGardu.phase || editingGardu.jumlahFasa || '3 Fasa',
        status: editingGardu.status || 'Operasi',
        aktif: editingGardu.aktif !== undefined ? String(editingGardu.aktif) : 'Aktif',
        latitude: editingGardu.latitude !== undefined ? editingGardu.latitude : (editingGardu.latt !== undefined ? editingGardu.latt : ''),
        longitude: editingGardu.longitude !== undefined ? editingGardu.longitude : (editingGardu.long !== undefined ? editingGardu.long : ''),
        thnOperasi: editingGardu.thnOperasi !== undefined ? editingGardu.thnOperasi : (editingGardu.tahunOperasi !== undefined ? editingGardu.tahunOperasi : ''),
        unit: editingGardu.unit || 'ULP Baguala',
        ssotNumber: editingGardu.ssotNumber || '',
        tipeGardu: editingGardu.tipeGardu || 'GTT Trafo'
      });
    } else {
      setFormData({
        noBaru: '',
        noGarduLama: '',
        alamat: '',
        penyulang: penyulangList[0]?.namaPenyulang || 'PASSO',
        daya: 160,
        phase: '3 Fasa',
        status: 'Operasi',
        aktif: 'Aktif',
        latitude: -3.6492,
        longitude: 128.2312,
        thnOperasi: new Date().getFullYear(),
        unit: 'ULP Baguala',
        ssotNumber: '',
        tipeGardu: 'GTT Trafo'
      });
    }
  }, [editingGardu, isOpen, penyulangList]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Tidak ada yang mandatori - semua field boleh kosong
    const rawNoBaru = (formData.noBaru || formData.noGarduBaru || '').toString().trim();
    const rawNoLama = (formData.noGarduLama || '').toString().trim();
    const rawAlamat = (formData.alamat || formData.alamatGardu || '').toString().trim();
    const rawPenyulang = (formData.penyulang || '').toString().trim();
    const rawPhase = (formData.phase || formData.jumlahFasa || '3 Fasa').toString().trim();
    const rawStatus = (formData.status || 'Operasi').toString().trim();
    const rawAktif = formData.aktif !== undefined ? String(formData.aktif).trim() : 'Aktif';

    const numDaya = formData.daya !== '' && formData.daya !== undefined ? Number(formData.daya) : 160;
    const numLat = formData.latitude !== '' && formData.latitude !== undefined ? Number(formData.latitude) : (formData.latt !== undefined ? Number(formData.latt) : -3.659);
    const numLong = formData.longitude !== '' && formData.longitude !== undefined ? Number(formData.longitude) : (formData.long !== undefined ? Number(formData.long) : 128.192);
    const numThn = formData.thnOperasi !== '' && formData.thnOperasi !== undefined ? formData.thnOperasi : new Date().getFullYear();

    const displayNoBaru = rawNoBaru || rawNoLama || `GD-${Date.now().toString().slice(-4)}`;
    const displayNoLama = rawNoLama || rawNoBaru || '-';

    const garduData: MasterGardu = {
      id: editingGardu?.id || `gd_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      // 11 Format Kolom Sesuai Permintaan
      noBaru: displayNoBaru,
      noGarduBaru: displayNoBaru,
      noGarduLama: displayNoLama,
      alamat: rawAlamat || '-',
      alamatGardu: rawAlamat || '-',
      penyulang: rawPenyulang || (penyulangList[0]?.namaPenyulang || 'PASSO'),
      daya: isNaN(numDaya) ? 160 : numDaya,
      phase: rawPhase,
      jumlahFasa: rawPhase,
      status: rawStatus,
      aktif: rawAktif,
      latitude: isNaN(numLat) ? 0 : numLat,
      latt: isNaN(numLat) ? 0 : numLat,
      longitude: isNaN(numLong) ? 0 : numLong,
      long: isNaN(numLong) ? 0 : numLong,
      thnOperasi: numThn,
      tahunOperasi: numThn,

      // Supplementary
      unit: formData.unit || 'ULP Baguala',
      ssotNumber: formData.ssotNumber || `SSOT-${displayNoBaru}`,
      tipeGardu: formData.tipeGardu || 'GTT Trafo'
    };

    onSave(garduData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-xl text-white shadow-sm">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">
                {editingGardu ? 'Edit Master Data Gardu' : 'Input Master Data Gardu'}
              </h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Format 11 Kolom Standar
                </span>
                <span className="text-slate-500 text-[10px]">•</span>
                <span className="text-[11px] text-slate-300 font-medium">
                  Semua kolom opsional (tidak ada yang mandatori)
                </span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[78vh] overflow-y-auto">
          
          {/* Information banner */}
          <div className="p-3 bg-blue-50/80 border border-blue-200/80 rounded-xl flex items-start gap-2.5 text-xs text-blue-900">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Form Input Master Gardu Distribusi:</span> Sesuai template tabel master (
              <span className="font-mono text-[11px] text-blue-800 font-bold">
                NO baru, NO GARDU lama, ALAMAT, PENYULANG, DAYA, PHASE, STATUS, AKTIF, LATITUDE, LONGITUDE, THNOPERASI
              </span>). Anda dapat menyimpan data kapan saja tanpa batasan isian wajib.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            
            {/* 1. NO baru */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                1. NO baru
              </label>
              <input
                type="text"
                value={formData.noBaru || ''}
                onChange={(e) => setFormData({ ...formData, noBaru: e.target.value })}
                placeholder="mis. GD-PSO-004 / BG-01"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white placeholder:text-slate-400 placeholder:font-normal"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">Nomor identifikasi gardu baru</span>
            </div>

            {/* 2. NO GARDU lama */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                2. NO GARDU lama
              </label>
              <input
                type="text"
                value={formData.noGarduLama || ''}
                onChange={(e) => setFormData({ ...formData, noGarduLama: e.target.value })}
                placeholder="mis. PSO-004 / B-12"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white placeholder:text-slate-400 placeholder:font-normal"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">Nomor gardu sebelumnya (legacy)</span>
            </div>

            {/* 4. PENYULANG */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                4. PENYULANG
              </label>
              <input
                type="text"
                list="list-penyulang-gardu"
                value={formData.penyulang || ''}
                onChange={(e) => setFormData({ ...formData, penyulang: e.target.value })}
                placeholder="mis. PASSO / LATERI 2"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white placeholder:text-slate-400 placeholder:font-normal"
              />
              <datalist id="list-penyulang-gardu">
                {penyulangList.map((p) => (
                  <option key={p.id} value={p.namaPenyulang}>
                    {p.namaPenyulang} ({p.namaGi || 'GI PASSO'})
                  </option>
                ))}
              </datalist>
              <span className="text-[10px] text-slate-500 mt-0.5 block">Penyulang penyuplai 20kV</span>
            </div>

            {/* 3. ALAMAT (Full width on md) */}
            <div className="md:col-span-2 lg:col-span-3">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                3. ALAMAT
              </label>
              <textarea
                rows={2}
                value={formData.alamat || ''}
                onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                placeholder="mis. Jl. Syaranamual Passo No. 12, Baguala, Kota Ambon"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white placeholder:text-slate-400"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">Alamat fisik atau patokan lokasi gardu trafo</span>
            </div>

            {/* 5. DAYA */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                5. DAYA (kVA)
              </label>
              <input
                type="number"
                step="any"
                value={formData.daya !== undefined ? formData.daya : ''}
                onChange={(e) => setFormData({ ...formData, daya: e.target.value })}
                placeholder="mis. 160"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
              />
              <div className="flex flex-wrap gap-1 mt-1">
                {[50, 100, 160, 250, 400, 630].map((d) => (
                  <button
                    type="button"
                    key={d}
                    onClick={() => setFormData({ ...formData, daya: d })}
                    className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold transition-colors cursor-pointer ${
                      Number(formData.daya) === d
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {d}kVA
                  </button>
                ))}
              </div>
            </div>

            {/* 6. PHASE */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                6. PHASE
              </label>
              <select
                value={formData.phase || '3 Fasa'}
                onChange={(e) => setFormData({ ...formData, phase: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white cursor-pointer"
              >
                <option value="3 Fasa">3 Fasa (3 Phase)</option>
                <option value="1 Fasa">1 Fasa (1 Phase)</option>
                <option value="3">3</option>
                <option value="1">1</option>
              </select>
              <span className="text-[10px] text-slate-500 mt-0.5 block">Jumlah fasa trafo distribusi</span>
            </div>

            {/* 7. STATUS */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                7. STATUS
              </label>
              <input
                type="text"
                list="list-status-gardu"
                value={formData.status || ''}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                placeholder="mis. Operasi / Standby / Pemeliharaan"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
              />
              <datalist id="list-status-gardu">
                <option value="Operasi" />
                <option value="Standby" />
                <option value="Pemeliharaan" />
                <option value="Cadangan" />
                <option value="Gangguan" />
                <option value="Rusak" />
              </datalist>
              <span className="text-[10px] text-slate-500 mt-0.5 block">Status pengoperasian gardu</span>
            </div>

            {/* 8. AKTIF */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                8. AKTIF
              </label>
              <select
                value={formData.aktif !== undefined ? String(formData.aktif) : 'Aktif'}
                onChange={(e) => setFormData({ ...formData, aktif: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white cursor-pointer"
              >
                <option value="Aktif">Aktif</option>
                <option value="Non-Aktif">Non-Aktif</option>
                <option value="Ya">Ya</option>
                <option value="Tidak">Tidak</option>
              </select>
              <span className="text-[10px] text-slate-500 mt-0.5 block">Status keaktifan aset</span>
            </div>

            {/* 9. LATITUDE */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                9. LATITUDE
              </label>
              <input
                type="number"
                step="any"
                value={formData.latitude !== undefined ? formData.latitude : ''}
                onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                placeholder="mis. -3.649200"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">Garis lintang koordinat GIS</span>
            </div>

            {/* 10. LONGITUDE */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                10. LONGITUDE
              </label>
              <input
                type="number"
                step="any"
                value={formData.longitude !== undefined ? formData.longitude : ''}
                onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                placeholder="mis. 128.231200"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">Garis bujur koordinat GIS</span>
            </div>

            {/* 11. THNOPERASI */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                11. THNOPERASI
              </label>
              <input
                type="number"
                min="1970"
                max="2099"
                value={formData.thnOperasi !== undefined ? formData.thnOperasi : ''}
                onChange={(e) => setFormData({ ...formData, thnOperasi: e.target.value })}
                placeholder="mis. 2018"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">Tahun mulai beroperasi / COD</span>
            </div>

          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <div className="text-[11px] text-slate-500 font-medium hidden sm:block">
              * Bebas disimpan tanpa kolom wajib
            </div>
            <div className="flex items-center gap-2 ml-auto">
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
                <span>Simpan Master Gardu</span>
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
