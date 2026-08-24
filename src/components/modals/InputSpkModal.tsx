import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  FileText, 
  Calendar, 
  Users, 
  Target, 
  Layers, 
  Wrench, 
  Trees, 
  Search, 
  MessageSquare, 
  Send,
  CheckCircle2,
  Clock,
  Printer,
  Sparkles,
  UserCheck,
  Hash,
  User,
  Plus,
  Trash2,
  UserPlus
} from 'lucide-react';
import { PerintahKerja, Penyulang, SectionJaringan, PetugasSpkDetail, PetugasMasterItem, User as UserType, MasterUnitPLN } from '../../types';
import { INITIAL_MASTER_PETUGAS } from '../../data/mockData';
import { sendSpkToWhatsApp } from '../../utils/whatsappNotifier';
import { PLN_LOGO_BASE64 } from '../../utils/plnLogo';
import { DigitalSignaturePad } from '../common/DigitalSignaturePad';
import { getUnitDetails } from '../../utils/unitConfig';

interface InputSpkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (spk: PerintahKerja) => void;
  penyulangList: Penyulang[];
  sectionList: SectionJaringan[];
  editItem?: PerintahKerja | null;
  spkList?: PerintahKerja[];
  currentUser?: UserType | null;
  masterUnitList?: MasterUnitPLN[];
}

export const InputSpkModal: React.FC<InputSpkModalProps> = ({
  isOpen,
  onClose,
  onSave,
  penyulangList,
  sectionList,
  editItem,
  spkList = [],
  currentUser,
  masterUnitList
}) => {
  const unitInfo = useMemo(() => getUnitDetails(editItem?.unit || currentUser?.unit || 'ULP Baguala', masterUnitList), [editItem, currentUser, masterUnitList]);
  const todayStr = new Date().toISOString().split('T')[0];

  // Auto sequence calculation
  const generateSequentialSpkNo = (dateStr: string, list: PerintahKerja[] = []) => {
    const dateObj = new Date(dateStr);
    const yyyy = isNaN(dateObj.getFullYear()) ? 2026 : dateObj.getFullYear();
    const mm = String(isNaN(dateObj.getMonth()) ? 8 : dateObj.getMonth() + 1).padStart(2, '0');

    const prefix = `${unitInfo.spkPrefix}/${yyyy}/${mm}/`;
    let maxSeq = 0;

    list.forEach((item) => {
      if (item.noSpk) {
        if (item.noSpk.startsWith(prefix)) {
          const parts = item.noSpk.split('/');
          const seqStr = parts[parts.length - 1];
          const seq = parseInt(seqStr, 10);
          if (!isNaN(seq) && seq > maxSeq) {
            maxSeq = seq;
          }
        } else if (item.noSpk.includes('/')) {
          const parts = item.noSpk.split('/');
          const seqStr = parts[parts.length - 1];
          const seq = parseInt(seqStr, 10);
          if (!isNaN(seq) && seq < 950 && seq > maxSeq) {
            maxSeq = seq;
          }
        }
      }
    });

    const nextSeq = maxSeq + 1;
    const paddedSeq = String(nextSeq).padStart(3, '0');
    return `${prefix}${paddedSeq}`;
  };

  const [noSpk, setNoSpk] = useState('');
  const [tanggal, setTanggal] = useState(todayStr);
  const [jenisPekerjaan, setJenisPekerjaan] = useState<'ROW' | 'Inspeksi' | 'Pemeliharaan'>('ROW');
  const [penyulangId, setPenyulangId] = useState(penyulangList[0]?.id || '');
  const [namaPenyulang, setNamaPenyulang] = useState(penyulangList[0]?.namaPenyulang || '');
  const [section, setSection] = useState('');
  const [target, setTarget] = useState('');
  const [jumlahPersonil, setJumlahPersonil] = useState(4);
  const [status, setStatus] = useState<'Terencana' | 'Dalam Proses' | 'Selesai' | 'Dibatalkan'>('Terencana');
  const [timAtauPetugas, setTimAtauPetugas] = useState(unitInfo.timYantek);
  const [namaManager, setNamaManager] = useState('DWI SURYA PERMANA');
  const [isApproved, setIsApproved] = useState(true);
  const [tandaTanganManager, setTandaTanganManager] = useState<string | null>(null);
  const [catatan, setCatatan] = useState('');
  const [sendWaNotification, setSendWaNotification] = useState(true);
  const [targetPhone, setTargetPhone] = useState('');
  
  // Dynamic Petugas List State
  const [petugasList, setPetugasList] = useState<PetugasSpkDetail[]>([
    { id: '1', nama: 'Ahmad Rivai', jabatan: 'Team Leader Yantek' },
    { id: '2', nama: 'Markus Pattipeilohy', jabatan: 'Anggota Yantek 20kV' },
    { id: '3', nama: 'Doni Latuconsina', jabatan: 'Petugas Groundman & APD' },
    { id: '4', nama: 'Eko Prasetyo', jabatan: 'Driver Operasional 20kV' }
  ]);
  const [selectedMasterPetugasId, setSelectedMasterPetugasId] = useState('');

  useEffect(() => {
    if (editItem) {
      setNoSpk(editItem.noSpk || generateSequentialSpkNo(editItem.tanggal || todayStr, spkList));
      setTanggal(editItem.tanggal || todayStr);
      setJenisPekerjaan(editItem.jenisPekerjaan || 'ROW');
      setNamaPenyulang(editItem.namaPenyulang || penyulangList[0]?.namaPenyulang || '');
      const foundPenyulang = penyulangList.find((p) => p.namaPenyulang === editItem.namaPenyulang);
      setPenyulangId(foundPenyulang?.id || editItem.penyulangId || penyulangList[0]?.id || '');
      setSection(editItem.section || '');
      setTarget(editItem.target || '');
      setJumlahPersonil(editItem.jumlahPersonil || 4);
      setStatus(editItem.status || 'Terencana');
      setTimAtauPetugas(editItem.timAtauPetugas || 'Tim Yantek ULP Baguala');
      
      if (editItem.petugasList && editItem.petugasList.length > 0) {
        setPetugasList(editItem.petugasList);
      } else if (editItem.daftarPetugas) {
        const parsed = editItem.daftarPetugas.split('\n').filter(Boolean).map((line, idx) => {
          const cleanName = line.replace(/^[0-9.]+\s*/, '');
          return { id: `p_${idx}`, nama: cleanName, jabatan: 'Petugas Pelaksana' };
        });
        setPetugasList(parsed);
      } else {
        setPetugasList([
          { id: '1', nama: 'Ahmad Rivai', jabatan: 'Team Leader Yantek' },
          { id: '2', nama: 'Markus Pattipeilohy', jabatan: 'Anggota Yantek 20kV' }
        ]);
      }

      setNamaManager(editItem.namaManager || 'DWI SURYA PERMANA');
      setIsApproved(editItem.isApproved ?? true);
      setTandaTanganManager(editItem.tandaTanganManager || null);
      setCatatan(editItem.catatan || '');
      setSendWaNotification(false);
    } else {
      const autoNo = generateSequentialSpkNo(todayStr, spkList);
      setNoSpk(autoNo);
      setTanggal(todayStr);
      setJenisPekerjaan('ROW');
      if (penyulangList.length > 0) {
        setPenyulangId(penyulangList[0].id);
        setNamaPenyulang(penyulangList[0].namaPenyulang);
      }
      setSection('');
      setTarget('');
      setJumlahPersonil(4);
      setStatus('Terencana');
      setTimAtauPetugas('Tim Yantek ULP Baguala');
      setTandaTanganManager(null);
      setPetugasList([
        { id: '1', nama: 'Ahmad Rivai', jabatan: 'Team Leader Yantek' },
        { id: '2', nama: 'Markus Pattipeilohy', jabatan: 'Anggota Yantek 20kV' },
        { id: '3', nama: 'Doni Latuconsina', jabatan: 'Petugas Groundman & APD' },
        { id: '4', nama: 'Eko Prasetyo', jabatan: 'Driver Operasional 20kV' }
      ]);
      setNamaManager('DWI SURYA PERMANA');
      setIsApproved(true);
      setCatatan('Wajib gunakan APD Lengkap (Helm, Sepatu, Sarung Tangan 20kV, Body Harness) & Bebas Tegangan');
      setSendWaNotification(true);
    }
  }, [editItem, isOpen]);

  // Handle Petugas List Handlers
  const handleAddPetugas = () => {
    const newPet: PetugasSpkDetail = {
      id: `p_${Date.now()}`,
      nama: '',
      jabatan: 'Petugas Lapangan'
    };
    const updated = [...petugasList, newPet];
    setPetugasList(updated);
    setJumlahPersonil(updated.length);
  };

  const handleAddFromMaster = () => {
    if (!selectedMasterPetugasId) return;
    const masterPet = INITIAL_MASTER_PETUGAS.find(p => p.id === selectedMasterPetugasId);
    if (masterPet) {
      // check if already added
      if (petugasList.some(p => (p.nama || '').toLowerCase() === (masterPet.nama || '').toLowerCase())) {
        alert(`${masterPet.nama} sudah ada dalam daftar petugas!`);
        return;
      }
      const updated = [...petugasList, { id: masterPet.id, nama: masterPet.nama, jabatan: masterPet.jabatan }];
      setPetugasList(updated);
      setJumlahPersonil(updated.length);
      setSelectedMasterPetugasId('');
    }
  };

  const handleUpdatePetugas = (index: number, field: 'nama' | 'jabatan', value: string) => {
    const updated = [...petugasList];
    updated[index] = { ...updated[index], [field]: value };
    setPetugasList(updated);
  };

  const handleDeletePetugas = (index: number) => {
    if (petugasList.length <= 1) {
      alert('Minimal harus ada 1 petugas pelaksana!');
      return;
    }
    const updated = petugasList.filter((_, i) => i !== index);
    setPetugasList(updated);
    setJumlahPersonil(updated.length);
  };

  // Handle Date change and re-calculate SPK number if not editing
  const handleDateChange = (newDate: string) => {
    setTanggal(newDate);
    if (!editItem) {
      setNoSpk(generateSequentialSpkNo(newDate, spkList));
    }
  };

  const handlePenyulangChange = (id: string) => {
    setPenyulangId(id);
    const found = penyulangList.find((p) => p.id === id);
    if (found) {
      setNamaPenyulang(found.namaPenyulang);
    }
  };

  const selectedPenyulang = penyulangList.find((p) => p.id === penyulangId || p.namaPenyulang === namaPenyulang);
  const filteredSections = useMemo(() => {
    const currentGi = selectedPenyulang?.namaGi?.toLowerCase().trim();
    // Direct sections
    const direct = sectionList.filter(
      (s) =>
        s.penyulangId === penyulangId ||
        (s.namaPenyulang &&
          selectedPenyulang?.namaPenyulang &&
          s.namaPenyulang.toLowerCase().trim() === selectedPenyulang.namaPenyulang.toLowerCase().trim())
    );

    // Branch options
    const branches = penyulangList
      .filter((p) => {
        if (p.id === penyulangId) return false;
        const isBranch = p.status === 'Percabangan';
        const sameGi = currentGi && p.namaGi?.toLowerCase().trim() === currentGi;
        return sameGi || isBranch;
      })
      .map((p) => ({
        id: `branch_${p.id}`,
        penyulangId: p.id,
        namaPenyulang: p.namaPenyulang,
        namaSection: `Percabangan ${p.namaPenyulang} (${p.namaGi})`,
        jumlahPelanggan: p.jumlahPelanggan || 0
      }));

    // Branch sections
    const branchSecs = sectionList.filter((s) => {
      if (s.penyulangId === penyulangId) return false;
      const sP = penyulangList.find((p) => p.id === s.penyulangId || p.namaPenyulang === s.namaPenyulang);
      return sP && currentGi && sP.namaGi?.toLowerCase().trim() === currentGi;
    });

    return [...direct, ...branches, ...branchSecs];
  }, [sectionList, penyulangList, penyulangId, namaPenyulang, selectedPenyulang]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!noSpk.trim() || !namaPenyulang || !section.trim() || !target.trim()) {
      alert('Mohon lengkapi No. SPK, Penyulang, Section, dan Target Pekerjaan.');
      return;
    }

    const compiledDaftarStr = petugasList
      .filter(p => p.nama.trim())
      .map((p, idx) => `${idx + 1}. ${p.nama.trim()} - ${p.jabatan.trim()}`)
      .join('\n');

    const spkData: PerintahKerja = {
      id: editItem ? editItem.id : `spk_${Date.now()}`,
      noSpk: noSpk.trim(),
      tanggal,
      jenisPekerjaan,
      penyulangId,
      namaPenyulang,
      section: section.trim(),
      target: target.trim(),
      jumlahPersonil: petugasList.length,
      status,
      timAtauPetugas: timAtauPetugas.trim(),
      daftarPetugas: compiledDaftarStr,
      petugasList: petugasList.filter(p => p.nama.trim()),
      namaManager: namaManager.trim() || 'DWI SURYA PERMANA',
      isApproved,
      ...(isApproved ? { approvalDate: new Date().toISOString() } : {}),
      ...(tandaTanganManager ? { tandaTanganManager } : {}),
      catatan: catatan.trim(),
      createdAt: editItem?.createdAt || new Date().toISOString()
    };

    if (sendWaNotification) {
      sendSpkToWhatsApp(spkData, targetPhone);
    }

    onSave(spkData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 md:p-6 z-50 font-sans">
      <div className="bg-white rounded-2xl shadow-2xl max-w-7xl w-full max-h-[94vh] flex flex-col overflow-hidden border border-slate-200">
        
        {/* Modal Top Navigation Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-xl text-white shadow-sm">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold flex items-center gap-2">
                <span>{editItem ? 'Edit Surat Perintah Kerja (SPK)' : 'Penerbitan Surat Perintah Kerja (SPK) Baru'}</span>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-500/30 text-blue-300 border border-blue-400/30 rounded-md uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-300" /> Live Paper Preview
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Lengkapi formulir di sisi kiri, lembar pratinjau dokumen A4 di sisi kanan akan terbarui secara otomatis.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Main Body - Split 2 Columns */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-slate-100">
          
          {/* LEFT COLUMN: Input Form Controls */}
          <div className="w-full lg:w-1/2 p-5 bg-white overflow-y-auto border-r border-slate-200 space-y-4">
            <form id="spk-form" onSubmit={handleSubmit} className="space-y-4 text-xs">
              
              {/* Nomor SPK & Tanggal */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700 flex items-center gap-1">
                      <Hash className="w-3.5 h-3.5 text-blue-600" /> No. SPK (Otomatis)
                    </label>
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                      No. Urut
                    </span>
                  </div>
                  <input
                    type="text"
                    value={noSpk}
                    onChange={(e) => setNoSpk(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    <Calendar className="w-3.5 h-3.5 text-blue-600 inline mr-1" /> Tanggal Pelaksanaan
                  </label>
                  <input
                    type="date"
                    value={tanggal}
                    onChange={(e) => handleDateChange(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Jenis Pekerjaan */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Jenis Pekerjaan 20kV</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setJenisPekerjaan('ROW')}
                    className={`py-2 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      jenisPekerjaan === 'ROW'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Trees className="w-3.5 h-3.5" /> ROW / Pohon
                  </button>

                  <button
                    type="button"
                    onClick={() => setJenisPekerjaan('Inspeksi')}
                    className={`py-2 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      jenisPekerjaan === 'Inspeksi'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Search className="w-3.5 h-3.5" /> Inspeksi
                  </button>

                  <button
                    type="button"
                    onClick={() => setJenisPekerjaan('Pemeliharaan')}
                    className={`py-2 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      jenisPekerjaan === 'Pemeliharaan'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Wrench className="w-3.5 h-3.5" /> Pemeliharaan
                  </button>
                </div>
              </div>

              {/* Penyulang & Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    <Layers className="w-3.5 h-3.5 text-blue-600 inline mr-1" /> Penyulang Target
                  </label>
                  <select
                    value={penyulangId}
                    onChange={(e) => handlePenyulangChange(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {penyulangList.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.namaPenyulang} ({p.namaGi})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Section / Lokasi SUTM</label>
                  <input
                    type="text"
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    placeholder="e.g. Section Passo Leteri / Tiang 45-60"
                    required
                    list="section-options"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <datalist id="section-options">
                    {filteredSections.map((s) => (
                      <option key={s.id} value={s.namaSection} />
                    ))}
                  </datalist>
                </div>
              </div>

              {/* Target Pekerjaan */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  <Target className="w-3.5 h-3.5 text-blue-600 inline mr-1" /> Target Rinci Pekerjaan
                </label>
                <input
                  type="text"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  placeholder="e.g. Pemangkasan 12 Pohon Kritis / Penggantian Arrester Rusak"
                  required
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Jumlah Personil & Tim / Vendor */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    <Users className="w-3.5 h-3.5 text-blue-600 inline mr-1" /> Jml Personil
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={jumlahPersonil}
                    onChange={(e) => setJumlahPersonil(Number(e.target.value))}
                    required
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Tim / Regu Pelaksana</label>
                  <input
                    type="text"
                    value={timAtauPetugas}
                    onChange={(e) => setTimAtauPetugas(e.target.value)}
                    placeholder="e.g. Tim Yantek ULP Baguala / Vendor Mitra"
                    required
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Daftar Nama Petugas Pelaksana dengan Tabel Interaktif & Master Data */}
              <div className="space-y-2 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-emerald-600" /> Daftar Petugas Pelaksana Lapangan ({petugasList.length} Orang)
                  </label>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleAddPetugas}
                      className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] rounded-lg flex items-center gap-1 shadow-xs cursor-pointer transition-all"
                    >
                      <Plus className="w-3 h-3" /> Tambah Baris
                    </button>
                  </div>
                </div>

                {/* Master Petugas Quick Selector */}
                <div className="flex items-center gap-2 pt-1">
                  <select
                    value={selectedMasterPetugasId}
                    onChange={(e) => setSelectedMasterPetugasId(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">-- Ambil dari Master Data Petugas --</option>
                    {INITIAL_MASTER_PETUGAS.map(mp => (
                      <option key={mp.id} value={mp.id}>
                        {mp.nama} ({mp.jabatan})
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleAddFromMaster}
                    disabled={!selectedMasterPetugasId}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold text-xs rounded-lg flex items-center gap-1 cursor-pointer transition-all shrink-0"
                  >
                    <UserPlus className="w-3.5 h-3.5" /> Pilih
                  </button>
                </div>

                {/* Petugas Table Rows */}
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white mt-2">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 font-bold">
                        <th className="p-2 w-8 text-center">No</th>
                        <th className="p-2">Nama Petugas</th>
                        <th className="p-2">Jabatan / Peran</th>
                        <th className="p-2 w-12 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {petugasList.map((pet, idx) => (
                        <tr key={pet.id || idx} className="hover:bg-slate-50/80">
                          <td className="p-2 text-center font-bold text-slate-500">{idx + 1}</td>
                          <td className="p-1.5">
                            <input
                              type="text"
                              value={pet.nama}
                              onChange={(e) => handleUpdatePetugas(idx, 'nama', e.target.value)}
                              placeholder="Nama lengkap petugas..."
                              className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                              required
                            />
                          </td>
                          <td className="p-1.5">
                            <input
                              type="text"
                              value={pet.jabatan}
                              onChange={(e) => handleUpdatePetugas(idx, 'jabatan', e.target.value)}
                              placeholder="Jabatan / Peran..."
                              className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                              required
                            />
                          </td>
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleDeletePetugas(idx)}
                              title="Hapus Petugas"
                              className="p-1 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {petugasList.length === 0 && (
                        <tr>
                          <td colSpan={4} className="p-4 text-center text-slate-400 italic">
                            Belum ada petugas pelaksana ditambahkan.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pengesahan & Approval Manager ULP */}
              <div className="p-3.5 bg-gradient-to-r from-blue-50 via-indigo-50 to-slate-50 rounded-xl border border-blue-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-blue-950 flex items-center gap-1.5 text-xs">
                    <User className="w-4 h-4 text-blue-600" /> Nama {unitInfo.managerTitle}
                  </label>
                  <span className="px-2 py-0.5 text-[9px] font-extrabold bg-blue-600 text-white rounded-md">
                    TTD DIGITAL
                  </span>
                </div>

                <input
                  type="text"
                  value={namaManager}
                  onChange={(e) => setNamaManager(e.target.value)}
                  placeholder={unitInfo.managerName}
                  required
                  className="w-full px-3 py-2 bg-white border border-blue-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isApproved}
                      onChange={(e) => setIsApproved(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="text-xs font-extrabold text-blue-900">
                      Disetujui & Approve SPK (Barcode TTD Terbit)
                    </span>
                  </label>

                  {isApproved ? (
                    <span className="px-2 py-0.5 text-[9px] font-bold bg-emerald-100 text-emerald-800 rounded border border-emerald-300 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> APPROVED
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 text-[9px] font-bold bg-amber-100 text-amber-800 rounded border border-amber-300 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-600" /> DRAFT
                    </span>
                  )}
                </div>

                {/* Pad Tanda Tangan Langsung di Layar */}
                <div className="pt-2 border-t border-blue-100">
                  <DigitalSignaturePad
                    value={tandaTanganManager}
                    onChange={(sig) => {
                      setTandaTanganManager(sig);
                      if (sig && !isApproved) {
                        setIsApproved(true);
                      }
                    }}
                    signerName={namaManager || unitInfo.managerTitle}
                    signerTitle={unitInfo.managerTitle}
                    penColor="#0f2b5c"
                    height={110}
                    placeholderText={`Goreskan tanda tangan ${unitInfo.managerTitle} langsung di sini (Layar Sentuh / Stylus / Mouse)`}
                  />
                </div>
              </div>

              {/* Status SPK & Catatan */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status Dokumen</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Terencana">Terencana</option>
                    <option value="Dalam Proses">Dalam Proses</option>
                    <option value="Selesai">Selesai</option>
                    <option value="Dibatalkan">Dibatalkan</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Instruksi K3</label>
                  <input
                    type="text"
                    value={catatan}
                    onChange={(e) => setCatatan(e.target.value)}
                    placeholder="Wajib APD Lengkap, Bebas Tegangan, Grounding Lokal"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Opsi Notifikasi WhatsApp */}
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs font-bold text-emerald-950 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sendWaNotification}
                      onChange={(e) => setSendWaNotification(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded border-emerald-300 focus:ring-emerald-500 cursor-pointer"
                    />
                    <MessageSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Kirim Notifikasi WA ke Tim</span>
                  </label>
                  <span className="px-1.5 py-0.5 text-[9px] font-extrabold bg-emerald-200 text-emerald-800 rounded">
                    WA AUTO
                  </span>
                </div>

                {sendWaNotification && (
                  <input
                    type="text"
                    value={targetPhone}
                    onChange={(e) => setTargetPhone(e.target.value)}
                    placeholder="e.g. 081234567890 (Kosongkan untuk kirim ke Grup WA)"
                    className="w-full px-3 py-1.5 bg-white border border-emerald-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  />
                )}
              </div>

            </form>
          </div>

          {/* RIGHT COLUMN: Live Paper A4 Preview */}
          <div className="w-full lg:w-1/2 p-4 md:p-6 bg-slate-200 overflow-y-auto flex flex-col items-center justify-start">
            
            <div className="w-full max-w-lg mb-2 flex items-center justify-between font-sans">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                <Printer className="w-4 h-4 text-blue-600" /> LEMBAR PRATINJAU DOKUMEN SPK (A4)
              </span>
              <span className="text-[10px] bg-slate-300 text-slate-700 font-bold px-2 py-0.5 rounded">
                PLN {unitInfo.namaUnit.toUpperCase()}
              </span>
            </div>

            {/* Simulated Paper A4 */}
            <div className="w-full max-w-lg bg-white shadow-2xl rounded-sm border border-slate-300 p-6 md:p-8 font-serif text-slate-900 leading-relaxed text-xs relative space-y-4">
              
              {/* Header KOP PLN */}
              <div className="border-2 border-slate-900 p-2.5 mb-4 flex justify-between items-stretch font-sans">
                <div className="flex items-center gap-2.5 pr-2.5 border-r-2 border-slate-900">
                  <img src={PLN_LOGO_BASE64} alt="PLN Logo" className="w-12 h-14 object-contain shrink-0" />
                  <div>
                    <h3 className="text-[11px] font-black tracking-normal text-slate-900 leading-tight">PT PLN (Persero)</h3>
                    <h4 className="text-[9px] font-bold text-slate-900 leading-tight">{unitInfo.uiw}</h4>
                    <h4 className="text-[9px] font-bold text-slate-900 leading-tight">{unitInfo.up3}</h4>
                    <h4 className="text-[9px] font-bold text-slate-900 leading-tight">{unitInfo.namaUnit.toUpperCase()}</h4>
                  </div>
                </div>
                <div className="text-right flex items-center pl-2.5">
                  <span className="inline-block px-2.5 py-1 bg-slate-100 border border-slate-300 rounded font-mono font-bold text-[10px] text-slate-800">
                    {noSpk || 'SPK/ULP-BGL/2026/08/001'}
                  </span>
                </div>
              </div>

              {/* Title Dokumen */}
              <div className="text-center my-3 font-sans">
                <h1 className="text-sm md:text-base font-black uppercase text-slate-900 underline underline-offset-4 tracking-wide">
                  SURAT PERINTAH KERJA (SPK)
                </h1>
                <p className="text-[10px] text-slate-600 font-semibold mt-0.5">
                  Jenis Pekerjaan: <strong className="uppercase text-blue-900">{jenisPekerjaan} 20kV</strong>
                </p>
              </div>

              {/* Details Table */}
              <div className="space-y-2.5 font-sans text-[11px] border-y border-slate-200 py-3">
                <div className="grid grid-cols-3 border-b border-slate-100 pb-1.5">
                  <span className="font-bold text-slate-600">Tanggal Pelaksanaan:</span>
                  <span className="col-span-2 font-semibold text-slate-900">{tanggal}</span>
                </div>

                <div className="grid grid-cols-3 border-b border-slate-100 pb-1.5">
                  <span className="font-bold text-slate-600">Penyulang Target:</span>
                  <span className="col-span-2 font-extrabold text-blue-900">{namaPenyulang || '-'}</span>
                </div>

                <div className="grid grid-cols-3 border-b border-slate-100 pb-1.5">
                  <span className="font-bold text-slate-600">Section / Lokasi:</span>
                  <span className="col-span-2 font-semibold text-slate-900">{section || '-'}</span>
                </div>

                <div className="grid grid-cols-3 border-b border-slate-100 pb-1.5">
                  <span className="font-bold text-slate-600">Target Pekerjaan:</span>
                  <span className="col-span-2 font-bold text-slate-900 bg-amber-50 px-2 py-1 rounded border border-amber-200/80">
                    {target || '-'}
                  </span>
                </div>

                <div className="grid grid-cols-3 border-b border-slate-100 pb-1.5">
                  <span className="font-bold text-slate-600">Jml Personil & Tim:</span>
                  <span className="col-span-2 font-semibold text-slate-900">
                    {jumlahPersonil} Personil ({timAtauPetugas || '-'})
                  </span>
                </div>

                <div className="grid grid-cols-3 border-b border-slate-100 pb-1.5">
                  <span className="font-bold text-slate-600">Daftar Petugas:</span>
                  <span className="col-span-2 font-medium text-slate-800 bg-slate-50 p-2 rounded border border-slate-200 text-[10px]">
                    {petugasList.length > 0 ? (
                      <ul className="list-disc pl-4 space-y-0.5">
                        {petugasList.map((p, idx) => (
                          <li key={idx}><strong>{p.nama}</strong> ({p.jabatan})</li>
                        ))}
                      </ul>
                    ) : (
                      <span>{timAtauPetugas || 'Petugas Yantek'}</span>
                    )}
                  </span>
                </div>

                <div className="grid grid-cols-3">
                  <span className="font-bold text-slate-600">Catatan Khusus K3:</span>
                  <span className="col-span-2 italic text-slate-700 text-[10px]">
                    {catatan || 'Wajib APD Lengkap, Bebas Tegangan, Grounding Lokal'}
                  </span>
                </div>
              </div>

              {/* Tanda Tangan & Barcode TTD Manager Area (Tunggal: Manager ULP Baguala) */}
              <div className="flex flex-col items-end pt-6 font-sans text-[10px] text-center mt-6 border-t border-slate-300 pr-8">
                <div className="flex flex-col items-center w-56">
                  <div>
                    <p className="font-semibold text-slate-600 mb-1">{unitInfo.managerTitle}</p>
                  </div>

                  {/* Digital Signature Barcode & Stroke Component */}
                  {tandaTanganManager ? (
                    <div className="my-1.5 p-1.5 bg-slate-50/80 border border-emerald-200 rounded-lg flex flex-col items-center justify-center relative w-full">
                      <img
                        src={tandaTanganManager}
                        alt="Tanda Tangan Manager"
                        className="h-14 max-w-[180px] object-contain"
                      />
                      <div className="absolute top-1 right-1 px-1.5 py-0.2 text-[7px] font-extrabold bg-emerald-600 text-white rounded flex items-center gap-0.5 shadow-2xs">
                        <CheckCircle2 className="w-2 h-2 text-white" />
                        <span>VERIFIED</span>
                      </div>
                    </div>
                  ) : isApproved ? (
                    <div className="my-3 p-2.5 bg-emerald-50/90 border border-emerald-300 rounded-lg flex flex-col items-center justify-center space-y-0.5 shadow-2xs w-full">
                      <div className="font-mono text-xs font-black tracking-widest text-emerald-800 select-none">
                        |||| || ||| |||| || |
                      </div>
                      <div className="flex items-center gap-1 text-[8px] font-extrabold text-emerald-700 uppercase tracking-tighter">
                        <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                        <span>VERIFIED DIGITAL SIGNATURE</span>
                      </div>
                      <div className="text-[7.5px] text-emerald-600 font-mono">
                        ID: {(noSpk || 'SPK-BGL').replace(/[^a-zA-Z0-9]/g, '')}
                      </div>
                    </div>
                  ) : (
                    <div className="my-3 p-3 border-2 border-dashed border-amber-300 bg-amber-50/50 rounded-lg text-center w-full">
                      <p className="text-[9px] font-extrabold text-amber-800 uppercase flex items-center justify-center gap-1">
                        <Clock className="w-3 h-3 text-amber-600" /> MENUNGGU APPROVAL MANAGER
                      </p>
                    </div>
                  )}

                  <div className="mt-1">
                    <p className="font-bold text-slate-900 uppercase underline text-xs">
                      ( {namaManager || 'DWI SURYA PERMANA'} )
                    </p>
                  </div>
                </div>
              </div>

              {/* Security Footer Note */}
              <div className="pt-2 text-[8px] text-slate-400 text-center font-sans border-t border-slate-100 flex items-center justify-between">
                <span>PLN {unitInfo.namaUnit} • Sistem Perang Padam</span>
                <span>Dokumen Otomatis Terverifikasi</span>
              </div>

            </div>
          </div>

        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-xs font-semibold text-slate-500 hidden sm:block">
            *Pastikan seluruh data target & keselamatan K3 telah diperiksa.
          </div>
          <div className="flex items-center gap-3 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              form="spk-form"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>{editItem ? 'Simpan Perubahan SPK' : 'Terbitkan SPK Baru'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
