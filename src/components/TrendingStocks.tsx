/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';
import { CryptoData } from '../types';
import { useRealTimeCrypto } from '../hooks/useRealTimeCrypto';

const initialCrypto: CryptoData[] = [
  {
    symbol: 'BTC',
    name: 'Bitcoin',
    price: 64230.50,
    change: 1240.20,
    changePercent: 1.95,
    logo: 'https://static.okx.com/cdn/oksupport/asset/currency/icon/btc.png',
    sparkline: Array.from({ length: 15 }, (_, i) => ({ value: 63000 + Math.random() * 1500 }))
  },
  {
    symbol: 'ETH',
    name: 'Ethereum',
    price: 3450.75,
    change: -45.20,
    changePercent: -1.29,
    logo: 'https://static.okx.com/cdn/oksupport/asset/currency/icon/eth.png',
    sparkline: Array.from({ length: 15 }, (_, i) => ({ value: 3400 + Math.random() * 100 }))
  },
  {
    symbol: 'SOL',
    name: 'Solana',
    price: 145.20,
    change: 12.40,
    changePercent: 9.32,
    logo: 'https://static.okx.com/cdn/oksupport/asset/currency/icon/sol.png',
    sparkline: Array.from({ length: 15 }, (_, i) => ({ value: 130 + Math.random() * 20 }))
  },
  {
    symbol: 'BNB',
    name: 'Binance Coin',
    price: 590.30,
    change: 5.40,
    changePercent: 0.92,
    logo: 'https://static.okx.com/cdn/oksupport/asset/currency/icon/bnb.png',
    sparkline: Array.from({ length: 15 }, (_, i) => ({ value: 580 + Math.random() * 15 }))
  },
  {
    symbol: 'XRP',
    name: 'XRP',
    price: 0.62,
    change: 0.01,
    changePercent: 1.45,
    logo: 'https://static.okx.com/cdn/oksupport/asset/currency/icon/xrp.png',
    sparkline: Array.from({ length: 15 }, (_, i) => ({ value: 0.6 + Math.random() * 0.05 }))
  },
  {
    symbol: 'DOGE',
    name: 'Dogecoin',
    price: 0.16,
    change: 0.02,
    changePercent: 12.50,
    logo: 'https://static.okx.com/cdn/oksupport/asset/currency/icon/doge.png',
    sparkline: Array.from({ length: 15 }, (_, i) => ({ value: 0.14 + Math.random() * 0.03 }))
  },
  {
    symbol: 'ADA',
    name: 'Cardano',
    price: 0.45,
    change: -0.01,
    changePercent: -2.10,
    logo: 'https://static.okx.com/cdn/oksupport/asset/currency/icon/ada.png',
    sparkline: Array.from({ length: 15 }, (_, i) => ({ value: 0.44 + Math.random() * 0.02 }))
  },
  {
    symbol: 'TON',
    name: 'Toncoin',
    price: 7.20,
    change: 0.45,
    changePercent: 6.25,
    logo: 'https://static.okx.com/cdn/oksupport/asset/currency/icon/ton.png',
    sparkline: Array.from({ length: 15 }, (_, i) => ({ value: 6.5 + Math.random() * 1 }))
  }
];

export default function TrendingStocks() {
  const cryptos = useRealTimeCrypto(initialCrypto);

  return (
    <div className="py-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[10px] font-bold text-white bg-[#00AE64] px-2 py-0.5 rounded-sm uppercase tracking-wider">Top Cryptos</span>
        <span className="text-[9px] font-bold text-[#00AE64] animate-pulse">● LIVE UPDATES</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-0 border border-gray-200 rounded-sm bg-white overflow-hidden shadow-sm">
        {cryptos.map((crypto, index) => (
          <div key={crypto.symbol} className={`p-4 ${index !== cryptos.length - 1 ? 'border-r border-gray-200' : ''} hover:bg-gray-50 transition-colors cursor-pointer`}>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-gray-50 rounded-full overflow-hidden border border-gray-100 flex items-center justify-center shrink-0">
                  <img src={crypto.logo} alt={crypto.symbol} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-bold text-[11px] text-gray-900 leading-tight uppercase">{crypto.symbol}</span>
                </div>
              </div>
              <div>
                 <div className={`text-xs font-bold leading-none ${crypto.change >= 0 ? 'text-[#00AE64]' : 'text-red-500'}`}>
                  ${crypto.price < 1 ? crypto.price.toFixed(4) : crypto.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className={`text-[9px] font-bold mt-0.5 ${crypto.change >= 0 ? 'text-[#00AE64]' : 'text-red-500'}`}>
                  {crypto.change >= 0 ? '▲' : '▼'} {crypto.changePercent.toFixed(2)}%
                </div>
              </div>
              <div className="h-6 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={crypto.sparkline}>
                    <YAxis domain={['dataMin', 'dataMax']} hide />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke={crypto.change >= 0 ? '#00AE64' : '#ef4444'} 
                      strokeWidth={1.5} 
                      dot={false} 
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
