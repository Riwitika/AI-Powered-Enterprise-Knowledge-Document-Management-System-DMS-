import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import { 
  Folder, 
  FolderPlus, 
  File as FileIcon, 
  Upload, 
  ChevronRight, 
  ChevronDown, 
  Send,
  Loader2,
  Tag,
  Search,
  FileText,
  FileSpreadsheet,
  Sparkles,
  HelpCircle,
  FolderOpen,
  MessageSquare,
  ArrowRight,
  BookOpen,
  X,
  Share2,
  Undo,
  Redo,
  Save,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Plus,
  Link2,
  Image as ImageIcon,
  Code,
  Quote,
  Smile,
  Copy,
  Check,
  MoreVertical,
  Calendar,
  Lock,
  FileDown
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';


export default function DocumentTree() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const openParamId = searchParams.get('open');
  
  // Tab State for Right Panel: AI Context vs Summary vs Versions
  const [rightPanelTab, setRightPanelTab] = useState<'ai' | 'summary' | 'versions'>('summary');

  // Selected Document ID
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Record<number, boolean>>({});
  const [treeSearchQuery, setTreeSearchQuery] = useState('');
  
  // Folder/Document creation states
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderParentId, setNewFolderParentId] = useState<number | null>(null);
  
  const [showUpload, setShowUpload] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadName, setUploadName] = useState('');
  const [uploadDesc, setUploadDesc] = useState('');
  const [uploadCat, setUploadCat] = useState('');
  const [uploadFolderId, setUploadFolderId] = useState<number | null>(null);
  const [uploadAccess, setUploadAccess] = useState('private');

  // Document-Level AI chat states
  const [docAiQuestion, setDocAiQuestion] = useState('');
  const [docChatHistory, setDocChatHistory] = useState<Array<{ q: string; a: string }>>([]);
  const [docAiLoading, setDocAiLoading] = useState(false);

  // Rich Text Editor States
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  
  // Word & Character count
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [zoomPercent, setZoomPercent] = useState('100');

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    type: 'folder' | 'file';
    id: number | string;
  } | null>(null);

  // Share Dialog States
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareUserId, setShareUserId] = useState('');
  const [shareDeptId, setShareDeptId] = useState<number | ''>('');
  const [shareAccessType, setShareAccessType] = useState('view');
  const [shareExpiration, setShareExpiration] = useState('');
  const [shareDisableDownload, setShareDisableDownload] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  // Rename modal states
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameTarget, setRenameTarget] = useState<{ type: 'folder' | 'file'; id: number | string; name: string } | null>(null);
  const [renameNewName, setRenameNewName] = useState('');

  // Move document modal states
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [moveDocId, setMoveDocId] = useState<string | null>(null);
  const [moveTargetFolderId, setMoveTargetFolderId] = useState<number | ''>('');

  // Find & Replace state
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');

  // Auto-Save Timeout ref
  const autoSaveTimerRef = useRef<any>(null);

  // Queries
  const { data: folderTree, isLoading: treeLoading } = useQuery({
    queryKey: ['folder-tree'],
    queryFn: api.folders.tree
  });

  const { data: allDocs } = useQuery({
    queryKey: ['documents-list-workspace'],
    queryFn: api.documents.list
  });

  const { data: selectedDoc, isLoading: docLoading } = useQuery({
    queryKey: ['document', selectedDocId],
    queryFn: () => selectedDocId ? api.documents.get(selectedDocId) : null,
    enabled: !!selectedDocId
  });

  const { data: docVersions, refetch: refetchVersions } = useQuery({
    queryKey: ['doc-versions', selectedDocId],
    queryFn: () => selectedDocId ? api.documents.versions(selectedDocId) : [],
    enabled: !!selectedDocId
  });

  const { data: systemUsers } = useQuery({
    queryKey: ['system-users-directory'],
    queryFn: api.users.list
  });

  const { data: systemDepts } = useQuery({
    queryKey: ['system-depts-directory'],
    queryFn: api.departments.list
  });

  const { data: docPermissions, refetch: refetchPermissionsList } = useQuery({
    queryKey: ['doc-permissions-modal', selectedDocId],
    queryFn: () => selectedDocId ? api.permissions.list(selectedDocId) : [],
    enabled: !!selectedDocId && showShareModal
  });

  // Watch for redirect "open" query param
  useEffect(() => {
    if (openParamId) {
      setSelectedDocId(openParamId);
      // Remove query param to clean URL
      setSearchParams({}, { replace: true });
    }
  }, [openParamId, setSearchParams]);

  // Load document content
  useEffect(() => {
    if (selectedDoc) {
      setEditTitle(selectedDoc.name);
      const localContent = localStorage.getItem(`doc_content_${selectedDoc.id}`);
      const initialText = localContent || selectedDoc.content || `<p>Welcome to <strong>${selectedDoc.name}</strong> workspace. Start document processing, summaries generation, and vector calculations.</p>`;
      setEditContent(initialText);
      updateCounts(initialText);
      setRightPanelTab('summary');
    }
  }, [selectedDoc]);

  // Trigger auto-save on content/title changes
  useEffect(() => {
    if (selectedDocId && selectedDoc) {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
      autoSaveTimerRef.current = setTimeout(() => {
        handleSaveDocumentContent();
      }, 5000); // Auto-save after 5s of inactivity
    }
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [editContent, editTitle]);

  // Document formatting helper
  const applyStyle = (command: string, value = '') => {
    document.execCommand(command, false, value);
    const editor = document.getElementById('doc-editor-body');
    if (editor) {
      const html = editor.innerHTML;
      setEditContent(html);
      updateCounts(html);
    }
  };

  const updateCounts = (html: string) => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    const text = tempDiv.innerText || tempDiv.textContent || '';
    const cleanText = text.trim();
    setCharCount(cleanText.length);
    setWordCount(cleanText ? cleanText.split(/\s+/).length : 0);
  };

  // Mutations
  const createFolderMutation = useMutation({
    mutationFn: api.folders.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folder-tree'] });
      setNewFolderName('');
      setShowNewFolder(false);
    }
  });

  const updateFolderMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: any }) => api.folders.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folder-tree'] });
      setShowRenameModal(false);
    }
  });

  const deleteFolderMutation = useMutation({
    mutationFn: api.folders.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folder-tree'] });
    }
  });

  const uploadDocMutation = useMutation({
    mutationFn: api.documents.upload,
    onSuccess: (newDoc) => {
      queryClient.invalidateQueries({ queryKey: ['folder-tree'] });
      queryClient.invalidateQueries({ queryKey: ['documents-list-workspace'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      setUploadFile(null);
      setUploadName('');
      setUploadDesc('');
      setUploadCat('');
      setShowUpload(false);
      if (newDoc && newDoc.id) {
        setSelectedDocId(newDoc.id);
      }
    }
  });

  const deleteDocMutation = useMutation({
    mutationFn: api.documents.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folder-tree'] });
      queryClient.invalidateQueries({ queryKey: ['documents-list-workspace'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      setSelectedDocId(null);
    }
  });

  const uploadVersionMutation = useMutation({
    mutationFn: ({ id, formData }: { id: string; formData: FormData }) => 
      api.documents.uploadVersion(id, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document', selectedDocId] });
      refetchVersions();
    }
  });

  const saveDocMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => 
      api.documents.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document', selectedDocId] });
      queryClient.invalidateQueries({ queryKey: ['documents-list-workspace'] });
      queryClient.invalidateQueries({ queryKey: ['folder-tree'] });
    }
  });

  const grantPermissionMutation = useMutation({
    mutationFn: ({ docId, payload }: { docId: string; payload: any }) => api.permissions.grant(docId, payload),
    onSuccess: () => {
      refetchPermissionsList();
      setShareUserId('');
      setShareDeptId('');
    }
  });

  const revokePermissionMutation = useMutation({
    mutationFn: ({ docId, params }: { docId: string; params: any }) => api.permissions.revoke(docId, params),
    onSuccess: () => {
      refetchPermissionsList();
    }
  });

  const askDocMutation = useMutation({
    mutationFn: ({ id, q }: { id: string; q: string }) => api.ai.askDoc(id, q),
    onMutate: () => {
      setDocAiLoading(true);
    },
    onSuccess: (res) => {
      setDocChatHistory(prev => {
        const history = [...prev];
        if (history.length > 0) {
          history[history.length - 1].a = res.answer;
        }
        return history;
      });
    },
    onError: (err: any) => {
      setDocChatHistory(prev => {
        const history = [...prev];
        if (history.length > 0) {
          history[history.length - 1].a = `Error: ${err?.message || 'Failed to generate response'}`;
        }
        return history;
      });
    },
    onSettled: () => {
      setDocAiLoading(false);
    }
  });

  // Helper to build breadcrumb paths
  const getBreadcrumbs = () => {
    if (!selectedDoc || !folderTree) return ['Root'];
    const path: string[] = [];
    let currentFolderId = selectedDoc.folder_id;
    
    // Flatten folders to easily search by ID
    const allFolders: Record<number, any> = {};
    const flatten = (nodes: any[]) => {
      for (const node of nodes) {
        allFolders[node.id] = node;
        if (node.sub_folders) flatten(node.sub_folders);
      }
    };
    if (folderTree) flatten(folderTree);

    while (currentFolderId && allFolders[currentFolderId]) {
      const folder = allFolders[currentFolderId];
      path.unshift(folder.name);
      currentFolderId = folder.parent_id;
    }
    path.unshift('Root');
    return path;
  };

  // Action helpers
  const handleSaveDocumentContent = () => {
    if (!selectedDocId) return;
    const editableDiv = document.getElementById('doc-editor-body');
    const htmlContent = editableDiv ? editableDiv.innerHTML : editContent;
    
    // Cache locally
    localStorage.setItem(`doc_content_${selectedDocId}`, htmlContent);
    
    saveDocMutation.mutate({
      id: selectedDocId,
      payload: {
        name: editTitle,
        description: selectedDoc?.description,
        category: selectedDoc?.category,
        access_level: selectedDoc?.access_level,
        status: selectedDoc?.status,
        content: htmlContent
      }
    });
  };

  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    createFolderMutation.mutate({
      name: newFolderName,
      parent_id: newFolderParentId
    });
  };

  const handleUploadDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;
    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('name', uploadName || uploadFile.name);
    formData.append('description', uploadDesc);
    formData.append('category', uploadCat);
    formData.append('access_level', uploadAccess);
    if (uploadFolderId !== null) {
      formData.append('folder_id', String(uploadFolderId));
    }
    uploadDocMutation.mutate(formData);
  };

  const handleNewVersionUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedDocId || !e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);
    uploadVersionMutation.mutate({ id: selectedDocId, formData });
  };

  const handleAskDocAI = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDocId || !docAiQuestion.trim()) return;
    const q = docAiQuestion;
    setDocAiQuestion('');
    setDocChatHistory(prev => [...prev, { q, a: 'Thinking...' }]);
    askDocMutation.mutate({ id: selectedDocId, q });
  };

  const handleContextMenu = (e: React.MouseEvent, type: 'folder' | 'file', id: number | string) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      type,
      id
    });
  };

  const handleCreateNewBlankDocument = (folderId: number | null, customName?: string) => {
    const title = customName || "Untitled Document";
    const dummyFile = new File(["<p>Start writing your enterprise document...</p>"], `${title}.txt`, { type: "text/plain" });
    const formData = new FormData();
    formData.append('file', dummyFile);
    formData.append('name', title);
    formData.append('description', 'Draft document created in workspace');
    formData.append('category', 'Draft');
    formData.append('access_level', 'private');
    if (folderId !== null) {
      formData.append('folder_id', String(folderId));
    }
    
    uploadDocMutation.mutate(formData);
  };

  const handleDuplicateDocument = (doc: any) => {
    const dummyFile = new File([localStorage.getItem(`doc_content_${doc.id}`) || "<p>Blank document copy</p>"], `${doc.name} (Copy).txt`, { type: "text/plain" });
    const formData = new FormData();
    formData.append('file', dummyFile);
    formData.append('name', `${doc.name} (Copy)`);
    formData.append('description', doc.description || '');
    formData.append('category', doc.category || '');
    formData.append('access_level', 'private');
    if (doc.folder_id !== null) {
      formData.append('folder_id', String(doc.folder_id));
    }
    uploadDocMutation.mutate(formData);
  };

  const handleMoveDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!moveDocId) return;
    
    saveDocMutation.mutate({
      id: moveDocId,
      payload: {
        folder_id: moveTargetFolderId !== '' ? Number(moveTargetFolderId) : null
      }
    }, {
      onSuccess: () => {
        setShowMoveModal(false);
        setMoveDocId(null);
        setMoveTargetFolderId('');
      }
    });
  };

  const handleRenameTarget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameTarget || !renameNewName.trim()) return;

    if (renameTarget.type === 'folder') {
      updateFolderMutation.mutate({
        id: Number(renameTarget.id),
        payload: { name: renameNewName }
      });
    } else {
      saveDocMutation.mutate({
        id: String(renameTarget.id),
        payload: { name: renameNewName }
      }, {
        onSuccess: () => {
          if (selectedDocId === renameTarget.id) {
            setEditTitle(renameNewName);
          }
          setShowRenameModal(false);
        }
      });
    }
  };

  const handleInsertTable = (rows = 3, cols = 3) => {
    let tableHtml = '<table class="border-collapse border border-slate-300 min-w-full my-4 text-xs"><tbody>';
    for (let r = 0; r < rows; r++) {
      tableHtml += '<tr>';
      for (let c = 0; c < cols; c++) {
        tableHtml += '<td class="border border-slate-300 p-2 min-w-[60px]">&nbsp;</td>';
      }
      tableHtml += '</tr>';
    }
    tableHtml += '</tbody></table>';
    applyStyle('insertHTML', tableHtml);
  };

  const handleInsertLink = () => {
    const url = prompt("Enter hyperlink URL (e.g. https://google.com):");
    if (url) {
      applyStyle('createLink', url);
    }
  };

  const handleInsertImage = () => {
    const url = prompt("Enter image URL:");
    if (url) {
      applyStyle('insertImage', url);
    }
  };

  const handleFindReplace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!findText) return;
    const bodyDiv = document.getElementById('doc-editor-body');
    if (bodyDiv) {
      const escaped = findText.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(escaped, 'gi');
      bodyDiv.innerHTML = bodyDiv.innerHTML.replace(regex, replaceText);
      setEditContent(bodyDiv.innerHTML);
      updateCounts(bodyDiv.innerHTML);
    }
  };

  const triggerAIShortcut = (action: string) => {
    if (!selectedDocId) return;
    let finalAction = action;
    if (action === 'Translate') {
      const lang = prompt("Enter target language (e.g. Spanish, French, German):", "Spanish");
      if (!lang) return;
      finalAction = `Translate to ${lang}`;
    }
    const q = `${finalAction} the following document text:\n"${document.getElementById('doc-editor-body')?.innerText || editContent}"`;
    setRightPanelTab('ai');
    setDocChatHistory(prev => [...prev, { q: `${finalAction} Request`, a: 'Thinking...' }]);
    askDocMutation.mutate({ id: selectedDocId, q });
  };

  const handleGrantPermission = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDocId) return;
    if (!shareUserId && !shareDeptId) return;

    grantPermissionMutation.mutate({
      docId: selectedDocId,
      payload: {
        user_id: shareUserId || null,
        department_id: shareDeptId !== '' ? Number(shareDeptId) : null,
        access_type: shareAccessType
      }
    });
  };

  const handleRevokePermission = (perm: any) => {
    if (!selectedDocId) return;
    revokePermissionMutation.mutate({
      docId: selectedDocId,
      params: {
        user_id: perm.user_id || undefined,
        department_id: perm.department_id || undefined
      }
    });
  };

  const handleDownload = async (doc: any) => {
    try {
      const blob = await api.documents.download(doc.id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${doc.name}.${doc.file_type}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      alert('Failed to download file');
    }
  };

  const handleCopyShareLink = () => {
    const url = `${window.location.origin}/documents/${selectedDocId}`;
    navigator.clipboard.writeText(url);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  // Directory tree utilities
  const handleToggleFolder = (folderId: number) => {
    setExpandedFolders(prev => ({ ...prev, [folderId]: !prev[folderId] }));
  };

  const getFileIcon = (fileType: string) => {
    const ext = fileType.toLowerCase();
    if (ext === 'pdf') return { Icon: FileText, color: 'text-red-500 bg-red-50 border-red-100' };
    if (['doc', 'docx'].includes(ext)) return { Icon: FileText, color: 'text-blue-500 bg-blue-50 border-blue-100' };
    if (['xls', 'xlsx', 'csv'].includes(ext)) return { Icon: FileSpreadsheet, color: 'text-emerald-500 bg-emerald-50 border-emerald-100' };
    return { Icon: FileIcon, color: 'text-slate-400 bg-slate-50 border-slate-100' };
  };

  const filterNode = (node: any, query: string): boolean => {
    if (!query) return true;
    const nameMatch = node.name.toLowerCase().includes(query.toLowerCase());
    const hasSubFolderMatch = node.sub_folders?.some((sub: any) => filterNode(sub, query));
    const hasDocMatch = node.documents?.some((doc: any) => doc.name.toLowerCase().includes(query.toLowerCase()));
    return nameMatch || hasSubFolderMatch || hasDocMatch;
  };

  // Close context menu on window click
  useEffect(() => {
    const closeMenu = () => setContextMenu(null);
    window.addEventListener('click', closeMenu);
    return () => window.removeEventListener('click', closeMenu);
  }, []);

  // Recursive Tree Node Renderer
  const renderTreeNode = (node: any, depth = 0) => {
    const isExpanded = expandedFolders[node.id];
    const isVisible = filterNode(node, treeSearchQuery);
    
    if (!isVisible) return null;
    
    const filteredDocs = node.documents?.filter((doc: any) => 
      !treeSearchQuery || doc.name.toLowerCase().includes(treeSearchQuery.toLowerCase())
    ) || [];

    const filteredSubFolders = node.sub_folders?.filter((sub: any) => 
      filterNode(sub, treeSearchQuery)
    ) || [];

    return (
      <div key={node.id} style={{ marginLeft: `${depth > 0 ? 12 : 0}px` }} className="space-y-0.5">
        {/* Folder row */}
        <div 
          className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-slate-100/70 cursor-pointer group transition-all"
          onClick={() => handleToggleFolder(node.id)}
          onContextMenu={(e) => handleContextMenu(e, 'folder', node.id)}
        >
          <div className="flex items-center gap-2 text-slate-700 min-w-0">
            {isExpanded ? <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-450" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-450" />}
            <Folder className={`h-4 w-4 shrink-0 ${isExpanded ? 'text-amber-500 fill-amber-500/20' : 'text-amber-600 fill-amber-600/10'}`} />
            <span className="text-xs font-semibold truncate select-none">{node.name}</span>
          </div>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              const rect = e.currentTarget.getBoundingClientRect();
              setContextMenu({
                x: rect.left,
                y: rect.bottom + window.scrollY,
                type: 'folder',
                id: node.id
              });
            }}
            className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-slate-200 rounded text-slate-450 transition-all shrink-0"
          >
            <MoreVertical className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Nested elements */}
        {isExpanded && (
          <div className="border-l border-slate-200 pl-2.5 ml-3.5 space-y-0.5">
            {filteredSubFolders.map((sub: any) => renderTreeNode(sub, depth + 1))}
            
            {filteredDocs.map((doc: any) => {
              const fileConfig = getFileIcon(doc.file_type);
              const DocIcon = fileConfig.Icon;
              const isSelected = selectedDocId === doc.id;
              
              return (
                <div
                  key={doc.id}
                  onClick={() => {
                    setSelectedDocId(doc.id);
                    setDocChatHistory([]);
                  }}
                  onContextMenu={(e) => handleContextMenu(e, 'file', doc.id)}
                  className={`flex items-center justify-between py-1.5 px-2.5 rounded-lg cursor-pointer transition-all group ${
                    isSelected 
                      ? 'bg-blue-50 text-blue-700 font-bold border-l-2 border-blue-600' 
                      : 'hover:bg-slate-100/60 text-slate-600 hover:text-slate-900 border-l-2 border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <DocIcon className={`h-3.5 w-3.5 shrink-0 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`} />
                    <span className="text-[11px] truncate leading-none select-none">{doc.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[8px] text-slate-450 font-bold shrink-0 uppercase opacity-100 group-hover:opacity-0 transition-opacity">.{doc.file_type}</span>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        const rect = e.currentTarget.getBoundingClientRect();
                        setContextMenu({
                          x: rect.left,
                          y: rect.bottom + window.scrollY,
                          type: 'file',
                          id: doc.id
                        });
                      }}
                      className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-slate-200 rounded text-slate-400 transition-all shrink-0"
                    >
                      <MoreVertical className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}

            {filteredSubFolders.length === 0 && filteredDocs.length === 0 && (
              <div className="text-[10px] text-slate-400 italic py-1 pl-4">Empty Folder</div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-[calc(100vh-100px)] w-full overflow-hidden border border-slate-200 rounded-xl bg-white shadow-sm relative font-sans">
      
      {/* 1. LEFT PANEL (20% width) - Enterprise Folder Catalog Tree */}
      <aside className="w-1/5 border-r border-slate-200 flex flex-col h-full bg-slate-50/50 shrink-0 select-none">
        {/* Catalog Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4.5 w-4.5 text-blue-600" />
            <span className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Document Catalog</span>
          </div>
          <div className="flex gap-1.5">
            <button 
              onClick={() => {
                setNewFolderParentId(null);
                setShowNewFolder(true);
              }}
              className="p-1.5 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-500 hover:text-slate-900 transition-all"
              title="New Folder"
            >
              <FolderPlus className="h-3.5 w-3.5" />
            </button>
            <button 
              onClick={() => {
                setUploadFolderId(null);
                setShowUpload(true);
              }}
              className="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all"
              title="Upload File"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Tree filter input */}
        <div className="px-4 pt-3 pb-2 border-b border-slate-200/50 shrink-0 bg-white">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={treeSearchQuery}
              onChange={(e) => setTreeSearchQuery(e.target.value)}
              placeholder="Search folders & files..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-4 py-2 text-xs focus:outline-none focus:bg-white focus:border-blue-500 transition-all text-slate-800"
            />
          </div>
        </div>

        {/* Collapsible tree view */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
          {treeLoading ? (
            <div className="flex flex-col items-center justify-center h-48 space-y-2">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Loading Catalog...</p>
            </div>
          ) : folderTree && folderTree.length > 0 ? (
            folderTree.map((root: any) => renderTreeNode(root))
          ) : (
            <div className="text-center py-12 space-y-2">
              <FolderOpen className="h-8 w-8 text-slate-350 mx-auto" />
              <p className="text-xs text-slate-500">Workspace catalog is empty.</p>
              <button 
                onClick={() => {
                  setNewFolderParentId(null);
                  setShowNewFolder(true);
                }}
                className="text-xs text-blue-600 hover:underline font-bold"
              >
                Create a folder
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* 2. CENTER PANEL (58% width) - Google Doc Editor Canvas */}
      <main className="flex-1 bg-slate-100 flex flex-col h-full overflow-hidden relative">
        {selectedDocId ? (
          docLoading ? (
            <div className="flex flex-1 items-center justify-center bg-white">
              <div className="text-center space-y-2">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600 mx-auto" />
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Syncing Document...</span>
              </div>
            </div>
          ) : selectedDoc ? (
            <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-100/50">
              
              {/* Document Editor Ribbon Topbar */}
              <div className="bg-white border-b border-slate-200 px-6 py-3 shrink-0 space-y-2.5 shadow-[0_2px_4px_rgba(0,0,0,0.01)]">
                {/* Title and Share */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-8 w-8 shrink-0 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      {/* Breadcrumbs */}
                      <div className="flex items-center gap-1 text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1.5 select-none">
                        {getBreadcrumbs().map((b: string, idx: number, arr: string[]) => (
                          <span key={idx} className="flex items-center gap-1">
                            <span>{b}</span>
                            {idx < arr.length - 1 && <ChevronRight className="h-2.5 w-2.5 text-slate-350" />}
                          </span>
                        ))}
                      </div>

                      <input 
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        placeholder="Untitled Document"
                        className="text-base font-extrabold text-slate-900 border-none p-0 focus:outline-none focus:ring-0 bg-transparent placeholder-slate-350 truncate tracking-tight leading-none block w-64"
                      />
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-450 font-bold mt-1 uppercase tracking-wider">
                        <span>{selectedDoc.category || 'General'}</span>
                        <span>•</span>
                        <span>v{selectedDoc.current_version}</span>
                        <span>•</span>
                        <span className="text-slate-500">{selectedDoc.access_level} scope</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Auto save status indicator */}
                    <span className="text-[10px] text-slate-400 font-bold tracking-wide flex items-center gap-1">
                      {saveDocMutation.isPending ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin text-blue-600" />
                          <span>Saving Changes...</span>
                        </>
                      ) : (
                        <>
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          <span>Sync committed to DB</span>
                        </>
                      )}
                    </span>

                    {/* Google Doc-Style Share Button */}
                    <button
                      onClick={() => setShowShareModal(true)}
                      className="glow-btn bg-blue-600 hover:bg-blue-700 text-white rounded-full px-4 py-1.5 text-xs font-bold shadow-sm flex items-center gap-1.5 transition-colors border border-blue-500"
                    >
                      <Share2 className="h-3.5 w-3.5" />
                      <span>Share</span>
                    </button>

                    <button
                      onClick={() => setSelectedDocId(null)}
                      className="p-1.5 border border-slate-200 hover:bg-slate-50 text-slate-450 hover:text-slate-800 rounded-lg transition-colors"
                      title="Close Document"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Google Doc-Style Toolbar Ribbon */}
                <div className="border border-slate-200/80 rounded-xl bg-slate-50/50 p-1 flex items-center justify-between gap-4 overflow-x-auto text-slate-700 select-none custom-scrollbar">
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => applyStyle('undo')} className="p-1 hover:bg-slate-200 rounded transition-colors w-6.5 h-6.5 flex items-center justify-center" title="Undo"><Undo className="h-3.5 w-3.5 text-slate-550" /></button>
                    <button onClick={() => applyStyle('redo')} className="p-1 hover:bg-slate-200 rounded transition-colors w-6.5 h-6.5 flex items-center justify-center" title="Redo"><Redo className="h-3.5 w-3.5 text-slate-550" /></button>
                    <div className="h-4 w-[1px] bg-slate-200 mx-1" />
                    
                    {/* Zoom Dropdown */}
                    <select
                      value={zoomPercent}
                      onChange={(e) => setZoomPercent(e.target.value)}
                      className="bg-transparent border border-transparent hover:border-slate-200 rounded px-1.5 py-0.5 text-[10px] font-bold text-slate-650 focus:outline-none"
                      title="Zoom"
                    >
                      <option value="75">75%</option>
                      <option value="90">90%</option>
                      <option value="100">100%</option>
                      <option value="125">125%</option>
                      <option value="150">150%</option>
                    </select>

                    <div className="h-4 w-[1px] bg-slate-200 mx-1" />

                    {/* Format/Heading styles */}
                    <select
                      onChange={(e) => applyStyle('formatBlock', e.target.value)}
                      className="bg-transparent border border-transparent hover:border-slate-200 rounded px-1.5 py-0.5 text-[10px] font-bold text-slate-650 focus:outline-none w-24"
                      defaultValue="P"
                      title="Styles"
                    >
                      <option value="P">Normal Text</option>
                      <option value="H1">Heading 1</option>
                      <option value="H2">Heading 2</option>
                      <option value="H3">Heading 3</option>
                      <option value="PRE">Code Block</option>
                    </select>

                    {/* Font Dropdown */}
                    <select
                      onChange={(e) => applyStyle('fontName', e.target.value)}
                      className="bg-transparent border border-transparent hover:border-slate-200 rounded px-1.5 py-0.5 text-[10px] font-bold text-slate-650 focus:outline-none w-28"
                      defaultValue="Outfit"
                      title="Font family"
                    >
                      <option value="Outfit">Outfit</option>
                      <option value="Inter">Inter</option>
                      <option value="Arial">Arial</option>
                      <option value="Times New Roman">Times New Roman</option>
                      <option value="Courier New">Courier New</option>
                    </select>

                    {/* Font Size */}
                    <select
                      onChange={(e) => applyStyle('fontSize', e.target.value)}
                      className="bg-transparent border border-transparent hover:border-slate-200 rounded px-1.5 py-0.5 text-[10px] font-bold text-slate-650 focus:outline-none w-12"
                      defaultValue="3"
                      title="Font Size"
                    >
                      <option value="1">10px</option>
                      <option value="2">12px</option>
                      <option value="3">14px</option>
                      <option value="4">16px</option>
                      <option value="5">18px</option>
                      <option value="6">24px</option>
                    </select>

                    <div className="h-4 w-[1px] bg-slate-200 mx-1" />

                    {/* Bold, Italic, Underline, Strikethrough */}
                    <button onClick={() => applyStyle('bold')} className="p-1 hover:bg-slate-200 rounded transition-colors w-6.5 h-6.5 flex items-center justify-center font-extrabold text-xs" title="Bold">B</button>
                    <button onClick={() => applyStyle('italic')} className="p-1 hover:bg-slate-200 rounded transition-colors w-6.5 h-6.5 flex items-center justify-center italic font-bold text-xs" title="Italic">I</button>
                    <button onClick={() => applyStyle('underline')} className="p-1 hover:bg-slate-200 rounded transition-colors w-6.5 h-6.5 flex items-center justify-center underline font-bold text-xs" title="Underline">U</button>
                    <button onClick={() => applyStyle('strikeThrough')} className="p-1 hover:bg-slate-200 rounded transition-colors w-6.5 h-6.5 flex items-center justify-center line-through font-bold text-xs" title="Strikethrough">S</button>
                    
                    {/* Text colors */}
                    <input 
                      type="color" 
                      onChange={(e) => applyStyle('foreColor', e.target.value)}
                      className="w-5 h-5 border border-slate-250 cursor-pointer rounded-full overflow-hidden shrink-0 mt-0.5" 
                      title="Text Color"
                    />
                    <input 
                      type="color" 
                      onChange={(e) => applyStyle('backColor', e.target.value)}
                      className="w-5 h-5 border border-slate-250 cursor-pointer rounded-sm overflow-hidden shrink-0 mt-0.5" 
                      title="Highlight Color"
                      defaultValue="#FFFF00"
                    />
                    
                    <div className="h-4 w-[1px] bg-slate-200 mx-1" />

                    {/* Alignments */}
                    <button onClick={() => applyStyle('justifyLeft')} className="p-1 hover:bg-slate-200 rounded transition-colors w-6.5 h-6.5 flex items-center justify-center" title="Align Left"><AlignLeft className="h-3.5 w-3.5" /></button>
                    <button onClick={() => applyStyle('justifyCenter')} className="p-1 hover:bg-slate-200 rounded transition-colors w-6.5 h-6.5 flex items-center justify-center" title="Align Center"><AlignCenter className="h-3.5 w-3.5" /></button>
                    <button onClick={() => applyStyle('justifyRight')} className="p-1 hover:bg-slate-200 rounded transition-colors w-6.5 h-6.5 flex items-center justify-center" title="Align Right"><AlignRight className="h-3.5 w-3.5" /></button>
                    <button onClick={() => applyStyle('justifyFull')} className="p-1 hover:bg-slate-200 rounded transition-colors w-6.5 h-6.5 flex items-center justify-center" title="Justify"><AlignJustify className="h-3.5 w-3.5" /></button>
                    
                    <div className="h-4 w-[1px] bg-slate-200 mx-1" />

                    {/* Lists */}
                    <button onClick={() => applyStyle('insertUnorderedList')} className="p-1 hover:bg-slate-200 rounded transition-colors w-6.5 h-6.5 flex items-center justify-center animate-all" title="Bulleted List"><List className="h-3.5 w-3.5" /></button>
                    <button onClick={() => applyStyle('insertOrderedList')} className="p-1 hover:bg-slate-200 rounded transition-colors w-6.5 h-6.5 flex items-center justify-center animate-all" title="Numbered List"><ListOrdered className="h-3.5 w-3.5" /></button>
                    <button onClick={() => applyStyle('insertUnorderedList')} className="p-1 hover:bg-slate-200 rounded transition-colors text-[9px] font-bold px-1.5 h-6.5 flex items-center justify-center hover:text-slate-900" title="Checklist">☑ Checklist</button>
                    
                    <div className="h-4 w-[1px] bg-slate-200 mx-1" />

                    {/* Line spacing */}
                    <select
                      onChange={(e) => {
                        const editor = document.getElementById('doc-editor-body');
                        if (editor) {
                          editor.style.lineHeight = e.target.value;
                          setEditContent(editor.innerHTML);
                        }
                      }}
                      className="bg-transparent border border-transparent hover:border-slate-200 rounded px-1 py-0.5 text-[9px] font-bold text-slate-600 focus:outline-none w-16"
                      defaultValue="1.5"
                      title="Line Spacing"
                    >
                      <option value="1.0">Single</option>
                      <option value="1.15">1.15</option>
                      <option value="1.5">1.5</option>
                      <option value="2.0">Double</option>
                    </select>

                    <div className="h-4 w-[1px] bg-slate-200 mx-1" />

                    {/* Insert Options */}
                    <button onClick={() => handleInsertTable()} className="p-1 hover:bg-slate-200 rounded transition-colors text-[10px] font-bold px-1.5 h-6.5 flex items-center justify-center" title="Insert 3x3 Table">Table</button>
                    <button onClick={handleInsertLink} className="p-1 hover:bg-slate-200 rounded transition-colors w-6.5 h-6.5 flex items-center justify-center" title="Insert Link"><Link2 className="h-3.5 w-3.5" /></button>
                    <button onClick={handleInsertImage} className="p-1 hover:bg-slate-200 rounded transition-colors w-6.5 h-6.5 flex items-center justify-center" title="Insert Image"><ImageIcon className="h-3.5 w-3.5" /></button>
                    <button onClick={() => applyStyle('insertHorizontalRule')} className="p-1 hover:bg-slate-200 rounded transition-colors text-[10px] font-bold px-1.5 h-6.5 flex items-center justify-center" title="Horizontal Rule">HR</button>
                    <button onClick={() => applyStyle('insertHTML', '<pre class="bg-slate-900 text-slate-100 p-3 rounded-lg font-mono text-xs my-2"><code>// Code Block\n</code></pre>')} className="p-1 hover:bg-slate-200 rounded transition-colors w-6.5 h-6.5 flex items-center justify-center" title="Insert Code Block"><Code className="h-3.5 w-3.5" /></button>
                    <button onClick={() => applyStyle('insertHTML', '<blockquote class="border-l-4 border-slate-350 pl-4 italic text-slate-550 my-2">Block Quote</blockquote>')} className="p-1 hover:bg-slate-200 rounded transition-colors w-6.5 h-6.5 flex items-center justify-center" title="Insert Quote"><Quote className="h-3.5 w-3.5" /></button>
                    <button onClick={() => applyStyle('insertHTML', '😊')} className="p-1 hover:bg-slate-200 rounded transition-colors w-6.5 h-6.5 flex items-center justify-center" title="Insert Emoji"><Smile className="h-3.5 w-3.5" /></button>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button 
                      onClick={() => setShowFindReplace(prev => !prev)}
                      className={`text-[10px] font-bold px-2 py-1 rounded transition-colors ${showFindReplace ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-650 hover:bg-slate-300'}`}
                    >
                      Find & Replace
                    </button>
                    <button
                      onClick={() => handleSaveDocumentContent()}
                      disabled={saveDocMutation.isPending}
                      className="glow-btn bg-emerald-600 hover:bg-emerald-700 text-white rounded px-3 py-1 text-[10px] font-bold shadow-sm flex items-center gap-1 disabled:opacity-50 transition-all border border-emerald-500"
                    >
                      <Save className="h-3 w-3" /> Save
                    </button>
                  </div>
                </div>

                {/* Find and replace expanded banner */}
                {showFindReplace && (
                  <form onSubmit={handleFindReplace} className="flex items-center gap-3 p-2 bg-slate-50 border border-slate-200 rounded-xl">
                    <input 
                      type="text" 
                      placeholder="Find text..." 
                      value={findText} 
                      onChange={(e) => setFindText(e.target.value)} 
                      className="bg-white border border-slate-200 rounded px-2.5 py-1 text-xs focus:outline-none focus:border-blue-500 text-slate-800"
                    />
                    <input 
                      type="text" 
                      placeholder="Replace with..." 
                      value={replaceText} 
                      onChange={(e) => setReplaceText(e.target.value)} 
                      className="bg-white border border-slate-200 rounded px-2.5 py-1 text-xs focus:outline-none focus:border-blue-500 text-slate-800"
                    />
                    <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white rounded px-3.5 py-1 text-xs font-bold">Replace All</button>
                  </form>
                )}
              </div>

              {/* Large Page Editor Canvas Container */}
              <div className="flex-1 overflow-y-auto p-8 flex justify-center items-start custom-scrollbar">
                <div 
                  className="bg-white border border-slate-200 shadow-[0_4px_16px_rgba(0,0,0,0.02)] min-h-[750px] p-16 w-full max-w-3xl focus:outline-none transition-all relative font-sans leading-relaxed text-slate-800 text-sm cursor-text rounded-md"
                  style={{ transform: `scale(${Number(zoomPercent)/100})`, transformOrigin: 'top center' }}
                >
                  <div
                    id="doc-editor-body"
                    contentEditable
                    dangerouslySetInnerHTML={{ __html: editContent }}
                    onBlur={(e) => {
                      const html = e.currentTarget.innerHTML;
                      setEditContent(html);
                      updateCounts(html);
                    }}
                    className="focus:outline-none min-h-[650px] font-sans text-slate-700 leading-relaxed text-xs"
                  />
                </div>
              </div>

              {/* Google Doc-Style Bottom Status Bar */}
              <footer className="h-10 bg-white border-t border-slate-200 px-6 flex items-center justify-between shrink-0 select-none text-[10px] text-slate-500">
                <div className="flex items-center gap-4 font-semibold">
                  <span>Words: <strong className="text-slate-800">{wordCount}</strong></span>
                  <span>Characters: <strong className="text-slate-800">{charCount}</strong></span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse" />
                    Auto-Save Active
                  </span>
                  <span>•</span>
                  <span>Revision Registry: <strong>v{selectedDoc.current_version}</strong></span>
                </div>
              </footer>

            </div>
          ) : null
        ) : (
          /* Landing State showing the corporate Master Document Registry Table (exactly what the mentor liked!) */
          <div className="flex-1 overflow-y-auto p-8 flex justify-center items-start custom-scrollbar bg-slate-50">
            <div className="w-full max-w-5xl bg-white border border-slate-200 shadow-[0_4px_16px_rgba(0,0,0,0.02)] rounded-xl p-8 min-h-[80vh] flex flex-col space-y-6">
              
              <div className="text-center py-6 border-b border-slate-150">
                <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
                  Fast Trade Technologies DMS
                </h1>
                <p className="text-xs font-semibold tracking-wider text-slate-400 uppercase mt-0.5">
                  Official Corporate Knowledge Directory & Workspace
                </p>
              </div>

              <div className="flex-1 flex flex-col space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Master Document Registry</span>
                  <button 
                    onClick={() => handleCreateNewBlankDocument(null, "Untitled Document")}
                    className="glow-btn bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-3 py-1.5 text-xs font-bold shadow-sm transition-colors flex items-center gap-1"
                  >
                    <Plus className="h-3.5 w-3.5" /> New Document
                  </button>
                </div>
                
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-[0_2px_4px_rgba(0,0,0,0.01)]">
                  <table className="min-w-full divide-y divide-slate-150 text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 uppercase tracking-widest font-extrabold text-[9px] border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-3.5">Sr. No.</th>
                        <th className="px-6 py-3.5">Document Title</th>
                        <th className="px-6 py-3.5">Category</th>
                        <th className="px-6 py-3.5">Version No.</th>
                        <th className="px-6 py-3.5">Clearance Status</th>
                        <th className="px-6 py-3.5">Author</th>
                        <th className="px-6 py-3.5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 bg-white">
                      {allDocs && allDocs.length > 0 ? (
                        allDocs.map((doc: any, index: number) => (
                          <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4 font-bold text-slate-450">{index + 1}</td>
                            <td className="px-6 py-4">
                              <button 
                                onClick={() => setSelectedDocId(doc.id)}
                                className="font-extrabold text-blue-600 hover:text-blue-700 hover:underline text-left block"
                              >
                                {doc.name}
                              </button>
                            </td>
                            <td className="px-6 py-4 font-bold text-slate-500">{doc.category || 'General'}</td>
                            <td className="px-6 py-4 font-mono font-bold text-slate-450">v{doc.current_version}</td>
                            <td className="px-6 py-4">
                              <span className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-150 px-2 py-0.5 text-[8px] font-extrabold text-emerald-700 uppercase tracking-wider">
                                Approved
                              </span>
                            </td>
                            <td className="px-6 py-4 text-slate-550 font-semibold">{doc.owner?.full_name || 'System Operator'}</td>
                            <td className="px-6 py-4 text-right">
                              <button 
                                onClick={() => setSelectedDocId(doc.id)}
                                className="text-blue-600 hover:text-blue-700 font-extrabold"
                              >
                                Open Workspace
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="px-6 py-12 text-center text-slate-450 italic">
                            No documents found in repository index. Upload or create new documents in folders on the left tree catalog.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>
        )}
      </main>

      {/* 3. RIGHT PANEL (22% width) - Merged AI Sidebar Assistant */}
      <aside className="w-[22%] border-l border-slate-200 flex flex-col h-full bg-white shrink-0 select-none">
        
        {/* Navigation tabs for AI assistant info panels */}
        <div className="flex border-b border-slate-200 shrink-0 bg-slate-50/20">
          <button
            onClick={() => setRightPanelTab('summary')}
            className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-wider transition-all border-b-2 ${
              rightPanelTab === 'summary' 
                ? 'border-blue-600 text-blue-600 bg-white' 
                : 'border-transparent text-slate-400 hover:text-slate-800'
            }`}
          >
            Summary & Tags
          </button>
          <button
            onClick={() => setRightPanelTab('ai')}
            className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-wider transition-all border-b-2 ${
              rightPanelTab === 'ai' 
                ? 'border-blue-600 text-blue-600 bg-white' 
                : 'border-transparent text-slate-400 hover:text-slate-800'
            }`}
          >
            AI Assistant
          </button>
          <button
            onClick={() => setRightPanelTab('versions')}
            className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-wider transition-all border-b-2 ${
              rightPanelTab === 'versions' 
                ? 'border-blue-600 text-blue-600 bg-white' 
                : 'border-transparent text-slate-400 hover:text-slate-800'
            }`}
          >
            Revisions
          </button>
        </div>

        {/* Tab 1: AI Summary & Related (Liked by Mentor) */}
        {rightPanelTab === 'summary' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar">
            {selectedDoc ? (
              <>
                {/* Executive Summary */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-extrabold text-slate-450 uppercase tracking-widest flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                    <span>Executive Summary</span>
                  </h4>
                  <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 text-xs text-slate-600 leading-relaxed font-sans shadow-sm">
                    {selectedDoc.ai_summary || "Uploading document automatically processes text indexes to synthesize executive summaries..."}
                  </div>
                </div>

                {/* AI generated tag keywords */}
                {selectedDoc.ai_keywords && selectedDoc.ai_keywords.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <span className="text-[10px] font-extrabold text-slate-450 uppercase tracking-widest block">Suggested Metadata Tags</span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedDoc.ai_keywords.map((kw: string) => (
                        <span key={kw} className="inline-flex items-center gap-1 bg-slate-100 text-slate-655 px-2.5 py-0.5 rounded-full border border-slate-200 font-semibold text-[9px]">
                          <Tag className="h-2.5 w-2.5 text-slate-400" />
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Related Documents recommendation cards */}
                <div className="space-y-2 pt-4 border-t border-slate-100">
                  <span className="text-[10px] font-extrabold text-slate-450 uppercase tracking-widest block">Related Documents</span>
                  <div className="space-y-2">
                    {allDocs?.filter((d: any) => d.id !== selectedDoc.id && d.category === selectedDoc.category).slice(0, 2).map((d: any) => (
                      <button
                        key={d.id}
                        onClick={() => setSelectedDocId(d.id)}
                        className="w-full text-left p-3 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all flex items-center justify-between group bg-slate-50/50"
                      >
                        <div className="min-w-0 pr-4">
                          <span className="font-bold text-slate-800 text-xs truncate block">{d.name}</span>
                          <span className="text-[9px] text-slate-450 block mt-0.5 uppercase tracking-wider">{d.category || 'General'}</span>
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-blue-600 transition-colors" />
                      </button>
                    ))}
                    {(!allDocs || allDocs.filter((d: any) => d.id !== selectedDoc.id && d.category === selectedDoc.category).length === 0) && (
                      <span className="text-[10px] text-slate-400 italic block">No contextually related documents.</span>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs text-center py-16">
                <FileText className="h-7 w-7 text-slate-200 mb-1" />
                <p className="max-w-[160px] text-[10px] leading-relaxed">Open any document to view executive summary and related files.</p>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Interactive Document Assistant */}
        {rightPanelTab === 'ai' && (
          <div className="flex-1 flex flex-col overflow-hidden p-4">
            {selectedDoc ? (
              <div className="flex-1 flex flex-col h-full overflow-hidden">
                {/* AI Interactive Assistant shortcuts */}
                <div className="grid grid-cols-2 gap-1.5 pb-3 border-b border-slate-100 shrink-0 select-none">
                  {['Summarize', 'Rewrite', 'Improve Writing', 'Explain', 'Translate', 'Generate Training Notes'].map((act) => (
                    <button
                      key={act}
                      onClick={() => triggerAIShortcut(act)}
                      className="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg p-1.5 text-[9px] font-extrabold text-slate-655 hover:text-slate-900 transition-all text-center uppercase tracking-wider"
                    >
                      {act}
                    </button>
                  ))}
                </div>

                {/* Messages container */}
                <div className="flex-1 overflow-y-auto space-y-3.5 py-4 pr-1 custom-scrollbar">
                  {docChatHistory.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 text-xs py-8 px-2">
                      <HelpCircle className="h-6 w-6 text-slate-200 mb-1" />
                      <p className="max-w-sm text-[10px] font-bold uppercase tracking-wider mb-1">Interactive Assistant</p>
                      <p className="max-w-[180px] text-[10px] leading-normal text-slate-450 font-semibold">Ask about the document body or use shortcuts to rewrite sentences.</p>
                    </div>
                  ) : (
                    docChatHistory.map((chat, idx) => (
                      <div key={idx} className="space-y-2">
                        <div className="bg-blue-600 text-white p-2.5 rounded-2xl rounded-tr-none text-xs max-w-[85%] ml-auto w-fit font-bold shadow-sm">
                          {chat.q}
                        </div>
                        <div className="bg-slate-50 border border-slate-200 text-slate-700 p-3 rounded-2xl rounded-tl-none text-xs max-w-[85%] mr-auto w-fit leading-relaxed shadow-sm font-sans relative group">
                          {chat.a === 'Thinking...' ? (
                            <span className="flex items-center gap-1 py-1">
                              <span className="typing-dot animate-bounce" />
                              <span className="typing-dot animate-bounce [animation-delay:0.2s]" />
                              <span className="typing-dot animate-bounce [animation-delay:0.4s]" />
                            </span>
                          ) : (
                            <div>
                              <p className="whitespace-pre-line">{chat.a}</p>
                              {/* Copy button */}
                              <button
                                onClick={() => navigator.clipboard.writeText(chat.a)}
                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-200 rounded text-slate-450 transition-all"
                                title="Copy Response"
                              >
                                <Copy className="h-3 w-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}

                  {/* Follow-up Questions Suggestions */}
                  {docChatHistory.length > 0 && !docAiLoading && (
                    <div className="pt-2 pb-1 space-y-1.5 select-none border-t border-slate-100">
                      <span className="text-[8px] uppercase tracking-wider font-extrabold text-slate-400 block">Suggested Follow-ups:</span>
                      <div className="flex flex-col gap-1.5">
                        {[
                          "Summarize the key requirements from this section.",
                          "Identify any potential compliance or security issues.",
                          "What are the next operational steps described here?"
                        ].map((suggestion, sIdx) => (
                          <button
                            key={sIdx}
                            onClick={() => {
                              setDocAiQuestion('');
                              setDocChatHistory(prev => [...prev, { q: suggestion, a: 'Thinking...' }]);
                              askDocMutation.mutate({ id: selectedDocId!, q: suggestion });
                            }}
                            className="text-left bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg p-2 text-[10px] text-slate-655 font-bold hover:text-slate-900 transition-all flex items-center justify-between"
                          >
                            <span className="truncate pr-2">{suggestion}</span>
                            <ArrowRight className="h-3 w-3 text-blue-600 shrink-0" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Input form */}
                <form onSubmit={handleAskDocAI} className="border-t border-slate-100 pt-3 mt-auto shrink-0 flex gap-1.5">
                  <input
                    type="text"
                    value={docAiQuestion}
                    onChange={(e) => setDocAiQuestion(e.target.value)}
                    placeholder="Ask document AI..."
                    disabled={docAiLoading}
                    className="flex-1 bg-slate-50 border border-slate-250 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder-slate-400 text-slate-800"
                  />
                  <button
                    type="submit"
                    disabled={docAiLoading || !docAiQuestion.trim()}
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg p-2 disabled:opacity-50 transition-colors"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs text-center py-16">
                <MessageSquare className="h-7 w-7 text-slate-200 mb-1" />
                <p className="max-w-[160px] text-[10px] leading-relaxed">Open any document to consult the context-anchored AI Assistant.</p>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Version Registry */}
        {rightPanelTab === 'versions' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {selectedDoc ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold text-slate-450 uppercase tracking-widest block">Revision Registry</span>
                  <label className="text-[10px] font-bold text-blue-600 hover:underline cursor-pointer">
                    Upload Version
                    <input type="file" onChange={handleNewVersionUpload} className="hidden" />
                  </label>
                </div>

                <div className="space-y-2">
                  {docVersions && docVersions.length > 0 ? (
                    docVersions.map((ver: any) => (
                      <div key={ver.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 relative">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-extrabold text-slate-800 text-xs block">Version {ver.version_number}</span>
                            <span className="text-[9px] text-slate-400 block mt-0.5">{new Date(ver.uploaded_at).toLocaleString()}</span>
                          </div>
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[8px] font-extrabold uppercase tracking-wider ${
                            ver.version_number === selectedDoc.current_version
                              ? 'bg-emerald-50 border border-emerald-250 text-emerald-700'
                              : 'bg-slate-100 border border-slate-200 text-slate-500'
                          }`}>
                            {ver.version_number === selectedDoc.current_version ? 'Approved' : 'Revision'}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDownload(selectedDoc)}
                            className="text-[10px] text-blue-600 hover:underline font-bold flex items-center gap-0.5"
                          >
                            <FileDown className="h-3 w-3" /> Download
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-extrabold text-slate-800 text-xs block">Version {selectedDoc.current_version}</span>
                          <span className="text-[9px] text-slate-450 block">{new Date(selectedDoc.created_at).toLocaleString()}</span>
                        </div>
                        <span className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-250 px-2 py-0.5 text-[8px] font-extrabold text-emerald-700 uppercase tracking-wider">
                          Approved
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs text-center py-16">
                <FileText className="h-7 w-7 text-slate-200 mb-1" />
                <p className="max-w-[160px] text-[10px] leading-relaxed">Open any document to trace version logs.</p>
              </div>
            )}
          </div>
        )}
      </aside>

      {/* 4. MODALS & CONTEXT MENU */}

      {/* Custom Context Menu Overlay */}
      {contextMenu && (
        <div 
          className="absolute bg-white border border-slate-250 shadow-lg rounded-xl py-1.5 w-44 z-50 text-xs text-slate-700 border-slate-200 select-none animate-in fade-in zoom-in-95 duration-100"
          style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.type === 'folder' ? (
            <>
              <button 
                onClick={() => {
                  setNewFolderParentId(Number(contextMenu.id));
                  setShowNewFolder(true);
                  setContextMenu(null);
                }}
                className="w-full text-left px-3 py-2 hover:bg-slate-50 font-bold block"
              >
                New Subfolder
              </button>
              <button 
                onClick={() => {
                  handleCreateNewBlankDocument(Number(contextMenu.id), "Untitled Document");
                  setContextMenu(null);
                }}
                className="w-full text-left px-3 py-2 hover:bg-slate-50 font-bold block"
              >
                New Document
              </button>
              <button 
                onClick={() => {
                  setUploadFolderId(Number(contextMenu.id));
                  setShowUpload(true);
                  setContextMenu(null);
                }}
                className="w-full text-left px-3 py-2 hover:bg-slate-50 font-bold block"
              >
                Upload File
              </button>
              <div className="h-[1px] bg-slate-100 my-1" />
              <button 
                onClick={() => {
                  const targetFolder = folderTree?.find((f: any) => f.id === Number(contextMenu.id));
                  setRenameTarget({ type: 'folder', id: contextMenu.id, name: targetFolder?.name || '' });
                  setRenameNewName(targetFolder?.name || '');
                  setShowRenameModal(true);
                  setContextMenu(null);
                }}
                className="w-full text-left px-3 py-2 hover:bg-slate-50 font-bold block"
              >
                Rename Folder
              </button>
              <button 
                onClick={() => {
                  deleteFolderMutation.mutate(Number(contextMenu.id));
                  setContextMenu(null);
                }}
                className="w-full text-left px-3 py-2 hover:bg-slate-50 font-bold text-red-600 hover:text-red-750 block"
              >
                Delete Folder
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={() => {
                  setSelectedDocId(String(contextMenu.id));
                  setContextMenu(null);
                }}
                className="w-full text-left px-3 py-2 hover:bg-slate-50 font-bold block"
              >
                Open Workspace
              </button>
              <button 
                onClick={() => {
                  const targetDoc = allDocs?.find((d: any) => d.id === String(contextMenu.id));
                  if (targetDoc) handleDuplicateDocument(targetDoc);
                  setContextMenu(null);
                }}
                className="w-full text-left px-3 py-2 hover:bg-slate-50 font-bold block"
              >
                Duplicate File
              </button>
              <button 
                onClick={() => {
                  setMoveDocId(String(contextMenu.id));
                  setMoveTargetFolderId('');
                  setShowMoveModal(true);
                  setContextMenu(null);
                }}
                className="w-full text-left px-3 py-2 hover:bg-slate-50 font-bold block"
              >
                Move To Folder
              </button>
              <div className="h-[1px] bg-slate-100 my-1" />
              <button 
                onClick={() => {
                  const targetDoc = allDocs?.find((d: any) => d.id === String(contextMenu.id));
                  setRenameTarget({ type: 'file', id: contextMenu.id, name: targetDoc?.name || '' });
                  setRenameNewName(targetDoc?.name || '');
                  setShowRenameModal(true);
                  setContextMenu(null);
                }}
                className="w-full text-left px-3 py-2 hover:bg-slate-50 font-bold block"
              >
                Rename File
              </button>
              <button 
                onClick={() => {
                  deleteDocMutation.mutate(String(contextMenu.id));
                  setContextMenu(null);
                }}
                className="w-full text-left px-3 py-2 hover:bg-slate-50 font-bold text-red-600 hover:text-red-750 block"
              >
                Delete File
              </button>
            </>
          )}
        </div>
      )}

      {/* Share Permission Modal Dialog (Google Docs style) */}
      {showShareModal && selectedDoc && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200 select-none">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-lg w-full space-y-5 shadow-2xl relative">
            <button onClick={() => setShowShareModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-650 p-1 hover:bg-slate-50 rounded-lg transition-colors"><X className="h-4.5 w-4.5" /></button>
            
            <div className="space-y-1">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <Share2 className="h-5 w-5 text-blue-600" />
                <span>Share "{selectedDoc.name}"</span>
              </h3>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Configure collaborative access privileges</p>
            </div>

            {/* Grant Permission Form */}
            <form onSubmit={handleGrantPermission} className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] font-bold text-slate-450 uppercase tracking-widest block mb-1.5">Add User Profile</label>
                  <select
                    value={shareUserId}
                    onChange={(e) => {
                      setShareUserId(e.target.value);
                      if (e.target.value) setShareDeptId('');
                    }}
                    className="w-full bg-white border border-slate-250 rounded-lg px-2 py-1.5 text-xs text-slate-700 focus:outline-none"
                  >
                    <option value="">Select individual user...</option>
                    {systemUsers?.filter((u: any) => u.id !== user?.id).map((u: any) => (
                      <option key={u.id} value={u.id}>{u.full_name} ({u.email})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-455 uppercase tracking-widest block mb-1.5">Add Department Group</label>
                  <select
                    value={shareDeptId}
                    onChange={(e) => {
                      setShareDeptId(e.target.value !== '' ? Number(e.target.value) : '');
                      if (e.target.value) setShareUserId('');
                    }}
                    className="w-full bg-white border border-slate-250 rounded-lg px-2 py-1.5 text-xs text-slate-700 focus:outline-none"
                  >
                    <option value="">Select department...</option>
                    {systemDepts?.map((d: any) => (
                      <option key={d.id} value={d.id}>{d.name} Division</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 pt-1">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-bold text-slate-450 uppercase tracking-widest">Access Role:</span>
                  <select
                    value={shareAccessType}
                    onChange={(e) => setShareAccessType(e.target.value)}
                    className="bg-white border border-slate-250 rounded-lg px-2 py-1 text-xs text-slate-700 focus:outline-none"
                  >
                    <option value="view">Viewer</option>
                    <option value="comment">Commenter</option>
                    <option value="edit">Editor</option>
                    <option value="owner">Owner</option>
                  </select>
                </div>
                
                <button
                  type="submit"
                  disabled={!shareUserId && !shareDeptId}
                  className="glow-btn bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-1.5 text-xs font-bold shadow-sm transition-colors disabled:opacity-50"
                >
                  Invite Access
                </button>
              </div>
            </form>

            {/* Expire / Expiration options */}
            <div className="flex items-center justify-between border-t border-slate-150 pt-3 text-[10px] text-slate-500">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4.5 w-4.5 text-slate-400" />
                <span>Expiration Date:</span>
                <input 
                  type="date"
                  value={shareExpiration}
                  onChange={(e) => setShareExpiration(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-xs text-slate-750 focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <input 
                  type="checkbox"
                  id="disable-download"
                  checked={shareDisableDownload}
                  onChange={(e) => setShareDisableDownload(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="disable-download" className="cursor-pointer">Disable Download</label>
              </div>
            </div>

            {/* List of active permissions */}
            <div className="space-y-2 border-t border-slate-150 pt-4">
              <span className="text-[10px] font-extrabold text-slate-450 uppercase tracking-widest block">Collaborators & Permissions</span>
              <div className="max-h-[160px] overflow-y-auto pr-1 space-y-1.5 custom-scrollbar">
                {/* Default owner */}
                <div className="flex items-center justify-between p-2.5 bg-slate-50/50 rounded-xl text-xs">
                  <div>
                    <span className="font-bold text-slate-900 block">{selectedDoc.owner?.full_name || 'System Administrator'}</span>
                    <span className="text-[10px] text-slate-450 block">{selectedDoc.owner?.email || 'admin@enterprise.com'}</span>
                  </div>
                  <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wider">Owner</span>
                </div>

                {docPermissions?.map((perm: any) => (
                  <div key={perm.id} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl text-xs hover:bg-slate-100/70 transition-all">
                    <div>
                      {perm.user ? (
                        <>
                          <span className="font-bold text-slate-800 block">{perm.user.full_name}</span>
                          <span className="text-[10px] text-slate-450 block">{perm.user.email}</span>
                        </>
                      ) : (
                        <>
                          <span className="font-bold text-slate-800 block">{perm.department?.name} Department</span>
                          <span className="text-[10px] text-slate-450 block">Division level access</span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-bold text-slate-550 capitalize">{perm.access_type}</span>
                      <button
                        onClick={() => handleRevokePermission(perm)}
                        className="text-[10px] text-red-600 hover:text-red-750 font-bold"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sharing link generation */}
            <div className="border-t border-slate-150 pt-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 truncate flex-1">
                <Lock className="h-4 w-4 text-slate-400 shrink-0" />
                <span className="truncate bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-slate-600 font-mono text-[10px] flex-1">
                  {window.location.origin}/documents/{selectedDoc.id}
                </span>
              </div>
              <button
                onClick={handleCopyShareLink}
                className="bg-slate-100 hover:bg-slate-200 border border-slate-250 text-slate-800 rounded-lg px-3 py-1.5 text-xs font-bold shadow-sm transition-all shrink-0 flex items-center gap-1.5 w-28 justify-center"
              >
                {linkCopied ? <Check className="h-4.5 w-4.5 text-emerald-600" /> : <Copy className="h-4.5 w-4.5" />}
                <span>{linkCopied ? 'Copied' : 'Copy Link'}</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Rename modal dialog */}
      {showRenameModal && renameTarget && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={handleRenameTarget} className="bg-white border border-slate-200 rounded-xl p-6 max-w-sm w-full space-y-4 shadow-xl">
            <h3 className="font-bold text-slate-950 text-base">Rename {renameTarget.type === 'folder' ? 'Folder' : 'Document'}</h3>
            <div>
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">New Name</label>
              <input 
                type="text" 
                value={renameNewName}
                onChange={(e) => setRenameNewName(e.target.value)}
                placeholder="Finance SOP, Legal Contract..."
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:bg-white focus:border-blue-500 text-slate-800"
              />
            </div>
            <div className="flex justify-end gap-2.5 pt-2">
              <button 
                type="button" 
                onClick={() => setShowRenameModal(false)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors"
              >
                Rename
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Move Document Modal Dialog */}
      {showMoveModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={handleMoveDocument} className="bg-white border border-slate-200 rounded-xl p-6 max-w-sm w-full space-y-4 shadow-xl">
            <h3 className="font-bold text-slate-950 text-base">Move Document</h3>
            <div>
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Target Destination Folder</label>
              <select
                value={moveTargetFolderId}
                onChange={(e) => setMoveTargetFolderId(e.target.value !== '' ? Number(e.target.value) : '')}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:bg-white focus:border-blue-500 text-slate-700"
              >
                <option value="">Root Catalog (No Folder)</option>
                {folderTree?.map((f: any) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2.5 pt-2">
              <button 
                type="button" 
                onClick={() => setShowMoveModal(false)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors"
              >
                Move Document
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Create Folder Modal */}
      {showNewFolder && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={handleCreateFolder} className="bg-white border border-slate-200 rounded-xl p-6 max-w-sm w-full space-y-4 shadow-xl">
            <h3 className="font-bold text-slate-950 text-base">New Folder</h3>
            <div>
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Folder Name</label>
              <input 
                type="text" 
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Finance SOP, Technical Specs..."
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:bg-white focus:border-blue-500 text-slate-800"
              />
            </div>
            <div className="flex justify-end gap-2.5 pt-2">
              <button 
                type="button" 
                onClick={() => setShowNewFolder(false)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors"
              >
                Create Folder
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Upload File Modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={handleUploadDocument} className="bg-white border border-slate-200 rounded-xl p-6 max-w-md w-full space-y-4 shadow-xl overflow-y-auto max-h-[90vh]">
            <h3 className="font-bold text-slate-950 text-base">Upload Document</h3>
            
            <div>
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Select Document</label>
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 hover:border-slate-300 rounded-xl p-5 hover:bg-slate-50 cursor-pointer transition-colors text-center">
                <Upload className="h-6 w-6 text-slate-400 mb-2" />
                <span className="text-xs font-bold text-slate-600">{uploadFile ? uploadFile.name : 'Choose file or drag & drop'}</span>
                <span className="text-[9px] text-slate-400 block mt-1">PDF, DOCX, XLSX, PPTX, TXT</span>
                <input 
                  type="file" 
                  required
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      setUploadFile(e.target.files[0]);
                      setUploadName(e.target.files[0].name.split('.')[0]);
                    }
                  }}
                  className="hidden" 
                />
              </label>
            </div>

            <div>
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Document Title</label>
              <input 
                type="text" 
                value={uploadName}
                onChange={(e) => setUploadName(e.target.value)}
                placeholder="User Operations Guide"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:bg-white focus:border-blue-500 text-slate-800"
              />
            </div>

            <div>
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Abstract Description</label>
              <textarea 
                value={uploadDesc}
                onChange={(e) => setUploadDesc(e.target.value)}
                placeholder="Summarize context and keywords..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:bg-white focus:border-blue-500 text-slate-800 h-20 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Category Tag</label>
                <input 
                  type="text" 
                  value={uploadCat}
                  onChange={(e) => setUploadCat(e.target.value)}
                  placeholder="SOP, Manual, Contract"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:bg-white focus:border-blue-500 text-slate-800"
                />
              </div>

              <div>
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Access Scope</label>
                <select
                  value={uploadAccess}
                  onChange={(e) => setUploadAccess(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:bg-white focus:border-blue-500 text-slate-800"
                >
                  <option value="private">Private (Owner only)</option>
                  <option value="view_only">View Only (Org read-only)</option>
                  <option value="edit">Edit (Org edit access)</option>
                  <option value="department">Department (My dept only)</option>
                  <option value="organization">Organization (Full access)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button 
                type="button" 
                onClick={() => setShowUpload(false)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={!uploadFile}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold disabled:opacity-50 transition-colors"
              >
                Upload & Ingest
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
