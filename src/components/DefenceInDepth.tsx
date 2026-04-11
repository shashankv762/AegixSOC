import React from 'react';
import { Shield, Server, Cpu, Database, Brain, Zap, LayoutDashboard } from 'lucide-react';

export default function DefenceInDepth() {
  return (
    <div className="glass-panel rounded-xl p-6 relative overflow-hidden flex flex-col h-full min-h-[400px]">
      <div className="flex justify-between items-center mb-6 z-10">
        <h3 className="font-syne font-bold text-soc-text flex items-center gap-2">
          <Shield className="w-5 h-5 text-soc-cyan" />
          Defence-in-Depth Architecture
        </h3>
        <div className="flex items-center gap-2 text-[10px] text-soc-muted font-mono bg-black/40 px-3 py-1.5 rounded-full border border-white/5">
          <div className="w-2 h-2 rounded-full bg-soc-green animate-pulse shadow-[0_0_8px_#10b981]"></div>
          ALL LAYERS ACTIVE
        </div>
      </div>
      
      <div className="flex-1 flex flex-col justify-end gap-3 relative z-10">
        {/* Data Flow Arrows Background */}
        <div className="absolute inset-0 flex justify-center items-center pointer-events-none opacity-20">
           <div className="w-px h-full bg-gradient-to-t from-soc-cyan via-soc-purple to-soc-green"></div>
        </div>

        {/* Layer 7: Visualization */}
        <LayerCard 
          title="7. Visualization Layer" 
          agent="Dashboard & Alert Agent" 
          icon={LayoutDashboard} 
          color="text-soc-green" 
          borderColor="border-soc-green/40" 
          bgColor="bg-soc-green/10" 
          glow="shadow-[0_0_15px_rgba(16,185,129,0.15)]"
        />
        
        {/* Layer 6: Response */}
        <LayerCard 
          title="6. Response Layer" 
          agent="Autonomous Response Agent" 
          icon={Zap} 
          color="text-soc-yellow" 
          borderColor="border-soc-yellow/40" 
          bgColor="bg-soc-yellow/10" 
          glow="shadow-[0_0_15px_rgba(255,179,71,0.15)]"
        />

        {/* Layer 5: AI Intelligence */}
        <LayerCard 
          title="5. AI Intelligence Layer" 
          agent="LLM + ML Detection Agent" 
          icon={Brain} 
          color="text-soc-red" 
          borderColor="border-soc-red/40" 
          bgColor="bg-soc-red/10" 
          glow="shadow-[0_0_15px_rgba(255,71,87,0.15)]"
        />

        {/* Layers 1-4: Collectors & Processors (Grid) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-2">
          <LayerCard 
            title="1. Perimeter" 
            agent="Network Agent" 
            icon={Shield} 
            color="text-soc-cyan" 
            borderColor="border-soc-cyan/40" 
            bgColor="bg-soc-cyan/10" 
            small
          />
          <LayerCard 
            title="2. Endpoint" 
            agent="System Agent" 
            icon={Server} 
            color="text-soc-cyan" 
            borderColor="border-soc-cyan/40" 
            bgColor="bg-soc-cyan/10" 
            small
          />
          <LayerCard 
            title="3. Application" 
            agent="Behavior Agent" 
            icon={Cpu} 
            color="text-soc-purple" 
            borderColor="border-soc-purple/40" 
            bgColor="bg-soc-purple/10" 
            small
          />
          <LayerCard 
            title="4. Data" 
            agent="Integrity Agent" 
            icon={Database} 
            color="text-soc-purple" 
            borderColor="border-soc-purple/40" 
            bgColor="bg-soc-purple/10" 
            small
          />
        </div>
      </div>

      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-soc-purple/5 via-transparent to-transparent opacity-50"></div>
      </div>
    </div>
  );
}

function LayerCard({ title, agent, icon: Icon, color, borderColor, bgColor, glow = '', small = false }: any) {
  return (
    <div className={`relative overflow-hidden border ${borderColor} ${bgColor} backdrop-blur-md rounded-lg p-3 flex items-center gap-4 transition-all duration-300 hover:brightness-125 hover:-translate-y-0.5 cursor-default group ${glow}`}>
      <div className={`p-2 rounded-md bg-black/40 ${color} border border-white/5`}>
        <Icon className={small ? "w-4 h-4" : "w-6 h-6"} />
      </div>
      <div>
        <div className={`font-bold font-syne text-soc-text ${small ? 'text-xs' : 'text-sm'}`}>{title}</div>
        <div className={`font-mono text-soc-muted ${small ? 'text-[9px]' : 'text-xs'}`}>{agent}</div>
      </div>
      {/* Scanning effect */}
      <div className="absolute top-0 left-[-100%] w-1/2 h-full bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:animate-[shimmer_1.5s_infinite] skew-x-12"></div>
    </div>
  );
}
