import type React from 'react';
import { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  Users, 
  Cloud, 
  Sparkles,
  RefreshCw,
  FolderClosed,
  Calendar,
  ClipboardList,
  CheckSquare,
  Square,
  ArrowRight,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import KPICard from '../components/KPICard';
import SectionHeader from '../components/SectionHeader';
import DataTable from '../components/DataTable';
import type { DataRow } from '../components/DataTable';
import DepartmentOverviewChart from '../components/DepartmentOverviewChart';

export default function Dashboard() {
  const { user } = useAuthStore();
  const isManager = user?.role?.name === 'manager';
  
  // Use \"Riwitika Gupta\" as requested for Employee and Manager roles
  const userName = user?.full_name || (isManager ? 'Riwitika Gupta' : 'Riwitika Gupta');

  // Helper icons mapping
  const getFileTypeIcon = (type?: string) => {
    const className = "w-8.5 h-8.5 shrink-0 rounded-lg flex items-center justify-center font-bold text-xs select-none border";
    switch (type) {
      case 'docx':
        return <div className={`${className} bg-blue-50 text-blue-650 border-blue-100`}>W</div>;
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
    alert(`Mock operations for "${row.name}" triggered.`);
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

  // 1. MANAGER DASHBOARD VIEW
  if (isManager) {
    const managerKpis = [
      {
        title: 'Total Documents',
        value: '1,248',
        description: 'In your department',
        icon: FileText,
        iconBgColor: 'bg-blue-50',
        iconColor: 'text-blue-600',
        linkText: 'View all documents',
        linkTo: '/documents'
      },
      {
        title: 'Team Members',
        value: 18,
        description: 'Active users',
        icon: Users,
        iconBgColor: 'bg-emerald-50',
        iconColor: 'text-emerald-600',
        linkText: 'View team',
        linkTo: '/documents'
      },
      {
        title: 'Pending Approvals',
        value: 8,
        description: 'Awaiting your approval',
        icon: CheckSquare,
        iconBgColor: 'bg-amber-50',
        iconColor: 'text-amber-600',
        linkText: 'Review approvals',
        linkTo: '/settings'
      },
      {
        title: 'New Uploads',
        value: 42,
        description: 'This week',
        icon: Cloud,
        iconBgColor: 'bg-blue-50',
        iconColor: 'text-blue-600',
        linkText: 'View uploads',
        linkTo: '/documents'
      }
    ];

    // Mock recent documents for Manager
    const managerRecentDocs: DataRow[] = [
      {
        id: 'mr-1',
        name: 'Client Onboarding Process.docx',
        category: '/Sales & Marketing/Onboarding',
        timestamp: 'Today, 10:30 AM',
        fileType: 'docx',
        badgeText: 'Word',
        badgeStyle: 'bg-blue-50 text-blue-600 border-blue-150',
        ownerAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'
      },
      {
        id: 'mr-2',
        name: 'Sales Report - April.xlsx',
        category: '/Sales & Marketing/Reports',
        timestamp: 'Today, 09:15 AM',
        fileType: 'xlsx',
        badgeText: 'Excel',
        badgeStyle: 'bg-emerald-50 text-emerald-600 border-emerald-150',
        ownerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'
      },
      {
        id: 'mr-3',
        name: 'Marketing Strategy.pdf',
        category: '/Sales & Marketing/Strategy',
        timestamp: 'Yesterday, 04:20 PM',
        fileType: 'pdf',
        badgeText: 'PDF',
        badgeStyle: 'bg-red-50 text-red-600 border-red-150',
        ownerAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150'
      },
      {
        id: 'mr-4',
        name: 'Product Roadmap.pptx',
        category: '/Sales & Marketing/Presentations',
        timestamp: 'Yesterday, 11:00 AM',
        fileType: 'pptx',
        badgeText: 'PPT',
        badgeStyle: 'bg-orange-50 text-orange-600 border-orange-150',
        ownerAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150'
      },
      {
        id: 'mr-5',
        name: 'Competitor Analysis.docx',
        category: '/Sales & Marketing/Research',
        timestamp: '17 May 2024',
        fileType: 'docx',
        badgeText: 'Word',
        badgeStyle: 'bg-blue-50 text-blue-600 border-blue-150',
        ownerAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150'
      }
    ];



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
          
          <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.02)] text-xs font-bold text-slate-650 shrink-0">
            <Calendar className="w-4 h-4 text-slate-455" />
            <span>{formattedDate}</span>
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
                actionTo="/settings"
              />
              
              <div className="space-y-3.5">
                {[
                  { name: 'Q2 Budget Report.pdf', requester: 'Amit Verma', time: '2h ago', priority: 'High', style: 'bg-red-50 text-red-650 border-red-100' },
                  { name: 'Vendor Agreement.docx', requester: 'Neha Gupta', time: '4h ago', priority: 'Medium', style: 'bg-amber-50 text-amber-700 border-amber-100' },
                  { name: 'Sales Forecast - May.xlsx', requester: 'Rohit Sharma', time: '1d ago', priority: 'Medium', style: 'bg-amber-50 text-amber-700 border-amber-100' },
                  { name: 'Marketing Plan.pptx', requester: 'Ritika Sharma', time: '1d ago', priority: 'Low', style: 'bg-green-50 text-green-700 border-green-100' }
                ].map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center p-2.5 bg-slate-50/50 border border-slate-150/60 rounded-xl hover:border-slate-300 transition-colors">
                    <div>
                      <span className="font-extrabold text-xs text-slate-800 block truncate max-w-[170px]">{item.name}</span>
                      <span className="text-[10px] text-slate-455 font-medium block mt-0.5">Requested by {item.requester} &bull; {item.time}</span>
                    </div>
                    
                    <span className={`px-2 py-0.5 rounded border text-[8.5px] font-extrabold uppercase tracking-wider ${item.style}`}>
                      {item.priority}
                    </span>
                  </div>
                ))}
              </div>

              <Link to="/settings" className="text-xs text-blue-600 hover:text-blue-800 font-extrabold flex items-center gap-1.5 mt-4 pt-3 border-t border-slate-100">
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
                onRowClick={(row) => alert(`Mock open file: "${row.name}"`)}
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
                {[
                  { name: 'Amit Verma', initials: 'AV', text: 'uploaded Sales Report - April.xlsx', time: '1h ago', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150' },
                  { name: 'Neha Gupta', initials: 'NG', text: 'uploaded Client Onboarding.docx', time: '3h ago', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150' },
                  { name: 'Rohit Sharma', initials: 'RS', text: 'updated Product Roadmap.pptx', time: '5h ago', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150' },
                  { name: 'Ritika Sharma', initials: 'RS', text: 'shared Marketing Strategy.pdf', time: '6h ago', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150' },
                  { name: 'Priya Mehta', initials: 'PM', text: 'uploaded Competitor Analysis.xlsx', time: '1d ago', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150' }
                ].map((act, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-xs p-0.5">
                    <img 
                      src={act.avatar} 
                      alt={act.name} 
                      className="w-8 h-8 rounded-full border border-slate-200 shrink-0 object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-slate-655 leading-normal text-[11px] font-semibold">
                        <strong className="text-slate-800 font-extrabold">{act.name}</strong> {act.text}
                      </p>
                      <span className="text-[9.5px] text-slate-400 font-bold block mt-0.5">{act.time}</span>
                    </div>
                  </div>
                ))}
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
                    onClick={() => alert('Refreshing AI Insights...')}
                    className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-all"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                }
              />
              
              <div className="space-y-3.5 text-xs font-semibold text-slate-700 select-none">
                
                {/* Insight 1 */}
                <div className="flex gap-3 items-start p-3 rounded-xl bg-emerald-50/50 border border-emerald-150/60">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-slate-700 leading-normal text-[11px]">
                      <strong>“Q2 Budget Report.pdf”</strong> requires your approval. Priority: High &bull; Requested 2h ago.
                    </p>
                    <button 
                      type="button" 
                      onClick={() => alert('Review budget clicked')}
                      className="text-[9.5px] text-blue-600 hover:text-blue-800 font-extrabold mt-1.5 flex items-center gap-0.5"
                    >
                      Review now &rarr;
                    </button>
                  </div>
                </div>

                {/* Insight 2 */}
                <div className="flex gap-3 items-start p-3 rounded-xl bg-blue-50/50 border border-blue-150/60">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-slate-700 leading-normal text-[11px]">
                      Team uploads increased by <strong>24%</strong> this week compared to last week.
                    </p>
                    <button 
                      type="button" 
                      onClick={() => alert('Analytics opened')}
                      className="text-[9.5px] text-blue-600 hover:text-blue-800 font-extrabold mt-1.5 flex items-center gap-0.5"
                    >
                      View analytics &rarr;
                    </button>
                  </div>
                </div>

                {/* Insight 3 */}
                <div className="flex gap-3 items-start p-3 rounded-xl bg-amber-50/40 border border-amber-150/60">
                  <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-slate-700 leading-normal text-[11px]">
                      <strong>5 documents</strong> are awaiting approvals.
                    </p>
                    <button 
                      type="button" 
                      onClick={() => alert('Approvals dashboard opened')}
                      className="text-[9.5px] text-blue-600 hover:text-blue-800 font-extrabold mt-1.5 flex items-center gap-0.5"
                    >
                      View approvals &rarr;
                    </button>
                  </div>
                </div>

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
          { title: 'My Documents', value: 128, description: 'Total documents', icon: FileText, iconBgColor: 'bg-blue-50', iconColor: 'text-blue-600', linkText: 'View all', linkTo: '/documents' },
          { title: 'Shared with me', value: 36, description: 'Documents', icon: Users, iconBgColor: 'bg-emerald-50', iconColor: 'text-emerald-600', linkText: 'View all', linkTo: '/documents' },
          { title: 'Pending Tasks', value: 8, description: 'Tasks awaiting action', icon: ClipboardList, iconBgColor: 'bg-amber-50', iconColor: 'text-amber-600', linkText: 'View tasks', linkTo: '/settings' },
          { title: 'Storage Used', value: '2.45 GB', description: 'of 10 GB', icon: Cloud, iconBgColor: 'bg-purple-50', iconColor: 'text-purple-600', linkText: 'View storage', linkTo: '/settings' }
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
              rows={[
                { id: 'doc-1', name: 'Project Proposal - Q2.docx', category: 'Documents / Projects', timestamp: 'Today, 10:30 AM', fileType: 'docx', badgeText: 'Word', badgeStyle: 'bg-blue-50 text-blue-600 border-blue-150' },
                { id: 'doc-2', name: 'Company Policy Manual.pdf', category: 'HR / Policies', timestamp: 'Yesterday, 4:15 PM', fileType: 'pdf', badgeText: 'PDF', badgeStyle: 'bg-red-50 text-red-650 border-red-150' },
                { id: 'doc-3', name: 'Budget Report - May.xlsx', category: 'Finance / Reports', timestamp: 'Yesterday, 11:20 AM', fileType: 'xlsx', badgeText: 'Excel', badgeStyle: 'bg-emerald-50 text-emerald-655 border-emerald-150' },
                { id: 'doc-4', name: 'Product Roadmap.pptx', category: 'Documents / Presentations', timestamp: '17 May 2024', fileType: 'pptx', badgeText: 'PPT', badgeStyle: 'bg-orange-50 text-orange-600 border-orange-150' },
                { id: 'doc-5', name: 'Client Meeting Notes.docx', category: 'Meetings / Notes', timestamp: '17 May 2024', fileType: 'docx', badgeText: 'Word', badgeStyle: 'bg-blue-50 text-blue-600 border-blue-150' }
              ]}
              getFileTypeIcon={getFileTypeIcon}
              onActionClick={handleDocumentActionClick}
              onRowClick={(row) => alert(`Mock open file: "${row.name}"`)}
            />
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
            <SectionHeader
              title="AI Suggestions"
              icon={<Sparkles className="w-4.5 h-4.5 text-blue-600" />}
              rightElement={
                <button 
                  type="button" 
                  onClick={() => alert('Refreshing AI Suggestions...')}
                  className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-all"
                  title="Refresh Suggestions"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              }
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              <div className="bg-slate-50/50 border border-slate-150/60 rounded-xl p-4 flex flex-col justify-between hover:border-slate-300 hover:bg-slate-50 transition-all select-none">
                <div>
                  <div className="w-8.5 h-8.5 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 mb-3">
                    <FileText className="w-4 h-4" />
                  </div>
                  <p className="text-[11.5px] font-bold text-slate-800 leading-normal mb-2">
                    “Q2 Budget Report” seems pending for review.
                  </p>
                </div>
                <button 
                  type="button"
                  onClick={() => alert('Mock review flow started')}
                  className="text-[10px] text-blue-600 hover:text-blue-800 font-extrabold flex items-center gap-1.5 transition-colors self-start mt-2"
                >
                  Review now &rarr;
                </button>
              </div>

              <div className="bg-slate-50/50 border border-slate-150/60 rounded-xl p-4 flex flex-col justify-between hover:border-slate-300 hover:bg-slate-50 transition-all select-none">
                <div>
                  <div className="w-8.5 h-8.5 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 mb-3">
                    <FolderClosed className="w-4 h-4" />
                  </div>
                  <p className="text-[11.5px] font-bold text-slate-800 leading-normal mb-2">
                    You frequently open files from the Finance folder.
                  </p>
                </div>
                <button 
                  type="button"
                  onClick={() => alert('Redirecting to finance folder')}
                  className="text-[10px] text-blue-600 hover:text-blue-800 font-extrabold flex items-center gap-1.5 transition-colors self-start mt-2"
                >
                  Go to Finance &rarr;
                </button>
              </div>

              <div className="bg-slate-50/50 border border-slate-150/60 rounded-xl p-4 flex flex-col justify-between hover:border-slate-300 hover:bg-slate-50 transition-all select-none">
                <div>
                  <div className="w-8.5 h-8.5 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100 mb-3">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <p className="text-[11.5px] font-bold text-slate-800 leading-normal mb-2">
                    Summarize “Company Policy Manual”?
                  </p>
                </div>
                <button 
                  type="button"
                  onClick={() => {
                    const event = new CustomEvent('trigger-floating-ai', { detail: 'Please summarize the Company Policy Manual document.' });
                    window.dispatchEvent(event);
                  }}
                  className="text-[10px] text-blue-600 hover:text-blue-800 font-extrabold flex items-center gap-1.5 transition-colors self-start mt-2"
                >
                  Summarize &rarr;
                </button>
              </div>

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
              {[
                { name: 'Amit Verma', initials: 'AV', text: 'shared "Sales Report - April.xlsx"', time: '5h ago' },
                { name: 'Ritika Sharma', initials: 'RS', text: 'shared "Marketing Strategy.pdf"', time: '2h ago' },
                { name: 'Neha Gupta', initials: 'NG', text: 'shared "Client Onboarding Process.docx"', time: '1d ago' }
              ].map((act, idx) => (
                <div key={idx} className="flex items-center gap-3 text-xs p-1">
                  <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 text-[10px] font-extrabold text-slate-700 select-none">
                    {act.initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-slate-650 leading-normal text-[11px]">
                      <span className="font-extrabold text-slate-850">{act.name}</span> {act.text}
                    </p>
                    <span className="text-[9px] text-slate-400 font-bold block mt-0.5 select-none">{act.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
