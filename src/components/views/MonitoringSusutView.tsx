import React, { useState, useMemo } from 'react';
import {
  TrendingDown,
  Activity,
  Search,
  Plus,
  Trash2,
  Edit2,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Filter,
  X,
  BarChart3,
  Percent,
  Zap,
  ArrowDownRight,
  ShieldCheck,
  Target,
  Calculator,
  Building2,
  Users,
  DollarSign,
  FileText,
  RotateCcw,
  Sparkles,
  Info,
  Eye,
  Download
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  MonitoringSusutItem,
  PembacaanMeterGarduItem,
  PembacaanPelangganDetail,
  Penyulang,
  User
} from '../../types';
import { canEditData } from '../../utils/permissions';
import { DAFTAR_UNIT_PLN } from '../../utils/unitConfig';
import { UnitFilterBar, filterByUnitOrKode } from '../common/UnitFilterBar';

interface MonitoringSusutViewProps {
  currentUser?: User | null;
  susutList?: MonitoringSusutItem[];
  penyulangList?: Penyulang[];
  onAdd?: (item: MonitoringSusutItem) => void;
  onUpdate?: (item: MonitoringSusutItem) => void;
  onDelete?: (id: string) => void;
}

const INITIAL_MOCK_SUSUT: MonitoringSusutItem[] = [
  {
    id: 'susut-1',
    bulanTahun: 'Agustus 2026',
    namaPenyulangOrUnit: 'Penyulang Passo (GI Passo)',
    kwhKirim: 1845200,
    kwhTerimaOrTerjual: 1749800,
    kwhSusut: 95400,
    persentaseSusut: 5.17,
    targetSusutPersen: 6.2,
    kategoriSusut: 'SUSUT_TEKNIS',
    statusTarget: 'TERCAPAI',
    akarMasalah: 'Drop tegangan ujung jaringan & penambahan beban perumahan baru.',
    tindakanUpaya: 'Uprating konduktor SUTM & pemangkasan pohon rutin (ROW).',
    unit: 'ULP Baguala',
    kodeUnit: '54110',
    bppPerKwhRp: 1444.7,
    estimasiRugiRp: 137824380,
    pembacaanMeterGarduList: [
      {
        id: 'g-1',
        kodeGardu: 'GD.PS01',
        namaGarduOrMeter: 'GI Passo Outgoing Feeder Passo',
        standAwalKwh: 1250000,
        standAkhirKwh: 1325000,
        faktorKaliMeter: 20,
        totalKwhKirimGardu: 1500000,
        keteranganMeter: 'kWh Meter Utama Pangkal GI'
      },
      {
        id: 'g-2',
        kodeGardu: 'GD.PS02',
        namaGarduOrMeter: 'Gardu Distribusi Passo Tengah',
        standAwalKwh: 420000,
        standAkhirKwh: 435000,
        faktorKaliMeter: 20,
        totalKwhKirimGardu: 300000,
        keteranganMeter: 'Meter Gardu Sisipan'
      },
      {
        id: 'g-3',
        kodeGardu: 'GD.PS03',
        namaGarduOrMeter: 'Gardu Distribusi Passo Ujung (AURI)',
        standAwalKwh: 180000,
        standAkhirKwh: 182260,
        faktorKaliMeter: 20,
        totalKwhKirimGardu: 45200,
        keteranganMeter: 'Meter Trafo Ujung'
      }
    ],
    rincianPelangganList: [
      {
        id: 'p-1',
        kategoriTarifOrBlok: 'R-1 / Subsidized & Rumah Tangga (450VA-900VA)',
        jumlahPelanggan: 1240,
        totalKwhTerjual: 850000,
        noLppOrRef: 'LPP-BAG-202608-01'
      },
      {
        id: 'p-2',
        kategoriTarifOrBlok: 'R-1M / Non-Subsidized (900VA-2200VA)',
        jumlahPelanggan: 510,
        totalKwhTerjual: 420000,
        noLppOrRef: 'LPP-BAG-202608-02'
      },
      {
        id: 'p-3',
        kategoriTarifOrBlok: 'B-2 / Bisnis & Komersial',
        jumlahPelanggan: 120,
        totalKwhTerjual: 280000,
        noLppOrRef: 'LPP-BAG-202608-03'
      },
      {
        id: 'p-4',
        kategoriTarifOrBlok: 'P-1 & PJU Swadaya Jalan',
        jumlahPelanggan: 45,
        totalKwhTerjual: 199800,
        noLppOrRef: 'LPP-BAG-202608-04'
      }
    ]
  },
  {
    id: 'susut-2',
    bulanTahun: 'Agustus 2026',
    namaPenyulangOrUnit: 'Penyulang Baguala Ex Express',
    kwhKirim: 2150000,
    kwhTerimaOrTerjual: 2012000,
    kwhSusut: 138000,
    persentaseSusut: 6.42,
    targetSusutPersen: 6.0,
    kategoriSusut: 'GABUNGAN',
    statusTarget: 'OVER_TARGET',
    akarMasalah: 'Terdapat anomali pemakaian daya industri kecil & sambungan PJU swadaya.',
    tindakanUpaya: 'Operasi Penertiban P2TL Gabungan & inspeksi CT kWh meter 3 phasa.',
    unit: 'ULP Baguala',
    kodeUnit: '54110',
    bppPerKwhRp: 1444.7,
    estimasiRugiRp: 199368600
  },
  {
    id: 'susut-3',
    bulanTahun: 'Juli 2026',
    namaPenyulangOrUnit: 'Total ULP Baguala (Akumulasi)',
    kwhKirim: 14850000,
    kwhTerimaOrTerjual: 14003550,
    kwhSusut: 846450,
    persentaseSusut: 5.7,
    targetSusutPersen: 6.1,
    kategoriSusut: 'GABUNGAN',
    statusTarget: 'TERCAPAI',
    akarMasalah: 'Pemerataan beban gardu distribusi & penggantian meter macet.',
    tindakanUpaya: 'Program peremajaan 250 unit kWh meter tua & tera ulang CT/PT.',
    unit: 'ULP Baguala',
    kodeUnit: '54110',
    bppPerKwhRp: 1444.7,
    estimasiRugiRp: 1222866315
  }
];

export const MonitoringSusutView: React.FC<MonitoringSusutViewProps> = ({
  currentUser,
  susutList = INITIAL_MOCK_SUSUT,
  penyulangList = [],
  onAdd,
  onUpdate,
  onDelete
}) => {
  const [items, setItems] = useState<MonitoringSusutItem[]>(susutList);
  const [activeTab, setActiveTab] = useState<'KALKULATOR' | 'REKAPITULASI'>('KALKULATOR');

  // Filter state for Rekapitulasi tab
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUnitFilter, setSelectedUnitFilter] = useState('SEMUA');
  const [filterKategori, setFilterKategori] = useState('SEMUA');
  const [filterStatus, setFilterStatus] = useState('SEMUA');

  // Detail Modal State for viewing meter breakdown of saved item
  const [viewDetailItem, setViewDetailItem] = useState<MonitoringSusutItem | null>(null);

  // Modal State for Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MonitoringSusutItem | null>(null);

  // --- KALKULATOR STATE (TAB 1) ---
  const [calcPenyulang, setCalcPenyulang] = useState<string>('Penyulang Passo (GI Passo)');
  const [calcPeriode, setCalcPeriode] = useState<string>('Agustus 2026');
  const [calcUnit, setCalcUnit] = useState<string>(currentUser?.unit || 'ULP Baguala');
  const [calcKategori, setCalcKategori] = useState<string>('SUSUT_TEKNIS');
  const [calcTargetPersen, setCalcTargetPersen] = useState<number>(6.0);
  const [calcBppRp, setCalcBppRp] = useState<number>(1444.7);
  const [calcAkarMasalah, setCalcAkarMasalah] = useState<string>('');
  const [calcUpaya, setCalcUpaya] = useState<string>('');

  // Tabel 1: List Pembacaan Meter Gardu Distribusi / Feeder Pangkal
  const [garduMeterRows, setGarduMeterRows] = useState<PembacaanMeterGarduItem[]>([
    {
      id: 'g-row-1',
      kodeGardu: 'GD.PS01',
      namaGarduOrMeter: 'GI Passo Outgoing Feeder Passo',
      standAwalKwh: 1250000,
      standAkhirKwh: 1325000,
      faktorKaliMeter: 20,
      totalKwhKirimGardu: 1500000,
      keteranganMeter: 'kWh Meter Utama GI'
    },
    {
      id: 'g-row-2',
      kodeGardu: 'GD.PS02',
      namaGarduOrMeter: 'Gardu Distribusi Passo Tengah',
      standAwalKwh: 420000,
      standAkhirKwh: 435000,
      faktorKaliMeter: 20,
      totalKwhKirimGardu: 300000,
      keteranganMeter: 'Meter Gardu Sisipan'
    }
  ]);

  // Tabel 2: List Pembacaan Pelanggan (Mode Rincian or Direct)
  const [pelangganInputMode, setPelangganInputMode] = useState<'DIRECT' | 'BREAKDOWN'>('BREAKDOWN');
  const [directKwhTerjual, setDirectKwhTerjual] = useState<number>(1749800);
  const [pelangganRows, setPelangganRows] = useState<PembacaanPelangganDetail[]>([
    {
      id: 'p-row-1',
      kategoriTarifOrBlok: 'R-1 / Subsidized & Rumah Tangga (450VA-900VA)',
      jumlahPelanggan: 1240,
      totalKwhTerjual: 850000,
      noLppOrRef: 'LPP-BAG-202608-01'
    },
    {
      id: 'p-row-2',
      kategoriTarifOrBlok: 'R-1M / Non-Subsidized (900VA-2200VA)',
      jumlahPelanggan: 510,
      totalKwhTerjual: 420000,
      noLppOrRef: 'LPP-BAG-202608-02'
    },
    {
      id: 'p-row-3',
      kategoriTarifOrBlok: 'B-2 / Bisnis & Komersial',
      jumlahPelanggan: 120,
      totalKwhTerjual: 280000,
      noLppOrRef: 'LPP-BAG-202608-03'
    },
    {
      id: 'p-row-4',
      kategoriTarifOrBlok: 'P-1 & PJU Swadaya Jalan',
      jumlahPelanggan: 45,
      totalKwhTerjual: 199800,
      noLppOrRef: 'LPP-BAG-202608-04'
    }
  ]);

  const canEdit = canEditData(currentUser);

  React.useEffect(() => {
    if (susutList && susutList.length > 0) {
      setItems(susutList);
    }
  }, [susutList]);

  // --- DYNAMIC COMPUTATION FOR KALKULATOR ---
  const totalKwhKirimCalc = useMemo(() => {
    return garduMeterRows.reduce((acc, row) => acc + (row.totalKwhKirimGardu || 0), 0);
  }, [garduMeterRows]);

  const totalKwhTerjualCalc = useMemo(() => {
    if (pelangganInputMode === 'DIRECT') {
      return Number(directKwhTerjual) || 0;
    }
    return pelangganRows.reduce((acc, row) => acc + (row.totalKwhTerjual || 0), 0);
  }, [pelangganInputMode, directKwhTerjual, pelangganRows]);

  const totalKwhSusutCalc = useMemo(() => {
    return Math.max(0, totalKwhKirimCalc - totalKwhTerjualCalc);
  }, [totalKwhKirimCalc, totalKwhTerjualCalc]);

  const persentaseSusutCalc = useMemo(() => {
    if (totalKwhKirimCalc <= 0) return 0;
    return Number(((totalKwhSusutCalc / totalKwhKirimCalc) * 100).toFixed(2));
  }, [totalKwhSusutCalc, totalKwhKirimCalc]);

  const statusTargetCalc = useMemo(() => {
    if (persentaseSusutCalc > calcTargetPersen) return 'OVER_TARGET';
    if (persentaseSusutCalc >= calcTargetPersen - 0.5) return 'WASPADA';
    return 'TERCAPAI';
  }, [persentaseSusutCalc, calcTargetPersen]);

  const estimasiRugiRpCalc = useMemo(() => {
    return Math.round(totalKwhSusutCalc * calcBppRp);
  }, [totalKwhSusutCalc, calcBppRp]);

  // --- METER GARDU ROW HANDLERS ---
  const handleAddGarduRow = () => {
    const newRow: PembacaanMeterGarduItem = {
      id: `g-row-${Date.now()}`,
      kodeGardu: `GD.PS${garduMeterRows.length + 1}`,
      namaGarduOrMeter: `Gardu Distribusi Baru ${garduMeterRows.length + 1}`,
      standAwalKwh: 100000,
      standAkhirKwh: 105000,
      faktorKaliMeter: 20,
      totalKwhKirimGardu: 100000,
      keteranganMeter: 'Meter Baru'
    };
    setGarduMeterRows([...garduMeterRows, newRow]);
  };

  const handleUpdateGarduRow = (id: string, field: keyof PembacaanMeterGarduItem, value: any) => {
    setGarduMeterRows((prev) =>
      prev.map((row) => {
        if (row.id === id) {
          const updated = { ...row, [field]: value };
          // Auto recalc totalKwhKirimGardu if stand/faktor change
          const standAwal = Number(updated.standAwalKwh) || 0;
          const standAkhir = Number(updated.standAkhirKwh) || 0;
          const fk = Number(updated.faktorKaliMeter) || 1;
          updated.totalKwhKirimGardu = Math.max(0, standAkhir - standAwal) * fk;
          return updated;
        }
        return row;
      })
    );
  };

  const handleDeleteGarduRow = (id: string) => {
    if (garduMeterRows.length <= 1) {
      alert('Minimal harus ada 1 baris pembacaan meter gardu.');
      return;
    }
    setGarduMeterRows((prev) => prev.filter((r) => r.id !== id));
  };

  // --- PELANGGAN ROW HANDLERS ---
  const handleAddPelangganRow = () => {
    const newRow: PembacaanPelangganDetail = {
      id: `p-row-${Date.now()}`,
      kategoriTarifOrBlok: 'R-1 / Subsidized (900VA)',
      jumlahPelanggan: 100,
      totalKwhTerjual: 50000,
      noLppOrRef: `LPP-REF-${Date.now().toString().slice(-4)}`
    };
    setPelangganRows([...pelangganRows, newRow]);
  };

  const handleUpdatePelangganRow = (id: string, field: keyof PembacaanPelangganDetail, value: any) => {
    setPelangganRows((prev) =>
      prev.map((row) => {
        if (row.id === id) {
          return { ...row, [field]: value };
        }
        return row;
      })
    );
  };

  const handleDeletePelangganRow = (id: string) => {
    if (pelangganRows.length <= 1) {
      alert('Minimal harus ada 1 baris rincian tarif pelanggan.');
      return;
    }
    setPelangganRows((prev) => prev.filter((r) => r.id !== id));
  };

  // Load Presets Sample Data for Feeder Selection
  const handleLoadPresetSample = (feederName: string) => {
    setCalcPenyulang(feederName);
    if (feederName.toLowerCase().includes('passo')) {
      setGarduMeterRows([
        {
          id: 'g-row-1',
          kodeGardu: 'GD.PS01',
          namaGarduOrMeter: 'GI Passo Outgoing Feeder Passo',
          standAwalKwh: 1250000,
          standAkhirKwh: 1325000,
          faktorKaliMeter: 20,
          totalKwhKirimGardu: 1500000,
          keteranganMeter: 'Meter Utama Pangkal GI'
        },
        {
          id: 'g-row-2',
          kodeGardu: 'GD.PS02',
          namaGarduOrMeter: 'Gardu Distribusi Passo Tengah',
          standAwalKwh: 420000,
          standAkhirKwh: 435000,
          faktorKaliMeter: 20,
          totalKwhKirimGardu: 300000,
          keteranganMeter: 'Meter Gardu Sisipan'
        },
        {
          id: 'g-row-3',
          kodeGardu: 'GD.PS03',
          namaGarduOrMeter: 'Gardu Distribusi Passo Ujung',
          standAwalKwh: 180000,
          standAkhirKwh: 182260,
          faktorKaliMeter: 20,
          totalKwhKirimGardu: 45200,
          keteranganMeter: 'Meter Trafo Ujung'
        }
      ]);
      setPelangganRows([
        { id: 'p-1', kategoriTarifOrBlok: 'R-1 / Subsidized (450VA-900VA)', jumlahPelanggan: 1240, totalKwhTerjual: 850000, noLppOrRef: 'LPP-BAG-01' },
        { id: 'p-2', kategoriTarifOrBlok: 'R-1M / Non-Subsidized (900VA-2200VA)', jumlahPelanggan: 510, totalKwhTerjual: 420000, noLppOrRef: 'LPP-BAG-02' },
        { id: 'p-3', kategoriTarifOrBlok: 'B-2 / Bisnis & Komersial', jumlahPelanggan: 120, totalKwhTerjual: 280000, noLppOrRef: 'LPP-BAG-03' },
        { id: 'p-4', kategoriTarifOrBlok: 'P-1 & PJU Swadaya Jalan', jumlahPelanggan: 45, totalKwhTerjual: 199800, noLppOrRef: 'LPP-BAG-04' }
      ]);
    } else if (feederName.toLowerCase().includes('baguala')) {
      setGarduMeterRows([
        {
          id: 'g-row-b1',
          kodeGardu: 'GD.BG01',
          namaGarduOrMeter: 'GI Passo Express Baguala',
          standAwalKwh: 2000000,
          standAkhirKwh: 2107500,
          faktorKaliMeter: 20,
          totalKwhKirimGardu: 2150000,
          keteranganMeter: 'Outgoing Express Baguala'
        }
      ]);
      setPelangganRows([
        { id: 'p-b1', kategoriTarifOrBlok: 'R-1 / Subsidized (450VA-900VA)', jumlahPelanggan: 1800, totalKwhTerjual: 1100000, noLppOrRef: 'LPP-BAG-EXP1' },
        { id: 'p-b2', kategoriTarifOrBlok: 'I-3 / Industri & Sentra Perikanan', jumlahPelanggan: 15, totalKwhTerjual: 912000, noLppOrRef: 'LPP-BAG-EXP2' }
      ]);
    }
  };

  // --- SAVE CALCULATOR RESULT TO SYSTEM ---
  const handleSaveCalculator = () => {
    if (!calcPenyulang.trim()) {
      alert('Mohon pilih atau masukkan Nama Penyulang / Unit!');
      return;
    }

    if (totalKwhKirimCalc <= 0) {
      alert('Total kWh Kirim gardu harus lebih dari 0. Mohon periksa pembacaan stand meter.');
      return;
    }

    const kodeUnitFound = DAFTAR_UNIT_PLN.find((u) => u.namaUnit === calcUnit)?.kodeUnit || '54110';

    const newItem: MonitoringSusutItem = {
      id: `susut-${Date.now()}`,
      bulanTahun: calcPeriode,
      namaPenyulangOrUnit: calcPenyulang,
      kwhKirim: totalKwhKirimCalc,
      kwhTerimaOrTerjual: totalKwhTerjualCalc,
      kwhSusut: totalKwhSusutCalc,
      persentaseSusut: persentaseSusutCalc,
      targetSusutPersen: calcTargetPersen,
      kategoriSusut: calcKategori,
      statusTarget: statusTargetCalc,
      akarMasalah: calcAkarMasalah || 'Kalkulasi Neraca kWh Gardu vs Rekap Pelanggan',
      tindakanUpaya: calcUpaya || 'Monitoring & Evaluasi berkala per periode',
      unit: calcUnit,
      kodeUnit: kodeUnitFound,
      bppPerKwhRp: calcBppRp,
      estimasiRugiRp: estimasiRugiRpCalc,
      pembacaanMeterGarduList: garduMeterRows,
      rincianPelangganList: pelangganInputMode === 'BREAKDOWN' ? pelangganRows : undefined,
      createdAt: new Date().toISOString()
    };

    const newItems = [newItem, ...items];
    setItems(newItems);
    if (onAdd) onAdd(newItem);

    alert(`✅ Neraca Susut Energi untuk ${calcPenyulang} (${calcPeriode}) berhasil disimpan! Realiasi: ${persentaseSusutCalc}% (${statusTargetCalc})`);
    setActiveTab('REKAPITULASI');
  };

  // --- FILTERED DATA FOR TAB 2 REKAPITULASI ---
  const filteredData = useMemo(() => {
    const listFilteredByUnit = filterByUnitOrKode(items, selectedUnitFilter, searchQuery);
    return listFilteredByUnit.filter((item) => {
      const matchKategori = filterKategori === 'SEMUA' || item.kategoriSusut === filterKategori;
      const matchStatus = filterStatus === 'SEMUA' || item.statusTarget === filterStatus;
      return matchKategori && matchStatus;
    });
  }, [items, selectedUnitFilter, searchQuery, filterKategori, filterStatus]);

  // Aggregates for Tab 2
  const totalKirim = filteredData.reduce((acc, curr) => acc + (curr.kwhKirim || 0), 0);
  const totalTerjual = filteredData.reduce((acc, curr) => acc + (curr.kwhTerimaOrTerjual || 0), 0);
  const totalSusutKwh = filteredData.reduce((acc, curr) => acc + (curr.kwhSusut || 0), 0);
  const avgSusutPersen = totalKirim > 0 ? ((totalSusutKwh / totalKirim) * 100).toFixed(2) : '0';
  const overTargetCount = filteredData.filter((i) => i.statusTarget === 'OVER_TARGET').length;
  const totalRugiRpSum = filteredData.reduce((acc, curr) => acc + (curr.estimasiRugiRp || (curr.kwhSusut * 1444.7)), 0);

  // --- DELETE HANDLER ---
  const handleDelete = (id: string) => {
    if (window.confirm('Hapus data monitoring susut energi ini secara permanen?')) {
      const filtered = items.filter((i) => i.id !== id);
      setItems(filtered);
      if (onDelete) onDelete(id);
    }
  };

  // --- EXPORT PDF REPORT ---
  const handleExportPDF = (item?: MonitoringSusutItem) => {
    const doc = new jsPDF('portrait', 'pt', 'a4');
    const targetItem = item || filteredData[0];

    // Header
    doc.setFillColor(2, 38, 35); // Dark teal PLN
    doc.rect(0, 0, 595, 70, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('PT PLN (PERSERO) - NERACA & KALKULASI SUSUT ENERGI', 30, 32);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Sistem Monitoring Keandalan & Efisiensi Distribusi 20kV', 30, 48);

    doc.setTextColor(30, 41, 59);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`BERITA ACARA NERACA SUSUT: ${targetItem?.namaPenyulangOrUnit || 'REKAP ULP'}`, 30, 95);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Periode Bulan: ${targetItem?.bulanTahun || 'Agustus 2026'}`, 30, 110);
    doc.text(`Unit PLN: ${targetItem?.unit || 'ULP Baguala'} (${targetItem?.kodeUnit || '54110'})`, 30, 122);
    doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}`, 420, 110);

    // Summary Box Table
    const summaryRows = [
      ['kWh Kirim (Pangkal Gardu GI)', `${(targetItem?.kwhKirim || 0).toLocaleString('id-ID')} kWh`],
      ['kWh Terjual (Pelanggan)', `${(targetItem?.kwhTerimaOrTerjual || 0).toLocaleString('id-ID')} kWh`],
      ['kWh Susut (Selisih Loss)', `${(targetItem?.kwhSusut || 0).toLocaleString('id-ID')} kWh`],
      ['Realisasi Susut (%)', `${targetItem?.persentaseSusut || 0}%`],
      ['Target Susut Maksimum (%)', `${targetItem?.targetSusutPersen || 6.0}%`],
      ['Status Pencapaian Target', targetItem?.statusTarget === 'TERCAPAI' ? 'TERCAPAI (HIJAU)' : 'OVER TARGET (MERAH)'],
      ['Estimasi Kerugian Finansial (Rp)', `Rp ${Math.round(targetItem?.estimasiRugiRp || (targetItem?.kwhSusut || 0) * 1444.7).toLocaleString('id-ID')}`]
    ];

    autoTable(doc, {
      startY: 135,
      head: [['Parameter Neraca Energi', 'Nilai Realisasi']],
      body: summaryRows,
      theme: 'grid',
      headStyles: { fillColor: [4, 76, 69], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 9 }
    });

    // Breakdown Gardu Meter Table if available
    if (targetItem?.pembacaanMeterGarduList && targetItem.pembacaanMeterGarduList.length > 0) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      const finalY = (doc as any).lastAutoTable.finalY + 20;
      doc.text('Rincian Pembacaan Stand Meter Gardu Distribusi / Feeder:', 30, finalY);

      const garduBody = targetItem.pembacaanMeterGarduList.map((g) => [
        g.kodeGardu,
        g.namaGarduOrMeter,
        g.standAwalKwh.toLocaleString('id-ID'),
        g.standAkhirKwh.toLocaleString('id-ID'),
        `x${g.faktorKaliMeter}`,
        `${g.totalKwhKirimGardu.toLocaleString('id-ID')} kWh`
      ]);

      autoTable(doc, {
        startY: finalY + 10,
        head: [['Kode Gardu', 'Uraian Meter Gardu', 'Stand Awal', 'Stand Akhir', 'Faktor Kali', 'Total kWh Masuk']],
        body: garduBody,
        theme: 'striped',
        headStyles: { fillColor: [2, 46, 42], textColor: [255, 255, 255] },
        styles: { fontSize: 8 }
      });
    }

    doc.save(`Laporan_Susut_Energi_${(targetItem?.namaPenyulangOrUnit || 'PLN').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
  };

  // --- EXPORT CSV ---
  const handleExportCSV = () => {
    const headers = [
      'Bulan / Tahun',
      'Penyulang / Unit',
      'kWh Kirim Gardu',
      'kWh Terjual Pelanggan',
      'kWh Susut (Loss)',
      'Realisasi Susut (%)',
      'Target Susut (%)',
      'Status Target',
      'Estimasi Rugi (Rp)',
      'Akar Masalah',
      'Upaya Penurunan',
      'Unit',
      'Kode Unit'
    ];

    const rows = filteredData.map((item) => [
      `"${item.bulanTahun}"`,
      `"${item.namaPenyulangOrUnit}"`,
      item.kwhKirim,
      item.kwhTerimaOrTerjual,
      item.kwhSusut,
      item.persentaseSusut,
      item.targetSusutPersen,
      item.statusTarget,
      item.estimasiRugiRp || Math.round(item.kwhSusut * 1444.7),
      `"${item.akarMasalah}"`,
      `"${item.tindakanUpaya}"`,
      item.unit,
      item.kodeUnit || ''
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Kalkulasi_Susut_Energi_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto font-sans text-slate-800">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#022623] via-[#044c45] to-[#022e2a] rounded-3xl p-6 text-white shadow-2xl border-2 border-teal-500/60 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-teal-950/80 border border-teal-500/40 rounded-2xl text-teal-300 shadow-inner">
                <Calculator className="w-6 h-6 text-amber-300 animate-pulse" />
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-teal-500/20 border border-teal-500/40 text-teal-300 text-xs font-black uppercase tracking-wider">
                Transaksi Energi • Kalkulator Pembacaan Meter Gardu vs Pelanggan
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white drop-shadow-xs">
              KALKULASI & MONITORING SUSUT ENERGI PER PENYULANG
            </h1>
            <p className="text-xs sm:text-sm text-teal-100/90 max-w-3xl leading-relaxed font-medium">
              Fitur perselisihan neraca energi: Input stand meter KWH di gardu distribusi / pangkal feeder dibanding total kWh pelanggan per periode untuk mengukur persentase susut teknis & non-teknis secara presisi.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2.5 bg-[#012521] hover:bg-[#02312b] text-teal-200 border border-teal-500/50 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
            <button
              onClick={() => handleExportPDF()}
              className="px-3.5 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white rounded-xl font-black text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Cetak Laporan PDF</span>
            </button>
          </div>
        </div>

        {/* Tab Switcher inside Banner */}
        <div className="mt-6 pt-4 border-t border-teal-500/30 flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('KALKULATOR')}
            className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'KALKULATOR'
                ? 'bg-amber-400 text-slate-950 shadow-lg scale-102 border border-amber-300'
                : 'bg-teal-950/60 text-teal-200 hover:bg-teal-900 border border-teal-500/30'
            }`}
          >
            <Calculator className="w-4 h-4" />
            <span>1. Kalkulator & Tabel Input Stand Meter (Gardu vs Pelanggan)</span>
          </button>

          <button
            onClick={() => setActiveTab('REKAPITULASI')}
            className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'REKAPITULASI'
                ? 'bg-amber-400 text-slate-950 shadow-lg scale-102 border border-amber-300'
                : 'bg-teal-950/60 text-teal-200 hover:bg-teal-900 border border-teal-500/30'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>2. Matriks & Monitoring Histori Susut Energi ({items.length})</span>
          </button>
        </div>
      </div>

      {/* ==================== TAB 1: KALKULATOR & TABEL INPUT ==================== */}
      {activeTab === 'KALKULATOR' && (
        <div className="space-y-6">
          {/* Header Controls for Calculator */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-900 font-black text-sm">
                <Sparkles className="w-5 h-5 text-teal-600" />
                <span>Pengaturan Parameter Feeder & Periode Pembacaan</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-500 font-bold">Preset Penyulang:</span>
                <button
                  onClick={() => handleLoadPresetSample('Penyulang Passo')}
                  className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 text-[10px] font-black rounded-lg border border-teal-200 cursor-pointer"
                >
                  Load Preset Passo
                </button>
                <button
                  onClick={() => handleLoadPresetSample('Penyulang Baguala')}
                  className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 text-[10px] font-black rounded-lg border border-amber-200 cursor-pointer"
                >
                  Load Preset Baguala
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-black text-slate-700 mb-1">Nama Penyulang / Feeder *</label>
                <div className="flex items-center gap-1">
                  <select
                    value={calcPenyulang}
                    onChange={(e) => setCalcPenyulang(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:bg-white focus:border-teal-500"
                  >
                    {penyulangList.length > 0 ? (
                      penyulangList.map((p) => (
                        <option key={p.id} value={`${p.namaPenyulang} (${p.garduInduk || 'GI'})`}>
                          {p.namaPenyulang} - {p.garduInduk || 'GI'}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="Penyulang Passo (GI Passo)">Penyulang Passo (GI Passo)</option>
                        <option value="Penyulang Baguala Ex Express">Penyulang Baguala Ex Express</option>
                        <option value="Penyulang Hative Besar">Penyulang Hative Besar</option>
                        <option value="Penyulang Laha">Penyulang Laha</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-700 mb-1">Periode Bulan & Tahun</label>
                <input
                  type="text"
                  value={calcPeriode}
                  onChange={(e) => setCalcPeriode(e.target.value)}
                  placeholder="Contoh: Agustus 2026"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:bg-white focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-700 mb-1">Unit Layanan PLN (ULP)</label>
                <select
                  value={calcUnit}
                  onChange={(e) => setCalcUnit(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:bg-white focus:border-teal-500"
                >
                  {DAFTAR_UNIT_PLN.map((u, i) => (
                    <option key={i} value={u.namaUnit}>
                      {u.namaUnit}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-700 mb-1">Target Susut Maksimum (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={calcTargetPersen}
                  onChange={(e) => setCalcTargetPersen(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold focus:bg-white focus:border-teal-500"
                />
              </div>
            </div>
          </div>

          {/* SECTION 1: TABEL INPUT PEMBACAAN METER KWH GARDU DISTRIBUSI */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-teal-900 to-teal-800 p-4 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-amber-300" />
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wide">
                    1. Tabel Stand Meter kWh Gardu Distribusi / Feeder Pangkal
                  </h3>
                  <p className="text-[11px] text-teal-200">
                    Input Stand Awal, Stand Akhir & Faktor Kali (CT/PT Ratio) per titik meter gardu.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddGarduRow}
                className="px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-sm shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Meter Gardu</span>
              </button>
            </div>

            <div className="overflow-x-auto p-4">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 uppercase font-black tracking-wider text-[10px]">
                  <tr>
                    <th className="px-3 py-2.5 w-28">Kode Gardu</th>
                    <th className="px-3 py-2.5">Uraian / Lokasi Gardu</th>
                    <th className="px-3 py-2.5 w-32 text-right">Stand Awal (kWh)</th>
                    <th className="px-3 py-2.5 w-32 text-right">Stand Akhir (kWh)</th>
                    <th className="px-3 py-2.5 w-24 text-center">Faktor Kali</th>
                    <th className="px-3 py-2.5 w-36 text-right">Total kWh Kirim</th>
                    <th className="px-3 py-2.5 w-12 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {garduMeterRows.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={row.kodeGardu}
                          onChange={(e) => handleUpdateGarduRow(row.id, 'kodeGardu', e.target.value)}
                          className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-800"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={row.namaGarduOrMeter}
                          onChange={(e) => handleUpdateGarduRow(row.id, 'namaGarduOrMeter', e.target.value)}
                          className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-800"
                        />
                      </td>
                      <td className="px-3 py-2 text-right">
                        <input
                          type="number"
                          value={row.standAwalKwh}
                          onChange={(e) => handleUpdateGarduRow(row.id, 'standAwalKwh', Number(e.target.value))}
                          className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-right"
                        />
                      </td>
                      <td className="px-3 py-2 text-right">
                        <input
                          type="number"
                          value={row.standAkhirKwh}
                          onChange={(e) => handleUpdateGarduRow(row.id, 'standAkhirKwh', Number(e.target.value))}
                          className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-right"
                        />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <input
                          type="number"
                          value={row.faktorKaliMeter}
                          onChange={(e) => handleUpdateGarduRow(row.id, 'faktorKaliMeter', Number(e.target.value))}
                          className="w-20 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-center mx-auto"
                        />
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-black text-teal-800 bg-teal-50/50">
                        {row.totalKwhKirimGardu.toLocaleString('id-ID')} kWh
                      </td>
                      <td className="px-3 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteGarduRow(row.id)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Hapus Baris"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-900 text-white font-black">
                  <tr>
                    <td colSpan={5} className="px-4 py-3 text-right uppercase tracking-wider text-xs">
                      Subtotal Total kWh Kirim (Gardu / Pangkal Feeder):
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-sm text-amber-300">
                      {totalKwhKirimCalc.toLocaleString('id-ID')} kWh
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* SECTION 2: TABEL / INPUT TOTAL KWH PELANGGAN */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-900 to-teal-900 p-4 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-300" />
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wide">
                    2. Tabel & Input Total kWh Terjual Pelanggan dalam Periode
                  </h3>
                  <p className="text-[11px] text-emerald-200">
                    Pilih mode input langsung total kWh terjual atau rincian per kategori tarif/blok pelanggan.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-emerald-950/80 p-1 rounded-xl border border-emerald-500/40">
                <button
                  type="button"
                  onClick={() => setPelangganInputMode('BREAKDOWN')}
                  className={`px-3 py-1 rounded-lg text-[11px] font-black cursor-pointer transition-all ${
                    pelangganInputMode === 'BREAKDOWN'
                      ? 'bg-emerald-400 text-slate-950 shadow-xs'
                      : 'text-emerald-200 hover:text-white'
                  }`}
                >
                  Rincian Tarif
                </button>
                <button
                  type="button"
                  onClick={() => setPelangganInputMode('DIRECT')}
                  className={`px-3 py-1 rounded-lg text-[11px] font-black cursor-pointer transition-all ${
                    pelangganInputMode === 'DIRECT'
                      ? 'bg-emerald-400 text-slate-950 shadow-xs'
                      : 'text-emerald-200 hover:text-white'
                  }`}
                >
                  Input Direct
                </button>
              </div>
            </div>

            <div className="p-4 space-y-4">
              {pelangganInputMode === 'DIRECT' ? (
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-2 max-w-md">
                  <label className="block text-xs font-black text-emerald-900">
                    Total kWh Terjual / Diterima Pelanggan (Direct Input)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={directKwhTerjual}
                      onChange={(e) => setDirectKwhTerjual(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-xl font-mono font-bold text-lg text-emerald-950"
                    />
                    <span className="font-bold text-slate-600 text-xs shrink-0">kWh</span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium">
                    Masukkan total kWh dari Laporan LPP / LKS Rekapitulasi Pelanggan ULP.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                      Rincian kWh Terjual per Kategori Tarif Pelanggan
                    </span>
                    <button
                      type="button"
                      onClick={handleAddPelangganRow}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tambah Kategori Tarif</span>
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 uppercase font-black tracking-wider text-[10px]">
                        <tr>
                          <th className="px-3 py-2.5">Kategori Tarif / Golongan</th>
                          <th className="px-3 py-2.5 w-36 text-center">Jumlah Pelanggan</th>
                          <th className="px-3 py-2.5 w-44 text-right">kWh Terjual</th>
                          <th className="px-3 py-2.5 w-44">No Ref LPP / BPP</th>
                          <th className="px-3 py-2.5 w-12 text-center">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {pelangganRows.map((row) => (
                          <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                value={row.kategoriTarifOrBlok}
                                onChange={(e) => handleUpdatePelangganRow(row.id, 'kategoriTarifOrBlok', e.target.value)}
                                className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-800"
                              />
                            </td>
                            <td className="px-3 py-2 text-center">
                              <input
                                type="number"
                                value={row.jumlahPelanggan ?? 0}
                                onChange={(e) => handleUpdatePelangganRow(row.id, 'jumlahPelanggan', Number(e.target.value))}
                                className="w-28 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-center mx-auto"
                              />
                            </td>
                            <td className="px-3 py-2 text-right">
                              <input
                                type="number"
                                value={row.totalKwhTerjual}
                                onChange={(e) => handleUpdatePelangganRow(row.id, 'totalKwhTerjual', Number(e.target.value))}
                                className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-right text-emerald-800"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                value={row.noLppOrRef || ''}
                                onChange={(e) => handleUpdatePelangganRow(row.id, 'noLppOrRef', e.target.value)}
                                className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-600"
                              />
                            </td>
                            <td className="px-3 py-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleDeletePelangganRow(row.id)}
                                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Hapus Baris"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-slate-900 text-white font-black">
                        <tr>
                          <td colSpan={2} className="px-4 py-3 text-right uppercase tracking-wider text-xs">
                            Subtotal Total kWh Terjual (Pelanggan):
                          </td>
                          <td className="px-3 py-3 text-right font-mono text-sm text-emerald-300">
                            {totalKwhTerjualCalc.toLocaleString('id-ID')} kWh
                          </td>
                          <td colSpan={2}></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* SECTION 3: SUMMARY RESULT & EVALUATION PANEL */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-teal-950 rounded-3xl p-6 text-white shadow-xl border border-teal-500/30 space-y-6">
            <div className="flex items-center justify-between border-b border-teal-500/30 pb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-teal-500/20 text-teal-300 rounded-xl border border-teal-500/40">
                  <TrendingDown className="w-6 h-6 text-amber-300" />
                </div>
                <div>
                  <h3 className="text-base font-black uppercase tracking-tight text-white">
                    3. Hasil Kalkulasi Neraca & Persentase Susut Energi
                  </h3>
                  <p className="text-xs text-teal-200/80">
                    Otomatis dihitung dari selisih kWh Kirim Gardu vs kWh Terjual Pelanggan.
                  </p>
                </div>
              </div>

              <span className={`px-3 py-1.5 rounded-full font-black text-xs uppercase tracking-wider border ${
                statusTargetCalc === 'TERCAPAI'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                  : statusTargetCalc === 'WASPADA'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                  : 'bg-rose-500/20 text-rose-300 border-rose-500/50'
              }`}>
                {statusTargetCalc === 'TERCAPAI'
                  ? '✓ TERCAPAI (Target OK)'
                  : statusTargetCalc === 'WASPADA'
                  ? '⏳ WASPADA (Mendekati Target)'
                  : '⚠️ OVER TARGET (Perlu P2TL/ROW)'}
              </span>
            </div>

            {/* Metric Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              <div className="bg-slate-900/90 p-3.5 rounded-2xl border border-slate-800 space-y-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase">kWh Kirim (Gardu)</div>
                <div className="text-lg font-black font-mono text-teal-300">
                  {totalKwhKirimCalc.toLocaleString('id-ID')}
                </div>
              </div>

              <div className="bg-slate-900/90 p-3.5 rounded-2xl border border-slate-800 space-y-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase">kWh Terjual (Pelanggan)</div>
                <div className="text-lg font-black font-mono text-emerald-400">
                  {totalKwhTerjualCalc.toLocaleString('id-ID')}
                </div>
              </div>

              <div className="bg-slate-900/90 p-3.5 rounded-2xl border border-slate-800 space-y-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase">kWh Susut (Loss)</div>
                <div className="text-lg font-black font-mono text-rose-400">
                  {totalKwhSusutCalc.toLocaleString('id-ID')}
                </div>
              </div>

              <div className="bg-slate-900/90 p-3.5 rounded-2xl border border-slate-800 space-y-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Realisasi Susut %</div>
                <div className={`text-2xl font-black font-mono ${statusTargetCalc === 'OVER_TARGET' ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {persentaseSusutCalc}%
                </div>
              </div>

              <div className="bg-slate-900/90 p-3.5 rounded-2xl border border-slate-800 space-y-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Target Susut %</div>
                <div className="text-xl font-black font-mono text-amber-300">
                  {calcTargetPersen}%
                </div>
              </div>

              <div className="bg-slate-900/90 p-3.5 rounded-2xl border border-slate-800 space-y-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Estimasi Kerugian Rp</div>
                <div className="text-base font-black font-mono text-amber-400 truncate">
                  Rp {estimasiRugiRpCalc.toLocaleString('id-ID')}
                </div>
              </div>
            </div>

            {/* Inputs for Analysis */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2 text-xs">
              <div>
                <label className="block text-[11px] font-black text-teal-200 mb-1">Kategori Analisis Susut</label>
                <select
                  value={calcKategori}
                  onChange={(e) => setCalcKategori(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-teal-500/40 rounded-xl font-bold text-white focus:outline-none focus:border-teal-400"
                >
                  <option value="SUSUT_TEKNIS">SUSUT TEKNIS (JTM / Trafo / Drop Tegangan)</option>
                  <option value="SUSUT_NON_TEKNIS">SUSUT NON-TEKNIS (P2TL / Meter Macet / Anomali CT)</option>
                  <option value="GABUNGAN">GABUNGAN (Total Feeder)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-black text-teal-200 mb-1">Biaya Pokok Penyediaan (BPP Rp/kWh)</label>
                <input
                  type="number"
                  value={calcBppRp}
                  onChange={(e) => setCalcBppRp(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-900 border border-teal-500/40 rounded-xl font-mono font-bold text-white focus:outline-none focus:border-teal-400"
                />
              </div>

              <div className="sm:col-span-2 md:col-span-1">
                <label className="block text-[11px] font-black text-teal-200 mb-1">Akar Masalah Susut</label>
                <input
                  type="text"
                  value={calcAkarMasalah}
                  onChange={(e) => setCalcAkarMasalah(e.target.value)}
                  placeholder="Contoh: Anomali CT meter 3 phasa & drop voltage di ujung"
                  className="w-full px-3 py-2 bg-slate-900 border border-teal-500/40 rounded-xl font-bold text-white focus:outline-none focus:border-teal-400"
                />
              </div>

              <div className="sm:col-span-2 md:col-span-3">
                <label className="block text-[11px] font-black text-teal-200 mb-1">Rencana & Upaya Penurunan Susut</label>
                <input
                  type="text"
                  value={calcUpaya}
                  onChange={(e) => setCalcUpaya(e.target.value)}
                  placeholder="Contoh: Operasi Penertiban P2TL Gabungan & uprating konduktor SUTM"
                  className="w-full px-3 py-2 bg-slate-900 border border-teal-500/40 rounded-xl font-bold text-white focus:outline-none focus:border-teal-400"
                />
              </div>
            </div>

            {/* Save Buttons */}
            <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-teal-500/30">
              <button
                type="button"
                onClick={() => handleExportPDF()}
                className="px-4 py-2.5 rounded-xl bg-teal-900/80 hover:bg-teal-800 text-teal-200 font-bold border border-teal-500/40 text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                <span>Download BA Laporan PDF</span>
              </button>

              {canEdit && (
                <button
                  type="button"
                  onClick={handleSaveCalculator}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-emerald-400 hover:from-amber-300 hover:to-emerald-300 text-slate-950 font-black text-xs shadow-lg flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simpan Neraca Susut ke System</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 2: MATRIKS & HISTORI ==================== */}
      {activeTab === 'REKAPITULASI' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
              <div className="p-3 bg-blue-50 text-blue-700 rounded-xl border border-blue-100">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total kWh Kirim</div>
                <div className="text-lg font-black text-slate-900">{totalKirim.toLocaleString('id-ID')} kWh</div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
              <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total kWh Terjual</div>
                <div className="text-lg font-black text-emerald-600">{totalTerjual.toLocaleString('id-ID')} kWh</div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
              <div className="p-3 bg-teal-50 text-teal-700 rounded-xl border border-teal-100">
                <Percent className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Rata-rata Susut</div>
                <div className="text-xl font-black text-teal-700">{avgSusutPersen}%</div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
              <div className="p-3 bg-rose-50 text-rose-700 rounded-xl border border-rose-100">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Estimasi Kerugian</div>
                <div className="text-base font-black text-rose-600 truncate">
                  Rp {Math.round(totalRugiRpSum).toLocaleString('id-ID')}
                </div>
              </div>
            </div>
          </div>

          {/* UnitFilterBar Universal Filter */}
          <UnitFilterBar
            selectedUnit={selectedUnitFilter}
            onSelectUnit={setSelectedUnitFilter}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Cari Penyulang, Bulan, Akar Masalah..."
          />

          {/* Additional Filter Row */}
          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-500">Kategori:</span>
              <select
                value={filterKategori}
                onChange={(e) => setFilterKategori(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700"
              >
                <option value="SEMUA">Semua Kategori</option>
                <option value="SUSUT_TEKNIS">Susut Teknis</option>
                <option value="SUSUT_NON_TEKNIS">Susut Non-Teknis</option>
                <option value="GABUNGAN">Gabungan</option>
              </select>

              <span className="font-bold text-slate-500 ml-2">Status Target:</span>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700"
              >
                <option value="SEMUA">Semua Status</option>
                <option value="TERCAPAI">Tercapai (Hijau)</option>
                <option value="WASPADA">Waspada (Kuning)</option>
                <option value="OVER_TARGET">Over Target (Merah)</option>
              </select>
            </div>

            <div className="text-slate-500 font-bold">
              Menampilkan <span className="text-teal-700 font-black">{filteredData.length}</span> dari {items.length} neraca susut
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-black tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-3.5">Penyulang / Unit</th>
                    <th className="px-4 py-3.5">Bulan & Kategori</th>
                    <th className="px-4 py-3.5 text-right">kWh Kirim</th>
                    <th className="px-4 py-3.5 text-right">kWh Terjual</th>
                    <th className="px-4 py-3.5 text-right">Susut (kWh & %)</th>
                    <th className="px-4 py-3.5 text-right">Estimasi Rugi (Rp)</th>
                    <th className="px-4 py-3.5 text-center">Status</th>
                    <th className="px-4 py-3.5 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredData.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-slate-400 font-medium">
                        Belum ada data monitoring susut energi yang sesuai filter.
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((item) => {
                      const isOver = item.persentaseSusut > item.targetSusutPersen;
                      const rugi = item.estimasiRugiRp || Math.round(item.kwhSusut * 1444.7);
                      return (
                        <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-4 py-3">
                            <div className="font-black text-slate-900">{item.namaPenyulangOrUnit}</div>
                            <div className="text-[10px] text-teal-700 font-bold">
                              {item.unit} {item.kodeUnit ? `(${item.kodeUnit})` : ''}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-bold text-slate-800">{item.bulanTahun}</div>
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 font-extrabold text-slate-700 text-[9px]">
                              {item.kategoriSusut}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-slate-800">
                            {item.kwhKirim.toLocaleString('id-ID')}
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-emerald-700">
                            {item.kwhTerimaOrTerjual.toLocaleString('id-ID')}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className={`font-black font-mono text-sm ${isOver ? 'text-rose-600' : 'text-emerald-700'}`}>
                              {item.persentaseSusut}%
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {item.kwhSusut.toLocaleString('id-ID')} kWh
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-slate-800">
                            Rp {rugi.toLocaleString('id-ID')}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase inline-flex items-center gap-1 ${
                              item.statusTarget === 'TERCAPAI'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : item.statusTarget === 'OVER_TARGET'
                                ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                : 'bg-amber-100 text-amber-800 border border-amber-300'
                            }`}>
                              {item.statusTarget === 'TERCAPAI'
                                ? '✓ Tercapai'
                                : item.statusTarget === 'OVER_TARGET'
                                ? '⚠️ Over Target'
                                : '⏳ Waspada'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => setViewDetailItem(item)}
                                className="p-1.5 text-teal-700 hover:bg-teal-50 rounded-lg transition-colors cursor-pointer"
                                title="Rincian Meter Gardu"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleExportPDF(item)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                title="Download PDF"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                              {canEdit && (
                                <button
                                  onClick={() => handleDelete(item.id)}
                                  className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                  title="Hapus Data"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
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
          </div>
        </div>
      )}

      {/* DETAIL METER GARDU MODAL */}
      {viewDetailItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full p-6 text-slate-800 space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-teal-100 text-teal-800 rounded-xl">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Rincian Pembacaan Meter Gardu: {viewDetailItem.namaPenyulangOrUnit}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Periode {viewDetailItem.bulanTahun} • {viewDetailItem.unit}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewDetailItem(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-3 rounded-xl">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Total Kirim</div>
                  <div className="font-black font-mono text-slate-900">{viewDetailItem.kwhKirim.toLocaleString('id-ID')} kWh</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Total Terjual</div>
                  <div className="font-black font-mono text-emerald-700">{viewDetailItem.kwhTerimaOrTerjual.toLocaleString('id-ID')} kWh</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Susut %</div>
                  <div className="font-black font-mono text-teal-800">{viewDetailItem.persentaseSusut}%</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Status Target</div>
                  <div className="font-black uppercase text-amber-700">{viewDetailItem.statusTarget}</div>
                </div>
              </div>

              {viewDetailItem.pembacaanMeterGarduList && viewDetailItem.pembacaanMeterGarduList.length > 0 ? (
                <div>
                  <h4 className="font-black text-slate-800 mb-2">Tabel Pembacaan Stand Meter Gardu</h4>
                  <table className="w-full text-left border border-slate-200 rounded-lg overflow-hidden">
                    <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[10px]">
                      <tr>
                        <th className="p-2">Kode Gardu</th>
                        <th className="p-2">Lokasi / Meter</th>
                        <th className="p-2 text-right">Stand Awal</th>
                        <th className="p-2 text-right">Stand Akhir</th>
                        <th className="p-2 text-center">FK</th>
                        <th className="p-2 text-right">Total kWh</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {viewDetailItem.pembacaanMeterGarduList.map((g) => (
                        <tr key={g.id}>
                          <td className="p-2 font-bold text-slate-800">{g.kodeGardu}</td>
                          <td className="p-2 text-slate-700 font-sans">{g.namaGarduOrMeter}</td>
                          <td className="p-2 text-right">{g.standAwalKwh.toLocaleString('id-ID')}</td>
                          <td className="p-2 text-right">{g.standAkhirKwh.toLocaleString('id-ID')}</td>
                          <td className="p-2 text-center">x{g.faktorKaliMeter}</td>
                          <td className="p-2 text-right font-black text-teal-800">{g.totalKwhKirimGardu.toLocaleString('id-ID')} kWh</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-slate-400 italic">Tidak ada rincian baris meter gardu individual (Direct Total Input).</p>
              )}

              <div className="pt-2 border-t border-slate-100 space-y-1">
                <div><strong className="text-slate-700">Akar Masalah:</strong> {viewDetailItem.akarMasalah || '-'}</div>
                <div><strong className="text-slate-700">Tindakan Upaya:</strong> {viewDetailItem.tindakanUpaya || '-'}</div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => handleExportPDF(viewDetailItem)}
                className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Cetak Laporan BA PDF</span>
              </button>

              <button
                type="button"
                onClick={() => setViewDetailItem(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-all cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
