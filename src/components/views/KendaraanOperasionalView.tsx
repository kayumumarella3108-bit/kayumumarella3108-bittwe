import React, { useState } from 'react';
import {
  Car,
  Bike,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Package,
  Wrench,
  BatteryCharging,
  Disc,
  Sparkles,
  Calendar,
  UserCheck,
  Edit2,
  Trash2,
  Eye,
  X,
  Download,
  MapPin,
  Clock,
  ShieldAlert,
  Info,
  Radio,
  List
} from 'lucide-react';
import { KendaraanOperasional, MaterialKendaraan, User } from '../../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { canEditData } from '../../utils/permissions';
import { LiveGpsKendaraanDashboard } from '../yantek/LiveGpsKendaraanDashboard';
import { TableSkeletonLoader } from '../common/TableSkeletonLoader';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface KendaraanOperasionalViewProps {
  currentUser?: User | null;
  kendaraanList: KendaraanOperasional[];
  onAddKendaraan: (kendaraan: KendaraanOperasional) => void;
  onUpdateKendaraan: (kendaraan: KendaraanOperasional) => void;
  onDeleteKendaraan: (id: string) => void;
  isLoading?: boolean;
}

export const KendaraanOperasionalView: React.FC<KendaraanOperasionalViewProps> = ({
  currentUser,
  kendaraanList,
  onAddKendaraan,
  onUpdateKendaraan,
  onDeleteKendaraan,
  isLoading = false
}) => {
  const canEdit = canEditData(currentUser);

  // Search & Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterJenis, setFilterJenis] = useState<'Semua' | 'Mobil Operasional' | 'Motor Operasional'>('Semua');
  const [filterUnit, setFilterUnit] = useState<string>('Semua');
  const [filterKondisi, setFilterKondisi] = useState<'Semua' | 'Baik' | 'Perlu Perbaikan' | 'Rusak'>('Semua');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modals & Active View State
  const [activeTab, setActiveTab] = useState<'live_gps' | 'inventory'>('live_gps');
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingKendaraan, setEditingKendaraan] = useState<KendaraanOperasional | null>(null);
  const [selectedKendaraanDetail, setSelectedKendaraanDetail] = useState<KendaraanOperasional | null>(null);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<KendaraanOperasional | null>(null);

  // Form State
  const [form, setForm] = useState<{
    jenisKendaraan: 'Mobil Operasional' | 'Motor Operasional';
    namaKendaraan: string;
    noPolisi: string;
    unit: string;
    penanggungJawab: string;
    kondisiKendaraan: 'Baik' | 'Perlu Perbaikan' | 'Rusak';
    kondisiBan: 'Baik - Tebal' | 'Cukup' | 'Aus / Perlu Ganti';
    kondisiAki: 'Normal - Baik' | 'Lemah' | 'Perlu Stroom / Ganti';
    kebersihan: 'Sangat Bersih' | 'Bersih' | 'Kotor';
    kilometer: number;
    tanggalPengecekan: string;
    catatan: string;
    materials: MaterialKendaraan[];
  }>({
    jenisKendaraan: 'Mobil Operasional',
    namaKendaraan: '',
    noPolisi: '',
    unit: 'ULP Baguala',
    penanggungJawab: 'Tim Yantek Regu A',
    kondisiKendaraan: 'Baik',
    kondisiBan: 'Baik - Tebal',
    kondisiAki: 'Normal - Baik',
    kebersihan: 'Bersih',
    kilometer: 0,
    tanggalPengecekan: new Date().toISOString().split('T')[0],
    catatan: '',
    materials: []
  });

  // Material temp row inside form
  const [newMatName, setNewMatName] = useState('');
  const [newMatQty, setNewMatQty] = useState(1);
  const [newMatSatuan, setNewMatSatuan] = useState('Pcs');

  // Filtered List
  const filteredList = kendaraanList.filter((k) => {
    const matchesSearch =
      (k.namaKendaraan || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (k.noPolisi || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (k.penanggungJawab || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (k.unit || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (k.materials || []).some((m) => m.namaMaterial.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesJenis = filterJenis === 'Semua' || k.jenisKendaraan === filterJenis;
    const matchesUnit = filterUnit === 'Semua' || (k.unit || 'ULP Baguala') === filterUnit;
    const matchesKondisi = filterKondisi === 'Semua' || k.kondisiKendaraan === filterKondisi;

    return matchesSearch && matchesJenis && matchesUnit && matchesKondisi;
  });

  // Metrics KPI Calculation
  const totalKendaraan = kendaraanList.length;
  const totalMobil = kendaraanList.filter((k) => k.jenisKendaraan === 'Mobil Operasional').length;
  const totalMotor = kendaraanList.filter((k) => k.jenisKendaraan === 'Motor Operasional').length;
  const totalBaik = kendaraanList.filter((k) => k.kondisiKendaraan === 'Baik').length;
  const totalPerluPerbaikan = kendaraanList.filter((k) => k.kondisiKendaraan === 'Perlu Perbaikan' || k.kondisiKendaraan === 'Rusak').length;

  // Form Handlers
  const handleOpenAddModal = () => {
    setEditingKendaraan(null);
    setForm({
      jenisKendaraan: 'Mobil Operasional',
      namaKendaraan: '',
      noPolisi: '',
      unit: 'ULP Baguala',
      penanggungJawab: 'Tim Yantek ULP Baguala',
      kondisiKendaraan: 'Baik',
      kondisiBan: 'Baik - Tebal',
      kondisiAki: 'Normal - Baik',
      kebersihan: 'Bersih',
      kilometer: 0,
      tanggalPengecekan: new Date().toISOString().split('T')[0],
      catatan: '',
      materials: [
        { id: 'm-1', namaMaterial: 'Fuse Link 10A / 15A', jumlah: 10, satuan: 'Pcs' },
        { id: 'm-2', namaMaterial: 'Tap Connector 70-150', jumlah: 15, satuan: 'Pcs' },
        { id: 'm-3', namaMaterial: 'Isolasi Listrik 3M', jumlah: 5, satuan: 'Roll' }
      ]
    });
    setShowFormModal(true);
  };

  const handleOpenEditModal = (kendaraan: KendaraanOperasional) => {
    setEditingKendaraan(kendaraan);
    setForm({
      jenisKendaraan: kendaraan.jenisKendaraan,
      namaKendaraan: kendaraan.namaKendaraan,
      noPolisi: kendaraan.noPolisi,
      unit: kendaraan.unit || 'ULP Baguala',
      penanggungJawab: kendaraan.penanggungJawab,
      kondisiKendaraan: kendaraan.kondisiKendaraan,
      kondisiBan: kendaraan.kondisiBan,
      kondisiAki: kendaraan.kondisiAki,
      kebersihan: kendaraan.kebersihan,
      kilometer: kendaraan.kilometer || 0,
      tanggalPengecekan: kendaraan.tanggalPengecekan,
      catatan: kendaraan.catatan || '',
      materials: kendaraan.materials ? [...kendaraan.materials] : []
    });
    setShowFormModal(true);
  };

  const handleAddMaterialToForm = () => {
    if (!newMatName.trim()) return;
    setForm((prev) => ({
      ...prev,
      materials: [
        ...prev.materials,
        {
          id: `mat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          namaMaterial: newMatName.trim(),
          jumlah: Number(newMatQty) || 1,
          satuan: newMatSatuan
        }
      ]
    }));
    setNewMatName('');
    setNewMatQty(1);
  };

  const handleRemoveMaterialFromForm = (index: number) => {
    setForm((prev) => ({
      ...prev,
      materials: prev.materials.filter((_, i) => i !== index)
    }));
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.namaKendaraan.trim() || !form.noPolisi.trim()) {
      alert('Mohon isi nama kendaraan dan nomor polisi.');
      return;
    }

    if (editingKendaraan) {
      const updated: KendaraanOperasional = {
        ...editingKendaraan,
        jenisKendaraan: form.jenisKendaraan,
        namaKendaraan: form.namaKendaraan,
        noPolisi: form.noPolisi,
        unit: form.unit,
        penanggungJawab: form.penanggungJawab,
        kondisiKendaraan: form.kondisiKendaraan,
        kondisiBan: form.kondisiBan,
        kondisiAki: form.kondisiAki,
        kebersihan: form.kebersihan,
        kilometer: form.kilometer,
        tanggalPengecekan: form.tanggalPengecekan,
        catatan: form.catatan,
        materials: form.materials
      };
      onUpdateKendaraan(updated);
    } else {
      const newKendaraan: KendaraanOperasional = {
        id: `knd-${Date.now()}`,
        jenisKendaraan: form.jenisKendaraan,
        namaKendaraan: form.namaKendaraan,
        noPolisi: form.noPolisi,
        unit: form.unit,
        penanggungJawab: form.penanggungJawab,
        kondisiKendaraan: form.kondisiKendaraan,
        kondisiBan: form.kondisiBan,
        kondisiAki: form.kondisiAki,
        kebersihan: form.kebersihan,
        kilometer: form.kilometer,
        tanggalPengecekan: form.tanggalPengecekan,
        catatan: form.catatan,
        materials: form.materials
      };
      onAddKendaraan(newKendaraan);
    }

    setShowFormModal(false);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF('landscape');
    doc.setFontSize(14);
    doc.text('Data Kendaraan Operasional - PT PLN (Persero)', 14, 15);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}`, 14, 22);

    const headers = [
      ['No', 'Jenis', 'Nama Kendaraan', 'Plat Nomor', 'Unit PLN', 'Penanggung Jawab', 'Kondisi', 'Tgl Cek']
    ];

    const dataRows = filteredList.map((k, index) => [
      index + 1,
      k.jenisKendaraan,
      k.namaKendaraan,
      k.noPolisi,
      k.unit,
      k.penanggungJawab,
      k.kondisiKendaraan,
      k.tanggalPengecekan
    ]);

    autoTable(doc, {
      head: headers,
      body: dataRows,
      startY: 28,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });

    doc.save(`kendaraan_operasional_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handleExportCSV = () => {
    const headers = [
      'ID',
      'Jenis Kendaraan',
      'Nama Kendaraan',
      'Plat Nomor',
      'Unit PLN',
      'Penanggung Jawab',
      'Kondisi Kendaraan',
      'Kondisi Ban',
      'Kondisi Aki',
      'Kebersihan',
      'Odometer (KM)',
      'Tgl Pengecekan',
      'Catatan',
      'Jumlah Material Onboard'
    ];

    const rows = filteredList.map((k) => [
      k.id,
      k.jenisKendaraan,
      `"${k.namaKendaraan}"`,
      `"${k.noPolisi}"`,
      `"${k.unit || ''}"`,
      `"${k.penanggungJawab}"`,
      k.kondisiKendaraan,
      k.kondisiBan,
      k.kondisiAki,
      k.kebersihan,
      k.kilometer || 0,
      k.tanggalPengecekan,
      `"${k.catatan || ''}"`,
      (k.materials || []).length
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Monitoring_Kendaraan_Operasional_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Chart Data Computations
  const pieChartData = [
    { name: 'Mobil', value: totalMobil, color: '#3b82f6' },
    { name: 'Motor', value: totalMotor, color: '#f59e0b' }
  ];

  const kondisiChartData = [
    {
      name: 'Kondisi',
      Baik: kendaraanList.filter(k => k.kondisiKendaraan === 'Baik').length,
      PerluPerbaikan: kendaraanList.filter(k => k.kondisiKendaraan === 'Perlu Perbaikan').length,
      Rusak: kendaraanList.filter(k => k.kondisiKendaraan === 'Rusak').length
    }
  ];

  return (
    <div className="space-y-6 font-sans pb-12">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl relative overflow-hidden border border-slate-800">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold border border-blue-500/30 flex items-center gap-1.5">
                <Car className="w-3.5 h-3.5" /> Fleet & Mobility Patrol
              </span>
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30">
                ULP & UP3 System
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Monitoring Kendaraan Operasional
            </h1>
            <p className="text-slate-400 text-xs md:text-sm mt-1 max-w-2xl">
              Pemantauan kondisi fisik armada (Mobil & Motor Operasional Yantek/Pemeliharaan), kesehatan aki, kelayakan ban, kebersihan, serta ketersediaan stok material darurat di kendaraan.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleExportPDF}
              className="px-3.5 py-2.5 bg-red-600 hover:bg-red-500 text-white border border-red-600 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Export PDF</span>
            </button>
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <Download className="w-4 h-4 text-slate-300" />
              <span>Export CSV</span>
            </button>

            {canEdit && (
              <button
                onClick={handleOpenAddModal}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-blue-600/30 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Input Kendaraan Baru</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Selection Bar */}
        <div className="relative z-10 mt-6 pt-4 border-t border-slate-800 flex items-center gap-3">
          <button
            onClick={() => setActiveTab('live_gps')}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'live_gps'
                ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>Dashboard Live GPS Smartphone</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          </button>

          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'inventory'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            <List className="w-4 h-4" />
            <span>Daftar Fisik & Material Kendaraan</span>
          </button>
        </div>
      </div>

      {activeTab === 'live_gps' ? (
        <LiveGpsKendaraanDashboard
          currentUser={currentUser}
          kendaraanList={kendaraanList}
          onUpdateKendaraan={onUpdateKendaraan}
        />
      ) : (
        <>

      {/* Analytics KPI Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Car className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Total Armada</span>
            <span className="text-xl font-black text-slate-900">{totalKendaraan} <span className="text-xs font-semibold text-slate-400">Unit</span></span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Car className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Mobil Operasional</span>
            <span className="text-xl font-black text-slate-900">{totalMobil} <span className="text-xs font-semibold text-slate-400">Mobil</span></span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Bike className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Motor Operasional</span>
            <span className="text-xl font-black text-slate-900">{totalMotor} <span className="text-xs font-semibold text-slate-400">Motor</span></span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Kondisi Baik</span>
            <span className="text-xl font-black text-emerald-600">{totalBaik} <span className="text-xs font-semibold text-slate-400">Siap Operasi</span></span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3 col-span-2 sm:col-span-1">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Perlu Perhatian</span>
            <span className="text-xl font-black text-amber-600">{totalPerluPerbaikan} <span className="text-xs font-semibold text-slate-400">Unit</span></span>
          </div>
        </div>
      </div>

      {/* Visualisasi Data Kendaraan */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pie Chart: Jenis Kendaraan */}
        <div className="bg-white p-4 md:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center">
          <h3 className="text-sm font-bold text-slate-800 mb-2 w-full text-left">Distribusi Jenis Kendaraan</h3>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontWeight: 'bold' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart: Kondisi Kendaraan */}
        <div className="bg-white p-4 md:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center">
          <h3 className="text-sm font-bold text-slate-800 mb-2 w-full text-left">Status Kondisi Kendaraan</h3>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={kondisiChartData}
                margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                barSize={40}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" hide />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip 
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                <Bar dataKey="Baik" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="PerluPerbaikan" name="Perlu Perbaikan" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Rusak" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap flex-1">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari armada, plat nomor, petugas, atau material onboard..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500 focus:bg-white transition-all text-slate-800"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Unit PLN Filter */}
          <select
            value={filterUnit}
            onChange={(e) => setFilterUnit(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-extrabold text-slate-800 focus:outline-none focus:border-blue-500"
          >
            <option value="Semua">Semua Unit PLN</option>
            <option value="ULP Baguala">ULP Baguala</option>
            <option value="PLN Nusa Daya">PLN Nusa Daya</option>
            <option value="UP3">UP3</option>
            <option value="UIW">UIW</option>
            <option value="PLN">PLN</option>
          </select>

          {/* Jenis Filter */}
          <select
            value={filterJenis}
            onChange={(e) => setFilterJenis(e.target.value as any)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-extrabold text-slate-800 focus:outline-none focus:border-blue-500"
          >
            <option value="Semua">Semua Jenis Armada</option>
            <option value="Mobil Operasional">🚗 Mobil Operasional</option>
            <option value="Motor Operasional">🏍️ Motor Operasional</option>
          </select>

          {/* Kondisi Filter */}
          <select
            value={filterKondisi}
            onChange={(e) => setFilterKondisi(e.target.value as any)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-extrabold text-slate-800 focus:outline-none focus:border-blue-500"
          >
            <option value="Semua">Semua Kondisi</option>
            <option value="Baik">🟢 Baik (Siap Pakai)</option>
            <option value="Perlu Perbaikan">🟡 Perlu Perbaikan</option>
            <option value="Rusak">🔴 Rusak</option>
          </select>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'grid'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Grid Card
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'table'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Tabel Data
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <TableSkeletonLoader columns={11} rows={6} headerTitle="Data Kendaraan Operasional" />
      ) : filteredList.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl shadow-sm space-y-3">
          <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Car className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800">Tidak ada data kendaraan ditemukan</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Coba sesuaikan kata kunci pencarian atau filter kondisi/jenis kendaraan yang Anda pilih.
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID CARDS VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredList.map((item) => {
            const isMobil = item.jenisKendaraan === 'Mobil Operasional';
            const matCount = (item.materials || []).length;

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
              >
                {/* Card Header */}
                <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        isMobil ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'
                      }`}>
                        {isMobil ? <Car className="w-4 h-4" /> : <Bike className="w-4 h-4" />}
                      </span>
                      <div>
                        <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">
                          {item.jenisKendaraan}
                        </span>
                        <h3 className="text-sm font-extrabold text-slate-900 line-clamp-1">
                          {item.namaKendaraan}
                        </h3>
                      </div>
                    </div>

                    <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-yellow-300 font-mono font-black text-xs border border-slate-800 tracking-wider shrink-0 shadow-sm">
                      {item.noPolisi}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 mt-3">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[11px] border border-slate-200/80 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {item.unit || 'ULP Baguala'}
                    </span>

                    {/* Overall Condition Badge */}
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border flex items-center gap-1 ${
                      item.kondisiKendaraan === 'Baik'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : item.kondisiKendaraan === 'Perlu Perbaikan'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>
                      {item.kondisiKendaraan === 'Baik' ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : (
                        <AlertTriangle className="w-3.5 h-3.5" />
                      )}
                      <span>{item.kondisiKendaraan}</span>
                    </span>
                  </div>
                </div>

                {/* Card Body Checklist */}
                <div className="p-4 space-y-3 flex-1 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    {/* Ban */}
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 mb-0.5">
                        <Disc className="w-3 h-3 text-slate-500" /> Kondisi Ban
                      </span>
                      <span className={`font-bold block ${
                        item.kondisiBan.includes('Baik') ? 'text-emerald-700' : item.kondisiBan.includes('Cukup') ? 'text-amber-700' : 'text-rose-700'
                      }`}>
                        {item.kondisiBan}
                      </span>
                    </div>

                    {/* Aki */}
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 mb-0.5">
                        <BatteryCharging className="w-3 h-3 text-slate-500" /> Kondisi Aki
                      </span>
                      <span className={`font-bold block ${
                        item.kondisiAki.includes('Normal') ? 'text-emerald-700' : 'text-amber-700'
                      }`}>
                        {item.kondisiAki}
                      </span>
                    </div>

                    {/* Kebersihan */}
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 mb-0.5">
                        <Sparkles className="w-3 h-3 text-slate-500" /> Kebersihan
                      </span>
                      <span className="font-bold text-slate-800 block">
                        {item.kebersihan}
                      </span>
                    </div>

                    {/* Odometer */}
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 mb-0.5">
                        <Clock className="w-3 h-3 text-slate-500" /> Odometer
                      </span>
                      <span className="font-mono font-bold text-slate-800 block">
                        {item.kilometer ? `${item.kilometer.toLocaleString('id-ID')} KM` : '-'}
                      </span>
                    </div>
                  </div>

                  {/* Penanggung jawab */}
                  <div className="pt-1 flex items-center justify-between text-slate-600">
                    <span className="flex items-center gap-1 text-[11px] font-semibold">
                      <UserCheck className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      {item.penanggungJawab}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {item.tanggalPengecekan}
                    </span>
                  </div>

                  {/* Material Onboard Box */}
                  <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100/80">
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <span className="font-extrabold text-blue-900 text-[11px] flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5 text-blue-600" />
                        Stok Material di Kendaraan
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-blue-200/70 text-blue-800 font-extrabold text-[10px]">
                        {matCount} Jenis
                      </span>
                    </div>

                    {matCount === 0 ? (
                      <p className="text-[11px] text-slate-400 italic">Tidak ada stok material di dalam kendaraan.</p>
                    ) : (
                      <div className="space-y-1">
                        {item.materials.slice(0, 3).map((m, idx) => (
                          <div key={idx} className="flex items-center justify-between text-[11px] text-slate-700">
                            <span className="truncate pr-2 font-medium">• {m.namaMaterial}</span>
                            <span className="font-mono font-bold text-blue-800 shrink-0">{m.jumlah} {m.satuan}</span>
                          </div>
                        ))}
                        {matCount > 3 && (
                          <p className="text-[10px] font-bold text-blue-600 pt-0.5">
                            +{matCount - 3} jenis material lainnya...
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {item.catatan && (
                    <p className="text-[11px] text-slate-500 italic bg-amber-50/50 p-2 rounded-lg border border-amber-100/60 line-clamp-2">
                      💬 "{item.catatan}"
                    </p>
                  )}
                </div>

                {/* Card Footer Actions */}
                <div className="px-4 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setSelectedKendaraanDetail(item)}
                    className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-blue-600" />
                    <span>Detail & Material</span>
                  </button>

                  {canEdit && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditModal(item)}
                        className="p-1.5 hover:bg-blue-100 text-blue-600 rounded-lg transition-all cursor-pointer"
                        title="Edit Kendaraan"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmItem(item)}
                        className="p-1.5 hover:bg-rose-100 text-rose-600 rounded-lg transition-all cursor-pointer"
                        title="Hapus Kendaraan"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-sans">
              <thead>
                <tr className="bg-slate-800 text-slate-200 uppercase text-[10px] tracking-wider font-extrabold border-b border-slate-700">
                  <th className="py-3 px-4">No. / Jenis</th>
                  <th className="py-3 px-4">Plat & Nama Kendaraan</th>
                  <th className="py-3 px-4">Unit PLN</th>
                  <th className="py-3 px-4">Penanggung Jawab</th>
                  <th className="py-3 px-4 text-center">Kondisi Kendaraan</th>
                  <th className="py-3 px-4">Kondisi Ban</th>
                  <th className="py-3 px-4">Kondisi Aki</th>
                  <th className="py-3 px-4">Kebersihan</th>
                  <th className="py-3 px-4 text-center">Material Onboard</th>
                  <th className="py-3 px-4">Tgl Cek</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredList.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 text-slate-400 font-bold">
                      #{idx + 1}
                      <span className="block text-[10px] text-slate-500 font-normal">{item.jenisKendaraan}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-900 text-yellow-300 font-mono font-black text-[11px] inline-block mb-0.5">
                        {item.noPolisi}
                      </span>
                      <span className="block font-bold text-slate-900">{item.namaKendaraan}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-extrabold text-[11px] border border-blue-200/60">
                        {item.unit || 'ULP Baguala'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{item.penanggungJawab}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold inline-flex items-center gap-1 ${
                        item.kondisiKendaraan === 'Baik'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : item.kondisiKendaraan === 'Perlu Perbaikan'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {item.kondisiKendaraan}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-700">{item.kondisiBan}</td>
                    <td className="py-3 px-4 font-medium text-slate-700">{item.kondisiAki}</td>
                    <td className="py-3 px-4 font-medium text-slate-700">{item.kebersihan}</td>
                    <td className="py-3 px-4 text-center font-bold text-blue-600">
                      {(item.materials || []).length} Jenis
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-medium">{item.tanggalPengecekan}</td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setSelectedKendaraanDetail(item)}
                          className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition-all"
                          title="Lihat Detail & Material"
                        >
                          <Eye className="w-3.5 h-3.5 text-blue-600" />
                        </button>
                        {canEdit && (
                          <>
                            <button
                              onClick={() => handleOpenEditModal(item)}
                              className="p-1.5 hover:bg-blue-100 text-blue-600 rounded-lg transition-all"
                              title="Edit Kendaraan"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirmItem(item)}
                              className="p-1.5 hover:bg-rose-100 text-rose-600 rounded-lg transition-all"
                              title="Hapus Kendaraan"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      </>
      )}

      {/* DETAIL DRAWER / MODAL */}
      {selectedKendaraanDetail && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 font-sans">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                  {selectedKendaraanDetail.jenisKendaraan === 'Mobil Operasional' ? (
                    <Car className="w-5 h-5" />
                  ) : (
                    <Bike className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-black text-yellow-300 bg-slate-800 px-2 py-0.5 rounded">
                      {selectedKendaraanDetail.noPolisi}
                    </span>
                    <span className="text-[11px] font-bold text-slate-300">
                      {selectedKendaraanDetail.jenisKendaraan}
                    </span>
                  </div>
                  <h2 className="text-base font-extrabold text-white">
                    {selectedKendaraanDetail.namaKendaraan}
                  </h2>
                </div>
              </div>

              <button
                onClick={() => setSelectedKendaraanDetail(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Information Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Unit PLN</span>
                  <span className="text-xs font-extrabold text-slate-900">{selectedKendaraanDetail.unit || 'ULP Baguala'}</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Kondisi Kendaraan</span>
                  <span className={`text-xs font-extrabold ${
                    selectedKendaraanDetail.kondisiKendaraan === 'Baik' ? 'text-emerald-600' : 'text-amber-600'
                  }`}>
                    {selectedKendaraanDetail.kondisiKendaraan}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Penanggung Jawab</span>
                  <span className="text-xs font-extrabold text-slate-900">{selectedKendaraanDetail.penanggungJawab}</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">🛞 Kondisi Ban</span>
                  <span className="text-xs font-bold text-slate-800">{selectedKendaraanDetail.kondisiBan}</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">🔋 Kondisi Aki</span>
                  <span className="text-xs font-bold text-slate-800">{selectedKendaraanDetail.kondisiAki}</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">🧼 Kebersihan</span>
                  <span className="text-xs font-bold text-slate-800">{selectedKendaraanDetail.kebersihan}</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">⏱️ Odometer (KM)</span>
                  <span className="text-xs font-bold font-mono text-slate-800">
                    {selectedKendaraanDetail.kilometer ? `${selectedKendaraanDetail.kilometer.toLocaleString('id-ID')} KM` : '-'}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 col-span-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">📅 Tanggal Pengecekan</span>
                  <span className="text-xs font-bold text-slate-800">{selectedKendaraanDetail.tanggalPengecekan}</span>
                </div>
              </div>

              {selectedKendaraanDetail.catatan && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
                  <span className="font-extrabold block mb-0.5">Catatan / Keterangan Kondisi:</span>
                  <p>{selectedKendaraanDetail.catatan}</p>
                </div>
              )}

              {/* Material Onboard List */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-extrabold uppercase text-slate-700 tracking-wider flex items-center gap-2">
                    <Package className="w-4 h-4 text-blue-600" />
                    Daftar Material yang Tersedia di Kendaraan
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-extrabold text-xs">
                    {(selectedKendaraanDetail.materials || []).length} Jenis Material
                  </span>
                </div>

                {(!selectedKendaraanDetail.materials || selectedKendaraanDetail.materials.length === 0) ? (
                  <p className="text-xs text-slate-400 italic p-4 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    Belum ada data stok material yang tercatat di dalam kendaraan ini.
                  </p>
                ) : (
                  <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-100 text-slate-600 font-extrabold uppercase text-[10px] border-b border-slate-200">
                          <th className="py-2.5 px-4">No</th>
                          <th className="py-2.5 px-4">Nama Material / Komponen</th>
                          <th className="py-2.5 px-4 text-right">Jumlah (Qty)</th>
                          <th className="py-2.5 px-4">Satuan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200/60">
                        {selectedKendaraanDetail.materials.map((m, idx) => (
                          <tr key={idx} className="hover:bg-white transition-colors">
                            <td className="py-2.5 px-4 text-slate-400 font-bold">{idx + 1}</td>
                            <td className="py-2.5 px-4 font-bold text-slate-900">{m.namaMaterial}</td>
                            <td className="py-2.5 px-4 text-right font-mono font-black text-blue-700">{m.jumlah}</td>
                            <td className="py-2.5 px-4 font-semibold text-slate-600">{m.satuan}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => setSelectedKendaraanDetail(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT FORM MODAL */}
      {/* Delete Confirmation Modal */}
      {deleteConfirmItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-slate-200 font-sans p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-rose-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Hapus Kendaraan?</h3>
            <p className="text-sm text-slate-500 mb-6">
              Anda yakin ingin menghapus data kendaraan <strong className="text-slate-700">{deleteConfirmItem.namaKendaraan} ({deleteConfirmItem.noPolisi})</strong>? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setDeleteConfirmItem(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  onDeleteKendaraan(deleteConfirmItem.id);
                  setDeleteConfirmItem(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-500/20 transition-all cursor-pointer"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {showFormModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 font-sans">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between sticky top-0 z-10 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Car className="w-5 h-5 text-blue-400" />
                <h2 className="text-base font-extrabold text-white">
                  {editingKendaraan ? 'Edit Data Kendaraan Operasional' : 'Input Kendaraan Operasional Baru'}
                </h2>
              </div>
              <button
                onClick={() => setShowFormModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="p-6 space-y-5">
              {/* Basic Vehicle Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Jenis Kendaraan
                  </label>
                  <select
                    value={form.jenisKendaraan}
                    onChange={(e) => setForm({ ...form, jenisKendaraan: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-extrabold text-slate-800 focus:outline-none focus:border-blue-500"
                    required
                  >
                    <option value="Mobil Operasional">🚗 Mobil Operasional</option>
                    <option value="Motor Operasional">🏍️ Motor Operasional</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Unit PLN
                  </label>
                  <select
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-extrabold text-slate-800 focus:outline-none focus:border-blue-500"
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
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Kendaraan / Deskripsi
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Mobil Hilux Yantek Baguala 01"
                    value={form.namaKendaraan}
                    onChange={(e) => setForm({ ...form, namaKendaraan: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Plat Nomor (Nomor Polisi)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: DE 8192 AB"
                    value={form.noPolisi}
                    onChange={(e) => setForm({ ...form, noPolisi: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold uppercase focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Penanggung Jawab / Tim Yantek
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Tim Yantek Baguala Regu A"
                    value={form.penanggungJawab}
                    onChange={(e) => setForm({ ...form, penanggungJawab: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Odometer / Kilometer (KM)
                  </label>
                  <input
                    type="number"
                    placeholder="45000"
                    value={form.kilometer}
                    onChange={(e) => setForm({ ...form, kilometer: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-semibold focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Physical Condition Checklist */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                <h3 className="text-xs font-extrabold uppercase text-slate-800 tracking-wider flex items-center gap-1.5">
                  <Wrench className="w-4 h-4 text-blue-600" />
                  Kondisi Fisik & Kelayakan Kendaraan
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Kondisi Umum Kendaraan
                    </label>
                    <select
                      value={form.kondisiKendaraan}
                      onChange={(e) => setForm({ ...form, kondisiKendaraan: e.target.value as any })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-extrabold text-slate-800 focus:outline-none focus:border-blue-500"
                    >
                      <option value="Baik">🟢 Baik (Siap Pakai / Siap Tempur)</option>
                      <option value="Perlu Perbaikan">🟡 Perlu Perbaikan</option>
                      <option value="Rusak">🔴 Rusak (Tidak Siap Jalan)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      🛞 Kondisi Ban
                    </label>
                    <select
                      value={form.kondisiBan}
                      onChange={(e) => setForm({ ...form, kondisiBan: e.target.value as any })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500"
                    >
                      <option value="Baik - Tebal">Baik - Tebal & Alur Bagus</option>
                      <option value="Cukup">Cukup - Masih Layak Jalan</option>
                      <option value="Aus / Perlu Ganti">Aus / Perlu Penggantian</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      🔋 Kondisi Aki
                    </label>
                    <select
                      value={form.kondisiAki}
                      onChange={(e) => setForm({ ...form, kondisiAki: e.target.value as any })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500"
                    >
                      <option value="Normal - Baik">Normal - Baik & Tokcer</option>
                      <option value="Lemah">Lemah - Perlu Di-stroom / Cek</option>
                      <option value="Perlu Stroom / Ganti">Perlu Replacement / Ganti Baru</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      🧼 Kebersihan Kendaraan
                    </label>
                    <select
                      value={form.kebersihan}
                      onChange={(e) => setForm({ ...form, kebersihan: e.target.value as any })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500"
                    >
                      <option value="Sangat Bersih">✨ Sangat Bersih & Rapi</option>
                      <option value="Bersih">👍 Bersih Layak</option>
                      <option value="Kotor">⚠️ Kotor / Perlu Dicuci</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Tanggal Pengecekan
                    </label>
                    <input
                      type="date"
                      value={form.tanggalPengecekan}
                      onChange={(e) => setForm({ ...form, tanggalPengecekan: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Catatan Tambahan
                    </label>
                    <input
                      type="text"
                      placeholder="mis. Oli baru diganti, kampas rem agak tipis..."
                      value={form.catatan}
                      onChange={(e) => setForm({ ...form, catatan: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Material Onboard Manager */}
              <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-extrabold uppercase text-blue-900 tracking-wider flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-blue-600" />
                    Material yang Tersedia di Dalam Kendaraan
                  </h3>
                  <span className="text-[11px] font-bold text-blue-700">
                    {form.materials.length} Jenis Tercatat
                  </span>
                </div>

                {/* Material List Table */}
                {form.materials.length > 0 && (
                  <div className="bg-white rounded-xl border border-blue-200/80 overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-blue-100/50 text-blue-900 font-extrabold text-[10px] uppercase">
                          <th className="py-2 px-3">Nama Material</th>
                          <th className="py-2 px-3 text-right">Jumlah</th>
                          <th className="py-2 px-3">Satuan</th>
                          <th className="py-2 px-3 text-center">Hapus</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {form.materials.map((m, idx) => (
                          <tr key={m.id || idx}>
                            <td className="py-2 px-3 font-semibold text-slate-800">{m.namaMaterial}</td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-blue-800">{m.jumlah}</td>
                            <td className="py-2 px-3 text-slate-600 font-medium">{m.satuan}</td>
                            <td className="py-2 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveMaterialFromForm(idx)}
                                className="p-1 text-rose-500 hover:bg-rose-50 rounded transition-all cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Add new material row inputs */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="Nama Material (mis. Fuse Link 10A, Tap Connector...)"
                    value={newMatName}
                    onChange={(e) => setNewMatName(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500"
                  />
                  <input
                    type="number"
                    min="1"
                    placeholder="Qty"
                    value={newMatQty}
                    onChange={(e) => setNewMatQty(Number(e.target.value))}
                    className="w-16 px-2 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-blue-500"
                  />
                  <select
                    value={newMatSatuan}
                    onChange={(e) => setNewMatSatuan(e.target.value)}
                    className="w-24 px-2 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500"
                  >
                    <option value="Pcs">Pcs</option>
                    <option value="Meter">Meter</option>
                    <option value="Set">Set</option>
                    <option value="Roll">Roll</option>
                    <option value="Pack">Pack</option>
                    <option value="Unit">Unit</option>
                    <option value="Pasang">Pasang</option>
                  </select>
                  <button
                    type="button"
                    onClick={handleAddMaterialToForm}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0"
                  >
                    + Tambah
                  </button>
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all cursor-pointer"
                >
                  {editingKendaraan ? 'Simpan Perubahan' : 'Tambah Kendaraan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
