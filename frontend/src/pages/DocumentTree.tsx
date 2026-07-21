import { useState, useEffect } from 'react';
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
  Edit,
  Loader2,
  Lock,
  Unlock,
  History,
  FolderOpen,
  CheckCircle,
  Folder,
  Download,
  Eye,
  Share2
} from 'lucide-react';

import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
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
  const { user } = useAuthStore();
  const activeRoleName = user?.role?.name || 'admin';
  const role: 'employee' | 'manager' | 'admin' = 
    (activeRoleName === 'super_admin' ? 'admin' : (activeRoleName === 'department_manager' ? 'manager' : activeRoleName)) as any;
  
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
  interface DMSItem extends DocumentRowItem {
    isFolder: boolean;
    folderId: string;
    isFavorite?: boolean;
    isLocked?: boolean;
    lockedBy?: string;
    color?: string;
    description?: string;
    department?: string;
    permissions?: string;
  }

  // Reactively notify active role change
  useEffect(() => {
    if (activeRoleName) {
      showToast(`Switched active authorization to: ${activeRoleName.toUpperCase().replace('_', ' ')}`);
    }
  }, [activeRoleName]);

  // Recycle bin storage
  const [recycleBinItems, setRecycleBinItems] = useState<DMSItem[]>([]);

  // Toast Notification Message
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // State modals toggle
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderVal, setNewFolderVal] = useState({
    name: '',
    description: '',
    color: '#3b82f6',
    department: 'Finance',
    owner: 'Paras Jain',
    permissions: 'Editor'
  });

  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameTarget, setRenameTarget] = useState<DMSItem | null>(null);
  const [renameNewName, setRenameNewName] = useState('');

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DMSItem | null>(null);

  const [showTreePicker, setShowTreePicker] = useState(false);
  const [pickerAction, setPickerAction] = useState<'move' | 'copy'>('move');
  const [pickerTargetItems, setPickerTargetItems] = useState<DMSItem[]>([]);
  const [pickerSelectedFolderId, setPickerSelectedFolderId] = useState<string>('root');

  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [versionHistoryDoc, setVersionHistoryDoc] = useState<DMSItem | null>(null);

  // Right click context menu state
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; item: DMSItem } | null>(null);

  // Quick Preview modal states
  const [previewDoc, setPreviewDoc] = useState<DMSItem | null>(null);
  const [previewImageZoom, setPreviewImageZoom] = useState(1);

  // Upload dialog modal states
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFilesQueue, setUploadFilesQueue] = useState<{name: string, size: string, progress: number, status: 'idle'|'uploading'|'success'|'error'}[]>([]);
  const [uploadModalProgress, setUploadModalProgress] = useState(0);
  const [uploadModalStatus, setUploadModalStatus] = useState<'idle' | 'uploading' | 'success'>('idle');
  const [uploadIntervalId, setUploadIntervalId] = useState<any>(null);

  // Share Dialog modal states
  const [shareDoc, setShareDoc] = useState<DMSItem | null>(null);
  const [shareSettings, setShareSettings] = useState({
    userOrDept: '',
    role: 'Viewer',
    expiryDate: '',
    password: '',
    publicLinkEnabled: false
  });

  // Drag & Drop states
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);

  // Upload Experience overlays
  const [isDragOverWindow, setIsDragOverWindow] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);

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
        createdBy: 'AI Document Assistant',
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
  const [folderTreeNodes, setFolderTreeNodes] = useState<FolderNode[]>([
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
  ]);

  // Document rows data configuration (matching mockup exactly)
  const defaultDocuments: DMSItem[] = [
    {
      id: 'doc-1',
      name: 'Q2 Budget Report.docx',
      version: 'v2.1',
      fileType: 'DOCX',
      modifiedAt: '19 May 2026, 10:30 AM',
      ownerName: 'Paras Jain',
      ownerInitials: 'PJ',
      size: '2.4 MB',
      isFolder: false,
      folderId: 'reports',
      isFavorite: false,
      isLocked: false
    },
    {
      id: 'doc-2',
      name: 'Sales Report - April.xlsx',
      version: 'v1.3',
      fileType: 'XLSX',
      modifiedAt: '19 May 2026, 09:15 AM',
      ownerName: 'Uttam Gupta',
      ownerInitials: 'UG',
      size: '1.1 MB',
      isFolder: false,
      folderId: 'reports',
      isFavorite: false,
      isLocked: false
    },
    {
      id: 'doc-3',
      name: 'Vendor Agreement.pdf',
      fileType: 'PDF',
      modifiedAt: '18 May 2026, 04:20 PM',
      ownerName: 'Riwitika Gupta',
      ownerInitials: 'RG',
      size: '890 KB',
      isFolder: false,
      folderId: 'legal',
      isFavorite: false,
      isLocked: false
    },
    {
      id: 'doc-4',
      name: 'Product Roadmap.pptx',
      version: 'v3.0',
      fileType: 'PPTX',
      modifiedAt: '18 May 2026, 11:00 AM',
      ownerName: 'Uttam Gupta',
      ownerInitials: 'UG',
      size: '5.6 MB',
      isFolder: false,
      folderId: 'sales_marketing',
      isFavorite: false,
      isLocked: false
    },
    {
      id: 'doc-5',
      name: 'Financial Policy.docx',
      fileType: 'DOCX',
      modifiedAt: '17 May 2026, 03:45 PM',
      ownerName: 'Yukti Gupta',
      ownerInitials: 'YG',
      size: '1.2 MB',
      isFolder: false,
      folderId: 'policies',
      isFavorite: false,
      isLocked: false
    },
    {
      id: 'doc-6',
      name: 'Expense Analysis.xlsx',
      fileType: 'XLSX',
      modifiedAt: '17 May 2026, 02:10 PM',
      ownerName: 'Paras Jain',
      ownerInitials: 'PJ',
      size: '980 KB',
      isFolder: false,
      folderId: 'budgets',
      isFavorite: false,
      isLocked: false
    },
    {
      id: 'doc-7',
      name: 'Annual Financial Summary.pdf',
      fileType: 'PDF',
      modifiedAt: '16 May 2026, 05:30 PM',
      ownerName: 'Riwitika Gupta',
      ownerInitials: 'RG',
      size: '3.8 MB',
      isFolder: false,
      folderId: 'budgets',
      isFavorite: false,
      isLocked: false
    },
    {
      id: 'doc-8',
      name: 'Budget Presentation Q2.pptx',
      fileType: 'PPTX',
      modifiedAt: '16 May 2026, 11:20 AM',
      ownerName: 'Yukti Gupta',
      ownerInitials: 'YG',
      size: '12.4 MB',
      isFolder: false,
      folderId: 'budgets',
      isFavorite: false,
      isLocked: false
    },
    {
      id: 'doc-9',
      name: 'Cash Flow Statement.xlsx',
      fileType: 'XLSX',
      modifiedAt: '15 May 2026, 10:05 AM',
      ownerName: 'Paras Jain',
      ownerInitials: 'PJ',
      size: '750 KB',
      isFolder: false,
      folderId: 'finance',
      isFavorite: false,
      isLocked: false
    },
    {
      id: 'doc-10',
      name: 'Tax Compliance Guide.pdf',
      fileType: 'PDF',
      modifiedAt: '15 May 2026, 09:50 AM',
      ownerName: 'Uttam Gupta',
      ownerInitials: 'UG',
      size: '1.6 MB',
      isFolder: false,
      folderId: 'finance',
      isFavorite: false,
      isLocked: false
    }
  ];

  const [documents, setDocuments] = useState<DMSItem[]>(() => {
    const saved = localStorage.getItem('kms-documents-db');
    return saved ? JSON.parse(saved) : defaultDocuments;
  });

  useEffect(() => {
    localStorage.setItem('kms-documents-db', JSON.stringify(documents));
  }, [documents]);

  // Active / Selected single document state (pre-opened details as shown in mockup)
  const [activeDoc, setActiveDoc] = useState<DocumentRowItem | null>(null);

  // Close context menu on outside click
  useEffect(() => {
    const handleOutsideClick = () => setContextMenu(null);
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  // Listen to window drop files for simulated upload overlay
  useEffect(() => {
    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer?.types.includes('Files')) {
        setIsDragOverWindow(true);
      }
    };
    const handleDragOver = (e: DragEvent) => e.preventDefault();
    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      if (e.clientX === 0 && e.clientY === 0) {
        setIsDragOverWindow(false);
      }
    };
    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      setIsDragOverWindow(false);
      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        triggerSimulatedUpload();
      }
    };

    window.addEventListener('dragenter', handleDragEnter);
    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragenter', handleDragEnter);
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('drop', handleDrop);
    };
  }, [activeFolder]);

  // Simulate file upload progress
  const triggerSimulatedUpload = () => {
    setIsUploading(true);
    setUploadProgress(0);
    setUploadSuccess(false);

    let progress = 0;
    const interval = setInterval(() => {
      progress += 20;
      setUploadProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        setUploadSuccess(true);
        setTimeout(() => {
          setIsUploading(false);
          const newDoc: DMSItem = {
            id: `uploaded-${Math.random().toString(36).substr(2, 9)}`,
            name: 'Uploaded_Document_Receipt.pdf',
            fileType: 'PDF',
            modifiedAt: new Date().toLocaleString(),
            ownerName: 'Paras Jain',
            ownerInitials: 'PJ',
            size: '1.4 MB',
            isFolder: false,
            folderId: activeFolder.id.toString(),
            isFavorite: false,
            isLocked: false
          };
          setDocuments(prev => [newDoc, ...prev]);
          showToast('Uploaded document successfully');
        }, 1000);
      }
    }, 300);
  };

  // Helper to simulate dialog upload progress queue
  const handleUploadModalStart = (filesList: string[], _isFolderUpload: boolean = false) => {
    if (filesList.length === 0) return;
    
    // Build simulated queue
    const queue = filesList.map(name => ({
      name,
      size: `${(Math.random() * 2 + 0.1).toFixed(1)} MB`,
      progress: 0,
      status: 'idle' as const
    }));
    
    setUploadFilesQueue(queue);
    setUploadModalStatus('uploading');
    setUploadModalProgress(0);
    setShowUploadModal(true);

    if (uploadIntervalId) clearInterval(uploadIntervalId);

    let overallProgress = 0;
    const interval = setInterval(() => {
      overallProgress += 10;
      setUploadModalProgress(overallProgress);

      setUploadFilesQueue(prev => prev.map((item, idx) => {
        // distribute progress sequentially
        const itemTargetProgress = Math.min(100, Math.max(0, overallProgress * filesList.length - idx * 100));
        return {
          ...item,
          progress: itemTargetProgress,
          status: itemTargetProgress >= 100 ? 'success' : 'uploading'
        };
      }));

      if (overallProgress >= 100) {
        clearInterval(interval);
        setUploadModalStatus('success');
        
        // Add new files to catalog database
        const uploadedDocs: DMSItem[] = filesList.map((name, idx) => {
          const ext = name.split('.').pop()?.toUpperCase() || 'PDF';
          return {
            id: `uploaded-${Date.now()}-${idx}`,
            name,
            version: 'v1.0',
            fileType: ext,
            modifiedAt: new Date().toLocaleString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }),
            ownerName: 'Paras',
            ownerInitials: 'P',
            size: `${(Math.random() * 2 + 0.1).toFixed(1)} MB`,
            isFolder: false,
            folderId: activeFolder.id.toString(),
            isFavorite: false,
            isLocked: false,
            department: 'Operations',
            status: 'Approved'
          };
        });
        
        setDocuments(prev => [...uploadedDocs, ...prev]);
        showToast(`Uploaded ${filesList.length} ${filesList.length === 1 ? 'file' : 'files'} successfully`);
      }
    }, 200);

    setUploadIntervalId(interval);
  };

  const handleUploadModalCancel = () => {
    if (uploadIntervalId) clearInterval(uploadIntervalId);
    setUploadModalStatus('idle');
    setUploadModalProgress(0);
    setUploadFilesQueue([]);
    setShowUploadModal(false);
    showToast('Upload cancelled');
  };

  const handleUploadModalRetry = () => {
    const fileNames = uploadFilesQueue.map(f => f.name);
    handleUploadModalStart(fileNames);
  };

  // Helper to create blank templates
  const handleCreateBlankFile = (format: string) => {
    const ext = format.toLowerCase();
    const id = `doc-${Date.now()}`;
    const name = `Untitled Outline.${ext}`;
    
    const newDoc: DMSItem = {
      id,
      name,
      version: 'v1.0',
      fileType: format.toUpperCase(),
      modifiedAt: new Date().toLocaleString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }),
      ownerName: 'Paras',
      ownerInitials: 'P',
      size: '0 KB',
      isFolder: false,
      folderId: activeFolder.id.toString(),
      isFavorite: false,
      isLocked: false,
      department: 'Operations',
      status: 'Draft'
    };

    setDocuments(prev => [newDoc, ...prev]);
    showToast(`Created blank ${format} file: "${name}"`);
    navigate(`/documents/${id}`);
  };

  // Helper to duplicate files
  const handleDuplicateItem = (item: DMSItem) => {
    const extIdx = item.name.lastIndexOf('.');
    const base = extIdx !== -1 ? item.name.substring(0, extIdx) : item.name;
    const ext = extIdx !== -1 ? item.name.substring(extIdx) : '';
    const newDoc: DMSItem = {
      ...item,
      id: `doc-${Date.now()}`,
      name: `${base}_copy${ext}`,
      modifiedAt: new Date().toLocaleString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }),
      status: 'Draft'
    };
    setDocuments(prev => [newDoc, ...prev]);
    showToast(`Duplicated "${item.name}"`);
  };

  // Helper to resolve subfolders of active folder node
  const getSubfoldersOf = (folderId: string): DMSItem[] => {
    const findSubfolders = (nodes: FolderNode[]): FolderNode[] => {
      for (const node of nodes) {
        if (node.id === folderId) return node.subFolders || [];
        if (node.subFolders) {
          const found = findSubfolders(node.subFolders);
          if (found.length > 0) return found;
        }
      }
      return [];
    };

    const subNodes = findSubfolders(folderTreeNodes);
    return subNodes.map(sn => ({
      id: sn.id.toString(),
      name: sn.name,
      isFolder: true,
      fileType: 'Folder',
      modifiedAt: '20 May 2026, 11:00 AM',
      ownerName: 'System',
      ownerInitials: 'SYS',
      size: '--',
      folderId: folderId
    }));
  };

  // Dynamically resolve items shown in table
  const getActiveViewItems = (): DMSItem[] => {
    let list: DMSItem[] = [];

    if (activeFolder.id === 'recycle_bin') {
      list = recycleBinItems;
    } else if (activeFolder.id === 'favorites') {
      const favDocs = documents.filter(d => d.isFavorite);
      list = [...favDocs];
    } else {
      const subs = getSubfoldersOf(activeFolder.id.toString());
      const files = documents.filter(doc => doc.folderId === activeFolder.id.toString());
      list = [...subs, ...files];
    }

    if (searchVal.trim()) {
      const q = searchVal.toLowerCase();
      list = list.filter(item => item.name.toLowerCase().includes(q));
    }

    return list;
  };

  const activeItems = getActiveViewItems();

  // Folder selection navigation
  const handleFolderSelect = (node: FolderNode) => {
    setActiveFolder(node);
    if (node.id === 'reports' || node.id === 'policies' || node.id === 'budgets' || node.id === 'audit') {
      setPathSegments(['Corporate Knowledge', '02_Finance', node.name]);
    } else if (node.id === 'finance') {
      setPathSegments(['Corporate Knowledge', '02_Finance']);
    } else if (node.id === 'root') {
      setPathSegments(['Corporate Knowledge']);
    } else {
      setPathSegments(['Corporate Knowledge', node.name]);
    }
    setSelectedIds([]);
  };

  // Breadcrumb segment click logic
  const handleBreadcrumbClick = (index: number) => {
    const targetSegment = pathSegments[index];
    let folderId = 'root';
    if (targetSegment.includes('Finance')) folderId = 'finance';
    else if (targetSegment.toLowerCase().includes('report')) folderId = 'reports';
    else if (targetSegment.toLowerCase().includes('policy')) folderId = 'policies';
    else if (targetSegment.toLowerCase().includes('budget')) folderId = 'budgets';
    else if (targetSegment.toLowerCase().includes('audit')) folderId = 'audit';
    else if (targetSegment !== 'Corporate Knowledge') {
      folderId = targetSegment.toLowerCase().replace(' ', '_');
    }
    
    handleFolderSelect({ id: folderId, name: targetSegment });
  };

  // Checkbox row selection logic
  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.length === activeItems.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(activeItems.map(item => item.id));
    }
  };

  // Table row click selects active file for details panel
  const handleItemClick = (item: DocumentRowItem) => {
    const dmsItem = activeItems.find(x => x.id === item.id) || null;
    setActiveDoc(dmsItem);
    
    // Auto broadcast to active context for AI
    if (dmsItem && !dmsItem.isFolder) {
      window.dispatchEvent(new CustomEvent('kms-active-document-change', {
        detail: {
          title: dmsItem.name,
          fileType: dmsItem.fileType,
          version: dmsItem.version || 'v1.0',
          owner: dmsItem.ownerName,
          selectedText: '',
          fullContent: 'Document metadata preview is active. The AI Document Assistant is listening.'
        }
      }));
    }
  };

  const handleItemDoubleClick = (item: DocumentRowItem) => {
    const dmsItem = activeItems.find(x => x.id === item.id);
    if (dmsItem && dmsItem.isFolder) {
      handleFolderSelect({ id: dmsItem.id, name: dmsItem.name });
    } else if (dmsItem) {
      navigate(`/documents/${dmsItem.id}`);
    }
  };

  // Row context menu trigger
  const handleContextMenuAction = (item: DocumentRowItem, e: React.MouseEvent) => {
    const dmsItem = activeItems.find(x => x.id === item.id);
    if (dmsItem) {
      setContextMenu({
        x: e.clientX,
        y: e.clientY,
        item: dmsItem
      });
    }
  };

  // Star Favorite Toggle
  const handleToggleFavorite = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setDocuments(prev => prev.map(doc => {
      if (doc.id === id) {
        const nextFav = !doc.isFavorite;
        showToast(nextFav ? 'Added file to Favorites' : 'Removed file from Favorites');
        return { ...doc, isFavorite: nextFav };
      }
      return doc;
    }));
  };

  // Create New Folder
  const triggerCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    const parentId = activeFolder.id.toString();

    // Check duplicate name
    const foldersOfActive = getSubfoldersOf(parentId);
    if (foldersOfActive.some(f => f.name.toLowerCase() === newFolderVal.name.toLowerCase().trim())) {
      alert('Error: A folder with this name already exists.');
      return;
    }

    const newFolderNode: FolderNode = {
      id: `folder-${Math.random().toString(36).substr(2, 9)}`,
      name: newFolderVal.name.trim(),
      subFolders: []
    };

    // Insert into Folder Tree
    const addSubfolderNode = (nodes: FolderNode[]): FolderNode[] => {
      return nodes.map(node => {
        if (node.id === parentId) {
          return {
            ...node,
            subFolders: [...(node.subFolders || []), newFolderNode]
          };
        }
        if (node.subFolders) {
          return {
            ...node,
            subFolders: addSubfolderNode(node.subFolders)
          };
        }
        return node;
      });
    };

    setFolderTreeNodes(prev => addSubfolderNode(prev));
    setShowNewFolderModal(false);
    setNewFolderVal({
      name: '',
      description: '',
      color: '#3b82f6',
      department: 'Finance',
      owner: 'Paras Jain',
      permissions: 'Editor'
    });
    showToast('Folder created successfully');
  };

  // Rename action trigger
  const triggerRenameAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameTarget) return;

    const trimmed = renameNewName.trim();
    if (!trimmed) return;

    // Check duplicate naming checks in same directory
    if (activeItems.some(i => i.id !== renameTarget.id && i.name.toLowerCase() === trimmed.toLowerCase())) {
      alert('Error: An item with this name already exists in this folder.');
      return;
    }

    if (renameTarget.isFolder) {
      const renameFolderNode = (nodes: FolderNode[]): FolderNode[] => {
        return nodes.map(node => {
          if (node.id === renameTarget.id) {
            return { ...node, name: trimmed };
          }
          if (node.subFolders) {
            return { ...node, subFolders: renameFolderNode(node.subFolders) };
          }
          return node;
        });
      };
      setFolderTreeNodes(prev => renameFolderNode(prev));
    } else {
      setDocuments(prev => prev.map(d => d.id === renameTarget.id ? { ...d, name: trimmed } : d));
    }

    setShowRenameModal(false);
    setRenameTarget(null);
    showToast('Item renamed successfully');
  };

  // Move/Copy Action execution
  const triggerMoveCopyAction = () => {
    if (pickerTargetItems.length === 0) return;

    const targetIds = pickerTargetItems.map(t => t.id);

    if (pickerAction === 'move') {
      setDocuments(prev => prev.map(doc => {
        if (targetIds.includes(doc.id)) {
          return { ...doc, folderId: pickerSelectedFolderId };
        }
        return doc;
      }));
      showToast(`Moved ${pickerTargetItems.length} items successfully`);
    } else {
      const copies: DMSItem[] = pickerTargetItems.map(t => ({
        ...t,
        id: `copy-${Math.random().toString(36).substr(2, 9)}`,
        name: `Copy of ${t.name}`,
        folderId: pickerSelectedFolderId,
        isLocked: false
      }));
      setDocuments(prev => [...copies, ...prev]);
      showToast(`Copied ${pickerTargetItems.length} items successfully`);
    }

    setShowTreePicker(false);
    setPickerTargetItems([]);
  };

  // Delete Action trigger (Confirmation warnings)
  const triggerDeleteConfirm = () => {
    if (!deleteTarget) return;

    setDocuments(prev => prev.filter(doc => doc.id !== deleteTarget.id));
    setRecycleBinItems(prev => [deleteTarget, ...prev]);

    setShowDeleteConfirm(false);
    setDeleteTarget(null);
    setSelectedIds([]);
    showToast('Item moved to Recycle Bin');
  };

  // Recycle Bin managers
  const handleEmptyRecycleBin = () => {
    setRecycleBinItems([]);
    showToast('Recycle Bin emptied permanently');
  };

  const handleRestoreItem = (item: DMSItem) => {
    setRecycleBinItems(prev => prev.filter(x => x.id !== item.id));
    setDocuments(prev => [item, ...prev]);
    showToast(`Restored "${item.name}"`);
  };

  const handleDeleteItemPermanently = (item: DMSItem) => {
    setRecycleBinItems(prev => prev.filter(x => x.id !== item.id));
    showToast(`Permanently deleted "${item.name}"`);
  };

  // Lock document toggler
  const handleToggleLock = (item: DMSItem) => {
    setDocuments(prev => prev.map(doc => {
      if (doc.id === item.id) {
        const nextLocked = !doc.isLocked;
        showToast(nextLocked ? 'Document locked for editing' : 'Document unlocked successfully');
        return {
          ...doc,
          isLocked: nextLocked,
          lockedBy: nextLocked ? 'Paras Jain' : undefined
        };
      }
      return doc;
    }));
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, item: DMSItem) => {
    e.dataTransfer.setData('text/plain', item.id);
    setDraggedItemId(item.id);
  };

  const handleDragOverItem = (e: React.DragEvent, item: DMSItem) => {
    if (item.isFolder && item.id !== draggedItemId) {
      e.preventDefault();
    }
  };

  const handleDropOnItem = (e: React.DragEvent, targetItem: DMSItem) => {
    e.preventDefault();
    const sourceId = e.dataTransfer.getData('text/plain');
    
    if (sourceId && targetItem.isFolder && sourceId !== targetItem.id) {
      setDocuments(prev => prev.map(doc => {
        if (doc.id === sourceId) {
          return { ...doc, folderId: targetItem.id };
        }
        return doc;
      }));
      showToast(`Moved item successfully into "${targetItem.name}"`);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white select-none font-sans text-slate-800 -m-6">
      
      {/* 1. SINGLE UNIFIED HEADER ROW */}
      <div className="px-6 py-2.5 border-b border-slate-200 flex items-center justify-between shrink-0 select-none bg-white">
        <div className="flex items-center gap-3.5 flex-1 min-w-0">
          <h1 className="text-base font-extrabold text-slate-900 tracking-tight shrink-0">Documents</h1>
          <div className="h-4 w-[1px] bg-slate-200 shrink-0" />
          
          {/* Breadcrumb inline */}
          <div className="shrink-0 max-w-[280px] overflow-hidden truncate">
            <Breadcrumb
              segments={pathSegments}
              onSegmentClick={handleBreadcrumbClick}
            />
          </div>
          <div className="h-4 w-[1px] bg-slate-200 shrink-0" />

          {/* Header Search & Filter */}
          <SearchBar
            value={searchVal}
            onChange={setSearchVal}
            placeholder="Search documents, folders..."
            onFilterClick={() => alert('Search filters menu (Mock)')}
          />
        </div>

        {/* Right Action buttons and view controls */}
        <div className="flex items-center gap-3 select-none shrink-0 ml-4">
          <button
            type="button"
            onClick={() => {
              window.dispatchEvent(new CustomEvent('kms-close-layout-dropdowns'));
              setShowTemplatesModal(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-xs font-bold text-slate-600 bg-white rounded-lg transition-colors shadow-sm"
          >
            <Layout className="w-3.5 h-3.5 text-slate-400" />
            <span>Templates</span>
          </button>

          <div className="h-4 w-[1px] bg-slate-200" />

          {/* List/Grid View mode */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg border transition-colors ${
                viewMode === 'list' 
                  ? 'bg-slate-105 border-slate-200 text-slate-800 font-bold' 
                  : 'border-transparent text-slate-400 hover:text-slate-650'
              }`}
              title="List View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg border transition-colors ${
                viewMode === 'grid' 
                  ? 'bg-slate-105 border-slate-200 text-slate-800 font-bold' 
                  : 'border-transparent text-slate-400 hover:text-slate-650'
              }`}
              title="Grid View"
            >
              <Grid className="w-3.5 h-3.5" />
            </button>

            <div className="h-4 w-[1px] bg-slate-200 mx-1" />

            {/* Details toggle */}
            <button
              type="button"
              onClick={() => setShowInfoPanel(!showInfoPanel)}
              className={`p-1.5 rounded-lg border transition-colors ${
                showInfoPanel 
                  ? 'bg-slate-105 border-slate-200 text-blue-600' 
                  : 'border-transparent text-slate-400 hover:text-slate-650'
              }`}
              title="Info Panel"
            >
              <Info className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. MULTI-PANEL VIEW WORKSPACE */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* LEFT PANEL: FOLDER HIERARCHY TREE */}
        <div className="w-[240px] border-r border-slate-200/80 p-4 shrink-0 bg-white flex flex-col justify-between overflow-y-auto custom-scrollbar">
          <div className="space-y-4">
            
            {/* Favorites link shortcut */}
            <button
              type="button"
              onClick={() => handleFolderSelect({ id: 'favorites', name: '★ Starred Favorites' })}
              className={`w-full flex items-center gap-2 py-2 px-2.5 rounded-lg transition-all text-left text-xs font-bold border-l-2 ${
                activeFolder.id === 'favorites'
                  ? 'bg-blue-50 text-blue-600 border-blue-600'
                  : 'text-slate-655 hover:bg-slate-50 hover:text-slate-900 border-transparent'
              }`}
            >
              <Star className={`w-4 h-4 ${activeFolder.id === 'favorites' ? 'text-blue-500 fill-blue-500/10' : 'text-slate-400'}`} />
              <span>Favorites</span>
            </button>

            <div className="h-[1px] bg-slate-150/60 my-2" />

            <FolderTree
              nodes={folderTreeNodes}
              activeFolderId={activeFolder.id}
              onFolderSelect={handleFolderSelect}
            />
          </div>

          {/* Recycle bin link */}
          <button
            type="button"
            onClick={() => handleFolderSelect({ id: 'recycle_bin', name: 'Recycle Bin' })}
            className={`w-full flex items-center gap-2 py-2 px-2.5 rounded-lg transition-all text-left text-xs font-bold border-t border-slate-100 pt-4 mt-6 border-l-2 ${
              activeFolder.id === 'recycle_bin'
                ? 'bg-blue-50 text-blue-600 border-blue-600'
                : 'text-slate-655 hover:bg-slate-50 hover:text-slate-900 border-transparent'
            }`}
          >
            <Trash2 className={`w-4 h-4 ${activeFolder.id === 'recycle_bin' ? 'text-blue-500' : 'text-slate-400'}`} />
            <span>Recycle Bin</span>
          </button>
        </div>

        {/* CENTER PANEL: DOCUMENT LIST & ACTIONS TOOLBAR */}
        <div className="flex-1 flex flex-col overflow-hidden bg-white">
          {/* Action buttons toolbar */}
          <div className="px-6 shrink-0 bg-white">
            <ActionToolbar
              selectedCount={selectedIds.length}
              role={role}
              onShareClick={() => {
                if (selectedIds.length > 0) {
                  const target = activeItems.find(x => x.id === selectedIds[0]);
                  if (target) {
                    setShareDoc(target);
                    setShareSettings({ userOrDept: '', role: 'Viewer', expiryDate: '', password: '', publicLinkEnabled: false });
                  }
                }
              }}
              onDownloadClick={() => showToast(selectedIds.length > 1 ? 'Compressing selection into ZIP...' : 'Downloading file...')}
              onNewFolderClick={() => {
                setNewFolderVal({
                  name: '',
                  description: '',
                  color: '#3b82f6',
                  department: 'Finance',
                  owner: 'Paras Jain',
                  permissions: 'Editor'
                });
                setShowNewFolderModal(true);
              }}
              onNewDocxClick={() => handleCreateBlankFile('docx')}
              onNewXlsxClick={() => handleCreateBlankFile('xlsx')}
              onNewPptxClick={() => handleCreateBlankFile('pptx')}
              onNewTxtClick={() => handleCreateBlankFile('txt')}
              onUploadFilesClick={() => {
                const names = ['Annual_Audit_Report.pdf', 'Sales_Q2_Summary.xlsx', 'Operations_Checklist.docx'];
                const randNames = names.slice(0, Math.floor(Math.random() * 3) + 1);
                handleUploadModalStart(randNames);
              }}
              onUploadFolderClick={() => {
                const names = ['HR_Policy_Handbook.docx', 'SOP_Employee_Onboarding.pdf'];
                handleUploadModalStart(names, true);
              }}
              onAiGenerateClick={() => {
                setShowTemplatesModal(true);
              }}
              onMoveClick={() => {
                const targets = activeItems.filter(x => selectedIds.includes(x.id));
                setPickerAction('move');
                setPickerTargetItems(targets);
                setShowTreePicker(true);
              }}
              onCopyClick={() => {
                const targets = activeItems.filter(x => selectedIds.includes(x.id));
                setPickerAction('copy');
                setPickerTargetItems(targets);
                setShowTreePicker(true);
              }}
              onRenameClick={() => {
                const target = activeItems.find(x => x.id === selectedIds[0]);
                if (target) {
                  setRenameTarget(target);
                  setRenameNewName(target.name);
                  setShowRenameModal(true);
                }
              }}
              onFavoriteClick={() => {
                if (selectedIds.length > 0) {
                  const targets = activeItems.filter(x => selectedIds.includes(x.id));
                  const anyNotFav = targets.some(x => !x.isFavorite);
                  setDocuments(prev => prev.map(d => {
                    if (selectedIds.includes(d.id)) {
                      return { ...d, isFavorite: anyNotFav };
                    }
                    return d;
                  }));
                  showToast(anyNotFav ? 'Added items to Starred Favorites' : 'Removed items from Favorites');
                }
              }}
              onLockClick={() => {
                if (selectedIds.length > 0) {
                  const targets = activeItems.filter(x => selectedIds.includes(x.id));
                  const anyUnlocked = targets.some(x => !x.isLocked);
                  setDocuments(prev => prev.map(d => {
                    if (selectedIds.includes(d.id)) {
                      return { ...d, isLocked: anyUnlocked, lockedBy: anyUnlocked ? 'Paras' : undefined };
                    }
                    return d;
                  }));
                  showToast(anyUnlocked ? 'Selected documents locked' : 'Selected documents unlocked');
                }
              }}
              onVersionHistoryClick={() => {
                const target = activeItems.find(x => x.id === selectedIds[0]);
                if (target) {
                  setVersionHistoryDoc(target);
                  setShowVersionHistory(true);
                }
              }}
              onDeleteClick={() => {
                if (selectedIds.length > 0) {
                  const targets = activeItems.filter(x => selectedIds.includes(x.id));
                  setDeleteTarget(targets[0]);
                  setShowDeleteConfirm(true);
                }
              }}
            />
          </div>

          {/* Main Table Grid Container */}
          <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar">
            {activeFolder.id === 'recycle_bin' && activeItems.length > 0 && (
              <div className="mb-4 flex items-center justify-between bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-700 select-none">
                <span>Recycle Bin contains deleted directories and records.</span>
                <button
                  onClick={handleEmptyRecycleBin}
                  className="px-3 py-1 bg-red-50 hover:bg-red-100 text-red-655 hover:text-red-750 border border-red-200/50 rounded-lg text-[10px] font-extrabold uppercase transition-colors"
                >
                  Empty Recycle Bin
                </button>
              </div>
            )}

            {activeFolder.id === 'recycle_bin' ? (
              // Custom Recycle Bin Table List with Restore actions
              <div className="w-full overflow-x-auto select-none">
                {activeItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center select-none">
                    <Trash2 className="w-12 h-12 text-slate-350 mb-4" />
                    <h4 className="text-sm font-extrabold text-slate-800">Recycle Bin is empty</h4>
                    <p className="text-[10px] text-slate-455 font-bold mt-1">Deleted items will appear here.</p>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200/60 text-[10.5px] font-extrabold text-slate-400 uppercase tracking-wider">
                        <th className="py-3 px-4">Name</th>
                        <th className="py-3 px-4">Type</th>
                        <th className="py-3 px-4">Deleted Date</th>
                        <th className="py-3 px-4">Original Owner</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100/60 text-xs font-semibold text-slate-755">
                      {activeItems.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/50 select-none">
                          <td className="py-3.5 px-4 font-extrabold text-slate-800">{item.name}</td>
                          <td className="py-3.5 px-4 text-[10px] uppercase font-extrabold tracking-wider">{item.fileType}</td>
                          <td className="py-3.5 px-4 text-slate-500">{item.modifiedAt}</td>
                          <td className="py-3.5 px-4 text-slate-700">{item.ownerName}</td>
                          <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleRestoreItem(item)}
                                className="px-2.5 py-1 text-[10px] bg-blue-50 text-blue-650 hover:bg-blue-100 rounded-lg font-extrabold"
                                title="Restore item"
                              >
                                Restore
                              </button>
                              <button
                                onClick={() => handleDeleteItemPermanently(item)}
                                className="px-2.5 py-1 text-[10px] bg-red-50 text-red-655 hover:bg-red-100 rounded-lg font-extrabold"
                                title="Delete Permanently"
                              >
                                Purge
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            ) : (
              <DocumentTable
                items={activeItems}
                selectedIds={selectedIds}
                activeId={activeDoc?.id}
                onToggleSelect={handleToggleSelect}
                onToggleSelectAll={handleToggleSelectAll}
                onItemClick={handleItemClick}
                onItemDoubleClick={handleItemDoubleClick}
                onActionClick={(item, e) => {
                  e.stopPropagation();
                  setContextMenu({ x: e.clientX, y: e.clientY, item: item as DMSItem });
                }}
                onContextMenuAction={handleContextMenuAction}
                onToggleFavorite={handleToggleFavorite}
                onDragStart={handleDragStart}
                onDragOverItem={handleDragOverItem}
                onDropOnItem={handleDropOnItem}
                onNewClick={() => {
                  setNewFolderVal({
                    name: '',
                    description: '',
                    color: '#3b82f6',
                    department: 'Finance',
                    owner: 'Paras Jain',
                    permissions: 'Editor'
                  });
                  setShowNewFolderModal(true);
                }}
                onUploadClick={() => {
                  const names = ['Annual_Quarterly_Brief.pdf'];
                  handleUploadModalStart(names);
                }}
                onAiGenerateClick={() => setShowTemplatesModal(true)}
              />
            )}
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

      {/* QUICK PREVIEW MODAL */}
      {previewDoc && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-6 select-none animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-[900px] max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-150 bg-slate-50/50 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                  <span className="text-base">👁️</span>
                  <span>Quick Preview: {previewDoc.name}</span>
                </h3>
                <p className="text-[10px] text-slate-450 font-bold mt-0.5">
                  Format: {previewDoc.fileType} | Size: {previewDoc.size} | Owner: {previewDoc.ownerName}
                </p>
              </div>
              <button
                onClick={() => setPreviewDoc(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-150 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Viewport Content */}
            <div className="flex-1 overflow-auto p-8 bg-slate-100/50 flex justify-center items-start custom-scrollbar">
              {/* Type specific read-only views */}
              {previewDoc.fileType === 'DOCX' && (
                <div className="w-full max-w-2xl bg-white border border-slate-200/80 shadow-sm rounded-xl p-8 text-slate-850 font-serif leading-relaxed text-xs">
                  <h1 className="text-xl font-extrabold font-sans text-slate-900 border-b border-slate-150 pb-4 mb-6">{previewDoc.name.replace('.docx', '')}</h1>
                  <p className="mb-4">This document has been cataloged under organization knowledge rules. Any edits require administrative lock ownership.</p>
                  <h2 className="text-sm font-bold font-sans text-slate-800 mt-6 mb-2">1. Overview</h2>
                  <p className="mb-4">This corporate layout outlines operational frameworks and strategic objectives for the upcoming fiscal quarter. Teams should ensure cross-departmental alignment prior to submission.</p>
                  <h2 className="text-sm font-bold font-sans text-slate-800 mt-6 mb-2">2. Core Directives</h2>
                  <p className="mb-4">All operations must conform strictly to compliance policies. Risk factors identified during audits should be logged into the DMS dashboard immediately.</p>
                </div>
              )}

              {previewDoc.fileType === 'XLSX' && (
                <div className="w-full bg-white border border-slate-200/80 shadow-sm rounded-xl overflow-hidden text-xs">
                  <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 text-[10px] font-bold text-slate-450 uppercase tracking-wider">Spreadsheet Grid View</div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse border border-slate-150 text-[11px]">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 font-extrabold text-[10px]">
                          <th className="border border-slate-200 p-1 w-8 text-center bg-slate-100"></th>
                          <th className="border border-slate-200 p-1.5 bg-slate-100">A</th>
                          <th className="border border-slate-200 p-1.5 bg-slate-100">B</th>
                          <th className="border border-slate-200 p-1.5 bg-slate-100">C</th>
                          <th className="border border-slate-200 p-1.5 bg-slate-100">D</th>
                          <th className="border border-slate-200 p-1.5 bg-slate-100">E</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          ['Q2 Budget Summary', 'Allocated', 'Spent', 'Variance', 'Status'],
                          ['Marketing Ops', '$120,000', '$95,000', '$25,000', 'Under'],
                          ['Engineering Staffing', '$450,000', '$455,000', '-$5,000', 'Over'],
                          ['Legal Compliance', '$80,000', '$78,000', '$2,000', 'On Track'],
                          ['Corporate Real Estate', '$300,000', '$290,000', '$10,000', 'On Track'],
                          ['IT Infrastructure', '$150,000', '$162,000', '-$12,000', 'Over']
                        ].map((row, rIdx) => (
                          <tr key={rIdx} className={rIdx === 0 ? 'bg-slate-50/50 font-bold text-slate-800' : 'text-slate-650'}>
                            <td className="border border-slate-200 p-1 text-center bg-slate-50 font-bold text-[10px] text-slate-400 w-8">{rIdx + 1}</td>
                            {row.map((cell, cIdx) => (
                              <td key={cIdx} className="border border-slate-200 p-2 font-semibold">{cell}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {previewDoc.fileType === 'PPTX' && (
                <div className="w-full flex gap-4 text-xs">
                  {/* Left thumbnails */}
                  <div className="w-48 bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex flex-col gap-3 shrink-0">
                    <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Slides</div>
                    {[1, 2, 3].map(slide => (
                      <div key={slide} className={`border rounded-lg p-2 bg-white cursor-pointer hover:border-blue-500 transition-all ${slide === 1 ? 'border-blue-500 ring-2 ring-blue-500/10' : 'border-slate-200'}`}>
                        <div className="aspect-[4/3] bg-slate-100 rounded-md mb-1.5 flex items-center justify-center text-[10px] font-black text-slate-400">Slide {slide}</div>
                        <div className="text-[9px] font-bold text-slate-700 truncate">{slide === 1 ? 'Title Slide' : `Section ${slide}`}</div>
                      </div>
                    ))}
                  </div>
                  {/* Active slide layout */}
                  <div className="flex-1 bg-white border border-slate-200 rounded-xl p-8 shadow-sm flex flex-col justify-center active-slide aspect-[4/3] relative items-center text-center">
                    <div className="absolute top-4 left-4 text-[9px] font-extrabold text-slate-400 uppercase">Fast Trade DMS Slideshow</div>
                    <h2 className="text-lg font-black text-slate-900 mb-2">{previewDoc.name.replace('.pptx', '')}</h2>
                    <p className="text-xs font-bold text-blue-600 mb-6">Internal Presentation & Executive Outline</p>
                    <div className="text-[10px] text-slate-455 max-w-sm leading-relaxed">
                      Confidential. Do not distribute externally. Created by {previewDoc.ownerName} in {previewDoc.department || 'Operations'}.
                    </div>
                  </div>
                </div>
              )}

              {previewDoc.fileType === 'PDF' && (
                <div className="w-full max-w-2xl bg-white border border-slate-200 shadow-sm rounded-xl p-8 text-xs select-none">
                  <div className="flex items-center justify-between border-b border-slate-150 pb-3 mb-6">
                    <span className="font-extrabold text-slate-800">Page 1 of 1</span>
                    <div className="flex items-center gap-1.5">
                      <button className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-[10px] font-bold text-slate-700">Zoom In</button>
                      <button className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-[10px] font-bold text-slate-700">Zoom Out</button>
                    </div>
                  </div>
                  <div className="border border-dashed border-slate-200 rounded-lg p-6 bg-slate-50/50 flex flex-col justify-center min-h-[400px]">
                    <div className="text-center max-w-md mx-auto">
                      <h3 className="text-base font-black text-slate-800 mb-2">Simulated PDF Workspace</h3>
                      <p className="text-slate-455 leading-relaxed font-semibold">
                        This view represents the compiled static layout for {previewDoc.name}. Original PDF binary data is encrypted and cached for read-only access.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {previewDoc.fileType === 'TXT' && (
                <pre className="w-full max-w-2xl bg-slate-900 border border-slate-950 text-emerald-400 font-mono text-[11px] leading-relaxed p-6 rounded-xl overflow-x-auto shadow-inner">
                  {`# Text Document Preview: ${previewDoc.name}\n`}
                  {`# Created: ${previewDoc.modifiedAt}\n`}
                  {`# Department: ${previewDoc.department || 'Operations'}\n\n`}
                  {`1. Scope and Directive Objectives\n`}
                  {`   - Standard operating outline.\n`}
                  {`   - Implement dynamic parameters for KMS tracking.\n`}
                  {`   - Converted structure logs active.\n\n`}
                  {`2. Notes and Reminders\n`}
                  {`   - Always lock the workspace before starting reviews.\n`}
                  {`   - Do not reuse DOCX content arrays for sheet files.`}
                </pre>
              )}

              {previewDoc.fileType === 'IMAGE' && (
                <div className="flex flex-col items-center gap-4">
                  {/* Zoom controls */}
                  <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm text-xs font-bold text-slate-700">
                    <button onClick={() => setPreviewImageZoom(prev => Math.max(0.5, prev - 0.25))} className="hover:text-blue-600 px-1.5">Zoom -</button>
                    <span className="w-12 text-center">{previewImageZoom * 100}%</span>
                    <button onClick={() => setPreviewImageZoom(prev => Math.min(2, prev + 0.25))} className="hover:text-blue-600 px-1.5">Zoom +</button>
                  </div>
                  {/* Image render */}
                  <div className="bg-white border border-slate-200 shadow-md rounded-xl p-4 max-w-full overflow-auto">
                    <div 
                      className="bg-gradient-to-tr from-slate-200 to-slate-100 rounded-lg flex items-center justify-center text-slate-400 font-bold transition-all"
                      style={{ 
                        width: `${300 * previewImageZoom}px`, 
                        height: `${225 * previewImageZoom}px`
                      }}
                    >
                      <span>{previewDoc.name}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-150 bg-slate-50/50 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-extrabold shadow-sm transition-all"
              >
                Close Preview
              </button>
              <button
                type="button"
                onClick={() => {
                  setPreviewDoc(null);
                  navigate(`/documents/${previewDoc.id}`);
                }}
                className="glow-btn px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold border border-blue-500 shadow-md transition-all"
              >
                Open in Editor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PROFESSIONAL UPLOAD DIALOG MODAL */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-6 select-none animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-[500px] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-150 bg-slate-50/50 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                  <Upload className="w-4 h-4 text-blue-600" />
                  <span>KMS Upload Desk</span>
                </h3>
              </div>
              <button
                onClick={handleUploadModalCancel}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-150 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Area */}
            <div className="p-6 space-y-4">
              {/* Drag drop zone helper */}
              {uploadFilesQueue.length === 0 ? (
                <div 
                  onClick={() => handleUploadModalStart(['Quarterly_Corporate_Audit.pdf', 'HR_Internal_Onboarding.docx'])}
                  className="border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-xl p-8 text-center bg-slate-50/30 hover:bg-blue-50/5 cursor-pointer transition-all flex flex-col items-center justify-center"
                >
                  <Upload className="w-10 h-10 text-slate-400 mb-3 animate-bounce" />
                  <span className="text-xs font-extrabold text-slate-750">Drag & drop files or folders here</span>
                  <span className="text-[10px] text-slate-450 mt-1 font-semibold">Or click to browse simulator files</span>
                  <div className="flex gap-2 mt-4">
                    <button type="button" className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-extrabold text-slate-700 shadow-sm">Browse Files</button>
                    <button type="button" className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-extrabold text-slate-700 shadow-sm">Browse Folder</button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Queue status ({uploadFilesQueue.length} items)</div>
                  <div className="max-h-48 overflow-y-auto space-y-2 border border-slate-150 rounded-xl p-3 bg-slate-50/20 custom-scrollbar">
                    {uploadFilesQueue.map((file, fIdx) => (
                      <div key={fIdx} className="text-xs flex items-center justify-between bg-white border border-slate-100 rounded-lg p-2.5">
                        <div className="truncate max-w-[220px]">
                          <div className="font-extrabold text-slate-800 truncate">{file.name}</div>
                          <div className="text-[9px] text-slate-455 font-bold mt-0.5">{file.size}</div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {file.status === 'success' ? (
                            <span className="text-emerald-600 font-extrabold text-[10px] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">Success</span>
                          ) : file.status === 'error' ? (
                            <span className="text-red-655 font-extrabold text-[10px] bg-red-50 px-2 py-0.5 rounded-md border border-red-100">Error</span>
                          ) : (
                            <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-blue-600 h-full transition-all duration-150" style={{ width: `${file.progress}%` }} />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Overall progression */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[11px] font-extrabold text-slate-655">
                      <span>Overall Progress</span>
                      <span>{uploadModalProgress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full transition-all duration-200" style={{ width: `${uploadModalProgress}%` }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-slate-150 bg-slate-50/50 flex items-center justify-between">
              <div>
                {uploadModalStatus === 'success' && (
                  <span className="text-xs text-emerald-600 font-extrabold flex items-center gap-1">
                    <span>✓</span> All uploads active in context
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleUploadModalCancel}
                  className="px-3.5 py-1.8 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold shadow-sm transition-all"
                >
                  {uploadModalStatus === 'success' ? 'Close' : 'Cancel'}
                </button>
                {uploadModalStatus === 'uploading' && (
                  <button
                    type="button"
                    onClick={handleUploadModalCancel}
                    className="px-3.5 py-1.8 bg-red-50 hover:bg-red-100 text-red-650 rounded-lg text-xs font-bold transition-all"
                  >
                    Abort
                  </button>
                )}
                {uploadModalStatus === 'success' && (
                  <button
                    type="button"
                    onClick={handleUploadModalRetry}
                    className="glow-btn px-3.5 py-1.8 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold border border-blue-500 shadow-md transition-all animate-pulse"
                  >
                    Upload More
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ENTERPRISE SHARE DIALOG MODAL */}
      {shareDoc && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-6 select-none animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-[500px] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 text-xs text-slate-700">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-150 bg-slate-50/50 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-blue-600" />
                  <span>Share Resource: {shareDoc.name}</span>
                </h3>
              </div>
              <button
                onClick={() => setShareDoc(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-150 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content area */}
            <div className="p-6 space-y-4">
              {/* Recipient inputs */}
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide">Invite User, Department or Role</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Finance, HR, manager, employee@efasttrade.com"
                    value={shareSettings.userOrDept}
                    onChange={(e) => setShareSettings(prev => ({ ...prev, userOrDept: e.target.value }))}
                    className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-1.8 text-xs font-semibold outline-none focus:border-blue-500 shadow-sm"
                  />
                  <select
                    value={shareSettings.role}
                    onChange={(e) => setShareSettings(prev => ({ ...prev, role: e.target.value }))}
                    className="bg-white border border-slate-200 rounded-lg px-2 py-1.8 text-[11px] font-bold text-slate-700 shadow-sm"
                  >
                    <option value="Viewer">Viewer</option>
                    <option value="Editor">Editor</option>
                    <option value="Approver">Approver</option>
                    <option value="Owner">Owner</option>
                  </select>
                </div>
              </div>

              {/* Expiry and Password controls */}
              <div className="grid grid-cols-2 gap-3.5 pt-1">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide">Expiry Date</label>
                  <input
                    type="date"
                    value={shareSettings.expiryDate}
                    onChange={(e) => setShareSettings(prev => ({ ...prev, expiryDate: e.target.value }))}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.8 text-xs font-semibold outline-none focus:border-blue-500 shadow-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide">Password Lock (Optional)</label>
                  <input
                    type="password"
                    placeholder="None"
                    value={shareSettings.password}
                    onChange={(e) => setShareSettings(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.8 text-xs font-semibold outline-none focus:border-blue-500 shadow-sm"
                  />
                </div>
              </div>

              {/* Link generator */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-extrabold text-slate-800">Public Link Access</div>
                    <div className="text-[10px] text-slate-450 font-bold mt-0.5">Allows access to anyone with link url</div>
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
                      onClick={() => {
                        navigator.clipboard.writeText(`https://kms.fasttrade.com/shared/link/${shareDoc.id}`);
                        showToast('Copied public link to clipboard!');
                      }}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 hover:text-slate-800 rounded font-extrabold text-[9px] uppercase border border-slate-200 transition-colors"
                    >
                      Copy Link
                    </button>
                  </div>
                )}
              </div>

              {/* List of active members sharing */}
              <div className="space-y-2">
                <div className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide">Who currently has access</div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 bg-slate-50/50 rounded-lg p-2">
                    <span className="flex items-center gap-1.5">👥 HR & Engineering Teams</span>
                    <span className="text-[10px] text-slate-450 font-extrabold uppercase">Viewer (Inherited)</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 bg-slate-50/50 rounded-lg p-2">
                    <span className="flex items-center gap-1.5">👤 Paras Jain (Creator)</span>
                    <span className="text-[10px] text-slate-455 font-extrabold uppercase">Owner</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-slate-150 bg-slate-50/50 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShareDoc(null)}
                className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-extrabold shadow-sm transition-all"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  showToast(`Share configuration updated for "${shareDoc.name}"`);
                  setShareDoc(null);
                }}
                className="glow-btn px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold border border-blue-500 shadow-md transition-all"
              >
                Apply Share
              </button>
            </div>
          </div>
        </div>
      )}

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
                            <span className="text-[10px] text-slate-450 block mt-0.5">Try searching another category or generate one using AI Document Assistant</span>
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

      {/* 1. UPLOAD PROGRESS BACKDROP */}
      {isUploading && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[2px] z-[99999] flex items-center justify-center p-4 select-none">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full border border-slate-200 shadow-2xl flex flex-col items-center text-center">
            {uploadSuccess ? (
              <CheckCircle className="w-12 h-12 text-green-500 mb-4 animate-bounce" />
            ) : (
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
            )}
            <h4 className="text-sm font-extrabold text-slate-800">
              {uploadSuccess ? 'Upload Complete' : 'Uploading Record to KMS'}
            </h4>
            <p className="text-[10px] text-slate-455 font-bold mt-1">
              {uploadSuccess ? 'Document cataloged and context active.' : 'Parsing document content and permissions structure...'}
            </p>
            {!uploadSuccess && (
              <div className="w-full bg-slate-100 rounded-full h-2 mt-4 overflow-hidden border border-slate-200/50">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}
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
              <button 
                type="button" 
                onClick={() => setShowNewFolderModal(false)}
                className="p-1 hover:bg-slate-200 rounded text-slate-400"
              >
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
                <button 
                  type="button" 
                  onClick={() => setShowNewFolderModal(false)}
                  className="px-3.5 py-2 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-655 font-bold"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold border border-blue-500 shadow-sm"
                >
                  Create Folder
                </button>
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
              <button type="button" onClick={() => setShowRenameModal(false)} className="p-1 hover:bg-slate-200 rounded text-slate-400">
                <X className="w-4 h-4" />
              </button>
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
                <button 
                  type="button" 
                  onClick={() => setShowRenameModal(false)}
                  className="px-3.5 py-2 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-655 font-bold"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold"
                >
                  Save Changes
                </button>
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
              <button 
                type="button" 
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-slate-655"
              >
                Keep File
              </button>
              <button 
                type="button" 
                onClick={triggerDeleteConfirm}
                className="flex-1 py-2 bg-red-600 hover:bg-red-750 text-white border border-red-500 rounded-lg text-xs font-bold shadow-sm"
              >
                Delete
              </button>
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
              <button type="button" onClick={() => setShowTreePicker(false)} className="p-1 hover:bg-slate-200 rounded text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-5 max-h-[300px] overflow-y-auto custom-scrollbar border-b border-slate-100 bg-slate-50/10">
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide block mb-3">Choose Destination Folder</span>
              
              <div className="space-y-1.5 text-xs font-semibold text-slate-700">
                {/* Flat directory choice nodes list */}
                <button
                  type="button"
                  onClick={() => setPickerSelectedFolderId('root')}
                  className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 ${
                    pickerSelectedFolderId === 'root' ? 'bg-blue-50 text-blue-650 font-extrabold border border-blue-200' : 'hover:bg-slate-100'
                  }`}
                >
                  <Folder className="w-4 h-4 text-blue-500 fill-blue-500/10" />
                  <span>Corporate Knowledge (Root)</span>
                </button>

                {folderTreeNodes[0]?.subFolders?.map(node => (
                  <div key={node.id} className="pl-4 space-y-1">
                    <button
                      type="button"
                      onClick={() => setPickerSelectedFolderId(node.id.toString())}
                      className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 ${
                        pickerSelectedFolderId === node.id.toString() ? 'bg-blue-50 text-blue-655 font-extrabold border border-blue-200' : 'hover:bg-slate-100'
                      }`}
                    >
                      <Folder className="w-4 h-4 text-blue-500 fill-blue-500/10" />
                      <span>{node.name}</span>
                    </button>

                    {node.subFolders?.map(sub => (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => setPickerSelectedFolderId(sub.id.toString())}
                        className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 pl-6 ${
                          pickerSelectedFolderId === sub.id.toString() ? 'bg-blue-50 text-blue-655 font-extrabold border border-blue-200' : 'hover:bg-slate-100'
                        }`}
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
                Selected destination: <b className="text-slate-700">{pickerSelectedFolderId}</b>
              </span>
              <div className="flex items-center gap-2">
                <button 
                  type="button" 
                  onClick={() => setShowTreePicker(false)}
                  className="px-3 py-1.5 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold"
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  onClick={triggerMoveCopyAction}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-sm"
                >
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
                <p className="text-[10px] text-slate-455 font-bold mt-0.5 max-w-[280px] truncate">
                  {versionHistoryDoc.name}
                </p>
              </div>
              <button type="button" onClick={() => setShowVersionHistory(false)} className="p-1 hover:bg-slate-200 rounded text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 p-5 overflow-y-auto custom-scrollbar space-y-5 text-xs font-semibold text-slate-700">
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide block">Revisions Log</span>

              <div className="relative border-l border-slate-200 pl-4 ml-2.5 space-y-6">
                {/* Active version */}
                <div className="relative">
                  <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-blue-600 border-2 border-white ring-4 ring-blue-50" />
                  <div>
                    <span className="text-[11px] font-black text-slate-900">
                      {versionHistoryDoc.version || 'v1.0'} (Active)
                    </span>
                    <p className="text-[10px] text-slate-455 font-bold mt-0.5">Paras Jain modified this copy</p>
                    <span className="text-[9px] text-slate-400 mt-1 block">Today, {versionHistoryDoc.modifiedAt}</span>
                  </div>
                </div>

                {/* Older versions mock */}
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
                onClick={() => {
                  showToast('Reverted to v1.0 draft (Simulated)');
                  setShowVersionHistory(false);
                }}
                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-slate-700 transition-colors"
              >
                Revert to Initial
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. DYNAMIC TOAST ALERT WINDOW */}
      {toastMsg && (
        <div className="fixed bottom-6 left-6 bg-slate-900 text-white rounded-xl py-3 px-4 shadow-2xl z-[99999] flex items-center gap-2 animate-in fade-in slide-in-from-bottom-5 duration-200 text-xs font-bold select-none border border-slate-800">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* 9. RIGHT CLICK DYNAMIC CONTEXT MENU */}
      {contextMenu && (
        <div 
          className="fixed bg-white border border-slate-200 shadow-2xl rounded-xl py-1.5 w-44 z-[99999] animate-in fade-in zoom-in-95 duration-100 text-xs font-semibold text-slate-700 select-none"
          style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.item.isFolder ? (
            <>
              {/* Folder Menu */}
              <button
                onClick={() => {
                  handleFolderSelect({ id: contextMenu.item.id, name: contextMenu.item.name });
                  setContextMenu(null);
                }}
                className="w-full text-left px-3.5 py-1.5 hover:bg-slate-50 flex items-center gap-2 text-slate-800"
              >
                <FolderOpen className="w-3.5 h-3.5 text-slate-400" />
                <span>Open Folder</span>
              </button>
              <button
                onClick={() => {
                  setRenameTarget(contextMenu.item);
                  setRenameNewName(contextMenu.item.name);
                  setShowRenameModal(true);
                  setContextMenu(null);
                }}
                className="w-full text-left px-3.5 py-1.5 hover:bg-slate-50 flex items-center gap-2"
              >
                <Edit className="w-3.5 h-3.5 text-slate-400" />
                <span>Rename</span>
              </button>
              <button
                onClick={() => {
                  setNewFolderVal({
                    name: '',
                    description: '',
                    color: '#3b82f6',
                    department: 'Finance',
                    owner: 'Paras Jain',
                    permissions: 'Editor'
                  });
                  // Temporarily make the target folder active so we insert inside it
                  handleFolderSelect({ id: contextMenu.item.id, name: contextMenu.item.name });
                  setShowNewFolderModal(true);
                  setContextMenu(null);
                }}
                className="w-full text-left px-3.5 py-1.5 hover:bg-slate-50 flex items-center gap-2"
              >
                <Plus className="w-3.5 h-3.5 text-slate-400" />
                <span>New Folder</span>
              </button>
              <button
                onClick={() => {
                  handleFolderSelect({ id: contextMenu.item.id, name: contextMenu.item.name });
                  const names = ['Department_Budget_Draft.xlsx', 'Q2_Operations_Brief.docx'];
                  handleUploadModalStart(names);
                  setContextMenu(null);
                }}
                className="w-full text-left px-3.5 py-1.5 hover:bg-slate-50 flex items-center gap-2"
              >
                <Upload className="w-3.5 h-3.5 text-slate-400" />
                <span>Upload Here</span>
              </button>
              <button
                onClick={() => {
                  setPickerAction('move');
                  setPickerTargetItems([contextMenu.item]);
                  setShowTreePicker(true);
                  setContextMenu(null);
                }}
                className="w-full text-left px-3.5 py-1.5 hover:bg-slate-50 flex items-center gap-2"
              >
                <FolderOpen className="w-3.5 h-3.5 text-slate-400" />
                <span>Move</span>
              </button>
              <button
                onClick={() => {
                  setPickerAction('copy');
                  setPickerTargetItems([contextMenu.item]);
                  setShowTreePicker(true);
                  setContextMenu(null);
                }}
                className="w-full text-left px-3.5 py-1.5 hover:bg-slate-50 flex items-center gap-2"
              >
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Copy</span>
              </button>
              <button
                onClick={() => {
                  handleItemClick(contextMenu.item);
                  setShowInfoPanel(true);
                  setContextMenu(null);
                }}
                className="w-full text-left px-3.5 py-1.5 hover:bg-slate-50 flex items-center gap-2"
              >
                <Info className="w-3.5 h-3.5 text-slate-400" />
                <span>Properties</span>
              </button>
              <div className="h-[1px] bg-slate-100 my-1" />
              <button
                onClick={() => {
                  setDeleteTarget(contextMenu.item);
                  setShowDeleteConfirm(true);
                  setContextMenu(null);
                }}
                className="w-full text-left px-3.5 py-1.5 hover:bg-red-50 text-red-600 flex items-center gap-2"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-500" />
                <span>Delete</span>
              </button>
            </>
          ) : (
            <>
              {/* File Menu */}
              <button
                onClick={() => {
                  navigate(`/documents/${contextMenu.item.id}`);
                  setContextMenu(null);
                }}
                className="w-full text-left px-3.5 py-1.5 hover:bg-slate-50 flex items-center gap-2 text-slate-850"
              >
                <FolderOpen className="w-3.5 h-3.5 text-slate-400" />
                <span>Open</span>
              </button>
              <button
                onClick={() => {
                  setPreviewDoc(contextMenu.item);
                  setPreviewImageZoom(1);
                  setContextMenu(null);
                }}
                className="w-full text-left px-3.5 py-1.5 hover:bg-slate-50 flex items-center gap-2"
              >
                <Eye className="w-3.5 h-3.5 text-slate-400" />
                <span>Preview</span>
              </button>
              <button
                onClick={() => {
                  setRenameTarget(contextMenu.item);
                  setRenameNewName(contextMenu.item.name);
                  setShowRenameModal(true);
                  setContextMenu(null);
                }}
                className="w-full text-left px-3.5 py-1.5 hover:bg-slate-50 flex items-center gap-2"
              >
                <Edit className="w-3.5 h-3.5 text-slate-400" />
                <span>Rename</span>
              </button>
              <button
                onClick={() => {
                  handleDuplicateItem(contextMenu.item);
                  setContextMenu(null);
                }}
                className="w-full text-left px-3.5 py-1.5 hover:bg-slate-50 flex items-center gap-2"
              >
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Duplicate</span>
              </button>
              <button
                onClick={() => {
                  setPickerAction('move');
                  setPickerTargetItems([contextMenu.item]);
                  setShowTreePicker(true);
                  setContextMenu(null);
                }}
                className="w-full text-left px-3.5 py-1.5 hover:bg-slate-50 flex items-center gap-2"
              >
                <FolderOpen className="w-3.5 h-3.5 text-slate-400" />
                <span>Move</span>
              </button>
              <button
                onClick={() => {
                  setPickerAction('copy');
                  setPickerTargetItems([contextMenu.item]);
                  setShowTreePicker(true);
                  setContextMenu(null);
                }}
                className="w-full text-left px-3.5 py-1.5 hover:bg-slate-50 flex items-center gap-2"
              >
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Copy</span>
              </button>
              <button
                onClick={() => {
                  showToast('Initiating file download...');
                  setContextMenu(null);
                }}
                className="w-full text-left px-3.5 py-1.5 hover:bg-slate-50 flex items-center gap-2"
              >
                <Download className="w-3.5 h-3.5 text-slate-400" />
                <span>Download</span>
              </button>
              <button
                onClick={() => {
                  setShareDoc(contextMenu.item);
                  setShareSettings({ userOrDept: '', role: 'Viewer', expiryDate: '', password: '', publicLinkEnabled: false });
                  setContextMenu(null);
                }}
                className="w-full text-left px-3.5 py-1.5 hover:bg-slate-50 flex items-center gap-2"
              >
                <Share2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Share</span>
              </button>
              <button
                onClick={() => {
                  handleToggleFavorite(contextMenu.item.id);
                  setContextMenu(null);
                }}
                className="w-full text-left px-3.5 py-1.5 hover:bg-slate-50 flex items-center gap-2"
              >
                <Star className="w-3.5 h-3.5 text-slate-400" />
                <span>{contextMenu.item.isFavorite ? 'Unfavorite' : 'Favorite'}</span>
              </button>
              <button
                onClick={() => {
                  handleToggleLock(contextMenu.item);
                  setContextMenu(null);
                }}
                className="w-full text-left px-3.5 py-1.5 hover:bg-slate-50 flex items-center gap-2"
              >
                {contextMenu.item.isLocked ? (
                  <>
                    <Unlock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Unlock Document</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Lock Document</span>
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setVersionHistoryDoc(contextMenu.item);
                  setShowVersionHistory(true);
                  setContextMenu(null);
                }}
                className="w-full text-left px-3.5 py-1.5 hover:bg-slate-50 flex items-center gap-2"
              >
                <History className="w-3.5 h-3.5 text-slate-400" />
                <span>Version History</span>
              </button>
              <button
                onClick={() => {
                  handleItemClick(contextMenu.item);
                  setShowInfoPanel(true);
                  setContextMenu(null);
                }}
                className="w-full text-left px-3.5 py-1.5 hover:bg-slate-50 flex items-center gap-2"
              >
                <Info className="w-3.5 h-3.5 text-slate-400" />
                <span>Properties</span>
              </button>
              <div className="h-[1px] bg-slate-100 my-1" />
              <button
                onClick={() => {
                  setDeleteTarget(contextMenu.item);
                  setShowDeleteConfirm(true);
                  setContextMenu(null);
                }}
                className="w-full text-left px-3.5 py-1.5 hover:bg-red-50 text-red-655 flex items-center gap-2"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-500" />
                <span>Delete</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
