import { useState } from 'react';
import { Search, ZoomIn, ZoomOut } from 'lucide-react';

export default function XlsxViewer() {
  const [searchVal, setSearchVal] = useState('');
  const [zoom, setZoom] = useState(100);

  // Spreadsheet cells configuration
  const columns = ['A', 'B', 'C', 'D', 'E', 'F'];
  const headers = ['Category', 'Sales (₹)', 'Target (₹)', 'Achievement %', 'Growth %', 'Comment'];
  
  const rows = [
    { cat: 'Electronics', sales: '125,000', target: '110,000', achieve: '114%', growth: '18%', comment: 'Target exceeded' },
    { cat: 'Accessories', sales: '85,500', target: '80,000', achieve: '107%', growth: '12%', comment: 'Solid sales growth' },
    { cat: 'Services', sales: '45,300', target: '40,000', achieve: '113%', growth: '16%', comment: 'Renewals active' },
    { cat: 'Total', sales: '255,800', target: '230,000', achieve: '111%', growth: '15%', comment: 'Consistent Q2 start' }
  ];

  return (
    <div className="flex flex-col h-full bg-[#f3f4f6]/40 select-none">
      
      {/* 1. Spreadsheet Header Bar */}
      <div className="bg-white border-b border-slate-200/80 px-6 py-2 flex items-center justify-between shrink-0 text-slate-650">
        
        {/* Cell Position Indicator */}
        <div className="flex items-center gap-2">
          <div className="bg-slate-50 border border-slate-200 rounded px-2.5 py-0.5 text-xs font-bold text-slate-800">
            B2
          </div>
          <div className="h-4 w-[1px] bg-slate-200" />
          <div className="relative">
            <span className="absolute left-2.5 top-1.5 text-xs font-serif font-bold text-slate-400 italic">fx</span>
            <input
              type="text"
              readOnly
              value="125000"
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
            <span className="text-xs font-extrabold text-slate-750 w-10 text-center">{zoom}%</span>
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
          className="border border-slate-200 bg-white rounded-lg overflow-hidden w-fit shadow-sm"
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
                {headers.map(h => (
                  <td key={h} className="border-r border-slate-200 px-3 py-1.5 font-extrabold text-slate-750">
                    {h}
                  </td>
                ))}
              </tr>
            </thead>
            
            <tbody>
              {rows.map((row, idx) => {
                const rowNum = idx + 2;
                const isTotal = row.cat === 'Total';
                const highlightElectronics = row.cat === 'Electronics' && searchVal.toLowerCase() === '';

                return (
                  <tr key={idx} className={`border-b border-slate-200 ${isTotal ? 'bg-slate-50/60 font-bold' : ''}`}>
                    {/* Row Index Column */}
                    <td className="bg-slate-100/80 border-r border-slate-200 py-2 text-center font-extrabold text-slate-500 shrink-0">
                      {rowNum}
                    </td>

                    {/* Cell Data */}
                    <td className="border-r border-slate-200 px-3 py-2 font-bold text-slate-800">{row.cat}</td>
                    
                    {/* Sales cell (styled active in mockup) */}
                    <td className={`border-r border-slate-200 px-3 py-2 select-text font-bold text-right ${
                      highlightElectronics ? 'bg-emerald-50 text-emerald-800 border-2 border-emerald-600' : ''
                    }`}>
                      {row.sales}
                    </td>
                    
                    <td className="border-r border-slate-200 px-3 py-2 text-right">{row.target}</td>
                    <td className="border-r border-slate-200 px-3 py-2 text-right font-bold text-blue-600">{row.achieve}</td>
                    <td className="border-r border-slate-200 px-3 py-2 text-right font-bold text-emerald-600">{row.growth}</td>
                    <td className="border-r border-slate-200 px-3 py-2 text-slate-500 italic font-medium">{row.comment}</td>
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
            April Sales
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
