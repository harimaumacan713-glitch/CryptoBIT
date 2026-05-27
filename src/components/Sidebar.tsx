/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';
import { useRealTimeCrypto } from '../hooks/useRealTimeCrypto';

export default function Sidebar() {
  const [btcData] = useRealTimeCrypto([{
    symbol: 'BTC',
    name: 'Bitcoin',
    price: 64206.35,
    change: 44.30,
    changePercent: 0.72,
    logo: 'https://static.okx.com/cdn/oksupport/asset/currency/icon/btc.png',
    sparkline: Array.from({ length: 20 }, (_, i) => ({ value: 64100 + i * 5 }))
  }]);

  const btcPrice = btcData.price;
  const btcChange = btcData.change;
  const btcPercent = btcData.changePercent;

  return (
    <div className="w-full lg:w-[320px] shrink-0 space-y-4">
      {/* Desktop App Ad */}
      <div className="relative rounded-sm overflow-hidden bg-slate-900 aspect-[4/5] cursor-pointer group">
        <img 
          src="https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&q=80&w=600" 
          alt="Desktop App" 
          className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-overlay group-hover:scale-105 transition-all duration-700" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-6 flex flex-col justify-end">
          <p className="text-white text-lg font-bold leading-tight mb-4 uppercase tracking-tight">Download CRYPTOBIT DESKTOP TERMINAL</p>
          <div className="flex gap-2">
            <button className="bg-white text-black text-[10px] px-3 py-1.5 rounded-sm font-bold hover:bg-gray-200 transition-colors uppercase">Get for Desktop</button>
          </div>
        </div>
      </div>

      {/* Market Index */}
      <div className="bg-white border border-gray-200 rounded-sm p-4 shadow-sm">
        <div className="flex justify-between items-start mb-1">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-gray-50 rounded-full border border-gray-100 p-0.5 flex items-center justify-center">
               <img src={btcData.logo} alt="BTC" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
            </div>
            <h4 className="font-bold text-sm text-gray-800">BTC / USD</h4>
          </div>
          <span className="text-[10px] font-bold text-[#00AE64] flex items-center gap-1">
             <span className="w-1.5 h-1.5 bg-[#00AE64] rounded-full animate-pulse"></span>
             LIVE
          </span>
        </div>
        <div className="flex flex-col mb-3">
          <span className="text-xl font-black tabular-nums">${btcPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          <span className={`text-xs font-bold ${btcChange >= 0 ? 'text-[#00AE64]' : 'text-red-500'}`}>
            {btcChange > 0 ? '+' : ''}{btcChange.toFixed(2)} ({btcPercent > 0 ? '+' : ''}{btcPercent.toFixed(2)}%)
          </span>
        </div>
        <div className="h-24 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={btcData.sparkline}>
              <YAxis domain={['dataMin', 'dataMax']} hide />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#00AE64" 
                strokeWidth={2} 
                dot={false} 
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
