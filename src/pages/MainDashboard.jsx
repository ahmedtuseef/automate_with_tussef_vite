// src/pages/MainDashboard.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ProfileMenu from "../components/ProfileMenu"; // <-- make sure path is correct
import { auth } from "../firebase"; // still useful if you need currentUser fallback

export default function MainDashboard({ user, onLogout }) {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("");

  useEffect(() => {
    // Prefer the user prop (passed from App). If not available, fallback to firebase auth currentUser.
    const u = user || auth.currentUser;
    if (!u) {
      setUserName("");
      return;
    }

    // Priority: displayName > email prefix
    if (u.displayName) {
      setUserName(u.displayName);
    } else if (u.email) {
      const prefix = u.email.split("@")[0];
      setUserName(prefix.charAt(0).toUpperCase() + prefix.slice(1));
    } else {
      setUserName("User");
    }
  }, [user]);

  // If you still want a logout button fallback (not necessary if using ProfileMenu)
  function fallbackLogout() {
    if (onLogout) return onLogout();
    // else redirect to login
    navigate("/login");
  }

  return (
    <div className="app-shell">
      {/* TOP NAV */}
      <nav className="top-nav" style={{ display: "flex", alignItems: "center", padding: "12px 20px" }}>
        <div className="logo" style={{ fontWeight: 800, fontSize: 20, letterSpacing: 0.4 }}>
          Learn with <span style={{ color: "#cfeefc" }}>Tuseef</span>
        </div>

        <div className="menu" style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 20 }}>
          <span style={{ opacity: 0.9, fontSize: 15 }}>
            Hi, <strong>{userName}</strong>
          </span>

          {/* Profile dropdown component (Edit Profile / Logout) */}
          <ProfileMenu user={user} onLogout={onLogout || fallbackLogout} />
        </div>
      </nav>

      {/* CENTER WRAPPER */}
      <div className="center-wrapper" style={{ display: "flex", alignItems: "center", flexDirection: "column", gap: 24, paddingTop: 120 }}>
        {/* WELCOME CARD */}
        <div
          className="glass-card"
          style={{
            width: "90%",
            maxWidth: 850,
            padding: 32,
            textAlign: "center",
          }}
        >
          <h1 style={{ fontSize: 36, fontWeight: 800, marginBottom: 8 }}>Welcome, {userName}! 👋</h1>
          <p style={{ fontSize: 16, opacity: 0.9 }}>
            Your automation dashboard is ready. Explore tools, activity, and insights.
          </p>
        </div>

        {/* STATS SECTION */}
        <div
          style={{
            width: "90%",
            maxWidth: 850,
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 20,
          }}
        >
          <div className="glass-card" style={{ padding: 24, textAlign: "center" }}>
            <h2 style={{ fontSize: 24, marginBottom: 10 }}>12</h2>
            <p style={{ opacity: 0.8 }}>Projects Created</p>
          </div>

          <div className="glass-card" style={{ padding: 24, textAlign: "center" }}>
            <h2 style={{ fontSize: 24, marginBottom: 10 }}>8</h2>
            <p style={{ opacity: 0.8 }}>Tasks Automated</p>
          </div>

          <div className="glass-card" style={{ padding: 24, textAlign: "center" }}>
            <h2 style={{ fontSize: 24, marginBottom: 10 }}>99%</h2>
            <p style={{ opacity: 0.8 }}>Success Rate</p>
          </div>
        </div>

        {/* QUICK ACTIONS */}
        <div
          className="glass-card"
          style={{
            width: "90%",
            maxWidth: 850,
            padding: 28,
          }}
        >
          <h2 style={{ marginBottom: 16, fontSize: 24 }}>Quick Actions ⚡</h2>

          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <button className="lg-btn" style={{ flex: 1 }} onClick={() => alert("New automation!")}>
              ➕ Create New Automation
            </button>

            <button className="lg-btn ghost" style={{ flex: 1 }} onClick={() => alert("Logs opened!")}>
              📜 View Activity Logs
            </button>

            <button className="lg-btn ghost" style={{ flex: 1 }} onClick={() => alert("Settings opened!")}>
              ⚙️ Open Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
