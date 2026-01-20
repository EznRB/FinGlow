import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth, ProtectedRoute } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { UploadPage } from './pages/UploadPage';
import { History } from './pages/History';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';
import { NotFound } from './pages/NotFound';
import { TopBar } from './components/ui/TopBar';

// ============================================================================
// App Routes Component (uses auth context)
// ============================================================================

const AppRoutes: React.FC = () => {
  const { user, loading, signOut } = useAuth();

  // Show loading screen while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-lg">Carregando FinGlow...</p>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <>
      <TopBar />
      <Routes>
        {/* Public route - Login */}
        <Route
          path="/login"
          element={
            !user ? <Login /> : <Navigate to="/dashboard" replace />
          }
        />

        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute fallback={<Navigate to="/login" replace />}>
              <Dashboard onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/upload"
          element={
            <ProtectedRoute fallback={<Navigate to="/login" replace />}>
              <UploadPage onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/history"
          element={
            <ProtectedRoute fallback={<Navigate to="/login" replace />}>
              <History onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/reports"
          element={
            <ProtectedRoute fallback={<Navigate to="/login" replace />}>
              <Reports onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedRoute fallback={<Navigate to="/login" replace />}>
              <Settings onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />

        {/* Redirect root to dashboard if authenticated, else login */}
        <Route
          path="/"
          element={<Navigate to={user ? "/dashboard" : "/login"} replace />}
        />

        {/* 404 Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

// ============================================================================
// Main App Component with Providers
// ============================================================================

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <HashRouter>
          <AppRoutes />
        </HashRouter>
      </AuthProvider>
    </LanguageProvider>
  );
}