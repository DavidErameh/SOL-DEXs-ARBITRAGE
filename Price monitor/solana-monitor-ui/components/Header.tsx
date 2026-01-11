import React from 'react';
import { cn, formatLatency } from '@/lib/utils';
import { AppState, SystemMetrics } from '@/types/events';

interface HeaderProps {
  status: AppState['status'];
  metrics: SystemMetrics;
  opportunityCount: number;
}

export function Header({ status, metrics, opportunityCount }: HeaderProps) {
  const isOnline = status === 'online';
  
  const latencyColor = 
    metrics.latency < 200 ? 'text-primary' :
    metrics.latency < 400 ? 'text-alert-amber' : 'text-loss-red';

  return (
    <header className="flex items-center justify-between px-4 h-[60px] border-b border-border-subtle bg-grid select-none relative z-10">
      {/* Logo Area */}
      <div className="flex items-center gap-3">
        <h1 className="text-4xl font-pixel tracking-wide text-primary text-glow-strong mt-1">
          SOLANA MONITOR <span className="text-xl opacity-70 font-mono tracking-tighter">v2.5</span>
        </h1>
      </div>

      {/* Status Bar */}
      <div className="flex items-center gap-8 header-status-bar font-mono text-sm tracking-tight text-dim">
        
        {/* Connection Status */}
        <div className="flex items-center gap-3 metric-item">
          <span className="text-xs uppercase tracking-widest text-dim/70 font-bold">STATUS:</span>
          <div className={cn(
            "flex items-center gap-2",
            isOnline ? "text-primary text-glow" : "text-loss-red text-glow"
          )}>
            <span className={cn(
              "w-3 h-3 block",
              isOnline ? "bg-primary animate-pulse shadow-[0_0_8px_#00ff41]" : "bg-loss-red"
            )} />
            <span className="font-bold tracking-wider">{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
          </div>
        </div>

        {/* Opportunity Count */}
        <div className="flex items-center gap-3 metric-item">
          <span className="uppercase text-xs tracking-widest text-dim/70 font-bold">OPPORTUNITIES:</span>
          <span className="text-primary text-glow font-bold tracking-wider">{opportunityCount}</span>
        </div>

        {/* Latency */}
        <div className="flex items-center gap-3 metric-item">
          <span className="uppercase text-xs tracking-widest text-dim/70 font-bold">LATENCY:</span>
          <span className={cn("font-bold min-w-[60px] tracking-wider", latencyColor)}>
             {formatLatency(metrics.latency)}
          </span>
        </div>

      </div>
    </header>
  );
}
