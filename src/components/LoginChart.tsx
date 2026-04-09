import React from 'react';
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { usePolling } from '../hooks/usePolling';
import { api } from '../api/client';

export default function LoginChart() {
  const { data: stats } = usePolling(() => api.getStats(), 30000);

  const chartData = Array.from({ length: 24 }, (_, i) => {
    const hourData = Array.isArray(stats?.timeline) ? stats.timeline.find((t: any) => t.hour === i) : null;
    return {
      name: `${i.toString().padStart(2, '0')}:00`,
      total: hourData?.count || 0,
      anomalies: Math.floor((hourData?.count || 0) * (Math.random() * 0.1)) // Mocking anomalies for visual line
    };
  });

  return (
    <div className="glass-panel rounded-xl p-6 h-[400px] flex flex-col relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-soc-cyan to-soc-purple opacity-50"></div>
      <h3 className="font-bold mb-6 text-soc-text font-syne">Login Activity — Last 24 Hours</h3>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis 
              dataKey="name" 
              stroke="#8b949e" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false}
              interval={3}
              fontFamily="DM Mono"
            />
            <YAxis 
              stroke="#8b949e" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false}
              fontFamily="DM Mono"
            />
            <Tooltip 
              contentStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.9)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px' }}
              itemStyle={{ fontSize: '12px', fontFamily: 'DM Mono' }}
            />
            <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px', fontFamily: 'DM Sans' }} />
            <Bar dataKey="total" name="Total Logins" fill="#00e5c0" radius={[4, 4, 0, 0]} barSize={20} />
            <Line dataKey="anomalies" name="Anomalies" stroke="#ff4757" strokeWidth={2} dot={{ r: 3, fill: '#ff4757' }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
