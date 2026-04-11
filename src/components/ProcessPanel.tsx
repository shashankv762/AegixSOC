import React, { useState, useMemo } from 'react';
import { usePolling } from '../hooks/usePolling';
import { api } from '../api/client';
import { Activity, AlertTriangle, Search, ArrowUpDown } from 'lucide-react';

export default function ProcessPanel() {
  const { data: processes, loading } = usePolling(() => api.getProcesses(), 3000);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<string>('cpu_percent');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [expandedPid, setExpandedPid] = useState<number | null>(null);

  const filteredAndSortedProcesses = useMemo(() => {
    if (!processes || !Array.isArray(processes)) return [];
    
    // Filter
    let result = processes.filter((proc: any) => {
      const term = searchTerm.toLowerCase();
      return (
        (proc.name && proc.name.toLowerCase().includes(term)) ||
        (proc.pid && proc.pid.toString().includes(term)) ||
        (proc.exe_path && proc.exe_path.toLowerCase().includes(term)) ||
        (proc.status && proc.status.toLowerCase().includes(term))
      );
    });

    // Sort
    result.sort((a: any, b: any) => {
      let valA = a[sortBy];
      let valB = b[sortBy];

      if (sortBy === 'is_suspicious') {
        valA = a.is_suspicious ? 1 : 0;
        valB = b.is_suspicious ? 1 : 0;
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [processes, searchTerm, sortBy, sortOrder]);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  if (loading && !processes) return <div className="p-8 text-center text-soc-muted">Loading processes...</div>;

  return (
    <div className="glass-panel rounded-2xl overflow-hidden flex flex-col h-full relative">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-soc-cyan to-soc-purple opacity-50"></div>
      <div className="p-6 border-b border-soc-border/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-soc-bg/30">
        <div className="flex items-center justify-between w-full sm:w-auto">
          <h3 className="font-bold flex items-center gap-2 text-soc-text font-syne">
            <Activity className="w-5 h-5 text-soc-purple" />
            System Processes
          </h3>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-72 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-soc-muted group-focus-within:text-soc-purple transition-colors" />
            <input
              type="text"
              placeholder="Search name, PID, or path..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-soc-surface/50 border border-soc-border/50 rounded-xl py-2.5 pl-11 pr-4 text-sm text-soc-text focus:outline-none focus:border-soc-purple/50 focus:ring-1 focus:ring-soc-purple/50 transition-all font-mono"
            />
          </div>
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-[10px] font-bold text-soc-muted uppercase tracking-widest">Status</span>
            <span className="text-xs text-soc-purple font-mono">LIVE MONITORING</span>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto overflow-y-auto flex-1 max-h-[500px]">
        <table className="w-full text-left text-sm">
          <thead className="bg-soc-bg/80 backdrop-blur-md text-soc-muted sticky top-0 z-10 border-b border-soc-border/50">
            <tr>
              <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px] cursor-pointer hover:text-soc-text transition-colors" onClick={() => handleSort('pid')}>
                <div className="flex items-center gap-1">PID <ArrowUpDown className="w-3 h-3 opacity-50" /></div>
              </th>
              <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px] cursor-pointer hover:text-soc-text transition-colors" onClick={() => handleSort('name')}>
                <div className="flex items-center gap-1">Name <ArrowUpDown className="w-3 h-3 opacity-50" /></div>
              </th>
              <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px] cursor-pointer hover:text-soc-text transition-colors" onClick={() => handleSort('cpu_percent')}>
                <div className="flex items-center gap-1">CPU % <ArrowUpDown className="w-3 h-3 opacity-50" /></div>
              </th>
              <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px] cursor-pointer hover:text-soc-text transition-colors" onClick={() => handleSort('memory_usage')}>
                <div className="flex items-center gap-1">Memory % <ArrowUpDown className="w-3 h-3 opacity-50" /></div>
              </th>
              <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px] cursor-pointer hover:text-soc-text transition-colors" onClick={() => handleSort('status')}>
                <div className="flex items-center gap-1">Status <ArrowUpDown className="w-3 h-3 opacity-50" /></div>
              </th>
              <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px] cursor-pointer hover:text-soc-text transition-colors" onClick={() => handleSort('exe_path')}>
                <div className="flex items-center gap-1">Path <ArrowUpDown className="w-3 h-3 opacity-50" /></div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-soc-border/30">
            {filteredAndSortedProcesses.map((proc: any) => (
              <React.Fragment key={proc.id}>
                <tr
                  onClick={() => setExpandedPid(expandedPid === proc.pid ? null : proc.pid)}
                  className={`transition-all hover:bg-soc-purple/5 group cursor-pointer ${
                    proc.is_suspicious ? 'bg-soc-red/5' : ''
                  } ${expandedPid === proc.pid ? 'bg-soc-purple/10' : ''}`}
                >
                  <td className="px-6 py-4 font-mono text-soc-cyan">{proc.pid}</td>
                  <td className="px-6 py-4 font-medium flex items-center gap-2">
                    {proc.name}
                    {proc.status && proc.status !== 'Running' && (
                      <span className="text-soc-muted text-xs font-normal">({proc.status})</span>
                    )}
                    {proc.is_suspicious && (
                      <AlertTriangle className="w-3 h-3 text-soc-red" />
                    )}
                  </td>
                  <td className={`px-6 py-4 ${(proc.cpu_percent || 0) > 50 ? 'text-soc-yellow' : 'text-soc-muted'}`}>
                    {(proc.cpu_percent || 0).toFixed(1)}%
                  </td>
                  <td className="px-6 py-4 text-soc-muted">
                    {(proc.memory_usage || 0).toFixed(1)}%
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-tight ${
                      proc.status === 'Running' ? 'border-soc-green/30 bg-soc-green/10 text-soc-green' : 'border-soc-muted/30 bg-soc-muted/10 text-soc-muted'
                    }`}>
                      {proc.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-soc-muted truncate max-w-[200px]" title={proc.exe_path}>
                    {proc.exe_path}
                  </td>
                </tr>
                {expandedPid === proc.pid && (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 bg-soc-bg/50 border-t border-soc-border/30">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-soc-muted text-xs uppercase tracking-widest mb-1">Executable Path</div>
                          <div className="font-mono text-soc-text break-all bg-black/30 p-2 rounded border border-soc-border/50">{proc.exe_path || 'N/A'}</div>
                        </div>
                        <div>
                          <div className="text-soc-muted text-xs uppercase tracking-widest mb-1">User Context</div>
                          <div className="font-mono text-soc-text bg-black/30 p-2 rounded border border-soc-border/50">{proc.user || 'N/A'}</div>
                        </div>
                        <div className="md:col-span-2">
                          <div className="text-soc-muted text-xs uppercase tracking-widest mb-1">Command Line Arguments</div>
                          <div className="font-mono text-soc-text break-all bg-black/30 p-2 rounded border border-soc-border/50 whitespace-pre-wrap">{proc.cmdline || 'N/A'}</div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
