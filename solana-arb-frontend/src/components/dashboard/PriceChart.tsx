"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from "recharts";
import { Badge } from "@/components/ui/badge";

// Generate mock data: 60 points (1 hour)
const generateData = () => {
  const data = [];
  let basePrice = 176.20;
  
  for (let i = 0; i < 60; i++) {
    const time = new Date(Date.now() - (60 - i) * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Simulate price movement
    const volatility = 0.05;
    basePrice += (Math.random() - 0.5) * volatility;
    
    data.push({
      time,
      raydium: basePrice + (Math.random() - 0.5) * 0.02,
      orca: basePrice + (Math.random() - 0.5) * 0.03,
      meteora: basePrice + (Math.random() - 0.5) * 0.04,
    });
  }
  return data;
};

const data = generateData();

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-background/95 p-3 shadow-xl backdrop-blur-sm ring-1 ring-border text-xs">
        <div className="mb-2 font-mono font-medium text-muted-foreground">{label}</div>
        <div className="space-y-1">
          {payload.map((entry: any) => (
            <div key={entry.name} className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="font-medium capitalize text-muted-foreground w-16">{entry.name}:</span>
              <span className="font-mono font-bold">${entry.value.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export function PriceChart() {
  return (
    <div className="rounded-xl border bg-card shadow-sm h-[320px] flex flex-col">
       <div className="p-4 border-b bg-muted/20 flex items-center justify-between">
         <h3 className="font-semibold tracking-tight text-sm">Price History (1H)</h3>
         <div className="flex gap-2">
           <div className="flex items-center gap-1.5">
             <div className="w-2 h-2 rounded-full bg-green-500" />
             <span className="text-[10px] text-muted-foreground">Raydium</span>
           </div>
           <div className="flex items-center gap-1.5">
             <div className="w-2 h-2 rounded-full bg-blue-500" />
             <span className="text-[10px] text-muted-foreground">Orca</span>
           </div>
           <div className="flex items-center gap-1.5">
             <div className="w-2 h-2 rounded-full bg-purple-500" />
             <span className="text-[10px] text-muted-foreground">Meteora</span>
           </div>
         </div>
       </div>
       <div className="flex-1 w-full p-2">
         <ResponsiveContainer width="100%" height="100%">
           <LineChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
             <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} vertical={false} />
             <XAxis 
               dataKey="time" 
               stroke="var(--muted-foreground)" 
               fontSize={10} 
               tickLine={false} 
               axisLine={false}
               minTickGap={30}
             />
             <YAxis 
               domain={['auto', 'auto']} 
               stroke="var(--muted-foreground)" 
               fontSize={10} 
               tickLine={false} 
               axisLine={false}
               tickFormatter={(value) => `$${value.toFixed(2)}`}
               width={60}
             />
             <Tooltip content={<CustomTooltip />} />
             <Line 
               type="monotone" 
               dataKey="raydium" 
               stroke="#22c55e" 
               strokeWidth={1.5} 
               dot={false}
               activeDot={{ r: 4, strokeWidth: 0 }}
             />
             <Line 
               type="monotone" 
               dataKey="orca" 
               stroke="#3b82f6" 
               strokeWidth={1.5} 
               dot={false}
               activeDot={{ r: 4, strokeWidth: 0 }}
             />
             <Line 
               type="monotone" 
               dataKey="meteora" 
               stroke="#a855f7" 
               strokeWidth={1.5} 
               dot={false}
               activeDot={{ r: 4, strokeWidth: 0 }}
             />
           </LineChart>
         </ResponsiveContainer>
       </div>
    </div>
  );
}
