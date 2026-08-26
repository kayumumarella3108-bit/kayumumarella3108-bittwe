export type ViewType = 
  | 'dashboard'
  | 'monitoring_online'
  | 'live_chat'
  | 'spklu'
  | 'peta'
  | 'peta_penyulang'
  | 'peta_pohon'
  | 'peta_konstruksi'
  | 'health_index'
  | 'matriks_gangguan'
  | 'row'
  | 'inspeksi_tier1'
  | 'inspeksi_tier1_jtm'
  | 'inspeksi_tier1_gtt'
  | 'inspeksi_tier1_switching'
  | 'inspeksi_tier2'
  | 'inspeksi_tier2_thermovision'
  | 'inspeksi_tier2_ultrasound'
  | 'pemeliharaan_20kv'
  | 'monitoring_target_realisasi'
  | 'perintah_kerja'
  | 'format_surat'
  | 'ba_pemeriksaan_iml'
  | 'master_data'
  | 'master_unit'
  | 'pengukuran_gardu'
  | 'saidi_saifi'
  | 'estimasi_saidi_saifi'
  | 'material'
  | 'alker_apd'
  | 'kendaraan_operasional'
  | 'kelola_user'
  | 'sld_visio'
  | 'aset_jaringan'
  | 'jadwal_piket'
  | 'gangguan'
  | 'share_laporan'
  | 'survey_pb_pd'
  | 'monitoring_yantek'
  | 'helpdesk'
  | 'input_peta_penyulang'
  | 'peremajaan_meter'
  | 'meter_sl'
  | 'monitoring_susut'
  | 'k3l';

export interface HelpDeskMessage {
  id: string;
  senderId?: string;
  senderName: string;
  senderUsername?: string;
  senderRole?: string;
  kodeUnit: string;
  unit: string;
  kategori: string;
  subjek: string;
  pesan: string;
  tanggal: string;
  status: 'BARU' | 'DIPROSES' | 'SELESAI' | 'DITOLAK';
  ownerReply?: string;
  ownerReplyDate?: string;
  isReadByOwner?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface MasterUnitPLN {
  id: string;
  uiw: string;       // Unit Induk Wilayah (cth: UIW MMU - Maluku & Maluku Utara)
  up3: string;       // Unit Pelaksana Pelayanan Pelanggan (cth: UP3 Ambon)
  ulp: string;       // Unit Layanan Pelanggan (cth: ULP Baguala, ULP Namlea)
  kodeUlp: string;   // Kode ULP (cth: 54110, 54120, 54130)
  alamat?: string;
  telepon?: string;
  status?: 'AKTIF' | 'NONAKTIF';
  createdAt?: string;
  updatedAt?: string;
}

export type TipeNodeTopologi = 'GI' | 'GH' | 'PERCABANGAN' | 'LBS' | 'REC' | 'FCO' | 'GTT' | 'PMCB' | 'DS' | 'SECTION' | 'INCOMING' | 'OUTGOING' | 'COUPLING';

export interface NodeTopologi {
  id: string;
  penyulangId: string;
  namaPenyulang: string;
  sectionId?: string;
  namaSection?: string;
  kodeNode: string;
  namaNode: string;
  tipe: TipeNodeTopologi;
  parentId?: string | null; // Node induk tempat percabangan / sambungan
  statusOperasi: 'CLOSED' | 'OPEN' | 'TRIP' | 'PEMELIHARAAN';
  lokasiTiangOrAlamat?: string;
  keterangan?: string;
  jumlahPelangganTerdampak?: number;
  kapasitasOrAmpere?: string; // e.g., '100A', '630A', '25A Fuse Link', '160 kVA'
  merekPeralatan?: string;
  isScadaRemote?: boolean;
}

export type MasterTab = 'penyulang' | 'section' | 'gardu' | 'gardu_hubung' | 'lbs' | 'pmcb' | 'recloser' | 'fco' | 'petugas' | 'log_aktivitas' | 'icon_gardu_tiang' | 'peta_penyulang_input';

export interface KomponenPenyulangGH {
  id: string;
  penamaan: string; // e.g. 'Incoming', 'Outgoing', 'Coupling', etc.
  penyulang: string; // Nama penyulang terkait
}

export interface MasterGarduHubung {
  id: string;
  nama: string;
  lokasi: string;
  latitude?: number;
  longitude?: number;
  taggingLokasi?: string;
  komponenPenyulang: KomponenPenyulangGH[];
  status: 'Operasi' | 'Standby' | 'Pemeliharaan';
  tahunOperasi?: number;
  keterangan?: string;
  createdAt?: string;
  unit?: string;
  kodeUnit?: string;
}

export interface ItemPeralatanDetail {
  id: string;
  namaPeralatan: string;
  penyulang: string;
  tipe?: string;
  keterangan?: string;
}

export interface MasterDistributionEquipment {
  id: string;
  jenis: 'LBS' | 'PMCB' | 'RECLOSER' | 'FCO';
  lokasi: string;
  latitude: number;
  longitude: number;
  peralatanList: ItemPeralatanDetail[];
  createdAt?: string;
  unit?: string;
  kodeUnit?: string;
}

export interface MasterLbs {
  id: string;
  nama: string;
  lokasi: string;
  penyulang: string;
  latitude?: number;
  longitude?: number;
  status?: 'Operasi' | 'Standby' | 'Pemeliharaan';
  jenis?: 'Manual' | 'Motorized' | 'Three-Way' | string;
  peralatanList?: ItemPeralatanDetail[];
  unit?: string;
  kodeUnit?: string;
}

export interface MasterPmcb {
  id: string;
  nama: string;
  lokasi: string;
  penyulang: string;
  latitude?: number;
  longitude?: number;
  status?: 'Operasi' | 'Standby' | 'Pemeliharaan';
  kapasitas?: string;
  peralatanList?: ItemPeralatanDetail[];
  unit?: string;
  kodeUnit?: string;
}

export interface MasterRecloser {
  id: string;
  nama: string;
  lokasi: string;
  penyulang: string;
  latitude?: number;
  longitude?: number;
  status?: 'Operasi' | 'Standby' | 'Pemeliharaan';
  merek?: string;
  peralatanList?: ItemPeralatanDetail[];
  unit?: string;
  kodeUnit?: string;
}

export interface MasterFco {
  id: string;
  nama: string;
  lokasi: string;
  penyulang: string;
  latitude?: number;
  longitude?: number;
  status?: 'Operasi' | 'Standby' | 'Pemeliharaan';
  kapasitas?: string;
  peralatanList?: ItemPeralatanDetail[];
  unit?: string;
  kodeUnit?: string;
}

export interface Penyulang {
  id: string;
  namaGi: string;
  penyulangUtama?: string;
  namaPenyulang: string;
  status: 'Utama' | 'Percabangan';
  kodeId: string;
  panjangJaringanKms: number;
  frekuensiGangguan: number;
  healthIndexStatus: 'Sempurna' | 'Sehat' | 'Sakit' | 'Kronis';
  sectionTerlama?: string;
  gangguanTerakhir?: string;
  jumlahPelanggan?: number;
  unit?: string;
  kodeUnit?: string;
  tipeSumber?: 'GI' | 'PLTD';
  garduHubung?: string;
  jumlahTiang?: number;
  jumlahLbs?: number;
  jumlahPmcb?: number;
  jumlahRecloser?: number;
  jumlahFco?: number;
  jumlahGardu?: number;
}

export interface SectionJaringan {
  id: string;
  namaSection: string;
  penyulangId: string;
  namaPenyulang: string;
  jumlahPelanggan: number;
  sistemOperasi: 'Radial' | 'Loop';
  penyulangDiSupply: string;
  unit?: string;
  kodeUnit?: string;
}

export interface SectionRestoration {
  id: string;
  sectionId?: string;
  namaSection: string;
  jumlahPelanggan: number;
  jamKeluar: string;
  jamMasuk: string;
  durasiMenit: number;
  estimasiSaidiMenit: number;
  estimasiSaifi?: number;
  keterangan?: string;
  unit?: string;
  kodeUnit?: string;
}

export interface GangguanLog {
  id: string;
  tanggal: string;
  penyulangId: string;
  namaPenyulang: string;
  section: string;
  jamKeluar: string;
  jamMasuk: string;
  durasi: string;
  relayBekerja: string;
  arusR: number;
  arusS: number;
  arusT: number;
  arusIN: number;
  penyebab: string;
  kodeGangguan: string;
  detailLokasi: string;
  catatan: string;
  fotoPenyebab?: string; // Base64 or Data URL photo documentation
  unit?: string;
  kodeUnit?: string;
  // SAIDI SAIFI Estimation per section event
  jumlahPelangganPadam?: number;
  totalPelangganUlp?: number;
  estimasiSaidiMenit?: number;
  estimasiSaidiJam?: number;
  estimasiSaifi?: number;
  sectionRestorations?: SectionRestoration[];
}

export interface ROWItem {
  id: string;
  tanggal?: string; // Tanggal Eksekusi
  tanggalInspeksi?: string;
  tanggalEksekusi?: string;
  penyulang?: string;
  section?: string;
  jumlahTemuanInspeksi?: number | string;
  realisasiPangkas?: number | string;
  perluIzin?: number | string;
  perluPadam?: number | string;
  pohonBesar?: number | string;
  luarTemuan?: string;
  tiangId?: string;
  namaPenyulang?: string;
  lokasi?: string;
  lat?: number;
  lng?: number;
  jumlahPohon?: number;
  jenisPohon?: string;
  status?: 'Perlu Pangkas' | 'Selesai' | 'Jadwal Ulang';
  prioritas?: 'Tinggi' | 'Sedang' | 'Rendah';
  tanggalTemuan?: string;
  temuanBelumDieksekusi?: number;
  isFromInspection?: boolean;
  inspectionId?: string;
  jumlahPersonil?: number | string;
  belumEksekusi?: number | string;
  jumlahSisaTemuan?: number | string;
  unit?: string;
  kodeUnit?: string;
}

export interface InspeksiItem {
  id: string;
  tiangOrGarduId: string;
  tipe: 'Tier 1' | 'Tier 2' | 'Gardu' | 'Thermovision' | 'Ultrasound';
  namaPenyulang: string;
  lokasi: string;
  temuan: string;
  kondisi: 'Baik' | 'Ringan' | 'Berat' | 'Selesai' | 'Kurang' | 'Buruk' | 'Cukup';
  tanggalInspeksi: string;
  petugas: string;
  unit?: string;
  kodeUnit?: string;
}

export interface Tier1Item {
  id: string;
  tanggal: string;
  penyulang: string;
  section: string;
  temuanRow: string;
  konstruksi: string;
  jumlahTemuanPohon?: number | string;
  jumlahTemuanKonstruksi?: number | string;
  temuanLain?: string;
  unit?: string;
  kodeUnit?: string;
}

export interface Tier2Item {
  id: string;
  tanggal: string;
  penyulang: string;
  section: string;
  jenisTier2: 'Thermovision' | 'Ultrasound';
  temuanThermoUltrasound: string;
  unit?: string;
  kodeUnit?: string;
}

export interface MonitoringPemeliharaanItem {
  id: string;
  tanggal: string;
  penyulang: string;
  section: string;
  jenisPemeliharaan: string[];
  keterangan: string;
  unit?: string;
  kodeUnit?: string;
}

export interface SaidiSaifiData {
  id: string;
  bulan: string;
  tahun: number;
  ensKumulatifKwh: number;
  targetSaidi: number;
  realisasiSaidi: number;
  targetSaifi: number;
  realisasiSaifi: number;
  tarifListrik: number; // Rp 1444.7
  estimasiKerugianRp: number;
  catatan: string;
  unit?: string;
  kodeUnit?: string;
}

export interface User {
  id?: string;
  username: string;
  name: string;
  role: 'Owner' | 'Koordinator' | 'Admin Teknik' | 'Bagian Teknik' | 'Team Leader' | 'Manager ULP' | 'UP3' | 'UIW' | 'PLN Nusadaya' | string;
  unit?: string;
  kodeUnit?: string;
  status?: string;
  avatarUrl?: string;
  password?: string;
  nip?: string;
  phone?: string;
  isOwner?: boolean;
  permissions?: {
    canAddUsers: boolean;
    canEditData: boolean;
    canViewDataOnly: boolean;
  };
  allowedMenus?: string[];
}

export interface UserOnlinePresence {
  id: string;
  userId: string;
  username: string;
  name: string;
  role: string;
  unit?: string;
  avatarUrl?: string;
  loginTime: string;
  lastActive: string; // ISO string timestamp
  activeView: string;
  activeViewLabel: string;
  deviceInfo?: string;
  browserInfo?: string;
  ipAddress?: string;
  status: 'online' | 'idle' | 'offline';
  forceLoggedOut?: boolean;
  notes?: string;
}

export interface SystemBroadcastMessage {
  id: string;
  sender: string;
  senderRole: string;
  message: string;
  targetUsername?: string; // empty or 'all' for all users
  createdAt: string;
  type: 'info' | 'warning' | 'urgent';
  active: boolean;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderUsername: string;
  senderRole: string;
  senderAvatar?: string;
  recipient: 'all' | 'owner' | string; // 'all' for Ruang Koordinasi Umum, 'owner' for Konsultasi Owner & AI Bot
  message: string;
  timestamp: string; // ISO string
  isBotReply?: boolean;
  botName?: string; // 'PLN Baguala AI Bot'
  botType?: 'auto_reply_owner_offline' | 'ai_assistant' | 'system';
  isOwnerOnlineAtSend?: boolean;
  topic?: 'gangguan' | 'teknis' | 'row' | 'survey' | 'umum';
}

export interface ActivityLog {
  id: string;
  waktu: string;
  user: string;
  aktivitas: string;
  modul: string;
}

export interface MapLayerItem {
  id: string;
  nama: string;
  tiangCount: number;
  ruteLength: string;
  tanggalImport: string;
  kategori: 'Utama' | 'Percabangan' | 'ROW' | 'Inspeksi' | 'Maintenance' | string;
  ulp?: string;
  unit?: string;
  kodeUnit?: string;
  namaPenyulang?: string;
  iconType?: 'zap' | 'git-branch' | 'map-pin' | 'building' | 'gardu-dist' | 'lbs' | 'pmcb' | 'recloser' | 'trees' | 'wrench' | 'activity' | 'shield' | string;
  visible: boolean;
  color: string;
  coordinates: [number, number][];
  poleNames?: string[];
  customIcons?: Record<string, string>;
  customStatuses?: Record<string, string>;
}

export interface SldComponent {
  id: string;
  type: 'trafo' | 'pmt' | 'recloser' | 'lbs' | 'busbar' | 'feeder';
  name: string;
  status: 'OPEN' | 'CLOSED' | 'NORMAL';
  x: number;
  y: number;
  giName: string;
}

export interface MaterialStokItem {
  id: string;
  tanggalMasuk: string;
  namaMaterial: string;
  qty: number;
  satuan: string;
  keterangan?: string;
  noDokumen?: string;
  unit?: string;
  kodeUnit?: string;
}

export interface MaterialPemakaianItem {
  id: string;
  tanggal: string;
  namaMaterial: string;
  qty: number;
  satuan: string;
  lokasi: string;
  jenisPekerjaan: string;
  petugas?: string;
  unit?: string;
  kodeUnit?: string;
}

export interface AlkerApdItem {
  id: string;
  namaAlker: string;
  tipe: 'Alat Kerja' | 'APD' | 'Alat Ukur';
  jumlah: number;
  kondisi: 'Baik' | 'Perlu Perbaikan' | 'Rusak';
  tanggalInput: string;
  unit?: string;
  kodeUnit?: string;
  penanggungJawab?: string;
  catatan?: string;
}

export interface PetugasSpkDetail {
  id?: string;
  nama: string;
  jabatan: string;
}

export interface PetugasMasterItem {
  id: string;
  nama: string;
  nipOrNik?: string;
  jabatan: string;
  regu: string;
  noHp?: string;
  status: 'Aktif' | 'Non-Aktif';
  unit?: string;
  kodeUnit?: string;
}

export interface PerintahKerja {
  id: string;
  noSpk: string;
  tanggal: string;
  jenisPekerjaan: 'ROW' | 'Inspeksi' | 'Pemeliharaan';
  penyulangId?: string;
  namaPenyulang: string;
  section: string;
  target: string;
  jumlahPersonil: number;
  status: 'Terencana' | 'Dalam Proses' | 'Selesai' | 'Dibatalkan';
  timAtauPetugas?: string;
  daftarPetugas?: string;
  petugasList?: PetugasSpkDetail[];
  namaManager?: string;
  isApproved?: boolean;
  approvalDate?: string;
  tandaTanganManager?: string; // Base64 / Data URL digital signature of Manager
  catatan?: string;
  createdAt?: string;
  unit?: string;
  kodeUnit?: string;
}

export interface MasterGardu {
  id: string;
  // 11 Core Standard Columns as requested by user
  noBaru?: string; // NO baru
  noGarduBaru?: string; // NO baru (alias)
  noGarduLama?: string; // NO GARDU lama
  alamat?: string; // ALAMAT
  alamatGardu?: string; // ALAMAT (alias)
  penyulang?: string; // PENYULANG
  daya?: number | string; // DAYA (kVA)
  phase?: string; // PHASE (1 Fasa, 3 Fasa, etc.)
  jumlahFasa?: '1 Fasa' | '3 Fasa' | string; // PHASE (alias)
  status?: string; // STATUS (Operasi, Standby, Pemeliharaan, etc.)
  aktif?: string | boolean; // AKTIF (Aktif, Non-Aktif, etc.)
  latitude?: number | string; // LATITUDE
  latt?: number | string; // LATITUDE (alias)
  longitude?: number | string; // LONGITUDE
  long?: number | string; // LONGITUDE (alias)
  thnOperasi?: number | string; // THNOPERASI
  tahunOperasi?: number | string; // THNOPERASI (alias)

  // Optional supplementary fields
  unit?: string; // Unit (e.g. ULP Baguala)
  kodeUnit?: string; // Kode Unit (e.g. 54110)
  ssotNumber?: string; // Ssotnumber
  tipeGardu?: string; // Tipe Gardu (GTT, Beton, Cantol, Portal, Tiang)
  iconType?: string; // Marker Icon Type
}

export interface JurusanData {
  nama: string; // JURUSAN 1, JURUSAN 2, etc.
  iRTotal: number;
  iSTotal: number;
  iTTotal: number;
  iNTotal: number;
  vRN: number;
  vSN: number;
  vTN: number;
  vRS: number;
  vST: number;
  vRT: number;
  iPeakR: number;
  iPeakS: number;
  iPeakT: number;
  tpfR: number;
  tpfS: number;
  tpfT: number;
  titikUkur: string;
}

export interface PengukuranGardu {
  id: string;
  garduId?: string;
  noGardu: string; // No Gardu (Lama / Baru)
  noGarduLama?: string; // No Gardu Lama (sesuai header Excel)
  noGarduBaru?: string; // No Gardu Baru (sesuai header Excel)
  jamUkur?: string; // Jam Ukur (contoh: "10:00", "09:30 WIT")
  unit?: string;
  kodeUnit?: string;
  penyulang?: string;
  dayaKva?: number;
  alamat?: string;
  tanggalUkur: string; // Tanggal Ukur (disimpan dan dibaca sebagai D/M/YYYY contoh 6/8/2026 atau ISO)
  petugas: string; // Petugas ukur
  
  // Total / Main Trafo Measurements
  iRTotal: number;
  iSTotal: number;
  iTTotal: number;
  iNTotal: number;
  vRN: number;
  vSN: number;
  vTN: number;
  vRS: number;
  vST: number;
  vRT: number;
  thdR: number;
  thdS: number;
  thdT: number;
  iPeakR: number;
  iPeakS: number;
  iPeakT: number;
  tpfR: number;
  tpfS: number;
  tpfT: number;

  // Jurusan 1 s/d 4 (optional jika hanya mencatat total trafo)
  jurusan1?: JurusanData;
  jurusan2?: JurusanData;
  jurusan3?: JurusanData;
  jurusan4?: JurusanData;

  createdAt?: string;
}

export interface MaterialKendaraan {
  id?: string;
  namaMaterial: string;
  jumlah: number;
  satuan: string;
}

export interface LiveGpsTrack {
  lat: number;
  lng: number;
  speedKmH?: number;
  heading?: number;
  accuracyMeters?: number;
  altitude?: number;
  batteryLevel?: number; // 0-100%
  statusTrack?: 'Bergerak' | 'Berdiam' | 'Patroli' | 'Penanganan Gangguan' | 'Siaga';
  lastUpdated?: string;
  phoneDeviceId?: string;
  driverPhone?: string;
  driverName?: string;
  driverEmail?: string;
  breadcrumbs?: Array<{ lat: number; lng: number; time: string }>;
}

export interface KendaraanOperasional {
  id: string;
  jenisKendaraan: 'Mobil Operasional' | 'Motor Operasional';
  namaKendaraan: string;
  noPolisi: string;
  unit: string;
  kodeUnit?: string;
  penanggungJawab: string;
  kondisiKendaraan: 'Baik' | 'Perlu Perbaikan' | 'Rusak';
  kondisiBan: 'Baik - Tebal' | 'Cukup' | 'Aus / Perlu Ganti';
  kondisiAki: 'Normal - Baik' | 'Lemah' | 'Perlu Stroom / Ganti';
  kebersihan: 'Sangat Bersih' | 'Bersih' | 'Kotor';
  kilometer?: number;
  tanggalPengecekan: string;
  catatan?: string;
  materials: MaterialKendaraan[];
  gpsTrack?: LiveGpsTrack;
}

export interface AsetJaringan {
  id: string;
  namaPenyulang: string;
  panjangJtmSutm: number;
  panjangJtmSktm: number;
  panjangJtmMvtic: number;
  panjangJtmTotal: number;
  lbsManual: number;
  lbsMotorized: number;
  lbsThreeWay: number;
  recloser: number;
  garduHubung: number;
  pmcb: number;
  autoLink: number;
  fco: number;
  scada: number;
  nonScada: number;
  panjangJtr: number;
  lastUpdate: string;
  unit?: string;
  kodeUnit?: string;
}

export interface InspeksiTier1JTM {
  id: string;
  tglPelaksanaan: string;
  giPembangkit: string;
  noTiang: string;
  up3: string;
  penyulang: string;
  konstruksi: string;
  ulp: string;
  section: string;
  pelaksana: string;
  koordinatX: string;
  koordinatY: string;
  unit?: string;
  kodeUnit?: string;

  // TIANG JTM
  tinggiTiang: string; // 7, 9, 11, 12, 13, 14
  kekuatanTiang: string; // 90, 100, 156, 200, 350
  jenisTiang: string; // Beton, Besi, Kayu
  kepemilikan: string; // PLN, Pemda, Pihak Lain
  kondisiTiang: string[]; // Baik, Berkarat, Miring, Retak, Keropos

  // AKSESORIS TIANG JTM
  verlenkStick3M: string; // Baik, Tdk Ada, Berkarat, Miring
  crossArm: string; // Baik, Berkarat, Keropos, Pendek
  armTie: string; // Baik, Berkarat, Miring, Keropos, Putus
  bandStrap: string; // Baik, Berkarat, Putus
  strainClamp: string; // Baik, Berkarat, Longgar, Putus
  bautCrossArm: string; // Baik, Bengkok, Tdk Lengkap, Tdk Ada
  groundWire: string; // Baik, Rantas, Berkarat, Tdk Ada
  wireClip: string; // Baik, Tdk Ada
  grounding: string; // Baik, Putus, Tdk Ada
  penghalangPanjat: string; // Baik, Tdk Ada
  flangNet: string; // Baik, Miring, Berkarat, Tdk Ada

  // POLE SUPPORTER JTM
  trackSchoor: string; // Baik, Kendor, Putus, Rantas, Tdk Ada
  dragSchoor: string; // Baik, Tdk Ada
  kontraMast: string; // Baik, Tdk Ada
  guyInsulator: string; // Baik, Longgar, Lepas, Tdk Ada
  pondasi: string; // Baik, Retak, Tdk Ada

  // KONDUKTOR
  lokasiPenempatan: string; // SKTM, SUTM, SKUTM
  panjangKonduktor: string;
  penampangKonduktor: string; // 70, 90, 110, 150, 240, 300
  jenisKonduktor: string; // A3C, ACSR, A3Cs, A3COC, MVTC, XLPE
  kondisiKonduktor: string; // Baik, Rantas
  jenisJumperan: string; // LLC, Joint, Line Tap, Paralel
  kondisiJumperan: string; // Baik, Rantas, Telanjang
  jarakJumperan: string;
  kondisiAndongan: string; // Baik, Kendor
  bendingIsolator: string; // Top Ties, Tekep, Cover Pin, Isolasi, Alumunium
  kondisiBending: string; // Baik, Rantas

  // ISOLATOR
  isolatorTumpu: string; // Baik, Lama/Kaca, Kotor, Pecah, Flash Over, Line Post
  isolatorTarik: string; // Baik, Lama/Kaca, Kotor, Pecah, Flash Over
  isolatorGantung: string; // Baik, Lama/Kaca, Kotor, Pecah, Flash Over
  sepatuKabel: string; // 2 Lubang, 1 Lubang
  terminasi: string; // Baik, Cacat
  lightingArrester: string; // Baik, Keramik, Retak, Lepas/Tdk Ada
  cutOut: string; // Baik, Keramik, Retak
  konstruksiSeharusnya: string;

  // ROW
  pohon: string; // Tdk Ada, > 2.5 m, 1-2.5 m, < 1 m, Menempel
  jenisPohon: string;
  jumlahPohon: string;
  layangLayang: string; // Tdk Ada, Benang, Kerangka, Menempel
  bangunanBaliho: string; // Tdk Ada, > 2.5 m, 1-2.5 m, < 1 m, Menempel
  umbulUmbul: string; // Tdk Ada, > 2.5 m, 1-2.5 m, < 1 m, Menempel

  kondisiTemuanLain: string;
}

export interface InspeksiTier1GTT {
  id: string;
  tglPelaksanaan: string;
  giPembangkit: string;
  section: string;
  tipeGardu: string;
  pelaksana: string;
  area: string;
  penyulang: string;
  noGtt: string;
  alamat: string;
  ulp: string;
  koordinatX: string;
  koordinatY: string;
  unit?: string;
  kodeUnit?: string;

  // TIANG GTT
  konstruksiTiang: string; // 1 Tiang, 2 Tiang
  tinggiTiang: string;
  pondasi: string;
  jenisTiang: string;
  kondisiTiang: string[];

  // PENGAMAN TM
  konektorJumperJtm: string;
  konektorJumperFco: string;
  jumperanJtmCo: string;
  dudukanFco: string;
  konektorFcoBushing: string;
  jumperanJtmCo2: string;
  
  // Simplified phase status for Cut Out, Deksel, LA
  statusPhaseR: string;
  statusPhaseS: string;
  statusPhaseT: string;
  
  posisiLaThdFco: string;
  koneksiLaTanah: string;

  // DATA GTT
  jumlahTrafo: string;
  noSeri: string;
  merk: string;
  daya: string;
  tahunBuat: string;
  teganganPrimer: string;
  teganganSekunder: string;
  arusPrimer: string;
  arusSekunder: string;
  impedansi: string;
  beratTrafo: string;
  teganganTap: string;
  hubBelitan: string;
  statusTrafo: string;
  volumeMinyak: string;
  kwhMeter: string;

  // DATA INSPEKSI GTT
  bodyTrafo: string;
  suaraTrafo: string;
  bushingPrimer: string;
  bushingSekunder: string;
  platCopperBushing: string;
  groundingNetral: string;
  dudukanTrafo: string;
  lingkunganGardu: string;

  // LV PANEL
  bodyLvPanel: string;
  kebersihanLvPanel: string;
  kondisiCat: string;
  kunciLvPanel: string;
  relBusBar: string;

  kondisiTemuanLain: string;
}

export interface InspeksiTier1Switching {
  id: string;
  tglPelaksanaan: string;
  giPembangkit: string;
  noTiang: string;
  area: string;
  penyulang: string;
  konstruksi: string;
  ulp: string;
  section: string;
  pelaksana: string;
  namaSwitching: string;
  alamat: string;
  koordinatX: string;
  koordinatY: string;
  unit?: string;
  kodeUnit?: string;

  // TIANG JTM
  tinggiTiang: string;
  kekuatanTiang: string;
  jenisTiang: string;
  kepemilikan: string;
  kondisiTiang: string[];

  // PMCB
  merkPmcb: string;
  thnBuatPmcb: string;
  tglPasangPmcb: string;
  tglOperasiPmcb: string;
  lokasiPmcb: string;
  ratedCurrentPmcb: string;
  ratedVoltagePmcb: string;
  normalOperasiPmcb: string;
  kondisiPmcb: string;
  kotakPmcb: string;
  panelControlPmcb: string;
  isolatorPmcb: string;
  lbsManualPmcb: string;
  dsOutdoorPmcb: string;
  kondisiDsOutdoorPmcb: string;
  groundingPmcb: string;
  namePlatePmcb: string;
  fungsiRemotePmcb: string;
  supply220Pmcb: string;
  bateraiPmcb: string;

  // RECLOSER/ LBS MOTORIZE/ LBS MANUAL
  merkRec: string;
  thnBuatRec: string;
  tglPasangRec: string;
  tglOperasiRec: string;
  noSeriRec: string;
  tipeRec: string;
  ratedCurrentRec: string;
  ratedVoltageRec: string;
  breakingCurrentRec: string;
  peredamBusurApiRec: string;
  teganganMotorRec: string;
  lokasiRec: string;
  normalOperasiRec: string;
  kondisiRec: string;
  kondisiGasSf6Rec: string;
  cvtBushingRec: string;
  tutupBushingRec: string;
  isolatorRec: string;
  lbsManualRec: string;
  dsOutdoorRec: string;
  kondisiDsOutdoorRec: string;
  groundingRec: string;
  namePlateRec: string;
  panelControlRec: string;
  fungsiRemoteRec: string;
  supply220Rec: string;
  bateraiRec: string;

  kondisiTemuanLain: string;
}

export interface ThermovisionPoint {
  tempR: string;
  tempS: string;
  tempT: string;
  tempN?: string;
  status: string;
}

export interface InspeksiTier2Thermovision {
  id: string;
  tglPelaksanaan: string;
  area: string;
  ulp: string;
  giPembangkit: string;
  penyulang: string;
  section: string;
  noTiang: string;
  konstruksi: string;
  pelaksana: string;
  koordinatX: string;
  koordinatY: string;
  unit?: string;
  kodeUnit?: string;

  // KONEKTOR/ JUMPERAN
  konektorJumperan: ThermovisionPoint;
  konektorJumperanCO: ThermovisionPoint;
  konektorJumperanLA: ThermovisionPoint;
  sepatuKabelTanah: ThermovisionPoint;
  sepatuKabelMVTIC: ThermovisionPoint;

  // GTT
  bushingPrimerGTT: ThermovisionPoint;
  bushingSekunderGTT: ThermovisionPoint;
  sepatuKabelInfoer: ThermovisionPoint;
  contactVeerUtama: ThermovisionPoint;
  contactVeerJurusanA: ThermovisionPoint;
  contactVeerJurusanB: ThermovisionPoint;
  contactVeerJurusanC: ThermovisionPoint;
  contactVeerJurusanD: ThermovisionPoint;
  sepatuKabelTofoerA: ThermovisionPoint;
  sepatuKabelTofoerB: ThermovisionPoint;
  sepatuKabelTofoerC: ThermovisionPoint;
  sepatuKabelTofoerD: ThermovisionPoint;

  // RECLOSER/ PMCB/ LBS
  pisauLBS: ThermovisionPoint;
  peredamBusurApi: ThermovisionPoint;
  bushing: ThermovisionPoint;

  kondisiTemuanLain: string;
}

export interface InspeksiTier2Ultrasound {
  id: string;
  tglPelaksanaan: string;
  giPembangkit: string;
  noTiang: string;
  area: string;
  penyulang: string;
  konstruksi: string;
  ulp: string;
  section: string;
  pelaksana: string;
  koordinatX: string;
  koordinatY: string;
  unit?: string;
  kodeUnit?: string;

  // ISOLATOR
  isolatorTumpu: string;
  isolatorTarik: string;
  fuseCutOut: string;
  lightningArrester: string;
  terminasiKabelTanah: string;
  terminasiKabelMVTIC: string;

  // JUMPERAN JTM
  konektorJumperan: string;

  // GTT
  bushingPrimerGTT: string;
  bushingSekunderGTT: string;

  // RECLOSER/ PMCB/ LBS
  bushingSwitching: string;

  kondisiTemuanLain: string;
}

export interface JadwalPiket {
  id: string;
  namaPetugas: string;
  noHp: string;
  unit: string;
  kodeUnit?: string;
  jadwal: { [key: string]: string }; // key: date (ISO string or day number), value: shift (P, S, M, L)
  lastUpdate: string;
}

export type JenisSurat = 
  | 'ba_pemeriksaan_iml'
  | 'surat_cuti' 
  | 'permintaan_alker' 
  | 'cmc_petugas' 
  | 'surat_panggilan' 
  | 'permintaan_material';

export interface SuratItem {
  id: string;
  nomorSurat: string;
  jenisSurat: JenisSurat;
  tanggalSurat: string;
  perihal: string;
  kepada: string;
  pembuat: string;
  unit: string;
  kodeUnit?: string;
  status: 'Draft' | 'Diajukan' | 'Disetujui' | 'Selesai';
  payload: {
    // BA Pemeriksaan IML fields
    idPelanggan?: string;
    noMeter?: string;
    namaPelanggan?: string;
    alamatPelanggan?: string;
    tarifDaya?: string;
    fasa?: '1 Fasa' | '3 Fasa' | string;
    tipeMeter?: 'Prabayar (Token)' | 'Pascabayar' | string;
    standKwh?: number | string;
    standKvarh?: number | string;
    mcbTerpasang?: string;
    kondisiSegelMeter?: 'Baik / Utuh' | 'Rusak' | 'Putus' | 'Tidak Ada' | string;
    kondisiSegelTerminal?: 'Baik / Utuh' | 'Rusak' | 'Putus' | 'Tidak Ada' | string;
    kondisiSegelMcb?: 'Baik / Utuh' | 'Rusak' | 'Putus' | 'Tidak Ada' | string;
    teganganVolt?: number | string;
    arusAmpere?: number | string;
    ujiAkurasiPutaran?: string;
    kesimpulanPemeriksaan?: 'Normal & Sesuai Standar' | 'Perlu Penggantian Meter' | 'Anomali Pembatas / MCB' | 'Indikasi Pelanggaran / P2TL' | 'Kabel / Pengawatan Rusak' | string;
    uraianTemuan?: string;
    tindakanPetugas?: string;
    petugas1?: string;
    petugas2?: string;
    namaSaksiPelanggan?: string;
    noHpPelanggan?: string;

    namaPegawai?: string;
    nip?: string;
    jabatan?: string;
    cutiDari?: string;
    cutiSampai?: string;
    alasanCuti?: string;
    alamatCuti?: string;
    pengganti?: string;

    namaAlker?: string;
    jumlahAlker?: number;
    keperluanAlker?: string;
    tglDibutuhkan?: string;

    namaKetua?: string;
    anggotaTim?: string;
    shiftPiket?: string;
    noKendaraan?: string;
    penyulangTarget?: string;
    peralatanDibawa?: string;

    namaDipanggil?: string;
    jabatanDipanggil?: string;
    hariTanggalPanggilan?: string;
    waktuPanggilan?: string;
    tempatPanggilan?: string;
    agendaPanggilan?: string;

    namaProyek?: string;
    lokasiPekerjaan?: string;
    gudangTujuan?: string;
    listMaterial?: { nama: string; satuan: string; volume: number }[];
  };
  catatan?: string;
  createdAt: string;
}

export interface PohonGisItem {
  id: string;
  penyulang: string;
  section?: string;
  noTiangOrSpan: string;
  lokasi: string;
  lat: number;
  lng: number;
  unit?: string;
  kodeUnit?: string;
  jarakKeJaringan: '< 1 meter' | '1 - 2.5 meter' | '> 2.5 meter' | 'Menempel Kawat';
  tingkatBahaya: 'Kritis (Bahaya Padam)' | 'Rawan Sentuh' | 'Aman / Terpangkas' | 'Potensi Roboh';
  statusEksekusi: 'Perlu Tebas' | 'Perlu Tebang' | 'Perlu Izin Warga' | 'Perlu Padam' | 'Selesai Pangkas';
  jenisPohon: string;
  jumlahPohon: number;
  tglTemuan: string;
  tglEksekusi?: string;
  pelaksana?: string;
  keterangan?: string;
  fotoTemuan?: string;
  fotoEksekusi?: string;
  iconType?:
    | 'pohon'
    | 'kelapa'
    | 'bambu'
    | 'leaf'
    | 'saw'
    | 'tiang'
    | 'tiang_besi'
    | 'konstruksi'
    | 'gardu'
    | 'crane'
    | 'warning'
    | 'pin'
    | string;
}

export interface KonstruksiGisItem {
  id: string;
  namaProyek: string; // Judul Temuan / Nama Proyek Perbaikan
  nomorSpk?: string; // No Laporan Inspeksi / No WO / SPK
  noTiang?: string; // No Tiang / No Gardu / Span JTM
  penyulang: string;
  section?: string;
  lokasi: string;
  lat: number;
  lng: number;
  unit?: string;
  kodeUnit?: string;
  coordinatesPolyline?: [number, number][];
  kategoriKonstruksi: 
    | 'TRAVERS / Cross Arm'
    | 'BEUGEL & Aksesoris Tiang'
    | 'GARDU DISTRIBUSI & GTT'
    | 'KABEL, Konduktor & Jumper'
    | 'ISOLATOR & Arrester'
    | 'TIANG DISTRIBUSI'
    | 'PERALATAN HUBUNG (LBS/FCO/DS)'
    | 'GROUNDING & Animal Guard'
    | 'MATERIAL / Konstruksi Lainnya'
    | 'Rekonstruksi Tiang Miring / Keropos' 
    | 'Uprating / Penggantian Konduktor' 
    | 'Pemasangan LBS Motorized / Recloser' 
    | 'Pembangunan GTT Sisipan' 
    | 'Pembangunan JTM Baru (Perluasan)' 
    | 'Penggantian Isolator Flashover / Arrester'
    | 'Pemasangan Animal Guard / Penghalang Panjat';
  jenisAnomali?: string; // Deskripsi anomali (misal: Travers patah sebelah, Beugel keropos, dll)
  tingkatBahaya?: 'Kritis (Potensi Gangguan Segera)' | 'Tinggi (Perlu Tindak Lanjut Cepat)' | 'Sedang (Perbaikan Terjadwal)' | 'Ringan (Monitoring)';
  kebutuhanMaterial?: string; // Rincian material PLN yang dibutuhkan (mis: Travers UNP 2.5m, Beugel 8 inch, dll)
  statusProyek: 'Rencana' | 'Sedang Dikerjakan' | 'Uji Komisioning' | 'Selesai Beroperasi' | 'Belum Ditindaklanjuti' | 'Terjadwal WO / Pemeliharaan' | 'Selesai Diperbaiki';
  progresPersen: number;
  targetSelesai: string;
  tglMulai?: string;
  tglTemuan?: string;
  tglSelesai?: string;
  anggaranRp?: number;
  pelaksanaVendor: string; // Pelaksana / Tim Har (Yantek / Vendor / Tim Pemeliharaan ULP)
  pengawasPln: string; // Petugas Inspeksi / Pengawas PLN
  volumeAset: string; // Volume temuan / perbaikan
  keterangan?: string;
  fotoSebelum?: string;
  fotoProgres?: string;
}

export interface SurveyPbPdItem {
  id: string;
  noAgenda?: string; // No Agenda / No Registrasi Permohonan
  idPelanggan?: string; // ID Pelanggan / No Meter
  namaPelanggan: string; // Nama Pelanggan / Pemohon
  noHpPelanggan?: string; // Kontak / No WA Pelanggan
  jenisTransaksi: 'Pasang Baru (PB)' | 'Perubahan Daya (PD)';
  tarifLama?: string; // Contoh: R1, B1, S2
  dayaLamaVa?: number; // Contoh: 450, 900, 1300, 2200, dsb
  tarifBaru: string; // Contoh: R1M/900VA, R1/1300VA, B1/2200VA, dsb
  dayaBaruVa: number; // Daya Baru (VA)
  peruntukan?: 'Rumah Tangga' | 'Bisnis / Ruko' | 'Industri' | 'Sosial / Rumah Ibadah' | 'Pemerintah / Fasilitas Umum' | string;
  unit?: string;
  kodeUnit?: string;

  // Wajib sesuai permintaan user:
  penyulang: string; // Penyulang / Feeder
  noGardu: string; // No Gardu Distribusi / GTT
  lokasi: string; // Lokasi / Alamat Pelanggan
  tegPangkal: number; // Tegangan Pangkal (Volt), misal 220V - 235V
  tegTetangga: number; // Tegangan Tetangga (Volt), misal 205V - 225V
  fasaYangDiambil: 'R' | 'S' | 'T' | 'R-S' | 'S-T' | 'T-R' | 'R-S-T' | '1 Fasa (Fasa R)' | '1 Fasa (Fasa S)' | '1 Fasa (Fasa T)' | '3 Fasa (R-S-T)' | string; // Fasa yang di ambil
  titikSambung: string; // Titik Sambung (e.g. Tiang TR No. 04 Jurusan 2, Tiang Besi 9m, Tiang SR-01, dsb)

  // Data Teknis Tambahan:
  jurusanGardu?: string; // Jurusan 1, Jurusan 2, Jurusan 3, Jurusan 4
  panjangSrMeter?: number; // Panjang Sambungan Rumah (meter)
  jenisKabelSr?: string; // TIC 2x10mm², TIC 2x16mm², TIC 4x16mm², dsb
  perkiraanDropTeganganVolt?: number; // Drop Tegangan (V)
  lat?: number; // Koordinat Bangunan / Lokasi Pelanggan (Latitude)
  lng?: number; // Koordinat Bangunan / Lokasi Pelanggan (Longitude)
  titikSambungLat?: number; // Koordinat Titik Sambung / Tiang TR (Latitude)
  titikSambungLng?: number; // Koordinat Titik Sambung / Tiang TR (Longitude)
  statusKelayakan: 'Perlu Survey Lapangan' | 'WO Survey Diterbitkan' | 'Layak Sambung' | 'Perlu Sisip Tiang' | 'Perlu Perluasan JTR' | 'Perlu Up-rating Trafo' | 'Drop Tegangan (Tidak Layak)' | 'Menunggu Material' | 'Selesai Penyambungan' | string;
  petugasSurvey: string; // Surveyor Lapangan
  tanggalSurvey: string; // YYYY-MM-DD
  tanggalPenyambungan?: string; // YYYY-MM-DD
  rekomendasiTeknis?: string;
  catatan?: string;
  fotoBangunan?: string; // URL / Base64 foto bangunan / rumah calon pelanggan
  fotoLokasi?: string; // Alias foto lokasi
  fotoPengukuranTegangan?: string; // Foto pengukuran multimeter / voltase
  fotoTitikSambung?: string; // URL / Base64 foto titik sambung / tiang TR / SR
  teamLeaderName?: string; // Nama Team Leader / Supervisor
  isApproved?: boolean; // Status approval digital signature
  tandaTanganSurveyor?: string; // Base64 / Data URL digital signature of surveyor
  tandaTanganTlTeknik?: string; // Base64 / Data URL digital signature of TL Teknik
  createdAt?: string;
}

export interface TargetPemeliharaanPenyulang {
  id: string;
  penyulang: string;
  targetRowPohon: number;
  targetInspeksiTier1: number;
  targetInspeksiTier2: number;
  bulanTarget?: string;
  catatan?: string;
  unit?: string;
  kodeUnit?: string;
}

export interface AutoReplyRule {
  id: string;
  title: string;
  keywords: string[];
  response: string;
  topic?: 'gangguan' | 'teknis' | 'row' | 'survey' | 'umum';
  isActive: boolean;
  createdBy?: string;
  createdAt?: string;
}

export interface PeremajaanMeterItem {
  id: string;
  idPelanggan: string;
  namaPelanggan: string;
  tarifDaya: string;
  alamat: string;
  noMeterLama: string;
  merekMeterLama: string;
  standMeterLama: number;
  noMeterBaru: string;
  merekMeterBaru: string;
  standMeterBaru: number;
  noSegelBaru: string;
  alasanPeremajaan: string;
  petugasPelaksana: string;
  tglPelaksanaan: string;
  status: 'SELESAI' | 'DALAM_PROSES' | 'MENUNGGU_APPROVAL';
  catatan?: string;
  fotoMeter?: string;
  unit: string;
  kodeUnit?: string;
  createdAt?: string;
}

export interface MeterSLItem {
  id: string;
  idPelangganOrLokasi: string;
  namaPemohonOrPelanggan: string;
  kategoriSL: 'PJU (Penerangan Jalan Umum)' | 'Pesta / Penerangan Sementara' | 'Proyek Konstruksi' | 'Pelanggan Prabayar SL' | 'Audit Sambungan Langsung' | string;
  lokasiAlamat: string;
  dayaKva: number;
  arusNominalAmpere: number;
  tipePengukuran: 'Langsung (Direct)' | 'CT / Indirect' | string;
  pembatasArus: string;
  faktorKaliMeter: number;
  tglPemeriksaan: string;
  statusKelayakan: 'SESUAI_STANDAR' | 'ANOMALI_ARUS' | 'POTENSI_SUSUT' | 'TERTIBKAN_P2TL' | string;
  tindakanRekomendasi: string;
  petugasPemeriksa: string;
  unit: string;
  kodeUnit?: string;
  createdAt?: string;
}

export interface MonitoringSusutItem {
  id: string;
  bulanTahun: string;
  namaPenyulangOrUnit: string;
  kwhKirim: number;
  kwhTerimaOrTerjual: number;
  kwhSusut: number;
  persentaseSusut: number;
  targetSusutPersen: number;
  kategoriSusut: 'SUSUT_TEKNIS' | 'SUSUT_NON_TEKNIS' | 'GABUNGAN' | string;
  statusTarget: 'TERCAPAI' | 'WASPADA' | 'OVER_TARGET' | string;
  akarMasalah: string;
  tindakanUpaya: string;
  unit: string;
  kodeUnit?: string;
  createdAt?: string;
}

export interface K3LItem {
  id: string;
  namaItem: string;
  kategori: 'APD Wajib' | 'Alat Pelindung Kolektif (APK)' | 'Peralatan Kerja Bertegangan' | 'Alat Ukur & Uji K3' | 'Kotak P3K & Safety Kit' | string;
  jumlahTersedia: number;
  jumlahKondisiBaik: number;
  jumlahRusak: number;
  satuan: string;
  lokasiPenyimpanan: string;
  tglUjiKelayakanTerakhir?: string;
  tglKadaluarsaOrReuji?: string;
  statusKelayakan: 'LAYAK_PAKAI' | 'PERLU_UJI_ULANG' | 'RUSAK_AFKIR' | 'KADALUARSA' | string;
  penanggungJawab: string;
  keterangan?: string;
  unit: string;
  kodeUnit?: string;
  createdAt?: string;
}



