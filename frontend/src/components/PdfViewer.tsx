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

export default function PdfViewer() {
  const [zoom, setZoom] = useState(100);
  const [page, setPage] = useState(1);
  const totalPages = 12;

  const handlePrint = () => {
    alert('Initiating print flow... (Mock)');
  };

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
            onClick={() => alert('Download triggered (Mock)')}
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
            Vendor Agreement
          </div>

          <p className="font-semibold text-slate-650 italic">
            This Agreement is made on this 18th day of May, 2024 by and between Fast Trade Technologies Pvt. Ltd. and the undersigned vendor.
          </p>

          <div className="space-y-4 pt-4">
            <div>
              <h3 className="font-extrabold text-xs text-slate-900 uppercase tracking-wide">1. Scope of Work</h3>
              <p className="mt-1.5 text-slate-700">
                The vendor agrees to provide the services as outlined in the Statement of Work (SOW). All deliverables must be supplied within the timelines specified under Appendix A.
              </p>
            </div>

            <div>
              <h3 className="font-extrabold text-xs text-slate-900 uppercase tracking-wide">2. Terms and Conditions</h3>
              
              <h4 className="font-bold text-[11.5px] text-slate-800 mt-2">2.1 Payment Terms</h4>
              <p className="mt-1 text-slate-700">
                Payments will be made within 30 days of invoice receipt. Overdue balances shall accumulate interest at the standard regulatory interest rate.
              </p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
