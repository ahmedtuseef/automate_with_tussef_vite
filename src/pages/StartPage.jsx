// src/pages/StartPage.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import BackButton from "../components/BackButton";

export default function StartPage() {
  const navigate = useNavigate();

  const colors = {
    cardBg:
      "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03))",
    primary: "#0f8a4a",
    primaryDark: "#0a5e35",
  };

  return (
    <div
      className="app-shell"
      style={{
        minHeight: "100vh",
        background: "url('/background.jpg') center/cover no-repeat",
        display: "flex",
        flexDirection: "column",
        position: "relative",
      }}
    >
      {/* TOP NAV */}
      <nav
        className="top-nav"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "14px 28px",
          backdropFilter: "blur(6px)",
          background:
            "linear-gradient(180deg, rgba(2,6,23,0.55), rgba(2,6,23,0.25))",
        }}
      >
        {/* Back arrow placed inside nav (left of logo) */}
        <div style={{ display: "flex", alignItems: "center" }}>
          <BackButton
            label="←"
            styleOverride={{ fontSize: 20, fontWeight: 900, color: "#fff" }}
          />
        </div>

        <div
          className="logo"
          style={{
            fontWeight: 800,
            fontSize: 20,
            letterSpacing: 0.4,
            color: "#f8fafc",
            marginLeft: 6,
          }}
        >
          <span style={{ color: "#cfeefc" }}>Tuseef</span> Dashboard
        </div>

        <div
          className="menu"
          style={{ marginLeft: "auto", display: "flex", gap: 16 }}
        >
          <a href="#home" style={{ color: "#dbeafe", textDecoration: "none" }}>
            Home
          </a>
          <a href="#about" style={{ color: "#dbeafe", textDecoration: "none" }}>
            About
          </a>
          <a
            href="#services"
            style={{ color: "#dbeafe", textDecoration: "none" }}
          >
            Services
          </a>
        </div>
      </nav>

      {/* CENTER HERO */}
      <main
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "48px 20px",
        }}
      >
        <div
          style={{
            width: "min(980px, 96%)",
            display: "flex",
            gap: 24,
            alignItems: "center",
            justifyContent: "space-between",
            padding: 22,
            borderRadius: 14,
            boxShadow: "0 18px 45px rgba(2,6,23,0.45)",
            backdropFilter: "blur(8px)",
            background: colors.cardBg,
          }}
        >
          {/* LEFT SECTION */}
          <div style={{ flex: 1, color: "#fff" }}>
            <h1
              style={{
                margin: 0,
                fontSize: 34,
                fontWeight: 800,
                letterSpacing: 0.4,
              }}
            >
              Welcome to your financial cockpit ✨
            </h1>

            <p
              style={{
                marginTop: 12,
                color: "rgba(255,255,255,0.9)",
                fontSize: 15,
                lineHeight: 1.5,
              }}
            >
              Track income, control expenses, and get a clear picture of your
              money — all from one simple Balance Board. Add transactions, view
              history, edit or delete entries, and watch your monthly summary
              update in real time.
            </p>

            <ul
              style={{
                marginTop: 12,
                color: "rgba(255,255,255,0.85)",
                fontSize: 14,
                paddingLeft: 18,
              }}
            >
              <li>Quickly add income & expenses</li>
              <li>Edit or delete transactions anytime</li>
              <li>Monthly totals, balance overview and history</li>
            </ul>

            {/* MAIN BUTTON */}
            <div style={{ marginTop: 22 }}>
              <button
                onClick={() => navigate("/login")}
                style={{
                  padding: "14px 28px",
                  borderRadius: 999,
                  fontSize: 16,
                  fontWeight: 800,
                  border: `2px solid rgba(255,255,255,0.06)`,
                  cursor: "pointer",
                  color: "#fff",
                  background: `linear-gradient(180deg, #10b981, #059669)`,
                  boxShadow:
                    "0 12px 36px rgba(4,120,87,0.28), inset 0 -6px 18px rgba(0,0,0,0.12)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform =
                    "translateY(-3px) scale(1.02)";
                  e.currentTarget.style.boxShadow =
                    "0 18px 44px rgba(4,120,87,0.35), inset 0 -6px 20px rgba(0,0,0,0.14)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0) scale(1)";
                  e.currentTarget.style.boxShadow =
                    "0 12px 36px rgba(4,120,87,0.28), inset 0 -6px 18px rgba(0,0,0,0.12)";
                }}
              >
                Start using Balance board
              </button>
            </div>
          </div>

          {/* RIGHT BOX */}
          <aside
            style={{
              width: 320,
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <div
              style={{
                borderRadius: 10,
                padding: 12,
                background: "rgba(255,255,255,0.04)",
              }}
            >
              <div style={{ fontSize: 12, color: "#cfeefc", fontWeight: 700 }}>
                Why Balance Board?
              </div>
              <p
                style={{
                  marginTop: 8,
                  color: "rgba(255,255,255,0.9)",
                  fontSize: 13,
                  lineHeight: 1.4,
                }}
              >
                Quickly glance your balance, add transactions in seconds, and
                keep your spending under control. Designed to be simple and
                private.
              </p>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
