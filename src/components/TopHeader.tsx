import React, { useState } from 'react';
import { Menu, MessageSquare } from 'lucide-react';
import { User as UserType, ViewType } from '../types';
import { HssePlnLogo } from './HssePlnLogo';
import { isOwnerUser } from '../utils/permissions';
import { useSearch } from '../context/SearchContext';

interface TopHeaderProps {
  user?: UserType;
  onLogout?: () => void;
  activeView: ViewType;
  onSelectView: (view: ViewType) => void;
  sidebarOpen?: boolean;
  onToggleSidebar?: () => void;
  onlineCount?: number;
  ownerSelectedUnitFilter?: string;
  onSelectUnitFilter?: (unit: string) => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  user,
  activeView,
  onSelectView,
  sidebarOpen,
  onToggleSidebar,
  onlineCount
}) => {
  const [isOnline, setIsOnline] = useState(typeof window !== 'undefined' ? window.navigator.onLine : true);
  const { searchTerm, setSearchTerm } = useSearch();

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const updateOnlineStatus = () => setIsOnline(window.navigator.onLine);
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  const isOwner = user && isOwnerUser(user);

  return (
    <header className="min-h-[96px] md:h-28 py-3.5 md:py-4 w-full bg-gradient-to-r from-[#022623] via-[#044c45] to-[#022e2a] border-b-2 border-teal-600/70 px-4 md:px-7 flex items-center justify-between z-30 shrink-0 shadow-2xl relative text-white transition-all">
      {/* Left section: Hamburger, Clean PLN Logo, Title */}
      <div className="flex items-center gap-3.5 md:gap-5">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="p-3 rounded-2xl text-teal-100 hover:text-white hover:bg-teal-800/70 border border-teal-600/50 transition-all cursor-pointer shadow-md active:scale-95 group"
            title="Toggle Navigation Menu"
          >
            <Menu className="w-6 h-6 group-hover:scale-110 transition-transform" />
          </button>
        )}

        <div className="flex items-center gap-2">
          <h1 className="text-xl md:text-2xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-200 to-amber-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] uppercase">
            PAPEDA
          </h1>
        </div>
      </div>

      {/* Middle/Right Section: Search, Live Chat, Online Monitoring, K3 Logo */}
      <div className="flex items-center gap-2.5 md:gap-4">
        
        {/* Search Input */}
        <div className="hidden md:flex items-center bg-[#012521] border border-teal-700 rounded-xl px-3 py-2 shadow-inner">
          <input
            type="text"
            placeholder="Cari penyulang, section, ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent text-xs text-white placeholder-teal-400 focus:outline-none w-48"
          />
        </div>

        <button
          onClick={() => onSelectView('live_chat')}
          className={`hidden sm:flex items-center gap-2.5 px-4 py-2.5 rounded-2xl text-xs md:text-sm font-bold transition-all cursor-pointer border shadow-md backdrop-blur-xs ${
            activeView === 'live_chat'
              ? 'bg-teal-400 text-slate-950 border-teal-200 shadow-teal-500/40 scale-105'
              : 'bg-teal-900/70 text-white hover:bg-teal-800/90 border-teal-500/60 hover:border-teal-300'
          }`}
          title="Buka Live Chat"
        >
          <MessageSquare className={`w-4 h-4 md:w-5 md:h-5 ${activeView === 'live_chat' ? 'text-slate-950' : 'text-teal-300'}`} />
          <span>Live Chat</span>
        </button>

        {isOwner && (
          <button
            onClick={() => onSelectView('monitoring_online')}
            className={`hidden sm:flex items-center gap-2.5 px-4 py-2.5 rounded-2xl text-xs md:text-sm font-bold transition-all cursor-pointer border shadow-md backdrop-blur-xs ${
              activeView === 'monitoring_online'
                ? 'bg-emerald-400 text-slate-950 border-emerald-200 shadow-emerald-400/40 scale-105'
                : 'bg-[#02312b]/85 text-white hover:bg-teal-800/90 border-teal-500/60 hover:border-emerald-300'
            }`}
            title="Buka Monitoring User Online (Live)"
          >
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400"></span>
            </span>
            <span className="text-white font-black">{onlineCount !== undefined ? `${onlineCount} Online` : 'Live Online'}</span>
            <span className="px-2 py-0.5 bg-emerald-500/30 text-emerald-200 text-[10px] font-black rounded-md uppercase border border-emerald-400/40">
              Sistem
            </span>
          </button>
        )}

        {/* Logo K3 HSSE PLN */}
        <div className="p-2 md:p-2.5 rounded-2xl bg-[#022320]/70 border border-teal-500/40 shadow-md backdrop-blur-xs">
          <HssePlnLogo size="lg" showText={true} />
        </div>
      </div>
    </header>
  );
};


