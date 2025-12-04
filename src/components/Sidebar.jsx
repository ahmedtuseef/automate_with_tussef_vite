// src/components/Sidebar.jsx
import React from "react";
import { NavLink } from "react-router-dom";

const baseSidebar = {
  width: 200,
  background: "linear-gradient(180deg,#0f172a,#0b1120)",
  color: "#e5e7eb",
  padding: 16,
  display: "flex",
  flexDirection: "column",
  gap: 16,
  boxShadow: "4px 0 20px rgba(15,23,42,0.6)",
};

const brandStyle = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  fontWeight: 800,
  fontSize: 18,
  color: "#f9fafb",
};

const navSection = {
  marginTop: 18,
  display: "flex",
  flexDirection: "column",
  gap: 6,
};

const baseLinkStyle = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "10px 12px",
  borderRadius: 999,
  fontSize: 14,
  textDecoration: "none",
  transition: "all 0.18s ease",
};

const iconBubble = (active) => ({
  width: 26,
  height: 26,
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 14,
  background: active ? "rgba(34,197,94,0.14)" : "rgba(15,23,42,0.8)",
});

const navItems = [
  { label: "Dashboard", to: "/dashboard", icon: "📊" },
  { label: "Transactions", to: "/transactions", icon: "💸" },
  { label: "Settings", to: "/settings", icon: "⚙️" },
];

export default function Sidebar() {
  return (
    <aside style={baseSidebar}>
      <div style={brandStyle}>
        <span role="img" aria-label="coin">
          💰
        </span>
        <span>Finance Tracker</span>
      </div>

      <nav style={navSection}>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            style={({ isActive }) => ({
              ...baseLinkStyle,
              background: isActive
                ? "rgba(82, 255, 2, 0.96)"
                : "rgba(15,23,42,0.4)",
              color: isActive ? "#0f172a" : "#e5e7eb",
              boxShadow: isActive
                ? "0 12px 30px rgba(15,23,42,0.55)"
                : "0 4px 12px rgba(15,23,42,0.45)",
              borderLeft: isActive
                ? "3px solid #22c55e"
                : "3px solid transparent",
              transform: isActive ? "translateX(2px)" : "translateX(0)",
            })}
          >
            <div style={iconBubble(true)}>
              <span>{item.icon}</span>
            </div>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
