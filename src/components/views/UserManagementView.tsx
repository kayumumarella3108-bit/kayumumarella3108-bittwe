import React, { useState, useRef } from 'react';
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
  Hash,
  Camera,
  Upload,
  Image as ImageIcon,
  Trees,
  Radio,
  Receipt,
  ZapOff,
  FileCheck,
  Wallet,
  HardHat,
  Scale,
  TrendingDown,
  Package,
  Calculator,
  Calendar,
  Clock,
  CheckSquare,
  Square,
  Sparkles,
  Link as LinkIcon
} from 'lucide-react';
import { User, MasterUnitPLN } from '../../types';
import { canEditData, canManageUsers, getRoleCategory, isOwnerUser } from '../../utils/permissions';
import { LoginBackgroundModal } from '../LoginBackgroundModal';
import { DAFTAR_UNIT_PLN, getKodeUnitByUnitName, getDynamicUnitList, DEFAULT_UNIT, DEFAULT_KODE_UNIT } from '../../utils/unitConfig';

export interface MenuDefinition {
  id: string;
  label: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  badgeBg: string;
  ownerOnly?: boolean;
}

export interface MenuCategoryGroup {
  id: string;
  category: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  items: MenuDefinition[];
}

export const MENU_CATEGORIES_CONFIG: MenuCategoryGroup[] = [
  {
    id: 'cat_dashboard',
    category: '1. Dashboard & Navigasi',
    description: 'Beranda utama dan diagram kendali operasi sistem',
    icon: LayoutDashboard,
    color: 'text-blue-600 bg-blue-50 border-blue-200',
    items: [
      {
        id: 'dashboard',
        label: 'Dashboard Utama',
        desc: 'Ringkasan performa sistem, indikator keandalan, dan monitoring cepat',
        icon: LayoutDashboard,
        color: 'text-blue-500 bg-blue-50 border-blue-200',
        badgeBg: 'bg-blue-50 text-blue-700 border-blue-200'
      },
      {
        id: 'dcc',
        label: 'Mini DCC',
        desc: 'Interactive Single Line Diagram (SLD) 20kV dan telemetri penyulang',
        icon: Radio,
        color: 'text-emerald-500 bg-emerald-50 border-emerald-200',
        badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200'
      }
    ]
  },
  {
    id: 'cat_master_data',
    category: '2. Master Data Jaringan',
    description: 'Database inventaris teknis penyulang, trafo, pelanggan, dan unit PLN',
    icon: Database,
    color: 'text-purple-600 bg-purple-50 border-purple-200',
    items: [
      {
        id: 'master_data',
        label: 'Master Data Penyulang',
        desc: 'Data inventaris feeder 20kV, segmen section, gardu hubung & SLD',
        icon: Database,
        color: 'text-purple-500 bg-purple-50 border-purple-200',
        badgeBg: 'bg-purple-50 text-purple-700 border-purple-200'
      },
      {
        id: 'input_peta_penyulang',
        label: 'Input Peta Penyulang',
        desc: 'Import & digitasi jalur kaset GIS, koordinat kml/geojson penyulang',
        icon: Upload,
        color: 'text-indigo-500 bg-indigo-50 border-indigo-200',
        badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200'
      },
      {
        id: 'master_pelanggan',
        label: 'Master Data Pelanggan',
        desc: 'Database pelanggan, IDPEL, golongan tarif, dan daya kontrak',
        icon: Users,
        color: 'text-amber-500 bg-amber-50 border-amber-200',
        badgeBg: 'bg-amber-50 text-amber-700 border-amber-200'
      },
      {
        id: 'master_unit',
        label: 'Master Data Unit PLN (Owner)',
        desc: 'Kelola hierarki UIW, UP3, ULP, dan pemetaan Kode Unit (Khusus Owner)',
        icon: Building2,
        color: 'text-amber-600 bg-amber-50 border-amber-300',
        badgeBg: 'bg-amber-50 text-amber-800 border-amber-300',
        ownerOnly: true
      }
    ]
  },
  {
    id: 'cat_peta',
    category: '3. Peta Spasial & GIS',
    description: 'Peta digital interaktif jaringan distribusi 20kV dan aset lapangan',
    icon: Map,
    color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    items: [
      {
        id: 'peta_penyulang',
        label: 'Peta Penyulang',
        desc: 'Peta spasial jaringan 20kV, trafo, recloser, section & tracing jalur kaset',
        icon: Map,
        color: 'text-emerald-500 bg-emerald-50 border-emerald-200',
        badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200'
      },
      {
        id: 'peta_gardu',
        label: 'Peta Gardu',
        desc: 'Peta sebaran gardu distribusi, no gardu baru/lama, dan beban trafo',
        icon: Gauge,
        color: 'text-cyan-500 bg-cyan-50 border-cyan-200',
        badgeBg: 'bg-cyan-50 text-cyan-700 border-cyan-200'
      },
      {
        id: 'peta_pohon',
        label: 'Peta Pohon GIS',
        desc: 'Peta titik potensi pohon rawan sentuh ROW & riwayat eksekusi pangkas',
        icon: Trees,
        color: 'text-green-500 bg-green-50 border-green-200',
        badgeBg: 'bg-green-50 text-green-700 border-green-200'
      }
    ]
  },
  {
    id: 'cat_pemasaran',
    category: '4. Pemasaran & Pelayanan',
    description: 'Layanan penyambungan baru dan penambahan daya',
    icon: Zap,
    color: 'text-amber-600 bg-amber-50 border-amber-200',
    items: [
      {
        id: 'survey_pb_pd',
        label: 'Survey PB & PD',
        desc: 'Input dan monitoring hasil survey Pasang Baru & Perubahan Daya',
        icon: Zap,
        color: 'text-amber-500 bg-amber-50 border-amber-200',
        badgeBg: 'bg-yellow-50 text-yellow-800 border-yellow-200'
      }
    ]
  },
  {
    id: 'cat_k3l',
    category: '5. K3L & Keselamatan Kerja',
    description: 'Keselamatan, kesehatan kerja, lingkungan hidup, dan pengamanan instalasi',
    icon: ShieldCheck,
    color: 'text-teal-600 bg-teal-50 border-teal-200',
    items: [
      {
        id: 'jadwal_security',
        label: 'Jadwal Security',
        desc: 'Jadwal piket keamanan posko kantor dan instalasi kelistrikan',
        icon: ShieldCheck,
        color: 'text-teal-500 bg-teal-50 border-teal-200',
        badgeBg: 'bg-teal-50 text-teal-700 border-teal-200'
      },
      {
        id: 'alker_apd',
        label: 'APD & Alat Kerja',
        desc: 'Inventarisasi dan kelayakan APD, alat uji tegangan, dan alker yantek',
        icon: HardHat,
        color: 'text-sky-500 bg-sky-50 border-sky-200',
        badgeBg: 'bg-sky-50 text-sky-700 border-sky-200'
      },
      {
        id: 'patroli_kelistrikan',
        label: 'Patroli Kelistrikan',
        desc: 'Inspeksi keselamatan publik dan pencegahan bahaya sentuh listrik',
        icon: Activity,
        color: 'text-emerald-500 bg-emerald-50 border-emerald-200',
        badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200'
      }
    ]
  },
  {
    id: 'cat_teknik',
    category: '6. Teknik & Keandalan 20kV',
    description: 'Manajemen gangguan feeder, indeks kesehatan, dan keandalan sistem',
    icon: Wrench,
    color: 'text-rose-600 bg-rose-50 border-rose-200',
    items: [
      {
        id: 'matriks_gangguan',
        label: 'Gangguan Trip Feeder',
        desc: 'Pencatatan gangguan trip penyulang, penyebab, relay OCR/GFR & recovery',
        icon: Zap,
        color: 'text-amber-500 bg-amber-50 border-amber-200',
        badgeBg: 'bg-amber-50 text-amber-700 border-amber-200'
      },
      {
        id: 'pemeliharaan_20kv',
        label: 'Monitoring Pemeliharaan',
        desc: 'Rekapitulasi target & realisasi pemeliharaan preventif 20kV bulanan',
        icon: Wrench,
        color: 'text-rose-500 bg-rose-50 border-rose-200',
        badgeBg: 'bg-rose-50 text-rose-700 border-rose-200'
      },
      {
        id: 'saidi_saifi',
        label: 'Realisasi SAIDI SAIFI',
        desc: 'Perhitungan indeks durasi dan frekuensi padam pelanggan per feeder',
        icon: BarChart3,
        color: 'text-indigo-500 bg-indigo-50 border-indigo-200',
        badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200'
      },
      {
        id: 'health_index',
        label: 'Healthy Index Penyulang',
        desc: 'Kalkulasi skor kesehatan trafo, kabel tanah, dan isolasi jaringan',
        icon: TrendingUp,
        color: 'text-cyan-500 bg-cyan-50 border-cyan-200',
        badgeBg: 'bg-cyan-50 text-cyan-700 border-cyan-200'
      },
      {
        id: 'pengukuran_gardu',
        label: 'Gardu Distribusi & Beban',
        desc: 'Pencatatan beban trafo (Ampere), persentase pembebanan, & tegangan ujung TR',
        icon: Gauge,
        color: 'text-orange-500 bg-orange-50 border-orange-200',
        badgeBg: 'bg-orange-50 text-orange-700 border-orange-200'
      }
    ]
  },
  {
    id: 'cat_transaksi_energi',
    category: '7. Transaksi Energi',
    description: 'Manajemen peremajaan kWh meter, sambungan langsung, dan neraca susut',
    icon: Activity,
    color: 'text-cyan-600 bg-cyan-50 border-cyan-200',
    items: [
      {
        id: 'peremajaan_meter',
        label: 'Peremajaan Meter',
        desc: 'Perekaman meter kadaluarsa/buram, sampling tera, dan penggantian meter',
        icon: RefreshCw,
        color: 'text-cyan-500 bg-cyan-50 border-cyan-200',
        badgeBg: 'bg-cyan-50 text-cyan-700 border-cyan-200'
      },
      {
        id: 'meter_sl',
        label: 'Meter Sambungan Langsung (SL)',
        desc: 'Monitoring transaksi kWh meter sambungan langsung pelanggan besar',
        icon: Scale,
        color: 'text-amber-500 bg-amber-50 border-amber-200',
        badgeBg: 'bg-amber-50 text-amber-700 border-amber-200'
      },
      {
        id: 'monitoring_susut',
        label: 'Monitoring Susut Energi',
        desc: 'Neraca energi kWh kirim vs kWh jual serta analisis susut jaringan',
        icon: TrendingDown,
        color: 'text-emerald-500 bg-emerald-50 border-emerald-200',
        badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200'
      }
    ]
  },
  {
    id: 'cat_admin_teknik',
    category: '8. Admin Teknik & SPK',
    description: 'Penerbitan surat perintah kerja, format surat dinas, dan cash flow',
    icon: FileText,
    color: 'text-teal-600 bg-teal-50 border-teal-200',
    items: [
      {
        id: 'perintah_kerja',
        label: 'Perintah Kerja (SPK)',
        desc: 'Penerbitan SPK harian, disposisi regu, dan notifikasi otomatis WhatsApp',
        icon: FileCheck,
        color: 'text-teal-500 bg-teal-50 border-teal-200',
        badgeBg: 'bg-teal-50 text-teal-700 border-teal-200'
      },
      {
        id: 'format_surat',
        label: 'Format Surat Keluar',
        desc: 'Generator surat dinas teknik, pemberitahuan pemadaman, dan izin ROW',
        icon: FileText,
        color: 'text-blue-500 bg-blue-50 border-blue-200',
        badgeBg: 'bg-blue-50 text-blue-700 border-blue-200'
      },
      {
        id: 'cash_flow_bop',
        label: 'Cash Flow BOP',
        desc: 'Catatan arus kas anggaran operasional teknik ULP',
        icon: Wallet,
        color: 'text-amber-500 bg-amber-50 border-amber-200',
        badgeBg: 'bg-amber-50 text-amber-700 border-amber-200'
      }
    ]
  },
  {
    id: 'cat_yantek',
    category: '9. Yantek & Inspeksi Lapangan',
    description: 'Pelayanan teknik, pemotongan ROW, inspeksi Tier 1 & 2, dan jadwal regu',
    icon: HardHat,
    color: 'text-green-600 bg-green-50 border-green-200',
    items: [
      {
        id: 'row',
        label: 'Realisasi ROW',
        desc: 'Input laporan eksekusi tebang dan pangkas pohon span SUTM 20kV',
        icon: Trees,
        color: 'text-emerald-500 bg-emerald-50 border-emerald-200',
        badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200'
      },
      {
        id: 'inspeksi_tier1',
        label: 'Temuan Inspeksi Pohon & Tier 1',
        desc: 'Pencatatan temuan inspeksi visual pohon dan konstruksi jaringan',
        icon: Search,
        color: 'text-amber-500 bg-amber-50 border-amber-200',
        badgeBg: 'bg-amber-50 text-amber-700 border-amber-200'
      },
      {
        id: 'inspeksi_tier1_jtm',
        label: 'Inspeksi Konstruksi JTM',
        desc: 'Checklist tiang retak, isolator flashover, crossarm miring, dan jumperan',
        icon: Search,
        color: 'text-teal-500 bg-teal-50 border-teal-200',
        badgeBg: 'bg-teal-50 text-teal-700 border-teal-200'
      },
      {
        id: 'inspeksi_tier1_gtt',
        label: 'Inspeksi Konstruksi GTT',
        desc: 'Checklist kondisi fisik gardu trafo tiang, arrester, grounding & fuse',
        icon: Search,
        color: 'text-teal-500 bg-teal-50 border-teal-200',
        badgeBg: 'bg-teal-50 text-teal-700 border-teal-200'
      },
      {
        id: 'inspeksi_tier1_switching',
        label: 'Inspeksi Switching',
        desc: 'Checklist peralatan switching LBS, Recloser, Sectionalizer & FCO',
        icon: Search,
        color: 'text-teal-500 bg-teal-50 border-teal-200',
        badgeBg: 'bg-teal-50 text-teal-700 border-teal-200'
      },
      {
        id: 'inspeksi_tier2_thermovision',
        label: 'Inspeksi Thermovision',
        desc: 'Hasil pengukuran temperatur sambungan klem jumperan dengan kamera infra-merah',
        icon: Search,
        color: 'text-rose-500 bg-rose-50 border-rose-200',
        badgeBg: 'bg-rose-50 text-rose-700 border-rose-200'
      },
      {
        id: 'inspeksi_tier2_ultrasound',
        label: 'Inspeksi Ultrasound',
        desc: 'Deteksi kebocoran isolasi dan partial discharge pada isolator/arrester',
        icon: Search,
        color: 'text-sky-500 bg-sky-50 border-sky-200',
        badgeBg: 'bg-sky-50 text-sky-700 border-sky-200'
      },
      {
        id: 'jadwal_piket',
        label: 'Jadwal Piket Petugas',
        desc: 'Pengaturan jadwal shift regu yantek posko 24 jam',
        icon: Calendar,
        color: 'text-indigo-500 bg-indigo-50 border-indigo-200',
        badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200'
      },
      {
        id: 'monitoring_lembur',
        label: 'Monitoring Lembur',
        desc: 'Pengajuan dan persetujuan lembur penanganan gangguan & pekerjaan khusus',
        icon: Clock,
        color: 'text-amber-500 bg-amber-50 border-amber-200',
        badgeBg: 'bg-amber-50 text-amber-700 border-amber-200'
      }
    ]
  },
  {
    id: 'cat_manbill',
    category: '10. Manbill (Manajemen Billing)',
    description: 'Manajemen penagihan, tusbung, dan perekaman foto stan meter',
    icon: Receipt,
    color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    items: [
      {
        id: 'pembagian_invoice',
        label: 'Pembagian Invoice',
        desc: 'Distribusi data invoice rekening listrik ke petugas lapangan',
        icon: Receipt,
        color: 'text-amber-500 bg-amber-50 border-amber-200',
        badgeBg: 'bg-amber-50 text-amber-700 border-amber-200'
      },
      {
        id: 'realisasi_tusbung',
        label: 'Realisasi Tusbung',
        desc: 'Pencatatan tindakan pemutusan & penyambungan kembali pelanggan nunggak',
        icon: ZapOff,
        color: 'text-rose-500 bg-rose-50 border-rose-200',
        badgeBg: 'bg-rose-50 text-rose-700 border-rose-200'
      },
      {
        id: 'foto_meter',
        label: 'Foto Stan Meter',
        desc: 'Perekaman dan validasi foto angka stan kWh meter pelanggan',
        icon: Camera,
        color: 'text-emerald-500 bg-emerald-50 border-emerald-200',
        badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200'
      }
    ]
  },
  {
    id: 'cat_gudang_alat',
    category: '11. Gudang Material & Utilitas',
    description: 'Stok material distribusi, simulasi perhitungan tarif, dan share laporan',
    icon: Package,
    color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
    items: [
      {
        id: 'material',
        label: 'Gudang Material',
        desc: 'Manajemen stok masuk, keluar, dan saldo material distribusi',
        icon: Package,
        color: 'text-indigo-500 bg-indigo-50 border-indigo-200',
        badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200'
      },
      {
        id: 'kalkulator_listrik',
        label: 'Kalkulator Listrik',
        desc: 'Kalkulator simulasi tarif, daya, rekening listrik, dan rumus teknik',
        icon: Calculator,
        color: 'text-amber-500 bg-amber-50 border-amber-200',
        badgeBg: 'bg-amber-50 text-amber-700 border-amber-200'
      },
      {
        id: 'share_laporan',
        label: 'Share Laporan (WA & TG)',
        desc: 'Format teks otomatis untuk sharing laporan gangguan / pemeliharaan ke WA & TG',
        icon: Share2,
        color: 'text-emerald-500 bg-emerald-50 border-emerald-200',
        badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200'
      }
    ]
  },
  {
    id: 'cat_sistem',
    category: '12. Pengaturan Sistem & Akses',
    description: 'Otorisasi user login dan pemantauan pengguna online secara langsung',
    icon: Users,
    color: 'text-purple-600 bg-purple-50 border-purple-200',
    items: [
      {
        id: 'kelola_user',
        label: 'Kelola User & Hak Akses',
        desc: 'Pengaturan akun user, role, unit kerja, isolasi data, dan hak akses menu',
        icon: Users,
        color: 'text-purple-500 bg-purple-50 border-purple-200',
        badgeBg: 'bg-purple-50 text-purple-700 border-purple-200'
      },
      {
        id: 'monitoring_online',
        label: 'Monitoring User Online (Owner)',
        desc: 'Pantau user yang sedang online di aplikasi secara realtime (Khusus Owner)',
        icon: Activity,
        color: 'text-emerald-500 bg-emerald-50 border-emerald-200',
        badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        ownerOnly: true
      }
    ]
  }
];

// Helper to look up badge properties
const getMenuBadgeProps = (menuId: string) => {
  for (const group of MENU_CATEGORIES_CONFIG) {
    const found = group.items.find((it) => it.id === menuId);
    if (found) {
      return { label: found.label, bg: found.badgeBg };
    }
  }
  // Fallbacks for common legacy aliases
  switch (menuId) {
    case 'peta':
      return { label: 'Peta Penyulang', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    case 'gangguan':
      return { label: 'Gangguan 20kV', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
    case 'pemeliharaan':
      return { label: 'Pemeliharaan', bg: 'bg-rose-50 text-rose-700 border-rose-200' };
    case 'spk':
      return { label: 'Perintah Kerja (SPK)', bg: 'bg-teal-50 text-teal-700 border-teal-200' };
    case 'monitoring_yantek':
      return { label: 'Yantek', bg: 'bg-sky-50 text-sky-700 border-sky-200' };
    case 'transaksi_energi':
      return { label: 'Transaksi Energi', bg: 'bg-cyan-50 text-cyan-700 border-cyan-200' };
    case 'manbill':
      return { label: 'Manbill', bg: 'bg-yellow-50 text-yellow-800 border-yellow-200' };
    case 'k3l':
      return { label: 'K3L', bg: 'bg-teal-50 text-teal-700 border-teal-200' };
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
  const [activeTabCat, setActiveTabCat] = useState<string>('ALL');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUrlInputOpen, setIsUrlInputOpen] = useState(false);
  const [customAvatarUrlInput, setCustomAvatarUrlInput] = useState('');

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
  const [isCompressingImage, setIsCompressingImage] = useState(false);

  // Strict check: only Koordinator / System Admin / Owner can add/edit/delete users
  const canEdit = canManageUsers(currentUser);

  const PRESET_AVATARS = [
    { label: 'Teknisi 1', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
    { label: 'Engineer', url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80' },
    { label: 'Manager', url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80' },
    { label: 'Staf Teknik', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' },
    { label: 'Supervisor', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80' },
    { label: 'Operator', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80' }
  ];

  // Client-side image compression to keep Firestore payload lightweight (<50KB)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressingImage(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 256;
        const MAX_HEIGHT = 256;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setAvatarUrl(compressedDataUrl);
        }
        setIsCompressingImage(false);
      };
      img.onerror = () => {
        setIsCompressingImage(false);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleApplyUrlAvatar = () => {
    if (customAvatarUrlInput.trim()) {
      setAvatarUrl(customAvatarUrlInput.trim());
      setCustomAvatarUrlInput('');
      setIsUrlInputOpen(false);
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
      const matched = unitOptions.find((u) => u.namaUnit === selectedVal);
      const code = matched ? matched.kodeUnit : getKodeUnitByUnitName(selectedVal, masterUnitList);
      setKodeUnit(code);
    }
  };

  // Comprehensive role presets corresponding to current app navigation
  const getMenuPresetsForRole = (roleName: string): string[] => {
    const roleLower = roleName.toLowerCase().trim();

    // 1. Owner: Full access to everything
    if (roleLower === 'owner' || roleLower.includes('owner')) {
      return [
        'dashboard',
        'dcc',
        'master_data',
        'input_peta_penyulang',
        'master_pelanggan',
        'master_unit',
        'peta_penyulang',
        'peta_gardu',
        'peta_pohon',
        'survey_pb_pd',
        'jadwal_security',
        'alker_apd',
        'patroli_kelistrikan',
        'matriks_gangguan',
        'pemeliharaan_20kv',
        'saidi_saifi',
        'health_index',
        'pengukuran_gardu',
        'peremajaan_meter',
        'meter_sl',
        'monitoring_susut',
        'perintah_kerja',
        'format_surat',
        'cash_flow_bop',
        'row',
        'inspeksi_tier1',
        'inspeksi_tier1_jtm',
        'inspeksi_tier1_gtt',
        'inspeksi_tier1_switching',
        'inspeksi_tier2_thermovision',
        'inspeksi_tier2_ultrasound',
        'jadwal_piket',
        'monitoring_lembur',
        'pembagian_invoice',
        'realisasi_tusbung',
        'foto_meter',
        'material',
        'kalkulator_listrik',
        'share_laporan',
        'kelola_user',
        'monitoring_online'
      ];
    }

    // 2. Koordinator / Admin System / Admin Aplikasi
    if (
      roleLower.includes('koordinator') ||
      roleLower.includes('admin system') ||
      roleLower.includes('admin aplikasi') ||
      roleLower === 'admin'
    ) {
      return [
        'dashboard',
        'dcc',
        'master_data',
        'input_peta_penyulang',
        'master_pelanggan',
        'peta_penyulang',
        'peta_gardu',
        'peta_pohon',
        'survey_pb_pd',
        'jadwal_security',
        'alker_apd',
        'patroli_kelistrikan',
        'matriks_gangguan',
        'pemeliharaan_20kv',
        'saidi_saifi',
        'health_index',
        'pengukuran_gardu',
        'peremajaan_meter',
        'meter_sl',
        'monitoring_susut',
        'perintah_kerja',
        'format_surat',
        'cash_flow_bop',
        'row',
        'inspeksi_tier1',
        'inspeksi_tier1_jtm',
        'inspeksi_tier1_gtt',
        'inspeksi_tier1_switching',
        'inspeksi_tier2_thermovision',
        'inspeksi_tier2_ultrasound',
        'jadwal_piket',
        'monitoring_lembur',
        'pembagian_invoice',
        'realisasi_tusbung',
        'foto_meter',
        'material',
        'kalkulator_listrik',
        'share_laporan',
        'kelola_user'
      ];
    }

    // 3. Admin Teknik
    if (roleLower.includes('admin teknik')) {
      return [
        'dashboard',
        'dcc',
        'master_data',
        'input_peta_penyulang',
        'master_pelanggan',
        'peta_penyulang',
        'peta_gardu',
        'peta_pohon',
        'matriks_gangguan',
        'pemeliharaan_20kv',
        'saidi_saifi',
        'health_index',
        'pengukuran_gardu',
        'perintah_kerja',
        'format_surat',
        'cash_flow_bop',
        'row',
        'inspeksi_tier1',
        'inspeksi_tier1_jtm',
        'inspeksi_tier1_gtt',
        'inspeksi_tier1_switching',
        'inspeksi_tier2_thermovision',
        'inspeksi_tier2_ultrasound',
        'jadwal_piket',
        'monitoring_lembur',
        'material',
        'kalkulator_listrik',
        'share_laporan'
      ];
    }

    // 4. Bagian Pemasaran
    if (roleLower.includes('pemasaran')) {
      return ['dashboard', 'survey_pb_pd', 'kalkulator_listrik'];
    }

    // 5. Bagian Transaksi Energi
    if (roleLower.includes('transaksi')) {
      return [
        'dashboard',
        'peremajaan_meter',
        'meter_sl',
        'monitoring_susut',
        'pembagian_invoice',
        'realisasi_tusbung',
        'foto_meter',
        'kalkulator_listrik'
      ];
    }

    // 6. Petugas ROW
    if (roleLower.includes('row') || roleLower.includes('pohon')) {
      return ['dashboard', 'peta_pohon', 'row', 'inspeksi_tier1'];
    }

    // 7. Petugas Inspeksi
    if (roleLower.includes('inspeksi')) {
      return [
        'dashboard',
        'peta_penyulang',
        'peta_gardu',
        'peta_pohon',
        'inspeksi_tier1',
        'inspeksi_tier1_jtm',
        'inspeksi_tier1_gtt',
        'inspeksi_tier1_switching',
        'inspeksi_tier2_thermovision',
        'inspeksi_tier2_ultrasound'
      ];
    }

    // 8. Bagian Teknik / Team Leader / PLN Nusadaya
    if (
      roleLower.includes('teknik') ||
      roleLower.includes('leader') ||
      roleLower.includes('nusadaya')
    ) {
      return [
        'dashboard',
        'dcc',
        'master_data',
        'peta_penyulang',
        'peta_gardu',
        'peta_pohon',
        'matriks_gangguan',
        'pemeliharaan_20kv',
        'saidi_saifi',
        'health_index',
        'pengukuran_gardu',
        'perintah_kerja',
        'format_surat',
        'row',
        'inspeksi_tier1',
        'inspeksi_tier1_jtm',
        'inspeksi_tier1_gtt',
        'inspeksi_tier1_switching',
        'inspeksi_tier2_thermovision',
        'inspeksi_tier2_ultrasound',
        'jadwal_piket',
        'monitoring_lembur',
        'material',
        'kalkulator_listrik',
        'share_laporan'
      ];
    }

    // 9. Manager ULP / UP3 / UIW (Full monitoring)
    if (
      roleLower.includes('manager') ||
      roleLower.includes('up3') ||
      roleLower.includes('uiw')
    ) {
      return [
        'dashboard',
        'dcc',
        'master_data',
        'peta_penyulang',
        'peta_gardu',
        'peta_pohon',
        'survey_pb_pd',
        'matriks_gangguan',
        'pemeliharaan_20kv',
        'saidi_saifi',
        'health_index',
        'pengukuran_gardu',
        'peremajaan_meter',
        'meter_sl',
        'monitoring_susut',
        'perintah_kerja',
        'format_surat',
        'cash_flow_bop',
        'row',
        'inspeksi_tier1',
        'pembagian_invoice',
        'realisasi_tusbung',
        'material',
        'kalkulator_listrik',
        'share_laporan'
      ];
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

    const isPowerUser =
      selectedRole.includes('Koordinator') ||
      selectedRole.includes('Admin Aplikasi') ||
      selectedRole.includes('Admin System') ||
      selectedRole.includes('Owner');
    setCanAddUsers(isPowerUser);
    setCanEditDataVal(
      !selectedRole.includes('Manager') &&
        !selectedRole.includes('UP3') &&
        !selectedRole.includes('UIW')
    );
    setCanViewDataOnly(
      selectedRole.includes('Manager') ||
        selectedRole.includes('UP3') ||
        selectedRole.includes('UIW')
    );
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
    setIsUrlInputOpen(false);
    setActiveTabCat('ALL');
    setIsModalOpen(true);
  };

  const openEditModal = (user: User) => {
    if (isOwnerUser(user) && !isCurrentUserOwner) {
      setProtectedActionAlert(
        `Akun Owner (${user.name}) dilindungi dan tidak dapat diedit oleh user dengan role ${
          currentUser?.role || 'Koordinator'
        }.`
      );
      return;
    }

    setEditingUser(user);
    setUsername(user.username);
    setName(user.name);
    setRole(user.role);

    if (
      user.unit === 'SEMUA UNIT' ||
      user.unit === 'SEMUA UNIT (GLOBAL)' ||
      (isOwnerUser(user) && (user.unit || '').includes('SEMUA'))
    ) {
      setUnit(user.unit || 'SEMUA UNIT (GLOBAL)');
      setKodeUnit(user.kodeUnit || '54000');
      setIsCustomUnit(false);
      setCustomUnit('');
    } else {
      const matchedUnit = unitOptions.find(
        (u) => u.namaUnit.toLowerCase() === (user.unit || '').toLowerCase()
      );
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
    setCanEditDataVal(user.permissions?.canEditData !== false);
    setCanViewDataOnly(user.permissions?.canViewDataOnly === true);
    setAllowedMenus(user.allowedMenus || getMenuPresetsForRole(user.role));
    setFormError('');
    setIsUrlInputOpen(false);
    setActiveTabCat('ALL');
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
    setAllowedMenus((prev) => {
      if (prev.includes(menuId)) {
        return prev.filter((id) => id !== menuId);
      } else {
        return [...prev, menuId];
      }
    });
  };

  const toggleAllInCategory = (group: MenuCategoryGroup, enable: boolean) => {
    const itemIds = group.items.map((i) => i.id);
    setAllowedMenus((prev) => {
      if (enable) {
        return Array.from(new Set([...prev, ...itemIds]));
      } else {
        return prev.filter((id) => !itemIds.includes(id));
      }
    });
  };

  const selectAllMenus = () => {
    const allIds: string[] = [];
    MENU_CATEGORIES_CONFIG.forEach((cat) => {
      cat.items.forEach((it) => {
        if (!it.ownerOnly || isCurrentUserOwner) {
          allIds.push(it.id);
        }
      });
    });
    setAllowedMenus(allIds);
  };

  const clearAllMenus = () => {
    setAllowedMenus([]);
  };

  const resetMenusToRoleDefault = () => {
    setAllowedMenus(getMenuPresetsForRole(role));
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
        avatarUrl: avatarUrl.trim(),
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
        avatarUrl: avatarUrl.trim(),
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
    const matchesUnit =
      unitFilter === 'Semua' ||
      (u.unit && u.unit.toLowerCase().includes(unitFilter.toLowerCase())) ||
      u.kodeUnit === unitFilter;
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
                Kelola hak akses pengguna, foto profil, peran jabatan, dan isolasi data multi-unit ULP.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {isCurrentUserOwner && (
            <button
              onClick={() => setIsBgModalOpen(true)}
              className="px-4 py-2.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/50 font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0 backdrop-blur-xs active:scale-95"
              title="Kustomisasi tema & latar belakang layar login (Khusus Owner)"
            >
              <Palette className="w-4 h-4 text-amber-300" />
              <span>Ganti Latar Login (Owner)</span>
            </button>
          )}

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
            Hanya user dengan role <strong>Koordinator</strong> atau <strong>Owner</strong> yang dapat menambah, mengubah, atau menghapus data akun login.
          </div>
        </div>
      )}

      {/* Filters and Search Bar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari user berdasarkan nama, username, unit, atau kode unit..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Role & Unit Filters */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-500">Filter Role:</span>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="Semua">Semua Role</option>
                <option value="Owner">Owner</option>
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

            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-500">Filter Unit:</span>
              <select
                value={unitFilter}
                onChange={(e) => setUnitFilter(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="Semua">Semua Unit</option>
                <option value="SEMUA UNIT">SEMUA UNIT (Owner Global)</option>
                {unitOptions.map((u, idx) => (
                  <option key={`um_filter_${u.kodeUnit}_${u.namaUnit}_${idx}`} value={u.namaUnit}>
                    {u.namaUnit} ({u.kodeUnit})
                  </option>
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
                <th className="py-3.5 px-4">Nama Lengkap & Foto</th>
                <th className="py-3.5 px-4">Role Jabatan</th>
                <th className="py-3.5 px-4">Unit Kerja & Kode</th>
                <th className="py-3.5 px-4">Kategori Hak Akses Menu</th>
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
                      {/* Name & Avatar */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          {u.avatarUrl ? (
                            <img
                              src={u.avatarUrl}
                              alt={u.name}
                              referrerPolicy="no-referrer"
                              className={`w-10 h-10 rounded-full object-cover shadow-xs shrink-0 ${
                                isTargetOwner ? 'border-2 border-amber-400 ring-2 ring-amber-200' : 'border border-slate-200'
                              }`}
                            />
                          ) : (
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center font-extrabold text-xs shadow-xs shrink-0 ${
                                isTargetOwner
                                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                  : isEdit
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
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
                      <td className="py-3.5 px-4 max-w-[320px]">
                        <div className="space-y-1.5">
                          <div>
                            {isTargetOwner ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 border border-amber-300 text-amber-900 text-[10px] font-extrabold shadow-2xs">
                                <Crown className="w-3 h-3 text-amber-600" />
                                <span>Owner (Akses Penuh Semua Unit)</span>
                              </span>
                            ) : isEdit ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-extrabold shadow-2xs">
                                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                                <span>Editor (Input &amp; Edit Data)</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-extrabold shadow-2xs">
                                <Eye className="w-3 h-3 text-amber-600" />
                                <span>Monitoring Read-Only</span>
                              </span>
                            )}
                          </div>

                          {/* List of checked menus as micro-pills */}
                          <div className="flex flex-wrap gap-1 max-w-[300px] max-h-[75px] overflow-y-auto scrollbar-thin">
                            {(() => {
                              const activeMenus = u.allowedMenus || getMenuPresetsForRole(u.role);
                              if (activeMenus.length === 0) {
                                return (
                                  <span className="text-[10px] text-slate-400 italic">
                                    Tidak ada akses menu
                                  </span>
                                );
                              }
                              return activeMenus.map((m) => {
                                const props = getMenuBadgeProps(m);
                                return (
                                  <span
                                    key={m}
                                    className={`inline-flex items-center px-1.5 py-0.5 rounded-md border text-[9px] font-bold ${props.bg}`}
                                  >
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
                                title="Edit Role, Foto & Hak Akses User"
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl overflow-hidden flex flex-col max-h-[94vh] animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 tracking-tight">
                    {editingUser ? 'Edit Akun, Foto & Hak Akses Pengguna' : 'Tambah Pengguna Baru'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Konfigurasi foto profil, kredensial login, Unit PLN, Kode Unit untuk isolasi data, dan hak akses menu
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

            {/* Modal Body / Form */}
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1">
              {formError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-bold flex items-center gap-2">
                  <XCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* LEFT COLUMN: User Info, Photo, Unit & Password */}
                <div className="lg:col-span-5 space-y-4">
                  {/* Photo Avatar Card with Instant Upload & Edit */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block font-bold text-slate-800 text-xs flex items-center gap-1.5">
                        <Camera className="w-4 h-4 text-blue-600" />
                        <span>Foto Profil Pengguna</span>
                      </label>
                      {avatarUrl && (
                        <button
                          type="button"
                          onClick={() => setAvatarUrl('')}
                          className="text-[10px] text-rose-600 hover:text-rose-700 font-bold transition-colors cursor-pointer"
                        >
                          Hapus Foto
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-3.5">
                      <div className="relative group shrink-0">
                        {avatarUrl ? (
                          <img
                            src={avatarUrl}
                            alt="Avatar Preview"
                            referrerPolicy="no-referrer"
                            className="w-16 h-16 rounded-full object-cover border-2 border-blue-500 shadow-md ring-2 ring-blue-200"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-blue-600 to-teal-500 border-2 border-white shadow-md flex items-center justify-center text-white font-black text-lg">
                            {name ? name.substring(0, 2).toUpperCase() : 'PLN'}
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="absolute -bottom-1 -right-1 p-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-full shadow-md border-2 border-white cursor-pointer transition-all"
                          title="Ganti Foto"
                        >
                          <Camera className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="flex-1 space-y-1.5">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isCompressingImage}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>{isCompressingImage ? 'Memproses...' : 'Upload Foto Baru'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setIsUrlInputOpen(!isUrlInputOpen)}
                            className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl transition-all cursor-pointer"
                            title="Masukkan Link Gambar Web"
                          >
                            <LinkIcon className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                        />

                        <p className="text-[10px] text-slate-500 leading-tight">
                          Pilih foto langsung dari HP/komputer. Foto otomatis dikompres agar hemat penyimpanan.
                        </p>
                      </div>
                    </div>

                    {/* URL Input Toggle */}
                    {isUrlInputOpen && (
                      <div className="pt-2 border-t border-slate-200/80 flex gap-2">
                        <input
                          type="url"
                          value={customAvatarUrlInput}
                          onChange={(e) => setCustomAvatarUrlInput(e.target.value)}
                          placeholder="Paste URL foto https://..."
                          className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                        />
                        <button
                          type="button"
                          onClick={handleApplyUrlAvatar}
                          className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-all cursor-pointer"
                        >
                          Terapkan
                        </button>
                      </div>
                    )}

                    {/* Preset Avatars Selection */}
                    <div className="pt-2 border-t border-slate-200/80 space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-500 block">Pilihan Foto Cepat:</span>
                      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                        {PRESET_AVATARS.map((item, idx) => (
                          <button
                            key={`preset_avatar_${idx}`}
                            type="button"
                            onClick={() => setAvatarUrl(item.url)}
                            className={`p-0.5 rounded-full border-2 transition-all cursor-pointer shrink-0 ${
                              avatarUrl === item.url ? 'border-blue-600 scale-105 shadow-sm' : 'border-transparent hover:border-slate-300'
                            }`}
                            title={item.label}
                          >
                            <img
                              src={item.url}
                              alt={item.label}
                              className="w-7 h-7 rounded-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Basic Credentials */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                    <div className="flex items-center gap-1.5 text-slate-800 font-bold text-xs">
                      <Shield className="w-4 h-4 text-blue-600" />
                      <span>Identitas Pengguna</span>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                        Username Login
                      </label>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                        placeholder="Contoh: koordinator_baguala"
                        required
                        disabled={!!editingUser && isOwnerUser(editingUser)}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-blue-500 transition-all disabled:bg-slate-100 disabled:text-slate-500"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                        Nama Lengkap
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Contoh: Bpk. Ahmad Fauzi"
                        required
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-500 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                        Role Jabatan
                      </label>
                      <select
                        value={role}
                        onChange={(e) => handleRoleChange(e.target.value)}
                        disabled={!!editingUser && isOwnerUser(editingUser)}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-500 cursor-pointer disabled:bg-slate-100 disabled:text-slate-500"
                      >
                        {isCurrentUserOwner && <option value="Owner">👑 Owner (Hak Penuh Sistem)</option>}
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
                  </div>

                  {/* Unit Kerja & Kode Unit Section */}
                  <div className="p-4 bg-teal-50/50 border border-teal-200 rounded-2xl space-y-3">
                    <div className="flex items-center gap-1.5 text-teal-900 font-bold text-xs">
                      <Building2 className="w-4 h-4 text-teal-700" />
                      <span>Unit Kerja &amp; Kode Unit (Isolasi Multi-Unit)</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                          Pilih Unit PLN
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

                      <div>
                        <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                          Kode Unit (Isolasi Data)
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
                      💡 <strong>Isolasi Data:</strong> Ketika user login, data operasional yang tampil disesuaikan dengan Kode Unit <strong>{kodeUnit || '54110'}</strong> ({isCustomUnit ? customUnit : unit}).
                    </p>
                  </div>

                  {/* Password & Confirm Password */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                    <div className="flex items-center gap-1.5 text-slate-800 font-bold text-xs">
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
                </div>

                {/* RIGHT COLUMN: Granular & Categorized Menu Access Controls */}
                <div className="lg:col-span-7 space-y-4 flex flex-col">
                  {/* Category Selection Header */}
                  <div className="p-4 bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-teal-50/70 border border-blue-200/80 rounded-2xl space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-blue-600" />
                          <span>Kategori Hak Akses Menu Aplikasi</span>
                        </h4>
                        <p className="text-[11px] text-slate-600 mt-0.5">
                          Atur menu mana saja yang tampil di sidebar navigasi user ({allowedMenus.length} menu aktif)
                        </p>
                      </div>

                      {/* Quick action buttons */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={selectAllMenus}
                          className="px-2.5 py-1 bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-[11px] font-bold transition-all cursor-pointer shadow-2xs"
                        >
                          Pilih Semua
                        </button>
                        <button
                          type="button"
                          onClick={resetMenusToRoleDefault}
                          className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[11px] font-bold transition-all cursor-pointer shadow-2xs"
                          title="Reset sesuai role jabatan yang dipilih"
                        >
                          Reset Role
                        </button>
                        <button
                          type="button"
                          onClick={clearAllMenus}
                          className="px-2.5 py-1 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 rounded-lg text-[11px] font-bold transition-all cursor-pointer shadow-2xs"
                        >
                          Kosongkan
                        </button>
                      </div>
                    </div>

                    {/* Mode Otoritas Data (Editor vs Read-Only) */}
                    <div className="pt-2 border-t border-blue-200/60 flex items-center gap-4 flex-wrap">
                      <span className="text-[11px] font-bold text-slate-700">Mode Otoritas Data:</span>
                      <label className="flex items-center gap-2 cursor-pointer bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                        <input
                          type="checkbox"
                          checked={canEditDataVal}
                          onChange={(e) => {
                            setCanEditDataVal(e.target.checked);
                            if (e.target.checked) setCanViewDataOnly(false);
                          }}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        <span className="text-[11px] font-bold text-slate-800">Mode Editor (Boleh Input/Edit Data)</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                        <input
                          type="checkbox"
                          checked={canViewDataOnly}
                          onChange={(e) => {
                            setCanViewDataOnly(e.target.checked);
                            if (e.target.checked) setCanEditDataVal(false);
                          }}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        <span className="text-[11px] font-bold text-slate-800">Mode Read-Only (Hanya Pantau)</span>
                      </label>
                    </div>
                  </div>

                  {/* Categorized Menu Groups */}
                  <div className="space-y-3.5 overflow-y-auto max-h-[480px] pr-1 scrollbar-thin">
                    {MENU_CATEGORIES_CONFIG.map((group) => {
                      const CategoryIcon = group.icon;
                      const allGroupChecked = group.items.every((it) => allowedMenus.includes(it.id));
                      const someGroupChecked = group.items.some((it) => allowedMenus.includes(it.id));

                      return (
                        <div
                          key={group.id}
                          className="p-3.5 bg-slate-50/70 border border-slate-200 rounded-2xl space-y-2.5 shadow-2xs transition-all"
                        >
                          {/* Group Category Header */}
                          <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                            <div className="flex items-center gap-2">
                              <div className={`p-1.5 rounded-lg border ${group.color}`}>
                                <CategoryIcon className="w-4 h-4" />
                              </div>
                              <div>
                                <span className="font-extrabold text-slate-900 text-xs block">
                                  {group.category}
                                </span>
                                <span className="text-[10px] text-slate-500">
                                  {group.description}
                                </span>
                              </div>
                            </div>

                            {/* Category select all / clear button */}
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => toggleAllInCategory(group, !allGroupChecked)}
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-md border transition-all cursor-pointer ${
                                  allGroupChecked
                                    ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                                    : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                                }`}
                              >
                                {allGroupChecked ? 'Batal Semua' : 'Pilih Semua'}
                              </button>
                            </div>
                          </div>

                          {/* Sub-items checkboxes grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {group.items.map((menu) => {
                              const isChecked = allowedMenus.includes(menu.id);
                              const MenuIcon = menu.icon;
                              const isOwnerRestricted = menu.ownerOnly && !isCurrentUserOwner;

                              return (
                                <label
                                  key={menu.id}
                                  className={`flex items-start gap-2.5 p-2.5 rounded-xl border transition-all ${
                                    isOwnerRestricted
                                      ? 'bg-slate-100 border-slate-200 opacity-60 cursor-not-allowed'
                                      : isChecked
                                      ? 'bg-blue-50/80 border-blue-200 shadow-2xs cursor-pointer'
                                      : 'bg-white border-slate-200/80 hover:bg-slate-50 cursor-pointer'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    disabled={isOwnerRestricted}
                                    onChange={() => toggleMenuAllowed(menu.id)}
                                    className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5">
                                      <div className={`p-1 rounded-md border shrink-0 ${menu.color}`}>
                                        <MenuIcon className="w-3 h-3" />
                                      </div>
                                      <span className="font-bold text-slate-800 text-[11px] truncate">
                                        {menu.label}
                                      </span>
                                      {menu.ownerOnly && (
                                        <span className="px-1 py-0.2 rounded text-[8px] font-black bg-amber-400/20 text-amber-800 border border-amber-300 shrink-0">
                                          OWNER
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-[10px] text-slate-500 mt-1 leading-snug line-clamp-2">
                                      {menu.desc}
                                    </p>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
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
                  disabled={password !== confirmPassword || !username.trim() || !name.trim()}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold shadow-md shadow-blue-500/10 cursor-pointer flex items-center gap-1.5 transition-all text-xs"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingUser ? 'Simpan Perubahan User' : 'Simpan User Baru'}</span>
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
                  Apakah Anda yakin ingin menghapus akun{' '}
                  <strong className="text-slate-800">{deleteConfirmUser.name}</strong> (@{deleteConfirmUser.username}) dengan role{' '}
                  <strong className="text-slate-800">{deleteConfirmUser.role}</strong> di unit{' '}
                  <strong className="text-slate-800">{deleteConfirmUser.unit}</strong>?
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
