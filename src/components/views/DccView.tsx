import React, { useState, useEffect, useMemo } from 'react';
import { db, doc, onSnapshot, setDoc, OperationType, handleFirestoreError } from '../../lib/firebase';
import { 
  Zap, 
  Activity, 
  RotateCcw, 
  Sliders, 
  Check, 
  X, 
  Info, 
  Save, 
  Settings, 
  RefreshCw, 
  AlertTriangle,
  Radio,
  Eye,
  Minimize2,
  Maximize2,
  Trash2,
  Plus,
  Network,
  ToggleLeft,
  Shield,
  ZapOff,
  Unlink
} from 'lucide-react';

// Interfaces for DCC State
export interface BreakerState {
  id: string;
  name: string;
  status: 'CLOSED' | 'TRIP';
  type: 'PMT_150' | 'PMT_TNC' | 'PMT_KOPEL' | 'FEEDER_BREAKER';
}

export interface TrafoState {
  id: string;
  name: string;
  loadMw: number;
  capacityMva: number;
  tap: number;
  tapMax: number;
  tempWdy: number;
  isAutoTap: boolean;
}

export interface BusState {
  id: string;
  name: string;
  voltageKv: number;
}

export interface FeederState {
  id: string;
  code: string;
  name: string;
  status: 'ENERGIZED' | 'TRIP';
  currentA: number;
  powerMw: number;
  voltageKv: number;
  cosPhi: number;
}

export interface DownstreamNode {
  id: string;
  name: string;
  type: 'GH' | 'LBS' | 'RECLOSER' | 'PMCB' | 'CO' | 'DS';
  status: 'CLOSED' | 'TRIP';
  children?: DownstreamNode[];
}

// Tree helper functions for recursive nested JTM equipment
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

export interface DccConfigState {
  breakers: Record<string, BreakerState>;
  trafos: Record<string, TrafoState>;
  buses: Record<string, BusState>;
  feeders: Record<string, FeederState>;
  telemetryOn: boolean;
  downstreamNodes?: Record<string, DownstreamNode[]>;
}

// Initial defaults exactly matching the user's uploaded SLD
const INITIAL_DCC_STATE: DccConfigState = {
  breakers: {
    'pmt_150_t1': { id: 'pmt_150_t1', name: 'PMT 150-T1', status: 'CLOSED', type: 'PMT_150' },
    'pmt_150_t2': { id: 'pmt_150_t2', name: 'PMT 150-T2', status: 'CLOSED', type: 'PMT_150' },
    'pmt_tnc_1': { id: 'pmt_tnc_1', name: 'PMT TNC-1', status: 'CLOSED', type: 'PMT_TNC' },
    'pmt_tnc_2': { id: 'pmt_tnc_2', name: 'PMT TNC-2', status: 'CLOSED', type: 'PMT_TNC' },
    'pmt_kopel': { id: 'pmt_kopel', name: 'PMT KOPEL', status: 'TRIP', type: 'PMT_KOPEL' },
    'f01_brk': { id: 'f01_brk', name: 'PMT F-01', status: 'CLOSED', type: 'FEEDER_BREAKER' },
    'f02_brk': { id: 'f02_brk', name: 'PMT F-02', status: 'TRIP', type: 'FEEDER_BREAKER' },
    'f03_brk': { id: 'f03_brk', name: 'PMT F-03', status: 'CLOSED', type: 'FEEDER_BREAKER' },
    'f04_brk': { id: 'f04_brk', name: 'PMT F-04', status: 'CLOSED', type: 'FEEDER_BREAKER' },
    'f05_brk': { id: 'f05_brk', name: 'PMT F-05', status: 'CLOSED', type: 'FEEDER_BREAKER' },
    'f06_brk': { id: 'f06_brk', name: 'PMT F-06', status: 'CLOSED', type: 'FEEDER_BREAKER' },
  },
  trafos: {
    'trafo_1': { id: 'trafo_1', name: 'TRAFO 1 (60 MVA)', loadMw: 49.2, capacityMva: 60, tap: 9, tapMax: 17, tempWdy: 64.0, isAutoTap: true },
    'trafo_2': { id: 'trafo_2', name: 'TRAFO 2 (60 MVA)', loadMw: 38.8, capacityMva: 60, tap: 9, tapMax: 17, tempWdy: 60.2, isAutoTap: true },
  },
  buses: {
    'bus_150_a': { id: 'bus_150_a', name: 'BUS 150 kV - A', voltageKv: 151.2 },
    'bus_150_b': { id: 'bus_150_b', name: 'BUS 150 kV - B', voltageKv: 150.8 },
    'bus_20_a': { id: 'bus_20_a', name: 'BUS 20kV - A', voltageKv: 20.15 },
    'bus_20_b': { id: 'bus_20_b', name: 'BUS 20kV - B', voltageKv: 20.10 },
  },
  feeders: {
    'f01': { id: 'f01', code: 'F-01', name: 'Penyulang Merapi', status: 'ENERGIZED', currentA: 285, powerMw: 9.44, voltageKv: 20.1, cosPhi: 0.955 },
    'f02': { id: 'f02', code: 'F-02', name: 'Penyulang Ciremai', status: 'TRIP', currentA: 0, powerMw: 0.00, voltageKv: 0.0, cosPhi: 1.000 },
    'f03': { id: 'f03', code: 'F-03', name: 'Penyulang Garuda', status: 'ENERGIZED', currentA: 212, powerMw: 7.05, voltageKv: 20.2, cosPhi: 0.962 },
    'f04': { id: 'f04', code: 'F-04', name: 'Penyulang Rajawali', status: 'ENERGIZED', currentA: 289, powerMw: 9.51, voltageKv: 20.1, cosPhi: 0.955 },
    'f05': { id: 'f05', code: 'F-05', name: 'Penyulang Diponegoro', status: 'ENERGIZED', currentA: 242, powerMw: 8.01, voltageKv: 20.1, cosPhi: 0.957 },
    'f06': { id: 'f06', code: 'F-06', name: 'Penyulang Khatulistiwa', status: 'ENERGIZED', currentA: 411, powerMw: 12.64, voltageKv: 20.1, cosPhi: 0.959 },
  },
  telemetryOn: true,
  downstreamNodes: {
    'f01': [
      { id: 'ds_f01_1', name: 'GH Merapi 1', type: 'GH', status: 'CLOSED' },
      { id: 'ds_f01_2', name: 'LBS Kaliurang', type: 'LBS', status: 'CLOSED' },
    ],
    'f02': [
      { id: 'ds_f02_1', name: 'Recloser Ciremai', type: 'RECLOSER', status: 'TRIP' },
    ],
    'f03': [
      { id: 'ds_f03_1', name: 'PMCB Garuda', type: 'PMCB', status: 'CLOSED' },
    ],
    'f04': [
      { id: 'ds_f04_1', name: 'CO Rajawali', type: 'CO', status: 'CLOSED' },
    ],
    'f05': [
      { id: 'ds_f05_1', name: 'DS Diponegoro', type: 'DS', status: 'CLOSED' },
    ],
    'f06': [],
  },
};

export const DccView: React.FC<{ currentUser: any }> = ({ currentUser }) => {
  const [dccState, setDccState] = useState<DccConfigState>(INITIAL_DCC_STATE);
  const [loading, setLoading] = useState<boolean>(true);
  const [saveStatus, setSaveStatus] = useState<'IDLE' | 'SAVING' | 'SUCCESS' | 'ERROR'>('IDLE');
  
  // Modal Edit States
  const [editingComponent, setEditingComponent] = useState<{
    type: 'trafo' | 'bus' | 'feeder' | 'breaker';
    id: string;
    data: any;
  } | null>(null);

  // Filter & Layout States
  const [showLegenda, setShowLegenda] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Downstream node creation state
  const [addingNodeForFeeder, setAddingNodeForFeeder] = useState<string | null>(null);
  const [addingNodeParentId, setAddingNodeParentId] = useState<string | null>(null); // Parent node if sub-branching
  const [newNodeName, setNewNodeName] = useState<string>('');
  const [newNodeType, setNewNodeType] = useState<'GH' | 'LBS' | 'RECLOSER' | 'PMCB' | 'CO' | 'DS'>('LBS');
  const [newNodeStatus, setNewNodeStatus] = useState<'CLOSED' | 'TRIP'>('CLOSED');

  // Listen to Firestore for global state persistence
  useEffect(() => {
    const docRef = doc(db, 'dcc_configs', 'gi_gandul_state');
    const unsub = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const cloudData = docSnap.data() as DccConfigState;
        setDccState(cloudData);
      } else {
        // Create initial config if it doesn't exist
        setDoc(docRef, INITIAL_DCC_STATE).catch((err) => {
          console.error("Gagal inisialisasi DCC di cloud:", err);
        });
      }
      setLoading(false);
    }, (error) => {
      console.warn("Firestore listener fallback to localStorage:", error);
      const cached = localStorage.getItem('dcc_gi_gandul_state');
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
    localStorage.setItem('dcc_gi_gandul_state', JSON.stringify(newState));
    try {
      await setDoc(doc(db, 'dcc_configs', 'gi_gandul_state'), newState);
      setSaveStatus('SUCCESS');
      setTimeout(() => setSaveStatus('IDLE'), 2000);
    } catch (err) {
      setSaveStatus('ERROR');
      setTimeout(() => setSaveStatus('IDLE'), 3000);
      handleFirestoreError(err, OperationType.WRITE, 'dcc_configs/gi_gandul_state');
    }
  };

  // Telemetry fluctuation simulator
  useEffect(() => {
    if (!dccState.telemetryOn) return;

    const interval = setInterval(() => {
      setDccState((prev) => {
        const updatedFeeders = { ...prev.feeders };
        const updatedTrafos = { ...prev.trafos };
        const updatedBuses = { ...prev.buses };

        // Fluctuate buses voltages slightly
        updatedBuses.bus_150_a.voltageKv = parseFloat((150.0 + Math.random() * 2).toFixed(2));
        updatedBuses.bus_150_b.voltageKv = parseFloat((149.8 + Math.random() * 2).toFixed(2));
        updatedBuses.bus_20_a.voltageKv = parseFloat((20.0 + Math.random() * 0.3).toFixed(2));
        updatedBuses.bus_20_b.voltageKv = parseFloat((20.0 + Math.random() * 0.25).toFixed(2));

        // Fluctuate energized feeders
        let trafo1LoadSum = 0;
        let trafo2LoadSum = 0;

        Object.keys(updatedFeeders).forEach((key) => {
          const f = updatedFeeders[key];
          // If breaker or feeder status is TRIP, then values are 0
          const associatedBreakerId = `${key}_brk`;
          const isBreakerOpen = prev.breakers[associatedBreakerId]?.status === 'TRIP';
          const isFeederTripped = f.status === 'TRIP';

          if (isBreakerOpen || isFeederTripped) {
            f.currentA = 0;
            f.powerMw = 0;
            f.voltageKv = 0;
          } else {
            // Slight natural fluctuation (+/- 2%)
            const currentBase = INITIAL_DCC_STATE.feeders[key].currentA;
            const fluctuation = (Math.random() - 0.5) * 6; // range -3 to +3 A
            f.currentA = Math.max(50, Math.round(currentBase + fluctuation));
            
            // Re-calc power based on actual active voltage & current (simplified power formula)
            f.powerMw = parseFloat((Math.sqrt(3) * f.currentA * 20 * f.cosPhi / 1000).toFixed(2));
            f.voltageKv = parseFloat((prev.buses[key <= 'f03' ? 'bus_20_a' : 'bus_20_b'].voltageKv).toFixed(2));

            // Accumulate loads for trafos
            if (key <= 'f03') {
              trafo1LoadSum += f.powerMw;
            } else {
              trafo2LoadSum += f.powerMw;
            }
          }
        });

        // Update trafo loads from feeder sums
        updatedTrafos.trafo_1.loadMw = parseFloat((trafo1LoadSum * 1.05).toFixed(1)); // Add 5% loss factor
        updatedTrafos.trafo_1.tempWdy = parseFloat((55 + (updatedTrafos.trafo_1.loadMw / 60) * 15 + Math.random() * 0.8).toFixed(1));
        
        updatedTrafos.trafo_2.loadMw = parseFloat((trafo2LoadSum * 1.05).toFixed(1));
        updatedTrafos.trafo_2.tempWdy = parseFloat((52 + (updatedTrafos.trafo_2.loadMw / 60) * 14 + Math.random() * 0.7).toFixed(1));

        return {
          ...prev,
          feeders: updatedFeeders,
          trafos: updatedTrafos,
          buses: updatedBuses
        };
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [dccState.telemetryOn]);

  // Handle manual/telemetry component saves
  const handleSaveComponentEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingComponent) return;

    const { type, id, data } = editingComponent;
    const newState = { ...dccState };

    if (type === 'trafo') {
      newState.trafos[id] = { ...newState.trafos[id], ...data };
    } else if (type === 'bus') {
      newState.buses[id] = { ...newState.buses[id], ...data };
    } else if (type === 'feeder') {
      newState.feeders[id] = { ...newState.feeders[id], ...data };
      // Sync feeder status with its dedicated breaker
      const brkId = `${id}_brk`;
      if (newState.breakers[brkId]) {
        newState.breakers[brkId].status = data.status === 'ENERGIZED' ? 'CLOSED' : 'TRIP';
      }
    } else if (type === 'breaker') {
      newState.breakers[id] = { ...newState.breakers[id], ...data };
      // Sync associated feeder
      const fedId = id.substring(0, 3);
      if (newState.feeders[fedId]) {
        newState.feeders[fedId].status = data.status === 'CLOSED' ? 'ENERGIZED' : 'TRIP';
      }
    }

    setDccState(newState);
    updateDccStateInDb(newState);
    setEditingComponent(null);
  };

  // Toggle dynamic breaker state
  const handleToggleBreaker = (breakerId: string) => {
    const newState = { ...dccState };
    const currentStatus = newState.breakers[breakerId].status;
    const nextStatus = currentStatus === 'CLOSED' ? 'TRIP' : 'CLOSED';
    
    newState.breakers[breakerId].status = nextStatus;

    // Direct synchronization to downstream components
    if (breakerId.endsWith('_brk')) {
      const feederId = breakerId.substring(0, 3);
      if (newState.feeders[feederId]) {
        newState.feeders[feederId].status = nextStatus === 'CLOSED' ? 'ENERGIZED' : 'TRIP';
        if (nextStatus === 'TRIP') {
          newState.feeders[feederId].currentA = 0;
          newState.feeders[feederId].powerMw = 0;
        }
      }
    }

    setDccState(newState);
    updateDccStateInDb(newState);
  };

  // Quick feeder simulation toggles (as shown at the bottom of the user's diagram)
  const handleSimulateTripFeeder = (feederId: string) => {
    const newState = { ...dccState };
    const isCurrentlyTripped = newState.feeders[feederId].status === 'TRIP';
    const nextStatus = isCurrentlyTripped ? 'ENERGIZED' : 'TRIP';
    
    newState.feeders[feederId].status = nextStatus;
    
    // Auto sync breaker
    const breakerId = `${feederId}_brk`;
    if (newState.breakers[breakerId]) {
      newState.breakers[breakerId].status = nextStatus === 'ENERGIZED' ? 'CLOSED' : 'TRIP';
    }

    if (nextStatus === 'TRIP') {
      newState.feeders[feederId].currentA = 0;
      newState.feeders[feederId].powerMw = 0;
    } else {
      const defaultData = INITIAL_DCC_STATE.feeders[feederId];
      newState.feeders[feederId].currentA = defaultData.currentA;
      newState.feeders[feederId].powerMw = defaultData.powerMw;
    }

    setDccState(newState);
    updateDccStateInDb(newState);
  };

  // Toggle status of a downstream node (CLOSED vs TRIP) recursive tree
  const handleToggleDownstreamNode = (feederId: string, nodeId: string) => {
    const newState = { ...dccState };
    if (!newState.downstreamNodes) {
      newState.downstreamNodes = {};
    }
    const list = newState.downstreamNodes[feederId] ? JSON.parse(JSON.stringify(newState.downstreamNodes[feederId])) : [];
    const updated = toggleNodeInTree(list, nodeId);
    if (updated) {
      newState.downstreamNodes[feederId] = list;
      setDccState(newState);
      updateDccStateInDb(newState);
    }
  };

  // Add a new downstream node (optionally under a parentNodeId for branches)
  const handleAddDownstreamNode = (
    feederId: string, 
    parentNodeId: string | null, 
    name: string, 
    type: 'GH' | 'LBS' | 'RECLOSER' | 'PMCB' | 'CO' | 'DS', 
    status: 'CLOSED' | 'TRIP'
  ) => {
    const newState = { ...dccState };
    if (!newState.downstreamNodes) {
      newState.downstreamNodes = {};
    }
    const list = newState.downstreamNodes[feederId] ? JSON.parse(JSON.stringify(newState.downstreamNodes[feederId])) : [];
    
    const newNode: DownstreamNode = {
      id: `ds_${feederId}_${Date.now()}`,
      name: name || `${type} Baru`,
      type,
      status,
      children: []
    };

    if (parentNodeId) {
      addNodeToTree(list, parentNodeId, newNode);
    } else {
      list.push(newNode);
    }

    newState.downstreamNodes[feederId] = list;
    setDccState(newState);
    updateDccStateInDb(newState);
  };

  // Delete a downstream node recursive tree
  const handleDeleteDownstreamNode = (feederId: string, nodeId: string) => {
    const newState = { ...dccState };
    if (!newState.downstreamNodes) {
      newState.downstreamNodes = {};
    }
    const list = newState.downstreamNodes[feederId] ? JSON.parse(JSON.stringify(newState.downstreamNodes[feederId])) : [];
    const deleted = deleteNodeFromTree(list, nodeId);
    if (deleted) {
      newState.downstreamNodes[feederId] = list;
      setDccState(newState);
      updateDccStateInDb(newState);
    }
  };

  // Reset DCC diagram to pristine default parameters
  const handleResetToDefaults = () => {
    if (window.confirm("Apakah Anda yakin ingin menyetel ulang seluruh SLD ke kondisi standar?")) {
      setDccState(INITIAL_DCC_STATE);
      updateDccStateInDb(INITIAL_DCC_STATE);
    }
  };

  // Path analysis to determine energized flows dynamically (to change stroke lines from green to red!)
  const isSutt1Energized = dccState.breakers.pmt_150_t1.status === 'CLOSED';
  const isSutt2Energized = dccState.breakers.pmt_150_t2.status === 'CLOSED';

  const isTrafo1Energized = isSutt1Energized;
  const isTrafo2Energized = isSutt2Energized;

  const isTnc1Closed = dccState.breakers.pmt_tnc_1.status === 'CLOSED';
  const isTnc2Closed = dccState.breakers.pmt_tnc_2.status === 'CLOSED';
  const isKopelClosed = dccState.breakers.pmt_kopel.status === 'CLOSED';

  // Real electric power grid logic:
  let isBusAEnergized = isTrafo1Energized && isTnc1Closed;
  let isBusBEnergized = isTrafo2Energized && isTnc2Closed;

  // Kopel power share logic:
  if (isKopelClosed) {
    if (isBusAEnergized || isBusBEnergized) {
      isBusAEnergized = true;
      isBusBEnergized = true;
    }
  }

  // Feeder power flows
  const isF01Active = isBusAEnergized && dccState.breakers.f01_brk.status === 'CLOSED';
  const isF02Active = isBusAEnergized && dccState.breakers.f02_brk.status === 'CLOSED';
  const isF03Active = isBusAEnergized && dccState.breakers.f03_brk.status === 'CLOSED';

  const isF04Active = isBusBEnergized && dccState.breakers.f04_brk.status === 'CLOSED';
  const isF05Active = isBusBEnergized && dccState.breakers.f05_brk.status === 'CLOSED';
  const isF06Active = isBusBEnergized && dccState.breakers.f06_brk.status === 'CLOSED';

  // Helper to retrieve Lucide icons for each JTM node type
  const getNodeIcon = (type: string, isActive: boolean) => {
    const colorClass = isActive ? 'text-emerald-400' : 'text-rose-400';
    const size = "w-5 h-5";
    
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

  // Recursive JTM Node rendering tree helper for nesting support
  const renderJtmNodeTree = (
    nodes: DownstreamNode[], 
    isParentPathActive: boolean, 
    feederId: string,
    depth = 0
  ): React.ReactNode => {
    if (!nodes || nodes.length === 0) return null;

    return (
      <div className={`w-full ${depth > 0 ? 'pl-3 border-l border-teal-900/40 mt-2.5 space-y-2' : 'space-y-3'}`}>
        {nodes.map((node, index) => {
          const isNodeActive = isParentPathActive && node.status === 'CLOSED';

          const typeStyles = {
            GH: 'border-blue-500/30 bg-blue-950/40 text-blue-300',
            LBS: 'border-teal-500/30 bg-teal-950/40 text-teal-300',
            RECLOSER: 'border-amber-500/30 bg-amber-950/40 text-amber-300',
            PMCB: 'border-pink-500/30 bg-pink-950/40 text-pink-300',
            CO: 'border-orange-500/30 bg-orange-950/40 text-orange-300',
            DS: 'border-purple-500/30 bg-purple-950/40 text-purple-300'
          }[node.type] || 'border-slate-500/30 bg-slate-900 text-slate-300';

          return (
            <div key={node.id} className="flex flex-col items-center relative w-full">
              
              {/* Connector Line between sibling nodes or from parent */}
              {depth === 0 && index > 0 && (
                <div className={`w-0.5 h-3 border-l-2 border-dashed mb-1.5 transition-all duration-300 ${
                  isParentPathActive ? 'border-emerald-500' : 'border-rose-500/60'
                }`} />
              )}

              {/* JTM node card */}
              <div className={`w-full rounded-xl border p-2 bg-[#011412] shadow-md transition-all relative ${
                node.status === 'CLOSED'
                  ? isNodeActive 
                    ? 'border-emerald-500/60 shadow-md shadow-emerald-950/30' 
                    : 'border-emerald-800/40'
                  : 'border-rose-800/60 shadow-md shadow-rose-950/30'
              }`}>
                
                {/* Control Actions Top-Right */}
                <div className="absolute top-1.5 right-1.5 flex items-center gap-1 z-10">
                  {/* "+" Add Child button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setAddingNodeForFeeder(feederId);
                      setAddingNodeParentId(node.id); // set parent as this node!
                      setNewNodeName('');
                      setNewNodeType('LBS');
                      setNewNodeStatus('CLOSED');
                    }}
                    className="p-1 rounded bg-[#012823] hover:bg-emerald-600 hover:text-white text-emerald-400 transition-all cursor-pointer border border-emerald-500/20 active:scale-90"
                    title={`Tambah Cabang di bawah ${node.name}`}
                  >
                    <Plus className="w-2.5 h-2.5" />
                  </button>

                  {/* Delete button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(`Hapus ${node.type} "${node.name}" beserta cabangnya?`)) {
                        handleDeleteDownstreamNode(feederId, node.id);
                      }
                    }}
                    className="text-slate-500 hover:text-rose-400 p-0.5 rounded transition-all cursor-pointer"
                    title="Hapus Peralatan"
                  >
                    <Trash2 className="w-2.5 h-2.5" />
                  </button>
                </div>

                {/* Node Symbol Header: Icon centered */}
                <div className="flex flex-col items-center justify-center pt-2 pb-1.5">
                  <div className={`p-1.5 rounded-lg bg-teal-950/40 border border-teal-900/30 flex items-center justify-center mb-1.5`}>
                    {getNodeIcon(node.type, isNodeActive)}
                  </div>
                  
                  {/* Equipment Type Text Label BENEATH the Icon */}
                  <span className={`text-[7px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider border ${typeStyles}`}>
                    {node.type}
                  </span>
                </div>

                {/* Node name */}
                <div className="text-[9px] font-bold text-slate-200 mb-1.5 text-center truncate px-1" title={node.name}>
                  {node.name}
                </div>

                {/* Status Switch Control */}
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

                {/* Line Flow color bar */}
                <div className={`h-1 w-full rounded-full mt-2 ${
                  isNodeActive ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                }`} />
              </div>

              {/* Recursively render child branches */}
              {node.children && node.children.length > 0 && (
                <div className="w-full flex flex-col items-stretch mt-2 pl-1.5 border-l border-teal-900/30">
                  <div className="text-[7.5px] font-black text-teal-500/60 ml-1 mb-1 tracking-wider uppercase">
                    ↳ Cabang ({node.children.length})
                  </div>
                  {renderJtmNodeTree(node.children, isNodeActive, feederId, depth + 1)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className={`flex flex-col bg-[#010e0c] text-slate-100 min-h-screen transition-all duration-300 font-mono select-none ${
      isFullscreen ? 'fixed inset-0 z-[9999] w-screen h-screen' : 'relative w-full'
    }`}>
      {/* Styles for grid background and SCADA flow animation */}
      <style>{`
        .scada-grid {
          background-image: radial-gradient(rgba(13, 148, 136, 0.15) 1px, transparent 1px);
          background-size: 20px 20px;
        }
        @keyframes marchAnts {
          0% { stroke-dashoffset: 24; }
          100% { stroke-dashoffset: 0; }
        }
        .flow-active {
          stroke-dasharray: 6, 4;
          animation: marchAnts 2s linear infinite;
        }
      `}</style>

      {/* Control Cockpit Header */}
      <div className="bg-[#021815] border-b border-teal-950 px-5 py-3 flex flex-wrap items-center justify-between gap-4 shrink-0 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-teal-950 border border-teal-500/30 text-teal-400 animate-pulse">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-wider text-teal-300 uppercase">Single Line Diagram (SLD) Interaktif</h1>
            <p className="text-[10px] text-teal-400/80 font-bold">Standar SPLN / IEC 60870-5-104 - Gardu Induk 150/20 kV</p>
          </div>
        </div>

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
                ? 'bg-teal-500/20 border-teal-400 text-teal-300 shadow-xs' 
                : 'bg-slate-900 border-slate-700 text-slate-400'
            }`}
          >
            <Activity className={`w-3.5 h-3.5 ${dccState.telemetryOn ? 'animate-bounce' : ''}`} />
            <span>Telemetri {dccState.telemetryOn ? 'ON' : 'OFF'}</span>
          </button>

          {/* Legend Button */}
          <button
            onClick={() => setShowLegenda(!showLegenda)}
            className="px-3 py-1.5 rounded-xl bg-[#012823] hover:bg-teal-900/60 border border-teal-800 text-teal-300 text-xs font-black cursor-pointer transition-all"
          >
            <span>Legenda</span>
          </button>

          {/* Zoom Controls */}
          <div className="flex items-center bg-[#011a17] border border-teal-900/80 rounded-xl px-2.5 py-1 text-xs gap-2">
            <button 
              onClick={() => setZoomLevel(Math.max(80, zoomLevel - 10))} 
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
            title="Sebut Ulang Parameter Awal"
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

      {/* Saving status notification bar */}
      {saveStatus !== 'IDLE' && (
        <div className={`px-4 py-1.5 text-[11px] font-bold text-center flex items-center justify-center gap-1.5 transition-all ${
          saveStatus === 'SAVING' ? 'bg-amber-600/35 text-amber-200' :
          saveStatus === 'SUCCESS' ? 'bg-emerald-600/35 text-emerald-200' : 'bg-rose-600/35 text-rose-200'
        }`}>
          {saveStatus === 'SAVING' && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
          {saveStatus === 'SUCCESS' && <Check className="w-3.5 h-3.5" />}
          {saveStatus === 'ERROR' && <AlertTriangle className="w-3.5 h-3.5" />}
          <span>
            {saveStatus === 'SAVING' && 'Sinkronisasi status DCC ke cloud...'}
            {saveStatus === 'SUCCESS' && 'Kondisi DCC tersimpan permanen di Cloud!'}
            {saveStatus === 'ERROR' && 'Koneksi lambat. Perubahan disimpan di penyimpanan lokal.'}
          </span>
        </div>
      )}

      {/* Main Cockpit Workspace Area */}
      <div className="flex-1 flex overflow-hidden scada-grid relative">
        
        {/* SCADA Diagram Container */}
        <div className="flex-1 overflow-auto p-6 flex justify-center items-start">
          <div 
            className="relative bg-[#02110f]/90 border border-teal-950 shadow-2xl rounded-3xl p-8 transition-transform duration-200 origin-top w-[1200px] min-h-[1150px]"
            style={{ transform: `scale(${zoomLevel / 100})` }}
          >
            
            {/* SVG Lines with Real-time flow and color representation */}
            {/* TRIP = Red (#ef4444), CLOSED = Green (#22c55e) */}
            <div className="absolute inset-0 pointer-events-none z-0">
              <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <filter id="glow-green" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                  <filter id="glow-red" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>
                
                {/* 1. SUTT 1 to BUS 150-A Line */}
                <path 
                  d="M 280 20 L 280 120" 
                  stroke={isSutt1Energized ? '#22c55e' : '#ef4444'} 
                  strokeWidth="4" 
                  fill="none" 
                  filter={isSutt1Energized ? 'url(#glow-green)' : 'url(#glow-red)'}
                  className={isSutt1Energized ? 'flow-active' : ''}
                />

                {/* 2. SUTT 2 to BUS 150-B Line */}
                <path 
                  d="M 920 20 L 920 120" 
                  stroke={isSutt2Energized ? '#22c55e' : '#ef4444'} 
                  strokeWidth="4" 
                  fill="none" 
                  filter={isSutt2Energized ? 'url(#glow-green)' : 'url(#glow-red)'}
                  className={isSutt2Energized ? 'flow-active' : ''}
                />

                {/* 3. BUS 150-A to Trafo 1 Line */}
                <path 
                  d="M 280 145 L 280 240" 
                  stroke={isSutt1Energized ? '#22c55e' : '#ef4444'} 
                  strokeWidth="3.5" 
                  fill="none"
                  filter={isSutt1Energized ? 'url(#glow-green)' : 'url(#glow-red)'}
                  className={isSutt1Energized ? 'flow-active' : ''}
                />

                {/* 4. BUS 150-B to Trafo 2 Line */}
                <path 
                  d="M 920 145 L 920 240" 
                  stroke={isSutt2Energized ? '#22c55e' : '#ef4444'} 
                  strokeWidth="3.5" 
                  fill="none"
                  filter={isSutt2Energized ? 'url(#glow-green)' : 'url(#glow-red)'}
                  className={isSutt2Energized ? 'flow-active' : ''}
                />

                {/* 5. Trafo 1 to Bus 20kV-A Connection (through PMT TNC-1) */}
                <path 
                  d="M 280 340 L 280 500" 
                  stroke={isTrafo1Energized && isTnc1Closed ? '#22c55e' : '#ef4444'} 
                  strokeWidth="3.5" 
                  fill="none"
                  filter={isTrafo1Energized && isTnc1Closed ? 'url(#glow-green)' : 'url(#glow-red)'}
                  className={isTrafo1Energized && isTnc1Closed ? 'flow-active' : ''}
                />

                {/* 6. Trafo 2 to Bus 20kV-B Connection (through PMT TNC-2) */}
                <path 
                  d="M 920 340 L 920 500" 
                  stroke={isTrafo2Energized && isTnc2Closed ? '#22c55e' : '#ef4444'} 
                  strokeWidth="3.5" 
                  fill="none"
                  filter={isTrafo2Energized && isTnc2Closed ? 'url(#glow-green)' : 'url(#glow-red)'}
                  className={isTrafo2Energized && isTnc2Closed ? 'flow-active' : ''}
                />

                {/* 7. Bus Kopel (Horizontal links between Bus A and Bus B) */}
                <path 
                  d="M 280 500 L 530 500 M 570 500 L 920 500" 
                  stroke={isBusAEnergized || isBusBEnergized ? '#22c55e' : '#ef4444'} 
                  strokeWidth="4" 
                  fill="none"
                  filter={isBusAEnergized || isBusBEnergized ? 'url(#glow-green)' : 'url(#glow-red)'}
                />

                {/* 8. Kopel Bridge Breaker (Middle connector) */}
                <path 
                  d="M 530 500 L 570 500" 
                  stroke={isKopelClosed ? '#22c55e' : '#ef4444'} 
                  strokeWidth="4.5" 
                  fill="none"
                  filter={isKopelClosed ? 'url(#glow-green)' : 'url(#glow-red)'}
                />

                {/* 9. Feeder F-01 Downwards */}
                <path 
                  d="M 120 500 L 120 700" 
                  stroke={isF01Active ? '#22c55e' : '#ef4444'} 
                  strokeWidth="3" 
                  fill="none"
                  filter={isF01Active ? 'url(#glow-green)' : 'url(#glow-red)'}
                  className={isF01Active ? 'flow-active' : ''}
                />

                {/* 10. Feeder F-02 Downwards */}
                <path 
                  d="M 280 500 L 280 700" 
                  stroke={isF02Active ? '#22c55e' : '#ef4444'} 
                  strokeWidth="3" 
                  fill="none"
                  filter={isF02Active ? 'url(#glow-green)' : 'url(#glow-red)'}
                  className={isF02Active ? 'flow-active' : ''}
                />

                {/* 11. Feeder F-03 Downwards */}
                <path 
                  d="M 440 500 L 440 700" 
                  stroke={isF03Active ? '#22c55e' : '#ef4444'} 
                  strokeWidth="3" 
                  fill="none"
                  filter={isF03Active ? 'url(#glow-green)' : 'url(#glow-red)'}
                  className={isF03Active ? 'flow-active' : ''}
                />

                {/* 12. Feeder F-04 Downwards */}
                <path 
                  d="M 760 500 L 760 700" 
                  stroke={isF04Active ? '#22c55e' : '#ef4444'} 
                  strokeWidth="3" 
                  fill="none"
                  filter={isF04Active ? 'url(#glow-green)' : 'url(#glow-red)'}
                  className={isF04Active ? 'flow-active' : ''}
                />

                {/* 13. Feeder F-05 Downwards */}
                <path 
                  d="M 920 500 L 920 700" 
                  stroke={isF05Active ? '#22c55e' : '#ef4444'} 
                  strokeWidth="3" 
                  fill="none"
                  filter={isF05Active ? 'url(#glow-green)' : 'url(#glow-red)'}
                  className={isF05Active ? 'flow-active' : ''}
                />

                {/* 14. Feeder F-06 Downwards */}
                <path 
                  d="M 1080 500 L 1080 700" 
                  stroke={isF06Active ? '#22c55e' : '#ef4444'} 
                  strokeWidth="3" 
                  fill="none"
                  filter={isF06Active ? 'url(#glow-green)' : 'url(#glow-red)'}
                  className={isF06Active ? 'flow-active' : ''}
                />
              </svg>
            </div>

            {/* Interactive Grid Elements Overlay */}
            <div className="relative z-10 w-full h-full">
              
              {/* TOP: SUTT Headers */}
              {/* SUTT 1 Header */}
              <div className="absolute top-[20px] flex flex-col items-center" style={{ left: '280px', transform: 'translateX(-50%)' }}>
                <span className="text-[10px] font-black text-teal-400">SUTT 150kV SUTET/GANDUL - 1</span>
                <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[10px] border-b-rose-500 mt-1 animate-bounce" />
              </div>

              {/* SUTT 2 Header */}
              <div className="absolute top-[20px] flex flex-col items-center" style={{ left: '920px', transform: 'translateX(-50%)' }}>
                <span className="text-[10px] font-black text-teal-400">SUTT 150kV SUTET/GANDUL - 2</span>
                <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[10px] border-b-rose-500 mt-1 animate-bounce" />
              </div>

              {/* BUS 150kV Bars */}
              {/* BUS 150kV - A */}
              <div 
                onClick={() => setEditingComponent({ type: 'bus', id: 'bus_150_a', data: dccState.buses.bus_150_a })}
                className="absolute top-[95px] bg-teal-950/90 border-2 border-teal-500/80 hover:border-amber-400 px-4 py-1.5 rounded-xl shadow-lg cursor-pointer transition-all hover:scale-105 active:scale-95"
                style={{ left: '280px', transform: 'translateX(-50%)' }}
              >
                <span className="text-[9px] font-bold block text-teal-300">BUS 150 kV - A</span>
                <span className="text-xs font-black text-teal-100">{dccState.buses.bus_150_a.voltageKv} kV</span>
              </div>

              {/* BUS 150kV - B */}
              <div 
                onClick={() => setEditingComponent({ type: 'bus', id: 'bus_150_b', data: dccState.buses.bus_150_b })}
                className="absolute top-[95px] bg-teal-950/90 border-2 border-teal-500/80 hover:border-amber-400 px-4 py-1.5 rounded-xl shadow-lg cursor-pointer transition-all hover:scale-105 active:scale-95"
                style={{ left: '920px', transform: 'translateX(-50%)' }}
              >
                <span className="text-[9px] font-bold block text-teal-300">BUS 150 kV - B</span>
                <span className="text-xs font-black text-teal-100">{dccState.buses.bus_150_b.voltageKv} kV</span>
              </div>

              {/* PMT 150-T1 & PMT 150-T2 Breakers */}
              {/* PMT 150-T1 */}
              <div 
                className="absolute top-[175px] flex items-center gap-2 bg-[#021815] p-1 border border-teal-900 rounded-xl"
                style={{ left: '280px', transform: 'translateX(-50%)' }}
              >
                <button 
                  onClick={() => handleToggleBreaker('pmt_150_t1')}
                  className={`w-7 h-7 rounded-lg text-[10px] font-black flex items-center justify-center cursor-pointer transition-all hover:scale-110 active:scale-90 ${
                    dccState.breakers.pmt_150_t1.status === 'CLOSED'
                      ? 'bg-emerald-500 text-slate-950 border border-emerald-300'
                      : 'bg-rose-500 text-white border border-rose-300 animate-pulse'
                  }`}
                >
                  {dccState.breakers.pmt_150_t1.status === 'CLOSED' ? 'C' : 'T'}
                </button>
                <span className="text-[9px] font-extrabold text-teal-400 pr-1.5">PMT 150-T1</span>
              </div>

              {/* PMT 150-T2 */}
              <div 
                className="absolute top-[175px] flex items-center gap-2 bg-[#021815] p-1 border border-teal-900 rounded-xl"
                style={{ left: '920px', transform: 'translateX(-50%)' }}
              >
                <button 
                  onClick={() => handleToggleBreaker('pmt_150_t2')}
                  className={`w-7 h-7 rounded-lg text-[10px] font-black flex items-center justify-center cursor-pointer transition-all hover:scale-110 active:scale-90 ${
                    dccState.breakers.pmt_150_t2.status === 'CLOSED'
                      ? 'bg-emerald-500 text-slate-950 border border-emerald-300'
                      : 'bg-rose-500 text-white border border-rose-300 animate-pulse'
                  }`}
                >
                  {dccState.breakers.pmt_150_t2.status === 'CLOSED' ? 'C' : 'T'}
                </button>
                <span className="text-[9px] font-extrabold text-teal-400 pr-1.5">PMT 150-T2</span>
              </div>

              {/* Transformers TRAFO 1 & TRAFO 2 */}
              {/* TRAFO 1 */}
              <div 
                onClick={() => setEditingComponent({ type: 'trafo', id: 'trafo_1', data: dccState.trafos.trafo_1 })}
                className="absolute top-[235px] bg-[#02201b] border-2 border-teal-500 hover:border-amber-400 p-3.5 rounded-2xl shadow-xl w-[250px] cursor-pointer transition-all hover:scale-105"
                style={{ left: '280px', transform: 'translateX(-50%)' }}
              >
                <div className="flex justify-between items-center border-b border-teal-900 pb-1.5 mb-2">
                  <span className="text-[10px] font-black text-teal-300">{dccState.trafos.trafo_1.name}</span>
                  <span className="text-[8px] bg-teal-500/10 text-teal-300 px-1.5 py-0.5 rounded border border-teal-500/30">150/20 kV</span>
                </div>
                
                <div className="space-y-1 text-[10px]">
                  <div className="flex justify-between">
                    <span className="text-teal-400/80">Pembebanan:</span>
                    <span className="font-extrabold text-teal-100">{dccState.trafos.trafo_1.loadMw} MW ({((dccState.trafos.trafo_1.loadMw / dccState.trafos.trafo_1.capacityMva) * 100).toFixed(1)}%)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-teal-400/80">Posisi Tap:</span>
                    <span className="font-extrabold text-teal-100">{dccState.trafos.trafo_1.tap}/{dccState.trafos.trafo_1.tapMax} ({dccState.trafos.trafo_1.isAutoTap ? 'AUTO' : 'MANUAL'})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-teal-400/80">Suhu Winding:</span>
                    <span className={`font-extrabold ${dccState.trafos.trafo_1.tempWdy > 65 ? 'text-amber-400' : 'text-teal-100'}`}>{dccState.trafos.trafo_1.tempWdy}°C - ONAF</span>
                  </div>
                </div>

                {/* Dual circles SCADA icon */}
                <div className="flex justify-center mt-3 gap-0.5 relative h-8">
                  <div className="w-7 h-7 rounded-full border border-teal-400 flex items-center justify-center text-[7px] text-teal-300 font-extrabold bg-[#02201b]/80 z-10 shadow-md">150kV</div>
                  <div className="w-7 h-7 rounded-full border border-teal-400 flex items-center justify-center text-[7px] text-teal-300 font-extrabold bg-[#02201b]/80 z-0 -ml-2.5 shadow-md">20kV</div>
                </div>
              </div>

              {/* TRAFO 2 */}
              <div 
                onClick={() => setEditingComponent({ type: 'trafo', id: 'trafo_2', data: dccState.trafos.trafo_2 })}
                className="absolute top-[235px] bg-[#02201b] border-2 border-teal-500 hover:border-amber-400 p-3.5 rounded-2xl shadow-xl w-[250px] cursor-pointer transition-all hover:scale-105"
                style={{ left: '920px', transform: 'translateX(-50%)' }}
              >
                <div className="flex justify-between items-center border-b border-teal-900 pb-1.5 mb-2">
                  <span className="text-[10px] font-black text-teal-300">{dccState.trafos.trafo_2.name}</span>
                  <span className="text-[8px] bg-teal-500/10 text-teal-300 px-1.5 py-0.5 rounded border border-teal-500/30">150/20 kV</span>
                </div>
                
                <div className="space-y-1 text-[10px]">
                  <div className="flex justify-between">
                    <span className="text-teal-400/80">Pembebanan:</span>
                    <span className="font-extrabold text-teal-100">{dccState.trafos.trafo_2.loadMw} MW ({((dccState.trafos.trafo_2.loadMw / dccState.trafos.trafo_2.capacityMva) * 100).toFixed(1)}%)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-teal-400/80">Posisi Tap:</span>
                    <span className="font-extrabold text-teal-100">{dccState.trafos.trafo_2.tap}/{dccState.trafos.trafo_2.tapMax} ({dccState.trafos.trafo_2.isAutoTap ? 'AUTO' : 'MANUAL'})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-teal-400/80">Suhu Winding:</span>
                    <span className={`font-extrabold ${dccState.trafos.trafo_2.tempWdy > 65 ? 'text-amber-400' : 'text-teal-100'}`}>{dccState.trafos.trafo_2.tempWdy}°C - ONAF</span>
                  </div>
                </div>

                {/* Dual circles SCADA icon */}
                <div className="flex justify-center mt-3 gap-0.5 relative h-8">
                  <div className="w-7 h-7 rounded-full border border-teal-400 flex items-center justify-center text-[7px] text-teal-300 font-extrabold bg-[#02201b]/80 z-10 shadow-md">150kV</div>
                  <div className="w-7 h-7 rounded-full border border-teal-400 flex items-center justify-center text-[7px] text-teal-300 font-extrabold bg-[#02201b]/80 z-0 -ml-2.5 shadow-md">20kV</div>
                </div>
              </div>

              {/* PMT TNC-1 & PMT TNC-2 & PMT KOPEL */}
              {/* PMT TNC-1 */}
              <div 
                className="absolute top-[395px] flex items-center gap-2 bg-[#021815] p-1 border border-teal-900 rounded-xl"
                style={{ left: '280px', transform: 'translateX(-50%)' }}
              >
                <button 
                  onClick={() => handleToggleBreaker('pmt_tnc_1')}
                  className={`w-7 h-7 rounded-lg text-[10px] font-black flex items-center justify-center cursor-pointer transition-all hover:scale-110 active:scale-90 ${
                    dccState.breakers.pmt_tnc_1.status === 'CLOSED'
                      ? 'bg-emerald-500 text-slate-950 border border-emerald-300'
                      : 'bg-rose-500 text-white border border-rose-300 animate-pulse'
                  }`}
                >
                  {dccState.breakers.pmt_tnc_1.status === 'CLOSED' ? 'C' : 'T'}
                </button>
                <div className="text-left">
                  <span className="text-[9px] font-black text-teal-300 block">PMT TNC-1 (20kV)</span>
                  <span className="text-[7px] bg-teal-500/10 text-teal-400 px-1 rounded border border-teal-500/20 uppercase">REL: OCR/GFR</span>
                </div>
              </div>

              {/* PMT KOPEL In the middle */}
              <div 
                className="absolute top-[480px] flex items-center gap-1.5 bg-[#021815] p-1 border border-teal-900 rounded-xl z-20"
                style={{ left: '600px', transform: 'translateX(-50%)' }}
              >
                <button 
                  onClick={() => handleToggleBreaker('pmt_kopel')}
                  className={`w-7 h-7 rounded-lg text-[10px] font-black flex items-center justify-center cursor-pointer transition-all hover:scale-110 active:scale-90 ${
                    dccState.breakers.pmt_kopel.status === 'CLOSED'
                      ? 'bg-emerald-500 text-slate-950 border border-emerald-300'
                      : 'bg-rose-500 text-white border border-rose-300 animate-pulse'
                  }`}
                  title="Kopel Bus A & Bus B"
                >
                  {dccState.breakers.pmt_kopel.status === 'CLOSED' ? 'C' : 'T'}
                </button>
                <span className="text-[8px] font-black text-teal-300 pr-1">PMT KOPEL</span>
              </div>

              {/* PMT TNC-2 */}
              <div 
                className="absolute top-[395px] flex items-center gap-2 bg-[#021815] p-1 border border-teal-900 rounded-xl"
                style={{ left: '920px', transform: 'translateX(-50%)' }}
              >
                <button 
                  onClick={() => handleToggleBreaker('pmt_tnc_2')}
                  className={`w-7 h-7 rounded-lg text-[10px] font-black flex items-center justify-center cursor-pointer transition-all hover:scale-110 active:scale-90 ${
                    dccState.breakers.pmt_tnc_2.status === 'CLOSED'
                      ? 'bg-emerald-500 text-slate-950 border border-emerald-300'
                      : 'bg-rose-500 text-white border border-rose-300 animate-pulse'
                  }`}
                >
                  {dccState.breakers.pmt_tnc_2.status === 'CLOSED' ? 'C' : 'T'}
                </button>
                <div className="text-left">
                  <span className="text-[9px] font-black text-teal-300 block">PMT TNC-2 (20kV)</span>
                  <span className="text-[7px] bg-teal-500/10 text-teal-400 px-1 rounded border border-teal-500/20 uppercase">REL: OCR/GFR</span>
                </div>
              </div>

              {/* BUS 20kV Horizontal Busbar line indicators */}
              {/* BUS 20kV - A Label */}
              <div 
                onClick={() => setEditingComponent({ type: 'bus', id: 'bus_20_a', data: dccState.buses.bus_20_a })}
                className="absolute top-[480px] bg-teal-950/90 border border-teal-500/60 hover:border-amber-400 px-3 py-1 rounded-xl shadow-lg cursor-pointer transition-all hover:scale-105"
                style={{ left: '280px', transform: 'translateX(-50%)' }}
              >
                <span className="text-[8px] font-bold block text-teal-300">BUS 20kV - A</span>
                <span className="text-[10px] font-black text-teal-100">{dccState.buses.bus_20_a.voltageKv} kV</span>
              </div>

              {/* BUS 20kV - B Label */}
              <div 
                onClick={() => setEditingComponent({ type: 'bus', id: 'bus_20_b', data: dccState.buses.bus_20_b })}
                className="absolute top-[480px] bg-teal-950/90 border border-teal-500/60 hover:border-amber-400 px-3 py-1 rounded-xl shadow-lg cursor-pointer transition-all hover:scale-105"
                style={{ left: '920px', transform: 'translateX(-50%)' }}
              >
                <span className="text-[8px] font-bold block text-teal-300">BUS 20kV - B</span>
                <span className="text-[10px] font-black text-teal-100">{dccState.buses.bus_20_b.voltageKv} kV</span>
              </div>

              {/* 6 FEEDERS DISPLAY CARDS (F-01 through F-06) */}
              {/* Loop F-01 to F-06 */}
              {Object.keys(dccState.feeders).map((key) => {
                const f = dccState.feeders[key];
                const brkId = `${key}_brk`;
                const isTripped = f.status === 'TRIP';
                const associatedBreaker = dccState.breakers[brkId];
                
                const isFeederActive = 
                  f.id === 'f01' ? isF01Active :
                  f.id === 'f02' ? isF02Active :
                  f.id === 'f03' ? isF03Active :
                  f.id === 'f04' ? isF04Active :
                  f.id === 'f05' ? isF05Active :
                  isF06Active;
                
                const nodes = (dccState.downstreamNodes && dccState.downstreamNodes[f.id]) || [];

                // Map each feeder to its exact mathematical center in the SVG
                const horizontalCenter = {
                  f01: '120px',
                  f02: '280px',
                  f03: '440px',
                  f04: '760px',
                  f05: '920px',
                  f06: '1080px'
                }[f.id] || '120px';

                return (
                  <div 
                    key={`fd_container_${f.id}`} 
                    className="absolute top-[540px] w-[148px] flex flex-col items-center" 
                    style={{ left: horizontalCenter, transform: 'translateX(-50%)' }}
                  >
                    
                    {/* Feeder inline Breaker Button (PMT F-X) */}
                    {associatedBreaker && (
                      <div className="bg-[#021815] px-1 py-0.5 rounded-lg border border-teal-900/80 mb-6 flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleToggleBreaker(brkId)}
                          className={`w-6 h-6 rounded text-[9px] font-black flex items-center justify-center cursor-pointer transition-all ${
                            associatedBreaker.status === 'CLOSED'
                              ? 'bg-emerald-500 text-slate-950 border border-emerald-300'
                              : 'bg-rose-500 text-white border border-rose-300 animate-pulse'
                          }`}
                        >
                          {associatedBreaker.status === 'CLOSED' ? 'C' : 'T'}
                        </button>
                        <span className="text-[8px] font-extrabold text-teal-400 pr-1 uppercase">{f.code}</span>
                      </div>
                    )}

                    {/* Feeder card wrapper */}
                    <div 
                      onClick={() => setEditingComponent({ type: 'feeder', id: f.id, data: f })}
                      className={`w-full rounded-2xl border p-3 shadow-xl cursor-pointer transition-all duration-200 hover:scale-[1.04] text-left relative shrink-0 ${
                        isTripped 
                          ? 'bg-rose-950/20 border-rose-500/60 shadow-rose-950/15' 
                          : 'bg-[#021a17]/95 border-teal-500/50 shadow-teal-950/20'
                      }`}
                    >
                      {/* Status Header Badge */}
                      <div className="flex justify-between items-center border-b border-teal-950 pb-1 mb-2">
                        <span className={`text-[10px] font-black ${isTripped ? 'text-rose-400' : 'text-teal-300'}`}>{f.code}</span>
                        <span className={`text-[8px] px-1.5 py-0.5 rounded font-black tracking-tighter ${
                          isTripped ? 'bg-rose-900/40 text-rose-400 border border-rose-500/40' : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        }`}>
                          {isTripped ? 'TRIP' : 'ENERGIZED'}
                        </span>
                      </div>

                      {/* Name */}
                      <div className="text-[10px] font-extrabold text-slate-200 mb-2 truncate" title={f.name}>{f.name}</div>

                      {/* Parameters */}
                      <div className="space-y-1 text-[9px] text-slate-300">
                        <div className="flex justify-between">
                          <span>I (Arus):</span>
                          <span className={`font-extrabold ${isTripped ? 'text-rose-400' : 'text-amber-300'}`}>{f.currentA} A</span>
                        </div>
                        <div className="flex justify-between">
                          <span>P (Daya):</span>
                          <span className="font-extrabold">{f.powerMw} MW</span>
                        </div>
                        <div className="flex justify-between">
                          <span>V (Tegangan):</span>
                          <span className="font-extrabold">{f.voltageKv} kV</span>
                        </div>
                        <div className="flex justify-between">
                          <span>cos φ:</span>
                          <span className="font-extrabold text-amber-400/85">{f.cosPhi.toFixed(3)}</span>
                        </div>
                      </div>

                      {/* Indicator dot */}
                      <span className={`absolute top-1.5 right-1.5 flex h-1.5 w-1.5`}>
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isTripped ? 'bg-rose-400' : 'bg-emerald-400'}`}></span>
                        <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${isTripped ? 'bg-rose-500' : 'bg-emerald-500'}`}></span>
                      </span>
                    </div>

                    {/* Feeder Quick Simulation Button underneath */}
                    <button
                      onClick={() => handleSimulateTripFeeder(f.id)}
                      className={`mt-3 w-full py-1.5 px-2.5 rounded-xl text-[9px] font-black tracking-tight border transition-all cursor-pointer hover:scale-105 active:scale-95 shrink-0 ${
                        isTripped 
                          ? 'bg-rose-500 text-white border-rose-300 shadow-md shadow-rose-950/40' 
                          : 'bg-emerald-950/45 text-emerald-300 border-emerald-700/60 hover:bg-emerald-900/60'
                      }`}
                    >
                      ⚡ SIMULASI {isTripped ? 'CLOSE' : 'TRIP'}
                    </button>

                    {/* Downstream Jaringan Section */}
                    <div className="w-full mt-4 flex flex-col items-center">
                      {/* Connecting Line from Feeder Card to Downstream Nodes */}
                      <div className={`w-0.5 h-6 border-l-2 border-dashed transition-all duration-300 ${
                        isFeederActive ? 'border-emerald-500 animate-pulse' : 'border-rose-500/60'
                      }`} />

                      {/* Title & Plus Button */}
                      <div className="w-full flex items-center justify-between px-2 py-1.5 bg-[#021815] rounded-xl border border-teal-900/55 shadow-md">
                        <span className="text-[7.5px] font-black text-teal-300 tracking-wider">PERALATAN JTM</span>
                        <button
                          onClick={() => {
                            setAddingNodeForFeeder(f.id);
                            setAddingNodeParentId(null);
                            setNewNodeName('');
                            setNewNodeType('LBS');
                            setNewNodeStatus('CLOSED');
                          }}
                          className="p-1 rounded-lg bg-[#012823] hover:bg-emerald-600 hover:text-white text-emerald-400 transition-all cursor-pointer border border-emerald-500/20 active:scale-90"
                          title="Tambah Peralatan JTM"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* List of Downstream Nodes */}
                      <div className="w-full mt-3">
                        {nodes.length === 0 ? (
                          <div className="text-[8px] text-slate-500 text-center py-2.5 px-1 border border-dashed border-teal-950/50 rounded-xl bg-teal-950/5">
                            Belum ada GH/LBS/Recloser
                          </div>
                        ) : (
                          renderJtmNodeTree(nodes, isFeederActive, f.id)
                        )}
                      </div>
                    </div>

                  </div>
                );
              })}

            </div>

          </div>
        </div>

        {/* Floating Side Legenda & Quick Panel */}
        {showLegenda && (
          <div className="absolute bottom-5 left-5 z-20 bg-[#021815]/95 border border-teal-800 rounded-2xl p-4 shadow-2xl max-w-[280px] backdrop-blur-md animate-fade-in text-[10px] space-y-3">
            <div className="flex items-center justify-between border-b border-teal-900 pb-1.5 mb-2">
              <span className="font-black text-teal-300 uppercase">Legenda Simbol DCC</span>
              <button onClick={() => setShowLegenda(false)} className="text-slate-400 hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-emerald-500 text-slate-950 rounded flex items-center justify-center font-black text-[8px]">C</div>
                <span className="text-slate-200">PMT / Breaker **CLOSED** (Aliran Listrik Tersambung)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-rose-500 text-white rounded flex items-center justify-center font-black text-[8px]">T</div>
                <span className="text-slate-200">PMT / Breaker **TRIP** (Aliran Terputus)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-0.5 bg-[#22c55e] shadow-xs shadow-emerald-500" />
                <span className="text-slate-200 font-bold">Garis Hijau (CLOSED / ENERGIZED)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-0.5 bg-[#ef4444] shadow-xs shadow-rose-500" />
                <span className="text-slate-200 font-bold">Garis Merah (TRIP / DE-ENERGIZED)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full border border-teal-400 bg-teal-500/10" />
                <span className="text-slate-200">Kumparan Trafo Distribusi</span>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Editing Component modal (Handles "bisa di edit" parameter modifications) */}
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
              
              {/* TRAFO EDIT FIELDS */}
              {editingComponent.type === 'trafo' && (
                <div className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-teal-400 mb-1">Nama Trafo</label>
                    <input 
                      type="text"
                      className="w-full bg-[#011412] border border-teal-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                      value={editingComponent.data.name}
                      onChange={(e) => setEditingComponent({
                        ...editingComponent,
                        data: { ...editingComponent.data, name: e.target.value }
                      })}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-teal-400 mb-1">Beban (MW)</label>
                      <input 
                        type="number"
                        step="0.1"
                        className="w-full bg-[#011412] border border-teal-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                        value={editingComponent.data.loadMw}
                        onChange={(e) => setEditingComponent({
                          ...editingComponent,
                          data: { ...editingComponent.data, loadMw: parseFloat(e.target.value) || 0 }
                        })}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-teal-400 mb-1">Kapasitas (MVA)</label>
                      <input 
                        type="number"
                        className="w-full bg-[#011412] border border-teal-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                        value={editingComponent.data.capacityMva}
                        onChange={(e) => setEditingComponent({
                          ...editingComponent,
                          data: { ...editingComponent.data, capacityMva: parseInt(e.target.value) || 0 }
                        })}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-teal-400 mb-1">Posisi Tap</label>
                      <input 
                        type="number"
                        className="w-full bg-[#011412] border border-teal-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                        value={editingComponent.data.tap}
                        onChange={(e) => setEditingComponent({
                          ...editingComponent,
                          data: { ...editingComponent.data, tap: parseInt(e.target.value) || 0 }
                        })}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-teal-400 mb-1">Suhu Winding (°C)</label>
                      <input 
                        type="number"
                        step="0.1"
                        className="w-full bg-[#011412] border border-teal-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                        value={editingComponent.data.tempWdy}
                        onChange={(e) => setEditingComponent({
                          ...editingComponent,
                          data: { ...editingComponent.data, tempWdy: parseFloat(e.target.value) || 0 }
                        })}
                        required
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input 
                      type="checkbox"
                      id="isAutoTap"
                      className="rounded border-teal-800 text-teal-500 focus:ring-teal-500 h-4 w-4 bg-[#011412] cursor-pointer"
                      checked={editingComponent.data.isAutoTap}
                      onChange={(e) => setEditingComponent({
                        ...editingComponent,
                        data: { ...editingComponent.data, isAutoTap: e.target.checked }
                      })}
                    />
                    <label htmlFor="isAutoTap" className="text-xs font-bold text-teal-300 cursor-pointer">Regulasi Tap Otomatis (AUTO)</label>
                  </div>
                </div>
              )}

              {/* BUS EDIT FIELDS */}
              {editingComponent.type === 'bus' && (
                <div className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-teal-400 mb-1">Nama Busbar</label>
                    <input 
                      type="text"
                      className="w-full bg-[#011412] border border-teal-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
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
                      className="w-full bg-[#011412] border border-teal-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
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

              {/* FEEDER EDIT FIELDS */}
              {editingComponent.type === 'feeder' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-teal-400 mb-1">Kode Feeder</label>
                      <input 
                        type="text"
                        className="w-full bg-[#011412] border border-teal-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
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
                        className="w-full bg-[#011412] border border-teal-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
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
                        className="w-full bg-[#011412] border border-teal-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                        value={editingComponent.data.currentA}
                        onChange={(e) => setEditingComponent({
                          ...editingComponent,
                          data: { ...editingComponent.data, currentA: parseInt(e.target.value) || 0 }
                        })}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-teal-400 mb-1">Daya Feeder (MW)</label>
                      <input 
                        type="number"
                        step="0.01"
                        className="w-full bg-[#011412] border border-teal-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                        value={editingComponent.data.powerMw}
                        onChange={(e) => setEditingComponent({
                          ...editingComponent,
                          data: { ...editingComponent.data, powerMw: parseFloat(e.target.value) || 0 }
                        })}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-teal-400 mb-1">Tegangan (kV)</label>
                      <input 
                        type="number"
                        step="0.1"
                        className="w-full bg-[#011412] border border-teal-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                        value={editingComponent.data.voltageKv}
                        onChange={(e) => setEditingComponent({
                          ...editingComponent,
                          data: { ...editingComponent.data, voltageKv: parseFloat(e.target.value) || 0 }
                        })}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-teal-400 mb-1">Faktor Daya (cos φ)</label>
                      <input 
                        type="number"
                        step="0.001"
                        min="0"
                        max="1"
                        className="w-full bg-[#011412] border border-teal-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
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
                      className="w-full bg-[#011412] border border-teal-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 cursor-pointer"
                      value={editingComponent.data.status}
                      onChange={(e) => setEditingComponent({
                        ...editingComponent,
                        data: { ...editingComponent.data, status: e.target.value as any }
                      })}
                    >
                      <option value="ENERGIZED">✅ BERTEGANGAN (ENERGIZED)</option>
                      <option value="TRIP">⚠️ GANGGUAN TRIP (DE-ENERGIZED)</option>
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

      {/* Add Downstream Node Modal */}
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
                {addingNodeParentId ? 'Tambah Percabangan JTM' : `Tambah Peralatan JTM (${addingNodeForFeeder.toUpperCase()})`}
              </h3>
            </div>

            <div className="space-y-4">
              {addingNodeParentId && (
                <div className="bg-teal-950/40 border border-teal-900 px-3 py-2 rounded-xl text-[10px] font-bold text-teal-300">
                  Sistem akan membuat percabangan baru di bawah ID: <span className="text-amber-400 select-all font-mono">{addingNodeParentId}</span>
                </div>
              )}

              {/* Type selector */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1.5">Jenis Peralatan:</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['GH', 'LBS', 'RECLOSER', 'PMCB', 'CO', 'DS'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => {
                        setNewNodeType(type);
                        if (!newNodeName || newNodeName.startsWith('GH ') || newNodeName.startsWith('LBS ') || newNodeName.startsWith('Recloser ') || newNodeName.startsWith('PMCB ') || newNodeName.startsWith('CO ') || newNodeName.startsWith('DS ') || newNodeName.endsWith(' Baru')) {
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
                  placeholder="e.g. LBS Pondok Labu"
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
                    🔴 CLOSED (ON / Bertegangan)
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
                    🟢 TRIP (OPEN / Mati)
                  </button>
                </div>
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
                    handleAddDownstreamNode(addingNodeForFeeder, addingNodeParentId, newNodeName, newNodeType, newNodeStatus);
                    setAddingNodeForFeeder(null);
                    setAddingNodeParentId(null);
                  }}
                  className="px-4 py-2 rounded-xl text-teal-950 bg-gradient-to-tr from-teal-400 via-teal-300 to-emerald-300 font-extrabold text-xs shadow-md shadow-teal-400/20 hover:scale-[1.02] active:scale-95 cursor-pointer"
                >
                  Tambah Peralatan
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};
