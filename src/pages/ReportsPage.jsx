// src/pages/ReportsPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/Sidebar";
import ProfileMenu from "../components/ProfileMenu";
import BackButton from "../components/BackButton";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// ---------- helpers ----------
function toDateSafe(value) {
  if (!value) return null;
  try {
    if (typeof value.toDate === "function") return value.toDate();
    const d = new Date(value);
    if (!isNaN(d.getTime())) return d;
  } catch (e) {
    console.error("toDateSafe error:", e);
  }
  return null;
}
function toNumber(value) {
  const n = Number(value);
  return isNaN(n) ? 0 : n;
}
function escapeCsv(value) {
  const str = value == null ? "" : String(value);
  const escaped = str.replace(/"/g, '""');
  return `"${escaped}"`;
}

// 🔢 Calendar helpers
const pad2 = (n) => String(n).padStart(2, "0");
const weekdayShort = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * Monthly expense calendar:
 * - Only "expense" transactions
 * - Uses filtered list (respecting filters)
 * - Groups by date for current month
 */
function buildMonthlyExpenseCalendar(transactions, baseDate) {
  const year = baseDate.getFullYear();
  const monthIdx = baseDate.getMonth(); // 0-based
  const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();

  const expenseByDate = {};

  transactions.forEach((t) => {
    if (t.type !== "expense") return;

    const d = t._dateObj || toDateSafe(t.date);
    if (!d) return;
    if (d.getFullYear() !== year || d.getMonth() !== monthIdx) return;

    const iso = `${year}-${pad2(monthIdx + 1)}-${pad2(d.getDate())}`;
    const amt = Math.abs(toNumber(t.amount));
    if (!expenseByDate[iso]) expenseByDate[iso] = 0;
    expenseByDate[iso] += amt;
  });

  const allVals = Object.values(expenseByDate);
  const maxExpense = allVals.length ? Math.max(...allVals) : 0;

  const firstDay = new Date(year, monthIdx, 1);
  const firstWeekday = firstDay.getDay(); // 0=Sun

  const cells = [];

  // leading empty
  for (let i = 0; i < firstWeekday; i++) {
    cells.push({ key: `empty-start-${i}`, day: null, iso: null, total: 0 });
  }

  // days
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = `${year}-${pad2(monthIdx + 1)}-${pad2(d)}`;
    cells.push({
      key: iso,
      day: d,
      iso,
      total: expenseByDate[iso] || 0,
    });
  }

  // trailing empty to complete weeks
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

  const monthLabel = baseDate.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  return { rows, maxExpense, monthLabel };
}

// ---------- main component ----------
export default function ReportsPage({ user, onLogout }) {
  const userId = user?.uid;

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // filters
  const [fromDateStr, setFromDateStr] = useState("");
  const [toDateStr, setToDateStr] = useState("");
  const [typeFilter, setTypeFilter] = useState("all"); // all | income | expense
  const [categoryFilter, setCategoryFilter] = useState("all");

  // load tx from Firestore
  useEffect(() => {
    if (!userId) return;

    setLoading(true);
    const q = query(
      collection(db, "transactions"),
      where("userId", "==", userId)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const arr = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setTransactions(arr);
        setLoading(false);
      },
      (err) => {
        console.error("ReportsPage onSnapshot error:", err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [userId]);

  // category options
  const categoryOptions = useMemo(() => {
    const set = new Set();
    transactions.forEach((t) => {
      if (t.category) set.add(t.category);
    });
    return Array.from(set).sort();
  }, [transactions]);

  // apply filters
  const filtered = useMemo(() => {
    const from = fromDateStr ? new Date(fromDateStr) : null;
    const to = toDateStr ? new Date(toDateStr) : null;
    if (to) to.setHours(23, 59, 59, 999);

    return transactions
      .map((t) => ({
        ...t,
        _dateObj: toDateSafe(t.date),
      }))
      .filter((t) => !!t._dateObj)
      .filter((t) => {
        if (typeFilter !== "all" && t.type !== typeFilter) return false;
        if (categoryFilter !== "all" && t.category !== categoryFilter)
          return false;
        const d = t._dateObj;
        if (from && d < from) return false;
        if (to && d > to) return false;
        return true;
      })
      .sort((a, b) => (b._dateObj || 0) - (a._dateObj || 0));
  }, [transactions, fromDateStr, toDateStr, typeFilter, categoryFilter]);

  // summary cards
  const summary = useMemo(() => {
    let income = 0;
    let expense = 0;
    filtered.forEach((t) => {
      const amt = Math.abs(toNumber(t.amount));
      if (t.type === "income") income += amt;
      else expense += amt;
    });
    return {
      income,
      expense,
      net: income - expense,
    };
  }, [filtered]);

  // chart data by category
  const chartData = useMemo(() => {
    const map = {};
    filtered.forEach((t) => {
      const cat = t.category || "Other";
      const amt = Math.abs(toNumber(t.amount));
      if (!map[cat]) {
        map[cat] = { category: cat, Income: 0, Expense: 0 };
      }
      if (t.type === "income") map[cat].Income += amt;
      else map[cat].Expense += amt;
    });
    return Object.values(map);
  }, [filtered]);

  // 📅 Monthly calendar data (current month) – uses filtered list
  const calendarData = useMemo(
    () => buildMonthlyExpenseCalendar(filtered, new Date()),
    [filtered]
  );

  // ---------- export handler ----------
  const handleExport = () => {
    if (!filtered.length) {
      alert("No records to export with current filters.");
      return;
    }

    const header = ["Date", "Type", "Category", "Amount", "Note"];
    const rows = filtered.map((t) => [
      t._dateObj ? t._dateObj.toISOString().slice(0, 10) : "",
      t.type || "",
      t.category || "",
      toNumber(t.amount),
      t.note || "",
    ]);

    const csvString = [header, ...rows]
      .map((row) => row.map(escapeCsv).join(","))
      .join("\n");

    const blob = new Blob([csvString], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "reports_export.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleResetFilters = () => {
    setFromDateStr("");
    setToDateStr("");
    setTypeFilter("all");
    setCategoryFilter("all");
  };

  // ---------- styles ----------
  const pageWrapper = { display: "flex", minHeight: "100vh" };
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
  };
  const btnPrimary = {
    padding: "8px 12px",
    borderRadius: 8,
    border: "none",
    background: "#0b7b5b",
    color: "#fff",
    cursor: "pointer",
    fontSize: 13,
  };
  const btnGhost = {
    padding: "8px 12px",
    borderRadius: 8,
    border: "1px solid #e2e8f0",
    background: "#fff",
    color: "#0f172a",
    cursor: "pointer",
    fontSize: 13,
  };

  return (
    <div style={pageWrapper}>
      <Sidebar />

      <div style={main}>
        {/* top bar */}
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
            Reports
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

        {/* filters + summary */}
        <section style={card}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 16 }}>Filter Reports</div>
            <button style={btnGhost} type="button" onClick={handleResetFilters}>
              Reset filters
            </button>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
              gap: 10,
              marginTop: 10,
              marginBottom: 10,
            }}
          >
            <div>
              <div style={label}>From date</div>
              <input
                type="date"
                style={input}
                value={fromDateStr}
                onChange={(e) => setFromDateStr(e.target.value)}
              />
            </div>
            <div>
              <div style={label}>To date</div>
              <input
                type="date"
                style={input}
                value={toDateStr}
                onChange={(e) => setToDateStr(e.target.value)}
              />
            </div>
            <div>
              <div style={label}>Type</div>
              <select
                style={input}
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="all">All</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>
            <div>
              <div style={label}>Category</div>
              <select
                style={input}
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="all">All</option>
                {categoryOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* summary cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: 12,
              marginTop: 10,
            }}
          >
            <div
              style={{
                background: "#f9fafb",
                borderRadius: 8,
                padding: 10,
                fontSize: 14,
              }}
            >
              <div style={{ opacity: 0.7 }}>Total Income</div>
              <div style={{ fontWeight: 800 }}>₹ {summary.income}</div>
            </div>
            <div
              style={{
                background: "#f9fafb",
                borderRadius: 8,
                padding: 10,
                fontSize: 14,
              }}
            >
              <div style={{ opacity: 0.7 }}>Total Expense</div>
              <div style={{ fontWeight: 800, color: "#e11d48" }}>
                ₹ {summary.expense}
              </div>
            </div>
            <div
              style={{
                background: "#f9fafb",
                borderRadius: 8,
                padding: 10,
                fontSize: 14,
              }}
            >
              <div style={{ opacity: 0.7 }}>Net</div>
              <div
                style={{
                  fontWeight: 800,
                  color: summary.net >= 0 ? "#16a34a" : "#e11d48",
                }}
              >
                ₹ {summary.net}
              </div>
            </div>
          </div>

          <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
            <button style={btnPrimary} type="button" onClick={handleExport}>
              ⤓ Export filtered CSV
            </button>
            <div
              style={{
                fontSize: 12,
                color: "#64748b",
                alignSelf: "center",
              }}
            >
              Records: {filtered.length}
            </div>
          </div>
        </section>

        {/* 📅 Monthly Calendar View (Current Month) */}
        <section style={{ ...card, marginTop: 16 }}>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>
            Monthly Expense Calendar (Current Month)
          </div>
          <div
            style={{
              fontSize: 12,
              color: "#64748b",
              marginBottom: 8,
            }}
          >
            Har din ke box me total expenses. Darker red = zyada kharcha.
          </div>

          {loading ? (
            <div style={{ fontSize: 13, color: "#64748b" }}>Loading…</div>
          ) : (
            <>
              {/* weekday header */}
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
                  <div key={d} style={{ textAlign: "center", fontWeight: 600 }}>
                    {d}
                  </div>
                ))}
              </div>

              {/* calendar cells */}
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
                          minHeight: 52,
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
                    const ratio = total / calendarData.maxExpense; // 0..1
                    const alpha = 0.18 + 0.55 * Math.min(1, ratio);
                    bg = `rgba(248,113,113,${alpha.toFixed(2)})`; // red-400-style
                    border = "rgba(248,113,113,0.7)";
                  }

                  return (
                    <div
                      key={cell.key}
                      style={{
                        minHeight: 52,
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
                  Days with expenses:{" "}
                  {
                    calendarData.rows.flat().filter((c) => c.day && c.total > 0)
                      .length
                  }
                </span>
              </div>
            </>
          )}
        </section>

        {/* chart + table */}
        <div
          style={{
            marginTop: 16,
            display: "grid",
            gridTemplateColumns: "1.2fr 1.8fr",
            gap: 16,
          }}
        >
          {/* chart card */}
          <section style={card}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>
              Category-wise Income vs Expense
            </div>
            {loading ? (
              <div>Loading...</div>
            ) : chartData.length === 0 ? (
              <div style={{ fontSize: 13, color: "#64748b" }}>
                No data for selected filters.
              </div>
            ) : (
              <div style={{ width: "100%", height: 260 }}>
                <ResponsiveContainer>
                  <BarChart data={chartData}>
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="Income" fill="#16a34a" />
                    <Bar dataKey="Expense" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </section>

          {/* table card */}
          <section style={card}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>
              Detailed Transactions
            </div>
            <div
              style={{
                maxHeight: 260,
                overflowY: "auto",
                borderRadius: 6,
                border: "1px solid #e5e7eb",
              }}
            >
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: 13,
                }}
              >
                <thead
                  style={{
                    background: "#f9fafb",
                    position: "sticky",
                    top: 0,
                  }}
                >
                  <tr>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "6px 8px",
                        borderBottom: "1px solid #e5e7eb",
                      }}
                    >
                      Date
                    </th>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "6px 8px",
                        borderBottom: "1px solid #e5e7eb",
                      }}
                    >
                      Type
                    </th>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "6px 8px",
                        borderBottom: "1px solid #e5e7eb",
                      }}
                    >
                      Category
                    </th>
                    <th
                      style={{
                        textAlign: "right",
                        padding: "6px 8px",
                        borderBottom: "1px solid #e5e7eb",
                      }}
                    >
                      Amount
                    </th>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "6px 8px",
                        borderBottom: "1px solid #e5e7eb",
                      }}
                    >
                      Note
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        style={{
                          padding: 10,
                          textAlign: "center",
                          color: "#64748b",
                        }}
                      >
                        No transactions for selected filters.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((t) => {
                      const d = t._dateObj;
                      const dateText = d
                        ? d.toLocaleDateString()
                        : "Invalid date";
                      const amt = Math.abs(toNumber(t.amount));
                      return (
                        <tr key={t.id}>
                          <td style={{ padding: "6px 8px" }}>{dateText}</td>
                          <td style={{ padding: "6px 8px" }}>
                            {t.type === "income" ? "Income" : "Expense"}
                          </td>
                          <td style={{ padding: "6px 8px" }}>
                            {t.category || "-"}
                          </td>
                          <td
                            style={{
                              padding: "6px 8px",
                              textAlign: "right",
                              color:
                                t.type === "income" ? "#16a34a" : "#ef4444",
                              fontWeight: 600,
                            }}
                          >
                            {t.type === "income" ? `+${amt}` : `-${amt}`}
                          </td>
                          <td style={{ padding: "6px 8px" }}>
                            {t.note || "-"}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
