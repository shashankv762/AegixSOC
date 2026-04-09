import { db } from '../database.js';

export interface ThreatEvent {
  id: string;
  timestamp: string;
  type: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  source_ip: string;
  description: string;
}

export interface LayerHealth {
  id: string;
  name: string;
  status: 'green' | 'amber' | 'red';
  message: string;
}

export interface MemoryEvent {
  id: string;
  timestamp: string;
  action: string;
  details: string;
}

class Phase1Service {
  public getThreats(): ThreatEvent[] {
    const threats: ThreatEvent[] = [];

    // Get recent alerts
    const alerts = db.prepare(`
      SELECT id, created_at as timestamp, severity, reason 
      FROM alerts 
      ORDER BY created_at DESC LIMIT 10
    `).all() as any[];

    alerts.forEach(a => {
      threats.push({
        id: `alert-${a.id}`,
        timestamp: a.timestamp,
        type: 'System Alert',
        severity: a.severity as any,
        source_ip: 'System',
        description: a.reason
      });
    });

    // Get recent suspicious network connections
    const networks = db.prepare(`
      SELECT id, timestamp, remote_address, local_address, status, is_suspicious 
      FROM network_connections 
      ORDER BY timestamp DESC LIMIT 15
    `).all() as any[];

    networks.forEach(n => {
      threats.push({
        id: `net-${n.id}`,
        timestamp: n.timestamp,
        type: 'Network Connection',
        severity: n.is_suspicious ? 'High' : 'Low',
        source_ip: n.remote_address,
        description: `${n.status} connection on ${n.local_address}`
      });
    });

    // Get recent suspicious processes
    const processes = db.prepare(`
      SELECT id, timestamp, name, pid, is_suspicious 
      FROM processes 
      ORDER BY timestamp DESC LIMIT 15
    `).all() as any[];

    processes.forEach(p => {
      threats.push({
        id: `proc-${p.id}`,
        timestamp: p.timestamp,
        type: 'Process Activity',
        severity: p.is_suspicious ? 'High' : 'Low',
        source_ip: 'localhost',
        description: `${p.name} (PID: ${p.pid})`
      });
    });

    // Sort all combined threats by timestamp descending
    threats.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return threats.slice(0, 30);
  }

  public getLayers(): LayerHealth[] {
    const layers: LayerHealth[] = [
      { id: 'L0', name: 'Sensor Grid', status: 'green', message: 'All sensors active' },
      { id: 'L1', name: 'Detection Engine', status: 'green', message: 'Sigma rules loaded' },
      { id: 'L2', name: 'AI Brain', status: 'green', message: 'LLM ready' },
      { id: 'L3', name: 'Autonomous Response', status: 'green', message: 'Standby' },
      { id: 'L4', name: 'Self-Hardening', status: 'green', message: 'Monitoring' },
      { id: 'L5', name: 'Desktop App', status: 'green', message: 'UI connected' },
    ];

    // Check recent data for L0 status
    const recentDataCount = db.prepare(`
      SELECT count(*) as count FROM processes WHERE timestamp > datetime('now', '-30 seconds')
    `).get() as { count: number };

    if (recentDataCount.count === 0) {
      layers[0].status = 'amber';
      layers[0].message = 'No recent sensor data';
    } else {
      layers[0].status = 'green';
      layers[0].message = `Receiving telemetry (${recentDataCount.count} events)`;
    }

    // Check recent alerts for L1 status
    const recentAlerts = db.prepare(`
      SELECT severity FROM alerts WHERE created_at > datetime('now', '-5 minutes') ORDER BY created_at DESC LIMIT 1
    `).get() as { severity: string } | undefined;

    if (recentAlerts) {
      if (recentAlerts.severity === 'Critical') {
        layers[1].status = 'red';
        layers[1].message = 'Critical anomaly detected';
        layers[2].status = 'amber';
        layers[2].message = 'Analyzing threat...';
      } else if (recentAlerts.severity === 'High') {
        layers[1].status = 'amber';
        layers[1].message = 'High severity alert';
      }
    }

    return layers;
  }

  public getMemory(): MemoryEvent[] {
    const memory: MemoryEvent[] = [];

    // Fetch recent alerts as memory events
    const alerts = db.prepare(`
      SELECT id, created_at as timestamp, reason, mitigations 
      FROM alerts 
      ORDER BY created_at DESC LIMIT 20
    `).all() as any[];

    alerts.forEach(a => {
      memory.push({
        id: `mem-alert-${a.id}`,
        timestamp: a.timestamp,
        action: 'Threat Detected',
        details: a.reason
      });
      
      if (a.mitigations) {
        try {
          const mitigationsList = JSON.parse(a.mitigations);
          if (Array.isArray(mitigationsList) && mitigationsList.length > 0) {
            memory.push({
              id: `mem-mit-${a.id}`,
              timestamp: new Date(new Date(a.timestamp).getTime() + 1000).toISOString(), // 1s after
              action: 'Auto-Mitigation Proposed',
              details: mitigationsList[0]
            });
          } else if (typeof a.mitigations === 'string' && a.mitigations.length > 0) {
             memory.push({
              id: `mem-mit-${a.id}`,
              timestamp: new Date(new Date(a.timestamp).getTime() + 1000).toISOString(),
              action: 'Auto-Mitigation Proposed',
              details: a.mitigations
            });
          }
        } catch(e) {
          // ignore
        }
      }
    });

    memory.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return memory.slice(0, 20);
  }
}

export const phase1Service = new Phase1Service();
