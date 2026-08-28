import React, { useState, useMemo } from 'react';
import {
  Zap,
  Activity,
  Search,
  Plus,
  Trash2,
  Edit2,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Filter,
  X,
  Gauge,
  ShieldAlert,
  Flame,
  Scale
} from 'lucide-react';
import { MeterSLItem, User } from '../../types';
import { canEditData } from '../../utils/permissions';
import { DAFTAR_UNIT_PLN } from '../../utils/unitConfig';

interface MeterSLViewProps {
  currentUser?: User | null;
  meterSLList?: MeterSLItem[];
  onAdd?: (item: MeterSLItem) => void;
  onUpdate?: (item: MeterSLItem) => void;
  onDelete?: (id: string) => void;
}

const INITIAL_MOCK_METER_SL: MeterSLItem[] = [
  {
    id: 'msl-1',
    idPelangganOrLokasi: 'PJU-BGL-014',
    namaPemohonOrPelanggan: 'PJU Titik Jalan Wolter Monginsidi',
    kategoriSL: 'PJU (Penerangan Jalan Umum)',
    lokasiAlamat: 'Sepanjang Jl. Wolter Monginsidi KM 12',
    dayaKva: 11.0,
    arusNominalAmpere: 16.7,
    tipePengukuran: 'Langsung (Direct)',
    pembatasArus: 'MCB 3x16A',
    faktorKaliMeter: 1,
    tglPemeriksaan: '2026-08-21',
    statusKelayakan: 'SESUAI_STANDAR',
    tindakanRekomendasi: 'Timer PJU dan pembatas arus berfungsi normal sesuai kuota daya.',
    petugasPemeriksa: 'Regu Transaksi Energi',
    unit: 'ULP Baguala',
    kodeUnit: '54110'
  },
  {
    id: 'msl-2',
    idPelangganOrLokasi: 'PS-2026-0881',
    namaPemohonOrPelanggan: 'Pesta Pernikahan Lapangan Hatukau',
    kategoriSL: 'Pesta / Penerangan Sementara',
    lokasiAlamat: 'Kompleks Lapangan Hatukau, Batumerah',
    dayaKva: 23.0,
    arusNominalAmpere: 34.8,
    tipePengukuran: 'Langsung (Direct)',
    pembatasArus: 'MCCB 3x35A',
    faktorKaliMeter: 1,
    tglPemeriksaan: '2026-08-24',
    statusKelayakan: 'SESUAI_STANDAR',
    tindakanRekomendasi: 'Penerangan sementara 3 hari, kWh prabayar mobile terpasang aman.',
    petugasPemeriksa: 'Regu Yanbung & TE',
    unit: 'ULP Baguala',
    kodeUnit: '54110'
  },
  {
    id: 'msl-3',
    idPelangganOrLokasi: 'SL-AUDIT-092',
    namaPemohonOrPelanggan: 'Audit Sambungan Langsung Tambak Ikan',
    kategoriSL: 'Audit Sambungan Langsung',
    lokasiAlamat: 'Pesisir Pantai Waiheru RT 04',
    dayaKva: 16.5,
    arusNominalAmpere: 28.5,
    tipePengukuran: 'CT / Indirect',
    pembatasArus: 'MCB 3x25A',
    faktorKaliMeter: 1,
    tglPemeriksaan: '2026-08-25',
    statusKelayakan: 'POTENSI_SUSUT',
    tindakanRekomendasi: 'Ditemukan kabel sambung langsung tanpa kWh meter. Diterbitkan BAP Penertiban P2TL.',
    petugasPemeriksa: 'Tim P2TL & Transaksi Energi',
    unit: 'ULP Baguala',
    kodeUnit: '54110'
  }
];

export const MeterSLView: React.FC<MeterSLViewProps> = ({
  currentUser,
  meterSLList = INITIAL_MOCK_METER_SL,
  onAdd,
  onUpdate,
  onDelete
}) => {
  const [items, setItems] = useState<MeterSLItem[]>(meterSLList);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterUnit, setFilterUnit] = useState('SEMUA');
  const [filterKategori, setFilterKategori] = useState('SEMUA');
  const [filterStatus, setFilterStatus] = useState('SEMUA');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MeterSLItem | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<MeterSLItem>>({
    idPelangganOrLokasi: '',
    namaPemohonOrPelanggan: '',
    kategoriSL: 'PJU (Penerangan Jalan Umum)',
    lokasiAlamat: '',
    dayaKva: 11,
    arusNominalAmpere: 16.5,
    tipePengukuran: 'Langsung (Direct)',
    pembatasArus: 'MCB 3x16A',
    faktorKaliMeter: 1,
    tglPemeriksaan: new Date().toISOString().split('T')[0],
    statusKelayakan: 'SESUAI_STANDAR',
    tindakanRekomendasi: '',
    petugasPemeriksa: currentUser?.name || 'Regu Transaksi Energi',
    unit: currentUser?.unit || 'ULP Baguala'
  });

  const canEdit = canEditData(currentUser);

  React.useEffect(() => {
    if (meterSLList && meterSLList.length > 0) {
      setItems(meterSLList);
    }
  }, [meterSLList]);

  const filteredData = useMemo(() => {
    return items.filter((item) => {
      const matchSearch =
        item.namaPemohonOrPelanggan.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.idPelangganOrLokasi.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.lokasiAlamat.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.pembatasArus.toLowerCase().includes(searchQuery.toLowerCase());

      const matchUnit = filterUnit === 'SEMUA' || item.unit === filterUnit;
      const matchKategori = filterKategori === 'SEMUA' || item.kategoriSL === filterKategori;
      const matchStatus = filterStatus === 'SEMUA' || item.statusKelayakan === filterStatus;

      return matchSearch && matchUnit && matchKategori && matchStatus;
    });
  }, [items, searchQuery, filterUnit, filterKategori, filterStatus]);

  // Stats
  const totalCount = items.length;
  const pjuCount = items.filter((i) => i.kategoriSL.includes('PJU')).length;
  const potensiSusutCount = items.filter((i) => i.statusKelayakan === 'POTENSI_SUSUT' || i.statusKelayakan === 'TERTIBKAN_P2TL').length;
  const sesuaiStandarCount = items.filter((i) => i.statusKelayakan === 'SESUAI_STANDAR').length;

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      idPelangganOrLokasi: '',
      namaPemohonOrPelanggan: '',
      kategoriSL: 'PJU (Penerangan Jalan Umum)',
      lokasiAlamat: '',
      dayaKva: 11,
      arusNominalAmpere: 16.5,
      tipePengukuran: 'Langsung (Direct)',
      pembatasArus: 'MCB 3x16A',
      faktorKaliMeter: 1,
      tglPemeriksaan: new Date().toISOString().split('T')[0],
      statusKelayakan: 'SESUAI_STANDAR',
      tindakanRekomendasi: '',
      petugasPemeriksa: currentUser?.name || 'Regu Transaksi Energi',
      unit: currentUser?.unit || 'ULP Baguala'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: MeterSLItem) => {
    setEditingItem(item);
    setFormData({ ...item });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.idPelangganOrLokasi || !formData.namaPemohonOrPelanggan) {
      alert('Mohon lengkapi ID Pelanggan/Lokasi dan Nama Pemohon/Pelanggan!');
      return;
    }

    // Force unit and kodeUnit for restricted users
    const finalUnit = canEdit ? formData.unit || currentUser?.unit || 'ULP Baguala' : currentUser?.unit || 'ULP Baguala';
    const finalKodeUnit = getKodeUnitByUnitName(finalUnit);

    if (editingItem) {
      const updated: MeterSLItem = {
        ...editingItem,
        ...(formData as MeterSLItem),
        unit: finalUnit,
        kodeUnit: finalKodeUnit
      };
      const newItems = items.map((i) => (i.id === editingItem.id ? updated : i));
      setItems(newItems);
      if (onUpdate) onUpdate(updated);
    } else {
      const newItem: MeterSLItem = {
        id: `msl-${Date.now()}`,
        idPelangganOrLokasi: formData.idPelangganOrLokasi || '',
        namaPemohonOrPelanggan: formData.namaPemohonOrPelanggan || '',
        kategoriSL: formData.kategoriSL || 'PJU (Penerangan Jalan Umum)',
        lokasiAlamat: formData.lokasiAlamat || '',
        dayaKva: Number(formData.dayaKva) || 0,
        arusNominalAmpere: Number(formData.arusNominalAmpere) || 0,
        tipePengukuran: formData.tipePengukuran || 'Langsung (Direct)',
        pembatasArus: formData.pembatasArus || 'MCB',
        faktorKaliMeter: Number(formData.faktorKaliMeter) || 1,
        tglPemeriksaan: formData.tglPemeriksaan || new Date().toISOString().split('T')[0],
        statusKelayakan: formData.statusKelayakan || 'SESUAI_STANDAR',
        tindakanRekomendasi: formData.tindakanRekomendasi || '',
        petugasPemeriksa: formData.petugasPemeriksa || 'Petugas TE',
        unit: finalUnit,
        kodeUnit: finalKodeUnit
      };
      setItems([newItem, ...items]);
      if (onAdd) onAdd(newItem);
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Hapus data Meter Sambungan Langsung (SL) ini?')) {
      const filtered = items.filter((i) => i.id !== id);
      setItems(filtered);
      if (onDelete) onDelete(id);
    }
  };

  const handleExportCSV = () => {
    const headers = [
      'ID / Lokasi SL',
      'Nama Pemohon / Pelanggan',
      'Kategori SL',
      'Lokasi Alamat',
      'Daya (kVA)',
      'Arus (A)',
      'Tipe Pengukuran',
      'Pembatas Arus',
      'Faktor Kali',
      'Tgl Pemeriksaan',
      'Status Kelayakan',
      'Rekomendasi Tindakan',
      'Petugas',
      'Unit'
    ];

    const rows = filteredData.map((item) => [
      item.idPelangganOrLokasi,
      `"${item.namaPemohonOrPelanggan}"`,
      item.kategoriSL,
      `"${item.lokasiAlamat}"`,
      item.dayaKva,
      item.arusNominalAmpere,
      item.tipePengukuran,
      item.pembatasArus,
      item.faktorKaliMeter,
      item.tglPemeriksaan,
      item.statusKelayakan,
      `"${item.tindakanRekomendasi || ''}"`,
      item.petugasPemeriksa,
      item.unit
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Meter_SL_PLN_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto font-sans text-slate-800">
      {/* Header Bar */}
      <div className="bg-gradient-to-r from-[#022623] via-[#044c45] to-[#022e2a] rounded-3xl p-6 text-white shadow-2xl border-2 border-teal-500/60 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-teal-950/80 border border-teal-500/40 rounded-2xl text-teal-300 shadow-inner">
                <Scale className="w-6 h-6 text-amber-300" />
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-teal-500/20 border border-teal-500/40 text-teal-300 text-xs font-black uppercase tracking-wider">
                Transaksi Energi • Pengukuran Sambungan Langsung
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white drop-shadow-xs">
              METER SAMBUNGAN LANGSUNG (METER SL & AUDIT PJU)
            </h1>
            <p className="text-xs sm:text-sm text-teal-100/90 max-w-3xl leading-relaxed font-medium">
              Pengelolaan & audit teknis sambungan langsung, pengukuran beban PJU resmi/swadaya, penerangan pesta temporer, serta pencegahan susut non-teknis.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {canEdit && (
              <button
                onClick={handleOpenAdd}
                className="px-4 py-2.5 bg-gradient-to-r from-teal-400 to-emerald-400 hover:from-teal-300 hover:to-emerald-300 text-slate-950 font-black text-xs rounded-xl shadow-lg border border-teal-200 flex items-center gap-2 transition-all cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Input Pemeriksaan Meter SL</span>
              </button>
            )}
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2.5 bg-[#012521] hover:bg-[#02312b] text-teal-200 border border-teal-500/50 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-teal-50 text-teal-700 rounded-xl border border-teal-100">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Titik Terdata</div>
            <div className="text-xl font-black text-slate-900">{totalCount} Titik</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-amber-50 text-amber-700 rounded-xl border border-amber-100">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">PJU & Penerangan</div>
            <div className="text-xl font-black text-amber-600">{pjuCount} Titik</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Sesuai Standar</div>
            <div className="text-xl font-black text-emerald-600">{sesuaiStandarCount} Lokasi</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-rose-50 text-rose-700 rounded-xl border border-rose-100">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Potensi Susut / P2TL</div>
            <div className="text-xl font-black text-rose-600">{potensiSusutCount} Kasus</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari ID Titik, Pemohon, Lokasi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:bg-white focus:border-teal-500"
            />
          </div>

          <select
            value={filterUnit}
            onChange={(e) => setFilterUnit(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-teal-500"
          >
            <option value="SEMUA">🌐 Semua Unit PLN</option>
            {DAFTAR_UNIT_PLN.map((u, i) => (
              <option key={i} value={u.namaUnit}>
                {u.namaUnit}
              </option>
            ))}
          </select>

          <select
            value={filterKategori}
            onChange={(e) => setFilterKategori(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-teal-500"
          >
            <option value="SEMUA">Semua Kategori SL</option>
            <option value="PJU (Penerangan Jalan Umum)">PJU (Penerangan Jalan Umum)</option>
            <option value="Pesta / Penerangan Sementara">Pesta / Penerangan Sementara</option>
            <option value="Proyek Konstruksi">Proyek Konstruksi</option>
            <option value="Pelanggan Prabayar SL">Pelanggan Prabayar SL</option>
            <option value="Audit Sambungan Langsung">Audit Sambungan Langsung</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-teal-500"
          >
            <option value="SEMUA">Semua Status Kelayakan</option>
            <option value="SESUAI_STANDAR">Sesuai Standar</option>
            <option value="ANOMALI_ARUS">Anomali Arus</option>
            <option value="POTENSI_SUSUT">Potensi Susut</option>
            <option value="TERTIBKAN_P2TL">Tertibkan P2TL</option>
          </select>
        </div>

        <div className="text-xs text-slate-500 font-bold">
          Menampilkan <span className="text-teal-700 font-black">{filteredData.length}</span> dari {items.length} titik
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-black tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3.5">ID / Nama Pemohon</th>
                <th className="px-4 py-3.5">Kategori & Tipe</th>
                <th className="px-4 py-3.5">Beban Daya & Arus</th>
                <th className="px-4 py-3.5">Pembatas & Faktor Kali</th>
                <th className="px-4 py-3.5">Hasil & Rekomendasi</th>
                <th className="px-4 py-3.5">Petugas & Tgl</th>
                <th className="px-4 py-3.5">Status</th>
                {canEdit && <th className="px-4 py-3.5 text-center">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400 font-medium">
                    Belum ada data pemeriksaan Meter Sambungan Langsung (SL) yang cocok.
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-black text-slate-900 font-mono text-[11px]">{item.idPelangganOrLokasi}</div>
                      <div className="font-bold text-slate-700">{item.namaPemohonOrPelanggan}</div>
                      <div className="text-[10px] text-slate-400 truncate max-w-xs">{item.lokasiAlamat}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 font-extrabold text-[10px] border border-teal-200">
                        {item.kategoriSL}
                      </span>
                      <div className="text-[10px] text-slate-500 font-bold mt-1">Metode: {item.tipePengukuran}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-black text-slate-900">{item.dayaKva} kVA</div>
                      <div className="text-[10px] text-amber-700 font-bold">Arus: {item.arusNominalAmpere} A</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-800">{item.pembatasArus}</div>
                      <div className="text-[10px] text-slate-500">FK: x{item.faktorKaliMeter}</div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-[10px] text-slate-600 max-w-xs line-clamp-2 leading-relaxed">
                        {item.tindakanRekomendasi || 'Pengukuran normal sesuai kontrak.'}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-800">{item.petugasPemeriksa}</div>
                      <div className="text-[10px] text-slate-400">{item.tglPemeriksaan}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase inline-flex items-center gap-1 ${
                        item.statusKelayakan === 'SESUAI_STANDAR'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : item.statusKelayakan === 'POTENSI_SUSUT' || item.statusKelayakan === 'TERTIBKAN_P2TL'
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}>
                        {item.statusKelayakan === 'SESUAI_STANDAR'
                          ? '✓ Sesuai Standar'
                          : item.statusKelayakan === 'POTENSI_SUSUT'
                          ? '⚠️ Potensi Susut'
                          : item.statusKelayakan === 'TERTIBKAN_P2TL'
                          ? '🚨 Tertibkan P2TL'
                          : 'Anomali'}
                      </span>
                    </td>
                    {canEdit && (
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Data"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Hapus Data"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full p-6 text-slate-800 space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-teal-100 text-teal-800 rounded-xl">
                  <Scale className="w-5 h-5" />
                </div>
                <h3 className="text-base font-black text-slate-900">
                  {editingItem ? 'Edit Data Pemeriksaan Meter SL' : 'Input Audit / Sambungan Langsung Baru'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-black text-slate-700 mb-1">ID Titik / No Permohonan *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: PJU-BGL-014 atau PS-2026-0881"
                    value={formData.idPelangganOrLokasi || ''}
                    onChange={(e) => setFormData({ ...formData, idPelangganOrLokasi: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold font-mono focus:bg-white focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-700 mb-1">Nama Pemohon / Uraian Beban *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: PJU Titik Jl. Wolter / Pesta"
                    value={formData.namaPemohonOrPelanggan || ''}
                    onChange={(e) => setFormData({ ...formData, namaPemohonOrPelanggan: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:bg-white focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-700 mb-1">Kategori Sambungan Langsung</label>
                  <select
                    value={formData.kategoriSL || 'PJU (Penerangan Jalan Umum)'}
                    onChange={(e) => setFormData({ ...formData, kategoriSL: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:bg-white focus:border-teal-500"
                  >
                    <option value="PJU (Penerangan Jalan Umum)">PJU (Penerangan Jalan Umum)</option>
                    <option value="Pesta / Penerangan Sementara">Pesta / Penerangan Sementara</option>
                    <option value="Proyek Konstruksi">Proyek Konstruksi</option>
                    <option value="Pelanggan Prabayar SL">Pelanggan Prabayar SL</option>
                    <option value="Audit Sambungan Langsung">Audit Sambungan Langsung (Penertiban)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-700 mb-1">Unit PLN</label>
                  <select
                    value={formData.unit || 'ULP Baguala'}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:bg-white focus:border-teal-500"
                  >
                    {DAFTAR_UNIT_PLN.map((u, i) => (
                      <option key={i} value={u.namaUnit}>
                        {u.namaUnit}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-black text-slate-700 mb-1">Alamat / Titik Koordinat Lokasi</label>
                  <input
                    type="text"
                    placeholder="Contoh: Depan Kantor Camat Baguala"
                    value={formData.lokasiAlamat || ''}
                    onChange={(e) => setFormData({ ...formData, lokasiAlamat: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:border-teal-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600">Daya Beban (kVA)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.dayaKva ?? 11}
                      onChange={(e) => setFormData({ ...formData, dayaKva: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600">Arus Nominal (A)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.arusNominalAmpere ?? 16.5}
                      onChange={(e) => setFormData({ ...formData, arusNominalAmpere: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600">Tipe Pengukuran</label>
                    <select
                      value={formData.tipePengukuran || 'Langsung (Direct)'}
                      onChange={(e) => setFormData({ ...formData, tipePengukuran: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                    >
                      <option value="Langsung (Direct)">Langsung (Direct)</option>
                      <option value="CT / Indirect">CT / Indirect</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600">Pembatas Arus</label>
                    <input
                      type="text"
                      placeholder="MCB 3x16A / MCCB"
                      value={formData.pembatasArus || 'MCB 3x16A'}
                      onChange={(e) => setFormData({ ...formData, pembatasArus: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-700 mb-1">Status Kelayakan Teknis</label>
                  <select
                    value={formData.statusKelayakan || 'SESUAI_STANDAR'}
                    onChange={(e) => setFormData({ ...formData, statusKelayakan: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:bg-white focus:border-teal-500"
                  >
                    <option value="SESUAI_STANDAR">SESUAI STANDAR</option>
                    <option value="ANOMALI_ARUS">ANOMALI ARUS (BEBAN LEBIH)</option>
                    <option value="POTENSI_SUSUT">POTENSI SUSUT NON-TEKNIS</option>
                    <option value="TERTIBKAN_P2TL">PERLU PENERTIBAN P2TL</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-700 mb-1">Petugas Pemeriksa</label>
                  <input
                    type="text"
                    value={formData.petugasPemeriksa || ''}
                    onChange={(e) => setFormData({ ...formData, petugasPemeriksa: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:bg-white focus:border-teal-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-black text-slate-700 mb-1">Rekomendasi & Tindak Lanjut</label>
                  <textarea
                    rows={2}
                    placeholder="Tuliskan rekomendasi teknis penertiban / perapihan sambungan..."
                    value={formData.tindakanRekomendasi || ''}
                    onChange={(e) => setFormData({ ...formData, tindakanRekomendasi: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white font-black shadow-md shadow-teal-600/20 transition-all cursor-pointer"
                >
                  {editingItem ? 'Simpan Perubahan' : 'Simpan Data SL'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
