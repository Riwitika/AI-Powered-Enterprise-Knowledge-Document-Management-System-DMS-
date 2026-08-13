import { useState } from 'react';
import { Search, X, Replace } from 'lucide-react';
import { Editor } from '@tiptap/react';

interface FindReplaceModalProps {
  editor: Editor | null;
  onClose: () => void;
}

export default function FindReplaceModal({ editor, onClose }: FindReplaceModalProps) {
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [statusMsg, setStatusMsg] = useState('');

  const handleFind = () => {
    if (!editor || !findText.trim()) return;
    const docText = editor.getText();
    const matches = (docText.match(new RegExp(findText, 'gi')) || []).length;
    if (matches > 0) {
      setStatusMsg(`Found ${matches} match${matches > 1 ? 'es' : ''}.`);
    } else {
      setStatusMsg('No matches found.');
    }
  };

  const handleReplaceAll = () => {
    if (!editor || !findText.trim()) return;
    const currentHtml = editor.getHTML();
    const regex = new RegExp(findText, 'gi');
    const matches = (currentHtml.match(regex) || []).length;
    if (matches > 0) {
      const updatedHtml = currentHtml.replace(regex, replaceText);
      editor.commands.setContent(updatedHtml);
      setStatusMsg(`Replaced ${matches} instance${matches > 1 ? 's' : ''}.`);
    } else {
      setStatusMsg('No matches to replace.');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-6 select-none animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-[440px] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2 text-slate-900">
            <Search className="w-4.5 h-4.5 text-blue-600" />
            <span className="font-extrabold text-sm">Find and Replace</span>
          </div>
          <button type="button" onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Find</label>
            <input
              type="text"
              value={findText}
              onChange={(e) => { setFindText(e.target.value); setStatusMsg(''); }}
              placeholder="Text to find..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs focus:outline-none focus:bg-white text-slate-850 font-semibold"
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Replace with</label>
            <input
              type="text"
              value={replaceText}
              onChange={(e) => setReplaceText(e.target.value)}
              placeholder="Replacement text..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs focus:outline-none focus:bg-white text-slate-850 font-semibold"
            />
          </div>

          {statusMsg && (
            <p className="text-[11px] font-bold text-blue-600 bg-blue-50 border border-blue-100 rounded-lg px-3 py-1.5">
              {statusMsg}
            </p>
          )}
        </div>

        <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-between gap-2">
          <button
            type="button"
            onClick={handleFind}
            className="px-4 py-2 border border-slate-200 hover:bg-slate-100 rounded-xl text-xs font-extrabold text-slate-700 bg-white"
          >
            Find Next
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleReplaceAll}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold shadow-sm transition-colors flex items-center gap-1.5"
            >
              <Replace className="w-3.5 h-3.5" /> Replace All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
