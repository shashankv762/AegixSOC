import express from 'express';
import { edrService } from '../services/edr_service.js';

const router = express.Router();

router.get('/vulnerabilities', async (req, res) => {
  try {
     const vulns = await edrService.scanVulnerabilities();
     res.json(vulns);
  } catch (err) {
     console.error("Vulnerability scan failed:", err);
     res.status(500).json({ error: "Scan Failed" });
  }
});

router.get('/quarantines', (req, res) => {
  res.json(edrService.quarantineLogs);
});

router.post('/scan', async (req, res) => {
  const vulns = await edrService.scanVulnerabilities();
  res.json({ status: 'ok', message: `Kernel file-system scan initiated. Located ${vulns.length} environment issues.`, count: vulns.length });
});

router.post('/scan-file', async (req, res) => {
  const { targetPath } = req.body;
  if (!targetPath) {
    return res.status(400).json({ error: "No target path provided" });
  }
  
  try {
     const result = await edrService.scanTargetFile(targetPath);
     res.json(result);
  } catch (err: any) {
     res.status(500).json({ error: err.message });
  }
});

router.post('/remediate', async (req, res) => {
  const { packageName, range } = req.body;
  if (!packageName) {
    return res.status(400).json({ error: "Package name required" });
  }
  try {
     const report = await edrService.remediateVulnerability(packageName, range || 'unknown version');
     res.json({ status: 'ok', message: `Autonomous patching successful. Package '${packageName}' updated.`, report });
  } catch (err) {
     console.error("Auto-patching failed:", err);
     res.status(500).json({ error: "Patch Deployment Failed" });
  }
});

router.post('/remediate-critical', async (req, res) => {
  // Override Express internal timeout for long running bulk patch
  req.setTimeout(300000); // 5 minutes
  res.setTimeout(300000); 

  try {
     const result = await edrService.remediateCriticalHighVulnerabilities();
     res.json({ status: 'ok', message: `Autonomous patching completed. Re-secured ${result.patched} critical/high dependencies.`, patched: result.patched });
  } catch (err) {
     console.error("Bulk Auto-patching failed:", err);
     res.status(500).json({ error: "Bulk Patch Deployment Failed" });
  }
});

router.get('/reports', (req, res) => {
  res.json(edrService.patchReports);
});

export default router;
