// src/App.jsx
import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import StartPage from './pages/StartPage';
import ChooseAuth from './pages/ChooseAuth';
import LoginFormPage from './pages/LoginFormPage';
import SignupPage from './pages/SignupPage';
import MainDashboard from './pages/MainDashboard';

import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';

function ProtectedRoute({ children, user, loading }) {
  // While we are checking auth, don't render redirect (you can show a spinner)
  if (loading) return null;
  return user ? children : <Navigate to="/login" replace />;
}

export default function App(){
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setCheckingAuth(false);
    });
    return () => unsub();
  }, []);

  return (
    <Routes>
      <Route path="/" element={<StartPage />} />
      <Route path="/choose" element={<ChooseAuth />} />
      <Route path="/login" element={<LoginFormPage />} />
      <Route path="/signup" element={<SignupPage />} />

      {/* protected dashboard */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute user={user} loading={checkingAuth}>
            <MainDashboard />
          </ProtectedRoute>
        }
      />

      {/* fallback -> home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
