// src/App.jsx
import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import StartPage from "./pages/StartPage";
import LoginFormPage from "./pages/LoginFormPage";
import SignupPage from "./pages/SignupPage";
import FinanceDashboard from "./pages/FinanceDashboard";
import EditProfile from "./pages/EditProfile";
import TransactionsPage from "./pages/TransactionsPage";

import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./firebase";

function ProtectedRoute({ children, user, loading }) {
  if (loading) return null; // or a spinner component
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setCheckingAuth(false);
    });
    return () => unsub();
  }, []);

  async function handleLogout() {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Logout failed:", err);
    }
  }

  return (
    <Routes>
      <Route path="/" element={<StartPage />} />

      {/* legacy /choose route -> redirect to login (safe) */}
      <Route path="/choose" element={<Navigate to="/login" replace />} />

      <Route path="/login" element={<LoginFormPage />} />
      <Route path="/signup" element={<SignupPage />} />

      {/* Finance dashboard */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute user={user} loading={checkingAuth}>
            <FinanceDashboard user={user} onLogout={handleLogout} />
          </ProtectedRoute>
        }
      />

      {/* Transactions (pass user so TransactionsPage can query correctly) */}
      <Route
        path="/transactions"
        element={
          <ProtectedRoute user={user} loading={checkingAuth}>
            <TransactionsPage user={user} />
          </ProtectedRoute>
        }
      />

      {/* Settings / Edit profile */}
      <Route
        path="/settings"
        element={
          <ProtectedRoute user={user} loading={checkingAuth}>
            <EditProfile user={user} onLogout={handleLogout} />
          </ProtectedRoute>
        }
      />

      {/* fallback -> home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
