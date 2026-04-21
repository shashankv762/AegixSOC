import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Brain, Shield, Zap, Lock, Cpu, Activity, AlertTriangle } from 'lucide-react';
import { api } from '../api/client';
import { usePolling } from '../hooks/usePolling';

export default function NeuralCore() {
  const { data: logs } = usePolling(() => api.getLogs({ limit: 5 }), 2000);
  const [activeNodes, setActiveNodes] = useState<number[]>([1, 4, 7]);
  const [securityLevel, setSecurityLevel] = useState('MAXIMUM');
  const [processingStatus, setProcessingStatus] = useState('MONITORING_THREAT_VECTORS');

  // Simulate neural network activity responding to logs
  useEffect(() => {
    if (!logs || !Array.isArray(logs) || logs.length === 0) return;
    
    // Pick active nodes based on recent log activity
    const newNodes = [];
    const numNodes = Math.floor(Math.random() * 5) + 3; // 3 to 8 active nodes
    for (let i = 0; i < numNodes; i++) {
        newNodes.push(Math.floor(Math.random() * 12));
    }
    setActiveNodes(newNodes);

    const hasAnomaly = logs.some((l: any) => l.is_anomaly);
    if (hasAnomaly) {
        setProcessingStatus('ANALYZING_ANOMALY_SIGNATURES...');
        setTimeout(() => setProcessingStatus('ISOLATING_THREAT_AND_DEPLOYING_COUNTERMEASURES...'), 1500);
        setTimeout(() => setProcessingStatus('THREAT_NEUTRALIZED. MONITORING_RESTORED.'), 3000);
    } else {
        setProcessingStatus('SYSTEM_STABLE. ADVANCED_AI_DEFENCE_ACTIVE.');
    }
  }, [logs]);

  return (
    <div className="glass-panel p-6 rounded-2xl border border-soc-cyan/30 bg-black/40 relative overflow-hidden">
      {/* Background Pulse */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-soc-cyan rounded-full mix-blend-screen filter blur-[80px] animate-pulse"></div>
      </div>

      <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center">
        {/* Core Visualization */}
        <div className="w-48 h-48 relative flex-shrink-0 flex items-center justify-center mt-4 mb-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-0 rounded-full border border-soc-cyan/30 border-t-soc-cyan"
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-4 rounded-full border border-soc-purple/30 border-b-soc-purple"
          />
          <div className="absolute inset-8 rounded-full border border-white/10 flex items-center justify-center bg-black shadow-[0_0_30px_rgba(0,229,192,0.2)]">
            <Brain className="w-12 h-12 text-soc-cyan drop-shadow-[0_0_10px_rgba(0,229,192,0.8)]" />
          </div>
          
          {/* Neural Nodes */}
          {[...Array(12)].map((_, i) => {
            const angle = (i * 30 * Math.PI) / 180;
            const radius = 96; // 48px * 2 for w-48
            const x = Math.cos(angle) * (radius * 0.9);
            const y = Math.sin(angle) * (radius * 0.9);
            const isActive = activeNodes.includes(i);
            
            return (
              <motion.div
                key={i}
                className={`absolute w-3 h-3 rounded-full ${isActive ? 'bg-soc-cyan shadow-[0_0_10px_#00e5c0]' : 'bg-soc-border'}`}
                style={{
                  left: `calc(50% + ${x}px - 6px)`,
                  top: `calc(50% + ${y}px - 6px)`
                }}
                animate={isActive ? { scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] } : {}}
                transition={{ duration: 1, repeat: Infinity }}
              />
            );
          })}
        </div>

        {/* Status Panel */}
        <div className="flex-1 space-y-4 w-full">
          <div>
            <h3 className="text-xl font-bold font-syne text-soc-text flex items-center gap-2">
              <SparklesIcon className="w-6 h-6 text-soc-cyan" />
              Aegix AI Core <span className="text-[10px] bg-soc-cyan/20 text-soc-cyan px-2 py-0.5 rounded-full uppercase tracking-widest border border-soc-cyan/30">Active</span>
            </h3>
            <p className="text-sm font-mono text-soc-muted mt-1">Autonomous Organising & Threat Analysis Neural Engine</p>
          </div>

          <div className="bg-black/50 border border-white/5 rounded-xl p-4 font-mono text-xs text-soc-cyan h-24 overflow-y-auto custom-scrollbar flex flex-col justify-end">
             <AnimatePresence mode="popLayout">
                <motion.div
                    key={processingStatus}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2"
                >
                    <span className="shrink-0">{'>'}</span>
                    <span className="uppercase tracking-wide">{processingStatus}</span>
                </motion.div>
             </AnimatePresence>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 bg-soc-purple/10 border border-soc-purple/20 rounded-lg text-center shadow-inner">
               <Cpu className="w-5 h-5 text-soc-purple mx-auto mb-1" />
               <div className="text-[10px] uppercase text-soc-muted font-bold tracking-widest">Logic Tier</div>
               <div className="text-sm font-mono text-soc-text font-bold">Deep Neural</div>
            </div>
            <div className="p-3 bg-soc-cyan/10 border border-soc-cyan/20 rounded-lg text-center shadow-inner">
               <Shield className="w-5 h-5 text-soc-cyan mx-auto mb-1" />
               <div className="text-[10px] uppercase text-soc-muted font-bold tracking-widest">Defence</div>
               <div className="text-sm font-mono text-soc-text font-bold">Impenetrable</div>
            </div>
            <div className="p-3 bg-soc-green/10 border border-soc-green/20 rounded-lg text-center shadow-inner">
               <Activity className="w-5 h-5 text-soc-green mx-auto mb-1" />
               <div className="text-[10px] uppercase text-soc-muted font-bold tracking-widest">Reaction</div>
               <div className="text-sm font-mono text-soc-text font-bold">Sub-ms</div>
            </div>
            <div className="p-3 bg-soc-yellow/10 border border-soc-yellow/20 rounded-lg text-center shadow-inner">
               <Lock className="w-5 h-5 text-soc-yellow mx-auto mb-1" />
               <div className="text-[10px] uppercase text-soc-muted font-bold tracking-widest">Security</div>
               <div className="text-sm font-mono text-soc-text font-bold">{securityLevel}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SparklesIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" />
      <path d="M19 17v4" />
      <path d="M3 5h4" />
      <path d="M17 19h4" />
    </svg>
  );
}
