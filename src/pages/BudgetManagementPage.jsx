// src/pages/BudgetManagementPage.jsx
import React, { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import Sidebar from "../components/Sidebar";
import ProfileMenu from "../components/ProfileMenu";
import BackButton from "../components/BackButton";

const pageCard = {
  background: "#ffffff",
  color: "#000",
  padding: 18,
  borderRadius: 10,
  boxShadow: "0 6px 20px rgba(3,10,18,0.25)",
};

export default function BudgetManagementPage({ user, onLogout }) {
  const userId = user?.uid;
  const now = new Date();
  const [budgets, setBudgets] = useState([]);

  const [form, setForm] = useState({
    id: null,
    category: "",
    limit: "",
    month: now.getMonth() + 1,
    year: now.getFullYear(),
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!userId) return;
    const q = query(collection(db, "budgets"), where("userId", "==", userId));
    const unsub = onSnapshot(q, (snap) => {
      const arr = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setBudgets(arr);
    });
    return () => unsub();
  }, [userId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const resetForm = () => {
    setForm({
      id: null,
      category: "",
      limit: "",
      month: now.getMonth() + 1,
      year: now.getFullYear(),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId) return;
    if (!form.category || !form.limit) {
      alert("Category aur Limit required hai.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        userId,
        category: form.category.trim(),
        limit: Number(form.limit),
        month: Number(form.month),
        year: Number(form.year),
        updatedAt: serverTimestamp(),
      };

      if (form.id) {
        await updateDoc(doc(db, "budgets", form.id), payload);
      } else {
        await addDoc(collection(db, "budgets"), {
          ...payload,
          createdAt: serverTimestamp(),
        });
      }

      resetForm();
    } catch (err) {
      console.error(err);
      alert("Error saving budget");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (b) => {
    setForm({
      id: b.id,
      category: b.category || "",
      limit: b.limit || "",
      month: b.month || now.getMonth() + 1,
      year: b.year || now.getFullYear(),
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this budget?")) return;
    try {
      await deleteDoc(doc(db, "budgets", id));
    } catch (err) {
      console.error(err);
      alert("Error deleting budget");
    }
  };

  const monthNames = [
    "",
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <div style={{ flex: 1, padding: 18 }}>
        {/* Top bar */}
        <div
          style={{
            ...pageCard,
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 18,
            paddingTop: 12,
            paddingBottom: 12,
          }}
        >
          <BackButton label="←" />
          <div style={{ fontSize: 20, fontWeight: 800, color: "#111827" }}>
            Budget Management
          </div>

          <div
            style={{
              marginLeft: "auto",
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div style={{ color: "#4b5563", opacity: 0.9 }}>
              Hi,{" "}
              <strong style={{ color: "#111827" }}>
                {user?.displayName || (user?.email || "").split("@")[0]}
              </strong>
            </div>
            <ProfileMenu user={user} onLogout={onLogout} />
          </div>
        </div>

        {/* Form + List */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.1fr) minmax(0, 1.6fr)",
            gap: 16,
          }}
        >
          {/* Form */}
          <div style={pageCard}>
            <h3 style={{ marginTop: 0 }}>Set Monthly Budget</h3>
            <form onSubmit={handleSubmit} style={{ display: "grid", gap: 10 }}>
              <div>
                <label
                  style={{ fontSize: 13, fontWeight: 600, display: "block" }}
                >
                  Category
                </label>
                <input
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  placeholder="Food, Rent, Travel..."
                  style={{
                    width: "100%",
                    padding: 8,
                    borderRadius: 8,
                    border: "1px solid #e5e7eb",
                  }}
                />
              </div>

              <div>
                <label
                  style={{ fontSize: 13, fontWeight: 600, display: "block" }}
                >
                  Monthly Limit (₹)
                </label>
                <input
                  type="number"
                  name="limit"
                  value={form.limit}
                  onChange={handleChange}
                  min="0"
                  style={{
                    width: "100%",
                    padding: 8,
                    borderRadius: 8,
                    border: "1px solid #e5e7eb",
                  }}
                />
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 8,
                }}
              >
                <div>
                  <label
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      display: "block",
                    }}
                  >
                    Month
                  </label>
                  <select
                    name="month"
                    value={form.month}
                    onChange={handleChange}
                    style={{
                      width: "100%",
                      padding: 8,
                      borderRadius: 8,
                      border: "1px solid #e5e7eb",
                    }}
                  >
                    {monthNames.map((m, i) =>
                      i === 0 ? null : (
                        <option key={i} value={i}>
                          {i} - {m}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div>
                  <label
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      display: "block",
                    }}
                  >
                    Year
                  </label>
                  <input
                    type="number"
                    name="year"
                    value={form.year}
                    onChange={handleChange}
                    style={{
                      width: "100%",
                      padding: 8,
                      borderRadius: 8,
                      border: "1px solid #e5e7eb",
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 8,
                    border: "none",
                    background: "#0b7b5b",
                    color: "#fff",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  {form.id ? "Update Budget" : "Save Budget"}
                </button>
                {form.id && (
                  <button
                    type="button"
                    onClick={resetForm}
                    style={{
                      padding: "8px 16px",
                      borderRadius: 8,
                      border: "1px solid #e5e7eb",
                      background: "#fff",
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* List */}
          <div style={pageCard}>
            <h3 style={{ marginTop: 0 }}>Existing Budgets</h3>
            {budgets.length === 0 ? (
              <div style={{ color: "#6b7280", fontSize: 14 }}>
                No budgets yet. Create one using the form.
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: 13,
                  }}
                >
                  <thead>
                    <tr style={{ background: "#f3f4f6" }}>
                      <th style={{ textAlign: "left", padding: 8 }}>Category</th>
                      <th style={{ textAlign: "right", padding: 8 }}>Limit</th>
                      <th style={{ textAlign: "center", padding: 8 }}>Month</th>
                      <th style={{ textAlign: "center", padding: 8 }}>Year</th>
                      <th style={{ textAlign: "right", padding: 8 }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {budgets.map((b) => (
                      <tr
                        key={b.id}
                        style={{ borderTop: "1px solid #e5e7eb" }}
                      >
                        <td style={{ padding: 8 }}>{b.category}</td>
                        <td style={{ padding: 8, textAlign: "right" }}>
                          ₹{Number(b.limit || 0).toFixed(0)}
                        </td>
                        <td style={{ padding: 8, textAlign: "center" }}>
                          {b.month} - {monthNames[b.month]}
                        </td>
                        <td style={{ padding: 8, textAlign: "center" }}>
                          {b.year}
                        </td>
                        <td style={{ padding: 8, textAlign: "right" }}>
                          <button
                            onClick={() => handleEdit(b)}
                            style={{
                              padding: "4px 8px",
                              borderRadius: 6,
                              border: "none",
                              background: "#2563eb",
                              color: "#fff",
                              cursor: "pointer",
                              marginRight: 6,
                            }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(b.id)}
                            style={{
                              padding: "4px 8px",
                              borderRadius: 6,
                              border: "none",
                              background: "#ef4444",
                              color: "#fff",
                              cursor: "pointer",
                            }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
