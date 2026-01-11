import React from 'react';
import { cn } from '@/lib/utils';

export function ScanlineOverlay() {
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {/* Scanlines */}
      <div className="absolute inset-0 bg-scanlines opacity-50"></div>
      
      {/* Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_50%,rgba(0,0,0,0.4)_100%)]"></div>
      
      {/* CRT Flicker */}
      <div className="absolute inset-0 bg-white opacity-[0.02] animate-crt-flicker"></div>
    </div>
  );
}
