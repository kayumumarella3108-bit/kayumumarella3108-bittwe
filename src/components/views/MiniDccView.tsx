import React, { useState, useEffect, useMemo } from 'react';
import { 
  Zap, 
  Activity, 
  RotateCcw, 
  Sliders, 
  Check, 
  X, 
  Settings, 
  RefreshCw, 
  AlertTriangle,
  Radio,
  Minimize2,
  Maximize2,
  Trash2,
  Plus,
  Network,
  ToggleLeft,
  Shield,
  ZapOff,
  Power,
  Layers,
  ChevronDown,
  LayoutGrid,
  Volume2,
  VolumeX,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Edit3,
  Building2,
  Cpu,
  Unlink,
  Flame,
  Link2,
  GitCommit,
  ArrowRight,
  ChevronRight,
  Info,
  MapPin,
  Monitor,
  Grid,
  Magnet
} from 'lucide-react';
import { db, doc, onSnapshot, setDoc, OperationType, handleFirestoreError } from '../../lib/firebase';
import { User } from '../../types';
import { EquipmentGraphicRouter } from './EquipmentGraphics';
import { SystemWideSldWallboard } from './SystemWideSldWallboard';
import { CustomSldCanvasEditor } from './CustomSldCanvasEditor';

interface MiniDccViewProps {
  currentUser?: User | null;
}

export type DeviceType = 'INCOMING' | 'OUTGOING' | 'COUPLING' | 'RECLOSER' | 'LBS' | 'PMCB' | 'FCO' | 'DS';

export interface FeederDevice {
  id: string;
  type: DeviceType;
  code: string;
  name: string;
  location: string;
  status: 'CLOSED' | 'TRIP' | 'OPEN';
  relayProtection?: string;
  currentA?: number;
}

export interface BusbarData {
  id: string;
  name: string;
  voltageKv: number;
}

export interface FeederData {
  id: string;
  code: string;
  name: string;
  busId: string;
  status: 'CLOSED' | 'TRIP';
  currentA: number;
  powerMw: number;
  voltageKv: number;
  cosPhi: number;
  devices?: FeederDevice[];
}

export interface TrafoData {
  id: string;
  name: string;
  mva: number;
  powerMw: number;
  loadPercent: number;
  tap: string;
  tapMode: string;
  tempWdgC: number;
  coolingMode: string;
  pmt150kVAStatus: 'CLOSED' | 'TRIP';
  pmt20kVAStatus: 'CLOSED' | 'TRIP';
}

export interface StationData {
  id: string;
  type: 'GI' | 'GH'; // GI = Gardu Induk (150/20kV), GH = Gardu Hubung (20kV)
  name: string;
  code: string;
  sutt1Name: string;
  sutt2Name: string;
  trafo1: TrafoData;
  trafo2: TrafoData;
  busbars: BusbarData[];
  feeders: FeederData[];
  pmtKopelStatus: 'CLOSED' | 'TRIP';
}

export interface ScadaLogEvent {
  id: string;
  timestamp: string;
  tag: string;
  description: string;
  type: 'TRIP' | 'CLOSE' | 'WARNING' | 'INFO';
}

// Helper to generate default 7-device chain from Pangkal GI/GH to Ujung Jaringan
export function getDefaultFeederDevices(feederCode: string, feederName: string): FeederDevice[] {
  const cleanCode = feederCode.replace(/[^a-zA-Z0-9-]/g, '');
  return [
    {
      id: `dev_inc_${cleanCode}_1`,
      type: 'INCOMING',
      code: `INC-${cleanCode}`,
      name: `PMT Incoming (${feederName})`,
      location: 'Pangkal Gardu (PMT Incoming)',
      status: 'CLOSED',
      relayProtection: 'OCR/GFR (0.3s)'
    },
    {
      id: `dev_out_${cleanCode}_2`,
      type: 'OUTGOING',
      code: `OUT-${cleanCode}`,
      name: `PMT Outgoing (${feederName})`,
      location: 'Pangkal Penyulang GI/GH',
      status: 'CLOSED',
      relayProtection: 'OCR/GFR (Instant)'
    },
    {
      id: `dev_rec_${cleanCode}_3`,
      type: 'RECLOSER',
      code: `REC-${cleanCode}`,
      name: `Recloser (ACR) Section 1`,
      location: 'Km 3.8 - Simpang Utama Network',
      status: 'CLOSED',
      relayProtection: 'Auto-Reclose (3x Sequence)'
    },
    {
      id: `dev_lbs_${cleanCode}_4`,
      type: 'LBS',
      code: `LBS-${cleanCode}`,
      name: `LBS Motorized Section 2`,
      location: 'Km 7.5 - Area Komersial',
      status: 'CLOSED',
      relayProtection: 'Motorized Remote SCADA'
    },
    {
      id: `dev_pmcb_${cleanCode}_5`,
      type: 'PMCB',
      code: `PMCB-${cleanCode}`,
      name: `PMCB Section 3`,
      location: 'Km 11.2 - Kawasan Industri',
      status: 'CLOSED',
      relayProtection: 'Pole Mounted Breaker'
    },
    {
      id: `dev_fco_${cleanCode}_6`,
      type: 'FCO',
      code: `FCO-${cleanCode}`,
      name: `Fuse Cut Out (FCO) Ujung Cabang`,
      location: 'Km 15.0 - Ujung Jaringan',
      status: 'CLOSED',
      relayProtection: 'Fuse Element 50A'
    },
    {
      id: `dev_cpl_${cleanCode}_7`,
      type: 'COUPLING',
      code: `KPL-${cleanCode}`,
      name: `LBS Kopel / Tie-Switch Ujung`,
      location: 'Titik Interkoneksi Penyulang',
      status: 'OPEN',
      relayProtection: 'Interlock Manual / SCADA'
    }
  ];
}

// Calculate energization state for each device along the feeder line from Pangkal to Ujung
export function calculateDeviceEnergization(
  busbarActive: boolean,
  feederStatus: 'CLOSED' | 'TRIP',
  devices: FeederDevice[]
): boolean[] {
  let active = busbarActive && feederStatus === 'CLOSED';
  const result: boolean[] = [];

  for (let i = 0; i < devices.length; i++) {
    result.push(active);
    if (devices[i].status !== 'CLOSED') {
      active = false;
    }
  }

  return result;
}

// DEFAULT INITIAL STATIONS WITH FULL 7-DEVICE NETWORK CHAIN
const DEFAULT_STATIONS: StationData[] = [
  {
    id: 'gi_passo',
    type: 'GI',
    name: 'GI PASSO 150/20kV',
    code: 'PSO',
    sutt1Name: 'SUTT 150kV PASSO - 1',
    sutt2Name: 'SUTT 150kV PASSO - 2',
    trafo1: {
      id: 'trafo_1',
      name: 'TRAFO 1 (60 MVA)',
      mva: 60,
      powerMw: 35.4,
      loadPercent: 59.0,
      tap: '9/17',
      tapMode: 'AUTO',
      tempWdgC: 62.5,
      coolingMode: 'ONAF1',
      pmt150kVAStatus: 'CLOSED',
      pmt20kVAStatus: 'CLOSED'
    },
    trafo2: {
      id: 'trafo_2',
      name: 'TRAFO 2 (60 MVA)',
      mva: 60,
      powerMw: 28.1,
      loadPercent: 46.8,
      tap: '9/17',
      tapMode: 'AUTO',
      tempWdgC: 58.0,
      coolingMode: 'ONAN',
      pmt150kVAStatus: 'CLOSED',
      pmt20kVAStatus: 'CLOSED'
    },
    busbars: [
      { id: 'BUS_A', name: 'BUS 20kV - A', voltageKv: 20.15 },
      { id: 'BUS_B', name: 'BUS 20kV - B', voltageKv: 20.10 }
    ],
    feeders: [
      { id: 'pso_f01', code: 'F-01', name: 'Penyulang Passo (Suplay GH Baguala)', busId: 'BUS_A', status: 'CLOSED', currentA: 320, powerMw: 10.5, voltageKv: 20.1, cosPhi: 0.95, devices: getDefaultFeederDevices('F-01', 'Penyulang Passo') },
      { id: 'pso_f02', code: 'F-02', name: 'Penyulang Laha', busId: 'BUS_A', status: 'CLOSED', currentA: 240, powerMw: 7.8, voltageKv: 20.1, cosPhi: 0.95, devices: getDefaultFeederDevices('F-02', 'Penyulang Laha') },
      { id: 'pso_f03', code: 'F-03', name: 'Penyulang Hitu', busId: 'BUS_B', status: 'CLOSED', currentA: 290, powerMw: 9.5, voltageKv: 20.1, cosPhi: 0.95, devices: getDefaultFeederDevices('F-03', 'Penyulang Hitu') }
    ],
    pmtKopelStatus: 'CLOSED'
  },
  {
    id: 'gh_baguala',
    type: 'GH',
    name: 'GH BAGUALA 20kV',
    code: 'BGL',
    sutt1Name: 'PENYULANG PASSO (20kV DARI GI PASSO)',
    sutt2Name: 'PENYULANG SIOTA (20kV DARI GI PASSO)',
    trafo1: {
      id: 'trafo_1',
      name: 'INCOMER PASSO (20kV)',
      mva: 20,
      powerMw: 12.5,
      loadPercent: 62.5,
      tap: 'N/A',
      tapMode: '20kV DIRECT',
      tempWdgC: 38.0,
      coolingMode: 'AIR CUBICLE',
      pmt150kVAStatus: 'CLOSED',
      pmt20kVAStatus: 'CLOSED'
    },
    trafo2: {
      id: 'trafo_2',
      name: 'INCOMER SIOTA (20kV)',
      mva: 20,
      powerMw: 10.2,
      loadPercent: 51.0,
      tap: 'N/A',
      tapMode: '20kV DIRECT',
      tempWdgC: 36.5,
      coolingMode: 'AIR CUBICLE',
      pmt150kVAStatus: 'CLOSED',
      pmt20kVAStatus: 'CLOSED'
    },
    busbars: [
      { id: 'BUS_A', name: 'BUS 20kV HUBUNG - A', voltageKv: 20.12 },
      { id: 'BUS_B', name: 'BUS 20kV HUBUNG - B', voltageKv: 20.10 }
    ],
    feeders: [
      { id: 'gh_f01', code: 'GH-01', name: 'Penyulang Tulehu', busId: 'BUS_A', status: 'CLOSED', currentA: 260, powerMw: 8.6, voltageKv: 20.1, cosPhi: 0.95, devices: getDefaultFeederDevices('GH-01', 'Penyulang Tulehu') },
      { id: 'gh_f02', code: 'GH-02', name: 'Penyulang Suli', busId: 'BUS_A', status: 'CLOSED', currentA: 190, powerMw: 6.2, voltageKv: 20.1, cosPhi: 0.95, devices: getDefaultFeederDevices('GH-02', 'Penyulang Suli') },
      { id: 'gh_f03', code: 'GH-03', name: 'Penyulang Passo GH', busId: 'BUS_B', status: 'CLOSED', currentA: 310, powerMw: 10.2, voltageKv: 20.1, cosPhi: 0.96, devices: getDefaultFeederDevices('GH-03', 'Penyulang Passo GH') },
      { id: 'gh_f04', code: 'GH-04', name: 'Penyulang Waai', busId: 'BUS_B', status: 'CLOSED', currentA: 210, powerMw: 6.9, voltageKv: 20.1, cosPhi: 0.95, devices: getDefaultFeederDevices('GH-04', 'Penyulang Waai') }
    ],
    pmtKopelStatus: 'CLOSED'
  },
  {
    id: 'gi_gandul',
    type: 'GI',
    name: 'GI GANDUL 150/20kV',
    code: 'GDL',
    sutt1Name: 'SUTT 150kV SUTET/GANDUL-1',
    sutt2Name: 'SUTT 150kV SUTET/GANDUL-2',
    trafo1: {
      id: 'trafo_1',
      name: 'TRAFO 1 (60 MVA)',
      mva: 60,
      powerMw: 39.2,
      loadPercent: 68.5,
      tap: '9/17',
      tapMode: 'AUTO',
      tempWdgC: 64.8,
      coolingMode: 'ONAF1',
      pmt150kVAStatus: 'CLOSED',
      pmt20kVAStatus: 'CLOSED'
    },
    trafo2: {
      id: 'trafo_2',
      name: 'TRAFO 2 (60 MVA)',
      mva: 60,
      powerMw: 30.9,
      loadPercent: 54.2,
      tap: '9/17',
      tapMode: 'AUTO',
      tempWdgC: 60.2,
      coolingMode: 'ONAN',
      pmt150kVAStatus: 'CLOSED',
      pmt20kVAStatus: 'CLOSED'
    },
    busbars: [
      { id: 'BUS_A', name: 'BUS 20kV - A', voltageKv: 20.15 },
      { id: 'BUS_B', name: 'BUS 20kV - B', voltageKv: 20.10 }
    ],
    feeders: [
      { id: 'f01', code: 'F-01', name: 'Penyulang Merapi', busId: 'BUS_A', status: 'CLOSED', currentA: 285, powerMw: 9.43, voltageKv: 20.1, cosPhi: 0.955, devices: getDefaultFeederDevices('F-01', 'Penyulang Merapi') },
      { id: 'f02', code: 'F-02', name: 'Penyulang Cendrawasih', busId: 'BUS_A', status: 'CLOSED', currentA: 310, powerMw: 10.17, voltageKv: 20.1, cosPhi: 0.948, devices: getDefaultFeederDevices('F-02', 'Penyulang Cendrawasih') },
      { id: 'f03', code: 'F-03', name: 'Penyulang Garuda', busId: 'BUS_A', status: 'CLOSED', currentA: 213, powerMw: 7.08, voltageKv: 20.2, cosPhi: 0.962, devices: getDefaultFeederDevices('F-03', 'Penyulang Garuda') },
      { id: 'f04', code: 'F-04', name: 'Penyulang Rajawali', busId: 'BUS_B', status: 'CLOSED', currentA: 298, powerMw: 9.80, voltageKv: 20.1, cosPhi: 0.951, devices: getDefaultFeederDevices('F-04', 'Penyulang Rajawali') },
      { id: 'f05', code: 'F-05', name: 'Penyulang Diponegoro', busId: 'BUS_B', status: 'CLOSED', currentA: 242, powerMw: 8.03, voltageKv: 20.1, cosPhi: 0.957, devices: getDefaultFeederDevices('F-05', 'Penyulang Diponegoro') },
      { id: 'f06', code: 'F-06', name: 'Penyulang Khatulistiwa', busId: 'BUS_B', status: 'CLOSED', currentA: 411, powerMw: 13.64, voltageKv: 20.1, cosPhi: 0.959, devices: getDefaultFeederDevices('F-06', 'Penyulang Khatulistiwa') }
    ],
    pmtKopelStatus: 'CLOSED'
  },
  {
    id: 'gi_hative_besar',
    type: 'GI',
    name: 'GI HATIVE BESAR 150/20kV',
    code: 'HTV',
    sutt1Name: 'SUTT 150kV HATIVE - 1',
    sutt2Name: 'SUTT 150kV HATIVE - 2',
    trafo1: {
      id: 'trafo_1',
      name: 'TRAFO 1 (30 MVA)',
      mva: 30,
      powerMw: 18.5,
      loadPercent: 61.6,
      tap: '8/17',
      tapMode: 'AUTO',
      tempWdgC: 55.0,
      coolingMode: 'ONAN',
      pmt150kVAStatus: 'CLOSED',
      pmt20kVAStatus: 'CLOSED'
    },
    trafo2: {
      id: 'trafo_2',
      name: 'TRAFO 2 (30 MVA)',
      mva: 30,
      powerMw: 16.2,
      loadPercent: 54.0,
      tap: '8/17',
      tapMode: 'AUTO',
      tempWdgC: 53.5,
      coolingMode: 'ONAN',
      pmt150kVAStatus: 'CLOSED',
      pmt20kVAStatus: 'CLOSED'
    },
    busbars: [
      { id: 'BUS_A', name: 'BUS 20kV - A', voltageKv: 20.14 },
      { id: 'BUS_B', name: 'BUS 20kV - B', voltageKv: 20.12 }
    ],
    feeders: [
      { id: 'htv_f01', code: 'HTV-01', name: 'Penyulang Laha Airport', busId: 'BUS_A', status: 'CLOSED', currentA: 280, powerMw: 9.2, voltageKv: 20.1, cosPhi: 0.95, devices: getDefaultFeederDevices('HTV-01', 'Penyulang Laha Airport') },
      { id: 'htv_f02', code: 'HTV-02', name: 'Penyulang Tawiri', busId: 'BUS_A', status: 'CLOSED', currentA: 210, powerMw: 6.9, voltageKv: 20.1, cosPhi: 0.95, devices: getDefaultFeederDevices('HTV-02', 'Penyulang Tawiri') },
      { id: 'htv_f03', code: 'HTV-03', name: 'Penyulang Wayame', busId: 'BUS_B', status: 'CLOSED', currentA: 310, powerMw: 10.2, voltageKv: 20.1, cosPhi: 0.96, devices: getDefaultFeederDevices('HTV-03', 'Penyulang Wayame') }
    ],
    pmtKopelStatus: 'CLOSED'
  },
  {
    id: 'pltd_poka',
    type: 'GI',
    name: 'PLTD POKA (PANGKALAN GENERASI 20kV)',
    code: 'POKA',
    sutt1Name: 'LINE GENERATOR PLTD POKA 1-3',
    sutt2Name: 'LINE GENERATOR PLTD POKA 4-6',
    trafo1: {
      id: 'trafo_1',
      name: 'GEN TRAFO 1 (25 MVA)',
      mva: 25,
      powerMw: 15.0,
      loadPercent: 60.0,
      tap: 'DIRECT',
      tapMode: 'GEN',
      tempWdgC: 48.0,
      coolingMode: 'AIR COOLED',
      pmt150kVAStatus: 'CLOSED',
      pmt20kVAStatus: 'CLOSED'
    },
    trafo2: {
      id: 'trafo_2',
      name: 'GEN TRAFO 2 (25 MVA)',
      mva: 25,
      powerMw: 14.2,
      loadPercent: 56.8,
      tap: 'DIRECT',
      tapMode: 'GEN',
      tempWdgC: 46.5,
      coolingMode: 'AIR COOLED',
      pmt150kVAStatus: 'CLOSED',
      pmt20kVAStatus: 'CLOSED'
    },
    busbars: [
      { id: 'BUS_A', name: 'BUS 20kV PLTD - A', voltageKv: 20.18 },
      { id: 'BUS_B', name: 'BUS 20kV PLTD - B', voltageKv: 20.15 }
    ],
    feeders: [
      { id: 'pok_f01', code: 'POK-01', name: 'Penyulang Poka Kampus', busId: 'BUS_A', status: 'CLOSED', currentA: 340, powerMw: 11.2, voltageKv: 20.1, cosPhi: 0.95, devices: getDefaultFeederDevices('POK-01', 'Penyulang Poka Kampus') },
      { id: 'pok_f02', code: 'POK-02', name: 'Penyulang Rumahtiga', busId: 'BUS_B', status: 'CLOSED', currentA: 260, powerMw: 8.5, voltageKv: 20.1, cosPhi: 0.95, devices: getDefaultFeederDevices('POK-02', 'Penyulang Rumahtiga') }
    ],
    pmtKopelStatus: 'CLOSED'
  }
];

export const MiniDccView: React.FC<MiniDccViewProps> = ({ currentUser }) => {
  // Station State
  const [stations, setStations] = useState<StationData[]>(DEFAULT_STATIONS);
  const [activeStationId, setActiveStationId] = useState<string>('gi_gandul');

  // UI System State
  const [telemetryActive, setTelemetryActive] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [showGridLines, setShowGridLines] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('minidcc_show_grid_lines');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('minidcc_show_grid_lines', String(showGridLines));
    } catch {
      // ignore
    }
  }, [showGridLines]);

  const [logs, setLogs] = useState<ScadaLogEvent[]>([
    { id: '1', timestamp: new Date().toLocaleTimeString('id-ID'), tag: 'SYSTEM', description: 'SCADA Mini DCC Multistation System Siap.', type: 'INFO' }
  ]);
  const [showLogDrawer, setShowLogDrawer] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<'IDLE' | 'SAVING' | 'SUCCESS' | 'ERROR'>('IDLE');

  // Station Modal State
  const [showStationModal, setShowStationModal] = useState<boolean>(false);
  const [editingStation, setEditingStation] = useState<StationData | null>(null);
  const [stationNameInput, setStationNameInput] = useState<string>('');
  const [stationTypeInput, setStationTypeInput] = useState<'GI' | 'GH'>('GI');
  const [stationCodeInput, setStationCodeInput] = useState<string>('');
  const [sutt1Input, setSutt1Input] = useState<string>('');
  const [sutt2Input, setSutt2Input] = useState<string>('');
  const [trafo1MvaInput, setTrafo1MvaInput] = useState<number>(60);
  const [trafo2MvaInput, setTrafo2MvaInput] = useState<number>(60);

  // Busbar Manage Modal State
  const [showBusbarModal, setShowBusbarModal] = useState<boolean>(false);
  const [newBusbarName, setNewBusbarName] = useState<string>('');
  const [newBusbarKv, setNewBusbarKv] = useState<number>(20.15);

  // Feeder Add / Edit Modal State
  const [showFeederModal, setShowFeederModal] = useState<boolean>(false);
  const [editingFeeder, setEditingFeeder] = useState<FeederData | null>(null);
  const [feederCodeInput, setFeederCodeInput] = useState<string>('');
  const [feederNameInput, setFeederNameInput] = useState<string>('');
  const [feederBusIdInput, setFeederBusIdInput] = useState<string>('BUS_A');
  const [feederCurrentInput, setFeederCurrentInput] = useState<number>(250);
  const [feederVoltageInput, setFeederVoltageInput] = useState<number>(20.10);
  const [feederCosPhiInput, setFeederCosPhiInput] = useState<number>(0.95);

  // Feeder Full Inspector Modal State (Pangkal -> Ujung Jaringan)
  const [inspectingFeederId, setInspectingFeederId] = useState<string | null>(null);
  const [inspectorViewMode, setInspectorViewMode] = useState<'SLD' | 'GRID'>('SLD');

  // Main DCC View Mode: 'FULL_SYSTEM_SLD' (1 Layar Wallboard Monitoring Seluruh Sistem) vs 'FEEDER_SLD' vs 'OVERVIEW_GI' vs 'CUSTOM_DRAW_SLD'
  const [mainViewMode, setMainViewMode] = useState<'FEEDER_SLD' | 'OVERVIEW_GI' | 'FULL_SYSTEM_SLD' | 'CUSTOM_DRAW_SLD'>('FULL_SYSTEM_SLD');
  const [selectedFeederIdForSLD, setSelectedFeederIdForSLD] = useState<string | null>(null);

  // Device Add / Edit Modal State
  const [showDeviceModal, setShowDeviceModal] = useState<boolean>(false);
  const [targetFeederIdForDevice, setTargetFeederIdForDevice] = useState<string | null>(null);
  const [editingDevice, setEditingDevice] = useState<FeederDevice | null>(null);
  const [deviceTypeInput, setDeviceTypeInput] = useState<DeviceType>('RECLOSER');
  const [deviceCodeInput, setDeviceCodeInput] = useState<string>('');
  const [deviceNameInput, setDeviceNameInput] = useState<string>('');
  const [deviceLocationInput, setDeviceLocationInput] = useState<string>('');
  const [deviceStatusInput, setDeviceStatusInput] = useState<'CLOSED' | 'TRIP' | 'OPEN'>('CLOSED');
  const [deviceRelayInput, setDeviceRelayInput] = useState<string>('OCR/GFR');

  // Get current active station object
  const currentStation = useMemo(() => {
    return stations.find(s => s.id === activeStationId) || stations[0] || DEFAULT_STATIONS[0];
  }, [stations, activeStationId]);

  // Active Main Feeder for Main Canvas SLD View Mode
  const activeMainFeeder = useMemo(() => {
    if (!currentStation || !currentStation.feeders || currentStation.feeders.length === 0) return null;
    return currentStation.feeders.find(f => f.id === selectedFeederIdForSLD) || currentStation.feeders[0];
  }, [currentStation, selectedFeederIdForSLD]);

  // Audio Beep Effect
  const playTripAlarm = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
    } catch {
      // ignore audio context issues
    }
  };

  const addLog = (tag: string, description: string, type: 'TRIP' | 'CLOSE' | 'WARNING' | 'INFO') => {
    const newLog: ScadaLogEvent = {
      id: Date.now().toString(),
      timestamp: new Date().toLocaleTimeString('id-ID'),
      tag,
      description,
      type
    };
    setLogs(prev => [newLog, ...prev.slice(0, 49)]);
  };

  // Firestore sync for ALL stations
  useEffect(() => {
    const docRef = doc(db, 'dcc_configs', 'mini_dcc_multistations');
    const unsub = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.stations && Array.isArray(data.stations) && data.stations.length > 0) {
          // Auto-migrate feeders to have devices if missing
          const migratedStations = data.stations.map((st: StationData) => ({
            ...st,
            feeders: (st.feeders || []).map(f => ({
              ...f,
              devices: f.devices && f.devices.length > 0 ? f.devices : getDefaultFeederDevices(f.code, f.name)
            }))
          }));
          setStations(migratedStations);
        }
      }
    }, (err) => {
      console.warn("Firestore fallback to local state for Mini DCC:", err);
    });
    return () => unsub();
  }, []);

  const persistStationsState = async (updatedStations: StationData[]) => {
    setSaveStatus('SAVING');
    try {
      await setDoc(doc(db, 'dcc_configs', 'mini_dcc_multistations'), {
        stations: updatedStations,
        updatedAt: new Date().toISOString()
      });
      setSaveStatus('SUCCESS');
      setTimeout(() => setSaveStatus('IDLE'), 1500);
    } catch (err) {
      setSaveStatus('ERROR');
      setTimeout(() => setSaveStatus('IDLE'), 2000);
      handleFirestoreError(err, OperationType.WRITE, 'dcc_configs/mini_dcc_multistations');
    }
  };

  // Update current active station helper
  const updateCurrentStation = (updater: (prev: StationData) => StationData, persist: boolean = true) => {
    setStations(prevStations => {
      const updated = prevStations.map(st => st.id === currentStation.id ? updater(st) : st);
      if (persist) {
        persistStationsState(updated);
      }
      return updated;
    });
  };

  // POWER FLOW & ENERGIZE CALCULATIONS
  const isTrafo1Energized = currentStation.type === 'GH' ? true : currentStation.trafo1.pmt150kVAStatus === 'CLOSED';
  const isTrafo2Energized = currentStation.type === 'GH' ? true : currentStation.trafo2.pmt150kVAStatus === 'CLOSED';

  const isBusADirectActive = isTrafo1Energized && currentStation.trafo1.pmt20kVAStatus === 'CLOSED';
  const isBusBDirectActive = isTrafo2Energized && currentStation.trafo2.pmt20kVAStatus === 'CLOSED';

  // Busbar energize mapping
  const busEnergizedMap = useMemo(() => {
    const isKopelClosed = currentStation.pmtKopelStatus === 'CLOSED';
    const isAnyDirectActive = isBusADirectActive || isBusBDirectActive;
    
    const map: Record<string, boolean> = {};
    currentStation.busbars.forEach((b, idx) => {
      if (idx === 0) {
        map[b.id] = isBusADirectActive || (isKopelClosed && isBusBDirectActive);
      } else if (idx === 1) {
        map[b.id] = isBusBDirectActive || (isKopelClosed && isBusADirectActive);
      } else {
        map[b.id] = isKopelClosed ? isAnyDirectActive : false;
      }
    });
    return map;
  }, [currentStation.busbars, isBusADirectActive, isBusBDirectActive, currentStation.pmtKopelStatus]);

  // LIVE TELEMETRY SIMULATOR
  useEffect(() => {
    if (!telemetryActive) return;

    const interval = setInterval(() => {
      updateCurrentStation(st => {
        const updatedFeeders: FeederData[] = st.feeders.map(f => {
          const isBusActive = busEnergizedMap[f.busId] ?? false;
          const isFeederEnergized = isBusActive && f.status === 'CLOSED';

          if (!isFeederEnergized) {
            return {
              ...f,
              currentA: 0,
              powerMw: 0,
              voltageKv: 0
            };
          }

          const delta = (Math.random() - 0.5) * 6; // +/- 3A
          const baseA = f.currentA > 0 ? f.currentA : 220;
          const newCurrent = Math.max(10, Math.round(baseA + delta));
          const voltage = f.voltageKv || 20.10;
          const powerMw = parseFloat((Math.sqrt(3) * newCurrent * voltage * f.cosPhi / 1000).toFixed(2));

          return {
            ...f,
            currentA: newCurrent,
            powerMw,
            voltageKv: voltage
          };
        });

        // Update Trafos MW load
        const bus1 = st.busbars[0]?.id || 'BUS_A';
        const bus2 = st.busbars[1]?.id || 'BUS_B';

        const trafo1Feeders = updatedFeeders.filter(f => f.busId === bus1 && f.status === 'CLOSED');
        const trafo2Feeders = updatedFeeders.filter(f => f.busId === bus2 && f.status === 'CLOSED');

        const t1TotalMw = trafo1Feeders.reduce((acc, curr) => acc + curr.powerMw, 0);
        const t2TotalMw = trafo2Feeders.reduce((acc, curr) => acc + curr.powerMw, 0);

        const updatedT1 = {
          ...st.trafo1,
          powerMw: parseFloat(t1TotalMw.toFixed(1)),
          loadPercent: parseFloat(((t1TotalMw / (st.trafo1.mva || 60)) * 100).toFixed(1))
        };

        const updatedT2 = {
          ...st.trafo2,
          powerMw: parseFloat(t2TotalMw.toFixed(1)),
          loadPercent: parseFloat(((t2TotalMw / (st.trafo2.mva || 60)) * 100).toFixed(1))
        };

        return {
          ...st,
          trafo1: updatedT1,
          trafo2: updatedT2,
          feeders: updatedFeeders
        };
      }, false); // pass false so in-memory telemetry fluctuation does not perform Firestore remote writes
    }, 2500);

    return () => clearInterval(interval);
  }, [telemetryActive, busEnergizedMap]);

  // Breaker Toggles
  const togglePMT150kV = (trafoNum: 1 | 2) => {
    updateCurrentStation(st => {
      const trafoKey = trafoNum === 1 ? 'trafo1' : 'trafo2';
      const currentStatus = st[trafoKey].pmt150kVAStatus;
      const nextStatus = currentStatus === 'CLOSED' ? 'TRIP' : 'CLOSED';
      addLog(`PMT 150-T${trafoNum}`, `Breaker SUTT 150kV ${st[trafoKey].name} diubah ke ${nextStatus}.`, nextStatus === 'TRIP' ? 'TRIP' : 'CLOSE');
      if (nextStatus === 'TRIP') playTripAlarm();
      return {
        ...st,
        [trafoKey]: { ...st[trafoKey], pmt150kVAStatus: nextStatus }
      };
    });
  };

  const togglePMT20kVIncomer = (trafoNum: 1 | 2) => {
    updateCurrentStation(st => {
      const trafoKey = trafoNum === 1 ? 'trafo1' : 'trafo2';
      const currentStatus = st[trafoKey].pmt20kVAStatus;
      const nextStatus = currentStatus === 'CLOSED' ? 'TRIP' : 'CLOSED';
      addLog(`PMT INC-${trafoNum}`, `Breaker Incomer 20kV ${st[trafoKey].name} diubah ke ${nextStatus}.`, nextStatus === 'TRIP' ? 'TRIP' : 'CLOSE');
      if (nextStatus === 'TRIP') playTripAlarm();
      return {
        ...st,
        [trafoKey]: { ...st[trafoKey], pmt20kVAStatus: nextStatus }
      };
    });
  };

  const togglePMTKopel = () => {
    updateCurrentStation(st => {
      const nextStatus = st.pmtKopelStatus === 'CLOSED' ? 'TRIP' : 'CLOSED';
      addLog('PMT KOPEL', `Breaker Kopel 20kV ${st.name} diubah ke ${nextStatus}.`, nextStatus === 'TRIP' ? 'TRIP' : 'CLOSE');
      if (nextStatus === 'TRIP') playTripAlarm();
      return {
        ...st,
        pmtKopelStatus: nextStatus
      };
    });
  };

  const toggleFeederStatus = (feederId: string) => {
    updateCurrentStation(st => {
      const updated: FeederData[] = st.feeders.map(f => {
        if (f.id === feederId) {
          const nextStatus: 'CLOSED' | 'TRIP' = f.status === 'CLOSED' ? 'TRIP' : 'CLOSED';
          addLog(f.code, `${f.name} (${f.code}) diubah ke status ${nextStatus}.`, nextStatus === 'TRIP' ? 'TRIP' : 'CLOSE');
          if (nextStatus === 'TRIP') playTripAlarm();
          return {
            ...f,
            status: nextStatus,
            currentA: nextStatus === 'TRIP' ? 0 : 220,
            powerMw: nextStatus === 'TRIP' ? 0 : 7.2
          };
        }
        return f;
      });
      return { ...st, feeders: updated };
    });
  };

  // DEVICE (EQUIPMENT) NETWORK HANDLERS
  const toggleDeviceStatus = (feederId: string, deviceId: string) => {
    updateCurrentStation(st => {
      const updatedFeeders = st.feeders.map(f => {
        if (f.id === feederId) {
          const devices = f.devices || getDefaultFeederDevices(f.code, f.name);
          const updatedDevices = devices.map(d => {
            if (d.id === deviceId) {
              const nextStatus: 'CLOSED' | 'TRIP' | 'OPEN' = d.status === 'CLOSED' ? (d.type === 'FCO' ? 'OPEN' : 'TRIP') : 'CLOSED';
              addLog(d.code, `${d.type} ${d.name} (${d.code}) diubah ke ${nextStatus}.`, nextStatus === 'CLOSED' ? 'CLOSE' : 'TRIP');
              if (nextStatus !== 'CLOSED') playTripAlarm();
              return { ...d, status: nextStatus };
            }
            return d;
          });
          return { ...f, devices: updatedDevices };
        }
        return f;
      });
      return { ...st, feeders: updatedFeeders };
    });
  };

  const openAddDeviceModal = (feederId: string, insertAtIndex?: number) => {
    const feeder = currentStation.feeders.find(f => f.id === feederId);
    if (!feeder) return;

    setTargetFeederIdForDevice(feederId);
    setEditingDevice(null);
    setDeviceTypeInput('RECLOSER');
    setDeviceCodeInput(insertAtIndex !== undefined ? `SEC-${insertAtIndex}` : `REC-${feeder.code}`);
    setDeviceNameInput(insertAtIndex !== undefined ? `Peralatan Sisipan Titik #${insertAtIndex}` : `Recloser Baru`);
    setDeviceLocationInput(insertAtIndex !== undefined ? `Section Jaringan #${insertAtIndex}` : `Section Mid-Line`);
    setDeviceStatusInput('CLOSED');
    setDeviceRelayInput('OCR/GFR Auto-Reclose');
    setShowDeviceModal(true);
  };

  const openEditDeviceModal = (feederId: string, device: FeederDevice) => {
    setTargetFeederIdForDevice(feederId);
    setEditingDevice(device);
    setDeviceTypeInput(device.type);
    setDeviceCodeInput(device.code);
    setDeviceNameInput(device.name);
    setDeviceLocationInput(device.location);
    setDeviceStatusInput(device.status);
    setDeviceRelayInput(device.relayProtection || 'OCR/GFR');
    setShowDeviceModal(true);
  };

  const handleSaveDeviceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetFeederIdForDevice || !deviceCodeInput.trim() || !deviceNameInput.trim()) return;

    updateCurrentStation(st => {
      const updatedFeeders = st.feeders.map(f => {
        if (f.id === targetFeederIdForDevice) {
          const devices = f.devices || getDefaultFeederDevices(f.code, f.name);
          if (editingDevice) {
            // Edit existing device
            const updated = devices.map(d => d.id === editingDevice.id ? {
              ...d,
              type: deviceTypeInput,
              code: deviceCodeInput.toUpperCase(),
              name: deviceNameInput,
              location: deviceLocationInput,
              status: deviceStatusInput,
              relayProtection: deviceRelayInput
            } : d);
            addLog(deviceCodeInput, `Peralatan ${deviceNameInput} diperbarui.`, 'INFO');
            return { ...f, devices: updated };
          } else {
            // Add new device
            const newDev: FeederDevice = {
              id: `dev_${Date.now()}`,
              type: deviceTypeInput,
              code: deviceCodeInput.toUpperCase(),
              name: deviceNameInput,
              location: deviceLocationInput || 'Lokasi Jaringan 20kV',
              status: deviceStatusInput,
              relayProtection: deviceRelayInput
            };
            addLog(deviceCodeInput, `Peralatan Baru ${newDev.type} (${newDev.name}) ditambahkan.`, 'INFO');
            return { ...f, devices: [...devices, newDev] };
          }
        }
        return f;
      });
      return { ...st, feeders: updatedFeeders };
    });

    setShowDeviceModal(false);
  };

  const handleDeleteDevice = (feederId: string, deviceId: string, deviceCode: string) => {
    if (!confirm(`Hapus peralatan ${deviceCode} dari penyulang ini?`)) return;

    updateCurrentStation(st => {
      const updatedFeeders = st.feeders.map(f => {
        if (f.id === feederId) {
          const devices = f.devices || getDefaultFeederDevices(f.code, f.name);
          const updated = devices.filter(d => d.id !== deviceId);
          addLog(deviceCode, `Peralatan ${deviceCode} dihapus dari jaringan.`, 'WARNING');
          return { ...f, devices: updated };
        }
        return f;
      });
      return { ...st, feeders: updatedFeeders };
    });
  };

  // Reset to Normal
  const resetStationToNormal = () => {
    updateCurrentStation(st => {
      const resetT1 = { ...st.trafo1, pmt150kVAStatus: 'CLOSED' as const, pmt20kVAStatus: 'CLOSED' as const };
      const resetT2 = { ...st.trafo2, pmt150kVAStatus: 'CLOSED' as const, pmt20kVAStatus: 'CLOSED' as const };
      const resetFeeders = st.feeders.map(f => ({
        ...f,
        status: 'CLOSED' as const,
        devices: (f.devices || getDefaultFeederDevices(f.code, f.name)).map(d => ({
          ...d,
          status: d.type === 'COUPLING' ? 'OPEN' as const : 'CLOSED' as const
        }))
      }));
      addLog(st.code, `Semua breaker PMT, Recloser, LBS, PMCB, FCO di ${st.name} disetel ulang ke NORMAL ENERGIZED.`, 'INFO');
      return {
        ...st,
        trafo1: resetT1,
        trafo2: resetT2,
        feeders: resetFeeders,
        pmtKopelStatus: 'CLOSED'
      };
    });
  };

  // HANDLERS FOR STATION (ADD / EDIT / DELETE)
  const openAddStationModal = () => {
    setEditingStation(null);
    setStationTypeInput('GI');
    setStationNameInput('');
    setStationCodeInput('');
    setSutt1Input('SUTT 150kV LINE 1');
    setSutt2Input('SUTT 150kV LINE 2');
    setTrafo1MvaInput(60);
    setTrafo2MvaInput(60);
    setShowStationModal(true);
  };

  const openEditStationModal = () => {
    setEditingStation(currentStation);
    setStationTypeInput(currentStation.type);
    setStationNameInput(currentStation.name);
    setStationCodeInput(currentStation.code);
    setSutt1Input(currentStation.sutt1Name);
    setSutt2Input(currentStation.sutt2Name);
    setTrafo1MvaInput(currentStation.trafo1.mva || 60);
    setTrafo2MvaInput(currentStation.trafo2.mva || 60);
    setShowStationModal(true);
  };

  const handleSaveStationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stationNameInput.trim() || !stationCodeInput.trim()) return;

    if (editingStation) {
      const updatedList = stations.map(st => {
        if (st.id === editingStation.id) {
          return {
            ...st,
            type: stationTypeInput,
            name: stationNameInput.toUpperCase(),
            code: stationCodeInput.toUpperCase(),
            sutt1Name: sutt1Input,
            sutt2Name: sutt2Input,
            trafo1: { ...st.trafo1, mva: trafo1MvaInput, name: `TRAFO 1 (${trafo1MvaInput} MVA)` },
            trafo2: { ...st.trafo2, mva: trafo2MvaInput, name: `TRAFO 2 (${trafo2MvaInput} MVA)` }
          };
        }
        return st;
      });
      setStations(updatedList);
      persistStationsState(updatedList);
      addLog('SYSTEM', `Gardu ${stationNameInput} berhasil diperbarui.`, 'INFO');
    } else {
      const newId = `st_${Date.now()}`;
      const newStation: StationData = {
        id: newId,
        type: stationTypeInput,
        name: stationNameInput.toUpperCase(),
        code: stationCodeInput.toUpperCase(),
        sutt1Name: sutt1Input || 'SUTT 150kV LINE 1',
        sutt2Name: sutt2Input || 'SUTT 150kV LINE 2',
        trafo1: {
          id: 'trafo_1',
          name: stationTypeInput === 'GI' ? `TRAFO 1 (${trafo1MvaInput} MVA)` : 'INCOMER UTAMA 1 (20kV)',
          mva: trafo1MvaInput,
          powerMw: 25.0,
          loadPercent: 41.6,
          tap: '9/17',
          tapMode: 'AUTO',
          tempWdgC: 55.0,
          coolingMode: 'ONAN',
          pmt150kVAStatus: 'CLOSED',
          pmt20kVAStatus: 'CLOSED'
        },
        trafo2: {
          id: 'trafo_2',
          name: stationTypeInput === 'GI' ? `TRAFO 2 (${trafo2MvaInput} MVA)` : 'INCOMER UTAMA 2 (20kV)',
          mva: trafo2MvaInput,
          powerMw: 20.0,
          loadPercent: 33.3,
          tap: '9/17',
          tapMode: 'AUTO',
          tempWdgC: 52.0,
          coolingMode: 'ONAN',
          pmt150kVAStatus: 'CLOSED',
          pmt20kVAStatus: 'CLOSED'
        },
        busbars: [
          { id: 'BUS_A', name: 'BUS 20kV - A', voltageKv: 20.15 },
          { id: 'BUS_B', name: 'BUS 20kV - B', voltageKv: 20.10 }
        ],
        feeders: [
          { id: `f_${Date.now()}_1`, code: 'F-01', name: 'Penyulang Utama 1', busId: 'BUS_A', status: 'CLOSED', currentA: 200, powerMw: 6.5, voltageKv: 20.1, cosPhi: 0.95, devices: getDefaultFeederDevices('F-01', 'Penyulang Utama 1') },
          { id: `f_${Date.now()}_2`, code: 'F-02', name: 'Penyulang Utama 2', busId: 'BUS_B', status: 'CLOSED', currentA: 180, powerMw: 5.9, voltageKv: 20.1, cosPhi: 0.95, devices: getDefaultFeederDevices('F-02', 'Penyulang Utama 2') }
        ],
        pmtKopelStatus: 'CLOSED'
      };

      const updatedList = [...stations, newStation];
      setStations(updatedList);
      setActiveStationId(newId);
      persistStationsState(updatedList);
      addLog('SYSTEM', `Stasiun Baru ${newStation.type} ${newStation.name} berhasil ditambahkan!`, 'INFO');
    }

    setShowStationModal(false);
  };

  const handleDeleteStation = (id: string, name: string) => {
    if (stations.length <= 1) {
      alert("Tidak bisa menghapus stasiun terakhir!");
      return;
    }
    if (!confirm(`Hapus Gardu ${name} dari daftar SCADA Mini DCC?`)) return;

    const updatedList = stations.filter(st => st.id !== id);
    setStations(updatedList);
    setActiveStationId(updatedList[0].id);
    persistStationsState(updatedList);
    addLog('SYSTEM', `Gardu ${name} telah dihapus.`, 'WARNING');
  };

  // BUSBAR MANAGEMENT HANDLERS
  const handleAddBusbarSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBusbarName.trim()) return;

    const busId = `BUS_${Date.now().toString().slice(-4)}`;
    const newBus: BusbarData = {
      id: busId,
      name: newBusbarName.toUpperCase(),
      voltageKv: newBusbarKv
    };

    updateCurrentStation(st => {
      const updatedBusbars = [...st.busbars, newBus];
      addLog('SYSTEM', `Busbar Baru ${newBus.name} (20kV) ditambahkan ke ${st.name}.`, 'INFO');
      return { ...st, busbars: updatedBusbars };
    });

    setNewBusbarName('');
    setShowBusbarModal(false);
  };

  const handleDeleteBusbar = (busId: string, busName: string) => {
    if (currentStation.busbars.length <= 1) {
      alert("Minimal harus ada 1 Busbar 20kV!");
      return;
    }

    updateCurrentStation(st => {
      const updatedBusbars = st.busbars.filter(b => b.id !== busId);
      const fallbackBusId = updatedBusbars[0].id;
      const updatedFeeders = st.feeders.map(f => f.busId === busId ? { ...f, busId: fallbackBusId } : f);
      addLog('SYSTEM', `Busbar ${busName} dihapus. Penyulang dialihkan ke ${updatedBusbars[0].name}.`, 'WARNING');
      return { ...st, busbars: updatedBusbars, feeders: updatedFeeders };
    });
  };

  // FEEDER MANAGEMENT HANDLERS
  const openAddFeederModal = () => {
    setEditingFeeder(null);
    setFeederCodeInput(`F-0${currentStation.feeders.length + 1}`);
    setFeederNameInput('');
    setFeederBusIdInput(currentStation.busbars[0]?.id || 'BUS_A');
    setFeederCurrentInput(250);
    setFeederVoltageInput(20.10);
    setFeederCosPhiInput(0.95);
    setShowFeederModal(true);
  };

  const openEditFeederModal = (feeder: FeederData) => {
    setEditingFeeder(feeder);
    setFeederCodeInput(feeder.code);
    setFeederNameInput(feeder.name);
    setFeederBusIdInput(feeder.busId);
    setFeederCurrentInput(feeder.currentA);
    setFeederVoltageInput(feeder.voltageKv);
    setFeederCosPhiInput(feeder.cosPhi);
    setShowFeederModal(true);
  };

  const handleSaveFeederSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feederCodeInput.trim() || !feederNameInput.trim()) return;

    if (editingFeeder) {
      updateCurrentStation(st => {
        const updatedFeeders = st.feeders.map(f => {
          if (f.id === editingFeeder.id) {
            return {
              ...f,
              code: feederCodeInput.toUpperCase(),
              name: feederNameInput,
              busId: feederBusIdInput,
              currentA: feederCurrentInput,
              voltageKv: feederVoltageInput,
              cosPhi: feederCosPhiInput,
              powerMw: parseFloat((Math.sqrt(3) * feederCurrentInput * feederVoltageInput * feederCosPhiInput / 1000).toFixed(2))
            };
          }
          return f;
        });
        addLog(feederCodeInput, `Data penyulang ${feederNameInput} berhasil diperbarui.`, 'INFO');
        return { ...st, feeders: updatedFeeders };
      });
    } else {
      const newF: FeederData = {
        id: `f_${Date.now()}`,
        code: feederCodeInput.toUpperCase(),
        name: feederNameInput,
        busId: feederBusIdInput,
        status: 'CLOSED',
        currentA: feederCurrentInput,
        powerMw: parseFloat((Math.sqrt(3) * feederCurrentInput * feederVoltageInput * feederCosPhiInput / 1000).toFixed(2)),
        voltageKv: feederVoltageInput,
        cosPhi: feederCosPhiInput,
        devices: getDefaultFeederDevices(feederCodeInput, feederNameInput)
      };

      updateCurrentStation(st => {
        addLog('SYSTEM', `Penyulang baru ${newF.code} (${newF.name}) ditambahkan.`, 'INFO');
        return { ...st, feeders: [...st.feeders, newF] };
      });
    }

    setShowFeederModal(false);
  };

  const handleDeleteFeeder = (id: string, code: string) => {
    updateCurrentStation(st => {
      const updated = st.feeders.filter(f => f.id !== id);
      addLog('SYSTEM', `Penyulang ${code} dihapus dari skema.`, 'WARNING');
      return { ...st, feeders: updated };
    });
  };

  // Helper for Device Badge Color & Icon
  const getDeviceIconAndBadge = (type: DeviceType) => {
    switch (type) {
      case 'INCOMING':
        return { icon: <Power className="w-3.5 h-3.5 text-cyan-400" />, badgeBg: 'bg-cyan-950 border-cyan-500/40 text-cyan-300', label: 'INCOMING' };
      case 'OUTGOING':
        return { icon: <Shield className="w-3.5 h-3.5 text-rose-400" />, badgeBg: 'bg-rose-950 border-rose-500/40 text-rose-300', label: 'OUTGOING' };
      case 'COUPLING':
        return { icon: <Unlink className="w-3.5 h-3.5 text-indigo-400" />, badgeBg: 'bg-indigo-950 border-indigo-500/40 text-indigo-300', label: 'COUPLING' };
      case 'RECLOSER':
        return { icon: <RotateCcw className="w-3.5 h-3.5 text-amber-400" />, badgeBg: 'bg-amber-950 border-amber-500/40 text-amber-300', label: 'RECLOSER' };
      case 'LBS':
        return { icon: <ToggleLeft className="w-3.5 h-3.5 text-blue-400" />, badgeBg: 'bg-blue-950 border-blue-500/40 text-blue-300', label: 'LBS' };
      case 'PMCB':
        return { icon: <Cpu className="w-3.5 h-3.5 text-purple-400" />, badgeBg: 'bg-purple-950 border-purple-500/40 text-purple-300', label: 'PMCB' };
      case 'FCO':
        return { icon: <Flame className="w-3.5 h-3.5 text-emerald-400" />, badgeBg: 'bg-emerald-950 border-emerald-500/40 text-emerald-300', label: 'FCO' };
      default:
        return { icon: <Zap className="w-3.5 h-3.5 text-slate-400" />, badgeBg: 'bg-slate-900 border-slate-700 text-slate-300', label: type };
    }
  };

  // Inspector object for inspecting feeder modal
  const activeInspectingFeeder = useMemo(() => {
    if (!inspectingFeederId) return null;
    return currentStation.feeders.find(f => f.id === inspectingFeederId) || null;
  }, [inspectingFeederId, currentStation]);

  return (
    <div className={`flex flex-col bg-[#06080e] text-slate-100 min-h-screen transition-all duration-300 font-mono select-none ${
      isFullscreen ? 'fixed inset-0 z-[9999] w-screen h-screen' : 'relative w-full'
    }`}>
      {/* Dynamic Grid Canvas Style */}
      <style>{`
        .mini-dcc-grid {
          background-color: #06080e;
          ${showGridLines 
            ? 'background-image: radial-gradient(#1e293b 1.2px, transparent 1.2px); background-size: 20px 20px;' 
            : 'background-image: none !important;'}
        }
        .glow-line-cyan {
          box-shadow: 0 0 10px rgba(0, 242, 255, 0.85);
        }
        .glow-line-red {
          box-shadow: 0 0 10px rgba(239, 68, 68, 0.85);
        }
        .glow-box-red {
          box-shadow: 0 0 12px rgba(239, 68, 68, 0.6);
        }
      `}</style>

      {/* 1. SCADA COCKPIT TOP HEADER */}
      <header className="bg-[#0b101d] border-b border-slate-800 px-5 py-3 flex flex-wrap items-center justify-between gap-4 shrink-0 relative z-30 shadow-2xl">
        
        {/* Left Station Selector & Overview */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.3)]">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-black tracking-widest text-cyan-300 uppercase">MINI DCC - SCADA SYSTEM</h1>
              
              {/* STATION SELECTOR DROPDOWN */}
              <div className="relative flex items-center gap-1.5 bg-slate-900 border border-cyan-500/40 rounded-lg px-2.5 py-1">
                <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                <select
                  value={activeStationId}
                  onChange={e => setActiveStationId(e.target.value)}
                  className="bg-transparent text-xs font-black text-amber-300 focus:outline-none cursor-pointer tracking-wider"
                >
                  {stations.map(st => (
                    <option key={st.id} value={st.id} className="bg-slate-950 text-slate-200">
                      [{st.type}] {st.name} ({st.code})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              </div>

              {/* Station Type Pill */}
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black border flex items-center gap-1 ${
                currentStation.type === 'GI' 
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              }`}>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                {currentStation.type === 'GI' ? 'GARDU INDUK 150/20kV' : 'GARDU HUBUNG 20kV'}
              </span>
            </div>

            <p className="text-[10px] text-slate-400 tracking-wide mt-0.5 flex items-center gap-2">
              <span>SLD Distribution Control Center & Network Monitoring (Pangkal ➔ Ujung)</span>
              <span className="text-slate-600">•</span>
              <button 
                onClick={openEditStationModal}
                className="text-cyan-400 hover:text-cyan-300 underline font-bold flex items-center gap-1 cursor-pointer"
              >
                <Edit3 className="w-3 h-3" />
                Edit Detail {currentStation.code}
              </button>
            </p>
          </div>
        </div>

        {/* Global Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* MAIN CANVAS VIEW MODE SWITCHER TABS */}
          <div className="flex items-center bg-slate-900 border border-cyan-500/40 p-1 rounded-xl gap-1 mr-1">
            <button
              onClick={() => setMainViewMode('FULL_SYSTEM_SLD')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                mainViewMode === 'FULL_SYSTEM_SLD'
                  ? 'bg-amber-500 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.5)]'
                  : 'bg-transparent text-slate-400 hover:text-white'
              }`}
              title="Tampilkan Wallboard SCADA 1 Layar Monitoring Seluruh Sistem (GIs & GHs)"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>🌐 WALLBOARD 1 LAYAR</span>
            </button>
            <button
              onClick={() => setMainViewMode('FEEDER_SLD')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                mainViewMode === 'FEEDER_SLD'
                  ? 'bg-cyan-500 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                  : 'bg-transparent text-slate-400 hover:text-white'
              }`}
              title="Tampilkan Diagram SLD Penyulang 20kV (Pangkal ➔ Ujung Jaringan) di Menu Utama DCC"
            >
              <GitCommit className="w-3.5 h-3.5" />
              <span>⚡ SLD PENYULANG</span>
            </button>
            <button
              onClick={() => setMainViewMode('OVERVIEW_GI')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                mainViewMode === 'OVERVIEW_GI'
                  ? 'bg-cyan-500 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                  : 'bg-transparent text-slate-400 hover:text-white'
              }`}
              title="Tampilkan Overview Makro Gardu Induk / Gardu Hubung (Trafo & All Busbar)"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>🏢 OVERVIEW GARDU</span>
            </button>
            <button
              onClick={() => setMainViewMode('CUSTOM_DRAW_SLD')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                mainViewMode === 'CUSTOM_DRAW_SLD'
                  ? 'bg-amber-500 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.5)]'
                  : 'bg-transparent text-slate-400 hover:text-white'
              }`}
              title="Buka Editor Gambar Garis, Busbar, & Layout Kustom 1 Sistem Normal"
            >
              <Edit3 className="w-3.5 h-3.5 text-amber-950" />
              <span>🎨 DESAIN & DRAW LAYOUT</span>
            </button>
          </div>

          {/* Add GI / GH Station Button */}
          <button
            onClick={openAddStationModal}
            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-black flex items-center gap-1.5 cursor-pointer transition-all shadow-md active:scale-95"
            title="Tambah Gardu Induk (GI) atau Gardu Hubung (GH) Baru"
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>+ GH / GI Baru</span>
          </button>

          {/* Manage 20kV Busbars Button */}
          <button
            onClick={() => setShowBusbarModal(true)}
            className="px-3 py-1.5 rounded-lg bg-cyan-950 border border-cyan-500/50 text-cyan-300 hover:bg-cyan-900 text-xs font-black flex items-center gap-1.5 cursor-pointer transition-all shadow-md active:scale-95"
            title="Kelola & Tambah Busbar 20kV"
          >
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>Busbar 20kV ({currentStation.busbars.length})</span>
          </button>

          {/* Add Feeder Button */}
          <button
            onClick={openAddFeederModal}
            className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black flex items-center gap-1.5 cursor-pointer transition-all shadow-md active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ Penyulang</span>
          </button>

          {/* Telemetry Toggle */}
          <button
            onClick={() => setTelemetryActive(!telemetryActive)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black border transition-all cursor-pointer ${
              telemetryActive 
                ? 'bg-cyan-950 border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.3)]' 
                : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}
          >
            <Activity className={`w-3.5 h-3.5 ${telemetryActive ? 'animate-bounce text-cyan-400' : ''}`} />
            <span>Telemetri {telemetryActive ? 'LIVE' : 'PAUSED'}</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-lg border transition-all cursor-pointer ${
              soundEnabled ? 'bg-amber-950/50 border-amber-500/40 text-amber-300' : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}
            title={soundEnabled ? "Suara Alarm Aktif" : "Suara Alarm Senyap"}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Log Drawer Toggle */}
          <button
            onClick={() => setShowLogDrawer(!showLogDrawer)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black border transition-all cursor-pointer ${
              showLogDrawer ? 'bg-cyan-500 text-slate-950 border-cyan-300' : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Log ({logs.length})</span>
          </button>

          {/* Grid Visibility Toggle Button (Snap remains active without visual clutter) */}
          <button
            onClick={() => setShowGridLines(!showGridLines)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black border transition-all cursor-pointer ${
              showGridLines 
                ? 'bg-cyan-950/90 border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.3)]' 
                : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
            title={showGridLines 
              ? "Sembunyikan Garis/Titik Grid (Snap magnet tetap aktif untuk gambar bebas tanpa visual clutter)" 
              : "Tampilkan Garis/Titik Grid (Snap magnet aktif)"}
          >
            <Grid className={`w-3.5 h-3.5 ${showGridLines ? 'text-cyan-400' : 'text-slate-500'}`} />
            <span>Grid: {showGridLines ? 'ON' : 'OFF'}</span>
          </button>

          {/* Reset Button */}
          <button
            onClick={resetStationToNormal}
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-amber-300 transition-all cursor-pointer active:scale-95"
            title="Reset Seluruh Breaker & Network Switches ke Normal Energized"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Delete Station Button */}
          <button
            onClick={() => handleDeleteStation(currentStation.id, currentStation.name)}
            className="p-2 rounded-lg bg-slate-900 hover:bg-rose-950 border border-slate-700 hover:border-rose-600 text-slate-400 hover:text-rose-300 transition-all cursor-pointer"
            title="Hapus Gardu Ini"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          {/* Zoom Controls */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs gap-1">
            <button onClick={() => setZoomLevel(Math.max(60, zoomLevel - 10))} className="font-black text-slate-400 hover:text-white px-1">-</button>
            <span className="font-black text-cyan-300 min-w-[32px] text-center">{zoomLevel}%</span>
            <button onClick={() => setZoomLevel(Math.min(130, zoomLevel + 10))} className="font-black text-slate-400 hover:text-white px-1">+</button>
          </div>

          {/* Fullscreen Button */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 transition-all cursor-pointer"
            title={isFullscreen ? "Keluar Fullscreen" : "Layar Penuh SCADA"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Cloud Persistence Status */}
      {saveStatus !== 'IDLE' && (
        <div className={`px-4 py-1 text-[10px] font-extrabold text-center flex items-center justify-center gap-1.5 transition-all ${
          saveStatus === 'SAVING' ? 'bg-amber-500/20 text-amber-300 border-b border-amber-500/30' :
          saveStatus === 'SUCCESS' ? 'bg-emerald-500/20 text-emerald-300 border-b border-emerald-500/30' :
          'bg-rose-500/20 text-rose-300 border-b border-rose-500/30'
        }`}>
          {saveStatus === 'SAVING' && <RefreshCw className="w-3 h-3 animate-spin" />}
          {saveStatus === 'SUCCESS' && <Check className="w-3 h-3 text-emerald-400" />}
          <span>
            {saveStatus === 'SAVING' && 'Menyinkronkan skema Gardu ke Firestore Cloud...'}
            {saveStatus === 'SUCCESS' && 'Skema Gardu & Network Peralatan berhasil diperbarui di Cloud!'}
            {saveStatus === 'ERROR' && 'Koneksi cloud terganggu. Data disimpan lokal.'}
          </span>
        </div>
      )}

      {/* 2. SCADA CANVAS WORKSPACE */}
      <main className="flex-1 overflow-auto mini-dcc-grid p-6 md:p-10 flex flex-col items-center justify-start relative">
        <div 
          className="w-full max-w-[1280px] transition-transform duration-200 origin-top flex flex-col items-center"
          style={{ transform: `scale(${zoomLevel / 100})` }}
        >

          {mainViewMode === 'CUSTOM_DRAW_SLD' ? (
            <div className="w-full">
              <CustomSldCanvasEditor 
                stations={stations} 
                showGridLines={showGridLines}
                onToggleGridLines={() => setShowGridLines(!showGridLines)}
              />
            </div>
          ) : mainViewMode === 'FULL_SYSTEM_SLD' ? (
            /* 🌐 WALLBOARD MONITORING 1 LAYAR SEPARUH SISTEM */
            <SystemWideSldWallboard
              stations={stations}
              onSelectStation={(stId) => {
                setActiveStationId(stId);
                setMainViewMode('OVERVIEW_GI');
              }}
              onTogglePmt150kV={(stId, trafoNum) => {
                setStations(prev => {
                  const updated = prev.map(st => {
                    if (st.id === stId) {
                      const tr = trafoNum === 1 ? st.trafo1 : st.trafo2;
                      const newStatus = tr.pmt150kVAStatus === 'CLOSED' ? 'TRIP' as const : 'CLOSED' as const;
                      const updatedTr = { ...tr, pmt150kVAStatus: newStatus };
                      addLog(st.code, `PMT 150kV ${tr.name} di ${st.name} di-toggle ke ${newStatus}`, newStatus === 'TRIP' ? 'TRIP' : 'CLOSE');
                      return {
                        ...st,
                        trafo1: trafoNum === 1 ? updatedTr : st.trafo1,
                        trafo2: trafoNum === 2 ? updatedTr : st.trafo2
                      };
                    }
                    return st;
                  });
                  persistStationsState(updated);
                  return updated;
                });
              }}
              onTogglePmt20kVIncomer={(stId, trafoNum) => {
                setStations(prev => {
                  const updated = prev.map(st => {
                    if (st.id === stId) {
                      const tr = trafoNum === 1 ? st.trafo1 : st.trafo2;
                      const newStatus = tr.pmt20kVAStatus === 'CLOSED' ? 'TRIP' as const : 'CLOSED' as const;
                      const updatedTr = { ...tr, pmt20kVAStatus: newStatus };
                      addLog(st.code, `PMT 20kV Incomer ${tr.name} di ${st.name} di-toggle ke ${newStatus}`, newStatus === 'TRIP' ? 'TRIP' : 'CLOSE');
                      return {
                        ...st,
                        trafo1: trafoNum === 1 ? updatedTr : st.trafo1,
                        trafo2: trafoNum === 2 ? updatedTr : st.trafo2
                      };
                    }
                    return st;
                  });
                  persistStationsState(updated);
                  return updated;
                });
              }}
              onTogglePmtKopel={(stId) => {
                setStations(prev => {
                  const updated = prev.map(st => {
                    if (st.id === stId) {
                      const newStatus = st.pmtKopelStatus === 'CLOSED' ? 'TRIP' as const : 'CLOSED' as const;
                      addLog(st.code, `PMT Kopel 20kV di ${st.name} di-toggle ke ${newStatus}`, newStatus === 'TRIP' ? 'TRIP' : 'CLOSE');
                      return { ...st, pmtKopelStatus: newStatus };
                    }
                    return st;
                  });
                  persistStationsState(updated);
                  return updated;
                });
              }}
              onToggleFeederPmt={(stId, feederId) => {
                setStations(prev => {
                  const updated = prev.map(st => {
                    if (st.id === stId) {
                      const updatedFeeders = st.feeders.map(f => {
                        if (f.id === feederId) {
                          const newStatus = f.status === 'CLOSED' ? 'TRIP' as const : 'CLOSED' as const;
                          addLog(f.code, `PMT Penyulang ${f.code} di ${st.name} di-toggle ke ${newStatus}`, newStatus === 'TRIP' ? 'TRIP' : 'CLOSE');
                          return { ...f, status: newStatus };
                        }
                        return f;
                      });
                      return { ...st, feeders: updatedFeeders };
                    }
                    return st;
                  });
                  persistStationsState(updated);
                  return updated;
                });
              }}
              onToggleDeviceStatus={(stId, feederId, devId) => {
                setStations(prev => {
                  const updated = prev.map(st => {
                    if (st.id === stId) {
                      const updatedFeeders = st.feeders.map(f => {
                        if (f.id === feederId) {
                          const devList = f.devices || getDefaultFeederDevices(f.code, f.name);
                          const updatedDevs = devList.map(d => {
                            if (d.id === devId) {
                              const newStatus = d.status === 'CLOSED' ? 'TRIP' as const : 'CLOSED' as const;
                              addLog(d.code, `Peralatan ${d.code} (${d.name}) di-toggle ke ${newStatus}`, newStatus === 'TRIP' ? 'TRIP' : 'CLOSE');
                              return { ...d, status: newStatus };
                            }
                            return d;
                          });
                          return { ...f, devices: updatedDevs };
                        }
                        return f;
                      });
                      return { ...st, feeders: updatedFeeders };
                    }
                    return st;
                  });
                  persistStationsState(updated);
                  return updated;
                });
              }}
              onInspectFeeder={(stId, feederId) => {
                setActiveStationId(stId);
                setSelectedFeederIdForSLD(feederId);
                setMainViewMode('FEEDER_SLD');
              }}
              onResetAllNormal={resetStationToNormal}
              telemetryActive={telemetryActive}
            />
          ) : mainViewMode === 'FEEDER_SLD' ? (
            /* ⚡ MAIN DCC MENU: SLD MONITORING PENYULANG 20KV (PANGKAL ➔ UJUNG JARINGAN) */
            <div className="w-full flex flex-col items-center">
              {!activeMainFeeder ? (
                <div className="w-full bg-[#0a1122] border border-cyan-500/30 rounded-2xl p-10 text-center text-slate-400 font-bold">
                  Belum ada penyulang di {currentStation.name}. Klik "+ Penyulang" di menu atas untuk membuat penyulang baru.
                </div>
              ) : (() => {
                const busActive = busEnergizedMap[activeMainFeeder.busId] ?? false;
                const devList = activeMainFeeder.devices || getDefaultFeederDevices(activeMainFeeder.code, activeMainFeeder.name);
                const energizationStates = calculateDeviceEnergization(busActive, activeMainFeeder.status, devList);
                const busbarObj = currentStation.busbars.find(b => b.id === activeMainFeeder.busId);

                return (
                  <div className="w-full flex flex-col items-center">
                    
                    {/* 1. TOP HEADER BANNER CARD (MATCHING USER LAYOUT IMAGE) */}
                    <div className="w-full bg-[#0a1122] border border-cyan-500/40 rounded-2xl p-4 shadow-2xl mb-4 flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-cyan-950 border border-cyan-500/40 text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.3)]">
                          <GitCommit className="w-5 h-5" />
                        </div>
                        <div>
                          <h2 className="text-sm font-black text-cyan-300 uppercase tracking-widest flex items-center gap-2">
                            <span>DIAGRAM MONITORING PENYULANG 20KV (PANGKAL ➔ UJUNG)</span>
                          </h2>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            {/* Feeder Selector dropdown */}
                            <div className="relative flex items-center bg-slate-900 border border-cyan-500/40 rounded-lg px-2.5 py-1 text-xs">
                              <span className="text-slate-400 font-bold mr-1.5">Pilih Penyulang:</span>
                              <select
                                value={activeMainFeeder.id}
                                onChange={e => setSelectedFeederIdForSLD(e.target.value)}
                                className="bg-transparent text-amber-300 font-black focus:outline-none cursor-pointer tracking-wider"
                              >
                                {currentStation.feeders.map(f => (
                                  <option key={f.id} value={f.id} className="bg-slate-950 text-slate-200">
                                    [{f.code}] {f.name} ({f.currentA} A • {f.powerMw} MW)
                                  </option>
                                ))}
                              </select>
                              <ChevronDown className="w-3.5 h-3.5 text-slate-400 pointer-events-none ml-1" />
                            </div>

                            <span className="text-xs font-mono font-bold text-slate-300">
                              • {activeMainFeeder.currentA} A • {activeMainFeeder.powerMw} MW
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => openAddDeviceModal(activeMainFeeder.id)}
                        className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(6,182,212,0.4)] cursor-pointer transition-all active:scale-95"
                      >
                        <Plus className="w-4 h-4" />
                        <span>+ Tambah Peralatan (FCO/LBS/Recloser/dll)</span>
                      </button>
                    </div>

                    {/* 2. SUB-BANNER INFORMATION BOX (MATCHING USER LAYOUT IMAGE) */}
                    <div className="w-full bg-[#0d1627] border border-cyan-900/80 rounded-xl p-3 mb-4 text-xs text-slate-300 flex flex-wrap items-center justify-between gap-3 shadow-lg">
                      <div className="flex items-center gap-2 max-w-3xl">
                        <Info className="w-4 h-4 text-cyan-400 shrink-0" />
                        <span>
                          Simulasi Aliran Listrik dari PMT Incoming & PMT Outgoing (Pangkal) melalui Recloser, LBS, PMCB, FCO hingga Sakelar Kopel (Ujung Jaringan). Klik tombol sakelar untuk mengubah status TRIP / OPEN / CLOSED.
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[10.5px] font-black shrink-0">
                        <span className="flex items-center gap-1.5 text-emerald-400">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                          ENERGIZED
                        </span>
                        <span className="flex items-center gap-1.5 text-rose-400">
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                          TRIP / PADAM
                        </span>
                      </div>
                    </div>

                    {/* 3. MODE MONITORING & EQUIPMENT SEQUENCE BAR */}
                    <div className="w-full flex flex-wrap items-center justify-between bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 gap-3 mb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-400">MODE MONITORING:</span>
                        <button
                          onClick={() => setInspectorViewMode('SLD')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                            inspectorViewMode === 'SLD'
                              ? 'bg-cyan-500 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                              : 'bg-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          <GitCommit className="w-3.5 h-3.5" />
                          <span>⚡ DIAGRAM SLD (SKEMA BERHUBUNG)</span>
                        </button>
                        <button
                          onClick={() => setInspectorViewMode('GRID')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                            inspectorViewMode === 'GRID'
                              ? 'bg-cyan-500 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                              : 'bg-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          <LayoutGrid className="w-3.5 h-3.5" />
                          <span>📋 GRID KARTU PERALATAN</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-amber-300">
                          Urutan Peralatan: Pangkal ➔ Ujung ({devList.length} Unit)
                        </span>
                        <button
                          onClick={() => openAddDeviceModal(activeMainFeeder.id)}
                          className="px-2.5 py-1 rounded-lg bg-cyan-950 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-900 text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>+ Tambah Peralatan</span>
                        </button>
                      </div>
                    </div>

                    {/* 4. MAIN VERTICAL SLD CANVAS WORKSPACE */}
                    {inspectorViewMode === 'SLD' ? (
                      /* ⚡ SLD VERTICAL CONNECTED CANVAS */
                      <div className="w-full bg-[#050913] border border-cyan-500/30 rounded-2xl p-6 shadow-2xl overflow-y-auto relative mini-dcc-grid min-h-[550px] flex flex-col items-center scrollbar-thin">
                        <div className="flex flex-col items-center w-full max-w-xl py-4 gap-0 relative">

                          {/* 1. SOURCE 20kV BUSBAR NODE (TOP - PANGKAL JARINGAN) */}
                          <div className="flex flex-col items-center shrink-0 relative z-10 mb-1 w-full">
                            <div className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-2 flex items-center gap-1.5 bg-slate-900/90 px-3 py-1 rounded-full border border-cyan-800">
                              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                              PANGKAL BUSBAR GARDU INDUK (20kV)
                            </div>
                            
                            {/* Horizontal Busbar Tube */}
                            <div className={`w-full max-w-md h-9 rounded-xl border-2 flex items-center justify-between px-4 shadow-2xl transition-all ${
                              busActive 
                                ? 'bg-cyan-950 border-cyan-400 shadow-[0_0_22px_rgba(0,242,255,0.6)]' 
                                : 'bg-slate-900 border-slate-700'
                            }`}>
                              <div className={`w-3.5 h-3.5 rounded-full ${busActive ? 'bg-cyan-300 animate-ping' : 'bg-slate-700'}`} />
                              <span className="text-xs font-black text-cyan-300 tracking-widest uppercase flex items-center gap-2">
                                ⚡ {busbarObj?.name || 'BUSBAR 20kV'}
                              </span>
                              <div className="text-[10px] font-mono font-bold text-cyan-300 bg-slate-950 px-2 py-0.5 rounded border border-cyan-900/80">
                                {busbarObj?.voltageKv || 20.15} kV
                              </div>
                              <div className={`w-3.5 h-3.5 rounded-full ${busActive ? 'bg-cyan-300' : 'bg-slate-700'}`} />
                            </div>
                          </div>

                          {/* Vertical Connecting Busbar Line to First Device */}
                          <div className="flex flex-col items-center shrink-0 h-12 relative z-0">
                            <div className={`w-[4px] h-full transition-all ${
                              busActive ? 'bg-cyan-400 glow-line-cyan' : 'bg-slate-700'
                            }`} />
                            {busActive && (
                              <span className="absolute top-2 text-[10px] text-cyan-300 font-bold animate-bounce">
                                ▼
                              </span>
                            )}
                          </div>

                          {/* 2. SEQUENTIAL EQUIPMENT NODES WITH VERTICAL CONNECTING POWER LINES */}
                          {devList.map((dev, idx) => {
                            const isEnergizedNode = energizationStates[idx];
                            const isClosed = dev.status === 'CLOSED';

                            return (
                              <React.Fragment key={dev.id}>
                                {/* DEVICE NODE CARD & GRAPHIC CONTAINER */}
                                <div className="flex flex-col items-center shrink-0 relative group w-full max-w-lg">
                                  
                                  {/* Node Header Info */}
                                  <div className="flex items-center gap-2 mb-2 bg-slate-950/80 px-3 py-1 rounded-lg border border-slate-800">
                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-black bg-cyan-950 text-cyan-300 border border-cyan-800">
                                      TITIK #{idx + 1}
                                    </span>
                                    <span className="text-xs font-black text-white">{dev.code}</span>
                                    <span className={`px-2 py-0.5 rounded text-[8.5px] font-black tracking-wider border ${
                                      isClosed && isEnergizedNode
                                        ? 'bg-emerald-950 text-emerald-400 border-emerald-500/50'
                                        : 'bg-rose-950 text-rose-400 border-rose-500/50 animate-pulse'
                                    }`}>
                                      {isClosed && isEnergizedNode ? '⚡ ENERGIZED (ON)' : '🔴 PADAM / OFF'}
                                    </span>
                                  </div>

                                  {/* Device Graphic Card Layout */}
                                  <div className="flex flex-col md:flex-row items-center justify-center gap-4 bg-slate-900/70 p-4 rounded-2xl border border-slate-800 shadow-xl w-full">
                                    
                                    {/* Realistic Graphic Component */}
                                    <div className="shrink-0">
                                      <EquipmentGraphicRouter
                                        type={dev.type}
                                        status={dev.status}
                                        isEnergized={isEnergizedNode}
                                        code={dev.code}
                                        name={dev.name}
                                        location={dev.location}
                                        relayProtection={dev.relayProtection}
                                      />
                                    </div>

                                    {/* Action Buttons & Details Panel */}
                                    <div className="flex flex-col justify-between h-full w-full space-y-3">
                                      <div>
                                        <div className="flex items-center justify-between">
                                          <span className="text-[10px] font-extrabold text-cyan-400 tracking-wider">
                                            {dev.type} (20kV)
                                          </span>
                                          <span className="text-[9px] font-mono text-slate-400">
                                            {dev.relayProtection || 'OCR/GFR'}
                                          </span>
                                        </div>
                                        <div className="text-xs font-black text-white">{dev.name}</div>
                                        <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                                          <MapPin className="w-3 h-3 text-cyan-400 shrink-0" />
                                          <span className="truncate">{dev.location || 'Jaringan 20kV'}</span>
                                        </div>
                                      </div>

                                      {/* Controls */}
                                      <div className="pt-2 border-t border-slate-800 flex items-center gap-2">
                                        <button
                                          onClick={() => toggleDeviceStatus(activeMainFeeder.id, dev.id)}
                                          className={`flex-1 py-1.5 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md active:scale-95 ${
                                            isClosed
                                              ? 'bg-rose-600 hover:bg-rose-500 text-white'
                                              : 'bg-emerald-600 hover:bg-emerald-500 text-slate-950'
                                          }`}
                                        >
                                          <span>⚡</span>
                                          <span>{isClosed ? 'TRIP / BUKA SAKELAR' : '✔ TUTUP SAKELAR'}</span>
                                        </button>

                                        <button
                                          onClick={() => openEditDeviceModal(activeMainFeeder.id, dev)}
                                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                                          title="Edit Data Peralatan"
                                        >
                                          <Edit3 className="w-3.5 h-3.5" />
                                        </button>

                                        <button
                                          onClick={() => handleDeleteDevice(activeMainFeeder.id, dev.id, dev.code)}
                                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition-colors"
                                          title="Hapus Peralatan Ini"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Vertical Connecting Power Line between devices */}
                                <div className="flex flex-col items-center shrink-0 h-16 relative my-1 z-0">
                                  <div className={`w-[4px] h-full transition-all ${
                                    isEnergizedNode && isClosed
                                      ? 'bg-cyan-400 glow-line-cyan'
                                      : 'bg-rose-600/60 border-l border-dashed border-rose-400'
                                  }`} />

                                  <div className="absolute top-1/2 -translate-y-1/2 z-10 flex items-center gap-2">
                                    <button
                                      onClick={() => openAddDeviceModal(activeMainFeeder.id, idx + 1)}
                                      className="px-2 py-0.5 rounded-full bg-slate-900 hover:bg-cyan-950 border border-cyan-500/40 text-cyan-300 text-[9px] font-extrabold shadow-lg transition-all flex items-center gap-1 hover:scale-105 cursor-pointer"
                                      title="Sisip Peralatan di Antara Titik Ini"
                                    >
                                      <Plus className="w-3 h-3 text-cyan-400" />
                                      <span>Sisip Peralatan</span>
                                    </button>
                                  </div>

                                  {isEnergizedNode && isClosed ? (
                                    <span className="absolute bottom-1 text-[10px] text-cyan-300 font-bold animate-pulse">
                                      ▼ ALIRAN 20kV
                                    </span>
                                  ) : (
                                    <span className="absolute bottom-1 text-[9px] text-rose-400 font-bold">
                                      ❌ TERPUTUS (NO VOLTAGE)
                                    </span>
                                  )}
                                </div>
                              </React.Fragment>
                            );
                          })}

                          {/* 3. UJUNG JARINGAN TIE POINT (BOTTOM) */}
                          <div className="flex flex-col items-center shrink-0 relative z-10 mt-1 w-full max-w-md">
                            <div className="w-full bg-[#081224] border border-cyan-500/40 rounded-2xl p-4 flex flex-col items-center text-center shadow-2xl">
                              <div className="w-8 h-8 rounded-full bg-cyan-950 border border-cyan-400 text-cyan-300 font-black flex items-center justify-center text-xs mb-2 shadow-[0_0_12px_rgba(0,242,255,0.4)]">
                                🔚
                              </div>
                              <span className="text-xs font-black text-white uppercase tracking-wider">
                                UJUNG JARINGAN PENYULANG ({activeMainFeeder.code})
                              </span>
                              <span className="text-[10px] text-slate-400 mt-1">
                                Titik Sambungan Kopel ke Penyulang Tetangga / Load End Distribution Transformer 20kV.
                              </span>
                            </div>
                          </div>

                        </div>
                      </div>
                    ) : (
                      /* 📋 GRID KARTU PERALATAN VIEW */
                      <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {devList.map((dev, idx) => {
                          const isEnergizedNode = energizationStates[idx];
                          const isClosed = dev.status === 'CLOSED';

                          return (
                            <div key={dev.id} className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-3 relative shadow-xl">
                              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                                <span className="text-xs font-black text-cyan-400">#{idx + 1} {dev.type}</span>
                                <span className={`px-2 py-0.5 rounded text-[8px] font-black border ${
                                  isClosed && isEnergizedNode ? 'bg-emerald-950 text-emerald-400 border-emerald-500/40' : 'bg-rose-950 text-rose-400 border-rose-500/40'
                                }`}>
                                  {isClosed && isEnergizedNode ? 'ENERGIZED' : 'PADAM'}
                                </span>
                              </div>
                              <div>
                                <div className="text-sm font-black text-white">{dev.name} ({dev.code})</div>
                                <div className="text-[10px] text-slate-400 mt-1">{dev.location || 'Lokasi Jaringan'}</div>
                              </div>
                              <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                                <button
                                  onClick={() => toggleDeviceStatus(activeMainFeeder.id, dev.id)}
                                  className={`flex-1 py-1 rounded text-xs font-black ${
                                    isClosed ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-slate-950'
                                  }`}
                                >
                                  {isClosed ? 'TRIP / OPEN' : 'CLOSE'}
                                </button>
                                <button
                                  onClick={() => openEditDeviceModal(activeMainFeeder.id, dev)}
                                  className="p-1.5 rounded bg-slate-800 text-slate-300"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <div className="mt-4 text-[10px] text-slate-500 font-mono text-center">
                      Data peralatan tersinkronisasi otomatis ke Firestore Cloud.
                    </div>

                  </div>
                );
              })()}
            </div>
          ) : (
            /* 🏢 OVERVIEW GARDU INDUK (SUTT 150kV & ALL BUSBAR MACRO OVERVIEW) */
            <div className="w-full flex flex-col items-center">
              {/* HIGH VOLTAGE SUTT / INPUT HEADERS */}
              <div className="w-full grid grid-cols-2 gap-32 mb-4 px-16">
                
                {/* SUTT LINE 1 */}
                <div className="flex flex-col items-center relative">
                  <span className="text-[11px] font-black text-rose-500 tracking-wider mb-1 flex items-center gap-1 uppercase">
                    {currentStation.sutt1Name || 'SUTT 150kV LINE 1'}
                  </span>
                  <span className="text-rose-500 text-xs font-black animate-pulse">▲</span>
                  <div className={`w-[3px] h-8 transition-all duration-300 ${
                    isTrafo1Energized ? 'bg-rose-600 glow-line-red' : 'bg-slate-700'
                  }`} />
                </div>

                {/* SUTT LINE 2 */}
                <div className="flex flex-col items-center relative">
                  <span className="text-[11px] font-black text-rose-500 tracking-wider mb-1 flex items-center gap-1 uppercase">
                    {currentStation.sutt2Name || 'SUTT 150kV LINE 2'}
                  </span>
                  <span className="text-rose-500 text-xs font-black animate-pulse">▲</span>
                  <div className={`w-[3px] h-8 transition-all duration-300 ${
                    isTrafo2Energized ? 'bg-rose-600 glow-line-red' : 'bg-slate-700'
                  }`} />
                </div>

              </div>

          {/* 150kV BUSBAR & TRAFO / INCOMER ROW */}
          <div className="w-full grid grid-cols-2 gap-32 relative mb-6">
            
            {/* --- TRAFO / INCOMER 1 COLUMN --- */}
            <div className="flex flex-col items-center relative">
              
              {/* BUS 150kV Header & PMT 150-T1 */}
              <div className="flex items-center gap-3 mb-4 z-10">
                <div className={`px-3 py-1.5 rounded-lg border font-black text-[10px] tracking-wider transition-all ${
                  isTrafo1Energized 
                    ? 'bg-rose-950/80 border-rose-500 text-rose-200 shadow-[0_0_12px_rgba(239,68,68,0.4)]' 
                    : 'bg-slate-900 border-slate-800 text-slate-500'
                }`}>
                  BUS 150 kV - A (151.2 kV)
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => togglePMT150kV(1)}
                    className={`w-7 h-7 rounded text-[10px] font-black flex items-center justify-center cursor-pointer transition-all shadow-md active:scale-90 ${
                      currentStation.trafo1.pmt150kVAStatus === 'CLOSED'
                        ? 'bg-rose-600 text-white border border-rose-400 glow-box-red'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                    title="Toggle PMT 150-T1"
                  >
                    {currentStation.trafo1.pmt150kVAStatus === 'CLOSED' ? 'C' : 'O'}
                  </button>
                  <span className="text-[9px] font-black text-rose-400">PMT 150-T1</span>
                </div>
              </div>

              {/* Line down into Trafo 1 */}
              <div className={`w-[3px] h-6 transition-all duration-300 ${
                isTrafo1Energized ? 'bg-rose-600 glow-line-red' : 'bg-slate-700'
              }`} />

              {/* TRAFO 1 CARD & SYMBOL */}
              <div className="flex items-center gap-4 my-2">
                <div className="bg-[#0b1424] border border-cyan-900/80 rounded-xl p-3 shadow-xl min-w-[210px] text-[10px] space-y-1">
                  <div className="font-extrabold text-slate-100 border-b border-cyan-950 pb-1 mb-1 tracking-wide">
                    {currentStation.trafo1.name}
                  </div>
                  <div className="flex justify-between text-cyan-400 font-extrabold">
                    <span>{currentStation.trafo1.powerMw} MW</span>
                    <span>{currentStation.trafo1.loadPercent}%</span>
                  </div>
                  <div className="flex justify-between text-slate-300 text-[9px]">
                    <span>Tap: {currentStation.trafo1.tap} ({currentStation.trafo1.tapMode})</span>
                  </div>
                  <div className="flex justify-between text-amber-400 text-[9px] font-extrabold">
                    <span>Wdg: {currentStation.trafo1.tempWdgC}°C</span>
                    <span>{currentStation.trafo1.coolingMode}</span>
                  </div>
                </div>

                <div className="relative flex flex-col items-center justify-center w-16 h-20">
                  <div className={`w-14 h-14 rounded-full border-2 flex items-center justify-center transition-all ${
                    isTrafo1Energized ? 'border-rose-500 bg-rose-950/20 shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'border-slate-700 bg-slate-900'
                  }`}>
                    <span className="text-[9px] font-black text-rose-400 absolute top-2">150kV</span>
                  </div>
                  <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center -mt-6 transition-all ${
                    isTrafo1Energized ? 'border-cyan-400 bg-cyan-950/40 shadow-[0_0_15px_rgba(0,242,255,0.5)]' : 'border-slate-700 bg-slate-900'
                  }`}>
                    <span className="text-[9px] font-black text-cyan-300 absolute bottom-1">20kV</span>
                  </div>
                </div>
              </div>

              <div className={`w-[3px] h-6 transition-all duration-300 ${
                isBusADirectActive ? 'bg-cyan-400 glow-line-cyan' : 'bg-slate-700'
              }`} />

              <div className="flex items-center gap-2 mb-2">
                <span className="text-[9px] font-black text-cyan-400">PMT INC-1 (20kV)</span>
                <button
                  onClick={() => togglePMT20kVIncomer(1)}
                  className={`w-7 h-7 rounded text-[10px] font-black flex items-center justify-center cursor-pointer transition-all shadow-md active:scale-90 ${
                    currentStation.trafo1.pmt20kVAStatus === 'CLOSED'
                      ? 'bg-rose-600 text-white border border-rose-400 glow-box-red'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                  title="Toggle PMT INC-1"
                >
                  {currentStation.trafo1.pmt20kVAStatus === 'CLOSED' ? 'C' : 'O'}
                </button>
              </div>

              <span className="px-2 py-0.5 rounded text-[8px] font-black bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                REL: OCR/GFR
              </span>

              <div className={`w-[3px] h-6 transition-all duration-300 mt-1 ${
                isBusADirectActive ? 'bg-cyan-400 glow-line-cyan' : 'bg-slate-700'
              }`} />

            </div>

            {/* PMT KOPEL CENTER CONNECTOR BRIDGE */}
            <div className="absolute top-[310px] left-[26%] right-[26%] flex flex-col items-center justify-center z-20">
              <span className="text-[9px] font-black text-cyan-300 mb-1">PMT KOPEL</span>
              <div className="w-full flex items-center justify-center relative">
                <div className={`h-[3px] flex-1 transition-all duration-300 ${
                  isBusADirectActive || (currentStation.pmtKopelStatus === 'CLOSED' && isBusBDirectActive) 
                    ? 'bg-cyan-400 glow-line-cyan' 
                    : 'bg-slate-700'
                }`} />

                <button
                  onClick={togglePMTKopel}
                  className={`w-8 h-8 rounded text-[10px] font-black flex items-center justify-center cursor-pointer transition-all shadow-xl mx-1 z-20 active:scale-90 ${
                    currentStation.pmtKopelStatus === 'CLOSED'
                      ? 'bg-rose-600 text-white border border-rose-400 glow-box-red'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                  title="Toggle PMT Kopel 20kV"
                >
                  {currentStation.pmtKopelStatus === 'CLOSED' ? 'C' : 'O'}
                </button>

                <div className={`h-[3px] flex-1 transition-all duration-300 ${
                  isBusBDirectActive || (currentStation.pmtKopelStatus === 'CLOSED' && isBusADirectActive) 
                    ? 'bg-cyan-400 glow-line-cyan' 
                    : 'bg-slate-700'
                }`} />
              </div>
            </div>

            {/* --- TRAFO / INCOMER 2 COLUMN --- */}
            <div className="flex flex-col items-center relative">
              <div className="flex items-center gap-3 mb-4 z-10">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => togglePMT150kV(2)}
                    className={`w-7 h-7 rounded text-[10px] font-black flex items-center justify-center cursor-pointer transition-all shadow-md active:scale-90 ${
                      currentStation.trafo2.pmt150kVAStatus === 'CLOSED'
                        ? 'bg-rose-600 text-white border border-rose-400 glow-box-red'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                    title="Toggle PMT 150-T2"
                  >
                    {currentStation.trafo2.pmt150kVAStatus === 'CLOSED' ? 'C' : 'O'}
                  </button>
                  <span className="text-[9px] font-black text-rose-400">PMT 150-T2</span>
                </div>
              </div>

              <div className={`w-[3px] h-6 transition-all duration-300 ${
                isTrafo2Energized ? 'bg-rose-600 glow-line-red' : 'bg-slate-700'
              }`} />

              <div className="flex items-center gap-4 my-2">
                <div className="relative flex flex-col items-center justify-center w-16 h-20">
                  <div className={`w-14 h-14 rounded-full border-2 flex items-center justify-center transition-all ${
                    isTrafo2Energized ? 'border-rose-500 bg-rose-950/20 shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'border-slate-700 bg-slate-900'
                  }`}>
                    <span className="text-[9px] font-black text-rose-400 absolute top-2">150kV</span>
                  </div>
                  <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center -mt-6 transition-all ${
                    isTrafo2Energized ? 'border-cyan-400 bg-cyan-950/40 shadow-[0_0_15px_rgba(0,242,255,0.5)]' : 'border-slate-700 bg-slate-900'
                  }`}>
                    <span className="text-[9px] font-black text-cyan-300 absolute bottom-1">20kV</span>
                  </div>
                </div>

                <div className="bg-[#0b1424] border border-cyan-900/80 rounded-xl p-3 shadow-xl min-w-[210px] text-[10px] space-y-1">
                  <div className="font-extrabold text-slate-100 border-b border-cyan-950 pb-1 mb-1 tracking-wide">
                    {currentStation.trafo2.name}
                  </div>
                  <div className="flex justify-between text-cyan-400 font-extrabold">
                    <span>{currentStation.trafo2.powerMw} MW</span>
                    <span>{currentStation.trafo2.loadPercent}%</span>
                  </div>
                  <div className="flex justify-between text-slate-300 text-[9px]">
                    <span>Tap: {currentStation.trafo2.tap} ({currentStation.trafo2.tapMode})</span>
                  </div>
                  <div className="flex justify-between text-amber-400 text-[9px] font-extrabold">
                    <span>Wdg: {currentStation.trafo2.tempWdgC}°C</span>
                    <span>{currentStation.trafo2.coolingMode}</span>
                  </div>
                </div>
              </div>

              <div className={`w-[3px] h-6 transition-all duration-300 ${
                isBusBDirectActive ? 'bg-cyan-400 glow-line-cyan' : 'bg-slate-700'
              }`} />

              <div className="flex items-center gap-2 mb-2">
                <span className="text-[9px] font-black text-cyan-400">PMT INC-2 (20kV)</span>
                <button
                  onClick={() => togglePMT20kVIncomer(2)}
                  className={`w-7 h-7 rounded text-[10px] font-black flex items-center justify-center cursor-pointer transition-all shadow-md active:scale-90 ${
                    currentStation.trafo2.pmt20kVAStatus === 'CLOSED'
                      ? 'bg-rose-600 text-white border border-rose-400 glow-box-red'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                  title="Toggle PMT INC-2"
                >
                  {currentStation.trafo2.pmt20kVAStatus === 'CLOSED' ? 'C' : 'O'}
                </button>
              </div>

              <span className="px-2 py-0.5 rounded text-[8px] font-black bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                REL: OCR/GFR
              </span>

              <div className={`w-[3px] h-6 transition-all duration-300 mt-1 ${
                isBusBDirectActive ? 'bg-cyan-400 glow-line-cyan' : 'bg-slate-700'
              }`} />

            </div>

          </div>

          {/* DYNAMIC 20kV BUSBARS ROW */}
          <div className="w-full grid gap-6 mb-6 px-4" style={{
            gridTemplateColumns: `repeat(${currentStation.busbars.length}, minmax(0, 1fr))`
          }}>
            {currentStation.busbars.map((bus) => {
              const isEnergized = busEnergizedMap[bus.id] ?? false;
              const busFeedersCount = currentStation.feeders.filter(f => f.busId === bus.id).length;

              return (
                <div key={bus.id} className="flex flex-col items-center relative">
                  <div className="flex items-center justify-between w-full mb-1.5 px-2">
                    <div className={`px-3 py-1 rounded-lg border font-black text-[10px] tracking-wider transition-all ${
                      isEnergized 
                        ? 'bg-cyan-950/90 border-cyan-400 text-cyan-200 shadow-[0_0_12px_rgba(0,242,255,0.4)]' 
                        : 'bg-slate-900 border-slate-800 text-slate-500'
                    }`}>
                      {bus.name} ({bus.voltageKv} kV)
                    </div>
                    <span className="text-[9px] text-slate-400 font-bold">
                      {busFeedersCount} Penyulang
                    </span>
                  </div>

                  {/* Horizontal Busbar Line */}
                  <div className={`w-full h-[4px] rounded-full transition-all duration-300 ${
                    isEnergized ? 'bg-cyan-400 glow-line-cyan' : 'bg-slate-700'
                  }`} />
                </div>
              );
            })}
          </div>

          {/* OUTCOMING FEEDERS ROW GROUPED DYNAMICALLY BY BUSBAR */}
          <div className="w-full grid gap-6" style={{
            gridTemplateColumns: `repeat(${currentStation.busbars.length}, minmax(0, 1fr))`
          }}>
            {currentStation.busbars.map((bus) => {
              const isBusActive = busEnergizedMap[bus.id] ?? false;
              const busFeeders = currentStation.feeders.filter(f => f.busId === bus.id);

              return (
                <div key={bus.id} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
                  {busFeeders.length === 0 ? (
                    <div className="col-span-full border border-dashed border-slate-800 rounded-xl p-4 text-center text-slate-500 text-[10px]">
                      Belum ada penyulang terhubung ke {bus.name}.
                    </div>
                  ) : (
                    busFeeders.map((feeder) => {
                      const isEnergized = isBusActive && feeder.status === 'CLOSED';
                      const devices = feeder.devices || getDefaultFeederDevices(feeder.code, feeder.name);
                      const deviceEnergizedState = calculateDeviceEnergization(isBusActive, feeder.status, devices);

                      // Check if any device down the line is open/trip causing a downstream outage
                      const trippedDeviceIndex = devices.findIndex(d => d.status !== 'CLOSED');

                      return (
                        <div key={feeder.id} className="flex flex-col items-center relative group">
                          
                          {/* Top Line from Busbar */}
                          <div className={`w-[2.5px] h-5 transition-all duration-300 ${
                            isBusActive ? 'bg-cyan-400 glow-line-cyan' : 'bg-slate-700'
                          }`} />

                          {/* CT Symbol (Dots) */}
                          <div className="flex flex-col gap-1 my-0.5">
                            <div className={`w-2 h-2 rounded-full border ${
                              isBusActive ? 'bg-cyan-400 border-cyan-200 shadow-[0_0_6px_rgba(0,242,255,0.8)]' : 'bg-slate-700 border-slate-600'
                            }`} />
                            <div className={`w-2 h-2 rounded-full border ${
                              isBusActive ? 'bg-cyan-400 border-cyan-200 shadow-[0_0_6px_rgba(0,242,255,0.8)]' : 'bg-slate-700 border-slate-600'
                            }`} />
                          </div>

                          <div className={`w-[2.5px] h-3 transition-all duration-300 ${
                            isBusActive ? 'bg-cyan-400 glow-line-cyan' : 'bg-slate-700'
                          }`} />

                          {/* Red PMT Breaker Button */}
                          <button
                            onClick={() => toggleFeederStatus(feeder.id)}
                            className={`w-7 h-7 rounded text-[11px] font-black flex items-center justify-center cursor-pointer transition-all shadow-md active:scale-90 z-10 ${
                              feeder.status === 'CLOSED'
                                ? 'bg-rose-600 text-white border border-rose-400 glow-box-red'
                                : 'bg-slate-800 text-slate-400 border border-slate-700'
                            }`}
                            title={`Toggle Breaker PMT Pangkal ${feeder.code}`}
                          >
                            {feeder.status === 'CLOSED' ? 'C' : 'O'}
                          </button>

                          <div className={`w-[2.5px] h-4 transition-all duration-300 ${
                            isEnergized ? 'bg-cyan-400 glow-line-cyan' : 'bg-slate-700'
                          }`} />

                          {/* Transformer Overlap Symbol */}
                          <div className="flex flex-col items-center my-0.5">
                            <div className="relative w-5 h-7 flex flex-col items-center justify-center">
                              <div className={`w-4 h-4 rounded-full border ${
                                isEnergized ? 'border-cyan-300 bg-cyan-950/60' : 'border-slate-700 bg-slate-900'
                              }`} />
                              <div className={`w-4 h-4 rounded-full border -mt-2 ${
                                isEnergized ? 'border-cyan-300 bg-cyan-950/60' : 'border-slate-700 bg-slate-900'
                              }`} />
                            </div>
                            <span className={`text-[10px] font-black -mt-0.5 ${isEnergized ? 'text-cyan-300' : 'text-slate-600'}`}>+</span>
                          </div>

                          <span className={`text-[10px] font-black my-0.5 ${
                            isEnergized ? 'text-cyan-400 animate-pulse' : 'text-slate-700'
                          }`}>
                            ▼
                          </span>

                          {/* FEEDER TELEMETRY CARD WITH NETWORK PIPELINE */}
                          <div className={`w-full rounded-xl border bg-[#0b1426] p-2.5 shadow-2xl transition-all relative flex flex-col ${
                            feeder.status === 'CLOSED'
                              ? isEnergized
                                ? 'border-cyan-500/60 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                                : 'border-slate-800'
                              : 'border-rose-600/60 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
                          }`}>
                            
                            {/* Feeder Header */}
                            <div className="text-center border-b border-slate-800 pb-1.5 mb-1.5 flex items-center justify-between">
                              <span className="text-[9px] font-mono text-slate-500">
                                {bus.name.replace('BUS 20kV - ', '')}
                              </span>
                              <div className="text-xs font-black text-cyan-300 tracking-wider">
                                {feeder.code}
                              </div>
                              <button 
                                onClick={() => openEditFeederModal(feeder)}
                                className="text-slate-500 hover:text-cyan-400 transition-colors p-0.5"
                                title="Edit Feeder Info"
                              >
                                <Edit3 className="w-3 h-3" />
                              </button>
                            </div>

                            <div className="text-[10px] font-extrabold text-slate-200 truncate text-center mb-1.5" title={feeder.name}>
                              {feeder.name}
                            </div>

                            {/* Status Badge */}
                            <div className="flex items-center justify-center gap-2 mb-2">
                              <span className={`px-2 py-0.5 rounded text-[8px] font-black tracking-widest flex items-center gap-1 border ${
                                isEnergized
                                  ? 'bg-emerald-950 text-emerald-400 border-emerald-500/40'
                                  : 'bg-rose-950 text-rose-400 border-rose-500/40 animate-pulse'
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${isEnergized ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                                {isEnergized ? 'ENERGIZED' : 'TRIP'}
                              </span>

                              {trippedDeviceIndex !== -1 && feeder.status === 'CLOSED' && (
                                <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-amber-950 text-amber-300 border border-amber-500/30 truncate max-w-[110px]" title={`Terputus di ${devices[trippedDeviceIndex].code}`}>
                                  ! {devices[trippedDeviceIndex].code}
                                </span>
                              )}
                            </div>

                            {/* Telemetry Numbers */}
                            <div className="space-y-1 text-[9.5px] border-b border-slate-800 pb-2 mb-2 font-mono">
                              <div className="flex justify-between items-center">
                                <span className="text-slate-400">I (Arus):</span>
                                <span className={`font-black ${isEnergized ? 'text-white' : 'text-rose-400'}`}>
                                  {feeder.currentA} A
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-slate-400">P (Daya):</span>
                                <span className="font-black text-cyan-300">
                                  {feeder.powerMw} MW
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-slate-400">V (Tegangan):</span>
                                <span className="font-black text-cyan-300">
                                  {feeder.voltageKv} kV
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-slate-400">cos φ:</span>
                                <span className="font-black text-amber-400">
                                  {feeder.cosPhi}
                                </span>
                              </div>
                            </div>

                            {/* PANGKAL TO UJUNG MINI EQUIPMENT PIPELINE BADGES */}
                            <div className="bg-slate-950/80 border border-slate-800/80 rounded-lg p-2 mb-2">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[8.5px] font-extrabold text-cyan-400 uppercase tracking-wide">
                                  Pangkal ➔ Ujung ({devices.length} Alat)
                                </span>
                                <button
                                  onClick={() => {
                                    setSelectedFeederIdForSLD(feeder.id);
                                    setMainViewMode('FEEDER_SLD');
                                  }}
                                  className="text-[8px] font-bold text-amber-400 hover:text-amber-300 underline"
                                >
                                  Detail ➔
                                </button>
                              </div>

                              <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
                                {devices.map((dev, idx) => {
                                  const devIsEnergized = deviceEnergizedState[idx];
                                  const badgeInfo = getDeviceIconAndBadge(dev.type);

                                  return (
                                    <React.Fragment key={dev.id}>
                                      <button
                                        onClick={() => toggleDeviceStatus(feeder.id, dev.id)}
                                        className={`shrink-0 px-1.5 py-0.5 rounded text-[7.5px] font-mono font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                                          dev.status === 'CLOSED'
                                            ? devIsEnergized
                                              ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/50 hover:bg-emerald-900'
                                              : 'bg-amber-950/90 text-amber-300 border-amber-500/50'
                                            : 'bg-rose-950 text-rose-400 border-rose-500/60 animate-pulse'
                                        }`}
                                        title={`${dev.type}: ${dev.name} (${dev.code}) | Status: ${dev.status} | Klik untuk sakelar`}
                                      >
                                        <span>{dev.type.slice(0, 3)}</span>
                                        <span className={`w-1.5 h-1.5 rounded-full ${dev.status === 'CLOSED' ? 'bg-emerald-400' : 'bg-rose-500'}`} />
                                      </button>
                                      {idx < devices.length - 1 && (
                                        <span className={`text-[8px] font-bold ${devIsEnergized && dev.status === 'CLOSED' ? 'text-cyan-400' : 'text-slate-700'}`}>
                                          ›
                                        </span>
                                      )}
                                    </React.Fragment>
                                  );
                                })}
                              </div>
                            </div>

                            {/* MONITOR JARINGAN COMPLETE BUTTON */}
                            <button
                              onClick={() => {
                                setSelectedFeederIdForSLD(feeder.id);
                                setMainViewMode('FEEDER_SLD');
                              }}
                              className="w-full py-1 rounded bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 text-[9px] font-black tracking-wider transition-all cursor-pointer mb-1.5 flex items-center justify-center gap-1"
                            >
                              <Network className="w-3 h-3 text-cyan-400" />
                              <span>⚡ MONITOR JARINGAN COMPLETE</span>
                            </button>

                            {/* Trip / Close Main Feeder Button */}
                            <button
                              onClick={() => toggleFeederStatus(feeder.id)}
                              className={`w-full py-1.5 rounded text-[9px] font-black tracking-wider transition-all cursor-pointer shadow-md active:scale-95 flex items-center justify-center gap-1 ${
                                feeder.status === 'CLOSED'
                                  ? 'bg-rose-600 hover:bg-rose-500 text-white'
                                  : 'bg-emerald-600 hover:bg-emerald-500 text-slate-950'
                              }`}
                            >
                              <span>⚡</span>
                              <span>{feeder.status === 'CLOSED' ? 'SIMULASI TRIP PMT' : 'SIMULASI CLOSE PMT'}</span>
                            </button>

                            <button
                              onClick={() => handleDeleteFeeder(feeder.id, feeder.code)}
                              className="mt-1 text-[8px] text-slate-600 hover:text-rose-400 transition-colors text-center w-full cursor-pointer py-0.5"
                            >
                              Hapus Penyulang
                            </button>

                          </div>

                        </div>
                      );
                    })
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  </main>

      {/* 3. EVENT LOG DRAWER */}
      {showLogDrawer && (
        <div className="bg-[#0b101d] border-t border-slate-800 p-4 max-h-[220px] overflow-y-auto shrink-0 relative z-30 shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-black text-cyan-300 uppercase tracking-widest">
                SEQUENCE OF EVENTS (SOE LOG SCADA - {currentStation.code})
              </h3>
            </div>
            <button onClick={() => setShowLogDrawer(false)} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-1.5 font-mono text-[10px]">
            {logs.map(log => (
              <div key={log.id} className="flex items-center gap-3 p-1.5 rounded bg-slate-900/60 border border-slate-800">
                <span className="text-slate-500 font-bold">{log.timestamp}</span>
                <span className={`px-1.5 py-0.5 rounded font-black text-[8px] ${
                  log.type === 'TRIP' ? 'bg-rose-950 text-rose-400 border border-rose-500/40' :
                  log.type === 'CLOSE' ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40' :
                  'bg-cyan-950 text-cyan-400 border border-cyan-500/40'
                }`}>
                  {log.tag}
                </span>
                <span className="text-slate-200 flex-1">{log.description}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. FULL FEEDER NETWORK INSPECTOR MODAL (PANGKAL ➔ UJUNG JARINGAN) */}
      {activeInspectingFeeder && (
        <div className="fixed inset-0 z-[99999] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#080d1a] border border-cyan-500/40 rounded-2xl p-6 max-w-5xl w-full shadow-2xl space-y-6 my-auto max-h-[92vh] flex flex-col">
            
            {/* Modal Inspector Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 shrink-0">
              <div>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-cyan-950 border border-cyan-500/40 text-cyan-400">
                    <Network className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-cyan-300 uppercase tracking-wider">
                      DIAGRAM MONITORING PENYULANG 20kV (PANGKAL ➔ UJUNG)
                    </h2>
                    <p className="text-xs text-slate-300 font-bold flex items-center gap-2 mt-0.5">
                      <span>[{activeInspectingFeeder.code}] {activeInspectingFeeder.name}</span>
                      <span className="text-slate-600">•</span>
                      <span className="text-amber-300">{activeInspectingFeeder.currentA} A</span>
                      <span className="text-slate-600">•</span>
                      <span className="text-cyan-400">{activeInspectingFeeder.powerMw} MW</span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => openAddDeviceModal(activeInspectingFeeder.id)}
                  className="px-3.5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Tambah Peralatan (FCO/LBS/Recloser/dll)</span>
                </button>

                <button
                  onClick={() => setInspectingFeederId(null)}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content Inspector Scrollable */}
            <div className="flex-1 overflow-y-auto space-y-6 pr-2">
              
              {/* Guidance Bar */}
              <div className="bg-slate-900/90 border border-cyan-500/30 rounded-xl p-3 text-xs text-slate-300 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>
                    Simulasi Aliran Listrik dari <strong>PMT Incoming & PMT Outgoing (Pangkal)</strong> melalui <strong>Recloser, LBS, PMCB, FCO</strong> hingga <strong>Sakelar Kopel (Ujung Jaringan)</strong>. Klik tombol sakelar untuk mengubah status TRIP / OPEN / CLOSED.
                  </span>
                </div>
                <div className="flex items-center gap-3 shrink-0 text-[10px] font-bold">
                  <span className="flex items-center gap-1 text-emerald-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> ENERGIZED
                  </span>
                  <span className="flex items-center gap-1 text-rose-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" /> TRIP / PADAM
                  </span>
                </div>
              </div>

              {/* SINGLE-LINE DIAGRAM (SLD) FLOW PIPELINE */}
              {(() => {
                const busActive = busEnergizedMap[activeInspectingFeeder.busId] ?? false;
                const devList = activeInspectingFeeder.devices || getDefaultFeederDevices(activeInspectingFeeder.code, activeInspectingFeeder.name);
                const energizationStates = calculateDeviceEnergization(busActive, activeInspectingFeeder.status, devList);
                const busbarObj = currentStation.busbars.find(b => b.id === activeInspectingFeeder.busId);

                return (
                  <div className="space-y-4">
                    {/* View Mode Selector Bar */}
                    <div className="flex flex-wrap items-center justify-between bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-400">MODE MONITORING:</span>
                        <button
                          onClick={() => setInspectorViewMode('SLD')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                            inspectorViewMode === 'SLD'
                              ? 'bg-cyan-500 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                              : 'bg-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          <GitCommit className="w-3.5 h-3.5" />
                          <span>⚡ DIAGRAM SLD (SKEMA BERHUBUNG)</span>
                        </button>
                        <button
                          onClick={() => setInspectorViewMode('GRID')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                            inspectorViewMode === 'GRID'
                              ? 'bg-cyan-500 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                              : 'bg-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          <LayoutGrid className="w-3.5 h-3.5" />
                          <span>📋 GRID KARTU PERALATAN</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-amber-300">
                          Urutan Peralatan: Pangkal ➔ Ujung ({devList.length} Unit)
                        </span>
                        <button
                          onClick={() => openAddDeviceModal(activeInspectingFeeder.id)}
                          className="px-2.5 py-1 rounded-lg bg-cyan-950 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-900 text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>+ Tambah Peralatan</span>
                        </button>
                      </div>
                    </div>

                    {inspectorViewMode === 'SLD' ? (
                      /* ⚡ TRUE SINGLE LINE DIAGRAM (SLD) VERTICAL CONNECTED CANVAS (TOP TO BOTTOM) */
                      <div className="bg-[#050913] border border-cyan-500/30 rounded-2xl p-6 shadow-2xl overflow-y-auto relative mini-dcc-grid max-h-[650px] min-h-[500px] flex flex-col items-center scrollbar-thin">
                        
                        <div className="flex flex-col items-center w-full max-w-xl py-4 gap-0 relative">

                          {/* 1. SOURCE 20kV BUSBAR NODE (TOP - PANGKAL JARINGAN) */}
                          <div className="flex flex-col items-center shrink-0 relative z-10 mb-1 w-full">
                            <div className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-2 flex items-center gap-1.5 bg-slate-900/90 px-3 py-1 rounded-full border border-cyan-800">
                              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                              PANGKAL BUSBAR GARDU INDUK (20kV)
                            </div>
                            
                            {/* Horizontal Busbar Tube */}
                            <div className={`w-full max-w-md h-9 rounded-xl border-2 flex items-center justify-between px-4 shadow-2xl transition-all ${
                              busActive 
                                ? 'bg-cyan-950 border-cyan-400 shadow-[0_0_22px_rgba(0,242,255,0.6)]' 
                                : 'bg-slate-900 border-slate-700'
                            }`}>
                              <div className={`w-3.5 h-3.5 rounded-full ${busActive ? 'bg-cyan-300 animate-ping' : 'bg-slate-700'}`} />
                              <span className="text-xs font-black text-cyan-300 tracking-widest uppercase flex items-center gap-2">
                                ⚡ {busbarObj?.name || 'BUSBAR 20kV - A/B'}
                              </span>
                              <div className="text-[10px] font-mono font-bold text-cyan-300 bg-slate-950 px-2 py-0.5 rounded border border-cyan-900/80">
                                {busbarObj?.voltageKv || 20.15} kV
                              </div>
                              <div className={`w-3.5 h-3.5 rounded-full ${busActive ? 'bg-cyan-300' : 'bg-slate-700'}`} />
                            </div>
                          </div>

                          {/* Vertical Connecting Busbar Line to First Device */}
                          <div className="flex flex-col items-center shrink-0 h-12 relative z-0">
                            <div className={`w-[4px] h-full transition-all ${
                              busActive ? 'bg-cyan-400 glow-line-cyan' : 'bg-slate-700'
                            }`} />
                            {busActive && (
                              <span className="absolute top-2 text-[10px] text-cyan-300 font-bold animate-bounce">
                                ▼
                              </span>
                            )}
                          </div>

                          {/* 2. SEQUENTIAL EQUIPMENT NODES WITH VERTICAL CONNECTING POWER LINES */}
                          {devList.map((dev, idx) => {
                            const isEnergizedNode = energizationStates[idx];
                            const isClosed = dev.status === 'CLOSED';

                            return (
                              <React.Fragment key={dev.id}>
                                {/* DEVICE NODE CARD & GRAPHIC CONTAINER */}
                                <div className="flex flex-col items-center shrink-0 relative group w-full max-w-lg">
                                  
                                  {/* Node Header Info */}
                                  <div className="flex items-center gap-2 mb-2 bg-slate-950/80 px-3 py-1 rounded-lg border border-slate-800">
                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-black bg-cyan-950 text-cyan-300 border border-cyan-800">
                                      TITIK #{idx + 1}
                                    </span>
                                    <span className="text-xs font-black text-white">{dev.code}</span>
                                    <span className={`px-2 py-0.5 rounded text-[8.5px] font-black tracking-wider border ${
                                      isClosed && isEnergizedNode
                                        ? 'bg-emerald-950 text-emerald-400 border-emerald-500/50'
                                        : 'bg-rose-950 text-rose-400 border-rose-500/50 animate-pulse'
                                    }`}>
                                      {isClosed && isEnergizedNode ? '⚡ ENERGIZED (ON)' : '🔴 PADAM / OFF'}
                                    </span>
                                  </div>

                                  {/* Device Graphic Card Layout */}
                                  <div className="flex flex-col md:flex-row items-center justify-center gap-4 bg-slate-900/70 p-4 rounded-2xl border border-slate-800 shadow-xl w-full">
                                    
                                    {/* Realistic Graphic Component */}
                                    <div className="shrink-0">
                                      <EquipmentGraphicRouter
                                        type={dev.type}
                                        status={dev.status}
                                        isEnergized={isEnergizedNode}
                                        code={dev.code}
                                        name={dev.name}
                                        location={dev.location}
                                        relayProtection={dev.relayProtection}
                                      />
                                    </div>

                                    {/* Action Buttons & Details Panel */}
                                    <div className="flex flex-col justify-between h-full w-full space-y-3">
                                      <div className="space-y-1">
                                        <div className="text-sm font-black text-cyan-300 flex items-center justify-between">
                                          <span>{dev.name}</span>
                                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                                            {dev.type}
                                          </span>
                                        </div>
                                        <div className="text-xs text-slate-300 font-mono">
                                          📍 <strong>Lokasi:</strong> {dev.location}
                                        </div>
                                        {dev.relayProtection && (
                                          <div className="text-xs text-amber-300 font-mono">
                                            🛡 <strong>Proteksi:</strong> {dev.relayProtection}
                                          </div>
                                        )}
                                      </div>

                                      {/* Switch Toggle Button */}
                                      <button
                                        onClick={() => toggleDeviceStatus(activeInspectingFeeder.id, dev.id)}
                                        className={`w-full py-2.5 px-4 rounded-xl text-xs font-black tracking-wider transition-all cursor-pointer shadow-lg active:scale-95 flex items-center justify-center gap-2 ${
                                          isClosed
                                            ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950 border border-rose-400'
                                            : 'bg-emerald-600 hover:bg-emerald-500 text-slate-950 shadow-emerald-950 border border-emerald-400'
                                        }`}
                                      >
                                        <span>{isClosed ? '⚡ STRIP / BUKA SAKELAR (TRIP)' : '✔ TUTUP SAKELAR (CLOSE)'}</span>
                                      </button>

                                      {/* Quick Edit / Delete */}
                                      <div className="flex items-center justify-end gap-3 border-t border-slate-800/80 pt-2 text-xs font-mono">
                                        <button
                                          onClick={() => openEditDeviceModal(activeInspectingFeeder.id, dev)}
                                          className="text-slate-400 hover:text-cyan-300 flex items-center gap-1 font-bold cursor-pointer"
                                        >
                                          <Edit3 className="w-3.5 h-3.5" /> Edit Data
                                        </button>
                                        <span className="text-slate-700">•</span>
                                        <button
                                          onClick={() => handleDeleteDevice(activeInspectingFeeder.id, dev.id, dev.code)}
                                          className="text-slate-400 hover:text-rose-400 flex items-center gap-1 font-bold cursor-pointer"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" /> Hapus
                                        </button>
                                      </div>
                                    </div>

                                  </div>

                                </div>

                                {/* VERTICAL CONNECTING 20kV POWER LINE SEGMENT DOWNWARDS */}
                                {idx < devList.length - 1 && (
                                  <div className="flex items-center justify-center shrink-0 h-16 w-full relative z-0 my-1">
                                    {/* Line Container */}
                                    <div className="flex flex-col items-center h-full relative">
                                      <div className={`w-[4px] h-full transition-all duration-300 ${
                                        isEnergizedNode && isClosed 
                                          ? 'bg-cyan-400 glow-line-cyan' 
                                          : 'bg-slate-800 border-r-2 border-dashed border-rose-500/80'
                                      }`} />

                                      {/* Flow indicator callout */}
                                      {isEnergizedNode && isClosed ? (
                                        <span className="absolute top-2 text-[10px] text-cyan-300 font-black animate-bounce bg-slate-950 px-1.5 py-0.5 border border-cyan-800 rounded shadow-md">
                                          ▼ ALIRAN 20kV
                                        </span>
                                      ) : (
                                        <span className="absolute top-2 text-[9px] text-rose-400 font-black bg-rose-950 px-2 py-0.5 border border-rose-500/60 rounded animate-pulse whitespace-nowrap shadow-md">
                                          ❌ TERPUTUS (NO VOLTAGE)
                                        </span>
                                      )}
                                    </div>

                                    {/* Insert Device Button beside the line */}
                                    <button
                                      onClick={() => openAddDeviceModal(activeInspectingFeeder.id)}
                                      className="ml-24 text-[9px] font-bold text-cyan-300 hover:text-white bg-slate-900 border border-cyan-500/40 rounded-lg px-2.5 py-1 hover:bg-cyan-950 hover:border-cyan-400 transition-all cursor-pointer shadow-lg flex items-center gap-1"
                                      title="Sisip Peralatan Baru Di Sini"
                                    >
                                      <Plus className="w-3 h-3" />
                                      <span>Sisip Peralatan</span>
                                    </button>
                                  </div>
                                )}
                              </React.Fragment>
                            );
                          })}

                          {/* 3. UJUNG JARINGAN END CONNECTOR (BOTTOM - UJUNG JARINGAN) */}
                          <div className="flex flex-col items-center shrink-0 h-12 relative z-0">
                            <div className={`w-[4px] h-full transition-all ${
                              energizationStates[devList.length - 1] && devList[devList.length - 1]?.status === 'CLOSED'
                                ? 'bg-indigo-400 glow-line-cyan' 
                                : 'bg-slate-800 border-r border-dashed border-slate-700'
                            }`} />
                            <span className="text-[10px] text-indigo-400 font-bold animate-bounce">
                              ▼
                            </span>
                          </div>

                          <div className="flex flex-col items-center shrink-0 relative z-10 w-full max-w-md">
                            <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1.5 flex items-center gap-1 bg-slate-900 px-3 py-1 rounded-full border border-indigo-900">
                              <Unlink className="w-3.5 h-3.5 text-indigo-400" />
                              UJUNG JARINGAN (TIE-POINT INTERKONEKSI)
                            </div>
                            <div className="p-4 rounded-2xl bg-slate-900/90 border border-indigo-500/50 text-indigo-300 text-center font-mono text-[10px] shadow-2xl w-full">
                              <div className="font-black text-white text-sm mb-1">INTERKONEKSI LBS KOPEL / TIE-SWITCH</div>
                              <div className="text-indigo-400 text-xs font-bold">Penghubung Antar Penyulang 20kV</div>
                              <div className="text-slate-400 text-[9px] mt-2 border-t border-slate-800 pt-1.5 flex justify-center items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
                                Siap melakukan manuver beban & pasokan darurat
                              </div>
                            </div>
                          </div>

                        </div>

                      </div>
                    ) : (
                      /* GRID KARTU PERALATAN VIEW */
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {devList.map((dev, idx) => {
                          const isEnergizedNode = energizationStates[idx];
                          const badgeInfo = getDeviceIconAndBadge(dev.type);

                          return (
                            <div
                              key={dev.id}
                              className={`rounded-2xl border p-4 transition-all duration-300 relative flex flex-col justify-between ${
                                dev.status === 'CLOSED'
                                  ? isEnergizedNode
                                    ? 'bg-[#09152a] border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                                    : 'bg-[#101726] border-slate-800'
                                  : 'bg-[#1e0e16] border-rose-500/60 shadow-[0_0_15px_rgba(239,68,68,0.3)] animate-pulse'
                              }`}
                            >
                              
                              {/* Card Top Header */}
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black border flex items-center gap-1.5 ${badgeInfo.badgeBg}`}>
                                    {badgeInfo.icon}
                                    <span>{badgeInfo.label}</span>
                                  </span>

                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() => openEditDeviceModal(activeInspectingFeeder.id, dev)}
                                      className="p-1 text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"
                                      title="Edit Peralatan"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteDevice(activeInspectingFeeder.id, dev.id, dev.code)}
                                      className="p-1 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                                      title="Hapus Peralatan"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>

                                <div className="text-sm font-black text-slate-100 mb-0.5">
                                  {dev.code}
                                </div>
                                <div className="text-xs font-bold text-slate-300 mb-2 truncate" title={dev.name}>
                                  {dev.name}
                                </div>

                                <div className="space-y-1 text-[10px] text-slate-400 font-mono border-t border-slate-800/80 pt-2 mb-3">
                                  <div><strong className="text-slate-300">Lokasi:</strong> {dev.location}</div>
                                  {dev.relayProtection && (
                                    <div><strong className="text-cyan-400">Proteksi:</strong> {dev.relayProtection}</div>
                                  )}
                                </div>
                              </div>

                              {/* Status & Control Actions */}
                              <div className="border-t border-slate-800/80 pt-3 space-y-2">
                                
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] text-slate-400 font-bold">Status Listrik:</span>
                                  <span className={`px-2 py-0.5 rounded text-[9px] font-black border ${
                                    isEnergizedNode && dev.status === 'CLOSED'
                                      ? 'bg-emerald-950 text-emerald-400 border-emerald-500/40'
                                      : 'bg-rose-950 text-rose-400 border-rose-500/40'
                                  }`}>
                                    {isEnergizedNode && dev.status === 'CLOSED' ? 'ENERGIZED' : 'PADAM / OFF'}
                                  </span>
                                </div>

                                {/* Toggle Breaker Button */}
                                <button
                                  onClick={() => toggleDeviceStatus(activeInspectingFeeder.id, dev.id)}
                                  className={`w-full py-2 rounded-xl text-xs font-black tracking-wider transition-all cursor-pointer shadow-lg active:scale-95 flex items-center justify-center gap-1.5 ${
                                    dev.status === 'CLOSED'
                                      ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950'
                                      : 'bg-emerald-600 hover:bg-emerald-500 text-slate-950 shadow-emerald-950'
                                  }`}
                                >
                                  <span>{dev.status === 'CLOSED' ? '⚡ BUKA / TRIP' : '✔ TUTUP SAKELAR'}</span>
                                </button>

                              </div>

                            </div>
                          );
                        })}
                      </div>
                    )}

                  </div>
                );
              })()}

            </div>

            {/* Modal Inspector Footer */}
            <div className="border-t border-slate-800 pt-3 flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-400">
                Data peralatan tersinkronisasi otomatis ke Firestore Cloud.
              </span>
              <button
                onClick={() => setInspectingFeederId(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold"
              >
                Tutup Inspector
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 5. MODAL ADD / EDIT GARDU INDUK (GI) ATAU GARDU HUBUNG (GH) */}
      {showStationModal && (
        <div className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b1220] border border-cyan-500/30 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-xs font-black text-cyan-300 uppercase tracking-wider flex items-center gap-2">
                <Building2 className="w-4 h-4 text-cyan-400" />
                {editingStation ? `Edit Data Gardu ${editingStation.code}` : 'Tambah Gardu Induk (GI) / Gardu Hubung (GH) Baru'}
              </h3>
              <button onClick={() => setShowStationModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveStationSubmit} className="space-y-3 text-xs font-sans">
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-300 mb-1">Tipe Stasiun Gardu:</label>
                  <select
                    value={stationTypeInput}
                    onChange={e => setStationTypeInput(e.target.value as 'GI' | 'GH')}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:border-cyan-400 focus:outline-none"
                  >
                    <option value="GI">GI (Gardu Induk 150/20kV)</option>
                    <option value="GH">GH (Gardu Hubung 20kV)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-300 mb-1">Kode Gardu (Singkatan):</label>
                  <input
                    type="text"
                    required
                    value={stationCodeInput}
                    onChange={e => setStationCodeInput(e.target.value)}
                    placeholder="cth: GDL / MGD / CPK"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-300 mb-1">Nama Lengkap Gardu:</label>
                <input
                  type="text"
                  required
                  value={stationNameInput}
                  onChange={e => setStationNameInput(e.target.value)}
                  placeholder="cth: GI DEPOK 150/20kV atau GH CITAYAM 20kV"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-800 pt-3">
                <button
                  type="button"
                  onClick={() => setShowStationModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 font-bold hover:bg-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black"
                >
                  {editingStation ? 'Simpan Perubahan' : 'Tambah Gardu Baru'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* 6. MODAL MANAGE & TAMBAH BUSBAR 20kV */}
      {showBusbarModal && (
        <div className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b1220] border border-cyan-500/30 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-xs font-black text-cyan-300 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                Kelola Busbar 20kV - {currentStation.name}
              </h3>
              <button onClick={() => setShowBusbarModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* List Active Busbars */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-300">Daftar Busbar 20kV Aktif:</label>
              {currentStation.busbars.map(bus => (
                <div key={bus.id} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs">
                  <div>
                    <span className="font-black text-cyan-300">{bus.name}</span>
                    <span className="text-slate-400 text-[10px] ml-2">({bus.voltageKv} kV)</span>
                  </div>
                  <button
                    onClick={() => handleDeleteBusbar(bus.id, bus.name)}
                    className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                    title="Hapus Busbar"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Form Add New Busbar */}
            <form onSubmit={handleAddBusbarSubmit} className="border-t border-slate-800 pt-3 space-y-3">
              <label className="block text-[10px] font-bold text-amber-400">+ Tambah Busbar 20kV Baru:</label>
              <div>
                <input
                  type="text"
                  required
                  value={newBusbarName}
                  onChange={e => setNewBusbarName(e.target.value)}
                  placeholder="cth: BUS 20kV - C atau BUS HUBUNG 3"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-xs focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[9px] font-bold text-slate-400 mb-1">Tegangan Nominal (kV):</label>
                <input
                  type="number"
                  step="0.01"
                  value={newBusbarKv}
                  onChange={e => setNewBusbarKv(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono text-xs focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBusbarModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 font-bold text-xs"
                >
                  Tutup
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs"
                >
                  + Tambah Busbar
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* 7. MODAL ADD / EDIT FEEDER */}
      {showFeederModal && (
        <div className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b1220] border border-cyan-500/30 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-xs font-black text-cyan-300 uppercase tracking-wider flex items-center gap-2">
                <Plus className="w-4 h-4 text-cyan-400" />
                {editingFeeder ? `Edit Feeder ${editingFeeder.code}` : 'Tambah Penyulang (Feeder) Baru'}
              </h3>
              <button onClick={() => setShowFeederModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveFeederSubmit} className="space-y-3 text-xs font-sans">
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-300 mb-1">Kode Penyulang:</label>
                  <input
                    type="text"
                    required
                    value={feederCodeInput}
                    onChange={e => setFeederCodeInput(e.target.value)}
                    placeholder="F-07"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-cyan-400 mb-1">Pilih Busbar 20kV:</label>
                  <select
                    value={feederBusIdInput}
                    onChange={e => setFeederBusIdInput(e.target.value)}
                    className="w-full bg-slate-900 border border-cyan-500/50 rounded-lg px-3 py-2 text-amber-300 font-mono font-bold focus:outline-none"
                  >
                    {currentStation.busbars.map(bus => (
                      <option key={bus.id} value={bus.id} className="bg-slate-950 text-slate-200">
                        {bus.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-300 mb-1">Nama Penyulang:</label>
                <input
                  type="text"
                  required
                  value={feederNameInput}
                  onChange={e => setFeederNameInput(e.target.value)}
                  placeholder="cth: Penyulang Sawangan"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-2 border-t border-slate-800 pt-3">
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 mb-1">Arus (A):</label>
                  <input
                    type="number"
                    value={feederCurrentInput}
                    onChange={e => setFeederCurrentInput(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 mb-1">Tegangan (kV):</label>
                  <input
                    type="number"
                    step="0.01"
                    value={feederVoltageInput}
                    onChange={e => setFeederVoltageInput(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 mb-1">cos φ:</label>
                  <input
                    type="number"
                    step="0.001"
                    value={feederCosPhiInput}
                    onChange={e => setFeederCosPhiInput(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-800 pt-3">
                <button
                  type="button"
                  onClick={() => setShowFeederModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black"
                >
                  {editingFeeder ? 'Simpan Feeder' : '+ Tambah Feeder'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* 8. MODAL ADD / EDIT FEEDER NETWORK DEVICE (INCOMING, OUTGOING, COUPLING, FCO, LBS, PMCB, RECLOSER) */}
      {showDeviceModal && (
        <div className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b1220] border border-cyan-500/40 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 font-sans">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-xs font-black text-cyan-300 uppercase tracking-wider flex items-center gap-2 font-mono">
                <Zap className="w-4 h-4 text-cyan-400" />
                {editingDevice ? `Edit Peralatan ${editingDevice.code}` : 'Tambah Peralatan Network Baru (Pangkal ➔ Ujung)'}
              </h3>
              <button onClick={() => setShowDeviceModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDeviceSubmit} className="space-y-3 text-xs">
              
              <div>
                <label className="block text-[10px] font-bold text-cyan-400 mb-1">Tipe Peralatan Network:</label>
                <select
                  value={deviceTypeInput}
                  onChange={e => setDeviceTypeInput(e.target.value as DeviceType)}
                  className="w-full bg-slate-900 border border-cyan-500/50 rounded-lg px-3 py-2 text-white font-mono font-bold focus:outline-none"
                >
                  <option value="INCOMING">INCOMING - PMT Incoming</option>
                  <option value="OUTGOING">OUTGOING - PMT Outgoing</option>
                  <option value="RECLOSER">RECLOSER - Automatic Circuit Recloser (ACR)</option>
                  <option value="LBS">LBS - Load Break Switch (Motorized / Manual)</option>
                  <option value="PMCB">PMCB - Pole Mounted Circuit Breaker</option>
                  <option value="FCO">FCO - Fuse Cut Out (Pengaman Lebur)</option>
                  <option value="DS">DS - Disconnecting Switch (Pemisah Sakelar Udara)</option>
                  <option value="COUPLING">COUPLING - Sakelar Kopel / Tie Switch Ujung</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-300 mb-1">Kode Tag Peralatan:</label>
                  <input
                    type="text"
                    required
                    value={deviceCodeInput}
                    onChange={e => setDeviceCodeInput(e.target.value)}
                    placeholder="cth: REC-MRP1 / LBS-02 / FCO-01"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-300 mb-1">Status Awal Sakelar:</label>
                  <select
                    value={deviceStatusInput}
                    onChange={e => setDeviceStatusInput(e.target.value as 'CLOSED' | 'TRIP' | 'OPEN')}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono font-bold focus:outline-none"
                  >
                    <option value="CLOSED">CLOSED (Tutup / Energized)</option>
                    <option value="TRIP">TRIP (Buka / Terputus Gangguan)</option>
                    <option value="OPEN">OPEN (Buka Manual)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-300 mb-1">Nama Peralatan:</label>
                <input
                  type="text"
                  required
                  value={deviceNameInput}
                  onChange={e => setDeviceNameInput(e.target.value)}
                  placeholder="cth: Recloser Simpang Depok / LBS Central Park"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-300 mb-1">Lokasi Jaringan (Pangkal / Section / Ujung):</label>
                <input
                  type="text"
                  value={deviceLocationInput}
                  onChange={e => setDeviceLocationInput(e.target.value)}
                  placeholder="cth: Km 4.2 - Percabangan Utama"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-300 mb-1">Pengaturan Proteksi Relay / Fuse:</label>
                <input
                  type="text"
                  value={deviceRelayInput}
                  onChange={e => setDeviceRelayInput(e.target.value)}
                  placeholder="cth: OCR/GFR, Auto-Reclose 3x, Fuse 50A"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-800 pt-3">
                <button
                  type="button"
                  onClick={() => setShowDeviceModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black"
                >
                  {editingDevice ? 'Simpan Peralatan' : '+ Tambah Peralatan'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
