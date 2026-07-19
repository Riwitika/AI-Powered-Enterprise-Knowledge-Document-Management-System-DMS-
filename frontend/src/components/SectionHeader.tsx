import React from 'react';
import { Link } from 'react-router-dom';

interface SectionHeaderProps {
  title: string;
  icon?: React.ReactNode;
  actionText?: string;
  actionTo?: string;
  onActionClick?: () => void;
  rightElement?: React.ReactNode;
}

export default function SectionHeader({
  title,
  icon,
  actionText,
  actionTo,
  onActionClick,
  rightElement
}: SectionHeaderProps) {
  const renderAction = () => {
    if (!actionText) return null;
    
    const className = "text-xs text-blue-600 hover:text-blue-800 font-bold transition-all hover:underline";
    
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
    <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4 select-none">
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="font-extrabold text-slate-900 text-sm tracking-tight">{title}</h2>
      </div>
      
      <div className="flex items-center gap-3">
        {renderAction()}
        {rightElement}
      </div>
    </div>
  );
}
