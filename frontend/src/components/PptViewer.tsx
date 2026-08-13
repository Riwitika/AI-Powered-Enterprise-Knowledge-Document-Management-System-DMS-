import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Download, FileText, Presentation } from 'lucide-react';

export default function PptViewer({ activeDoc }: { activeDoc: any }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  const docId = activeDoc?.id;
  const isRealUUID = typeof docId === 'string' && docId.length === 36;
  const extractedPreview = (activeDoc?.content || '').trim();

  useEffect(() => {
    if (!isRealUUID) {
      setLoading(false);
      setError('Preview requires a stored presentation file.');
      return;
    }

    let active = true;
    const loadPresentation = async () => {
      try {
        setLoading(true);
        setError(null);
        const blob = await api.documents.download(docId);
        if (active) {
          setBlobUrl(URL.createObjectURL(blob));
        }
      } catch (err) {
        console.error('Failed to load presentation:', err);
        if (active) setError('Failed to load the original presentation file.');
      } finally {
        if (active) setLoading(false);
      }
    };

    loadPresentation();
    return () => {
      active = false;
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [docId]);

  const handleDownload = () => {
    if (!blobUrl) return;
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = `${activeDoc?.name || 'presentation'}.${activeDoc?.fileType?.toLowerCase() || 'pptx'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50">
        <div className="text-center space-y-2">
          <div className="h-6 w-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Loading Presentation...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-[#f3f4f6]/40 select-none">
      <div className="flex-1 flex flex-col items-center justify-center p-8 gap-6 overflow-auto">
        <div className="max-w-xl w-full bg-white border border-slate-200 rounded-2xl shadow-sm p-8 text-center space-y-4">
          <Presentation className="w-12 h-12 text-amber-600 mx-auto" />
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">{activeDoc?.name || 'Presentation'}</h2>
            <p className="text-xs text-slate-500 font-semibold mt-1">
              Original PPTX file preserved. Full slide editing is not supported in the editor.
            </p>
          </div>
          {error ? (
            <p className="text-xs text-rose-600 font-semibold">{error}</p>
          ) : (
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold"
            >
              <Download className="w-4 h-4" />
              Download Original PPTX
            </button>
          )}
        </div>

        {extractedPreview && (
          <div className="max-w-3xl w-full bg-white border border-slate-200 rounded-2xl shadow-sm p-6 text-left">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-4 h-4 text-slate-500" />
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-600">Extracted Text Preview</h3>
            </div>
            <pre className="text-xs text-slate-700 whitespace-pre-wrap font-medium leading-relaxed max-h-[320px] overflow-auto">{extractedPreview}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
