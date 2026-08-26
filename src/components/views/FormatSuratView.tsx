import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Plus,
  Search,
  Trash2,
  Edit2,
  Printer,
  Calendar,
  Users,
  Briefcase,
  Layers,
  Wrench,
  CheckCircle,
  Clock,
  X,
  PlusCircle,
  MapPin,
  ClipboardList
} from 'lucide-react';
import {
  db,
  collection,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  handleFirestoreError,
  OperationType,
  registerDeletedId,
  filterDeleted
} from '../../lib/firebase';
import { SuratItem, JenisSurat, User } from '../../types';

interface FormatSuratViewProps {
  currentUser?: User | null;
}

export const FormatSuratView: React.FC<FormatSuratViewProps> = ({ currentUser }) => {
  const [suratList, setSuratList] = useState<SuratItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editItem, setEditItem] = useState<SuratItem | null>(null);
  
  // For printing/previewing
  const [printItem, setPrintItem] = useState<SuratItem | null>(null);

  // Form states
  const [jenisSurat, setJenisSurat] = useState<JenisSurat>('surat_cuti');
  const [nomorSurat, setNomorSurat] = useState<string>('');
  const [tanggalSurat, setTanggalSurat] = useState<string>(new Date().toISOString().split('T')[0]);
  const [perihal, setPerihal] = useState<string>('');
  const [kepada, setKepada] = useState<string>('');
  const [pembuat, setPembuat] = useState<string>(currentUser?.name || 'Manager ULP');
  const [unit, setUnit] = useState<string>('ULP Bagua');
  const [status, setStatus] = useState<SuratItem['status']>('Draft');
  const [catatan, setCatatan] = useState<string>('');

  // Specific Payload States
  // 1. Surat Cuti
  const [namaPegawai, setNamaPegawai] = useState<string>('');
  const [nip, setNip] = useState<string>('');
  const [jabatan, setJabatan] = useState<string>('');
  const [cutiDari, setCutiDari] = useState<string>('');
  const [cutiSampai, setCutiSampai] = useState<string>('');
  const [alasanCuti, setAlasanCuti] = useState<string>('');
  const [alamatCuti, setAlamatCuti] = useState<string>('');
  const [pengganti, setPengganti] = useState<string>('');

  // 2. Permintaan Alker
  const [namaAlker, setNamaAlker] = useState<string>('');
  const [jumlahAlker, setJumlahAlker] = useState<number>(1);
  const [keperluanAlker, setKeperluanAlker] = useState<string>('');
  const [tglDibutuhkan, setTglDibutuhkan] = useState<string>('');

  // 3. CMC Petugas
  const [namaKetua, setNamaKetua] = useState<string>('');
  const [anggotaTim, setAnggotaTim] = useState<string>('');
  const [shiftPiket, setShiftPiket] = useState<string>('Pagi');
  const [noKendaraan, setNoKendaraan] = useState<string>('');
  const [penyulangTarget, setPenyulangTarget] = useState<string>('');
  const [peralatanDibawa, setPeralatanDibawa] = useState<string>('');

  // 4. Surat Panggilan
  const [namaDipanggil, setNamaDipanggil] = useState<string>('');
  const [jabatanDipanggil, setJabatanDipanggil] = useState<string>('');
  const [hariTanggalPanggilan, setHariTanggalPanggilan] = useState<string>('');
  const [waktuPanggilan, setWaktuPanggilan] = useState<string>('09:00');
  const [tempatPanggilan, setTempatPanggilan] = useState<string>('Ruang Rapat ULP');
  const [agendaPanggilan, setAgendaPanggilan] = useState<string>('');

  // 5. Surat Permintaan Material
  const [namaProyek, setNamaProyek] = useState<string>('');
  const [lokasiPekerjaan, setLokasiPekerjaan] = useState<string>('');
  const [gudangTujuan, setGudangTujuan] = useState<string>('Gudang Area ULP');
  const [materialList, setMaterialList] = useState<{ nama: string; satuan: string; volume: number }[]>([]);
  const [newMatNama, setNewMatNama] = useState<string>('');
  const [newMatSatuan, setNewMatSatuan] = useState<string>('Pcs');
  const [newMatVolume, setNewMatVolume] = useState<number>(1);

  // Load items from Firestore
  useEffect(() => {
    const q = query(collection(db, 'surat_keluar'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items: SuratItem[] = [];
        snapshot.forEach((doc) => {
          items.push({ id: doc.id, ...doc.data() } as SuratItem);
        });
        setSuratList(filterDeleted(items));
        setLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'surat_keluar');
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // Update default perihal and kepada based on selected letter type
  useEffect(() => {
    if (!editItem) {
      if (jenisSurat === 'surat_cuti') {
        setPerihal('Permohonan Izin Cuti Tahunan Pegawai');
        setKepada('Manager Bagian SDM & Organisasi');
      } else if (jenisSurat === 'permintaan_alker') {
        setPerihal('Permintaan Penambahan / Perbaikan Alat Kerja ULP');
        setKepada('Pejabat Pengadaan ULP Bagua');
      } else if (jenisSurat === 'cmc_petugas') {
        setPerihal('Checklist Monitoring & Cleansing (CMC) Petugas Teknik');
        setKepada('Spv. Teknik / K3L ULP Bagua');
      } else if (jenisSurat === 'surat_panggilan') {
        setPerihal('Surat Panggilan Penjelasan Kinerja Petugas');
        setKepada('Yth. Petugas Pelaksana / Vendor Mitra');
      } else if (jenisSurat === 'permintaan_material') {
        setPerihal('Permintaan dan Pengeluaran Material Pekerjaan Jaringan');
        setKepada('Logistik / Pengelola Gudang Area');
      }
    }
  }, [jenisSurat, editItem]);

  // Handle adding dynamic material
  const handleAddMaterial = () => {
    if (!newMatNama.trim()) return;
    setMaterialList((prev) => [
      ...prev,
      { nama: newMatNama, satuan: newMatSatuan, volume: Number(newMatVolume) || 1 }
    ]);
    setNewMatNama('');
    setNewMatVolume(1);
  };

  const handleRemoveMaterial = (index: number) => {
    setMaterialList((prev) => prev.filter((_, i) => i !== index));
  };

  // Populate form for editing
  const handleEdit = (item: SuratItem) => {
    setEditItem(item);
    setJenisSurat(item.jenisSurat);
    setNomorSurat(item.nomorSurat);
    setTanggalSurat(item.tanggalSurat);
    setPerihal(item.perihal);
    setKepada(item.kepada);
    setPembuat(item.pembuat);
    setUnit(item.unit || 'ULP Bagua');
    setStatus(item.status);
    setCatatan(item.catatan || '');

    // Reset and populate payload states
    setNamaPegawai(item.payload.namaPegawai || '');
    setNip(item.payload.nip || '');
    setJabatan(item.payload.jabatan || '');
    setCutiDari(item.payload.cutiDari || '');
    setCutiSampai(item.payload.cutiSampai || '');
    setAlasanCuti(item.payload.alasanCuti || '');
    setAlamatCuti(item.payload.alamatCuti || '');
    setPengganti(item.payload.pengganti || '');

    setNamaAlker(item.payload.namaAlker || '');
    setJumlahAlker(item.payload.jumlahAlker || 1);
    setKeperluanAlker(item.payload.keperluanAlker || '');
    setTglDibutuhkan(item.payload.tglDibutuhkan || '');

    setNamaKetua(item.payload.namaKetua || '');
    setAnggotaTim(item.payload.anggotaTim || '');
    setShiftPiket(item.payload.shiftPiket || 'Pagi');
    setNoKendaraan(item.payload.noKendaraan || '');
    setPenyulangTarget(item.payload.penyulangTarget || '');
    setPeralatanDibawa(item.payload.peralatanDibawa || '');

    setNamaDipanggil(item.payload.namaDipanggil || '');
    setJabatanDipanggil(item.payload.jabatanDipanggil || '');
    setHariTanggalPanggilan(item.payload.hariTanggalPanggilan || '');
    setWaktuPanggilan(item.payload.waktuPanggilan || '09:00');
    setTempatPanggilan(item.payload.tempatPanggilan || 'Ruang Rapat ULP');
    setAgendaPanggilan(item.payload.agendaPanggilan || '');

    setNamaProyek(item.payload.namaProyek || '');
    setLokasiPekerjaan(item.payload.lokasiPekerjaan || '');
    setGudangTujuan(item.payload.gudangTujuan || 'Gudang Area ULP');
    setMaterialList(item.payload.listMaterial || []);

    setIsModalOpen(true);
  };

  const handleOpenNewModal = () => {
    setEditItem(null);
    setNomorSurat(`PLN/BGA/${new Date().getFullYear()}/${Math.floor(100 + Math.random() * 900)}`);
    setTanggalSurat(new Date().toISOString().split('T')[0]);
    setStatus('Draft');
    setCatatan('');
    
    // Clear payloads
    setNamaPegawai('');
    setNip('');
    setJabatan('');
    setCutiDari('');
    setCutiSampai('');
    setAlasanCuti('');
    setAlamatCuti('');
    setPengganti('');
    setNamaAlker('');
    setJumlahAlker(1);
    setKeperluanAlker('');
    setTglDibutuhkan('');
    setNamaKetua('');
    setAnggotaTim('');
    setShiftPiket('Pagi');
    setNoKendaraan('');
    setPenyulangTarget('');
    setPeralatanDibawa('');
    setNamaDipanggil('');
    setJabatanDipanggil('');
    setHariTanggalPanggilan('');
    setWaktuPanggilan('09:00');
    setTempatPanggilan('Ruang Rapat ULP');
    setAgendaPanggilan('');
    setNamaProyek('');
    setLokasiPekerjaan('');
    setGudangTujuan('Gudang Area ULP');
    setMaterialList([]);

    setIsModalOpen(true);
  };

  // Save / Update letter
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = editItem ? editItem.id : `surat_${Date.now()}`;

    // Construct Payload
    const payload: SuratItem['payload'] = {};
    if (jenisSurat === 'surat_cuti') {
      payload.namaPegawai = namaPegawai;
      payload.nip = nip;
      payload.jabatan = jabatan;
      payload.cutiDari = cutiDari;
      payload.cutiSampai = cutiSampai;
      payload.alasanCuti = alasanCuti;
      payload.alamatCuti = alamatCuti;
      payload.pengganti = pengganti;
    } else if (jenisSurat === 'permintaan_alker') {
      payload.namaAlker = namaAlker;
      payload.jumlahAlker = Number(jumlahAlker) || 1;
      payload.keperluanAlker = keperluanAlker;
      payload.tglDibutuhkan = tglDibutuhkan;
    } else if (jenisSurat === 'cmc_petugas') {
      payload.namaKetua = namaKetua;
      payload.anggotaTim = anggotaTim;
      payload.shiftPiket = shiftPiket;
      payload.noKendaraan = noKendaraan;
      payload.penyulangTarget = penyulangTarget;
      payload.peralatanDibawa = peralatanDibawa;
    } else if (jenisSurat === 'surat_panggilan') {
      payload.namaDipanggil = namaDipanggil;
      payload.jabatanDipanggil = jabatanDipanggil;
      payload.hariTanggalPanggilan = hariTanggalPanggilan;
      payload.waktuPanggilan = waktuPanggilan;
      payload.tempatPanggilan = tempatPanggilan;
      payload.agendaPanggilan = agendaPanggilan;
    } else if (jenisSurat === 'permintaan_material') {
      payload.namaProyek = namaProyek;
      payload.lokasiPekerjaan = lokasiPekerjaan;
      payload.gudangTujuan = gudangTujuan;
      payload.listMaterial = materialList;
    }

    const newSurat: SuratItem = {
      id,
      nomorSurat,
      jenisSurat,
      tanggalSurat,
      perihal,
      kepada,
      pembuat,
      unit,
      status,
      payload,
      catatan,
      createdAt: editItem ? editItem.createdAt : new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'surat_keluar', id), JSON.parse(JSON.stringify(newSurat)));
      setIsModalOpen(false);
      setEditItem(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'surat_keluar');
    }
  };

  // Delete letter
  const handleDelete = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus dokumen surat ini?')) {
      try {
        await deleteDoc(doc(db, 'surat_keluar', id));
        registerDeletedId(id);
        // Instant local filter update
        setSuratList((prev) => prev.filter((s) => s.id !== id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, 'surat_keluar');
      }
    }
  };

  // Helper formatting names
  const getJenisSuratBadge = (type: JenisSurat) => {
    switch (type) {
      case 'surat_cuti':
        return <span className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">Surat Cuti</span>;
      case 'permintaan_alker':
        return <span className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-amber-50 text-amber-700 border border-amber-200">Permintaan Alker</span>;
      case 'cmc_petugas':
        return <span className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-purple-50 text-purple-700 border border-purple-200">CMC Petugas</span>;
      case 'surat_panggilan':
        return <span className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-rose-50 text-rose-700 border border-rose-200">Surat Panggilan</span>;
      case 'permintaan_material':
        return <span className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-blue-50 text-blue-700 border border-blue-200">Permintaan Material</span>;
    }
  };

  // Filtered List
  const filteredSurat = useMemo(() => {
    return suratList.filter((s) => {
      const matchType = selectedTypeFilter === 'all' || s.jenisSurat === selectedTypeFilter;
      const q = searchQuery.toLowerCase();
      const matchQuery =
        s.nomorSurat.toLowerCase().includes(q) ||
        s.perihal.toLowerCase().includes(q) ||
        s.kepada.toLowerCase().includes(q) ||
        s.pembuat.toLowerCase().includes(q) ||
        (s.payload.namaPegawai && s.payload.namaPegawai.toLowerCase().includes(q)) ||
        (s.payload.namaProyek && s.payload.namaProyek.toLowerCase().includes(q));
      return matchType && matchQuery;
    });
  }, [suratList, selectedTypeFilter, searchQuery]);

  // Aggregate stats
  const stats = useMemo(() => {
    const total = suratList.length;
    const cuti = suratList.filter((s) => s.jenisSurat === 'surat_cuti').length;
    const alker = suratList.filter((s) => s.jenisSurat === 'permintaan_alker').length;
    const cmc = suratList.filter((s) => s.jenisSurat === 'cmc_petugas').length;
    const panggil = suratList.filter((s) => s.jenisSurat === 'surat_panggilan').length;
    const mat = suratList.filter((s) => s.jenisSurat === 'permintaan_material').length;

    return { total, cuti, alker, cmc, panggil, mat };
  }, [suratList]);

  // Formatter Date Indonesian
  const formatDateIndo = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      const parts = dateStr.split('-');
      if (parts.length !== 3) return dateStr;
      const months = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
      ];
      return `${parseInt(parts[2], 10)} ${months[parseInt(parts[1], 10) - 1]} ${parts[0]}`;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="p-6 bg-gradient-to-r from-[#022623] via-[#044c45] to-[#022e2a] border-2 border-teal-500/60 shadow-xl rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 text-white relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="z-10 flex items-start gap-3.5">
          <div className="p-3 bg-teal-950/80 rounded-2xl text-teal-300 border border-teal-500/40 shadow-inner shrink-0">
            <FileText className="w-6 h-6 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-white tracking-tight drop-shadow-xs">
                Pembuatan Format Surat Resmi ULP
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40 text-[10px] font-bold">
                ULP BAGUALA
              </span>
            </div>
            <p className="text-xs text-teal-100/90 mt-1 max-w-2xl leading-relaxed">
              Modul pengisian template surat cuti, permintaan alat kerja (alker), monitoring checklist CMC petugas, panggilan kerja, serta permintaan material jaringan.
            </p>
          </div>
        </div>
        <div className="z-10">
          <button
            onClick={handleOpenNewModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-teal-400 to-emerald-400 hover:from-teal-300 hover:to-emerald-300 text-slate-950 rounded-xl font-black text-xs transition-all shadow-lg shadow-teal-950/40 border border-teal-200 cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4 text-slate-950" />
            <span>Buat Surat Baru</span>
          </button>
        </div>
      </div>

      {/* METRIC SUMMARY */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Total Surat</span>
          <span className="text-xl font-black text-slate-800 mt-1">{stats.total}</span>
        </div>
        <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-200 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-black uppercase text-emerald-600 tracking-wider">Surat Cuti</span>
          <span className="text-xl font-black text-emerald-700 mt-1">{stats.cuti}</span>
        </div>
        <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-200 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-black uppercase text-amber-600 tracking-wider">Request Alker</span>
          <span className="text-xl font-black text-amber-700 mt-1">{stats.alker}</span>
        </div>
        <div className="bg-purple-50/50 p-4 rounded-xl border border-purple-200 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-black uppercase text-purple-600 tracking-wider">CMC Petugas</span>
          <span className="text-xl font-black text-purple-700 mt-1">{stats.cmc}</span>
        </div>
        <div className="bg-rose-50/50 p-4 rounded-xl border border-rose-200 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-black uppercase text-rose-600 tracking-wider">Panggilan</span>
          <span className="text-xl font-black text-rose-700 mt-1">{stats.panggil}</span>
        </div>
        <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-200 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-black uppercase text-blue-600 tracking-wider">Minta Material</span>
          <span className="text-xl font-black text-blue-700 mt-1">{stats.mat}</span>
        </div>
      </div>

      {/* FILTER PANEL */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nomor, perihal, nama pegawai..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs w-full md:w-64 focus:outline-none focus:bg-white focus:border-blue-500"
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <button
            onClick={() => setSelectedTypeFilter('all')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
              selectedTypeFilter === 'all'
                ? 'bg-slate-800 text-white'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
            }`}
          >
            Semua
          </button>
          <button
            onClick={() => setSelectedTypeFilter('surat_cuti')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
              selectedTypeFilter === 'surat_cuti'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
            }`}
          >
            Cuti
          </button>
          <button
            onClick={() => setSelectedTypeFilter('permintaan_alker')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
              selectedTypeFilter === 'permintaan_alker'
                ? 'bg-amber-600 text-white'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
            }`}
          >
            Alker
          </button>
          <button
            onClick={() => setSelectedTypeFilter('cmc_petugas')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
              selectedTypeFilter === 'cmc_petugas'
                ? 'bg-purple-600 text-white'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
            }`}
          >
            CMC
          </button>
          <button
            onClick={() => setSelectedTypeFilter('surat_panggilan')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
              selectedTypeFilter === 'surat_panggilan'
                ? 'bg-rose-600 text-white'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
            }`}
          >
            Panggilan
          </button>
          <button
            onClick={() => setSelectedTypeFilter('permintaan_material')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
              selectedTypeFilter === 'permintaan_material'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
            }`}
          >
            Material
          </button>
        </div>
      </div>

      {/* MAIN LIST TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-8 text-center text-slate-500 text-xs">Memuat daftar surat...</div>
        ) : filteredSurat.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">Belum ada surat yang terdaftar atau cocok dengan pencarian Anda.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-500 font-extrabold uppercase tracking-wider">
                  <th className="p-3.5">Tanggal / No Surat</th>
                  <th className="p-3.5">Jenis</th>
                  <th className="p-3.5">Perihal & Kepada</th>
                  <th className="p-3.5">Detail Pegawai / Pekerjaan</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredSurat.map((surat) => (
                  <tr key={surat.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-3.5">
                      <div className="text-slate-800 font-bold">{formatDateIndo(surat.tanggalSurat)}</div>
                      <div className="text-slate-400 font-mono text-[10px] mt-0.5">{surat.nomorSurat}</div>
                    </td>
                    <td className="p-3.5">{getJenisSuratBadge(surat.jenisSurat)}</td>
                    <td className="p-3.5">
                      <div className="text-slate-800 font-bold max-w-xs truncate">{surat.perihal}</div>
                      <div className="text-slate-500 text-[11px] mt-0.5">Yth. {surat.kepada}</div>
                    </td>
                    <td className="p-3.5">
                      {surat.jenisSurat === 'surat_cuti' && (
                        <div>
                          <div className="text-slate-800 font-bold">{surat.payload.namaPegawai || '-'}</div>
                          <div className="text-[10px] text-slate-500">Jabatan: {surat.payload.jabatan || '-'}</div>
                        </div>
                      )}
                      {surat.jenisSurat === 'permintaan_alker' && (
                        <div>
                          <div className="text-slate-800 font-bold">{surat.payload.namaAlker || '-'}</div>
                          <div className="text-[10px] text-slate-500">Jumlah: {surat.payload.jumlahAlker || 1} Pcs</div>
                        </div>
                      )}
                      {surat.jenisSurat === 'cmc_petugas' && (
                        <div>
                          <div className="text-slate-800 font-bold">Tim {surat.payload.namaKetua || '-'}</div>
                          <div className="text-[10px] text-slate-500">Shift: {surat.payload.shiftPiket || '-'} / {surat.payload.penyulangTarget || '-'}</div>
                        </div>
                      )}
                      {surat.jenisSurat === 'surat_panggilan' && (
                        <div>
                          <div className="text-slate-800 font-bold">{surat.payload.namaDipanggil || '-'}</div>
                          <div className="text-[10px] text-slate-500">Agenda: {surat.payload.agendaPanggilan || '-'}</div>
                        </div>
                      )}
                      {surat.jenisSurat === 'permintaan_material' && (
                        <div>
                          <div className="text-slate-800 font-bold">{surat.payload.namaProyek || '-'}</div>
                          <div className="text-[10px] text-slate-500">Gudang: {surat.payload.gudangTujuan || '-'} ({surat.payload.listMaterial?.length || 0} Item)</div>
                        </div>
                      )}
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                        surat.status === 'Selesai' || surat.status === 'Disetujui'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : surat.status === 'Diajukan'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}>
                        {surat.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right space-x-1.5">
                      <button
                        onClick={() => setPrintItem(surat)}
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1 font-bold text-[10px]"
                        title="Pratinjau / Cetak"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        Pratinjau
                      </button>
                      <button
                        onClick={() => handleEdit(surat)}
                        className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors cursor-pointer inline-flex"
                        title="Edit Surat"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(surat.id)}
                        className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg transition-colors cursor-pointer inline-flex"
                        title="Hapus"
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
      </div>

      {/* DYNAMIC FORM MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                {editItem ? 'Edit Dokumen Surat Keluar' : 'Buat Format Surat Keluar Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSave} className="p-5 space-y-5 flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Jenis Surat */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Jenis Format Surat</label>
                  <select
                    disabled={!!editItem}
                    value={jenisSurat}
                    onChange={(e) => setJenisSurat(e.target.value as JenisSurat)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500 cursor-pointer disabled:opacity-60"
                  >
                    <option value="surat_cuti">Surat Cuti Pegawai</option>
                    <option value="permintaan_alker">Permintaan Alat Kerja (Alker)</option>
                    <option value="cmc_petugas">CMC Petugas (Checklist & Monitoring)</option>
                    <option value="surat_panggilan">Surat Panggilan Petugas</option>
                    <option value="permintaan_material">Surat Permintaan Material Jaringan</option>
                  </select>
                </div>

                {/* Nomor Surat */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Nomor Surat</label>
                  <input
                    type="text"
                    required
                    value={nomorSurat}
                    onChange={(e) => setNomorSurat(e.target.value)}
                    placeholder="Contoh: PLN/BGA/2026/045"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500"
                  />
                </div>

                {/* Tanggal Surat */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Tanggal Surat</label>
                  <input
                    type="date"
                    required
                    value={tanggalSurat}
                    onChange={(e) => setTanggalSurat(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500"
                  />
                </div>

                {/* Unit Pengirim */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Unit Pengirim / Instansi</label>
                  <input
                    type="text"
                    required
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500"
                  />
                </div>

                {/* Perihal */}
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Perihal</label>
                  <input
                    type="text"
                    required
                    value={perihal}
                    onChange={(e) => setPerihal(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500"
                  />
                </div>

                {/* Kepada */}
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Tujuan Surat (Kepada Yth.)</label>
                  <input
                    type="text"
                    required
                    value={kepada}
                    onChange={(e) => setKepada(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500"
                  />
                </div>
              </div>

              {/* DYNAMIC FORM CONTROLS ACCORDING TO JENIS SURAT */}
              <div className="border-t border-slate-100 pt-4 space-y-4">
                <span className="text-[11px] font-extrabold text-blue-700 uppercase tracking-wider block">Input Payload Konten Surat</span>

                {/* 1. SURAT CUTI PAYLOAD */}
                {jenisSurat === 'surat_cuti' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/50 p-4 rounded-xl border border-slate-200/60">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Nama Pegawai Cuti</label>
                      <input
                        type="text"
                        required
                        value={namaPegawai}
                        onChange={(e) => setNamaPegawai(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">NIP Pegawai</label>
                      <input
                        type="text"
                        required
                        value={nip}
                        onChange={(e) => setNip(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Jabatan / Unit Kerja</label>
                      <input
                        type="text"
                        required
                        value={jabatan}
                        onChange={(e) => setJabatan(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Pegawai Pengganti Sementara (Pihak Ke-2)</label>
                      <input
                        type="text"
                        required
                        value={pengganti}
                        onChange={(e) => setPengganti(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Mulai Cuti Dari Tanggal</label>
                      <input
                        type="date"
                        required
                        value={cutiDari}
                        onChange={(e) => setCutiDari(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Sampai Dengan Tanggal</label>
                      <input
                        type="date"
                        required
                        value={cutiSampai}
                        onChange={(e) => setCutiSampai(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Alasan Cuti</label>
                      <textarea
                        required
                        value={alasanCuti}
                        onChange={(e) => setAlasanCuti(e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Alamat Selama Menjalankan Cuti</label>
                      <input
                        type="text"
                        required
                        value={alamatCuti}
                        onChange={(e) => setAlamatCuti(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* 2. REQUEST ALKER PAYLOAD */}
                {jenisSurat === 'permintaan_alker' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/50 p-4 rounded-xl border border-slate-200/60">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Nama Alat Kerja / APD yang Diminta</label>
                      <input
                        type="text"
                        required
                        value={namaAlker}
                        onChange={(e) => setNamaAlker(e.target.value)}
                        placeholder="Contoh: Tangga Fiberglass, Stick 20kV, Helm K3"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Jumlah Volume (Qty)</label>
                      <input
                        type="number"
                        required
                        min={1}
                        value={jumlahAlker}
                        onChange={(e) => setJumlahAlker(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Tanggal Dibutuhkan</label>
                      <input
                        type="date"
                        required
                        value={tglDibutuhkan}
                        onChange={(e) => setTglDibutuhkan(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Justifikasi / Keperluan Alker</label>
                      <textarea
                        required
                        value={keperluanAlker}
                        onChange={(e) => setKeperluanAlker(e.target.value)}
                        rows={3}
                        placeholder="Alasan permohonan pengadaan baru atau peremajaan..."
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* 3. CMC PETUGAS PAYLOAD */}
                {jenisSurat === 'cmc_petugas' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/50 p-4 rounded-xl border border-slate-200/60">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Nama Pengawas / Ketua Tim</label>
                      <input
                        type="text"
                        required
                        value={namaKetua}
                        onChange={(e) => setNamaKetua(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Shift Piket / Penugasan</label>
                      <select
                        value={shiftPiket}
                        onChange={(e) => setShiftPiket(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none"
                      >
                        <option value="Pagi">Shift Pagi</option>
                        <option value="Siang">Shift Siang</option>
                        <option value="Malam">Shift Malam</option>
                        <option value="Emergency">Regu Cadangan / Emergency</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">No. Kendaraan Operasional</label>
                      <input
                        type="text"
                        required
                        value={noKendaraan}
                        onChange={(e) => setNoKendaraan(e.target.value)}
                        placeholder="Contoh: DB 1234 BGA / Mobil Yantek 01"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Penyulang Target Cleansing</label>
                      <input
                        type="text"
                        required
                        value={penyulangTarget}
                        onChange={(e) => setPenyulangTarget(e.target.value)}
                        placeholder="Contoh: Penyulang Bagua / Section GH Asten"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Anggota Tim Pelaksana (Pisahkan dengan Koma)</label>
                      <input
                        type="text"
                        required
                        value={anggotaTim}
                        onChange={(e) => setAnggotaTim(e.target.value)}
                        placeholder="Contoh: Ahmad, Budi, Charles, Doni"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Peralatan Khusus yang Dibawa</label>
                      <textarea
                        required
                        value={peralatanDibawa}
                        onChange={(e) => setPeralatanDibawa(e.target.value)}
                        rows={2}
                        placeholder="Alat detektor tegangan, harness safety, toolkit..."
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* 4. SURAT PANGGILAN PAYLOAD */}
                {jenisSurat === 'surat_panggilan' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/50 p-4 rounded-xl border border-slate-200/60">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Nama yang Dipanggil</label>
                      <input
                        type="text"
                        required
                        value={namaDipanggil}
                        onChange={(e) => setNamaDipanggil(e.target.value)}
                        placeholder="Nama koordinator pelaksana / mitra kerja"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Jabatan yang Dipanggil</label>
                      <input
                        type="text"
                        required
                        value={jabatanDipanggil}
                        onChange={(e) => setJabatanDipanggil(e.target.value)}
                        placeholder="Contoh: Koordinator Yantek / Pimpinan Vendor"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Hari & Tanggal Menghadap</label>
                      <input
                        type="text"
                        required
                        value={hariTanggalPanggilan}
                        onChange={(e) => setHariTanggalPanggilan(e.target.value)}
                        placeholder="Contoh: Senin, 17 Agustus 2026"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Waktu Panggilan</label>
                      <input
                        type="text"
                        required
                        value={waktuPanggilan}
                        onChange={(e) => setWaktuPanggilan(e.target.value)}
                        placeholder="Contoh: 10:00 WITA s.d Selesai"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Tempat Pertemuan</label>
                      <input
                        type="text"
                        required
                        value={tempatPanggilan}
                        onChange={(e) => setTempatPanggilan(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Agenda Pertemuan</label>
                      <textarea
                        required
                        value={agendaPanggilan}
                        onChange={(e) => setAgendaPanggilan(e.target.value)}
                        rows={3}
                        placeholder="Contoh: Koordinasi evaluasi SAIDI SAIFI Triwulan II dan kepatuhan SOP K3..."
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* 5. REQUEST MATERIAL PAYLOAD */}
                {jenisSurat === 'permintaan_material' && (
                  <div className="space-y-4 bg-slate-50/50 p-4 rounded-xl border border-slate-200/60">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Nama Proyek / Jenis Pekerjaan</label>
                        <input
                          type="text"
                          required
                          value={namaProyek}
                          onChange={(e) => setNamaProyek(e.target.value)}
                          placeholder="Pemasangan SKTM / Rekondisi Tiang Miring"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Lokasi Pekerjaan Jaringan</label>
                        <input
                          type="text"
                          required
                          value={lokasiPekerjaan}
                          onChange={(e) => setLokasiPekerjaan(e.target.value)}
                          placeholder="Section GH Asten - Gardu BGA02"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Gudang Tujuan Pengeluaran</label>
                        <input
                          type="text"
                          required
                          value={gudangTujuan}
                          onChange={(e) => setGudangTujuan(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Dynamic Material Sub-Form */}
                    <div className="border-t border-slate-200 pt-3 space-y-2">
                      <span className="text-[11px] font-bold text-slate-700 block">Daftar Material yang Diminta</span>
                      
                      {/* Form Adder row */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-end">
                        <div>
                          <label className="block text-[10px] text-slate-500">Nama Material</label>
                          <input
                            type="text"
                            value={newMatNama}
                            onChange={(e) => setNewMatNama(e.target.value)}
                            placeholder="Kabel AAAC, FCO, Arrester..."
                            className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-xs focus:outline-none"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] text-slate-500">Satuan</label>
                            <select
                              value={newMatSatuan}
                              onChange={(e) => setNewMatSatuan(e.target.value)}
                              className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-xs focus:outline-none"
                            >
                              <option value="Meter">Meter</option>
                              <option value="Pcs">Pcs</option>
                              <option value="Set">Set</option>
                              <option value="Kg">Kg</option>
                              <option value="Batang">Batang</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-500">Volume</label>
                            <input
                              type="number"
                              value={newMatVolume}
                              onChange={(e) => setNewMatVolume(Number(e.target.value))}
                              className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-xs focus:outline-none"
                            />
                          </div>
                        </div>
                        <div>
                          <button
                            type="button"
                            onClick={handleAddMaterial}
                            className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs font-bold transition-all cursor-pointer"
                          >
                            <PlusCircle className="w-4 h-4" />
                            Tambah
                          </button>
                        </div>
                      </div>

                      {/* Listing Dynamic Materials */}
                      {materialList.length === 0 ? (
                        <div className="text-center p-3 text-slate-400 text-[11px] bg-white border border-dashed border-slate-200 rounded">
                          Belum ada material yang ditambahkan. Gunakan kolom di atas.
                        </div>
                      ) : (
                        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100 max-h-36 overflow-y-auto">
                          {materialList.map((m, idx) => (
                            <div key={idx} className="p-2 flex items-center justify-between text-xs hover:bg-slate-50">
                              <span className="font-semibold text-slate-800">{idx + 1}. {m.nama}</span>
                              <div className="flex items-center gap-3">
                                <span className="font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">
                                  {m.volume} {m.satuan}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveMaterial(idx)}
                                  className="text-rose-500 hover:text-rose-700 transition-colors p-1"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* General inputs: Status, Pembuat, Catatan */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Pembuat Dokumen / Penandatangan</label>
                  <input
                    type="text"
                    required
                    value={pembuat}
                    onChange={(e) => setPembuat(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Status Dokumen</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as SuratItem['status'])}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500 cursor-pointer"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Diajukan">Diajukan</option>
                    <option value="Disetujui">Disetujui</option>
                    <option value="Selesai">Selesai</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Catatan Tambahan (Internal)</label>
                  <input
                    type="text"
                    value={catatan}
                    onChange={(e) => setCatatan(e.target.value)}
                    placeholder="Contoh: Sudah disinkronisasikan ke tim lapangan"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs transition-colors shadow-sm cursor-pointer"
                >
                  Simpan Dokumen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAILED PRINT PREVIEW SCREEN (PLN KOP SURAT ATMOSPHERE) */}
      {printItem && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-start justify-center z-50 p-4 overflow-y-auto print:absolute print:inset-0 print:bg-white print:p-0">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl border border-slate-300 my-4 flex flex-col print:border-0 print:shadow-none print:my-0">
            {/* Header controls (HIDDEN IN PRINT) */}
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50 print:hidden rounded-t-2xl">
              <span className="font-extrabold text-xs text-slate-700">Format Preview Cetak Resmi</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs transition-all shadow-sm cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Cetak (Browser)
                </button>
                <button
                  onClick={() => setPrintItem(null)}
                  className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Official Corporate Paper Sheet Layout */}
            <div className="p-12 text-slate-900 leading-relaxed font-sans max-w-[21cm] mx-auto print:p-0 print:max-w-none">
              
              {/* PLN KOP SURAT HEADER */}
              <div className="flex items-start justify-between border-b-2 border-double border-slate-800 pb-3 mb-6">
                <div>
                  <h1 className="text-sm font-extrabold text-blue-800 leading-none">PT PLN (PERSERO)</h1>
                  <h2 className="text-xs font-black text-slate-800 leading-none mt-1">UIW MALUKU & MALUKU UTARA — UP3 AMBON</h2>
                  <h3 className="text-[11px] font-bold text-slate-700 leading-none mt-0.5">UNIT LAYANAN PELANGGAN (ULP) BAGUALA</h3>
                  <p className="text-[9px] text-slate-400 mt-1 leading-normal font-mono">
                    Jl. Trans Sulawesi No. 12 Bagua, Manado | Telp: 0431-123456 | Email: ulp.bagua@pln.co.id
                  </p>
                </div>
                <div className="text-right">
                  {/* Decorative PLN Logo Placeholder */}
                  <div className="bg-amber-400 text-slate-900 text-[10px] font-black px-2.5 py-1.5 tracking-widest rounded shadow-xs inline-block">
                    PLN
                  </div>
                </div>
              </div>

              {/* LETTER HEAD INFO */}
              <div className="grid grid-cols-2 text-xs mb-6">
                <div className="space-y-1">
                  <div><span className="font-bold inline-block w-20">Nomor</span>: {printItem.nomorSurat}</div>
                  <div><span className="font-bold inline-block w-20">Lampiran</span>: - (Satu Berkas)</div>
                  <div><span className="font-bold inline-block w-20">Perihal</span>: <span className="font-semibold underline">{printItem.perihal}</span></div>
                </div>
                <div className="text-right space-y-1">
                  <div>Bagua, {formatDateIndo(printItem.tanggalSurat)}</div>
                  <div className="font-bold text-slate-500">Sifat: Penting / Resmi</div>
                </div>
              </div>

              {/* RECIPIENT */}
              <div className="text-xs mb-6 space-y-1">
                <div>Kepada Yth.</div>
                <div className="font-bold text-slate-800">{printItem.kepada}</div>
                <div>PT PLN (Persero) ULP Bagua</div>
                <div>Di Tempat</div>
              </div>

              {/* BODY CONTENT - CONDITIONALLY RENDERED BY JENIS SURAT */}
              <div className="text-xs space-y-4 text-justify min-h-[400px]">
                
                {/* 1. SURAT CUTI BODY */}
                {printItem.jenisSurat === 'surat_cuti' && (
                  <>
                    <p>Dengan hormat,</p>
                    <p>
                      Yang bertanda tangan di bawah ini menerangkan permohonan pengajuan cuti resmi bagi pegawai PT PLN (Persero) ULP Bagua dengan rincian identitas sebagai berikut:
                    </p>
                    <div className="pl-6 space-y-1.5 my-3">
                      <div><span className="inline-block w-36">Nama Pegawai</span>: <strong>{printItem.payload.namaPegawai}</strong></div>
                      <div><span className="inline-block w-36">NIP</span>: {printItem.payload.nip}</div>
                      <div><span className="inline-block w-36">Jabatan</span>: {printItem.payload.jabatan}</div>
                      <div><span className="inline-block w-36">Unit Kerja</span>: {printItem.unit}</div>
                    </div>
                    <p>
                      Mengajukan izin cuti tahunan terhitung mulai tanggal <strong>{formatDateIndo(printItem.payload.cutiDari)}</strong> sampai dengan tanggal <strong>{formatDateIndo(printItem.payload.cutiSampai)}</strong> karena alasan: <em>{printItem.payload.alasanCuti}</em>.
                    </p>
                    <p>
                      Selama menjalankan cuti, alamat domisili sementara pegawai berada di <strong>{printItem.payload.alamatCuti}</strong>. Seluruh tanggung jawab operasional dan koordinasi pekerjaan kedinasan harian sementara waktu akan dialihkan sepenuhnya kepada:
                    </p>
                    <div className="pl-6 space-y-1.5 my-3">
                      <div><span className="inline-block w-36">Nama Pengganti (Pjs)</span>: <strong>{printItem.payload.pengganti}</strong></div>
                      <div><span className="inline-block w-36">Unit Tugas</span>: Teknik & Distribusi ULP Bagua</div>
                    </div>
                    <p>
                      Demikian surat permohonan cuti ini diajukan dengan sebenar-benarnya untuk mendapatkan persetujuan dari pihak Manajemen Sektor/Manajer SDM PLN Area. Atas perhatian dan kerjasamanya kami ucapkan terima kasih.
                    </p>
                  </>
                )}

                {/* 2. PERMINTAAN ALKER BODY */}
                {printItem.jenisSurat === 'permintaan_alker' && (
                  <>
                    <p>Dengan hormat,</p>
                    <p>
                      Sehubungan dengan upaya peningkatan kepatuhan aspek Keselamatan dan Kesehatan Kerja (K3) serta keandalan pelaksanaan pelayanan teknik (Yantek) di lapangan, dengan ini kami mengajukan permohonan pengadaan / peremajaan Alat Kerja (Alker) dan Alat Pelindung Diri (APD) sebagai berikut:
                    </p>
                    <div className="pl-6 space-y-1.5 my-3">
                      <div><span className="inline-block w-36">Nama Barang / Alker</span>: <strong>{printItem.payload.namaAlker}</strong></div>
                      <div><span className="inline-block w-36">Jumlah Permintaan</span>: <strong>{printItem.payload.jumlahAlker} Unit / Pcs</strong></div>
                      <div><span className="inline-block w-36">Tanggal Dibutuhkan</span>: {formatDateIndo(printItem.payload.tglDibutuhkan)}</div>
                    </div>
                    <p>
                      <strong>Keterangan / Justifikasi Teknis:</strong><br />
                      {printItem.payload.keperluanAlker || 'Permohonan penggantian dikarenakan kondisi alat kerja lama sudah mengalami penyusutan fisik / rusak guna menjamin keselamatan tim yantek saat melakukan manuver jaringan.'}
                    </p>
                    <p>
                      Alat kerja tersebut sangat mendesak diperlukan guna meminimalkan durasi perbaikan gangguan trip penyulang serta mempercepat pemulihan pemadaman aliran listrik pelanggan di wilayah kerja ULP Bagua.
                    </p>
                    <p>
                      Demikian surat permintaan alker ini diajukan untuk mendapatkan tindak lanjut pengadaan dari unit pengelola logistik/keuangan. Atas dukungan serta tindak lanjutnya, kami ucapkan terima kasih.
                    </p>
                  </>
                )}

                {/* 3. CMC PETUGAS BODY */}
                {printItem.jenisSurat === 'cmc_petugas' && (
                  <>
                    <p>Dengan hormat,</p>
                    <p>
                      Berdasarkan program Checklist Monitoring & Cleansing (CMC) Petugas Teknik Lapangan ULP Bagua, dengan ini diterbitkan dokumen instruksi pengawasan kelayakan keselamatan kerja tim yantek sebagai berikut:
                    </p>
                    <div className="pl-6 space-y-1.5 my-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div><span className="inline-block w-32 font-semibold">Ketua Regu / Tim</span>: {printItem.payload.namaKetua}</div>
                      <div><span className="inline-block w-32 font-semibold">Shift Piket</span>: {printItem.payload.shiftPiket}</div>
                      <div><span className="inline-block w-32 font-semibold">No. Kendaraan</span>: {printItem.payload.noKendaraan}</div>
                      <div><span className="inline-block w-32 font-semibold font-mono">Penyulang Target</span>: {printItem.payload.penyulangTarget}</div>
                    </div>
                    <div className="my-4">
                      <strong className="text-slate-800">Daftar Anggota Tim Pelaksana:</strong>
                      <p className="p-2 bg-slate-50 border border-slate-200 rounded mt-1 font-mono text-[11px] text-slate-700">
                        {printItem.payload.anggotaTim || '-'}
                      </p>
                    </div>
                    <p>
                      <strong>Peralatan Utama & APD K3 yang Wajib Dibawa:</strong><br />
                      {printItem.payload.peralatanDibawa || 'Stick 20kV, Grounding lokal set, helm pengaman, sarung tangan isolasi tegangan, sepatu boots isolasi, full body harness.'}
                    </p>
                    <p>
                      <strong>Instruksi Penting:</strong> Seluruh personil wajib melakukan pengisian checklist pengawasan mandiri sebelum menaiki tiang / jaringan SUTM, memastikan kondisi tegangan nol pada lokasi manuver cleansing, serta dilarang keras melakukan bypass SOP K3 demi mempercepat penanganan gangguan.
                    </p>
                    <p>
                      Demikian lembar monitoring CMC Petugas Teknik ini disusun sebagai dasar penugasan dan pengawasan keselamatan di lapangan.
                    </p>
                  </>
                )}

                {/* 4. SURAT PANGGILAN BODY */}
                {printItem.jenisSurat === 'surat_panggilan' && (
                  <>
                    <p>Dengan hormat,</p>
                    <p>
                      Sehubungan dengan diadakannya evaluasi rutin terhadap indikator keandalan jaringan distribusi (SAIDI/SAIFI) serta kepatuhan Standar Operasional Prosedur (SOP) pengerjaan pemeliharaan di lingkungan PT PLN (Persero) ULP Bagua, dengan ini mengharap kehadiran Saudara pada pertemuan tatap muka yang dijadwalkan sebagai berikut:
                    </p>
                    <div className="pl-6 space-y-1.5 my-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <div><span className="inline-block w-36 font-semibold">Nama Dipanggil</span>: <strong>{printItem.payload.namaDipanggil}</strong></div>
                      <div><span className="inline-block w-36 font-semibold">Jabatan / Afiliasi</span>: {printItem.payload.jabatanDipanggil}</div>
                      <div><span className="inline-block w-36 font-semibold">Hari, Tanggal</span>: {printItem.payload.hariTanggalPanggilan}</div>
                      <div><span className="inline-block w-36 font-semibold">Waktu</span>: {printItem.payload.waktuPanggilan} WITA</div>
                      <div><span className="inline-block w-36 font-semibold">Tempat</span>: {printItem.payload.tempatPanggilan}</div>
                      <div><span className="inline-block w-36 font-semibold">Agenda Evaluasi</span>: <strong>{printItem.payload.agendaPanggilan}</strong></div>
                    </div>
                    <p>
                      Mengingat pentingnya agenda koordinasi pembinaan kinerja ini untuk menunjang pencapaian KPI keandalan sistem jaringan distribusi listrik ULP, kehadiran Saudara bersifat wajib dan tidak dapat diwakilkan.
                    </p>
                    <p>
                      Demikian surat panggilan ini disampaikan, atas perhatian dan kehadiran tepat waktu Saudara kami ucapkan terima kasih.
                    </p>
                  </>
                )}

                {/* 5. REQUEST MATERIAL BODY */}
                {printItem.jenisSurat === 'permintaan_material' && (
                  <>
                    <p>Dengan hormat,</p>
                    <p>
                      Guna menunjang penyelesaian pekerjaan pemeliharaan preventif, perbaikan kerusakan aset jaringan distribusi 20kV, dan percepatan recovery gangguan sistem kelistrikan, dengan ini diajukan daftar kebutuhan material (Bon Material) untuk proyek sebagai berikut:
                    </p>
                    <div className="pl-6 space-y-1.5 my-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div><span className="inline-block w-32 font-semibold">Nama Pekerjaan</span>: {printItem.payload.namaProyek}</div>
                      <div><span className="inline-block w-32 font-semibold">Lokasi Pekerjaan</span>: {printItem.payload.lokasiPekerjaan}</div>
                      <div><span className="inline-block w-32 font-semibold font-mono text-blue-800">Gudang Pengambilan</span>: {printItem.payload.gudangTujuan}</div>
                    </div>
                    
                    <div className="my-4">
                      <strong className="text-slate-800 block mb-2 text-xs">Rincian Material Jaringan yang Dibutuhkan:</strong>
                      <table className="w-full text-xs text-left border border-slate-300 border-collapse">
                        <thead>
                          <tr className="bg-slate-100 border-b border-slate-300 font-bold text-slate-800">
                            <th className="p-2 border-r border-slate-300 w-12 text-center">No</th>
                            <th className="p-2 border-r border-slate-300">Deskripsi / Nama Material</th>
                            <th className="p-2 border-r border-slate-300 w-24 text-center">Volume</th>
                            <th className="p-2 w-24 text-center">Satuan</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {printItem.payload.listMaterial && printItem.payload.listMaterial.length > 0 ? (
                            printItem.payload.listMaterial.map((m, idx) => (
                              <tr key={idx} className="hover:bg-slate-50">
                                <td className="p-2 border-r border-slate-300 text-center">{idx + 1}</td>
                                <td className="p-2 border-r border-slate-300 font-semibold">{m.nama}</td>
                                <td className="p-2 border-r border-slate-300 text-center font-mono font-bold">{m.volume}</td>
                                <td className="p-2 text-center">{m.satuan}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={4} className="p-3 text-center text-slate-400">Tidak ada material terdaftar.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                    <p>
                      Seluruh pengeluaran material di atas akan dialokasikan dan dicatat secara akurat pada buku log inventarisasi material ULP Bagua guna mencegah terjadinya selisih stok fisik gudang.
                    </p>
                    <p>
                      Demikian surat bon permintaan pengeluaran material ini diajukan untuk mendapatkan persetujuan pengeluaran logistik. Terima kasih.
                    </p>
                  </>
                )}

              </div>

              {/* CORPORATE SIGNATURE BLOCK */}
              <div className="mt-12 grid grid-cols-2 text-xs gap-6 text-center">
                <div className="space-y-16">
                  <div>
                    <span className="block text-slate-500">Penerima Tugas / Pemohon,</span>
                  </div>
                  <div>
                    <strong className="block text-slate-800 underline">
                      {printItem.jenisSurat === 'surat_cuti' ? printItem.payload.namaPegawai : (printItem.jenisSurat === 'cmc_petugas' ? printItem.payload.namaKetua : 'Mitra Pelaksana')}
                    </strong>
                    <span className="block text-[10px] text-slate-400 font-mono">PT PLN (Persero) ULP Bagua</span>
                  </div>
                </div>

                <div className="space-y-16">
                  <div>
                    <span className="block text-slate-500">Meyetujui,</span>
                    <strong className="text-slate-800">Manajer PT PLN (Persero) ULP Bagua</strong>
                  </div>
                  <div>
                    <strong className="block text-slate-800 underline">{printItem.pembuat}</strong>
                    <span className="block text-[10px] text-slate-400 font-mono">NIP. 8912345XYZ / MANAGER</span>
                  </div>
                </div>
              </div>

              {/* FOOTER NOTICE (HIDDEN IN PRINT) */}
              <div className="mt-12 pt-4 border-t border-slate-200 text-slate-400 text-[10px] text-center font-mono print:hidden">
                Dokumen ini digenerate secara otomatis oleh Sistem Perang Padam ULP Bagua dan sah secara hukum.
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};
