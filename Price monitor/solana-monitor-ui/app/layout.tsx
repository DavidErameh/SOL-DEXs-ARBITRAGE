import type { Metadata } from 'next'
import { JetBrains_Mono, VT323, Share_Tech_Mono } from 'next/font/google'
import './globals.css'
import { cn } from '@/lib/utils'

const jetbrains = JetBrains_Mono({ 
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
})

const vt323 = VT323({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-vt323',
  display: 'swap',
})

const shareTech = Share_Tech_Mono({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-share-tech',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Solana Price Monitor',
  description: 'Real-time DEX arbitrage monitor',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark h-full">
      <body className={cn(
        jetbrains.variable,
        vt323.variable,
        shareTech.variable,
        "font-sans bg-void text-primary antialiased overflow-hidden selection:bg-primary selection:text-void h-full"
      )}>
        {children}
      </body>
    </html>
  )
}
