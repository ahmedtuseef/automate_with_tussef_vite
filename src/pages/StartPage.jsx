// src/pages/StartPage.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function StartPage() {
  const navigate = useNavigate();
  return (
    <div className="page-root">
      <div className="glass-card start-card">
        <h1 className="title">Welcome</h1>
        <p className="muted">Start your automation journey</p>
        <button className="big-btn" onClick={() => navigate('/choose')}>Start</button>
      </div>
    </div>
  );
}
