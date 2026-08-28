import React from 'react';
import { 
  Activity, 
  Layers, 
  SlidersHorizontal, 
  Power, 
  Edit,
  Network,
  ToggleLeft,
  RefreshCw,
  Shield,
  ZapOff,
  Unlink,
  Zap
} from 'lucide-react';
import { StationConfig, DownstreamNode } from './DccView';

interface DccTopologyViewProps {
  activeStation: StationConfig;
  busEnergizedMap: Record<string, boolean>;
  nodeEnergizedStates: Record<string, { incomingActive: boolean; nodeActive: boolean }>;
  handleToggleFeederBreaker: (feederId: string) => void;
  handleToggleDownstreamNode: (feederId: string, nodeId: string) => void;
  setEditingJtmNode: (node: any) => void;
}

export const DccTopologyView: React.FC<DccTopologyViewProps> = ({
  activeStation,
  busEnergizedMap,
  nodeEnergizedStates,
  handleToggleFeederBreaker,
  handleToggleDownstreamNode,
  setEditingJtmNode
}) => {
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

  // Helper to generate a clean, smooth 90-degree curved orthogonal path
  const getOrthogonalPath = (fromX: number, fromY: number, toX: number, toY: number, r = 16) => {
    // vertical split at 45% of distance
    const midY = fromY + (toY - fromY) * 0.45;
    
    // If X coordinates are almost aligned, draw a neat straight line
    if (Math.abs(toX - fromX) < 3) {
      return `M ${fromX} ${fromY} L ${toX} ${toY}`;
    }
    
    const signX = toX > fromX ? 1 : -1;
    const signY = toY > fromY ? 1 : -1;
    
    // Make sure radius doesn't overshoot half of the horizontal/vertical distance
    const actualRadius = Math.min(
      r,
      Math.abs(toX - fromX) / 2,
      Math.abs(midY - fromY),
      Math.abs(toY - midY)
    );
    
    const p1Y = midY - actualRadius * signY;
    const p2X = fromX + actualRadius * signX;
    const p3X = toX - actualRadius * signX;
    const p4Y = midY + actualRadius * signY;
    
    return `M ${fromX} ${fromY} ` +
           `L ${fromX} ${p1Y} ` +
           `Q ${fromX} ${midY} ${p2X} ${midY} ` +
           `L ${p3X} ${midY} ` +
           `Q ${toX} ${midY} ${toX} ${p4Y} ` +
           `L ${toX} ${toY}`;
  };

  // Dynamic topology calculator for interactive visual map
  const computeSchematicTopology = () => {
    const nodes: Array<{
      id: string;
      type: 'BUS' | 'FEEDER' | 'JTM';
      name: string;
      code?: string;
      x: number;
      y: number;
      active: boolean;
      data?: any;
    }> = [];

    const lines: Array<{
      id: string;
      fromX: number;
      fromY: number;
      toX: number;
      toY: number;
      active: boolean;
    }> = [];

    const yLevelBus = 80;
    const yLevelFeeder = 220;
    const ySpacingJtm = 160; // Increased spacing for cleaner nodes layout

    let currentXStart = 100;
    const colWidth = 160; // pixels per layout unit column

    // Recursive helper to calculate total column width needed for JTM subtree
    const getSubtreeWidth = (node: DownstreamNode): number => {
      if (!node.children || node.children.length === 0) return 1;
      let total = 0;
      node.children.forEach(child => {
        total += getSubtreeWidth(child);
      });
      return total;
    };

    // Calculate sum of widths for root JTM nodes under a feeder
    const getFeederJtmWidth = (feederNodes: DownstreamNode[]): number => {
      if (!feederNodes || feederNodes.length === 0) return 1;
      let total = 0;
      feederNodes.forEach(node => {
        total += getSubtreeWidth(node);
      });
      return total;
    };

    activeStation.buses.forEach((bus, bIdx) => {
      const isBusEnergized = busEnergizedMap[bus.id];
      const busFeeders = activeStation.feeders.filter(f => f.busId === bus.id);

      // Compute total width needed for this bus's feeders subtree
      const feederWidths = busFeeders.map(feeder => {
        const jtmNodes = activeStation.downstreamNodes[feeder.id] || [];
        const widthUnits = getFeederJtmWidth(jtmNodes);
        return Math.max(1.3, widthUnits); // give minimum horizontal space
      });

      const totalBusWidthPixels = feederWidths.reduce((sum, w) => sum + w * colWidth, 0) + (busFeeders.length - 1) * 80;
      const busWidth = Math.max(280, totalBusWidthPixels);
      const busX = currentXStart;
      const busMidX = busX + busWidth / 2;

      // Add BUS representation
      nodes.push({
        id: bus.id,
        type: 'BUS',
        name: bus.name,
        x: busMidX,
        y: yLevelBus,
        active: isBusEnergized,
        data: bus
      });

      let feederXOffset = busX + 20;

      busFeeders.forEach((feeder, fIdx) => {
        const isFeederActive = isBusEnergized && feeder.status === 'CLOSED';
        const feederWidthUnits = feederWidths[fIdx];
        const feederAllocatedWidth = feederWidthUnits * colWidth;

        // Position the feeder cleanly at the center of its allocated horizontal space
        const feederX = feederXOffset + feederAllocatedWidth / 2;
        const feederY = yLevelFeeder;

        // Add FEEDER node
        nodes.push({
          id: feeder.id,
          type: 'FEEDER',
          name: feeder.name,
          code: feeder.code,
          x: feederX,
          y: feederY,
          active: isFeederActive,
          data: feeder
        });

        // Line 1: From Busbar horizontal coordinate down to Feeder Breaker
        lines.push({
          id: `line-bus-breaker-${feeder.id}`,
          fromX: feederX,
          fromY: yLevelBus + 10,
          toX: feederX,
          toY: feederY - 70,
          active: isBusEnergized
        });

        // Line 2: Through the Breaker down to Feeder Card
        lines.push({
          id: `line-breaker-feeder-${feeder.id}`,
          fromX: feederX,
          fromY: feederY - 70,
          toX: feederX,
          toY: feederY - 20,
          active: isFeederActive
        });

        const jtmNodes = activeStation.downstreamNodes[feeder.id] || [];

        // Dynamic space partitioning tree layout algorithm to eliminate card overlaps
        const layoutJtmNodes = (
          nodeList: DownstreamNode[],
          allocatedLeft: number,
          allocatedWidth: number,
          parentX: number,
          parentY: number,
          parentActive: boolean,
          depth = 1
        ) => {
          if (!nodeList || nodeList.length === 0) return;

          const levelY = yLevelFeeder + (depth * ySpacingJtm);
          
          // Get the widths of each child's subtree
          const childWidths = nodeList.map(node => getSubtreeWidth(node));
          const totalChildWidths = childWidths.reduce((a, b) => a + b, 0) || 1;

          let currentLeft = allocatedLeft;

          nodeList.forEach((node, nIdx) => {
            const childWidthUnits = childWidths[nIdx];
            // Proportional slice of space for this child
            const sliceWidth = (childWidthUnits / totalChildWidths) * allocatedWidth;

            // Center child inside its proportional slice
            const nodeX = currentLeft + sliceWidth / 2;
            const nodeY = levelY;
            const nodeState = nodeEnergizedStates[node.id] || { incomingActive: false, nodeActive: false };

            // Add JTM node
            nodes.push({
              id: node.id,
              type: 'JTM',
              name: node.name,
              code: node.type,
              x: nodeX,
              y: nodeY,
              active: nodeState.nodeActive,
              data: { ...node, feederId: feeder.id }
            });

            // Connect from parent bottom to this node top using orthogonal line identifier
            lines.push({
              id: `line-jtm-connect-${node.id}`,
              fromX: parentX,
              fromY: parentY + 36, // bottom edge of parent card
              toX: nodeX,
              toY: nodeY - 32, // top edge of child card
              active: nodeState.incomingActive
            });

            // Recurse children
            if (node.children && node.children.length > 0) {
              layoutJtmNodes(
                node.children,
                currentLeft,
                sliceWidth,
                nodeX,
                nodeY,
                nodeState.nodeActive,
                depth + 1
              );
            }

            currentLeft += sliceWidth;
          });
        };

        if (jtmNodes.length > 0) {
          layoutJtmNodes(jtmNodes, feederXOffset, feederAllocatedWidth, feederX, feederY, isFeederActive, 1);
        }

        // Slide start offset for the next feeder
        feederXOffset += feederAllocatedWidth + 80; // 80px buffer space between different feeder trees
      });

      // Slide start offset for the next Bus
      currentXStart += busWidth + 160;
    });

    // Compute max dimensions to ensure no clipping
    let maxX = 1200;
    let maxY = 700;
    nodes.forEach(n => {
      if (n.x + 200 > maxX) maxX = n.x + 200;
      if (n.y + 180 > maxY) maxY = n.y + 180;
    });

    return { nodes, lines, canvasWidth: maxX, canvasHeight: maxY };
  };

  const { nodes, lines, canvasWidth, canvasHeight } = computeSchematicTopology();

  return (
    <div className="relative w-full min-h-[600px] overflow-auto select-none">
      {/* Visual Title Header */}
      <div className="absolute top-2 left-2 z-10 bg-slate-950/80 border border-teal-950/60 p-2.5 rounded-xl">
        <h3 className="text-xs font-black text-teal-300 uppercase tracking-wider flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-teal-400 animate-pulse" />
          <span>ALIRAN DATA KONEKTIVITAS SCADA (LIVE)</span>
        </h3>
        <p className="text-[9px] text-slate-400 mt-0.5">
          Garis hijau: menyuplai daya aktif. Garis merah: padam total (peralatan hulu trip/open).
        </p>
      </div>

      <div className="relative overflow-auto max-w-full" style={{ width: '100%', height: '100%' }}>
        <div className="relative" style={{ width: canvasWidth, height: canvasHeight }}>
          {/* SVG GRAPHICS BACKGROUND */}
          <svg 
            width={canvasWidth} 
            height={canvasHeight} 
            className="absolute inset-0 z-0 overflow-visible pointer-events-none"
          >
            <defs>
              <linearGradient id="bus-grad-active" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#10B981" />
                <stop offset="50%" stopColor="#A7F3D0" />
                <stop offset="100%" stopColor="#059669" />
              </linearGradient>
              <linearGradient id="bus-grad-inactive" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#EF4444" />
                <stop offset="50%" stopColor="#FCA5A5" />
                <stop offset="100%" stopColor="#B91C1C" />
              </linearGradient>
              <filter id="glow-green-scada" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <filter id="glow-red-scada" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* 1. PMT Kopel Connecting Line if exactly 2 buses exist */}
            {activeStation.buses.length === 2 && (() => {
              const bus1 = activeStation.buses[0];
              const bus2 = activeStation.buses[1];
              const bus1RightX = 100 + 260; 
              const bus2LeftX = 100 + 400; 
              const midKopelX = (bus1RightX + bus2LeftX) / 2;
              const isKopelActive = activeStation.pmtKopelStatus === 'CLOSED' && (busEnergizedMap[bus1.id] || busEnergizedMap[bus2.id]);
              
              return (
                <g key="pmt-kopel-schematic-bridge">
                  <line
                    x1={bus1RightX}
                    y1={80}
                    x2={midKopelX - 20}
                    y2={80}
                    stroke={busEnergizedMap[bus1.id] ? '#10B981' : '#EF4444'}
                    strokeWidth={4}
                    className="transition-all duration-300"
                  />
                  <line
                    x1={midKopelX + 20}
                    y1={80}
                    x2={bus2LeftX}
                    y2={80}
                    stroke={busEnergizedMap[bus2.id] ? '#10B981' : '#EF4444'}
                    strokeWidth={4}
                    className="transition-all duration-300"
                  />
                  {isKopelActive && (
                    <line
                      x1={bus1RightX}
                      y1={80}
                      x2={bus2LeftX}
                      y2={80}
                      stroke="#A7F3D0"
                      strokeWidth={1.5}
                      strokeDasharray="4 6"
                    >
                      <animate
                        attributeName="stroke-dashoffset"
                        values="100;0"
                        dur="3s"
                        repeatCount="indefinite"
                      />
                    </line>
                  )}
                </g>
              );
            })()}

            {/* 2. Connection lines */}
            {lines.map((line) => {
              const isJtmConnection = line.id.startsWith('line-jtm-connect-');
              
              if (isJtmConnection) {
                const pathData = getOrthogonalPath(line.fromX, line.fromY, line.toX, line.toY, 16);
                return (
                  <g key={line.id}>
                    {/* Background thicker glow path */}
                    <path
                      d={pathData}
                      fill="none"
                      stroke={line.active ? '#10B981' : '#EF4444'}
                      strokeWidth={line.active ? 6 : 4}
                      strokeOpacity={line.active ? 0.35 : 0.25}
                      filter={line.active ? 'url(#glow-green-scada)' : 'url(#glow-red-scada)'}
                      className="transition-all duration-300 stroke-linejoin-round"
                    />
                    {/* Main core connector path */}
                    <path
                      d={pathData}
                      fill="none"
                      stroke={line.active ? '#059669' : '#DC2626'}
                      strokeWidth={line.active ? 3 : 2}
                      className="transition-all duration-300 stroke-linejoin-round"
                    />
                    {/* Animated Flow dashed path */}
                    {line.active && (
                      <path
                        d={pathData}
                        fill="none"
                        stroke="#A7F3D0"
                        strokeWidth={1.5}
                        strokeDasharray="6 8"
                        className="transition-all duration-300"
                      >
                        <animate
                          attributeName="stroke-dashoffset"
                          values="100;0"
                          dur="2.5s"
                          repeatCount="indefinite"
                        />
                      </path>
                    )}
                  </g>
                );
              }

              // Normal vertical straight line for Bus to Breaker or Breaker to Feeder
              return (
                <g key={line.id}>
                  {/* Background thicker glow path */}
                  <line
                    x1={line.fromX}
                    y1={line.fromY}
                    x2={line.toX}
                    y2={line.toY}
                    stroke={line.active ? '#10B981' : '#EF4444'}
                    strokeWidth={line.active ? 6 : 4}
                    strokeOpacity={line.active ? 0.35 : 0.25}
                    filter={line.active ? 'url(#glow-green-scada)' : 'url(#glow-red-scada)'}
                    className="transition-all duration-300"
                  />
                  {/* Main core connector path */}
                  <line
                    x1={line.fromX}
                    y1={line.fromY}
                    x2={line.toX}
                    y2={line.toY}
                    stroke={line.active ? '#059669' : '#DC2626'}
                    strokeWidth={line.active ? 3 : 2}
                    className="transition-all duration-300"
                  />
                  {/* Animated Flow dashed path */}
                  {line.active && (
                    <line
                      x1={line.fromX}
                      y1={line.fromY}
                      x2={line.toX}
                      y2={line.toY}
                      stroke="#A7F3D0"
                      strokeWidth={1.5}
                      strokeDasharray="6 8"
                      className="transition-all duration-300"
                    >
                      <animate
                        attributeName="stroke-dashoffset"
                        values="100;0"
                        dur="2.5s"
                        repeatCount="indefinite"
                      />
                    </line>
                  )}
                </g>
              );
            })}
          </svg>

          {/* 3. PMT KOPEL OVERLAY BUTTON IF EXACTLY 2 BUSES */}
          {activeStation.buses.length === 2 && (() => {
            const bus1RightX = 100 + 260; 
            const bus2LeftX = 100 + 400; 
            const midKopelX = (bus1RightX + bus2LeftX) / 2;
            
            return (
              <div 
                className="absolute z-20" 
                style={{ left: midKopelX - 35, top: 80 - 18 }}
              >
                <div className="bg-[#021815] p-1 border border-teal-900 rounded-xl flex items-center gap-1.5 shadow-lg">
                  <button
                    type="button"
                    onClick={() => handleToggleFeederBreaker('KOPEL')} // Map kopel action fallback
                    className={`w-7 h-7 rounded-lg text-[10px] font-black flex items-center justify-center cursor-pointer transition-all hover:scale-110 active:scale-90 ${
                      activeStation.pmtKopelStatus === 'CLOSED'
                        ? 'bg-emerald-500 text-slate-950 border border-emerald-300'
                        : 'bg-rose-500 text-white border border-rose-300 animate-pulse'
                    }`}
                    title="Kopel Bus A & Bus B"
                  >
                    {activeStation.pmtKopelStatus === 'CLOSED' ? 'C' : 'T'}
                  </button>
                  <span className="text-[7.5px] font-bold text-teal-300 pr-1 select-none">PMT KOPEL</span>
                </div>
              </div>
            );
          })()}

          {/* 4. INTERACTIVE CARD / NODE ELEMENTS OVERLAID */}
          {nodes.map((node) => {
            if (node.type === 'BUS') {
              const busWidth = 260;
              return (
                <div
                  key={node.id}
                  className="absolute z-10 transition-all duration-300"
                  style={{ left: node.x - busWidth / 2, top: node.y - 10, width: busWidth }}
                >
                  <div className={`w-full h-4 rounded-full border transition-all duration-300 relative ${
                    node.active 
                      ? 'bg-emerald-500 border-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.9)]' 
                      : 'bg-rose-600 border-rose-400 shadow-[0_0_5px_rgba(239,68,68,0.5)]'
                  }`}>
                    <span className="absolute inset-0 flex items-center justify-center text-[8.5px] font-black text-slate-950 select-none">
                      {node.name} &bull; {node.active ? `${node.data?.voltageKv || 20.0} kV` : '0 kV (PADAM)'}
                    </span>
                  </div>
                </div>
              );
            }

            if (node.type === 'FEEDER') {
              const feeder = node.data;
              return (
                <div
                  key={node.id}
                  className="absolute z-10 transition-all duration-300"
                  style={{ left: node.x - 90, top: node.y - 45, width: 180 }}
                >
                  <div className={`rounded-xl border bg-slate-950/95 p-2 shadow-xl transition-all relative ${
                    node.active 
                      ? 'border-emerald-500 shadow-emerald-950/20' 
                      : 'border-rose-950 shadow-rose-950/20'
                  }`}>
                    <div className="flex justify-between items-center border-b border-teal-950/60 pb-1 mb-1.5">
                      <span className="text-[9px] font-black text-teal-400">{feeder.code}</span>
                      <button
                        type="button"
                        onClick={() => handleToggleFeederBreaker(feeder.id)}
                        className={`w-4 h-4 rounded text-[8px] font-black flex items-center justify-center cursor-pointer transition-all ${
                          feeder.status === 'CLOSED'
                            ? 'bg-emerald-500 text-slate-950'
                            : 'bg-rose-500 text-white animate-pulse'
                        }`}
                        title="Toggle PMT Feeder"
                      >
                        {feeder.status === 'CLOSED' ? 'C' : 'T'}
                      </button>
                    </div>
                    <p className="text-[9.5px] font-extrabold text-slate-100 truncate mb-1">{feeder.name}</p>
                    
                    <div className="grid grid-cols-2 gap-1 text-[7.5px] text-slate-400 font-mono">
                      <div>Arus: <span className={node.active ? "text-emerald-400 font-bold" : "text-rose-400"}>{feeder.currentA}A</span></div>
                      <div>Daya: <span className="text-amber-400 font-bold">{feeder.powerMw}MW</span></div>
                    </div>
                  </div>
                </div>
              );
            }

            if (node.type === 'JTM') {
              const item = node.data;
              return (
                <div
                  key={node.id}
                  className="absolute z-10 transition-all duration-300"
                  style={{ left: node.x - 65, top: node.y - 32, width: 130 }}
                >
                  <div 
                    className={`rounded-xl border bg-slate-950/90 p-1.5 shadow-lg transition-all relative ${
                      item.status === 'CLOSED'
                        ? node.active
                          ? 'border-emerald-500 shadow-md shadow-emerald-950/20'
                          : 'border-emerald-900/50'
                        : 'border-rose-500/80 shadow-md shadow-rose-950/30'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <div className="flex items-center gap-1">
                        {getNodeIcon(item.type, node.active)}
                        <span className="text-[8px] font-black text-teal-400">{item.type}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggleDownstreamNode(item.feederId, item.id)}
                        className={`px-1 rounded text-[7px] font-black cursor-pointer transition-all ${
                          item.status === 'CLOSED'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse'
                        }`}
                      >
                        {item.status === 'CLOSED' ? 'CLOSED' : 'OPEN'}
                      </button>
                    </div>

                    <p className="text-[8.5px] font-bold text-slate-200 truncate" title={item.name}>
                      {item.name}
                    </p>

                    <button
                      type="button"
                      onClick={() => setEditingJtmNode({
                        feederId: item.feederId,
                        nodeId: item.id,
                        name: item.name,
                        type: item.type,
                        status: item.status,
                        loopSourceFeederId: item.loopSourceFeederId || ''
                      })}
                      className="absolute bottom-1 right-1 p-0.5 text-slate-500 hover:text-white transition-all rounded"
                      title="Edit Parameter JTM"
                    >
                      <Edit className="w-2 h-2" />
                    </button>
                  </div>
                </div>
              );
            }

            return null;
          })}
        </div>
      </div>
    </div>
  );
};
