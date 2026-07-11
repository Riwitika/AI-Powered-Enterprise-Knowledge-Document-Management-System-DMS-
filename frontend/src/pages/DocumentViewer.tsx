import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

export default function DocumentViewer() {
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      navigate(`/documents?open=${id}`, { replace: true });
    } else {
      navigate('/documents', { replace: true });
    }
  }, [id, navigate]);

  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <div className="text-center space-y-2">
        <div className="h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Redirecting to Workspace...</span>
      </div>
    </div>
  );
}
