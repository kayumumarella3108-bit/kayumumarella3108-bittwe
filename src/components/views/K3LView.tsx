import React, { useState, useMemo } from 'react';
import {
  User as UserType,
  JadwalSecurityItem,
  PatroliKelistrikanItem,
  AlkerApdItem
} from '../../types';
import {
  ShieldCheck,
  ShieldAlert,
  HardHat,
  Search,
  Plus,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Trash2,
  Edit,
  X,
  Phone,
  User,
  Activity,
  Zap,
  CheckSquare
} from 'lucide-react';
import { canEditData } from '../../utils/permissions';
import { DAFTAR_UNIT_PLN } from '../../utils/unitConfig';
import { AlkerApdView } from './AlkerApdView';

interface K3LViewProps {
  currentUser: UserType | null;
  activeSubTab?: 'jadwal_security' | 'alker_apd' | 'patroli_kelistrikan';
  jadwalSecurityList: JadwalSecurityItem[];
  patroliKelistrikanList: PatroliKelistrikanItem[];
  alkerApdList: AlkerApdItem[];
  onAddJadwalSecurity?: (item: Omit<JadwalSecurityItem, 'id'>) => void;
  onUpdateJadwalSecurity?: (id: string, item: Partial<JadwalSecurityItem>) => void;
  onDeleteJadwalSecurity?: (id: string) => void;
  onAddPatroliKelistrikan?: (item: Omit<PatroliKelistrikanItem, 'id'>) => void;
  onUpdatePatroliKelistrikan?: (id: string, item: Partial<PatroliKelistrikanItem>) => void;
  onDeletePatroliKelistrikan?: (id: string) => void;
  onAddAlkerApd?: (item: AlkerApdItem) => void;
  onUpdateAlkerApd?: (item: AlkerApdItem) => void;
  onDeleteAlkerApd?: (id: string) => void;
  isLoading?: boolean;
}

export const K3LView: React.FC<K3LViewProps> = ({
  currentUser,
  activeSubTab: initialTab = 'jadwal_security',
  jadwalSecurityList = [],
  patroliKelistrikanList = [],
  alkerApdList = [],
  onAddJadwalSecurity,
  onUpdateJadwalSecurity,
  onDeleteJadwalSecurity,
  onAddPatroliKelistrikan,
  onUpdatePatroliKelistrikan,
  onDeletePatroliKelistrikan,
  onAddAlkerApd,
  onUpdateAlkerApd,
  onDeleteAlkerApd,
  isLoading = false
}) => {
  const [activeTab, setActiveTab] = useState<'jadwal_security' | 'alker_apd' | 'patroli_kelistrikan'>(initialTab);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterUnit, setFilterUnit] = useState('Semua');
  const [filterShift, setFilterShift] = useState('Semua');

  // Modal States
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [isPatroliModalOpen, setIsPatroliModalOpen] = useState(false);

  // Form States
  const [editingSecurity, setEditingSecurity] = useState<JadwalSecurityItem | null>(null);
  const [securityForm, setSecurityForm] = useState({
    namaSecurity: '',
    nipn: '',
    regu: 'Regu Alpha',
    shift: 'Pagi (08.00-16.00)' as 'Pagi (08.00-16.00)' | 'Siang (16.00-24.00)' | 'Malam (00.00-08.00)',
    posPenjagaan: 'Pos Utama ULP Kantor',
    tanggal: new Date().toISOString().split('T')[0],
    unit: currentUser?.unit || 'ULP Passo',
    statusKehadiran: 'Hadir' as 'Hadir' | 'Izin' | 'Piket',
    telepon: '',
    catatan: ''
  });

  const [editingPatroli, setEditingPatroli] = useState<PatroliKelistrikanItem | null>(null);
  const [patroliForm, setPatroliForm] = useState({
    lokasiPatroli: '',
    areaK3L: 'Gedung ULP',
    tanggalPatroli: new Date().toISOString().split('T')[0],
    petugasInspeksi: currentUser?.name || 'Petugas K3L',
    kondisiApar: 'Aman' as 'Aman' | 'Kadaluarsa' | 'Perlu Isi Ulang',
    kondisiGrounding: 'Baik' as 'Baik' | 'Putus' | 'Perlu Perbaikan',
    kondisiRambuK3: 'Lengkap' as 'Lengkap' | 'Rusak' | 'Hilang',
    potensiBahaya: 'Nihil',
    tindakanKoreksi: '',
    statusPotensi: 'Aman' as 'Aman' | 'Kondisi Kritis' | 'Tindak Lanjut Needed',
    unit: currentUser?.unit || 'ULP Passo',
    fotoPatroliUrl: '',
    catatan: ''
  });

  // Filtered Lists
  const filteredSecurity = useMemo(() => {
    return jadwalSecurityList.filter((sec) => {
      const matchesSearch =
        sec.namaSecurity.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sec.posPenjagaan.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sec.regu.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesUnit = filterUnit === 'Semua' || sec.unit === filterUnit;
      const matchesShift = filterShift === 'Semua' || sec.shift === filterShift;
      return matchesSearch && matchesUnit && matchesShift;
    });
  }, [jadwalSecurityList, searchTerm, filterUnit, filterShift]);

  const filteredPatroli = useMemo(() => {
    return patroliKelistrikanList.filter((pat) => {
      const matchesSearch =
        pat.lokasiPatroli.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pat.petugasInspeksi.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pat.potensiBahaya.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesUnit = filterUnit === 'Semua' || pat.unit === filterUnit;
      return matchesSearch && matchesUnit;
    });
  }, [patroliKelistrikanList, searchTerm, filterUnit]);

  // Handlers
  const handleSaveSecurity = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSecurity) {
      if (onUpdateJadwalSecurity) onUpdateJadwalSecurity(editingSecurity.id, securityForm);
    } else {
      if (onAddJadwalSecurity) onAddJadwalSecurity(securityForm);
    }
    setIsSecurityModalOpen(false);
    setEditingSecurity(null);
  };

  const handleSavePatroli = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPatroli) {
      if (onUpdatePatroliKelistrikan) onUpdatePatroliKelistrikan(editingPatroli.id, patroliForm);
    } else {
      if (onAddPatroliKelistrikan) onAddPatroliKelistrikan(patroliForm);
    }
    setIsPatroliModalOpen(false);
    setEditingPatroli(null);
  };

  return (
    <div className="p-4 md:p-6 space-y-6 bg-slate-50 text-slate-900 font-sans min-h-screen">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 bg-gradient-to-r from-[#022623] via-[#044c45] to-[#022e2a] p-6 rounded-2xl border-2 border-teal-500/60 shadow-xl relative overflow-hidden text-white">
        <div className="absolute right-0 top-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        
        {/* Title Section */}
        <div className="flex items-center gap-4 z-10">
          <div className="p-3 bg-teal-950/80 rounded-2xl text-emerald-300 border border-teal-500/40 shadow-inner shrink-0">
            <ShieldCheck className="w-6 h-6 text-emerald-300" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-white drop-shadow-xs">
              K3L &amp; Keamanan Operasional
            </h1>
            <p className="text-xs text-teal-100/90 mt-0.5">
              Manajemen Jadwal Security, Pengawasan APD &amp; Alat Kerja, serta Inspeksi Patroli Keselamatan Kelistrikan ULP
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="pt-4 border-t border-teal-500/30 flex flex-wrap items-center justify-between gap-3 z-10">
          <div className="flex items-center gap-2 p-1 bg-[#012521] rounded-xl border border-teal-700/60 shadow-inner">
            <button
              onClick={() => setActiveTab('jadwal_security')}
              className={`px-4 py-2 rounded-lg text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'jadwal_security'
                  ? 'bg-gradient-to-r from-teal-400 to-emerald-400 text-slate-950 shadow-md scale-105'
                  : 'text-teal-200 hover:text-white hover:bg-teal-800/40'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Jadwal Security</span>
              <span className="ml-1 px-1.5 py-0.2 bg-teal-950/80 text-teal-300 rounded-full text-[10px]">
                {jadwalSecurityList.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('alker_apd')}
              className={`px-4 py-2 rounded-lg text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'alker_apd'
                  ? 'bg-gradient-to-r from-teal-400 to-emerald-400 text-slate-950 shadow-md scale-105'
                  : 'text-teal-200 hover:text-white hover:bg-teal-800/40'
              }`}
            >
              <HardHat className="w-4 h-4" />
              <span>APD &amp; Alker</span>
              <span className="ml-1 px-1.5 py-0.2 bg-teal-950/80 text-teal-300 rounded-full text-[10px]">
                {alkerApdList.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('patroli_kelistrikan')}
              className={`px-4 py-2 rounded-lg text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'patroli_kelistrikan'
                  ? 'bg-gradient-to-r from-teal-400 to-emerald-400 text-slate-950 shadow-md scale-105'
                  : 'text-teal-200 hover:text-white hover:bg-teal-800/40'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Patroli Kelistrikan</span>
              <span className="ml-1 px-1.5 py-0.2 bg-teal-950/80 text-teal-300 rounded-full text-[10px]">
                {patroliKelistrikanList.length}
              </span>
            </button>
          </div>

          {/* Action Button */}
          {canEditData(currentUser) && activeTab !== 'alker_apd' && (
            <button
              onClick={() => {
                if (activeTab === 'jadwal_security') {
                  setEditingSecurity(null);
                  setSecurityForm({
                    namaSecurity: '',
                    nipn: '',
                    regu: 'Regu Alpha',
                    shift: 'Pagi (08.00-16.00)',
                    posPenjagaan: 'Pos Utama ULP Kantor',
                    tanggal: new Date().toISOString().split('T')[0],
                    unit: currentUser?.unit || 'ULP Passo',
                    statusKehadiran: 'Hadir',
                    telepon: '',
                    catatan: ''
                  });
                  setIsSecurityModalOpen(true);
                } else if (activeTab === 'patroli_kelistrikan') {
                  setEditingPatroli(null);
                  setPatroliForm({
                    lokasiPatroli: '',
                    areaK3L: 'Gedung ULP',
                    tanggalPatroli: new Date().toISOString().split('T')[0],
                    petugasInspeksi: currentUser?.name || 'Petugas K3L',
                    kondisiApar: 'Aman',
                    kondisiGrounding: 'Baik',
                    kondisiRambuK3: 'Lengkap',
                    potensiBahaya: 'Nihil',
                    tindakanKoreksi: '',
                    statusPotensi: 'Aman',
                    unit: currentUser?.unit || 'ULP Passo',
                    fotoPatroliUrl: '',
                    catatan: ''
                  });
                  setIsPatroliModalOpen(true);
                }
              }}
              className="px-4 py-2.5 bg-gradient-to-r from-teal-400 via-emerald-400 to-teal-300 hover:from-teal-300 hover:to-emerald-300 text-slate-950 font-black text-xs rounded-xl transition-all shadow-md shadow-teal-950/40 flex items-center gap-2 cursor-pointer shrink-0 border border-teal-200/80 active:scale-95"
            >
              <Plus className="w-4 h-4 text-slate-950 stroke-[3]" />
              <span>
                {activeTab === 'jadwal_security' && '+ Input Jadwal Security'}
                {activeTab === 'patroli_kelistrikan' && '+ Entri Laporan Patroli'}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* TAB 1: JADWAL SECURITY */}
      {activeTab === 'jadwal_security' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari Nama Petugas, Pos, Regu..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="flex items-center gap-3">
              <select
                value={filterShift}
                onChange={(e) => setFilterShift(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="Semua">Semua Shift</option>
                <option value="Pagi (08.00-16.00)">Shift Pagi</option>
                <option value="Siang (16.00-24.00)">Shift Siang</option>
                <option value="Malam (00.00-08.00)">Shift Malam</option>
              </select>

              <select
                value={filterUnit}
                onChange={(e) => setFilterUnit(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="Semua">Semua Unit ULP</option>
                {DAFTAR_UNIT_PLN.map((u, i) => (
                  <option key={`sec_unit_${i}`} value={u.namaUnit}>
                    {u.namaUnit}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {filteredSecurity.length === 0 ? (
              <div className="col-span-full p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 font-bold">
                Belum ada jadwal penugasan security.
              </div>
            ) : (
              filteredSecurity.map((sec) => (
                <div
                  key={sec.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-900 text-amber-400 font-black flex items-center justify-center text-sm border-2 border-amber-400/40 shadow-xs">
                          {sec.namaSecurity.charAt(0)}
                        </div>
                        <div>
                          <div className="font-extrabold text-slate-900 text-sm">{sec.namaSecurity}</div>
                          <div className="text-[11px] font-mono text-slate-500">{sec.nipn || 'SECURITY ULP'}</div>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 bg-teal-50 text-teal-700 font-extrabold text-[10px] rounded-full border border-teal-200">
                        {sec.regu}
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                        <div className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-teal-600" />
                          <span>{sec.shift}</span>
                        </div>
                        <div className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                          <span>{sec.posPenjagaan}</span>
                        </div>
                      </div>

                      {sec.telepon && (
                        <div className="flex items-center gap-2 text-[11px] text-slate-600 font-medium">
                          <Phone className="w-3.5 h-3.5 text-teal-600" />
                          <span>{sec.telepon}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="font-bold text-teal-700">{sec.unit}</span>
                    {canEditData(currentUser) && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingSecurity(sec);
                            setSecurityForm({ ...sec });
                            setIsSecurityModalOpen(true);
                          }}
                          className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        {onDeleteJadwalSecurity && (
                          <button
                            onClick={() => {
                              if (confirm(`Hapus jadwal security ${sec.namaSecurity}?`)) {
                                onDeleteJadwalSecurity(sec.id);
                              }
                            }}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 2: APD & ALKER */}
      {activeTab === 'alker_apd' && (
        <AlkerApdView
          currentUser={currentUser || undefined}
          alkerApdList={alkerApdList}
          onAddAlkerApd={onAddAlkerApd || (() => {})}
          onUpdateAlkerApd={onUpdateAlkerApd || (() => {})}
          onDeleteAlkerApd={onDeleteAlkerApd || (() => {})}
          isLoading={isLoading}
        />
      )}

      {/* TAB 3: PATROLI KELISTRIKAN */}
      {activeTab === 'patroli_kelistrikan' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari Lokasi Patroli & Potensi Bahaya..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="flex items-center gap-3">
              <select
                value={filterUnit}
                onChange={(e) => setFilterUnit(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="Semua">Semua Unit ULP</option>
                {DAFTAR_UNIT_PLN.map((u, i) => (
                  <option key={`pat_unit_${i}`} value={u.namaUnit}>
                    {u.namaUnit}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/80 text-slate-700 font-extrabold border-b border-slate-200">
                    <th className="p-3">LOKASI PATROLI</th>
                    <th className="p-3">AREA K3L</th>
                    <th className="p-3">STATUS PARTE / APAR / GROUNDING</th>
                    <th className="p-3">POTENSI BAHAYA K3L</th>
                    <th className="p-3">STATUS POTENSI</th>
                    <th className="p-3">INSPEKTOR &amp; UNIT</th>
                    {canEditData(currentUser) && <th className="p-3 text-center">AKSI</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredPatroli.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400 font-bold">
                        Belum ada data patroli keselamatan kelistrikan.
                      </td>
                    </tr>
                  ) : (
                    filteredPatroli.map((pat) => (
                      <tr key={pat.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3">
                          <div className="font-extrabold text-slate-900">{pat.lokasiPatroli}</div>
                          <div className="text-[11px] text-slate-500">{pat.tanggalPatroli}</div>
                        </td>
                        <td className="p-3 font-semibold text-slate-600">{pat.areaK3L}</td>
                        <td className="p-3 space-y-1">
                          <div className="text-[11px]">
                            APAR: <span className="font-bold text-teal-700">{pat.kondisiApar}</span>
                          </div>
                          <div className="text-[11px]">
                            Grounding: <span className="font-bold text-amber-700">{pat.kondisiGrounding}</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="font-medium text-slate-800">{pat.potensiBahaya}</div>
                          {pat.tindakanKoreksi && (
                            <div className="text-[11px] text-teal-700 font-semibold mt-0.5">
                              Koreksi: {pat.tindakanKoreksi}
                            </div>
                          )}
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-black inline-flex items-center gap-1 ${
                              pat.statusPotensi === 'Aman'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : 'bg-rose-100 text-rose-800 border border-rose-300'
                            }`}
                          >
                            {pat.statusPotensi}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="font-semibold text-slate-800">{pat.petugasInspeksi}</div>
                          <div className="text-[11px] text-teal-600 font-bold">{pat.unit}</div>
                        </td>
                        {canEditData(currentUser) && (
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => {
                                  setEditingPatroli(pat);
                                  setPatroliForm({ ...pat });
                                  setIsPatroliModalOpen(true);
                                }}
                                className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg cursor-pointer"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              {onDeletePatroliKelistrikan && (
                                <button
                                  onClick={() => {
                                    if (confirm(`Hapus laporan patroli ${pat.lokasiPatroli}?`)) {
                                      onDeletePatroliKelistrikan(pat.id);
                                    }
                                  }}
                                  className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
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
        </div>
      )}

      {/* MODAL ENTRI JADWAL SECURITY */}
      {isSecurityModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-slate-900 text-base">
                {editingSecurity ? 'Edit Jadwal Security' : 'Tambah Penugasan Security Baru'}
              </h3>
              <button
                onClick={() => setIsSecurityModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSecurity} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">NAMA PETUGAS</label>
                  <input
                    type="text"
                    required
                    value={securityForm.namaSecurity}
                    onChange={(e) => setSecurityForm({ ...securityForm, namaSecurity: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">NIPN / ID</label>
                  <input
                    type="text"
                    value={securityForm.nipn}
                    onChange={(e) => setSecurityForm({ ...securityForm, nipn: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                    placeholder="SEC-01"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">REGU</label>
                  <select
                    value={securityForm.regu}
                    onChange={(e) => setSecurityForm({ ...securityForm, regu: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                  >
                    <option value="Regu Alpha">Regu Alpha</option>
                    <option value="Regu Bravo">Regu Bravo</option>
                    <option value="Regu Charlie">Regu Charlie</option>
                    <option value="Regu Delta">Regu Delta</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">SHIFT PENUGASAN</label>
                  <select
                    value={securityForm.shift}
                    onChange={(e) => setSecurityForm({ ...securityForm, shift: e.target.value as any })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                  >
                    <option value="Pagi (08.00-16.00)">Pagi (08.00-16.00)</option>
                    <option value="Siang (16.00-24.00)">Siang (16.00-24.00)</option>
                    <option value="Malam (00.00-08.00)">Malam (00.00-08.00)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">POS PENJAGAAN</label>
                <input
                  type="text"
                  required
                  value={securityForm.posPenjagaan}
                  onChange={(e) => setSecurityForm({ ...securityForm, posPenjagaan: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  placeholder="Pos Utama ULP, Pos GI, Pos Gudang..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">TELEPON</label>
                  <input
                    type="text"
                    value={securityForm.telepon}
                    onChange={(e) => setSecurityForm({ ...securityForm, telepon: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">UNIT ULP</label>
                  <select
                    value={securityForm.unit}
                    onChange={(e) => setSecurityForm({ ...securityForm, unit: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                  >
                    {DAFTAR_UNIT_PLN.map((u, i) => (
                      <option key={`sec_form_u_${i}`} value={u.namaUnit}>
                        {u.namaUnit}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSecurityModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl"
                >
                  Simpan Jadwal Security
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ENTRI PATROLI KELISTRIKAN */}
      {isPatroliModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-slate-900 text-base">
                {editingPatroli ? 'Edit Laporan Patroli Kelistrikan' : 'Tambah Laporan Patroli K3L Baru'}
              </h3>
              <button
                onClick={() => setIsPatroliModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePatroli} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">LOKASI PATROLI</label>
                <input
                  type="text"
                  required
                  value={patroliForm.lokasiPatroli}
                  onChange={(e) => setPatroliForm({ ...patroliForm, lokasiPatroli: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                  placeholder="Control Room, Switchyard, Ruang Batterai..."
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">KONDISI APAR</label>
                  <select
                    value={patroliForm.kondisiApar}
                    onChange={(e) => setPatroliForm({ ...patroliForm, kondisiApar: e.target.value as any })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                  >
                    <option value="Aman">Aman</option>
                    <option value="Kadaluarsa">Kadaluarsa</option>
                    <option value="Perlu Isi Ulang">Perlu Isi Ulang</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">GROUNDING</label>
                  <select
                    value={patroliForm.kondisiGrounding}
                    onChange={(e) => setPatroliForm({ ...patroliForm, kondisiGrounding: e.target.value as any })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                  >
                    <option value="Baik">Baik</option>
                    <option value="Putus">Putus</option>
                    <option value="Perlu Perbaikan">Perlu Perbaikan</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">RAMBU K3</label>
                  <select
                    value={patroliForm.kondisiRambuK3}
                    onChange={(e) => setPatroliForm({ ...patroliForm, kondisiRambuK3: e.target.value as any })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                  >
                    <option value="Lengkap">Lengkap</option>
                    <option value="Rusak">Rusak</option>
                    <option value="Hilang">Hilang</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">POTENSI BAHAYA DIJUMPAI</label>
                <textarea
                  rows={2}
                  value={patroliForm.potensiBahaya}
                  onChange={(e) => setPatroliForm({ ...patroliForm, potensiBahaya: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  placeholder="Jelaskan kondisi bahaya keselamatan listrik..."
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">TINDAKAN KOREKSI</label>
                <input
                  type="text"
                  value={patroliForm.tindakanKoreksi}
                  onChange={(e) => setPatroliForm({ ...patroliForm, tindakanKoreksi: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  placeholder="Perbaikan langsung / SPK Koreksi..."
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPatroliModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl"
                >
                  Simpan Laporan Patroli
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
