"use client";

import { Activity, Circle, Server, Wifi } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container flex h-14 items-center justify-between px-4 sm:px-8">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 font-bold tracking-tight">
            <Activity className="h-5 w-5 text-primary" />
            <span className="hidden sm:inline-block">SOL ARBITRAGE TERMINAL</span>
            <span className="sm:hidden">SAT</span>
          </div>
          <Badge variant="outline" className="ml-2 font-mono text-xs hidden md:flex">
            v1.0.0-beta
          </Badge>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
                Solana TPS
              </span>
              <span className="font-mono text-foreground font-bold">2,458</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
                Slot
              </span>
              <span className="font-mono text-foreground font-bold">245,678,901</span>
            </div>
          </div>

          <div className="h-4 w-px bg-border hidden md:block" />

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5" title="WebSocket Connection">
              <Wifi className="h-4 w-4 text-green-500" />
              <span className="text-xs font-medium hidden sm:inline-block text-green-500">
                Connected
              </span>
            </div>
            <div className="flex items-center gap-1.5" title="Backend Status">
              <Server className="h-4 w-4 text-green-500" />
              <span className="text-xs font-medium hidden sm:inline-block text-muted-foreground">
                Online
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
