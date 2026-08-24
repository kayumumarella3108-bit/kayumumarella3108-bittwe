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
    <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm mb-4">
      {/* Banner Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-pink-500/10 text-pink-500 border border-pink-500/20">
            <Heart className="w-4 h-4 fill-pink-500/20" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Status Kesehatan Seluruh Penyulang
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-pink-500/15 text-pink-600 dark:text-pink-400 text-[10px] font-extrabold uppercase">
                Health Index
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Ringkasan keandalan {totalCount} penyulang berdasarkan frekuensi gangguan
            </p>
          </div>
        </div>

        {onDetailClick && (
          <button
            onClick={onDetailClick}
            className="self-start sm:self-center px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>Detail</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          </button>
        )}
      </div>

      {/* Segmented Color Bar */}
      <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex mb-3">
        <div style={{ width: `${sempurnaPct}%` }} className="h-full bg-emerald-500 transition-all" title={`Sempurna: ${sempurnaCount}`} />
        <div style={{ width: `${sehatPct}%` }} className="h-full bg-blue-500 transition-all" title={`Sehat: ${sehatCount}`} />
        <div style={{ width: `${sakitPct}%` }} className="h-full bg-amber-500 transition-all" title={`Sakit: ${sakitCount}`} />
        <div style={{ width: `${kronisPct}%` }} className="h-full bg-rose-500 transition-all" title={`Kronis: ${kronisCount}`} />
      </div>

      {/* 4 Status Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        {/* Sempurna Card */}
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
              SEMPURNA (0)
            </div>
            <div className="text-lg font-extrabold text-slate-900 flex items-baseline gap-1 mt-0.5">
              <span>{sempurnaCount}</span>
              <span className="text-[10px] font-semibold text-slate-500">Penyulang</span>
            </div>
          </div>
          <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        {/* Sehat Card */}
        <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">
              SEHAT (1 - 3 R)
            </div>
            <div className="text-lg font-extrabold text-slate-900 flex items-baseline gap-1 mt-0.5">
              <span>{sehatCount}</span>
              <span className="text-[10px] font-semibold text-slate-500">Penyulang</span>
            </div>
          </div>
          <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>

        {/* Sakit Card */}
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">
              SAKIT (4 - 6)
            </div>
            <div className="text-lg font-extrabold text-slate-900 flex items-baseline gap-1 mt-0.5">
              <span>{sakitCount}</span>
              <span className="text-[10px] font-semibold text-slate-500">Penyulang</span>
            </div>
          </div>
          <div className="p-2 rounded-lg bg-amber-100 text-amber-600">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>

        {/* Kronis Card */}
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-rose-700 uppercase tracking-wider">
              KRONIS (&gt;=7)
            </div>
            <div className="text-lg font-extrabold text-slate-900 flex items-baseline gap-1 mt-0.5">
              <span>{kronisCount}</span>
              <span className="text-[10px] font-semibold text-slate-500">Penyulang</span>
            </div>
          </div>
          <div className="p-2 rounded-lg bg-rose-100 text-rose-600">
            <Flame className="w-4 h-4" />
          </div>
        </div>
      </div>
    </div>
  );
};
