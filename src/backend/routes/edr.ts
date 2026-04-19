import express from 'express';

const router = express.Router();

// Simulated EDR Data
const vulnerabilities = [
  { id: 'VULN-001', host: 'DESKTOP-ENG-01', cve: 'CVE-2024-21338', severity: 'Critical', description: 'Windows Kernel Elevation of Privilege', status: 'Unpatched' },
  { id: 'VULN-002', host: 'SRV-DB-01', cve: 'CVE-2023-38545', severity: 'Medium', description: 'curl SOCKS5 heap buffer overflow', status: 'Patched' },
  { id: 'VULN-003', host: 'MAC-DEV-09', cve: 'CVE-2023-42916', severity: 'High', description: 'Apple WebKit Out-of-bounds Read', status: 'Unpatched' },
  { id: 'VULN-004', host: 'WEB-FRONT-02', cve: 'CVE-2021-44228', severity: 'Critical', description: 'Log4Shell RCE in log4j', status: 'Unpatched' }
];

const quarantines = [
  { id: 'Q-101', host: 'DESKTOP-FIN-04', filename: 'invoice_urgent.exe', path: 'C:\\Users\\admin\\Downloads\\', reason: 'Kernel Memory Overwrite Attempt Blocked', timestamp: new Date().toISOString() },
  { id: 'Q-102', host: 'SRV-WEB-02', filename: 'shell.php', path: '/var/www/html/uploads/', reason: 'Signature Match: WebShell Execution', timestamp: new Date(Date.now() - 3600000).toISOString() },
  { id: 'Q-103', host: 'MAC-DEV-09', filename: 'updater.dylib', path: '/Library/LaunchDaemons/', reason: 'Unauthorized Init Daemon Modification', timestamp: new Date(Date.now() - 7200000).toISOString() }
];

router.get('/vulnerabilities', (req, res) => {
  res.json(vulnerabilities);
});

router.get('/quarantines', (req, res) => {
  res.json(quarantines);
});

router.post('/scan', (req, res) => {
  res.json({ status: 'ok', message: 'Deep vulnerability and memory scan initiated across fleet.' });
});

export default router;
