'use client';

import React, { useState, memo } from 'react';
import { cn, formatLatency } from '@/lib/utils';
import { ArbitrageOpportunity } from '@/lib/calculateArbitrage';
import { ChevronRight, ChevronDown, CheckCircle2, AlertTriangle, ExternalLink, Zap } from 'lucide-react';

interface RowProps {
  opp: ArbitrageOpportunity;
}

const OpportunityRow = memo(({ opp }: RowProps) => {
  const [expanded, setExpanded] = useState(false);
  const isProfitable = opp.netProfit > 0.5;
  const isStale = opp.buyPriceAge > 2 || opp.sellPriceAge > 2;
  const maxLag = Math.max(opp.buyPriceAge, opp.sellPriceAge);

  return (
    <div className={cn(
      "border-b border-border-subtle/30 transition-all duration-200 relative overflow-hidden",
      isProfitable ? "bg-primary/[0.03]" : "opacity-40 hover:opacity-100"
    )}>
      {/* Selection Indicator */}
      {isProfitable && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary shadow-[0_0_10px_#00ff41]" />
      )}

      {/* Main Multi-Line Row */}
      <div 
        onClick={() => setExpanded(!expanded)}
        className="flex flex-col py-3 px-6 cursor-pointer hover:bg-primary/5 transition-colors group"
      >
        {/* Line 1: Header Info */}
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-3 w-[15%]">
            <span className="font-bold text-white text-[15px] tracking-wide">{opp.pair}</span>
            {isProfitable && <Zap className="w-3 h-3 text-primary animate-pulse" />}
          </div>
          
          <div className="w-[20%] flex items-center gap-2">
            <span className="text-[10px] text-dim font-bold uppercase w-12">{opp.buyDex}</span>
            <span className="text-white font-mono text-sm">${opp.buyPrice.toFixed(4)}</span>
          </div>

          <div className="w-[20%] flex items-center gap-2">
            <span className="text-[10px] text-dim font-bold uppercase w-12">{opp.sellDex}</span>
            <span className="text-white font-mono text-sm">${opp.sellPrice.toFixed(4)}</span>
          </div>

          <div className="w-[15%] text-center">
            <span className={cn(
              "text-[15px] font-bold tracking-tighter",
              isProfitable ? "text-primary text-glow" : "text-dim"
            )}>
              {opp.grossSpread > 0 ? '+' : ''}{opp.grossSpread.toFixed(2)}%
            </span>
          </div>

          <div className="w-[20%] flex justify-end items-center gap-2">
             <div className={cn(
               "px-1.5 py-0.5 rounded-[2px] text-[9px] font-bold tracking-tighter",
               maxLag > 2 ? "bg-loss-red/20 text-loss-red border border-loss-red/30" : 
               maxLag > 1 ? "bg-alert-amber/20 text-alert-amber border border-alert-amber/30" : 
               "bg-primary/20 text-primary border border-primary/30"
             )}>
                {maxLag.toFixed(1)}s LAG
             </div>
             {expanded ? <ChevronDown className="w-3.5 h-3.5 text-dim/50" /> : <ChevronRight className="w-3.5 h-3.5 text-dim/50" />}
          </div>
        </div>

        {/* Line 2: Liquidity & Detail Stubs */}
        <div className="flex items-center justify-between text-[11px] font-mono">
          <div className="w-[15%] text-dim/50 flex items-center gap-1 uppercase tracking-tighter">
             <span className={cn("w-1 h-1 rounded-full", opp.slotAligned ? "bg-primary" : "bg-loss-red")} />
             {opp.slotAligned ? "Slot Aligned" : "Slot Mismatch"}
          </div>

          <div className="w-[20%] text-dim flex items-center gap-2">
            <span className="opacity-40 leading-none">LIQ:</span>
            <span className="text-white/70">${(opp.buyLiquidity/1e3).toFixed(0)}K</span>
          </div>

          <div className="w-[20%] text-dim flex items-center gap-2">
            <span className="opacity-40 leading-none">LIQ:</span>
            <span className="text-white/70">${(opp.sellLiquidity/1e3).toFixed(0)}K</span>
          </div>

          <div className="w-[15%] text-center px-1">
             <div className="h-[2px] w-full bg-border-subtle/30 rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: `${Math.min(100, opp.confidence * 100)}%` }} />
             </div>
          </div>

          <div className="w-[20%] flex justify-end gap-3 italic">
            <div className="flex items-center gap-1">
               <span className="text-dim/40 not-italic">SIZE:</span>
               <span className="text-white/80">{opp.estimatedSize.toFixed(1)}</span>
            </div>
            <div className="flex items-center gap-1">
               <span className="text-dim/40 not-italic">NET:</span>
               <span className={cn("font-bold not-italic", isProfitable ? "text-primary text-glow-strong" : "text-dim")}>
                 {opp.netProfit > 0 ? '+' : ''}{opp.netProfit.toFixed(2)}%
               </span>
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Breakdown (Keep for deep-dive) */}
      {expanded && (
        <div className="px-6 py-6 bg-grid/30 border-t border-border-subtle/50 animate-in fade-in slide-in-from-top-2 duration-200">
           {/* Detailed Fee Breakdown (Same as before but cleaned up) */}
           <div className="grid grid-cols-3 gap-8">
            <div className="space-y-3">
              <h4 className="text-[10px] text-dim font-pixel uppercase tracking-widest border-b border-border-subtle/30 pb-1">Atomic Fees</h4>
              <div className="space-y-1 text-[12px] font-mono">
                <div className="flex justify-between">
                  <span className="text-dim/70 italic">Slippage (0.5%)</span>
                  <span className="text-loss-red">-{opp.feesBreakdown.slippage}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dim/70 italic">DEX Fees</span>
                  <span className="text-loss-red">-{opp.feesBreakdown.buyDexFee + opp.feesBreakdown.sellDexFee}%</span>
                </div>
                <div className="flex justify-between border-t border-border-subtle/30 pt-1 mt-1">
                  <span className="text-white font-bold">Total Cost</span>
                  <span className="text-loss-red font-bold">1.10%</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-[10px] text-dim font-pixel uppercase tracking-widest border-b border-border-subtle/30 pb-1">Protocol Validation</h4>
              <ul className="space-y-2 text-[12px] font-mono">
                <li className="flex items-center justify-between">
                  <span className="text-dim">Source Slot</span>
                  <span className="text-white">Aligned ✓</span>
                </li>
                <li className="flex items-center justify-between">
                   <span className="text-dim">Confidence</span>
                   <span className="text-primary">{(opp.confidence * 100).toFixed(0)}%</span>
                </li>
              </ul>
            </div>

            <div className="flex flex-col justify-end">
              <button disabled className="w-full py-2 bg-primary text-void text-[10px] font-pixel uppercase tracking-widest hover:brightness-125 transition-all flex items-center justify-center gap-2 group disabled:grayscale disabled:opacity-50">
                EXECUTE_SWAP_BLOCK
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

OpportunityRow.displayName = 'OpportunityRow';

export function ArbitrageScanner({ opportunities, className }: { opportunities: ArbitrageOpportunity[], className?: string }) {
  return (
    <div className={cn("flex flex-col bg-surface h-full overflow-hidden", className)}>
      {/* Table Header */}
      <div className="flex items-center px-6 h-[40px] border-b border-border-subtle bg-grid/30 text-[10px] font-pixel text-dim select-none sticky top-0 z-10 tracking-[0.3em] uppercase backdrop-blur-sm">
        <div className="w-[15%]">PAIR_ID</div>
        <div className="w-[20%]">BUY_PATH</div>
        <div className="w-[20%]">SELL_PATH</div>
        <div className="w-[15%] text-center">SPREAD</div>
        <div className="w-[20%] text-right pr-9">HEALTH_INDEX</div>
        <div className="w-[10%]"></div>
      </div>

      {/* Rows */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {opportunities.length > 0 ? (
          opportunities.map((opp) => (
            <OpportunityRow key={opp.pair} opp={opp} />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-4 opacity-20">
             <div className="w-32 h-32 border border-primary/20 rounded-full flex items-center justify-center animate-pulse">
                <Zap className="w-12 h-12 text-primary" />
             </div>
             <div className="text-[11px] font-pixel uppercase tracking-[0.5em] text-center">
                Initializing Global Scan Protocol...<br/>
                <span className="opacity-50 text-[9px]">Awaiting Market Inefficiency</span>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
