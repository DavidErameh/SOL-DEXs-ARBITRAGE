"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { PriceUpdate } from "@/lib/types";
import { cn } from "@/lib/utils";

const mockPrices: Record<string, PriceUpdate[]> = {
  'SOL/USDC': [
    { dex: 'Raydium', price: 176.23, liquidity: 45200000, lastUpdate: 0.2 },
    { dex: 'Orca', price: 176.31, liquidity: 32800000, lastUpdate: 0.5 },
    { dex: 'Meteora', price: 176.19, liquidity: 18400000, lastUpdate: 1.2 }
  ],
  'SOL/USDT': [
    { dex: 'Raydium', price: 176.25, liquidity: 41200000, lastUpdate: 0.3 },
    { dex: 'Orca', price: 176.28, liquidity: 30100000, lastUpdate: 0.8 },
    { dex: 'Meteora', price: 176.22, liquidity: 15400000, lastUpdate: 1.5 }
  ],
  'BONK/SOL': [
    { dex: 'Raydium', price: 0.00001235, liquidity: 1200000, lastUpdate: 0.1 },
    { dex: 'Orca', price: 0.00001238, liquidity: 980000, lastUpdate: 0.4 },
    { dex: 'Meteora', price: 0.00001232, liquidity: 560000, lastUpdate: 1.1 }
  ]
};

export function PriceCard() {
  const [activeTab, setActiveTab] = useState('SOL/USDC');
  const [prices, setPrices] = useState(mockPrices);
  const [lastUpdatedDex, setLastUpdatedDex] = useState<string | null>(null);

  // Simulate price updates
  useEffect(() => {
    const interval = setInterval(() => {
      const pair = activeTab;
      const dexs = ['Raydium', 'Orca', 'Meteora'];
      const randomDex = dexs[Math.floor(Math.random() * dexs.length)];
      
      setLastUpdatedDex(randomDex);
      setTimeout(() => setLastUpdatedDex(null), 200); // Reset flash after 200ms

      setPrices(prev => {
        const currentPairPrices = [...prev[pair]];
        const dexIndex = currentPairPrices.findIndex(p => p.dex === randomDex);
        if (dexIndex !== -1) {
          const oldPrice = currentPairPrices[dexIndex].price;
          const change = oldPrice * (Math.random() * 0.0002 - 0.0001); // +/- 0.01%
          currentPairPrices[dexIndex] = {
            ...currentPairPrices[dexIndex],
            price: oldPrice + change,
            lastUpdate: 0.1
          };
        }
        return { ...prev, [pair]: currentPairPrices };
      });

    }, 2000);

    return () => clearInterval(interval);
  }, [activeTab]);

  const getSpread = (pairPrices: PriceUpdate[]) => {
    const pricesVal = pairPrices.map(p => p.price);
    const min = Math.min(...pricesVal);
    const max = Math.max(...pricesVal);
    return ((max - min) / min) * 100;
  };

  const currentPrices = prices[activeTab];
  const spread = getSpread(currentPrices);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="p-4 pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Real-time Prices
          </CardTitle>
          <div className="flex items-center gap-2">
             <span className="text-xs text-muted-foreground">Spread:</span>
             <Badge variant="outline" className={cn("font-mono text-xs", spread > 0.05 ? "text-green-500 border-green-500/50" : "text-zinc-500")}>
               {spread.toFixed(4)}%
             </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 flex-1">
        <Tabs defaultValue="SOL/USDC" className="w-full h-full flex flex-col" onValueChange={setActiveTab}>
          <div className="px-4 border-b bg-muted/20">
            <TabsList className="h-9 bg-transparent p-0 w-full justify-start gap-4">
              {Object.keys(mockPrices).map(pair => (
                <TabsTrigger 
                  key={pair} 
                  value={pair}
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 pb-2 pt-1.5 font-mono text-xs text-muted-foreground transition-none data-[state=active]:text-foreground data-[state=active]:shadow-none"
                >
                  {pair}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <div className="p-4 space-y-3">
             <div className="grid grid-cols-12 text-xs text-muted-foreground font-mono mb-2 px-2">
               <div className="col-span-4">DEX</div>
               <div className="col-span-4 text-right">PRICE</div>
               <div className="col-span-4 text-right">LIQUIDITY</div>
             </div>
             
             {currentPrices.map((p) => (
               <div 
                 key={p.dex}
                 className={cn(
                   "grid grid-cols-12 items-center p-2 rounded transition-colors duration-200",
                   lastUpdatedDex === p.dex ? "bg-green-500/10" : "hover:bg-muted/50"
                 )}
               >
                 <div className="col-span-4 flex items-center gap-2">
                   <div className={cn("w-1.5 h-1.5 rounded-full", 
                     p.dex === 'Raydium' ? 'bg-green-500' :
                     p.dex === 'Orca' ? 'bg-blue-500' : 'bg-purple-500'
                   )} />
                   <span className="font-medium text-sm">{p.dex}</span>
                 </div>
                 <div className="col-span-4 text-right font-mono font-medium">
                   {p.price.toFixed(activeTab.includes('BONK') ? 8 : 2)}
                 </div>
                 <div className="col-span-4 text-right font-mono text-xs text-muted-foreground">
                   ${(p.liquidity / 1000000).toFixed(1)}M
                 </div>
               </div>
             ))}

             <div className="mt-6 space-y-2">
               <div className="flex justify-between text-xs text-muted-foreground">
                 <span>Arbitrage Spread</span>
                 <span>Normal</span>
               </div>
               <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                 <div 
                   className="h-full bg-linear-to-r from-green-500 to-orange-500 transition-all duration-500"
                   style={{ width: `${Math.min(spread * 1000, 100)}%` }} // Scale up for visibility
                 />
               </div>
             </div>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
}
