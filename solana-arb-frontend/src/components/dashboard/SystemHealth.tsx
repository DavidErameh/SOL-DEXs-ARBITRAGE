"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertTriangle, XCircle, Activity } from "lucide-react";

interface HealthItemProps {
  label: string;
  status: 'connected' | 'disconnected' | 'connecting' | 'optimal' | 'degraded' | 'offline' | 'active' | 'idle';
  message?: string;
}

function HealthItem({ label, status, message }: HealthItemProps) {
  const getIcon = () => {
    if (status === 'connected' || status === 'optimal' || status === 'active') 
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    if (status === 'connecting' || status === 'degraded' || status === 'idle') 
      return <Activity className="h-4 w-4 text-orange-500 animate-pulse" />;
    return <XCircle className="h-4 w-4 text-red-500" />;
  };

  const getStatusText = () => {
    if (status === 'connected' || status === 'optimal') return "Operational";
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <div className="flex items-center justify-between py-2 border-b last:border-0 border-border/50">
      <div className="flex items-center gap-2.5">
        {getIcon()}
        <span className="text-sm font-medium">{label}</span>
      </div>
      <div className="flex items-center gap-2">
         {message && <span className="text-xs text-muted-foreground hidden sm:inline-block">{message}</span>}
         <Badge variant="outline" className="font-mono text-[10px] h-5">
           {getStatusText()}
         </Badge>
      </div>
    </div>
  );
}

export function SystemHealth() {
  return (
    <Card className="h-full">
      <CardHeader className="p-4 pb-2 border-b bg-muted/20">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Activity className="h-4 w-4" />
            System Health
          </CardTitle>
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-1">
        <HealthItem label="WebSocket Feed" status="connected" message="12ms latency" />
        <HealthItem label="Price Engine" status="optimal" message="Processing" />
        <HealthItem label="Arb Detector" status="active" message="Scanning 3 paths" />
        <HealthItem label="Mempool Cache" status="optimal" message="99.8% hit rate" />
      </CardContent>
    </Card>
  );
}
