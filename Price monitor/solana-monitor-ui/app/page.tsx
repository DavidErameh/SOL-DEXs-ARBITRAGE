'use client';

import { Header } from '@/components/Header';
import { ArbitrageScanner } from '@/components/ArbitrageScanner';
import { TerminalLog } from '@/components/TerminalLog';
import { Footer } from '@/components/Footer';
import { ScanlineOverlay } from '@/components/ui/ScanlineOverlay';
import { usePriceStream } from '@/hooks/usePriceStream';

export default function Dashboard() {
  const { opportunities, logs, status, metrics } = usePriceStream();

  return (
    <div className="h-screen bg-void text-primary flex flex-col font-sans overflow-hidden relative selection:bg-primary selection:text-void">
      <ScanlineOverlay />
      {/* Header */}
      <Header status={status} metrics={metrics} opportunityCount={opportunities.length} />
      
      {/* Main Layout (PRD v2.5: 60/40 Split) */}
      <main className="flex-1 flex overflow-hidden w-full layout-spawn">
        {/* Left Panel: Arbitrage Scanner (60%) */}
        <section className="w-[60%] h-full overflow-hidden border border-border-subtle bg-surface box-border shadow-[0_0_15px_rgba(0,255,65,0.05)]">
          <ArbitrageScanner opportunities={opportunities} className="h-full" />
        </section>

        {/* Right Panel: Terminal Log (40%) */}
        <section className="w-[40%] h-full overflow-hidden relative border border-border-subtle bg-surface box-border shadow-[0_0_15px_rgba(0,255,65,0.05)]">
          <TerminalLog logs={logs} className="h-full" />
        </section>
      </main>
      
      {/* Footer */}
      <Footer metrics={metrics} />
    </div>
  );
}
