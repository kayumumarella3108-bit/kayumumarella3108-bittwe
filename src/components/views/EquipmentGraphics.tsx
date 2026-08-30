import React from 'react';
import { DeviceType } from './MiniDccView';

interface GraphicProps {
  status: 'CLOSED' | 'TRIP' | 'OPEN';
  isEnergized: boolean;
  code: string;
  name: string;
  location: string;
  relayProtection?: string;
}

// 1. INCOMER (Kubikel 20kV Substation Panel)
export const IncomerGraphic: React.FC<GraphicProps> = ({ status, isEnergized, code, name }) => {
  const isClosed = status === 'CLOSED';
  return (
    <div className="flex flex-col items-center">
      {/* Top 20kV Bus Connection point */}
      <div className={`w-3.5 h-3.5 rounded-full border-2 transition-all ${
        isEnergized 
          ? 'border-cyan-300 bg-cyan-400 shadow-[0_0_10px_rgba(0,242,255,1)]' 
          : 'border-slate-700 bg-slate-800'
      }`} />
      <div className={`w-1 h-4 transition-all ${isEnergized ? 'bg-cyan-400 glow-line-cyan' : 'bg-slate-700'}`} />

      {/* Main Metal-Clad Cubicle Box */}
      <div className={`w-44 rounded-xl border-2 p-2.5 flex flex-col items-center gap-2 transition-all shadow-xl ${
        isClosed && isEnergized
          ? 'bg-[#08192d] border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.35)]'
          : isClosed
          ? 'bg-[#101726] border-slate-700'
          : 'bg-[#220c15] border-rose-500/80 shadow-[0_0_15px_rgba(239,68,68,0.3)]'
      }`}>
        {/* Panel Header */}
        <div className="w-full flex items-center justify-between border-b border-slate-800/90 pb-1 font-mono">
          <span className="text-[9px] font-black text-cyan-300 uppercase tracking-widest flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            PMT INCOMING
          </span>
          <span className="px-1.5 py-0.2 rounded text-[8px] font-black bg-cyan-950 text-cyan-400 border border-cyan-800">
            INC
          </span>
        </div>

        {/* Digital Meter Screen */}
        <div className="w-full bg-slate-950 rounded-lg border border-cyan-900/80 p-1.5 font-mono text-[9px] flex items-center justify-between shadow-inner">
          <div className="flex flex-col text-left">
            <span className="text-slate-500 text-[7.5px] uppercase">VOLTAGE 20kV</span>
            <span className={isEnergized ? "text-cyan-300 font-black" : "text-slate-600"}>
              {isEnergized ? "20.15 kV" : "0.00 kV"}
            </span>
          </div>
          <div className="text-right">
            <span className={`px-1.5 py-0.5 rounded text-[8px] font-black ${
              isEnergized ? "bg-emerald-950 text-emerald-400 border border-emerald-500/50" : "bg-rose-950 text-rose-400 border border-rose-500/50"
            }`}>
              {isEnergized ? "ENERGIZED" : "OFF"}
            </span>
          </div>
        </div>

        {/* Vacuum Breaker Trolley Symbol */}
        <div className="flex flex-col items-center my-1 relative">
          <div className={`w-0.5 h-2 ${isEnergized ? 'bg-cyan-400' : 'bg-slate-700'}`} />
          
          {/* Breaker Square */}
          <div className={`w-9 h-9 rounded-lg border-2 flex items-center justify-center font-black text-sm shadow-md transition-all ${
            isClosed
              ? 'bg-rose-600 text-white border-rose-300 shadow-[0_0_12px_rgba(239,68,68,0.7)]'
              : 'bg-emerald-600 text-slate-950 border-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.7)]'
          }`}>
            {isClosed ? 'C' : 'O'}
          </div>

          <div className={`w-0.5 h-2 ${isClosed && isEnergized ? 'bg-cyan-400' : 'bg-slate-700'}`} />
        </div>

        {/* Code & Name */}
        <div className="text-center w-full">
          <div className="text-[11px] font-black text-slate-100">{code}</div>
          <div className="text-[8.5px] font-bold text-slate-400 truncate">{name}</div>
        </div>
      </div>

      <div className={`w-1 h-4 transition-all ${isClosed && isEnergized ? 'bg-cyan-400 glow-line-cyan' : 'bg-slate-700'}`} />
      <div className={`w-3.5 h-3.5 rounded-full border-2 transition-all ${
        isClosed && isEnergized 
          ? 'border-cyan-300 bg-cyan-400 shadow-[0_0_10px_rgba(0,242,255,1)]' 
          : 'border-slate-700 bg-slate-800'
      }`} />
    </div>
  );
};

// 2. OUTGOING (Substation PMT Outgoing Breaker)
export const OutgoingGraphic: React.FC<GraphicProps> = ({ status, isEnergized, code, name }) => {
  const isClosed = status === 'CLOSED';
  return (
    <div className="flex flex-col items-center">
      <div className={`w-3.5 h-3.5 rounded-full border-2 transition-all ${
        isEnergized 
          ? 'border-cyan-300 bg-cyan-400 shadow-[0_0_10px_rgba(0,242,255,1)]' 
          : 'border-slate-700 bg-slate-800'
      }`} />
      <div className={`w-1 h-4 transition-all ${isEnergized ? 'bg-cyan-400 glow-line-cyan' : 'bg-slate-700'}`} />

      {/* Outgoing PMT Panel Box */}
      <div className={`w-44 rounded-xl border-2 p-2.5 flex flex-col items-center gap-2 transition-all shadow-xl ${
        isClosed && isEnergized
          ? 'bg-[#091729] border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.35)]'
          : isClosed
          ? 'bg-[#101726] border-slate-700'
          : 'bg-[#220c15] border-rose-500/80 shadow-[0_0_15px_rgba(239,68,68,0.3)]'
      }`}>
        <div className="w-full flex items-center justify-between border-b border-slate-800/90 pb-1 font-mono">
          <span className="text-[9px] font-black text-rose-400 uppercase tracking-widest">
            PMT OUTGOING
          </span>
          <span className="px-1.5 py-0.2 rounded text-[8px] font-black bg-rose-950 text-rose-300 border border-rose-800">
            BAY 20kV
          </span>
        </div>

        {/* Protection & Spring Indicators */}
        <div className="w-full grid grid-cols-2 gap-1 text-[7.5px] font-mono">
          <div className="bg-slate-950 p-1 rounded border border-slate-800 flex items-center justify-between">
            <span className="text-slate-500">SPRING:</span>
            <span className="text-emerald-400 font-bold">CHARGED</span>
          </div>
          <div className="bg-slate-950 p-1 rounded border border-slate-800 flex items-center justify-between">
            <span className="text-slate-500">RELAY:</span>
            <span className="text-cyan-300 font-bold">OCR/GFR</span>
          </div>
        </div>

        {/* Circuit Breaker Switch Box */}
        <div className="flex flex-col items-center my-1 relative">
          <div className={`w-0.5 h-2 ${isEnergized ? 'bg-cyan-400' : 'bg-slate-700'}`} />

          <div className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center font-black text-base shadow-md transition-all ${
            isClosed
              ? 'bg-rose-600 text-white border-rose-300 shadow-[0_0_15px_rgba(239,68,68,0.8)]'
              : 'bg-emerald-600 text-slate-950 border-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.8)]'
          }`}>
            {isClosed ? 'C' : 'O'}
          </div>

          <div className={`w-0.5 h-2 ${isClosed && isEnergized ? 'bg-cyan-400' : 'bg-slate-700'}`} />
        </div>

        <div className="text-center w-full">
          <div className="text-[11px] font-black text-slate-100">{code}</div>
          <div className="text-[8.5px] font-bold text-slate-400 truncate">{name}</div>
        </div>
      </div>

      <div className={`w-1 h-4 transition-all ${isClosed && isEnergized ? 'bg-cyan-400 glow-line-cyan' : 'bg-slate-700'}`} />
      <div className={`w-3.5 h-3.5 rounded-full border-2 transition-all ${
        isClosed && isEnergized 
          ? 'border-cyan-300 bg-cyan-400 shadow-[0_0_10px_rgba(0,242,255,1)]' 
          : 'border-slate-700 bg-slate-800'
      }`} />
    </div>
  );
};

// 3. RECLOSER / ACR (Pole-Mounted Automatic Circuit Recloser)
export const RecloserGraphic: React.FC<GraphicProps> = ({ status, isEnergized, code, name, relayProtection }) => {
  const isClosed = status === 'CLOSED';
  return (
    <div className="flex flex-col items-center">
      {/* Pole Top Bushings */}
      <div className="flex items-center gap-2 mb-0.5">
        <div className={`w-2 h-2 rounded-full border ${isEnergized ? 'bg-cyan-400 border-cyan-200 shadow-[0_0_6px_rgba(0,242,255,1)]' : 'bg-slate-700 border-slate-600'}`} />
        <div className={`w-2.5 h-2.5 rounded-full border-2 ${isEnergized ? 'bg-cyan-300 border-white shadow-[0_0_8px_rgba(0,242,255,1)]' : 'bg-slate-700 border-slate-600'}`} />
        <div className={`w-2 h-2 rounded-full border ${isEnergized ? 'bg-cyan-400 border-cyan-200 shadow-[0_0_6px_rgba(0,242,255,1)]' : 'bg-slate-700 border-slate-600'}`} />
      </div>

      <div className={`w-1 h-3 ${isEnergized ? 'bg-cyan-400 glow-line-cyan' : 'bg-slate-700'}`} />

      {/* Recloser Tank & Crossarm Graphic Card */}
      <div className={`w-44 rounded-xl border-2 p-2.5 flex flex-col items-center gap-2 transition-all shadow-2xl relative ${
        isClosed && isEnergized
          ? 'bg-[#08182b] border-amber-400/90 shadow-[0_0_20px_rgba(245,158,11,0.35)]'
          : isClosed
          ? 'bg-[#101726] border-slate-700'
          : 'bg-[#240c15] border-rose-500/90 shadow-[0_0_18px_rgba(239,68,68,0.4)] animate-pulse'
      }`}>
        
        {/* Recloser Header Badge */}
        <div className="w-full flex items-center justify-between border-b border-slate-800 pb-1 font-mono">
          <span className="text-[9px] font-black text-amber-300 uppercase tracking-widest flex items-center gap-1">
            ⚡ RECLOSER (ACR)
          </span>
          <span className="px-1.5 py-0.2 rounded text-[7.5px] font-black bg-amber-950 text-amber-300 border border-amber-800">
            AUTO-RECLOSE
          </span>
        </div>

        {/* Outdoor Pole Controller Cabinet Mockup */}
        <div className="w-full bg-slate-950 rounded-lg p-2 border border-amber-900/50 flex flex-col gap-1 text-[8px] font-mono">
          <div className="flex justify-between items-center text-slate-400 border-b border-slate-900 pb-1">
            <span>CONTROLLER:</span>
            <span className="text-amber-300 font-extrabold">SEL-651R</span>
          </div>

          <div className="flex justify-between items-center">
            <span>SEQUENCE:</span>
            <div className="flex gap-1">
              <span className={`w-2 h-2 rounded-full ${isClosed ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,1)]' : 'bg-slate-800'}`} title="Fast Shot 1" />
              <span className={`w-2 h-2 rounded-full ${isClosed ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,1)]' : 'bg-slate-800'}`} title="Delayed Shot 2" />
              <span className={`w-2 h-2 rounded-full ${!isClosed ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,1)] animate-ping' : 'bg-slate-800'}`} title="Lockout Trip" />
            </div>
          </div>
        </div>

        {/* Switch Button */}
        <div className="flex flex-col items-center relative my-0.5">
          <div className={`w-0.5 h-2 ${isEnergized ? 'bg-cyan-400' : 'bg-slate-700'}`} />

          <div className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center font-black text-base shadow-lg transition-all ${
            isClosed
              ? 'bg-rose-600 text-white border-rose-300 shadow-[0_0_15px_rgba(239,68,68,0.8)]'
              : 'bg-emerald-600 text-slate-950 border-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.8)]'
          }`}>
            {isClosed ? 'C' : 'O'}
          </div>

          <div className={`w-0.5 h-2 ${isClosed && isEnergized ? 'bg-cyan-400' : 'bg-slate-700'}`} />
        </div>

        <div className="text-center w-full">
          <div className="text-[11px] font-black text-slate-100">{code}</div>
          <div className="text-[8.5px] font-bold text-slate-400 truncate">{name}</div>
        </div>

      </div>

      <div className={`w-1 h-3 ${isClosed && isEnergized ? 'bg-cyan-400 glow-line-cyan' : 'bg-slate-700'}`} />
      <div className={`w-3.5 h-3.5 rounded-full border-2 transition-all ${
        isClosed && isEnergized 
          ? 'border-cyan-300 bg-cyan-400 shadow-[0_0_10px_rgba(0,242,255,1)]' 
          : 'border-slate-700 bg-slate-800'
      }`} />
    </div>
  );
};

// 4. LBS (Load Break Switch - Motorized / Manual Knife Switch)
export const LbsGraphic: React.FC<GraphicProps> = ({ status, isEnergized, code, name }) => {
  const isClosed = status === 'CLOSED';
  return (
    <div className="flex flex-col items-center">
      <div className={`w-3.5 h-3.5 rounded-full border-2 transition-all ${
        isEnergized 
          ? 'border-cyan-300 bg-cyan-400 shadow-[0_0_10px_rgba(0,242,255,1)]' 
          : 'border-slate-700 bg-slate-800'
      }`} />
      <div className={`w-1 h-3 ${isEnergized ? 'bg-cyan-400 glow-line-cyan' : 'bg-slate-700'}`} />

      {/* LBS Knife Switch Graphic Box */}
      <div className={`w-44 rounded-xl border-2 p-2.5 flex flex-col items-center gap-2 transition-all shadow-2xl ${
        isClosed && isEnergized
          ? 'bg-[#081729] border-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.35)]'
          : isClosed
          ? 'bg-[#101726] border-slate-700'
          : 'bg-[#220e17] border-rose-500/80 shadow-[0_0_15px_rgba(239,68,68,0.35)]'
      }`}>
        
        <div className="w-full flex items-center justify-between border-b border-slate-800 pb-1 font-mono">
          <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-1">
            ⚙ LBS MOTORIZED
          </span>
          <span className="px-1.5 py-0.2 rounded text-[7.5px] font-black bg-blue-950 text-blue-300 border border-blue-800">
            SECTION
          </span>
        </div>

        {/* Realistic Knife Switch Contact Blade Illustration */}
        <div className="w-full bg-slate-950 rounded-lg p-2 border border-blue-900/50 flex flex-col items-center justify-center">
          <svg className="w-24 h-10" viewBox="0 0 100 40">
            {/* Terminal Left */}
            <circle cx="15" cy="20" r="4" fill={isEnergized ? "#00f2ff" : "#475569"} />
            
            {/* Knife Blade */}
            {isClosed ? (
              <line x1="15" y1="20" x2="85" y2="20" stroke={isEnergized ? "#00f2ff" : "#3b82f6"} strokeWidth="4" strokeLinecap="round" />
            ) : (
              <g>
                {/* Open Blade angled at 40 degrees */}
                <line x1="15" y1="20" x2="65" y2="5" stroke="#ef4444" strokeWidth="4" strokeLinecap="round" />
                {/* Air Gap Spark arc */}
                <text x="50" y="28" fill="#ef4444" fontSize="10" fontWeight="bold" textAnchor="middle">GAP OPEN</text>
              </g>
            )}

            {/* Terminal Right */}
            <circle cx="85" cy="20" r="4" fill={isClosed && isEnergized ? "#00f2ff" : "#475569"} />
          </svg>
        </div>

        {/* Switch Control Button */}
        <div className="flex flex-col items-center my-0.5">
          <div className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center font-black text-base shadow-lg transition-all ${
            isClosed
              ? 'bg-rose-600 text-white border-rose-300 shadow-[0_0_15px_rgba(239,68,68,0.8)]'
              : 'bg-emerald-600 text-slate-950 border-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.8)]'
          }`}>
            {isClosed ? 'C' : 'O'}
          </div>
        </div>

        <div className="text-center w-full">
          <div className="text-[11px] font-black text-slate-100">{code}</div>
          <div className="text-[8.5px] font-bold text-slate-400 truncate">{name}</div>
        </div>

      </div>

      <div className={`w-1 h-3 ${isClosed && isEnergized ? 'bg-cyan-400 glow-line-cyan' : 'bg-slate-700'}`} />
      <div className={`w-3.5 h-3.5 rounded-full border-2 transition-all ${
        isClosed && isEnergized 
          ? 'border-cyan-300 bg-cyan-400 shadow-[0_0_10px_rgba(0,242,255,1)]' 
          : 'border-slate-700 bg-slate-800'
      }`} />
    </div>
  );
};

// 5. PMCB (Pole Mounted Circuit Breaker)
export const PmcbGraphic: React.FC<GraphicProps> = ({ status, isEnergized, code, name }) => {
  const isClosed = status === 'CLOSED';
  return (
    <div className="flex flex-col items-center">
      <div className={`w-3.5 h-3.5 rounded-full border-2 transition-all ${
        isEnergized 
          ? 'border-cyan-300 bg-cyan-400 shadow-[0_0_10px_rgba(0,242,255,1)]' 
          : 'border-slate-700 bg-slate-800'
      }`} />
      <div className={`w-1 h-3 ${isEnergized ? 'bg-cyan-400 glow-line-cyan' : 'bg-slate-700'}`} />

      {/* PMCB Box */}
      <div className={`w-44 rounded-xl border-2 p-2.5 flex flex-col items-center gap-2 transition-all shadow-2xl ${
        isClosed && isEnergized
          ? 'bg-[#0f1228] border-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.35)]'
          : isClosed
          ? 'bg-[#101726] border-slate-700'
          : 'bg-[#220e17] border-rose-500/80 shadow-[0_0_15px_rgba(239,68,68,0.35)]'
      }`}>
        
        <div className="w-full flex items-center justify-between border-b border-slate-800 pb-1 font-mono">
          <span className="text-[9px] font-black text-purple-300 uppercase tracking-widest flex items-center gap-1">
            🛡 PMCB BREAKER
          </span>
          <span className="px-1.5 py-0.2 rounded text-[7.5px] font-black bg-purple-950 text-purple-300 border border-purple-800">
            SF6 / VAC
          </span>
        </div>

        {/* SF6 Gas Pressure Gauge Mockup */}
        <div className="w-full bg-slate-950 rounded-lg p-1.5 border border-purple-900/50 flex items-center justify-between text-[8px] font-mono">
          <span className="text-slate-400">SF6 PRESSURE:</span>
          <span className="text-emerald-400 font-extrabold">6.2 BAR (OK)</span>
        </div>

        {/* Breaker Switch Button */}
        <div className="flex flex-col items-center my-0.5">
          <div className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center font-black text-base shadow-lg transition-all ${
            isClosed
              ? 'bg-rose-600 text-white border-rose-300 shadow-[0_0_15px_rgba(239,68,68,0.8)]'
              : 'bg-emerald-600 text-slate-950 border-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.8)]'
          }`}>
            {isClosed ? 'C' : 'O'}
          </div>
        </div>

        <div className="text-center w-full">
          <div className="text-[11px] font-black text-slate-100">{code}</div>
          <div className="text-[8.5px] font-bold text-slate-400 truncate">{name}</div>
        </div>

      </div>

      <div className={`w-1 h-3 ${isClosed && isEnergized ? 'bg-cyan-400 glow-line-cyan' : 'bg-slate-700'}`} />
      <div className={`w-3.5 h-3.5 rounded-full border-2 transition-all ${
        isClosed && isEnergized 
          ? 'border-cyan-300 bg-cyan-400 shadow-[0_0_10px_rgba(0,242,255,1)]' 
          : 'border-slate-700 bg-slate-800'
      }`} />
    </div>
  );
};

// 6. FCO (Fuse Cut Out - Drop-Out Fuse Link Assembly)
export const FcoGraphic: React.FC<GraphicProps> = ({ status, isEnergized, code, name, relayProtection }) => {
  const isClosed = status === 'CLOSED';
  return (
    <div className="flex flex-col items-center">
      <div className={`w-3.5 h-3.5 rounded-full border-2 transition-all ${
        isEnergized 
          ? 'border-cyan-300 bg-cyan-400 shadow-[0_0_10px_rgba(0,242,255,1)]' 
          : 'border-slate-700 bg-slate-800'
      }`} />
      <div className={`w-1 h-3 ${isEnergized ? 'bg-cyan-400 glow-line-cyan' : 'bg-slate-700'}`} />

      {/* FCO Assembly Card */}
      <div className={`w-44 rounded-xl border-2 p-2.5 flex flex-col items-center gap-2 transition-all shadow-2xl ${
        isClosed && isEnergized
          ? 'bg-[#081a18] border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.35)]'
          : isClosed
          ? 'bg-[#101726] border-slate-700'
          : 'bg-[#260e14] border-rose-500/90 shadow-[0_0_18px_rgba(239,68,68,0.4)] animate-pulse'
      }`}>
        
        <div className="w-full flex items-center justify-between border-b border-slate-800 pb-1 font-mono">
          <span className="text-[9px] font-black text-emerald-300 uppercase tracking-widest flex items-center gap-1">
            🔥 FUSE CUT OUT
          </span>
          <span className="px-1.5 py-0.2 rounded text-[7.5px] font-black bg-emerald-950 text-emerald-300 border border-emerald-800">
            FCO 50A
          </span>
        </div>

        {/* Drop-Out Fuse Link Visual SVG */}
        <div className="w-full bg-slate-950 rounded-lg p-2 border border-emerald-900/50 flex flex-col items-center justify-center">
          <svg className="w-24 h-12" viewBox="0 0 100 50">
            {/* Porcelain Insulator Body */}
            <rect x="42" y="5" width="16" height="40" rx="3" fill="#334155" stroke="#64748b" strokeWidth="1.5" />
            <circle cx="50" cy="12" r="3" fill="#94a3b8" />
            <circle cx="50" cy="25" r="3" fill="#94a3b8" />
            <circle cx="50" cy="38" r="3" fill="#94a3b8" />

            {/* Fuse Tube Barrel */}
            {isClosed ? (
              // Engaged vertically in top contacts
              <line x1="50" y1="5" x2="50" y2="45" stroke={isEnergized ? "#10b981" : "#059669"} strokeWidth="5" strokeLinecap="round" />
            ) : (
              // Dropped out at 45 degree angle
              <g>
                <line x1="50" y1="45" x2="80" y2="20" stroke="#f43f5e" strokeWidth="5" strokeLinecap="round" />
                <circle cx="80" cy="20" r="4" fill="#f43f5e" />
                <text x="25" y="28" fill="#f43f5e" fontSize="9" fontWeight="extrabold">LEBUR / DROP</text>
              </g>
            )}
          </svg>
        </div>

        {/* Switch Control Button */}
        <div className="flex flex-col items-center my-0.5">
          <div className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center font-black text-base shadow-lg transition-all ${
            isClosed
              ? 'bg-rose-600 text-white border-rose-300 shadow-[0_0_15px_rgba(239,68,68,0.8)]'
              : 'bg-emerald-600 text-slate-950 border-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.8)]'
          }`}>
            {isClosed ? 'C' : 'O'}
          </div>
        </div>

        <div className="text-center w-full">
          <div className="text-[11px] font-black text-slate-100">{code}</div>
          <div className="text-[8.5px] font-bold text-slate-400 truncate">{name}</div>
        </div>

      </div>

      <div className={`w-1 h-3 ${isClosed && isEnergized ? 'bg-cyan-400 glow-line-cyan' : 'bg-slate-700'}`} />
      <div className={`w-3.5 h-3.5 rounded-full border-2 transition-all ${
        isClosed && isEnergized 
          ? 'border-cyan-300 bg-cyan-400 shadow-[0_0_10px_rgba(0,242,255,1)]' 
          : 'border-slate-700 bg-slate-800'
      }`} />
    </div>
  );
};

// 7. COUPLING / KOPEL (LBS Tie-Switch Interconnect Ujung Jaringan)
export const CouplingGraphic: React.FC<GraphicProps> = ({ status, isEnergized, code, name }) => {
  const isClosed = status === 'CLOSED';
  return (
    <div className="flex flex-col items-center">
      <div className={`w-3.5 h-3.5 rounded-full border-2 transition-all ${
        isEnergized 
          ? 'border-cyan-300 bg-cyan-400 shadow-[0_0_10px_rgba(0,242,255,1)]' 
          : 'border-slate-700 bg-slate-800'
      }`} />
      <div className={`w-1 h-3 ${isEnergized ? 'bg-cyan-400 glow-line-cyan' : 'bg-slate-700'}`} />

      {/* Tie-Switch Coupling Card */}
      <div className={`w-44 rounded-xl border-2 p-2.5 flex flex-col items-center gap-2 transition-all shadow-2xl ${
        isClosed
          ? 'bg-[#180e22] border-indigo-400 shadow-[0_0_20px_rgba(129,140,248,0.35)]'
          : 'bg-[#0f1422] border-indigo-900/80'
      }`}>
        
        <div className="w-full flex items-center justify-between border-b border-slate-800 pb-1 font-mono">
          <span className="text-[9px] font-black text-indigo-300 uppercase tracking-widest flex items-center gap-1">
            🔗 LBS KOPEL
          </span>
          <span className="px-1.5 py-0.2 rounded text-[7.5px] font-black bg-indigo-950 text-indigo-300 border border-indigo-800">
            INTERKONEKSI
          </span>
        </div>

        {/* Dual Feeder Busbar Connector Visual */}
        <div className="w-full bg-slate-950 rounded-lg p-2 border border-indigo-900/50 flex items-center justify-between text-[8px] font-mono">
          <span className="text-slate-400">TIE STATUS:</span>
          <span className={isClosed ? "text-indigo-300 font-black animate-pulse" : "text-slate-500 font-bold"}>
            {isClosed ? "CONNECTED" : "OPEN / TIE OFF"}
          </span>
        </div>

        {/* Switch Button */}
        <div className="flex flex-col items-center my-0.5">
          <div className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center font-black text-base shadow-lg transition-all ${
            isClosed
              ? 'bg-emerald-600 text-slate-950 border-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.8)]'
              : 'bg-slate-800 text-slate-400 border-slate-700'
          }`}>
            {isClosed ? 'C' : 'O'}
          </div>
        </div>

        <div className="text-center w-full">
          <div className="text-[11px] font-black text-slate-100">{code}</div>
          <div className="text-[8.5px] font-bold text-slate-400 truncate">{name}</div>
        </div>

      </div>

      <div className={`w-1 h-3 ${isClosed ? 'bg-indigo-400' : 'bg-slate-700'}`} />
      <div className={`w-3.5 h-3.5 rounded-full border-2 transition-all ${
        isClosed 
          ? 'border-indigo-300 bg-indigo-400 shadow-[0_0_10px_rgba(129,140,248,1)]' 
          : 'border-slate-700 bg-slate-800'
      }`} />
    </div>
  );
};

// 8. DS (Disconnecting Switch / Pemisah Sakelar Udara)
export const DsGraphic: React.FC<GraphicProps> = ({ status, isEnergized, code, name }) => {
  const isClosed = status === 'CLOSED';
  return (
    <div className="flex flex-col items-center">
      <div className={`w-3.5 h-3.5 rounded-full border-2 transition-all ${
        isEnergized 
          ? 'border-amber-300 bg-amber-400 shadow-[0_0_10px_rgba(245,158,11,1)]' 
          : 'border-slate-700 bg-slate-800'
      }`} />
      <div className={`w-1 h-3 ${isEnergized ? 'bg-amber-400 glow-line-cyan' : 'bg-slate-700'}`} />

      {/* DS Isolator Card */}
      <div className={`w-44 rounded-xl border-2 p-2.5 flex flex-col items-center gap-2 transition-all shadow-2xl ${
        isClosed && isEnergized
          ? 'bg-[#1a1208] border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.35)]'
          : isClosed
          ? 'bg-[#14121a] border-slate-700'
          : 'bg-[#260e14] border-rose-500/90 shadow-[0_0_18px_rgba(239,68,68,0.4)]'
      }`}>
        
        <div className="w-full flex items-center justify-between border-b border-slate-800 pb-1 font-mono">
          <span className="text-[9px] font-black text-amber-300 uppercase tracking-widest flex items-center gap-1">
            ⚡ PEMISAH (DS)
          </span>
          <span className="px-1.5 py-0.2 rounded text-[7.5px] font-black bg-amber-950 text-amber-300 border border-amber-800">
            ISOLATOR
          </span>
        </div>

        {/* Disconnecting Switch Blade Visual */}
        <div className="w-full bg-slate-950 rounded-lg p-2 border border-amber-900/50 flex flex-col items-center justify-center">
          <svg className="w-24 h-10" viewBox="0 0 100 40">
            {/* Terminal Left */}
            <circle cx="15" cy="20" r="4" fill={isEnergized ? "#f59e0b" : "#475569"} />
            
            {/* DS Blade Line */}
            {isClosed ? (
              <g>
                <line x1="15" y1="20" x2="85" y2="20" stroke={isEnergized ? "#f59e0b" : "#e2e8f0"} strokeWidth="4" strokeLinecap="round" />
                <line x1="85" y1="12" x2="85" y2="28" stroke={isEnergized ? "#f59e0b" : "#e2e8f0"} strokeWidth="3" strokeLinecap="round" />
              </g>
            ) : (
              <g>
                {/* Open Blade angled at 50 degrees */}
                <line x1="15" y1="20" x2="60" y2="5" stroke="#ef4444" strokeWidth="4" strokeLinecap="round" />
                <line x1="85" y1="12" x2="85" y2="28" stroke="#64748b" strokeWidth="3" strokeLinecap="round" />
                <text x="50" y="32" fill="#ef4444" fontSize="9" fontWeight="bold" textAnchor="middle">DS OPEN</text>
              </g>
            )}

            {/* Terminal Right */}
            <circle cx="85" cy="20" r="4" fill={isClosed && isEnergized ? "#f59e0b" : "#475569"} />
          </svg>
        </div>

        {/* Switch Control Button */}
        <div className="flex flex-col items-center my-0.5">
          <div className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center font-black text-base shadow-lg transition-all ${
            isClosed
              ? 'bg-rose-600 text-white border-rose-300 shadow-[0_0_15px_rgba(239,68,68,0.8)]'
              : 'bg-emerald-600 text-slate-950 border-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.8)]'
          }`}>
            {isClosed ? 'C' : 'O'}
          </div>
        </div>

        <div className="text-center w-full">
          <div className="text-[11px] font-black text-slate-100">{code}</div>
          <div className="text-[8.5px] font-bold text-slate-400 truncate">{name}</div>
        </div>

      </div>

      <div className={`w-1 h-3 ${isClosed && isEnergized ? 'bg-amber-400' : 'bg-slate-700'}`} />
      <div className={`w-3.5 h-3.5 rounded-full border-2 transition-all ${
        isClosed && isEnergized 
          ? 'border-amber-300 bg-amber-400 shadow-[0_0_10px_rgba(245,158,11,1)]' 
          : 'border-slate-700 bg-slate-800'
      }`} />
    </div>
  );
};

// Main Equipment Graphic Router Component
export const EquipmentGraphicRouter: React.FC<GraphicProps & { type: DeviceType }> = (props) => {
  switch (props.type) {
    case 'INCOMING':
      return <IncomerGraphic {...props} />;
    case 'OUTGOING':
      return <OutgoingGraphic {...props} />;
    case 'RECLOSER':
      return <RecloserGraphic {...props} />;
    case 'LBS':
      return <LbsGraphic {...props} />;
    case 'PMCB':
      return <PmcbGraphic {...props} />;
    case 'FCO':
      return <FcoGraphic {...props} />;
    case 'DS':
      return <DsGraphic {...props} />;
    case 'COUPLING':
      return <CouplingGraphic {...props} />;
    default:
      return <RecloserGraphic {...props} />;
  }
};
