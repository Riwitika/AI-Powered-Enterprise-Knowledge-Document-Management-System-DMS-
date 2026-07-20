import { useState } from 'react';
import { useParams } from 'react-router-dom';
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

const mockDocsList: Record<string, MockDoc> = {
  'doc-1': {
    id: 'doc-1',
    name: 'Q2 Budget Report.docx',
    fileType: 'DOCX',
    version: 'v2.1',
    lastModified: '19 May 2024, 10:30 AM',
    ownerName: 'Amit Verma',
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
    lastModified: '19 May 2024, 09:15 AM',
    ownerName: 'Rohit Sharma',
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
    lastModified: '18 May 2024, 04:20 PM',
    ownerName: 'Neha Gupta',
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
    lastModified: '18 May 2024, 11:00 AM',
    ownerName: 'Rohit Sharma',
    locationPath: '/00_Company_Information',
    tags: ['Roadmap', 'Product', 'Presentation'],
    description: '2024 overview roadmap for the primary enterprise software release.',
    whoCanAccess: 'All Employees',
    accessType: 'Can view',
    aiSummaryText: 'Presentation slides detailing 2024 milestones. Research and architecture are signed off in Q1, with closing release cycles scheduled for Q4.'
  }
};

export default function DocumentViewer() {
  const { id } = useParams<{ id: string }>();
  const [activeFormat, setActiveFormat] = useState<string>('DOCX');
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

  // Read routing details or fall back to default
  let activeDoc: MockDoc = id && mockDocsList[id] ? mockDocsList[id] : {
    id: 'doc-default',
    name: 'Q2 Budget Report.docx',
    fileType: 'DOCX',
    version: 'v2.1',
    lastModified: '19 May 2024, 10:30 AM',
    ownerName: 'Amit Verma',
    locationPath: '/02_Finance/Reports',
    tags: ['Budget', 'Q2', 'Finance'],
    description: 'Quarter 2 budget report including departmental allocations, variances and forecasts.',
    whoCanAccess: 'Finance Team, Managers',
    accessType: 'Can view, download',
    aiSummaryText: 'This budget document outlines expenditure plans for the second quarter. Engineering operations receive a 24% allocation, with compliance and legal audits remaining unchanged.'
  };

  if (id && id.startsWith('temp-')) {
    const rawName = id.replace('temp-', '').split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    activeDoc = {
      id: id,
      name: `${rawName}.docx`,
      fileType: 'DOCX',
      version: 'v1.0',
      lastModified: 'Just now',
      ownerName: 'Amit Verma (Template Creator)',
      locationPath: '/Templates',
      tags: ['Template', rawName],
      description: `New editable document generated from the standard ${rawName} template.`,
      whoCanAccess: 'All Employees',
      accessType: 'Can view, edit, share',
      aiSummaryText: `This document was instantiated from the corporate ${rawName} template. Content outlines departmental goals.`
    };
  }

  // Switch format based on user testing selectors
  const handleFormatChange = (format: string) => {
    setActiveFormat(format);
  };

  const renderActiveWorkspace = () => {
    switch (activeFormat.toUpperCase()) {
      case 'DOCX':
        return <DocxEditor activeDoc={activeDoc} />;
      case 'PDF':
        return <PdfViewer />;
      case 'PPTX':
      case 'PPT':
        return <PptViewer />;
      case 'XLSX':
        return <XlsxViewer />;
      case 'IMAGE':
      case 'IMAGES':
        return <ImageViewer />;
      case 'TXT':
        return <TxtEditor />;
      default:
        return <DocxEditor activeDoc={activeDoc} />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] -m-8 select-none font-sans">
      
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
      />

      {/* 2. Format Switcher for Development & User Testing */}
      <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0 select-none">
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-slate-400" />
            <span>Format Switcher:</span>
          </span>
          <div className="flex items-center gap-1.5">
            {['DOCX', 'PDF', 'PPTX', 'XLSX', 'TXT', 'IMAGE'].map((fmt) => (
              <button
                key={fmt}
                type="button"
                onClick={() => handleFormatChange(fmt)}
                className={`px-3 py-1 rounded-lg border text-[10.5px] font-extrabold transition-all shadow-sm ${
                  activeFormat === fmt
                    ? 'bg-blue-600 border-blue-500 text-white font-extrabold'
                    : 'bg-white border-slate-200 hover:border-slate-350 text-slate-650 hover:text-slate-900'
                }`}
              >
                {fmt}
              </button>
            ))}
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
              createdOn="14 May 2024, 11:00 AM"
              lastModified={activeDoc.lastModified}
              tags={activeDoc.tags}
              description={activeDoc.description}
              whoCanAccess={activeDoc.whoCanAccess}
              accessType={activeDoc.accessType}
              aiSummaryText={activeDoc.aiSummaryText}
            />
          </div>
        )}

      </div>

    </div>
  );
}
