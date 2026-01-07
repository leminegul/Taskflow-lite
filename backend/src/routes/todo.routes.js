const express = require("express");
const { z } = require("zod");
const { pool } = require("../db");
const { auth } = require("../middleware/auth");

const router = express.Router();

console.log("AUTH MIDDLEWARE TYPE:", typeof auth, auth);

router.use(auth);

// Listele (board için filtrelerle)
router.get("/", async (req, res) => {
  try {
    const userId = req.user.id;

    const [rows] = await pool.query(
      `SELECT 
         id,
         title,
         completed,
         status,
         year_bucket AS yearBucket,
         created_at AS createdAt
       FROM todos
       WHERE user_id=?
       ORDER BY created_at DESC`,
      [userId]
    );

    return res.json(rows);
  } catch (err) {
    console.error("GET /api/todos ERROR:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// Ekle
const createSchema = z.object({
  title: z.string().min(1),
  yearBucket: z.number().int().min(1).max(5).default(1),
  status: z.enum(["todo", "inprogress", "done"]).default("todo"),
});

router.post("/", async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);

  const userId = req.user.id;
  const { title, yearBucket, status } = parsed.data;
  const completed = status === "done";

  const [result] = await pool.query(
    "INSERT INTO todos (user_id, title, completed, status, year_bucket) VALUES (?, ?, ?, ?, ?)",
    [userId, title, completed, status, yearBucket]
  );

  res.json({
    id: result.insertId,
    title,
    completed,
    status,
    yearBucket,
    createdAt: new Date().toISOString(),
  });
});

// Done toggle (completed true/false) + status senkron
router.patch("/:id/toggle", async (req, res) => {
  const userId = req.user.id;
  const id = Number(req.params.id);

  const [rows] = await pool.query(
    "SELECT id, completed FROM todos WHERE id=? AND user_id=?",
    [id, userId]
  );
  if (!rows.length) return res.status(404).json({ message: "Not found" });

  const nextCompleted = !rows[0].completed;
  const nextStatus = nextCompleted ? "done" : "todo";

  await pool.query(
    "UPDATE todos SET completed=?, status=? WHERE id=? AND user_id=?",
    [nextCompleted, nextStatus, id, userId]
  );

  res.json({ id, completed: nextCompleted, status: nextStatus });
});

// Taşı (board drag/drop gibi) -> status + yearBucket değişsin
const moveSchema = z.object({
  status: z.enum(["todo", "inprogress", "done"]),
  yearBucket: z.number().int().min(1).max(5),
});

router.patch("/:id/move", async (req, res) => {
  const userId = req.user.id;
  const id = Number(req.params.id);

  const parsed = moveSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);

  const completed = parsed.data.status === "done";

  const [result] = await pool.query(
    "UPDATE todos SET status=?, year_bucket=?, completed=? WHERE id=? AND user_id=?",
    [parsed.data.status, parsed.data.yearBucket, completed, id, userId]
  );

  if (result.affectedRows === 0)
    return res.status(404).json({ message: "Not found" });

  res.json({ id, ...parsed.data, completed });
});

// Sil
router.delete("/:id", async (req, res) => {
  const userId = req.user.id;
  const id = Number(req.params.id);

  const [result] = await pool.query(
    "DELETE FROM todos WHERE id=? AND user_id=?",
    [id, userId]
  );
  if (result.affectedRows === 0)
    return res.status(404).json({ message: "Not found" });

  res.json({ ok: true });
});

module.exports = router;
