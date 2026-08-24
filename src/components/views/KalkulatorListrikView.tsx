import React, { useState } from 'react';
import {
  Calculator,
  Zap,
  DollarSign,
  Tv,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Plus,
  Trash2,
  Sliders,
  Lightbulb,
  Cpu,
  Sparkles,
  ShieldAlert,
  ArrowRightLeft,
  ChevronRight,
  Layers,
  Repeat
} from 'lucide-react';
import { User } from '../../types';

interface KalkulatorListrikViewProps {
  currentUser: User;
}

interface DeviceItem {
  id: string;
  name: string;
  watt: number;
  hoursPerDay: number;
  quantity: number;
}

const PRESET_DEVICES = [
  { name: 'AC 1/2 PK (Low Watt)', watt: 350, hoursPerDay: 8, quantity: 1 },
  { name: 'AC 1 PK Standard', watt: 750, hoursPerDay: 8, quantity: 1 },
  { name: 'Kulkas 1 Pintu', watt: 90, hoursPerDay: 24, quantity: 1 },
  { name: 'Kulkas 2 Pintu', watt: 150, hoursPerDay: 24, quantity: 1 },
  { name: 'TV LED 32 - 43 Inch', watt: 60, hoursPerDay: 6, quantity: 1 },
  { name: 'Pompa Air Otomatis', watt: 250, hoursPerDay: 2, quantity: 1 },
  { name: 'Rice Cooker / Penanak Nasi', watt: 350, hoursPerDay: 3, quantity: 1 },
  { name: 'Mesin Cuci (Washing)', watt: 300, hoursPerDay: 1, quantity: 1 },
  { name: 'Setrika Listrik', watt: 350, hoursPerDay: 1, quantity: 1 },
  { name: 'Lampu LED Rumah', watt: 10, hoursPerDay: 10, quantity: 5 },
  { name: 'Kipas Angin Berdiri', watt: 50, hoursPerDay: 8, quantity: 1 },
  { name: 'Komputer Desktop / PC', watt: 200, hoursPerDay: 6, quantity: 1 },
];

const TARIF_LIST = [
  { code: 'R-1/450 VA', label: 'R-1 / 450 VA (Subsidi)', rate: 415, isSubsidized: true },
  { code: 'R-1/900 VA-S', label: 'R-1 / 900 VA (Subsidi)', rate: 605, isSubsidized: true },
  { code: 'R-1/900 VA-RTM', label: 'R-1 / 900 VA RTM (Non-Subsidi)', rate: 1352, isSubsidized: false },
  { code: 'R-1/1300 VA', label: 'R-1 / 1.300 VA (Non-Subsidi)', rate: 1444.70, isSubsidized: false },
  { code: 'R-1/2200 VA', label: 'R-1 / 2.200 VA (Non-Subsidi)', rate: 1444.70, isSubsidized: false },
  { code: 'R-2/3500-5500 VA', label: 'R-2 / 3.500 - 5.500 VA (Non-Subsidi)', rate: 1699.53, isSubsidized: false },
  { code: 'R-3/>=6600 VA', label: 'R-3 / >= 6.600 VA (Non-Subsidi)', rate: 1699.53, isSubsidized: false },
  { code: 'B-1/450-5500 VA', label: 'B-1 / Bisnis Kecil (450 VA - 5.500 VA)', rate: 1444.70, isSubsidized: false },
  { code: 'B-2/6600VA-200kVA', label: 'B-2 / Bisnis Sedang (6.600 VA - 200 kVA)', rate: 1444.70, isSubsidized: false },
  { code: 'P-1/6600VA-200kVA', label: 'P-1 / Kantor Pemerintah (6.600 VA - 200 kVA)', rate: 1699.53, isSubsidized: false },
];

const DAYA_OPTIONS = [
  { va: 450, bp: 421000, label: '450 VA' },
  { va: 900, bp: 843000, label: '900 VA' },
  { va: 1300, bp: 1218000, label: '1.300 VA' },
  { va: 2200, bp: 2062000, label: '2.200 VA' },
  { va: 3500, bp: 3391500, label: '3.500 VA' },
  { va: 4400, bp: 4263600, label: '4.400 VA' },
  { va: 5500, bp: 5329500, label: '5.500 VA' },
  { va: 7700, bp: 7461300, label: '7.700 VA' },
  { va: 11000, bp: 10659000, label: '11.000 VA' },
];

// Standard Trafo Distribution Ratings (kVA)
const TRAFO_STANDARDS = [
  { kva: 25, label: '25 kVA (1/3 Fasa)' },
  { kva: 50, label: '50 kVA (3 Fasa)' },
  { kva: 100, label: '100 kVA (3 Fasa)' },
  { kva: 160, label: '160 kVA (3 Fasa)' },
  { kva: 250, label: '250 kVA (3 Fasa)' },
  { kva: 315, label: '315 kVA (3 Fasa)' },
  { kva: 400, label: '400 kVA (3 Fasa)' },
  { kva: 630, label: '630 kVA (3 Fasa)' },
];

// Standard NH Fuse Ratings (Ampere)
const NH_FUSE_RATINGS = [50, 63, 80, 100, 125, 160, 200, 250, 315, 400, 500, 630];

// Kabel impedance per km (Resistance Ohm/km)
const KABEL_OPTIONS = [
  { name: 'Saluran Udara AAAC 70 mm²', rPerKm: 0.443, desc: 'JTM Standar 20 kV' },
  { name: 'Saluran Udara AAAC 150 mm²', rPerKm: 0.206, desc: 'JTM Main Feeder 20 kV' },
  { name: 'Saluran Udara AAAC 240 mm²', rPerKm: 0.125, desc: 'JTM Heavy Feeder 20 kV' },
  { name: 'Kabel Tanah SKTM 150 mm²', rPerKm: 0.206, desc: 'Underground Cable 20 kV' },
  { name: 'Kabel Udara JTR NVT 3x70+1x50 mm²', rPerKm: 0.443, desc: 'JTR 380/220 Volt' },
  { name: 'Kabel Udara JTR NVT 3x50+1x35 mm²', rPerKm: 0.641, desc: 'JTR Branch 380/220 V' },
];

// Multi-Unit Converter Unit Definitions
interface UnitDefinition {
  id: string;
  label: string;
  symbol: string;
  toBaseFactor: number; // multiplier to convert to base unit
  description: string;
}

const UNIT_CATEGORIES: {
  id: 'resistansi' | 'tegangan' | 'arus' | 'daya' | 'energi';
  title: string;
  iconName: string;
  baseUnit: string;
  units: UnitDefinition[];
}[] = [
  {
    id: 'resistansi',
    title: 'Hambatan / Resistansi',
    iconName: 'Ohm',
    baseUnit: 'Ohm (Ω)',
    units: [
      { id: 'microohm', label: 'Micro-Ohm', symbol: 'μΩ', toBaseFactor: 1e-6, description: '1 μΩ = 0.000001 Ω' },
      { id: 'milliohm', label: 'Milli-Ohm', symbol: 'mΩ', toBaseFactor: 1e-3, description: '1 mΩ = 0.001 Ω' },
      { id: 'ohm', label: 'Ohm', symbol: 'Ω', toBaseFactor: 1, description: 'Satuan dasar resistansi' },
      { id: 'kiloohm', label: 'Kilo-Ohm', symbol: 'kΩ', toBaseFactor: 1e3, description: '1 kΩ = 1.000 Ω' },
      { id: 'megaohm', label: 'Mega-Ohm (Megger)', symbol: 'MΩ', toBaseFactor: 1e6, description: '1 MΩ = 1.000.000 Ω (Uji Tahanan Isolasi)' },
      { id: 'gigaohm', label: 'Giga-Ohm', symbol: 'GΩ', toBaseFactor: 1e9, description: '1 GΩ = 1.000.000.000 Ω (Isolasi Tegangan Tinggi)' },
    ]
  },
  {
    id: 'tegangan',
    title: 'Tegangan Listrik (Voltage)',
    iconName: 'Volt',
    baseUnit: 'Volt (V)',
    units: [
      { id: 'microvolt', label: 'Microvolt', symbol: 'μV', toBaseFactor: 1e-6, description: '1 μV = 0.000001 V' },
      { id: 'millivolt', label: 'Millivolt', symbol: 'mV', toBaseFactor: 1e-3, description: '1 mV = 0.001 V' },
      { id: 'volt', label: 'Volt', symbol: 'V', toBaseFactor: 1, description: 'Satuan standar 220V / 380V' },
      { id: 'kilovolt', label: 'Kilovolt', symbol: 'kV', toBaseFactor: 1e3, description: '1 kV = 1.000 V (Standar JTM 20 kV)' },
      { id: 'megavolt', label: 'Megavolt', symbol: 'MV', toBaseFactor: 1e6, description: '1 MV = 1.000.000 V (Standar SUTET 500 kV)' },
    ]
  },
  {
    id: 'arus',
    title: 'Arus Listrik (Current)',
    iconName: 'Ampere',
    baseUnit: 'Ampere (A)',
    units: [
      { id: 'microampere', label: 'Microampere', symbol: 'μA', toBaseFactor: 1e-6, description: '1 μA = 0.000001 A' },
      { id: 'milliampere', label: 'Milliampere', symbol: 'mA', toBaseFactor: 1e-3, description: '1 mA = 0.001 A (Batas Trip ELCB 30mA)' },
      { id: 'ampere', label: 'Ampere', symbol: 'A', toBaseFactor: 1, description: 'Satuan standar MCB / fuse' },
      { id: 'kiloampere', label: 'Kiloampere', symbol: 'kA', toBaseFactor: 1e3, description: '1 kA = 1.000 A (Kapasitas Pemutus / Icu)' },
    ]
  },
  {
    id: 'daya',
    title: 'Daya Listrik (Power)',
    iconName: 'Watt',
    baseUnit: 'Watt (W)',
    units: [
      { id: 'milliwatt', label: 'Milliwatt', symbol: 'mW', toBaseFactor: 1e-3, description: '1 mW = 0.001 W' },
      { id: 'watt', label: 'Watt', symbol: 'W', toBaseFactor: 1, description: 'Daya aktif P' },
      { id: 'kilowatt', label: 'Kilowatt', symbol: 'kW', toBaseFactor: 1e3, description: '1 kW = 1.000 W' },
      { id: 'megawatt', label: 'Megawatt', symbol: 'MW', toBaseFactor: 1e6, description: '1 MW = 1.000.000 W (Kapasitas Pembangkit)' },
      { id: 'gigawatt', label: 'Gigawatt', symbol: 'GW', toBaseFactor: 1e9, description: '1 GW = 1.000.000.000 W' },
      { id: 'va', label: 'Volt-Ampere (Daya Semu)', symbol: 'VA', toBaseFactor: 1, description: '1 VA (PF=1.0)' },
      { id: 'kva', label: 'Kilo-Volt-Ampere', symbol: 'kVA', toBaseFactor: 1e3, description: '1 kVA = 1.000 VA (Daya Trafo)' },
      { id: 'mva', label: 'Mega-Volt-Ampere', symbol: 'MVA', toBaseFactor: 1e6, description: '1 MVA = 1.000.000 VA' },
      { id: 'hp', label: 'Horsepower / PK', symbol: 'HP / PK', toBaseFactor: 745.7, description: '1 HP / PK = 745.7 W (Daya Motor)' },
    ]
  },
  {
    id: 'energi',
    title: 'Energi Listrik (Energy)',
    iconName: 'kWh',
    baseUnit: 'Watt-hour (Wh)',
    units: [
      { id: 'watthour', label: 'Watt-hour', symbol: 'Wh', toBaseFactor: 1, description: 'Satuan dasar energi' },
      { id: 'kilowatthour', label: 'Kilowatt-hour', symbol: 'kWh', toBaseFactor: 1e3, description: '1 kWh = 1.000 Wh (Satuan Meteran PLN)' },
      { id: 'megawatthour', label: 'Megawatt-hour', symbol: 'MWh', toBaseFactor: 1e6, description: '1 MWh = 1.000.000 Wh' },
      { id: 'gigawatthour', label: 'Gigawatt-hour', symbol: 'GWh', toBaseFactor: 1e9, description: '1 GWh = 1.000.000.000 Wh' },
      { id: 'joule', label: 'Joule', symbol: 'J', toBaseFactor: 1 / 3600, description: '1 Joule = 1 Watt-second' },
      { id: 'kilojoule', label: 'Kilojoule', symbol: 'kJ', toBaseFactor: 1000 / 3600, description: '1 kJ = 1.000 Joule' },
    ]
  }
];

export const KalkulatorListrikView: React.FC<KalkulatorListrikViewProps> = () => {
  const [activeTab, setActiveTab] = useState<'tagihan' | 'perangkat' | 'tambah_daya' | 'konversi' | 'proteksi' | 'teknis'>('tagihan');

  // TAB 1: Kalkulator Tagihan & Token
  const [calcMode, setCalcMode] = useState<'kwh_to_rupiah' | 'rupiah_to_kwh'>('kwh_to_rupiah');
  const [selectedTarifCode, setSelectedTarifCode] = useState('R-1/1300 VA');
  const [inputKwh, setInputKwh] = useState<number>(150);
  const [inputRupiah, setInputRupiah] = useState<number>(100000);
  const [ppjPercent, setPpjPercent] = useState<number>(8); // Kota Ambon / Maluku PPJ 8%
  const [adminFee, setAdminFee] = useState<number>(2500);

  // TAB 2: Kalkulator Perangkat
  const [devices, setDevices] = useState<DeviceItem[]>([
    { id: 'd1', name: 'AC 1/2 PK (Low Watt)', watt: 350, hoursPerDay: 8, quantity: 1 },
    { id: 'd2', name: 'Kulkas 2 Pintu', watt: 150, hoursPerDay: 24, quantity: 1 },
    { id: 'd3', name: 'TV LED 43 Inch', watt: 70, hoursPerDay: 5, quantity: 1 },
    { id: 'd4', name: 'Lampu LED Rumah', watt: 10, hoursPerDay: 10, quantity: 6 },
    { id: 'd5', name: 'Rice Cooker', watt: 350, hoursPerDay: 2, quantity: 1 }
  ]);
  const [newDevName, setNewDevName] = useState('');
  const [newDevWatt, setNewDevWatt] = useState<number>(100);
  const [newDevHours, setNewDevHours] = useState<number>(5);
  const [newDevQty, setNewDevQty] = useState<number>(1);
  const [deviceTarifCode, setDeviceTarifCode] = useState('R-1/1300 VA');

  // TAB 3: Tambah Daya
  const [simType, setSimType] = useState<'PD' | 'PB'>('PD');
  const [dayaAwalVa, setDayaAwalVa] = useState<number>(900);
  const [dayaTujuanVa, setDayaTujuanVa] = useState<number>(2200);
  const [layananType, setLayananType] = useState<'prabayar' | 'pascabayar'>('prabayar');
  const [tokenPerdana, setTokenPerdana] = useState<number>(50000);

  // TAB 4: Konversi & Formula Kelistrikan
  const [convType, setConvType] = useState<'va_to_kw' | 'kw_to_amp' | 'amp_to_kw' | 'hp_to_kw' | 'hukum_ohm' | 'multi_unit'>('multi_unit');
  const [inputVa, setInputVa] = useState<number>(1300);
  const [inputCosPhi, setInputCosPhi] = useState<number>(0.85);
  const [inputKw, setInputKw] = useState<number>(10);
  const [inputVoltage, setInputVoltage] = useState<number>(380); // 220V or 380V
  const [inputPhase, setInputPhase] = useState<'1' | '3'>('3');
  const [inputAmpere, setInputAmpere] = useState<number>(25);
  const [inputHp, setInputHp] = useState<number>(5);
  const [motorEfficiency, setMotorEfficiency] = useState<number>(0.85);

  // Ohm's Law state
  const [ohmKnown, setOhmKnown] = useState<'vi' | 'vr' | 'ir'>('vi');
  const [ohmVal1, setOhmVal1] = useState<number>(220); // Volt
  const [ohmVal2, setOhmVal2] = useState<number>(10);  // Ampere / Ohm

  // Multi-Unit Converter State
  const [unitCategory, setUnitCategory] = useState<'resistansi' | 'tegangan' | 'arus' | 'daya' | 'energi'>('resistansi');
  const [unitInputValue, setUnitInputValue] = useState<number>(100);
  const [unitFromId, setUnitFromId] = useState<string>('kiloohm');

  // TAB 5: Proteksi Trafo, Fuse Link & NH Fuse
  const [selectedTrafoKva, setSelectedTrafoKva] = useState<number>(100);
  const [trafoPrimaryKv, setTrafoPrimaryKv] = useState<number>(20); // 20 kV
  const [trafoSecondaryVolt, setTrafoSecondaryVolt] = useState<number>(400); // 400 V
  const [fuseType, setFuseType] = useState<'K' | 'T'>('K');
  const [jumlahJurusan, setJumlahJurusan] = useState<number>(2); // 2 or 4 jurusan JTR

  // TAB 6: Teknis Jaringan (Drop Voltage & Losses)
  const [teganganNominalKv, setTeganganNominalKv] = useState<number>(20);
  const [arusLoadAmpere, setArusLoadAmpere] = useState<number>(120);
  const [panjangJaringanKm, setPanjangJaringanKm] = useState<number>(4.5);
  const [selectedKabel, setSelectedKabel] = useState(KABEL_OPTIONS[0].name);

  // --- CALCULATIONS FOR TAB 1 ---
  const currentTarif = TARIF_LIST.find((t) => t.code === selectedTarifCode) || TARIF_LIST[3];
  const subtotalBiayaListrik = inputKwh * currentTarif.rate;
  const nominalPpj = (subtotalBiayaListrik * ppjPercent) / 100;
  const totalBiayaTagihan = subtotalBiayaListrik + nominalPpj + adminFee;

  const netTokenBudget = Math.max(0, inputRupiah - adminFee);
  const effectiveRateWithPpj = currentTarif.rate * (1 + ppjPercent / 100);
  const estimatedKwhFromRupiah = netTokenBudget > 0 ? netTokenBudget / effectiveRateWithPpj : 0;
  const estimatedPpjFromRupiah = netTokenBudget - (estimatedKwhFromRupiah * currentTarif.rate);

  // --- CALCULATIONS FOR TAB 2 ---
  const totalWattPeak = devices.reduce((sum, d) => sum + d.watt * d.quantity, 0);
  const totalKwhDaily = devices.reduce((sum, d) => sum + (d.watt * d.hoursPerDay * d.quantity) / 1000, 0);
  const totalKwhMonthly = totalKwhDaily * 30;
  const deviceTarifObj = TARIF_LIST.find((t) => t.code === deviceTarifCode) || TARIF_LIST[3];
  const estimatedDeviceCostMonthly = totalKwhMonthly * deviceTarifObj.rate * (1 + ppjPercent / 100);
  const recommendedDayaVa = DAYA_OPTIONS.find((d) => d.va >= totalWattPeak * 1.25)?.va || 11000;

  // Device handlers
  const handleAddDevice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDevName.trim()) return;
    const item: DeviceItem = {
      id: `dev_${Date.now()}`,
      name: newDevName.trim(),
      watt: Number(newDevWatt) || 10,
      hoursPerDay: Number(newDevHours) || 1,
      quantity: Number(newDevQty) || 1
    };
    setDevices([...devices, item]);
    setNewDevName('');
    setNewDevWatt(100);
    setNewDevHours(5);
    setNewDevQty(1);
  };

  const handleAddPresetDevice = (preset: typeof PRESET_DEVICES[0]) => {
    const item: DeviceItem = {
      id: `dev_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      name: preset.name,
      watt: preset.watt,
      hoursPerDay: preset.hoursPerDay,
      quantity: preset.quantity
    };
    setDevices([...devices, item]);
  };

  const handleRemoveDevice = (id: string) => {
    setDevices(devices.filter((d) => d.id !== id));
  };

  // --- CALCULATIONS FOR TAB 3 ---
  const dayaAwalObj = DAYA_OPTIONS.find((d) => d.va === dayaAwalVa) || DAYA_OPTIONS[1];
  const dayaTujuanObj = DAYA_OPTIONS.find((d) => d.va === dayaTujuanVa) || DAYA_OPTIONS[3];

  let biayaPenyambunganBp = 0;
  if (simType === 'PB') {
    biayaPenyambunganBp = dayaTujuanObj.bp;
  } else {
    biayaPenyambunganBp = Math.max(0, dayaTujuanObj.bp - dayaAwalObj.bp);
  }

  const estimasiUjlPascabayar = layananType === 'pascabayar' ? dayaTujuanVa * 150 : 0;
  const totalBiayaSimulasiPd = biayaPenyambunganBp + (layananType === 'prabayar' ? tokenPerdana : estimasiUjlPascabayar);

  // --- CALCULATIONS FOR TAB 4 (CONVERTER & FORMULA) ---
  const calcResultKwFromVa = (inputVa * inputCosPhi) / 1000;
  const calcResultAmpFromKw = inputPhase === '1'
    ? (inputKw * 1000) / (inputVoltage * inputCosPhi)
    : (inputKw * 1000) / (Math.sqrt(3) * inputVoltage * inputCosPhi);

  const calcResultKvaFromAmp = inputPhase === '1'
    ? (inputVoltage * inputAmpere) / 1000
    : (Math.sqrt(3) * inputVoltage * inputAmpere) / 1000;
  const calcResultKwFromAmp = calcResultKvaFromAmp * inputCosPhi;

  const calcResultKwFromHp = inputHp * 0.7457;
  const calcResultAmpFromHp = (calcResultKwFromHp * 1000) / (Math.sqrt(3) * 380 * inputCosPhi * motorEfficiency);

  // Hukum Ohm
  let ohmV = 0, ohmI = 0, ohmR = 0, ohmP = 0;
  if (ohmKnown === 'vi') {
    ohmV = ohmVal1;
    ohmI = ohmVal2;
    ohmR = ohmI > 0 ? ohmV / ohmI : 0;
    ohmP = ohmV * ohmI;
  } else if (ohmKnown === 'vr') {
    ohmV = ohmVal1;
    ohmR = ohmVal2;
    ohmI = ohmR > 0 ? ohmV / ohmR : 0;
    ohmP = ohmV * ohmI;
  } else if (ohmKnown === 'ir') {
    ohmI = ohmVal1;
    ohmR = ohmVal2;
    ohmV = ohmI * ohmR;
    ohmP = Math.pow(ohmI, 2) * ohmR;
  }

  // Multi-Unit Calculations
  const currentCategoryObj = UNIT_CATEGORIES.find((c) => c.id === unitCategory) || UNIT_CATEGORIES[0];
  const selectedUnitFromObj = currentCategoryObj.units.find((u) => u.id === unitFromId) || currentCategoryObj.units[0];
  const valueInBaseUnit = (unitInputValue || 0) * selectedUnitFromObj.toBaseFactor;

  // --- CALCULATIONS FOR TAB 5 (PROTEKSI TRAFO) ---
  const inPrimariAmpere = selectedTrafoKva / (Math.sqrt(3) * trafoPrimaryKv);
  const inSekunderAmpere = selectedTrafoKva / (Math.sqrt(3) * (trafoSecondaryVolt / 1000));
  const minFuseLinkAmp = inPrimariAmpere * 1.5;
  const maxFuseLinkAmp = inPrimariAmpere * 2.0;

  let recFuseLinkStandard = '2A';
  if (selectedTrafoKva <= 25) recFuseLinkStandard = '1A - 2A (Type K / T)';
  else if (selectedTrafoKva <= 50) recFuseLinkStandard = '2A - 3A (Type K / T)';
  else if (selectedTrafoKva <= 100) recFuseLinkStandard = '4A - 6A (Type K / T)';
  else if (selectedTrafoKva <= 160) recFuseLinkStandard = '6A - 8A (Type K / T)';
  else if (selectedTrafoKva <= 250) recFuseLinkStandard = '10A - 12A (Type K / T)';
  else if (selectedTrafoKva <= 315) recFuseLinkStandard = '12A - 15A (Type K / T)';
  else if (selectedTrafoKva <= 400) recFuseLinkStandard = '15A - 20A (Type K / T)';
  else recFuseLinkStandard = '25A - 30A (Type K / T)';

  const inPerJurusan = inSekunderAmpere / jumlahJurusan;
  const recNhFuseRating = NH_FUSE_RATINGS.find((rating) => rating >= inPerJurusan) || 630;
  const recMainSwitchRating = inSekunderAmpere * 1.25;

  // --- CALCULATIONS FOR TAB 6 (TEKNIS JARINGAN) ---
  const kabelObj = KABEL_OPTIONS.find((k) => k.name === selectedKabel) || KABEL_OPTIONS[0];
  const teganganVolts = teganganNominalKv * 1000;
  const dropVoltageVolt = 1.732 * arusLoadAmpere * (kabelObj.rPerKm * panjangJaringanKm);
  const dropVoltagePercent = (dropVoltageVolt / teganganVolts) * 100;
  const teganganUjungVolt = teganganVolts - dropVoltageVolt;

  const powerLossKw = (3 * Math.pow(arusLoadAmpere, 2) * (kabelObj.rPerKm * panjangJaringanKm)) / 1000;
  const monthlyEnergyLossKwh = powerLossKw * 24 * 30 * 0.6;
  const rupiahLossMonthly = monthlyEnergyLossKwh * 1444.70;

  // Menu Categories List for clean grid layout
  const MENU_TILES = [
    {
      id: 'tagihan',
      title: 'Tagihan & Token PLN',
      badge: 'Simulasi Rp ➔ kWh',
      desc: 'Estimasi tagihan bulanan dan kuitansi token bersih',
      icon: DollarSign,
      color: 'bg-blue-500/10 text-blue-600 border-blue-200'
    },
    {
      id: 'perangkat',
      title: 'Konsumsi Perangkat',
      badge: 'Daya Watt & Load',
      desc: 'Hitung total beban & rekomendasi daya PLN',
      icon: Tv,
      color: 'bg-emerald-500/10 text-emerald-600 border-emerald-200'
    },
    {
      id: 'tambah_daya',
      title: 'Pasang Baru / PD',
      badge: 'Simulasi BP & UJL',
      desc: 'Perhitungan rincian biaya permohonan PB/PD',
      icon: TrendingUp,
      color: 'bg-amber-500/10 text-amber-600 border-amber-200'
    },
    {
      id: 'konversi',
      title: 'Konversi Satuan & Formula',
      badge: 'Ohm, Volt, kW, Amp',
      desc: 'Formulasi Hukum Ohm, VA, HP & Konversi Multilevel',
      icon: ArrowRightLeft,
      color: 'bg-indigo-500/10 text-indigo-600 border-indigo-200'
    },
    {
      id: 'proteksi',
      title: 'Proteksi Fuse Trafo',
      badge: 'FCO 20kV & NH Fuse',
      desc: 'Rekomendasi Fuse Link & NH Fuse Gardu Trafo',
      icon: ShieldAlert,
      color: 'bg-rose-500/10 text-rose-600 border-rose-200'
    },
    {
      id: 'teknis',
      title: 'Drop Tegangan & Losses',
      badge: '% ΔV & Rugi Daya',
      desc: 'Analisis jatuh tegangan & rugi daya jaringan JTM/JTR',
      icon: Sliders,
      color: 'bg-purple-500/10 text-purple-600 border-purple-200'
    }
  ];

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 font-sans">
      {/* Header View - Clean Header without Photo 2 Stats Grid */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-900 rounded-3xl p-6 text-white shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-blue-500/20 border border-blue-400/30 rounded-2xl text-blue-300">
                <Calculator className="w-6 h-6" />
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/30 border border-blue-400/30 text-blue-200 text-xs font-black uppercase tracking-wider">
                Modul Simulasi & Formulasi Kelistrikan
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Kalkulator Listrik & Konversi Satuan Multilevel
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed font-medium">
              Pilih menu kalkulasi di bawah ini untuk memulai simulasi tagihan, konversi satuan listrik (Ohm, Mega Ohm, Volt, Ampere, kW, HP), proteksi trafo gardu, atau analisis jatuh tegangan.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-800/80 backdrop-blur-xs p-3 rounded-2xl border border-slate-700/80 shrink-0">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-extrabold uppercase">Tarif Dasar Non-Subsidi</div>
              <div className="text-xs font-black text-amber-300">Rp 1.444,70 / kWh (R-1)</div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid-based Responsive Menu Selector - Replaces long horizontal scroll bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-blue-600" />
            Pilih Modul Kalkulator Listrik
          </span>
          <span className="text-[11px] text-slate-500 font-bold">
            Klik modul untuk membuka kalkulator
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {MENU_TILES.map((tile) => {
            const Icon = tile.icon;
            const isActive = activeTab === tile.id;
            return (
              <button
                key={tile.id}
                type="button"
                onClick={() => setActiveTab(tile.id as any)}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-start justify-between gap-3 relative overflow-hidden group ${
                  isActive
                    ? 'bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 text-white border-blue-500 shadow-md ring-2 ring-blue-400/30'
                    : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200/90 shadow-xs'
                }`}
              >
                <div className="space-y-1.5 z-10">
                  <div className="flex items-center gap-2">
                    <span className={`p-2 rounded-xl border ${isActive ? 'bg-blue-500/20 text-blue-300 border-blue-400/30' : tile.color}`}>
                      <Icon className="w-4 h-4" />
                    </span>
                    <span className={`text-xs font-extrabold px-2 py-0.5 rounded-full ${
                      isActive ? 'bg-blue-500/30 text-blue-200 border border-blue-400/30' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {tile.badge}
                    </span>
                  </div>
                  <div>
                    <h3 className={`text-sm font-black ${isActive ? 'text-white' : 'text-slate-900'}`}>
                      {tile.title}
                    </h3>
                    <p className={`text-[11px] line-clamp-1 ${isActive ? 'text-slate-300' : 'text-slate-500'}`}>
                      {tile.desc}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 pt-1 z-10">
                  {isActive ? (
                    <span className="p-1 bg-emerald-500 text-white rounded-full flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4" />
                    </span>
                  ) : (
                    <span className="p-1 text-slate-300 group-hover:text-slate-600 transition-colors">
                      <ChevronRight className="w-4 h-4" />
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: KALKULATOR TAGIHAN & TOKEN LISTRIK */}
      {activeTab === 'tagihan' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in-50 duration-200">
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-blue-600" />
                Input Simulasi Tagihan / Token
              </h2>
              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-extrabold rounded-md border border-blue-200">
                Mode: {calcMode === 'kwh_to_rupiah' ? 'kWh ➔ Rupiah' : 'Rupiah ➔ kWh Token'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setCalcMode('kwh_to_rupiah')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  calcMode === 'kwh_to_rupiah'
                    ? 'bg-white text-blue-900 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                1. Hitung Tagihan dari Pemakaian (kWh)
              </button>
              <button
                type="button"
                onClick={() => setCalcMode('rupiah_to_kwh')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  calcMode === 'rupiah_to_kwh'
                    ? 'bg-white text-blue-900 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                2. Hitung Token Listrik dari Nominal (Rp)
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-700 flex items-center justify-between">
                <span>Golongan Tarif & Daya Terpasang *</span>
                <span className="text-[10px] text-blue-600 font-bold">
                  Rp {currentTarif.rate.toLocaleString('id-ID')} / kWh
                </span>
              </label>
              <select
                value={selectedTarifCode}
                onChange={(e) => setSelectedTarifCode(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-500"
              >
                {TARIF_LIST.map((t) => (
                  <option key={t.code} value={t.code}>
                    {t.label} — (Rp {t.rate.toLocaleString('id-ID')}/kWh)
                  </option>
                ))}
              </select>
            </div>

            {calcMode === 'kwh_to_rupiah' ? (
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700">Jumlah Pemakaian Energi (kWh/Bulan) *</label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="100000"
                    value={inputKwh}
                    onChange={(e) => setInputKwh(Math.max(0, Number(e.target.value)))}
                    className="w-full pl-3.5 pr-14 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-black text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                  <span className="absolute right-3.5 top-2.5 text-xs font-black text-slate-400">kWh</span>
                </div>
                <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase">Preset:</span>
                  {[50, 100, 150, 250, 500, 1000].map((kwh) => (
                    <button
                      key={kwh}
                      type="button"
                      onClick={() => setInputKwh(kwh)}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border cursor-pointer transition-all ${
                        inputKwh === kwh
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {kwh} kWh
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700">Nominal Pembelian Token Listrik (Rp) *</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-xs font-black text-slate-500">Rp</span>
                  <input
                    type="number"
                    step="10000"
                    value={inputRupiah}
                    onChange={(e) => setInputRupiah(Math.max(0, Number(e.target.value)))}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-black text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase">Preset:</span>
                  {[20000, 50000, 100000, 200000, 500000, 1000000].map((rp) => (
                    <button
                      key={rp}
                      type="button"
                      onClick={() => setInputRupiah(rp)}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border cursor-pointer transition-all ${
                        inputRupiah === rp
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      Rp {rp.toLocaleString('id-ID')}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="space-y-1">
                <label className="text-[11px] font-extrabold text-slate-700 flex items-center justify-between">
                  <span>Pajak Penerangan Jalan (PPJ)</span>
                  <span className="text-[10px] text-purple-600 font-bold">{ppjPercent}%</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="15"
                    value={ppjPercent}
                    onChange={(e) => setPpjPercent(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                  <span className="absolute right-3 top-2 text-xs font-black text-slate-400">%</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-extrabold text-slate-700">Biaya Administrasi Bank (Rp)</label>
                <input
                  type="number"
                  step="500"
                  value={adminFee}
                  onChange={(e) => setAdminFee(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 to-blue-950 rounded-2xl p-5 sm:p-6 text-white border border-slate-800 flex flex-col justify-between shadow-lg">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-200">
                    Hasil Rincian Kalkulasi
                  </h3>
                </div>
                <span className="text-[10px] font-extrabold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  Realtime Calculation
                </span>
              </div>

              {calcMode === 'kwh_to_rupiah' ? (
                <div className="space-y-3">
                  <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/80 space-y-2">
                    <div className="flex justify-between text-xs text-slate-300">
                      <span>Pemakaian Listrik ({inputKwh} kWh × Rp {currentTarif.rate.toLocaleString('id-ID')})</span>
                      <span className="font-bold text-white">Rp {subtotalBiayaListrik.toLocaleString('id-ID', { maximumFractionDigits: 0 })}</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-300">
                      <span>Pajak Penerangan Jalan (PPJ {ppjPercent}%)</span>
                      <span className="font-bold text-purple-300">+ Rp {nominalPpj.toLocaleString('id-ID', { maximumFractionDigits: 0 })}</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-300">
                      <span>Biaya Administrasi Bank</span>
                      <span className="font-bold text-slate-300">+ Rp {adminFee.toLocaleString('id-ID')}</span>
                    </div>
                  </div>

                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl space-y-1">
                    <div className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-wider">
                      Estimasi Total Tagihan Listrik
                    </div>
                    <div className="text-2xl font-black text-emerald-300">
                      Rp {totalBiayaTagihan.toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/80 space-y-2">
                    <div className="flex justify-between text-xs text-slate-300">
                      <span>Nominal Pembelian Token</span>
                      <span className="font-bold text-white">Rp {inputRupiah.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-300">
                      <span>Potongan Admin Bank</span>
                      <span className="font-bold text-rose-300">- Rp {adminFee.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-300">
                      <span>Estimasi Potongan PPJ ({ppjPercent}%)</span>
                      <span className="font-bold text-purple-300">- Rp {estimatedPpjFromRupiah.toLocaleString('id-ID', { maximumFractionDigits: 0 })}</span>
                    </div>
                  </div>

                  <div className="p-4 bg-blue-500/15 border border-blue-400/30 rounded-2xl space-y-1">
                    <div className="text-[10px] font-extrabold text-blue-300 uppercase tracking-wider">
                      Estimasi Token Bersih Diterima
                    </div>
                    <div className="text-3xl font-black text-amber-300">
                      {estimatedKwhFromRupiah.toFixed(1)} <span className="text-lg text-white font-bold">kWh</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: KALKULATOR ELEKTRONIK RUMAH & USAHA */}
      {activeTab === 'perangkat' && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                Tambah Perangkat Cepat dari Preset
              </h2>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {PRESET_DEVICES.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleAddPresetDevice(preset)}
                  className="px-3 py-2 bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{preset.name}</span>
                  <span className="px-1.5 py-0.2 bg-slate-200 rounded text-[10px] font-black">{preset.watt}W</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-5 shadow-xs">
              <form onSubmit={handleAddDevice} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  + Tambah Alat Elektronik Kustom
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[11px] font-extrabold text-slate-700">Nama Perangkat *</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Dispenser Panas/Dingin"
                      value={newDevName}
                      onChange={(e) => setNewDevName(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-extrabold text-slate-700">Daya (Watt) *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={newDevWatt}
                      onChange={(e) => setNewDevWatt(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-extrabold text-slate-700">Jam/Hari *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      max="24"
                      value={newDevHours}
                      onChange={(e) => setNewDevHours(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-extrabold text-slate-700">Jumlah Unit:</span>
                    <input
                      type="number"
                      min="1"
                      value={newDevQty}
                      onChange={(e) => setNewDevQty(Number(e.target.value))}
                      className="w-16 px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold text-center"
                    />
                  </div>

                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tambahkan ke Daftar</span>
                  </button>
                </div>
              </form>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    Daftar Perangkat Terdaftar ({devices.length})
                  </h3>
                  <button
                    type="button"
                    onClick={() => setDevices([])}
                    className="text-[11px] text-rose-600 hover:underline font-extrabold cursor-pointer"
                  >
                    Kosongkan Semua
                  </button>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-extrabold border-b border-slate-200">
                        <th className="p-3">Nama Alat</th>
                        <th className="p-3 text-center">Watt</th>
                        <th className="p-3 text-center">Durasi</th>
                        <th className="p-3 text-center">Jumlah</th>
                        <th className="p-3 text-right">kWh/Bulan</th>
                        <th className="p-3 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                      {devices.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-400 font-bold">
                            Belum ada perangkat yang ditambahkan.
                          </td>
                        </tr>
                      ) : (
                        devices.map((d) => {
                          const kwhMonth = ((d.watt * d.hoursPerDay * d.quantity) / 1000) * 30;
                          return (
                            <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                              <td className="p-3 font-bold text-slate-900">{d.name}</td>
                              <td className="p-3 text-center font-bold text-amber-700">{d.watt} W</td>
                              <td className="p-3 text-center">{d.hoursPerDay} jam/hari</td>
                              <td className="p-3 text-center font-bold">{d.quantity} unit</td>
                              <td className="p-3 text-right font-black text-emerald-700">
                                {kwhMonth.toFixed(1)} kWh
                              </td>
                              <td className="p-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveDevice(d.id)}
                                  className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
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

            <div className="lg:col-span-4 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 rounded-2xl p-5 sm:p-6 text-white border border-slate-800 space-y-5 shadow-lg flex flex-col justify-between">
              <div className="space-y-4">
                <div className="pb-3 border-b border-slate-800">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-200 flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-emerald-400" />
                    Ringkasan Konsumsi Listrik
                  </h3>
                </div>

                <div className="space-y-3">
                  <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/80 space-y-2">
                    <div className="flex justify-between text-xs text-slate-300">
                      <span>Total Beban Puncak:</span>
                      <span className="font-bold text-amber-300">{totalWattPeak.toLocaleString('id-ID')} Watt</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-300">
                      <span>Konsumsi Harian:</span>
                      <span className="font-bold text-white">{totalKwhDaily.toFixed(2)} kWh / hari</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-300">
                      <span>Konsumsi Bulanan:</span>
                      <span className="font-bold text-emerald-300">{totalKwhMonthly.toFixed(1)} kWh / bulan</span>
                    </div>
                  </div>

                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl space-y-1">
                    <div className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-wider">
                      Estimasi Biaya Tagihan Bulanan
                    </div>
                    <div className="text-2xl font-black text-emerald-300">
                      Rp {estimatedDeviceCostMonthly.toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                    </div>
                  </div>

                  <div className="p-3.5 bg-blue-500/15 border border-blue-400/30 rounded-xl space-y-1">
                    <div className="text-[10px] font-black text-blue-300 uppercase tracking-wider">
                      Rekomendasi Daya Listrik PLN Minimum
                    </div>
                    <div className="text-sm font-black text-white flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-400" />
                      <span>{recommendedDayaVa.toLocaleString('id-ID')} VA</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PASANG BARU & TAMBAH DAYA (PB/PD) */}
      {activeTab === 'tambah_daya' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in-50 duration-200">
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-5 shadow-xs">
            <div className="pb-3 border-b border-slate-100">
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-amber-600" />
                Simulasi Permohonan Pasang Baru / Tambah Daya
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setSimType('PD')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  simType === 'PD'
                    ? 'bg-white text-blue-900 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                1. Tambah Daya (PD)
              </button>
              <button
                type="button"
                onClick={() => setSimType('PB')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  simType === 'PB'
                    ? 'bg-white text-blue-900 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                2. Pasang Baru (PB)
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {simType === 'PD' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-700">Daya Listrik Saat Ini *</label>
                  <select
                    value={dayaAwalVa}
                    onChange={(e) => setDayaAwalVa(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none"
                  >
                    {DAYA_OPTIONS.map((d) => (
                      <option key={d.va} value={d.va}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className={`space-y-1.5 ${simType === 'PB' ? 'sm:col-span-2' : ''}`}>
                <label className="text-xs font-extrabold text-slate-700">
                  {simType === 'PD' ? 'Daya Listrik Tujuan *' : 'Pilihan Daya Pasang Baru *'}
                </label>
                <select
                  value={dayaTujuanVa}
                  onChange={(e) => setDayaTujuanVa(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none"
                >
                  {DAYA_OPTIONS.map((d) => (
                    <option key={d.va} value={d.va} disabled={simType === 'PD' && d.va <= dayaAwalVa}>
                      {d.label} — (BP Standard: Rp {d.bp.toLocaleString('id-ID')})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="text-xs font-extrabold text-slate-700">Jenis Layanan Listrik *</label>
              <div className="grid grid-cols-2 gap-3">
                <label className={`p-3 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${
                  layananType === 'prabayar' ? 'bg-blue-50 border-blue-500 text-blue-900' : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}>
                  <input
                    type="radio"
                    name="layanan"
                    checked={layananType === 'prabayar'}
                    onChange={() => setLayananType('prabayar')}
                    className="text-blue-600"
                  />
                  <div className="text-xs">
                    <div className="font-bold">Prabayar (Token LPB)</div>
                    <div className="text-[10px] text-slate-500">Isi ulang token listrik</div>
                  </div>
                </label>

                <label className={`p-3 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${
                  layananType === 'pascabayar' ? 'bg-blue-50 border-blue-500 text-blue-900' : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}>
                  <input
                    type="radio"
                    name="layanan"
                    checked={layananType === 'pascabayar'}
                    onChange={() => setLayananType('pascabayar')}
                    className="text-blue-600"
                  />
                  <div className="text-xs">
                    <div className="font-bold">Pascabayar (Bulanan)</div>
                    <div className="text-[10px] text-slate-500">Bayar tagihan tiap bulan</div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 to-amber-950 rounded-2xl p-5 sm:p-6 text-white border border-slate-800 space-y-5 shadow-lg flex flex-col justify-between">
            <div className="space-y-4">
              <div className="pb-3 border-b border-slate-800">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-200">
                  Rincian Biaya Permohonan
                </h3>
              </div>

              <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/80 space-y-2 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>Biaya Penyambungan (BP):</span>
                  <span className="font-bold text-white">Rp {biayaPenyambunganBp.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>{layananType === 'prabayar' ? 'Token Perdana:' : 'Uang Jaminan Langganan (UJL):'}</span>
                  <span className="font-bold text-amber-300">
                    Rp {(layananType === 'prabayar' ? tokenPerdana : estimasiUjlPascabayar).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl space-y-1">
                <div className="text-[10px] font-extrabold text-amber-400 uppercase tracking-wider">
                  Total Estimasi Biaya {simType === 'PD' ? 'Tambah Daya' : 'Pasang Baru'}
                </div>
                <div className="text-2xl font-black text-amber-300">
                  Rp {totalBiayaSimulasiPd.toLocaleString('id-ID')}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: KONVERSI SATUAN MULTILEVEL & FORMULA KELISTRIKAN */}
      {activeTab === 'konversi' && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-indigo-600" />
                Mode Kalkulator Konversi & Formulasi Listrik
              </h2>
            </div>

            {/* Selector Conversion Mode */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs font-bold">
              <button
                type="button"
                onClick={() => setConvType('multi_unit')}
                className={`p-3 rounded-xl transition-all cursor-pointer text-center flex flex-col items-center gap-1 ${
                  convType === 'multi_unit' ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-400/30' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Repeat className="w-4 h-4" />
                <span>1. Konversi Satuan Multilevel</span>
              </button>

              <button
                type="button"
                onClick={() => setConvType('va_to_kw')}
                className={`p-3 rounded-xl transition-all cursor-pointer text-center flex flex-col items-center gap-1 ${
                  convType === 'va_to_kw' ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-400/30' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Zap className="w-4 h-4" />
                <span>2. VA ➔ kW</span>
              </button>

              <button
                type="button"
                onClick={() => setConvType('kw_to_amp')}
                className={`p-3 rounded-xl transition-all cursor-pointer text-center flex flex-col items-center gap-1 ${
                  convType === 'kw_to_amp' ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-400/30' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Cpu className="w-4 h-4" />
                <span>3. kW ➔ Ampere</span>
              </button>

              <button
                type="button"
                onClick={() => setConvType('amp_to_kw')}
                className={`p-3 rounded-xl transition-all cursor-pointer text-center flex flex-col items-center gap-1 ${
                  convType === 'amp_to_kw' ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-400/30' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Sliders className="w-4 h-4" />
                <span>4. Ampere ➔ kVA / kW</span>
              </button>

              <button
                type="button"
                onClick={() => setConvType('hp_to_kw')}
                className={`p-3 rounded-xl transition-all cursor-pointer text-center flex flex-col items-center gap-1 ${
                  convType === 'hp_to_kw' ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-400/30' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>5. Motor HP ➔ kW / Amp</span>
              </button>

              <button
                type="button"
                onClick={() => setConvType('hukum_ohm')}
                className={`p-3 rounded-xl transition-all cursor-pointer text-center flex flex-col items-center gap-1 ${
                  convType === 'hukum_ohm' ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-400/30' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Calculator className="w-4 h-4" />
                <span>6. Hukum Ohm (V, I, R, P)</span>
              </button>
            </div>
          </div>

          {/* SUB-MODULE 1: UNIVERSAL MULTI-UNIT ELECTRICAL CONVERTER (Ohm, Mega Ohm, Giga Ohm, Volt, Ampere, kW, HP, etc.) */}
          {convType === 'multi_unit' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="space-y-0.5">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Repeat className="w-4 h-4 text-indigo-600" />
                    Kalkulator Konversi Satuan Kelistrikan Lengkap
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Konversi otomatis berbagai macam orde satuan listrik (Mikro, Milli, Kilo, Mega, Giga).
                  </p>
                </div>

                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                  {UNIT_CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setUnitCategory(cat.id);
                        setUnitFromId(cat.units[2]?.id || cat.units[0].id);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                        unitCategory === cat.id
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                      }`}
                    >
                      {cat.title.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input Area for Multi-Unit Converter */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="md:col-span-5 space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-700">Nilai yang Ingin Dikonversi *</label>
                  <input
                    type="number"
                    value={unitInputValue}
                    onChange={(e) => setUnitInputValue(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-black text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="md:col-span-7 space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-700">Satuan Asal (Input) *</label>
                  <select
                    value={unitFromId}
                    onChange={(e) => setUnitFromId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-black text-indigo-900 focus:outline-none focus:border-indigo-500"
                  >
                    {currentCategoryObj.units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.label} ({u.symbol}) — {u.description}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Output Multi-Unit Conversion Grid */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    Hasil Konversi ke Semua Orde Satuan {currentCategoryObj.title}
                  </h4>
                  <span className="text-[11px] font-bold text-slate-500">
                    Nilai dasar: {valueInBaseUnit.toExponential(4)} {currentCategoryObj.baseUnit}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {currentCategoryObj.units.map((unit) => {
                    const convertedVal = valueInBaseUnit / unit.toBaseFactor;
                    const isSelectedSource = unit.id === unitFromId;

                    return (
                      <div
                        key={unit.id}
                        className={`p-4 rounded-2xl border transition-all ${
                          isSelectedSource
                            ? 'bg-indigo-900 text-white border-indigo-600 shadow-md ring-2 ring-indigo-400/30'
                            : 'bg-white hover:bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                            isSelectedSource ? 'bg-indigo-700 text-amber-300' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {unit.symbol}
                          </span>
                          <span className={`text-[10px] font-bold ${isSelectedSource ? 'text-indigo-200' : 'text-slate-400'}`}>
                            {unit.label}
                          </span>
                        </div>

                        <div className="mt-2">
                          <div className={`text-xl font-black font-mono tracking-tight ${
                            isSelectedSource ? 'text-amber-300' : 'text-slate-900'
                          }`}>
                            {convertedVal >= 1e6 || (convertedVal > 0 && convertedVal < 1e-4)
                              ? convertedVal.toExponential(4)
                              : convertedVal.toLocaleString('id-ID', { maximumFractionDigits: 6 })}
                          </div>
                          <p className={`text-[11px] mt-0.5 ${isSelectedSource ? 'text-indigo-200' : 'text-slate-500'}`}>
                            {unit.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* FORMULAS: VA TO KW, KW TO AMP, AMP TO KW, HP TO KW, HUKUM OHM */}
          {convType !== 'multi_unit' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-5 shadow-xs">
                {convType === 'va_to_kw' && (
                  <div className="space-y-4 pt-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-extrabold text-slate-700">Daya Semu (VA) *</label>
                        <input
                          type="number"
                          min="1"
                          value={inputVa}
                          onChange={(e) => setInputVa(Math.max(1, Number(e.target.value)))}
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-extrabold text-slate-700">Faktor Daya (Cos φ) *</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0.1"
                          max="1.0"
                          value={inputCosPhi}
                          onChange={(e) => setInputCosPhi(Number(e.target.value))}
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none"
                        />
                        <p className="text-[10px] text-slate-500">Standar PLN Cos φ = 0.85</p>
                      </div>
                    </div>
                  </div>
                )}

                {convType === 'kw_to_amp' && (
                  <div className="space-y-4 pt-2">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-extrabold text-slate-700">Daya Aktif (kW) *</label>
                        <input
                          type="number"
                          step="0.1"
                          min="0.1"
                          value={inputKw}
                          onChange={(e) => setInputKw(Math.max(0.1, Number(e.target.value)))}
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-extrabold text-slate-700">Fasa Listrik *</label>
                        <select
                          value={inputPhase}
                          onChange={(e) => {
                            const p = e.target.value as '1' | '3';
                            setInputPhase(p);
                            setInputVoltage(p === '1' ? 220 : 380);
                          }}
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none"
                        >
                          <option value="1">1 Fasa (220 Volt)</option>
                          <option value="3">3 Fasa (380 Volt)</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-extrabold text-slate-700">Cos φ *</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0.1"
                          max="1.0"
                          value={inputCosPhi}
                          onChange={(e) => setInputCosPhi(Number(e.target.value))}
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {convType === 'amp_to_kw' && (
                  <div className="space-y-4 pt-2">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-extrabold text-slate-700">Arus Beban (Ampere) *</label>
                        <input
                          type="number"
                          min="1"
                          value={inputAmpere}
                          onChange={(e) => setInputAmpere(Math.max(1, Number(e.target.value)))}
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-extrabold text-slate-700">Fasa Listrik *</label>
                        <select
                          value={inputPhase}
                          onChange={(e) => {
                            const p = e.target.value as '1' | '3';
                            setInputPhase(p);
                            setInputVoltage(p === '1' ? 220 : 380);
                          }}
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none"
                        >
                          <option value="1">1 Fasa (220 V)</option>
                          <option value="3">3 Fasa (380 V)</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-extrabold text-slate-700">Cos φ *</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0.1"
                          max="1.0"
                          value={inputCosPhi}
                          onChange={(e) => setInputCosPhi(Number(e.target.value))}
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {convType === 'hp_to_kw' && (
                  <div className="space-y-4 pt-2">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-extrabold text-slate-700">Daya Motor (HP / PK) *</label>
                        <input
                          type="number"
                          step="0.5"
                          min="0.5"
                          value={inputHp}
                          onChange={(e) => setInputHp(Math.max(0.1, Number(e.target.value)))}
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-extrabold text-slate-700">Efisiensi Motor (η) *</label>
                        <input
                          type="number"
                          step="0.05"
                          min="0.5"
                          max="1.0"
                          value={motorEfficiency}
                          onChange={(e) => setMotorEfficiency(Number(e.target.value))}
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-extrabold text-slate-700">Cos φ *</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0.1"
                          max="1.0"
                          value={inputCosPhi}
                          onChange={(e) => setInputCosPhi(Number(e.target.value))}
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {convType === 'hukum_ohm' && (
                  <div className="space-y-4 pt-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-extrabold text-slate-700">Diketahui Parameter *</label>
                      <select
                        value={ohmKnown}
                        onChange={(e) => setOhmKnown(e.target.value as any)}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none"
                      >
                        <option value="vi">Tegangan (V) & Arus (I)</option>
                        <option value="vr">Tegangan (V) & Hambatan (R)</option>
                        <option value="ir">Arus (I) & Hambatan (R)</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-extrabold text-slate-700">
                          {ohmKnown === 'vi' ? 'Tegangan V (Volt)' : ohmKnown === 'vr' ? 'Tegangan V (Volt)' : 'Arus I (Ampere)'}
                        </label>
                        <input
                          type="number"
                          value={ohmVal1}
                          onChange={(e) => setOhmVal1(Number(e.target.value))}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-extrabold text-slate-700">
                          {ohmKnown === 'vi' ? 'Arus I (Ampere)' : ohmKnown === 'vr' ? 'Hambatan R (Ohm)' : 'Hambatan R (Ohm)'}
                        </label>
                        <input
                          type="number"
                          value={ohmVal2}
                          onChange={(e) => setOhmVal2(Number(e.target.value))}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Results Output Panel for Formulas */}
              <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 rounded-2xl p-5 sm:p-6 text-white border border-slate-800 space-y-5 shadow-lg flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="pb-3 border-b border-slate-800">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-200 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-400" />
                      Hasil Perhitungan Formulasi
                    </h3>
                  </div>

                  {convType === 'va_to_kw' && (
                    <div className="p-4 bg-indigo-500/15 border border-indigo-400/30 rounded-2xl space-y-2">
                      <div className="text-[10px] font-extrabold text-indigo-300 uppercase tracking-wider">
                        Daya Aktif (kW)
                      </div>
                      <div className="text-3xl font-black text-amber-300">
                        {calcResultKwFromVa.toFixed(2)} <span className="text-lg text-white font-bold">kW</span>
                      </div>
                      <div className="text-[11px] text-slate-300 font-mono">
                        Rumus: P (kW) = (S [VA] × Cos φ) / 1000
                      </div>
                    </div>
                  )}

                  {convType === 'kw_to_amp' && (
                    <div className="p-4 bg-indigo-500/15 border border-indigo-400/30 rounded-2xl space-y-2">
                      <div className="text-[10px] font-extrabold text-indigo-300 uppercase tracking-wider">
                        Arus Listrik (Ampere)
                      </div>
                      <div className="text-3xl font-black text-emerald-300">
                        {calcResultAmpFromKw.toFixed(2)} <span className="text-lg text-white font-bold">Ampere</span>
                      </div>
                      <div className="text-[11px] text-slate-300 font-mono">
                        Rumus {inputPhase} Fasa: I = (kW × 1000) / ({inputPhase === '3' ? '√3 × ' : ''}V × Cos φ)
                      </div>
                    </div>
                  )}

                  {convType === 'amp_to_kw' && (
                    <div className="space-y-3">
                      <div className="p-3.5 bg-slate-800/80 rounded-xl border border-slate-700/80 space-y-1">
                        <div className="text-[10px] font-extrabold text-slate-400 uppercase">Daya Semu (kVA)</div>
                        <div className="text-xl font-black text-amber-300">{calcResultKvaFromAmp.toFixed(2)} kVA</div>
                      </div>
                      <div className="p-4 bg-indigo-500/15 border border-indigo-400/30 rounded-2xl space-y-1">
                        <div className="text-[10px] font-extrabold text-indigo-300 uppercase">Daya Aktif (kW)</div>
                        <div className="text-2xl font-black text-emerald-300">{calcResultKwFromAmp.toFixed(2)} kW</div>
                      </div>
                    </div>
                  )}

                  {convType === 'hp_to_kw' && (
                    <div className="space-y-3">
                      <div className="p-3.5 bg-slate-800/80 rounded-xl border border-slate-700/80 space-y-1">
                        <div className="text-[10px] font-extrabold text-slate-400 uppercase">Daya Motor (kW)</div>
                        <div className="text-xl font-black text-amber-300">{calcResultKwFromHp.toFixed(2)} kW</div>
                      </div>
                      <div className="p-4 bg-indigo-500/15 border border-indigo-400/30 rounded-2xl space-y-1">
                        <div className="text-[10px] font-extrabold text-indigo-300 uppercase">Arus Nominal Motor 3 Fasa</div>
                        <div className="text-2xl font-black text-emerald-300">{calcResultAmpFromHp.toFixed(2)} Ampere</div>
                      </div>
                    </div>
                  )}

                  {convType === 'hukum_ohm' && (
                    <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-300">Tegangan V:</span>
                        <span className="font-bold text-amber-300">{ohmV.toFixed(1)} Volt</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-300">Arus I:</span>
                        <span className="font-bold text-emerald-300">{ohmI.toFixed(2)} Ampere</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-300">Hambatan R:</span>
                        <span className="font-bold text-purple-300">{ohmR.toFixed(2)} Ohm (Ω)</span>
                      </div>
                      <div className="flex justify-between border-t border-slate-700 pt-2">
                        <span className="text-slate-300">Daya P:</span>
                        <span className="font-bold text-blue-300">{ohmP.toFixed(1)} Watt (W)</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: PROTEKSI FUSE LINK & NH FUSE TRAFO GARDU */}
      {activeTab === 'proteksi' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in-50 duration-200">
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-5 shadow-xs">
            <div className="pb-3 border-b border-slate-100">
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                Parameter Trafo Gardu Distribusi 20 kV
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700">Kapasitas Daya Trafo (kVA) *</label>
                <select
                  value={selectedTrafoKva}
                  onChange={(e) => setSelectedTrafoKva(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-rose-500"
                >
                  {TRAFO_STANDARDS.map((t) => (
                    <option key={t.kva} value={t.kva}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700">Tipe Karakteristik Fuse Link *</label>
                <select
                  value={fuseType}
                  onChange={(e) => setFuseType(e.target.value as 'K' | 'T')}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-rose-500"
                >
                  <option value="K">Type K (Fast Acting / Cepat)</option>
                  <option value="T">Type T (Slow Acting / Lambat)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700">Tegangan Primari FCO (kV) *</label>
                <input
                  type="number"
                  value={trafoPrimaryKv}
                  onChange={(e) => setTrafoPrimaryKv(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700">Jumlah Jurusan Outgoing JTR (PHB-TR) *</label>
                <select
                  value={jumlahJurusan}
                  onChange={(e) => setJumlahJurusan(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none"
                >
                  <option value={1}>1 Jurusan JTR</option>
                  <option value={2}>2 Jurusan JTR (Standar 50-160 kVA)</option>
                  <option value={3}>3 Jurusan JTR</option>
                  <option value={4}>4 Jurusan JTR (Standar 250-630 kVA)</option>
                </select>
              </div>
            </div>

            {/* Matrix Quick Reference Table for Trafo Protections */}
            <div className="space-y-2 pt-3 border-t border-slate-100">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                Matriks Standar Proteksi Trafo PLN (Karakteristik Tipe K/T)
              </h3>
              <div className="overflow-x-auto border border-slate-200 rounded-xl text-[11px]">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 font-extrabold text-slate-700 border-b border-slate-200">
                      <th className="p-2">Trafo</th>
                      <th className="p-2">In Primari (20kV)</th>
                      <th className="p-2">Fuse Link (FCO)</th>
                      <th className="p-2">In Sekunder (400V)</th>
                      <th className="p-2">NH Fuse (2 Jurusan)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    <tr className={selectedTrafoKva === 50 ? 'bg-rose-50 font-bold' : ''}>
                      <td className="p-2">50 kVA</td>
                      <td className="p-2">1.44 A</td>
                      <td className="p-2 text-rose-700 font-bold">2A - 3A</td>
                      <td className="p-2">72.2 A</td>
                      <td className="p-2 text-blue-700 font-bold">50 Ampere</td>
                    </tr>
                    <tr className={selectedTrafoKva === 100 ? 'bg-rose-50 font-bold' : ''}>
                      <td className="p-2">100 kVA</td>
                      <td className="p-2">2.89 A</td>
                      <td className="p-2 text-rose-700 font-bold">4A - 6A</td>
                      <td className="p-2">144.3 A</td>
                      <td className="p-2 text-blue-700 font-bold">100 Ampere</td>
                    </tr>
                    <tr className={selectedTrafoKva === 160 ? 'bg-rose-50 font-bold' : ''}>
                      <td className="p-2">160 kVA</td>
                      <td className="p-2">4.62 A</td>
                      <td className="p-2 text-rose-700 font-bold">6A - 8A</td>
                      <td className="p-2">230.9 A</td>
                      <td className="p-2 text-blue-700 font-bold">125 - 160 Ampere</td>
                    </tr>
                    <tr className={selectedTrafoKva === 250 ? 'bg-rose-50 font-bold' : ''}>
                      <td className="p-2">250 kVA</td>
                      <td className="p-2">7.22 A</td>
                      <td className="p-2 text-rose-700 font-bold">10A - 12A</td>
                      <td className="p-2">360.8 A</td>
                      <td className="p-2 text-blue-700 font-bold">200 Ampere (4 jur)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Output Protection Calculations */}
          <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 via-rose-950 to-slate-950 rounded-2xl p-5 sm:p-6 text-white border border-slate-800 space-y-5 shadow-lg flex flex-col justify-between">
            <div className="space-y-4">
              <div className="pb-3 border-b border-slate-800">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-200 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  Rekomendasi Proteksi Gardu Trafo {selectedTrafoKva} kVA
                </h3>
              </div>

              {/* Sisi Primari 20 kV */}
              <div className="p-4 bg-rose-500/15 border border-rose-400/30 rounded-2xl space-y-1">
                <div className="text-[10px] font-extrabold text-rose-300 uppercase tracking-wider">
                  Sisi Primari Tegangan Menengah (20 kV)
                </div>
                <div className="text-xs text-slate-300">
                  Arus Nominal Primari (In1): <span className="font-bold text-white">{inPrimariAmpere.toFixed(2)} Ampere</span>
                </div>
                <div className="pt-2 text-sm font-black text-amber-300 flex items-center justify-between">
                  <span>Rating Fuse Link FCO:</span>
                  <span className="bg-amber-400/20 px-2.5 py-1 rounded-lg border border-amber-400/40">{recFuseLinkStandard}</span>
                </div>
                <div className="text-[10px] text-slate-400">
                  *Safety factor FCO: {minFuseLinkAmp.toFixed(1)}A s.d {maxFuseLinkAmp.toFixed(1)}A (1.5x - 2x In)
                </div>
              </div>

              {/* Sisi Sekunder 0.4 kV */}
              <div className="p-4 bg-blue-500/15 border border-blue-400/30 rounded-2xl space-y-1">
                <div className="text-[10px] font-extrabold text-blue-300 uppercase tracking-wider">
                  Sisi Sekunder Tegangan Rendah (400 Volt)
                </div>
                <div className="text-xs text-slate-300">
                  Arus Nominal Sekunder Total (In2): <span className="font-bold text-white">{inSekunderAmpere.toFixed(1)} Ampere</span>
                </div>
                <div className="text-xs text-slate-300">
                  Beban Per Jurusan ({jumlahJurusan} Jurusan): <span className="font-bold text-white">{inPerJurusan.toFixed(1)} Ampere</span>
                </div>

                <div className="pt-2 text-sm font-black text-emerald-300 flex items-center justify-between border-t border-blue-400/20 mt-2">
                  <span>Rekomendasi NH Fuse Jurusan:</span>
                  <span className="bg-emerald-400/20 px-2.5 py-1 rounded-lg border border-emerald-400/40">{recNhFuseRating} Ampere</span>
                </div>
                <div className="text-[10px] text-slate-400">
                  *Rating Saklar Utama (Main Switch): <span className="font-bold text-white">{recMainSwitchRating.toFixed(0)} A</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: ANALISIS TEKNIS JARINGAN (DROP VOLTAGE & LOSSES) */}
      {activeTab === 'teknis' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in-50 duration-200">
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-5 shadow-xs">
            <div className="pb-3 border-b border-slate-100">
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Sliders className="w-4 h-4 text-purple-600" />
                Input Parameter Teknis Jaringan Listrik
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700">Tegangan Sistem Nominal *</label>
                <select
                  value={teganganNominalKv}
                  onChange={(e) => setTeganganNominalKv(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none"
                >
                  <option value={20}>JTM - Tegangan Menengah 20 kV (20.000 V)</option>
                  <option value={0.38}>JTR - Tegangan Rendah 380 V (3 Fasa)</option>
                  <option value={0.22}>JTR - Tegangan Rendah 220 V (1 Fasa)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700">Jenis Spesifikasi Penghantar Kabel *</label>
                <select
                  value={selectedKabel}
                  onChange={(e) => setSelectedKabel(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none"
                >
                  {KABEL_OPTIONS.map((k) => (
                    <option key={k.name} value={k.name}>
                      {k.name} — (R = {k.rPerKm} Ω/km)
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700">Arus Beban Saluran (Ampere) *</label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={arusLoadAmpere}
                    onChange={(e) => setArusLoadAmpere(Math.max(1, Number(e.target.value)))}
                    className="w-full pl-3.5 pr-10 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none"
                  />
                  <span className="absolute right-3 top-2.5 text-xs font-black text-slate-400">A</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700">Panjang Saluran Penghantar (km) *</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="100"
                    value={panjangJaringanKm}
                    onChange={(e) => setPanjangJaringanKm(Math.max(0.1, Number(e.target.value)))}
                    className="w-full pl-3.5 pr-10 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none"
                  />
                  <span className="absolute right-3 top-2.5 text-xs font-black text-slate-400">km</span>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 via-purple-950 to-slate-950 rounded-2xl p-5 sm:p-6 text-white border border-slate-800 space-y-5 shadow-lg flex flex-col justify-between">
            <div className="space-y-4">
              <div className="pb-3 border-b border-slate-800">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-200 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-purple-400" />
                  Hasil Analisis Tegangan & Loss
                </h3>
              </div>

              <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/80 space-y-2">
                <div className="flex justify-between text-xs text-slate-300">
                  <span>Tegangan Pangkal / Kirim:</span>
                  <span className="font-bold text-white">{teganganVolts.toLocaleString('id-ID')} Volt</span>
                </div>
                <div className="flex justify-between text-xs text-slate-300">
                  <span>Drop Tegangan (ΔV):</span>
                  <span className="font-bold text-amber-300">{dropVoltageVolt.toFixed(1)} Volt</span>
                </div>
                <div className="flex justify-between text-xs text-slate-300">
                  <span>Tegangan Ujung Saluran:</span>
                  <span className="font-bold text-emerald-300">{teganganUjungVolt.toFixed(1)} Volt</span>
                </div>
              </div>

              <div className={`p-4 rounded-2xl border space-y-1 ${
                dropVoltagePercent <= 5
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : dropVoltagePercent <= 10
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}>
                <div className="text-[10px] font-extrabold uppercase tracking-wider">
                  Persentase Drop Voltage (% ΔV)
                </div>
                <div className="text-2xl font-black">
                  {dropVoltagePercent.toFixed(2)} %
                </div>
                <div className="text-[11px] font-bold flex items-center gap-1.5">
                  {dropVoltagePercent <= 10 ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  <span>
                    {dropVoltagePercent <= 5
                      ? 'NORMAL (Sesuai Batas Aman SPLN <= 5%)'
                      : dropVoltagePercent <= 10
                      ? 'PERINGATAN (Mendekati Batas Maksimum 10%)'
                      : 'KRITIS (Melebihi Toleransi SPLN > 10%)'}
                  </span>
                </div>
              </div>

              <div className="p-3.5 bg-slate-800/80 rounded-xl border border-slate-700/80 space-y-2 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>Rugi Daya Saluran (Power Loss):</span>
                  <span className="font-bold text-purple-300">{powerLossKw.toFixed(2)} kW</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Estimasi Loss Energi Per Bulan:</span>
                  <span className="font-bold text-white">{monthlyEnergyLossKwh.toFixed(0)} kWh</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Estimasi Nominal Kerugian / Bulan:</span>
                  <span className="font-bold text-rose-400">Rp {rupiahLossMonthly.toLocaleString('id-ID', { maximumFractionDigits: 0 })}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
