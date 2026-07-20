import { Shield, FolderOpen, UserMinus, Trash2, Download } from 'lucide-react';

interface BulkToolbarProps {
  selectedCount: number;
  onAssignRole: () => void;
  onMoveDept: () => void;
  onDeactivate: () => void;
  onDelete: () => void;
  onExport: () => void;
}

export default function BulkToolbar({
  selectedCount,
  onAssignRole,
  onMoveDept,
  onDeactivate,
  onDelete,
  onExport
}: BulkToolbarProps) {
  if (selectedCount <= 0) return null;

  return (
    <div className="bg-slate-900 text-white rounded-xl px-5 py-3 flex items-center justify-between shadow-lg select-none w-full border border-slate-800 animate-in fade-in slide-in-from-bottom-3 duration-250">
      
      <div className="flex items-center gap-2.5">
        <span className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-[10.5px] font-extrabold text-white">
          {selectedCount}
        </span>
        <span className="text-xs font-bold text-slate-300">users selected</span>
      </div>

      <div className="flex items-center gap-1">
        
        {/* Assign Role */}
        <button
          type="button"
          onClick={onAssignRole}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-200 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
        >
          <Shield className="w-3.5 h-3.5 text-slate-400" />
          <span>Assign Role</span>
        </button>

        {/* Move Dept */}
        <button
          type="button"
          onClick={onMoveDept}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-200 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
        >
          <FolderOpen className="w-3.5 h-3.5 text-slate-400" />
          <span>Move Dept</span>
        </button>

        {/* Deactivate */}
        <button
          type="button"
          onClick={onDeactivate}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-200 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
        >
          <UserMinus className="w-3.5 h-3.5 text-slate-400" />
          <span>Deactivate</span>
        </button>

        {/* Delete */}
        <button
          type="button"
          onClick={onDelete}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-400 hover:text-red-300 hover:bg-slate-800 rounded-lg transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Delete</span>
        </button>

        <div className="h-4 w-[1px] bg-slate-800 mx-2" />

        {/* Export */}
        <button
          type="button"
          onClick={onExport}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-200 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
        >
          <Download className="w-3.5 h-3.5 text-slate-450" />
          <span>Export</span>
        </button>

      </div>

    </div>
  );
}
