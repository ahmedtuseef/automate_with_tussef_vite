// src/pages/TransactionsPage.jsx
import React, { useEffect, useState } from "react";
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
} from "firebase/firestore";
import { db, auth } from "../firebase"; // auth fallback included
import TransactionForm from "../components/TransactionForm";

export default function TransactionsPage({ user }) {
  // fallback to firebase auth currentUser if user prop not provided
  const [currentUser, setCurrentUser] = useState(user || auth.currentUser || null);
  const userId = currentUser?.uid;
  const [transactions, setTransactions] = useState([]);
  const [editing, setEditing] = useState(null);
  const [status, setStatus] = useState({ type: "", text: "" });

  // keep currentUser in sync if user prop changes or auth updates
  useEffect(() => {
    setCurrentUser(user || auth.currentUser || null);

    // also listen for auth state changes in case route didn't pass user
    const unsubAuth = auth.onAuthStateChanged((u) => {
      setCurrentUser((prev) => prev || u);
    });
    return () => unsubAuth();
  }, [user]);

  useEffect(() => {
    if (!userId) {
      setTransactions([]);
      return;
    }
    const q = query(
      collection(db, "transactions"),
      where("userId", "==", userId),
      orderBy("date", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      const arr = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setTransactions(arr);
    });
    return () => unsub();
  }, [userId]);

  async function addTransaction(data) {
    if (!userId) {
      setStatus({ type: "error", text: "You must be signed in to add transactions." });
      return;
    }

    setStatus({ type: "loading", text: "Saving..." });
    try {
      await addDoc(collection(db, "transactions"), {
        ...data,
        userId,
        createdAt: new Date().toISOString(),
      });
      setStatus({ type: "success", text: "Transaction saved." });
    } catch (err) {
      console.error("Add transaction error:", err);
      setStatus({ type: "error", text: err.message || "Save failed." });
    } finally {
      // clear loading after short delay so user sees result
      setTimeout(() => setStatus({ type: "", text: "" }), 1200);
    }
  }

  async function removeTransaction(id) {
    if (!confirm("Delete this transaction?")) return;
    try {
      await deleteDoc(doc(db, "transactions", id));
      setStatus({ type: "success", text: "Deleted." });
      setTimeout(() => setStatus({ type: "", text: "" }), 1000);
    } catch (err) {
      console.error(err);
      setStatus({ type: "error", text: "Delete failed." });
    }
  }

  async function saveEdit(id, data) {
    try {
      await updateDoc(doc(db, "transactions", id), data);
      setEditing(null);
      setStatus({ type: "success", text: "Updated." });
      setTimeout(() => setStatus({ type: "", text: "" }), 1000);
    } catch (err) {
      console.error(err);
      setStatus({ type: "error", text: "Update failed." });
    }
  }

  return (
    <div style={{ minHeight: "80vh", padding: 20, display: "flex", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: 1100 }}>
        <h2 style={{ color: "#fff", marginTop: 0 }}>Transactions</h2>

        {/* status */}
        {status.type && (
          <div
            style={{
              marginBottom: 12,
              padding: 10,
              borderRadius: 8,
              color: status.type === "error" ? "#7f1d1d" : "#064e3b",
              background: status.type === "error" ? "rgba(254, 202, 202, 0.12)" : "rgba(204, 251, 241, 0.12)",
              border: status.type === "error" ? "1px solid rgba(254,202,202,0.35)" : "1px solid rgba(164,243,235,0.25)",
            }}
          >
            {status.text}
          </div>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 420px",
            gap: 20,
            alignItems: "start",
          }}
        >
          {/* Transactions list card */}
          <div style={{ background: "#fff", borderRadius: 10, padding: 16, boxShadow: "0 6px 20px rgba(0,0,0,0.06)" }}>
            <h4 style={{ marginTop: 0 }}>Recent Transactions</h4>
            {transactions.length === 0 ? (
              <div style={{ padding: 30, textAlign: "center", color: "#444" }}>No transactions yet.</div>
            ) : (
              <div style={{ display: "grid", gap: 8 }}>
                {transactions.map((tx) => (
                  <div
                    key={tx.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: 10,
                      borderRadius: 8,
                      background: "#f7fafc",
                      border: "1px solid #eee",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700 }}>{tx.category}</div>
                      <div style={{ fontSize: 12, color: "#666" }}>{new Date(tx.date).toLocaleDateString()}</div>
                      {tx.note && <div style={{ marginTop: 6 }}>{tx.note}</div>}
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: 800, color: tx.type === "income" ? "#0b8a4e" : "#d32f2f" }}>
                        {tx.type === "income" ? `+ ${tx.amount}` : `- ${tx.amount}`}
                      </div>
                      <div style={{ marginTop: 8, display: "flex", gap: 8, justifyContent: "flex-end" }}>
                        <button onClick={() => setEditing(tx)} style={{ cursor: "pointer" }}>
                          Edit
                        </button>
                        <button onClick={() => removeTransaction(tx.id)} style={{ cursor: "pointer", color: "#d32f2f" }}>
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Form card */}
          <aside style={{ background: "#fff", borderRadius: 10, padding: 16, boxShadow: "0 6px 20px rgba(0,0,0,0.06)" }}>
            <h4 style={{ marginTop: 0 }}>{editing ? "Edit Transaction" : "Add Transaction"}</h4>

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
                <button onClick={() => setEditing(null)} style={{ padding: "8px 10px", borderRadius: 6 }}>
                  Cancel
                </button>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
