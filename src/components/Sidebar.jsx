// src/components/Sidebar.jsx
import React from "react";
import { NavLink } from "react-router-dom";

export default function Sidebar() {
  const linkStyle = ({ isActive }) => ({
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "12px 16px",
    color: isActive ? "#b8f7ff" : "#e7faff",
    background: isActive ? "rgba(255,255,255,0.12)" : "transparent",
    border: isActive ? "1px solid rgba(255,255,255,0.2)" : "1px solid rgba(255,255,255,0.05)",
    borderRadius: 10,
    textDecoration: "none",
    marginBottom: 10,
    transition: "0.15s",
  });

  return (
    <aside
      style={{
        width: 230,
        padding: 20,
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        background: "rgba(255,255,255,0.04)",
        borderRight: "1px solid rgba(255,255,255,0.06)",
        minHeight: "100vh",
      }}
    >
      <div style={{ fontWeight: 800, fontSize: 20, marginBottom: 20, color: "#fff" }}>
        💰 Finance Tracker
      </div>

      <nav>
        <NavLink to="/dashboard" style={linkStyle}>
          <span style={{ fontSize: 16 }}>🏠</span>
          <span>Dashboard</span>
        </NavLink>

        <NavLink to="/transactions" style={linkStyle}>
          <span style={{ fontSize: 16 }}>📋</span>
          <span>Transactions</span>
        </NavLink>

        <NavLink to="/settings" style={linkStyle}>
          <span style={{ fontSize: 16 }}>⚙️</span>
          <span>Settings</span>
        </NavLink>
      </nav>
    </aside>
  );
}
