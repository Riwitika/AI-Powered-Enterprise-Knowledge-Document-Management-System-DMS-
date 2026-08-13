import { X, FileText } from 'lucide-react';

interface WordCountModalProps {
  text: string;
  html: string;
  onClose: () => void;
}

export default function WordCountModal({ text, html, onClose }: WordCountModalProps) {
  const wordsCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const charsCount = text.length;
  const charsNoSpacesCount = text.replace(/\s+/g, '').length;
  const paragraphsCount = html ? (html.match(/<p[^>]*>/gi) || []).length || 1 : 0;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-6 select-none animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-[420px] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2 text-slate-900">
            <FileText className="w-4.5 h-4.5 text-blue-600" />
            <span className="font-extrabold text-sm">Word Count Statistics</span>
          </div>
          <button type="button" onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs font-semibold text-slate-700">
          <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
            <span className="text-slate-500">Words</span>
            <span className="font-bold text-slate-900 text-sm">{wordsCount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
            <span className="text-slate-500">Characters</span>
            <span className="font-bold text-slate-900 text-sm">{charsCount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
            <span className="text-slate-500">Characters (no spaces)</span>
            <span className="font-bold text-slate-900 text-sm">{charsNoSpacesCount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center py-1.5">
            <span className="text-slate-500">Paragraphs</span>
            <span className="font-bold text-slate-900 text-sm">{paragraphsCount.toLocaleString()}</span>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold shadow-sm transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
