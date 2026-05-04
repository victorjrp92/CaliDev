"use client";

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      style={{
        display: "block",
        margin: "1.5rem auto 0",
        padding: "0.75rem 2rem",
        background: "#0A3C30",
        color: "white",
        border: "none",
        borderRadius: "8px",
        fontSize: "0.9rem",
        fontWeight: 600,
        cursor: "pointer",
      }}
      className="no-print"
    >
      Print / Save as PDF
    </button>
  );
}
