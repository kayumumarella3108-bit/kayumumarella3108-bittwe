import React, { useState } from 'react';
import {
  Package,
  Plus,
  ArrowDownRight,
  ArrowUpRight,
  Search,
  Trash2,
  Pencil,
  AlertTriangle,
  CheckCircle2,
  Box,
  Layers,
  Building2,
  Calendar,
  MapPin,
  Wrench,
  FileText
} from 'lucide-react';
import { MaterialStokItem, MaterialPemakaianItem, User } from '../../types';
import { DAFTAR_UNIT_PLN } from '../../utils/unitConfig';
import { canEditData } from '../../utils/permissions';
import { TableSkeletonLoader } from '../common/TableSkeletonLoader';

interface MaterialViewProps {
  currentUser?: User;
  stokList: MaterialStokItem[];
  pemakaianList: MaterialPemakaianItem[];
  onAddStok: (item: MaterialStokItem) => void;
  onUpdateStok: (item: MaterialStokItem) => void;
  onDeleteStok: (id: string) => void;
  onAddPemakaian: (item: MaterialPemakaianItem) => void;
  onUpdatePemakaian: (item: MaterialPemakaianItem) => void;
  onDeletePemakaian: (id: string) => void;
  isLoading?: boolean;
}

export const MaterialView: React.FC<MaterialViewProps> = ({
  currentUser,
  stokList,
  pemakaianList,
  onAddStok,
  onUpdateStok,
  onDeleteStok,
  onAddPemakaian,
  onUpdatePemakaian,
  onDeletePemakaian,
  isLoading = false
}) => {
  const canEdit = currentUser ? canEditData(currentUser) : true;
  const [activeTab, setActiveTab] = useState<'monitoring' | 'stok_masuk' | 'pemakaian'>('monitoring');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterUnit, setFilterUnit] = useState<string>('SEMUA');

  // Modals state
  const [showStokModal, setShowStokModal] = useState(false);
  const [editingStok, setEditingStok] = useState<MaterialStokItem | null>(null);

  const [showPemakaianModal, setShowPemakaianModal] = useState(false);
  const [editingPemakaian, setEditingPemakaian] = useState<MaterialPemakaianItem | null>(null);

  // Form states for Stok Masuk
  const [stokForm, setStokForm] = useState({
    tanggalMasuk: new Date().toISOString().split('T')[0],
    namaMaterial: '',
    qty: 10,
    satuan: 'pcs',
    keterangan: '',
    noDokumen: ''
  });

  // Form states for Pemakaian
  const [pemakaianForm, setPemakaianForm] = useState({
    tanggal: new Date().toISOString().split('T')[0],
    namaMaterial: '',
    qty: 1,
    satuan: 'pcs',
    lokasi: '',
    jenisPekerjaan: 'Perbaikan Gangguan 20kV',
    petugas: 'Tim Yantek Baguala'
  });

  // Calculate Realtime Stock per Material Name
  const summaryMaterialMap = new Map<string, {
    namaMaterial: string;
    satuan: string;
    totalStokMasuk: number;
    totalPemakaian: number;
    stokAkhir: number;
  }>();

  // Process Stok Masuk
  stokList.forEach((item) => {
    const key = (item.namaMaterial || '').trim().toLowerCase();
    const existing = summaryMaterialMap.get(key) || {
      namaMaterial: item.namaMaterial,
      satuan: item.satuan || 'pcs',
      totalStokMasuk: 0,
      totalPemakaian: 0,
      stokAkhir: 0
    };
    existing.totalStokMasuk += Number(item.qty) || 0;
    existing.stokAkhir = existing.totalStokMasuk - existing.totalPemakaian;
    summaryMaterialMap.set(key, existing);
  });

  // Process Pemakaian
  pemakaianList.forEach((item) => {
    const key = (item.namaMaterial || '').trim().toLowerCase();
    const existing = summaryMaterialMap.get(key) || {
      namaMaterial: item.namaMaterial,
      satuan: item.satuan || 'pcs',
      totalStokMasuk: 0,
      totalPemakaian: 0,
      stokAkhir: 0
    };
    existing.totalPemakaian += Number(item.qty) || 0;
    existing.stokAkhir = existing.totalStokMasuk - existing.totalPemakaian;
    summaryMaterialMap.set(key, existing);
  });

  const summaryList = Array.from(summaryMaterialMap.values());

  // Filtered lists based on unit and searchQuery
  const filteredSummary = summaryList.filter((item) => {
    const matchSearch = (item.namaMaterial || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchSearch; // Summary doesn't have unit filter in its map values
  });

  const filteredStokList = stokList.filter((item) => {
    const matchUnit = filterUnit === 'SEMUA' || item.unit === filterUnit;
    const matchSearch = (item.namaMaterial || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchUnit && matchSearch;
  });

  const filteredPemakaianList = pemakaianList.filter((item) => {
    const matchUnit = filterUnit === 'SEMUA' || item.unit === filterUnit;
    const matchSearch = (item.namaMaterial || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchUnit && matchSearch;
  });

  // Quick stats
  const summaryListFiltered = summaryList.filter((item) => {
    const matchSearch = (item.namaMaterial || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchSearch;
  });
  const totalJenisMaterial = summaryListFiltered.length;
  const totalKritis = summaryListFiltered.filter((m) => m.stokAkhir <= 5).length;
  const grandTotalMasuk = summaryListFiltered.reduce((acc, curr) => acc + curr.totalStokMasuk, 0);
  const grandTotalPemakaian = summaryListFiltered.reduce((acc, curr) => acc + curr.totalPemakaian, 0);

  // Submit Stok Form
  const handleStokSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingStok) {
      onUpdateStok({
        ...editingStok,
        tanggalMasuk: stokForm.tanggalMasuk,
        namaMaterial: stokForm.namaMaterial,
        qty: Number(stokForm.qty),
        satuan: stokForm.satuan,
        keterangan: stokForm.keterangan,
        noDokumen: stokForm.noDokumen
      });
    } else {
      const newItem: MaterialStokItem = {
        id: `stok_${Date.now()}`,
        tanggalMasuk: stokForm.tanggalMasuk,
        namaMaterial: stokForm.namaMaterial,
        qty: Number(stokForm.qty),
        satuan: stokForm.satuan,
        keterangan: stokForm.keterangan,
        noDokumen: stokForm.noDokumen
      };
      onAddStok(newItem);
    }
    setShowStokModal(false);
    setEditingStok(null);
  };

  // Submit Pemakaian Form
  const handlePemakaianSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPemakaian) {
      onUpdatePemakaian({
        ...editingPemakaian,
        tanggal: pemakaianForm.tanggal,
        namaMaterial: pemakaianForm.namaMaterial,
        qty: Number(pemakaianForm.qty),
        satuan: pemakaianForm.satuan,
        lokasi: pemakaianForm.lokasi,
        jenisPekerjaan: pemakaianForm.jenisPekerjaan,
        petugas: pemakaianForm.petugas
      });
    } else {
      const newItem: MaterialPemakaianItem = {
        id: `pemakaian_${Date.now()}`,
        tanggal: pemakaianForm.tanggal,
        namaMaterial: pemakaianForm.namaMaterial,
        qty: Number(pemakaianForm.qty),
        satuan: pemakaianForm.satuan,
        lokasi: pemakaianForm.lokasi,
        jenisPekerjaan: pemakaianForm.jenisPekerjaan,
        petugas: pemakaianForm.petugas
      };
      onAddPemakaian(newItem);
    }
    setShowPemakaianModal(false);
    setEditingPemakaian(null);
  };

  return (
    <div className="p-4 md:p-6 space-y-6 bg-slate-50 min-h-screen text-slate-900 font-sans">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-gradient-to-r from-teal-900 via-emerald-900 to-slate-900 text-white rounded-3xl shadow-xl border border-teal-500/30">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-gradient-to-tr from-teal-400 via-emerald-400 to-teal-300 text-teal-950 rounded-2xl shadow-lg shadow-teal-950/40">
            <Package className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-tight drop-shadow-xs">
              Manajemen Stok & Pemakaian Material
            </h1>
            <p className="text-xs text-teal-100/90 mt-0.5">
              Monitoring Realtime Stok Akhir, Penerimaan Gudang, dan Pemakaian Lapangan 20kV
            </p>
          </div>
        </div>

        {/* Top Action Buttons */}
        {canEdit && (
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => {
                setEditingStok(null);
                setStokForm({
                  tanggalMasuk: new Date().toISOString().split('T')[0],
                  namaMaterial: '',
                  qty: 10,
                  satuan: 'pcs',
                  keterangan: 'Gudang ULP Baguala',
                  noDokumen: ''
                });
                setShowStokModal(true);
              }}
              className="px-4 py-2.5 bg-teal-800/80 hover:bg-teal-700 text-teal-100 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-teal-500/40 transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <ArrowDownRight className="w-4 h-4 text-emerald-300" />
              <span>+ Stok Masuk</span>
            </button>

            <button
              onClick={() => {
                setEditingPemakaian(null);
                setPemakaianForm({
                  tanggal: new Date().toISOString().split('T')[0],
                  namaMaterial: summaryList.length > 0 ? summaryList[0].namaMaterial : '',
                  qty: 1,
                  satuan: summaryList.length > 0 ? summaryList[0].satuan : 'pcs',
                  lokasi: 'Penyulang Baguala - Tiang #',
                  jenisPekerjaan: 'Perbaikan Gangguan 20kV',
                  petugas: 'Tim Yantek Baguala'
                });
                setShowPemakaianModal(true);
              }}
              className="px-4 py-2.5 bg-gradient-to-r from-teal-400 via-emerald-400 to-teal-300 hover:from-teal-300 hover:to-emerald-300 text-teal-950 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-md shadow-teal-950/40 border border-teal-200/80 cursor-pointer active:scale-95"
            >
              <ArrowUpRight className="w-4 h-4 text-teal-950 stroke-[3]" />
              <span>+ Pemakaian Material</span>
            </button>
          </div>
        )}
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Jenis Material</div>
            <div className="text-2xl font-black text-slate-900 mt-1">{totalJenisMaterial} <span className="text-xs font-normal text-slate-500">Item</span></div>
          </div>
          <div className="p-3 rounded-2xl bg-slate-100 text-slate-700">
            <Box className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Stok Masuk</div>
            <div className="text-2xl font-black text-emerald-600 mt-1">{grandTotalMasuk.toLocaleString()} <span className="text-xs font-normal text-slate-500">Unit</span></div>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600">
            <ArrowDownRight className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Pemakaian</div>
            <div className="text-2xl font-black text-blue-600 mt-1">{grandTotalPemakaian.toLocaleString()} <span className="text-xs font-normal text-slate-500">Unit</span></div>
          </div>
          <div className="p-3 rounded-2xl bg-blue-50 text-blue-600">
            <ArrowUpRight className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Stok Kritis (≤ 5)</div>
            <div className="text-2xl font-black text-rose-600 mt-1">{totalKritis} <span className="text-xs font-normal text-slate-500">Material</span></div>
          </div>
          <div className="p-3 rounded-2xl bg-rose-50 text-rose-600">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('monitoring')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'monitoring'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Monitoring Stok Akhir</span>
          </button>

          <button
            onClick={() => setActiveTab('stok_masuk')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'stok_masuk'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <ArrowDownRight className="w-3.5 h-3.5" />
            <span>Riwayat Stok Masuk ({stokList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('pemakaian')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'pemakaian'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Riwayat Pemakaian ({pemakaianList.length})</span>
          </button>
        </div>

        {/* Search input and Filter */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama material / lokasi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <select
            value={filterUnit}
            onChange={(e) => setFilterUnit(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
          >
            <option value="SEMUA">Semua ULP</option>
            {DAFTAR_UNIT_PLN.map((u) => (
              <option key={u.namaUnit} value={u.namaUnit}>{u.namaUnit}</option>
            ))}
          </select>
        </div>
      </div>

      {/* TAB 1: MONITORING STOK AKHIR REALTIME */}
      {activeTab === 'monitoring' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Box className="w-4 h-4 text-blue-600" />
              <span>Tabel Realtime Monitoring Stok Akhir Material</span>
            </h3>
            <span className="text-[11px] font-semibold text-slate-500">
              Perhitungan Otomatis: (Total Stok Masuk - Total Pemakaian)
            </span>
          </div>

          {isLoading ? (
            <TableSkeletonLoader columns={7} rows={6} headerTitle="Monitoring Stok Material" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-100/80 text-slate-600 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">No</th>
                    <th className="py-3 px-4">Nama Material</th>
                    <th className="py-3 px-4 text-center">Total Masuk</th>
                    <th className="py-3 px-4 text-center">Total Pemakaian</th>
                    <th className="py-3 px-4 text-center">Stok Akhir Realtime</th>
                    <th className="py-3 px-4">Satuan</th>
                    <th className="py-3 px-4 text-center">Status Stok</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSummary.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                        Belum ada data material tercatat. Silakan input stok masuk terlebih dahulu.
                      </td>
                    </tr>
                  ) : (
                    filteredSummary.map((m, idx) => {
                      const isKritis = m.stokAkhir <= 5;
                      const isTerbatas = m.stokAkhir > 5 && m.stokAkhir <= 15;
                      return (
                        <tr key={m.namaMaterial} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-slate-400">{idx + 1}</td>
                          <td className="py-3.5 px-4 font-black text-slate-900">{m.namaMaterial}</td>
                          <td className="py-3.5 px-4 text-center font-bold text-emerald-600 bg-emerald-50/30">
                            +{m.totalStokMasuk.toLocaleString()}
                          </td>
                          <td className="py-3.5 px-4 text-center font-bold text-blue-600 bg-blue-50/30">
                            -{m.totalPemakaian.toLocaleString()}
                          </td>
                          <td className="py-3.5 px-4 text-center font-black text-sm">
                            <span className={`px-2.5 py-1 rounded-xl ${
                              isKritis ? 'bg-rose-100 text-rose-700' : isTerbatas ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {m.stokAkhir.toLocaleString()}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-slate-600 uppercase">{m.satuan}</td>
                          <td className="py-3.5 px-4 text-center">
                            {isKritis ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 font-extrabold text-[10px]">
                                <AlertTriangle className="w-3 h-3" /> Stok Kritis
                              </span>
                            ) : isTerbatas ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">
                                Stok Terbatas
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold text-[10px]">
                                <CheckCircle2 className="w-3 h-3" /> Stok Aman
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: LOG STOK MASUK */}
      {activeTab === 'stok_masuk' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden space-y-3">
          <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <ArrowDownRight className="w-4 h-4 text-emerald-600" />
              <span>Log Riwayat Stok Masuk / Penerimaan Gudang</span>
            </h3>
            <button
              onClick={() => {
                setEditingStok(null);
                setStokForm({
                  tanggalMasuk: new Date().toISOString().split('T')[0],
                  namaMaterial: '',
                  qty: 10,
                  satuan: 'pcs',
                  keterangan: 'Gudang ULP Baguala',
                  noDokumen: ''
                });
                setShowStokModal(true);
              }}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Input Stok Masuk
            </button>
          </div>

          {isLoading ? (
            <TableSkeletonLoader columns={6} rows={6} headerTitle="Riwayat Stok Masuk" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-100/80 text-slate-600 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Tanggal Masuk</th>
                    <th className="py-3 px-4">Nama Material</th>
                    <th className="py-3 px-4 text-center">Stok Masuk (Qty)</th>
                    <th className="py-3 px-4">Satuan</th>
                    <th className="py-3 px-4">Keterangan / Dokumen</th>
                    <th className="py-3 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStokList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                        Belum ada data stok masuk.
                      </td>
                    </tr>
                  ) : (
                    filteredStokList.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-medium text-slate-600">{item.tanggalMasuk}</td>
                        <td className="py-3.5 px-4 font-black text-slate-900">{item.namaMaterial}</td>
                        <td className="py-3.5 px-4 text-center font-black text-emerald-600 text-sm">
                          +{item.qty.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-600 uppercase">{item.satuan}</td>
                        <td className="py-3.5 px-4 text-slate-600">
                          <div>{item.keterangan || '-'}</div>
                          {item.noDokumen && (
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">Ref: {item.noDokumen}</div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => {
                                setEditingStok(item);
                                setStokForm({
                                  tanggalMasuk: item.tanggalMasuk,
                                  namaMaterial: item.namaMaterial,
                                  qty: item.qty,
                                  satuan: item.satuan,
                                  keterangan: item.keterangan || '',
                                  noDokumen: item.noDokumen || ''
                                });
                                setShowStokModal(true);
                              }}
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onDeleteStok(item.id)}
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
          )}
        </div>
      )}

      {/* TAB 3: LOG PEMAKAIAN MATERIAL */}
      {activeTab === 'pemakaian' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden space-y-3">
          <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <ArrowUpRight className="w-4 h-4 text-blue-600" />
              <span>Log Riwayat Pemakaian Material Lapangan</span>
            </h3>
            <button
              onClick={() => {
                setEditingPemakaian(null);
                setPemakaianForm({
                  tanggal: new Date().toISOString().split('T')[0],
                  namaMaterial: summaryList.length > 0 ? summaryList[0].namaMaterial : '',
                  qty: 1,
                  satuan: summaryList.length > 0 ? summaryList[0].satuan : 'pcs',
                  lokasi: 'Penyulang Baguala',
                  jenisPekerjaan: 'Perbaikan Gangguan 20kV',
                  petugas: 'Tim Yantek Baguala'
                });
                setShowPemakaianModal(true);
              }}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Input Pemakaian Material
            </button>
          </div>

          {isLoading ? (
            <TableSkeletonLoader columns={7} rows={6} headerTitle="Riwayat Pemakaian Material" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-100/80 text-slate-600 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Tanggal Pemakaian</th>
                    <th className="py-3 px-4">Nama Material</th>
                    <th className="py-3 px-4 text-center">Jumlah Pemakaian (Qty)</th>
                    <th className="py-3 px-4">Lokasi Pekerjaan</th>
                    <th className="py-3 px-4">Jenis Pekerjaan</th>
                    <th className="py-3 px-4">Petugas / Pelaksana</th>
                    <th className="py-3 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPemakaianList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                        Belum ada log pemakaian material.
                      </td>
                    </tr>
                  ) : (
                    filteredPemakaianList.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-medium text-slate-600">{item.tanggal}</td>
                        <td className="py-3.5 px-4 font-black text-slate-900">{item.namaMaterial}</td>
                        <td className="py-3.5 px-4 text-center font-black text-blue-600 text-sm">
                          -{item.qty.toLocaleString()} {item.satuan}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-800">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                            <span>{item.lokasi}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-700">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800">
                            {item.jenisPekerjaan}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 font-medium">{item.petugas || '-'}</td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => {
                                setEditingPemakaian(item);
                                setPemakaianForm({
                                  tanggal: item.tanggal,
                                  namaMaterial: item.namaMaterial,
                                  qty: item.qty,
                                  satuan: item.satuan,
                                  lokasi: item.lokasi,
                                  jenisPekerjaan: item.jenisPekerjaan,
                                  petugas: item.petugas || ''
                                });
                                setShowPemakaianModal(true);
                              }}
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onDeletePemakaian(item.id)}
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
          )}
        </div>
      )}

      {/* MODAL INPUT STOK MASUK */}
      {showStokModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 bg-emerald-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowDownRight className="w-5 h-5" />
                <h3 className="font-extrabold text-sm">
                  {editingStok ? 'Edit Data Stok Masuk' : 'Form Input Stok Masuk Material'}
                </h3>
              </div>
              <button
                onClick={() => setShowStokModal(false)}
                className="text-white/80 hover:text-white font-black text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleStokSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Masuk</label>
                  <input
                    type="date"
                    required
                    value={stokForm.tanggalMasuk}
                    onChange={(e) => setStokForm({ ...stokForm, tanggalMasuk: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">No. Dokumen / SPK</label>
                  <input
                    type="text"
                    placeholder="Contoh: SPK-2026/BAGU="
                    value={stokForm.noDokumen}
                    onChange={(e) => setStokForm({ ...stokForm, noDokumen: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Material</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Kabel AAAC 150mm2, Isolator Tumpu 20kV, FCO 20kV"
                  value={stokForm.namaMaterial}
                  onChange={(e) => setStokForm({ ...stokForm, namaMaterial: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Qty / Stok Masuk</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={stokForm.qty}
                    onChange={(e) => setStokForm({ ...stokForm, qty: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Satuan</label>
                  <select
                    value={stokForm.satuan}
                    onChange={(e) => setStokForm({ ...stokForm, satuan: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-emerald-500"
                  >
                    <option value="pcs">pcs (buah)</option>
                    <option value="meter">meter</option>
                    <option value="unit">unit</option>
                    <option value="set">set</option>
                    <option value="roll">roll</option>
                    <option value="batang">batang</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Keterangan / Gudang</label>
                <input
                  type="text"
                  placeholder="Contoh: Penerimaan dari Gudang UP3 Ambon"
                  value={stokForm.keterangan}
                  onChange={(e) => setStokForm({ ...stokForm, keterangan: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowStokModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold shadow-md shadow-emerald-500/20 cursor-pointer"
                >
                  Simpan Stok Masuk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL INPUT PEMAKAIAN MATERIAL */}
      {showPemakaianModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 bg-blue-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowUpRight className="w-5 h-5" />
                <h3 className="font-extrabold text-sm">
                  {editingPemakaian ? 'Edit Pemakaian Material' : 'Form Input Pemakaian Material Lapangan'}
                </h3>
              </div>
              <button
                onClick={() => setShowPemakaianModal(false)}
                className="text-white/80 hover:text-white font-black text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handlePemakaianSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Pemakaian</label>
                <input
                  type="date"
                  required
                  value={pemakaianForm.tanggal}
                  onChange={(e) => setPemakaianForm({ ...pemakaianForm, tanggal: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Material</label>
                <input
                  type="text"
                  required
                  placeholder="Nama material yang digunakan..."
                  value={pemakaianForm.namaMaterial}
                  onChange={(e) => setPemakaianForm({ ...pemakaianForm, namaMaterial: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Jumlah / Qty Dipakai</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={pemakaianForm.qty}
                    onChange={(e) => setPemakaianForm({ ...pemakaianForm, qty: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Satuan</label>
                  <select
                    value={pemakaianForm.satuan}
                    onChange={(e) => setPemakaianForm({ ...pemakaianForm, satuan: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-blue-500"
                  >
                    <option value="pcs">pcs (buah)</option>
                    <option value="meter">meter</option>
                    <option value="unit">unit</option>
                    <option value="set">set</option>
                    <option value="roll">roll</option>
                    <option value="batang">batang</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Lokasi Pekerjaan</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Feeder Passo - Tiang #45, Gardu BG-012"
                  value={pemakaianForm.lokasi}
                  onChange={(e) => setPemakaianForm({ ...pemakaianForm, lokasi: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Jenis Pekerjaan</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Pemeliharaan ROW, Perbaikan Trip"
                    value={pemakaianForm.jenisPekerjaan}
                    onChange={(e) => setPemakaianForm({ ...pemakaianForm, jenisPekerjaan: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Petugas / Pelaksana</label>
                  <input
                    type="text"
                    placeholder="Contoh: Tim Yantek Baguala"
                    value={pemakaianForm.petugas}
                    onChange={(e) => setPemakaianForm({ ...pemakaianForm, petugas: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPemakaianModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold shadow-md shadow-blue-500/20 cursor-pointer"
                >
                  Simpan Pemakaian
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
