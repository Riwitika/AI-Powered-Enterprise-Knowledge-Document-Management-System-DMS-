import { useState } from 'react';
import type { MouseEvent } from 'react';
import { 
  Trash2, 
  Upload, 
  Plus, 
  Grid, 
  List, 
  Info,
  Layout,
  Search,
  Star,
  X,
  Sparkles,
  Copy,
  Archive,
  Edit
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
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  // Templates state & data
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [tplSearchVal, setTplSearchVal] = useState<string>('');
  const [aiPrompt, setAiPrompt] = useState<string>('');
  const [isAiGenerating, setIsAiGenerating] = useState<boolean>(false);
  const [recentlyUsedIds, setRecentlyUsedIds] = useState<string[]>(['meeting-minutes', 'business-report']);
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(true); // admin toggle switch

  // Form states for creating/editing templates
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formCat, setFormCat] = useState('HR');
  const [formDept, setFormDept] = useState('HR');
  const [formRole, setFormRole] = useState('All Roles');
  const [formVersion, setFormVersion] = useState('v1.0');

  interface TemplateItem {
    id: string;
    title: string;
    description: string;
    category: string;
    version: string;
    createdBy: string;
    lastUpdated: string;
    department: string;
    roleVisibility: string;
    isFavorite: boolean;
    isArchived: boolean;
    versionLogs?: string[];
  }

  const [templates, setTemplates] = useState<TemplateItem[]>([
    {
      id: 'blank',
      title: 'Blank Document',
      description: 'Start a fresh document with standard margins and basic typography.',
      category: 'General',
      version: 'v1.0',
      createdBy: 'System',
      lastUpdated: '10 days ago',
      department: 'All',
      roleVisibility: 'All Roles',
      isFavorite: false,
      isArchived: false,
      versionLogs: ['v1.0 - System creation']
    },
    {
      id: 'business-report',
      title: 'Business Report',
      description: 'Structured layout for formal corporate reports, summaries and reviews.',
      category: 'Finance',
      version: 'v2.4',
      createdBy: 'Finance Lead',
      lastUpdated: '2 days ago',
      department: 'Finance',
      roleVisibility: 'All Roles',
      isFavorite: true,
      isArchived: false,
      versionLogs: ['v1.0 - Initial layout', 'v2.0 - Metric grids update', 'v2.4 - Approved by Finance Lead']
    },
    {
      id: 'meeting-minutes',
      title: 'Meeting Minutes',
      description: 'Capture decisions, agendas, action items and attendees from client calls.',
      category: 'Operations',
      version: 'v1.2',
      createdBy: 'Operations Team',
      lastUpdated: 'Yesterday',
      department: 'Operations',
      roleVisibility: 'All Roles',
      isFavorite: false,
      isArchived: false,
      versionLogs: ['v1.0 - Initial template design', 'v1.2 - Added action checklist boxes']
    },
    {
      id: 'project-proposal',
      title: 'Project Proposal',
      description: 'Standard format for requesting project greenlights, outlines and cost estimates.',
      category: 'Marketing',
      version: 'v1.1',
      createdBy: 'PMO Lead',
      lastUpdated: '5 days ago',
      department: 'Marketing',
      roleVisibility: 'All Roles',
      isFavorite: true,
      isArchived: false,
      versionLogs: ['v1.0 - Design draft', 'v1.1 - Added resource allocation tables']
    },
    {
      id: 'technical-doc',
      title: 'Technical Documentation',
      description: 'Code blocks, API specifications, server architectures blueprint format.',
      category: 'Engineering',
      version: 'v3.0',
      createdBy: 'Dev Team',
      lastUpdated: 'Just now',
      department: 'Engineering',
      roleVisibility: 'All Roles',
      isFavorite: false,
      isArchived: false,
      versionLogs: ['v1.0 - Initial draft', 'v2.0 - Added syntax highlighter', 'v3.0 - API specification format']
    },
    {
      id: 'sop',
      title: 'SOP (Standard Operating Procedure)',
      description: 'Step-by-step checklist format to guide operational task compliance.',
      category: 'Operations',
      version: 'v2.0',
      createdBy: 'Operations Director',
      lastUpdated: '12 days ago',
      department: 'Operations',
      roleVisibility: 'All Roles',
      isFavorite: false,
      isArchived: false,
      versionLogs: ['v1.0 - Process draft', 'v2.0 - Multi-stage approval checklists']
    },
    {
      id: 'invoice',
      title: 'Invoice',
      description: 'Clean invoice layout for professional client billing records.',
      category: 'Finance',
      version: 'v1.0',
      createdBy: 'Billing Clerk',
      lastUpdated: '1 month ago',
      department: 'Finance',
      roleVisibility: 'Admin Only',
      isFavorite: false,
      isArchived: false,
      versionLogs: ['v1.0 - Corporate draft']
    },
    {
      id: 'hr-policy',
      title: 'HR Policy Guidebook',
      description: 'Draft employee handbooks, rules, compliance policies and codes.',
      category: 'HR',
      version: 'v2.1',
      createdBy: 'HR Manager',
      lastUpdated: '4 days ago',
      department: 'HR',
      roleVisibility: 'All Roles',
      isFavorite: false,
      isArchived: false,
      versionLogs: ['v1.0 - Employee policy list', 'v2.1 - Added remote compliance updates']
    },
    {
      id: 'nda',
      title: 'Non-Disclosure Agreement (NDA)',
      description: 'Confidentiality contract protection for internal team and vendors.',
      category: 'Legal',
      version: 'v1.5',
      createdBy: 'Legal Counsel',
      lastUpdated: '3 weeks ago',
      department: 'Legal',
      roleVisibility: 'Admin Only',
      isFavorite: true,
      isArchived: false,
      versionLogs: ['v1.0 - Standard NDA draft', 'v1.5 - Added data governance laws clauses']
    },
    {
      id: 'resume',
      title: 'Professional Resume',
      description: 'Standard resume blueprint format for internal profiles and bios.',
      category: 'HR',
      version: 'v1.0',
      createdBy: 'Talent Team',
      lastUpdated: '2 months ago',
      department: 'HR',
      roleVisibility: 'All Roles',
      isFavorite: false,
      isArchived: false,
      versionLogs: ['v1.0 - Initial template design']
    },
    {
      id: 'budget-report',
      title: 'Budget Allocation Report',
      description: 'Summary tables and spreadsheet metrics layout for corporate finance.',
      category: 'Finance',
      version: 'v3.1',
      createdBy: 'Finance Director',
      lastUpdated: '1 week ago',
      department: 'Finance',
      roleVisibility: 'Admin Only',
      isFavorite: false,
      isArchived: false,
      versionLogs: ['v1.0 - Initial structure', 'v2.0 - Excel sheets integrations', 'v3.1 - Corporate layout adjustments']
    },
    {
      id: 'research-paper',
      title: 'Research Paper',
      description: 'Spacious academic and research publication format for R&D departments.',
      category: 'Engineering',
      version: 'v1.0',
      createdBy: 'R&D Head',
      lastUpdated: '3 months ago',
      department: 'Engineering',
      roleVisibility: 'All Roles',
      isFavorite: false,
      isArchived: false,
      versionLogs: ['v1.0 - Academic guidelines formatting']
    },
    {
      id: 'company-letter',
      title: 'Company Letterhead',
      description: 'Clean formal communication letterhead format with corporate signature block.',
      category: 'Marketing',
      version: 'v1.2',
      createdBy: 'Marketing Team',
      lastUpdated: '2 weeks ago',
      department: 'Marketing',
      roleVisibility: 'All Roles',
      isFavorite: false,
      isArchived: false,
      versionLogs: ['v1.0 - Letterhead design', 'v1.2 - Corporate address updates']
    },
    {
      id: 'presentation-notes',
      title: 'Presentation Notes',
      description: 'Outline slides, speaker notes, and key slide highlights organizer.',
      category: 'Marketing',
      version: 'v2.2',
      createdBy: 'Design Lead',
      lastUpdated: '5 days ago',
      department: 'Marketing',
      roleVisibility: 'All Roles',
      isFavorite: false,
      isArchived: false,
      versionLogs: ['v1.0 - Notes draft', 'v2.2 - Design layout guidelines update']
    }
  ]);

  const handleUseTemplate = (tplId: string) => {
    setRecentlyUsedIds(prev => {
      const filtered = prev.filter(id => id !== tplId);
      return [tplId, ...filtered].slice(0, 4);
    });
    setShowTemplatesModal(false);
    navigate(`/documents/temp-${tplId}`);
  };

  const handleFavoriteToggle = (tplId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setTemplates(prev => prev.map(tpl => {
      if (tpl.id === tplId) {
        return { ...tpl, isFavorite: !tpl.isFavorite };
      }
      return tpl;
    }));
  };

  const handleDuplicateTemplate = (tplId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const tplToCopy = templates.find(t => t.id === tplId);
    if (tplToCopy) {
      const duplicated = {
        ...tplToCopy,
        id: `${tplToCopy.id}-copy-${Date.now()}`,
        title: `${tplToCopy.title} (Copy)`,
        version: 'v1.0',
        lastUpdated: 'Just now',
        createdBy: 'Admin (Duplicated)'
      };
      setTemplates(prev => [...prev, duplicated]);
    }
  };

  const handleDeleteTemplate = (tplId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setTemplates(prev => prev.filter(t => t.id !== tplId));
  };

  const handleArchiveToggle = (tplId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setTemplates(prev => prev.map(tpl => {
      if (tpl.id === tplId) {
        return { ...tpl, isArchived: !tpl.isArchived };
      }
      return tpl;
    }));
  };

  const handleCreateOrEditTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTemplateId) {
      setTemplates(prev => prev.map(t => {
        if (t.id === editingTemplateId) {
          return {
            ...t,
            title: formTitle,
            description: formDesc,
            category: formCat,
            department: formDept,
            roleVisibility: formRole,
            version: formVersion,
            lastUpdated: 'Just now',
            versionLogs: [...(t.versionLogs || []), `${formVersion} - Edited by Admin`]
          };
        }
        return t;
      }));
      setEditingTemplateId(null);
    } else {
      const newTpl = {
        id: `tpl-custom-${Date.now()}`,
        title: formTitle || 'Custom Template',
        description: formDesc || 'Custom corporate blueprint format.',
        category: formCat,
        version: formVersion || 'v1.0',
        createdBy: 'Admin User',
        lastUpdated: 'Just now',
        department: formDept,
        roleVisibility: formRole,
        isFavorite: false,
        isArchived: false,
        versionLogs: [`${formVersion || 'v1.0'} - Created by Admin`]
      };
      setTemplates(prev => [...prev, newTpl]);
    }
    setFormTitle('');
    setFormDesc('');
    setFormVersion('v1.0');
    setShowCreateForm(false);
  };

  const handleEditClick = (tpl: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTemplateId(tpl.id);
    setFormTitle(tpl.title);
    setFormDesc(tpl.description);
    setFormCat(tpl.category);
    setFormDept(tpl.department);
    setFormRole(tpl.roleVisibility);
    setFormVersion(tpl.version);
    setShowCreateForm(true);
  };

  const handleAiGenerate = () => {
    if (!aiPrompt.trim()) return;
    setIsAiGenerating(true);
    setTimeout(() => {
      const generatedId = `temp-ai-${Date.now()}`;
      const newTpl = {
        id: generatedId,
        title: `${aiPrompt.charAt(0).toUpperCase() + aiPrompt.slice(1)} Template`,
        description: `AI-generated document blueprint for "${aiPrompt}".`,
        category: 'Custom',
        version: 'v1.0 (AI)',
        createdBy: 'AI Copilot',
        lastUpdated: 'Just now',
        department: 'All',
        roleVisibility: 'All Roles',
        isFavorite: false,
        isArchived: false,
        versionLogs: ['v1.0 - AI generated draft']
      };
      setTemplates(prev => [newTpl, ...prev]);
      setIsAiGenerating(false);
      setAiPrompt('');
      setSelectedCategory('Custom');
    }, 1200);
  };

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
            onClick={() => {
              window.dispatchEvent(new CustomEvent('kms-close-layout-dropdowns'));
              setShowTemplatesModal(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 border border-slate-200 hover:border-slate-350 hover:bg-slate-50 text-xs font-bold text-slate-650 bg-white rounded-lg transition-colors shadow-sm"
          >
            <Layout className="w-3.5 h-3.5 text-slate-400" />
            <span>Templates</span>
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

      {/* ENTERPRISE TEMPLATES MODAL */}
      {showTemplatesModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-6 select-none animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-[1050px] max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Layout className="w-5 h-5 text-blue-600" />
                  <span>Enterprise Templates Library</span>
                </h3>
                <p className="text-[11px] text-slate-450 font-semibold mt-0.5">
                  Deploy standard department layouts, compliance documents or generate blueprints with AI
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                {/* Admin toggle switch */}
                <label className="flex items-center gap-2 cursor-pointer bg-slate-100 border border-slate-200 px-3 py-1 rounded-xl">
                  <span className="text-[10px] text-slate-655 font-extrabold uppercase tracking-wide">Admin Mode</span>
                  <input 
                    type="checkbox" 
                    checked={isAdmin} 
                    onChange={(e) => setIsAdmin(e.target.checked)} 
                    className="rounded text-blue-600 focus:ring-0 w-3.5 h-3.5"
                  />
                </label>

                {isAdmin && !showCreateForm && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingTemplateId(null);
                      setFormTitle('');
                      setFormDesc('');
                      setFormCat('General');
                      setFormDept('General');
                      setFormRole('All Roles');
                      setFormVersion('v1.0');
                      setShowCreateForm(true);
                    }}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold border border-blue-500 transition-all flex items-center gap-1 shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create Template</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setShowTemplatesModal(false);
                    setShowCreateForm(false);
                    setEditingTemplateId(null);
                  }}
                  className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Workspace Container */}
            <div className="flex-1 flex overflow-hidden">
              
              {/* Left side categories navigation */}
              <div className="w-[200px] border-r border-slate-200 bg-slate-50/20 p-4 space-y-1.5 overflow-y-auto shrink-0">
                <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider block mb-2 px-2">Categories</span>
                {[
                  'All',
                  'Recently Used',
                  'Favorites',
                  'General',
                  'HR',
                  'Finance',
                  'Engineering',
                  'Marketing',
                  'Legal',
                  'Operations',
                  'Custom'
                ].map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(cat);
                      setShowCreateForm(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                      selectedCategory === cat
                        ? 'bg-blue-50 text-blue-600 font-black'
                        : 'hover:bg-slate-100 text-slate-655'
                    }`}
                  >
                    <span>{cat}</span>
                    {cat === 'Favorites' && (
                      <Star className="w-3 h-3 fill-blue-600 text-blue-600" />
                    )}
                  </button>
                ))}
              </div>

              {/* Right Area panel (Details / Lists / Forms) */}
              <div className="flex-1 bg-slate-50/50 overflow-y-auto p-6 flex flex-col gap-6 relative">
                
                {showCreateForm ? (
                  /* Admin Create/Edit Form */
                  <form onSubmit={handleCreateOrEditTemplate} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 max-w-lg mx-auto w-full animate-in fade-in duration-150">
                    <h4 className="text-xs font-extrabold text-slate-900 border-b pb-2">
                      {editingTemplateId ? 'Edit Document Template' : 'Create New Document Template'}
                    </h4>
                    <div className="space-y-3.5">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-slate-500 font-bold uppercase">Template Title</label>
                        <input 
                          type="text" 
                          required
                          placeholder="e.g. Employee Evaluation Form"
                          value={formTitle}
                          onChange={(e) => setFormTitle(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:bg-white focus:border-blue-500 transition-colors"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-slate-500 font-bold uppercase">Short Description</label>
                        <textarea
                          required
                          rows={3}
                          placeholder="Provide a clear description of when to use this template."
                          value={formDesc}
                          onChange={(e) => setFormDesc(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:bg-white focus:border-blue-500 transition-colors resize-none"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] text-slate-500 font-bold uppercase">Category</label>
                          <select
                            value={formCat}
                            onChange={(e) => setFormCat(e.target.value)}
                            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:bg-white focus:border-blue-500"
                          >
                            {['General', 'HR', 'Finance', 'Engineering', 'Marketing', 'Legal', 'Operations', 'Custom'].map(o => (
                              <option key={o} value={o}>{o}</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] text-slate-505 font-bold uppercase">Department Tag</label>
                          <input 
                            type="text" 
                            placeholder="e.g. HR, Finance"
                            value={formDept}
                            onChange={(e) => setFormDept(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:bg-white"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] text-slate-500 font-bold uppercase">Role Visibility</label>
                          <select
                            value={formRole}
                            onChange={(e) => setFormRole(e.target.value)}
                            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:bg-white"
                          >
                            <option value="All Roles">All Roles</option>
                            <option value="Admin Only">Admin Only</option>
                            <option value="Executive Only">Executive Only</option>
                          </select>
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] text-slate-550 font-bold uppercase">Version Number</label>
                          <input 
                            type="text" 
                            placeholder="v1.0"
                            value={formVersion}
                            onChange={(e) => setFormVersion(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:bg-white"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2.5 pt-3 border-t">
                      <button
                        type="button"
                        onClick={() => {
                          setShowCreateForm(false);
                          setEditingTemplateId(null);
                        }}
                        className="px-4 py-2 border border-slate-200 hover:border-slate-350 hover:bg-slate-50 text-xs font-bold text-slate-600 rounded-xl transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white border border-blue-500 rounded-xl text-xs font-bold shadow-sm transition-all"
                      >
                        {editingTemplateId ? 'Save Changes' : 'Create Template'}
                      </button>
                    </div>
                  </form>
                ) : (
                  /* Search, Filters and Grid list view */
                  <>
                    {/* Top Action Panel */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-4.5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                      
                      {/* Instant Search input */}
                      <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-450 shrink-0" />
                        <input 
                          type="text"
                          placeholder={`Search ${selectedCategory} templates...`}
                          value={tplSearchVal}
                          onChange={(e) => setTplSearchVal(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs outline-none focus:bg-white focus:border-blue-550 transition-all font-semibold text-slate-700 shadow-[inset_0_1px_2px_rgba(0,0,0,0.015)]"
                        />
                      </div>

                      {/* AI Generate Template trigger */}
                      <div className="flex items-center gap-2 flex-1 max-w-md">
                        <input
                          type="text"
                          placeholder="AI Prompt: design a project roadmap checklist..."
                          value={aiPrompt}
                          onChange={(e) => setAiPrompt(e.target.value)}
                          disabled={isAiGenerating}
                          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:bg-white focus:border-blue-550 transition-all font-semibold text-slate-700 disabled:opacity-50"
                        />
                        <button
                          type="button"
                          onClick={handleAiGenerate}
                          disabled={isAiGenerating || !aiPrompt.trim()}
                          className="px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-650 hover:from-blue-700 hover:to-indigo-750 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all border border-blue-500 disabled:opacity-50"
                        >
                          <Sparkles className={`w-3.5 h-3.5 ${isAiGenerating ? 'animate-spin' : ''}`} />
                          <span>{isAiGenerating ? 'Creating...' : 'AI Generate'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Display Templates grid layout */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-450 font-extrabold uppercase tracking-wider">
                          Showing {templates.filter(tpl => {
                            if (selectedCategory === 'Favorites') return tpl.isFavorite;
                            if (selectedCategory === 'Recently Used') return recentlyUsedIds.includes(tpl.id);
                            if (selectedCategory !== 'All') return tpl.category === selectedCategory;
                            return !tpl.isArchived;
                          }).filter(tpl => {
                            if (tplSearchVal.trim()) {
                              const q = tplSearchVal.toLowerCase();
                              return tpl.title.toLowerCase().includes(q) || tpl.description.toLowerCase().includes(q);
                            }
                            return true;
                          }).length} {selectedCategory} blueprints
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {templates.filter(tpl => {
                          if (selectedCategory === 'Favorites') return tpl.isFavorite;
                          if (selectedCategory === 'Recently Used') return recentlyUsedIds.includes(tpl.id);
                          if (selectedCategory !== 'All') return tpl.category === selectedCategory;
                          return !tpl.isArchived;
                        }).filter(tpl => {
                          if (tplSearchVal.trim()) {
                            const q = tplSearchVal.toLowerCase();
                            return tpl.title.toLowerCase().includes(q) || tpl.description.toLowerCase().includes(q);
                          }
                          return true;
                        }).map(tpl => (
                          <div 
                            key={tpl.id}
                            className="bg-white border border-slate-200 hover:border-slate-350 hover:shadow-[0_4px_16px_rgba(0,0,0,0.02)] rounded-2xl p-4 flex gap-4 transition-all duration-200 select-none group relative"
                          >
                            
                            {/* Left Thumbnail placeholder */}
                            <div 
                              onClick={() => handleUseTemplate(tpl.id)}
                              className="w-20 h-24 bg-slate-50 border border-slate-100 rounded-lg flex flex-col items-center justify-center shrink-0 cursor-pointer shadow-sm relative overflow-hidden select-none hover:bg-slate-100/50 transition-colors"
                            >
                              <span className="text-[8px] font-extrabold text-blue-600/30 rotate-12 select-none uppercase tracking-widest absolute">
                                {tpl.category}
                              </span>
                              <Layout className="w-6 h-6 text-slate-300" />
                            </div>

                            {/* Right detailed metadata block */}
                            <div className="flex-1 min-w-0 flex flex-col justify-between">
                              <div>
                                <div className="flex items-start justify-between gap-2">
                                  <h5 
                                    onClick={() => handleUseTemplate(tpl.id)}
                                    className="font-extrabold text-slate-900 text-[12.5px] truncate cursor-pointer hover:text-blue-600 transition-colors"
                                  >
                                    {tpl.title}
                                  </h5>
                                  
                                  <button
                                    type="button"
                                    onClick={(e) => handleFavoriteToggle(tpl.id, e)}
                                    className={`p-1 rounded-full transition-colors ${
                                      tpl.isFavorite ? 'text-amber-500' : 'text-slate-350 hover:text-slate-500'
                                    }`}
                                    title={tpl.isFavorite ? 'Remove Favorite' : 'Mark Favorite'}
                                  >
                                    <Star className={`w-3.5 h-3.5 ${tpl.isFavorite ? 'fill-amber-500 text-amber-500' : ''}`} />
                                  </button>
                                </div>

                                <p className="text-[10.5px] text-slate-500 font-semibold line-clamp-2 mt-0.5 leading-relaxed">
                                  {tpl.description}
                                </p>
                              </div>

                              <div className="flex flex-wrap items-center gap-1.5 pt-2 select-none">
                                <span className="px-1.5 py-0.2 rounded border text-[8px] font-extrabold bg-blue-50 text-blue-700 border-blue-100">
                                  {tpl.department}
                                </span>
                                <span className="px-1.5 py-0.2 rounded border text-[8px] font-extrabold bg-slate-50 text-slate-600 border-slate-200">
                                  {tpl.version}
                                </span>
                                <span className="px-1.5 py-0.2 rounded border text-[8px] font-extrabold bg-amber-50 text-amber-700 border-amber-250">
                                  {tpl.roleVisibility}
                                </span>

                                {/* Hoverable details version log tooltip */}
                                <div className="relative group/tooltip inline-block select-none ml-auto">
                                  <span className="text-[9px] text-slate-400 font-bold underline cursor-help">Logs</span>
                                  <div className="absolute right-0 bottom-full mb-1 w-44 bg-slate-950 text-white text-[9.5px] rounded-lg p-2 opacity-0 group-hover/tooltip:opacity-100 transition-opacity z-50 pointer-events-none shadow-lg space-y-1">
                                    <div className="font-extrabold border-b border-white/20 pb-0.5 uppercase tracking-wide text-[7px] text-white/60">Version Logs</div>
                                    {tpl.versionLogs?.map((log, idx) => (
                                      <div key={idx} className="truncate">&bull; {log}</div>
                                    ))}
                                    <div className="text-[7.5px] text-slate-400 font-semibold pt-0.5">Updated: {tpl.lastUpdated}</div>
                                    <div className="text-[7.5px] text-slate-450">By: {tpl.createdBy}</div>
                                  </div>
                                </div>

                              </div>

                              {/* Use Template and Admin options group */}
                              <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-2">
                                <button
                                  type="button"
                                  onClick={() => handleUseTemplate(tpl.id)}
                                  className="px-3 py-1 bg-slate-100 hover:bg-blue-600 hover:text-white rounded-lg text-[10.5px] font-extrabold text-slate-600 transition-all border border-transparent shadow-[0_1px_2px_rgba(0,0,0,0.015)]"
                                >
                                  Use Template
                                  </button>

                                {/* Admin Actions */}
                                {isAdmin && (
                                  <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                    <button 
                                      type="button" 
                                      onClick={(e) => handleEditClick(tpl, e)}
                                      className="p-1 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded animate-in fade-in"
                                      title="Edit Template"
                                    >
                                      <Edit className="w-3.5 h-3.5" />
                                    </button>
                                    <button 
                                      type="button" 
                                      onClick={(e) => handleDuplicateTemplate(tpl.id, e)}
                                      className="p-1 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded animate-in fade-in"
                                      title="Duplicate Template"
                                    >
                                      <Copy className="w-3.5 h-3.5" />
                                    </button>
                                    <button 
                                      type="button" 
                                      onClick={(e) => handleArchiveToggle(tpl.id, e)}
                                      className={`p-1 hover:bg-slate-100 rounded animate-in fade-in ${tpl.isArchived ? 'text-amber-600' : 'text-slate-500 hover:text-slate-800'}`}
                                      title={tpl.isArchived ? 'Publish (Unarchive)' : 'Archive Template'}
                                    >
                                      <Archive className="w-3.5 h-3.5" />
                                    </button>
                                    <button 
                                      type="button" 
                                      onClick={(e) => handleDeleteTemplate(tpl.id, e)}
                                      className="p-1 hover:bg-slate-100 text-red-500 hover:text-red-700 rounded animate-in fade-in"
                                      title="Delete Template"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                )}
                              </div>

                            </div>
                          </div>
                        ))}
                        
                        {templates.filter(tpl => {
                          if (selectedCategory === 'Favorites') return tpl.isFavorite;
                          if (selectedCategory === 'Recently Used') return recentlyUsedIds.includes(tpl.id);
                          if (selectedCategory !== 'All') return tpl.category === selectedCategory;
                          return !tpl.isArchived;
                        }).filter(tpl => {
                          if (tplSearchVal.trim()) {
                            const q = tplSearchVal.toLowerCase();
                            return tpl.title.toLowerCase().includes(q) || tpl.description.toLowerCase().includes(q);
                          }
                          return true;
                        }).length === 0 && (
                          <div className="col-span-2 text-center py-10 bg-white border border-slate-200 rounded-2xl">
                            <span className="text-slate-400 font-extrabold text-xs block">No matching templates found</span>
                            <span className="text-[10px] text-slate-450 block mt-0.5">Try searching another category or generate one using AI Copilot</span>
                          </div>
                        )}
                      </div>

                    </div>
                  </>
                )}

              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
