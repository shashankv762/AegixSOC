import { Router } from "express";
import { ollamaService } from "../services/ollama_service.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();

router.use(authMiddleware);

router.get("/history", (req, res) => {
  const history = ollamaService.getHistory(50);
  res.json(history);
});

router.get("/search", (req, res) => {
  try {
    const query = req.query.q as string;
    if (!query) return res.json([]);
    const results = ollamaService.searchHistory(query);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: "Failed to search history" });
  }
});

router.get("/context/:alertId", (req, res) => {
  try {
    const alertId = parseInt(req.params.alertId);
    const context = ollamaService.getAlertContext(alertId);
    if (!context) return res.status(404).json({ error: "Alert not found" });
    res.json(context);
  } catch (error) {
    res.status(500).json({ error: "Failed to get context" });
  }
});

router.post("/history", async (req, res) => {
  try {
    const { role, content } = req.body;
    ollamaService.saveToHistory(role, content);
    res.json({ status: "ok" });
  } catch (error) {
    res.status(500).json({ error: "Failed to save history" });
  }
});

export default router;
