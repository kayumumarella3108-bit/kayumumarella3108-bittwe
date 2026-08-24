import React, { useState } from 'react';
import {
  Zap,
  Car,
  BatteryCharging,
  Sun,
  Wind,
  Plus,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Gauge,
  Sparkles,
  ShieldCheck,
  Building2,
  MapPin,
  TrendingUp,
  Download,
  Power,
  Sliders,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { User } from '../../types';
import { canEditData } from '../../utils/permissions';

interface SpkluStation {
  id: string;
  namaStation: string;
  lokasi: string;
  tipeCharger: 'Ultra Fast Charging (200kW DC)' | 'Fast Charging (60kW DC)' | 'Medium Charging (22kW AC)' | 'Dual Connector (DC+AC)';
  jumlahGun: number;
  status: 'Online' | 'Charging' | 'Maintenance' | 'Offline';
  sumberDayaEbt: string; // e.g., 'Solar PV 50kWp + Kincir Wind Turbine 20kW'
  ebtPercentage: number;
  totalKwhHariIni: number;
  totalTransaksiHariIni: number;
  tarifPerKwh: number; // e.g. 2467
}

interface ActiveSession {
  id: string;
  stationId: string;
  stationName: string;
  tipeMobil: string; // e.g. 'Hyundai Ioniq 5'
  platNomor: string; // e.g. 'DE 1234 AB'
  pemilik: string;
  batteryLevel: number; // 0 - 100
  powerKw: number; // kW charging rate
  kwhDelivered: number; // kWh
  waktuMulai: string;
  estimasiSelesaiMin: number;
  ebtSharePercent: number;
  statusSession: 'Charging' | 'Completed' | 'Standby';
}

interface SpkluViewProps {
  currentUser: User;
}

const INITIAL_STATIONS: SpkluStation[] = [
  {
    id: 'spklu-01',
    namaStation: 'SPKLU ULP Baguala (Passo Main Hub)',
    lokasi: 'Jl. Syaranamual No. 8, Passo, Baguala - Ambon',
    tipeCharger: 'Ultra Fast Charging (200kW DC)',
    jumlahGun: 4,
    status: 'Charging',
    sumberDayaEbt: 'Atap Solar PV 50 kWp + Kincir Wind Turbine 20 kW',
    ebtPercentage: 92,
    totalKwhHariIni: 485.6,
    totalTransaksiHariIni: 18,
    tarifPerKwh: 2467
  },
  {
    id: 'spklu-02',
    namaStation: 'SPKLU Transit Area Passo - Waitatiri',
    lokasi: 'Area Rest Stop Transit Passo - Baguala',
    tipeCharger: 'Fast Charging (60kW DC)',
    jumlahGun: 2,
    status: 'Charging',
    sumberDayaEbt: 'Microgrid EBT Baguala & Backup Grid 20kV',
    ebtPercentage: 85,
    totalKwhHariIni: 312.4,
    totalTransaksiHariIni: 12,
    tarifPerKwh: 2467
  },
  {
    id: 'spklu-03',
    namaStation: 'SPKLU Bandara Pattimura Junction',
    lokasi: 'Pos Siaga Keandalan 20kV Laha - Baguala',
    tipeCharger: 'Dual Connector (DC+AC)',
    jumlahGun: 2,
    status: 'Online',
    sumberDayaEbt: 'Atap Solar PV 30 kWp',
    ebtPercentage: 78,
    totalKwhHariIni: 198.0,
    totalTransaksiHariIni: 8,
    tarifPerKwh: 2467
  },
  {
    id: 'spklu-04',
    namaStation: 'SPKLU Mobile Yantek Emergency Baguala',
    lokasi: 'Armada Yantek PLN ULP Baguala (Mobile Unit)',
    tipeCharger: 'Fast Charging (60kW DC)',
    jumlahGun: 1,
    status: 'Online',
    sumberDayaEbt: 'Portable Solar Array + Battery Storage 50kWh',
    ebtPercentage: 100,
    totalKwhHariIni: 84.5,
    totalTransaksiHariIni: 4,
    tarifPerKwh: 2467
  }
];

const INITIAL_SESSIONS: ActiveSession[] = [
  {
    id: 'sess-101',
    stationId: 'spklu-01',
    stationName: 'SPKLU ULP Baguala (Passo Main Hub)',
    tipeMobil: 'Hyundai Ioniq 5 Signature',
    platNomor: 'DE 1088 AB',
    pemilik: 'Dinas ESDM Maluku',
    batteryLevel: 78,
    powerKw: 120,
    kwhDelivered: 42.8,
    waktuMulai: '09:15 WIT',
    estimasiSelesaiMin: 12,
    ebtSharePercent: 95,
    statusSession: 'Charging'
  },
  {
    id: 'sess-102',
    stationId: 'spklu-01',
    stationName: 'SPKLU ULP Baguala (Passo Main Hub)',
    tipeMobil: 'Wuling Air EV Long Range',
    platNomor: 'DE 1945 C',
    pemilik: 'Operasional PLN ULP Baguala',
    batteryLevel: 88,
    powerKw: 22,
    kwhDelivered: 18.2,
    waktuMulai: '09:40 WIT',
    estimasiSelesaiMin: 8,
    ebtSharePercent: 92,
    statusSession: 'Charging'
  },
  {
    id: 'sess-103',
    stationId: 'spklu-02',
    stationName: 'SPKLU Transit Area Passo - Waitatiri',
    tipeMobil: 'BYD Seal Performance EV',
    platNomor: 'B 2888 EV',
    pemilik: 'Tamu VIP Pemda',
    batteryLevel: 62,
    powerKw: 60,
    kwhDelivered: 31.5,
    waktuMulai: '10:05 WIT',
    estimasiSelesaiMin: 22,
    ebtSharePercent: 88,
    statusSession: 'Charging'
  }
];

export const SpkluView: React.FC<SpkluViewProps> = ({ currentUser }) => {
  const isEditMode = canEditData(currentUser);
  const [stations, setStations] = useState<SpkluStation[]>(INITIAL_STATIONS);
  const [sessions, setSessions] = useState<ActiveSession[]>(INITIAL_SESSIONS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  
  // Modal State
  const [showAddSessionModal, setShowAddSessionModal] = useState(false);
  const [showAddStationModal, setShowAddStationModal] = useState(false);

  // Form State for Session
  const [newSession, setNewSession] = useState({
    stationId: 'spklu-01',
    tipeMobil: 'Wuling Air EV',
    platNomor: 'DE 8888 EV',
    pemilik: 'Umum / Masyarakat',
    batteryLevel: 30,
    powerKw: 60
  });

  // Form State for Station
  const [newStation, setNewStation] = useState({
    namaStation: '',
    lokasi: '',
    tipeCharger: 'Ultra Fast Charging (200kW DC)' as SpkluStation['tipeCharger'],
    jumlahGun: 2,
    sumberDayaEbt: 'Atap Solar PV 40 kWp + Kincir Wind Turbine 15 kW',
    ebtPercentage: 85
  });

  // Action: Add New Charging Session
  const handleCreateSession = (e: React.FormEvent) => {
    e.preventDefault();
    const st = stations.find((s) => s.id === newSession.stationId) || stations[0];
    const created: ActiveSession = {
      id: `sess-${Date.now()}`,
      stationId: st.id,
      stationName: st.namaStation,
      tipeMobil: newSession.tipeMobil,
      platNomor: newSession.platNomor,
      pemilik: newSession.pemilik,
      batteryLevel: newSession.batteryLevel,
      powerKw: newSession.powerKw,
      kwhDelivered: 5.0,
      waktuMulai: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIT',
      estimasiSelesaiMin: Math.round(((100 - newSession.batteryLevel) * 0.6)),
      ebtSharePercent: st.ebtPercentage,
      statusSession: 'Charging'
    };

    setSessions([created, ...sessions]);
    setShowAddSessionModal(false);
  };

  // Action: Add New SPKLU Station
  const handleCreateStation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStation.namaStation) return;

    const created: SpkluStation = {
      id: `spklu-${Date.now()}`,
      namaStation: newStation.namaStation,
      lokasi: newStation.lokasi || 'ULP Baguala - Ambon',
      tipeCharger: newStation.tipeCharger,
      jumlahGun: newStation.jumlahGun,
      status: 'Online',
      sumberDayaEbt: newStation.sumberDayaEbt,
      ebtPercentage: newStation.ebtPercentage,
      totalKwhHariIni: 0,
      totalTransaksiHariIni: 0,
      tarifPerKwh: 2467
    };

    setStations([...stations, created]);
    setShowAddStationModal(false);
    setNewStation({
      namaStation: '',
      lokasi: '',
      tipeCharger: 'Ultra Fast Charging (200kW DC)',
      jumlahGun: 2,
      sumberDayaEbt: 'Atap Solar PV 40 kWp + Kincir Wind Turbine 15 kW',
      ebtPercentage: 85
    });
  };

  // Action: Finish Session
  const handleStopSession = (sessionId: string) => {
    setSessions((prev) =>
      prev.map((s) =>
        s.id === sessionId ? { ...s, batteryLevel: 100, statusSession: 'Completed', powerKw: 0 } : s
      )
    );
  };

  // Summary Calculations
  const totalKwh = stations.reduce((acc, s) => acc + s.totalKwhHariIni, 0);
  const totalTx = stations.reduce((acc, s) => acc + s.totalTransaksiHariIni, 0);
  const avgEbt = Math.round(stations.reduce((acc, s) => acc + s.ebtPercentage, 0) / (stations.length || 1));
  const activeSessionCount = sessions.filter((s) => s.statusSession === 'Charging').length;
  const co2SavedKg = Math.round(totalKwh * 0.85); // approx 0.85 kg CO2 per kWh vs fossil

  const filteredStations = stations.filter((s) => {
    const matchesSearch =
      s.namaStation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.lokasi.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.tipeCharger.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (selectedStatusFilter === 'ALL') return matchesSearch;
    return matchesSearch && (s.status || '').toUpperCase() === (selectedStatusFilter || '').toUpperCase();
  });

  return (
    <div className="p-4 md:p-6 space-y-6 text-slate-800">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 rounded-2xl p-6 text-white border border-emerald-500/30 shadow-xl relative overflow-hidden">
        {/* Background Decorative Grid */}
        <div className="absolute inset-0 bg-[radial-gradient(#34d399_1px,transparent_1px)] [background-size:16px_16px] opacity-10 pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold uppercase tracking-wider">
              <Zap className="w-3.5 h-3.5 text-emerald-400 animate-bounce" />
              <span>MONITORING STASIUN LOKASI SPKLU</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              Monitoring SPKLU PLN ULP Baguala
            </h1>
            <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
              Infrastruktur Stasiun Pengisian Kendaraan Listrik Umum (SPKLU) terintegrasi pembangkit Listrik Tenaga Surya (PV) & Kincir Angin (Wind Turbine) di wilayah PLN ULP Baguala.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {isEditMode && (
              <>
                <button
                  onClick={() => setShowAddSessionModal(true)}
                  className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs flex items-center gap-2 transition-all shadow-lg hover:shadow-emerald-500/25 cursor-pointer"
                >
                  <BatteryCharging className="w-4 h-4" />
                  <span>Sesi Charging Baru</span>
                </button>

                <button
                  onClick={() => setShowAddStationModal(true)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/40 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-emerald-400" />
                  <span>Tambah SPKLU</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Top Header Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-950/70 p-4 rounded-xl border border-emerald-500/30 flex items-center gap-4">
            <div className="p-3 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl shrink-0">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total SPKLU</div>
              <div className="text-2xl font-black text-white mt-0.5">{stations.length} Stasiun / Lokasi</div>
              <span className="text-xs text-emerald-400 font-bold flex items-center gap-1 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                100% Operational Ready (200kW, 60kW, 22kW)
              </span>
            </div>
          </div>

          <div className="bg-slate-950/70 p-4 rounded-xl border border-cyan-500/30 flex items-center gap-4">
            <div className="p-3 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-xl shrink-0">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">Areal SPKLU</div>
              <div className="text-2xl font-black text-cyan-300 mt-0.5">4 Wilayah Coverage ULP Baguala</div>
              <span className="text-xs text-cyan-400 font-medium mt-0.5 block">
                Passo Main Hub • Transit Area • Bandara Junction • Unit Mobile Yantek
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Live Charging Sessions Visualizer Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <BatteryCharging className="w-5 h-5 text-emerald-600" />
            <span>Sesi Charging Kendaraan Listrik (Real-Time Live Monitor)</span>
          </h2>
          <span className="text-xs font-bold text-slate-500 bg-slate-200 px-2.5 py-1 rounded-full">
            {activeSessionCount} Aktif
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sessions.map((sess) => (
            <div
              key={sess.id}
              className={`rounded-2xl p-5 border transition-all shadow-md relative overflow-hidden ${
                sess.statusSession === 'Charging'
                  ? 'bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950 border-emerald-500/50 text-white'
                  : 'bg-white border-slate-200 text-slate-800'
              }`}
            >
              {/* Pulse Glow for Charging status */}
              {sess.statusSession === 'Charging' && (
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
              )}

              <div className="flex items-center justify-between border-b pb-3 mb-3 border-slate-700/50">
                <div>
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                    {sess.stationName}
                  </span>
                  <h3 className="font-extrabold text-base flex items-center gap-2">
                    <Car className="w-4 h-4 text-emerald-400" />
                    <span>{sess.tipeMobil}</span>
                  </h3>
                </div>

                <div className="text-right">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {sess.platNomor}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">{sess.pemilik}</span>
                </div>
              </div>

              {/* Animated Battery Bar */}
              <div className="space-y-1.5 my-3">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                    <span>Daya: {sess.powerKw} kW</span>
                  </span>
                  <span className="text-emerald-400 font-extrabold text-sm">{sess.batteryLevel}%</span>
                </div>

                <div className="w-full h-3.5 bg-slate-800 rounded-full p-0.5 border border-slate-700 overflow-hidden relative">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-300 rounded-full transition-all duration-700 shadow-[0_0_12px_rgba(52,211,153,0.8)] relative"
                    style={{ width: `${sess.batteryLevel}%` }}
                  >
                    <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.4),transparent)] animate-[shimmer_2s_infinite]" />
                  </div>
                </div>
              </div>

              {/* Detailed Metrics */}
              <div className="grid grid-cols-2 gap-2 text-xs py-2 bg-slate-950/40 rounded-xl p-3 border border-slate-800/80 my-3">
                <div>
                  <span className="text-slate-400 text-[10px] block">Energi Terisi</span>
                  <span className="font-extrabold text-emerald-300 text-sm">{sess.kwhDelivered} kWh</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Estimasi Selesai</span>
                  <span className="font-bold text-cyan-300 flex items-center gap-1 text-sm">
                    <Clock className="w-3 h-3" />
                    {sess.estimasiSelesaiMin} Menit
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Waktu Mulai</span>
                  <span className="font-mono text-slate-300">{sess.waktuMulai}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Pasokan EBT</span>
                  <span className="font-bold text-emerald-400 flex items-center gap-1">
                    <Sun className="w-3 h-3 text-amber-400" />
                    {sess.ebtSharePercent}% Green
                  </span>
                </div>
              </div>

              {/* Action Button */}
              {sess.statusSession === 'Charging' && isEditMode && (
                <button
                  onClick={() => handleStopSession(sess.id)}
                  className="w-full py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Power className="w-3.5 h-3.5 text-rose-400" />
                  <span>Selesaikan Sesi Charging</span>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Filter and Search Bar for SPKLU Stations */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Cari lokasi SPKLU, tipe charger, atau nama station..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <span className="text-xs font-bold text-slate-500 flex items-center gap-1 shrink-0">
            <Filter className="w-3.5 h-3.5" /> Filter Status:
          </span>
          {['ALL', 'ONLINE', 'CHARGING', 'MAINTENANCE'].map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                selectedStatusFilter === st
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* SPKLU Stations Grid / Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredStations.map((st) => (
          <div
            key={st.id}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-xl shrink-0 mt-0.5">
                    <Zap className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base">{st.namaStation}</h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{st.lokasi}</span>
                    </p>
                  </div>
                </div>

                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    st.status === 'Charging'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 animate-pulse'
                      : st.status === 'Online'
                      ? 'bg-blue-100 text-blue-800 border border-blue-300'
                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}
                >
                  ● {st.status}
                </span>
              </div>

              {/* Charger Specs Badges */}
              <div className="flex flex-wrap gap-2 my-4">
                <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1.5 border border-slate-200">
                  <Gauge className="w-3.5 h-3.5 text-emerald-600" />
                  {st.tipeCharger}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-bold flex items-center gap-1.5 border border-emerald-200">
                  <BatteryCharging className="w-3.5 h-3.5 text-emerald-600" />
                  {st.jumlahGun} Connector Gun
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-900 text-xs font-bold flex items-center gap-1.5 border border-amber-200">
                  <DollarSign className="w-3.5 h-3.5 text-amber-600" />
                  Rp {st.tarifPerKwh.toLocaleString('id-ID')}/kWh
                </span>
              </div>

              {/* EBT Clean Power Supply Bar */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-semibold flex items-center gap-1.5">
                    <Sun className="w-3.5 h-3.5 text-amber-500" />
                    <Wind className="w-3.5 h-3.5 text-teal-500" />
                    Pasokan Listrik EBT:
                  </span>
                  <span className="font-extrabold text-emerald-700">{st.ebtPercentage}% Clean Energy</span>
                </div>
                <div className="text-[11px] text-slate-500 font-medium leading-tight">
                  {st.sumberDayaEbt}
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden mt-1">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 via-emerald-500 to-teal-500 rounded-full"
                    style={{ width: `${st.ebtPercentage}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Bottom Footer Stats */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">
                Total Hari Ini: <strong className="text-slate-800">{st.totalKwhHariIni} kWh</strong> ({st.totalTransaksiHariIni} Transaksi)
              </span>

              <button
                onClick={() => {
                  setNewSession((prev) => ({ ...prev, stationId: st.id }));
                  setShowAddSessionModal(true);
                }}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition-all cursor-pointer flex items-center gap-1"
              >
                <BatteryCharging className="w-3.5 h-3.5" />
                <span>Mulai Sesi</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Add Session */}
      {showAddSessionModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <BatteryCharging className="w-5 h-5 text-emerald-600" />
                <span>Mulai Sesi Charging EV Baru</span>
              </h3>
              <button
                onClick={() => setShowAddSessionModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSession} className="space-y-4 text-xs font-semibold text-slate-700">
              <div>
                <label className="block text-slate-800 font-bold mb-1">Pilih SPKLU Location</label>
                <select
                  value={newSession.stationId}
                  onChange={(e) => setNewSession({ ...newSession, stationId: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-500"
                >
                  {stations.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.namaStation} ({s.tipeCharger})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-800 font-bold mb-1">Tipe / Model Kendaraan Listrik</label>
                <input
                  type="text"
                  value={newSession.tipeMobil}
                  onChange={(e) => setNewSession({ ...newSession, tipeMobil: e.target.value })}
                  placeholder="e.g. Hyundai Ioniq 5 / Wuling Air EV"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-800 font-bold mb-1">Plat Nomor EV</label>
                  <input
                    type="text"
                    value={newSession.platNomor}
                    onChange={(e) => setNewSession({ ...newSession, platNomor: e.target.value })}
                    placeholder="DE 1234 EV"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-800 font-bold mb-1">Daya Charger (kW)</label>
                  <input
                    type="number"
                    value={newSession.powerKw}
                    onChange={(e) => setNewSession({ ...newSession, powerKw: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-800 font-bold mb-1">Level Baterai Awal (%)</label>
                <input
                  type="range"
                  min="5"
                  max="95"
                  value={newSession.batteryLevel}
                  onChange={(e) => setNewSession({ ...newSession, batteryLevel: Number(e.target.value) })}
                  className="w-full accent-emerald-500"
                />
                <div className="text-right text-xs font-extrabold text-emerald-600 mt-1">
                  {newSession.batteryLevel}% Baterai
                </div>
              </div>

              <div>
                <label className="block text-slate-800 font-bold mb-1">Pemilik / Instansi</label>
                <input
                  type="text"
                  value={newSession.pemilik}
                  onChange={(e) => setNewSession({ ...newSession, pemilik: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddSessionModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md"
                >
                  Mulai Charging Now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Add Station */}
      {showAddStationModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-600" />
                <span>Tambah Lokasi SPKLU Baru</span>
              </h3>
              <button
                onClick={() => setShowAddStationModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateStation} className="space-y-4 text-xs font-semibold text-slate-700">
              <div>
                <label className="block text-slate-800 font-bold mb-1">Nama Station SPKLU</label>
                <input
                  type="text"
                  value={newStation.namaStation}
                  onChange={(e) => setNewStation({ ...newStation, namaStation: e.target.value })}
                  placeholder="e.g. SPKLU Dermaga Passo Baguala"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-800 font-bold mb-1">Alamat / Detail Lokasi</label>
                <input
                  type="text"
                  value={newStation.lokasi}
                  onChange={(e) => setNewStation({ ...newStation, lokasi: e.target.value })}
                  placeholder="Baguala, Ambon"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-800 font-bold mb-1">Tipe Charger</label>
                  <select
                    value={newStation.tipeCharger}
                    onChange={(e) =>
                      setNewStation({
                        ...newStation,
                        tipeCharger: e.target.value as SpkluStation['tipeCharger']
                      })
                    }
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Ultra Fast Charging (200kW DC)">Ultra Fast Charging (200kW DC)</option>
                    <option value="Fast Charging (60kW DC)">Fast Charging (60kW DC)</option>
                    <option value="Medium Charging (22kW AC)">Medium Charging (22kW AC)</option>
                    <option value="Dual Connector (DC+AC)">Dual Connector (DC+AC)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-800 font-bold mb-1">Jumlah Gun / Connector</label>
                  <input
                    type="number"
                    min="1"
                    max="8"
                    value={newStation.jumlahGun}
                    onChange={(e) => setNewStation({ ...newStation, jumlahGun: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-800 font-bold mb-1">Sumber Daya Energi EBT</label>
                <input
                  type="text"
                  value={newStation.sumberDayaEbt}
                  onChange={(e) => setNewStation({ ...newStation, sumberDayaEbt: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-800 font-bold mb-1">Bauran Energi EBT (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={newStation.ebtPercentage}
                  onChange={(e) => setNewStation({ ...newStation, ebtPercentage: Number(e.target.value) })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddStationModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md"
                >
                  Simpan SPKLU
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
