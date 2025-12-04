// FULL UPDATED FILE — ALL TEXT BLACK
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
import BackButton from "../components/BackButton";

// Summary cards
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
    color: "#000",
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
    <div style={{ width: "100%", color: "#000" }}>
      <div style={container}>
        <div style={cardStyle}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>Balance</div>
          <div style={{ marginTop: 8, fontSize: 20, fontWeight: 800 }}>
            {fmt(balance)}
          </div>
          <div style={{ marginTop: 6, fontSize: 12 }}>Available</div>
        </div>

        <div style={cardStyle}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>Income</div>
          <div
            style={{
              marginTop: 8,
              fontSize: 20,
              fontWeight: 800,
              color: "#047857",
            }}
          >
            {fmt(income)}
          </div>
          <div style={{ marginTop: 6, fontSize: 12 }}>This month</div>
        </div>

        <div style={cardStyle}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>Expenses</div>
          <div
            style={{
              marginTop: 8,
              fontSize: 20,
              fontWeight: 800,
              color: "#b91c1c",
            }}
          >
            {fmt(expense)}
          </div>
          <div style={{ marginTop: 6, fontSize: 12 }}>This month</div>
        </div>
      </div>

      <div style={{ marginTop: 8, fontSize: 13 }}>
        Overview • Updated just now
      </div>
    </div>
  );
}

export default function TransactionsPage({ user }) {
  const [currentUser, setCurrentUser] = useState(
    user || auth.currentUser || null
  );
  const userId = currentUser?.uid;
  const [transactions, setTransactions] = useState([]);
  const [editing, setEditing] = useState(null);
  const [status, setStatus] = useState({ type: "", text: "" });

  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    setCurrentUser(user || auth.currentUser || null);
    const unsubAuth = auth.onAuthStateChanged((u) => {
      setCurrentUser(u || null);
    });
    return () => unsubAuth();
  }, [user]);

  useEffect(() => {
    if (!userId && !showAll) {
      setTransactions([]);
      return;
    }

    let q;
    if (showAll) {
      q = query(collection(db, "transactions"), orderBy("createdAt", "desc"));
    } else {
      q = query(
        collection(db, "transactions"),
        where("userId", "==", userId),
        orderBy("createdAt", "desc")
      );
    }

    const unsub = onSnapshot(
      q,
      (snap) => {
        const arr = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setTransactions(arr);
      },
      () => {
        setStatus({ type: "error", text: "Failed to load transactions." });
      }
    );
    return () => unsub();
  }, [userId, showAll]);

  function formatCurrency(n) {
    try {
      return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
      }).format(Number(n || 0));
    } catch (e) {
      return "₹" + Number(n || 0).toFixed(2);
    }
  }

  function formatSignedAmount(n, type) {
    const abs = formatCurrency(Math.abs(Number(n || 0)));
    return type === "income" ? `+ ${abs}` : `- ${abs}`;
  }

  const totals = useMemo(() => {
    let income = 0,
      expense = 0;

    for (const t of transactions) {
      const amt = Number(t.amount) || 0;
      if (t.type === "income") income += amt;
      else expense += amt;
    }

    return {
      income,
      expense,
      balance: income - expense,
    };
  }, [transactions]);

  async function addTransaction(data) {
    if (!userId) return;

    try {
      const dateField = data.date
        ? Timestamp.fromDate(new Date(data.date))
        : serverTimestamp();
      await addDoc(collection(db, "transactions"), {
        ...data,
        amount: Number(data.amount),
        userId,
        date: dateField,
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      console.log(err);
    }
  }

  async function saveEdit(id, data) {
    try {
      const updatePayload = {
        ...data,
        amount: Number(data.amount),
        updatedAt: serverTimestamp(),
      };
      if (data.date)
        updatePayload.date = Timestamp.fromDate(new Date(data.date));

      await updateDoc(doc(db, "transactions", id), updatePayload);
      setEditing(null);
    } catch (err) {
      console.log(err);
    }
  }

  async function removeTransaction(id) {
    if (!confirm("Delete?")) return;

    try {
      await deleteDoc(doc(db, "transactions", id));
    } catch (err) {
      console.log(err);
    }
  }

  return (
    <div
      style={{
        minHeight: "80vh",
        padding: 24,
        display: "flex",
        justifyContent: "center",
        color: "#000",
      }}
    >
      <div style={{ width: "100%", maxWidth: 1100, color: "#000" }}>
        {/* HEADER */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 14,
            color: "#000",
          }}
        >
          <BackButton label="←" />
          <h2 style={{ color: "#000", margin: 0 }}>Transactions</h2>

          <div style={{ marginLeft: "auto", color: "#000" }}>
            {currentUser
              ? `Signed in as: ${currentUser.email}`
              : "Not signed in"}
          </div>
        </div>

        {/* Summary cards */}
        <div
          style={{
            marginBottom: 12,
            display: "flex",
            alignItems: "center",
            gap: 12,
            color: "#000",
          }}
        >
          <div style={{ flex: 1 }}>
            <TransactionsWithCards stats={totals} />
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              color: "#000",
            }}
          >
            <button style={{ padding: "8px 12px", borderRadius: 8 }}>
              Debug: Log all
            </button>

            <label
              style={{ color: "#000", fontSize: 13, display: "flex", gap: 8 }}
            >
              <input
                type="checkbox"
                checked={showAll}
                onChange={(e) => setShowAll(e.target.checked)}
              />
              Show all transactions
            </label>
          </div>
        </div>

        {/* BODY */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 420px",
            gap: 20,
            color: "#000",
          }}
        >
          {/* LEFT LIST */}
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              padding: 18,
              boxShadow: "0 8px 30px rgba(2,6,23,0.08)",
              color: "#000",
            }}
          >
            <h4 style={{ marginTop: 0, color: "#000" }}>Recent Transactions</h4>

            {transactions.length === 0 ? (
              <div style={{ padding: 28, textAlign: "center", color: "#000" }}>
                No transactions yet
              </div>
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                {transactions.map((tx) => {
                  let dateText = "";

                  try {
                    if (tx.date?.toDate) {
                      dateText = tx.date.toDate().toLocaleDateString();
                    } else {
                      dateText = new Date(tx.date).toLocaleDateString();
                    }
                  } catch {}

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
                        color: "#000",
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, color: "#000" }}>
                          {tx.category}
                        </div>
                        <div style={{ fontSize: 12, color: "#000" }}>
                          {dateText}
                        </div>
                        {tx.note && (
                          <div style={{ marginTop: 6, color: "#000" }}>
                            {tx.note}
                          </div>
                        )}
                      </div>

                      <div style={{ textAlign: "right", color: "#000" }}>
                        <div
                          style={{
                            fontWeight: 800,
                            color: tx.type === "income" ? "#047857" : "#b91c1c",
                          }}
                        >
                          {formatSignedAmount(tx.amount, tx.type)}
                        </div>

                        <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                          <button onClick={() => setEditing(tx)}>Edit</button>
                          <button
                            onClick={() => removeTransaction(tx.id)}
                            style={{ color: "#b91c1c" }}
                          >
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

          {/* RIGHT FORM */}
          <aside
            style={{
              background: "#fff",
              borderRadius: 12,
              padding: 16,
              boxShadow: "0 8px 30px rgba(2,6,23,0.08)",
              color: "#000",
            }}
          >
            <h4 style={{ marginTop: 0, color: "#000" }}>
              {editing ? "Edit Transaction" : "Add New Transaction"}
            </h4>

            <TransactionForm
              initial={editing}
              onSave={(data) =>
                editing ? saveEdit(editing.id, data) : addTransaction(data)
              }
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
