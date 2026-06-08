/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';
import { CryptoData } from '../types';
import { useFirebase } from './FirebaseProvider';

const initialCrypto: CryptoData[] = [
  {
    symbol: 'BTC',
    name: 'Bitcoin',
    price: 92450.25,
    change: 1220.50,
    changePercent: 1.34,
    logo: 'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/btc.png',
    sparkline: Array.from({ length: 15 }, (_, i) => ({ value: 91000 + Math.random() * 1500 }))
  },
  {
    symbol: 'ETH',
    name: 'Ethereum',
    price: 3412.50,
    change: -42.10,
    changePercent: -1.22,
    logo: 'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/eth.png',
    sparkline: Array.from({ length: 15 }, (_, i) => ({ value: 3380 + Math.random() * 100 }))
  },
  {
    symbol: 'SOL',
    name: 'Solana',
    price: 168.35,
    change: 8.50,
    changePercent: 5.32,
    logo: 'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/sol.png',
    sparkline: Array.from({ length: 15 }, (_, i) => ({ value: 160 + Math.random() * 20 }))
  },
  {
    symbol: 'BNB',
    name: 'Binance Coin',
    price: 585.80,
    change: -2.30,
    changePercent: -0.39,
    logo: 'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/bnb.png',
    sparkline: Array.from({ length: 15 }, (_, i) => ({ value: 575 + Math.random() * 15 }))
  },
  {
    symbol: 'XRP',
    name: 'XRP',
    price: 1.15,
    change: 0.05,
    changePercent: 4.54,
    logo: 'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/xrp.png',
    sparkline: Array.from({ length: 15 }, (_, i) => ({ value: 1.10 + Math.random() * 0.1 }))
  },
  {
    symbol: 'DOGE',
    name: 'Dogecoin',
    price: 0.224,
    change: 0.012,
    changePercent: 5.66,
    logo: 'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/doge.png',
    sparkline: Array.from({ length: 15 }, (_, i) => ({ value: 0.20 + Math.random() * 0.03 }))
  },
  {
    symbol: 'ADA',
    name: 'Cardano',
    price: 0.525,
    change: -0.008,
    changePercent: -1.50,
    logo: 'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/ada.png',
    sparkline: Array.from({ length: 15 }, (_, i) => ({ value: 0.50 + Math.random() * 0.04 }))
  }
];

export default function TrendingStocks() {
  const { realTimeCryptos } = useFirebase();
  // Limit to top 4 prominent coins for clean single-row UI (no wrapping)
  const cryptos = realTimeCryptos.slice(0, 4);

  return (
    <div className="py-3">
      <div className="flex items-center gap-1.5 mb-2.5">
        <span className="text-[9px] font-black text-white bg-[#00AE64] px-2 py-0.5 rounded-sm uppercase tracking-wider">Top Cryptos</span>
        <span className="text-[9px] font-bold text-[#00AE64] tracking-widest uppercase">Live Volatility</span>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-0 border border-slate-200 rounded-lg bg-white overflow-hidden shadow-sm">
        {cryptos.map((crypto, index) => {
          // Responsive borders to ensure no dangling border on the last visible column
          const borderClass = 
            index === 0 || index === 1
              ? 'border-r border-slate-100'
              : index === 2
                ? 'border-r-0 sm:border-r border-slate-100'
                : ''; // index === 3 has no border-r

          return (
            <div 
              key={crypto.id} 
              className={`p-2.5 ${borderClass} ${index === 3 ? 'hidden sm:block' : ''} hover:bg-slate-50 transition-colors cursor-pointer group`}
            >
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1.5">
                  <div className="w-4.5 h-4.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200 flex items-center justify-center shrink-0">
                    <img src={crypto.logo} alt={crypto.symbol} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-extrabold text-[10px] text-slate-800 leading-none uppercase tracking-tight group-hover:text-[#00AE64] transition-colors">{crypto.symbol}</span>
                  </div>
                </div>
                <div>
                  <div className={`text-[10.5px] font-bold leading-none ${crypto.change >= 0 ? 'text-[#00AE64]' : 'text-rose-600'} font-mono`}>
                    ${crypto.price < 1 ? crypto.price.toFixed(4) : crypto.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className={`text-[9px] font-bold mt-0.5 ${crypto.change >= 0 ? 'text-[#00AE64]' : 'text-rose-600'} flex items-center gap-0.5`}>
                    <span>{crypto.changePercent.toFixed(2)}%</span>
                  </div>
                </div>
                <div className="h-4.5 w-full opacity-85">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={crypto.sparkline}>
                      <YAxis domain={['dataMin', 'dataMax']} hide />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke={crypto.change >= 0 ? '#00AE64' : '#e11d48'} 
                        strokeWidth={1.5} 
                        dot={false} 
                        isAnimationActive={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
