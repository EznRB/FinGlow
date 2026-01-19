import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { UploadPage } from './pages/UploadPage';
import { History } from './pages/History';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';
import { NotFound } from './pages/NotFound';
import { TopBar } from './components/ui/TopBar';

export default function App() {
  // Simple Mock Auth State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    const storedAuth = localStorage.getItem('finglow_auth');
    if (storedAuth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = () => {
    localStorage.setItem('finglow_auth', 'true');
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('finglow_auth');
    setIsAuthenticated(false);
  };

  return (
    <HashRouter>
      <TopBar />
      <Routes>
        <Route 
          path="/login" 
          element={
            !isAuthenticated ? <Login onLogin={handleLogin} /> : <Navigate to="/dashboard" replace />
          } 
        />
        <Route 
          path="/dashboard" 
          element={
            isAuthenticated ? <Dashboard onLogout={handleLogout} /> : <Navigate to="/login" replace />
          } 
        />
        <Route 
          path="/upload" 
          element={
            isAuthenticated ? <UploadPage onLogout={handleLogout} /> : <Navigate to="/login" replace />
          } 
        />
        <Route 
          path="/history" 
          element={
            isAuthenticated ? <History onLogout={handleLogout} /> : <Navigate to="/login" replace />
          } 
        />
        <Route 
          path="/reports" 
          element={
            isAuthenticated ? <Reports onLogout={handleLogout} /> : <Navigate to="/login" replace />
          } 
        />
        <Route 
          path="/settings" 
          element={
             isAuthenticated ? <Settings onLogout={handleLogout} /> : <Navigate to="/login" replace />
          } 
        />
        {/* Redirect root to dashboard if auth, else login */}
        <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />
        
        {/* 404 Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </HashRouter>
  );
}