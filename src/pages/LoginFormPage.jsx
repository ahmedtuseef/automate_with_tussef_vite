// src/pages/LoginFormPage.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase';

export default function LoginFormPage(){
  const navigate = useNavigate();

  const [email,setEmail] = useState('');
  const [password,setPassword] = useState('');
  const [remember,setRemember] = useState(true);

  // forgot/reset modal
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  const [loading, setLoading] = useState(false);

  // Prefill email if previously remembered
  useEffect(() => {
    try {
      const saved = localStorage.getItem('lw_email');
      if (saved) setEmail(saved);
    } catch (err) {
      // ignore localStorage errors
    }
  }, []);

  async function onSubmit(e){
    e.preventDefault();
    if (!email || !password) {
      alert('Please enter email and password.');
      return;
    }

    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      // Save email if remember checked
      try {
        if (remember) localStorage.setItem('lw_email', email.trim());
        else localStorage.removeItem('lw_email');
      } catch (err) { /* ignore storage errors */ }

      // Navigate to dashboard (or wherever)
      navigate('/dashboard');
    } catch (err) {
      console.error('Login error', err);
      alert(firebaseErrorMessage(err.code || err.message));
    } finally {
      setLoading(false);
    }
  }

  async function sendResetLink(){
    const target = resetEmail.trim() || email.trim();
    if (!target) {
      alert('Please enter an email to receive the reset link.');
      return;
    }

    try {
      await sendPasswordResetEmail(auth, target);
      alert(`Password reset email sent to ${target}. Check your inbox.`);
      setShowReset(false);
      setResetEmail('');
    } catch (err) {
      console.error('Reset error', err);
      alert(firebaseErrorMessage(err.code || err.message));
    }
  }

  function firebaseErrorMessage(code) {
    // common firebase v9 auth error codes
    switch (code) {
      case 'auth/user-not-found':
      case 'auth/user-disabled':
        return 'No account found with this email.';
      case 'auth/wrong-password':
        return 'Incorrect password. Try again or reset your password.';
      case 'auth/invalid-email':
        return 'Invalid email address.';
      case 'auth/too-many-requests':
        return 'Too many attempts. Please try again later.';
      case 'auth/network-request-failed':
        return 'Network error. Check your connection and try again.';
      default:
        // fallback - if code is a long message, return it
        return typeof code === 'string' && code.startsWith('auth/') ? `Authentication error (${code}).` : (code || 'Login failed. Try again.');
    }
  }

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

      {/* PAGE CENTER */}
      <div className="center-wrapper">
        <div className="glass-card" role="region" aria-label="Login" style={{ width: 460, padding: '40px 36px' }}>

          <h2 style={{ fontSize: "36px", fontWeight: 900, textAlign: "center", marginBottom: 8 }}>Login</h2>
          <p style={{textAlign:'center', opacity:0.9, marginBottom: 18}}>Welcome back — sign in to continue</p>

          <form onSubmit={onSubmit} aria-label="Login form">

            {/* EMAIL */}
            <div className="field" style={{marginTop:6}}>
              <label htmlFor="email">Email</label>
              <input
                id="email"
                className="input"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                type="email"
                required
              />
              <span className="icon" aria-hidden>
                <svg width="16" height="12" viewBox="0 0 24 18" fill="none">
                  <path d="M2 3H22V15H2V3Z" stroke="rgba(255,255,255,0.8)" strokeWidth="1.2"/>
                  <path d="M22 3L12 11L2 3" stroke="rgba(255,255,255,0.8)" strokeWidth="1.2"/>
                </svg>
              </span>
            </div>

            {/* PASSWORD */}
            <div className="field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                className="input"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                type="password"
                required
              />
              <span className="icon" aria-hidden>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="11" width="18" height="10" rx="2" stroke="rgba(255,255,255,0.8)" strokeWidth="1.2"/>
                  <path d="M7 11V8a5 5 0 1110 0v3" stroke="rgba(255,255,255,0.8)" strokeWidth="1.2"/>
                </svg>
              </span>
            </div>

            {/* Row: remember + forgot */}
            <div className="row" style={{marginTop:8}}>
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={e => setRemember(e.target.checked)}
                  style={{width:16,height:16}}
                />
                <span style={{marginLeft:8}}>Remember me</span>
              </label>

              <button
                type="button"
                className="forgot-btn"
                onClick={()=>setShowReset(true)}
                aria-haspopup="dialog"
              >
                Forgot password?
              </button>
            </div>

            {/* BIG PILL LOGIN BUTTON */}
            <button className="pill-login-btn" type="submit" aria-label="Login" disabled={loading}>
              {loading ? 'Signing in...' : 'Login'}
            </button>

            {/* FIXED CREATE ACCOUNT BUTTON */}
            <div className="small" style={{marginTop:12, textAlign:'center'}}>
              New here?
              <button
                onClick={() => navigate('/signup')}
                style={{
                  background:'transparent',
                  color:'#e9f7ff',
                  textDecoration:'underline',
                  border:'none',
                  cursor:'pointer',
                  marginLeft:6
                }}
              >
                Create an account
              </button>
            </div>

          </form>
        </div>
      </div>

      {/* Reset Password Modal */}
      {showReset && (
        <div className="overlay" role="dialog" aria-modal="true" aria-label="Reset password dialog">
          <div className="reset-modal">
            <h3 style={{margin:0, marginBottom:8}}>Reset password</h3>
            <p style={{margin:0, opacity:0.9, marginBottom:12}}>Enter your email to receive a reset link</p>
            <input
              className="input"
              placeholder="your@email.com"
              value={resetEmail}
              onChange={e=>setResetEmail(e.target.value)}
              style={{marginBottom:12}}
            />
            <div style={{display:'flex', gap:10, justifyContent:'flex-end'}}>
              <button className="ghost-btn" onClick={()=>setShowReset(false)}>Cancel</button>
              <button className="lg-btn" onClick={sendResetLink}>Send link</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
