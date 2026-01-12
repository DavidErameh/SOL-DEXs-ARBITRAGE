"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { SystemLog } from "@/lib/types";
import { Terminal } from "lucide-react";

export function ActivityLog() {
  const [logs, setLogs] = useState<SystemLog[]>([
    { id: '1', time: '12:33:45', level: 'warning', message: 'WebSocket reconnected successfully' },
    { id: '2', time: '12:34:23', level: 'info', message: 'Price update: SOL/USDC Raydium $176.23' },
    { id: '3', time: '12:34:56', level: 'info', message: 'Opportunity detected: SOL/USDC +0.87%' },
    { id: '4', time: '12:35:10', level: 'info', message: 'Scanning specific pool: ORCA-SOL/USDC' },
    { id: '5', time: '12:35:12', level: 'error', message: 'Timeout fetching Meteora pool data' },
  ]);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-scroll to bottom on new log
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  // Simulate new logs
  useEffect(() => {
     const interval = setInterval(() => {
        const msgs = [
           "Price update: SOL/USDC Raydium $" + (176 + Math.random()).toFixed(2),
           "Scanning specific pool: ORCA-SOL/USDT",
           "Heartbeat received from backend"
        ];
        const newLog: SystemLog = {
           id: Date.now().toString(),
           time: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' }),
           level: 'info',
           message: msgs[Math.floor(Math.random() * msgs.length)]
        };
        setLogs(prev => [...prev.slice(-49), newLog]); // Keep last 50
     }, 3000);
     return () => clearInterval(interval);
  }, []);

  const getLevelColor = (level: SystemLog['level']) => {
    switch (level) {
      case 'info': return "text-zinc-400";
      case 'warning': return "text-orange-400";
      case 'error': return "text-red-400";
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="p-4 pb-2 border-b bg-muted/20">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Terminal className="h-4 w-4" />
            System Activity
          </CardTitle>
          <Badge variant="outline" className="font-mono text-[10px]">LIVE</Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0 flex-1 overflow-hidden relative">
        <div 
           ref={scrollRef}
           className="h-full overflow-y-auto p-4 space-y-1.5 font-mono text-xs"
        >
           {logs.map((log) => (
             <div key={log.id} className="flex gap-3">
               <span className="text-muted-foreground/50 shrink-0">{log.time}</span>
               <span className={cn(getLevelColor(log.level))}>
                 {log.level === 'error' && <span className="text-red-500 font-bold mr-1">[ERR]</span>}
                 {log.level === 'warning' && <span className="text-orange-500 font-bold mr-1">[WARN]</span>}
                 {log.message}
               </span>
             </div>
           ))}
        </div>
      </CardContent>
    </Card>
  );
}
