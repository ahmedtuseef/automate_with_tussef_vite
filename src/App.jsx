// src/App.jsx
import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import StartPage from "./pages/StartPage";
import ChooseAuth from "./pages/ChooseAuth";
import LoginFormPage from "./pages/LoginFormPage";
import SignupPage from "./pages/SignupPage";
import MainDashboard from "./pages/MainDashboard";
import EditProfile from "./pages/EditProfile"; // <-- new page

import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./firebase";

function ProtectedRoute({ children, user, loading }) {
  // while checking auth, you can show spinner; for now return null
  if (loading) return null;
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

  // logout function to pass down
  async function handleLogout() {
    try {
      await signOut(auth);
      // optionally: setUser(null) will be handled by onAuthStateChanged
    } catch (err) {
      console.error("Logout error:", err);
      // show notification to user if needed
    }
  }

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
            {/* pass user & logout to dashboard so it can render profile menu */}
            <MainDashboard user={user} onLogout={handleLogout} />
          </ProtectedRoute>
        }
      />

      {/* protected edit-profile page */}
      <Route
        path="/edit-profile"
        element={
          <ProtectedRoute user={user} loading={checkingAuth}>
            <EditProfile />
          </ProtectedRoute>
        }
      />

      {/* fallback -> home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
