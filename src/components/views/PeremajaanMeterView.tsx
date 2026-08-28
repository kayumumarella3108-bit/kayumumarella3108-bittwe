import React, { useState, useMemo } from 'react';
import {
  Zap,
  RotateCw,
  Search,
  Plus,
  Trash2,
  Edit2,
  FileSpreadsheet,
  Printer,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Layers,
  Filter,
  X,
  Building2,
  UserCheck,
  ShieldAlert
} from 'lucide-react';
import { PeremajaanMeterItem, User } from '../../types';
import { getKodeUnitByUnitName } from '../../utils/unitConfig';
import { canEditData } from '../../utils/permissions';
import { DAFTAR_UNIT_PLN } from '../../utils/unitConfig';

interface PeremajaanMeterViewProps {
  currentUser?: User | null;
  peremajaanList?: PeremajaanMeterItem[];
  onAdd?: (item: PeremajaanMeterItem) => void;
  onUpdate?: (item: PeremajaanMeterItem) => void;
  onDelete?: (id: string) => void;
}

const INITIAL_MOCK_PEREMAJAAN: PeremajaanMeterItem[] = [
  {
    id: 'pm-1',
    idPelanggan: '541100982311',
    namaPelanggan: 'Bpk. Markus Latumahina',
    tarifDaya: 'R1 / 1300 VA',
    alamat: 'Jl. Wolter Monginsidi No. 45, Passo, Baguala',
    noMeterLama: '1423889102',
    merekMeterLama: 'Actaris (Analog)',
    standMeterLama: 48920,
    noMeterBaru: '86019928104',
    merekMeterBaru: 'Hexing Prabayar',
    standMeterBaru: 0,
    noSegelBaru: 'SGL-BGL-88219',
    alasanPeremajaan: 'Meter Tua (>10 Thn)',
    petugasPelaksana: 'Tim Yantek Regu A',
    tglPelaksanaan: '2026-08-20',
    status: 'SELESAI',
    catatan: 'Migrasi pascabayar piringan tua ke prabayar digital berjalan lancar.',
    unit: 'ULP Baguala',
    kodeUnit: '54110'
  },
  {
    id: 'pm-2',
    idPelanggan: '541100445129',
    namaPelanggan: 'Ibu Sarah Wattimena',
    tarifDaya: 'R1 / 900 VA',
    alamat: 'Komp. Larier Indah Blok C3, Baguala',
    noMeterLama: '3201449811',
    merekMeterLama: 'Melcoindo',
    standMeterLama: 12450,
    noMeterBaru: '86021104859',
    merekMeterBaru: 'Smart Meter AMI Sanxing',
    standMeterBaru: 0,
    noSegelBaru: 'SGL-BGL-88220',
    alasanPeremajaan: 'Meter Macet / Rusak',
    petugasPelaksana: 'Tim Yantek Regu B',
    tglPelaksanaan: '2026-08-22',
    status: 'SELESAI',
    catatan: 'Display LCD buram tidak terbaca, diganti dengan Smart Meter AMI.',
    unit: 'ULP Baguala',
    kodeUnit: '54110'
  },
  {
    id: 'pm-3',
    idPelanggan: '541100778102',
    namaPelanggan: 'Toko Berkat Anugerah (Bpk. J. Tetelepta)',
    tarifDaya: 'B1 / 5500 VA',
    alamat: 'Jl. Raya Suli, Passo Atas',
    noMeterLama: '5419902188',
    merekMeterLama: 'Itron Pascabayar',
    standMeterLama: 63100,
    noMeterBaru: '86034459012',
    merekMeterBaru: 'Itron Smart AMI 3 Phasa',
    standMeterBaru: 0,
    noSegelBaru: 'SGL-BGL-88221',
    alasanPeremajaan: 'Pindah Pasca ke Pra',
    petugasPelaksana: 'Regu Transaksi Energi',
    tglPelaksanaan: '2026-08-25',
    status: 'DALAM_PROSES',
    catatan: 'Proses pemasangan box APDAL & CT baru.',
    unit: 'ULP Baguala',
    kodeUnit: '54110'
  }
];

export const PeremajaanMeterView: React.FC<PeremajaanMeterViewProps> = ({
  currentUser,
  peremajaanList = INITIAL_MOCK_PEREMAJAAN,
  onAdd,
  onUpdate,
  onDelete
}) => {
  const [items, setItems] = useState<PeremajaanMeterItem[]>(peremajaanList);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterUnit, setFilterUnit] = useState('SEMUA');
  const [filterStatus, setFilterStatus] = useState('SEMUA');
  const [filterAlasan, setFilterAlasan] = useState('SEMUA');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PeremajaanMeterItem | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<PeremajaanMeterItem>>({
    idPelanggan: '',
    namaPelanggan: '',
    tarifDaya: 'R1 / 1300 VA',
    alamat: '',
    noMeterLama: '',
    merekMeterLama: '',
    standMeterLama: 0,
    noMeterBaru: '',
    merekMeterBaru: 'Smart Meter AMI',
    standMeterBaru: 0,
    noSegelBaru: '',
    alasanPeremajaan: 'Meter Tua (>10 Thn)',
    petugasPelaksana: '',
    tglPelaksanaan: new Date().toISOString().split('T')[0],
    status: 'SELESAI',
    catatan: '',
    unit: currentUser?.unit || 'ULP Baguala'
  });

  const canEdit = canEditData(currentUser);

  // Sync if props update
  React.useEffect(() => {
    if (peremajaanList && peremajaanList.length > 0) {
      setItems(peremajaanList);
    }
  }, [peremajaanList]);

  // Filtered List
  const filteredData = useMemo(() => {
    return items.filter((item) => {
      const matchSearch =
        item.namaPelanggan.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.idPelanggan.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.noMeterLama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.noMeterBaru.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.alamat.toLowerCase().includes(searchQuery.toLowerCase());

      const matchUnit = filterUnit === 'SEMUA' || item.unit === filterUnit;
      const matchStatus = filterStatus === 'SEMUA' || item.status === filterStatus;
      const matchAlasan = filterAlasan === 'SEMUA' || item.alasanPeremajaan === filterAlasan;

      return matchSearch && matchUnit && matchStatus && matchAlasan;
    });
  }, [items, searchQuery, filterUnit, filterStatus, filterAlasan]);

  // Stats
  const totalCount = items.length;
  const selesaiCount = items.filter((i) => i.status === 'SELESAI').length;
  const prosesCount = items.filter((i) => i.status === 'DALAM_PROSES').length;
  const meterTuaCount = items.filter((i) => i.alasanPeremajaan.includes('Tua')).length;
  const meterMacetCount = items.filter((i) => i.alasanPeremajaan.includes('Macet') || i.alasanPeremajaan.includes('Rusak')).length;

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      idPelanggan: '',
      namaPelanggan: '',
      tarifDaya: 'R1 / 1300 VA',
      alamat: '',
      noMeterLama: '',
      merekMeterLama: '',
      standMeterLama: 0,
      noMeterBaru: '',
      merekMeterBaru: 'Smart Meter AMI',
      standMeterBaru: 0,
      noSegelBaru: '',
      alasanPeremajaan: 'Meter Tua (>10 Thn)',
      petugasPelaksana: currentUser?.name || 'Regu Transaksi Energi',
      tglPelaksanaan: new Date().toISOString().split('T')[0],
      status: 'SELESAI',
      catatan: '',
      unit: currentUser?.unit || 'ULP Baguala'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: PeremajaanMeterItem) => {
    setEditingItem(item);
    setFormData({ ...item });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.idPelanggan || !formData.namaPelanggan || !formData.noMeterBaru) {
      alert('Mohon lengkapi ID Pelanggan, Nama Pelanggan, dan No Meter Baru!');
      return;
    }

    // Force unit and kodeUnit for restricted users
    const finalUnit = canEdit ? formData.unit || currentUser?.unit || 'ULP Baguala' : currentUser?.unit || 'ULP Baguala';
    const finalKodeUnit = getKodeUnitByUnitName(finalUnit);

    if (editingItem) {
      const updated: PeremajaanMeterItem = {
        ...editingItem,
        ...(formData as PeremajaanMeterItem),
        unit: finalUnit,
        kodeUnit: finalKodeUnit
      };
      const newItems = items.map((i) => (i.id === editingItem.id ? updated : i));
      setItems(newItems);
      if (onUpdate) onUpdate(updated);
    } else {
      const newItem: PeremajaanMeterItem = {
        id: `pm-${Date.now()}`,
        idPelanggan: formData.idPelanggan || '',
        namaPelanggan: formData.namaPelanggan || '',
        tarifDaya: formData.tarifDaya || 'R1 / 1300 VA',
        alamat: formData.alamat || '',
        noMeterLama: formData.noMeterLama || '',
        merekMeterLama: formData.merekMeterLama || '',
        standMeterLama: Number(formData.standMeterLama) || 0,
        noMeterBaru: formData.noMeterBaru || '',
        merekMeterBaru: formData.merekMeterBaru || '',
        standMeterBaru: Number(formData.standMeterBaru) || 0,
        noSegelBaru: formData.noSegelBaru || '',
        alasanPeremajaan: formData.alasanPeremajaan || 'Meter Tua (>10 Thn)',
        petugasPelaksana: formData.petugasPelaksana || 'Petugas TE',
        tglPelaksanaan: formData.tglPelaksanaan || new Date().toISOString().split('T')[0],
        status: (formData.status as any) || 'SELESAI',
        catatan: formData.catatan || '',
        unit: finalUnit,
        kodeUnit: finalKodeUnit
      };
      setItems([newItem, ...items]);
      if (onAdd) onAdd(newItem);
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Hapus data peremajaan meter ini?')) {
      const filtered = items.filter((i) => i.id !== id);
      setItems(filtered);
      if (onDelete) onDelete(id);
    }
  };

  const handleExportCSV = () => {
    const headers = [
      'ID Pelanggan',
      'Nama Pelanggan',
      'Tarif / Daya',
      'Alamat',
      'No Meter Lama',
      'Merek Lama',
      'Stand Lama',
      'No Meter Baru',
      'Merek Baru',
      'Stand Baru',
      'No Segel Baru',
      'Alasan Peremajaan',
      'Petugas',
      'Tanggal',
      'Status',
      'Unit'
    ];

    const rows = filteredData.map((item) => [
      item.idPelanggan,
      `"${item.namaPelanggan}"`,
      item.tarifDaya,
      `"${item.alamat}"`,
      item.noMeterLama,
      item.merekMeterLama,
      item.standMeterLama,
      item.noMeterBaru,
      item.merekMeterBaru,
      item.standMeterBaru,
      item.noSegelBaru,
      `"${item.alasanPeremajaan}"`,
      item.petugasPelaksana,
      item.tglPelaksanaan,
      item.status,
      item.unit
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Peremajaan_Meter_PLN_${new Date().toISOString().slice(0, 10)}.csv`);
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
                <RotateCw className="w-6 h-6 text-amber-300" />
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-teal-500/20 border border-teal-500/40 text-teal-300 text-xs font-black uppercase tracking-wider">
                Transaksi Energi • Penggantian kWh Meter
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white drop-shadow-xs">
              PEREMAJAAN METER LISTRIK (KWH METER TUA & RUSAK)
            </h1>
            <p className="text-xs sm:text-sm text-teal-100/90 max-w-3xl leading-relaxed font-medium">
              Monitoring penggantian kWh meter macet/buram, modernisasi ke Smart Meter AMI, pembaruan segel APDAL, dan audit akurasi pengukuran pelanggan.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {canEdit && (
              <button
                onClick={handleOpenAdd}
                className="px-4 py-2.5 bg-gradient-to-r from-teal-400 to-emerald-400 hover:from-teal-300 hover:to-emerald-300 text-slate-950 font-black text-xs rounded-xl shadow-lg border border-teal-200 flex items-center gap-2 transition-all cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Input Peremajaan Meter</span>
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
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Peremajaan</div>
            <div className="text-xl font-black text-slate-900">{totalCount} Unit</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Selesai Terpasang</div>
            <div className="text-xl font-black text-emerald-600">{selesaiCount} Pelanggan</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-amber-50 text-amber-700 rounded-xl border border-amber-100">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Meter Tua (&gt;10 Thn)</div>
            <div className="text-xl font-black text-amber-600">{meterTuaCount} Unit</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-rose-50 text-rose-700 rounded-xl border border-rose-100">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Macet / Rusak</div>
            <div className="text-xl font-black text-rose-600">{meterMacetCount} Kasus</div>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari ID Pelanggan, Nama, No Meter..."
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
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-teal-500"
          >
            <option value="SEMUA">Semua Status</option>
            <option value="SELESAI">Selesai</option>
            <option value="DALAM_PROSES">Dalam Proses</option>
            <option value="MENUNGGU_APPROVAL">Menunggu Approval</option>
          </select>

          <select
            value={filterAlasan}
            onChange={(e) => setFilterAlasan(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-teal-500"
          >
            <option value="SEMUA">Semua Alasan Peremajaan</option>
            <option value="Meter Tua (>10 Thn)">Meter Tua (&gt;10 Thn)</option>
            <option value="Meter Macet / Rusak">Meter Macet / Rusak</option>
            <option value="Layar Buram">Layar Buram</option>
            <option value="Piringan Aus">Piringan Aus</option>
            <option value="Pindah Pasca ke Pra">Pindah Pasca ke Pra</option>
            <option value="Temuan P2TL">Temuan P2TL</option>
          </select>
        </div>

        <div className="text-xs text-slate-500 font-bold">
          Menampilkan <span className="text-teal-700 font-black">{filteredData.length}</span> dari {items.length} data
        </div>
      </div>

      {/* Table of Records */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-black tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3.5">IDPEL / Pelanggan</th>
                <th className="px-4 py-3.5">Tarif & Daya</th>
                <th className="px-4 py-3.5">Meter Lama & Stand</th>
                <th className="px-4 py-3.5">Meter Baru & Segel</th>
                <th className="px-4 py-3.5">Alasan Peremajaan</th>
                <th className="px-4 py-3.5">Petugas & Tgl</th>
                <th className="px-4 py-3.5">Status</th>
                {canEdit && <th className="px-4 py-3.5 text-center">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400 font-medium">
                    Belum ada data peremajaan meter yang sesuai filter pencarian.
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-black text-slate-900 font-mono text-[11px]">{item.idPelanggan}</div>
                      <div className="font-bold text-slate-700">{item.namaPelanggan}</div>
                      <div className="text-[10px] text-slate-400 truncate max-w-xs">{item.alamat}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 font-extrabold text-slate-800 text-[10px]">
                        {item.tarifDaya}
                      </span>
                      <div className="text-[10px] text-teal-700 font-bold mt-1">{item.unit}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-mono text-slate-800 font-bold">{item.noMeterLama || '-'}</div>
                      <div className="text-[10px] text-slate-500">{item.merekMeterLama}</div>
                      <div className="text-[10px] text-amber-700 font-extrabold">Stand: {item.standMeterLama} kWh</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-mono text-emerald-700 font-black">{item.noMeterBaru}</div>
                      <div className="text-[10px] text-slate-500">{item.merekMeterBaru}</div>
                      <div className="text-[10px] text-slate-600 font-bold">Segel: {item.noSegelBaru || '-'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                        item.alasanPeremajaan.includes('Macet')
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : item.alasanPeremajaan.includes('Tua')
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-blue-100 text-blue-800 border border-blue-200'
                      }`}>
                        {item.alasanPeremajaan}
                      </span>
                      {item.catatan && (
                        <p className="text-[10px] text-slate-500 mt-1 max-w-xs line-clamp-1">{item.catatan}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-800">{item.petugasPelaksana}</div>
                      <div className="text-[10px] text-slate-400">{item.tglPelaksanaan}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase inline-flex items-center gap-1 ${
                        item.status === 'SELESAI'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : item.status === 'DALAM_PROSES'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {item.status === 'SELESAI' ? '✓ Selesai' : item.status === 'DALAM_PROSES' ? '⏳ Proses' : 'Approval'}
                      </span>
                    </td>
                    {canEdit && (
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Data Peremajaan"
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

      {/* Modal Input/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full p-6 text-slate-800 space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-teal-100 text-teal-800 rounded-xl">
                  <RotateCw className="w-5 h-5" />
                </div>
                <h3 className="text-base font-black text-slate-900">
                  {editingItem ? 'Edit Data Peremajaan Meter' : 'Input Peremajaan kWh Meter Baru'}
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
                  <label className="block text-[11px] font-black text-slate-700 mb-1">ID Pelanggan (IDPEL) *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: 541100982311"
                    value={formData.idPelanggan || ''}
                    onChange={(e) => setFormData({ ...formData, idPelanggan: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold font-mono focus:bg-white focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-700 mb-1">Nama Pelanggan *</label>
                  <input
                    type="text"
                    required
                    placeholder="Nama lengkap pelanggan"
                    value={formData.namaPelanggan || ''}
                    onChange={(e) => setFormData({ ...formData, namaPelanggan: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:bg-white focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-700 mb-1">Tarif & Daya</label>
                  <input
                    type="text"
                    placeholder="Contoh: R1 / 1300 VA"
                    value={formData.tarifDaya || ''}
                    onChange={(e) => setFormData({ ...formData, tarifDaya: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:bg-white focus:border-teal-500"
                  />
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
                  <label className="block text-[11px] font-black text-slate-700 mb-1">Alamat Lengkap</label>
                  <input
                    type="text"
                    placeholder="Alamat lokasi terpasang"
                    value={formData.alamat || ''}
                    onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:border-teal-500"
                  />
                </div>

                {/* Meter Lama */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="font-black text-slate-700 text-[11px] uppercase tracking-wider">Meter Lama (Bongkar)</div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500">No Meter Lama</label>
                    <input
                      type="text"
                      placeholder="Nomor meter lama"
                      value={formData.noMeterLama || ''}
                      onChange={(e) => setFormData({ ...formData, noMeterLama: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-mono font-bold"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500">Merek</label>
                      <input
                        type="text"
                        placeholder="Merek"
                        value={formData.merekMeterLama || ''}
                        onChange={(e) => setFormData({ ...formData, merekMeterLama: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500">Stand Angkat</label>
                      <input
                        type="number"
                        placeholder="0"
                        value={formData.standMeterLama ?? 0}
                        onChange={(e) => setFormData({ ...formData, standMeterLama: Number(e.target.value) })}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-mono font-bold"
                      />
                    </div>
                  </div>
                </div>

                {/* Meter Baru */}
                <div className="p-3 bg-teal-50/60 rounded-xl border border-teal-200 space-y-2">
                  <div className="font-black text-teal-900 text-[11px] uppercase tracking-wider">Meter Baru (Pasang)</div>
                  <div>
                    <label className="block text-[10px] font-bold text-teal-800">No Meter Baru *</label>
                    <input
                      type="text"
                      required
                      placeholder="Nomor meter baru"
                      value={formData.noMeterBaru || ''}
                      onChange={(e) => setFormData({ ...formData, noMeterBaru: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-teal-300 rounded-lg font-mono font-bold text-teal-900"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-teal-800">Merek Baru</label>
                      <input
                        type="text"
                        placeholder="Smart Meter AMI"
                        value={formData.merekMeterBaru || ''}
                        onChange={(e) => setFormData({ ...formData, merekMeterBaru: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-white border border-teal-300 rounded-lg font-bold text-teal-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-teal-800">No Segel Baru</label>
                      <input
                        type="text"
                        placeholder="SGL-BGL-..."
                        value={formData.noSegelBaru || ''}
                        onChange={(e) => setFormData({ ...formData, noSegelBaru: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-white border border-teal-300 rounded-lg font-mono font-bold text-teal-900"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-700 mb-1">Alasan Peremajaan</label>
                  <select
                    value={formData.alasanPeremajaan || 'Meter Tua (>10 Thn)'}
                    onChange={(e) => setFormData({ ...formData, alasanPeremajaan: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:bg-white focus:border-teal-500"
                  >
                    <option value="Meter Tua (>10 Thn)">Meter Tua (&gt;10 Thn)</option>
                    <option value="Meter Macet / Rusak">Meter Macet / Rusak</option>
                    <option value="Layar Buram">Layar Buram / LCD Rusak</option>
                    <option value="Piringan Aus">Piringan Aus / Anomali Putaran</option>
                    <option value="Pindah Pasca ke Pra">Pindah Pasca ke Pra (Migrasi)</option>
                    <option value="Temuan P2TL">Temuan P2TL / Pelanggaran</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-700 mb-1">Petugas & Tanggal</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Nama Petugas"
                      value={formData.petugasPelaksana || ''}
                      onChange={(e) => setFormData({ ...formData, petugasPelaksana: e.target.value })}
                      className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                    />
                    <input
                      type="date"
                      value={formData.tglPelaksanaan || ''}
                      onChange={(e) => setFormData({ ...formData, tglPelaksanaan: e.target.value })}
                      className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-black text-slate-700 mb-1">Catatan Tambahan</label>
                  <textarea
                    rows={2}
                    placeholder="Catatan teknis hasil pemasangan meter..."
                    value={formData.catatan || ''}
                    onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
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
                  {editingItem ? 'Simpan Perubahan' : 'Simpan Data Meter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
