import React, { useState, useEffect, useMemo } from 'react';
import {
  ViewType,
  User,
  Penyulang,
  SectionJaringan,
  GangguanLog,
  ROWItem,
  InspeksiItem,
  Tier1Item,
  Tier2Item,
  MonitoringPemeliharaanItem,
  MapLayerItem,
  ActivityLog,
  SaidiSaifiData,
  MaterialStokItem,
  MaterialPemakaianItem,
  AlkerApdItem,
  PerintahKerja,
  MasterGardu,
  PengukuranGardu,
  KendaraanOperasional,
  AsetJaringan,
  JadwalPiket,
  InspeksiTier1JTM,
  InspeksiTier1GTT,
  InspeksiTier1Switching,
  InspeksiTier2Thermovision,
  InspeksiTier2Ultrasound,
  PohonGisItem,
  KonstruksiGisItem,
  SurveyPbPdItem,
  UserOnlinePresence,
  SystemBroadcastMessage,
  ChatMessage,
  AutoReplyRule,
  MasterUnitPLN,
  HelpDeskMessage,
  CashFlowBopItem,
  MonitoringLemburItem
} from './types';
import {
  INITIAL_PENYULANG,
  INITIAL_SECTIONS,
  INITIAL_GANGGUAN,
  INITIAL_ROW,
  INITIAL_ROW_DATA,
  INITIAL_INSPEKSI,
  INITIAL_TIER1,
  INITIAL_TIER2,
  INITIAL_MONITORING,
  INITIAL_MAP_LAYERS,
  INITIAL_ACTIVITIES,
  INITIAL_SAIDI,
  INITIAL_MATERIAL_STOK,
  INITIAL_MATERIAL_PEMAKAIAN,
  INITIAL_ALKER_APD,
  INITIAL_PERINTAH_KERJA,
  INITIAL_MASTER_GARDU,
  INITIAL_PENGUKURAN_GARDU,
  INITIAL_KENDARAAN_OPERASIONAL,
  INITIAL_ASET_JARINGAN,
  INITIAL_JADWAL_PIKET,
  INITIAL_POHON_GIS,
  INITIAL_KONSTRUKSI_GIS,
  INITIAL_SURVEY_PB_PD,
  INITIAL_CHAT_MESSAGES,
  INITIAL_AUTO_REPLY_RULES,
  INITIAL_CASH_FLOW_BOP
} from './data/mockData';
import { db, collection, onSnapshot, doc, getDoc, getDocs, setDoc, deleteDoc, writeBatch, query, limit, OperationType, handleFirestoreError, registerDeletedId, filterDeleted } from './lib/firebase';
import { sanitizeForFirestore } from './utils/firestoreHelper';
import { isPemasaranUser, isInspeksiUser, canAccessMenu, isOwnerUser } from './utils/permissions';
import { sendWaNotification } from './utils/whatsappNotifier';
import { updatePresenceInFirestore, markPresenceOfflineInFirestore, calculatePresenceStatus } from './utils/presenceTracker';
import { isDataAccessibleByUser, DEFAULT_UNIT, DEFAULT_KODE_UNIT, getKodeUnitByUnitName } from './utils/unitConfig';
import { Lock, Bell, AlertTriangle, X, CheckCircle2, Radio } from 'lucide-react';
import { AnimatePresence, motion } from "motion/react";
import { LoginScreen } from './components/LoginScreen';
import { TopHeader } from './components/TopHeader';
import { Sidebar } from './components/Sidebar';
import { SearchProvider } from './context/SearchContext';

// Views
import { DashboardView } from './components/views/DashboardView';
import { DccView } from './components/views/DccView';
import { MonitoringOnlineView } from './components/views/MonitoringOnlineView';
import { PetaPenyulangView } from './components/views/PetaPenyulangView';
import { InputPetaPenyulangView } from './components/views/InputPetaPenyulangView';
import { HealthIndexView } from './components/views/HealthIndexView';
import { GangguanTripView } from './components/views/GangguanTripView';
import { PemeliharaanView } from './components/views/PemeliharaanView';
import { MonitoringTargetRealisasiView } from './components/views/MonitoringTargetRealisasiView';
import { MasterDataView } from './components/views/MasterDataView';
import { SaidiSaifiView } from './components/views/SaidiSaifiView';
import { MaterialView } from './components/views/MaterialView';
import { AlkerApdView } from './components/views/AlkerApdView';
import { UserManagementView } from './components/views/UserManagementView';
import { PerintahKerjaView } from './components/views/PerintahKerjaView';
import { PengukuranGarduView } from './components/views/PengukuranGarduView';
import { KendaraanOperasionalView } from './components/views/KendaraanOperasionalView';
import { AsetJaringanView } from './components/views/AsetJaringanView';
import { JadwalPiketView } from './components/views/JadwalPiketView';
import { InspeksiTier1JTMView } from './components/views/InspeksiTier1JTMView';
import { InspeksiTier1GTTView } from './components/views/InspeksiTier1GTTView';
import { InspeksiTier1SwitchingView } from './components/views/InspeksiTier1SwitchingView';
import { InspeksiTier2ThermovisionView } from './components/views/InspeksiTier2ThermovisionView';
import { InspeksiTier2UltrasoundView } from './components/views/InspeksiTier2UltrasoundView';
import { EstimasiSaidiSaifiView } from './components/views/EstimasiSaidiSaifiView';
import { FormatSuratView } from './components/views/FormatSuratView';
import { SldVisioView } from './components/views/SldVisioView';
import { ShareLaporanView } from './components/views/ShareLaporanView';
import { PetaPohonView } from './components/views/PetaPohonView';
import { PetaKonstruksiView } from './components/views/PetaKonstruksiView';
import { SurveyPbPdView } from './components/views/SurveyPbPdView';
import { LiveChatView } from './components/views/LiveChatView';
import { KalkulatorListrikView } from './components/views/KalkulatorListrikView';
import { MonitoringYantekView } from './components/views/MonitoringYantekView';
import { MasterUnitView } from './components/views/MasterUnitView';
import { HelpDeskView } from './components/views/HelpDeskView';
import { PeremajaanMeterView } from './components/views/PeremajaanMeterView';
import { MeterSLView } from './components/views/MeterSLView';
import { MonitoringSusutView } from './components/views/MonitoringSusutView';
import { CashFlowBopView } from './components/views/CashFlowBopView';
import { MasterPelangganView } from './components/views/MasterPelangganView';
import { PetaGarduView } from './components/views/PetaGarduView';
import { ManbillView } from './components/views/ManbillView';
import { K3LView } from './components/views/K3LView';
import { MonitoringLemburView } from './components/views/MonitoringLemburView';

export default function App() {
  // Authentication state
  const [user, setUser] = useState<User | null>(null);

  // Unit Access & Filter State for Owner & Multi-Unit
  const [ownerSelectedUnitFilter, setOwnerSelectedUnitFilter] = useState<string>('SEMUA');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Active view & navigation state
  const [activeView, setActiveView] = useState<ViewType>('matriks_gangguan');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Telegram WebApp Initialization
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
      const tg = (window as any).Telegram.WebApp;
      tg.ready();
      tg.expand();
      if (tg.setHeaderColor) {
        tg.setHeaderColor('#0058a8');
      }
    }
  }, []);

  // Ensure logged in user remains on a view they have permission to access
  useEffect(() => {
    if (user && !canAccessMenu(user, activeView)) {
      const candidateViews: ViewType[] = [
        'dashboard',
        'matriks_gangguan',
        'pemeliharaan_20kv',
        'perintah_kerja',
        'pengukuran_gardu',
        'survey_pb_pd',
        'saidi_saifi',
        'alker_apd',
        'share_laporan',
        'peta_penyulang',
        'master_data',
        'health_index',
        'kelola_user',
        'inspeksi_tier1',
        'row'
      ];
      const firstAllowed = candidateViews.find(v => canAccessMenu(user, v));
      if (firstAllowed) {
        setActiveView(firstAllowed);
      }
    }
  }, [user, activeView]);

  // Domain data states
  const [penyulangList, setPenyulangList] = useState<Penyulang[]>(() => filterDeleted(INITIAL_PENYULANG));
  const [sectionList, setSectionList] = useState<SectionJaringan[]>(() => filterDeleted(INITIAL_SECTIONS));
  const [gangguanList, setGangguanList] = useState<GangguanLog[]>(() => filterDeleted(INITIAL_GANGGUAN));
  const [rowList, setRowList] = useState<ROWItem[]>(() => filterDeleted(INITIAL_ROW));
  const [tier1List, setTier1List] = useState<Tier1Item[]>(() => filterDeleted(INITIAL_TIER1));
  const [tier2List, setTier2List] = useState<Tier2Item[]>(() => filterDeleted(INITIAL_TIER2));
  const [tier1JtmList, setTier1JtmList] = useState<InspeksiTier1JTM[]>([]);
  const [tier1GttList, setTier1GttList] = useState<InspeksiTier1GTT[]>([]);
  const [tier1SwitchingList, setTier1SwitchingList] = useState<InspeksiTier1Switching[]>([]);
  const [thermovisionList, setThermovisionList] = useState<InspeksiTier2Thermovision[]>([]);
  const [ultrasoundList, setUltrasoundList] = useState<InspeksiTier2Ultrasound[]>([]);
  const [isDataLoading, setIsDataLoading] = useState<boolean>(true);
  
  // Dynamically compute inspeksiList from tier1 and tier2 data
  const inspeksiList = useMemo(() => {
    const combined: InspeksiItem[] = [];
    tier1List.forEach(t1 => {
      combined.push({
        id: t1.id,
        tiangOrGarduId: t1.section || '-',
        tipe: 'Tier 1',
        namaPenyulang: t1.penyulang || '-',
        lokasi: t1.section || '-',
        temuan: t1.konstruksi || t1.temuanRow || '-',
        kondisi: (t1.konstruksi && t1.konstruksi.toLowerCase().includes('retak')) ? 'Berat' : 'Ringan',
        tanggalInspeksi: t1.tanggal,
        petugas: 'Tim Tier 1'
      });
    });
    tier1JtmList.forEach(jtm => {
      combined.push({
        id: jtm.id,
        tiangOrGarduId: jtm.noTiang || '-',
        tipe: 'Tier 1',
        namaPenyulang: jtm.penyulang || '-',
        lokasi: jtm.section || '-',
        temuan: jtm.kondisiTemuanLain || 'Inspeksi JTM Checklist',
        kondisi: 'Baik',
        tanggalInspeksi: jtm.tglPelaksanaan,
        petugas: jtm.pelaksana || 'Tim JTM'
      });
    });
    tier1GttList.forEach(gtt => {
      combined.push({
        id: gtt.id,
        tiangOrGarduId: gtt.noGtt || '-',
        tipe: 'Gardu',
        namaPenyulang: gtt.penyulang || '-',
        lokasi: gtt.alamat || '-',
        temuan: gtt.kondisiTemuanLain || 'Inspeksi GTT Checklist',
        kondisi: 'Baik',
        tanggalInspeksi: gtt.tglPelaksanaan,
        petugas: gtt.pelaksana || 'Tim GTT'
      });
    });
    tier1SwitchingList.forEach(sw => {
      combined.push({
        id: sw.id,
        tiangOrGarduId: sw.noTiang || '-',
        tipe: 'Tier 1',
        namaPenyulang: sw.penyulang || '-',
        lokasi: sw.section || '-',
        temuan: sw.namaSwitching || 'Switching Checklist',
        kondisi: 'Baik',
        tanggalInspeksi: sw.tglPelaksanaan,
        petugas: sw.pelaksana || 'Tim Switching'
      });
    });
    thermovisionList.forEach(tv => {
      combined.push({
        id: tv.id,
        tiangOrGarduId: tv.noTiang || '-',
        tipe: 'Thermovision',
        namaPenyulang: tv.penyulang || '-',
        lokasi: tv.section || '-',
        temuan: tv.kondisiTemuanLain || 'Inspeksi Thermovision',
        kondisi: 'Selesai',
        tanggalInspeksi: tv.tglPelaksanaan,
        petugas: tv.pelaksana || 'Tim Thermovision'
      });
    });
    ultrasoundList.forEach(us => {
      combined.push({
        id: us.id,
        tiangOrGarduId: us.noTiang || '-',
        tipe: 'Ultrasound',
        namaPenyulang: us.penyulang || '-',
        lokasi: us.section || '-',
        temuan: us.kondisiTemuanLain || 'Inspeksi Ultrasound',
        kondisi: 'Baik',
        tanggalInspeksi: us.tglPelaksanaan,
        petugas: us.pelaksana || 'Tim Ultrasound'
      });
    });
    tier2List.forEach(t2 => {
      combined.push({
        id: t2.id,
        tiangOrGarduId: t2.section || '-',
        tipe: 'Tier 2',
        namaPenyulang: t2.penyulang || '-',
        lokasi: t2.section || '-',
        temuan: t2.temuanThermoUltrasound || t2.jenisTier2 || '-',
        kondisi: 'Berat',
        tanggalInspeksi: t2.tanggal,
        petugas: 'Tim Tier 2'
      });
    });
    return combined.length > 0 ? combined : filterDeleted(INITIAL_INSPEKSI);
  }, [tier1List, tier2List]);

  const [monitoringList, setMonitoringList] = useState<MonitoringPemeliharaanItem[]>(() => filterDeleted(INITIAL_MONITORING));
  const [mapLayers, setMapLayers] = useState<MapLayerItem[]>(() => filterDeleted(INITIAL_MAP_LAYERS));
  const [activities, setActivities] = useState<ActivityLog[]>(() => filterDeleted(INITIAL_ACTIVITIES));
  const [saidiList, setSaidiList] = useState<SaidiSaifiData[]>(() => filterDeleted(INITIAL_SAIDI));
  
  // Material & Alker APD States
  const [stokList, setStokList] = useState<MaterialStokItem[]>(() => filterDeleted(INITIAL_MATERIAL_STOK));
  const [pemakaianList, setPemakaianList] = useState<MaterialPemakaianItem[]>(() => filterDeleted(INITIAL_MATERIAL_PEMAKAIAN));
  const [alkerApdList, setAlkerApdList] = useState<AlkerApdItem[]>(() => filterDeleted(INITIAL_ALKER_APD));
  
  // Perintah Kerja Harian (SPK) State
  const [spkList, setSpkList] = useState<PerintahKerja[]>(() => filterDeleted(INITIAL_PERINTAH_KERJA));

  // Master Gardu & Pengukuran Gardu States
  const [masterGarduList, setMasterGarduList] = useState<MasterGardu[]>(() => filterDeleted(INITIAL_MASTER_GARDU));
  const [pengukuranList, setPengukuranList] = useState<PengukuranGardu[]>(() => filterDeleted(INITIAL_PENGUKURAN_GARDU));

  // Monitoring Kendaraan Operasional State
  const [kendaraanList, setKendaraanList] = useState<KendaraanOperasional[]>(() => filterDeleted(INITIAL_KENDARAAN_OPERASIONAL));
  const [asetJaringanList, setAsetJaringanList] = useState<AsetJaringan[]>(() => filterDeleted(INITIAL_ASET_JARINGAN));
  const [jadwalPiketList, setJadwalPiketList] = useState<JadwalPiket[]>(() => filterDeleted(INITIAL_JADWAL_PIKET));

  // Peta Pohon & Peta Konstruksi GIS States
  const [pohonGisList, setPohonGisList] = useState<PohonGisItem[]>(() => filterDeleted(INITIAL_POHON_GIS));
  const [konstruksiGisList, setKonstruksiGisList] = useState<KonstruksiGisItem[]>(() => filterDeleted(INITIAL_KONSTRUKSI_GIS));

  // Survey Pasang Baru & Perubahan Daya (PB/PD) State
  const [surveyList, setSurveyList] = useState<SurveyPbPdItem[]>(() => filterDeleted(INITIAL_SURVEY_PB_PD));

  // Live Chat Messages & Auto Reply Rules States
  const [chatMessagesList, setChatMessagesList] = useState<ChatMessage[]>(() => filterDeleted(INITIAL_CHAT_MESSAGES));
  const [autoReplyRulesList, setAutoReplyRulesList] = useState<AutoReplyRule[]>(() => filterDeleted(INITIAL_AUTO_REPLY_RULES));

  // Online Presence & Broadcast Notification States (Owner Monitoring)
  const [onlineUsersList, setOnlineUsersList] = useState<UserOnlinePresence[]>([]);
  const [activeBroadcast, setActiveBroadcast] = useState<SystemBroadcastMessage | null>(null);
  const [dismissedBroadcastIds, setDismissedBroadcastIds] = useState<string[]>([]);
  const [isForceLogoutModalOpen, setIsForceLogoutModalOpen] = useState(false);

  // Master Unit PLN State (UIW, UP3, ULP, KODE ULP)
  const [masterUnitList, setMasterUnitList] = useState<MasterUnitPLN[]>([]);

  // Help Desk Messages State
  const [helpDeskMessages, setHelpDeskMessages] = useState<HelpDeskMessage[]>([]);

  // Cash Flow BOP State
  const [cashFlowList, setCashFlowList] = useState<CashFlowBopItem[]>(() => filterDeleted(INITIAL_CASH_FLOW_BOP));

  // Monitoring Lembur State
  const [lemburList, setLemburList] = useState<MonitoringLemburItem[]>([]);

  const handleAddCashFlow = (item: CashFlowBopItem) => {
    setCashFlowList(prev => [item, ...prev]);
  };

  const handleUpdateCashFlow = (item: CashFlowBopItem) => {
    setCashFlowList(prev => prev.map(i => i.id === item.id ? item : i));
  };

  const handleDeleteCashFlow = (id: string) => {
    setCashFlowList(prev => prev.filter(i => i.id !== id));
  };

  const handleUpdatePenyulang = (updated: Penyulang) => {
    setPenyulangList(prev => prev.map(p => p.id === updated.id ? updated : p));
  };

  const handleUpdateSection = (updated: SectionJaringan) => {
    setSectionList(prev => prev.map(s => s.id === updated.id ? updated : s));
  };

  // User Management State (RBAC)
  const [usersList, setUsersList] = useState<User[]>(() => filterDeleted([
    { id: 'usr_owner', username: 'owner', password: '318318', name: 'Owner Sistem ULP Baguala', role: 'Owner', unit: 'ULP Baguala', status: 'Aktif', isOwner: true, canAddUsers: true, canEditData: true, canViewDataOnly: false, allowedMenus: ['dashboard', 'monitoring_online', 'live_chat', 'gangguan', 'pemeliharaan', 'spk', 'pengukuran_gardu', 'survey_pb_pd', 'saidi_saifi', 'monitoring_yantek', 'share_laporan', 'kelola_user'], avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' },
    { id: 'usr_1', username: 'koordinator_baguala', name: 'Bpk. Ahmad Fauzi', role: 'Koordinator', unit: 'ULP Baguala', status: 'Aktif', avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
    { id: 'usr_2', username: 'admin_teknik_1', name: 'Sdr. Rizky Ramadhan', role: 'Admin Teknik', unit: 'ULP Baguala', status: 'Aktif', avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80' },
    { id: 'usr_3', username: 'bagian_teknik', name: 'Sdr. Hendra Pratama', role: 'Bagian Teknik', unit: 'ULP Baguala', status: 'Aktif', avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' },
    { id: 'usr_4', username: 'tl_baguala', name: 'Sdr. Samuel Leimena', role: 'Team Leader', unit: 'ULP Baguala', status: 'Aktif', avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80' },
    { id: 'usr_5', username: 'manager_ulp', name: 'Bpk. Daniel Wattimena', role: 'Manager ULP', unit: 'ULP Baguala', status: 'Aktif', avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80' },
    { id: 'usr_6', username: 'keandalan_up3', name: 'Tim Keandalan UP3 Ambon', role: 'UP3', unit: 'UP3 Ambon', status: 'Aktif', avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80' },
    { id: 'usr_7', username: 'distribusi_uiw', name: 'Divisi Distribusi UIW MMU', role: 'UIW', unit: 'UIW MMU', status: 'Aktif', avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80' },
    { id: 'usr_8', username: 'pln_nusadaya', name: 'Monitoring PLN Nusadaya', role: 'PLN Nusadaya', unit: 'PLN Nusadaya', status: 'Aktif', avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' }
  ]));

  // REALTIME FIRESTORE SYNCHRONIZATION
  useEffect(() => {
    const checkAndSeed = async () => {
      // 1. Always ensure Owner account is present in Firestore
      try {
        const ownerDocRef = doc(db, 'app_users', 'usr_owner');
        const ownerSnap = await getDoc(ownerDocRef);
        if (!ownerSnap.exists()) {
          await setDoc(ownerDocRef, {
            id: 'usr_owner',
            username: 'owner',
            password: '318318',
            name: 'Owner Sistem ULP Baguala',
            role: 'Owner',
            unit: 'ULP Baguala',
            status: 'Aktif',
            isOwner: true,
            canAddUsers: true,
            canEditData: true,
            canViewDataOnly: false,
            allowedMenus: ['dashboard', 'monitoring_online', 'gangguan', 'pemeliharaan', 'spk', 'pengukuran_gardu', 'survey_pb_pd', 'saidi_saifi', 'monitoring_yantek', 'share_laporan', 'kelola_user'],
            avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
          });
          console.log('Seeded Owner account to Firestore');
        }
      } catch (err) {
        console.warn('Owner check seed handled:', err);
      }

      // Check local storage
      if (localStorage.getItem('perangpadam_seeded') === 'true') {
        console.log('Database already seeded (verified by client local cache)');
        return;
      }

      try {
        const seedRef = doc(db, 'system_metadata', 'seeding');
        const seedSnap = await getDoc(seedRef);
        
        if (seedSnap.exists()) {
          console.log('Database already seeded (verified by cloud metadata)');
          localStorage.setItem('perangpadam_seeded', 'true');
          return;
        }

        // Double check if any actual data collection is already populated to avoid overwriting existing data
        const testSnap = await getDocs(query(collection(db, 'penyulang_list'), limit(1)));
        if (!testSnap.empty) {
          console.log('Database collections already contain data. Skipping seeding and establishing seeding flag.');
          await setDoc(seedRef, { seeded: true, timestamp: Date.now() });
          localStorage.setItem('perangpadam_seeded', 'true');
          return;
        }

        console.log('Initial startup: Seeding database with default records...');

        // Seed default users
        const defaultUsers = [
          { id: 'usr_owner', username: 'owner', password: '318318', name: 'Owner Sistem ULP Baguala', role: 'Owner', unit: 'ULP Baguala', status: 'Aktif', isOwner: true, canAddUsers: true, canEditData: true, canViewDataOnly: false, allowedMenus: ['dashboard', 'monitoring_online', 'gangguan', 'pemeliharaan', 'spk', 'pengukuran_gardu', 'survey_pb_pd', 'saidi_saifi', 'monitoring_yantek', 'share_laporan', 'kelola_user'], avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' },
          { id: 'usr_1', username: 'koordinator_baguala', name: 'Bpk. Ahmad Fauzi', role: 'Koordinator', unit: 'ULP Baguala', status: 'Aktif', avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
          { id: 'usr_2', username: 'admin_teknik_1', name: 'Sdr. Rizky Ramadhan', role: 'Admin Teknik', unit: 'ULP Baguala', status: 'Aktif', avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80' },
          { id: 'usr_3', username: 'bagian_teknik', name: 'Sdr. Hendra Pratama', role: 'Bagian Teknik', unit: 'ULP Baguala', status: 'Aktif', avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' },
          { id: 'usr_4', username: 'tl_baguala', name: 'Sdr. Samuel Leimena', role: 'Team Leader', unit: 'ULP Baguala', status: 'Aktif', avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80' },
          { id: 'usr_5', username: 'manager_ulp', name: 'Bpk. Daniel Wattimena', role: 'Manager ULP', unit: 'ULP Baguala', status: 'Aktif', avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80' },
          { id: 'usr_6', username: 'keandalan_up3', name: 'Tim Keandalan UP3 Ambon', role: 'UP3', unit: 'UP3 Ambon', status: 'Aktif', avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80' },
          { id: 'usr_7', username: 'distribusi_uiw', name: 'Divisi Distribusi UIW MMU', role: 'UIW', unit: 'UIW MMU', status: 'Aktif', avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80' },
          { id: 'usr_8', username: 'pln_nusadaya', name: 'Monitoring PLN Nusadaya', role: 'PLN Nusadaya', unit: 'PLN Nusadaya', status: 'Aktif', avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' }
        ];
        for (const item of defaultUsers) {
          await setDoc(doc(db, 'app_users', item.id), item);
        }

        // Seed penyulang
        for (const item of INITIAL_PENYULANG) {
          await setDoc(doc(db, 'penyulang_list', item.id), item);
        }

        // Seed sections
        for (const item of INITIAL_SECTIONS) {
          await setDoc(doc(db, 'section_list', item.id), item);
        }

        // Seed map layers
        for (const item of INITIAL_MAP_LAYERS) {
          const firestoreDoc = {
            ...item,
            coordinates: item.coordinates.map((c) => ({ lat: c[0], lng: c[1] }))
          };
          await setDoc(doc(db, 'map_layers', item.id), firestoreDoc);
        }

        // Seed material stok
        for (const item of INITIAL_MATERIAL_STOK) {
          await setDoc(doc(db, 'material_stok', item.id), item);
        }

        // Seed material pemakaian
        for (const item of INITIAL_MATERIAL_PEMAKAIAN) {
          await setDoc(doc(db, 'material_pemakaian', item.id), item);
        }

        // Seed APD & alat kerja
        for (const item of INITIAL_ALKER_APD) {
          await setDoc(doc(db, 'alkerdan_apd', item.id), item);
        }

        // Seed gangguan logs
        for (const item of INITIAL_GANGGUAN) {
          await setDoc(doc(db, 'gangguan_logs', item.id), item);
        }

        // Seed SAIDI / SAIFI
        for (const item of INITIAL_SAIDI) {
          await setDoc(doc(db, 'saidi_saifi_logs', item.id), item);
        }

        // Seed activity logs
        for (const item of INITIAL_ACTIVITIES) {
          await setDoc(doc(db, 'activity_logs', item.id), item);
        }

        // Seed pemeliharaan ROW
        const combinedRow = [...INITIAL_ROW, ...INITIAL_ROW_DATA];
        for (const item of combinedRow) {
          await setDoc(doc(db, 'pemeliharaan_row', item.id), item);
        }

        // Seed pemeliharaan tier 1
        for (const item of INITIAL_TIER1) {
          await setDoc(doc(db, 'pemeliharaan_tier1', item.id), item);
        }

        // Seed pemeliharaan tier 2
        for (const item of INITIAL_TIER2) {
          await setDoc(doc(db, 'pemeliharaan_tier2', item.id), item);
        }

        // Seed pemeliharaan monitoring
        for (const item of INITIAL_MONITORING) {
          await setDoc(doc(db, 'pemeliharaan_monitoring', item.id), item);
        }

        // Seed perintah kerja harian
        for (const item of INITIAL_PERINTAH_KERJA) {
          await setDoc(doc(db, 'perintah_kerja_harian', item.id), item);
        }

        // Seed kendaraan operasional
        for (const item of INITIAL_KENDARAAN_OPERASIONAL) {
          await setDoc(doc(db, 'kendaraan_operasional', item.id), item);
        }

        // Seed aset jaringan
        for (const item of INITIAL_ASET_JARINGAN) {
          await setDoc(doc(db, 'aset_jaringan', item.id), item);
        }

        // Seed jadwal piket
        for (const item of INITIAL_JADWAL_PIKET) {
          await setDoc(doc(db, 'jadwal_piket', item.id), item);
        }

        // Seed pohon GIS
        for (const item of INITIAL_POHON_GIS) {
          await setDoc(doc(db, 'pohon_gis', item.id), sanitizeForFirestore(item));
        }

        // Seed konstruksi GIS
        for (const item of INITIAL_KONSTRUKSI_GIS) {
          await setDoc(doc(db, 'konstruksi_gis', item.id), sanitizeForFirestore(item));
        }

        // Seed survey PB/PD
        for (const item of INITIAL_SURVEY_PB_PD) {
          await setDoc(doc(db, 'survey_pb_pd', item.id), sanitizeForFirestore(item));
        }

        await setDoc(seedRef, { seeded: true, timestamp: Date.now() });
        localStorage.setItem('perangpadam_seeded', 'true');
        console.log('Seeding completed successfully!');
      } catch (err) {
        console.error('Error in checkAndSeed:', err);
      }
    };

    checkAndSeed();

    // 1. Sync Material Stok Masuk
    const unsubStok = onSnapshot(collection(db, 'material_stok'), (snapshot) => {
      const items: MaterialStokItem[] = [];
      snapshot.forEach((docSnap) => items.push(docSnap.data() as MaterialStokItem));
      setStokList(filterDeleted(items));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'material_stok');
    });

    // 2. Sync Material Pemakaian
    const unsubPemakaian = onSnapshot(collection(db, 'material_pemakaian'), (snapshot) => {
      const items: MaterialPemakaianItem[] = [];
      snapshot.forEach((docSnap) => items.push(docSnap.data() as MaterialPemakaianItem));
      setPemakaianList(filterDeleted(items));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'material_pemakaian');
    });

    // 3. Sync Alat Kerja & APD
    const unsubAlker = onSnapshot(collection(db, 'alkerdan_apd'), (snapshot) => {
      const items: AlkerApdItem[] = [];
      snapshot.forEach((docSnap) => items.push(docSnap.data() as AlkerApdItem));
      setAlkerApdList(filterDeleted(items));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'alkerdan_apd');
    });

    // 4. Sync Gangguan Logs
    const unsubGangguan = onSnapshot(collection(db, 'gangguan_logs'), (snapshot) => {
      const items: GangguanLog[] = [];
      snapshot.forEach((docSnap) => items.push(docSnap.data() as GangguanLog));
      setGangguanList(filterDeleted(items));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'gangguan_logs');
    });

    // 5. Sync SAIDI/SAIFI
    const unsubSaidi = onSnapshot(collection(db, 'saidi_saifi_logs'), (snapshot) => {
      const items: SaidiSaifiData[] = [];
      snapshot.forEach((docSnap) => items.push(docSnap.data() as SaidiSaifiData));
      setSaidiList(filterDeleted(items));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'saidi_saifi_logs');
    });

    // 5.5. Sync Master Unit PLN (UIW, UP3, ULP, Kode ULP)
    const unsubMasterUnit = onSnapshot(collection(db, 'master_unit_pln'), (snapshot) => {
      const items: MasterUnitPLN[] = [];
      snapshot.forEach((docSnap) => items.push({ id: docSnap.id, ...docSnap.data() } as MasterUnitPLN));
      const filtered = filterDeleted(items);
      if (filtered.length > 0) {
        setMasterUnitList(filtered);
      } else {
        // Default seed units for Maluku & Maluku Utara
        const defaultUnits: MasterUnitPLN[] = [
          { id: 'unit_1', uiw: 'UIW MMU (Maluku & Maluku Utara)', up3: 'UP3 Ambon', ulp: 'ULP Baguala', kodeUlp: '54110', alamat: 'Jl. Wolter Monginsidi, Passo, Ambon', status: 'AKTIF' },
          { id: 'unit_2', uiw: 'UIW MMU (Maluku & Maluku Utara)', up3: 'UP3 Ambon', ulp: 'ULP Namlea', kodeUlp: '54120', alamat: 'Jl. Danau Rana No. 12, Namlea', status: 'AKTIF' },
          { id: 'unit_3', uiw: 'UIW MMU (Maluku & Maluku Utara)', up3: 'UP3 Ambon', ulp: 'ULP Ambon Kota', kodeUlp: '54130', alamat: 'Jl. Sultan Hairun No. 1, Ambon', status: 'AKTIF' },
          { id: 'unit_4', uiw: 'UIW MMU (Maluku & Maluku Utara)', up3: 'UP3 Ambon', ulp: 'ULP Piru', kodeUlp: '54140', alamat: 'Jl. Trans Seram, Piru', status: 'AKTIF' },
          { id: 'unit_5', uiw: 'UIW MMU (Maluku & Maluku Utara)', up3: 'UP3 Ambon', ulp: 'ULP Masohi', kodeUlp: '54150', alamat: 'Jl. Abdullah Soulisa, Masohi', status: 'AKTIF' },
          { id: 'unit_6', uiw: 'UIW MMU (Maluku & Maluku Utara)', up3: 'UP3 Ambon', ulp: 'ULP Saparua', kodeUlp: '54160', alamat: 'Jl. Benteng Duurstede, Saparua', status: 'AKTIF' },
          { id: 'unit_7', uiw: 'UIW MMU (Maluku & Maluku Utara)', up3: 'UP3 Ambon', ulp: 'ULP Kairatu', kodeUlp: '54170', alamat: 'Jl. Dermaga Kairatu', status: 'AKTIF' },
          { id: 'unit_8', uiw: 'UIW MMU (Maluku & Maluku Utara)', up3: 'UP3 Tual', ulp: 'ULP Tual', kodeUlp: '54210', alamat: 'Jl. Jenderal Sudirman, Tual', status: 'AKTIF' },
          { id: 'unit_9', uiw: 'UIW MMU (Maluku & Maluku Utara)', up3: 'UP3 Saumlaki', ulp: 'ULP Saumlaki', kodeUlp: '54220', alamat: 'Jl. Mathilda Batlayeri, Saumlaki', status: 'AKTIF' },
          { id: 'unit_10', uiw: 'UIW MMU (Maluku & Maluku Utara)', up3: 'UP3 Saumlaki', ulp: 'ULP Dobo', kodeUlp: '54230', alamat: 'Jl. Cenderawasih, Dobo', status: 'AKTIF' }
        ];
        setMasterUnitList(defaultUnits);
        defaultUnits.forEach((u) => setDoc(doc(db, 'master_unit_pln', u.id), sanitizeForFirestore(u)).catch(() => {}));
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'master_unit_pln');
    });

    // 5.6. Sync Help Desk Messages
    const unsubHelpDesk = onSnapshot(collection(db, 'helpdesk_messages'), (snapshot) => {
      const items: HelpDeskMessage[] = [];
      snapshot.forEach((docSnap) => items.push({ id: docSnap.id, ...docSnap.data() } as HelpDeskMessage));
      const filtered = filterDeleted(items);
      filtered.sort((a, b) => new Date(b.createdAt || b.tanggal || 0).getTime() - new Date(a.createdAt || a.tanggal || 0).getTime());
      setHelpDeskMessages(filtered);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'helpdesk_messages');
    });

    // 6. Sync Users list
    const unsubUsers = onSnapshot(collection(db, 'app_users'), (snapshot) => {
      const items: User[] = [];
      snapshot.forEach((docSnap) => items.push(docSnap.data() as User));
      setUsersList(filterDeleted(items));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'app_users');
    });

    // 7. Sync Penyulang List
    const unsubPenyulang = onSnapshot(collection(db, 'penyulang_list'), (snapshot) => {
      const items: Penyulang[] = [];
      snapshot.forEach((docSnap) => items.push(docSnap.data() as Penyulang));
      setPenyulangList(filterDeleted(items));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'penyulang_list');
    });

    // 8. Sync Section List
    const unsubSection = onSnapshot(collection(db, 'section_list'), (snapshot) => {
      const items: SectionJaringan[] = [];
      snapshot.forEach((docSnap) => items.push(docSnap.data() as SectionJaringan));
      setSectionList(filterDeleted(items));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'section_list');
    });

    // 9. Sync Map Layers
    const unsubMapLayers = onSnapshot(collection(db, 'map_layers'), (snapshot) => {
      const items: MapLayerItem[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const item: MapLayerItem = {
          ...data,
          id: data.id,
          nama: data.nama,
          tiangCount: data.tiangCount,
          ruteLength: data.ruteLength,
          tanggalImport: data.tanggalImport,
          kategori: data.kategori,
          visible: data.visible,
          color: data.color,
          coordinates: (data.coordinates || []).map((c: any) => [c.lat, c.lng] as [number, number]),
          poleNames: data.poleNames || [],
          customIcons: data.customIcons || {},
          customStatuses: data.customStatuses || {}
        } as MapLayerItem;
        items.push(item);
      });
      setMapLayers(filterDeleted(items));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'map_layers');
    });

    // 10. Sync Activity Logs
    const unsubActivities = onSnapshot(collection(db, 'activity_logs'), (snapshot) => {
      const items: ActivityLog[] = [];
      snapshot.forEach((docSnap) => items.push(docSnap.data() as ActivityLog));
      setActivities(filterDeleted(items));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'activity_logs');
    });

    // 11. Sync Pemeliharaan ROW
    const unsubRow = onSnapshot(collection(db, 'pemeliharaan_row'), (snapshot) => {
      const items: ROWItem[] = [];
      snapshot.forEach((docSnap) => items.push(docSnap.data() as ROWItem));
      setRowList(filterDeleted(items));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'pemeliharaan_row');
    });

    // 12. Sync Inspeksi / Tier 1
    const unsubTier1 = onSnapshot(collection(db, 'pemeliharaan_tier1'), (snapshot) => {
      const items: Tier1Item[] = [];
      snapshot.forEach((docSnap) => items.push(docSnap.data() as Tier1Item));
      setTier1List(filterDeleted(items));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'pemeliharaan_tier1');
    });

    // 13. Sync Inspeksi / Tier 2
    const unsubTier2 = onSnapshot(collection(db, 'pemeliharaan_tier2'), (snapshot) => {
      const items: Tier2Item[] = [];
      snapshot.forEach((docSnap) => items.push(docSnap.data() as Tier2Item));
      setTier2List(filterDeleted(items));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'pemeliharaan_tier2');
    });

    // 14. Sync Pemeliharaan Monitoring
    const unsubMonitoring = onSnapshot(collection(db, 'pemeliharaan_monitoring'), (snapshot) => {
      const items: MonitoringPemeliharaanItem[] = [];
      snapshot.forEach((docSnap) => items.push(docSnap.data() as MonitoringPemeliharaanItem));
      setMonitoringList(filterDeleted(items));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'pemeliharaan_monitoring');
    });

    // 15. Sync Perintah Kerja Harian (SPK)
    const unsubSpk = onSnapshot(collection(db, 'perintah_kerja_harian'), (snapshot) => {
      const items: PerintahKerja[] = [];
      snapshot.forEach((docSnap) => items.push(docSnap.data() as PerintahKerja));
      setSpkList(filterDeleted(items));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'perintah_kerja_harian');
    });

    // 16. Sync Kendaraan Operasional
    const unsubKendaraan = onSnapshot(collection(db, 'kendaraan_operasional'), (snapshot) => {
      const items: KendaraanOperasional[] = [];
      snapshot.forEach((docSnap) => items.push(docSnap.data() as KendaraanOperasional));
      setKendaraanList(filterDeleted(items));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'kendaraan_operasional');
    });

    // 17. Sync Master Gardu
    const unsubMasterGardu = onSnapshot(collection(db, 'master_gardu'), (snapshot) => {
      const items: MasterGardu[] = [];
      snapshot.forEach((docSnap) => items.push(docSnap.data() as MasterGardu));
      setMasterGarduList(filterDeleted(items));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'master_gardu');
    });

    // 18. Sync Pengukuran Gardu
    const unsubPengukuran = onSnapshot(collection(db, 'pengukuran_gardu'), (snapshot) => {
      const items: PengukuranGardu[] = [];
      snapshot.forEach((docSnap) => items.push(docSnap.data() as PengukuranGardu));
      setPengukuranList(filterDeleted(items));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'pengukuran_gardu');
    });

    // 19. Sync Inspeksi Tier 1 JTM
    const unsubTier1Jtm = onSnapshot(collection(db, 'inspeksi_tier1_jtm'), (snapshot) => {
      const items: InspeksiTier1JTM[] = [];
      snapshot.forEach((docSnap) => items.push(docSnap.data() as InspeksiTier1JTM));
      setTier1JtmList(filterDeleted(items));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'inspeksi_tier1_jtm');
    });

    // 20. Sync Inspeksi Tier 1 GTT
    const unsubTier1Gtt = onSnapshot(collection(db, 'inspeksi_tier1_gtt'), (snapshot) => {
      const items: InspeksiTier1GTT[] = [];
      snapshot.forEach((docSnap) => items.push(docSnap.data() as InspeksiTier1GTT));
      setTier1GttList(filterDeleted(items));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'inspeksi_tier1_gtt');
    });

    // 21. Sync Inspeksi Tier 1 Switching
    const unsubTier1Switching = onSnapshot(collection(db, 'inspeksi_tier1_switching'), (snapshot) => {
      const items: InspeksiTier1Switching[] = [];
      snapshot.forEach((docSnap) => items.push(docSnap.data() as InspeksiTier1Switching));
      setTier1SwitchingList(filterDeleted(items));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'inspeksi_tier1_switching');
    });

    // 22. Sync Inspeksi Tier 2 Thermovision
    const unsubThermovision = onSnapshot(collection(db, 'inspeksi_tier2_thermovision'), (snapshot) => {
      const items: InspeksiTier2Thermovision[] = [];
      snapshot.forEach((docSnap) => items.push(docSnap.data() as InspeksiTier2Thermovision));
      setThermovisionList(filterDeleted(items));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'inspeksi_tier2_thermovision');
    });

    // 23. Sync Inspeksi Tier 2 Ultrasound
    const unsubUltrasound = onSnapshot(collection(db, 'inspeksi_tier2_ultrasound'), (snapshot) => {
      const items: InspeksiTier2Ultrasound[] = [];
      snapshot.forEach((docSnap) => items.push(docSnap.data() as InspeksiTier2Ultrasound));
      setUltrasoundList(filterDeleted(items));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'inspeksi_tier2_ultrasound');
    });

    // Aset Jaringan Sync
    const unsubscribeAset = onSnapshot(collection(db, 'aset_jaringan'), (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AsetJaringan));
      setAsetJaringanList(filterDeleted(list));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'aset_jaringan'));

    // Jadwal Piket Sync
    const unsubscribeJadwal = onSnapshot(collection(db, 'jadwal_piket'), (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as JadwalPiket));
      setJadwalPiketList(filterDeleted(list));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'jadwal_piket'));

    // Pohon GIS Sync
    const unsubPohonGis = onSnapshot(collection(db, 'pohon_gis'), (snapshot) => {
      const items: PohonGisItem[] = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as PohonGisItem));
      setPohonGisList(filterDeleted(items));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'pohon_gis');
    });

    // Konstruksi GIS Sync
    const unsubKonstruksiGis = onSnapshot(collection(db, 'konstruksi_gis'), (snapshot) => {
      const items: KonstruksiGisItem[] = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as KonstruksiGisItem));
      setKonstruksiGisList(filterDeleted(items));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'konstruksi_gis');
    });

    // Survey PB/PD Sync
    const unsubSurveyPbPd = onSnapshot(collection(db, 'survey_pb_pd'), (snapshot) => {
      const items: SurveyPbPdItem[] = [];
      snapshot.forEach((docSnap) => items.push(docSnap.data() as SurveyPbPdItem));
      setSurveyList(filterDeleted(items));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'survey_pb_pd');
    });

    // Live Chat Messages Sync
    const unsubChatMessages = onSnapshot(collection(db, 'chat_messages'), (snapshot) => {
      const items: ChatMessage[] = [];
      snapshot.forEach((docSnap) => items.push(docSnap.data() as ChatMessage));
      if (items.length > 0) {
        const firestoreIds = new Set(items.map((i) => i.id));
        const merged = [
          ...INITIAL_CHAT_MESSAGES.filter((m) => !firestoreIds.has(m.id)),
          ...items
        ];
        setChatMessagesList(filterDeleted(merged));
      } else {
        setChatMessagesList(filterDeleted(INITIAL_CHAT_MESSAGES));
      }
    }, (error) => {
      console.warn('Chat messages sync (handled):', error);
    });

    // Auto Reply Rules Sync
    const unsubAutoReplies = onSnapshot(collection(db, 'chat_auto_replies'), (snapshot) => {
      const items: AutoReplyRule[] = [];
      snapshot.forEach((docSnap) => items.push(docSnap.data() as AutoReplyRule));
      if (items.length > 0) {
        const firestoreIds = new Set(items.map((i) => i.id));
        const merged = [
          ...INITIAL_AUTO_REPLY_RULES.filter((r) => !firestoreIds.has(r.id)),
          ...items
        ];
        setAutoReplyRulesList(filterDeleted(merged));
      } else {
        setAutoReplyRulesList(filterDeleted(INITIAL_AUTO_REPLY_RULES));
      }
    }, (error) => {
      console.warn('Auto reply rules sync (handled):', error);
    });

    // Online Users Presence Sync (Owner Monitoring)
    const unsubOnlineUsers = onSnapshot(collection(db, 'online_users'), (snapshot) => {
      const items: UserOnlinePresence[] = [];
      snapshot.forEach((docSnap) => items.push(docSnap.data() as UserOnlinePresence));
      setOnlineUsersList(items);
    }, (error) => {
      console.warn('Online users presence sync (handled):', error);
    });

    // System Broadcast Messages Sync
    const unsubBroadcasts = onSnapshot(collection(db, 'broadcast_messages'), (snapshot) => {
      const items: SystemBroadcastMessage[] = [];
      snapshot.forEach((docSnap) => items.push(docSnap.data() as SystemBroadcastMessage));
      // Get the latest active broadcast created within last 24 hours
      const activeMsgs = items
        .filter((m) => m.active)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      if (activeMsgs.length > 0) {
        setActiveBroadcast(activeMsgs[0]);
      } else {
        setActiveBroadcast(null);
      }
    }, (error) => {
      console.warn('Broadcast messages sync (handled):', error);
    });

    // 36. Sync Monitoring Lembur
    const unsubLembur = onSnapshot(collection(db, 'monitoring_lembur'), (snapshot) => {
      const items: MonitoringLemburItem[] = [];
      snapshot.forEach((docSnap) => items.push({ id: docSnap.id, ...docSnap.data() } as MonitoringLemburItem));
      const filtered = filterDeleted(items);
      if (filtered.length > 0) {
        setLemburList(filtered);
      } else {
        // Initial mock data if database is empty
        const initialLembur: MonitoringLemburItem[] = [
          {
            id: 'lbr_1',
            namaPetugas: 'Aris Wattimena',
            nipOrNik: '9518023Z',
            regu: 'Regu Alfa',
            unit: 'ULP Baguala',
            kodeUnit: '54110',
            noSpkOrSuratTugas: '012.SPK/TEK/BAG/2026',
            tanggalLembur: '2026-08-25',
            jamMulai: '17:00',
            jamSelesai: '21:00',
            totalJam: 4,
            alasanLembur: 'Penanganan gangguan tiang miring & trafo trip penyulang Passo',
            jenisPekerjaan: 'Penanganan Gangguan',
            status: 'APPROVED',
            nominalEstimasi: 100000,
            approvedBy: 'Bpk. Daniel Wattimena',
            createdAt: '2026-08-25T16:00:00.000Z'
          },
          {
            id: 'lbr_2',
            namaPetugas: 'Yunus Lekahena',
            nipOrNik: '9617045B',
            regu: 'Regu Delta',
            unit: 'ULP Baguala',
            kodeUnit: '54110',
            noSpkOrSuratTugas: '015.SPK/TEK/BAG/2026',
            tanggalLembur: '2026-08-26',
            jamMulai: '18:00',
            jamSelesai: '22:30',
            totalJam: 4.5,
            alasanLembur: 'Pembersihan dahan pohon bambu menyentuh kabel JTM Passo',
            jenisPekerjaan: 'Pekerjaan ROW Malam',
            status: 'PENDING',
            nominalEstimasi: 112500,
            createdAt: '2026-08-26T17:30:00.000Z'
          }
        ];
        setLemburList(initialLembur);
        initialLembur.forEach((item) => {
          setDoc(doc(db, 'monitoring_lembur', item.id), sanitizeForFirestore(item)).catch(() => {});
        });
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'monitoring_lembur');
    });

    const loadingTimer = setTimeout(() => {
      setIsDataLoading(false);
    }, 600);

    return () => {
      clearTimeout(loadingTimer);
      unsubStok();
      unsubPemakaian();
      unsubAlker();
      unsubGangguan();
      unsubSaidi();
      unsubMasterUnit();
      unsubHelpDesk();
      unsubUsers();
      unsubPenyulang();
      unsubSection();
      unsubMapLayers();
      unsubActivities();
      unsubRow();
      unsubTier1();
      unsubTier2();
      unsubMonitoring();
      unsubSpk();
      unsubKendaraan();
      unsubMasterGardu();
      unsubPengukuran();
      unsubTier1Jtm();
      unsubTier1Gtt();
      unsubTier1Switching();
      unsubThermovision();
      unsubUltrasound();
      unsubscribeAset();
      unsubscribeJadwal();
      unsubPohonGis();
      unsubKonstruksiGis();
      unsubSurveyPbPd();
      unsubChatMessages();
      unsubOnlineUsers();
      unsubBroadcasts();
      unsubLembur();
    };
  }, []);

  // Helper to append log
  const logActivity = async (aktivitas: string, modul: string) => {
    const newLog: ActivityLog = {
      id: `act_${Date.now()}`,
      waktu: new Date().toLocaleString('id-ID'),
      user: user ? user.name : 'Operator SCADA',
      aktivitas,
      modul
    };
    try {
      await setDoc(doc(db, 'activity_logs', newLog.id), newLog);
    } catch (err) {
      console.error('Error saving activity log to Firestore:', err);
    }
  };

  // Presence Heartbeat & Tracking Effect
  useEffect(() => {
    if (!user) return;

    // Immediately update presence when user logs in or switches active view
    updatePresenceInFirestore(user, activeView, 'online');

    // Setup recurring heartbeat every 45 seconds to keep presence fresh
    const heartbeatInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        updatePresenceInFirestore(user, activeView, 'online');
      } else {
        updatePresenceInFirestore(user, activeView, 'idle');
      }
    }, 45 * 1000);

    // Handle visibility changes
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        updatePresenceInFirestore(user, activeView, 'online');
      } else {
        updatePresenceInFirestore(user, activeView, 'idle');
      }
    };

    // Handle window beforeunload / tab close
    const handleUnload = () => {
      markPresenceOfflineInFirestore(user);
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('beforeunload', handleUnload);

    return () => {
      clearInterval(heartbeatInterval);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, [user, activeView]);

  // Detect Force Logout triggered by Owner
  useEffect(() => {
    if (!user) return;
    const myPresence = onlineUsersList.find(
      (p) => (p.username || '').toLowerCase() === (user.username || '').toLowerCase()
    );
    if (myPresence && myPresence.forceLoggedOut && !isOwnerUser(user)) {
      setIsForceLogoutModalOpen(true);
      markPresenceOfflineInFirestore(user);
      setUser(null);
    }
  }, [onlineUsersList, user]);

  // Login handler
  const handleLogin = (authenticatedUser: User) => {
    // Validate that the user exists in registered users list or is owner
    const isValid = authenticatedUser.username === 'owner' || usersList.some(u => u.username === authenticatedUser.username);
    
    if (!isValid) {
      console.error('Login gagal: User tidak terdaftar dalam sistem.');
      return; // Do not update user state
    }

    setUser(authenticatedUser);
    updatePresenceInFirestore(authenticatedUser, activeView, 'online');
    logActivity(`User ${authenticatedUser.name} berhasil login ke sistem PLN ULP Baguala`, 'Sistem Auth');
  };

  // Logout handler
  const handleLogout = () => {
    if (user) {
      markPresenceOfflineInFirestore(user);
      logActivity(`User ${user.name} logout`, 'Sistem Auth');
    }
    setUser(null);
  };

  // Handlers for Map Layers
  const handleToggleMapLayer = async (id: string) => {
    const layer = mapLayers.find((l) => l.id === id);
    if (layer) {
      const updated = { ...layer, visible: !layer.visible };
      setMapLayers((prev) =>
        prev.map((l) => (l.id === id ? updated : l))
      );
      try {
        const firestoreDoc = {
          ...updated,
          coordinates: updated.coordinates.map((c) => ({ lat: c[0], lng: c[1] }))
        };
        await setDoc(doc(db, 'map_layers', id), firestoreDoc);
      } catch (err) {
        console.error('Error toggling map layer in Firestore:', err);
      }
    }
  };

  const handleDeleteMapLayer = async (id: string) => {
    setMapLayers((prev) => prev.filter((l) => l.id !== id));
    try {
      await deleteDoc(doc(db, 'map_layers', id));
      logActivity('Menghapus layer peta GIS feeder import', 'Peta Feeder');
    } catch (err) {
      console.error('Error deleting map layer from Firestore:', err);
    }
  };

  const calculateDistanceKms = (coords: [number, number][]): number => {
    if (!coords || coords.length <= 1) return 0;
    let totalKm = 0;
    for (let i = 0; i < coords.length - 1; i++) {
      const [lat1, lon1] = coords[i];
      const [lat2, lon2] = coords[i + 1];
      const R = 6371;
      const dLat = (lat2 - lat1) * (Math.PI / 180);
      const dLon = (lon2 - lon1) * (Math.PI / 180);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      totalKm += R * c;
    }
    return Number(totalKm.toFixed(2));
  };

  const syncPenyulangLength = async (layerName: string, coords: [number, number][]) => {
    const kms = calculateDistanceKms(coords);
    if (kms <= 0) return;
    const matched = penyulangList.find(
      (p) => p.namaPenyulang.trim().toUpperCase() === layerName.trim().toUpperCase() || p.id === layerName
    );
    if (matched) {
      const updatedPenyulang = { ...matched, panjangJaringanKms: kms };
      setPenyulangList((prev) => prev.map((p) => (p.id === matched.id ? updatedPenyulang : p)));
      try {
        await setDoc(doc(db, 'penyulang_list', matched.id), sanitizeForFirestore(updatedPenyulang));
      } catch (e) {
        console.error('Error syncing penyulang length to Firestore:', e);
      }
    }
  };

  const handleAddMapLayer = async (layer: MapLayerItem) => {
    const layerWithUnit = {
      ...layer,
      unit: layer.unit || user.unit || DEFAULT_UNIT,
      kodeUnit: layer.kodeUnit || user.kodeUnit || getKodeUnitByUnitName(user.unit || DEFAULT_UNIT)
    };
    setMapLayers((prev) => [layerWithUnit, ...prev]);
    await syncPenyulangLength(layerWithUnit.nama, layerWithUnit.coordinates);
    try {
      const firestoreDoc = sanitizeForFirestore({
        ...layerWithUnit,
        coordinates: layerWithUnit.coordinates.map((c) => ({ lat: c[0], lng: c[1] }))
      });
      await setDoc(doc(db, 'map_layers', layerWithUnit.id), firestoreDoc);
      logActivity(`Mengimpor peta feeder baru: ${layerWithUnit.nama}`, 'Peta Feeder');
    } catch (err) {
      console.error('Error adding map layer to Firestore:', err);
    }
  };

  const handleUpdateMapLayer = async (updatedLayer: MapLayerItem) => {
    setMapLayers((prev) => prev.map((l) => (l.id === updatedLayer.id ? updatedLayer : l)));
    await syncPenyulangLength(updatedLayer.nama, updatedLayer.coordinates);
    try {
      const firestoreDoc = sanitizeForFirestore({
        ...updatedLayer,
        coordinates: updatedLayer.coordinates.map((c) => ({ lat: c[0], lng: c[1] }))
      });
      await setDoc(doc(db, 'map_layers', updatedLayer.id), firestoreDoc);
      logActivity(`Mengubah file layer peta GIS: ${updatedLayer.nama}`, 'Peta Feeder');
    } catch (err) {
      console.error('Error updating map layer in Firestore:', err);
    }
  };

  // Synchronized Penyulang List computed directly from gangguan_logs
  const syncedPenyulangList = React.useMemo(() => {
    return penyulangList.map((p) => {
      const feederLogs = gangguanList.filter(
        (g) =>
          g.penyulangId === p.id ||
          (g.namaPenyulang && p.namaPenyulang && g.namaPenyulang.trim().toUpperCase() === p.namaPenyulang.trim().toUpperCase())
      );

      const frekuensiGangguan = feederLogs.length;

      let healthIndexStatus: 'Sempurna' | 'Sehat' | 'Sakit' | 'Kronis' = 'Sempurna';
      if (frekuensiGangguan === 0) healthIndexStatus = 'Sempurna';
      else if (frekuensiGangguan <= 3) healthIndexStatus = 'Sehat';
      else if (frekuensiGangguan <= 6) healthIndexStatus = 'Sakit';
      else healthIndexStatus = 'Kronis';

      const sortedLogs = [...feederLogs].sort((a, b) => (b.tanggal || '').localeCompare(a.tanggal || ''));
      const latestLog = sortedLogs[0];
      let gangguanTerakhir = '';
      if (latestLog) {
        const kodeDisplay = latestLog.kodeGangguan === 'E-5' ? 'Tidak Ditemukan' : (latestLog.kodeGangguan || '-');
        gangguanTerakhir = `${latestLog.tanggal} (${kodeDisplay})`;
      }

      let sectionTerlama = p.sectionTerlama || '';
      if (sortedLogs.length > 0) {
        const secCounts: Record<string, number> = {};
        sortedLogs.forEach((g) => {
          if (g.section && g.section.trim()) {
            secCounts[g.section.trim()] = (secCounts[g.section.trim()] || 0) + 1;
          }
        });
        let maxSec = '';
        let maxCnt = 0;
        Object.entries(secCounts).forEach(([sec, cnt]) => {
          if (cnt > maxCnt) {
            maxCnt = cnt;
            maxSec = sec;
          }
        });
        sectionTerlama = maxSec || sortedLogs[0].section || p.sectionTerlama || '';
      }

      return {
        ...p,
        frekuensiGangguan,
        healthIndexStatus,
        sectionTerlama,
        gangguanTerakhir
      };
    });
  }, [penyulangList, gangguanList]);

  // Dynamic Multi-Unit Data Filtering (Restricts Unit Users & Empowers Owner)
  const filteredGangguanList = useMemo(() => {
    return gangguanList.filter((g) => isDataAccessibleByUser(g, user, ownerSelectedUnitFilter));
  }, [gangguanList, user, ownerSelectedUnitFilter]);

  const filteredPenyulangList = useMemo(() => {
    return syncedPenyulangList.filter((p) => isDataAccessibleByUser(p, user, ownerSelectedUnitFilter));
  }, [syncedPenyulangList, user, ownerSelectedUnitFilter]);

  const filteredSectionList = useMemo(() => {
    return sectionList.filter((s) => isDataAccessibleByUser(s, user, ownerSelectedUnitFilter));
  }, [sectionList, user, ownerSelectedUnitFilter]);

  const filteredRowList = useMemo(() => {
    return rowList.filter((r) => isDataAccessibleByUser(r, user, ownerSelectedUnitFilter));
  }, [rowList, user, ownerSelectedUnitFilter]);

  const filteredTier1List = useMemo(() => {
    return tier1List.filter((t) => isDataAccessibleByUser(t, user, ownerSelectedUnitFilter));
  }, [tier1List, user, ownerSelectedUnitFilter]);

  const filteredTier2List = useMemo(() => {
    return tier2List.filter((t) => isDataAccessibleByUser(t, user, ownerSelectedUnitFilter));
  }, [tier2List, user, ownerSelectedUnitFilter]);

  const filteredTier1JtmList = useMemo(() => {
    return tier1JtmList.filter((t) => isDataAccessibleByUser(t, user, ownerSelectedUnitFilter));
  }, [tier1JtmList, user, ownerSelectedUnitFilter]);

  const filteredTier1GttList = useMemo(() => {
    return tier1GttList.filter((t) => isDataAccessibleByUser(t, user, ownerSelectedUnitFilter));
  }, [tier1GttList, user, ownerSelectedUnitFilter]);

  const filteredTier1SwitchingList = useMemo(() => {
    return tier1SwitchingList.filter((t) => isDataAccessibleByUser(t, user, ownerSelectedUnitFilter));
  }, [tier1SwitchingList, user, ownerSelectedUnitFilter]);

  const filteredThermovisionList = useMemo(() => {
    return thermovisionList.filter((t) => isDataAccessibleByUser(t, user, ownerSelectedUnitFilter));
  }, [thermovisionList, user, ownerSelectedUnitFilter]);

  const filteredUltrasoundList = useMemo(() => {
    return ultrasoundList.filter((u) => isDataAccessibleByUser(u, user, ownerSelectedUnitFilter));
  }, [ultrasoundList, user, ownerSelectedUnitFilter]);

  const filteredInspeksiList = useMemo(() => {
    return inspeksiList.filter((i) => isDataAccessibleByUser(i, user, ownerSelectedUnitFilter));
  }, [inspeksiList, user, ownerSelectedUnitFilter]);

  const filteredMonitoringList = useMemo(() => {
    return monitoringList.filter((m) => isDataAccessibleByUser(m, user, ownerSelectedUnitFilter));
  }, [monitoringList, user, ownerSelectedUnitFilter]);

  const filteredSaidiList = useMemo(() => {
    return saidiList.filter((s) => isDataAccessibleByUser(s, user, ownerSelectedUnitFilter));
  }, [saidiList, user, ownerSelectedUnitFilter]);

  const filteredStokList = useMemo(() => {
    return stokList.filter((s) => isDataAccessibleByUser(s, user, ownerSelectedUnitFilter));
  }, [stokList, user, ownerSelectedUnitFilter]);

  const filteredPemakaianList = useMemo(() => {
    return pemakaianList.filter((p) => isDataAccessibleByUser(p, user, ownerSelectedUnitFilter));
  }, [pemakaianList, user, ownerSelectedUnitFilter]);

  const filteredAlkerApdList = useMemo(() => {
    return alkerApdList.filter((a) => isDataAccessibleByUser(a, user, ownerSelectedUnitFilter));
  }, [alkerApdList, user, ownerSelectedUnitFilter]);

  const filteredSpkList = useMemo(() => {
    return spkList.filter((s) => isDataAccessibleByUser(s, user, ownerSelectedUnitFilter));
  }, [spkList, user, ownerSelectedUnitFilter]);

  const filteredMasterGarduList = useMemo(() => {
    return masterGarduList.filter((g) => isDataAccessibleByUser(g, user, ownerSelectedUnitFilter));
  }, [masterGarduList, user, ownerSelectedUnitFilter]);

  const filteredPengukuranList = useMemo(() => {
    return pengukuranList.filter((p) => isDataAccessibleByUser(p, user, ownerSelectedUnitFilter));
  }, [pengukuranList, user, ownerSelectedUnitFilter]);

  const filteredKendaraanList = useMemo(() => {
    return kendaraanList.filter((k) => isDataAccessibleByUser(k, user, ownerSelectedUnitFilter));
  }, [kendaraanList, user, ownerSelectedUnitFilter]);

  const filteredAsetJaringanList = useMemo(() => {
    return asetJaringanList.filter((a) => isDataAccessibleByUser(a, user, ownerSelectedUnitFilter));
  }, [asetJaringanList, user, ownerSelectedUnitFilter]);

  const filteredJadwalPiketList = useMemo(() => {
    return jadwalPiketList.filter((j) => isDataAccessibleByUser(j, user, ownerSelectedUnitFilter));
  }, [jadwalPiketList, user, ownerSelectedUnitFilter]);

  const filteredPohonGisList = useMemo(() => {
    return pohonGisList.filter((p) => isDataAccessibleByUser(p, user, ownerSelectedUnitFilter));
  }, [pohonGisList, user, ownerSelectedUnitFilter]);

  const filteredKonstruksiGisList = useMemo(() => {
    return konstruksiGisList.filter((k) => isDataAccessibleByUser(k, user, ownerSelectedUnitFilter));
  }, [konstruksiGisList, user, ownerSelectedUnitFilter]);

  const filteredSurveyList = useMemo(() => {
    return surveyList.filter((s) => isDataAccessibleByUser(s, user, ownerSelectedUnitFilter));
  }, [surveyList, user, ownerSelectedUnitFilter]);

  const filteredMapLayers = useMemo(() => {
    return mapLayers.filter((l) => isDataAccessibleByUser(l, user, ownerSelectedUnitFilter));
  }, [mapLayers, user, ownerSelectedUnitFilter]);

  const filteredLemburList = useMemo(() => {
    return lemburList.filter((l) => isDataAccessibleByUser(l, user, ownerSelectedUnitFilter));
  }, [lemburList, user, ownerSelectedUnitFilter]);

  // Handlers for Gangguan (Cloud Firestore synced)
  const handleAddGangguan = async (rawLog: GangguanLog) => {
    const userUnit = user?.unit || DEFAULT_UNIT;
    const userKodeUnit = user?.kodeUnit || getKodeUnitByUnitName(userUnit);
    const log: GangguanLog = {
      ...rawLog,
      unit: rawLog.unit || userUnit,
      kodeUnit: rawLog.kodeUnit || userKodeUnit
    };

    setGangguanList((prev) => {
      const exists = prev.some((g) => g.id === log.id);
      if (exists) {
        return prev.map((g) => (g.id === log.id ? log : g));
      }
      return [log, ...prev];
    });

    try {
      await setDoc(doc(db, 'gangguan_logs', log.id), sanitizeForFirestore(log));
      
      // Recalculate health index for the affected feeder and save to Firestore
      const affectedPenyulang = penyulangList.find(
        (p) => p.id === log.penyulangId || (log.namaPenyulang && p.namaPenyulang && p.namaPenyulang.toUpperCase() === log.namaPenyulang.toUpperCase())
      );
      if (affectedPenyulang) {
        const updatedLogs = [...gangguanList.filter((g) => g.id !== log.id), log].filter(
          (g) => g.penyulangId === affectedPenyulang.id || (g.namaPenyulang && affectedPenyulang.namaPenyulang && g.namaPenyulang.trim().toUpperCase() === affectedPenyulang.namaPenyulang.trim().toUpperCase())
        );
        const newFreq = updatedLogs.length;
        let newStatus: 'Sempurna' | 'Sehat' | 'Sakit' | 'Kronis' = 'Sempurna';
        if (newFreq === 0) newStatus = 'Sempurna';
        else if (newFreq <= 3) newStatus = 'Sehat';
        else if (newFreq <= 6) newStatus = 'Sakit';
        else newStatus = 'Kronis';

        const sortedLogs = [...updatedLogs].sort((a, b) => (b.tanggal || '').localeCompare(a.tanggal || ''));
        const latestLog = sortedLogs[0];
        const kodeDisplay = latestLog ? (latestLog.kodeGangguan === 'E-5' ? 'Tidak Ditemukan' : latestLog.kodeGangguan) : '';
        const gangguanTerakhir = latestLog ? `${latestLog.tanggal} (${kodeDisplay})` : '';

        const updatedPenyulang = {
          ...affectedPenyulang,
          frekuensiGangguan: newFreq,
          healthIndexStatus: newStatus,
          sectionTerlama: log.section || affectedPenyulang.sectionTerlama,
          gangguanTerakhir
        };

        await setDoc(doc(db, 'penyulang_list', updatedPenyulang.id), sanitizeForFirestore(updatedPenyulang));
      }
    } catch (err) {
      console.error('Error saving Gangguan to Firestore:', err);
    }

    logActivity(`Menyimpan log gangguan trip penyulang ${log.namaPenyulang} (${log.kodeGangguan})`, 'Matriks Gangguan');
  };

  const handleDeleteGangguan = async (id: string) => {
    registerDeletedId(id);
    const logToDelete = gangguanList.find((g) => g.id === id);
    setGangguanList((prev) => prev.filter((g) => g.id !== id));
    try {
      await deleteDoc(doc(db, 'gangguan_logs', id));
      
      if (logToDelete) {
        const affectedPenyulang = penyulangList.find(
          (p) => p.id === logToDelete.penyulangId || (logToDelete.namaPenyulang && p.namaPenyulang && p.namaPenyulang.toUpperCase() === logToDelete.namaPenyulang.toUpperCase())
        );
        if (affectedPenyulang) {
          const remainingLogs = gangguanList.filter(
            (g) => g.id !== id && (g.penyulangId === affectedPenyulang.id || (g.namaPenyulang && affectedPenyulang.namaPenyulang && g.namaPenyulang.trim().toUpperCase() === affectedPenyulang.namaPenyulang.trim().toUpperCase()))
          );
          const newFreq = remainingLogs.length;
          let newStatus: 'Sempurna' | 'Sehat' | 'Sakit' | 'Kronis' = 'Sempurna';
          if (newFreq === 0) newStatus = 'Sempurna';
          else if (newFreq <= 3) newStatus = 'Sehat';
          else if (newFreq <= 6) newStatus = 'Sakit';
          else newStatus = 'Kronis';

          const sortedLogs = [...remainingLogs].sort((a, b) => (b.tanggal || '').localeCompare(a.tanggal || ''));
          const latestLog = sortedLogs[0];
          const kodeDisplay = latestLog ? (latestLog.kodeGangguan === 'E-5' ? 'Tidak Ditemukan' : latestLog.kodeGangguan) : '';
          const gangguanTerakhir = latestLog ? `${latestLog.tanggal} (${kodeDisplay})` : '';

          const updatedPenyulang = {
            ...affectedPenyulang,
            frekuensiGangguan: newFreq,
            healthIndexStatus: newStatus,
            gangguanTerakhir
          };
          await setDoc(doc(db, 'penyulang_list', updatedPenyulang.id), sanitizeForFirestore(updatedPenyulang));
        }
      }
    } catch (err) {
      console.error('Error deleting Gangguan from Firestore:', err);
    }
    logActivity('Menghapus log gangguan penyulang', 'Matriks Gangguan');
  };

  // Handlers for Master Data
  const handleAddPenyulang = async (p: Penyulang) => {
    const isEdit = penyulangList.some((item) => item.id === p.id);
    setPenyulangList((prev) => {
      const exists = prev.some((item) => item.id === p.id);
      if (exists) {
        return prev.map((item) => (item.id === p.id ? p : item));
      }
      return [p, ...prev];
    });
    try {
      await setDoc(doc(db, 'penyulang_list', p.id), sanitizeForFirestore(p));
      logActivity(
        isEdit
          ? `Mengubah data master penyulang: ${p.namaPenyulang} (${p.kodeId})`
          : `Menambah penyulang baru: ${p.namaPenyulang} (${p.kodeId})`,
        'Master Data'
      );
    } catch (err) {
      console.error('Error saving Penyulang to Firestore:', err);
    }
  };

  const handleDeletePenyulang = async (id: string) => {
    registerDeletedId(id);
    setPenyulangList((prev) => prev.filter((p) => p.id !== id));
    try {
      await deleteDoc(doc(db, 'penyulang_list', id));
      logActivity('Menghapus data master penyulang', 'Master Data');
    } catch (err) {
      console.error('Error deleting Penyulang from Firestore:', err);
    }
  };

  const handleAddSection = async (s: SectionJaringan) => {
    const isEdit = sectionList.some((item) => item.id === s.id);
    setSectionList((prev) => {
      const exists = prev.some((item) => item.id === s.id);
      if (exists) {
        return prev.map((item) => (item.id === s.id ? s : item));
      }
      return [s, ...prev];
    });
    try {
      await setDoc(doc(db, 'section_list', s.id), sanitizeForFirestore(s));
      logActivity(
        isEdit
          ? `Mengubah data master section jaringan: ${s.namaSection}`
          : `Menambah section baru: ${s.namaSection}`,
        'Master Data'
      );
    } catch (err) {
      console.error('Error saving Section to Firestore:', err);
    }
  };

  const handleDeleteSection = async (id: string) => {
    registerDeletedId(id);
    setSectionList((prev) => prev.filter((s) => s.id !== id));
    try {
      await deleteDoc(doc(db, 'section_list', id));
      logActivity('Menghapus data section jaringan', 'Master Data');
    } catch (err) {
      console.error('Error deleting Section from Firestore:', err);
    }
  };

  // Handlers for SAIDI / SAIFI (Cloud Firestore synced)
  const handleAddSaidi = async (rawData: SaidiSaifiData) => {
    const userUnit = user?.unit || DEFAULT_UNIT;
    const userKodeUnit = user?.kodeUnit || getKodeUnitByUnitName(userUnit);
    const data: SaidiSaifiData = {
      ...rawData,
      unit: rawData.unit || userUnit,
      kodeUnit: rawData.kodeUnit || userKodeUnit
    };

    setSaidiList((prev) => [data, ...prev]);
    try {
      await setDoc(doc(db, 'saidi_saifi_logs', data.id), sanitizeForFirestore(data));
    } catch (err) {
      console.error('Error saving SAIDI to Firestore:', err);
    }
    logActivity(`Memperbarui data SAIDI/SAIFI & ENS bulan ${data.bulan} ${data.tahun}`, 'SAIDI/SAIFI');
  };

  const handleDeleteSaidi = async (id: string) => {
    registerDeletedId(id);
    setSaidiList((prev) => prev.filter((s) => s.id !== id));
    try {
      await deleteDoc(doc(db, 'saidi_saifi_logs', id));
    } catch (err) {
      console.error('Error deleting SAIDI from Firestore:', err);
    }
    logActivity('Menghapus data rekap SAIDI/SAIFI', 'SAIDI/SAIFI');
  };

  // Handlers for Material Stok Masuk
  const handleAddStok = async (rawItem: MaterialStokItem) => {
    const userUnit = user?.unit || DEFAULT_UNIT;
    const userKodeUnit = user?.kodeUnit || getKodeUnitByUnitName(userUnit);
    const item: MaterialStokItem = {
      ...rawItem,
      unit: rawItem.unit || userUnit,
      kodeUnit: rawItem.kodeUnit || userKodeUnit
    };

    setStokList((prev) => [item, ...prev]);
    try {
      await setDoc(doc(db, 'material_stok', item.id), sanitizeForFirestore(item));
    } catch (err) {
      console.error('Error saving Material Stok to Firestore:', err);
    }
    logActivity(`Menambah stok masuk material: ${item.namaMaterial} (${item.qty} ${item.satuan})`, 'Manajemen Material');
  };

  const handleUpdateStok = async (item: MaterialStokItem) => {
    setStokList((prev) => prev.map((s) => (s.id === item.id ? item : s)));
    try {
      await setDoc(doc(db, 'material_stok', item.id), sanitizeForFirestore(item));
    } catch (err) {
      console.error('Error updating Material Stok in Firestore:', err);
    }
    logActivity(`Memperbarui stok masuk material: ${item.namaMaterial}`, 'Manajemen Material');
  };

  const handleDeleteStok = async (id: string) => {
    registerDeletedId(id);
    setStokList((prev) => prev.filter((s) => s.id !== id));
    try {
      await deleteDoc(doc(db, 'material_stok', id));
    } catch (err) {
      console.error('Error deleting Material Stok from Firestore:', err);
    }
    logActivity('Menghapus data stok masuk material', 'Manajemen Material');
  };

  // Handlers for Material Pemakaian
  const handleAddPemakaian = async (rawItem: MaterialPemakaianItem) => {
    const userUnit = user?.unit || DEFAULT_UNIT;
    const userKodeUnit = user?.kodeUnit || getKodeUnitByUnitName(userUnit);
    const item: MaterialPemakaianItem = {
      ...rawItem,
      unit: rawItem.unit || userUnit,
      kodeUnit: rawItem.kodeUnit || userKodeUnit
    };

    setPemakaianList((prev) => [item, ...prev]);
    try {
      await setDoc(doc(db, 'material_pemakaian', item.id), sanitizeForFirestore(item));
    } catch (err) {
      console.error('Error saving Pemakaian Material to Firestore:', err);
    }
    logActivity(`Catat pemakaian material: ${item.namaMaterial} (${item.qty} ${item.satuan}) di ${item.lokasi}`, 'Manajemen Material');
  };

  const handleUpdatePemakaian = async (item: MaterialPemakaianItem) => {
    setPemakaianList((prev) => prev.map((p) => (p.id === item.id ? item : p)));
    try {
      await setDoc(doc(db, 'material_pemakaian', item.id), sanitizeForFirestore(item));
    } catch (err) {
      console.error('Error updating Pemakaian Material in Firestore:', err);
    }
    logActivity(`Memperbarui log pemakaian material: ${item.namaMaterial}`, 'Manajemen Material');
  };

  const handleDeletePemakaian = async (id: string) => {
    registerDeletedId(id);
    setPemakaianList((prev) => prev.filter((p) => p.id !== id));
    try {
      await deleteDoc(doc(db, 'material_pemakaian', id));
    } catch (err) {
      console.error('Error deleting Pemakaian Material from Firestore:', err);
    }
    logActivity('Menghapus log pemakaian material', 'Manajemen Material');
  };

  // Handlers for Alat Kerja dan APD
  const handleAddAlkerApd = async (rawItem: AlkerApdItem) => {
    const userUnit = user?.unit || DEFAULT_UNIT;
    const userKodeUnit = user?.kodeUnit || getKodeUnitByUnitName(userUnit);
    const item: AlkerApdItem = {
      ...rawItem,
      unit: rawItem.unit || userUnit,
      kodeUnit: rawItem.kodeUnit || userKodeUnit
    };

    setAlkerApdList((prev) => [item, ...prev]);
    try {
      await setDoc(doc(db, 'alkerdan_apd', item.id), sanitizeForFirestore(item));
    } catch (err) {
      console.error('Error saving Alat Kerja / APD to Firestore:', err);
    }
    logActivity(`Menambah inventaris Alker/APD: ${item.namaAlker} (${item.jumlah} unit)`, 'Alat Kerja & APD');
  };

  const handleUpdateAlkerApd = async (item: AlkerApdItem) => {
    setAlkerApdList((prev) => prev.map((a) => (a.id === item.id ? item : a)));
    try {
      await setDoc(doc(db, 'alkerdan_apd', item.id), sanitizeForFirestore(item));
    } catch (err) {
      console.error('Error updating Alat Kerja / APD in Firestore:', err);
    }
    logActivity(`Memperbarui data Alker/APD: ${item.namaAlker}`, 'Alat Kerja & APD');
  };

  const handleDeleteAlkerApd = async (id: string) => {
    registerDeletedId(id);
    setAlkerApdList((prev) => prev.filter((a) => a.id !== id));
    try {
      await deleteDoc(doc(db, 'alkerdan_apd', id));
    } catch (err) {
      console.error('Error deleting Alat Kerja / APD from Firestore:', err);
    }
    logActivity('Menghapus data inventaris Alker/APD', 'Alat Kerja & APD');
  };

  // Chat Message Handlers
  const handleAddChatMessage = (newMsg: ChatMessage) => {
    setChatMessagesList((prev) => {
      if (prev.some((m) => m.id === newMsg.id)) return prev;
      return [...prev, newMsg];
    });
  };

  const handleDeleteChatMessage = (msgId: string) => {
    registerDeletedId(msgId);
    setChatMessagesList((prev) => prev.filter((m) => m.id !== msgId));
  };

  const handleClearChatMessages = async () => {
    const listToDelete = [...chatMessagesList];
    setChatMessagesList([]);
    try {
      const deletePromises = listToDelete.map((msg) => {
        registerDeletedId(msg.id);
        return deleteDoc(doc(db, 'chat_messages', msg.id)).catch(() => {});
      });
      await Promise.all(deletePromises);
    } catch (err) {
      console.error('Error clearing chat messages in Firestore:', err);
    }
    logActivity('Pembersihan riwayat obrolan Live Chat', 'Live Chat');
  };

  const handleSaveAutoReplyRule = async (rule: AutoReplyRule) => {
    setAutoReplyRulesList((prev) => {
      const idx = prev.findIndex((r) => r.id === rule.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = rule;
        return next;
      }
      return [rule, ...prev];
    });
    try {
      await setDoc(doc(db, 'chat_auto_replies', rule.id), rule);
    } catch (err) {
      console.error('Error saving auto reply rule to Firestore:', err);
    }
    logActivity(`Mengubah/Menambah Aturan Pesan Otomatis: ${rule.title}`, 'Live Chat');
  };

  const handleDeleteAutoReplyRule = async (ruleId: string) => {
    registerDeletedId(ruleId);
    setAutoReplyRulesList((prev) => prev.filter((r) => r.id !== ruleId));
    try {
      await deleteDoc(doc(db, 'chat_auto_replies', ruleId));
    } catch (err) {
      console.error('Error deleting auto reply rule from Firestore:', err);
    }
    logActivity(`Menghapus Aturan Pesan Otomatis ID: ${ruleId}`, 'Live Chat');
  };

  // User Management Handlers
  const handleAddUser = async (newUser: User) => {
    // If a non-owner tries to create an Owner account, disallow
    if (isOwnerUser(newUser) && !isOwnerUser(user)) {
      console.warn('Operasi ditolak: Hanya Owner yang dapat membuat akun Owner.');
      return;
    }
    setUsersList((prev) => [newUser, ...prev]);
    try {
      const docId = newUser.id || newUser.username;
      await setDoc(doc(db, 'app_users', docId), sanitizeForFirestore(newUser));
    } catch (err) {
      console.error('Error saving user to Firestore:', err);
    }
    logActivity(`Menambah user baru: ${newUser.name} (${newUser.role})`, 'Kelola User');
  };

  const handleUpdateUser = async (updatedUser: User) => {
    // Strict Protection: Owner account can only be updated by Owner itself
    if (isOwnerUser(updatedUser) && !isOwnerUser(user)) {
      console.warn('Operasi ditolak: Akun Owner dilindungi dan hanya dapat diedit oleh Owner.');
      return;
    }
    setUsersList((prev) => prev.map((u) => (u.username === updatedUser.username ? updatedUser : u)));
    try {
      const docId = updatedUser.id || updatedUser.username;
      await setDoc(doc(db, 'app_users', docId), sanitizeForFirestore(updatedUser));
    } catch (err) {
      console.error('Error updating user in Firestore:', err);
    }
    logActivity(`Memperbarui role/data user: ${updatedUser.name} (${updatedUser.role})`, 'Kelola User');
  };

  const handleDeleteUser = async (idOrUsername: string) => {
    // Strict Protection: Owner account can NEVER be deleted
    if (idOrUsername === 'usr_owner' || idOrUsername.toLowerCase() === 'owner') {
      console.warn('Operasi ditolak: Akun Owner Sistem dilindungi dan tidak dapat dihapus.');
      return;
    }
    const targetUser = usersList.find((u) => u.id === idOrUsername || u.username === idOrUsername);
    if (targetUser && isOwnerUser(targetUser)) {
      console.warn('Operasi ditolak: Akun Owner Sistem dilindungi dan tidak dapat dihapus.');
      return;
    }

    registerDeletedId(idOrUsername);
    setUsersList((prev) => prev.filter((u) => u.id !== idOrUsername && u.username !== idOrUsername));
    try {
      await deleteDoc(doc(db, 'app_users', idOrUsername));
    } catch (err) {
      console.error('Error deleting user from Firestore:', err);
    }
    logActivity('Menghapus user dari sistem', 'Kelola User');
  };

  // Perintah Kerja Harian (SPK) Handlers
  const handleAddSpk = async (rawSpk: PerintahKerja) => {
    const userUnit = user?.unit || DEFAULT_UNIT;
    const userKodeUnit = user?.kodeUnit || getKodeUnitByUnitName(userUnit);
    const newSpk: PerintahKerja = {
      ...rawSpk,
      unit: rawSpk.unit || userUnit,
      kodeUnit: rawSpk.kodeUnit || userKodeUnit
    };

    setSpkList((prev) => [newSpk, ...prev]);
    try {
      await setDoc(doc(db, 'perintah_kerja_harian', newSpk.id), sanitizeForFirestore(newSpk));
      // Kirim notifikasi WhatsApp ke petugas pelaksana segera setelah SPK baru disimpan ke database
      await sendWaNotification(newSpk);
    } catch (err) {
      console.error('Error saving SPK or sending WA notification:', err);
    }
    logActivity(`Penerbitan SPK baru ${newSpk.noSpk} (${newSpk.jenisPekerjaan})`, newSpk.namaPenyulang);
  };

  const handleUpdateSpk = async (updatedSpk: PerintahKerja) => {
    setSpkList((prev) => prev.map((s) => (s.id === updatedSpk.id ? updatedSpk : s)));
    try {
      await setDoc(doc(db, 'perintah_kerja_harian', updatedSpk.id), sanitizeForFirestore(updatedSpk));
    } catch (err) {
      console.error('Error updating SPK in Firestore:', err);
    }
    logActivity(`Memperbarui SPK ${updatedSpk.noSpk} -> Status: ${updatedSpk.status}`, updatedSpk.namaPenyulang);
  };

  const handleDeleteSpk = async (id: string) => {
    registerDeletedId(id);
    setSpkList((prev) => prev.filter((s) => s.id !== id));
    try {
      await deleteDoc(doc(db, 'perintah_kerja_harian', id));
    } catch (err) {
      console.error('Error deleting SPK from Firestore:', err);
    }
    logActivity('Menghapus data Surat Perintah Kerja (SPK)', 'Perintah Kerja');
  };

  // Master Gardu Handlers
  const handleAddMasterGardu = async (rawGardu: MasterGardu) => {
    const userUnit = user?.unit || DEFAULT_UNIT;
    const userKodeUnit = user?.kodeUnit || getKodeUnitByUnitName(userUnit);
    const gardu: MasterGardu = {
      ...rawGardu,
      unit: rawGardu.unit || userUnit,
      kodeUnit: rawGardu.kodeUnit || userKodeUnit
    };

    setMasterGarduList((prev) => {
      const exists = prev.some((g) => g.id === gardu.id);
      if (exists) {
        return prev.map((g) => (g.id === gardu.id ? gardu : g));
      }
      return [gardu, ...prev];
    });
    try {
      await setDoc(doc(db, 'master_gardu', gardu.id), sanitizeForFirestore(gardu));
    } catch (err) {
      console.error('Error saving Master Gardu to Firestore:', err);
    }
    logActivity(`Memperbarui/Tambah Master Gardu: ${gardu.noGarduBaru} (${gardu.penyulang})`, gardu.penyulang);
  };

  const handleImportMasterGardu = async (items: MasterGardu[]) => {
    const userUnit = user?.unit || DEFAULT_UNIT;
    const userKodeUnit = user?.kodeUnit || getKodeUnitByUnitName(userUnit);
    const taggedItems = items.map((i) => ({
      ...i,
      unit: i.unit || userUnit,
      kodeUnit: i.kodeUnit || userKodeUnit
    }));
    const finalItemsToSave: MasterGardu[] = [];

    setMasterGarduList((prev) => {
      const updatedPrev = prev.map((existingGardu) => {
        const match = taggedItems.find(
          (item) =>
            item.id === existingGardu.id ||
            (item.noGarduBaru &&
              item.noGarduBaru.trim().toLowerCase() === (existingGardu.noGarduBaru || '').trim().toLowerCase()) ||
            (item.ssotNumber &&
              item.ssotNumber !== '-' &&
              item.ssotNumber.trim().toLowerCase() === (existingGardu.ssotNumber || '').trim().toLowerCase())
        );
        if (match) {
          const merged = { ...existingGardu, ...match, id: existingGardu.id };
          finalItemsToSave.push(merged);
          return merged;
        }
        return existingGardu;
      });

      const matchedBaruSet = new Set(
        finalItemsToSave.map((f) => (f.noGarduBaru || '').trim().toLowerCase())
      );
      const trulyNewItems = taggedItems.filter(
        (item) => !matchedBaruSet.has((item.noGarduBaru || '').trim().toLowerCase())
      );

      trulyNewItems.forEach((newItem) => finalItemsToSave.push(newItem));

      return [...trulyNewItems, ...updatedPrev];
    });

    try {
      const batch = writeBatch(db);
      finalItemsToSave.forEach((g) => {
        batch.set(doc(db, 'master_gardu', g.id), sanitizeForFirestore(g));
      });
      await batch.commit();
    } catch (err) {
      console.error('Error batch saving Master Gardu to Firestore:', err);
    }
    logActivity(`Import ${items.length} Master Gardu dari Excel`, 'Master Data');
  };

  const handleDeleteMasterGardu = async (id: string) => {
    registerDeletedId(id);
    setMasterGarduList((prev) => prev.filter((g) => g.id !== id));
    try {
      await deleteDoc(doc(db, 'master_gardu', id));
    } catch (err) {
      console.error('Error deleting Master Gardu from Firestore:', err);
    }
    logActivity('Menghapus Master Gardu', 'Master Data');
  };

  const handleDeleteAllMasterGardu = async () => {
    const listToDelete = [...masterGarduList];
    if (listToDelete.length === 0) return;

    listToDelete.forEach((g) => registerDeletedId(g.id));
    setMasterGarduList([]);

    try {
      const batchSize = 450;
      for (let i = 0; i < listToDelete.length; i += batchSize) {
        const chunk = listToDelete.slice(i, i + batchSize);
        const batch = writeBatch(db);
        chunk.forEach((g) => {
          batch.delete(doc(db, 'master_gardu', g.id));
        });
        await batch.commit();
      }
    } catch (err) {
      console.error('Error batch deleting all Master Gardu from Firestore:', err);
    }
    logActivity(`Menghapus seluruh Master Data Gardu (${listToDelete.length} gardu)`, 'Master Data');
  };

  // Pengukuran Gardu Handlers
  const handleAddPengukuranGardu = async (rawPkg: PengukuranGardu) => {
    const userUnit = user?.unit || DEFAULT_UNIT;
    const userKodeUnit = user?.kodeUnit || getKodeUnitByUnitName(userUnit);
    const pkg: PengukuranGardu = {
      ...rawPkg,
      unit: rawPkg.unit || userUnit,
      kodeUnit: rawPkg.kodeUnit || userKodeUnit
    };

    setPengukuranList((prev) => {
      const exists = prev.some((p) => p.id === pkg.id);
      if (exists) {
        return prev.map((p) => (p.id === pkg.id ? pkg : p));
      }
      return [pkg, ...prev];
    });
    try {
      await setDoc(doc(db, 'pengukuran_gardu', pkg.id), sanitizeForFirestore(pkg));
    } catch (err) {
      console.error('Error saving Pengukuran Gardu to Firestore:', err);
    }
    logActivity(`Input/Edit Pengukuran Gardu: ${pkg.noGardu} (${pkg.tanggalUkur})`, pkg.penyulang);
  };

  const handleImportPengukuranGardu = async (items: PengukuranGardu[]) => {
    const userUnit = user?.unit || DEFAULT_UNIT;
    const userKodeUnit = user?.kodeUnit || getKodeUnitByUnitName(userUnit);
    const taggedItems = items.map((i) => ({
      ...i,
      unit: i.unit || userUnit,
      kodeUnit: i.kodeUnit || userKodeUnit
    }));

    setPengukuranList((prev) => {
      const existingIds = new Set(taggedItems.map((i) => i.id));
      const filteredPrev = prev.filter((p) => !existingIds.has(p.id));
      return [...taggedItems, ...filteredPrev];
    });
    try {
      const batch = writeBatch(db);
      taggedItems.forEach((item) => {
        batch.set(doc(db, 'pengukuran_gardu', item.id), sanitizeForFirestore(item));
      });
      await batch.commit();
    } catch (err) {
      console.error('Error batch saving Pengukuran Gardu to Firestore:', err);
    }
    logActivity(`Import ${items.length} Data Pengukuran Beban Gardu dari Excel`, 'Pengukuran Gardu');
  };

  const handleDeletePengukuranGardu = async (id: string) => {
    registerDeletedId(id);
    setPengukuranList((prev) => prev.filter((p) => p.id !== id));
    try {
      await deleteDoc(doc(db, 'pengukuran_gardu', id));
    } catch (err) {
      console.error('Error deleting Pengukuran Gardu from Firestore:', err);
    }
    logActivity('Menghapus data pengukuran beban gardu', 'Pengukuran Gardu');
  };

  const handleDeleteAllPengukuran = async () => {
    const listToDelete = [...pengukuranList];
    if (listToDelete.length === 0) return;

    listToDelete.forEach((p) => registerDeletedId(p.id));
    setPengukuranList([]);

    try {
      const deletePromises = listToDelete.map((p) => deleteDoc(doc(db, 'pengukuran_gardu', p.id)).catch(() => {}));
      await Promise.all(deletePromises);
    } catch (err) {
      console.error('Error deleting all Pengukuran Gardu from Firestore:', err);
    }
    logActivity(`Menghapus seluruh Data Pengukuran Gardu (${listToDelete.length} data)`, 'Pengukuran Gardu');
  };

  // Kendaraan Operasional Handlers
  const handleAddKendaraan = async (rawKendaraan: KendaraanOperasional) => {
    const userUnit = user?.unit || DEFAULT_UNIT;
    const userKodeUnit = user?.kodeUnit || getKodeUnitByUnitName(userUnit);
    const kendaraan: KendaraanOperasional = {
      ...rawKendaraan,
      unit: rawKendaraan.unit || userUnit,
      kodeUnit: rawKendaraan.kodeUnit || userKodeUnit
    };

    setKendaraanList((prev) => [kendaraan, ...prev]);
    try {
      await setDoc(doc(db, 'kendaraan_operasional', kendaraan.id), sanitizeForFirestore(kendaraan));
    } catch (err) {
      console.error('Error saving Kendaraan Operasional to Firestore:', err);
    }
    logActivity(`Tambah Kendaraan Operasional: ${kendaraan.namaKendaraan} (${kendaraan.noPolisi})`, 'Kendaraan Operasional');
  };

  const handleUpdateKendaraan = async (kendaraan: KendaraanOperasional) => {
    setKendaraanList((prev) => prev.map((k) => (k.id === kendaraan.id ? kendaraan : k)));
    try {
      await setDoc(doc(db, 'kendaraan_operasional', kendaraan.id), sanitizeForFirestore(kendaraan));
    } catch (err) {
      console.error('Error updating Kendaraan Operasional to Firestore:', err);
    }
    logActivity(`Update Kendaraan Operasional: ${kendaraan.namaKendaraan} (${kendaraan.noPolisi})`, 'Kendaraan Operasional');
  };

  const handleDeleteKendaraan = async (id: string) => {
    registerDeletedId(id);
    setKendaraanList((prev) => prev.filter((k) => k.id !== id));
    try {
      await deleteDoc(doc(db, 'kendaraan_operasional', id));
    } catch (err) {
      console.error('Error deleting Kendaraan Operasional from Firestore:', err);
    }
    logActivity('Menghapus data Kendaraan Operasional', 'Kendaraan Operasional');
  };

  // Aset Jaringan Handlers
  const handleAddAset = async (data: Omit<AsetJaringan, 'id'>) => {
    const id = `aset-${Date.now()}`;
    const userUnit = user?.unit || DEFAULT_UNIT;
    const userKodeUnit = user?.kodeUnit || getKodeUnitByUnitName(userUnit);
    const newAset = { id, unit: userUnit, kodeUnit: userKodeUnit, ...data };
    setAsetJaringanList(prev => [newAset, ...prev]);
    try {
      await setDoc(doc(db, 'aset_jaringan', id), sanitizeForFirestore(newAset));
    } catch (err) {
      console.error('Error saving Aset Jaringan to Firestore:', err);
    }
    logActivity(`Tambah Aset Jaringan: ${data.namaPenyulang}`, 'Aset Jaringan');
  };

  const handleUpdateAset = async (id: string, data: Partial<AsetJaringan>) => {
    setAsetJaringanList(prev => prev.map(a => a.id === id ? { ...a, ...data } : a));
    try {
      const docRef = doc(db, 'aset_jaringan', id);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        await setDoc(docRef, sanitizeForFirestore({ ...snap.data(), ...data }));
      }
    } catch (err) {
      console.error('Error updating Aset Jaringan to Firestore:', err);
    }
    logActivity(`Update Aset Jaringan: ${data.namaPenyulang || id}`, 'Aset Jaringan');
  };

  const handleDeleteAset = async (id: string) => {
    registerDeletedId(id);
    setAsetJaringanList(prev => prev.filter(a => a.id !== id));
    try {
      await deleteDoc(doc(db, 'aset_jaringan', id));
    } catch (err) {
      console.error('Error deleting Aset Jaringan from Firestore:', err);
    }
    logActivity('Menghapus data Aset Jaringan', 'Aset Jaringan');
  };

  // Jadwal Piket Handlers
  const handleAddJadwal = async (data: Omit<JadwalPiket, 'id'>) => {
    const id = `jp-${Date.now()}`;
    const userUnit = user?.unit || DEFAULT_UNIT;
    const userKodeUnit = user?.kodeUnit || getKodeUnitByUnitName(userUnit);
    const newJadwal = { id, unit: userUnit, kodeUnit: userKodeUnit, ...data };
    setJadwalPiketList(prev => [newJadwal, ...prev]);
    try {
      await setDoc(doc(db, 'jadwal_piket', id), sanitizeForFirestore(newJadwal));
    } catch (err) {
      console.error('Error saving Jadwal Piket to Firestore:', err);
    }
    logActivity(`Tambah Jadwal Piket: ${data.namaPetugas}`, 'Jadwal Piket');
  };

  const handleUpdateJadwal = async (id: string, data: Partial<JadwalPiket>) => {
    setJadwalPiketList(prev => prev.map(j => j.id === id ? { ...j, ...data } : j));
    try {
      const docRef = doc(db, 'jadwal_piket', id);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        await setDoc(docRef, sanitizeForFirestore({ ...snap.data(), ...data }));
      }
    } catch (err) {
      console.error('Error updating Jadwal Piket in Firestore:', err);
    }
    logActivity(`Update Jadwal Piket: ${data.namaPetugas || id}`, 'Jadwal Piket');
  };

  const handleDeleteJadwal = async (id: string) => {
    registerDeletedId(id);
    setJadwalPiketList(prev => prev.filter(j => j.id !== id));
    try {
      await deleteDoc(doc(db, 'jadwal_piket', id));
    } catch (err) {
      console.error('Error deleting Jadwal Piket from Firestore:', err);
    }
    logActivity('Menghapus data Jadwal Piket', 'Jadwal Piket');
  };

  // Monitoring Lembur Handlers
  const handleAddLembur = async (data: Omit<MonitoringLemburItem, 'id'>) => {
    const id = `lbr-${Date.now()}`;
    const userUnit = user?.unit || DEFAULT_UNIT;
    const userKodeUnit = user?.kodeUnit || getKodeUnitByUnitName(userUnit);
    const newLembur = { id, unit: userUnit, kodeUnit: userKodeUnit, ...data };
    setLemburList(prev => [newLembur, ...prev]);
    try {
      await setDoc(doc(db, 'monitoring_lembur', id), sanitizeForFirestore(newLembur));
    } catch (err) {
      console.error('Error saving Monitoring Lembur to Firestore:', err);
    }
    logActivity(`Tambah Pengajuan Lembur: ${data.namaPetugas}`, 'Monitoring Lembur');
  };

  const handleUpdateLembur = async (id: string, data: Partial<MonitoringLemburItem>) => {
    setLemburList(prev => prev.map(l => l.id === id ? { ...l, ...data } : l));
    try {
      const docRef = doc(db, 'monitoring_lembur', id);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        await setDoc(docRef, sanitizeForFirestore({ ...snap.data(), ...data }));
      }
    } catch (err) {
      console.error('Error updating Monitoring Lembur in Firestore:', err);
    }
    logActivity(`Update Pengajuan Lembur: ${data.namaPetugas || id}`, 'Monitoring Lembur');
  };

  const handleDeleteLembur = async (id: string) => {
    registerDeletedId(id);
    setLemburList(prev => prev.filter(l => l.id !== id));
    try {
      await deleteDoc(doc(db, 'monitoring_lembur', id));
    } catch (err) {
      console.error('Error deleting Monitoring Lembur from Firestore:', err);
    }
    logActivity('Menghapus data Pengajuan Lembur', 'Monitoring Lembur');
  };

  // Handlers for Peta Pohon GIS
  const handleAddPohonGis = async (rawItem: PohonGisItem) => {
    const userUnit = user?.unit || DEFAULT_UNIT;
    const userKodeUnit = user?.kodeUnit || getKodeUnitByUnitName(userUnit);
    const item: PohonGisItem = {
      ...rawItem,
      unit: rawItem.unit || userUnit,
      kodeUnit: rawItem.kodeUnit || userKodeUnit
    };

    setPohonGisList((prev) => [item, ...prev.filter((p) => p.id !== item.id)]);
    try {
      await setDoc(doc(db, 'pohon_gis', item.id), sanitizeForFirestore(item));
    } catch (err) {
      console.error('Error saving Pohon GIS to Firestore:', err);
    }
    logActivity(`Tambah titik potensi pohon rawan GIS: ${item.jenisPohon} di ${item.penyulang} (${item.lokasi})`, 'Peta Pohon GIS');
  };

  const handleBatchAddPohonGis = async (items: PohonGisItem[]) => {
    const userUnit = user?.unit || DEFAULT_UNIT;
    const userKodeUnit = user?.kodeUnit || getKodeUnitByUnitName(userUnit);
    const taggedItems = items.map((i) => ({
      ...i,
      unit: i.unit || userUnit,
      kodeUnit: i.kodeUnit || userKodeUnit
    }));

    const itemIds = new Set(taggedItems.map((i) => i.id));
    setPohonGisList((prev) => [...taggedItems, ...prev.filter((p) => !itemIds.has(p.id))]);
    try {
      for (const item of taggedItems) {
        await setDoc(doc(db, 'pohon_gis', item.id), sanitizeForFirestore(item));
      }
    } catch (err) {
      console.error('Error saving batch Pohon GIS to Firestore:', err);
    }
    logActivity(`Import ${items.length} titik pohon GIS dari file`, 'Peta Pohon GIS');
  };

  const handleUpdatePohonGis = async (item: PohonGisItem) => {
    setPohonGisList((prev) => prev.map((p) => (p.id === item.id ? item : p)));
    try {
      await setDoc(doc(db, 'pohon_gis', item.id), sanitizeForFirestore(item));
    } catch (err) {
      console.error('Error updating Pohon GIS in Firestore:', err);
    }
    logActivity(`Update titik pohon GIS: ${item.jenisPohon} (${item.statusEksekusi})`, 'Peta Pohon GIS');
  };

  const handleDeletePohonGis = async (id: string) => {
    if (!id) return;
    registerDeletedId(id);
    setPohonGisList((prev) => prev.filter((p) => p.id !== id));
    try {
      await deleteDoc(doc(db, 'pohon_gis', id));
    } catch (err) {
      console.error('Error deleting Pohon GIS from Firestore:', err);
      handleFirestoreError(err, OperationType.DELETE, `pohon_gis/${id}`);
    }
    logActivity('Menghapus titik peta pohon GIS', 'Peta Pohon GIS');
  };

  // Handlers for Peta Konstruksi GIS
  const handleAddKonstruksiGis = async (rawItem: KonstruksiGisItem) => {
    const userUnit = user?.unit || DEFAULT_UNIT;
    const userKodeUnit = user?.kodeUnit || getKodeUnitByUnitName(userUnit);
    const item: KonstruksiGisItem = {
      ...rawItem,
      unit: rawItem.unit || userUnit,
      kodeUnit: rawItem.kodeUnit || userKodeUnit
    };

    setKonstruksiGisList((prev) => [item, ...prev.filter((k) => k.id !== item.id)]);
    try {
      await setDoc(doc(db, 'konstruksi_gis', item.id), sanitizeForFirestore(item));
    } catch (err) {
      console.error('Error saving Konstruksi GIS to Firestore:', err);
    }
    logActivity(`Tambah proyek konstruksi GIS: ${item.namaProyek} (${item.penyulang})`, 'Peta Konstruksi GIS');
  };

  const handleBatchAddKonstruksiGis = async (items: KonstruksiGisItem[]) => {
    const userUnit = user?.unit || DEFAULT_UNIT;
    const userKodeUnit = user?.kodeUnit || getKodeUnitByUnitName(userUnit);
    const taggedItems = items.map((i) => ({
      ...i,
      unit: i.unit || userUnit,
      kodeUnit: i.kodeUnit || userKodeUnit
    }));

    const itemIds = new Set(taggedItems.map((k) => k.id));
    setKonstruksiGisList((prev) => [...taggedItems, ...prev.filter((k) => !itemIds.has(k.id))]);
    try {
      for (const item of taggedItems) {
        await setDoc(doc(db, 'konstruksi_gis', item.id), sanitizeForFirestore(item));
      }
    } catch (err) {
      console.error('Error saving batch Konstruksi GIS to Firestore:', err);
    }
    logActivity(`Import ${items.length} proyek konstruksi GIS dari file`, 'Peta Konstruksi GIS');
  };

  const handleUpdateKonstruksiGis = async (item: KonstruksiGisItem) => {
    setKonstruksiGisList((prev) => prev.map((k) => (k.id === item.id ? item : k)));
    try {
      await setDoc(doc(db, 'konstruksi_gis', item.id), sanitizeForFirestore(item));
    } catch (err) {
      console.error('Error updating Konstruksi GIS in Firestore:', err);
    }
    logActivity(`Update progres proyek konstruksi GIS: ${item.namaProyek} (${item.progresPersen}%)`, 'Peta Konstruksi GIS');
  };

  const handleDeleteKonstruksiGis = async (id: string) => {
    if (!id) return;
    registerDeletedId(id);
    setKonstruksiGisList((prev) => prev.filter((k) => k.id !== id));
    try {
      await deleteDoc(doc(db, 'konstruksi_gis', id));
    } catch (err) {
      console.error('Error deleting Konstruksi GIS from Firestore:', err);
      handleFirestoreError(err, OperationType.DELETE, `konstruksi_gis/${id}`);
    }
    logActivity('Menghapus titik proyek konstruksi GIS', 'Peta Konstruksi GIS');
  };

  // Handlers for Survey PB/PD
  const handleAddSurveyPbPd = async (rawItem: SurveyPbPdItem) => {
    const userUnit = user?.unit || DEFAULT_UNIT;
    const userKodeUnit = user?.kodeUnit || getKodeUnitByUnitName(userUnit);
    const item: SurveyPbPdItem = {
      ...rawItem,
      unit: rawItem.unit || userUnit,
      kodeUnit: rawItem.kodeUnit || userKodeUnit
    };

    setSurveyList((prev) => [item, ...prev.filter((s) => s.id !== item.id)]);
    try {
      await setDoc(doc(db, 'survey_pb_pd', item.id), sanitizeForFirestore(item));
      logActivity(`Input survey baru untuk pelanggan ${item.namaPelanggan} (${item.jenisTransaksi}) di ${item.lokasi}`, 'Survey PB/PD');
    } catch (err) {
      console.error('Error saving survey PB/PD to Firestore:', err);
      handleFirestoreError(err, OperationType.WRITE, `survey_pb_pd/${item.id}`);
    }
  };

  const handleUpdateSurveyPbPd = async (item: SurveyPbPdItem) => {
    setSurveyList((prev) => prev.map((s) => (s.id === item.id ? item : s)));
    try {
      await setDoc(doc(db, 'survey_pb_pd', item.id), sanitizeForFirestore(item));
      logActivity(`Update data survey pelanggan ${item.namaPelanggan}`, 'Survey PB/PD');
    } catch (err) {
      console.error('Error updating survey PB/PD in Firestore:', err);
      handleFirestoreError(err, OperationType.WRITE, `survey_pb_pd/${item.id}`);
    }
  };

  const handleDeleteSurveyPbPd = async (id: string) => {
    if (!id) return;
    registerDeletedId(id);
    setSurveyList((prev) => prev.filter((s) => s.id !== id));
    try {
      await deleteDoc(doc(db, 'survey_pb_pd', id));
      logActivity(`Hapus data survey ID ${id}`, 'Survey PB/PD');
    } catch (err) {
      console.error('Error deleting survey PB/PD from Firestore:', err);
      handleFirestoreError(err, OperationType.DELETE, `survey_pb_pd/${id}`);
    }
  };

  // Master Data Unit PLN Handlers (Owner Only)
  const handleAddMasterUnit = async (newUnit: MasterUnitPLN) => {
    setMasterUnitList((prev) => [newUnit, ...prev.filter((u) => u.id !== newUnit.id)]);
    try {
      await setDoc(doc(db, 'master_unit_pln', newUnit.id), sanitizeForFirestore(newUnit));
      logActivity(`Menambah Master Unit PLN: ${newUnit.ulp} (${newUnit.kodeUlp})`, 'Master Unit');
    } catch (err) {
      console.error('Error adding Master Unit PLN to Firestore:', err);
      handleFirestoreError(err, OperationType.WRITE, `master_unit_pln/${newUnit.id}`);
    }
  };

  const handleUpdateMasterUnit = async (updatedUnit: MasterUnitPLN) => {
    setMasterUnitList((prev) => prev.map((u) => (u.id === updatedUnit.id ? updatedUnit : u)));
    try {
      await setDoc(doc(db, 'master_unit_pln', updatedUnit.id), sanitizeForFirestore(updatedUnit));
      logActivity(`Memperbarui Master Unit PLN: ${updatedUnit.ulp}`, 'Master Unit');
    } catch (err) {
      console.error('Error updating Master Unit PLN in Firestore:', err);
      handleFirestoreError(err, OperationType.WRITE, `master_unit_pln/${updatedUnit.id}`);
    }
  };

  const handleDeleteMasterUnit = async (id: string) => {
    if (!id) return;
    registerDeletedId(id);
    setMasterUnitList((prev) => prev.filter((u) => u.id !== id));
    try {
      await deleteDoc(doc(db, 'master_unit_pln', id));
      logActivity(`Menghapus Master Unit PLN ID ${id}`, 'Master Unit');
    } catch (err) {
      console.error('Error deleting Master Unit PLN from Firestore:', err);
      handleFirestoreError(err, OperationType.DELETE, `master_unit_pln/${id}`);
    }
  };

  // Help Desk Message Handlers
  const handleSendHelpDeskMessage = async (msgData: Omit<HelpDeskMessage, 'id' | 'tanggal' | 'status'>) => {
    const id = `hd_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const nowIso = new Date().toISOString();
    const formattedDate = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const newMsg: HelpDeskMessage = {
      id,
      ...msgData,
      tanggal: formattedDate,
      status: 'BARU',
      isReadByOwner: false,
      createdAt: nowIso,
      updatedAt: nowIso
    };

    setHelpDeskMessages((prev) => [newMsg, ...prev]);
    try {
      await setDoc(doc(db, 'helpdesk_messages', id), sanitizeForFirestore(newMsg));
      logActivity(`Mengirim pesan Help Desk: ${newMsg.subjek} (${newMsg.unit})`, 'Help Desk');
    } catch (err) {
      console.error('Error sending Help Desk message to Firestore:', err);
      handleFirestoreError(err, OperationType.WRITE, `helpdesk_messages/${id}`);
    }
  };

  const handleUpdateHelpDeskStatus = async (id: string, newStatus: HelpDeskMessage['status'], ownerReply?: string) => {
    const nowIso = new Date().toISOString();
    const formattedDate = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    setHelpDeskMessages((prev) =>
      prev.map((msg) =>
        msg.id === id
          ? {
              ...msg,
              status: newStatus,
              ...(ownerReply !== undefined ? { ownerReply, ownerReplyDate: formattedDate } : {}),
              updatedAt: nowIso
            }
          : msg
      )
    );

    const existingMsg = helpDeskMessages.find((m) => m.id === id);
    if (existingMsg) {
      const updatedMsg: HelpDeskMessage = {
        ...existingMsg,
        status: newStatus,
        ...(ownerReply !== undefined ? { ownerReply, ownerReplyDate: formattedDate } : {}),
        updatedAt: nowIso
      };
      try {
        await setDoc(doc(db, 'helpdesk_messages', id), sanitizeForFirestore(updatedMsg));
        logActivity(`Memperbarui status pesan Help Desk ID ${id} -> ${newStatus}`, 'Help Desk');
      } catch (err) {
        console.error('Error updating Help Desk message in Firestore:', err);
        handleFirestoreError(err, OperationType.WRITE, `helpdesk_messages/${id}`);
      }
    }
  };

  const handleDeleteHelpDeskMessage = async (id: string) => {
    if (!id) return;
    registerDeletedId(id);
    setHelpDeskMessages((prev) => prev.filter((m) => m.id !== id));
    try {
      await deleteDoc(doc(db, 'helpdesk_messages', id));
      logActivity(`Menghapus pesan Help Desk ID ${id}`, 'Help Desk');
    } catch (err) {
      console.error('Error deleting Help Desk message from Firestore:', err);
      handleFirestoreError(err, OperationType.DELETE, `helpdesk_messages/${id}`);
    }
  };

  // If not logged in, display Login Screen
  if (!user) {
    return <LoginScreen onLogin={handleLogin} usersList={usersList} />;
  }

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      <SearchProvider>
        {/* Top Header Navigation */}
        <TopHeader
          user={user}
          onLogout={handleLogout}
          activeView={activeView}
          onSelectView={setActiveView}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
          onlineCount={onlineUsersList.filter((p) => calculatePresenceStatus(p).status === 'online').length}
          ownerSelectedUnitFilter={ownerSelectedUnitFilter}
          onSelectUnitFilter={setOwnerSelectedUnitFilter}
        />

      {/* Broadcast Message Banner (Top System Notification) */}
      {activeBroadcast && !dismissedBroadcastIds.includes(activeBroadcast.id) && (
        (activeBroadcast.targetUsername === 'all' || 
         (user && activeBroadcast.targetUsername?.toLowerCase() === user.username?.toLowerCase())) && (
          <div className={`px-4 py-3 flex items-center justify-between text-xs font-bold shadow-md z-40 border-b ${
            activeBroadcast.type === 'urgent'
              ? 'bg-rose-600 text-white border-rose-700'
              : activeBroadcast.type === 'warning'
              ? 'bg-amber-500 text-slate-950 border-amber-600'
              : 'bg-blue-600 text-white border-blue-700'
          }`}>
            <div className="flex items-center gap-2.5 max-w-4xl">
              <span className="p-1 rounded-md bg-white/20 shrink-0">
                {activeBroadcast.type === 'urgent' ? (
                  <AlertTriangle className="w-4 h-4" />
                ) : activeBroadcast.type === 'warning' ? (
                  <AlertTriangle className="w-4 h-4" />
                ) : (
                  <Bell className="w-4 h-4" />
                )}
              </span>
              <span>
                <strong className="uppercase tracking-wider mr-1">
                  [{activeBroadcast.type === 'urgent' ? 'PENGUMUMAN DARURAT' : activeBroadcast.type === 'warning' ? 'PERINGATAN K3' : 'PENGUMUMAN OWNER'}]:
                </strong>{' '}
                {activeBroadcast.message}
              </span>
            </div>
            <button
              onClick={() => setDismissedBroadcastIds((prev) => [...prev, activeBroadcast.id])}
              className="p-1 rounded-lg hover:bg-black/15 transition-colors cursor-pointer shrink-0 ml-3"
              title="Tutup Notifikasi"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )
      )}

      {/* Force Logout Notification Modal */}
      {isForceLogoutModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full text-center space-y-4 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <Lock className="w-7 h-7" />
            </div>
            <h3 className="text-base font-black text-slate-900">
              Sesi Anda Telah Diputus
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Sesi login Anda telah dihentikan oleh <strong>Owner Sistem</strong>. Silakan hubungi koordinator atau login kembali jika diperlukan.
            </p>
            <button
              onClick={() => setIsForceLogoutModalOpen(false)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl cursor-pointer transition-all shadow-md"
            >
              Mengerti & Kembali ke Login
            </button>
          </div>
        </div>
      )}

      {/* Main Workspace Body */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar Navigation */}
        <Sidebar
          activeView={activeView}
          onSelectView={setActiveView}
          isOpen={sidebarOpen}
          currentUser={user}
          onLogout={handleLogout}
          ownerSelectedUnitFilter={ownerSelectedUnitFilter}
          onSelectUnitFilter={setOwnerSelectedUnitFilter}
        />

        {/* Dynamic View Canvas */}
        <main className="flex-1 overflow-y-auto bg-slate-50 relative">
          {(activeView === 'dashboard' || !activeView) && (
            <DashboardView
              currentUser={user}
              penyulangList={filteredPenyulangList}
              sectionList={filteredSectionList}
              gangguanList={filteredGangguanList}
              rowList={filteredRowList}
              inspeksiList={filteredInspeksiList}
              saidiList={filteredSaidiList}
              activities={activities}
              stokList={filteredStokList}
              spkList={filteredSpkList}
              surveyList={filteredSurveyList}
              pengukuranList={filteredPengukuranList}
              ownerSelectedUnitFilter={ownerSelectedUnitFilter}
              onSelectUnitFilter={setOwnerSelectedUnitFilter}
              masterUnitList={masterUnitList}
              onSelectView={setActiveView}
              allPenyulangList={syncedPenyulangList}
            />
          )}

          {activeView === 'dcc' && (
            <DccView currentUser={user} />
          )}

          {(activeView === 'peta_penyulang' || activeView === 'peta') && (
            <motion.div
              key="peta_penyulang"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <PetaPenyulangView
                layers={filteredMapLayers}
                onToggleLayer={handleToggleMapLayer}
                onDeleteLayer={handleDeleteMapLayer}
                onAddLayer={handleAddMapLayer}
                onUpdateLayer={handleUpdateMapLayer}
                masterUnits={masterUnitList}
                masterPenyulangs={penyulangList}
              />
            </motion.div>
          )}

          {activeView === 'input_peta_penyulang' && (
            <motion.div
              key="input_peta_penyulang"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <InputPetaPenyulangView
                layers={filteredMapLayers}
                onAddLayer={handleAddMapLayer}
                onDeleteLayer={handleDeleteMapLayer}
                masterUnits={masterUnitList}
                masterPenyulangs={penyulangList}
                onSelectView={setActiveView}
              />
            </motion.div>
          )}

          {activeView === 'peta_gardu' && (
            <motion.div
              key="peta_gardu"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <PetaGarduView
                masterGarduList={filteredMasterGarduList}
                pengukuranList={filteredPengukuranList}
                onUpdateGardu={handleAddMasterGardu}
              />
            </motion.div>
          )}

          {activeView === 'peta_pohon' && (
            <motion.div
              key="peta_pohon"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <PetaPohonView
                currentUser={user}
                pohonList={filteredPohonGisList}
                penyulangList={filteredPenyulangList}
                layers={mapLayers}
                onAddPohon={handleAddPohonGis}
                onImportBatch={handleBatchAddPohonGis}
                onUpdatePohon={handleUpdatePohonGis}
                onDeletePohon={handleDeletePohonGis}
              />
            </motion.div>
          )}

          {activeView === 'peta_konstruksi' && (
            <motion.div
              key="peta_konstruksi"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <PetaKonstruksiView
                currentUser={user}
                konstruksiList={filteredKonstruksiGisList}
                penyulangList={filteredPenyulangList}
                onAddKonstruksi={handleAddKonstruksiGis}
                onImportBatch={handleBatchAddKonstruksiGis}
                onUpdateKonstruksi={handleUpdateKonstruksiGis}
                onDeleteKonstruksi={handleDeleteKonstruksiGis}
              />
            </motion.div>
          )}

          {activeView === 'sld_visio' && (
            <motion.div
              key="sld_visio"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <SldVisioView />
            </motion.div>
          )}

          {activeView === 'health_index' && (
            <motion.div
              key="health_index"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <HealthIndexView
                penyulangList={filteredPenyulangList}
                gangguanList={filteredGangguanList}
                sectionList={filteredSectionList}
                onAddGangguan={handleAddGangguan}
              />
            </motion.div>
          )}

          {(activeView === 'matriks_gangguan' || activeView === 'gangguan') && (
            <motion.div
              key="matriks_gangguan"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <GangguanTripView
                currentUser={user}
                gangguanList={filteredGangguanList}
                penyulangList={filteredPenyulangList}
                sectionList={filteredSectionList}
                onAddGangguan={handleAddGangguan}
                onDeleteGangguan={handleDeleteGangguan}
                isLoading={isDataLoading}
              />
            </motion.div>
          )}

          {activeView === 'monitoring_target_realisasi' && (
            <motion.div
              key="monitoring_target_realisasi"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <MonitoringTargetRealisasiView
                currentUser={user}
                rowList={filteredRowList}
                tier1List={filteredTier1List}
                tier2List={filteredTier2List}
              />
            </motion.div>
          )}

          {(activeView === 'row' ||
            activeView === 'inspeksi_tier1' ||
            activeView === 'inspeksi_tier2' ||
            activeView === 'pemeliharaan_20kv') && (
            <motion.div
              key="pemeliharaan"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <PemeliharaanView
                currentUser={user}
                currentSubView={activeView}
                rowList={filteredRowList}
                tier1List={filteredTier1List}
                tier2List={filteredTier2List}
                monitoringList={filteredMonitoringList}
                onSelectSubView={setActiveView}
                isLoading={isDataLoading}
              />
            </motion.div>
          )}

          {activeView === 'master_data' && (
            <motion.div
              key="master_data"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <MasterDataView
                penyulangList={filteredPenyulangList}
                sectionList={filteredSectionList}
                activities={activities}
                onAddPenyulang={handleAddPenyulang}
                onDeletePenyulang={handleDeletePenyulang}
                onAddSection={handleAddSection}
                onDeleteSection={handleDeleteSection}
                masterUnitList={masterUnitList}
                mapLayers={filteredMapLayers}
                onAddMapLayer={handleAddMapLayer}
                onDeleteMapLayer={handleDeleteMapLayer}
                onSelectView={setActiveView}
                isLoading={isDataLoading}
              />
            </motion.div>
          )}

          {activeView === 'master_unit' && (
            <motion.div
              key="master_unit"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <MasterUnitView
                currentUser={user}
                unitList={masterUnitList}
                onAddUnit={handleAddMasterUnit}
                onUpdateUnit={handleUpdateMasterUnit}
                onDeleteUnit={handleDeleteMasterUnit}
              />
            </motion.div>
          )}

          {activeView === 'helpdesk' && (
            <motion.div
              key="helpdesk"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <HelpDeskView
                currentUser={user}
                messages={helpDeskMessages}
                onSendMessage={handleSendHelpDeskMessage}
                onUpdateStatus={handleUpdateHelpDeskStatus}
                onDeleteMessage={handleDeleteHelpDeskMessage}
              />
            </motion.div>
          )}

          {activeView === 'saidi_saifi' && (
            <motion.div
              key="saidi_saifi"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <SaidiSaifiView
                currentUser={user}
                saidiList={filteredSaidiList}
                penyulangList={filteredPenyulangList}
                onAddSaidi={handleAddSaidi}
                onDeleteSaidi={handleDeleteSaidi}
                ownerSelectedUnitFilter={ownerSelectedUnitFilter}
                onSelectUnitFilter={setOwnerSelectedUnitFilter}
              />
            </motion.div>
          )}

          {activeView === 'estimasi_saidi_saifi' && (
            <motion.div
              key="estimasi_saidi_saifi"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <EstimasiSaidiSaifiView
                currentUser={user}
                gangguanList={filteredGangguanList}
                penyulangList={filteredPenyulangList}
                sectionList={filteredSectionList}
                onSelectView={setActiveView}
              />
            </motion.div>
          )}

          {activeView === 'material' && (
            <motion.div
              key="material"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <MaterialView
                currentUser={user}
                stokList={filteredStokList}
                pemakaianList={filteredPemakaianList}
                onAddStok={handleAddStok}
                onUpdateStok={handleUpdateStok}
                onDeleteStok={handleDeleteStok}
                onAddPemakaian={handleAddPemakaian}
                onUpdatePemakaian={handleUpdatePemakaian}
                onDeletePemakaian={handleDeletePemakaian}
                isLoading={isDataLoading}
              />
            </motion.div>
          )}

          {activeView === 'alker_apd' && (
            <motion.div
              key="alker_apd"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <AlkerApdView
                currentUser={user}
                alkerApdList={filteredAlkerApdList}
                onAddAlkerApd={handleAddAlkerApd}
                onUpdateAlkerApd={handleUpdateAlkerApd}
                onDeleteAlkerApd={handleDeleteAlkerApd}
                isLoading={isDataLoading}
              />
            </motion.div>
          )}

          {activeView === 'kendaraan_operasional' && (
            <KendaraanOperasionalView
              currentUser={user}
              kendaraanList={filteredKendaraanList}
              onAddKendaraan={handleAddKendaraan}
              onUpdateKendaraan={handleUpdateKendaraan}
              onDeleteKendaraan={handleDeleteKendaraan}
              isLoading={isDataLoading}
            />
          )}

          {activeView === 'aset_jaringan' && (
            <AsetJaringanView
              asetList={filteredAsetJaringanList}
              penyulangList={filteredPenyulangList}
              onAdd={handleAddAset}
              onUpdate={handleUpdateAset}
              onDelete={handleDeleteAset}
              isLoading={isDataLoading}
            />
          )}

          {activeView === 'jadwal_piket' && (
            <JadwalPiketView
              jadwalList={filteredJadwalPiketList}
              onAdd={handleAddJadwal}
              onUpdate={handleUpdateJadwal}
              onDelete={handleDeleteJadwal}
              isLoading={isDataLoading}
            />
          )}

          {activeView === 'monitoring_lembur' && (
            <MonitoringLemburView
              currentUser={user}
              lemburList={filteredLemburList}
              onAddLembur={handleAddLembur}
              onUpdateLembur={handleUpdateLembur}
              onDeleteLembur={handleDeleteLembur}
              isLoading={isDataLoading}
            />
          )}

          {activeView === 'perintah_kerja' && (
            <PerintahKerjaView
              currentUser={user}
              spkList={filteredSpkList}
              penyulangList={filteredPenyulangList}
              sectionList={filteredSectionList}
              onAddSpk={handleAddSpk}
              onUpdateSpk={handleUpdateSpk}
              onDeleteSpk={handleDeleteSpk}
              isLoading={isDataLoading}
            />
          )}

          {(activeView === 'format_surat' || activeView === 'ba_pemeriksaan_iml') && (
            <FormatSuratView
              currentUser={user}
              initialTypeFilter={activeView === 'ba_pemeriksaan_iml' ? 'ba_pemeriksaan_iml' : undefined}
            />
          )}

          {activeView === 'pengukuran_gardu' && (
            <PengukuranGarduView
              currentUser={user}
              pengukuranList={filteredPengukuranList}
              masterGarduList={filteredMasterGarduList}
              penyulangList={filteredPenyulangList}
              onAddPengukuran={handleAddPengukuranGardu}
              onDeletePengukuran={handleDeletePengukuranGardu}
              onAddGardu={handleAddMasterGardu}
              onDeleteGardu={handleDeleteMasterGardu}
              onDeleteAllGardu={handleDeleteAllMasterGardu}
              onDeleteAllPengukuran={handleDeleteAllPengukuran}
              onImportGardu={handleImportMasterGardu}
              onImportPengukuran={handleImportPengukuranGardu}
              isLoading={isDataLoading}
            />
          )}

          {activeView === 'survey_pb_pd' && (
            <SurveyPbPdView
              currentUser={user}
              surveyList={filteredSurveyList}
              penyulangList={filteredPenyulangList}
              masterGarduList={filteredMasterGarduList}
              onAddSurvey={handleAddSurveyPbPd}
              onUpdateSurvey={handleUpdateSurveyPbPd}
              onDeleteSurvey={handleDeleteSurveyPbPd}
              isLoading={isDataLoading}
            />
          )}

          {activeView === 'inspeksi_tier1_jtm' && (
            <InspeksiTier1JTMView
              currentUser={user}
              tier1JtmList={filteredTier1JtmList}
              penyulangList={filteredPenyulangList}
              sectionList={filteredSectionList}
              isLoading={isDataLoading}
            />
          )}

          {activeView === 'inspeksi_tier1_gtt' && (
            <InspeksiTier1GTTView
              currentUser={user}
              tier1GttList={filteredTier1GttList}
              penyulangList={filteredPenyulangList}
              sectionList={filteredSectionList}
              masterGarduList={filteredMasterGarduList}
              isLoading={isDataLoading}
            />
          )}

          {activeView === 'inspeksi_tier1_switching' && (
            <InspeksiTier1SwitchingView
              currentUser={user}
              tier1SwitchingList={filteredTier1SwitchingList}
              penyulangList={filteredPenyulangList}
              sectionList={filteredSectionList}
            />
          )}

          {activeView === 'inspeksi_tier2_thermovision' && (
            <InspeksiTier2ThermovisionView
              currentUser={user}
              thermovisionList={filteredThermovisionList}
              penyulangList={filteredPenyulangList}
              sectionList={filteredSectionList}
            />
          )}

          {activeView === 'inspeksi_tier2_ultrasound' && (
            <InspeksiTier2UltrasoundView
              currentUser={user}
              ultrasoundList={filteredUltrasoundList}
              penyulangList={filteredPenyulangList}
              sectionList={filteredSectionList}
            />
          )}

          {activeView === 'share_laporan' && (
            <ShareLaporanView
              user={user}
              gangguanList={filteredGangguanList}
              penyulangList={filteredPenyulangList}
              saidiData={filteredSaidiList}
              jadwalPiket={filteredJadwalPiketList}
              perintahKerja={filteredSpkList}
            />
          )}

          {activeView === 'live_chat' && (
            <LiveChatView
              currentUser={user}
              chatMessages={chatMessagesList}
              onlineUsersList={onlineUsersList}
              autoReplyRules={autoReplyRulesList}
              onSelectView={setActiveView}
              onSendMessage={handleAddChatMessage}
              onDeleteMessage={handleDeleteChatMessage}
              onClearChat={handleClearChatMessages}
              onSaveAutoReplyRule={handleSaveAutoReplyRule}
              onDeleteAutoReplyRule={handleDeleteAutoReplyRule}
            />
          )}

          {activeView === 'kalkulator_listrik' && (
            <KalkulatorListrikView
              currentUser={user}
            />
          )}

          {activeView === 'monitoring_yantek' && (
            <MonitoringYantekView
              currentUser={user}
              kendaraanList={kendaraanList}
              onUpdateKendaraan={handleUpdateKendaraan}
              onSelectView={setActiveView}
            />
          )}

          {activeView === 'peremajaan_meter' && (
            <PeremajaanMeterView
              currentUser={user}
              penyulangList={filteredPenyulangList}
            />
          )}

          {activeView === 'meter_sl' && (
            <MeterSLView
              currentUser={user}
              penyulangList={filteredPenyulangList}
            />
          )}

          {activeView === 'monitoring_susut' && (
            <MonitoringSusutView
              currentUser={user}
              penyulangList={filteredPenyulangList}
            />
          )}

          {activeView === 'cash_flow_bop' && (
            <CashFlowBopView
              currentUser={user}
              cashFlowList={cashFlowList}
              onAddTransaction={handleAddCashFlow}
              onUpdateTransaction={handleUpdateCashFlow}
              onDeleteTransaction={handleDeleteCashFlow}
            />
          )}

          {activeView === 'master_pelanggan' && (
            <MasterPelangganView
              currentUser={user}
              penyulangList={penyulangList}
              sectionList={sectionList}
              onUpdatePenyulang={handleUpdatePenyulang}
              onUpdateSection={handleUpdateSection}
            />
          )}

          {['manbill', 'pembagian_invoice', 'realisasi_tusbung', 'foto_meter'].includes(activeView) && (
            <ManbillView
              currentUser={user}
              activeTab={activeView === 'manbill' ? 'pembagian_invoice' : activeView as any}
            />
          )}

          {['k3l', 'jadwal_security', 'patroli_kelistrikan'].includes(activeView) && (
            <K3LView
              currentUser={user}
              activeTab={activeView === 'k3l' ? 'jadwal_security' : activeView as any}
              alkerApdList={filteredAlkerApdList}
              onAddAlkerApd={handleAddAlkerApd}
              onUpdateAlkerApd={handleUpdateAlkerApd}
              onDeleteAlkerApd={handleDeleteAlkerApd}
              isLoading={isDataLoading}
            />
          )}

          {activeView === 'monitoring_online' && (
            <MonitoringOnlineView
              currentUser={user}
              onlineUsersList={onlineUsersList}
              registeredUsersList={usersList}
              onSelectView={setActiveView}
            />
          )}

          {activeView === 'kelola_user' && (
            (user.role === 'Koordinator' || isOwnerUser(user)) ? (
              <UserManagementView
                currentUser={user}
                usersList={usersList}
                masterUnitList={masterUnitList}
                onAddUser={handleAddUser}
                onUpdateUser={handleUpdateUser}
                onDeleteUser={handleDeleteUser}
                onSwitchUserRole={(switchedUser) => {
                  setUser(switchedUser);
                  logActivity(`Switch mode/role sebagai: ${switchedUser.name} (${switchedUser.role})`, 'Simulasi RBAC');
                }}
              />
            ) : (
              <div className="p-12 text-center max-w-xl mx-auto bg-white border border-slate-200 rounded-2xl shadow-sm mt-12 font-sans">
                <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Akses Ditolak</h3>
                <p className="text-sm text-slate-500 mb-6">
                  Menu Pengaturan Akun hanya dapat diakses oleh pengguna dengan role <strong>Koordinator</strong> atau <strong>Owner</strong>.
                </p>
                <button
                  onClick={() => setActiveView('dashboard')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-blue-500/20 cursor-pointer"
                >
                  Kembali ke Dashboard
                </button>
              </div>
            )
          )}
        </main>
      </div>
    </SearchProvider>
    </div>
  );
}
