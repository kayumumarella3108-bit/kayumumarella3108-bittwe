import React from 'react';
import { Search, Building2, RotateCcw } from 'lucide-react';
import { DAFTAR_UNIT_PLN } from '../../utils/unitConfig';
import { MasterUnitPLN } from '../../types';

interface UnitFilterBarProps {
  selectedUnit: string;
  onSelectUnit: (unit: string) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  masterUnitList?: MasterUnitPLN[];
  placeholder?: string;
  className?: string;
}

export const UnitFilterBar: React.FC<UnitFilterBarProps> = ({
  selectedUnit,
  onSelectUnit,
  searchQuery = '',
  onSearchChange,
  masterUnitList = [],
  placeholder = 'Cari Kode Unit (e.g. 54110) atau ULP...',
  className = ''
}) => {
  // Combine dynamic master units with defaults
  const ulpOptions = React.useMemo(() => {
    const unitsMap = new Map<string, { nama: string; kode: string }>();

    // Add default ULP units
    DAFTAR_UNIT_PLN.forEach((u) => {
      unitsMap.set(u.kodeUnit, { nama: u.namaUnit, kode: u.kodeUnit });
    });

    // Add master units from Firestore if present
    masterUnitList.forEach((m) => {
      if (m.ulp && m.kodeUlp) {
        unitsMap.set(m.kodeUlp, { nama: m.ulp, kode: m.kodeUlp });
      }
    });

    return Array.from(unitsMap.values());
  }, [masterUnitList]);

  return (
    <div className={`flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 ${className}`}>
      {/* Search by Kode Unit / Text */}
      {onSearchChange !== undefined && (
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-teal-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={placeholder}
            className="w-full pl-9 pr-7 py-2 bg-[#011a18] border border-teal-600/70 rounded-xl text-xs font-bold text-white placeholder-teal-400/60 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30 transition-all shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-teal-400 hover:text-white text-xs font-black px-1 py-0.5 rounded cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>
      )}

      {/* Select ULP Filter Dropdown */}
      <div className="relative flex items-center shrink-0">
        <Building2 className="w-4 h-4 text-amber-400 absolute left-3 pointer-events-none" />
        <select
          value={selectedUnit}
          onChange={(e) => onSelectUnit(e.target.value)}
          className="w-full sm:w-auto pl-9 pr-8 py-2 bg-[#011a18] border border-teal-600/70 rounded-xl text-xs font-extrabold text-teal-200 focus:outline-none focus:border-amber-400 cursor-pointer shadow-md appearance-none"
        >
          <option value="SEMUA">🌐 Filter ULP: Semua Unit</option>
          {ulpOptions.map((u) => (
            <option key={u.kode} value={u.nama}>
              ⚡ {u.nama} (Kode: {u.kode})
            </option>
          ))}
        </select>
        <div className="absolute right-3 pointer-events-none text-teal-400 text-[10px]">▼</div>
      </div>

      {/* Reset Button if active */}
      {(selectedUnit !== 'SEMUA' || searchQuery !== '') && (
        <button
          onClick={() => {
            onSelectUnit('SEMUA');
            if (onSearchChange) onSearchChange('');
          }}
          className="p-2 rounded-xl bg-teal-950 hover:bg-teal-900 text-teal-300 border border-teal-600/50 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
          title="Reset Filter ULP"
        >
          <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-xs font-extrabold">Reset</span>
        </button>
      )}
    </div>
  );
};

export function filterByUnitOrKode<T extends Record<string, any>>(
  items: T[],
  selectedUnit: string,
  searchQuery: string = ''
): T[] {
  return items.filter((item) => {
    const unitVal = String(item.unit || item.ulp || '');
    const kodeVal = String(item.kodeUnit || item.kodeUlp || '');

    // 1. Filter by selected unit dropdown
    if (selectedUnit && selectedUnit !== 'SEMUA' && selectedUnit !== 'ALL') {
      const targetUnit = selectedUnit.toLowerCase().trim();
      const itemUnit = unitVal.toLowerCase().trim();
      const itemKode = kodeVal.trim();
      
      const matchUnit = itemUnit.includes(targetUnit) || targetUnit.includes(itemUnit);
      const matchKode = itemKode === selectedUnit.trim();

      if (!matchUnit && !matchKode) return false;
    }

    // 2. Filter by search query (kodeUnit, unit, text)
    if (searchQuery && searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      const itemUnit = unitVal.toLowerCase();
      const itemKode = kodeVal.toLowerCase();

      const matchKode = itemKode.includes(q);
      const matchUnit = itemUnit.includes(q);

      const matchAnyField = Object.values(item).some((val) =>
        typeof val === 'string' && val.toLowerCase().includes(q)
      );

      if (!matchKode && !matchUnit && !matchAnyField) return false;
    }

    return true;
  });
}
