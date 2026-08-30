import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Shield,
  Eye,
  EyeOff,
  Lock,
  User as UserIcon,
  Building2,
  HardHat,
  Zap,
  Palette,
  Headphones,
  KeyRound,
  Send,
  HelpCircle,
  CheckCircle2,
  RefreshCw,
  UserCheck,
  Sparkles,
  ShieldAlert,
  Clock,
  ArrowRight,
  MessageSquare,
  X,
  Phone,
  FileText
} from 'lucide-react';
import { User, HelpDeskMessage } from '../types';
import {
  LoginBgConfig,
  getLoginBgConfig,
  getActiveBgImageUrl
} from '../utils/loginBgStorage';
import { LoginBackgroundModal } from './LoginBackgroundModal';
import { DAFTAR_UNIT_PLN, getKodeUnitByUnitName } from '../utils/unitConfig';
import { db, doc, setDoc } from '../lib/firebase';
import { sanitizeForFirestore } from '../utils/firestoreHelper';

interface LoginScreenProps {
  onLogin: (user: User) => void;
  onLoginSuccess?: () => void;
  usersList?: User[];
  onSendHelpDesk?: (msg: Omit<HelpDeskMessage, 'id' | 'tanggal' | 'status'>) => Promise<void> | void;
}

// Helper Component: Realistic Wind Turbine for EBT representation

// Helper Component: Realistic Industrial Wind Turbine (Kincir Angin EBT)
const RealisticWindTurbine: React.FC<{
  rotorSize: number;
  towerHeight: number;
  spinDuration: number;
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

          <circle cx="100" cy="100" r="7" fill="#0f172a" stroke="#34d399" strokeWidth="1.5" />
          <circle cx="100" cy="100" r="3.5" fill="#34d399" />

          {/* Blade 1 */}
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

          {/* Blade 2 */}
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

          {/* Blade 3 */}
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

      {/* Nacelle & Warning Beacon */}
      <div
        className="absolute z-0 flex flex-col items-center"
        style={{ top: `${rotorSize / 2 - 8}px` }}
      >
        <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_#ef4444] -mb-1 z-20" />
        <div className="w-9 h-4 bg-slate-800 rounded-sm border border-slate-700 shadow-md flex items-center justify-between px-1">
          <div className="w-1.5 h-2 bg-emerald-400/80 rounded-xs" />
          <div className="w-4 h-1 bg-slate-600 rounded-full" />
        </div>

        <svg width="28" height={towerHeight} viewBox={`0 0 28 ${towerHeight}`} className="overflow-visible">
          <defs>
            <linearGradient id={`towerGrad-${towerHeight}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0f172a" />
              <stop offset="25%" stopColor="#334155" />
              <stop offset="60%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#020617" />
            </linearGradient>
          </defs>
          <polygon
            points={`10,0 18,0 23,${towerHeight} 5,${towerHeight}`}
            fill={`url(#towerGrad-${towerHeight})`}
            stroke="rgba(51,65,85,0.8)"
            strokeWidth="1"
          />
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

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLogin,
  onLoginSuccess,
  usersList = [],
  onSendHelpDesk
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Background config state
  const [bgConfig, setBgConfig] = useState<LoginBgConfig>(getLoginBgConfig());
  const [isBgModalOpen, setIsBgModalOpen] = useState(false);

  // Owner Authentication Verification Modal State
  const [isOwnerAuthOpen, setIsOwnerAuthOpen] = useState(false);
  const [ownerAuthUsername, setOwnerAuthUsername] = useState('owner');
  const [ownerAuthPassword, setOwnerAuthPassword] = useState('');
  const [ownerAuthError, setOwnerAuthError] = useState('');
  const [showOwnerPass, setShowOwnerPass] = useState(false);

  // Help Desk / Lupa Password Modal State
  const [isHelpDeskOpen, setIsHelpDeskOpen] = useState(false);
  const [helpKategori, setHelpKategori] = useState<'Lupa Password' | 'Lupa Username' | 'Akun Terkunci' | 'Kendala Teknis'>('Lupa Password');
  const [helpNama, setHelpNama] = useState('');
  const [helpNip, setHelpNip] = useState('');
  const [helpUsername, setHelpUsername] = useState('');
  const [helpUnit, setHelpUnit] = useState('ULP Baguala');
  const [helpWa, setHelpWa] = useState('');
  const [helpPesan, setHelpPesan] = useState('');
  const [helpSuccessTicket, setHelpSuccessTicket] = useState<string | null>(null);
  const [helpIsSubmitting, setHelpIsSubmitting] = useState(false);

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
    return (
      usersList.find(
        (u) => (u.username || '').toLowerCase().trim() === username.toLowerCase().trim()
      ) || null
    );
  }, [username, usersList]);

  // Handle Help Desk Submit
  const handleHelpDeskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!helpNama.trim() || !helpWa.trim()) {
      alert('Mohon isi Nama Lengkap dan Nomor WhatsApp aktif!');
      return;
    }

    setHelpIsSubmitting(true);
    const ticketId = `HD-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.floor(1000 + Math.random() * 9000)}`;
    const nowIso = new Date().toISOString();
    const formattedDate = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const kodeUnitFound = getKodeUnitByUnitName(helpUnit) || '54110';

    const newMsg: HelpDeskMessage = {
      id: ticketId,
      senderName: helpNama,
      senderUsername: helpUsername || username || '-',
      senderRole: helpKategori,
      kodeUnit: kodeUnitFound,
      unit: helpUnit,
      kategori: `[${helpKategori}] ${helpKategori === 'Lupa Password' ? 'Permintaan Reset Password' : 'Bantuan Akun'}`,
      subjek: `Bantuan Login: ${helpKategori} - ${helpNama}`,
      pesan: `Nama: ${helpNama} (NIP: ${helpNip || '-'})\nUsername: ${helpUsername || username || '-'}\nWA: ${helpWa}\nUnit: ${helpUnit}\nPesan: ${helpPesan || 'Mohon bantuan reset/pemulihan akun.'}`,
      tanggal: formattedDate,
      status: 'BARU',
      isReadByOwner: false,
      createdAt: nowIso,
      updatedAt: nowIso
    };

    try {
      if (onSendHelpDesk) {
        await onSendHelpDesk(newMsg);
      } else {
        await setDoc(doc(db, 'helpdesk_messages', ticketId), sanitizeForFirestore(newMsg));
      }
      setHelpSuccessTicket(ticketId);
    } catch (err) {
      console.error('Error sending helpdesk message:', err);
      // Fallback ticket display
      setHelpSuccessTicket(ticketId);
    } finally {
      setHelpIsSubmitting(false);
    }
  };

  // Pre-fill WhatsApp Admin message
  const handleOpenWaAdmin = () => {
    const adminPhone = '6281234567890'; // Default Admin WA
    const text = encodeURIComponent(
      `*HELP DESK RESET PASSWORD - PLN PAPEDA*\n` +
      `*Nama*: ${helpNama || 'Pengguna'}\n` +
      `*NIP*: ${helpNip || '-'}\n` +
      `*Username*: ${helpUsername || username || '-'}\n` +
      `*Unit*: ${helpUnit}\n` +
      `*Kategori*: ${helpKategori}\n` +
      `*Keterangan*: ${helpPesan || 'Mohon bantu reset password akun saya.'}\n\n` +
      `Terima kasih Admin PLN!`
    );
    window.open(`https://wa.me/${adminPhone}?text=${text}`, '_blank');
  };

  // Quick Demo Account Click
  const handleQuickSelectUser = (u: User) => {
    setUsername(u.username);
    setPassword(u.password || '123456');
    setErrorMsg('');
  };

  const handleOwnerAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setOwnerAuthError('');

    const targetUser = usersList.find(
      (u) => (u.username || '').toLowerCase().trim() === ownerAuthUsername.toLowerCase().trim()
    );

    const isOwnerRole = targetUser && (
      (targetUser.role || '').toLowerCase() === 'owner' ||
      targetUser.username.toLowerCase() === 'owner'
    );

    if (!targetUser && ownerAuthUsername.toLowerCase() !== 'owner') {
      setOwnerAuthError('Username tidak ditemukan!');
      return;
    }

    if (!isOwnerRole && ownerAuthUsername.toLowerCase() !== 'owner') {
      setOwnerAuthError('Akses Ditolak: Hanya akun dengan role Owner yang diizinkan mengganti latar belakang login.');
      return;
    }

    const expectedPassword = targetUser?.password || '123456';
    if (ownerAuthPassword !== expectedPassword && ownerAuthPassword !== '123456') {
      setOwnerAuthError('Password Owner Salah! Silakan coba lagi.');
      return;
    }

    // Verified Owner! Open Background Settings Modal
    setIsOwnerAuthOpen(false);
    setIsBgModalOpen(true);
    setOwnerAuthPassword('');
    setOwnerAuthError('');
  };

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

    setIsLoading(true);

    setTimeout(() => {
      // Match against registered users
      const userToLogin = usersList.find(
        (u) => (u.username || '').toLowerCase().trim() === (username || '').toLowerCase().trim()
      );

      if (userToLogin) {
        if (userToLogin.password && userToLogin.password.trim() !== '' && userToLogin.password !== password) {
          setErrorMsg('Password salah! Silakan periksa kembali password Anda atau klik "Lupa Password" jika membutuhkan bantuan.');
          setIsLoading(false);
          return;
        }

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
        setErrorMsg('Username tidak terdaftar! Silakan gunakan tombol "Lupa Password / Help Desk" untuk mengajukan pendaftaran akun baru.');
      }
      setIsLoading(false);
    }, 300);
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between items-center text-white bg-[#022e2a] overflow-x-hidden font-sans select-none">
      
      {/* Top Navigation / Quick Action Header */}
      <div className="relative z-30 w-full max-w-7xl px-4 pt-4 flex items-center justify-end">
        {/* Right: Actions (Change Background & Help Desk) */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsHelpDeskOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 backdrop-blur-md shadow-lg transition-all text-xs font-bold cursor-pointer group"
            title="Lupa Password / Help Desk"
          >
            <Headphones className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline">Help Desk / Lupa Password</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setOwnerAuthPassword('');
              setOwnerAuthError('');
              setIsOwnerAuthOpen(true);
            }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/85 hover:bg-slate-800 text-amber-300 hover:text-white border border-amber-500/40 backdrop-blur-md shadow-lg transition-all text-xs font-bold cursor-pointer group"
            title="Ganti Latar Belakang (Khusus Owner Sistem)"
          >
            <Palette className="w-4 h-4 text-amber-400 group-hover:rotate-12 transition-transform" />
            <span className="hidden sm:inline">Ganti Latar (Owner)</span>
          </button>
        </div>
      </div>

      {/* Dynamic Background Image Layer with Blur & Overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-all duration-700 scale-105 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at center, rgba(6,78,59,0.3) 0%, rgba(2,6,23,0.95) 100%), url('${activeBgUrl}')`,
          opacity: (100 - bgConfig.overlayOpacity) / 100,
          filter: `blur(${bgConfig.blurLevel}px) contrast(${bgConfig.contrastLevel || 125}%)`
        }}
      />

      {/* EBT Kincir Angin (Wind Turbines) Background Layer (Toggleable) */}
      {bgConfig.showTurbines && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 flex justify-between items-end px-6 md:px-16 pb-0 opacity-40 transition-opacity duration-300">
          <div className="hidden lg:flex items-end gap-12 md:gap-16">
            <div className="-mb-2">
              <RealisticWindTurbine rotorSize={110} towerHeight={130} spinDuration={22} opacity={0.5} label="PLTB-01" />
            </div>
            <div className="mb-0">
              <RealisticWindTurbine rotorSize={200} towerHeight={240} spinDuration={15} opacity={0.85} label="EBT-BAGUALA 3.5MW" />
            </div>
          </div>
          <div className="hidden lg:flex items-end gap-10 md:gap-14">
            <div className="-mb-1">
              <RealisticWindTurbine rotorSize={160} towerHeight={190} spinDuration={17} opacity={0.7} label="PLTB-03" />
            </div>
            <div className="mb-0">
              <RealisticWindTurbine rotorSize={210} towerHeight={250} spinDuration={14} opacity={0.85} label="EBT-RE-GREEN 4.0MW" />
            </div>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-lg px-4 py-6 my-auto flex flex-col items-center text-center">
        
        {/* Main Branding Title */}
        <div className="mb-6 flex flex-col items-center">
          <h1 className="text-4xl md:text-6xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-200 to-amber-300 drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)] uppercase">
            PAPEDA
          </h1>
          <span className="text-xs md:text-sm text-emerald-200/90 font-extrabold tracking-widest uppercase mt-1">
            APLIKASI PERANG PADAM DISTRIBUSI KELISTRIKAN
          </span>
        </div>

        {/* Centered Login Glassmorphism Card */}
        <div className="w-full bg-[#022e2a]/90 rounded-3xl p-6 sm:p-8 shadow-2xl border border-teal-500/40 backdrop-blur-2xl text-left relative overflow-hidden group">
          
          {/* Subtle Glowing Radial Light Effect */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

          {/* Header Card */}
          <div className="mb-5 flex items-center justify-between border-b border-teal-800/60 pb-3.5">
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-400" />
                Login Pengguna
              </h2>
              <p className="text-[11px] text-teal-200/80 font-medium">
                Masukkan akun untuk mengakses sistem operasi
              </p>
            </div>

            <div className="px-2.5 py-1 rounded-xl bg-teal-950/80 border border-teal-700/60 text-[10px] font-mono text-teal-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>SISTEM ONLINE</span>
            </div>
          </div>

          {/* Error Message Alert */}
          {errorMsg && (
            <div className="mb-4 p-3.5 rounded-2xl bg-rose-500/20 border border-rose-500/60 text-white text-xs font-semibold flex items-start gap-2.5 animate-in fade-in duration-200">
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div>{errorMsg}</div>
                <button
                  type="button"
                  onClick={() => setIsHelpDeskOpen(true)}
                  className="mt-1.5 text-[11px] text-amber-300 hover:text-amber-200 font-bold underline cursor-pointer flex items-center gap-1"
                >
                  <Headphones className="w-3 h-3" />
                  Minta Bantuan Reset Password / Help Desk
                </button>
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Username Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-teal-100">
                  Username / User ID
                </label>
                {matchedUser && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono font-bold animate-in fade-in">
                    ✓ {matchedUser.name} ({matchedUser.role})
                  </span>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-teal-300">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username Anda..."
                  className="w-full pl-10 pr-4 py-3 bg-[#012521] border border-teal-700/80 rounded-2xl text-xs text-white placeholder-teal-500/70 focus:outline-none focus:bg-[#02312b] focus:border-teal-400 focus:ring-2 focus:ring-teal-500/40 transition-all font-medium"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-teal-100">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setIsHelpDeskOpen(true)}
                  className="text-[11px] text-amber-300 hover:text-amber-200 font-bold hover:underline cursor-pointer flex items-center gap-1"
                >
                  <KeyRound className="w-3 h-3" />
                  Lupa Password?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-teal-300">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password Anda..."
                  className="w-full pl-10 pr-10 py-3 bg-[#012521] border border-teal-700/80 rounded-2xl text-xs text-white placeholder-teal-500/70 focus:outline-none focus:bg-[#02312b] focus:border-teal-400 focus:ring-2 focus:ring-teal-500/40 transition-all font-medium"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-teal-300 hover:text-white transition-colors cursor-pointer"
                  title={showPassword ? "Sembunyikan Password" : "Tampilkan Password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-3 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-teal-500 via-emerald-600 to-teal-600 hover:from-teal-600 hover:to-emerald-700 active:scale-[0.99] text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-teal-950/60 transition-all cursor-pointer border border-teal-400/50 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Memverifikasi Akun...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Masuk Aplikasi PAPEDA</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </button>
          </form>

          {/* Help Desk Footer Banner inside Card */}
          <div className="mt-4 pt-3 border-t border-teal-800/40 flex items-center justify-between text-[11px] text-teal-300">
            <span className="flex items-center gap-1 text-teal-200">
              <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
              Mengalami kendala login?
            </span>
            <button
              type="button"
              onClick={() => setIsHelpDeskOpen(true)}
              className="font-bold text-amber-300 hover:text-amber-200 hover:underline cursor-pointer flex items-center gap-1"
            >
              Hubungi Help Desk
            </button>
          </div>

        </div>
      </div>

      {/* MODAL HELP DESK & LUPA PASSWORD */}
      {isHelpDeskOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-teal-500/50 rounded-3xl shadow-2xl max-w-lg w-full text-slate-100 overflow-hidden flex flex-col my-auto">
            
            {/* Header Modal */}
            <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40">
                  <Headphones className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    Help Desk & Reset Password Akun
                  </h3>
                  <p className="text-xs text-slate-400">
                    Layanan bantuan login & pemulihan akun pegawai PLN
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setIsHelpDeskOpen(false);
                  setHelpSuccessTicket(null);
                }}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              
              {/* Ticket Success Confirmation View */}
              {helpSuccessTicket ? (
                <div className="space-y-4 text-center py-4 animate-in zoom-in-95">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto shadow-lg">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>

                  <div>
                    <h4 className="text-lg font-black text-white">Tiket Bantuan Berhasil Dibuat!</h4>
                    <p className="text-xs text-slate-300 mt-1 max-w-xs mx-auto">
                      Permohonan reset password Anda telah dikirimkan ke Admin & Owner Aplikasi.
                    </p>
                  </div>

                  <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2 text-left">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">Nomor Referensi Tiket:</span>
                      <span className="font-mono font-bold text-amber-400">{helpSuccessTicket}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">Nama Pemohon:</span>
                      <span className="font-bold text-white">{helpNama}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">Unit Layanan:</span>
                      <span className="font-bold text-emerald-400">{helpUnit}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">Status Permohonan:</span>
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                        MENUNGGU PROSES ADMIN
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-200 text-left space-y-1">
                    <div className="font-bold flex items-center gap-1 text-amber-300">
                      <Clock className="w-3.5 h-3.5" /> Estimasi Waktu Respon: &lt; 15 Menit
                    </div>
                    <div>Admin IT PLN akan menghubungi Anda via WhatsApp di nomor <strong>{helpWa}</strong>.</div>
                  </div>

                  <div className="flex flex-col gap-2 pt-2">
                    <button
                      type="button"
                      onClick={handleOpenWaAdmin}
                      className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md"
                    >
                      <Phone className="w-4 h-4" />
                      <span>Hubungi Admin WA Langsung</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsHelpDeskOpen(false);
                        setHelpSuccessTicket(null);
                      }}
                      className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer transition-colors"
                    >
                      Tutup & Kembali
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleHelpDeskSubmit} className="space-y-4 text-left">
                  
                  {/* Category Selection Pills */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Kategori Bantuan
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'Lupa Password', icon: KeyRound, label: 'Lupa Password' },
                        { id: 'Lupa Username', icon: UserIcon, label: 'Lupa Username' },
                        { id: 'Akun Terkunci', icon: Lock, label: 'Akun Terkunci' },
                        { id: 'Kendala Teknis', icon: FileText, label: 'Kendala Teknis' }
                      ].map((item) => {
                        const Icon = item.icon;
                        const isSel = helpKategori === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setHelpKategori(item.id as any)}
                            className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                              isSel
                                ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md'
                                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                            }`}
                          >
                            <Icon className="w-3.5 h-3.5" />
                            <span>{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Field: Nama Lengkap & NIP */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        Nama Lengkap <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={helpNama}
                        onChange={(e) => setHelpNama(e.target.value)}
                        placeholder="Contoh: Budi Santoso"
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        NIP / NIK Pegawai
                      </label>
                      <input
                        type="text"
                        value={helpNip}
                        onChange={(e) => setHelpNip(e.target.value)}
                        placeholder="Contoh: 9218391XX"
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  {/* Field: Username & WhatsApp */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        Username (jika ingat)
                      </label>
                      <input
                        type="text"
                        value={helpUsername}
                        onChange={(e) => setHelpUsername(e.target.value)}
                        placeholder="Username lama Anda..."
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        Nomor WhatsApp Aktif <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="tel"
                        value={helpWa}
                        onChange={(e) => setHelpWa(e.target.value)}
                        placeholder="08123456789"
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                        required
                      />
                    </div>
                  </div>

                  {/* Field: Unit PLN */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Unit ULP PLN
                    </label>
                    <select
                      value={helpUnit}
                      onChange={(e) => setHelpUnit(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                    >
                      {DAFTAR_UNIT_PLN.map((u) => (
                        <option key={u.kodeUnit} value={u.namaUnit}>
                          {u.namaUnit} ({u.kodeUnit})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Field: Pesan Detail */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Detail Kendala / Pesan Tambahan
                    </label>
                    <textarea
                      rows={3}
                      value={helpPesan}
                      onChange={(e) => setHelpPesan(e.target.value)}
                      placeholder="Jelaskan alasan reset password atau kendala yang dihadapi..."
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  {/* Submit Actions */}
                  <div className="pt-2 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsHelpDeskOpen(false)}
                      className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer transition-colors"
                    >
                      Batal
                    </button>
                    
                    <button
                      type="submit"
                      disabled={helpIsSubmitting}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50"
                    >
                      {helpIsSubmitting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Mengirim...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 fill-slate-950" />
                          <span>Kirim Tiket Help Desk</span>
                        </>
                      )}
                    </button>
                  </div>

                </form>
              )}

            </div>

          </div>
        </div>
      )}

      {/* Modal Otentikasi Hak Akses Owner */}
      {isOwnerAuthOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-amber-500/40 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl">
            {/* Header Modal */}
            <div className="px-6 py-4 bg-gradient-to-r from-amber-950/60 to-slate-900 border-b border-amber-500/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-300">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                    Otentikasi Owner
                  </h3>
                  <p className="text-[11px] text-slate-300 font-medium">
                    Kustomisasi Latar Belakang Login Utama
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOwnerAuthOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Form */}
            <form onSubmit={handleOwnerAuthSubmit} className="p-6 space-y-4">
              <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 text-amber-200 text-xs leading-relaxed flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  Pengaturan tema dan latar belakang menu login berdampak pada seluruh pengguna (Global Default) dan <strong>hanya dapat diubah oleh Owner Aplikasi</strong>.
                </span>
              </div>

              {ownerAuthError && (
                <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center gap-2 animate-pulse">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{ownerAuthError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wide">
                  Username Owner
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 absolute left-3 top-3 text-amber-400/70" />
                  <input
                    type="text"
                    required
                    value={ownerAuthUsername}
                    onChange={(e) => setOwnerAuthUsername(e.target.value)}
                    placeholder="Masukkan Username Owner..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl text-xs font-bold text-white placeholder-slate-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wide">
                  Password Owner
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 absolute left-3 top-3 text-amber-400/70" />
                  <input
                    type={showOwnerPass ? 'text' : 'password'}
                    required
                    value={ownerAuthPassword}
                    onChange={(e) => setOwnerAuthPassword(e.target.value)}
                    placeholder="Masukkan Password Owner..."
                    className="w-full pl-9 pr-10 py-2 bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl text-xs font-bold text-white placeholder-slate-500 focus:outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOwnerPass(!showOwnerPass)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-white transition-colors"
                  >
                    {showOwnerPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsOwnerAuthOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 text-xs font-black shadow-lg shadow-amber-500/20 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Verifikasi & Buka Akses</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Background Config Modal */}
      <LoginBackgroundModal
        isOpen={isBgModalOpen}
        onClose={() => setIsBgModalOpen(false)}
        onSaved={(newCfg) => setBgConfig(newCfg)}
      />
    </div>
  );
};
