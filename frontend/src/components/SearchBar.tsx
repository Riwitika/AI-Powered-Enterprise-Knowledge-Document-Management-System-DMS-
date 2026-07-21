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
      <div className="relative w-80 flex items-center">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-slate-300 focus:ring-1 focus:ring-slate-200 transition-all placeholder-slate-400 font-medium"
        />
      </div>
      
      {onFilterClick && (
        <button
          type="button"
          onClick={onFilterClick}
          className="p-1.8 border border-slate-200 rounded-lg bg-white text-slate-500 hover:text-slate-850 hover:bg-slate-50 transition-colors flex items-center justify-center shadow-sm"
          title="Filters"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-slate-450" />
        </button>
      )}
    </div>
  );
}
