import React from 'react';
import { Heart, CheckCircle2, ShieldCheck, AlertTriangle, Flame, ArrowRight } from 'lucide-react';

interface HealthIndexBannerProps {
  totalCount: number;
  sempurnaCount: number;
  sehatCount: number;
  sakitCount: number;
  kronisCount: number;
  onDetailClick?: () => void;
}

export const HealthIndexBanner: React.FC<HealthIndexBannerProps> = ({
  totalCount = 25,
  sempurnaCount = 23,
  sehatCount = 2,
  sakitCount = 0,
  kronisCount = 0,
  onDetailClick
}) => {
  const sempurnaPct = (sempurnaCount / totalCount) * 100;
  const sehatPct = (sehatCount / totalCount) * 100;
  const sakitPct = (sakitCount / totalCount) * 100;
  const kronisPct = (kronisCount / totalCount) * 100;

  return (
    <div className="w-full bg-gradient-to-r from-teal-950 via-teal-900 to-slate-900 border border-teal-500/30 rounded-2xl p-5 shadow-xl mb-4 text-white">
      {/* Banner Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-400/30 shadow-xs">
            <Heart className="w-4 h-4 fill-teal-400/30 text-teal-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white drop-shadow-xs">
                Status Kesehatan Seluruh Penyulang
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-extrabold uppercase tracking-wider">
                Health Index
              </span>
            </div>
            <p className="text-xs text-teal-100/80 mt-0.5">
              Ringkasan keandalan {totalCount} penyulang berdasarkan frekuensi gangguan
            </p>
          </div>
        </div>

        {onDetailClick && (
          <button
            onClick={onDetailClick}
            className="self-start sm:self-center px-3.5 py-1.5 rounded-xl bg-teal-800/60 hover:bg-teal-700/80 text-teal-100 font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer border border-teal-500/30 active:scale-95"
          >
            <span>Detail</span>
            <ArrowRight className="w-3.5 h-3.5 text-teal-300" />
          </button>
        )}
      </div>

      {/* Segmented Color Bar */}
      <div className="w-full h-2.5 rounded-full bg-slate-900/80 border border-teal-500/20 overflow-hidden flex mb-3.5 shadow-inner">
        <div style={{ width: `${sempurnaPct}%` }} className="h-full bg-emerald-400 transition-all" title={`Sempurna: ${sempurnaCount}`} />
        <div style={{ width: `${sehatPct}%` }} className="h-full bg-blue-400 transition-all" title={`Sehat: ${sehatCount}`} />
        <div style={{ width: `${sakitPct}%` }} className="h-full bg-amber-400 transition-all" title={`Sakit: ${sakitCount}`} />
        <div style={{ width: `${kronisPct}%` }} className="h-full bg-rose-400 transition-all" title={`Kronis: ${kronisCount}`} />
      </div>

      {/* 4 Status Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        {/* Sempurna Card */}
        <div className="p-3.5 rounded-xl bg-teal-900/50 border border-emerald-500/40 flex items-center justify-between shadow-xs">
          <div>
            <div className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider">
              SEMPURNA (0)
            </div>
            <div className="text-lg font-black text-white flex items-baseline gap-1 mt-0.5">
              <span>{sempurnaCount}</span>
              <span className="text-[10px] font-semibold text-teal-200/70">Penyulang</span>
            </div>
          </div>
          <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        {/* Sehat Card */}
        <div className="p-3.5 rounded-xl bg-teal-900/50 border border-blue-500/40 flex items-center justify-between shadow-xs">
          <div>
            <div className="text-[10px] font-bold text-blue-300 uppercase tracking-wider">
              SEHAT (1 - 3 R)
            </div>
            <div className="text-lg font-black text-white flex items-baseline gap-1 mt-0.5">
              <span>{sehatCount}</span>
              <span className="text-[10px] font-semibold text-teal-200/70">Penyulang</span>
            </div>
          </div>
          <div className="p-2 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/30">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>

        {/* Sakit Card */}
        <div className="p-3.5 rounded-xl bg-teal-900/50 border border-amber-500/40 flex items-center justify-between shadow-xs">
          <div>
            <div className="text-[10px] font-bold text-amber-300 uppercase tracking-wider">
              SAKIT (4 - 6)
            </div>
            <div className="text-lg font-black text-white flex items-baseline gap-1 mt-0.5">
              <span>{sakitCount}</span>
              <span className="text-[10px] font-semibold text-teal-200/70">Penyulang</span>
            </div>
          </div>
          <div className="p-2 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>

        {/* Kronis Card */}
        <div className="p-3.5 rounded-xl bg-teal-900/50 border border-rose-500/40 flex items-center justify-between shadow-xs">
          <div>
            <div className="text-[10px] font-bold text-rose-300 uppercase tracking-wider">
              KRONIS (&gt;=7)
            </div>
            <div className="text-lg font-black text-white flex items-baseline gap-1 mt-0.5">
              <span>{kronisCount}</span>
              <span className="text-[10px] font-semibold text-teal-200/70">Penyulang</span>
            </div>
          </div>
          <div className="p-2 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30">
            <Flame className="w-4 h-4" />
          </div>
        </div>
      </div>
    </div>
  );
};
