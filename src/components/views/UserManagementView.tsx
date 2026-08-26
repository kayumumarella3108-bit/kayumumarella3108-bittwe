import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Search,
  Eye,
  Pencil,
  Trash2,
  Lock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Plus,
  X,
  Check,
  Building2,
  ArrowRight,
  LayoutDashboard,
  Wrench,
  FileText,
  Gauge,
  Zap,
  BarChart3,
  Share2,
  Key,
  Map,
  Database,
  TrendingUp,
  Activity,
  Palette,
  Crown,
  AlertTriangle,
  Hash
} from 'lucide-react';
import { User, MasterUnitPLN } from '../../types';
import { canEditData, canManageUsers, getRoleCategory, isOwnerUser } from '../../utils/permissions';
import { LoginBackgroundModal } from '../LoginBackgroundModal';
import { DAFTAR_UNIT_PLN, getKodeUnitByUnitName, getDynamicUnitList, DEFAULT_UNIT, DEFAULT_KODE_UNIT } from '../../utils/unitConfig';

const getMenuBadgeProps = (menuId: string) => {
  switch (menuId) {
    case 'dashboard':
      return { label: 'Dashboard', bg: 'bg-blue-50 text-blue-700 border-blue-200' };
    case 'peta':
      return { label: 'Peta Penyulang', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    case 'master_data':
      return { label: 'Master Data', bg: 'bg-purple-50 text-purple-700 border-purple-200' };
    case 'health_index':
      return { label: 'Health Index', bg: 'bg-cyan-50 text-cyan-700 border-cyan-200' };
    case 'gangguan':
      return { label: 'Gangguan', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
    case 'pemeliharaan':
      return { label: 'Pemeliharaan', bg: 'bg-rose-50 text-rose-700 border-rose-200' };
    case 'spk':
      return { label: 'Surat & SPK', bg: 'bg-teal-50 text-teal-700 border-teal-200' };
    case 'pengukuran_gardu':
      return { label: 'Beban Gardu', bg: 'bg-orange-50 text-orange-700 border-orange-200' };
    case 'survey_pb_pd':
      return { label: 'Survey PB/PD', bg: 'bg-yellow-50 text-yellow-800 border-yellow-200' };
    case 'saidi_saifi':
      return { label: 'SAIDI SAIFI', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
    case 'monitoring_yantek':
      return { label: 'Yantek', bg: 'bg-sky-50 text-sky-700 border-sky-200' };
    case 'share_laporan':
      return { label: 'Share Laporan', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    case 'monitoring_online':
      return { label: 'User Online (Owner)', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    case 'kelola_user':
      return { label: 'Kelola User', bg: 'bg-purple-50 text-purple-700 border-purple-200' };
    default:
      return { label: menuId, bg: 'bg-slate-50 text-slate-700 border-slate-200' };
  }
};

interface UserManagementViewProps {
  currentUser: User;
  usersList: User[];
  masterUnitList?: MasterUnitPLN[];
  onAddUser: (user: User) => void;
  onUpdateUser: (user: User) => void;
  onDeleteUser: (idOrUsername: string) => void;
  onSwitchUserRole?: (user: User) => void;
}

export const UserManagementView: React.FC<UserManagementViewProps> = ({
  currentUser,
  usersList,
  masterUnitList = [],
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  onSwitchUserRole
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('Semua');
  const [unitFilter, setUnitFilter] = useState<string>('Semua');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBgModalOpen, setIsBgModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<User | null>(null);
  const [protectedActionAlert, setProtectedActionAlert] = useState<string | null>(null);

  const isCurrentUserOwner = isOwnerUser(currentUser);

  // Dynamic unit list synchronized live with Master Data PLN
  const unitOptions = React.useMemo(() => {
    return getDynamicUnitList(masterUnitList);
  }, [masterUnitList]);

  // Form State
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<string>('Koordinator');
  const [unit, setUnit] = useState(DEFAULT_UNIT);
  const [kodeUnit, setKodeUnit] = useState(DEFAULT_KODE_UNIT);
  const [customUnit, setCustomUnit] = useState('');
  const [isCustomUnit, setIsCustomUnit] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [canAddUsers, setCanAddUsers] = useState(false);
  const [canEditDataVal, setCanEditDataVal] = useState(true);
  const [canViewDataOnly, setCanViewDataOnly] = useState(false);
  const [allowedMenus, setAllowedMenus] = useState<string[]>([]);
  const [formError, setFormError] = useState('');

  // Strict check: only Koordinator / System Admin / Owner can add/edit/delete users
  const canEdit = canManageUsers(currentUser);

  const PRESET_AVATARS = [
    { label: 'Teknisi 1', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
    { label: 'Engineer', url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80' },
    { label: 'Manager', url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80' },
    { label: 'Staf Teknik', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' },
    { label: 'Supervisor', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80' }
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setAvatarUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUnitSelect = (selectedVal: string) => {
    if (selectedVal === 'KUSTOM') {
      setIsCustomUnit(true);
      setUnit(customUnit || 'ULP Baru');
    } else if (selectedVal === 'SEMUA UNIT' || selectedVal === 'SEMUA UNIT (GLOBAL)') {
      setIsCustomUnit(false);
      setUnit('SEMUA UNIT (GLOBAL)');
      setKodeUnit('54000');
    } else {
      setIsCustomUnit(false);
      setUnit(selectedVal);
      const matched = unitOptions.find(u => u.namaUnit === selectedVal);
      const code = matched ? matched.kodeUnit : getKodeUnitByUnitName(selectedVal, masterUnitList);
      setKodeUnit(code);
    }
  };

  const getMenuPresetsForRole = (roleName: string): string[] => {
    const roleLower = roleName.toLowerCase().trim();
    if (roleLower === 'owner' || roleLower.includes('owner')) {
      return ['dashboard', 'monitoring_online', 'gangguan', 'pemeliharaan', 'spk', 'pengukuran_gardu', 'survey_pb_pd', 'saidi_saifi', 'monitoring_yantek', 'share_laporan', 'kelola_user'];
    }
    if (roleLower.includes('koordinator') || roleLower.includes('admin system') || roleLower.includes('admin aplikasi') || roleLower === 'admin') {
      return ['dashboard', 'gangguan', 'pemeliharaan', 'spk', 'pengukuran_gardu', 'survey_pb_pd', 'saidi_saifi', 'monitoring_yantek', 'share_laporan', 'kelola_user'];
    }
    if (roleLower.includes('pemasaran')) {
      return ['dashboard', 'survey_pb_pd'];
    }
    if (roleLower.includes('row') || roleLower.includes('inspeksi')) {
      return ['dashboard', 'pemeliharaan'];
    }
    if (roleLower.includes('teknik') || roleLower.includes('leader') || roleLower.includes('manager') || roleLower.includes('up3') || roleLower.includes('uiw') || roleLower.includes('nusadaya')) {
      return ['dashboard', 'gangguan', 'pemeliharaan', 'spk', 'pengukuran_gardu', 'survey_pb_pd', 'saidi_saifi', 'monitoring_yantek', 'share_laporan'];
    }
    return ['dashboard'];
  };

  const handleRoleChange = (selectedRole: string) => {
    setRole(selectedRole);
    const presets = getMenuPresetsForRole(selectedRole);
    setAllowedMenus(presets);

    if (selectedRole === 'Owner' || selectedRole.includes('Owner')) {
      setUnit('SEMUA UNIT (GLOBAL)');
      setKodeUnit('54000');
      setIsCustomUnit(false);
    }
    
    const isPowerUser = selectedRole.includes('Koordinator') || selectedRole.includes('Admin Aplikasi') || selectedRole.includes('Admin System') || selectedRole.includes('Owner');
    setCanAddUsers(isPowerUser);
    setCanEditDataVal(!selectedRole.includes('Manager') && !selectedRole.includes('UP3') && !selectedRole.includes('UIW'));
    setCanViewDataOnly(selectedRole.includes('Manager') || selectedRole.includes('UP3') || selectedRole.includes('UIW'));
  };

  const openAddModal = () => {
    setEditingUser(null);
    setUsername('');
    setName('');
    setRole('Koordinator');
    const defaultU = unitOptions[0]?.namaUnit || DEFAULT_UNIT;
    const defaultK = unitOptions[0]?.kodeUnit || DEFAULT_KODE_UNIT;
    setUnit(defaultU);
    setKodeUnit(defaultK);
    setIsCustomUnit(false);
    setCustomUnit('');
    setAvatarUrl('');
    setPassword('');
    setConfirmPassword('');
    setCanAddUsers(false);
    setCanEditDataVal(true);
    setCanViewDataOnly(false);
    setAllowedMenus(getMenuPresetsForRole('Koordinator'));
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (user: User) => {
    if (isOwnerUser(user) && !isCurrentUserOwner) {
      setProtectedActionAlert(`Akun Owner (${user.name}) dilindungi dan tidak dapat diedit oleh user dengan role ${currentUser?.role || 'Koordinator'}.`);
      return;
    }

    setEditingUser(user);
    setUsername(user.username);
    setName(user.name);
    setRole(user.role);
    
    if (user.unit === 'SEMUA UNIT' || user.unit === 'SEMUA UNIT (GLOBAL)' || (isOwnerUser(user) && (user.unit || '').includes('SEMUA'))) {
      setUnit(user.unit || 'SEMUA UNIT (GLOBAL)');
      setKodeUnit(user.kodeUnit || '54000');
      setIsCustomUnit(false);
      setCustomUnit('');
    } else {
      const matchedUnit = unitOptions.find(u => u.namaUnit.toLowerCase() === (user.unit || '').toLowerCase());
      if (matchedUnit) {
        setUnit(matchedUnit.namaUnit);
        setKodeUnit(user.kodeUnit || matchedUnit.kodeUnit);
        setIsCustomUnit(false);
        setCustomUnit('');
      } else {
        setUnit(user.unit || DEFAULT_UNIT);
        setKodeUnit(user.kodeUnit || getKodeUnitByUnitName(user.unit, masterUnitList));
        setIsCustomUnit(true);
        setCustomUnit(user.unit || '');
      }
    }

    setAvatarUrl(user.avatarUrl || '');
    setPassword(user.password || '');
    setConfirmPassword(user.password || '');
    setCanAddUsers(user.permissions?.canAddUsers || false);
    setCanEditDataVal(user.permissions?.canEditData || false);
    setCanViewDataOnly(user.permissions?.canViewDataOnly || false);
    setAllowedMenus(user.allowedMenus || getMenuPresetsForRole(user.role));
    setFormError('');
    setIsModalOpen(true);
  };

  const handleDeleteRequest = (u: User) => {
    if (isOwnerUser(u)) {
      setProtectedActionAlert(`Akun Owner Sistem (${u.name}) dilindungi dan tidak dapat dihapus oleh siapa pun.`);
      return;
    }
    setDeleteConfirmUser(u);
  };

  const confirmDelete = () => {
    if (!deleteConfirmUser) return;
    if (isOwnerUser(deleteConfirmUser)) {
      setProtectedActionAlert('Akun Owner Sistem dilindungi dan tidak dapat dihapus.');
      setDeleteConfirmUser(null);
      return;
    }
    onDeleteUser(deleteConfirmUser.id || deleteConfirmUser.username);
    setDeleteConfirmUser(null);
  };

  const toggleMenuAllowed = (menuId: string) => {
    setAllowedMenus(prev => {
      if (prev.includes(menuId)) {
        return prev.filter(id => id !== menuId);
      } else {
        return [...prev, menuId];
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!username.trim() || !name.trim()) {
      setFormError('Username dan Nama Lengkap wajib diisi.');
      return;
    }

    if (password !== confirmPassword) {
      setFormError('Password dan Ulangi Password tidak cocok.');
      return;
    }

    const finalUnit = isCustomUnit ? customUnit.trim() || 'ULP Kustom' : unit;
    const finalKodeUnit = kodeUnit.trim() || getKodeUnitByUnitName(finalUnit);
    const editorVal = canEditDataVal;

    if (editingUser) {
      const updated: User = {
        ...editingUser,
        username: username.trim(),
        name: name.trim(),
        role: role as any,
        unit: finalUnit,
        kodeUnit: finalKodeUnit,
        avatarUrl,
        password,
        permissions: { 
          canAddUsers, 
          canEditData: editorVal, 
          canViewDataOnly: !editorVal 
        },
        allowedMenus: allowedMenus
      };
      onUpdateUser(updated);
    } else {
      const newUser: User = {
        id: `user_${Date.now()}`,
        username: username.trim(),
        name: name.trim(),
        role: role as any,
        unit: finalUnit,
        kodeUnit: finalKodeUnit,
        status: 'Aktif',
        avatarUrl,
        password,
        permissions: { 
          canAddUsers, 
          canEditData: editorVal, 
          canViewDataOnly: !editorVal 
        },
        allowedMenus: allowedMenus
      };
      onAddUser(newUser);
    }

    setIsModalOpen(false);
  };

  const filteredUsers = usersList.filter((u) => {
    const matchesQuery =
      (u.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.username || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.unit && u.unit.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.kodeUnit && u.kodeUnit.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesRole = roleFilter === 'Semua' || u.role === roleFilter;
    const matchesUnit = unitFilter === 'Semua' || (u.unit && u.unit.toLowerCase().includes(unitFilter.toLowerCase())) || u.kodeUnit === unitFilter;
    return matchesQuery && matchesRole && matchesUnit;
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto font-sans text-slate-800">
      
      {/* View Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-[#022623] via-[#044c45] to-[#022e2a] p-6 rounded-2xl border-2 border-teal-500/60 shadow-xl relative overflow-hidden text-white">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-teal-500/20 text-teal-300 rounded-xl border border-teal-500/40 shadow-inner">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white tracking-tight drop-shadow-xs">
                Pengaturan Akun & Isolasi Unit (Multi-Unit RBAC)
              </h1>
              <p className="text-xs text-teal-100/90 mt-0.5 max-w-2xl font-medium leading-relaxed">
                Kelola hak akses user, unit kerja (ULP Namlea, ULP Baguala, UP3, dll), dan Kode Unit untuk isolasi data. Hanya Owner yang dapat melihat seluruh data.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setIsBgModalOpen(true)}
            className="px-4 py-2.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/50 font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0 backdrop-blur-xs active:scale-95"
            title="Kustomisasi tema & latar belakang layar login"
          >
            <Palette className="w-4 h-4 text-amber-300" />
            <span>Ganti Latar Login</span>
          </button>

          {canEdit && (
            <button
              onClick={openAddModal}
              className="px-4 py-2.5 bg-gradient-to-r from-teal-400 to-emerald-400 hover:from-teal-300 hover:to-emerald-300 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-teal-950/40 flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0 border border-teal-200 active:scale-95"
            >
              <UserPlus className="w-4 h-4 text-slate-950" />
              <span>+ Tambah User Baru</span>
            </button>
          )}
        </div>
      </div>

      {/* Protected Action Alert Banner */}
      {protectedActionAlert && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 flex items-center justify-between gap-3.5 shadow-sm animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500 text-white rounded-xl shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="text-xs leading-relaxed font-bold">
              <span className="font-extrabold text-amber-950 block text-sm mb-0.5">
                Proteksi Akun Owner Aktif
              </span>
              {protectedActionAlert}
            </div>
          </div>
          <button
            onClick={() => setProtectedActionAlert(null)}
            className="p-1.5 rounded-lg hover:bg-amber-200 text-amber-800 transition-colors cursor-pointer shrink-0"
            title="Tutup Notifikasi"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Restriction Notice for non-Koordinator roles (e.g. Admin Teknik) */}
      {!canEdit && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center gap-3.5 shadow-xs">
          <div className="p-2.5 bg-amber-500 text-white rounded-xl shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div className="text-xs leading-relaxed">
            <span className="font-extrabold text-amber-950 block text-sm mb-0.5">
              Akses Kelola User Dibatasi (Role: {currentUser?.role || 'Admin Teknik'})
            </span>
            Pengguna dengan Role <strong>{currentUser?.role || 'Admin Teknik'}</strong> dikhususkan untuk <strong>menginput & mengedit data operasional</strong> (gangguan, ROW, pemeliharaan, dll) dan <strong>tidak memiliki akses untuk membuat user baru atau mengelola user</strong>. Fitur pengelolaan user hanya dapat diakses oleh <strong>Koordinator</strong> dan <strong>Owner</strong>.
          </div>
        </div>
      )}

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        
        {/* Table Filters */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
          
          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari user, nama, unit, kode..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500 font-medium"
            />
          </div>

          {/* Filters by Role and Unit */}
          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-600 whitespace-nowrap">Filter Role:</span>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="Semua">Semua Role ({usersList.length})</option>
                <option value="Koordinator">Koordinator</option>
                <option value="Admin Teknik">Admin Teknik</option>
                <option value="Bagian Teknik">Bagian Teknik (Monitoring)</option>
                <option value="PLN Nusadaya">PLN Nusadaya (Monitoring)</option>
                <option value="Team Leader">Team Leader</option>
                <option value="Manager ULP">Manager ULP</option>
                <option value="UP3">UP3</option>
                <option value="UIW">UIW</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-600 whitespace-nowrap">Filter Unit:</span>
              <select
                value={unitFilter}
                onChange={(e) => setUnitFilter(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="Semua">Semua Unit</option>
                <option value="SEMUA UNIT">SEMUA UNIT (Owner Global)</option>
                {unitOptions.map((u, idx) => (
                  <option key={`um_filter_${u.kodeUnit}_${u.namaUnit}_${idx}`} value={u.namaUnit}>{u.namaUnit} ({u.kodeUnit})</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Nama Lengkap & Username</th>
                <th className="py-3.5 px-4">Role Jabatan</th>
                <th className="py-3.5 px-4">Unit Kerja & Kode</th>
                <th className="py-3.5 px-4">Kategori Hak Akses</th>
                <th className="py-3.5 px-4">Status</th>
                {canEdit && <th className="py-3.5 px-4 text-center">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Tidak ada user ditemukan.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isEdit = canEditData(u);
                  const isCurrentUser = currentUser.username === u.username;
                  const isTargetOwner = isOwnerUser(u);
                  const uKode = u.kodeUnit || getKodeUnitByUnitName(u.unit);

                  return (
                    <tr
                      key={u.id || u.username}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isTargetOwner ? 'bg-amber-50/30' : isCurrentUser ? 'bg-blue-50/40' : ''
                      }`}
                    >
                      {/* Name & Username */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          {u.avatarUrl ? (
                            <img
                              src={u.avatarUrl}
                              alt={u.name}
                              referrerPolicy="no-referrer"
                              className={`w-9 h-9 rounded-full object-cover shadow-xs shrink-0 ${
                                isTargetOwner ? 'border-2 border-amber-400' : 'border border-slate-200'
                              }`}
                            />
                          ) : (
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center font-extrabold text-xs shadow-xs shrink-0 ${
                              isTargetOwner
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : isEdit 
                                ? 'bg-emerald-100 text-emerald-800' 
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                              {u.name ? u.name.substring(0, 2).toUpperCase() : 'US'}
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              {u.name}
                              {isTargetOwner && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 rounded-md text-[9px] font-black uppercase shadow-2xs">
                                  <Crown className="w-2.5 h-2.5" />
                                  Owner
                                </span>
                              )}
                              {isCurrentUser && (
                                <span className="px-2 py-0.5 bg-blue-600 text-white rounded-md text-[9px] font-black uppercase">
                                  Anda
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-500 font-mono">
                              @{u.username}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {isTargetOwner ? (
                          <span className="text-amber-900 font-extrabold flex items-center gap-1">
                            <Crown className="w-3.5 h-3.5 text-amber-600" />
                            {u.role || 'Owner'}
                          </span>
                        ) : (
                          u.role
                        )}
                      </td>

                      {/* Unit & Kode Unit */}
                      <td className="py-3.5 px-4 text-slate-600">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 font-bold text-slate-800">
                            <Building2 className="w-3.5 h-3.5 text-slate-500" />
                            <span>{u.unit || DEFAULT_UNIT}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-teal-50 border border-teal-200 text-teal-800 font-mono text-[10px] font-bold">
                              <Hash className="w-2.5 h-2.5 text-teal-600" />
                              Kode: {uKode}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Hak Akses Badge */}
                      <td className="py-3.5 px-4 max-w-[280px]">
                        <div className="space-y-1.5">
                          <div>
                            {isTargetOwner ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 border border-amber-300 text-amber-900 text-[10px] font-extrabold shadow-2xs">
                                <Crown className="w-3 h-3 text-amber-600" />
                                <span>Owner (Semua Unit & Hak Penuh)</span>
                              </span>
                            ) : isEdit ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-extrabold shadow-2xs">
                                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                                <span>Edit & Entri Data ({u.unit || DEFAULT_UNIT})</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-extrabold shadow-2xs">
                                <Eye className="w-3 h-3 text-amber-600" />
                                <span>Monitoring Read-Only ({u.unit || DEFAULT_UNIT})</span>
                              </span>
                            )}
                          </div>
                          
                          {/* List of checked menus as micro-pills */}
                          <div className="flex flex-wrap gap-1 max-w-[260px]">
                            {(() => {
                              const activeMenus = u.allowedMenus || getMenuPresetsForRole(u.role);
                              if (activeMenus.length === 0) {
                                return <span className="text-[10px] text-slate-400 italic">Tidak ada akses menu</span>;
                              }
                              return activeMenus.map((m) => {
                                const props = getMenuBadgeProps(m);
                                return (
                                  <span key={m} className={`inline-flex items-center px-1.5 py-0.5 rounded-md border text-[9px] font-bold ${props.bg}`}>
                                    {props.label}
                                  </span>
                                );
                              });
                            })()}
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>{u.status || 'Aktif'}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      {canEdit && (
                        <td className="py-3.5 px-4 text-center">
                          {isTargetOwner && !isCurrentUserOwner ? (
                            <div className="flex items-center justify-center">
                              <span
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[10px] font-extrabold shadow-2xs"
                                title="Akun Owner dilindungi: Tidak dapat diedit atau dihapus oleh Koordinator maupun pengguna lain."
                              >
                                <Lock className="w-3.5 h-3.5 text-amber-600" />
                                <span>Terkunci</span>
                              </span>
                            </div>
                          ) : isTargetOwner && isCurrentUserOwner ? (
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => openEditModal(u)}
                                className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-600 hover:text-blue-600 transition-colors cursor-pointer"
                                title="Edit Profil Owner Anda"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <span
                                className="p-1.5 text-slate-300 cursor-not-allowed"
                                title="Akun Owner Utama sistem dilindungi dan tidak dapat dihapus."
                              >
                                <Lock className="w-3.5 h-3.5 text-slate-300" />
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => openEditModal(u)}
                                className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-600 hover:text-blue-600 transition-colors cursor-pointer"
                                title="Edit Role & Unit User"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteRequest(u)}
                                className="p-1.5 rounded-lg hover:bg-rose-100 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                title="Hapus User"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
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

      {/* Add / Edit User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 tracking-tight">
                    {editingUser ? 'Edit Hak Akses & Akun User' : 'Tambah User Baru'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Konfigurasi kredensial login, Unit PLN, Kode Unit untuk isolasi data, dan hak akses menu
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 flex flex-col md:grid md:grid-cols-2 md:gap-8 md:space-y-0">
              
              {/* LEFT COLUMN: Account Information, Unit & Credentials */}
              <div className="space-y-5">
                <div className="border-b border-slate-100 pb-2">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">
                    Informasi Akun, Jabatan & Unit
                  </h4>
                </div>

                {formError && (
                  <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold flex items-center gap-2">
                    <XCircle className="w-4 h-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Username */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5 text-xs">
                    Username / ID Pengguna
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Contoh: koordinator_namlea"
                    required
                    disabled={!!editingUser}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-none focus:bg-white focus:border-blue-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all text-xs"
                  />
                  {!editingUser && (
                    <p className="text-[10px] text-slate-500 mt-1">Username bersifat unik dan digunakan untuk login ke sistem.</p>
                  )}
                </div>

                {/* Nama Lengkap */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5 text-xs">
                    Nama Lengkap / Nama Petugas
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Bpk. Ahmad Fauzi"
                    required
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-none focus:bg-white focus:border-blue-500 transition-all text-xs"
                  />
                </div>

                {/* Jabatan / Role */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5 text-xs">
                    Jabatan / Otoritas
                  </label>
                  <select
                    value={role}
                    onChange={(e) => handleRoleChange(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:bg-white focus:border-blue-500 cursor-pointer text-xs"
                  >
                    {isCurrentUserOwner && (
                      <option value="Owner">Owner (Super Admin - Akses Seluruh Unit)</option>
                    )}
                    <option value="Admin Aplikasi">Admin Aplikasi</option>
                    <option value="Koordinator">Koordinator</option>
                    <option value="Admin Teknik">Admin Teknik</option>
                    <option value="Bagian Pemasaran">Bagian Pemasaran</option>
                    <option value="Bagian Transaksi Energi">Bagian Transaksi Energi</option>
                    <option value="Petugas Inspeksi">Petugas Inspeksi</option>
                    <option value="Petugas ROW">Petugas ROW</option>
                    <option value="Bagian Teknik">Bagian Teknik</option>
                    <option value="PLN Nusadaya">PLN Nusadaya</option>
                    <option value="Team Leader">Team Leader</option>
                    <option value="Manager ULP">Manager ULP</option>
                    <option value="UP3">UP3</option>
                    <option value="UIW">UIW</option>
                  </select>
                </div>

                {/* Unit Kerja & Kode Unit Section */}
                <div className="p-3.5 bg-teal-50/50 border border-teal-200 rounded-2xl space-y-3">
                  <div className="flex items-center gap-1.5 text-teal-900 font-bold text-xs">
                    <Building2 className="w-4 h-4 text-teal-700" />
                    <span>Pilihan Unit Kerja & Kode Unit (Multi-Unit)</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Select Unit */}
                    <div>
                      <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                        Pilih Unit Organisasi
                      </label>
                      <select
                        value={isCustomUnit ? 'KUSTOM' : unit}
                        onChange={(e) => handleUnitSelect(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-teal-500 cursor-pointer text-xs"
                      >
                        {(isCurrentUserOwner || role === 'Owner' || role.includes('Owner')) && (
                          <option value="SEMUA UNIT (GLOBAL)">
                            🌟 SEMUA UNIT (Akses Global Owner) - (54000)
                          </option>
                        )}
                        {unitOptions.map((u, idx) => (
                          <option key={`um_form_${u.kodeUnit}_${u.namaUnit}_${idx}`} value={u.namaUnit}>
                            {u.namaUnit} ({u.kodeUnit})
                          </option>
                        ))}
                        <option value="KUSTOM">-- Unit Lainnya (Kustom) --</option>
                      </select>
                    </div>

                    {/* Kode Unit */}
                    <div>
                      <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                        Kode Unit (Data Filter)
                      </label>
                      <div className="relative">
                        <Hash className="w-3.5 h-3.5 text-teal-600 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={kodeUnit}
                          onChange={(e) => setKodeUnit(e.target.value)}
                          placeholder="Contoh: 54120"
                          required
                          className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl font-mono font-bold text-teal-950 focus:outline-none focus:border-teal-500 text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {isCustomUnit && (
                    <div className="pt-1">
                      <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                        Nama Unit Kustom
                      </label>
                      <input
                        type="text"
                        value={customUnit}
                        onChange={(e) => {
                          setCustomUnit(e.target.value);
                          setUnit(e.target.value);
                        }}
                        placeholder="Ketik nama unit baru..."
                        required
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-teal-500"
                      />
                    </div>
                  )}

                  <p className="text-[10px] text-teal-700 leading-relaxed">
                    💡 <strong>Isolasi Data:</strong> Ketika user ini login, hanya data operasional yang bertanda Kode Unit <strong>{kodeUnit || '54110'}</strong> ({isCustomUnit ? customUnit : unit}) yang akan ditampilkan. Hanya <strong>Owner</strong> yang dapat melihat seluruh data semua unit.
                  </p>
                </div>

                {/* Password & Confirm Password */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3.5">
                  <div className="flex items-center gap-1.5 text-slate-800 font-bold">
                    <Key className="w-4 h-4 text-blue-600" />
                    <span>Kredensial Password Masuk</span>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-600 mb-1 text-[11px]">
                      Password Akses
                    </label>
                    <input
                      type="text"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Masukkan password rahasia..."
                      required
                      className="w-full px-3.5 py-1.5 bg-white border border-slate-200 rounded-xl font-mono text-slate-950 focus:outline-none focus:border-blue-500 transition-all text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-600 mb-1 text-[11px]">
                      Ulangi Password
                    </label>
                    <input
                      type="text"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Ketik ulang password di atas..."
                      required
                      className={`w-full px-3.5 py-1.5 bg-white border rounded-xl font-mono text-slate-950 focus:outline-none transition-all text-xs ${
                        confirmPassword && password !== confirmPassword 
                          ? 'border-rose-400 focus:border-rose-500 bg-rose-50/30' 
                          : 'border-slate-200 focus:border-blue-500'
                      }`}
                    />
                    {confirmPassword && password !== confirmPassword && (
                      <p className="text-[10px] text-rose-600 font-bold mt-1">⚠️ Password tidak cocok.</p>
                    )}
                    {confirmPassword && password === confirmPassword && (
                      <p className="text-[10px] text-emerald-600 font-bold mt-1">✓ Password cocok.</p>
                    )}
                  </div>
                </div>

                {/* Profile Photo Avatar Selection */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5 text-xs">
                    Foto Profile Pengguna
                  </label>
                  <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt="Preview"
                        referrerPolicy="no-referrer"
                        className="w-14 h-14 rounded-full object-cover border-2 border-blue-500 shadow-sm shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center text-slate-600 font-extrabold shrink-0 text-sm">
                        {name ? name.substring(0, 2).toUpperCase() : 'US'}
                      </div>
                    )}
                    <div className="flex-1 space-y-1">
                      <label className="inline-flex items-center justify-center px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-[11px] font-bold cursor-pointer transition-all border border-blue-200">
                        <span>📁 Pilih dari File...</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </label>
                      <p className="text-[9px] text-slate-500">Pilih file foto berukuran kecil langsung dari HP/Komputer Anda.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: Granular Menu Access Controls */}
              <div className="space-y-4 flex flex-col">
                <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">
                    Hak Akses Menu Aplikasi
                  </h4>
                  <button
                    type="button"
                    onClick={() => setAllowedMenus([])}
                    className="text-[11px] text-rose-600 hover:text-rose-700 font-bold transition-colors cursor-pointer"
                  >
                    Kosongkan Semua
                  </button>
                </div>

                <p className="text-[11px] text-slate-500 leading-relaxed bg-blue-50/50 p-2.5 rounded-xl border border-blue-100">
                  Pilih menu apa saja yang boleh tampil di navigasi sidebar user ini. Menu yang tidak di-centang akan disembunyikan sepenuhnya dari layar mereka.
                </p>

                {/* List of menus displayed with checkboxes 1-by-1 */}
                <div className="space-y-2.5 overflow-y-auto max-h-[350px] pr-1.5 flex-1 scrollbar-thin">
                  {[
                    { id: 'dashboard', label: 'Dashboard & Beranda Utama', icon: LayoutDashboard, color: 'text-blue-500 bg-blue-50 border-blue-200', desc: 'Halaman ringkasan statistik dan monitoring cepat' },
                    { id: 'peta', label: 'Peta Penyulang & GIS', icon: Map, color: 'text-emerald-500 bg-emerald-50 border-emerald-200', desc: 'Peta spasial jaringan 20kV, trafo, & tracing kaset' },
                    { id: 'master_data', label: 'Master Data Penyulang', icon: Database, color: 'text-purple-500 bg-purple-50 border-purple-200', desc: 'Data inventaris penyulang, section, & SLD Visio' },
                    { id: 'health_index', label: 'Health Index Penyulang', icon: TrendingUp, color: 'text-cyan-500 bg-cyan-50 border-cyan-200', desc: 'Indeks kesehatan trafo & penyulang 20kV' },
                    { id: 'gangguan', label: 'Gangguan Trip Feeder', icon: Zap, color: 'text-amber-500 bg-amber-50 border-amber-200', desc: 'Manajemen data laporan gangguan & trip feeder' },
                    { id: 'pemeliharaan', label: 'Pemeliharaan 20kV (ROW & Inspeksi)', icon: Wrench, color: 'text-rose-500 bg-rose-50 border-rose-200', desc: 'Akses menu Pangkas Pohon (ROW) & checklist Inspeksi Tier 1 & 2' },
                    { id: 'spk', label: 'Format Surat & SPK', icon: FileText, color: 'text-teal-500 bg-teal-50 border-teal-200', desc: 'Pembuatan Perintah Kerja Harian & surat dinas teknik' },
                    { id: 'pengukuran_gardu', label: 'Pengukuran & Beban Gardu', icon: Gauge, color: 'text-orange-500 bg-orange-50 border-orange-200', desc: 'Input & monitor beban trafo serta tegangan ujung gardu' },
                    { id: 'survey_pb_pd', label: 'Survey PB & PD', icon: Zap, color: 'text-yellow-600 bg-yellow-50 border-yellow-200', desc: 'Input hasil survey Pasang Baru & Perubahan Daya' },
                    { id: 'saidi_saifi', label: 'Realisasi & Estimasi SAIDI SAIFI', icon: BarChart3, color: 'text-indigo-500 bg-indigo-50 border-indigo-200', desc: 'Laporan pemadaman, pemulihan, dan indeks keandalan' },
                    { id: 'monitoring_yantek', label: 'Monitoring Yantek', icon: Shield, color: 'text-sky-500 bg-sky-50 border-sky-200', desc: 'Kelola Alker/APD, material, jadwal piket, & kendaraan' },
                    { id: 'share_laporan', label: 'Share Laporan (WA & TG)', icon: Share2, color: 'text-emerald-500 bg-emerald-50 border-emerald-200', desc: 'Kirim rekapitulasi gangguan atau pemeliharaan ke WA/TG' },
                    { id: 'monitoring_online', label: 'Monitoring User Online (Live)', icon: Activity, color: 'text-emerald-500 bg-emerald-50 border-emerald-200', desc: 'Pantau user yang sedang online di aplikasi (Khusus Owner)' },
                    { id: 'kelola_user', label: 'Kelola User & Hak Akses', icon: Users, color: 'text-purple-500 bg-purple-50 border-purple-200', desc: 'Menu pengaturan user login (Hanya untuk Admin/Koordinator/Owner)' }
                  ].map((menu) => {
                    const isChecked = allowedMenus.includes(menu.id);
                    const MenuIcon = menu.icon;
                    return (
                      <label 
                        key={menu.id} 
                        className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                          isChecked 
                            ? 'bg-blue-50/60 border-blue-200 shadow-sm' 
                            : 'bg-white border-slate-200 hover:bg-slate-50/50'
                        }`}
                      >
                        <input 
                          type="checkbox" 
                          checked={isChecked}
                          onChange={() => toggleMenuAllowed(menu.id)}
                          className="mt-1 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <div className={`p-1 rounded-lg border shrink-0 ${menu.color}`}>
                              <MenuIcon className="w-3.5 h-3.5" />
                            </div>
                            <span className="font-bold text-slate-800 text-xs">{menu.label}</span>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-1 leading-normal pl-0.5">{menu.desc}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>

                {/* Permission Category Details */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <span className="block font-bold text-slate-700 text-[11px]">Mode Otoritas Data:</span>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={canEditDataVal} 
                        onChange={(e) => {
                          setCanEditDataVal(e.target.checked);
                          if (e.target.checked) setCanViewDataOnly(false);
                        }} 
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-[11px] font-bold text-slate-800">Mode Editor (Boleh Input/Edit)</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={canViewDataOnly} 
                        onChange={(e) => {
                          setCanViewDataOnly(e.target.checked);
                          if (e.target.checked) setCanEditDataVal(false);
                        }} 
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-[11px] font-bold text-slate-800">Mode Read Only (Hanya Pantau)</span>
                    </label>
                  </div>
                </div>
              </div>

            </form>

            {/* Modal Actions Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <div className="text-left">
                <span className="text-[10px] font-bold text-slate-500 block">UNIT & KODE UNIT:</span>
                <span className="text-[11px] font-black text-slate-800">
                  {isCustomUnit ? customUnit || 'Unit Kustom' : unit} • Kode: {kodeUnit || '54110'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-bold cursor-pointer transition-colors text-xs"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={password !== confirmPassword}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold shadow-md shadow-blue-500/10 cursor-pointer flex items-center gap-1.5 transition-all text-xs"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingUser ? 'Simpan Perubahan' : 'Simpan User Baru'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      {deleteConfirmUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Hapus Akun Pengguna?
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Apakah Anda yakin ingin menghapus akun <strong className="text-slate-800">{deleteConfirmUser.name}</strong> (@{deleteConfirmUser.username}) dengan role <strong className="text-slate-800">{deleteConfirmUser.role}</strong> di unit <strong className="text-slate-800">{deleteConfirmUser.unit}</strong>?
                </p>
                <p className="text-[11px] text-rose-600 font-semibold mt-2 bg-rose-50 p-2.5 rounded-xl border border-rose-100">
                  Tindakan ini permanen dan akan menghapus akses login user tersebut dari sistem.
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmUser(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer w-full"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold text-xs rounded-xl shadow-md shadow-rose-600/20 transition-all cursor-pointer w-full flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Ya, Hapus</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Kustomisasi Latar Belakang Login */}
      <LoginBackgroundModal
        isOpen={isBgModalOpen}
        onClose={() => setIsBgModalOpen(false)}
      />
    </div>
  );
};
