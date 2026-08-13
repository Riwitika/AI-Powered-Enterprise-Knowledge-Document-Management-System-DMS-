import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Download, ZoomIn, ZoomOut, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';

type SheetData = {
  name: string;
  headers: string[];
  rows: string[][];
};

export default function XlsxViewer({ activeDoc }: { activeDoc: any }) {
  const [zoom, setZoom] = useState(100);
  const [sheets, setSheets] = useState<SheetData[]>([]);
  const [activeSheetIdx, setActiveSheetIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  const docId = activeDoc?.id;
  const isRealUUID = typeof docId === 'string' && docId.length === 36;

  useEffect(() => {
    if (!isRealUUID) {
      setLoading(false);
      setError('Preview requires a stored spreadsheet file.');
      return;
    }

    let active = true;
    const loadWorkbook = async () => {
      try {
        setLoading(true);
        setError(null);
        const blob = await api.documents.download(docId);
        if (!active) return;

        const url = URL.createObjectURL(blob);
        setBlobUrl(url);

        const buffer = await blob.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        const parsedSheets: SheetData[] = workbook.SheetNames.map((name) => {
          const sheet = workbook.Sheets[name];
          const rows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: '' }) as string[][];
          const normalized = rows.map((row) => row.map((cell) => String(cell ?? '')));
          const headers = normalized[0] || [];
          const body = normalized.slice(1);
          return { name, headers, rows: body };
        });

        setSheets(parsedSheets);
        setActiveSheetIdx(0);
      } catch (err) {
        console.error('Failed to load spreadsheet:', err);
        if (active) {
          setError('Failed to load the original spreadsheet file.');
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadWorkbook();
    return () => {
      active = false;
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [docId]);

  const handleDownload = () => {
    if (!blobUrl) return;
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = `${activeDoc?.name || 'spreadsheet'}.${activeDoc?.fileType?.toLowerCase() || 'xlsx'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const activeSheet = sheets[activeSheetIdx];

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50">
        <div className="text-center space-y-2">
          <div className="h-6 w-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Loading Spreadsheet...</span>
        </div>
      </div>
    );
  }

  if (error || !activeSheet) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50 text-center">
        <div className="max-w-md space-y-3">
          <FileSpreadsheet className="h-10 w-10 text-emerald-600 mx-auto" />
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Spreadsheet Preview</h3>
          <p className="text-[10.5px] text-slate-500 font-medium leading-relaxed">{error || 'No sheet data available.'}</p>
          {blobUrl && (
            <button type="button" onClick={handleDownload} className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold">
              Download Original File
            </button>
          )}
        </div>
      </div>
    );
  }

  const columns = activeSheet.headers.length > 0
    ? activeSheet.headers
    : activeSheet.rows[0]?.map((_, idx) => String.fromCharCode(65 + idx)) || ['A'];

  return (
    <div className="flex flex-col h-full bg-[#f3f4f6]/40 select-none">
      <div className="bg-white border-b border-slate-200/80 px-6 py-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 overflow-x-auto">
          {sheets.map((sheet, idx) => (
            <button
              key={sheet.name}
              type="button"
              onClick={() => setActiveSheetIdx(idx)}
              className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap ${
                idx === activeSheetIdx ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              {sheet.name}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setZoom((z) => Math.max(70, z - 10))} className="p-1.5 hover:bg-slate-100 rounded"><ZoomOut className="w-4 h-4" /></button>
          <span className="text-xs font-bold w-10 text-center">{zoom}%</span>
          <button type="button" onClick={() => setZoom((z) => Math.min(150, z + 10))} className="p-1.5 hover:bg-slate-100 rounded"><ZoomIn className="w-4 h-4" /></button>
          <button type="button" onClick={handleDownload} className="ml-2 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold flex items-center gap-1.5 hover:bg-slate-50">
            <Download className="w-3.5 h-3.5" /> Download
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="bg-white border border-slate-200 rounded-xl overflow-auto shadow-sm" style={{ zoom: zoom / 100 }}>
          <table className="min-w-full text-xs">
            <thead className="bg-emerald-50">
              <tr>
                {columns.map((header, idx) => (
                  <th key={idx} className="px-3 py-2 text-left font-extrabold text-slate-700 border-b border-slate-200 whitespace-nowrap">{header || `Column ${idx + 1}`}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activeSheet.rows.map((row, rowIdx) => (
                <tr key={rowIdx} className="odd:bg-white even:bg-slate-50/60">
                  {columns.map((_, colIdx) => (
                    <td key={colIdx} className="px-3 py-2 border-b border-slate-100 text-slate-700 whitespace-nowrap">{row[colIdx] || ''}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
