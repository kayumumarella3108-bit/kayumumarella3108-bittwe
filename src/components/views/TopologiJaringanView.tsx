import React, { useState, useEffect } from 'react';
import {
  GitGraph,
  Plus,
  Search,
  Filter,
  Zap,
  Power,
  Shield,
  Activity,
  ChevronRight,
  ChevronDown,
  Building2,
  Trash2,
  Edit3,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Printer,
  Download,
  Info,
  Layers,
  Sparkles,
  X,
  Server,
  Radio,
  Share2,
  ToggleLeft,
  ToggleRight,
  SlidersHorizontal,
  FolderPlus,
  Box
} from 'lucide-react';
import { Penyulang, User, NodeTopologi, TipeNodeTopologi, SectionJaringan } from '../../types';
import { TambahSectionModal } from '../modals/TambahSectionModal';
import { InputTopologiBatchModal } from '../modals/InputTopologiBatchModal';

interface TopologiJaringanViewProps {
  currentUser?: User | null;
  penyulangList: Penyulang[];
  sectionList?: SectionJaringan[];
  onAddSection?: (section: SectionJaringan) => void;
  onDeleteSection?: (id: string) => void;
}

const INITIAL_TOPOLOGY_NODES: NodeTopologi[] = [
  // --- FEEDER PASSO (PSO) ---
  {
    id: 'node-pso-pmcb',
    penyulangId: '14',
    namaPenyulang: 'PASSO',
    namaSection: 'Section 1 (GI Passo - GH Passo)',
    kodeNode: 'PMCB-PSO-01',
    namaNode: 'PMCB Outgoing 20kV GI Passo (PMT 10)',
    tipe: 'PMCB',
    parentId: null,
    statusOperasi: 'CLOSED',
    lokasiTiangOrAlamat: 'Kubikel Outgoing GI Passo, Ambon',
    kapasitasOrAmpere: '630A / 20kV - 25kA',
    merekPeralatan: 'Schneider / ABB',
    isScadaRemote: true,
    jumlahPelangganTerdampak: 1850
  },
  {
    id: 'node-pso-rec1',
    penyulangId: '14',
    namaPenyulang: 'PASSO',
    namaSection: 'Section 1 (GI Passo - GH Passo)',
    kodeNode: 'REC-PSO-01',
    namaNode: 'Recloser Utama Passo (Tiang #15)',
    tipe: 'REC',
    parentId: 'node-pso-pmcb',
    statusOperasi: 'CLOSED',
    lokasiTiangOrAlamat: 'Jl. Trans-Seram Tiang #15',
    kapasitasOrAmpere: '400A / SEL-351 Control',
    merekPeralatan: 'Entec / Nulik',
    isScadaRemote: true,
    jumlahPelangganTerdampak: 1400
  },
  {
    id: 'node-pso-gh',
    penyulangId: '14',
    namaPenyulang: 'PASSO',
    namaSection: 'Section 1 (GI Passo - GH Passo)',
    kodeNode: 'GH-PSO',
    namaNode: 'Gardu Hubung (GH) Passo 20kV',
    tipe: 'GH',
    parentId: 'node-pso-rec1',
    statusOperasi: 'CLOSED',
    lokasiTiangOrAlamat: 'Simpang Tiga GH Passo',
    kapasitasOrAmpere: 'Busbar 630A 20kV',
    merekPeralatan: 'ABB SafeRing',
    isScadaRemote: true,
    jumlahPelangganTerdampak: 1100
  },
  {
    id: 'node-pso-lbs-mcm',
    penyulangId: '14',
    namaPenyulang: 'PASSO',
    namaSection: 'Section 2 (GH Passo - LBS MCM)',
    kodeNode: 'LBS-MCM-01',
    namaNode: 'LBS Motorized Arah Mall MCM',
    tipe: 'LBS',
    parentId: 'node-pso-gh',
    statusOperasi: 'CLOSED',
    lokasiTiangOrAlamat: 'Depan Mall MCM Tiang #32',
    kapasitasOrAmpere: '630A Motorized SF6',
    merekPeralatan: 'Jinpan / Cooper',
    isScadaRemote: true,
    jumlahPelangganTerdampak: 450
  },
  {
    id: 'node-pso-ds-1',
    penyulangId: '14',
    namaPenyulang: 'PASSO',
    namaSection: 'Section 2 (GH Passo - LBS MCM)',
    kodeNode: 'DS-PSO-02',
    namaNode: 'Disconnecting Switch (DS) Bypass LBS',
    tipe: 'DS',
    parentId: 'node-pso-lbs-mcm',
    statusOperasi: 'CLOSED',
    lokasiTiangOrAlamat: 'Tiang #33 Bypass MCM',
    kapasitasOrAmpere: '630A Air Break',
    merekPeralatan: 'Phelps Dodge',
    isScadaRemote: false,
    jumlahPelangganTerdampak: 450
  },
  {
    id: 'node-pso-perc-lateri',
    penyulangId: '14',
    namaPenyulang: 'PASSO',
    namaSection: 'Section 3 (Lateri Atas)',
    kodeNode: 'PERC-LTR',
    namaNode: 'Percabangan Lateral Lateri Atas',
    tipe: 'PERCABANGAN',
    parentId: 'node-pso-gh',
    statusOperasi: 'CLOSED',
    lokasiTiangOrAlamat: 'Simpang Lateri Tiang #45',
    kapasitasOrAmpere: 'SUTM A3C 150mm²',
    merekPeralatan: 'PLN Standard',
    isScadaRemote: false,
    jumlahPelangganTerdampak: 650
  },
  {
    id: 'node-pso-fco-lateri',
    penyulangId: '14',
    namaPenyulang: 'PASSO',
    namaSection: 'Section 3 (Lateri Atas)',
    kodeNode: 'FCO-LTR-01',
    namaNode: 'Fuse Cut Out Percabangan Lateri',
    tipe: 'FCO',
    parentId: 'node-pso-perc-lateri',
    statusOperasi: 'CLOSED',
    lokasiTiangOrAlamat: 'Tiang Percabangan #46 Lateri',
    kapasitasOrAmpere: '25A Fuse Link Type K',
    merekPeralatan: 'Kearney',
    isScadaRemote: false,
    jumlahPelangganTerdampak: 350
  },
  {
    id: 'node-pso-gtt-1',
    penyulangId: '14',
    namaPenyulang: 'PASSO',
    namaSection: 'Section 3 (Lateri Atas)',
    kodeNode: 'GTT-PSO-012',
    namaNode: 'Gardu Trafo (GTT) Passo Pasar',
    tipe: 'GTT',
    parentId: 'node-pso-fco-lateri',
    statusOperasi: 'CLOSED',
    lokasiTiangOrAlamat: 'Pasar Passo Tiang #50',
    kapasitasOrAmpere: '160 kVA 20kV/400V',
    merekPeralatan: 'Btrafo / Unindo',
    isScadaRemote: false,
    jumlahPelangganTerdampak: 180
  },

  // --- FEEDER WAIHERU 1 (WH1) ---
  {
    id: 'node-wh1-pmcb',
    penyulangId: '18',
    namaPenyulang: 'WAIHERU 1',
    namaSection: 'Section 1 (GI Passo - LBS Waiheru)',
    kodeNode: 'PMCB-WH1-01',
    namaNode: 'PMCB Outgoing Waiheru 1 GI Passo',
    tipe: 'PMCB',
    parentId: null,
    statusOperasi: 'CLOSED',
    lokasiTiangOrAlamat: 'GI Passo Feeder Waiheru 1',
    kapasitasOrAmpere: '630A / 20kV',
    merekPeralatan: 'Siemens',
    isScadaRemote: true,
    jumlahPelangganTerdampak: 3005
  },
  {
    id: 'node-wh1-lbs1',
    penyulangId: '18',
    namaPenyulang: 'WAIHERU 1',
    namaSection: 'Section 1 (GI Passo - LBS Waiheru)',
    kodeNode: 'LBS-WH-01',
    namaNode: 'LBS Waiheru Poka (Tiang #28)',
    tipe: 'LBS',
    parentId: 'node-wh1-pmcb',
    statusOperasi: 'CLOSED',
    lokasiTiangOrAlamat: 'Jl. Raya Waiheru Tiang #28',
    kapasitasOrAmpere: '630A SF6',
    merekPeralatan: 'Schneider',
    isScadaRemote: true,
    jumlahPelangganTerdampak: 1900
  },
  {
    id: 'node-wh1-gh',
    penyulangId: '18',
    namaPenyulang: 'WAIHERU 1',
    namaSection: 'Section 2 (LBS Waiheru - GH Bandara)',
    kodeNode: 'GH-WH',
    namaNode: 'Gardu Hubung (GH) Waiheru / Laha',
    tipe: 'GH',
    parentId: 'node-wh1-lbs1',
    statusOperasi: 'CLOSED',
    lokasiTiangOrAlamat: 'Kawasan GH Waiheru Bandara',
    kapasitasOrAmpere: 'Busbar 630A',
    merekPeralatan: 'ABB',
    isScadaRemote: true,
    jumlahPelangganTerdampak: 1100
  },
  {
    id: 'node-wh1-rec',
    penyulangId: '18',
    namaPenyulang: 'WAIHERU 1',
    namaSection: 'Section 2 (LBS Waiheru - GH Bandara)',
    kodeNode: 'REC-WH-02',
    namaNode: 'Recloser Arah Bandara Pattimura',
    tipe: 'REC',
    parentId: 'node-wh1-gh',
    statusOperasi: 'CLOSED',
    lokasiTiangOrAlamat: 'Akses Bandara Tiang #62',
    kapasitasOrAmpere: '400A',
    merekPeralatan: 'Entec',
    isScadaRemote: true,
    jumlahPelangganTerdampak: 750
  },
  {
    id: 'node-wh1-fco-laha',
    penyulangId: '18',
    namaPenyulang: 'WAIHERU 1',
    namaSection: 'Section 3 (Spur Bandara / Laha)',
    kodeNode: 'FCO-LHA',
    namaNode: 'FCO Percabangan Negeri Laha',
    tipe: 'FCO',
    parentId: 'node-wh1-rec',
    statusOperasi: 'CLOSED',
    lokasiTiangOrAlamat: 'Simpang Laha Tiang #78',
    kapasitasOrAmpere: '15A Fuse Link',
    merekPeralatan: 'S&C Electric',
    isScadaRemote: false,
    jumlahPelangganTerdampak: 320
  }
];

export const TopologiJaringanView: React.FC<TopologiJaringanViewProps> = ({
  currentUser,
  penyulangList,
  sectionList = [],
  onAddSection,
  onDeleteSection
}) => {
  // Sync selected penyulang ID
  const [selectedPenyulangId, setSelectedPenyulangId] = useState<string>('14'); // Default PASSO
  const [nodes, setNodes] = useState<NodeTopologi[]>(() => {
    const saved = localStorage.getItem('topologi_nodes_v2');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing topologi_nodes_v2:', e);
      }
    }
    return INITIAL_TOPOLOGY_NODES;
  });

  const [activeTab, setActiveTab] = useState<'feeder_utama' | 'section_list' | 'table'>('feeder_utama');
  const [selectedSectionFilter, setSelectedSectionFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTipe, setFilterTipe] = useState<string>('all');

  // Modal Node Add / Edit State
  const [isNodeModalOpen, setIsNodeModalOpen] = useState(false);
  const [editingNode, setEditingNode] = useState<NodeTopologi | null>(null);

  // Modal Multi Equipment Batch State
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);

  // Modal Section Add State
  const [isAddSectionModalOpen, setIsAddSectionModalOpen] = useState(false);

  // Active Penyulang from Master Data
  const activePenyulang = penyulangList.find((p) => p.id === selectedPenyulangId) ||
    penyulangList.find((p) => p.namaPenyulang === 'PASSO') ||
    penyulangList[0] || {
      id: '14',
      namaPenyulang: 'PASSO',
      kodeId: 'PSO',
      namaGi: 'GI PASSO',
      panjangJaringanKms: 4.4,
      frekuensiGangguan: 0,
      healthIndexStatus: 'Sempurna',
      jumlahPelanggan: 1850
    };

  // Node Form State
  const [formData, setFormData] = useState<Omit<NodeTopologi, 'id'>>({
    penyulangId: activePenyulang.id,
    namaPenyulang: activePenyulang.namaPenyulang,
    namaSection: 'Section 1',
    kodeNode: '',
    namaNode: '',
    tipe: 'PMCB',
    parentId: null,
    statusOperasi: 'CLOSED',
    lokasiTiangOrAlamat: '',
    kapasitasOrAmpere: '630A',
    merekPeralatan: 'Schneider',
    isScadaRemote: true,
    jumlahPelangganTerdampak: 150,
    keterangan: ''
  });

  // Save to localStorage whenever nodes update
  useEffect(() => {
    localStorage.setItem('topologi_nodes_v2', JSON.stringify(nodes));
  }, [nodes]);

  // Sections corresponding to selected feeder from master sectionList
  const activeFeederSections = sectionList.filter(
    (s) => s.penyulangId === activePenyulang.id || s.namaPenyulang.toLowerCase() === activePenyulang.namaPenyulang.toLowerCase()
  );

  // Filter nodes for the selected feeder
  const currentFeederNodes = nodes.filter((n) => {
    const matchesFeeder =
      n.penyulangId === activePenyulang.id ||
      n.namaPenyulang.toLowerCase() === activePenyulang.namaPenyulang.toLowerCase();

    const matchesSection =
      selectedSectionFilter === 'all' ||
      (n.namaSection && n.namaSection.toLowerCase().includes(selectedSectionFilter.toLowerCase()));

    const matchesSearch =
      n.namaNode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.kodeNode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (n.lokasiTiangOrAlamat && n.lokasiTiangOrAlamat.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesTipe = filterTipe === 'all' || n.tipe === filterTipe;

    return matchesFeeder && matchesSection && matchesSearch && matchesTipe;
  });

  // Calculate energization status recursively based on parent switch statuses
  const getEnergizedStatus = (nodeId: string, visited = new Set<string>()): boolean => {
    if (visited.has(nodeId)) return false;
    visited.add(nodeId);

    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return false;

    // Root node (PMCB / GI) is assumed energized if CLOSED
    if (!node.parentId) {
      return node.statusOperasi === 'CLOSED';
    }

    if (node.statusOperasi !== 'CLOSED') {
      return false;
    }

    return getEnergizedStatus(node.parentId, visited);
  };

  // Switch Toggle Handler
  const handleToggleSwitch = (nodeId: string) => {
    setNodes((prev) =>
      prev.map((n) => {
        if (n.id === nodeId) {
          const nextStatus = n.statusOperasi === 'CLOSED' ? 'OPEN' : 'CLOSED';
          return { ...n, statusOperasi: nextStatus };
        }
        return n;
      })
    );
  };

  // Open Modal Add / Edit
  const handleOpenAddModal = () => {
    setEditingNode(null);
    setFormData({
      penyulangId: activePenyulang.id,
      namaPenyulang: activePenyulang.namaPenyulang,
      namaSection: activeFeederSections.length > 0 ? activeFeederSections[0].namaSection : 'Section 1 Utama',
      kodeNode: `NODE-${Date.now().toString().slice(-4)}`,
      namaNode: '',
      tipe: 'LBS',
      parentId: currentFeederNodes.length > 0 ? currentFeederNodes[0].id : null,
      statusOperasi: 'CLOSED',
      lokasiTiangOrAlamat: '',
      kapasitasOrAmpere: '630A',
      merekPeralatan: 'Schneider',
      isScadaRemote: true,
      jumlahPelangganTerdampak: 150,
      keterangan: ''
    });
    setIsNodeModalOpen(true);
  };

  const handleOpenEditModal = (node: NodeTopologi) => {
    setEditingNode(node);
    setFormData({
      penyulangId: node.penyulangId,
      namaPenyulang: node.namaPenyulang,
      namaSection: node.namaSection || 'Section 1',
      kodeNode: node.kodeNode,
      namaNode: node.namaNode,
      tipe: node.tipe,
      parentId: node.parentId || null,
      statusOperasi: node.statusOperasi,
      lokasiTiangOrAlamat: node.lokasiTiangOrAlamat || '',
      kapasitasOrAmpere: node.kapasitasOrAmpere || '',
      merekPeralatan: node.merekPeralatan || '',
      isScadaRemote: node.isScadaRemote ?? false,
      jumlahPelangganTerdampak: node.jumlahPelangganTerdampak || 0,
      keterangan: node.keterangan || ''
    });
    setIsNodeModalOpen(true);
  };

  const handleSaveNode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.namaNode.trim()) return;

    if (editingNode) {
      setNodes((prev) =>
        prev.map((n) => (n.id === editingNode.id ? { ...editingNode, ...formData } : n))
      );
    } else {
      const newNode: NodeTopologi = {
        id: `node-${Date.now()}`,
        ...formData
      };
      setNodes((prev) => [...prev, newNode]);
    }

    setIsNodeModalOpen(false);
  };

  // Save Batch Multi-Equipment Topology for 1 Feeder
  const handleSaveBatchTopology = (
    feederId: string,
    newNodes: NodeTopologi[],
    replaceExisting: boolean
  ) => {
    setNodes((prev) => {
      if (replaceExisting) {
        // Remove existing nodes for this feeder and replace with new batch topology
        const remainingNodes = prev.filter(
          (n) => n.penyulangId !== feederId && n.namaPenyulang.toLowerCase() !== activePenyulang.namaPenyulang.toLowerCase()
        );
        return [...remainingNodes, ...newNodes];
      } else {
        // Append new nodes to existing topology
        return [...prev, ...newNodes];
      }
    });
  };

  const handleDeleteNode = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus komponen topologi ini?')) {
      setNodes((prev) => prev.filter((n) => n.id !== id));
    }
  };

  const getNodeIcon = (tipe: TipeNodeTopologi) => {
    switch (tipe) {
      case 'INCOMING':
        return <Zap className="w-5 h-5 text-sky-400" />;
      case 'OUTGOING':
        return <Zap className="w-5 h-5 text-amber-400" />;
      case 'COUPLING':
        return <Share2 className="w-5 h-5 text-indigo-400" />;
      case 'PMCB':
        return <Zap className="w-5 h-5 text-yellow-400" />;
      case 'GI':
        return <Building2 className="w-5 h-5 text-indigo-400" />;
      case 'GH':
        return <Server className="w-5 h-5 text-blue-400" />;
      case 'LBS':
        return <Power className="w-5 h-5 text-amber-400" />;
      case 'REC':
        return <Activity className="w-5 h-5 text-purple-400" />;
      case 'FCO':
        return <Shield className="w-5 h-5 text-rose-400" />;
      case 'DS':
        return <SlidersHorizontal className="w-5 h-5 text-cyan-400" />;
      case 'GTT':
        return <Radio className="w-5 h-5 text-emerald-400" />;
      case 'PERCABANGAN':
        return <Share2 className="w-5 h-5 text-teal-400" />;
      default:
        return <Box className="w-5 h-5 text-slate-400" />;
    }
  };

  const getTypeBadge = (tipe: TipeNodeTopologi) => {
    switch (tipe) {
      case 'INCOMING':
        return <span className="px-2 py-0.5 rounded-md bg-sky-100 text-sky-900 font-extrabold text-[10px] border border-sky-300">INCOMING 20kV</span>;
      case 'OUTGOING':
        return <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-extrabold text-[10px] border border-amber-300">OUTGOING 20kV</span>;
      case 'COUPLING':
        return <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-900 font-extrabold text-[10px] border border-indigo-300">COUPLING</span>;
      case 'PMCB':
        return <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-extrabold text-[10px] border border-amber-300">PMCB (PMT GI)</span>;
      case 'GI':
        return <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 font-extrabold text-[10px] border border-indigo-200">GARDU INDUK</span>;
      case 'GH':
        return <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 font-extrabold text-[10px] border border-blue-200">GARDU HUBUNG</span>;
      case 'PERCABANGAN':
        return <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-extrabold text-[10px] border border-emerald-200">PERCABANGAN LATERAL</span>;
      case 'LBS':
        return <span className="px-2 py-0.5 rounded-md bg-orange-100 text-orange-800 font-extrabold text-[10px] border border-orange-200">LBS SWITCH</span>;
      case 'REC':
        return <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 font-extrabold text-[10px] border border-purple-200">RECLOSER (REC)</span>;
      case 'FCO':
        return <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 font-extrabold text-[10px] border border-rose-200">FUSE CUT OUT (FCO)</span>;
      case 'DS':
        return <span className="px-2 py-0.5 rounded-md bg-cyan-100 text-cyan-800 font-extrabold text-[10px] border border-cyan-200">DISCONNECTING SWITCH (DS)</span>;
      case 'GTT':
        return <span className="px-2 py-0.5 rounded-md bg-teal-100 text-teal-800 font-extrabold text-[10px] border border-teal-200">GARDU TRAFO (GTT)</span>;
      default:
        return <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-extrabold text-[10px]">EQUIPMENT</span>;
    }
  };

  // Calculations
  const totalPmcb = currentFeederNodes.filter((n) => n.tipe === 'PMCB').length;
  const totalLbs = currentFeederNodes.filter((n) => n.tipe === 'LBS').length;
  const totalRec = currentFeederNodes.filter((n) => n.tipe === 'REC').length;
  const totalFco = currentFeederNodes.filter((n) => n.tipe === 'FCO').length;
  const totalDs = currentFeederNodes.filter((n) => n.tipe === 'DS').length;
  const totalGh = currentFeederNodes.filter((n) => n.tipe === 'GH').length;

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto font-sans text-slate-900">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 p-6 rounded-3xl text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-extrabold tracking-wider uppercase">
              <GitGraph className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
              Skema Feeder Utama & Section Zona 20kV
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <span>Topologi Jaringan Feeder:</span>
              <span className="text-blue-400 font-mono underline decoration-blue-500/40">
                {activePenyulang.namaPenyulang} [{activePenyulang.kodeId || 'FEEDER'}]
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-2xl leading-relaxed">
              Memetakan skema **Feeder Utama** (Trunk Line) secara hierarki yang memuat **Section Jaringan**, serta peralatan pemutus dan proteksi: **PMCB**, **GH**, **LBS**, **Recloser (REC)**, **FCO**, dan **DS**.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => setIsBatchModalOpen(true)}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl transition-all shadow-lg shadow-amber-500/30 flex items-center gap-2 cursor-pointer"
              title="Input jumlah unit PMCB, LBS, Recloser, FCO, DS, GH, GTT sekaligus untuk 1 Feeder"
            >
              <SlidersHorizontal className="w-4 h-4 text-slate-950" />
              <span>+ Input Multi Peralatan (1 Feeder)</span>
            </button>

            <button
              onClick={() => setIsAddSectionModalOpen(true)}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl transition-all shadow-lg shadow-emerald-600/30 flex items-center gap-2 cursor-pointer"
            >
              <FolderPlus className="w-4 h-4" />
              <span>+ Tambah Section Baru</span>
            </button>

            <button
              onClick={handleOpenAddModal}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl transition-all shadow-lg shadow-blue-600/30 flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Tambah Node Peralatan</span>
            </button>
          </div>
        </div>

        {/* Master Feeder Synchronized Selector Bar */}
        <div className="mt-6 pt-5 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-extrabold text-slate-300 uppercase tracking-wider">
              Pilih Feeder / Penyulang (Master Data Sync):
            </span>
            <select
              value={selectedPenyulangId}
              onChange={(e) => setSelectedPenyulangId(e.target.value)}
              className="bg-slate-800 border border-blue-500/50 text-white font-black text-xs rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer shadow-md"
            >
              {penyulangList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.namaPenyulang} [{p.kodeId}] — {p.namaGi}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3 text-xs font-bold text-slate-300 flex-wrap">
            <div className="flex items-center gap-1.5 bg-slate-800/90 px-3 py-1.5 rounded-xl border border-slate-700">
              <span className="text-slate-400 font-normal">Kode Penyulang:</span>
              <span className="text-amber-300 font-mono font-black">{activePenyulang.kodeId || 'PSO'}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-800/90 px-3 py-1.5 rounded-xl border border-slate-700">
              <span className="text-slate-400 font-normal">Gardu Induk:</span>
              <span className="text-indigo-300 font-bold">{activePenyulang.namaGi}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-800/90 px-3 py-1.5 rounded-xl border border-slate-700">
              <span className="text-slate-400 font-normal">Panjang Feeder:</span>
              <span className="text-emerald-400 font-bold">{activePenyulang.panjangJaringanKms} KMS</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-800/90 px-3 py-1.5 rounded-xl border border-slate-700">
              <span className="text-slate-400 font-normal">Pelanggan Total:</span>
              <span className="text-blue-400 font-bold">{activePenyulang.jumlahPelanggan || 1850} KK</span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Section & Zone Devices Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[10px] font-black text-slate-400 uppercase">PMCB (PMT GI)</div>
            <div className="text-base font-black text-amber-700 mt-0.5">{totalPmcb} Unit</div>
          </div>
          <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center">
            <Zap className="w-4 h-4 text-amber-600" />
          </div>
        </div>

        <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[10px] font-black text-slate-400 uppercase">Gardu Hubung</div>
            <div className="text-base font-black text-blue-700 mt-0.5">{totalGh} GH</div>
          </div>
          <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
            <Server className="w-4 h-4 text-blue-600" />
          </div>
        </div>

        <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[10px] font-black text-slate-400 uppercase">LBS Switch</div>
            <div className="text-base font-black text-orange-700 mt-0.5">{totalLbs} LBS</div>
          </div>
          <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center">
            <Power className="w-4 h-4 text-orange-600" />
          </div>
        </div>

        <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[10px] font-black text-slate-400 uppercase">Recloser (REC)</div>
            <div className="text-base font-black text-purple-700 mt-0.5">{totalRec} REC</div>
          </div>
          <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center">
            <Activity className="w-4 h-4 text-purple-600" />
          </div>
        </div>

        <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[10px] font-black text-slate-400 uppercase">Fuse Cut Out</div>
            <div className="text-base font-black text-rose-700 mt-0.5">{totalFco} FCO</div>
          </div>
          <div className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center">
            <Shield className="w-4 h-4 text-rose-600" />
          </div>
        </div>

        <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between col-span-2 sm:col-span-1">
          <div>
            <div className="text-[10px] font-black text-slate-400 uppercase">DS (Pemisah)</div>
            <div className="text-base font-black text-cyan-700 mt-0.5">{totalDs} DS</div>
          </div>
          <div className="w-8 h-8 rounded-xl bg-cyan-50 flex items-center justify-center">
            <SlidersHorizontal className="w-4 h-4 text-cyan-600" />
          </div>
        </div>
      </div>

      {/* Main Workspace Bar: Tabs & Search Controls */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Navigation Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl w-fit">
            <button
              onClick={() => setActiveTab('feeder_utama')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'feeder_utama'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GitGraph className="w-4 h-4 text-blue-600" />
              <span>Topologi Feeder Utama</span>
            </button>

            <button
              onClick={() => setActiveTab('section_list')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'section_list'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FolderPlus className="w-4 h-4 text-emerald-600" />
              <span>Master Section Feeder ({activeFeederSections.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('table')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'table'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>Daftar Peralatan ({currentFeederNodes.length})</span>
            </button>
          </div>

          {/* Search & Filter Controls */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Filter Section Dropdown */}
            <select
              value={selectedSectionFilter}
              onChange={(e) => setSelectedSectionFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="all">Semua Section Feeder</option>
              {activeFeederSections.map((s) => (
                <option key={s.id} value={s.namaSection}>
                  {s.namaSection}
                </option>
              ))}
            </select>

            {/* Filter Tipe Equipment Dropdown */}
            <select
              value={filterTipe}
              onChange={(e) => setFilterTipe(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="all">Semua Jenis Zona / Peralatan</option>
              <option value="PMCB">PMCB (PMT GI Outgoing)</option>
              <option value="GH">Gardu Hubung (GH)</option>
              <option value="LBS">LBS Switch</option>
              <option value="REC">Recloser (REC)</option>
              <option value="FCO">Fuse Cut Out (FCO)</option>
              <option value="DS">Disconnecting Switch (DS)</option>
              <option value="GTT">Gardu Trafo (GTT)</option>
              <option value="PERCABANGAN">Percabangan Lateral</option>
            </select>

            <div className="relative min-w-[200px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari kode / nama node..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* TAB CONTENT 1: Topologi Feeder Utama Interactive Visual Schema */}
        {activeTab === 'feeder_utama' && (
          <div className="p-6 bg-slate-950 rounded-3xl border border-slate-800 text-white min-h-[520px] relative overflow-x-auto shadow-inner">
            <div className="absolute top-4 right-4 flex items-center gap-3 text-[11px] font-bold text-slate-400 bg-slate-900/90 px-3.5 py-2 rounded-2xl border border-slate-800 backdrop-blur-md z-10 shadow-lg">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
                Bertegangan (Energized)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_#ef4444]" />
                Padam / Switch Open
              </span>
            </div>

            {currentFeederNodes.length === 0 ? (
              <div className="py-20 text-center space-y-3">
                <GitGraph className="w-12 h-12 text-slate-600 mx-auto" />
                <p className="text-sm font-bold text-slate-400">Belum Ada Node Peralatan Terdaftar pada Feeder Ini.</p>
                <button
                  onClick={handleOpenAddModal}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl cursor-pointer"
                >
                  Tambah Peralatan Pertama
                </button>
              </div>
            ) : (
              <div className="space-y-6 pt-6">
                {/* Feeder Title Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-950/80 border border-blue-500/40 text-blue-300 font-mono text-xs font-black">
                  <Zap className="w-4 h-4 text-amber-400 animate-pulse" />
                  <span>TRUNK UTAMA FEEDER {activePenyulang.namaPenyulang} [{activePenyulang.kodeId}]</span>
                </div>

                {currentFeederNodes.map((node) => {
                  const isEnergized = getEnergizedStatus(node.id);
                  const isSwitchable = ['PMCB', 'LBS', 'REC', 'FCO', 'DS', 'GH'].includes(node.tipe);

                  return (
                    <div
                      key={node.id}
                      className="relative pl-6 border-l-2 border-slate-800 hover:border-blue-500/60 transition-colors py-2 group"
                    >
                      {/* Section Connector Badge */}
                      {node.namaSection && (
                        <div className="mb-2">
                          <span className="px-2.5 py-0.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 text-[10px] font-mono font-bold uppercase tracking-wider">
                            📍 {node.namaSection}
                          </span>
                        </div>
                      )}

                      {/* Node Card Box */}
                      <div className={`p-4 rounded-2xl border transition-all duration-300 max-w-3xl ${
                        isEnergized
                          ? 'bg-slate-900/95 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.12)]'
                          : 'bg-slate-900/50 border-rose-500/50 shadow-[0_0_15px_rgba(239,68,68,0.08)] opacity-85'
                      }`}>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <div className={`p-2.5 rounded-2xl border shrink-0 mt-0.5 ${
                              isEnergized
                                ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-400'
                                : 'bg-rose-950/80 border-rose-500/60 text-rose-400'
                            }`}>
                              {getNodeIcon(node.tipe)}
                            </div>

                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono text-xs font-black text-slate-200">{node.kodeNode}</span>
                                {getTypeBadge(node.tipe)}
                                {node.isScadaRemote && (
                                  <span className="px-1.5 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 rounded text-[9px] font-black uppercase">
                                    SCADA Tele-control
                                  </span>
                                )}
                              </div>
                              <h3 className="text-sm font-black text-white mt-1 group-hover:text-blue-400 transition-colors">
                                {node.namaNode}
                              </h3>
                              <p className="text-xs text-slate-400 font-medium mt-0.5">
                                {node.lokasiTiangOrAlamat || 'Lokasi Tiang Standard'} • Rating: <strong className="text-slate-200">{node.kapasitasOrAmpere || '-'}</strong>
                              </p>
                            </div>
                          </div>

                          {/* Switch State Control */}
                          <div className="flex items-center gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                            {isSwitchable && (
                              <button
                                onClick={() => handleToggleSwitch(node.id)}
                                className={`px-3 py-1.5 rounded-xl font-black text-xs transition-all flex items-center gap-1.5 cursor-pointer border ${
                                  node.statusOperasi === 'CLOSED'
                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                                    : 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30'
                                }`}
                              >
                                <Power className="w-3.5 h-3.5" />
                                <span>{node.statusOperasi}</span>
                              </button>
                            )}

                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleOpenEditModal(node)}
                                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                                title="Edit Node Peralatan"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteNode(node.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                                title="Hapus Node Peralatan"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Additional Info Footer */}
                        <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-semibold">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-500">Pelanggan Terdampak:</span>
                            <span className="text-amber-400 font-bold">{node.jumlahPelangganTerdampak || 0} KK</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-500">Kondisi Aliran Listrik:</span>
                            {isEnergized ? (
                              <span className="text-emerald-400 font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Bertegangan (20kV)
                              </span>
                            ) : (
                              <span className="text-rose-400 font-bold flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" /> Padam (De-energized)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB CONTENT 2: Master Section Feeder Sync List */}
        {activeTab === 'section_list' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
              <div className="flex items-center gap-3">
                <FolderPlus className="w-6 h-6 text-emerald-600" />
                <div>
                  <h3 className="font-extrabold text-sm text-emerald-950">
                    Master Section Terhubung: {activePenyulang.namaPenyulang} [{activePenyulang.kodeId}]
                  </h3>
                  <p className="text-xs text-emerald-800 font-medium">
                    Data section ini disinkronkan langsung dengan Master Data Section Jaringan ULP Baguala.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsAddSectionModalOpen(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl transition-all shadow-md cursor-pointer shrink-0"
              >
                + Tambah Section Baru
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeFeederSections.length === 0 ? (
                <div className="col-span-2 p-8 text-center text-slate-400 font-semibold bg-slate-50 rounded-2xl border border-slate-200">
                  Belum ada master section terdaftar untuk penyulang {activePenyulang.namaPenyulang}.
                </div>
              ) : (
                activeFeederSections.map((sec) => {
                  const nodeCount = nodes.filter(
                    (n) => n.namaSection && n.namaSection.toLowerCase().includes(sec.namaSection.toLowerCase())
                  ).length;

                  return (
                    <div
                      key={sec.id}
                      className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-300 transition-all space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-mono font-black text-xs rounded-lg">
                          {sec.namaSection}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] px-2 py-0.5 bg-slate-100 font-bold rounded-md text-slate-700">
                            Sistem: {sec.sistemOperasi || 'Radial'}
                          </span>
                          {onDeleteSection && (
                            <button
                              onClick={() => onDeleteSection(sec.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                              title="Hapus Section"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="text-xs text-slate-600 space-y-1">
                        <div>Penyulang: <strong className="text-slate-900">{sec.namaPenyulang}</strong></div>
                        <div>Pelanggan Section: <strong className="text-blue-600 font-extrabold">{sec.jumlahPelanggan} KK</strong></div>
                        <div>Jumlah Peralatan / Zone Node: <strong className="text-emerald-700 font-extrabold">{nodeCount} Unit</strong></div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB CONTENT 3: Tabular Equipment Asset Inventory */}
        {activeTab === 'table' && (
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-slate-50 text-slate-600 font-black uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Kode / Nama Peralatan</th>
                  <th className="p-3.5">Jenis Zona / Peralatan</th>
                  <th className="p-3.5">Section Jaringan</th>
                  <th className="p-3.5">Lokasi Tiang</th>
                  <th className="p-3.5">Kapasitas</th>
                  <th className="p-3.5">Status Saklar</th>
                  <th className="p-3.5">SCADA</th>
                  <th className="p-3.5 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white font-medium">
                {currentFeederNodes.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      Tidak ada data peralatan ditemukan.
                    </td>
                  </tr>
                ) : (
                  currentFeederNodes.map((n) => (
                    <tr key={n.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5 font-bold text-slate-900">
                        <div className="font-mono text-blue-600 font-black">{n.kodeNode}</div>
                        <div className="text-slate-800 text-xs font-bold">{n.namaNode}</div>
                      </td>
                      <td className="p-3.5">{getTypeBadge(n.tipe)}</td>
                      <td className="p-3.5 font-bold text-slate-700">{n.namaSection || '-'}</td>
                      <td className="p-3.5 text-slate-600">{n.lokasiTiangOrAlamat || '-'}</td>
                      <td className="p-3.5 font-bold text-slate-800">{n.kapasitasOrAmpere || '-'}</td>
                      <td className="p-3.5">
                        <button
                          onClick={() => handleToggleSwitch(n.id)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-black cursor-pointer transition-all ${
                            n.statusOperasi === 'CLOSED'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-rose-100 text-rose-800 border border-rose-200'
                          }`}
                        >
                          {n.statusOperasi}
                        </button>
                      </td>
                      <td className="p-3.5">
                        {n.isScadaRemote ? (
                          <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 font-extrabold text-[10px]">
                            REMOTE
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-bold text-[10px]">
                            MANUAL
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenEditModal(n)}
                            className="p-1 text-slate-500 hover:text-blue-600 rounded hover:bg-slate-100 cursor-pointer"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteNode(n.id)}
                            className="p-1 text-slate-500 hover:text-rose-600 rounded hover:bg-slate-100 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: Tambah / Edit Node Peralatan Topologi */}
      {isNodeModalOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 font-sans">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GitGraph className="w-5 h-5 text-blue-400" />
                <h3 className="font-extrabold text-sm">
                  {editingNode ? 'Edit Node Peralatan Topologi' : 'Tambah Peralatan / Zona Topologi Baru'}
                </h3>
              </div>
              <button
                onClick={() => setIsNodeModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNode} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs font-semibold">
              {!editingNode && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between text-amber-950">
                  <div className="flex items-center gap-2 text-[11px]">
                    <SlidersHorizontal className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Ingin input <strong>banyak peralatan sekaligus (LBS, PMCB, REC, FCO, DS)</strong> untuk 1 Feeder?</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsNodeModalOpen(false);
                      setIsBatchModalOpen(true);
                    }}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[10px] rounded-xl cursor-pointer shrink-0 shadow-xs"
                  >
                    Mode Multi Peralatan →
                  </button>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1">Feeder / Penyulang</label>
                  <input
                    type="text"
                    value={`${formData.namaPenyulang} [${activePenyulang.kodeId}]`}
                    disabled
                    className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-700 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">Kode Node / ID</label>
                  <input
                    type="text"
                    required
                    value={formData.kodeNode}
                    onChange={(e) => setFormData({ ...formData, kodeNode: e.target.value })}
                    placeholder="Contoh: LBS-PSO-02"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 mb-1">Pilih Section Jaringan Feeder</label>
                <select
                  value={formData.namaSection}
                  onChange={(e) => setFormData({ ...formData, namaSection: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  {activeFeederSections.length > 0 ? (
                    activeFeederSections.map((s) => (
                      <option key={s.id} value={s.namaSection}>
                        {s.namaSection} ({s.sistemOperasi})
                      </option>
                    ))
                  ) : (
                    <option value="Section 1 Utama">Section 1 Utama</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 mb-1">Nama Peralatan Topologi</label>
                <input
                  type="text"
                  required
                  value={formData.namaNode}
                  onChange={(e) => setFormData({ ...formData, namaNode: e.target.value })}
                  placeholder="Contoh: PMCB Outgoing / LBS Motorized Simpang Lateri"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1">Jenis Zona / Peralatan</label>
                  <select
                    value={formData.tipe}
                    onChange={(e) => setFormData({ ...formData, tipe: e.target.value as TipeNodeTopologi })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="INCOMING">Incoming 20kV (PMT Incoming GI)</option>
                    <option value="OUTGOING">Outgoing 20kV (PMT Outgoing GI)</option>
                    <option value="COUPLING">Coupling (PMT Bus Tie / Coupling)</option>
                    <option value="PMCB">PMCB (PMT GI Feeder)</option>
                    <option value="LBS">LBS Switch</option>
                    <option value="REC">Recloser (REC)</option>
                    <option value="FCO">Fuse Cut Out (FCO)</option>
                    <option value="DS">Disconnecting Switch (DS)</option>
                    <option value="GH">Gardu Hubung (GH)</option>
                    <option value="GTT">Gardu Trafo (GTT)</option>
                    <option value="PERCABANGAN">Percabangan Lateral</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 mb-1">Status Operasi Awal</label>
                  <select
                    value={formData.statusOperasi}
                    onChange={(e) => setFormData({ ...formData, statusOperasi: e.target.value as any })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="CLOSED">CLOSED (Terhubung)</option>
                    <option value="OPEN">OPEN (Terbuka/Padam)</option>
                    <option value="TRIP">TRIP (Gangguan)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 mb-1">Lokasi Tiang / Alamat Detail</label>
                <input
                  type="text"
                  value={formData.lokasiTiangOrAlamat}
                  onChange={(e) => setFormData({ ...formData, lokasiTiangOrAlamat: e.target.value })}
                  placeholder="Contoh: Jl. Raya Passo Tiang #35"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1">Kapasitas / Rating Ampere</label>
                  <input
                    type="text"
                    value={formData.kapasitasOrAmpere}
                    onChange={(e) => setFormData({ ...formData, kapasitasOrAmpere: e.target.value })}
                    placeholder="Contoh: 630A / 25A Fuse"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 mb-1">Pelanggan Terdampak (KK)</label>
                  <input
                    type="number"
                    value={formData.jumlahPelangganTerdampak}
                    onChange={(e) => setFormData({ ...formData, jumlahPelangganTerdampak: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isScadaRemote"
                  checked={formData.isScadaRemote}
                  onChange={(e) => setFormData({ ...formData, isScadaRemote: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="isScadaRemote" className="text-slate-700 font-bold cursor-pointer">
                  Dapat Dikontrol Remote via SCADA Tele-control
                </label>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsNodeModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-extrabold cursor-pointer transition-all shadow-md shadow-blue-500/20"
                >
                  Simpan Komponen Peralatan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Tambah Section Modal (Synchronized with Master Section Data) */}
      <TambahSectionModal
        isOpen={isAddSectionModalOpen}
        onClose={() => setIsAddSectionModalOpen(false)}
        penyulangList={penyulangList}
        onSave={(newSec) => {
          if (onAddSection) {
            onAddSection(newSec);
          }
          setIsAddSectionModalOpen(false);
        }}
      />

      {/* MODAL 3: Input Multi Peralatan Batch Topologi 1 Feeder */}
      <InputTopologiBatchModal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        penyulangList={penyulangList}
        sectionList={sectionList}
        selectedPenyulangId={activePenyulang.id}
        onSaveBatchTopology={handleSaveBatchTopology}
      />
    </div>
  );
};
