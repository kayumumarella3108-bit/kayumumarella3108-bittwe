import React, { useState } from 'react';
import { X, Zap, Calculator, AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';

interface KalkulatorPembebananModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KalkulatorPembebananModal: React.FC<KalkulatorPembebananModalProps> = ({ isOpen, onClose }) => {
  const [dayaKva, setDayaKva] = useState<number>(160);
  const [iR, setIR] = useState<number>(180);
  const [iS, setIS] = useState<number>(175);
  const [iT, setIT] = useState<number>(185);

  if (!isOpen) return null;

  // Formula: In = (kVA * 1000) / (sqrt(3) * 400)
  const iNominal = (dayaKva * 1000) / (Math.sqrt(3) * 400);
  const iMax = Math.max(iR, iS, iT);
  const iAvg = (iR + iS + iT) / 3;
  const loadingPct = iNominal > 0 ? (iMax / iNominal) * 100 : 0;

  // Status determination & Color coding
  let statusLabel = 'Normal';
  let badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-300';
  let barColor = 'bg-emerald-500';
  let description = 'Pembebanan trafo dalam batas normal dan aman.';

  if (loadingPct === 0) {
    statusLabel = 'Belum Ada Beban';
    badgeColor = 'bg-slate-100 text-slate-700 border-slate-300';
    barColor = 'bg-slate-400';
    description = 'Tidak ada arus beban yang terdeteksi.';
  } else if (loadingPct <= 20) {
    statusLabel = 'Underload (Sangat Ringan)';
    badgeColor = 'bg-sky-100 text-sky-800 border-sky-300';
    barColor = 'bg-sky-400';
    description = 'Trafo beroperasi di bawah 20% kapasitas (pembebanan sangat rendah).';
  } else if (loadingPct <= 40) {
    statusLabel = 'Underload (Ringan)';
    badgeColor = 'bg-cyan-100 text-cyan-800 border-cyan-300';
    barColor = 'bg-cyan-500';
    description = 'Pembebanan trafo tergolong ringan (20% - 40%).';
  } else if (loadingPct <= 60) {
    statusLabel = 'Normal';
    badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-300';
    barColor = 'bg-emerald-500';
    description = 'Pembebanan optimal dan ideal (40% - 60%).';
  } else if (loadingPct <= 80) {
    statusLabel = 'Normal (Tinggi)';
    badgeColor = 'bg-teal-100 text-teal-800 border-teal-300';
    barColor = 'bg-teal-500';
    description = 'Pembebanan normal mendekati batas atas (60% - 80%).';
  } else if (loadingPct <= 100) {
    statusLabel = 'Overload (Waspada)';
    badgeColor = 'bg-amber-100 text-amber-900 border-amber-300';
    barColor = 'bg-amber-500';
    description = 'PERINGATAN: Beban trafo memasuki zona overload (80% - 100%). Perlu dimonitor ketat.';
  } else {
    statusLabel = 'Critical (Bahaya Overload)';
    badgeColor = 'bg-rose-100 text-rose-900 border-rose-300';
    barColor = 'bg-rose-600';
    description = 'BAHAYA: Pembebanan melebihi 100% kapasitas! Segera lakukan pemerataan beban atau upgrade trafo.';
  }

  // Unbalance calculation
  const devR = Math.abs(iR - iAvg);
  const devS = Math.abs(iS - iAvg);
  const devT = Math.abs(iT - iAvg);
  const maxDev = Math.max(devR, devS, devT);
  const unbalancePct = iAvg > 0 ? (maxDev / iAvg) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 text-blue-700 rounded-xl shadow-xs">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <span>Kalkulator Pembebanan Trafo</span>
                <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold uppercase">Utilities</span>
              </h3>
              <p className="text-xs text-slate-500 font-medium">Hitung persentase pembebanan trafo & analisis arus fasa secara instan</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Daya kVA */}
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Kapasitas Trafo (kVA)</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={dayaKva}
                onChange={(e) => setDayaKva(Math.max(1, Number(e.target.value)))}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="160"
              />
              <div className="flex gap-1 shrink-0">
                {[50, 100, 160, 200, 250, 400].map((std) => (
                  <button
                    key={std}
                    type="button"
                    onClick={() => setDayaKva(std)}
                    className={`px-2 py-1.5 text-[10px] font-bold rounded-lg border transition cursor-pointer ${
                      dayaKva === std
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    {std}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Arus R */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
              <span>Arus Fasa R (Amper)</span>
            </label>
            <input
              type="number"
              step="0.1"
              value={iR}
              onChange={(e) => setIR(Math.max(0, Number(e.target.value)))}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0.0"
            />
          </div>

          {/* Arus S */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
              <span>Arus Fasa S (Amper)</span>
            </label>
            <input
              type="number"
              step="0.1"
              value={iS}
              onChange={(e) => setIS(Math.max(0, Number(e.target.value)))}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0.0"
            />
          </div>

          {/* Arus T */}
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block"></span>
              <span>Arus Fasa T (Amper)</span>
            </label>
            <input
              type="number"
              step="0.1"
              value={iT}
              onChange={(e) => setIT(Math.max(0, Number(e.target.value)))}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0.0"
            />
          </div>
        </div>

        {/* Results Card */}
        <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-4 shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hasil Analisis Pembebanan</div>
              <div className="text-lg font-black text-white mt-0.5 flex items-center gap-2">
                <span>{loadingPct.toFixed(1)}%</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-black border ${badgeColor}`}>
                  {statusLabel}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Arus Nominal (In)</div>
              <div className="text-base font-bold text-blue-400 mt-0.5">{iNominal.toFixed(1)} A</div>
            </div>
          </div>

          {/* Progress Bar with Color Indication */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-medium text-slate-300">
              <span>0%</span>
              <span>50% (Normal)</span>
              <span>100% (Full)</span>
              <span>&gt;100% (Overload)</span>
            </div>
            <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
              <div
                className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                style={{ width: `${Math.min(100, loadingPct)}%` }}
              ></div>
            </div>
          </div>

          {/* Detailed metrics grid */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-center">
            <div className="p-2 bg-slate-800/80 rounded-xl">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Arus Max (Imax)</div>
              <div className="text-sm font-black text-amber-400 mt-0.5">{iMax.toFixed(1)} A</div>
            </div>
            <div className="p-2 bg-slate-800/80 rounded-xl">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Rata-rata (Iavg)</div>
              <div className="text-sm font-black text-sky-400 mt-0.5">{iAvg.toFixed(1)} A</div>
            </div>
            <div className="p-2 bg-slate-800/80 rounded-xl">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Ketidakseimbangan</div>
              <div className={`text-sm font-black mt-0.5 ${unbalancePct > 10 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {unbalancePct.toFixed(1)}%
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-800/60 rounded-xl text-xs text-slate-300 flex items-start gap-2.5">
            <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${loadingPct > 80 ? 'text-rose-400 animate-pulse' : 'text-amber-400'}`} />
            <div>
              <span className="font-bold text-white">Rekomendasi Operasional: </span>
              {description} {unbalancePct > 10 ? 'Perhatian: Ketidakseimbangan fasa melebihi 10%!' : ''}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={() => {
              setIR(0);
              setIS(0);
              setIT(0);
            }}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition cursor-pointer flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/20 transition cursor-pointer"
          >
            Tutup Kalkulator
          </button>
        </div>
      </div>
    </div>
  );
};
