import { db } from "../database.js";
import { alertService } from "./alert_service.js";

export const systemService = {
  processData: async (data: any) => {
    const { type, details, timestamp, risk_score, flagged } = data;
    
    if (type === 'process') {
      const stmt = db.prepare(`
        INSERT INTO processes (pid, name, cpu_percent, memory_usage, exe_path, status, is_suspicious)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(
        details.pid,
        details.name,
        details.cpu_percent,
        details.memory_usage,
        details.exe_path,
        details.status || 'running',
        flagged ? 1 : 0
      );

      if (flagged || risk_score > 0.7) {
        await alertService.createAlert({
          log_id: null, // System data doesn't have a log_id in the logs table
          severity: risk_score > 0.9 ? 'Critical' : 'Medium',
          reason: `Suspicious process detected: ${details.name} (PID: ${details.pid})`,
          score: risk_score,
          mitigations: "Investigate the process origin, check for unauthorized execution, and terminate if necessary."
        });
      }
    } else if (type === 'network') {
      const stmt = db.prepare(`
        INSERT INTO network_connections (local_address, remote_address, status, pid, is_suspicious)
        VALUES (?, ?, ?, ?, ?)
      `);
      stmt.run(
        details.local_address,
        details.remote_address,
        details.status,
        details.pid,
        flagged ? 1 : 0
      );

      if (flagged || risk_score > 0.7) {
        await alertService.createAlert({
          log_id: null,
          severity: risk_score > 0.9 ? 'Critical' : 'Medium',
          reason: `Suspicious network connection: ${details.remote_address} from PID ${details.pid}`,
          score: risk_score,
          mitigations: "Block the remote IP address, investigate the process making the connection, and check for data exfiltration."
        });
      }
    }
  },

  getProcesses: (limit = 100) => {
    return db.prepare(`
      SELECT * FROM processes 
      WHERE timestamp > datetime('now', '-15 seconds')
      GROUP BY pid
      ORDER BY cpu_percent DESC 
      LIMIT ?
    `).all(limit);
  },

  getNetworkConnections: (limit = 100) => {
    return db.prepare(`
      SELECT * FROM network_connections 
      WHERE timestamp > datetime('now', '-15 seconds')
      GROUP BY local_address, remote_address
      ORDER BY timestamp DESC 
      LIMIT ?
    `).all(limit);
  }
};
