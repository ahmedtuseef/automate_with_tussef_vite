import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function ProfileMenu({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef();
  const navigate = useNavigate();

  // Close dropdown if clicked outside
  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    window.addEventListener("mousedown", handleClick);
    return () => window.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div style={{ position: "relative" }} ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          padding: "8px 16px",
          borderRadius: "8px",
          background: "rgba(255,255,255,0.1)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          border: "1px solid rgba(255,255,255,0.2)",
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
            right: 0,
            marginTop: "10px",
            width: "220px",
            background: "rgba(255,255,255,0.06)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: "12px",
            padding: "14px",
            zIndex: 100,
          }}
        >
          {/* User Info */}
          <div style={{ marginBottom: "12px", color: "#e6f3ff" }}>
            <strong>{user?.name || "Your Name"}</strong>
            <div style={{ fontSize: "12px", opacity: 0.8 }}>
              {user?.email || "your@email.com"}
            </div>
          </div>

          <hr style={{ opacity: 0.2 }} />

          {/* Edit Profile */}
          <button
            onClick={() => {
              setOpen(false);
              navigate("/edit-profile");
            }}
            style={{
              width: "100%",
              padding: "10px",
              marginTop: "10px",
              border: "none",
              borderRadius: "8px",
              background: "transparent",
              color: "#e6f3ff",
              textAlign: "left",
              cursor: "pointer",
            }}
          >
            ✏️ Edit Profile
          </button>

          {/* Logout */}
          <button
            onClick={onLogout}
            style={{
              width: "100%",
              padding: "10px",
              marginTop: "4px",
              border: "none",
              borderRadius: "8px",
              background: "transparent",
              color: "#ffb3b3",
              textAlign: "left",
              cursor: "pointer",
            }}
          >
            ⏻ Logout
          </button>
        </div>
      )}
    </div>
  );
}
