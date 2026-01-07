require("dotenv").config();
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");
const todoRoutes = require("./routes/todo.routes");

const app = express();

// (İstersen şimdilik açık bırak) React'te 5173/3000 kullanacağız.
// Daha sonra origin'i kısıtlarız.
app.use(cors({ origin: true, credentials: true }));

app.use(express.json());

app.get("/health", (req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/todos", todoRoutes);

const port = Number(process.env.PORT) || 5000;
app.listen(port, () => {
  console.log(`Backend running on http://localhost:${port}`);
});
