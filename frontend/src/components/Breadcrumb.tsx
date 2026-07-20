import { ChevronRight } from 'lucide-react';

interface BreadcrumbProps {
  segments: string[];
  onSegmentClick?: (index: number) => void;
}

export default function Breadcrumb({ segments, onSegmentClick }: BreadcrumbProps) {
  return (
    <nav className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold select-none">
      {segments.map((segment, idx) => {
        const isLast = idx === segments.length - 1;
        return (
          <div key={idx} className="flex items-center gap-1.5">
            {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
            <button
              type="button"
              disabled={isLast}
              onClick={() => onSegmentClick?.(idx)}
              className={`hover:text-blue-600 transition-colors ${
                isLast ? 'text-slate-900 font-extrabold cursor-default' : 'cursor-pointer'
              }`}
            >
              {segment}
            </button>
          </div>
        );
      })}
    </nav>
  );
}
