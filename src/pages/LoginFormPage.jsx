// src/pages/LoginFormPage.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginWithUsername } from "../utils/auth";

export default function LoginFormPage() {
  const [username, setUsername] = useState(""); // expects auto-generated username (first.middle.last)
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e && e.preventDefault();
    setError("");
    if (!username.trim()) return setError("Username required");
    if (!password) return setError("Password required");

    setLoading(true);
    try {
      await loginWithUsername(username.trim().toLowerCase(), password);
      navigate("/dashboard");
    } catch (err) {
      if (err && err.message === "user_not_found") {
        setError("User not found");
      } else if (err && err.message === "invalid_credentials") {
        setError("Invalid password");
      } else {
        setError("Login failed");
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        .lg-root { min-height:100vh; display:flex; align-items:center; justify-content:center; background: linear-gradient(180deg,#031026,#0b2b5d); padding:20px; font-family:Inter,system-ui,Arial }
        .lg-card { width:100%; max-width:420px; padding:28px; border-radius:14px; background: rgba(255,255,255,0.04); backdrop-filter: blur(8px); color:white; border:1px solid rgba(255,255,255,0.08); box-shadow:0 12px 34px rgba(0,0,0,0.5) }
        .lg-h { margin:0 0 8px 0; font-size:22px; font-weight:700 }
        .lg-sub { margin:0 0 16px 0; color:rgba(255,255,255,0.9) }
        .lg-inp { width:100%; padding:12px 14px; border-radius:10px; border:1px solid rgba(255,255,255,0.08); margin-bottom:12px; background:rgba(255,255,255,0.02); color:white }
        .lg-btn { width:100%; padding:12px 14px; border-radius:999px; border:none; cursor:pointer; background:linear-gradient(90deg,#6fb8ff,#4f9efb); color:#05263e; font-weight:800 }
        .lg-err { background: rgba(255,100,100,0.12); color:#ffdede; padding:8px 10px; border-radius:8px; margin-bottom:10px }
      `}</style>

      <div className="lg-root">
        <form className="lg-card" onSubmit={handleSubmit}>
          <h2 className="lg-h">Login</h2>
          <p className="lg-sub">Enter your username and password</p>

          {error && <div className="lg-err">{error}</div>}

          <input className="lg-inp" placeholder="Username (first.last or first.middle.last)" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" />
          <input className="lg-inp" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />

          <button className="lg-btn" type="submit" disabled={loading}>{loading ? "Logging in..." : "Login"}</button>
        </form>
      </div>
    </>
  );
}
