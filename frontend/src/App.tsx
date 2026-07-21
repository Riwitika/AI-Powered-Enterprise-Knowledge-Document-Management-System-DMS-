import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './stores/authStore';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import DocumentTree from './pages/DocumentTree';
import DocumentViewer from './pages/DocumentViewer';
import AIChat from './pages/AIChat';
import Search from './pages/Search';
import UserManagement from './pages/UserManagement';
import ApprovalDashboard from './pages/ApprovalDashboard';
import PublicDocumentViewer from './pages/PublicDocumentViewer';
import Permissions from './pages/Permissions';
import Settings from './pages/Settings';

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
      </BrowserRouter>
    </QueryClientProvider>
  );
}
