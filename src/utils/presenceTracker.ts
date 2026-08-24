import { User, UserOnlinePresence, ViewType } from '../types';
import { db, doc, setDoc, updateDoc, deleteDoc } from '../lib/firebase';

export const getViewDisplayName = (viewKey: ViewType | string): string => {
  const map: Record<string, string> = {
    dashboard: 'Dashboard Utama',
    monitoring_online: 'Monitoring User Online (Owner)',
    live_chat: 'Live Chat & AI Bot Assistant',
    peta: 'Peta Penyulang & GIS',
    peta_penyulang: 'Peta Jaringan Penyulang',
    peta_pohon: 'Peta ROW & Titik Pohon',
    peta_konstruksi: 'Peta Konstruksi Tiang GIS',
    health_index: 'Health Index Penyulang',
    matriks_gangguan: 'Matriks Gangguan Trip',
    gangguan: 'Laporan Gangguan Feeder',
    row: 'Tebang & Pangkas Pohon (ROW)',
    pemeliharaan: 'Pemeliharaan 20kV & Inspeksi',
    pemeliharaan_20kv: 'Jadwal Pemeliharaan 20kV',
    monitoring_target_realisasi: 'Target & Realisasi Pemeliharaan',
    inspeksi_tier1: 'Inspeksi Tier 1 Visual',
    inspeksi_tier1_jtm: 'Inspeksi Tier 1 JTM',
    inspeksi_tier1_gtt: 'Inspeksi Tier 1 GTT',
    inspeksi_tier1_switching: 'Inspeksi Tier 1 Switching',
    inspeksi_tier2: 'Inspeksi Tier 2 Alat Uji',
    inspeksi_tier2_thermovision: 'Inspeksi Thermovision (Panas)',
    inspeksi_tier2_ultrasound: 'Inspeksi Ultrasound (Corona)',
    perintah_kerja: 'Perintah Kerja Harian (SPK)',
    format_surat: 'Template Format Surat Dinas',
    master_data: 'Master Data Penyulang & Gardu',
    pengukuran_gardu: 'Pengukuran Beban Gardu & Trafo',
    saidi_saifi: 'Realisasi SAIDI & SAIFI',
    estimasi_saidi_saifi: 'Estimasi SAIDI SAIFI Event',
    material: 'Inventaris Stok Material',
    alker_apd: 'Alat Kerja & APD K3',
    kendaraan_operasional: 'Monitoring Kendaraan Operasional',
    jadwal_piket: 'Jadwal Piket Petugas',
    survey_pb_pd: 'Survey Pasang Baru & Tambah Daya',
    share_laporan: 'Share Laporan (WA & TG)',
    kelola_user: 'Kelola User & Hak Akses',
    sld_visio: 'Single Line Diagram (SLD)',
    aset_jaringan: 'Aset Jaringan Distribusi',
    spklu: 'Monitoring SPKLU'
  };
  return map[viewKey] || viewKey;
};

export const getBrowserAndDeviceSummary = (): { deviceInfo: string; browserInfo: string } => {
  if (typeof window === 'undefined') {
    return { deviceInfo: 'Desktop Client', browserInfo: 'Web Browser' };
  }

  const ua = window.navigator.userAgent;
  let deviceInfo = 'Desktop PC';
  if (/Android/i.test(ua)) {
    deviceInfo = 'Smartphone Android';
  } else if (/iPhone|iPad|iPod/i.test(ua)) {
    deviceInfo = 'Apple iOS Device';
  } else if (/Windows NT/i.test(ua)) {
    deviceInfo = 'Windows PC / Laptop';
  } else if (/Macintosh/i.test(ua)) {
    deviceInfo = 'Apple Mac';
  } else if (/Linux/i.test(ua)) {
    deviceInfo = 'Linux Workstation';
  }

  let browserInfo = 'Modern Browser';
  if (/Telegram/i.test(ua)) {
    browserInfo = 'Telegram WebApp';
  } else if (/Edg/i.test(ua)) {
    browserInfo = 'Microsoft Edge';
  } else if (/Chrome/i.test(ua)) {
    browserInfo = 'Google Chrome';
  } else if (/Firefox/i.test(ua)) {
    browserInfo = 'Mozilla Firefox';
  } else if (/Safari/i.test(ua)) {
    browserInfo = 'Apple Safari';
  }

  return { deviceInfo, browserInfo };
};

/**
 * Registers or updates a user's live online presence in Firestore.
 */
export const updatePresenceInFirestore = async (
  user: User,
  activeView: ViewType | string,
  status: 'online' | 'idle' | 'offline' = 'online'
): Promise<void> => {
  if (!user || !user.username) return;

  try {
    const docId = user.id || user.username;
    const { deviceInfo, browserInfo } = getBrowserAndDeviceSummary();
    const nowIso = new Date().toISOString();

    const data: UserOnlinePresence = {
      id: docId,
      userId: docId,
      username: user.username,
      name: user.name || user.username,
      role: user.role || 'Pengguna',
      unit: user.unit || 'ULP Baguala',
      avatarUrl: user.avatarUrl || '',
      loginTime: localStorage.getItem(`pln_login_time_${docId}`) || nowIso,
      lastActive: nowIso,
      activeView: activeView,
      activeViewLabel: getViewDisplayName(activeView),
      deviceInfo,
      browserInfo,
      status
    };

    if (!localStorage.getItem(`pln_login_time_${docId}`)) {
      localStorage.setItem(`pln_login_time_${docId}`, nowIso);
    }

    await setDoc(doc(db, 'online_users', docId), data, { merge: true });
  } catch (err) {
    // Non-blocking catch to prevent UX disruption on network drops
    console.warn('Presence update error (handled):', err);
  }
};

/**
 * Sets user status to offline on logout or close.
 */
export const markPresenceOfflineInFirestore = async (user: User | null | undefined): Promise<void> => {
  if (!user || !user.username) return;
  try {
    const docId = user.id || user.username;
    await updateDoc(doc(db, 'online_users', docId), {
      status: 'offline',
      lastActive: new Date().toISOString()
    });
  } catch (err) {
    console.warn('Offline mark error (handled):', err);
  }
};

/**
 * Calculates human-readable status & active category based on lastActive timestamp.
 */
export const calculatePresenceStatus = (presence: UserOnlinePresence): {
  status: 'online' | 'idle' | 'offline';
  badgeColor: string;
  badgeBg: string;
  badgeBorder: string;
  label: string;
  timeAgoText: string;
} => {
  if (!presence.lastActive) {
    return {
      status: 'offline',
      badgeColor: 'text-slate-400',
      badgeBg: 'bg-slate-100',
      badgeBorder: 'border-slate-300',
      label: 'Offline',
      timeAgoText: 'Tidak aktif'
    };
  }

  const lastActiveTime = new Date(presence.lastActive).getTime();
  const diffMs = Date.now() - lastActiveTime;
  const diffSeconds = Math.max(0, Math.floor(diffMs / 1000));
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);

  let timeAgoText = '';
  if (diffSeconds < 45) {
    timeAgoText = 'Baru saja';
  } else if (diffMinutes < 60) {
    timeAgoText = `${diffMinutes} menit lalu`;
  } else if (diffHours < 24) {
    timeAgoText = `${diffHours} jam lalu`;
  } else {
    timeAgoText = new Date(presence.lastActive).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // If explicit offline state in doc
  if (presence.status === 'offline') {
    return {
      status: 'offline',
      badgeColor: 'text-slate-500',
      badgeBg: 'bg-slate-100',
      badgeBorder: 'border-slate-300',
      label: 'Offline / Keluar',
      timeAgoText: `Terakhir: ${timeAgoText}`
    };
  }

  // Within 3 minutes = Active Online
  if (diffMinutes < 3) {
    return {
      status: 'online',
      badgeColor: 'text-emerald-700',
      badgeBg: 'bg-emerald-50',
      badgeBorder: 'border-emerald-300',
      label: 'Online Sekarang',
      timeAgoText: `Aktif: ${timeAgoText}`
    };
  }

  // Between 3 and 10 minutes = Idle / AFK
  if (diffMinutes < 10) {
    return {
      status: 'idle',
      badgeColor: 'text-amber-700',
      badgeBg: 'bg-amber-50',
      badgeBorder: 'border-amber-300',
      label: 'Idle / Tidak Aktif',
      timeAgoText: `Terakhir: ${timeAgoText}`
    };
  }

  // More than 10 minutes = Offline
  return {
    status: 'offline',
    badgeColor: 'text-slate-500',
    badgeBg: 'bg-slate-100',
    badgeBorder: 'border-slate-300',
    label: 'Offline',
    timeAgoText: `Terakhir: ${timeAgoText}`
  };
};
