import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { 
  Loader2,
  FileText,
  Sparkles,
  MessageSquare,
  ArrowRight,
  X,
  Undo,
  Redo,
  Save,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Link2,
  Image as ImageIcon,
  Smile,
  Star,
  Cloud,
  Printer,
  ArrowLeft,
  Clock,
  Lock,
  ChevronRight,
  Grid,
  FileCode,
  Trash,
  HelpCircle,
  FileSignature,
  FileDown,
  Info,
  Mic,
  Search,
  Minus,
  CheckSquare
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

// ----------------- TYPES -----------------
interface DocEditorProps {
  selectedDocId: string;
  onBackToCatalog: () => void;
  allDocs: any[];
  refetchDocs: () => void;
}

interface Comment {
  id: string;
  author: string;
  authorEmail: string;
  content: string;
  timestamp: string;
  resolved: boolean;
  replies: Array<{
    author: string;
    content: string;
    timestamp: string;
  }>;
}

export default function DocEditor({ selectedDocId, onBackToCatalog, allDocs, refetchDocs }: DocEditorProps) {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  // ----------------- GENERAL STATES -----------------
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [zoomPercent, setZoomPercent] = useState('100');
  const [showRuler, setShowRuler] = useState(true);
  const [showPrintLayout, setShowPrintLayout] = useState(true);
  const [isFullWidth, setIsFullWidth] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  // Sidebars
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [leftTab, setLeftTab] = useState<'outline' | 'templates'>('outline');
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true);
  const [rightTab, setRightTab] = useState<'comments' | 'history' | 'ai' | 'info' | 'properties'>('comments');

  // Search & Replace
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');

  // Historic Version
  const [viewingVersion, setViewingVersion] = useState<any | null>(null);

  // Auto-Save Status State
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [lastSavedTime, setLastSavedTime] = useState<string>('');

  // Speech Recognition / Voice typing
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Drawing Canvas
  const [showDrawingModal, setShowDrawingModal] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Keyboard Shortcuts modal
  const [showShortcuts, setShowShortcuts] = useState(false);

  // Comments State (Stored in localStorage)
  const [comments, setComments] = useState<Comment[]>([]);
  const [newCommentText, setNewCommentText] = useState('');

  // ----------------- QUERIES & MUTATIONS -----------------
  const { data: selectedDoc, isLoading: docLoading, error: docError } = useQuery({
    queryKey: ['document', selectedDocId],
    queryFn: () => api.documents.get(selectedDocId),
    enabled: !!selectedDocId
  });

  const { data: docVersions, refetch: refetchVersions } = useQuery({
    queryKey: ['doc-versions', selectedDocId],
    queryFn: () => api.documents.versions(selectedDocId),
    enabled: !!selectedDocId
  });

  const { data: docPermissions } = useQuery({
    queryKey: ['doc-permissions-editor', selectedDocId],
    queryFn: () => api.permissions.list(selectedDocId),
    enabled: !!selectedDocId
  });

  const saveDocMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => api.documents.update(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['document', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['documents-list-workspace'] });
      queryClient.invalidateQueries({ queryKey: ['folders-tree'] });
      localStorage.removeItem(`doc_content_${variables.id}`);
      setSaveStatus('saved');
      setLastSavedTime(new Date().toLocaleTimeString());
      refetchDocs();
    },
    onError: () => {
      setSaveStatus('error');
    }
  });

  const createVersionMutation = useMutation({
    mutationFn: ({ id, formData }: { id: string; formData: FormData }) => api.documents.uploadVersion(id, formData),
    onSuccess: () => {
      refetchVersions();
      alert("Successfully registered new revision checkpoint version.");
    }
  });

  const submitApprovalMutation = useMutation({
    mutationFn: api.documents.submitApproval,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document', selectedDocId] });
      refetchDocs();
      alert("Submitted successfully for administrative approval.");
    }
  });

  const approveMutation = useMutation({
    mutationFn: api.documents.approve,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document', selectedDocId] });
      refetchDocs();
      alert("Document approved successfully.");
    }
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, remarks }: { id: string; remarks: string }) => api.documents.reject(id, remarks),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document', selectedDocId] });
      refetchDocs();
      alert("Document rejected.");
    }
  });

  // ----------------- RBAC PERMISSIONS -----------------
  const canEditDoc = () => {
    if (!selectedDoc || !user) return false;
    if (user.role?.name === 'super_admin' || user.role?.name === 'admin') return true;
    if (selectedDoc.owner_id === user.id || selectedDoc.owner?.id === user.id) return true;
    
    if (selectedDoc.access_level === 'edit' || selectedDoc.access_level === 'organization') return true;

    if (docPermissions && Array.isArray(docPermissions)) {
      const userHasEdit = docPermissions.some((p: any) => 
        p.access_type === 'edit' && 
        (p.user_id === user.id || p.user?.id === user.id || (user.department_id && p.department_id === user.department_id))
      );
      if (userHasEdit) return true;
    }
    return false;
  };

  const isReadOnly = viewingVersion !== null || !canEditDoc() || selectedDoc?.status === 'pending_approval';

  // ----------------- COMMENTS SYNCING -----------------
  useEffect(() => {
    if (selectedDocId) {
      const localComments = localStorage.getItem(`doc_${selectedDocId}_comments`);
      if (localComments) {
        setComments(JSON.parse(localComments));
      } else {
        // Seed default template comment if none exists
        const defaultComments: Comment[] = [
          {
            id: 'c-seed',
            author: 'System Assistant',
            authorEmail: 'assistant@enterprise.com',
            content: 'Welcome to your document workspace. You can highlight any text, insert comments, and tag collaborators here.',
            timestamp: new Date(Date.now() - 3600000).toLocaleString(),
            resolved: false,
            replies: []
          }
        ];
        setComments(defaultComments);
        localStorage.setItem(`doc_${selectedDocId}_comments`, JSON.stringify(defaultComments));
      }
    }
  }, [selectedDocId]);

  const saveComments = (updated: Comment[]) => {
    setComments(updated);
    localStorage.setItem(`doc_${selectedDocId}_comments`, JSON.stringify(updated));
  };

  const handleAddComment = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newCommentText.trim()) return;

    const newComment: Comment = {
      id: `comment-${Date.now()}`,
      author: user?.full_name || 'Anonymous User',
      authorEmail: user?.email || 'anon@company.com',
      content: newCommentText,
      timestamp: new Date().toLocaleString(),
      resolved: false,
      replies: []
    };

    const updated = [newComment, ...comments];
    saveComments(updated);
    setNewCommentText('');

    // If text was selected, highlight it as a comment anchor
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      applyStyle('insertHTML', `<span class="bg-amber-100 border-b-2 border-amber-400 py-0.5 comment-anchor cursor-pointer hover:bg-amber-200 transition-colors" data-comment-id="${newComment.id}">${selection.toString()}</span>`);
    }
  };

  const handleResolveComment = (commentId: string) => {
    const updated = comments.map(c => c.id === commentId ? { ...c, resolved: !c.resolved } : c);
    saveComments(updated);
  };

  const handleDeleteComment = (commentId: string) => {
    const updated = comments.filter(c => c.id !== commentId);
    saveComments(updated);
    
    // Remove highlight anchor
    const editor = document.getElementById('doc-editor-body');
    if (editor) {
      const anchors = editor.querySelectorAll(`[data-comment-id="${commentId}"]`);
      anchors.forEach(anch => {
        const textNode = document.createTextNode(anch.textContent || '');
        anch.parentNode?.replaceChild(textNode, anch);
      });
      const html = editor.innerHTML;
      setEditContent(html);
      updateCounts(html);
      handleSaveDocumentContent(html);
    }
  };

  const handleReplyComment = (commentId: string, replyText: string) => {
    if (!replyText.trim()) return;
    const updated = comments.map(c => {
      if (c.id === commentId) {
        return {
          ...c,
          replies: [...c.replies, {
            author: user?.full_name || 'Anonymous User',
            content: replyText,
            timestamp: new Date().toLocaleString()
          }]
        };
      }
      return c;
    });
    saveComments(updated);
  };

  // ----------------- DOCUMENT FORMATTING & HELPERS -----------------
  const applyStyle = (command: string, value = '') => {
    if (isReadOnly) return;
    document.execCommand(command, false, value);
    const editor = document.getElementById('doc-editor-body');
    if (editor) {
      const html = editor.innerHTML;
      setEditContent(html);
      updateCounts(html);
      // Trigger instant autosave draft caching
      localStorage.setItem(`doc_content_${selectedDocId}`, html);
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
        el.id = id;
      }
      list.push({
        text: el.textContent || '',
        tag: el.tagName.toLowerCase(),
        id
      });
    });
    return list;
  };

  const scrollToHeading = (id: string) => {
    const editor = document.getElementById('doc-editor-body');
    if (editor) {
      const target = editor.querySelector(`#${id}`);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(target);
        range.collapse(false);
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    }
  };

  // ----------------- AUTOSAVE ENGINE -----------------
  const handleSaveDocumentContent = (customHtml?: string) => {
    if (!selectedDocId || isReadOnly) return;
    setSaveStatus('saving');
    const editor = document.getElementById('doc-editor-body');
    const htmlContent = customHtml !== undefined ? customHtml : (editor ? editor.innerHTML : editContent);

    saveDocMutation.mutate({
      id: selectedDocId,
      payload: {
        name: editTitle || selectedDoc?.name || "Untitled Document",
        description: selectedDoc?.description,
        category: selectedDoc?.category,
        access_level: selectedDoc?.access_level,
        status: selectedDoc?.status,
        content: htmlContent
      }
    });
  };

  // Auto-Save Inactivity Timer
  const autoSaveTimerRef = useRef<any>(null);
  useEffect(() => {
    if (selectedDocId && selectedDoc && !isReadOnly) {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
      
      autoSaveTimerRef.current = setTimeout(() => {
        handleSaveDocumentContent();
      }, 4000); // Trigger saving 4s after typing stops
    }
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [editContent, editTitle]);

  // Load Content Initializer
  useEffect(() => {
    if (selectedDoc) {
      setEditTitle(selectedDoc.name);
      const localContent = localStorage.getItem(`doc_content_${selectedDoc.id}`);
      let initialText = selectedDoc.content || `<p>Welcome to <strong>${selectedDoc.name}</strong> workspace. Start document processing, summaries generation, and vector calculations.</p>`;
      
      if (localContent && localContent !== selectedDoc.content) {
        const confirmRestore = window.confirm("A local draft from a previous session was found. Would you like to restore it?");
        if (confirmRestore) {
          initialText = localContent;
        } else {
          localStorage.removeItem(`doc_content_${selectedDoc.id}`);
        }
      }
      
      setEditContent(initialText);
      updateCounts(initialText);
      setLastSavedTime(new Date(selectedDoc.updated_at || Date.now()).toLocaleTimeString());
    }
  }, [selectedDoc]);

  // ----------------- MARKDOWN PASTE & DRAG-DROP IMAGES -----------------
  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    // 1. Intercept image pasting from clipboard
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        e.preventDefault();
        const file = items[i].getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const dataUrl = event.target?.result as string;
            applyStyle('insertHTML', `<img src="${dataUrl}" class="rounded-lg max-w-full my-4 shadow-sm border border-slate-200" alt="Pasted Image" />`);
          };
          reader.readAsDataURL(file);
        }
        return;
      }
    }

    // 2. Intercept Plain text / Markdown pasting and auto-convert to HTML
    const pastedText = e.clipboardData.getData('text/plain');
    const isMarkdown = /(^#+\s|\*\*.*\*\*|\*.*\*|`.*`|\[.*\]\(.*\))/m.test(pastedText);

    if (isMarkdown) {
      e.preventDefault();
      const htmlConverted = parseMarkdownToHtml(pastedText);
      applyStyle('insertHTML', htmlConverted);
      return;
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.indexOf('image') !== -1) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const dataUrl = event.target?.result as string;
          applyStyle('insertHTML', `<img src="${dataUrl}" class="rounded-lg max-w-full my-4 shadow-sm border border-slate-200" alt="Dropped Image" />`);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const parseMarkdownToHtml = (markdown: string): string => {
    let html = markdown
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Headings
    html = html.replace(/^#### (.*?)$/gm, '<h4 class="text-sm font-bold my-2 text-slate-800">$1</h4>');
    html = html.replace(/^### (.*?)$/gm, '<h3 class="text-base font-bold my-3 text-slate-800">$1</h3>');
    html = html.replace(/^## (.*?)$/gm, '<h2 class="text-lg font-bold my-3 text-slate-800">$1</h2>');
    html = html.replace(/^# (.*?)$/gm, '<h1 class="text-xl font-bold my-4 text-slate-900">$1</h1>');

    // Bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');

    // Italic
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    html = html.replace(/_(.*?)_/g, '<em>$1</em>');

    // Inline Code
    html = html.replace(/`(.*?)`/g, '<code class="bg-slate-100 px-1 py-0.5 rounded font-mono text-xs text-red-600">$1</code>');

    // Links
    html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">$1</a>');

    // Lists
    html = html.replace(/^\*\s(.*)$/gm, '<li>$1</li>');
    html = html.replace(/^-\s(.*)$/gm, '<li>$1</li>');

    // Wrap LIs in lists if matching lines
    if (html.includes('<li>')) {
      // Basic wrap
      html = html.replace(/(<li>.*?<\/li>)/gs, '<ul class="list-disc pl-5 my-2">$1</ul>');
    }

    // Paragraph splits
    html = html.split('\n\n').map(p => {
      if (p.trim().startsWith('<h') || p.trim().startsWith('<ul') || p.trim().startsWith('<li')) return p;
      return `<p class="my-2">${p.replace(/\n/g, '<br/>')}</p>`;
    }).join('');

    return html;
  };

  // ----------------- INSERTION HELPERS -----------------
  const handleInsertTable = (rows = 3, cols = 3) => {
    let tableHtml = '<table class="border-collapse border border-slate-300 w-full my-4 text-sm table-fixed"><tbody class="divide-y divide-slate-200">';
    for (let r = 0; r < rows; r++) {
      tableHtml += '<tr class="divide-x divide-slate-200">';
      for (let c = 0; c < cols; c++) {
        tableHtml += '<td class="border border-slate-300 p-2 min-h-[40px] align-top bg-white" contenteditable="true">&nbsp;</td>';
      }
      tableHtml += '</tr>';
    }
    tableHtml += '</tbody></table>';
    applyStyle('insertHTML', tableHtml);
  };

  const handleInsertEmoji = (emoji: string) => {
    applyStyle('insertHTML', emoji);
  };

  const handleInsertCodeBlock = () => {
    const codeSnippet = `<pre class="bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-xs my-4 overflow-x-auto shadow-inner border border-slate-800" contenteditable="true"><code>// Paste code snippet here
console.log("Enterprise KMS Sandbox Ready.");</code></pre>`;
    applyStyle('insertHTML', codeSnippet);
  };

  const handleInsertBlockquote = () => {
    const bq = `<blockquote class="border-l-4 border-slate-400 pl-4 py-1 italic text-slate-600 my-4 bg-slate-50 rounded-r-md" contenteditable="true">Insert quote context here.</blockquote>`;
    applyStyle('insertHTML', bq);
  };

  const handleInsertPageBreak = () => {
    const pb = `<div class="py-4 my-6 border-t border-dashed border-slate-400 relative z-10 flex items-center justify-center select-none" contenteditable="false">
      <span class="bg-[#f4f7f6] px-3 text-[10px] uppercase font-bold text-slate-400 tracking-wider">Page Break Boundary</span>
    </div>`;
    applyStyle('insertHTML', pb);
  };

  // ----------------- VOICE TYPING (SPEECH RECOGNITION) -----------------
  const toggleVoiceTyping = () => {
    if (isListening) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsListening(false);
    } else {
      const SpeechSpeech = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechSpeech) {
        alert("Web Speech dictation is not fully supported on this browser version.");
        return;
      }
      
      const rec = new SpeechSpeech();
      rec.continuous = true;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onresult = (event: any) => {
        const text = event.results[event.results.length - 1][0].transcript;
        applyStyle('insertHTML', `<span>${text}</span>`);
      };

      rec.onerror = (err: any) => {
        console.error("Speech Recognition Error:", err);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
      rec.start();
      setIsListening(true);
    }
  };

  // ----------------- HAND-DRAWING POPUP -----------------
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000000';
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawingMode = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleInsertDrawing = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    applyStyle('insertHTML', `<img src="${dataUrl}" class="rounded shadow-sm border border-slate-200 max-w-full my-4" alt="Inserted Canvas Drawing" />`);
    setShowDrawingModal(false);
  };

  // ----------------- DOWNLOAD UTILS -----------------
  const triggerDownloadFormat = (type: 'pdf' | 'docx' | 'txt') => {
    if (!selectedDoc) return;
    
    if (type === 'txt') {
      const temp = document.createElement('div');
      temp.innerHTML = editContent;
      const plainText = temp.innerText || temp.textContent || '';
      
      const blob = new Blob([plainText], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${editTitle || selectedDoc.name}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    } 
    else if (type === 'docx') {
      // Export formatted HTML wrapped in Word container tags
      const docHtml = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head><title>${editTitle}</title><style>body { font-family: Arial, sans-serif; }</style></head>
        <body>${editContent}</body>
        </html>
      `;
      const blob = new Blob(['\ufeff' + docHtml], { type: 'application/msword' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${editTitle || selectedDoc.name}.doc`;
      a.click();
      URL.revokeObjectURL(url);
    } 
    else if (type === 'pdf') {
      // Open clean printable layout window for PDF saving
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>${editTitle || selectedDoc.name}</title>
              <style>
                body { font-family: 'Outfit', 'Inter', sans-serif; padding: 40px; line-height: 1.6; color: #202124; }
                pre { background: #f1f5f9; padding: 15px; border-radius: 8px; font-family: monospace; }
                blockquote { border-left: 4px solid #94a3b8; padding-left: 15px; font-style: italic; color: #475569; }
                table { border-collapse: collapse; width: 100%; margin: 20px 0; }
                table, th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: left; }
              </style>
            </head>
            <body>
              <h1>${editTitle || selectedDoc.name}</h1>
              <div>${editContent}</div>
              <script>window.onload = function() { window.print(); window.close(); }</script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    }
  };

  // ----------------- FIND AND REPLACE -----------------
  const handleFindReplaceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!findText) return;
    const bodyDiv = document.getElementById('doc-editor-body');
    if (bodyDiv) {
      const escaped = findText.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(escaped, 'gi');
      
      if (replaceText) {
        bodyDiv.innerHTML = bodyDiv.innerHTML.replace(regex, replaceText);
      }
      
      const newHtml = bodyDiv.innerHTML;
      setEditContent(newHtml);
      updateCounts(newHtml);
      handleSaveDocumentContent(newHtml);
      alert(`Replacement processes completed.`);
    }
  };

  // ----------------- AI ASSISTANT CONVERSATION -----------------
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiHistory, setAiHistory] = useState<Array<{ q: string; a: string }>>([]);
  const [aiLoading, setAiLoading] = useState(false);

  const handleAskAI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuestion.trim() || aiLoading) return;
    
    const userQ = aiQuestion;
    setAiQuestion('');
    setAiLoading(true);

    try {
      const response = await api.ai.askDoc(selectedDocId, userQ);
      setAiHistory(prev => [...prev, { q: userQ, a: response.answer }]);
    } catch (err: any) {
      setAiHistory(prev => [...prev, { q: userQ, a: `Error querying AI Assistant: ${err.message || 'Server connection timed out.'}` }]);
    } finally {
      setAiLoading(false);
    }
  };

  const triggerAIShortcut = async (action: string) => {
    let finalAction = action;
    if (action === 'Translate') {
      const lang = prompt("Enter target language:", "Spanish");
      if (!lang) return;
      finalAction = `Translate document to ${lang}`;
    }
    
    setRightTab('ai');
    setRightSidebarOpen(true);
    setAiLoading(true);
    setAiQuestion(`Processing preset request: ${action}...`);

    try {
      const textToQuery = document.getElementById('doc-editor-body')?.innerText || editContent;
      const promptText = `${finalAction}. Respond concisely. Scoped Text:\n"${textToQuery.slice(0, 3000)}"`;
      const response = await api.ai.askDoc(selectedDocId, promptText);
      
      setAiHistory(prev => [...prev, { q: `${action} Request`, a: response.answer }]);
    } catch (err: any) {
      setAiHistory(prev => [...prev, { q: action, a: `Failed: ${err.message}` }]);
    } finally {
      setAiLoading(false);
      setAiQuestion('');
    }
  };

  // ----------------- SEED REVISION CHECKPOINT -----------------
  const handleSaveRevisionCheckpoint = () => {
    const html = document.getElementById('doc-editor-body')?.innerHTML || editContent;
    const fileBlob = new Blob([html], { type: 'text/html' });
    const file = new File([fileBlob], `${editTitle || selectedDoc.name}_v${(selectedDoc.current_version || 1) + 1}.html`);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('version_number', String((selectedDoc.current_version || 1) + 1));
    
    createVersionMutation.mutate({ id: selectedDocId, formData });
  };

  if (docLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Syncing Secure Workspace...</span>
        </div>
      </div>
    );
  }

  const isAccessDenied = docError && (
    (docError as any).status === 403 || 
    (docError as any).message?.includes('403') ||
    (docError as any).message?.toLowerCase().includes('denied')
  );

  if (isAccessDenied) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50 p-6">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xl p-8 max-w-md text-center space-y-4">
          <div className="h-16 w-16 bg-amber-50 border border-amber-100 text-amber-600 rounded-2xl flex items-center justify-center shadow-sm mx-auto">
            <Lock className="h-8 w-8 text-amber-650" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-800 text-sm">Access Denied</h3>
            <p className="text-[11px] text-slate-455 mt-1.5 leading-relaxed">
              You do not have permission to view or edit this document. Please contact the administrator or document owner to request access.
            </p>
          </div>
          <button 
            onClick={onBackToCatalog}
            className="w-full glow-btn bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2.5 text-xs font-bold transition-all border border-blue-500 shadow-sm"
          >
            Return to Catalog
          </button>
        </div>
      </div>
    );
  }

  if (docError || !selectedDoc) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50 p-6">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xl p-8 max-w-md text-center space-y-4">
          <div className="h-16 w-16 bg-red-50 border border-red-100 text-red-650 rounded-2xl flex items-center justify-center shadow-sm mx-auto">
            <FileText className="h-8 w-8 text-red-650" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-800 text-sm">Document Not Found</h3>
            <p className="text-[11px] text-slate-455 mt-1.5 leading-relaxed">
              The requested document could not be found or has been deleted from the database registry.
            </p>
          </div>
          <button 
            onClick={onBackToCatalog}
            className="w-full glow-btn bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2.5 text-xs font-bold transition-all border border-blue-500 shadow-sm"
          >
            Return to Catalog
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-[#f9fbfd] font-sans overflow-hidden select-none">
      
      {/* ----------------- TOP HEADER BAR ----------------- */}
      <header className="bg-white px-4 pt-2.5 pb-1.5 flex flex-col shrink-0 border-b border-[#e1e3e1] relative z-30 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="flex items-center justify-between">
          
          {/* Logo & Title Panel */}
          <div className="flex items-center gap-2 min-w-0">
            <button 
              onClick={onBackToCatalog}
              className="h-9 w-9 hover:bg-slate-100 rounded-full flex items-center justify-center text-slate-500 transition-colors shrink-0"
              title="Return to Catalog"
            >
              <ArrowLeft className="h-4.5 w-4.5" />
            </button>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 shadow-sm border border-blue-100/50">
              <FileText className="h-5 w-5" />
            </div>

            <div className="min-w-0 flex flex-col pl-1">
              <div className="flex items-center gap-2">
                <input 
                  type="text"
                  value={editTitle}
                  disabled={isReadOnly}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Untitled Document"
                  className="text-base font-semibold text-slate-800 border-none p-0 focus:outline-none focus:ring-0 bg-transparent placeholder-slate-300 truncate max-w-[320px] hover:bg-slate-50 rounded px-1.5 transition-colors focus:bg-white focus:border focus:border-slate-200"
                />
                <button className="text-slate-400 hover:text-amber-500 transition-colors p-0.5 rounded-full"><Star className="h-3.5 w-3.5" /></button>
                
                {/* Save status badge */}
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 px-2 py-0.5 bg-slate-50 border border-slate-200/50 rounded-full">
                  {saveStatus === 'saving' ? (
                    <>
                      <Loader2 className="h-2.5 w-2.5 animate-spin text-blue-500" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Cloud className="h-2.5 w-2.5 text-emerald-500" />
                      <span className="text-emerald-600 font-extrabold">Saved to Cloud</span>
                    </>
                  )}
                </div>
              </div>
              
              {/* Desktop menu items row */}
              <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 select-none font-medium">
                {/* File Dropdown */}
                <div className="relative">
                  <button 
                    onClick={() => setActiveMenu(activeMenu === 'File' ? null : 'File')}
                    className={`px-2 py-0.5 rounded transition-colors ${activeMenu === 'File' ? 'bg-slate-100 text-slate-800' : 'hover:bg-slate-100'}`}
                  >
                    File
                  </button>
                  {activeMenu === 'File' && (
                    <div className="absolute left-0 mt-1.5 w-56 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-50 text-xs font-semibold text-slate-700 animate-in fade-in zoom-in-95 duration-100">
                      <button onClick={() => { onBackToCatalog(); setActiveMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2"><FolderIcon className="h-3.5 w-3.5" /> Open Catalog</button>
                      <button onClick={() => { handleSaveDocumentContent(); setActiveMenu(null); }} disabled={isReadOnly} className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 disabled:opacity-50"><Save className="h-3.5 w-3.5" /> Save Changes</button>
                      <button onClick={() => { handleSaveRevisionCheckpoint(); setActiveMenu(null); }} disabled={isReadOnly} className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 disabled:opacity-50"><Clock className="h-3.5 w-3.5" /> Save version history</button>
                      <div className="h-[1px] bg-slate-100 my-1.5" />
                      <div className="px-4 py-1 text-[10px] text-slate-400 uppercase tracking-widest">Download As</div>
                      <button onClick={() => { triggerDownloadFormat('pdf'); setActiveMenu(null); }} className="w-full text-left px-6 py-1.5 hover:bg-slate-50 flex items-center gap-2"><FileDown className="h-3.5 w-3.5 text-red-500" /> PDF Document</button>
                      <button onClick={() => { triggerDownloadFormat('docx'); setActiveMenu(null); }} className="w-full text-left px-6 py-1.5 hover:bg-slate-50 flex items-center gap-2"><FileDown className="h-3.5 w-3.5 text-blue-500" /> Word (.doc)</button>
                      <button onClick={() => { triggerDownloadFormat('txt'); setActiveMenu(null); }} className="w-full text-left px-6 py-1.5 hover:bg-slate-50 flex items-center gap-2"><FileDown className="h-3.5 w-3.5 text-slate-500" /> Plain Text (.txt)</button>
                      <div className="h-[1px] bg-slate-100 my-1.5" />
                      <button onClick={() => { window.print(); setActiveMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2"><Printer className="h-3.5 w-3.5" /> Print Layout</button>
                      <button onClick={() => { setRightTab('properties'); setRightSidebarOpen(true); setActiveMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2"><Info className="h-3.5 w-3.5" /> Document Properties</button>
                    </div>
                  )}
                </div>

                {/* Edit Dropdown */}
                <div className="relative">
                  <button 
                    onClick={() => setActiveMenu(activeMenu === 'Edit' ? null : 'Edit')}
                    className={`px-2 py-0.5 rounded transition-colors ${activeMenu === 'Edit' ? 'bg-slate-100 text-slate-800' : 'hover:bg-slate-100'}`}
                  >
                    Edit
                  </button>
                  {activeMenu === 'Edit' && (
                    <div className="absolute left-0 mt-1.5 w-52 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-50 text-xs font-semibold text-slate-700 animate-in fade-in zoom-in-95 duration-100">
                      <button onClick={() => { applyStyle('undo'); setActiveMenu(null); }} disabled={isReadOnly} className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center justify-between disabled:opacity-50"><span>Undo</span><span className="text-slate-400">Ctrl+Z</span></button>
                      <button onClick={() => { applyStyle('redo'); setActiveMenu(null); }} disabled={isReadOnly} className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center justify-between disabled:opacity-50"><span>Redo</span><span className="text-slate-400">Ctrl+Y</span></button>
                      <div className="h-[1px] bg-slate-100 my-1.5" />
                      <button onClick={() => { document.execCommand('cut'); setActiveMenu(null); }} disabled={isReadOnly} className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center justify-between disabled:opacity-50"><span>Cut</span><span className="text-slate-400">Ctrl+X</span></button>
                      <button onClick={() => { document.execCommand('copy'); setActiveMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center justify-between"><span>Copy</span><span className="text-slate-400">Ctrl+C</span></button>
                      <button onClick={() => { applyStyle('selectAll'); setActiveMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center justify-between"><span>Select All</span><span className="text-slate-400">Ctrl+A</span></button>
                      <div className="h-[1px] bg-slate-100 my-1.5" />
                      <button onClick={() => { setShowFindReplace(true); setActiveMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2"><Search className="h-3.5 w-3.5" /> Find & Replace</button>
                    </div>
                  )}
                </div>

                {/* View Dropdown */}
                <div className="relative">
                  <button 
                    onClick={() => setActiveMenu(activeMenu === 'View' ? null : 'View')}
                    className={`px-2 py-0.5 rounded transition-colors ${activeMenu === 'View' ? 'bg-slate-100 text-slate-800' : 'hover:bg-slate-100'}`}
                  >
                    View
                  </button>
                  {activeMenu === 'View' && (
                    <div className="absolute left-0 mt-1.5 w-52 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-50 text-xs font-semibold text-slate-700 animate-in fade-in zoom-in-95 duration-100">
                      <button onClick={() => { setShowRuler(!showRuler); setActiveMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center justify-between"><span>Show Ruler</span><span>{showRuler ? '✓' : ''}</span></button>
                      <button onClick={() => { setShowPrintLayout(!showPrintLayout); setActiveMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center justify-between"><span>Show Print Layout</span><span>{showPrintLayout ? '✓' : ''}</span></button>
                      <button onClick={() => { setIsFullWidth(!isFullWidth); setActiveMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center justify-between"><span>Full Width Page</span><span>{isFullWidth ? '✓' : ''}</span></button>
                    </div>
                  )}
                </div>

                {/* Format Dropdown */}
                <div className="relative">
                  <button 
                    onClick={() => setActiveMenu(activeMenu === 'Format' ? null : 'Format')}
                    className={`px-2 py-0.5 rounded transition-colors ${activeMenu === 'Format' ? 'bg-slate-100 text-slate-800' : 'hover:bg-slate-100'}`}
                  >
                    Format
                  </button>
                  {activeMenu === 'Format' && (
                    <div className="absolute left-0 mt-1.5 w-56 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-50 text-xs font-semibold text-slate-700 max-h-[300px] overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-100">
                      <button onClick={() => { applyStyle('bold'); setActiveMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center justify-between"><span>Bold</span><span className="text-slate-400">Ctrl+B</span></button>
                      <button onClick={() => { applyStyle('italic'); setActiveMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center justify-between"><span>Italic</span><span className="text-slate-400">Ctrl+I</span></button>
                      <button onClick={() => { applyStyle('underline'); setActiveMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center justify-between"><span>Underline</span><span className="text-slate-400">Ctrl+U</span></button>
                      <button onClick={() => { applyStyle('strikeThrough'); setActiveMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-slate-50">Strikethrough</button>
                      <div className="h-[1px] bg-slate-100 my-1.5" />
                      <div className="px-4 py-1 text-[10px] text-slate-400 uppercase tracking-widest">Paragraph Style</div>
                      <button onClick={() => { applyStyle('formatBlock', '<p>'); setActiveMenu(null); }} className="w-full text-left px-6 py-1.5 hover:bg-slate-50">Normal Text</button>
                      <button onClick={() => { applyStyle('formatBlock', '<h1>'); setActiveMenu(null); }} className="w-full text-left px-6 py-1.5 hover:bg-slate-50 font-bold">Heading 1</button>
                      <button onClick={() => { applyStyle('formatBlock', '<h2>'); setActiveMenu(null); }} className="w-full text-left px-6 py-1.5 hover:bg-slate-50 font-bold">Heading 2</button>
                      <button onClick={() => { applyStyle('formatBlock', '<h3>'); setActiveMenu(null); }} className="w-full text-left px-6 py-1.5 hover:bg-slate-50 font-bold">Heading 3</button>
                      <div className="h-[1px] bg-slate-100 my-1.5" />
                      <button onClick={() => { applyStyle('removeFormat'); setActiveMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-slate-50 text-red-500 font-extrabold flex items-center gap-2"><Trash className="h-3.5 w-3.5" /> Clear Formatting</button>
                    </div>
                  )}
                </div>

                {/* Insert Dropdown */}
                <div className="relative">
                  <button 
                    onClick={() => setActiveMenu(activeMenu === 'Insert' ? null : 'Insert')}
                    className={`px-2 py-0.5 rounded transition-colors ${activeMenu === 'Insert' ? 'bg-slate-100 text-slate-800' : 'hover:bg-slate-100'}`}
                  >
                    Insert
                  </button>
                  {activeMenu === 'Insert' && (
                    <div className="absolute left-0 mt-1.5 w-52 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-50 text-xs font-semibold text-slate-700 animate-in fade-in zoom-in-95 duration-100">
                      <button onClick={() => { handleInsertTable(3, 3); setActiveMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2"><Grid className="h-3.5 w-3.5" /> Table (3x3)</button>
                      <button onClick={() => { const url = prompt("Insert Image URL:"); if (url) applyStyle('insertImage', url); setActiveMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2"><ImageIcon className="h-3.5 w-3.5" /> Image Link</button>
                      <button onClick={() => { const url = prompt("Hyperlink URL:"); if (url) applyStyle('createLink', url); }} disabled={isReadOnly} className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 disabled:opacity-50"><Link2 className="h-3.5 w-3.5" /> Hyperlink</button>
                      <button onClick={() => { setShowDrawingModal(true); setActiveMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2"><FileSignature className="h-3.5 w-3.5" /> Drawing Canvas</button>
                      <button onClick={() => { applyStyle('insertHorizontalRule'); setActiveMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2"><Minus className="h-3.5 w-3.5" /> Horizontal Line</button>
                      <button onClick={() => { handleInsertPageBreak(); setActiveMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2"><Maximize2Icon className="h-3.5 w-3.5" /> Page Break Boundary</button>
                      <button onClick={() => { handleInsertCodeBlock(); setActiveMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2"><FileCode className="h-3.5 w-3.5" /> Code Block</button>
                      <button onClick={() => { handleInsertBlockquote(); setActiveMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2"><MessageSquare className="h-3.5 w-3.5" /> Block Quote</button>
                      <button onClick={() => { handleInsertEmoji('😊'); setActiveMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2"><Smile className="h-3.5 w-3.5" /> Insert Emoji (😊)</button>
                    </div>
                  )}
                </div>

                {/* Tools Dropdown */}
                <div className="relative">
                  <button 
                    onClick={() => setActiveMenu(activeMenu === 'Tools' ? null : 'Tools')}
                    className={`px-2 py-0.5 rounded transition-colors ${activeMenu === 'Tools' ? 'bg-slate-100 text-slate-800' : 'hover:bg-slate-100'}`}
                  >
                    Tools
                  </button>
                  {activeMenu === 'Tools' && (
                    <div className="absolute left-0 mt-1.5 w-52 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-50 text-xs font-semibold text-slate-700 animate-in fade-in zoom-in-95 duration-100">
                      <button onClick={() => { alert(`Document contains ${wordCount} words and ${charCount} characters.`); setActiveMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2"><Info className="h-3.5 w-3.5" /> Word Count</button>
                      <button onClick={() => { toggleVoiceTyping(); setActiveMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2"><Mic className="h-3.5 w-3.5 text-red-500" /> Voice Typing {isListening ? "(On)" : ""}</button>
                      <button onClick={() => { triggerAIShortcut('Translate'); setActiveMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2"><Sparkles className="h-3.5 w-3.5 text-blue-500" /> Translate Document</button>
                    </div>
                  )}
                </div>

                {/* Extensions Dropdown */}
                <div className="relative">
                  <button 
                    onClick={() => setActiveMenu(activeMenu === 'Extensions' ? null : 'Extensions')}
                    className={`px-2 py-0.5 rounded transition-colors ${activeMenu === 'Extensions' ? 'bg-slate-100 text-slate-800' : 'hover:bg-slate-100'}`}
                  >
                    Extensions
                  </button>
                  {activeMenu === 'Extensions' && (
                    <div className="absolute left-0 mt-1.5 w-48 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-50 text-xs font-semibold text-slate-400 italic px-4 py-2 select-none">
                      No extensions loaded. Add-on APIs will be available in future releases.
                    </div>
                  )}
                </div>

                {/* Help Dropdown */}
                <div className="relative">
                  <button 
                    onClick={() => setActiveMenu(activeMenu === 'Help' ? null : 'Help')}
                    className={`px-2 py-0.5 rounded transition-colors ${activeMenu === 'Help' ? 'bg-slate-100 text-slate-800' : 'hover:bg-slate-100'}`}
                  >
                    Help
                  </button>
                  {activeMenu === 'Help' && (
                    <div className="absolute left-0 mt-1.5 w-52 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-50 text-xs font-semibold text-slate-700 animate-in fade-in zoom-in-95 duration-100">
                      <button onClick={() => { setShowShortcuts(true); setActiveMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2"><HelpCircle className="h-3.5 w-3.5" /> Keyboard Shortcuts</button>
                      <button onClick={() => { alert("Redesigned Enterprise Document Management System v3.0"); setActiveMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2"><Info className="h-3.5 w-3.5" /> About DMS Editor</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Version Registry Indicator */}
            <span className="text-[10px] bg-slate-100 border border-slate-200 text-slate-600 font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">
              Rev: v{selectedDoc.current_version}
            </span>

            {/* Approval Workflow Badge & Trigger */}
            {selectedDoc.status === 'draft' && (
              <button 
                onClick={() => submitApprovalMutation.mutate(selectedDoc.id)}
                disabled={isReadOnly}
                className="glow-btn bg-amber-500 hover:bg-amber-600 text-white rounded-full px-3 py-1.5 text-[11px] font-extrabold flex items-center gap-1 transition-all disabled:opacity-50"
              >
                Submit Approval
              </button>
            )}

            {selectedDoc.status === 'pending_approval' && (
              <div className="flex items-center gap-1">
                <span className="bg-amber-100 border border-amber-200 text-amber-800 text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider animate-pulse">
                  Under Review
                </span>
                {(user?.role?.name === 'super_admin' || user?.role?.name === 'admin' || user?.role?.name === 'department_manager') && (
                  <>
                    <button onClick={() => approveMutation.mutate(selectedDoc.id)} className="glow-btn bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-3 py-1 text-[10px] font-bold">Approve</button>
                    <button onClick={() => { const rem = prompt("Rejection remarks:"); if (rem) rejectMutation.mutate({ id: selectedDoc.id, remarks: rem }); }} className="glow-btn bg-red-655 hover:bg-red-750 text-white rounded-full px-3 py-1 text-[10px] font-bold">Reject</button>
                  </>
                )}
              </div>
            )}

            {selectedDoc.status === 'active' && (
              <span className="bg-emerald-100 border border-emerald-200 text-emerald-800 text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">
                Approved
              </span>
            )}

            {selectedDoc.status === 'rejected' && (
              <div className="flex items-center gap-1.5">
                <span className="bg-red-100 border border-red-200 text-red-800 text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">
                  Rejected
                </span>
                <button 
                  onClick={() => submitApprovalMutation.mutate(selectedDoc.id)} 
                  disabled={isReadOnly}
                  className="bg-slate-900 hover:bg-slate-800 text-white rounded-full px-3 py-1 text-[10px] font-bold disabled:opacity-50"
                  title={selectedDoc.rejection_remarks || "No remarks provided"}
                >
                  Resubmit
                </button>
              </div>
            )}

            {/* My AI Button */}
            <button 
              onClick={() => { setRightTab('ai'); setRightSidebarOpen(true); }}
              className="glow-btn bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full px-3.5 py-1.5 text-xs font-bold flex items-center gap-1.5 shadow-md shrink-0 active:scale-95"
              title="My AI Assistant"
            >
              <Sparkles className="h-3.5 w-3.5 animate-pulse text-yellow-300" />
              <span>My AI</span>
            </button>

            {/* Profile Avatar */}
            <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs select-none border border-blue-500 shadow-sm shrink-0">
              {user?.full_name?.charAt(0) || 'U'}
            </div>
          </div>
        </div>
      </header>

      {/* ----------------- MODERN WRAPPED TOOLBAR ----------------- */}
      <div className="bg-white border-b border-[#e1e3e1] px-4 py-1.5 flex flex-wrap items-center gap-1 z-20 shrink-0 shadow-sm shadow-slate-100/50">
        
        {/* Undo/Redo */}
        <button onClick={() => applyStyle('undo')} disabled={isReadOnly} className="p-1.5 hover:bg-slate-100 rounded text-slate-600 transition-colors disabled:opacity-30" title="Undo"><Undo className="h-4 w-4" /></button>
        <button onClick={() => applyStyle('redo')} disabled={isReadOnly} className="p-1.5 hover:bg-slate-100 rounded text-slate-600 transition-colors disabled:opacity-30" title="Redo"><Redo className="h-4 w-4" /></button>
        <button onClick={() => window.print()} className="p-1.5 hover:bg-slate-100 rounded text-slate-600 transition-colors" title="Print Document"><Printer className="h-4 w-4" /></button>
        
        <div className="h-4 w-[1px] bg-slate-200 mx-1.5" />

        {/* Zoom */}
        <select 
          value={zoomPercent} 
          onChange={(e) => setZoomPercent(e.target.value)}
          className="bg-slate-50 border border-slate-200 text-xs rounded px-2.5 py-1 text-slate-700 focus:outline-none focus:border-blue-500 font-semibold cursor-pointer"
        >
          {['50', '75', '90', '100', '125', '150'].map(z => <option key={z} value={z}>{z}%</option>)}
        </select>

        <div className="h-4 w-[1px] bg-slate-200 mx-1.5" />

        {/* Headings */}
        <select 
          disabled={isReadOnly}
          onChange={(e) => applyStyle('formatBlock', e.target.value)}
          defaultValue="<p>"
          className="bg-slate-50 border border-slate-200 text-xs rounded px-2.5 py-1 text-slate-700 focus:outline-none focus:border-blue-500 font-semibold cursor-pointer max-w-[120px]"
        >
          <option value="<p>">Normal Text</option>
          <option value="<h1>">Heading 1</option>
          <option value="<h2>">Heading 2</option>
          <option value="<h3>">Heading 3</option>
          <option value="<h4>">Heading 4</option>
          <option value="<pre>">Code Block</option>
        </select>

        {/* Font Families */}
        <select
          disabled={isReadOnly}
          onChange={(e) => applyStyle('fontName', e.target.value)}
          defaultValue="Arial"
          className="bg-slate-50 border border-slate-200 text-xs rounded px-2.5 py-1 text-slate-700 focus:outline-none focus:border-blue-500 font-semibold cursor-pointer max-w-[120px]"
        >
          {['Arial', 'Georgia', 'Courier New', 'Times New Roman', 'Garamond', 'Trebuchet MS', 'Impact'].map(f => (
            <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>
          ))}
        </select>

        {/* Font Sizes */}
        <select 
          disabled={isReadOnly}
          onChange={(e) => applyStyle('fontSize', e.target.value)}
          defaultValue="3"
          className="bg-slate-50 border border-slate-200 text-xs rounded px-2.5 py-1 text-slate-700 focus:outline-none focus:border-blue-500 font-semibold cursor-pointer"
        >
          <option value="1">10px</option>
          <option value="2">12px</option>
          <option value="3">14px</option>
          <option value="4">16px</option>
          <option value="5">18px</option>
          <option value="6">24px</option>
          <option value="7">32px</option>
        </select>

        <div className="h-4 w-[1px] bg-slate-200 mx-1.5" />

        {/* Basic formatting tools */}
        <button onClick={() => applyStyle('bold')} disabled={isReadOnly} className="p-1.5 hover:bg-slate-100 rounded text-slate-700 transition-colors font-extrabold text-xs h-8 w-8 flex items-center justify-center disabled:opacity-30" title="Bold (Ctrl+B)">B</button>
        <button onClick={() => applyStyle('italic')} disabled={isReadOnly} className="p-1.5 hover:bg-slate-100 rounded text-slate-700 transition-colors italic font-bold text-xs h-8 w-8 flex items-center justify-center disabled:opacity-30" title="Italic (Ctrl+I)">I</button>
        <button onClick={() => applyStyle('underline')} disabled={isReadOnly} className="p-1.5 hover:bg-slate-100 rounded text-slate-700 transition-colors underline font-bold text-xs h-8 w-8 flex items-center justify-center disabled:opacity-30" title="Underline (Ctrl+U)">U</button>
        <button onClick={() => applyStyle('strikeThrough')} disabled={isReadOnly} className="p-1.5 hover:bg-slate-100 rounded text-slate-700 transition-colors line-through font-bold text-xs h-8 w-8 flex items-center justify-center disabled:opacity-30" title="Strikethrough">S</button>
        
        {/* Colors */}
        <div className="relative group flex items-center">
          <button disabled={isReadOnly} className="p-1.5 hover:bg-slate-100 rounded text-slate-700 transition-colors font-semibold text-xs flex items-center gap-0.5 disabled:opacity-30" title="Text Color">
            <span className="border-b-2 border-slate-900 pb-0.5">A</span>
          </button>
          <div className="absolute top-8 left-0 hidden group-hover:grid grid-cols-5 gap-1 bg-white border border-slate-200 rounded-lg shadow-lg p-2 z-50">
            {['#000000', '#dc2626', '#16a34a', '#2563eb', '#4f46e5', '#7c3aed', '#db2777', '#d97706', '#4b5563'].map(c => (
              <button key={c} onClick={() => applyStyle('foreColor', c)} style={{ backgroundColor: c }} className="w-5 h-5 rounded-full hover:scale-110 transition-transform" />
            ))}
          </div>
        </div>

        {/* Highlights */}
        <div className="relative group flex items-center">
          <button disabled={isReadOnly} className="p-1.5 hover:bg-slate-100 rounded text-slate-700 transition-colors font-semibold text-xs flex items-center gap-0.5 disabled:opacity-30" title="Highlight Color">
            <span className="bg-yellow-200 px-1 py-0.5 rounded text-slate-800">H</span>
          </button>
          <div className="absolute top-8 left-0 hidden group-hover:grid grid-cols-5 gap-1 bg-white border border-slate-200 rounded-lg shadow-lg p-2 z-50">
            {['#fef08a', '#bbf7d0', '#bfdbfe', '#fbcfe8', '#e9d5ff', '#fed7aa', '#ffffff'].map(c => (
              <button key={c} onClick={() => applyStyle('hiliteColor', c)} style={{ backgroundColor: c }} className="w-5 h-5 border border-slate-200 hover:scale-110 transition-transform" />
            ))}
          </div>
        </div>

        <div className="h-4 w-[1px] bg-slate-200 mx-1.5" />

        {/* Alignments */}
        <button onClick={() => applyStyle('justifyLeft')} disabled={isReadOnly} className="p-1.5 hover:bg-slate-100 rounded text-slate-655 transition-colors disabled:opacity-30" title="Align Left"><AlignLeft className="h-4 w-4" /></button>
        <button onClick={() => applyStyle('justifyCenter')} disabled={isReadOnly} className="p-1.5 hover:bg-slate-100 rounded text-slate-655 transition-colors disabled:opacity-30" title="Align Center"><AlignCenter className="h-4 w-4" /></button>
        <button onClick={() => applyStyle('justifyRight')} disabled={isReadOnly} className="p-1.5 hover:bg-slate-100 rounded text-slate-655 transition-colors disabled:opacity-30" title="Align Right"><AlignRight className="h-4 w-4" /></button>
        <button onClick={() => applyStyle('justifyFull')} disabled={isReadOnly} className="p-1.5 hover:bg-slate-100 rounded text-slate-655 transition-colors disabled:opacity-30" title="Justify"><AlignJustify className="h-4 w-4" /></button>

        <div className="h-4 w-[1px] bg-slate-200 mx-1.5" />

        {/* Lists */}
        <button onClick={() => applyStyle('insertUnorderedList')} disabled={isReadOnly} className="p-1.5 hover:bg-slate-100 rounded text-slate-655 transition-colors disabled:opacity-30" title="Bulleted List"><List className="h-4 w-4" /></button>
        <button onClick={() => applyStyle('insertOrderedList')} disabled={isReadOnly} className="p-1.5 hover:bg-slate-100 rounded text-slate-655 transition-colors disabled:opacity-30" title="Numbered List"><ListOrdered className="h-4 w-4" /></button>
        <button onClick={() => applyStyle('insertUnorderedList')} disabled={isReadOnly} className="p-1.5 hover:bg-slate-100 rounded text-slate-655 transition-colors text-xs font-bold disabled:opacity-30 flex items-center justify-center" title="Checklist"><CheckSquare className="h-4 w-4 text-slate-600" /></button>

        {/* Indents */}
        <button onClick={() => applyStyle('outdent')} disabled={isReadOnly} className="p-1.5 hover:bg-slate-100 rounded text-slate-655 transition-colors disabled:opacity-30 font-bold" title="Decrease Indent">←|</button>
        <button onClick={() => applyStyle('indent')} disabled={isReadOnly} className="p-1.5 hover:bg-slate-100 rounded text-slate-655 transition-colors disabled:opacity-30 font-bold" title="Increase Indent">|→</button>

        <div className="h-4 w-[1px] bg-slate-200 mx-1.5" />

        {/* Insert Elements shortcut */}
        <button onClick={() => { const url = prompt("Insert Image URL:"); if (url) applyStyle('insertImage', url); }} disabled={isReadOnly} className="p-1.5 hover:bg-slate-100 rounded text-slate-655 transition-colors disabled:opacity-30" title="Insert Image Link"><ImageIcon className="h-4 w-4" /></button>
        <button onClick={() => handleInsertTable(3, 3)} disabled={isReadOnly} className="p-1.5 hover:bg-slate-100 rounded text-slate-655 transition-colors disabled:opacity-30" title="Insert Table (3x3)"><Grid className="h-4 w-4" /></button>
        <button onClick={() => { const url = prompt("Hyperlink URL:"); if (url) applyStyle('createLink', url); }} disabled={isReadOnly} className="p-1.5 hover:bg-slate-100 rounded text-slate-655 transition-colors disabled:opacity-30" title="Insert Hyperlink"><Link2 className="h-4 w-4" /></button>
        <button onClick={handleAddComment} className="p-1.5 hover:bg-slate-100 rounded text-slate-655 transition-colors" title="Insert Comment Card"><MessageSquare className="h-4 w-4 text-amber-500" /></button>
        
        {/* Microphone / voice dictation toggle */}
        <button 
          onClick={toggleVoiceTyping} 
          disabled={isReadOnly}
          className={`p-1.5 rounded transition-colors disabled:opacity-30 ${isListening ? 'bg-red-100 text-red-650 animate-pulse' : 'hover:bg-slate-100 text-slate-655'}`}
          title="Toggle Voice Dictation"
        >
          <Mic className="h-4 w-4" />
        </button>
      </div>

      {/* ----------------- FIND & REPLACE BAR ----------------- */}
      {showFindReplace && (
        <div className="bg-white border-b border-slate-200 px-6 py-2.5 z-20 flex items-center gap-4 animate-in slide-in-from-top duration-200">
          <form onSubmit={handleFindReplaceSubmit} className="flex items-center gap-3 w-full max-w-xl">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input 
                type="text" 
                placeholder="Find text..." 
                value={findText} 
                onChange={(e) => setFindText(e.target.value)} 
                className="bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:bg-white focus:border-blue-500 text-slate-800 w-full"
              />
            </div>
            {!isReadOnly && (
              <>
                <input 
                  type="text" 
                  placeholder="Replace with..." 
                  value={replaceText} 
                  onChange={(e) => setReplaceText(e.target.value)} 
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-1.5 text-xs focus:outline-none focus:bg-white focus:border-blue-500 text-slate-800 flex-1"
                />
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 py-1.5 text-xs font-bold shadow-sm transition-colors shrink-0">Replace All</button>
              </>
            )}
            {isReadOnly && (
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 py-1.5 text-xs font-bold shadow-sm transition-colors shrink-0">Find</button>
            )}
            <button type="button" onClick={() => setShowFindReplace(false)} className="text-slate-400 hover:text-slate-600 transition-colors"><X className="h-4.5 w-4.5" /></button>
          </form>
        </div>
      )}

      {/* ----------------- WORKSPACE INNER WINDOW CONTAINER ----------------- */}
      <div className="flex-1 flex w-full overflow-hidden relative">
        
        {/* COLLAPSIBLE LEFT SIDEBAR */}
        <aside className={`${leftSidebarOpen ? 'w-56 border-r border-[#e1e3e1]' : 'w-0 border-none'} flex flex-col h-full bg-white shrink-0 transition-all duration-300 overflow-hidden relative z-20`}>
          {/* Header tabs */}
          <div className="flex border-b border-slate-100 shrink-0 bg-slate-50/20 text-[10px] font-bold uppercase tracking-wider select-none">
            <button onClick={() => setLeftTab('outline')} className={`flex-1 py-3 text-center border-b-2 transition-all ${leftTab === 'outline' ? 'border-blue-600 text-blue-600 bg-white' : 'border-transparent text-slate-450 hover:text-slate-700'}`}>Outline</button>
            <button onClick={() => setLeftTab('templates')} className={`flex-1 py-3 text-center border-b-2 transition-all ${leftTab === 'templates' ? 'border-blue-600 text-blue-600 bg-white' : 'border-transparent text-slate-455 hover:text-slate-700'}`}>Templates</button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {leftTab === 'outline' && (
              <div className="space-y-2">
                <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block px-1">Headings outline</span>
                <div className="space-y-1.5">
                  {getHeadings().length > 0 ? (
                    getHeadings().map((h, index) => (
                      <button
                        key={`${h.id}-${index}`}
                        onClick={() => scrollToHeading(h.id)}
                        style={{ paddingLeft: `${h.tag === 'h1' ? 4 : h.tag === 'h2' ? 12 : h.tag === 'h3' ? 20 : 28}px` }}
                        className="w-full text-left py-1 px-2 rounded text-[11px] font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors block truncate"
                      >
                        {h.text}
                      </button>
                    ))
                  ) : (
                    <span className="text-[10px] text-slate-400 italic block px-1 leading-relaxed">
                      Headings added to document will assemble here.
                    </span>
                  )}
                </div>
              </div>
            )}

            {leftTab === 'templates' && (
              <div className="space-y-2.5">
                <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block">Available layouts</span>
                <div className="space-y-2">
                  {allDocs?.filter(d => d.is_template).map((t: any) => (
                    <button
                      key={t.id}
                      onClick={() => { if(window.confirm("Overwrite content with this template?")) { setEditContent(t.content || ''); applyStyle('insertHTML', ''); } }}
                      className="w-full text-left p-2.5 rounded-lg border border-slate-100 hover:border-blue-200 hover:bg-blue-50/20 text-xs font-semibold text-slate-700 block transition-all"
                    >
                      {t.name}
                    </button>
                  ))}
                  {allDocs?.filter(d => d.is_template).length === 0 && (
                    <span className="text-[10px] text-slate-400 italic block">No active reusable templates.</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Collapsed Left Sidebar Toggle Button */}
        {!leftSidebarOpen && (
          <button 
            onClick={() => setLeftSidebarOpen(true)}
            className="absolute left-3 top-3 z-40 bg-white border border-slate-200 hover:bg-slate-50 rounded-full w-8 h-8 flex items-center justify-center shadow-md text-slate-650 transition-all hover:scale-105 active:scale-95"
            title="Open outline sidebar"
          >
            <ChevronRight className="h-4.5 w-4.5" />
          </button>
        )}
        {leftSidebarOpen && (
          <button 
            onClick={() => setLeftSidebarOpen(false)}
            className="absolute left-[210px] top-3 z-40 bg-white border border-slate-200 hover:bg-slate-50 rounded-full w-7 h-7 flex items-center justify-center shadow-md text-slate-600 transition-all hover:scale-105 active:scale-95"
            title="Collapse outline sidebar"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}

        {/* ----------------- CENTER PAGE EDITOR CANVAS ----------------- */}
        <main className="flex-1 bg-[#f4f7f6] flex flex-col h-full overflow-hidden relative">
          
          {/* Version preview warning label */}
          {viewingVersion && (
            <div className="bg-blue-650 text-white px-6 py-2.5 flex items-center justify-between shrink-0 select-none text-xs font-bold shadow-md z-10 animate-in slide-in-from-top duration-150">
              <span className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-sky-200 animate-pulse" />
                Viewing Historical revision registry Version v{viewingVersion.version_number} (Read-Only)
              </span>
              <div className="flex items-center gap-2">
                {canEditDoc() && (
                  <button 
                    onClick={() => {
                      if (window.confirm("Overwrite current draft with this historical version?")) {
                        handleSaveDocumentContent(viewingVersion.content);
                        setEditContent(viewingVersion.content);
                        setViewingVersion(null);
                      }
                    }}
                    className="bg-white hover:bg-slate-100 text-blue-600 rounded-lg px-3 py-1 font-bold shadow-sm transition-all"
                  >
                    Restore Version
                  </button>
                )}
                <button 
                  onClick={() => setViewingVersion(null)}
                  className="bg-blue-800 hover:bg-blue-900 text-white rounded-lg px-3 py-1 font-bold shadow-sm transition-all border border-blue-700"
                >
                  Exit Preview
                </button>
              </div>
            </div>
          )}

          {/* RULER DISPLAY */}
          {showRuler && (
            <div className="h-6 bg-[#f4f7f6] border-b border-[#e1e3e1] flex items-center justify-center shrink-0 select-none relative">
              <div className="w-full max-w-[816px] px-16 flex items-center relative text-[8px] text-slate-400 font-semibold h-full select-none">
                <div className="absolute left-[calc(4rem+2px)] right-[calc(4rem+2px)] h-2 border-x border-slate-300 flex justify-between select-none">
                  {Array.from({ length: 18 }).map((_, idx) => (
                    <span key={idx} className={`flex-1 border-r ${idx % 6 === 5 ? 'border-slate-350' : 'border-slate-200/50'}`} />
                  ))}
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
              </div>
            </div>
          )}

          {/* EDITOR CANVAS AREA */}
          <div className="flex-1 overflow-y-auto pt-6 pb-12 px-4 flex justify-center items-start custom-scrollbar bg-[#f4f7f6]">
            
            {/* The page block */}
            <div 
              className={`bg-white border border-[#cbd5e1] shadow-[0_4px_16px_rgba(0,0,0,0.05)] focus:outline-none transition-all relative font-sans leading-relaxed text-[#202124] text-[14.5px] cursor-text rounded-none overflow-hidden ${
                isFullWidth ? 'w-full px-12 py-10 min-h-screen' : 'w-[816px] p-24 min-h-[1056px]'
              }`}
              style={{ transform: `scale(${Number(zoomPercent)/100})`, transformOrigin: 'top center' }}
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  document.getElementById('doc-editor-body')?.focus();
                }
              }}
            >
              {isReadOnly && (
                <div className="absolute top-0 left-0 right-0 h-10 bg-slate-100 border-b border-[#e1e3e1] flex items-center justify-center text-[10px] text-slate-500 font-extrabold select-none uppercase tracking-wider gap-2">
                  <Lock className="h-3.5 w-3.5 text-slate-400" />
                  <span>Viewing Mode • Editing & Collaboration Restricted</span>
                </div>
              )}

              {/* Header space representation */}
              <div className="h-10 text-[10px] text-slate-355 flex justify-between items-center border-b border-slate-100/50 mb-10 select-none">
                <span>{editTitle || selectedDoc.name}</span>
                <span>FASTTRADE INTERNAL DOCUMENT</span>
              </div>

              {/* HTML Content Canvas Body */}
              <div 
                id="doc-editor-body"
                contentEditable={!isReadOnly}
                onInput={(e) => {
                  const html = e.currentTarget.innerHTML;
                  setEditContent(html);
                  updateCounts(html);
                }}
                onPaste={handlePaste}
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                dangerouslySetInnerHTML={{ __html: viewingVersion ? viewingVersion.content : editContent }}
                className="focus:outline-none min-h-[800px] w-full max-w-full break-words outline-none text-[#202124]"
                style={{
                  wordBreak: 'break-word',
                  overflowWrap: 'break-word',
                }}
              />

              {/* Footer space representation */}
              <div className="h-10 text-[10px] text-slate-355 flex justify-between items-center border-t border-slate-100/50 mt-12 select-none">
                <span>Fast Trade Document Registry</span>
                <span>Page 1 of 1</span>
              </div>
            </div>
          </div>

          {/* EDITOR CANVAS FOOTER STATUS BAR */}
          <footer className="h-9 bg-white border-t border-slate-200 px-6 flex items-center justify-between shrink-0 select-none text-[10px] text-slate-450">
            <div className="flex items-center gap-4 font-semibold">
              <span>Words: <strong className="text-slate-800">{wordCount}</strong></span>
              <span>Characters: <strong className="text-slate-800">{charCount}</strong></span>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                Active Autosave caching
              </span>
              <span>•</span>
              <span>Saved stamp: <strong>{lastSavedTime || 'syncing'}</strong></span>
            </div>
          </footer>
        </main>

        {/* COLLAPSIBLE RIGHT SIDEBAR */}
        <aside className={`${rightSidebarOpen ? 'w-[320px] border-l border-[#e1e3e1]' : 'w-0 border-none'} flex flex-col h-full bg-white shrink-0 select-none transition-all duration-300 overflow-hidden relative z-20`}>
          {/* Header tabs selection */}
          <div className="flex border-b border-slate-200 shrink-0 bg-slate-50/20 text-[9px] font-extrabold uppercase tracking-widest text-center">
            <button onClick={() => setRightTab('comments')} className={`flex-1 py-3 border-b-2 transition-all ${rightTab === 'comments' ? 'border-blue-600 text-blue-600 bg-white' : 'border-transparent text-slate-400 hover:text-slate-700'}`}>Comments</button>
            <button onClick={() => setRightTab('history')} className={`flex-1 py-3 border-b-2 transition-all ${rightTab === 'history' ? 'border-blue-600 text-blue-600 bg-white' : 'border-transparent text-slate-400 hover:text-slate-700'}`}>Revisions</button>
            <button onClick={() => setRightTab('ai')} className={`flex-1 py-3 border-b-2 transition-all ${rightTab === 'ai' ? 'border-blue-600 text-blue-600 bg-white' : 'border-transparent text-slate-400 hover:text-slate-700'}`}>AI Chat</button>
            <button onClick={() => setRightTab('properties')} className={`flex-1 py-3 border-b-2 transition-all ${rightTab === 'properties' ? 'border-blue-600 text-blue-600 bg-white' : 'border-transparent text-slate-400 hover:text-slate-700'}`}>Props</button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-50/30">
            
            {/* COMMENTS TABS VIEW */}
            {rightTab === 'comments' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Active threads</span>
                  <span className="text-[10px] font-bold text-slate-400">Total: {comments.length}</span>
                </div>
                
                {/* Comments box */}
                <form onSubmit={handleAddComment} className="bg-white border border-slate-200/80 rounded-xl p-3 shadow-sm space-y-2">
                  <span className="text-[9px] font-bold text-slate-400 uppercase">New comment thread</span>
                  <textarea 
                    value={newCommentText} 
                    onChange={(e) => setNewCommentText(e.target.value)}
                    placeholder="Type comments here... Select text in doc to link."
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-blue-500 bg-slate-50/30"
                    rows={3}
                  />
                  <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-1.5 text-xs font-bold shadow-sm transition-colors">
                    Post Thread
                  </button>
                </form>

                {/* Comment Cards */}
                <div className="space-y-3">
                  {comments.map(c => (
                    <div key={c.id} className={`bg-white border rounded-xl p-3 shadow-sm space-y-2.5 transition-all ${c.resolved ? 'border-slate-200 opacity-60' : 'border-slate-200/80'}`}>
                      <div className="flex items-center justify-between">
                        <div className="min-w-0">
                          <span className="font-extrabold text-slate-700 text-xs block truncate">{c.author}</span>
                          <span className="text-[8px] text-slate-400 block">{c.timestamp}</span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button 
                            onClick={() => handleResolveComment(c.id)} 
                            className={`text-[9px] px-2 py-0.5 rounded font-extrabold uppercase ${c.resolved ? 'bg-slate-100 text-slate-500' : 'bg-emerald-50 text-emerald-600'}`}
                          >
                            {c.resolved ? "Reopen" : "Resolve"}
                          </button>
                          <button onClick={() => handleDeleteComment(c.id)} className="text-slate-400 hover:text-red-500 transition-colors p-1"><Trash className="h-3 w-3" /></button>
                        </div>
                      </div>
                      <p className="text-xs text-slate-655 leading-relaxed bg-slate-50/20 p-1.5 rounded">{c.content}</p>

                      {/* Replies */}
                      {c.replies.map((r, rIdx) => (
                        <div key={rIdx} className="pl-3.5 border-l border-slate-200 space-y-1">
                          <div className="flex justify-between text-[9px]">
                            <span className="font-bold text-slate-600">{r.author}</span>
                            <span className="text-slate-450">{r.timestamp}</span>
                          </div>
                          <p className="text-[11px] text-slate-600 leading-normal">{r.content}</p>
                        </div>
                      ))}

                      {/* Post Reply input */}
                      <div className="pt-1.5 border-t border-slate-100">
                        <input 
                          type="text" 
                          placeholder="Reply..." 
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleReplyComment(c.id, e.currentTarget.value);
                              e.currentTarget.value = '';
                            }
                          }}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-[11px] focus:outline-none focus:bg-white focus:border-blue-500 text-slate-800"
                        />
                      </div>
                    </div>
                  ))}
                  {comments.length === 0 && (
                    <span className="text-[10px] text-slate-400 italic block text-center pt-12">No comments threads started.</span>
                  )}
                </div>
              </div>
            )}

            {/* REVISION ARCHIVE HISTORIES */}
            {rightTab === 'history' && (
              <div className="space-y-4">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Revision list</span>
                <div className="space-y-2">
                  {docVersions && Array.isArray(docVersions) && docVersions.map((v: any) => (
                    <div 
                      key={v.id} 
                      onClick={() => setViewingVersion(v)}
                      className={`border rounded-xl p-3 bg-white hover:border-blue-300 transition-all cursor-pointer ${viewingVersion?.id === v.id ? 'ring-2 ring-blue-500 border-transparent' : 'border-slate-200/80'}`}
                    >
                      <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                        <span>Version v{v.version_number}</span>
                        <span className="text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">Checkpoint</span>
                      </div>
                      <span className="text-[9px] text-slate-400 block mt-1">{new Date(v.uploaded_at).toLocaleString()}</span>
                    </div>
                  ))}
                  {(!docVersions || docVersions.length === 0) && (
                    <span className="text-[10px] text-slate-400 italic block text-center pt-12">No previous revision version archives.</span>
                  )}
                </div>
              </div>
            )}

            {/* MY AI CHAT PANEL */}
            {rightTab === 'ai' && (
              <div className="flex flex-col h-[500px]">
                <div className="border-b border-slate-100 pb-2 mb-3">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">AI Document assistant</span>
                  <span className="text-[8px] text-slate-400 block">Ask questions scoped to this document text</span>
                </div>
                
                {/* Conversational bubble histories */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-1 py-1 custom-scrollbar text-xs">
                  {aiHistory.map((hist, idx) => (
                    <div key={idx} className="space-y-1.5">
                      <div className="bg-blue-600 text-white rounded-2xl rounded-tr-none px-3.5 py-2 text-right w-4/5 ml-auto shadow-sm">
                        {hist.q}
                      </div>
                      <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none px-3.5 py-2 w-4/5 shadow-sm text-slate-800 leading-relaxed font-sans">
                        {hist.a}
                      </div>
                    </div>
                  ))}
                  {aiLoading && (
                    <div className="flex items-center gap-2 bg-slate-100/50 p-3 rounded-xl border border-slate-200/30">
                      <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                      <span className="text-slate-400 italic text-[11px]">AI Copilot processing...</span>
                    </div>
                  )}
                  {aiHistory.length === 0 && (
                    <span className="text-[10px] text-slate-400 italic block text-center pt-12">Ask queries about policies or check content correctness.</span>
                  )}
                </div>

                {/* Input panel query */}
                <form onSubmit={handleAskAI} className="pt-3 border-t border-slate-200 mt-2 flex items-center gap-1.5">
                  <input 
                    type="text" 
                    value={aiQuestion}
                    onChange={(e) => setAiQuestion(e.target.value)}
                    placeholder="Ask AI Copilot..."
                    className="flex-1 bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-blue-500 text-slate-800 w-full"
                  />
                  <button type="submit" className="bg-blue-650 hover:bg-blue-700 text-white p-2 rounded-xl shrink-0 shadow-sm transition-colors">
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </form>
              </div>
            )}

            {/* DOCUMENT PROPERTIES TAB */}
            {rightTab === 'properties' && (
              <div className="space-y-3.5 text-xs text-slate-700">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Metadata properties</span>
                <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 space-y-2.5 shadow-sm">
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase">Document Name</span>
                    <span className="block font-semibold mt-0.5 text-slate-800">{selectedDoc.name}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase">Description</span>
                    <span className="block font-semibold mt-0.5 text-slate-655">{selectedDoc.description || 'No description logged.'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase">Category Tag</span>
                    <span className="block font-semibold mt-0.5 text-slate-655">{selectedDoc.category || 'Uncategorized'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase">Department</span>
                    <span className="block font-semibold mt-0.5 text-slate-655">{selectedDoc.department?.name || 'General Access'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Collapsed Right Sidebar Toggle Button */}
        {!rightSidebarOpen && (
          <button 
            onClick={() => setRightSidebarOpen(true)}
            className="absolute right-3 top-3 z-40 bg-white border border-slate-200 hover:bg-slate-50 rounded-full w-8 h-8 flex items-center justify-center shadow-md text-slate-650 transition-all hover:scale-105 active:scale-95"
            title="Open properties sidebar"
          >
            <X className="h-4.5 w-4.5 rotate-180" />
          </button>
        )}
        {rightSidebarOpen && (
          <button 
            onClick={() => setRightSidebarOpen(false)}
            className="absolute right-[304px] top-3 z-40 bg-white border border-slate-200 hover:bg-slate-50 rounded-full w-7 h-7 flex items-center justify-center shadow-md text-slate-600 transition-all hover:scale-105 active:scale-95"
            title="Collapse properties sidebar"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* ----------------- DRAWING CANVAS DIALOG MODAL ----------------- */}
      {showDrawingModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-sm font-bold text-slate-800 flex items-center gap-1.5"><FileSignature className="h-4.5 w-4.5 text-blue-600" /> Sketch Board Drawing</span>
              <button onClick={() => setShowDrawingModal(false)} className="text-slate-400 hover:text-slate-650"><X className="h-4.5 w-4.5" /></button>
            </div>
            
            <div className="border border-slate-200 rounded-xl bg-slate-50 overflow-hidden flex justify-center">
              <canvas 
                ref={canvasRef} 
                width={400} 
                height={260} 
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawingMode}
                onMouseLeave={stopDrawingMode}
                className="bg-white cursor-crosshair shadow-inner"
              />
            </div>
            
            <div className="flex items-center justify-between gap-3 pt-2">
              <button 
                onClick={clearCanvas}
                className="glow-btn bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl px-4 py-2 text-xs font-bold"
              >
                Clear Canvas
              </button>
              <div className="flex gap-2">
                <button 
                  type="button"
                  onClick={() => setShowDrawingModal(false)}
                  className="glow-btn border border-slate-200 hover:bg-slate-50 rounded-xl px-4 py-2 text-xs font-bold text-slate-600"
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  onClick={handleInsertDrawing}
                  className="glow-btn bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 py-2 text-xs font-bold"
                >
                  Insert Drawing
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- SHORTCUTS HELP MODAL ----------------- */}
      {showShortcuts && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800">Keyboard shortcuts</span>
              <button onClick={() => setShowShortcuts(false)} className="text-slate-400 hover:text-slate-655"><X className="h-4.5 w-4.5" /></button>
            </div>
            <div className="space-y-2 text-xs text-slate-600 font-semibold select-text font-mono">
              <div className="flex justify-between py-1 border-b border-slate-50"><span>Bold</span><kbd className="bg-slate-100 px-1.5 py-0.5 rounded border">Ctrl + B</kbd></div>
              <div className="flex justify-between py-1 border-b border-slate-50"><span>Italic</span><kbd className="bg-slate-100 px-1.5 py-0.5 rounded border">Ctrl + I</kbd></div>
              <div className="flex justify-between py-1 border-b border-slate-50"><span>Underline</span><kbd className="bg-slate-100 px-1.5 py-0.5 rounded border">Ctrl + U</kbd></div>
              <div className="flex justify-between py-1 border-b border-slate-50"><span>Undo</span><kbd className="bg-slate-100 px-1.5 py-0.5 rounded border">Ctrl + Z</kbd></div>
              <div className="flex justify-between py-1"><span>Redo</span><kbd className="bg-slate-100 px-1.5 py-0.5 rounded border">Ctrl + Y</kbd></div>
            </div>
            <button onClick={() => setShowShortcuts(false)} className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl py-2 text-xs font-bold transition-all">
              Dismiss
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

// Inline fallback Folder icon if import was not named
function FolderIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={props.className} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-19.5 0A2.25 2.25 0 0 0 2.25 15v4.5A2.25 2.25 0 0 0 4.5 21.75h15A2.25 2.25 0 0 0 21.75 19.5V15a2.25 2.25 0 0 0 -2.25-2.25m-16.5 0H21.75M12 9V3m0 0L9 6m3-3l3 3" />
    </svg>
  );
}

function Maximize2Icon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={props.className} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75v4.5m0-4.5h-4.5m4.5 0L15 9m5.25 11.25v-4.5m0 4.5h-4.5m4.5 0L15 15" />
    </svg>
  );
}
