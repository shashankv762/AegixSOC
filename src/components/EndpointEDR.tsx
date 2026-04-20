import React, { useState, useEffect } from 'react';
import { ShieldBan, ScanLine, Bug, CheckCircle2, AlertTriangle, FileWarning, Search, Cpu, Database, Zap } from 'lucide-react';
import { api } from '../api/client';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';
import VulnDetail from './VulnDetail';

export default function EndpointEDR() {
  const [activeTab, setActiveTab] = useState<'vulnerabilities' | 'quarantine' | 'reports'>('quarantine');
  const [vulnerabilities, setVulnerabilities] = useState<any[]>([]);
  const [quarantines, setQuarantines] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanActive, setScanActive] = useState(false);
  const [isBulkPatching, setIsBulkPatching] = useState(false);
  const [selectedVuln, setSelectedVuln] = useState<any>(null);
  
  // Targeted Scan State
  const [targetInput, setTargetInput] = useState('');
  const [isTargetScanning, setIsTargetScanning] = useState(false);
  const [targetResult, setTargetResult] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // We catch errors individually so if one endpoint fails (like vulnerabilities returning 500), 
      // the others can still load, and the array mapping isn't broken.
      const [vulnR, quarR, repR] = await Promise.all([
        api.getEDRVulnerabilities().catch(() => ({ data: [] })),
        api.getEDRQuarantines().catch(() => ({ data: [] })),
        api.getEDRReports().catch(() => ({ data: [] }))
      ]);
      
      setVulnerabilities(Array.isArray(vulnR.data) ? vulnR.data : []);
      setQuarantines(Array.isArray(quarR.data) ? quarR.data : []);
      setReports(Array.isArray(repR.data) ? repR.data : []);
    } catch (err) {
      console.error('Failed to load EDR data:', err);
      toast.error('Failed to load EDR telemetry');
    } finally {
      setLoading(false);
    }
  };

  const handleRunScan = async () => {
    try {
      setScanActive(true);
      const res = await api.runEDRScan();
      toast.success('Live Kernel memory & dependency scan running...');
      
      setTimeout(async () => {
        setScanActive(false);
        await fetchData(); // Fetch real new Vulns
        
        if (res.data.count > 0) {
            toast.error(`Deep Scan Complete: Located ${res.data.count} System Vulnerabilities.`);
        } else {
            toast('Fleet scan complete. Architecture is secure.', {
              icon: <CheckCircle2 className="w-5 h-5 text-soc-green" />
            });
        }
      }, 3500); // UI buffer so users understand it's running
    } catch (err) {
      console.error('Failed to initiate scan:', err);
      toast.error('Failed to initiate local system scan');
      setScanActive(false);
    }
  };

  const handleBulkPatch = async () => {
    try {
      setIsBulkPatching(true);
      toast('Agent initializing network-wide critical patch deployment...', { icon: <Zap className="w-5 h-5 text-soc-cyan" /> });
      
      const res = await api.remediateAllCriticalHigh();
      toast.success(res.data.message || `Mass Autonomous Patching Sequence executed.`);
      
      await fetchData(); // Refresh tables after patching complete
    } catch (err: any) {
      console.error('Failed mass patch:', err);
      // Ensure we unwrap the actual Axios error message instead of the generic Object shape
      const msg = err?.response?.data?.error || err?.message || 'Failed to execute bulk vulnerability patching.';
      toast.error(msg);
    } finally {
       setIsBulkPatching(false);
    }
  };

  const handleTargetScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetInput.trim()) return;

    try {
      setIsTargetScanning(true);
      toast('Initiating localized heuristic scan...', { icon: <Search className="w-5 h-5 text-soc-blue" /> });
      
      const res = await api.scanTargetFile(targetInput);
      setTargetResult(res.data);
      
      if (res.data.classification === 'Malicious') {
        toast.error(`Threat Detected: ${res.data.threatScore}/100 Severity`);
      } else {
        toast.success(`Target File is Benign`);
      }
    } catch (err: any) {
      console.error('Failed targeted scan:', err);
      toast.error(err?.response?.data?.error || err.message || 'Target scan failed');
    } finally {
      setIsTargetScanning(false);
    }
  };

  const severityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical': return 'text-soc-red border-soc-red/30 bg-soc-red/10';
      case 'high': return 'text-soc-yellow border-soc-yellow/30 bg-soc-yellow/10';
      default: return 'text-soc-blue border-soc-blue/30 bg-soc-blue/10';
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-3 text-transparent bg-clip-text bg-gradient-to-r from-soc-cyan to-soc-blue">
            <ShieldBan className="w-8 h-8 text-soc-cyan" />
            Endpoint Detection & Response
          </h2>
          <p className="text-soc-muted mt-1 font-mono text-sm max-w-xl">
            Aegix Kernel-level Memory Protection & Vulnerability Scanning. Guards OS primitives directly on the connected endpoints.
          </p>
        </div>
        
        <button
          onClick={handleRunScan}
          disabled={scanActive}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold font-syne transition-all ${
            scanActive 
              ? 'bg-soc-cyan/20 text-soc-cyan cursor-wait border border-soc-cyan/50' 
              : 'bg-soc-cyan text-soc-bg hover:bg-soc-cyan/90 shadow-[0_0_15px_rgba(0,229,192,0.4)]'
          }`}
        >
          {scanActive ? (
            <>
              <div className="w-5 h-5 border-2 border-soc-cyan/30 border-t-soc-cyan rounded-full animate-spin" />
              Scanning Fleet Memory...
            </>
          ) : (
            <>
              <ScanLine className="w-5 h-5" />
              Run Deep Scan
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
         <div className="glass-panel p-5 rounded-xl border-t-2 border-t-soc-red">
             <div className="flex items-start justify-between">
                 <div>
                    <h3 className="text-xs font-bold text-soc-muted uppercase tracking-widest font-mono">Quarantined Processes</h3>
                    <div className="text-3xl font-bold font-syne mt-2 text-soc-red">{quarantines.length}</div>
                 </div>
                 <div className="p-3 bg-soc-red/10 rounded-lg">
                     <FileWarning className="w-6 h-6 text-soc-red" />
                 </div>
             </div>
         </div>
         <div className="glass-panel p-5 rounded-xl border-t-2 border-t-soc-yellow">
             <div className="flex items-start justify-between">
                 <div>
                    <h3 className="text-xs font-bold text-soc-muted uppercase tracking-widest font-mono">Open Vulnerabilities</h3>
                    <div className="text-3xl font-bold font-syne mt-2 text-soc-yellow">{vulnerabilities.filter(v => v.status === 'Unpatched').length}</div>
                 </div>
                 <div className="p-3 bg-soc-yellow/10 rounded-lg">
                     <Bug className="w-6 h-6 text-soc-yellow" />
                 </div>
             </div>
         </div>
         <div className="glass-panel p-5 rounded-xl border-t-2 border-t-soc-cyan">
             <div className="flex items-start justify-between">
                 <div>
                    <h3 className="text-xs font-bold text-soc-muted uppercase tracking-widest font-mono">Protected Agents</h3>
                    <div className="text-3xl font-bold font-syne mt-2 text-soc-cyan">1 / Local Node</div>
                 </div>
                 <div className="p-3 bg-soc-cyan/10 rounded-lg">
                     <CheckCircle2 className="w-6 h-6 text-soc-cyan" />
                 </div>
             </div>
         </div>
      </div>

      <div className="glass-panel p-5 rounded-xl border border-white/5 mb-8">
        <h3 className="text-sm font-bold text-soc-text font-syne mb-4 flex items-center gap-2">
          <Search className="w-4 h-4 text-soc-cyan" />
          Targeted EDR File Scan
        </h3>
        <form onSubmit={handleTargetScan} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={targetInput}
            onChange={(e) => setTargetInput(e.target.value)}
            placeholder="Enter absolute file path (e.g. /tmp/payload.exe, C:\Temp\malware.dll)"
            className="flex-1 bg-black/40 border border-soc-border/50 rounded-lg px-4 py-2 font-mono text-sm text-soc-text focus:outline-none focus:border-soc-cyan/50"
          />
          <button
            type="submit"
            disabled={isTargetScanning || !targetInput.trim()}
            className={`px-6 py-2 rounded-lg font-bold font-syne text-sm whitespace-nowrap transition-colors ${
              isTargetScanning || !targetInput.trim()
                ? 'bg-soc-border text-soc-muted cursor-not-allowed'
                : 'bg-soc-blue text-soc-bg hover:bg-soc-blue/90 shadow-[0_0_10px_rgba(30,144,255,0.3)]'
            }`}
          >
            {isTargetScanning ? 'Analyzing...' : 'Scan File'}
          </button>
        </form>
        
        <AnimatePresence>
          {targetResult && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className={`mt-4 p-4 rounded-lg border flex flex-col gap-2 ${
                targetResult.classification === 'Malicious' 
                  ? 'bg-soc-red/10 border-soc-red/30 text-soc-red' 
                  : 'bg-soc-green/10 border-soc-green/30 text-soc-green'
              }`}
            >
              <div className="flex justify-between items-start">
                 <h4 className="font-bold font-mono text-sm">Scan Result: {targetResult.classification}</h4>
                 <div className="text-xs font-mono opacity-80">{new Date(targetResult.timestamp).toLocaleTimeString()}</div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-2">
                 <div>
                    <div className="text-[10px] uppercase tracking-wider opacity-60">Threat Score</div>
                    <div className="font-syne font-bold text-xl">{targetResult.threatScore} / 100</div>
                 </div>
                 <div>
                    <div className="text-[10px] uppercase tracking-wider opacity-60">File Size Byte Length</div>
                    <div className="font-mono text-sm mt-1">{targetResult.sizeBytes}</div>
                 </div>
              </div>
              <div className="mt-2 text-xs font-mono leading-relaxed opacity-90 border-t border-current/20 pt-2">
                 {targetResult.details}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex gap-4 border-b border-soc-border/50 pb-2">
        <button
          onClick={() => setActiveTab('quarantine')}
          className={`flex items-center gap-2 px-4 py-2 font-mono text-sm uppercase tracking-wider transition-all border-b-2 ${
            activeTab === 'quarantine'
              ? 'text-soc-red border-soc-red bg-soc-red/5'
              : 'text-soc-muted border-transparent hover:text-soc-text'
          }`}
        >
          <FileWarning className="w-4 h-4" />
          Execution Blocks
        </button>
        <button
          onClick={() => setActiveTab('vulnerabilities')}
          className={`flex items-center gap-2 px-4 py-2 font-mono text-sm uppercase tracking-wider transition-all border-b-2 ${
            activeTab === 'vulnerabilities'
              ? 'text-soc-yellow border-soc-yellow bg-soc-yellow/5'
              : 'text-soc-muted border-transparent hover:text-soc-text'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          Vulnerability Scanner
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`flex items-center gap-2 px-4 py-2 font-mono text-sm uppercase tracking-wider transition-all border-b-2 ${
            activeTab === 'reports'
              ? 'text-soc-cyan border-soc-cyan bg-soc-cyan/5'
              : 'text-soc-muted border-transparent hover:text-soc-text'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          Patch Reports
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-soc-cyan/30 border-t-soc-cyan rounded-full animate-spin" />
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {activeTab === 'quarantine' && (
            <motion.div
              key="quarantine"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="glass-panel rounded-xl overflow-hidden"
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-black/40 border-b border-white/5">
                      <th className="px-6 py-4 text-xs font-bold text-soc-muted uppercase tracking-widest font-mono">Timestamp</th>
                      <th className="px-6 py-4 text-xs font-bold text-soc-muted uppercase tracking-widest font-mono">Host Endpoint</th>
                      <th className="px-6 py-4 text-xs font-bold text-soc-muted uppercase tracking-widest font-mono">Process Blocked</th>
                      <th className="px-6 py-4 text-xs font-bold text-soc-muted uppercase tracking-widest font-mono">Defense Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quarantines.map((q) => (
                      <tr key={q.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4 text-xs font-mono text-soc-muted">
                          {new Date(q.timestamp).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 font-mono text-sm text-soc-cyan">{q.host}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Cpu className="w-4 h-4 text-soc-red" />
                            <span className="font-mono text-sm text-soc-red break-all">{q.filename}</span>
                          </div>
                          <div className="text-xs text-soc-muted mt-1 font-mono break-all">{q.path}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono border border-soc-red/30 bg-soc-red/10 text-soc-red">
                            <ShieldBan className="w-3 h-3" />
                            {q.reason}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === 'vulnerabilities' && (
            <motion.div
              key="vulnerabilities"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="glass-panel rounded-xl overflow-hidden"
            >
              <div className="flex justify-end p-4 border-b border-white/5 bg-black/20">
                <button
                  onClick={handleBulkPatch}
                  disabled={isBulkPatching || vulnerabilities.filter(v => (v.severity === 'Critical' || v.severity === 'High') && v.status !== 'Patched').length === 0}
                  className={`flex items-center gap-2 px-5 py-2 font-bold font-syne text-sm rounded-lg transition-colors ${
                    isBulkPatching 
                      ? 'bg-soc-cyan/20 text-soc-cyan cursor-wait'
                      : vulnerabilities.filter(v => (v.severity === 'Critical' || v.severity === 'High') && v.status !== 'Patched').length === 0
                        ? 'bg-soc-border text-soc-muted cursor-not-allowed'
                        : 'bg-soc-cyan text-black hover:bg-soc-cyan/90 shadow-[0_0_10px_rgba(0,229,192,0.3)]'
                  }`}
                >
                  <Zap className={`w-4 h-4 ${isBulkPatching ? 'animate-pulse' : ''}`} />
                  {isBulkPatching ? 'Deploying Fleet Patches...' : 'Auto-Patch Critical & High Threats'}
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-black/40 border-b border-white/5">
                      <th className="px-6 py-4 text-xs font-bold text-soc-muted uppercase tracking-widest font-mono">Target Host</th>
                      <th className="px-6 py-4 text-xs font-bold text-soc-muted uppercase tracking-widest font-mono">CVE Identifier</th>
                      <th className="px-6 py-4 text-xs font-bold text-soc-muted uppercase tracking-widest font-mono">Severity</th>
                      <th className="px-6 py-4 text-xs font-bold text-soc-muted uppercase tracking-widest font-mono">Description</th>
                      <th className="px-6 py-4 text-xs font-bold text-soc-muted uppercase tracking-widest font-mono">Patch Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vulnerabilities.map((v) => (
                      <tr 
                         key={v.id} 
                         onClick={() => setSelectedVuln(v)}
                         className="border-b border-white/5 hover:bg-white/[0.05] transition-colors cursor-pointer"
                      >
                        <td className="px-6 py-4 font-mono text-sm text-soc-cyan">{v.host}</td>
                        <td className="px-6 py-4">
                           <span className="px-2 py-1 bg-white/5 rounded font-mono text-xs text-soc-text font-bold">
                               {v.cve}
                           </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 rounded border text-xs font-mono font-bold uppercase tracking-wider ${severityColor(v.severity)}`}>
                            {v.severity}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-soc-muted">
                           {v.description}
                        </td>
                        <td className="px-6 py-4">
                           {v.status === 'Patched' ? (
                               <span className="inline-flex items-center gap-1 text-soc-green text-xs font-bold uppercase tracking-wider">
                                  <CheckCircle2 className="w-3 h-3" /> Patched
                               </span>
                           ) : (
                               <span className="inline-flex items-center gap-1 text-soc-red text-xs font-bold uppercase tracking-wider">
                                  <AlertTriangle className="w-3 h-3" /> Exposed
                               </span>
                           )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === 'reports' && (
            <motion.div
              key="reports"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="glass-panel overflow-hidden rounded-xl border-t-2 border-t-soc-cyan"
            >
              <div className="overflow-x-auto">
                {reports.length === 0 ? (
                  <div className="p-12 text-center text-soc-muted flex flex-col items-center">
                     <CheckCircle2 className="w-12 h-12 text-soc-border mb-4" />
                     <p className="font-syne font-bold text-lg">No Patch Reports Found.</p>
                     <p className="font-mono text-xs mt-2">Remediation events applied by the autonomous AI agent will be permanently logged here.</p>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-black/40 border-b border-white/5">
                        <th className="px-6 py-4 text-xs font-bold text-soc-muted uppercase tracking-widest font-mono">Timestamp</th>
                        <th className="px-6 py-4 text-xs font-bold text-soc-muted uppercase tracking-widest font-mono">Package Targeted</th>
                        <th className="px-6 py-4 text-xs font-bold text-soc-muted uppercase tracking-widest font-mono">Action Applied</th>
                        <th className="px-6 py-4 text-xs font-bold text-soc-muted uppercase tracking-widest font-mono">AI Assessment</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reports.map((r) => (
                        <tr key={r.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                          <td className="px-6 py-4 font-mono text-xs text-soc-muted">{new Date(r.timestamp).toLocaleString()}</td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-1 bg-soc-cyan/10 text-soc-cyan rounded font-mono text-xs font-bold border border-soc-cyan/30">
                                {r.package_name}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs font-mono">{r.action_taken}</td>
                          <td className="px-6 py-4 text-xs leading-relaxed text-soc-green font-mono">
                             {r.ai_summary}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      )}
      
      <AnimatePresence>
        {selectedVuln && (
          <VulnDetail 
            key="vuln-modal"
            vuln={selectedVuln} 
            onClose={() => setSelectedVuln(null)} 
            onRemediated={() => {
               setSelectedVuln(null);
               fetchData();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
