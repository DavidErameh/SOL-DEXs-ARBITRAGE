"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Opportunity } from "@/lib/types";
import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { OpportunityDetailModal } from "./OpportunityDetailModal";

const mockOpportunities: Opportunity[] = [
  { 
    id: "1", 
    type: 'spatial', 
    pair: 'SOL/USDC', 
    route: 'RAY→ORCA', 
    profit: 0.87, 
    size: 12.4, 
    confidence: 92, 
    timestamp: Date.now() 
  },
  { 
    id: "2", 
    type: 'statistical', 
    pair: 'SOL/USDT', 
    route: 'Z:-2.3σ LONG', 
    profit: 0.45, 
    size: 8.7, 
    confidence: 78, 
    timestamp: Date.now() 
  },
  { 
    id: "3", 
    type: 'triangular', 
    pair: 'SOL/BONK/USDC', 
    route: 'S→U→B', 
    profit: 0.34, 
    size: 15.2, 
    confidence: 65, 
    timestamp: Date.now() 
  },
  { 
    id: "4", 
    type: 'spatial', 
    pair: 'JUP/SOL', 
    route: 'ORCA→MET', 
    profit: -0.12, 
    size: 500, 
    confidence: 45, 
    timestamp: Date.now() 
  }
];

export function OpportunitiesTable() {
  const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleRowClick = (opp: Opportunity) => {
    setSelectedOpp(opp);
    setModalOpen(true);
  };

  const getBadgeColor = (type: Opportunity['type']) => {
    switch (type) {
      case 'spatial': return "bg-green-500/15 text-green-500 hover:bg-green-500/25 border-green-500/50";
      case 'statistical': return "bg-blue-500/15 text-blue-500 hover:bg-blue-500/25 border-blue-500/50";
      case 'triangular': return "bg-purple-500/15 text-purple-500 hover:bg-purple-500/25 border-purple-500/50";
      default: return "bg-zinc-500/15 text-zinc-500";
    }
  };

  const getProfitColor = (profit: number) => {
    if (profit >= 0.5) return "text-green-500";
    if (profit > 0) return "text-emerald-400"; // Light green for small profit
    return "text-red-500";
  };

  return (
    <>
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-muted/40 flex items-center justify-between">
           <h3 className="font-semibold tracking-tight">Active Opportunities</h3>
           <Badge variant="outline" className="font-mono text-xs">
             {mockOpportunities.length} DETECTED
           </Badge>
        </div>
        <Table>
          <TableHeader className="bg-muted/20">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[100px]">TYPE</TableHead>
              <TableHead>PAIR</TableHead>
              <TableHead>ROUTE</TableHead>
              <TableHead className="text-right">PROP. PROFIT</TableHead>
              <TableHead className="text-right">SIZE</TableHead>
              <TableHead className="text-right">CONF</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockOpportunities.map((opp) => (
              <TableRow 
                key={opp.id} 
                className="cursor-pointer hover:bg-muted/50 transition-colors group"
                onClick={() => handleRowClick(opp)}
              >
                <TableCell>
                  <Badge variant="outline" className={cn("uppercase text-[10px] h-5 px-1.5", getBadgeColor(opp.type))}>
                    {opp.type}
                  </Badge>
                </TableCell>
                <TableCell className="font-medium font-mono text-xs">{opp.pair}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{opp.route}</TableCell>
                <TableCell className={cn("text-right font-mono font-bold", getProfitColor(opp.profit))}>
                  {opp.profit > 0 ? "+" : ""}{opp.profit.toFixed(2)}%
                </TableCell>
                <TableCell className="text-right font-mono text-xs">
                  {opp.size.toLocaleString()}
                </TableCell>
                <TableCell className="text-right font-mono text-xs text-muted-foreground">
                  {opp.confidence}%
                </TableCell>
                <TableCell>
                  <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <OpportunityDetailModal 
        opportunity={selectedOpp} 
        open={modalOpen} 
        onOpenChange={setModalOpen} 
      />
    </>
  );
}
