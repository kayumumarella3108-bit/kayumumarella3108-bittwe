import React, { useState } from 'react';
import {
  HardHat,
  Car,
  Trees,
  Search,
  Calendar,
  Radio,
  MapPin,
  Clock,
  ShieldCheck,
  AlertTriangle,
  UserCheck,
  Zap,
  PhoneCall,
  ExternalLink,
  CheckCircle2,
  ListFilter,
  BarChart3,
  Wrench,
  Layers,
  ChevronRight
} from 'lucide-react';
import { KendaraanOperasional, ViewType, User, JadwalPiket } from '../../types';
import { LiveGpsKendaraanDashboard } from '../yantek/LiveGpsKendaraanDashboard';
import { INITIAL_JADWAL_PIKET } from '../../data/mockData';

interface MonitoringYantekViewProps {
  currentUser?: User | null;
  kendaraanList: KendaraanOperasional[];
  onUpdateKendaraan: (kendaraan: KendaraanOperasional) => void;
  onSelectView: (view: ViewType) => void;
}

export const MonitoringYantekView: React.FC<MonitoringYantekViewProps> = ({
  currentUser,
  kendaraanList,
  onUpdateKendaraan,
  onSelectView
}) => {
  const [activeTab, setActiveTab] = useState<'gps' | 'row' | 'inspeksi' | 'piket'>('gps');

  return (
    <div className="space-y-6 text-slate-800 pb-10">
      {/* Header Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 text-white rounded-3xl p-6 shadow-xl border border-sky-500/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-sky-500/20 text-sky-400 border border-sky-500/30 rounded-2xl shadow-inner">
              <HardHat className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-sky-500/20 text-sky-300 border border-sky-500/30 text-[10px] font-black uppercase tracking-wider">
                  Sistem Informasi & Posko Pelayanan Teknik
                </span>
                <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Live GPS Connected
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white mt-1 tracking-tight">
                MONITORING YANTEK (PELAYANAN TEKNIK) {currentUser?.unit ? currentUser.unit.toUpperCase() : 'ULP BAGUALA'}
              </h1>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                Integrasi Komando Live GPS Kendaraan HP, Perintisan ROW Pohon, Inspeksi Jaringan 20kV, dan Piket Siaga Gangguan 24 Jam.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onSelectView('kendaraan_operasional')}
              className="px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs transition-all flex items-center gap-2 shadow-lg shadow-sky-500/20 cursor-pointer"
            >
              <Car className="w-4 h-4" />
              <span>Kelola Armada Yantek</span>
            </button>
          </div>
        </div>

        {/* Tab Selection Navigation */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab('gps')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'gps'
                ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
                : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300'
            }`}
          >
            <Car className="w-4 h-4" />
            <span>1. Dashboard Live GPS Kendaraan</span>
          </button>

          <button
            onClick={() => setActiveTab('row')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'row'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300'
            }`}
          >
            <Trees className="w-4 h-4" />
            <span>2. Perintisan ROW Pohon</span>
          </button>

          <button
            onClick={() => setActiveTab('inspeksi')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'inspeksi'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>3. Inspeksi Tier 1 & Tier 2</span>
          </button>

          <button
            onClick={() => setActiveTab('piket')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'piket'
                ? 'bg-purple-500 text-slate-950 shadow-md shadow-purple-500/20'
                : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>4. Jadwal Piket & Siaga Yantek</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Live GPS Kendaraan Dashboard */}
      {activeTab === 'gps' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <LiveGpsKendaraanDashboard
            currentUser={currentUser}
            kendaraanList={kendaraanList}
            onUpdateKendaraan={onUpdateKendaraan}
          />
        </div>
      )}

      {/* Tab 2: Perintisan & ROW Pohon */}
      {activeTab === 'row' && (
        <div className="space-y-5 animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700 border border-emerald-200">
                  <Trees className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-900">
                    MONITORING RIGHT OF WAY (ROW) & EKSEKUSI TEBANG POHON
                  </h2>
                  <p className="text-xs text-slate-500">
                    Pemangkasan dahan dan tebang pohon kritis yang mendekati konduktor SUTM 20kV (&lt; 2.5 meter).
                  </p>
                </div>
              </div>

              <button
                onClick={() => onSelectView('peta_pohon')}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs transition-all flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <span>Buka Peta GIS Pohon Kritis</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Overview Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                <div className="text-[10px] font-black uppercase text-emerald-800 tracking-wider">
                  Pohon Kritis Terdata
                </div>
                <div className="text-2xl font-black text-emerald-900 mt-1">
                  142 <span className="text-xs font-normal text-emerald-700">Pohon</span>
                </div>
                <div className="text-[10px] text-emerald-700 font-semibold mt-1">
                  Penyulang PASSO, LATERI & TULEHU
                </div>
              </div>

              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                <div className="text-[10px] font-black uppercase text-amber-800 tracking-wider">
                  Telah Dieksekusi Yantek
                </div>
                <div className="text-2xl font-black text-amber-900 mt-1">
                  98 <span className="text-xs font-normal text-amber-700">Pohon (69%)</span>
                </div>
                <div className="text-[10px] text-amber-700 font-semibold mt-1">
                  Target Bulan Ini: 120 Pohon
                </div>
              </div>

              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200">
                <div className="text-[10px] font-black uppercase text-rose-800 tracking-wider">
                  Perlu Izin Pemilik Lahan
                </div>
                <div className="text-2xl font-black text-rose-900 mt-1">
                  18 <span className="text-xs font-normal text-rose-700">Titik Kritis</span>
                </div>
                <div className="text-[10px] text-rose-700 font-semibold mt-1">
                  Memerlukan Sosialisasi Yantek
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 text-white flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Zap className="w-5 h-5 text-amber-400 shrink-0" />
                <div className="text-xs">
                  <span className="font-extrabold text-white block">Pohon Bambu & Sukun Rawan Sentuh Jaringan 20kV</span>
                  <span className="text-slate-300">Tim Yantek Patroli ROW dilengkapi gergaji mesin teleskopik & APD K3.</span>
                </div>
              </div>
              <button
                onClick={() => onSelectView('peta_pohon')}
                className="px-3.5 py-2 rounded-lg bg-emerald-500 text-slate-950 font-black text-xs hover:bg-emerald-400 cursor-pointer shrink-0"
              >
                Ke Modul Peta Pohon →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Inspeksi Jaringan */}
      {activeTab === 'inspeksi' && (
        <div className="space-y-5 animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-100 text-amber-700 border border-amber-200">
                  <Search className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-900">
                    HASIL INSPEKSI JARINGAN TEKNIK (TIER 1 & TIER 2)
                  </h2>
                  <p className="text-xs text-slate-500">
                    Pemeriksaan Visual JTM, Gardu Distribusi (GTT), Thermovision, dan Detection Ultrasound.
                  </p>
                </div>
              </div>
            </div>

            {/* Direct Quick Links to Inspection Views */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div
                onClick={() => onSelectView('inspeksi_tier1_jtm')}
                className="p-4 rounded-2xl border border-slate-200 bg-gradient-to-br from-amber-50 to-orange-50 hover:border-amber-400 transition-all cursor-pointer space-y-2 group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-amber-900 uppercase">Inspeksi Tier 1 JTM</span>
                  <ChevronRight className="w-4 h-4 text-amber-600 group-hover:translate-x-1 transition-transform" />
                </div>
                <p className="text-[11px] text-slate-600">
                  Inspeksi visual tiang, isolator tumpu, FCO, arrester & konduktor jaringan 20kV.
                </p>
                <div className="text-[10px] font-extrabold text-amber-700 pt-1">
                  12 Temuan Anomali →
                </div>
              </div>

              <div
                onClick={() => onSelectView('inspeksi_tier1_gtt')}
                className="p-4 rounded-2xl border border-slate-200 bg-gradient-to-br from-blue-50 to-indigo-50 hover:border-blue-400 transition-all cursor-pointer space-y-2 group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-blue-900 uppercase">Inspeksi Gardu GTT</span>
                  <ChevronRight className="w-4 h-4 text-blue-600 group-hover:translate-x-1 transition-transform" />
                </div>
                <p className="text-[11px] text-slate-600">
                  Pemeriksaan trafo distribusi, PHB-TR, nilai pembumian/grounding & kebersihan gardu.
                </p>
                <div className="text-[10px] font-extrabold text-blue-700 pt-1">
                  8 Trafo Perlu Maintenance →
                </div>
              </div>

              <div
                onClick={() => onSelectView('inspeksi_tier2_thermovision')}
                className="p-4 rounded-2xl border border-slate-200 bg-gradient-to-br from-rose-50 to-red-50 hover:border-rose-400 transition-all cursor-pointer space-y-2 group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-rose-900 uppercase">Tier 2 Thermovision</span>
                  <ChevronRight className="w-4 h-4 text-rose-600 group-hover:translate-x-1 transition-transform" />
                </div>
                <p className="text-[11px] text-slate-600">
                  Pengukuran suhu hotspot konektor, jumperan, FCO & bushings trafo dengan infrared camera.
                </p>
                <div className="text-[10px] font-extrabold text-rose-700 pt-1">
                  3 Hotspot Delta &gt; 25°C →
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Jadwal Piket & Siaga Yantek */}
      {activeTab === 'piket' && (
        <div className="space-y-5 animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-purple-100 text-purple-700 border border-purple-200">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-900">
                    JADWAL PIKET & POSKO SIAGA YANTEK 24 JAM
                  </h2>
                  <p className="text-xs text-slate-500">
                    Jadwal Regu Piket Penanganan Gangguan Listrik ULP Baguala Hari Ini.
                  </p>
                </div>
              </div>

              <button
                onClick={() => onSelectView('jadwal_piket')}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs transition-all flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <span>Kelola Lengkap Jadwal Piket</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Active Duty Crew Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {INITIAL_JADWAL_PIKET.map((item, idx) => {
                const currentDay = new Date().getDate().toString();
                const shiftCode = item.jadwal[currentDay] || 'L';
                if (shiftCode === 'L') return null; // Only show on-duty officers

                const shiftLabel = 
                  shiftCode === 'P' ? 'Pagi (08:00 - 16:00)' :
                  shiftCode === 'S' ? 'Sore (16:00 - 24:00)' :
                  shiftCode === 'M' ? 'Malam (00:00 - 08:00)' : 'Siaga';

                const shiftColor = 
                  shiftCode === 'P' ? 'bg-sky-100 text-sky-800 border-sky-200' :
                  shiftCode === 'S' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                  shiftCode === 'M' ? 'bg-indigo-100 text-indigo-800 border-indigo-200' : 'bg-slate-100 text-slate-800 border-slate-200';

                return (
                  <div
                    key={item.id || idx}
                    className="p-4 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-purple-300 transition-all space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className={`px-2.5 py-1 rounded-lg border text-[10px] font-black uppercase ${shiftColor}`}>
                        {shiftLabel}
                      </span>
                      <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-purple-600 animate-pulse" />
                        <span>Hari Ini</span>
                      </span>
                    </div>

                    <div>
                      <h3 className="text-sm font-black text-slate-900">{item.namaPetugas}</h3>
                      <p className="text-xs text-slate-500 mt-1">
                        Unit: <strong className="text-purple-600">{item.unit}</strong>
                      </p>
                      <p className="text-xs text-slate-600 mt-1">
                        No. HP: <strong>{item.noHp}</strong>
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs">
                      <span className="text-[11px] text-slate-500">
                        Status: <strong className="text-emerald-600">On Duty</strong>
                      </span>
                      <a
                        href={`https://wa.me/${item.noHp.replace(/[\s+]+/g, '')}?text=Panggilan%20Tugas%20Yantek%20Hari%20Ini`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-[11px] flex items-center gap-1 hover:bg-emerald-500 transition-all"
                      >
                        <PhoneCall className="w-3 h-3" />
                        <span>Hubungi WhatsApp</span>
                      </a>
                    </div>
                  </div>
                );
              }).filter(Boolean).slice(0, 6)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
