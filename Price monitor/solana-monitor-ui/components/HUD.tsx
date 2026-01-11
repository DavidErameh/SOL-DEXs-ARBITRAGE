import { Wifi, WifiOff, Activity, Layers, DollarSign } from 'lucide-react';
import { SystemMetrics } from '../hooks/useWebSocket';

interface HUDProps {
  connected: boolean;
  metrics: SystemMetrics['data'] | null;
  poolCount: number;
}

export default function HUD({ connected, metrics, poolCount }: HUDProps) {
  return (
    <div className="w-full bg-terminal border-b border-terminal-dim p-4 flex items-center justify-between sticky top-0 z-50">
      {/* Left: Status */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          {connected ? (
            <Wifi className="w-5 h-5 text-terminal-green animate-pulse" />
          ) : (
            <WifiOff className="w-5 h-5 text-terminal-red" />
          )}
          <span className={`font-bold text-sm ${connected ? 'text-terminal-green' : 'text-terminal-red'}`}>
            {connected ? 'SYSTEM ONLINE' : 'DISCONNECTED'}
          </span>
        </div>
        <div className="h-4 w-[1px] bg-terminal-dim"></div>
        <span className="text-terminal-dim text-xs font-mono">SOL-HFT v1.0.0</span>
      </div>

      {/* Center: Metrics */}
      <div className="flex items-center gap-8">
        <div className="flex flex-col items-center">
            <span className="text-terminal-dim text-[10px] uppercase">Latency</span>
            <span className="text-white font-mono text-sm font-bold">
                {connected ? '< 400ms' : '--'}
            </span>
        </div>
        <div className="flex flex-col items-center">
            <span className="text-terminal-dim text-[10px] uppercase">FPS</span>
            <span className="text-white font-mono text-sm font-bold">
                {metrics?.fps || '--'}
            </span>
        </div>
        <div className="flex flex-col items-center">
            <span className="text-terminal-dim text-[10px] uppercase">Cache</span>
            <span className="text-white font-mono text-sm font-bold">
                {metrics?.cache_entries || 0}
            </span>
        </div>
      </div>

      {/* Right: Active Stats */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-terminal-dim" />
            <span className="text-terminal-dim text-xs uppercase">Active Pools:</span>
            <span className="text-white font-mono font-bold">{poolCount}</span>
        </div>
      </div>
    </div>
  );
}
