import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { startCronWorker } from "./workers/cron.worker";
import monitorRoutes from "./routes/monitor.routes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Basic API health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    service: "PulseGuard API",
    timestamp: new Date(),
  });
});

// REST API routes for monitors and heartbeats
app.use("/api/monitors", monitorRoutes);

// Start the Express server
app.listen(PORT, () => {
  console.log(`🚀 PulseGuard API server running on http://localhost:${PORT}`);

  // Start the background pinger engine!
  startCronWorker();
});