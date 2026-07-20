import { useState } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  Printer, 
  Download, 
  Search, 
  ChevronLeft, 
  ChevronRight 
} from 'lucide-react';

export default function PdfViewer({ activeDoc }: { activeDoc: any }) {
  const [zoom, setZoom] = useState(100);
  const [page, setPage] = useState(1);
  const totalPages = 3;

  const handlePrint = () => {
    alert('Initiating print flow... (Mock)');
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

  return (
    <div className="flex flex-col h-full bg-[#f3f4f6]/40 select-none">
      
      {/* 1. PDF Toolbar */}
      <div className="bg-white border-b border-slate-200/80 px-6 py-2 flex items-center justify-between shrink-0 text-slate-650">
        
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
            onClick={() => alert(`Download triggered for: "${activeDoc?.name}"`)}
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
