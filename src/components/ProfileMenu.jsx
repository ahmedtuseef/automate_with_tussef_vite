// src/components/ProfileMenu.jsx
import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function ProfileMenu({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef();
  const navigate = useNavigate();

  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const userEmail = user?.email || "";
  const userName = user?.displayName || userEmail.split("@")[0] || "User";

  return (
    <div style={{ position: "relative" }} ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          background: "#0b2430",
          padding: "8px 14px",
          borderRadius: 8,
          border: "1px solid #0c3a56",
          color: "#fff",
          cursor: "pointer",
        }}
      >
        Your Profile ▾
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "46px",
            right: 0,
            width: 220,
            background: "#ffffff",
            borderRadius: 10,
            padding: 14,
            boxShadow: "0 8px 20px rgba(0,0,0,0.18)",
            border: "1px solid #ddd",
            zIndex: 999,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 700, color: "#0b2430" }}>{userName}</div>
          <div style={{ fontSize: 12, color: "#666", marginBottom: 10 }}>{userEmail}</div>

          <hr style={{ border: "none", borderTop: "1px solid #eee", margin: "8px 0" }} />

          <button
            onClick={() => {
              setOpen(false);
              navigate("/profile");
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 0",
              background: "none",
              border: "none",
              width: "100%",
              textAlign: "left",
              cursor: "pointer",
              color: "#0b2430",
              fontWeight: 600,
            }}
          >
            Your Profile
          </button>

          <button
            onClick={() => {
              setOpen(false);
              if (typeof onLogout === "function") onLogout();
              else navigate("/logout");
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 0",
              background: "none",
              border: "none",
              width: "100%",
              textAlign: "left",
              cursor: "pointer",
              color: "#d62828",
              fontWeight: 600,
            }}
          >
            🔴 Logout
          </button>
        </div>
      )}
    </div>
  );
}
