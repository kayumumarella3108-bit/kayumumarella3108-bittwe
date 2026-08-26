import React, { useState, useMemo } from 'react';
import {
  TrendingDown,
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
  BarChart3,
  Percent,
  Zap,
  ArrowDownRight,
  ShieldCheck,
  Target
} from 'lucide-react';
import { MonitoringSusutItem, User } from '../../types';
import { canEditData } from '../../utils/permissions';
import { DAFTAR_UNIT_PLN } from '../../utils/unitConfig';

interface MonitoringSusutViewProps {
  currentUser?: User | null;
  susutList?: MonitoringSusutItem[];
  onAdd?: (item: MonitoringSusutItem) => void;
  onUpdate?: (item: MonitoringSusutItem) => void;
  onDelete?: (id: string) => void;
}

const INITIAL_MOCK_SUSUT: MonitoringSusutItem[] = [
  {
    id: 'susut-1',
    bulanTahun: 'Agustus 2026',
    namaPenyulangOrUnit: 'Penyulang Passo (GI Passo)',
    kwhKirim: 1845200,
    kwhTerimaOrTerjual: 1749800,
    kwhSusut: 95400,
    persentaseSusut: 5.17,
    targetSusutPersen: 6.2,
    kategoriSusut: 'SUSUT_TEKNIS',
    statusTarget: 'TERCAPAI',
    akarMasalah: 'Drop tegangan ujung jaringan & penambahan beban perumahan baru.',
    tindakanUpaya: 'Uprating konduktor SUTM & pemangkasan pohon rutin (ROW).',
    unit: 'ULP Baguala',
    kodeUnit: '54110'
  },
  {
    id: 'susut-2',
    bulanTahun: 'Agustus 2026',
    namaPenyulangOrUnit: 'Penyulang Baguala Ex Express',
    kwhKirim: 2150000,
    kwhTerimaOrTerjual: 2012000,
    kwhSusut: 138000,
    persentaseSusut: 6.42,
    targetSusutPersen: 6.0,
    kategoriSusut: 'GABUNGAN',
    statusTarget: 'OVER_TARGET',
    akarMasalah: 'Terdapat anomali pemakaian daya industri kecil & sambungan PJU swadaya.',
    tindakanUpaya: 'Operasi Penertiban P2TL Gabungan & inspeksi CT kWh meter 3 phasa.',
    unit: 'ULP Baguala',
    kodeUnit: '54110'
  },
  {
    id: 'susut-3',
    bulanTahun: 'Juli 2026',
    namaPenyulangOrUnit: 'Total ULP Baguala (Akumulasi)',
    kwhKirim: 14850000,
    kwhTerimaOrTerjual: 14003550,
    kwhSusut: 846450,
    persentaseSusut: 5.7,
    targetSusutPersen: 6.1,
    kategoriSusut: 'GABUNGAN',
    statusTarget: 'TERCAPAI',
    akarMasalah: 'Pemerataan beban gardu distribusi & penggantian meter macet.',
    tindakanUpaya: 'Program peremajaan 250 unit kWh meter tua & tera ulang CT/PT.',
    unit: 'ULP Baguala',
    kodeUnit: '54110'
  }
];

export const MonitoringSusutView: React.FC<MonitoringSusutViewProps> = ({
  currentUser,
  susutList = INITIAL_MOCK_SUSUT,
  onAdd,
  onUpdate,
  onDelete
}) => {
  const [items, setItems] = useState<MonitoringSusutItem[]>(susutList);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterUnit, setFilterUnit] = useState('SEMUA');
  const [filterKategori, setFilterKategori] = useState('SEMUA');
  const [filterStatus, setFilterStatus] = useState('SEMUA');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MonitoringSusutItem | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<MonitoringSusutItem>>({
    bulanTahun: 'Agustus 2026',
    namaPenyulangOrUnit: '',
    kwhKirim: 1000000,
    kwhTerimaOrTerjual: 940000,
    kwhSusut: 60000,
    persentaseSusut: 6.0,
    targetSusutPersen: 6.2,
    kategoriSusut: 'SUSUT_TEKNIS',
    statusTarget: 'TERCAPAI',
    akarMasalah: '',
    tindakanUpaya: '',
    unit: currentUser?.unit || 'ULP Baguala'
  });

  const canEdit = canEditData(currentUser);

  React.useEffect(() => {
    if (susutList && susutList.length > 0) {
      setItems(susutList);
    }
  }, [susutList]);

  // Auto calculate susut kWh & % when kwhKirim / kwhTerima changes
  const calculateSusut = (kirim: number, terima: number, target: number) => {
    const susutKwh = Math.max(0, kirim - terima);
    const persen = kirim > 0 ? Number(((susutKwh / kirim) * 100).toFixed(2)) : 0;
    let status = 'TERCAPAI';
    if (persen > target) {
      status = 'OVER_TARGET';
    } else if (persen >= target - 0.5) {
      status = 'WASPADA';
    }
    return { susutKwh, persen, status };
  };

  const handleKwhChange = (kirim: number, terima: number, target: number) => {
    const { susutKwh, persen, status } = calculateSusut(kirim, terima, target);
    setFormData({
      ...formData,
      kwhKirim: kirim,
      kwhTerimaOrTerjual: terima,
      kwhSusut: susutKwh,
      persentaseSusut: persen,
      targetSusutPersen: target,
      statusTarget: status
    });
  };

  const filteredData = useMemo(() => {
    return items.filter((item) => {
      const matchSearch =
        item.namaPenyulangOrUnit.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.bulanTahun.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.akarMasalah.toLowerCase().includes(searchQuery.toLowerCase());

      const matchUnit = filterUnit === 'SEMUA' || item.unit === filterUnit;
      const matchKategori = filterKategori === 'SEMUA' || item.kategoriSusut === filterKategori;
      const matchStatus = filterStatus === 'SEMUA' || item.statusTarget === filterStatus;

      return matchSearch && matchUnit && matchKategori && matchStatus;
    });
  }, [items, searchQuery, filterUnit, filterKategori, filterStatus]);

  // Aggregates
  const totalKirim = items.reduce((acc, curr) => acc + (curr.kwhKirim || 0), 0);
  const totalTerjual = items.reduce((acc, curr) => acc + (curr.kwhTerimaOrTerjual || 0), 0);
  const totalSusutKwh = items.reduce((acc, curr) => acc + (curr.kwhSusut || 0), 0);
  const avgSusutPersen = totalKirim > 0 ? ((totalSusutKwh / totalKirim) * 100).toFixed(2) : '0';
  const overTargetCount = items.filter((i) => i.statusTarget === 'OVER_TARGET').length;

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      bulanTahun: 'Agustus 2026',
      namaPenyulangOrUnit: '',
      kwhKirim: 1500000,
      kwhTerimaOrTerjual: 1410000,
      kwhSusut: 90000,
      persentaseSusut: 6.0,
      targetSusutPersen: 6.2,
      kategoriSusut: 'SUSUT_TEKNIS',
      statusTarget: 'TERCAPAI',
      akarMasalah: '',
      tindakanUpaya: '',
      unit: currentUser?.unit || 'ULP Baguala'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: MonitoringSusutItem) => {
    setEditingItem(item);
    setFormData({ ...item });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.namaPenyulangOrUnit) {
      alert('Mohon isi Nama Penyulang / Unit!');
      return;
    }

    const kirim = Number(formData.kwhKirim) || 0;
    const terima = Number(formData.kwhTerimaOrTerjual) || 0;
    const target = Number(formData.targetSusutPersen) || 6.0;
    const { susutKwh, persen, status } = calculateSusut(kirim, terima, target);

    if (editingItem) {
      const updated: MonitoringSusutItem = {
        ...editingItem,
        ...(formData as MonitoringSusutItem),
        kwhKirim: kirim,
        kwhTerimaOrTerjual: terima,
        kwhSusut: susutKwh,
        persentaseSusut: persen,
        targetSusutPersen: target,
        statusTarget: status
      };
      const newItems = items.map((i) => (i.id === editingItem.id ? updated : i));
      setItems(newItems);
      if (onUpdate) onUpdate(updated);
    } else {
      const newItem: MonitoringSusutItem = {
        id: `susut-${Date.now()}`,
        bulanTahun: formData.bulanTahun || 'Agustus 2026',
        namaPenyulangOrUnit: formData.namaPenyulangOrUnit || '',
        kwhKirim: kirim,
        kwhTerimaOrTerjual: terima,
        kwhSusut: susutKwh,
        persentaseSusut: persen,
        targetSusutPersen: target,
        kategoriSusut: formData.kategoriSusut || 'SUSUT_TEKNIS',
        statusTarget: status,
        akarMasalah: formData.akarMasalah || '',
        tindakanUpaya: formData.tindakanUpaya || '',
        unit: formData.unit || currentUser?.unit || 'ULP Baguala'
      };
      setItems([newItem, ...items]);
      if (onAdd) onAdd(newItem);
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Hapus data monitoring susut ini?')) {
      const filtered = items.filter((i) => i.id !== id);
      setItems(filtered);
      if (onDelete) onDelete(id);
    }
  };

  const handleExportCSV = () => {
    const headers = [
      'Bulan / Tahun',
      'Penyulang / Unit',
      'kWh Kirim',
      'kWh Terima / Terjual',
      'kWh Susut',
      'Realisasi Susut (%)',
      'Target Susut (%)',
      'Kategori Susut',
      'Status Target',
      'Akar Masalah',
      'Upaya Penurunan',
      'Unit'
    ];

    const rows = filteredData.map((item) => [
      `"${item.bulanTahun}"`,
      `"${item.namaPenyulangOrUnit}"`,
      item.kwhKirim,
      item.kwhTerimaOrTerjual,
      item.kwhSusut,
      item.persentaseSusut,
      item.targetSusutPersen,
      item.kategoriSusut,
      item.statusTarget,
      `"${item.akarMasalah}"`,
      `"${item.tindakanUpaya}"`,
      item.unit
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Monitoring_Susut_PLN_${new Date().toISOString().slice(0, 10)}.csv`);
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
                <TrendingDown className="w-6 h-6 text-amber-300" />
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-teal-500/20 border border-teal-500/40 text-teal-300 text-xs font-black uppercase tracking-wider">
                Transaksi Energi • Neraca Energi & Penurunan Susut Jaringan
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white drop-shadow-xs">
              MONITORING SUSUT ENERGI LISTRIK (KWH LOSS & NERACA)
            </h1>
            <p className="text-xs sm:text-sm text-teal-100/90 max-w-3xl leading-relaxed font-medium">
              Analisis perbandingan kWh kirim Gardu Induk vs kWh terjual pelanggan, pemetaan susut teknis (JTM/Trafo) & non-teknis (P2TL), serta evaluasi pencapaian target efisiensi energi.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {canEdit && (
              <button
                onClick={handleOpenAdd}
                className="px-4 py-2.5 bg-gradient-to-r from-teal-400 to-emerald-400 hover:from-teal-300 hover:to-emerald-300 text-slate-950 font-black text-xs rounded-xl shadow-lg border border-teal-200 flex items-center gap-2 transition-all cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Input Neraca Susut</span>
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
          <div className="p-3 bg-blue-50 text-blue-700 rounded-xl border border-blue-100">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total kWh Kirim</div>
            <div className="text-lg font-black text-slate-900">{totalKirim.toLocaleString('id-ID')} kWh</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total kWh Terjual</div>
            <div className="text-lg font-black text-emerald-600">{totalTerjual.toLocaleString('id-ID')} kWh</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-teal-50 text-teal-700 rounded-xl border border-teal-100">
            <Percent className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Rata-rata Susut</div>
            <div className="text-xl font-black text-teal-700">{avgSusutPersen}%</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-rose-50 text-rose-700 rounded-xl border border-rose-100">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Penyulang Over Target</div>
            <div className="text-xl font-black text-rose-600">{overTargetCount} Titik</div>
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
              placeholder="Cari Penyulang, Bulan, Akar Masalah..."
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
            <option value="SEMUA">Semua Kategori Susut</option>
            <option value="SUSUT_TEKNIS">Susut Teknis</option>
            <option value="SUSUT_NON_TEKNIS">Susut Non-Teknis</option>
            <option value="GABUNGAN">Gabungan</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-teal-500"
          >
            <option value="SEMUA">Semua Status Target</option>
            <option value="TERCAPAI">Tercapai (Hijau)</option>
            <option value="WASPADA">Waspada (Kuning)</option>
            <option value="OVER_TARGET">Over Target (Merah)</option>
          </select>
        </div>

        <div className="text-xs text-slate-500 font-bold">
          Menampilkan <span className="text-teal-700 font-black">{filteredData.length}</span> dari {items.length} penyulang
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-black tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3.5">Penyulang / Unit</th>
                <th className="px-4 py-3.5">Bulan & Kategori</th>
                <th className="px-4 py-3.5 text-right">kWh Kirim</th>
                <th className="px-4 py-3.5 text-right">kWh Terjual</th>
                <th className="px-4 py-3.5 text-right">Susut (kWh & %)</th>
                <th className="px-4 py-3.5 text-center">Target Susut</th>
                <th className="px-4 py-3.5">Akar Masalah & Upaya</th>
                <th className="px-4 py-3.5 text-center">Status</th>
                {canEdit && <th className="px-4 py-3.5 text-center">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-400 font-medium">
                    Belum ada data monitoring susut energi yang sesuai filter.
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => {
                  const isOver = item.persentaseSusut > item.targetSusutPersen;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-black text-slate-900">{item.namaPenyulangOrUnit}</div>
                        <div className="text-[10px] text-teal-700 font-bold">{item.unit}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-800">{item.bulanTahun}</div>
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 font-extrabold text-slate-700 text-[9px]">
                          {item.kategoriSusut}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-slate-800">
                        {item.kwhKirim.toLocaleString('id-ID')}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-emerald-700">
                        {item.kwhTerimaOrTerjual.toLocaleString('id-ID')}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className={`font-black font-mono text-sm ${isOver ? 'text-rose-600' : 'text-emerald-700'}`}>
                          {item.persentaseSusut}%
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {item.kwhSusut.toLocaleString('id-ID')} kWh
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2 py-1 rounded-lg bg-teal-50 border border-teal-200 text-teal-900 font-black text-xs">
                          {item.targetSusutPersen}%
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-[10px] text-slate-800 font-bold max-w-xs truncate">{item.akarMasalah}</div>
                        <div className="text-[10px] text-slate-500 max-w-xs truncate">{item.tindakanUpaya}</div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase inline-flex items-center gap-1 ${
                          item.statusTarget === 'TERCAPAI'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : item.statusTarget === 'OVER_TARGET'
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}>
                          {item.statusTarget === 'TERCAPAI'
                            ? '✓ Tercapai'
                            : item.statusTarget === 'OVER_TARGET'
                            ? '⚠️ Over Target'
                            : '⏳ Waspada'}
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
                  );
                })
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
                  <TrendingDown className="w-5 h-5" />
                </div>
                <h3 className="text-base font-black text-slate-900">
                  {editingItem ? 'Edit Data Monitoring Susut' : 'Input Neraca & Susut Energi Baru'}
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
                  <label className="block text-[11px] font-black text-slate-700 mb-1">Nama Penyulang / Uraian *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Penyulang Passo (GI Passo)"
                    value={formData.namaPenyulangOrUnit || ''}
                    onChange={(e) => setFormData({ ...formData, namaPenyulangOrUnit: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:bg-white focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-700 mb-1">Periode Bulan & Tahun</label>
                  <input
                    type="text"
                    placeholder="Contoh: Agustus 2026"
                    value={formData.bulanTahun || 'Agustus 2026'}
                    onChange={(e) => setFormData({ ...formData, bulanTahun: e.target.value })}
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

                <div>
                  <label className="block text-[11px] font-black text-slate-700 mb-1">Kategori Susut</label>
                  <select
                    value={formData.kategoriSusut || 'SUSUT_TEKNIS'}
                    onChange={(e) => setFormData({ ...formData, kategoriSusut: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:bg-white focus:border-teal-500"
                  >
                    <option value="SUSUT_TEKNIS">SUSUT TEKNIS (JTM / TRAFO)</option>
                    <option value="SUSUT_NON_TEKNIS">SUSUT NON-TEKNIS (P2TL / METER)</option>
                    <option value="GABUNGAN">GABUNGAN (TOTAL PENYULANG)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600">kWh Kirim (GI/Pangkal)</label>
                    <input
                      type="number"
                      value={formData.kwhKirim ?? 0}
                      onChange={(e) =>
                        handleKwhChange(
                          Number(e.target.value),
                          formData.kwhTerimaOrTerjual || 0,
                          formData.targetSusutPersen || 6.0
                        )
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600">kWh Terjual (Pelanggan)</label>
                    <input
                      type="number"
                      value={formData.kwhTerimaOrTerjual ?? 0}
                      onChange={(e) =>
                        handleKwhChange(
                          formData.kwhKirim || 0,
                          Number(e.target.value),
                          formData.targetSusutPersen || 6.0
                        )
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600">Target Susut (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.targetSusutPersen ?? 6.0}
                      onChange={(e) =>
                        handleKwhChange(
                          formData.kwhKirim || 0,
                          formData.kwhTerimaOrTerjual || 0,
                          Number(e.target.value)
                        )
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600">Hasil Susut (%)</label>
                    <div className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl font-mono font-black text-teal-800 text-sm">
                      {formData.persentaseSusut}% ({formData.kwhSusut?.toLocaleString('id-ID')} kWh)
                    </div>
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-black text-slate-700 mb-1">Akar Masalah Susut</label>
                  <input
                    type="text"
                    placeholder="Contoh: Beban puncak tinggi di ujung penyulang / kabel undersize"
                    value={formData.akarMasalah || ''}
                    onChange={(e) => setFormData({ ...formData, akarMasalah: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:border-teal-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-black text-slate-700 mb-1">Rencana Tindakan & Upaya Penurunan</label>
                  <textarea
                    rows={2}
                    placeholder="Contoh: Jadwalkan uprating konduktor, penyeimbangan beban trafo, dan razia P2TL"
                    value={formData.tindakanUpaya || ''}
                    onChange={(e) => setFormData({ ...formData, tindakanUpaya: e.target.value })}
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
                  {editingItem ? 'Simpan Perubahan' : 'Simpan Neraca Susut'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
