import React, { useState, useMemo } from 'react';
import { 
  StationData, 
  FeederData, 
  FeederDevice, 
  calculateDeviceEnergization 
} from './MiniDccView';
import { CustomSldCanvasEditor } from './CustomSldCanvasEditor';
import { 
  Activity, 
  Zap, 
  ShieldAlert, 
  CheckCircle2, 
  Maximize2, 
  Minimize2, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Search, 
  Grid, 
  Layers, 
  Building2, 
  GitCommit, 
  Sliders, 
  Info, 
  ArrowRight,
  RefreshCw,
  Power,
  Edit3
} from 'lucide-react';

interface SystemWideSldWallboardProps {
  stations: StationData[];
  onSelectStation: (stationId: string) => void;
  onTogglePmt150kV: (stationId: string, trafoNum: 1 | 2) => void;
  onTogglePmt20kVIncomer: (stationId: string, trafoNum: 1 | 2) => void;
  onTogglePmtKopel: (stationId: string) => void;
  onToggleFeederPmt: (stationId: string, feederId: string) => void;
  onToggleDeviceStatus: (stationId: string, feederId: string, deviceId: string) => void;
  onInspectFeeder: (stationId: string, feederId: string) => void;
  onResetAllNormal: () => void;
  telemetryActive: boolean;
}

export const SystemWideSldWallboard: React.FC<SystemWideSldWallboardProps> = ({
  stations,
  onSelectStation,
  onTogglePmt150kV,
  onTogglePmt20kVIncomer,
  onTogglePmtKopel,
  onToggleFeederPmt,
  onToggleDeviceStatus,
  onInspectFeeder,
  onResetAllNormal,
  telemetryActive
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(90);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterType, setFilterType] = useState<'ALL' | 'GI' | 'GH'>('ALL');
  const [highlightTripOnly, setHighlightTripOnly] = useState<boolean>(false);
  const [layoutMode, setLayoutMode] = useState<'TOPOLOGY' | 'GRID' | 'CUSTOM_DRAW'>('TOPOLOGY');
  const [selectedFeederQuickView, setSelectedFeederQuickView] = useState<{ station: StationData; feeder: FeederData } | null>(null);

  // System Metrics Summary
  const systemMetrics = useMemo(() => {
    let totalMw = 0;
    let totalAmp = 0;
    let totalFeedersCount = 0;
    let trippedFeedersCount = 0;
    let totalTrafosCount = 0;
    let trippedTrafosCount = 0;

    stations.forEach(st => {
      // Trafo metrics
      if (st.type === 'GI') {
        totalTrafosCount += 2;
        if (st.trafo1.pmt150kVAStatus !== 'CLOSED' || st.trafo1.pmt20kVAStatus !== 'CLOSED') trippedTrafosCount++;
        if (st.trafo2.pmt150kVAStatus !== 'CLOSED' || st.trafo2.pmt20kVAStatus !== 'CLOSED') trippedTrafosCount++;
      }
      
      // Feeder metrics
      (st.feeders || []).forEach(f => {
        totalFeedersCount++;
        totalMw += f.powerMw || 0;
        totalAmp += f.currentA || 0;
        if (f.status !== 'CLOSED') trippedFeedersCount++;
      });
    });

    return {
      totalMw: totalMw.toFixed(1),
      totalAmp: Math.round(totalAmp),
      totalFeedersCount,
      trippedFeedersCount,
      totalTrafosCount,
      trippedTrafosCount,
      systemStatus: (trippedFeedersCount > 0 || trippedTrafosCount > 0) ? 'TRIP_ALERT' : 'NORMAL'
    };
  }, [stations]);

  // Filtered stations for display
  const filteredStations = useMemo(() => {
    return stations.filter(st => {
      if (filterType !== 'ALL' && st.type !== filterType) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchStation = st.name.toLowerCase().includes(q) || st.code.toLowerCase().includes(q);
        const matchFeeder = st.feeders.some(f => f.name.toLowerCase().includes(q) || f.code.toLowerCase().includes(q));
        if (!matchStation && !matchFeeder) return false;
      }
      if (highlightTripOnly) {
        const hasTrippedFeeder = st.feeders.some(f => f.status !== 'CLOSED');
        const hasTrippedTrafo = st.type === 'GI' && (st.trafo1.pmt150kVAStatus !== 'CLOSED' || st.trafo2.pmt150kVAStatus !== 'CLOSED');
        if (!hasTrippedFeeder && !hasTrippedTrafo) return false;
      }
      return true;
    });
  }, [stations, filterType, searchQuery, highlightTripOnly]);

  return (
    <div className="w-full flex flex-col items-center bg-[#050a14] rounded-2xl border border-cyan-500/30 overflow-hidden shadow-2xl">
      
      {/* 1. WALLBOARD HEADER DASHBOARD BANNER */}
      <div className="w-full bg-[#081224] border-b border-cyan-500/30 p-4 md:p-6 flex flex-col gap-4">
        
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Title & Badge */}
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-cyan-950 border border-cyan-400/50 text-cyan-300 shadow-[0_0_18px_rgba(6,182,212,0.4)]">
              <Zap className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base md:text-lg font-black text-white uppercase tracking-widest flex items-center gap-2">
                  <span>WALLBOARD MONITORING SINGLE LINE DIAGRAM (SLD) 1 LAYAR SEPARUH SISTEM</span>
                </h1>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase border animate-pulse ${
                  systemMetrics.systemStatus === 'NORMAL'
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-500/50'
                    : 'bg-rose-950 text-rose-300 border-rose-500/60 shadow-[0_0_12px_rgba(244,63,94,0.5)]'
                }`}>
                  {systemMetrics.systemStatus === 'NORMAL' ? '🟢 SISTEM NORMAL ENERGIZED' : `⚠️ ALARM TRIP (${systemMetrics.trippedFeedersCount} PENYULANG PADAM)`}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Monitoring terpadu seluruh Gardu Induk (GI), Gardu Hubung (GH), Trafo Interkoneksi, Busbar 20kV & Penyulang dalam 1 Tampilan SCADA Matrix.
              </p>
            </div>
          </div>

          {/* Quick Metrics Indicators */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="bg-[#0b182d] border border-cyan-500/30 rounded-xl px-3 py-1.5 text-center min-w-[100px]">
              <div className="text-[9px] font-bold text-slate-400 uppercase">BEBAN SYSTEM</div>
              <div className="text-sm font-black text-cyan-300">{systemMetrics.totalMw} MW</div>
            </div>

            <div className="bg-[#0b182d] border border-cyan-500/30 rounded-xl px-3 py-1.5 text-center min-w-[100px]">
              <div className="text-[9px] font-bold text-slate-400 uppercase">ARUS TOTAL</div>
              <div className="text-sm font-black text-emerald-400">{systemMetrics.totalAmp} A</div>
            </div>

            <div className="bg-[#0b182d] border border-cyan-500/30 rounded-xl px-3 py-1.5 text-center min-w-[110px]">
              <div className="text-[9px] font-bold text-slate-400 uppercase">FREKUENSI</div>
              <div className="text-sm font-black text-amber-300 flex items-center justify-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>50.00 Hz</span>
              </div>
            </div>

            <div className="bg-[#0b182d] border border-cyan-500/30 rounded-xl px-3 py-1.5 text-center min-w-[120px]">
              <div className="text-[9px] font-bold text-slate-400 uppercase">PENYULANG 20kV</div>
              <div className="text-sm font-black text-white">
                <span className="text-emerald-400">{systemMetrics.totalFeedersCount - systemMetrics.trippedFeedersCount}</span>
                <span className="text-slate-500"> / {systemMetrics.totalFeedersCount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls & Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
          
          {/* Search & Type Filter */}
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
            <div className="relative flex-1 max-w-xs">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari Gardu / Penyulang..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-[#030712] border border-cyan-500/40 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="flex items-center bg-[#030712] border border-slate-800 rounded-xl p-1 gap-1 text-xs font-bold">
              <button
                onClick={() => setFilterType('ALL')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  filterType === 'ALL' ? 'bg-cyan-600 text-white font-black shadow-md' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Semua Gardu ({stations.length})
              </button>
              <button
                onClick={() => setFilterType('GI')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  filterType === 'GI' ? 'bg-cyan-600 text-white font-black shadow-md' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                GI 150/20kV
              </button>
              <button
                onClick={() => setFilterType('GH')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  filterType === 'GH' ? 'bg-cyan-600 text-white font-black shadow-md' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                GH 20kV
              </button>
            </div>

            <button
              onClick={() => setHighlightTripOnly(!highlightTripOnly)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black border transition-all cursor-pointer flex items-center gap-1.5 ${
                highlightTripOnly
                  ? 'bg-rose-950 border-rose-500 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.4)]'
                  : 'bg-[#030712] border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              <span>Filter yang Padam/Trip</span>
            </button>
          </div>

          {/* Zoom & View Controls */}
          <div className="flex items-center gap-2">
            
            <div className="flex items-center bg-[#030712] border border-slate-800 rounded-xl p-1 gap-1">
              <button
                onClick={() => setLayoutMode('TOPOLOGY')}
                className={`px-3 py-1 rounded-lg text-xs font-black flex items-center gap-1 transition-all cursor-pointer ${
                  layoutMode === 'TOPOLOGY' ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                <GitCommit className="w-3.5 h-3.5" />
                <span>Interkoneksi Topology</span>
              </button>
              <button
                onClick={() => setLayoutMode('GRID')}
                className={`px-3 py-1 rounded-lg text-xs font-black flex items-center gap-1 transition-all cursor-pointer ${
                  layoutMode === 'GRID' ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Grid className="w-3.5 h-3.5" />
                <span>Grid Matriks</span>
              </button>
              <button
                onClick={() => setLayoutMode('CUSTOM_DRAW')}
                className={`px-3 py-1 rounded-lg text-xs font-black flex items-center gap-1 transition-all cursor-pointer ${
                  layoutMode === 'CUSTOM_DRAW' ? 'bg-amber-500 text-slate-950 shadow-[0_0_12px_rgba(245,158,11,0.4)]' : 'text-slate-400 hover:text-white'
                }`}
                title="Buka Editor Gambar Garis, Busbar, & Layout Kustom 1 Sistem Normal"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>🎨 Desain & Draw Layout</span>
              </button>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center bg-[#030712] border border-slate-800 rounded-xl px-2 py-1 text-xs gap-1.5">
              <button 
                onClick={() => setZoomLevel(Math.max(50, zoomLevel - 10))} 
                className="p-1 text-slate-400 hover:text-white font-black"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="font-black text-cyan-300 min-w-[36px] text-center">{zoomLevel}%</span>
              <button 
                onClick={() => setZoomLevel(Math.min(140, zoomLevel + 10))} 
                className="p-1 text-slate-400 hover:text-white font-black"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Reset All Breakers */}
            <button
              onClick={onResetAllNormal}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-amber-300 text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
              title="Reset Seluruh Breaker PMT & Switch di Seluruh Gardu ke NORMAL ENERGIZED"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Reset Normal</span>
            </button>
          </div>

        </div>

      </div>

      {/* 2. BACKBONE SUTT 150kV INTER-STATION NETWORK RING HEADER */}
      <div className="w-full bg-[#030712] border-b border-cyan-500/20 p-3 px-6 flex items-center justify-between text-[11px] font-mono text-rose-400 overflow-x-auto whitespace-nowrap">
        <div className="flex items-center gap-2 font-black">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
          <span>BACKBONE TRANSMISI HIGH VOLTAGE SUTT 150kV INTERKONEKSI:</span>
        </div>
        <div className="flex items-center gap-6 font-bold text-slate-300">
          <span className="flex items-center gap-1.5">
            <span className="text-rose-500 font-black">⚡ [SUTT 150kV PASSO-HATIVE]</span>
            <span className="w-16 h-[2px] bg-rose-500 inline-block animate-pulse" />
          </span>
          <span className="flex items-center gap-1.5">
            <span className="text-rose-500 font-black">⚡ [SUTT 150kV PASSO-POKA]</span>
            <span className="w-16 h-[2px] bg-rose-500 inline-block animate-pulse" />
          </span>
          <span className="flex items-center gap-1.5">
            <span className="text-amber-400 font-black">⚡ [20kV TIE-LINE PASSO F01 ➔ GH BAGUALA]</span>
            <span className="w-16 h-[2px] bg-amber-400 inline-block animate-pulse" />
          </span>
        </div>
      </div>

      {/* 3. CANVAS MATRIX SLD WORKSPACE */}
      <div className="w-full p-6 md:p-8 min-h-[650px] overflow-auto flex flex-col items-center justify-start bg-[#02050b] mini-dcc-grid relative">
        
        <div 
          className="w-full transition-transform duration-200 origin-top flex flex-col items-center gap-8"
          style={{ transform: `scale(${zoomLevel / 100})` }}
        >
          {layoutMode === 'CUSTOM_DRAW' ? (
            <div className="w-full">
              <CustomSldCanvasEditor stations={stations} />
            </div>
          ) : filteredStations.length === 0 ? (
            <div className="w-full bg-[#081224] border border-cyan-500/30 rounded-2xl p-12 text-center text-slate-400 font-bold">
              Tidak ada Gardu atau Penyulang yang sesuai dengan kata kunci pencarian.
            </div>
          ) : layoutMode === 'GRID' ? (
            /* GRID MATRIX LAYOUT */
            <div className="w-full grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredStations.map(station => (
                <StationSldCard
                  key={station.id}
                  station={station}
                  onSelectStation={onSelectStation}
                  onTogglePmt150kV={onTogglePmt150kV}
                  onTogglePmt20kVIncomer={onTogglePmt20kVIncomer}
                  onTogglePmtKopel={onTogglePmtKopel}
                  onToggleFeederPmt={onToggleFeederPmt}
                  onToggleDeviceStatus={onToggleDeviceStatus}
                  onInspectFeeder={(f) => setSelectedFeederQuickView({ station, feeder: f })}
                />
              ))}
            </div>
          ) : (
            /* TOPOLOGY INTERCONNECTED LAYOUT (MATCHING SCADA WALLBOARD DIAGRAM IMAGE) */
            <div className="w-full flex flex-col items-center gap-12">
              
              {/* TOP ROW: 150kV HIGH VOLTAGE TRANSMISSION BUS BAR */}
              <div className="w-full bg-[#081224]/80 border-2 border-rose-500/40 rounded-2xl p-4 shadow-[0_0_20px_rgba(244,63,94,0.2)]">
                <div className="flex items-center justify-between border-b border-rose-500/30 pb-2 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-rose-500 animate-pulse" />
                    <span className="text-xs font-black text-rose-400 uppercase tracking-wider">
                      BUS SYSTEM INTERKONEKSI HIGH VOLTAGE TRANSMISI 150kV (TEGANGAN TINGGI SISTEM AMBON-SUTT)
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-rose-300 bg-rose-950 px-2.5 py-0.5 rounded border border-rose-500/40">
                    VOLTAGE STATUS: 151.4 kV (STABIL)
                  </span>
                </div>

                {/* Bus Trunk Lines */}
                <div className="relative w-full h-4 bg-rose-950/60 rounded-full border border-rose-500 flex items-center justify-around px-8">
                  <div className="absolute inset-0 bg-rose-500/20 rounded-full animate-pulse" />
                  {filteredStations.map(st => (
                    <div key={st.id} className="flex flex-col items-center relative z-10">
                      <span className="text-[9px] font-black text-rose-300 bg-slate-950 px-2 py-0.5 rounded border border-rose-500/40">
                        {st.code} ({st.type})
                      </span>
                      <div className="w-[3px] h-6 bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.8)]" />
                    </div>
                  ))}
                </div>
              </div>

              {/* MIDDLE ROW: STATIONS SLD CARDS IN A MULTI-COL MATRIX */}
              <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                {filteredStations.map(station => (
                  <StationSldCard
                    key={station.id}
                    station={station}
                    onSelectStation={onSelectStation}
                    onTogglePmt150kV={onTogglePmt150kV}
                    onTogglePmt20kVIncomer={onTogglePmt20kVIncomer}
                    onTogglePmtKopel={onTogglePmtKopel}
                    onToggleFeederPmt={onToggleFeederPmt}
                    onToggleDeviceStatus={onToggleDeviceStatus}
                    onInspectFeeder={(f) => setSelectedFeederQuickView({ station, feeder: f })}
                  />
                ))}
              </div>

              {/* BOTTOM ROW: INTER-STATION 20kV TIE LINES FOOTER */}
              <div className="w-full bg-[#081224] border border-amber-500/40 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-2 text-amber-300 font-extrabold">
                  <GitCommit className="w-5 h-5 text-amber-400" />
                  <span>JALUR SUPLAY INTERKONEKSI KOPEL 20kV ANTAR GARDU:</span>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-[11px]">
                  <div className="flex items-center gap-2 bg-slate-900 border border-amber-500/30 px-3 py-1.5 rounded-xl">
                    <span className="text-slate-300 font-bold">GI PASSO (F-01)</span>
                    <ArrowRight className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                    <span className="text-amber-300 font-black">INCOMER GH BAGUALA (20kV DIRECT)</span>
                  </div>
                  <div className="flex items-center gap-2 bg-slate-900 border border-emerald-500/30 px-3 py-1.5 rounded-xl">
                    <span className="text-slate-300 font-bold">PLTD POKA (GEN-1/2)</span>
                    <ArrowRight className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                    <span className="text-emerald-300 font-black">INCOMER GI GANDUL / HATIVE</span>
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>

      </div>

      {/* 4. QUICK FEEDER INSPECTOR MODAL */}
      {selectedFeederQuickView && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#081224] border border-cyan-500/50 rounded-2xl p-6 w-full max-w-2xl shadow-2xl space-y-4 relative">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-500/40">
                  <GitCommit className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    INSPEKSI PENYULANG [{selectedFeederQuickView.feeder.code}] {selectedFeederQuickView.feeder.name}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Gardu: {selectedFeederQuickView.station.name} ({selectedFeederQuickView.station.type})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedFeederQuickView(null)}
                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-4 gap-3 bg-slate-900/80 p-3 rounded-xl border border-slate-800 text-center text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block">STATUS PMT</span>
                <span className={`font-black uppercase ${
                  selectedFeederQuickView.feeder.status === 'CLOSED' ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {selectedFeederQuickView.feeder.status}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">ARUS (AMP)</span>
                <span className="font-black text-cyan-300">{selectedFeederQuickView.feeder.currentA} A</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">BEBAN (MW)</span>
                <span className="font-black text-amber-300">{selectedFeederQuickView.feeder.powerMw} MW</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">COS PHI</span>
                <span className="font-black text-slate-200">{selectedFeederQuickView.feeder.cosPhi}</span>
              </div>
            </div>

            {/* Sub devices chain */}
            <div className="space-y-2">
              <h4 className="text-xs font-black text-cyan-400 uppercase tracking-wider">
                RANTAI PERALATAN JARINGAN (PANGKAL ➔ UJUNG):
              </h4>
              <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                {(selectedFeederQuickView.feeder.devices || []).map((dev, idx) => (
                  <div key={dev.id} className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-black text-white">#{idx+1} [{dev.type}] {dev.name} ({dev.code})</span>
                      <span className="text-[10px] text-slate-400 block">{dev.location}</span>
                    </div>
                    <button
                      onClick={() => onToggleDeviceStatus(selectedFeederQuickView.station.id, selectedFeederQuickView.feeder.id, dev.id)}
                      className={`px-3 py-1 rounded-lg text-xs font-black cursor-pointer ${
                        dev.status === 'CLOSED' ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-slate-950'
                      }`}
                    >
                      {dev.status === 'CLOSED' ? 'TRIP / BUKA' : 'TUTUP'}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => {
                  onSelectStation(selectedFeederQuickView.station.id);
                  onInspectFeeder(selectedFeederQuickView.station.id, selectedFeederQuickView.feeder.id);
                  setSelectedFeederQuickView(null);
                }}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-lg"
              >
                <span>Buka Detail Canvas Penyulang</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

/* INDIVIDUAL STATION SLD CARD (FOR WALLBOARD MATRIX) */
interface StationSldCardProps {
  station: StationData;
  onSelectStation: (stationId: string) => void;
  onTogglePmt150kV: (stationId: string, trafoNum: 1 | 2) => void;
  onTogglePmt20kVIncomer: (stationId: string, trafoNum: 1 | 2) => void;
  onTogglePmtKopel: (stationId: string) => void;
  onToggleFeederPmt: (stationId: string, feederId: string) => void;
  onToggleDeviceStatus: (stationId: string, feederId: string, deviceId: string) => void;
  onInspectFeeder: (feeder: FeederData) => void;
}

const StationSldCard: React.FC<StationSldCardProps> = ({
  station,
  onSelectStation,
  onTogglePmt150kV,
  onTogglePmt20kVIncomer,
  onTogglePmtKopel,
  onToggleFeederPmt,
  onInspectFeeder
}) => {
  const isGI = station.type === 'GI';
  const isT1Energized = isGI ? station.trafo1.pmt150kVAStatus === 'CLOSED' : true;
  const isT2Energized = isGI ? station.trafo2.pmt150kVAStatus === 'CLOSED' : true;

  const isBusAActive = isT1Energized && station.trafo1.pmt20kVAStatus === 'CLOSED';
  const isBusBActive = isT2Energized && station.trafo2.pmt20kVAStatus === 'CLOSED';

  return (
    <div className="w-full bg-[#070e1c] border border-cyan-500/30 hover:border-cyan-400/60 rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-xl transition-all">
      
      {/* Station Title Banner */}
      <div className="flex items-center justify-between border-b border-cyan-950 pb-3">
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-xl border text-xs font-black ${
            isGI ? 'bg-rose-950/80 border-rose-500/50 text-rose-300' : 'bg-cyan-950/80 border-cyan-500/50 text-cyan-300'
          }`}>
            {station.type}
          </div>
          <div>
            <h3 className="text-sm font-black text-white tracking-wide uppercase flex items-center gap-2">
              <span>{station.name}</span>
              <span className="text-[10px] text-cyan-400 font-bold">({station.code})</span>
            </h3>
            <span className="text-[10px] text-slate-400 block">
              {isGI ? '150kV SUTT Substation ➔ 20kV Distribution' : '20kV Distribution Switchyard'}
            </span>
          </div>
        </div>

        <button
          onClick={() => onSelectStation(station.id)}
          className="px-3 py-1 rounded-lg bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 text-[10px] font-black transition-all cursor-pointer"
        >
          Buka Gardu ➔
        </button>
      </div>

      {/* Trafo & Incomer Row */}
      <div className="grid grid-cols-2 gap-4 bg-[#030712] p-3 rounded-xl border border-slate-800">
        
        {/* TRAFO 1 / INCOMER 1 */}
        <div className="flex flex-col items-center text-center space-y-1">
          {isGI && (
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-[9px] font-bold text-rose-400">PMT 150kV:</span>
              <button
                onClick={() => onTogglePmt150kV(station.id, 1)}
                className={`w-6 h-6 rounded text-[9px] font-black cursor-pointer ${
                  station.trafo1.pmt150kVAStatus === 'CLOSED' ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {station.trafo1.pmt150kVAStatus === 'CLOSED' ? 'C' : 'O'}
              </button>
            </div>
          )}

          <div className="text-[10px] font-black text-slate-200">{station.trafo1.name}</div>
          <div className="text-[9px] font-extrabold text-cyan-400">{station.trafo1.powerMw} MW ({station.trafo1.loadPercent}%)</div>

          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-[9px] font-bold text-cyan-400">INC-1 20kV:</span>
            <button
              onClick={() => onTogglePmt20kVIncomer(station.id, 1)}
              className={`w-6 h-6 rounded text-[9px] font-black cursor-pointer ${
                station.trafo1.pmt20kVAStatus === 'CLOSED' ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {station.trafo1.pmt20kVAStatus === 'CLOSED' ? 'C' : 'O'}
            </button>
          </div>
        </div>

        {/* TRAFO 2 / INCOMER 2 */}
        <div className="flex flex-col items-center text-center space-y-1">
          {isGI && (
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-[9px] font-bold text-rose-400">PMT 150kV:</span>
              <button
                onClick={() => onTogglePmt150kV(station.id, 2)}
                className={`w-6 h-6 rounded text-[9px] font-black cursor-pointer ${
                  station.trafo2.pmt150kVAStatus === 'CLOSED' ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {station.trafo2.pmt150kVAStatus === 'CLOSED' ? 'C' : 'O'}
              </button>
            </div>
          )}

          <div className="text-[10px] font-black text-slate-200">{station.trafo2.name}</div>
          <div className="text-[9px] font-extrabold text-cyan-400">{station.trafo2.powerMw} MW ({station.trafo2.loadPercent}%)</div>

          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-[9px] font-bold text-cyan-400">INC-2 20kV:</span>
            <button
              onClick={() => onTogglePmt20kVIncomer(station.id, 2)}
              className={`w-6 h-6 rounded text-[9px] font-black cursor-pointer ${
                station.trafo2.pmt20kVAStatus === 'CLOSED' ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {station.trafo2.pmt20kVAStatus === 'CLOSED' ? 'C' : 'O'}
            </button>
          </div>
        </div>

      </div>

      {/* 20kV Busbars Header & PMT Kopel */}
      <div className="flex items-center justify-between bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 text-[10px]">
        <div className="flex items-center gap-2 font-bold">
          <span className={`w-2 h-2 rounded-full ${isBusAActive ? 'bg-emerald-400' : 'bg-rose-500'}`} />
          <span className="text-slate-300">BUS 20kV A ({station.busbars[0]?.voltageKv || 20.1}kV)</span>
        </div>

        <button
          onClick={() => onTogglePmtKopel(station.id)}
          className={`px-2 py-0.5 rounded text-[9px] font-black flex items-center gap-1 cursor-pointer ${
            station.pmtKopelStatus === 'CLOSED' ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-400'
          }`}
        >
          <span>KOPEL:</span>
          <span>{station.pmtKopelStatus === 'CLOSED' ? 'C (TUTUP)' : 'O (BUKA)'}</span>
        </button>

        <div className="flex items-center gap-2 font-bold">
          <span className="text-slate-300">BUS 20kV B ({station.busbars[1]?.voltageKv || 20.1}kV)</span>
          <span className={`w-2 h-2 rounded-full ${isBusBActive ? 'bg-emerald-400' : 'bg-rose-500'}`} />
        </div>
      </div>

      {/* Feeders List */}
      <div className="space-y-2">
        <span className="text-[10px] font-black text-cyan-400 uppercase tracking-wider block">
          DAFTAR PENYULANG 20kV ({station.feeders.length}):
        </span>

        <div className="grid grid-cols-1 gap-1.5 max-h-48 overflow-y-auto pr-1">
          {station.feeders.map(f => {
            const isClosed = f.status === 'CLOSED';

            return (
              <div
                key={f.id}
                className={`p-2 rounded-lg border flex items-center justify-between text-[11px] transition-all ${
                  isClosed
                    ? 'bg-slate-900/90 border-cyan-500/30 text-white'
                    : 'bg-rose-950/40 border-rose-500/50 text-rose-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onToggleFeederPmt(station.id, f.id)}
                    className={`w-5 h-5 rounded text-[9px] font-black flex items-center justify-center cursor-pointer ${
                      isClosed ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                    title="Toggle PMT Outgoing Penyulang"
                  >
                    {isClosed ? 'C' : 'O'}
                  </button>
                  <div>
                    <span className="font-extrabold text-cyan-300">[{f.code}]</span>{' '}
                    <span className="font-bold">{f.name}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-mono text-cyan-400">{f.currentA}A • {f.powerMw}MW</span>
                  <button
                    onClick={() => onInspectFeeder(f)}
                    className="p-1 rounded bg-slate-800 hover:bg-cyan-950 text-slate-300 hover:text-cyan-300 text-[9px] font-bold"
                  >
                    Detail 🔍
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
