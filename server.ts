import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import cors from "cors";
import { fileURLToPath } from "url";
import { db, initDb } from "./src/backend/database.js";
import logRoutes from "./src/backend/routes/logs.js";
import alertRoutes from "./src/backend/routes/alerts.js";
import chatRoutes from "./src/backend/routes/chat.js";
import authRoutes from "./src/backend/routes/auth.js";
import systemRoutes from "./src/backend/routes/system.js";
import usersRoutes from "./src/backend/routes/users.js";
import ipsRoutes from "./src/backend/routes/ips.js";
import phase1Routes from "./src/backend/routes/phase1.js";
import forensicsRoutes from "./src/backend/routes/forensics.js";
import { apiLimiter } from "./src/backend/middleware/rateLimit.js";
import { ipsMiddleware } from "./src/backend/middleware/ips.js";
import { deceptionMiddleware } from "./src/backend/middleware/deception.js";
import { ipsService } from "./src/backend/services/ips_service.js";
import { logService } from "./src/backend/services/log_service.js";
import { alertService } from "./src/backend/services/alert_service.js";
import { realSystemMonitor } from "./src/backend/services/real_system_monitor.js";
import { sensorBridge } from "./src/backend/services/sensor_bridge.js";
import { sentinelBridge } from "./src/backend/services/sentinel_bridge.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Trust proxy for rate limiting in Cloud Run/Proxied environments
  app.set('trust proxy', 1);

  app.use(cors());
  app.use(express.json());

  // Apply IPS Middleware globally BEFORE any other routes
  app.use(ipsMiddleware);
  
  // Apply Deception/Honeypot Middleware
  app.use(deceptionMiddleware);

  app.use("/api/", apiLimiter);

  // Initialize Database
  await initDb();
  
  // Initialize IPS Cache
  ipsService.init();

  // API Routes
  app.use("/api/auth", authRoutes);
  app.use("/api/logs", logRoutes);
  app.use("/api/alerts", alertRoutes);
  app.use("/api/chat", chatRoutes);
  app.use("/api/system", systemRoutes);
  app.use("/api/users", usersRoutes);
  app.use("/api/ips", ipsRoutes);
  app.use("/api/phase1", phase1Routes);
  app.use("/api/forensics", forensicsRoutes);

  app.get("/api/sentinel/history", (req, res) => {
    res.json(sentinelBridge.getHistory());
  });

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", model_ready: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    
    // Start real system monitor
    realSystemMonitor.start();
    
    // Start Python Sensor Daemon bridge
    sensorBridge.start();
    
    // Start Sentinel AI Brain bridge
    sentinelBridge.start();

    // Start auto-acknowledge interval (every minute)
    setInterval(() => {
      try {
        alertService.autoAcknowledgeAlerts();
      } catch (err) {
        console.error("Error running auto-acknowledge:", err);
      }
    }, 60000);
  });
}

startServer();
