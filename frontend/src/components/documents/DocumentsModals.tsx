/**
 * DocumentsModals.tsx
 *
 * Contains all modal dialogs for the Documents module:
 *   - New Folder modal
 *   - Rename Item modal
 *   - Delete Confirmation modal
 *   - Move/Copy Tree Picker modal
 *   - Version History drawer
 *   - Quick Preview modal
 *   - Enterprise Share Dialog
 *
 * All state and handlers live in DocumentTree.tsx (the orchestration layer).
 * This file is pure UI — it receives everything via props.
 */

import { useNavigate } from 'react-router-dom';
import {
  X,
  Folder,
  FolderOpen,
  Trash2,
  History,
  Share2,
  Download,
  Copy,
  Eye,
  Edit,
  Star,
  Upload,
  Info,
} from 'lucide-react';

// ─── Prop type definitions ────────────────────────────────────────────────────

export interface DMSItem {
  id: string;
  name: string;
  isFolder: boolean;
  fileType?: string;
  modifiedAt?: string;
  ownerName?: string;
  ownerInitials?: string;
  size?: string;
  folderId?: string;
  isFavorite?: boolean;
  isLocked?: boolean;
  version?: string;
  status?: string;
  department?: string;
  description?: string;
}

interface NewFolderVal {
  name: string;
  description: string;
  color: string;
  department: string;
  owner: string;
  permissions: string;
}

interface ShareSettings {
  userOrDept: string;
  role: string;
  expiryDate: string;
  password: string;
  publicLinkEnabled: boolean;
}

export interface DocumentsModalsProps {
  // New Folder Modal
  showNewFolderModal: boolean;
  setShowNewFolderModal: (v: boolean) => void;
  newFolderVal: NewFolderVal;
  setNewFolderVal: (v: NewFolderVal | ((prev: NewFolderVal) => NewFolderVal)) => void;
  triggerCreateFolder: (e: React.FormEvent) => void;

  // Rename Modal
  showRenameModal: boolean;
  setShowRenameModal: (v: boolean) => void;
  renameTarget: any;
  renameNewName: string;
  setRenameNewName: (v: string) => void;
  triggerRenameAction: (e: React.FormEvent) => void;

  // Delete Confirm Modal
  showDeleteConfirm: boolean;
  setShowDeleteConfirm: (v: boolean) => void;
  deleteTarget: any;
  triggerDeleteConfirm: () => void;

  // Move/Copy Tree Picker Modal
  showTreePicker: boolean;
  setShowTreePicker: (v: boolean) => void;
  pickerAction: 'move' | 'copy';
  pickerTargetItems: any[];
  pickerSelectedFolderId: string;
  setPickerSelectedFolderId: (v: string) => void;
  folderTreeNodes: any[];
  triggerMoveCopyAction: () => void;

  // Version History Drawer
  showVersionHistory: boolean;
  setShowVersionHistory: (v: boolean) => void;
  versionHistoryDoc: any;
  showToast: (msg: string) => void;

  // Quick Preview Modal
  previewDoc: any;
  setPreviewDoc: (v: any) => void;
  previewImageZoom: number;
  setPreviewImageZoom: (v: number | ((prev: number) => number)) => void;

  // Share Dialog Modal
  shareDoc: any;
  setShareDoc: (v: any) => void;
  shareSettings: ShareSettings;
  setShareSettings: (v: ShareSettings | ((prev: ShareSettings) => ShareSettings)) => void;

  // Toast
  toastMsg: string | null;

  // Upload overlay
  isDragOverWindow: boolean;
  activeFolder: { id: string | number; name: string };

  // Upload progress
  uploadIsPending: boolean;

  // Context Menu
  contextMenu: { x: number; y: number; item: any } | null;
  setContextMenu: (v: null) => void;
  handleRestoreItem: (item: any) => void;
  handleDeleteItemPermanently: (item: any) => void;
  handleFolderSelect: (node: { id: string | number; name: string }) => void;
  handleItemClick: (item: any) => void;
  setShowInfoPanel: (v: boolean) => void;
  setRenameTarget: (v: any) => void;
  setDeleteTarget: (v: any) => void;
  setPickerAction: (v: 'move' | 'copy') => void;
  setPickerTargetItems: (v: any[]) => void;
  handleToggleFavorite: (id: string, e?: React.MouseEvent) => void;
  handleToggleLock: (item: any) => void;
  setVersionHistoryDoc: (v: any) => void;
  saveAsTemplateMutation: { mutate: (id: string) => void };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DocumentsModals(props: DocumentsModalsProps) {
  const navigate = useNavigate();
  const {
    showNewFolderModal, setShowNewFolderModal, newFolderVal, setNewFolderVal, triggerCreateFolder,
    showRenameModal, setShowRenameModal, renameTarget, renameNewName, setRenameNewName, triggerRenameAction,
    showDeleteConfirm, setShowDeleteConfirm, deleteTarget, triggerDeleteConfirm,
    showTreePicker, setShowTreePicker, pickerAction, pickerTargetItems, pickerSelectedFolderId,
    setPickerSelectedFolderId, folderTreeNodes, triggerMoveCopyAction,
    showVersionHistory, setShowVersionHistory, versionHistoryDoc, showToast,
    previewDoc, setPreviewDoc, previewImageZoom, setPreviewImageZoom,
    shareDoc, setShareDoc, shareSettings, setShareSettings,
    toastMsg, isDragOverWindow, activeFolder, uploadIsPending,
    contextMenu, setContextMenu,
    handleFolderSelect, handleItemClick, setShowInfoPanel,
    setRenameTarget, setDeleteTarget, setPickerAction, setPickerTargetItems,
    handleToggleFavorite, setVersionHistoryDoc,
    saveAsTemplateMutation,
  } = props;

  return (
    <>
      {/* 1. UPLOAD PROGRESS BACKDROP */}
      {uploadIsPending && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[2px] z-[99999] flex items-center justify-center p-4 select-none">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full border border-slate-200 shadow-2xl flex flex-col items-center text-center">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
            <h4 className="text-sm font-extrabold text-slate-800">Uploading to KMS</h4>
            <p className="text-[10px] text-slate-455 font-bold mt-1">Parsing document content and permissions…</p>
          </div>
        </div>
      )}

      {/* 2. WINDOW DRAG OVERLAY DROPZONE */}
      {isDragOverWindow && (
        <div className="fixed inset-0 bg-blue-600/10 border-4 border-dashed border-blue-500 z-[99998] pointer-events-none flex items-center justify-center">
          <div className="bg-white px-6 py-4 rounded-2xl shadow-xl flex items-center gap-3">
            <Upload className="w-6 h-6 text-blue-500 animate-bounce" />
            <span className="text-xs font-black text-slate-800">Drop files here to upload to "{activeFolder.name}"</span>
          </div>
        </div>
      )}

      {/* 3. NEW FOLDER MODAL */}
      {showNewFolderModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 select-none">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
              <h4 className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                <FolderOpen className="w-4 h-4 text-blue-500" />
                <span>Create New Folder</span>
              </h4>
              <button type="button" onClick={() => setShowNewFolderModal(false)} className="p-1 hover:bg-slate-200 rounded text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={triggerCreateFolder} className="p-5 space-y-4 text-xs font-semibold text-slate-700">
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-455 uppercase">Folder Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Invoices 2026"
                  value={newFolderVal.name}
                  onChange={(e) => setNewFolderVal(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full border border-slate-250 rounded-lg px-3 py-2 focus:ring-1 focus:ring-blue-500 outline-none text-slate-800"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-455 uppercase">Description</label>
                <textarea
                  placeholder="Summarize folder scope..."
                  value={newFolderVal.description}
                  onChange={(e) => setNewFolderVal(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full border border-slate-250 rounded-lg px-3 py-2 focus:ring-1 focus:ring-blue-500 outline-none text-slate-800 h-16 resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-455 uppercase">Department</label>
                  <select
                    value={newFolderVal.department}
                    onChange={(e) => setNewFolderVal(prev => ({ ...prev, department: e.target.value }))}
                    className="w-full border border-slate-255 rounded-lg px-2.5 py-1.5 text-slate-800 bg-white"
                  >
                    <option value="Finance">Finance</option>
                    <option value="HR">HR</option>
                    <option value="Legal">Legal</option>
                    <option value="Operations">Operations</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Marketing">Marketing</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-455 uppercase">Default Permissions</label>
                  <select
                    value={newFolderVal.permissions}
                    onChange={(e) => setNewFolderVal(prev => ({ ...prev, permissions: e.target.value }))}
                    className="w-full border border-slate-255 rounded-lg px-2.5 py-1.5 text-slate-800 bg-white"
                  >
                    <option value="Viewer">Viewer (Read Only)</option>
                    <option value="Editor">Editor (Read/Write)</option>
                  </select>
                </div>
              </div>
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button type="button" onClick={() => setShowNewFolderModal(false)} className="px-3.5 py-2 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-655 font-bold">Cancel</button>
                <button type="submit" className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold border border-blue-500 shadow-sm">Create Folder</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. RENAME MODAL */}
      {showRenameModal && renameTarget && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 select-none">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
              <h4 className="text-xs font-extrabold text-slate-800">Rename Item</h4>
              <button type="button" onClick={() => setShowRenameModal(false)} className="p-1 hover:bg-slate-200 rounded text-slate-400"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={triggerRenameAction} className="p-5 space-y-4 text-xs font-semibold text-slate-700">
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-455 uppercase">New Name</label>
                <input
                  type="text"
                  required
                  value={renameNewName}
                  onChange={(e) => setRenameNewName(e.target.value)}
                  className="w-full border border-slate-250 rounded-lg px-3 py-2 focus:ring-1 focus:ring-blue-500 outline-none text-slate-800"
                />
              </div>
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button type="button" onClick={() => setShowRenameModal(false)} className="px-3.5 py-2 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-655 font-bold">Cancel</button>
                <button type="submit" className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. DELETE CONFIRMATION */}
      {showDeleteConfirm && deleteTarget && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 select-none">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-sm overflow-hidden text-center p-6 flex flex-col items-center animate-in zoom-in-95 duration-200">
            <Trash2 className="w-12 h-12 text-red-500 mb-4 bg-red-50 p-2.5 rounded-full" />
            <h4 className="text-sm font-extrabold text-slate-900">Delete Item?</h4>
            <p className="text-[10px] text-slate-450 font-bold mt-1.5 max-w-xs">
              Are you sure you want to move "{deleteTarget.name}" to the Recycle Bin?
            </p>
            <div className="mt-6 flex items-center justify-center gap-2 w-full">
              <button type="button" onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-2 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-slate-655">Keep File</button>
              <button type="button" onClick={triggerDeleteConfirm} className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white border border-red-500 rounded-lg text-xs font-bold shadow-sm">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* 6. MOVE / COPY TREE PICKER MODAL */}
      {showTreePicker && pickerTargetItems.length > 0 && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 select-none animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
              <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                {pickerAction === 'move' ? 'Move Items to...' : 'Copy Items to...'}
              </h4>
              <button type="button" onClick={() => setShowTreePicker(false)} className="p-1 hover:bg-slate-200 rounded text-slate-400"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 max-h-[300px] overflow-y-auto border-b border-slate-100 bg-slate-50/10">
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide block mb-3">Choose Destination Folder</span>
              <div className="space-y-1.5 text-xs font-semibold text-slate-700">
                <button
                  type="button"
                  onClick={() => setPickerSelectedFolderId('root')}
                  className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 ${pickerSelectedFolderId === 'root' ? 'bg-blue-50 text-blue-650 font-extrabold border border-blue-200' : 'hover:bg-slate-100'}`}
                >
                  <Folder className="w-4 h-4 text-blue-500 fill-blue-500/10" />
                  <span>Corporate Knowledge (Root)</span>
                </button>
                {folderTreeNodes[0]?.subFolders?.map((node: any) => (
                  <div key={node.id} className="pl-4 space-y-1">
                    <button
                      type="button"
                      onClick={() => setPickerSelectedFolderId(node.id.toString())}
                      className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 ${pickerSelectedFolderId === node.id.toString() ? 'bg-blue-50 text-blue-655 font-extrabold border border-blue-200' : 'hover:bg-slate-100'}`}
                    >
                      <Folder className="w-4 h-4 text-blue-500 fill-blue-500/10" />
                      <span>{node.name}</span>
                    </button>
                    {node.subFolders?.map((sub: any) => (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => setPickerSelectedFolderId(sub.id.toString())}
                        className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 pl-6 ${pickerSelectedFolderId === sub.id.toString() ? 'bg-blue-50 text-blue-655 font-extrabold border border-blue-200' : 'hover:bg-slate-100'}`}
                      >
                        <Folder className="w-4 h-4 text-slate-400" />
                        <span>{sub.name}</span>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 flex items-center justify-between bg-slate-50/50">
              <span className="text-[10px] text-slate-455 font-bold">
                Selected: <b className="text-slate-700">{pickerSelectedFolderId}</b>
              </span>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setShowTreePicker(false)} className="px-3 py-1.5 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold">Cancel</button>
                <button type="button" onClick={triggerMoveCopyAction} className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-sm text-xs">
                  {pickerAction === 'move' ? 'Move Here' : 'Copy Here'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. VERSION HISTORY DRAWER PANEL */}
      {showVersionHistory && versionHistoryDoc && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex justify-end select-none">
          <div className="bg-white w-[360px] h-full shadow-2xl border-l border-slate-200 flex flex-col overflow-hidden animate-in slide-in-from-right duration-250">
            <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                  <History className="w-4 h-4 text-blue-500" />
                  <span>Version History</span>
                </h4>
                <p className="text-[10px] text-slate-455 font-bold mt-0.5 max-w-[280px] truncate">{versionHistoryDoc.name}</p>
              </div>
              <button type="button" onClick={() => setShowVersionHistory(false)} className="p-1 hover:bg-slate-200 rounded text-slate-400"><X className="w-4 h-4" /></button>
            </div>
            <div className="flex-1 p-5 overflow-y-auto space-y-5 text-xs font-semibold text-slate-700">
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide block">Revisions Log</span>
              <div className="relative border-l border-slate-200 pl-4 ml-2.5 space-y-6">
                <div className="relative">
                  <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-blue-600 border-2 border-white ring-4 ring-blue-50" />
                  <div>
                    <span className="text-[11px] font-black text-slate-900">{versionHistoryDoc.version || 'v1.0'} (Active)</span>
                    <p className="text-[10px] text-slate-455 font-bold mt-0.5">Current version</p>
                    <span className="text-[9px] text-slate-400 mt-1 block">{versionHistoryDoc.modifiedAt || 'Today'}</span>
                  </div>
                </div>
                <div className="relative opacity-60">
                  <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-slate-300 border-2 border-white" />
                  <div>
                    <span className="text-[11px] font-black text-slate-900">v1.0 (Initial Creation)</span>
                    <p className="text-[10px] text-slate-455 font-bold mt-0.5">System generated metadata blueprint</p>
                    <span className="text-[9px] text-slate-400 mt-1 block">15 May 2026, 09:00 AM</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-[11px] font-extrabold">
              <span className="text-slate-500">2 active revisions</span>
              <button
                type="button"
                onClick={() => { showToast('Reverted to v1.0 draft (Simulated)'); setShowVersionHistory(false); }}
                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-slate-700 transition-colors"
              >
                Revert to Initial
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. QUICK PREVIEW MODAL */}
      {previewDoc && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-6 select-none animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-[900px] max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-150 bg-slate-50/50 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                  <Eye className="w-4 h-4 text-blue-500" />
                  <span>Quick Preview: {previewDoc.name}</span>
                </h3>
                <p className="text-[10px] text-slate-450 font-bold mt-0.5">
                  Format: {previewDoc.fileType} · Size: {previewDoc.size} · Owner: {previewDoc.ownerName}
                </p>
              </div>
              <button onClick={() => setPreviewDoc(null)} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-8 bg-slate-100/50 flex justify-center items-start">
              {(previewDoc.fileType === 'DOCX' || previewDoc.fileType === 'TXT') && (
                <div className="w-full max-w-2xl bg-white border border-slate-200/80 shadow-sm rounded-xl p-8 text-slate-850 font-serif leading-relaxed text-xs">
                  <h1 className="text-xl font-extrabold font-sans text-slate-900 border-b border-slate-150 pb-4 mb-6">{previewDoc.name.replace(/\.(docx|txt)$/, '')}</h1>
                  <p className="mb-4">This document has been cataloged under organization knowledge rules. Any edits require administrative lock ownership.</p>
                  <h2 className="text-sm font-bold font-sans text-slate-800 mt-6 mb-2">1. Overview</h2>
                  <p>This corporate layout outlines operational frameworks and strategic objectives. Teams should ensure cross-departmental alignment prior to submission.</p>
                </div>
              )}
              {previewDoc.fileType === 'IMAGE' && (
                <div className="flex flex-col items-center gap-4">
                  <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm text-xs font-bold text-slate-700">
                    <button onClick={() => setPreviewImageZoom(prev => Math.max(0.5, prev - 0.25))} className="hover:text-blue-600 px-1.5">Zoom -</button>
                    <span className="w-12 text-center">{previewImageZoom * 100}%</span>
                    <button onClick={() => setPreviewImageZoom(prev => Math.min(2, prev + 0.25))} className="hover:text-blue-600 px-1.5">Zoom +</button>
                  </div>
                  <div className="bg-white border border-slate-200 shadow-md rounded-xl p-4 overflow-auto">
                    <div
                      className="bg-gradient-to-tr from-slate-200 to-slate-100 rounded-lg flex items-center justify-center text-slate-400 font-bold transition-all text-xs"
                      style={{ width: `${300 * previewImageZoom}px`, height: `${225 * previewImageZoom}px` }}
                    >
                      {previewDoc.name}
                    </div>
                  </div>
                </div>
              )}
              {previewDoc.fileType !== 'DOCX' && previewDoc.fileType !== 'TXT' && previewDoc.fileType !== 'IMAGE' && (
                <div className="w-full max-w-md bg-white border border-slate-200 shadow-sm rounded-xl p-8 text-center">
                  <div className="text-4xl mb-4">📄</div>
                  <h3 className="text-sm font-extrabold text-slate-800 mb-2">{previewDoc.name}</h3>
                  <p className="text-xs text-slate-500 font-medium mb-6">Open this file in the full editor to view its contents.</p>
                  <button
                    type="button"
                    onClick={() => { setPreviewDoc(null); navigate(`/documents/${previewDoc.id}`); }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold border border-blue-500 shadow-sm transition-all"
                  >
                    Open in Editor
                  </button>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-slate-150 bg-slate-50/50 flex items-center justify-end gap-2.5">
              <button type="button" onClick={() => setPreviewDoc(null)} className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-extrabold shadow-sm transition-all">Close Preview</button>
              <button
                type="button"
                onClick={() => { setPreviewDoc(null); navigate(`/documents/${previewDoc.id}`); }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold border border-blue-500 shadow-md transition-all"
              >
                Open in Editor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. ENTERPRISE SHARE DIALOG MODAL */}
      {shareDoc && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-6 select-none animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-[500px] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 text-xs text-slate-700">
            <div className="px-5 py-4 border-b border-slate-150 bg-slate-50/50 flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                <Share2 className="w-4 h-4 text-blue-600" />
                <span>Share: {shareDoc.name}</span>
              </h3>
              <button onClick={() => setShareDoc(null)} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide">Invite User, Department or Role</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Finance, HR, employee@company.com"
                    value={shareSettings.userOrDept}
                    onChange={(e) => setShareSettings(prev => ({ ...prev, userOrDept: e.target.value }))}
                    className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold outline-none focus:border-blue-500 shadow-sm"
                  />
                  <select
                    value={shareSettings.role}
                    onChange={(e) => setShareSettings(prev => ({ ...prev, role: e.target.value }))}
                    className="bg-white border border-slate-200 rounded-lg px-2 py-2 text-[11px] font-bold text-slate-700 shadow-sm"
                  >
                    <option value="Viewer">Viewer</option>
                    <option value="Editor">Editor</option>
                    <option value="Approver">Approver</option>
                    <option value="Owner">Owner</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide">Expiry Date</label>
                  <input
                    type="date"
                    value={shareSettings.expiryDate}
                    onChange={(e) => setShareSettings(prev => ({ ...prev, expiryDate: e.target.value }))}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold outline-none focus:border-blue-500 shadow-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide">Password (Optional)</label>
                  <input
                    type="password"
                    placeholder="None"
                    value={shareSettings.password}
                    onChange={(e) => setShareSettings(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold outline-none focus:border-blue-500 shadow-sm"
                  />
                </div>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-extrabold text-slate-800">Public Link Access</div>
                    <div className="text-[10px] text-slate-450 font-bold mt-0.5">Allows access to anyone with the link</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={shareSettings.publicLinkEnabled}
                    onChange={(e) => setShareSettings(prev => ({ ...prev, publicLinkEnabled: e.target.checked }))}
                    className="rounded text-blue-600 focus:ring-0 w-3.5 h-3.5 cursor-pointer"
                  />
                </div>
                {shareSettings.publicLinkEnabled && (
                  <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg p-1.5 pl-2.5 shadow-inner">
                    <span className="text-[9px] text-blue-600 font-mono select-all truncate flex-1">
                      https://kms.fasttrade.com/shared/link/{shareDoc.id}
                    </span>
                    <button
                      type="button"
                      onClick={() => { navigator.clipboard.writeText(`https://kms.fasttrade.com/shared/link/${shareDoc.id}`); showToast('Copied public link!'); }}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded font-extrabold text-[9px] uppercase border border-slate-200 transition-colors"
                    >
                      Copy
                    </button>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <div className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide">Who has access</div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 bg-slate-50/50 rounded-lg p-2">
                    <span className="flex items-center gap-1.5">👥 HR & Engineering Teams</span>
                    <span className="text-[10px] text-slate-450 font-extrabold uppercase">Viewer (Inherited)</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 bg-slate-50/50 rounded-lg p-2">
                    <span className="flex items-center gap-1.5">👤 Owner (Creator)</span>
                    <span className="text-[10px] text-slate-455 font-extrabold uppercase">Owner</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="px-5 py-4 border-t border-slate-150 bg-slate-50/50 flex items-center justify-end gap-2.5">
              <button type="button" onClick={() => setShareDoc(null)} className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-extrabold shadow-sm transition-all">Close</button>
              <button
                type="button"
                onClick={() => { showToast(`Share updated for "${shareDoc.name}"`); setShareDoc(null); }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold border border-blue-500 shadow-md transition-all"
              >
                Apply Share
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 10. TOAST NOTIFICATION */}
      {toastMsg && (
        <div className="fixed bottom-6 left-6 bg-slate-900 text-white rounded-xl py-3 px-4 shadow-2xl z-[99999] flex items-center gap-2 animate-in fade-in slide-in-from-bottom-5 duration-200 text-xs font-bold select-none border border-slate-800">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* 11. RIGHT-CLICK CONTEXT MENU */}
      {contextMenu && (
        <div
          className="fixed bg-white border border-slate-200 shadow-2xl rounded-xl py-1.5 w-44 z-[99999] animate-in fade-in zoom-in-95 duration-100 text-xs font-semibold text-slate-700 select-none"
          style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.item.isFolder ? (
            <>
              <button onClick={() => { handleFolderSelect({ id: contextMenu.item.id, name: contextMenu.item.name }); setContextMenu(null); }} className="w-full text-left px-3.5 py-1.5 hover:bg-slate-50 flex items-center gap-2 text-slate-800"><FolderOpen className="w-3.5 h-3.5 text-slate-400" /><span>Open Folder</span></button>
              <button onClick={() => { setRenameTarget(contextMenu.item); setRenameNewName(contextMenu.item.name); setShowRenameModal(true); setContextMenu(null); }} className="w-full text-left px-3.5 py-1.5 hover:bg-slate-50 flex items-center gap-2"><Edit className="w-3.5 h-3.5 text-slate-400" /><span>Rename</span></button>
              <button onClick={() => { setPickerAction('move'); setPickerTargetItems([contextMenu.item]); setShowTreePicker(true); setContextMenu(null); }} className="w-full text-left px-3.5 py-1.5 hover:bg-slate-50 flex items-center gap-2"><FolderOpen className="w-3.5 h-3.5 text-slate-400" /><span>Move</span></button>
              <button onClick={() => { handleItemClick(contextMenu.item); setShowInfoPanel(true); setContextMenu(null); }} className="w-full text-left px-3.5 py-1.5 hover:bg-slate-50 flex items-center gap-2"><Info className="w-3.5 h-3.5 text-slate-400" /><span>Properties</span></button>
              <div className="h-[1px] bg-slate-100 my-1" />
              <button onClick={() => { setDeleteTarget(contextMenu.item); setShowDeleteConfirm(true); setContextMenu(null); }} className="w-full text-left px-3.5 py-1.5 hover:bg-red-50 text-red-600 flex items-center gap-2"><Trash2 className="w-3.5 h-3.5 text-red-500" /><span>Delete</span></button>
            </>
          ) : (
            <>
              <button onClick={() => { navigate(`/documents/${contextMenu.item.id}`); setContextMenu(null); }} className="w-full text-left px-3.5 py-1.5 hover:bg-slate-50 flex items-center gap-2 text-slate-800"><FolderOpen className="w-3.5 h-3.5 text-slate-400" /><span>Open</span></button>
              <button onClick={() => { setPreviewDoc(contextMenu.item); setPreviewImageZoom(1); setContextMenu(null); }} className="w-full text-left px-3.5 py-1.5 hover:bg-slate-50 flex items-center gap-2"><Eye className="w-3.5 h-3.5 text-slate-400" /><span>Preview</span></button>
              <button onClick={() => { setRenameTarget(contextMenu.item); setRenameNewName(contextMenu.item.name); setShowRenameModal(true); setContextMenu(null); }} className="w-full text-left px-3.5 py-1.5 hover:bg-slate-50 flex items-center gap-2"><Edit className="w-3.5 h-3.5 text-slate-400" /><span>Rename</span></button>
              <button onClick={() => { setPickerAction('move'); setPickerTargetItems([contextMenu.item]); setShowTreePicker(true); setContextMenu(null); }} className="w-full text-left px-3.5 py-1.5 hover:bg-slate-50 flex items-center gap-2"><FolderOpen className="w-3.5 h-3.5 text-slate-400" /><span>Move</span></button>
              <button onClick={() => { showToast('Initiating download…'); setContextMenu(null); }} className="w-full text-left px-3.5 py-1.5 hover:bg-slate-50 flex items-center gap-2"><Download className="w-3.5 h-3.5 text-slate-400" /><span>Download</span></button>
              <button onClick={() => { setShareDoc(contextMenu.item); setShareSettings({ userOrDept: '', role: 'Viewer', expiryDate: '', password: '', publicLinkEnabled: false }); setContextMenu(null); }} className="w-full text-left px-3.5 py-1.5 hover:bg-slate-50 flex items-center gap-2"><Share2 className="w-3.5 h-3.5 text-slate-400" /><span>Share</span></button>
              <button onClick={() => { handleToggleFavorite(contextMenu.item.id); setContextMenu(null); }} className="w-full text-left px-3.5 py-1.5 hover:bg-slate-50 flex items-center gap-2"><Star className="w-3.5 h-3.5 text-slate-400" /><span>{contextMenu.item.isFavorite ? 'Unfavorite' : 'Favorite'}</span></button>
              <button onClick={() => { setVersionHistoryDoc(contextMenu.item); setShowVersionHistory(true); setContextMenu(null); }} className="w-full text-left px-3.5 py-1.5 hover:bg-slate-50 flex items-center gap-2"><History className="w-3.5 h-3.5 text-slate-400" /><span>Version History</span></button>
              <button onClick={() => { saveAsTemplateMutation.mutate(contextMenu.item.id); setContextMenu(null); }} className="w-full text-left px-3.5 py-1.5 hover:bg-slate-50 flex items-center gap-2"><Copy className="w-3.5 h-3.5 text-slate-400" /><span>Save as Template</span></button>
              <button onClick={() => { handleItemClick(contextMenu.item); setShowInfoPanel(true); setContextMenu(null); }} className="w-full text-left px-3.5 py-1.5 hover:bg-slate-50 flex items-center gap-2"><Info className="w-3.5 h-3.5 text-slate-400" /><span>Properties</span></button>
              <div className="h-[1px] bg-slate-100 my-1" />
              <button onClick={() => { setDeleteTarget(contextMenu.item); setShowDeleteConfirm(true); setContextMenu(null); }} className="w-full text-left px-3.5 py-1.5 hover:bg-red-50 text-red-655 flex items-center gap-2"><Trash2 className="w-3.5 h-3.5 text-red-500" /><span>Delete</span></button>
            </>
          )}
        </div>
      )}
    </>
  );
}
