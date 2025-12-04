// src/pages/GoalSettingPage.jsx
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

function toNumber(n) {
  const v = Number(n);
  return isNaN(v) ? 0 : v;
}

export default function GoalSettingPage({ user, onLogout }) {
  const userId = user?.uid;

  const [goals, setGoals] = useState([]);
  const [form, setForm] = useState({
    goalName: "",
    targetAmount: "",
    targetDate: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!userId) return;
    const q = query(collection(db, "goals"), where("userId", "==", userId));
    const unsub = onSnapshot(q, (snap) => {
      const arr = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setGoals(arr);
    });
    return () => unsub();
  }, [userId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const resetForm = () => {
    setForm({
      goalName: "",
      targetAmount: "",
      targetDate: "",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId) return;
    if (!form.goalName || !form.targetAmount || !form.targetDate) {
      alert("Please fill all fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "goals"), {
        userId,
        goalName: form.goalName.trim(),
        targetAmount: Number(form.targetAmount),
        targetDate: new Date(form.targetDate),
        currentSavedAmount: 0, // start at 0
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      resetForm();
    } catch (err) {
      console.error(err);
      alert("Error creating goal");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this goal?")) return;
    try {
      await deleteDoc(doc(db, "goals", id));
    } catch (err) {
      console.error(err);
      alert("Error deleting goal");
    }
  };

  const handleSavedChange = (id, value) => {
    setGoals((prev) =>
      prev.map((g) => (g.id === id ? { ...g, _tempSaved: value } : g))
    );
  };

  const handleUpdateSaved = async (g) => {
    const val = toNumber(g._tempSaved ?? g.currentSavedAmount);
    try {
      await updateDoc(doc(db, "goals", g.id), {
        currentSavedAmount: val,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error(err);
      alert("Error updating saved amount");
    }
  };

  const getProgress = (g) => {
    const target = Math.max(toNumber(g.targetAmount), 0);
    const saved = Math.max(toNumber(g.currentSavedAmount ?? 0), 0);
    const pct = target > 0 ? Math.min(100, Math.round((saved / target) * 100)) : 0;
    const remaining = Math.max(target - saved, 0);

    let color = "#4caf50";
    if (pct >= 80 && pct < 100) color = "#ffbf00";
    if (pct >= 100) color = "#22c55e";

    return { target, saved, pct, remaining, color };
  };

  const formatDate = (d) => {
    if (!d) return "";
    const dt = d.toDate ? d.toDate() : new Date(d);
    if (isNaN(dt)) return "";
    return dt.toLocaleDateString();
  };

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
            Goal Setting
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
            <h3 style={{ marginTop: 0 }}>Create New Goal</h3>
            <form onSubmit={handleSubmit} style={{ display: "grid", gap: 10 }}>
              <div>
                <label
                  style={{ fontSize: 13, fontWeight: 600, display: "block" }}
                >
                  Goal Name
                </label>
                <input
                  name="goalName"
                  value={form.goalName}
                  onChange={handleChange}
                  placeholder="New Laptop, Vacation..."
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
                  Target Amount (₹)
                </label>
                <input
                  type="number"
                  name="targetAmount"
                  value={form.targetAmount}
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

              <div>
                <label
                  style={{ fontSize: 13, fontWeight: 600, display: "block" }}
                >
                  Target Date
                </label>
                <input
                  type="date"
                  name="targetDate"
                  value={form.targetDate}
                  onChange={handleChange}
                  style={{
                    width: "100%",
                    padding: 8,
                    borderRadius: 8,
                    border: "1px solid #e5e7eb",
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  marginTop: 6,
                  padding: "8px 16px",
                  borderRadius: 8,
                  border: "none",
                  background: "#0b7b5b",
                  color: "#fff",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Save Goal
              </button>
            </form>
          </div>

          {/* List / Cards */}
          <div style={pageCard}>
            <h3 style={{ marginTop: 0 }}>Your Goals</h3>
            {goals.length === 0 ? (
              <div style={{ color: "#6b7280", fontSize: 14 }}>
                No goals yet. Create your first goal using the form.
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gap: 12,
                  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                }}
              >
                {goals.map((g) => {
                  const { target, saved, pct, remaining, color } =
                    getProgress(g);

                  return (
                    <div
                      key={g.id}
                      style={{
                        borderRadius: 10,
                        border: "1px solid #e5e7eb",
                        padding: 12,
                        background: "#f9fafb",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          marginBottom: 4,
                        }}
                      >
                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: 14,
                            color: "#111827",
                          }}
                        >
                          {g.goalName}
                        </div>
                        <button
                          onClick={() => handleDelete(g.id)}
                          style={{
                            marginLeft: "auto",
                            border: "none",
                            background: "transparent",
                            color: "#ef4444",
                            cursor: "pointer",
                            fontSize: 12,
                          }}
                        >
                          Delete
                        </button>
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: "#6b7280",
                          marginBottom: 4,
                        }}
                      >
                        Target Date: {formatDate(g.targetDate)}
                      </div>

                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: 12,
                          marginBottom: 4,
                        }}
                      >
                        <span>Saved: ₹{saved.toFixed(0)}</span>
                        <span>Target: ₹{target.toFixed(0)}</span>
                      </div>

                      <div
                        style={{
                          width: "100%",
                          height: 8,
                          borderRadius: 999,
                          background: "#e5e7eb",
                          overflow: "hidden",
                          marginBottom: 4,
                        }}
                      >
                        <div
                          style={{
                            width: `${pct}%`,
                            height: "100%",
                            background: color,
                            transition: "width 0.3s ease",
                          }}
                        />
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: "#374151",
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: 6,
                        }}
                      >
                        <span>{pct}% complete</span>
                        <span>Remaining: ₹{remaining.toFixed(0)}</span>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          fontSize: 12,
                        }}
                      >
                        <span>Update Saved:</span>
                        <input
                          type="number"
                          value={g._tempSaved ?? g.currentSavedAmount ?? 0}
                          onChange={(e) =>
                            handleSavedChange(g.id, e.target.value)
                          }
                          style={{
                            flex: 1,
                            padding: 6,
                            borderRadius: 8,
                            border: "1px solid #e5e7eb",
                          }}
                        />
                        <button
                          onClick={() => handleUpdateSaved(g)}
                          style={{
                            padding: "6px 10px",
                            borderRadius: 8,
                            border: "none",
                            background: "#0ea5e9",
                            color: "#fff",
                            cursor: "pointer",
                          }}
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
