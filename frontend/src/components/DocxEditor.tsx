import { useState } from 'react';
import { 
  Undo2, 
  Redo2, 
  Bold, 
  Italic, 
  Underline, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  List, 
  ListOrdered, 
  Link2, 
  Table, 
  Highlighter, 
  ChevronDown
} from 'lucide-react';

export default function DocxEditor() {
  const [fontSize, setFontSize] = useState('11');
  const [fontFamily, setFontFamily] = useState('Calibri (Body)');

  return (
    <div className="flex flex-col h-full bg-[#f3f4f6]/40 select-none">
      
      {/* 1. Ribbon Bar Toolbar (Word-like layout) */}
      <div className="bg-white border-b border-slate-200/80 px-6 py-1.5 flex flex-wrap items-center gap-1 select-none text-slate-700">
        
        {/* Undo/Redo */}
        <button type="button" className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-800" title="Undo">
          <Undo2 className="w-3.5 h-3.5" />
        </button>
        <button type="button" className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-800" title="Redo">
          <Redo2 className="w-3.5 h-3.5" />
        </button>

        <div className="h-4 w-[1px] bg-slate-200 mx-1.5" />

        {/* Font Family selector */}
        <div className="relative">
          <select 
            value={fontFamily}
            onChange={(e) => setFontFamily(e.target.value)}
            className="bg-transparent hover:bg-slate-50 border border-slate-200 rounded px-2 py-0.5 text-xs text-slate-700 font-bold focus:outline-none cursor-pointer"
          >
            <option>Calibri (Body)</option>
            <option>Outfit</option>
            <option>Inter</option>
            <option>Arial</option>
          </select>
        </div>

        {/* Font Size selector */}
        <div className="relative">
          <select 
            value={fontSize}
            onChange={(e) => setFontSize(e.target.value)}
            className="bg-transparent hover:bg-slate-50 border border-slate-200 rounded px-2 py-0.5 text-xs text-slate-700 font-bold focus:outline-none cursor-pointer"
          >
            <option>10</option>
            <option>11</option>
            <option>12</option>
            <option>14</option>
            <option>16</option>
            <option>18</option>
            <option>24</option>
          </select>
        </div>

        <div className="h-4 w-[1px] bg-slate-200 mx-1.5" />

        {/* Style Modifiers */}
        <button type="button" className="p-1.5 hover:bg-slate-100 rounded text-slate-650 font-bold" title="Bold">
          <Bold className="w-3.5 h-3.5" />
        </button>
        <button type="button" className="p-1.5 hover:bg-slate-100 rounded text-slate-650 font-bold" title="Italic">
          <Italic className="w-3.5 h-3.5" />
        </button>
        <button type="button" className="p-1.5 hover:bg-slate-100 rounded text-slate-650 font-bold" title="Underline">
          <Underline className="w-3.5 h-3.5" />
        </button>

        <div className="h-4 w-[1px] bg-slate-200 mx-1.5" />

        {/* Alignment */}
        <button type="button" className="p-1.5 hover:bg-slate-100 rounded text-slate-650" title="Align Left">
          <AlignLeft className="w-3.5 h-3.5" />
        </button>
        <button type="button" className="p-1.5 hover:bg-slate-100 rounded text-slate-650" title="Align Center">
          <AlignCenter className="w-3.5 h-3.5" />
        </button>
        <button type="button" className="p-1.5 hover:bg-slate-100 rounded text-slate-650" title="Align Right">
          <AlignRight className="w-3.5 h-3.5" />
        </button>

        <div className="h-4 w-[1px] bg-slate-200 mx-1.5" />

        {/* Lists */}
        <button type="button" className="p-1.5 hover:bg-slate-100 rounded text-slate-650" title="Bulleted List">
          <List className="w-3.5 h-3.5" />
        </button>
        <button type="button" className="p-1.5 hover:bg-slate-100 rounded text-slate-650" title="Numbered List">
          <ListOrdered className="w-3.5 h-3.5" />
        </button>

        <div className="h-4 w-[1px] bg-slate-200 mx-1.5" />

        {/* Elements insertion */}
        <button type="button" onClick={() => alert('Insert link (Mock)')} className="p-1.5 hover:bg-slate-100 rounded text-slate-650 flex items-center gap-0.5" title="Insert Link">
          <Link2 className="w-3.5 h-3.5" />
        </button>

        <button type="button" onClick={() => alert('Insert table (Mock)')} className="p-1.5 hover:bg-slate-100 rounded text-slate-650 flex items-center gap-0.5" title="Insert Table">
          <Table className="w-3.5 h-3.5" />
          <ChevronDown className="w-2.5 h-2.5" />
        </button>

        <button type="button" className="p-1.5 hover:bg-slate-100 rounded text-slate-650" title="Highlighter">
          <Highlighter className="w-3.5 h-3.5" />
        </button>

      </div>

      {/* 2. Text editing canvas paper container */}
      <div className="flex-1 overflow-y-auto p-8 flex justify-center custom-scrollbar">
        <div 
          contentEditable
          suppressContentEditableWarning
          className="bg-white border border-slate-250/60 shadow-[0_2px_12px_rgba(0,0,0,0.03)] w-full max-w-[800px] min-h-[900px] p-12.5 rounded-sm outline-none text-slate-850 select-text font-serif text-[13px] leading-relaxed space-y-5"
          style={{ fontFamily: fontFamily === 'Calibri (Body)' ? 'Calibri, sans-serif' : fontFamily }}
        >
          {/* Header page title */}
          <h1 className="text-[22px] font-extrabold text-slate-900 border-b border-slate-150 pb-2 tracking-tight select-all">
            Q2 Budget Report
          </h1>
          
          <h2 className="text-[14px] font-bold text-slate-800 tracking-tight pt-2">
            1. Executive Summary
          </h2>
          <p>
            This report provides a comprehensive overview of the financial performance and budget allocations for Q2 2024. During this timeframe, engineering expenditures grew due to scheduled infrastructure upgrades. General operations remained flat, matching prior projections.
          </p>

          <h2 className="text-[14px] font-bold text-slate-800 tracking-tight pt-2">
            2. Key Highlights
          </h2>
          <ul className="list-disc pl-5 space-y-1.5 font-medium text-slate-700">
            <li>Total revenue increased by 18% compared to Q1.</li>
            <li>Operational expenses are within the planned budget constraints.</li>
            <li>Net profit shows a growth of 22%.</li>
          </ul>

          <p className="pt-2">
            Further audits will be conducted by mid-June to verify that compliance guidelines are fully met for all operations. Recommended cost optimizations will be applied starting in Q3.
          </p>
        </div>
      </div>

      {/* 3. Word-like Status bar */}
      <div className="bg-slate-50 border-t border-slate-200 px-6 py-1 select-none flex items-center justify-between text-[10px] text-slate-400 font-extrabold uppercase tracking-wider shrink-0">
        <div className="flex items-center gap-4">
          <span>Page 1 of 8</span>
          <span>2180 words</span>
          <span>English (United States)</span>
        </div>
        <div>
          <span>100% Zoom</span>
        </div>
      </div>

    </div>
  );
}
