// src/components/TransactionForm.jsx
import React, { useEffect, useState } from "react";

export default function TransactionForm({ initial = null, onSave }) {
  const [form, setForm] = useState({
    type: "expense",
    amount: "",
    category: "",
    date: new Date().toISOString().slice(0, 10),
    note: "",
  });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    if (initial) {
      setForm({
        type: initial.type || "expense",
        amount: initial.amount || "",
        category: initial.category || "",
        date: initial.date
          ? new Date(initial.date).toISOString().slice(0, 10)
          : new Date().toISOString().slice(0, 10),
        note: initial.note || "",
      });
      setMsg(null);
    } else {
      // reset form when no initial
      setForm((f) => ({ ...f, amount: "", category: "", note: "" }));
    }
  }, [initial]);

  function update(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  function validate() {
    if (!form.amount || isNaN(Number(form.amount)))
      return "Enter a valid amount.";
    if (!form.category || form.category.trim().length < 1)
      return "Enter a category.";
    return null;
  }

  async function submit(e) {
    e && e.preventDefault();
    setMsg(null);
    const err = validate();
    if (err) {
      setMsg({ type: "error", text: err });
      return;
    }

    setLoading(true);
    try {
      // prepare payload
      const payload = {
        type: form.type,
        amount: Number(form.amount),
        category: form.category,
        date: new Date(form.date).toISOString(),
        note: form.note,
      };
      await onSave(payload);
      if (!initial) {
        // clear only when adding a new one (not editing)
        setForm((f) => ({ ...f, amount: "", category: "", note: "" }));
      }
      setMsg({ type: "success", text: "Saved." });
    } catch (err) {
      console.error("TransactionForm save error:", err);
      setMsg({ type: "error", text: err.message || "Save failed." });
    } finally {
      setLoading(false);
      setTimeout(() => setMsg(null), 1300);
    }
  }

  return (
    <form onSubmit={submit} style={{ display: "grid", gap: 10 }}>
      {msg && (
        <div
          style={{
            padding: 8,
            borderRadius: 8,
            background:
              msg.type === "error"
                ? "rgba(254,202,202,0.12)"
                : "rgba(209,250,229,0.12)",
            color: msg.type === "error" ? "#7f1d1d" : "#065f46",
          }}
        >
          {msg.text}
        </div>
      )}

      <div style={{ display: "flex", gap: 8 }}>
        <select
          name="type"
          value={form.type}
          onChange={update}
          style={{ padding: 8, borderRadius: 6 }}
        >
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </select>

        <input
          name="amount"
          value={form.amount}
          onChange={update}
          placeholder="Amount"
          style={{ flex: 1, padding: 8, borderRadius: 6 }}
        />
      </div>

      <input
        name="category"
        value={form.category}
        onChange={update}
        placeholder="Category (Food / Rent)"
        style={{ padding: 8, borderRadius: 6 }}
      />

      <input
        name="date"
        type="date"
        value={form.date}
        onChange={update}
        style={{ padding: 8, borderRadius: 6 }}
      />

      <textarea
        name="note"
        value={form.note}
        onChange={update}
        placeholder="Note (optional)"
        rows={3}
        style={{ padding: 8, borderRadius: 6 }}
      />

      <button
        type="submit"
        disabled={loading}
        style={{
          padding: "10px 12px",
          borderRadius: 8,
          border: "none",
          background: initial ? "#0b7b5b" : "#c0392b",
          color: "#fff",
          cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "Saving..." : "Save"}
      </button>
    </form>
  );
}
