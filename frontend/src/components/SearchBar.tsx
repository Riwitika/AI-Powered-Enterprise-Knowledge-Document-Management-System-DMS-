import React from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onFilterClick?: () => void;
}

export default function SearchBar({
  value,
  onChange,
  placeholder = 'Search...',
  onFilterClick
}: SearchBarProps) {
  return (
    <div className="flex items-center gap-2 select-none">
      <div className="relative flex-1 max-w-[280px]">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-[#f8fafc] border border-slate-200 rounded-lg pl-9.5 pr-4 py-1.5 text-xs text-slate-700 focus:outline-none focus:bg-white focus:border-blue-600 transition-all placeholder-slate-400 font-medium"
        />
      </div>
      
      {onFilterClick && (
        <button
          type="button"
          onClick={onFilterClick}
          className="p-2 border border-slate-200 rounded-lg bg-white text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-all flex items-center justify-center shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
          title="Filters"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
