// src/pages/LoginFormPage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "../firebase";

import BackButton from "../components/BackButton";

export default function LoginFormPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);

  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("lw_email");
      if (saved) setEmail(saved);
    } catch {}
  }, []);

  async function onSubmit(e) {
    e.preventDefault();
    if (!email || !password) return alert("Please enter email & password");

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);

      if (remember) localStorage.setItem("lw_email", email.trim());
      else localStorage.removeItem("lw_email");

      navigate("/dashboard");
    } catch (err) {
      alert(firebaseErrorMessage(err.code));
    } finally {
      setLoading(false);
    }
  }

  async function sendResetLink() {
    const target = resetEmail.trim() || email.trim();
    if (!target) return alert("Enter an email first.");

    try {
      await sendPasswordResetEmail(auth, target);
      alert("Reset email sent.");
      setShowReset(false);
    } catch (err) {
      alert(firebaseErrorMessage(err.code));
    }
  }

  function firebaseErrorMessage(code) {
    switch (code) {
      case "auth/user-not-found":
        return "No account found with this email.";
      case "auth/wrong-password":
        return "Wrong password.";
      case "auth/invalid-email":
        return "Invalid email.";
      default:
        return "Login failed.";
    }
  }

  return (
    <div
      className="app-shell"
      style={{
        minHeight: "100vh",
        background: "url('/background.jpg') center/cover no-repeat",
      }}
    >
      {/* TOP NAV */}
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "14px 28px",
          backdropFilter: "blur(10px)",
          background:
            "linear-gradient(180deg, rgba(15,23,42,0.75), rgba(15,23,42,0.45))",
          borderBottom: "1px solid rgba(255,255,255,0.12)",
        }}
      >
        <BackButton
          label="←"
          styleOverride={{ fontSize: 20, fontWeight: 900, color: "#fff" }}
        />

        <div
          style={{
            fontWeight: 800,
            fontSize: 20,
            color: "#f8fafc",
            letterSpacing: 0.4,
          }}
        >
          Balance <span style={{ color: "#cfeefc" }}>board</span>
        </div>

        <div style={{ marginLeft: "auto", display: "flex", gap: 20 }}>
          {["Home", "About", "Services"].map((t) => (
            <a
              key={t}
              href={`#${t.toLowerCase()}`}
              style={{
                color: "#e2e8f0",
                textDecoration: "none",
                fontSize: 14,
              }}
            >
              {t}
            </a>
          ))}
        </div>
      </nav>

      {/* CENTER FORM */}
      <div
        style={{
          minHeight: "calc(100vh - 90px)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: 20,
        }}
      >
        <div
          style={{
            width: 460,
            padding: "42px 38px",
            borderRadius: 18,
            backdropFilter: "blur(18px)",
            background:
              "linear-gradient(135deg, rgba(15,23,42,0.80), rgba(30,58,138,0.75))",
            boxShadow: "0 28px 65px rgba(0,0,0,0.55)",
            border: "1px solid rgba(255,255,255,0.18)",
          }}
        >
          <h2
            style={{
              fontSize: 34,
              fontWeight: 900,
              textAlign: "center",
              color: "#fff",
              marginBottom: 6,
            }}
          >
            Login
          </h2>

          <p
            style={{
              textAlign: "center",
              color: "rgba(255,255,255,0.85)",
              marginBottom: 22,
            }}
          >
            Welcome back — continue your financial journey
          </p>

          <form onSubmit={onSubmit}>
            {/* Email */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ color: "#e2e8f0", fontSize: 14 }}>Email</label>
              <input
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: 10,
                  marginTop: 6,
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.18)",
                  color: "#fff",
                }}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: 6 }}>
              <label style={{ color: "#e2e8f0", fontSize: 14 }}>Password</label>
              <input
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: 10,
                  marginTop: 6,
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.18)",
                  color: "#fff",
                }}
              />
            </div>

            {/* Remember + Forgot */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: 12,
                marginBottom: 14,
              }}
            >
              <label style={{ color: "#e5f2ff", fontSize: 13 }}>
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  style={{ marginRight: 6 }}
                />
                Remember me
              </label>

              <button
                type="button"
                onClick={() => setShowReset(true)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#bae6fd",
                  fontSize: 13,
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
              >
                Forgot password?
              </button>
            </div>

            {/* LOGIN BUTTON */}
            <button
              type="submit"
              style={{
                width: "100%",
                padding: "14px 0",
                borderRadius: 999,
                background:
                  "linear-gradient(180deg, #10b981, #059669 80%, #047857)",
                color: "#fff",
                fontSize: 17,
                fontWeight: 800,
                border: "none",
                cursor: "pointer",
                marginTop: 8,
                boxShadow: "0 16px 40px rgba(16,185,129,0.4)",
                transition: "0.2s ease",
              }}
            >
              {loading ? "Signing in…" : "Login"}
            </button>

            <div
              style={{
                marginTop: 14,
                textAlign: "center",
                color: "#dbeafe",
                fontSize: 13,
              }}
            >
              New here?{" "}
              <span
                onClick={() => navigate("/signup")}
                style={{
                  cursor: "pointer",
                  color: "#fff",
                  textDecoration: "underline",
                }}
              >
                Create an account
              </span>
            </div>
          </form>
        </div>
      </div>

      {/* RESET MODAL */}
      {showReset && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            backdropFilter: "blur(6px)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div
            style={{
              width: 360,
              padding: 24,
              borderRadius: 14,
              background:
                "linear-gradient(135deg, rgba(15,23,42,0.90), rgba(30,58,138,0.85))",
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.2)",
            }}
          >
            <h3 style={{ margin: 0 }}>Reset Password</h3>
            <p style={{ marginTop: 4, marginBottom: 12, opacity: 0.85 }}>
              Enter your email to receive a reset link.
            </p>

            <input
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              placeholder="your@email.com"
              style={{
                width: "100%",
                padding: 12,
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.2)",
                background: "rgba(255,255,255,0.1)",
                color: "#fff",
                marginBottom: 14,
              }}
            />

            <div
              style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}
            >
              <button
                onClick={() => setShowReset(false)}
                style={{
                  background: "transparent",
                  border: "1px solid rgba(255,255,255,0.3)",
                  padding: "8px 16px",
                  borderRadius: 8,
                  color: "#fff",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>

              <button
                onClick={sendResetLink}
                style={{
                  background: "#0ea5e9",
                  border: "none",
                  padding: "8px 18px",
                  borderRadius: 8,
                  color: "#fff",
                  cursor: "pointer",
                }}
              >
                Send Link
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
