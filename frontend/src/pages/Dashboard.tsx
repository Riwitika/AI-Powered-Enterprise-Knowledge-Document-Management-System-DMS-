import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { 
  FileText, 
  Users, 
  Clock, 
  Eye, 
  TrendingUp,
  ChevronRight,
  Sparkles,
  ArrowRight,
  FolderTree,
  FileCheck,
  Globe,
  FolderGit2
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { data: metrics, isLoading, isError, error } = useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: api.dashboard.metrics,
    refetchInterval: 5000 // Refresh every 5s to show background processing updates!
  });

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center space-y-3">
          <div className="h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-400 text-sm font-semibold">Loading dashboard analytics...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700 shadow-sm">
        <h3 className="font-bold text-base">Failed to load dashboard metrics</h3>
        <p className="text-xs mt-1">{(error as any)?.message || 'An error occurred.'}</p>
      </div>
    );
  }

  const statCards = [
    {
      name: 'Total Documents',
      value: metrics?.total_documents || 0,
      icon: FileText,
      color: 'bg-blue-50 text-blue-600 border-blue-100',
      description: 'Files in active system'
    },
    {
      name: 'Pending Approvals',
      value: metrics?.pending_approvals_count || 0,
      icon: Clock,
      color: 'bg-amber-50 text-amber-600 border-amber-100',
      description: 'Awaiting manager review'
    },
    {
      name: 'Approved Documents',
      value: metrics?.approved_documents_count || 0,
      icon: FileCheck,
      color: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      description: 'Active & verified'
    },
    {
      name: 'Public Documents',
      value: metrics?.public_documents_count || 0,
      icon: Globe,
      color: 'bg-indigo-50 text-indigo-600 border-indigo-100',
      description: 'Accessible externally'
    },
    {
      name: 'Total Users',
      value: metrics?.total_users_count || 0,
      icon: Users,
      color: 'bg-slate-100 text-slate-700 border-slate-200',
      description: 'Registered accounts'
    },
    {
      name: 'Recent Uploads',
      value: metrics?.recent_uploads_count || 0,
      icon: TrendingUp,
      color: 'bg-cyan-50 text-cyan-600 border-cyan-100',
      description: 'Added in last 7 days'
    },
  ];

  const getFileTypeColor = (type: string) => {
    const t = type.toLowerCase();
    if (t === 'pdf') return 'bg-red-50 text-red-700 border-red-200';
    if (['doc', 'docx'].includes(t)) return 'bg-blue-50 text-blue-700 border-blue-200';
    if (['xls', 'xlsx', 'csv'].includes(t)) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (['ppt', 'pptx'].includes(t)) return 'bg-orange-50 text-orange-700 border-orange-200';
    return 'bg-slate-50 text-slate-750 border-slate-200';
  };

  const getAccessLevelColor = (level: string) => {
    const l = level.toLowerCase();
    if (l === 'private') return 'bg-red-50 text-red-700 border-red-200';
    if (l === 'department') return 'bg-amber-50 text-amber-700 border-amber-200';
    if (l === 'view_only') return 'bg-blue-50 text-blue-700 border-blue-200';
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  };

  // Fetch real recent AI conversations
  const { data: conversations } = useQuery({
    queryKey: ['recent-conversations'],
    queryFn: api.ai.conversations,
    refetchInterval: 5000
  });

  return (
    <div className="space-y-6 relative font-sans">
      
      {/* Welcome banner header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Overview</h1>
          <p className="text-slate-500 text-xs mt-0.5 font-medium">Real-time telemetry and metadata indicators from the security KMS repository.</p>
        </div>
        
        <div className="flex gap-3 select-none">
          <Link 
            to="/documents" 
            className="glow-btn bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 text-xs font-bold shadow-sm flex items-center gap-1.5 w-fit transition-colors border border-blue-500"
          >
            <FolderTree className="h-4 w-4" />
            <span>Open Workspace</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <Link 
            to="/chat" 
            className="glow-btn bg-slate-900 hover:bg-slate-800 text-white rounded-lg px-4 py-2 text-xs font-bold shadow-sm flex items-center gap-1.5 w-fit transition-colors"
          >
            <Sparkles className="h-4 w-4 text-blue-400" />
            <span>Consult AI Assistant</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.name}
              className="overflow-hidden rounded-xl bg-white border border-slate-200/80 p-6 min-h-[120px] flex items-center shadow-[0_4px_20px_rgba(0,0,0,0.015)] group hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:-translate-y-0.5 transition-all duration-300 select-none"
            >
              <div className="flex items-center w-full">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl border ${card.color} shrink-0 shadow-sm`}>
                  <Icon className="h-5.5 w-5.5" />
                </div>
                <div className="ml-4 min-w-0 flex-1">
                  <p className="truncate text-[9.5px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">{card.name}</p>
                  <p className="mt-1.5 text-2xl font-extrabold text-slate-900 tracking-tight leading-none">{card.value}</p>
                  <span className="text-[10px] text-slate-455 font-bold mt-1 block truncate leading-none">{card.description}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3-Column Grid for Metrics details */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        
        {/* Col 1: Recent File Ingests */}
        <div className="rounded-xl bg-white border border-slate-200 p-6 shadow-sm flex flex-col h-[400px]">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 mb-3.5 shrink-0 select-none">
            <div className="flex items-center gap-2">
              <Clock className="h-4.5 w-4.5 text-blue-600" />
              <h2 className="font-bold text-slate-800 text-sm">Recent File Ingests</h2>
            </div>
            <Link to="/documents" className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1">
              <span>Explorer</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
            {metrics?.recent_uploads && metrics.recent_uploads.length > 0 ? (
              <div className="space-y-2">
                {metrics.recent_uploads.map((doc: any) => (
                  <div 
                    key={doc.id} 
                    className="p-3 bg-slate-50/50 hover:bg-slate-50 border border-slate-200/60 rounded-xl flex items-center justify-between transition-all"
                  >
                    <div className="min-w-0 flex-1 flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 border border-blue-100 text-blue-600">
                        <FileText className="h-4.5 w-4.5" />
                      </div>
                      <div className="min-w-0">
                        <Link 
                          to={`/documents?open=${doc.id}`}
                          className="truncate text-xs font-bold text-slate-800 hover:text-blue-600 block"
                        >
                          {doc.name}
                        </Link>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1">
                          <span className={`px-1.5 py-0.2 rounded border text-[8px] font-bold uppercase tracking-wider ${getFileTypeColor(doc.file_type)}`}>
                            {doc.file_type}
                          </span>
                          <span>•</span>
                          <span className="truncate">{doc.category || 'General'}</span>
                          <span>•</span>
                          <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="ml-4 shrink-0 select-none">
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider ${getAccessLevelColor(doc.access_level)}`}>
                        {doc.access_level}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs py-8 space-y-2 select-none">
                <FileText className="h-10 w-10 text-slate-200" />
                <p>No documents uploaded yet.</p>
                <Link to="/documents" className="text-blue-600 hover:underline font-bold">Go to Document Tree</Link>
              </div>
            )}
          </div>
        </div>

        {/* Col 2: Documents by Department */}
        <div className="rounded-xl bg-white border border-slate-200 p-6 shadow-sm flex flex-col h-[400px]">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3.5 mb-3.5 shrink-0 select-none">
            <TrendingUp className="h-4.5 w-4.5 text-blue-600" />
            <h2 className="font-bold text-slate-800 text-sm">Distribution by Dept</h2>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
            {metrics?.documents_by_department && Object.keys(metrics.documents_by_department).length > 0 ? (
              <div className="space-y-4">
                {Object.entries(metrics.documents_by_department).map(([dept, count], idx) => {
                  const percentage = Math.max(5, Math.min(100, ((count as number) / (metrics.total_documents || 1)) * 100));
                  
                  const progressColors = [
                    'bg-blue-600',
                    'bg-emerald-600',
                    'bg-indigo-600',
                    'bg-amber-600',
                    'bg-cyan-600',
                  ];
                  const barColor = progressColors[idx % progressColors.length];
                  
                  return (
                    <div key={dept} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-bold text-slate-750">{dept}</span>
                        <span className="text-slate-400 font-bold">{count as number} docs ({Math.round(percentage)}%)</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/40">
                        <div 
                          className={`h-full rounded-full ${barColor}`} 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs py-8 space-y-2 select-none">
                <FolderGit2 className="h-10 w-10 text-slate-200" />
                <p>No department data available.</p>
              </div>
            )}
          </div>
        </div>

        {/* Col 3: Unified Recent Activity Section */}
        <div className="rounded-xl bg-white border border-slate-200 p-6 shadow-sm flex flex-col h-[400px]">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 mb-3.5 shrink-0 select-none">
            <div className="flex items-center gap-2">
              <Clock className="h-4.5 w-4.5 text-blue-600" />
              <h2 className="font-bold text-slate-800 text-sm">Recent Enterprise Activity</h2>
            </div>
            <span className="text-[10px] text-slate-400 font-bold bg-slate-50 border border-slate-200 px-2 py-0.5 rounded uppercase tracking-wider">
              Live Feed
            </span>
          </div>

          <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
            {metrics?.recent_activity && metrics.recent_activity.length > 0 ? (
              <div className="relative pl-4 border-l border-slate-200 space-y-5 py-2">
                {metrics.recent_activity.map((act: any) => {
                  let actText = '';
                  let typeLabel = '';
                  let badgeStyle = '';

                  if (act.type === 'upload') {
                    actText = 'uploaded a new document';
                    typeLabel = 'Upload';
                    badgeStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                  } else if (act.type === 'edit') {
                    actText = 'updated version of';
                    typeLabel = 'Edit';
                    badgeStyle = 'bg-blue-50 text-blue-700 border-blue-200';
                  } else {
                    actText = 'approved the document';
                    typeLabel = 'Approval';
                    badgeStyle = 'bg-indigo-50 text-indigo-700 border-indigo-200';
                  }

                  return (
                    <div key={act.id} className="relative flex items-start gap-3 text-xs">
                      {/* Timeline marker */}
                      <div className="absolute -left-[22.5px] top-1 flex h-4 w-4 items-center justify-center rounded-full bg-white border border-slate-200 shadow-sm shrink-0">
                        <span className={`h-1.5 w-1.5 rounded-full ${act.type === 'upload' ? 'bg-emerald-500' : act.type === 'edit' ? 'bg-blue-500' : 'bg-indigo-500'}`} />
                      </div>
                      
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1">
                          <div className="min-w-0">
                            <span className="font-extrabold text-slate-800">{act.user_name} </span>
                            <span className="text-slate-500">{actText} </span>
                            <Link
                              to={`/documents?open=${act.document_id}`}
                              className="font-extrabold text-blue-600 hover:text-blue-700 hover:underline block truncate mt-0.5"
                            >
                              {act.document_name}
                            </Link>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0 select-none mt-1 sm:mt-0">
                            <span className={`px-1.5 py-0.2 rounded border text-[8px] font-bold uppercase tracking-wider ${badgeStyle}`}>
                              {typeLabel}
                            </span>
                            <span className="text-[9px] text-slate-400 font-bold whitespace-nowrap">
                              {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs py-12 space-y-2 select-none">
                <Clock className="h-10 w-10 text-slate-200" />
                <p>No recent activity logged.</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* 2-Column Grid for AI history and Most Referenced Info */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        
        {/* Recent AI Activity log */}
        <div className="rounded-xl bg-white border border-slate-200 p-6 shadow-sm flex flex-col h-[320px]">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3.5 mb-3.5 shrink-0 select-none">
            <Sparkles className="h-4.5 w-4.5 text-blue-600" />
            <h2 className="font-bold text-slate-800 text-sm">Recent AI & RAG Activity</h2>
          </div>

          <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 custom-scrollbar">
            {conversations && conversations.slice(0, 4).map((convo: any) => (
              <div key={convo.id} className="flex justify-between items-start text-xs p-2.5 bg-slate-50/50 hover:bg-slate-100 border border-slate-200/50 rounded-xl transition-colors">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="h-6.5 w-6.5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-150">
                    AI
                  </div>
                  <div className="truncate">
                    <strong className="text-slate-800">AI Query: </strong> <span className="text-slate-500 font-medium">{convo.question}</span>
                  </div>
                </div>
                <span className="text-[9px] font-bold text-slate-400 shrink-0 mt-0.5 select-none">
                  {new Date(convo.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
            {(!conversations || conversations.length === 0) && (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs py-12 space-y-2 select-none">
                <Sparkles className="h-10 w-10 text-slate-200" />
                <p>No recent AI activity logged.</p>
              </div>
            )}
          </div>
        </div>

        {/* Most Referenced/Viewed Documents */}
        <div className="rounded-xl bg-white border border-slate-200 p-6 shadow-sm flex flex-col h-[320px]">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3.5 mb-3.5 shrink-0 select-none">
            <Eye className="h-4.5 w-4.5 text-blue-650" />
            <h2 className="font-bold text-slate-800 text-sm">Most Referenced Information</h2>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar">
            {metrics?.most_viewed_documents && metrics.most_viewed_documents.length > 0 ? (
              <div className="grid grid-cols-1 gap-3">
                {metrics.most_viewed_documents.map((doc: any) => (
                  <div 
                    key={doc.id} 
                    className="bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-xl p-3.5 transition-all relative overflow-hidden group"
                  >
                    <div className="absolute top-0 right-0 h-[2px] w-[50px] bg-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="flex justify-between items-start">
                      <Link 
                        to={`/documents?open=${doc.id}`}
                        className="font-bold text-slate-800 hover:text-blue-600 text-xs truncate pr-4"
                      >
                        {doc.name}
                      </Link>
                      <span className="text-[9px] text-blue-600 font-bold font-mono bg-blue-50 border border-blue-100 px-2 py-0.5 rounded select-none">
                        v{doc.current_version}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 truncate">{doc.description || 'No description provided.'}</p>
                    {doc.ai_summary && (
                      <p className="text-[11px] text-slate-600 bg-white border border-slate-200/80 p-2 rounded-lg mt-2 line-clamp-1 leading-relaxed">
                        {doc.ai_summary}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs py-8 space-y-2 select-none">
                <Eye className="h-10 w-10 text-slate-200" />
                <p>No active documents referenced yet.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
