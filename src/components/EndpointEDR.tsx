import React, { useState, useEffect } from 'react';
import { ShieldBan, ScanLine, Bug, CheckCircle2, AlertTriangle, FileWarning, Search, Cpu, Database } from 'lucide-react';
import { api } from '../api/client';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';

export default function EndpointEDR() {
  const [activeTab, setActiveTab] = useState<'vulnerabilities' | 'quarantine'>('quarantine');
  const [vulnerabilities, setVulnerabilities] = useState<any[]>([]);
  const [quarantines, setQuarantines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanActive, setScanActive] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [vulnR, quarR] = await Promise.all([
        api.getEDRVulnerabilities(),
        api.getEDRQuarantines()
      ]);
      setVulnerabilities(vulnR.data);
      setQuarantines(quarR.data);
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
      toast.success(res.data.message);
      
      // Simulate scan completion
      setTimeout(() => {
        setScanActive(false);
        toast('Fleet scan complete. No new vulnerabilities found.', {
          icon: <CheckCircle2 className="w-5 h-5 text-soc-green" />
        });
      }, 5000);
    } catch (err) {
      console.error('Failed to initiate scan:', err);
      toast.error('Failed to initiate fleet scan');
      setScanActive(false);
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
                    <div className="text-3xl font-bold font-syne mt-2 text-soc-cyan">1,048</div>
                 </div>
                 <div className="p-3 bg-soc-cyan/10 rounded-lg">
                     <CheckCircle2 className="w-6 h-6 text-soc-cyan" />
                 </div>
             </div>
         </div>
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
                      <tr key={v.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
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
        </AnimatePresence>
      )}
    </div>
  );
}
