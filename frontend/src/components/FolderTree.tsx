import { useState, memo } from 'react';
import { Folder, ChevronRight, ChevronDown } from 'lucide-react';

export interface FolderNode {
  id: string | number;
  name: string;
  subFolders?: FolderNode[];
  sub_folders?: FolderNode[];
}

interface FolderTreeProps {
  nodes: FolderNode[];
  activeFolderId?: string | number;
  onFolderSelect?: (node: FolderNode) => void;
  defaultExpandedIds?: Record<string | number, boolean>;
}

function FolderTree({
  nodes,
  activeFolderId,
  onFolderSelect,
  defaultExpandedIds = {}
}: FolderTreeProps) {
  const [expandedNodes, setExpandedNodes] = useState<Record<string | number, boolean>>({
    ...defaultExpandedIds,
    'root': true,
    'finance': true // pre-expand Finance folder as shown in mockup
  });

  const toggleExpand = (id: string | number, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedNodes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const renderTree = (items: FolderNode[], depth = 0) => {
    return items.map((node) => {
      const children = node.sub_folders || node.subFolders || [];
      const hasChildren = children.length > 0;
      const isExpanded = !!expandedNodes[node.id];
      const isActive = activeFolderId === node.id;

      return (
        <div key={node.id} className="space-y-0.5 select-none">
          {/* Folder row */}
          <div
            onClick={() => onFolderSelect?.(node)}
            style={{ paddingLeft: `${8 + depth * 14}px` }}
            className={`w-full flex items-center gap-1.5 py-2 px-2.5 rounded-lg transition-all text-left text-xs font-bold border-l-2 cursor-pointer ${
              isActive 
                ? 'bg-blue-50 text-blue-600 border-blue-600' 
                : 'text-slate-655 hover:bg-slate-50 hover:text-slate-900 border-l-2 border-transparent'
            }`}
          >
            {/* Toggle arrow */}
            <div 
              onClick={(e) => {
                if (hasChildren) {
                  toggleExpand(node.id, e);
                }
              }}
              className="p-0.5 rounded hover:bg-slate-150 text-slate-400 hover:text-slate-600 transition-colors"
            >
              {hasChildren ? (
                isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />
              ) : (
                <div className="w-3.5 h-3.5" />
              )}
            </div>

            {/* Icon */}
            <Folder className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-500 fill-blue-50' : 'text-slate-400'}`} />

            {/* Folder Name */}
            <span className="truncate flex-1 pr-1">{node.name}</span>
          </div>

          {/* Children subfolders container */}
          {hasChildren && isExpanded && (
            <div className="mt-0.5">
              {renderTree(children, depth + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="space-y-0.5">
      {renderTree(nodes)}
    </div>
  );
}

export default memo(FolderTree);
