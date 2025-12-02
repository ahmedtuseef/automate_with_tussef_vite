import React from "react";
import bgImage from "../assets/bg.jpg"; // keep file existing and lowercase

function MainDashboard() {
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundImage: `url(${bgImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Dark overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(135deg, rgba(0,0,0,0.65), rgba(0,0,0,0.35))",
          zIndex: 0,
        }}
      />

      {/* Floating particles */}
      <div
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          background:
            "radial-gradient(circle at 20% 30%, rgba(255,255,255,0.12), transparent 60%), radial-gradient(circle at 80% 70%, rgba(255,255,255,0.12), transparent 60%)",
          zIndex: 0,
          opacity: 0.4,
        }}
      />

      {/* Glass container */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          width: "90%",
          maxWidth: "700px",
          padding: "40px 30px",
          borderRadius: "18px",
          background: "rgba(255,255,255,0.08)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(255,255,255,0.18)",
          textAlign: "center",
          color: "white",
          boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
          animation: "fadeIn 1.2s ease",
        }}
      >
        <h1
          style={{
            fontSize: "46px",
            marginBottom: "10px",
            fontWeight: "800",
            letterSpacing: "1px",
          }}
        >
          Welcome, <span style={{ color: "#4fd2ff" }}>Tuseef</span> 👋
        </h1>

        <p
          style={{
            fontSize: "18px",
            marginBottom: "35px",
            opacity: 0.85,
          }}
        >
          Your automation dashboard is ready to explore.
        </p>

        {/* action buttons */}
        <div
          style={{
            display: "flex",
            gap: "15px",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <button className="dash-btn" style={buttonStyle}>
            Profile
          </button>
          <button className="dash-btn" style={buttonStyle}>
            Settings
          </button>
          <button className="dash-btn" style={{ ...buttonStyle, background: "linear-gradient(90deg,#ff7373,#ff4747)" }}>
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

const buttonStyle = {
  padding: "12px 28px",
  border: "none",
  borderRadius: "999px",
  fontSize: "15px",
  fontWeight: "600",
  cursor: "pointer",
  color: "#082444",
  background: "linear-gradient(90deg,#6fb8ff,#4f9efb)",
  boxShadow: "0 6px 18px rgba(0,0,0,0.3)",
  transition: "0.2s",
};

export default MainDashboard;
