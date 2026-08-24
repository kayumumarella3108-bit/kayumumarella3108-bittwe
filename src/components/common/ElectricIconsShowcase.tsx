import React, { useState } from 'react';
import {
  IconGarduTrafo,
  IconTiangSingleCrossarm,
  IconTiangDoubleCrossarm,
  IconTiangLBS,
  IconGarduPortal,
  IconGarduBeton,
  IconTiangPortal3Pole
} from './ElectricIcons';
import { Check, Copy, Zap, Info, Layers, Building2, Wrench } from 'lucide-react';

export const ElectricIconsShowcase: React.FC = () => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const iconItems = [
    {
      key: 'garduTrafo',
      title: 'Icon Trafo / Gardu Distribusi (Line Technical)',
      component: IconGarduTrafo,
      category: 'Gardu & Trafo',
      badge: 'GTT / Trafo 20kV',
      desc: 'Line art teknis unit trafo distribusi 3-phase dengan sirip pendingin, bushing atas, dan bracket dudukan bawah.'
    },
    {
      key: 'tiangSingle',
      title: 'Icon Tiang Listrik Single Crossarm (T-Pole)',
      component: IconTiangSingleCrossarm,
      category: 'Konstruksi Tiang',
      badge: 'Single Travers',
      desc: 'Tiang beton/baja dengan 1 travers horizontal, 3 isolator tumpu, dan penopang diagonal (bracing).'
    },
    {
      key: 'tiangDouble',
      title: 'Icon Tiang Listrik Double Crossarm (2 Level)',
      component: IconTiangDoubleCrossarm,
      category: 'Konstruksi Tiang',
      badge: 'Double Travers',
      desc: 'Tiang konstruksi 2 tingkat travers dengan isolator tumpu di setiap level horizontal.'
    },
    {
      key: 'tiangLBS',
      title: 'Icon Tiang Switching / LBS / FCO',
      component: IconTiangLBS,
      category: 'Peralatan Switching',
      badge: 'LBS / Recloser Pole',
      desc: 'Tiang dengan braket Load Break Switch / FCO, isolator tumpu/hang, dan stang pengoperasian saklar.'
    },
    {
      key: 'garduPortal',
      title: 'Icon Gardu Cantol / Gardu Portal 2-Tiang',
      component: IconGarduPortal,
      category: 'Gardu & Trafo',
      badge: 'Portal GTT (H-Frame)',
      desc: 'Konstruksi gardu portal 2 tiang paralel dengan trafo distribusi terpasang di platform gelagar tengah.'
    },
    {
      key: 'garduBeton',
      title: 'Icon Gardu Beton / Kiosk Substation',
      component: IconGarduBeton,
      category: 'Gardu & Trafo',
      badge: 'Gardu Beton / Kios PLN',
      desc: 'Bangunan gardu kios PLN "Listrik Pintar" dengan atap kanopi biru, pintu ganda, dan logo kilat PLN.'
    },
    {
      key: 'tiangPortal3Pole',
      title: 'Icon Tiang Portal 3-Pole (H-Frame Triple)',
      component: IconTiangPortal3Pole,
      category: 'Konstruksi Tiang',
      badge: 'Portal 3 Tiang',
      desc: 'Struktur konstruksi 3 tiang paralel dengan travers bertingkat untuk persimpangan/percabangan JTM.'
    }
  ];

  const handleCopyCode = (key: string, title: string) => {
    const codeSnippet = `<${
      key === 'garduTrafo'
        ? 'IconGarduTrafo'
        : key === 'tiangSingle'
        ? 'IconTiangSingleCrossarm'
        : key === 'tiangDouble'
        ? 'IconTiangDoubleCrossarm'
        : key === 'tiangLBS'
        ? 'IconTiangLBS'
        : key === 'garduPortal'
        ? 'IconGarduPortal'
        : key === 'garduBeton'
        ? 'IconGarduBeton'
        : 'IconTiangPortal3Pole'
    } size={32} color="#0284c7" />`;

    navigator.clipboard.writeText(codeSnippet);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white space-y-6 shadow-xl">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-2xl shrink-0">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
              Koleksi Icon Gardu & Tiang Listrik PLN 20kV
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Icon vektor presisi tinggi sesuai standar konstruksi jaringan distribusi PLN (GTT, Tiang Single/Double Crossarm, LBS, Gardu Portal & Gardu Beton).
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {iconItems.map((item) => {
          const IconComp = item.component;
          const isCopied = copiedKey === item.key;

          return (
            <div
              key={item.key}
              className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all space-y-4 group flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Header Icon Preview Box */}
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-amber-400 border border-slate-700 text-[10px] font-extrabold uppercase tracking-wider">
                    {item.badge}
                  </span>
                  <button
                    onClick={() => handleCopyCode(item.key, item.title)}
                    className="p-1.5 rounded-lg bg-slate-900 hover:bg-amber-500 hover:text-slate-950 text-slate-400 border border-slate-800 text-[11px] font-extrabold flex items-center gap-1 transition-all cursor-pointer"
                    title="Copy JSX component code"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Display Large Center Icon */}
                <div className="py-6 px-4 bg-slate-900/90 rounded-xl border border-slate-800/80 flex items-center justify-center gap-8 group-hover:bg-slate-900 transition-colors">
                  <div className="text-amber-400 flex flex-col items-center gap-1">
                    <IconComp size={48} strokeWidth={2} />
                    <span className="text-[9px] text-slate-500 font-mono mt-1">48px Amber</span>
                  </div>
                  <div className="text-sky-400 flex flex-col items-center gap-1">
                    <IconComp size={36} strokeWidth={2.2} />
                    <span className="text-[9px] text-slate-500 font-mono mt-1">36px Sky</span>
                  </div>
                  <div className="text-emerald-400 flex flex-col items-center gap-1">
                    <IconComp size={28} strokeWidth={2.5} />
                    <span className="text-[9px] text-slate-500 font-mono mt-1">28px Emerald</span>
                  </div>
                </div>

                <div>
                  <h3 className="font-extrabold text-white text-sm group-hover:text-amber-400 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{item.desc}</p>
                </div>
              </div>

              {/* Code Snippet footer */}
              <div className="pt-3 border-t border-slate-900 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                <span>Category: {item.category}</span>
                <span className="text-slate-400">SVG Vector</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
