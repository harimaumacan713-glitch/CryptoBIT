/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AreaChart, Area, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  X, 
  CheckCircle2, 
  TrendingUp, 
  BookOpen, 
  Clock, 
  Activity, 
  BarChart4, 
  ArrowUpRight, 
  ArrowDownRight, 
  Wallet, 
  TrendingDown, 
  Check, 
  ChevronRight, 
  Maximize2 
} from 'lucide-react';
import { useFirebase } from './FirebaseProvider';
import { CryptoData } from '../types';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

interface AssetDetailModalProps {
  coin: CryptoData;
  onClose: () => void;
}

interface FirestoreTrade {
  id: string;
  userId: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  amount: number;
  price: number;
  total: number;
  timestamp: string;
}

export default function AssetDetailModal({ coin, onClose }: AssetDetailModalProps) {
  const { user, db, userProfile, tradeCrypto, coins } = useFirebase();
  const [activeTab, setActiveTab] = useState<'Overview' | 'OrderBook' | 'Trades'>('Overview');
  const [tradeAction, setTradeAction] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [tradeSuccess, setTradeSuccess] = useState(false);
  const [liveTrades, setLiveTrades] = useState<FirestoreTrade[]>([]);
  const [tickerOffset, setTickerOffset] = useState(0);

  // continuous dynamic micro-ticks to simulate realistic real-time trading fluctuations
  useEffect(() => {
    const interval = setInterval(() => {
      setTickerOffset(prev => prev + (Math.random() - 0.5) * 0.001);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Real-time Firestore transaction stream for the asset
  useEffect(() => {
    if (!db) return;

    const tradesRef = collection(db, 'trades');
    const q = query(tradesRef, where('symbol', '==', coin.symbol));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tradesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FirestoreTrade[];

      // Sort by timestamp descending
      const sorted = tradesData.sort((a, b) => {
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });

      setLiveTrades(sorted.slice(0, 30));
    });

    return () => unsubscribe();
  }, [db, coin.symbol]);

  // Execute buy/sell orders
  const handleTrade = async () => {
    const orderQty = Number(amount);
    if (!amount || isNaN(orderQty) || orderQty <= 0) return;
    setIsProcessing(true);
    
    try {
      if (user) {
        await tradeCrypto(tradeAction, coin.symbol, orderQty, coin.price);
        setTradeSuccess(true);
        setTimeout(() => {
          setTradeSuccess(false);
          setAmount('');
        }, 2200);
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Safe Price Fluctuations calculations
  const livePrice = useMemo(() => {
    const factor = 1 + tickerOffset;
    return coin.price * factor;
  }, [coin.price, tickerOffset]);

  const currentTotalRaw = useMemo(() => {
    if (!amount || isNaN(Number(amount))) return 0;
    return Number(amount) * livePrice;
  }, [amount, livePrice]);

  const currentTotalStr = useMemo(() => {
    return currentTotalRaw.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  }, [currentTotalRaw]);

  // Find listing attributes if exist in database coins
  const customCoinData = useMemo(() => {
    return coins.find(c => c.symbol === coin.symbol);
  }, [coins, coin.symbol]);

  // Compute stats exactly like the global dashboard orderbook widget style
  const marketStats = useMemo(() => {
    const openPrice = coin.price * 0.985;
    const highPrice = coin.price * (coin.changePercent >= 0 ? 1.042 : 1.015);
    const lowPrice = coin.price * (coin.changePercent >= 0 ? 0.975 : 0.932);
    const prevPrice = coin.price / (1 + (coin.changePercent / 100));
    
    // Scale volumes dynamically
    const baseVolume = customCoinData ? Number(customCoinData.volume24h || 1250000) : 8500000;
    const rawLot = baseVolume / coin.price;
    
    const lotStr = rawLot > 1000000 
      ? `${(rawLot / 1000000).toFixed(2)}M` 
      : `${(rawLot / 1000).toFixed(1)}K`;

    const valStr = baseVolume > 1000000000 
      ? `${(baseVolume / 1000000000).toFixed(2)}B` 
      : `${(baseVolume / 1000000).toFixed(2)}M`;

    return {
      open: openPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 }),
      high: highPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 }),
      low: lowPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 }),
      prev: prevPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 }),
      lot: lotStr,
      val: `$${valStr}`,
      avg: (coin.price * 1.002).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 }),
      ara: (coin.price * 1.35).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 }),
      arb: (coin.price * 0.65).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 }),
      freq: (31450 + Math.floor(Math.sin(tickerOffset * 100) * 1500)).toLocaleString()
    };
  }, [coin.price, coin.changePercent, tickerOffset, customCoinData]);

  // High fidelity orderbook simulation centered around Live Ticker
  const bids = useMemo(() => {
    // Incorporate user specific inputs & volumes if relevant
    const buyVol = customCoinData ? (Number(customCoinData.buyVolume) || 0) : 0;
    const sellVol = customCoinData ? (Number(customCoinData.sellVolume) || 0) : 0;
    let weight = 1.0;
    if (buyVol > 0 || sellVol > 0) {
      weight = (buyVol / (buyVol + sellVol)) * 2;
    }

    return Array.from({ length: 10 }).map((_, i) => {
      // Linear distributed spreads
      const spreadStep = 0.0003 + (i * 0.0005);
      const bidPrice = Math.max(0.00000001, livePrice * (1 - spreadStep));
      
      // Pseudo random math to generate realistic micro fluctuations
      const seed = Math.abs(Math.sin((i + 1) * 7.5 + tickerOffset * 22));
      const sizeBase = 4500 / (livePrice || 1);
      const size = Math.max(0.0005, (seed * sizeBase * 1.8) * weight);
      const total = size * bidPrice;
      const freq = (Math.floor(seed * 450) + 12).toLocaleString();

      return {
        price: bidPrice,
        size,
        total,
        freq
      };
    }).sort((a, b) => b.price - a.price);
  }, [livePrice, tickerOffset, customCoinData]);

  const asks = useMemo(() => {
    const buyVol = customCoinData ? (Number(customCoinData.buyVolume) || 0) : 0;
    const sellVol = customCoinData ? (Number(customCoinData.sellVolume) || 0) : 0;
    let weight = 1.0;
    if (buyVol > 0 || sellVol > 0) {
      weight = (sellVol / (buyVol + sellVol)) * 2;
    }

    return Array.from({ length: 10 }).map((_, i) => {
      const spreadStep = 0.0003 + (i * 0.0005);
      const askPrice = livePrice * (1 + spreadStep);
      
      const seed = Math.abs(Math.cos((i + 1) * 19.3 + tickerOffset * 18));
      const sizeBase = 5200 / (livePrice || 1);
      const size = Math.max(0.0005, (seed * sizeBase * 1.6) * weight);
      const total = size * askPrice;
      const freq = (Math.floor(seed * 520) + 9).toLocaleString();

      return {
        price: askPrice,
        size,
        total,
        freq
      };
    }).sort((a, b) => a.price - b.price);
  }, [livePrice, tickerOffset, customCoinData]);

  // Live calculated spread values
  const spreadValue = useMemo(() => {
    if (asks.length === 0 || bids.length === 0) return 0;
    return Math.max(0, asks[0].price - bids[0].price);
  }, [asks, bids]);

  const spreadPercent = useMemo(() => {
    if (livePrice <= 0) return 0;
    return (spreadValue / livePrice) * 100;
  }, [spreadValue, livePrice]);

  // Compute cumulative depth sums for visualization layers
  const bidCumulativeList = useMemo(() => {
    let sum = 0;
    return bids.map(b => {
      sum += b.size;
      return sum;
    });
  }, [bids]);

  const bidTotalDepth = useMemo(() => {
    return bidCumulativeList.length > 0 ? bidCumulativeList[bidCumulativeList.length - 1] : 1;
  }, [bidCumulativeList]);

  const askCumulativeList = useMemo(() => {
    let sum = 0;
    return asks.map(a => {
      sum += a.size;
      return sum;
    });
  }, [asks]);

  const askTotalDepth = useMemo(() => {
    return askCumulativeList.length > 0 ? askCumulativeList[askCumulativeList.length - 1] : 1;
  }, [askCumulativeList]);

  // Dynamic charts helper
  const chartData = useMemo(() => {
    const baseList = coin.sparkline && coin.sparkline.length > 0 
      ? coin.sparkline.map(p => p.value)
      : Array.from({ length: 16 }).map((_, i) => coin.price * (1 + Math.sin(i / 1.5) * 0.008));

    // Map base with real-time continuous ticker offset logic
    return baseList.map((val, idx) => ({
      index: idx,
      price: val * (1 + tickerOffset * (idx / baseList.length))
    }));
  }, [coin.sparkline, coin.price, tickerOffset]);

  // Unit string formatter helpers
  const formatPrice = (val: number) => {
    if (val < 0.01) return val.toFixed(6);
    if (val < 1) return val.toFixed(4);
    if (val < 10) return val.toFixed(3);
    return val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatSize = (val: number) => {
    if (val < 0.001) return val.toFixed(6);
    if (val < 0.1) return val.toFixed(4);
    if (val < 100) return val.toFixed(2);
    return val.toLocaleString(undefined, { maximumFractionDigits: 1 });
  };

  const formatTotalUSD = (val: number) => {
    if (val < 10) return val.toFixed(2);
    return val.toLocaleString(undefined, { maximumFractionDigits: 0 });
  };

  return (
    <>
      {/* Background layer */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-black/55 backdrop-blur-sm z-[100] transition-opacity"
      />

      {/* Asset responsive detailed panel */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-5xl h-[94vh] md:h-[88vh] bg-white rounded-xl shadow-2xl z-[101] overflow-hidden flex flex-col border border-gray-100 flex-nowrap">
        
        {/* Main High-Fidelity Header */}
        <div className="p-4 sm:p-5 border-b border-gray-100 bg-gray-50/70 flex flex-col xs:flex-row xs:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center overflow-hidden shrink-0">
              <img src={coin.logo} alt={coin.symbol} className="w-8 h-8 object-contain" referrerPolicy="no-referrer" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <h3 className="font-extrabold text-gray-900 text-sm sm:text-lg block tracking-tight">{coin.name}</h3>
                <span className="bg-gray-200 text-gray-700 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-sm">{coin.symbol}</span>
                <span className="text-[9px] sm:text-xs text-gray-400 font-medium whitespace-nowrap">Blockchain Node Active</span>
              </div>
              <div className="flex items-center gap-2.5 mt-0.5">
                <span className="font-black text-sm sm:text-base text-gray-900 tabular-nums">
                  ${livePrice < 1 ? livePrice.toFixed(4) : livePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className={`text-[10px] sm:text-xs font-black flex items-center ${coin.changePercent >= 0 ? 'text-[#00AE64]' : 'text-rose-500'}`}>
                  {coin.changePercent >= 0 ? <ArrowUpRight className="w-3.5 h-3.5 inline mr-0.5" /> : <ArrowDownRight className="w-3.5 h-3.5 inline mr-0.5" />}
                  {coin.changePercent >= 0 ? '+' : ''}{coin.changePercent.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between xs:justify-end gap-3">
            {/* Quick real-time indicator */}
            <div className="hidden sm:flex items-center gap-1.5 bg-[#00AE64]/10 text-[#00AE64] text-[10px] font-extrabold uppercase px-2 py-1 rounded">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00AE64] animate-ping"></span> Live Price Engine
            </div>

            <button 
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors cursor-pointer ml-auto"
              id="btn-close-detailed-asset"
            >
              <X className="w-5.5 h-5.5" />
            </button>
          </div>
        </div>

        {/* Outer Tabs / View Box */}
        <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col bg-white">
          
          {/* Custom Mini interactive chart section */}
          <div className="px-4 py-3 sm:px-5 border-b border-gray-100 relative bg-white shrink-0">
            <div className="flex items-center justify-between mb-1.5">
              <h4 className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-[#00AE64]" /> Trend Market Real-Time
              </h4>
              <span className="text-[10px] text-gray-500 font-bold font-mono">UTC+07:00</span>
            </div>
            <div className="h-24 sm:h-28 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 0, right: 4, left: 4, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorAssetPrice" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={coin.changePercent >= 0 ? '#00AE64' : '#ef4444'} stopOpacity={0.12}/>
                      <stop offset="95%" stopColor={coin.changePercent >= 0 ? '#00AE64' : '#ef4444'} stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <YAxis domain={['dataMin', 'dataMax']} hide />
                  <Tooltip 
                    contentStyle={{ background: '#111827', border: 'none', borderRadius: '4px', padding: '6px 12px' }}
                    labelStyle={{ display: 'none' }}
                    itemStyle={{ color: '#fff', fontSize: '11px', fontWeight: 'bold', fontFamily: 'monospace' }}
                    formatter={(val: number) => [`$${val < 1 ? val.toFixed(4) : val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`, 'Price']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="price" 
                    stroke={coin.changePercent >= 0 ? '#00AE64' : '#ef4444'} 
                    strokeWidth={2} 
                    fillOpacity={1} 
                    fill="url(#colorAssetPrice)" 
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Tab Selection Row (Orderbook Icon matches configured menu "BookOpen") */}
          <div className="bg-gray-100 border-b border-gray-200 px-3 sm:px-4 py-2 flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar shrink-0">
            <button 
              onClick={() => setActiveTab('Overview')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 shrink-0 ${activeTab === 'Overview' ? 'bg-white text-gray-900 border border-gray-200 shadow-sm' : 'text-gray-500 hover:text-gray-950 hover:bg-gray-50/50'}`}
            >
              <Activity className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-900" /> Overview & Trade
            </button>
            <button 
              onClick={() => setActiveTab('OrderBook')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 shrink-0 ${activeTab === 'OrderBook' ? 'bg-white text-gray-900 border border-gray-200 shadow-sm' : 'text-gray-500 hover:text-gray-950 hover:bg-gray-50/50'}`}
            >
              <BookOpen className="w-3.5 h-3.5 text-[#00AE64]" /> Order Book Live
            </button>
            <button 
              onClick={() => setActiveTab('Trades')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 shrink-0 ${activeTab === 'Trades' ? 'bg-white text-gray-900 border border-gray-200 shadow-sm' : 'text-gray-500 hover:text-gray-950 hover:bg-gray-50/50'}`}
            >
              <Clock className="w-3.5 h-3.5 text-gray-400" /> Real-time Trades
            </button>
          </div>

          {/* Sub Content Boxes */}
          <div className="flex-1 p-3 sm:p-5 bg-white">
            <AnimatePresence mode="wait">
              
              {/* TAB 1: OVERVIEW & TRADE */}
              {activeTab === 'Overview' && (
                <motion.div 
                  key="overview"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-5"
                >
                  {/* Left panel: Complete Buy-Sell forms */}
                  <div className="border border-gray-200 rounded-lg p-4 bg-gray-50/40 relative shadow-sm">
                    {!tradeSuccess ? (
                      <>
                        <div className="flex rounded-md p-0.5 bg-gray-150 bg-gray-200/60 mb-4 border border-gray-200">
                          <button 
                            type="button"
                            onClick={() => setTradeAction('buy')}
                            className={`flex-1 py-1.5 text-xs font-extrabold rounded-md transition-all cursor-pointer ${tradeAction === 'buy' ? 'bg-white shadow-sm text-[#00AE64]' : 'text-gray-500 hover:text-gray-700'}`}
                          >
                            Beli {coin.symbol}
                          </button>
                          <button 
                            type="button"
                            onClick={() => setTradeAction('sell')}
                            className={`flex-1 py-1.5 text-xs font-extrabold rounded-md transition-all cursor-pointer ${tradeAction === 'sell' ? 'bg-white shadow-sm text-rose-500' : 'text-gray-500 hover:text-gray-700'}`}
                          >
                            Jual {coin.symbol}
                          </button>
                        </div>

                        {/* Balance display */}
                        <div className="flex items-center justify-between text-xs font-bold text-gray-500 mb-3 bg-white p-2 border border-gray-100 rounded">
                          <span className="flex items-center gap-1.5 text-gray-400 uppercase tracking-widest"><Wallet className="w-3.5 h-3.5 text-gray-400" /> Saldo Dompet</span>
                          <span className="text-gray-900 tabular-nums">
                            {tradeAction === 'buy' 
                              ? `$${userProfile?.balance?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
                              : `${(userProfile?.assets?.[coin.symbol] || 0).toLocaleString(undefined, { maximumFractionDigits: 6 })} ${coin.symbol}`
                            }
                          </span>
                        </div>

                        {/* Input quantity */}
                        <div className="mb-4">
                          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1">Jumlah Transaksi ({coin.symbol})</label>
                          <div className="relative">
                            <input 
                              type="number" 
                              min="0"
                              step="any"
                              value={amount}
                              onChange={(e) => setAmount(e.target.value)}
                              placeholder={`0.00 ${coin.symbol}`}
                              className="w-full bg-white border border-gray-200 rounded p-2.5 text-sm font-bold text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#00AE64] focus:border-[#00AE64] transition-all font-mono"
                            />
                            <button 
                              type="button"
                              onClick={() => {
                                if (userProfile) {
                                  if (tradeAction === 'buy') {
                                    const maxBuyAmount = userProfile.balance / livePrice;
                                    setAmount(maxBuyAmount > 0 ? Number(maxBuyAmount.toFixed(6)).toString() : '0');
                                  } else {
                                    const holdingAmount = userProfile.assets?.[coin.symbol] || 0;
                                    setAmount(holdingAmount.toString());
                                  }
                                }
                              }} 
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-black text-[#00AE64] bg-[#00AE64]/10 px-2 py-1 rounded cursor-pointer hover:bg-[#00AE64]/20 transition-all"
                            >
                              MAX
                            </button>
                          </div>
                        </div>

                        {/* Total Estimations */}
                        <div className="flex justify-between items-center py-2 px-1 border-t border-gray-100 border-dashed mb-4">
                          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Estimasi Total USD</span>
                          <span className="text-sm font-black text-gray-900 font-mono">${currentTotalStr}</span>
                        </div>

                        {/* Action execution buttons */}
                        {!user ? (
                          <button 
                            disabled
                            className="w-full py-2 bg-gray-200 text-gray-450 font-bold rounded-lg cursor-not-allowed uppercase text-[10px] tracking-wider"
                          >
                            Masuk Untuk Berdagang
                          </button>
                        ) : (
                          <button 
                            onClick={handleTrade}
                            disabled={isProcessing || !amount || Number(amount) <= 0}
                            className={`w-full py-2 font-black rounded-md text-white shadow-sm text-xs uppercase tracking-wider transition-all cursor-pointer
                              ${isProcessing ? 'bg-gray-400 cursor-wait' : tradeAction === 'buy' ? 'bg-[#00AE64] hover:bg-emerald-600' : 'bg-rose-500 hover:bg-rose-600'}
                              ${(!amount || Number(amount) <= 0) ? 'opacity-40 cursor-not-allowed shadow-none' : ''}
                            `}
                          >
                            {isProcessing ? 'Memproses Pesanan...' : `${tradeAction === 'buy' ? 'Beli' : 'Jual'} ${coin.symbol}`}
                          </button>
                        )}
                      </>
                    ) : (
                      <div className="py-8 flex flex-col items-center justify-center text-center">
                        <motion.div 
                          initial={{ scale: 0 }} 
                          animate={{ scale: 1 }} 
                          className="w-12 h-12 rounded-full bg-[#00AE64]/10 flex items-center justify-center mb-3 text-[#00AE64]"
                        >
                          <CheckCircle2 className="w-7 h-7" />
                        </motion.div>
                        <h4 className="text-base font-extrabold text-gray-900 mb-1">Pesanan Diproses!</h4>
                        <p className="text-xs text-gray-500 font-medium max-w-xs leading-relaxed">
                          Anda sukses {tradeAction === 'buy' ? 'membeli' : 'menjual'} <span className="font-bold text-gray-900">{amount} {coin.symbol}</span> seharga <span className="font-black text-gray-900">${currentTotalStr} USD</span>.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Right panel: High Fidelity market ticker statistics */}
                  <div className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-1 mb-2 border-b border-gray-100 pb-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#00AE64] animate-pulse"></span>
                        <h4 className="text-xs font-black text-gray-800 uppercase tracking-widest">Informasi Node Token & Likuiditas</h4>
                      </div>
                      <p className="text-[11px] text-gray-500 leading-relaxed font-semibold">
                        Pasar spot CryptoBit terhubung langsung ke multi-pool likuiditas terdesentralisasi (AMM). 
                        Setiap order Anda diproses secara instan dan dimasukkan ke dalam Blockchain Ledger.
                      </p>
                    </div>

                    {/* Stats Grid exactly style of global Orderbook */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 mt-4 pt-3 border-t border-gray-100">
                      <div className="bg-gray-50 p-2 rounded border border-gray-100/50 flex flex-col">
                        <span className="text-[9px] text-gray-400 font-bold uppercase block tracking-wider">Open</span>
                        <span className="text-xs font-black text-gray-800 font-mono">${marketStats.open}</span>
                      </div>
                      <div className="bg-gray-50 p-2 rounded border border-gray-100/50 flex flex-col">
                        <span className="text-[9px] text-gray-400 font-bold uppercase block tracking-wider">High</span>
                        <span className="text-xs font-black text-[#00AE64] font-mono">${marketStats.high}</span>
                      </div>
                      <div className="bg-gray-50 p-2 rounded border border-gray-100/50 flex flex-col">
                        <span className="text-[9px] text-gray-400 font-bold uppercase block tracking-wider">Low</span>
                        <span className="text-xs font-black text-rose-500 font-mono">${marketStats.low}</span>
                      </div>
                      <div className="bg-gray-50 p-2 rounded border border-gray-100/50 flex flex-col">
                        <span className="text-[9px] text-gray-400 font-bold uppercase block tracking-wider">Lot Volume</span>
                        <span className="text-xs font-black text-blue-500 font-mono">{marketStats.lot}</span>
                      </div>
                      <div className="bg-gray-50 p-2 rounded border border-gray-100/50 flex flex-col">
                        <span className="text-[9px] text-gray-400 font-bold uppercase block tracking-wider">Volume USD</span>
                        <span className="text-xs font-black text-emerald-600 font-mono">{marketStats.val}</span>
                      </div>
                      <div className="bg-gray-50 p-2 rounded border border-gray-100/50 flex flex-col">
                        <span className="text-[9px] text-gray-400 font-bold uppercase block tracking-wider">Total Trades</span>
                        <span className="text-xs font-black text-gray-700 font-mono">{marketStats.freq}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* TAB 2: LIVE ORDERBOOK (BINANCE / INDODAX PROFESSIONAL VIEW) */}
              {activeTab === 'OrderBook' && (
                <motion.div 
                  key="orderbook"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="space-y-4"
                >
                  {/* Two Column Layout (Bids on Left, Asks on Right) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm p-3 relative">
                    
                    {/* Bids List (Buyers, Green) */}
                    <div>
                      <div className="flex items-center justify-between border-b border-gray-100 pb-1.5 mb-2">
                        <h4 className="text-[10px] sm:text-xs font-black text-[#00AE64] uppercase tracking-widest flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#00AE64] animate-pulse"></span>
                          BUY ORDERS (BID)
                        </h4>
                        <span className="text-[9px] text-gray-400 font-semibold uppercase tracking-wider">Cumulative Size</span>
                      </div>

                      <div className="overflow-x-auto no-scrollbar">
                        <table className="w-full text-left border-collapse min-w-[240px]">
                          <thead>
                            <tr className="text-[9px] text-gray-400 font-bold uppercase border-b border-gray-100/50">
                              <th className="py-1 px-1.5 text-left">Harga ({coin.symbol})</th>
                              <th className="py-1 px-1.5 text-right">Jumlah</th>
                              <th className="py-1 px-1.5 text-right">Total (USD)</th>
                              <th className="py-1 px-1.5 text-center hidden sm:table-cell">Freq</th>
                            </tr>
                          </thead>
                          <tbody>
                            {bids.map((bid, i) => {
                              const cumulative = bidCumulativeList[i];
                              const pct = Math.min(100, (cumulative / bidTotalDepth) * 100);

                              return (
                                <tr key={i} className="relative hover:bg-gray-50/70 transition-all font-mono">
                                  <td className="py-1 px-1.5 text-left font-extrabold text-[11px] sm:text-xs text-[#00AE64] tabular-nums relative z-10">
                                    ${formatPrice(bid.price)}
                                  </td>
                                  <td className="py-1 px-1.5 text-right font-medium text-[11px] sm:text-xs text-gray-600 tabular-nums relative z-10">
                                    {formatSize(bid.size)}
                                  </td>
                                  <td className="py-1 px-1.5 text-right font-bold text-[11px] sm:text-xs text-gray-800 tabular-nums relative z-10">
                                    ${formatTotalUSD(bid.total)}
                                  </td>
                                  <td className="py-1 px-1.5 text-center font-medium text-[10px] text-blue-500 tabular-nums relative z-10 hidden sm:table-cell">
                                    {bid.freq}
                                  </td>
                                  {/* Dynamic Depth background fill */}
                                  <td 
                                    className="absolute inset-y-0 right-0 py-0 px-0 pointer-events-none z-0 bg-[#00AE64]/5" 
                                    style={{ width: `${pct}%` }} 
                                    colSpan={4} 
                                  />
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Asks List (Sellers, Red) */}
                    <div className="border-t md:border-t-0 md:border-l border-gray-100 pt-3 md:pt-0 md:pl-3">
                      <div className="flex items-center justify-between border-b border-gray-100 pb-1.5 mb-2">
                        <h4 className="text-[10px] sm:text-xs font-black text-rose-500 uppercase tracking-widest flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                          SELL ORDERS (ASK)
                        </h4>
                        <span className="text-[9px] text-gray-400 font-semibold uppercase tracking-wider">Cumulative Size</span>
                      </div>

                      <div className="overflow-x-auto no-scrollbar">
                        <table className="w-full text-left border-collapse min-w-[240px]">
                          <thead>
                            <tr className="text-[9px] text-gray-400 font-bold uppercase border-b border-gray-100/50">
                              <th className="py-1 px-1.5 text-left">Harga ({coin.symbol})</th>
                              <th className="py-1 px-1.5 text-right">Jumlah</th>
                              <th className="py-1 px-1.5 text-right">Total (USD)</th>
                              <th className="py-1 px-1.5 text-center hidden sm:table-cell">Freq</th>
                            </tr>
                          </thead>
                          <tbody>
                            {asks.map((ask, i) => {
                              const cumulative = askCumulativeList[i];
                              const pct = Math.min(100, (cumulative / askTotalDepth) * 100);

                              return (
                                <tr key={i} className="relative hover:bg-gray-50/70 transition-all font-mono">
                                  <td className="py-1 px-1.5 text-left font-extrabold text-[11px] sm:text-xs text-rose-500 tabular-nums relative z-10">
                                    ${formatPrice(ask.price)}
                                  </td>
                                  <td className="py-1 px-1.5 text-right font-medium text-[11px] sm:text-xs text-gray-600 tabular-nums relative z-10">
                                    {formatSize(ask.size)}
                                  </td>
                                  <td className="py-1 px-1.5 text-right font-bold text-[11px] sm:text-xs text-gray-800 tabular-nums relative z-10">
                                    ${formatTotalUSD(ask.total)}
                                  </td>
                                  <td className="py-1 px-1.5 text-center font-medium text-[10px] text-blue-500 tabular-nums relative z-10 hidden sm:table-cell">
                                    {ask.freq}
                                  </td>
                                  {/* Dynamic Depth background fill */}
                                  <td 
                                    className="absolute inset-y-0 right-0 py-0 px-0 pointer-events-none z-0 bg-rose-500/5" 
                                    style={{ width: `${pct}%` }} 
                                    colSpan={4} 
                                  />
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Highly aesthetic middle Spread ticker widget */}
                    <div className="col-span-1 md:col-span-2 flex items-center justify-between py-2 px-3 bg-gray-50 border border-gray-150 rounded text-[11px] font-bold text-gray-500">
                      <span className="uppercase tracking-widest text-[9px] text-gray-400 font-extrabold flex items-center gap-1">
                        Spread Market
                      </span>
                      <span className="text-gray-900 font-mono text-[11px] sm:text-xs">
                        ${spreadValue < 0.01 ? spreadValue.toFixed(6) : spreadValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })} 
                        <span className="text-[#00AE64] font-extrabold ml-1.5">({spreadPercent.toFixed(3)}%)</span>
                      </span>
                    </div>

                  </div>

                  {/* Dynamic User Transaction stream tracker below Orderbook */}
                  <div className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-2">
                      <h5 className="text-[10px] sm:text-xs font-black text-gray-800 uppercase tracking-widest flex items-center gap-1.5">
                        <Activity className="w-4 h-4 text-emerald-500 animate-pulse" /> Running Trades (Transaksi Pengguna Terkini)
                      </h5>
                      <span className="text-[9px] bg-[#00AE64]/10 text-[#00AE64] font-black px-1.5 py-0.5 rounded">Blockchain Verified</span>
                    </div>

                    <div className="max-h-[140px] overflow-y-auto no-scrollbar font-mono">
                      {liveTrades.length > 0 ? (
                        <table className="w-full text-left text-[11px] border-collapse">
                          <thead>
                            <tr className="text-[9px] text-gray-400 uppercase tracking-widest border-b border-gray-50 pb-1 select-none">
                              <th className="pb-1 font-bold">Waktu</th>
                              <th className="pb-1 font-bold">Sisi</th>
                              <th className="pb-1 text-right font-bold">Eksekusi</th>
                              <th className="pb-1 text-right font-bold">Jumlah</th>
                              <th className="pb-1 text-right font-bold">Total USD</th>
                            </tr>
                          </thead>
                          <tbody>
                            {liveTrades.slice(0, 5).map((tr) => (
                              <tr key={tr.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                <td className="py-1 text-gray-500">{new Date(tr.timestamp).toLocaleTimeString()}</td>
                                <td className={`py-1 font-bold ${tr.type === 'BUY' ? 'text-[#00AE64]' : 'text-rose-500'}`}>{tr.type}</td>
                                <td className="py-1 text-right font-black text-gray-900">${formatPrice(tr.price)}</td>
                                <td className="py-1 text-right text-gray-600">{formatSize(tr.amount)}</td>
                                <td className="py-1 text-right text-gray-900 font-extrabold">${formatTotalUSD(tr.total)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <div className="text-center py-6 text-[10px] text-gray-400 font-semibold leading-relaxed">
                          Menunggu aktivitas transaksi... <br />
                          Jika Anda melakukan transaksi baru di menu Overview, blockchain regional kami akan langsung memperbaruinya secara realtime!
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* TAB 3: REAL-TIME SEED TRADES */}
              {activeTab === 'Trades' && (
                <motion.div 
                  key="trades"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-md font-mono"
                >
                  <div className="p-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2 text-xs">
                    <span className="font-extrabold text-gray-500 uppercase tracking-wider">Transaction Stream ledger (Spot & Liquidity)</span>
                    <span className="text-[9px] bg-emerald-100 text-emerald-800 font-black tracking-wider px-2 py-0.5 rounded uppercase">Connected</span>
                  </div>

                  <div className="overflow-x-auto no-scrollbar max-h-[300px]">
                    {liveTrades.length > 0 ? (
                      <table className="w-full text-left text-[11px] border-collapse">
                        <thead>
                          <tr className="bg-gray-50 text-[9px] text-gray-400 uppercase border-b border-gray-100">
                            <th className="py-2.5 px-3 font-bold">Waktu Detail</th>
                            <th className="py-2.5 px-3 font-bold">Identitas Dompet Pengenal</th>
                            <th className="py-2.5 px-3 font-bold">Order Sisi</th>
                            <th className="py-2.5 px-3 text-right font-bold">Harga Eksekusi</th>
                            <th className="py-2.5 px-3 text-right font-bold">Jumlah Aset</th>
                            <th className="py-2.5 px-3 text-right font-bold">Total Bersih</th>
                          </tr>
                        </thead>
                        <tbody>
                          {liveTrades.map((tr) => (
                            <tr key={tr.id} className="border-b border-gray-100 hover:bg-gray-50/70 transition-all">
                              <td className="py-2 px-3 text-gray-500">{new Date(tr.timestamp).toLocaleString()}</td>
                              <td className="py-2 px-3 text-gray-500 truncate max-w-[100px]" title={tr.userId}>
                                {tr.userId.substring(0, 10)}...
                              </td>
                              <td className={`py-2 px-3 font-black ${tr.type === 'BUY' ? 'text-[#00AE64]' : 'text-rose-500'}`}>
                                {tr.type}
                              </td>
                              <td className="py-2 px-3 text-right font-bold text-gray-900">${formatPrice(tr.price || coin.price)}</td>
                              <td className="py-2 px-3 text-right text-gray-600">{formatSize(tr.amount)}</td>
                              <td className="py-2 px-3 text-right font-black text-gray-900">${formatTotalUSD(tr.total)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="text-center py-16 text-xs text-gray-400 font-semibold leading-relaxed">
                        Belum ada riwayat transaksi live yang terekam pada pasangan {coin.symbol}. <br />
                        Kunjungi tab "Overview & Trade" untuk melakukan aktivitas perdagangan.
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </div>

      </div>
    </>
  );
}
