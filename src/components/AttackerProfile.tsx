import React from 'react';
import { User, Shield, Zap, Target } from 'lucide-react';
import { motion } from 'motion/react';

interface ProfileProps {
  profile: {
    type: string;
    traits: string[];
    description: string;
  };
}

export default function AttackerProfile({ profile }: ProfileProps) {
  return (
    <div className="glass-panel rounded-xl p-6 border-l-4 border-soc-purple">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-soc-purple/20 text-soc-purple">
          <User className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-syne font-bold text-soc-text">Attacker Profile</h3>
          <p className="text-[10px] text-soc-muted font-mono uppercase tracking-widest">Psychological Analysis</p>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <div className="text-[10px] text-soc-muted uppercase font-bold mb-2 tracking-tighter">Classification</div>
          <div className="text-xl font-bold text-soc-purple font-syne">{profile.type}</div>
        </div>

        <div>
          <div className="text-[10px] text-soc-muted uppercase font-bold mb-3 tracking-tighter">Behavioral Traits</div>
          <div className="flex flex-wrap gap-2">
            {profile.traits.map((trait, i) => (
              <span key={i} className="px-2 py-1 rounded bg-soc-bg border border-soc-purple/30 text-soc-purple text-[10px] font-bold uppercase">
                {trait}
              </span>
            ))}
          </div>
        </div>

        <div>
          <div className="text-[10px] text-soc-muted uppercase font-bold mb-2 tracking-tighter">Summary</div>
          <p className="text-xs text-soc-text leading-relaxed italic">
            "{profile.description}"
          </p>
        </div>

        <div className="pt-4 border-t border-white/5 grid grid-cols-3 gap-2">
          <div className="text-center">
            <Zap className="w-4 h-4 text-soc-cyan mx-auto mb-1" />
            <div className="text-[8px] text-soc-muted uppercase">Skill</div>
            <div className="text-[10px] font-bold text-soc-text">HIGH</div>
          </div>
          <div className="text-center">
            <Target className="w-4 h-4 text-soc-red mx-auto mb-1" />
            <div className="text-[8px] text-soc-muted uppercase">Intent</div>
            <div className="text-[10px] font-bold text-soc-text">MALICIOUS</div>
          </div>
          <div className="text-center">
            <Shield className="w-4 h-4 text-soc-purple mx-auto mb-1" />
            <div className="text-[8px] text-soc-muted uppercase">Origin</div>
            <div className="text-[10px] font-bold text-soc-text">VPN/TOR</div>
          </div>
        </div>
      </div>
    </div>
  );
}
