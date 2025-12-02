// src/pages/SignupPage.jsx
import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { registerNewUser } from "../utils/auth";

function SignupPage() {
  const [first, setFirst] = useState("");
  const [middle, setMiddle] = useState(""); // optional
  const [last, setLast] = useState("");
  const [username, setUsername] = useState("");
  const [dob, setDob] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const dobRef = useRef(null);
  const navigate = useNavigate();

  // auto-generate username
  useEffect(() => {
    const parts = [];
    if (first.trim()) parts.push(first.trim().toLowerCase());
    if (middle.trim()) parts.push(middle.trim().toLowerCase());
    if (last.trim()) parts.push(last.trim().toLowerCase());
    setUsername(parts.join("."));
  }, [first, middle, last]);

  const openDatePicker = () => {
    if (!dobRef.current) return;
    if (typeof dobRef.current.showPicker === "function") {
      try {
        dobRef.current.showPicker();
        return;
      } catch (e) {}
    }
    dobRef.current.focus();
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");

    if (!first.trim()) return setError("First name required");
    if (!last.trim()) return setError("Last name required");
    if (!dob) return setError("Date of birth required");
    if (!password || password.length < 6)
      return setError("Password must be 6+ characters");

    setLoading(true);
    try {
      const newUser = await registerNewUser({
        first,
        middle: middle || null,
        last,
        dob,
        mobile: mobile || null,
        password,
      });
      // success — registerNewUser auto-sets current user
      navigate("/dashboard");
    } catch (err) {
      if (err && err.message === "username_taken") {
        setError("Username already exists. Try a different name.");
      } else {
        setError("Failed to create account. Try again.");
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        .su-root { min-height:100vh; display:flex; align-items:center; justify-content:center; background: linear-gradient(180deg,#031026,#0b2b5d); padding:20px; font-family:Inter,system-ui,Arial }
        .su-card { width:100%; max-width:520px; padding:28px; border-radius:14px; background: rgba(255,255,255,0.05); backdrop-filter: blur(8px); color:white; border:1px solid rgba(255,255,255,0.09); box-shadow:0 12px 34px rgba(0,0,0,0.5) }
        .su-h { margin:0 0 8px 0; font-size:22px; font-weight:700 }
        .su-sub { margin:0 0 16px 0; color:rgba(255,255,255,0.9) }
        .su-inp { width:100%; padding:12px 14px; border-radius:10px; border:1px solid rgba(255,255,255,0.12); margin-bottom:12px; background:rgba(255,255,255,0.03); color:white; outline:none }
        .su-row { display:flex; gap:10px }
        .su-date-wrapper { display:flex; gap:8px; align-items:center; margin-bottom:12px }
        .su-date-btn { padding:10px 12px; border-radius:10px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); color:rgba(255,255,255,0.9); cursor:pointer }
        .su-btn { width:100%; padding:12px 14px; border-radius:999px; border:none; cursor:pointer; background:linear-gradient(90deg,#6fb8ff,#4f9efb); color:#082444; font-weight:800; font-size:16px; box-shadow:0 8px 22px rgba(18,72,121,0.18) }
        .su-err { background: rgba(255,100,100,0.12); color:#ffdede; padding:8px 10px; border-radius:8px; margin-bottom:10px }
        .su-note { font-size:13px; color:rgba(255,255,255,0.8); margin-bottom:8px }
      `}</style>

      <div className="su-root">
        <form className="su-card" onSubmit={handleCreate}>
          <h2 className="su-h">Create Account</h2>
          <p className="su-sub">Fill your details to create a new account</p>

          {error && <div className="su-err">{error}</div>}

          <div className="su-row">
            <input className="su-inp" placeholder="First name *" value={first} onChange={(e) => setFirst(e.target.value)} />
            <input className="su-inp" placeholder="Middle name (optional)" value={middle} onChange={(e) => setMiddle(e.target.value)} />
            <input className="su-inp" placeholder="Last name *" value={last} onChange={(e) => setLast(e.target.value)} />
          </div>

          <input className="su-inp" value={username} readOnly placeholder="Auto-generated username" />

          <div className="su-date-wrapper">
            <button type="button" className="su-date-btn" onClick={openDatePicker}>Pick DOB</button>
            <input className="su-inp" type="date" ref={dobRef} value={dob} onChange={(e) => setDob(e.target.value)} />
          </div>

          <input className="su-inp" placeholder="Mobile (optional)" value={mobile} onChange={(e) => setMobile(e.target.value)} />

          <input className="su-inp" type="password" placeholder="Password (6+ chars)" value={password} onChange={(e) => setPassword(e.target.value)} />

          <div className="su-note">Username will be <strong>{username || "auto-generated"}</strong></div>

          <button className="su-btn" type="submit" disabled={loading}>{loading ? "Creating..." : "Create Account"}</button>
        </form>
      </div>
    </>
  );
}

export default SignupPage;
