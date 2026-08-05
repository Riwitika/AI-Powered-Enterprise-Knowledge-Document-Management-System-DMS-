import type React from 'react';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../stores/authStore';
import { api } from '../api/client';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  Users, 
  Cloud, 
  Sparkles,
  FolderClosed,
  Calendar,
  ClipboardList,
  CheckSquare,
  Square,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import KPICard from '../components/KPICard';
import SectionHeader from '../components/SectionHeader';
import DataTable from '../components/DataTable';
import type { DataRow } from '../components/DataTable';
import DepartmentOverviewChart from '../components/DepartmentOverviewChart';
import SystemOverviewChart from '../components/SystemOverviewChart';
import DepartmentProgressList from '../components/DepartmentProgressList';

export default function Dashboard() {
  const { user } = useAuthStore();
  const isManager = user?.role?.name === 'manager' || user?.role?.name === 'department_manager';
  const isAdmin = user?.role?.name === 'admin' || user?.role?.name === 'super_admin';
  
  const userName = user?.full_name || 'User';

  // Fetch real metrics from backend
  const { data: metrics, isLoading: metricsLoading, refetch: refetchMetrics } = useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: api.dashboard.metrics,
    staleTime: 30_000, // 30s cache
    retry: 2,
  });

  // Fetch real pending documents for managers/admins
  const { data: pendingDocs, refetch: refetchPending } = useQuery({
    queryKey: ['pending-documents'],
    queryFn: api.documents.getPending,
    staleTime: 30_000,
    enabled: isManager || isAdmin,
  });

  // Helper: format a backend timestamp to a human-readable relative time
  const formatRelativeTime = (dateStr: string): string => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffHrs < 1) return 'Just now';
    if (diffHrs < 24) return `${diffHrs}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  // Map backend DocumentResponse to DataRow for DataTable
  const docsToRows = (docs: any[]): DataRow[] => docs.map((doc) => ({
    id: doc.id,
    name: doc.name,
    category: doc.category || doc.file_type?.toUpperCase() || 'Document',
    timestamp: formatRelativeTime(doc.updated_at || doc.created_at),
    fileType: doc.file_type,
    badgeText: doc.file_type?.toUpperCase() || 'FILE',
    badgeStyle: 'bg-slate-50 text-slate-600 border-slate-200',
    ownerName: doc.owner?.full_name || 'System',
  }));

  // Helper icons mapping
  const getFileTypeIcon = (type?: string) => {
    const className = "w-8.5 h-8.5 shrink-0 rounded-lg flex items-center justify-center font-bold text-xs select-none border";
    switch (type) {
      case 'docx':
        return <div className={`${className} bg-blue-50 text-blue-655 border-blue-100`}>W</div>;
      case 'pdf':
        return <div className={`${className} bg-red-50 text-red-655 border-red-100`}>P</div>;
      case 'xlsx':
        return <div className={`${className} bg-emerald-50 text-emerald-655 border-emerald-100`}>X</div>;
      case 'pptx':
        return <div className={`${className} bg-orange-50 text-orange-600 border-orange-100`}>P</div>;
      default:
        return <div className={`${className} bg-slate-50 text-slate-500 border-slate-200`}>D</div>;
    }
  };

  const handleDocumentActionClick = (row: DataRow, _e: React.MouseEvent) => {
    window.open(`/documents/${row.id}`, '_blank');
  };

  // Employee Tasks checkbox state
  const [employeeTasks, setEmployeeTasks] = useState([
    { id: 1, text: 'Review & approve Q2 budget report', category: 'Review', date: '20 May', completed: false, badgeStyle: 'bg-indigo-50 text-indigo-750 border-indigo-150' },
    { id: 2, text: 'Complete employee handbook update', category: 'Update', date: '21 May', completed: false, badgeStyle: 'bg-blue-50 text-blue-750 border-blue-150' },
    { id: 3, text: 'Verify vendor KYC documents', category: 'Verification', date: '22 May', completed: false, badgeStyle: 'bg-amber-50 text-amber-750 border-amber-150' }
  ]);

  const toggleTask = (id: number) => {
    setEmployeeTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  // Format date dynamically: e.g. "Monday, 19 May 2024"
  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const handleRefreshAll = () => {
    refetchMetrics();
    if (isManager || isAdmin) {
      refetchPending();
    }
  };

  // 1. ADMINISTRATOR DASHBOARD VIEW
  if (isAdmin) {
    const totalDocs = metrics?.total_documents ?? 0;
    const totalUsers = metrics?.total_users_count ?? 0;
    const pendingApprovals = metrics?.pending_approvals_count ?? 0;

    const adminKpis = [
      {
        title: 'Total Users',
        value: metricsLoading ? '...' : totalUsers,
        description: 'Registered accounts',
        icon: Users,
        iconBgColor: 'bg-blue-50',
        iconColor: 'text-blue-600',
        linkText: 'View all users',
        linkTo: '/users'
      },
      {
        title: 'Total Documents',
        value: metricsLoading ? '...' : totalDocs,
        description: `${metrics?.recent_uploads_count ?? 0} uploaded recently`,
        icon: FileText,
        iconBgColor: 'bg-emerald-50',
        iconColor: 'text-emerald-650',
        linkText: 'View all documents',
        linkTo: '/documents'
      },
      {
        title: 'Active Users',
        value: metricsLoading ? '...' : (metrics?.active_users_count ?? 0),
        description: 'Active this week',
        icon: Cloud,
        iconBgColor: 'bg-purple-50',
        iconColor: 'text-purple-655',
        linkText: 'View users',
        linkTo: '/users'
      },
      {
        title: 'Pending Approvals',
        value: metricsLoading ? '...' : pendingApprovals,
        description: 'Requires your attention',
        icon: CheckSquare,
        iconBgColor: 'bg-amber-50',
        iconColor: 'text-amber-600',
        linkText: 'Review approvals',
        linkTo: '/approvals'
      }
    ];

    const adminRecentDocs: DataRow[] = metrics?.recent_uploads
      ? docsToRows(metrics.recent_uploads)
      : [];

    // Dynamic Admin Doughnut Chart computation
    const docsByDept = metrics?.documents_by_department || {};
    const deptEntries = Object.entries(docsByDept);
    const colors = ['#4f46e5', '#38bdf8', '#10b981', '#f59e0b', '#94a3b8', '#ec4899', '#8b5cf6'];
    const deptTotal = deptEntries.reduce((acc, [_, count]) => acc + (count as number), 0) || (totalDocs as number) || 0;

    let adminOffset = 0;
    const adminSegments: { name: string; count: number; percentage: number; color: string; offset: number }[] = deptEntries.map(([name, count], index) => {
      const percentage = deptTotal > 0 ? Math.round(((count as number) / deptTotal) * 100) : 0;
      const color = colors[index % colors.length];
      const offset = adminOffset;
      adminOffset += percentage;
      return { name, count: count as number, percentage, color, offset };
    });

    if (adminSegments.length === 0) {
      adminSegments.push({ name: 'No Documents', count: 0, percentage: 100, color: '#94a3b8', offset: 0 });
    }

    return (
      <div className="space-y-7 max-w-7xl mx-auto font-sans text-slate-800 pb-12 select-none">
        
        {/* Banner Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 select-none">
          <div className="space-y-1">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              Welcome back, {userName}! <span className="text-amber-500">👋</span>
            </h1>
            <p className="text-slate-500 text-xs font-semibold">Here's an overview of your organization.</p>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRefreshAll}
              title="Refresh dashboard"
              className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-400 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.02)] text-xs font-bold text-slate-650 shrink-0">
              <Calendar className="w-4 h-4 text-slate-455" />
              <span>{formattedDate}</span>
            </div>
          </div>
        </div>

        {/* KPI metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {adminKpis.map((kpi, idx) => (
            <KPICard
              key={idx}
              title={kpi.title}
              value={kpi.value}
              description={kpi.description}
              icon={kpi.icon}
              iconBgColor={kpi.iconBgColor}
              iconColor={kpi.iconColor}
              linkText={kpi.linkText}
              linkTo={kpi.linkTo}
            />
          ))}
        </div>

        {/* ROW 1: System Overview, Document Overview, Recent System Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* System Overview chart */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
            <SectionHeader
              title="System Overview"
              rightElement={
                <select className="bg-transparent border border-slate-200 rounded px-2 py-0.5 text-[10.5px] font-bold text-slate-700 focus:outline-none cursor-pointer">
                  <option>Last 7 Days</option>
                  <option>Last 30 Days</option>
                </select>
              }
            />
            <SystemOverviewChart />
          </div>

          {/* Document Overview doughnut */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
            <SectionHeader
              title="Document Overview"
              actionText="View all"
              actionTo="/documents"
            />
            
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 py-2 select-none">
              <div className="relative w-40 h-40 shrink-0">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  {adminSegments.map((seg, idx) => (
                    <circle
                      key={idx}
                      cx="50"
                      cy="50"
                      r="38"
                      fill="transparent"
                      stroke={seg.color}
                      strokeWidth="11"
                      strokeDasharray={`${seg.percentage} ${100 - seg.percentage}`}
                      strokeDashoffset={-seg.offset}
                    />
                  ))}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-[17px] font-extrabold text-slate-900 tracking-tight leading-none">
                    {metricsLoading ? '...' : totalDocs}
                  </span>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1">Documents</span>
                </div>
              </div>

              <div className="flex-1 space-y-2 w-full text-xs font-semibold text-slate-705">
                {adminSegments.map((s) => (
                  <div key={s.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                      <span className="text-slate-650 truncate max-w-[110px]" title={s.name}>{s.name}</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-500 font-medium">
                      <span className="text-slate-800 font-extrabold">{s.percentage}%</span>
                      <span>({s.count})</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Link to="/documents" className="text-xs text-blue-600 hover:text-blue-800 font-extrabold flex items-center gap-1.5 mt-4 pt-3 border-t border-slate-100">
              <span>View full report</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Recent System Activity */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
            <SectionHeader
              title="Recent System Activity"
              actionText="View all"
              actionTo="/users"
            />
            
            <div className="space-y-4">
              {metrics?.recent_activity && metrics.recent_activity.length > 0 ? (
                metrics.recent_activity.slice(0, 5).map((act: any, idx: number) => {
                  const initials = act.user_name?.slice(0, 2).toUpperCase() || 'SY';
                  return (
                    <div key={idx} className="flex items-center gap-3 text-xs p-0.5">
                      <div className="w-8 h-8 rounded-full bg-blue-100 border border-slate-200 flex items-center justify-center text-[10px] font-extrabold text-blue-700 shrink-0">
                        {initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-slate-655 leading-normal text-[11px] font-semibold">
                          <strong className="text-slate-800 font-extrabold">
                            {act.type === 'upload' ? 'Uploaded:' : act.type === 'edit' ? 'Edited:' : 'Approved:'}
                          </strong>{' '}
                          {act.document_name}{' '}
                          <span className="text-slate-400 font-medium">by {act.user_name}</span>
                        </p>
                        <span className="text-[9.5px] text-slate-400 font-bold block mt-0.5">{formatRelativeTime(act.timestamp)}</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-6 text-xs text-slate-400 italic">No activity logged.</div>
              )}
            </div>
          </div>

        </div>

        {/* ROW 2: Recent Documents, Department Wise Users, AI Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          
          {/* Recent Documents Table */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
            <SectionHeader
              title="Recent Documents"
              actionText="View all"
              actionTo="/documents"
            />
            
            <DataTable
              rows={adminRecentDocs}
              getFileTypeIcon={getFileTypeIcon}
              onActionClick={handleDocumentActionClick}
              onRowClick={(row) => window.open(`/documents/${row.id}`, '_blank')}
            />

            <Link to="/documents" className="text-xs text-blue-600 hover:text-blue-800 font-extrabold flex items-center gap-1.5 mt-4 pt-3 border-t border-slate-100">
              <span>Go to documents</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Department Wise Users */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
            <SectionHeader
              title="Department Wise Users"
              actionText="View all"
              actionTo="/users"
            />
            
            <DepartmentProgressList />
          </div>

          {/* AI Insights stack */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
            <SectionHeader
              title="AI Insights"
              icon={<Sparkles className="w-4.5 h-4.5 text-blue-600" />}
              actionText="View all"
              actionTo="/settings"
            />
            
            <div className="space-y-3.5 text-xs font-semibold text-slate-700">
              {metrics?.most_viewed_documents && metrics.most_viewed_documents.length > 0 ? (
                metrics.most_viewed_documents.slice(0, 3).map((doc: any, idx: number) => {
                  const icons = [FileText, TrendingUp, AlertCircle];
                  const colors = [
                    'bg-emerald-50 text-emerald-600 border-emerald-100',
                    'bg-blue-50 text-blue-650 border-blue-100',
                    'bg-amber-50 text-amber-600 border-amber-100'
                  ];
                  const Icon = icons[idx % icons.length];
                  return (
                    <div key={doc.id} className={`flex gap-3 items-start p-3 rounded-xl border ${colors[idx % colors.length]}`}>
                      <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center shrink-0 border">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-slate-700 leading-normal text-[11px] truncate">
                          <strong>“{doc.name}”</strong> is highly active.
                        </p>
                        <button type="button" onClick={() => window.open(`/documents/${doc.id}`, '_blank')} className="text-[9.5px] text-blue-600 hover:text-blue-800 font-extrabold mt-1.5 flex items-center gap-0.5">
                          View details &rarr;
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-6 text-xs text-slate-450 italic">No AI insights generated.</div>
              )}
            </div>
          </div>

        </div>

      </div>
    );
  }

  // 2. MANAGER DASHBOARD VIEW
  if (isManager) {
    const managerKpis = [
      {
        title: 'Total Documents',
        value: metricsLoading ? '...' : (metrics?.total_documents ?? 0),
        description: `${metrics?.recent_uploads_count ?? 0} uploaded recently`,
        icon: FileText,
        iconBgColor: 'bg-blue-50',
        iconColor: 'text-blue-600',
        linkText: 'View all documents',
        linkTo: '/documents'
      },
      {
        title: 'Team Members',
        value: metricsLoading ? '...' : (metrics?.active_users_count ?? 0),
        description: 'Active users',
        icon: Users,
        iconBgColor: 'bg-emerald-50',
        iconColor: 'text-emerald-600',
        linkText: 'View team',
        linkTo: '/users'
      },
      {
        title: 'Pending Approvals',
        value: metricsLoading ? '...' : (metrics?.pending_approvals_count ?? 0),
        description: 'Awaiting your approval',
        icon: CheckSquare,
        iconBgColor: 'bg-amber-50',
        iconColor: 'text-amber-600',
        linkText: 'Review approvals',
        linkTo: '/approvals'
      },
      {
        title: 'Recent Uploads',
        value: metricsLoading ? '...' : (metrics?.recent_uploads_count ?? 0),
        description: 'Recent activity',
        icon: Cloud,
        iconBgColor: 'bg-blue-50',
        iconColor: 'text-blue-600',
        linkText: 'View uploads',
        linkTo: '/documents'
      }
    ];

    const managerRecentDocs: DataRow[] = metrics?.recent_uploads
      ? docsToRows(metrics.recent_uploads)
      : [];

    return (
      <div className="space-y-7 max-w-7xl mx-auto font-sans text-slate-800 pb-12 select-none">
        
        {/* Banner Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 select-none">
          <div className="space-y-1">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              Welcome back, {userName}! <span className="text-amber-500">👋</span>
            </h1>
            <p className="text-slate-500 text-xs font-semibold">Here's an overview of your team and department.</p>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRefreshAll}
              title="Refresh dashboard"
              className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-400 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.02)] text-xs font-bold text-slate-650 shrink-0">
              <Calendar className="w-4 h-4 text-slate-455" />
              <span>{formattedDate}</span>
            </div>
          </div>
        </div>

        {/* KPI metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {managerKpis.map((kpi, idx) => (
            <KPICard
              key={idx}
              title={kpi.title}
              value={kpi.value}
              description={kpi.description}
              icon={kpi.icon}
              iconBgColor={kpi.iconBgColor}
              iconColor={kpi.iconColor}
              linkText={kpi.linkText}
              linkTo={kpi.linkTo}
            />
          ))}
        </div>

        {/* THREE COLUMN GRID BODY */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* COLUMN 1: Pending Approvals & Recent Documents */}
          <div className="space-y-6">
            
            {/* Pending Approvals priority items */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
              <SectionHeader
                title="Pending Approvals"
                actionText="View all"
                actionTo="/approvals"
              />
              
              <div className="space-y-3.5">
                {pendingDocs && pendingDocs.length > 0 ? (
                  pendingDocs.slice(0, 4).map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center p-2.5 bg-slate-50/50 border border-slate-150/60 rounded-xl hover:border-slate-300 transition-colors">
                      <div className="min-w-0 flex-1 mr-2">
                        <span className="font-extrabold text-xs text-slate-800 block truncate" title={item.name}>{item.name}</span>
                        <span className="text-[10px] text-slate-455 font-medium block mt-0.5 truncate">Requested by {item.owner?.full_name || 'Owner'} &bull; {formatRelativeTime(item.created_at)}</span>
                      </div>
                      
                      <span className={`px-2 py-0.5 rounded border text-[8.5px] font-extrabold uppercase tracking-wider bg-amber-50 text-amber-700 border-amber-100 shrink-0`}>
                        Pending
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-xs text-slate-450 italic">No pending documents for approval.</div>
                )}
              </div>

              <Link to="/approvals" className="text-xs text-blue-600 hover:text-blue-800 font-extrabold flex items-center gap-1.5 mt-4 pt-3 border-t border-slate-100">
                <span>Go to approval center</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Recent Documents Table */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
              <SectionHeader
                title="Recent Documents"
                actionText="View all"
                actionTo="/documents"
              />
              
              <DataTable
                rows={managerRecentDocs}
                getFileTypeIcon={getFileTypeIcon}
                onActionClick={handleDocumentActionClick}
                onRowClick={(row) => window.open(`/documents/${row.id}`, '_blank')}
              />

              <Link to="/documents" className="text-xs text-blue-600 hover:text-blue-800 font-extrabold flex items-center gap-1.5 mt-4 pt-3 border-t border-slate-100">
                <span>Go to documents</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

          </div>

          {/* COLUMN 2: Team Activity & My Tasks */}
          <div className="space-y-6">
            
            {/* Team Activity Logs Feed */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
              <SectionHeader
                title="Team Activity"
                actionText="View all"
                actionTo="/documents"
              />
              
              <div className="space-y-4">
                {metrics?.recent_activity && metrics.recent_activity.length > 0 ? (
                  metrics.recent_activity.slice(0, 5).map((act: any, idx: number) => {
                    const initials = act.user_name?.slice(0, 2).toUpperCase() || 'SY';
                    return (
                      <div key={idx} className="flex items-center gap-3 text-xs p-0.5">
                        <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 text-[10px] font-extrabold text-slate-700 select-none">
                          {initials}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-slate-655 leading-normal text-[11px] font-semibold">
                            <strong className="text-slate-800 font-extrabold">{act.user_name}</strong> {act.type === 'upload' ? 'uploaded' : act.type === 'edit' ? 'edited' : 'approved'} "{act.document_name}"
                          </p>
                          <span className="text-[9.5px] text-slate-400 font-bold block mt-0.5">{formatRelativeTime(act.timestamp)}</span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-6 text-xs text-slate-455 italic">No team activity logged.</div>
                )}
              </div>

              <Link to="/documents" className="text-xs text-blue-600 hover:text-blue-800 font-extrabold flex items-center gap-1.5 mt-4 pt-3 border-t border-slate-100">
                <span>View team activity</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* My Tasks lists */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
              <SectionHeader
                title="My Tasks"
                actionText="View all"
                actionTo="/settings"
              />
              
              <div className="space-y-3">
                {employeeTasks.map(task => (
                  <div 
                    key={task.id}
                    onClick={() => toggleTask(task.id)}
                    className={`p-3.5 bg-white border border-slate-200/80 rounded-xl flex items-start justify-between gap-3 cursor-pointer hover:border-slate-300 transition-all select-none ${
                      task.completed ? 'opacity-55' : ''
                    }`}
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <button type="button" className="text-slate-400 hover:text-blue-600 transition-colors shrink-0 mt-0.5">
                        {task.completed ? (
                          <CheckSquare className="w-4.5 h-4.5 text-blue-600" />
                        ) : (
                          <Square className="w-4.5 h-4.5" />
                        )}
                      </button>
                      <span className={`text-[11.5px] font-bold leading-relaxed truncate ${
                        task.completed ? 'line-through text-slate-400' : 'text-slate-800'
                      }`}>
                        {task.text}
                      </span>
                    </div>
                    
                    <div className="flex flex-col items-end gap-1.5 shrink-0 ml-2">
                      <span className={`px-1.5 py-0.2 rounded border text-[8px] font-extrabold uppercase tracking-wider ${task.badgeStyle}`}>
                        {task.category}
                      </span>
                      <span className="text-[10px] text-red-500 font-extrabold whitespace-nowrap">
                        {task.date}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <Link to="/settings" className="text-xs text-blue-600 hover:text-blue-800 font-extrabold flex items-center gap-1.5 mt-4 pt-3 border-t border-slate-100">
                <span>Go to tasks</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

          </div>

          {/* COLUMN 3: Department Overview & AI Insights */}
          <div className="space-y-6">
            
            {/* Department Overview chart */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
              <SectionHeader
                title="Department Overview"
                actionText="View report"
                actionTo="/documents"
              />
              
              <DepartmentOverviewChart />

              <Link to="/documents" className="text-xs text-blue-600 hover:text-blue-800 font-extrabold flex items-center gap-1.5 mt-4 pt-3 border-t border-slate-100">
                <span>View department report</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* AI Insights Card list */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
              <SectionHeader
                title="AI Insights"
                icon={<Sparkles className="w-4.5 h-4.5 text-blue-600" />}
                rightElement={
                  <button 
                    type="button" 
                    onClick={handleRefreshAll}
                    className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-all"
                    title="Refresh Insights"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                }
              />
              
              <div className="space-y-3.5 text-xs font-semibold text-slate-700 select-none">
                {metrics?.most_viewed_documents && metrics.most_viewed_documents.length > 0 ? (
                  metrics.most_viewed_documents.slice(0, 3).map((doc: any, idx: number) => {
                    const icons = [FileText, TrendingUp, AlertCircle];
                    const colors = [
                      'bg-emerald-50 text-emerald-600 border-emerald-100',
                      'bg-blue-50 text-blue-650 border-blue-100',
                      'bg-amber-50 text-amber-600 border-amber-100'
                    ];
                    const Icon = icons[idx % icons.length];
                    return (
                      <div key={doc.id} className={`flex gap-3 items-start p-3 rounded-xl border ${colors[idx % colors.length]}`}>
                        <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center shrink-0 border">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-slate-700 leading-normal text-[11px] truncate">
                            <strong>“{doc.name}”</strong> is highly active.
                          </p>
                          <button type="button" onClick={() => window.open(`/documents/${doc.id}`, '_blank')} className="text-[9.5px] text-blue-600 hover:text-blue-800 font-extrabold mt-1.5 flex items-center gap-0.5">
                            View details &rarr;
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-6 text-xs text-slate-450 italic">No AI insights generated.</div>
                )}
              </div>
            </div>

          </div>

        </div>

      </div>
    );
  }

  // 2. EMPLOYEE DASHBOARD VIEW (Default layout, name set to Riwitika Gupta)
  return (
    <div className="space-y-7 max-w-7xl mx-auto font-sans text-slate-800 pb-12 select-none">
      
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 select-none">
        <div className="space-y-1">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            Good morning, {userName}! <span className="animate-bounce">👋</span>
          </h1>
          <p className="text-slate-500 text-xs font-semibold">Here's what's happening in your workspace today.</p>
        </div>
        
        {/* Date Display */}
        <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.02)] text-xs font-bold text-slate-650 shrink-0">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span>{formattedDate}</span>
        </div>
      </div>

      {/* KPI METRICS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { title: 'My Documents', value: metricsLoading ? '...' : (metrics?.total_documents ?? 0), description: 'Total documents', icon: FileText, iconBgColor: 'bg-blue-50', iconColor: 'text-blue-600', linkText: 'View all', linkTo: '/documents' },
          { title: 'Shared with me', value: metricsLoading ? '...' : (metrics?.public_documents_count ?? 0), description: 'Documents', icon: Users, iconBgColor: 'bg-emerald-50', iconColor: 'text-emerald-600', linkText: 'View all', linkTo: '/documents' },
          { title: 'Pending Tasks', value: metricsLoading ? '...' : (metrics?.pending_approvals_count ?? 0), description: 'Tasks awaiting action', icon: ClipboardList, iconBgColor: 'bg-amber-50', iconColor: 'text-amber-600', linkText: 'View tasks', linkTo: '/settings' },
          { title: 'Storage Used', value: metricsLoading ? '...' : `${((metrics?.total_documents ?? 0) * 1.5).toFixed(1)} MB`, description: 'Estimated storage', icon: Cloud, iconBgColor: 'bg-purple-50', iconColor: 'text-purple-600', linkText: 'View storage', linkTo: '/settings' }
        ].map((kpi, idx) => (
          <KPICard
            key={idx}
            title={kpi.title}
            value={kpi.value}
            description={kpi.description}
            icon={kpi.icon}
            iconBgColor={kpi.iconBgColor}
            iconColor={kpi.iconColor}
            linkText={kpi.linkText}
            linkTo={kpi.linkTo}
          />
        ))}
      </div>

      {/* TWO-COLUMN CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: Recent Documents & AI Suggestions (Wide) */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
            <SectionHeader
              title="Recent Documents"
              actionText="View all"
              actionTo="/documents"
            />
            
            <DataTable
              rows={metrics?.recent_uploads ? docsToRows(metrics.recent_uploads) : []}
              getFileTypeIcon={getFileTypeIcon}
              onActionClick={handleDocumentActionClick}
              onRowClick={(row) => window.open(`/documents/${row.id}`, '_blank')}
            />
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
            <SectionHeader
              title="AI Suggestions"
              icon={<Sparkles className="w-4.5 h-4.5 text-blue-600" />}
              rightElement={
                <button 
                  type="button" 
                  onClick={handleRefreshAll}
                  className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-all"
                  title="Refresh Suggestions"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              }
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {metrics?.most_viewed_documents && metrics.most_viewed_documents.length > 0 ? (
                metrics.most_viewed_documents.slice(0, 3).map((doc: any, idx: number) => {
                  const colors = [
                    { bg: 'bg-blue-50 text-blue-600 border-blue-100', icon: FileText, actionText: 'Ask AI', promptText: `Please summarize the ${doc.name} document.` },
                    { bg: 'bg-emerald-50 text-emerald-600 border-emerald-100', icon: FolderClosed, actionText: 'Open File', promptText: 'open' },
                    { bg: 'bg-purple-50 text-purple-600 border-purple-100', icon: Sparkles, actionText: 'Summarize', promptText: `Please explain the key takeaways from the document ${doc.name}.` }
                  ];
                  const scheme = colors[idx % colors.length];
                  const Icon = scheme.icon;
                  return (
                    <div key={doc.id} className="bg-slate-50/50 border border-slate-150/60 rounded-xl p-4 flex flex-col justify-between hover:border-slate-300 hover:bg-slate-50 transition-all select-none">
                      <div className="min-w-0">
                        <div className={`w-8.5 h-8.5 rounded-lg flex items-center justify-center border mb-3 ${scheme.bg}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <p className="text-[11.5px] font-bold text-slate-800 leading-normal mb-2 line-clamp-2" title={doc.name}>
                          "{doc.name}" is highly active in your division.
                        </p>
                      </div>
                      <button 
                        type="button"
                        onClick={() => {
                          if (scheme.promptText === 'open') {
                            window.open(`/documents/${doc.id}`, '_blank');
                          } else {
                            const event = new CustomEvent('trigger-floating-ai', { detail: scheme.promptText });
                            window.dispatchEvent(event);
                          }
                        }}
                        className="text-[10px] text-blue-600 hover:text-blue-800 font-extrabold flex items-center gap-1.5 transition-colors self-start mt-2"
                      >
                        {scheme.actionText} &rarr;
                      </button>
                    </div>
                  );
                })
              ) : (
                [
                  { title: 'Explore your files', desc: 'Query your documents using the AI chatbot.', link: '/documents', action: 'Go to Documents' },
                  { title: 'Learn from policies', desc: 'Get summaries of HR and operations guidelines.', link: '/documents', action: 'View Guidelines' },
                  { title: 'RAG Search', desc: 'Ask complex budget and data queries.', link: '/search', action: 'Search Docs' }
                ].map((s, idx) => (
                  <div key={idx} className="bg-slate-50/50 border border-slate-150/60 rounded-xl p-4 flex flex-col justify-between hover:border-slate-300 hover:bg-slate-50 transition-all select-none">
                    <div>
                      <div className="w-8.5 h-8.5 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 mb-3">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <p className="text-[11.5px] font-bold text-slate-800 leading-normal mb-1">{s.title}</p>
                      <p className="text-[10.5px] text-slate-500 font-medium leading-normal mb-2">{s.desc}</p>
                    </div>
                    <Link to={s.link} className="text-[10px] text-blue-600 hover:text-blue-800 font-extrabold flex items-center gap-1.5 transition-colors self-start mt-2">
                      {s.action} &rarr;
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Tasks & Activity (Narrow) */}
        <div className="space-y-6">
          
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
            <SectionHeader
              title="My Tasks"
              actionText="View all"
              actionTo="/settings"
            />
            
            <div className="space-y-3">
              {employeeTasks.map(task => (
                <div 
                  key={task.id}
                  onClick={() => toggleTask(task.id)}
                  className={`p-3.5 bg-white border border-slate-200/80 rounded-xl flex items-start justify-between gap-3 cursor-pointer hover:border-slate-300 transition-all select-none ${
                    task.completed ? 'opacity-55' : ''
                  }`}
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <button type="button" className="text-slate-400 hover:text-blue-600 transition-colors shrink-0 mt-0.5">
                      {task.completed ? (
                        <CheckSquare className="w-4.5 h-4.5 text-blue-600" />
                      ) : (
                        <Square className="w-4.5 h-4.5" />
                      )}
                    </button>
                    <span className={`text-[11.5px] font-bold leading-relaxed truncate ${
                      task.completed ? 'line-through text-slate-400' : 'text-slate-800'
                    }`}>
                      {task.text}
                    </span>
                  </div>
                  
                  <div className="flex flex-col items-end gap-1.5 shrink-0 ml-2">
                    <span className={`px-1.5 py-0.2 rounded border text-[8px] font-extrabold uppercase tracking-wider ${task.badgeStyle}`}>
                      {task.category}
                    </span>
                    <span className="text-[10px] text-red-500 font-extrabold whitespace-nowrap">
                      {task.date}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
            <SectionHeader
              title="Shared with me"
              actionText="View all"
              actionTo="/documents"
            />
            
            <div className="space-y-3.5">
              {metrics?.recent_activity && metrics.recent_activity.length > 0 ? (
                metrics.recent_activity.slice(0, 3).map((act: any, idx: number) => {
                  const initials = act.user_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'SY';
                  return (
                    <div key={idx} className="flex items-center gap-3 text-xs p-1">
                      <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 text-[10px] font-extrabold text-slate-700 select-none">
                        {initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-slate-650 leading-normal text-[11px]">
                          <span className="font-extrabold text-slate-850">{act.user_name}</span> {act.type === 'upload' ? 'uploaded' : 'edited'} "{act.document_name}"
                        </p>
                        <span className="text-[9px] text-slate-400 font-bold block mt-0.5 select-none">{formatRelativeTime(act.timestamp)}</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-4 text-xs text-slate-400 italic">No recent activity logged.</div>
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
