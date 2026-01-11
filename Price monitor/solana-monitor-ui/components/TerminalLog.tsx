"use client";

import React, { useEffect, useRef, useState } from 'react';
import { LogEntry } from '@/types/events';
import { cn, formatTimestamp } from '@/lib/utils';
import { Zap, AlertCircle, Info, ShieldCheck } from 'lucide-react';

interface TerminalLogProps {
  logs: LogEntry[];
  className?: string;
}

const ALLOWED_EVENTS = [
  'OPPORTUNITY',
  'ERROR',
  'WARNING',
  'CONNECTION_STATE'
];

export function TerminalLog({ logs, className }: TerminalLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isAutoScroll, setIsAutoScroll] = useState(true);

  // Filter logs to remove spam (PRD v2.5 high-fidelity filter)
  const filteredLogs = logs.filter(log => ALLOWED_EVENTS.includes(log.type));

  useEffect(() => {
    if (isAutoScroll && scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [filteredLogs, isAutoScroll]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const isAtBottom = Math.abs(el.scrollHeight - el.clientHeight - el.scrollTop) < 10;
    setIsAutoScroll(isAtBottom);
  };

  const OpportunityCard = ({ log }: { log: LogEntry }) => {
    // Attempt to parse structured data if available, otherwise use defaults
    const details = log.details || {};
    
    return (
      <div className="mb-6 mx-6 border border-primary/40 bg-primary/5 p-4 rounded-sm relative overflow-hidden group shadow-[0_0_15px_rgba(0,255,65,0.05)] animate-in fade-in slide-in-from-right-4">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-primary/20 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-primary font-pixel text-xs tracking-[0.2em] uppercase">Arbitrage_Detected</span>
          </div>
          <span className="text-dim/50 font-mono text-[9px]">{formatTimestamp(log.timestamp)}</span>
        </div>

        {/* High-Fidelity Details (The "Money Number" Layout) */}
        <div className="space-y-3 font-mono">
            <div className="flex justify-between text-[11px]">
                <span className="text-dim/50 uppercase">Asset_Pair</span>
                <span className="text-white font-bold">{details.pair || 'SOL/USDC'}</span>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-void/50 p-2 border border-border-subtle/30">
                    <div className="text-[9px] text-dim/50 uppercase mb-1">Buy_Zone</div>
                    <div className="text-[12px] text-primary">{details.buyDex || 'Raydium'}</div>
                    <div className="text-[14px] text-white font-bold">${(details.buyPrice || 0).toFixed(4)}</div>
                </div>
                <div className="bg-void/50 p-2 border border-border-subtle/30 text-right">
                    <div className="text-[9px] text-dim/50 uppercase mb-1">Sell_Zone</div>
                    <div className="text-[12px] text-primary">{details.sellDex || 'Orca'}</div>
                    <div className="text-[14px] text-white font-bold">${(details.sellPrice || 0).toFixed(4)}</div>
                </div>
            </div>

            <div className="flex items-center gap-4 py-2">
                <div className="flex-1 border-t border-border-subtle/20" />
                <div className="text-dim font-bold text-[10px] uppercase tracking-widest px-2">Performance_Matrix</div>
                <div className="flex-1 border-t border-border-subtle/20" />
            </div>

            <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-[11px]">
               <div className="flex justify-between">
                  <span className="text-dim/50">Gross_Yield</span>
                  <span className="text-primary">+{details.grossSpread?.toFixed(2) || '0.45'}%</span>
               </div>
               <div className="flex justify-between">
                  <span className="text-dim/50">Confidence</span>
                  <span className="text-white">{details.confidence?.toFixed(0) || '85'}%</span>
               </div>
               <div className="flex justify-between col-span-2 mt-2 pt-2 border-t border-primary/20 bg-primary/5 px-2 py-1">
                  <span className="text-white font-bold tracking-tighter uppercase">Net_Profit (EST)</span>
                  <span className="text-primary font-bold text-[16px] text-glow-strong">+{details.netProfit?.toFixed(2) || '0.18'}%</span>
               </div>
            </div>
        </div>

        {/* Scanning Artifacts */}
        <div className="absolute top-0 right-0 p-2 opacity-10">
            <ShieldCheck size={40} className="text-primary" />
        </div>
      </div>
    );
  };

  const LogItem = ({ log }: { log: LogEntry }) => {
    const colorMap: Record<string, string> = {
      'ERROR': 'text-loss-red font-bold',
      'WARNING': 'text-alert-amber font-bold',
      'CONNECTION_STATE': 'text-white italic tracking-wider'
    };

    if (log.type === 'OPPORTUNITY') {
        return <OpportunityCard log={log} />;
    }

    return (
      <div className="font-mono text-[12px] py-1.5 px-6 flex gap-3 group items-start transition-opacity hover:bg-white/[0.02]">
        <span className="text-dim/30 shrink-0 text-[10px] pt-[1px]">[{formatTimestamp(log.timestamp)}]</span>
        <span className={cn("shrink-0 uppercase tracking-tighter text-[10px] font-bold pt-[1px] w-[120px] border-r border-border-subtle/20 mr-2", colorMap[log.type] || 'text-dim/70')}>
          {log.type}
        </span>
        <span className={cn("break-all leading-tight", colorMap[log.type] || 'text-white/80')}>
          {log.message}
        </span>
      </div>
    );
  };

  return (
    <div className={cn("flex flex-col bg-surface h-full font-mono text-sm", className)}>
        {/* Header */}
        <div className="h-[40px] bg-grid/50 backdrop-blur-sm border-b border-border-subtle flex items-center px-6 w-full sticky top-0 z-20 justify-between">
            <span className="text-dim text-xl font-pixel uppercase tracking-widest font-bold whitespace-nowrap">TIMELINE_FLIGHT_LOG</span>
            <div className="flex gap-3 items-center min-w-[120px] justify-end pr-2">
                <span className="text-dim/70 text-[10px] font-bold tracking-[0.3em] whitespace-nowrap uppercase">Filter: Active</span>
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_5px_#00ff41] shrink-0"></div>
            </div>
        </div>

        {/* Log Viewer */}
        <div 
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto py-6 scrollbar-thin scroll-smooth"
        >
          {filteredLogs.reverse().map((log, i) => (
            <LogItem key={`${log.timestamp}-${i}`} log={log} />
          ))}
          {filteredLogs.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full opacity-10 grayscale">
                <div className="text-6xl mb-4 font-pixel">⚇</div>
                <div className="text-[11px] uppercase tracking-[0.8em]">Initializing Deep Stream</div>
            </div>
          )}
        </div>
    </div>
  );
}
