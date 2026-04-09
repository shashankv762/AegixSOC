import React, { useState, useEffect } from 'react';
import { usePolling } from '../hooks/usePolling';
import { api } from '../api/client';
import { motion, AnimatePresence } from 'motion/react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, ShieldAlert, Brain, Network, Cpu, Server, Monitor } from 'lucide-react';

export default function Phase1Dashboard() {
  const { data: threatsData } = usePolling(() => api.getPhase1Threats(), 1500);
  const { data: layersData } = usePolling(() => api.getPhase1Layers(), 1500);
  const { data: memoryData } = usePolling(() => api.getPhase1Memory(), 1500);

  const threats = threatsData || [];
  const layers = layersData || [];
  const memory = memoryData || [];

  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    setChartData(prev => {
      const now = new Date();
      const nowTime = now.getTime();
      
      // Calculate actual events in the last 5 seconds from our live data
      const recentEventsCount = (threatsData || []).filter((t: any) => nowTime - new Date(t.timestamp).getTime() < 5000).length;
      
      // Calculate EPS based on real data, with a tiny baseline jitter (0-2) so the chart isn't completely dead when idle
      const eps = Math.floor(recentEventsCount / 5) + Math.floor(Math.random() * 3);
      
      const newData = [...prev, { time: now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }), eps }];
      if (newData.length > 20) newData.shift();
      return newData;
    });
  }, [threatsData]);

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

  const getSeverityColor = (severity: string) => {
    switch(severity) {
      case 'Critical': return 'text-soc-red bg-soc-red/10 border-soc-red/30';
      case 'High': return 'text-soc-yellow bg-soc-yellow/10 border-soc-yellow/30';
      case 'Medium': return 'text-soc-purple bg-soc-purple/10 border-soc-purple/30';
      default: return 'text-soc-cyan bg-soc-cyan/10 border-soc-cyan/30';
    }
  };

  return (
    <div className="h-[calc(100vh-100px)] grid grid-cols-1 lg:grid-cols-4 gap-6">
      
      {/* Left Sidebar: Layer Status */}
      <div className="glass-panel rounded-xl flex flex-col overflow-hidden">
        <div className="p-4 border-b border-white/10 bg-black/40">
          <h2 className="font-syne font-bold text-soc-text flex items-center gap-2">
            <Activity className="w-5 h-5 text-soc-cyan" />
            Layer Health
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
      </div>

      {/* Center: Live Threat Feed & Chart */}
      <div className="lg:col-span-2 flex flex-col gap-6">
        {/* Real-time Chart */}
        <div className="glass-panel rounded-xl p-4 h-48 flex flex-col">
          <h3 className="text-xs font-bold text-soc-muted uppercase tracking-widest mb-2">Events Per Second</h3>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="time" stroke="#8b949e" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#8b949e" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.9)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px' }}
                  itemStyle={{ fontSize: '12px', fontFamily: 'DM Mono', color: '#00e5c0' }}
                />
                <Line type="monotone" dataKey="eps" stroke="#00e5c0" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Threat Feed */}
        <div className="glass-panel rounded-xl flex-1 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-white/10 bg-black/40 flex justify-between items-center">
            <h2 className="font-syne font-bold text-soc-text flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-soc-red" />
              Live Threat Feed
            </h2>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-soc-red opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-soc-red"></span>
              </span>
              <span className="text-xs font-mono text-soc-red">LIVE</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <AnimatePresence initial={false}>
              {threats.map((threat: any) => (
                <motion.div
                  key={threat.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-3 rounded-lg border border-white/5 bg-black/40 flex flex-col gap-2"
                >
                  <div className="flex justify-between items-start">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${getSeverityColor(threat.severity)}`}>
                      {threat.severity}
                    </span>
                    <span className="text-[10px] text-soc-muted font-mono">
                      {new Date(threat.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="text-sm font-bold text-soc-text">{threat.type}</div>
                  <div className="text-xs text-soc-muted">{threat.description}</div>
                  <div className="text-xs font-mono text-soc-cyan bg-soc-cyan/5 px-2 py-1 rounded w-fit border border-soc-cyan/10">
                    SRC: {threat.source_ip}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Right Panel: Attack Memory */}
      <div className="glass-panel rounded-xl flex flex-col overflow-hidden">
        <div className="p-4 border-b border-white/10 bg-black/40">
          <h2 className="font-syne font-bold text-soc-text flex items-center gap-2">
            <Brain className="w-5 h-5 text-soc-purple" />
            Attack Memory
          </h2>
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
      </div>

    </div>
  );
}
