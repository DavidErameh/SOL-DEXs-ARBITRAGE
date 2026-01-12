"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Opportunity } from "@/lib/types";
import { ArrowRight, Copy, ExternalLink, Timer, Zap } from "lucide-react";

interface OpportunityDetailModalProps {
  opportunity: Opportunity | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OpportunityDetailModal({ opportunity, open, onOpenChange }: OpportunityDetailModalProps) {
  if (!opportunity) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-card border-zinc-800">
        <DialogHeader>
          <div className="flex items-center justify-between pr-8">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono">{opportunity.type.toUpperCase()}</Badge>
              <span className="text-xs text-muted-foreground font-mono">{opportunity.id}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
               <Timer className="h-3 w-3" />
               <span className="font-mono">Detected 120ms ago</span>
            </div>
          </div>
          <DialogTitle className="text-xl font-bold flex items-center gap-2 pt-2">
            {opportunity.pair} Arbitrage <span className="text-green-500 text-lg font-mono">+{opportunity.profit}%</span>
          </DialogTitle>
          <DialogDescription className="font-mono text-xs">
            Route: {opportunity.route}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
           {/* Visual Route */}
           <div className="rounded-lg bg-muted/30 p-4 border border-zinc-800/50">
             <div className="flex items-center justify-between text-sm font-medium mb-3">
               <span>Execution Path</span>
               <span className="text-xs text-muted-foreground font-mono">Slot: 245,678,905</span>
             </div>
             <div className="flex items-center gap-2 font-mono text-xs overflow-x-auto pb-2">
                <div className="px-3 py-1.5 rounded bg-zinc-900 border border-zinc-700 flex flex-col items-center min-w-[80px]">
                  <span className="text-muted-foreground text-[10px] uppercase">Input</span>
                  <span className="font-bold">SOL</span>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <div className="px-3 py-1.5 rounded bg-blue-900/20 border border-blue-500/30 flex flex-col items-center min-w-[80px]">
                  <span className="text-blue-400 text-[10px] uppercase">Raydium</span>
                  <span className="font-bold">USDC</span>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <div className="px-3 py-1.5 rounded bg-purple-900/20 border border-purple-500/30 flex flex-col items-center min-w-[80px]">
                  <span className="text-purple-400 text-[10px] uppercase">Orca</span>
                  <span className="font-bold">SOL</span>
                </div>
             </div>
           </div>

           {/* Profit Breakdown */}
           <div className="grid grid-cols-2 gap-4">
             <div className="space-y-4">
               <h4 className="text-sm font-semibold flex items-center gap-2">
                 <Zap className="h-4 w-4 text-yellow-500" />
                 Net Profit Analysis
               </h4>
               <div className="space-y-2 text-sm">
                 <div className="flex justify-between">
                   <span className="text-muted-foreground">Gross Profit</span>
                   <span className="font-mono text-green-500">+{(opportunity.size * opportunity.profit / 100).toFixed(4)} SOL</span>
                 </div>
                 <div className="flex justify-between">
                   <span className="text-muted-foreground">Gas Fees (Est.)</span>
                   <span className="font-mono text-red-400">-0.000005 SOL</span>
                 </div>
                 <div className="flex justify-between">
                   <span className="text-muted-foreground">DEX Fees</span>
                   <span className="font-mono text-red-400">-0.30%</span>
                 </div>
                 <div className="h-px bg-border my-2" />
                 <div className="flex justify-between font-bold">
                   <span>Net Expected</span>
                   <span className="font-mono text-green-400">+{(opportunity.size * opportunity.profit / 100 * 0.999).toFixed(4)} SOL</span>
                 </div>
               </div>
             </div>

             <div className="space-y-4">
               <h4 className="text-sm font-semibold">Risk Metrics</h4>
               <div className="space-y-2 text-sm">
                 <div className="flex justify-between">
                   <span className="text-muted-foreground">Confidence Score</span>
                   <span className="font-mono text-white">{opportunity.confidence}/100</span>
                 </div>
                 <div className="flex justify-between">
                   <span className="text-muted-foreground">Price Impact</span>
                   <span className="font-mono text-white">0.05%</span>
                 </div>
                 <div className="flex justify-between">
                   <span className="text-muted-foreground">Slippage Tolerance</span>
                   <span className="font-mono text-white">0.5%</span>
                 </div>
               </div>
             </div>
           </div>
        </div>

        <DialogFooter className="flex sm:justify-between gap-2">
           <Button variant="outline" size="sm" className="gap-2">
             <Copy className="h-3.5 w-3.5" />
             Copy Params
           </Button>
           <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => onOpenChange(false)}>
                Dismiss
              </Button>
              <Button size="sm" className="gap-2 bg-green-600 hover:bg-green-700 text-white">
                <ExternalLink className="h-3.5 w-3.5" />
                Execute via Jito
              </Button>
           </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
