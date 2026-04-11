import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { logService } from "../services/log_service.js";
import { GoogleGenAI } from "@google/genai";

const router = Router();

router.post("/analyze", authMiddleware, async (req, res) => {
  try {
    const { query, searchType, logs } = req.body;
    
    if (!logs || logs.length === 0) {
      return res.status(400).json({ error: "No logs provided for analysis." });
    }

    // Initialize Gemini
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    // Prepare data for the prompt (limit to last 50 logs to avoid token limits)
    const recentLogs = logs.slice(0, 50);
    
    const prompt = `
      You are an elite Cybersecurity Forensics Analyst.
      Perform a deep forensic analysis on the following logs related to ${searchType} "${query}".
      
      Logs:
      ${JSON.stringify(recentLogs, null, 2)}
      
      Provide a comprehensive forensic report in Markdown format. Include:
      1. **Executive Summary**: A brief overview of the activity.
      2. **Threat Assessment**: Is this activity malicious, suspicious, or benign? Why?
      3. **Timeline Analysis**: Key events and their sequence.
      4. **Indicators of Compromise (IoCs)**: Any IPs, paths, or patterns of note.
      5. **Recommended Actions**: What should the SOC team do next?
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    res.json({ report: response.text });
  } catch (error) {
    console.error("Error in deep analysis:", error);
    res.status(500).json({ error: "Failed to generate deep analysis report." });
  }
});

export default router;
