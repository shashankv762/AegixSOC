import React from 'react';
import { usePolling } from '../hooks/usePolling';
import { api } from '../api/client';
import { ShieldAlert, Bell, Activity, Target, PieChart as PieChartIcon, Brain, Network, Cpu, Server, Monitor } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import LoginChart from './LoginChart';
import LogFeed from './LogFeed';
import AlertsPanel from './AlertsPanel';

interface DashboardProps {
  onSelectLog: (log: any) => void;
  onInvestigate: (alert: any) => void;
}

export default function Dashboard({ onSelectLog, onInvestigate }: DashboardProps) {
  const { data: stats } = usePolling(() => api.getStats(), 5000);
  const { data: alerts } = usePolling(() => api.getAlerts({ limit: 5 }), 5000);
  const { data: layersData } = usePolling(() => api.getPhase1Layers(), 1500);
  const { data: memoryData } = usePolling(() => api.getPhase1Memory(), 1500);

  const layers = Array.isArray(layersData) ? layersData : [];
  const memory = Array.isArray(memoryData) ? memoryData : [];

  const metricCards = [
    { label: 'Total Logs Today', value: stats?.total_logs || 0, icon: Activity, color: 'text-soc-cyan', border: 'border-soc-cyan/30', trend: '+12%' },
    { label: 'Intelligence Nodes', value: memoryData?.length || 0, icon: Brain, color: 'text-soc-purple', border: 'border-soc-purple/30', trend: 'GROWING' },
    { label: 'Network Conns', value: stats?.network_count || 0, icon: Activity, color: 'text-soc-cyan', border: 'border-soc-cyan/30', trend: 'ACTIVE' },
    { label: 'Critical Alerts', value: (Array.isArray(alerts) ? alerts : [])?.filter(a => a.severity === 'Critical').length || 0, icon: ShieldAlert, color: 'text-soc-red', border: 'border-soc-red/30', trend: 'URGENT' },
  ];

  const pieData = stats?.events_per_type ? Object.entries(stats.events_per_type).map(([name, value]) => ({
    name: name.replace(/_/g, ' ').toUpperCase(),
    value
  })) : [];

  const COLORS = ['#00e5c0', '#7f77dd', '#10b981', '#ff4757', '#ffb347'];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  };

  const getLayerIcon = (id: string) => {
    switch(id) {
      case 'L0': return <Network className="w-4 h-4" />;
      case 'L1': return <ShieldAlert className="w-4 h-4" />;
      case 'L2': return <Brain className="w-4 h-4" />;
      case 'L3': return <Cpu className="w-4 h-4" />;
      case 'L4': return <Server className="w-4 h-4" />;
      case 'L5': return <Monitor className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'green': return 'bg-soc-green shadow-[0_0_8px_rgba(16,185,129,0.5)]';
      case 'amber': return 'bg-soc-yellow shadow-[0_0_8px_rgba(234,179,8,0.5)]';
      case 'red': return 'bg-soc-red shadow-[0_0_8px_rgba(239,68,68,0.5)] animate-pulse';
      default: return 'bg-soc-muted';
    }
  };

  return (
    <motion.div 
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {/* Row 1: Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map((card, i) => (
          <motion.div key={i} variants={itemVariants} className={`glass-panel p-5 rounded-xl border-t-2 ${card.border} hover:-translate-y-1 transition-transform duration-300 group`}>
            <div className="flex justify-between items-start mb-4">
              <div className={`p-2.5 rounded-lg bg-soc-bg/50 border border-soc-border/50 ${card.color} group-hover:scale-110 transition-transform`}>
                <card.icon className="w-5 h-5" />
              </div>
              <div className={`text-[10px] font-bold px-2 py-0.5 rounded border ${card.border} ${card.color} bg-soc-bg/30`}>
                {card.trend}
              </div>
            </div>
            <div className="text-3xl font-bold text-soc-text font-syne tracking-tight flex items-baseline gap-2">
              {card.value}
              <span className="text-[10px] text-soc-muted font-mono uppercase tracking-tighter">Units</span>
            </div>
            <div className="text-xs font-semibold text-soc-muted uppercase tracking-widest mt-1">{card.label}</div>
            
            {/* Technical detail line */}
            <div className="mt-4 pt-3 border-t border-soc-border/30 flex justify-between items-center">
              <div className="w-full h-1 bg-soc-border/20 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '65%' }}
                  className={`h-full bg-current ${card.color}`}
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Row 2: Layer Health & Episodic Threat Memory */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* System Intelligence Summary */}
        <motion.div variants={itemVariants} className="lg:col-span-2 glass-panel p-6 rounded-xl border border-soc-purple/20 bg-soc-purple/5 flex flex-col justify-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Brain className="w-24 h-24 text-soc-purple" />
          </div>
          <h3 className="text-soc-purple font-bold font-syne text-lg mb-2">System Intelligence</h3>
          <p className="text-soc-text text-sm leading-relaxed relative z-10">
            AegixChain utilizes <span className="text-soc-purple font-bold">Episodic Threat Memory</span> and an <span className="text-soc-cyan font-bold">Online Deep Learning Network</span> to embed attack fingerprints and predict future threats. Powered by a local <span className="text-soc-purple font-bold">SmolLM-135M</span> model for autonomous reasoning.
            <br /><br />
            <span className="italic text-soc-muted">"The system gets smarter every time it's attacked."</span>
          </p>
          <div className="mt-6 flex items-center gap-2">
            <div className="flex -space-x-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="w-6 h-6 rounded-full bg-soc-purple/20 border border-soc-purple/40 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-soc-purple animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
                </div>
              ))}
            </div>
            <span className="text-[10px] text-soc-muted font-mono uppercase tracking-widest">Learning Loops Active</span>
          </div>
        </motion.div>

        {/* Layer Health */}
        <motion.div variants={itemVariants} className="glass-panel rounded-xl flex flex-col overflow-hidden h-[350px]">
          <div className="p-4 border-b border-white/10 bg-black/40">
            <h2 className="font-syne font-bold text-soc-text flex items-center gap-2">
              <Activity className="w-5 h-5 text-soc-cyan" />
              Live System Health
            </h2>
          </div>
          <div className="flex-1 p-4 space-y-4 overflow-y-auto">
            {layers.map((layer: any) => (
              <div key={layer.id} className="p-3 rounded-lg border border-white/5 bg-black/40 hover:bg-white/5 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-soc-text font-bold text-sm">
                    {getLayerIcon(layer.id)}
                    {layer.id} — {layer.name}
                  </div>
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(layer.status)}`} />
                </div>
                <div className="text-xs text-soc-muted font-mono">{layer.message}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Episodic Threat Memory */}
        <motion.div variants={itemVariants} className="lg:col-span-2 glass-panel rounded-xl flex flex-col overflow-hidden h-[350px]">
          <div className="p-4 border-b border-white/10 bg-black/40 flex justify-between items-center">
            <h2 className="font-syne font-bold text-soc-text flex items-center gap-2">
              <Brain className="w-5 h-5 text-soc-purple" />
              Episodic Threat Memory
            </h2>
            <div className="text-[10px] font-bold text-soc-purple bg-soc-purple/10 px-2 py-1 rounded border border-soc-purple/30 animate-pulse">
              SYSTEM LEARNING ACTIVE
            </div>
          </div>
          <div className="flex-1 p-4 overflow-y-auto relative">
            <div className="absolute left-6 top-4 bottom-4 w-px bg-white/10"></div>
            <div className="space-y-6 relative z-10">
              <AnimatePresence initial={false}>
                {memory.map((mem: any) => (
                  <motion.div
                    key={mem.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-4 relative"
                  >
                    <div className="w-4 h-4 rounded-full bg-soc-purple border-4 border-black shrink-0 mt-1 shadow-[0_0_10px_rgba(127,119,221,0.5)]" />
                    <div className="flex-1 pb-4">
                      <div className="text-xs text-soc-muted font-mono mb-1">
                        {new Date(mem.timestamp).toLocaleTimeString()}
                      </div>
                      <div className="text-sm font-bold text-soc-text">{mem.action}</div>
                      <div className="text-xs text-soc-muted mt-1">{mem.details}</div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* Real-Time Resource Scanning */}
        <motion.div variants={itemVariants} className="glass-panel rounded-xl flex flex-col overflow-hidden h-[350px] border-t-2 border-soc-cyan/50">
          <div className="p-4 border-b border-white/10 bg-black/40">
            <h2 className="font-syne font-bold text-soc-text flex items-center gap-2">
              <Cpu className="w-5 h-5 text-soc-cyan" />
              Real-Time Scanning
            </h2>
          </div>
          <div className="flex-1 p-5 flex flex-col justify-between">
            <div className="text-center">
              <div className="text-4xl font-bold text-soc-cyan font-syne drop-shadow-[0_0_10px_rgba(0,229,192,0.5)]">
                {stats?.process_count || 0}
              </div>
              <div className="text-xs text-soc-muted uppercase tracking-widest mt-1">Active Processors</div>
            </div>
            
            <div className="space-y-3 mt-4">
              <p className="text-xs text-soc-text/80 text-center mb-4">
                Utilizing live system resources to continuously scan and build advanced defense <span className="text-soc-cyan font-bold">layer by layer</span>.
              </p>
              
              {[1, 2, 3, 4].map((layer) => (
                <div key={layer} className="relative h-6 bg-black/40 rounded border border-white/5 overflow-hidden flex items-center px-2">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 2, repeat: Infinity, repeatType: "reverse", delay: layer * 0.2 }}
                    className="absolute left-0 top-0 h-full bg-soc-cyan/20"
                  />
                  <div className="relative z-10 flex justify-between w-full text-[10px] font-mono font-bold text-soc-cyan">
                    <span>LAYER {layer}</span>
                    <span className="animate-pulse">HARDENING...</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Row 3: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <LoginChart />
        </motion.div>
        <motion.div variants={itemVariants} className="glass-panel rounded-xl p-6 min-h-[400px] flex flex-col relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-soc-purple to-soc-cyan opacity-50"></div>
          <h3 className="font-bold mb-6 text-soc-text flex items-center gap-2 font-syne">
            <PieChartIcon className="w-4 h-4 text-soc-purple" />
            Event Distribution
          </h3>
          <div className="flex-1 min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  innerRadius={65}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.9)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px' }}
                  itemStyle={{ color: '#f3f4f6' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-3 mt-4">
            {pieData.map((entry, i) => (
              <div key={i} className="flex items-center gap-1.5 text-xs font-medium text-soc-muted">
                <div className="w-2.5 h-2.5 rounded-full shrink-0 shadow-[0_0_8px_currentColor]" style={{ backgroundColor: COLORS[i % COLORS.length], color: COLORS[i % COLORS.length] }} />
                <span className="whitespace-nowrap">{entry.name}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Row 4: Live Feed & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <LogFeed onSelectLog={onSelectLog} />
        </motion.div>
        <motion.div variants={itemVariants} className="space-y-4">
          <h3 className="font-bold text-soc-text flex items-center gap-2 px-1 font-syne">
            <Bell className="w-4 h-4 text-soc-yellow" />
            Recent Alerts
          </h3>
          <AlertsPanel onInvestigate={onInvestigate} />
        </motion.div>
      </div>
    </motion.div>
  );
}
