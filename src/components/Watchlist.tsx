import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CryptoData } from '../types';
import { useRealTimeCrypto } from '../hooks/useRealTimeCrypto';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';
import { Search, ArrowUpRight, ArrowDownRight, Star, X, CheckCircle2 } from 'lucide-react';
import { useFirebase } from './FirebaseProvider';
import { doc, setDoc, getDoc, collection, updateDoc, increment } from 'firebase/firestore';
import { WATCHLIST_COINS } from '../utils/constants';

export default function Watchlist() {
  const { user, db, userProfile, tradeCrypto, coins } = useFirebase();
  const cryptos = useRealTimeCrypto(WATCHLIST_COINS, coins);
  const [search, setSearch] = useState('');
  const [selectedCoin, setSelectedCoin] = useState<CryptoData | null>(null);
  const [tradeAction, setTradeAction] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [tradeSuccess, setTradeSuccess] = useState(false);

  const filteredCryptos = cryptos.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.symbol.toLowerCase().includes(search.toLowerCase())
  );

  const handleTrade = async () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0 || !selectedCoin) return;
    setIsProcessing(true);
    
    try {
      if (user && selectedCoin) {
        await tradeCrypto(tradeAction, selectedCoin.symbol, Number(amount), selectedCoin.price);
        setTradeSuccess(true);
        setTimeout(() => {
          setTradeSuccess(false);
          setSelectedCoin(null);
          setAmount('');
        }, 2500);
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const currentTotal = selectedCoin && amount && !isNaN(Number(amount)) 
    ? (Number(amount) * selectedCoin.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : '0.00';

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
        {selectedCoin && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedCoin(null)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-xl shadow-2xl z-50 overflow-hidden"
            >
              {!tradeSuccess ? (
                <>
                  <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <div className="flex items-center gap-2">
                       <div className="w-6 h-6 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                         <img src={selectedCoin.logo} alt={selectedCoin.symbol} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                       </div>
                       <h3 className="font-bold text-gray-900">Trade {selectedCoin.symbol}</h3>
                    </div>
                    <button onClick={() => setSelectedCoin(null)} className="text-gray-400 hover:text-gray-700">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="p-6">
                    <div className="flex justify-between items-end mb-6">
                       <div className="flex flex-col">
                         <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Current Price</span>
                         <span className="text-2xl font-black text-gray-900">
                           ${selectedCoin.price < 1 ? selectedCoin.price.toFixed(4) : selectedCoin.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                         </span>
                       </div>
                       <div className={`flex items-center gap-1 font-bold ${selectedCoin.changePercent >= 0 ? 'text-[#00AE64]' : 'text-red-500'}`}>
                         {selectedCoin.changePercent >= 0 ? '▲' : '▼'} {Math.abs(selectedCoin.changePercent).toFixed(2)}%
                       </div>
                    </div>

                    <div className="flex rounded-md p-1 bg-gray-100 mb-6">
                      <button 
                        onClick={() => setTradeAction('buy')}
                        className={`flex-1 py-1.5 text-sm font-bold rounded ${tradeAction === 'buy' ? 'bg-white shadow text-[#00AE64]' : 'text-gray-500 hover:text-gray-700'}`}
                      >
                        Buy {selectedCoin.symbol}
                      </button>
                      <button 
                        onClick={() => setTradeAction('sell')}
                        className={`flex-1 py-1.5 text-sm font-bold rounded ${tradeAction === 'sell' ? 'bg-white shadow text-red-500' : 'text-gray-500 hover:text-gray-700'}`}
                      >
                        Sell {selectedCoin.symbol}
                      </button>
                    </div>

                    <div className="space-y-4 mb-6">
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1">Amount ({selectedCoin.symbol})</label>
                        <div className="relative">
                          <input 
                            type="number" 
                            min="0"
                            step="0.01"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.00"
                            className="w-full bg-gray-50 border border-gray-200 rounded p-3 text-lg font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-shadow"
                          />
                          <button 
                            type="button"
                            onClick={() => {
                              if (userProfile && selectedCoin) {
                                if (tradeAction === 'buy') {
                                  const maxBuyAmount = userProfile.balance / selectedCoin.price;
                                  if (maxBuyAmount > 0) {
                                    setAmount(Number(maxBuyAmount.toFixed(8)).toString());
                                  } else {
                                    setAmount('0');
                                  }
                                } else {
                                  const holdingAmount = userProfile.assets?.[selectedCoin.symbol] || 0;
                                  setAmount(holdingAmount.toString());
                                }
                              }
                            }} 
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#00AE64] bg-[#00AE64]/10 px-2.5 py-1 rounded cursor-pointer hover:bg-[#00AE64]/20 transition-all"
                          >
                            MAX
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center py-2 px-1 border-t border-gray-100 border-dashed">
                        <span className="text-sm font-medium text-gray-500">Estimated Total (USD)</span>
                        <span className="text-lg font-bold text-gray-900">${currentTotal}</span>
                      </div>
                    </div>

                    {!user ? (
                      <button 
                        disabled
                        className="w-full py-3 bg-gray-200 text-gray-500 font-bold rounded cursor-not-allowed uppercase tracking-wider"
                      >
                        Sign In to Trade
                      </button>
                    ) : (
                      <button 
                        onClick={handleTrade}
                        disabled={isProcessing || !amount || Number(amount) <= 0}
                        className={`w-full py-3 font-bold rounded text-white shadow-lg uppercase tracking-wider transition-all
                          ${isProcessing ? 'bg-gray-400 cursor-wait' : tradeAction === 'buy' ? 'bg-[#00AE64] hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'}
                          ${(!amount || Number(amount) <= 0) ? 'opacity-50 cursor-not-allowed' : ''}
                        `}
                      >
                        {isProcessing ? 'Processing Order...' : `${tradeAction === 'buy' ? 'Buy' : 'Sell'} ${selectedCoin.symbol}`}
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <div className="p-8 flex flex-col items-center justify-center text-center">
                  <motion.div 
                    initial={{ scale: 0 }} 
                    animate={{ scale: 1 }} 
                    transition={{ type: 'spring', bounce: 0.5 }}
                    className="w-16 h-16 rounded-full bg-[#00AE64]/10 flex items-center justify-center mb-4 text-[#00AE64]"
                  >
                    <CheckCircle2 className="w-8 h-8" />
                  </motion.div>
                  <h3 className="text-2xl font-black text-gray-900 mb-2">Order Filled!</h3>
                  <p className="text-gray-500 font-medium mb-6">
                    Successfully {tradeAction === 'buy' ? 'bought' : 'sold'} <span className="font-bold text-gray-900">{amount} {selectedCoin.symbol}</span> for <span className="font-bold text-gray-900">${currentTotal}</span>.
                  </p>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
