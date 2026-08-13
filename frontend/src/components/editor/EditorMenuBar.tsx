import { useState, useRef, useEffect } from 'react';
import { Editor } from '@tiptap/react';
import { 
  Save, 
  Download, 
  Lock, 
  Printer, 
  Undo2, 
  Redo2, 
  Search, 
  Eye, 
  Table as TableIcon, 
  Minus, 
  ImageIcon, 
  Bold, 
  Italic, 
  Underline as UnderlineIcon, 
  Strikethrough, 
  RemoveFormatting, 
  Sparkles, 
  HelpCircle,
  Check,
  FileText
} from 'lucide-react';

interface EditorMenuBarProps {
  editor: Editor | null;
  docTitle: string;
  isLocked: boolean;
  showRuler: boolean;
  zoomLevel: number;
  onToggleLock: () => void;
  onManualSave: () => void;
  onSaveCheckpoint: () => void;
  onExport: (format: 'docx' | 'html' | 'txt') => void;
  onToggleRuler: () => void;
  onSetZoom: (zoom: number) => void;
  onOpenImageUpload: () => void;
  onOpenTableModal: () => void;
  onOpenFindReplace: () => void;
  onOpenWordCount: () => void;
  onOpenAiPanel: () => void;
  onShowShortcuts: () => void;
}

export default function EditorMenuBar({
  editor,
  isLocked,
  showRuler,
  zoomLevel,
  onToggleLock,
  onManualSave,
  onSaveCheckpoint,
  onExport,
  onToggleRuler,
  onSetZoom,
  onOpenImageUpload,
  onOpenTableModal,
  onOpenFindReplace,
  onOpenWordCount,
  onOpenAiPanel,
  onShowShortcuts,
}: EditorMenuBarProps) {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenu(null);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleMenu = (menuName: string) => {
    setActiveMenu(activeMenu === menuName ? null : menuName);
  };

  return (
    <div className="bg-white border-b border-slate-200 px-3 py-0.5 flex items-center gap-1 select-none text-xs font-semibold text-slate-700 relative z-30" ref={menuRef}>
      
      {/* 1. FILE MENU */}
      <div className="relative">
        <button
          type="button"
          onClick={() => toggleMenu('file')}
          className={`px-2.5 py-1 rounded hover:bg-slate-100 transition-colors ${activeMenu === 'file' ? 'bg-slate-100 font-bold text-slate-900' : ''}`}
        >
          File
        </button>
        {activeMenu === 'file' && (
          <div className="absolute left-0 top-full mt-0.5 w-56 bg-white border border-slate-200 rounded-xl shadow-xl py-1 z-50 animate-in fade-in-50 duration-100 text-xs">
            <button
              type="button"
              onClick={() => { setActiveMenu(null); onManualSave(); }}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center justify-between font-semibold"
            >
              <span className="flex items-center gap-2"><Save className="w-3.5 h-3.5 text-blue-600" /> Save</span>
              <span className="text-[10px] text-slate-400 font-mono">⌘S</span>
            </button>
            <button
              type="button"
              onClick={() => { setActiveMenu(null); onSaveCheckpoint(); }}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center justify-between font-semibold"
            >
              <span className="flex items-center gap-2"><Save className="w-3.5 h-3.5 text-blue-600" /> Save Checkpoint</span>
            </button>

            <div className="border-t border-slate-100 my-1" />

            <div className="px-3 py-1 text-[10px] font-extrabold uppercase text-slate-400">Download / Export</div>
            <button
              type="button"
              onClick={() => { setActiveMenu(null); onExport('docx'); }}
              className="w-full text-left px-3 py-1 hover:bg-slate-100 flex items-center gap-2 pl-6"
            >
              <Download className="w-3 h-3 text-slate-500" /> Word Document (.docx)
            </button>
            <button
              type="button"
              onClick={() => { setActiveMenu(null); onExport('html'); }}
              className="w-full text-left px-3 py-1 hover:bg-slate-100 flex items-center gap-2 pl-6"
            >
              <Download className="w-3 h-3 text-slate-500" /> Web Page (.html)
            </button>
            <button
              type="button"
              onClick={() => { setActiveMenu(null); onExport('txt'); }}
              className="w-full text-left px-3 py-1 hover:bg-slate-100 flex items-center gap-2 pl-6"
            >
              <Download className="w-3 h-3 text-slate-500" /> Plain Text (.txt)
            </button>

            <div className="border-t border-slate-100 my-1" />

            <button
              type="button"
              onClick={() => { setActiveMenu(null); onToggleLock(); }}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center justify-between font-semibold"
            >
              <span className="flex items-center gap-2"><Lock className="w-3.5 h-3.5 text-slate-600" /> {isLocked ? 'Unlock Editor' : 'Lock Editor'}</span>
            </button>
            <button
              type="button"
              onClick={() => { setActiveMenu(null); window.print(); }}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center justify-between font-semibold"
            >
              <span className="flex items-center gap-2"><Printer className="w-3.5 h-3.5 text-slate-600" /> Print</span>
              <span className="text-[10px] text-slate-400 font-mono">⌘P</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. EDIT MENU */}
      <div className="relative">
        <button
          type="button"
          onClick={() => toggleMenu('edit')}
          className={`px-2.5 py-1 rounded hover:bg-slate-100 transition-colors ${activeMenu === 'edit' ? 'bg-slate-100 font-bold text-slate-900' : ''}`}
        >
          Edit
        </button>
        {activeMenu === 'edit' && (
          <div className="absolute left-0 top-full mt-0.5 w-56 bg-white border border-slate-200 rounded-xl shadow-xl py-1 z-50 animate-in fade-in-50 duration-100 text-xs">
            <button
              type="button"
              onClick={() => { setActiveMenu(null); editor?.chain().focus().undo().run(); }}
              disabled={!editor?.can().undo()}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-100 disabled:opacity-40 flex items-center justify-between font-semibold"
            >
              <span className="flex items-center gap-2"><Undo2 className="w-3.5 h-3.5 text-slate-600" /> Undo</span>
              <span className="text-[10px] text-slate-400 font-mono">⌘Z</span>
            </button>
            <button
              type="button"
              onClick={() => { setActiveMenu(null); editor?.chain().focus().redo().run(); }}
              disabled={!editor?.can().redo()}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-100 disabled:opacity-40 flex items-center justify-between font-semibold"
            >
              <span className="flex items-center gap-2"><Redo2 className="w-3.5 h-3.5 text-slate-600" /> Redo</span>
              <span className="text-[10px] text-slate-400 font-mono">⌘Y</span>
            </button>

            <div className="border-t border-slate-100 my-1" />

            <button
              type="button"
              onClick={() => { setActiveMenu(null); editor?.chain().focus().selectAll().run(); }}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center justify-between font-semibold"
            >
              <span>Select All</span>
              <span className="text-[10px] text-slate-400 font-mono">⌘A</span>
            </button>
            <button
              type="button"
              onClick={() => { setActiveMenu(null); onOpenFindReplace(); }}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center justify-between font-semibold"
            >
              <span className="flex items-center gap-2"><Search className="w-3.5 h-3.5 text-slate-600" /> Find and replace</span>
              <span className="text-[10px] text-slate-400 font-mono">⌘H</span>
            </button>
          </div>
        )}
      </div>

      {/* 3. VIEW MENU */}
      <div className="relative">
        <button
          type="button"
          onClick={() => toggleMenu('view')}
          className={`px-2.5 py-1 rounded hover:bg-slate-100 transition-colors ${activeMenu === 'view' ? 'bg-slate-100 font-bold text-slate-900' : ''}`}
        >
          View
        </button>
        {activeMenu === 'view' && (
          <div className="absolute left-0 top-full mt-0.5 w-56 bg-white border border-slate-200 rounded-xl shadow-xl py-1 z-50 animate-in fade-in-50 duration-100 text-xs">
            <button
              type="button"
              onClick={() => { setActiveMenu(null); onToggleRuler(); }}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center justify-between font-semibold"
            >
              <span className="flex items-center gap-2"><Eye className="w-3.5 h-3.5 text-slate-600" /> Show ruler</span>
              {showRuler && <Check className="w-3.5 h-3.5 text-blue-600" />}
            </button>

            <div className="border-t border-slate-100 my-1" />

            <div className="px-3 py-1 text-[10px] font-extrabold uppercase text-slate-400">Zoom Level</div>
            {[50, 75, 100, 125, 150].map((z) => (
              <button
                key={z}
                type="button"
                onClick={() => { setActiveMenu(null); onSetZoom(z); }}
                className="w-full text-left px-3 py-1 hover:bg-slate-100 flex items-center justify-between pl-6 font-semibold"
              >
                <span>{z}%</span>
                {zoomLevel === z && <Check className="w-3.5 h-3.5 text-blue-600" />}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 4. INSERT MENU */}
      <div className="relative">
        <button
          type="button"
          onClick={() => toggleMenu('insert')}
          className={`px-2.5 py-1 rounded hover:bg-slate-100 transition-colors ${activeMenu === 'insert' ? 'bg-slate-100 font-bold text-slate-900' : ''}`}
        >
          Insert
        </button>
        {activeMenu === 'insert' && (
          <div className="absolute left-0 top-full mt-0.5 w-56 bg-white border border-slate-200 rounded-xl shadow-xl py-1 z-50 animate-in fade-in-50 duration-100 text-xs">
            <button
              type="button"
              onClick={() => { setActiveMenu(null); (editor?.commands as any).setPageBreak?.(); }}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center justify-between font-semibold text-blue-700"
            >
              <span className="flex items-center gap-2"><FileText className="w-3.5 h-3.5 text-blue-600" /> Page break</span>
              <span className="text-[10px] text-slate-400 font-mono">⌘Enter</span>
            </button>

            <div className="border-t border-slate-100 my-1" />

            <button
              type="button"
              onClick={() => { setActiveMenu(null); onOpenImageUpload(); }}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center gap-2 font-semibold"
            >
              <ImageIcon className="w-3.5 h-3.5 text-slate-600" /> Image from Computer
            </button>
            <button
              type="button"
              onClick={() => { setActiveMenu(null); onOpenTableModal(); }}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center gap-2 font-semibold"
            >
              <TableIcon className="w-3.5 h-3.5 text-slate-600" /> Table
            </button>
            <button
              type="button"
              onClick={() => { setActiveMenu(null); editor?.chain().focus().setHorizontalRule().run(); }}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center gap-2 font-semibold"
            >
              <Minus className="w-3.5 h-3.5 text-slate-600" /> Horizontal line
            </button>
          </div>
        )}
      </div>

      {/* 5. FORMAT MENU */}
      <div className="relative">
        <button
          type="button"
          onClick={() => toggleMenu('format')}
          className={`px-2.5 py-1 rounded hover:bg-slate-100 transition-colors ${activeMenu === 'format' ? 'bg-slate-100 font-bold text-slate-900' : ''}`}
        >
          Format
        </button>
        {activeMenu === 'format' && (
          <div className="absolute left-0 top-full mt-0.5 w-56 bg-white border border-slate-200 rounded-xl shadow-xl py-1 z-50 animate-in fade-in-50 duration-100 text-xs">
            <button
              type="button"
              onClick={() => { setActiveMenu(null); editor?.chain().focus().toggleBold().run(); }}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center justify-between font-semibold"
            >
              <span className="flex items-center gap-2"><Bold className="w-3.5 h-3.5 text-slate-600" /> Bold</span>
              <span className="text-[10px] text-slate-400 font-mono">⌘B</span>
            </button>
            <button
              type="button"
              onClick={() => { setActiveMenu(null); editor?.chain().focus().toggleItalic().run(); }}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center justify-between font-semibold"
            >
              <span className="flex items-center gap-2"><Italic className="w-3.5 h-3.5 text-slate-600" /> Italic</span>
              <span className="text-[10px] text-slate-400 font-mono">⌘I</span>
            </button>
            <button
              type="button"
              onClick={() => { setActiveMenu(null); editor?.chain().focus().toggleUnderline().run(); }}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center justify-between font-semibold"
            >
              <span className="flex items-center gap-2"><UnderlineIcon className="w-3.5 h-3.5 text-slate-600" /> Underline</span>
              <span className="text-[10px] text-slate-400 font-mono">⌘U</span>
            </button>
            <button
              type="button"
              onClick={() => { setActiveMenu(null); editor?.chain().focus().toggleStrike().run(); }}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center gap-2 font-semibold"
            >
              <Strikethrough className="w-3.5 h-3.5 text-slate-600" /> Strikethrough
            </button>

            <div className="border-t border-slate-100 my-1" />

            <button
              type="button"
              onClick={() => { setActiveMenu(null); editor?.chain().focus().clearFormatting().run(); }}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center gap-2 font-semibold"
            >
              <RemoveFormatting className="w-3.5 h-3.5 text-slate-600" /> Clear formatting
            </button>
          </div>
        )}
      </div>

      {/* 6. TOOLS MENU */}
      <div className="relative">
        <button
          type="button"
          onClick={() => toggleMenu('tools')}
          className={`px-2.5 py-1 rounded hover:bg-slate-100 transition-colors ${activeMenu === 'tools' ? 'bg-slate-100 font-bold text-slate-900' : ''}`}
        >
          Tools
        </button>
        {activeMenu === 'tools' && (
          <div className="absolute left-0 top-full mt-0.5 w-56 bg-white border border-slate-200 rounded-xl shadow-xl py-1 z-50 animate-in fade-in-50 duration-100 text-xs">
            <button
              type="button"
              onClick={() => { setActiveMenu(null); onOpenWordCount(); }}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center justify-between font-semibold"
            >
              <span>Word count</span>
              <span className="text-[10px] text-slate-400 font-mono">⌘⇧C</span>
            </button>
            <button
              type="button"
              onClick={() => { setActiveMenu(null); onOpenFindReplace(); }}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center gap-2 font-semibold"
            >
              <Search className="w-3.5 h-3.5 text-slate-600" /> Find and replace
            </button>

            <div className="border-t border-slate-100 my-1" />

            <button
              type="button"
              onClick={() => { setActiveMenu(null); onOpenAiPanel(); }}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center gap-2 text-blue-600 font-bold"
            >
              <Sparkles className="w-3.5 h-3.5" /> AI Document Assistant
            </button>
          </div>
        )}
      </div>

      {/* 7. HELP MENU */}
      <div className="relative">
        <button
          type="button"
          onClick={() => toggleMenu('help')}
          className={`px-2.5 py-1 rounded hover:bg-slate-100 transition-colors ${activeMenu === 'help' ? 'bg-slate-100 font-bold text-slate-900' : ''}`}
        >
          Help
        </button>
        {activeMenu === 'help' && (
          <div className="absolute left-0 top-full mt-0.5 w-56 bg-white border border-slate-200 rounded-xl shadow-xl py-1 z-50 animate-in fade-in-50 duration-100 text-xs">
            <button
              type="button"
              onClick={() => { setActiveMenu(null); onShowShortcuts(); }}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center justify-between font-semibold"
            >
              <span className="flex items-center gap-2"><HelpCircle className="w-3.5 h-3.5 text-slate-600" /> Keyboard shortcuts</span>
              <span className="text-[10px] text-slate-400 font-mono">⌘/</span>
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
