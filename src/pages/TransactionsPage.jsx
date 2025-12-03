// src/pages/TransactionsPage.jsx
import React, { useEffect, useState, useMemo } from "react";
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc,
  serverTimestamp,
  Timestamp,
  getDocs,
} from "firebase/firestore";

import { db, auth } from "../firebase";
import TransactionForm from "../components/TransactionForm";
import BackButton from "../components/BackButton"; // ← ADDED

// Inline self-contained summary-cards component so no external import needed
function TransactionsWithCards({ stats = {} }) {
  const balance = Number(stats.balance ?? 0);
  const income = Number(stats.income ?? 0);
  const expense = Number(stats.expense ?? 0);

  const cardStyle = {
    background: "#ffffff",
    borderRadius: 12,
    padding: 14,
    boxShadow: "0 6px 18px rgba(2,6,23,0.06)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  };

  const container = {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 12,
    alignItems: "start",
  };

  function fmt(n) {
    try {
      return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
      }).format(n);
    } catch (e) {
      return "₹" + Number(n).toFixed(2);
    }
  }

  return (
    <div style={{ width: "100%" }}>
      <div style={container}>
        <div style={cardStyle}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>Balance</div>
          <div style={{ marginTop: 8, fontSize: 20, fontWeight: 800, color: "#0f172a" }}>{fmt(balance)}</div>
          <div style={{ marginTop: 6, fontSize: 12, color: "#64748b" }}>Available</div>
        </div>

        <div style={cardStyle}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>Income</div>
          <div style={{ marginTop: 8, fontSize: 20, fontWeight: 800, color: "#047857" }}>{fmt(income)}</div>
          <div style={{ marginTop: 6, fontSize: 12, color: "#64748b" }}>This month</div>
        </div>

        <div style={cardStyle}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>Expenses</div>
          <div style={{ marginTop: 8, fontSize: 20, fontWeight: 800, color: "#b91c1c" }}>{fmt(expense)}</div>
          <div style={{ marginTop: 6, fontSize: 12, color: "#64748b" }}>This month</div>
        </div>
      </div>

      <div style={{ marginTop: 8, color: "#94a3b8", fontSize: 13 }}>Overview • Updated just now</div>
    </div>
  );
}

export default function TransactionsPage({ user }) {
  const [currentUser, setCurrentUser] = useState(user || auth.currentUser || null);
  const userId = currentUser?.uid;
  const [transactions, setTransactions] = useState([]);
  const [editing, setEditing] = useState(null);
  const [status, setStatus] = useState({ type: "", text: "" });

  // Debug toggle: if true, will subscribe to ALL transactions (no user filter)
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    // Keep currentUser in sync reliably
    setCurrentUser(user || auth.currentUser || null);
    const unsubAuth = auth.onAuthStateChanged((u) => {
      setCurrentUser(u || null);
    });
    return () => unsubAuth();
  }, [user]);

  useEffect(() => {
    // If not signed in and not showing all, clear
    if (!userId && !showAll) {
      setTransactions([]);
      return;
    }

    // Build query: if showAll true, do not apply where("userId", "==", userId)
    let q;
    if (showAll) {
      q = query(collection(db, "transactions"), orderBy("createdAt", "desc"));
    } else {
      q = query(collection(db, "transactions"), where("userId", "==", userId), orderBy("createdAt", "desc"));
    }

    const unsub = onSnapshot(
      q,
      (snap) => {
        const arr = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setTransactions(arr);
        // Clear any previous error status on successful load
        if (arr.length > 0 && status.type === "error") setStatus({ type: "", text: "" });
      },
      (err) => {
        console.error("onSnapshot error:", err);
        setStatus({ type: "error", text: "Failed to load transactions." });
      }
    );
    return () => unsub();
    // include showAll so toggling updates the subscription
  }, [userId, showAll]);

  // helper: Indian currency formatter
  function formatCurrency(n) {
    try {
      return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(Number(n || 0));
    } catch (e) {
      return "₹" + Number(n || 0).toFixed(2);
    }
  }

  // helper: show signed amount with + / - and formatted absolute value
  function formatSignedAmount(n, type) {
    const abs = formatCurrency(Math.abs(Number(n || 0)));
    return type === "income" ? `+ ${abs}` : `- ${abs}`;
  }

  // compute totals
  const totals = useMemo(() => {
    let income = 0,
      expense = 0;
    for (const t of transactions) {
      const amt = Number(t.amount) || 0;
      if (t.type === "income") income += amt;
      else expense += amt;
    }
    const balance = income - expense;
    return { income, expense, balance };
  }, [transactions]);

  async function addTransaction(data) {
    if (!userId) {
      setStatus({ type: "error", text: "You must be signed in to add transactions." });
      return;
    }
    setStatus({ type: "loading", text: "Saving..." });

    try {
      // Ensure date is stored as Firestore Timestamp
      const dateField = data.date ? Timestamp.fromDate(new Date(data.date)) : serverTimestamp();
      const payload = {
        ...data,
        amount: Number(data.amount),
        userId,
        date: dateField,
        createdAt: serverTimestamp(),
      };
      const docRef = await addDoc(collection(db, "transactions"), payload);
      console.log("Saved transaction id:", docRef.id);
      setStatus({ type: "success", text: "Transaction saved." });
    } catch (err) {
      console.error("Add transaction error:", err);
      setStatus({ type: "error", text: "Save failed: " + (err.message || err.code || "") });
    } finally {
      setTimeout(() => setStatus({ type: "", text: "" }), 1200);
    }
  }

  async function saveEdit(id, data) {
    if (!id) return;
    try {
      // convert date if present
      const updatePayload = {
        ...data,
        amount: Number(data.amount),
        updatedAt: serverTimestamp(),
      };
      if (data.date) updatePayload.date = Timestamp.fromDate(new Date(data.date));
      await updateDoc(doc(db, "transactions", id), updatePayload);
      setEditing(null);
      setStatus({ type: "success", text: "Updated." });
      setTimeout(() => setStatus({ type: "", text: "" }), 1000);
    } catch (err) {
      console.error("Update error:", err);
      setStatus({ type: "error", text: "Update failed." });
    }
  }

  async function removeTransaction(id) {
    if (!confirm("Delete this transaction?")) return;
    try {
      await deleteDoc(doc(db, "transactions", id));
      setStatus({ type: "success", text: "Deleted." });
      setTimeout(() => setStatus({ type: "", text: "" }), 900);
    } catch (err) {
      console.error("Delete error:", err);
      setStatus({ type: "error", text: "Delete failed." });
    }
  }

  // Debug helper: log all transactions (raw) to console
  async function debugLogAll() {
    try {
      const snap = await getDocs(collection(db, "transactions"));
      console.group("DEBUG: all transactions");
      snap.forEach((d) => console.log(d.id, d.data()));
      console.groupEnd();
      alert("All transactions logged to console.");
    } catch (err) {
      console.error("Debug fetch error:", err);
      alert("Debug fetch failed — see console.");
    }
  }

  return (
    <div style={{ minHeight: "80vh", padding: 24, display: "flex", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: 1100 }}>
        {/* TOP HEADER — BACK + PAGE TITLE + USER INFO */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>

          {/* 🔙 Back Button */}
          <BackButton label="←" />

          {/* PAGE TITLE */}
          <h2 style={{ color: "#fff", margin: 0 }}>Transactions</h2>

          {/* RIGHT SIDE — USER INFO */}
          <div style={{ marginLeft: "auto", color: "#fff", opacity: 0.9 }}>
            {currentUser ? `Signed in as: ${currentUser.email || currentUser.displayName}` : "Not signed in"}
          </div>
        </div>

        {status.type && (
          <div
            style={{
              marginBottom: 12,
              padding: 10,
              borderRadius: 8,
              color: status.type === "error" ? "#7f1d1d" : "#064e3b",
              background: status.type === "error" ? "rgba(254,202,202,0.12)" : "rgba(204,251,241,0.08)",
            }}
          >
            {status.text}
          </div>
        )}

        {/* Summary cards + debug controls */}
        <div style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <TransactionsWithCards stats={{ balance: totals.balance, income: totals.income, expense: totals.expense }} />
          </div>

          {/* debug controls */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <button onClick={debugLogAll} style={{ padding: "8px 12px", borderRadius: 8 }}>
              Debug: Log all transactions
            </button>
            <label style={{ color: "#fff", fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
              <input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} />
              <span>Show all transactions (debug)</span>
            </label>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 420px", gap: 20 }}>
          {/* Left: list */}
          <div style={{ background: "#fff", borderRadius: 12, padding: 18, boxShadow: "0 8px 30px rgba(2,6,23,0.08)" }}>
            <h4 style={{ marginTop: 0 }}>Recent Transactions</h4>
            {transactions.length === 0 ? (
              <div style={{ padding: 28, textAlign: "center", color: "#666" }}>No transactions yet.</div>
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                {transactions.map((tx) => {
                  // tx.date may be a Firestore Timestamp
                  let dateText = "";
                  try {
                    if (tx.date && typeof tx.date.toDate === "function") {
                      dateText = tx.date.toDate().toLocaleDateString();
                    } else {
                      dateText = new Date(tx.date).toLocaleDateString();
                    }
                  } catch (e) {
                    dateText = "";
                  }
                  return (
                    <div
                      key={tx.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: 12,
                        borderRadius: 10,
                        background: "#f8fafc",
                        border: "1px solid #eef2f6",
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700 }}>{tx.category}</div>
                        <div style={{ fontSize: 12, color: "#666" }}>{dateText}</div>
                        {tx.note && <div style={{ marginTop: 6 }}>{tx.note}</div>}
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontWeight: 800, color: tx.type === "income" ? "#0b8a4e" : "#d32f2f" }}>
                          {formatSignedAmount(tx.amount, tx.type)}
                        </div>
                        <div style={{ marginTop: 8, display: "flex", gap: 8, justifyContent: "flex-end" }}>
                          <button onClick={() => setEditing(tx)}>Edit</button>
                          <button onClick={() => removeTransaction(tx.id)} style={{ color: "#d32f2f" }}>
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right: form */}
          <aside style={{ background: "#fff", borderRadius: 12, padding: 16, boxShadow: "0 8px 30px rgba(2,6,23,0.08)" }}>
            <h4 style={{ marginTop: 0 }}>{editing ? "Edit Transaction" : "Add New Transaction"}</h4>

            <TransactionForm
              initial={editing}
              onSave={async (data) => {
                if (editing) {
                  await saveEdit(editing.id, data);
                } else {
                  await addTransaction(data);
                }
              }}
            />

            {editing && (
              <div style={{ marginTop: 10 }}>
                <button onClick={() => setEditing(null)}>Cancel</button>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
