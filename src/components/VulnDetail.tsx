import React, { useState } from 'react';
import { X, ShieldAlert, Cpu, ListChecks, Database, Zap, HardDrive, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../api/client';
import toast from 'react-hot-toast';

interface VulnDetailProps {
  vuln: any;
  onClose: () => void;
  onRemediated?: () => void;
}

export default function VulnDetail({ vuln, onClose, onRemediated }: VulnDetailProps) {
  const [isPatching, setIsPatching] = useState(false);

  if (!vuln) return null;

  const handleRemediate = async () => {
    try {
      setIsPatching(true);
      if (!vuln.package_name) {
         toast.error("Agent Error: No package name specified for auto-remediation.");
         setIsPatching(false);
         return;
      }
      
      toast('Agent initializing patch deployment...', { icon: <Zap className="w-5 h-5 text-soc-cyan" /> });
      
      const res = await api.remediateVulnerability(vuln.package_name, vuln.vulnerable_versions || 'unknown-ver');
      
      toast.success(res.data.message || `Autonomous Agent successfully patched ${vuln.package_name}.`);
      
      setTimeout(() => {
          if (onRemediated) onRemediated();
          onClose(); 
      }, 1500);

    } catch (e) {
      console.error(e);
      toast.error('Agent patching failed. Manual intervention required.');
    } finally {
      setIsPatching(false);
    }
  };

  return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="glass-panel bg-soc-surface border border-soc-border rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
        >
          {/* Header */}
          <div className="p-6 border-b border-soc-border flex justify-between items-center bg-soc-bg/50">
            <div className="flex items-center gap-4">
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                vuln.severity === 'Critical' ? 'bg-soc-red/10 text-soc-red' : 
                vuln.severity === 'High' ? 'bg-soc-yellow/10 text-soc-yellow' : 'bg-soc-blue/10 text-soc-blue'
              }`}>
                {vuln.severity} VULNERABILITY
              </span>
              <h2 className="text-xl font-bold font-syne">{vuln.cve}</h2>
            </div>
            <div className="flex items-center gap-2">
              <span className={`flex items-center gap-2 px-3 py-1.5 bg-soc-cyan/10 text-soc-cyan rounded-lg text-xs font-bold border border-soc-cyan/30`}>
                <Shield className="w-4 h-4" />
                {vuln.status}
              </span>
              <button onClick={onClose} className="p-2 hover:bg-soc-border rounded-full transition-colors ml-2">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            {/* Description and Impact Section */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-soc-purple/5 border border-soc-purple/20 flex flex-col gap-2">
                <div className="flex items-center gap-2 text-soc-purple text-xs font-bold uppercase tracking-widest">
                  <HardDrive className="w-4 h-4" />
                  Target Host Architecture
                </div>
                <div className="font-mono text-soc-text font-bold mt-1">
                  {vuln.host}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-soc-red/5 border border-soc-red/20 flex flex-col gap-2">
                <div className="flex items-center gap-2 text-soc-red text-xs font-bold uppercase tracking-widest">
                  <ShieldAlert className="w-4 h-4" />
                  Description Overview
                </div>
                <p className="text-xs text-soc-text/80 leading-relaxed font-mono mt-1">
                  {vuln.description}
                </p>
              </div>
            </section>

            {/* Context Details */}
            <section>
              <h3 className="text-sm font-bold text-soc-muted uppercase tracking-widest mb-4 flex items-center gap-2">
                <Database className="w-4 h-4" />
                Vulnerability Context
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { label: 'CVSS Score', value: vuln.cvss_score || 'N/A' },
                  { label: 'Package Name', value: vuln.package_name || 'System Level' },
                  { label: 'Vulnerable Versions', value: vuln.vulnerable_versions || 'N/A', mono: true },
                  { label: 'Target OS', value: 'Debian / Ubuntu Container' },
                  { label: 'Component Type', value: 'NPM Dependency' },
                  { label: 'Exploitability', value: (parseFloat(vuln.cvss_score) || 5) > 7 ? 'High' : 'Medium' },
                ].map((item, i) => (
                  <div key={i} className="bg-soc-bg p-3 rounded-xl border border-soc-border">
                    <div className="text-[10px] text-soc-muted uppercase font-bold mb-1">{item.label}</div>
                    <div className={`text-sm font-semibold ${item.mono ? 'font-mono text-soc-cyan' : ''}`}>
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* AI Analysis */}
            <section>
              <h3 className="text-sm font-bold text-soc-muted uppercase tracking-widest mb-4 flex items-center gap-2">
                <Cpu className="w-4 h-4" />
                AI Analysis & Intelligence review
              </h3>
              <div className="bg-soc-bg p-5 rounded-xl border border-soc-border">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-bold text-soc-muted uppercase tracking-widest">Threat Rating index</span>
                  <span className={`text-xl font-bold font-mono ${
                    vuln.severity === 'Critical' ? 'text-soc-red drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]' : 
                    vuln.severity === 'High' ? 'text-soc-yellow drop-shadow-[0_0_8px_rgba(234,179,8,0.8)]' : 
                    'text-soc-cyan drop-shadow-[0_0_8px_rgba(0,229,192,0.8)]'
                  }`}>
                    {vuln.cvss_score || '0.0'} / 10.0
                  </span>
                </div>
                <div className="flex gap-1 h-3 w-full mb-6">
                  {/* Dynamic threat bar */}
                  {[...Array(10)].map((_, i) => {
                    const threshold = (i + 1);
                    const score = parseFloat(vuln.cvss_score || '0');
                    const isActive = score >= threshold;
                    
                    let colorClass = 'bg-soc-border';
                    let shadowClass = '';
                    
                    if (isActive) {
                      if (score >= 8) {
                        colorClass = 'bg-soc-red';
                        shadowClass = 'shadow-[0_0_10px_rgba(239,68,68,0.6)]';
                      } else if (score >= 5) {
                        colorClass = 'bg-soc-yellow';
                        shadowClass = 'shadow-[0_0_10px_rgba(234,179,8,0.6)]';
                      } else {
                        colorClass = 'bg-soc-cyan';
                        shadowClass = 'shadow-[0_0_10px_rgba(0,229,192,0.6)]';
                      }
                    }

                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scaleY: 0 }}
                        animate={{ opacity: 1, scaleY: 1 }}
                        transition={{ delay: i * 0.05 }}
                        className={`flex-1 rounded-sm ${colorClass} ${shadowClass} transition-all duration-500`}
                        style={{ opacity: isActive ? 1 : 0.2 }}
                      />
                    );
                  })}
                </div>
                <p className="text-sm text-soc-text leading-relaxed font-mono">
                  {vuln.ai_analysis || "Pattern analysis indicates an unpatched vulnerability mapped on the current host. System configuration allows arbitrary payload execution if an inbound vector hits the unpatched component."}
                </p>
              </div>
            </section>

            {/* Recommended Remediation */}
            <section>
              <h3 className="text-sm font-bold text-soc-muted uppercase tracking-widest mb-4 flex items-center gap-2">
                <ListChecks className="w-4 h-4" />
                Recommended Remediation Details
              </h3>
              <div className="bg-soc-bg rounded-xl border border-soc-border p-4">
                 <div className="flex items-center gap-3 mb-2">
                    <div className="w-5 h-5 rounded-full bg-soc-cyan/20 text-soc-cyan flex items-center justify-center text-[10px] font-bold">1</div>
                    <span className="text-sm font-bold">Execute automated patch deployment</span>
                 </div>
                 <div className="ml-8 mb-4">
                    <pre className="p-3 bg-black text-soc-green font-mono text-xs rounded-lg border border-soc-border">
                       $ {vuln.remediation || "sudo apt-get update && sudo apt-get upgrade"}
                    </pre>
                 </div>
                 <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-soc-cyan/20 text-soc-cyan flex items-center justify-center text-[10px] font-bold">2</div>
                    <span className="text-sm font-bold">Verify component integrity and restart node processes</span>
                 </div>
              </div>
            </section>
          </div>

          {/* Footer Actions */}
          <div className="p-6 border-t border-soc-border bg-soc-bg/50 flex flex-wrap gap-3">
            <button
               onClick={handleRemediate}
               disabled={isPatching}
               className={`flex-[2] min-w-[200px] flex items-center justify-center gap-2 py-3 font-bold rounded-xl transition-colors ${
                 isPatching 
                  ? 'bg-soc-cyan/50 text-black/50 cursor-not-allowed' 
                  : 'bg-soc-cyan text-black hover:bg-soc-cyan/90 shadow-[0_0_15px_rgba(0,229,192,0.3)]'
               }`}
            >
               <Zap className={`w-5 h-5 ${isPatching ? 'animate-pulse' : ''}`} />
               {isPatching ? 'Deploying Autonomous Patch...' : 'Auto-Remediate (Apply Patch)'}
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-soc-border hover:bg-soc-muted/20 text-soc-text font-bold rounded-xl transition-colors min-w-[150px]"
            >
              Close Details
            </button>
          </div>
        </motion.div>
      </div>
  );
}
