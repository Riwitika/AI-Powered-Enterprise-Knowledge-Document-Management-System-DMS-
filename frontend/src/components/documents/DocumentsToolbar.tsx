import { Upload, Layout, ChevronDown, Plus, PanelRight } from 'lucide-react';

interface DocumentsToolbarProps {
  // Panel Toggles
  showRightInspector?: boolean;
  onToggleRightInspector?: () => void;

  // Dropdown visibility — controlled by parent to allow global close on window click
  showNewDropdown: boolean;
  showUploadDropdown: boolean;
  showTemplatesDropdown: boolean;
  onToggleNew: () => void;
  onToggleUpload: () => void;
  onToggleTemplates: () => void;

  // Actions
  onNewDocument: () => void;
  onNewFolder: () => void;
  onUploadFile: () => void;
  onBrowseTemplates: () => void;
  onUseTemplate: (title: string, content: string) => void;
}

export default function DocumentsToolbar({
  showRightInspector = true,
  onToggleRightInspector,
  showNewDropdown,
  showUploadDropdown,
  showTemplatesDropdown,
  onToggleNew,
  onToggleUpload,
  onToggleTemplates,
  onNewDocument,
  onNewFolder,
  onUploadFile,
  onBrowseTemplates,
  onUseTemplate,
}: DocumentsToolbarProps) {
  return (
    <div className="h-[46px] border-b border-slate-200/80 bg-white flex items-center justify-between px-4 sm:px-6 shrink-0 relative z-20 select-none gap-2">

      {/* Left: Action Buttons (+ New, Upload, Templates) */}
      <div className="flex items-center gap-2 shrink-0">

        {/* + New Button */}
        <div className="relative">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onToggleNew(); }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-2xs border border-blue-500"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New</span>
            <ChevronDown className="w-3.5 h-3.5 opacity-80" />
          </button>
          {showNewDropdown && (
            <div className="absolute left-0 mt-1.5 w-44 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-30 text-xs font-semibold text-slate-700 animate-in fade-in duration-100">
              <button
                type="button"
                onClick={() => { onNewDocument(); }}
                className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2.5 font-bold"
              >
                📝 New Document
              </button>
              <button
                type="button"
                onClick={() => { onNewFolder(); }}
                className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2.5 font-bold"
              >
                📁 New Folder
              </button>
            </div>
          )}
        </div>

        {/* Upload Button */}
        <div className="relative">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onToggleUpload(); }}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold transition-all bg-white shadow-2xs"
          >
            <Upload className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden md:inline">Upload</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>
          {showUploadDropdown && (
            <div className="absolute left-0 mt-1.5 w-44 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-30 text-xs font-semibold text-slate-700 animate-in fade-in duration-100">
              <button
                type="button"
                onClick={() => { onUploadFile(); }}
                className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2.5 font-bold"
              >
                📄 Upload File
              </button>
              <button
                type="button"
                onClick={() => { onUploadFile(); }}
                className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2.5 font-bold"
              >
                📁 Upload Folder
              </button>
            </div>
          )}
        </div>

        {/* Templates Button */}
        <div className="relative">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onToggleTemplates(); }}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold transition-all bg-white shadow-2xs"
          >
            <Layout className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden md:inline">Templates</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>
          {showTemplatesDropdown && (
            <div className="absolute left-0 mt-1.5 w-52 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-30 text-xs font-semibold text-slate-700 animate-in fade-in duration-100">
              <button
                type="button"
                onClick={() => { onBrowseTemplates(); }}
                className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 font-black text-slate-900"
              >
                🔍 Browse Templates
              </button>
              <button
                type="button"
                onClick={() => { onNewDocument(); }}
                className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 font-bold"
              >
                📝 Blank Document
              </button>
              <div className="h-[1px] bg-slate-100 my-1" />
              <span className="px-4 py-1 text-[9.5px] uppercase font-black text-slate-400 block tracking-wider">Recently Used</span>
              <button
                type="button"
                onClick={() => onUseTemplate('HR Policy', 'Standard Corporate Human Resources Policy Outline...')}
                className="w-full text-left px-4 py-1.5 hover:bg-slate-50 flex items-center gap-2 truncate font-semibold"
              >
                📄 HR Policy Template
              </button>
              <button
                type="button"
                onClick={() => onUseTemplate('Project Proposal', 'Executive Summary, Problem Statement, Solution Proposal...')}
                className="w-full text-left px-4 py-1.5 hover:bg-slate-50 flex items-center gap-2 truncate font-semibold"
              >
                📄 Project Proposal
              </button>
              <button
                type="button"
                onClick={() => onUseTemplate('Meeting Notes', 'Date, Attendees, Agenda, Action Items...')}
                className="w-full text-left px-4 py-1.5 hover:bg-slate-50 flex items-center gap-2 truncate font-semibold"
              >
                📄 Meeting Notes
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Right: Inspector Toggle */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Toggle Inspector Button */}
        {onToggleRightInspector && (
          <button
            type="button"
            onClick={onToggleRightInspector}
            className={`p-1.5 rounded-lg text-xs font-bold transition-all border ${
              showRightInspector
                ? 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100'
                : 'border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700'
            }`}
            title={showRightInspector ? 'Hide Inspector (Right Panel)' : 'Show Inspector (Right Panel)'}
          >
            <PanelRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
