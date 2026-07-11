import React from 'react';
import { Upload } from 'lucide-react';

interface UploadModalProps {
  showUpload: boolean;
  setShowUpload: (show: boolean) => void;
  uploadFile: File | null;
  setUploadFile: (file: File | null) => void;
  uploadName: string;
  setUploadName: (name: string) => void;
  uploadDesc: string;
  setUploadDesc: (desc: string) => void;
  uploadCat: string;
  setUploadCat: (cat: string) => void;
  uploadAccess: string;
  setUploadAccess: (access: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  showUpload,
  setShowUpload,
  uploadFile,
  setUploadFile,
  uploadName,
  setUploadName,
  uploadDesc,
  setUploadDesc,
  uploadCat,
  setUploadCat,
  uploadAccess,
  setUploadAccess,
  onSubmit,
}) => {
  if (!showUpload) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <form onSubmit={onSubmit} className="bg-white border border-slate-200 rounded-xl p-6 max-w-md w-full space-y-4 shadow-xl overflow-y-auto max-h-[90vh]">
        <h3 className="font-bold text-slate-950 text-base">Upload Document</h3>
        
        <div>
          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Select Document</label>
          <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 hover:border-slate-300 rounded-xl p-5 hover:bg-slate-50 cursor-pointer transition-colors text-center">
            <Upload className="h-6 w-6 text-slate-400 mb-2" />
            <span className="text-xs font-bold text-slate-600">{uploadFile ? uploadFile.name : 'Choose file or drag & drop'}</span>
            <span className="text-[9px] text-slate-400 block mt-1">PDF, DOCX, XLSX, PPTX, TXT</span>
            <input 
              type="file" 
              required
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  setUploadFile(e.target.files[0]);
                  setUploadName(e.target.files[0].name.split('.')[0]);
                }
              }}
              className="hidden" 
            />
          </label>
        </div>

        <div>
          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Document Title</label>
          <input 
            type="text" 
            value={uploadName}
            onChange={(e) => setUploadName(e.target.value)}
            placeholder="User Operations Guide"
            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:bg-white focus:border-blue-500 text-slate-800"
          />
        </div>

        <div>
          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Abstract Description</label>
          <textarea 
            value={uploadDesc}
            onChange={(e) => setUploadDesc(e.target.value)}
            placeholder="Summarize context and keywords..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:bg-white focus:border-blue-500 text-slate-800 h-20 resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Category Tag</label>
            <input 
              type="text" 
              value={uploadCat}
              onChange={(e) => setUploadCat(e.target.value)}
              placeholder="SOP, Manual, Contract"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:bg-white focus:border-blue-500 text-slate-800"
            />
          </div>

          <div>
            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Access Scope</label>
            <select
              value={uploadAccess}
              onChange={(e) => setUploadAccess(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:bg-white focus:border-blue-500 text-slate-800"
            >
              <option value="private">Private (Owner only)</option>
              <option value="view_only">View Only (Org read-only)</option>
              <option value="edit">Edit (Org edit access)</option>
              <option value="department">Department (My dept only)</option>
              <option value="organization">Organization (Full access)</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-2.5 pt-2">
          <button 
            type="button" 
            onClick={() => setShowUpload(false)}
            className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit"
            disabled={!uploadFile}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold disabled:opacity-50 transition-colors"
          >
            Upload & Ingest
          </button>
        </div>
      </form>
    </div>
  );
};
