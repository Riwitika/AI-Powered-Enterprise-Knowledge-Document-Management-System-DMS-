import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { 
  ZoomIn, 
  ZoomOut, 
  Printer, 
  Download, 
  Search, 
  ChevronLeft, 
  ChevronRight,
  FileText
} from 'lucide-react';

export default function PdfViewer({ activeDoc }: { activeDoc: any }) {
  const [zoom, setZoom] = useState(100);
  const [page, setPage] = useState(1);
  const totalPages = 3;

  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const docId = activeDoc?.id;
  const isRealUUID = typeof docId === 'string' && docId.length === 36;

  useEffect(() => {
    if (!isRealUUID) {
      setLoading(false);
      return;
    }
    
    let active = true;
    const loadFile = async () => {
      try {
        setLoading(true);
        setError(null);
        const blob = await api.documents.download(docId);
        if (active) {
          const url = URL.createObjectURL(blob);
          setBlobUrl(url);
        }
      } catch (err: any) {
        console.error('Failed to load PDF file:', err);
        if (active) {
          setError('Failed to fetch the PDF file from the secure storage server.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    loadFile();

    return () => {
      active = false;
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [docId]);

  const handlePrint = () => {
    if (blobUrl) {
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = blobUrl;
      document.body.appendChild(iframe);
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } else {
      window.print();
    }
  };

  const handleDownload = () => {
    if (blobUrl) {
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = activeDoc?.name || 'document.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      const contentText = 'Mock PDF Download Content';
      const blob = new Blob([contentText], { type: 'text/plain;charset=utf-8' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${activeDoc?.name || 'document'}.pdf`;
      link.click();
    }
  };

  const getPdfContent = () => {
    const name = activeDoc?.name || '';
    if (name.toLowerCase().includes('vendor')) {
      return {
        title: 'Vendor Procurement Agreement',
        subtitle: 'Confidential Services Contract',
        sections: [
          {
            title: '1. Scope of Work',
            text: 'The vendor agrees to deliver technical development services as detailed in the Statement of Work (SOW). All source codes and builds must compile without strict warnings, complying with enterprise repository configurations.'
          },
          {
            title: '2. Terms & Liabilities',
            text: 'Payments shall resolve on Net 30 terms from invoicing cycles. Undisputed delays are subject to a statutory interest calculation. Intellectual property transfers fully to Fast Trade DMS upon payment closure.'
          }
        ]
      };
    } else if (name.toLowerCase().includes('annual') || name.toLowerCase().includes('compliance')) {
      return {
        title: 'Annual Financial Summary & Compliance',
        subtitle: 'FY 2025 Consolidated Ledger Review',
        sections: [
          {
            title: '1. Financial Performance Highlights',
            text: 'Gross operating revenues resolved at ₹425.4 Cr (14.8% YoY growth). Key drivers include corporate license expansions and the cloud collaboration suite rollout. Net operating margins closed at 32.5%.'
          },
          {
            title: '2. Capital Reserves & Liquidity',
            text: 'Retained earnings increased to ₹82.6 Cr. Liquid assets remain stable at ₹40M. Interest overhead from borrowing decreases by 6.2% due to rapid debt reconciliation.'
          }
        ]
      };
    } else {
      return {
        title: activeDoc?.name || 'KMS Compliance Guidelines',
        subtitle: 'Fast Trade Enterprise Knowledge Record',
        sections: [
          {
            title: '1. General Regulatory Provisions',
            text: 'All employees must record information blueprints within the designated KMS repository. Document security visibility filters remain active depending on roles (Employee, Manager, Admin).'
          },
          {
            title: '2. Compliance & Audit Audits',
            text: 'Auditing runs weekly. Authorized document exports or downloading files without proper clearances are subject to review logs.'
          }
        ]
      };
    }
  };

  const pdfData = getPdfContent();

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50">
        <div className="text-center space-y-2">
          <div className="h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Loading Secure Document File...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50 text-center">
        <div className="max-w-md space-y-3">
          <FileText className="h-10 w-10 text-rose-500 mx-auto animate-bounce" />
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Secure Access Error</h3>
          <p className="text-[10.5px] text-slate-500 font-medium leading-relaxed">{error}</p>
        </div>
      </div>
    );
  }

  // Render native browser PDF preview via Blob Url
  if (blobUrl) {
    return (
      <div className="flex flex-col h-full bg-[#f3f4f6]/40 relative">
        <div className="bg-white border-b border-slate-200/80 px-6 py-2.5 flex items-center justify-between shrink-0 text-slate-600 select-none z-10 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 text-[8.5px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider">Secure PDF Preview</span>
            <span className="text-xs font-bold text-slate-700 truncate max-w-sm">{activeDoc.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <button 
              type="button" 
              onClick={handlePrint}
              className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-800 transition-colors"
              title="Print Document"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button 
              type="button" 
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
              title="Download File"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>
          </div>
        </div>
        <div className="flex-1 w-full bg-slate-800">
          <iframe 
            src={`${blobUrl}#toolbar=1`} 
            className="w-full h-full border-none" 
            title="Secure PDF File Viewer" 
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#f3f4f6]/40 select-none">
      
      {/* 1. PDF Toolbar */}
      <div className="bg-white border-b border-slate-200/80 px-6 py-2 flex items-center justify-between shrink-0 text-slate-655">
        
        {/* Page Nav */}
        <div className="flex items-center gap-2">
          <button 
            type="button" 
            disabled={page <= 1}
            onClick={() => setPage(prev => Math.max(1, prev - 1))}
            className="p-1 hover:bg-slate-100 rounded disabled:opacity-40 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <div className="flex items-center gap-1 text-xs font-bold text-slate-800">
            <span className="px-1.5 py-0.5 border border-slate-200 bg-slate-50 rounded">{page}</span>
            <span className="text-slate-400">/</span>
            <span>{totalPages}</span>
          </div>

          <button 
            type="button" 
            disabled={page >= totalPages}
            onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
            className="p-1 hover:bg-slate-100 rounded disabled:opacity-40 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Zoom */}
        <div className="flex items-center gap-2">
          <button 
            type="button" 
            onClick={() => setZoom(prev => Math.max(50, prev - 10))}
            className="p-1 hover:bg-slate-100 rounded text-slate-500"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          
          <span className="text-xs font-extrabold text-slate-700 w-12 text-center">{zoom}%</span>

          <button 
            type="button" 
            onClick={() => setZoom(prev => Math.min(200, prev + 10))}
            className="p-1 hover:bg-slate-100 rounded text-slate-500"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>

        {/* Search & Actions */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
            <input
              type="text"
              placeholder="Search PDF..."
              className="bg-[#f8fafc] border border-slate-200 rounded px-2 pl-7 py-1 text-[11px] font-bold text-slate-700 focus:outline-none focus:bg-white focus:border-blue-600 transition-all placeholder-slate-400"
            />
          </div>
          
          <button 
            type="button" 
            onClick={handlePrint}
            className="p-1.5 hover:bg-slate-100 rounded text-slate-500"
            title="Print Document"
          >
            <Printer className="w-4 h-4" />
          </button>

          <button 
            type="button" 
            onClick={handleDownload}
            className="p-1.5 hover:bg-slate-100 rounded text-slate-500"
            title="Download PDF"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>

      </div>

      {/* 2. Document view paper page */}
      <div className="flex-1 overflow-y-auto p-8 flex justify-center custom-scrollbar">
        <div 
          className="bg-white border border-slate-250/60 shadow-[0_2px_12px_rgba(0,0,0,0.03)] w-full max-w-[700px] min-h-[850px] p-12.5 rounded-sm select-text font-serif text-[12.5px] leading-relaxed text-slate-800 space-y-6"
          style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
        >
          <div className="text-center font-extrabold text-lg uppercase tracking-widest text-slate-900 border-b-2 border-slate-900 pb-3">
            {pdfData.title}
          </div>

          <p className="font-semibold text-slate-650 italic text-center">
            {pdfData.subtitle}
          </p>

          <div className="space-y-4 pt-4">
            {pdfData.sections.map((sect, idx) => (
              <div key={idx} className="space-y-1.5">
                <h3 className="font-extrabold text-xs text-slate-900 uppercase tracking-wide">{sect.title}</h3>
                <p className="text-slate-700 leading-relaxed">{sect.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
