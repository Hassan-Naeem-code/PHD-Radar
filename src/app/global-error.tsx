"use client";

import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, sans-serif", backgroundColor: "#f9fafb" }}>
          <div style={{ textAlign: "center", padding: "2rem" }}>
            <h1 style={{ fontSize: "2rem", fontWeight: "bold", color: "#111827" }}>
              Something went wrong
            </h1>
            <p style={{ color: "#6b7280", marginTop: "0.5rem" }}>
              A critical error occurred. Please try refreshing the page.
            </p>
            {error.digest && (
              <p style={{ color: "#9ca3af", fontSize: "0.75rem", marginTop: "0.5rem" }}>
                Error ID: {error.digest}
              </p>
            )}
            <div style={{ marginTop: "2rem", display: "flex", gap: "1rem", justifyContent: "center" }}>
              <button
                onClick={reset}
                style={{ padding: "0.5rem 1.5rem", backgroundColor: "#4361ee", color: "white", border: "none", borderRadius: "0.375rem", cursor: "pointer", fontSize: "0.875rem" }}
              >
                Try Again
              </button>
              <button
                onClick={() => (window.location.href = "/")}
                style={{ padding: "0.5rem 1.5rem", backgroundColor: "white", color: "#111827", border: "1px solid #d1d5db", borderRadius: "0.375rem", cursor: "pointer", fontSize: "0.875rem" }}
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
