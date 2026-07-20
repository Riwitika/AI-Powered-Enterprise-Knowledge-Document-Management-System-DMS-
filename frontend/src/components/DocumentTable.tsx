import React, { useState } from 'react';
import { 
  MoreVertical, 
  Folder, 
  FileText, 
  FileSpreadsheet, 
  File, 
  Presentation, 
  Lock, 
  Star,
  ChevronDown,
  ChevronUp,
  Settings,
  Plus,
  Upload,
  Sparkles
} from 'lucide-react';

export interface DocumentRowItem {
  id: string;
  name: string;
  isFolder: boolean;
  version?: string;
  fileType: string;
  modifiedAt: string;
  ownerName: string;
  ownerInitials: string;
  ownerAvatar?: string;
  size: string;
  isFavorite?: boolean;
  isLocked?: boolean;
  lockedBy?: string;
  color?: string; // folder color
  department?: string;
  status?: string;
  createdOn?: string;
  whoCanAccess?: string;
  accessType?: string;
  aiSummaryText?: string;
}

interface DocumentTableProps {
  items: DocumentRowItem[];
  selectedIds: string[];
  activeId?: string | null;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onItemClick: (item: DocumentRowItem) => void;
  onItemDoubleClick?: (item: DocumentRowItem) => void;
  onActionClick: (item: DocumentRowItem, e: React.MouseEvent) => void;
  onContextMenuAction?: (item: DocumentRowItem, e: React.MouseEvent) => void;
  onToggleFavorite?: (id: string, e: React.MouseEvent) => void;
  onDragStart?: (e: React.DragEvent, item: DocumentRowItem) => void;
  onDragOverItem?: (e: React.DragEvent, item: DocumentRowItem) => void;
  onDropOnItem?: (e: React.DragEvent, item: DocumentRowItem) => void;
  onNewClick?: () => void;
  onUploadClick?: () => void;
  onAiGenerateClick?: () => void;
}

export default function DocumentTable({
  items,
  selectedIds,
  activeId,
  onToggleSelect,
  onToggleSelectAll,
  onItemClick,
  onItemDoubleClick,
  onActionClick,
  onContextMenuAction,
  onToggleFavorite,
  onDragStart,
  onDragOverItem,
  onDropOnItem,
  onNewClick,
  onUploadClick,
  onAiGenerateClick
}: DocumentTableProps) {
  const isAllSelected = items.length > 0 && selectedIds.length === items.length;

  // Sorting Local States
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Filtering Local States
  const [filterText, setFilterText] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [deptFilter, setDeptFilter] = useState('All');

  // Resizing Local States (widths in px)
  const [colWidths, setColWidths] = useState<Record<string, number>>({
    name: 260,
    type: 80,
    owner: 130,
    department: 120,
    modified: 160,
    size: 90,
    status: 90
  });

  // Column Visibility States
  const [visibleCols, setVisibleCols] = useState<Record<string, boolean>>({
    name: true,
    type: true,
    owner: true,
    department: true,
    modified: true,
    size: true,
    status: true
  });
  const [showColSettings, setShowColSettings] = useState(false);

  // Resize listener handler
  const startResize = (col: string, e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = colWidths[col];
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = Math.max(50, startWidth + (moveEvent.clientX - startX));
      setColWidths(prev => ({ ...prev, [col]: newWidth }));
    };
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Toggle sort direction
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getFileTypeIcon = (item: DocumentRowItem) => {
    if (item.isFolder) {
      const folderColor = item.color || '#f59e0b';
      return <Folder className="w-5 h-5 shrink-0" style={{ color: folderColor, fill: `${folderColor}15` }} />;
    }

    const type = item.fileType.toLowerCase();
    switch (type) {
      case 'docx':
      case 'doc':
      case 'txt':
        return <FileText className="w-5 h-5 text-blue-500 shrink-0" />;
      case 'xlsx':
      case 'xls':
      case 'csv':
        return <FileSpreadsheet className="w-5 h-5 text-emerald-500 shrink-0" />;
      case 'pptx':
      case 'ppt':
        return <Presentation className="w-5 h-5 text-orange-500 shrink-0" />;
      default:
        return <File className="w-5 h-5 text-slate-400 shrink-0" />;
    }
  };

  // Apply filters
  const filteredItems = items.filter(item => {
    const nameMatch = item.name.toLowerCase().includes(filterText.toLowerCase());
    const statusVal = item.isLocked ? 'Locked' : (item.status || 'Draft');
    const statusMatch = statusFilter === 'All' || statusVal === statusFilter;
    const deptVal = item.department || 'Operations';
    const deptMatch = deptFilter === 'All' || deptVal === deptFilter;
    return nameMatch && statusMatch && deptMatch;
  });

  // Apply sorts
  const sortedItems = [...filteredItems].sort((a, b) => {
    if (!sortField) return 0;
    
    let aVal: any = '';
    let bVal: any = '';
    
    if (sortField === 'name') {
      aVal = a.name.toLowerCase();
      bVal = b.name.toLowerCase();
    } else if (sortField === 'type') {
      aVal = a.fileType.toLowerCase();
      bVal = b.fileType.toLowerCase();
    } else if (sortField === 'owner') {
      aVal = a.ownerName.toLowerCase();
      bVal = b.ownerName.toLowerCase();
    } else if (sortField === 'department') {
      aVal = (a.department || 'Operations').toLowerCase();
      bVal = (b.department || 'Operations').toLowerCase();
    } else if (sortField === 'modified') {
      aVal = new Date(a.modifiedAt).getTime() || 0;
      bVal = new Date(b.modifiedAt).getTime() || 0;
    } else if (sortField === 'size') {
      aVal = parseFloat(a.size) || 0;
      bVal = parseFloat(b.size) || 0;
    } else if (sortField === 'status') {
      aVal = (a.isLocked ? 'Locked' : (a.status || 'Draft')).toLowerCase();
      bVal = (b.isLocked ? 'Locked' : (b.status || 'Draft')).toLowerCase();
    }

    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const renderSortIndicator = (field: string) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? (
      <ChevronUp className="w-3.5 h-3.5 text-blue-600 inline ml-1" />
    ) : (
      <ChevronDown className="w-3.5 h-3.5 text-blue-600 inline ml-1" />
    );
  };

  return (
    <div className="w-full flex flex-col h-full bg-white select-none">
      
      {/* Table Filters & Column visibility toolbar */}
      <div className="px-6 py-2.5 border-b border-slate-150/60 bg-slate-50/50 flex items-center justify-between shrink-0 select-none flex-wrap gap-2.5 z-20">
        <div className="flex items-center gap-3.5 flex-wrap">
          {/* Quick search input */}
          <input 
            type="text" 
            placeholder="Search items..." 
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-blue-500 text-slate-800 font-medium w-48 shadow-sm"
          />

          {/* Department Filter dropdown */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold">
            <span>Dept:</span>
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-2 py-1.2 outline-none text-[11px] font-bold text-slate-700 shadow-sm"
            >
              <option value="All">All Departments</option>
              <option value="Finance">Finance</option>
              <option value="HR">HR</option>
              <option value="Engineering">Engineering</option>
              <option value="Operations">Operations</option>
              <option value="Legal">Legal</option>
              <option value="Corporate">Corporate</option>
            </select>
          </div>

          {/* Status Filter dropdown */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold">
            <span>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-2 py-1.2 outline-none text-[11px] font-bold text-slate-700 shadow-sm"
            >
              <option value="All">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="Approved">Approved</option>
              <option value="Locked">Locked</option>
            </select>
          </div>
        </div>

        {/* Column Settings trigger */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowColSettings(!showColSettings)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-350 bg-white rounded-lg transition-all shadow-sm"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Columns</span>
          </button>

          {showColSettings && (
            <div className="absolute right-0 mt-1.5 w-44 bg-white border border-slate-200 rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.08)] p-3 z-30 space-y-2 animate-in fade-in slide-in-from-top-1 duration-150 text-xs font-semibold text-slate-700">
              <div className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider mb-1">Visible Columns</div>
              {Object.keys(visibleCols).map(col => (
                <label key={col} className="flex items-center gap-2 cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    checked={visibleCols[col]}
                    onChange={() => setVisibleCols(prev => ({ ...prev, [col]: !prev[col] }))}
                    className="rounded text-blue-600 border-slate-300 focus:ring-blue-600/10 h-3.5 w-3.5"
                  />
                  <span className="capitalize">{col}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Table Viewport */}
      <div className="flex-1 overflow-y-auto overflow-x-auto relative custom-scrollbar">
        {sortedItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center select-none bg-slate-50/20 rounded-2xl border border-dashed border-slate-200/80 p-8 max-w-lg mx-auto my-12 animate-in fade-in duration-200">
            <div className="w-16 h-16 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-4 shadow-sm animate-pulse">
              <Folder className="w-8 h-8" />
            </div>
            <h4 className="text-sm font-extrabold text-slate-800">This folder is empty</h4>
            <p className="text-[11px] text-slate-455 font-bold mt-1.5 max-w-[280px] leading-relaxed">
              Get started by uploading corporate resources, creating a nested directory, or draft dynamic outlines using AI blueprints.
            </p>
            <div className="flex items-center gap-2.5 mt-6">
              <button
                type="button"
                onClick={onUploadClick}
                className="px-3.5 py-1.8 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold shadow-sm transition-all flex items-center gap-1"
              >
                <Upload className="w-3.5 h-3.5 text-slate-400" />
                <span>Upload Files</span>
              </button>
              <button
                type="button"
                onClick={onNewClick}
                className="px-3.5 py-1.8 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold shadow-sm transition-all flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5 text-slate-400" />
                <span>Create Folder</span>
              </button>
              <button
                type="button"
                onClick={onAiGenerateClick}
                className="glow-btn px-3.5 py-1.8 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-md border border-blue-500 transition-all flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-200" />
                <span>Generate using AI</span>
              </button>
            </div>
          </div>
        ) : (
          <table className="w-full text-left border-collapse table-fixed min-w-[800px]">
            {/* Sticky Table Header */}
            <thead className="sticky top-0 bg-white border-b border-slate-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.015)] z-10 select-none">
              <tr className="text-[10.5px] font-extrabold text-slate-400 uppercase tracking-wider bg-slate-50/20">
                <th className="py-3.5 px-4 w-10">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={onToggleSelectAll}
                    className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-600/20 focus:outline-none"
                  />
                </th>

                {/* Name */}
                {visibleCols.name && (
                  <th className="py-3.5 px-4 relative group" style={{ width: `${colWidths.name}px` }}>
                    <div className="flex items-center justify-between cursor-pointer" onClick={() => handleSort('name')}>
                      <span>File Name</span>
                      {renderSortIndicator('name')}
                    </div>
                    <div className="absolute right-0 top-0 bottom-0 w-[3px] hover:w-[5px] bg-slate-200 hover:bg-blue-400 cursor-col-resize z-20 opacity-0 group-hover:opacity-100 transition-all" onMouseDown={(e) => startResize('name', e)} />
                  </th>
                )}

                {/* Type */}
                {visibleCols.type && (
                  <th className="py-3.5 px-4 relative group" style={{ width: `${colWidths.type}px` }}>
                    <div className="flex items-center justify-between cursor-pointer" onClick={() => handleSort('type')}>
                      <span>Type</span>
                      {renderSortIndicator('type')}
                    </div>
                    <div className="absolute right-0 top-0 bottom-0 w-[3px] hover:w-[5px] bg-slate-200 hover:bg-blue-400 cursor-col-resize z-20 opacity-0 group-hover:opacity-100 transition-all" onMouseDown={(e) => startResize('type', e)} />
                  </th>
                )}

                {/* Owner */}
                {visibleCols.owner && (
                  <th className="py-3.5 px-4 relative group" style={{ width: `${colWidths.owner}px` }}>
                    <div className="flex items-center justify-between cursor-pointer" onClick={() => handleSort('owner')}>
                      <span>Owner</span>
                      {renderSortIndicator('owner')}
                    </div>
                    <div className="absolute right-0 top-0 bottom-0 w-[3px] hover:w-[5px] bg-slate-200 hover:bg-blue-400 cursor-col-resize z-20 opacity-0 group-hover:opacity-100 transition-all" onMouseDown={(e) => startResize('owner', e)} />
                  </th>
                )}

                {/* Department */}
                {visibleCols.department && (
                  <th className="py-3.5 px-4 relative group" style={{ width: `${colWidths.department}px` }}>
                    <div className="flex items-center justify-between cursor-pointer" onClick={() => handleSort('department')}>
                      <span>Department</span>
                      {renderSortIndicator('department')}
                    </div>
                    <div className="absolute right-0 top-0 bottom-0 w-[3px] hover:w-[5px] bg-slate-200 hover:bg-blue-400 cursor-col-resize z-20 opacity-0 group-hover:opacity-100 transition-all" onMouseDown={(e) => startResize('department', e)} />
                  </th>
                )}

                {/* Modified */}
                {visibleCols.modified && (
                  <th className="py-3.5 px-4 relative group" style={{ width: `${colWidths.modified}px` }}>
                    <div className="flex items-center justify-between cursor-pointer" onClick={() => handleSort('modified')}>
                      <span>Last Modified</span>
                      {renderSortIndicator('modified')}
                    </div>
                    <div className="absolute right-0 top-0 bottom-0 w-[3px] hover:w-[5px] bg-slate-200 hover:bg-blue-400 cursor-col-resize z-20 opacity-0 group-hover:opacity-100 transition-all" onMouseDown={(e) => startResize('modified', e)} />
                  </th>
                )}

                {/* Size */}
                {visibleCols.size && (
                  <th className="py-3.5 px-4 relative group" style={{ width: `${colWidths.size}px` }}>
                    <div className="flex items-center justify-between cursor-pointer" onClick={() => handleSort('size')}>
                      <span>Size</span>
                      {renderSortIndicator('size')}
                    </div>
                    <div className="absolute right-0 top-0 bottom-0 w-[3px] hover:w-[5px] bg-slate-200 hover:bg-blue-400 cursor-col-resize z-20 opacity-0 group-hover:opacity-100 transition-all" onMouseDown={(e) => startResize('size', e)} />
                  </th>
                )}

                {/* Status */}
                {visibleCols.status && (
                  <th className="py-3.5 px-4 relative group" style={{ width: `${colWidths.status}px` }}>
                    <div className="flex items-center justify-between cursor-pointer" onClick={() => handleSort('status')}>
                      <span>Status</span>
                      {renderSortIndicator('status')}
                    </div>
                    <div className="absolute right-0 top-0 bottom-0 w-[3px] hover:w-[5px] bg-slate-200 hover:bg-blue-400 cursor-col-resize z-20 opacity-0 group-hover:opacity-100 transition-all" onMouseDown={(e) => startResize('status', e)} />
                  </th>
                )}

                <th className="py-3.5 px-4 w-12"></th>
              </tr>
            </thead>
            
            {/* Table Body with alternating colors */}
            <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
              {sortedItems.map((item) => {
                const isSelected = selectedIds.includes(item.id);
                const isActive = activeId === item.id;
                const statusVal = item.isLocked ? 'Locked' : (item.status || 'Draft');

                return (
                  <tr
                    key={item.id}
                    onClick={() => onItemClick(item)}
                    onDoubleClick={() => onItemDoubleClick?.(item)}
                    onContextMenu={(e) => {
                      if (onContextMenuAction) {
                        e.preventDefault();
                        onContextMenuAction(item, e);
                      }
                    }}
                    draggable
                    onDragStart={(e) => onDragStart?.(e, item)}
                    onDragOver={(e) => onDragOverItem?.(e, item)}
                    onDrop={(e) => onDropOnItem?.(e, item)}
                    className={`group border border-transparent transition-all cursor-pointer odd:bg-white even:bg-slate-50/10 hover:bg-blue-50/40 ${
                      isActive 
                        ? 'bg-blue-50/60 hover:bg-blue-50/80' 
                        : isSelected 
                          ? 'bg-slate-100/60 hover:bg-slate-100' 
                          : ''
                    }`}
                  >
                    {/* Checkbox select */}
                    <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelect(item.id)}
                        className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-600/20 focus:outline-none"
                      />
                    </td>

                    {/* File Name */}
                    {visibleCols.name && (
                      <td className="py-3.5 px-4 min-w-0">
                        <div className="flex items-center gap-2.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleFavorite?.(item.id, e);
                            }}
                            className={`p-0.5 rounded hover:bg-slate-100 transition-colors shrink-0 ${
                              item.isFavorite ? 'text-amber-500' : 'text-slate-350 opacity-0 group-hover:opacity-100'
                            }`}
                          >
                            <Star className="w-3.5 h-3.5 fill-current" />
                          </button>

                          {getFileTypeIcon(item)}

                          <span className="font-extrabold text-slate-800 hover:text-blue-600 block truncate" title={item.name}>
                            {item.name}
                          </span>

                          {item.version && (
                            <span className="px-1.5 py-0.2 rounded border text-[8px] font-extrabold bg-blue-50 text-blue-600 border-blue-100 select-none shrink-0">
                              {item.version}
                            </span>
                          )}
                        </div>
                      </td>
                    )}

                    {/* Type */}
                    {visibleCols.type && (
                      <td className="py-3.5 px-4 text-slate-450 uppercase text-[10px] font-extrabold tracking-wider truncate">
                        {item.fileType}
                      </td>
                    )}

                    {/* Owner */}
                    {visibleCols.owner && (
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          {item.ownerAvatar ? (
                            <img
                              src={item.ownerAvatar}
                              alt={item.ownerName}
                              className="w-5.5 h-5.5 rounded-full shrink-0 object-cover border border-slate-100"
                            />
                          ) : (
                            <div className="w-5.5 h-5.5 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[8px] font-extrabold text-slate-655 shrink-0">
                              {item.ownerInitials}
                            </div>
                          )}
                          <span className="truncate block font-bold text-slate-700">{item.ownerName}</span>
                        </div>
                      </td>
                    )}

                    {/* Department */}
                    {visibleCols.department && (
                      <td className="py-3.5 px-4 text-slate-500 truncate font-semibold">
                        {item.department || 'Operations'}
                      </td>
                    )}

                    {/* Last Modified */}
                    {visibleCols.modified && (
                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                        {item.modifiedAt}
                      </td>
                    )}

                    {/* Size */}
                    {visibleCols.size && (
                      <td className="py-3.5 px-4 text-slate-550 font-medium">
                        {item.size}
                      </td>
                    )}

                    {/* Status */}
                    {visibleCols.status && (
                      <td className="py-3.5 px-4">
                        {item.isLocked ? (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md border text-[9px] font-extrabold bg-red-50 text-red-600 border-red-150 uppercase" title={`Locked by ${item.lockedBy || 'Paras'}`}>
                            <Lock className="w-2.5 h-2.5 shrink-0" />
                            <span>Locked</span>
                          </span>
                        ) : (
                          <span className={`inline-flex px-1.5 py-0.5 rounded-md border text-[9px] font-extrabold uppercase ${
                            statusVal === 'Approved'
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-150'
                              : 'bg-amber-50 text-amber-705 border-amber-150'
                          }`}>
                            {statusVal}
                          </span>
                        )}
                      </td>
                    )}

                    {/* Action Trigger */}
                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={(e) => onActionClick(item, e)}
                        className="p-1 text-slate-400 hover:text-slate-750 hover:bg-slate-100 rounded-lg transition-all"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
}
