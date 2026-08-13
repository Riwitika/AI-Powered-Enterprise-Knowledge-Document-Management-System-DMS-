import { useState, useEffect, useRef } from 'react';
import { Undo2, Redo2 } from 'lucide-react';
import { api } from '../api/client';
import { useQueryClient } from '@tanstack/react-query';

export default function TxtEditor({ activeDoc }: { activeDoc: any }) {
  const queryClient = useQueryClient();
  const docId = activeDoc?.id;
  const isRealUUID = !!docId && !docId.startsWith('doc-') && !docId.startsWith('temp-') && docId.length > 20;

  const [text, setText] = useState(() => {
    if (isRealUUID) {
      return activeDoc?.content || '';
    }
    // Fallback for mock/local files
    return `Fast Trade Technologies Pvt. Ltd. — Technical Raw Notes\n\n` +
      `File Name: ${activeDoc?.name || 'document.txt'}\n` +
      `Last Modified: ${activeDoc?.lastModified || 'Just now'}\n` +
      `Owner: ${activeDoc?.ownerName || 'Paras Jain'}\n\n` +
      `This plain text document is loaded dynamically in the KMS raw text preview editor workspace.`;
  });

  const [saveStatus, setSaveStatus] = useState<'Saved ✓' | 'Saving...' | 'Save Failed' | 'Unsaved changes'>('Saved ✓');
  const timeoutRef = useRef<any>(null);
  const isInitialMount = useRef(true);

  // Autosave effect
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (!isRealUUID) return;

    setSaveStatus('Saving...');
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(async () => {
      try {
        await api.documents.update(docId, { content: text });
        setSaveStatus('Saved ✓');
        // Invalidate active document query to keep cache in sync
        queryClient.invalidateQueries({ queryKey: ['document', docId] });
      } catch (err) {
        console.error('Autosave failed:', err);
        setSaveStatus('Save Failed');
      }
    }, 1200);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [text, docId, isRealUUID, queryClient]);

  // Handle manual save
  const handleManualSave = async () => {
    if (!isRealUUID) return;
    setSaveStatus('Saving...');
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    try {
      await api.documents.update(docId, { content: text });
      setSaveStatus('Saved ✓');
      queryClient.invalidateQueries({ queryKey: ['document', docId] });
    } catch (err) {
      console.error('Manual save failed:', err);
      setSaveStatus('Save Failed');
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#f3f4f6]/40 select-none">
      
      {/* 1. Minimal Toolbar */}
      <div className="bg-white border-b border-slate-200/80 px-6 py-2 flex items-center justify-between shrink-0 text-slate-700">
        <div className="flex items-center gap-1">
          <button type="button" className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-800" title="Undo">
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          
          <button type="button" className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-800" title="Redo">
            <Redo2 className="w-3.5 h-3.5" />
          </button>
          
          <div className="h-4 w-[1px] bg-slate-200 mx-2" />
          
          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Raw Text Format</span>
        </div>

        {/* Save button and status indicator */}
        {isRealUUID && (
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
              saveStatus === 'Saved ✓' ? 'text-emerald-600 bg-emerald-50' :
              saveStatus === 'Saving...' ? 'text-amber-600 bg-amber-50 animate-pulse' :
              saveStatus === 'Save Failed' ? 'text-rose-600 bg-rose-50' : 'text-slate-500 bg-slate-50'
            }`}>
              {saveStatus}
            </span>
            <button
              type="button"
              onClick={handleManualSave}
              className="text-[10.5px] font-extrabold uppercase tracking-wider px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded shadow-sm transition-all"
            >
              Save
            </button>
          </div>
        )}
      </div>

      {/* 2. Textarea Editor */}
      <div className="flex-1 p-6 flex justify-center overflow-auto custom-scrollbar">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="bg-white border border-slate-250/60 shadow-[0_2px_12px_rgba(0,0,0,0.03)] w-full max-w-[800px] h-full min-h-[500px] p-8 rounded-lg outline-none text-slate-800 select-text font-mono text-xs leading-relaxed resize-none focus:border-blue-600 transition-colors"
        />
      </div>

      {/* 3. Status Bar */}
      <div className="bg-slate-50 border-t border-slate-200 px-6 py-1 select-none flex items-center justify-between text-[10px] text-slate-400 font-extrabold uppercase tracking-wider shrink-0">
        <span>Encoding: UTF-8</span>
        <span>Lines: {text.split('\n').length}</span>
      </div>

    </div>
  );
}
