import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { CloudRain, CloudLightning, Sun, Wind } from 'lucide-react';

interface Node extends d3.SimulationNodeDatum {
  id: string;
  type: string;
  severity: number;
}

interface Link extends d3.SimulationLinkDatum<Node> {
  source: string;
  target: string;
}

export default function ThreatWeather() {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const width = 800;
    const height = 400;

    const nodes: Node[] = [
      { id: 'Gateway', type: 'router', severity: 0 },
      { id: 'WebSrv', type: 'server', severity: 2 },
      { id: 'DBSrv', type: 'server', severity: 1 },
      { id: 'AppSrv', type: 'server', severity: 5 },
      { id: 'User1', type: 'workstation', severity: 0 },
      { id: 'User2', type: 'workstation', severity: 8 },
      { id: 'User3', type: 'workstation', severity: 3 },
    ];

    const links: Link[] = [
      { source: 'Gateway', target: 'WebSrv' },
      { source: 'Gateway', target: 'AppSrv' },
      { source: 'AppSrv', target: 'DBSrv' },
      { source: 'Gateway', target: 'User1' },
      { source: 'Gateway', target: 'User2' },
      { source: 'Gateway', target: 'User3' },
    ];

    const svg = d3.select(svgRef.current)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .style('background', 'transparent');

    svg.selectAll('*').remove();

    const simulation = d3.forceSimulation<Node>(nodes)
      .force('link', d3.forceLink<Node, Link>(links).id(d => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2));

    const link = svg.append('g')
      .attr('stroke', 'rgba(255,255,255,0.1)')
      .attr('stroke-width', 1)
      .selectAll('line')
      .data(links)
      .enter().append('line');

    const node = svg.append('g')
      .selectAll('g')
      .data(nodes)
      .enter().append('g')
      .call(d3.drag<SVGGElement, Node>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended));

    node.append('circle')
      .attr('r', 12)
      .attr('fill', d => {
        if (d.severity > 7) return '#ff4757';
        if (d.severity > 4) return '#ffa502';
        return '#2f3542';
      })
      .attr('stroke', d => {
        if (d.severity > 7) return 'rgba(255, 71, 87, 0.5)';
        if (d.severity > 4) return 'rgba(255, 165, 2, 0.5)';
        return 'rgba(255,255,255,0.1)';
      })
      .attr('stroke-width', 4);

    node.append('text')
      .text(d => d.id)
      .attr('x', 15)
      .attr('y', 5)
      .attr('fill', 'rgba(255,255,255,0.6)')
      .style('font-size', '10px')
      .style('font-family', 'JetBrains Mono');

    // Add "Storm Clouds" for high severity
    node.filter(d => d.severity > 5)
      .append('path')
      .attr('d', 'M-10,-10 Q-15,-20 -5,-25 Q5,-30 15,-25 Q25,-20 20,-10 Z')
      .attr('fill', 'rgba(255,255,255,0.1)')
      .attr('class', 'animate-pulse');

    simulation.on('tick', () => {
      link
        .attr('x1', d => (d.source as any).x)
        .attr('y1', d => (d.source as any).y)
        .attr('x2', d => (d.target as any).x)
        .attr('y2', d => (d.target as any).y);

      node
        .attr('transform', d => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return () => {
      simulation.stop();
    };
  }, []);

  return (
    <div className="glass-panel rounded-xl p-6 relative overflow-hidden">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-syne font-bold text-soc-text flex items-center gap-2">
          <Wind className="w-5 h-5 text-soc-cyan" />
          Threat Weather Map
        </h3>
        <div className="flex gap-4">
          <div className="flex items-center gap-2 text-[10px] text-soc-muted font-mono">
            <Sun className="w-3 h-3 text-soc-green" /> CALM
          </div>
          <div className="flex items-center gap-2 text-[10px] text-soc-muted font-mono">
            <CloudRain className="w-3 h-3 text-soc-yellow" /> STORMY
          </div>
          <div className="flex items-center gap-2 text-[10px] text-soc-muted font-mono">
            <CloudLightning className="w-3 h-3 text-soc-red" /> CRITICAL
          </div>
        </div>
      </div>
      
      <div className="relative border border-white/5 rounded-lg bg-black/20">
        <svg ref={svgRef} className="w-full h-[400px]" />
        
        {/* Weather Overlay Effects */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-soc-red/5 to-transparent opacity-20 animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}
