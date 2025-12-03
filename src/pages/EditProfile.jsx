// src/pages/EditProfile.jsx
import React, { useEffect, useState } from "react";
import { auth } from "../firebase";
import { updateProfile, updateEmail, reauthenticateWithCredential, EmailAuthProvider, sendPasswordResetEmail } from "firebase/auth";
import { useNavigate } from "react-router-dom";

export default function EditProfile() {
  const navigate = useNavigate();
  const user = auth.currentUser;
  const [form, setForm] = useState({
    displayName: "",
    email: "",
    phone: "",
    dob: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null); // { type: 'success'|'error', text: '' }
  const [showReauth, setShowReauth] = useState(false);
  const [reauthPassword, setReauthPassword] = useState("");

  useEffect(() => {
    if (!user) return;
    setForm({
      displayName: user.displayName || "",
      email: user.email || "",
      phone: user.phoneNumber || "",
      dob: user?.dob || "", // if you store dob somewhere; otherwise empty
    });
  }, [user]);

  function onChange(e) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  }

  function validate() {
    if (!form.displayName.trim()) return "Name is required.";
    if (!form.email.trim()) return "Email is required.";
    // simple email regex
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return "Enter a valid email.";
    if (form.phone && !/^[0-9+\-\s]{6,20}$/.test(form.phone)) return "Enter a valid phone number.";
    if (form.dob) {
      const d = new Date(form.dob);
      if (isNaN(d)) return "Invalid date of birth.";
      if (d > new Date()) return "DOB cannot be in the future.";
    }
    return null;
  }

  async function handleSave(e) {
    e.preventDefault();
    setMessage(null);
    const err = validate();
    if (err) {
      setMessage({ type: "error", text: err });
      return;
    }

    setLoading(true);

    try {
      // 1) update displayName first (fast)
      if (form.displayName !== (user.displayName || "")) {
        await updateProfile(user, { displayName: form.displayName });
      }

      // 2) email change requires reauth if recent sign-in not available
      if (form.email !== (user.email || "")) {
        try {
          await updateEmail(user, form.email);
        } catch (err) {
          // if reauth required, show reauth UI
          if (err.code === "auth/requires-recent-login") {
            setShowReauth(true);
            setMessage({ type: "error", text: "Please re-enter your password to update email." });
            setLoading(false);
            return;
          } else {
            throw err;
          }
        }
      }

      // 3) phone & dob saved locally in this example (or to Firestore if you prefer)
      // If you want to persist phone/dob in Firestore, add code here.

      setMessage({ type: "success", text: "Profile updated successfully." });
      // optional: redirect back to dashboard after 1s
      setTimeout(() => navigate("/dashboard"), 900);
    } catch (err) {
      console.error("Update error:", err);
      setMessage({ type: "error", text: err.message || "Update failed." });
    } finally {
      setLoading(false);
    }
  }

  // Reauthenticate then retry email update (call when showReauth true)
  async function handleReauthAndSave(e) {
    e.preventDefault();
    if (!reauthPassword) return setMessage({ type: "error", text: "Enter your current password." });
    setLoading(true);
    setMessage(null);

    try {
      const cred = EmailAuthProvider.credential(user.email, reauthPassword);
      await reauthenticateWithCredential(user, cred);

      // retry email update
      if (form.email !== user.email) {
        await updateEmail(user, form.email);
      }

      // update display name (if changed)
      if (form.displayName !== (user.displayName || "")) {
        await updateProfile(user, { displayName: form.displayName });
      }

      setShowReauth(false);
      setReauthPassword("");
      setMessage({ type: "success", text: "Reauthentication successful. Profile updated." });
      setTimeout(() => navigate("/dashboard"), 900);
    } catch (err) {
      console.error("Reauth error:", err);
      setMessage({ type: "error", text: err.message || "Reauthentication failed." });
    } finally {
      setLoading(false);
    }
  }

  function handleSendPasswordReset() {
    if (!user?.email) return setMessage({ type: "error", text: "No email available." });
    sendPasswordResetEmail(auth, user.email)
      .then(() => setMessage({ type: "success", text: "Password reset email sent." }))
      .catch((err) => setMessage({ type: "error", text: err.message || "Reset failed." }));
  }

  return (
    <div style={{ display: "flex", justifyContent: "center", paddingTop: 40 }}>
      <form onSubmit={showReauth ? handleReauthAndSave : handleSave} style={{
        width: "92%",
        maxWidth: 820,
        background: "rgba(255,255,255,0.06)", // subtle glass; change to '#fff' if you want solid
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        padding: 22,
        borderRadius: 10,
        border: "1px solid rgba(255,255,255,0.12)",
        color: "#fff"
      }}>
        <h2 style={{ marginTop: 0 }}>Edit Profile</h2>
        <p style={{ marginTop: 0, marginBottom: 12, opacity: 0.9 }}>Update your information below.</p>

        {message && (
          <div style={{
            padding: 10,
            marginBottom: 12,
            borderRadius: 8,
            background: message.type === "success" ? "rgba(34,197,94,0.12)" : "rgba(220,38,38,0.08)",
            color: message.type === "success" ? "#a7f3d0" : "#fecaca"
          }}>
            {message.text}
          </div>
        )}

        {/* Two-column layout */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <label style={{ display: "block" }}>
            <div style={{ fontSize: 13, marginBottom: 6 }}>Name</div>
            <input
              name="displayName"
              value={form.displayName}
              onChange={onChange}
              placeholder="Your name"
              style={{ width: "100%", padding: "10px 12px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.02)", color: "#fff" }}
            />
          </label>

          <label style={{ display: "block" }}>
            <div style={{ fontSize: 13, marginBottom: 6 }}>Date of Birth</div>
            <input
              type="date"
              name="dob"
              value={form.dob}
              onChange={onChange}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.02)", color: "#fff" }}
            />
          </label>

          <label style={{ display: "block" }}>
            <div style={{ fontSize: 13, marginBottom: 6 }}>Email</div>
            <input
              name="email"
              value={form.email}
              onChange={onChange}
              placeholder="you@example.com"
              style={{ width: "100%", padding: "10px 12px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.02)", color: "#fff" }}
            />
          </label>

          <label style={{ display: "block" }}>
            <div style={{ fontSize: 13, marginBottom: 6 }}>Phone</div>
            <input
              name="phone"
              value={form.phone}
              onChange={onChange}
              placeholder="+91 3xx xxxxxxx"
              style={{ width: "100%", padding: "10px 12px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.02)", color: "#fff" }}
            />
          </label>
        </div>

        {/* Change password area */}
        <div style={{ marginTop: 12, padding: 10, borderRadius: 8, background: "rgba(0,0,0,0.06)" }}>
          <button type="button" onClick={handleSendPasswordReset} style={{ padding: "8px 12px", borderRadius: 8, border: "none", background: "#0b7b5b", color: "#fff", cursor: "pointer" }}>
            🔒 Send password reset email
          </button>

          <div style={{ marginTop: 8, fontSize: 12, opacity: 0.9 }}>
            Or if you want to change email, you may be asked to confirm your password (we handle that below if needed).
          </div>
        </div>

        {/* Reauth prompt (shows only when needed) */}
        {showReauth && (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 13, marginBottom: 6 }}>Enter current password to confirm changes</div>
            <input
              type="password"
              placeholder="Current password"
              value={reauthPassword}
              onChange={(e) => setReauthPassword(e.target.value)}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.02)", color: "#fff" }}
            />
          </div>
        )}

        {/* Actions */}
        <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "10px 14px",
              borderRadius: 8,
              border: "none",
              background: "#0b7b5b",
              color: "#fff",
              cursor: "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Saving..." : (showReauth ? "Confirm & Save" : "Save Changes")}
          </button>

          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            style={{
              padding: "10px 14px",
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "transparent",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
