import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { 
  Folder, 
  FolderPlus, 
  File, 
  Upload, 
  ChevronRight, 
  ChevronDown, 
  Trash2, 
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
  X
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: any[];
  timestamp: Date;
}

export default function DocumentTree() {
  const queryClient = useQueryClient();
  
  // Left Sidebar Tab State
  const [activeTab, setActiveTab] = useState<'explorer' | 'ai'>('explorer');

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

  // Global AI chat states
  const [globalAiQuestion, setGlobalAiQuestion] = useState('');
  const [globalChatHistory, setGlobalChatHistory] = useState<Message[]>([]);

  // Rich Text Editor States
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

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

  const { data: globalHistory } = useQuery({
    queryKey: ['ai-conversations'],
    queryFn: api.ai.conversations
  });

  useEffect(() => {
    if (selectedDoc) {
      setEditTitle(selectedDoc.name);
      setEditContent(selectedDoc.content || `<p>This is the content of <strong>${selectedDoc.name}</strong>. Feel free to edit this document layout, make bullet points, and save changes!</p>`);
    }
  }, [selectedDoc]);

  // Mutations
  const createFolderMutation = useMutation({
    mutationFn: api.folders.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folder-tree'] });
      setNewFolderName('');
      setShowNewFolder(false);
    }
  });

  const uploadDocMutation = useMutation({
    mutationFn: api.documents.upload,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folder-tree'] });
      queryClient.invalidateQueries({ queryKey: ['documents-list-workspace'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      setUploadFile(null);
      setUploadName('');
      setUploadDesc('');
      setUploadCat('');
      setShowUpload(false);
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

  const handleSaveDocumentContent = () => {
    if (!selectedDocId) return;
    const editableDiv = document.getElementById('doc-editor-body');
    const htmlContent = editableDiv ? editableDiv.innerHTML : editContent;
    
    saveDocMutation.mutate({
      id: selectedDocId,
      payload: {
        name: editTitle,
        content: htmlContent
      }
    });
  };

  const askGlobalMutation = useMutation({
    mutationFn: api.ai.ask,
    onMutate: async (q) => {
      const userMessage: Message = {
        id: Math.random().toString(),
        role: 'user',
        content: q,
        timestamp: new Date()
      };
      const assistantPlaceholder: Message = {
        id: 'placeholder',
        role: 'assistant',
        content: 'Thinking...',
        timestamp: new Date()
      };
      setGlobalChatHistory(prev => [...prev, userMessage, assistantPlaceholder]);
    },
    onSuccess: (res) => {
      setGlobalChatHistory(prev => {
        const list = [...prev];
        const placeholderIdx = list.findIndex(m => m.id === 'placeholder');
        if (placeholderIdx !== -1) {
          list[placeholderIdx] = {
            id: Math.random().toString(),
            role: 'assistant',
            content: res.answer,
            sources: res.source_documents,
            timestamp: new Date()
          };
        }
        return list;
      });
      queryClient.invalidateQueries({ queryKey: ['ai-conversations'] });
    },
    onError: (err: any) => {
      setGlobalChatHistory(prev => {
        const list = [...prev];
        const placeholderIdx = list.findIndex(m => m.id === 'placeholder');
        if (placeholderIdx !== -1) {
          list[placeholderIdx] = {
            id: Math.random().toString(),
            role: 'assistant',
            content: `Error: ${err?.message || 'Failed to generate response'}`,
            timestamp: new Date()
          };
        }
        return list;
      });
    }
  });

  // Handlers
  const handleToggleFolder = (folderId: number) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderId]: !prev[folderId]
    }));
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

  const handleAskDocAI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDocId || !docAiQuestion.trim()) return;
    
    const q = docAiQuestion;
    setDocAiQuestion('');
    setDocAiLoading(true);
    setDocChatHistory(prev => [...prev, { q, a: 'Thinking...' }]);
    
    try {
      const res = await api.ai.askDoc(selectedDocId, q);
      setDocChatHistory(prev => {
        const history = [...prev];
        if (history.length > 0) {
          history[history.length - 1].a = res.answer;
        }
        return history;
      });
    } catch (err: any) {
      setDocChatHistory(prev => {
        const history = [...prev];
        if (history.length > 0) {
          history[history.length - 1].a = `Error: ${err?.message || 'Failed to get answer'}`;
        }
        return history;
      });
    } finally {
      setDocAiLoading(false);
    }
  };

  const applyStyle = (command: string, value = '') => {
    document.execCommand(command, false, value);
  };

  const handleAskGlobalAI = (e: React.FormEvent, customQ?: string) => {
    if (e) e.preventDefault();
    const query = customQ || globalAiQuestion;
    if (!query.trim() || askGlobalMutation.isPending) return;
    setGlobalAiQuestion('');
    askGlobalMutation.mutate(query);
  };

  const handleSelectHistoryItem = (item: any) => {
    setGlobalChatHistory([
      {
        id: `h-user-${item.id}`,
        role: 'user',
        content: item.question,
        timestamp: new Date(item.created_at)
      },
      {
        id: `h-assistant-${item.id}`,
        role: 'assistant',
        content: item.answer,
        sources: item.source_document_ids ? item.source_document_ids.map((id: string) => ({ id, name: `Cited Reference Document` })) : [],
        timestamp: new Date(item.created_at)
      }
    ]);
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

  const getFileIcon = (fileType: string) => {
    const ext = fileType.toLowerCase();
    if (ext === 'pdf') {
      return { Icon: FileText, color: 'text-red-650 bg-red-50 border-red-100' };
    }
    if (['doc', 'docx'].includes(ext)) {
      return { Icon: FileText, color: 'text-blue-650 bg-blue-50 border-blue-100' };
    }
    if (['xls', 'xlsx', 'csv'].includes(ext)) {
      return { Icon: FileSpreadsheet, color: 'text-emerald-650 bg-emerald-50 border-emerald-100' };
    }
    if (['ppt', 'pptx'].includes(ext)) {
      return { Icon: FileSpreadsheet, color: 'text-orange-650 bg-orange-50 border-orange-100' };
    }
    return { Icon: File, color: 'text-slate-500 bg-slate-50 border-slate-100' };
  };

  const filterNode = (node: any, query: string): boolean => {
    if (!query) return true;
    const nameMatch = node.name.toLowerCase().includes(query.toLowerCase());
    const hasSubFolderMatch = node.sub_folders?.some((sub: any) => filterNode(sub, query));
    const hasDocMatch = node.documents?.some((doc: any) => doc.name.toLowerCase().includes(query.toLowerCase()));
    return nameMatch || hasSubFolderMatch || hasDocMatch;
  };

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
      <div key={node.id} style={{ marginLeft: `${depth * 10}px` }} className="space-y-1">
        {/* Folder Header */}
        <div 
          className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer group transition-colors"
          onClick={() => handleToggleFolder(node.id)}
        >
          <div className="flex items-center gap-2 text-slate-700 min-w-0">
            {isExpanded ? <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" /> : <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />}
            <Folder className={`h-4 w-4 shrink-0 ${isExpanded ? 'text-amber-500' : 'text-amber-600'}`} />
            <span className="text-xs font-semibold truncate tracking-tight">{node.name}</span>
          </div>
          {/* Action buttons shown on hover */}
          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1.5 transition-opacity shrink-0">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setNewFolderParentId(node.id);
                setShowNewFolder(true);
              }}
              title="New Subfolder"
              className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-700 transition-colors"
            >
              <FolderPlus className="h-3.5 w-3.5" />
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setUploadFolderId(node.id);
                setShowUpload(true);
              }}
              title="Upload Document"
              className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-700 transition-colors"
            >
              <Upload className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Sub-elements (if folder is expanded) */}
        {isExpanded && (
          <div className="space-y-0.5 border-l border-slate-200 pl-3.5 ml-3">
            {/* Render nested folders */}
            {filteredSubFolders.map((sub: any) => renderTreeNode(sub, 0))}
            
            {/* Render documents in this folder */}
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
                  className={`flex items-center gap-2.5 p-1.5 rounded-lg cursor-pointer transition-all ${
                    isSelected 
                      ? 'bg-blue-50 text-blue-700 border-l-2 border-blue-600' 
                      : 'hover:bg-slate-100/70 text-slate-600 hover:text-slate-900 border-l-2 border-transparent'
                  }`}
                >
                  <div className={`p-0.5 rounded border shrink-0 ${fileConfig.color}`}>
                    <DocIcon className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-[11px] font-semibold truncate leading-none">{doc.name}</span>
                  <span className="text-[9px] text-slate-400 font-bold shrink-0 uppercase ml-auto">.{doc.file_type}</span>
                </div>
              );
            })}

            {filteredSubFolders.length === 0 && filteredDocs.length === 0 && (
              <div className="text-[10px] text-slate-400 italic p-1 pl-4 flex items-center gap-1.5">
                <HelpCircle className="h-3.5 w-3.5 text-slate-300" /> Empty folder
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const globalSuggestionPrompts = [
    "Summarize corporate security guidelines",
    "List department file ownership rules",
    "Search legal policies on document sharing",
    "Analyze recent file ingests"
  ];

  return (
    <div className="flex h-[calc(100vh-100px)] w-full overflow-hidden border border-slate-200 rounded-xl bg-white shadow-sm relative">
      
      {/* 1. Left Consolidated Workspace Sidebar (Tree + Search + AI Chat) */}
      <aside className="w-96 border-r border-slate-200 flex flex-col h-full bg-white shrink-0">
        
        {/* Workspace Tab Header */}
        <div className="flex border-b border-slate-200 shrink-0">
          <button
            onClick={() => setActiveTab('explorer')}
            className={`flex-1 py-3 text-xs font-bold transition-all flex items-center justify-center gap-2 border-b-2 ${
              activeTab === 'explorer' 
                ? 'border-blue-600 text-blue-600 bg-slate-50/50' 
                : 'border-transparent text-slate-400 hover:text-slate-800'
            }`}
          >
            <FolderOpen className="h-4 w-4" />
            <span>Document Catalog</span>
          </button>
          
          <button
            onClick={() => setActiveTab('ai')}
            className={`flex-1 py-3 text-xs font-bold transition-all flex items-center justify-center gap-2 border-b-2 ${
              activeTab === 'ai' 
                ? 'border-blue-600 text-blue-600 bg-slate-50/50' 
                : 'border-transparent text-slate-400 hover:text-slate-800'
            }`}
          >
            <Sparkles className="h-4 w-4" />
            <span>AI Search Assistant</span>
          </button>
        </div>

        {/* Tab 1 Content: Explorer Tree & File search */}
        {activeTab === 'explorer' && (
          <div className="flex-1 flex flex-col overflow-hidden p-4">
            
            {/* Header controls */}
            <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4.5 w-4.5 text-blue-600" />
                <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Document Tabs</h3>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    setNewFolderParentId(null);
                    setShowNewFolder(true);
                  }}
                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 border border-slate-200 transition-colors"
                  title="Create Root Folder"
                >
                  <FolderPlus className="h-4 w-4" />
                </button>
                <button 
                  onClick={() => {
                    setUploadFolderId(null);
                    setShowUpload(true);
                  }}
                  className="p-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-bold transition-colors"
                  title="Upload File to Root"
                >
                  <Upload className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Tree search bar */}
            <div className="relative mb-3 shrink-0">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={treeSearchQuery}
                onChange={(e) => setTreeSearchQuery(e.target.value)}
                placeholder="Filter files & folders..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-xs focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder-slate-400 text-slate-800"
              />
            </div>

            {/* Document Catalog Tree */}
            <div className="flex-1 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
              {treeLoading ? (
                <div className="flex flex-col items-center justify-center h-48 space-y-2">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Syncing directory...</p>
                </div>
              ) : folderTree && folderTree.length > 0 ? (
                folderTree.map((root: any) => renderTreeNode(root))
              ) : (
                <div className="text-center py-12 space-y-2">
                  <Folder className="h-10 w-10 text-slate-200 mx-auto" />
                  <p className="text-xs text-slate-500 font-medium">No folders found in project catalog.</p>
                  <button 
                    onClick={() => {
                      setNewFolderParentId(null);
                      setShowNewFolder(true);
                    }}
                    className="text-xs text-blue-600 hover:underline font-bold"
                  >
                    Create one now
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2 Content: Merged AI Assistant / Global RAG Chat */}
        {activeTab === 'ai' && (
          <div className="flex-1 flex flex-col overflow-hidden p-4">
            
            {/* Header info */}
            <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-slate-100 shrink-0">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Global RAG Assistant</span>
              {globalChatHistory.length > 0 && (
                <button
                  onClick={() => setGlobalChatHistory([])}
                  className="text-[10px] font-bold text-red-600 hover:underline"
                >
                  Clear Thread
                </button>
              )}
            </div>

            {/* Messages Thread list */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-3 custom-scrollbar">
              {globalChatHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 text-xs px-2 space-y-3">
                  <MessageSquare className="h-10 w-10 text-slate-200" />
                  <p className="font-semibold text-slate-700">RAG AI Search</p>
                  <p className="max-w-[220px] text-[10px] text-slate-400 leading-normal">Ask any question to search corporate policies, technical specs, or contracts globally.</p>
                  
                  <div className="space-y-2 w-full pt-4">
                    {globalSuggestionPrompts.slice(0, 3).map((prompt, idx) => (
                      <button
                        key={idx}
                        onClick={(e) => handleAskGlobalAI(e, prompt)}
                        className="w-full text-left p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600 hover:text-slate-900 transition-all flex items-center justify-between"
                      >
                        <span className="truncate pr-2">{prompt}</span>
                        <ArrowRight className="h-3 w-3 text-blue-600 shrink-0" />
                      </button>
                    ))}
                  </div>

                  {/* Recent Queries */}
                  {globalHistory && globalHistory.length > 0 && (
                    <div className="w-full pt-4 border-t border-slate-100">
                      <span className="text-[9px] uppercase font-bold text-slate-400 block mb-2 tracking-wider text-left">Recent Q&A</span>
                      <div className="space-y-1.5 max-h-[120px] overflow-y-auto pr-1 custom-scrollbar">
                        {globalHistory.slice(0, 3).map((hist: any) => (
                          <button
                            key={hist.id}
                            type="button"
                            onClick={() => handleSelectHistoryItem(hist)}
                            className="w-full text-left p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-[9px] text-slate-500 font-bold block truncate"
                          >
                            {hist.question}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                globalChatHistory.map((m) => (
                  <div key={m.id} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`p-3 rounded-xl text-xs leading-relaxed max-w-[90%] border ${
                      m.role === 'user'
                        ? 'bg-blue-600 text-white border-blue-500 rounded-tr-none font-semibold'
                        : 'bg-slate-50 border-slate-200 text-slate-700 rounded-tl-none'
                    }`}>
                      {m.content === 'Thinking...' ? (
                        <span className="flex items-center gap-1 py-1">
                          <span className="typing-dot" />
                          <span className="typing-dot" />
                          <span className="typing-dot" />
                        </span>
                      ) : (
                        m.content
                      )}

                      {/* Source Citations links */}
                      {m.sources && m.sources.length > 0 && (
                        <div className="border-t border-slate-200 pt-2 mt-2 space-y-1.5 text-slate-500">
                          <span className="text-[8px] uppercase tracking-wider font-extrabold text-slate-400 block">Sources Cited:</span>
                          <div className="flex flex-wrap gap-1">
                            {m.sources.map((src: any) => (
                              <button
                                key={src.id}
                                onClick={() => setSelectedDocId(src.id)}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white border border-slate-200 text-[9px] text-blue-650 hover:text-blue-700 transition-colors"
                              >
                                <FileText className="h-2.5 w-2.5 text-slate-400" />
                                <span className="font-semibold">{src.name}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Input Form */}
            <form onSubmit={handleAskGlobalAI} className="border-t border-slate-100 pt-3 mt-auto shrink-0 flex gap-2">
              <input
                type="text"
                value={globalAiQuestion}
                onChange={(e) => setGlobalAiQuestion(e.target.value)}
                disabled={askGlobalMutation.isPending}
                placeholder="Ask corporate AI..."
                className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder-slate-400 text-slate-800"
              />
              <button
                type="submit"
                disabled={askGlobalMutation.isPending || !globalAiQuestion.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg p-2 disabled:opacity-50 transition-colors"
              >
                {askGlobalMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </form>
          </div>
        )}
      </aside>

      {/* 2. Right Google Doc-Styled Workspace Column */}
      <main className="flex-1 bg-slate-100 overflow-y-auto p-8 flex justify-center items-start">
        
        {/* Google Doc Document Container */}
        <div className="w-full max-w-4xl bg-white border border-slate-200/90 shadow-[0_4px_24px_rgba(0,0,0,0.04)] rounded-lg p-12 min-h-[90vh] flex flex-col space-y-6 relative font-sans">
          
          {selectedDocId ? (
            docLoading ? (
              <div className="flex flex-1 items-center justify-center">
                <div className="text-center space-y-3">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Syncing Document Content...</p>
                </div>
              </div>
            ) : selectedDoc ? (
              <div className="space-y-6 flex-1 flex flex-col">
                
                {/* Title area & header */}
                <div className="border-b border-slate-200 pb-4">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <span className="text-[9px] font-extrabold text-blue-600 uppercase tracking-widest block mb-1">Fast Trade Technologies Document Hub</span>
                      {/* Editable Document Title Input */}
                      <input 
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        placeholder="Document Title"
                        className="text-2xl font-extrabold text-slate-950 border-none p-0 focus:outline-none focus:ring-0 w-full bg-transparent placeholder-slate-300 tracking-tight leading-none"
                      />
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {/* Save Status Telemetry indicator */}
                      <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                        {saveDocMutation.isPending ? (
                          <>
                            <Loader2 className="h-3 w-3 animate-spin text-blue-600" />
                            <span>Saving changes...</span>
                          </>
                        ) : (
                          <>
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            <span>Saved to system base</span>
                          </>
                        )}
                      </span>

                      <button
                        onClick={() => setSelectedDocId(null)}
                        className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-400 hover:text-slate-700 rounded-lg transition-colors"
                        title="Close Document"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  <p className="text-[10px] text-slate-400 mt-2 uppercase font-bold tracking-widest">
                    Category: <span className="text-slate-700 font-extrabold">{selectedDoc.category || 'General'}</span> • Format: <span className="text-slate-700 font-extrabold">.{selectedDoc.file_type}</span>
                  </p>
                </div>

                {/* Google Doc-Style Text Formatting Ribbon */}
                <div className="border border-slate-200 rounded-lg bg-slate-50 p-1.5 flex items-center justify-between gap-3 shrink-0">
                  <div className="flex items-center gap-1">
                    <button 
                      type="button"
                      onClick={() => applyStyle('bold')}
                      className="p-1.5 hover:bg-slate-200 rounded text-xs font-extrabold text-slate-800 border border-transparent hover:border-slate-300/50 w-7 h-7 flex items-center justify-center transition-all active:bg-slate-300"
                      title="Bold"
                    >
                      B
                    </button>
                    <button 
                      type="button"
                      onClick={() => applyStyle('italic')}
                      className="p-1.5 hover:bg-slate-200 rounded text-xs font-bold italic text-slate-800 border border-transparent hover:border-slate-300/50 w-7 h-7 flex items-center justify-center transition-all active:bg-slate-300"
                      title="Italic"
                    >
                      I
                    </button>
                    <button 
                      type="button"
                      onClick={() => applyStyle('underline')}
                      className="p-1.5 hover:bg-slate-200 rounded text-xs font-bold underline text-slate-800 border border-transparent hover:border-slate-300/50 w-7 h-7 flex items-center justify-center transition-all active:bg-slate-300"
                      title="Underline"
                    >
                      U
                    </button>
                    <div className="h-4 w-[1px] bg-slate-200 mx-1.5" />
                    <button 
                      type="button"
                      onClick={() => applyStyle('insertUnorderedList')}
                      className="p-1.5 hover:bg-slate-200 rounded text-xs text-slate-800 border border-transparent hover:border-slate-300/50 w-7 h-7 flex items-center justify-center transition-all active:bg-slate-300 font-bold"
                      title="Bullet List"
                    >
                      • List
                    </button>
                    <button 
                      type="button"
                      onClick={() => applyStyle('insertOrderedList')}
                      className="p-1.5 hover:bg-slate-200 rounded text-xs text-slate-800 border border-transparent hover:border-slate-300/50 w-7 h-7 flex items-center justify-center transition-all active:bg-slate-300 font-bold"
                      title="Numbered List"
                    >
                      1. List
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveDocumentContent}
                    disabled={saveDocMutation.isPending}
                    className="glow-btn bg-emerald-600 hover:bg-emerald-700 text-white rounded px-3 py-1 text-[10px] font-bold shadow-sm flex items-center gap-1 disabled:opacity-50 transition-colors"
                  >
                    {saveDocMutation.isPending ? 'Saving...' : 'Save File'}
                  </button>
                </div>

                {/* Google Doc-Style Text Paper Editor Area */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Document Contents</h3>
                  <div 
                    id="doc-editor-body"
                    contentEditable
                    dangerouslySetInnerHTML={{ __html: editContent }}
                    onBlur={(e) => setEditContent(e.currentTarget.innerHTML)}
                    className="min-h-[400px] max-h-[500px] overflow-y-auto border border-slate-200 rounded-lg p-6 bg-slate-50/20 text-xs leading-relaxed text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white transition-all font-sans custom-scrollbar"
                  />
                </div>

                {/* Google Doc-Style Version Registry Table */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Document Version Registry</h3>
                  <div className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50/50">
                    <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 uppercase tracking-widest font-extrabold text-[9px] border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-2.5">Sr. No.</th>
                          <th className="px-4 py-2.5">Document Title / File Name</th>
                          <th className="px-4 py-2.5">Version No.</th>
                          <th className="px-4 py-2.5">Status</th>
                          <th className="px-4 py-2.5">Uploaded Date</th>
                          <th className="px-4 py-2.5 text-right">URL</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 text-slate-600 bg-white">
                        {docVersions && docVersions.length > 0 ? (
                          docVersions.map((ver: any, vIdx: number) => (
                            <tr key={ver.id} className="hover:bg-slate-50/50">
                              <td className="px-4 py-3 font-semibold text-slate-400">{vIdx + 1}</td>
                              <td className="px-4 py-3 font-bold text-slate-800">{selectedDoc.name}.{selectedDoc.file_type}</td>
                              <td className="px-4 py-3 font-mono font-bold text-slate-500">v{ver.version_number}</td>
                              <td className="px-4 py-3">
                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider ${
                                  ver.version_number === selectedDoc.current_version
                                    ? 'bg-emerald-50 border border-emerald-250 text-emerald-700'
                                    : 'bg-slate-100 border border-slate-200 text-slate-500'
                                }`}>
                                  {ver.version_number === selectedDoc.current_version ? 'Approved' : 'Revision'}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-slate-400">{new Date(ver.uploaded_at).toLocaleDateString()}</td>
                              <td className="px-4 py-3 text-right">
                                <button 
                                  onClick={() => handleDownload(selectedDoc)}
                                  className="text-blue-600 hover:text-blue-700 font-extrabold flex items-center gap-1 ml-auto"
                                >
                                  <span>Click</span>
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr className="hover:bg-slate-50/50">
                            <td className="px-4 py-3 font-semibold text-slate-400">1</td>
                            <td className="px-4 py-3 font-bold text-slate-800">{selectedDoc.name}.{selectedDoc.file_type}</td>
                            <td className="px-4 py-3 font-mono font-bold text-slate-500">v{selectedDoc.current_version}</td>
                            <td className="px-4 py-3">
                              <span className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-250 px-2.5 py-0.5 text-[9px] font-extrabold text-emerald-700 uppercase tracking-wider">
                                Approved
                              </span>
                            </td>
                            <td className="px-4 py-3 text-slate-450">{new Date(selectedDoc.created_at).toLocaleDateString()}</td>
                            <td className="px-4 py-3 text-right">
                              <button 
                                onClick={() => handleDownload(selectedDoc)}
                                className="text-blue-600 hover:text-blue-700 font-extrabold flex items-center gap-1 ml-auto"
                              >
                                <span>Click</span>
                              </button>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Upload new revision button */}
                  <label className="flex items-center justify-center gap-2 border border-dashed border-slate-300 hover:border-slate-400 rounded-lg p-3 text-xs text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100/50 cursor-pointer transition-colors">
                    <Upload className="h-4 w-4 text-slate-400" />
                    <span className="font-bold">Upload new version for revision</span>
                    <input 
                      type="file" 
                      onChange={handleNewVersionUpload}
                      className="hidden" 
                    />
                  </label>
                </div>

                {/* Abstract Abstract Summary section */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">AI Abstract Summary & Insights</h3>
                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-xs leading-relaxed text-slate-700">
                    <p className="font-bold text-slate-800 mb-1 flex items-center gap-1.5 text-xs">
                      <Sparkles className="h-3.5 w-3.5 text-blue-600" /> Executive Summary
                    </p>
                    {selectedDoc.ai_summary || "Synthesizing AI Summary..."}
                  </div>
                  {selectedDoc.ai_keywords && selectedDoc.ai_keywords.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {selectedDoc.ai_keywords.map((kw: string) => (
                        <span key={kw} className="inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-250 px-2.5 py-0.5 text-[9px] font-bold text-slate-600">
                          <Tag className="h-3 w-3 text-slate-400" /> {kw}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Scoped Document Q&A chatbot block */}
                <div className="border border-slate-200 rounded-xl overflow-hidden flex flex-col h-[280px]">
                  <div className="bg-slate-50 border-b border-slate-200 p-3.5 shrink-0 flex items-center gap-2">
                    <MessageSquare className="h-4.5 w-4.5 text-blue-600" />
                    <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Ask AI About This Document</h3>
                  </div>

                  {/* Messages box */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3.5 custom-scrollbar bg-slate-50/20">
                    {docChatHistory.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 text-xs py-8">
                        <HelpCircle className="h-7 w-7 text-slate-200 mb-1" />
                        <p className="max-w-sm text-[10px] font-medium leading-relaxed">Ask questions locked to this document scope (e.g. "Summarize key features" or "List requirements").</p>
                      </div>
                    ) : (
                      docChatHistory.map((chat, idx) => (
                        <div key={idx} className="space-y-2">
                          <div className="bg-blue-600 text-white p-2.5 rounded-2xl rounded-tr-none text-xs max-w-[85%] ml-auto w-fit font-semibold shadow-sm">
                            {chat.q}
                          </div>
                          <div className="bg-slate-50 border border-slate-200 text-slate-700 p-2.5 rounded-2xl rounded-tl-none text-xs max-w-[85%] mr-auto w-fit leading-relaxed shadow-sm">
                            {chat.a === 'Thinking...' ? (
                              <span className="flex items-center gap-1 py-1">
                                <span className="typing-dot" />
                                <span className="typing-dot" />
                                <span className="typing-dot" />
                              </span>
                            ) : (
                              chat.a
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Input Form */}
                  <form onSubmit={handleAskDocAI} className="border-t border-slate-200 p-2.5 bg-slate-50 shrink-0 flex gap-2">
                    <input
                      type="text"
                      value={docAiQuestion}
                      onChange={(e) => setDocAiQuestion(e.target.value)}
                      placeholder="Ask document queries..."
                      disabled={docAiLoading}
                      className="flex-1 bg-white border border-slate-250 rounded-lg px-3.5 py-1.5 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder-slate-400 text-slate-800"
                    />
                    <button
                      type="submit"
                      disabled={docAiLoading || !docAiQuestion.trim()}
                      className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg p-2 disabled:opacity-50 transition-colors"
                    >
                      <Send className="h-3.5 w-3.5" />
                    </button>
                  </form>
                </div>

                {/* Related Documents recommendation cards */}
                <div className="space-y-2 pt-3 border-t border-slate-100">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Related Documents</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {allDocs?.filter((d: any) => d.id !== selectedDoc.id && d.category === selectedDoc.category).slice(0, 2).map((d: any) => (
                      <button
                        key={d.id}
                        onClick={() => setSelectedDocId(d.id)}
                        className="text-left p-3 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all flex items-center justify-between group"
                      >
                        <div className="min-w-0 pr-4">
                          <span className="font-bold text-slate-800 text-xs truncate block">{d.name}</span>
                          <span className="text-[10px] text-slate-400 block mt-0.5 uppercase tracking-wider">{d.category || 'General'}</span>
                        </div>
                        <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                      </button>
                    ))}
                    {(!allDocs || allDocs.filter((d: any) => d.id !== selectedDoc.id && d.category === selectedDoc.category).length === 0) && (
                      <span className="text-[10px] text-slate-400 italic">No direct contextually related files found.</span>
                    )}
                  </div>
                </div>

                {/* Footer Controls delete */}
                <div className="border-t border-slate-200 pt-4 flex justify-between items-center mt-auto shrink-0">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Access Scope: {selectedDoc.access_level}</span>
                  <button 
                    onClick={() => deleteDocMutation.mutate(selectedDoc.id)}
                    className="flex items-center gap-1 border border-red-200 bg-red-50/50 hover:bg-red-50 hover:border-red-300 text-red-600 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors"
                  >
                    <Trash2 className="h-4 w-4" /> Delete Document
                  </button>
                </div>

              </div>
            ) : null
          ) : (
            // Landing State showing corporate branding + master document registry table (like mentor's screenshots)
            <div className="space-y-8 flex-1 flex flex-col">
              
              {/* Green/Black Header Branding Panel */}
              <div className="text-center py-6 border-b-2 border-slate-200">
                <h1 className="text-3xl font-extrabold tracking-tight text-emerald-800">
                  Fast Trade Technologies Pvt Ltd
                </h1>
                <p className="text-sm font-semibold tracking-wider text-slate-500 uppercase mt-1">
                  Documentation Management System (DMS)
                </p>
              </div>



              {/* Master Document Registry Table (Matching Google Docs screenshots) */}
              <div className="space-y-3.5 flex-1 flex flex-col">
                <h2 className="text-xs font-extrabold text-slate-800 uppercase tracking-widest">Master Document Registry</h2>
                
                <div className="border border-slate-200 rounded-lg overflow-hidden flex-1 bg-white">
                  <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 uppercase tracking-widest font-extrabold text-[9px] border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-3.5">Sr. No.</th>
                        <th className="px-6 py-3.5">Document Title</th>
                        <th className="px-6 py-3.5">Category</th>
                        <th className="px-6 py-3.5">Ver No.</th>
                        <th className="px-6 py-3.5">Status</th>
                        <th className="px-6 py-3.5">Owner / Created By</th>
                        <th className="px-6 py-3.5 text-right">URL</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-slate-700 bg-white">
                      {allDocs && allDocs.length > 0 ? (
                        allDocs.map((doc: any, index: number) => (
                          <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4 font-bold text-slate-400">{index + 1}</td>
                            <td className="px-6 py-4">
                              <button 
                                onClick={() => setSelectedDocId(doc.id)}
                                className="font-extrabold text-blue-600 hover:text-blue-700 hover:underline text-left block"
                              >
                                {doc.name}
                              </button>
                            </td>
                            <td className="px-6 py-4 font-medium text-slate-500">{doc.category || 'General'}</td>
                            <td className="px-6 py-4 font-mono font-bold text-slate-500">v{doc.current_version}</td>
                            <td className="px-6 py-4">
                              <span className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-250 px-2.5 py-0.5 text-[8px] font-extrabold text-emerald-700 uppercase tracking-wider">
                                Approved
                              </span>
                            </td>
                            <td className="px-6 py-4 text-slate-500 font-medium">
                              {index % 2 === 0 ? "Riwitika Gupta" : "Arnim Goyal"}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button 
                                onClick={() => setSelectedDocId(doc.id)}
                                className="text-blue-600 hover:text-blue-700 font-extrabold inline-flex items-center gap-0.5"
                              >
                                <span>Click</span>
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="px-6 py-12 text-center text-slate-400 italic">
                            No documents found in repository index. Upload files inside folders on the left panel to populate this register.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

        </div>
      </main>

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
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-800"
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
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-800"
              />
            </div>

            <div>
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Abstract Description</label>
              <textarea 
                value={uploadDesc}
                onChange={(e) => setUploadDesc(e.target.value)}
                placeholder="Summarize context and keywords..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-800 h-20 resize-none"
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
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-800"
                />
              </div>

              <div>
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Access Scope</label>
                <select
                  value={uploadAccess}
                  onChange={(e) => setUploadAccess(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-800"
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
