import { useState } from 'react';
import { Undo2, Redo2 } from 'lucide-react';

export default function TxtEditor({ activeDoc }: { activeDoc: any }) {
  const [text, setText] = useState(() => {
    return `Fast Trade Technologies Pvt. Ltd. — Technical Raw Notes\n\n` +
      `File Name: ${activeDoc?.name || 'document.txt'}\n` +
      `Last Modified: ${activeDoc?.lastModified || 'Just now'}\n` +
      `Owner: ${activeDoc?.ownerName || 'Paras Jain'}\n\n` +
      `This plain text document is loaded dynamically in the KMS raw text preview editor workspace.`;
  });

  return (
    <div className="flex flex-col h-full bg-[#f3f4f6]/40 select-none">
      
      {/* 1. Minimal Toolbar */}
      <div className="bg-white border-b border-slate-200/80 px-6 py-2 flex items-center gap-1 shrink-0 text-slate-700">
        <button type="button" className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-800" title="Undo">
          <Undo2 className="w-3.5 h-3.5" />
        </button>
        
        <button type="button" className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-800" title="Redo">
          <Redo2 className="w-3.5 h-3.5" />
        </button>
        
        <div className="h-4 w-[1px] bg-slate-200 mx-2" />
        
        <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Raw Text Format</span>
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
