import React, { useState } from "react";
import { Link } from "react-router-dom";

export default function EditProfile() {
  const [form, setForm] = useState({
    name: "Tuseef Ahmed",
    dob: "",
    email: "",
    phone: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  function update(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function saveProfile(e) {
    e.preventDefault();

    if (form.newPassword && form.newPassword !== form.confirmPassword) {
      alert("New Password and Confirm Password do not match!");
      return;
    }

    alert("Profile Saved Successfully (Mock)");
  }

  return (
    <div
      style={{
        padding: "30px",
        maxWidth: "900px",
        margin: "0 auto",
      }}
    >
      <div
        style={{
          padding: "20px",
          background: "rgba(255,255,255,0.06)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderRadius: "14px",
          border: "1px solid rgba(255,255,255,0.1)",
          color: "#fff",
        }}
      >
        <h2>Edit Profile</h2>
        <p>Update your information below.</p>

        <form
          onSubmit={saveProfile}
          style={{ display: "grid", gap: "14px", marginTop: "20px" }}
        >
          {/* Name & DOB */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "14px",
            }}
          >
            <label>
              Name
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={update}
                style={inputStyle}
              />
            </label>

            <label>
              Date of Birth
              <input
                type="date"
                name="dob"
                value={form.dob}
                onChange={update}
                style={inputStyle}
              />
            </label>
          </div>

          {/* Email & Phone */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "14px",
            }}
          >
            <label>
              Email
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={update}
                style={inputStyle}
              />
            </label>

            <label>
              Phone
              <input
                type="text"
                name="phone"
                value={form.phone}
                onChange={update}
                style={inputStyle}
              />
            </label>
          </div>

          {/* Change Password Section */}
          <details
            style={{
              background: "rgba(255,255,255,0.04)",
              padding: "12px",
              borderRadius: "10px",
            }}
          >
            <summary style={{ cursor: "pointer" }}>🔒 Change Password</summary>

            <div style={{ display: "grid", gap: "10px", marginTop: "12px" }}>
              <input
                type="password"
                name="currentPassword"
                placeholder="Current Password"
                value={form.currentPassword}
                onChange={update}
                style={inputStyle}
              />
              <input
                type="password"
                name="newPassword"
                placeholder="New Password"
                value={form.newPassword}
                onChange={update}
                style={inputStyle}
              />
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm New Password"
                value={form.confirmPassword}
                onChange={update}
                style={inputStyle}
              />
            </div>
          </details>

          {/* Buttons */}
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              type="submit"
              style={{
                padding: "10px 16px",
                background: "linear-gradient(90deg,#0b5c78,#042a38)",
                border: "none",
                borderRadius: "10px",
                color: "#fff",
                cursor: "pointer",
              }}
            >
              Save Changes
            </button>

            <Link to="/">
              <button
                type="button"
                style={{
                  padding: "10px 16px",
                  borderRadius: "10px",
                  border: "1px solid rgba(255,255,255,0.2)",
                  background: "transparent",
                  color: "#fff",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "10px",
  marginTop: "4px",
  borderRadius: "10px",
  border: "1px solid rgba(255,255,255,0.2)",
  background: "rgba(255,255,255,0.08)",
  color: "#fff",
};
