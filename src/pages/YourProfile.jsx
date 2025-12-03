// src/pages/YourProfile.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { doc, onSnapshot, getDoc } from "firebase/firestore";
import { db } from "../firebase";

/**
 * YourProfile (real-time): listens on users/{uid} doc (if available) and merges with auth fields.
 * Shows phone (auth or users doc), DOB (from users doc), avatar (from users doc) and phoneVerified.
 */

export default function YourProfile({ user, onLogout }) {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    dob: "",
    bio: "",
    location: "",
    joined: null,
    avatarUrl: "",
    emailVerified: false,
    phoneVerified: false,
  });
  const [loading, setLoading] = useState(true);

  function parseMaybeDate(value) {
    if (!value) return null;
    if (typeof value === "object" && typeof value.toDate === "function") return value.toDate();
    const d = new Date(value);
    if (!isNaN(d)) return d;
    return null;
  }

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    // Start with auth fields
    const base = {
      name: user.displayName || "",
      email: user.email || "",
      joined: user.metadata?.creationTime ? new Date(user.metadata.creationTime) : null,
      emailVerified: !!user.emailVerified,
      phone: user.phoneNumber || "",
    };

    let unsub = null;
    const userDocRef = doc(db, "users", user.uid);

    // Use onSnapshot so profile updates in real-time when settings saved
    try {
      unsub = onSnapshot(
        userDocRef,
        (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            const dobDate = parseMaybeDate(data.dob ?? data.dobISO ?? data.dobString ?? null);
            setProfile({
              ...base,
              phone: data.phone ?? base.phone,
              dob: dobDate ? dobDate : data.dob ?? "",
              bio: data.bio ?? "",
              location: data.location ?? "",
              avatarUrl: data.avatarUrl ?? "",
              phoneVerified: !!data.phoneVerified,
              emailVerified: base.emailVerified,
              joined: base.joined,
            });
          } else {
            // no doc => just use auth fields
            setProfile({ ...base, dob: "", bio: "", location: "", avatarUrl: "", phoneVerified: false });
          }
          setLoading(false);
        },
        (err) => {
          console.error("onSnapshot error:", err);
          // fallback to one-time get
          getDoc(userDocRef)
            .then((snap) => {
              if (snap.exists()) {
                const data = snap.data();
                const dobDate = parseMaybeDate(data.dob ?? data.dobISO ?? data.dobString ?? null);
                setProfile({
                  ...base,
                  phone: data.phone ?? base.phone,
                  dob: dobDate ? dobDate : data.dob ?? "",
                  bio: data.bio ?? "",
                  location: data.location ?? "",
                  avatarUrl: data.avatarUrl ?? "",
                  phoneVerified: !!data.phoneVerified,
                  emailVerified: base.emailVerified,
                  joined: base.joined,
                });
              } else {
                setProfile({ ...base, dob: "", bio: "", location: "", avatarUrl: "", phoneVerified: false });
              }
            })
            .catch((e) => console.error(e))
            .finally(() => setLoading(false));
        }
      );
    } catch (err) {
      console.error("Snapshot subscription failed:", err);
      setLoading(false);
    }

    return () => {
      if (typeof unsub === "function") unsub();
    };
  }, [user]);

  function formatDateField(d) {
    if (!d) return "—";
    try {
      const dt = parseMaybeDate(d) || d;
      if (dt instanceof Date && !isNaN(dt)) return dt.toLocaleDateString();
      return String(d);
    } catch {
      return String(d);
    }
  }

  const page = { minHeight: "80vh", padding: 24, fontFamily: "Inter, system-ui, Roboto, Arial", color: "#0b2430" };
  const card = { background: "rgba(255,255,255,0.98)", borderRadius: 12, padding: 18, boxShadow: "0 10px 30px rgba(2,6,23,0.08)" };
  const avatarStyle = { width: 120, height: 120, borderRadius: 12, objectFit: "cover", border: "2px solid #e6eef6", background: "#f1f9ff" };
  const label = { fontSize: 13, color: "#64748b" };
  const value = { fontSize: 15, fontWeight: 700, color: "#0b2430" };
  const btnGhost = { background: "#fff", color: "#0b2430", padding: "8px 12px", borderRadius: 8, border: "1px solid #e6eef6", cursor: "pointer" };
  const btnDanger = { ...btnGhost, color: "#b91c1c", borderColor: "#fca5a5" };

  if (loading) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ padding: 12, borderRadius: 8, background: "rgba(255,255,255,0.9)" }}>Loading profile…</div>
      </div>
    );
  }

  return (
    <div style={page}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <button onClick={() => navigate(-1)} style={{ padding: 8, borderRadius: 8, border: "none", cursor: "pointer", background: "rgba(0,0,0,0.25)", color: "#fff" }}>←</button>
          <h1 style={{ margin: 0, color: "#fff" }}>Your Profile</h1>
        </div>

        <div style={card}>
          <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
            <div style={{ width: 240, textAlign: "center" }}>
              <img src={profile.avatarUrl || "/assets/bg.jpg"} alt="avatar" style={avatarStyle} />
              <div style={{ marginTop: 12 }}>
                <div style={{ fontWeight: 700 }}>{profile.name || "Anonymous"}</div>
                <div style={{ fontSize: 13, color: "#64748b" }}>{profile.email}</div>
              </div>

              <div style={{ marginTop: 12, display: "flex", gap: 8, justifyContent: "center" }}>
                <button onClick={() => navigate("/settings")} style={btnGhost}>Edit Profile</button>
                <button onClick={() => (typeof onLogout === "function" ? onLogout() : navigate("/logout"))} style={btnDanger}>Logout</button>
              </div>
            </div>

            <div style={{ flex: 1 }}>
              <h2 style={{ marginTop: 0 }}>Personal details</h2>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
                <div>
                  <div style={label}>Full name</div>
                  <div style={value}>{profile.name || "—"}</div>
                </div>

                <div>
                  <div style={label}>Email</div>
                  <div style={value}>{profile.email || "—"}</div>
                  <div style={{ marginTop: 6 }}>
                    <span style={{ padding: "6px 10px", borderRadius: 999, display: "inline-block", background: profile.emailVerified ? "#ecfdf5" : "#fff1f2", color: profile.emailVerified ? "#065f46" : "#7f1d1d", fontWeight: 700, fontSize: 13 }}>
                      {profile.emailVerified ? "Verified" : "Not verified"}
                    </span>
                  </div>
                </div>

                <div>
                  <div style={label}>Phone</div>
                  <div style={value}>{profile.phone || "—"}</div>
                  <div style={{ marginTop: 6, fontSize: 13, color: profile.phoneVerified ? "#065f46" : "#64748b", fontWeight: 700 }}>
                    {profile.phoneVerified ? "Phone verified" : "Phone not verified"}
                  </div>
                </div>

                <div>
                  <div style={label}>Location</div>
                  <div style={value}>{profile.location || "—"}</div>
                </div>

                <div>
                  <div style={label}>Date of birth</div>
                  <div style={value}>{profile.dob ? formatDateField(profile.dob) : "—"}</div>
                </div>

                <div>
                  <div style={label}>Joined</div>
                  <div style={value}>{profile.joined ? formatDateField(profile.joined) : "—"}</div>
                </div>

                <div style={{ gridColumn: "1 / -1" }}>
                  <div style={label}>About / Bio</div>
                  <div style={{ padding: 12, borderRadius: 10, background: "#f8fafc", color: "#475569" }}>{profile.bio || "No bio set."}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
