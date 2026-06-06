import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CryptoData } from '../types';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';
import { Search, ArrowUpRight, ArrowDownRight, Star } from 'lucide-react';
import { useFirebase } from './FirebaseProvider';
import AssetDetailModal from './AssetDetailModal';

export default function Watchlist() {
  const { coins, realTimeCryptos } = useFirebase();
  const cryptos = realTimeCryptos;
  const [search, setSearch] = useState('');
  const [selectedCoin, setSelectedCoin] = useState<CryptoData | null>(null);

  const activeDetailCoin = selectedCoin 
    ? cryptos.find(c => c.symbol === selectedCoin.symbol) || selectedCoin 
    : null;

  const filteredCryptos = cryptos.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.symbol.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-full bg-white border border-gray-200 rounded-sm shadow-sm mt-4 overflow-hidden relative">
      <div className="p-6 border-b border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
             <Star className="text-[#00AE64] fill-current w-5 h-5" />
             Watchlist & Market Data
          </h2>
          <p className="text-sm text-gray-500 mt-1">Real-time market tracking and instant execution</p>
        </div>
        <div className="relative w-full md:w-64 relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search crypto assets..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#00AE64] transition-all"
          />
        </div>
      </div>

      <div className="overflow-x-auto no-scrollbar">
        <table className="w-full text-left border-collapse min-w-[300px]">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-[10px] xs:text-xs text-gray-500 uppercase tracking-widest">
              <th className="py-3 px-3 sm:px-6 font-bold">Asset</th>
              <th className="py-3 px-1.5 sm:px-6 font-bold text-right">Price</th>
              <th className="py-3 px-1.5 sm:px-6 font-bold text-right">24h Change</th>
              <th className="py-3 px-1.5 sm:px-6 font-bold text-center">Trend (7d)</th>
              <th className="py-3 px-3 sm:px-6 font-bold text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredCryptos.map((coin, index) => (
              <motion.tr 
                key={coin.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="border-b border-gray-100 hover:bg-gray-50 transition-colors last:border-0"
              >
                <td className="py-3 sm:py-4 px-3 sm:px-6">
                  <div className="flex items-center gap-1.5 sm:gap-3">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full border border-gray-100 bg-white shadow-sm flex items-center justify-center overflow-hidden shrink-0">
                      <img src={coin.logo} alt={coin.symbol} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                    </div>
                    <div>
                      <span className="font-bold text-xs sm:text-sm text-gray-900 block">{coin.name}</span>
                      <span className="text-[10px] sm:text-xs text-gray-500 font-medium uppercase">{coin.symbol}</span>
                    </div>
                  </div>
                </td>
                <td className="py-3 sm:py-4 px-1.5 sm:px-6 text-right font-bold text-xs sm:text-sm text-gray-900 tabular-nums">
                  ${coin.price < 1 ? coin.price.toFixed(4) : coin.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="py-3 sm:py-4 px-1.5 sm:px-6 text-right">
                  <div className={`flex items-center justify-end gap-0.5 sm:gap-1 text-xs sm:text-sm font-bold ${coin.changePercent >= 0 ? 'text-[#00AE64]' : 'text-red-500'}`}>
                    {coin.changePercent >= 0 ? <ArrowUpRight className="w-3 sm:w-3.5 h-3 sm:h-3.5" /> : <ArrowDownRight className="w-3 sm:w-3.5 h-3 sm:h-3.5" />}
                    {Math.abs(coin.changePercent).toFixed(2)}%
                  </div>
                </td>
                <td className="py-3 sm:py-4 px-1.5 sm:px-6 w-20 sm:w-32 text-center">
                  <div className="h-6 sm:h-8 w-16 sm:w-24 mx-auto">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={coin.sparkline}>
                        <YAxis domain={['dataMin', 'dataMax']} hide />
                        <Line 
                          type="monotone" 
                          dataKey="value" 
                          stroke={coin.changePercent >= 0 ? '#00AE64' : '#ef4444'} 
                          strokeWidth={1.5} 
                          dot={false} 
                          isAnimationActive={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </td>
                <td className="py-3 sm:py-4 px-3 sm:px-6 text-right">
                  <button 
                    onClick={() => setSelectedCoin(coin)}
                    className="bg-gray-900 hover:bg-gray-800 text-white text-[10px] sm:text-xs font-bold px-2.5 sm:px-4 py-1.5 rounded transition-colors"
                  >
                    Trade
                  </button>
                </td>
              </motion.tr>
            ))}
            {filteredCryptos.length === 0 && (
              <tr>
                <td colSpan={5} className="py-12 text-center text-gray-500">
                  No assets found matching your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {activeDetailCoin && (
          <AssetDetailModal 
            coin={activeDetailCoin} 
            onClose={() => setSelectedCoin(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
