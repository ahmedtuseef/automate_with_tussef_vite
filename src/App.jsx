// src/App.jsx
import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import StartPage from "./pages/StartPage";
import LoginFormPage from "./pages/LoginFormPage";
import SignupPage from "./pages/SignupPage";
import FinanceDashboard from "./pages/FinanceDashboard";
import TransactionsPage from "./pages/TransactionsPage";

// Note: your file is named "settingPage.jsx" in src/pages — import using that exact name
import SettingsPage from "./pages/settingPage";
import YourProfile from "./pages/YourProfile";

// NEW PAGES
import ReportsPage from "./pages/ReportsPage";
import RecurringTransactionsPage from "./pages/RecurringTransactionsPage";

import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./firebase";

function ProtectedRoute({ children, user, loading }) {
  if (loading) {
    return (
      <div
        style={{
          minHeight: "60vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            padding: 12,
            borderRadius: 8,
            background: "rgba(255,255,255,0.9)",
            boxShadow: "0 8px 30px rgba(2,6,23,0.06)",
          }}
        >
          Loading…
        </div>
      </div>
    );
  }
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

  async function handleSaveProfile(updatedProfile) {
    console.log("Profile saved (mock):", updatedProfile);
    // yahan chaaho toh auth / Firestore update wire kar sakte ho
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<StartPage />} />

      {/* legacy /choose route -> redirect to login (safe) */}
      <Route path="/choose" element={<Navigate to="/login" replace />} />

      <Route path="/login" element={<LoginFormPage />} />
      <Route path="/signup" element={<SignupPage />} />

      {/* Dashboard */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute user={user} loading={checkingAuth}>
            <FinanceDashboard user={user} onLogout={handleLogout} />
          </ProtectedRoute>
        }
      />

      {/* Transactions */}
      <Route
        path="/transactions"
        element={
          <ProtectedRoute user={user} loading={checkingAuth}>
            <TransactionsPage user={user} />
          </ProtectedRoute>
        }
      />

      {/* Settings */}
      <Route
        path="/settings"
        element={
          <ProtectedRoute user={user} loading={checkingAuth}>
            <SettingsPage user={user} onSaveProfile={handleSaveProfile} />
          </ProtectedRoute>
        }
      />

      {/* Your Profile */}
      <Route
        path="/profile"
        element={
          <ProtectedRoute user={user} loading={checkingAuth}>
            <YourProfile
              user={user}
              onSave={handleSaveProfile}
              onLogout={handleLogout}
            />
          </ProtectedRoute>
        }
      />

      {/* Edit Profile (re-uses SettingsPage) */}
      <Route
        path="/edit-profile"
        element={
          <ProtectedRoute user={user} loading={checkingAuth}>
            <SettingsPage user={user} onSaveProfile={handleSaveProfile} />
          </ProtectedRoute>
        }
      />

      {/* NEW: Reports page */}
      <Route
        path="/reports"
        element={
          <ProtectedRoute user={user} loading={checkingAuth}>
            <ReportsPage user={user} onLogout={handleLogout} />
          </ProtectedRoute>
        }
      />

      {/* NEW: Recurring Transactions page */}
      <Route
        path="/recurring"
        element={
          <ProtectedRoute user={user} loading={checkingAuth}>
            <RecurringTransactionsPage user={user} onLogout={handleLogout} />
          </ProtectedRoute>
        }
      />

      {/* fallback -> home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
