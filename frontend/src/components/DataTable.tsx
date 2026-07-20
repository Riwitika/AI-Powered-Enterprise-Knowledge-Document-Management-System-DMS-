import React from 'react';
import { MoreVertical } from 'lucide-react';

export interface DataRow {
  id: string | number;
  name: string;
  subtext?: string;
  category?: string;
  timestamp?: string;
  fileType?: string;
  badgeText?: string;
  badgeStyle?: string;
  ownerAvatar?: string;
  ownerInitials?: string;
  ownerName?: string;
}

interface DataTableProps {
  rows: DataRow[];
  onRowClick?: (row: DataRow) => void;
  onActionClick?: (row: DataRow, event: React.MouseEvent) => void;
  getFileTypeIcon?: (type?: string) => React.ReactNode;
}

export default function DataTable({
  rows,
  onRowClick,
  onActionClick,
  getFileTypeIcon
}: DataTableProps) {
  return (
    <div className="divide-y divide-slate-100 overflow-hidden">
      {rows.map((row) => (
        <div
          key={row.id}
          className="flex items-center justify-between p-3.5 hover:bg-slate-50/70 transition-colors border border-transparent rounded-xl hover:border-slate-150/40 my-1 first:mt-0 last:mb-0 cursor-pointer"
          onClick={() => onRowClick?.(row)}
        >
          {/* Left panel: Icon & Labels */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {getFileTypeIcon && getFileTypeIcon(row.fileType)}
            <div className="min-w-0">
              <span className="text-xs font-bold text-slate-800 hover:text-blue-600 transition-colors block truncate">
                {row.name}
              </span>
              <div className="flex items-center gap-2 text-[10px] text-slate-455 font-semibold mt-1">
                {row.category && (
                  <>
                    <span className="truncate">{row.category}</span>
                    <span>•</span>
                  </>
                )}
                {row.subtext && (
                  <>
                    <span className="truncate">{row.subtext}</span>
                    <span>•</span>
                  </>
                )}
                {row.timestamp && <span className="whitespace-nowrap">{row.timestamp}</span>}
              </div>
            </div>
          </div>

          {/* Right panel: Badges & Action dots */}
          <div className="flex items-center gap-4 shrink-0 select-none ml-4">
            {row.badgeText && (
              <span className={`px-2 py-0.5 rounded border text-[8px] font-bold uppercase tracking-wider ${row.badgeStyle || 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                {row.badgeText}
              </span>
            )}
            
            {onActionClick && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onActionClick(row, e);
                }}
                className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
