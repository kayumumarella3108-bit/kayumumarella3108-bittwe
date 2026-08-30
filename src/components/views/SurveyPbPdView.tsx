import React, { useState, useMemo } from 'react';
import {
  Zap,
  Plus,
  Search,
  Download,
  FileSpreadsheet,
  Trash2,
  Edit3,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  MapPin,
  FileText,
  Printer,
  Share2,
  Filter,
  Eye,
  Sliders,
  Sparkles,
  ArrowRight,
  TrendingDown,
  Building,
  UserCheck,
  Check,
  ChevronRight,
  Activity,
  Layers,
  Camera,
  X,
  Phone,
  Calendar,
  Info,
  Map,
  Compass,
  PenTool
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { SurveyPbPdItem, Penyulang, MasterGardu, User } from '../../types';
import { canEditData, isPemasaranUser, isInspeksiUser } from '../../utils/permissions';
import { SurveyMapPicker } from '../modals/SurveyMapPicker';
import { SurveyPhotoUploadSection } from '../modals/SurveyPhotoUploadSection';
import { LivePaperPbPdDocument } from '../modals/LivePaperPbPdDocument';
import { SurveyPbPdMapTab } from './SurveyPbPdMapTab';
import { generateLivePaperPdf, exportElementToA4Pdf } from '../../utils/exportLivePaperPdf';
import { DigitalSignaturePad } from '../common/DigitalSignaturePad';
import { TableSkeletonLoader } from '../common/TableSkeletonLoader';
import { DAFTAR_UNIT_PLN } from '../../utils/unitConfig';

interface SurveyPbPdViewProps {
  currentUser?: User | null;
  surveyList: SurveyPbPdItem[];
  penyulangList: Penyulang[];
  masterGarduList?: MasterGardu[];
  onAddSurvey: (item: SurveyPbPdItem) => void;
  onUpdateSurvey: (item: SurveyPbPdItem) => void;
  onDeleteSurvey: (id: string) => void;
  isLoading?: boolean;
}

export const SurveyPbPdView: React.FC<SurveyPbPdViewProps> = ({
  currentUser,
  surveyList,
  penyulangList,
  masterGarduList = [],
  onAddSurvey,
  onUpdateSurvey,
  onDeleteSurvey,
  isLoading = false
}) => {
  const [activeTab, setActiveTab] = useState<'daftar' | 'peta' | 'analisis' | 'berita_acara'>('daftar');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPenyulang, setFilterPenyulang] = useState('ALL');
  const [filterUnit, setFilterUnit] = useState('ALL');
  const [filterJenis, setFilterJenis] = useState<'ALL' | 'PB' | 'PD'>('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterFasa, setFilterFasa] = useState('ALL');

  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formModalTab, setFormModalTab] = useState<'form' | 'paper'>('form');
  const [editingItem, setEditingItem] = useState<SurveyPbPdItem | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<SurveyPbPdItem | null>(null);
  const [selectedForBa, setSelectedForBa] = useState<SurveyPbPdItem | null>(null);
  const [previewModalPhoto, setPreviewModalPhoto] = useState<{ url: string; title: string; subtitle?: string } | null>(null);

  // Form input fields
  const [formData, setFormData] = useState<Partial<SurveyPbPdItem>>({
    jenisTransaksi: 'Pasang Baru (PB)',
    namaPelanggan: '',
    noAgenda: '',
    idPelanggan: '',
    noHpPelanggan: '',
    tarifLama: '',
    dayaLamaVa: undefined,
    tarifBaru: 'R1/1300 VA',
    dayaBaruVa: 1300,
    peruntukan: 'Rumah Tangga',
    penyulang: penyulangList[0]?.namaPenyulang || 'PASSO',
    noGardu: 'BG-01',
    jurusanGardu: 'Jurusan 1',
    lokasi: '',
    lat: -3.6375,
    lng: 128.2435,
    titikSambungLat: -3.6376,
    titikSambungLng: 128.2433,
    tegPangkal: 230,
    tegTetangga: 220,
    fasaYangDiambil: '1 Fasa (Fasa R)',
    titikSambung: 'Tiang TR No. 01 Jurusan 1',
    panjangSrMeter: 15,
    jenisKabelSr: '2x10 mm²',
    statusKelayakan: 'Layak Sambung',
    petugasSurvey: currentUser?.name || 'Petugas Survey Lapangan',
    tanggalSurvey: new Date().toISOString().split('T')[0],
    rekomendasiTeknis: '',
    catatan: '',
    fotoBangunan: '',
    fotoLokasi: '',
    fotoPengukuranTegangan: '',
    fotoTitikSambung: '',
    tandaTanganSurveyor: '',
    tandaTanganTlTeknik: '',
    isApproved: false
  });

  const canEdit = currentUser ? canEditData(currentUser) : true;
  const isPemasaran = currentUser ? isPemasaranUser(currentUser) : false;
  const isInspeksi = currentUser ? isInspeksiUser(currentUser) : false;

  // Calculation helpers
  const getDropTegangan = (pangkal: number = 0, tetangga: number = 0) => {
    if (!pangkal || !tetangga) return { dropVolt: 0, dropPct: 0, status: 'Belum Diukur / Pending Survey' };
    const dropVolt = Math.max(0, pangkal - tetangga);
    const dropPct = (dropVolt / pangkal) * 100;
    let status = 'Aman (< 5%)';
    if (dropPct >= 10) status = 'Kritis (≥ 10%) - Tidak Layak';
    else if (dropPct >= 5) status = 'Waspada (5% - 9.9%)';
    return { dropVolt, dropPct, status };
  };

  // Open modal for Create Work Order (Bagian Pemasaran)
  const handleOpenCreateWo = () => {
    setEditingItem(null);
    setFormData({
      jenisTransaksi: 'Pasang Baru (PB)',
      namaPelanggan: '',
      noAgenda: `54260${Math.floor(1000000 + Math.random() * 9000000)}`,
      idPelanggan: '',
      noHpPelanggan: '',
      tarifLama: '',
      dayaLamaVa: undefined,
      tarifBaru: 'R1/1300 VA',
      dayaBaruVa: 1300,
      peruntukan: 'Rumah Tangga',
      penyulang: penyulangList[0]?.namaPenyulang || 'PASSO',
      noGardu: masterGarduList[0]?.noGardu || 'BG-01',
      jurusanGardu: 'Jurusan 1',
      lokasi: '',
      lat: -3.6375,
      lng: 128.2435,
      titikSambungLat: -3.6376,
      titikSambungLng: 128.2433,
      tegPangkal: 0,
      tegTetangga: 0,
      fasaYangDiambil: '1 Fasa (Fasa R)',
      titikSambung: 'Ditentukan Saat Survey Lapangan',
      panjangSrMeter: 15,
      jenisKabelSr: '2x10 mm²',
      statusKelayakan: 'Perlu Survey Lapangan',
      petugasSurvey: currentUser?.name || 'Staf Pemasaran ULP Baguala',
      tanggalSurvey: new Date().toISOString().split('T')[0],
      rekomendasiTeknis: 'Diterbitkan dari Bagian Pemasaran. Memerlukan survey pengukuran tegangan & titik sambung di lapangan oleh Tim Teknik.',
      catatan: '',
      teamLeaderName: '',
      fotoBangunan: '',
      fotoLokasi: '',
      fotoPengukuranTegangan: '',
      fotoTitikSambung: '',
      tandaTanganSurveyor: '',
      tandaTanganTlTeknik: '',
      isApproved: false
    });
    setIsModalOpen(true);
  };

  // Open modal for Create or Edit
  const handleOpenCreate = () => {
    if (isPemasaran) {
      handleOpenCreateWo();
      return;
    }
    setEditingItem(null);
    setFormData({
      jenisTransaksi: 'Pasang Baru (PB)',
      namaPelanggan: '',
      noAgenda: `54260${Math.floor(1000000 + Math.random() * 9000000)}`,
      idPelanggan: '',
      noHpPelanggan: '',
      tarifLama: '',
      dayaLamaVa: undefined,
      tarifBaru: 'R1/1300 VA',
      dayaBaruVa: 1300,
      peruntukan: 'Rumah Tangga',
      penyulang: penyulangList[0]?.namaPenyulang || 'PASSO',
      noGardu: masterGarduList[0]?.noGardu || 'BG-01',
      jurusanGardu: 'Jurusan 1',
      lokasi: '',
      lat: -3.6375,
      lng: 128.2435,
      titikSambungLat: -3.6376,
      titikSambungLng: 128.2433,
      tegPangkal: 230,
      tegTetangga: 220,
      fasaYangDiambil: '1 Fasa (Fasa R)',
      titikSambung: 'Tiang TR No. 01 Jurusan 1',
      panjangSrMeter: 15,
      jenisKabelSr: '2x10 mm²',
      statusKelayakan: 'Layak Sambung',
      petugasSurvey: currentUser?.name || 'Petugas Survey ULP Baguala',
      tanggalSurvey: new Date().toISOString().split('T')[0],
      rekomendasiTeknis: '',
      catatan: '',
      teamLeaderName: '',
      fotoBangunan: '',
      fotoLokasi: '',
      fotoPengukuranTegangan: '',
      fotoTitikSambung: '',
      tandaTanganSurveyor: '',
      tandaTanganTlTeknik: '',
      isApproved: false
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: SurveyPbPdItem) => {
    setEditingItem(item);
    setFormData({
      ...item,
      lat: item.lat || -3.6375,
      lng: item.lng || 128.2435,
      titikSambungLat: item.titikSambungLat || (item.lat ? item.lat - 0.00015 : -3.6376),
      titikSambungLng: item.titikSambungLng || (item.lng ? item.lng - 0.00015 : 128.2433),
      fotoBangunan: item.fotoBangunan || item.fotoLokasi || '',
      fotoTitikSambung: item.fotoTitikSambung || '',
      teamLeaderName: item.teamLeaderName || '',
      tandaTanganSurveyor: item.tandaTanganSurveyor || '',
      tandaTanganTlTeknik: item.tandaTanganTlTeknik || '',
      isApproved: item.isApproved ?? false
    });
    setIsModalOpen(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('DEBUG: handleSaveForm formData:', formData);
    if (!formData.namaPelanggan) {
      alert('Mohon masukkan Nama Pelanggan / Pemohon.');
      return;
    }

    const pangkal = Number(formData.tegPangkal) || 220;
    const tetangga = Number(formData.tegTetangga) || 220;
    const dropVolt = Math.max(0, pangkal - tetangga);

    const fotoBangunanVal = formData.fotoBangunan || formData.fotoLokasi || '';
    const fotoTitikSambungVal = formData.fotoTitikSambung || '';

    const record: SurveyPbPdItem = {
      id: editingItem ? editingItem.id : `srv-${Date.now()}`,
      noAgenda: formData.noAgenda || `54260${Math.floor(1000000 + Math.random() * 9000000)}`,
      idPelanggan: formData.idPelanggan || '',
      namaPelanggan: formData.namaPelanggan.trim(),
      noHpPelanggan: formData.noHpPelanggan || '',
      jenisTransaksi: formData.jenisTransaksi || 'Pasang Baru (PB)',
      tarifLama: formData.tarifLama || '',
      dayaLamaVa: formData.dayaLamaVa ? Number(formData.dayaLamaVa) : undefined,
      tarifBaru: formData.tarifBaru || 'R1/1300 VA',
      dayaBaruVa: Number(formData.dayaBaruVa) || 1300,
      peruntukan: formData.peruntukan || 'Rumah Tangga',
      penyulang: formData.penyulang || penyulangList[0]?.namaPenyulang || 'PASSO',
      noGardu: formData.noGardu || masterGarduList[0]?.noGardu || 'BG-01',
      jurusanGardu: formData.jurusanGardu || 'Jurusan 1',
      lokasi: formData.lokasi?.trim() || (isPemasaran ? 'Menunggu Survey Lapangan' : 'Lokasi Pelanggan'),
      lat: formData.lat !== undefined ? Number(formData.lat) : undefined,
      lng: formData.lng !== undefined ? Number(formData.lng) : undefined,
      titikSambungLat: formData.titikSambungLat !== undefined ? Number(formData.titikSambungLat) : undefined,
      titikSambungLng: formData.titikSambungLng !== undefined ? Number(formData.titikSambungLng) : undefined,
      tegPangkal: pangkal,
      tegTetangga: tetangga,
      fasaYangDiambil: formData.fasaYangDiambil || '1 Fasa (Fasa R)',
      titikSambung: formData.titikSambung?.trim() || (isPemasaran ? 'Menunggu Survey Lapangan' : 'Tiang TR No. 01'),
      panjangSrMeter: Number(formData.panjangSrMeter) || 15,
      jenisKabelSr: (formData.jenisKabelSr || '2x10 mm²').replace(/^TIC\s*/i, ''),
      statusKelayakan: isPemasaran && !editingItem ? 'Perlu Survey Lapangan' : (formData.statusKelayakan || 'Layak Sambung'),
      perkiraanDropTeganganVolt: dropVolt,
      petugasSurvey: formData.petugasSurvey || currentUser?.name || 'Staf Pemasaran ULP Baguala',
      tanggalSurvey: formData.tanggalSurvey || new Date().toISOString().split('T')[0],
      tanggalPenyambungan: formData.tanggalPenyambungan || '',
      rekomendasiTeknis: formData.rekomendasiTeknis || (isPemasaran ? 'WO Survey diterbitkan oleh Bagian Pemasaran. Menunggu pengukuran dan inspeksi teknis lapangan.' : ''),
      catatan: formData.catatan || '',
      teamLeaderName: formData.teamLeaderName || '',
      fotoBangunan: fotoBangunanVal,
      fotoLokasi: fotoBangunanVal,
      fotoPengukuranTegangan: formData.fotoPengukuranTegangan || '',
      fotoTitikSambung: fotoTitikSambungVal,
      tandaTanganSurveyor: formData.tandaTanganSurveyor || '',
      tandaTanganTlTeknik: formData.tandaTanganTlTeknik || '',
      isApproved: formData.isApproved ?? editingItem?.isApproved ?? false,
      createdAt: editingItem?.createdAt || new Date().toISOString()
    };

    if (editingItem) {
      onUpdateSurvey(record);
    } else {
      onAddSurvey(record);
    }

    setIsModalOpen(false);
    setEditingItem(null);
  };

  // Image Upload helper
  const handleImageUpload = (field: 'fotoLokasi' | 'fotoPengukuranTegangan' | 'fotoTitikSambung', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, [field]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Filtered Survey List
  const filteredList = useMemo(() => {
    return surveyList.filter(item => {
      const matchSearch =
        searchQuery === '' ||
        item.namaPelanggan.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.noAgenda && item.noAgenda.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.idPelanggan && item.idPelanggan.toLowerCase().includes(searchQuery.toLowerCase())) ||
        item.noGardu.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.penyulang.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.lokasi.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.titikSambung.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.petugasSurvey.toLowerCase().includes(searchQuery.toLowerCase());

      const matchPenyulang = filterPenyulang === 'ALL' || item.penyulang === filterPenyulang;
      const matchUnit = filterUnit === 'ALL' || item.unit === filterUnit;
      const matchJenis =
        filterJenis === 'ALL' ||
        (filterJenis === 'PB' && item.jenisTransaksi.includes('PB')) ||
        (filterJenis === 'PD' && item.jenisTransaksi.includes('PD'));
      const matchStatus = filterStatus === 'ALL' || item.statusKelayakan === filterStatus;
      const matchFasa =
        filterFasa === 'ALL' ||
        (filterFasa === 'R' && item.fasaYangDiambil.includes('R') && !item.fasaYangDiambil.includes('R-S-T')) ||
        (filterFasa === 'S' && item.fasaYangDiambil.includes('S') && !item.fasaYangDiambil.includes('R-S-T')) ||
        (filterFasa === 'T' && item.fasaYangDiambil.includes('T') && !item.fasaYangDiambil.includes('R-S-T')) ||
        (filterFasa === '3F' && (item.fasaYangDiambil.includes('3 Fasa') || item.fasaYangDiambil.includes('RST') || item.fasaYangDiambil.includes('R-S-T')));

      return matchSearch && matchPenyulang && matchUnit && matchJenis && matchStatus && matchFasa;
    });
  }, [surveyList, searchQuery, filterPenyulang, filterUnit, filterJenis, filterStatus, filterFasa]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = filteredList.length;
    const pbCount = filteredList.filter(s => s.jenisTransaksi.includes('PB')).length;
    const pdCount = filteredList.filter(s => s.jenisTransaksi.includes('PD')).length;
    const layakCount = filteredList.filter(s => s.statusKelayakan === 'Layak Sambung').length;
    const sisipTiangCount = filteredList.filter(s => s.statusKelayakan === 'Perlu Sisip Tiang' || s.statusKelayakan === 'Perlu Perluasan JTR').length;
    const dropKritisCount = filteredList.filter(s => {
      const dropPct = ((s.tegPangkal - s.tegTetangga) / (s.tegPangkal || 220)) * 100;
      return dropPct >= 10 || s.statusKelayakan === 'Drop Tegangan (Tidak Layak)';
    }).length;
    const selesaiSambungCount = filteredList.filter(s => s.statusKelayakan === 'Selesai Penyambungan').length;

    return { total, pbCount, pdCount, layakCount, sisipTiangCount, dropKritisCount, selesaiSambungCount };
  }, [filteredList]);

  // Export CSV (Semua data yang terfilter)
  const handleExportCsv = () => {
    if (filteredList.length === 0) {
      alert('Tidak ada data survey untuk di-export.');
      return;
    }
    const headers = [
      'No',
      'No Agenda',
      'ID Pelanggan',
      'Nama Pelanggan',
      'No Kontak/WA',
      'Jenis Transaksi',
      'Peruntukan',
      'Tarif & Daya Lama',
      'Tarif & Daya Baru (VA)',
      'Penyulang 20kV',
      'No Gardu',
      'Jurusan Gardu',
      'Alamat Lokasi',
      'Latitude Bangunan',
      'Longitude Bangunan',
      'Titik Sambung (Tiang JTR)',
      'Latitude Titik Sambung',
      'Longitude Titik Sambung',
      'Panjang SR (m)',
      'Jenis Kabel SR',
      'Teg Pangkal Trafo (V)',
      'Teg Ujung Tetangga (V)',
      'Drop Tegangan (V)',
      'Drop Tegangan (%)',
      'Fasa yang Diambil',
      'Status Kelayakan',
      'Petugas Surveyor',
      'Tanggal Survey',
      'Tanggal Penyambungan',
      'Rekomendasi Teknis',
      'Catatan'
    ];

    const rows = filteredList.map((s, idx) => {
      const { dropVolt, dropPct } = getDropTegangan(s.tegPangkal, s.tegTetangga);
      return [
        idx + 1,
        `"${s.noAgenda || '-'}"`,
        `"${s.idPelanggan || '-'}"`,
        `"${s.namaPelanggan}"`,
        `"${s.noHpPelanggan || '-'}"`,
        `"${s.jenisTransaksi}"`,
        `"${s.peruntukan || 'Rumah Tangga'}"`,
        `"${s.tarifLama ? `${s.tarifLama} (${s.dayaLamaVa} VA)` : '-'}"`,
        `"${s.tarifBaru} (${s.dayaBaruVa} VA)"`,
        `"${s.penyulang}"`,
        `"${s.noGardu}"`,
        `"${s.jurusanGardu || '-'}"`,
        `"${s.lokasi.replace(/"/g, '""')}"`,
        s.lat ? s.lat.toFixed(6) : '-',
        s.lng ? s.lng.toFixed(6) : '-',
        `"${s.titikSambung.replace(/"/g, '""')}"`,
        s.titikSambungLat ? s.titikSambungLat.toFixed(6) : '-',
        s.titikSambungLng ? s.titikSambungLng.toFixed(6) : '-',
        s.panjangSrMeter || '-',
        `"${s.jenisKabelSr || '-'}"`,
        s.tegPangkal,
        s.tegTetangga,
        dropVolt,
        `${dropPct.toFixed(2)}%`,
        `"${s.fasaYangDiambil}"`,
        `"${s.statusKelayakan}"`,
        `"${s.petugasSurvey}"`,
        s.tanggalSurvey,
        s.tanggalPenyambungan || '-',
        `"${(s.rekomendasiTeknis || '').replace(/"/g, '""')}"`,
        `"${(s.catatan || '').replace(/"/g, '""')}"`
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Laporan_Survey_PB_PD_PLN_ULP_Baguala_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export Single Item CSV
  const handleExportSingleCsv = (item: SurveyPbPdItem) => {
    const { dropVolt, dropPct } = getDropTegangan(item.tegPangkal, item.tegTetangga);
    const headers = [
      'Parameter',
      'Nilai'
    ];
    const rows = [
      ['No Agenda / Registrasi', `"${item.noAgenda || '-'}"`],
      ['ID Pelanggan / No Meter', `"${item.idPelanggan || '-'}"`],
      ['Nama Pelanggan', `"${item.namaPelanggan}"`],
      ['Nomor HP / Kontak', `"${item.noHpPelanggan || '-'}"`],
      ['Jenis Transaksi', `"${item.jenisTransaksi}"`],
      ['Peruntukan', `"${item.peruntukan || 'Rumah Tangga'}"`],
      ['Tarif / Daya Lama', `"${item.tarifLama ? `${item.tarifLama} (${item.dayaLamaVa} VA)` : '-'}"`],
      ['Tarif / Daya Baru', `"${item.tarifBaru} (${item.dayaBaruVa} VA)"`],
      ['Penyulang Feeder 20kV', `"${item.penyulang}"`],
      ['Nomor Gardu Distribusi', `"${item.noGardu}"`],
      ['Jurusan Gardu', `"${item.jurusanGardu || '-'}"`],
      ['Alamat / Lokasi', `"${item.lokasi.replace(/"/g, '""')}"`],
      ['Koordinat Bangunan (Lat, Lng)', `"${item.lat ? `${item.lat.toFixed(6)}, ${item.lng?.toFixed(6)}` : '-'}"`],
      ['Titik Sambung (Tiang JTR)', `"${item.titikSambung.replace(/"/g, '""')}"`],
      ['Koordinat Titik Sambung (Lat, Lng)', `"${item.titikSambungLat ? `${item.titikSambungLat.toFixed(6)}, ${item.titikSambungLng?.toFixed(6)}` : '-'}"`],
      ['Panjang Saluran Rumah (SR)', `"${item.panjangSrMeter || 15} meter"`],
      ['Jenis Kabel SR', `"${item.jenisKabelSr || 'TIC 2x10mm²'}"`],
      ['Tegangan Pangkal Sumber (V)', item.tegPangkal],
      ['Tegangan Ujung Tetangga (V)', item.tegTetangga],
      ['Drop Tegangan (V)', dropVolt],
      ['Drop Tegangan (%)', `${dropPct.toFixed(2)}%`],
      ['Fasa yang Diambil', `"${item.fasaYangDiambil}"`],
      ['Status Kelayakan Teknis', `"${item.statusKelayakan}"`],
      ['Petugas Surveyor', `"${item.petugasSurvey}"`],
      ['Tanggal Survey', item.tanggalSurvey],
      ['Tanggal Rencana Penyambungan', item.tanggalPenyambungan || '-'],
      ['Rekomendasi Teknis Petugas', `"${(item.rekomendasiTeknis || '').replace(/"/g, '""')}"`],
      ['Catatan Tambahan', `"${(item.catatan || '').replace(/"/g, '""')}"`]
    ];

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Survey_${item.namaPelanggan.replace(/\s+/g, '_')}_${item.noGardu}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export Rekapitulasi PDF (Semua Data yang Terfilter - Landscape)
  const handleExportSummaryPDF = () => {
    if (filteredList.length === 0) {
      alert('Tidak ada data survey untuk di-export ke PDF.');
      return;
    }

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const currentDateStr = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    // 1. Header KOP Surat PLN
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, 297, 24, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('PT PLN (PERSERO) UIW MALUKU DAN MALUKU UTARA - UP3 AMBON', 14, 10);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('UNIT LAYANAN PELANGGAN (ULP) | SISTEM INFORMASI PERANG PADAM', 14, 16);
    doc.setFontSize(8);
    doc.text(`Dicetak pada: ${currentDateStr} | Total: ${filteredList.length} Permohonan`, 283, 16, { align: 'right' });

    // 2. Title Section
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('REKAPITULASI HASIL SURVEY KELAYAKAN TEKNIS PB / PD', 148.5, 32, { align: 'center' });

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    const filterDesc = [
      filterPenyulang !== 'ALL' ? `Penyulang: ${filterPenyulang}` : 'Semua Penyulang',
      filterJenis !== 'ALL' ? `Transaksi: ${filterJenis}` : 'Semua Transaksi',
      filterStatus !== 'ALL' ? `Status: ${filterStatus}` : 'Semua Status'
    ].join(' | ');
    doc.text(`Filter Data: ${filterDesc}`, 148.5, 37, { align: 'center' });

    // 3. Ringkasan Metrics Banner
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(14, 41, 269, 12, 2, 2, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(
      `Total: ${filteredList.length} | Layak Sambung: ${filteredList.filter(s => s.statusKelayakan === 'Layak Sambung').length} | Sisip Tiang/JTR: ${filteredList.filter(s => s.statusKelayakan === 'Perlu Sisip Tiang' || s.statusKelayakan === 'Perlu Perluasan JTR').length} | Drop Kritis: ${filteredList.filter(s => getDropTegangan(s.tegPangkal, s.tegTetangga).dropPct >= 10).length} | Pasang Baru: ${filteredList.filter(s => s.jenisTransaksi.includes('PB')).length} | Perubahan Daya: ${filteredList.filter(s => s.jenisTransaksi.includes('PD')).length}`,
      148.5,
      48.5,
      { align: 'center' }
    );

    // 4. Data Table
    const tableData = filteredList.map((item, idx) => {
      const { dropVolt, dropPct } = getDropTegangan(item.tegPangkal, item.tegTetangga);
      return [
        idx + 1,
        `${item.noAgenda || '-'}\n${item.idPelanggan || '-'}`,
        `${item.namaPelanggan}\n${item.lokasi}`,
        `${item.jenisTransaksi}\n${item.tarifBaru} (${item.dayaBaruVa}VA)`,
        `${item.penyulang}\nGardu ${item.noGardu}`,
        `${item.tegPangkal}V / ${item.tegTetangga}V\nΔV: ${dropVolt}V (${dropPct.toFixed(1)}%)`,
        item.fasaYangDiambil,
        `${item.titikSambung}\nSR: ${item.panjangSrMeter || 15}m`,
        item.statusKelayakan,
        `${item.petugasSurvey}\n${item.tanggalSurvey}`
      ];
    });

    autoTable(doc, {
      startY: 56,
      head: [
        [
          'No',
          'No Agenda / ID Pel',
          'Pelanggan & Lokasi',
          'Transaksi & Daya',
          'Penyulang / Gardu',
          'Tegangan & Drop',
          'Fasa',
          'Titik Sambung',
          'Status Kelayakan',
          'Surveyor & Tgl'
        ]
      ],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [14, 116, 144], // cyan-700
        textColor: 255,
        fontSize: 7.5,
        fontStyle: 'bold',
        halign: 'center',
        valign: 'middle'
      },
      styles: {
        fontSize: 7,
        cellPadding: 2,
        valign: 'middle',
        overflow: 'linebreak'
      },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        1: { cellWidth: 26 },
        2: { cellWidth: 44 },
        3: { cellWidth: 28 },
        4: { cellWidth: 26 },
        5: { cellWidth: 32, halign: 'center' },
        6: { cellWidth: 14, halign: 'center', fontStyle: 'bold' },
        7: { cellWidth: 36 },
        8: { cellWidth: 29, halign: 'center', fontStyle: 'bold' },
        9: { cellWidth: 26 }
      },
      didDrawPage: (data) => {
        // Footer page numbering
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184);
        doc.text(
          `Dokumen Resmi Sistem Perang Padam | Halaman ${data.pageNumber}`,
          148.5,
          202,
          { align: 'center' }
        );
      }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 8;
    const pageHeight = doc.internal.pageSize.height;

    // Check if enough space for signatures on current page, else add new page
    let signY = finalY;
    if (signY + 28 > pageHeight - 10) {
      doc.addPage();
      signY = 20;
    }

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text('Mengetahui / Menyetujui,', 40, signY);
    doc.text('Supervisor Transaksi Energi / TL Teknik,', 40, signY + 4);
    doc.text('UNIT LAYANAN PELANGGAN', 40, signY + 8);

    doc.text('Ambon, ' + currentDateStr, 220, signY);
    doc.text('Petugas Koordinator Survey Lapangan,', 220, signY + 4);
    doc.text('UNIT LAYANAN PELANGGAN', 220, signY + 8);

    doc.setFont('helvetica', 'bold');
    doc.text('Samuel Leimena', 40, signY + 24);
    doc.text('NIP. 8812345678', 40, signY + 28);

    doc.text(currentUser?.name || 'Tim Survey Teknik', 220, signY + 24);
    doc.text('Surveyor Teknik Lapangan', 220, signY + 28);

    doc.save(`Laporan_Rekap_Survey_PB_PD_PLN_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // Generate Berita Acara PDF
  const handleSaveSurvey = (updatedItem: SurveyPbPdItem) => {
    onUpdateSurvey(updatedItem);
  };

  const handleExportPDF = async (item: Partial<SurveyPbPdItem>) => {
    try {
      const activePrintArea = document.getElementById('live-paper-print-area');
      // If modal with Live Paper is open and matches this item
      if (activePrintArea && ((selectedDetail && selectedDetail.id === item.id) || (formData && formData.noAgenda === item.noAgenda))) {
        const sanitizeName = (item.namaPelanggan || 'Pelanggan').replace(/[^a-zA-Z0-9_-]/g, '_');
        const noAgenda = item.noAgenda || item.id || 'Draft';
        await exportElementToA4Pdf(activePrintArea, `Berita_Acara_Survey_PBPD_${sanitizeName}_${noAgenda}.pdf`, item);
      } else {
        await generateLivePaperPdf(item);
      }
    } catch (error) {
      console.error('Gagal mengekspor PDF Live Paper:', error);
      alert('Terjadi kendala saat membuat PDF. Silakan gunakan opsi Print BA untuk menyimpan sebagai PDF.');
    }
  };

  // WhatsApp Share Message Generator
  const handleShareWhatsapp = (item: Partial<SurveyPbPdItem>) => {
    const pangkal = Number(item.tegPangkal) || 0;
    const tetangga = Number(item.tegTetangga) || 0;
    const { dropVolt, dropPct } = getDropTegangan(pangkal, tetangga);
    const text = `⚡ *BERITA ACARA SURVEY KELAYAKAN TEKNIS PB/PD* ⚡
*PT PLN (PERSERO) ULP BAGUALA - UP3 AMBON*

📋 *1. Data Permohonan & Pelanggan:*
• *Jenis Transaksi:* ${item.jenisTransaksi || 'Pasang Baru (PB)'}
• *No Agenda:* ${item.noAgenda || '-'}
• *Nama Pelanggan:* ${item.namaPelanggan || '-'}
• *ID Pelanggan:* ${item.idPelanggan || '-'}
• *No Kontak/WA:* ${item.noHpPelanggan || '-'}
• *Peruntukan:* ${item.peruntukan || 'Rumah Tangga'}
• *Tarif & Daya Baru:* ${item.tarifBaru || 'R1/1300 VA'} (${item.dayaBaruVa || 1300} VA)
• *Alamat/Lokasi:* ${item.lokasi || '-'}
• *Koordinat:* ${item.lat && item.lng ? `${Number(item.lat).toFixed(6)}, ${Number(item.lng).toFixed(6)}` : '-'}

🔌 *2. Data Jaringan & Pengukuran Tegangan:*
• *Penyulang:* ${item.penyulang || 'PASSO'}
• *No Gardu:* ${item.noGardu || 'BG-01'} (${item.jurusanGardu || 'Jurusan 1'})
• *Fasa Diambil:* ${item.fasaYangDiambil || '1 Fasa (Fasa R)'}
• *Tegangan Pangkal (Trafo):* ${pangkal} V
• *Tegangan Ujung (SR/Tetangga):* ${tetangga} V
• *Drop Tegangan:* ${dropVolt} V (${dropPct.toFixed(2)}%)
• *Titik Sambung:* ${item.titikSambung || 'Tiang TR'}
• *Panjang SR:* ${item.panjangSrMeter || 15} Meter (${item.jenisKabelSr || 'TIC 2x10mm²'})

📊 *3. Kesimpulan & Rekomendasi Teknis:*
• *Status Kelayakan:* *${(item.statusKelayakan || 'Layak Sambung').toUpperCase()}*
• *Rekomendasi:* ${item.rekomendasiTeknis || 'Memenuhi syarat teknis penyambungan PLN.'}
• *Surveyor Lapangan:* ${item.petugasSurvey || '-'} (${item.tanggalSurvey || new Date().toISOString().split('T')[0]})
• *Supervisor/TL Teknik:* ${item.teamLeaderName || 'Samuel Leimena'}

_Dokumen Elektronik Sistem Perang Padam PLN_`;

    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header View */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-gradient-to-r from-[#022623] via-[#044c45] to-[#022e2a] p-6 rounded-2xl border-2 border-teal-500/60 shadow-xl relative overflow-hidden text-white">
        <div className="absolute right-0 top-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-1.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-xl shadow-inner">
              <Zap className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2 drop-shadow-xs">
                Survey Pasang Baru &amp; Perubahan Daya (PB/PD)
              </h1>
              <p className="text-xs sm:text-sm text-teal-100/90 max-w-2xl">
                Pencatatan survei kelayakan teknis jaringan TR, tegangan pangkal/tetangga, beban fasa, dan titik sambung pelanggan.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 relative z-10">
          {/* Unduh CSV */}
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-950/90 hover:bg-emerald-900 text-emerald-200 text-xs font-bold border border-emerald-500/50 shadow-md transition-all cursor-pointer active:scale-95"
            title="Unduh Seluruh Data Hasil Survey ke File CSV/Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Unduh CSV</span>
          </button>

          {/* Unduh Rekap PDF */}
          <button
            onClick={handleExportSummaryPDF}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#012521] hover:bg-[#02312b] text-teal-200 text-xs font-bold border border-teal-500/50 shadow-md transition-all cursor-pointer active:scale-95"
            title="Unduh Laporan Rekapitulasi Survey Resmi (Format PDF PLN Landscape)"
          >
            <FileText className="w-4 h-4 text-teal-300" />
            <span>Unduh Rekap PDF</span>
          </button>

          {canEdit && (
            <button
              onClick={isPemasaran ? handleOpenCreateWo : handleOpenCreate}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 text-xs font-black shadow-lg shadow-amber-500/30 transition-all cursor-pointer transform active:scale-95 border border-amber-300"
            >
              <Plus className="w-4 h-4 text-slate-950" />
              <span>{isPemasaran ? '+ Input WO Survey Baru' : '+ Input Survey Baru'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Banner khusus Bagian Pemasaran */}
      {isPemasaran && (
        <div className="p-4 bg-gradient-to-r from-amber-950/90 via-amber-900/50 to-[#022623] border border-amber-500/50 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 text-amber-200 shadow-xl">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-xl shrink-0 shadow-inner">
              <Zap className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-amber-300">
                  Formulir Input WO Survey Permohonan PB/PD (Bagian Pemasaran)
                </h3>
                <span className="px-2 py-0.5 rounded bg-amber-500/30 text-amber-200 text-[9px] font-black uppercase">
                  PEMASARAN
                </span>
              </div>
              <p className="text-xs text-amber-200/90 mt-1 leading-relaxed">
                Setiap permohonan Pasang Baru (PB) atau Perubahan Daya (PD) yang Anda input akan otomatis menjadi Work Order (WO) survey untuk diperiksa oleh petugas teknik & Transaksi Energi di lapangan.
              </p>
            </div>
          </div>
          <button
            onClick={handleOpenCreateWo}
            className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/30 cursor-pointer shrink-0 transition-all active:scale-95 border border-amber-200"
          >
            <Plus className="w-4 h-4 text-slate-950" />
            <span>+ Input WO Survey Baru</span>
          </button>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-[#022e2a]/90 border border-teal-500/40 p-4 rounded-xl shadow-md text-white backdrop-blur-xs">
          <div className="flex items-center justify-between text-teal-200 mb-1">
            <span className="text-xs font-bold text-white">Total Survey</span>
            <Activity className="w-4 h-4 text-teal-300" />
          </div>
          <p className="text-2xl font-black text-white">{metrics.total}</p>
          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-teal-200">
            <span className="text-amber-300 font-bold">{metrics.pbCount} PB</span>
            <span>•</span>
            <span className="text-cyan-300 font-bold">{metrics.pdCount} PD</span>
          </div>
        </div>

        <div className="bg-[#022e2a]/90 border border-teal-500/40 p-4 rounded-xl shadow-md text-white backdrop-blur-xs">
          <div className="flex items-center justify-between text-amber-300 mb-1">
            <span className="text-xs font-bold text-white">Pasang Baru (PB)</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-amber-300">{metrics.pbCount}</p>
          <p className="text-[11px] text-teal-100/80 mt-1">Permohonan Baru</p>
        </div>

        <div className="bg-[#022e2a]/90 border border-teal-500/40 p-4 rounded-xl shadow-md text-white backdrop-blur-xs">
          <div className="flex items-center justify-between text-cyan-300 mb-1">
            <span className="text-xs font-bold text-white">Perubahan Daya</span>
            <Sliders className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-black text-cyan-300">{metrics.pdCount}</p>
          <p className="text-[11px] text-teal-100/80 mt-1">Tambah/Turun Daya</p>
        </div>

        <div className="bg-[#022e2a]/90 border border-emerald-500/40 p-4 rounded-xl shadow-md text-white backdrop-blur-xs">
          <div className="flex items-center justify-between text-emerald-300 mb-1">
            <span className="text-xs font-bold text-white">Layak Sambung</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-300">{metrics.layakCount}</p>
          <p className="text-[11px] text-emerald-200 mt-1">Tegangan Memenuhi Syarat</p>
        </div>

        <div className="bg-[#022e2a]/90 border border-amber-500/40 p-4 rounded-xl shadow-md text-white backdrop-blur-xs">
          <div className="flex items-center justify-between text-amber-300 mb-1">
            <span className="text-xs font-bold text-white">Sisip Tiang / JTR</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-amber-300">{metrics.sisipTiangCount}</p>
          <p className="text-[11px] text-amber-200 mt-1">Perluasan JTR/Tiang</p>
        </div>

        <div className="bg-[#022e2a]/90 border border-rose-500/40 p-4 rounded-xl shadow-md text-white backdrop-blur-xs">
          <div className="flex items-center justify-between text-rose-300 mb-1">
            <span className="text-xs font-bold text-white">Drop Kritis / TL</span>
            <XCircle className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-2xl font-black text-rose-300">{metrics.dropKritisCount}</p>
          <p className="text-[11px] text-rose-200 mt-1">Drop &gt; 10% (Trafo Padat)</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-white/5 pb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setActiveTab('daftar')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer border flex items-center gap-2 ${
              activeTab === 'daftar'
                ? 'bg-amber-500 text-teal-950 border-amber-400 shadow-lg shadow-amber-500/20'
                : 'bg-[#023330] text-teal-300 border-teal-500/30 hover:bg-[#024440] hover:text-white'
            }`}
          >
            <span>📋</span>
            Data Hasil Survey ({filteredList.length})
          </button>
          <button
            onClick={() => setActiveTab('peta')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer border flex items-center gap-2 ${
              activeTab === 'peta'
                ? 'bg-amber-500 text-teal-950 border-amber-400 shadow-lg shadow-amber-500/20'
                : 'bg-[#023330] text-teal-300 border-teal-500/30 hover:bg-[#024440] hover:text-white'
            }`}
          >
            <Map className={`w-3.5 h-3.5 ${activeTab === 'peta' ? 'text-teal-900' : 'text-sky-400'}`} />
            <span>🗺️ Peta GIS Sebaran Survey ({filteredList.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('analisis')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer border flex items-center gap-2 ${
              activeTab === 'analisis'
                ? 'bg-amber-500 text-teal-950 border-amber-400 shadow-lg shadow-amber-500/20'
                : 'bg-[#023330] text-teal-300 border-teal-500/30 hover:bg-[#024440] hover:text-white'
            }`}
          >
            <span>📊</span>
            Analisis Beban & Drop Tegangan
          </button>
          <button
            onClick={() => setActiveTab('berita_acara')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer border flex items-center gap-2 ${
              activeTab === 'berita_acara'
                ? 'bg-amber-500 text-teal-950 border-amber-400 shadow-lg shadow-amber-500/20'
                : 'bg-[#023330] text-teal-300 border-teal-500/30 hover:bg-[#024440] hover:text-white'
            }`}
          >
            <span>📄</span>
            Cetak Berita Acara (BA)
          </button>
        </div>
      </div>

      {/* Tab Content: PETA GIS SEBARAN SURVEY */}
      {activeTab === 'peta' && (
        <SurveyPbPdMapTab
          surveyList={filteredList}
          penyulangList={penyulangList}
          onSelectDetail={setSelectedDetail}
          onExportPDF={handleExportPDF}
          onShareWA={handleShareWhatsapp}
        />
      )}

      {/* Tab Content: DAFTAR SURVEY */}
      {activeTab === 'daftar' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-gradient-to-r from-[#022623]/95 via-[#044c45]/95 to-[#022e2a]/95 border border-teal-500/30 p-4 rounded-xl shadow-lg backdrop-blur-md space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
              {/* Search Bar */}
              <div className="relative lg:col-span-2">
                <Search className="w-4 h-4 text-teal-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari nama pemohon, no agenda..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 bg-slate-950/40 border border-teal-500/30 rounded-xl text-xs text-white placeholder-teal-500/50 focus:outline-none focus:border-teal-400"
                />
              </div>

              {/* Filter ULP */}
              <div>
                <select
                  value={filterUnit}
                  onChange={e => setFilterUnit(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950/40 border border-teal-500/30 rounded-xl text-xs text-teal-100 focus:outline-none focus:border-teal-400 font-bold cursor-pointer"
                >
                  <option value="ALL">Semua ULP</option>
                  {DAFTAR_UNIT_PLN.map(u => (
                    <option key={u.kodeUnit} value={u.namaUnit}>
                      {u.namaUnit}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter Penyulang */}
              <div>
                <select
                  value={filterPenyulang}
                  onChange={e => setFilterPenyulang(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950/40 border border-teal-500/30 rounded-xl text-xs text-teal-100 focus:outline-none focus:border-teal-400 font-bold cursor-pointer"
                >
                  <option value="ALL">Semua Penyulang</option>
                  {penyulangList.map(p => (
                    <option key={p.id} value={p.namaPenyulang}>
                      {p.namaPenyulang}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter Jenis Transaksi */}
              <div>
                <select
                  value={filterJenis}
                  onChange={e => setFilterJenis(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-950/40 border border-teal-500/30 rounded-xl text-xs text-teal-100 focus:outline-none focus:border-teal-400 font-bold cursor-pointer"
                >
                  <option value="ALL">Semua Transaksi (PB & PD)</option>
                  <option value="PB">Pasang Baru (PB)</option>
                  <option value="PD">Perubahan Daya (PD)</option>
                </select>
              </div>

              {/* Filter Status Kelayakan */}
              <div>
                <select
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950/40 border border-teal-500/30 rounded-xl text-xs text-teal-100 focus:outline-none focus:border-teal-400 font-bold cursor-pointer"
                >
                  <option value="ALL">Semua Status Kelayakan</option>
                  <option value="Perlu Survey Lapangan">Perlu Survey Lapangan (WO Baru)</option>
                  <option value="Layak Sambung">Layak Sambung</option>
                  <option value="Perlu Sisip Tiang">Perlu Sisip Tiang</option>
                  <option value="Perlu Perluasan JTR">Perlu Perluasan JTR</option>
                  <option value="Drop Tegangan (Tidak Layak)">Drop Tegangan (&gt; 10%)</option>
                  <option value="Selesai Penyambungan">Selesai Penyambungan</option>
                </select>
              </div>
            </div>

            {/* Quick Fasa Chips & Export Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/60">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                  <Filter className="w-3 h-3 text-amber-400" />
                  Filter Fasa:
                </span>
                {[
                  { id: 'ALL', label: 'Semua Fasa' },
                  { id: 'R', label: 'Fasa R (Merah)', color: 'border-rose-500/40 text-rose-300' },
                  { id: 'S', label: 'Fasa S (Kuning)', color: 'border-amber-500/40 text-amber-300' },
                  { id: 'T', label: 'Fasa T (Biru)', color: 'border-sky-500/40 text-sky-300' },
                  { id: '3F', label: '3 Fasa (R-S-T)', color: 'border-purple-500/40 text-purple-300' }
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setFilterFasa(f.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      filterFasa === f.id
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-sm'
                        : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Quick Export Controls */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
                  Terpilih: <strong className="text-white">{filteredList.length}</strong> data
                </span>
                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/90 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/80 text-[11px] font-bold shadow-sm transition-all cursor-pointer"
                  title="Unduh data hasil filter dalam format CSV/Excel"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                  <span>CSV ({filteredList.length})</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportSummaryPDF}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-950/90 hover:bg-sky-900 text-sky-300 border border-sky-800/80 text-[11px] font-bold shadow-sm transition-all cursor-pointer"
                  title="Unduh laporan rekapitulasi data survey dalam format PDF Resmi PLN"
                >
                  <FileText className="w-3.5 h-3.5 text-sky-400" />
                  <span>PDF Rekap ({filteredList.length})</span>
                </button>
              </div>
            </div>
          </div>

          {/* Survey Table */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
            {isLoading ? (
              <TableSkeletonLoader columns={11} rows={8} headerTitle="Data Hasil Survey PB/PD" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3.5 px-3 w-10 text-center">No</th>
                    <th className="py-3.5 px-3 min-w-[140px]">Pelanggan & Agenda</th>
                    <th className="py-3.5 px-3 min-w-[120px]">Transaksi & Daya</th>
                    <th className="py-3.5 px-3 min-w-[130px]">Penyulang & Gardu</th>
                    <th className="py-3.5 px-3 min-w-[150px]">Lokasi & Titik Sambung</th>
                    <th className="py-3.5 px-3 min-w-[120px] text-center">Teg Pangkal / Ujung</th>
                    <th className="py-3.5 px-3 min-w-[110px] text-center">Fasa Diambil</th>
                    <th className="py-3.5 px-3 min-w-[120px] text-center">Kelayakan</th>
                    <th className="py-3.5 px-3 min-w-[100px]">Surveyor</th>
                    <th className="py-3.5 px-3 min-w-[100px]">Team Leader</th>
                    <th className="py-3.5 px-3 w-28 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredList.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-slate-500">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Zap className="w-8 h-8 text-slate-600" />
                          <p className="text-sm font-semibold">Tidak ada data survey yang cocok.</p>
                          <p className="text-xs text-slate-600">Silakan ubah filter atau tambahkan survey baru.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredList.map((item, idx) => {
                      const { dropVolt, dropPct } = getDropTegangan(item.tegPangkal, item.tegTetangga);

                      const isPb = item.jenisTransaksi.includes('PB');
                      const is3Fasa = item.fasaYangDiambil.includes('3 Fasa') || item.fasaYangDiambil.includes('R-S-T');
                      const isFasaR = item.fasaYangDiambil.includes('R') && !is3Fasa;
                      const isFasaS = item.fasaYangDiambil.includes('S') && !is3Fasa;
                      const isFasaT = item.fasaYangDiambil.includes('T') && !is3Fasa;

                      return (
                        <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                          {/* No */}
                          <td className="py-3 px-3 text-center text-slate-500 font-mono text-[11px]">
                            {idx + 1}
                          </td>

                          {/* Pelanggan */}
                          <td className="py-3 px-3">
                            <div className="font-bold text-white leading-snug">{item.namaPelanggan}</div>
                            <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                              <span>Agd: {item.noAgenda || '-'}</span>
                            </div>
                            {item.noHpPelanggan && (
                              <div className="text-[10px] text-emerald-400 flex items-center gap-1 mt-0.5">
                                <Phone className="w-2.5 h-2.5" />
                                <span>{item.noHpPelanggan}</span>
                              </div>
                            )}
                          </td>

                          {/* Transaksi & Daya */}
                          <td className="py-3 px-3">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[10px] font-extrabold mb-1 ${
                                isPb
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                  : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                              }`}
                            >
                              {item.jenisTransaksi}
                            </span>
                            <div className="font-semibold text-slate-200 text-[11px]">
                              {item.tarifBaru} ({item.dayaBaruVa} VA)
                            </div>
                            {item.tarifLama && (
                              <div className="text-[10px] text-slate-500 line-through">
                                Lama: {item.tarifLama} ({item.dayaLamaVa} VA)
                              </div>
                            )}
                          </td>

                          {/* Penyulang & Gardu */}
                          <td className="py-3 px-3">
                            <div className="font-bold text-indigo-300 flex items-center gap-1">
                              <Building className="w-3 h-3 text-indigo-400 shrink-0" />
                              <span>{item.penyulang}</span>
                            </div>
                            <div className="text-[11px] text-amber-300 font-bold mt-0.5 flex items-center gap-1">
                              <span>Gardu: {item.noGardu}</span>
                              {item.jurusanGardu && (
                                <span className="text-[9px] px-1 py-0.2 bg-slate-800 text-slate-300 rounded">
                                  {item.jurusanGardu}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Lokasi & Titik Sambung */}
                          <td className="py-3 px-3">
                            <div className="text-slate-300 line-clamp-1 flex items-start gap-1">
                              <MapPin className="w-3 h-3 text-rose-400 shrink-0 mt-0.5" />
                              <span title={item.lokasi}>{item.lokasi}</span>
                            </div>
                            <div className="text-[10px] text-amber-400/90 font-semibold mt-1 line-clamp-1">
                              ⚡ {item.titikSambung}
                            </div>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              {item.panjangSrMeter && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                                  SR: {item.panjangSrMeter}m
                                </span>
                              )}
                              {item.lat && item.lng && (
                                <button
                                  type="button"
                                  onClick={() => setActiveTab('peta')}
                                  className="text-[9px] px-1.5 py-0.2 rounded bg-sky-950 hover:bg-sky-900 text-sky-400 border border-sky-800/60 font-mono flex items-center gap-0.5 cursor-pointer"
                                  title="Lihat di Peta GIS"
                                >
                                  <Compass className="w-2.5 h-2.5" />
                                  <span>{item.lat.toFixed(4)}, {item.lng.toFixed(4)}</span>
                                </button>
                              )}
                            </div>

                            {/* Foto Thumbnail Badges */}
                            {((item.fotoBangunan || item.fotoLokasi) || item.fotoTitikSambung) && (
                              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                                {(item.fotoBangunan || item.fotoLokasi) && (
                                  <button
                                    type="button"
                                    onClick={() => setPreviewModalPhoto({
                                      url: (item.fotoBangunan || item.fotoLokasi)!,
                                      title: `Foto Bangunan - ${item.namaPelanggan}`,
                                      subtitle: `${item.lokasi} (Koordinat: ${item.lat?.toFixed(6) || '-'}, ${item.lng?.toFixed(6) || '-'})`
                                    })}
                                    className="text-[9px] px-1.5 py-0.5 rounded bg-sky-950/90 hover:bg-sky-900 text-sky-300 border border-sky-800 font-semibold flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
                                    title="Lihat Foto Bangunan"
                                  >
                                    <Camera className="w-2.5 h-2.5 text-sky-400" />
                                    <span>Foto Bangunan</span>
                                  </button>
                                )}
                                {item.fotoTitikSambung && (
                                  <button
                                    type="button"
                                    onClick={() => setPreviewModalPhoto({
                                      url: item.fotoTitikSambung!,
                                      title: `Foto Titik Sambung - ${item.titikSambung}`,
                                      subtitle: `Gardu ${item.noGardu} (Koordinat: ${item.titikSambungLat?.toFixed(6) || '-'}, ${item.titikSambungLng?.toFixed(6) || '-'})`
                                    })}
                                    className="text-[9px] px-1.5 py-0.5 rounded bg-amber-950/90 hover:bg-amber-900 text-amber-300 border border-amber-800 font-semibold flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
                                    title="Lihat Foto Titik Sambung"
                                  >
                                    <Zap className="w-2.5 h-2.5 text-amber-400" />
                                    <span>Foto Titik Sambung</span>
                                  </button>
                                )}
                              </div>
                            )}
                          </td>

                          {/* Tegangan Pangkal & Ujung */}
                          <td className="py-3 px-3 text-center">
                            <div className="flex items-center justify-center gap-1 font-mono font-bold">
                              <span className="text-emerald-400">{item.tegPangkal}V</span>
                              <span className="text-slate-600">→</span>
                              <span
                                className={`${
                                  item.tegTetangga < 200
                                    ? 'text-rose-400'
                                    : item.tegTetangga < 210
                                    ? 'text-amber-400'
                                    : 'text-sky-400'
                                }`}
                              >
                                {item.tegTetangga}V
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              ΔV: <span className="font-semibold text-white">{dropVolt}V</span> ({dropPct.toFixed(1)}%)
                            </div>
                          </td>

                          {/* Fasa */}
                          <td className="py-3 px-3 text-center">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black border ${
                                is3Fasa
                                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                                  : isFasaR
                                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                  : isFasaS
                                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                  : 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                              }`}
                            >
                              {item.fasaYangDiambil}
                            </span>
                          </td>

                          {/* Kelayakan */}
                          <td className="py-3 px-3 text-center">
                            <span
                              className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-bold border ${
                                item.statusKelayakan === 'Perlu Survey Lapangan' || item.statusKelayakan === 'WO Survey Diterbitkan'
                                  ? 'bg-amber-500/25 text-amber-300 border-amber-500/60 shadow-sm animate-pulse font-extrabold'
                                  : item.statusKelayakan === 'Layak Sambung'
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                  : item.statusKelayakan === 'Selesai Penyambungan'
                                  ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                                  : item.statusKelayakan === 'Drop Tegangan (Tidak Layak)'
                                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              }`}
                            >
                              {item.statusKelayakan}
                            </span>
                          </td>

                          {/* Surveyor */}
                          <td className="py-3 px-3">
                            <div className="text-[11px] font-semibold text-slate-300">{item.petugasSurvey}</div>
                            <div className="text-[10px] text-slate-500">{item.tanggalSurvey}</div>
                          </td>
                          <td className="py-3 px-3">
                            <div className="text-[11px] font-semibold text-slate-300">{item.teamLeaderName || '-'}</div>
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {/* Detail Modal */}
                              <button
                                onClick={() => setSelectedDetail(item)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
                                title="Lihat Detail Survey"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              {/* WhatsApp Share */}
                              <button
                                onClick={() => handleShareWhatsapp(item)}
                                className="p-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900/90 text-emerald-400 border border-emerald-800/50 transition-all cursor-pointer"
                                title="Share WhatsApp Hasil Survey"
                              >
                                <Share2 className="w-3.5 h-3.5" />
                              </button>

                              {/* Cetak BA PDF */}
                              <button
                                onClick={() => handleExportPDF(item)}
                                className="p-1.5 rounded-lg bg-indigo-950/80 hover:bg-indigo-900/90 text-indigo-400 border border-indigo-800/50 transition-all cursor-pointer"
                                title="Cetak Berita Acara PDF"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>

                              {/* Unduh Data CSV Baris */}
                              <button
                                onClick={() => handleExportSingleCsv(item)}
                                className="p-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900/90 text-emerald-400 border border-emerald-800/50 transition-all cursor-pointer"
                                title="Unduh Data Pelanggan Ini ke CSV"
                              >
                                <FileSpreadsheet className="w-3.5 h-3.5" />
                              </button>

                              {canEdit && (item.statusKelayakan === 'Perlu Survey Lapangan' || item.statusKelayakan === 'WO Survey Diterbitkan') && (
                                <button
                                  onClick={() => handleOpenEdit(item)}
                                  className="px-2 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[10px] flex items-center gap-1 cursor-pointer transition-all shadow-md active:scale-95 shrink-0"
                                  title="Input Hasil Survey Lapangan & Pengukuran Tegangan"
                                >
                                  <Zap className="w-3 h-3 text-slate-950" />
                                  <span>Input Hasil Survey</span>
                                </button>
                              )}

                              {canEdit && (
                                <>
                                  <button
                                    onClick={() => handleOpenEdit(item)}
                                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 transition-all cursor-pointer"
                                    title="Edit Survey"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (confirm(`Yakin ingin menghapus survey pelanggan ${item.namaPelanggan}?`)) {
                                        onDeleteSurvey(item.id);
                                      }
                                    }}
                                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/40 text-rose-400 transition-all cursor-pointer"
                                    title="Hapus Survey"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            )}
          </div>
        </div>
      )}

      {/* Tab Content: ANALISIS BEBAN & DROP TEGANGAN */}
      {activeTab === 'analisis' && (
        <div className="animate-fade-in space-y-6">
          {/* Main Hero Card for Analysis */}
          <div className="p-6 bg-gradient-to-br from-[#023330] to-[#011a18] rounded-3xl border border-teal-500/30 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Activity className="w-32 h-32 text-teal-400" />
            </div>
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                  <div className="p-2 bg-amber-500/20 rounded-xl">
                    <Activity className="w-6 h-6 text-amber-400" />
                  </div>
                  Data Hasil Survey & Analisis Beban BA
                </h2>
                <p className="text-sm text-teal-200/80 max-w-xl">
                  Visualisasi distribusi beban fasa dan analisis kualitas tegangan (drop voltage) dari seluruh data survey lapangan yang telah terkumpul.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md">
                  <div className="text-[10px] font-black text-teal-400 uppercase tracking-widest mb-1">Total Titik Survey</div>
                  <div className="text-3xl font-black text-white">{filteredList.length}</div>
                </div>
                <div className="p-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md">
                  <div className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Status Kelayakan</div>
                  <div className="text-3xl font-black text-emerald-400">{((metrics.layakCount / (metrics.total || 1)) * 100).toFixed(0)}%</div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Keseimbangan Beban Fasa Survey */}
            <div className="bg-[#022e2a]/80 backdrop-blur-xl border-2 border-teal-500/20 p-6 rounded-3xl shadow-2xl space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-white flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-rose-500/20 flex items-center justify-center border border-rose-500/30">
                    <Activity className="w-4 h-4 text-rose-400" />
                  </div>
                  Keseimbangan Beban Fasa
                </h3>
              </div>
              
              <div className="space-y-5">
                {[
                  {
                    fasa: 'Fasa R (Merah)',
                    count: filteredList.filter(s => s.fasaYangDiambil.includes('R') && !s.fasaYangDiambil.includes('3 Fasa')).length,
                    color: 'bg-rose-500',
                    border: 'border-rose-500/40',
                    text: 'text-rose-400',
                    glow: 'shadow-rose-500/20'
                  },
                  {
                    fasa: 'Fasa S (Kuning)',
                    count: filteredList.filter(s => s.fasaYangDiambil.includes('S') && !s.fasaYangDiambil.includes('3 Fasa')).length,
                    color: 'bg-amber-500',
                    border: 'border-amber-500/40',
                    text: 'text-amber-400',
                    glow: 'shadow-amber-500/20'
                  },
                  {
                    fasa: 'Fasa T (Biru)',
                    count: filteredList.filter(s => s.fasaYangDiambil.includes('T') && !s.fasaYangDiambil.includes('3 Fasa')).length,
                    color: 'bg-sky-500',
                    border: 'border-sky-500/40',
                    text: 'text-sky-400',
                    glow: 'shadow-sky-500/20'
                  },
                  {
                    fasa: '3 Fasa (R-S-T)',
                    count: filteredList.filter(s => s.fasaYangDiambil.includes('3 Fasa') || s.fasaYangDiambil.includes('RST')).length,
                    color: 'bg-indigo-500',
                    border: 'border-indigo-500/40',
                    text: 'text-indigo-400',
                    glow: 'shadow-indigo-500/20'
                  }
                ].map(item => {
                  const pct = filteredList.length > 0 ? (item.count / filteredList.length) * 100 : 0;
                  return (
                    <div key={item.fasa} className="space-y-2 group">
                      <div className="flex justify-between text-xs font-black">
                        <span className={`${item.text} tracking-wide`}>{item.fasa}</span>
                        <span className="text-white bg-slate-800/80 px-2 py-0.5 rounded-lg border border-white/5">{item.count} Sambungan ({pct.toFixed(0)}%)</span>
                      </div>
                      <div className="w-full bg-black/40 h-3 rounded-full overflow-hidden border border-white/5 p-0.5 shadow-inner">
                        <div 
                          className={`h-full ${item.color} ${item.glow} rounded-full transition-all duration-700 shadow-lg`} 
                          style={{ width: `${pct}%` }} 
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                <p className="text-[11px] text-amber-200/90 leading-relaxed font-semibold">
                  <span className="text-amber-400 font-black mr-1">Rekomendasi:</span> 
                  Prioritaskan pengalokasian fasa dengan beban persentase terendah untuk menjaga keseimbangan beban trafo.
                </p>
              </div>
            </div>

            {/* Analisis Kualitas Tegangan (Drop Voltage) */}
            <div className="bg-[#022e2a]/80 backdrop-blur-xl border-2 border-teal-500/20 p-6 rounded-3xl shadow-2xl space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-white flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                    <TrendingDown className="w-4 h-4 text-emerald-400" />
                  </div>
                  Kualitas Tegangan Pelayanan
                </h3>
              </div>

              <div className="space-y-4">
                {[
                  {
                    label: 'Sangat Baik (Drop < 5%)',
                    count: filteredList.filter(s => ((s.tegPangkal - s.tegTetangga) / (s.tegPangkal || 220)) * 100 < 5).length,
                    badge: 'bg-emerald-500 text-emerald-950',
                    text: 'text-emerald-400'
                  },
                  {
                    label: 'Waspada (Drop 5% - 9.9%)',
                    count: filteredList.filter(s => {
                      const p = ((s.tegPangkal - s.tegTetangga) / (s.tegPangkal || 220)) * 100;
                      return p >= 5 && p < 10;
                    }).length,
                    badge: 'bg-amber-500 text-amber-950',
                    text: 'text-amber-400'
                  },
                  {
                    label: 'Kritis / Tidak Layak (Drop ≥ 10%)',
                    count: filteredList.filter(s => ((s.tegPangkal - s.tegTetangga) / (s.tegPangkal || 220)) * 100 >= 10).length,
                    badge: 'bg-rose-500 text-rose-950',
                    text: 'text-rose-400'
                  }
                ].map(stat => (
                  <div key={stat.label} className="flex items-center justify-between p-4 bg-black/40 rounded-2xl border border-white/5 group hover:border-white/10 transition-all">
                    <span className="text-xs font-bold text-slate-300">{stat.label}</span>
                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] font-black px-3 py-1 rounded-full ${stat.badge} shadow-lg`}>
                        {stat.count} Titik
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl space-y-2">
                <div className="text-[11px] text-indigo-300 font-black flex items-center gap-1.5 uppercase tracking-wider">
                  <Info className="w-3.5 h-3.5" />
                  Standar SPLN D3.002-1:2007
                </div>
                <p className="text-[11px] text-indigo-200/90 leading-relaxed font-semibold">
                  Variasi tegangan pelayanan TR diperbolehkan maksimal +5% dan -10% dari tegangan nominal 220V (198V - 231V).
                </p>
              </div>
            </div>

            {/* Rekap Status Konstruksi */}
            <div className="bg-[#022e2a]/80 backdrop-blur-xl border-2 border-teal-500/20 p-6 rounded-3xl shadow-2xl space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-white flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center border border-cyan-500/30">
                    <Building className="w-4 h-4 text-cyan-400" />
                  </div>
                  Tindak Lanjut Infrastruktur
                </h3>
              </div>
              
              <div className="space-y-2">
                {[
                  { title: 'Layak Sambung Langsung', count: metrics.layakCount, color: 'text-emerald-400', bg: 'bg-emerald-400/5' },
                  { title: 'Sisip Tiang JTR', count: filteredList.filter(s => s.statusKelayakan === 'Perlu Sisip Tiang').length, color: 'text-amber-400', bg: 'bg-amber-400/5' },
                  { title: 'Perluasan Jaringan JTR', count: filteredList.filter(s => s.statusKelayakan === 'Perlu Perluasan JTR').length, color: 'text-indigo-400', bg: 'bg-indigo-400/5' },
                  { title: 'Uprating / Sisip Trafo', count: filteredList.filter(s => s.statusKelayakan === 'Perlu Up-rating Trafo').length, color: 'text-rose-400', bg: 'bg-rose-400/5' },
                  { title: 'Penyambungan Selesai', count: metrics.selesaiSambungCount, color: 'text-sky-400', bg: 'bg-sky-400/5' }
                ].map(k => (
                  <div key={k.title} className={`flex justify-between items-center p-3.5 ${k.bg} rounded-xl border border-white/5`}>
                    <span className="text-xs font-bold text-slate-300">{k.title}</span>
                    <span className={`text-sm font-black font-mono ${k.color}`}>{k.count}</span>
                  </div>
                ))}
              </div>

              <div className="mt-4 p-4 bg-teal-500/5 border border-teal-500/10 rounded-2xl text-center">
                <p className="text-[10px] text-teal-400 font-bold italic">
                  Data diperbarui secara real-time berdasarkan akumulasi input petugas survey di lapangan.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content: BERITA ACARA */}
      {activeTab === 'berita_acara' && (
        <div className="space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-lg">
            <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-400" />
              Pusat Cetak Berita Acara (BA) Survey Teknis
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Pilih permohonan survey pelanggan di bawah ini untuk melihat pratinjau dan mengunduh Berita Acara Survey Resmi (Format PDF PLN).
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {surveyList.map(item => (
                <div
                  key={item.id}
                  className="p-4 bg-slate-950 border border-slate-800 hover:border-emerald-500/50 rounded-xl transition-all flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono font-bold">
                        {item.noAgenda || item.id}
                      </span>
                      <span
                        className={`text-[9px] px-2 py-0.5 rounded font-extrabold ${
                          item.jenisTransaksi.includes('PB')
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                        }`}
                      >
                        {item.jenisTransaksi}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-white mt-2">{item.namaPelanggan}</h4>
                    <p className="text-xs text-slate-400">{item.lokasi}</p>
                    <div className="mt-2 text-[11px] text-indigo-300 font-semibold">
                      {item.penyulang} • Gardu {item.noGardu} • {item.tarifBaru} ({item.dayaBaruVa}VA)
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                    <button
                      onClick={() => setSelectedDetail(item)}
                      className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-lg text-xs font-bold transition-all cursor-pointer"
                      title="Buka Live Paper SPK"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Lihat Live Paper</span>
                    </button>
                    <button
                      onClick={() => handleExportPDF(item)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-sm transition-all cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Unduh PDF</span>
                    </button>
                    <button
                      onClick={() => handleShareWhatsapp(item)}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-lg text-xs transition-all cursor-pointer"
                      title="Share WA"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* DETAIL MODAL (LIVE PAPER SPK STYLE) */}
      {selectedDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white text-slate-900 rounded-2xl max-w-4xl w-full max-h-[94vh] flex flex-col shadow-2xl relative overflow-hidden print:p-0 print:shadow-none print:max-w-none">
            <div className="flex-1 overflow-y-auto bg-white">
              <LivePaperPbPdDocument
                data={selectedDetail}
                onPrint={() => window.print()}
                onDownloadPdf={() => handleExportPDF(selectedDetail)}
                onShareWhatsapp={() => handleShareWhatsapp(selectedDetail)}
                onClose={() => setSelectedDetail(null)}
                showHeaderActions={true}
                isInteractiveApproval={true}
                currentUserRole={currentUser?.role}
                currentUserName={currentUser?.name}
                onApprove={(tlName, signatureUrl) => {
                  handleSaveSurvey({
                    ...selectedDetail,
                    isApproved: true,
                    teamLeaderName: tlName,
                    tandaTanganTlTeknik: signatureUrl || selectedDetail.tandaTanganTlTeknik
                  });
                  setSelectedDetail(null);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT SURVEY MODAL (SPLIT-SCREEN WITH REAL-TIME LIVE PAPER SPK) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-7xl w-full max-h-[95vh] flex flex-col shadow-2xl overflow-hidden">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 px-5 py-3.5 bg-slate-950/80 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl shadow-inner">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>{editingItem ? 'Edit Formulir & Live Paper Survey PB/PD' : 'Input Formulir & Live Paper Survey Kelayakan PB/PD'}</span>
                    <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                      Live Sync Aktif
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Input data di panel kiri, Live Paper SPK resmi PLN akan ter-update otomatis secara langsung di panel kanan.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Mobile / Tablet Tab Toggle */}
                <div className="flex lg:hidden bg-slate-800 p-1 rounded-xl border border-slate-700">
                  <button
                    type="button"
                    onClick={() => setFormModalTab('form')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                      formModalTab === 'form' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    Formulir
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormModalTab('paper')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                      formModalTab === 'paper' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    Live Paper (SPK)
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
                  title="Tutup Modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body - 2 Columns on Desktop */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 bg-slate-950/50">
              
              {/* LEFT COLUMN: FORM INPUT */}
              <div className={`space-y-4 ${formModalTab === 'paper' ? 'hidden lg:block' : 'block'}`}>
                <form onSubmit={handleSaveForm} className="space-y-4 text-xs">
                  {isInspeksi && (
                    <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl text-blue-300 text-xs font-semibold flex items-center gap-2">
                      <Info className="w-4 h-4 shrink-0 text-blue-400" />
                      <span>Data Pelanggan & Permohonan di bawah diisi oleh Bagian Pemasaran. Silakan lengkapi <strong>Parameter & Pengukuran Lapangan</strong> dan seterusnya.</span>
                    </div>
                  )}

                  {/* Section 1: Data Pelanggan & Permohonan */}
                  <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-3 shadow-inner">
                    <h4 className="font-bold text-amber-400 uppercase text-[11px] tracking-wider flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5" />
                      1. Data Pelanggan & Permohonan {isPemasaran && <span className="text-amber-300 font-normal">(Menu Input Utama Pemasaran)</span>} {isInspeksi && <span className="text-slate-400 font-normal">(Diisi Pemasaran)</span>}
                    </h4>
                    {isPemasaran && (
                      <p className="text-[11px] text-slate-400 bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-lg">
                        Sesuai prosedur, Bagian Pemasaran cukup menginput data pelanggan & permohonan di atas. Parameter teknis, pengukuran, dan rekomendasi lapangan selanjutnya akan dilengkapi oleh Tim Inspeksi/Teknik.
                      </p>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-slate-400 font-semibold mb-1">Jenis Transaksi *</label>
                        <select
                          disabled={isInspeksi}
                          value={formData.jenisTransaksi}
                          onChange={e => setFormData({ ...formData, jenisTransaksi: e.target.value as any })}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold focus:outline-none focus:border-amber-500 disabled:opacity-60"
                        >
                          <option value="Pasang Baru (PB)">Pasang Baru (PB)</option>
                          <option value="Perubahan Daya (PD)">Perubahan Daya (PD)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-slate-400 font-semibold mb-1">Nama Pelanggan / Pemohon *</label>
                        <input
                          type="text"
                          required
                          disabled={isInspeksi}
                          placeholder="Contoh: Bpk. Marthen Silooy"
                          value={formData.namaPelanggan || ''}
                          onChange={e => setFormData({ ...formData, namaPelanggan: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500 disabled:opacity-60"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 font-semibold mb-1">No. Agenda / Registrasi</label>
                        <input
                          type="text"
                          disabled={isInspeksi}
                          placeholder="54260..."
                          value={formData.noAgenda || ''}
                          onChange={e => setFormData({ ...formData, noAgenda: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:border-amber-500 disabled:opacity-60"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 font-semibold mb-1">ID Pelanggan (Khusus PD)</label>
                        <input
                          type="text"
                          disabled={isInspeksi}
                          placeholder="542600..."
                          value={formData.idPelanggan || ''}
                          onChange={e => setFormData({ ...formData, idPelanggan: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:border-amber-500 disabled:opacity-60"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 font-semibold mb-1">No. Kontak / WA Pelanggan</label>
                        <input
                          type="text"
                          disabled={isInspeksi}
                          placeholder="0812..."
                          value={formData.noHpPelanggan || ''}
                          onChange={e => setFormData({ ...formData, noHpPelanggan: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500 disabled:opacity-60"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 font-semibold mb-1">Peruntukan Bangunan</label>
                        <select
                          disabled={isInspeksi}
                          value={formData.peruntukan || 'Rumah Tangga'}
                          onChange={e => setFormData({ ...formData, peruntukan: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500 disabled:opacity-60"
                        >
                          <option value="Rumah Tangga">Rumah Tangga</option>
                          <option value="Bisnis / Ruko">Bisnis / Ruko</option>
                          <option value="Industri">Industri</option>
                          <option value="Sosial / Rumah Ibadah">Sosial / Rumah Ibadah</option>
                          <option value="Pemerintah / Fasilitas Umum">Pemerintah / Fasilitas Umum</option>
                        </select>
                      </div>
                    </div>

                    {/* Tarif & Daya */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-800/60">
                      {formData.jenisTransaksi === 'Perubahan Daya (PD)' && (
                        <>
                          <div>
                            <label className="block text-slate-400 font-semibold mb-1">Tarif Lama</label>
                            <input
                              type="text"
                              disabled={isInspeksi}
                              placeholder="R1 / B1"
                              value={formData.tarifLama || ''}
                              onChange={e => setFormData({ ...formData, tarifLama: e.target.value })}
                              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500 disabled:opacity-60"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-400 font-semibold mb-1">Daya Lama (VA)</label>
                            <input
                              type="number"
                              disabled={isInspeksi}
                              placeholder="450 / 900 / 1300"
                              value={formData.dayaLamaVa || ''}
                              onChange={e => setFormData({ ...formData, dayaLamaVa: Number(e.target.value) })}
                              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500 disabled:opacity-60"
                            />
                          </div>
                        </>
                      )}
                      <div>
                        <label className="block text-slate-400 font-semibold mb-1">Tarif Baru Dimohon *</label>
                        <input
                          type="text"
                          required
                          disabled={isInspeksi}
                          placeholder="R1 / R1M / B1 / S2"
                          value={formData.tarifBaru || ''}
                          onChange={e => setFormData({ ...formData, tarifBaru: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold focus:outline-none focus:border-amber-500 disabled:opacity-60"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 font-semibold mb-1">Daya Baru (VA) *</label>
                        <select
                          disabled={isInspeksi}
                          value={formData.dayaBaruVa || 1300}
                          onChange={e => setFormData({ ...formData, dayaBaruVa: Number(e.target.value) })}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold focus:outline-none focus:border-amber-500 disabled:opacity-60"
                        >
                          {[450, 900, 1300, 2200, 3500, 4400, 5500, 7700, 11000, 13200, 16500, 23000, 33000, 41500, 53000, 66000].map(
                            d => (
                              <option key={d} value={d}>
                                {d} VA
                              </option>
                            )
                          )}
                        </select>
                      </div>
                    </div>
                  </div>

                  {!isPemasaran && (
                    <>
                      {/* Section 2: Data Jaringan & Kelistrikan (Wajib Sesuai Permintaan User) */}
                      <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-3 shadow-inner">
                        <h4 className="font-bold text-cyan-400 uppercase text-[11px] tracking-wider flex items-center gap-1.5">
                          <Activity className="w-3.5 h-3.5" />
                          2. Parameter Jaringan & Pengukuran Lapangan (Wajib)
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-slate-400 font-semibold mb-1">Penyulang (Feeder) *</label>
                            <select
                              value={formData.penyulang}
                              onChange={e => setFormData({ ...formData, penyulang: e.target.value })}
                              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold focus:outline-none focus:border-cyan-500"
                            >
                              {penyulangList.map(p => (
                                <option key={p.id} value={p.namaPenyulang}>
                                  {p.namaPenyulang} ({p.namaGi})
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-slate-400 font-semibold mb-1">Nomor Gardu (GTT) *</label>
                            <input
                              type="text"
                              required
                              placeholder="Contoh: BG-04 / BG-18 / GTT-TLH-01"
                              value={formData.noGardu || ''}
                              onChange={e => setFormData({ ...formData, noGardu: e.target.value })}
                              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold focus:outline-none focus:border-cyan-500"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-400 font-semibold mb-1">Jurusan Gardu</label>
                            <select
                              value={formData.jurusanGardu || 'Jurusan 1'}
                              onChange={e => setFormData({ ...formData, jurusanGardu: e.target.value })}
                              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                            >
                              <option value="Jurusan 1">Jurusan 1</option>
                              <option value="Jurusan 2">Jurusan 2</option>
                              <option value="Jurusan 3">Jurusan 3</option>
                              <option value="Jurusan 4">Jurusan 4</option>
                              <option value="Jurusan A">Jurusan A</option>
                              <option value="Jurusan B">Jurusan B</option>
                            </select>
                          </div>
                        </div>

                        {/* Lokasi Alamat */}
                        <div>
                          <label className="block text-slate-400 font-semibold mb-1">Lokasi / Alamat Pelanggan *</label>
                          <input
                            type="text"
                            required
                            placeholder="Contoh: Jl. Wolter Monginsidi RT 03 / RW 02 Passo (Depan Kantor Camat)"
                            value={formData.lokasi || ''}
                            onChange={e => setFormData({ ...formData, lokasi: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                          />
                        </div>

                        {/* Tegangan Pangkal & Tegangan Tetangga & Drop Tegangan */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-950 rounded-xl border border-slate-800">
                          <div>
                            <label className="block text-emerald-400 font-semibold mb-1">Tegangan Pangkal (V) *</label>
                            <input
                              type="number"
                              required
                              min={100}
                              max={260}
                              placeholder="230"
                              value={formData.tegPangkal || ''}
                              onChange={e => setFormData({ ...formData, tegPangkal: Number(e.target.value) })}
                              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-emerald-400 font-mono font-bold text-sm focus:outline-none focus:border-emerald-500"
                            />
                            <span className="text-[10px] text-slate-500">Tegangan di trafo/tiang awal</span>
                          </div>
                          <div>
                            <label className="block text-sky-400 font-semibold mb-1">Tegangan Tetangga (V) *</label>
                            <input
                              type="number"
                              required
                              min={100}
                              max={260}
                              placeholder="219"
                              value={formData.tegTetangga || ''}
                              onChange={e => setFormData({ ...formData, tegTetangga: Number(e.target.value) })}
                              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sky-400 font-mono font-bold text-sm focus:outline-none focus:border-sky-500"
                            />
                            <span className="text-[10px] text-slate-500">Tegangan di tetangga terdekat</span>
                          </div>
                          <div>
                            <label className="block text-slate-400 font-semibold mb-1">Kalkulasi Drop Tegangan</label>
                            {(() => {
                              const { dropVolt, dropPct, status } = getDropTegangan(formData.tegPangkal, formData.tegTetangga);
                              const isDanger = dropPct >= 10;
                              return (
                                <div
                                  className={`p-2 rounded-xl border font-mono ${
                                    isDanger
                                      ? 'bg-rose-950/40 border-rose-800/60 text-rose-300'
                                      : dropPct >= 5
                                      ? 'bg-amber-950/40 border-amber-800/60 text-amber-300'
                                      : 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                                  }`}
                                >
                                  <div className="font-bold text-sm">
                                    ΔV: {dropVolt} V ({dropPct.toFixed(1)}%)
                                  </div>
                                  <div className="text-[10px] font-sans font-semibold">{status}</div>
                                </div>
                              );
                            })()}
                          </div>
                        </div>

                        {/* Fasa yang Diambil & Titik Sambung */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-slate-400 font-semibold mb-1">Fasa yang Diambil *</label>
                            <select
                              value={formData.fasaYangDiambil}
                              onChange={e => setFormData({ ...formData, fasaYangDiambil: e.target.value })}
                              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold focus:outline-none focus:border-cyan-500"
                            >
                              <option value="1 Fasa (Fasa R)">1 Fasa (Fasa R - Kabel Merah)</option>
                              <option value="1 Fasa (Fasa S)">1 Fasa (Fasa S - Kabel Kuning)</option>
                              <option value="1 Fasa (Fasa T)">1 Fasa (Fasa T - Kabel Biru)</option>
                              <option value="3 Fasa (R-S-T)">3 Fasa (R-S-T / 380 Volt)</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-slate-400 font-semibold mb-1">Titik Sambung *</label>
                            <input
                              type="text"
                              required
                              placeholder="Contoh: Tiang TR No. 04 Jurusan 2 Gardu BG-04"
                              value={formData.titikSambung || ''}
                              onChange={e => setFormData({ ...formData, titikSambung: e.target.value })}
                              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                            />
                          </div>
                        </div>

                        {/* Interactive Map Picker for Bangunan & Titik Sambung */}
                        <div className="pt-1">
                          <SurveyMapPicker
                            bangunanLat={formData.lat}
                            bangunanLng={formData.lng}
                            titikSambungLat={formData.titikSambungLat}
                            titikSambungLng={formData.titikSambungLng}
                            fotoBangunan={formData.fotoBangunan || formData.fotoLokasi}
                            fotoTitikSambung={formData.fotoTitikSambung}
                            namaPelanggan={formData.namaPelanggan || 'Bangunan Pelanggan'}
                            titikSambungNama={formData.titikSambung || 'Tiang JTR'}
                            penyulang={formData.penyulang}
                            noGardu={formData.noGardu}
                            onChangeCoordinates={({ lat, lng, titikSambungLat, titikSambungLng, distanceMeter }) => {
                              setFormData(prev => ({
                                ...prev,
                                lat: lat !== undefined ? lat : prev.lat,
                                lng: lng !== undefined ? lng : prev.lng,
                                titikSambungLat: titikSambungLat !== undefined ? titikSambungLat : prev.titikSambungLat,
                                titikSambungLng: titikSambungLng !== undefined ? titikSambungLng : prev.titikSambungLng,
                                panjangSrMeter: distanceMeter !== undefined ? distanceMeter : prev.panjangSrMeter
                              }));
                            }}
                          />
                        </div>

                        {/* Panjang SR & Kabel */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-slate-400 font-semibold mb-1">
                              Panjang Saluran Rumah (SR Meter)
                              <span className="text-[10px] text-amber-400 font-normal ml-1.5">(Otomatis terukur dari peta)</span>
                            </label>
                            <input
                              type="number"
                              placeholder="15"
                              value={formData.panjangSrMeter || ''}
                              onChange={e => setFormData({ ...formData, panjangSrMeter: Number(e.target.value) })}
                              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:border-cyan-500"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-400 font-semibold mb-1">Jenis & Ukuran Kabel SR</label>
                            <select
                              value={formData.jenisKabelSr || '2x10 mm²'}
                              onChange={e => setFormData({ ...formData, jenisKabelSr: e.target.value })}
                              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                            >
                              <option value="2x10 mm²">2x10 mm² (Standar 1 Fasa s/d 2200 VA)</option>
                              <option value="2x16 mm²">2x16 mm² (1 Fasa Daya Besar 3500-7700 VA)</option>
                              <option value="4x16 mm²">4x16 mm² (3 Fasa Daya Menengah)</option>
                              <option value="4x25 mm²">4x25 mm² (3 Fasa Daya Besar)</option>
                              <option value="4x35 mm²">4x35 mm²</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Section 3: Dokumentasi Foto Bangunan, Titik Sambung & Foto Tegangan */}
                      <SurveyPhotoUploadSection
                        fotoBangunan={formData.fotoBangunan || formData.fotoLokasi}
                        fotoTitikSambung={formData.fotoTitikSambung}
                        fotoPengukuranTegangan={formData.fotoPengukuranTegangan}
                        onChangeFotoBangunan={(url) => {
                          setFormData(prev => ({
                            ...prev,
                            fotoBangunan: url || '',
                            fotoLokasi: url || ''
                          }));
                        }}
                        onChangeFotoTitikSambung={(url) => {
                          setFormData(prev => ({
                            ...prev,
                            fotoTitikSambung: url || ''
                          }));
                        }}
                        onChangeFotoPengukuranTegangan={(url) => {
                          setFormData(prev => ({
                            ...prev,
                            fotoPengukuranTegangan: url || ''
                          }));
                        }}
                        namaPelanggan={formData.namaPelanggan || 'Bangunan Calon Pelanggan'}
                        titikSambungNama={formData.titikSambung || 'Tiang JTR / Saluran Sambung'}
                        teganganUkur={formData.tegTetangga}
                      />

                      {/* Section 4: Hasil Survey & Rekomendasi */}
                      <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-3 shadow-inner">
                        <h4 className="font-bold text-emerald-400 uppercase text-[11px] tracking-wider flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          4. Kesimpulan & Rekomendasi Teknis
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-slate-400 font-semibold mb-1">Status Kelayakan *</label>
                            <select
                              value={formData.statusKelayakan}
                              onChange={e => setFormData({ ...formData, statusKelayakan: e.target.value as any })}
                              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold focus:outline-none focus:border-emerald-500"
                            >
                              <option value="Perlu Survey Lapangan">Perlu Survey Lapangan (WO Diterbitkan)</option>
                              <option value="Layak Sambung">Layak Sambung</option>
                              <option value="Perlu Sisip Tiang">Perlu Sisip Tiang JTR</option>
                              <option value="Perlu Perluasan JTR">Perlu Perluasan Jaringan JTR</option>
                              <option value="Perlu Up-rating Trafo">Perlu Up-rating Trafo</option>
                              <option value="Drop Tegangan (Tidak Layak)">Drop Tegangan (Tidak Layak Sambung)</option>
                              <option value="Menunggu Material">Menunggu Material SR / Tiang</option>
                              <option value="Selesai Penyambungan">Selesai Penyambungan</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-slate-400 font-semibold mb-1">Petugas Surveyor *</label>
                            <input
                              type="text"
                              required
                              placeholder="Nama Surveyor Lapangan"
                              value={formData.petugasSurvey || ''}
                              onChange={e => setFormData({ ...formData, petugasSurvey: e.target.value })}
                              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-400 font-semibold mb-1">Tanggal Pelaksanaan Survey *</label>
                            <input
                              type="date"
                              required
                              value={formData.tanggalSurvey || ''}
                              onChange={e => setFormData({ ...formData, tanggalSurvey: e.target.value })}
                              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-slate-400 font-semibold mb-1">Rekomendasi Teknis Petugas</label>
                          <textarea
                            rows={2}
                            placeholder="Contoh: Tegangan stabil 221V. Titik sambung aman di tiang TR-05, disarankan penarikan SR 18 meter tanpa melintasi atap tetangga."
                            value={formData.rekomendasiTeknis || ''}
                            onChange={e => setFormData({ ...formData, rekomendasiTeknis: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-400 font-semibold mb-1">Nama Team Leader</label>
                          <input
                            type="text"
                            placeholder="Nama Team Leader"
                            value={formData.teamLeaderName || ''}
                            onChange={e => setFormData({ ...formData, teamLeaderName: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-slate-400 font-semibold mb-1">Catatan Tambahan</label>
                          <input
                            type="text"
                            placeholder="Contoh: Pemohon meminta penempatan meter di sisi kanan teras rumah."
                            value={formData.catatan || ''}
                            onChange={e => setFormData({ ...formData, catatan: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>

                      {/* Section 5: Tanda Tangan Digital Laporan Survey */}
                      <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-3 shadow-inner">
                        <h4 className="font-bold text-amber-400 uppercase text-[11px] tracking-wider flex items-center gap-1.5">
                          <PenTool className="w-3.5 h-3.5" />
                          5. Tanda Tangan Digital Laporan Survey
                        </h4>
                        <p className="text-[11px] text-slate-400">
                          Goreskan tanda tangan langsung pada layar untuk disematkan pada dokumen Berita Acara (BA) & Live Paper resmi sebelum dicetak/diunduh.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                          {/* Tanda Tangan Surveyor */}
                          <div className="space-y-1">
                            <DigitalSignaturePad
                              value={formData.tandaTanganSurveyor}
                              onChange={(sig) => setFormData(prev => ({ ...prev, tandaTanganSurveyor: sig }))}
                              signerName={formData.petugasSurvey || currentUser?.name || 'Surveyor Lapangan'}
                              signerTitle="Petugas Surveyor Lapangan"
                              penColor="#0f2b5c"
                              height={110}
                              placeholderText="Tanda Tangan Petugas Surveyor Lapangan"
                            />
                          </div>

                          {/* Tanda Tangan Team Leader / TL Teknik */}
                          <div className="space-y-1">
                            <DigitalSignaturePad
                              value={formData.tandaTanganTlTeknik}
                              onChange={(sig) => setFormData(prev => ({ ...prev, tandaTanganTlTeknik: sig, isApproved: true }))}
                              signerName={formData.teamLeaderName || 'Team Leader Teknik'}
                              signerTitle="TL Teknik ULP Baguala"
                              penColor="#0f2b5c"
                              height={110}
                              placeholderText="Tanda Tangan Persetujuan TL Teknik"
                            />
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Submit Buttons */}
                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-all cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
                    >
                      {editingItem ? 'Simpan Perubahan Survey' : 'Simpan Data Survey Baru'}
                    </button>
                  </div>
                </form>
              </div>

              {/* RIGHT COLUMN: REAL-TIME LIVE PAPER SPK PREVIEW */}
              <div className={`flex flex-col bg-white rounded-2xl border border-slate-300 shadow-xl overflow-hidden ${formModalTab === 'form' ? 'hidden lg:flex' : 'flex'}`}>
                <div className="flex-1 overflow-y-auto max-h-[80vh]">
                  <LivePaperPbPdDocument
                    data={formData}
                    onPrint={() => window.print()}
                    onDownloadPdf={() => handleExportPDF(formData)}
                    onShareWhatsapp={() => handleShareWhatsapp(formData)}
                    showHeaderActions={true}
                  />
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* FULL PHOTO LIGHTBOX PREVIEW MODAL */}
      {previewModalPhoto && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fade-in"
          onClick={() => setPreviewModalPhoto(null)}
        >
          <div
            className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl space-y-3 p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white leading-tight">
                    {previewModalPhoto.title}
                  </h3>
                  {previewModalPhoto.subtitle && (
                    <p className="text-[11px] text-slate-400">
                      {previewModalPhoto.subtitle}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setPreviewModalPhoto(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg bg-slate-800 hover:bg-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center min-h-[300px] max-h-[65vh]">
              <img
                src={previewModalPhoto.url}
                alt={previewModalPhoto.title}
                className="max-h-[65vh] w-auto max-w-full object-contain rounded-lg"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-400">Dokumentasi Survei Lapangan</span>
              <div className="flex items-center gap-2">
                <a
                  href={previewModalPhoto.url}
                  download="Foto_Survei_PLN.jpg"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-amber-400" />
                  <span>Unduh Foto</span>
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewModalPhoto(null)}
                  className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold transition-colors cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
