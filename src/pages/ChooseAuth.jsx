// src/pages/ChooseAuth.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function ChooseAuth() {
  const navigate = useNavigate();
  return (
    <div className="page-root">
      <div className="glass-card">
        <h2 className="title">Welcome back</h2>
        <p className="muted">Choose an option to continue</p>

        <div style={{display:'grid', gap:12}}>
          <button className="lg-btn" onClick={() => navigate('/login')}>Login</button>
          <button className="lg-btn ghost" onClick={() => navigate('/signup')}>Create account</button>
        </div>
      </div>
    </div>
  );
}
