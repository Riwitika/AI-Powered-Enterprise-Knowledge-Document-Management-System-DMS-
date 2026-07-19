import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

interface EmptyStateProps {
  message: string;
  description?: string;
  icon: LucideIcon;
  actionText?: string;
  actionTo?: string;
  onActionClick?: () => void;
}

export default function EmptyState({
  message,
  description,
  icon: Icon,
  actionText,
  actionTo,
  onActionClick
}: EmptyStateProps) {
  const renderAction = () => {
    if (!actionText) return null;
    
    const className = "glow-btn bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-3.5 py-1.5 text-[11px] font-bold shadow-sm transition-colors mt-3 w-fit";
    
    if (actionTo) {
      return (
        <Link to={actionTo} className={className}>
          {actionText}
        </Link>
      );
    }
    
    return (
      <button type="button" onClick={onActionClick} className={className}>
        {actionText}
      </button>
    );
  };

  return (
    <div className="h-full w-full flex flex-col items-center justify-center text-center p-6 select-none">
      <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 mb-3 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]">
        <Icon className="w-6 h-6" />
      </div>
      
      <p className="text-xs font-bold text-slate-800">{message}</p>
      {description && <p className="text-[10px] text-slate-450 mt-1 max-w-[200px] leading-relaxed">{description}</p>}
      
      {renderAction()}
    </div>
  );
}
