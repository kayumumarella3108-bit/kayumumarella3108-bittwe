import React, { useState, useEffect } from 'react';
import {
  X,
  GitGraph,
  Plus,
  Trash2,
  Zap,
  Power,
  Activity,
  Shield,
  SlidersHorizontal,
  Server,
  Radio,
  CheckCircle2,
  Layers,
  Sparkles,
  Info,
  RefreshCw,
  Sliders,
  Share2
} from 'lucide-react';
import { Penyulang, NodeTopologi, TipeNodeTopologi, SectionJaringan } from '../../types';

interface InputTopologiBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  penyulangList: Penyulang[];
  sectionList?: SectionJaringan[];
  selectedPenyulangId?: string;
  onSaveBatchTopology: (
    feederId: string,
    newNodes: NodeTopologi[],
    replaceExisting: boolean
  ) => void;
}

interface EquipmentConfigQty {
  INCOMING: number;
  OUTGOING: number;
  COUPLING: number;
  PMCB: number;
  GH: number;
  LBS: number;
  REC: number;
  FCO: number;
  DS: number;
  GTT: number;
}

export const InputTopologiBatchModal: React.FC<InputTopologiBatchModalProps> = ({
  isOpen,
  onClose,
  penyulangList,
  sectionList = [],
  selectedPenyulangId,
  onSaveBatchTopology
}) => {
  const [targetFeederId, setTargetFeederId] = useState<string>(
    selectedPenyulangId || penyulangList[0]?.id || '14'
  );

  const [replaceExisting, setReplaceExisting] = useState<boolean>(true);

  // Equipment Quantities State
  const [quantities, setQuantities] = useState<EquipmentConfigQty>({
    INCOMING: 1,
    OUTGOING: 1,
    COUPLING: 0,
    PMCB: 1,
    GH: 1,
    LBS: 2,
    REC: 1,
    FCO: 3,
    DS: 2,
    GTT: 3
  });

  // Generated Items List State
  const [generatedItems, setGeneratedItems] = useState<NodeTopologi[]>([]);

  // Find selected Feeder object
  const activeFeeder =
    penyulangList.find((p) => p.id === targetFeederId) ||
    penyulangList[0] || {
      id: '14',
      namaPenyulang: 'PASSO',
      kodeId: 'PSO',
      namaGi: 'GI PASSO',
      jumlahPelanggan: 1850
    };

  // Find section list for active feeder
  const activeSections = sectionList.filter(
    (s) =>
      s.penyulangId === activeFeeder.id ||
      (s.namaPenyulang && activeFeeder.namaPenyulang && s.namaPenyulang.toLowerCase() === activeFeeder.namaPenyulang.toLowerCase())
  );

  const defaultSectionName =
    activeSections.length > 0 ? activeSections[0].namaSection : 'Section 1 (Utama)';

  // Sync targetFeederId if prop changes
  useEffect(() => {
    if (selectedPenyulangId) {
      setTargetFeederId(selectedPenyulangId);
    }
  }, [selectedPenyulangId]);

  // Helper to generate items based on quantities
  const regenerateItemsFromQuantities = (qtyMap: EquipmentConfigQty) => {
    const feederCode = activeFeeder.kodeId || (activeFeeder.namaPenyulang || 'FEEDER').slice(0, 3).toUpperCase();
    const feederName = activeFeeder.namaPenyulang;
    const feederId = activeFeeder.id;

    const newNodesList: NodeTopologi[] = [];
    let previousNodeId: string | null = null;

    const buildItem = (
      tipe: TipeNodeTopologi,
      index: number,
      namaDefault: string,
      kodeDefault: string,
      lokasiDefault: string,
      kapasitasDefault: string,
      isScadaDefault: boolean,
      pelangganDefault: number
    ): NodeTopologi => {
      const secName =
        activeSections.length > 0
          ? activeSections[index % activeSections.length].namaSection
          : defaultSectionName;

      const nodeId = `node-batch-${tipe.toLowerCase()}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      const node: NodeTopologi = {
        id: nodeId,
        penyulangId: feederId,
        namaPenyulang: feederName,
        namaSection: secName,
        kodeNode: `${kodeDefault}-${(index + 1).toString().padStart(2, '0')}`,
        namaNode: `${namaDefault} #${index + 1}`,
        tipe: tipe,
        parentId: previousNodeId,
        statusOperasi: 'CLOSED',
        lokasiTiangOrAlamat: `${lokasiDefault} Tiang #${(index + 1) * 12}`,
        kapasitasOrAmpere: kapasitasDefault,
        merekPeralatan: 'PLN Standard / Schneider / Entec',
        isScadaRemote: isScadaDefault,
        jumlahPelangganTerdampak: pelangganDefault,
        keterangan: `Generated via Topologi Multi Peralatan Feeder ${feederName}`
      };

      // Set parent chaining for main trunk nodes
      if (['INCOMING', 'OUTGOING', 'COUPLING', 'PMCB', 'GH', 'LBS', 'REC'].includes(tipe)) {
        previousNodeId = nodeId;
      }

      return node;
    };

    // 0a. INCOMING
    for (let i = 0; i < qtyMap.INCOMING; i++) {
      newNodesList.push(
        buildItem(
          'INCOMING',
          i,
          `Incoming 20kV Trafo ${activeFeeder.namaGi}`,
          `INC-${feederCode}`,
          `Kubikel Incoming Trafo ${activeFeeder.namaGi}`,
          '1250A / 20kV - 25kA',
          true,
          activeFeeder.jumlahPelanggan || 1850
        )
      );
    }

    // 0b. OUTGOING
    for (let i = 0; i < qtyMap.OUTGOING; i++) {
      newNodesList.push(
        buildItem(
          'OUTGOING',
          i,
          `Outgoing 20kV ${feederName}`,
          `OUT-${feederCode}`,
          `Kubikel Outgoing GI ${activeFeeder.namaGi}`,
          '630A / 20kV - 25kA',
          true,
          activeFeeder.jumlahPelanggan || 1850
        )
      );
    }

    // 0c. COUPLING
    for (let i = 0; i < qtyMap.COUPLING; i++) {
      newNodesList.push(
        buildItem(
          'COUPLING',
          i,
          `Coupling Bus 20kV ${activeFeeder.namaGi}`,
          `CPL-${feederCode}`,
          `Kubikel Bus Tie / Coupling GI`,
          '1250A / 20kV',
          true,
          activeFeeder.jumlahPelanggan || 1850
        )
      );
    }

    // 1. PMCB
    for (let i = 0; i < qtyMap.PMCB; i++) {
      newNodesList.push(
        buildItem(
          'PMCB',
          i,
          `PMCB Outgoing 20kV ${feederName}`,
          `PMCB-${feederCode}`,
          `Kubikel GI ${activeFeeder.namaGi}`,
          '630A / 20kV - 25kA',
          true,
          activeFeeder.jumlahPelanggan || 1850
        )
      );
    }

    // 2. GH (Gardu Hubung)
    for (let i = 0; i < qtyMap.GH; i++) {
      newNodesList.push(
        buildItem(
          'GH',
          i,
          `Gardu Hubung (GH) ${feederName}`,
          `GH-${feederCode}`,
          `Simpang Utama GH ${feederName}`,
          'Busbar 630A',
          true,
          Math.round((activeFeeder.jumlahPelanggan || 1850) * 0.8)
        )
      );
    }

    // 3. LBS (Load Break Switch)
    for (let i = 0; i < qtyMap.LBS; i++) {
      newNodesList.push(
        buildItem(
          'LBS',
          i,
          `LBS Switch Motorized ${feederName}`,
          `LBS-${feederCode}`,
          `Jl. Utama Feeder ${feederName}`,
          '630A SF6 Motorized',
          true,
          Math.round((activeFeeder.jumlahPelanggan || 1850) * 0.6)
        )
      );
    }

    // 4. RECLOSER (REC)
    for (let i = 0; i < qtyMap.REC; i++) {
      newNodesList.push(
        buildItem(
          'REC',
          i,
          `Auto-Recloser Proteksi ${feederName}`,
          `REC-${feederCode}`,
          `Batas Zone ${feederName}`,
          '400A SEL Controller',
          true,
          Math.round((activeFeeder.jumlahPelanggan || 1850) * 0.4)
        )
      );
    }

    // 5. FCO (Fuse Cut Out)
    for (let i = 0; i < qtyMap.FCO; i++) {
      newNodesList.push(
        buildItem(
          'FCO',
          i,
          `Fuse Cut Out (FCO) Percabangan`,
          `FCO-${feederCode}`,
          `Spur Line ${feederName}`,
          '25A Fuse Link Type K',
          false,
          250
        )
      );
    }

    // 6. DS (Disconnecting Switch)
    for (let i = 0; i < qtyMap.DS; i++) {
      newNodesList.push(
        buildItem(
          'DS',
          i,
          `Disconnecting Switch (DS) Line`,
          `DS-${feederCode}`,
          `Saklar Pemisah Tiang`,
          '630A Air Break Switch',
          false,
          300
        )
      );
    }

    // 7. GTT (Gardu Trafo)
    for (let i = 0; i < qtyMap.GTT; i++) {
      newNodesList.push(
        buildItem(
          'GTT',
          i,
          `Gardu Trafo Distribusi (GTT)`,
          `GTT-${feederCode}`,
          `Lokasi Pelanggan Tiang`,
          '160 kVA 20kV/400V',
          false,
          120
        )
      );
    }

    setGeneratedItems(newNodesList);
  };

  // Re-generate list whenever target Feeder or Modal opens
  useEffect(() => {
    if (isOpen) {
      regenerateItemsFromQuantities(quantities);
    }
  }, [isOpen, targetFeederId]);

  // Handle quantity change
  const handleQtyChange = (typeKey: keyof EquipmentConfigQty, delta: number) => {
    const nextVal = Math.max(0, quantities[typeKey] + delta);
    const nextQtyMap = { ...quantities, [typeKey]: nextVal };
    setQuantities(nextQtyMap);
    regenerateItemsFromQuantities(nextQtyMap);
  };

  const handleQtyDirectInput = (typeKey: keyof EquipmentConfigQty, value: number) => {
    const nextVal = Math.max(0, value);
    const nextQtyMap = { ...quantities, [typeKey]: nextVal };
    setQuantities(nextQtyMap);
    regenerateItemsFromQuantities(nextQtyMap);
  };

  // Handle single item attribute edit
  const handleUpdateItemAttribute = (
    itemId: string,
    field: keyof NodeTopologi,
    value: any
  ) => {
    setGeneratedItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, [field]: value } : item))
    );
  };

  // Handle delete individual item row
  const handleDeleteRowItem = (itemId: string) => {
    setGeneratedItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  // Add custom manual item row to batch
  const handleAddManualRow = (tipe: TipeNodeTopologi) => {
    const feederCode = activeFeeder.kodeId || 'FEEDER';
    const newItem: NodeTopologi = {
      id: `node-batch-manual-${Date.now()}`,
      penyulangId: activeFeeder.id,
      namaPenyulang: activeFeeder.namaPenyulang,
      namaSection: defaultSectionName,
      kodeNode: `${tipe}-${feederCode}-${(generatedItems.length + 1).toString().padStart(2, '0')}`,
      namaNode: `Tambahan ${tipe} ${activeFeeder.namaPenyulang}`,
      tipe: tipe,
      parentId: generatedItems.length > 0 ? generatedItems[generatedItems.length - 1].id : null,
      statusOperasi: 'CLOSED',
      lokasiTiangOrAlamat: `Tiang #${(generatedItems.length + 1) * 10}`,
      kapasitasOrAmpere: tipe === 'GTT' ? '160 kVA' : '630A',
      merekPeralatan: 'PLN Standard',
      isScadaRemote: ['PMCB', 'LBS', 'REC', 'GH'].includes(tipe),
      jumlahPelangganTerdampak: 200
    };
    setGeneratedItems((prev) => [...prev, newItem]);
  };

  // Handle Save
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (generatedItems.length === 0) {
      alert('Mohon tentukan minimal 1 jumlah peralatan untuk topologi feeder.');
      return;
    }

    onSaveBatchTopology(targetFeederId, generatedItems, replaceExisting);
    onClose();
  };

  if (!isOpen) return null;

  const totalItemsCount = generatedItems.length;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 z-50 font-sans">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-600/30 border border-blue-400/40 text-blue-300">
              <GitGraph className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-black text-base text-white">
                  Input Topologi Feeder (Multi Peralatan / Batch)
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-500/30 text-blue-300 font-extrabold text-[10px] uppercase tracking-wider border border-blue-400/30">
                  1 Topologi per Feeder
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium mt-0.5">
                Isi jumlah unit **PMCB, LBS, Recloser, FCO, DS, GH, & GTT** untuk membangun skema 1 Feeder secara cepat & terstruktur.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmitForm} className="p-6 space-y-6 overflow-y-auto flex-1 text-xs font-semibold text-slate-800">
          {/* Section 1: Feeder Target & Mode Selection */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <div>
              <label className="block text-slate-700 font-extrabold mb-1.5 uppercase text-[11px] tracking-wider">
                1. Pilih Target Feeder / Penyulang:
              </label>
              <select
                value={targetFeederId}
                onChange={(e) => {
                  setTargetFeederId(e.target.value);
                }}
                className="w-full p-2.5 bg-white border border-slate-300 text-slate-900 font-black text-xs rounded-xl focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-xs"
              >
                {penyulangList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.namaPenyulang} [{p.kodeId || 'FEEDER'}] — {p.namaGi} ({p.jumlahPelanggan || 0} KK)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-extrabold mb-1.5 uppercase text-[11px] tracking-wider">
                2. Metode Penyimpanan Topologi:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setReplaceExisting(true)}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    replaceExisting
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Timpa Topologi Existing</span>
                </button>

                <button
                  type="button"
                  onClick={() => setReplaceExisting(false)}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    !replaceExisting
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Gabungkan (Tambah)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Section 2: Quantity Counters for LBS, PMCB, RECLOSER, FCO, DS, GH, GTT */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-600" />
                <span>3. Tentukan Jumlah Unit Peralatan Topologi Feeder {activeFeeder.namaPenyulang}</span>
              </h3>
              <button
                type="button"
                onClick={() => regenerateItemsFromQuantities(quantities)}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" /> Reset / Regenerate
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-10 gap-2">
              {/* 0a. INCOMING */}
              <div className="p-2.5 bg-sky-50/70 border border-sky-200 rounded-2xl space-y-1 text-center">
                <div className="flex items-center justify-center gap-1 text-sky-900 font-extrabold text-[10px]">
                  <Zap className="w-3 h-3 text-sky-600" />
                  <span>Incoming</span>
                </div>
                <div className="flex items-center justify-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleQtyChange('INCOMING', -1)}
                    className="w-5 h-5 rounded bg-sky-200 text-sky-900 font-black hover:bg-sky-300 flex items-center justify-center cursor-pointer text-xs"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={quantities.INCOMING}
                    onChange={(e) => handleQtyDirectInput('INCOMING', parseInt(e.target.value) || 0)}
                    className="w-8 text-center font-black text-xs bg-white border border-sky-300 rounded p-0.5"
                  />
                  <button
                    type="button"
                    onClick={() => handleQtyChange('INCOMING', 1)}
                    className="w-5 h-5 rounded bg-sky-200 text-sky-900 font-black hover:bg-sky-300 flex items-center justify-center cursor-pointer text-xs"
                  >
                    +
                  </button>
                </div>
                <div className="text-[9px] text-sky-700 font-semibold truncate">Trafo GI</div>
              </div>

              {/* 0b. OUTGOING */}
              <div className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-1 text-center">
                <div className="flex items-center justify-center gap-1 text-amber-900 font-extrabold text-[10px]">
                  <Zap className="w-3 h-3 text-amber-600" />
                  <span>Outgoing</span>
                </div>
                <div className="flex items-center justify-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleQtyChange('OUTGOING', -1)}
                    className="w-5 h-5 rounded bg-amber-200 text-amber-900 font-black hover:bg-amber-300 flex items-center justify-center cursor-pointer text-xs"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={quantities.OUTGOING}
                    onChange={(e) => handleQtyDirectInput('OUTGOING', parseInt(e.target.value) || 0)}
                    className="w-8 text-center font-black text-xs bg-white border border-amber-300 rounded p-0.5"
                  />
                  <button
                    type="button"
                    onClick={() => handleQtyChange('OUTGOING', 1)}
                    className="w-5 h-5 rounded bg-amber-200 text-amber-900 font-black hover:bg-amber-300 flex items-center justify-center cursor-pointer text-xs"
                  >
                    +
                  </button>
                </div>
                <div className="text-[9px] text-amber-700 font-semibold truncate">PMT GI</div>
              </div>

              {/* 0c. COUPLING */}
              <div className="p-2.5 bg-indigo-50/70 border border-indigo-200 rounded-2xl space-y-1 text-center">
                <div className="flex items-center justify-center gap-1 text-indigo-900 font-extrabold text-[10px]">
                  <Share2 className="w-3 h-3 text-indigo-600" />
                  <span>Coupling</span>
                </div>
                <div className="flex items-center justify-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleQtyChange('COUPLING', -1)}
                    className="w-5 h-5 rounded bg-indigo-200 text-indigo-900 font-black hover:bg-indigo-300 flex items-center justify-center cursor-pointer text-xs"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={quantities.COUPLING}
                    onChange={(e) => handleQtyDirectInput('COUPLING', parseInt(e.target.value) || 0)}
                    className="w-8 text-center font-black text-xs bg-white border border-indigo-300 rounded p-0.5"
                  />
                  <button
                    type="button"
                    onClick={() => handleQtyChange('COUPLING', 1)}
                    className="w-5 h-5 rounded bg-indigo-200 text-indigo-900 font-black hover:bg-indigo-300 flex items-center justify-center cursor-pointer text-xs"
                  >
                    +
                  </button>
                </div>
                <div className="text-[9px] text-indigo-700 font-semibold truncate">Bus Tie</div>
              </div>

              {/* 1. PMCB */}
              <div className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-1 text-center">
                <div className="flex items-center justify-center gap-1 text-amber-900 font-extrabold text-[11px]">
                  <Zap className="w-3.5 h-3.5 text-amber-600" />
                  <span>PMCB (GI)</span>
                </div>
                <div className="flex items-center justify-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleQtyChange('PMCB', -1)}
                    className="w-6 h-6 rounded-lg bg-amber-200 text-amber-900 font-black hover:bg-amber-300 flex items-center justify-center cursor-pointer"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={quantities.PMCB}
                    onChange={(e) => handleQtyDirectInput('PMCB', parseInt(e.target.value) || 0)}
                    className="w-10 text-center font-black text-sm bg-white border border-amber-300 rounded-lg p-0.5"
                  />
                  <button
                    type="button"
                    onClick={() => handleQtyChange('PMCB', 1)}
                    className="w-6 h-6 rounded-lg bg-amber-200 text-amber-900 font-black hover:bg-amber-300 flex items-center justify-center cursor-pointer"
                  >
                    +
                  </button>
                </div>
                <div className="text-[10px] text-amber-700 font-semibold">PMT GI 20kV</div>
              </div>

              {/* 2. LBS */}
              <div className="p-3 bg-orange-50/70 border border-orange-200 rounded-2xl space-y-1.5 text-center">
                <div className="flex items-center justify-center gap-1 text-orange-900 font-extrabold text-[11px]">
                  <Power className="w-3.5 h-3.5 text-orange-600" />
                  <span>LBS Switch</span>
                </div>
                <div className="flex items-center justify-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleQtyChange('LBS', -1)}
                    className="w-6 h-6 rounded-lg bg-orange-200 text-orange-900 font-black hover:bg-orange-300 flex items-center justify-center cursor-pointer"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={quantities.LBS}
                    onChange={(e) => handleQtyDirectInput('LBS', parseInt(e.target.value) || 0)}
                    className="w-10 text-center font-black text-sm bg-white border border-orange-300 rounded-lg p-0.5"
                  />
                  <button
                    type="button"
                    onClick={() => handleQtyChange('LBS', 1)}
                    className="w-6 h-6 rounded-lg bg-orange-200 text-orange-900 font-black hover:bg-orange-300 flex items-center justify-center cursor-pointer"
                  >
                    +
                  </button>
                </div>
                <div className="text-[10px] text-orange-700 font-semibold">Load Break</div>
              </div>

              {/* 3. RECLOSER */}
              <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-2xl space-y-1.5 text-center">
                <div className="flex items-center justify-center gap-1 text-purple-900 font-extrabold text-[11px]">
                  <Activity className="w-3.5 h-3.5 text-purple-600" />
                  <span>RECLOSER</span>
                </div>
                <div className="flex items-center justify-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleQtyChange('REC', -1)}
                    className="w-6 h-6 rounded-lg bg-purple-200 text-purple-900 font-black hover:bg-purple-300 flex items-center justify-center cursor-pointer"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={quantities.REC}
                    onChange={(e) => handleQtyDirectInput('REC', parseInt(e.target.value) || 0)}
                    className="w-10 text-center font-black text-sm bg-white border border-purple-300 rounded-lg p-0.5"
                  />
                  <button
                    type="button"
                    onClick={() => handleQtyChange('REC', 1)}
                    className="w-6 h-6 rounded-lg bg-purple-200 text-purple-900 font-black hover:bg-purple-300 flex items-center justify-center cursor-pointer"
                  >
                    +
                  </button>
                </div>
                <div className="text-[10px] text-purple-700 font-semibold">Proteksi Line</div>
              </div>

              {/* 4. FCO */}
              <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-2xl space-y-1.5 text-center">
                <div className="flex items-center justify-center gap-1 text-rose-900 font-extrabold text-[11px]">
                  <Shield className="w-3.5 h-3.5 text-rose-600" />
                  <span>FCO</span>
                </div>
                <div className="flex items-center justify-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleQtyChange('FCO', -1)}
                    className="w-6 h-6 rounded-lg bg-rose-200 text-rose-900 font-black hover:bg-rose-300 flex items-center justify-center cursor-pointer"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={quantities.FCO}
                    onChange={(e) => handleQtyDirectInput('FCO', parseInt(e.target.value) || 0)}
                    className="w-10 text-center font-black text-sm bg-white border border-rose-300 rounded-lg p-0.5"
                  />
                  <button
                    type="button"
                    onClick={() => handleQtyChange('FCO', 1)}
                    className="w-6 h-6 rounded-lg bg-rose-200 text-rose-900 font-black hover:bg-rose-300 flex items-center justify-center cursor-pointer"
                  >
                    +
                  </button>
                </div>
                <div className="text-[10px] text-rose-700 font-semibold">Fuse Cut Out</div>
              </div>

              {/* 5. DS */}
              <div className="p-3 bg-cyan-50/70 border border-cyan-200 rounded-2xl space-y-1.5 text-center">
                <div className="flex items-center justify-center gap-1 text-cyan-900 font-extrabold text-[11px]">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-600" />
                  <span>DS</span>
                </div>
                <div className="flex items-center justify-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleQtyChange('DS', -1)}
                    className="w-6 h-6 rounded-lg bg-cyan-200 text-cyan-900 font-black hover:bg-cyan-300 flex items-center justify-center cursor-pointer"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={quantities.DS}
                    onChange={(e) => handleQtyDirectInput('DS', parseInt(e.target.value) || 0)}
                    className="w-10 text-center font-black text-sm bg-white border border-cyan-300 rounded-lg p-0.5"
                  />
                  <button
                    type="button"
                    onClick={() => handleQtyChange('DS', 1)}
                    className="w-6 h-6 rounded-lg bg-cyan-200 text-cyan-900 font-black hover:bg-cyan-300 flex items-center justify-center cursor-pointer"
                  >
                    +
                  </button>
                </div>
                <div className="text-[10px] text-cyan-700 font-semibold">Disconnecting</div>
              </div>

              {/* 6. GH */}
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-1.5 text-center">
                <div className="flex items-center justify-center gap-1 text-blue-900 font-extrabold text-[11px]">
                  <Server className="w-3.5 h-3.5 text-blue-600" />
                  <span>GH</span>
                </div>
                <div className="flex items-center justify-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleQtyChange('GH', -1)}
                    className="w-6 h-6 rounded-lg bg-blue-200 text-blue-900 font-black hover:bg-blue-300 flex items-center justify-center cursor-pointer"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={quantities.GH}
                    onChange={(e) => handleQtyDirectInput('GH', parseInt(e.target.value) || 0)}
                    className="w-10 text-center font-black text-sm bg-white border border-blue-300 rounded-lg p-0.5"
                  />
                  <button
                    type="button"
                    onClick={() => handleQtyChange('GH', 1)}
                    className="w-6 h-6 rounded-lg bg-blue-200 text-blue-900 font-black hover:bg-blue-300 flex items-center justify-center cursor-pointer"
                  >
                    +
                  </button>
                </div>
                <div className="text-[10px] text-blue-700 font-semibold">Gardu Hubung</div>
              </div>

              {/* 7. GTT */}
              <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-2xl space-y-1.5 text-center">
                <div className="flex items-center justify-center gap-1 text-teal-900 font-extrabold text-[11px]">
                  <Radio className="w-3.5 h-3.5 text-teal-600" />
                  <span>GTT</span>
                </div>
                <div className="flex items-center justify-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleQtyChange('GTT', -1)}
                    className="w-6 h-6 rounded-lg bg-teal-200 text-teal-900 font-black hover:bg-teal-300 flex items-center justify-center cursor-pointer"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={quantities.GTT}
                    onChange={(e) => handleQtyDirectInput('GTT', parseInt(e.target.value) || 0)}
                    className="w-10 text-center font-black text-sm bg-white border border-teal-300 rounded-lg p-0.5"
                  />
                  <button
                    type="button"
                    onClick={() => handleQtyChange('GTT', 1)}
                    className="w-6 h-6 rounded-lg bg-teal-200 text-teal-900 font-black hover:bg-teal-300 flex items-center justify-center cursor-pointer"
                  >
                    +
                  </button>
                </div>
                <div className="text-[10px] text-teal-700 font-semibold">Gardu Trafo</div>
              </div>
            </div>
          </div>

          {/* Section 3: Generated Equipment Preview & Quick Editing Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-600" />
                <span>4. Daftar Peralatan Topologi ({totalItemsCount} Unit)</span>
              </h3>

              {/* Quick Add Buttons */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] text-slate-500 font-bold">Tambah satuan:</span>
                <button
                  type="button"
                  onClick={() => handleAddManualRow('INCOMING')}
                  className="px-2 py-1 bg-sky-100 hover:bg-sky-200 text-sky-900 font-extrabold text-[10px] rounded-lg cursor-pointer"
                >
                  + Inc
                </button>
                <button
                  type="button"
                  onClick={() => handleAddManualRow('OUTGOING')}
                  className="px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 font-extrabold text-[10px] rounded-lg cursor-pointer"
                >
                  + Out
                </button>
                <button
                  type="button"
                  onClick={() => handleAddManualRow('COUPLING')}
                  className="px-2 py-1 bg-indigo-100 hover:bg-indigo-200 text-indigo-900 font-extrabold text-[10px] rounded-lg cursor-pointer"
                >
                  + Cpl
                </button>
                <button
                  type="button"
                  onClick={() => handleAddManualRow('LBS')}
                  className="px-2 py-1 bg-orange-100 hover:bg-orange-200 text-orange-900 font-extrabold text-[10px] rounded-lg cursor-pointer"
                >
                  + LBS
                </button>
                <button
                  type="button"
                  onClick={() => handleAddManualRow('REC')}
                  className="px-2 py-1 bg-purple-100 hover:bg-purple-200 text-purple-900 font-extrabold text-[10px] rounded-lg cursor-pointer"
                >
                  + REC
                </button>
                <button
                  type="button"
                  onClick={() => handleAddManualRow('FCO')}
                  className="px-2 py-1 bg-rose-100 hover:bg-rose-200 text-rose-900 font-extrabold text-[10px] rounded-lg cursor-pointer"
                >
                  + FCO
                </button>
                <button
                  type="button"
                  onClick={() => handleAddManualRow('DS')}
                  className="px-2 py-1 bg-cyan-100 hover:bg-cyan-200 text-cyan-900 font-extrabold text-[10px] rounded-lg cursor-pointer"
                >
                  + DS
                </button>
              </div>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white max-h-[280px] overflow-y-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-slate-100 text-slate-700 font-extrabold uppercase tracking-wider text-[10px] sticky top-0 z-10 border-b border-slate-200">
                  <tr>
                    <th className="p-3 w-10 text-center">#</th>
                    <th className="p-3 w-28">Jenis Node</th>
                    <th className="p-3">Kode Equipment</th>
                    <th className="p-3">Nama Peralatan</th>
                    <th className="p-3">Section Target</th>
                    <th className="p-3">Lokasi / Tiang</th>
                    <th className="p-3">Rating / Kapasitas</th>
                    <th className="p-3 w-20 text-center">SCADA</th>
                    <th className="p-3 w-10 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-medium">
                  {generatedItems.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-6 text-center text-slate-400 font-semibold">
                        Peralatan masih kosong. Naikkan jumlah unit peralatan di atas.
                      </td>
                    </tr>
                  ) : (
                    generatedItems.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-2.5 text-center font-bold text-slate-400">{idx + 1}</td>
                        <td className="p-2.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-black ${
                              item.tipe === 'INCOMING'
                                ? 'bg-sky-100 text-sky-900'
                                : item.tipe === 'OUTGOING'
                                ? 'bg-amber-100 text-amber-900'
                                : item.tipe === 'COUPLING'
                                ? 'bg-indigo-100 text-indigo-900'
                                : item.tipe === 'PMCB'
                                ? 'bg-amber-100 text-amber-900'
                                : item.tipe === 'LBS'
                                ? 'bg-orange-100 text-orange-900'
                                : item.tipe === 'REC'
                                ? 'bg-purple-100 text-purple-900'
                                : item.tipe === 'FCO'
                                ? 'bg-rose-100 text-rose-900'
                                : item.tipe === 'DS'
                                ? 'bg-cyan-100 text-cyan-900'
                                : item.tipe === 'GH'
                                ? 'bg-blue-100 text-blue-900'
                                : 'bg-teal-100 text-teal-900'
                            }`}
                          >
                            {item.tipe}
                          </span>
                        </td>
                        <td className="p-2.5">
                          <input
                            type="text"
                            value={item.kodeNode}
                            onChange={(e) => handleUpdateItemAttribute(item.id, 'kodeNode', e.target.value)}
                            className="w-full p-1 bg-slate-50 border border-slate-200 rounded font-mono font-bold text-xs text-blue-700"
                          />
                        </td>
                        <td className="p-2.5">
                          <input
                            type="text"
                            value={item.namaNode}
                            onChange={(e) => handleUpdateItemAttribute(item.id, 'namaNode', e.target.value)}
                            className="w-full p-1 bg-slate-50 border border-slate-200 rounded font-bold text-xs text-slate-900"
                          />
                        </td>
                        <td className="p-2.5">
                          <select
                            value={item.namaSection || defaultSectionName}
                            onChange={(e) => handleUpdateItemAttribute(item.id, 'namaSection', e.target.value)}
                            className="w-full p-1 bg-slate-50 border border-slate-200 rounded font-bold text-[11px] text-slate-800"
                          >
                            {activeSections.length > 0 ? (
                              activeSections.map((s) => (
                                <option key={s.id} value={s.namaSection}>
                                  {s.namaSection}
                                </option>
                              ))
                            ) : (
                              <option value="Section 1 (Utama)">Section 1 (Utama)</option>
                            )}
                          </select>
                        </td>
                        <td className="p-2.5">
                          <input
                            type="text"
                            value={item.lokasiTiangOrAlamat || ''}
                            onChange={(e) => handleUpdateItemAttribute(item.id, 'lokasiTiangOrAlamat', e.target.value)}
                            className="w-full p-1 bg-slate-50 border border-slate-200 rounded text-xs text-slate-700"
                          />
                        </td>
                        <td className="p-2.5">
                          <input
                            type="text"
                            value={item.kapasitasOrAmpere || ''}
                            onChange={(e) => handleUpdateItemAttribute(item.id, 'kapasitasOrAmpere', e.target.value)}
                            className="w-full p-1 bg-slate-50 border border-slate-200 rounded text-xs text-slate-800 font-semibold"
                          />
                        </td>
                        <td className="p-2.5 text-center">
                          <input
                            type="checkbox"
                            checked={item.isScadaRemote || false}
                            onChange={(e) => handleUpdateItemAttribute(item.id, 'isScadaRemote', e.target.checked)}
                            className="w-4 h-4 text-blue-600 rounded border-slate-300 cursor-pointer"
                          />
                        </td>
                        <td className="p-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteRowItem(item.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-100 cursor-pointer"
                            title="Hapus Baris"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer Info & Actions */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-slate-600 font-medium">
              <Info className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                Total <strong className="text-blue-700 font-extrabold">{totalItemsCount} peralatan</strong> siap disimpan menjadi Topologi Feeder <strong className="text-slate-900 font-black">{activeFeeder.namaPenyulang}</strong>.
              </span>
            </div>

            <div className="flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer transition-all"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black cursor-pointer transition-all shadow-lg shadow-blue-600/30 flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Simpan Topologi Feeder ({totalItemsCount} Peralatan)</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
