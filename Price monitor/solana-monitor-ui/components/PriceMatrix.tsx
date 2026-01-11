"use client";

import React, { memo } from 'react';
import { PriceData } from '@/types/events';
import { cn, formatCurrency } from '@/lib/utils';

interface PriceMatrixProps {
  prices: PriceData[];
  className?: string;
}

// Optimized row component
const PriceRow = memo(({ data }: { data: PriceData }) => {
  const isPositive = data.change24h >= 0;
  
  // Flash animation key based on timestamp to re-trigger animation
  const flashKey = `${data.pair}-${data.timestamp}`;


  return (
    <div 
      className={cn(
        "flex items-center px-6 row-padding border-b border-border-subtle/50 hover:bg-primary/5 hover:text-primary transition-colors group h-[48px] crs-block",
        "animate-flash-green"
      )}
      key={flashKey}
    >
      {/* Pair */}
      <div className="w-[25%] text-[15px] text-primary group-hover:text-glow font-bold truncate px-2 tracking-wide">
        {data.pair}
      </div>

      {/* DEX */}
      <div className="w-[20%] text-[14px] text-dim truncate group-hover:text-primary transition-colors tracking-wide font-medium">
        {data.dex}
      </div>

      {/* Price */}
      <div className="w-[30%] text-right text-[16px] text-primary group-hover:text-glow tracking-widest px-1 font-bold">
        {formatCurrency(data.price)}
      </div>

      {/* Change */}
      <div className={cn(
        "w-[25%] text-right text-[14px] px-2 pr-4 tracking-wider font-bold",
        isPositive ? "text-primary" : "text-loss-red"
      )}>
        {isPositive ? '+' : ''}{data.change24h.toFixed(2)}%
      </div>
    </div>
  );
}, (prev, next) => {
  return (
    prev.data.price === next.data.price && 
    prev.data.timestamp === next.data.timestamp
  );
});

PriceRow.displayName = 'PriceRow';

export function PriceMatrix({ prices, className }: PriceMatrixProps) {
  return (
    <div className={cn("flex flex-col bg-surface h-full", className)}>
      {/* Header */}
      <div className="flex items-center px-6 panel-header-padding h-[40px] border-b border-border-subtle bg-grid/50 text-xl font-pixel text-dim select-none sticky top-0 z-10 tracking-widest uppercase backdrop-blur-sm">
        <div className="w-[25%] px-2 font-bold">PAIR</div>
        <div className="w-[20%] font-bold">DEX</div>
        <div className="w-[30%] text-right font-bold">PRICE</div>
        <div className="w-[25%] text-right px-2 pr-4 font-bold">24H</div>
      </div>

      {/* Standard List (No Virtualization for now) */}
      <div className="flex-1 overflow-y-auto no-scrollbar font-mono">
        {prices.length > 0 ? (
           prices.map((price, index) => (
             <PriceRow key={`${price.pair}-${price.dex}`} data={price} />
           ))
        ) : (
          <div className="flex h-full items-center justify-center text-dim text-lg">
            [WAITING FOR PRICE FEED...]
          </div>
        )}
      </div>
    </div>
  );
}
