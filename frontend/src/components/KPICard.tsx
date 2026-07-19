import { ArrowRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

interface KPICardProps {
  title: string;
  value: string | number;
  description: string;
  icon: LucideIcon;
  iconBgColor: string;
  iconColor: string;
  linkText?: string;
  linkTo?: string;
  onClickLink?: () => void;
}

export default function KPICard({
  title,
  value,
  description,
  icon: Icon,
  iconBgColor,
  iconColor,
  linkText,
  linkTo,
  onClickLink
}: KPICardProps) {
  const renderLink = () => {
    if (!linkText) return null;
    
    const className = "text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1.5 transition-all w-fit mt-1";
    
    if (linkTo) {
      return (
        <Link to={linkTo} className={className}>
          <span>{linkText}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      );
    }
    
    return (
      <button type="button" onClick={onClickLink} className={className}>
        <span>{linkText}</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </button>
    );
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between min-h-[140px] select-none">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <span className="text-[11px] font-bold text-slate-450 uppercase tracking-wider block">{title}</span>
          <span className="text-3xl font-extrabold text-slate-900 tracking-tight block">{value}</span>
          <span className="text-[11px] text-slate-500 font-medium block">{description}</span>
        </div>
        
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border border-slate-100 ${iconBgColor} ${iconColor}`}>
          <Icon className="w-5.5 h-5.5" />
        </div>
      </div>
      
      <div className="mt-4 pt-3 border-t border-slate-100/60">
        {renderLink()}
      </div>
    </div>
  );
}
