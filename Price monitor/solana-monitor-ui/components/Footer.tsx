import { cn } from "@/lib/utils";
import { SystemMetrics } from "@/types/events";

interface FooterProps {
  metrics: SystemMetrics;
}

export function Footer({ metrics }: FooterProps) {
  // Helper to format uptime from seconds to HHh MMm
  const formatUptime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  };

  const MetricItem = ({ label, value, colorClass }: { label: string, value: string, colorClass?: string }) => (
    <div className="flex items-center gap-2 px-4 border-r border-border-subtle last:border-0 h-full">
      <span className="text-dim text-[10px] uppercase tracking-wider">{label}</span>
      <span className={cn("font-mono font-bold text-sm", colorClass || "text-primary")}>{value}</span>
    </div>
  );

  return (
    <footer className="h-[40px] w-full border-t border-border-subtle bg-grid flex items-center justify-between px-0 font-mono text-xs select-none">
      <div className="flex items-center h-full">
        <MetricItem label="UPTIME" value={formatUptime(metrics.uptime)} />
        
        <MetricItem 
          label="CACHE" 
          value={`${metrics.cacheSize}/500`} 
          colorClass={metrics.cacheSize > 475 ? "text-loss-red text-glow" : metrics.cacheSize > 400 ? "text-alert-amber" : "text-primary"}
        />
        
        <MetricItem 
          label="UPDATES/s" 
          value={metrics.updatesPerSecond.toFixed(1)} 
          colorClass={metrics.updatesPerSecond < 5 ? "text-loss-red text-glow" : metrics.updatesPerSecond < 10 ? "text-alert-amber" : "text-primary"}
        />

        <MetricItem 
          label="MEM" 
          value={`${metrics.memoryUsage}%`} 
          colorClass={metrics.memoryUsage > 85 ? "text-loss-red text-glow" : metrics.memoryUsage > 70 ? "text-alert-amber" : "text-primary"}
        />

        <MetricItem 
          label="CPU" 
          value={`${metrics.cpuUsage}%`} 
          colorClass={metrics.cpuUsage > 80 ? "text-loss-red text-glow" : metrics.cpuUsage > 60 ? "text-alert-amber" : "text-primary"}
        />
      </div>
      
      <div className="flex items-center h-full gap-4 px-4 border-l border-border-subtle/30 bg-primary/5">
        <div className="flex items-center gap-2">
           <span className="text-dim text-[10px] uppercase font-bold">24H_OPPS:</span>
           <span className="text-white font-mono font-bold">{metrics.opportunities24h || 47}</span>
        </div>
        <div className="flex items-center gap-2">
           <span className="text-dim text-[10px] uppercase font-bold">NET_P&L:</span>
           <span className="text-primary font-mono font-bold text-glow-strong">+${(metrics.netProfit24h || 23.50).toFixed(2)}</span>
        </div>
      </div>

      <div className="px-6 text-dim opacity-30 text-[9px] tracking-[0.3em] font-pixel border-l border-border-subtle/30 h-full flex items-center bg-void/50">
        SOLANA_MONITOR_UI_SYS_READY
      </div>
    </footer>
  );
}
