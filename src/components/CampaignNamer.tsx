import React from 'react';
import { Flag, Info } from 'lucide-react';

interface CampaignProps {
  campaign: {
    name: string;
    backstory: string;
  };
}

export default function CampaignNamer({ campaign }: CampaignProps) {
  return (
    <div className="glass-panel rounded-xl p-6 relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
        <Flag className="w-12 h-12 text-soc-cyan" />
      </div>
      
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-soc-cyan/20 text-soc-cyan">
          <Flag className="w-5 h-5" />
        </div>
        <h3 className="font-syne font-bold text-soc-text">Active Campaign</h3>
      </div>

      <div className="space-y-4">
        <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-soc-cyan to-soc-purple font-syne">
          {campaign.name}
        </div>
        
        <div className="flex gap-3 p-3 rounded-lg bg-black/40 border border-white/5">
          <Info className="w-4 h-4 text-soc-muted shrink-0 mt-0.5" />
          <p className="text-xs text-soc-muted leading-relaxed">
            {campaign.backstory}
          </p>
        </div>
      </div>
    </div>
  );
}
