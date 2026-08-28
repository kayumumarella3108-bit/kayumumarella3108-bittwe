import React, { useState, useEffect, useMemo } from 'react';
import { db, doc, onSnapshot, setDoc, OperationType, handleFirestoreError, collection } from '../../lib/firebase';
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
  Unlink,
  Server,
  PlusCircle,
  HelpCircle,
  Trash,
  SlidersHorizontal,
  Power,
  Layers,
  ChevronDown,
  LayoutGrid
} from 'lucide-react';
import { INITIAL_PENYULANG } from '../../data/mockData';

// Interfaces for DCC State
export interface DownstreamNode {
  id: string;
  name: string;
  type: 'GH' | 'LBS' | 'RECLOSER' | 'PMCB' | 'CO' | 'DS';
  status: 'CLOSED' | 'TRIP';
  loopSourceFeederId?: string;
  children?: DownstreamNode[];
}

export interface StationBus {
  id: string;
  name: string;
  voltageKv: number;
  incomerBreakerStatus: 'CLOSED' | 'TRIP';
  incomerName: string; // e.g., "Trafo 1 (60MVA)", "Generator G1", etc.
}

export interface StationFeeder {
  id: string;
  busId: string;
  code: string;
  name: string;
  status: 'CLOSED' | 'TRIP'; // Feeder breaker status
  currentA: number;
  powerMw: number;
  voltageKv: number;
  cosPhi: number;
}

export interface StationConfig {
  id: string;
  name: string;
  type: 'GI' | 'PLTD' | 'GH';
  buses: StationBus[];
  feeders: StationFeeder[];
  pmtKopelStatus: 'CLOSED' | 'TRIP';
  downstreamNodes: Record<string, DownstreamNode[]>;
}

export interface DccConfigState {
  activeStationId: string;
  stations: Record<string, StationConfig>;
  telemetryOn: boolean;
}

// Tree helper functions for recursive JTM equipment
export const addNodeToTree = (nodes: DownstreamNode[], parentId: string, newNode: DownstreamNode): boolean => {
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i].id === parentId) {
      if (!nodes[i].children) {
        nodes[i].children = [];
      }
      nodes[i].children!.push(newNode);
      return true;
    }
    if (nodes[i].children && nodes[i].children.length > 0) {
      const success = addNodeToTree(nodes[i].children, parentId, newNode);
      if (success) return true;
    }
  }
  return false;
};

export const toggleNodeInTree = (nodes: DownstreamNode[], id: string): boolean => {
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i].id === id) {
      nodes[i].status = nodes[i].status === 'CLOSED' ? 'TRIP' : 'CLOSED';
      return true;
    }
    if (nodes[i].children && nodes[i].children.length > 0) {
      const success = toggleNodeInTree(nodes[i].children, id);
      if (success) return true;
    }
  }
  return false;
};

export const deleteNodeFromTree = (nodes: DownstreamNode[], id: string): boolean => {
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i].id === id) {
      nodes.splice(i, 1);
      return true;
    }
    if (nodes[i].children && nodes[i].children.length > 0) {
      const success = deleteNodeFromTree(nodes[i].children, id);
      if (success) return true;
    }
  }
  return false;
};

export const updateNodeInTree = (
  nodes: DownstreamNode[], 
  id: string, 
  updatedFields: Partial<DownstreamNode>
): boolean => {
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i].id === id) {
      nodes[i] = { ...nodes[i], ...updatedFields };
      return true;
    }
    if (nodes[i].children && nodes[i].children.length > 0) {
      const success = updateNodeInTree(nodes[i].children, id, updatedFields);
      if (success) return true;
    }
  }
  return false;
};

export interface ActiveLoopLoad {
  nodeId: string;
  nodeName: string;
  originalFeederId: string;
  originalFeederName: string;
  loadA: number;
}

export const getActiveLoopedNodesForFeeder = (
  station: StationConfig, 
  feederId: string,
  busEnergizedMap: Record<string, boolean>,
  operationMode: 'RADIAL' | 'LOOP' = 'LOOP'
): ActiveLoopLoad[] => {
  const results: ActiveLoopLoad[] = [];
  if (operationMode === 'RADIAL') return results;
  if (!station || !station.downstreamNodes) return results;

  // Helper to check if a specific feeder itself is active (energized & CLOSED)
  const isFeederFullyActive = (fId: string): boolean => {
    const fdr = station.feeders.find(f => f.id === fId);
    if (!fdr) return false;
    const connectedBus = station.buses.find(b => b.id === fdr.busId);
    const isBusActive = connectedBus && busEnergizedMap[connectedBus.id];
    return !!(isBusActive && fdr.status === 'CLOSED');
  };

  // Traverses nodes recursively to check which are powered by the alternative loop source
  const traverse = (
    nodes: DownstreamNode[], 
    isParentPathActive: boolean, 
    fdrId: string,
    originalFeederName: string
  ) => {
    let runningFlowActive = isParentPathActive;
    nodes.forEach(node => {
      const isLoopConfigured = node.loopSourceFeederId === feederId;
      const isLoopActive = isLoopConfigured && isFeederFullyActive(feederId);
      
      const incomingLineActive = runningFlowActive || !!isLoopActive;
      const isNodeActive = incomingLineActive && node.status === 'CLOSED';

      // If it is active via the loop source and NOT via its parent path
      if (isNodeActive && !runningFlowActive && isLoopConfigured) {
        results.push({
          nodeId: node.id,
          nodeName: node.name,
          originalFeederId: fdrId,
          originalFeederName,
          loadA: 25 // standard simulated load per looped equipment segment
        });
      }

      if (node.children && node.children.length > 0) {
        traverse(node.children, isNodeActive, fdrId, originalFeederName);
      }
      runningFlowActive = isNodeActive;
    });
  };

  // Check all other feeders to see if they have nodes looping into our target feederId
  station.feeders.forEach(f => {
    if (f.id === feederId) return; // skip own feeder
    const nodes = station.downstreamNodes[f.id] || [];
    traverse(nodes, isFeederFullyActive(f.id), f.id, f.name);
  });

  return results;
};

// Pristine default stations matching realistic systems in Indonesia
const DEFAULT_STATIONS: Record<string, StationConfig> = {
  'gandul': {
    id: 'gandul',
    name: 'GI GANDUL 150/20kV',
    type: 'GI',
    buses: [
      { id: 'bus_gandul_a', name: 'BUS 20kV - A', voltageKv: 20.04, incomerBreakerStatus: 'CLOSED', incomerName: 'Trafo Daya 1 (60 MVA)' },
      { id: 'bus_gandul_b', name: 'BUS 20kV - B', voltageKv: 20.00, incomerBreakerStatus: 'CLOSED', incomerName: 'Trafo Daya 2 (60 MVA)' }
    ],
    feeders: [
      { id: 'fed_gandul_1', busId: 'bus_gandul_a', code: 'F-01', name: 'Penyulang Merapi', status: 'CLOSED', currentA: 285, powerMw: 9.44, voltageKv: 20.1, cosPhi: 0.955 },
      { id: 'fed_gandul_2', busId: 'bus_gandul_a', code: 'F-02', name: 'Penyulang Ciremai', status: 'TRIP', currentA: 0, powerMw: 0.00, voltageKv: 0.0, cosPhi: 1.000 },
      { id: 'fed_gandul_3', busId: 'bus_gandul_a', code: 'F-03', name: 'Penyulang Garuda', status: 'CLOSED', currentA: 212, powerMw: 7.05, voltageKv: 20.2, cosPhi: 0.962 },
      { id: 'fed_gandul_4', busId: 'bus_gandul_b', code: 'F-04', name: 'Penyulang Rajawali', status: 'CLOSED', currentA: 289, powerMw: 9.51, voltageKv: 20.1, cosPhi: 0.955 },
      { id: 'fed_gandul_5', busId: 'bus_gandul_b', code: 'F-05', name: 'Penyulang Diponegoro', status: 'CLOSED', currentA: 242, powerMw: 8.01, voltageKv: 20.1, cosPhi: 0.957 },
      { id: 'fed_gandul_6', busId: 'bus_gandul_b', code: 'F-06', name: 'Penyulang Khatulistiwa', status: 'CLOSED', currentA: 411, powerMw: 12.64, voltageKv: 20.1, cosPhi: 0.959 }
    ],
    pmtKopelStatus: 'TRIP',
    downstreamNodes: {
      'fed_gandul_1': [
        { id: 'ds_gandul_1_1', name: 'GH Merapi 1', type: 'GH', status: 'CLOSED' },
        { id: 'ds_gandul_1_2', name: 'LBS Kaliurang', type: 'LBS', status: 'CLOSED' }
      ],
      'fed_gandul_2': [
        { id: 'ds_gandul_2_1', name: 'Recloser Ciremai', type: 'RECLOSER', status: 'TRIP' }
      ],
      'fed_gandul_3': [
        { id: 'ds_gandul_3_1', name: 'PMCB Garuda', type: 'PMCB', status: 'CLOSED' }
      ],
      'fed_gandul_4': [
        { id: 'ds_gandul_4_1', name: 'CO Rajawali', type: 'CO', status: 'CLOSED' }
      ],
      'fed_gandul_5': [
        { id: 'ds_gandul_5_1', name: 'DS Diponegoro', type: 'DS', status: 'CLOSED' }
      ],
      'fed_gandul_6': []
    }
  },
  'senayan': {
    id: 'senayan',
    name: 'PLTD SENAYAN',
    type: 'PLTD',
    buses: [
      { id: 'bus_senayan_main', name: 'BUS Utama PLTD', voltageKv: 20.15, incomerBreakerStatus: 'CLOSED', incomerName: 'Generator Diesel G1 (12MW)' }
    ],
    feeders: [
      { id: 'fed_sen_1', busId: 'bus_senayan_main', code: 'F-PLTD1', name: 'Penyulang GBK', status: 'CLOSED', currentA: 195, powerMw: 6.40, voltageKv: 20.1, cosPhi: 0.950 },
      { id: 'fed_sen_2', busId: 'bus_senayan_main', code: 'F-PLTD2', name: 'Penyulang Sudirman', status: 'CLOSED', currentA: 210, powerMw: 6.90, voltageKv: 20.1, cosPhi: 0.950 }
    ],
    pmtKopelStatus: 'TRIP',
    downstreamNodes: {
      'fed_sen_1': [
        { id: 'ds_sen_1_1', name: 'LBS GBK Barat', type: 'LBS', status: 'CLOSED' }
      ],
      'fed_sen_2': []
    }
  },
  'kebon_sirih': {
    id: 'kebon_sirih',
    name: 'GH KEBON SIRIH',
    type: 'GH',
    buses: [
      { id: 'bus_sirih_main', name: 'BUS 20kV GH Sirih', voltageKv: 20.08, incomerBreakerStatus: 'CLOSED', incomerName: 'Incomer Express GI Menteng' }
    ],
    feeders: [
      { id: 'fed_sir_1', busId: 'bus_sirih_main', code: 'F-SIR1', name: 'Penyulang Sirih Mas', status: 'CLOSED', currentA: 110, powerMw: 3.60, voltageKv: 20.0, cosPhi: 0.950 },
      { id: 'fed_sir_2', busId: 'bus_sirih_main', code: 'F-SIR2', name: 'Penyulang Sirih Pratama', status: 'CLOSED', currentA: 155, powerMw: 5.10, voltageKv: 20.0, cosPhi: 0.950 }
    ],
    pmtKopelStatus: 'TRIP',
    downstreamNodes: {
      'fed_sir_1': [],
      'fed_sir_2': []
    }
  }
};

const INITIAL_DCC_STATE: DccConfigState = {
  activeStationId: 'gandul',
  stations: DEFAULT_STATIONS,
  telemetryOn: true
};

export const DccView: React.FC<{ currentUser: any }> = ({ currentUser }) => {
  const [dccState, setDccState] = useState<DccConfigState>(INITIAL_DCC_STATE);
  const [loading, setLoading] = useState<boolean>(true);
  const [saveStatus, setSaveStatus] = useState<'IDLE' | 'SAVING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [masterPenyulangs, setMasterPenyulangs] = useState<any[]>(INITIAL_PENYULANG);

  // Subscribe to Master Data Penyulang from Firestore
  useEffect(() => {
    const q = collection(db, 'penyulang_list');
    const unsub = onSnapshot(q, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      if (list.length > 0) {
        setMasterPenyulangs(list);
      } else {
        setMasterPenyulangs(INITIAL_PENYULANG);
      }
    }, (error) => {
      console.warn("Gagal berlangganan ke master penyulang_list, menggunakan data inisial:", error);
      setMasterPenyulangs(INITIAL_PENYULANG);
    });
    return () => unsub();
  }, []);
  
  // Custom dialog state (replacing native alert/confirm blocked in iframe)
  const [customDialog, setCustomDialog] = useState<{
    type: 'ALERT' | 'CONFIRM';
    title: string;
    message: string;
    onConfirm?: () => void;
  } | null>(null);

  const showCustomAlert = (title: string, message: string) => {
    setCustomDialog({ type: 'ALERT', title, message });
  };

  const showCustomConfirm = (title: string, message: string, onConfirm: () => void) => {
    setCustomDialog({ type: 'CONFIRM', title, message, onConfirm });
  };
  
  // Modal Edit States
  const [editingComponent, setEditingComponent] = useState<{
    type: 'bus' | 'feeder' | 'incomer';
    id: string;
    data: any;
  } | null>(null);

  // Filter & Layout States
  const [operationMode, setOperationMode] = useState<'RADIAL' | 'LOOP'>('LOOP');
  const [showLegenda, setShowLegenda] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Downstream node creation state
  const [addingNodeForFeeder, setAddingNodeForFeeder] = useState<string | null>(null);
  const [addingNodeParentId, setAddingNodeParentId] = useState<string | null>(null); // Parent node if sub-branching
  const [newNodeName, setNewNodeName] = useState<string>('');
  const [newNodeType, setNewNodeType] = useState<'GH' | 'LBS' | 'RECLOSER' | 'PMCB' | 'CO' | 'DS'>('LBS');
  const [newNodeStatus, setNewNodeStatus] = useState<'CLOSED' | 'TRIP'>('CLOSED');
  const [newNodeLoopSourceFeederId, setNewNodeLoopSourceFeederId] = useState<string>('');

  // JTM Node edit state
  const [editingJtmNode, setEditingJtmNode] = useState<{
    feederId: string;
    nodeId: string;
    name: string;
    type: 'GH' | 'LBS' | 'RECLOSER' | 'PMCB' | 'CO' | 'DS';
    status: 'CLOSED' | 'TRIP';
    loopSourceFeederId: string;
  } | null>(null);

  // Modals for Adding Stations, Busbars, and Feeders
  const [showAddStationModal, setShowAddStationModal] = useState<boolean>(false);
  const [newStationName, setNewStationName] = useState<string>('');
  const [newStationType, setNewStationType] = useState<'GI' | 'PLTD' | 'GH'>('GI');

  const [showAddBusbarModal, setShowAddBusbarModal] = useState<boolean>(false);
  const [newBusbarName, setNewBusbarName] = useState<string>('');
  const [newBusbarVoltage, setNewBusbarVoltage] = useState<number>(20.0);
  const [newBusbarIncomer, setNewBusbarIncomer] = useState<string>('');

  const [showAddFeederModal, setShowAddFeederModal] = useState<string | null>(null); // busId where to add feeder
  const [newFeederCode, setNewFeederCode] = useState<string>('');
  const [newFeederName, setNewFeederName] = useState<string>('');
  const [newFeederCurrent, setNewFeederCurrent] = useState<number>(180);
  const [newFeederCosPhi, setNewFeederCosPhi] = useState<number>(0.95);

  // Listen to Firestore for global state persistence
  useEffect(() => {
    const docRef = doc(db, 'dcc_configs', 'stations_multistate');
    const unsub = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const cloudData = docSnap.data() as DccConfigState;
        // Migration safeguard to prevent using old non-station schema
        if (cloudData && cloudData.stations && cloudData.activeStationId) {
          setDccState(cloudData);
        } else {
          setDoc(docRef, INITIAL_DCC_STATE).catch((err) => {
            console.error("Gagal upgrade skema DCC di cloud:", err);
          });
        }
      } else {
        // Create initial config if it doesn't exist
        setDoc(docRef, INITIAL_DCC_STATE).catch((err) => {
          console.error("Gagal inisialisasi DCC di cloud:", err);
        });
      }
      setLoading(false);
    }, (error) => {
      console.warn("Firestore listener fallback to localStorage:", error);
      const cached = localStorage.getItem('dcc_stations_multistate');
      if (cached) {
        try {
          setDccState(JSON.parse(cached));
        } catch {
          setDccState(INITIAL_DCC_STATE);
        }
      }
      setLoading(false);
    });

    return () => unsub();
  }, []);

  // Save changes helper
  const updateDccStateInDb = async (newState: DccConfigState) => {
    setSaveStatus('SAVING');
    localStorage.setItem('dcc_stations_multistate', JSON.stringify(newState));
    try {
      await setDoc(doc(db, 'dcc_configs', 'stations_multistate'), newState);
      setSaveStatus('SUCCESS');
      setTimeout(() => setSaveStatus('IDLE'), 2000);
    } catch (err) {
      setSaveStatus('ERROR');
      setTimeout(() => setSaveStatus('IDLE'), 3000);
      handleFirestoreError(err, OperationType.WRITE, 'dcc_configs/stations_multistate');
    }
  };

  // Telemetry fluctuation simulator
  useEffect(() => {
    if (!dccState || !dccState.telemetryOn) return;

    const interval = setInterval(() => {
      setDccState((prev) => {
        if (!prev || !prev.stations) return prev;
        
        const nextStations = { ...prev.stations };
        const activeId = prev.activeStationId;
        const currentStation = nextStations[activeId];
        
        if (!currentStation) return prev;
        
        // Calculate dynamic energized states for all busbars in the active station
        const isAnyIncomerClosed = currentStation.buses.some(b => b.incomerBreakerStatus === 'CLOSED');
        const intervalBusEnergizedMap: Record<string, boolean> = {};
        currentStation.buses.forEach(b => {
          const directEnergized = b.incomerBreakerStatus === 'CLOSED';
          const kopelEnergized = currentStation.pmtKopelStatus === 'CLOSED' && isAnyIncomerClosed;
          intervalBusEnergizedMap[b.id] = directEnergized || kopelEnergized;
        });
        
        const nextBuses = currentStation.buses.map(bus => {
          const isEnergized = intervalBusEnergizedMap[bus.id];

          if (isEnergized) {
            // Fluctuate voltage slightly around 20.0 kV
            const baseVoltage = 20.0;
            const fluctuation = (Math.random() - 0.5) * 0.15; // +/- 0.075 kV
            return {
              ...bus,
              voltageKv: parseFloat((baseVoltage + fluctuation).toFixed(2))
            };
          } else {
            return { ...bus, voltageKv: 0.0 };
          }
        });

        const nextFeeders = currentStation.feeders.map(feeder => {
          const connectedBus = nextBuses.find(b => b.id === feeder.busId);
          const isBusEnergized = connectedBus && connectedBus.voltageKv > 0;
          const isFeederEnergized = isBusEnergized && feeder.status === 'CLOSED';

          if (!isFeederEnergized) {
            return {
              ...feeder,
              currentA: 0,
              powerMw: 0.00,
              voltageKv: 0.0
            };
          } else {
            // Natural current fluctuation (+/- 3%)
            const baseCurrent = feeder.id.includes('fed_gandul_1') ? 285 : feeder.id.includes('fed_gandul_3') ? 212 : feeder.id.includes('fed_gandul_4') ? 289 : feeder.id.includes('fed_gandul_5') ? 242 : 180;
            const fluctuation = (Math.random() - 0.5) * 6; // range -3 to +3 A
            let currentA = Math.max(10, Math.round(baseCurrent + fluctuation));

            // Dynamic looping load calculation
            const activeLoops = getActiveLoopedNodesForFeeder(currentStation, feeder.id, intervalBusEnergizedMap, operationMode);
            const totalLoopLoadA = activeLoops.reduce((sum, item) => sum + item.loadA, 0);
            currentA += totalLoopLoadA;

            const voltageKv = connectedBus ? connectedBus.voltageKv : 20.0;
            
            // Re-calc power (Power = sqrt(3) * I * V * cosPhi / 1000)
            const powerMw = parseFloat((Math.sqrt(3) * currentA * voltageKv * feeder.cosPhi / 1000).toFixed(2));
            
            return {
              ...feeder,
              currentA,
              powerMw,
              voltageKv
            };
          }
        });

        return {
          ...prev,
          stations: {
            ...nextStations,
            [activeId]: {
              ...currentStation,
              buses: nextBuses,
              feeders: nextFeeders
            }
          }
        };
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [dccState?.telemetryOn, dccState?.activeStationId, operationMode]);

  // Retrieve active station layout
  const activeStation = useMemo(() => {
    if (!dccState || !dccState.stations || !dccState.activeStationId) return null;
    return dccState.stations[dccState.activeStationId] || null;
  }, [dccState]);

  // Derived energized states of active station components
  const busEnergizedMap = useMemo(() => {
    const mapping: Record<string, boolean> = {};
    if (!activeStation) return mapping;

    const isAnyIncomerClosed = activeStation.buses.some(b => b.incomerBreakerStatus === 'CLOSED');
    activeStation.buses.forEach(bus => {
      const directEnergized = bus.incomerBreakerStatus === 'CLOSED';
      const kopelEnergized = activeStation.pmtKopelStatus === 'CLOSED' && isAnyIncomerClosed;
      mapping[bus.id] = directEnergized || kopelEnergized;
    });

    return mapping;
  }, [activeStation]);

  // Memoized map of energized states for all JTM nodes in the active station
  const nodeEnergizedStates = useMemo(() => {
    const statesMap: Record<string, { incomingActive: boolean; nodeActive: boolean }> = {};
    if (!activeStation) return statesMap;

    // Helper to check if a feeder is energized
    const isFeederFullyActive = (fId: string): boolean => {
      if (!fId || fId === 'NO_FEEDER_AVAILABLE') return false;
      const fdr = activeStation.feeders.find(f => 
        f.id === fId || 
        f.code === fId || 
        f.name === fId ||
        (f.code && f.code.toLowerCase() === fId.toLowerCase()) ||
        (f.name && f.name.toLowerCase() === fId.toLowerCase())
      );
      if (!fdr) {
        // If not found in current station, assume it represents an external active backup feeder
        // to support realistic back-feeding simulation from the master data.
        return true;
      }
      const connectedBus = activeStation.buses.find(b => b.id === fdr.busId);
      const isBusActive = connectedBus && busEnergizedMap[connectedBus.id];
      return !!(isBusActive && fdr.status === 'CLOSED');
    };

    const isLoopActive = (loopId?: string): boolean => {
      if (operationMode === 'RADIAL') return false;
      if (!loopId) return false;
      return isFeederFullyActive(loopId);
    };

    // For each feeder, compute pass 1 (downstream propagation) and pass 2 (upstream back-feeding)
    activeStation.feeders.forEach((feeder) => {
      const nodes = activeStation.downstreamNodes[feeder.id] || [];
      const isFeederActive = isFeederFullyActive(feeder.id);

      // First pass: downstream propagation
      const firstPass = (nodesList: DownstreamNode[], parentActive: boolean) => {
        let runningActive = parentActive;
        nodesList.forEach(node => {
          const isLp = node.loopSourceFeederId ? isLoopActive(node.loopSourceFeederId) : false;
          const incoming = runningActive || isLp;
          const active = incoming && node.status === 'CLOSED';
          statesMap[node.id] = { incomingActive: incoming, nodeActive: active };
          if (node.children && node.children.length > 0) {
            firstPass(node.children, active);
          }
          runningActive = active;
        });
      };
      firstPass(nodes, isFeederActive);

      // Second pass: back-feeding propagation from active loop sources
      const secondPass = (nodesList: DownstreamNode[]): boolean => {
        let anyChildOrSelfActive = false;
        nodesList.forEach(node => {
          let childActive = false;
          if (node.children && node.children.length > 0) {
            childActive = secondPass(node.children);
          }
          const state = statesMap[node.id];
          if (state) {
            if (childActive && node.status === 'CLOSED') {
              state.nodeActive = true;
              state.incomingActive = true;
            }
            if (state.nodeActive) {
              anyChildOrSelfActive = true;
            }
          }
        });
        return anyChildOrSelfActive;
      };
      secondPass(nodes);
    });

    return statesMap;
  }, [activeStation, busEnergizedMap, operationMode]);

  // Dynamic station creations
  const handleCreateStationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStationName.trim()) return;

    const id = newStationName.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Date.now();
    const buses: StationBus[] = [];
    const feeders: StationFeeder[] = [];
    const downstreamNodes: Record<string, DownstreamNode[]> = {};

    if (newStationType === 'GI') {
      buses.push(
        { id: `bus_${id}_a`, name: 'BUS 20kV - A', voltageKv: 20.0, incomerBreakerStatus: 'CLOSED', incomerName: 'Trafo Daya 1 (60 MVA)' },
        { id: `bus_${id}_b`, name: 'BUS 20kV - B', voltageKv: 20.0, incomerBreakerStatus: 'CLOSED', incomerName: 'Trafo Daya 2 (60 MVA)' }
      );
      feeders.push(
        { id: `fed_${id}_1`, busId: `bus_${id}_a`, code: 'F-01', name: 'Penyulang Merapi', status: 'CLOSED', currentA: 285, powerMw: 9.44, voltageKv: 20.0, cosPhi: 0.95 },
        { id: `fed_${id}_2`, busId: `bus_${id}_b`, code: 'F-02', name: 'Penyulang Rajawali', status: 'CLOSED', currentA: 210, powerMw: 7.00, voltageKv: 20.0, cosPhi: 0.95 }
      );
      downstreamNodes[`fed_${id}_1`] = [];
      downstreamNodes[`fed_${id}_2`] = [];
    } else if (newStationType === 'PLTD') {
      buses.push(
        { id: `bus_${id}_main`, name: 'BUS Utama PLTD', voltageKv: 20.0, incomerBreakerStatus: 'CLOSED', incomerName: 'Generator Diesel G1 (12MW)' }
      );
      feeders.push(
        { id: `fed_${id}_1`, busId: `bus_${id}_main`, code: 'F-PL1', name: 'Penyulang GBK', status: 'CLOSED', currentA: 195, powerMw: 6.40, voltageKv: 20.0, cosPhi: 0.95 }
      );
      downstreamNodes[`fed_${id}_1`] = [];
    } else { // GH
      buses.push(
        { id: `bus_${id}_gh`, name: 'BUS 20kV GH Sirih', voltageKv: 20.0, incomerBreakerStatus: 'CLOSED', incomerName: 'Incomer Express GI' }
      );
      feeders.push(
        { id: `fed_${id}_1`, busId: `bus_${id}_gh`, code: 'F-SIR1', name: 'Penyulang Sirih Mas', status: 'CLOSED', currentA: 155, powerMw: 5.10, voltageKv: 20.0, cosPhi: 0.95 }
      );
      downstreamNodes[`fed_${id}_1`] = [];
    }

    const newStation: StationConfig = {
      id,
      name: newStationName.toUpperCase(),
      type: newStationType,
      buses,
      feeders,
      pmtKopelStatus: 'TRIP',
      downstreamNodes
    };

    const newState = {
      ...dccState,
      activeStationId: id,
      stations: {
        ...dccState.stations,
        [id]: newStation
      }
    };

    setDccState(newState);
    updateDccStateInDb(newState);
    setShowAddStationModal(false);
    setNewStationName('');
  };

  // Delete Station
  const handleDeleteStation = (stationId: string) => {
    if (Object.keys(dccState.stations).length <= 1) {
      showCustomAlert(
        "Gagal Menghapus Sistem",
        "Minimal harus menyisakan 1 sistem monitoring untuk aplikasi."
      );
      return;
    }

    showCustomConfirm(
      "Konfirmasi Hapus Sistem",
      `Apakah Anda yakin ingin menghapus sistem "${dccState.stations[stationId].name}" beserta seluruh busbar dan feeder di dalamnya?`,
      () => {
        const nextStations = { ...dccState.stations };
        delete nextStations[stationId];

        const fallbackId = Object.keys(nextStations)[0];
        const newState = {
          ...dccState,
          activeStationId: fallbackId,
          stations: nextStations
        };

        setDccState(newState);
        updateDccStateInDb(newState);
      }
    );
  };

  // Toggle Incomer Breaker
  const handleToggleIncomerBreaker = (busId: string) => {
    if (!activeStation) return;

    const updatedBuses = activeStation.buses.map(bus => {
      if (bus.id === busId) {
        return {
          ...bus,
          incomerBreakerStatus: bus.incomerBreakerStatus === 'CLOSED' ? 'TRIP' : 'CLOSED' as const
        };
      }
      return bus;
    });

    const newState = {
      ...dccState,
      stations: {
        ...dccState.stations,
        [activeStation.id]: {
          ...activeStation,
          buses: updatedBuses
        }
      }
    };

    setDccState(newState);
    updateDccStateInDb(newState);
  };

  // Toggle Bus Tie / PMT Kopel
  const handleToggleKopel = () => {
    if (!activeStation) return;

    const nextStatus = activeStation.pmtKopelStatus === 'CLOSED' ? 'TRIP' : 'CLOSED';
    const newState = {
      ...dccState,
      stations: {
        ...dccState.stations,
        [activeStation.id]: {
          ...activeStation,
          pmtKopelStatus: nextStatus
        }
      }
    };

    setDccState(newState);
    updateDccStateInDb(newState);
  };

  // Toggle Feeder Breaker
  const handleToggleFeederBreaker = (feederId: string) => {
    if (!activeStation) return;

    const updatedFeeders = activeStation.feeders.map(feeder => {
      if (feeder.id === feederId) {
        const nextStatus = feeder.status === 'CLOSED' ? 'TRIP' : 'CLOSED' as const;
        return {
          ...feeder,
          status: nextStatus,
          currentA: nextStatus === 'TRIP' ? 0 : 180,
          powerMw: nextStatus === 'TRIP' ? 0.0 : parseFloat((Math.sqrt(3) * 180 * 20 * feeder.cosPhi / 1000).toFixed(2))
        };
      }
      return feeder;
    });

    const newState = {
      ...dccState,
      stations: {
        ...dccState.stations,
        [activeStation.id]: {
          ...activeStation,
          feeders: updatedFeeders
        }
      }
    };

    setDccState(newState);
    updateDccStateInDb(newState);
  };

  // Toggle status of JTM Equipment
  const handleToggleDownstreamNode = (feederId: string, nodeId: string) => {
    if (!activeStation) return;

    const downstreamNodes = { ...activeStation.downstreamNodes };
    const list = downstreamNodes[feederId] ? JSON.parse(JSON.stringify(downstreamNodes[feederId])) : [];
    const updated = toggleNodeInTree(list, nodeId);

    if (updated) {
      downstreamNodes[feederId] = list;
      const newState = {
        ...dccState,
        stations: {
          ...dccState.stations,
          [activeStation.id]: {
            ...activeStation,
            downstreamNodes
          }
        }
      };
      setDccState(newState);
      updateDccStateInDb(newState);
    }
  };

  // Add JTM Node
  const handleAddDownstreamNode = (
    feederId: string, 
    parentNodeId: string | null, 
    name: string, 
    type: 'GH' | 'LBS' | 'RECLOSER' | 'PMCB' | 'CO' | 'DS', 
    status: 'CLOSED' | 'TRIP',
    loopSourceFeederId?: string
  ) => {
    if (!activeStation) return;

    const downstreamNodes = { ...activeStation.downstreamNodes };
    const list = downstreamNodes[feederId] ? JSON.parse(JSON.stringify(downstreamNodes[feederId])) : [];

    const newNode: DownstreamNode = {
      id: `ds_${feederId}_${Date.now()}`,
      name: name || `${type} Baru`,
      type,
      status,
      loopSourceFeederId: loopSourceFeederId || undefined,
      children: []
    };

    if (parentNodeId) {
      addNodeToTree(list, parentNodeId, newNode);
    } else {
      list.push(newNode);
    }

    downstreamNodes[feederId] = list;
    const newState = {
      ...dccState,
      stations: {
        ...dccState.stations,
        [activeStation.id]: {
          ...activeStation,
          downstreamNodes
        }
      }
    };

    setDccState(newState);
    updateDccStateInDb(newState);
  };

  // Delete JTM Node
  const handleDeleteDownstreamNode = (feederId: string, nodeId: string) => {
    if (!activeStation) return;

    const downstreamNodes = { ...activeStation.downstreamNodes };
    const list = downstreamNodes[feederId] ? JSON.parse(JSON.stringify(downstreamNodes[feederId])) : [];
    const deleted = deleteNodeFromTree(list, nodeId);

    if (deleted) {
      downstreamNodes[feederId] = list;
      const newState = {
        ...dccState,
        stations: {
          ...dccState.stations,
          [activeStation.id]: {
            ...activeStation,
            downstreamNodes
          }
        }
      };
      setDccState(newState);
      updateDccStateInDb(newState);
    }
  };

  // Save JTM Node edits
  const handleSaveJtmNodeEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStation || !editingJtmNode) return;

    const downstreamNodes = { ...activeStation.downstreamNodes };
    const list = downstreamNodes[editingJtmNode.feederId] 
      ? JSON.parse(JSON.stringify(downstreamNodes[editingJtmNode.feederId])) 
      : [];

    const updated = updateNodeInTree(list, editingJtmNode.nodeId, {
      name: editingJtmNode.name,
      type: editingJtmNode.type,
      status: editingJtmNode.status,
      loopSourceFeederId: editingJtmNode.loopSourceFeederId || undefined
    });

    if (updated) {
      downstreamNodes[editingJtmNode.feederId] = list;
      const newState = {
        ...dccState,
        stations: {
          ...dccState.stations,
          [activeStation.id]: {
            ...activeStation,
            downstreamNodes
          }
        }
      };
      setDccState(newState);
      updateDccStateInDb(newState);
    }
    setEditingJtmNode(null);
  };

  // Add Dynamic Busbar to Station
  const handleAddBusbarSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStation || !newBusbarName.trim()) return;

    const id = `bus_${activeStation.id}_${Date.now()}`;
    const newBus: StationBus = {
      id,
      name: newBusbarName.toUpperCase(),
      voltageKv: newBusbarVoltage,
      incomerBreakerStatus: 'CLOSED',
      incomerName: newBusbarIncomer.trim() || 'Sumber Incomer Baru'
    };

    const newState = {
      ...dccState,
      stations: {
        ...dccState.stations,
        [activeStation.id]: {
          ...activeStation,
          buses: [...activeStation.buses, newBus]
        }
      }
    };

    setDccState(newState);
    updateDccStateInDb(newState);
    setShowAddBusbarModal(false);
    setNewBusbarName('');
    setNewBusbarIncomer('');
  };

  // Delete Busbar
  const handleDeleteBusbar = (busId: string) => {
    if (!activeStation) return;

    if (activeStation.buses.length <= 1) {
      showCustomAlert(
        "Gagal Menghapus Busbar",
        "Sistem harus memiliki minimal 1 Busbar utama."
      );
      return;
    }

    showCustomConfirm(
      "Konfirmasi Hapus Busbar",
      "Menghapus busbar ini akan menghapus semua feeder dan peralatan JTM yang terhubung dengannya. Lanjutkan?",
      () => {
        const remainingBuses = activeStation.buses.filter(b => b.id !== busId);
        const remainingFeeders = activeStation.feeders.filter(f => f.busId !== busId);

        const newState = {
          ...dccState,
          stations: {
            ...dccState.stations,
            [activeStation.id]: {
              ...activeStation,
              buses: remainingBuses,
              feeders: remainingFeeders
            }
          }
        };

        setDccState(newState);
        updateDccStateInDb(newState);
      }
    );
  };

  // Add Dynamic Feeder to Busbar
  const handleAddFeederSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStation || !showAddFeederModal || !newFeederCode.trim()) return;

    const id = `fed_${activeStation.id}_${Date.now()}`;
    const newFeeder: StationFeeder = {
      id,
      busId: showAddFeederModal,
      code: newFeederCode.toUpperCase(),
      name: newFeederName || `Feeder ${newFeederCode}`,
      status: 'CLOSED',
      currentA: newFeederCurrent,
      powerMw: parseFloat((Math.sqrt(3) * newFeederCurrent * 20 * newFeederCosPhi / 1000).toFixed(2)),
      voltageKv: 20.0,
      cosPhi: newFeederCosPhi
    };

    const downstreamNodes = { ...activeStation.downstreamNodes };
    downstreamNodes[id] = [];

    const newState = {
      ...dccState,
      stations: {
        ...dccState.stations,
        [activeStation.id]: {
          ...activeStation,
          feeders: [...activeStation.feeders, newFeeder],
          downstreamNodes
        }
      }
    };

    setDccState(newState);
    updateDccStateInDb(newState);
    setShowAddFeederModal(null);
    setNewFeederCode('');
    setNewFeederName('');
    setNewFeederCurrent(180);
  };

  // Delete Feeder
  const handleDeleteFeeder = (feederId: string) => {
    if (!activeStation) return;

    showCustomConfirm(
      "Konfirmasi Hapus Feeder",
      "Apakah Anda yakin ingin menghapus Feeder ini beserta seluruh sirkuit JTM hilirnya?",
      () => {
        const remainingFeeders = activeStation.feeders.filter(f => f.id !== feederId);
        const downstreamNodes = { ...activeStation.downstreamNodes };
        delete downstreamNodes[feederId];

        const newState = {
          ...dccState,
          stations: {
            ...dccState.stations,
            [activeStation.id]: {
              ...activeStation,
              feeders: remainingFeeders,
              downstreamNodes
            }
          }
        };

        setDccState(newState);
        updateDccStateInDb(newState);
      }
    );
  };

  // Edit Parameters Modal Saves
  const handleSaveComponentEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStation || !editingComponent) return;

    const { type, id, data } = editingComponent;
    const newState = { ...dccState };

    if (type === 'bus') {
      const updatedBuses = activeStation.buses.map(b => b.id === id ? { ...b, ...data } : b);
      newState.stations[activeStation.id] = {
        ...activeStation,
        buses: updatedBuses
      };
    } else if (type === 'incomer') {
      const updatedBuses = activeStation.buses.map(b => b.id === id ? { ...b, incomerName: data.incomerName } : b);
      newState.stations[activeStation.id] = {
        ...activeStation,
        buses: updatedBuses
      };
    } else if (type === 'feeder') {
      const updatedFeeders = activeStation.feeders.map(f => f.id === id ? { ...f, ...data } : f);
      newState.stations[activeStation.id] = {
        ...activeStation,
        feeders: updatedFeeders
      };
    }

    setDccState(newState);
    updateDccStateInDb(newState);
    setEditingComponent(null);
  };

  // Reset to Pristine Defaults
  const handleResetToDefaults = () => {
    showCustomConfirm(
      "Konfirmasi Reset Sistem",
      "Apakah Anda yakin ingin mengatur ulang seluruh data multi-sistem DCC ke pengaturan awal?",
      () => {
        setDccState(INITIAL_DCC_STATE);
        updateDccStateInDb(INITIAL_DCC_STATE);
      }
    );
  };

  // Node Icon Helper
  const getNodeIcon = (type: string, isActive: boolean) => {
    const colorClass = isActive ? 'text-emerald-400' : 'text-rose-400';
    const size = "w-4 h-4";
    
    switch (type) {
      case 'GH':
        return <Network className={`${size} ${colorClass}`} />;
      case 'LBS':
        return <ToggleLeft className={`${size} ${colorClass}`} />;
      case 'RECLOSER':
        return <RefreshCw className={`${size} ${colorClass}`} />;
      case 'PMCB':
        return <Shield className={`${size} ${colorClass}`} />;
      case 'CO':
        return <ZapOff className={`${size} ${colorClass}`} />;
      case 'DS':
        return <Unlink className={`${size} ${colorClass}`} />;
      default:
        return <Zap className={`${size} ${colorClass}`} />;
    }
  };

  // Recursive JTM Tree Renderer
  const renderJtmNodeTree = (
    nodes: DownstreamNode[], 
    isParentPathActive: boolean, 
    feederId: string,
    depth = 0
  ): React.ReactNode => {
    if (!nodes || nodes.length === 0) return null;

    // Helper to check if the alternative loop source feeder is active
    const isAlternativeFeederActive = (loopId?: string): boolean => {
      if (operationMode === 'RADIAL') return false;
      if (!loopId || !activeStation) return false;
      const fdr = activeStation.feeders.find(f => f.id === loopId);
      if (!fdr) return false;
      const connectedBus = activeStation.buses.find(b => b.id === fdr.busId);
      const isBusActive = connectedBus && busEnergizedMap[connectedBus.id];
      return !!(isBusActive && fdr.status === 'CLOSED');
    };

    return (
      <div className={`w-full flex flex-col items-center ${depth > 0 ? 'mt-2 space-y-3' : 'space-y-4'}`}>
        {nodes.map((node, index) => {
          const nodeState = nodeEnergizedStates[node.id] || { incomingActive: false, nodeActive: false };
          const incomingLineActive = nodeState.incomingActive;
          const isNodeActive = nodeState.nodeActive;

          const typeStyles = {
            GH: 'border-blue-500/30 bg-blue-950/40 text-blue-300',
            LBS: 'border-teal-500/30 bg-teal-950/40 text-teal-300',
            RECLOSER: 'border-amber-500/30 bg-amber-950/40 text-amber-300',
            PMCB: 'border-pink-500/30 bg-pink-950/40 text-pink-300',
            CO: 'border-orange-500/30 bg-orange-950/40 text-orange-300',
            DS: 'border-purple-500/30 bg-purple-950/40 text-purple-300'
          }[node.type] || 'border-slate-500/30 bg-slate-900 text-slate-300';

          // Check if any child is carrying power (either upstream path or back-fed loop active)
          const isAnyChildActive = node.children?.some(child => {
            const childState = nodeEnergizedStates[child.id];
            return childState?.incomingActive;
          }) || false;
          const isChildrenConnectionActive = isNodeActive || isAnyChildActive;

          return (
            <div key={node.id} className="flex flex-col items-center relative w-full">
              {/* Solid Connector Line */}
              {index > 0 && (
                <div className="w-full flex justify-center -mt-2 mb-2">
                  <div className={`w-[3px] h-6 transition-all duration-300 rounded-full ${
                    incomingLineActive 
                      ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.85)] animate-pulse' 
                      : 'bg-rose-600 shadow-[0_0_4px_rgba(239,68,68,0.55)]'
                  }`} />
                </div>
              )}

              {/* JTM Card */}
              <div className={`w-full rounded-xl border p-2 bg-[#011412] shadow-md transition-all relative ${
                node.status === 'CLOSED'
                  ? isNodeActive 
                    ? 'border-emerald-500/60 shadow-md shadow-emerald-950/30' 
                    : 'border-emerald-800/40'
                  : 'border-rose-800/60 shadow-md shadow-rose-950/30'
              }`}>
                {/* Actions Top-Right */}
                <div className="absolute top-1.5 right-1.5 flex items-center gap-1 z-10">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setAddingNodeForFeeder(feederId);
                      setAddingNodeParentId(node.id);
                      setNewNodeName('');
                      setNewNodeType('LBS');
                      setNewNodeStatus('CLOSED');
                      setNewNodeLoopSourceFeederId('');
                    }}
                    className="p-1 rounded bg-[#012823] hover:bg-emerald-600 hover:text-white text-emerald-400 transition-all cursor-pointer border border-emerald-500/20 active:scale-90"
                    title={`Tambah Cabang di bawah ${node.name}`}
                  >
                    <Plus className="w-2.5 h-2.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingJtmNode({
                        feederId,
                        nodeId: node.id,
                        name: node.name,
                        type: node.type,
                        status: node.status,
                        loopSourceFeederId: node.loopSourceFeederId || ''
                      });
                    }}
                    className="p-1 rounded bg-[#012823] hover:bg-amber-600 hover:text-white text-amber-400 transition-all cursor-pointer border border-teal-500/10 active:scale-90"
                    title={`Edit & Konfigurasi Looping ${node.name}`}
                  >
                    <Settings className="w-2.5 h-2.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      showCustomConfirm(
                        "Konfirmasi Hapus Peralatan",
                        `Apakah Anda yakin ingin menghapus ${node.type} "${node.name}" beserta seluruh cabangnya?`,
                        () => handleDeleteDownstreamNode(feederId, node.id)
                      );
                    }}
                    className="text-slate-500 hover:text-rose-400 p-0.5 rounded transition-all cursor-pointer"
                    title="Hapus Peralatan"
                  >
                    <Trash2 className="w-2.5 h-2.5" />
                  </button>
                </div>

                {/* Header Info */}
                <div className="flex flex-col items-center justify-center pt-1.5 pb-1">
                  <div className="p-1.5 rounded-lg bg-teal-950/40 border border-teal-900/30 flex items-center justify-center mb-1">
                    {getNodeIcon(node.type, isNodeActive)}
                  </div>
                  <span className={`text-[7px] font-black px-1 py-0.5 rounded uppercase tracking-wider border ${typeStyles}`}>
                     {node.type}
                  </span>
                </div>

                {/* Name */}
                <div className="text-[9px] font-bold text-slate-200 mb-1 text-center truncate px-1" title={node.name}>
                  {node.name}
                </div>

                {/* Loop Connection Status Badge */}
                {node.loopSourceFeederId && (
                  <div className="flex flex-col items-center mb-1.5 px-1">
                    {(() => {
                      const loopFeeder = activeStation?.feeders.find(f => f.id === node.loopSourceFeederId);
                      const isLpActive = isAlternativeFeederActive(node.loopSourceFeederId);
                      return (
                        <span className={`text-[7px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1 border ${
                          isLpActive
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_6px_rgba(16,185,129,0.25)] animate-pulse'
                            : 'bg-slate-900/40 text-slate-400 border-slate-800'
                        }`} title={`Sumber Looping: ${loopFeeder ? loopFeeder.name : 'Tidak Diketahui'}`}>
                          <Layers className="w-2 h-2 text-teal-400" />
                          <span>Loop: {loopFeeder ? loopFeeder.code : 'F-X'} ({isLpActive ? 'LOOP ACTIVE' : 'LOOP STANDBY'})</span>
                        </span>
                      );
                    })()}
                  </div>
                )}

                {/* Control Action Switch */}
                <button
                  onClick={() => handleToggleDownstreamNode(feederId, node.id)}
                  className={`w-full py-1 rounded text-[8px] font-black tracking-wider transition-all cursor-pointer ${
                    node.status === 'CLOSED'
                      ? 'bg-emerald-500/20 hover:bg-emerald-500/35 text-emerald-400 border border-emerald-500/40'
                      : 'bg-rose-500/20 hover:bg-rose-500/35 text-rose-400 border border-rose-500/40'
                  }`}
                >
                  {node.status === 'CLOSED' ? '🔴 CLOSED' : '🟢 TRIP'}
                </button>

                {/* Flow indicator bar */}
                <div className={`h-1 w-full rounded-full mt-1.5 ${
                  isNodeActive ? 'bg-emerald-500 animate-pulse shadow-[0_0_4px_rgba(16,185,129,0.85)]' : 'bg-rose-600'
                }`} />
              </div>

              {/* Children Nodes */}
              {node.children && node.children.length > 0 && (
                <div className="w-full flex flex-col items-center mt-2 relative">
                  <div className={`w-[3px] h-3 transition-all duration-300 ${
                    isChildrenConnectionActive ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)]' : 'bg-rose-600'
                  }`} />
                  <div className={`w-1.5 h-1.5 rounded-full z-10 ${
                    isChildrenConnectionActive ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,1.0)] animate-ping' : 'bg-rose-500'
                  }`} />
                  <div className={`w-[85%] h-[2px] rounded-full -mt-[3px] transition-all duration-300 ${
                    isChildrenConnectionActive ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)]' : 'bg-rose-600'
                  }`} />
                  <div className={`w-[3px] h-3 transition-all duration-300 ${
                    isChildrenConnectionActive ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)]' : 'bg-rose-600'
                  }`} />
                  <div className="w-full pl-2 border-l border-teal-950/40">
                    {renderJtmNodeTree(node.children, isNodeActive, feederId, depth + 1)}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#010e0c] text-teal-400 p-8 h-screen font-sans">
        <RefreshCw className="w-10 h-10 animate-spin mb-4 text-teal-500" />
        <span className="text-sm font-bold tracking-wider animate-pulse">Memuat Sistem Monitoring SCADA DCC...</span>
      </div>
    );
  }

  return (
    <div className={`flex flex-col bg-[#010e0c] text-slate-100 min-h-screen transition-all duration-300 font-sans select-none ${
      isFullscreen ? 'fixed inset-0 z-[9999] w-screen h-screen' : 'relative w-full'
    }`}>
      {/* Dynamic Glow CSS styles */}
      <style>{`
        .scada-grid {
          background-image: radial-gradient(rgba(13, 148, 136, 0.08) 1.5px, transparent 1.5px);
          background-size: 24px 24px;
        }
        @keyframes flowPulse {
          0%, 100% { opacity: 0.95; transform: scaleY(1); }
          50% { opacity: 0.75; transform: scaleY(1.05); }
        }
        .glowing-flow-green {
          box-shadow: 0 0 14px rgba(16, 185, 129, 0.85);
        }
        .glowing-flow-red {
          box-shadow: 0 0 6px rgba(239, 68, 68, 0.5);
        }
      `}</style>

      {/* 1. Cockpit Header Row */}
      <div className="bg-[#021815] border-b border-teal-950 px-5 py-3.5 flex flex-wrap items-center justify-between gap-4 shrink-0 shadow-lg relative z-20">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#012521] border border-teal-500/30 text-teal-400 animate-pulse shadow-[0_0_10px_rgba(20,184,166,0.15)]">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-wider text-teal-300 uppercase">Single Line Diagram (SLD) 20kV Interaktif</h1>
            <p className="text-[10px] text-teal-400/80 font-bold tracking-wide">Monitoring Kompartemen Busbar & Penyulang Sistem Tenaga Listrik Ril-Time</p>
          </div>
        </div>

        {/* Global Action Tools */}
        <div className="flex items-center gap-2">
          {/* Telemetri Live Mode Toggle */}
          <button
            onClick={() => {
              const nextVal = !dccState.telemetryOn;
              setDccState(prev => ({ ...prev, telemetryOn: nextVal }));
              updateDccStateInDb({ ...dccState, telemetryOn: nextVal });
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black border transition-all cursor-pointer ${
              dccState.telemetryOn 
                ? 'bg-teal-500/20 border-teal-400 text-teal-300 shadow-[0_0_10px_rgba(20,184,166,0.25)]' 
                : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}
          >
            <Activity className={`w-3.5 h-3.5 ${dccState.telemetryOn ? 'animate-bounce' : ''}`} />
            <span>Telemetri {dccState.telemetryOn ? 'AKTIF' : 'MATI'}</span>
          </button>

          {/* Legend Button */}
          <button
            onClick={() => setShowLegenda(!showLegenda)}
            className={`px-3 py-1.5 rounded-xl text-xs font-black cursor-pointer border transition-all ${
              showLegenda ? 'bg-teal-600 text-teal-950 border-teal-400 font-extrabold' : 'bg-[#012823] hover:bg-teal-900/60 border-teal-800 text-teal-300'
            }`}
          >
            <span>Legenda</span>
          </button>

          {/* Zoom Controls */}
          <div className="flex items-center bg-[#011a17] border border-teal-900/80 rounded-xl px-2.5 py-1 text-xs gap-2">
            <button 
              onClick={() => setZoomLevel(Math.max(60, zoomLevel - 10))} 
              className="font-extrabold text-teal-400 hover:text-white px-1 active:scale-90"
              title="Perkecil"
            >
              -
            </button>
            <span className="font-extrabold text-teal-200 min-w-[36px] text-center">{zoomLevel}%</span>
            <button 
              onClick={() => setZoomLevel(Math.min(130, zoomLevel + 10))} 
              className="font-extrabold text-teal-400 hover:text-white px-1 active:scale-90"
              title="Perbesar"
            >
              +
            </button>
          </div>

          {/* Reset button */}
          <button
            onClick={handleResetToDefaults}
            className="p-1.5 rounded-xl bg-[#012823] hover:bg-rose-950/45 border border-teal-800 hover:border-rose-800 text-teal-400 hover:text-rose-400 cursor-pointer transition-all active:scale-95"
            title="Setel Ulang Struktur"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded-xl bg-[#022a25] hover:bg-teal-900/50 border border-teal-700 text-teal-300 cursor-pointer transition-all"
            title={isFullscreen ? "Keluar Layar Penuh" : "Mode Layar Penuh"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Cloud status bar */}
      {saveStatus !== 'IDLE' && (
        <div className={`px-4 py-1 text-[11px] font-bold text-center flex items-center justify-center gap-1.5 transition-all relative z-15 ${
          saveStatus === 'SAVING' ? 'bg-amber-600/30 text-amber-200 border-b border-amber-900/30' :
          saveStatus === 'SUCCESS' ? 'bg-emerald-600/30 text-emerald-200 border-b border-emerald-900/30' : 'bg-rose-600/30 text-rose-200 border-b border-rose-900/30'
        }`}>
          {saveStatus === 'SAVING' && <RefreshCw className="w-3 h-3 animate-spin" />}
          {saveStatus === 'SUCCESS' && <Check className="w-3 h-3" />}
          {saveStatus === 'ERROR' && <AlertTriangle className="w-3 h-3" />}
          <span>
            {saveStatus === 'SAVING' && 'Menyinkronkan status SLD ke Cloud database...'}
            {saveStatus === 'SUCCESS' && 'Kondisi sirkuit & pilihan gardu berhasil disimpan permanen di Cloud!'}
            {saveStatus === 'ERROR' && 'Perubahan berhasil dicadangkan di penyimpanan lokal (offline).'}
          </span>
        </div>
      )}

      {/* 2. STATION OPTION SELECTOR (GI / PLTD / GH Selection Switcher) */}
      <div className="bg-[#011412] border-b border-teal-950 px-5 py-3.5 flex flex-wrap items-center justify-between gap-4 shrink-0 relative z-10">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-black text-teal-400 tracking-wider mr-2 uppercase">Sistem Monitoring Terpilih:</span>
          
          {(Object.values(dccState.stations) as StationConfig[]).map((station) => {
            const isActive = station.id === dccState.activeStationId;
            const typeBadgeColor = {
              GI: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
              PLTD: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
              GH: 'bg-purple-500/10 text-purple-400 border-purple-500/20'
            }[station.type];

            return (
              <div key={station.id} className="flex items-center gap-1">
                <button
                  onClick={() => {
                    const newState = { ...dccState, activeStationId: station.id };
                    setDccState(newState);
                    updateDccStateInDb(newState);
                  }}
                  className={`px-3 py-1.5 rounded-xl border text-[11px] font-black tracking-wide flex items-center gap-2 transition-all cursor-pointer ${
                    isActive 
                      ? 'bg-gradient-to-r from-teal-950 to-emerald-950 text-teal-200 border-teal-400 shadow-[0_0_12px_rgba(16,185,129,0.3)] hover:brightness-110 scale-105' 
                      : 'bg-teal-950/20 border-teal-950 text-teal-500/75 hover:bg-teal-950/40 hover:text-teal-400'
                  }`}
                >
                  {station.type === 'GI' && <Shield className="w-3.5 h-3.5" />}
                  {station.type === 'PLTD' && <SlidersHorizontal className="w-3.5 h-3.5" />}
                  {station.type === 'GH' && <Network className="w-3.5 h-3.5" />}
                  <span>{station.name}</span>
                  <span className={`text-[8px] px-1 rounded-md border tracking-tighter ${typeBadgeColor}`}>{station.type}</span>
                </button>

                {/* Individual Station deletion button if > 1 station exists */}
                {Object.keys(dccState.stations).length > 1 && (
                  <button
                    onClick={() => handleDeleteStation(station.id)}
                    className="p-1 rounded bg-[#0b211d] border border-teal-950 hover:bg-rose-950/40 hover:text-rose-400 text-slate-500 transition-all cursor-pointer active:scale-90"
                    title={`Hapus Sistem ${station.name}`}
                  >
                    <Trash className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}

          {/* Create Station Button */}
          <button
            onClick={() => setShowAddStationModal(true)}
            className="px-3 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-[11px] font-black flex items-center gap-1.5 cursor-pointer shadow-md shadow-teal-500/10 active:scale-95 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Buat Gardu Baru (GI/PLTD/GH)</span>
          </button>
        </div>

        {/* Action button inside the Active Station: Add Busbar */}
        {activeStation && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setNewBusbarName(`BUS 20kV - ${String.fromCharCode(65 + activeStation.buses.length)}`);
                setNewBusbarVoltage(20.0);
                setNewBusbarIncomer(activeStation.type === 'GI' ? `Trafo Daya ${activeStation.buses.length + 1} (60 MVA)` : activeStation.type === 'PLTD' ? `Generator G${activeStation.buses.length + 1}` : `Incomer Express Line ${activeStation.buses.length + 1}`);
                setShowAddBusbarModal(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-[#022e28] hover:bg-[#03443a] border border-teal-600/50 text-teal-300 text-[11px] font-extrabold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Busbar 20kV</span>
            </button>
          </div>
        )}
      </div>

      {/* 3. Main Cockpit Grid Workspace */}
      <div className="flex-1 flex overflow-hidden scada-grid relative">
        
        {/* Dynamic single line diagram workspace canvas */}
        {activeStation ? (
          <div className="flex-1 overflow-auto p-6 flex flex-col justify-start items-center">
            
            {/* Station Status Info Summary */}
            <div className="w-full max-w-7xl bg-[#021c19]/65 border border-teal-950/80 p-4 rounded-2xl mb-6 flex flex-wrap justify-between items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-teal-950 text-teal-400">
                  <Server className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-slate-200">INFORMASI INSTALASI</h2>
                  <p className="text-[10px] text-teal-400 font-extrabold">
                    {activeStation.name} &bull; Tipe: {activeStation.type === 'GI' ? 'GARDU INDUK 150kV/20kV' : activeStation.type === 'PLTD' ? 'PEMBANGKIT DIESEL 20kV' : 'GARDU HUBUNG 20kV'}
                  </p>
                </div>
              </div>

              <div className="flex gap-4 text-xs font-bold text-slate-300">
                {/* Mode Operasi Jaringan */}
                <button 
                  onClick={() => {
                    const nextMode = operationMode === 'RADIAL' ? 'LOOP' : 'RADIAL';
                    setOperationMode(nextMode);
                  }}
                  className="px-3 py-1 bg-slate-900/30 hover:bg-slate-900/50 rounded-lg border border-teal-950 flex flex-col items-center min-w-[110px] transition-all active:scale-95 cursor-pointer group"
                  title="Klik untuk mengubah mode operasi jaringan antara Radial (Satu Arah) dan Loop / Ring (Maneuver Cadangan Aktif)"
                >
                  <span className="text-[9px] text-teal-500/70 group-hover:text-teal-400 transition-colors">Sistem Jaringan</span>
                  <span className={`font-black text-[9px] px-2 py-0.5 rounded mt-0.5 transition-all flex items-center gap-1 ${
                    operationMode === 'LOOP' 
                      ? 'bg-emerald-500 text-slate-950 border border-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.55)]' 
                      : 'bg-rose-500 text-white border border-rose-300'
                  }`}>
                    {operationMode === 'LOOP' ? '⚡ LOOP / RING' : '🔌 RADIAL'}
                  </span>
                </button>

                <div className="px-3 py-1 bg-slate-900/30 rounded-lg border border-teal-950 flex flex-col items-center min-w-[70px]">
                  <span className="text-[9px] text-teal-500/70">Busbar</span>
                  <span className="text-amber-300 font-black text-sm">{activeStation.buses.length}</span>
                </div>
                <div className="px-3 py-1 bg-slate-900/30 rounded-lg border border-teal-950 flex flex-col items-center min-w-[70px]">
                  <span className="text-[9px] text-teal-500/70">Penyulang</span>
                  <span className="text-amber-300 font-black text-sm">{activeStation.feeders.length}</span>
                </div>
                <button 
                  onClick={handleToggleKopel}
                  className="px-3 py-1 bg-slate-900/30 hover:bg-slate-900/50 rounded-lg border border-teal-950 flex flex-col items-center min-w-[75px] transition-all active:scale-95 cursor-pointer group"
                  title="Klik untuk mengubah status PMT Kopel"
                >
                  <span className="text-[9px] text-teal-500/70 group-hover:text-teal-400 transition-colors">PMT Kopel</span>
                  <span className={`font-black text-[9px] px-1.5 py-0.5 rounded mt-0.5 transition-all ${
                    activeStation.pmtKopelStatus === 'CLOSED' 
                      ? 'bg-emerald-500 text-slate-950 border border-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.5)]' 
                      : 'bg-rose-500 text-white border border-rose-300'
                  }`}>
                    {activeStation.pmtKopelStatus === 'CLOSED' ? 'CLOSED' : 'OPEN'}
                  </span>
                </button>
              </div>
            </div>

            {/* Layout Canvas inside standard container */}
            <div 
              className="relative bg-[#02110f]/90 border border-teal-950/80 shadow-2xl rounded-3xl p-6 md:p-10 transition-transform duration-200 origin-top w-full max-w-7xl"
              style={{ transform: `scale(${zoomLevel / 100})` }}
            >
              
              {/* Dynamic Grid of Busbars arranged side-by-side as distinct vertical columns! */}
              <div className={`grid grid-cols-1 gap-12 relative ${
                activeStation.buses.length === 2 ? 'md:grid-cols-2 max-w-5xl mx-auto' : 'md:grid-cols-2 lg:grid-cols-3'
              }`}>
                
                {/* Loop buses in the station */}
                {activeStation.buses.map((bus, busIdx) => {
                  const isBusEnergized = busEnergizedMap[bus.id];
                  const busFeeders = activeStation.feeders.filter(f => f.busId === bus.id);

                  return (
                    <div key={bus.id} className="flex flex-col items-center border border-teal-950/35 bg-[#011412]/30 p-4 rounded-2xl relative">
                      
                      {/* INCOMING SOURCE HEADER */}
                      <div className="w-full flex flex-col items-center mb-6">
                        {/* Source representation card */}
                        <div 
                          onClick={() => setEditingComponent({ type: 'incomer', id: bus.id, data: { incomerName: bus.incomerName } })}
                          className="px-3 py-2 bg-slate-900 border-2 border-teal-800 hover:border-amber-400 rounded-xl flex flex-col items-center min-w-[150px] shadow-md cursor-pointer transition-all active:scale-95"
                        >
                          <span className="text-[8px] font-bold text-teal-400 uppercase tracking-widest">Incoming Sumber</span>
                          <span className="text-[10px] font-extrabold text-slate-100 mt-1 flex items-center gap-1.5">
                            {activeStation.type === 'GI' && <Layers className="w-3 h-3 text-teal-400" />}
                            {activeStation.type === 'PLTD' && <SlidersHorizontal className="w-3 h-3 text-amber-400" />}
                            {activeStation.type === 'GH' && <Power className="w-3 h-3 text-purple-400" />}
                            <span>{bus.incomerName}</span>
                          </span>
                        </div>

                        {/* Solid Connecting Line from Source down to Incomer Breaker */}
                        <div className={`w-[3px] h-6 transition-all duration-300 ${
                          bus.incomerBreakerStatus === 'CLOSED' 
                            ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' 
                            : 'bg-rose-600 shadow-[0_0_4px_rgba(239,68,68,0.4)]'
                        }`} />

                        {/* Clickable Incomer Breaker (PMT Incomer) */}
                        <div className="flex items-center gap-1.5 bg-[#021815] p-1 border border-teal-900 rounded-xl shadow-md">
                          <button
                            onClick={() => handleToggleIncomerBreaker(bus.id)}
                            className={`w-6 h-6 rounded text-[9px] font-black flex items-center justify-center cursor-pointer transition-all ${
                              bus.incomerBreakerStatus === 'CLOSED'
                                ? 'bg-emerald-500 text-slate-950 border border-emerald-300'
                                : 'bg-rose-500 text-white border border-rose-300 animate-pulse'
                            }`}
                          >
                            {bus.incomerBreakerStatus === 'CLOSED' ? 'C' : 'T'}
                          </button>
                          <span className="text-[8px] font-black text-teal-400 pr-1 select-none">PMT INCOMER</span>
                        </div>

                        {/* Line leading directly into the Busbar */}
                        <div className={`w-[3px] h-6 transition-all duration-300 ${
                          bus.incomerBreakerStatus === 'CLOSED'
                            ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]'
                            : 'bg-rose-600 shadow-[0_0_4px_rgba(239,68,68,0.4)]'
                        }`} />
                      </div>

                      {/* BUSBAR COPPER BAR */}
                      <div className="w-full relative px-2 mb-6">
                        {/* Actual horizontal copper glowing bar representing the busbar! */}
                        <div className={`w-full h-3.5 rounded-full transition-all duration-300 ${
                          isBusEnergized 
                            ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.9)]' 
                            : 'bg-rose-600 shadow-[0_0_6px_rgba(239,68,68,0.5)]'
                        }`} />

                        {/* Busbar Parameter Label Box */}
                        <div className="w-full flex justify-between items-center mt-2.5 bg-teal-950/90 border border-teal-800 px-3 py-1.5 rounded-xl shadow-md">
                          <div 
                            onClick={() => setEditingComponent({ type: 'bus', id: bus.id, data: { name: bus.name, voltageKv: bus.voltageKv } })}
                            className="text-left cursor-pointer hover:text-amber-300 transition-all"
                            title="Edit parameter busbar"
                          >
                            <span className="text-[9px] font-bold block text-teal-300">{bus.name}</span>
                            <span className={`text-[11px] font-black ${isBusEnergized ? 'text-teal-100' : 'text-rose-400'}`}>
                              {bus.voltageKv} kV
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {/* Add Feeder button */}
                            <button
                              onClick={() => {
                                setNewFeederCode(`F-${busFeeders.length + 1}`);
                                setNewFeederName(`Penyulang Baru ${busFeeders.length + 1}`);
                                setNewFeederCurrent(180);
                                setNewFeederCosPhi(0.95);
                                setShowAddFeederModal(bus.id);
                              }}
                              className="p-1 rounded bg-[#032e28] hover:bg-teal-600 hover:text-slate-950 text-teal-400 transition-all cursor-pointer border border-teal-500/30"
                              title="Tambah Penyulang (Feeder)"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete Busbar button */}
                            <button
                              onClick={() => handleDeleteBusbar(bus.id)}
                              className="p-1 rounded bg-slate-900 hover:bg-rose-950/40 hover:text-rose-400 text-slate-500 transition-all cursor-pointer"
                              title="Hapus Busbar ini"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Dynamic loop of Feeders underneath this specific Busbar */}
                      <div className="w-full grid grid-cols-1 gap-6 pt-4 border-t border-teal-950/50">
                        {busFeeders.length === 0 ? (
                          <div className="text-[10px] text-slate-500 text-center py-6 px-3 border border-dashed border-teal-950/30 rounded-2xl bg-teal-950/5">
                            Belum ada feeder terhubung. Klik tombol "+" di atas untuk menambahkan.
                          </div>
                        ) : (
                          busFeeders.map((feeder) => {
                            const isFeederActive = isBusEnergized && feeder.status === 'CLOSED';
                            const jtmNodes = activeStation.downstreamNodes[feeder.id] || [];

                            return (
                              <div key={feeder.id} className="flex flex-col items-center bg-[#011c19]/35 border border-teal-950/60 p-3 rounded-2xl shadow-sm relative">
                                
                                {/* Connector Line leading down to breaker */}
                                <div className={`w-[2.5px] h-5 transition-all duration-300 ${
                                  isBusEnergized 
                                    ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.85)]' 
                                    : 'bg-rose-600 shadow-[0_0_4px_rgba(239,68,68,0.55)]'
                                }`} />

                                {/* Feeder Breaker Switch button */}
                                <div className="bg-[#021815] px-1.5 py-0.5 rounded-lg border border-teal-950 mb-3 flex items-center gap-1.5">
                                  <button
                                    onClick={() => handleToggleFeederBreaker(feeder.id)}
                                    className={`w-6 h-6 rounded text-[9px] font-black flex items-center justify-center cursor-pointer transition-all ${
                                      feeder.status === 'CLOSED'
                                        ? 'bg-emerald-500 text-slate-950 border border-emerald-300'
                                        : 'bg-rose-500 text-white border border-rose-300 animate-pulse'
                                    }`}
                                    title={`Toggle PMT ${feeder.code}`}
                                  >
                                    {feeder.status === 'CLOSED' ? 'C' : 'T'}
                                  </button>
                                  <span className="text-[8px] font-black text-teal-400 select-none">PMT {feeder.code}</span>
                                </div>

                                {/* Line from breaker into the actual Feeder card */}
                                <div className={`w-[2.5px] h-3 transition-all duration-300 ${
                                  isFeederActive 
                                    ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.85)]' 
                                    : 'bg-rose-600 shadow-[0_0_4px_rgba(239,68,68,0.55)]'
                                }`} />

                                {/* THE FEEDER TELEMETRY CARD */}
                                <div className={`w-full rounded-2xl border bg-[#011412] p-3 shadow-md transition-all relative ${
                                  feeder.status === 'CLOSED'
                                    ? isFeederActive 
                                      ? 'border-emerald-500/60 shadow-md shadow-emerald-950/20' 
                                      : 'border-emerald-800/40'
                                    : 'border-rose-800/60 shadow-md shadow-rose-950/20'
                                }`}>
                                  
                                  {/* Feeder header info & status badge */}
                                  <div className="flex justify-between items-center border-b border-teal-950 pb-1.5 mb-2">
                                    <span className={`text-[10px] font-black ${feeder.status === 'TRIP' ? 'text-rose-400' : 'text-teal-300'}`}>{feeder.code}</span>
                                    <span className={`text-[8px] px-1.5 py-0.5 rounded font-black tracking-tight border ${
                                      feeder.status === 'TRIP' 
                                        ? 'bg-rose-900/30 text-rose-400 border-rose-500/30 animate-pulse' 
                                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                    }`}>
                                      {feeder.status === 'CLOSED' ? 'CLOSED / AKTIF' : 'TRIP / GANGGUAN'}
                                    </span>
                                  </div>

                                  {/* Name */}
                                  <div className="text-[10px] font-extrabold text-slate-100 mb-2 truncate" title={feeder.name}>
                                    {feeder.name}
                                  </div>

                                  {/* Metrics parameters */}
                                  <div className="space-y-1 text-[9px] text-slate-300 border-b border-teal-950 pb-2 mb-2">
                                    <div className="flex justify-between">
                                      <span>Arus (I):</span>
                                      <span className={`font-extrabold ${!isFeederActive ? 'text-rose-400' : 'text-amber-400'}`}>
                                        {feeder.currentA} A
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>Daya Aktif (P):</span>
                                      <span className="font-extrabold">{feeder.powerMw} MW</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>Tegangan (V):</span>
                                      <span className="font-extrabold">{feeder.voltageKv} kV</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>Faktor Daya (cos φ):</span>
                                      <span className="font-extrabold text-amber-400/85">{feeder.cosPhi.toFixed(3)}</span>
                                    </div>
                                  </div>

                                  {/* Display Looping Backup info if this feeder is backup-feeding other dead paths */}
                                  {(() => {
                                    const activeLoopBacks = getActiveLoopedNodesForFeeder(activeStation, feeder.id, busEnergizedMap, operationMode);
                                    if (activeLoopBacks.length > 0) {
                                      return (
                                        <div className="mb-2.5 p-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[8px] space-y-1 select-text">
                                          <div className="flex items-center gap-1 font-extrabold text-emerald-400 animate-pulse">
                                            <Layers className="w-2.5 h-2.5 text-teal-400" />
                                            <span>BEBAN LOOP AKTIF (+{activeLoopBacks.reduce((sum, item) => sum + item.loadA, 0)} A)</span>
                                          </div>
                                          <div className="text-[7.5px] text-slate-300 space-y-0.5 max-h-[60px] overflow-y-auto pr-1">
                                            {activeLoopBacks.map((loop, idx) => (
                                              <div key={idx} className="flex justify-between border-b border-teal-950/20 pb-0.5 last:border-0 last:pb-0">
                                                <span className="truncate max-w-[120px]">{loop.nodeName} ({loop.originalFeederName})</span>
                                                <span className="font-extrabold text-amber-400">+{loop.loadA} A</span>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      );
                                    }
                                    return null;
                                  })()}

                                  {/* Actions Panel */}
                                  <div className="flex justify-between items-center gap-1.5 pt-0.5">
                                    {/* Edit Feeder */}
                                    <button
                                      onClick={() => setEditingComponent({ type: 'feeder', id: feeder.id, data: { ...feeder } })}
                                      className="p-1 rounded bg-[#012521] hover:bg-[#033f38] text-teal-400 cursor-pointer border border-teal-500/20 active:scale-90 transition-all text-[8px] font-black flex items-center gap-1"
                                      title="Edit Parameter Feeder"
                                    >
                                      <Settings className="w-3 h-3" />
                                      <span>Edit</span>
                                    </button>

                                    {/* Delete Feeder */}
                                    <button
                                      onClick={() => handleDeleteFeeder(feeder.id)}
                                      className="p-1 rounded bg-slate-900 hover:bg-rose-950 hover:text-rose-400 text-slate-400 cursor-pointer transition-all active:scale-90 text-[8px] font-black flex items-center gap-1"
                                      title="Hapus Feeder"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                      <span>Hapus</span>
                                    </button>

                                    {/* Add JTM Node */}
                                    <button
                                      onClick={() => {
                                        setAddingNodeForFeeder(feeder.id);
                                        setAddingNodeParentId(null);
                                        setNewNodeName(`LBS Penyulang ${feeder.code}`);
                                        setNewNodeType('LBS');
                                        setNewNodeStatus('CLOSED');
                                      }}
                                      className="p-1 rounded bg-teal-500 hover:bg-teal-400 text-slate-950 font-black cursor-pointer shadow-xs active:scale-90 transition-all text-[8px] flex items-center gap-1"
                                      title="Tambah JTM"
                                    >
                                      <Plus className="w-3 h-3" />
                                      <span>+ JTM</span>
                                    </button>
                                  </div>
                                </div>

                                {/* Solid Line down from Feeder card leading into sequential Downstream JTM Network */}
                                <div className={`w-[2.5px] h-5 transition-all duration-300 ${
                                  (isFeederActive || (jtmNodes[0] && nodeEnergizedStates[jtmNodes[0].id]?.incomingActive))
                                    ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.85)]' 
                                    : 'bg-rose-600 shadow-[0_0_4px_rgba(239,68,68,0.55)]'
                                }`} />

                                {/* 4. DOWNSTREAM JTM GRID & CASCADE POWER PROPAGATION */}
                                <div className="w-full">
                                  {jtmNodes.length === 0 ? (
                                    <div className="text-[8px] text-slate-500 text-center py-2 px-1 border border-dashed border-teal-950/30 rounded-xl bg-teal-950/5">
                                      Belum ada GH/LBS/Recloser
                                    </div>
                                  ) : (
                                    renderJtmNodeTree(jtmNodes, isFeederActive, feeder.id)
                                  )}
                                </div>

                              </div>
                            );
                          })
                        )}
                      </div>

                    </div>
                  );
                })}

                {/* CENTRAL PMT KOPEL BRIDGE - Displayed dynamically if exactly 2 busbars are in GI */}
                {activeStation.buses.length === 2 && (
                  <div className="absolute top-[144px] left-[25%] right-[25%] hidden md:flex flex-col items-center justify-center z-15 pointer-events-auto">
                    {/* Horizontal link bar connecting Bus A and Bus B columns */}
                    <div className="w-full flex items-center justify-between px-6 relative">
                      {/* Left segment - connected directly to Busbar A */}
                      <div className={`h-[3px] flex-1 transition-all duration-300 ${
                        busEnergizedMap[activeStation.buses[0].id]
                          ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.85)]'
                          : 'bg-rose-600 shadow-[0_0_4px_rgba(239,68,68,0.5)]'
                      }`} />

                      {/* Breaker switch button for Bus Kopel */}
                      <div className="bg-[#021815] p-1 border border-teal-900 rounded-xl flex items-center gap-1.5 shadow-lg mx-2 z-20">
                        <button
                          onClick={handleToggleKopel}
                          className={`w-7 h-7 rounded-lg text-[10px] font-black flex items-center justify-center cursor-pointer transition-all hover:scale-110 active:scale-90 ${
                            activeStation.pmtKopelStatus === 'CLOSED'
                              ? 'bg-emerald-500 text-slate-950 border border-emerald-300'
                              : 'bg-rose-500 text-white border border-rose-300 animate-pulse'
                          }`}
                          title="Kopel Bus A & Bus B"
                        >
                          {activeStation.pmtKopelStatus === 'CLOSED' ? 'C' : 'T'}
                        </button>
                        <span className="text-[8px] font-black text-teal-300 pr-1 select-none">PMT KOPEL</span>
                      </div>

                      {/* Right segment - connected directly to Busbar B */}
                      <div className={`h-[3px] flex-1 transition-all duration-300 ${
                        busEnergizedMap[activeStation.buses[1].id]
                          ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.85)]'
                          : 'bg-rose-600 shadow-[0_0_4px_rgba(239,68,68,0.5)]'
                      }`} />
                    </div>
                  </div>
                )}

              </div>

              {/* Station Kopel controller (as fallback for stations with 1 or >2 buses) */}
              {activeStation.buses.length !== 2 && (
                <div className="w-full mt-8 pt-4 border-t border-teal-950/40 flex justify-center">
                  <div className="bg-[#021815] px-4 py-2 border border-teal-900/60 rounded-xl flex items-center gap-3">
                    <span className="text-[10px] font-bold text-teal-400">STATUS KOPEL INTER-BUSBAR:</span>
                    <button
                      onClick={handleToggleKopel}
                      className={`px-3 py-1 rounded text-[10px] font-black cursor-pointer transition-all ${
                        activeStation.pmtKopelStatus === 'CLOSED'
                          ? 'bg-emerald-500 text-slate-950'
                          : 'bg-rose-500 text-white'
                      }`}
                    >
                      {activeStation.pmtKopelStatus === 'CLOSED' ? '🔴 CLOSED (Koneksi Inter-Bus)' : '🟢 OPEN (Terisolasi)'}
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-teal-400 p-8 h-screen font-sans">
            <Sliders className="w-10 h-10 animate-bounce mb-4 text-teal-500" />
            <span className="text-sm font-bold tracking-wider">Silakan pilih atau tambahkan sistem monitoring SCADA.</span>
          </div>
        )}

        {/* Floating Side Legenda & Quick Panel */}
        {showLegenda && (
          <div className="absolute bottom-5 left-5 z-20 bg-[#021815]/95 border border-teal-800 rounded-2xl p-4 shadow-2xl max-w-[290px] backdrop-blur-md animate-fade-in text-[10px] space-y-3">
            <div className="flex items-center justify-between border-b border-teal-900 pb-1.5 mb-2">
              <span className="font-black text-teal-300 uppercase">Legenda Simbol DCC</span>
              <button onClick={() => setShowLegenda(false)} className="text-slate-400 hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            
            <div className="space-y-2 font-mono">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-emerald-500 text-slate-950 rounded flex items-center justify-center font-black text-[8px]">C</div>
                <span className="text-slate-200">PMT / Breaker **CLOSED** (Kondisi Tersambung)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-rose-500 text-white rounded flex items-center justify-center font-black text-[8px]">T</div>
                <span className="text-slate-200">PMT / Breaker **TRIP / OPEN** (Mati / Putus)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-0.5 bg-[#22c55e] shadow-xs shadow-emerald-500" />
                <span className="text-slate-200 font-bold">Garis Hijau (Energized / Bertegangan)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-0.5 bg-[#ef4444] shadow-xs shadow-rose-500" />
                <span className="text-slate-200 font-bold">Garis Merah (De-Energized / Padam)</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-teal-400" />
                <span className="text-slate-200">GI - Gardu Induk 150/20kV</span>
              </div>
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-amber-400" />
                <span className="text-slate-200">PLTD - Pembangkit Diesel</span>
              </div>
              <div className="flex items-center gap-2">
                <Network className="w-4 h-4 text-purple-400" />
                <span className="text-slate-200">GH - Gardu Hubung</span>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ================= MODAL WINDOWS ================= */}

      {/* A. Create New Station Modal */}
      {showAddStationModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center z-[9999] p-4 font-sans select-text">
          <div className="bg-[#021a17] border-2 border-teal-500 rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
            <button 
              onClick={() => setShowAddStationModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4 border-b border-teal-900 pb-3">
              <PlusCircle className="w-5 h-5 text-teal-400" />
              <h3 className="text-sm font-black text-teal-300 uppercase">
                Buat Sistem Monitoring Baru
              </h3>
            </div>

            <form onSubmit={handleCreateStationSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-teal-400 mb-1">Nama Gardu / Sistem</label>
                <input 
                  type="text"
                  placeholder="Contoh: GI DEPOK, PLTD BALI, GH SUDIRMAN"
                  className="w-full bg-[#011412] border border-teal-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 font-bold uppercase"
                  value={newStationName}
                  onChange={(e) => setNewStationName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-teal-400 mb-2">Jenis Instalasi</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['GI', 'PLTD', 'GH'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setNewStationType(type)}
                      className={`py-2 px-2 rounded-xl text-xs font-black tracking-wider transition-all border cursor-pointer ${
                        newStationType === type
                          ? 'bg-teal-500/25 border-teal-400 text-teal-300 shadow-md shadow-teal-900/30'
                          : 'bg-[#011412] border-teal-900/50 text-slate-400 hover:border-teal-700'
                      }`}
                    >
                      {type === 'GI' && 'GI (Gardu Induk)'}
                      {type === 'PLTD' && 'PLTD (Diesel)'}
                      {type === 'GH' && 'GH (Hubung)'}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-teal-500/70 font-bold mt-2 leading-relaxed">
                  * Sistem akan otomatis merancang skema standard (Busbar & Feeder penyulang) sesuai tipe instalasi yang dipilih.
                </p>
              </div>

              <div className="flex gap-2 pt-3 border-t border-teal-900 justify-end">
                <button 
                  type="button"
                  onClick={() => setShowAddStationModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-300 hover:text-white bg-slate-900 border border-slate-800 text-xs font-black cursor-pointer"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 rounded-xl text-teal-950 bg-gradient-to-tr from-teal-400 via-teal-300 to-emerald-300 font-extrabold text-xs shadow-md hover:scale-[1.02] active:scale-95 cursor-pointer"
                >
                  Buat Sistem
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* B. Create New Busbar Modal */}
      {showAddBusbarModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center z-[9999] p-4 font-sans select-text">
          <div className="bg-[#021a17] border-2 border-teal-500 rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
            <button 
              onClick={() => setShowAddBusbarModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4 border-b border-teal-900 pb-3">
              <PlusCircle className="w-5 h-5 text-teal-400" />
              <h3 className="text-sm font-black text-teal-300 uppercase">
                Tambah Busbar 20kV Baru
              </h3>
            </div>

            <form onSubmit={handleAddBusbarSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-teal-400 mb-1">Nama Busbar</label>
                <input 
                  type="text"
                  placeholder="Contoh: BUS 20kV - C"
                  className="w-full bg-[#011412] border border-teal-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 font-bold uppercase"
                  value={newBusbarName}
                  onChange={(e) => setNewBusbarName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-teal-400 mb-1">Tegangan Nominal (kV)</label>
                <input 
                  type="number"
                  step="0.01"
                  className="w-full bg-[#011412] border border-teal-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 font-bold"
                  value={newBusbarVoltage}
                  onChange={(e) => setNewBusbarVoltage(parseFloat(e.target.value) || 20.0)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-teal-400 mb-1">Nama Sumber / Incomer</label>
                <input 
                  type="text"
                  placeholder="Contoh: Trafo 3, Diesel G2, Incomer Sirih"
                  className="w-full bg-[#011412] border border-teal-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 font-bold"
                  value={newBusbarIncomer}
                  onChange={(e) => setNewBusbarIncomer(e.target.value)}
                  required
                />
              </div>

              <div className="flex gap-2 pt-3 border-t border-teal-900 justify-end">
                <button 
                  type="button"
                  onClick={() => setShowAddBusbarModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-300 hover:text-white bg-slate-900 border border-slate-800 text-xs font-black cursor-pointer"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 rounded-xl text-teal-950 bg-gradient-to-tr from-teal-400 via-teal-300 to-emerald-300 font-extrabold text-xs shadow-md hover:scale-[1.02] active:scale-95 cursor-pointer"
                >
                  Tambah Busbar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* C. Create New Feeder Modal */}
      {showAddFeederModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center z-[9999] p-4 font-sans select-text">
          <div className="bg-[#021a17] border-2 border-teal-500 rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
            <button 
              onClick={() => setShowAddFeederModal(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4 border-b border-teal-900 pb-3">
              <PlusCircle className="w-5 h-5 text-teal-400" />
              <h3 className="text-sm font-black text-teal-300 uppercase">
                Tambah Penyulang (Feeder) Baru
              </h3>
            </div>

            <form onSubmit={handleAddFeederSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-teal-400 mb-1">
                  Pilih dari Master Data Penyulang (Hubungkan):
                </label>
                <select
                  className="w-full bg-[#011412] border border-teal-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 font-bold cursor-pointer"
                  onChange={(e) => {
                    const selectedId = e.target.value;
                    const selectedP = masterPenyulangs.find(p => p.id === selectedId);
                    if (selectedP) {
                      setNewFeederCode(selectedP.kodeId || '');
                      setNewFeederName(selectedP.namaPenyulang || '');
                    } else {
                      setNewFeederCode('');
                      setNewFeederName('');
                    }
                  }}
                >
                  <option value="">-- Pilih dari Master Data (Autofill) --</option>
                  {masterPenyulangs.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.kodeId} - Penyulang {p.namaPenyulang}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-teal-400 mb-1">Kode Feeder</label>
                  <input 
                    type="text"
                    placeholder="Contoh: F-07"
                    className="w-full bg-[#011412] border border-teal-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 font-bold uppercase"
                    value={newFeederCode}
                    onChange={(e) => setNewFeederCode(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-teal-400 mb-1">Nama Feeder</label>
                  <input 
                    type="text"
                    placeholder="Contoh: Penyulang Sumbing"
                    className="w-full bg-[#011412] border border-teal-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 font-bold"
                    value={newFeederName}
                    onChange={(e) => setNewFeederName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-teal-400 mb-1">Beban Nominal (Ampere)</label>
                  <input 
                    type="number"
                    className="w-full bg-[#011412] border border-teal-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 font-bold"
                    value={newFeederCurrent}
                    onChange={(e) => setNewFeederCurrent(parseInt(e.target.value) || 180)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-teal-400 mb-1">cos φ (Power Factor)</label>
                  <input 
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    className="w-full bg-[#011412] border border-teal-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 font-bold"
                    value={newFeederCosPhi}
                    onChange={(e) => setNewFeederCosPhi(parseFloat(e.target.value) || 0.95)}
                    required
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-teal-900 justify-end">
                <button 
                  type="button"
                  onClick={() => setShowAddFeederModal(null)}
                  className="px-4 py-2 rounded-xl text-slate-300 hover:text-white bg-slate-900 border border-slate-800 text-xs font-black cursor-pointer"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 rounded-xl text-teal-950 bg-gradient-to-tr from-teal-400 via-teal-300 to-emerald-300 font-extrabold text-xs shadow-md hover:scale-[1.02] active:scale-95 cursor-pointer"
                >
                  Tambah Feeder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* D. Edit Parameter Modal (Handles Bus, Incomer, and Feeder modifications) */}
      {editingComponent && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center z-[9999] p-4 font-sans select-text">
          <div className="bg-[#021a17] border-2 border-teal-500 rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
            <button 
              onClick={() => setEditingComponent(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4 border-b border-teal-900 pb-3">
              <Settings className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm font-black text-teal-300 uppercase">
                Edit Parameter: {editingComponent.data.name || editingComponent.data.code || editingComponent.id}
              </h3>
            </div>

            <form onSubmit={handleSaveComponentEdit} className="space-y-4">
              
              {/* BUSBAR EDIT */}
              {editingComponent.type === 'bus' && (
                <div className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-teal-400 mb-1">Nama Busbar</label>
                    <input 
                      type="text"
                      className="w-full bg-[#011412] border border-teal-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 font-bold"
                      value={editingComponent.data.name}
                      onChange={(e) => setEditingComponent({
                        ...editingComponent,
                        data: { ...editingComponent.data, name: e.target.value }
                      })}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-teal-400 mb-1">Tegangan Operasional (kV)</label>
                    <input 
                      type="number"
                      step="0.01"
                      className="w-full bg-[#011412] border border-teal-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 font-bold"
                      value={editingComponent.data.voltageKv}
                      onChange={(e) => setEditingComponent({
                        ...editingComponent,
                        data: { ...editingComponent.data, voltageKv: parseFloat(e.target.value) || 0 }
                      })}
                      required
                    />
                  </div>
                </div>
              )}

              {/* INCOMER EDIT */}
              {editingComponent.type === 'incomer' && (
                <div className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-teal-400 mb-1">Nama Sumber / Incomer</label>
                    <input 
                      type="text"
                      className="w-full bg-[#011412] border border-teal-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 font-bold"
                      value={editingComponent.data.incomerName}
                      onChange={(e) => setEditingComponent({
                        ...editingComponent,
                        data: { ...editingComponent.data, incomerName: e.target.value }
                      })}
                      required
                    />
                  </div>
                </div>
              )}

              {/* FEEDER EDIT */}
              {editingComponent.type === 'feeder' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-teal-400 mb-1">
                      Hubungkan ke Master Data Penyulang:
                    </label>
                    <select
                      className="w-full bg-[#011412] border border-teal-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 font-bold cursor-pointer"
                      onChange={(e) => {
                        const selectedId = e.target.value;
                        const selectedP = masterPenyulangs.find(p => p.id === selectedId);
                        if (selectedP) {
                          setEditingComponent({
                            ...editingComponent,
                            data: {
                              ...editingComponent.data,
                              code: selectedP.kodeId || '',
                              name: selectedP.namaPenyulang || ''
                            }
                          });
                        }
                      }}
                    >
                      <option value="">-- Pilih dari Master Data (Autofill) --</option>
                      {masterPenyulangs.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.kodeId} - Penyulang {p.namaPenyulang}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-teal-400 mb-1">Kode Feeder</label>
                      <input 
                        type="text"
                        className="w-full bg-[#011412] border border-teal-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 font-bold uppercase"
                        value={editingComponent.data.code}
                        onChange={(e) => setEditingComponent({
                          ...editingComponent,
                          data: { ...editingComponent.data, code: e.target.value }
                        })}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-teal-400 mb-1">Nama Feeder</label>
                      <input 
                        type="text"
                        className="w-full bg-[#011412] border border-teal-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 font-bold"
                        value={editingComponent.data.name}
                        onChange={(e) => setEditingComponent({
                          ...editingComponent,
                          data: { ...editingComponent.data, name: e.target.value }
                        })}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-teal-400 mb-1">Arus Beban (Ampere)</label>
                      <input 
                        type="number"
                        className="w-full bg-[#011412] border border-teal-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 font-bold"
                        value={editingComponent.data.currentA}
                        onChange={(e) => setEditingComponent({
                          ...editingComponent,
                          data: { ...editingComponent.data, currentA: parseInt(e.target.value) || 0 }
                        })}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-teal-400 mb-1">cos φ (Faktor Daya)</label>
                      <input 
                        type="number"
                        step="0.001"
                        min="0"
                        max="1"
                        className="w-full bg-[#011412] border border-teal-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 font-bold"
                        value={editingComponent.data.cosPhi}
                        onChange={(e) => setEditingComponent({
                          ...editingComponent,
                          data: { ...editingComponent.data, cosPhi: parseFloat(e.target.value) || 1 }
                        })}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-teal-400 mb-1">Status Keandalan Feeder</label>
                    <select 
                      className="w-full bg-[#011412] border border-teal-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 font-bold cursor-pointer"
                      value={editingComponent.data.status}
                      onChange={(e) => setEditingComponent({
                        ...editingComponent,
                        data: { ...editingComponent.data, status: e.target.value as any }
                      })}
                    >
                      <option value="CLOSED">✅ BERTEGANGAN (CLOSED)</option>
                      <option value="TRIP">⚠️ GANGGUAN TRIP (OPEN)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-3 border-t border-teal-900 justify-end">
                <button 
                  type="button"
                  onClick={() => setEditingComponent(null)}
                  className="px-4 py-2 rounded-xl text-slate-300 hover:text-white bg-slate-900 border border-slate-800 text-xs font-black cursor-pointer"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 rounded-xl text-teal-950 bg-gradient-to-tr from-teal-400 via-teal-300 to-emerald-300 font-extrabold text-xs shadow-md shadow-teal-400/20 hover:scale-[1.02] active:scale-95 cursor-pointer"
                >
                  Simpan Perubahan
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* E. Add Downstream Node Modal */}
      {addingNodeForFeeder && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center z-[9999] p-4 font-sans select-text">
          <div className="bg-[#021a17] border-2 border-teal-500 rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
            <button 
              onClick={() => {
                setAddingNodeForFeeder(null);
                setAddingNodeParentId(null);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4 border-b border-teal-900 pb-3">
              <Plus className="w-5 h-5 text-emerald-400" />
              <h3 className="text-sm font-black text-teal-300 uppercase">
                {addingNodeParentId ? 'Tambah Percabangan JTM' : 'Tambah Peralatan JTM'}
              </h3>
            </div>

            <div className="space-y-4 font-sans">
              {addingNodeParentId && (
                <div className="bg-teal-950/40 border border-teal-900 px-3 py-2 rounded-xl text-[10px] font-bold text-teal-300 font-mono">
                  Sistem akan membuat percabangan baru di bawah ID: <span className="text-amber-400 select-all font-mono">{addingNodeParentId}</span>
                </div>
              )}

              {/* Type selector */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1.5 font-sans">Jenis Peralatan:</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['GH', 'LBS', 'RECLOSER', 'PMCB', 'CO', 'DS'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => {
                        setNewNodeType(type);
                        if (!newNodeName || newNodeName.includes('Baru')) {
                          setNewNodeName(`${type === 'RECLOSER' ? 'Recloser' : type} Baru`);
                        }
                      }}
                      className={`py-2 px-1 rounded-xl text-xs font-black tracking-wider transition-all border cursor-pointer ${
                        newNodeType === type
                          ? 'bg-emerald-500/25 border-emerald-400 text-emerald-300 shadow-md shadow-emerald-900/30'
                          : 'bg-[#011412] border-teal-900/50 text-slate-400 hover:border-teal-700'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Name Input */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1.5">Nama Peralatan / Keterangan:</label>
                <input 
                  type="text" 
                  value={newNodeName}
                  onChange={(e) => setNewNodeName(e.target.value)}
                  placeholder="Contoh: LBS Kaliurang"
                  className="w-full bg-[#011412] border border-teal-900/80 rounded-xl px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-teal-400 font-bold"
                />
              </div>

              {/* Status Selector */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1.5">Status Switch Awal:</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setNewNodeStatus('CLOSED')}
                    className={`flex-1 py-2 rounded-xl text-xs font-black border cursor-pointer transition-all ${
                      newNodeStatus === 'CLOSED'
                        ? 'bg-emerald-500/20 border-emerald-400 text-emerald-400'
                        : 'bg-[#011412] border-teal-900/50 text-slate-400'
                    }`}
                  >
                    🔴 CLOSED (ON)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewNodeStatus('TRIP')}
                    className={`flex-1 py-2 rounded-xl text-xs font-black border cursor-pointer transition-all ${
                      newNodeStatus === 'TRIP'
                        ? 'bg-rose-500/20 border-rose-400 text-rose-400'
                        : 'bg-[#011412] border-teal-900/50 text-slate-400'
                    }`}
                  >
                    🟢 TRIP (OPEN)
                  </button>
                </div>
              </div>

              {/* Loop Source / Scheme Selector */}
              <div className="space-y-3">
                <label className="block text-[11px] font-bold text-slate-300">
                  Pilihan Skema Jaringan JTM:
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setNewNodeLoopSourceFeederId('')}
                    className={`flex-1 py-2 px-1 rounded-xl text-[11px] font-black border cursor-pointer transition-all flex flex-col items-center justify-center gap-0.5 ${
                      !newNodeLoopSourceFeederId
                        ? 'bg-rose-500/25 border-rose-500 text-rose-400'
                        : 'bg-[#011412] border-teal-900/50 text-slate-400 hover:border-teal-700'
                    }`}
                  >
                    <span>🔌 RADIAL</span>
                    <span className="text-[8px] font-normal opacity-70">Satu Arah Murni</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (masterPenyulangs.length > 0) {
                        setNewNodeLoopSourceFeederId(masterPenyulangs[0].kodeId);
                      } else {
                        setNewNodeLoopSourceFeederId('NO_FEEDER_AVAILABLE');
                      }
                    }}
                    className={`flex-1 py-2 px-1 rounded-xl text-[11px] font-black border cursor-pointer transition-all flex flex-col items-center justify-center gap-0.5 ${
                      newNodeLoopSourceFeederId
                        ? 'bg-emerald-500/25 border-emerald-500 text-emerald-400'
                        : 'bg-[#011412] border-teal-900/50 text-slate-400 hover:border-teal-700'
                    }`}
                  >
                    <span>⚡ LOOPING / RING</span>
                    <span className="text-[8px] font-normal opacity-70">Manuver Backup</span>
                  </button>
                </div>

                {newNodeLoopSourceFeederId && (
                  <div className="pt-1.5 animate-in fade-in duration-150">
                    <label className="block text-[10px] font-bold text-teal-400 mb-1">
                      Pilih Penyulang Sumber Backup:
                    </label>
                    <select
                      value={newNodeLoopSourceFeederId === 'NO_FEEDER_AVAILABLE' ? '' : newNodeLoopSourceFeederId}
                      onChange={(e) => setNewNodeLoopSourceFeederId(e.target.value)}
                      className="w-full bg-[#011412] border border-teal-900/80 rounded-xl px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-teal-400 font-bold cursor-pointer"
                    >
                      <option value="">-- Pilih Penyulang Backup --</option>
                      {masterPenyulangs.map((p) => (
                        <option key={p.id} value={p.kodeId}>
                          {p.kodeId} - Penyulang {p.namaPenyulang}
                        </option>
                      ))}
                    </select>
                    <p className="text-[9px] text-slate-400 mt-1">
                      Sirkuit looping akan secara otomatis menyuplai daya cadangan dari penyulang backup terpilih ini jika terjadi pemadaman arah hulu.
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-3 border-t border-teal-900 justify-end">
                <button 
                  type="button"
                  onClick={() => {
                    setAddingNodeForFeeder(null);
                    setAddingNodeParentId(null);
                  }}
                  className="px-4 py-2 rounded-xl text-slate-300 hover:text-white bg-slate-900 border border-slate-800 text-xs font-black cursor-pointer"
                >
                  Batal
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    handleAddDownstreamNode(addingNodeForFeeder, addingNodeParentId, newNodeName, newNodeType, newNodeStatus, newNodeLoopSourceFeederId);
                    setAddingNodeForFeeder(null);
                    setAddingNodeParentId(null);
                  }}
                  className="px-4 py-2 rounded-xl text-teal-950 bg-gradient-to-tr from-teal-400 via-teal-300 to-emerald-300 font-extrabold text-xs shadow-md hover:scale-[1.02] active:scale-95 cursor-pointer"
                >
                  Tambah Peralatan
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* E2. Edit Downstream Node Modal */}
      {editingJtmNode && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center z-[9999] p-4 font-sans select-text">
          <div className="bg-[#021a17] border-2 border-amber-500 rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
            <button 
              onClick={() => setEditingJtmNode(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4 border-b border-teal-900 pb-3">
              <Settings className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm font-black text-amber-300 uppercase">
                Edit & Konfigurasi Looping JTM
              </h3>
            </div>

            <form onSubmit={handleSaveJtmNodeEditSubmit} className="space-y-4 font-sans">
              {/* Type selector */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1.5 font-sans">Jenis Peralatan:</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['GH', 'LBS', 'RECLOSER', 'PMCB', 'CO', 'DS'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setEditingJtmNode({ ...editingJtmNode, type })}
                      className={`py-2 px-1 rounded-xl text-xs font-black tracking-wider transition-all border cursor-pointer ${
                        editingJtmNode.type === type
                          ? 'bg-amber-500/25 border-amber-400 text-amber-300 shadow-md shadow-amber-900/30'
                          : 'bg-[#011412] border-teal-900/50 text-slate-400 hover:border-teal-700'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Name Input */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1.5">Nama Peralatan / Keterangan:</label>
                <input 
                  type="text" 
                  value={editingJtmNode.name}
                  onChange={(e) => setEditingJtmNode({ ...editingJtmNode, name: e.target.value })}
                  placeholder="Contoh: LBS Kaliurang"
                  className="w-full bg-[#011412] border border-teal-900/80 rounded-xl px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-teal-400 font-bold"
                  required
                />
              </div>

              {/* Status Selector */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1.5">Status Switch:</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingJtmNode({ ...editingJtmNode, status: 'CLOSED' })}
                    className={`flex-1 py-2 rounded-xl text-xs font-black border cursor-pointer transition-all ${
                      editingJtmNode.status === 'CLOSED'
                        ? 'bg-emerald-500/20 border-emerald-400 text-emerald-400'
                        : 'bg-[#011412] border-teal-900/50 text-slate-400'
                    }`}
                  >
                    🔴 CLOSED (ON)
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingJtmNode({ ...editingJtmNode, status: 'TRIP' })}
                    className={`flex-1 py-2 rounded-xl text-xs font-black border cursor-pointer transition-all ${
                      editingJtmNode.status === 'TRIP'
                        ? 'bg-rose-500/20 border-rose-400 text-rose-400'
                        : 'bg-[#011412] border-teal-900/50 text-slate-400'
                    }`}
                  >
                    🟢 TRIP (OPEN)
                  </button>
                </div>
              </div>

              {/* Loop Source / Scheme Selector */}
              <div className="space-y-3">
                <label className="block text-[11px] font-bold text-slate-300">
                  Pilihan Skema Jaringan JTM:
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingJtmNode({ ...editingJtmNode, loopSourceFeederId: '' })}
                    className={`flex-1 py-2 px-1 rounded-xl text-[11px] font-black border cursor-pointer transition-all flex flex-col items-center justify-center gap-0.5 ${
                      !editingJtmNode.loopSourceFeederId
                        ? 'bg-rose-500/25 border-rose-500 text-rose-400'
                        : 'bg-[#011412] border-teal-900/50 text-slate-400 hover:border-teal-700'
                    }`}
                  >
                    <span>🔌 RADIAL</span>
                    <span className="text-[8px] font-normal opacity-70">Satu Arah Murni</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const defaultBackupId = masterPenyulangs.length > 0 ? masterPenyulangs[0].kodeId : 'NO_FEEDER_AVAILABLE';
                      setEditingJtmNode({ ...editingJtmNode, loopSourceFeederId: defaultBackupId });
                    }}
                    className={`flex-1 py-2 px-1 rounded-xl text-[11px] font-black border cursor-pointer transition-all flex flex-col items-center justify-center gap-0.5 ${
                      editingJtmNode.loopSourceFeederId
                        ? 'bg-emerald-500/25 border-emerald-500 text-emerald-400'
                        : 'bg-[#011412] border-teal-900/50 text-slate-400 hover:border-teal-700'
                    }`}
                  >
                    <span>⚡ LOOPING / RING</span>
                    <span className="text-[8px] font-normal opacity-70">Manuver Backup</span>
                  </button>
                </div>

                {editingJtmNode.loopSourceFeederId && (
                  <div className="pt-1.5 animate-in fade-in duration-150">
                    <label className="block text-[10px] font-bold text-teal-400 mb-1">
                      Pilih Penyulang Sumber Backup:
                    </label>
                    <select
                      value={editingJtmNode.loopSourceFeederId === 'NO_FEEDER_AVAILABLE' ? '' : editingJtmNode.loopSourceFeederId}
                      onChange={(e) => setEditingJtmNode({ ...editingJtmNode, loopSourceFeederId: e.target.value })}
                      className="w-full bg-[#011412] border border-teal-900/80 rounded-xl px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-teal-400 font-bold cursor-pointer"
                    >
                      <option value="">-- Pilih Penyulang Backup --</option>
                      {masterPenyulangs.map((p) => (
                        <option key={p.id} value={p.kodeId}>
                          {p.kodeId} - Penyulang {p.namaPenyulang}
                        </option>
                      ))}
                    </select>
                    <p className="text-[9px] text-slate-400 mt-1">
                      Sirkuit looping akan secara otomatis menyuplai daya cadangan dari penyulang backup terpilih ini jika terjadi pemadaman arah hulu.
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-3 border-t border-teal-900 justify-end">
                <button 
                  type="button"
                  onClick={() => setEditingJtmNode(null)}
                  className="px-4 py-2 rounded-xl text-slate-300 hover:text-white bg-slate-900 border border-slate-800 text-xs font-black cursor-pointer"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 rounded-xl text-teal-950 bg-gradient-to-tr from-amber-400 via-amber-300 to-yellow-300 font-extrabold text-xs shadow-md hover:scale-[1.02] active:scale-95 cursor-pointer"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* F. Custom Confirm/Alert Dialog Modal */}
      {customDialog && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center z-[10000] p-4 select-text">
          <div className={`bg-[#021a17] border-2 ${
            customDialog.type === 'CONFIRM' ? 'border-rose-500/80' : 'border-teal-500/80'
          } rounded-3xl p-6 w-full max-w-sm shadow-2xl relative animate-in fade-in zoom-in-95 duration-150`}>
            
            <div className="flex flex-col items-center text-center">
              <div className={`p-3 rounded-full mb-4 ${
                customDialog.type === 'CONFIRM' ? 'bg-rose-950/40 text-rose-400 border border-rose-500/30' : 'bg-teal-950/40 text-teal-400 border border-teal-500/30'
              }`}>
                {customDialog.type === 'CONFIRM' ? (
                  <AlertTriangle className="w-8 h-8 animate-bounce" />
                ) : (
                  <HelpCircle className="w-8 h-8 text-teal-400" />
                )}
              </div>

              <h3 className={`text-sm font-black uppercase mb-2 ${
                customDialog.type === 'CONFIRM' ? 'text-rose-300' : 'text-teal-300'
              }`}>
                {customDialog.title}
              </h3>

              <p className="text-xs text-slate-300 font-bold leading-relaxed mb-6 font-sans">
                {customDialog.message}
              </p>

              <div className="flex gap-3 w-full font-sans">
                {customDialog.type === 'CONFIRM' ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setCustomDialog(null)}
                      className="flex-1 py-2.5 rounded-xl text-slate-300 hover:text-white bg-slate-900 border border-slate-800 text-xs font-black cursor-pointer transition-all active:scale-95"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (customDialog.onConfirm) {
                          customDialog.onConfirm();
                        }
                        setCustomDialog(null);
                      }}
                      className="flex-1 py-2.5 rounded-xl text-white bg-gradient-to-r from-rose-600 to-red-500 hover:from-rose-500 hover:to-red-400 font-black text-xs shadow-md shadow-rose-950/50 hover:scale-[1.02] active:scale-95 cursor-pointer transition-all"
                    >
                      Ya, Hapus
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setCustomDialog(null)}
                    className="w-full py-2.5 rounded-xl text-teal-950 bg-gradient-to-tr from-teal-400 via-teal-300 to-emerald-300 font-black text-xs shadow-md hover:scale-[1.02] active:scale-95 cursor-pointer transition-all"
                  >
                    Mengerti
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
