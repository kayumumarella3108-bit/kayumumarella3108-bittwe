import { User } from '../types';

/**
 * Checks whether the logged-in user has the 'Owner' status / role.
 * Only Owner can see the real-time online user monitoring.
 */
export const isOwnerUser = (user: User | null | undefined): boolean => {
  if (!user) return false;
  if (user.isOwner === true) return true;
  const usernameLower = (user.username || '').toLowerCase().trim();
  if (usernameLower === 'owner') return true;
  const roleLower = (user.role || '').toLowerCase().trim();
  return roleLower === 'owner' || roleLower.includes('owner') || roleLower.includes('super admin');
};

/**
 * Checks whether the logged-in user belongs to Bagian Pemasaran.
 * User Pemasaran can ONLY access Survey PB/PD & WO Survey.
 */
export const isPemasaranUser = (user: User | null | undefined): boolean => {
  if (!user || !user.role) return false;
  const roleLower = user.role.toLowerCase().trim();
  return roleLower.includes('pemasaran');
};

export const isPetugasRowUser = (user: User | null | undefined): boolean => {
  if (!user || !user.role) return false;
  const roleLower = user.role.toLowerCase().trim();
  return roleLower.includes('row') || roleLower.includes('pohon');
};

/**
 * Checks whether the logged-in user belongs to Bagian Inspeksi / Teknik.
 * Inspection user sees inspection modules and PB/PD survey parameters onwards.
 */
export const isInspeksiUser = (user: User | null | undefined): boolean => {
  if (!user || !user.role) return false;
  const roleLower = user.role.toLowerCase().trim();
  return roleLower.includes('inspeksi') || roleLower.includes('teknik');
};

/**
 * Checks whether the logged-in user belongs to Bagian Transaksi Energi (TE).
 */
export const isTransaksiEnergiUser = (user: User | null | undefined): boolean => {
  if (!user || !user.role) return false;
  const roleLower = user.role.toLowerCase().trim();
  return roleLower.includes('transaksi energi') || roleLower.includes('transaksi_energi') || roleLower.includes('transaksi');
};

/**
 * Checks whether the logged-in user has permission to manage users (create, edit, delete users).
 * - Owner: Full access to user management
 * - Koordinator / Admin System: Can manage users and edit operational data.
 * - Admin Teknik: Can input/edit operational data ONLY, CANNOT manage or create users.
 */
export const canManageUsers = (user: User | null | undefined): boolean => {
  if (!user) return false;
  if (isOwnerUser(user)) return true;
  if (!user.role) return false;
  const roleLower = user.role.toLowerCase().trim();
  return roleLower.includes('koordinator') || roleLower.includes('admin system') || roleLower.includes('admin aplikasi');
};

/**
 * Checks whether the logged-in user has permission to add, edit, or delete operational data.
 * Roles with edit/entry permissions:
 *  - Owner (Full Access)
 *  - Koordinator
 *  - Admin Teknik (Entri data operasional)
 *  - Admin System
 *  - Bagian Pemasaran (Entri Permohonan WO PB/PD)
 *  - Bagian Transaksi Energi (Entri data teknis & pengukuran)
 */
export const canEditData = (user: User | null | undefined): boolean => {
  if (!user) return false;
  if (isOwnerUser(user)) return true;
  
  // 1. If explicit permissions object defined on user, respect it
  if (user.permissions) {
    if (user.permissions.canViewDataOnly === true) {
      return false;
    }
    if (typeof user.permissions.canEditData === 'boolean') {
      return user.permissions.canEditData;
    }
  }

  if (!user.role) return false;
  const roleLower = user.role.toLowerCase().trim();
  
  // Upper management roles default to Read-Only monitoring unless explicitly enabled
  if (roleLower.includes('manager') || roleLower.includes('up3') || roleLower.includes('uiw')) {
    return false;
  }

  return (
    roleLower.includes('koordinator') ||
    roleLower.includes('admin teknik') ||
    roleLower.includes('admin system') ||
    roleLower.includes('pemasaran') ||
    roleLower.includes('transaksi') ||
    roleLower.includes('inspeksi') ||
    roleLower.includes('row') ||
    roleLower.includes('pohon') ||
    roleLower === 'admin'
  );
};

export const canEditModule = (user: User | null | undefined, moduleName: string): boolean => {
  if (!user) return false;
  if (isOwnerUser(user)) return true;
  
  // Check if user has write access at all
  if (!canEditData(user)) return false;

  const roleLower = (user.role || '').toLowerCase().trim();
  const mod = moduleName.toLowerCase();

  // Bagian Pemasaran is strictly limited to survey_pb_pd
  if (isPemasaranUser(user)) {
    return mod === 'survey_pb_pd' || mod === 'wo_survey';
  }

  // Petugas ROW is strictly limited to row / peta_pohon
  if (isPetugasRowUser(user)) {
    return mod === 'row' || mod === 'peta_pohon';
  }

  // Petugas Inspeksi / Teknik can edit operational & inspection modules except user management
  if (isInspeksiUser(user)) {
    if (mod === 'kelola_user' || mod === 'users' || mod === 'user_management') return false;
    return true;
  }

  if (roleLower.includes('koordinator') || roleLower.includes('admin system') || roleLower === 'admin') {
    return true;
  }

  if (roleLower.includes('admin teknik') || isTransaksiEnergiUser(user)) {
    // Cannot manage users
    if (mod === 'kelola_user' || mod === 'users' || mod === 'user_management') return false;
    return true;
  }

  return false;
};

export const getRoleCategory = (userOrRole: User | string): 'Edit & Entri Data' | 'Monitoring Read-Only' => {
  const userObj: User = typeof userOrRole === 'string' ? { username: '', name: '', role: userOrRole } : userOrRole;
  if (canEditData(userObj)) {
    return 'Edit & Entri Data';
  }
  return 'Monitoring Read-Only';
};

export const canAccessMenu = (user: User | null | undefined, menuKey: string): boolean => {
  if (!user) return false;

  // Dashboard is accessible to everyone
  if (menuKey === 'dashboard') {
    return true;
  }

  // STRICT REQUIREMENT: Master Data Unit & Online User Monitoring are ONLY accessible by users with status/role 'owner'
  if (menuKey === 'master_unit' || menuKey === 'monitoring_online' || menuKey === 'online_users') {
    return isOwnerUser(user);
  }

  // Live Chat, AI Bot, Help Desk & Kalkulator Listrik is accessible to all logged-in users
  if (menuKey === 'live_chat' || menuKey === 'chat' || menuKey === 'kalkulator_listrik' || menuKey === 'kalkulator' || menuKey === 'helpdesk' || menuKey === 'help_desk' || menuKey === 'inbox') {
    return true;
  }

  // Owner has access to all application views
  if (isOwnerUser(user)) {
    return true;
  }

  // 1. Check if explicit allowedMenus is defined for the user (Source of truth from User Management)
  if (user.allowedMenus && Array.isArray(user.allowedMenus)) {
    if (user.allowedMenus.length === 0) return false;
    
    // Direct match
    if (user.allowedMenus.includes(menuKey)) return true;
    
    // Check key aliases
    if ((menuKey === 'matriks_gangguan' || menuKey === 'gangguan') && (user.allowedMenus.includes('gangguan') || user.allowedMenus.includes('matriks_gangguan'))) return true;
    if ((menuKey === 'peta_penyulang' || menuKey === 'peta_pohon' || menuKey === 'peta_konstruksi' || menuKey === 'peta') && (user.allowedMenus.includes('peta') || user.allowedMenus.includes('peta_penyulang'))) return true;
    if ((menuKey === 'master_data' || menuKey === 'aset_jaringan' || menuKey === 'sld_visio' || menuKey === 'input_peta_penyulang' || menuKey === 'master_data_group') && (user.allowedMenus.includes('master_data') || user.allowedMenus.includes('aset_jaringan') || user.allowedMenus.includes('master_data_group'))) return true;
    if (menuKey === 'health_index' && (user.allowedMenus.includes('health_index') || user.allowedMenus.includes('master_data') || user.allowedMenus.includes('teknik'))) return true;
    if ((menuKey === 'row' || menuKey.startsWith('inspeksi_') || menuKey === 'pemeliharaan_20kv' || menuKey === 'monitoring_target_realisasi' || menuKey === 'pemeliharaan') && (user.allowedMenus.includes('pemeliharaan') || user.allowedMenus.includes('row') || user.allowedMenus.includes('inspeksi') || user.allowedMenus.includes('teknik'))) return true;
    if ((menuKey === 'perintah_kerja' || menuKey === 'format_surat' || menuKey === 'ba_pemeriksaan_iml' || menuKey === 'spk') && (user.allowedMenus.includes('spk') || user.allowedMenus.includes('perintah_kerja') || user.allowedMenus.includes('format_surat') || user.allowedMenus.includes('ba_pemeriksaan_iml'))) return true;
    if (menuKey === 'pengukuran_gardu' && (user.allowedMenus.includes('pengukuran_gardu') || user.allowedMenus.includes('beban_gardu') || user.allowedMenus.includes('teknik'))) return true;
    if ((menuKey === 'survey_pb_pd' || menuKey === 'wo_survey' || menuKey === 'pemasaran') && (user.allowedMenus.includes('survey_pb_pd') || user.allowedMenus.includes('survey') || user.allowedMenus.includes('pemasaran'))) return true;
    if ((menuKey === 'saidi_saifi' || menuKey === 'estimasi_saidi_saifi') && (user.allowedMenus.includes('saidi_saifi') || user.allowedMenus.includes('estimasi_saidi_saifi') || user.allowedMenus.includes('teknik'))) return true;
    if ((menuKey === 'matriks_gangguan' || menuKey === 'gangguan') && (user.allowedMenus.includes('gangguan') || user.allowedMenus.includes('matriks_gangguan') || user.allowedMenus.includes('teknik'))) return true;
    if ((menuKey === 'alker_apd' || menuKey === 'k3l' || menuKey === 'material' || menuKey === 'gudang_material' || menuKey === 'jadwal_piket' || menuKey === 'kendaraan_operasional' || menuKey === 'yantek' || menuKey === 'monitoring_yantek') && (user.allowedMenus.includes('monitoring_yantek') || user.allowedMenus.includes('yantek') || user.allowedMenus.includes('material') || user.allowedMenus.includes('gudang_material') || user.allowedMenus.includes('alker_apd') || user.allowedMenus.includes('k3l'))) return true;
    if ((menuKey === 'transaksi_energi' || menuKey === 'peremajaan_meter' || menuKey === 'meter_sl' || menuKey === 'monitoring_susut') && (user.allowedMenus.includes('transaksi_energi') || user.allowedMenus.includes('peremajaan_meter') || user.allowedMenus.includes('meter_sl') || user.allowedMenus.includes('monitoring_susut') || user.allowedMenus.includes('transaksi'))) return true;
    if (menuKey === 'share_laporan' && (user.allowedMenus.includes('share_laporan') || user.allowedMenus.includes('share'))) return true;
    if ((menuKey === 'kelola_user' || menuKey === 'users') && (user.allowedMenus.includes('kelola_user') || user.allowedMenus.includes('users'))) return true;
    
    return false;
  }

  // 2. Fallback default access for legacy accounts without explicit allowedMenus array:
  const roleLower = (user.role || '').toLowerCase().trim();
  if (roleLower.includes('koordinator') || roleLower.includes('admin system') || roleLower === 'admin' || roleLower === 'admin aplikasi') {
    return true;
  }
  if (isPemasaranUser(user)) {
    return menuKey === 'survey_pb_pd' || menuKey === 'dashboard';
  }
  if (isPetugasRowUser(user)) {
    return menuKey === 'pemeliharaan' || menuKey === 'row' || menuKey === 'peta' || menuKey === 'peta_pohon';
  }

  if (menuKey === 'kelola_user') return false;
  return true;
};


