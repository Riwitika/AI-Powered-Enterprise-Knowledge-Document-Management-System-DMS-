import React from 'react';
import { MoreVertical } from 'lucide-react';

export interface DocumentRowItem {
  id: string;
  name: string;
  version?: string;
  fileType: string;
  modifiedAt: string;
  ownerName: string;
  ownerInitials: string;
  ownerAvatar?: string;
  size: string;
  badgeStyle?: string;
  status?: string;
}

interface DocumentTableProps {
  items: DocumentRowItem[];
  selectedIds: string[];
  activeId?: string | null;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onItemClick: (item: DocumentRowItem) => void;
  onActionClick: (item: DocumentRowItem, e: React.MouseEvent) => void;
}

export default function DocumentTable({
  items,
  selectedIds,
  activeId,
  onToggleSelect,
  onToggleSelectAll,
  onItemClick,
  onActionClick
}: DocumentTableProps) {
  const isAllSelected = items.length > 0 && selectedIds.length === items.length;

  const getFileTypeIcon = (fileType: string) => {
    const type = fileType.toLowerCase();
    const className = "w-7.5 h-7.5 shrink-0 rounded flex items-center justify-center font-bold text-[10px] select-none border";
    if (type === 'docx' || type === 'doc') {
      return <div className={`${className} bg-blue-50 text-blue-600 border-blue-100`}>W</div>;
    }
    if (type === 'pdf') {
      return <div className={`${className} bg-red-50 text-red-600 border-red-100`}>P</div>;
    }
    if (type === 'xlsx' || type === 'xls' || type === 'csv') {
      return <div className={`${className} bg-emerald-50 text-emerald-600 border-emerald-100`}>X</div>;
    }
    if (type === 'pptx' || type === 'ppt') {
      return <div className={`${className} bg-orange-50 text-orange-600 border-orange-100`}>P</div>;
    }
    if (type === 'txt') {
      return <div className={`${className} bg-slate-50 text-slate-600 border-slate-200`}>T</div>;
    }
    return <div className={`${className} bg-slate-50 text-slate-500 border-slate-200`}>D</div>;
  };

  return (
    <div className="w-full overflow-x-auto select-none">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-200/60 text-[10.5px] font-extrabold text-slate-400 uppercase tracking-wider">
            <th className="py-3 px-4 w-10">
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={onToggleSelectAll}
                className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-600/20 focus:outline-none"
              />
            </th>
            <th className="py-3 px-4">Name</th>
            <th className="py-3 px-4 w-20">Type</th>
            <th className="py-3 px-4 w-44">Modified</th>
            <th className="py-3 px-4 w-40">Modified By</th>
            <th className="py-3 px-4 w-24">Size</th>
            <th className="py-3 px-4 w-10"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100/60 text-xs font-semibold text-slate-700">
          {items.map((item) => {
            const isSelected = selectedIds.includes(item.id);
            const isActive = activeId === item.id;

            return (
              <tr
                key={item.id}
                onClick={() => onItemClick(item)}
                className={`group border border-transparent transition-all cursor-pointer hover:bg-slate-50/50 ${
                  isActive 
                    ? 'bg-blue-50/60 hover:bg-blue-50' 
                    : isSelected 
                      ? 'bg-slate-50/40' 
                      : ''
                }`}
              >
                {/* Checkbox */}
                <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleSelect(item.id)}
                    className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-600/20 focus:outline-none"
                  />
                </td>

                {/* Name */}
                <td className="py-3 px-4 min-w-0">
                  <div className="flex items-center gap-3">
                    {getFileTypeIcon(item.fileType)}
                    <span className="font-extrabold text-slate-800 hover:text-blue-600 block truncate max-w-[200px]">
                      {item.name}
                    </span>
                    {item.version && (
                      <span className="px-1.5 py-0.2 rounded border text-[8px] font-extrabold bg-blue-50 text-blue-600 border-blue-100 select-none">
                        {item.version}
                      </span>
                    )}
                  </div>
                </td>

                {/* Type */}
                <td className="py-3 px-4 text-slate-450 uppercase text-[10px] font-extrabold tracking-wider">
                  {item.fileType}
                </td>

                {/* Modified */}
                <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                  {item.modifiedAt}
                </td>

                {/* Modified By */}
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    {item.ownerAvatar ? (
                      <img
                        src={item.ownerAvatar}
                        alt={item.ownerName}
                        className="w-5.5 h-5.5 rounded-full shrink-0 object-cover border border-slate-100"
                      />
                    ) : (
                      <div className="w-5.5 h-5.5 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[8px] font-extrabold text-slate-600 shrink-0">
                        {item.ownerInitials}
                      </div>
                    )}
                    <span className="truncate max-w-[100px] block font-bold text-slate-700">{item.ownerName}</span>
                  </div>
                </td>

                {/* Size */}
                <td className="py-3 px-4 text-slate-500 font-medium">
                  {item.size}
                </td>

                {/* Action Trigger */}
                <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={(e) => onActionClick(item, e)}
                    className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-150 rounded-lg transition-all"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
