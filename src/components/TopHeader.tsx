import React, { useState } from 'react';
import { Menu, MessageSquare, CloudUpload, Search } from 'lucide-react';
import { User as UserType, ViewType } from '../types';
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
  onOpenBackupModal?: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  user,
  activeView,
  onSelectView,
  sidebarOpen,
  onToggleSidebar,
  onlineCount,
  onOpenBackupModal
}) => {
  const [isOnline, setIsOnline] = useState(typeof window !== 'undefined' ? window.navigator.onLine : true);
  const { searchTerm, setSearchTerm, setIsSearchOpen } = useSearch();

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
      {/* Left section: Hamburger, Clean PLN Logo, Title & Search */}
      <div className="flex flex-col gap-2">
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

          {/* New Global Search Trigger */}
          <div className="hidden lg:flex ml-4">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center gap-3 px-4 py-2 bg-teal-950/40 hover:bg-teal-900/60 border border-teal-500/30 rounded-xl text-teal-400 transition-all cursor-pointer group min-w-[280px]"
            >
              <Search className="w-4 h-4 group-hover:text-amber-400 transition-colors" />
              <span className="text-[11px] font-bold text-teal-200/50">Cari penyulang, gardu, atau gangguan...</span>
              <div className="ml-auto flex items-center gap-1 px-1.5 py-0.5 rounded bg-teal-800/40 text-[9px] font-black text-teal-500 border border-teal-500/20">
                <span>CTRL</span>
                <span>K</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Right Section: Header Navigation Menu */}
      <div className="flex items-center gap-2 sm:gap-3 bg-teal-950/70 border border-teal-500/40 p-1.5 rounded-2xl shadow-inner backdrop-blur-md">
        {/* Mobile Search Button */}
        <button
          onClick={() => setIsSearchOpen(true)}
          className="lg:hidden p-2.5 rounded-xl text-teal-100 hover:text-white hover:bg-teal-800/70 border border-teal-600/50 transition-all cursor-pointer shadow-md active:scale-95 group"
          title="Search"
        >
          <Search className="w-5 h-5 group-hover:scale-110 transition-transform" />
        </button>
      </div>

    </header>
  );
};


