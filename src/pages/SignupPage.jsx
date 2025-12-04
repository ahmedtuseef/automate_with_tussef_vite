// src/pages/SignupPage.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
} from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";

import { auth } from "../firebase";
import BackButton from "../components/BackButton";

// 🔐 Helper: password strength evaluator
function evaluatePasswordStrength(password) {
  if (!password) {
    return { label: "", percent: 0, color: "#9ca3af" };
  }

  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  // 0–2 weak, 3–4 medium, 5–6 strong
  if (score <= 2) {
    return { label: "Weak", percent: 34, color: "#f97373" };
  } else if (score <= 4) {
    return { label: "Medium", percent: 67, color: "#facc15" };
  } else {
    return { label: "Strong", percent: 100, color: "#22c55e" };
  }
}

export default function SignupPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    phone: "",
    dob: "",
    password: "",
    confirm: "",
    agree: false,
    username: "",
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function validate() {
    const e = {};
    if (!form.firstName.trim()) e.firstName = "First name is required";
    if (!form.lastName.trim()) e.lastName = "Last name is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/^\S+@\S+\.\S+$/.test(form.email))
      e.email = "Enter a valid email";
    if (!form.phone.trim()) e.phone = "Phone is required";
    else if (!/^[0-9\-\+\s()]{7,20}$/.test(form.phone))
      e.phone = "Enter a valid phone";
    if (!form.dob) e.dob = "Date of birth is required";
    if (!form.password) e.password = "Password is required";
    else if (form.password.length < 6) e.password = "Password must be 6+ chars";
    if (!form.confirm) e.confirm = "Please confirm password";
    else if (form.password !== form.confirm)
      e.confirm = "Passwords do not match";
    if (!form.agree) e.agree = "You must agree to Terms";
    return e;
  }

  async function onSubmit(e) {
    e.preventDefault();
    const eobj = validate();
    if (Object.keys(eobj).length) {
      setErrors(eobj);
      return;
    }

    setSubmitting(true);

    try {
      // Create user with Firebase Auth
      const userCred = await createUserWithEmailAndPassword(
        auth,
        form.email.trim(),
        form.password
      );

      const user = userCred.user;

      // update displayName (First Last)
      try {
        const displayName = `${form.firstName.trim()} ${form.lastName.trim()}`;
        await updateProfile(user, { displayName });
      } catch (updErr) {
        console.warn("updateProfile failed:", updErr);
      }

      // save extra user data to Firestore (optional)
      try {
        const db = getFirestore();
        const userDocRef = doc(db, "users", user.uid);
        await setDoc(userDocRef, {
          uid: user.uid,
          firstName: form.firstName.trim(),
          middleName: form.middleName.trim() || null,
          lastName: form.lastName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          dob: form.dob,
          username: form.username?.trim() || null,
          createdAt: new Date().toISOString(),
          emailVerified: false,
        });
      } catch (dbErr) {
        console.warn("Could not save user to Firestore (optional):", dbErr);
      }

      // ✉️ Send email verification
      try {
        await sendEmailVerification(user, {
          // optional: handle in Firebase console / custom domain
          url: window.location.origin + "/verify-email",
        });
      } catch (verr) {
        console.warn("sendEmailVerification failed:", verr);
      }

      alert(
        `Account created for ${form.firstName} ${form.lastName} ✓\n\nPlease verify your email before logging in.`
      );

      // Go to Verify Email page
      navigate("/verify-email", {
        replace: true,
        state: { email: form.email.trim() },
      });
    } catch (err) {
      console.error("Signup error:", err);
      const msg =
        err && err.code
          ? firebaseErrorMessage(err.code)
          : err.message || "Signup failed";
      alert(msg);
    } finally {
      setSubmitting(false);
    }
  }

  function firebaseErrorMessage(code) {
    switch (code) {
      case "auth/email-already-in-use":
        return "This email is already registered. Try logging in or reset your password.";
      case "auth/invalid-email":
        return "Invalid email address.";
      case "auth/weak-password":
        return "Weak password — it should be at least 6 characters.";
      case "auth/network-request-failed":
        return "Network error. Check your connection and try again.";
      default:
        return "Signup failed. " + (code || "");
    }
  }

  const passwordStrength = evaluatePasswordStrength(form.password);

  return (
    <div
      className="app-shell"
      style={{
        minHeight: "100vh",
        background: "url('/background.jpg') center/cover no-repeat",
        display: "flex",
        flexDirection: "column",
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
        <div style={{ display: "flex", alignItems: "center" }}>
          <BackButton
            label="←"
            styleOverride={{ fontSize: 18, fontWeight: 800, color: "#e5f2ff" }}
          />
        </div>

        <div
          className="logo"
          style={{
            fontWeight: 800,
            fontSize: 20,
            letterSpacing: 0.4,
            marginLeft: 6,
            color: "#f9fafb",
          }}
        >
          Balance <span style={{ color: "#bae6fd" }}>board</span>
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

      {/* CENTER CARD */}
      <div
        className="center-wrapper"
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 16px",
        }}
      >
        <div
          className="glass-card"
          style={{
            maxWidth: 760,
            width: "96%",
            padding: 28,
            borderRadius: 18,
            background:
              "linear-gradient(140deg, rgba(15,23,42,0.96), rgba(30,64,175,0.9))",
            boxShadow: "0 26px 70px rgba(15,23,42,0.8)",
            border: "1px solid rgba(148,163,184,0.6)",
            color: "#f9fafb",
          }}
        >
          {/* small badge + title */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: 4,
            }}
          >
            <div
              style={{
                padding: "3px 10px",
                borderRadius: 999,
                background: "rgba(34,197,94,0.18)",
                color: "#bbf7d0",
                fontSize: 11,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: 0.06,
              }}
            >
              Step 1 • Create your free account
            </div>
          </div>

          <h2
            style={{
              fontSize: 30,
              fontWeight: 800,
              textAlign: "center",
              marginTop: 10,
              marginBottom: 4,
            }}
          >
            Create your account
          </h2>
          <p
            style={{
              textAlign: "center",
              opacity: 0.9,
              marginBottom: 20,
              fontSize: 14,
            }}
          >
            Join with <strong>Tuseef’s Balance board</strong> and manage income,
            expenses and budgets in one place.
          </p>
          <form onSubmit={onSubmit} noValidate>
            {/* NAME ROW */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: 12,
              }}
            >
              <div>
                <label style={{ fontSize: 13, color: "#cbd5f5" }}>
                  First name *
                </label>
                <input
                  className="input"
                  value={form.firstName}
                  onChange={(e) => update("firstName", e.target.value)}
                  placeholder="First name"
                />
                {errors.firstName && (
                  <div style={{ color: "#fecaca", fontSize: 12, marginTop: 4 }}>
                    {errors.firstName}
                  </div>
                )}
              </div>

              <div>
                <label style={{ fontSize: 13, color: "#cbd5f5" }}>
                  Middle name (optional)
                </label>
                <input
                  className="input"
                  value={form.middleName}
                  onChange={(e) => update("middleName", e.target.value)}
                  placeholder="Middle name (optional)"
                />
              </div>

              <div>
                <label style={{ fontSize: 13, color: "#cbd5f5" }}>
                  Last name *
                </label>
                <input
                  className="input"
                  value={form.lastName}
                  onChange={(e) => update("lastName", e.target.value)}
                  placeholder="Last name"
                />
                {errors.lastName && (
                  <div style={{ color: "#fecaca", fontSize: 12, marginTop: 4 }}>
                    {errors.lastName}
                  </div>
                )}
              </div>
            </div>

            {/* EMAIL / PHONE */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
                marginTop: 12,
              }}
            >
              <div>
                <label style={{ fontSize: 13, color: "#cbd5f5" }}>
                  Email *
                </label>
                <input
                  className="input"
                  type="email"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  placeholder="you@email.com"
                />
                {errors.email && (
                  <div style={{ color: "#fecaca", fontSize: 12, marginTop: 4 }}>
                    {errors.email}
                  </div>
                )}
              </div>

              <div>
                <label style={{ fontSize: 13, color: "#cbd5f5" }}>
                  Phone *
                </label>
                <input
                  className="input"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => update("phone", e.target.value)}
                  placeholder="+91 300 1234567"
                />
                {errors.phone && (
                  <div style={{ color: "#fecaca", fontSize: 12, marginTop: 4 }}>
                    {errors.phone}
                  </div>
                )}
              </div>
            </div>

            {/* DOB / USERNAME */}
            <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 13, color: "#cbd5f5" }}>
                  Date of birth *
                </label>
                <input
                  className="input"
                  type="date"
                  value={form.dob}
                  onChange={(e) => update("dob", e.target.value)}
                  max={new Date().toISOString().split("T")[0]}
                />
                {errors.dob && (
                  <div style={{ color: "#fecaca", fontSize: 12, marginTop: 4 }}>
                    {errors.dob}
                  </div>
                )}
              </div>

              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 13, color: "#cbd5f5" }}>
                  Username (optional)
                </label>
                <input
                  className="input"
                  value={form.username}
                  onChange={(e) => update("username", e.target.value)}
                  placeholder="Choose a username"
                />
              </div>
            </div>

            {/* PASSWORDS */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
                marginTop: 12,
              }}
            >
              <div>
                <label style={{ fontSize: 13, color: "#cbd5f5" }}>
                  Password *
                </label>
                <input
                  className="input"
                  type="password"
                  value={form.password}
                  onChange={(e) => update("password", e.target.value)}
                  placeholder="Create password"
                />
                {errors.password && (
                  <div style={{ color: "#fecaca", fontSize: 12, marginTop: 4 }}>
                    {errors.password}
                  </div>
                )}

                {/* 🔋 Password Strength Indicator */}
                {form.password && (
                  <div style={{ marginTop: 6 }}>
                    <div
                      style={{
                        height: 6,
                        borderRadius: 999,
                        background: "rgba(148,163,184,0.6)",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${passwordStrength.percent}%`,
                          height: "100%",
                          background: passwordStrength.color,
                          transition: "width 0.25s ease",
                        }}
                      />
                    </div>
                    <div
                      style={{
                        marginTop: 4,
                        fontSize: 11,
                        color: passwordStrength.color,
                        fontWeight: 600,
                      }}
                    >
                      {passwordStrength.label} password
                    </div>
                  </div>
                )}

                {!errors.password && !form.password && (
                  <div
                    style={{
                      fontSize: 11,
                      color: "#a5b4fc",
                      marginTop: 4,
                    }}
                  >
                    Tip: Use at least 8 characters, a mix of letters, numbers &
                    symbols.
                  </div>
                )}
              </div>

              <div>
                <label style={{ fontSize: 13, color: "#cbd5f5" }}>
                  Confirm password *
                </label>
                <input
                  className="input"
                  type="password"
                  value={form.confirm}
                  onChange={(e) => update("confirm", e.target.value)}
                  placeholder="Repeat password"
                />
                {errors.confirm && (
                  <div style={{ color: "#fecaca", fontSize: 12, marginTop: 4 }}>
                    {errors.confirm}
                  </div>
                )}
              </div>
            </div>

            {/* TERMS */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginTop: 14,
              }}
            >
              <label
                className="checkbox"
                style={{ cursor: "pointer", fontSize: 13, color: "#e5e7eb" }}
              >
                <input
                  type="checkbox"
                  checked={form.agree}
                  onChange={(e) => update("agree", e.target.checked)}
                  style={{ width: 16, height: 16 }}
                />
                <span style={{ marginLeft: 8 }}>
                  I agree to the{" "}
                  <span style={{ textDecoration: "underline" }}>
                    Terms & Conditions
                  </span>
                </span>
              </label>
            </div>
            {errors.agree && (
              <div style={{ color: "#fecaca", fontSize: 12, marginTop: 4 }}>
                {errors.agree}
              </div>
            )}

            {/* ACTIONS */}
            <div
              style={{
                marginTop: 20,
                display: "flex",
                gap: 12,
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <div style={{ fontSize: 12, color: "#cbd5f5" }}>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#38bdf8",
                    cursor: "pointer",
                    padding: 0,
                    textDecoration: "underline",
                    fontSize: 12,
                  }}
                >
                  Log in
                </button>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 10,
                  justifyContent: "flex-end",
                }}
              >
                <button
                  type="button"
                  className="ghost-btn"
                  onClick={() => navigate(-1)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button type="submit" className="lg-btn" disabled={submitting}>
                  {submitting ? "Creating..." : "Create account"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
