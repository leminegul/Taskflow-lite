import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { clearAuth } from "../auth";
import "./TodoBoardPage.css";

const YEARS = [1, 2, 3, 4, 5];
const ROWS = [
  { key: "todo", label: "TO DO" },
  { key: "inprogress", label: "IN PROGRESS" },
  { key: "done", label: "DONE" },
];

export default function TodoBoardPage() {
  const nav = useNavigate();

  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // add form
  const [title, setTitle] = useState("");
  const [yearBucket, setYearBucket] = useState(1);
  const [status, setStatus] = useState("todo");
  const [saving, setSaving] = useState(false);

  async function fetchTodos() {
    setError("");
    setLoading(true);
    try {
      const res = await api.get("/api/todos");
      setTodos(res.data);
    } catch (err) {
      if (err?.response?.status === 401) {
        clearAuth();
        nav("/login");
        return;
      }
      setError("Failed to load todos");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTodos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const grouped = useMemo(() => {
    const g = {
      todo: { 1: [], 2: [], 3: [], 4: [], 5: [] },
      inprogress: { 1: [], 2: [], 3: [], 4: [], 5: [] },
      done: { 1: [], 2: [], 3: [], 4: [], 5: [] },
    };

    for (const t of todos) {
      const y = Number(t.yearBucket ?? 1);
      const s = t.status || (t.completed ? "done" : "todo");
      if (g[s] && g[s][y]) g[s][y].push(t);
    }
    return g;
  }, [todos]);

  async function addTodo(e) {
    e.preventDefault();
    if (!title.trim()) return;

    setSaving(true);
    setError("");
    try {
      await api.post("/api/todos", {
        title: title.trim(),
        yearBucket,
        status,
      });
      setTitle("");
      await fetchTodos();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to add todo");
    } finally {
      setSaving(false);
    }
  }

  async function delTodo(id) {
    setError("");
    try {
      await api.delete(`/api/todos/${id}`);
      setTodos((prev) => prev.filter((x) => x.id !== id));
    } catch {
      setError("Failed to delete");
    }
  }

  async function toggleDone(id) {
    setError("");
    try {
      await api.patch(`/api/todos/${id}/toggle`);
      await fetchTodos();
    } catch {
      setError("Failed to toggle");
    }
  }

  async function moveTodo(id, nextStatus, nextYear) {
    setError("");
    try {
      await api.patch(`/api/todos/${id}/move`, {
        status: nextStatus,
        yearBucket: nextYear,
      });
      await fetchTodos();
    } catch {
      setError("Failed to move");
    }
  }

  function logout() {
    clearAuth();
    nav("/login");
  }

  return (
    <div className="page">
      <div className="container">
        {/* Header */}
        <div className="topbar">
          <div className="titleWrap"></div>

          <div className="actions">
            <button className="btn btnGhost" onClick={fetchTodos} type="button">
              Refresh
            </button>
            <button className="btn btnPrimary" onClick={logout} type="button">
              Logout
            </button>
          </div>
        </div>

        {/* Add panel */}
        <div className="panel">
          <div className="panelHeader">
            <div>
              <h3>Add Item</h3>
              <p>Create a task and place it on the board</p>
            </div>
          </div>

          <form onSubmit={addTodo} className="formRow">
            <input
              className="field"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Write a task title..."
            />

            <select
              className="field"
              value={yearBucket}
              onChange={(e) => setYearBucket(Number(e.target.value))}
            >
              {YEARS.map((y) => (
                <option key={y} value={y}>
                  Month {y}
                </option>
              ))}
            </select>

            <select
              className="field"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              {ROWS.map((r) => (
                <option key={r.key} value={r.key}>
                  {r.label}
                </option>
              ))}
            </select>

            <button className="btn btnPrimary" disabled={saving}>
              {saving ? "Adding..." : "Add"}
            </button>
          </form>

          {error && <div className="error">{error}</div>}
        </div>

        {/* Board */}
        <div className="board">
          <div className="boardScroll">
            <div className="grid">
              {/* column headers */}
              <div className="gridHeader">
                <div />
                {YEARS.map((y) => (
                  <div key={y}>
                    <div className="yearChip">Month {y}</div>
                  </div>
                ))}
              </div>

              {/* rows */}
              {loading ? (
                <div style={{ padding: 12, color: "var(--muted)" }}>
                  Loading...
                </div>
              ) : (
                ROWS.map((row) => (
                  <div key={row.key} className="gridRow">
                    <div className="rowLabel">
                      <span
                        className={
                          "badge " +
                          (row.key === "todo"
                            ? "badgeTodo"
                            : row.key === "inprogress"
                            ? "badgeProg"
                            : "badgeDone")
                        }
                      />
                      {row.label}
                    </div>

                    {YEARS.map((y) => (
                      <div key={`${row.key}-${y}`} className="cell">
                        {(grouped[row.key]?.[y] || []).map((t) => (
                          <TodoCard
                            key={t.id}
                            todo={t}
                            onDelete={() => delTodo(t.id)}
                            onToggle={() => toggleDone(t.id)}
                            onMove={(ns, ny) => moveTodo(t.id, ns, ny)}
                          />
                        ))}
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TodoCard({ todo, onDelete, onToggle, onMove }) {
  const created = formatDate(todo.createdAt);

  return (
    <div className="card">
      <div className="cardTop">
        <div className="cardTitle">{todo.title}</div>
        <button onClick={onDelete} className="iconBtn" title="Delete">
          ✕
        </button>
      </div>

      <div className="cardMeta">Created: {created}</div>

      <div className="cardActions">
        <button
          onClick={onToggle}
          className={"smallBtn " + (todo.completed ? "" : "smallPrimary")}
          type="button"
        >
          {todo.completed ? "Mark Undone" : "Mark Done"}
        </button>

        <MoveMenu onMove={onMove} />
      </div>
    </div>
  );
}

function MoveMenu({ onMove }) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="smallBtn"
        type="button"
      >
        Move ▾
      </button>

      {open && (
        <div className="popover" onMouseLeave={() => setOpen(false)}>
          <div className="popTitle">Move to</div>

          {["todo", "inprogress", "done"].map((s) => (
            <div key={s} style={{ marginBottom: 10 }}>
              <div className="popRowTitle">{labelOf(s)}</div>
              <div className="popYears">
                {YEARS.map((y) => (
                  <button
                    key={y}
                    className="popYearBtn"
                    type="button"
                    onClick={() => {
                      onMove(s, y);
                      setOpen(false);
                    }}
                  >
                    Y{y}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function labelOf(s) {
  if (s === "todo") return "TO DO";
  if (s === "inprogress") return "IN PROGRESS";
  return "DONE";
}

function formatDate(iso) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}
