// src/pages/StartPage.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import BackButton from "../components/BackButton";

export default function StartPage() {
  const navigate = useNavigate();

  const colors = {
    cardBg:
      "linear-gradient(135deg, rgba(15,23,42,0.96), rgba(30,64,175,0.90))",
    primary: "#10b981",
    primaryDark: "#059669",
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
          backdropFilter: "blur(10px)",
          background:
            "linear-gradient(180deg, rgba(15,23,42,0.9), rgba(15,23,42,0.55))",
          borderBottom: "1px solid rgba(148,163,184,0.35)",
        }}
      >
        {/* Back arrow placed inside nav (left of logo) */}
        <div style={{ display: "flex", alignItems: "center" }}>
          <BackButton
            label="←"
            styleOverride={{
              fontSize: 20,
              fontWeight: 900,
              color: "#e5f2ff",
            }}
          />
        </div>

        <div
          className="logo"
          style={{
            fontWeight: 800,
            fontSize: 20,
            letterSpacing: 0.4,
            color: "#f9fafb",
            marginLeft: 6,
          }}
        >
          <span style={{ color: "#bae6fd" }}>Tuseef</span> Dashboard
        </div>

        <div
          className="menu"
          style={{
            marginLeft: "auto",
            display: "flex",
            gap: 20,
            fontSize: 14,
          }}
        >
          {["Home", "About", "Services"].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              style={{
                color: "#e2e8f0",
                textDecoration: "none",
                position: "relative",
                paddingBottom: 2,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#ffffff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "#e2e8f0";
              }}
            >
              {item}
            </a>
          ))}
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
            gap: 28,
            alignItems: "stretch",
            justifyContent: "space-between",
            padding: 26,
            borderRadius: 20,
            boxShadow: "0 26px 70px rgba(15,23,42,0.75)",
            backdropFilter: "blur(14px)",
            background: colors.cardBg,
            border: "1px solid rgba(148,163,184,0.55)",
          }}
        >
          {/* LEFT SECTION */}
          <div style={{ flex: 1.35, color: "#fff", display: "flex", flexDirection: "column" }}>
            {/* small badge row */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "4px 10px",
                borderRadius: 999,
                background: "rgba(34,197,94,0.16)",
                color: "#bbf7d0",
                fontSize: 12,
                fontWeight: 600,
                marginBottom: 10,
                width: "fit-content",
              }}
            >
              <span>✨ Smart Money Control</span>
            </div>

            <h1
              style={{
                margin: 0,
                fontSize: 34,
                fontWeight: 800,
                letterSpacing: 0.4,
                color: "#f9fafb",
                textShadow: "0 16px 30px rgba(0,0,0,0.55)",
              }}
            >
              Welcome to your financial cockpit
            </h1>

            <p
              style={{
                marginTop: 12,
                color: "#e5e7eb",
                fontSize: 15,
                lineHeight: 1.6,
                maxWidth: 560,
              }}
            >
              Track income, control expenses, and see your money clearly in one
              clean view. Add transactions, view history, and let your monthly
              summary update in real time — no spreadsheets required.
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0, 1.2fr) minmax(0, 1fr)",
                gap: 10,
                marginTop: 14,
              }}
            >
              <ul
                style={{
                  margin: 0,
                  color: "#f1f5f9",
                  fontSize: 14,
                  paddingLeft: 18,
                  lineHeight: 1.6,
                }}
              >
                <li>Instantly add income & expenses</li>
                <li>One-click edit or delete entries</li>
                <li>Monthly totals, category trends & history</li>
              </ul>

              <div
                style={{
                  fontSize: 12,
                  color: "#cbd5f5",
                  padding: "10px 12px",
                  borderRadius: 12,
                  background:
                    "linear-gradient(135deg, rgba(15,118,110,0.45), rgba(30,64,175,0.3))",
                  border: "1px solid rgba(148,163,184,0.55)",
                }}
              >
                <div style={{ fontWeight: 700, marginBottom: 4 }}>
                  Built for clarity
                </div>
                <div>
                  A clean dashboard, focused on what matters: how much comes in,
                  how much goes out, and where it all goes.
                </div>
              </div>
            </div>

            {/* MAIN BUTTON + helper text */}
            <div
              style={{
                marginTop: 22,
                display: "flex",
                alignItems: "center",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <button
                onClick={() => navigate("/login")}
                style={{
                  padding: "14px 28px",
                  borderRadius: 999,
                  fontSize: 16,
                  fontWeight: 800,
                  border: "0",
                  cursor: "pointer",
                  color: "#f9fafb",
                  background: `linear-gradient(180deg, ${colors.primary}, ${colors.primaryDark})`,
                  boxShadow:
                    "0 18px 38px rgba(16,185,129,0.45), inset 0 -5px 16px rgba(0,0,0,0.18)",
                  transition: "transform 0.18s ease, box-shadow 0.18s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform =
                    "translateY(-3px) scale(1.02)";
                  e.currentTarget.style.boxShadow =
                    "0 22px 46px rgba(16,185,129,0.60), inset 0 -6px 18px rgba(0,0,0,0.2)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0) scale(1)";
                  e.currentTarget.style.boxShadow =
                    "0 18px 38px rgba(16,185,129,0.45), inset 0 -5px 16px rgba(0,0,0,0.18)";
                }}
              >
                Start using Balance board
              </button>

              <span
                style={{
                  fontSize: 12,
                  color: "#cbd5f5",
                }}
              >
                No complex setup. Just sign in and start tracking.
              </span>
            </div>
          </div>

          {/* RIGHT BOX */}
          <aside
            style={{
              flex: 0.9,
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <div
              style={{
                borderRadius: 16,
                padding: 14,
                background:
                  "linear-gradient(145deg, rgba(15,23,42,0.85), rgba(30,64,175,0.9))",
                border: "1px solid rgba(148,163,184,0.6)",
                boxShadow: "0 18px 40px rgba(15,23,42,0.7)",
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  color: "#bae6fd",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: 0.04,
                }}
              >
                Why Balance Board?
              </div>
              <p
                style={{
                  marginTop: 8,
                  color: "#e5e7eb",
                  fontSize: 13,
                  lineHeight: 1.5,
                }}
              >
                Get a quick snapshot of your month in seconds. Add a
                transaction, see its impact on your balance instantly, and
                keep overspending in check without any spreadsheets.
              </p>

              <div
                style={{
                  marginTop: 8,
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                  fontSize: 12,
                  color: "#cbd5f5",
                }}
              >
                <div>• Private by default – your data stays with you.</div>
                <div>• Works great on desktop and mobile.</div>
                <div>• Designed for testers & working professionals.</div>
              </div>
            </div>

            <div
              style={{
                borderRadius: 14,
                padding: 10,
                background: "rgba(15,23,42,0.65)",
                border: "1px dashed rgba(148,163,184,0.6)",
                color: "#e2e8f0",
                fontSize: 11,
                lineHeight: 1.5,
              }}
            >
              💡 Tip: Once you sign in, head to the Dashboard to set your
              monthly budgets and see live alerts as you spend.
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
