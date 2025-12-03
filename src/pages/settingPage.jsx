// src/pages/settingPage.jsx
import React, { useEffect, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db, auth } from "../firebase";
import { updateEmail, updateProfile as fbUpdateProfile, sendPasswordResetEmail } from "firebase/auth";

/**
 * SettingsPage — saves to Firestore users/{uid} (merge),
 * updates Auth displayName and email (best-effort),
 * stores dob as ISO string, stores phoneVerified flag (mock verify button provided).
 */

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

  const [security, setSecurity] = useState({ twoFA: false, requirePasswordOnEmailChange: true });
  const [notifications, setNotifications] = useState({ email: true, push: false, marketing: false });
  const [appearance, setAppearance] = useState({ theme: "light", showWallpaper: true });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);

  // load existing Firestore user doc (if any)
  useEffect(() => {
    let mounted = true;
    async function loadUserDoc() {
      if (!user?.uid) return;
      try {
        const uref = doc(db, "users", user.uid);
        const snap = await getDoc(uref);
        if (snap.exists() && mounted) {
          const data = snap.data();
          setProfile((p) => ({
            ...p,
            name: data.name ?? p.name,
            email: data.email ?? p.email,
            phone: data.phone ?? p.phone,
            dob: data.dob ?? p.dob, // expecting ISO or timestamp; we keep as string
            bio: data.bio ?? p.bio,
            location: data.location ?? p.location,
            phoneVerified: !!data.phoneVerified,
          }));
        }
      } catch (err) {
        console.error("Failed to load users doc:", err);
      }
    }
    loadUserDoc();
    return () => (mounted = false);
  }, [user]);

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

  // Mock phone verification (for now) — replace with real Phone Auth later
  function mockVerifyPhone() {
    if (!profile.phone) {
      setMessage({ type: "error", text: "Enter phone first to verify." });
      setTimeout(() => setMessage(null), 2000);
      return;
    }
    setProfile((p) => ({ ...p, phoneVerified: true }));
    setMessage({ type: "success", text: "Phone marked verified (mock)." });
    setTimeout(() => setMessage(null), 1500);
  }

  // Save handler: updates Auth displayName/email (best-effort), then writes Firestore users/{uid}
  async function saveProfile(e) {
    e?.preventDefault();
    if (!user?.uid) {
      setMessage({ type: "error", text: "You must be signed in to save settings." });
      return;
    }

    setBusy(true);
    setMessage(null);

    try {
      // 1) Update Firebase Auth displayName (best-effort)
      if (profile.name && profile.name !== (user.displayName || "")) {
        try {
          await fbUpdateProfile(auth.currentUser, { displayName: profile.name });
        } catch (err) {
          console.warn("Failed to update auth displayName:", err);
        }
      }

      // 2) Update Email (may require reauth)
      if (profile.email && profile.email !== (user.email || "")) {
        try {
          await updateEmail(auth.currentUser, profile.email);
        } catch (err) {
          console.error("updateEmail error:", err);
          setMessage({
            type: "error",
            text: "Could not update email (recent login required). Re-login and try again.",
          });
          // continue to save other fields to Firestore
        }
      }

      // 3) Build payload for Firestore
      // Ensure dob is an ISO string (if user used <input type=date>)
      let dobValue = profile.dob || null;
      if (dobValue instanceof Date) dobValue = dobValue.toISOString();
      // if it's already an input-date string like "2025-12-03", keep it (ISO-ish)
      const payload = {
        name: profile.name || null,
        email: profile.email || null,
        phone: profile.phone || null,
        dob: dobValue || null,
        bio: profile.bio || null,
        location: profile.location || null,
        phoneVerified: !!profile.phoneVerified,
        updatedAt: new Date().toISOString(),
      };

      // setDoc merge: create/merge fields in users/{uid}
      await setDoc(doc(db, "users", user.uid), payload, { merge: true });

      setMessage({ type: "success", text: "Profile saved." });
      if (typeof onSaveProfile === "function") onSaveProfile(profile);
    } catch (err) {
      console.error("Save profile error:", err);
      setMessage({ type: "error", text: "Save failed — check console." });
    } finally {
      setBusy(false);
      setTimeout(() => setMessage(null), 2500);
    }
  }

  async function sendPasswordReset() {
    if (!profile.email) {
      setMessage({ type: "error", text: "Please enter your email to send reset." });
      setTimeout(() => setMessage(null), 2000);
      return;
    }
    try {
      await sendPasswordResetEmail(auth, profile.email);
      setMessage({ type: "success", text: "Password reset email sent." });
    } catch (err) {
      console.error("Password reset error:", err);
      setMessage({ type: "error", text: "Failed to send password reset email." });
    } finally {
      setTimeout(() => setMessage(null), 2200);
    }
  }

  function exportData() {
    alert("Exported CSV (mock)");
  }
  function deleteAccount() {
    if (!confirm("Delete your account? This is permanent.")) return;
    alert("Account deletion requested (mock)");
  }

  // --- Inline styles (kept same) ---
  const page = {
    minHeight: "100vh",
    padding: 24,
    backgroundImage: appearance.showWallpaper ? "url('/background.jpg')" : "none",
    backgroundSize: "cover",
    backgroundPosition: "center",
    fontFamily: "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial",
    color: "#0b2430",
  };
  const container = { maxWidth: 1200, margin: "0 auto" };
  const header = { display: "flex", alignItems: "center", gap: 12, marginBottom: 18 };
  const backBtn = {
    borderRadius: 8,
    padding: "8px 10px",
    border: "none",
    cursor: "pointer",
    background: "rgba(255,255,255,0.08)",
    color: "#fff",
    boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
  };
  const grid = { display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20 };
  const card = { background: "rgba(255,255,255,0.96)", borderRadius: 12, padding: 18, boxShadow: "0 8px 30px rgba(3,10,18,0.12)" };
  const sectionTitle = { fontSize: 16, fontWeight: 700, marginBottom: 6 };
  const label = { display: "block", fontSize: 13, marginBottom: 6, color: "#334155" };
  const input = { width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #e6eef6", marginBottom: 8, fontSize: 14 };
  const small = { fontSize: 13, color: "#64748b" };
  const btnPrimary = { background: "#0b7b5b", color: "#fff", padding: "10px 14px", borderRadius: 8, border: "none", cursor: "pointer" };
  const btnGhost = { background: "#fff", color: "#0b2430", padding: "8px 12px", borderRadius: 8, border: "1px solid #e6eef6", cursor: "pointer" };

  return (
    <div style={page}>
      <div style={container}>
        <div style={header}>
          <button style={backBtn} onClick={() => window.history.back()} aria-label="Back">←</button>
          <div>
            <h1 style={{ color: appearance.theme === "light" ? "#fff" : "#0b2430", margin: 0, fontSize: 22 }}>Settings</h1>
            <div style={{ color: "rgba(255,255,255,0.85)", fontSize: 13 }}>Customize your account & preferences</div>
          </div>
        </div>

        <div style={grid}>
          {/* LEFT: main settings */}
          <div>
            <section style={card}>
              <div style={sectionTitle}>Edit Profile</div>
              <div style={small}>Update your personal information.</div>

              {message && (
                <div style={{ marginTop: 12, padding: 10, borderRadius: 8, background: message.type === "success" ? "#ecfdf5" : "#fff1f2", color: message.type === "success" ? "#065f46" : "#7f1d1d" }}>
                  {message.text}
                </div>
              )}

              <form onSubmit={saveProfile} style={{ marginTop: 12 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={label}>Name</label>
                    <input style={input} value={profile.name} onChange={(e) => updateProfileField("name", e.target.value)} placeholder="Full name" />
                  </div>

                  <div>
                    <label style={label}>Date of Birth</label>
                    <input style={input} type="date" value={profile.dob || ""} onChange={(e) => updateProfileField("dob", e.target.value)} />
                  </div>

                  <div>
                    <label style={label}>Email</label>
                    <input style={input} type="email" value={profile.email} onChange={(e) => updateProfileField("email", e.target.value)} />
                  </div>

                  <div>
                    <label style={label}>Phone</label>
                    <input style={input} value={profile.phone} onChange={(e) => updateProfileField("phone", e.target.value)} placeholder="+91 3xx xxxxxx" />
                    <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                      <button type="button" style={btnGhost} onClick={mockVerifyPhone}>{profile.phoneVerified ? "Verified" : "Verify (mock)"}</button>
                      <div style={{ alignSelf: "center", color: profile.phoneVerified ? "#065f46" : "#64748b", fontWeight: 700 }}>{profile.phoneVerified ? "Phone verified" : "Not verified"}</div>
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 10, marginTop: 12, alignItems: "center" }}>
                  <button style={btnPrimary} type="submit" disabled={busy}>{busy ? "Saving…" : "Save Changes"}</button>
                  <button type="button" style={btnGhost} onClick={() => setProfile({ name: user?.displayName || "", email: user?.email || "", phone: user?.phoneNumber || "", dob: "" })}>Cancel</button>
                  <div style={{ marginLeft: "auto" }}>
                    <button type="button" style={{ ...btnGhost, background: "#ecfdf5", border: "1px solid #bbf7d0", color: "#064e3b" }} onClick={sendPasswordReset}>Send password reset email</button>
                  </div>
                </div>

                <div style={{ marginTop: 10, color: "#64748b", fontSize: 13 }}>
                  Or if you want to change email, you may be asked to confirm your password.
                </div>
              </form>
            </section>

            {/* security / notifications / data & privacy (unchanged) */}
            <section style={{ ...card, marginTop: 18 }}>
              <div style={sectionTitle}>Security</div>
              <div style={small}>Make your account safer.</div>

              <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
                <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 12, borderRadius: 8, background: "#fff" }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>Two-factor authentication</div>
                    <div style={{ color: "#64748b", fontSize: 13 }}>Add an extra layer of protection to your account.</div>
                  </div>
                  <input type="checkbox" checked={security.twoFA} onChange={() => toggleSecurity("twoFA")} />
                </label>

                <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 12, borderRadius: 8, background: "#fff" }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>Require password to change email</div>
                    <div style={{ color: "#64748b", fontSize: 13 }}>Prevent email changes without re-authentication.</div>
                  </div>
                  <input type="checkbox" checked={security.requirePasswordOnEmailChange} onChange={() => toggleSecurity("requirePasswordOnEmailChange")} />
                </label>

                <div style={{ display: "flex", gap: 8 }}>
                  <button style={btnGhost} onClick={() => alert('Signed out from other devices (mock)')}>Sign out from other devices</button>
                  <button style={btnGhost} onClick={() => alert('View active sessions (mock)')}>View active sessions</button>
                </div>
              </div>
            </section>

            <section style={{ ...card, marginTop: 18 }}>
              <div style={sectionTitle}>Notifications</div>
              <div style={small}>Control how you get updates from the app.</div>

              <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 10, borderRadius: 8, background: "#fff" }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>Email notifications</div>
                    <div style={{ color: "#64748b", fontSize: 13 }}>Important alerts and receipts.</div>
                  </div>
                  <input type="checkbox" checked={notifications.email} onChange={() => toggleNotifications("email")} />
                </label>

                <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 10, borderRadius: 8, background: "#fff" }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>Push notifications</div>
                    <div style={{ color: "#64748b", fontSize: 13 }}>Quick updates on your device.</div>
                  </div>
                  <input type="checkbox" checked={notifications.push} onChange={() => toggleNotifications("push")} />
                </label>

                <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 10, borderRadius: 8, background: "#fff" }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>Marketing emails</div>
                    <div style={{ color: "#64748b", fontSize: 13 }}>Occasional product news and tips.</div>
                  </div>
                  <input type="checkbox" checked={notifications.marketing} onChange={() => toggleNotifications("marketing")} />
                </label>
              </div>
            </section>

            <section style={{ ...card, marginTop: 18 }}>
              <div style={sectionTitle}>Data & Privacy</div>
              <div style={small}>Export or remove your data.</div>

              <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                <button style={btnGhost} onClick={exportData}>Export my data (CSV)</button>
                <button style={{ ...btnGhost, background: "#fff6f6", color: "#7f1d1d" }} onClick={deleteAccount}>Delete account</button>
              </div>
            </section>
          </div>

          {/* RIGHT: appearance + connected apps */}
          <aside>
            <div style={card}>
              <div style={sectionTitle}>Appearance</div>
              <div style={small}>Customize the look of the dashboard.</div>

              <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                <button onClick={() => setTheme("light")} style={{ flex: 1, padding: 10, borderRadius: 8, border: appearance.theme === "light" ? "2px solid #a7f3d0" : "1px solid #e6eef6", background: appearance.theme === "light" ? "#f0fdf4" : "#fff" }}>Light</button>
                <button onClick={() => setTheme("dark")} style={{ flex: 1, padding: 10, borderRadius: 8, border: appearance.theme === "dark" ? "2px solid #a7f3d0" : "1px solid #e6eef6", background: appearance.theme === "dark" ? "#0b1724" : "#fff", color: appearance.theme === "dark" ? "#fff" : "inherit" }}>Dark</button>
              </div>

              <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12, padding: 10, borderRadius: 8, background: "#fff" }}>
                <div>
                  <div style={{ fontWeight: 700 }}>Show wallpaper behind pages</div>
                  <div style={{ color: "#64748b", fontSize: 13 }}>Disable to use solid white backgrounds everywhere.</div>
                </div>
                <input type="checkbox" checked={appearance.showWallpaper} onChange={toggleWallpaper} />
              </label>
            </div>

            <div style={{ ...card, marginTop: 18 }}>
              <div style={sectionTitle}>Connected Apps</div>
              <div style={small}>Third-party services linked to your account.</div>

              <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 10, borderRadius: 8, background: "#fff" }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>Google</div>
                    <div style={{ color: "#64748b", fontSize: 13 }}>Sync contacts & profile</div>
                  </div>
                  <div style={{ color: "#0b7436", fontWeight: 700 }}>Connected</div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 10, borderRadius: 8, background: "#fff" }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>Plaid (bank)</div>
                    <div style={{ color: "#64748b", fontSize: 13 }}>Link your accounts</div>
                  </div>
                  <button style={btnGhost}>Connect</button>
                </div>
              </div>
            </div>

            <div style={{ ...card, marginTop: 18 }}>
              <div style={sectionTitle}>Help & Support</div>
              <div style={small}>Documentation, privacy policy and contact.</div>
              <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                <a style={{ color: "#0b7b5b" }} href="#">View docs</a>
                <a style={{ color: "#0b7b5b" }} href="#">Privacy policy</a>
                <a style={{ color: "#0b7b5b" }} href="#">Contact support</a>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
