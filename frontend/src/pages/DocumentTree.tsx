import { useState } from 'react';
import type { MouseEvent } from 'react';
import { 
  Trash2, 
  Upload, 
  Plus, 
  Grid, 
  List, 
  Info
} from 'lucide-react';

import { useNavigate } from 'react-router-dom';
import Breadcrumb from '../components/Breadcrumb';
import SearchBar from '../components/SearchBar';
import ActionToolbar from '../components/ActionToolbar';
import FolderTree from '../components/FolderTree';
import type { FolderNode } from '../components/FolderTree';
import DocumentTable from '../components/DocumentTable';
import type { DocumentRowItem } from '../components/DocumentTable';
import RightInformationPanel from '../components/RightInformationPanel';
export default function DocumentTree() {
  const navigate = useNavigate();
  
  // Toggle info panel / details sidebar state
  const [showInfoPanel, setShowInfoPanel] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  // Active folder / breadcrumb state
  const [activeFolder, setActiveFolder] = useState<FolderNode>({ id: 'reports', name: 'Reports' });
  const [pathSegments, setPathSegments] = useState<string[]>(['Corporate Knowledge', 'Finance', 'Reports']);

  // Search input state
  const [searchVal, setSearchVal] = useState('');

  // Selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Folder tree data configuration
  const folderTreeNodes: FolderNode[] = [
    {
      id: 'root',
      name: 'Corporate Knowledge',
      subFolders: [
        { id: 'company_info', name: '00_Company Information' },
        { id: 'hr', name: '01_Human Resources' },
        {
          id: 'finance',
          name: '02_Finance',
          subFolders: [
            { id: 'policies', name: 'Policies' },
            { id: 'budgets', name: 'Budgets' },
            { id: 'reports', name: 'Reports' },
            { id: 'audit', name: 'Audit' }
          ]
        },
        { id: 'sales_marketing', name: '03_Sales & Marketing' },
        { id: 'operations', name: '04_Operations' },
        { id: 'legal', name: '05_Legal' },
        { id: 'projects', name: '06_Projects' }
      ]
    }
  ];

  // Document rows data configuration (matching mockup exactly)
  const mockDocuments: DocumentRowItem[] = [
    {
      id: 'doc-1',
      name: 'Q2 Budget Report.docx',
      version: 'v2.1',
      fileType: 'DOCX',
      modifiedAt: '19 May 2024, 10:30 AM',
      ownerName: 'Amit Verma',
      ownerInitials: 'AV',
      size: '2.4 MB'
    },
    {
      id: 'doc-2',
      name: 'Sales Report - April.xlsx',
      version: 'v1.3',
      fileType: 'XLSX',
      modifiedAt: '19 May 2024, 09:15 AM',
      ownerName: 'Rohit Sharma',
      ownerInitials: 'RS',
      size: '1.1 MB'
    },
    {
      id: 'doc-3',
      name: 'Vendor Agreement.pdf',
      fileType: 'PDF',
      modifiedAt: '18 May 2024, 04:20 PM',
      ownerName: 'Neha Gupta',
      ownerInitials: 'NG',
      size: '890 KB'
    },
    {
      id: 'doc-4',
      name: 'Product Roadmap.pptx',
      version: 'v3.0',
      fileType: 'PPTX',
      modifiedAt: '18 May 2024, 11:00 AM',
      ownerName: 'Rohit Sharma',
      ownerInitials: 'RS',
      size: '5.6 MB'
    },
    {
      id: 'doc-5',
      name: 'Financial Policy.docx',
      fileType: 'DOCX',
      modifiedAt: '17 May 2024, 03:45 PM',
      ownerName: 'Ritika Sharma',
      ownerInitials: 'RS',
      size: '1.2 MB'
    },
    {
      id: 'doc-6',
      name: 'Expense Analysis.xlsx',
      fileType: 'XLSX',
      modifiedAt: '17 May 2024, 02:10 PM',
      ownerName: 'Amit Verma',
      ownerInitials: 'AV',
      size: '980 KB'
    },
    {
      id: 'doc-7',
      name: 'Annual Financial Summary.pdf',
      fileType: 'PDF',
      modifiedAt: '16 May 2024, 05:30 PM',
      ownerName: 'Neha Gupta',
      ownerInitials: 'NG',
      size: '3.8 MB'
    },
    {
      id: 'doc-8',
      name: 'Budget Presentation Q2.pptx',
      fileType: 'PPTX',
      modifiedAt: '16 May 2024, 11:20 AM',
      ownerName: 'Priya Mehta',
      ownerInitials: 'PM',
      size: '12.4 MB'
    },
    {
      id: 'doc-9',
      name: 'Cash Flow Statement.xlsx',
      fileType: 'XLSX',
      modifiedAt: '15 May 2024, 10:05 AM',
      ownerName: 'Amit Verma',
      ownerInitials: 'AV',
      size: '750 KB'
    },
    {
      id: 'doc-10',
      name: 'Tax Compliance Guide.pdf',
      fileType: 'PDF',
      modifiedAt: '15 May 2024, 09:50 AM',
      ownerName: 'Rohit Sharma',
      ownerInitials: 'RS',
      size: '1.6 MB'
    }
  ];

  // Active / Selected single document state (pre-opened details as shown in mockup)
  const [activeDoc, setActiveDoc] = useState<DocumentRowItem | null>(mockDocuments[0]);

  // Folder selection logic
  const handleFolderSelect = (node: FolderNode) => {
    setActiveFolder(node);
    
    // Update breadcrumbs paths segments dynamically
    if (node.id === 'reports' || node.id === 'policies' || node.id === 'budgets' || node.id === 'audit') {
      setPathSegments(['Corporate Knowledge', 'Finance', node.name]);
    } else if (node.id === 'finance') {
      setPathSegments(['Corporate Knowledge', 'Finance']);
    } else if (node.id === 'root') {
      setPathSegments(['Corporate Knowledge']);
    } else {
      setPathSegments(['Corporate Knowledge', node.name]);
    }
    // Clear selections
    setSelectedIds([]);
  };

  // Breadcrumb segment click logic
  const handleBreadcrumbClick = (index: number) => {
    const targetSegment = pathSegments[index];
    const dummyNode: FolderNode = { id: targetSegment.toLowerCase().replace(' ', '_'), name: targetSegment };
    setActiveFolder(dummyNode);
    setPathSegments(pathSegments.slice(0, index + 1));
    setSelectedIds([]);
  };

  // Row selection checkbox triggers
  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.length === mockDocuments.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(mockDocuments.map(doc => doc.id));
    }
  };

  // Table row click selects active file for details panel
  const handleItemClick = (item: DocumentRowItem) => {
    setActiveDoc(item);
    if (!showInfoPanel) {
      setShowInfoPanel(true); // Auto-reveal properties sidebar on document select
    }
  };

  const handleActionClick = (item: DocumentRowItem, e: MouseEvent) => {
    e.stopPropagation();
    alert(`Triggered details operations for "${item.name}"`);
  };

  return (
    <div className="flex flex-col h-full bg-white select-none font-sans text-slate-800 -m-8">
      
      {/* 1. TOP DOCUMENT TITLE & TOOLBAR ROW */}
      <div className="px-8 py-3 border-b border-slate-200/80 flex items-center justify-between shrink-0 select-none bg-white">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">Documents</h1>
          
          {/* Header Search & Filter */}
          <SearchBar
            value={searchVal}
            onChange={setSearchVal}
            placeholder="Search documents, folders..."
            onFilterClick={() => alert('Search filters menu (Mock)')}
          />
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => alert('Upload modal opened (Mock)')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 border border-slate-200 hover:border-slate-350 hover:bg-slate-50 text-xs font-bold text-slate-650 rounded-lg transition-colors bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
          >
            <Upload className="w-3.5 h-3.5 text-slate-400" />
            <span>Upload</span>
          </button>
          
          <button
            type="button"
            onClick={() => alert('New document wizard (Mock)')}
            className="glow-btn bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-3.5 py-1.5 text-xs font-bold shadow-sm flex items-center gap-1 border border-blue-500 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New</span>
          </button>
        </div>
      </div>

      {/* 2. SUB-HEADER BREADCRUMB & PANEL VIEWS TOGGLES */}
      <div className="px-8 py-2.5 border-b border-slate-200/60 flex items-center justify-between shrink-0 bg-white">
        <Breadcrumb
          segments={pathSegments}
          onSegmentClick={handleBreadcrumbClick}
        />
        
        {/* Panel layouts controllers */}
        <div className="flex items-center gap-2">
          {/* List/Grid View mode */}
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-lg border transition-all ${
              viewMode === 'list' 
                ? 'bg-slate-100 border-slate-200 text-slate-800 font-bold' 
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
            title="List View"
          >
            <List className="w-4 h-4" />
          </button>
          
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-lg border transition-all ${
              viewMode === 'grid' 
                ? 'bg-slate-100 border-slate-200 text-slate-800 font-bold' 
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
            title="Grid View"
          >
            <Grid className="w-4 h-4" />
          </button>

          <div className="h-4 w-[1px] bg-slate-200 mx-1" />

          {/* Details toggle */}
          <button
            type="button"
            onClick={() => setShowInfoPanel(!showInfoPanel)}
            className={`p-1.5 rounded-lg border transition-all ${
              showInfoPanel 
                ? 'bg-slate-100 border-slate-200 text-blue-600' 
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
            title="Info Panel"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3. MULTI-PANEL VIEW WORKSPACE */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* LEFT PANEL: FOLDER HIERARCHY TREE (w-[240px]) */}
        <div className="w-[240px] border-r border-slate-200/80 p-4 shrink-0 bg-white flex flex-col justify-between overflow-y-auto custom-scrollbar">
          <div className="space-y-4">
            <FolderTree
              nodes={folderTreeNodes}
              activeFolderId={activeFolder.id}
              onFolderSelect={handleFolderSelect}
            />
          </div>

          {/* Recycle bin link */}
          <button
            type="button"
            onClick={() => alert('Recycle Bin selected (Mock)')}
            className="w-full flex items-center gap-2 py-2 px-2.5 rounded-lg transition-all text-left text-xs font-bold text-slate-650 hover:bg-slate-50 hover:text-slate-900 mt-6 border-t border-slate-100 pt-4"
          >
            <Trash2 className="w-4 h-4 text-slate-400" />
            <span>Recycle Bin</span>
          </button>
        </div>

        {/* CENTER PANEL: DOCUMENT LIST & ACTIONS TOOLBAR (Flex-1) */}
        <div className="flex-1 flex flex-col overflow-hidden bg-white">
          {/* Action buttons toolbar */}
          <div className="px-6 shrink-0">
            <ActionToolbar
              isSelectionActive={selectedIds.length > 0}
              onShareClick={() => alert(`Sharing files: [${selectedIds.join(', ')}]`)}
              onDownloadClick={() => alert(`Downloading files: [${selectedIds.join(', ')}]`)}
              onMoveClick={() => alert(`Moving files: [${selectedIds.join(', ')}]`)}
              onDeleteClick={() => {
                if (confirm(`Are you sure you want to delete ${selectedIds.length} files?`)) {
                  alert(`Deleted files: [${selectedIds.join(', ')}]`);
                  setSelectedIds([]);
                }
              }}
              onNewClick={() => alert('Create new document selected')}
              onUploadClick={() => alert('Upload file dialog activated')}
            />
          </div>

          {/* Main Table Grid Container */}
          <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar">
            <DocumentTable
              items={mockDocuments}
              selectedIds={selectedIds}
              activeId={activeDoc?.id}
              onToggleSelect={handleToggleSelect}
              onToggleSelectAll={handleToggleSelectAll}
              onItemClick={handleItemClick}
              onActionClick={handleActionClick}
            />
          </div>

          {/* Bottom Pagination & metadata footer */}
          <div className="px-6 py-3 border-t border-slate-150/60 bg-white flex items-center justify-between shrink-0 select-none text-[11px] font-semibold text-slate-500">
            <span>Showing 1 to 10 of 64 items</span>
            
            {/* Pagination Controls */}
            <div className="flex items-center gap-1.5">
              <button 
                type="button" 
                onClick={() => alert('Previous page')}
                className="p-1 border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-50 transition-colors"
                disabled
              >
                &lt;
              </button>
              
              <button 
                type="button" 
                className="w-6 h-6 rounded flex items-center justify-center bg-blue-600 text-white font-extrabold shadow-sm"
              >
                1
              </button>
              
              {[2, 3].map(p => (
                <button 
                  key={p}
                  type="button" 
                  onClick={() => alert(`Go to page ${p}`)}
                  className="w-6 h-6 rounded flex items-center justify-center border border-slate-200 hover:bg-slate-50 hover:border-slate-350 transition-colors"
                >
                  {p}
                </button>
              ))}

              <span className="px-1 text-slate-300 font-normal">...</span>

              <button 
                type="button" 
                onClick={() => alert('Go to page 7')}
                className="w-6 h-6 rounded flex items-center justify-center border border-slate-200 hover:bg-slate-50 hover:border-slate-350 transition-colors"
              >
                7
              </button>

              <button 
                type="button" 
                onClick={() => alert('Next page')}
                className="p-1 border border-slate-200 rounded hover:bg-slate-50 transition-colors"
              >
                &gt;
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: DOCUMENT INFORMATION & PREVIEW DETAILS SIDEBAR (w-[320px]) */}
        {showInfoPanel && (
          <div className="w-[320px] border-l border-slate-200 shrink-0 bg-white h-full overflow-hidden transition-all duration-200 animate-in slide-in-from-right-6">
            <RightInformationPanel
              item={activeDoc}
              onClose={() => setShowInfoPanel(false)}
              onOpenClick={(item) => navigate(`/documents/${item.id}`)}
              onDownloadClick={(item) => alert(`Initiating download for file: "${item.name}" (UI only)`)}
              onShareClick={(item) => alert(`Opening share menu for file: "${item.name}" (UI only)`)}
            />
          </div>
        )}

      </div>
      
    </div>
  );
}
