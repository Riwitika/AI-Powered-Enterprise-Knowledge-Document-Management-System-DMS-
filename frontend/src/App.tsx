import React, { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './stores/authStore';
import Layout from './components/Layout';

// Lazy loaded page components
const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const DocumentTree = lazy(() => import('./pages/DocumentTree'));
const DocumentViewer = lazy(() => import('./pages/DocumentViewer'));
const AIChat = lazy(() => import('./pages/AIChat'));
const Search = lazy(() => import('./pages/Search'));
const UserManagement = lazy(() => import('./pages/UserManagement'));
const ApprovalDashboard = lazy(() => import('./pages/ApprovalDashboard'));
const PublicDocumentViewer = lazy(() => import('./pages/PublicDocumentViewer'));
const Permissions = lazy(() => import('./pages/Permissions'));
const Settings = lazy(() => import('./pages/Settings'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
});

// Guard helper to protect routes
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isInitializing } = useAuthStore();

  if (isInitializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-sm font-semibold text-slate-500">Initializing session...</div>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

// Guard helper to protect administrator-only routes
function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isInitializing } = useAuthStore();

  if (isInitializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-sm font-semibold text-slate-500">Initializing session...</div>
      </div>
    );
  }

  const isAdmin = user?.role?.name === 'admin' || user?.role?.name === 'super_admin';
  return isAuthenticated && isAdmin ? <>{children}</> : <Navigate to="/" replace />;
}

// Guard helper to protect manager/admin approval dashboard route
function ManagerOrAdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isInitializing } = useAuthStore();

  if (isInitializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-sm font-semibold text-slate-500">Initializing session...</div>
      </div>
    );
  }

  const isAllowed = ['super_admin', 'admin', 'manager', 'department_manager'].includes(user?.role?.name);
  return isAuthenticated && isAllowed ? <>{children}</> : <Navigate to="/" replace />;
}

// Guard helper to prevent authenticated users from going to login
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isInitializing } = useAuthStore();

  if (isInitializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-sm font-semibold text-slate-500">Initializing session...</div>
      </div>
    );
  }

  return !isAuthenticated ? <>{children}</> : <Navigate to="/" replace />;
}

export default function App() {
  const checkAuth = useAuthStore((state) => state.checkAuth);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Suspense fallback={
          <div className="flex min-h-screen items-center justify-center bg-[#f8fafc] font-sans">
            <div className="flex flex-col items-center gap-3">
              <div className="h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <div className="text-xs font-bold text-slate-450 uppercase tracking-widest">Loading corporate module...</div>
            </div>
          </div>
        }>
          <Routes>
            {/* Public routes */}
            <Route 
              path="/login" 
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              } 
            />
            <Route path="/public/documents/:id" element={<PublicDocumentViewer />} />

            {/* Protected routes under Layout */}
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="documents" element={<DocumentTree />} />
              <Route path="documents/:id" element={<DocumentViewer />} />
              <Route path="chat" element={<AIChat />} />
              <Route path="search" element={<Search />} />
              
              {/* Admin only route */}
              <Route 
                path="users" 
                element={
                  <AdminRoute>
                    <UserManagement />
                  </AdminRoute>
                } 
              />
              
              {/* Manager and Admin approval route */}
              <Route 
                path="approval" 
                element={
                  <ManagerOrAdminRoute>
                    <ApprovalDashboard />
                  </ManagerOrAdminRoute>
                } 
              />
              
              {/* Admin only route */}
              <Route 
                path="permissions" 
                element={
                  <AdminRoute>
                    <Permissions />
                  </AdminRoute>
                } 
              />
              
              <Route path="settings" element={<Settings />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
