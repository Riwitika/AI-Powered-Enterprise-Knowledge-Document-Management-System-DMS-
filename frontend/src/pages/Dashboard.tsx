import React, { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { 
  FileText, 
  Users, 
  Clock, 
  Cloud, 
  Sparkles,
  RefreshCw,
  FolderClosed,
  Calendar,
  ClipboardList,
  CheckSquare,
  Square
} from 'lucide-react';
import KPICard from '../components/KPICard';
import SectionHeader from '../components/SectionHeader';
import DataTable, { DataRow } from '../components/DataTable';

export default function Dashboard() {
  const { user } = useAuthStore();
  const userName = user?.full_name?.split(' ')[0] || 'Riwitika';

  // Task list checked state for interactive dashboard feel
  const [tasks, setTasks] = useState([
    { id: 1, text: 'Review & approve Q2 budget report', category: 'Review', date: '20 May', completed: false, badgeStyle: 'bg-indigo-50 text-indigo-750 border-indigo-150' },
    { id: 2, text: 'Complete employee handbook update', category: 'Update', date: '21 May', completed: false, badgeStyle: 'bg-blue-50 text-blue-750 border-blue-150' },
    { id: 3, text: 'Verify vendor KYC documents', category: 'Verification', date: '22 May', completed: false, badgeStyle: 'bg-amber-50 text-amber-750 border-amber-150' }
  ]);

  const toggleTask = (id: number) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  // Format date dynamically: e.g. "Monday, 19 May 2026"
  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // KPI card configuration
  const kpis = [
    {
      title: 'My Documents',
      value: 128,
      description: 'Total documents',
      icon: FileText,
      iconBgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      linkText: 'View all',
      linkTo: '/documents'
    },
    {
      title: 'Shared with me',
      value: 36,
      description: 'Documents',
      icon: Users,
      iconBgColor: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      linkText: 'View all',
      linkTo: '/documents'
    },
    {
      title: 'Pending Tasks',
      value: 8,
      description: 'Tasks awaiting action',
      icon: ClipboardList,
      iconBgColor: 'bg-amber-50',
      iconColor: 'text-amber-600',
      linkText: 'View tasks',
      linkTo: '/settings'
    },
    {
      title: 'Storage Used',
      value: '2.45 GB',
      description: 'of 10 GB',
      icon: Cloud,
      iconBgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
      linkText: 'View storage',
      linkTo: '/settings'
    }
  ];

  // Mock document rows
  const documentRows: DataRow[] = [
    {
      id: 'doc-1',
      name: 'Project Proposal - Q2.docx',
      category: 'Documents / Projects',
      timestamp: 'Today, 10:30 AM',
      fileType: 'docx',
      badgeText: 'Word',
      badgeStyle: 'bg-blue-50 text-blue-600 border-blue-150'
    },
    {
      id: 'doc-2',
      name: 'Company Policy Manual.pdf',
      category: 'HR / Policies',
      timestamp: 'Yesterday, 4:15 PM',
      fileType: 'pdf',
      badgeText: 'PDF',
      badgeStyle: 'bg-red-50 text-red-600 border-red-150'
    },
    {
      id: 'doc-3',
      name: 'Budget Report - May.xlsx',
      category: 'Finance / Reports',
      timestamp: 'Yesterday, 11:20 AM',
      fileType: 'xlsx',
      badgeText: 'Excel',
      badgeStyle: 'bg-emerald-50 text-emerald-600 border-emerald-150'
    },
    {
      id: 'doc-4',
      name: 'Product Roadmap.pptx',
      category: 'Documents / Presentations',
      timestamp: '17 May 2024',
      fileType: 'pptx',
      badgeText: 'PPT',
      badgeStyle: 'bg-orange-50 text-orange-600 border-orange-150'
    },
    {
      id: 'doc-5',
      name: 'Client Meeting Notes.docx',
      category: 'Meetings / Notes',
      timestamp: '17 May 2024',
      fileType: 'docx',
      badgeText: 'Word',
      badgeStyle: 'bg-blue-50 text-blue-600 border-blue-150'
    }
  ];

  // Helper icons mapping
  const getFileTypeIcon = (type?: string) => {
    const className = "w-8.5 h-8.5 shrink-0 rounded-lg flex items-center justify-center font-bold text-xs select-none border";
    switch (type) {
      case 'docx':
        return <div className={`${className} bg-blue-50 text-blue-600 border-blue-100`}>W</div>;
      case 'pdf':
        return <div className={`${className} bg-red-50 text-red-600 border-red-100`}>P</div>;
      case 'xlsx':
        return <div className={`${className} bg-emerald-50 text-emerald-600 border-emerald-100`}>X</div>;
      case 'pptx':
        return <div className={`${className} bg-orange-50 text-orange-600 border-orange-100`}>P</div>;
      default:
        return <div className={`${className} bg-slate-50 text-slate-500 border-slate-200`}>D</div>;
    }
  };

  const handleDocumentActionClick = (row: DataRow, e: React.MouseEvent) => {
    alert(`Mock operations for "${row.name}" triggered.`);
  };

  return (
    <div className="space-y-7 max-w-7xl mx-auto font-sans text-slate-800 pb-12">
      
      {/* 1. WELCOME BANNER HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 select-none">
        <div className="space-y-1">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            Good morning, {userName}! <span className="animate-bounce">👋</span>
          </h1>
          <p className="text-slate-500 text-xs font-semibold">Here's what's happening in your workspace today.</p>
        </div>
        
        {/* Date Display */}
        <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.02)] text-xs font-bold text-slate-600 shrink-0">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span>{formattedDate}</span>
        </div>
      </div>

      {/* 2. KPI METRICS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpis.map((kpi, idx) => (
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

      {/* 3. TWO-COLUMN CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: Recent Documents & AI Suggestions (Wide) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Recent Documents Table Widget */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
            <SectionHeader
              title="Recent Documents"
              actionText="View all"
              actionTo="/documents"
            />
            
            <DataTable
              rows={documentRows}
              getFileTypeIcon={getFileTypeIcon}
              onActionClick={handleDocumentActionClick}
              onRowClick={(row) => alert(`Mock open file: "${row.name}"`)}
            />
          </div>

          {/* AI Suggestions Spark Grid */}
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
              
              {/* Suggestion 1 */}
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

              {/* Suggestion 2 */}
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

              {/* Suggestion 3 */}
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

        {/* RIGHT COLUMN: Tasks & Activities (Narrow) */}
        <div className="space-y-6">
          
          {/* Tasks Widget */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
            <SectionHeader
              title="My Tasks"
              actionText="View all"
              actionTo="/settings"
            />
            
            <div className="space-y-3">
              {tasks.map(task => (
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

          {/* Shared Activities Widget */}
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
                    <p className="text-slate-600 leading-normal text-[11px]">
                      <span className="font-extrabold text-slate-800">{act.name}</span> {act.text}
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
