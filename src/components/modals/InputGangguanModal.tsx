import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Zap,
  Calendar,
  Clock,
  AlertTriangle,
  Users,
  Calculator,
  ListFilter,
  Camera,
  Upload,
  Trash2,
  Image as ImageIcon,
  Plus,
  RefreshCw,
  Check,
  Layers,
  GitBranch,
  ChevronDown,
  Edit3
} from 'lucide-react';
import { GangguanLog, Penyulang, SectionJaringan, SectionRestoration, MasterUnitPLN } from '../../types';
import { getDynamicUnitList, getKodeUnitByUnitName } from '../../utils/unitConfig';

interface InputGangguanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (log: GangguanLog) => void;
  penyulangList: Penyulang[];
  sectionList: SectionJaringan[];
  editItem?: GangguanLog | null;
  initialPenyulangId?: string;
  masterUnitList?: MasterUnitPLN[];
}

// Standard PLN Cause options categorized by Fault Code (Kode Gangguan)
const STANDARD_PENYEBAB_MAP: Record<string, string[]> = {
  'E-1': [
    'Pohon Tumbang Menimpa SUTM',
    'Dahan / Ranting Pohon Sentuh Jaringan SUTM',
    'Daun / Dahan Pelepah Kelapa Menimpa Kawat',
    'Pohon Bambu Roboh Mengenai SUTM'
  ],
  'E-2': [
    'Sambaran Petir / Overvoltage Atmosferik',
    'Bencana Alam Tanah Longsor / Banjir Bandang',
    'Angin Kencang / Hujan Deras'
  ],
  'E-3': [
    'Burung Hinggap / Tersangkut di Jaringan SUTM',
    'Kelelawar / Tikus / Ular Naik di Trafo / Tiang',
    'Pekerjaan Pihak Ketiga (Alat Berat / Galian)',
    'Kendaraan Menabrak Tiang Listrik'
  ],
  'E-4': [
    'Tali / Benang Layangan Kawat Menyangkut di JTM',
    'Umbul-umbul / Spanduk / Baliho Terbang Menempel SUTM',
    'Atap Seng / Plastik Terbang Menempel SUTM'
  ],
  'E-5': [
    'Tidak Ditemukan (Gangguan Sesaat / Transient Fault)',
    'Penelusuran Jalur Selesai - Hasil Nihil / Normal Kembali'
  ],
  'I-1': [
    'Isolator Tumpu / Tarik Flashover / Retak',
    'Arrester Bocor / Megger Rendah / Peledakan',
    'Jumperan Putus / Joint Panas / Connector Slack',
    'Fuse Cut Out (FCO) Peledakan / CO Element Putus',
    'Kabel SKTM / SUTM Terkelupas / Short Circuit'
  ],
  'I-2': [
    'Peralatan LBS / Recloser Fails / Trip Mekanis',
    'Cubicle / Switchgear GI / GH Merekah',
    'Relay Proteksi OCR / GFR Malfungsi',
    'CT / PT Rusak / Terbakar'
  ],
  'I-3': [
    'Trafo Distribusi Kerusakan Enclosure / Minyak Merembes',
    'Trafo Distribusi Overload / Beda Fasa',
    'Bushing Trafo Flashover'
  ],
  'I-4': [
    'Tiang Miring / Retak / Roboh Terkikis',
    'Crossarm Bengkok / Korosi Berat'
  ]
};

// Helper for parsing time difference in minutes
const calcMinDiff = (outTime: string, inTime: string): number => {
  if (!outTime || !inTime) return 0;
  try {
    const [hOut, mOut] = outTime.split(':').map(Number);
    const [hIn, mIn] = inTime.split(':').map(Number);
    let diffMinutes = (hIn * 60 + mIn) - (hOut * 60 + mOut);
    if (diffMinutes < 0) diffMinutes += 24 * 60; // handles overnight
    return isNaN(diffMinutes) ? 0 : diffMinutes;
  } catch {
    return 0;
  }
};

// Helper for adding minutes to a time string (HH:MM)
const addMinutesToTime = (timeStr: string, minutesToAdd: number): string => {
  if (!timeStr) return '08:00';
  try {
    const [h, m] = timeStr.split(':').map(Number);
    let totalMin = h * 60 + m + minutesToAdd;
    totalMin = (totalMin + 24 * 60) % (24 * 60);
    const newH = Math.floor(totalMin / 60);
    const newM = totalMin % 60;
    return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
  } catch {
    return timeStr;
  }
};

export const InputGangguanModal: React.FC<InputGangguanModalProps> = ({
  isOpen,
  onClose,
  onSave,
  penyulangList,
  sectionList,
  editItem,
  initialPenyulangId,
  masterUnitList = []
}) => {
  const [tanggal, setTanggal] = useState('2026-08-08');
  const [penyulangId, setPenyulangId] = useState(initialPenyulangId || penyulangList[0]?.id || '17');
  
  const unitList = getDynamicUnitList(masterUnitList);
  const [unit, setUnit] = useState<string>(editItem?.unit || 'ULP Baguala');
  const [kodeUnit, setKodeUnit] = useState<string>(editItem?.kodeUnit || '54110');

  useEffect(() => {
    if (isOpen) {
      if (editItem) {
        setUnit(editItem.unit || 'ULP Baguala');
        setKodeUnit(editItem.kodeUnit || '54110');
      } else {
        setUnit('ULP Baguala');
        setKodeUnit('54110');
      }
    }
  }, [isOpen, editItem]);

  const handleUnitChange = (selectedUnitName: string) => {
    setUnit(selectedUnitName);
    const matched = unitList.find((u) => u.namaUnit === selectedUnitName);
    if (matched) {
      setKodeUnit(matched.kodeUnit);
    } else {
      setKodeUnit(getKodeUnitByUnitName(selectedUnitName, masterUnitList));
    }
  };
  const [jamKeluar, setJamKeluar] = useState('08:00');
  const [jamMasuk, setJamMasuk] = useState('09:30');
  const [relayBekerja, setRelayBekerja] = useState('OCR / GFR / RECLOSER');
  
  const [arusR, setArusR] = useState<number | string>(150);
  const [satuanR, setSatuanR] = useState<'A' | 'kA'>('A');

  const [arusS, setArusS] = useState<number | string>(180);
  const [satuanS, setSatuanS] = useState<'A' | 'kA'>('A');

  const [arusT, setArusT] = useState<number | string>(160);
  const [satuanT, setSatuanT] = useState<'A' | 'kA'>('A');

  const [arusIN, setArusIN] = useState<number | string>(320);
  const [satuanIN, setSatuanIN] = useState<'A' | 'kA'>('A');

  const [penyebab, setPenyebab] = useState('Pohon tumbang / ranting / petir / komponen rusak');
  const [kodeGangguan, setKodeGangguan] = useState('E-3');
  const [detailLokasi, setDetailLokasi] = useState('e.g. Tiang BG-45 s/d BG-52 Jl. Laterhairy');
  const [catatan, setCatatan] = useState('Keterangan tindakan penanganan gangguan...');
  const [fotoPenyebab, setFotoPenyebab] = useState<string>('');

  // SAIDI SAIFI estimation inputs
  const [totalPelangganUlp, setTotalPelangganUlp] = useState<number>(48524);

  // Per-Section Restorations List
  const [sectionRestorations, setSectionRestorations] = useState<SectionRestoration[]>([]);
  const [useMultiSection, setUseMultiSection] = useState<boolean>(true);
  const [showBranchMenu, setShowBranchMenu] = useState<boolean>(false);
  const [manualEditMap, setManualEditMap] = useState<Record<number, boolean>>({});

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.match(/^image\/(jpeg|jpg|png)$/i)) {
        alert('Format file tidak didukung. Harap pilih foto berformat .JPG, .JPEG, atau .PNG');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('Ukuran foto terlalu besar. Maksimal 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setFotoPenyebab(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Derive master data calculations for the selected Penyulang (Penyulang Pangkal)
  const selectedPenyulang = penyulangList.find((p) => p.id === penyulangId);

  // 1. Direct Master Sections belonging to this Feeder
  const directSections = useMemo(() => {
    if (!selectedPenyulang) return [];
    return sectionList.filter(
      (s) =>
        s.penyulangId === penyulangId ||
        (s.namaPenyulang &&
          selectedPenyulang.namaPenyulang &&
          s.namaPenyulang.toLowerCase().trim() === selectedPenyulang.namaPenyulang.toLowerCase().trim())
    );
  }, [sectionList, penyulangId, selectedPenyulang]);

  // 2. Branch Feeders (Penyulang Percabangan) belonging to the same Gardu Induk (GI) or recognized as Percabangan
  const relatedBranchPenyulangs = useMemo(() => {
    if (!selectedPenyulang) return [];
    const currentGi = selectedPenyulang.namaGi?.toLowerCase().trim();
    return penyulangList
      .filter((p) => {
        if (p.id === selectedPenyulang.id) return false;
        const pGi = p.namaGi?.toLowerCase().trim();
        const isBranch = p.status === 'Percabangan';
        return (currentGi && pGi === currentGi) || isBranch;
      })
      .sort((a, b) => {
        const aSameGi = a.namaGi?.toLowerCase().trim() === currentGi ? 1 : 0;
        const bSameGi = b.namaGi?.toLowerCase().trim() === currentGi ? 1 : 0;
        if (aSameGi !== bSameGi) return bSameGi - aSameGi;
        return a.namaPenyulang.localeCompare(b.namaPenyulang);
      });
  }, [penyulangList, selectedPenyulang]);

  // 3. Sections that belong to those Branch Feeders
  const branchSections = useMemo(() => {
    const branchNames = new Set(relatedBranchPenyulangs.map((p) => p.namaPenyulang.toLowerCase().trim()));
    const branchIds = new Set(relatedBranchPenyulangs.map((p) => p.id));
    return sectionList.filter((s) => {
      if (s.penyulangId === penyulangId) return false;
      if (
        s.namaPenyulang &&
        selectedPenyulang?.namaPenyulang &&
        s.namaPenyulang.toLowerCase().trim() === selectedPenyulang.namaPenyulang.toLowerCase().trim()
      ) {
        return false;
      }
      return branchIds.has(s.penyulangId) || (s.namaPenyulang && branchNames.has(s.namaPenyulang.toLowerCase().trim()));
    });
  }, [sectionList, relatedBranchPenyulangs, penyulangId, selectedPenyulang]);

  // 4. Other master sections in the network
  const otherSections = useMemo(() => {
    const directIds = new Set(directSections.map((s) => s.id));
    const branchSecIds = new Set(branchSections.map((s) => s.id));
    return sectionList.filter((s) => !directIds.has(s.id) && !branchSecIds.has(s.id));
  }, [sectionList, directSections, branchSections]);

  // Available sections combined for backwards-compatibility helper
  const availableSections = useMemo(() => {
    return directSections;
  }, [directSections]);

  // Calculate total customers for current feeder from section master data
  const feederSectionsCustomerSum = useMemo(() => {
    return directSections.reduce((sum, sec) => sum + (sec.jumlahPelanggan || 0), 0);
  }, [directSections]);

  const feederTotalCustomers = useMemo(() => {
    if (selectedPenyulang?.jumlahPelanggan && selectedPenyulang.jumlahPelanggan > 0) {
      return selectedPenyulang.jumlahPelanggan;
    }
    return feederSectionsCustomerSum > 0 ? feederSectionsCustomerSum : 3354;
  }, [selectedPenyulang, feederSectionsCustomerSum]);

  // Total ULP Customers from Master Data
  const masterDataTotalUlp = useMemo(() => {
    const sumFromPenyulangs = penyulangList.reduce((acc, p) => {
      const fSections = sectionList.filter(
        (s) => s.penyulangId === p.id || s.namaPenyulang?.toLowerCase() === p.namaPenyulang?.toLowerCase()
      );
      const sumSec = fSections.reduce((sAcc, s) => sAcc + (s.jumlahPelanggan || 0), 0);
      const pPlg = p.jumlahPelanggan && p.jumlahPelanggan > 0 ? p.jumlahPelanggan : sumSec;
      return acc + pPlg;
    }, 0);

    if (sumFromPenyulangs > 0) return sumFromPenyulangs;

    const sumFromSections = sectionList.reduce(
      (sum, sec) => sum + (sec.jumlahPelanggan || 0),
      0
    );
    return sumFromSections > 0 ? sumFromSections : 69481;
  }, [penyulangList, sectionList]);

  const safeMasterUlp = masterDataTotalUlp;
  const currentSafeUlp = totalPelangganUlp > 0 ? totalPelangganUlp : safeMasterUlp;

  // Sync sections when penyulang or editItem changes
  useEffect(() => {
    if (!isOpen) return;

    if (editItem) {
      setTanggal(editItem.tanggal || '2026-08-08');
      setPenyulangId(editItem.penyulangId || penyulangList[0]?.id || '17');
      setJamKeluar(editItem.jamKeluar || '08:00');
      setJamMasuk(editItem.jamMasuk || '09:30');
      setRelayBekerja(editItem.relayBekerja || 'OCR');

      const valR = editItem.arusR || 0;
      setArusR(valR);
      setSatuanR(valR > 0 && valR < 50 ? 'kA' : 'A');

      const valS = editItem.arusS || 0;
      setArusS(valS);
      setSatuanS(valS > 0 && valS < 50 ? 'kA' : 'A');

      const valT = editItem.arusT || 0;
      setArusT(valT);
      setSatuanT(valT > 0 && valT < 50 ? 'kA' : 'A');

      const valIN = editItem.arusIN || 0;
      setArusIN(valIN);
      setSatuanIN(valIN > 0 && valIN < 50 ? 'kA' : 'A');

      setPenyebab(editItem.penyebab || '');
      setKodeGangguan(editItem.kodeGangguan || 'E-3');
      setDetailLokasi(editItem.detailLokasi || '');
      setCatatan(editItem.catatan || '');
      setFotoPenyebab(editItem.fotoPenyebab || '');
      setTotalPelangganUlp(editItem.totalPelangganUlp || safeMasterUlp);

      if (editItem.sectionRestorations && editItem.sectionRestorations.length > 0) {
        setSectionRestorations(editItem.sectionRestorations);
        setUseMultiSection(true);
      } else {
        // Build section restorations from master data or single section
        initSectionRestorations(editItem.jamKeluar || '08:00', editItem.jamMasuk || '09:30', editItem.section);
      }
    } else {
      setTanggal('2026-08-08');
      setPenyulangId(initialPenyulangId || penyulangList[0]?.id || '17');
      setJamKeluar('08:00');
      setJamMasuk('09:30');
      setRelayBekerja('OCR / GFR / RECLOSER');
      setArusR(150);
      setSatuanR('A');
      setArusS(180);
      setSatuanS('A');
      setArusT(160);
      setSatuanT('A');
      setArusIN(320);
      setSatuanIN('A');
      setPenyebab('Pohon tumbang / ranting / petir / komponen rusak');
      setKodeGangguan('E-3');
      setDetailLokasi('e.g. Tiang BG-45 s/d BG-52 Jl. Laterhairy');
      setCatatan('Keterangan tindakan penanganan gangguan...');
      setFotoPenyebab('');
      setTotalPelangganUlp(safeMasterUlp);

      initSectionRestorations('08:00', '09:30', undefined);
    }
  }, [editItem, isOpen, initialPenyulangId]);

  // Helper to initialize section restoration list from Master Data
  const initSectionRestorations = (defaultOut: string, defaultIn: string, customSectionName?: string) => {
    if (availableSections.length > 0) {
      const initialSecs: SectionRestoration[] = availableSections.map((sec, idx) => {
        const dur = calcMinDiff(defaultOut, defaultIn);
        const plg =
          sec.jumlahPelanggan !== undefined && sec.jumlahPelanggan > 0
            ? sec.jumlahPelanggan
            : (selectedPenyulang ? getPenyulangCustomerCount(selectedPenyulang) : 0);
        return {
          id: sec.id || `sec_${idx}_${Date.now()}`,
          sectionId: sec.id,
          namaSection: sec.namaSection,
          jumlahPelanggan: plg,
          jamKeluar: defaultOut,
          jamMasuk: defaultIn,
          durasiMenit: dur,
          estimasiSaidiMenit: currentSafeUlp > 0 ? (plg * dur) / currentSafeUlp : 0,
          estimasiSaifi: currentSafeUlp > 0 ? plg / currentSafeUlp : 0
        };
      });
      setSectionRestorations(initialSecs);
      setUseMultiSection(true);
    } else {
      // Single fallback section if no master sections found
      const defaultSecName = customSectionName || selectedPenyulang?.sectionTerlama || `${selectedPenyulang?.namaPenyulang || 'Feeder'} - Main Section`;
      const dur = calcMinDiff(defaultOut, defaultIn);
      const plg = feederTotalCustomers;
      setSectionRestorations([
        {
          id: `sec_0_${Date.now()}`,
          namaSection: defaultSecName,
          jumlahPelanggan: plg,
          jamKeluar: defaultOut,
          jamMasuk: defaultIn,
          durasiMenit: dur,
          estimasiSaidiMenit: currentSafeUlp > 0 ? (plg * dur) / currentSafeUlp : 0,
          estimasiSaifi: currentSafeUlp > 0 ? plg / currentSafeUlp : 0
        }
      ]);
      setUseMultiSection(false);
    }
  };

  // Re-sync sections when penyulang selection changes manually
  const handlePenyulangChange = (newPenyulangId: string) => {
    setPenyulangId(newPenyulangId);
    const newSelectedPenyulang = penyulangList.find((p) => p.id === newPenyulangId);
    const newMasterSections = sectionList.filter(
      (s) =>
        s.penyulangId === newPenyulangId ||
        (s.namaPenyulang &&
          newSelectedPenyulang?.namaPenyulang &&
          s.namaPenyulang.toLowerCase().trim() === newSelectedPenyulang.namaPenyulang.toLowerCase().trim())
    );

    if (newMasterSections.length > 0) {
      const newSecs: SectionRestoration[] = newMasterSections.map((sec, idx) => {
        const dur = calcMinDiff(jamKeluar, jamMasuk);
        const plg =
          sec.jumlahPelanggan !== undefined && sec.jumlahPelanggan > 0
            ? sec.jumlahPelanggan
            : (newSelectedPenyulang ? getPenyulangCustomerCount(newSelectedPenyulang) : 0);
        return {
          id: sec.id || `sec_${idx}_${Date.now()}`,
          sectionId: sec.id,
          namaSection: sec.namaSection,
          jumlahPelanggan: plg,
          jamKeluar,
          jamMasuk,
          durasiMenit: dur,
          estimasiSaidiMenit: currentSafeUlp > 0 ? (plg * dur) / currentSafeUlp : 0,
          estimasiSaifi: currentSafeUlp > 0 ? plg / currentSafeUlp : 0
        };
      });
      setSectionRestorations(newSecs);
      setUseMultiSection(true);
    } else {
      const plg = newSelectedPenyulang ? getPenyulangCustomerCount(newSelectedPenyulang) : 3354;
      setSectionRestorations([
        {
          id: `sec_0_${Date.now()}`,
          namaSection: `${newSelectedPenyulang?.namaPenyulang || 'Feeder'} - Main Section`,
          jumlahPelanggan: plg,
          jamKeluar,
          jamMasuk,
          durasiMenit: calcMinDiff(jamKeluar, jamMasuk),
          estimasiSaidiMenit: currentSafeUlp > 0 ? (plg * calcMinDiff(jamKeluar, jamMasuk)) / currentSafeUlp : 0,
          estimasiSaifi: currentSafeUlp > 0 ? plg / currentSafeUlp : 0
        }
      ]);
      setUseMultiSection(false);
    }
  };

  // Update a specific section item
  const updateSectionItem = (index: number, field: keyof SectionRestoration, val: any) => {
    setSectionRestorations((prev) => {
      const next = [...prev];
      const safeUlp = totalPelangganUlp > 0 ? totalPelangganUlp : safeMasterUlp;

      if (index === 0 && field === 'jamKeluar') {
        // Changing Jam Lepas on section 1 propagates to ALL sections
        setJamKeluar(val);
        return next.map((sec) => {
          const dur = calcMinDiff(val, sec.jamMasuk);
          return {
            ...sec,
            jamKeluar: val,
            durasiMenit: dur,
            estimasiSaidiMenit: safeUlp > 0 ? (sec.jumlahPelanggan * dur) / safeUlp : 0,
            estimasiSaifi: safeUlp > 0 ? sec.jumlahPelanggan / safeUlp : 0
          };
        });
      }

      const tripTime = next[0]?.jamKeluar || jamKeluar;
      const item = { ...next[index], [field]: val };
      if (index > 0) {
        item.jamKeluar = tripTime;
      }
      const dur = calcMinDiff(item.jamKeluar, item.jamMasuk);
      item.durasiMenit = dur;
      item.estimasiSaidiMenit = safeUlp > 0 ? (item.jumlahPelanggan * dur) / safeUlp : 0;
      item.estimasiSaifi = safeUlp > 0 ? item.jumlahPelanggan / safeUlp : 0;
      next[index] = item;
      return next;
    });
  };

  // Sync global header Jam Keluar & Jam Masuk to all sections
  const syncGlobalTimeToAllSections = (newOut?: string, newIn?: string) => {
    const outT = newOut !== undefined ? newOut : jamKeluar;
    const inT = newIn !== undefined ? newIn : jamMasuk;
    
    if (newOut !== undefined) setJamKeluar(newOut);
    if (newIn !== undefined) setJamMasuk(newIn);

    setSectionRestorations((prev) =>
      prev.map((sec) => {
        const dur = calcMinDiff(outT, inT);
        const safeUlp = totalPelangganUlp > 0 ? totalPelangganUlp : safeMasterUlp;
        return {
          ...sec,
          jamKeluar: outT,
          jamMasuk: inT,
          durasiMenit: dur,
          estimasiSaidiMenit: safeUlp > 0 ? (sec.jumlahPelanggan * dur) / safeUlp : 0,
          estimasiSaifi: safeUlp > 0 ? sec.jumlahPelanggan / safeUlp : 0
        };
      })
    );
  };

  // Apply incremental / staggered restoration (Penormalan Bertahap +30m)
  const applyStaggeredRestoration = (stepMinutes: number = 30) => {
    setSectionRestorations((prev) =>
      prev.map((sec, idx) => {
        const newIn = addMinutesToTime(jamMasuk, idx * stepMinutes);
        const dur = calcMinDiff(sec.jamKeluar, newIn);
        const safeUlp = totalPelangganUlp > 0 ? totalPelangganUlp : safeMasterUlp;
        return {
          ...sec,
          jamMasuk: newIn,
          durasiMenit: dur,
          estimasiSaidiMenit: safeUlp > 0 ? (sec.jumlahPelanggan * dur) / safeUlp : 0,
          estimasiSaifi: safeUlp > 0 ? sec.jumlahPelanggan / safeUlp : 0
        };
      })
    );
  };

  // Helper to reliably get customer count from Penyulang master data or sections
  const getPenyulangCustomerCount = (p: Penyulang): number => {
    if (p.jumlahPelanggan && p.jumlahPelanggan > 0) {
      return p.jumlahPelanggan;
    }
    const fSecs = sectionList.filter(
      (s) => s.penyulangId === p.id || s.namaPenyulang?.toLowerCase() === p.namaPenyulang?.toLowerCase()
    );
    const sumSec = fSecs.reduce((acc, s) => acc + (s.jumlahPelanggan || 0), 0);
    return sumSec > 0 ? sumSec : 1000;
  };

  // Helper to accurately determine whether a section is "Utama" or "Percabangan" based on Master Data
  const getSectionStatusInfo = (sec: SectionRestoration) => {
    const secName = (sec.namaSection || '').trim();
    const secNameLower = secName.toLowerCase();

    // 1. Explicit Percabangan prefix (e.g. "Percabangan LATERI 1" or "Percabangan HUTUMURI (GI PASSO)")
    if (secNameLower.startsWith('percabangan ')) {
      const rawBranchName = secName.substring(12).split('(')[0].trim().toLowerCase();
      const matchP = penyulangList.find(
        (p) =>
          p.namaPenyulang.toLowerCase().trim() === rawBranchName ||
          rawBranchName.includes(p.namaPenyulang.toLowerCase().trim())
      );
      const isBranch = matchP ? matchP.status === 'Percabangan' : true;
      return {
        status: matchP?.status || 'Percabangan',
        isPercabangan: isBranch,
        isUtama: !isBranch,
        label: isBranch ? 'Percabangan' : 'Utama',
        penyulang: matchP
      };
    }

    // 2. Bracketed feeder name "[LATERI 1] GI Passo - GH Halong"
    const bracketMatch = secName.match(/^\[(.*?)\]\s*(.*)$/);
    if (bracketMatch) {
      const pName = bracketMatch[1].trim().toLowerCase();
      const matchP = penyulangList.find((p) => p.namaPenyulang.toLowerCase().trim() === pName);
      if (matchP) {
        const isBranch = matchP.status === 'Percabangan';
        return {
          status: matchP.status,
          isPercabangan: isBranch,
          isUtama: !isBranch,
          label: isBranch ? 'Percabangan' : 'Utama',
          penyulang: matchP
        };
      }
    }

    // 3. Direct match in directSections of the currently selected Feeder
    const directMatch = directSections.find(
      (ds) => ds.namaSection.trim().toLowerCase() === secNameLower || ds.id === sec.sectionId
    );
    if (directMatch) {
      const feederStatus = selectedPenyulang?.status || 'Utama';
      const isBranch = feederStatus === 'Percabangan';
      return {
        status: feederStatus,
        isPercabangan: isBranch,
        isUtama: !isBranch,
        label: isBranch ? 'Percabangan' : 'Utama',
        penyulang: selectedPenyulang
      };
    }

    // 4. Match in master sectionList
    const matchedMasterSec = sectionList.find(
      (s) => s.namaSection.trim().toLowerCase() === secNameLower || s.id === sec.sectionId
    );
    if (matchedMasterSec) {
      const parentP = penyulangList.find(
        (p) =>
          p.id === matchedMasterSec.penyulangId ||
          p.namaPenyulang.toLowerCase().trim() === (matchedMasterSec.namaPenyulang || '').toLowerCase().trim()
      );
      if (parentP) {
        const isBranch = parentP.status === 'Percabangan';
        return {
          status: parentP.status,
          isPercabangan: isBranch,
          isUtama: !isBranch,
          label: isBranch ? 'Percabangan' : 'Utama',
          penyulang: parentP
        };
      }
    }

    // 5. Match direct penyulang name in penyulangList
    const matchedP = penyulangList.find(
      (p) => p.namaPenyulang.toLowerCase().trim() === secNameLower
    );
    if (matchedP) {
      const isBranch = matchedP.status === 'Percabangan';
      return {
        status: matchedP.status,
        isPercabangan: isBranch,
        isUtama: !isBranch,
        label: isBranch ? 'Percabangan' : 'Utama',
        penyulang: matchedP
      };
    }

    // Fallback: Use selected feeder status
    const fallbackStatus = selectedPenyulang?.status || 'Utama';
    const isFallbackBranch = fallbackStatus === 'Percabangan';
    return {
      status: fallbackStatus,
      isPercabangan: isFallbackBranch,
      isUtama: !isFallbackBranch,
      label: isFallbackBranch ? 'Percabangan' : 'Utama',
      penyulang: selectedPenyulang
    };
  };

  // Add custom section item
  const addSectionItem = () => {
    const newIdx = sectionRestorations.length + 1;
    const plg = 1000;
    const dur = calcMinDiff(jamKeluar, jamMasuk);
    setSectionRestorations((prev) => [
      ...prev,
      {
        id: `sec_${Date.now()}_${Math.random()}`,
        namaSection: `Section ${newIdx}`,
        jumlahPelanggan: plg,
        jamKeluar,
        jamMasuk,
        durasiMenit: dur,
        estimasiSaidiMenit: currentSafeUlp > 0 ? (plg * dur) / currentSafeUlp : 0,
        estimasiSaifi: currentSafeUlp > 0 ? plg / currentSafeUlp : 0
      }
    ]);
  };

  // Add branch feeder as a section item
  const addBranchSectionItem = (branch: Penyulang) => {
    const plg = getPenyulangCustomerCount(branch);
    const dur = calcMinDiff(jamKeluar, jamMasuk);
    setSectionRestorations((prev) => [
      ...prev,
      {
        id: `sec_br_${Date.now()}_${Math.random()}`,
        namaSection: `Percabangan ${branch.namaPenyulang}`,
        jumlahPelanggan: plg,
        jamKeluar,
        jamMasuk,
        durasiMenit: dur,
        estimasiSaidiMenit: currentSafeUlp > 0 ? (plg * dur) / currentSafeUlp : 0,
        estimasiSaifi: currentSafeUlp > 0 ? plg / currentSafeUlp : 0
      }
    ]);
  };

  // Handler for section selection dropdown with automatic customer count sync
  const handleSectionOptionChange = (index: number, selectedVal: string) => {
    if (!selectedVal) return;

    // 1. Check direct master section match
    const directMatch = directSections.find((s) => s.namaSection === selectedVal);
    if (directMatch) {
      updateSectionItem(index, 'namaSection', directMatch.namaSection);
      const plg =
        directMatch.jumlahPelanggan !== undefined && directMatch.jumlahPelanggan > 0
          ? directMatch.jumlahPelanggan
          : (selectedPenyulang ? getPenyulangCustomerCount(selectedPenyulang) : 0);
      updateSectionItem(index, 'jumlahPelanggan', plg);
      return;
    }

    // 2. Check branch feeder match (e.g. "Percabangan LATERI 1" or "Percabangan HUTUMURI")
    const cleanBranchName = selectedVal.replace(/^Percabangan\s+/i, '').split('(')[0].trim().toLowerCase();
    const branchPenyulangMatch = penyulangList.find(
      (p) =>
        `Percabangan ${p.namaPenyulang}`.toLowerCase() === selectedVal.toLowerCase() ||
        p.namaPenyulang.toLowerCase() === cleanBranchName ||
        selectedVal.toLowerCase().startsWith(`percabangan ${p.namaPenyulang.toLowerCase()}`)
    );
    if (branchPenyulangMatch) {
      updateSectionItem(index, 'namaSection', `Percabangan ${branchPenyulangMatch.namaPenyulang}`);
      const plg = getPenyulangCustomerCount(branchPenyulangMatch);
      updateSectionItem(index, 'jumlahPelanggan', plg);
      return;
    }

    // 3. Check branch section match (e.g. "[LATERI 1] GI Passo - GH Halong" or s.namaSection)
    const branchSecMatch = branchSections.find(
      (s) =>
        `[${s.namaPenyulang}] ${s.namaSection}` === selectedVal ||
        s.namaSection === selectedVal ||
        s.id === selectedVal
    );
    if (branchSecMatch) {
      updateSectionItem(index, 'namaSection', `[${branchSecMatch.namaPenyulang}] ${branchSecMatch.namaSection}`);
      const parentP = penyulangList.find(
        (p) => p.id === branchSecMatch.penyulangId || p.namaPenyulang === branchSecMatch.namaPenyulang
      );
      const plg =
        branchSecMatch.jumlahPelanggan !== undefined && branchSecMatch.jumlahPelanggan > 0
          ? branchSecMatch.jumlahPelanggan
          : (parentP ? getPenyulangCustomerCount(parentP) : 0);
      updateSectionItem(index, 'jumlahPelanggan', plg);
      return;
    }

    // 4. Check other master section match
    const otherSecMatch = otherSections.find(
      (s) =>
        `[${s.namaPenyulang}] ${s.namaSection}` === selectedVal ||
        s.namaSection === selectedVal ||
        s.id === selectedVal
    );
    if (otherSecMatch) {
      updateSectionItem(index, 'namaSection', `[${otherSecMatch.namaPenyulang}] ${otherSecMatch.namaSection}`);
      const parentP = penyulangList.find(
        (p) => p.id === otherSecMatch.penyulangId || p.namaPenyulang === otherSecMatch.namaPenyulang
      );
      const plg =
        otherSecMatch.jumlahPelanggan !== undefined && otherSecMatch.jumlahPelanggan > 0
          ? otherSecMatch.jumlahPelanggan
          : (parentP ? getPenyulangCustomerCount(parentP) : 0);
      updateSectionItem(index, 'jumlahPelanggan', plg);
      return;
    }

    // 5. Default fallback for custom section names
    updateSectionItem(index, 'namaSection', selectedVal);
  };

  // Toggle manual text input for section name
  const toggleManualEdit = (idx: number) => {
    setManualEditMap((prev) => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  // Remove section item
  const removeSectionItem = (index: number) => {
    if (sectionRestorations.length <= 1) {
      alert('Minimal harus ada 1 Section Jaringan.');
      return;
    }
    setSectionRestorations((prev) => prev.filter((_, i) => i !== index));
  };

  // AGGREGATE CALCULATIONS FROM SECTIONS
  const aggregateMetrics = useMemo(() => {
    const totalPadam = sectionRestorations.reduce((acc, s) => acc + (Number(s.jumlahPelanggan) || 0), 0);
    const safeUlp = totalPelangganUlp > 0 ? totalPelangganUlp : safeMasterUlp;

    const totalSaidiMenit = sectionRestorations.reduce((acc, s) => {
      const dur = calcMinDiff(s.jamKeluar, s.jamMasuk);
      return acc + (safeUlp > 0 ? ((Number(s.jumlahPelanggan) || 0) * dur) / safeUlp : 0);
    }, 0);

    const totalSaifi = sectionRestorations.reduce((acc, s) => {
      return acc + (safeUlp > 0 ? (Number(s.jumlahPelanggan) || 0) / safeUlp : 0);
    }, 0);

    const totalSaidiJam = totalSaidiMenit / 60;

    // Earliest out & latest in
    let minOut = jamKeluar;
    let maxIn = jamMasuk;
    if (sectionRestorations.length > 0) {
      minOut = sectionRestorations[0].jamKeluar || jamKeluar;
      maxIn = sectionRestorations[sectionRestorations.length - 1].jamMasuk || jamMasuk;
    }

    const sectionSummaryNames = sectionRestorations.map((s) => s.namaSection).filter(Boolean).join(', ');

    return {
      totalPadam,
      totalSaidiMenit,
      totalSaidiJam,
      totalSaifi,
      minOut,
      maxIn,
      sectionSummaryNames
    };
  }, [sectionRestorations, totalPelangganUlp, safeMasterUlp, jamKeluar, jamMasuk]);

  const parseArusValue = (val: string | number): number => {
    if (val === null || val === undefined || val === '') return 0;
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    const cleaned = String(val).replace(',', '.').trim();
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  };

  const handleSatuanChange = (
    newUnit: 'A' | 'kA',
    currentUnit: 'A' | 'kA',
    currentVal: string | number,
    setVal: (val: string | number) => void,
    setUnit: (unit: 'A' | 'kA') => void
  ) => {
    if (newUnit === currentUnit) return;
    setUnit(newUnit);
    const num = parseArusValue(currentVal);
    if (num > 0) {
      if (newUnit === 'kA' && currentUnit === 'A') {
        const converted = Number((num / 1000).toFixed(3));
        setVal(converted);
      } else if (newUnit === 'A' && currentUnit === 'kA') {
        const converted = Number((num * 1000).toFixed(1));
        setVal(converted);
      }
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPenyulang) return;

    const valR = parseArusValue(arusR);
    const valS = parseArusValue(arusS);
    const valT = parseArusValue(arusT);
    const valIN = parseArusValue(arusIN);

    const calculatedArusR = satuanR === 'kA' ? valR * 1000 : valR;
    const calculatedArusS = satuanS === 'kA' ? valS * 1000 : valS;
    const calculatedArusT = satuanT === 'kA' ? valT * 1000 : valT;
    const calculatedArusIN = satuanIN === 'kA' ? valIN * 1000 : valIN;

    const overallSectionName =
      sectionRestorations.length > 1
        ? `${sectionRestorations[0]?.namaSection || 'Section 1'} - ${sectionRestorations[sectionRestorations.length - 1]?.namaSection || 'Ujung'} (${sectionRestorations.length} Section)`
        : sectionRestorations[0]?.namaSection || selectedPenyulang.sectionTerlama || 'GH Asten - Ujung Jaringan';

    const maxDurationMin = calcMinDiff(aggregateMetrics.minOut, aggregateMetrics.maxIn);
    const overallDurasiStr = `${Math.floor(maxDurationMin / 60)}j ${maxDurationMin % 60}m`;

    const newLog: GangguanLog = {
      id: editItem ? editItem.id : `g_${Date.now()}`,
      tanggal,
      penyulangId,
      namaPenyulang: selectedPenyulang.namaPenyulang,
      section: overallSectionName,
      jamKeluar: aggregateMetrics.minOut,
      jamMasuk: aggregateMetrics.maxIn,
      durasi: overallDurasiStr,
      relayBekerja,
      arusR: calculatedArusR || 0,
      arusS: calculatedArusS || 0,
      arusT: calculatedArusT || 0,
      arusIN: calculatedArusIN || 0,
      penyebab,
      kodeGangguan,
      detailLokasi,
      catatan,
      ...(fotoPenyebab ? { fotoPenyebab } : {}),
      // SAIDI SAIFI calculation values
      jumlahPelangganPadam: Number(aggregateMetrics.totalPadam) || 0,
      totalPelangganUlp: Number(currentSafeUlp),
      estimasiSaidiMenit: Number(aggregateMetrics.totalSaidiMenit.toFixed(4)),
      estimasiSaidiJam: Number(aggregateMetrics.totalSaidiJam.toFixed(5)),
      estimasiSaifi: Number(aggregateMetrics.totalSaifi.toFixed(5)),
      // Section restorations breakdown
      sectionRestorations,
      unit,
      kodeUnit
    };

    onSave(newLog);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pt-10 bg-slate-950/75 backdrop-blur-md font-sans overflow-y-auto">
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl text-slate-800 flex flex-col my-auto">
        
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600">
              <Zap className="w-5 h-5 fill-rose-600 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                  Input Gangguan Penyulang
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black uppercase">
                  Penormalan Per Section
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Input jam lepas & penormalan per section tersinkron Master Data Section & SAIDI SAIFI
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body - Scrollable */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-4 space-y-4 text-xs pr-1">
          {/* ULP & Kode ULP Selection (Synchronized with Master Unit) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-blue-50/60 rounded-2xl border border-blue-200/80">
            <div>
              <label className="block font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-600" />
                Unit PLN (ULP) *
              </label>
              <select
                value={unit}
                onChange={(e) => handleUnitChange(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-blue-200 rounded-xl text-xs text-slate-900 font-semibold focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                {unitList.map((u, idx) => (
                  <option key={`gangguan_u_${u.kodeUnit}_${idx}`} value={u.namaUnit}>
                    {u.namaUnit} ({u.kodeUnit})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-800 mb-1">
                Kode ULP (Sinkron Master)
              </label>
              <input
                type="text"
                value={kodeUnit}
                readOnly
                className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-700 font-mono font-bold"
              />
            </div>
          </div>

          {/* Tanggal & Penyulang Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Tanggal Gangguan *
              </label>
              <input
                type="date"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                required
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Nama Penyulang (Master Data) *
              </label>
              <select
                value={penyulangId}
                onChange={(e) => handlePenyulangChange(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-extrabold cursor-pointer text-blue-900"
              >
                {penyulangList.map((p) => (
                  <option key={p.id} value={p.id} className="bg-white">
                    Penyulang {p.namaPenyulang} ({p.namaGi}) • {p.jumlahPelanggan?.toLocaleString('id-ID') || 0} Plg
                  </option>
                ))}
              </select>
            </div>
          </div>


          {/* SECTION RESTORATION TABLE CARD (INPUT PER SECTION) */}
          <div className="p-3.5 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-3 shadow-lg">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" />
                <span className="font-extrabold text-xs text-amber-300 uppercase tracking-wider">
                  Penormalan Section Jaringan & Percabangan
                </span>
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[10px] border border-amber-500/30">
                  {sectionRestorations.length} Section
                </span>
              </div>

              {/* Quick Action Buttons */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => applyStaggeredRestoration(30)}
                  className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1"
                  title="Otomatis tambah +30 menit jam masuk tiap section (Penormalan Bertahap)"
                >
                  <Clock className="w-3 h-3 text-amber-400" />
                  <span>Bertahap (+30m)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handlePenyulangChange(penyulangId)}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1"
                  title="Sync ulang daftar section dari Master Data"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Reset Master</span>
                </button>

                {/* Quick Add Branch (Percabangan) Menu */}
                {relatedBranchPenyulangs.length > 0 && (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowBranchMenu(!showBranchMenu)}
                      className="px-2.5 py-1 bg-emerald-700/80 hover:bg-emerald-600 text-emerald-100 border border-emerald-500/50 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 shadow-xs"
                      title="Tambah Percabangan Jaringan (misal: LATERI 1, HUTUMURI, dll)"
                    >
                      <GitBranch className="w-3 h-3 text-emerald-300" />
                      <span>+ Percabangan</span>
                      <ChevronDown className="w-3 h-3 text-emerald-300" />
                    </button>

                    {showBranchMenu && (
                      <div className="absolute right-0 top-full mt-1.5 w-64 bg-slate-900 border border-emerald-500/40 rounded-xl shadow-2xl p-1.5 z-40 max-h-60 overflow-y-auto space-y-1">
                        <div className="px-2 py-1 text-[10px] font-extrabold text-emerald-400 border-b border-slate-800 flex items-center justify-between">
                          <span>PILIH PERCABANGAN ({selectedPenyulang?.namaGi || 'GI'})</span>
                          <button
                            type="button"
                            onClick={() => setShowBranchMenu(false)}
                            className="text-slate-400 hover:text-white"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                        {relatedBranchPenyulangs.map((bp) => (
                          <button
                            key={bp.id}
                            type="button"
                            onClick={() => {
                              addBranchSectionItem(bp);
                              setShowBranchMenu(false);
                            }}
                            className="w-full text-left px-2 py-1.5 rounded-lg text-[11px] font-bold text-slate-200 hover:bg-emerald-950/80 hover:text-emerald-300 hover:border-emerald-500/30 border border-transparent transition-all flex items-center justify-between"
                          >
                            <span className="truncate">Percabangan {bp.namaPenyulang}</span>
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 shrink-0 ml-1">
                              {bp.jumlahPelanggan?.toLocaleString('id-ID') || 0} Plg
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <button
                  type="button"
                  onClick={addSectionItem}
                  className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 shadow-xs"
                >
                  <Plus className="w-3 h-3" />
                  <span>+ Section</span>
                </button>
              </div>
            </div>

            {/* List of Section Restoration Items */}
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {sectionRestorations.map((sec, idx) => {
                const durMin = calcMinDiff(sec.jamKeluar, sec.jamMasuk);
                const statusInfo = getSectionStatusInfo(sec);
                const isManualEditing = manualEditMap[idx];

                return (
                  <div
                    key={sec.id || idx}
                    className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2 transition-all hover:border-slate-700"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-extrabold flex items-center justify-center shrink-0 border border-amber-500/30">
                          {idx + 1}
                        </span>

                        {/* Section Name Selection or Manual Text Input */}
                        {!isManualEditing ? (
                          <div className="flex items-center gap-1.5 flex-1 min-w-0">
                            <select
                              value={sec.namaSection}
                              onChange={(e) => handleSectionOptionChange(idx, e.target.value)}
                              className="bg-slate-900 border border-slate-700 text-amber-300 font-extrabold text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-amber-500 truncate flex-1 min-w-0 cursor-pointer"
                            >
                              {/* Current Selected Value */}
                              <option value={sec.namaSection}>{sec.namaSection}</option>

                              {/* Optgroup 1: Section Utama Feeder */}
                              {directSections.length > 0 && (
                                <optgroup label={`⚡ Section Utama (${selectedPenyulang?.namaPenyulang || 'Utama'})`}>
                                  {directSections.map((s) => (
                                    <option key={`ds_${s.id}`} value={s.namaSection}>
                                      {s.namaSection} ({s.jumlahPelanggan?.toLocaleString('id-ID') || 0} Plg)
                                    </option>
                                  ))}
                                </optgroup>
                              )}

                              {/* Optgroup 2: Percabangan Pangkal Feeder */}
                              {relatedBranchPenyulangs.length > 0 && (
                                <optgroup label={`🔀 Percabangan Pangkal (${selectedPenyulang?.namaGi || 'GI Terkait'})`}>
                                  {relatedBranchPenyulangs.map((p) => (
                                    <option key={`p_${p.id}`} value={`Percabangan ${p.namaPenyulang}`}>
                                      Percabangan {p.namaPenyulang} ({p.jumlahPelanggan?.toLocaleString('id-ID') || 0} Plg) • {p.namaGi}
                                    </option>
                                  ))}
                                </optgroup>
                              )}

                              {/* Optgroup 3: Section Milik Percabangan */}
                              {branchSections.length > 0 && (
                                <optgroup label={`📑 Section Milik Percabangan (${selectedPenyulang?.namaGi || 'GI'})`}>
                                  {branchSections.map((s) => (
                                    <option key={`bs_${s.id}`} value={`[${s.namaPenyulang}] ${s.namaSection}`}>
                                      [{s.namaPenyulang}] {s.namaSection} ({s.jumlahPelanggan?.toLocaleString('id-ID') || 0} Plg)
                                    </option>
                                  ))}
                                </optgroup>
                              )}

                              {/* Optgroup 4: Master Section Lainnya */}
                              {otherSections.length > 0 && (
                                <optgroup label="🌐 Section Master Lainnya">
                                  {otherSections.map((s) => (
                                    <option key={`os_${s.id}`} value={`[${s.namaPenyulang}] ${s.namaSection}`}>
                                      [{s.namaPenyulang}] {s.namaSection} ({s.jumlahPelanggan?.toLocaleString('id-ID') || 0} Plg)
                                    </option>
                                  ))}
                                </optgroup>
                              )}
                            </select>

                            <button
                              type="button"
                              onClick={() => toggleManualEdit(idx)}
                              className="p-1 text-slate-400 hover:text-amber-300 hover:bg-slate-800 rounded transition-colors shrink-0"
                              title="Ketik manual nama section kustom"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 flex-1 min-w-0">
                            <input
                              type="text"
                              value={sec.namaSection}
                              onChange={(e) => updateSectionItem(idx, 'namaSection', e.target.value)}
                              placeholder="Ketik nama section..."
                              className="bg-slate-900 border border-amber-500/60 text-amber-300 font-bold text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-amber-400 flex-1 min-w-0"
                            />
                            <button
                              type="button"
                              onClick={() => toggleManualEdit(idx)}
                              className="p-1 text-emerald-400 hover:bg-slate-800 rounded transition-colors shrink-0"
                              title="Pilih dari daftar master/percabangan"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}

                        {/* Status Badge: Utama vs Percabangan */}
                        {statusInfo.label === 'Utama' ? (
                          <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 text-[9px] font-extrabold rounded-md shrink-0 border border-blue-500/30 flex items-center gap-1">
                            <Zap className="w-2.5 h-2.5 text-blue-400" />
                            <span>Utama</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[9px] font-extrabold rounded-md shrink-0 border border-emerald-500/30 flex items-center gap-1">
                            <GitBranch className="w-2.5 h-2.5 text-emerald-400" />
                            <span>Percabangan</span>
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => removeSectionItem(idx)}
                        className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded cursor-pointer transition-colors shrink-0"
                        title="Hapus section ini"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Customer count & Section Times */}
                    <div className={`grid gap-2 items-center text-[11px] ${idx === 0 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2'}`}>
                      {/* Jumlah Pelanggan Section */}
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-0.5">Pelanggan Section</label>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={sec.jumlahPelanggan}
                            onChange={(e) => updateSectionItem(idx, 'jumlahPelanggan', Number(e.target.value))}
                            min={0}
                            className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono font-bold focus:outline-none focus:border-blue-400 text-xs"
                          />
                          <span className="text-[10px] text-slate-400">Plg</span>
                        </div>
                      </div>

                      {/* Jam Keluar Section - Hanya di Section Pertama */}
                      {idx === 0 && (
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-0.5">Jam Lepas</label>
                          <input
                            type="time"
                            value={sec.jamKeluar}
                            onChange={(e) => updateSectionItem(idx, 'jamKeluar', e.target.value)}
                            className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-amber-200 font-mono font-bold focus:outline-none focus:border-amber-500 text-xs"
                          />
                        </div>
                      )}

                      {/* Jam Masuk Section */}
                      <div>
                        <label className="text-[10px] text-emerald-400 font-bold block mb-0.5">Jam Masuk (Normal)</label>
                        <input
                          type="time"
                          value={sec.jamMasuk}
                          onChange={(e) => updateSectionItem(idx, 'jamMasuk', e.target.value)}
                          className="w-full px-2 py-1 bg-emerald-950/70 border border-emerald-600/70 rounded-lg text-emerald-300 font-mono font-bold focus:outline-none focus:border-emerald-400 text-xs shadow-xs"
                        />
                      </div>
                    </div>

                    {/* Realtime Duration & SAIDI Contribution for this section */}
                    <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-800/80 text-slate-400">
                      <span className="flex items-center gap-1 text-slate-300">
                        <span>Durasi Section:</span>
                        <strong className="text-emerald-300 font-mono">{Math.floor(durMin / 60)}j {durMin % 60}m ({durMin}m)</strong>
                      </span>

                      <div className="flex items-center gap-2">
                        <span className="text-blue-300 font-mono">
                          SAIDI: <strong>{((sec.jumlahPelanggan * durMin) / currentSafeUlp).toFixed(3)}</strong> m/plg
                        </span>
                        <span className="text-purple-300 font-mono">
                          SAIFI: <strong>{(sec.jumlahPelanggan / currentSafeUlp).toFixed(4)}</strong> k/plg
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SAIDI SAIFI ESTIMATION CALCULATION CARD (SUMMARY) */}
          <div className="p-3.5 bg-gradient-to-br from-slate-900 to-blue-950 text-white rounded-2xl border border-blue-800/50 space-y-3 shadow-md">
            <div className="flex items-center justify-between border-b border-blue-800/60 pb-2">
              <div className="flex items-center gap-2">
                <Calculator className="w-4 h-4 text-blue-400" />
                <span className="font-bold text-xs text-blue-200 uppercase tracking-wider">
                  Kalkulasi Estimasi SAIDI & SAIFI Event
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-semibold text-[10px]">
                Akumulasi Multi Section
              </span>
            </div>

            {/* Master Data Sync Summary Bar */}
            <div className="p-2 bg-blue-900/40 rounded-xl border border-blue-800/40 text-[11px] space-y-1">
              <div className="flex items-center justify-between text-blue-200">
                <span>Penyulang <strong>{selectedPenyulang?.namaPenyulang || 'Terpilih'}</strong> ({sectionRestorations.length} Section Padam):</span>
                <span className="font-bold text-amber-300 font-mono">{aggregateMetrics.totalPadam.toLocaleString('id-ID')} Plg Padam</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>Total Pelanggan ULP (Akumulasi Master Data):</span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    value={totalPelangganUlp}
                    onChange={(e) => setTotalPelangganUlp(Number(e.target.value))}
                    className="w-20 px-1.5 py-0.5 bg-slate-950 border border-blue-700/60 rounded text-center text-xs font-bold text-emerald-300 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setTotalPelangganUlp(safeMasterUlp)}
                    className="text-[9px] text-emerald-300 hover:text-white underline cursor-pointer"
                    title="Sync ke Master Data ULP"
                  >
                    Sync
                  </button>
                </div>
              </div>
            </div>

            {/* Calculated Badges */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="p-2.5 rounded-xl bg-blue-900/50 border border-blue-700/50">
                <span className="text-[10px] text-blue-300 uppercase font-semibold block">ESTIMASI SAIDI EVENT</span>
                <div className="text-sm font-extrabold text-blue-300 mt-0.5">
                  {aggregateMetrics.totalSaidiMenit.toFixed(3)} <span className="text-[10px] font-normal">Menit/Plg</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">({aggregateMetrics.totalSaidiJam.toFixed(4)} Jam/Plg)</span>
              </div>

              <div className="p-2.5 rounded-xl bg-purple-900/50 border border-purple-700/50">
                <span className="text-[10px] text-purple-300 uppercase font-semibold block">ESTIMASI SAIFI EVENT</span>
                <div className="text-sm font-extrabold text-purple-300 mt-0.5">
                  {aggregateMetrics.totalSaifi.toFixed(4)} <span className="text-[10px] font-normal">Kali/Plg</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">({aggregateMetrics.totalPadam.toLocaleString('id-ID')} / {currentSafeUlp.toLocaleString('id-ID')})</span>
              </div>
            </div>
          </div>

          {/* Relay Bekerja */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block font-bold text-slate-700">Relay Bekerja *</label>
              <span className="text-[10px] text-blue-600 font-semibold">Klik Pilihan Preset Relay</span>
            </div>

            {/* Clickable Preset Relay Chips */}
            <div className="flex flex-wrap gap-1.5 pb-0.5">
              {['OCR', 'GFR', 'RECLOSER', 'UFR', 'REF', 'SSO'].map((relay) => {
                const isSelected = (relayBekerja || '')
                  .toUpperCase()
                  .split('/')
                  .map((s) => s.trim())
                  .includes(relay);
                return (
                  <button
                    key={relay}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        const parts = (relayBekerja || '')
                          .split('/')
                          .map((p) => p.trim())
                          .filter((p) => p && p.toUpperCase() !== relay);
                        setRelayBekerja(parts.join(' / '));
                      } else {
                        const parts = (relayBekerja || '')
                          .split('/')
                          .map((p) => p.trim())
                          .filter(Boolean);
                        if (!parts.includes(relay)) {
                          parts.push(relay);
                        }
                        setRelayBekerja(parts.join(' / '));
                      }
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs ring-2 ring-blue-500/20'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                    }`}
                  >
                    {isSelected ? '✓ ' : '+ '}{relay}
                  </button>
                );
              })}

              {/* Combo Preset Options */}
              {['OCR / GFR', 'OCR / GFR / RECLOSER'].map((combo) => {
                const isMatch = (relayBekerja || '').trim().toUpperCase() === combo.toUpperCase();
                return (
                  <button
                    key={combo}
                    type="button"
                    onClick={() => setRelayBekerja(combo)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                      isMatch
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs ring-2 ring-emerald-500/20'
                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                    }`}
                  >
                    {combo}
                  </button>
                );
              })}
            </div>

            <input
              type="text"
              value={relayBekerja}
              onChange={(e) => setRelayBekerja(e.target.value)}
              placeholder="OCR / GFR / RECLOSER / UFR..."
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
            />
          </div>

          {/* Arus RST & IN */}
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-slate-700">Relay Arus R S T *</label>
                <span className="text-[10px] text-blue-600 font-semibold">Pilih Satuan (A / kA) per Kolom</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {/* Phase R */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Fasa R</label>
                  <div className="flex rounded-xl border border-slate-200 bg-slate-50 overflow-hidden focus-within:bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={arusR}
                      onChange={(e) => setArusR(e.target.value)}
                      placeholder="Arus R"
                      className="w-full px-2 py-2 bg-transparent text-xs text-slate-800 font-medium focus:outline-none min-w-0"
                    />
                    <select
                      value={satuanR}
                      onChange={(e) => handleSatuanChange(e.target.value as 'A' | 'kA', satuanR, arusR, setArusR, setSatuanR)}
                      className="px-1.5 py-2 bg-slate-200/80 border-l border-slate-200 text-[11px] font-extrabold text-slate-800 cursor-pointer focus:outline-none hover:bg-slate-300 shrink-0"
                    >
                      <option value="A">A</option>
                      <option value="kA">kA</option>
                    </select>
                  </div>
                </div>

                {/* Phase S */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Fasa S</label>
                  <div className="flex rounded-xl border border-slate-200 bg-slate-50 overflow-hidden focus-within:bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={arusS}
                      onChange={(e) => setArusS(e.target.value)}
                      placeholder="Arus S"
                      className="w-full px-2 py-2 bg-transparent text-xs text-slate-800 font-medium focus:outline-none min-w-0"
                    />
                    <select
                      value={satuanS}
                      onChange={(e) => handleSatuanChange(e.target.value as 'A' | 'kA', satuanS, arusS, setArusS, setSatuanS)}
                      className="px-1.5 py-2 bg-slate-200/80 border-l border-slate-200 text-[11px] font-extrabold text-slate-800 cursor-pointer focus:outline-none hover:bg-slate-300 shrink-0"
                    >
                      <option value="A">A</option>
                      <option value="kA">kA</option>
                    </select>
                  </div>
                </div>

                {/* Phase T */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Fasa T</label>
                  <div className="flex rounded-xl border border-slate-200 bg-slate-50 overflow-hidden focus-within:bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={arusT}
                      onChange={(e) => setArusT(e.target.value)}
                      placeholder="Arus T"
                      className="w-full px-2 py-2 bg-transparent text-xs text-slate-800 font-medium focus:outline-none min-w-0"
                    />
                    <select
                      value={satuanT}
                      onChange={(e) => handleSatuanChange(e.target.value as 'A' | 'kA', satuanT, arusT, setArusT, setSatuanT)}
                      className="px-1.5 py-2 bg-slate-200/80 border-l border-slate-200 text-[11px] font-extrabold text-slate-800 cursor-pointer focus:outline-none hover:bg-slate-300 shrink-0"
                    >
                      <option value="A">A</option>
                      <option value="kA">kA</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Arus IN */}
            <div>
              <div className="flex items-center justify-between mb-0.5">
                <label className="block text-[10px] font-bold text-slate-500">Arus Neutral / IN</label>
                <span className="text-[10px] text-slate-400 font-medium">Bisa 0 jika tidak ada arus netral</span>
              </div>
              <div className="flex rounded-xl border border-slate-200 bg-slate-50 overflow-hidden focus-within:bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                <input
                  type="text"
                  inputMode="decimal"
                  value={arusIN}
                  onChange={(e) => setArusIN(e.target.value)}
                  placeholder="Arus Neutral IN"
                  className="w-full px-3 py-2.5 bg-transparent text-xs text-slate-800 font-medium focus:outline-none min-w-0"
                />
                <select
                  value={satuanIN}
                  onChange={(e) => handleSatuanChange(e.target.value as 'A' | 'kA', satuanIN, arusIN, setArusIN, setSatuanIN)}
                  className="px-2.5 py-2.5 bg-slate-200/80 border-l border-slate-200 text-[11px] font-extrabold text-slate-800 cursor-pointer focus:outline-none hover:bg-slate-300 shrink-0"
                >
                  <option value="A">A (Ampere)</option>
                  <option value="kA">kA (Kiloampere)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Kode Gangguan */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Kode Gangguan (PLN Standard) *</label>
            <select
              value={kodeGangguan}
              onChange={(e) => {
                const newCode = e.target.value;
                setKodeGangguan(newCode);
                const options = STANDARD_PENYEBAB_MAP[newCode];
                if (options && options.length > 0 && (!penyebab || penyebab.startsWith('Pohon') || penyebab.startsWith('Tidak Ditemukan'))) {
                  setPenyebab(options[0]);
                }
              }}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium cursor-pointer"
            >
              <optgroup label="Eksternal (E)">
                <option value="E-1" className="bg-white">E-1 (Pohon / Ranting / Dahan)</option>
                <option value="E-2" className="bg-white">E-2 (Bencana Alam / Petir / Hujan Deras)</option>
                <option value="E-3" className="bg-white">E-3 (Pekerjaan Pihak III / Binatang / Kendaraan)</option>
                <option value="E-4" className="bg-white">E-4 (Layang-layang / Umbul-umbul / Baliho)</option>
                <option value="E-5" className="bg-white">Tidak Ditemukan</option>
              </optgroup>
              <optgroup label="Internal (I)">
                <option value="I-1" className="bg-white">I-1 (Komponen JTM / Isolator / Arrester)</option>
                <option value="I-2" className="bg-white">I-2 (Peralatan JTM / LBS / Recloser / Relay)</option>
                <option value="I-3" className="bg-white">I-3 (Trafo Distribusi & Bushing)</option>
                <option value="I-4" className="bg-white">I-4 (Tiang / Crossarm)</option>
              </optgroup>
            </select>
          </div>

          {/* Penyebab Gangguan dengan Pilihan Dropdown Preset + Custom */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-bold text-slate-700">Penyebab Gangguan *</label>
              <span className="text-[10px] text-blue-600 font-semibold flex items-center gap-1">
                <ListFilter className="w-3 h-3" /> Pilihan Standard & Custom
              </span>
            </div>

            <select
              value={
                STANDARD_PENYEBAB_MAP[kodeGangguan]?.includes(penyebab)
                  ? penyebab
                  : 'custom'
              }
              onChange={(e) => {
                if (e.target.value !== 'custom') {
                  setPenyebab(e.target.value);
                }
              }}
              className="w-full px-3 py-2.5 bg-blue-50/50 border border-blue-200 rounded-xl text-xs text-slate-800 font-semibold focus:outline-none focus:bg-white focus:border-blue-500 mb-2 cursor-pointer"
            >
              <option value="" disabled>-- Pilih Preset Penyebab Gangguan --</option>
              {(STANDARD_PENYEBAB_MAP[kodeGangguan] || []).map((opt) => (
                <option key={opt} value={opt} className="bg-white">
                  {opt}
                </option>
              ))}
              <option value="custom" className="bg-white text-blue-700 font-bold">
                + Ketik / Edit Penyebab Manual...
              </option>
            </select>

            <input
              type="text"
              value={penyebab}
              onChange={(e) => setPenyebab(e.target.value)}
              placeholder="Detail penyebab gangguan..."
              required
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
            />
          </div>

          {/* Detail Lokasi Gangguan */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Detail Lokasi Gangguan</label>
            <input
              type="text"
              value={detailLokasi}
              onChange={(e) => setDetailLokasi(e.target.value)}
              placeholder="e.g. Tiang BG-45 s/d BG-52 Jl. Laterhairy"
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
            />
          </div>

          {/* Catatan / Keterangan */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Catatan / Keterangan</label>
            <textarea
              rows={2}
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Keterangan tindakan penanganan gangguan..."
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
            />
          </div>

          {/* Foto Dokumentasi */}
          <div className="space-y-1.5 p-3.5 bg-blue-50/50 border border-blue-200 rounded-2xl">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-blue-600" />
                <span>Foto Dokumentasi Penyebab Gangguan</span>
              </label>
              <span className="text-[10px] text-blue-600 font-bold bg-blue-100 px-2 py-0.5 rounded-full">
                JPG / JPEG / PNG
              </span>
            </div>

            {fotoPenyebab ? (
              <div className="relative rounded-xl overflow-hidden border border-slate-200 group bg-slate-900 flex flex-col items-center">
                <img
                  src={fotoPenyebab}
                  alt="Dokumentasi Penyebab Gangguan"
                  className="w-full max-h-48 object-contain bg-slate-950"
                />
                <div className="absolute top-2 right-2 flex items-center gap-1.5">
                  <label className="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold cursor-pointer shadow-md flex items-center gap-1">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Ganti</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => setFotoPenyebab('')}
                    className="p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold cursor-pointer shadow-md flex items-center gap-1"
                    title="Hapus Foto"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus</span>
                  </button>
                </div>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-blue-300 rounded-xl bg-white hover:bg-blue-50/50 transition-colors cursor-pointer text-center group">
                <div className="p-2.5 rounded-full bg-blue-100 text-blue-600 group-hover:scale-110 transition-transform mb-2">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-800">
                  Upload Foto Dokumentasi Penyebab
                </span>
                <span className="text-[10px] text-slate-500 mt-0.5">
                  Klik untuk memilih file foto (Format JPG, JPEG, PNG • Maks 5MB)
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-3 border-t border-slate-100 shrink-0">
            <button
              type="submit"
              className="w-full py-3 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs shadow-sm shadow-blue-500/30 transition-all cursor-pointer"
            >
              Simpan Data Gangguan & Estimasi SAIDI SAIFI Per Section
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
