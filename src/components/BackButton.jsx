// src/components/BackButton.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

export default function BackButton({ label = "←", styleOverride = {} }) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(-1)}
      aria-label="Back"
      style={{
        background: "transparent",
        border: "none",
        color: "#121111ff",
        fontSize: 20,
        fontWeight: 800,
        cursor: "pointer",
        padding: "4px 8px",
        lineHeight: 1,
        ...styleOverride,
      }}
    >
      {label}
    </button>
  );
}
