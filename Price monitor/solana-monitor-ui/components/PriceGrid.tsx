import { PriceUpdate } from '../hooks/useWebSocket';

interface PriceGridProps {
  prices: Record<string, PriceUpdate['data']>;
}

export default function PriceGrid({ prices }: PriceGridProps) {
  const sortedPairs = Object.keys(prices).sort();

  return (
    <div className="h-full overflow-hidden flex flex-col border-r border-terminal-dim">
      <div className="bg-terminal-dim/20 p-2 text-terminal-dim text-xs uppercase font-bold flex justify-between">
        <span>Monitor Feed</span>
        <span>{sortedPairs.length} Active</span>
      </div>
      
      <div className="overflow-y-auto flex-1 p-0">
        <table className="w-full text-left border-collapse">
            <thead className="bg-terminal sticky top-0 z-10">
                <tr className="text-terminal-dim text-xs border-b border-terminal-dim">
                    <th className="p-2 font-normal">Pair</th>
                    <th className="p-2 font-normal">DEX</th>
                    <th className="p-2 font-normal text-right">Price</th>
                    <th className="p-2 font-normal text-right">Slot</th>
                </tr>
            </thead>
            <tbody>
                {sortedPairs.map((key) => {
                    const data = prices[key];
                    return (
                        <tr key={key} className="border-b border-terminal-dim/30 hover:bg-white/5 transition-colors font-mono text-xs">
                            <td className="p-2 text-white font-bold">{data.pair}</td>
                            <td className="p-2 text-terminal-dim uppercase">{data.dex}</td>
                            <td className="p-2 text-right text-terminal-green">
                                {data.price.toFixed(6)}
                            </td>
                            <td className="p-2 text-right text-terminal-dim">
                                {data.slot}
                            </td>
                        </tr>
                    );
                })}
                {sortedPairs.length === 0 && (
                    <tr>
                        <td colSpan={4} className="p-8 text-center text-terminal-dim italic">
                            Waiting for price feed...
                        </td>
                    </tr>
                )}
            </tbody>
        </table>
      </div>
    </div>
  );
}
