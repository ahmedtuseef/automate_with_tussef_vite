// src/pages/StartPage.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

export default function StartPage() {
  const navigate = useNavigate();

  return (
    <div className="app-shell">

      {/* TOP NAV */}
      <nav className="top-nav">
         <div className="logo" style={{ fontWeight: 800, fontSize: 20, letterSpacing: 0.4 }}>
          Learn with <span style={{ color: '#cfeefc' }}>Tuseef</span>
        </div>

        <div className="menu" style={{ marginLeft: "auto" }}>
          <a href="#home">Home</a>
          <a href="#about">About</a>
          <a href="#services">Services</a>
        </div>
      </nav>

      {/* PAGE CENTER */}
      <div className="center-wrapper">
        <div
          className="glass-card start-card"
          style={{ textAlign: "center", padding: "40px 32px" }}
        >
          {/* Title */}
          <h1
            style={{
              fontSize: "36px",
              fontWeight: "700",
              marginBottom: "10px",
              letterSpacing: "0.4px",
            }}
          >
            Welcome ✨
          </h1>

          {/* Subtitle */}
          <p
            style={{
              fontSize: "16px",
              opacity: 0.9,
              marginBottom: "26px",
            }}
          >
            Begin your automation journey with Tuseef
          </p>

          {/* Start Button */}
          <button
            className="big-btn"
            onClick={() => navigate("/choose")}
            style={{
              padding: "14px 26px",
              borderRadius: "12px",
              fontSize: "17px",
              fontWeight: "600",
              border: "none",
              cursor: "pointer",
              color: "#f6fbff",
              background: "linear-gradient(180deg, #0d2530, #03131a)",
              boxShadow: "0 8px 25px rgba(2,6,23,0.55)",
              transition: "0.25s ease",
            }}
            onMouseOver={(e) => {
              e.target.style.transform = "scale(1.06)";
              e.target.style.boxShadow =
                "0 12px 28px rgba(2,6,23,0.7)";
            }}
            onMouseOut={(e) => {
              e.target.style.transform = "scale(1)";
              e.target.style.boxShadow =
                "0 8px 25px rgba(2,6,23,0.55)";
            }}
          >
            Start →
          </button>
        </div>
      </div>
    </div>
  );
}
