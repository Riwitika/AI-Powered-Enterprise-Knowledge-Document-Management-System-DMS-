import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { 
  Search as SearchIcon, 
  Tag, 
  FolderGit2, 
  Filter, 
  FileText,
  Calendar,
  Layers,
  ChevronRight,
  HelpCircle,
  Loader2
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Search() {
  const [q, setQ] = useState('');
  const [tag, setTag] = useState('');
  const [category, setCategory] = useState('');
  const [deptId, setDeptId] = useState<number | ''>('');

  // Fetch departments for filter dropdown
  const { data: departments } = useQuery({
    queryKey: ['departments-list-search'],
    queryFn: api.departments.list
  });

  // Fetch search results
  const { data: results, isLoading, refetch } = useQuery({
    queryKey: ['search-results', q, tag, category, deptId],
    queryFn: () => api.search.find({
      q: q || undefined,
      tag: tag || undefined,
      category: category || undefined,
      department_id: deptId !== '' ? Number(deptId) : undefined
    }),
    enabled: true // Always call immediately to display all accessible documents initially
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    refetch();
  };

  const handleClear = () => {
    setQ('');
    setTag('');
    setCategory('');
    setDeptId('');
  };

  // Helper to color file type labels
  const getFileTypeColor = (type: string) => {
    const t = type.toLowerCase();
    if (t === 'pdf') return 'bg-red-500/15 text-red-400 border-red-500/25';
    if (['doc', 'docx'].includes(t)) return 'bg-blue-500/15 text-blue-400 border-blue-500/25';
    if (['xls', 'xlsx', 'csv'].includes(t)) return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25';
    if (['ppt', 'pptx'].includes(t)) return 'bg-orange-500/15 text-orange-400 border-orange-500/25';
    if (['js', 'ts', 'py', 'json', 'html', 'css'].includes(t)) return 'bg-purple-500/15 text-purple-400 border-purple-500/25';
    return 'bg-slate-500/15 text-slate-400 border-slate-500/25';
  };

  const getAccessLevelColor = (level: string) => {
    const l = level.toLowerCase();
    if (l === 'private') return 'bg-red-500/10 text-red-300 border-red-500/20';
    if (l === 'department') return 'bg-amber-500/10 text-amber-300 border-amber-500/20';
    if (l === 'view_only') return 'bg-blue-500/10 text-blue-300 border-blue-500/20';
    return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20';
  };

  return (
    <div className="space-y-6 relative">
      <div className="glow-spot-indigo top-[10%] left-[10%]" />
      
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white">Knowledge Search</h1>
        <p className="text-slate-400 text-xs mt-1">Sift through company wisdom, filter index parameters, and identify files semantically.</p>
      </div>

      {/* Filter and Search Form */}
      <form onSubmit={handleSearch} className="glass-card rounded-2xl p-5 space-y-4">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3.5 top-3 h-4 w-4 text-slate-600" />
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by keywords, tags, category, department policies..."
              className="w-full bg-[#0a0f1d] border border-slate-800/40 rounded-xl pl-10 pr-4 py-2.5 text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-200 placeholder-slate-600"
            />
          </div>
          <button
            type="submit"
            className="glow-btn rounded-xl bg-indigo-600 hover:bg-indigo-700 px-6 py-2.5 text-xs font-extrabold text-white transition-all shadow-md"
          >
            Search
          </button>
        </div>

        {/* Advanced Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-3.5 border-t border-slate-800/40">
          <div>
            <label className="text-[10px] font-bold text-slate-500 block mb-1.5 uppercase tracking-wider">Filter by Tag</label>
            <div className="relative">
              <Tag className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-600" />
              <input
                type="text"
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                placeholder="sop, draft..."
                className="w-full bg-[#0a0f1d] border border-slate-800/40 rounded-lg pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-indigo-500 text-slate-300 placeholder-slate-600"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 block mb-1.5 uppercase tracking-wider">Filter by Category</label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Manual, Contract, Policy..."
              className="w-full bg-[#0a0f1d] border border-slate-800/40 rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:border-indigo-500 text-slate-300 placeholder-slate-600"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 block mb-1.5 uppercase tracking-wider">Department Division</label>
            <select
              value={deptId}
              onChange={(e) => setDeptId(e.target.value !== '' ? Number(e.target.value) : '')}
              className="w-full bg-[#0a0f1d] border border-slate-800/40 rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:border-indigo-500 text-slate-300"
            >
              <option value="">All Departments</option>
              {departments?.map((d: any) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={handleClear}
              className="w-full border border-slate-800 hover:border-slate-700 bg-slate-900/30 hover:bg-slate-900/60 rounded-lg py-2.5 text-xs font-bold text-slate-400 hover:text-slate-200 transition-colors"
            >
              Reset All Filters
            </button>
          </div>
        </div>
      </form>

      {/* Results Container */}
      <div className="glass-card rounded-2xl overflow-hidden shadow-xl flex flex-col">
        <div className="bg-slate-950/20 border-b border-slate-800/40 p-4 flex items-center gap-2">
          <Filter className="h-4.5 w-4.5 text-indigo-400" />
          <h2 className="font-extrabold text-slate-200 text-xs uppercase tracking-wider">Filtered Inventory</h2>
          {results && (
            <span className="ml-auto rounded-full bg-slate-800 border border-slate-700/30 px-2.5 py-0.5 text-[10px] font-bold text-slate-400">
              {results.length} files matched
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="p-12 text-center space-y-2">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-500 mx-auto" />
            <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">Quering index database...</span>
          </div>
        ) : results && results.length > 0 ? (
          <div className="divide-y divide-slate-800/30">
            {results.map((doc: any) => (
              <div key={doc.id} className="p-4 hover:bg-slate-800/20 flex items-start justify-between transition-colors">
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex items-center gap-2.5">
                    <FileText className="h-4.5 w-4.5 text-indigo-400 shrink-0" />
                    <Link 
                      to={`/documents/${doc.id}`}
                      className="font-extrabold text-slate-200 text-xs hover:text-indigo-400 transition-colors truncate"
                    >
                      {doc.name}
                    </Link>
                    <span className={`px-1.5 py-0.5 rounded border text-[8px] font-bold uppercase tracking-wider ${getFileTypeColor(doc.file_type)}`}>
                      {doc.file_type}
                    </span>
                  </div>
                  
                  {doc.ai_summary && (
                    <p className="text-xs text-slate-400 leading-relaxed pl-7">
                      {doc.ai_summary}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-500 font-bold uppercase tracking-wider pl-7">
                    <span className="flex items-center gap-1">
                      <FolderGit2 className="h-3.5 w-3.5 text-slate-600" />
                      <span>{doc.category || 'General'}</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-slate-600" />
                      <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Layers className="h-3.5 w-3.5 text-slate-600" />
                      <span>Version {doc.current_version}</span>
                    </span>
                  </div>
                </div>

                <div className="ml-4 shrink-0 flex items-center gap-2">
                  <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${getAccessLevelColor(doc.access_level)}`}>
                    {doc.access_level}
                  </span>
                  <Link to={`/documents/${doc.id}`} className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition-colors">
                    <ChevronRight className="h-4.5 w-4.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-slate-500 text-xs italic flex flex-col items-center justify-center space-y-2">
            <HelpCircle className="h-8 w-8 text-slate-800" />
            <span>No matching knowledge assets found.</span>
          </div>
        )}
      </div>
    </div>
  );
}
