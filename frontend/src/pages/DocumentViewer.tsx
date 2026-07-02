import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { 
  FileText, 
  Download, 
  Tag, 
  Layers, 
  Sparkles, 
  ArrowLeft,
  Files
} from 'lucide-react';

export default function DocumentViewer() {
  const { id } = useParams<{ id: string }>();

  // Fetch document details
  const { data: doc, isLoading, isError } = useQuery({
    queryKey: ['document-viewer', id],
    queryFn: () => id ? api.documents.get(id) : null,
    enabled: !!id
  });

  // Fetch related/similar documents
  const { data: relatedDocs } = useQuery({
    queryKey: ['related-documents', id],
    queryFn: () => id ? api.ai.related(id) : [],
    enabled: !!id
  });

  // Fetch version list
  const { data: versions } = useQuery({
    queryKey: ['doc-versions-viewer', id],
    queryFn: () => id ? api.documents.versions(id) : [],
    enabled: !!id
  });

  const handleDownload = async () => {
    if (!doc) return;
    try {
      const blob = await api.documents.download(doc.id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${doc.name}.${doc.file_type}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      alert('Failed to download document.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-slate-500">Loading document metadata...</div>
      </div>
    );
  }

  if (isError || !doc) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-700">
        <h3 className="font-semibold">Document not found or access denied</h3>
        <p className="text-sm mt-1">You may not have the required permissions to view this document.</p>
        <Link to="/documents" className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline">
          <ArrowLeft className="h-3 w-3" /> Back to Files
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button header */}
      <div className="flex items-center justify-between">
        <Link 
          to="/documents" 
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Folder tree</span>
        </Link>
        <button
          onClick={handleDownload}
          className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3.5 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
        >
          <Download className="h-4 w-4" /> Download
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left main metadata */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Info */}
          <div className="border border-slate-200 rounded-lg bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">{doc.name}</h1>
                <p className="text-xs text-slate-400 mt-0.5 uppercase font-semibold">
                  {doc.file_type} File • {doc.category || 'General'}
                </p>
              </div>
            </div>
            {doc.description && (
              <div className="border-t border-slate-100 pt-4 text-sm text-slate-700 leading-relaxed">
                <h3 className="font-semibold text-slate-800 mb-1">Description</h3>
                {doc.description}
              </div>
            )}
          </div>

          {/* AI generated Summary */}
          <div className="border border-slate-200 rounded-lg bg-white p-6 shadow-sm space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Sparkles className="h-5 w-5 text-blue-500" />
              <h2 className="font-semibold text-slate-800">AI Summary & Metadata</h2>
            </div>
            <div className="text-sm text-slate-700 leading-relaxed bg-slate-50 border border-slate-100 p-4 rounded-lg">
              {doc.ai_summary || "AI processing in progress. Summary will appear shortly."}
            </div>
            
            {doc.ai_keywords && doc.ai_keywords.length > 0 && (
              <div className="space-y-2 pt-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Generated Keywords</span>
                <div className="flex flex-wrap gap-2">
                  {doc.ai_keywords.map((kw: string) => (
                    <span key={kw} className="inline-flex items-center gap-1 rounded bg-blue-50 border border-blue-100 px-2.5 py-0.5 text-xs text-blue-700">
                      <Tag className="h-3 w-3 text-blue-400" />
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right side info panel: Versions and Related Documents */}
        <div className="space-y-6">
          {/* Version list */}
          <div className="border border-slate-200 rounded-lg bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Layers className="h-5 w-5 text-slate-400" />
              <h2 className="font-semibold text-slate-800">Version History</h2>
            </div>
            <div className="space-y-2">
              {versions && versions.length > 0 ? (
                versions.map((ver: any) => (
                  <div key={ver.id} className="flex justify-between items-center text-xs p-2.5 bg-slate-50 border border-slate-100 rounded">
                    <div>
                      <span className="font-bold text-slate-700">Version {ver.version_number}</span>
                      <span className="text-slate-400 block mt-0.5">{new Date(ver.uploaded_at).toLocaleString()}</span>
                    </div>
                    {ver.version_number === doc.current_version && (
                      <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] text-emerald-700 font-medium">
                        Active
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center text-slate-400 text-xs py-4">No version history found.</div>
              )}
            </div>
          </div>

          {/* Related documents */}
          <div className="border border-slate-200 rounded-lg bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Files className="h-5 w-5 text-slate-400" />
              <h2 className="font-semibold text-slate-800 font-medium">Related Knowledge</h2>
            </div>
            <div className="space-y-3">
              {relatedDocs && relatedDocs.length > 0 ? (
                relatedDocs.map((r: any) => (
                  <Link
                    key={r.id}
                    to={`/documents/${r.id}`}
                    className="block p-3 border border-slate-100 rounded-lg hover:border-blue-300 hover:bg-slate-50 transition-colors"
                  >
                    <h4 className="text-xs font-semibold text-slate-800 truncate">{r.name}</h4>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block mt-1">{r.file_type} • {r.category || 'General'}</span>
                  </Link>
                ))
              ) : (
                <div className="text-center text-slate-400 text-xs py-4">No related documents found.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
