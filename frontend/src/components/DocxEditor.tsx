import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Underline } from '@tiptap/extension-underline';
import { TextAlign } from '@tiptap/extension-text-align';
import { Link } from '@tiptap/extension-link';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import Highlight from '@tiptap/extension-highlight';
import { ResizableImage } from './editor/ResizableImageExtension';
import FontFamily from '@tiptap/extension-font-family';
import { FontSize } from './editor/FontSizeExtension';
import { TextFormatting } from './editor/TextFormattingExtension';
import { LineSpacing } from './editor/LineSpacingExtension';
import { ParagraphSpacing } from './editor/ParagraphSpacingExtension';
import { BlockIndent } from './editor/BlockIndentExtension';
import { Page } from './editor/PageExtension';
import { PageBreak } from './editor/PageBreakExtension';
import { PaginatedDocument } from './editor/PaginatedDocument';
import { AutoPagination } from './editor/AutoPaginationExtension';
import { PAGE_CONTENT_HEIGHT } from './editor/pageGeometry';

import EditorMenuBar from './editor/EditorMenuBar';
import EditorToolbar from './editor/EditorToolbar';
import EditorRuler from './editor/EditorRuler';
import WordCountModal from './editor/WordCountModal';
import FindReplaceModal from './editor/FindReplaceModal';
import ImageToolbar from './editor/ImageToolbar';
import LinkPopover from './editor/LinkPopover';
import { uploadDocumentAsset } from './editor/imageUpload';
import { ACCEPTED_IMAGE_TYPES } from './editor/imageConstants';
import { aiService } from '../services/aiService';
import {
  buildEditorQuestion,
  formatAiError,
  getEditorActionLabel,
  isAiUnavailableAnswer,
  requiresSelection,
  type EditorAiAction,
} from '../services/editorAiPrompts';

import { 
  Sparkles, 
  X, 
  Send, 
  Users, 
  Copy, 
  Check, 
  Star, 
  ArrowLeft,
  Plus,
  Trash2
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { api } from '../api/client';
import { useQueryClient } from '@tanstack/react-query';
import { sanitizeHtml } from '../utils/sanitize';

interface ActivityItem {
  actor: string;
  action: string;
  time: string;
}

interface AiMessage {
  sender: 'user' | 'ai';
  text: string;
  isError?: boolean;
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
  // Real UUID Regex check
  const isRealUUID = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(docId);

  // ----------------- STATE DECLARATIONS -----------------
  const [docTitle, setDocTitle] = useState(activeDoc?.name || 'Untitled document');
  const [saveStatus, setSaveStatus] = useState<'Saved ✓' | 'Saving...' | 'Save Failed' | 'Unsaved changes'>('Saved ✓');
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };
  const [previewingVersion, setPreviewingVersion] = useState<any | null>(null);

  // Google Docs View Options
  const [showRuler, setShowRuler] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(100);

  // Modal Dialog States
  const [showWordCountModal, setShowWordCountModal] = useState(false);
  const [showFindReplaceModal, setShowFindReplaceModal] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageUploadModeRef = useRef<'insert' | 'replace'>('insert');
  const aiSelectionRef = useRef<{ from: number; to: number } | null>(null);
  const selectedTextRef = useRef('');

  // Floating AI Assistant States
  const [showFloatingAiPanel, setShowFloatingAiPanel] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [showFloatingAiToolbar, setShowFloatingAiToolbar] = useState(false);
  const [floatingAiToolbarPos, setFloatingAiToolbarPos] = useState({ top: 0, left: 0 });
  const [showLinkPopover, setShowLinkPopover] = useState(false);
  const [linkPopoverPos, setLinkPopoverPos] = useState({ top: 0, left: 0 });
  const [imageToolbarPos, setImageToolbarPos] = useState({ top: 0, left: 0 });
  const [isImageSelected, setIsImageSelected] = useState(false);

  const [modalPrompt, setModalPrompt] = useState<{
    title: string;
    placeholder: string;
    defaultValue: string;
    onSubmit: (val: string) => void;
  } | null>(null);

  const [modalAlert, setModalAlert] = useState<{
    title: string;
    message: string;
  } | null>(null);

  const [modalTable, setModalTable] = useState<{
    onSubmit: (rows: number, cols: number) => void;
  } | null>(null);

  const customPrompt = (title: string, defaultValue: string, onSubmit: (val: string) => void, placeholder: string = "Enter value...") => {
    setModalPrompt({ title, defaultValue, onSubmit, placeholder });
  };
  const customAlert = (title: string, message: string) => {
    setModalAlert({ title, message });
  };

  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [aiMessages, setAiMessages] = useState<AiMessage[]>([
    {
      sender: 'ai',
      text: 'Hello! I am your AI Document Assistant. Ask about this document, select text for rewrite/improve actions, or use the quick actions below.',
    },
  ]);
  const [aiInput, setAiInput] = useState('');
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  // Share Modal Overlay State
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareEmails, setShareEmails] = useState<string[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('Viewer');
  const [publicLinkEnabled, setPublicLinkEnabled] = useState(false);
  const [copiedShareLink, setCopiedShareLink] = useState(false);

  const versionStr = activeDoc?.version || 'v1.0';
  const saveTimeoutRef = useRef<any | null>(null);
  const isProgrammaticUpdateRef = useRef(false);
  const isHydratingRef = useRef(true);
  const docIdRef = useRef(docId);
  const saveGenerationRef = useRef(0);
  const docTitleRef = useRef(docTitle);

  useEffect(() => {
    docIdRef.current = docId;
  }, [docId]);

  useEffect(() => {
    docTitleRef.current = docTitle;
  }, [docTitle]);

  useEffect(() => {
    saveGenerationRef.current += 1;
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
  }, [docId]);

  const EMPTY_EDITOR_CONTENT = '<div data-type="page" class="tiptap-page-sheet"><p></p></div>';

  const wrapHtmlForEditor = (html: string) => {
    const cleaned = html.trim();
    if (!cleaned) return EMPTY_EDITOR_CONTENT;
    if (cleaned.includes('data-type="page"')) return cleaned;
    return `<div data-type="page" class="tiptap-page-sheet">${cleaned}</div>`;
  };

  const resolveEditorContent = (content?: string | null) => {
    if (content && content.trim()) {
      return sanitizeHtml(wrapHtmlForEditor(content));
    }
    return EMPTY_EDITOR_CONTENT;
  };

  // ----------------- TIPTAP EDITOR INITIALIZATION -----------------
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        document: false,
        heading: { levels: [1, 2, 3, 4] },
      }),
      PaginatedDocument,
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph', 'blockquote'],
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline cursor-pointer',
        },
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      TextStyle,
      Color,
      FontFamily,
      FontSize,
      TextFormatting,
      LineSpacing,
      ParagraphSpacing,
      BlockIndent,
      Page,
      PageBreak,
      AutoPagination.configure({
        pageHeight: PAGE_CONTENT_HEIGHT,
      }),
      Highlight.configure({ multicolor: true }),
      ResizableImage,
    ],
    content: resolveEditorContent(activeDoc?.content),
    editable: !isLocked,
    onUpdate: ({ editor }) => {
      if (isHydratingRef.current || isProgrammaticUpdateRef.current) return;
      setSaveStatus('Unsaved changes');
      triggerAutosave(editor.getHTML());
    },
    onSelectionUpdate: ({ editor }) => {
      const { from, to } = editor.state.selection;

      if (editor.isActive('image')) {
        setIsImageSelected(true);
        setShowFloatingAiToolbar(false);
        setShowLinkPopover(false);
        const coords = editor.view.coordsAtPos(from);
        setImageToolbarPos({ top: coords.top - 48, left: coords.left });
        return;
      }

      setIsImageSelected(false);

      if (from !== to) {
        const text = editor.state.doc.textBetween(from, to, ' ');
        if (text.trim().length > 0) {
          setSelectedText(text.trim());
          selectedTextRef.current = text.trim();
          aiSelectionRef.current = { from, to };
          window.dispatchEvent(new CustomEvent('kms-editor-selection', {
            detail: { text: text.trim(), locationType: 'Paragraph' },
          }));
          const view = editor.view;
          const coords = view.coordsAtPos(from);
          setFloatingAiToolbarPos({
            top: coords.top - 42,
            left: coords.left
          });
          setShowFloatingAiToolbar(true);
        } else {
          setShowFloatingAiToolbar(false);
        }
      } else {
        setShowFloatingAiToolbar(false);
      }
    }
  });

  // Sync content when activeDoc changes
  useEffect(() => {
    if (!editor) return;
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    isHydratingRef.current = true;
    isProgrammaticUpdateRef.current = true;
    editor.commands.setContent(resolveEditorContent(activeDoc?.content), { emitUpdate: false });
    isProgrammaticUpdateRef.current = false;
    setDocTitle(activeDoc?.name || 'Untitled document');
    setSaveStatus('Saved ✓');

    const hydrateTimer = setTimeout(() => {
      isHydratingRef.current = false;
    }, 750);

    return () => {
      clearTimeout(hydrateTimer);
      isHydratingRef.current = true;
    };
  }, [docId, activeDoc?.content, editor]);

  // Sync editable state when isLocked changes
  useEffect(() => {
    if (editor) {
      editor.setEditable(!isLocked && !previewingVersion);
    }
  }, [isLocked, previewingVersion, editor]);

  // Broadcast document context to FloatingAIChat and handle cross-panel insert
  useEffect(() => {
    if (!editor) return;

    window.dispatchEvent(new CustomEvent('kms-active-document-change', {
      detail: {
        id: docId,
        title: docTitle,
        fileType: activeDoc?.fileType || 'DOCX',
        version: versionStr,
        fullContent: editor.getText(),
      },
    }));

    const handleAiInsert = (e: Event) => {
      const content = (e as CustomEvent).detail?.content;
      if (content && !isLocked && !previewingVersion) {
        editor.chain().focus().insertContent(content).run();
        triggerAutosave();
      }
    };

    window.addEventListener('kms-ai-insert-content', handleAiInsert);
    return () => window.removeEventListener('kms-ai-insert-content', handleAiInsert);
  }, [editor, docId, docTitle, activeDoc?.fileType, versionStr, isLocked, previewingVersion]);

  // ----------------- PERSIST TO BACKEND -----------------
  const persistDocument = async (htmlContent: string): Promise<boolean> => {
    const targetDocId = docIdRef.current;
    const generationAtStart = saveGenerationRef.current;

    if (!isRealUUID) {
      return false;
    }

    try {
      const payload: { content: string; name?: string } = { content: htmlContent };
      const trimmedTitle = docTitleRef.current.trim();
      if (trimmedTitle) {
        payload.name = trimmedTitle;
      }

      await api.documents.update(targetDocId, payload);

      if (generationAtStart !== saveGenerationRef.current) {
        return false;
      }

      queryClient.invalidateQueries({ queryKey: ['document', targetDocId] });
      queryClient.invalidateQueries({ queryKey: ['documents-list-workspace'] });
      return true;
    } catch (err) {
      console.error('Document save failed:', err);
      return false;
    }
  };

  const handleManualSave = async () => {
    if (!editor || isLocked) return;
    setSaveStatus('Saving...');
    const htmlContent = editor.getHTML();
    const ok = await persistDocument(htmlContent);
    if (ok) {
      setSaveStatus('Saved ✓');
      logActivity(user?.full_name || 'System', 'saved the document');
      showToast('Document saved');
    } else {
      setSaveStatus('Save Failed');
      customAlert('Save Failed', 'Could not save the document to the server. Please check your connection and try again.');
    }
  };

  // ----------------- AUTOSAVE DEBOUNCE -----------------
  const triggerAutosave = (contentToSave?: string) => {
    setSaveStatus('Unsaved changes');
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    const generationAtStart = saveGenerationRef.current;

    saveTimeoutRef.current = setTimeout(async () => {
      if (generationAtStart !== saveGenerationRef.current) return;

      const htmlContent = contentToSave ?? editor?.getHTML() ?? '';
      if (!htmlContent || !isRealUUID) return;

      setSaveStatus('Saving...');
      const ok = await persistDocument(htmlContent);

      if (generationAtStart !== saveGenerationRef.current) return;

      if (ok) {
        setSaveStatus('Saved ✓');
        logActivity(user?.full_name || 'System', 'edited the document content');
        window.dispatchEvent(new CustomEvent('kms-active-document-change', {
          detail: {
            id: docIdRef.current,
            title: docTitleRef.current,
            fileType: 'DOCX',
            version: versionStr,
            fullContent: editor ? editor.getText() : ''
          }
        }));
      } else {
        setSaveStatus('Save Failed');
      }
    }, 1000);
  };

  // Keyboard shortcut: manual save + link
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleManualSave();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        openLinkEditor();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editor, isLocked, docId]);

  // Real Image Upload Flow
  const handleImageFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;

    if (!isRealUUID) {
      customAlert('Upload Failed', 'Save the document to the backend before uploading images.');
      if (e.target) e.target.value = '';
      return;
    }

    try {
      setSaveStatus('Saving...');
      const asset = await uploadDocumentAsset(docIdRef.current, file);
      const mode = imageUploadModeRef.current;

      if (mode === 'replace' && editor.isActive('image')) {
        editor.chain().focus().replaceImageSrc(asset.url).run();
      } else {
        editor.chain().focus().setImage({ src: asset.url }).run();
      }

      showToast('Image uploaded and inserted successfully');
      triggerAutosave();
    } catch (err) {
      console.error('Image upload failed:', err);
      customAlert('Upload Failed', 'Could not upload image to the server. Please try again.');
    } finally {
      imageUploadModeRef.current = 'insert';
      if (e.target) e.target.value = '';
    }
  };

  const openImageUpload = (mode: 'insert' | 'replace' = 'insert') => {
    imageUploadModeRef.current = mode;
    fileInputRef.current?.click();
  };

  const openLinkEditor = () => {
    if (!editor) return;
    const { from } = editor.state.selection;
    const coords = editor.view.coordsAtPos(from);
    setLinkPopoverPos({ top: coords.top + 24, left: coords.left });
    setShowLinkPopover(true);
    setShowFloatingAiToolbar(false);
  };

  // ----------------- AI ACTIONS -----------------
  const captureAiSelection = () => {
    if (!editor) return;
    const { from, to } = editor.state.selection;
    aiSelectionRef.current = from !== to ? { from, to } : null;
    selectedTextRef.current = selectedTextRef.current || selectedText;
  };

  const triggerAiRequest = async (
    _action: EditorAiAction,
    userDisplay: string,
    apiQuestion: string,
  ) => {
    if (isAiGenerating) return;
    if (!apiQuestion.trim()) {
      customAlert('AI Document Assistant', 'Please enter a prompt.');
      return;
    }

    captureAiSelection();
    setAiMessages((prev) => [...prev, { sender: 'user', text: userDisplay }]);
    setIsAiGenerating(true);

    try {
      const response = await aiService.ask(apiQuestion, {
        mode: isRealUUID ? 'document' : 'repository',
        documentContext: {
          id: docId,
          title: docTitle,
          fileType: activeDoc?.fileType || 'DOCX',
          selectedText: selectedTextRef.current || undefined,
          fullContent: editor?.getText(),
        },
      });

      const unavailable = isAiUnavailableAnswer(response.answer);
      setAiMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: response.answer,
          isError: unavailable,
        },
      ]);

      if (!unavailable) {
        logActivity('AI Document Assistant', `Response for: "${userDisplay.substring(0, 40)}..."`);
      }
    } catch (err) {
      setAiMessages((prev) => [
        ...prev,
        { sender: 'ai', text: formatAiError(err), isError: true },
      ]);
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleSelectionAiAction = (action: EditorAiAction) => {
    if (requiresSelection(action) && !selectedText.trim()) {
      customAlert('AI Document Assistant', 'Please select text in the document first.');
      return;
    }

    setShowFloatingAiToolbar(false);
    setShowFloatingAiPanel(true);
    selectedTextRef.current = selectedText;
    captureAiSelection();

    const apiQuestion = buildEditorQuestion(action, '', selectedText);
    triggerAiRequest(action, getEditorActionLabel(action), apiQuestion);
  };

  const handleSendAiMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiInput.trim() || isAiGenerating) return;
    const userQuestion = aiInput.trim();
    setAiInput('');
    setShowFloatingAiPanel(true);
    const apiQuestion = buildEditorQuestion('ask', userQuestion, selectedTextRef.current || selectedText || undefined);
    triggerAiRequest('ask', userQuestion, apiQuestion);
  };

  const handleInsertAiResult = (text: string) => {
    if (!editor) return;
    editor.chain().focus().insertContent(` ${text} `).run();
    triggerAutosave();
  };

  const handleReplaceSelection = (text: string) => {
    if (!editor) return;
    const range = aiSelectionRef.current;
    if (range && range.from !== range.to) {
      editor.chain().focus().setTextSelection(range).insertContent(text).run();
    } else if (!editor.state.selection.empty) {
      editor.chain().focus().insertContent(text).run();
    } else {
      customAlert('AI Document Assistant', 'No text selection to replace.');
      return;
    }
    triggerAutosave();
  };

  const logActivity = (actor: string, action: string) => {
    const newAct: ActivityItem = { actor, action, time: 'Just now' };
    const updated = [newAct, ...activities];
    setActivities(updated);
    localStorage.setItem(`kms-doc-activity-${docId}`, JSON.stringify(updated));
  };

  // ----------------- CHECKPOINT REVISIONS -----------------
  const handleCreateVersionCheckpoint = async () => {
    if (!editor || isLocked) return;
    const currentHtml = editor.getHTML();

    if (!isRealUUID) {
      customAlert('Error', 'Version checkpoints require a saved backend document.');
      return;
    }

    try {
      setSaveStatus('Saving...');

      const saved = await persistDocument(currentHtml);
      if (!saved) {
        setSaveStatus('Save Failed');
        customAlert('Save Failed', 'Could not save the current document before creating a checkpoint.');
        return;
      }

      const safeName = docTitle.replace(/[^\w\s.-]/g, '_').trim() || 'document';
      const blob = new Blob([currentHtml], { type: 'text/html' });
      const formData = new FormData();
      formData.append('file', blob, `${safeName}.html`);

      const res = await api.documents.uploadVersion(docIdRef.current, formData);

      if (res?.id) {
        customAlert('Success', `Successfully registered revision checkpoint v${res.current_version}!`);
        queryClient.invalidateQueries({ queryKey: ['versions', docIdRef.current] });
        queryClient.invalidateQueries({ queryKey: ['documentVersions', docIdRef.current] });
        queryClient.invalidateQueries({ queryKey: ['document', docIdRef.current] });
        setSaveStatus('Saved ✓');
        logActivity(user?.full_name || 'System', `saved revision checkpoint v${res.current_version}`);
      } else {
        setSaveStatus('Save Failed');
        customAlert('Error', 'Could not save version checkpoint to server.');
      }
    } catch (err: any) {
      console.error('Failed to create revision checkpoint:', err);
      setSaveStatus('Save Failed');
      const detail = err?.message || 'Could not save version checkpoint to server.';
      if (err?.status === 403) {
        customAlert('Permission Denied', detail);
      } else {
        customAlert('Error', detail);
      }
    }
  };

  const handleRestoreVersion = async (ver: any) => {
    if (!editor) return;
    if (isRealUUID) {
      try {
        setSaveStatus('Saving...');
        const rawVersionData = await api.documents.viewVersion(docId, ver.version_number);
        if (rawVersionData && rawVersionData.content !== undefined) {
          const restoredHtml = rawVersionData.content;
          editor.commands.setContent(sanitizeHtml(restoredHtml));
          setPreviewingVersion(null);
          await api.documents.update(docId, { content: restoredHtml });
          queryClient.invalidateQueries({ queryKey: ['versions', docId] });
          queryClient.invalidateQueries({ queryKey: ['document', docId] });
          logActivity(user?.full_name || 'System', `Restored document contents to version v${ver.version_number}.0`);
          setSaveStatus('Saved ✓');
          customAlert('Success', `Restored document to version v${ver.version_number}.0 successfully!`);
        } else {
          customAlert('Error', 'Could not retrieve version content from storage.');
        }
      } catch {
        customAlert('Error', 'Failed to restore version from server.');
      }
    } else {
      const restoredHtml = ver.content || '';
      editor.commands.setContent(sanitizeHtml(restoredHtml));
      setPreviewingVersion(null);
      logActivity(user?.full_name || 'Riwitika Gupta', `Restored document contents to version ${ver.version}`);
      customAlert('Success', `Restored document to version ${ver.version} successfully!`);
    }
  };

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
    setIsLocked(!isLocked);
    customAlert('Security Status', isLocked ? 'Document unlocked.' : 'Document locked for write protection.');
  };

  const handleExportDocument = (format: 'txt' | 'html' | 'docx') => {
    if (!editor) return;
    const contentText = format === 'txt' ? editor.getText() : editor.getHTML();
    const blob = new Blob([contentText], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${docTitle.replace(/\s+/g, '_')}.${format}`;
    link.click();
    logActivity(user?.full_name || 'Riwitika Gupta', `Exported document file format: .${format}`);
    showToast(`Exported document as .${format}`);
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
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleImageFileSelect} 
        accept={ACCEPTED_IMAGE_TYPES} 
        className="hidden" 
      />

      {/* 1. TOP DOCUMENT TITLE & SAVE STATUS HEADER */}
      <header className="bg-white border-b border-slate-200 flex flex-col shrink-0 select-none z-20">
        <div className="px-4 py-1.5 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 min-w-0 flex-wrap">
            <button
              type="button"
              onClick={() => navigate('/documents')}
              className="p-1 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-lg transition-colors shrink-0"
              title="Back to Documents"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div className="h-6 w-6 rounded bg-blue-600 text-white flex items-center justify-center font-extrabold text-[11px] shrink-0 shadow-2xs">
              W
            </div>

            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-[10px] font-bold text-slate-400">Documents /</span>
              <input
                type="text"
                value={docTitle}
                onChange={(e) => {
                  setDocTitle(e.target.value);
                  triggerAutosave();
                }}
                className="font-bold text-xs text-slate-900 bg-transparent hover:bg-slate-50 focus:bg-white focus:border-slate-300 rounded px-1 py-0.5 border border-transparent transition-all outline-none truncate block max-w-[200px]"
                placeholder="Untitled document"
              />

              <button 
                type="button" 
                onClick={handleToggleFavorite}
                className={`p-0.5 rounded-full transition-colors ${isFavorite ? 'text-amber-500' : 'text-slate-330 hover:text-slate-500'}`}
                title="Star document"
              >
                <Star className={`w-3.5 h-3.5 ${isFavorite ? 'fill-amber-500' : ''}`} />
              </button>

              <div 
                onClick={() => customAlert('Auto-save Settings', 'Auto-save checkpoint configuration')}
                className="flex items-center gap-1 text-[8.5px] text-slate-500 font-bold bg-slate-50 border border-slate-200 rounded-full px-2 py-0.2 ml-0.5 cursor-pointer hover:bg-slate-100 shrink-0"
              >
                <span className={`h-1.5 w-1.5 rounded-full ${
                  saveStatus === 'Saving...' ? 'bg-amber-500 animate-pulse' :
                  saveStatus === 'Save Failed' ? 'bg-rose-500' : 'bg-emerald-500'
                }`} />
                <span>{saveStatus}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowShareModal(true)}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs shadow-sm transition-colors"
            >
              Share
            </button>
          </div>
        </div>

        {/* 2. GOOGLE DOCS-STYLE MENU BAR (File / Edit / View / Insert / Format / Tools / Help) */}
        <EditorMenuBar
          editor={editor}
          docTitle={docTitle}
          isLocked={isLocked}
          showRuler={showRuler}
          zoomLevel={zoomLevel}
          onToggleLock={handleToggleLock}
          onManualSave={handleManualSave}
          onSaveCheckpoint={handleCreateVersionCheckpoint}
          onExport={handleExportDocument}
          onToggleRuler={() => setShowRuler(!showRuler)}
          onSetZoom={setZoomLevel}
          onOpenImageUpload={() => openImageUpload('insert')}
          onOpenTableModal={() => {
            setModalTable({
              onSubmit: (rows, cols) => {
                editor?.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run();
              }
            });
          }}
          onOpenFindReplace={() => setShowFindReplaceModal(true)}
          onOpenWordCount={() => setShowWordCountModal(true)}
          onOpenAiPanel={() => setShowFloatingAiPanel(true)}
          onShowShortcuts={() => customAlert('Keyboard Shortcuts', '⌘B: Bold, ⌘I: Italic, ⌘U: Underline, ⌘Z: Undo, ⌘Y: Redo, ⌘K: Link, ⌘F: Search, ⌘Enter: Page Break')}
        />

        {/* 3. GOOGLE DOCS-STYLE FORMATTING TOOLBAR */}
        <EditorToolbar
          editor={editor}
          zoomLevel={zoomLevel}
          onSetZoom={setZoomLevel}
          onOpenImageUpload={() => openImageUpload('insert')}
          onOpenTableModal={() => {
            setModalTable({
              onSubmit: (rows, cols) => {
                editor?.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run();
              }
            });
          }}
          customPrompt={customPrompt}
          onOpenLinkEditor={openLinkEditor}
        />

        {/* SUB-TOOLBAR FOR ACTIVE TABLE OPERATIONS */}
        {editor && editor.isActive('table') && (
          <div className="bg-blue-50/90 border-t border-blue-200 px-4 py-1 flex items-center gap-1.5 flex-wrap shrink-0 select-none text-[11px] font-bold text-blue-800">
            <span className="text-[10px] text-blue-600 uppercase tracking-wider">Table Actions:</span>
            <button
              type="button"
              onClick={() => editor.chain().focus().addColumnBefore().run()}
              className="px-2 py-0.5 bg-white border border-blue-200 hover:bg-blue-100 rounded text-blue-700 shadow-2xs flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> Col Left
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().addColumnAfter().run()}
              className="px-2 py-0.5 bg-white border border-blue-200 hover:bg-blue-100 rounded text-blue-700 shadow-2xs flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> Col Right
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().deleteColumn().run()}
              className="px-2 py-0.5 bg-white border border-blue-200 hover:bg-rose-50 text-rose-600 rounded shadow-2xs flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" /> Delete Col
            </button>
            <span className="text-blue-300">|</span>
            <button
              type="button"
              onClick={() => editor.chain().focus().addRowBefore().run()}
              className="px-2 py-0.5 bg-white border border-blue-200 hover:bg-blue-100 rounded text-blue-700 shadow-2xs flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> Row Above
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().addRowAfter().run()}
              className="px-2 py-0.5 bg-white border border-blue-200 hover:bg-blue-100 rounded text-blue-700 shadow-2xs flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> Row Below
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().deleteRow().run()}
              className="px-2 py-0.5 bg-white border border-blue-200 hover:bg-rose-50 text-rose-600 rounded shadow-2xs flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" /> Delete Row
            </button>
            <span className="text-blue-300">|</span>
            <button
              type="button"
              onClick={() => editor.chain().focus().deleteTable().run()}
              className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded shadow-2xs flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" /> Remove Table
            </button>
          </div>
        )}
      </header>

      {/* 4. WORKSPACE CONTAINER */}
      <div className="flex-1 flex overflow-hidden relative w-full overflow-x-hidden">
        
        {/* CENTER WORKSPACE: Tiptap Canvas */}
        <div className="flex-1 bg-slate-100/70 overflow-y-auto flex flex-col justify-start relative select-text custom-scrollbar px-6 py-4">
          
          {/* Optional Ruler Bar */}
          {showRuler && <EditorRuler />}

          {previewingVersion && (
            <div className="bg-slate-900 text-white px-6 py-3 shrink-0 flex items-center justify-between shadow-md select-none rounded-t mt-2 w-full max-w-[920px] mx-auto">
              <div className="flex items-center gap-2">
                <span className="bg-blue-600 text-[9px] px-2 py-0.5 rounded font-extrabold uppercase tracking-wider">Preview Mode</span>
                <span className="text-[10px] font-semibold text-slate-300">Viewing revision: <strong className="text-white">{previewingVersion.version}</strong></span>
              </div>
              <div className="flex items-center gap-2 text-[10px]">
                <button
                  type="button"
                  onClick={() => handleRestoreVersion(previewingVersion)}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-lg shadow-sm uppercase tracking-wider text-[9px]"
                >
                  Restore Version
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewingVersion(null)}
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-extrabold rounded-lg uppercase tracking-wider text-[9px]"
                >
                  Exit Preview
                </button>
              </div>
            </div>
          )}
          
          {/* Centered Document Workspace Canvas */}
          <div 
            className="w-full max-w-[920px] mx-auto mt-2 mb-10 relative transition-all duration-200 origin-top shrink-0"
            style={{ transform: `scale(${zoomLevel / 100})` }}
          >
            {editor ? (
              <EditorContent editor={editor} className="prose max-w-none focus:outline-none" />
            ) : (
              <div className="p-8 text-center text-slate-400 font-semibold text-xs animate-pulse">
                Loading Tiptap editor engine...
              </div>
            )}
          </div>

          {/* Floating image toolbar */}
          {editor && isImageSelected && (
            <div
              className="fixed z-[99998] select-none"
              style={{ top: `${imageToolbarPos.top}px`, left: `${imageToolbarPos.left}px` }}
            >
              <ImageToolbar
                editor={editor}
                onReplace={() => openImageUpload('replace')}
              />
            </div>
          )}

          {/* Floating link editor */}
          {editor && showLinkPopover && (
            <div
              className="fixed z-[99998] select-none"
              style={{ top: `${linkPopoverPos.top}px`, left: `${linkPopoverPos.left}px` }}
            >
              <LinkPopover editor={editor} onClose={() => setShowLinkPopover(false)} />
            </div>
          )}

          {/* Floating selection AI toolbar */}
          {showFloatingAiToolbar && (
            <div 
              className="fixed bg-white border border-slate-200 shadow-xl rounded-xl py-1 px-1.5 z-[99999] flex items-center gap-1 text-[11px] font-bold text-slate-600 select-none animate-in fade-in duration-100"
              style={{ 
                top: `${floatingAiToolbarPos.top}px`, 
                left: `${floatingAiToolbarPos.left}px` 
              }}
            >
              <div className="p-1 text-blue-600 bg-blue-50 rounded-lg select-none flex items-center justify-center shrink-0">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <span className="text-[9.5px] text-slate-400 font-bold mr-1 border-r border-slate-100 pr-1.5">AI</span>
              
              <button type="button" onClick={() => handleSelectionAiAction('summarize')} className="px-2 py-1 hover:bg-slate-50 rounded">Summarize</button>
              <button type="button" onClick={() => handleSelectionAiAction('rewrite')} className="px-2 py-1 hover:bg-slate-50 rounded">Rewrite</button>
              <button type="button" onClick={() => handleSelectionAiAction('improve')} className="px-2 py-1 hover:bg-slate-50 rounded">Improve</button>
              <button type="button" onClick={() => handleSelectionAiAction('explain')} className="px-2 py-1 hover:bg-slate-50 rounded">Explain</button>
              <button type="button" onClick={() => handleSelectionAiAction('shorter')} className="px-2 py-1 hover:bg-slate-50 rounded">Shorter</button>
              <button type="button" onClick={() => handleSelectionAiAction('longer')} className="px-2 py-1 hover:bg-slate-50 rounded">Longer</button>
              <button type="button" onClick={() => handleSelectionAiAction('tone')} className="px-2 py-1 hover:bg-slate-50 rounded">Tone</button>
              
              <button type="button" onClick={() => setShowFloatingAiToolbar(false)} className="p-1 hover:bg-slate-100 rounded text-slate-400 ml-1"><X className="w-3.5 h-3.5" /></button>
            </div>
          )}

          {/* Floating AI Assistant button */}
          <button
            type="button"
            onClick={() => setShowFloatingAiPanel(!showFloatingAiPanel)}
            className="fixed bottom-6 right-6 h-12 w-12 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all border border-blue-500 z-40 select-none group"
            title="AI Document Assistant"
          >
            <Sparkles className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </button>

          {/* AI Document Assistant panel */}
          {showFloatingAiPanel && (
            <div className="fixed bottom-20 right-6 w-96 bg-white border border-slate-200 rounded-2xl shadow-2xl z-40 p-4 select-none animate-in fade-in duration-150 flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-bold text-slate-800">AI Document Assistant</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowFloatingAiPanel(false)}
                  className="p-1 hover:bg-slate-100 rounded text-slate-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-wrap gap-1 mb-2">
                {([
                  ['summarize', 'Summarize doc'],
                  ['improve', 'Improve'],
                  ['rewrite', 'Rewrite'],
                  ['explain', 'Explain'],
                  ['shorter', 'Shorter'],
                  ['longer', 'Longer'],
                  ['tone', 'Professional tone'],
                ] as const).map(([action, label]) => (
                  <button
                    key={action}
                    type="button"
                    disabled={isAiGenerating}
                    onClick={() => handleSelectionAiAction(action)}
                    className="px-2 py-0.5 text-[10px] font-bold rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-50"
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 max-h-80 pr-1 custom-scrollbar mb-3 select-text">
                {aiMessages.map((msg, idx) => (
                  <div key={idx} className={`flex flex-col gap-1 ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`p-3 rounded-xl max-w-[85%] text-xs font-semibold leading-relaxed shadow-sm ${
                      msg.sender === 'user'
                        ? 'bg-blue-600 text-white'
                        : msg.isError
                          ? 'bg-red-50 border border-red-200 text-red-700'
                          : 'bg-slate-50 border border-slate-200 text-slate-750'
                    }`}>
                      <p>{msg.text}</p>
                      {msg.sender === 'ai' && !msg.isError && idx > 0 && (
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
                    <span className="inline-flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 text-[11px] font-bold">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-ping" />
                      <span>AI Document Assistant is generating a response...</span>
                    </span>
                  </div>
                )}
              </div>

              <form onSubmit={handleSendAiMessage} className="border-t border-slate-100 pt-3 flex gap-2">
                <input
                  type="text"
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  disabled={isAiGenerating}
                  placeholder="Ask AI Document Assistant..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.8 text-xs text-slate-750 focus:outline-none focus:bg-white font-semibold disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={isAiGenerating || !aiInput.trim()}
                  className="p-1.8 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg flex items-center justify-center transition-colors shadow-sm"
                >
                  <Send className="w-4.5 h-4.5" />
                </button>
              </form>
            </div>
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

            <form onSubmit={handleInviteUser} className="space-y-3.5">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="Enter email address..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.8 text-xs text-slate-705 focus:outline-none focus:bg-white"
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

      {/* Custom Prompt Modal */}
      {modalPrompt && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-6 select-none animate-in fade-in duration-200">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              const val = (e.currentTarget.elements.namedItem('prompt-value') as HTMLInputElement).value;
              modalPrompt.onSubmit(val);
              setModalPrompt(null);
            }}
            className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-[400px] overflow-hidden flex flex-col"
          >
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <span className="font-extrabold text-sm text-slate-900">{modalPrompt.title}</span>
              <button type="button" onClick={() => setModalPrompt(null)} className="text-slate-400 hover:text-slate-600 text-xs font-bold">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <input
                type="text"
                name="prompt-value"
                autoFocus
                defaultValue={modalPrompt.defaultValue}
                placeholder={modalPrompt.placeholder}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:bg-white text-slate-855 font-semibold"
              />
            </div>
            <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-2">
              <button type="button" onClick={() => setModalPrompt(null)} className="px-4 py-2 border border-slate-200 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-600 bg-white">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm">Submit</button>
            </div>
          </form>
        </div>
      )}

      {/* Custom Alert Modal */}
      {modalAlert && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-6 select-none animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-[400px] overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <span className="font-extrabold text-sm text-slate-900">{modalAlert.title}</span>
              <button type="button" onClick={() => setModalAlert(null)} className="text-slate-400 hover:text-slate-600 text-xs font-bold">✕</button>
            </div>
            <div className="p-6">
              <p className="text-xs text-slate-650 leading-relaxed font-semibold">{modalAlert.message}</p>
            </div>
            <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
              <button type="button" onClick={() => setModalAlert(null)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm">OK</button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Table Modal */}
      {modalTable && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-6 select-none animate-in fade-in duration-200">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              const rows = Number((e.currentTarget.elements.namedItem('table-rows') as HTMLInputElement).value);
              const cols = Number((e.currentTarget.elements.namedItem('table-cols') as HTMLInputElement).value);
              modalTable.onSubmit(rows, cols);
              setModalTable(null);
            }}
            className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-[400px] overflow-hidden flex flex-col"
          >
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <span className="font-extrabold text-sm text-slate-900">Insert Table</span>
              <button type="button" onClick={() => setModalTable(null)} className="text-slate-400 hover:text-slate-600 text-xs font-bold">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Rows</label>
                  <input
                    type="number"
                    name="table-rows"
                    min="1"
                    max="20"
                    defaultValue="3"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:bg-white text-slate-855 font-semibold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Columns</label>
                  <input
                    type="number"
                    name="table-cols"
                    min="1"
                    max="20"
                    defaultValue="3"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:bg-white text-slate-855 font-semibold"
                  />
                </div>
              </div>
            </div>
            <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-2">
              <button type="button" onClick={() => setModalTable(null)} className="px-4 py-2 border border-slate-200 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-600 bg-white">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm">Insert</button>
            </div>
          </form>
        </div>
      )}

      {/* Word Count Modal */}
      {showWordCountModal && (
        <WordCountModal
          text={editor ? editor.getText() : ''}
          html={editor ? editor.getHTML() : ''}
          onClose={() => setShowWordCountModal(false)}
        />
      )}

      {/* Find and Replace Modal */}
      {showFindReplaceModal && (
        <FindReplaceModal
          editor={editor}
          onClose={() => setShowFindReplaceModal(false)}
        />
      )}

      {toastMsg && (
        <div className="fixed bottom-6 left-6 bg-slate-900 text-white rounded-xl py-3 px-4 shadow-2xl z-[99999] flex items-center gap-2 animate-in fade-in slide-in-from-bottom-5 duration-200 text-xs font-bold select-none border border-slate-800">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
          <span>{toastMsg}</span>
        </div>
      )}

      </div>
    </div>
  );
}
