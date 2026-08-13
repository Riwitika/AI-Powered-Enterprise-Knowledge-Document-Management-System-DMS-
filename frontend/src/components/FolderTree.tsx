import { useState, memo } from 'react';
import { 
  Folder, 
  ChevronRight, 
  ChevronDown, 
  FileText, 
  FileSpreadsheet, 
  FileArchive, 
  FileImage, 
  File 
} from 'lucide-react';

export interface FolderNode {
  id: string | number;
  name: string;
  subFolders?: FolderNode[];
  sub_folders?: FolderNode[];
  files?: any[];
}

interface FolderTreeProps {
  nodes: FolderNode[];
  activeFolderId?: string | number;
  onFolderSelect?: (node: FolderNode) => void;
  defaultExpandedIds?: Record<string | number, boolean>;
  activeFileId?: string;
  onFileSelect?: (file: any) => void;
}

const getFileIcon = (fileName: string) => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'docx':
    case 'doc':
      return <FileText className="w-4 h-4 text-blue-500 shrink-0" />;
    case 'xlsx':
    case 'xls':
    case 'csv':
      return <FileSpreadsheet className="w-4 h-4 text-emerald-500 shrink-0" />;
    case 'pptx':
    case 'ppt':
      return <FileArchive className="w-4 h-4 text-orange-500 shrink-0" />;
    case 'pdf':
      return <FileText className="w-4 h-4 text-red-500 shrink-0" />;
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'webp':
      return <FileImage className="w-4 h-4 text-purple-500 shrink-0" />;
    default:
      return <File className="w-4 h-4 text-slate-400 shrink-0" />;
  }
};

function FolderTree({
  nodes,
  activeFolderId,
  onFolderSelect,
  defaultExpandedIds = {},
  activeFileId,
  onFileSelect
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
      const files = node.files || [];
      const hasChildren = children.length > 0 || files.length > 0;
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
              className="p-0.5 rounded hover:bg-slate-150 text-slate-400 hover:text-slate-650 transition-colors"
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

          {/* Children subfolders and files container */}
          {hasChildren && isExpanded && (
            <div className="mt-0.5 space-y-0.5">
              {renderTree(children, depth + 1)}
              {files.map((file) => {
                const isFileActive = activeFileId === file.id;
                return (
                  <div
                    key={file.id}
                    onClick={() => onFileSelect?.(file)}
                    style={{ paddingLeft: `${24 + depth * 14}px` }}
                    className={`w-full flex items-center gap-1.5 py-1.5 px-2 rounded-lg transition-all text-left text-xs font-semibold cursor-pointer border-l-2 ${
                      isFileActive
                        ? 'bg-blue-50/70 text-blue-600 border-blue-600'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-transparent'
                    }`}
                  >
                    {getFileIcon(file.name)}
                    <span className="truncate flex-1 pr-1">{file.name}</span>
                  </div>
                );
              })}
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
