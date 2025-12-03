// src/pages/SignupPage.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";

import { auth } from "../firebase";
import BackButton from "../components/BackButton";

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
        // non-fatal
        console.warn("updateProfile failed:", updErr);
      }

      // Try to save extra user data to Firestore (optional)
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
        });
      } catch (dbErr) {
        // Firestore might not be enabled — warn but allow signup to succeed
        console.warn("Could not save user to Firestore (optional):", dbErr);
      }

      alert(`Account created for ${form.firstName} ${form.lastName} ✓`);
      // navigate to login (or directly to dashboard if you prefer)
      navigate("/login");
    } catch (err) {
      console.error("Signup error:", err);
      // friendly messages for common Firebase errors
      const msg =
        err && err.code
          ? firebaseErrorMessage(err.code)
          : err.message || "Signup failed";
      alert(msg);
    } finally {
      setSubmitting(false);
    }
  }

  // map some firebase error codes to friendly messages
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

  return (
    <div className="app-shell">
      <nav
        className="top-nav"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "14px 28px",
          backdropFilter: "blur(6px)",
          background:
            "linear-gradient(180deg, rgba(2,6,23,0.55), rgba(2,6,23,0.25))",
        }}
      >
        {/* Back arrow placed inside nav (left of logo) */}
        <div style={{ display: "flex", alignItems: "center" }}>
          <BackButton
            label="←"
            styleOverride={{ fontSize: 18, fontWeight: 800, color: "#fff" }}
          />
        </div>

        <div
          className="logo"
          style={{
            fontWeight: 800,
            fontSize: 20,
            letterSpacing: 0.4,
            marginLeft: 6,
            color: "#f8fafc",
          }}
        >
          Balance <span style={{ color: "#cfeefc" }}>board</span>
        </div>

        <div className="menu" style={{ marginLeft: "auto" }}>
          <a href="#home">Home</a>
          <a href="#about">About</a>
          <a href="#services">Services</a>
        </div>
      </nav>

      <div className="center-wrapper">
        <div
          className="glass-card"
          style={{ maxWidth: 720, width: "92%", padding: 28 }}
        >
          <h2 style={{ fontSize: 30, fontWeight: 800, textAlign: "center" }}>
            Create your account
          </h2>
          <p style={{ textAlign: "center", opacity: 0.9, marginBottom: 18 }}>
            Join Learn With Tuseef — enter details below to get started
          </p>

          <form onSubmit={onSubmit} noValidate>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: 12,
              }}
            >
              <div>
                <label
                  style={{ fontSize: 13, color: "rgba(255,255,255,0.85)" }}
                >
                  First name *
                </label>
                <input
                  className="input"
                  value={form.firstName}
                  onChange={(e) => update("firstName", e.target.value)}
                  placeholder="First name"
                />
                {errors.firstName && (
                  <div style={{ color: "#ffd1d1", fontSize: 13, marginTop: 6 }}>
                    {errors.firstName}
                  </div>
                )}
              </div>

              <div>
                <label
                  style={{ fontSize: 13, color: "rgba(255,255,255,0.85)" }}
                >
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
                <label
                  style={{ fontSize: 13, color: "rgba(255,255,255,0.85)" }}
                >
                  Last name *
                </label>
                <input
                  className="input"
                  value={form.lastName}
                  onChange={(e) => update("lastName", e.target.value)}
                  placeholder="Last name"
                />
                {errors.lastName && (
                  <div style={{ color: "#ffd1d1", fontSize: 13, marginTop: 6 }}>
                    {errors.lastName}
                  </div>
                )}
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
                marginTop: 12,
              }}
            >
              <div>
                <label
                  style={{ fontSize: 13, color: "rgba(255,255,255,0.85)" }}
                >
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
                  <div style={{ color: "#ffd1d1", fontSize: 13, marginTop: 6 }}>
                    {errors.email}
                  </div>
                )}
              </div>

              <div>
                <label
                  style={{ fontSize: 13, color: "rgba(255,255,255,0.85)" }}
                >
                  Phone *
                </label>
                <input
                  className="input"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => update("phone", e.target.value)}
                  placeholder="+92 300 1234567"
                />
                {errors.phone && (
                  <div style={{ color: "#ffd1d1", fontSize: 13, marginTop: 6 }}>
                    {errors.phone}
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
              <div style={{ flex: 1 }}>
                <label
                  style={{ fontSize: 13, color: "rgba(255,255,255,0.85)" }}
                >
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
                  <div style={{ color: "#ffd1d1", fontSize: 13, marginTop: 6 }}>
                    {errors.dob}
                  </div>
                )}
              </div>

              <div style={{ flex: 1 }}>
                <label
                  style={{ fontSize: 13, color: "rgba(255,255,255,0.85)" }}
                >
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

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
                marginTop: 12,
              }}
            >
              <div>
                <label
                  style={{ fontSize: 13, color: "rgba(255,255,255,0.85)" }}
                >
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
                  <div style={{ color: "#ffd1d1", fontSize: 13, marginTop: 6 }}>
                    {errors.password}
                  </div>
                )}
              </div>

              <div>
                <label
                  style={{ fontSize: 13, color: "rgba(255,255,255,0.85)" }}
                >
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
                  <div style={{ color: "#ffd1d1", fontSize: 13, marginTop: 6 }}>
                    {errors.confirm}
                  </div>
                )}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginTop: 14,
              }}
            >
              <label className="checkbox" style={{ cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={form.agree}
                  onChange={(e) => update("agree", e.target.checked)}
                  style={{ width: 16, height: 16 }}
                />
                <span style={{ marginLeft: 8 }}>
                  I agree to the Terms & Conditions
                </span>
              </label>
            </div>
            {errors.agree && (
              <div style={{ color: "#ffd1d1", fontSize: 13, marginTop: 8 }}>
                {errors.agree}
              </div>
            )}

            <div
              style={{
                marginTop: 18,
                display: "flex",
                gap: 12,
                justifyContent: "flex-end",
                alignItems: "center",
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
          </form>
        </div>
      </div>
    </div>
  );
}
