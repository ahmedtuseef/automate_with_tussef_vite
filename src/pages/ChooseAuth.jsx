// src/pages/ChooseAuth.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function ChooseAuth() {
  const navigate = useNavigate();

  return (
    <div className="app-shell">

      {/* TOP NAV */}
      <nav className="top-nav">
        <div className="logo" style={{ fontWeight: 800, fontSize: 20, letterSpacing: 0.4 }}>
          Learn with <span style={{ color: '#cfeefc' }}>Tuseef</span>
        </div>

        <div className="menu" style={{ marginLeft: 'auto' }}>
          <a href="#home">Home</a>
          <a href="#about">About</a>
          <a href="#services">Services</a>
        </div>
      </nav>

      {/* CENTER CONTENT */}
      <div className="center-wrapper">
        <div
          className="glass-card auth-card"
          style={{ maxWidth: 480, padding: '36px 32px', textAlign: 'center' }}
        >
          <h1 style={{ margin: 0, fontSize: 36, fontWeight: 800, lineHeight: 1.05 }}>
            Welcome back
          </h1>

          <p style={{ marginTop: 12, marginBottom: 20, fontSize: 16, opacity: 0.92 }}>
            Good to see you — sign in to continue to your automation dashboard
          </p>

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button
              className="lg-btn"
              onClick={() => navigate('/login')}
              aria-label="Go to login"
            >
              Sign in to continue
            </button>
          </div>

          <p style={{ marginTop: 18, fontSize: 13, opacity: 0.8 }}>
            Need help?{' '}
            <a
              href="mailto:support@example.com"
              style={{ color: '#dff6ff', textDecoration: 'underline' }}
            >
              Contact support
            </a>
          </p>
        </div>
      </div>

    </div>
  );
}
