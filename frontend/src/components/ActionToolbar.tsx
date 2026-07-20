import { 
  Plus, 
  Upload, 
  Share2, 
  Download, 
  FolderOpen, 
  Trash2, 
  MoreHorizontal 
} from 'lucide-react';

interface ActionToolbarProps {
  onNewClick?: () => void;
  onUploadClick?: () => void;
  onShareClick?: () => void;
  onDownloadClick?: () => void;
  onMoveClick?: () => void;
  onDeleteClick?: () => void;
  onMoreClick?: () => void;
  isSelectionActive: boolean;
}

export default function ActionToolbar({
  onNewClick,
  onUploadClick,
  onShareClick,
  onDownloadClick,
  onMoveClick,
  onDeleteClick,
  onMoreClick,
  isSelectionActive
}: ActionToolbarProps) {
  return (
    <div className="flex items-center gap-1.5 py-3 border-b border-slate-150/60 bg-white select-none">
      {/* New Button */}
      <button
        type="button"
        onClick={onNewClick}
        className="glow-btn bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-3 py-1.5 text-xs font-bold shadow-sm flex items-center gap-1 border border-blue-500 transition-colors"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>New</span>
        <span className="text-[8px] opacity-70 ml-0.5">▼</span>
      </button>

      {/* Upload Button */}
      <button
        type="button"
        onClick={onUploadClick}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-650 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors"
      >
        <Upload className="w-3.5 h-3.5 text-slate-400" />
        <span>Upload</span>
      </button>

      <div className="h-4 w-[1px] bg-slate-200 mx-1" />

      {/* Share (Active when selection is active) */}
      <button
        type="button"
        disabled={!isSelectionActive}
        onClick={onShareClick}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
          isSelectionActive 
            ? 'text-slate-650 hover:text-slate-900 hover:bg-slate-50' 
            : 'text-slate-300 cursor-not-allowed'
        }`}
      >
        <Share2 className={`w-3.5 h-3.5 ${isSelectionActive ? 'text-slate-450' : 'text-slate-255'}`} />
        <span>Share</span>
      </button>

      {/* Download (Active when selection is active) */}
      <button
        type="button"
        disabled={!isSelectionActive}
        onClick={onDownloadClick}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
          isSelectionActive 
            ? 'text-slate-650 hover:text-slate-900 hover:bg-slate-50' 
            : 'text-slate-300 cursor-not-allowed'
        }`}
      >
        <Download className={`w-3.5 h-3.5 ${isSelectionActive ? 'text-slate-450' : 'text-slate-255'}`} />
        <span>Download</span>
      </button>

      {/* Move (Active when selection is active) */}
      <button
        type="button"
        disabled={!isSelectionActive}
        onClick={onMoveClick}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
          isSelectionActive 
            ? 'text-slate-650 hover:text-slate-900 hover:bg-slate-50' 
            : 'text-slate-300 cursor-not-allowed'
        }`}
      >
        <FolderOpen className={`w-3.5 h-3.5 ${isSelectionActive ? 'text-slate-450' : 'text-slate-255'}`} />
        <span>Move</span>
      </button>

      {/* Delete (Active when selection is active) */}
      <button
        type="button"
        disabled={!isSelectionActive}
        onClick={onDeleteClick}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
          isSelectionActive 
            ? 'text-red-600 hover:text-red-700 hover:bg-red-50' 
            : 'text-slate-300 cursor-not-allowed'
        }`}
      >
        <Trash2 className={`w-3.5 h-3.5 ${isSelectionActive ? 'text-red-500' : 'text-slate-255'}`} />
        <span>Delete</span>
      </button>

      {/* More */}
      <button
        type="button"
        onClick={onMoreClick}
        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors ml-auto"
        title="More actions"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>
    </div>
  );
}
