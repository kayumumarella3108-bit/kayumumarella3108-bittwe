import React, { useState, useMemo, useEffect } from 'react';
import { Shield, Eye, EyeOff, Lock, User as UserIcon, Building2, HardHat, Zap, Leaf, AlertTriangle, Sun, Wind, Activity, Sparkles, Palette, Hash, Wrench } from 'lucide-react';
import { User } from '../types';
import {
  LoginBgConfig,
  getLoginBgConfig,
  getActiveBgImageUrl
} from '../utils/loginBgStorage';
import { LoginBackgroundModal } from './LoginBackgroundModal';
import { DAFTAR_UNIT_PLN, getKodeUnitByUnitName, getUnitNameByKodeUnit } from '../utils/unitConfig';

interface LoginScreenProps {
  onLogin: (user: User) => void;
  onLoginSuccess?: () => void;
  usersList?: User[];
}

// Helper Component: Realistic Industrial Wind Turbine (Kincir Angin EBT)
const RealisticWindTurbine: React.FC<{
  rotorSize: number;
  towerHeight: number;
  spinDuration: number; // seconds per turn
  opacity?: number;
  label?: string;
}> = ({ rotorSize, towerHeight, spinDuration, opacity = 0.7, label }) => {
  return (
    <div className="flex flex-col items-center relative select-none pointer-events-none group" style={{ opacity }}>
      {/* Rotating Rotor & Blades */}
      <div
        className="relative z-10 origin-center"
        style={{
          width: `${rotorSize}px`,
          height: `${rotorSize}px`,
          animation: `spin ${spinDuration}s linear infinite`
        }}
      >
        <svg viewBox="0 0 200 200" className="w-full h-full filter drop-shadow-[0_0_10px_rgba(52,211,153,0.25)]">
          <defs>
            <linearGradient id={`bladeGrad-${rotorSize}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#475569" />
              <stop offset="60%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
            <linearGradient id={`bladeHighlight-${rotorSize}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#34d399" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#059669" stopOpacity="0.2" />
            </linearGradient>
          </defs>

          {/* Center Hub Nose Cone */}
          <circle cx="100" cy="100" r="7" fill="#0f172a" stroke="#34d399" strokeWidth="1.5" />
          <circle cx="100" cy="100" r="3.5" fill="#34d399" />

          {/* Blade 1 (Top) - Realistic Aerodynamic Airfoil Taper */}
          <path
            d="M100 95 C97 75, 92 35, 97 8 C99 2, 101 2, 103 8 C108 35, 103 75, 100 95 Z"
            fill={`url(#bladeGrad-${rotorSize})`}
            stroke="rgba(52,211,153,0.4)"
            strokeWidth="0.8"
          />
          {/* Leading Edge Gloss */}
          <path
            d="M100 95 C98 75, 94 35, 97 8 C98.5 4, 99.5 4, 100 8 C98 35, 99 75, 100 95 Z"
            fill={`url(#bladeHighlight-${rotorSize})`}
          />

          {/* Blade 2 (120 Deg) */}
          <g transform="rotate(120 100 100)">
            <path
              d="M100 95 C97 75, 92 35, 97 8 C99 2, 101 2, 103 8 C108 35, 103 75, 100 95 Z"
              fill={`url(#bladeGrad-${rotorSize})`}
              stroke="rgba(52,211,153,0.4)"
              strokeWidth="0.8"
            />
            <path
              d="M100 95 C98 75, 94 35, 97 8 C98.5 4, 99.5 4, 100 8 C98 35, 99 75, 100 95 Z"
              fill={`url(#bladeHighlight-${rotorSize})`}
            />
          </g>

          {/* Blade 3 (240 Deg) */}
          <g transform="rotate(240 100 100)">
            <path
              d="M100 95 C97 75, 92 35, 97 8 C99 2, 101 2, 103 8 C108 35, 103 75, 100 95 Z"
              fill={`url(#bladeGrad-${rotorSize})`}
              stroke="rgba(52,211,153,0.4)"
              strokeWidth="0.8"
            />
            <path
              d="M100 95 C98 75, 94 35, 97 8 C98.5 4, 99.5 4, 100 8 C98 35, 99 75, 100 95 Z"
              fill={`url(#bladeHighlight-${rotorSize})`}
            />
          </g>
        </svg>
      </div>

      {/* Nacelle (Generator Housing) & Red Warning Beacon Light */}
      <div
        className="absolute z-0 flex flex-col items-center"
        style={{ top: `${rotorSize / 2 - 8}px` }}
      >
        {/* Red blinking aviation safety light */}
        <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_#ef4444] -mb-1 z-20" />

        {/* Nacelle Housing */}
        <div className="w-9 h-4 bg-slate-800 rounded-sm border border-slate-700 shadow-md flex items-center justify-between px-1">
          <div className="w-1.5 h-2 bg-emerald-400/80 rounded-xs" />
          <div className="w-4 h-1 bg-slate-600 rounded-full" />
        </div>

        {/* Tapered Steel Tubular Tower */}
        <svg
          width="28"
          height={towerHeight}
          viewBox={`0 0 28 ${towerHeight}`}
          className="overflow-visible"
        >
          <defs>
            <linearGradient id={`towerGrad-${towerHeight}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0f172a" />
              <stop offset="25%" stopColor="#334155" />
              <stop offset="60%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#020617" />
            </linearGradient>
          </defs>
          {/* Tower stem */}
          <polygon
            points={`10,0 18,0 23,${towerHeight} 5,${towerHeight}`}
            fill={`url(#towerGrad-${towerHeight})`}
            stroke="rgba(51,65,85,0.8)"
            strokeWidth="1"
          />
          {/* Horizontal platform rings */}
          <line x1="9" y1={towerHeight * 0.3} x2="19" y2={towerHeight * 0.3} stroke="#475569" strokeWidth="0.8" />
          <line x1="8" y1={towerHeight * 0.6} x2="20" y2={towerHeight * 0.6} stroke="#475569" strokeWidth="0.8" />
        </svg>
      </div>

      {label && (
        <span className="absolute -bottom-6 text-[9px] font-mono font-bold text-emerald-400/60 uppercase tracking-widest whitespace-nowrap">
          {label}
        </span>
      )}
    </div>
  );
};

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, onLoginSuccess, usersList = [] }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [bgConfig, setBgConfig] = useState<LoginBgConfig>(getLoginBgConfig());
  const [isBgModalOpen, setIsBgModalOpen] = useState(false);

  useEffect(() => {
    const handleBgUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<LoginBgConfig>;
      if (customEvent.detail) {
        setBgConfig(customEvent.detail);
      } else {
        setBgConfig(getLoginBgConfig());
      }
    };
    window.addEventListener('pln_login_bg_updated', handleBgUpdate);
    return () => {
      window.removeEventListener('pln_login_bg_updated', handleBgUpdate);
    };
  }, []);

  const activeBgUrl = getActiveBgImageUrl(bgConfig);

  // Auto-detect matched user from username
  const matchedUser = useMemo(() => {
    if (!username.trim()) return null;
    return usersList.find(
      (u) => (u.username || '').toLowerCase().trim() === username.toLowerCase().trim()
    ) || null;
  }, [username, usersList]);

  // Determine current unit and kodeUnit based on matched user
  const activeUnitName = useMemo(() => {
    if (matchedUser?.unit) return matchedUser.unit;
    return 'ULP Baguala';
  }, [matchedUser]);

  const activeKodeUnit = useMemo(() => {
    if (matchedUser?.kodeUnit) return matchedUser.kodeUnit;
    return getKodeUnitByUnitName(activeUnitName);
  }, [matchedUser, activeUnitName]);

  // Dynamic daily K3 safety message updated per day
  const dailySafetyInfo = useMemo(() => {
    const today = new Date();
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const dayName = days[today.getDay()];
    const formattedDate = today.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

    const messagesByDay: Record<number, string> = {
      0: "⚡ PIKET SIAGA MINGGU: Selalu Lakukan Grounding Lokal & Periksa Kelayakan APD Sebelum Manuver Jaringan 20kV ⚡",
      1: "⚡ SENIN SAFETY TALK: Wajib Gunakan APD Lengkap (Helm, Sepatu Safety, Sarung Tangan Tahan Tegangan 20kV & Body Harness) Sebelum Pekerjaan ⚡",
      2: "⚡ SELASA BEBAS BAHAYA LISTRIK: Gunakan Voltage Detector Untuk Memastikan Jaringan 20kV Bertegangan Nol Sebelum Sentuh Konduktor ⚡",
      3: "⚡ RABU INSPEKSI ALKER & APD: Rutin Cek Kondisi Kelayakan Tangga, Sarung Tangan Karet 20kV, dan Sabuk Pengaman ⚡",
      4: "⚡ KAMIS KESELAMATAN ROW POHON: Utamakan Jarak Aman minimal 2.5 Meter Dari Jaringan 20kV Saat Penebangan & Pemangkasan Ranting ⚡",
      5: "⚡ JUMAT K3 PEMELIHARAAN: Operasikan Fused Cut Out (FCO) & LBS Sesuai SOP Tanpa Beban & Pastikan Koordinasi Tim Jelas ⚡",
      6: "⚡ SABTU PENANGANAN GANGGUAN: Jaga Kewaspadaan & Komunikasi Tim Saat Pekerjaan Darurat Malam/Kondisi Hujan ⚡"
    };

    const tip = messagesByDay[today.getDay()] || messagesByDay[1];
    return {
      dayName,
      formattedDate,
      fullMessage: `[HARI ${dayName.toUpperCase()}, ${formattedDate.toUpperCase()}] ${tip} • ZERO ACCIDENT PLN ULP BAGUALA`
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!username.trim()) {
      setErrorMsg('Username tidak boleh kosong');
      return;
    }
    if (!password.trim()) {
      setErrorMsg('Password tidak boleh kosong');
      return;
    }

    // Match against registered users
    const userToLogin = usersList.find(
      (u) => (u.username || '').toLowerCase().trim() === (username || '').toLowerCase().trim()
    );

    if (userToLogin) {
      // Validate password if user has a password set
      if (userToLogin.password && userToLogin.password.trim() !== '' && userToLogin.password !== password) {
        setErrorMsg('Password salah! Periksa kembali password Anda.');
        return;
      }

      // Ensure unit and kodeUnit are set on logged-in user object
      const finalUnit = userToLogin.unit || 'ULP Baguala';
      const finalKodeUnit = userToLogin.kodeUnit || getKodeUnitByUnitName(finalUnit);

      const authenticatedUser: User = {
        ...userToLogin,
        unit: finalUnit,
        kodeUnit: finalKodeUnit
      };

      onLogin(authenticatedUser);
      if (onLoginSuccess) onLoginSuccess();
    } else {
      setErrorMsg('Username tidak terdaftar! Silakan hubungi Koordinator atau Admin Aplikasi untuk mendaftarkan akun Anda.');
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between items-center text-white bg-[#022e2a] overflow-x-hidden font-sans">
      {/* Top Right Quick Action: Ganti Latar Belakang Login */}
      <div className="absolute top-4 right-4 z-30">
        <button
          type="button"
          onClick={() => setIsBgModalOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/85 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700/80 backdrop-blur-md shadow-lg transition-all text-xs font-bold cursor-pointer group"
          title="Ganti Latar Belakang / Tema Menu Login"
        >
          <Palette className="w-4 h-4 text-amber-400 group-hover:rotate-12 transition-transform" />
          <span className="hidden sm:inline">Ganti Latar Belakang</span>
        </button>
      </div>

      {/* Dynamic Background Image Layer with User Configurable Overlay & Blur */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-all duration-500 scale-105"
        style={{
          backgroundImage: `radial-gradient(circle at center, rgba(6,78,59,0.3) 0%, rgba(2,6,23,0.95) 100%), url('${activeBgUrl}')`,
          opacity: (100 - bgConfig.overlayOpacity) / 100,
          filter: `blur(${bgConfig.blurLevel}px) contrast(${bgConfig.contrastLevel || 125}%)`
        }}
      />

      {/* Animated EBT Background Kincir Angin (Wind Turbines) Backdrop Layer (Toggleable) */}
      {bgConfig.showTurbines && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 flex justify-between items-end px-6 md:px-16 pb-0 opacity-40 transition-opacity duration-300">
          {/* Left Side Wind Turbines (Foreground & Background Perspective) */}
          <div className="hidden lg:flex items-end gap-12 md:gap-16">
            {/* Distant Small Turbine */}
            <div className="-mb-2">
              <RealisticWindTurbine
                rotorSize={110}
                towerHeight={130}
                spinDuration={22}
                opacity={0.5}
                label="PLTB-01"
              />
            </div>

            {/* Foreground Main Large Turbine */}
            <div className="mb-0">
              <RealisticWindTurbine
                rotorSize={200}
                towerHeight={240}
                spinDuration={15}
                opacity={0.85}
                label="EBT-BAGUALA 3.5MW"
              />
            </div>

            {/* Midground Medium Turbine */}
            <div className="-mb-1">
              <RealisticWindTurbine
                rotorSize={150}
                towerHeight={180}
                spinDuration={18}
                opacity={0.65}
                label="PLTB-02"
              />
            </div>
          </div>

          {/* Center Wind Stream Lines Overlay (Toggleable) */}
          {bgConfig.showStreamLines && (
            <div className="absolute inset-x-0 bottom-12 h-32 pointer-events-none opacity-20">
              <svg className="w-full h-full" viewBox="0 0 1200 120" preserveAspectRatio="none">
                <path
                  d="M0 40 Q 300 10, 600 50 T 1200 30"
                  fill="none"
                  stroke="#34d399"
                  strokeWidth="1.5"
                  strokeDasharray="12 8"
                  className="animate-[pulse_3s_infinite]"
                />
                <path
                  d="M0 80 Q 400 100, 800 60 T 1200 90"
                  fill="none"
                  stroke="#22d3ee"
                  strokeWidth="1.2"
                  strokeDasharray="16 10"
                  className="animate-[pulse_4s_infinite]"
                />
              </svg>
            </div>
          )}

          {/* Right Side Wind Turbines (Foreground & Midground) */}
          <div className="hidden lg:flex items-end gap-10 md:gap-14">
            {/* Midground Medium Turbine */}
            <div className="-mb-1">
              <RealisticWindTurbine
                rotorSize={160}
                towerHeight={190}
                spinDuration={17}
                opacity={0.7}
                label="PLTB-03"
              />
            </div>

            {/* Foreground Large Turbine */}
            <div className="mb-0">
              <RealisticWindTurbine
                rotorSize={210}
                towerHeight={250}
                spinDuration={14}
                opacity={0.85}
                label="EBT-RE-GREEN 4.0MW"
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-xl px-4 py-8 my-auto flex flex-col items-center text-center">
        
        {/* Title / Header */}
        <div className="mb-6 flex flex-col items-center">
            <h1 className="text-4xl md:text-6xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-200 to-amber-300 drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)] uppercase">
              PAPEDA
            </h1>
            <span className="text-sm md:text-base text-white/90 font-bold tracking-widest uppercase">Aplikasi Perang Padam</span>
        </div>

        {/* Centered Login Form Card */}
        <div className="w-full max-w-md bg-[#022e2a]/95 rounded-2xl p-7 shadow-2xl border border-teal-500/30 backdrop-blur-md text-left">
          <div className="mb-4">
            <h2 className="text-base font-extrabold text-white">Login</h2>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/20 border border-rose-500/50 text-white text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username Field */}
            <div>
              <label className="block text-xs font-bold text-teal-100 mb-1.5">
                Username / User ID
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-teal-300">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username..."
                  className="w-full pl-10 pr-4 py-2.5 bg-[#012521] border border-teal-700 rounded-xl text-xs text-white placeholder-teal-500 focus:outline-none focus:bg-[#02312b] focus:border-teal-400 focus:ring-2 focus:ring-teal-500/30 transition-all font-medium"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-bold text-teal-100 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-teal-300">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password..."
                  className="w-full pl-10 pr-10 py-2.5 bg-[#012521] border border-teal-700 rounded-xl text-xs text-white placeholder-teal-500 focus:outline-none focus:bg-[#02312b] focus:border-teal-400 focus:ring-2 focus:ring-teal-500/30 transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-teal-300 hover:text-white transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 active:from-teal-800 active:to-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-teal-950/40 transition-all cursor-pointer border border-teal-500/50"
            >
              <Lock className="w-4 h-4" />
              Login
            </button>
          </form>

          {/* Removed Support Badge */}
        </div>
      </div>

      {/* Floating Bottom Left Badge */}
      <div className="relative z-10 w-full px-6 py-4 flex justify-between items-end pointer-events-none">
      </div>

      {/* Modal Pengaturan & Ganti Latar Belakang Login */}
      <LoginBackgroundModal
        isOpen={isBgModalOpen}
        onClose={() => setIsBgModalOpen(false)}
        onSaved={(newCfg) => setBgConfig(newCfg)}
      />
    </div>
  );
};


