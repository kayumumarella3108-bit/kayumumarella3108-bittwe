import React, { useState } from 'react';
import {
  Shield,
  Wrench,
  Plus,
  Search,
  Pencil,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HardHat,
  Gauge,
  User,
  Calendar
} from 'lucide-react';
import { AlkerApdItem, User as UserType } from '../../types';
import { canEditData } from '../../utils/permissions';

interface AlkerApdViewProps {
  currentUser?: UserType;
  alkerApdList: AlkerApdItem[];
  onAddAlkerApd: (item: AlkerApdItem) => void;
  onUpdateAlkerApd: (item: AlkerApdItem) => void;
  onDeleteAlkerApd: (id: string) => void;
}

export const AlkerApdView: React.FC<AlkerApdViewProps> = ({
  currentUser,
  alkerApdList,
  onAddAlkerApd,
  onUpdateAlkerApd,
  onDeleteAlkerApd
}) => {
  const canEdit = currentUser ? canEditData(currentUser) : true;
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUnit, setSelectedUnit] = useState<string>('Semua');
  const [selectedTipe, setSelectedTipe] = useState<'Semua' | 'Alat Kerja' | 'APD' | 'Alat Ukur'>('Semua');
  const [selectedKondisi, setSelectedKondisi] = useState<'Semua' | 'Baik' | 'Perlu Perbaikan' | 'Rusak'>('Semua');

  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<AlkerApdItem | null>(null);

  const [form, setForm] = useState({
    namaAlker: '',
    tipe: 'Alat Kerja' as 'Alat Kerja' | 'APD' | 'Alat Ukur',
    jumlah: 1,
    kondisi: 'Baik' as 'Baik' | 'Perlu Perbaikan' | 'Rusak',
    tanggalInput: new Date().toISOString().split('T')[0],
    unit: 'ULP Baguala',
    penanggungJawab: 'Tim Yantek ULP Baguala',
    catatan: ''
  });

  const filteredList = alkerApdList.filter((item) => {
    const matchesSearch =
      (item.namaAlker || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.unit && item.unit.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.penanggungJawab && item.penanggungJawab.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.catatan && item.catatan.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesUnit = selectedUnit === 'Semua' || (item.unit || 'ULP Baguala') === selectedUnit;
    const matchesTipe = selectedTipe === 'Semua' || item.tipe === selectedTipe;
    const matchesKondisi = selectedKondisi === 'Semua' || item.kondisi === selectedKondisi;

    return matchesSearch && matchesUnit && matchesTipe && matchesKondisi;
  });

  // Analytics
  const totalItemCount = alkerApdList.reduce((acc, curr) => acc + (Number(curr.jumlah) || 0), 0);
  const totalBaik = alkerApdList.filter((i) => i.kondisi === 'Baik').reduce((acc, curr) => acc + (Number(curr.jumlah) || 0), 0);
  const totalPerluPerbaikan = alkerApdList.filter((i) => i.kondisi === 'Perlu Perbaikan').reduce((acc, curr) => acc + (Number(curr.jumlah) || 0), 0);
  const totalRusak = alkerApdList.filter((i) => i.kondisi === 'Rusak').reduce((acc, curr) => acc + (Number(curr.jumlah) || 0), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem) {
      onUpdateAlkerApd({
        ...editingItem,
        namaAlker: form.namaAlker,
        tipe: form.tipe,
        jumlah: Number(form.jumlah),
        kondisi: form.kondisi,
        tanggalInput: form.tanggalInput,
        unit: form.unit,
        penanggungJawab: form.penanggungJawab,
        catatan: form.catatan
      });
    } else {
      const newItem: AlkerApdItem = {
        id: `alker_${Date.now()}`,
        namaAlker: form.namaAlker,
        tipe: form.tipe,
        jumlah: Number(form.jumlah),
        kondisi: form.kondisi,
        tanggalInput: form.tanggalInput,
        unit: form.unit,
        penanggungJawab: form.penanggungJawab,
        catatan: form.catatan
      };
      onAddAlkerApd(newItem);
    }
    setShowModal(false);
    setEditingItem(null);
  };

  return (
    <div className="p-4 md:p-6 space-y-6 bg-slate-50 min-h-screen text-slate-900 font-sans">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-white border border-slate-200 rounded-3xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-600 text-white rounded-2xl shadow-md shadow-purple-500/20">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 tracking-tight">
              Monitoring Inventaris Alat Kerja & APD Petugas 20kV
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Pencatatan K3, Alat Pelindung Diri (APD), Tools Pemeliharaan & Alat Ukur Terkalibrasi
            </p>
          </div>
        </div>

        {canEdit && (
          <button
            onClick={() => {
              setEditingItem(null);
              setForm({
                namaAlker: '',
                tipe: 'Alat Kerja',
                jumlah: 1,
                kondisi: 'Baik',
                tanggalInput: new Date().toISOString().split('T')[0],
                unit: 'ULP Baguala',
                penanggungJawab: 'Tim Yantek ULP Baguala',
                catatan: 'Gudang Alat ULP Baguala'
              });
              setShowModal(true);
            }}
            className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-purple-500/20 transition-all cursor-pointer self-start md:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>+ Input Data Alker / APD</span>
          </button>
        )}
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Inventaris</div>
            <div className="text-2xl font-black text-slate-900 mt-1">{totalItemCount.toLocaleString()} <span className="text-xs font-normal text-slate-500">Unit</span></div>
          </div>
          <div className="p-3 rounded-2xl bg-slate-100 text-slate-700">
            <Wrench className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Kondisi Baik</div>
            <div className="text-2xl font-black text-emerald-600 mt-1">{totalBaik.toLocaleString()} <span className="text-xs font-normal text-slate-500">Unit</span></div>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Perlu Perbaikan</div>
            <div className="text-2xl font-black text-amber-600 mt-1">{totalPerluPerbaikan.toLocaleString()} <span className="text-xs font-normal text-slate-500">Unit</span></div>
          </div>
          <div className="p-3 rounded-2xl bg-amber-50 text-amber-600">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Kondisi Rusak / Afkir</div>
            <div className="text-2xl font-black text-rose-600 mt-1">{totalRusak.toLocaleString()} <span className="text-xs font-normal text-slate-500">Unit</span></div>
          </div>
          <div className="p-3 rounded-2xl bg-rose-50 text-rose-600">
            <XCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Unit Filter */}
          <select
            value={selectedUnit}
            onChange={(e) => setSelectedUnit(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-extrabold text-slate-700 focus:outline-none focus:border-purple-500"
          >
            <option value="Semua">Semua Unit PLN</option>
            <option value="ULP Baguala">ULP Baguala</option>
            <option value="PLN Nusa Daya">PLN Nusa Daya</option>
            <option value="UP3">UP3</option>
            <option value="UIW">UIW</option>
            <option value="PLN">PLN</option>
          </select>

          {/* Tipe Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            {(['Semua', 'Alat Kerja', 'APD', 'Alat Ukur'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setSelectedTipe(t)}
                className={`px-3 py-1 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                  selectedTipe === t ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Kondisi Filter */}
          <select
            value={selectedKondisi}
            onChange={(e) => setSelectedKondisi(e.target.value as any)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-extrabold text-slate-700 focus:outline-none focus:border-purple-500"
          >
            <option value="Semua">Semua Kondisi</option>
            <option value="Baik">Baik - Siap Pakai</option>
            <option value="Perlu Perbaikan">Perlu Perbaikan</option>
            <option value="Rusak">Rusak / Afkir</option>
          </select>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama alat / penanggung jawab..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-purple-500"
          />
        </div>
      </div>

      {/* Monitoring Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Wrench className="w-4 h-4 text-purple-600" />
            <span>Tabel Monitoring Alat Kerja & APD ({filteredList.length} Item)</span>
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-100/80 text-slate-600 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Nama Alat Kerja / APD</th>
                <th className="py-3 px-4">Tipe / Kategori</th>
                <th className="py-3 px-4 text-center">Jumlah (Qty)</th>
                <th className="py-3 px-4 text-center">Kondisi Alat</th>
                <th className="py-3 px-4">Unit PLN</th>
                <th className="py-3 px-4">Tanggal Input</th>
                <th className="py-3 px-4">Penanggung Jawab</th>
                <th className="py-3 px-4">Catatan / Lokasi</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400 font-medium">
                    Belum ada data Alat Kerja & APD. Silakan klik tombol "+ Input Data".
                  </td>
                </tr>
              ) : (
                filteredList.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-black text-slate-900">
                      <div className="flex items-center gap-2">
                        {item.tipe === 'APD' ? (
                          <HardHat className="w-4 h-4 text-purple-600 shrink-0" />
                        ) : item.tipe === 'Alat Ukur' ? (
                          <Gauge className="w-4 h-4 text-blue-600 shrink-0" />
                        ) : (
                          <Wrench className="w-4 h-4 text-slate-600 shrink-0" />
                        )}
                        <span>{item.namaAlker}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                        item.tipe === 'APD' ? 'bg-purple-100 text-purple-800' :
                        item.tipe === 'Alat Ukur' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-800'
                      }`}>
                        {item.tipe}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-black text-slate-900 text-sm">
                      {item.jumlah} <span className="text-[10px] font-normal text-slate-500">unit</span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {item.kondisi === 'Baik' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-[10px]">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Baik
                        </span>
                      ) : item.kondisi === 'Perlu Perbaikan' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-extrabold text-[10px]">
                          <AlertTriangle className="w-3 h-3 text-amber-600" /> Perlu Perbaikan
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 font-extrabold text-[10px]">
                          <XCircle className="w-3 h-3 text-rose-600" /> Rusak
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[11px] font-extrabold border border-blue-200/60">
                        {item.unit || 'ULP Baguala'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">{item.tanggalInput}</td>
                    <td className="py-3.5 px-4 text-slate-800 font-bold">{item.penanggungJawab || '-'}</td>
                    <td className="py-3.5 px-4 text-slate-600">{item.catatan || '-'}</td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => {
                            setEditingItem(item);
                            setForm({
                              namaAlker: item.namaAlker,
                              tipe: item.tipe,
                              jumlah: item.jumlah,
                              kondisi: item.kondisi,
                              tanggalInput: item.tanggalInput,
                              unit: item.unit || 'ULP Baguala',
                              penanggungJawab: item.penanggungJawab || '',
                              catatan: item.catatan || ''
                            });
                            setShowModal(true);
                          }}
                          className="p-1.5 text-slate-500 hover:text-purple-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteAlkerApd(item.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL INPUT / EDIT */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 bg-purple-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                <h3 className="font-extrabold text-sm">
                  {editingItem ? 'Edit Data Alat Kerja / APD' : 'Form Input Inventaris Alker & APD'}
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-white/80 hover:text-white font-black text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Alat Kerja / APD</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Sabuk Pengaman Full Body Harness, Tang Press 20kV, Helm Safety"
                  value={form.namaAlker}
                  onChange={(e) => setForm({ ...form, namaAlker: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tipe / Kategori</label>
                  <select
                    value={form.tipe}
                    onChange={(e) => setForm({ ...form, tipe: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-purple-500"
                  >
                    <option value="Alat Kerja">Alat Kerja</option>
                    <option value="APD">APD (Alat Pelindung Diri)</option>
                    <option value="Alat Ukur">Alat Ukur / Testing</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Jumlah (Qty)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={form.jumlah}
                    onChange={(e) => setForm({ ...form, jumlah: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kondisi Alat</label>
                  <select
                    value={form.kondisi}
                    onChange={(e) => setForm({ ...form, kondisi: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-purple-500"
                  >
                    <option value="Baik">Baik - Siap Pakai</option>
                    <option value="Perlu Perbaikan">Perlu Perbaikan</option>
                    <option value="Rusak">Rusak / Afkir</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Input</label>
                  <input
                    type="date"
                    required
                    value={form.tanggalInput}
                    onChange={(e) => setForm({ ...form, tanggalInput: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Unit PLN</label>
                  <select
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-extrabold text-slate-800 focus:outline-none focus:border-purple-500"
                    required
                  >
                    <option value="ULP Baguala">ULP Baguala</option>
                    <option value="PLN Nusa Daya">PLN Nusa Daya</option>
                    <option value="UP3">UP3</option>
                    <option value="UIW">UIW</option>
                    <option value="PLN">PLN</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Penanggung Jawab / Tim</label>
                  <input
                    type="text"
                    placeholder="Contoh: Tim Yantek Baguala / Petugas A"
                    value={form.penanggungJawab}
                    onChange={(e) => setForm({ ...form, penanggungJawab: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Catatan / Masa Kalibrasi / Penyimpanan</label>
                <input
                  type="text"
                  placeholder="Contoh: Tersimpan di Lemari APD Baguala / Kalibrasi s.d 2027"
                  value={form.catatan}
                  onChange={(e) => setForm({ ...form, catatan: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-extrabold shadow-md shadow-purple-500/20 cursor-pointer"
                >
                  Simpan Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
