import React, { useState, useEffect } from 'react';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import { getStoredToken, getStoredUser, clearAuthSession } from './services/api';

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => getStoredUser());
  const [currentPage, setCurrentPage] = useState(() => {
    return getStoredToken() ? 'dashboard' : 'login';
  });

  // Keep state synchronized if token is missing
  useEffect(() => {
    const token = getStoredToken();
    if (!token && currentPage === 'dashboard') {
      setCurrentPage('login');
      setCurrentUser(null);
    }
  }, [currentPage]);

  const handleAuthSuccess = (user) => {
    setCurrentUser(user);
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    clearAuthSession();
    setCurrentUser(null);
    setCurrentPage('login');
  };

  return (
    <div className="app-root">
      {currentPage === 'login' && (
        <Login
          onAuthSuccess={handleAuthSuccess}
          onNavigateRegister={() => setCurrentPage('register')}
        />
      )}

      {currentPage === 'register' && (
        <Register
          onAuthSuccess={handleAuthSuccess}
          onNavigateLogin={() => setCurrentPage('login')}
        />
      )}

      {currentPage === 'dashboard' && (
        <ProtectedRoute
          isAuthenticated={Boolean(currentUser && getStoredToken())}
          onRedirectLogin={() => setCurrentPage('login')}
        >
          <Dashboard user={currentUser} onLogout={handleLogout} />
        </ProtectedRoute>
      )}
    </div>
  );
}
