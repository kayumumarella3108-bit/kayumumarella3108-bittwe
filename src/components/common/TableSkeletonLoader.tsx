import React from 'react';
import { RefreshCw, Database } from 'lucide-react';

interface TableSkeletonLoaderProps {
  columns?: number;
  rows?: number;
  headerTitle?: string;
  showSyncBadge?: boolean;
}

export const TableSkeletonLoader: React.FC<TableSkeletonLoaderProps> = ({
  columns = 6,
  rows = 5,
  headerTitle,
  showSyncBadge = true,
}) => {
  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Optional Top Syncing Status */}
      {showSyncBadge && (
        <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-ping" />
            <span className="text-xs font-semibold text-slate-700">
              {headerTitle ? `Memuat Data ${headerTitle}...` : 'Sinkronisasi Data Firestore...'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-50 border border-teal-200/60 text-teal-800 text-[11px] font-medium">
            <RefreshCw className="w-3 h-3 animate-spin text-teal-600" />
            <span>Sinkronisasi Aktif</span>
          </div>
        </div>
      )}

      {/* Table Skeleton */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          {/* Skeleton Header */}
          <thead>
            <tr className="bg-slate-100/80 border-b border-slate-200/80">
              {Array.from({ length: columns }).map((_, i) => (
                <th key={`th-${i}`} className="p-3.5">
                  <div
                    className="h-4 bg-slate-200/90 rounded-md animate-pulse"
                    style={{ width: `${Math.max(40, 90 - (i % 4) * 15)}%` }}
                  />
                </th>
              ))}
            </tr>
          </thead>

          {/* Skeleton Body Rows */}
          <tbody className="divide-y divide-slate-100">
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <tr key={`row-${rowIndex}`} className="hover:bg-slate-50/40 transition-colors">
                {Array.from({ length: columns }).map((_, colIndex) => (
                  <td key={`cell-${rowIndex}-${colIndex}`} className="p-3.5">
                    <div
                      className="h-3.5 bg-slate-200/70 rounded-md animate-pulse"
                      style={{
                        width: `${Math.max(35, ((rowIndex + colIndex) % 3 === 0 ? 80 : 55) - (colIndex % 3) * 10)}%`,
                        animationDelay: `${(rowIndex * columns + colIndex) * 45}ms`
                      }}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Bottom Skeleton Footer */}
      <div className="px-5 py-3 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
        <div className="h-3.5 w-28 bg-slate-200/80 rounded animate-pulse" />
        <div className="flex items-center gap-2">
          <div className="h-7 w-16 bg-slate-200/80 rounded-lg animate-pulse" />
          <div className="h-7 w-16 bg-slate-200/80 rounded-lg animate-pulse" />
        </div>
      </div>
    </div>
  );
};
