import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  CustomSldSystemLayout, 
  CustomDevice, 
  CustomBusbar, 
  CustomLine, 
  CustomNode, 
  DEFAULT_NORMAL_SYSTEM_LAYOUT 
} from './CustomSldCanvasEditor';
import { 
  Zap, 
  Activity, 
  Power, 
  ShieldAlert, 
  CheckCircle2, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Search, 
  Grid, 
  Layers, 
  Sliders, 
  Info, 
  ArrowRight, 
  RefreshCw, 
  Maximize2, 
  Minimize2, 
  Radio, 
  AlertTriangle,
  Lock,
  Unlock,
  Play,
  Pause,
  Maximize,
  Compass,
  Cpu
} from 'lucide-react';

const STORAGE_KEY = 'perangpadam_custom_sld_layout_v2';

export const OperationalSldCanvasView: React.FC = () => {
  const [layout, setLayout] = useState<CustomSldSystemLayout>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.busbars) && Array.isArray(parsed.lines)) {
          const devices = Array.isArray(parsed.devices) 
            ? parsed.devices 
            : Array.isArray(parsed.breakers) 
            ? parsed.breakers.map((b: any) => ({ ...b, type: b.type || 'BREAKER' }))
            : DEFAULT_NORMAL_SYSTEM_LAYOUT.devices;
          return { ...parsed, devices };
        }
      }
    } catch (e) {
      console.error('Error loading custom SLD layout:', e);
    }
    return DEFAULT_NORMAL_SYSTEM_LAYOUT;
  });

  const [zoomLevel, setZoomLevel] = useState<number>(85);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [selectedDevice, setSelectedDevice] = useState<CustomDevice | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [telemetryActive, setTelemetryActive] = useState<boolean>(true);
  const [operationLogs, setOperationLogs] = useState<Array<{ id: string; time: string; text: string; type: 'SUCCESS' | 'WARNING' | 'INFO' }>>([
    { id: '1', time: new Date().toLocaleTimeString(), text: 'Sistem SCADA Operasional SLD siap terhubung.', type: 'INFO' }
  ]);
  const [gridVisible, setGridVisible] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Save layout to local storage
  const saveLayout = (newLayout: CustomSldSystemLayout) => {
    setLayout(newLayout);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newLayout));
    } catch (e) {
      console.error('Error saving layout:', e);
    }
  };

  // Live telemetry simulator loop
  useEffect(() => {
    if (!telemetryActive) return;
    const interval = setInterval(() => {
      setLayout(prev => ({
        ...prev,
        devices: prev.devices.map(d => {
          if (d.status === 'CLOSED') {
            const currentA = Math.round(120 + Math.random() * 250);
            const powerMw = Number((currentA * 20 * 1.732 * 0.85 / 1000).toFixed(2));
            return { ...d, ratingA: currentA, powerMw } as any;
          }
          return { ...d, ratingA: 0, powerMw: 0 } as any;
        })
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, [telemetryActive]);

  const addLog = (text: string, type: 'SUCCESS' | 'WARNING' | 'INFO' = 'SUCCESS') => {
    setOperationLogs(prev => [
      { id: Date.now().toString(), time: new Date().toLocaleTimeString(), text, type },
      ...prev.slice(0, 30)
    ]);
  };

  // Toggle device status (CLOSED <-> OPEN)
  const handleToggleDevice = (device: CustomDevice) => {
    const nextStatus = device.status === 'CLOSED' ? 'OPEN' : 'CLOSED';
    const updatedDevices = layout.devices.map(d => d.id === device.id ? { ...d, status: nextStatus } : d);
    saveLayout({ ...layout, devices: updatedDevices });
    addLog(`Operasi Perangkat [${device.code || device.name}] diubah ke status: ${nextStatus}`, nextStatus === 'CLOSED' ? 'WARNING' : 'SUCCESS');
    if (selectedDevice && selectedDevice.id === device.id) {
      setSelectedDevice({ ...selectedDevice, status: nextStatus });
    }
  };

  // System statistics summary
  const stats = useMemo(() => {
    const totalDevices = layout.devices.length;
    const closedDevices = layout.devices.filter(d => d.status === 'CLOSED').length;
    const openDevices = layout.devices.filter(d => d.status === 'OPEN').length;
    const trippedDevices = layout.devices.filter(d => d.status === 'TRIP').length;
    return { totalDevices, closedDevices, openDevices, trippedDevices };
  }, [layout]);

  // Dynamic live electrical power flow propagation tracing
  const energizedStatus = useMemo(() => {
    const energizedLines = new Set<string>();
    const energizedDevices = new Set<string>();
    const energizedBusbars = new Set<string>();

    // Initially, let's treat all active busbars as energized power source lines
    layout.busbars.forEach(b => energizedBusbars.add(b.id));

    // Queue for BFS traversal
    const queue: { type: 'BUSBAR' | 'LINE' | 'DEVICE'; id: string }[] = [];
    layout.busbars.forEach(b => queue.push({ type: 'BUSBAR', id: b.id }));

    const visited = new Set<string>();
    layout.busbars.forEach(b => visited.add(`BUSBAR_${b.id}`));

    // Helper: check if a point is on a busbar with snapping tolerance
    const isPointOnBusbar = (px: number, py: number, bus: typeof layout.busbars[0]) => {
      const isHoriz = bus.orientation === 'HORIZONTAL';
      const tolerance = 35; // Generous snapping tolerance
      if (isHoriz) {
        return (
          Math.abs(py - bus.y) <= tolerance &&
          px >= bus.x - 30 &&
          px <= bus.x + bus.length + 30
        );
      } else {
        return (
          Math.abs(px - bus.x) <= tolerance &&
          py >= bus.y - 30 &&
          py <= bus.y + bus.length + 30
        );
      }
    };

    // Helper: distance between two 2D points
    const getDist = (x1: number, y1: number, x2: number, y2: number) => {
      return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
    };

    const pointTolerance = 35; // Snap range

    while (queue.length > 0) {
      const current = queue.shift()!;

      if (current.type === 'BUSBAR') {
        const bus = layout.busbars.find(b => b.id === current.id);
        if (!bus) continue;

        // Find all connected lines
        layout.lines.forEach(line => {
          const lineKey = `LINE_${line.id}`;
          if (!visited.has(lineKey)) {
            const touches = isPointOnBusbar(line.x1, line.y1, bus) || isPointOnBusbar(line.x2, line.y2, bus);
            if (touches) {
              visited.add(lineKey);
              energizedLines.add(line.id);
              queue.push({ type: 'LINE', id: line.id });
            }
          }
        });

        // Find all connected devices
        layout.devices.forEach(dev => {
          const devKey = `DEVICE_${dev.id}`;
          if (!visited.has(devKey)) {
            const touches = isPointOnBusbar(dev.x, dev.y, bus);
            if (touches) {
              visited.add(devKey);
              energizedDevices.add(dev.id);
              if (dev.status === 'CLOSED') {
                queue.push({ type: 'DEVICE', id: dev.id });
              }
            }
          }
        });
      } else if (current.type === 'LINE') {
        const line = layout.lines.find(l => l.id === current.id);
        if (!line) continue;

        const p1 = { x: line.x1, y: line.y1 };
        const p2 = { x: line.x2, y: line.y2 };

        // Find all other lines touching this line's endpoints
        layout.lines.forEach(otherLine => {
          if (otherLine.id === line.id) return;
          const otherKey = `LINE_${otherLine.id}`;
          if (!visited.has(otherKey)) {
            const touches =
              getDist(otherLine.x1, otherLine.y1, p1.x, p1.y) <= pointTolerance ||
              getDist(otherLine.x2, otherLine.y2, p1.x, p1.y) <= pointTolerance ||
              getDist(otherLine.x1, otherLine.y1, p2.x, p2.y) <= pointTolerance ||
              getDist(otherLine.x2, otherLine.y2, p2.x, p2.y) <= pointTolerance;

            if (touches) {
              visited.add(otherKey);
              energizedLines.add(otherLine.id);
              queue.push({ type: 'LINE', id: otherLine.id });
            }
          }
        });

        // Find all devices touching this line's endpoints
        layout.devices.forEach(dev => {
          const devKey = `DEVICE_${dev.id}`;
          if (!visited.has(devKey)) {
            const touches =
              getDist(dev.x, dev.y, p1.x, p1.y) <= pointTolerance ||
              getDist(dev.x, dev.y, p2.x, p2.y) <= pointTolerance;

            if (touches) {
              visited.add(devKey);
              energizedDevices.add(dev.id);
              if (dev.status === 'CLOSED') {
                queue.push({ type: 'DEVICE', id: dev.id });
              }
            }
          }
        });

        // Find all busbars touching this line's endpoints
        layout.busbars.forEach(bus => {
          const busKey = `BUSBAR_${bus.id}`;
          if (!visited.has(busKey)) {
            const touches = isPointOnBusbar(p1.x, p1.y, bus) || isPointOnBusbar(p2.x, p2.y, bus);
            if (touches) {
              visited.add(busKey);
              energizedBusbars.add(bus.id);
              queue.push({ type: 'BUSBAR', id: bus.id });
            }
          }
        });
      } else if (current.type === 'DEVICE') {
        const dev = layout.devices.find(d => d.id === current.id);
        if (!dev) continue;

        // CLOSED device propagates current to all adjoining elements
        layout.lines.forEach(line => {
          const lineKey = `LINE_${line.id}`;
          if (!visited.has(lineKey)) {
            const touches =
              getDist(line.x1, line.y1, dev.x, dev.y) <= pointTolerance ||
              getDist(line.x2, line.y2, dev.x, dev.y) <= pointTolerance;

            if (touches) {
              visited.add(lineKey);
              energizedLines.add(line.id);
              queue.push({ type: 'LINE', id: line.id });
            }
          }
        });

        layout.busbars.forEach(bus => {
          const busKey = `BUSBAR_${bus.id}`;
          if (!visited.has(busKey)) {
            const touches = isPointOnBusbar(dev.x, dev.y, bus);
            if (touches) {
              visited.add(busKey);
              energizedBusbars.add(bus.id);
              queue.push({ type: 'BUSBAR', id: bus.id });
            }
          }
        });

        layout.devices.forEach(otherDev => {
          if (otherDev.id === dev.id) return;
          const otherKey = `DEVICE_${otherDev.id}`;
          if (!visited.has(otherKey)) {
            const touches = getDist(otherDev.x, otherDev.y, dev.x, dev.y) <= pointTolerance;
            if (touches) {
              visited.add(otherKey);
              energizedDevices.add(otherDev.id);
              if (otherDev.status === 'CLOSED') {
                queue.push({ type: 'DEVICE', id: otherDev.id });
              }
            }
          }
        });
      }
    }

    return { energizedLines, energizedDevices, energizedBusbars };
  }, [layout]);

  // Pan / Zoom handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 || e.button === 1) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      e.preventDefault();
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handleZoomIn = () => setZoomLevel(prev => Math.min(200, prev + 15));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(30, prev - 15));
  const handleResetZoom = () => {
    setZoomLevel(85);
    setPan({ x: 0, y: 0 });
  };

  const toggleFullscreenMode = () => {
    if (!wrapperRef.current) return;
    if (!document.fullscreenElement) {
      wrapperRef.current.requestFullscreen().catch(err => {
        console.error("Error attempting to enable fullscreen:", err);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  return (
    <div ref={wrapperRef} className="h-full w-full flex flex-col bg-slate-950 text-white font-sans select-none overflow-hidden relative">
      {/* Top Header Controls Bar */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 shadow-md z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
            <Radio className="w-5 h-5 animate-pulse text-cyan-200" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black tracking-wide text-white">OPEL / SCADA DESAIN SLD KUSTOM</h1>
              <span className="px-2 py-0.5 rounded bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-[10px] font-black uppercase">
                Live Interactive Mode
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Closed (Bertegangan) = <span className="text-red-400 font-bold">Merah</span> | Open (Tidak Bertegangan) = <span className="text-emerald-400 font-bold">Hijau</span>
            </p>
          </div>
        </div>

        {/* Quick Stats & Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 px-3 py-1.5 rounded-xl text-xs">
            <span className="text-slate-400">Total:</span>
            <span className="font-black text-white">{stats.totalDevices}</span>
            <span className="text-slate-600">|</span>
            <span className="text-red-400 font-bold">Closed ({stats.closedDevices})</span>
            <span className="text-slate-600">|</span>
            <span className="text-emerald-400 font-bold">Open ({stats.openDevices})</span>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari perangkat / gardu..."
              className="bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-44"
            />
          </div>

          {/* Telemetry Toggle */}
          <button
            onClick={() => setTelemetryActive(!telemetryActive)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              telemetryActive 
                ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300' 
                : 'bg-slate-800 border border-slate-700 text-slate-400'
            }`}
          >
            {telemetryActive ? <Play className="w-3.5 h-3.5 animate-pulse" /> : <Pause className="w-3.5 h-3.5" />}
            <span>Telemetri {telemetryActive ? 'Aktif' : 'Pause'}</span>
          </button>

          {/* Zoom Controls */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1">
            <button 
              onClick={handleZoomOut} 
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="px-2.5 text-xs font-black text-cyan-300 min-w-[48px] text-center">
              {zoomLevel}%
            </span>
            <button 
              onClick={handleZoomIn} 
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button 
              onClick={handleResetZoom} 
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors border-l border-slate-800 ml-1 pl-2"
              title="Reset View"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={() => setGridVisible(!gridVisible)}
            className={`p-2 rounded-xl border text-xs font-bold transition-all ${
              gridVisible ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300' : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
            title="Toggle Grid Lines"
          >
            <Grid className="w-4 h-4" />
          </button>

          <button
            onClick={toggleFullscreenMode}
            className="p-2 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 rounded-xl border border-cyan-400/40 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
            title="Fullscreen Mode"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            <span>{isFullscreen ? 'Exit Fullscreen' : 'Full Screen'}</span>
          </button>
        </div>
      </div>

      {/* Main Content Workspace */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Interactive Canvas Area */}
        <div 
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="flex-1 bg-[#030712] relative overflow-auto cursor-grab active:cursor-grabbing"
        >
          <div 
            className="min-w-[4000px] min-h-[4000px] relative transition-transform duration-75 origin-top-left"
            style={{ 
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoomLevel / 100})` 
            }}
          >
            <svg className="w-[4000px] h-[4000px] overflow-visible">
              <defs>
                {/* Glow Filters */}
                <filter id="glow-red" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                <filter id="glow-green" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>

                {gridVisible && (
                  <pattern id="grid-pattern-op" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(6, 182, 212, 0.08)" strokeWidth="1" />
                    <circle cx="0" cy="0" r="1" fill="rgba(6, 182, 212, 0.2)" />
                  </pattern>
                )}

                <style>{`
                  @keyframes energyFlowRed {
                    0% { stroke-dashoffset: 24; }
                    100% { stroke-dashoffset: 0; }
                  }
                  @keyframes energyFlowGreen {
                    0% { stroke-dashoffset: 24; }
                    100% { stroke-dashoffset: 0; }
                  }
                  .animate-energy-red {
                    animation: energyFlowRed 0.8s linear infinite;
                  }
                  .animate-energy-green {
                    animation: energyFlowGreen 1.5s linear infinite;
                  }
                `}</style>
              </defs>

              {gridVisible && (
                <rect x="-1000" y="-1000" width="6000" height="6000" fill="url(#grid-pattern-op)" />
              )}

              {/* 1. RENDER NODES / GARDU INCLOSURES */}
              {layout.nodes.map(node => (
                <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
                  <rect
                    width={node.width}
                    height={node.height}
                    rx="12"
                    fill="#080f1e"
                    fillOpacity="0.9"
                    stroke="#1e293b"
                    strokeWidth="2"
                    className="shadow-2xl"
                  />
                  <rect
                    width={node.width}
                    height="32"
                    rx="12"
                    fill="#0f172a"
                    stroke="#334155"
                    strokeWidth="1"
                  />
                  <text x="14" y="21" fill="#38bdf8" fontSize="11" fontWeight="900" fontFamily="sans-serif">
                    ⚡ {node.name} ({node.code})
                  </text>
                </g>
              ))}

              {/* 2. RENDER LINES & CABLES (CLOSED = RED, OPEN = GREEN, matching PMT status) */}
              {layout.lines.map(line => {
                const isClosed = energizedStatus.energizedLines.has(line.id);
                const lineCol = isClosed ? '#ef4444' : '#22c55e';
                const thickness = line.strokeWidth || 3.5;
                return (
                  <g key={line.id}>
                    <line
                      x1={line.x1}
                      y1={line.y1}
                      x2={line.x2}
                      y2={line.y2}
                      stroke={lineCol}
                      strokeWidth={thickness}
                      strokeOpacity="0.4"
                    />
                    <line
                      x1={line.x1}
                      y1={line.y1}
                      x2={line.x2}
                      y2={line.y2}
                      stroke={lineCol}
                      strokeWidth={thickness}
                      strokeDasharray={isClosed ? '12,6' : '8,6'}
                      className={isClosed ? 'animate-energy-red' : 'animate-energy-green'}
                      filter={isClosed ? 'url(#glow-red)' : 'url(#glow-green)'}
                    />
                    <text
                      x={(line.x1 + line.x2) / 2}
                      y={((line.y1 + line.y2) / 2) - 6}
                      fill={lineCol}
                      fontSize="9"
                      fontWeight="bold"
                      textAnchor="middle"
                      className="select-none pointer-events-none"
                    >
                      {line.name} ({isClosed ? 'ENERGIZED' : 'OFFLINE'})
                    </text>
                  </g>
                );
              })}

              {/* 3. RENDER BUSBARS */}
              {layout.busbars.map(bus => {
                const isHoriz = bus.orientation === 'HORIZONTAL';
                const w = isHoriz ? bus.length : (bus.thickness || 10);
                const h = isHoriz ? (bus.thickness || 10) : bus.length;
                const isEnergized = energizedStatus.energizedBusbars.has(bus.id);
                const busColor = isEnergized ? '#ef4444' : '#10b981';
                const glowFilter = isEnergized ? 'url(#glow-red)' : 'url(#glow-green)';
                return (
                  <g key={bus.id} transform={`translate(${bus.x}, ${bus.y})`}>
                    <rect
                      width={w}
                      height={h}
                      rx="4"
                      fill={busColor}
                      stroke="#ffffff"
                      strokeWidth="1.5"
                      filter={glowFilter}
                      className="shadow-xl cursor-pointer"
                    />
                    <rect
                      x={bus.labelOffsetX || 0}
                      y={(bus.labelOffsetY || 0) - 24}
                      width={bus.name.length * 6.5 + 28}
                      height="20"
                      rx="6"
                      fill="#020617"
                      stroke={busColor}
                      strokeWidth="1.5"
                    />
                    <text
                      x={(bus.labelOffsetX || 0) + 8}
                      y={(bus.labelOffsetY || 0) - 10}
                      fill="#ffffff"
                      fontSize={bus.fontSize || 9.5}
                      fontWeight="900"
                      fontFamily={bus.fontFamily || 'sans-serif'}
                    >
                      ⚡ {bus.name} ({bus.voltageKv}kV)
                    </text>
                  </g>
                );
              })}

              {/* 4. RENDER INTERACTIVE DEVICES (CLOSED = RED, OPEN = GREEN) */}
              {layout.devices.map(dev => {
                const isClosed = dev.status === 'CLOSED';
                const isTrip = dev.status === 'TRIP';
                const scale = dev.scale || 1.0;
                const isMatchSearch = searchQuery && (dev.name.toLowerCase().includes(searchQuery.toLowerCase()) || dev.code.toLowerCase().includes(searchQuery.toLowerCase()));

                // Precise color matching from the diagram
                const badgeColor = isClosed ? '#ef4444' : '#10b981';
                const typeUpper = dev.type?.toUpperCase() || '';
                const isNoBorderType = ['LBS', 'RECLOSER', 'REC', 'PMCB', 'FCO'].includes(typeUpper);

                return (
                  <g 
                    key={dev.id} 
                    transform={`translate(${dev.x}, ${dev.y}) scale(${scale})`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedDevice(dev);
                    }}
                    className="cursor-pointer group"
                  >
                    {/* Outer selection ring if selected */}
                    {selectedDevice?.id === dev.id && (
                      <rect x="-24" y="-24" width="48" height="48" rx="10" fill="none" stroke="#38bdf8" strokeWidth="2.5" strokeDasharray="4,4" className="animate-spin" />
                    )}

                    {/* RENDER BASED ON DEVICE TYPE */}
                    {dev.type === 'DS' ? (
                      // Disconnecting Switch (DS) - Golden Horizontal Switch Box
                      <g>
                        <rect x="-24" y="-12" width="48" height="24" rx="6" fill="#020617" stroke="#f59e0b" strokeWidth="2.5" />
                        <circle cx="-11" cy="0" r="3" fill="#f59e0b" />
                        <circle cx="11" cy="0" r="3" fill="#f59e0b" />
                        <line 
                          x1="-11" 
                          y1="0" 
                          x2={isClosed ? '11' : '2'} 
                          y2={isClosed ? '0' : '-9'} 
                          stroke="#fbbf24" 
                          strokeWidth="3.5" 
                          strokeLinecap="round" 
                          className="transition-all duration-300"
                        />
                        <text x="0" y="2" fill="#f59e0b" fontSize="7" fontWeight="bold" textAnchor="middle">DS</text>
                      </g>
                    ) : dev.type === 'COUPLING' ? (
                      // Coupling / Bus Tie Breaker - Blue Pill representing `<-> KOPEL`
                      <g>
                        <rect x="-35" y="-14" width="70" height="28" rx="6" fill="#0284c7" stroke="#38bdf8" strokeWidth="2.5" />
                        <text x="0" y="3" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle">⟷ KOPEL</text>
                        {/* Status Label Box */}
                        <g transform="translate(0, -24)">
                          <rect x="-18" y="-7" width="36" height="14" rx="3" fill={isClosed ? '#ef4444' : '#10b981'} stroke="#ffffff" strokeWidth="1" />
                          <text x="0" y="3.5" fill="#ffffff" fontSize="7" fontWeight="black" textAnchor="middle">{isClosed ? 'CLOSE' : 'OPEN'}</text>
                        </g>
                      </g>
                    ) : dev.type === 'TRAFO' ? (
                      // Transformer (TRAFO) - Classical Winding Dual Circles
                      <g>
                        <circle cx="0" cy="-6" r="12" fill="none" stroke="#f59e0b" strokeWidth="2.5" />
                        <circle cx="0" cy="6" r="12" fill="none" stroke="#ef4444" strokeWidth="2.5" />
                        <text x="0" y="3" fill="#ffffff" fontSize="7" fontWeight="bold" textAnchor="middle">TR</text>
                      </g>
                    ) : dev.type === 'LBS' ? (
                      // Load Break Switch (LBS) - Circle Switch with Arching Chamber Arc
                      <g>
                        <circle cx="0" cy="0" r="16" fill="#020617" stroke={badgeColor} strokeWidth="2.5" filter={isClosed ? 'url(#glow-red)' : 'url(#glow-green)'} />
                        <line 
                          x1="-10" 
                          y1="0" 
                          x2={isClosed ? '10' : '2'} 
                          y2={isClosed ? '0' : '-10'} 
                          stroke={badgeColor} 
                          strokeWidth="3.5" 
                          strokeLinecap="round"
                          className="transition-all duration-300"
                        />
                        <circle cx="-10" cy="0" r="2.5" fill={badgeColor} />
                        <circle cx="10" cy="0" r="2.5" fill={badgeColor} />
                        {/* Gas Arc Extinguisher chamber indicator top arc */}
                        <path d="M -8 -11 A 14 14 0 0 1 8 -11" fill="none" stroke={badgeColor} strokeWidth="1.5" strokeDasharray="2,2" />
                        <text x="0" y="4" fill="#ffffff" fontSize="7.5" fontWeight="black" textAnchor="middle">LBS</text>
                      </g>
                    ) : dev.type === 'RECLOSER' || dev.type === 'REC' ? (
                      // Auto Recloser (ACR / REC) - Precise Double Ring Square Breaker with "R"
                      <g>
                        <rect x="-16" y="-16" width="32" height="32" rx="4" fill="#020617" stroke={badgeColor} strokeWidth="2.5" filter={isClosed ? 'url(#glow-red)' : 'url(#glow-green)'} />
                        <rect x="-12" y="-12" width="24" height="24" rx="2" fill="none" stroke={badgeColor} strokeWidth="1.2" strokeDasharray="3,1" />
                        <text x="0" y="5.5" fill="#ffffff" fontSize="13" fontWeight="950" textAnchor="middle" fontFamily="sans-serif">R</text>
                        {/* Status Label Badge inside the box */}
                        <circle cx="11" cy="-11" r="4.5" fill={badgeColor} stroke="#020617" strokeWidth="1.5" />
                      </g>
                    ) : dev.type === 'PMCB' ? (
                      // Pole Mounted Circuit Breaker (PMCB) - Hexagonal chamber with an "X" crossed indicator
                      <g>
                        <polygon points="0,-16 14,-8 14,8 0,16 -14,8 -14,-8" fill="#020617" stroke={badgeColor} strokeWidth="2.5" filter={isClosed ? 'url(#glow-red)' : 'url(#glow-green)'} />
                        <line x1="-10" y1="-6" x2="10" y2="6" stroke={badgeColor} strokeWidth="2.5" />
                        <line x1="10" y1="-6" x2="-10" y2="6" stroke={badgeColor} strokeWidth="2.5" />
                        <text x="0" y="3" fill="#ffffff" fontSize="7" fontWeight="bold" textAnchor="middle">PMCB</text>
                      </g>
                    ) : dev.type === 'FCO' ? (
                      // Fuse Cut Out (FCO) - Standard Cutout Hook Symbol
                      <g>
                        {/* Dual round mounting hooks */}
                        <circle cx="-13" cy="0" r="3" fill="none" stroke={badgeColor} strokeWidth="2" />
                        <circle cx="13" cy="0" r="3" fill="none" stroke={badgeColor} strokeWidth="2" />
                        {/* Swinging Fuse Link element */}
                        <line 
                          x1="-10" 
                          y1="0" 
                          x2={isClosed ? '10' : '2'} 
                          y2={isClosed ? '0' : '-13'} 
                          stroke={badgeColor} 
                          strokeWidth="3.5" 
                          strokeLinecap="round" 
                          className="transition-all duration-300"
                        />
                        {/* Small fuse drop-out indicator flag */}
                        <rect x="-4" y={isClosed ? '-3' : '-9'} width="8" height="6" rx="1.5" fill="#020617" stroke={badgeColor} strokeWidth="1.5" />
                        <text x="0" y={isClosed ? '2' : '-4'} fill="#ffffff" fontSize="5.5" fontWeight="black" textAnchor="middle">FCO</text>
                      </g>
                    ) : (
                      // Standard Breakers / PMT / Feeder Switch
                      // Rendered exactly like the clean rounded-rect with "C" or "O" from the user screenshot!
                      <g>
                        <rect 
                          x="-16" 
                          y="-16" 
                          width="32" 
                          height="32" 
                          rx="6" 
                          fill={isClosed ? '#ef4444' : '#10b981'} 
                          stroke={isClosed ? '#f87171' : '#34d399'} 
                          strokeWidth="2.5"
                          className="transition-colors duration-200"
                          filter={isClosed ? 'url(#glow-red)' : 'url(#glow-green)'}
                        />
                        <text 
                          x="0" 
                          y="5.5" 
                          fill="#ffffff" 
                          fontSize="15" 
                          fontWeight="900" 
                          textAnchor="middle"
                          className="pointer-events-none select-none tracking-tighter"
                        >
                          {isClosed ? 'C' : 'O'}
                        </text>

                        {/* Top corner status type label badge (like PMT, ACR, LBS) */}
                        <g transform="translate(0, -22)">
                          <rect x="-14" y="-5" width="28" height="10" rx="2" fill="#0f172a" stroke="#475569" strokeWidth="1" />
                          <text x="0" y="3" fill="#94a3b8" fontSize="6.5" fontWeight="black" textAnchor="middle">
                            {dev.type === 'BREAKER' || dev.type === 'INCOMING' || dev.type === 'OUTGOING' ? 'PMT' : dev.type === 'LBS' ? 'LBS' : dev.type === 'RECLOSER' ? 'ACR' : 'SW'}
                          </text>
                        </g>
                      </g>
                    )}

                    {/* Label tag below the device with clean coordinates */}
                    <g transform="translate(0, 26)">
                      {!isNoBorderType && (
                        <rect
                          x={-(dev.name.length * 3.5 + 12)}
                          y="-8"
                          width={dev.name.length * 7 + 24}
                          height="18"
                          rx="4"
                          fill="#020617"
                          fillOpacity="0.95"
                          stroke={isMatchSearch ? '#38bdf8' : badgeColor}
                          strokeWidth={isMatchSearch ? '2' : '1.5'}
                        />
                      )}
                      <text
                        x="0"
                        y="4"
                        fill={isNoBorderType ? badgeColor : "#ffffff"}
                        fontSize="9"
                        fontWeight="bold"
                        textAnchor="middle"
                        className="select-none pointer-events-none"
                      >
                        {dev.code || dev.name} ({dev.status})
                      </text>
                    </g>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Right Side Operational Inspector & Control Drawer */}
        <div className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col justify-between shrink-0 shadow-xl z-20">
          <div className="p-4 overflow-y-auto space-y-4 flex-1">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-xs font-black uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                <Sliders className="w-4 h-4" />
                <span>Panel Kontrol Perangkat</span>
              </h2>
              <span className="text-[10px] text-slate-400">SCADA RTU</span>
            </div>

            {selectedDevice ? (
              <div className="space-y-4">
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-inner">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[10px] font-black uppercase">
                      {selectedDevice.type}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase font-bold ${
                      selectedDevice.status === 'CLOSED' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      {selectedDevice.status} {selectedDevice.status === 'CLOSED' ? '(MERAH)' : '(HIJAU)'}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-black text-white">{selectedDevice.name}</h3>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">Kode: {selectedDevice.code}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80">
                    <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                      <div className="text-[10px] text-slate-400">Arus Beban</div>
                      <div className="text-sm font-black text-cyan-300 mt-0.5">{selectedDevice.ratingA || 0} A</div>
                    </div>
                    <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                      <div className="text-[10px] text-slate-400">Daya Aktif</div>
                      <div className="text-sm font-black text-emerald-300 mt-0.5">{selectedDevice.powerMw || 0} MW</div>
                    </div>
                  </div>
                </div>

                {/* Operation Action Buttons */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-300 block">Eksekusi Perintah SCADA:</label>
                  <button
                    onClick={() => handleToggleDevice(selectedDevice)}
                    className={`w-full py-3 px-4 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer ${
                      selectedDevice.status === 'CLOSED'
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white hover:from-emerald-500 hover:to-teal-400 shadow-emerald-950/50'
                        : 'bg-gradient-to-r from-red-600 to-rose-500 text-white hover:from-red-500 hover:to-rose-400 shadow-red-950/50'
                    }`}
                  >
                    <Power className="w-4 h-4" />
                    <span>{selectedDevice.status === 'CLOSED' ? 'UBAH KE OPEN (HIJAU)' : 'UBAH KE CLOSED (MERAH)'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 px-4 space-y-3 bg-slate-950/40 border border-dashed border-slate-800 rounded-2xl">
                <Info className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400">
                  Klik salah satu ikon perangkat pemutus (PMT, LBS, Recloser, DS) pada kanvas untuk melihat detail dan mengoperasikannya.
                </p>
              </div>
            )}

            {/* Live Operation Audit Trail / Logs */}
            <div className="space-y-2 pt-4 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-300 uppercase tracking-wider">Log Operasi SCADA</span>
                <span className="text-[10px] text-cyan-400">Real-Time</span>
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 space-y-2 max-h-56 overflow-y-auto font-mono text-[10px]">
                {operationLogs.map(log => (
                  <div key={log.id} className="border-b border-slate-900 pb-1.5 last:border-0">
                    <div className="text-slate-500">{log.time}</div>
                    <div className={log.type === 'SUCCESS' ? 'text-emerald-400 font-bold' : log.type === 'WARNING' ? 'text-red-400 font-bold' : 'text-slate-300'}>
                      {log.text}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

