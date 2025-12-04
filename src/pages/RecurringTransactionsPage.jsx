// src/pages/RecurringTransactionsPage.jsx
import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import ProfileMenu from "../components/ProfileMenu";
import BackButton from "../components/BackButton";
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "../firebase";

function toDate(d) {
  if (!d) return null;
  try {
    if (typeof d.toDate === "function") return d.toDate();
    const maybe = new Date(d);
    if (!isNaN(maybe)) return maybe;
  } catch (e) {}
  return null;
}

function toNumber(n) {
  const v = Number(n);
  return isNaN(v) ? 0 : v;
}

export default function RecurringTransactionsPage({ user, onLogout }) {
  const userId = user?.uid;

  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    title: "",
    type: "expense",
    category: "",
    amount: "",
    frequency: "monthly", // daily | weekly | monthly | yearly
    nextDate: "",
    note: "",
    active: true,
  });

  useEffect(() => {
    if (!userId) return;
    setLoading(true);

    const q = query(
      collection(db, "recurringTransactions"),
      where("userId", "==", userId)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        rows.sort((a, b) => {
          const da = toDate(a.nextDate) || 0;
          const db = toDate(b.nextDate) || 0;
          return da - db;
        });
        setRules(rows);
        setLoading(false);
      },
      () => setLoading(false)
    );

    return () => unsub();
  }, [userId]);

  const pageBg = { display: "flex", minHeight: "100vh" };
  const main = { flex: 1, padding: 18 };
  const card = {
    background: "#ffffff",
    color: "#000",
    padding: 18,
    borderRadius: 10,
    boxShadow: "0 6px 20px rgba(3,10,18,0.25)",
  };
  const label = { fontSize: 12, color: "#475569", marginBottom: 4 };
  const input = {
    width: "100%",
    padding: "8px 10px",
    borderRadius: 8,
    border: "1px solid #e2e8f0",
    fontSize: 13,
    marginBottom: 6,
  };
  const btn = {
    padding: "8px 12px",
    borderRadius: 8,
    border: "none",
    background: "#7c3aed",
    color: "#fff",
    cursor: "pointer",
    fontSize: 13,
  };
  const btnGhost = {
    padding: "6px 10px",
    borderRadius: 8,
    border: "1px solid #e2e8f0",
    background: "#fff",
    color: "#0f172a",
    cursor: "pointer",
    fontSize: 12,
  };

  function updateFormField(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!userId) return;

    const title = form.title.trim();
    const amount = toNumber(form.amount);
    const nextDateStr = form.nextDate;

    if (!title) {
      alert("Title is required");
      return;
    }
    if (!amount || amount <= 0) {
      alert("Amount must be positive");
      return;
    }
    if (!nextDateStr) {
      alert("Next date is required");
      return;
    }

    setBusy(true);
    try {
      const payload = {
        userId,
        title,
        type: form.type,
        category: form.category || null,
        amount,
        frequency: form.frequency,
        nextDate: new Date(nextDateStr),
        note: form.note || null,
        active: !!form.active,
        updatedAt: new Date().toISOString(),
      };

      if (editingId) {
        await updateDoc(doc(db, "recurringTransactions", editingId), payload);
      } else {
        await addDoc(collection(db, "recurringTransactions"), {
          ...payload,
          createdAt: new Date().toISOString(),
        });
      }

      // reset
      setForm({
        title: "",
        type: "expense",
        category: "",
        amount: "",
        frequency: "monthly",
        nextDate: "",
        note: "",
        active: true,
      });
      setEditingId(null);
    } catch (err) {
      console.error("Save recurring error:", err);
      alert("Failed to save recurring rule. See console.");
    } finally {
      setBusy(false);
    }
  }

  function handleEdit(rule) {
    setEditingId(rule.id);
    setForm({
      title: rule.title || "",
      type: rule.type || "expense",
      category: rule.category || "",
      amount: rule.amount != null ? String(rule.amount) : "",
      frequency: rule.frequency || "monthly",
      nextDate:
        rule.nextDate && toDate(rule.nextDate)
          ? toDate(rule.nextDate).toISOString().slice(0, 10)
          : "",
      note: rule.note || "",
      active: !!rule.active,
    });
  }

  async function handleDelete(rule) {
    if (!window.confirm(`Delete recurring rule "${rule.title}"?`)) return;
    try {
      await deleteDoc(doc(db, "recurringTransactions", rule.id));
    } catch (err) {
      console.error("Delete recurring error:", err);
      alert("Failed to delete. See console.");
    }
  }

  async function toggleActive(rule) {
    try {
      await updateDoc(doc(db, "recurringTransactions", rule.id), {
        active: !rule.active,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error("Toggle active error:", err);
    }
  }

  function cancelEdit() {
    setEditingId(null);
    setForm({
      title: "",
      type: "expense",
      category: "",
      amount: "",
      frequency: "monthly",
      nextDate: "",
      note: "",
      active: true,
    });
  }

  return (
    <div style={pageBg}>
      <Sidebar />
      <div style={main}>
        {/* top */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 18,
          }}
        >
          <BackButton label="←" />
          <div style={{ fontSize: 20, fontWeight: 800, color: "#fff" }}>
            Recurring Transactions
          </div>
          <div
            style={{
              marginLeft: "auto",
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div style={{ color: "#0f0e0e", opacity: 0.9 }}>
              Hi,{" "}
              <strong style={{ color: "#0b0b0b" }}>
                {user?.displayName || (user?.email || "").split("@")[0]}
              </strong>
            </div>
            <ProfileMenu user={user} onLogout={onLogout} />
          </div>
        </div>

        {/* layout: left form, right list */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.2fr 1.8fr",
            gap: 16,
          }}
        >
          {/* form */}
          <section style={card}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>
              {editingId ? "Edit recurring rule" : "Create recurring rule"}
            </div>
            <form onSubmit={handleSubmit}>
              <div>
                <div style={label}>Title</div>
                <input
                  style={input}
                  value={form.title}
                  onChange={(e) => updateFormField("title", e.target.value)}
                  placeholder="e.g. Rent, Netflix, Salary"
                />
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 10,
                }}
              >
                <div>
                  <div style={label}>Type</div>
                  <select
                    style={input}
                    value={form.type}
                    onChange={(e) => updateFormField("type", e.target.value)}
                  >
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                  </select>
                </div>
                <div>
                  <div style={label}>Category</div>
                  <input
                    style={input}
                    value={form.category}
                    onChange={(e) =>
                      updateFormField("category", e.target.value)
                    }
                    placeholder="e.g. Rent, Subscription"
                  />
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 10,
                }}
              >
                <div>
                  <div style={label}>Amount (₹)</div>
                  <input
                    style={input}
                    type="number"
                    min="0"
                    value={form.amount}
                    onChange={(e) => updateFormField("amount", e.target.value)}
                  />
                </div>
                <div>
                  <div style={label}>Frequency</div>
                  <select
                    style={input}
                    value={form.frequency}
                    onChange={(e) =>
                      updateFormField("frequency", e.target.value)
                    }
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>

              <div>
                <div style={label}>Next occurrence date</div>
                <input
                  type="date"
                  style={input}
                  value={form.nextDate}
                  onChange={(e) => updateFormField("nextDate", e.target.value)}
                />
              </div>

              <div>
                <div style={label}>Note (optional)</div>
                <textarea
                  style={{ ...input, minHeight: 60, resize: "vertical" }}
                  value={form.note}
                  onChange={(e) => updateFormField("note", e.target.value)}
                  placeholder="Any extra info"
                />
              </div>

              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginBottom: 8,
                  fontSize: 13,
                  color: "#334155",
                  gap: 6,
                }}
              >
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => updateFormField("active", e.target.checked)}
                />
                Active (will be included in future automation)
              </label>

              <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                <button style={btn} type="submit" disabled={busy}>
                  {busy ? "Saving..." : editingId ? "Update rule" : "Add rule"}
                </button>
                {editingId && (
                  <button type="button" style={btnGhost} onClick={cancelEdit}>
                    Cancel
                  </button>
                )}
              </div>

              <div
                style={{
                  fontSize: 11,
                  color: "#64748b",
                  marginTop: 8,
                }}
              >
                Note: This page only stores your recurring templates. Actual
                auto-creation of transactions can be added later via a
                background job / Cloud Function.
              </div>
            </form>
          </section>

          {/* list */}
          <section style={card}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>
              Existing recurring rules
            </div>
            {loading ? (
              <div>Loading...</div>
            ) : rules.length === 0 ? (
              <div style={{ fontSize: 13, color: "#64748b" }}>
                No recurring rules yet. Create your first rule on the left.
              </div>
            ) : (
              <div
                style={{
                  maxHeight: 380,
                  overflowY: "auto",
                  display: "grid",
                  gap: 8,
                }}
              >
                {rules.map((r) => {
                  const d = toDate(r.nextDate);
                  const dateText = d ? d.toLocaleDateString() : "—";
                  const amt = Math.abs(toNumber(r.amount));
                  return (
                    <div
                      key={r.id}
                      style={{
                        borderRadius: 8,
                        padding: 10,
                        background: "#f9fafb",
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 10,
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700 }}>{r.title}</div>
                        <div
                          style={{
                            fontSize: 12,
                            color: "#64748b",
                            marginTop: 2,
                          }}
                        >
                          {r.type === "income" ? "Income" : "Expense"} •{" "}
                          {r.category || "No category"} • {r.frequency} • Next:{" "}
                          {dateText}
                        </div>
                        {r.note && (
                          <div
                            style={{
                              fontSize: 12,
                              color: "#6b7280",
                              marginTop: 2,
                            }}
                          >
                            {r.note}
                          </div>
                        )}
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: 14,
                            color: r.type === "income" ? "#16a34a" : "#ef4444",
                          }}
                        >
                          ₹ {amt}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: r.active ? "#15803d" : "#9ca3af",
                            marginTop: 4,
                          }}
                        >
                          {r.active ? "Active" : "Paused"}
                        </div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "flex-end",
                            gap: 6,
                            marginTop: 6,
                          }}
                        >
                          <button
                            style={btnGhost}
                            type="button"
                            onClick={() => handleEdit(r)}
                          >
                            Edit
                          </button>
                          <button
                            style={{
                              ...btnGhost,
                              background: "#fef2f2",
                              border: "1px solid #fecaca",
                              color: "#b91c1c",
                            }}
                            type="button"
                            onClick={() => handleDelete(r)}
                          >
                            Delete
                          </button>
                          <button
                            style={btnGhost}
                            type="button"
                            onClick={() => toggleActive(r)}
                          >
                            {r.active ? "Pause" : "Resume"}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
