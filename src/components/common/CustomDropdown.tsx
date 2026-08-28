import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Search, X } from 'lucide-react';

export interface DropdownOption {
  value: string;
  label: string;
  subLabel?: string;
  icon?: React.ReactNode;
  badge?: string;
}

interface CustomDropdownProps {
  options: (DropdownOption | string)[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  labelPrefix?: string;
  icon?: React.ReactNode;
  className?: string;
  buttonClassName?: string;
  menuClassName?: string;
  align?: 'left' | 'right';
  searchable?: boolean;
  searchPlaceholder?: string;
  disabled?: boolean;
  id?: string;
  variant?: 'teal' | 'dark' | 'light' | 'amber';
}

export const CustomDropdown: React.FC<CustomDropdownProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Pilih...',
  labelPrefix,
  icon,
  className = '',
  buttonClassName = '',
  menuClassName = '',
  align = 'left',
  searchable,
  searchPlaceholder = 'Cari opsi...',
  disabled = false,
  id,
  variant = 'teal'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Normalize options
  const normalizedOptions: DropdownOption[] = options.map((opt) => {
    if (typeof opt === 'string') {
      return { value: opt, label: opt };
    }
    return opt;
  });

  const selectedOption = normalizedOptions.find((opt) => opt.value === value);

  // Should we enable search automatically if options > 6?
  const isSearchEnabled = searchable !== undefined ? searchable : normalizedOptions.length > 7;

  // Filter options by search term
  const filteredOptions = normalizedOptions.filter((opt) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      opt.label.toLowerCase().includes(term) ||
      (opt.subLabel && opt.subLabel.toLowerCase().includes(term)) ||
      opt.value.toLowerCase().includes(term)
    );
  });

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
      if (isSearchEnabled && searchInputRef.current) {
        setTimeout(() => searchInputRef.current?.focus(), 50);
      }
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isSearchEnabled]);

  // Variant styling
  const variantStyles = {
    teal: {
      button: 'bg-[#011a18] border-teal-600/70 text-teal-100 hover:border-amber-400 hover:text-white',
      menu: 'bg-[#021f1d] border-teal-500/80 text-teal-100 divide-teal-900/60',
      activeItem: 'bg-teal-900/80 text-amber-300 font-black',
      hoverItem: 'hover:bg-teal-900/50 hover:text-white',
      search: 'bg-[#011211] border-teal-700/60 text-white placeholder-teal-500/60 focus:border-amber-400'
    },
    dark: {
      button: 'bg-[#0f172a] border-slate-700 text-slate-200 hover:border-amber-400 hover:text-white',
      menu: 'bg-[#0a0f1d] border-slate-700 text-slate-200 divide-slate-800',
      activeItem: 'bg-slate-800 text-amber-300 font-black',
      hoverItem: 'hover:bg-slate-800/60 hover:text-white',
      search: 'bg-[#060913] border-slate-800 text-white placeholder-slate-500 focus:border-amber-400'
    },
    amber: {
      button: 'bg-[#1a1408] border-amber-500/60 text-amber-200 hover:border-amber-400 hover:text-amber-100',
      menu: 'bg-[#181105] border-amber-500/70 text-amber-100 divide-amber-900/50',
      activeItem: 'bg-amber-950/90 text-amber-300 font-black border-l-2 border-amber-400',
      hoverItem: 'hover:bg-amber-950/50 hover:text-white',
      search: 'bg-[#0d0902] border-amber-800 text-amber-100 placeholder-amber-500/50 focus:border-amber-400'
    },
    light: {
      button: 'bg-white border-slate-300 text-slate-800 hover:border-teal-500',
      menu: 'bg-white border-slate-200 text-slate-800 divide-slate-100 shadow-xl',
      activeItem: 'bg-teal-50 text-teal-700 font-black',
      hoverItem: 'hover:bg-slate-50 hover:text-slate-900',
      search: 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-teal-500'
    }
  }[variant];

  return (
    <div
      ref={dropdownRef}
      id={id}
      className={`relative inline-block text-left ${className}`}
    >
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`flex items-center justify-between gap-2 px-3 py-2 border rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-xs select-none ${
          variantStyles.button
        } ${isOpen ? 'ring-2 ring-amber-400/40 border-amber-400' : ''} ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        } ${buttonClassName}`}
      >
        <div className="flex items-center gap-2 truncate text-left">
          {icon && <span className="shrink-0">{icon}</span>}
          {labelPrefix && (
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">
              {labelPrefix}
            </span>
          )}
          <span className="truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 shrink-0 opacity-75 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-amber-400' : ''
          }`}
        />
      </button>

      {/* DROPDOWN MENU POPOVER - GUARANTEED TO OPEN DOWNWARDS */}
      {isOpen && (
        <div
          role="listbox"
          className={`absolute top-full ${
            align === 'right' ? 'right-0' : 'left-0'
          } mt-1.5 z-[9999] min-w-[240px] max-w-[340px] sm:max-w-[420px] max-h-80 overflow-y-auto rounded-xl border shadow-2xl backdrop-blur-lg flex flex-col p-1.5 animate-in fade-in slide-in-from-top-2 duration-150 ${
            variantStyles.menu
          } ${menuClassName}`}
          style={{
            // Explicitly force opening downwards below trigger button
            position: 'absolute',
            top: '100%'
          }}
        >
          {/* Optional Search inside Dropdown */}
          {isSearchEnabled && (
            <div className="p-1.5 sticky top-0 z-10 bg-inherit pb-2 mb-1 border-b border-inherit">
              <div className="relative flex items-center">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={searchPlaceholder}
                  className={`w-full pl-8 pr-7 py-1.5 rounded-lg text-xs font-medium focus:outline-none transition-all ${variantStyles.search}`}
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2 text-slate-400 hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Options List */}
          <div className="flex flex-col gap-0.5 max-h-60 overflow-y-auto pr-0.5">
            {filteredOptions.length === 0 ? (
              <div className="py-4 px-3 text-center text-xs text-slate-400 italic">
                Tidak ada opsi yang cocok
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                      setSearchTerm('');
                    }}
                    className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-xs transition-all text-left cursor-pointer ${
                      isSelected
                        ? variantStyles.activeItem
                        : variantStyles.hoverItem
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                      <div className="truncate">
                        <div className="font-bold truncate">{opt.label}</div>
                        {opt.subLabel && (
                          <div className="text-[10px] opacity-70 truncate font-normal">
                            {opt.subLabel}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {opt.badge && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          {opt.badge}
                        </span>
                      )}
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
