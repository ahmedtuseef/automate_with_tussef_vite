// src/pages/FinanceDashboard.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; // ✅ NEW
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

  .goals-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 12px;
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

// Helper: robust date parser
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

function CardSkeleton({ height = 80 }) {
  return (
    <div
      className="dashboard-skeleton"
      style={{ width: "100%", height, marginTop: 8 }}
    />
  );
}

function escapeCsv(value) {
  const str = value == null ? "" : String(value);
  const escaped = str.replace(/"/g, '""');
  return `"${escaped}"`;
}

// 🔢 Small helpers for calendar
const pad2 = (n) => String(n).padStart(2, "0");
const weekdayShort = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * Build monthly expense calendar data for the given month (based on `now`)
 * - Only "expense" transactions
 * - Groups by date
 */
function buildMonthlyExpenseCalendar(transactions, now) {
  const year = now.getFullYear();
  const monthIdx = now.getMonth(); // 0-based
  const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();

  // Sum expenses per ISO date
  const expenseByDate = {};
  transactions.forEach((t) => {
    if (t.type !== "expense") return;
    const dateObj = toDate(t.date);
    if (!dateObj) return;
    if (dateObj.getFullYear() !== year || dateObj.getMonth() !== monthIdx)
      return;

    const iso = `${year}-${pad2(monthIdx + 1)}-${pad2(dateObj.getDate())}`;
    const amt = Math.abs(toNumber(t.amount));
    if (!expenseByDate[iso]) expenseByDate[iso] = 0;
    expenseByDate[iso] += amt;
  });

  const allVals = Object.values(expenseByDate);
  const maxExpense = allVals.length ? Math.max(...allVals) : 0;

  const firstDay = new Date(year, monthIdx, 1);
  const firstWeekday = firstDay.getDay(); // 0 = Sun

  const cells = [];

  // leading empty cells
  for (let i = 0; i < firstWeekday; i++) {
    cells.push({ key: `empty-start-${i}`, day: null, iso: null, total: 0 });
  }

  // real days
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = `${year}-${pad2(monthIdx + 1)}-${pad2(d)}`;
    cells.push({
      key: iso,
      day: d,
      iso,
      total: expenseByDate[iso] || 0,
    });
  }

  // trailing empties to complete weeks
  while (cells.length % 7 !== 0) {
    cells.push({
      key: `empty-end-${cells.length}`,
      day: null,
      iso: null,
      total: 0,
    });
  }

  const rows = [];
  for (let i = 0; i < cells.length; i += 7) {
    rows.push(cells.slice(i, i + 7));
  }

  const monthLabel = now.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  return { rows, maxExpense, monthLabel };
}

export default function FinanceDashboard({ user, onLogout }) {
  const userId = user?.uid;
  const navigate = useNavigate(); // ✅ NEW

  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [goals, setGoals] = useState([]);

  const [isLoadingTx, setIsLoadingTx] = useState(true);
  const [isLoadingBudgets, setIsLoadingBudgets] = useState(true);
  const [isLoadingGoals, setIsLoadingGoals] = useState(true);
  const [exportMessage, setExportMessage] = useState("");

  useEffect(() => {
    const styleTag = document.createElement("style");
    styleTag.innerHTML = DASHBOARD_STYLES;
    document.head.appendChild(styleTag);
    return () => {
      document.head.removeChild(styleTag);
    };
  }, []);

  // Load transactions
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
      () => setIsLoadingTx(false)
    );

    return () => unsub();
  }, [userId]);

  // Load budgets
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
      () => setIsLoadingBudgets(false)
    );

    return () => unsub();
  }, [userId]);

  // Load goals
  useEffect(() => {
    if (!userId) return;
    setIsLoadingGoals(true);

    const q = query(collection(db, "goals"), where("userId", "==", userId));

    const unsub = onSnapshot(
      q,
      (snap) => {
        const arr = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setGoals(arr);
        setIsLoadingGoals(false);
      },
      () => setIsLoadingGoals(false)
    );

    return () => unsub();
  }, [userId]);

  // KPI calculations
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

  // Pie data
  const byCategory = {};
  transactions.forEach((t) => {
    if (t.type !== "expense") return;
    const dateObj = toDate(t.date);
    if (!dateObj) return;
    if (monthKey(dateObj) !== currentMonthKey) return;

    const amt = Math.abs(toNumber(t.amount));
    const cat = t.category || "Other";
    if (!byCategory[cat]) byCategory[cat] = 0;
    byCategory[cat] += amt;
  });

  const pieData = Object.keys(byCategory).map((k) => ({
    name: k,
    value: byCategory[k],
  }));

  // 6-month trend
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

  // Budgets
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

    let statusColor = "#4caf50";
    if (usedPct >= 80 && usedPct < 100) statusColor = "#ffbf00";
    if (usedPct >= 100) statusColor = "#f44336";

    let statusText = "On track";
    if (usedPct >= 80 && usedPct < 100) statusText = "Close to limit";
    if (usedPct >= 100) statusText = "Over budget";

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

  const budgetChartData = budgetProgress.map((b) => ({
    category: b.category,
    Spent: b.spent,
    Remaining: b.remaining,
  }));

  // Goals progress (for dashboard cards)
  const goalCards = goals.map((g) => {
    const target = Math.max(toNumber(g.targetAmount), 0);
    const saved = Math.max(toNumber(g.currentSavedAmount ?? 0), 0);
    const pct =
      target > 0 ? Math.min(100, Math.round((saved / target) * 100)) : 0;
    const remaining = Math.max(target - saved, 0);

    let barColor = "#4caf50";
    if (pct >= 80 && pct < 100) barColor = "#ffbf00";
    if (pct >= 100) barColor = "#22c55e"; // completed = bright green

    return {
      id: g.id,
      name: g.goalName || "Untitled Goal",
      target,
      saved,
      pct,
      remaining,
      barColor,
      targetDate: g.targetDate
        ? toDate(g.targetDate)?.toLocaleDateString()
        : null,
    };
  });

  // 📅 Monthly calendar data (current month)
  const calendarData = buildMonthlyExpenseCalendar(transactions, now);

  const cardStyle = {
    background: "#ffffff",
    color: "#000",
    padding: 18,
    borderRadius: 10,
    boxShadow: "0 6px 20px rgba(3,10,18,0.25)",
  };

  const kpiVal = { fontSize: 22, fontWeight: 800, color: "#000" };

  // Export CSV
  const handleExportCsv = () => {
    if (!transactions.length) {
      alert("No transactions to export yet.");
      return;
    }

    const header = ["Date", "Type", "Category", "Amount", "Note", "Created At"];

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

  // ✅ First time loading flag (for overlay)
  const isInitialLoading =
    isLoadingTx &&
    isLoadingBudgets &&
    isLoadingGoals &&
    !transactions.length &&
    !budgets.length &&
    !goals.length;

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />

      {/* MAIN AREA */}
      <div style={{ flex: 1, padding: 18, position: "relative" }}>
        {/* 🔄 PREMIUM LOADING OVERLAY */}
        {isInitialLoading && (
          <div className="dashboard-loading-overlay">
            <div className="dashboard-loading-inner">
              <div className="dashboard-spinner" />
              <div className="dashboard-loading-text">
                Loading your finance dashboard…
              </div>
            </div>
          </div>
        )}

        {/* TOP NAV - WHITE CARD */}
        <div
          style={{
            ...cardStyle,
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
            <div style={{ color: "#4b5563", opacity: 0.9 }}>
              Hi,{" "}
              <strong style={{ color: "#111827" }}>
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

        {/* Budget Overview */}
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
                type="button"
                onClick={() => navigate("/budgets")} // ✅ UPDATED
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
                Budget Management
              </button>
              page.
            </div>
          ) : (
            <div className="budget-overview-layout">
              {/* List side */}
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

                    {/* Progress Bar */}
                    <div
                      style={{
                        width: "100%",
                        height: 10,
                        borderRadius: 999,
                        background: "#f1f5f9",
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

              {/* Chart side */}
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

        {/* Goals section */}
        <div style={{ ...cardStyle, marginBottom: 16 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: 8,
              gap: 8,
            }}
          >
            <h4 style={{ margin: 0, color: "#000" }}>Goals Progress</h4>
            <button
              type="button"
              onClick={() => navigate("/goals")} // ✅ UPDATED
              style={{
                marginLeft: "auto",
                padding: "4px 10px",
                borderRadius: 999,
                border: "none",
                fontSize: 11,
                background: "#0b7b5b",
                color: "#fff",
                cursor: "pointer",
              }}
            >
              Manage Goals
            </button>
          </div>

          {isLoadingGoals ? (
            <CardSkeleton height={80} />
          ) : goalCards.length === 0 ? (
            <div style={{ color: "#666", fontSize: 14 }}>
              No goals yet. Create your first savings goal from the Goal Setting
              page.
            </div>
          ) : (
            <div className="goals-grid">
              {goalCards.map((g) => (
                <div
                  key={g.id}
                  style={{
                    padding: 12,
                    borderRadius: 10,
                    border: "1px solid #e5e7eb",
                    background: "#f9fafb",
                  }}
                >
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: 14,
                      marginBottom: 4,
                      color: "#111827",
                    }}
                  >
                    {g.name}
                  </div>
                  {g.targetDate && (
                    <div
                      style={{
                        fontSize: 11,
                        color: "#6b7280",
                        marginBottom: 4,
                      }}
                    >
                      Target date: {g.targetDate}
                    </div>
                  )}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 12,
                      marginBottom: 4,
                    }}
                  >
                    <span>Saved: ₹{g.saved.toFixed(0)}</span>
                    <span>Target: ₹{g.target.toFixed(0)}</span>
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
                        width: `${g.pct}%`,
                        height: "100%",
                        background: g.barColor,
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
                      marginTop: 2,
                    }}
                  >
                    <span>{g.pct}% complete</span>
                    <span>Left: ₹{g.remaining.toFixed(0)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 📅 NEW: Monthly Expense Calendar */}
        <div style={{ ...cardStyle, marginBottom: 16 }}>
          <h4 style={{ marginTop: 0, color: "#000" }}>
            Monthly Expense Calendar (Current Month)
          </h4>
          <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>
            Darker red days = higher spending. Each cell shows total expenses
            for that day.
          </div>

          {isLoadingTx ? (
            <CardSkeleton height={240} />
          ) : (
            <>
              {/* Weekday header */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
                  gap: 4,
                  marginBottom: 4,
                  fontSize: 11,
                  color: "#6b7280",
                  textTransform: "uppercase",
                }}
              >
                {weekdayShort.map((d) => (
                  <div
                    key={d}
                    style={{
                      textAlign: "center",
                      fontWeight: 600,
                    }}
                  >
                    {d}
                  </div>
                ))}
              </div>

              {/* Calendar rows */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
                  gap: 4,
                  fontSize: 11,
                }}
              >
                {calendarData.rows.flat().map((cell) => {
                  if (!cell.day) {
                    return (
                      <div
                        key={cell.key}
                        style={{
                          minHeight: 54,
                          borderRadius: 8,
                          background: "transparent",
                        }}
                      />
                    );
                  }

                  const total = cell.total;
                  let bg = "#f9fafb";
                  let border = "#e5e7eb";
                  let amountColor = "#111827";

                  if (total > 0 && calendarData.maxExpense > 0) {
                    const ratio = total / calendarData.maxExpense;
                    const alpha = 0.18 + 0.55 * Math.min(1, ratio);
                    bg = `rgba(248, 113, 113, ${alpha.toFixed(2)})`; // red-400 with variable alpha
                    border = "rgba(248,113,113,0.7)";
                    amountColor = "#111827";
                  }

                  return (
                    <div
                      key={cell.key}
                      style={{
                        minHeight: 54,
                        borderRadius: 8,
                        background: bg,
                        border: `1px solid ${border}`,
                        padding: 6,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: "#111827",
                        }}
                      >
                        {cell.day}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          textAlign: "right",
                          color: amountColor,
                        }}
                      >
                        {total > 0 ? `₹${total.toFixed(0)}` : "—"}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div
                style={{
                  marginTop: 8,
                  fontSize: 11,
                  color: "#6b7280",
                  display: "flex",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 4,
                }}
              >
                <span>{calendarData.monthLabel}</span>
                <span>
                  Total days with expenses:{" "}
                  {
                    calendarData.rows.flat().filter((c) => c.day && c.total > 0)
                      .length
                  }
                </span>
              </div>
            </>
          )}
        </div>

        {/* Charts row */}
        <div className="dashboard-grid-2">
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
                            color: tx.type === "income" ? "#0b8a4e" : "#d32f2f",
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
                type="button"
                onClick={() => navigate("/transactions")} // ✅ UPDATED
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
                type="button"
                onClick={() => navigate("/budgets")} // ✅ UPDATED
                style={{
                  padding: 10,
                  borderRadius: 8,
                  border: "none",
                  background: "#16a34a",
                  color: "#fff",
                  cursor: "pointer",
                }}
              >
                🎯 Manage Budgets
              </button>

              <button
                type="button"
                onClick={() => navigate("/goals")} // ✅ UPDATED
                style={{
                  padding: 10,
                  borderRadius: 8,
                  border: "none",
                  background: "#f97316",
                  color: "#fff",
                  cursor: "pointer",
                }}
              >
                💰 Goal Setting
              </button>

              <button
                type="button"
                onClick={() => navigate("/reports")} // ✅ UPDATED
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
                type="button"
                onClick={() => navigate("/recurring")} // ✅ UPDATED
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
                type="button"
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
