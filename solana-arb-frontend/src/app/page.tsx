"use client";

import { Header } from "@/components/dashboard/Header";
import { OpportunitiesTable } from "@/components/dashboard/OpportunitiesTable";
import { PriceCard } from "@/components/dashboard/PriceCard";
import { PriceChart } from "@/components/dashboard/PriceChart";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { SystemHealth } from "@/components/dashboard/SystemHealth";
import { ActivityLog } from "@/components/dashboard/ActivityLog";
import { useWebSocket } from "@/lib/hooks/useWebSocket";

export default function Home() {
  useWebSocket(); // Initialize WebSocket connection

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container py-6 space-y-6 px-4 sm:px-8">
        {/* Main Grid: 12 Columns */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 h-full">
          
          {/* Left Panel: Opportunities & Prices (7 cols on XL) */}
          <div className="xl:col-span-7 space-y-6">
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold tracking-tight">Active Opportunities</h2>
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              </div>
              <OpportunitiesTable />
            </section>

            <section className="space-y-4">
              <h2 className="text-lg font-semibold tracking-tight">Real-time Pricing</h2>
              <div className="h-[350px]">
                <PriceCard />
              </div>
              
              <div className="mt-6">
                <PriceChart />
              </div>
            </section>
          </div>

          {/* Right Panel: Metrics & Health (5 cols on XL) */}
          <div className="xl:col-span-5 space-y-6">
             <div className="grid grid-cols-2 gap-4">
               <MetricCard 
                 title="Est. Network Latency" 
                 value="18ms" 
                 subtext="Regional: us-east" 
                 status="normal" 
               />
               <MetricCard 
                 title="Update Frequency" 
                 value="84/sec" 
                 subtext="High congestion" 
                 status="warning" 
               />
             </div>

             <div className="h-[250px]">
                <ActivityLog />
             </div>

             <div className="h-[200px]">
                <SystemHealth />
             </div>
          </div>

        </div>
      </main>
    </div>
  );
}
