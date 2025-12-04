// src/pages/settingPage.jsx
import React, { useEffect, useState } from "react";
import {
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";
import { db, auth } from "../firebase";
import {
  updateEmail,
  updateProfile as fbUpdateProfile,
  sendPasswordResetEmail,
} from "firebase/auth";

export default function SettingsPage({ user, onSaveProfile }) {
  const [profile, setProfile] = useState({
    name: user?.displayName || "",
    email: user?.email || "",
    phone: user?.phoneNumber || "",
    dob: "",
    bio: "",
    location: "",
    phoneVerified: false,
  });

  const [security, setSecurity] = useState({
    twoFA: false,
    requirePasswordOnEmailChange: true,
  });
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    marketing: false,
  });
  const [appearance, setAppearance] = useState({
    theme: "light",
    showWallpaper: true,
  });

  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);

  // ---- Load User Firestore Doc ----
  useEffect(() => {
    let mounted = true;
    async function loadUserDoc() {
      if (!user?.uid) return;
      try {
        const ref = doc(db, "users", user.uid);
        const snap = await getDoc(ref);
        if (snap.exists() && mounted) {
          const data = snap.data();
          setProfile((p) => ({
            ...p,
            name: data.name ?? p.name,
            email: data.email ?? p.email,
            phone: data.phone ?? p.phone,
            dob: data.dob ?? p.dob,
            bio: data.bio ?? p.bio,
            location: data.location ?? p.location,
            phoneVerified: !!data.phoneVerified,
          }));
        }
      } catch (err) {
        console.error("Failed to load user doc:", err);
      }
    }
    loadUserDoc();
    return () => (mounted = false);
  }, [user]);

  // ----------- PROFILE HELPERS ----------
  function updateProfileField(key, val) {
    setProfile((p) => ({ ...p, [key]: val }));
  }

  function toggleSecurity(key) {
    setSecurity((s) => ({ ...s, [key]: !s[key] }));
  }
  function toggleNotifications(key) {
    setNotifications((n) => ({ ...n, [key]: !n[key] }));
  }
  function setTheme(t) {
    setAppearance((a) => ({ ...a, theme: t }));
  }
  function toggleWallpaper() {
    setAppearance((a) => ({ ...a, showWallpaper: !a.showWallpaper }));
  }

  function mockVerifyPhone() {
    if (!profile.phone) {
      setMessage({ type: "error", text: "Enter phone first." });
      setTimeout(() => setMessage(null), 1800);
      return;
    }
    setProfile((p) => ({ ...p, phoneVerified: true }));
    setMessage({ type: "success", text: "Phone verified (mock)." });
    setTimeout(() => setMessage(null), 1500);
  }

  // ----------- SAVE PROFILE ----------
  async function saveProfile(e) {
    e?.preventDefault();
    if (!user?.uid) {
      setMessage({ type: "error", text: "You must be logged in." });
      return;
    }

    setBusy(true);
    setMessage(null);

    try {
      // Firebase Auth: Display name
      if (profile.name !== (user.displayName || "")) {
        try {
          await fbUpdateProfile(auth.currentUser, {
            displayName: profile.name,
          });
        } catch (err) {
          console.warn("Failed name update:", err);
        }
      }

      // Firebase Auth: Email update
      if (profile.email !== (user.email || "")) {
        try {
          await updateEmail(auth.currentUser, profile.email);
        } catch (err) {
          console.warn("Email update error:", err);
          setMessage({
            type: "error",
            text: "Email update failed (recent login required).",
          });
        }
      }

      // Firestore update
      const payload = {
        name: profile.name || null,
        email: profile.email || null,
        phone: profile.phone || null,
        dob: profile.dob || null,
        bio: profile.bio || null,
        location: profile.location || null,
        phoneVerified: !!profile.phoneVerified,
        updatedAt: new Date().toISOString(),
      };

      await setDoc(doc(db, "users", user.uid), payload, { merge: true });

      setMessage({ type: "success", text: "Profile saved." });
      if (onSaveProfile) onSaveProfile(profile);
    } catch (err) {
      console.error("Save error:", err);
      setMessage({ type: "error", text: "Save failed." });
    } finally {
      setBusy(false);
      setTimeout(() => setMessage(null), 2300);
    }
  }

  async function sendPasswordReset() {
    if (!profile.email) {
      setMessage({ type: "error", text: "Enter email first." });
      return;
    }
    try {
      await sendPasswordResetEmail(auth, profile.email);
      setMessage({ type: "success", text: "Reset email sent." });
    } catch (err) {
      setMessage({ type: "error", text: "Failed to send reset email." });
    } finally {
      setTimeout(() => setMessage(null), 2000);
    }
  }

  function exportData() {
    alert("Export (mock)");
  }

  function deleteAccount() {
    if (!window.confirm("Delete account permanently?")) return;
    alert("Delete requested (mock)");
  }

  // ----------- STYLES ----------
  const page = {
    minHeight: "100vh",
    padding: 24,
    backgroundImage: appearance.showWallpaper
      ? "url('/background.jpg')"
      : "none",
    backgroundSize: "cover",
    backgroundPosition: "center",
    fontFamily: "Inter, sans-serif",
    color: "#0b2430",
  };
  const container = { maxWidth: 1200, margin: "0 auto" };
  const header = {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 18,
  };
  const backBtn = {
    borderRadius: 8,
    padding: "8px 10px",
    border: "none",
    cursor: "pointer",
  };
  const grid = {
    display: "grid",
    gridTemplateColumns: "2fr 1fr",
    gap: 20,
  };
  const card = {
    background: "rgba(255,255,255,0.96)",
    borderRadius: 12,
    padding: 18,
    boxShadow: "0 8px 30px rgba(3,10,18,0.12)",
  };
  const label = {
    display: "block",
    fontSize: 13,
    marginBottom: 6,
    color: "#334155",
  };
  const input = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid #e6eef6",
    marginBottom: 8,
    fontSize: 14,
  };
  const btnPrimary = {
    background: "#0b7b5b",
    color: "#fff",
    padding: "10px 14px",
    borderRadius: 8,
    border: "none",
    cursor: "pointer",
  };
  const btnGhost = {
    background: "#fff",
    color: "#0b2430",
    padding: "8px 12px",
    borderRadius: 8,
    border: "1px solid #e6eef6",
    cursor: "pointer",
  };

  // ----------- UI RENDER ----------
  return (
    <div style={page}>
      <div style={container}>
        <div style={header}>
          <button style={backBtn} onClick={() => window.history.back()}>
            ←
          </button>
          <div>
            <h1 style={{ margin: 0, fontSize: 22 }}>Settings</h1>
            <div style={{ fontSize: 13, opacity: 0.9 }}>
              Customize your account & preferences
            </div>
          </div>
        </div>

        <div style={grid}>
          {/* LEFT AREA */}
          <div>
            {/* Profile */}
            <section style={card}>
              <h3>Edit Profile</h3>

              {message && (
                <div
                  style={{
                    marginTop: 10,
                    padding: 10,
                    borderRadius: 8,
                    background:
                      message.type === "success" ? "#ecfdf5" : "#ffe4e6",
                    color:
                      message.type === "success" ? "#065f46" : "#7f1d1d",
                  }}
                >
                  {message.text}
                </div>
              )}

              <form onSubmit={saveProfile} style={{ marginTop: 12 }}>
                <label style={label}>Name</label>
                <input
                  style={input}
                  value={profile.name}
                  onChange={(e) => updateProfileField("name", e.target.value)}
                />

                <label style={label}>Date of Birth</label>
                <input
                  style={input}
                  type="date"
                  value={profile.dob || ""}
                  onChange={(e) => updateProfileField("dob", e.target.value)}
                />

                <label style={label}>Email</label>
                <input
                  style={input}
                  type="email"
                  value={profile.email}
                  onChange={(e) => updateProfileField("email", e.target.value)}
                />

                <label style={label}>Phone</label>
                <input
                  style={input}
                  value={profile.phone}
                  onChange={(e) => updateProfileField("phone", e.target.value)}
                />

                <button style={btnGhost} onClick={mockVerifyPhone} type="button">
                  {profile.phoneVerified ? "Verified" : "Verify (mock)"}
                </button>

                <div style={{ marginTop: 12 }}>
                  <button style={btnPrimary} type="submit" disabled={busy}>
                    {busy ? "Saving…" : "Save Changes"}
                  </button>
                </div>
              </form>
            </section>

            {/* Security */}
            <section style={{ ...card, marginTop: 18 }}>
              <h3>Security</h3>
              <label style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Two-factor authentication</span>
                <input
                  type="checkbox"
                  checked={security.twoFA}
                  onChange={() => toggleSecurity("twoFA")}
                />
              </label>

              <label style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Require password to change email</span>
                <input
                  type="checkbox"
                  checked={security.requirePasswordOnEmailChange}
                  onChange={() =>
                    toggleSecurity("requirePasswordOnEmailChange")
                  }
                />
              </label>

              <button style={btnGhost} onClick={sendPasswordReset}>
                Send password reset email
              </button>
            </section>

            {/* Notifications */}
            <section style={{ ...card, marginTop: 18 }}>
              <h3>Notifications</h3>

              <label style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Email notifications</span>
                <input
                  type="checkbox"
                  checked={notifications.email}
                  onChange={() => toggleNotifications("email")}
                />
              </label>

              <label style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Push notifications</span>
                <input
                  type="checkbox"
                  checked={notifications.push}
                  onChange={() => toggleNotifications("push")}
                />
              </label>
            </section>

            {/* Data privacy */}
            <section style={{ ...card, marginTop: 18 }}>
              <h3>Data & Privacy</h3>

              <button style={btnGhost} onClick={exportData}>
                Export my data (CSV)
              </button>

              <button
                style={{
                  ...btnGhost,
                  background: "#fff5f5",
                  color: "#b91c1c",
                }}
                onClick={deleteAccount}
              >
                Delete account
              </button>
            </section>
          </div>

          {/* RIGHT AREA */}
          <aside>
            <div style={card}>
              <h3>Appearance</h3>

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => setTheme("light")}
                  style={{
                    ...btnGhost,
                    border:
                      appearance.theme === "light"
                        ? "2px solid #22c55e"
                        : "1px solid #e6eef6",
                  }}
                >
                  Light
                </button>

                <button
                  onClick={() => setTheme("dark")}
                  style={{
                    ...btnGhost,
                    border:
                      appearance.theme === "dark"
                        ? "2px solid #22c55e"
                        : "1px solid #e6eef6",
                  }}
                >
                  Dark
                </button>
              </div>

              <label
                style={{
                  marginTop: 12,
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                Show wallpaper
                <input
                  type="checkbox"
                  checked={appearance.showWallpaper}
                  onChange={toggleWallpaper}
                />
              </label>
            </div>

            <div style={{ ...card, marginTop: 18 }}>
              <h3>Connected Apps</h3>
              <div>Google ✔ Connected</div>
              <button style={btnGhost}>Connect Plaid</button>
            </div>

            <div style={{ ...card, marginTop: 18 }}>
              <h3>Help & Support</h3>
              <a href="#" style={{ color: "#0b7b5b" }}>
                Documentation
              </a>
              <a href="#" style={{ color: "#0b7b5b" }}>
                Privacy Policy
              </a>
              <a href="#" style={{ color: "#0b7b5b" }}>
                Contact Support
              </a>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
