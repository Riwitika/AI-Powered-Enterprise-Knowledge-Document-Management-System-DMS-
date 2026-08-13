import { useState, useEffect } from 'react';
import {
  Trash2,
  Plus,
  Layout,
  Search,
  Star,
  X,
  Sparkles,
  Copy,
  Archive,
  Edit
} from 'lucide-react';

import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { useAuthStore } from '../stores/authStore';
import type { FolderNode } from '../components/FolderTree';
import type { DocumentRowItem } from '../components/DocumentTable';
import RightInformationPanel from '../components/RightInformationPanel';

import DocxEditor from '../components/DocxEditor';
import PdfViewer from '../components/PdfViewer';
import PptViewer from '../components/PptViewer';
import XlsxViewer from '../components/XlsxViewer';
import ImageViewer from '../components/ImageViewer';
import TxtEditor from '../components/TxtEditor';

import DocumentsToolbar from '../components/documents/DocumentsToolbar';
import DocumentsEmptyWorkspace from '../components/documents/DocumentsEmptyWorkspace';
import DocumentsModals from '../components/documents/DocumentsModals';

export default function DocumentTree() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  // Panel Sizing State (Right panel)
  const [rightWidth, setRightWidth] = useState(300);
  const [isResizingRight, setIsResizingRight] = useState(false);

  const startResizeRight = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizingRight(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizingRight) {
        const newWidth = Math.max(220, Math.min(500, window.innerWidth - e.clientX));
        setRightWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizingRight(false);
    };

    if (isResizingRight) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingRight]);

  const { user } = useAuthStore();
  const activeRoleName = user?.role?.name || 'admin';
  const role: 'employee' | 'manager' | 'admin' = 
    (activeRoleName === 'super_admin' ? 'admin' : (activeRoleName === 'department_manager' ? 'manager' : activeRoleName)) as any;
  
  // Templates state & data
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [tplSearchVal, setTplSearchVal] = useState<string>('');
  const [aiPrompt, setAiPrompt] = useState<string>('');
  const [isAiGenerating, setIsAiGenerating] = useState<boolean>(false);
  const [recentlyUsedIds, setRecentlyUsedIds] = useState<string[]>(['meeting-minutes', 'business-report']);
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false);
  const isAdmin = role === 'admin';

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

  // Share Dialog modal states
  const [shareDoc, setShareDoc] = useState<DMSItem | null>(null);
  const [shareSettings, setShareSettings] = useState({
    userOrDept: '',
    role: 'Viewer',
    expiryDate: '',
    password: '',
    publicLinkEnabled: false
  });

  // Upload Experience overlays
  const [isDragOverWindow, setIsDragOverWindow] = useState(false);

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
  const [activeFolder, setActiveFolder] = useState<FolderNode>({ id: 0, name: 'Workspace Root' });

  // Fetch tree and flat documents list via React Query
  const queryClient = useQueryClient();

  const { data: rawTreeData, isLoading: isTreeLoading } = useQuery({
    queryKey: ['folders-tree'],
    queryFn: api.folders.tree
  });

  const { data: allDocs, isLoading: isDocsLoading } = useQuery({
    queryKey: ['documents-list-workspace'],
    queryFn: api.documents.list
  });

  const isLoading = isTreeLoading || isDocsLoading;

  // Toggle info panel / details sidebar state
  const [showInfoPanel, setShowInfoPanel] = useState(true);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);

  // Custom toolbar/dropdown states
  const [showNewDropdown, setShowNewDropdown] = useState(false);
  const [showUploadDropdown, setShowUploadDropdown] = useState(false);
  const [showTemplatesDropdown, setShowTemplatesDropdown] = useState(false);

  // Explorer operations context state
  const [explorerTargetFolderId, setExplorerTargetFolderId] = useState<number | null>(null);

  // Close dropdowns on document click
  useEffect(() => {
    const closeDropdowns = () => {
      setShowNewDropdown(false);
      setShowUploadDropdown(false);
      setShowTemplatesDropdown(false);
    };
    window.addEventListener('click', closeDropdowns);
    return () => window.removeEventListener('click', closeDropdowns);
  }, []);

  const saveAsTemplateMutation = useMutation({
    mutationFn: async (docId: string) => {
      return api.documents.update(docId, { is_template: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents-list-workspace'] });
      queryClient.invalidateQueries({ queryKey: ['folders-tree'] });
      showToast('Document saved as template successfully!');
    },
    onError: (err: any) => showToast(`Failed to save template: ${err.message}`)
  });

  const handleUseSeedTemplate = (title: string, content: string) => {
    const name = `${title}.docx`;
    const blob = new Blob([content], { type: 'application/octet-stream' });
    const fileObj = new File([blob], name, { type: 'application/octet-stream' });
    
    const formData = new FormData();
    formData.append('file', fileObj);
    formData.append('name', title);
    
    const parentId = activeFolder.id === 0 || activeFolder.id === 'root' ? '' : String(activeFolder.id);
    formData.append('folder_id', parentId);
    formData.append('access_level', 'organization');
    formData.append('description', `Document generated from template: ${title}`);
    
    uploadDocMutation.mutate(formData, {
      onSuccess: (data) => {
        showToast(`Created document from template: "${title}"!`);
        navigate(`/documents/${data.id}`);
      }
    });
  };

  const duplicateDocument = (doc: any) => {
    const originalName = doc.name;
    const nameParts = originalName.split('.');
    const ext = nameParts.length > 1 ? nameParts.pop() : 'docx';
    const baseName = nameParts.join('.');
    const newName = `Copy of ${baseName}.${ext}`;
    
    const blob = new Blob([doc.content || ''], { type: 'application/octet-stream' });
    const fileObj = new File([blob], newName, { type: 'application/octet-stream' });
    
    const formData = new FormData();
    formData.append('file', fileObj);
    formData.append('name', newName.split('.')[0]);
    formData.append('description', doc.description || `Duplicate copy of ${originalName}`);
    formData.append('category', doc.category || 'General');
    formData.append('access_level', doc.access_level || 'organization');
    if (doc.folder_id) {
      formData.append('folder_id', String(doc.folder_id));
    }
    
    uploadDocMutation.mutate(formData, {
      onSuccess: (data) => {
        showToast(`Duplicated "${originalName}" as "${newName}" successfully!`);
        navigate(`/documents/${data.id}`);
      }
    });
  };

  // Listen to explorer sidebar context menu actions
  useEffect(() => {
    const handleAction = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      const fId = detail.folderId ? Number(detail.folderId) : null;
      const docId = detail.fileId || null;
      const targetObj = detail.target;

      switch (detail.action) {
        case 'new_folder':
          setExplorerTargetFolderId(fId);
          setNewFolderVal({
            name: '',
            description: '',
            color: '#3b82f6',
            department: 'Operations',
            owner: user?.full_name || 'System',
            permissions: 'Editor'
          });
          setShowNewFolderModal(true);
          break;
        case 'new_document':
          handleCreateBlankFile('docx', fId);
          break;
        case 'upload_file':
        case 'upload_folder':
          setExplorerTargetFolderId(fId);
          document.getElementById('kms-file-upload-input')?.click();
          break;
        case 'rename_folder':
          if (targetObj) {
            setRenameTarget({ id: String(targetObj.id), name: targetObj.name, isFolder: true } as any);
            setRenameNewName(targetObj.name);
            setShowRenameModal(true);
          }
          break;
        case 'permissions':
          if (targetObj) {
            setShareDoc({ id: String(targetObj.id), name: targetObj.name, isFolder: true } as any);
            setShareSettings({ userOrDept: '', role: 'Viewer', expiryDate: '', password: '', publicLinkEnabled: false });
          }
          break;
        case 'delete_folder':
          if (targetObj) {
            setDeleteTarget({ id: String(targetObj.id), name: targetObj.name, isFolder: true } as any);
            setShowDeleteConfirm(true);
          }
          break;
        case 'open_file':
          if (docId) {
            navigate(`/documents/${docId}`);
          }
          break;
        case 'rename_file':
          if (targetObj) {
            setRenameTarget({ id: String(targetObj.id), name: targetObj.name, isFolder: false } as any);
            setRenameNewName(targetObj.name);
            setShowRenameModal(true);
          }
          break;
        case 'favorite_file':
          if (targetObj) {
            handleToggleFavorite(String(targetObj.id));
          }
          break;
        case 'duplicate_file':
          if (targetObj) {
            const docToDuplicate = allDocs?.find((d: any) => String(d.id) === String(targetObj.id));
            if (docToDuplicate) {
              duplicateDocument(docToDuplicate);
            } else {
              showToast('Error finding document to duplicate');
            }
          }
          break;
        case 'download_file':
          if (targetObj) {
            showToast(`Downloading file: ${targetObj.name}`);
          }
          break;
        case 'move_file':
          if (targetObj) {
            setPickerAction('move');
            setPickerTargetItems([{ id: String(targetObj.id), name: targetObj.name, isFolder: false } as any]);
            setShowTreePicker(true);
          }
          break;
        case 'share_file':
          if (targetObj) {
            setShareDoc({ id: String(targetObj.id), name: targetObj.name, isFolder: false } as any);
            setShareSettings({ userOrDept: '', role: 'Viewer', expiryDate: '', password: '', publicLinkEnabled: false });
          }
          break;
        case 'version_history':
          if (docId) {
            navigate(`/documents/${docId}`);
            setShowInfoPanel(true);
          }
          break;
        case 'save_as_template':
          if (docId) {
            saveAsTemplateMutation.mutate(docId);
          }
          break;
        case 'delete_file':
          if (targetObj) {
            setDeleteTarget({ id: String(targetObj.id), name: targetObj.name, isFolder: false } as any);
            setShowDeleteConfirm(true);
          }
          break;
        case 'properties':
          if (targetObj) {
            if (docId) {
              navigate(`/documents/${docId}`);
            }
            setShowInfoPanel(true);
          }
          break;
        default:
          break;
      }
    };
    window.addEventListener('kms-explorer-action', handleAction);
    return () => window.removeEventListener('kms-explorer-action', handleAction);
  }, [allDocs, user]);

  const detectFileType = (fileName: string, metadataType?: string): string => {
    if (metadataType) {
      const metaUpper = metadataType.toUpperCase();
      if (metaUpper === 'DOCX' || metaUpper === 'APPLICATION/VND.OPENXMLFORMATS-OFFICEDOCUMENT.WORDPROCESSINGML.DOCUMENT') return 'DOCX';
      if (metaUpper === 'XLSX' || metaUpper === 'APPLICATION/VND.OPENXMLFORMATS-OFFICEDOCUMENT.SPREADSHEETML.SHEET') return 'XLSX';
      if (metaUpper === 'PPTX' || metaUpper === 'APPLICATION/VND.OPENXMLFORMATS-OFFICEDOCUMENT.PRESENTATIONML.PRESENTATION') return 'PPTX';
      if (metaUpper === 'PDF' || metaUpper === 'APPLICATION/PDF') return 'PDF';
      if (metaUpper === 'TXT' || metaUpper === 'TEXT/PLAIN') return 'TXT';
      if (['PNG', 'JPG', 'JPEG', 'IMAGE/PNG', 'IMAGE/JPEG'].includes(metaUpper)) return 'IMAGE';
    }
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'docx':
      case 'doc':
        return 'DOCX';
      case 'xlsx':
      case 'xls':
      case 'csv':
        return 'XLSX';
      case 'pptx':
      case 'ppt':
        return 'PPTX';
      case 'pdf':
        return 'PDF';
      case 'txt':
      case 'md':
        return 'TXT';
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
      case 'webp':
        return 'IMAGE';
      default:
        return 'DOCX';
    }
  };

  // Recursive tree mapper to inject files and subfolders, applying treeSearchVal filters
  const mapTreeNodes = (nodes: any[]): FolderNode[] => {
    return nodes.map(node => {
      const folderId = node.id;
      // Get real document files inside this folder
      const filesForThisFolder = allDocs 
        ? allDocs.filter((d: any) => String(d.folder_id) === String(folderId) && d.status !== 'archived') 
        : [];
      
      const subFolders = node.sub_folders ? mapTreeNodes(node.sub_folders) : [];
      
      return {
        id: node.id,
        name: node.name,
        files: filesForThisFolder,
        sub_folders: node.sub_folders,
        subFolders: subFolders,
        documents: node.documents
      };
    });
  };

  const folderTreeNodes = rawTreeData ? mapTreeNodes(rawTreeData) : [];

  // Active Document Details Query and Resolver
  const isRealUUID = !!id && !id.startsWith('doc-') && !id.startsWith('temp-') && id.length > 20;

  const { data: apiDoc } = useQuery({
    queryKey: ['document', id],
    queryFn: () => api.documents.get(id!),
    enabled: isRealUUID,
    staleTime: 30_000,
    retry: 1,
  });

  let activeWorkspaceDoc: any = null;
  if (id) {
    if (apiDoc && isRealUUID) {
      activeWorkspaceDoc = {
        id: apiDoc.id,
        name: apiDoc.name,
        fileType: detectFileType(apiDoc.name, apiDoc.file_type).toUpperCase(),
        version: `v${apiDoc.current_version}`,
        lastModified: new Date(apiDoc.updated_at || apiDoc.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        ownerName: apiDoc.owner?.full_name || 'Unknown',
        locationPath: apiDoc.folder_id ? `/Folder ${apiDoc.folder_id}` : '/Workspace',
        tags: apiDoc.ai_keywords || [apiDoc.category || 'Document'],
        description: apiDoc.description || apiDoc.ai_summary || `Document: ${apiDoc.name}`,
        whoCanAccess: apiDoc.access_level === 'organization' ? 'All Employees' : apiDoc.access_level === 'department' ? `${apiDoc.owner?.department?.name || 'Department'} Team` : 'Permitted Users',
        accessType: 'Can view, edit',
        aiSummaryText: apiDoc.ai_summary || `AI summary for "${apiDoc.name}" is being generated. The AI Document Assistant is ready to answer questions about this document.`,
        content: apiDoc.content || '',
        department: apiDoc.owner?.department?.name || 'Operations',
        category: apiDoc.category || 'General Blueprint',
        status: apiDoc.status || 'pending',
        accessLevel: apiDoc.access_level || 'private',
        createdDate: new Date(apiDoc.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
        fileSize: apiDoc.file_size ? `${(apiDoc.file_size / 1024).toFixed(1)} KB` : '14.5 KB'
      };
    } else if (id.startsWith('temp-')) {
      const rawName = id.replace('temp-', '').replace('-', ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      activeWorkspaceDoc = {
        id: id,
        name: `${rawName}.docx`,
        fileType: 'DOCX',
        version: 'v1.0',
        lastModified: 'Just now',
        ownerName: user?.full_name || 'Riwitika Gupta',
        locationPath: '/Workspace',
        tags: ['Draft'],
        description: 'New workspace document drafting canvas',
        whoCanAccess: 'All Employees',
        accessType: 'Can view, edit',
        aiSummaryText: 'Drafting new active workspace documentation.'
      };
    }
  }

  // Switcher to render correct viewer/editor canvas based on file format
  const renderActiveWorkspace = (docItem: any) => {
    const activeFormat = detectFileType(docItem.name, docItem.fileType).toUpperCase();
    switch (activeFormat) {
      case 'DOCX':
        return <DocxEditor activeDoc={docItem} />;
      case 'PDF':
        return <PdfViewer activeDoc={docItem} />;
      case 'PPTX':
      case 'PPT':
        return <PptViewer activeDoc={docItem} />;
      case 'XLSX':
        return <XlsxViewer activeDoc={docItem} />;
      case 'IMAGE':
        return <ImageViewer activeDoc={docItem} />;
      case 'TXT':
        return <TxtEditor activeDoc={docItem} />;
      default:
        return <DocxEditor activeDoc={docItem} />;
    }
  };

  const mapFolderToDMSItem = (folder: any): DMSItem => ({
    id: String(folder.id),
    name: folder.name,
    isFolder: true,
    fileType: 'Folder',
    modifiedAt: folder.created_at ? new Date(folder.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A',
    ownerName: 'System',
    ownerInitials: 'SYS',
    size: '--',
    folderId: String(folder.parent_id || 0),
    isFavorite: false,
    isLocked: false
  });

  const mapDocToDMSItem = (doc: any): DMSItem => {
    const ownerName = doc.owner?.full_name || 'Unknown';
    const ownerInitials = ownerName.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2);
    return {
      id: doc.id,
      name: doc.name,
      version: `v${doc.current_version}`,
      fileType: (doc.file_type || 'pdf').toUpperCase(),
      modifiedAt: new Date(doc.updated_at || doc.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      ownerName,
      ownerInitials,
      size: '1.2 MB',
      isFolder: false,
      folderId: String(doc.folder_id || 0),
      isFavorite: doc.is_favorite,
      isLocked: doc.status === 'locked',
      status: doc.status === 'active' ? 'Approved' : doc.status === 'pending_approval' ? 'Pending' : doc.status === 'rejected' ? 'Rejected' : 'Draft',
      department: doc.department?.name || 'Operations',
      description: doc.description || ''
    };
  };

  const findFolderNode = (nodes: FolderNode[], folderId: string | number): FolderNode | null => {
    for (const node of nodes) {
      if (String(node.id) === String(folderId)) return node;
      const children = node.sub_folders || node.subFolders;
      if (children) {
        const found = findFolderNode(children, folderId);
        if (found) return found;
      }
    }
    return null;
  };

  const getActiveViewItems = (): DMSItem[] => {
    if (isLoading) return [];

    if (activeFolder.id === 'recycle_bin') {
      const archivedDocs = allDocs?.filter((d: any) => d.status === 'archived') || [];
      return archivedDocs.map(mapDocToDMSItem);
    }

    if (activeFolder.id === 'favorites') {
      const favDocs = allDocs?.filter((d: any) => d.is_favorite) || [];
      return favDocs.map(mapDocToDMSItem);
    }

    const activeNode = findFolderNode(folderTreeNodes, activeFolder.id);
    if (!activeNode) return [];

    const subs = (activeNode.sub_folders || []).map(mapFolderToDMSItem);
    const files = ((activeNode as any).documents || []).map(mapDocToDMSItem);

    return [...subs, ...files];
  };

  const activeItems = getActiveViewItems();

  // Synchronize active folder with URL search parameter folder_id
  const { search } = useLocation();
  const queryParams = new URLSearchParams(search);
  const urlFolderId = queryParams.get('folder_id');

  useEffect(() => {
    if (urlFolderId) {
      if (urlFolderId === 'favorites') {
        setActiveFolder({ id: 'favorites', name: '★ Starred Favorites' });
      } else if (urlFolderId === 'recycle_bin') {
        setActiveFolder({ id: 'recycle_bin', name: 'Recycle Bin' });
      } else {
        const activeNode = findFolderNode(folderTreeNodes, urlFolderId);
        if (activeNode) {
          setActiveFolder({ id: activeNode.id, name: activeNode.name });
        }
      }
    } else {
      setActiveFolder({ id: 0, name: 'Workspace Root' });
    }
  }, [urlFolderId, rawTreeData]);

  // Close context menu on outside click
  useEffect(() => {
    const handleOutsideClick = () => setContextMenu(null);
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  // Real Upload logic
  const uploadDocMutation = useMutation({
    mutationFn: api.documents.upload,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['folders-tree'] });
      queryClient.invalidateQueries({ queryKey: ['documents-list-workspace'] });
      showToast(`Uploaded file "${data.name}" successfully`);
    },
    onError: (err: any) => showToast(`Upload failed: ${err.message}`)
  });

  const handleRealUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', file.name.split('.')[0]);
      const parentId = explorerTargetFolderId !== null
        ? String(explorerTargetFolderId)
        : (activeFolder.id === 0 || activeFolder.id === 'root' ? '' : String(activeFolder.id));
      formData.append('folder_id', parentId);
      formData.append('access_level', 'organization');
      uploadDocMutation.mutate(formData);
    }
  };

  // Drag & drop file upload
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
        const files = e.dataTransfer.files;
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const formData = new FormData();
          formData.append('file', file);
          formData.append('name', file.name.split('.')[0]);
          const parentId = activeFolder.id === 0 || activeFolder.id === 'root' ? '' : String(activeFolder.id);
          formData.append('folder_id', parentId);
          formData.append('access_level', 'organization');
          uploadDocMutation.mutate(formData);
        }
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
  }, [activeFolder, allDocs]);

  // Folder selection navigation
  const handleFolderSelect = (node: FolderNode) => {
    setActiveFolder({ id: node.id, name: node.name });
  };

  const handleItemClick = (_item: DocumentRowItem) => {
  };

  // CRUD Mutations
  const createFolderMutation = useMutation({
    mutationFn: api.folders.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders-tree'] });
      showToast('Folder created successfully');
      setShowNewFolderModal(false);
    },
    onError: (err: any) => showToast(`Failed to create folder: ${err.message}`)
  });

  const triggerCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    const parentId = activeFolder.id === 0 || activeFolder.id === 'root' ? null : Number(activeFolder.id);

    const currentActiveNode = findFolderNode(folderTreeNodes, activeFolder.id);
    const existingNames = (currentActiveNode?.sub_folders || []).map((f: any) => f.name.toLowerCase());
    if (existingNames.includes(newFolderVal.name.trim().toLowerCase())) {
      showToast('Error: A folder with this name already exists.');
      return;
    }

    createFolderMutation.mutate({
      name: newFolderVal.name.trim(),
      parent_id: parentId
    });
  };

  const renameFolderMutation = useMutation({
    mutationFn: ({ id, name, parent_id }: { id: number; name: string; parent_id: number | null }) =>
      api.folders.update(id, { name, parent_id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders-tree'] });
      showToast('Folder renamed successfully');
      setShowRenameModal(false);
      setRenameTarget(null);
    },
    onError: (err: any) => showToast(`Failed to rename folder: ${err.message}`)
  });

  const renameDocumentMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) =>
      api.documents.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders-tree'] });
      queryClient.invalidateQueries({ queryKey: ['documents-list-workspace'] });
      showToast('Document renamed successfully');
      setShowRenameModal(false);
      setRenameTarget(null);
    },
    onError: (err: any) => showToast(`Failed to rename document: ${err.message}`)
  });

  const triggerRenameAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameTarget) return;

    const trimmed = renameNewName.trim();
    if (!trimmed) return;

    if (activeItems.some(i => i.id !== renameTarget.id && i.name.toLowerCase() === trimmed.toLowerCase())) {
      showToast('Error: An item with this name already exists in this folder.');
      return;
    }

    if (renameTarget.isFolder) {
      renameFolderMutation.mutate({
        id: Number(renameTarget.id),
        name: trimmed,
        parent_id: renameTarget.folderId === '0' || renameTarget.folderId === 'root' ? null : Number(renameTarget.folderId)
      });
    } else {
      renameDocumentMutation.mutate({
        id: renameTarget.id,
        payload: { name: trimmed }
      });
    }
  };

  const deleteFolderMutation = useMutation({
    mutationFn: api.folders.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders-tree'] });
      showToast('Folder deleted successfully');
      setShowDeleteConfirm(false);
      setDeleteTarget(null);
    },
    onError: (err: any) => showToast(`Failed to delete folder: ${err.message}`)
  });

  const archiveDocumentMutation = useMutation({
    mutationFn: api.documents.archive,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders-tree'] });
      queryClient.invalidateQueries({ queryKey: ['documents-list-workspace'] });
      showToast('Item moved to Recycle Bin (Archived)');
      setShowDeleteConfirm(false);
      setDeleteTarget(null);
    },
    onError: (err: any) => showToast(`Failed to archive document: ${err.message}`)
  });

  const triggerDeleteConfirm = () => {
    if (!deleteTarget) return;

    if (deleteTarget.isFolder) {
      deleteFolderMutation.mutate(Number(deleteTarget.id));
    } else {
      archiveDocumentMutation.mutate(deleteTarget.id);
    }
  };

  const restoreDocumentMutation = useMutation({
    mutationFn: api.documents.restore,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders-tree'] });
      queryClient.invalidateQueries({ queryKey: ['documents-list-workspace'] });
      showToast('Document restored successfully');
    },
    onError: (err: any) => showToast(`Failed to restore document: ${err.message}`)
  });

  const handleRestoreItem = (item: DMSItem) => {
    restoreDocumentMutation.mutate(item.id);
  };

  const purgeDocumentMutation = useMutation({
    mutationFn: api.documents.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders-tree'] });
      queryClient.invalidateQueries({ queryKey: ['documents-list-workspace'] });
      showToast('Document permanently deleted');
    },
    onError: (err: any) => showToast(`Failed to permanently delete document: ${err.message}`)
  });

  const handleDeleteItemPermanently = (item: DMSItem) => {
    purgeDocumentMutation.mutate(item.id);
  };

  const toggleFavoriteMutation = useMutation({
    mutationFn: api.documents.favorite,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders-tree'] });
      queryClient.invalidateQueries({ queryKey: ['documents-list-workspace'] });
    },
    onError: (err: any) => showToast(`Failed to toggle favorite: ${err.message}`)
  });

  const handleToggleFavorite = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    toggleFavoriteMutation.mutate(id);
  };

  const moveDocumentMutation = useMutation({
    mutationFn: ({ id, folderId }: { id: string; folderId: number | null }) =>
      api.documents.update(id, { folder_id: folderId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders-tree'] });
      queryClient.invalidateQueries({ queryKey: ['documents-list-workspace'] });
      showToast('Moved items successfully');
      setShowTreePicker(false);
      setPickerTargetItems([]);
    },
    onError: (err: any) => showToast(`Failed to move document: ${err.message}`)
  });

  const triggerMoveCopyAction = () => {
    if (pickerTargetItems.length === 0) return;

    const targetFolderId = pickerSelectedFolderId === 'root' || pickerSelectedFolderId === '0' ? null : Number(pickerSelectedFolderId);

    if (pickerAction === 'move') {
      pickerTargetItems.forEach(item => {
        if (!item.isFolder) {
          moveDocumentMutation.mutate({ id: item.id, folderId: targetFolderId });
        }
      });
      setShowTreePicker(false);
      setPickerTargetItems([]);
    } else {
      showToast('Copying is not supported on the server database.');
      setShowTreePicker(false);
      setPickerTargetItems([]);
    }
  };

  const handleToggleLock = (item: DMSItem) => {
    showToast(`Editing locks for "${item.name}" are handled automatically by document status.`);
  };

  const handleCreateBlankFile = (format: string, targetFolderId?: number | null) => {
    const ext = format.toLowerCase();
    const name = `Untitled Outline.${ext}`;
    const blob = new Blob([format === 'txt' ? 'Start editing...' : ''], { type: 'application/octet-stream' });
    const fileObj = new File([blob], name, { type: 'application/octet-stream' });
    
    const formData = new FormData();
    formData.append('file', fileObj);
    formData.append('name', name.split('.')[0]);
    const parentId = targetFolderId !== undefined
      ? (targetFolderId === null ? '' : String(targetFolderId))
      : (activeFolder.id === 0 || activeFolder.id === 'root' ? '' : String(activeFolder.id));
    formData.append('folder_id', parentId);
    formData.append('access_level', 'organization');
    formData.append('description', `Blank ${format.toUpperCase()} Document`);
    
    uploadDocMutation.mutate(formData, {
      onSuccess: (data) => {
        navigate(`/documents/${data.id}`);
      }
    });
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full bg-white select-none font-sans text-slate-800 overflow-hidden">
      {/* Hidden file input for upload */}
      <input
        type="file"
        id="kms-file-upload-input"
        multiple
        onChange={handleRealUpload}
        style={{ display: 'none' }}
      />

      {/* ── 1. TOOLBAR ────────────────────────────────────────────────────────── */}
      <DocumentsToolbar
        showRightInspector={showInfoPanel}
        onToggleRightInspector={() => setShowInfoPanel(!showInfoPanel)}
        showNewDropdown={showNewDropdown}
        showUploadDropdown={showUploadDropdown}
        showTemplatesDropdown={showTemplatesDropdown}
        onToggleNew={() => { setShowNewDropdown(!showNewDropdown); setShowUploadDropdown(false); setShowTemplatesDropdown(false); }}
        onToggleUpload={() => { setShowUploadDropdown(!showUploadDropdown); setShowNewDropdown(false); setShowTemplatesDropdown(false); }}
        onToggleTemplates={() => { setShowTemplatesDropdown(!showTemplatesDropdown); setShowNewDropdown(false); setShowUploadDropdown(false); }}
        onNewDocument={() => { handleCreateBlankFile('docx'); }}
        onNewFolder={() => { setNewFolderVal({ name: '', description: '', color: '#3b82f6', department: 'Operations', owner: user?.full_name || 'System', permissions: 'Editor' }); setShowNewFolderModal(true); }}
        onUploadFile={() => document.getElementById('kms-file-upload-input')?.click()}
        onBrowseTemplates={() => setShowTemplatesModal(true)}
        onUseTemplate={handleUseSeedTemplate}
      />

      {/* ── 2. WORKSPACE CONTAINER ─────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden relative">

        {/* ── CENTER PANEL: Workspace ─────────────────────────────────────── */}
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden bg-[#f8fafc]">
          {activeWorkspaceDoc ? (
            <div className="flex-1 min-w-0 overflow-hidden relative bg-[#f8fafc]">
              {renderActiveWorkspace(activeWorkspaceDoc)}
            </div>
          ) : (
            <DocumentsEmptyWorkspace
              recentDocs={(allDocs || []).filter((d: any) => d.status !== 'archived').slice(0, 5).map((d: any) => ({
                id: d.id,
                name: d.name,
                modifiedAt: new Date(d.updated_at || d.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
                ownerName: d.owner?.full_name || 'Unknown',
                fileType: (d.file_type || 'DOCX').toUpperCase(),
              }))}
              onOpenDoc={(docId) => navigate(`/documents/${docId}`)}
            />
          )}
        </div>

        {/* Resizable Right Handle */}
        {showInfoPanel && (
          <div
            onMouseDown={startResizeRight}
            className="hidden md:flex w-1 hover:w-1.5 hover:bg-blue-500 cursor-col-resize self-stretch shrink-0 bg-slate-100 transition-all select-none z-10 items-center justify-center border-l border-slate-200"
            title="Drag to resize panel"
            onDoubleClick={() => setRightWidth(300)}
          >
            <div className="w-[1px] h-8 bg-slate-350" />
          </div>
        )}

        {/* Backdrop overlay on small screens when Inspector is open as drawer */}
        {showInfoPanel && (
          <div
            onClick={() => setShowInfoPanel(false)}
            className="md:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-30 animate-in fade-in duration-150"
          />
        )}

        {/* ── RIGHT PANEL: Inspector ──────────────────────────────────────── */}
        {showInfoPanel && (
          <div
            style={{ width: `${rightWidth}px` }}
            className="shrink-0 bg-white h-full overflow-hidden transition-all border-l border-slate-250 z-35 fixed md:relative inset-y-0 right-0 shadow-2xl md:shadow-none"
          >
            {activeWorkspaceDoc ? (
              <RightInformationPanel
                item={activeWorkspaceDoc}
                onClose={() => setShowInfoPanel(false)}
                allDocs={allDocs}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full p-6 text-center select-none bg-white">
                <div className="w-16 h-20 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-1.5 mb-4 bg-slate-50/50">
                  <div className="w-8 h-1 bg-slate-200 rounded-full" />
                  <div className="w-10 h-1 bg-slate-200 rounded-full" />
                  <div className="w-6 h-1 bg-slate-200 rounded-full" />
                </div>
                <h4 className="text-xs font-extrabold text-slate-800 tracking-tight">No document selected</h4>
                <p className="text-[11px] text-slate-400 font-semibold max-w-[180px] mt-1 leading-relaxed">
                  Select a document from the Explorer to view its details and properties.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── 3. TEMPLATES MODAL (large dialog — kept inline because it owns its own state) ── */}
      {showTemplatesModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-6 select-none animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-[1050px] max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">

            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Layout className="w-5 h-5 text-blue-600" />
                  <span>Enterprise Templates Library</span>
                </h3>
                <p className="text-[11px] text-slate-450 font-semibold mt-0.5">Deploy standard department layouts or generate blueprints with AI</p>
              </div>
              <div className="flex items-center gap-3">
                {isAdmin && !showCreateForm && (
                  <button
                    type="button"
                    onClick={() => { setEditingTemplateId(null); setFormTitle(''); setFormDesc(''); setFormCat('General'); setFormDept('General'); setFormRole('All Roles'); setFormVersion('v1.0'); setShowCreateForm(true); }}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold border border-blue-500 flex items-center gap-1 shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create Template</span>
                  </button>
                )}
                <button type="button" onClick={() => { setShowTemplatesModal(false); setShowCreateForm(false); setEditingTemplateId(null); }} className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
              {/* Left categories */}
              <div className="w-[200px] border-r border-slate-200 bg-slate-50/20 p-4 space-y-1.5 overflow-y-auto shrink-0">
                <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider block mb-2 px-2">Categories</span>
                {['All', 'Recently Used', 'Favorites', 'General', 'HR', 'Finance', 'Engineering', 'Marketing', 'Legal', 'Operations', 'Custom'].map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => { setSelectedCategory(cat); setShowCreateForm(false); }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all ${selectedCategory === cat ? 'bg-blue-50 text-blue-600 font-black' : 'hover:bg-slate-100 text-slate-655'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Right area */}
              <div className="flex-1 bg-slate-50/50 overflow-y-auto p-6 flex flex-col gap-6">
                {showCreateForm ? (
                  <form onSubmit={handleCreateOrEditTemplate} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 max-w-lg mx-auto w-full animate-in fade-in duration-150">
                    <h4 className="text-xs font-extrabold text-slate-900 border-b pb-2">
                      {editingTemplateId ? 'Edit Template' : 'Create New Template'}
                    </h4>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-slate-500 font-bold uppercase">Template Title</label>
                      <input type="text" required placeholder="e.g. Employee Evaluation Form" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:bg-white focus:border-blue-500" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-slate-500 font-bold uppercase">Short Description</label>
                      <textarea required rows={3} placeholder="Provide a clear description." value={formDesc} onChange={(e) => setFormDesc(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:bg-white focus:border-blue-500 resize-none" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-slate-500 font-bold uppercase">Category</label>
                        <select value={formCat} onChange={(e) => setFormCat(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:bg-white">
                          {['General', 'HR', 'Finance', 'Engineering', 'Marketing', 'Legal', 'Operations', 'Custom'].map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-slate-500 font-bold uppercase">Department</label>
                        <input type="text" placeholder="e.g. HR, Finance" value={formDept} onChange={(e) => setFormDept(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:bg-white" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-slate-500 font-bold uppercase">Role Visibility</label>
                        <select value={formRole} onChange={(e) => setFormRole(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:bg-white">
                          <option value="All Roles">All Roles</option>
                          <option value="Admin Only">Admin Only</option>
                          <option value="Executive Only">Executive Only</option>
                        </select>
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-slate-500 font-bold uppercase">Version</label>
                        <input type="text" placeholder="v1.0" value={formVersion} onChange={(e) => setFormVersion(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:bg-white" />
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-2.5 pt-3 border-t">
                      <button type="button" onClick={() => { setShowCreateForm(false); setEditingTemplateId(null); }} className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-600 rounded-xl">Cancel</button>
                      <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white border border-blue-500 rounded-xl text-xs font-bold shadow-sm">
                        {editingTemplateId ? 'Save Changes' : 'Create Template'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    {/* Search + AI panel */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-450 shrink-0" />
                        <input type="text" placeholder={`Search ${selectedCategory} templates...`} value={tplSearchVal} onChange={(e) => setTplSearchVal(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs outline-none focus:bg-white focus:border-blue-550 transition-all font-semibold text-slate-700" />
                      </div>
                      <div className="flex items-center gap-2 flex-1 max-w-md">
                        <input type="text" placeholder="AI Prompt: generate a project roadmap..." value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} disabled={isAiGenerating} className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:bg-white font-semibold text-slate-700 disabled:opacity-50" />
                        <button type="button" onClick={handleAiGenerate} disabled={isAiGenerating || !aiPrompt.trim()} className="px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-650 hover:from-blue-700 hover:to-indigo-750 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 border border-blue-500 disabled:opacity-50">
                          <Sparkles className={`w-3.5 h-3.5 ${isAiGenerating ? 'animate-spin' : ''}`} />
                          <span>{isAiGenerating ? 'Generating...' : 'AI Generate'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Template grid */}
                    <div className="space-y-4">
                      <span className="text-[10px] text-slate-450 font-extrabold uppercase tracking-wider">
                        {templates.filter(tpl => {
                          if (selectedCategory === 'Favorites') return tpl.isFavorite;
                          if (selectedCategory === 'Recently Used') return recentlyUsedIds.includes(tpl.id);
                          if (selectedCategory !== 'All') return tpl.category === selectedCategory;
                          return !tpl.isArchived;
                        }).filter(tpl => !tplSearchVal.trim() || tpl.title.toLowerCase().includes(tplSearchVal.toLowerCase()) || tpl.description.toLowerCase().includes(tplSearchVal.toLowerCase())).length} {selectedCategory} blueprints
                      </span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {templates.filter(tpl => {
                          if (selectedCategory === 'Favorites') return tpl.isFavorite;
                          if (selectedCategory === 'Recently Used') return recentlyUsedIds.includes(tpl.id);
                          if (selectedCategory !== 'All') return tpl.category === selectedCategory;
                          return !tpl.isArchived;
                        }).filter(tpl => !tplSearchVal.trim() || tpl.title.toLowerCase().includes(tplSearchVal.toLowerCase()) || tpl.description.toLowerCase().includes(tplSearchVal.toLowerCase())).map(tpl => (
                          <div key={tpl.id} className="bg-white border border-slate-200 hover:border-slate-350 hover:shadow-[0_4px_16px_rgba(0,0,0,0.02)] rounded-2xl p-4 flex gap-4 transition-all duration-200 select-none group relative">
                            <div onClick={() => handleUseTemplate(tpl.id)} className="w-20 h-24 bg-slate-50 border border-slate-100 rounded-lg flex flex-col items-center justify-center shrink-0 cursor-pointer shadow-sm relative overflow-hidden hover:bg-slate-100/50 transition-colors">
                              <span className="text-[8px] font-extrabold text-blue-600/30 rotate-12 select-none uppercase tracking-widest absolute">{tpl.category}</span>
                              <Layout className="w-6 h-6 text-slate-300" />
                            </div>
                            <div className="flex-1 min-w-0 flex flex-col justify-between">
                              <div>
                                <div className="flex items-start justify-between gap-2">
                                  <h5 onClick={() => handleUseTemplate(tpl.id)} className="font-extrabold text-slate-900 text-[12.5px] truncate cursor-pointer hover:text-blue-600 transition-colors">{tpl.title}</h5>
                                  <button type="button" onClick={(e) => handleFavoriteToggle(tpl.id, e)} className={`p-1 rounded-full transition-colors ${tpl.isFavorite ? 'text-amber-500' : 'text-slate-350 hover:text-slate-500'}`}>
                                    <Star className={`w-3.5 h-3.5 ${tpl.isFavorite ? 'fill-amber-500' : ''}`} />
                                  </button>
                                </div>
                                <p className="text-[10.5px] text-slate-500 font-semibold line-clamp-2 mt-0.5 leading-relaxed">{tpl.description}</p>
                              </div>
                              <div className="flex flex-wrap items-center gap-1.5 pt-2">
                                <span className="px-1.5 py-0.5 rounded border text-[8px] font-extrabold bg-blue-50 text-blue-700 border-blue-100">{tpl.department}</span>
                                <span className="px-1.5 py-0.5 rounded border text-[8px] font-extrabold bg-slate-50 text-slate-600 border-slate-200">{tpl.version}</span>
                                <span className="px-1.5 py-0.5 rounded border text-[8px] font-extrabold bg-amber-50 text-amber-700 border-amber-250">{tpl.roleVisibility}</span>
                              </div>
                              <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-2">
                                <button type="button" onClick={() => handleUseTemplate(tpl.id)} className="px-3 py-1 bg-slate-100 hover:bg-blue-600 hover:text-white rounded-lg text-[10.5px] font-extrabold text-slate-600 transition-all shadow-sm">Use Template</button>
                                {isAdmin && (
                                  <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                    <button type="button" onClick={(e) => handleEditClick(tpl, e)} className="p-1 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded" title="Edit"><Edit className="w-3.5 h-3.5" /></button>
                                    <button type="button" onClick={(e) => handleDuplicateTemplate(tpl.id, e)} className="p-1 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded" title="Duplicate"><Copy className="w-3.5 h-3.5" /></button>
                                    <button type="button" onClick={(e) => handleArchiveToggle(tpl.id, e)} className={`p-1 hover:bg-slate-100 rounded ${tpl.isArchived ? 'text-amber-600' : 'text-slate-500 hover:text-slate-800'}`} title="Archive"><Archive className="w-3.5 h-3.5" /></button>
                                    <button type="button" onClick={(e) => handleDeleteTemplate(tpl.id, e)} className="p-1 hover:bg-slate-100 text-red-500 hover:text-red-700 rounded" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
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
                        }).filter(tpl => !tplSearchVal.trim() || tpl.title.toLowerCase().includes(tplSearchVal.toLowerCase()) || tpl.description.toLowerCase().includes(tplSearchVal.toLowerCase())).length === 0 && (
                          <div className="col-span-2 text-center py-10 bg-white border border-slate-200 rounded-2xl">
                            <span className="text-slate-400 font-extrabold text-xs block">No matching templates found</span>
                            <span className="text-[10px] text-slate-450 block mt-0.5">Generate one using the AI assistant above</span>
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

      {/* ── 4. ALL OTHER MODALS (New Folder, Rename, Delete, Move, Preview, Share, Toast, Context Menu) ── */}
      <DocumentsModals
        showNewFolderModal={showNewFolderModal}
        setShowNewFolderModal={setShowNewFolderModal}
        newFolderVal={newFolderVal}
        setNewFolderVal={setNewFolderVal}
        triggerCreateFolder={triggerCreateFolder}
        showRenameModal={showRenameModal}
        setShowRenameModal={setShowRenameModal}
        renameTarget={renameTarget}
        renameNewName={renameNewName}
        setRenameNewName={setRenameNewName}
        triggerRenameAction={triggerRenameAction}
        showDeleteConfirm={showDeleteConfirm}
        setShowDeleteConfirm={setShowDeleteConfirm}
        deleteTarget={deleteTarget}
        triggerDeleteConfirm={triggerDeleteConfirm}
        showTreePicker={showTreePicker}
        setShowTreePicker={setShowTreePicker}
        pickerAction={pickerAction}
        pickerTargetItems={pickerTargetItems}
        pickerSelectedFolderId={pickerSelectedFolderId}
        setPickerSelectedFolderId={setPickerSelectedFolderId}
        folderTreeNodes={folderTreeNodes}
        triggerMoveCopyAction={triggerMoveCopyAction}
        showVersionHistory={showVersionHistory}
        setShowVersionHistory={setShowVersionHistory}
        versionHistoryDoc={versionHistoryDoc}
        showToast={showToast}
        previewDoc={previewDoc}
        setPreviewDoc={setPreviewDoc}
        previewImageZoom={previewImageZoom}
        setPreviewImageZoom={setPreviewImageZoom}
        shareDoc={shareDoc}
        setShareDoc={setShareDoc}
        shareSettings={shareSettings}
        setShareSettings={setShareSettings}
        toastMsg={toastMsg}
        isDragOverWindow={isDragOverWindow}
        activeFolder={activeFolder}
        uploadIsPending={uploadDocMutation.isPending}
        contextMenu={contextMenu}
        setContextMenu={setContextMenu}
        handleRestoreItem={handleRestoreItem}
        handleDeleteItemPermanently={handleDeleteItemPermanently}
        handleFolderSelect={handleFolderSelect}
        handleItemClick={handleItemClick}
        setShowInfoPanel={setShowInfoPanel}
        setRenameTarget={setRenameTarget}
        setDeleteTarget={setDeleteTarget}
        setPickerAction={setPickerAction}
        setPickerTargetItems={setPickerTargetItems}
        handleToggleFavorite={handleToggleFavorite}
        handleToggleLock={handleToggleLock}
        setVersionHistoryDoc={setVersionHistoryDoc}
        saveAsTemplateMutation={saveAsTemplateMutation}
      />
    </div>
  );
}
