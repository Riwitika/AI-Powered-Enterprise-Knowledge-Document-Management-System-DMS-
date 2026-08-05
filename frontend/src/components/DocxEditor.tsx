import React, { useState, useRef, useEffect } from 'react';
import { sanitizeHtml } from '../utils/sanitize';
import { useNavigate } from 'react-router-dom';
import { 
  Undo2, 
  Redo2, 
  Printer, 
  Bold, 
  Italic, 
  Underline, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  AlignJustify, 
  List, 
  ListOrdered, 
  Link2, 
  Table, 
  Minus,
  Sparkles,
  Image,
  RemoveFormatting,
  Highlighter,
  X,
  Send,
  User,
  Users,
  Copy,
  Check,
  Share2,
  Star,
  CornerDownLeft,
  ArrowLeft,
  Indent as IndentIcon,
  Outdent as OutdentIcon
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { api } from '../api/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';

// Types
interface CommentReply {
  author: string;
  content: string;
  timestamp: string;
}

interface Comment {
  id: string;
  author: string;
  content: string;
  timestamp: string;
  resolved: boolean;
  replies: CommentReply[];
}

interface Version {
  id: string;
  version: string;
  author: string;
  timestamp: string;
  content: string;
}

interface ActivityItem {
  actor: string;
  action: string;
  time: string;
}

interface DocxEditorProps {
  activeDoc?: {
    id: string;
    name: string;
    fileType: string;
    version: string;
    lastModified: string;
    ownerName: string;
    locationPath: string;
    tags: string[];
    description: string;
    content?: string;
  };
}

export default function DocxEditor({ activeDoc }: DocxEditorProps = {}) {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const docId = activeDoc?.id || 'default-doc';
  
  const queryClient = useQueryClient();
  const isRealUUID = !!activeDoc?.id && !activeDoc.id.startsWith('doc-') && !activeDoc.id.startsWith('temp-') && activeDoc.id.length > 20;

  // ----------------- STATE DECLARATIONS -----------------
  const [docTitle, setDocTitle] = useState(activeDoc?.name || 'Untitled Document');
  const [fontSizeVal, setFontSizeVal] = useState(11);
  const [fontFamily, setFontFamily] = useState('Arial');
  const [lineSpacing, setLineSpacing] = useState('1.15');
  const [saveStatus, setSaveStatus] = useState<'Saved' | 'Saving...' | 'Failed' | 'Unsaved changes'>('Saved');
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  // Layout Panels State
  const [showOutline, setShowOutline] = useState(true);
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [rightTab, setRightTab] = useState<'properties' | 'activity' | 'comments' | 'history'>('properties');
  const [activeHeadingId, setActiveHeadingId] = useState<string>('');

  // Google Docs Menu Dropdowns State
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  // Floating AI Assistant States (Only AI interface)
  const [showFloatingAiPanel, setShowFloatingAiPanel] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [selectedRange, setSelectedRange] = useState<Range | null>(null);
  const [showFloatingAiToolbar, setShowFloatingAiToolbar] = useState(false);
  const [floatingAiToolbarPos, setFloatingAiToolbarPos] = useState({ top: 0, left: 0 });

  // Right Sidebars States
  const [headings, setHeadings] = useState<{ id: string; text: string; tag: string }[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [versions, setVersions] = useState<Version[]>([]);

  // React Query for comments list
  const { data: dbComments } = useQuery({
    queryKey: ['comments', docId],
    queryFn: () => api.comments.list(docId),
    enabled: isRealUUID,
  });

  // React Query for versions list
  const { data: dbVersions } = useQuery({
    queryKey: ['versions', docId],
    queryFn: () => api.documents.versions(docId),
    enabled: isRealUUID,
  });

  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'Just now';
    }
  };

  useEffect(() => {
    if (dbComments) {
      const mappedComments = dbComments.map((c: any) => ({
        id: String(c.id),
        author: c.user_name,
        content: c.content,
        timestamp: formatTime(c.created_at),
        resolved: c.resolved,
        replies: (c.replies || []).map((r: any) => ({
          author: r.user_name,
          content: r.content,
          timestamp: formatTime(r.created_at),
        })),
      }));
      setComments(mappedComments);
    }
  }, [dbComments]);

  useEffect(() => {
    if (dbVersions) {
      const mappedVersions = dbVersions.map((v: any) => ({
        id: String(v.id),
        version: `v${v.version_number}.0`,
        author: v.uploader?.full_name || 'System',
        timestamp: formatTime(v.uploaded_at),
        content: '',
        version_number: v.version_number
      }));
      setVersions(mappedVersions);
    }
  }, [dbVersions]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [aiMessages, setAiMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string }>>([
    { sender: 'ai', text: 'Hello! I am your Enterprise AI Assistant. How can I help you draft or refine this document?' }
  ]);
  const [aiInput, setAiInput] = useState('');
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  // Comments Actions State
  const [newCommentVal, setNewCommentVal] = useState('');
  const [replyInputs, setReplyInputs] = useState<{ [commentId: string]: string }>({});

  // Share Modal Overlay State
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareEmails, setShareEmails] = useState<string[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('Viewer');
  const [publicLinkEnabled, setPublicLinkEnabled] = useState(false);
  const [copiedShareLink, setCopiedShareLink] = useState(false);

  // Document metadata defaults
  const ownerName = activeDoc?.ownerName || 'Paras Jain';
  const lastModifiedDate = activeDoc?.lastModified || new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const versionStr = activeDoc?.version || 'v1.2';
  const locationPath = activeDoc?.locationPath || '/Operations/Guidelines.docx';
  const tagsList = activeDoc?.tags || ['Policy', 'Operations', 'KMS'];
  const docDescription = activeDoc?.description || 'Standard corporate operational policy guidelines and rules.';

  // Refs
  const editorRef = useRef<HTMLDivElement>(null);
  const floatingToolbarAiRef = useRef<HTMLDivElement>(null);
  const menuContainerRef = useRef<HTMLDivElement>(null);
  const saveTimeoutRef = useRef<any | null>(null);

  // Close menus on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuContainerRef.current && !menuContainerRef.current.contains(e.target as Node)) {
        setActiveMenu(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ----------------- LIFECYCLE SEEDING & LOAD -----------------
  useEffect(() => {
    if (!docId) return;

    // 1. Load document content
    if (editorRef.current) {
      if (isRealUUID) {
        editorRef.current.innerHTML = sanitizeHtml(activeDoc?.content || getDefaultEditorContent());
      } else {
        const savedContent = localStorage.getItem(`kms-doc-content-${docId}`);
        if (savedContent) {
          editorRef.current.innerHTML = sanitizeHtml(savedContent);
        } else {
          editorRef.current.innerHTML = sanitizeHtml(getDefaultEditorContent());
        }
      }
    }

    // 2. Load favorite / lock states
    const favorites = localStorage.getItem('kms-doc-favorites');
    const favList = favorites ? JSON.parse(favorites) : [];
    setIsFavorite(favList.includes(docId));

    const locks = localStorage.getItem('kms-doc-locks');
    const lockList = locks ? JSON.parse(locks) : [];
    setIsLocked(lockList.includes(docId));

    // 5. Load Activities Log (fallback mock list)
    const savedActivities = localStorage.getItem(`kms-doc-activity-${docId}`);
    if (savedActivities) {
      setActivities(JSON.parse(savedActivities));
    } else {
      const defaultActivities: ActivityItem[] = [
        { actor: 'Paras Jain', action: 'Created initial draft', time: 'Yesterday, 4:12 PM' },
        { actor: 'Riwitika Gupta', action: 'Left comment on budget estimates', time: 'Yesterday, 5:30 PM' },
        { actor: 'Arnim Goyal', action: 'Committed revision checkpoint v1.1', time: 'Today, 11:20 AM' },
        { actor: 'Arun Goyal', action: 'Shared document with Riwitika Gupta', time: 'Today, 1:45 PM' }
      ];
      setActivities(defaultActivities);
    }

    // Initialize outline headings
    setTimeout(extractHeadings, 150);
  }, [docId, activeDoc?.content, isRealUUID]);

  const getDefaultEditorContent = () => {
    return `
      <h1 id="heading-ref-0" class="text-xl font-black text-slate-900 border-b border-slate-150 pb-1.5 tracking-tight">
        Enterprise Policy and Operational Guidelines
      </h1>
      <p class="text-slate-700 leading-relaxed font-sans mt-2">
        This document outlines the standard operational protocols for the Knowledge Management System (KMS). Ensure compliance with corporate security rules and review revision checkpoints before archiving.
      </p>
      
      <h2 id="heading-ref-1" class="text-sm font-extrabold text-slate-800 tracking-tight pt-3">
        1. Purpose and Scope
      </h2>
      <p class="text-slate-700 leading-relaxed mt-1">
        Our core platform coordinates secure asset synchronization, multi-format previews, and role authorization pipelines. Team contributors can highlight sections to launch contextual AI processing or leave comments for collaborative resolution.
      </p>
      
      <h2 id="heading-ref-2" class="text-sm font-extrabold text-slate-800 tracking-tight pt-3">
        2. Operational Best Practices
      </h2>
      <p class="text-slate-700 leading-relaxed mt-1">
        Always lock documents when editing sensitive details to prevent overlapping file adjustments. Restored revisions will replace active canvases instantly and notify all contributors reactively.
      </p>
    `;
  };

  const extractHeadings = () => {
    if (!editorRef.current) return;
    const headingElements = editorRef.current.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const items: any[] = [];
    headingElements.forEach((el, index) => {
      if (!el.id) {
        el.id = `heading-ref-${index}`;
      }
      items.push({
        id: el.id,
        text: el.textContent || '',
        tag: el.tagName.toLowerCase()
      });
    });
    setHeadings(items);
  };

  const triggerAutosave = () => {
    setSaveStatus('Saving...');
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(async () => {
      if (!editorRef.current) return;
      const htmlContent = editorRef.current.innerHTML;
      
      if (isRealUUID) {
        try {
          await api.documents.update(docId, { content: htmlContent });
          setSaveStatus('Saved');
          queryClient.invalidateQueries({ queryKey: ['document', docId] });
        } catch (err) {
          console.error('Autosave failed:', err);
          setSaveStatus('Failed');
        }
      } else {
        localStorage.setItem(`kms-doc-content-${docId}`, htmlContent);
        setSaveStatus('Saved');
      }
      
      extractHeadings();

      // Dispatch change event to sync with rest of layout
      window.dispatchEvent(new CustomEvent('kms-active-document-change', {
        detail: {
          id: docId,
          title: docTitle,
          fileType: 'DOCX',
          version: versionStr,
          fullContent: editorRef.current.innerText
        }
      }));
    }, 1200);
  };

  const handleEditorInput = () => {
    triggerAutosave();
  };

  const updateGlobalDocMeta = (newTitle: string) => {
    try {
      const savedDocs = localStorage.getItem('kms-documents-db');
      if (savedDocs) {
        const docs = JSON.parse(savedDocs);
        const updated = docs.map((d: any) => {
          if (d.id === docId) {
            return { ...d, name: newTitle, lastModified: new Date().toLocaleDateString('en-IN') };
          }
          return d;
        });
        localStorage.setItem('kms-documents-db', JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent('kms-documents-updated'));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const executeCommand = (command: string, value: string = '') => {
    document.execCommand(command, false, value);
    triggerAutosave();
  };

  // ----------------- TEXT SELECTION AI ACTIONS -----------------
  const handleSelectionChange = () => {
    setTimeout(() => {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const text = selection.toString().trim();
        if (text.length > 0 && editorRef.current?.contains(selection.anchorNode)) {
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          setSelectedText(text);
          setSelectedRange(range.cloneRange());
          
          setFloatingAiToolbarPos({
            top: window.scrollY + rect.top - 42,
            left: window.scrollX + rect.left + (rect.width / 2) - 140
          });
          setShowFloatingAiToolbar(true);
        } else {
          setShowFloatingAiToolbar(false);
          setSelectedText('');
          setSelectedRange(null);
        }
      }
    }, 80);
  };

  const handleSelectionAiAction = (actionType: string) => {
    setShowFloatingAiToolbar(false);
    setShowFloatingAiPanel(true);
    
    let prompt = '';
    switch (actionType) {
      case 'summarize':
        prompt = `Summarize this selection: "${selectedText}"`;
        break;
      case 'rewrite':
        prompt = `Rewrite this section professionally: "${selectedText}"`;
        break;
      case 'explain':
        prompt = `Explain the following text: "${selectedText}"`;
        break;
      case 'translate':
        prompt = `Translate this text selection to Spanish: "${selectedText}"`;
        break;
      case 'improve':
        prompt = `Improve writing style and tone of: "${selectedText}"`;
        break;
      default:
        prompt = `${actionType} selection: "${selectedText}"`;
    }
    
    triggerAiPrompt(prompt);
  };

  // ----------------- AI CHAT INTEGRATION -----------------
  const triggerAiPrompt = (prompt: string) => {
    if (isAiGenerating) return;
    
    setAiMessages(prev => [...prev, { sender: 'user', text: prompt }]);
    setIsAiGenerating(true);

    setTimeout(() => {
      const answers = [
        "Based on corporate protocols, Section 2 requires strict auth level validations prior to document approval triggers.",
        "Operational parameters state: 'Always check active revision history checkpoints before restoring document canvases.'",
        "The highlighted guidelines help ensure that draft documents are verified by Administrators or Super Admins."
      ];
      const selectedResponse = answers[Math.floor(Math.random() * answers.length)];
      
      setAiMessages(prev => [...prev, { sender: 'ai', text: selectedResponse }]);
      setIsAiGenerating(false);

      logActivity('AI Assistant', `Generated content result for query: "${prompt.substring(0, 30)}..."`);
    }, 1200);
  };

  const handleSendAiMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiInput.trim()) return;
    triggerAiPrompt(aiInput.trim());
    setAiInput('');
  };

  const handleInsertAiResult = (text: string) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    
    if (selectedRange) {
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(selectedRange);
        document.execCommand('insertHTML', false, `<span>${text}</span>`);
      }
    } else {
      document.execCommand('insertHTML', false, `<div>${text}</div>`);
    }
    triggerAutosave();
  };

  const handleReplaceSelection = (text: string) => {
    if (!editorRef.current || !selectedRange) return;
    editorRef.current.focus();
    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
      selection.addRange(selectedRange);
      document.execCommand('insertHTML', false, `<span>${text}</span>`);
    }
    triggerAutosave();
  };

  // ----------------- AUDIT LOG WRITER -----------------
  const logActivity = (actor: string, action: string) => {
    const newAct: ActivityItem = {
      actor,
      action,
      time: 'Just now'
    };
    const updated = [newAct, ...activities];
    setActivities(updated);
    localStorage.setItem(`kms-doc-activity-${docId}`, JSON.stringify(updated));
  };

  // ----------------- COMMENTS SYSTEM -----------------
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentVal.trim()) return;

    if (isRealUUID) {
      try {
        let createdComment: any = null;
        if (selectedRange && selectedText.length > 0) {
          editorRef.current?.focus();
          const selection = window.getSelection();
          if (selection) {
            selection.removeAllRanges();
            selection.addRange(selectedRange);
            
            createdComment = await api.comments.create(docId, { content: newCommentVal });
            const commentId = String(createdComment.id);
            
            const anchorHtml = `<span class="bg-amber-100 border-b-2 border-amber-400 py-0.5 cursor-pointer hover:bg-amber-200 transition-colors comment-anchor" data-comment-id="${commentId}">${selectedText}</span>`;
            document.execCommand('insertHTML', false, anchorHtml);
            triggerAutosave();
          }
        } else {
          createdComment = await api.comments.create(docId, { content: newCommentVal });
        }

        queryClient.invalidateQueries({ queryKey: ['comments', docId] });
        logActivity(user?.full_name || 'System', `Created new comment: "${newCommentVal.substring(0, 30)}..."`);
        setNewCommentVal('');
        setSelectedRange(null);
        setSelectedText('');
      } catch (err) {
        console.error('Failed to save comment:', err);
        alert('Could not save comment to backend.');
      }
    } else {
      const commentId = `comment-${Date.now()}`;
      const newComment: Comment = {
        id: commentId,
        author: user?.full_name || 'Riwitika Gupta',
        content: newCommentVal,
        timestamp: 'Just now',
        resolved: false,
        replies: []
      };

      if (selectedRange && selectedText.length > 0) {
        editorRef.current?.focus();
        const selection = window.getSelection();
        if (selection) {
          selection.removeAllRanges();
          selection.addRange(selectedRange);
          
          const anchorHtml = `<span class="bg-amber-100 border-b-2 border-amber-400 py-0.5 cursor-pointer hover:bg-amber-200 transition-colors comment-anchor" data-comment-id="${commentId}">${selectedText}</span>`;
          document.execCommand('insertHTML', false, anchorHtml);
        }
      }

      const updated = [newComment, ...comments];
      setComments(updated);
      localStorage.setItem(`kms-doc-comments-${docId}`, JSON.stringify(updated));
      logActivity(user?.full_name || 'Riwitika Gupta', `Created new comment: "${newCommentVal.substring(0, 30)}..."`);
      setNewCommentVal('');
      setSelectedRange(null);
      setSelectedText('');
      triggerAutosave();
    }
  };

  const handleReplyComment = async (commentId: string, replyText: string) => {
    if (!replyText.trim()) return;
    if (isRealUUID) {
      try {
        await api.comments.create(docId, { content: replyText, parent_id: Number(commentId) });
        queryClient.invalidateQueries({ queryKey: ['comments', docId] });
        logActivity(user?.full_name || 'System', `Replied to comment thread`);
        setReplyInputs(prev => ({ ...prev, [commentId]: '' }));
      } catch (err) {
        console.error('Failed to reply comment:', err);
      }
    } else {
      const updated = comments.map(c => {
        if (c.id === commentId) {
          return {
            ...c,
            replies: [...c.replies, {
              author: user?.full_name || 'Riwitika Gupta',
              content: replyText,
              timestamp: 'Just now'
            }]
          };
        }
        return c;
      });
      setComments(updated);
      localStorage.setItem(`kms-doc-comments-${docId}`, JSON.stringify(updated));
      logActivity(user?.full_name || 'Riwitika Gupta', `Replied to comment thread`);
      setReplyInputs(prev => ({ ...prev, [commentId]: '' }));
    }
  };

  const handleResolveComment = async (commentId: string) => {
    if (isRealUUID) {
      try {
        await api.comments.resolve(Number(commentId));
        queryClient.invalidateQueries({ queryKey: ['comments', docId] });
        logActivity(user?.full_name || 'System', `Resolved comment thread`);
      } catch (err) {
        console.error('Failed to resolve comment:', err);
      }
    } else {
      const target = comments.find(c => c.id === commentId);
      const updated = comments.map(c => {
        if (c.id === commentId) {
          return { ...c, resolved: !c.resolved };
        }
        return c;
      });
      setComments(updated);
      localStorage.setItem(`kms-doc-comments-${docId}`, JSON.stringify(updated));
      logActivity(user?.full_name || 'Riwitika Gupta', `${target?.resolved ? 'Reopened' : 'Resolved'} comment thread`);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (isRealUUID) {
      try {
        await api.comments.delete(Number(commentId));
        queryClient.invalidateQueries({ queryKey: ['comments', docId] });
        logActivity(user?.full_name || 'System', `Deleted comment thread`);

        if (editorRef.current) {
          const anchors = editorRef.current.querySelectorAll(`[data-comment-id="${commentId}"]`);
          anchors.forEach(anchor => {
            const parent = anchor.parentNode;
            if (parent) {
              while (anchor.firstChild) {
                parent.insertBefore(anchor.firstChild, anchor);
              }
              parent.removeChild(anchor);
            }
          });
          triggerAutosave();
        }
      } catch (err) {
        console.error('Failed to delete comment:', err);
      }
    } else {
      const updated = comments.filter(c => c.id !== commentId);
      setComments(updated);
      localStorage.setItem(`kms-doc-comments-${docId}`, JSON.stringify(updated));
      logActivity(user?.full_name || 'Riwitika Gupta', `Deleted comment thread`);

      if (!editorRef.current) return;
      const anchors = editorRef.current.querySelectorAll(`[data-comment-id="${commentId}"]`);
      anchors.forEach(anchor => {
        const parent = anchor.parentNode;
        if (parent) {
          while (anchor.firstChild) {
            parent.insertBefore(anchor.firstChild, anchor);
          }
          parent.removeChild(anchor);
        }
      });
      triggerAutosave();
    }
  };

  // ----------------- CHECKPOINT REVISIONS -----------------
  const handleCreateVersionCheckpoint = async () => {
    if (!editorRef.current) return;
    if (isRealUUID) {
      try {
        setSaveStatus('Saving...');
        const currentHtml = editorRef.current.innerHTML;
        const blob = new Blob([currentHtml], { type: 'text/html' });
        const formData = new FormData();
        formData.append('file', blob, `${docTitle}.html`);
        await api.documents.uploadVersion(docId, formData);
        
        queryClient.invalidateQueries({ queryKey: ['versions', docId] });
        queryClient.invalidateQueries({ queryKey: ['document', docId] });
        setSaveStatus('Saved');
        alert(`Successfully registered new revision checkpoint!`);
      } catch (err) {
        console.error('Failed to create revision checkpoint:', err);
        alert('Could not save version checkpoint to server.');
      }
    } else {
      const newVersionNum = `v1.${versions.length + 1}`;
      const newVersion: Version = {
        id: `v-${Date.now()}`,
        version: newVersionNum,
        author: user?.full_name || 'Riwitika Gupta',
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
        content: editorRef.current.innerHTML
      };

      const updated = [newVersion, ...versions];
      setVersions(updated);
      localStorage.setItem(`kms-doc-versions-${docId}`, JSON.stringify(updated));
      logActivity(user?.full_name || 'Riwitika Gupta', `Saved revision checkpoint ${newVersionNum}`);
      alert(`Successfully registered revision checkpoint: ${newVersionNum}`);
    }
  };

  const handleRestoreVersion = async (ver: any) => {
    if (!editorRef.current) return;
    if (isRealUUID) {
      try {
        const versionDetails = await api.documents.viewVersion(docId, ver.version_number);
        if (editorRef.current && versionDetails && versionDetails.content) {
          editorRef.current.innerHTML = sanitizeHtml(versionDetails.content);
          triggerAutosave();
          logActivity(user?.full_name || 'System', `Restored document contents to version v${ver.version_number}.0`);
          alert(`Restored document to version v${ver.version_number}.0 successfully!`);
        } else {
          alert('Could not retrieve version content from storage.');
        }
      } catch (err) {
        console.error('Error restoring version:', err);
        alert('Failed to restore version from server.');
      }
    } else {
      editorRef.current.innerHTML = sanitizeHtml(ver.content);
      triggerAutosave();
      logActivity(user?.full_name || 'Riwitika Gupta', `Restored document contents to version ${ver.version}`);
      alert(`Restored document to version ${ver.version} successfully!`);
    }
  };

  // ----------------- FAVORITES & LOCKS -----------------
  const handleToggleFavorite = () => {
    const favorites = localStorage.getItem('kms-doc-favorites');
    let favList = favorites ? JSON.parse(favorites) : [];
    if (isFavorite) {
      favList = favList.filter((id: string) => id !== docId);
      logActivity(user?.full_name || 'Riwitika Gupta', 'Removed document from favorites');
    } else {
      favList.push(docId);
      logActivity(user?.full_name || 'Riwitika Gupta', 'Added document to favorites');
    }
    localStorage.setItem('kms-doc-favorites', JSON.stringify(favList));
    setIsFavorite(!isFavorite);
  };

  const handleToggleLock = () => {
    const locks = localStorage.getItem('kms-doc-locks');
    let lockList = locks ? JSON.parse(locks) : [];
    if (isLocked) {
      lockList = lockList.filter((id: string) => id !== docId);
      logActivity(user?.full_name || 'Riwitika Gupta', 'Unlocked document editor write protection');
    } else {
      lockList.push(docId);
      logActivity(user?.full_name || 'Riwitika Gupta', 'Locked document for editing protection');
    }
    localStorage.setItem('kms-doc-locks', JSON.stringify(lockList));
    setIsLocked(!isLocked);
    alert(isLocked ? 'Document unlocked.' : 'Document locked for write protection.');
  };

  // ----------------- EXPORT ACTIONS -----------------
  const handleExportDocument = (format: 'txt' | 'html' | 'docx') => {
    if (!editorRef.current) return;
    const contentText = format === 'txt' ? editorRef.current.innerText : editorRef.current.innerHTML;
    const blob = new Blob([contentText], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${docTitle.replace(/\s+/g, '_')}.${format}`;
    link.click();
    logActivity(user?.full_name || 'Riwitika Gupta', `Exported document file format: .${format}`);
  };

  const handleInviteUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setShareEmails(prev => [...prev, `${inviteEmail} (${inviteRole})`]);
    logActivity(user?.full_name || 'Riwitika Gupta', `Shared file access with ${inviteEmail} as ${inviteRole}`);
    setInviteEmail('');
  };

  const handleCopyLink = () => {
    const link = `${window.location.origin}/documents/${docId}`;
    navigator.clipboard.writeText(link);
    setCopiedShareLink(true);
    setTimeout(() => setCopiedShareLink(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] text-slate-800 select-none overflow-hidden font-sans">
      
      {/* 1. GOOGLE DOCS HEADER ROW */}
      <header className="bg-white border-b border-slate-200 flex flex-col shrink-0 select-none z-20">
        
        {/* Title, cloud saved status, comments, video mock and share row */}
        <div className="px-6 pt-2 pb-1 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {/* Google Docs Icon */}
            <div className="h-8 w-8 rounded bg-blue-600 text-white flex items-center justify-center font-extrabold text-sm shrink-0 shadow-sm border border-blue-500">
              W
            </div>

            <div className="min-w-0 leading-tight">
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={docTitle}
                  onChange={(e) => {
                    setDocTitle(e.target.value);
                    updateGlobalDocMeta(e.target.value);
                    triggerAutosave();
                  }}
                  className="font-bold text-sm text-slate-800 bg-transparent hover:bg-slate-50 focus:bg-white focus:border-slate-300 rounded px-1 py-0.5 border border-transparent transition-all outline-none truncate block max-w-[280px]"
                  placeholder="Untitled document"
                />

                {/* Star icon toggle */}
                <button 
                  type="button" 
                  onClick={handleToggleFavorite}
                  className={`p-0.5 rounded-full transition-colors ${isFavorite ? 'text-amber-500' : 'text-slate-330 hover:text-slate-500'}`}
                  title="Star document"
                >
                  <Star className={`w-3.5 h-3.5 ${isFavorite ? 'fill-amber-500' : ''}`} />
                </button>

                {/* Cloud saving status */}
                <div 
                  onClick={() => alert(`Auto-save checkpoint configuration`)}
                  className="flex items-center gap-1 text-[8.5px] text-slate-400 font-bold bg-slate-50 border border-slate-200 rounded px-1.5 py-0.2 ml-1 cursor-pointer hover:bg-slate-100 shrink-0"
                >
                  <span className={`h-1 w-1 rounded-full ${
                    saveStatus === 'Saving...' ? 'bg-amber-500 animate-pulse' :
                    saveStatus === 'Failed' ? 'bg-rose-500' : 'bg-emerald-500'
                  }`} />
                  <span>{saveStatus}</span>
                </div>
              </div>
              
              <div className="text-[10px] text-slate-400 font-normal pl-1 mt-0.5 select-none leading-none">
                Owner: <span className="text-slate-500 font-semibold">{ownerName}</span> &bull; Last Edited: <span className="text-slate-555 font-semibold">{lastModifiedDate}</span> &bull; Version: <span className="text-slate-500 font-semibold">{versionStr}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Back button */}
            <button
              type="button"
              onClick={() => navigate('/documents')}
              className="p-1.5 hover:bg-slate-50 text-slate-500 hover:text-slate-800 rounded-lg transition-colors"
              title="Back to Documents"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            {/* Print trigger */}
            <button
              type="button"
              onClick={() => window.print()}
              className="p-1.5 hover:bg-slate-50 text-slate-550 hover:text-slate-850 rounded-lg transition-colors"
              title="Print"
            >
              <Printer className="w-4 h-4" />
            </button>

            {/* Unified Google Docs style Share button */}
            <button
              type="button"
              onClick={() => setShowShareModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white border border-blue-500 rounded-full text-xs font-bold transition-all shadow-sm"
            >
              <Share2 className="w-3 h-3" />
              <span>Share</span>
            </button>
          </div>
        </div>

        {/* 2. GOOGLE DOCS STYLE MENU BAR */}
        <div className="px-6 pb-1.5 flex items-center gap-0.5 bg-white relative" ref={menuContainerRef}>
          {[
            {
              name: 'File',
              items: [
                { label: 'New', action: () => alert('Create new template document') },
                { label: 'Open (⌘O)', action: () => navigate('/documents') },
                { label: 'Make a copy', action: () => alert('Make a Copy triggered') },
                { divider: true },
                { label: 'Share', action: () => setShowShareModal(true) },
                { label: 'Download (.docx)', action: () => handleExportDocument('docx') },
                { label: 'Download (.html)', action: () => handleExportDocument('html') },
                { label: 'Download (.txt)', action: () => handleExportDocument('txt') },
                { divider: true },
                { label: 'Version history', action: () => { setShowRightPanel(true); setRightTab('history'); } },
                { label: 'Lock Editor', action: () => handleToggleLock() },
                { divider: true },
                { label: 'Print (⌘P)', action: () => window.print() }
              ]
            },
            {
              name: 'Edit',
              items: [
                { label: 'Undo', action: () => executeCommand('undo') },
                { label: 'Redo', action: () => executeCommand('redo') },
                { divider: true },
                { label: 'Select all', action: () => executeCommand('selectAll') },
                { label: 'Clear format', action: () => executeCommand('removeFormat') }
              ]
            },
            {
              name: 'View',
              items: [
                { label: 'Toggle Outline', action: () => setShowOutline(!showOutline) },
                { label: 'Toggle Right Panel', action: () => setShowRightPanel(!showRightPanel) },
                { divider: true },
                { label: 'Properties Panel', action: () => { setShowRightPanel(true); setRightTab('properties'); } },
                { label: 'Audit Log Log', action: () => { setShowRightPanel(true); setRightTab('activity'); } },
                { label: 'Comments List', action: () => { setShowRightPanel(true); setRightTab('comments'); } }
              ]
            },
            {
              name: 'Insert',
              items: [
                {
                  label: 'Image',
                  action: () => {
                    const url = prompt('Enter Image URL:');
                    if (url) executeCommand('insertImage', url);
                  }
                },
                {
                  label: 'Table',
                  action: () => {
                    let tableHtml = '<table class="w-full border-collapse border border-slate-200 mt-2 text-xs"><tr><td class="border border-slate-200 p-2 min-w-16">Cell</td><td class="border border-slate-200 p-2 min-w-16">Cell</td></tr></table>';
                    executeCommand('insertHTML', tableHtml);
                  }
                },
                { label: 'Link (⌘K)', action: () => { const url = prompt('Enter Link URL:'); if (url) executeCommand('createLink', url); } },
                { label: 'Horizontal line', action: () => executeCommand('insertHorizontalRule') }
              ]
            },
            {
              name: 'Format',
              items: [
                { label: 'Bold', action: () => executeCommand('bold') },
                { label: 'Italic', action: () => executeCommand('italic') },
                { label: 'Underline', action: () => executeCommand('underline') },
                { label: 'Strikethrough', action: () => executeCommand('strikeThrough') },
                { divider: true },
                { label: 'Align Left', action: () => executeCommand('justifyLeft') },
                { label: 'Align Center', action: () => executeCommand('justifyCenter') },
                { label: 'Align Right', action: () => executeCommand('justifyRight') }
              ]
            },
            {
              name: 'Tools',
              items: [
                { label: 'Word count', action: () => alert(`Document has approximately ${editorRef.current?.innerText.split(/\s+/).length || 0} words.`) },
                { label: 'Revision Checkpoint', action: () => handleCreateVersionCheckpoint() }
              ]
            },
            {
              name: 'Extensions',
              items: [
                { label: 'Add-ons', action: () => alert('Add-ons management (Mock)') },
                { label: 'Apps Script', action: () => alert('Apps Script editor (Mock)') }
              ]
            },
            {
              name: 'Help',
              items: [
                { label: 'Help Docs', action: () => alert('Knowledge management portal documentation.') },
                { label: 'About', action: () => alert('Fast Trade DMS v2.0 - Premium Document Suite') }
              ]
            }
          ].map((menu) => (
            <div key={menu.name} className="relative">
              <button
                type="button"
                onClick={() => setActiveMenu(activeMenu === menu.name ? null : menu.name)}
                className={`px-2 py-0.8 text-[11px] font-medium rounded hover:bg-slate-100 transition-colors ${
                  activeMenu === menu.name ? 'bg-slate-100 text-slate-900 font-bold' : 'text-slate-600'
                }`}
              >
                {menu.name}
              </button>
              
              {activeMenu === menu.name && (
                <div className="absolute left-0 mt-1 w-48 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-40 select-none animate-in fade-in slide-in-from-top-1 duration-100 text-xs font-semibold text-slate-700">
                  {menu.items.map((item, idx) => {
                    if ('divider' in item) {
                      return <div key={`div-${idx}`} className="my-1 border-t border-slate-100" />;
                    }
                    return (
                      <button
                        key={`item-${idx}`}
                        type="button"
                        onClick={() => {
                          setActiveMenu(null);
                          item.action();
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center justify-between"
                      >
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>

      </header>

      {/* 3. GOOGLE DOCS STYLE STICKY FORMATTING TOOLBAR */}
      <div className="bg-slate-50 border-b border-slate-200 px-6 py-1 flex flex-wrap items-center gap-0.5 shrink-0 select-none z-10 sticky top-0 shadow-[0_1px_2px_rgba(0,0,0,0.01)]">
        
        {/* Undo Redo */}
        <button type="button" onClick={() => executeCommand('undo')} className="p-1 hover:bg-slate-200 active:bg-slate-300 text-slate-600 rounded transition-colors" title="Undo"><Undo2 className="w-4 h-4" /></button>
        <button type="button" onClick={() => executeCommand('redo')} className="p-1 hover:bg-slate-200 active:bg-slate-300 text-slate-600 rounded transition-colors" title="Redo"><Redo2 className="w-4 h-4" /></button>
        <button type="button" onClick={() => window.print()} className="p-1 hover:bg-slate-200 active:bg-slate-300 text-slate-600 rounded transition-colors" title="Print"><Printer className="w-4 h-4" /></button>
        <button type="button" onClick={() => executeCommand('removeFormat')} className="p-1 hover:bg-slate-200 active:bg-slate-300 text-slate-600 rounded transition-colors" title="Clear format"><RemoveFormatting className="w-4 h-4" /></button>

        <div className="h-4 w-[1px] bg-slate-200 mx-1.5 shrink-0" />

        {/* Font Family */}
        <select 
          value={fontFamily} 
          onChange={(e) => { setFontFamily(e.target.value); triggerAutosave(); }}
          className="bg-transparent hover:bg-slate-200 border-none rounded px-1.5 py-0.5 text-[11px] font-semibold text-slate-700 cursor-pointer w-24 focus:outline-none"
        >
          <option value="Arial">Arial</option>
          <option value="Calibri">Calibri</option>
          <option value="Inter">Inter</option>
          <option value="Times New Roman">Times New</option>
          <option value="Courier New">Courier</option>
          <option value="Georgia">Georgia</option>
        </select>

        {/* Font Size */}
        <select 
          value={fontSizeVal} 
          onChange={(e) => { setFontSizeVal(Number(e.target.value)); triggerAutosave(); }}
          className="bg-transparent hover:bg-slate-200 border-none rounded px-1 py-0.5 text-[11px] font-semibold text-slate-700 cursor-pointer w-14 focus:outline-none"
        >
          <option value={9}>9</option>
          <option value={10}>10</option>
          <option value={11}>11</option>
          <option value={12}>12</option>
          <option value={14}>14</option>
          <option value={16}>16</option>
          <option value={18}>18</option>
          <option value={24}>24</option>
        </select>

        <div className="h-4 w-[1px] bg-slate-200 mx-1.5 shrink-0" />

        {/* Text styling buttons */}
        <button type="button" onClick={() => executeCommand('bold')} className="p-1 hover:bg-slate-200 active:bg-slate-300 text-slate-650 rounded font-bold transition-colors" title="Bold"><Bold className="w-4 h-4" /></button>
        <button type="button" onClick={() => executeCommand('italic')} className="p-1 hover:bg-slate-200 active:bg-slate-300 text-slate-650 rounded font-bold transition-colors" title="Italic"><Italic className="w-4 h-4" /></button>
        <button type="button" onClick={() => executeCommand('underline')} className="p-1 hover:bg-slate-200 active:bg-slate-300 text-slate-650 rounded font-bold transition-colors" title="Underline"><Underline className="w-4 h-4" /></button>

        {/* Colors */}
        <button type="button" onClick={() => {
          const color = prompt('Enter text color hex:', '#ef4444');
          if (color) executeCommand('foreColor', color);
        }} className="p-1 hover:bg-slate-200 active:bg-slate-300 text-slate-655 rounded font-bold transition-colors flex items-center justify-center" title="Text Color">
          <span className="text-[12px] border-b-2 border-red-500 leading-none">A</span>
        </button>
        <button type="button" onClick={() => {
          const color = prompt('Enter highlight color hex:', '#fef08a');
          if (color) executeCommand('backColor', color);
        }} className="p-1 hover:bg-slate-200 active:bg-slate-300 text-slate-655 rounded font-bold transition-colors flex items-center justify-center" title="Highlight Color">
          <Highlighter className="w-4 h-4" />
        </button>

        <div className="h-4 w-[1px] bg-slate-200 mx-1.5 shrink-0" />

        {/* Headings */}
        <select 
          defaultValue="P"
          onChange={(e) => executeCommand('formatBlock', e.target.value)}
          className="bg-transparent hover:bg-slate-200 border-none rounded px-1.5 py-0.5 text-[11px] font-semibold text-slate-700 cursor-pointer w-24 focus:outline-none"
        >
          <option value="P">Normal text</option>
          <option value="H1">Heading 1</option>
          <option value="H2">Heading 2</option>
          <option value="H3">Heading 3</option>
          <option value="H4">Heading 4</option>
        </select>

        {/* Alignment */}
        <button type="button" onClick={() => executeCommand('justifyLeft')} className="p-1 hover:bg-slate-200 active:bg-slate-300 text-slate-655 rounded transition-colors" title="Align Left"><AlignLeft className="w-4 h-4" /></button>
        <button type="button" onClick={() => executeCommand('justifyCenter')} className="p-1 hover:bg-slate-200 active:bg-slate-300 text-slate-655 rounded transition-colors" title="Align Center"><AlignCenter className="w-4 h-4" /></button>
        <button type="button" onClick={() => executeCommand('justifyRight')} className="p-1 hover:bg-slate-200 active:bg-slate-300 text-slate-655 rounded transition-colors" title="Align Right"><AlignRight className="w-4 h-4" /></button>
        <button type="button" onClick={() => executeCommand('justifyFull')} className="p-1 hover:bg-slate-200 active:bg-slate-300 text-slate-655 rounded transition-colors" title="Justify"><AlignJustify className="w-4 h-4" /></button>

        <div className="h-4 w-[1px] bg-slate-200 mx-1.5 shrink-0" />

        {/* Lists & Indents */}
        <button type="button" onClick={() => executeCommand('insertUnorderedList')} className="p-1 hover:bg-slate-200 active:bg-slate-300 text-slate-655 rounded transition-colors" title="Bulleted List"><List className="w-4 h-4" /></button>
        <button type="button" onClick={() => executeCommand('insertOrderedList')} className="p-1 hover:bg-slate-200 active:bg-slate-300 text-slate-655 rounded transition-colors" title="Numbered List"><ListOrdered className="w-4 h-4" /></button>
        <button type="button" onClick={() => executeCommand('outdent')} className="p-1 hover:bg-slate-200 active:bg-slate-300 text-slate-655 rounded transition-colors" title="Decrease Indent"><OutdentIcon className="w-4 h-4" /></button>
        <button type="button" onClick={() => executeCommand('indent')} className="p-1 hover:bg-slate-200 active:bg-slate-300 text-slate-655 rounded transition-colors" title="Increase Indent"><IndentIcon className="w-4 h-4" /></button>

        <div className="h-4 w-[1px] bg-slate-200 mx-1.5 shrink-0" />

        {/* Insert Elements */}
        <button type="button" onClick={() => {
          const rows = prompt('Enter rows count:', '3');
          const cols = prompt('Enter cols count:', '3');
          if (rows && cols) {
            let tableHtml = '<table class="w-full border-collapse border border-slate-200 mt-2 text-xs">';
            for (let r = 0; r < Number(rows); r++) {
              tableHtml += '<tr>';
              for (let c = 0; c < Number(cols); c++) {
                tableHtml += '<td class="border border-slate-200 p-2 min-w-16">Cell</td>';
              }
              tableHtml += '</tr>';
            }
            tableHtml += '</table>';
            executeCommand('insertHTML', tableHtml);
          }
        }} className="p-1 hover:bg-slate-200 active:bg-slate-300 text-slate-655 rounded transition-colors" title="Insert Table"><Table className="w-4 h-4" /></button>
        
        <button type="button" onClick={() => {
          const url = prompt('Enter Image URL:');
          if (url) executeCommand('insertImage', url);
        }} className="p-1 hover:bg-slate-200 active:bg-slate-300 text-slate-655 rounded transition-colors" title="Insert Image"><Image className="w-4 h-4" /></button>
        
        <button type="button" onClick={() => {
          const url = prompt('Enter Link URL:');
          if (url) executeCommand('createLink', url);
        }} className="p-1 hover:bg-slate-200 active:bg-slate-300 text-slate-655 rounded transition-colors" title="Insert Link"><Link2 className="w-4 h-4" /></button>

        <button type="button" onClick={() => executeCommand('insertHorizontalRule')} className="p-1 hover:bg-slate-200 active:bg-slate-300 text-slate-655 rounded transition-colors" title="Horizontal Line"><Minus className="w-4 h-4" /></button>

        <div className="h-4 w-[1px] bg-slate-200 mx-1.5 shrink-0" />

        {/* Spacing & Export */}
        <select 
          value={lineSpacing} 
          onChange={(e) => { setLineSpacing(e.target.value); triggerAutosave(); }}
          className="bg-transparent hover:bg-slate-200 border-none rounded px-1.5 py-0.5 text-[11px] font-semibold text-slate-700 cursor-pointer w-14 focus:outline-none"
          title="Line spacing"
        >
          <option value="1.0">1.0</option>
          <option value="1.15">1.15</option>
          <option value="1.5">1.5</option>
          <option value="2.0">2.0</option>
        </select>

        <select 
          onChange={(e) => {
            const val = e.target.value as any;
            if (val) {
              handleExportDocument(val);
              e.target.value = '';
            }
          }}
          className="bg-transparent hover:bg-slate-200 border-none rounded px-1.5 py-0.5 text-[11px] font-semibold text-slate-700 cursor-pointer w-20 focus:outline-none"
          title="Export Format Options"
        >
          <option value="">Export</option>
          <option value="docx">Word (.docx)</option>
          <option value="html">HTML (.html)</option>
          <option value="txt">Text (.txt)</option>
        </select>
      </div>

      {/* 4. GOOGLE DOCS STYLE MARGINS RULER */}
      <div className="bg-white border-b border-slate-200 px-6 py-0.5 select-none flex items-center relative shrink-0">
        <div className="w-[816px] mx-auto flex items-center relative h-5 select-none text-[9px] font-mono text-slate-400">
          <div className="w-full h-[1px] bg-slate-200 absolute left-0 right-0 top-1/2" />
          
          {/* Blue left margin controller */}
          <div className="absolute left-[48px] -top-0.5 z-10 cursor-pointer flex flex-col items-center group">
            <span className="text-blue-600 font-extrabold text-[8px] leading-none select-none transition-transform group-hover:scale-110">▼</span>
            <div className="w-2.5 h-1.5 bg-blue-600 rounded-sm shadow-sm" />
          </div>

          {/* Ruler Labels & Ticks */}
          <div className="w-full flex justify-between px-12 text-[9px] font-semibold text-slate-400 pt-0.5 select-none pointer-events-none">
            <span>1</span>
            <span>2</span>
            <span>3</span>
            <span>4</span>
            <span>5</span>
            <span>6</span>
            <span>7</span>
            <span>8</span>
            <span>9</span>
            <span>10</span>
            <span>11</span>
            <span>12</span>
            <span>13</span>
            <span>14</span>
            <span>15</span>
            <span>16</span>
            <span>17</span>
            <span>18</span>
          </div>

          {/* Blue right margin controller */}
          <div className="absolute right-[48px] -top-0.5 z-10 cursor-pointer flex flex-col items-center group">
            <span className="text-blue-600 font-extrabold text-[8px] leading-none select-none transition-transform group-hover:scale-110">▼</span>
            <div className="w-2.5 h-1.5 bg-blue-600 rounded-sm shadow-sm" />
          </div>
        </div>
      </div>

      {/* 5. THREE-PANEL LAYOUT WORKSPACE */}
      <div className="flex-1 flex overflow-hidden relative w-full overflow-x-hidden">
        
        {/* LEFT PANEL: Document Outline */}
        {showOutline && (
          <aside className="w-52 border-r border-slate-200 bg-white shrink-0 overflow-y-auto p-4 custom-scrollbar select-none animate-in slide-in-from-left-4 duration-150 sticky top-0 h-full">
            <h3 className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-3">Outline</h3>
            
            {headings.length === 0 ? (
              <p className="text-[10px] text-slate-400 italic font-semibold">No outline headings found.</p>
            ) : (
              <div className="space-y-1">
                {headings.map((item, idx) => {
                  let indent = 'pl-0';
                  if (item.tag === 'h2') indent = 'pl-3';
                  if (item.tag === 'h3') indent = 'pl-6';
                  
                  const isActive = activeHeadingId === item.id;
                  
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setActiveHeadingId(item.id);
                        const target = document.getElementById(item.id);
                        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }}
                      className={`w-full text-left text-[11px] font-semibold px-2 py-1.5 rounded transition-all leading-tight block truncate ${
                        isActive ? 'text-blue-600 bg-blue-50/50 border-l-2 border-blue-600 rounded-l-none' : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
                      } ${indent}`}
                    >
                      {item.text}
                    </button>
                  );
                })}
              </div>
            )}
          </aside>
        )}

        {/* CENTER PANEL: Google Docs canvas sheet */}
        <div className="flex-1 bg-slate-100 overflow-y-auto flex flex-col justify-start relative select-text custom-scrollbar px-4">
          
          <div 
            ref={editorRef}
            contentEditable={!isLocked}
            suppressContentEditableWarning
            onInput={handleEditorInput}
            onMouseUp={handleSelectionChange}
            onKeyUp={handleSelectionChange}
            className={`bg-white border border-slate-205 shadow-[0_4px_16px_rgba(0,0,0,0.06),_0_1px_3px_rgba(0,0,0,0.02)] w-[816px] min-h-[1056px] p-16 mx-auto mt-4 mb-12 outline-none text-slate-800 select-text leading-relaxed font-sans text-xs space-y-5 rounded transition-all duration-200 ${
              isLocked ? 'cursor-not-allowed opacity-90 select-none' : ''
            }`}
            style={{ 
              fontFamily: fontFamily,
              fontSize: `${fontSizeVal}pt`,
              lineHeight: lineSpacing
            }}
          />

          {/* Floating selection formatting AI toolbar */}
          {showFloatingAiToolbar && (
            <div 
              ref={floatingToolbarAiRef}
              className="fixed bg-white border border-slate-205 shadow-xl rounded-xl py-1 px-1.5 z-[99999] flex items-center gap-1 text-[11px] font-bold text-slate-600 select-none animate-in fade-in zoom-in-95 duration-100"
              style={{ 
                top: `${floatingAiToolbarPos.top}px`, 
                left: `${floatingAiToolbarPos.left}px` 
              }}
            >
              <div className="p-1 text-blue-600 bg-blue-50 rounded-lg select-none flex items-center justify-center shrink-0">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <span className="text-[9.5px] text-slate-400 select-none font-bold mr-1 border-r border-slate-100 pr-1.5">AI</span>
              
              <button type="button" onClick={() => handleSelectionAiAction('summarize')} className="px-2 py-1 hover:bg-slate-50 hover:text-slate-900 rounded transition-colors">Summarize</button>
              <button type="button" onClick={() => handleSelectionAiAction('rewrite')} className="px-2 py-1 hover:bg-slate-50 hover:text-slate-900 rounded transition-colors">Rewrite</button>
              <button type="button" onClick={() => handleSelectionAiAction('improve')} className="px-2 py-1 hover:bg-slate-50 hover:text-slate-900 rounded transition-colors">Improve</button>
              <button type="button" onClick={() => handleSelectionAiAction('explain')} className="px-2 py-1 hover:bg-slate-50 hover:text-slate-900 rounded transition-colors">Explain</button>
              
              <button type="button" onClick={() => setShowFloatingAiToolbar(false)} className="p-1 hover:bg-slate-100 rounded text-slate-400 ml-1"><X className="w-3.5 h-3.5" /></button>
            </div>
          )}

          {/* Floating AI Assistant button */}
          <button
            type="button"
            onClick={() => setShowFloatingAiPanel(!showFloatingAiPanel)}
            className="fixed bottom-6 right-6 h-12 w-12 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all border border-blue-500 z-40 select-none group"
            title="AI Assistant Workspace"
          >
            <Sparkles className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </button>

          {/* Collapsible Floating AI Assistant Workspace panel */}
          {showFloatingAiPanel && (
            <div className="fixed bottom-20 right-6 w-96 bg-white border border-slate-200 rounded-2xl shadow-2xl z-40 p-4 select-none animate-in fade-in slide-in-from-bottom-4 duration-150 flex flex-col justify-between">
              
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-bold text-slate-800">Enterprise AI Assistant</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowFloatingAiPanel(false)}
                  className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-655 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 max-h-80 pr-1 custom-scrollbar mb-3 select-text">
                {aiMessages.map((msg, idx) => (
                  <div key={idx} className={`flex flex-col gap-1 ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`p-3 rounded-xl max-w-[85%] text-xs font-semibold leading-relaxed shadow-sm ${
                      msg.sender === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-50 border border-slate-200 text-slate-750'
                    }`}>
                      <p>{msg.text}</p>
                      
                      {msg.sender === 'ai' && idx > 0 && (
                        <div className="flex gap-2 mt-2 border-t border-slate-200/50 pt-2 select-none">
                          <button
                            type="button"
                            onClick={() => handleInsertAiResult(msg.text)}
                            className="text-[10px] text-blue-600 hover:text-blue-800 font-extrabold"
                          >
                            Insert at cursor
                          </button>
                          <span className="text-[10px] text-slate-350">|</span>
                          <button
                            type="button"
                            onClick={() => handleReplaceSelection(msg.text)}
                            className="text-[10px] text-blue-600 hover:text-blue-800 font-extrabold"
                          >
                            Replace selection
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {isAiGenerating && (
                  <div className="text-left">
                    <span className="inline-flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-400 text-[11px] font-bold">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-ping" />
                      <span>Writing response...</span>
                    </span>
                  </div>
                )}
              </div>

              <form onSubmit={handleSendAiMessage} className="border-t border-slate-100 pt-3 flex gap-2">
                <input
                  type="text"
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  placeholder="Ask AI Assistant anything..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.8 text-xs text-slate-750 focus:outline-none focus:bg-white focus:border-slate-350 font-semibold"
                />
                <button
                  type="submit"
                  className="p-1.8 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center transition-colors shadow-sm"
                >
                  <Send className="w-4.5 h-4.5" />
                </button>
              </form>

            </div>
          )}

        </div>

        {/* RIGHT PANEL: Collapsible Unified Sidebar */}
        {showRightPanel && (
          <aside className="w-80 border-l border-slate-200 bg-white shrink-0 overflow-y-auto flex flex-col justify-between custom-scrollbar select-none animate-in slide-in-from-right-4 duration-150">
            <div>
              {/* Tab Navigation header */}
              <div className="flex border-b border-slate-200 bg-slate-50/50 text-[10px] uppercase font-bold text-slate-450 select-none">
                {['properties', 'activity', 'comments', 'history'].map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setRightTab(tab as any)}
                    className={`flex-1 py-2.5 text-center border-b-2 transition-all truncate px-1 ${
                      rightTab === tab ? 'border-blue-600 text-blue-600 bg-white font-bold' : 'border-transparent text-slate-450 hover:text-slate-700'
                    }`}
                  >
                    {tab === 'history' ? 'Versions' : tab}
                  </button>
                ))}
              </div>

              {/* TAB 1: Properties */}
              {rightTab === 'properties' && (
                <div className="p-4 space-y-4 text-xs font-semibold text-slate-700 select-none animate-in fade-in duration-100">
                  <div>
                    <span className="text-[9.5px] uppercase font-extrabold text-slate-400 tracking-wider block mb-1.5">Document Details</span>
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2 text-slate-655 font-bold shadow-[inset_0_1px_1px_rgba(0,0,0,0.01)]">
                      <div className="flex justify-between">
                        <span className="text-slate-400">File Path:</span>
                        <span className="text-slate-750 truncate max-w-40" title={locationPath}>{locationPath}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Size:</span>
                        <span className="text-slate-750">12.4 KB</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Owner:</span>
                        <span className="text-slate-750">{ownerName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Revision:</span>
                        <span className="text-slate-750">{versionStr}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Last Edited:</span>
                        <span className="text-slate-750">{lastModifiedDate}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <span className="text-[9.5px] uppercase font-extrabold text-slate-400 tracking-wider block mb-1.5">Approval Status</span>
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between shadow-[inset_0_1px_1px_rgba(0,0,0,0.01)]">
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                        <span className="text-slate-800 font-bold uppercase text-[10.5px]">Draft</span>
                      </div>
                      <span className="text-[9.5px] text-slate-400">Review pending</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[9.5px] uppercase font-extrabold text-slate-400 tracking-wider block mb-1.5">Access Rights</span>
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2 shadow-[inset_0_1px_1px_rgba(0,0,0,0.01)]">
                      <div className="flex justify-between items-center text-[10.5px]">
                        <span className="font-bold text-slate-700">Super Admin (Arun)</span>
                        <span className="text-[9.5px] bg-blue-50 text-blue-600 border border-blue-100 rounded px-1 font-bold">OWNER</span>
                      </div>
                      <div className="flex justify-between items-center text-[10.5px]">
                        <span className="font-bold text-slate-700">Manager (Riwitika)</span>
                        <span className="text-[9.5px] text-slate-500 font-bold">EDITOR</span>
                      </div>
                      <div className="flex justify-between items-center text-[10.5px]">
                        <span className="font-bold text-slate-700">Employee (Paras)</span>
                        <span className="text-[9.5px] text-slate-500 font-bold">VIEWER</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <span className="text-[9.5px] uppercase font-extrabold text-slate-400 tracking-wider block mb-1.5">Description & Tags</span>
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2 shadow-[inset_0_1px_1px_rgba(0,0,0,0.01)]">
                      <p className="text-[10.5px] text-slate-550 leading-normal">{docDescription}</p>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {tagsList.map(tag => (
                          <span key={tag} className="text-[9.5px] bg-slate-100 border text-slate-500 px-1.5 py-0.2 rounded font-bold">{tag}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: Activity Log */}
              {rightTab === 'activity' && (
                <div className="p-4 space-y-3 select-none animate-in fade-in duration-100 text-xs font-semibold">
                  <span className="text-[9.5px] uppercase font-extrabold text-slate-400 tracking-wider block mb-1">System Audit Log</span>
                  
                  <div className="space-y-3.5 overflow-y-auto max-h-[65vh] pr-1 custom-scrollbar">
                    {activities.map((act, idx) => (
                      <div key={idx} className="flex gap-2.5 items-start text-xs font-semibold leading-normal bg-slate-50/55 border border-slate-200/50 rounded-xl p-2.5 shadow-sm">
                        <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-505 border text-[9.5px] shrink-0 font-bold">
                          {act.actor.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-slate-800 text-[11px]"><strong className="font-extrabold text-slate-900">{act.actor}</strong> {act.action}</p>
                          <span className="text-[9px] text-slate-450 block mt-0.5">{act.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: Comments */}
              {rightTab === 'comments' && (
                <div className="p-4 space-y-4 animate-in fade-in duration-100">
                  {/* Create Comment Form */}
                  <form onSubmit={handleAddComment} className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 shadow-[inset_0_1px_2px_rgba(0,0,0,0.01)] animate-in zoom-in-95 duration-100">
                    <span className="text-[9.5px] uppercase font-extrabold text-slate-400 tracking-wider">New comment thread</span>
                    
                    {selectedText && (
                      <div className="text-[10.5px] italic text-slate-500 bg-white border border-slate-200 rounded-lg px-2 py-1.5 mt-1 border-l-4 border-l-amber-400 truncate">
                        Linked: "{selectedText}"
                      </div>
                    )}

                    <textarea
                      value={newCommentVal}
                      onChange={(e) => setNewCommentVal(e.target.value)}
                      placeholder="Type comment details..."
                      className="w-full mt-2 bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-700 focus:outline-none focus:border-slate-350 resize-none h-16 font-semibold"
                    />
                    <div className="flex justify-end gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => { setSelectedRange(null); setSelectedText(''); setNewCommentVal(''); }}
                        className="px-2.5 py-1 text-[11px] font-bold text-slate-500 hover:text-slate-800"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold shadow-sm"
                      >
                        Comment
                      </button>
                    </div>
                  </form>

                  {/* Comments list items */}
                  <div className="space-y-3.5 overflow-y-auto max-h-[50vh] pr-1 custom-scrollbar">
                    {comments.length === 0 ? (
                      <div className="text-center py-12 text-slate-400 italic text-[11px] font-semibold">
                        No comment threads started.
                      </div>
                    ) : (
                      comments.map((comment) => (
                        <div key={comment.id} className={`border rounded-xl p-3 bg-white shadow-sm transition-all ${
                          comment.resolved ? 'border-slate-100 opacity-60' : 'border-slate-200'
                        }`}>
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-slate-800 text-[11.5px]">{comment.author}</span>
                            <span className="text-[9.5px] text-slate-400 font-bold">{comment.timestamp}</span>
                          </div>
                          <p className="text-[11.5px] text-slate-655 font-semibold leading-relaxed mt-1">{comment.content}</p>
                          
                          {comment.replies.map((reply, rid) => (
                            <div key={rid} className="mt-2 pl-3 border-l-2 border-slate-200 text-[11px] font-semibold">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-750">{reply.author}</span>
                                <span className="text-[8.5px] text-slate-400">{reply.timestamp}</span>
                              </div>
                              <p className="text-slate-555 leading-relaxed">{reply.content}</p>
                            </div>
                          ))}

                          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between gap-2 select-none">
                            <div className="flex gap-2 text-[9.5px] font-extrabold uppercase tracking-wide">
                              <button
                                type="button"
                                onClick={() => handleResolveComment(comment.id)}
                                className={comment.resolved ? 'text-slate-450 hover:text-slate-600' : 'text-emerald-600 hover:text-emerald-850'}
                              >
                                {comment.resolved ? 'Reopen' : 'Resolve'}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteComment(comment.id)}
                                className="text-red-600 hover:text-red-800"
                              >
                                Delete
                              </button>
                            </div>
                          </div>

                          {!comment.resolved && (
                            <div className="mt-2 flex gap-1.5 border-t border-slate-50 pt-2">
                              <input
                                type="text"
                                value={replyInputs[comment.id] || ''}
                                onChange={(e) => setReplyInputs(prev => ({ ...prev, [comment.id]: e.target.value }))}
                                placeholder="Reply..."
                                className="flex-1 bg-slate-50 border border-slate-200 rounded px-2 py-0.8 text-[10.5px] font-semibold text-slate-750 focus:outline-none focus:bg-white"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleReplyComment(comment.id, replyInputs[comment.id] || '');
                                  }
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => handleReplyComment(comment.id, replyInputs[comment.id] || '')}
                                className="p-1 bg-slate-105 hover:bg-slate-200 rounded text-slate-650"
                              >
                                <CornerDownLeft className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4: Versions log checkpoints */}
              {rightTab === 'history' && (
                <div className="p-4 space-y-3 select-none animate-in fade-in duration-100">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Revisions Log</span>
                    <button
                      type="button"
                      onClick={handleCreateVersionCheckpoint}
                      className="text-[10px] text-blue-600 hover:text-blue-800 font-extrabold"
                    >
                      + Save Checkpoint
                    </button>
                  </div>
                  
                  <div className="space-y-2 overflow-y-auto max-h-[65vh] pr-1 custom-scrollbar">
                    {versions.map((ver) => (
                      <div key={ver.id} className="border border-slate-200 rounded-xl p-3 bg-white hover:border-slate-350 transition-colors shadow-sm flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-slate-800 text-[11.5px]">{ver.version}</span>
                          <span className="text-[9.5px] text-slate-400 font-bold">{ver.timestamp}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10.5px] text-slate-550 font-semibold leading-none">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>Author: {ver.author}</span>
                        </div>
                        <div className="flex justify-end pt-1 border-t border-slate-100 mt-1 select-none">
                          <button
                            type="button"
                            onClick={() => handleRestoreVersion(ver)}
                            className="px-2.5 py-1 border border-slate-200 hover:bg-slate-50 text-[10.5px] font-bold text-slate-655 rounded-lg transition-colors flex items-center gap-1"
                          >
                            Restore Version
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50/50 text-[10px] text-slate-400 font-bold select-none text-center">
              Fast Trade KMS Secure File Server
            </div>
          </aside>
        )}
      </div>

      {/* SHARE MODAL OVERLAY */}
      {showShareModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-6 select-none animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-[520px] p-6 flex flex-col gap-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4.5 h-4.5 text-blue-600" />
                <span>Share "{docTitle}"</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowShareModal(false)}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Invite Collaborator Form */}
            <form onSubmit={handleInviteUser} className="space-y-3.5">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="Enter email address..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.8 text-xs text-slate-705 focus:outline-none focus:bg-white focus:border-slate-350"
                  />
                </div>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.8 text-xs text-slate-655 font-bold focus:outline-none cursor-pointer"
                >
                  <option value="Viewer">Viewer</option>
                  <option value="Editor">Editor</option>
                </select>
                <button
                  type="submit"
                  className="px-3 py-1.8 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs shadow-sm transition-colors"
                >
                  Invite
                </button>
              </div>
            </form>

            <div className="space-y-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">Who has access</span>
              <div className="divide-y divide-slate-50 max-h-36 overflow-y-auto pr-1 custom-scrollbar">
                <div className="py-2 flex items-center justify-between text-xs font-semibold">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-blue-100 text-blue-700 border flex items-center justify-center font-bold text-[9.5px]">AG</div>
                    <div>
                      <p className="text-slate-800">Arun Goyal</p>
                      <p className="text-[9.5px] text-slate-400 leading-none">superadmin@efasttrade.com</p>
                    </div>
                  </div>
                  <span className="text-slate-450 font-extrabold">Owner</span>
                </div>
                
                {shareEmails.map((emailText, idx) => (
                  <div key={idx} className="py-2 flex items-center justify-between text-xs font-semibold">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-slate-100 text-slate-650 border flex items-center justify-center font-bold text-[9.5px]">FT</div>
                      <div>
                        <p className="text-slate-855">{emailText.split(' ')[0]}</p>
                      </div>
                    </div>
                    <span className="text-slate-500">{emailText.includes('Editor') ? 'Editor' : 'Viewer'}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 flex flex-col gap-3 select-none">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-800">Public Link Sharing</span>
                  <span className="text-[10px] text-slate-400 font-semibold leading-none">Anyone with this link can view this asset</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={publicLinkEnabled}
                    onChange={(e) => setPublicLinkEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4.5 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-blue-600" />
                </label>
              </div>

              <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl p-2.5 mt-1.5">
                <span className="text-[10.5px] font-semibold text-slate-500 truncate w-72">
                  {window.location.origin}/public/documents/{docId}
                </span>
                
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-[10.5px] font-bold text-slate-655 flex items-center gap-1 shadow-sm shrink-0 transition-colors"
                >
                  {copiedShareLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-slate-450" />}
                  <span>{copiedShareLink ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
            
            <div className="flex justify-end pt-2 border-t border-slate-100 mt-2">
              <button
                type="button"
                onClick={() => setShowShareModal(false)}
                className="px-4 py-1.8 bg-slate-150 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
