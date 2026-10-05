import express from "express";
import cors from "cors";

import { connectDB } from "./src/config/db.js";
import ctcCalculationRoutes from "./src/routes/ctcCalculationRoutes.js";
import employeeRoutes from "./src/routes/employeeRoutes.js";

const app = express();

const PORT = process.env.PORT || 5000;

// -------------------------------------------------------
// Middleware
// -------------------------------------------------------

app.use(
  cors({
    origin: "http://localhost:5173",
  })
);

app.use(express.json());

// -------------------------------------------------------
// Health Check
// -------------------------------------------------------

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Compensation & Benefits API is running",
  });
});

// -------------------------------------------------------
// Routes
// -------------------------------------------------------

app.use(
  "/api/ctc-calculations",
  ctcCalculationRoutes
);

app.use(
  "/api/employees",
  employeeRoutes
);

// -------------------------------------------------------
// Start Server
// -------------------------------------------------------

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(
        `Server running on http://localhost:${PORT}`
      );
    });
  } catch (error) {
    console.error("Server startup failed:", error);
    process.exit(1);
  }
};

startServer();