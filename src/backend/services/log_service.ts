import { db } from "../database.js";
import { alertService, settingsService } from "./alert_service.js";
import { ipsService } from "./ips_service.js";
import { featureExtractor } from "../../ai/feature_extractor.js";
import { anomalyDetector } from "../../ai/anomaly_detector.js";
import { explainer } from "../../ai/explainer.js";
import { aegixBridge } from "./aegix_bridge.js";

export const logService = {
  processAndSaveLog: async (logData: any) => {
    // 1. Extract features (legacy fast-path, kept for basic filtering)
    const features = featureExtractor.extract(logData);
    
    // Fetch thresholds
    const settings = settingsService.getSettings();
    const anomalyThreshold = settings.anomaly_threshold ?? 0.35;
    const criticalThreshold = settings.critical_threshold ?? 0.85;

    // 2. Predict anomaly via fast local inference
    const [isAnomaly, score] = anomalyDetector.predict(features, anomalyThreshold);
    
    // 3. Save log
    const logId = logService.createLog({
      ...logData,
      is_anomaly: isAnomaly
    });
    
    // 4. Send raw event to the real Aegix Brain Python Agent to orchestrate assessing and actioning
    try {
       aegixBridge.processEvent({
          id: logId,
          event_type: logData.event_type || 'system_log',
          source_ip: logData.source_ip,
          username: logData.username,
          payload: logData.payload,
          status_code: logData.status_code,
          score: score, // provide base heuristic score
          severity: score > criticalThreshold ? 'Critical' : (isAnomaly ? 'High' : 'Low')
       });
    } catch (e) {
       console.error("Failed to forward log to Aegix Brain:", e);
    }
    
    let alertId = null;
    if (isAnomaly) {
      // 5. Generate explanation and mitigations (basic)
      const reason = explainer.explain(logData, score);
      const mitigations = explainer.suggestMitigations(logData);
      
      // Assign severity
      let severity = "Low";
      if (score > criticalThreshold) severity = "Critical"; 
      else if (score > (anomalyThreshold + (criticalThreshold - anomalyThreshold) * 0.2)) severity = "Medium";
      
      // We no longer automatically trigger IPS blocks for EVERY anomaly directly in logService.
      // We pass the decision to Aegix Brain to execute! We just log the base Alert here.
      alertId = alertService.createAlert({
        log_id: logId,
        severity,
        reason,
        score,
        mitigations: "Evaluating optimal response strategy via Aegix AI Brain..."
      }, true); // skipAegix: true to prevent duplicate evaluation since log was sent directly
    }
    
    return { log_id: logId, is_anomaly: isAnomaly, alert_id: alertId };
  },

  createLog: (log: any) => {
    const stmt = db.prepare(`
      INSERT INTO logs (source_ip, event_type, username, status_code, payload, is_anomaly)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(
      log.source_ip,
      log.event_type,
      log.username,
      log.status_code,
      JSON.stringify(log.payload || {}),
      log.is_anomaly ? 1 : 0
    );
    return info.lastInsertRowid;
  },

  getLogs: (limit = 100, offset = 0, anomalyOnly = false, sourceIp?: string, username?: string) => {
    let query = "SELECT * FROM logs WHERE 1=1";
    const params: any[] = [];

    if (anomalyOnly) {
      query += " AND is_anomaly = 1";
    }
    if (sourceIp) {
      query += " AND source_ip = ?";
      params.push(sourceIp);
    }
    if (username) {
      query += " AND username = ?";
      params.push(username);
    }

    query += " ORDER BY timestamp DESC LIMIT ? OFFSET ?";
    params.push(limit, offset);

    return db.prepare(query).all(...params);
  },

  getStats: () => {
    try {
      const totalLogs = db.prepare("SELECT COUNT(*) as count FROM logs").get() as any;
      const anomaliesToday = db.prepare("SELECT COUNT(*) as count FROM logs WHERE is_anomaly = 1 AND timestamp >= date('now')").get() as any;
      const eventsByType = db.prepare("SELECT event_type, COUNT(*) as count FROM logs GROUP BY event_type").all() as any[];
      const processCount = db.prepare("SELECT COUNT(DISTINCT pid) as count FROM processes WHERE timestamp > datetime('now', '-15 seconds') AND status = 'Running'").get() as any;
      const networkCount = db.prepare("SELECT COUNT(DISTINCT local_address || remote_address) as count FROM network_connections WHERE timestamp > datetime('now', '-15 seconds')").get() as any;
      
      // Last 24h timeline
      const timeline = db.prepare(`
        SELECT strftime('%H', timestamp) as hour, COUNT(*) as count 
        FROM logs 
        WHERE timestamp >= datetime('now', '-24 hours')
        GROUP BY hour
        ORDER BY hour ASC
      `).all() as any[];

      return {
        total_logs: totalLogs?.count || 0,
        anomalies_today: anomaliesToday?.count || 0,
        process_count: processCount?.count || 0,
        network_count: networkCount?.count || 0,
        events_per_type: eventsByType.reduce((acc, curr) => ({ ...acc, [curr.event_type]: curr.count }), {}),
        timeline: timeline.map(t => ({ hour: parseInt(t.hour), count: t.count }))
      };
    } catch (err) {
      console.error("Database error in getStats:", err);
      return {
        total_logs: 0,
        anomalies_today: 0,
        events_per_type: {},
        timeline: []
      };
    }
  }
};
