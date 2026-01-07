import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { setAuth } from "../auth";

export default function LoginPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState("admin@test.com");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/api/auth/login", { email, password });
      setAuth(res.data.token);
      nav("/board");
    } catch (err) {
      setError(err?.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.bg}>
      <div style={styles.card}>
        <h2 style={styles.title}>TaskFlow Lite</h2>
        <p style={styles.sub}>Sign in to continue</p>

        <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
          <label style={styles.label}>
            Email
            <input
              style={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </label>

          <label style={styles.label}>
            Password
            <input
              style={styles.input}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </label>

          {error && <div style={styles.error}>{error}</div>}

          <button style={styles.btn} disabled={loading}>
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>

        <div style={styles.hint}>
          Demo: <b>admin@test.com</b> / <b>admin123</b>
        </div>
      </div>
    </div>
  );
}

const styles = {
  bg: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    background: "#f5f7fb",
    padding: 16,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    background: "white",
    borderRadius: 16,
    padding: 24,
    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
  },
  title: { margin: 0, fontSize: 28 },
  sub: { marginTop: 6, marginBottom: 18, color: "#5b6472" },
  label: { display: "grid", gap: 6, fontSize: 13, color: "#273142" },
  input: {
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #d9e0ea",
    outline: "none",
    fontSize: 14,
  },
  btn: {
    marginTop: 6,
    padding: "10px 12px",
    borderRadius: 10,
    border: "none",
    background: "#2563eb",
    color: "white",
    fontWeight: 600,
    cursor: "pointer",
  },
  error: {
    background: "#fee2e2",
    color: "#991b1b",
    padding: 10,
    borderRadius: 10,
    fontSize: 13,
  },
  hint: { marginTop: 14, fontSize: 12, color: "#6b7280" },
};
