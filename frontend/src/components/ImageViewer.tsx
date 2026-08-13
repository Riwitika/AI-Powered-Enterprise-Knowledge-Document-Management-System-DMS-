import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { 
  RotateCw, 
  Download, 
  ZoomIn, 
  ZoomOut, 
  Maximize2,
  FileImage
} from 'lucide-react';

export default function ImageViewer({ activeDoc }: { activeDoc: any }) {
  const [rotation, setRotation] = useState(0);
  const [scale, setScale] = useState(1);

  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const docId = activeDoc?.id;
  const isRealUUID = typeof docId === 'string' && docId.length === 36;

  useEffect(() => {
    if (!isRealUUID) {
      setLoading(false);
      return;
    }
    
    let active = true;
    const loadImage = async () => {
      try {
        setLoading(true);
        setError(null);
        const blob = await api.documents.download(docId);
        if (active) {
          const url = URL.createObjectURL(blob);
          setBlobUrl(url);
        }
      } catch (err: any) {
        console.error('Failed to load image file:', err);
        if (active) {
          setError('Failed to fetch the image file from the secure storage server.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    loadImage();

    return () => {
      active = false;
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [docId]);

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleDownload = () => {
    if (blobUrl) {
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = activeDoc?.name || 'image.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showToast('Download triggered.');
    } else {
      showToast('Download not available for mock vector graphic.');
    }
  };

  const handleFullscreen = () => {
    showToast('Fullscreen mode activated.');
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50">
        <div className="text-center space-y-2">
          <div className="h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Loading Secure Image...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50 text-center">
        <div className="max-w-md space-y-3">
          <FileImage className="h-10 w-10 text-rose-500 mx-auto animate-bounce" />
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Image Access Error</h3>
          <p className="text-[10.5px] text-slate-500 font-medium leading-relaxed">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-[#f3f4f6]/40 select-none relative">
      
      {/* 1. Image viewport (Center) */}
      <div className="flex-1 flex flex-col justify-between overflow-hidden relative">
        <div className="flex-1 flex items-center justify-center p-8 overflow-hidden">
          <div 
            className="transition-transform duration-300 max-h-full max-w-full"
            style={{ 
              transform: `rotate(${rotation}deg) scale(${scale})`
            }}
          >
            {blobUrl ? (
              <img 
                src={blobUrl} 
                className="max-w-[550px] max-h-[500px] object-contain rounded-xl shadow-lg border border-slate-200 bg-white" 
                alt={activeDoc.name} 
              />
            ) : (
              <svg 
                viewBox="0 0 800 500" 
                className="w-full max-w-[550px] aspect-[16/10] bg-white rounded-xl shadow-lg border border-slate-200"
              >
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
                
                <circle cx="680" cy="100" r="45" fill="#fef08a" opacity="0.6" />
                <circle cx="680" cy="100" r="30" fill="#fde047" />

                <path d="M 0 350 L 150 250 L 320 380 L 450 220 L 680 390 L 800 310 L 800 500 L 0 500 Z" fill="#cbd5e1" opacity="0.4" />
                <path d="M 0 380 L 220 300 L 390 410 L 520 280 L 740 420 L 800 360 L 800 500 L 0 500 Z" fill="#94a3b8" opacity="0.5" />

                <rect x="250" y="80" width="300" height="340" fill="url(#wallGrad)" rx="8" />
                
                <rect x="270" y="100" width="260" height="300" fill="#1e293b" rx="6" />

                <rect x="280" y="110" width="70" height="80" fill="url(#glassGrad)" rx="4" />
                <rect x="365" y="110" width="70" height="80" fill="url(#glassGrad)" rx="4" />
                <rect x="450" y="110" width="70" height="80" fill="url(#glassGrad)" rx="4" />
                
                <rect x="280" y="205" width="70" height="80" fill="url(#glassGrad)" rx="4" />
                <rect x="365" y="205" width="70" height="80" fill="url(#glassGrad)" rx="4" />
                <rect x="450" y="205" width="70" height="80" fill="url(#glassGrad)" rx="4" />

                <rect x="280" y="300" width="70" height="80" fill="url(#glassGrad)" rx="4" />
                <rect x="365" y="300" width="70" height="80" fill="url(#glassGrad)" rx="4" />
                <rect x="450" y="300" width="70" height="80" fill="url(#glassGrad)" rx="4" />

                <rect x="0" y="420" width="800" height="80" fill="#22c55e" />
                <rect x="0" y="440" width="800" height="60" fill="#166534" />

                <rect x="150" y="360" width="8" height="60" fill="#78350f" />
                <circle cx="154" cy="350" r="28" fill="#15803d" />
                <circle cx="140" cy="335" r="22" fill="#166534" />

                <rect x="630" y="370" width="8" height="50" fill="#78350f" />
                <circle cx="634" cy="360" r="25" fill="#15803d" />
                <circle cx="645" cy="350" r="18" fill="#166534" />

                <text x="25" y="45" fontFamily="sans-serif" fontSize="12" fontWeight="bold" fill="#64748b">FTT HQ — Office Building</text>
              </svg>
            )}
          </div>
        </div>

        {/* Dynamic Zoom slider toolbar floating at the bottom center */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-slate-900/90 text-white border border-slate-800 rounded-xl px-5 py-2.5 flex items-center gap-4 shadow-lg select-none z-10">
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
            onClick={handleFullscreen}
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
              className="border border-slate-200 hover:border-slate-355 hover:bg-slate-50 rounded-xl p-2.5 bg-white flex flex-col items-center gap-1.5 transition-colors"
            >
              <RotateCw className="w-4 h-4 text-slate-455" />
              <span>Rotate</span>
            </button>
            
            <button 
              type="button" 
              onClick={handleDownload}
              className="border border-slate-200 hover:border-slate-355 hover:bg-slate-50 rounded-xl p-2.5 bg-white flex flex-col items-center gap-1.5 transition-colors"
            >
              <Download className="w-4 h-4 text-slate-455" />
              <span>Download</span>
            </button>

            <button 
              type="button" 
              onClick={() => setScale(prev => Math.min(2, prev + 0.2))}
              className="border border-slate-200 hover:border-slate-355 hover:bg-slate-50 rounded-xl p-2.5 bg-white flex flex-col items-center gap-1.5 transition-colors"
            >
              <ZoomIn className="w-4 h-4 text-slate-455" />
              <span>Zoom</span>
            </button>

            <button 
              type="button" 
              onClick={handleFullscreen}
              className="border border-slate-200 hover:border-slate-355 hover:bg-slate-50 rounded-xl p-2.5 bg-white flex flex-col items-center gap-1.5 transition-colors"
            >
              <Maximize2 className="w-4 h-4 text-slate-455" />
              <span>Fullscreen</span>
            </button>

          </div>
        </div>

      </div>

      {toastMsg && (
        <div className="fixed bottom-6 left-6 bg-slate-900 text-white rounded-xl py-3 px-4 shadow-2xl z-[99999] flex items-center gap-2 animate-in fade-in slide-in-from-bottom-5 duration-200 text-xs font-bold select-none border border-slate-800">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
          <span>{toastMsg}</span>
        </div>
      )}

    </div>
  );
}
