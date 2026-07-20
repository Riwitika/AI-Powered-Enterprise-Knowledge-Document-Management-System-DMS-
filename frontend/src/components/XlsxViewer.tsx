import { useState } from 'react';
import { Search, ZoomIn, ZoomOut } from 'lucide-react';

export default function XlsxViewer({ activeDoc }: { activeDoc: any }) {
  const [searchVal, setSearchVal] = useState('');
  const [zoom, setZoom] = useState(100);

  // Spreadsheet cells configuration
  const columns = ['A', 'B', 'C', 'D', 'E', 'F'];

  const getSheetContent = () => {
    const name = activeDoc?.name || '';
    if (name.toLowerCase().includes('expense')) {
      return {
        tabName: 'Expense Summary',
        fxVal: '500000',
        activeCellLabel: 'B2',
        headers: ['Department', 'Budget (₹)', 'Spent (₹)', 'Remaining (₹)', 'Burn Rate %', 'Status'],
        rows: [
          { c1: 'Engineering', c2: '500,000', c3: '480,000', c4: '20,000', c5: '96%', c6: 'On Track' },
          { c1: 'Marketing', c2: '200,000', c3: '210,000', c4: '-10,000', c5: '105%', c6: 'Over Budget' },
          { c1: 'HR & Admin', c2: '150,000', c3: '120,000', c4: '30,000', c5: '80%', c6: 'Under Budget' },
          { c1: 'Total', c2: '850,000', c3: '810,000', c4: '40,000', c5: '95.3%', c6: 'On Track' }
        ]
      };
    } else if (name.toLowerCase().includes('cash')) {
      return {
        tabName: 'Cash Flow',
        fxVal: '450000',
        activeCellLabel: 'B2',
        headers: ['Month', 'Operating (₹)', 'Investing (₹)', 'Financing (₹)', 'Net Cash (₹)', 'Closing Cash (₹)'],
        rows: [
          { c1: 'January', c2: '450,000', c3: '-120,000', c4: '-50,000', c5: '280,000', c6: '2.80M' },
          { c1: 'February', c2: '520,000', c3: '-80,000', c4: '-50,000', c5: '390,000', c6: '3.19M' },
          { c1: 'March', c2: '610,000', c3: '-150,000', c4: '-50,000', c5: '410,000', c6: '3.60M' },
          { c1: 'Total', c2: '1,580,000', c3: '-350,000', c4: '-150,050', c5: '1,080,000', c6: '3.60M' }
        ]
      };
    } else {
      // Default to Sales Report
      return {
        tabName: 'April Sales',
        fxVal: '125000',
        activeCellLabel: 'B2',
        headers: ['Category', 'Sales (₹)', 'Target (₹)', 'Achievement %', 'Growth %', 'Comment'],
        rows: [
          { c1: 'Electronics', c2: '125,000', c3: '110,000', c4: '114%', c5: '18%', c6: 'Target exceeded' },
          { c1: 'Accessories', c2: '85,500', c3: '80,000', c4: '107%', c5: '12%', c6: 'Solid sales growth' },
          { c1: 'Services', c2: '45,300', c3: '40,000', c4: '113%', c5: '16%', c6: 'Renewals active' },
          { c1: 'Total', c2: '255,800', c3: '230,000', c4: '111%', c5: '15%', c6: 'Consistent Q2 start' }
        ]
      };
    }
  };

  const sheetData = getSheetContent();

  return (
    <div className="flex flex-col h-full bg-[#f3f4f6]/40 select-none">
      
      {/* 1. Spreadsheet Header Bar */}
      <div className="bg-white border-b border-slate-200/80 px-6 py-2 flex items-center justify-between shrink-0 text-slate-650">
        
        {/* Cell Position Indicator */}
        <div className="flex items-center gap-2">
          <div className="bg-slate-50 border border-slate-200 rounded px-2.5 py-0.5 text-xs font-bold text-slate-800">
            {sheetData.activeCellLabel}
          </div>
          <div className="h-4 w-[1px] bg-slate-200" />
          <div className="relative">
            <span className="absolute left-2.5 top-1.5 text-xs font-serif font-bold text-slate-400 italic">fx</span>
            <input
              type="text"
              readOnly
              value={sheetData.fxVal}
              className="bg-transparent border-none text-xs text-slate-700 font-bold focus:outline-none pl-6 w-32 cursor-default select-all"
            />
          </div>
        </div>

        {/* Search cells */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
            <input
              type="text"
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              placeholder="Search sheet..."
              className="bg-[#f8fafc] border border-slate-200 rounded px-2 pl-7 py-1 text-[11px] font-bold text-slate-700 focus:outline-none focus:bg-white focus:border-blue-600 transition-all placeholder-slate-400"
            />
          </div>

          <div className="flex items-center gap-2">
            <button 
              type="button" 
              onClick={() => setZoom(prev => Math.max(70, prev - 10))}
              className="p-1 hover:bg-slate-100 rounded text-slate-500"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs font-extrabold text-slate-755 w-10 text-center">{zoom}%</span>
            <button 
              type="button" 
              onClick={() => setZoom(prev => Math.min(130, prev + 10))}
              className="p-1 hover:bg-slate-100 rounded text-slate-500"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

      {/* 2. Spreadsheet Grid Canvas */}
      <div className="flex-1 overflow-auto p-4 custom-scrollbar">
        <div 
          className="border border-slate-200 bg-white rounded-lg overflow-hidden w-fit shadow-sm animate-in fade-in duration-200"
          style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top left' }}
        >
          <table className="border-collapse text-xs text-slate-700 font-medium">
            <thead>
              {/* Columns Header (A, B, C, D, E, F) */}
              <tr className="bg-slate-50 text-slate-500 font-extrabold border-b border-slate-200">
                <th className="w-10 border-r border-slate-200 py-1 text-center bg-slate-100"></th>
                {columns.map(col => (
                  <th key={col} className="w-36 border-r border-slate-200 py-1.5 text-center bg-slate-50">
                    {col}
                  </th>
                ))}
              </tr>
              {/* Row 1 Headers (Category, Sales, Target...) */}
              <tr className="bg-slate-50/50 text-slate-650 font-bold border-b border-slate-200">
                <td className="border-r border-slate-200 py-1.5 text-center font-extrabold bg-slate-100/80">1</td>
                {sheetData.headers.map(h => (
                  <td key={h} className="border-r border-slate-200 px-3 py-1.5 font-extrabold text-slate-750">
                    {h}
                  </td>
                ))}
              </tr>
            </thead>
            
            <tbody>
              {sheetData.rows.map((row, idx) => {
                const rowNum = idx + 2;
                const isTotal = row.c1 === 'Total';
                const highlightTarget = row.c1.includes('Eng') || row.c1.includes('Elect');

                return (
                  <tr key={idx} className={`border-b border-slate-200 ${isTotal ? 'bg-slate-50/60 font-bold' : ''}`}>
                    {/* Row Index Column */}
                    <td className="bg-slate-100/80 border-r border-slate-200 py-2 text-center font-extrabold text-slate-500 shrink-0">
                      {rowNum}
                    </td>

                    {/* Cell Data */}
                    <td className="border-r border-slate-200 px-3 py-2 font-bold text-slate-800">{row.c1}</td>
                    
                    {/* Cell 2 (styled active in mockup) */}
                    <td className={`border-r border-slate-200 px-3 py-2 select-text font-bold text-right ${
                      highlightTarget && searchVal.trim() === '' ? 'bg-emerald-50 text-emerald-800 border-2 border-emerald-600' : ''
                    }`}>
                      {row.c2}
                    </td>
                    
                    <td className="border-r border-slate-200 px-3 py-2 text-right">{row.c3}</td>
                    <td className="border-r border-slate-200 px-3 py-2 text-right font-bold text-blue-600">{row.c4}</td>
                    <td className="border-r border-slate-200 px-3 py-2 text-right font-bold text-emerald-600">{row.c5}</td>
                    <td className="border-r border-slate-200 px-3 py-2 text-slate-500 italic font-medium">{row.c6}</td>
                  </tr>
                );
              })}

              {/* Extra empty grids to look realistic */}
              {[6, 7, 8, 9, 10].map(rowNum => (
                <tr key={rowNum} className="border-b border-slate-100">
                  <td className="bg-slate-100/50 border-r border-slate-200 py-2 text-center font-extrabold text-slate-400">
                    {rowNum}
                  </td>
                  {columns.map(c => (
                    <td key={c} className="border-r border-slate-150 py-2 px-3"></td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Sheet Tabs Footer (Excel style) */}
      <div className="bg-slate-50 border-t border-slate-200 px-6 py-1 select-none flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1">
          <button 
            type="button" 
            className="px-3 py-1 bg-white border-x border-t border-slate-200 text-xs font-bold text-emerald-600 border-b-2 border-b-emerald-500 flex items-center justify-center shrink-0 shadow-sm"
          >
            {sheetData.tabName}
          </button>
          
          <button 
            type="button" 
            onClick={() => alert('New sheet created (Mock)')}
            className="p-1 hover:bg-slate-200 rounded text-slate-500 flex items-center justify-center"
            title="Add sheet"
          >
            +
          </button>
        </div>
        
        <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Ready</span>
      </div>

    </div>
  );
}
