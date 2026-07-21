import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';

import { 
  Eye, 
  Info,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';

import DocHeader from '../components/DocHeader';
import DocInfoSidebar from '../components/DocInfoSidebar';
import DocxEditor from '../components/DocxEditor';
import PdfViewer from '../components/PdfViewer';
import PptViewer from '../components/PptViewer';
import XlsxViewer from '../components/XlsxViewer';
import ImageViewer from '../components/ImageViewer';
import TxtEditor from '../components/TxtEditor';

interface MockDoc {
  id: string;
  name: string;
  fileType: string;
  version: string;
  lastModified: string;
  ownerName: string;
  locationPath: string;
  tags: string[];
  description: string;
  whoCanAccess: string;
  accessType: string;
  aiSummaryText: string;
}

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

const mockDocsList: Record<string, MockDoc> = {
  'doc-1': {
    id: 'doc-1',
    name: 'Q2 Budget Report.docx',
    fileType: 'DOCX',
    version: 'v2.1',
    lastModified: '19 May 2026, 10:30 AM',
    ownerName: 'Paras Jain',
    locationPath: '/02_Finance/Reports',
    tags: ['Budget', 'Q2', 'Finance'],
    description: 'Quarter 2 budget report including departmental allocations, variances and forecasts.',
    whoCanAccess: 'Finance Team, Managers',
    accessType: 'Can view, download',
    aiSummaryText: 'This budget document outlines expenditure plans for the second quarter. Engineering operations receive a 24% allocation, with compliance and legal audits remaining unchanged.'
  },
  'doc-2': {
    id: 'doc-2',
    name: 'Sales Report - April.xlsx',
    fileType: 'XLSX',
    version: 'v1.3',
    lastModified: '19 May 2026, 09:15 AM',
    ownerName: 'Uttam Gupta',
    locationPath: '/02_Finance/Reports',
    tags: ['Sales', 'April', 'Reports'],
    description: 'Departmental sales records for April showing achievements against targets.',
    whoCanAccess: 'Sales Team, Executive Board',
    accessType: 'Can view, download, edit',
    aiSummaryText: 'Sales audit registers B2 segment as target-exceeded at 114% achievement, driven by hardware purchases. Regional accessories show moderate growth.'
  },
  'doc-3': {
    id: 'doc-3',
    name: 'Vendor Agreement.pdf',
    fileType: 'PDF',
    version: 'v1.2',
    lastModified: '18 May 2026, 04:20 PM',
    ownerName: 'Riwitika Gupta',
    locationPath: '/05_Legal/Agreements',
    tags: ['Legal', 'Vendor', 'Agreements'],
    description: 'Standard services procurement vendor agreement including terms and conditions.',
    whoCanAccess: 'Legal Team, Procurement Managers',
    accessType: 'Can view, download',
    aiSummaryText: 'This legal contract governs procurement operations. Key provisions highlight 30-day payment schedules, interest liability, and scope of SOW deliverables.'
  },
  'doc-4': {
    id: 'doc-4',
    name: 'Product Roadmap.pptx',
    fileType: 'PPTX',
    version: 'v3.0',
    lastModified: '18 May 2026, 11:00 AM',
    ownerName: 'Uttam Gupta',
    locationPath: '/00_Company_Information',
    tags: ['Roadmap', 'Product', 'Presentation'],
    description: '2024 overview roadmap for the primary enterprise software release.',
    whoCanAccess: 'All Employees',
    accessType: 'Can view',
    aiSummaryText: 'Presentation slides detailing 2024 milestones. Research and architecture are signed off in Q1, with closing release cycles scheduled for Q4.'
  },
  'doc-5': {
    id: 'doc-5',
    name: 'Financial Policy.docx',
    fileType: 'DOCX',
    version: 'v1.0',
    lastModified: '17 May 2026, 03:45 PM',
    ownerName: 'Yukti Gupta',
    locationPath: '/02_Finance/Policies',
    tags: ['Policy', 'Finance'],
    description: 'Corporate financial policy outlining internal control parameters and review timelines.',
    whoCanAccess: 'Finance Team, Audit Officers',
    accessType: 'Can view, edit',
    aiSummaryText: 'Corporate governance document on financial auditing. Requires quarterly internal ledger balances matching before executive summary sign-off.'
  },
  'doc-6': {
    id: 'doc-6',
    name: 'Expense Analysis.xlsx',
    fileType: 'XLSX',
    version: 'v1.0',
    lastModified: '17 May 2026, 02:10 PM',
    ownerName: 'Paras Jain',
    locationPath: '/02_Finance/Budgets',
    tags: ['Expense', 'Analysis', 'Finance'],
    description: 'Analytical sheet detailing departmental expense balances against initial allocations.',
    whoCanAccess: 'Finance Managers, Directors',
    accessType: 'Can view, download, edit',
    aiSummaryText: 'Analysis details: operating expenses are over-allocated by 5.2%. Recommended reduction in operational subscriptions next cycle.'
  },
  'doc-7': {
    id: 'doc-7',
    name: 'Annual Financial Summary.pdf',
    fileType: 'PDF',
    version: 'v1.0',
    lastModified: '16 May 2026, 05:30 PM',
    ownerName: 'Riwitika Gupta',
    locationPath: '/02_Finance/Budgets',
    tags: ['Annual', 'Summary', 'Finance'],
    description: 'Year-end summary covering gross sales, tax compliance parameters and margin audits.',
    whoCanAccess: 'Audit Board, Shareholders',
    accessType: 'Can view, download',
    aiSummaryText: 'Annual summary states net margins grew by 14.8% Year-over-Year. Retained earnings and corporate cash reserves remained stable.'
  },
  'doc-8': {
    id: 'doc-8',
    name: 'Budget Presentation Q2.pptx',
    fileType: 'PPTX',
    version: 'v1.0',
    lastModified: '16 May 2026, 11:20 AM',
    ownerName: 'Yukti Gupta',
    locationPath: '/02_Finance/Budgets',
    tags: ['Presentation', 'Budget', 'Q2'],
    description: 'Slides deck prepared for board review of the Q2 budget plans.',
    whoCanAccess: 'Executive Board, Managers',
    accessType: 'Can view, share',
    aiSummaryText: 'Board budget deck. Highlights marketing expansion allocations and capital investment reserves for R&D.'
  },
  'doc-9': {
    id: 'doc-9',
    name: 'Cash Flow Statement.xlsx',
    fileType: 'XLSX',
    version: 'v1.0',
    lastModified: '15 May 2026, 10:05 AM',
    ownerName: 'Paras Jain',
    locationPath: '/02_Finance',
    tags: ['Cashflow', 'Statement'],
    description: 'Operational, investment and financing cash flow logs.',
    whoCanAccess: 'Finance Team',
    accessType: 'Can view, edit',
    aiSummaryText: 'Positive operational cash flow at ₹8.4M. Cash allocations for R&D equipment additions remain stable.'
  },
  'doc-10': {
    id: 'doc-10',
    name: 'Tax Compliance Guide.pdf',
    fileType: 'PDF',
    version: 'v1.0',
    lastModified: '15 May 2026, 09:50 AM',
    ownerName: 'Uttam Gupta',
    locationPath: '/02_Finance',
    tags: ['Tax', 'Compliance'],
    description: 'Guideline rules for regional corporate taxation filing cycles.',
    whoCanAccess: 'Finance Team, HR Officers',
    accessType: 'Can view, download',
    aiSummaryText: 'Tax filing guide outlining statutory deadlines, form requirements, and asset depreciation deductions rules.'
  }
};

export default function DocumentViewer() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Tooltip states for pure indicators
  const [tooltipText, setTooltipText] = useState<string | null>(null);
  const [tooltipTarget, setTooltipTarget] = useState<string | null>(null);

  // Conversion dialog modal state
  const [convertTargetFormat, setConvertTargetFormat] = useState<string | null>(null);
  const [conversionState, setConversionState] = useState<'idle' | 'converting' | 'success'>('idle');
  const [conversionProgress, setConversionProgress] = useState(0);

  // Detect if the ID is a real UUID (backend) or a mock/temp ID
  const isRealUUID = !!id && !id.startsWith('doc-') && !id.startsWith('temp-') && id.length > 20;

  // Fetch real document from backend if it's a UUID
  const { data: apiDoc } = useQuery({
    queryKey: ['document', id],
    queryFn: () => api.documents.get(id!),
    enabled: isRealUUID,
    staleTime: 30_000,
    retry: 1,
  });

  // Load documents database from localStorage if present (for mock IDs)
  let localDocs: any[] = [];
  try {
    const saved = localStorage.getItem('kms-documents-db');
    if (saved) localDocs = JSON.parse(saved);
  } catch (e) {
    console.error('Error loading documents db', e);
  }

  // Find document from local storage first
  const localDocMatch = localDocs.find((x: any) => x.id === id);
  const mockDocMatch = id ? mockDocsList[id] : undefined;
  
  let activeDoc: MockDoc;
  if (apiDoc && isRealUUID) {
    // Backend document — map to MockDoc shape
    activeDoc = {
      id: apiDoc.id,
      name: apiDoc.name,
      fileType: detectFileType(apiDoc.name, apiDoc.file_type).toUpperCase(),
      version: `v${apiDoc.current_version}`,
      lastModified: new Date(apiDoc.updated_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      ownerName: apiDoc.owner?.full_name || 'Unknown',
      locationPath: apiDoc.folder_id ? `/Folder ${apiDoc.folder_id}` : '/Workspace',
      tags: apiDoc.ai_keywords || [apiDoc.category || 'Document'],
      description: apiDoc.description || apiDoc.ai_summary || `Document: ${apiDoc.name}`,
      whoCanAccess: apiDoc.access_level === 'organization' ? 'All Employees' : apiDoc.access_level === 'department' ? `${apiDoc.owner?.department?.name || 'Department'} Team` : 'Permitted Users',
      accessType: 'Can view, edit',
      aiSummaryText: apiDoc.ai_summary || `AI summary for "${apiDoc.name}" is being generated. The AI Document Assistant is ready to answer questions about this document.`
    };
  } else if (localDocMatch) {
    // Resolve format dynamically based on file name first, falling back to mock or db
    const resolvedFileType = detectFileType(localDocMatch.name, localDocMatch.fileType || mockDocMatch?.fileType).toUpperCase();
    activeDoc = {
      id: localDocMatch.id,
      name: localDocMatch.name,
      fileType: resolvedFileType,
      version: localDocMatch.version || mockDocMatch?.version || 'v1.0',
      lastModified: localDocMatch.modifiedAt || mockDocMatch?.lastModified || 'Just now',
      ownerName: localDocMatch.ownerName || mockDocMatch?.ownerName || 'Paras Jain',
      locationPath: mockDocMatch?.locationPath || `/Corporate Knowledge/${localDocMatch.folderId || ''}`,
      tags: mockDocMatch?.tags || localDocMatch.name.split('.')[0].split(' '),
      description: mockDocMatch?.description || localDocMatch.description || `Metadata records for ${localDocMatch.name}`,
      whoCanAccess: mockDocMatch?.whoCanAccess || 'All Employees',
      accessType: mockDocMatch?.accessType || 'Can view, edit',
      aiSummaryText: mockDocMatch?.aiSummaryText || `Document profile for "${localDocMatch.name}" is resolved from local storage. The AI Document Assistant is ready.`
    };
  } else if (mockDocMatch) {
    activeDoc = mockDocMatch;
  } else if (id && id.startsWith('temp-')) {
    const rawName = id.replace('temp-', '').split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    activeDoc = {
      id: id,
      name: `${rawName}.docx`,
      fileType: 'DOCX',
      version: 'v1.0',
      lastModified: 'Just now',
      ownerName: 'Paras Jain (Template Creator)',
      locationPath: '/Templates',
      tags: ['Template', rawName],
      description: `New editable document generated from the standard ${rawName} template.`,
      whoCanAccess: 'All Employees',
      accessType: 'Can view, edit, share',
      aiSummaryText: `This document was instantiated from the corporate ${rawName} template. Content outlines departmental goals.`
    };
  } else {
    // Default document fallback
    activeDoc = {
      id: 'doc-default',
      name: 'Q2 Budget Report.docx',
      fileType: 'DOCX',
      version: 'v2.1',
      lastModified: '19 May 2026, 10:30 AM',
      ownerName: 'Paras Jain',
      locationPath: '/02_Finance/Reports',
      tags: ['Budget', 'Q2', 'Finance'],
      description: 'Quarter 2 budget report including departmental allocations, variances and forecasts.',
      whoCanAccess: 'Finance Team, Managers',
      accessType: 'Can view, download',
      aiSummaryText: 'This budget document outlines expenditure plans for the second quarter. Engineering operations receive a 24% allocation, with compliance and legal audits remaining unchanged.'
    };
  }

  const [activeFormat, setActiveFormat] = useState<string>(() => {
    return detectFileType(activeDoc.name, activeDoc.fileType).toUpperCase();
  });

  useEffect(() => {
    setActiveFormat(detectFileType(activeDoc.name, activeDoc.fileType).toUpperCase());
  }, [id, activeDoc.name, activeDoc.fileType]);

  // Centralized active document change announcer to sync right AI panel & metadata
  useEffect(() => {
    const title = activeDoc?.name || 'Untitled Document';
    const contextDetail = {
      title,
      fileType: activeFormat,
      department: activeDoc?.locationPath?.split('/')[1] || 'Operations',
      owner: activeDoc?.ownerName || 'Paras Jain',
      tags: activeDoc?.tags || [],
      version: activeDoc?.version || 'v1.0',
      fullContent: activeDoc?.aiSummaryText || 'Document metadata preview is active. The AI Document Assistant is ready.'
    };
    
    window.dispatchEvent(new CustomEvent('kms-active-document-change', {
      detail: contextDetail
    }));
  }, [id, activeDoc.name, activeDoc.fileType, activeDoc.ownerName, activeDoc.locationPath, activeDoc.version, activeDoc.aiSummaryText, activeFormat]);

  const [showInfoSidebar, setShowInfoSidebar] = useState(() => {
    const saved = localStorage.getItem('kms-editor-sidebar');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const handleToggleSidebar = () => {
    setShowInfoSidebar(prev => {
      const next = !prev;
      localStorage.setItem('kms-editor-sidebar', JSON.stringify(next));
      return next;
    });
  };

  const handleConvertAction = () => {
    if (!convertTargetFormat) return;
    setConversionState('converting');
    setConversionProgress(0);

    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setConversionProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        
        const targetExt = convertTargetFormat.toLowerCase() === 'pdf' ? 'pdf' :
                          convertTargetFormat.toLowerCase() === 'docx' ? 'docx' :
                          convertTargetFormat.toLowerCase() === 'xlsx' ? 'xlsx' :
                          convertTargetFormat.toLowerCase() === 'pptx' ? 'pptx' :
                          convertTargetFormat.toLowerCase() === 'txt' ? 'txt' :
                          convertTargetFormat.toLowerCase() === 'image' ? 'png' : 'csv';

        const sourceBase = activeDoc.name.substring(0, activeDoc.name.lastIndexOf('.')) || activeDoc.name;
        const newFileName = `${sourceBase}_converted.${targetExt}`;
        const newDocId = `doc-${Date.now()}`;

        const newDoc = {
          id: newDocId,
          name: newFileName,
          version: 'v1.0',
          fileType: convertTargetFormat,
          modifiedAt: new Date().toLocaleString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }),
          ownerName: activeDoc.ownerName,
          ownerInitials: activeDoc.ownerName.split(' ').map((n: string) => n[0]).join(''),
          size: (activeDoc as any).size || '350 KB',
          isFolder: false,
          folderId: (localDocMatch as any)?.folderId || 'reports',
          isFavorite: false,
          isLocked: false
        };

        const updatedDocs = [newDoc, ...localDocs];
        localStorage.setItem('kms-documents-db', JSON.stringify(updatedDocs));

        setConversionState('success');
        
        setTimeout(() => {
          setConvertTargetFormat(null);
          setConversionState('idle');
          navigate(`/documents/${newDocId}`);
        }, 1200);
      }
    }, 120);
  };

  const renderActiveWorkspace = () => {
    switch (activeFormat.toUpperCase()) {
      case 'DOCX':
        return <DocxEditor activeDoc={activeDoc} />;
      case 'PDF':
        return <PdfViewer activeDoc={activeDoc} />;
      case 'PPTX':
      case 'PPT':
        return <PptViewer activeDoc={activeDoc} />;
      case 'XLSX':
        return <XlsxViewer activeDoc={activeDoc} />;
      case 'IMAGE':
      case 'IMAGES':
        return <ImageViewer activeDoc={activeDoc} />;
      case 'TXT':
        return <TxtEditor activeDoc={activeDoc} />;
      default:
        return <DocxEditor activeDoc={activeDoc} />;
    }
  };

  if (activeFormat.toUpperCase() === 'DOCX') {
    return <DocxEditor activeDoc={activeDoc} />;
  }

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] -m-6 select-none font-sans">
           {/* 1. Header (Standard metadata header) */}
      <DocHeader
        name={activeDoc.name}
        fileType={activeFormat}
        version={activeDoc.version}
        lastModified={activeDoc.lastModified}
        ownerName={activeDoc.ownerName}
        onShareClick={() => alert(`Share modal (Mock)`)}
        onDownloadClick={() => alert(`Download triggered (Mock)`)}
        onHistoryClick={() => alert(`History log triggered (Mock)`)}
        onMoreClick={() => alert(`Options triggered (Mock)`)}
        onConvertTo={(targetFormat) => {
          setConvertTargetFormat(targetFormat);
          setConversionState('idle');
          setConversionProgress(0);
        }}
      />

      {/* 2. File Type Indicators */}
      <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0 select-none">
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-slate-400" />
            <span>File Type:</span>
          </span>
          <div className="flex items-center gap-1.5">
            {['DOCX', 'PDF', 'PPTX', 'XLSX', 'TXT', 'IMAGE'].map((fmt) => {
              const isActive = activeFormat === fmt;
              return (
                <div key={fmt} className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      if (!isActive) {
                        setTooltipText(`This document is a ${activeFormat} file.`);
                        if (activeFormat === 'XLSX') setTooltipText('This document is an XLSX spreadsheet.');
                        if (activeFormat === 'DOCX') setTooltipText('This document is a DOCX document.');
                        if (activeFormat === 'PDF') setTooltipText('This document is a PDF document.');
                        if (activeFormat === 'PPTX') setTooltipText('This document is a PowerPoint presentation.');
                        if (activeFormat === 'TXT') setTooltipText('This document is a Plain Text file.');
                        if (activeFormat === 'IMAGE') setTooltipText('This document is an Image file.');
                        
                        setTooltipTarget(fmt);
                        setTimeout(() => {
                          setTooltipText(null);
                          setTooltipTarget(null);
                        }, 2500);
                      }
                    }}
                    className={`px-3 py-1 rounded-lg border text-[10.5px] font-extrabold transition-all shadow-sm ${
                      isActive
                        ? 'bg-blue-600 border-blue-500 text-white font-extrabold cursor-default'
                        : 'bg-slate-100/50 border-slate-200 text-slate-400 cursor-not-allowed opacity-55'
                    }`}
                  >
                    {fmt}
                  </button>

                  {/* Absolute Glassmorphism Tooltip */}
                  {tooltipText && tooltipTarget === fmt && (
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-sm text-white text-[9.5px] px-2.5 py-1.5 rounded-lg font-bold whitespace-nowrap shadow-xl z-[99999] border border-slate-800 animate-in fade-in slide-in-from-bottom-1 duration-150">
                      {tooltipText}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900/90" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Info panel toggle button */}
        <button
          type="button"
          onClick={handleToggleSidebar}
          className={`px-3 py-1 border rounded-lg text-[10.5px] font-extrabold transition-all shadow-sm flex items-center gap-1.5 bg-white ${
            showInfoSidebar
              ? 'border-blue-600 text-blue-600'
              : 'border-slate-200 hover:border-slate-350 text-slate-600 hover:text-slate-900'
          }`}
          title="Toggle info sidebar"
        >
          <Info className="w-3.5 h-3.5" />
          <span>Properties</span>
          {showInfoSidebar ? (
            <ChevronRight className="w-3 h-3 ml-0.5" />
          ) : (
            <ChevronLeft className="w-3 h-3 ml-0.5" />
          )}
        </button>
      </div>

      {/* 3. Main Workspace Container */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Workspace details */}
        <div className="flex-1 overflow-hidden relative">
          {renderActiveWorkspace()}
        </div>

        {/* Collapsible Info sidebar */}
        {showInfoSidebar && (
          <div className="animate-in slide-in-from-right-6 duration-200 border-l border-slate-200">
            <DocInfoSidebar
              locationPath={activeDoc.locationPath}
              ownerName={activeDoc.ownerName}
              createdOn="14 May 2026, 11:00 AM"
              lastModified={activeDoc.lastModified}
              tags={activeDoc.tags}
              description={activeDoc.description}
              whoCanAccess={activeDoc.whoCanAccess}
              accessType={activeDoc.accessType}
              aiSummaryText={activeDoc.aiSummaryText}
              documentId={id}
            />
          </div>
        )}

      </div>

      {/* 4. PROFESSIONAL FILE CONVERSION MODAL */}
      {convertTargetFormat && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-6 animate-in fade-in duration-200 select-none">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-[450px] overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
            
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <span className="font-extrabold text-sm text-slate-900">Convert File</span>
              {conversionState === 'idle' && (
                <button
                  type="button"
                  onClick={() => setConvertTargetFormat(null)}
                  className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {conversionState === 'idle' && (
                <>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-xs font-semibold">
                      <span className="text-slate-400">Source Document:</span>
                      <span className="text-slate-800 font-extrabold font-mono text-[11px] truncate max-w-[240px]">{activeDoc.name}</span>
                    </div>

                    <div className="flex justify-between items-center text-xs font-semibold">
                      <span className="text-slate-400">Target Format:</span>
                      <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded border border-blue-100 font-extrabold text-[10px]">
                        {convertTargetFormat}
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-4 space-y-3">
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input 
                        type="checkbox" 
                        defaultChecked 
                        className="rounded text-blue-600 border-slate-300 focus:ring-blue-500 h-4 w-4" 
                      />
                      <span className="text-xs text-slate-700 font-semibold select-none">Preserve formatting</span>
                    </label>

                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input 
                        type="checkbox" 
                        defaultChecked 
                        disabled
                        className="rounded text-blue-600 border-slate-300 focus:ring-blue-500 h-4 w-4 cursor-not-allowed" 
                      />
                      <span className="text-xs text-slate-500 font-semibold select-none">Create as new document</span>
                    </label>
                  </div>
                </>
              )}

              {conversionState === 'converting' && (
                <div className="py-8 flex flex-col items-center justify-center space-y-4">
                  <div className="w-12 h-12 rounded-full border-4 border-slate-100 border-t-blue-600 animate-spin" />
                  <div className="text-center">
                    <h4 className="font-extrabold text-sm text-slate-900">Converting Document...</h4>
                    <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-wider">{conversionProgress}% Completed</p>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 max-w-[280px] overflow-hidden">
                    <div className="bg-blue-650 h-full transition-all duration-150" style={{ width: `${conversionProgress}%` }} />
                  </div>
                </div>
              )}

              {conversionState === 'success' && (
                <div className="py-8 flex flex-col items-center justify-center space-y-3 text-center">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 font-black text-xl animate-bounce">✓</div>
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900">Conversion Successful!</h4>
                    <p className="text-[10.5px] text-slate-450 mt-1 font-semibold">Creating records and loading new workspace...</p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            {conversionState === 'idle' && (
              <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setConvertTargetFormat(null)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-650 bg-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConvertAction}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors border border-blue-500"
                >
                  Convert
                </button>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
