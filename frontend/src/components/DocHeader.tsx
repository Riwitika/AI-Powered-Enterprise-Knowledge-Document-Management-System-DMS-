import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Star, 
  Share2, 
  Download, 
  History, 
  MoreVertical,
  Lock
} from 'lucide-react';

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
  onConvertTo?: (targetFormat: string) => void;
}

export default function DocHeader({
  name,
  fileType,
  version = 'v2.1',
  lastModified = '19 May 2024, 10:30 AM',
  ownerName = 'Paras Jain',
  onShareClick,
  onDownloadClick,
  onHistoryClick,
  onMoreClick,
  onConvertTo
}: DocHeaderProps) {
  const [docName, setDocName] = useState(name);
  const [isStarred, setIsStarred] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleMenu = (menu: string) => {
    setOpenMenu(openMenu === menu ? null : menu);
  };

  const getFileTypeIcon = (type: string) => {
    const t = type.toLowerCase();
    const className = "w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs border shrink-0 shadow-sm";
    if (t === 'docx' || t === 'doc') {
      return <div className={`${className} bg-blue-600 text-white border-blue-500`}>W</div>;
    }
    if (t === 'pdf') {
      return <div className={`${className} bg-red-600 text-white border-red-500`}>P</div>;
    }
    if (t === 'xlsx' || t === 'xls' || t === 'csv') {
      return <div className={`${className} bg-emerald-600 text-white border-emerald-500`}>X</div>;
    }
    if (t === 'pptx' || t === 'ppt') {
      return <div className={`${className} bg-orange-600 text-white border-orange-500`}>P</div>;
    }
    return <div className={`${className} bg-slate-600 text-white border-slate-500`}>D</div>;
  };

  const isReadOnly = fileType.toUpperCase() === 'PDF';

  return (
    <div className="border-b border-slate-200 bg-white shadow-[0_2px_4px_rgba(0,0,0,0.01)] shrink-0 z-50 select-none relative">
      
      {/* 1. GOOGLE DOCS STYLE HEADER ROW */}
      <div className="px-6 py-2.5 flex items-center justify-between gap-4">
        
        {/* Left section: back, icon, editable title, lock indicator, star, auto save status */}
        <div className="flex items-center gap-3.5 min-w-0">
          <Link
            to="/documents"
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-550 hover:text-slate-800 transition-colors shrink-0"
            title="Back to Catalog"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          {getFileTypeIcon(fileType)}

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={docName}
                onChange={(e) => setDocName(e.target.value)}
                className="font-extrabold text-sm text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-600 focus:bg-white focus:ring-0 px-1 py-0.5 rounded outline-none transition-all truncate block max-w-[280px]"
              />
              
              {isReadOnly && (
                <span title="Read Only Lock Mode" className="shrink-0 flex items-center">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                </span>
              )}

              <button 
                type="button" 
                onClick={() => setIsStarred(!isStarred)}
                className={`p-1 rounded-full transition-colors ${isStarred ? 'text-amber-500' : 'text-slate-350 hover:text-slate-600'}`}
                title={isStarred ? 'Unstar' : 'Star'}
              >
                <Star className={`w-3.5 h-3.5 ${isStarred ? 'fill-amber-500' : ''}`} />
              </button>

              <span className="px-1.5 py-0.2 rounded border text-[8px] font-extrabold bg-blue-50 text-blue-600 border-blue-100 uppercase tracking-wide shrink-0">
                {version}
              </span>

              {/* Document Status */}
              <span className="px-1.5 py-0.2 rounded border text-[8px] font-extrabold bg-amber-50 text-amber-700 border-amber-200 uppercase tracking-wide shrink-0">
                Draft
              </span>

              {/* Auto Save Toggle indicator */}
              <div 
                onClick={() => setAutoSaveEnabled(!autoSaveEnabled)}
                className="flex items-center gap-1.5 text-[9.5px] text-slate-400 font-bold bg-slate-50 border border-slate-150 rounded px-1.5 py-0.5 ml-2 cursor-pointer hover:bg-slate-100 select-none shrink-0"
              >
                <span className={`h-1.5 w-1.5 rounded-full ${autoSaveEnabled ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                <span>{autoSaveEnabled ? 'Auto-Save: On' : 'Auto-Save: Off'}</span>
              </div>
            </div>
            
            <div className="text-[10px] text-slate-450 font-semibold pl-1.5">
              Owner: <strong className="text-slate-600">{ownerName}</strong> &bull; Last Edited: {lastModified}
            </div>
          </div>
        </div>

        {/* Right section: actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onShareClick}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors border border-blue-500"
          >
            <Share2 className="w-3.5 h-3.5 text-blue-100" />
            <span>Share</span>
          </button>

          <button
            type="button"
            onClick={onDownloadClick}
            className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 hover:border-slate-350 hover:bg-slate-50 text-xs font-bold text-slate-655 rounded-xl transition-colors bg-white shadow-sm"
            title="Download file"
          >
            <Download className="w-3.5 h-3.5 text-slate-450" />
            <span className="hidden sm:inline">Download</span>
          </button>

          <button
            type="button"
            onClick={onHistoryClick}
            className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 hover:border-slate-350 hover:bg-slate-50 text-xs font-bold text-slate-655 rounded-xl transition-colors bg-white shadow-sm"
            title="Version History"
          >
            <History className="w-3.5 h-3.5 text-slate-450" />
            <span className="hidden sm:inline">History</span>
          </button>

          <button
            type="button"
            onClick={onMoreClick}
            className="p-2 border border-slate-200 hover:border-slate-350 hover:bg-slate-50 rounded-xl text-slate-500 hover:text-slate-800 transition-colors bg-white shadow-sm"
            title="More Options"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>

      </div>

      {/* 2. MENU BAR WITH QUICK ACCESS BUTTONS */}
      <div className="px-6 py-1 bg-slate-50/50 border-t border-slate-100 flex items-center gap-1.5 relative shrink-0 z-40" ref={menuRef}>
        
        {/* Quick Access Toolbar Icons */}
        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5 shadow-[0_1px_2px_rgba(0,0,0,0.015)] shrink-0">
          <button 
            type="button" 
            onClick={() => window.dispatchEvent(new CustomEvent('kms-editor-save'))}
            className="p-1 hover:bg-slate-100 rounded text-slate-650 hover:text-slate-900" 
            title="Save (Ctrl+S)"
          >
            <span className="text-xs">💾</span>
          </button>
          <button 
            type="button" 
            onClick={() => window.dispatchEvent(new CustomEvent('kms-editor-undo'))}
            className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-800" 
            title="Undo (Ctrl+Z)"
          >
            <span className="text-xs">↩️</span>
          </button>
          <button 
            type="button" 
            onClick={() => window.dispatchEvent(new CustomEvent('kms-editor-redo'))}
            className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-800" 
            title="Redo (Ctrl+Y)"
          >
            <span className="text-xs">↪️</span>
          </button>
          <button 
            type="button" 
            onClick={() => window.print()}
            className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-800" 
            title="Print (Ctrl+P)"
          >
            <span className="text-xs">🖨</span>
          </button>
        </div>
        
        <div className="h-5 w-[1.5px] bg-slate-200 mx-1 shrink-0" />

        {/* Menu Dropdowns */}
        {[
          {
            id: 'file',
            label: 'File',
            items: [
              { label: '📄 New', action: () => alert('New document triggered (Mock)') },
              { label: '📂 Open', action: () => alert('Open file browser (Mock)') },
              { label: '💾 Save', action: () => window.dispatchEvent(new CustomEvent('kms-editor-save')) },
              { label: '💾 Save As', action: () => alert('Save As options triggered (Mock)') },
              { label: '📥 Download As', action: onDownloadClick || (() => {}) },
              { label: '📤 Export As', action: () => alert('Export processing (Mock)') },
              { isDivider: true },
              { label: '🔄 Convert To: Word (.docx)', action: () => onConvertTo?.('DOCX') },
              { label: '🔄 Convert To: Excel (.xlsx)', action: () => onConvertTo?.('XLSX') },
              { label: '🔄 Convert To: PowerPoint (.pptx)', action: () => onConvertTo?.('PPTX') },
              { label: '🔄 Convert To: PDF', action: () => onConvertTo?.('PDF') },
              { label: '🔄 Convert To: CSV', action: () => onConvertTo?.('CSV') },
              { label: '🔄 Convert To: Text', action: () => onConvertTo?.('TXT') },
              { label: '🔄 Convert To: Image', action: () => onConvertTo?.('IMAGE') },
              { isDivider: true },
              { label: '⏳ Version History', action: onHistoryClick || (() => {}) }
            ]
          },
          {
            id: 'edit',
            label: 'Edit',
            items: [
              { label: '↩️ Undo (Ctrl+Z)', action: () => window.dispatchEvent(new CustomEvent('kms-editor-undo')) },
              { label: '↪️ Redo (Ctrl+Y)', action: () => window.dispatchEvent(new CustomEvent('kms-editor-redo')) },
              { label: '✂️ Cut (Ctrl+X)', action: () => alert('Cut action') },
              { label: '📄 Copy (Ctrl+C)', action: () => alert('Copy action') },
              { label: '📋 Paste (Ctrl+V)', action: () => alert('Paste action') },
              { label: '📋 Paste Special', action: () => alert('Paste special options') },
              { label: '🎨 Copy Formatting', action: () => alert('Format paint copied') },
              { label: '🔍 Select All', action: () => alert('Select all text') },
              { label: '🔍 Find', action: () => alert('Find active') },
              { label: '🔍 Find & Replace', action: () => alert('Find and replace active') }
            ]
          },
          {
            id: 'view',
            label: 'View',
            items: [
              { label: '📑 Show Outline', action: () => alert('Outline active') },
              { label: '💬 Show Comments', action: () => alert('Comments view toggled') },
              { label: '📏 Ruler Guide', action: () => alert('Ruler guide active') },
              { label: '👁 Focus Mode', action: () => alert('Focus mode active') }
            ]
          },
          {
            id: 'insert',
            label: 'Insert',
            items: [
              { label: '📷 Upload Image', action: () => alert('Upload image triggered') },
              { label: '📊 Draw Table', action: () => alert('Draw table layout') },
              { label: '📈 Corporate Chart', action: () => alert('Chart metrics active') },
              { label: '🔗 Hyperlink (Ctrl+K)', action: () => alert('Link insert active') },
              { label: '📃 Page Break', action: () => alert('Insert page break') }
            ]
          },
          {
            id: 'format',
            label: 'Format',
            items: [
              { label: 'bold Bold (Ctrl+B)', action: () => alert('Format Bold') },
              { label: 'italic Italic (Ctrl+I)', action: () => alert('Format Italic') },
              { label: 'underline Underline (Ctrl+U)', action: () => alert('Format Underline') },
              { label: '↔️ Spacing Options', action: () => alert('Spacing menu active') },
              { label: '🧹 Clear Formatting', action: () => alert('Reset typography styles') }
            ]
          },
          {
            id: 'tools',
            label: 'Tools',
            items: [
              { label: '📊 Word Count', action: () => alert('Word Count: 2,180 words') },
              { label: '🔍 Spell Checker', action: () => alert('Spell check active') },
              { label: '🤖 AI Summarizer', action: () => alert('AI Summary triggered') },
              { label: '🌐 Translate Document', action: () => alert('Translation active') }
            ]
          },
          {
            id: 'extensions',
            label: 'Extensions',
            items: [
              { label: '🔌 Add-ons plugins', action: () => alert('Extensions placeholder') }
            ]
          },
          {
            id: 'help',
            label: 'Help',
            items: [
              { label: 'Keyboard Shortcuts', action: () => alert('Shortcuts list: Ctrl+B, Ctrl+I, Ctrl+U, Ctrl+Z') },
              { label: 'Support Helpdesk', action: () => alert('Support contact: support@efasttrade.com') },
              { label: 'ℹ️ About KMS Editor', action: () => alert('v2.4.21 - Google Docs style Editor') }
            ]
          }
        ].map((menu) => (
          <div key={menu.id} className="relative">
            <button
              type="button"
              onClick={() => toggleMenu(menu.id)}
              className={`px-3 py-1 bg-transparent hover:bg-slate-100 text-slate-700 hover:text-slate-900 rounded-lg text-xs font-bold transition-all ${
                openMenu === menu.id ? 'bg-slate-200 text-slate-900' : ''
              }`}
            >
              {menu.label}
            </button>

            {/* Float Dropdown menu card */}
            {openMenu === menu.id && (
              <div className={`absolute mt-1 w-52 bg-white border border-slate-200 rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.08),0_2px_8px_rgba(0,0,0,0.03)] py-1.5 z-[9999] animate-in fade-in slide-in-from-top-1 duration-150 ${
                ['tools', 'extensions', 'help'].includes(menu.id) ? 'right-0 left-auto' : 'left-0'
              }`}>
                {menu.items.map((item, idx) => {
                  if ((item as any).isDivider) {
                    return <div key={idx} className="my-1 border-t border-slate-100" />;
                  }
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setOpenMenu(null);
                        (item as any).action();
                      }}
                      className="w-full text-left px-4 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                    >
                      {(item as any).label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

    </div>
  );
}
