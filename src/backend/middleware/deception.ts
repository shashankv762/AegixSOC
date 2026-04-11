import { Request, Response, NextFunction } from 'express';
import { ipsService } from '../services/ips_service.js';
import { logService } from '../services/log_service.js';

// Common attack paths that legitimate users should never access
const HONEYPOT_PATHS = [
  '/wp-admin',
  '/wp-login.php',
  '/.env',
  '/.git/config',
  '/phpmyadmin',
  '/admin/config.php',
  '/etc/passwd',
  '/cmd.exe',
  '/api/admin/hidden_debug'
];

export const deceptionMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const path = req.path.toLowerCase();
  
  // Check if the requested path matches any honeypot paths
  const isHoneypot = HONEYPOT_PATHS.some(hp => path.includes(hp));
  
  if (isHoneypot) {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const reason = `[DECEPTION TRIGGERED] Attempted to access honeypot path: ${req.path}`;
    
    console.warn(`Deception layer triggered by IP: ${ip} for path: ${req.path}`);
    
    // 1. Instantly block the IP at the IPS layer
    ipsService.blockIp(ip, reason);
    
    // 2. Log the critical event so the Sentinel Brain can learn from it
    await logService.processAndSaveLog({
      timestamp: new Date().toISOString(),
      source_ip: ip,
      username: "unauthorized_attacker",
      event_type: "honeypot_tripwire",
      status_code: 403,
      payload: { 
        path: req.path,
        method: req.method,
        headers: req.headers,
        layer: "Deception & Decoy"
      }
    });

    // 3. Return a fake response to waste attacker time or just drop
    return res.status(403).json({
      error: "Access Denied",
      message: "This incident has been reported and your IP has been blacklisted."
    });
  }
  
  next();
};
