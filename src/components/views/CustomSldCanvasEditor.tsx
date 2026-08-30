import React, { useState, useEffect, useRef, useMemo } from 'react';
import { StationData } from './MiniDccView';
import { 
  Plus, 
  Trash2, 
  Move, 
  RotateCcw, 
  Zap, 
  GitCommit, 
  Layers, 
  ZoomIn, 
  ZoomOut, 
  Edit3, 
  Sliders, 
  Building2, 
  Power,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Settings,
  Download,
  Upload,
  Sparkles,
  Maximize2,
  Minimize2,
  Grid,
  Magnet,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignVerticalJustifyCenter,
  ArrowRightLeft,
  Copy,
  Scissors,
  Check,
  ChevronLeft,
  ChevronRight,
  GripVertical,
  Activity,
  Radio,
  Link2,
  Unlink,
  Files,
  ClipboardPaste,
  LocateFixed,
  Scaling,
  Expand,
  Shrink,
  ArrowLeftRight,
  ArrowUpDown,
  MoveHorizontal,
  MoveVertical,
  Minus
} from 'lucide-react';

export type CustomElementType = 
  | 'BUSBAR' 
  | 'LINE' 
  | 'NODE' 
  | 'BREAKER' 
  | 'INCOMING' 
  | 'OUTGOING' 
  | 'LBS' 
  | 'RECLOSER' 
  | 'PMCB' 
  | 'FCO' 
  | 'DS' 
  | 'COUPLING'
  | 'TRAFO';

export interface CustomBusbar {
  id: string;
  name: string;
  stationId?: string;
  voltageKv: number; // 150 or 20
  x: number;
  y: number;
  length: number;
  orientation: 'HORIZONTAL' | 'VERTICAL';
  color: string;
  thickness?: number; // 6, 8, 12, 16
}

export interface CustomLine {
  id: string;
  name: string;
  type: 'SUTT_150KV' | 'SKTT_20KV' | 'TIE_LINE_20KV' | 'FEEDER_LINE' | 'BUS_KOPEL';
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  style: 'SOLID' | 'DASHED';
  status: 'ENERGIZED' | 'DEENERGIZED' | 'TRIP';
  flowSpeed?: number;
  strokeWidth?: number; // 2, 3, 4, 6, 8
  fromId?: string;
  toId?: string;
}

export interface CustomNode {
  id: string;
  name: string;
  code: string;
  type: 'GI' | 'GH' | 'PLTD' | 'CUSTOM';
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CustomDevice {
  id: string;
  type: 'BREAKER' | 'INCOMING' | 'OUTGOING' | 'LBS' | 'RECLOSER' | 'PMCB' | 'FCO' | 'DS' | 'COUPLING' | 'TRAFO';
  name: string;
  code: string;
  x: number;
  y: number;
  status: 'CLOSED' | 'OPEN' | 'TRIP';
  voltageKv?: number;
  ratingA?: number;
  scale?: number; // 0.5 to 3.0 (default 1.0)
  stationId?: string;
  busbar1Id?: string;
  busbar2Id?: string;
}

export type DragAction = 
  | { mode: 'MOVE_ELEMENT'; type: 'BUSBAR' | 'LINE' | 'NODE' | 'DEVICE'; id: string }
  | { mode: 'RESIZE_LINE_START'; id: string }
  | { mode: 'RESIZE_LINE_END'; id: string }
  | { mode: 'RESIZE_BUSBAR_START'; id: string }
  | { mode: 'RESIZE_BUSBAR_END'; id: string }
  | { mode: 'RESIZE_NODE'; id: string; handle: 'NW' | 'NE' | 'SW' | 'SE' | 'N' | 'S' | 'E' | 'W'; startX: number; startY: number; startW: number; startH: number }
  | { mode: 'RESIZE_DEVICE'; id: string; centerX: number; centerY: number; startDist: number; startScale: number };

export interface CustomSldSystemLayout {
  id: string;
  name: string;
  busbars: CustomBusbar[];
  lines: CustomLine[];
  nodes: CustomNode[];
  devices: CustomDevice[];
  breakers?: CustomDevice[]; // backward compatibility
}

// DEFAULT PRESET WITH FULL SYSTEM NORMAL AMBON 150kV & 20kV WITH ADVANCED SWITCHES & BUS COUPLING
export const DEFAULT_NORMAL_SYSTEM_LAYOUT: CustomSldSystemLayout = {
  id: 'ambon_normal_system_layout_v2',
  name: 'Layout 1 Sistem Normal Terpadu (Ambon 150kV & 20kV)',
  nodes: [
    { id: 'node_gi_passo', name: 'GI PASSO 150/20kV', code: 'PSO', type: 'GI', x: 80, y: 160, width: 360, height: 420 },
    { id: 'node_gi_hative', name: 'GI HATIVE BESAR 150/20kV', code: 'HTV', type: 'GI', x: 480, y: 160, width: 360, height: 420 },
    { id: 'node_pltd_poka', name: 'PLTD POKA (GENERASI 20kV)', code: 'POKA', type: 'PLTD', x: 880, y: 160, width: 360, height: 420 },
    { id: 'node_gh_baguala', name: 'GH BAGUALA 20kV', code: 'BGL', type: 'GH', x: 280, y: 640, width: 400, height: 280 }
  ],
  busbars: [
    // 150kV MAIN TRANSMISSION BUSBAR
    { id: 'bus_150kv_main', name: 'BUSBAR TRANSMISI HIGH VOLTAGE 150kV SISTEM', voltageKv: 150, x: 100, y: 80, length: 1120, orientation: 'HORIZONTAL', color: '#f43f5e' },
    
    // GI PASSO BUSBARS (BUS A & BUS B)
    { id: 'bus_pso_a', name: 'BUS 20kV PASSO - A', stationId: 'gi_passo', voltageKv: 20, x: 100, y: 340, length: 140, orientation: 'HORIZONTAL', color: '#06b6d4' },
    { id: 'bus_pso_b', name: 'BUS 20kV PASSO - B', stationId: 'gi_passo', voltageKv: 20, x: 290, y: 340, length: 140, orientation: 'HORIZONTAL', color: '#06b6d4' },
    
    // GI HATIVE BUSBARS (BUS A & BUS B)
    { id: 'bus_htv_a', name: 'BUS 20kV HATIVE - A', stationId: 'gi_hative_besar', voltageKv: 20, x: 500, y: 340, length: 140, orientation: 'HORIZONTAL', color: '#06b6d4' },
    { id: 'bus_htv_b', name: 'BUS 20kV HATIVE - B', stationId: 'gi_hative_besar', voltageKv: 20, x: 690, y: 340, length: 140, orientation: 'HORIZONTAL', color: '#06b6d4' },
    
    // PLTD POKA BUSBARS (BUS A & BUS B)
    { id: 'bus_pok_a', name: 'BUS 20kV PLTD - A', stationId: 'pltd_poka', voltageKv: 20, x: 900, y: 340, length: 140, orientation: 'HORIZONTAL', color: '#10b981' },
    { id: 'bus_pok_b', name: 'BUS 20kV PLTD - B', stationId: 'pltd_poka', voltageKv: 20, x: 1090, y: 340, length: 140, orientation: 'HORIZONTAL', color: '#10b981' },

    // GH BAGUALA BUSBARS
    { id: 'bus_bgl_main', name: 'BUS 20kV GH BAGUALA (MAIN DISTRIBUTION)', stationId: 'gh_baguala', voltageKv: 20, x: 300, y: 720, length: 360, orientation: 'HORIZONTAL', color: '#f59e0b' }
  ],
  lines: [
    // TRANSMISSION DROP LINES (150kV ➔ TRAFO ➔ INC)
    { id: 'line_tr_pso1', name: 'SUTT 150kV ➔ TRAFO 1 PASSO', type: 'SUTT_150KV', x1: 170, y1: 80, x2: 170, y2: 340, color: '#f43f5e', style: 'SOLID', status: 'ENERGIZED' },
    { id: 'line_tr_pso2', name: 'SUTT 150kV ➔ TRAFO 2 PASSO', type: 'SUTT_150KV', x1: 360, y1: 80, x2: 360, y2: 340, color: '#f43f5e', style: 'SOLID', status: 'ENERGIZED' },
    
    { id: 'line_tr_htv1', name: 'SUTT 150kV ➔ TRAFO 1 HATIVE', type: 'SUTT_150KV', x1: 570, y1: 80, x2: 570, y2: 340, color: '#f43f5e', style: 'SOLID', status: 'ENERGIZED' },
    { id: 'line_tr_htv2', name: 'SUTT 150kV ➔ TRAFO 2 HATIVE', type: 'SUTT_150KV', x1: 760, y1: 80, x2: 760, y2: 340, color: '#f43f5e', style: 'SOLID', status: 'ENERGIZED' },

    { id: 'line_tr_pok1', name: 'LINE GENERATOR 1 ➔ POKA BUS A', type: 'SKTT_20KV', x1: 970, y1: 80, x2: 970, y2: 340, color: '#10b981', style: 'SOLID', status: 'ENERGIZED' },
    { id: 'line_tr_pok2', name: 'LINE GENERATOR 2 ➔ POKA BUS B', type: 'SKTT_20KV', x1: 1160, y1: 80, x2: 1160, y2: 340, color: '#10b981', style: 'SOLID', status: 'ENERGIZED' },

    // BUS KOPEL LINES (PENYAMBUNG KOPEL ANTAR BUSBAR A & B)
    { id: 'line_kopel_pso', name: 'GARIS KOPEL 20kV PASSO', type: 'BUS_KOPEL', x1: 240, y1: 340, x2: 290, y2: 340, color: '#06b6d4', style: 'SOLID', status: 'ENERGIZED' },
    { id: 'line_kopel_htv', name: 'GARIS KOPEL 20kV HATIVE', type: 'BUS_KOPEL', x1: 640, y1: 340, x2: 690, y2: 340, color: '#06b6d4', style: 'SOLID', status: 'ENERGIZED' },
    { id: 'line_kopel_pok', name: 'GARIS KOPEL 20kV POKA', type: 'BUS_KOPEL', x1: 1040, y1: 340, x2: 1090, y2: 340, color: '#10b981', style: 'SOLID', status: 'ENERGIZED' },

    // OUTGOING FEEDER LINES WITH LBS & RECLOSER
    { id: 'line_fdr_pso1', name: 'PENYULANG 1 PASSO (F-01)', type: 'FEEDER_LINE', x1: 170, y1: 340, x2: 170, y2: 520, color: '#06b6d4', style: 'SOLID', status: 'ENERGIZED' },
    { id: 'line_fdr_pso2', name: 'PENYULANG 2 PASSO (F-02)', type: 'FEEDER_LINE', x1: 220, y1: 340, x2: 220, y2: 520, color: '#06b6d4', style: 'SOLID', status: 'ENERGIZED' },
    
    // TIE LINES TO GH BAGUALA
    { id: 'line_tie_pso_bgl', name: '20kV TIE LINE: PASSO F-01 ➔ GH BAGUALA', type: 'TIE_LINE_20KV', x1: 170, y1: 520, x2: 340, y2: 720, color: '#f59e0b', style: 'DASHED', status: 'ENERGIZED' },
    { id: 'line_tie_htv_bgl', name: '20kV TIE LINE: HATIVE F-03 ➔ GH BAGUALA', type: 'TIE_LINE_20KV', x1: 760, y1: 340, x2: 620, y2: 720, color: '#f59e0b', style: 'DASHED', status: 'ENERGIZED' },
    { id: 'line_tie_pok_bgl', name: '20kV INTERKONEKSI: PLTD POKA ➔ GH BAGUALA', type: 'TIE_LINE_20KV', x1: 970, y1: 340, x2: 620, y2: 720, color: '#10b981', style: 'SOLID', status: 'ENERGIZED' }
  ],
  devices: [
    // DISCONNECTING SWITCH (DS) 150kV
    { id: 'ds_pso_150_1', type: 'DS', name: 'DS BUS 150kV PASSO T-1', code: 'DS-150 T1', x: 170, y: 120, status: 'CLOSED', stationId: 'gi_passo', voltageKv: 150 },
    { id: 'ds_pso_150_2', type: 'DS', name: 'DS BUS 150kV PASSO T-2', code: 'DS-150 T2', x: 360, y: 120, status: 'CLOSED', stationId: 'gi_passo', voltageKv: 150 },
    
    // PMT 150kV BREAKER
    { id: 'pmt_pso_150_1', type: 'BREAKER', name: 'PMT 150kV T-1 PASSO', code: 'PMT 150kV T1', x: 170, y: 160, status: 'CLOSED', stationId: 'gi_passo', voltageKv: 150 },
    { id: 'pmt_pso_150_2', type: 'BREAKER', name: 'PMT 150kV T-2 PASSO', code: 'PMT 150kV T2', x: 360, y: 160, status: 'CLOSED', stationId: 'gi_passo', voltageKv: 150 },

    // TRANSFORMERS (TRAFO 150/20kV)
    { id: 'tr_pso_1', type: 'TRAFO', name: 'TRAFO 1 PASSO 30MVA', code: 'TR-1 30MVA', x: 170, y: 220, status: 'CLOSED', stationId: 'gi_passo', voltageKv: 150 },
    { id: 'tr_pso_2', type: 'TRAFO', name: 'TRAFO 2 PASSO 60MVA', code: 'TR-2 60MVA', x: 360, y: 220, status: 'CLOSED', stationId: 'gi_passo', voltageKv: 150 },

    // INCOMERS 20kV
    { id: 'inc_pso_1', type: 'INCOMING', name: 'PMT INCOMING 20kV T-1 PASSO', code: 'INC-1 20kV', x: 170, y: 280, status: 'CLOSED', stationId: 'gi_passo', voltageKv: 20 },
    { id: 'inc_pso_2', type: 'INCOMING', name: 'PMT INCOMING 20kV T-2 PASSO', code: 'INC-2 20kV', x: 360, y: 280, status: 'CLOSED', stationId: 'gi_passo', voltageKv: 20 },
    
    // PMT KOPEL / BUSBAR COUPLING
    { id: 'pmt_pso_kopel', type: 'COUPLING', name: 'PMT KOPEL 20kV PASSO', code: 'KOPEL PSO', x: 265, y: 340, status: 'CLOSED', stationId: 'gi_passo', voltageKv: 20 },
    { id: 'pmt_htv_kopel', type: 'COUPLING', name: 'PMT KOPEL 20kV HATIVE', code: 'KOPEL HTV', x: 665, y: 340, status: 'CLOSED', stationId: 'gi_hative_besar', voltageKv: 20 },
    { id: 'pmt_pok_kopel', type: 'COUPLING', name: 'PMT KOPEL 20kV POKA', code: 'KOPEL POKA', x: 1065, y: 340, status: 'CLOSED', stationId: 'pltd_poka', voltageKv: 20 },

    // OUTGOING FEEDERS & DISTRIBUTION DEVICES (RECLOSER, LBS, PMCB, FCO, DS)
    { id: 'out_pso_f01', type: 'OUTGOING', name: 'PMT OUTGOING PASSO F-01', code: 'OUT-1 PASSO', x: 170, y: 390, status: 'CLOSED', stationId: 'gi_passo', voltageKv: 20 },
    { id: 'rec_pso_f01', type: 'RECLOSER', name: 'RECLOSER BATU MERAH (ACR)', code: 'REC-BMR', x: 170, y: 440, status: 'CLOSED', stationId: 'gi_passo', voltageKv: 20 },
    { id: 'lbs_pso_f01', type: 'LBS', name: 'LBS MOTORIZED SIMPANG PASSO', code: 'LBS-PSO-01', x: 170, y: 490, status: 'CLOSED', stationId: 'gi_passo', voltageKv: 20 },

    { id: 'out_pso_f02', type: 'OUTGOING', name: 'PMT OUTGOING PASSO F-02', code: 'OUT-2 PASSO', x: 220, y: 390, status: 'CLOSED', stationId: 'gi_passo', voltageKv: 20 },
    { id: 'pmcb_pso_f02', type: 'PMCB', name: 'PMCB SF6 TELUK AMBON', code: 'PMCB-TLK', x: 220, y: 440, status: 'CLOSED', stationId: 'gi_passo', voltageKv: 20 },
    { id: 'fco_pso_f02', type: 'FCO', name: 'FCO 50A PERCABANGAN RUMAH SAKIT', code: 'FCO-RS-01', x: 220, y: 490, status: 'CLOSED', stationId: 'gi_passo', voltageKv: 20 },

    // GI HATIVE BESAR
    { id: 'pmt_htv_150_1', type: 'BREAKER', name: 'PMT 150kV T-1 HATIVE', code: 'PMT 150kV T1', x: 570, y: 160, status: 'CLOSED', stationId: 'gi_hative_besar', voltageKv: 150 },
    { id: 'pmt_htv_150_2', type: 'BREAKER', name: 'PMT 150kV T-2 HATIVE', code: 'PMT 150kV T2', x: 760, y: 160, status: 'CLOSED', stationId: 'gi_hative_besar', voltageKv: 150 },
    { id: 'tr_htv_1', type: 'TRAFO', name: 'TRAFO 1 HATIVE 30MVA', code: 'TR-1 30MVA', x: 570, y: 220, status: 'CLOSED', stationId: 'gi_hative_besar', voltageKv: 150 },
    { id: 'tr_htv_2', type: 'TRAFO', name: 'TRAFO 2 HATIVE 30MVA', code: 'TR-2 30MVA', x: 760, y: 220, status: 'CLOSED', stationId: 'gi_hative_besar', voltageKv: 150 },
    { id: 'inc_htv_1', type: 'INCOMING', name: 'PMT INCOMING 20kV T-1 HATIVE', code: 'INC-1 20kV', x: 570, y: 280, status: 'CLOSED', stationId: 'gi_hative_besar', voltageKv: 20 },
    { id: 'inc_htv_2', type: 'INCOMING', name: 'PMT INCOMING 20kV T-2 HATIVE', code: 'INC-2 20kV', x: 760, y: 280, status: 'CLOSED', stationId: 'gi_hative_besar', voltageKv: 20 },
    { id: 'out_htv_f03', type: 'OUTGOING', name: 'PMT OUTGOING HATIVE F-03', code: 'OUT-3 HATIVE', x: 760, y: 390, status: 'CLOSED', stationId: 'gi_hative_besar', voltageKv: 20 },
    { id: 'rec_htv_01', type: 'RECLOSER', name: 'RECLOSER AIR SALOBAR (ACR)', code: 'REC-ASL', x: 760, y: 450, status: 'CLOSED', stationId: 'gi_hative_besar', voltageKv: 20 },

    // GH BAGUALA INCOMING & COUPLING
    { id: 'inc_bgl_main', type: 'INCOMING', name: 'PMT INCOMER GH BAGUALA', code: 'INC BAGUALA', x: 340, y: 670, status: 'CLOSED', stationId: 'gh_baguala', voltageKv: 20 },
    { id: 'lbs_bgl_tie', type: 'LBS', name: 'LBS KOPEL INTERKONEKSI GH BAGUALA', code: 'LBS-TIE-BGL', x: 480, y: 720, status: 'CLOSED', stationId: 'gh_baguala', voltageKv: 20 }
  ]
};

const STORAGE_KEY = 'perangpadam_custom_sld_layout_v2';

interface CustomSldCanvasEditorProps {
  stations?: StationData[];
  onSaveLayout?: (layout: CustomSldSystemLayout) => void;
  onClose?: () => void;
  showGridLines?: boolean;
  onToggleGridLines?: () => void;
}

export const CustomSldCanvasEditor: React.FC<CustomSldCanvasEditorProps> = ({
  stations = [],
  onSaveLayout,
  onClose,
  showGridLines,
  onToggleGridLines
}) => {
  // 1. Layout State
  const [layout, setLayout] = useState<CustomSldSystemLayout>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.busbars) && Array.isArray(parsed.lines)) {
          // Normalize devices from legacy breakers if needed
          const devices = Array.isArray(parsed.devices) 
            ? parsed.devices 
            : Array.isArray(parsed.breakers) 
            ? parsed.breakers.map((b: any) => ({ ...b, type: b.type || 'BREAKER' }))
            : DEFAULT_NORMAL_SYSTEM_LAYOUT.devices;
          return { ...parsed, devices };
        }
      }
    } catch (e) {
      console.warn('Failed to parse layout from localStorage, using default preset.', e);
    }
    return DEFAULT_NORMAL_SYSTEM_LAYOUT;
  });

  // 2. Editor Modes & State
  const [activeTool, setActiveTool] = useState<
    | 'SELECT' 
    | 'ADD_BUSBAR' 
    | 'ADD_LINE' 
    | 'ADD_NODE' 
    | 'ADD_INCOMING' 
    | 'ADD_OUTGOING' 
    | 'ADD_LBS' 
    | 'ADD_RECLOSER' 
    | 'ADD_PMCB' 
    | 'ADD_FCO' 
    | 'ADD_DS' 
    | 'ADD_COUPLING'
    | 'ADD_TRAFO' 
    | 'ADD_BREAKER'
  >('SELECT');

  const [selectedElement, setSelectedElement] = useState<{ 
    type: 'BUSBAR' | 'LINE' | 'NODE' | 'DEVICE'; 
    id: string 
  } | null>(null);

  // Toolbox Sidebar Collapse/Expand State
  const [isToolboxOpen, setIsToolboxOpen] = useState<boolean>(true);
  const [isDragOverCanvas, setIsDragOverCanvas] = useState<boolean>(false);

  // Clipboard State for Copy / Paste / Duplicate
  const [clipboard, setClipboard] = useState<{
    type: 'BUSBAR' | 'LINE' | 'NODE' | 'DEVICE';
    data: any;
  } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(prev => (prev === msg ? null : prev));
    }, 2800);
  };

  // Viewport, Zoom & Fullscreen
  const [zoom, setZoom] = useState<number>(100);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  
  // Snap-to-Grid Controls
  const [snapToGrid, setSnapToGrid] = useState<boolean>(true);
  const [gridSize, setGridSize] = useState<number>(20); // 10, 20, 40
  const [localShowGrid, setLocalShowGrid] = useState<boolean>(true);
  const showGrid = showGridLines !== undefined ? showGridLines : localShowGrid;
  const toggleGrid = () => {
    if (onToggleGridLines) {
      onToggleGridLines();
    } else {
      setLocalShowGrid(!localShowGrid);
    }
  };
  const [orthoMode, setOrthoMode] = useState<boolean>(false); // 90-degree lines

  // Dynamic Alignment Guide Lines
  const [guideLines, setGuideLines] = useState<{ x?: number; y?: number }>({});

  // Line Drawing State
  const [drawingLineStart, setDrawingLineStart] = useState<{ x: number; y: number } | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Modal State for Editing Element Properties
  const [editingBusbarModal, setEditingBusbarModal] = useState<CustomBusbar | null>(null);
  const [editingLineModal, setEditingLineModal] = useState<CustomLine | null>(null);
  const [editingDeviceModal, setEditingDeviceModal] = useState<CustomDevice | null>(null);
  const [editingNodeModal, setEditingNodeModal] = useState<CustomNode | null>(null);

  // Dragging and Resizing Canvas Elements State
  const [dragAction, setDragAction] = useState<DragAction | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const canvasRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Dynamic Expansive Canvas Dimensions (Unlimited / Infinite Drawing Space)
  const canvasDimensions = useMemo(() => {
    let maxX = 2600;
    let maxY = 1800;

    layout.nodes.forEach(n => {
      maxX = Math.max(maxX, n.x + n.width + 800);
      maxY = Math.max(maxY, n.y + n.height + 800);
    });
    layout.busbars.forEach(b => {
      const x2 = b.orientation === 'HORIZONTAL' ? b.x + b.length : b.x;
      const y2 = b.orientation === 'VERTICAL' ? b.y + b.length : b.y;
      maxX = Math.max(maxX, x2 + 800);
      maxY = Math.max(maxY, y2 + 800);
    });
    layout.devices.forEach(d => {
      maxX = Math.max(maxX, d.x + 800);
      maxY = Math.max(maxY, d.y + 800);
    });
    layout.lines.forEach(l => {
      maxX = Math.max(maxX, l.x1 + 800, l.x2 + 800);
      maxY = Math.max(maxY, l.y1 + 800, l.y2 + 800);
    });

    const width = Math.max(3800, Math.ceil(maxX / 100) * 100);
    const height = Math.max(2800, Math.ceil(maxY / 100) * 100);

    return { width, height };
  }, [layout]);

  // Persist layout
  const saveCurrentLayout = (newLayout: CustomSldSystemLayout) => {
    setLayout(newLayout);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newLayout));
    } catch (e) {
      console.error('Error saving layout to localStorage', e);
    }
    if (onSaveLayout) onSaveLayout(newLayout);
  };

  // COPY FUNCTION
  const handleCopy = () => {
    if (!selectedElement) return;
    const { type, id } = selectedElement;
    let targetItem: any = null;

    if (type === 'BUSBAR') targetItem = layout.busbars.find(b => b.id === id);
    else if (type === 'DEVICE') targetItem = layout.devices.find(d => d.id === id);
    else if (type === 'NODE') targetItem = layout.nodes.find(n => n.id === id);
    else if (type === 'LINE') targetItem = layout.lines.find(l => l.id === id);

    if (targetItem) {
      setClipboard({ type, data: JSON.parse(JSON.stringify(targetItem)) });
      showToast(`📋 Berhasil menyalin ${targetItem.name || type} ke Clipboard`);
    }
  };

  // PASTE FUNCTION
  const handlePaste = (customCoords?: { x: number; y: number }) => {
    if (!clipboard) {
      showToast('⚠️ Tidak ada komponen di clipboard untuk ditempel!');
      return;
    }

    const { type, data } = clipboard;
    const offset = customCoords ? { x: customCoords.x - (data.x || data.x1 || 0), y: customCoords.y - (data.y || data.y1 || 0) } : { x: gridSize * 2 || 40, y: gridSize * 2 || 40 };

    if (type === 'BUSBAR') {
      const newBus: CustomBusbar = {
        ...data,
        id: `bus_custom_${Date.now()}`,
        name: `${data.name} (Salinan)`,
        x: data.x + offset.x,
        y: data.y + offset.y
      };
      saveCurrentLayout({ ...layout, busbars: [...layout.busbars, newBus] });
      setSelectedElement({ type: 'BUSBAR', id: newBus.id });
      showToast(`✨ Ditempel: ${newBus.name}`);
    } else if (type === 'DEVICE') {
      const newDev: CustomDevice = {
        ...data,
        id: `dev_${data.type.toLowerCase()}_${Date.now()}`,
        name: `${data.name} (Salinan)`,
        code: `${data.code}-C`,
        x: data.x + offset.x,
        y: data.y + offset.y
      };
      saveCurrentLayout({ ...layout, devices: [...layout.devices, newDev] });
      setSelectedElement({ type: 'DEVICE', id: newDev.id });
      showToast(`✨ Ditempel: ${newDev.name}`);
    } else if (type === 'NODE') {
      const newNode: CustomNode = {
        ...data,
        id: `node_custom_${Date.now()}`,
        name: `${data.name} (Salinan)`,
        code: `${data.code}-C`,
        x: data.x + offset.x,
        y: data.y + offset.y
      };
      saveCurrentLayout({ ...layout, nodes: [...layout.nodes, newNode] });
      setSelectedElement({ type: 'NODE', id: newNode.id });
      showToast(`✨ Ditempel: ${newNode.name}`);
    } else if (type === 'LINE') {
      const newLine: CustomLine = {
        ...data,
        id: `line_custom_${Date.now()}`,
        name: `${data.name} (Salinan)`,
        x1: data.x1 + offset.x,
        y1: data.y1 + offset.y,
        x2: data.x2 + offset.x,
        y2: data.y2 + offset.y
      };
      saveCurrentLayout({ ...layout, lines: [...layout.lines, newLine] });
      setSelectedElement({ type: 'LINE', id: newLine.id });
      showToast(`✨ Ditempel: ${newLine.name}`);
    }
  };

  // DUPLICATE (1-CLICK COPY + PASTE)
  const handleDuplicate = () => {
    if (!selectedElement) return;
    const { type, id } = selectedElement;
    let targetItem: any = null;

    if (type === 'BUSBAR') targetItem = layout.busbars.find(b => b.id === id);
    else if (type === 'DEVICE') targetItem = layout.devices.find(d => d.id === id);
    else if (type === 'NODE') targetItem = layout.nodes.find(n => n.id === id);
    else if (type === 'LINE') targetItem = layout.lines.find(l => l.id === id);

    if (!targetItem) return;

    const offset = { x: gridSize * 2 || 40, y: gridSize * 2 || 40 };

    if (type === 'BUSBAR') {
      const newBus: CustomBusbar = {
        ...targetItem,
        id: `bus_custom_${Date.now()}`,
        name: `${targetItem.name} (Duplikat)`,
        x: targetItem.x + offset.x,
        y: targetItem.y + offset.y
      };
      saveCurrentLayout({ ...layout, busbars: [...layout.busbars, newBus] });
      setSelectedElement({ type: 'BUSBAR', id: newBus.id });
      showToast(`⚡ Diduplikasi: ${newBus.name}`);
    } else if (type === 'DEVICE') {
      const newDev: CustomDevice = {
        ...targetItem,
        id: `dev_${targetItem.type.toLowerCase()}_${Date.now()}`,
        name: `${targetItem.name} (Duplikat)`,
        code: `${targetItem.code}-D`,
        x: targetItem.x + offset.x,
        y: targetItem.y + offset.y
      };
      saveCurrentLayout({ ...layout, devices: [...layout.devices, newDev] });
      setSelectedElement({ type: 'DEVICE', id: newDev.id });
      showToast(`⚡ Diduplikasi: ${newDev.name}`);
    } else if (type === 'NODE') {
      const newNode: CustomNode = {
        ...targetItem,
        id: `node_custom_${Date.now()}`,
        name: `${targetItem.name} (Duplikat)`,
        code: `${targetItem.code}-D`,
        x: targetItem.x + offset.x,
        y: targetItem.y + offset.y
      };
      saveCurrentLayout({ ...layout, nodes: [...layout.nodes, newNode] });
      setSelectedElement({ type: 'NODE', id: newNode.id });
      showToast(`⚡ Diduplikasi: ${newNode.name}`);
    } else if (type === 'LINE') {
      const newLine: CustomLine = {
        ...targetItem,
        id: `line_custom_${Date.now()}`,
        name: `${targetItem.name} (Duplikat)`,
        x1: targetItem.x1 + offset.x,
        y1: targetItem.y1 + offset.y,
        x2: targetItem.x2 + offset.x,
        y2: targetItem.y2 + offset.y
      };
      saveCurrentLayout({ ...layout, lines: [...layout.lines, newLine] });
      setSelectedElement({ type: 'LINE', id: newLine.id });
      showToast(`⚡ Diduplikasi: ${newLine.name}`);
    }
  };

  // GLOBAL KEYBOARD SHORTCUTS LISTENER (Ctrl+C, Ctrl+V, Ctrl+D, Del, Esc)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const targetTag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (targetTag === 'input' || targetTag === 'textarea' || targetTag === 'select') return;
      if (editingBusbarModal || editingLineModal || editingDeviceModal || editingNodeModal) return;

      if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'C')) {
        if (selectedElement) {
          e.preventDefault();
          handleCopy();
        }
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'v' || e.key === 'V')) {
        e.preventDefault();
        handlePaste();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'd' || e.key === 'D')) {
        if (selectedElement) {
          e.preventDefault();
          handleDuplicate();
        }
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedElement) {
          e.preventDefault();
          handleDeleteSelected();
        }
      } else if (e.key === 'Escape') {
        setSelectedElement(null);
        setDrawingLineStart(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElement, clipboard, layout, editingBusbarModal, editingLineModal, editingDeviceModal, editingNodeModal]);

  // Convert SVG coordinate with Grid Snapping & Ortho
  const getCanvasCoords = (clientX: number, clientY: number): { x: number; y: number } => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    const scale = 100 / zoom;
    const rawX = (clientX - rect.left) * scale;
    const rawY = (clientY - rect.top) * scale;

    let x = snapToGrid ? Math.round(rawX / gridSize) * gridSize : Math.round(rawX);
    let y = snapToGrid ? Math.round(rawY / gridSize) * gridSize : Math.round(rawY);

    // Apply Ortho constraint if active during line drawing
    if (orthoMode && drawingLineStart) {
      const dx = Math.abs(x - drawingLineStart.x);
      const dy = Math.abs(y - drawingLineStart.y);
      if (dx > dy) {
        y = drawingLineStart.y;
      } else {
        x = drawingLineStart.x;
      }
    }

    return { x, y };
  };

  // Calculate magnetic snap alignment guides with other elements
  const findAlignmentGuides = (currentX: number, currentY: number, excludeId: string) => {
    const threshold = snapToGrid ? gridSize : 10;
    let matchX: number | undefined;
    let matchY: number | undefined;

    // Check busbars
    for (const b of layout.busbars) {
      if (b.id === excludeId) continue;
      if (Math.abs(b.x - currentX) <= threshold) matchX = b.x;
      if (Math.abs(b.y - currentY) <= threshold) matchY = b.y;
    }

    // Check devices
    for (const d of layout.devices) {
      if (d.id === excludeId) continue;
      if (Math.abs(d.x - currentX) <= threshold) matchX = d.x;
      if (Math.abs(d.y - currentY) <= threshold) matchY = d.y;
    }

    return { x: matchX, y: matchY };
  };

  // Auto Snap All Elements to Grid
  const handleSnapAllToGrid = () => {
    const snappedBusbars = layout.busbars.map(b => ({
      ...b,
      x: Math.round(b.x / gridSize) * gridSize,
      y: Math.round(b.y / gridSize) * gridSize,
      length: Math.max(gridSize * 2, Math.round(b.length / gridSize) * gridSize)
    }));

    const snappedLines = layout.lines.map(l => ({
      ...l,
      x1: Math.round(l.x1 / gridSize) * gridSize,
      y1: Math.round(l.y1 / gridSize) * gridSize,
      x2: Math.round(l.x2 / gridSize) * gridSize,
      y2: Math.round(l.y2 / gridSize) * gridSize
    }));

    const snappedDevices = layout.devices.map(d => ({
      ...d,
      x: Math.round(d.x / gridSize) * gridSize,
      y: Math.round(d.y / gridSize) * gridSize
    }));

    const snappedNodes = layout.nodes.map(n => ({
      ...n,
      x: Math.round(n.x / gridSize) * gridSize,
      y: Math.round(n.y / gridSize) * gridSize,
      width: Math.round(n.width / gridSize) * gridSize,
      height: Math.round(n.height / gridSize) * gridSize
    }));

    saveCurrentLayout({
      ...layout,
      busbars: snappedBusbars,
      lines: snappedLines,
      devices: snappedDevices,
      nodes: snappedNodes
    });
  };

  // Factory function to create and append any component at (x, y)
  const createComponentAt = (type: CustomElementType, x: number, y: number) => {
    if (type === 'BUSBAR') {
      const newBus: CustomBusbar = {
        id: `bus_custom_${Date.now()}`,
        name: `BUSBAR 20kV #${layout.busbars.length + 1}`,
        voltageKv: 20,
        x,
        y,
        length: 160,
        orientation: 'HORIZONTAL',
        color: '#06b6d4'
      };
      saveCurrentLayout({ ...layout, busbars: [...layout.busbars, newBus] });
      setSelectedElement({ type: 'BUSBAR', id: newBus.id });
      setActiveTool('SELECT');
    } else if (type === 'LINE') {
      if (!drawingLineStart) {
        setDrawingLineStart({ x, y });
      } else {
        const newLine: CustomLine = {
          id: `line_custom_${Date.now()}`,
          name: `GARIS / KABEL #${layout.lines.length + 1}`,
          type: 'SKTT_20KV',
          x1: drawingLineStart.x,
          y1: drawingLineStart.y,
          x2: x,
          y2: y,
          color: '#06b6d4',
          style: 'SOLID',
          status: 'ENERGIZED'
        };
        saveCurrentLayout({ ...layout, lines: [...layout.lines, newLine] });
        setDrawingLineStart(null);
        setSelectedElement({ type: 'LINE', id: newLine.id });
        setActiveTool('SELECT');
      }
    } else if (type === 'NODE') {
      const newNode: CustomNode = {
        id: `node_custom_${Date.now()}`,
        name: `GARDU / PEMBANGKIT #${layout.nodes.length + 1}`,
        code: `GD-${layout.nodes.length + 1}`,
        type: 'GI',
        x: x - 100,
        y: y - 80,
        width: 240,
        height: 200
      };
      saveCurrentLayout({ ...layout, nodes: [...layout.nodes, newNode] });
      setSelectedElement({ type: 'NODE', id: newNode.id });
      setActiveTool('SELECT');
    } else {
      const devType = type as CustomDevice['type'];
      const typeLabelMap: Record<string, string> = {
        INCOMING: 'PMT INCOMING',
        OUTGOING: 'PMT OUTGOING',
        COUPLING: 'PMT KOPEL (BUS TIE)',
        LBS: 'LBS MOTORIZED',
        RECLOSER: 'RECLOSER (ACR)',
        PMCB: 'PMCB BREAKER',
        FCO: 'FCO PENGAMAN',
        DS: 'PEMISAH (DS)',
        TRAFO: 'TRAFO 150/20kV',
        BREAKER: 'BREAKER PMT'
      };
      const label = typeLabelMap[devType] || devType;

      const newDev: CustomDevice = {
        id: `dev_${devType.toLowerCase()}_${Date.now()}`,
        type: devType,
        name: `${label} #${layout.devices.length + 1}`,
        code: `${devType}-${layout.devices.length + 1}`,
        x,
        y,
        status: 'CLOSED',
        voltageKv: devType === 'TRAFO' ? 150 : 20
      };

      // If it's a coupling breaker, check if we can auto-add a connecting line between adjacent busbars
      let updatedLines = [...layout.lines];
      if (devType === 'COUPLING') {
        const nearbyBusbars = layout.busbars.filter(b => Math.abs(b.y - y) <= 40);
        if (nearbyBusbars.length >= 2) {
          const b1 = nearbyBusbars[0];
          const b2 = nearbyBusbars[1];
          const x1 = Math.min(b1.x + b1.length, b2.x + b2.length);
          const x2 = Math.max(b1.x, b2.x);
          const kopelLine: CustomLine = {
            id: `line_kopel_${Date.now()}`,
            name: `GARIS KOPEL ${b1.name} ↔ ${b2.name}`,
            type: 'BUS_KOPEL',
            x1: Math.min(x1, x),
            y1: y,
            x2: Math.max(x2, x),
            y2: y,
            color: '#06b6d4',
            style: 'SOLID',
            status: 'ENERGIZED'
          };
          updatedLines.push(kopelLine);
        }
      }

      saveCurrentLayout({
        ...layout,
        devices: [...layout.devices, newDev],
        lines: updatedLines
      });
      setSelectedElement({ type: 'DEVICE', id: newDev.id });
      setActiveTool('SELECT');
    }
  };

  // Handle Canvas Click to create elements
  const handleCanvasClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const { x, y } = getCanvasCoords(e.clientX, e.clientY);

    if (activeTool === 'SELECT') {
      // Unselect if clicked empty canvas
      setSelectedElement(null);
      return;
    }

    const toolTypeMap: Record<string, CustomElementType> = {
      ADD_BUSBAR: 'BUSBAR',
      ADD_LINE: 'LINE',
      ADD_NODE: 'NODE',
      ADD_INCOMING: 'INCOMING',
      ADD_OUTGOING: 'OUTGOING',
      ADD_LBS: 'LBS',
      ADD_RECLOSER: 'RECLOSER',
      ADD_PMCB: 'PMCB',
      ADD_FCO: 'FCO',
      ADD_DS: 'DS',
      ADD_COUPLING: 'COUPLING',
      ADD_TRAFO: 'TRAFO',
      ADD_BREAKER: 'BREAKER'
    };

    const targetType = toolTypeMap[activeTool];
    if (targetType) {
      createComponentAt(targetType, x, y);
    }
  };

  // HTML5 Drag and Drop handlers for Toolbox
  const handleToolboxDragStart = (e: React.DragEvent, type: CustomElementType, label: string) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ type, label }));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleCanvasDragOver = (e: React.DragEvent<SVGSVGElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    if (!isDragOverCanvas) setIsDragOverCanvas(true);
    const coords = getCanvasCoords(e.clientX, e.clientY);
    setMousePos(coords);
  };

  const handleCanvasDragLeave = () => {
    setIsDragOverCanvas(false);
  };

  const handleCanvasDrop = (e: React.DragEvent<SVGSVGElement>) => {
    e.preventDefault();
    setIsDragOverCanvas(false);
    try {
      const dataStr = e.dataTransfer.getData('application/json');
      if (!dataStr) return;
      const data = JSON.parse(dataStr);
      if (data && data.type) {
        const coords = getCanvasCoords(e.clientX, e.clientY);
        createComponentAt(data.type as CustomElementType, coords.x, coords.y);
      }
    } catch (err) {
      console.warn('Failed to parse drag drop payload', err);
    }
  };

  // Mouse move handler with dynamic alignment snapping and full resizing/stretching
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    let coords = getCanvasCoords(e.clientX, e.clientY);
    if (snapToGrid) {
      coords = {
        x: Math.round(coords.x / gridSize) * gridSize,
        y: Math.round(coords.y / gridSize) * gridSize
      };
    }
    setMousePos(coords);

    if (!dragAction) return;

    if (dragAction.mode === 'MOVE_ELEMENT') {
      const { type, id } = dragAction;
      let targetX = coords.x - dragOffset.x;
      let targetY = coords.y - dragOffset.y;

      // Check alignment guides
      const guides = findAlignmentGuides(targetX, targetY, id);
      setGuideLines(guides);
      if (guides.x !== undefined) targetX = guides.x;
      if (guides.y !== undefined) targetY = guides.y;

      if (type === 'BUSBAR') {
        setLayout(prev => ({
          ...prev,
          busbars: prev.busbars.map(b => b.id === id ? { ...b, x: targetX, y: targetY } : b)
        }));
      } else if (type === 'NODE') {
        setLayout(prev => ({
          ...prev,
          nodes: prev.nodes.map(n => n.id === id ? { ...n, x: targetX, y: targetY } : n)
        }));
      } else if (type === 'DEVICE') {
        setLayout(prev => ({
          ...prev,
          devices: prev.devices.map(d => d.id === id ? { ...d, x: targetX, y: targetY } : d)
        }));
      } else if (type === 'LINE') {
        setLayout(prev => {
          const currentLine = prev.lines.find(l => l.id === id);
          if (!currentLine) return prev;
          const deltaX = (coords.x - dragOffset.x) - currentLine.x1;
          const deltaY = (coords.y - dragOffset.y) - currentLine.y1;
          return {
            ...prev,
            lines: prev.lines.map(l => l.id === id ? {
              ...l,
              x1: l.x1 + deltaX,
              y1: l.y1 + deltaY,
              x2: l.x2 + deltaX,
              y2: l.y2 + deltaY
            } : l)
          };
        });
      }
    } else if (dragAction.mode === 'RESIZE_LINE_START') {
      const line = layout.lines.find(l => l.id === dragAction.id);
      if (!line) return;
      let targetX = coords.x;
      let targetY = coords.y;
      if (orthoMode) {
        const dx = Math.abs(targetX - line.x2);
        const dy = Math.abs(targetY - line.y2);
        if (dx > dy) targetY = line.y2;
        else targetX = line.x2;
      }
      setLayout(prev => ({
        ...prev,
        lines: prev.lines.map(l => l.id === dragAction.id ? { ...l, x1: targetX, y1: targetY } : l)
      }));
    } else if (dragAction.mode === 'RESIZE_LINE_END') {
      const line = layout.lines.find(l => l.id === dragAction.id);
      if (!line) return;
      let targetX = coords.x;
      let targetY = coords.y;
      if (orthoMode) {
        const dx = Math.abs(targetX - line.x1);
        const dy = Math.abs(targetY - line.y1);
        if (dx > dy) targetY = line.y1;
        else targetX = line.x1;
      }
      setLayout(prev => ({
        ...prev,
        lines: prev.lines.map(l => l.id === dragAction.id ? { ...l, x2: targetX, y2: targetY } : l)
      }));
    } else if (dragAction.mode === 'RESIZE_BUSBAR_END') {
      const bus = layout.busbars.find(b => b.id === dragAction.id);
      if (!bus) return;
      if (bus.orientation === 'HORIZONTAL') {
        const newLen = Math.max(gridSize * 2, coords.x - bus.x);
        setLayout(prev => ({
          ...prev,
          busbars: prev.busbars.map(b => b.id === dragAction.id ? { ...b, length: newLen } : b)
        }));
      } else {
        const newLen = Math.max(gridSize * 2, coords.y - bus.y);
        setLayout(prev => ({
          ...prev,
          busbars: prev.busbars.map(b => b.id === dragAction.id ? { ...b, length: newLen } : b)
        }));
      }
    } else if (dragAction.mode === 'RESIZE_BUSBAR_START') {
      const bus = layout.busbars.find(b => b.id === dragAction.id);
      if (!bus) return;
      if (bus.orientation === 'HORIZONTAL') {
        const currentEndX = bus.x + bus.length;
        const newX = Math.min(coords.x, currentEndX - gridSize * 2);
        const newLen = currentEndX - newX;
        setLayout(prev => ({
          ...prev,
          busbars: prev.busbars.map(b => b.id === dragAction.id ? { ...b, x: newX, length: newLen } : b)
        }));
      } else {
        const currentEndY = bus.y + bus.length;
        const newY = Math.min(coords.y, currentEndY - gridSize * 2);
        const newLen = currentEndY - newY;
        setLayout(prev => ({
          ...prev,
          busbars: prev.busbars.map(b => b.id === dragAction.id ? { ...b, y: newY, length: newLen } : b)
        }));
      }
    } else if (dragAction.mode === 'RESIZE_NODE') {
      const { id, handle, startX, startY, startW, startH } = dragAction;
      const MIN_W = 100;
      const MIN_H = 60;
      setLayout(prev => ({
        ...prev,
        nodes: prev.nodes.map(n => {
          if (n.id !== id) return n;
          let newX = n.x;
          let newY = n.y;
          let newW = n.width;
          let newH = n.height;

          if (handle === 'SE') {
            newW = Math.max(MIN_W, coords.x - startX);
            newH = Math.max(MIN_H, coords.y - startY);
          } else if (handle === 'E') {
            newW = Math.max(MIN_W, coords.x - startX);
          } else if (handle === 'S') {
            newH = Math.max(MIN_H, coords.y - startY);
          } else if (handle === 'NW') {
            const right = startX + startW;
            const bottom = startY + startH;
            newX = Math.min(coords.x, right - MIN_W);
            newY = Math.min(coords.y, bottom - MIN_H);
            newW = right - newX;
            newH = bottom - newY;
          } else if (handle === 'NE') {
            const bottom = startY + startH;
            newY = Math.min(coords.y, bottom - MIN_H);
            newW = Math.max(MIN_W, coords.x - startX);
            newH = bottom - newY;
          } else if (handle === 'SW') {
            const right = startX + startW;
            newX = Math.min(coords.x, right - MIN_W);
            newW = right - newX;
            newH = Math.max(MIN_H, coords.y - startY);
          } else if (handle === 'W') {
            const right = startX + startW;
            newX = Math.min(coords.x, right - MIN_W);
            newW = right - newX;
          } else if (handle === 'N') {
            const bottom = startY + startH;
            newY = Math.min(coords.y, bottom - MIN_H);
            newH = bottom - newY;
          }

          return { ...n, x: newX, y: newY, width: newW, height: newH };
        })
      }));
    } else if (dragAction.mode === 'RESIZE_DEVICE') {
      const { id, centerX, centerY, startDist, startScale } = dragAction;
      const currentDist = Math.hypot(coords.x - centerX, coords.y - centerY);
      const ratio = currentDist / (startDist || 1);
      let newScale = Math.round((startScale * ratio) * 20) / 20;
      newScale = Math.max(0.4, Math.min(3.0, newScale));
      setLayout(prev => ({
        ...prev,
        devices: prev.devices.map(d => d.id === id ? { ...d, scale: newScale } : d)
      }));
    }
  };

  const handleMouseUp = () => {
    if (dragAction) {
      setDragAction(null);
      setGuideLines({});
      saveCurrentLayout(layout);
    }
  };

  // Helper function for interactive line resizing
  const handleModifyLineLength = (lineId: string, delta: number) => {
    const line = layout.lines.find(l => l.id === lineId);
    if (!line) return;
    const dx = line.x2 - line.x1;
    const dy = line.y2 - line.y1;
    const len = Math.hypot(dx, dy) || 1;
    const newLen = Math.max(20, len + delta);
    const ratio = newLen / len;
    const newX2 = Math.round((line.x1 + dx * ratio) / gridSize) * gridSize;
    const newY2 = Math.round((line.y1 + dy * ratio) / gridSize) * gridSize;
    saveCurrentLayout({
      ...layout,
      lines: layout.lines.map(l => l.id === lineId ? { ...l, x2: newX2, y2: newY2 } : l)
    });
    showToast(`📏 Panjang Garis: ${Math.round(newLen)}px`);
  };

  const handleModifyLineThickness = (lineId: string, strokeWidth: number) => {
    saveCurrentLayout({
      ...layout,
      lines: layout.lines.map(l => l.id === lineId ? { ...l, strokeWidth } : l)
    });
    showToast(`🎨 Ketebalan Garis diubah: ${strokeWidth}px`);
  };

  const handleModifyBusbarLength = (busId: string, delta: number) => {
    const bus = layout.busbars.find(b => b.id === busId);
    if (!bus) return;
    const newLen = Math.max(gridSize * 2, bus.length + delta);
    saveCurrentLayout({
      ...layout,
      busbars: layout.busbars.map(b => b.id === busId ? { ...b, length: newLen } : b)
    });
    showToast(`📏 Panjang Rel Busbar: ${newLen}px`);
  };

  const handleModifyBusbarThickness = (busId: string, thickness: number) => {
    saveCurrentLayout({
      ...layout,
      busbars: layout.busbars.map(b => b.id === busId ? { ...b, thickness } : b)
    });
    showToast(`🎨 Ketebalan Rel diubah: ${thickness}px`);
  };

  const handleModifyBusbarOrientation = (busId: string) => {
    const bus = layout.busbars.find(b => b.id === busId);
    if (!bus) return;
    const nextOrient = bus.orientation === 'HORIZONTAL' ? 'VERTICAL' : 'HORIZONTAL';
    saveCurrentLayout({
      ...layout,
      busbars: layout.busbars.map(b => b.id === busId ? { ...b, orientation: nextOrient } : b)
    });
    showToast(`🔄 Orientasi Rel diubah: ${nextOrient}`);
  };

  const handleModifyDeviceScale = (devId: string, scaleOrDelta: number, isDelta = false) => {
    const dev = layout.devices.find(d => d.id === devId);
    if (!dev) return;
    const currentScale = dev.scale || 1.0;
    const targetScale = isDelta ? currentScale + scaleOrDelta : scaleOrDelta;
    const clamped = Math.max(0.4, Math.min(3.0, Math.round(targetScale * 20) / 20));
    saveCurrentLayout({
      ...layout,
      devices: layout.devices.map(d => d.id === devId ? { ...d, scale: clamped } : d)
    });
    showToast(`🔍 Ukuran Komponen: ${Math.round(clamped * 100)}%`);
  };

  const handleModifyNodeDimensions = (nodeId: string, deltaW: number, deltaH: number) => {
    const node = layout.nodes.find(n => n.id === nodeId);
    if (!node) return;
    const newW = Math.max(100, node.width + deltaW);
    const newH = Math.max(60, node.height + deltaH);
    saveCurrentLayout({
      ...layout,
      nodes: layout.nodes.map(n => n.id === nodeId ? { ...n, width: newW, height: newH } : n)
    });
    showToast(`📐 Ukuran Gardu: ${newW}x${newH}px`);
  };

  // Delete selected element
  const handleDeleteSelected = () => {
    if (!selectedElement) return;
    const { type, id } = selectedElement;
    if (type === 'BUSBAR') {
      saveCurrentLayout({ ...layout, busbars: layout.busbars.filter(b => b.id !== id) });
    } else if (type === 'LINE') {
      saveCurrentLayout({ ...layout, lines: layout.lines.filter(l => l.id !== id) });
    } else if (type === 'NODE') {
      saveCurrentLayout({ ...layout, nodes: layout.nodes.filter(n => n.id !== id) });
    } else if (type === 'DEVICE') {
      saveCurrentLayout({ ...layout, devices: layout.devices.filter(d => d.id !== id) });
    }
    setSelectedElement(null);
  };

  // Reset to default preset
  const handleResetToDefault = () => {
    if (window.confirm('Reset diagram ke Layout 1 Sistem Normal Ambon (150kV & 20kV lengkap dengan Kopel, Recloser, LBS, PMCB, FCO & DS)?')) {
      saveCurrentLayout(DEFAULT_NORMAL_SYSTEM_LAYOUT);
      setSelectedElement(null);
    }
  };

  // Export JSON
  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(layout, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `sld_system_layout_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import JSON
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target?.result as string);
        if (parsed && Array.isArray(parsed.busbars) && Array.isArray(parsed.lines)) {
          const devices = Array.isArray(parsed.devices) 
            ? parsed.devices 
            : Array.isArray(parsed.breakers) 
            ? parsed.breakers.map((b: any) => ({ ...b, type: b.type || 'BREAKER' }))
            : [];
          saveCurrentLayout({ ...parsed, devices });
          alert('Berhasil mengimpor layout diagram SLD!');
        } else {
          alert('Format file JSON tidak valid!');
        }
      } catch (err) {
        alert('Gagal membaca file JSON!');
      }
    };
    reader.readAsText(file);
  };

  // Fullscreen toggle handler
  const toggleFullscreen = () => {
    if (!isFullscreen) {
      setIsFullscreen(true);
      try {
        if (containerRef.current && containerRef.current.requestFullscreen) {
          containerRef.current.requestFullscreen().catch(() => {});
        }
      } catch {}
    } else {
      setIsFullscreen(false);
      try {
        if (document.fullscreenElement && document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        }
      } catch {}
    }
  };

  // List of Toolbox Items with metadata, icons, tags & descriptions
  const toolboxItems: Array<{
    type: CustomElementType;
    label: string;
    sublabel: string;
    category: 'SWITCH' | 'NETWORK';
    badge: string;
    badgeColor: string;
    icon: React.ReactNode;
    color: string;
  }> = [
    // SWITCHING & PROTECTION
    {
      type: 'INCOMING',
      label: 'PMT Incoming',
      sublabel: 'Incomer Trafo 20kV/150kV',
      category: 'SWITCH',
      badge: 'INC',
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
      icon: <Power className="w-4 h-4 text-cyan-400" />,
      color: '#06b6d4'
    },
    {
      type: 'OUTGOING',
      label: 'PMT Outgoing',
      sublabel: 'Bay Feeder Keluar 20kV',
      category: 'SWITCH',
      badge: 'OUT',
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
      icon: <Zap className="w-4 h-4 text-rose-400" />,
      color: '#f43f5e'
    },
    {
      type: 'COUPLING',
      label: 'PMT Kopel (Bus Tie)',
      sublabel: 'Penyambung Rel Busbar A ↔ B',
      category: 'SWITCH',
      badge: 'KOPEL',
      badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
      icon: <Link2 className="w-4 h-4 text-teal-400" />,
      color: '#14b8a6'
    },
    {
      type: 'LBS',
      label: 'LBS Motorized',
      sublabel: 'Load Break Switch Sectionalizer',
      category: 'SWITCH',
      badge: 'LBS',
      badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
      icon: <Activity className="w-4 h-4 text-blue-400" />,
      color: '#3b82f6'
    },
    {
      type: 'RECLOSER',
      label: 'Recloser (ACR)',
      sublabel: 'Auto Circuit Recloser Proteksi',
      category: 'SWITCH',
      badge: 'REC',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      icon: <Zap className="w-4 h-4 text-amber-400" />,
      color: '#f59e0b'
    },
    {
      type: 'PMCB',
      label: 'PMCB SF6 / Vac',
      sublabel: 'Pole Mounted Circuit Breaker',
      category: 'SWITCH',
      badge: 'PMCB',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
      icon: <ShieldCheckIcon className="w-4 h-4 text-purple-400" />,
      color: '#a855f7'
    },
    {
      type: 'FCO',
      label: 'FCO Pengaman Lebur',
      sublabel: 'Fuse Cut Out Percabangan',
      category: 'SWITCH',
      badge: 'FCO',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      icon: <Radio className="w-4 h-4 text-emerald-400" />,
      color: '#10b981'
    },
    {
      type: 'DS',
      label: 'DS (Pemisah Udara)',
      sublabel: 'Disconnecting Switch Isolator',
      category: 'SWITCH',
      badge: 'DS',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      icon: <Unlink className="w-4 h-4 text-amber-400" />,
      color: '#f59e0b'
    },
    {
      type: 'TRAFO',
      label: 'Trafo Step Down',
      sublabel: 'Transformator 150/20kV',
      category: 'SWITCH',
      badge: 'TR',
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
      icon: <RotateCcw className="w-4 h-4 text-indigo-400" />,
      color: '#818cf8'
    },

    // NETWORK, BUSBAR & STATION TOPOLOGY
    {
      type: 'BUSBAR',
      label: 'Batang Rel Busbar',
      sublabel: 'Garis Konduktor Utama 20kV/150kV',
      category: 'NETWORK',
      badge: 'REL',
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
      icon: <Layers className="w-4 h-4 text-cyan-400" />,
      color: '#06b6d4'
    },
    {
      type: 'LINE',
      label: 'Garis / Kabel Koneksi',
      sublabel: 'SUTT / SKTT / Feeder Conductor',
      category: 'NETWORK',
      badge: 'LINE',
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
      icon: <GitCommit className="w-4 h-4 text-rose-400" />,
      color: '#f43f5e'
    },
    {
      type: 'NODE',
      label: 'Gardu Induk / PLTD',
      sublabel: 'Blok Substation GI / GH / PLTD',
      category: 'NETWORK',
      badge: 'GI/GH',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      icon: <Building2 className="w-4 h-4 text-emerald-400" />,
      color: '#10b981'
    }
  ];

  return (
    <div 
      ref={containerRef}
      className={`w-full flex flex-col bg-[#040914] text-slate-100 border border-cyan-500/40 shadow-2xl transition-all ${
        isFullscreen ? 'fixed inset-0 z-[99999] w-screen h-screen rounded-none border-none' : 'rounded-2xl overflow-hidden'
      }`}
    >
      
      {/* 1. TOP HEADER TOOLBAR */}
      <div className="bg-[#081224] border-b border-cyan-500/30 p-3 md:p-4 flex flex-wrap items-center justify-between gap-3">
        
        {/* Title & Info */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
            <Edit3 className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-sm md:text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
              <span>DESAIN &amp; EDITOR KUSTOM SLD 1 SISTEM NORMAL</span>
              <span className="px-2 py-0.5 rounded text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-500/40 font-mono">
                SNAP-TO-GRID {gridSize}px
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">
              Drag-and-Drop Toolbox: Busbar Berbentuk Garis, Kopel &amp; Garis Penyambung, Incoming, Outgoing, Trafo, LBS, Recloser, PMCB, FCO, DS.
            </p>
          </div>
        </div>

        {/* Global Toolbar Controls */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Toggle Toolbox Button */}
          <button
            onClick={() => setIsToolboxOpen(!isToolboxOpen)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
              isToolboxOpen 
                ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.3)]' 
                : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
            }`}
            title="Tampilkan / Sembunyikan Panel Toolbox Komponen"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{isToolboxOpen ? 'Sembunyikan Toolbox' : 'Buka Toolbox'}</span>
          </button>

          {/* 📋 DUPLICATE / COPY / PASTE ACTION CONTROLS */}
          <div className="flex items-center bg-[#020612] border border-cyan-500/40 rounded-xl p-1 gap-1 text-xs">
            <button
              onClick={handleDuplicate}
              disabled={!selectedElement}
              className={`px-2.5 py-1 rounded-lg text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                selectedElement 
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-[0_0_12px_rgba(245,158,11,0.5)] active:scale-95' 
                  : 'bg-slate-900/50 text-slate-600 cursor-not-allowed'
              }`}
              title="Duplikasi elemen yang dipilih (Shortcut: Ctrl+D / Cmd+D)"
            >
              <Files className="w-3.5 h-3.5" />
              <span>Duplikat (Ctrl+D)</span>
            </button>

            <button
              onClick={handleCopy}
              disabled={!selectedElement}
              className={`px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                selectedElement 
                  ? 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30' 
                  : 'bg-transparent text-slate-600 cursor-not-allowed'
              }`}
              title="Salin elemen yang dipilih (Ctrl+C)"
            >
              <Copy className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Salin</span>
            </button>

            <button
              onClick={() => handlePaste()}
              disabled={!clipboard}
              className={`px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                clipboard 
                  ? 'bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.3)] animate-pulse' 
                  : 'bg-transparent text-slate-600 cursor-not-allowed'
              }`}
              title="Tempel elemen dari clipboard (Ctrl+V)"
            >
              <ClipboardPaste className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tempel</span>
            </button>
          </div>

          {/* Snap-to-Grid Quick Settings */}
          <div className="flex items-center bg-[#020612] border border-cyan-500/40 rounded-xl px-2 py-1 gap-1.5 text-xs">
            <button
              onClick={() => setSnapToGrid(!snapToGrid)}
              className={`px-2.5 py-1 rounded-lg text-xs font-black flex items-center gap-1 transition-all cursor-pointer ${
                snapToGrid ? 'bg-cyan-500 text-slate-950 shadow-[0_0_10px_rgba(6,182,212,0.4)]' : 'bg-slate-900 text-slate-400'
              }`}
              title="Aktifkan / Matikan Snap-to-Grid Magnet"
            >
              <Magnet className="w-3.5 h-3.5" />
              <span>Snap: {snapToGrid ? 'ON' : 'OFF'}</span>
            </button>

            {/* Grid Step Size */}
            <select
              value={gridSize}
              onChange={(e) => setGridSize(Number(e.target.value))}
              className="bg-slate-900 border border-slate-700 text-cyan-300 rounded px-1.5 py-0.5 text-xs font-mono font-bold"
              title="Ukuran Grid Interval Snap"
            >
              <option value={10}>10px (Halus)</option>
              <option value={20}>20px (Standar)</option>
              <option value={40}>40px (Renggang)</option>
            </select>

            {/* Toggle Grid Lines Visibility */}
            <button
              onClick={toggleGrid}
              className={`px-2 py-1 rounded-lg text-xs font-black flex items-center gap-1 transition-all cursor-pointer ${
                showGrid 
                  ? 'bg-cyan-950 border border-cyan-400 text-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.3)]' 
                  : 'bg-slate-900 border border-slate-700 text-slate-500 hover:text-slate-300'
              }`}
              title={showGrid 
                ? "Sembunyikan Garis Grid (Snap magnet tetap aktif untuk gambar bebas tanpa visual clutter)" 
                : "Tampilkan Garis Grid (Snap magnet aktif)"}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Grid: {showGrid ? 'ON' : 'OFF'}</span>
            </button>

            {/* Auto Snap All Elements */}
            <button
              onClick={handleSnapAllToGrid}
              className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-300 hover:text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer"
              title="Ratakan Semua Komponen ke Garis Grid Terdekat"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ratakan Grid</span>
            </button>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center bg-[#020612] border border-slate-800 rounded-xl px-2 py-1 gap-1 text-xs">
            <button onClick={() => setZoom(Math.max(40, zoom - 10))} className="p-1 text-slate-400 hover:text-white"><ZoomOut className="w-3.5 h-3.5" /></button>
            <span className="font-mono text-cyan-300 min-w-[34px] text-center font-bold">{zoom}%</span>
            <button onClick={() => setZoom(Math.min(160, zoom + 10))} className="p-1 text-slate-400 hover:text-white"><ZoomIn className="w-3.5 h-3.5" /></button>
            <button onClick={() => setZoom(100)} className="px-1 text-[10px] text-slate-400 hover:text-cyan-300">100%</button>
          </div>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="px-3 py-1.5 rounded-xl bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/50 text-cyan-300 text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-lg"
            title={isFullscreen ? "Keluar Mode Layar Penuh" : "Mode Layar Penuh (Fullscreen)"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            <span className="hidden md:inline">{isFullscreen ? 'Kecilkan' : 'Fullscreen'}</span>
          </button>

          {/* Delete selected */}
          {selectedElement && (
            <button
              onClick={handleDeleteSelected}
              className="px-3 py-1.5 rounded-xl bg-rose-950 hover:bg-rose-900 border border-rose-500/50 text-rose-300 text-xs font-black flex items-center gap-1 cursor-pointer animate-bounce"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus ({selectedElement.type})</span>
            </button>
          )}

          {/* Import / Export / Reset */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleExportJson}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white"
              title="Download JSON Layout"
            >
              <Download className="w-4 h-4" />
            </button>
            <label className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white cursor-pointer">
              <Upload className="w-4 h-4" />
              <input type="file" accept=".json" onChange={handleImportJson} className="hidden" />
            </label>
            <button
              onClick={handleResetToDefault}
              className="px-3 py-1.5 rounded-xl bg-amber-950/80 hover:bg-amber-900 border border-amber-500/50 text-amber-300 text-xs font-black flex items-center gap-1 transition-all cursor-pointer"
              title="Reset Ke Layout Default Sistem Normal"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset Normal</span>
            </button>
          </div>

        </div>

      </div>

      {/* 2. SUB-BAR INFO & ORTHO CONTROLS */}
      <div className="bg-[#050b18] border-b border-cyan-500/30 p-2 px-4 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-extrabold text-cyan-400 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Tarik (Drag &amp; Drop) ikon dari Toolbox di sisi kiri ke dalam Canvas untuk menambah peralatan.</span>
          </span>
        </div>

        {/* Ortho & Live Coordinates readout */}
        <div className="flex items-center gap-3 text-xs font-mono">
          <button
            onClick={() => setOrthoMode(!orthoMode)}
            className={`px-2 py-1 rounded text-[10px] font-bold border transition-all ${
              orthoMode ? 'bg-cyan-950 border-cyan-400 text-cyan-300' : 'border-slate-800 text-slate-500'
            }`}
            title="Ortho Mode: Kunci garis lurus 90° (Horizontal/Vertikal)"
          >
            ORTHO 90°: {orthoMode ? 'ON' : 'OFF'}
          </button>

          <span className="text-slate-400">
            X: <span className="text-cyan-300 font-bold">{mousePos.x}</span>, Y: <span className="text-cyan-300 font-bold">{mousePos.y}</span>
          </span>
        </div>
      </div>

      {/* 3. MAIN WORKSPACE WITH SIDEBAR TOOLBOX + CANVAS */}
      <div className="flex-1 flex overflow-hidden relative">

        {/* 🧰 SIDEBAR TOOLBOX PANEL */}
        {isToolboxOpen && (
          <aside className="w-64 md:w-72 bg-[#060c1c] border-r border-cyan-500/30 flex flex-col shrink-0 overflow-y-auto max-h-[750px] scrollbar-thin z-20 shadow-2xl">
            
            {/* Toolbox Header */}
            <div className="p-3 bg-[#0a1428] border-b border-cyan-900/60 flex items-center justify-between sticky top-0 z-10 backdrop-blur-md">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-white uppercase tracking-wider">PANEL TOOLBOX</h3>
                  <p className="text-[10px] text-cyan-400/80">Tarik komponen ke canvas</p>
                </div>
              </div>
              <button
                onClick={() => setIsToolboxOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                title="Tutup Panel"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>

            {/* Selection Tool Mode */}
            <div className="p-3 border-b border-cyan-950">
              <button
                onClick={() => { setActiveTool('SELECT'); setDrawingLineStart(null); }}
                className={`w-full p-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg ${
                  activeTool === 'SELECT' 
                    ? 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.5)]' 
                    : 'bg-slate-900/90 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700'
                }`}
              >
                <Move className="w-4 h-4" />
                <span>MODE PILIH &amp; GESER (SELECT)</span>
              </button>
            </div>

            {/* Category 1: Switching & Protection Devices */}
            <div className="p-3 space-y-2">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                <Zap className="w-3 h-3 text-amber-400" />
                <span>Sakelar &amp; Proteksi Gardu</span>
              </div>

              <div className="grid grid-cols-1 gap-1.5">
                {toolboxItems.filter(item => item.category === 'SWITCH').map(item => (
                  <div
                    key={item.type}
                    draggable
                    onDragStart={(e) => handleToolboxDragStart(e, item.type, item.label)}
                    onClick={() => {
                      const toolName = `ADD_${item.type}` as any;
                      setActiveTool(toolName);
                      setDrawingLineStart(null);
                    }}
                    className={`p-2 rounded-xl border flex items-center justify-between gap-2 cursor-grab active:cursor-grabbing transition-all select-none hover:translate-x-1 ${
                      activeTool === `ADD_${item.type}`
                        ? 'bg-cyan-950/80 border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                        : 'bg-[#091124] border-slate-800/90 hover:border-cyan-500/50 hover:bg-[#0d1a36]'
                    }`}
                    title={`Drag ke canvas atau klik untuk pasang ${item.label}`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 shrink-0">
                        {item.icon}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-black text-white truncate flex items-center gap-1.5">
                          <span>{item.label}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">{item.sublabel}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-black border ${item.badgeColor}`}>
                        {item.badge}
                      </span>
                      <GripVertical className="w-3.5 h-3.5 text-slate-600" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Category 2: Network & Busbars */}
            <div className="p-3 space-y-2 border-t border-cyan-950">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                <Layers className="w-3 h-3 text-cyan-400" />
                <span>Rel Busbar &amp; Jaringan</span>
              </div>

              <div className="grid grid-cols-1 gap-1.5">
                {toolboxItems.filter(item => item.category === 'NETWORK').map(item => (
                  <div
                    key={item.type}
                    draggable
                    onDragStart={(e) => handleToolboxDragStart(e, item.type, item.label)}
                    onClick={() => {
                      const toolName = `ADD_${item.type}` as any;
                      setActiveTool(toolName);
                      setDrawingLineStart(null);
                    }}
                    className={`p-2 rounded-xl border flex items-center justify-between gap-2 cursor-grab active:cursor-grabbing transition-all select-none hover:translate-x-1 ${
                      activeTool === `ADD_${item.type}`
                        ? 'bg-cyan-950/80 border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                        : 'bg-[#091124] border-slate-800/90 hover:border-cyan-500/50 hover:bg-[#0d1a36]'
                    }`}
                    title={`Drag ke canvas atau klik untuk pasang ${item.label}`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 shrink-0">
                        {item.icon}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-black text-white truncate flex items-center gap-1.5">
                          <span>{item.label}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">{item.sublabel}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-black border ${item.badgeColor}`}>
                        {item.badge}
                      </span>
                      <GripVertical className="w-3.5 h-3.5 text-slate-600" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Toolbox Footer Info */}
            <div className="p-3 mt-auto bg-[#030712] border-t border-cyan-950 text-[10px] text-slate-400 leading-relaxed">
              <div className="flex items-center gap-1.5 text-amber-300 font-bold mb-1">
                <Magnet className="w-3 h-3" />
                <span>Otomatis Snap-to-Grid</span>
              </div>
              Semua komponen yang di-drag langsung sejajar rapi sesuai titik grid {gridSize}px.
            </div>

          </aside>
        )}

        {/* 🎨 DRAWING CANVAS SVG WORKSPACE */}
        <div className="flex-1 bg-[#02050b] mini-dcc-grid relative overflow-auto p-0 flex justify-start items-start">
          
          {/* Toast Notification Alert */}
          {toastMessage && (
            <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-slate-950/95 border border-cyan-400 text-cyan-300 px-4 py-2 rounded-xl text-xs font-black shadow-[0_0_20px_rgba(6,182,212,0.4)] flex items-center gap-2 animate-fade-in backdrop-blur-md">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{toastMessage}</span>
            </div>
          )}

          {/* Floating Selected Element Action Bar HUD */}
          {selectedElement && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[#060e20]/95 border border-cyan-500/60 rounded-2xl px-3 py-2 shadow-[0_0_30px_rgba(6,182,212,0.4)] backdrop-blur-xl flex flex-wrap items-center gap-2 max-w-[92vw]">
              <span className="text-[10px] font-mono font-black text-cyan-300 px-2 py-1 bg-cyan-950/80 rounded-lg border border-cyan-800 shrink-0">
                PILIHAN: {selectedElement.type}
              </span>

              {/* DYNAMIC SIZING CONTROLS DEPENDING ON SELECTED ELEMENT TYPE */}
              {selectedElement.type === 'LINE' && (() => {
                const line = layout.lines.find(l => l.id === selectedElement.id);
                if (!line) return null;
                const len = Math.round(Math.hypot(line.x2 - line.x1, line.y2 - line.y1));
                const currentStroke = line.strokeWidth || (line.type === 'SUTT_150KV' ? 4 : line.type === 'BUS_KOPEL' ? 4.5 : 3);
                return (
                  <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-700/80 rounded-xl px-2 py-1 shrink-0">
                    <span className="text-[10px] font-bold text-slate-300 mr-1">Panjang: <b className="text-cyan-300">{len}px</b></span>
                    <button
                      onClick={() => handleModifyLineLength(line.id, -40)}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 font-black text-[10px] cursor-pointer"
                      title="Perpendek garis (-40px)"
                    >
                      - 40px
                    </button>
                    <button
                      onClick={() => handleModifyLineLength(line.id, 40)}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 font-black text-[10px] cursor-pointer"
                      title="Perpanjang garis (+40px)"
                    >
                      + 40px
                    </button>
                    
                    <div className="h-3.5 w-px bg-slate-700 mx-1" />
                    
                    <span className="text-[10px] font-bold text-slate-400">Tebal:</span>
                    {[2, 3, 5, 8].map(th => (
                      <button
                        key={th}
                        onClick={() => handleModifyLineThickness(line.id, th)}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                          currentStroke === th ? 'bg-cyan-500 text-slate-950 font-black' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                        }`}
                      >
                        {th}px
                      </button>
                    ))}
                  </div>
                );
              })()}

              {selectedElement.type === 'BUSBAR' && (() => {
                const bus = layout.busbars.find(b => b.id === selectedElement.id);
                if (!bus) return null;
                const currentTh = bus.thickness || 8;
                return (
                  <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-700/80 rounded-xl px-2 py-1 shrink-0">
                    <span className="text-[10px] font-bold text-slate-300 mr-1">Panjang Rel: <b className="text-amber-300">{bus.length}px</b></span>
                    <button
                      onClick={() => handleModifyBusbarLength(bus.id, -40)}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 font-black text-[10px] cursor-pointer"
                      title="Perpendek rel busbar (-40px)"
                    >
                      - 40px
                    </button>
                    <button
                      onClick={() => handleModifyBusbarLength(bus.id, 40)}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 font-black text-[10px] cursor-pointer"
                      title="Perpanjang rel busbar (+40px)"
                    >
                      + 40px
                    </button>
                    <button
                      onClick={() => handleModifyBusbarOrientation(bus.id)}
                      className="px-2 py-0.5 rounded bg-amber-950/80 hover:bg-amber-900 border border-amber-600/40 text-amber-300 font-bold text-[10px] cursor-pointer ml-1"
                      title="Ganti orientasi Horizontal/Vertikal"
                    >
                      {bus.orientation === 'HORIZONTAL' ? '↔ Horiz' : '↕ Vert'}
                    </button>

                    <div className="h-3.5 w-px bg-slate-700 mx-1" />
                    <span className="text-[10px] font-bold text-slate-400">Tebal:</span>
                    {[6, 8, 12, 16].map(th => (
                      <button
                        key={th}
                        onClick={() => handleModifyBusbarThickness(bus.id, th)}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                          currentTh === th ? 'bg-amber-400 text-slate-950 font-black' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                        }`}
                      >
                        {th}px
                      </button>
                    ))}
                  </div>
                );
              })()}

              {selectedElement.type === 'DEVICE' && (() => {
                const dev = layout.devices.find(d => d.id === selectedElement.id);
                if (!dev) return null;
                const curScale = dev.scale || 1.0;
                return (
                  <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-700/80 rounded-xl px-2 py-1 shrink-0">
                    <span className="text-[10px] font-bold text-slate-300 mr-1">Skala: <b className="text-cyan-300">{Math.round(curScale * 100)}%</b></span>
                    <button
                      onClick={() => handleModifyDeviceScale(dev.id, -0.1, true)}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 font-black text-[10px] cursor-pointer"
                      title="Perkecil ukuran (-10%)"
                    >
                      - 10%
                    </button>
                    <button
                      onClick={() => handleModifyDeviceScale(dev.id, 0.1, true)}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 font-black text-[10px] cursor-pointer"
                      title="Perbesar ukuran (+10%)"
                    >
                      + 10%
                    </button>
                    {[0.75, 1.0, 1.25, 1.5, 2.0].map(sc => (
                      <button
                        key={sc}
                        onClick={() => handleModifyDeviceScale(dev.id, sc)}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                          Math.abs(curScale - sc) < 0.05 ? 'bg-cyan-400 text-slate-950 font-black' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                        }`}
                      >
                        {Math.round(sc * 100)}%
                      </button>
                    ))}
                  </div>
                );
              })()}

              {selectedElement.type === 'NODE' && (() => {
                const node = layout.nodes.find(n => n.id === selectedElement.id);
                if (!node) return null;
                return (
                  <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-700/80 rounded-xl px-2 py-1 shrink-0">
                    <span className="text-[10px] font-bold text-slate-300 mr-1">Dimensi: <b className="text-emerald-300">{node.width}x{node.height}</b></span>
                    <button
                      onClick={() => handleModifyNodeDimensions(node.id, -40, 0)}
                      className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-emerald-300 font-bold text-[10px] cursor-pointer"
                      title="Kurangi lebar"
                    >
                      ↔ -40
                    </button>
                    <button
                      onClick={() => handleModifyNodeDimensions(node.id, 40, 0)}
                      className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-emerald-300 font-bold text-[10px] cursor-pointer"
                      title="Tambah lebar"
                    >
                      ↔ +40
                    </button>
                    <button
                      onClick={() => handleModifyNodeDimensions(node.id, 0, -40)}
                      className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-emerald-300 font-bold text-[10px] cursor-pointer"
                      title="Kurangi tinggi"
                    >
                      ↕ -40
                    </button>
                    <button
                      onClick={() => handleModifyNodeDimensions(node.id, 0, 40)}
                      className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-emerald-300 font-bold text-[10px] cursor-pointer"
                      title="Tambah tinggi"
                    >
                      ↕ +40
                    </button>
                  </div>
                );
              })()}
              
              <button
                onClick={handleDuplicate}
                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-lg active:scale-95 transition-all shrink-0"
                title="Duplikasi elemen (Ctrl+D)"
              >
                <Files className="w-3.5 h-3.5" />
                <span>Duplikat (Ctrl+D)</span>
              </button>

              <button
                onClick={handleCopy}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all shrink-0"
                title="Salin (Ctrl+C)"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Salin (Ctrl+C)</span>
              </button>

              <button
                onClick={() => {
                  if (selectedElement.type === 'BUSBAR') {
                    const item = layout.busbars.find(b => b.id === selectedElement.id);
                    if (item) setEditingBusbarModal(item);
                  } else if (selectedElement.type === 'DEVICE') {
                    const item = layout.devices.find(d => d.id === selectedElement.id);
                    if (item) setEditingDeviceModal(item);
                  } else if (selectedElement.type === 'LINE') {
                    const item = layout.lines.find(l => l.id === selectedElement.id);
                    if (item) setEditingLineModal(item);
                  } else if (selectedElement.type === 'NODE') {
                    const item = layout.nodes.find(n => n.id === selectedElement.id);
                    if (item) setEditingNodeModal(item);
                  }
                }}
                className="px-3 py-1.5 rounded-xl bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all shrink-0"
                title="Edit properti komponen"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>

              <button
                onClick={handleDeleteSelected}
                className="px-3 py-1.5 rounded-xl bg-rose-950 hover:bg-rose-900 border border-rose-500/40 text-rose-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all shrink-0"
                title="Hapus elemen (Delete)"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus</span>
              </button>
            </div>
          )}

          {/* Collapse Toolbox Floating Tab when closed */}
          {!isToolboxOpen && (
            <button
              onClick={() => setIsToolboxOpen(true)}
              className="absolute left-3 top-3 z-30 px-3 py-2 rounded-xl bg-cyan-950/90 hover:bg-cyan-900 border border-cyan-500/50 text-cyan-300 text-xs font-black flex items-center gap-2 shadow-2xl backdrop-blur-md cursor-pointer transition-all"
            >
              <ChevronRight className="w-4 h-4" />
              <span>Buka Toolbox</span>
            </button>
          )}

          {/* Visual Drop Area Ring indicator */}
          {isDragOverCanvas && (
            <div className="absolute inset-4 border-2 border-dashed border-cyan-400 bg-cyan-500/10 pointer-events-none z-30 rounded-2xl flex items-center justify-center">
              <div className="bg-slate-950/90 border border-cyan-400 px-4 py-2 rounded-xl text-cyan-300 font-bold text-xs shadow-2xl animate-pulse flex items-center gap-2">
                <Magnet className="w-4 h-4 text-cyan-400 animate-spin" />
                <span>Lepaskan komponen di sini (Snap: {gridSize}px)</span>
              </div>
            </div>
          )}

          <div
            style={{
              width: canvasDimensions.width * (zoom / 100),
              height: canvasDimensions.height * (zoom / 100),
              position: 'relative'
            }}
          >
            <svg
              ref={canvasRef}
              width={canvasDimensions.width}
              height={canvasDimensions.height}
              viewBox={`0 0 ${canvasDimensions.width} ${canvasDimensions.height}`}
              className="bg-[#020612] cursor-crosshair origin-top-left transition-transform duration-75 block select-none"
              style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top left' }}
              onClick={handleCanvasClick}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onDragOver={handleCanvasDragOver}
              onDragLeave={handleCanvasDragLeave}
              onDrop={handleCanvasDrop}
            >
              {/* SVG Definitions */}
              <defs>
                <filter id="glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                <filter id="glow-rose" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                <filter id="glow-amber" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                <filter id="glow-emerald" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>

                {/* Pattern Grid with 20px intervals */}
                <pattern id="grid-pattern-editor" width={gridSize} height={gridSize} patternUnits="userSpaceOnUse">
                  <path d={`M ${gridSize} 0 L 0 0 0 ${gridSize}`} fill="none" stroke="rgba(6, 182, 212, 0.08)" strokeWidth="1" />
                  <circle cx="0" cy="0" r="1" fill="rgba(6, 182, 212, 0.25)" />
                </pattern>
              </defs>

              {/* Grid Background */}
              {showGrid && <rect width={canvasDimensions.width} height={canvasDimensions.height} fill="url(#grid-pattern-editor)" />}

              {/* DYNAMIC MAGNETIC ALIGNMENT GUIDES */}
              {guideLines.x !== undefined && (
                <line
                  x1={guideLines.x}
                  y1="0"
                  x2={guideLines.x}
                  y2={canvasDimensions.height}
                  stroke="#06b6d4"
                  strokeWidth="1.5"
                  strokeDasharray="4,4"
                  className="animate-pulse"
                />
              )}
              {guideLines.y !== undefined && (
                <line
                  x1="0"
                  y1={guideLines.y}
                  x2={canvasDimensions.width}
                  y2={guideLines.y}
                  stroke="#06b6d4"
                  strokeWidth="1.5"
                  strokeDasharray="4,4"
                  className="animate-pulse"
                />
              )}

              {/* RENDER STATIONS / NODES */}
              {layout.nodes.map(node => {
                const isSelected = selectedElement?.type === 'NODE' && selectedElement.id === node.id;
                return (
                  <g 
                    key={node.id} 
                    transform={`translate(${node.x}, ${node.y})`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedElement({ type: 'NODE', id: node.id });
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      setSelectedElement({ type: 'NODE', id: node.id });
                      setDragAction({ mode: 'MOVE_ELEMENT', type: 'NODE', id: node.id });
                      const coords = getCanvasCoords(e.clientX, e.clientY);
                      setDragOffset({ x: coords.x - node.x, y: coords.y - node.y });
                    }}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      setEditingNodeModal(node);
                    }}
                    className="cursor-move"
                  >
                    <rect 
                      width={node.width} 
                      height={node.height} 
                      rx="16" 
                      fill="#070e1e" 
                      stroke={isSelected ? '#06b6d4' : '#1e293b'} 
                      strokeWidth={isSelected ? '3' : '1.5'}
                      filter={isSelected ? 'url(#glow-cyan)' : undefined}
                    />
                    <rect 
                      width={node.width} 
                      height="32" 
                      rx="14" 
                      fill={node.type === 'GI' ? '#881337' : node.type === 'PLTD' ? '#064e3b' : '#1e1b4b'} 
                    />
                    <text x="12" y="20" fill="#ffffff" fontSize="11" fontWeight="900" fontFamily="sans-serif">
                      {node.name} ({node.code})
                    </text>

                    {/* 8 RESIZE HANDLES AROUND NODE WHEN SELECTED */}
                    {isSelected && (
                      <g>
                        {/* Dimension readout tag */}
                        <rect
                          x={node.width / 2 - 35}
                          y={node.height + 6}
                          width="70"
                          height="16"
                          rx="4"
                          fill="#0f172a"
                          stroke="#06b6d4"
                          strokeWidth="1"
                        />
                        <text
                          x={node.width / 2}
                          y={node.height + 17}
                          fill="#67e8f9"
                          fontSize="9"
                          fontWeight="bold"
                          textAnchor="middle"
                          className="select-none pointer-events-none"
                        >
                          {node.width} × {node.height}
                        </text>

                        {/* NW Handle */}
                        <rect
                          x="-6"
                          y="-6"
                          width="12"
                          height="12"
                          rx="2"
                          fill="#06b6d4"
                          stroke="#ffffff"
                          strokeWidth="1.5"
                          className="cursor-nwse-resize"
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            setDragAction({
                              mode: 'RESIZE_NODE',
                              id: node.id,
                              handle: 'nw',
                              startX: node.x,
                              startY: node.y,
                              startW: node.width,
                              startH: node.height
                            });
                          }}
                        />
                        {/* N Handle */}
                        <rect
                          x={node.width / 2 - 8}
                          y="-5"
                          width="16"
                          height="10"
                          rx="2"
                          fill="#06b6d4"
                          stroke="#ffffff"
                          strokeWidth="1.5"
                          className="cursor-ns-resize"
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            setDragAction({
                              mode: 'RESIZE_NODE',
                              id: node.id,
                              handle: 'n',
                              startX: node.x,
                              startY: node.y,
                              startW: node.width,
                              startH: node.height
                            });
                          }}
                        />
                        {/* NE Handle */}
                        <rect
                          x={node.width - 6}
                          y="-6"
                          width="12"
                          height="12"
                          rx="2"
                          fill="#06b6d4"
                          stroke="#ffffff"
                          strokeWidth="1.5"
                          className="cursor-nesw-resize"
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            setDragAction({
                              mode: 'RESIZE_NODE',
                              id: node.id,
                              handle: 'ne',
                              startX: node.x,
                              startY: node.y,
                              startW: node.width,
                              startH: node.height
                            });
                          }}
                        />
                        {/* E Handle */}
                        <rect
                          x={node.width - 5}
                          y={node.height / 2 - 8}
                          width="10"
                          height="16"
                          rx="2"
                          fill="#06b6d4"
                          stroke="#ffffff"
                          strokeWidth="1.5"
                          className="cursor-ew-resize"
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            setDragAction({
                              mode: 'RESIZE_NODE',
                              id: node.id,
                              handle: 'e',
                              startX: node.x,
                              startY: node.y,
                              startW: node.width,
                              startH: node.height
                            });
                          }}
                        />
                        {/* SE Handle */}
                        <rect
                          x={node.width - 6}
                          y={node.height - 6}
                          width="12"
                          height="12"
                          rx="2"
                          fill="#06b6d4"
                          stroke="#ffffff"
                          strokeWidth="1.5"
                          className="cursor-nwse-resize"
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            setDragAction({
                              mode: 'RESIZE_NODE',
                              id: node.id,
                              handle: 'se',
                              startX: node.x,
                              startY: node.y,
                              startW: node.width,
                              startH: node.height
                            });
                          }}
                        />
                        {/* S Handle */}
                        <rect
                          x={node.width / 2 - 8}
                          y={node.height - 5}
                          width="16"
                          height="10"
                          rx="2"
                          fill="#06b6d4"
                          stroke="#ffffff"
                          strokeWidth="1.5"
                          className="cursor-ns-resize"
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            setDragAction({
                              mode: 'RESIZE_NODE',
                              id: node.id,
                              handle: 's',
                              startX: node.x,
                              startY: node.y,
                              startW: node.width,
                              startH: node.height
                            });
                          }}
                        />
                        {/* SW Handle */}
                        <rect
                          x="-6"
                          y={node.height - 6}
                          width="12"
                          height="12"
                          rx="2"
                          fill="#06b6d4"
                          stroke="#ffffff"
                          strokeWidth="1.5"
                          className="cursor-nesw-resize"
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            setDragAction({
                              mode: 'RESIZE_NODE',
                              id: node.id,
                              handle: 'sw',
                              startX: node.x,
                              startY: node.y,
                              startW: node.width,
                              startH: node.height
                            });
                          }}
                        />
                        {/* W Handle */}
                        <rect
                          x="-5"
                          y={node.height / 2 - 8}
                          width="10"
                          height="16"
                          rx="2"
                          fill="#06b6d4"
                          stroke="#ffffff"
                          strokeWidth="1.5"
                          className="cursor-ew-resize"
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            setDragAction({
                              mode: 'RESIZE_NODE',
                              id: node.id,
                              handle: 'w',
                              startX: node.x,
                              startY: node.y,
                              startW: node.width,
                              startH: node.height
                            });
                          }}
                        />
                      </g>
                    )}
                  </g>
                );
              })}

            {/* RENDER LINES / CONNECTORS (TARIK PANJANG / PENDEK KABEL/JARINGAN) */}
            {layout.lines.map(line => {
              const isSelected = selectedElement?.type === 'LINE' && selectedElement.id === line.id;
              const isKopelLine = line.type === 'BUS_KOPEL';
              const lineThickness = line.strokeWidth || (line.type === 'SUTT_150KV' ? 4 : isKopelLine ? 4.5 : 3);
              const lineLen = Math.round(Math.hypot(line.x2 - line.x1, line.y2 - line.y1));

              return (
                <g 
                  key={line.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedElement({ type: 'LINE', id: line.id });
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setSelectedElement({ type: 'LINE', id: line.id });
                    setDragAction({ mode: 'MOVE_ELEMENT', type: 'LINE', id: line.id });
                    const coords = getCanvasCoords(e.clientX, e.clientY);
                    setDragOffset({ x: coords.x - line.x1, y: coords.y - line.y1 });
                  }}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    setEditingLineModal(line);
                  }}
                  className="cursor-pointer group"
                >
                  {/* Selection / Glow underlay */}
                  <line
                    x1={line.x1}
                    y1={line.y1}
                    x2={line.x2}
                    y2={line.y2}
                    stroke={isSelected ? '#38bdf8' : isKopelLine ? '#06b6d4' : line.color}
                    strokeWidth={isSelected ? '12' : isKopelLine ? '7' : '5'}
                    strokeOpacity={isSelected ? '0.7' : isKopelLine ? '0.5' : '0.2'}
                  />

                  {/* Main Conductor Line */}
                  <line
                    x1={line.x1}
                    y1={line.y1}
                    x2={line.x2}
                    y2={line.y2}
                    stroke={line.color}
                    strokeWidth={lineThickness}
                    strokeDasharray={line.style === 'DASHED' ? '6,6' : undefined}
                    filter={line.type === 'SUTT_150KV' ? 'url(#glow-rose)' : isKopelLine ? 'url(#glow-cyan)' : undefined}
                  />

                  {/* Terminal Node End Dots */}
                  <circle cx={line.x1} cy={line.y1} r={isSelected ? 4 : 3} fill={line.color} />
                  <circle cx={line.x2} cy={line.y2} r={isSelected ? 4 : 3} fill={line.color} />

                  <text
                    x={(line.x1 + line.x2) / 2}
                    y={(line.y1 + line.y2) / 2 - 8}
                    fill="#e2e8f0"
                    fontSize="9"
                    fontWeight="800"
                    textAnchor="middle"
                    className="bg-slate-950 px-1 select-none pointer-events-none"
                  >
                    {line.name}
                  </text>

                  {/* INTERACTIVE RESIZE ENDPOINTS (TARIK PANJANG / PENDEK) */}
                  {isSelected && (
                    <g>
                      {/* Length readout badge */}
                      <rect
                        x={(line.x1 + line.x2) / 2 - 25}
                        y={(line.y1 + line.y2) / 2 + 6}
                        width="50"
                        height="15"
                        rx="4"
                        fill="#020617"
                        stroke="#38bdf8"
                        strokeWidth="1"
                      />
                      <text
                        x={(line.x1 + line.x2) / 2}
                        y={(line.y1 + line.y2) / 2 + 17}
                        fill="#38bdf8"
                        fontSize="9"
                        fontWeight="900"
                        textAnchor="middle"
                        className="select-none pointer-events-none"
                      >
                        {lineLen}px
                      </text>

                      {/* Start handle (Pangkal Garis) */}
                      <circle
                        cx={line.x1}
                        cy={line.y1}
                        r="8"
                        fill="#06b6d4"
                        stroke="#ffffff"
                        strokeWidth="2"
                        className="cursor-crosshair animate-pulse"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          setDragAction({ mode: 'RESIZE_LINE_START', id: line.id });
                        }}
                      />

                      {/* End handle (Ujung Garis) */}
                      <circle
                        cx={line.x2}
                        cy={line.y2}
                        r="8"
                        fill="#f43f5e"
                        stroke="#ffffff"
                        strokeWidth="2"
                        className="cursor-crosshair animate-pulse"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          setDragAction({ mode: 'RESIZE_LINE_END', id: line.id });
                        }}
                      />
                    </g>
                  )}
                </g>
              );
            })}

            {/* DRAWING LINE PREVIEW */}
            {drawingLineStart && (
              <line
                x1={drawingLineStart.x}
                y1={drawingLineStart.y}
                x2={mousePos.x}
                y2={mousePos.y}
                stroke="#f43f5e"
                strokeWidth="3"
                strokeDasharray="4,4"
                className="animate-pulse"
              />
            )}

            {/* 🔴 RENDER BUSBARS AS DISTINCTIVE ELECTRICAL CONDUCTOR BARS (BATANG REL GARIS DENGAN RESIZE HANDLES) */}
            {layout.busbars.map(bus => {
              const isSelected = selectedElement?.type === 'BUSBAR' && selectedElement.id === bus.id;
              const isHoriz = bus.orientation === 'HORIZONTAL';
              const x2 = isHoriz ? bus.x + bus.length : bus.x;
              const y2 = isHoriz ? bus.y : bus.y + bus.length;
              const is150kV = bus.voltageKv >= 150;
              const busThickness = bus.thickness || 8;

              return (
                <g
                  key={bus.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedElement({ type: 'BUSBAR', id: bus.id });
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setSelectedElement({ type: 'BUSBAR', id: bus.id });
                    setDragAction({ mode: 'MOVE_ELEMENT', type: 'BUSBAR', id: bus.id });
                    const coords = getCanvasCoords(e.clientX, e.clientY);
                    setDragOffset({ x: coords.x - bus.x, y: coords.y - bus.y });
                  }}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    setEditingBusbarModal(bus);
                  }}
                  className="cursor-move group"
                >
                  {/* 1. Outer Glow Aura */}
                  <line
                    x1={bus.x}
                    y1={bus.y}
                    x2={x2}
                    y2={y2}
                    stroke={bus.color}
                    strokeWidth={isSelected ? `${busThickness + 8}` : `${busThickness + 4}`}
                    strokeLinecap="round"
                    strokeOpacity="0.4"
                    filter={is150kV ? 'url(#glow-rose)' : 'url(#glow-cyan)'}
                  />

                  {/* 2. Main High-Voltage Heavy Solid Conductor Line */}
                  <line
                    x1={bus.x}
                    y1={bus.y}
                    x2={x2}
                    y2={y2}
                    stroke={bus.color}
                    strokeWidth={busThickness}
                    strokeLinecap="round"
                  />

                  {/* 3. Inner Metallic Core Highlight */}
                  <line
                    x1={bus.x}
                    y1={bus.y}
                    x2={x2}
                    y2={y2}
                    stroke="#ffffff"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeOpacity="0.8"
                  />

                  {/* 4. Terminal Connection End-Caps */}
                  <circle cx={bus.x} cy={bus.y} r="5" fill="#ffffff" stroke={bus.color} strokeWidth="2" />
                  <circle cx={x2} cy={y2} r="5" fill="#ffffff" stroke={bus.color} strokeWidth="2" />

                  {/* 5. Terminal Node Dots along the busbar at 40px intervals */}
                  {Array.from({ length: Math.floor(bus.length / 40) }).map((_, idx) => {
                    const dotX = isHoriz ? bus.x + (idx + 1) * 40 : bus.x;
                    const dotY = isHoriz ? bus.y : bus.y + (idx + 1) * 40;
                    if ((isHoriz && dotX < x2) || (!isHoriz && dotY < y2)) {
                      return (
                        <circle
                          key={idx}
                          cx={dotX}
                          cy={dotY}
                          r="2.5"
                          fill="#0f172a"
                          stroke={bus.color}
                          strokeWidth="1.5"
                        />
                      );
                    }
                    return null;
                  })}

                  {/* 6. Integrated Voltage Badge & Bus Name Tag */}
                  <rect
                    x={bus.x}
                    y={bus.y - 24}
                    width={bus.name.length * 6.5 + 24}
                    height="18"
                    rx="5"
                    fill="#020617"
                    stroke={isSelected ? '#38bdf8' : bus.color}
                    strokeWidth="1.5"
                    className="shadow-lg"
                  />
                  <text
                    x={bus.x + 8}
                    y={bus.y - 11}
                    fill="#ffffff"
                    fontSize="9.5"
                    fontWeight="900"
                    fontFamily="sans-serif"
                  >
                    ⚡ {bus.name} ({bus.voltageKv}kV)
                  </text>

                  {/* 7. RESIZE HANDLES FOR BUSBAR (TARIK PANJANG / PENDEK REL) */}
                  {isSelected && (
                    <g>
                      {/* Length info badge */}
                      <rect
                        x={(bus.x + x2) / 2 - 25}
                        y={(bus.y + y2) / 2 + 10}
                        width="50"
                        height="16"
                        rx="4"
                        fill="#020617"
                        stroke="#f59e0b"
                        strokeWidth="1"
                      />
                      <text
                        x={(bus.x + x2) / 2}
                        y={(bus.y + y2) / 2 + 22}
                        fill="#fbbf24"
                        fontSize="9"
                        fontWeight="900"
                        textAnchor="middle"
                        className="select-none pointer-events-none"
                      >
                        {bus.length}px
                      </text>

                      {/* Start handle */}
                      <rect
                        x={bus.x - 7}
                        y={bus.y - 7}
                        width="14"
                        height="14"
                        rx="3"
                        fill="#f59e0b"
                        stroke="#ffffff"
                        strokeWidth="2"
                        className={isHoriz ? 'cursor-ew-resize' : 'cursor-ns-resize'}
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          setDragAction({ mode: 'RESIZE_BUSBAR_START', id: bus.id });
                        }}
                      />

                      {/* End handle */}
                      <rect
                        x={x2 - 7}
                        y={y2 - 7}
                        width="14"
                        height="14"
                        rx="3"
                        fill="#10b981"
                        stroke="#ffffff"
                        strokeWidth="2"
                        className={isHoriz ? 'cursor-ew-resize' : 'cursor-ns-resize'}
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          setDragAction({ mode: 'RESIZE_BUSBAR_END', id: bus.id });
                        }}
                      />
                    </g>
                  )}
                </g>
              );
            })}

            {/* RENDER ALL ELECTRICAL DEVICES (INCOMING, OUTGOING, COUPLING, LBS, RECLOSER, PMCB, FCO, DS, TRAFO, BREAKER) */}
            {layout.devices.map(dev => {
              const isSelected = selectedElement?.type === 'DEVICE' && selectedElement.id === dev.id;
              const isClosed = dev.status === 'CLOSED';
              const devScale = dev.scale || 1.0;

              return (
                <g
                  key={dev.id}
                  transform={`translate(${dev.x}, ${dev.y}) scale(${devScale})`}
                  onClick={(e) => {
                    e.stopPropagation();
                    // Toggle status
                    const nextStatus = isClosed ? 'TRIP' : 'CLOSED';
                    saveCurrentLayout({
                      ...layout,
                      devices: layout.devices.map(d => d.id === dev.id ? { ...d, status: nextStatus } : d)
                    });
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setSelectedElement({ type: 'DEVICE', id: dev.id });
                    setDragAction({ mode: 'MOVE_ELEMENT', type: 'DEVICE', id: dev.id });
                    const coords = getCanvasCoords(e.clientX, e.clientY);
                    setDragOffset({ x: coords.x - dev.x, y: coords.y - dev.y });
                  }}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    setEditingDeviceModal(dev);
                  }}
                  className="cursor-pointer group"
                >
                  {/* Selection highlight box & scale handle */}
                  {isSelected && (
                    <g>
                      <rect
                        x="-24"
                        y="-24"
                        width="48"
                        height="48"
                        rx="8"
                        fill="none"
                        stroke="#38bdf8"
                        strokeWidth="1.5"
                        strokeDasharray="3,3"
                      />
                      {/* Scale Resize Corner Handle */}
                      <circle
                        cx="24"
                        cy="24"
                        r="6"
                        fill="#38bdf8"
                        stroke="#ffffff"
                        strokeWidth="1.5"
                        className="cursor-nwse-resize"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          const coords = getCanvasCoords(e.clientX, e.clientY);
                          setDragAction({
                            mode: 'RESIZE_DEVICE',
                            id: dev.id,
                            centerX: dev.x,
                            centerY: dev.y,
                            startDist: Math.hypot(coords.x - dev.x, coords.y - dev.y) || 1,
                            startScale: devScale
                          });
                        }}
                      />
                    </g>
                  )}

                  {/* 1. TRAFO SYMBOL (DUAL INTERLOCKING WINDING COILS) */}
                  {dev.type === 'TRAFO' && (
                    <g>
                      <circle cx="0" cy="-10" r="14" fill="none" stroke="#818cf8" strokeWidth="2.5" />
                      <circle cx="0" cy="10" r="14" fill="none" stroke="#818cf8" strokeWidth="2.5" />
                      <text x="0" y="32" fill="#c7d2fe" fontSize="8.5" fontWeight="900" textAnchor="middle">{dev.code}</text>
                    </g>
                  )}

                  {/* 2. COUPLING BREAKER / PMT KOPEL (DEDICATED BUSBAR TIE WITH GARIS PENYAMBUNG) */}
                  {dev.type === 'COUPLING' && (
                    <g>
                      {/* Connecting Line Stubs (Garis Penyambung Kiri-Kanan) */}
                      <line x1="-24" y1="0" x2="-16" y2="0" stroke={isClosed ? '#06b6d4' : '#64748b'} strokeWidth="3" />
                      <line x1="16" y1="0" x2="24" y2="0" stroke={isClosed ? '#06b6d4' : '#64748b'} strokeWidth="3" />
                      
                      {/* Coupling Box */}
                      <rect 
                        x="-16" 
                        y="-16" 
                        width="32" 
                        height="32" 
                        rx="8" 
                        fill={isClosed ? '#0e7490' : '#1e293b'} 
                        stroke={isSelected ? '#38bdf8' : isClosed ? '#22d3ee' : '#f59e0b'} 
                        strokeWidth="2.5" 
                        filter={isClosed ? 'url(#glow-cyan)' : undefined}
                      />

                      {/* Bus Tie Arrow Indicators ↔ */}
                      <text x="0" y="-3" fill="#ffffff" fontSize="8" fontWeight="900" textAnchor="middle">
                        ⟷
                      </text>
                      <text x="0" y="8" fill="#ffffff" fontSize="9" fontWeight="900" textAnchor="middle">
                        {isClosed ? 'KOPEL' : 'OPEN'}
                      </text>
                      <text x="0" y="26" fill="#67e8f9" fontSize="8" fontWeight="800" textAnchor="middle">{dev.code}</text>
                    </g>
                  )}

                  {/* 3. DS (DISCONNECTING SWITCH / PEMISAH) */}
                  {dev.type === 'DS' && (
                    <g>
                      <rect x="-14" y="-14" width="28" height="28" rx="6" fill="#14121a" stroke={isSelected ? '#38bdf8' : '#f59e0b'} strokeWidth="1.5" />
                      <circle cx="-8" cy="0" r="2.5" fill="#f59e0b" />
                      <circle cx="8" cy="0" r="2.5" fill="#f59e0b" />
                      {isClosed ? (
                        <line x1="-8" y1="0" x2="8" y2="0" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
                      ) : (
                        <line x1="-8" y1="0" x2="4" y2="-8" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />
                      )}
                      <text x="0" y="24" fill="#fbbf24" fontSize="8" fontWeight="800" textAnchor="middle">{dev.code}</text>
                    </g>
                  )}

                  {/* 4. LBS (LOAD BREAK SWITCH) */}
                  {dev.type === 'LBS' && (
                    <g>
                      <rect x="-16" y="-16" width="32" height="32" rx="8" fill="#0c172e" stroke={isSelected ? '#38bdf8' : '#3b82f6'} strokeWidth="2" />
                      <circle cx="-9" cy="0" r="2.5" fill="#60a5fa" />
                      <circle cx="9" cy="0" r="2.5" fill="#60a5fa" />
                      {isClosed ? (
                        <line x1="-9" y1="0" x2="9" y2="0" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" />
                      ) : (
                        <line x1="-9" y1="0" x2="5" y2="-9" stroke="#f43f5e" strokeWidth="3" strokeLinecap="round" />
                      )}
                      <text x="0" y="26" fill="#93c5fd" fontSize="8" fontWeight="800" textAnchor="middle">{dev.code}</text>
                    </g>
                  )}

                  {/* 5. RECLOSER (AUTOMATIC CIRCUIT RECLOSER) */}
                  {dev.type === 'RECLOSER' && (
                    <g>
                      <rect x="-16" y="-16" width="32" height="32" rx="8" fill={isClosed ? '#e11d48' : '#1e293b'} stroke={isSelected ? '#38bdf8' : '#fbbf24'} strokeWidth="2" />
                      <text x="0" y="4" fill="#ffffff" fontSize="10" fontWeight="900" textAnchor="middle">
                        {isClosed ? 'REC' : 'TRIP'}
                      </text>
                      <text x="0" y="26" fill="#fde68a" fontSize="8" fontWeight="800" textAnchor="middle">{dev.code}</text>
                    </g>
                  )}

                  {/* 6. PMCB (POLE MOUNTED CIRCUIT BREAKER) */}
                  {dev.type === 'PMCB' && (
                    <g>
                      <rect x="-16" y="-16" width="32" height="32" rx="8" fill={isClosed ? '#7e22ce' : '#1e293b'} stroke={isSelected ? '#38bdf8' : '#c084fc'} strokeWidth="2" />
                      <text x="0" y="4" fill="#ffffff" fontSize="9" fontWeight="900" textAnchor="middle">
                        {isClosed ? 'PMCB' : 'TRIP'}
                      </text>
                      <text x="0" y="26" fill="#e9d5ff" fontSize="8" fontWeight="800" textAnchor="middle">{dev.code}</text>
                    </g>
                  )}

                  {/* 7. FCO (FUSE CUT OUT) */}
                  {dev.type === 'FCO' && (
                    <g>
                      <rect x="-14" y="-14" width="28" height="28" rx="6" fill="#064e3b" stroke={isSelected ? '#38bdf8' : '#34d399'} strokeWidth="1.5" />
                      {isClosed ? (
                        <line x1="0" y1="-9" x2="0" y2="9" stroke="#10b981" strokeWidth="3" strokeLinecap="round" />
                      ) : (
                        <line x1="0" y1="9" x2="8" y2="-4" stroke="#f43f5e" strokeWidth="3" strokeLinecap="round" />
                      )}
                      <text x="0" y="24" fill="#6ee7b7" fontSize="8" fontWeight="800" textAnchor="middle">{dev.code}</text>
                    </g>
                  )}

                  {/* 8. INCOMING */}
                  {dev.type === 'INCOMING' && (
                    <g>
                      <rect x="-16" y="-16" width="32" height="32" rx="6" fill={isClosed ? '#0e7490' : '#1e293b'} stroke={isSelected ? '#38bdf8' : '#22d3ee'} strokeWidth="2" />
                      <text x="0" y="4" fill="#ffffff" fontSize="9" fontWeight="900" textAnchor="middle">
                        {isClosed ? 'INC' : 'OPEN'}
                      </text>
                      <text x="0" y="26" fill="#a5f3fc" fontSize="8" fontWeight="800" textAnchor="middle">{dev.code}</text>
                    </g>
                  )}

                  {/* 9. OUTGOING */}
                  {dev.type === 'OUTGOING' && (
                    <g>
                      <rect x="-16" y="-16" width="32" height="32" rx="6" fill={isClosed ? '#be123c' : '#1e293b'} stroke={isSelected ? '#38bdf8' : '#fda4af'} strokeWidth="2" />
                      <text x="0" y="4" fill="#ffffff" fontSize="9" fontWeight="900" textAnchor="middle">
                        {isClosed ? 'OUT' : 'TRIP'}
                      </text>
                      <text x="0" y="26" fill="#fecdd3" fontSize="8" fontWeight="800" textAnchor="middle">{dev.code}</text>
                    </g>
                  )}

                  {/* 10. STANDARD BREAKER */}
                  {dev.type === 'BREAKER' && (
                    <g>
                      <rect x="-12" y="-12" width="24" height="24" rx="6" fill={isClosed ? '#e11d48' : '#1e293b'} stroke={isSelected ? '#38bdf8' : '#fb7185'} strokeWidth="2" />
                      <text x="0" y="4" fill="#ffffff" fontSize="10" fontWeight="900" textAnchor="middle">
                        {isClosed ? 'C' : 'O'}
                      </text>
                      <text x="0" y="24" fill="#cbd5e1" fontSize="8" fontWeight="800" textAnchor="middle">{dev.code}</text>
                    </g>
                  )}
                </g>
              );
            })}

          </svg>
          </div>

        </div>

      </div>

      {/* 4. BUSBAR PROPERTIES EDIT MODAL */}
      {editingBusbarModal && (
        <div className="fixed inset-0 z-[999999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#081224] border border-cyan-500/50 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <Sliders className="w-5 h-5 text-amber-400" />
              <span>Edit Properti Batang Rel Busbar</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 font-bold block mb-1">Nama Busbar:</label>
                <input
                  type="text"
                  value={editingBusbarModal.name}
                  onChange={(e) => setEditingBusbarModal({ ...editingBusbarModal, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-bold"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-400 font-bold block mb-1">Tegangan (kV):</label>
                  <select
                    value={editingBusbarModal.voltageKv}
                    onChange={(e) => setEditingBusbarModal({ ...editingBusbarModal, voltageKv: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-bold"
                  >
                    <option value={20}>20 kV (Distribusi)</option>
                    <option value={150}>150 kV (Transmisi SUTT)</option>
                    <option value={70}>70 kV</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 font-bold block mb-1">Panjang (px):</label>
                  <input
                    type="number"
                    value={editingBusbarModal.length}
                    onChange={(e) => setEditingBusbarModal({ ...editingBusbarModal, length: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-bold"
                  />
                </div>

                <div>
                  <label className="text-slate-400 font-bold block mb-1">Ketebalan Rel (px):</label>
                  <input
                    type="number"
                    min="4"
                    max="32"
                    value={editingBusbarModal.thickness || 8}
                    onChange={(e) => setEditingBusbarModal({ ...editingBusbarModal, thickness: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-bold block mb-1">Orientasi Batang:</label>
                  <select
                    value={editingBusbarModal.orientation}
                    onChange={(e) => setEditingBusbarModal({ ...editingBusbarModal, orientation: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-bold"
                  >
                    <option value="HORIZONTAL">Horizontal ↔ (Mendatar)</option>
                    <option value="VERTICAL">Vertical ↕ (Tegak)</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 font-bold block mb-1">Warna Batang Rel:</label>
                  <input
                    type="color"
                    value={editingBusbarModal.color}
                    onChange={(e) => setEditingBusbarModal({ ...editingBusbarModal, color: e.target.value })}
                    className="w-full h-9 bg-slate-950 border border-slate-700 rounded-lg p-1 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setEditingBusbarModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-slate-300 font-bold text-xs"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  saveCurrentLayout({
                    ...layout,
                    busbars: layout.busbars.map(b => b.id === editingBusbarModal.id ? editingBusbarModal : b)
                  });
                  setEditingBusbarModal(null);
                }}
                className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-black text-xs"
              >
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. DEVICE EDIT MODAL (FOR INCOMING, OUTGOING, COUPLING, LBS, RECLOSER, PMCB, FCO, DS, TRAFO, BREAKER) */}
      {editingDeviceModal && (
        <div className="fixed inset-0 z-[999999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#081224] border border-cyan-500/50 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-cyan-400" />
              <span>Edit Properti Peralatan ({editingDeviceModal.type})</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 font-bold block mb-1">Tipe Komponen:</label>
                <select
                  value={editingDeviceModal.type}
                  onChange={(e) => setEditingDeviceModal({ ...editingDeviceModal, type: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-bold"
                >
                  <option value="INCOMING">INCOMING - PMT Incoming</option>
                  <option value="OUTGOING">OUTGOING - PMT Outgoing</option>
                  <option value="COUPLING">COUPLING - PMT Kopel Busbar</option>
                  <option value="LBS">LBS - Load Break Switch</option>
                  <option value="RECLOSER">RECLOSER - Auto Circuit Recloser</option>
                  <option value="PMCB">PMCB - Pole Mounted Breaker</option>
                  <option value="FCO">FCO - Fuse Cut Out</option>
                  <option value="DS">DS - Disconnecting Switch (Pemisah)</option>
                  <option value="TRAFO">TRAFO - Transformer Step Down</option>
                  <option value="BREAKER">BREAKER - Sakelar Standar</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1">Nama Peralatan:</label>
                <input
                  type="text"
                  value={editingDeviceModal.name}
                  onChange={(e) => setEditingDeviceModal({ ...editingDeviceModal, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-bold"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-400 font-bold block mb-1">Kode Tag:</label>
                  <input
                    type="text"
                    value={editingDeviceModal.code}
                    onChange={(e) => setEditingDeviceModal({ ...editingDeviceModal, code: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-bold"
                  />
                </div>

                <div>
                  <label className="text-slate-400 font-bold block mb-1">Skala / Ukuran:</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.4"
                    max="4.0"
                    value={editingDeviceModal.scale || 1.0}
                    onChange={(e) => setEditingDeviceModal({ ...editingDeviceModal, scale: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-bold"
                  />
                </div>

                <div>
                  <label className="text-slate-400 font-bold block mb-1">Status Sakelar:</label>
                  <select
                    value={editingDeviceModal.status}
                    onChange={(e) => setEditingDeviceModal({ ...editingDeviceModal, status: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-bold"
                  >
                    <option value="CLOSED">CLOSED (Tutup / Normal)</option>
                    <option value="TRIP">TRIP (Padam / Gangguan)</option>
                    <option value="OPEN">OPEN (Buka Manual)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setEditingDeviceModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-slate-300 font-bold text-xs"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  saveCurrentLayout({
                    ...layout,
                    devices: layout.devices.map(d => d.id === editingDeviceModal.id ? editingDeviceModal : d)
                  });
                  setEditingDeviceModal(null);
                }}
                className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-black text-xs"
              >
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. LINE PROPERTIES EDIT MODAL */}
      {editingLineModal && (
        <div className="fixed inset-0 z-[999999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#081224] border border-rose-500/50 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <GitCommit className="w-5 h-5 text-rose-400" />
              <span>Edit Properti Garis Transmisi / Kabel / Kopel</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 font-bold block mb-1">Nama Garis Connection:</label>
                <input
                  type="text"
                  value={editingLineModal.name}
                  onChange={(e) => setEditingLineModal({ ...editingLineModal, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-bold"
                />
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1">Tipe Garis:</label>
                <select
                  value={editingLineModal.type}
                  onChange={(e) => setEditingLineModal({ ...editingLineModal, type: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-bold"
                >
                  <option value="SUTT_150KV">SUTT 150kV High Voltage</option>
                  <option value="SKTT_20KV">SKTT 20kV Cable</option>
                  <option value="TIE_LINE_20KV">20kV Tie-Line Interkoneksi</option>
                  <option value="FEEDER_LINE">Penyulang Outgoing</option>
                  <option value="BUS_KOPEL">Garis Kopel Busbar Link</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-bold block mb-1">Gaya Line:</label>
                  <select
                    value={editingLineModal.style}
                    onChange={(e) => setEditingLineModal({ ...editingLineModal, style: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-bold"
                  >
                    <option value="SOLID">Solid Line (Lurus Utuh)</option>
                    <option value="DASHED">Dashed Line (Putus-putus)</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 font-bold block mb-1">Ketebalan Garis (px):</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={editingLineModal.strokeWidth || 3}
                    onChange={(e) => setEditingLineModal({ ...editingLineModal, strokeWidth: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1">Warna Garis:</label>
                <input
                  type="color"
                  value={editingLineModal.color}
                  onChange={(e) => setEditingLineModal({ ...editingLineModal, color: e.target.value })}
                  className="w-full h-9 bg-slate-950 border border-slate-700 rounded-lg p-1 cursor-pointer"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setEditingLineModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-slate-300 font-bold text-xs"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  saveCurrentLayout({
                    ...layout,
                    lines: layout.lines.map(l => l.id === editingLineModal.id ? editingLineModal : l)
                  });
                  setEditingLineModal(null);
                }}
                className="px-4 py-2 rounded-xl bg-rose-500 text-white font-black text-xs"
              >
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. NODE / SUBSTATION EDIT MODAL */}
      {editingNodeModal && (
        <div className="fixed inset-0 z-[999999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#081224] border border-emerald-500/50 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-400" />
              <span>Edit Blok Gardu Induk / PLTD / GH</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 font-bold block mb-1">Nama Substation / Gardu:</label>
                <input
                  type="text"
                  value={editingNodeModal.name}
                  onChange={(e) => setEditingNodeModal({ ...editingNodeModal, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-bold block mb-1">Kode Singkatan:</label>
                  <input
                    type="text"
                    value={editingNodeModal.code}
                    onChange={(e) => setEditingNodeModal({ ...editingNodeModal, code: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-bold"
                  />
                </div>

                <div>
                  <label className="text-slate-400 font-bold block mb-1">Tipe Stasiun:</label>
                  <select
                    value={editingNodeModal.type}
                    onChange={(e) => setEditingNodeModal({ ...editingNodeModal, type: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-bold"
                  >
                    <option value="GI">GI (Gardu Induk)</option>
                    <option value="PLTD">PLTD / Power Plant</option>
                    <option value="GH">GH (Gardu Hubung)</option>
                    <option value="SUBSTATION">Substation Biasa</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-bold block mb-1">Lebar Kotak (px):</label>
                  <input
                    type="number"
                    value={editingNodeModal.width}
                    onChange={(e) => setEditingNodeModal({ ...editingNodeModal, width: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-bold"
                  />
                </div>

                <div>
                  <label className="text-slate-400 font-bold block mb-1">Tinggi Kotak (px):</label>
                  <input
                    type="number"
                    value={editingNodeModal.height}
                    onChange={(e) => setEditingNodeModal({ ...editingNodeModal, height: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-bold"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setEditingNodeModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-slate-300 font-bold text-xs"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  saveCurrentLayout({
                    ...layout,
                    nodes: layout.nodes.map(n => n.id === editingNodeModal.id ? editingNodeModal : n)
                  });
                  setEditingNodeModal(null);
                }}
                className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs"
              >
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

// Helper SVG icon for Shield Check
function ShieldCheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
