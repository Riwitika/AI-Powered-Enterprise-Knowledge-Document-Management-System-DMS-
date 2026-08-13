import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { Check, X, FileText, User, Calendar, ShieldCheck, AlertCircle, Eye } from 'lucide-react';
import { sanitizeHtml } from '../utils/sanitize';

export default function ApprovalDashboard() {
  const queryClient = useQueryClient();
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [remarks, setRemarks] = useState<string>('');
  const [showRejectForm, setShowRejectForm] = useState<boolean>(false);

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };
  const [confirmApproveId, setConfirmApproveId] = useState<string | null>(null);

  const { data: pendingDocs, isLoading } = useQuery({
    queryKey: ['pending-documents'],
    queryFn: api.documents.getPending,
    refetchOnWindowFocus: true
  });

  const approveMutation = useMutation({
    mutationFn: api.documents.approve,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-documents'] });
      queryClient.invalidateQueries({ queryKey: ['documents-list-workspace'] });
      queryClient.invalidateQueries({ queryKey: ['folders-tree'] });
      setSelectedDoc(null);
      setRemarks('');
      setShowRejectForm(false);
    },
    onError: (err: any) => {
      showToast(err.message || 'Failed to approve document');
    }
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, remarks }: { id: string; remarks: string }) => api.documents.reject(id, remarks),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-documents'] });
      queryClient.invalidateQueries({ queryKey: ['documents-list-workspace'] });
      queryClient.invalidateQueries({ queryKey: ['folders-tree'] });
      setSelectedDoc(null);
      setRemarks('');
      setShowRejectForm(false);
    },
    onError: (err: any) => {
      showToast(err.message || 'Failed to reject document');
    }
  });

  const handleApprove = (id: string) => {
    setConfirmApproveId(id);
  };

  const handleRejectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!remarks.trim()) {
      showToast('Please provide rejection remarks');
      return;
    }
    rejectMutation.mutate({ id: selectedDoc.id, remarks });
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50">
        <div className="text-center space-y-2">
          <div className="h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Loading Pending Documents...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex h-full overflow-hidden bg-slate-50">
      {/* Left List Pane */}
      <div className="w-[400px] border-r border-slate-200 bg-white flex flex-col shrink-0">
        <div className="p-6 border-b border-slate-200 shrink-0">
          <h2 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-blue-600" />
            <span>Approval Queue</span>
          </h2>
          <p className="text-[10px] text-slate-450 font-bold uppercase tracking-wider mt-1">
            Review and authorize document releases
          </p>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
          {!pendingDocs || pendingDocs.length === 0 ? (
            <div className="text-center py-12 px-4 space-y-2">
              <AlertCircle className="h-8 w-8 text-slate-300 mx-auto" />
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Queue is empty</p>
              <p className="text-[10px] text-slate-450">All documents are processed.</p>
            </div>
          ) : (
            pendingDocs.map((doc: any) => (
              <button
                key={doc.id}
                onClick={() => {
                  setSelectedDoc(doc);
                  setShowRejectForm(false);
                  setRemarks('');
                }}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  selectedDoc?.id === doc.id
                    ? 'border-blue-600 bg-blue-50/50 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-slate-350 hover:bg-slate-50/50'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4.5 w-4.5 text-blue-600 shrink-0" />
                    <span className="font-bold text-slate-800 text-xs truncate max-w-[220px]">{doc.name}</span>
                  </div>
                  <span className="bg-amber-100 text-amber-800 text-[8px] font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                    Pending
                  </span>
                </div>
                
                <p className="text-[10px] text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                  {doc.description || "No description provided."}
                </p>

                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-100 text-[9px] text-slate-400 font-bold uppercase">
                  <span className="flex items-center gap-1"><User className="h-3 w-3" /> {doc.owner?.full_name || 'Owner'}</span>
                  <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(doc.created_at).toLocaleDateString()}</span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Right Detail / Preview Pane */}
      <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden">
        {selectedDoc ? (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Action Bar */}
            <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0 shadow-sm">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">{selectedDoc.name}</h3>
                <p className="text-[10px] text-slate-450 mt-0.5">
                  Submitted by {selectedDoc.owner?.full_name || 'System User'} on {new Date(selectedDoc.created_at).toLocaleDateString()}
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => handleApprove(selectedDoc.id)}
                  disabled={approveMutation.isPending || rejectMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-4 py-2 text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Check className="h-4 w-4" />
                  <span>Approve Release</span>
                </button>
                <button
                  onClick={() => setShowRejectForm(true)}
                  disabled={approveMutation.isPending || rejectMutation.isPending}
                  className="bg-red-600 hover:bg-red-700 text-white rounded-lg px-4 py-2 text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  <X className="h-4 w-4" />
                  <span>Reject</span>
                </button>
              </div>
            </div>

            {/* Content Display and Rejection Remarks Form */}
            <div className="flex-1 flex gap-6 p-6 overflow-hidden">
              <div className="flex-1 bg-white border border-slate-200 rounded-2xl flex flex-col overflow-hidden shadow-sm">
                <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex items-center gap-2 shrink-0">
                  <Eye className="h-4 w-4 text-slate-400" />
                  <span className="text-[9px] font-bold text-slate-450 uppercase tracking-widest">Document Review Canvas</span>
                </div>
                <div className="flex-1 overflow-y-auto p-12 custom-scrollbar select-text leading-relaxed text-[#202124] text-[14px]">
                  <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(selectedDoc.content || `<p class="italic text-slate-400">This document has no content to review.</p>`) }} />
                </div>
              </div>

              {/* Rejection Remarks Form Sidebar overlay */}
              {showRejectForm && (
                <div className="w-[320px] bg-white border border-slate-200 rounded-2xl p-5 shrink-0 flex flex-col shadow-md animate-in slide-in-from-right duration-250">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
                    <span className="text-xs font-bold text-slate-800">Provide Rejection Remarks</span>
                    <button onClick={() => setShowRejectForm(false)} className="text-slate-400 hover:text-slate-600"><X className="h-4 w-4" /></button>
                  </div>
                  <form onSubmit={handleRejectSubmit} className="flex-1 flex flex-col justify-between mt-4">
                    <div className="space-y-4">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Remarks for Creator</label>
                      <textarea
                        required
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        placeholder="State reason for rejection, improvements required, policy violations etc..."
                        className="w-full bg-slate-50 border border-slate-250 rounded-xl p-3 text-xs focus:outline-none focus:bg-white focus:border-red-500 text-slate-800 h-[240px] resize-none"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={rejectMutation.isPending}
                      className="w-full bg-red-600 hover:bg-red-700 text-white rounded-xl py-2.5 text-xs font-bold shadow-sm transition-colors mt-4 disabled:opacity-50"
                    >
                      Confirm Rejection
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center p-8 text-center space-y-3">
            <div>
              <FileText className="h-12 w-12 text-slate-300 mx-auto" />
              <h3 className="font-extrabold text-slate-850 text-sm mt-3 uppercase tracking-wide">No Document Selected</h3>
              <p className="text-[10px] text-slate-450 mt-1 max-w-[280px]">
                Select a document from the queue on the left to review its content, meta details, and authorize publication.
              </p>
            </div>
          </div>
        )}
      </div>

      {confirmApproveId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-6 select-none animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-[400px] overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <span className="font-extrabold text-sm text-slate-900">Approve Document</span>
              <button type="button" onClick={() => setConfirmApproveId(null)} className="text-slate-400 hover:text-slate-600 text-xs font-bold">✕</button>
            </div>
            <div className="p-6">
              <p className="text-xs text-slate-650 leading-relaxed font-semibold">Are you sure you want to approve this document? This will finalize the publication status and index it into the corporate workspace.</p>
            </div>
            <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-2 text-xs font-bold uppercase tracking-wider">
              <button type="button" onClick={() => setConfirmApproveId(null)} className="px-4 py-2 border border-slate-200 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-600 bg-white">Cancel</button>
              <button 
                type="button" 
                onClick={() => {
                  approveMutation.mutate(confirmApproveId);
                  setConfirmApproveId(null);
                }} 
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm"
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {toastMsg && (
        <div className="fixed bottom-6 left-6 bg-slate-900 text-white rounded-xl py-3 px-4 shadow-2xl z-[99999] flex items-center gap-2 animate-in fade-in slide-in-from-bottom-5 duration-200 text-xs font-bold select-none border border-slate-800">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
          <span>{toastMsg}</span>
        </div>
      )}

    </div>
  );
}
