import { useState, useRef, useEffect } from 'react';
import { 
  Undo2, 
  Redo2, 
  Printer, 
  Paintbrush, 
  Bold, 
  Italic, 
  Underline, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  List, 
  ListOrdered, 
  Link2, 
  Table, 
  Minus,
  Sparkles,
  CheckSquare,
  Image,
  AlignJustify,
  RemoveFormatting,
  Heading1,
  Heading2,
  Calendar,
  Quote,
  Code,
  MessageSquare,
  ChevronDown,
  Search,
  Plus,
  Indent as IndentIcon,
  Outdent as OutdentIcon,
  MoreHorizontal,
  Highlighter
} from 'lucide-react';

type SaveStatus = 'Saving...' | 'Saved just now' | 'All changes saved' | 'Offline' | 'Unsaved Changes';

const FONT_FAMILIES = [
  'Arial',
  'Calibri',
  'Inter',
  'Roboto',
  'Open Sans',
  'Times New Roman',
  'Georgia',
  'Verdana',
  'Tahoma',
  'Courier New',
  'Poppins',
  'Montserrat',
  'Lato',
  'Trebuchet MS'
];

const RECENT_FONTS = ['Inter', 'Calibri', 'Arial'];
const FAVORITE_FONTS = ['Roboto', 'Montserrat', 'Lato'];

const FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 36, 48, 60, 72, 96];

const PALETTE_COLORS = [
  { name: 'Black', hex: '#0f172a' },
  { name: 'Slate', hex: '#64748b' },
  { name: 'Red', hex: '#ef4444' },
  { name: 'Orange', hex: '#f97316' },
  { name: 'Amber', hex: '#f59e0b' },
  { name: 'Emerald', hex: '#10b981' },
  { name: 'Blue', hex: '#3b82f6' },
  { name: 'Purple', hex: '#8b5cf6' }
];

const getTemplateContent = (path: string) => {
  const lowercasePath = path.toLowerCase();
  
  if (lowercasePath.includes('meeting-minutes')) {
    return (
      <div>
        <h1 className="text-2xl font-black text-slate-900 border-b border-slate-150 pb-2 tracking-tight select-all">
          Meeting Minutes: Project Sync
        </h1>
        <div className="bg-slate-50 border rounded-xl p-3 text-[11px] text-slate-655 font-bold space-y-1 my-3">
          <div><strong>Date:</strong> {new Date().toLocaleDateString()}</div>
          <div><strong>Attendees:</strong> Rahul, Amit, Priyesh, Sarah</div>
          <div><strong>Facilitator:</strong> Amit Verma</div>
        </div>
        <h2 className="text-sm font-extrabold text-slate-800 tracking-tight pt-2">1. Meeting Agenda</h2>
        <p>Review current design deliverables, timeline alignment, and next sprint tasks.</p>
        <h2 className="text-sm font-extrabold text-slate-800 tracking-tight pt-2">2. Key Discussions</h2>
        <ul className="list-disc pl-5 space-y-2 text-slate-700">
          <li>Engineering updates: completed core workspace components and sidebar persistence.</li>
          <li>Design feedback: make the properties drawer collapsable and save options easier to locate.</li>
        </ul>
        <h2 className="text-sm font-extrabold text-slate-800 tracking-tight pt-2">3. Action Items</h2>
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center gap-2"><input type="checkbox" defaultChecked className="rounded text-blue-600 border-slate-300" /> <span className="text-slate-700 font-semibold">Upgrade font control searchable popover</span></div>
          <div className="flex items-center gap-2"><input type="checkbox" className="rounded text-blue-600 border-slate-300" /> <span className="text-slate-700 font-semibold">Persist properties sidebar status</span></div>
        </div>
      </div>
    );
  }

  if (lowercasePath.includes('nda')) {
    return (
      <div>
        <h1 className="text-2xl font-black text-slate-900 border-b border-slate-150 pb-2 tracking-tight select-all">
          Non-Disclosure Agreement (NDA)
        </h1>
        <p className="italic text-slate-500 my-3">This Mutual Non-Disclosure Agreement ("Agreement") is entered into on {new Date().toLocaleDateString()} between FastTrade Corp and the Undersigned Partner.</p>
        <h2 className="text-sm font-extrabold text-slate-800 tracking-tight pt-2">1. Confidential Information</h2>
        <p>Confidential Information refers to proprietary specifications, code, designs, and business workflows shared during meetings.</p>
        <h2 className="text-sm font-extrabold text-slate-800 tracking-tight pt-2">2. Obligations</h2>
        <p>The receiving party agrees to hold all confidential information in strict confidence and shall not disclose it to any third party without written consent.</p>
        <h2 className="text-sm font-extrabold text-slate-800 tracking-tight pt-2">3. Signatures</h2>
        <div className="grid grid-cols-2 gap-8 pt-6">
          <div className="border-t border-slate-300 pt-2">
            <div className="font-extrabold text-slate-800">FastTrade Corp Representative</div>
            <div className="text-[10px] text-slate-500">Authorized Signature</div>
          </div>
          <div className="border-t border-slate-300 pt-2">
            <div className="font-extrabold text-slate-800">Partner Representative</div>
            <div className="text-[10px] text-slate-500">Authorized Signature</div>
          </div>
        </div>
      </div>
    );
  }

  if (lowercasePath.includes('proposal')) {
    return (
      <div>
        <h1 className="text-2xl font-black text-slate-900 border-b border-slate-150 pb-2 tracking-tight select-all">
          Project Proposal Outline
        </h1>
        <h2 className="text-sm font-extrabold text-slate-800 tracking-tight pt-2">1. Project Overview</h2>
        <p>Provide a high-level summary of the business need, goals, and solution proposal.</p>
        <h2 className="text-sm font-extrabold text-slate-800 tracking-tight pt-2">2. Scope of Work</h2>
        <p>Enumerate key features, requirements, deliverables, and engineering sprints.</p>
        <h2 className="text-sm font-extrabold text-slate-800 tracking-tight pt-2">3. Budget & Resource Estimates</h2>
        <p>Detail departmental budgets, labor estimates, and timeline constraints.</p>
      </div>
    );
  }

  if (lowercasePath.includes('sop')) {
    return (
      <div>
        <h1 className="text-2xl font-black text-slate-900 border-b border-slate-150 pb-2 tracking-tight select-all">
          Standard Operating Procedure (SOP)
        </h1>
        <h2 className="text-sm font-extrabold text-slate-800 tracking-tight pt-2">1. Purpose & Scope</h2>
        <p>Outline the purpose of this SOP and the departments that must strictly comply with its instructions.</p>
        <h2 className="text-sm font-extrabold text-slate-800 tracking-tight pt-2">2. Procedure Steps</h2>
        <ol className="list-decimal pl-5 space-y-2 text-slate-700 my-3">
          <li>Verify client details and contract completeness.</li>
          <li>Log project metadata into the FastTrade KMS catalog folder.</li>
          <li>Trigger automated compliance checking scripts.</li>
        </ol>
      </div>
    );
  }

  if (lowercasePath.includes('technical-doc') || lowercasePath.includes('technical-documentation')) {
    return (
      <div>
        <h1 className="text-2xl font-black text-slate-900 border-b border-slate-150 pb-2 tracking-tight select-all">
          Technical Design Specification
        </h1>
        <h2 className="text-sm font-extrabold text-slate-800 tracking-tight pt-2">1. Architecture Overview</h2>
        <p>This technical guide details the cloud microservices architecture for the Enterprise Knowledge Management System.</p>
        <pre className="bg-slate-50 border border-slate-200 rounded-xl p-4 font-mono text-[10.5px] text-slate-700 my-3">
{`const config = {
  kmsServiceUrl: "https://api.kms.fasttrade.com",
  timeout: 5000,
  retryStrategy: "ExponentialBackoff"
};`}
        </pre>
        <h2 className="text-sm font-extrabold text-slate-800 tracking-tight pt-2">2. Data Models</h2>
        <p>Database structure templates represent relational configurations for Template Versions and Template Favorites.</p>
      </div>
    );
  }

  if (lowercasePath.includes('hr-policy')) {
    return (
      <div>
        <h1 className="text-2xl font-black text-slate-900 border-b border-slate-150 pb-2 tracking-tight select-all">
          HR Policy Guidebook
        </h1>
        <h2 className="text-sm font-extrabold text-slate-800 tracking-tight pt-2">1. Code of Conduct</h2>
        <p>All employees are expected to maintain professional standards of behavior, collaboration, and confidentiality.</p>
        <h2 className="text-sm font-extrabold text-slate-800 tracking-tight pt-2">2. Work From Home Policy</h2>
        <p>FastTrade supports hybrid working modes depending on role guidelines. Standard core collaboration hours are 10 AM to 4 PM.</p>
      </div>
    );
  }

  if (lowercasePath.includes('blank')) {
    return (
      <div>
        <h1 className="text-2xl font-black text-slate-900 border-b border-slate-150 pb-2 tracking-tight select-all">
          Untitled Document
        </h1>
        <p className="text-slate-400 my-4">Start typing your document content here...</p>
      </div>
    );
  }

  // Default fallback (e.g. Budget report)
  return (
    <div>
      <h1 className="text-2xl font-black text-slate-900 border-b border-slate-150 pb-2 tracking-tight select-all">
        Q2 Budget Report
      </h1>
      <h2 className="text-sm font-extrabold text-slate-800 tracking-tight pt-2">
        1. Executive Summary
      </h2>
      <p>
        This report provides a comprehensive overview of the financial performance and budget allocations for Q2 2024. During this timeframe, engineering expenditures grew due to scheduled infrastructure upgrades. General operations remained flat, matching prior projections.
      </p>
      <h2 className="text-sm font-extrabold text-slate-800 tracking-tight pt-2">
        2. Key Highlights
      </h2>
      <ul className="list-disc pl-5 space-y-2 text-slate-700">
        <li>Total revenue increased by 18% compared to Q1.</li>
        <li>Operational expenses are within the planned budget constraints.</li>
        <li>Net profit shows a growth of 22%.</li>
      </ul>
      <p className="pt-2">
        Further audits will be conducted by mid-June to verify that compliance guidelines are fully met for all operations. Recommended cost optimizations will be applied starting in Q3.
      </p>
    </div>
  );
};

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
  };
}

export default function DocxEditor({ activeDoc }: DocxEditorProps = {}) {
  const [fontSizeVal, setFontSizeVal] = useState(11);
  const [fontFamily, setFontFamily] = useState('Inter');
  const [zoomPercent, setZoomPercent] = useState('100');
  const [lineSpacing, setLineSpacing] = useState('1.15');

  // Custom searchable Font selector states
  const [showFontDropdown, setShowFontDropdown] = useState(false);
  const [fontSearchQuery, setFontSearchQuery] = useState('');
  
  // Custom Color picker states
  const [showTextColorGrid, setShowTextColorGrid] = useState(false);
  const [showHighlightColorGrid, setShowHighlightColorGrid] = useState(false);

  // Custom Font Size Selector state
  const [showFontSizeDropdown, setShowFontSizeDropdown] = useState(false);

  // Auto Save indicator state
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('All changes saved');
  const saveTimeoutRef = useRef<any | null>(null);
  const nextStatusTimeoutRef = useRef<any | null>(null);

  // Content Editable area state
  const editorRef = useRef<HTMLDivElement>(null);
  const [wordCount, setWordCount] = useState(240);

  // Slash commands menu state
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashMenuPos, setSlashMenuPos] = useState({ top: 0, left: 0 });

  // Custom dropdown click outsides
  const fontDropdownRef = useRef<HTMLDivElement>(null);
  const fontSizeRef = useRef<HTMLDivElement>(null);
  const textColorRef = useRef<HTMLDivElement>(null);
  const highlightColorRef = useRef<HTMLDivElement>(null);

  // Responsive Toolbar Width State (Hides options if screen is narrow)
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [showMoreActionsMenu, setShowMoreActionsMenu] = useState(false);
  const moreActionsRef = useRef<HTMLDivElement>(null);

  // Text selection AI toolbar states
  const [selectedText, setSelectedText] = useState('');
  const [selectedRange, setSelectedRange] = useState<Range | null>(null);
  const [showFloatingAiToolbar, setShowFloatingAiToolbar] = useState(false);
  const [floatingAiToolbarPos, setFloatingAiToolbarPos] = useState({ top: 0, left: 0 });
  const floatingAiRef = useRef<HTMLDivElement>(null);

  // Load initial document meta context
  useEffect(() => {
    const title = activeDoc?.name || 'Untitled Document';
    const contextDetail = {
      title,
      fileType: activeDoc?.fileType || 'DOCX',
      department: activeDoc?.locationPath?.split('/')[1] || 'Operations',
      owner: activeDoc?.ownerName || 'Amit Verma',
      tags: activeDoc?.tags || [],
      version: activeDoc?.version || 'v1.0',
      fullContent: editorRef.current?.innerText || ''
    };
    
    window.dispatchEvent(new CustomEvent('kms-active-document-change', {
      detail: contextDetail
    }));
  }, [activeDoc]);

  // Click outside to close Selection AI toolbar
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (floatingAiRef.current && !floatingAiRef.current.contains(e.target as Node)) {
        setShowFloatingAiToolbar(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Text selection change listener
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
            top: rect.top - 42,
            left: rect.left + (rect.width / 2) - 180
          });
          setShowFloatingAiToolbar(true);
          
          // Notify AI Chat
          window.dispatchEvent(new CustomEvent('kms-editor-selection', {
            detail: { text }
          }));
        } else {
          setShowFloatingAiToolbar(false);
          setSelectedText('');
          setSelectedRange(null);
          window.dispatchEvent(new CustomEvent('kms-editor-selection', {
            detail: { text: '' }
          }));
        }
      }
    }, 50);
  };

  const handleSelectionAiAction = (action: string) => {
    setShowFloatingAiToolbar(false);
    
    // Open floating AI assistant panel first
    window.dispatchEvent(new CustomEvent('kms-close-layout-dropdowns'));
    
    // Construct query prompt
    let prompt = '';
    switch (action) {
      case 'Explain':
        prompt = `Explain the following text highlighted in the editor: "${selectedText}"`;
        break;
      case 'Rewrite':
        prompt = `Rewrite this section professionally: "${selectedText}"`;
        break;
      case 'Summarize':
        prompt = `Summarize this selected text: "${selectedText}"`;
        break;
      case 'Improve':
        prompt = `Improve the grammar, structure and tone of this text: "${selectedText}"`;
        break;
      case 'Translate':
        prompt = `Translate the following highlighted text to Spanish: "${selectedText}"`;
        break;
      case 'Continue Writing':
        prompt = `Continue writing this section based on the current context: "${selectedText}"`;
        break;
      default:
        prompt = `${action} this text: "${selectedText}"`;
    }

    // Trigger AI Chat with this prompt
    window.dispatchEvent(new CustomEvent('trigger-floating-ai', {
      detail: prompt
    }));
  };

  // Listen to Insert and Replace events from the AI Assistant response buttons
  useEffect(() => {
    const handleInsert = (e: Event) => {
      const customEvent = e as CustomEvent;
      const content = customEvent.detail.content;

      if (editorRef.current) {
        editorRef.current.focus();
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          range.deleteContents();
          
          // Create temp div to parse possible html structure
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = content;
          const fragment = document.createDocumentFragment();
          while (tempDiv.firstChild) {
            fragment.appendChild(tempDiv.firstChild);
          }
          range.insertNode(fragment);
        } else {
          editorRef.current.innerHTML += `<div>${content}</div>`;
        }
        handleEditorInput();
      }
    };

    const handleReplace = (e: Event) => {
      const customEvent = e as CustomEvent;
      const content = customEvent.detail.content;

      if (editorRef.current) {
        editorRef.current.focus();
        const selection = window.getSelection();
        
        if (selectedRange) {
          selection?.removeAllRanges();
          selection?.addRange(selectedRange);
        }

        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          range.deleteContents();
          
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = content;
          const fragment = document.createDocumentFragment();
          while (tempDiv.firstChild) {
            fragment.appendChild(tempDiv.firstChild);
          }
          range.insertNode(fragment);
        }
        handleEditorInput();
      }
    };

    window.addEventListener('kms-ai-insert-content', handleInsert);
    window.addEventListener('kms-ai-replace-content', handleReplace);

    return () => {
      window.removeEventListener('kms-ai-insert-content', handleInsert);
      window.removeEventListener('kms-ai-replace-content', handleReplace);
    };
  }, [selectedRange]);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Listen to custom Save, Undo, and Redo events dispatched from DocHeader quick icons
  useEffect(() => {
    const triggerSave = () => {
      setSaveStatus('Saving...');
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      if (nextStatusTimeoutRef.current) clearTimeout(nextStatusTimeoutRef.current);
      
      saveTimeoutRef.current = setTimeout(() => {
        setSaveStatus('Saved just now');
        nextStatusTimeoutRef.current = setTimeout(() => {
          setSaveStatus('All changes saved');
        }, 3000);
      }, 700);
    };

    const triggerUndo = () => document.execCommand('undo');
    const triggerRedo = () => document.execCommand('redo');

    window.addEventListener('kms-editor-save', triggerSave);
    window.addEventListener('kms-editor-undo', triggerUndo);
    window.addEventListener('kms-editor-redo', triggerRedo);

    return () => {
      window.removeEventListener('kms-editor-save', triggerSave);
      window.removeEventListener('kms-editor-undo', triggerUndo);
      window.removeEventListener('kms-editor-redo', triggerRedo);
    };
  }, []);

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (fontDropdownRef.current && !fontDropdownRef.current.contains(target)) {
        setShowFontDropdown(false);
      }
      if (fontSizeRef.current && !fontSizeRef.current.contains(target)) {
        setShowFontSizeDropdown(false);
      }
      if (textColorRef.current && !textColorRef.current.contains(target)) {
        setShowTextColorGrid(false);
      }
      if (highlightColorRef.current && !highlightColorRef.current.contains(target)) {
        setShowHighlightColorGrid(false);
      }
      if (moreActionsRef.current && !moreActionsRef.current.contains(target)) {
        setShowMoreActionsMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFontSelect = (font: string) => {
    setFontFamily(font);
    setShowFontDropdown(false);
    setFontSearchQuery('');
    document.execCommand('fontName', false, font);
  };

  const handleTextColorSelect = (colorHex: string) => {
    setShowTextColorGrid(false);
    document.execCommand('foreColor', false, colorHex);
  };

  const handleHighlightColorSelect = (colorHex: string) => {
    setShowHighlightColorGrid(false);
    document.execCommand('backColor', false, colorHex);
  };

  const handleFontSizeChange = (size: number) => {
    const s = Math.max(8, Math.min(96, size));
    setFontSizeVal(s);
    document.execCommand('fontSize', false, '3'); // default fallback font size setting
  };

  // Typing inputs for Auto Save and Slash commands
  const handleEditorInput = () => {
    // Auto Save Progress Cycle: Saving... -> Saved just now -> All changes saved
    setSaveStatus('Saving...');
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    if (nextStatusTimeoutRef.current) clearTimeout(nextStatusTimeoutRef.current);
    
    saveTimeoutRef.current = setTimeout(() => {
      setSaveStatus('Saved just now');
      nextStatusTimeoutRef.current = setTimeout(() => {
        setSaveStatus('All changes saved');
      }, 3000);
    }, 900);

    // Count words
    const text = editorRef.current?.innerText || '';
    const words = text.trim().split(/\s+/).filter(w => w.length > 0);
    setWordCount(words.length);

    // Dispatch content update
    window.dispatchEvent(new CustomEvent('kms-active-document-content-update', {
      detail: { fullContent: text }
    }));

    // Detect Slash Command trigger "/"
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const preCaretText = range.startContainer.textContent?.substring(0, range.startOffset) || '';
      
      if (preCaretText.endsWith('/')) {
        const rect = range.getBoundingClientRect();
        const editorRect = editorRef.current?.getBoundingClientRect();
        
        if (editorRect) {
          setSlashMenuPos({
            top: rect.bottom - editorRect.top + (editorRef.current?.scrollTop || 0) + 8,
            left: rect.left - editorRect.left
          });
          setShowSlashMenu(true);
        }
      } else {
        setShowSlashMenu(false);
      }
    }
  };

  // Keyboard shortcut listener
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const isMod = e.ctrlKey || e.metaKey;

    if (isMod) {
      if (e.shiftKey) {
        // Ctrl+Shift+> increases font size, Ctrl+Shift+< decreases size
        if (e.key === '>') {
          e.preventDefault();
          handleFontSizeChange(fontSizeVal + 1);
        }
        if (e.key === '<') {
          e.preventDefault();
          handleFontSizeChange(fontSizeVal - 1);
        }
      } else {
        switch (e.key.toLowerCase()) {
          case 's':
            e.preventDefault();
            window.dispatchEvent(new CustomEvent('kms-editor-save'));
            break;
          case 'b':
            e.preventDefault();
            document.execCommand('bold');
            break;
          case 'i':
            e.preventDefault();
            document.execCommand('italic');
            break;
          case 'u':
            e.preventDefault();
            document.execCommand('underline');
            break;
          case 'z':
            e.preventDefault();
            document.execCommand('undo');
            break;
          case 'y':
            e.preventDefault();
            document.execCommand('redo');
            break;
          case 'f':
            e.preventDefault();
            alert('Find & Replace dialog active (Mock)');
            break;
          case 'p':
            e.preventDefault();
            e.stopPropagation();
            window.print();
            break;
        }
      }
    }

    if (e.key === 'Escape') {
      setShowSlashMenu(false);
    }
  };

  // Slash commands executor
  const executeSlashCommand = (cmd: string) => {
    setShowSlashMenu(false);
    
    if (editorRef.current) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.setStart(range.startContainer, range.startOffset - 1);
        range.deleteContents();
        
        const element = document.createElement('div');
        
        switch (cmd) {
          case 'h1':
            element.innerHTML = `<h1 class="text-xl font-black text-slate-900 mt-4 border-b pb-1">New Heading 1</h1><p class="text-slate-600 mt-1">Start typing...</p>`;
            break;
          case 'h2':
            element.innerHTML = `<h2 class="text-base font-extrabold text-slate-800 mt-3">New Heading 2</h2><p class="text-slate-655 mt-1">Start typing...</p>`;
            break;
          case 'table':
            element.innerHTML = `<table class="w-full border-collapse border border-slate-200 mt-2 text-xs">
              <thead><tr class="bg-slate-50"><th class="border border-slate-200 p-2">Item</th><th class="border border-slate-200 p-2">Details</th></tr></thead>
              <tbody><tr><td class="border border-slate-200 p-2">Col 1</td><td class="border border-slate-200 p-2">Col 2</td></tr></tbody>
            </table><p class="mt-2"></p>`;
            break;
          case 'checklist':
            element.innerHTML = `<div class="flex items-center gap-2 mt-1"><input type="checkbox" class="rounded border-slate-300 text-blue-600" /> <span class="text-slate-700">Checklist item</span></div>`;
            break;
          case 'divider':
            element.innerHTML = `<hr class="border-t border-slate-200 my-4" />`;
            break;
          case 'quote':
            element.innerHTML = `<blockquote class="border-l-4 border-slate-350 pl-4 py-1.5 italic text-slate-500 my-2">"Insert quote here..."</blockquote>`;
            break;
          case 'code':
            element.innerHTML = `<pre class="bg-slate-50 border border-slate-200 rounded-xl p-4 font-mono text-[11px] text-slate-750 my-2">console.log("Fast Trade KMS Upgrade");</pre>`;
            break;
          case 'ai':
            element.innerHTML = `<div class="bg-blue-50/40 border border-blue-150 rounded-xl p-3.5 flex gap-2.5 text-xs text-blue-700 font-bold my-2 select-none"><Sparkles className="w-4 h-4 shrink-0 text-blue-600" /><span>AI Summary details inserted...</span></div>`;
            break;
          case 'date':
            element.innerHTML = `<span class="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px] text-slate-600 font-extrabold">${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span> `;
            break;
        }

        range.insertNode(element);
        range.setStartAfter(element);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
  };

  const filteredFonts = FONT_FAMILIES.filter(f => f.toLowerCase().includes(fontSearchQuery.toLowerCase()));
  const isCompactScreen = windowWidth < 1200;

  return (
    <div className="flex flex-col h-full bg-[#f1f3f4]/70 select-none relative font-sans">
      
      {/* 1. PROFESSIONAL GROUPED TOOLBAR */}
      <div className="bg-white border-b border-slate-200 px-6 py-1.8 flex flex-wrap items-center gap-1 select-none text-slate-700 shadow-[inset_0_-1px_1px_rgba(0,0,0,0.015)] shrink-0">
        
        {/* GROUP 1: Quick Save, Undo, Redo, Print, Paint format */}
        <button 
          type="button" 
          onClick={() => window.dispatchEvent(new CustomEvent('kms-editor-save'))}
          className="p-1.8 hover:bg-slate-100 rounded-lg text-slate-650 hover:text-slate-900 transition-colors" 
          title="Save Document (Ctrl+S)"
        >
          <span className="text-[12.5px] leading-none">💾</span>
        </button>
        <button type="button" onClick={() => document.execCommand('undo')} className="p-1.8 hover:bg-slate-100 rounded-lg text-slate-550 hover:text-slate-800 transition-colors" title="Undo (Ctrl+Z)">
          <Undo2 className="w-3.5 h-3.5" />
        </button>
        <button type="button" onClick={() => document.execCommand('redo')} className="p-1.8 hover:bg-slate-100 rounded-lg text-slate-550 hover:text-slate-800 transition-colors" title="Redo (Ctrl+Y)">
          <Redo2 className="w-3.5 h-3.5" />
        </button>
        <button type="button" onClick={() => window.print()} className="p-1.8 hover:bg-slate-100 rounded-lg text-slate-550 hover:text-slate-800 transition-colors" title="Print (Ctrl+P)">
          <Printer className="w-3.5 h-3.5" />
        </button>
        <button type="button" onClick={() => alert('Paint format copied (Mock)')} className="p-1.8 hover:bg-slate-100 rounded-lg text-slate-550 hover:text-slate-800 transition-colors" title="Paint Format">
          <Paintbrush className="w-3.5 h-3.5" />
        </button>

        <div className="h-5 w-[1.2px] bg-slate-200 mx-1 shrink-0" />

        {/* GROUP 2: Zoom selection */}
        <select 
          value={zoomPercent} 
          onChange={(e) => setZoomPercent(e.target.value)}
          className="bg-transparent hover:bg-slate-100 border border-transparent hover:border-slate-200 rounded-lg px-2 py-0.8 text-[11px] text-slate-700 font-bold focus:outline-none cursor-pointer w-16"
        >
          <option value="50">50%</option>
          <option value="75">75%</option>
          <option value="100">100%</option>
          <option value="125">125%</option>
          <option value="150">150%</option>
          <option value="200">200%</option>
        </select>

        <div className="h-5 w-[1.2px] bg-slate-200 mx-1 shrink-0" />

        {/* GROUP 3: Style selection */}
        <select 
          defaultValue="Normal Text"
          className="bg-transparent hover:bg-slate-100 border border-transparent hover:border-slate-200 rounded-lg px-2 py-0.8 text-[11px] text-slate-700 font-bold focus:outline-none cursor-pointer w-28"
          onChange={(e) => {
            const val = e.target.value;
            if (val === 'Heading 1') document.execCommand('formatBlock', false, 'H1');
            else if (val === 'Heading 2') document.execCommand('formatBlock', false, 'H2');
            else if (val === 'Heading 3') document.execCommand('formatBlock', false, 'H3');
            else document.execCommand('formatBlock', false, 'P');
          }}
        >
          <option>Normal Text</option>
          <option>Title</option>
          <option>Subtitle</option>
          <option>Heading 1</option>
          <option>Heading 2</option>
          <option>Heading 3</option>
        </select>

        <div className="h-5 w-[1.2px] bg-slate-200 mx-1 shrink-0" />

        {/* GROUP 4: Searchable Font family selector with Favorites & Recently used */}
        <div className="relative font-semibold text-xs text-slate-700 shrink-0" ref={fontDropdownRef}>
          <button
            type="button"
            onClick={() => setShowFontDropdown(!showFontDropdown)}
            className="flex items-center justify-between gap-1.5 px-2.5 py-1 border border-slate-200 hover:border-slate-300 rounded-lg bg-white shadow-[0_1px_2px_rgba(0,0,0,0.015)] w-28 text-[11px] font-bold"
          >
            <span className="truncate" style={{ fontFamily: fontFamily }}>{fontFamily}</span>
            <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
          </button>
          
          {showFontDropdown && (
            <div className="absolute left-0 mt-1 w-48 bg-white border border-slate-250 rounded-xl shadow-xl py-1.5 z-40 select-none animate-in fade-in duration-100">
              <div className="px-2 pb-1.5 mb-1.5 border-b border-slate-100 flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <input 
                  type="text" 
                  placeholder="Search fonts..." 
                  value={fontSearchQuery}
                  onChange={(e) => setFontSearchQuery(e.target.value)}
                  className="w-full bg-transparent outline-none text-[10.5px] font-semibold text-slate-700" 
                />
              </div>

              <div className="max-h-56 overflow-y-auto custom-scrollbar px-1.5 space-y-2">
                {/* Recent Fonts Group */}
                {fontSearchQuery === '' && (
                  <div>
                    <span className="text-[8px] text-slate-400 font-extrabold uppercase tracking-wider block px-1.5 py-0.5">Recently Used</span>
                    {RECENT_FONTS.map(font => (
                      <button
                        key={`recent-${font}`}
                        type="button"
                        onClick={() => handleFontSelect(font)}
                        className={`w-full text-left px-2 py-1 rounded text-[10.5px] font-bold ${
                          fontFamily === font ? 'bg-blue-50 text-blue-600' : 'hover:bg-slate-50 text-slate-750'
                        }`}
                        style={{ fontFamily: font }}
                      >
                        {font}
                      </button>
                    ))}
                  </div>
                )}

                {/* Favorite Fonts Group */}
                {fontSearchQuery === '' && (
                  <div>
                    <span className="text-[8px] text-slate-400 font-extrabold uppercase tracking-wider block px-1.5 py-0.5">Favorites</span>
                    {FAVORITE_FONTS.map(font => (
                      <button
                        key={`fav-${font}`}
                        type="button"
                        onClick={() => handleFontSelect(font)}
                        className={`w-full text-left px-2 py-1 rounded text-[10.5px] font-bold ${
                          fontFamily === font ? 'bg-blue-50 text-blue-600' : 'hover:bg-slate-50 text-slate-750'
                        }`}
                        style={{ fontFamily: font }}
                      >
                        {font}
                      </button>
                    ))}
                  </div>
                )}

                {/* All Fonts list */}
                <div>
                  <span className="text-[8px] text-slate-400 font-extrabold uppercase tracking-wider block px-1.5 py-0.5 border-t border-slate-100 pt-1 mt-1">All Fonts</span>
                  {filteredFonts.map((font) => (
                    <button
                      key={font}
                      type="button"
                      onClick={() => handleFontSelect(font)}
                      className={`w-full text-left px-2 py-1 rounded text-[10.5px] font-bold ${
                        fontFamily === font ? 'bg-blue-50 text-blue-600' : 'hover:bg-slate-50 text-slate-750'
                      }`}
                      style={{ fontFamily: font }}
                    >
                      {font}
                    </button>
                  ))}
                  {filteredFonts.length === 0 && (
                    <span className="text-[10px] text-slate-450 font-bold block text-center py-2">No results</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="h-5 w-[1.2px] bg-slate-200 mx-1 shrink-0" />

        {/* GROUP 5: Font Size stepper with typed manual inputs support */}
        <div className="flex items-center shrink-0 border border-slate-200 rounded-lg bg-white shadow-[0_1px_2px_rgba(0,0,0,0.01)] overflow-hidden" ref={fontSizeRef}>
          <button 
            type="button" 
            onClick={() => handleFontSizeChange(fontSizeVal - 1)}
            className="px-2 py-1.5 hover:bg-slate-100 text-slate-500 font-bold text-xs"
            title="Decrease Font Size (Ctrl+Shift+<)"
          >
            <Minus className="w-3 h-3" />
          </button>
          
          <input 
            type="number"
            value={fontSizeVal}
            onChange={(e) => handleFontSizeChange(parseInt(e.target.value) || 11)}
            onClick={() => setShowFontSizeDropdown(!showFontSizeDropdown)}
            className="w-10 text-center text-[10.5px] text-slate-800 font-extrabold focus:outline-none bg-transparent border-none appearance-none font-mono"
          />

          <button 
            type="button" 
            onClick={() => handleFontSizeChange(fontSizeVal + 1)}
            className="px-2 py-1.5 hover:bg-slate-100 text-slate-500 font-bold text-xs"
            title="Increase Font Size (Ctrl+Shift+>)"
          >
            <Plus className="w-3 h-3" />
          </button>

          {showFontSizeDropdown && (
            <div className="absolute mt-8 bg-white border border-slate-250 rounded-xl shadow-xl py-1 z-40 select-none max-h-40 overflow-y-auto w-14 text-center font-mono">
              {FONT_SIZES.map(sz => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => {
                    handleFontSizeChange(sz);
                    setShowFontSizeDropdown(false);
                  }}
                  className={`w-full py-1 text-[10.5px] font-extrabold hover:bg-slate-50 block ${
                    fontSizeVal === sz ? 'bg-blue-50 text-blue-600' : 'text-slate-700'
                  }`}
                >
                  {sz}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="h-5 w-[1.2px] bg-slate-200 mx-1 shrink-0" />

        {/* GROUP 6: Bold, Italic, Underline, Strikethrough */}
        <button type="button" onClick={() => document.execCommand('bold')} className="p-1.8 hover:bg-slate-100 rounded-lg text-slate-650 hover:text-slate-900 font-bold" title="Bold (Ctrl+B)">
          <Bold className="w-3.5 h-3.5" />
        </button>
        <button type="button" onClick={() => document.execCommand('italic')} className="p-1.8 hover:bg-slate-100 rounded-lg text-slate-650 hover:text-slate-900 font-bold" title="Italic (Ctrl+I)">
          <Italic className="w-3.5 h-3.5" />
        </button>
        <button type="button" onClick={() => document.execCommand('underline')} className="p-1.8 hover:bg-slate-100 rounded-lg text-slate-650 hover:text-slate-900 font-bold" title="Underline (Ctrl+U)">
          <Underline className="w-3.5 h-3.5" />
        </button>
        <button type="button" onClick={() => document.execCommand('strikeThrough')} className="p-1.8 hover:bg-slate-100 rounded-lg text-slate-650 hover:text-slate-900" title="Strikethrough">
          <span className="line-through font-serif text-xs font-bold leading-none select-none">ab</span>
        </button>

        <div className="h-5 w-[1.2px] bg-slate-200 mx-1 shrink-0" />

        {/* GROUP 7: Text Color picker & Highlight Color picker */}
        <div className="relative flex items-center gap-0.5 shrink-0">
          <div ref={textColorRef}>
            <button
              type="button"
              onClick={() => setShowTextColorGrid(!showTextColorGrid)}
              className="p-1.8 hover:bg-slate-100 rounded-lg text-slate-650 flex flex-col items-center justify-center relative"
              title="Text Color"
            >
              <span className="text-[10px] font-extrabold leading-none -mb-0.5">A</span>
              <div className="w-3.5 h-0.8 bg-slate-900 border border-slate-300 rounded-sm" />
            </button>
            {showTextColorGrid && (
              <div className="absolute left-0 mt-1.5 p-2 bg-white border border-slate-250 rounded-xl shadow-xl z-40 select-none animate-in fade-in duration-100 w-36">
                <span className="text-[8px] text-slate-400 font-extrabold uppercase tracking-wider block mb-1.5 px-1">Text Color</span>
                <div className="grid grid-cols-4 gap-1.5">
                  {PALETTE_COLORS.map(col => (
                    <div 
                      key={col.name} 
                      onClick={() => handleTextColorSelect(col.hex)}
                      className="w-5.5 h-5.5 rounded-full cursor-pointer border border-slate-200 hover:scale-105 transition-transform"
                      style={{ backgroundColor: col.hex }}
                      title={col.name}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div ref={highlightColorRef}>
            <button
              type="button"
              onClick={() => setShowHighlightColorGrid(!showHighlightColorGrid)}
              className="p-1.8 hover:bg-slate-100 rounded-lg text-slate-655 flex flex-col items-center justify-center"
              title="Highlight Color"
            >
              <Highlighter className="w-3.5 h-3.5" />
            </button>
            {showHighlightColorGrid && (
              <div className="absolute left-0 mt-1.5 p-2 bg-white border border-slate-250 rounded-xl shadow-xl z-40 select-none animate-in fade-in duration-100 w-36">
                <span className="text-[8px] text-slate-400 font-extrabold uppercase tracking-wider block mb-1.5 px-1">Highlight Color</span>
                <div className="grid grid-cols-4 gap-1.5">
                  {PALETTE_COLORS.map(col => (
                    <div 
                      key={col.name} 
                      onClick={() => handleHighlightColorSelect(col.hex)}
                      className="w-5.5 h-5.5 rounded-full cursor-pointer border border-slate-200 hover:scale-105 transition-transform"
                      style={{ backgroundColor: col.hex }}
                      title={col.name}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="h-5 w-[1.2px] bg-slate-200 mx-1 shrink-0" />

        {/* GROUP 8: Insert Link, Comment */}
        <button type="button" onClick={() => {
          const url = prompt('Enter hyperlink URL:');
          if (url) document.execCommand('createLink', false, url);
        }} className="p-1.8 hover:bg-slate-100 rounded-lg text-slate-655" title="Insert Link">
          <Link2 className="w-3.5 h-3.5" />
        </button>
        <button type="button" onClick={() => alert('Insert comment thread (Mock)')} className="p-1.8 hover:bg-slate-100 rounded-lg text-slate-655" title="Insert Comment">
          <MessageSquare className="w-3.5 h-3.5" />
        </button>

        <div className="h-5 w-[1.2px] bg-slate-200 mx-1 shrink-0" />

        {/* GROUP 9: Alignment options */}
        <button type="button" onClick={() => document.execCommand('justifyLeft')} className="p-1.8 hover:bg-slate-100 rounded-lg text-slate-650" title="Align Left">
          <AlignLeft className="w-3.5 h-3.5" />
        </button>
        <button type="button" onClick={() => document.execCommand('justifyCenter')} className="p-1.8 hover:bg-slate-100 rounded-lg text-slate-650" title="Align Center">
          <AlignCenter className="w-3.5 h-3.5" />
        </button>
        <button type="button" onClick={() => document.execCommand('justifyRight')} className="p-1.8 hover:bg-slate-100 rounded-lg text-slate-650" title="Align Right">
          <AlignRight className="w-3.5 h-3.5" />
        </button>
        <button type="button" onClick={() => document.execCommand('justifyFull')} className="p-1.8 hover:bg-slate-100 rounded-lg text-slate-650" title="Justify">
          <AlignJustify className="w-3.5 h-3.5" />
        </button>

        {/* COMPACT SCREEN TOGGLER (Hides latter options into the "More" dropdown menu) */}
        {!isCompactScreen ? (
          <>
            <div className="h-5 w-[1.2px] bg-slate-200 mx-1 shrink-0" />

            {/* GROUP 10: Lists */}
            <button type="button" onClick={() => document.execCommand('insertUnorderedList')} className="p-1.8 hover:bg-slate-100 rounded-lg text-slate-650" title="Bulleted List">
              <List className="w-3.5 h-3.5" />
            </button>
            <button type="button" onClick={() => document.execCommand('insertOrderedList')} className="p-1.8 hover:bg-slate-100 rounded-lg text-slate-650" title="Numbered List">
              <ListOrdered className="w-3.5 h-3.5" />
            </button>
            <button type="button" onClick={() => executeSlashCommand('checklist')} className="p-1.8 hover:bg-slate-100 rounded-lg text-slate-650" title="Checklist">
              <CheckSquare className="w-3.5 h-3.5" />
            </button>

            <div className="h-5 w-[1.2px] bg-slate-200 mx-1 shrink-0" />

            {/* GROUP 11: Indent Outdent */}
            <button type="button" onClick={() => document.execCommand('outdent')} className="p-1.8 hover:bg-slate-100 rounded-lg text-slate-650" title="Decrease Indent">
              <OutdentIcon className="w-3.5 h-3.5" />
            </button>
            <button type="button" onClick={() => document.execCommand('indent')} className="p-1.8 hover:bg-slate-100 rounded-lg text-slate-650" title="Increase Indent">
              <IndentIcon className="w-3.5 h-3.5" />
            </button>

            <div className="h-5 w-[1.2px] bg-slate-200 mx-1 shrink-0" />

            {/* GROUP 12: Line Spacing */}
            <select
              value={lineSpacing}
              onChange={(e) => setLineSpacing(e.target.value)}
              className="bg-transparent hover:bg-slate-100 border border-transparent hover:border-slate-200 rounded-lg px-2 py-0.8 text-[11px] text-slate-700 font-bold focus:outline-none cursor-pointer w-16"
              title="Line Spacing"
            >
              <option value="1.0">1.0</option>
              <option value="1.15">1.15</option>
              <option value="1.5">1.5</option>
              <option value="2.0">2.0</option>
            </select>

            <div className="h-5 w-[1.2px] bg-slate-200 mx-1 shrink-0" />

            {/* GROUP 13: Insert Image, Table */}
            <button type="button" onClick={() => {
              const imgUrl = prompt('Enter image URL:');
              if (imgUrl) document.execCommand('insertImage', false, imgUrl);
            }} className="p-1.8 hover:bg-slate-100 rounded-lg text-slate-650" title="Insert Image">
              <Image className="w-3.5 h-3.5" />
            </button>
            <button type="button" onClick={() => executeSlashCommand('table')} className="p-1.8 hover:bg-slate-100 rounded-lg text-slate-650" title="Insert Table">
              <Table className="w-3.5 h-3.5" />
            </button>

            <div className="h-5 w-[1.2px] bg-slate-200 mx-1 shrink-0" />

            {/* GROUP 14: Clear formatting */}
            <button type="button" onClick={() => document.execCommand('removeFormat')} className="p-1.8 hover:bg-slate-100 rounded-lg text-slate-650" title="Clear Formatting">
              <RemoveFormatting className="w-3.5 h-3.5" />
            </button>
          </>
        ) : (
          /* "More formatting Options" trigger on narrow widths */
          <div className="relative shrink-0" ref={moreActionsRef}>
            <button
              type="button"
              onClick={() => setShowMoreActionsMenu(!showMoreActionsMenu)}
              className={`p-1.8 rounded-lg transition-colors ${
                showMoreActionsMenu ? 'bg-slate-200 text-slate-900' : 'hover:bg-slate-100 text-slate-655'
              }`}
              title="More formatting options"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {showMoreActionsMenu && (
              <div className="absolute right-0 mt-1.5 bg-white border border-slate-250 rounded-xl shadow-xl p-2.5 z-40 select-none animate-in fade-in duration-100 w-52 space-y-3">
                <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider block border-b border-slate-100 pb-1.5 px-1">Formatting</span>
                
                <div className="flex justify-between items-center px-1">
                  <span className="text-[10px] text-slate-505 font-bold">List Styles</span>
                  <div className="flex gap-1">
                    <button type="button" onClick={() => document.execCommand('insertUnorderedList')} className="p-1.5 hover:bg-slate-50 border rounded text-slate-600"><List className="w-3.5 h-3.5" /></button>
                    <button type="button" onClick={() => document.execCommand('insertOrderedList')} className="p-1.5 hover:bg-slate-50 border rounded text-slate-600"><ListOrdered className="w-3.5 h-3.5" /></button>
                    <button type="button" onClick={() => executeSlashCommand('checklist')} className="p-1.5 hover:bg-slate-50 border rounded text-slate-600"><CheckSquare className="w-3.5 h-3.5" /></button>
                  </div>
                </div>

                <div className="flex justify-between items-center px-1">
                  <span className="text-[10px] text-slate-500 font-bold">Indentation</span>
                  <div className="flex gap-1">
                    <button type="button" onClick={() => document.execCommand('outdent')} className="p-1.5 hover:bg-slate-50 border rounded text-slate-600"><OutdentIcon className="w-3.5 h-3.5" /></button>
                    <button type="button" onClick={() => document.execCommand('indent')} className="p-1.5 hover:bg-slate-50 border rounded text-slate-600"><IndentIcon className="w-3.5 h-3.5" /></button>
                  </div>
                </div>

                <div className="flex justify-between items-center px-1">
                  <span className="text-[10px] text-slate-500 font-bold">Spacing</span>
                  <select 
                    value={lineSpacing}
                    onChange={(e) => setLineSpacing(e.target.value)}
                    className="bg-white border rounded text-[10px] font-bold px-1.5 py-0.5 text-slate-750 focus:outline-none"
                  >
                    <option value="1.0">1.0</option>
                    <option value="1.15">1.15</option>
                    <option value="1.5">1.5</option>
                    <option value="2.0">2.0</option>
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-1 pt-1.5 border-t border-slate-100">
                  <button type="button" onClick={() => {
                    const imgUrl = prompt('Enter image URL:');
                    if (imgUrl) document.execCommand('insertImage', false, imgUrl);
                  }} className="p-1.5 hover:bg-slate-50 border rounded text-slate-600 text-center flex justify-center" title="Image"><Image className="w-3.5 h-3.5" /></button>
                  
                  <button type="button" onClick={() => executeSlashCommand('table')} className="p-1.5 hover:bg-slate-50 border rounded text-slate-600 text-center flex justify-center" title="Table"><Table className="w-3.5 h-3.5" /></button>
                  
                  <button type="button" onClick={() => document.execCommand('removeFormat')} className="p-1.5 hover:bg-slate-50 border rounded text-slate-600 text-center flex justify-center font-bold" title="Clear"><RemoveFormatting className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Auto Save State indicator */}
        <div className="ml-auto shrink-0 select-none text-[9.5px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-lg shadow-sm">
          <span className={`h-1.5 w-1.5 rounded-full ${
            saveStatus === 'Saving...' ? 'bg-amber-500 animate-pulse' :
            saveStatus === 'Saved just now' ? 'bg-emerald-500 animate-bounce' : 'bg-emerald-500'
          }`} />
          <span>{saveStatus}</span>
        </div>

      </div>

      {/* 2. TEXT EDITING PREMIUM SPACIOUS CANVAS PAPER CONTAINER */}
      <div className="flex-1 overflow-y-auto p-12 flex justify-center custom-scrollbar relative">
        
        {/* Absolute floating Slash command menu */}
        {showSlashMenu && (
          <div 
            className="absolute bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-40 w-48 text-xs font-bold text-slate-700 animate-in fade-in slide-in-from-top-1 duration-150 select-none"
            style={{ 
              top: slashMenuPos.top,
              left: slashMenuPos.left
            }}
          >
            <span className="text-[9px] text-slate-450 font-extrabold uppercase tracking-wider px-3.5 py-1.5 block border-b border-slate-100 mb-1">
              Insert Command
            </span>
            {[
              { id: 'h1', label: 'Heading 1', icon: Heading1 },
              { id: 'h2', label: 'Heading 2', icon: Heading2 },
              { id: 'table', label: 'Grid Table', icon: Table },
              { id: 'checklist', label: 'Checklist Item', icon: CheckSquare },
              { id: 'divider', label: 'Horizontal Line', icon: Minus },
              { id: 'quote', label: 'Blockquote text', icon: Quote },
              { id: 'code', label: 'Code Snippet', icon: Code },
              { id: 'ai', label: 'AI Summary Outline', icon: Sparkles },
              { id: 'date', label: 'Current Date Stamp', icon: Calendar }
            ].map((cmd) => (
              <button
                key={cmd.id}
                type="button"
                onClick={() => executeSlashCommand(cmd.id)}
                className="w-full text-left px-3.5 py-2 hover:bg-slate-50 hover:text-slate-900 transition-colors flex items-center gap-2"
              >
                <cmd.icon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{cmd.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Center aligned A4 Sheet Document Canvas (10% Wider w-[1100px] with proper A4 height) */}
        <div 
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleEditorInput}
          onKeyDown={handleKeyDown}
          onMouseUp={handleSelectionChange}
          onKeyUp={handleSelectionChange}
          className="bg-white border border-slate-200/80 shadow-[0_8px_32px_rgba(0,0,0,0.03),0_2px_8px_rgba(0,0,0,0.015)] w-[1100px] min-h-[1414px] p-24 outline-none text-slate-855 select-text leading-relaxed font-sans text-xs space-y-6 rounded-md transition-all duration-200"
          style={{ 
            fontFamily: fontFamily,
            fontSize: `${fontSizeVal}pt`,
            lineHeight: lineSpacing
          }}
        >
          {getTemplateContent(window.location.pathname)}
        </div>

        {/* Floating Selection AI Toolbar */}
        {showFloatingAiToolbar && (
          <div 
            ref={floatingAiRef}
            className="fixed bg-white border border-slate-200/95 shadow-[0_8px_32px_rgba(0,0,0,0.08)] rounded-xl py-1 px-1.5 z-[99999] flex items-center gap-1 text-[11.5px] font-bold text-slate-600 select-none animate-in fade-in zoom-in-95 duration-150"
            style={{ 
              top: `${floatingAiToolbarPos.top}px`, 
              left: `${floatingAiToolbarPos.left}px` 
            }}
          >
            <div className="p-1 text-blue-600 bg-blue-50 rounded-lg select-none flex items-center justify-center shrink-0">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <span className="text-[10px] text-slate-400 select-none font-extrabold uppercase mr-1 pl-1 border-r border-slate-100 pr-1.5">AI</span>
            
            <button 
              type="button" 
              onClick={() => handleSelectionAiAction('Explain')}
              className="px-2 py-1 hover:bg-slate-50 hover:text-slate-900 rounded-md transition-colors"
            >
              Explain
            </button>
            <button 
              type="button" 
              onClick={() => handleSelectionAiAction('Rewrite')}
              className="px-2 py-1 hover:bg-slate-50 hover:text-slate-900 rounded-md transition-colors"
            >
              Rewrite
            </button>
            <button 
              type="button" 
              onClick={() => handleSelectionAiAction('Summarize')}
              className="px-2 py-1 hover:bg-slate-50 hover:text-slate-900 rounded-md transition-colors"
            >
              Summarize
            </button>
            <button 
              type="button" 
              onClick={() => handleSelectionAiAction('Improve')}
              className="px-2 py-1 hover:bg-slate-50 hover:text-slate-900 rounded-md transition-colors"
            >
              Improve
            </button>
            <button 
              type="button" 
              onClick={() => handleSelectionAiAction('Translate')}
              className="px-2 py-1 hover:bg-slate-50 hover:text-slate-900 rounded-md transition-colors"
            >
              Translate
            </button>
            
            <div className="w-[1px] h-3 bg-slate-200 mx-0.5 shrink-0" />
            
            <button 
              type="button" 
              onClick={() => handleSelectionAiAction('Continue Writing')}
              className="px-2 py-1 hover:bg-slate-50 hover:text-slate-900 rounded-md transition-colors text-blue-600"
            >
              Continue Writing
            </button>
          </div>
        )}
      </div>

      {/* 3. GOOGLE DOCS STYLE BOTTOM STATUS BAR */}
      <div className="bg-[#f8fafc] border-t border-slate-200 px-6 py-1.5 select-none flex items-center justify-between text-[9px] text-slate-400 font-extrabold uppercase tracking-wider shrink-0 shadow-[inset_0_1px_1px_rgba(0,0,0,0.005)]">
        <div className="flex items-center gap-5">
          <span>Page 1 of 3</span>
          <span>{wordCount} words</span>
          <span>English (United States)</span>
        </div>
        
        <div className="flex items-center gap-4">
          <span>Cursor: Col 18, Row 6</span>
          <span>Zoom: {zoomPercent}%</span>
        </div>
      </div>

    </div>
  );
}
