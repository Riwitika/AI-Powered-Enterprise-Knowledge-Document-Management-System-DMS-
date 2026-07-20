import { useState, useRef, useEffect } from 'react';
import { 
  Plus, 
  Share2, 
  Download, 
  FolderOpen, 
  Trash2, 
  Copy, 
  Edit, 
  Star, 
  Lock, 
  History, 
  FileArchive 
} from 'lucide-react';

interface ActionToolbarProps {
  onNewFolderClick?: () => void;
  onNewDocxClick?: () => void;
  onNewXlsxClick?: () => void;
  onNewPptxClick?: () => void;
  onNewTxtClick?: () => void;
  onUploadFilesClick?: () => void;
  onUploadFolderClick?: () => void;
  onAiGenerateClick?: () => void;
  onShareClick?: () => void;
  onDownloadClick?: () => void;
  onMoveClick?: () => void;
  onCopyClick?: () => void;
  onRenameClick?: () => void;
  onDeleteClick?: () => void;
  onFavoriteClick?: () => void;
  onLockClick?: () => void;
  onVersionHistoryClick?: () => void;
  selectedCount: number;
  role?: 'employee' | 'manager' | 'admin';
}

export default function ActionToolbar({
  onNewFolderClick,
  onNewDocxClick,
  onNewXlsxClick,
  onNewPptxClick,
  onNewTxtClick,
  onUploadFilesClick,
  onUploadFolderClick,
  onAiGenerateClick,
  onShareClick,
  onDownloadClick,
  onMoveClick,
  onCopyClick,
  onRenameClick,
  onDeleteClick,
  onFavoriteClick,
  onLockClick,
  onVersionHistoryClick,
  selectedCount,
  role = 'admin'
}: ActionToolbarProps) {
  const isSingle = selectedCount === 1;
  const isMultiple = selectedCount > 1;
  const isActive = selectedCount > 0;

  // Role permissions checking
  const canDelete = role === 'admin' || role === 'manager';
  const canLock = role === 'admin' || role === 'manager';
  const canCreate = role === 'admin' || role === 'manager';

  // Local Dropdown states
  const [showNewMenu, setShowNewMenu] = useState(false);
  const newMenuRef = useRef<HTMLDivElement>(null);

  // Close new dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (newMenuRef.current && !newMenuRef.current.contains(e.target as Node)) {
        setShowNewMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-3 border-b border-slate-150/60 bg-white select-none">
      
      {/* Selection count indicator */}
      <div className="flex items-center gap-3">
        {isActive ? (
          <div className="flex items-center gap-2 bg-blue-50/80 border border-blue-200/50 rounded-xl px-3 py-1.5 text-xs font-bold text-blue-700 animate-in fade-in zoom-in-95 duration-150">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shrink-0" />
            <span>{selectedCount} {selectedCount === 1 ? 'item' : 'items'} selected</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/60 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-500">
            <span className="w-2 h-2 rounded-full bg-slate-350 shrink-0" />
            <span>Select items to unlock actions</span>
          </div>
        )}

        {/* New Dropdown Button Block */}
        <div className="flex items-center gap-1.5 relative" ref={newMenuRef}>
          {canCreate && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowNewMenu(!showNewMenu)}
                className="glow-btn bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-3.5 py-1.8 text-xs font-bold shadow-sm flex items-center gap-1.5 border border-blue-500 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New</span>
                <span className="text-[7px] opacity-75">▼</span>
              </button>

              {showNewMenu && (
                <div className="absolute top-full left-0 mt-1.5 w-52 bg-white border border-slate-200 rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.08)] py-1.5 z-30 animate-in fade-in slide-in-from-top-1 duration-150 text-xs font-semibold text-slate-700">
                  <button
                    type="button"
                    onClick={() => { setShowNewMenu(false); onNewFolderClick?.(); }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <span>📁</span> <span>New Folder</span>
                  </button>
                  <div className="my-1 border-t border-slate-100" />
                  <button
                    type="button"
                    onClick={() => { setShowNewMenu(false); onNewDocxClick?.(); }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <span>📝</span> <span>Word Document</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowNewMenu(false); onNewXlsxClick?.(); }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <span>📊</span> <span>Spreadsheet</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowNewMenu(false); onNewPptxClick?.(); }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <span>📈</span> <span>Presentation</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowNewMenu(false); onNewTxtClick?.(); }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <span>📄</span> <span>Text File</span>
                  </button>
                  <div className="my-1 border-t border-slate-100" />
                  <button
                    type="button"
                    onClick={() => { setShowNewMenu(false); onUploadFilesClick?.(); }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <span>📤</span> <span>Upload Files</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowNewMenu(false); onUploadFolderClick?.(); }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <span>📤</span> <span>Upload Folder</span>
                  </button>
                  <div className="my-1 border-t border-slate-100" />
                  <button
                    type="button"
                    onClick={() => { setShowNewMenu(false); onAiGenerateClick?.(); }}
                    className="w-full text-left px-4 py-2 hover:bg-blue-50/50 text-blue-700 font-bold flex items-center gap-2"
                  >
                    <span>🤖</span> <span>Generate with AI</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Dynamic Actions block */}
      <div className="flex items-center gap-1">
        {/* Actions render only when items are selected */}
        {isActive && (
          <>
            {/* Share */}
            <button
              type="button"
              onClick={onShareClick}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-slate-650 hover:text-slate-900 hover:bg-slate-50 rounded-lg border border-transparent hover:border-slate-150 transition-all"
              title="Share selection"
            >
              <Share2 className="w-3.5 h-3.5 text-slate-450" />
              <span className="hidden sm:inline">Share</span>
            </button>

            {/* Download / Download ZIP */}
            <button
              type="button"
              onClick={onDownloadClick}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-slate-650 hover:text-slate-900 hover:bg-slate-50 rounded-lg border border-transparent hover:border-slate-150 transition-all"
              title={isMultiple ? "Download all as ZIP" : "Download file"}
            >
              {isMultiple ? (
                <>
                  <FileArchive className="w-3.5 h-3.5 text-amber-500" />
                  <span className="hidden sm:inline">Download ZIP</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5 text-slate-455" />
                  <span className="hidden sm:inline">Download</span>
                </>
              )}
            </button>

            {/* Move */}
            <button
              type="button"
              onClick={onMoveClick}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-slate-655 hover:text-slate-900 hover:bg-slate-50 rounded-lg border border-transparent hover:border-slate-150 transition-all"
              title="Move items"
            >
              <FolderOpen className="w-3.5 h-3.5 text-slate-450" />
              <span className="hidden sm:inline">Move</span>
            </button>

            {/* Copy */}
            <button
              type="button"
              onClick={onCopyClick}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-slate-655 hover:text-slate-900 hover:bg-slate-50 rounded-lg border border-transparent hover:border-slate-150 transition-all"
              title="Copy items"
            >
              <Copy className="w-3.5 h-3.5 text-slate-450" />
              <span className="hidden sm:inline">Copy</span>
            </button>

            {/* Favorite (Active on Single & Multiple Selects!) */}
            <button
              type="button"
              onClick={onFavoriteClick}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-slate-655 hover:text-slate-900 hover:bg-slate-50 rounded-lg border border-transparent hover:border-slate-150 transition-all"
              title="Toggle Favorite status"
            >
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500/10" />
              <span className="hidden sm:inline">Favorite</span>
            </button>

            {/* Lock Document (Active on Single & Multiple selects!) */}
            {canLock && (
              <button
                type="button"
                onClick={onLockClick}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-slate-655 hover:text-slate-900 hover:bg-slate-50 rounded-lg border border-transparent hover:border-slate-150 transition-all"
                title="Lock/Unlock document editing"
              >
                <Lock className="w-3.5 h-3.5 text-slate-455" />
                <span className="hidden sm:inline">Lock</span>
              </button>
            )}

            {/* Single Select Exclusive Actions (Rename & Version History) */}
            {isSingle && (
              <>
                {/* Rename */}
                <button
                  type="button"
                  onClick={onRenameClick}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-slate-655 hover:text-slate-900 hover:bg-slate-50 rounded-lg border border-transparent hover:border-slate-150 transition-all"
                  title="Rename item"
                >
                  <Edit className="w-3.5 h-3.5 text-slate-455" />
                  <span className="hidden sm:inline">Rename</span>
                </button>

                {/* Version History */}
                <button
                  type="button"
                  onClick={onVersionHistoryClick}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-slate-655 hover:text-slate-900 hover:bg-slate-50 rounded-lg border border-transparent hover:border-slate-150 transition-all"
                  title="View Version History logs"
                >
                  <History className="w-3.5 h-3.5 text-slate-455" />
                  <span className="hidden sm:inline">History</span>
                </button>
              </>
            )}

            {/* Delete (Active on Single & Multiple selects!) */}
            {canDelete && (
              <button
                type="button"
                onClick={onDeleteClick}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-red-655 hover:text-red-750 hover:bg-red-50 border border-transparent hover:border-red-200 rounded-lg transition-all"
                title="Move selection to Recycle Bin"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Delete</span>
              </button>
            )}
          </>
        )}
      </div>

    </div>
  );
}
