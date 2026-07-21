import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { 
  Search as SearchIcon, 
  Tag, 
  Filter, 
  FileText,
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
    <div className="space-y-6 relative select-none">
      
      <div className="space-y-1">
        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Knowledge Search</h1>
        <p className="text-slate-500 text-[11px] font-semibold">Sift through company wisdom, filter index parameters, and identify files semantically.</p>
      </div>

      {/* Filter and Search Form */}
      <form onSubmit={handleSearch} className="bg-white border border-slate-250/80 rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-4">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by keywords, tags, category, department policies..."
              className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-650/10 text-slate-800 placeholder-slate-400 font-medium"
            />
          </div>
          <button
            type="submit"
            className="glow-btn rounded-xl bg-blue-600 hover:bg-blue-700 px-6 py-2.5 text-xs font-extrabold text-white transition-all shadow-md border border-blue-500"
          >
            Search
          </button>
        </div>

        {/* Advanced Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-3.5 border-t border-slate-100">
          <div>
            <label className="text-[9.5px] font-extrabold text-slate-455 block mb-1.5 uppercase tracking-wider">Filter by Tag</label>
            <div className="relative">
              <Tag className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                placeholder="sop, draft..."
                className="w-full bg-[#f8fafc] border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-blue-650 focus:bg-white text-slate-700 placeholder-slate-400 font-semibold"
              />
            </div>
          </div>

          <div>
            <label className="text-[9.5px] font-extrabold text-slate-455 block mb-1.5 uppercase tracking-wider">Filter by Category</label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Manual, Contract, Policy..."
              className="w-full bg-[#f8fafc] border border-slate-200 rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:border-blue-650 focus:bg-white text-slate-700 placeholder-slate-400 font-semibold"
            />
          </div>

          <div>
            <label className="text-[9.5px] font-extrabold text-slate-455 block mb-1.5 uppercase tracking-wider">Department Division</label>
            <select
              value={deptId}
              onChange={(e) => setDeptId(e.target.value !== '' ? Number(e.target.value) : '')}
              className="w-full bg-[#f8fafc] border border-slate-200 rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:border-blue-650 focus:bg-white text-slate-700 font-semibold cursor-pointer"
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
              className="w-full border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 rounded-lg py-2 text-xs font-bold text-slate-600 transition-colors shadow-sm"
            >
              Reset All Filters
            </button>
          </div>
        </div>
      </form>

      {/* Results Container */}
      <div className="bg-white border border-slate-250/80 rounded-2xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col">
        <div className="bg-slate-50/50 border-b border-slate-100 p-4 flex items-center gap-2 select-none">
          <Filter className="h-4.5 w-4.5 text-blue-600" />
          <h2 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Filtered Inventory</h2>
          {results && (
            <span className="ml-auto rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-[10px] font-extrabold text-slate-500">
              {results.length} files matched
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="p-12 text-center space-y-2 select-none">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600 mx-auto" />
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Querying index database...</span>
          </div>
        ) : results && results.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {results.map((doc: any) => (
              <div key={doc.id} className="p-4 hover:bg-slate-50/50 flex items-start justify-between transition-colors">
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex items-center gap-2.5">
                    <FileText className="h-4.5 w-4.5 text-blue-600 shrink-0" />
                    <Link 
                      to={`/documents/${doc.id}`}
                      className="font-extrabold text-slate-800 text-xs hover:text-blue-600 transition-colors truncate"
                    >
                      {doc.name}
                    </Link>
                    <span className={`px-1.5 py-0.5 rounded border text-[8px] font-extrabold uppercase tracking-wider ${getFileTypeColor(doc.file_type)}`}>
                      {doc.file_type}
                    </span>
                  </div>
                  
                  {doc.ai_summary && (
                    <p className="text-xs text-slate-550 leading-relaxed pl-7 font-medium select-text">
                      {doc.ai_summary}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-455 font-bold uppercase tracking-wider pl-7 select-none">
                    <span className="flex items-center gap-1">
                      <span>{doc.category || 'General'}</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <span>Version {doc.current_version}</span>
                    </span>
                  </div>
                </div>

                <div className="ml-4 shrink-0 flex items-center gap-2 select-none">
                  <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${getAccessLevelColor(doc.access_level)}`}>
                    {doc.access_level}
                  </span>
                  <Link to={`/documents/${doc.id}`} className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700 transition-colors">
                    <ChevronRight className="h-4.5 w-4.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-slate-400 text-xs italic flex flex-col items-center justify-center space-y-2 select-none">
            <HelpCircle className="h-8 w-8 text-slate-200" />
            <span>No matching knowledge assets found.</span>
          </div>
        )}
      </div>
    </div>
  );
}
