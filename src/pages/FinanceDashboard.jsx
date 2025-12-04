// src/pages/FinanceDashboard.jsx
import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import ProfileMenu from "../components/ProfileMenu";
import BackButton from "../components/BackButton";
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

const COLORS = [
  "#4caf50",
  "#f44336",
  "#ff9800",
  "#2196f3",
  "#9c27b0",
  "#795548",
];

/**
 * GLOBAL DASHBOARD CSS
 * - skeleton shimmer
 * - responsive grid layouts
 * - budget overview layout (list + chart)
 */
const DASHBOARD_STYLES = `
  @keyframes dashboard-pulse {
    0% { opacity: 0.6; }
    50% { opacity: 1; }
    100% { opacity: 0.6; }
  }

  .dashboard-skeleton {
    border-radius: 10px;
    background: linear-gradient(90deg, #e2e8f0, #f7fafc, #e2e8f0);
    background-size: 200% 100%;
    animation: dashboard-pulse 1.5s ease-in-out infinite;
  }

  .dashboard-grid-3 {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 16px;
    margin-bottom: 16px;
  }

  .dashboard-grid-2 {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
  }

  .dashboard-grid-bottom {
    margin-top: 18px;
    display: grid;
    grid-template-columns: minmax(0, 1.7fr) 300px;
    gap: 16px;
  }

  .budget-overview-layout {
    display: grid;
    grid-template-columns: minmax(0, 1.7fr) minmax(0, 1.1fr);
    gap: 18px;
    align-items: stretch;
  }

  @media (max-width: 900px) {
    .dashboard-grid-3 {
      grid-template-columns: minmax(0, 1fr);
    }
    .dashboard-grid-2 {
      grid-template-columns: minmax(0, 1fr);
    }
    .dashboard-grid-bottom {
      grid-template-columns: minmax(0, 1fr);
    }
    .budget-overview-layout {
      grid-template-columns: minmax(0, 1fr);
    }
  }
`;

// Helper: robust date parser (supports Firestore Timestamp or ISO/number/string)
function toDate(d) {
  if (!d) return null;
  try {
    if (typeof d.toDate === "function") return d.toDate();
    const maybe = new Date(d);
    if (!isNaN(maybe)) return maybe;
  } catch (e) {}
  return null;
}

// Helper: ensure amount is a number and use absolute value for aggregations
function toNumber(n) {
  const v = Number(n);
  return isNaN(v) ? 0 : v;
}

// Small loading block for inside cards
function CardSkeleton({ height = 80 }) {
  return (
    <div
      className="dashboard-skeleton"
      style={{ width: "100%", height, marginTop: 8 }}
    />
  );
}

// Simple CSV escape
function escapeCsv(value) {
  const str = value == null ? "" : String(value);
  const escaped = str.replace(/"/g, '""');
  return `"${escaped}"`;
}

export default function FinanceDashboard({ user, onLogout }) {
  const userId = user?.uid;

  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState([]);

  const [isLoadingTx, setIsLoadingTx] = useState(true);
  const [isLoadingBudgets, setIsLoadingBudgets] = useState(true);
  const [exportMessage, setExportMessage] = useState("");

  // Inject CSS once
  useEffect(() => {
    const styleTag = document.createElement("style");
    styleTag.innerHTML = DASHBOARD_STYLES;
    document.head.appendChild(styleTag);
    return () => {
      document.head.removeChild(styleTag);
    };
  }, []);

  // Load transactions (live)
  useEffect(() => {
    if (!userId) return;

    setIsLoadingTx(true);
    const q = query(
      collection(db, "transactions"),
      where("userId", "==", userId)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const arr = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setTransactions(arr);
        setIsLoadingTx(false);
      },
      () => {
        // error case
        setIsLoadingTx(false);
      }
    );

    return () => unsub();
  }, [userId]);

  // Load budgets (per category)
  useEffect(() => {
    if (!userId) return;
    setIsLoadingBudgets(true);

    const q = query(collection(db, "budgets"), where("userId", "==", userId));

    const unsub = onSnapshot(
      q,
      (snap) => {
        const arr = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setBudgets(arr);
        setIsLoadingBudgets(false);
      },
      () => {
        setIsLoadingBudgets(false);
      }
    );

    return () => unsub();
  }, [userId]);

  // KPI calculations (current month)
  const now = new Date();
  const monthKey = (d) => `${d.getFullYear()}-${d.getMonth() + 1}`;
  const currentMonthKey = monthKey(now);

  let monthlyIncome = 0,
    monthlyExpense = 0;

  transactions.forEach((t) => {
    const dateObj = toDate(t.date);
    if (!dateObj) return;
    const tMonth = monthKey(dateObj);
    if (tMonth !== currentMonthKey) return;

    const amt = toNumber(t.amount);
    if (t.type === "income") monthlyIncome += Math.abs(amt);
    else monthlyExpense += Math.abs(amt);
  });

  const net = monthlyIncome - monthlyExpense;

  // Pie chart data (expenses by category - current month only)
  const byCategory = {};
  transactions.forEach((t) => {
    if (t.type !== "expense") return;
    const dateObj = toDate(t.date);
    if (!dateObj) return;
    const tMonth = monthKey(dateObj);
    if (tMonth !== currentMonthKey) return;

    const amt = Math.abs(toNumber(t.amount));
    const cat = t.category || "Other";
    if (!byCategory[cat]) byCategory[cat] = 0;
    byCategory[cat] += amt;
  });

  const pieData = Object.keys(byCategory).map((k) => ({
    name: k,
    value: byCategory[k],
  }));

  // 6-month trend (all data)
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    months.push({
      label: d.toLocaleString("default", { month: "short" }),
      year: d.getFullYear(),
      monthIdx: d.getMonth(),
    });
  }

  const trendData = months.map((m) => {
    const monthKeyStr = `${m.year}-${m.monthIdx + 1}`;
    let inc = 0,
      exp = 0;
    transactions.forEach((t) => {
      const dateObj = toDate(t.date);
      if (!dateObj) return;
      const tMonth = `${dateObj.getFullYear()}-${dateObj.getMonth() + 1}`;
      if (tMonth !== monthKeyStr) return;
      const amt = Math.abs(toNumber(t.amount));
      if (t.type === "income") inc += amt;
      else exp += amt;
    });
    return { name: m.label, Income: inc, Expense: exp };
  });

  // Budget progress (per category)
  const budgetProgress = budgets.map((b) => {
    const limit = Math.max(toNumber(b.limit), 0);

    const isForCurrentMonth =
      b.month != null && b.year != null
        ? Number(b.month) === now.getMonth() + 1 &&
          Number(b.year) === now.getFullYear()
        : true;

    const spent = isForCurrentMonth ? byCategory[b.category] || 0 : 0;
    const usedPct = limit > 0 ? Math.round((spent / limit) * 100) : 0;
    const remaining = Math.max(limit - spent, 0);

    let statusColor = "#4caf50"; // safe
    if (usedPct >= 80 && usedPct <= 100) statusColor = "#ff9800"; // warning
    if (usedPct > 100) statusColor = "#f44336"; // over

    let statusText = "On track";
    if (usedPct >= 80 && usedPct <= 100) statusText = "Close to limit";
    if (usedPct > 100) statusText = "Over budget";

    return {
      id: b.id,
      category: b.category || "Uncategorized",
      limit,
      spent,
      remaining,
      usedPct,
      statusColor,
      statusText,
    };
  });

  // NEW: data for budget bar chart
  const budgetChartData = budgetProgress.map((b) => ({
    category: b.category,
    Spent: b.spent,
    Remaining: b.remaining,
  }));

  // Styles: white cards for clarity — set text color explicitly to black
  const cardStyle = {
    background: "#ffffff",
    color: "#000",
    padding: 18,
    borderRadius: 10,
    boxShadow: "0 6px 20px rgba(3,10,18,0.25)",
  };

  const kpiVal = { fontSize: 22, fontWeight: 800, color: "#000" };

  // EXPORT CSV (all transactions)
  const handleExportCsv = () => {
    if (!transactions.length) {
      alert("No transactions to export yet.");
      return;
    }

    const header = [
      "Date",
      "Type",
      "Category",
      "Amount",
      "Note",
      "Created At",
    ];

    const rows = transactions.map((t) => {
      const dateObj = toDate(t.date);
      const createdAtObj = toDate(t.createdAt);
      return [
        dateObj ? dateObj.toISOString().slice(0, 10) : "",
        t.type || "",
        t.category || "",
        toNumber(t.amount),
        t.note || "",
        createdAtObj ? createdAtObj.toISOString() : "",
      ];
    });

    const csvString = [header, ...rows]
      .map((row) => row.map(escapeCsv).join(","))
      .join("\n");

    const blob = new Blob([csvString], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "transactions_export.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setExportMessage("CSV exported successfully!");
    setTimeout(() => setExportMessage(""), 3000);
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* LEFT SIDEBAR */}
      <Sidebar />

      {/* MAIN AREA */}
      <div style={{ flex: 1, padding: 18 }}>
        {/* TOP NAV — logo left, profile right */}
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
            Dashboard
          </div>

          <div
            style={{
              marginLeft: "auto",
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div style={{ color: "#0f0e0eff", opacity: 0.9 }}>
              Hi,{" "}
              <strong style={{ color: "#0b0b0bff" }}>
                {user?.displayName || (user?.email || "").split("@")[0]}
              </strong>
            </div>
            <ProfileMenu user={user} onLogout={onLogout} />
          </div>
        </div>

        {/* KPI row */}
        <div className="dashboard-grid-3">
          <div style={cardStyle}>
            <div style={{ opacity: 0.7, color: "#000" }}>Monthly Income</div>
            {isLoadingTx ? (
              <CardSkeleton height={32} />
            ) : (
              <div style={kpiVal}>{monthlyIncome}</div>
            )}
          </div>

          <div style={cardStyle}>
            <div style={{ opacity: 0.7, color: "#000" }}>Monthly Expenses</div>
            {isLoadingTx ? (
              <CardSkeleton height={32} />
            ) : (
              <div style={{ ...kpiVal, color: "#e53935" }}>
                {monthlyExpense}
              </div>
            )}
          </div>

          <div style={cardStyle}>
            <div style={{ opacity: 0.7, color: "#000" }}>Net Savings</div>
            {isLoadingTx ? (
              <CardSkeleton height={32} />
            ) : (
              <div style={kpiVal}>{net}</div>
            )}
          </div>
        </div>

        {/* Budget overview row */}
        <div style={{ ...cardStyle, marginBottom: 16 }}>
          <h4 style={{ marginTop: 0, color: "#000" }}>
            Budget Overview (Current Month)
          </h4>

          {isLoadingBudgets ? (
            <CardSkeleton height={80} />
          ) : budgetProgress.length === 0 ? (
            <div style={{ color: "#666", fontSize: 14 }}>
              No budgets set yet. Configure category-wise limits from the
              <button
                onClick={() => (window.location.href = "/settings")}
                style={{
                  marginLeft: 4,
                  padding: "4px 8px",
                  borderRadius: 6,
                  border: "none",
                  background: "#0b7b5b",
                  color: "#fff",
                  cursor: "pointer",
                  fontSize: 12,
                }}
              >
                Settings
              </button>
              page.
            </div>
          ) : (
            <div className="budget-overview-layout">
              {/* LEFT: list + progress bar */}
              <div style={{ display: "grid", gap: 10 }}>
                {budgetProgress.map((b) => (
                  <div key={b.id}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: 4,
                        fontSize: 13,
                      }}
                    >
                      <div style={{ fontWeight: 600 }}>{b.category}</div>
                      <div style={{ fontSize: 12 }}>
                        ₹{b.spent.toFixed(0)} / ₹{b.limit.toFixed(0)} (
                        {b.usedPct}%)
                      </div>
                    </div>

                    <div
                      style={{
                        width: "100%",
                        height: 10,
                        borderRadius: 999,
                        background: "#e2e8f0",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${Math.min(100, b.usedPct)}%`,
                          height: "100%",
                          background: b.statusColor,
                          transition: "width 0.3s ease",
                        }}
                      />
                    </div>

                    <div
                      style={{
                        marginTop: 4,
                        fontSize: 11,
                        color: b.statusColor,
                        fontWeight: 600,
                      }}
                    >
                      {b.statusText} • Remaining: ₹{b.remaining.toFixed(0)}
                    </div>
                  </div>
                ))}
              </div>

              {/* RIGHT: stacked bar chart (Spent vs Remaining) */}
              <div style={{ width: "100%", height: 220 }}>
                <ResponsiveContainer>
                  <BarChart
                    data={budgetChartData}
                    layout="vertical"
                    margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
                  >
                    <XAxis type="number" hide />
                    <YAxis
                      type="category"
                      dataKey="category"
                      width={80}
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="Spent" stackId="a" fill="#f97316" />
                    <Bar dataKey="Remaining" stackId="a" fill="#22c55e" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>

        {/* Charts row */}
        <div className="dashboard-grid-2">
          {/* Pie chart container — white card */}
          <div style={cardStyle}>
            <h4 style={{ marginTop: 0, color: "#000" }}>Spending Breakdown</h4>
            {isLoadingTx ? (
              <CardSkeleton height={260} />
            ) : pieData.length === 0 ? (
              <div style={{ color: "#666" }}>No expense data yet.</div>
            ) : (
              <div style={{ width: "100%", height: 300 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      label
                    >
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
            <h4 style={{ marginTop: 0, color: "#000" }}>
              6-Month Income vs Expense
            </h4>
            {isLoadingTx ? (
              <CardSkeleton height={260} />
            ) : (
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
            )}
          </div>
        </div>

        {/* Recent + Quick actions */}
        <div className="dashboard-grid-bottom">
          <div style={cardStyle}>
            <h4 style={{ marginTop: 0, color: "#000" }}>Recent Transactions</h4>
            {isLoadingTx ? (
              <>
                <CardSkeleton height={50} />
                <CardSkeleton height={50} />
                <CardSkeleton height={50} />
              </>
            ) : transactions.length === 0 ? (
              <div style={{ color: "#666" }}>
                No transactions. Add some from the Transactions page.
              </div>
            ) : (
              <div style={{ display: "grid", gap: 8 }}>
                {transactions
                  .slice()
                  .sort((a, b) => {
                    const da = toDate(a.date) || 0;
                    const db = toDate(b.date) || 0;
                    return db - da;
                  })
                  .slice(0, 6)
                  .map((tx) => {
                    const dateObj = toDate(tx.date);
                    const dateText = dateObj
                      ? dateObj.toLocaleDateString()
                      : "Invalid Date";
                    const amt = Math.abs(toNumber(tx.amount));
                    return (
                      <div
                        key={tx.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: 8,
                          borderRadius: 8,
                          background: "#f7fafc",
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 700, color: "#000" }}>
                            {tx.category}
                          </div>
                          <div style={{ fontSize: 12, color: "#555" }}>
                            {dateText}
                          </div>
                        </div>
                        <div
                          style={{
                            textAlign: "right",
                            color:
                              tx.type === "income" ? "#0b8a4e" : "#d32f2f",
                            fontWeight: 800,
                          }}
                        >
                          {tx.type === "income" ? `+ ${amt}` : `- ${amt}`}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>

          <div style={cardStyle}>
            <h4 style={{ marginTop: 0, color: "#000" }}>Quick Actions</h4>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <button
                onClick={() => (window.location.href = "/transactions")}
                style={{
                  padding: 10,
                  borderRadius: 8,
                  border: "none",
                  background: "#0b7b5b",
                  color: "#fff",
                  cursor: "pointer",
                }}
              >
                ➕ Add Transaction
              </button>

              <button
                onClick={() => (window.location.href = "/reports")}
                style={{
                  padding: 10,
                  borderRadius: 8,
                  border: "none",
                  background: "#2563eb",
                  color: "#fff",
                  cursor: "pointer",
                }}
              >
                📊 View Reports
              </button>

              <button
                onClick={() => (window.location.href = "/recurring")}
                style={{
                  padding: 10,
                  borderRadius: 8,
                  border: "none",
                  background: "#7c3aed",
                  color: "#fff",
                  cursor: "pointer",
                }}
              >
                🔁 Manage Recurring Transactions
              </button>

              <button
                onClick={handleExportCsv}
                style={{
                  padding: 10,
                  borderRadius: 8,
                  border: "1px solid #ddd",
                  background: "#fff",
                  color: "#222",
                  cursor: "pointer",
                }}
              >
                ⤓ Export CSV
              </button>

              {exportMessage && (
                <div
                  style={{
                    fontSize: 12,
                    color: "#16a34a",
                    marginTop: 4,
                    fontWeight: 600,
                  }}
                >
                  {exportMessage}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
