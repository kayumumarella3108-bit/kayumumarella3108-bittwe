import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Search, X, Zap, MapPin, ClipboardList, Activity, ArrowRight } from 'lucide-react';

interface SearchContextType {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  isSearchOpen: boolean;
  setIsSearchOpen: (isOpen: boolean) => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export const SearchProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Close search on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSearchChange = useCallback((term: string) => {
    setSearchTerm(term);
  }, []);

  return (
    <SearchContext.Provider value={{ searchTerm, setSearchTerm: handleSearchChange, isSearchOpen, setIsSearchOpen }}>
      {children}
      
      {/* Global Search UI with Transition Animation */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-start justify-center pt-20 px-4 bg-slate-950/60 backdrop-blur-sm"
            onClick={() => setIsSearchOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full max-w-2xl bg-[#022e2a] border border-teal-500/30 shadow-2xl rounded-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-teal-800/50 flex items-center gap-3">
                <Search className="w-5 h-5 text-teal-400 shrink-0" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Cari penyulang, gardu, atau gangguan..."
                  className="flex-1 bg-transparent border-none outline-none text-white placeholder-teal-500/60 font-bold text-base"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button 
                  onClick={() => setIsSearchOpen(false)}
                  className="p-1 rounded-lg hover:bg-teal-900/50 text-teal-500 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search Results with Fade-In Animation */}
              <div className="max-h-[60vh] overflow-y-auto p-2">
                <AnimatePresence mode="wait">
                  {searchTerm.trim() ? (
                    <motion.div
                      key="results"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="space-y-1"
                    >
                      <div className="px-3 py-2 text-[10px] font-black text-teal-500 uppercase tracking-widest">
                        Hasil Pencarian untuk "{searchTerm}"
                      </div>
                      
                      {/* Mocked Search Results for visual representation */}
                      {[
                        { icon: Zap, title: "Penyulang Namlea", desc: "ULP Namlea • 24 km", category: "Feeder" },
                        { icon: Activity, title: "Gangguan Trip F1", desc: "Penyulang Baguala • 12:40 WIB", category: "Gangguan" },
                        { icon: MapPin, title: "Gardu BR-04", desc: "ULP Nusaniwe • Sempurna", category: "Gardu" },
                      ].map((item, i) => (
                        <button
                          key={i}
                          className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-teal-900/40 text-left transition-all group"
                          onClick={() => setIsSearchOpen(false)}
                        >
                          <div className="w-10 h-10 rounded-xl bg-teal-900/50 flex items-center justify-center border border-teal-500/20 text-teal-400 group-hover:scale-110 transition-transform">
                            <item.icon className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">{item.title}</div>
                            <div className="text-xs text-teal-400/70 font-medium">{item.desc}</div>
                          </div>
                          <div className="px-2 py-0.5 rounded bg-teal-500/10 text-teal-400 text-[9px] font-black uppercase border border-teal-500/20">
                            {item.category}
                          </div>
                          <ArrowRight className="w-4 h-4 text-teal-700 opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0" />
                        </button>
                      ))}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="py-12 flex flex-col items-center justify-center text-center px-6"
                    >
                      <div className="w-16 h-16 rounded-3xl bg-teal-950/50 flex items-center justify-center mb-4 border border-teal-800/30">
                        <Search className="w-8 h-8 text-teal-800" />
                      </div>
                      <h4 className="text-white font-bold mb-1">Mulai Mengetik...</h4>
                      <p className="text-sm text-teal-500 font-medium max-w-[280px]">
                        Cari data operasional, penyulang, atau gardu secara instan di seluruh sistem.
                      </p>
                      
                      <div className="mt-8 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-teal-950/30 border border-teal-800/20 text-[10px] font-black text-teal-600">
                        <span className="px-1 py-0.5 rounded bg-teal-800/40 text-teal-300">CTRL</span>
                        <span>+</span>
                        <span className="px-1 py-0.5 rounded bg-teal-800/40 text-teal-300">K</span>
                        <span className="ml-2">UNTUK PINTASAN CEPAT</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </SearchContext.Provider>
  );
};

export const useSearch = () => {
  const context = useContext(SearchContext);
  if (!context) throw new Error('useSearch must be used within a SearchProvider');
  return context;
};
