import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import { UploadModal } from '../components/UploadModal';
import { ShareModal } from '../components/ShareModal';
import { 
  ChevronRight, 
  Send,
  Loader2,
  Tag,
  FileText,
  Sparkles,
  HelpCircle,
  MessageSquare,
  ArrowRight,
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
  Smile,
  Star,
  Cloud,
  Video,
  Printer,
  ArrowLeft
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';


export default function DocumentTree() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Tab State for Right Panel: AI Context vs Summary vs Versions
  const [rightPanelTab, setRightPanelTab] = useState<'ai' | 'summary' | 'versions'>('summary');

  // Selected Document ID derived from URL params for Google Docs single source of truth
  const selectedDocId = searchParams.get('open');
  const setSelectedDocId = (id: string | null) => {
    if (id) {
      setSearchParams({ open: id });
    } else {
      setSearchParams({});
    }
  };

  const [isAiCollapsed, setIsAiCollapsed] = useState(false);
  const [showOutline, setShowOutline] = useState(true);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  
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
  const { data: folderTree } = useQuery({
    queryKey: ['folders-tree'],
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

  // Load document content
  useEffect(() => {
    if (selectedDoc) {
      setEditTitle(selectedDoc.name);
      const localContent = localStorage.getItem(`doc_content_${selectedDoc.id}`);
      let initialText = selectedDoc.content || `<p>Welcome to <strong>${selectedDoc.name}</strong> workspace. Start document processing, summaries generation, and vector calculations.</p>`;
      
      if (localContent && localContent !== selectedDoc.content) {
        const confirmRestore = window.confirm("A local draft was found. Would you like to restore it?");
        if (confirmRestore) {
          initialText = localContent;
        } else {
          localStorage.removeItem(`doc_content_${selectedDoc.id}`);
        }
      }
      
      setEditContent(initialText);
      updateCounts(initialText);
      setRightPanelTab('summary');
    }
  }, [selectedDoc]);

  // Trigger auto-save on content/title changes
  useEffect(() => {
    if (selectedDocId && selectedDoc) {
      // Immediate local draft caching on change
      const editableDiv = document.getElementById('doc-editor-body');
      const htmlContent = editableDiv ? editableDiv.innerHTML : editContent;
      if (htmlContent !== selectedDoc.content || editTitle !== selectedDoc.name) {
        localStorage.setItem(`doc_content_${selectedDocId}`, htmlContent);
      }

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

  const getHeadings = () => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = editContent;
    const headingElements = tempDiv.querySelectorAll('h1, h2, h3, h4');
    const list: Array<{ text: string; tag: string; id: string }> = [];
    headingElements.forEach((el, index) => {
      let id = el.id;
      if (!id) {
        id = `heading-${index}`;
      }
      list.push({
        text: el.textContent || '',
        tag: el.tagName.toLowerCase(),
        id
      });
    });
    return list;
  };

  const scrollToHeading = (index: number) => {
    const editor = document.getElementById('doc-editor-body');
    if (editor) {
      const headingElements = editor.querySelectorAll('h1, h2, h3, h4');
      if (headingElements[index]) {
        headingElements[index].scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Place cursor inside the heading
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(headingElements[index]);
        range.collapse(false);
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    }
  };

  // Mutations
  const createFolderMutation = useMutation({
    mutationFn: api.folders.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders-tree'] });
      setNewFolderName('');
      setShowNewFolder(false);
    }
  });

  const updateFolderMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: any }) => api.folders.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders-tree'] });
      setShowRenameModal(false);
    }
  });

  const deleteFolderMutation = useMutation({
    mutationFn: api.folders.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders-tree'] });
    }
  });

  const uploadDocMutation = useMutation({
    mutationFn: api.documents.upload,
    onSuccess: (newDoc) => {
      queryClient.invalidateQueries({ queryKey: ['folders-tree'] });
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
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['folders-tree'] });
      queryClient.invalidateQueries({ queryKey: ['documents-list-workspace'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      setSelectedDocId(null);
      localStorage.removeItem(`doc_content_${deletedId}`);
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
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['document', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['documents-list-workspace'] });
      queryClient.invalidateQueries({ queryKey: ['folders-tree'] });
      // Remove autosave draft after successful save
      localStorage.removeItem(`doc_content_${variables.id}`);
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


  const handleAskDocAI = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDocId || !docAiQuestion.trim()) return;
    const q = docAiQuestion;
    setDocAiQuestion('');
    setDocChatHistory(prev => [...prev, { q, a: 'Thinking...' }]);
    askDocMutation.mutate({ id: selectedDocId, q });
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

  // Close context menu on window click
  useEffect(() => {
    const closeMenu = () => setContextMenu(null);
    window.addEventListener('click', closeMenu);
    return () => window.removeEventListener('click', closeMenu);
  }, []);

  return (
    <div className={selectedDocId ? "h-screen w-screen flex flex-col bg-[#f9fbfd] font-sans overflow-hidden" : "flex h-[calc(100vh-100px)] w-full overflow-hidden border border-slate-200 rounded-xl bg-white shadow-sm relative font-sans"}>
      
      {selectedDocId ? (
        docLoading ? (
          <div className="flex flex-1 items-center justify-center bg-white h-full w-full">
            <div className="text-center space-y-2">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600 mx-auto" />
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Syncing Document...</span>
            </div>
          </div>
        ) : selectedDoc ? (
          <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#f9fbfd]">
            
            {/* Google Docs Top Header Bar */}
            <header className="bg-[#f9fbfd] px-4 pt-2 pb-1 flex flex-col shrink-0 select-none border-b border-[#e1e3e1] relative z-30">
              <div className="flex items-center justify-between">
                
                {/* Title & Menus */}
                <div className="flex items-center gap-2.5 min-w-0">
                  {/* Docs Logo Icon (Back to catalog) */}
                  <button 
                    onClick={() => setSelectedDocId(null)}
                    className="h-10 w-10 hover:bg-slate-100 rounded-full flex items-center justify-center text-blue-600 transition-colors shrink-0"
                    title="Back to Catalog"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>

                  <div className="min-w-0 flex flex-col">
                    {/* Title input with Star & Cloud */}
                    <div className="flex items-center gap-2">
                      <input 
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        placeholder="Untitled Document"
                        className="text-base font-medium text-[#1f1f1f] border-none p-0 focus:outline-none focus:ring-0 bg-transparent placeholder-slate-350 truncate tracking-tight max-w-[400px] hover:bg-slate-100 rounded px-1 transition-colors leading-none"
                      />
                      <button className="text-slate-400 hover:text-amber-500 transition-colors p-0.5 rounded-full"><Star className="h-4 w-4" /></button>
                      <button className="text-slate-400 hover:text-slate-600 transition-colors p-0.5 rounded-full" title="All changes saved to cloud"><Cloud className="h-4 w-4 text-emerald-600" /></button>
                    </div>

                    {/* Google Docs Menu Bar */}
                    <div className="flex items-center gap-3 text-xs text-[#444746] mt-0.5 font-normal select-none">
                      
                      {/* File Menu */}
                      <div className="relative">
                        <button 
                          onClick={() => setActiveMenu(activeMenu === 'File' ? null : 'File')}
                          className="px-2 py-0.5 hover:bg-[#eff1f0] rounded cursor-pointer transition-colors"
                        >
                          File
                        </button>
                        {activeMenu === 'File' && (
                          <div className="absolute left-0 mt-1 w-52 bg-white border border-slate-200 rounded-lg shadow-lg py-1.5 z-50 text-xs font-medium text-slate-700 animate-in fade-in zoom-in-95 duration-100">
                            <button onClick={() => { handleCreateNewBlankDocument(null, "New Document"); setActiveMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-slate-50 font-semibold block">New Document</button>
                            <button onClick={() => { handleDuplicateDocument(selectedDoc); setActiveMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-slate-50 font-semibold block">Make a Copy (Duplicate)</button>
                            <div className="h-[1px] bg-slate-100 my-1" />
                            <button onClick={() => { handleSaveDocumentContent(); setActiveMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-slate-50 font-semibold block">Save Current Draft</button>
                            <button onClick={() => { handleDownload(selectedDoc); setActiveMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-slate-50 font-semibold block">Download Document</button>
                            <div className="h-[1px] bg-slate-100 my-1" />
                            <button onClick={() => { setRenameTarget({ type: 'file', id: selectedDoc.id, name: selectedDoc.name }); setRenameNewName(selectedDoc.name); setShowRenameModal(true); setActiveMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-slate-50 font-semibold block">Rename File</button>
                            <button onClick={() => { setMoveDocId(selectedDoc.id); setMoveTargetFolderId(''); setShowMoveModal(true); setActiveMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-slate-50 font-semibold block">Move to Folder</button>
                            <div className="h-[1px] bg-slate-100 my-1" />
                            <button onClick={() => { deleteDocMutation.mutate(selectedDoc.id); setActiveMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-slate-50 font-semibold text-red-655 hover:text-red-750 block">Delete File</button>
                          </div>
                        )}
                      </div>

                      {/* Edit Menu */}
                      <div className="relative">
                        <button 
                          onClick={() => setActiveMenu(activeMenu === 'Edit' ? null : 'Edit')}
                          className="px-2 py-0.5 hover:bg-[#eff1f0] rounded cursor-pointer transition-colors"
                        >
                          Edit
                        </button>
                        {activeMenu === 'Edit' && (
                          <div className="absolute left-0 mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-lg py-1.5 z-50 text-xs font-medium text-slate-700 animate-in fade-in zoom-in-95 duration-100">
                            <button onClick={() => { applyStyle('undo'); setActiveMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-slate-50 font-semibold block flex justify-between"><span>Undo</span><span className="text-slate-400">Ctrl+Z</span></button>
                            <button onClick={() => { applyStyle('redo'); setActiveMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-slate-50 font-semibold block flex justify-between"><span>Redo</span><span className="text-slate-400">Ctrl+Y</span></button>
                            <div className="h-[1px] bg-slate-100 my-1" />
                            <button onClick={() => { setShowFindReplace(true); setActiveMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-slate-50 font-semibold block">Find and Replace</button>
                          </div>
                        )}
                      </div>

                      {/* View Menu */}
                      <div className="relative">
                        <button 
                          onClick={() => setActiveMenu(activeMenu === 'View' ? null : 'View')}
                          className="px-2 py-0.5 hover:bg-[#eff1f0] rounded cursor-pointer transition-colors"
                        >
                          View
                        </button>
                        {activeMenu === 'View' && (
                          <div className="absolute left-0 mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-lg py-1.5 z-50 text-xs font-medium text-slate-700 animate-in fade-in zoom-in-95 duration-100">
                            <button onClick={() => { setShowOutline(!showOutline); setActiveMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-slate-50 font-semibold block flex justify-between"><span>Show Outline</span><span className="text-slate-400">{showOutline ? '☑' : '☐'}</span></button>
                            <button onClick={() => { setIsAiCollapsed(!isAiCollapsed); setActiveMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-slate-50 font-semibold block flex justify-between"><span>Show AI Copilot</span><span className="text-slate-400">{!isAiCollapsed ? '☑' : '☐'}</span></button>
                            <div className="h-[1px] bg-slate-100 my-1" />
                            <div className="px-4 py-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-wider">Zoom Percentage</div>
                            {['75', '100', '125', '150'].map(z => (
                              <button key={z} onClick={() => { setZoomPercent(z); setActiveMenu(null); }} className="w-full text-left px-6 py-1.5 hover:bg-slate-50 font-semibold block flex justify-between"><span>{z}%</span>{zoomPercent === z && <span className="text-blue-600">✓</span>}</button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Insert Menu */}
                      <div className="relative">
                        <button 
                          onClick={() => setActiveMenu(activeMenu === 'Insert' ? null : 'Insert')}
                          className="px-2 py-0.5 hover:bg-[#eff1f0] rounded cursor-pointer transition-colors"
                        >
                          Insert
                        </button>
                        {activeMenu === 'Insert' && (
                          <div className="absolute left-0 mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-lg py-1.5 z-50 text-xs font-medium text-slate-700 animate-in fade-in zoom-in-95 duration-100">
                            <button onClick={() => { handleInsertTable(); setActiveMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-slate-50 font-semibold block">Table (3x3)</button>
                            <button onClick={() => { handleInsertImage(); setActiveMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-slate-50 font-semibold block">Image Link</button>
                            <button onClick={() => { handleInsertLink(); setActiveMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-slate-50 font-semibold block">Hyperlink</button>
                            <div className="h-[1px] bg-slate-100 my-1" />
                            <button onClick={() => { applyStyle('insertHorizontalRule'); setActiveMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-slate-50 font-semibold block">Horizontal Line</button>
                            <button onClick={() => { applyStyle('insertHTML', '<pre class="bg-slate-900 text-slate-100 p-3 rounded-lg font-mono text-xs my-2"><code>// Code Block\n</code></pre>'); setActiveMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-slate-50 font-semibold block">Code Block</button>
                            <button onClick={() => { applyStyle('insertHTML', '<blockquote class="border-l-4 border-slate-350 pl-4 italic text-slate-550 my-2">Block Quote</blockquote>'); setActiveMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-slate-50 font-semibold block">Block Quote</button>
                          </div>
                        )}
                      </div>

                      {/* Format Menu */}
                      <div className="relative">
                        <button 
                          onClick={() => setActiveMenu(activeMenu === 'Format' ? null : 'Format')}
                          className="px-2 py-0.5 hover:bg-[#eff1f0] rounded cursor-pointer transition-colors"
                        >
                          Format
                        </button>
                        {activeMenu === 'Format' && (
                          <div className="absolute left-0 mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-lg py-1.5 z-50 text-xs font-medium text-slate-700 animate-in fade-in zoom-in-95 duration-100">
                            <button onClick={() => { applyStyle('bold'); setActiveMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-slate-50 font-semibold block flex justify-between"><span>Bold</span><span className="text-slate-400">Ctrl+B</span></button>
                            <button onClick={() => { applyStyle('italic'); setActiveMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-slate-50 font-semibold block flex justify-between"><span>Italic</span><span className="text-slate-400">Ctrl+I</span></button>
                            <button onClick={() => { applyStyle('underline'); setActiveMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-slate-50 font-semibold block flex justify-between"><span>Underline</span><span className="text-slate-400">Ctrl+U</span></button>
                            <button onClick={() => { applyStyle('strikeThrough'); setActiveMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-slate-50 font-semibold block">Strikethrough</button>
                          </div>
                        )}
                      </div>

                      {/* Close menus clicking outside */}
                      {activeMenu && (
                        <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setActiveMenu(null)} />
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Side Buttons */}
                <div className="flex items-center gap-3">
                  <button className="p-2 hover:bg-slate-100 rounded-full text-slate-650 transition-colors" title="Comment History"><MessageSquare className="h-4.5 w-4.5" /></button>
                  <button className="p-2 hover:bg-slate-100 rounded-full text-slate-650 transition-colors" title="Join a Video Call"><Video className="h-4.5 w-4.5" /></button>
                  
                  {/* Google Doc-Style Share Button (Clean Light Blue Capsule) */}
                  <button
                    onClick={() => setShowShareModal(true)}
                    className="glow-btn bg-[#c2e7ff] text-[#001d35] hover:bg-[#b3dcfa] rounded-full px-5 py-2 text-xs font-bold flex items-center gap-1.5 transition-colors border border-transparent shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
                  >
                    <Share2 className="h-4 w-4" />
                    <span>Share</span>
                  </button>
                  
                  <button
                    onClick={() => setIsAiCollapsed(!isAiCollapsed)}
                    className={`p-2 border border-transparent hover:bg-slate-100 text-slate-655 rounded-full transition-colors flex items-center justify-center shrink-0 ${
                      !isAiCollapsed ? 'bg-blue-50 text-blue-650' : ''
                    }`}
                    title={isAiCollapsed ? "Expand AI Panel" : "Collapse AI Panel"}
                  >
                    <Sparkles className="h-4.5 w-4.5" />
                  </button>

                  <div className="h-7 w-7 rounded-full bg-blue-600 border border-blue-550 flex items-center justify-center text-white font-extrabold text-xs select-none">
                    {user?.full_name?.charAt(0) || 'U'}
                  </div>
                </div>
              </div>

              {/* Formatting Toolbar Ribbon */}
              <div className="bg-[#edf2fa] border border-[#d3dbe9] rounded-full px-4 py-1 mt-2 flex items-center gap-1.5 shadow-sm text-xs text-slate-600 overflow-x-auto custom-scrollbar shrink-0 select-none">
                <button onClick={() => applyStyle('undo')} className="p-1 hover:bg-[#dbe1ec] rounded transition-colors w-7 h-7 flex items-center justify-center" title="Undo"><Undo className="h-4 w-4" /></button>
                <button onClick={() => applyStyle('redo')} className="p-1 hover:bg-[#dbe1ec] rounded transition-colors w-7 h-7 flex items-center justify-center" title="Redo"><Redo className="h-4 w-4" /></button>
                <button onClick={() => window.print()} className="p-1 hover:bg-[#dbe1ec] rounded transition-colors w-7 h-7 flex items-center justify-center" title="Print"><Printer className="h-4 w-4" /></button>
                <div className="h-4 w-[1px] bg-[#d3dbe9] mx-1" />
                
                {/* Zoom Selector */}
                <select 
                  value={zoomPercent} 
                  onChange={(e) => setZoomPercent(e.target.value)}
                  className="bg-transparent border-none py-0.5 pl-1 pr-4 focus:outline-none focus:ring-0 text-[11px] font-semibold text-slate-700 cursor-pointer hover:bg-[#dbe1ec] rounded transition-colors"
                >
                  <option value="75">75%</option>
                  <option value="100">100%</option>
                  <option value="125">125%</option>
                  <option value="150">150%</option>
                </select>
                <div className="h-4 w-[1px] bg-[#d3dbe9] mx-1" />

                {/* Paragraph styles */}
                <select 
                  onChange={(e) => {
                    if (e.target.value === 'p') {
                      applyStyle('formatBlock', '<p>');
                    } else {
                      applyStyle('formatBlock', `<${e.target.value}>`);
                    }
                    e.target.value = '';
                  }}
                  defaultValue=""
                  className="bg-transparent border-none py-0.5 pl-1 pr-4 focus:outline-none focus:ring-0 text-[11px] font-semibold text-slate-700 cursor-pointer hover:bg-[#dbe1ec] rounded transition-colors w-24"
                >
                  <option value="" disabled>Normal text</option>
                  <option value="p">Paragraph</option>
                  <option value="h1">Heading 1</option>
                  <option value="h2">Heading 2</option>
                  <option value="h3">Heading 3</option>
                </select>
                <div className="h-4 w-[1px] bg-[#d3dbe9] mx-1" />

                {/* Font selector placeholder */}
                <span className="px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-[#dbe1ec] rounded transition-colors cursor-default">Arial</span>
                <div className="h-4 w-[1px] bg-[#d3dbe9] mx-1" />

                {/* Formatting */}
                <button onClick={() => applyStyle('bold')} className="p-1 hover:bg-[#dbe1ec] rounded transition-colors w-7 h-7 flex items-center justify-center font-extrabold text-xs" title="Bold">B</button>
                <button onClick={() => applyStyle('italic')} className="p-1 hover:bg-[#dbe1ec] rounded transition-colors w-7 h-7 flex items-center justify-center italic font-bold text-xs" title="Italic">I</button>
                <button onClick={() => applyStyle('underline')} className="p-1 hover:bg-[#dbe1ec] rounded transition-colors w-7 h-7 flex items-center justify-center underline font-bold text-xs" title="Underline">U</button>
                <button onClick={() => applyStyle('strikeThrough')} className="p-1 hover:bg-[#dbe1ec] rounded transition-colors w-7 h-7 flex items-center justify-center line-through font-bold text-xs" title="Strikethrough">S</button>
                <div className="h-4 w-[1px] bg-[#d3dbe9] mx-1" />

                {/* Alignment */}
                <button onClick={() => applyStyle('justifyLeft')} className="p-1 hover:bg-[#dbe1ec] rounded transition-colors w-7 h-7 flex items-center justify-center" title="Align Left"><AlignLeft className="h-3.5 w-3.5" /></button>
                <button onClick={() => applyStyle('justifyCenter')} className="p-1 hover:bg-[#dbe1ec] rounded transition-colors w-7 h-7 flex items-center justify-center" title="Align Center"><AlignCenter className="h-3.5 w-3.5" /></button>
                <button onClick={() => applyStyle('justifyRight')} className="p-1 hover:bg-[#dbe1ec] rounded transition-colors w-7 h-7 flex items-center justify-center" title="Align Right"><AlignRight className="h-3.5 w-3.5" /></button>
                <button onClick={() => applyStyle('justifyFull')} className="p-1 hover:bg-[#dbe1ec] rounded transition-colors w-7 h-7 flex items-center justify-center" title="Justify"><AlignJustify className="h-3.5 w-3.5" /></button>
                <div className="h-4 w-[1px] bg-[#d3dbe9] mx-1" />

                {/* Lists & Checklist */}
                <button onClick={() => applyStyle('insertUnorderedList')} className="p-1 hover:bg-[#dbe1ec] rounded transition-colors w-7 h-7 flex items-center justify-center" title="Bulleted List"><List className="h-3.5 w-3.5" /></button>
                <button onClick={() => applyStyle('insertOrderedList')} className="p-1 hover:bg-[#dbe1ec] rounded transition-colors w-7 h-7 flex items-center justify-center" title="Numbered List"><ListOrdered className="h-3.5 w-3.5" /></button>
                <button onClick={() => applyStyle('insertUnorderedList')} className="p-1 hover:bg-[#dbe1ec] rounded transition-colors text-[10px] font-extrabold px-1.5 h-7 flex items-center justify-center" title="Checklist">☑</button>
                <div className="h-4 w-[1px] bg-[#d3dbe9] mx-1" />

                {/* Insert options */}
                <button onClick={() => handleInsertTable()} className="p-1 hover:bg-[#dbe1ec] rounded transition-colors text-[11px] font-bold px-1.5 h-7 flex items-center justify-center" title="Insert 3x3 Table">Table</button>
                <button onClick={handleInsertLink} className="p-1 hover:bg-[#dbe1ec] rounded transition-colors w-7 h-7 flex items-center justify-center" title="Insert Link"><Link2 className="h-3.5 w-3.5" /></button>
                <button onClick={handleInsertImage} className="p-1 hover:bg-[#dbe1ec] rounded transition-colors w-7 h-7 flex items-center justify-center" title="Insert Image"><ImageIcon className="h-3.5 w-3.5" /></button>
                <button onClick={() => applyStyle('insertHTML', '😊')} className="p-1 hover:bg-[#dbe1ec] rounded transition-colors w-7 h-7 flex items-center justify-center" title="Insert Emoji"><Smile className="h-3.5 w-3.5" /></button>
                <div className="h-4 w-[1px] bg-[#d3dbe9] mx-1" />

                {/* Find and Replace Toggle */}
                <button 
                  onClick={() => setShowFindReplace(prev => !prev)}
                  className={`p-1 hover:bg-[#dbe1ec] rounded transition-colors text-[10px] font-extrabold px-1.5 h-7 flex items-center justify-center ${showFindReplace ? 'bg-[#c2e7ff] text-blue-800' : ''}`} 
                  title="Find and Replace"
                >
                  🔍 Find
                </button>
                
                {/* Auto save save button */}
                <button 
                  onClick={() => handleSaveDocumentContent()}
                  className="glow-btn inline-flex items-center gap-1 bg-[#1a73e8] hover:bg-blue-700 text-white rounded px-2.5 py-1 text-[10px] font-bold transition-all ml-auto shadow-sm"
                  title="Commit draft to database"
                >
                  <Save className="h-3 w-3" />
                  <span>Save</span>
                </button>
              </div>
            </header>

            {/* Find & Replace banner */}
            {showFindReplace && (
              <div className="bg-[#edf2fa] px-6 py-2 border-b border-[#d3dbe9] flex items-center gap-4 shrink-0 select-none relative z-20">
                <form onSubmit={handleFindReplace} className="flex items-center gap-3 w-full max-w-lg">
                  <input 
                    type="text" 
                    placeholder="Find text..." 
                    value={findText} 
                    onChange={(e) => setFindText(e.target.value)} 
                    className="bg-white border border-[#c0c7d5] rounded-md px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500 text-slate-800 flex-1"
                  />
                  <input 
                    type="text" 
                    placeholder="Replace with..." 
                    value={replaceText} 
                    onChange={(e) => setReplaceText(e.target.value)} 
                    className="bg-white border border-[#c0c7d5] rounded-md px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500 text-slate-800 flex-1"
                  />
                  <button type="submit" className="bg-[#1a73e8] hover:bg-blue-700 text-white rounded-md px-4 py-1.5 text-xs font-bold shadow-sm transition-colors">Replace All</button>
                  <button type="button" onClick={() => setShowFindReplace(false)} className="text-slate-400 hover:text-slate-655 transition-colors"><X className="h-4.5 w-4.5" /></button>
                </form>
              </div>
            )}

            {/* Workspace Layout Container (Left sidebar + Editor canvas + Right AI Panel) */}
            <div className="flex-1 flex w-full overflow-hidden relative">
              
              {/* Collapsible Left Outline / "Document tabs" Sidebar */}
              {showOutline && (
                <div className="w-56 border-r border-[#e1e3e1] bg-white flex flex-col shrink-0 select-none relative z-20 animate-in slide-in-from-left duration-250">
                  {/* Header */}
                  <div className="px-4 py-3 flex items-center justify-between border-b border-slate-100">
                    <span className="text-xs font-bold text-[#444746] uppercase tracking-wider">Document tabs</span>
                    <div className="flex items-center gap-1">
                      <button className="p-1 hover:bg-slate-100 rounded text-slate-500 transition-colors"><Plus className="h-3.5 w-3.5" /></button>
                      <button 
                        onClick={() => setShowOutline(false)}
                        className="p-1 hover:bg-slate-100 rounded text-slate-500 transition-colors" 
                        title="Close Document outline"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Sidebar Content */}
                  <div className="flex-1 overflow-y-auto py-3 px-2.5 space-y-4 custom-scrollbar">
                    
                    {/* Active Tab */}
                    <div className="space-y-1">
                      <div className="bg-[#e8f0fe] text-[#1a73e8] flex items-center justify-between py-2 px-3 rounded-lg text-xs font-semibold cursor-pointer shadow-sm border border-[#d3e3fd]">
                        <span className="truncate flex items-center gap-2"><FileText className="h-3.5 w-3.5 text-blue-600" /> Tab 1</span>
                        <button className="text-[#1a73e8] hover:bg-[#d3e3fd] rounded-full p-0.5 text-[10px] w-4 h-4 flex items-center justify-center font-bold">⋮</button>
                      </div>
                    </div>

                    {/* Outline Headings Section */}
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block px-1">Outline</span>
                      
                      <div className="space-y-1">
                        {getHeadings().length > 0 ? (
                          getHeadings().map((h, index) => (
                            <button
                              key={h.id}
                              onClick={() => scrollToHeading(index)}
                              style={{ paddingLeft: `${h.tag === 'h1' ? 8 : h.tag === 'h2' ? 18 : h.tag === 'h3' ? 28 : 38}px` }}
                              className="w-full text-left py-1.5 pr-2 rounded text-[11px] font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors block truncate"
                            >
                              {h.text}
                            </button>
                          ))
                        ) : (
                          <p className="text-[10px] leading-relaxed text-slate-450 italic px-1 font-medium">
                            Headings that you add to the document will appear here.
                          </p>
                        )}
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {/* Collapsed outline show trigger button */}
              {!showOutline && (
                <button
                  onClick={() => setShowOutline(true)}
                  className="absolute left-3 top-4 z-40 bg-white border border-slate-200 hover:bg-slate-50 rounded-full w-8 h-8 flex items-center justify-center shadow-md text-slate-600 transition-all hover:scale-105"
                  title="Show Document Outline"
                >
                  <ChevronRight className="h-4.5 w-4.5" />
                </button>
              )}

              {/* CENTER PANEL (Editor Canvas) */}
              <main className="flex-1 bg-[#f4f7f6] flex flex-col h-full overflow-hidden relative">
                
                {/* Horizontal Ruler */}
                <div className="h-6 bg-[#f4f7f6] border-b border-[#e1e3e1] flex items-center justify-center shrink-0 select-none relative">
                  <div className="w-full max-w-[1240px] px-16 flex items-center relative text-[9px] text-slate-400 font-semibold h-full select-none">
                    <div className="absolute left-[calc(4rem+2px)] right-[calc(4rem+2px)] h-2 border-x border-slate-300 flex justify-between select-none">
                      <span className="flex-1 border-r border-slate-200/50" />
                      <span className="flex-1 border-r border-slate-200/50" />
                      <span className="flex-1 border-r border-slate-200/50" />
                      <span className="flex-1 border-r border-slate-200/50" />
                      <span className="flex-1 border-r border-slate-200/50" />
                      <span className="flex-1 border-r border-slate-200" />
                      <span className="flex-1 border-r border-slate-200/50" />
                      <span className="flex-1 border-r border-slate-200/50" />
                      <span className="flex-1 border-r border-slate-200/50" />
                      <span className="flex-1 border-r border-slate-200/50" />
                      <span className="flex-1 border-r border-slate-200/50" />
                      <span className="flex-1 border-r border-slate-200" />
                      <span className="flex-1 border-r border-slate-200/50" />
                      <span className="flex-1 border-r border-slate-200/50" />
                      <span className="flex-1 border-r border-slate-200/50" />
                      <span className="flex-1 border-r border-slate-200/50" />
                      <span className="flex-1 border-r border-slate-200/50" />
                    </div>
                    <span className="absolute left-20">1</span>
                    <span className="absolute left-40">2</span>
                    <span className="absolute left-60">3</span>
                    <span className="absolute left-80">4</span>
                    <span className="absolute left-[100px]">5</span>
                    <span className="absolute left-[120px]">6</span>
                    <span className="absolute left-[140px]">7</span>
                    <span className="absolute left-[160px]">8</span>
                    <span className="absolute left-[180px]">9</span>
                    <span className="absolute left-[200px]">10</span>
                    <span className="absolute left-[220px]">11</span>
                    <span className="absolute left-[240px]">12</span>
                    <span className="absolute left-[260px]">13</span>
                    <span className="absolute left-[280px]">14</span>
                    <span className="absolute left-[300px]">15</span>
                    <span className="absolute left-[320px]">16</span>
                    <span className="absolute left-[340px]">17</span>
                    <span className="absolute left-[360px]">18</span>
                  </div>
                </div>

                {/* Large Page Editor Canvas Container */}
                <div className="flex-1 overflow-y-auto pt-8 pb-8 px-4 flex justify-center items-start custom-scrollbar bg-[#f4f7f6]">
                  <div 
                    className="bg-white border border-[#d3dbe9] shadow-[0_1px_3px_rgba(0,0,0,0.1),_0_1px_2px_rgba(0,0,0,0.06)] min-h-[1056px] p-16 w-full max-w-[1240px] focus:outline-none transition-all relative font-sans leading-relaxed text-[#202124] text-[14.5px] cursor-text rounded-none overflow-hidden"
                    style={{ transform: `scale(${Number(zoomPercent)/100})`, transformOrigin: 'top center' }}
                    onClick={(e) => {
                      if (e.target === e.currentTarget) {
                        document.getElementById('doc-editor-body')?.focus();
                      }
                    }}
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
                      className="focus:outline-none min-h-[960px] font-sans text-[#202124] leading-relaxed text-[14.5px] w-full max-w-full break-words outline-none"
                    />
                  </div>
                </div>

                {/* Bottom Status Bar */}
                <footer className="h-9 bg-white border-t border-slate-200 px-6 flex items-center justify-between shrink-0 select-none text-[10px] text-slate-500">
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
              </main>

               {/* Collapsible Right AI Panel */}
              <aside className={`${isAiCollapsed ? 'w-0 border-none' : 'w-[20%] border-l border-[#e1e3e1]'} flex flex-col h-full bg-white shrink-0 select-none transition-all duration-300 overflow-hidden relative z-20`}>
                <div className="flex border-b border-slate-200 shrink-0 bg-slate-50/20">
                  <button
                    onClick={() => setRightPanelTab('summary')}
                    className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-wider transition-all border-b-2 ${
                      rightPanelTab === 'summary' 
                        ? 'border-blue-600 text-blue-600 bg-white' 
                        : 'border-transparent text-slate-400 hover:text-slate-800'
                    }`}
                  >
                    Summary
                  </button>
                  <button
                    onClick={() => setRightPanelTab('ai')}
                    className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-wider transition-all border-b-2 ${
                      rightPanelTab === 'ai' 
                        ? 'border-blue-600 text-blue-600 bg-white' 
                        : 'border-transparent text-slate-400 hover:text-slate-800'
                    }`}
                  >
                    AI Copilot
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

                {rightPanelTab === 'summary' && (
                  <div className="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar">
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-extrabold text-slate-450 uppercase tracking-widest flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                        <span>Executive Summary</span>
                      </h4>
                      <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 text-xs text-slate-655 leading-relaxed font-sans shadow-sm">
                        {selectedDoc.ai_summary || "Uploading document automatically processes text indexes to synthesize executive summaries..."}
                      </div>
                    </div>

                    {selectedDoc.ai_keywords && selectedDoc.ai_keywords.length > 0 && (
                      <div className="space-y-2 pt-1">
                        <span className="text-[10px] font-extrabold text-slate-450 uppercase tracking-widest block">Suggested Tags</span>
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

                    <div className="space-y-2 pt-4 border-t border-slate-100">
                      <span className="text-[10px] font-extrabold text-slate-450 uppercase tracking-widest block">Related Documents</span>
                      <div className="space-y-2">
                        {(() => {
                          const categoryDocs = allDocs?.filter((d: any) => d.id !== selectedDoc.id && d.category === selectedDoc.category) || [];
                          const displayDocs = categoryDocs.length > 0 
                            ? categoryDocs.slice(0, 2) 
                            : (allDocs?.filter((d: any) => d.id !== selectedDoc.id).slice(0, 2) || []);
                          
                          return displayDocs.map((d: any) => (
                            <button
                              key={d.id}
                              onClick={() => setSelectedDocId(d.id)}
                              className="w-full text-left p-3 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all flex items-center justify-between group bg-slate-50/50"
                            >
                              <div className="min-w-0 pr-4">
                                <span className="font-bold text-slate-800 text-xs truncate block">{d.name}</span>
                                <span className="text-[9px] text-slate-455 block mt-0.5 uppercase tracking-wider">{d.category || 'Company Knowledge'}</span>
                              </div>
                              <ArrowRight className="h-3.5 w-3.5 text-slate-455 group-hover:text-blue-600 transition-colors" />
                            </button>
                          ));
                        })()}
                      </div>
                    </div>
                  </div>
                )}

                {rightPanelTab === 'ai' && (
                  <div className="flex-1 flex flex-col overflow-hidden p-4">
                    <div className="grid grid-cols-2 gap-1.5 pb-3 border-b border-slate-100 shrink-0 select-none">
                      {['Summarize', 'Rewrite', 'Improve Writing', 'Explain', 'Translate', 'Generate Notes'].map((act) => (
                        <button
                          key={act}
                          onClick={() => triggerAIShortcut(act)}
                          className="bg-slate-50 hover:bg-blue-50/50 hover:text-blue-600 border border-slate-200/80 hover:border-blue-200 rounded-lg py-1.5 text-[9px] font-extrabold text-slate-650 transition-all text-center uppercase tracking-wider shadow-sm flex items-center justify-center"
                        >
                          {act}
                        </button>
                      ))}
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-3.5 py-4 pr-1 custom-scrollbar">
                      {docChatHistory.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 text-xs py-8 px-2">
                          <HelpCircle className="h-6 w-6 text-slate-200 mb-1" />
                          <p className="max-w-sm text-[10px] font-bold uppercase tracking-wider mb-1">Interactive Assistant</p>
                          <p className="max-w-[180px] text-[10px] leading-normal text-slate-455 font-semibold">Ask about the document body or use shortcuts to rewrite sentences.</p>
                        </div>
                      ) : (
                        docChatHistory.map((chat, idx) => (
                          <div key={idx} className="space-y-2">
                            <div className="flex justify-end">
                              <div className="bg-slate-100 border border-slate-200 rounded-2xl px-3.5 py-2 text-xs text-slate-800 max-w-[85%] font-medium leading-relaxed shadow-sm">
                                {chat.q}
                              </div>
                            </div>
                            <div className="flex justify-start">
                              <div className="bg-blue-50/50 border border-blue-100 rounded-2xl px-3.5 py-2 text-xs text-slate-850 max-w-[90%] leading-relaxed shadow-sm space-y-2">
                                <p className="font-semibold">{chat.a}</p>
                                <div className="flex gap-2 pt-1">
                                  <button 
                                    onClick={() => navigator.clipboard.writeText(chat.a)}
                                    className="text-[9px] text-blue-600 font-bold hover:underline"
                                  >
                                    Copy
                                  </button>
                                  <button 
                                    onClick={() => {
                                      applyStyle('insertHTML', `<p>${chat.a}</p>`);
                                    }}
                                    className="text-[9px] text-blue-655 font-bold hover:underline"
                                  >
                                    Insert
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    <form onSubmit={handleAskDocAI} className="mt-auto pt-3 border-t border-slate-100 flex items-center gap-2 select-none">
                      <input 
                        type="text" 
                        value={docAiQuestion}
                        onChange={(e) => setDocAiQuestion(e.target.value)}
                        placeholder="Ask about this document..."
                        disabled={docAiLoading}
                        className="w-full bg-slate-50 border border-[#e1e3e1] rounded-xl p-2.5 text-xs focus:outline-none focus:bg-white focus:border-blue-500 text-slate-800"
                      />
                      <button 
                        type="submit" 
                        disabled={docAiLoading}
                        className="h-8.5 w-8.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center shrink-0 transition-colors shadow-sm"
                      >
                        {docAiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      </button>
                    </form>
                  </div>
                )}

                {rightPanelTab === 'versions' && (
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                    {docVersions && docVersions.length > 0 ? (
                      <div className="space-y-3.5">
                        {docVersions.map((v: any, idx: number) => (
                          <div key={v.id} className="p-3 border border-slate-200 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-colors relative">
                            <div className="flex justify-between items-start">
                              <span className="font-bold text-slate-850 text-xs">Version v{v.version_number}</span>
                              <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100 uppercase tracking-wider">
                                {idx === 0 ? 'Current' : 'Archive'}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-455 mt-1">{v.change_summary || 'No changelog description added.'}</p>
                            <div className="flex justify-between items-center mt-3 pt-2.5 border-t border-slate-100 text-[9px] text-slate-400">
                              <span>By {v.created_by?.full_name || 'System Admin'}</span>
                              <span>{new Date(v.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        ))}
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
            </div>
          </div>
        ) : null
      ) : (
        <main className="flex-1 bg-slate-50 flex flex-col h-full overflow-hidden relative items-center justify-center p-8 text-center select-none">
          <div className="max-w-sm space-y-4 flex flex-col items-center">
            <div className="h-16 w-16 bg-blue-50 border border-blue-100 text-blue-600 rounded-2xl flex items-center justify-center shadow-sm">
              <FileText className="h-8 w-8" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm">No Document Open</h3>
              <p className="text-[11px] text-slate-455 mt-1.5 leading-relaxed">
                Select a document from the left directory catalog tree, or create a new document to start drafting.
              </p>
            </div>
            <button
              onClick={() => handleCreateNewBlankDocument(null, "New Document")}
              className="glow-btn inline-flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition-all border border-blue-500"
            >
              <Plus className="h-4 w-4" />
              <span>Create New Document</span>
            </button>
          </div>
        </main>
      )}

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

      <ShareModal
        showShareModal={showShareModal}
        setShowShareModal={setShowShareModal}
        selectedDoc={selectedDoc}
        shareUserId={shareUserId}
        setShareUserId={setShareUserId}
        shareDeptId={shareDeptId}
        setShareDeptId={setShareDeptId}
        shareAccessType={shareAccessType}
        setShareAccessType={setShareAccessType}
        systemUsers={systemUsers}
        systemDepts={systemDepts}
        currentUser={user}
        docPermissions={docPermissions}
        handleGrantPermission={handleGrantPermission}
        handleRevokePermission={handleRevokePermission}
        handleCopyShareLink={handleCopyShareLink}
        linkCopied={linkCopied}
      />

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
      <UploadModal
        showUpload={showUpload}
        setShowUpload={setShowUpload}
        uploadFile={uploadFile}
        setUploadFile={setUploadFile}
        uploadName={uploadName}
        setUploadName={setUploadName}
        uploadDesc={uploadDesc}
        setUploadDesc={setUploadDesc}
        uploadCat={uploadCat}
        setUploadCat={setUploadCat}
        uploadAccess={uploadAccess}
        setUploadAccess={setUploadAccess}
        onSubmit={handleUploadDocument}
      />
    </div>
  );
}
