"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string;
  subtext?: string;
  trend?: "up" | "down" | "neutral";
  status?: "normal" | "warning" | "critical";
  className?: string;
}

export function MetricCard({ title, value, subtext, status = "normal", className }: MetricCardProps) {
  const getStatusColor = (s: string) => {
    switch (s) {
      case "normal": return "text-green-500";
      case "warning": return "text-orange-500";
      case "critical": return "text-red-500";
      default: return "text-foreground";
    }
  };

  return (
    <Card className={cn("flex flex-col justify-between", className)}>
      <CardHeader className="p-4 pb-0">
        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-1">
        <div className={cn("text-2xl font-mono font-bold tracking-tight", getStatusColor(status))}>
          {value}
        </div>
        {subtext && (
          <p className="text-xs text-muted-foreground mt-1">
            {subtext}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
