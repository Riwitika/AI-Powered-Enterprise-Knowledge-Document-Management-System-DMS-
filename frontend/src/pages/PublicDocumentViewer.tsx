import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Printer, 
  Download, 
  AlertTriangle, 
  Lock, 
  Eye, 
  ShieldCheck, 
  CheckCircle,
  FileCheck,
  ChevronLeft,
  ChevronRight,
  ExternalLink
} from 'lucide-react';

type FileType = 'pdf' | 'docx' | 'xlsx' | 'pptx' | 'image';

export default function PublicDocumentViewer() {
  const { id } = useParams<{ id: string }>();
  
  // Selection state for checking different mock preview styles
  const [selectedFileType, setSelectedFileType] = useState<FileType>('pdf');
  
  // PPTX slider index
  const [slideIdx, setSlideIdx] = useState(1);

  // File metadata mappings depending on selected file type
  const fileDetails = {
    pdf: {
      name: 'Company Policy Manual.pdf',
      size: '3.2 MB',
      version: 'v2.4',
      created: '01 Jan 2024',
      modified: '17 May 2024',
      description: 'Official corporate manual detailing guidelines, ethics code, and operation rules.',
      tags: ['Corporate', 'Compliance', 'HR']
    },
    docx: {
      name: 'Client Onboarding Process.docx',
      size: '2.4 MB',
      version: 'v1.2',
      created: '10 May 2024',
      modified: '19 May 2024',
      description: 'Operational guidelines for onboarding corporate clients and setting up CRM profiles.',
      tags: ['Sales', 'Process', 'Onboarding']
    },
    xlsx: {
      name: 'Financial Summary Q2.xlsx',
      size: '1.1 MB',
      version: 'v3.1',
      created: '08 May 2024',
      modified: '18 May 2024',
      description: 'Q2 spreadsheet containing operations expenditures, raw materials costs, and revenue.',
      tags: ['Finance', 'Reports', 'Q2']
    },
    pptx: {
      name: 'Product Roadmap Q3.pptx',
      size: '5.6 MB',
      version: 'v1.0',
      created: '12 May 2024',
      modified: '19 May 2024',
      description: 'Executive roadmap presentation highlighting milestones and delivery schedules.',
      tags: ['Product', 'Roadmap', 'Milestones']
    },
    image: {
      name: 'Workspace Layout Proposal.png',
      size: '4.8 MB',
      version: 'v2.0',
      created: '05 May 2024',
      modified: '15 May 2024',
      description: 'High-resolution blueprint proposals for the renovated workspace expansion layout.',
      tags: ['Design', 'Workspace', 'Blueprint']
    }
  };

  const activeDoc = fileDetails[selectedFileType];

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc] font-sans text-slate-800 select-none">
      
      {/* 1. PUBLIC BRAND HEADER */}
      <header className="h-16 border-b border-slate-200/80 bg-white px-8 flex items-center justify-between shrink-0 shadow-[0_1px_2px_rgba(0,0,0,0.015)] z-20 select-none">
        
        {/* Company logo branding */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white font-extrabold shadow-sm shrink-0">
            FT
          </div>
          <div>
            <h1 className="text-xs font-extrabold text-slate-950 block leading-tight">Fast Trade Technologies</h1>
            <span className="text-[9.5px] text-slate-400 font-bold block mt-0.5 select-all">Public Link ID: {id || 'abc123'}</span>
          </div>
        </div>

        {/* Dynamic selector to test other mock previews */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider hidden md:block">Inspect Preview:</span>
          <select
            value={selectedFileType}
            onChange={(e) => setSelectedFileType(e.target.value as FileType)}
            className="bg-[#f8fafc] border border-slate-200 hover:border-slate-350 rounded-xl px-3 py-1.5 text-xs text-slate-700 font-bold focus:outline-none cursor-pointer shadow-sm w-36"
          >
            <option value="pdf">PDF File</option>
            <option value="docx">Word (DOCX)</option>
            <option value="xlsx">Excel (XLSX)</option>
            <option value="pptx">PowerPoint</option>
            <option value="image">Blueprint Image</option>
          </select>
        </div>
      </header>

      {/* 2. TWO-COLUMN LAYOUT CONTENT BODY */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-8 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: Large Document Preview Area (Wide) */}
        <div className="lg:col-span-2 space-y-4 flex flex-col">
          
          {/* Document name & Sharing details box */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.01)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none shrink-0">
            <div className="space-y-1">
              <span className="text-sm font-extrabold text-slate-950 block truncate max-w-[450px]">
                {activeDoc.name}
              </span>
              <p className="text-[10.5px] text-slate-455 font-bold flex flex-wrap gap-x-2.5">
                <span>Shared by: <strong>Paras Jain</strong></span>
                <span className="text-slate-250">&bull;</span>
                <span>Department: <strong>Finance</strong></span>
                <span className="text-slate-250">&bull;</span>
                <span>Date: <strong>19 May 2024</strong></span>
              </p>
            </div>

            {/* Badges block */}
            <div className="flex flex-wrap gap-2 shrink-0">
              <span className="px-2.5 py-0.8 rounded-full border text-[8.5px] font-extrabold uppercase tracking-wider bg-slate-50 text-slate-500 border-slate-200 flex items-center gap-1">
                <Lock className="w-2.8 h-2.8 text-slate-400" />
                <span>Password Lock</span>
              </span>
              
              <span className="px-2.5 py-0.8 rounded-full border text-[8.5px] font-extrabold uppercase tracking-wider bg-red-50 text-red-650 border-red-150">
                Expires: 31 July 2026
              </span>
            </div>
          </div>

          {/* DOCUMENT PREVIEW CARD CONTAINER */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex-1 min-h-[480px] flex flex-col overflow-hidden relative border-t-4 border-t-blue-600">
            
            {/* Action Bar inside Preview */}
            <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between shrink-0 text-slate-455 font-bold text-xs select-none">
              <span>Secure Document Viewer &bull; Read-Only</span>
              
              <div className="flex items-center gap-2 text-[10.5px] text-slate-500">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span>SSL Encrypted Link</span>
              </div>
            </div>

            {/* PREVIEW RENDERS */}
            <div className="flex-1 overflow-auto bg-slate-100/50 p-6 flex items-center justify-center">
              
              {/* PDF Preview Mode */}
              {selectedFileType === 'pdf' && (
                <div className="w-full max-w-[550px] bg-white rounded-xl shadow-[0_4px_16px_rgba(0,0,0,0.03)] border border-slate-200 p-8 space-y-6 text-xs font-semibold text-slate-700 leading-relaxed max-h-[500px] overflow-y-auto select-text select-none">
                  <div className="text-center pb-4 border-b border-slate-100">
                    <h2 className="text-sm font-extrabold text-slate-900 leading-none">{activeDoc.name}</h2>
                    <span className="text-[10px] text-slate-400 block mt-1.5 uppercase tracking-wider">Fast Trade compliance guidelines</span>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-slate-900 font-extrabold">Section 1: General Code of Conduct</h3>
                    <p>All members of the executive workspace are expected to comply with security guidelines. Confidential documents must not be distributed without prior declassification permissions.</p>
                    <p>Financial budgets, reports, and onboarding process charts are considered high-priority credentials. Access logs are audited dynamically under Admin guidelines.</p>
                    
                    <h3 className="text-slate-900 font-extrabold pt-2 border-t border-slate-50">Section 2: Operating Procedures</h3>
                    <p>Operations department logs should remain in standard folders. Any external link creation must set validation dates and password locks to avoid breaches.</p>
                  </div>
                  
                  <div className="text-center pt-6 text-[10px] text-slate-400 border-t border-slate-100 select-none">
                    Page 1 of 3 &bull; Confirmed link scope
                  </div>
                </div>
              )}

              {/* DOCX Preview Mode */}
              {selectedFileType === 'docx' && (
                <div className="w-full max-w-[550px] bg-white rounded-xl shadow-[0_4px_16px_rgba(0,0,0,0.03)] border border-slate-200 p-8 space-y-5 text-xs font-semibold text-slate-700 leading-relaxed select-text select-none">
                  <div className="border-b-2 border-slate-900 pb-3">
                    <span className="text-[9.5px] text-slate-400 font-extrabold uppercase tracking-widest block">Operational Draft Manual</span>
                    <h2 className="text-sm font-extrabold text-slate-900 mt-1 leading-none">{activeDoc.name}</h2>
                  </div>
                  
                  <div className="space-y-4">
                    <p>This document details onboarding operations pipelines. The target is to reduce client onboarding times by **18%** through CRM template scripts.</p>
                    <div className="p-3 bg-blue-50/30 border-l-4 border-l-blue-600 text-slate-700 italic">
                      "Make sure compliance teams review NDA sheets before granting operations folder permissions."
                    </div>
                    <p>Steps include corporate email verification, KYC document upload, and supervisor approvals tracking.</p>
                  </div>
                </div>
              )}

              {/* XLSX Preview Mode */}
              {selectedFileType === 'xlsx' && (
                <div className="w-full max-w-[550px] bg-white rounded-xl shadow-[0_4px_16px_rgba(0,0,0,0.03)] border border-slate-200 overflow-hidden text-xs select-none">
                  {/* Mock spreadsheet grid */}
                  <table className="w-full text-left border-collapse font-semibold text-slate-700">
                    <thead>
                      <tr className="bg-slate-100/80 text-[10px] text-slate-400 font-extrabold border-b border-slate-200 text-center uppercase tracking-wider">
                        <th className="py-2.5 px-3 border-r border-slate-200 w-10"></th>
                        <th className="py-2.5 px-3 border-r border-slate-200">A</th>
                        <th className="py-2.5 px-3 border-r border-slate-200">B</th>
                        <th className="py-2.5 px-3 border-r border-slate-200">C</th>
                        <th className="py-2.5 px-3">D</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150">
                      {[
                        { r: 1, c1: 'Category', c2: 'Budget (Q1)', c3: 'Actual (Q2)', c4: 'Variance' },
                        { r: 2, c1: 'Operations', c2: '₹1.50 Cr', c3: '₹1.72 Cr', c4: '+14.6%' },
                        { r: 3, c1: 'Sales Marketing', c2: '₹84.6 L', c3: '₹98.2 L', c4: '+16.0%' },
                        { r: 4, c1: 'Procurement', c2: '₹31.2 L', c3: '₹36.8 L', c4: '+17.9%' },
                        { r: 5, c1: 'HR Costs', c2: '₹12.4 L', c3: '₹12.0 L', c4: '-3.2%' },
                        { r: 6, c1: 'Total Expenses', c2: '₹2.78 Cr', c3: '₹3.19 Cr', c4: '+14.7%' }
                      ].map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="py-2 px-3 border-r border-slate-200 bg-slate-50/70 text-slate-400 text-center text-[10px] font-extrabold">{row.r}</td>
                          <td className="py-2 px-3 border-r border-slate-200 text-slate-800 font-extrabold truncate">{row.c1}</td>
                          <td className="py-2 px-3 border-r border-slate-200 font-mono text-[11px] text-slate-500">{row.c2}</td>
                          <td className="py-2 px-3 border-r border-slate-200 font-mono text-[11px] text-slate-800 font-bold">{row.c3}</td>
                          <td className="py-2 px-3 font-bold text-slate-600">{row.c4}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  <div className="bg-slate-50 px-3.5 py-1.8 text-[10px] text-slate-400 font-bold border-t border-slate-200">
                    Sheet1 &bull; Financial Summary Q2
                  </div>
                </div>
              )}

              {/* PPTX Preview Mode */}
              {selectedFileType === 'pptx' && (
                <div className="w-full max-w-[550px] bg-slate-900 rounded-xl shadow-[0_4px_16px_rgba(0,0,0,0.05)] border border-slate-800 overflow-hidden flex flex-col justify-between aspect-[16/9] text-white p-6 relative select-none">
                  
                  {/* Slide header */}
                  <div className="flex justify-between items-center text-[9px] text-slate-400 font-extrabold uppercase tracking-wider">
                    <span>Roadmap Projections</span>
                    <span>Slide {slideIdx} of 4</span>
                  </div>

                  {/* Slide content */}
                  {slideIdx === 1 && (
                    <div className="my-auto space-y-2 text-center animate-in fade-in duration-150">
                      <h2 className="text-base font-extrabold text-white tracking-tight">{activeDoc.name}</h2>
                      <p className="text-[10px] text-blue-400 font-bold">Fast Trade Technologies Development roadmap</p>
                    </div>
                  )}

                  {slideIdx === 2 && (
                    <div className="my-auto space-y-3.5 animate-in fade-in duration-150">
                      <h3 className="text-xs font-extrabold text-blue-400 uppercase tracking-wider border-b border-slate-800 pb-1.5">Q3 Core Objectives</h3>
                      <ul className="space-y-1.8 text-[10.5px] font-semibold text-slate-300">
                        <li>&bull; consilidate server storage to standard vectors database.</li>
                        <li>&bull; support semantic search queries indexing on PDF/DOCX content.</li>
                        <li>&bull; Release external file encryption keys locks setup.</li>
                      </ul>
                    </div>
                  )}

                  {slideIdx === 3 && (
                    <div className="my-auto space-y-3.5 animate-in fade-in duration-150">
                      <h3 className="text-xs font-extrabold text-blue-400 uppercase tracking-wider border-b border-slate-800 pb-1.5">Target Metrics</h3>
                      <ul className="space-y-1.8 text-[10.5px] font-semibold text-slate-300">
                        <li>&bull; reduce metadata query times to under 350ms.</li>
                        <li>&bull; maintain 99.9% uptime compliance targets.</li>
                      </ul>
                    </div>
                  )}

                  {slideIdx === 4 && (
                    <div className="my-auto space-y-2 text-center animate-in fade-in duration-150">
                      <h2 className="text-sm font-extrabold text-white">Questions & Discussion</h2>
                      <p className="text-[9.5px] text-slate-400 font-semibold mt-1">support@fasttrade.com</p>
                    </div>
                  )}

                  {/* Slide controls footer */}
                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-extrabold select-none border-t border-slate-800/80 pt-3 mt-4 shrink-0">
                    <span>Fast Trade Corporate PPT</span>
                    
                    <div className="flex gap-2">
                      <button 
                        type="button" 
                        disabled={slideIdx <= 1}
                        onClick={() => setSlideIdx(prev => prev - 1)}
                        className="p-1 hover:bg-slate-800 disabled:opacity-30 rounded text-white"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        type="button" 
                        disabled={slideIdx >= 4}
                        onClick={() => setSlideIdx(prev => prev + 1)}
                        className="p-1 hover:bg-slate-800 disabled:opacity-30 rounded text-white"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Image Preview Mode */}
              {selectedFileType === 'image' && (
                <div className="w-full max-w-[480px] bg-white rounded-xl shadow-[0_4px_16px_rgba(0,0,0,0.03)] border border-slate-200 p-3 select-none">
                  <div className="relative rounded-lg overflow-hidden border border-slate-100 aspect-video">
                    <img 
                      src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=600" 
                      alt={activeDoc.name} 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <div className="pt-3 px-1.5 flex justify-between items-center text-[9.5px] text-slate-400 font-bold uppercase tracking-wider select-none">
                    <span>Blueprint Layout Proposal</span>
                    <span>1920 x 1080</span>
                  </div>
                </div>
              )}

            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Metadata & Sharing Details (Narrow) */}
        <div className="space-y-6">
          
          {/* Action Toolbar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-4">
            <span className="font-extrabold text-xs text-slate-900 block border-b border-slate-100 pb-2.5">Available Actions</span>
            
            <div className="flex flex-col gap-2 select-none">
              <button 
                type="button"
                onClick={() => alert('Opening full screen preview (Mock)')}
                className="w-full flex items-center justify-center gap-2 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors border border-blue-500"
              >
                <Eye className="w-4 h-4" />
                <span>Full Screen Preview</span>
              </button>
              
              <button 
                type="button"
                onClick={() => alert('Downloading file (Mock)')}
                className="w-full flex items-center justify-center gap-2 py-2 border border-slate-200 hover:border-slate-350 hover:bg-slate-50 text-xs font-bold text-slate-700 bg-white rounded-xl transition-colors shadow-[0_1px_2px_rgba(0,0,0,0.01)]"
              >
                <Download className="w-4 h-4 text-slate-400" />
                <span>Download File</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button 
                  type="button"
                  onClick={() => alert('Printing file (Mock)')}
                  className="flex items-center justify-center gap-1.5 py-1.8 border border-slate-200 hover:border-slate-350 hover:bg-slate-50 text-[10.5px] font-extrabold text-slate-700 bg-white rounded-xl transition-colors shadow-[0_1px_2px_rgba(0,0,0,0.01)]"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-400" />
                  <span>Print</span>
                </button>
                
                <button 
                  type="button"
                  onClick={() => alert('Access request submitted')}
                  className="flex items-center justify-center gap-1.5 py-1.8 border border-slate-200 hover:border-slate-350 hover:bg-slate-50 text-[10.5px] font-extrabold text-slate-700 bg-white rounded-xl transition-colors shadow-[0_1px_2px_rgba(0,0,0,0.01)]"
                >
                  <FileCheck className="w-3.5 h-3.5 text-slate-400" />
                  <span>Request Access</span>
                </button>
              </div>

              <button 
                type="button"
                onClick={() => alert('Link reported to operations security')}
                className="w-full flex items-center justify-center gap-1.5 py-1.8 text-[10.5px] font-extrabold text-red-500 hover:text-red-700 bg-white border border-red-200 hover:border-red-300 rounded-xl transition-all shadow-sm mt-1"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Report Abuse / Flag Link</span>
              </button>
            </div>
          </div>

          {/* Security Information Panel */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-4">
            <span className="font-extrabold text-xs text-slate-900 block border-b border-slate-100 pb-2.5">Security & Compliance</span>
            
            <div className="grid grid-cols-2 gap-2 text-[10px] font-extrabold select-none">
              <div className="p-2 border border-slate-200 rounded-xl bg-slate-50/50 flex flex-col items-center justify-center text-center gap-1">
                <ShieldCheck className="w-5.5 h-5.5 text-blue-600" />
                <span className="text-slate-800 mt-1">256-bit SSL</span>
              </div>

              <div className="p-2 border border-slate-200 rounded-xl bg-slate-50/50 flex flex-col items-center justify-center text-center gap-1">
                <CheckCircle className="w-5.5 h-5.5 text-emerald-600" />
                <span className="text-slate-800 mt-1">Virus Scanned</span>
              </div>

              <div className="p-2 border border-slate-200 rounded-xl bg-slate-50/50 flex flex-col items-center justify-center text-center gap-1">
                <FileCheck className="w-5.5 h-5.5 text-blue-600" />
                <span className="text-slate-800 mt-1">Verified Link</span>
              </div>

              <div className="p-2 border border-slate-200 rounded-xl bg-slate-50/50 flex flex-col items-center justify-center text-center gap-1">
                <Eye className="w-5.5 h-5.5 text-slate-500" />
                <span className="text-slate-800 mt-1">Read Only</span>
              </div>
            </div>
          </div>

          {/* Document Properties Metadata Panel */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-4">
            <span className="font-extrabold text-xs text-slate-900 block border-b border-slate-100 pb-2.5">Document Details</span>
            
            <div className="space-y-3.5 text-xs font-semibold text-slate-700 leading-normal">
              <div className="flex justify-between">
                <span className="text-slate-450">Owner</span>
                <span className="text-slate-800 font-extrabold">Paras Jain</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-450">Department</span>
                <span className="text-slate-800 font-extrabold">Finance</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-455">File Size</span>
                <span className="text-slate-800 font-extrabold">{activeDoc.size}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-455">Version</span>
                <span className="text-slate-800 font-extrabold">{activeDoc.version}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-455">Created Date</span>
                <span className="text-slate-800 font-extrabold">{activeDoc.created}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-455">Last Modified</span>
                <span className="text-slate-850 font-semibold">{activeDoc.modified}</span>
              </div>
              
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <span className="text-slate-450 text-[10px] uppercase tracking-wider block">Description</span>
                <p className="text-[11px] text-slate-500 font-medium leading-relaxed">{activeDoc.description}</p>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-slate-100 select-none">
                <span className="text-slate-450 text-[10px] uppercase tracking-wider block">Tags</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {activeDoc.tags.map(t => (
                    <span key={t} className="px-1.5 py-0.2 rounded bg-slate-100 border border-slate-200 text-[9.5px] text-slate-500 font-bold">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>

      </main>

      {/* 3. PUBLIC LINK FOOTER */}
      <footer className="bg-white border-t border-slate-200 px-8 py-5 text-center select-none text-[10.5px] font-semibold text-slate-450 shrink-0 shadow-[0_-1px_3px_rgba(0,0,0,0.01)] mt-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3">
          <span>&copy; 2026 Fast Trade Technologies Pvt. Ltd. All rights reserved.</span>
          
          <div className="flex gap-4 text-blue-600 font-extrabold">
            <a href="#" onClick={(e) => { e.preventDefault(); alert('Terms of Service opened (Mock)'); }} className="hover:underline flex items-center gap-0.5">
              <span>Terms of Service</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <a href="#" onClick={(e) => { e.preventDefault(); alert('Privacy Policy opened (Mock)'); }} className="hover:underline flex items-center gap-0.5">
              <span>Privacy Policy</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <a href="#" onClick={(e) => { e.preventDefault(); alert('Support opened (Mock)'); }} className="hover:underline flex items-center gap-0.5">
              <span>Support Helpdesk</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>

    </div>
  );
}
