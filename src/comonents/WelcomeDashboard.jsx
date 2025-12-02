import React from "react";

const WelcomeDashboard = ({ onStart }) => {
  return (
    <>
      <style>{`
        .welcome-root {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          text-align: center;
          background: linear-gradient(135deg, #0f172a, #1e3a8a, #3b82f6);
          font-family: "Poppins", sans-serif;
          color: white;
        }

        .welcome-card {
          background: rgba(255, 255, 255, 0.12);
          padding: 40px 50px;
          border-radius: 20px;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.2);
          box-shadow: 0 8px 30px rgba(0,0,0,0.3);
          max-width: 650px;
        }

        .welcome-title {
          font-size: 38px;
          margin-bottom: 12px;
          font-weight: 700;
        }

        .welcome-sub {
          font-size: 18px;
          opacity: 0.9;
          margin-bottom: 30px;
        }

        .start-btn {
          padding: 14px 40px;
          font-size: 20px;
          border-radius: 50px;
          border: none;
          background: white;
          color: #1e3a8a;
          font-weight: 700;
          cursor: pointer;
          transition: 0.3s;
          box-shadow: 0 6px 15px rgba(255,255,255,0.3);
        }

        .start-btn:hover {
          transform: scale(1.07);
          box-shadow: 0 10px 25px rgba(255,255,255,0.4);
        }
      `}</style>

      <div className="welcome-root">
        <div className="welcome-card">
          <h1 className="welcome-title">Welcome to AutomateWithTuseef World 🌍</h1>
          <p className="welcome-sub">
            Automate, test and ship faster 🚀
          </p>

          <button
            onClick={onStart}
            className="start-btn"
            aria-label="start-button"
          >
            Start ✨
          </button>
        </div>
      </div>
    </>
  );
};

export default WelcomeDashboard;
