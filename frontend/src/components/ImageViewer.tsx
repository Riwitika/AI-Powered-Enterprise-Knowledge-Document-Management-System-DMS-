import { useState } from 'react';
import { 
  RotateCw, 
  Download, 
  ZoomIn, 
  ZoomOut, 
  Maximize2 
} from 'lucide-react';

export default function ImageViewer({ activeDoc }: { activeDoc: any }) {
  const [rotation, setRotation] = useState(0);
  const [scale, setScale] = useState(1);

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  return (
    <div className="flex h-full bg-[#f3f4f6]/40 select-none">
      
      {/* 1. Image viewport (Center) */}
      <div className="flex-1 flex flex-col justify-between overflow-hidden relative">
        <div className="flex-1 flex items-center justify-center p-8 overflow-hidden">
          <div 
            className="transition-transform duration-300 max-h-full max-w-full"
            style={{ 
              transform: `rotate(${rotation}deg) scale(${scale})`
            }}
          >
            {/* High-fidelity corporate building drawing using pure inline SVG illustration */}
            <svg 
              viewBox="0 0 800 500" 
              className="w-full max-w-[550px] aspect-[16/10] bg-white rounded-xl shadow-lg border border-slate-200"
            >
              {/* Sky Background */}
              <defs>
                <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#bae6fd" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#f0f9ff" stopOpacity="0.2" />
                </linearGradient>
                <linearGradient id="glassGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#38bdf8" />
                  <stop offset="50%" stopColor="#0284c7" />
                  <stop offset="100%" stopColor="#0369a1" />
                </linearGradient>
                <linearGradient id="wallGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f1f5f9" />
                  <stop offset="100%" stopColor="#cbd5e1" />
                </linearGradient>
              </defs>
              
              <rect width="800" height="500" fill="url(#skyGrad)" />
              
              {/* Sun */}
              <circle cx="680" cy="100" r="45" fill="#fef08a" opacity="0.6" />
              <circle cx="680" cy="100" r="30" fill="#fde047" />

              {/* Mountains/Hills far away */}
              <path d="M 0 350 L 150 250 L 320 380 L 450 220 L 680 390 L 800 310 L 800 500 L 0 500 Z" fill="#cbd5e1" opacity="0.4" />
              <path d="M 0 380 L 220 300 L 390 410 L 520 280 L 740 420 L 800 360 L 800 500 L 0 500 Z" fill="#94a3b8" opacity="0.5" />

              {/* Building structure */}
              {/* Main Block */}
              <rect x="250" y="80" width="300" height="340" fill="url(#wallGrad)" rx="8" />
              
              {/* Structural Beams / Grid */}
              <rect x="270" y="100" width="260" height="300" fill="#1e293b" rx="6" />

              {/* Windows Matrix */}
              {/* Row 1 */}
              <rect x="280" y="110" width="70" height="80" fill="url(#glassGrad)" rx="4" />
              <rect x="365" y="110" width="70" height="80" fill="url(#glassGrad)" rx="4" />
              <rect x="450" y="110" width="70" height="80" fill="url(#glassGrad)" rx="4" />
              
              {/* Row 2 */}
              <rect x="280" y="205" width="70" height="80" fill="url(#glassGrad)" rx="4" />
              <rect x="365" y="205" width="70" height="80" fill="url(#glassGrad)" rx="4" />
              <rect x="450" y="205" width="70" height="80" fill="url(#glassGrad)" rx="4" />

              {/* Row 3 */}
              <rect x="280" y="300" width="70" height="80" fill="url(#glassGrad)" rx="4" />
              <rect x="365" y="300" width="70" height="80" fill="url(#glassGrad)" rx="4" />
              <rect x="450" y="300" width="70" height="80" fill="url(#glassGrad)" rx="4" />

              {/* Ground & Trees */}
              <rect x="0" y="420" width="800" height="80" fill="#22c55e" />
              <rect x="0" y="440" width="800" height="60" fill="#166534" />

              {/* Tree 1 */}
              <rect x="150" y="360" width="8" height="60" fill="#78350f" />
              <circle cx="154" cy="350" r="28" fill="#15803d" />
              <circle cx="140" cy="335" r="22" fill="#166534" />

              {/* Tree 2 */}
              <rect x="630" y="370" width="8" height="50" fill="#78350f" />
              <circle cx="634" cy="360" r="25" fill="#15803d" />
              <circle cx="645" cy="350" r="18" fill="#166534" />

              {/* Text indicator */}
              <text x="25" y="45" fontFamily="sans-serif" fontSize="12" fontWeight="bold" fill="#64748b">FTT HQ — Office Building</text>
            </svg>
          </div>
        </div>

        {/* Dynamic Zoom slider toolbar floating at the bottom center */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-slate-900/90 text-white border border-slate-800 rounded-xl px-5 py-2.5 flex items-center gap-4 shadow-lg select-none">
          <button 
            type="button" 
            onClick={() => setScale(prev => Math.max(0.5, prev - 0.1))}
            className="p-1 hover:bg-slate-800 rounded text-slate-300 hover:text-white transition-colors"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          
          <span className="text-xs font-bold w-12 text-center">{Math.round(scale * 100)}%</span>

          <button 
            type="button" 
            onClick={() => setScale(prev => Math.min(2, prev + 0.1))}
            className="p-1 hover:bg-slate-800 rounded text-slate-300 hover:text-white transition-colors"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          
          <div className="h-4 w-[1px] bg-slate-700 mx-1" />

          <button 
            type="button" 
            onClick={handleRotate}
            className="p-1.5 hover:bg-slate-800 rounded text-slate-350 hover:text-white transition-colors"
            title="Rotate Image"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>

          <button 
            type="button" 
            onClick={() => alert('Fullscreen Image (Mock)')}
            className="p-1.5 hover:bg-slate-800 rounded text-slate-350 hover:text-white transition-colors"
            title="Fullscreen"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

      {/* 2. File Metadata Panel (Right) */}
      <div className="w-[200px] border-l border-slate-200 bg-white p-4.5 space-y-5 shrink-0 select-none">
        
        {/* File Info */}
        <div className="space-y-3.5">
          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block border-b border-slate-100 pb-1.5">File Info</span>
          <div className="space-y-2 text-[11px] font-semibold text-slate-700">
            <div className="flex flex-col">
              <span className="text-slate-400 text-[9.5px]">Type</span>
              <span className="text-slate-800 font-bold">{activeDoc?.fileType || 'Image'} File</span>
            </div>
            <div className="flex flex-col">
              <span className="text-slate-400 text-[9.5px]">Size</span>
              <span className="text-slate-800 font-bold">{activeDoc?.size || '2.4 MB'}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-slate-400 text-[9.5px]">Dimension</span>
              <span className="text-slate-800 font-bold font-mono">1920 × 1280</span>
            </div>
            <div className="flex flex-col">
              <span className="text-slate-400 text-[9.5px]">Uploaded by</span>
              <span className="text-slate-800 font-bold">{activeDoc?.ownerName || 'Paras Jain'}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-slate-400 text-[9.5px]">Uploaded on</span>
              <span className="text-slate-500 font-medium">{activeDoc?.lastModified || '17 May 2026, 02:10 PM'}</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-3">
          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block border-b border-slate-100 pb-1.5">Quick Actions</span>
          
          <div className="grid grid-cols-2 gap-2 text-[9.5px] font-extrabold text-slate-650 text-center">
            
            <button 
              type="button" 
              onClick={handleRotate}
              className="border border-slate-200 hover:border-slate-350 hover:bg-slate-50 rounded-xl p-2.5 bg-white flex flex-col items-center gap-1.5 transition-colors"
            >
              <RotateCw className="w-4 h-4 text-slate-450" />
              <span>Rotate</span>
            </button>
            
            <button 
              type="button" 
              onClick={() => alert('Download image...')}
              className="border border-slate-200 hover:border-slate-350 hover:bg-slate-50 rounded-xl p-2.5 bg-white flex flex-col items-center gap-1.5 transition-colors"
            >
              <Download className="w-4 h-4 text-slate-450" />
              <span>Download</span>
            </button>

            <button 
              type="button" 
              onClick={() => setScale(prev => Math.min(2, prev + 0.2))}
              className="border border-slate-200 hover:border-slate-350 hover:bg-slate-50 rounded-xl p-2.5 bg-white flex flex-col items-center gap-1.5 transition-colors"
            >
              <ZoomIn className="w-4 h-4 text-slate-450" />
              <span>Zoom</span>
            </button>

            <button 
              type="button" 
              onClick={() => alert('Fullscreen Image (Mock)')}
              className="border border-slate-200 hover:border-slate-350 hover:bg-slate-50 rounded-xl p-2.5 bg-white flex flex-col items-center gap-1.5 transition-colors"
            >
              <Maximize2 className="w-4 h-4 text-slate-450" />
              <span>Fullscreen</span>
            </button>

          </div>
        </div>

      </div>

    </div>
  );
}
