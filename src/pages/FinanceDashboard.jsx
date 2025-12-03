// src/pages/FinanceDashboard.jsx
import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import ProfileMenu from "../components/ProfileMenu";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Legend,
  ResponsiveContainer,
} from "recharts";

const COLORS = ["#4caf50", "#f44336", "#ff9800", "#2196f3", "#9c27b0", "#795548"];

export default function FinanceDashboard({ user, onLogout }) {
  const userId = user?.uid;
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    if (!userId) return;
    const q = query(collection(db, "transactions"), where("userId", "==", userId));
    const unsub = onSnapshot(q, (snap) => {
      const arr = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setTransactions(arr);
    });
    return () => unsub();
  }, [userId]);

  // KPI calculations
  const now = new Date();
  const monthKey = (d) => `${d.getFullYear()}-${d.getMonth() + 1}`;
  const currentMonthKey = monthKey(now);

  let monthlyIncome = 0,
    monthlyExpense = 0;
  transactions.forEach((t) => {
    const tMonth = monthKey(new Date(t.date));
    if (tMonth === currentMonthKey) {
      if (t.type === "income") monthlyIncome += t.amount;
      else monthlyExpense += t.amount;
    }
  });
  const net = monthlyIncome - monthlyExpense;

  // Pie chart data (expenses by category)
  const byCategory = {};
  transactions.forEach((t) => {
    const cat = t.category || "Other";
    if (!byCategory[cat]) byCategory[cat] = 0;
    if (t.type === "expense") byCategory[cat] += t.amount;
  });
  const pieData = Object.keys(byCategory).map((k) => ({ name: k, value: byCategory[k] }));

  // 6-month trend
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    months.push({ label: d.toLocaleString("default", { month: "short" }), year: d.getFullYear(), monthIdx: d.getMonth() });
  }
  const trendData = months.map((m) => {
    const monthKeyStr = `${m.year}-${m.monthIdx + 1}`;
    let inc = 0,
      exp = 0;
    transactions.forEach((t) => {
      const tMonth = `${new Date(t.date).getFullYear()}-${new Date(t.date).getMonth() + 1}`;
      if (tMonth === monthKeyStr) {
        if (t.type === "income") inc += t.amount;
        else exp += t.amount;
      }
    });
    return { name: m.label, Income: inc, Expense: exp };
  });

  // Styles: white cards for clarity
  const cardStyle = {
    background: "#ffffff",
    color: "#0b2430",
    padding: 18,
    borderRadius: 10,
    boxShadow: "0 6px 20px rgba(3,10,18,0.25)",
  };

  const kpiVal = { fontSize: 22, fontWeight: 800 };

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* LEFT SIDEBAR */}
      <Sidebar />

      {/* MAIN AREA */}
      <div style={{ flex: 1, padding: 18 }}>
        {/* TOP NAV — logo left, profile right */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#fff" }}>Dashboard</div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ color: "#fff", opacity: 0.9 }}>Hi, <strong style={{ color: "#fff" }}>{user?.displayName || (user?.email || "").split("@")[0]}</strong></div>
            {/* ProfileMenu uses same glass style as before; pass user and onLogout */}
            <ProfileMenu user={user} onLogout={onLogout} />
          </div>
        </div>

        {/* KPI row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 16 }}>
          <div style={cardStyle}>
            <div style={{ opacity: 0.7 }}>Monthly Income</div>
            <div style={kpiVal}>{monthlyIncome}</div>
          </div>

          <div style={cardStyle}>
            <div style={{ opacity: 0.7 }}>Monthly Expenses</div>
            <div style={{ ...kpiVal, color: "#e53935" }}>{monthlyExpense}</div>
          </div>

          <div style={cardStyle}>
            <div style={{ opacity: 0.7 }}>Net Savings</div>
            <div style={kpiVal}>{net}</div>
          </div>
        </div>

        {/* Charts row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {/* Pie chart container — white card */}
          <div style={cardStyle}>
            <h4 style={{ marginTop: 0 }}>Spending Breakdown</h4>
            {pieData.length === 0 ? (
              <div style={{ color: "#666" }}>No expense data yet.</div>
            ) : (
              <div style={{ width: "100%", height: 300 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                      {pieData.map((entry, idx) => (
                        <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Bar chart container — white card */}
          <div style={cardStyle}>
            <h4 style={{ marginTop: 0 }}>6-Month Income vs Expense</h4>
            <div style={{ width: "100%", height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={trendData}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Income" stackId="a" fill="#4caf50" />
                  <Bar dataKey="Expense" stackId="a" fill="#f44336" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Spacer and small transactions preview */}
        <div style={{ marginTop: 18, display: "grid", gridTemplateColumns: "1fr 300px", gap: 16 }}>
          <div style={cardStyle}>
            <h4 style={{ marginTop: 0 }}>Recent Transactions</h4>
            {transactions.length === 0 ? (
              <div style={{ color: "#666" }}>No transactions. Add some from the Transactions page.</div>
            ) : (
              <div style={{ display: "grid", gap: 8 }}>
                {transactions.slice(0, 6).map((tx) => (
                  <div key={tx.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 8, borderRadius: 8, background: "#f7fafc" }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{tx.category}</div>
                      <div style={{ fontSize: 12, color: "#555" }}>{new Date(tx.date).toLocaleDateString()}</div>
                    </div>
                    <div style={{ textAlign: "right", color: tx.type === "income" ? "#0b8a4e" : "#d32f2f", fontWeight: 800 }}>
                      {tx.type === "income" ? `+ ${tx.amount}` : `- ${tx.amount}`}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={cardStyle}>
            <h4 style={{ marginTop: 0 }}>Quick Actions</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button onClick={() => window.location.href = "/transactions"} style={{ padding: 10, borderRadius: 8, border: "none", background: "#0b7b5b", color: "#fff", cursor: "pointer" }}>➕ Add Transaction</button>
              <button onClick={() => alert("Export coming soon")} style={{ padding: 10, borderRadius: 8, border: "1px solid #ddd", background: "#fff", color: "#222", cursor: "pointer" }}>⤓ Export CSV</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
