"use client";

/**
 * Last-resort boundary — catches failures in the root layout itself, where the
 * normal error page cannot render. It must supply its own <html>/<body> and
 * cannot rely on app CSS having loaded, so styles are inline.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#020617",
          color: "#f8fafc",
          fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
          padding: "24px",
        }}
      >
        <div style={{ maxWidth: 460, textAlign: "center" }}>
          <div
            style={{
              width: 56,
              height: 56,
              margin: "0 auto 20px",
              borderRadius: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(239,68,68,0.12)",
              border: "1px solid rgba(239,68,68,0.35)",
              fontSize: 26,
            }}
          >
            🔥
          </div>

          <p
            style={{
              margin: 0,
              fontSize: 11,
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              color: "#f87171",
              fontWeight: 700,
            }}
          >
            SFAS-BD
          </p>

          <h1 style={{ margin: "8px 0 0", fontSize: 24, fontWeight: 700 }}>
            The console failed to start
          </h1>

          <p
            style={{
              margin: "10px 0 0",
              fontSize: 14,
              lineHeight: 1.6,
              color: "#94a3b8",
            }}
          >
            Alerting is not running in this tab. Reload to recover — if it keeps
            failing, check that the API and database are reachable.
          </p>

          <button
            onClick={reset}
            style={{
              marginTop: 24,
              padding: "12px 24px",
              borderRadius: 12,
              border: "none",
              background: "#ea580c",
              color: "#fff",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Reload console
          </button>

          {error.digest && (
            <p style={{ marginTop: 20, fontSize: 11, color: "#475569" }}>
              Digest: {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  );
}
