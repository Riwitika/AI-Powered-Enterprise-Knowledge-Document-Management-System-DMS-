import { ArrowLeft, Share2, Download, History, MoreHorizontal } from 'lucide-react';
import { Link } from 'react-router-dom';

interface DocHeaderProps {
  name: string;
  fileType: string;
  version?: string;
  lastModified?: string;
  ownerName?: string;
  onShareClick?: () => void;
  onDownloadClick?: () => void;
  onHistoryClick?: () => void;
  onMoreClick?: () => void;
}

export default function DocHeader({
  name,
  fileType,
  version = 'v1.0',
  lastModified = '19 May 2024, 10:30 AM',
  ownerName = 'Amit Verma',
  onShareClick,
  onDownloadClick,
  onHistoryClick,
  onMoreClick
}: DocHeaderProps) {
  const getFileTypeIcon = (type: string) => {
    const t = type.toLowerCase();
    const className = "w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs border shrink-0";
    if (t === 'docx' || t === 'doc') {
      return <div className={`${className} bg-blue-50 text-blue-600 border-blue-100`}>W</div>;
    }
    if (t === 'pdf') {
      return <div className={`${className} bg-red-50 text-red-600 border-red-100`}>P</div>;
    }
    if (t === 'xlsx' || t === 'xls' || t === 'csv') {
      return <div className={`${className} bg-emerald-50 text-emerald-600 border-emerald-100`}>X</div>;
    }
    if (t === 'pptx' || t === 'ppt') {
      return <div className={`${className} bg-orange-50 text-orange-600 border-orange-100`}>P</div>;
    }
    if (t === 'txt') {
      return <div className={`${className} bg-slate-50 text-slate-600 border-slate-205`}>T</div>;
    }
    return <div className={`${className} bg-slate-50 text-slate-500 border-slate-205`}>D</div>;
  };

  return (
    <div className="border-b border-slate-200 bg-white px-6 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4 select-none">
      
      {/* Left section: Back button & File details */}
      <div className="flex items-center gap-4 min-w-0">
        <Link
          to="/documents"
          className="p-2 hover:bg-slate-50 border border-transparent hover:border-slate-200 rounded-lg text-slate-500 hover:text-slate-800 transition-all shrink-0"
          title="Back to Documents"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        
        {getFileTypeIcon(fileType)}
        
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-sm text-slate-900 truncate block max-w-[240px]">
              {name}
            </span>
            <span className="px-1.5 py-0.2 rounded border text-[8px] font-extrabold bg-blue-50 text-blue-600 border-blue-100">
              {version}
            </span>
            <span className="text-[10px] text-slate-400 font-bold bg-slate-50 border border-slate-200 px-1.5 py-0.2 rounded">
              Saved to cloud
            </span>
          </div>
          
          <div className="flex items-center gap-2 text-[10px] text-slate-455 font-semibold mt-1">
            <span>Owner: <strong className="text-slate-700">{ownerName}</strong></span>
            <span>•</span>
            <span>Last modified: {lastModified}</span>
          </div>
        </div>
      </div>

      {/* Right section: Action Buttons */}
      <div className="flex items-center gap-2.5 shrink-0 select-none">
        <button
          type="button"
          onClick={onShareClick}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 hover:border-slate-350 hover:bg-slate-50 text-xs font-bold text-slate-650 rounded-lg transition-colors bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
        >
          <Share2 className="w-3.5 h-3.5 text-slate-450" />
          <span>Share</span>
        </button>

        <button
          type="button"
          onClick={onDownloadClick}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 hover:border-slate-350 hover:bg-slate-50 text-xs font-bold text-slate-650 rounded-lg transition-colors bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
        >
          <Download className="w-3.5 h-3.5 text-slate-455" />
          <span>Download</span>
        </button>

        <button
          type="button"
          onClick={onHistoryClick}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 hover:border-slate-350 hover:bg-slate-50 text-xs font-bold text-slate-650 rounded-lg transition-colors bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
        >
          <History className="w-3.5 h-3.5 text-slate-455" />
          <span>Version History</span>
        </button>

        <button
          type="button"
          onClick={onMoreClick}
          className="p-2 border border-slate-200 hover:border-slate-350 hover:bg-slate-50 rounded-lg text-slate-500 hover:text-slate-800 transition-colors bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
          title="More Options"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
}
