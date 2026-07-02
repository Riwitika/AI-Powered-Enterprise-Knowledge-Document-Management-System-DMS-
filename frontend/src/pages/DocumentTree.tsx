import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { 
  Folder, 
  FolderPlus, 
  File, 
  Upload, 
  ChevronRight, 
  ChevronDown, 
  Download, 
  Trash2, 
  Send,
  Loader2,
  FileCode,
  Tag,
  Search,
  FileText,
  FileSpreadsheet,
  FileImage,
  Sparkles,
  Layers,
  HelpCircle,
  FolderOpen
} from 'lucide-react';

export default function DocumentTree() {
  const queryClient = useQueryClient();
  
  // States
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

  // AI chat states
  const [aiQuestion, setAiQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ q: string; a: string }>>([]);
  const [aiLoading, setAiLoading] = useState(false);

  // Queries
  const { data: folderTree, isLoading: treeLoading } = useQuery({
    queryKey: ['folder-tree'],
    queryFn: api.folders.tree
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
    if (!selectedDocId || !aiQuestion.trim()) return;
    
    const q = aiQuestion;
    setAiQuestion('');
    setAiLoading(true);
    setChatHistory(prev => [...prev, { q, a: 'Thinking...' }]);
    
    try {
      const res = await api.ai.askDoc(selectedDocId, q);
      setChatHistory(prev => {
        const history = [...prev];
        if (history.length > 0) {
          history[history.length - 1].a = res.answer;
        }
        return history;
      });
    } catch (err: any) {
      setChatHistory(prev => {
        const history = [...prev];
        if (history.length > 0) {
          history[history.length - 1].a = `Error: ${err?.message || 'Failed to get answer'}`;
        }
        return history;
      });
    } finally {
      setAiLoading(false);
    }
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
    if (['jpg', 'jpeg', 'png', 'svg', 'webp'].includes(ext)) {
      return { Icon: FileImage, color: 'text-pink-650 bg-pink-50 border-pink-100' };
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
                    setChatHistory([]);
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-140px)] relative">
      
      {/* Left panel: Expandable Folder Tree */}
      <div className="glass-card rounded-xl p-5 flex flex-col h-full overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 mb-3.5 shrink-0">
          <div className="flex items-center gap-2">
            <FolderOpen className="h-4.5 w-4.5 text-blue-600" />
            <h2 className="font-extrabold text-slate-800 text-sm">Workspace Files</h2>
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

        {/* Tree search filter */}
        <div className="relative mb-3 shrink-0">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={treeSearchQuery}
            onChange={(e) => setTreeSearchQuery(e.target.value)}
            placeholder="Filter folders and files..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-xs focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder-slate-400 text-slate-800"
          />
        </div>

        {/* Tree Container */}
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

      {/* Right panel: Details + AI Scoped Chat */}
      <div className="lg:col-span-2 flex flex-col h-full overflow-hidden">
        {selectedDocId ? (
          docLoading ? (
            <div className="flex flex-1 items-center justify-center glass-card rounded-xl">
              <div className="text-center space-y-3">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Retrieving metadata...</p>
              </div>
            </div>
          ) : selectedDoc ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 overflow-hidden h-full">
              
              {/* Document Metadata & Versioning */}
              <div className="glass-card rounded-xl p-5 flex flex-col overflow-y-auto h-full space-y-5 custom-scrollbar">
                <div>
                  <div className="flex justify-between items-start gap-4">
                    <h2 className="text-base font-extrabold text-slate-900 leading-snug">{selectedDoc.name}</h2>
                    <span className="rounded bg-blue-50 border border-blue-100 px-2 py-0.5 text-[9px] font-mono font-bold text-blue-700 uppercase tracking-widest shrink-0">
                      v{selectedDoc.current_version}
                    </span>
                  </div>
                  <p className="text-[9px] text-slate-400 mt-1 uppercase font-bold tracking-widest">
                    {selectedDoc.file_type} File • {selectedDoc.category || 'No Category'}
                  </p>
                  
                  {selectedDoc.description && (
                    <p className="text-xs text-slate-600 bg-slate-50 border border-slate-200/60 p-3 rounded-lg mt-3.5 leading-relaxed">
                      {selectedDoc.description}
                    </p>
                  )}
                </div>

                {/* AI generated elements */}
                <div className="space-y-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-bold">AI Abstract Summary</span>
                  <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-xl text-xs leading-relaxed text-slate-700">
                    {selectedDoc.ai_summary || (
                      <span className="text-slate-400 flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-blue-600" /> 
                        <span>Synthesizing abstract summary...</span>
                      </span>
                    )}
                  </div>
                  {selectedDoc.ai_keywords && selectedDoc.ai_keywords.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {selectedDoc.ai_keywords.map((kw: string) => (
                        <span key={kw} className="inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-[10px] font-medium text-slate-600">
                          <Tag className="h-3 w-3 text-slate-400" /> {kw}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Version Controls */}
                <div className="border-t border-slate-200 pt-4 space-y-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-bold">Version Registry</span>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1 custom-scrollbar">
                    {docVersions?.map((ver: any) => (
                      <div key={ver.id} className="flex justify-between items-center text-[10px] p-2 bg-slate-50 rounded-lg border border-slate-200/60">
                        <div className="flex items-center gap-2">
                          <Layers className="h-3.5 w-3.5 text-slate-400" />
                          <span className="font-bold text-slate-700">Version {ver.version_number}</span>
                          <span className="text-slate-400">{new Date(ver.uploaded_at).toLocaleDateString()}</span>
                        </div>
                        {ver.version_number === selectedDoc.current_version && (
                          <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[8px] font-extrabold text-emerald-700 uppercase tracking-wider">
                            Active
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {/* Upload new version */}
                  <label className="flex items-center justify-center gap-1.5 border border-dashed border-slate-350 rounded-lg p-3 text-xs text-slate-500 hover:text-slate-750 hover:bg-slate-100/70 hover:border-slate-400 cursor-pointer transition-colors">
                    <Upload className="h-4 w-4 text-slate-400" />
                    <span className="font-bold text-xs">Upload New Revision</span>
                    <input 
                      type="file" 
                      onChange={handleNewVersionUpload}
                      className="hidden" 
                    />
                  </label>
                </div>

                {/* Document level Actions */}
                <div className="border-t border-slate-200 pt-4 flex gap-3 mt-auto shrink-0">
                  <button 
                    onClick={() => handleDownload(selectedDoc)}
                    className="flex-1 flex items-center justify-center gap-1.5 border border-slate-200 hover:border-slate-350 hover:bg-slate-50 rounded-lg py-2.5 text-xs font-bold text-slate-700 transition-colors"
                  >
                    <Download className="h-4 w-4" /> Download File
                  </button>
                  <button 
                    onClick={() => deleteDocMutation.mutate(selectedDoc.id)}
                    className="flex items-center justify-center border border-red-200 hover:bg-red-50 text-red-600 rounded-lg p-2.5 text-xs transition-colors"
                    title="Delete File"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Document Scoped AI Chat */}
              <div className="glass-card rounded-xl flex flex-col overflow-hidden h-full">
                <div className="border-b border-slate-200 bg-slate-50 p-4 shrink-0 flex items-center gap-2.5">
                  <div className="h-8 w-8 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                    <FileCode className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-xs tracking-tight">Ask Document AI</h3>
                    <p className="text-[10px] text-slate-400 font-medium">Restricted exclusively to this document scope.</p>
                  </div>
                </div>

                {/* Messages Panel */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                  {chatHistory.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center text-slate-450 text-xs px-6 py-12 space-y-3">
                      <HelpCircle className="h-9 w-9 text-slate-200" />
                      <p className="max-w-xs font-medium text-slate-400">Ask any question to extract details, summarize clauses, or query figures in this document.</p>
                    </div>
                  ) : (
                    chatHistory.map((chat, idx) => (
                      <div key={idx} className="space-y-2">
                        {/* User Question */}
                        <div className="bg-blue-600 text-white p-3 rounded-2xl rounded-tr-none text-xs max-w-[85%] ml-auto w-fit shadow-sm font-semibold">
                          {chat.q}
                        </div>
                        {/* AI Answer */}
                        <div className="bg-slate-100 border border-slate-200/60 text-slate-700 p-3 rounded-2xl rounded-tl-none text-xs max-w-[85%] mr-auto w-fit leading-relaxed">
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

                {/* Question Input */}
                <form onSubmit={handleAskDocAI} className="border-t border-slate-200 p-3 flex gap-2 bg-slate-50 shrink-0">
                  <input
                    type="text"
                    value={aiQuestion}
                    onChange={(e) => setAiQuestion(e.target.value)}
                    placeholder="Ask doc contents..."
                    disabled={aiLoading}
                    className="flex-1 bg-white border border-slate-250 rounded-lg px-4 py-2 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder-slate-400 text-slate-800"
                  />
                  <button
                    type="submit"
                    disabled={aiLoading || !aiQuestion.trim()}
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg p-2.5 disabled:opacity-50 transition-colors"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              </div>
            </div>
          ) : null
        ) : (
          <div className="flex flex-1 items-center justify-center border border-dashed border-slate-300 rounded-xl bg-white h-full p-8 text-center text-slate-400 flex-col space-y-3">
            <Sparkles className="h-10 w-10 text-slate-300" />
            <h3 className="font-bold text-slate-700 text-sm">No Document Selected</h3>
            <p className="max-w-xs text-xs text-slate-400">Choose a document node from the folder catalog tree to examine metadata properties and engage in scoped RAG chat.</p>
          </div>
        )}
      </div>

      {/* New Folder Modal */}
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
