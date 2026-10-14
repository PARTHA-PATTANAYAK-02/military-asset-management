const express = require("express");
const cors = require("cors");
const { authenticateToken, allowRoles } = require("./middleware/auth");
const authRoutes = require("./routes/auth");
const dashboardRoutes = require("./routes/dashboard");
const purchaseRoutes = require("./routes/purchases");
const transferRoutes = require("./routes/transfers");
const assignmentRoutes = require("./routes/assignments");
const expenditureRoutes = require("./routes/expenditures");

require("dotenv").config();

const db = require("./config/db");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/purchases", purchaseRoutes);
app.use("/api/transfers", transferRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/expenditures", expenditureRoutes);

app.get("/api/auth/me", authenticateToken, (req, res) => {
  res.json({
    success: true,
    user: req.user,
  });
});

app.get("/api/health", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT DATABASE() AS databaseName");

    res.json({
      success: true,
      message: "Backend and MySQL connected successfully",
      database: rows[0].databaseName,
    });
  } catch (error) {
    console.error("Database connection error:", error.message);

    res.status(500).json({
      success: false,
      message: "Database connection failed",
    });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
