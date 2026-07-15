import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { FileText, Printer, ShieldAlert, Eye, Globe } from 'lucide-react';

export default function PublicDocumentViewer() {
  const { id } = useParams<{ id: string }>();
  const [zoomPercent, setZoomPercent] = useState<string>('100');

  const { data: doc, isLoading, error } = useQuery({
    queryKey: ['public-document', id],
    queryFn: () => id ? api.documents.getPublic(id) : null,
    enabled: !!id,
    retry: false
  });

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50">
        <div className="text-center space-y-3">
          <div className="h-8 w-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Retrieving Public Content...</p>
        </div>
      </div>
    );
  }

  if (error || !doc) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full text-center space-y-4 bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
          <div className="h-12 w-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h2 className="font-extrabold text-slate-900 text-lg">Access Denied or Not Found</h2>
          <p className="text-slate-500 text-xs leading-relaxed">
            This document might not exist, or it is private. Access is limited to authenticated corporate users only.
          </p>
          <Link 
            to="/login"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-5 py-2.5 text-xs font-bold shadow-sm transition-all"
          >
            Log In to Enterprise Account
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen bg-[#f4f7f6] overflow-hidden font-sans">
      {/* Premium Public Header */}
      <header className="h-16 border-b border-slate-200 bg-white px-6 flex items-center justify-between shrink-0 select-none shadow-sm z-30">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-slate-950 font-black shadow-md shrink-0">
            <FileText className="h-4.5 w-4.5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-slate-800 text-sm">{doc.name}</h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-extrabold bg-blue-50 text-blue-600 uppercase">
                <Globe className="h-2.5 w-2.5" /> Public Access
              </span>
              <span className="text-[10px] text-slate-400">•</span>
              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-slate-450 uppercase">
                <Eye className="h-2.5 w-2.5" /> View Only Mode
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Zoom Control */}
          <div className="flex items-center gap-2 border border-slate-200 rounded-lg px-2.5 py-1 bg-slate-50">
            <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">Zoom</span>
            <select
              value={zoomPercent}
              onChange={(e) => setZoomPercent(e.target.value)}
              className="bg-transparent border-none py-0.5 focus:outline-none focus:ring-0 text-[10px] font-bold text-slate-700 cursor-pointer"
            >
              <option value="75">75%</option>
              <option value="100">100%</option>
              <option value="125">125%</option>
              <option value="150">150%</option>
            </select>
          </div>

          <button
            onClick={() => window.print()}
            className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg transition-colors flex items-center justify-center"
            title="Print Document"
          >
            <Printer className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Editor Canvas Container */}
      <main className="flex-1 overflow-y-auto pt-8 pb-8 px-4 flex justify-center items-start bg-[#f4f7f6] custom-scrollbar">
        <div 
          className="bg-white border border-[#d3dbe9] shadow-[0_1px_3px_rgba(0,0,0,0.1),_0_1px_2px_rgba(0,0,0,0.06)] min-h-[1056px] p-16 w-full max-w-[1240px] transition-all relative font-sans leading-relaxed text-[#202124] text-[14.5px] rounded-none overflow-hidden"
          style={{ transform: `scale(${Number(zoomPercent)/100})`, transformOrigin: 'top center' }}
        >
          {/* Read only mode top bar banner */}
          <div className="absolute top-0 left-0 right-0 h-10 bg-slate-100 border-b border-[#e1e3e1] flex items-center justify-center text-xs text-slate-500 font-bold select-none uppercase tracking-wider gap-2">
            <Globe className="h-3.5 w-3.5 text-slate-400" />
            <span>Public Document Mode • Download & Editing Restricted</span>
          </div>

          <div
            className="focus:outline-none min-h-[960px] font-sans text-[#202124] leading-relaxed text-[14.5px] w-full max-w-full break-words outline-none mt-4"
            dangerouslySetInnerHTML={{ __html: doc.content || `<p className="italic text-slate-400">This document has no content to display.</p>` }}
          />
        </div>
      </main>
    </div>
  );
}
