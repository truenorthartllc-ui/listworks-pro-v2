import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Unsubscribe() {
  const [params] = useSearchParams();
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    const email = params.get("email");
    if (!email) {
      setStatus("error");
      return;
    }
    fetch(`${API}/unsubscribe?email=${encodeURIComponent(email)}`)
      .then((r) => r.json())
      .then((d) => setStatus(d.unsubscribed ? "done" : "error"))
      .catch(() => setStatus("error"));
  }, [params]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif",
        background: "#f6f1e7",
        padding: "40px 20px",
      }}
    >
      <div
        style={{
          background: "#fff",
          border: "1px solid #e0d9cc",
          padding: "48px 56px",
          maxWidth: "480px",
          width: "100%",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 32 }}>
          ListWorks <span style={{ color: "#ff3a1c" }}>PRO</span>
        </div>

        {status === "loading" && (
          <p style={{ color: "#888", fontSize: 15 }}>Processing...</p>
        )}

        {status === "done" && (
          <>
            <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12, color: "#1a1a1a" }}>
              You're unsubscribed.
            </h1>
            <p style={{ color: "#555", fontSize: 15, lineHeight: 1.6 }}>
              You won't receive any more emails from ListWorks PRO.
            </p>
            <p style={{ color: "#999", fontSize: 13, marginTop: 24 }}>
              Changed your mind?{" "}
              <a href="https://listworks.pro" style={{ color: "#ff3a1c" }}>
                Visit listworks.pro
              </a>
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12, color: "#1a1a1a" }}>
              Something went wrong.
            </h1>
            <p style={{ color: "#555", fontSize: 15, lineHeight: 1.6 }}>
              Email{" "}
              <a href="mailto:hello@listworks.pro" style={{ color: "#ff3a1c" }}>
                hello@listworks.pro
              </a>{" "}
              and we'll remove you manually within 24 hours.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
