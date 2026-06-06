/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useFirebase } from './FirebaseProvider';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  RefreshCw, 
  BarChart2, 
  Activity, 
  Play, 
  Pause, 
  ChevronRight, 
  Star, 
  Layers, 
  Loader2, 
  ArrowUpRight,
  TrendingUp as BulletIcon,
  CheckCircle,
  Info,
  Sliders,
  Sparkles,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const STATIC_INITIAL_COINS = [
  { symbol: 'BTC', name: 'Bitcoin', price: 92450.25, change: 1.25, changePercent: 1.35, sparkline: [] },
  { symbol: 'ETH', name: 'Ethereum', price: 3412.50, change: -42.10, changePercent: -1.22, sparkline: [] },
  { symbol: 'SOL', name: 'Solana', price: 168.35, change: 8.50, changePercent: 5.32, sparkline: [] },
  { symbol: 'XRP', name: 'Ripple', price: 1.15, change: 0.05, changePercent: 4.54, sparkline: [] },
  { symbol: 'BNB', name: 'Binance Coin', price: 585.80, change: -2.30, changePercent: -0.39, sparkline: [] },
];

export default function Chartbit() {
  const { coins, user, userProfile, tradeCrypto, realTimeCryptos } = useFirebase();
  const liveCryptos = realTimeCryptos;
  
  const [selectedSymbol, setSelectedSymbol] = useState('BTC');
  const [timeframe, setTimeframe] = useState<'1m' | '5m' | '1H' | '1D'>('1m');
  const [indicator, setIndicator] = useState<'NONE' | 'MA' | 'EMA' | 'RSI'>('NONE');
  
  // Trade formulation
  const [tradeAction, setTradeAction] = useState<'BUY' | 'SELL'>('BUY');
  const [tradeAmount, setTradeAmount] = useState<string>('');
  const [tradeLoading, setTradeLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Candlestick state representation
  interface Candle {
    time: number;
    timeStr: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    ma?: number;
    ema?: number;
    rsi?: number;
  }
  const [candles, setCandles] = useState<Candle[]>([]);
  const [chartLoading, setChartLoading] = useState(false);

  // Hover state for custom interactive crosshair
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [hoverCoords, setHoverCoords] = useState<{ x: number; y: number } | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Active highlighted cryptocurrency
  const selectedCoinData = useMemo(() => {
    return liveCryptos.find(c => c.symbol === selectedSymbol) || 
           { symbol: selectedSymbol, name: selectedSymbol, price: 1.0, changePercent: 0, change: 0, logo: `https://api.dicebear.com/7.x/identicon/svg?seed=${selectedSymbol}` };
  }, [liveCryptos, selectedSymbol]);

  // Indicator computer
  const calculateIndicators = (candlesList: Candle[]): Candle[] => {
    if (candlesList.length === 0) return [];
    
    const period = 14;
    // SMA
    let enriched = candlesList.map((c, idx) => {
      let sum = 0;
      const startIdx = Math.max(0, idx - period + 1);
      const count = idx - startIdx + 1;
      for (let j = startIdx; j <= idx; j++) {
        sum += candlesList[j].close;
      }
      return { ...c, ma: sum / count };
    });

    // EMA
    const emaMultiplier = 2 / (period + 1);
    let currentEma = enriched[0].close;
    enriched = enriched.map((c, idx) => {
      if (idx === 0) {
        return { ...c, ema: currentEma };
      }
      currentEma = (c.close - currentEma) * emaMultiplier + currentEma;
      return { ...c, ema: currentEma };
    });

    // RSI
    let gains = 0;
    let losses = 0;
    let avgGain = 0;
    let avgLoss = 0;

    enriched = enriched.map((c, idx) => {
      if (idx === 0) {
        return { ...c, rsi: 50 };
      }
      const diff = c.close - enriched[idx - 1].close;
      const currentGain = diff > 0 ? diff : 0;
      const currentLoss = diff < 0 ? -diff : 0;

      if (idx <= period) {
        gains += currentGain;
        losses += currentLoss;
        if (idx === period) {
          avgGain = gains / period;
          avgLoss = losses / period;
        }
      } else {
        avgGain = (avgGain * (period - 1) + currentGain) / period;
        avgLoss = (avgLoss * (period - 1) + currentLoss) / period;
      }

      let rsi = 50;
      if (idx >= period) {
        if (avgLoss === 0) {
          rsi = avgGain === 0 ? 50 : 100;
        } else {
          const rs = avgGain / avgLoss;
          rsi = 100 - (100 / (1 + rs));
        }
      }
      return { ...c, rsi };
    });

    return enriched;
  };

  // Fetch / Generate candlestick data
  useEffect(() => {
    let active = true;
    const loadCandles = async () => {
      setChartLoading(true);
      const isStandard = ['BTC', 'ETH', 'SOL', 'XRP', 'BNB', 'DOGE', 'ADA'].includes(selectedSymbol);
      let baseCandles: Candle[] = [];

      if (isStandard) {
        try {
          const intervalMap: Record<string, string> = {
            '1m': '1m',
            '5m': '5m',
            '1H': '1h',
            '1D': '1d'
          };
          const interval = intervalMap[timeframe] || '1m';
          const symbolStr = selectedSymbol.toUpperCase();

          // Tier 1: Try Binance Global REST API
          let response = await fetch(`https://api.binance.com/api/v3/klines?symbol=${symbolStr}USDT&interval=${interval}&limit=60`).catch(() => null);
          
          // Tier 2: Try Binance US REST API if global is blocked/fails
          if (!response || !response.ok) {
            response = await fetch(`https://api.binance.us/api/v1/klines?symbol=${symbolStr}USDT&interval=${interval}&limit=60`).catch(() => null);
          }

          if (response && response.ok) {
            const data = await response.json();
            baseCandles = data.map((item: any) => {
              const openTime = item[0];
              const open = parseFloat(item[1]);
              const high = parseFloat(item[2]);
              const low = parseFloat(item[3]);
              const close = parseFloat(item[4]);
              const volume = parseFloat(item[5]);
              const dateObj = new Date(openTime);
              const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              return {
                time: openTime,
                timeStr,
                open,
                high,
                low,
                close,
                volume
              };
            });
          }

          // Tier 3: Try CryptoCompare API (CORS-free, extremely reliable failover)
          if (baseCandles.length === 0) {
            let limit = 60;
            let agg = 1;
            let endpoint = 'histominute';
            if (timeframe === '5m') {
              endpoint = 'histominute';
              agg = 5;
            } else if (timeframe === '1H') {
              endpoint = 'histohour';
            } else if (timeframe === '1D') {
              endpoint = 'histoday';
            }

            const ccRes = await fetch(`https://min-api.cryptocompare.com/data/v2/${endpoint}?fsym=${symbolStr}&tsym=USD&limit=${limit}&aggregate=${agg}`).catch(() => null);
            if (ccRes && ccRes.ok) {
              const ccData = await ccRes.json();
              if (ccData && ccData.Response === 'Success' && ccData.Data && Array.isArray(ccData.Data.Data)) {
                baseCandles = ccData.Data.Data.map((item: any) => {
                  const oTime = item.time * 1000;
                  const dateObj = new Date(oTime);
                  const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  return {
                    time: oTime,
                    timeStr,
                    open: item.open || selectedCoinData.price || 100,
                    high: item.high || selectedCoinData.price || 100,
                    low: item.low || selectedCoinData.price || 100,
                    close: item.close || selectedCoinData.price || 100,
                    volume: item.volumeto || 10000
                  };
                });
              }
            }
          }
        } catch (err) {
          // Log as warning to keep trace simple, preventing failure-critical error notifications
          console.warn("Kline fallback fetch triggered:", err);
        }
      }

      // Fallback generator if all API networks fail/are offline
      if (baseCandles.length === 0) {
        const baselinePrice = selectedCoinData.price || 100;
        const seed: Candle[] = [];
        let current = baselinePrice;
        for (let i = 59; i >= 0; i--) {
          const d = new Date(Date.now() - i * 60000);
          const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const stepPercent = (Math.sin(i / 3) * 0.015) + ((Math.random() - 0.5) * 0.015);
          const open = current;
          current = current * (1 + stepPercent);
          const close = current;
          const high = Math.max(open, close) * (1 + Math.random() * 0.005);
          const low = Math.min(open, close) * (1 - Math.random() * 0.005);

          seed.push({
            time: d.getTime(),
            timeStr,
            open,
            high,
            low,
            close,
            volume: 1000 + Math.random() * 95000
          });
        }
        baseCandles = seed;
      }

      if (active) {
        setCandles(calculateIndicators(baseCandles));
        setChartLoading(false);
      }
    };

    loadCandles();
    return () => {
      active = false;
    };
  }, [selectedSymbol, timeframe]);

  // Push live real-time price tick updates instantly into the last candle
  useEffect(() => {
    if (candles.length === 0 || !selectedCoinData || !selectedCoinData.price) return;

    const listCopy = [...candles];
    const lastIdx = listCopy.length - 1;
    const lastCandle = { ...listCopy[lastIdx] };
    const currentPrice = selectedCoinData.price;

    if (currentPrice !== lastCandle.close) {
      lastCandle.close = currentPrice;
      lastCandle.high = Math.max(lastCandle.high, currentPrice);
      lastCandle.low = Math.min(lastCandle.low, currentPrice);
      listCopy[lastIdx] = lastCandle;
      setCandles(calculateIndicators(listCopy));
    }
  }, [selectedCoinData.price]);

  // Hover mouse mapping
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    if (!svgRef.current || candles.length === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Coordinates mapping to internal viewBox (1000x400)
    const svgX = (mouseX / rect.width) * 1000;
    const svgY = (mouseY / rect.height) * 400;

    // Standard widths: Y-Axis is on the right 80px (X ranges 0 to 920 for data)
    const pctX = (svgX - 10) / 910;
    let idx = Math.floor(pctX * candles.length);
    idx = Math.max(0, Math.min(candles.length - 1, idx));

    setHoveredIdx(idx);
    setHoverCoords({ x: svgX, y: svgY });
  };

  const handleMouseLeave = () => {
    setHoveredIdx(null);
    setHoverCoords(null);
  };

  // Pricing scaling parameters
  const priceMath = useMemo(() => {
    if (candles.length === 0) {
      return { chartMin: 0, chartMax: 100, chartRange: 100, grLines: [], getValY: (v: number) => 0 };
    }
    const pricesList = candles.flatMap(c => [c.low, c.high]);
    let minPrice = Math.min(...pricesList);
    let maxPrice = Math.max(...pricesList);
    const range = maxPrice - minPrice;
    const pad = range * 0.1 || 1.0;
    const chartMin = minPrice - pad;
    const chartMax = maxPrice + pad;
    const chartRange = chartMax - chartMin;

    const getValY = (val: number) => {
      return 385 - ((val - chartMin) / chartRange * 360); // leaves 25px top padding and 15px bottom padding
    };

    // Calculate 5 horizontal grids
    const grLines = Array.from({ length: 5 }, (_, i) => {
      const ratio = i / 4;
      const priceVal = chartMin + ratio * chartRange;
      const y = 385 - ratio * 360;
      return { y, priceVal };
    });

    return { chartMin, chartMax, chartRange, grLines, getValY };
  }, [candles]);

  const xMath = useMemo(() => {
    const totalCandles = candles.length || 1;
    const getValX = (idx: number) => {
      return (idx / totalCandles) * 910 + 10;
    };
    const getCandleWidth = () => {
      return (910 / totalCandles) * 0.70;
    };
    return { getValX, getCandleWidth };
  }, [candles.length]);

  const currentCandle = useMemo(() => {
    if (candles.length === 0) return null;
    return hoveredIdx !== null ? candles[hoveredIdx] : candles[candles.length - 1];
  }, [candles, hoveredIdx]);

  const handleOrderTrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setMessage({ type: 'error', text: 'Silakan masuk ke platform terlebih dahulu.' });
      return;
    }
    const amountNum = parseFloat(tradeAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setMessage({ type: 'error', text: 'Silakan masukkan jumlah unit koin yang valid.' });
      return;
    }

    setTradeLoading(true);
    setMessage(null);

    try {
      await tradeCrypto(
        tradeAction.toLowerCase() as 'buy' | 'sell',
        selectedSymbol,
        amountNum,
        selectedCoinData.price || 0.1
      );
      setMessage({ 
        type: 'success', 
        text: `Sukses mengeksekusi order ${tradeAction} ${amountNum.toLocaleString()} ${selectedSymbol} pada harga $${selectedCoinData.price ? selectedCoinData.price.toLocaleString(undefined, { maximumFractionDigits: 4 }) : 'N/A'}` 
      });
      setTradeAmount('');
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Transaksi gagal diproses oleh Web3 AMM.' });
    } finally {
      setTradeLoading(false);
    }
  };

  const isPositive = selectedCoinData.changePercent >= 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto mt-4 animate-fadeIn">
      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2 text-[#00AE64]">
            <Activity className="w-5 h-5 animate-pulse" />
            <span className="font-extrabold text-[10px] tracking-widest uppercase bg-[#00AE64]/10 px-2 py-0.5 rounded border border-[#00AE64]/20">REAL-TIME STATION</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white italic tracking-tighter mt-1">CHART<span className="text-[#00AE64]">BIT</span> ACTIVE ANALYSIS</h1>
          <p className="text-slate-400 text-xs md:text-sm">Pantau pergerakan grafik bursa instan dan jalankan instrumen perdagangan AMM & Binance secara langsung.</p>
        </div>

        {/* Custom Coin Indicator Info */}
        <div className="bg-[#121622] rounded-lg border border-slate-800 p-3 flex items-center gap-4.5">
           <div>
              <span className="text-[9px] uppercase font-bold text-slate-500 block">Status Gateway</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                 <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
                 <span className="text-xs font-black text-emerald-400">WS-STREAM ACTIVE</span>
              </div>
           </div>
           <div className="border-l border-slate-800 pl-4">
              <span className="text-[9px] uppercase font-bold text-slate-500 block">Total Live Feeds</span>
              <span className="text-xs font-black text-white mt-0.5 block">{liveCryptos.length} Pairs</span>
           </div>
        </div>
      </div>

      {/* Main Grid: Chart and Assets lists */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        
        {/* Left Sidebar: Asset live list */}
        <div className="xl:col-span-1 bg-[#121622] border border-slate-800 rounded-xl overflow-hidden shadow-2xl flex flex-col h-[650px]">
          <div className="p-4 border-b border-slate-800 bg-[#0c101b]/50 flex items-center justify-between">
            <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Trading Pairs</span>
            <span className="text-[10px] bg-[#00AE64]/10 text-[#00AE64] border border-[#00AE64]/20 px-1.5 py-0.5 rounded font-black">LIVE TICKERS</span>
          </div>
          
          <div className="overflow-y-auto flex-1 divide-y divide-slate-800/50 pr-1 select-none">
            {liveCryptos.map((crypto) => {
              const active = crypto.symbol === selectedSymbol;
              const positive = crypto.changePercent >= 0;
              return (
                <div 
                  key={crypto.symbol}
                  onClick={() => {
                    setSelectedSymbol(crypto.symbol);
                    setMessage(null);
                  }}
                  className={`p-3.5 flex items-center justify-between gap-2.5 cursor-pointer transition-all ${
                    active 
                      ? 'bg-[#00AE64]/5 border-l-2 border-[#00AE64]' 
                      : 'hover:bg-slate-800/40 border-l-2 border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 p-1 flex items-center justify-center overflow-hidden">
                      <img 
                        src={crypto.logo || `https://api.dicebear.com/7.x/identicon/svg?seed=${crypto.symbol}`} 
                        alt={crypto.symbol} 
                        className="w-full h-full object-contain" 
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div>
                      <span className="font-extrabold text-sm block text-white">{crypto.symbol}</span>
                      <span className="text-[10px] text-slate-500 font-bold block truncate max-w-[80px]">{crypto.name}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-black text-xs block text-white font-mono">
                      ${(crypto.price || 0.1).toLocaleString(undefined, { maximumFractionDigits: 4 })}
                    </span>
                    <span className={`text-[10px] font-black font-mono flex items-center justify-end ${positive ? 'text-[#00AE64]' : 'text-rose-500'}`}>
                      {positive ? '+' : ''}{(crypto.changePercent || 0).toFixed(2)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Center: Chart Canvas */}
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-[#121622] border border-slate-800 rounded-xl p-5 shadow-2xl relative">
            
            {/* Active stats bar */}
            <div className="flex flex-col sm:flex-row justify-between gap-4 border-b border-slate-801/50 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#0c101b] border border-slate-800 p-1 flex items-center justify-center">
                  <img 
                    src={selectedCoinData.logo || `https://api.dicebear.com/7.x/identicon/svg?seed=${selectedCoinData.symbol}`} 
                    alt={selectedSymbol} 
                    className="w-full h-full object-contain" 
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-black text-white tracking-tight">{selectedSymbol}/USDT</h2>
                    <span className="text-[10px] uppercase font-bold text-slate-400 font-semibold bg-slate-800 px-2 py-0.5 rounded">Spot Trading</span>
                  </div>
                  <p className="text-xs text-slate-400 font-medium">{selectedCoinData.name}</p>
                </div>
              </div>

              {/* Dynamic Prices */}
              <div className="flex items-center gap-5">
                 <div className="text-right">
                    <span className="text-[9px] uppercase font-bold text-slate-500 block">Harga Terkini</span>
                    <span className="text-xl font-black text-white font-mono block">
                      ${(selectedCoinData.price || 1.0).toLocaleString(undefined, { maximumFractionDigits: 4 })}
                    </span>
                 </div>
                 <div className="text-right border-l border-slate-800 pl-5">
                    <span className="text-[9px] uppercase font-bold text-slate-500 block">Fluktuasi 24 Jam</span>
                    <span className={`text-sm font-black font-mono flex items-center justify-end gap-0.5 ${isPositive ? 'text-[#00AE64]' : 'text-rose-500'}`}>
                      {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                      {isPositive ? '+' : ''}{(selectedCoinData.changePercent || 0).toFixed(2)}%
                    </span>
                 </div>
              </div>
            </div>

            {/* Timeframe & Chart Tools */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6 bg-[#0c101b]/60 p-2 rounded-lg border border-slate-801/40">
              <div className="flex items-center gap-1.5 bg-[#121622] p-1 rounded-md border border-slate-800 text-[11px] font-bold">
                {(['1m', '5m', '1H', '1D'] as const).map(tf => (
                  <button
                    key={tf}
                    onClick={() => setTimeframe(tf)}
                    className={`px-3 py-1 rounded cursor-pointer transition-colors ${timeframe === tf ? 'bg-[#00AE64] text-white font-black' : 'text-slate-400 hover:text-white'}`}
                  >
                    {tf}
                  </button>
                ))}
              </div>

              {/* Indicator Panel Selector */}
              <div className="flex items-center gap-1.5 text-[11px] font-bold">
                 <span className="text-slate-500 flex items-center gap-1"><Sliders className="w-3.5 h-3.5 text-slate-500" /> Indicators:</span>
                 <div className="flex gap-1">
                   {(['NONE', 'MA', 'EMA', 'RSI'] as const).map(ind => (
                     <button
                       key={ind}
                       onClick={() => setIndicator(ind)}
                       className={`px-2.5 py-1 text-[10px] rounded border transition-colors cursor-pointer ${
                         indicator === ind 
                           ? 'bg-[#00AE64]/10 text-[#00AE64] border-[#00AE64]/40 font-black' 
                           : 'bg-[#121622] text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                       }`}
                     >
                       {ind}
                     </button>
                   ))}
                 </div>
              </div>
            </div>

            {/* Real-time OHLV Hover and Info overlay bar */}
            <div className="mb-4">
              {currentCandle ? (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 bg-[#0c101b] border border-slate-800/60 p-2.5 rounded-lg text-[11px] font-mono select-none">
                  <span className="text-slate-400 font-extrabold flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-[#00AE64]" /> DATABAR:
                  </span>
                  <span className="text-slate-500">TIME: <span className="text-white">{currentCandle.timeStr}</span></span>
                  <span className="text-slate-500">O: <span className="text-slate-200">${currentCandle.open.toLocaleString(undefined, { maximumFractionDigits: 3 })}</span></span>
                  <span className="text-slate-500">H: <span className="text-emerald-400 font-bold">${currentCandle.high.toLocaleString(undefined, { maximumFractionDigits: 3 })}</span></span>
                  <span className="text-slate-500">L: <span className="text-rose-400 font-bold">${currentCandle.low.toLocaleString(undefined, { maximumFractionDigits: 3 })}</span></span>
                  <span className="text-slate-500">C: <span className={`font-black ${currentCandle.close >= currentCandle.open ? 'text-[#00AE64]' : 'text-rose-500'}`}>${currentCandle.close.toLocaleString(undefined, { maximumFractionDigits: 3 })}</span></span>
                  <span className="text-slate-500">VOL: <span className="text-slate-200 font-bold">{Math.round(currentCandle.volume).toLocaleString()}</span></span>
                  <span className="text-slate-500">CHG: <span className={`font-extrabold ${currentCandle.close >= currentCandle.open ? 'text-[#00AE64]' : 'text-rose-500'}`}>{((currentCandle.close - currentCandle.open) / currentCandle.open * 100).toFixed(2)}%</span></span>
                </div>
              ) : (
                <div className="h-[38px] flex items-center px-3 bg-[#0c101b] border border-slate-800/60 rounded-lg text-xs text-slate-500 font-mono animate-pulse">
                  Menghubungkan ke server bursa Binance live stream...
                </div>
              )}
            </div>

            {/* Recharts Area Canvas -> Replaced with interactive Candlestick SVG */}
            <div className="h-96 w-full relative bg-[#090d16] rounded-lg border border-slate-900 overflow-hidden select-none">
              {chartLoading ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#090d16]/80 backdrop-blur-xs z-10 gap-3">
                  <Loader2 className="w-8 h-8 text-[#00AE64] animate-spin" />
                  <span className="text-xs font-bold text-slate-400 tracking-wider">MENGHUBUNGKAN BURSA REAL-TIME...</span>
                </div>
              ) : null}

              {candles.length > 0 && (
                <svg 
                  ref={svgRef}
                  width="100%" 
                  height="100%" 
                  viewBox="0 0 1000 400" 
                  preserveAspectRatio="none"
                  className="cursor-crosshair overflow-visible"
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseLeave}
                >
                  {/* Grid Lines Underlay */}
                  {priceMath.grLines.map((gl, i) => (
                    <g key={i}>
                      <line 
                        x1="10" 
                        y1={gl.y} 
                        x2="920" 
                        y2={gl.y} 
                        stroke="#1e293b" 
                        strokeWidth="1" 
                        strokeDasharray="4 4" 
                        opacity="0.4" 
                      />
                      <text 
                        x="930" 
                        y={gl.y + 4} 
                        fill="#64748b" 
                        fontSize="10" 
                        fontFamily="monospace" 
                        textAnchor="start"
                      >
                        ${gl.priceVal.toLocaleString(undefined, { maximumFractionDigits: selectedSymbol === 'XRP' || selectedSymbol === 'SOL' ? 4 : 2 })}
                      </text>
                    </g>
                  ))}

                  {/* Horizontal indicators logic (OB/OS boundaries for RSI or standard view) */}
                  {indicator === 'RSI' ? (
                    <>
                      {/* RSIOB / RSIOS thresholds */}
                      <rect x="10" y="128" width="910" height="144" fill="#a855f7" fillOpacity="0.04" />
                      <line x1="10" y1="128" x2="920" y2="128" stroke="#a855f7" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />
                      <line x1="10" y1="272" x2="920" y2="272" stroke="#a855f7" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />
                      <text x="930" y="132" fill="#a855f7" fontSize="9" fontFamily="monospace">70 (OB)</text>
                      <text x="930" y="276" fill="#a855f7" fontSize="9" fontFamily="monospace">30 (OS)</text>

                      {/* RSI Live Trend Path */}
                      <path 
                        d={`M ${candles.map((c, idx) => c.rsi !== undefined ? `${xMath.getValX(idx)},${380 - (c.rsi / 100 * 360)}` : '').filter(Boolean).join(' ')}`}
                        fill="transparent" 
                        stroke="#c084fc" 
                        strokeWidth="2" 
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      
                      {/* RSI Indicator Label Tag */}
                      <text x="20" y="35" fill="#c084fc" fontSize="10" fontFamily="sans-serif" fontWeight="bold">RSI (14)</text>
                    </>
                  ) : (
                    <>
                      {/* Candlestick drawing */}
                      {candles.map((c, idx) => {
                        const cx = xMath.getValX(idx);
                        const yOpen = priceMath.getValY(c.open);
                        const yClose = priceMath.getValY(c.close);
                        const yHigh = priceMath.getValY(c.high);
                        const yLow = priceMath.getValY(c.low);
                        const isBullish = c.close >= c.open;
                        const mainColor = isBullish ? '#00e676' : '#ef4444';
                        
                        const bodyY = Math.min(yOpen, yClose);
                        const bodyHeight = Math.max(1.5, Math.abs(yOpen - yClose));
                        const rWidth = xMath.getCandleWidth();
                        const rX = cx - rWidth / 2;

                        return (
                          <g key={idx}>
                            {/* High-Low Wick line */}
                            <line 
                              x1={cx} 
                              y1={yHigh} 
                              x2={cx} 
                              y2={yLow} 
                              stroke={mainColor} 
                              strokeWidth="1.5" 
                            />
                            {/* Candle body */}
                            <rect 
                              x={rX} 
                              y={bodyY} 
                              width={rWidth} 
                              height={bodyHeight} 
                              fill={mainColor} 
                              stroke={isBullish ? 'none' : mainColor}
                              strokeWidth="1"
                              rx="1.5"
                            />
                          </g>
                        );
                      })}

                      {/* MA 14 Trend Line overlay */}
                      {indicator === 'MA' && (
                        <>
                          <path 
                            d={`M ${candles.map((c, idx) => c.ma !== undefined ? `${xMath.getValX(idx)},${priceMath.getValY(c.ma)}` : '').filter(Boolean).join(' ')}`}
                            fill="transparent" 
                            stroke="#3b82f6" 
                            strokeWidth="1.5" 
                            strokeDasharray="4 2"
                            opacity="0.85"
                          />
                          <text x="20" y="35" fill="#3b82f6" fontSize="10" fontFamily="sans-serif" fontWeight="bold">MA (14)</text>
                        </>
                      )}

                      {/* EMA 14 Trend Line overlay */}
                      {indicator === 'EMA' && (
                        <>
                          <path 
                            d={`M ${candles.map((c, idx) => c.ema !== undefined ? `${xMath.getValX(idx)},${priceMath.getValY(c.ema)}` : '').filter(Boolean).join(' ')}`}
                            fill="transparent" 
                            stroke="#fbbf24" 
                            strokeWidth="1.5" 
                            opacity="0.85"
                          />
                          <text x="20" y="35" fill="#fbbf24" fontSize="10" fontFamily="sans-serif" fontWeight="bold">EMA (14)</text>
                        </>
                      )}
                    </>
                  )}

                  {/* Vertical time marker grids at bottom */}
                  {candles.filter((_, idx) => idx % 10 === 0).map((tick, k) => {
                    const idx = candles.indexOf(tick);
                    const x = xMath.getValX(idx);
                    return (
                      <g key={k}>
                        <line x1={x} y1="20" x2={x} y2="380" stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" opacity="0.25" />
                        <text x={x} y="394" fill="#475569" fontSize="9" fontFamily="monospace" textAnchor="middle">{tick.timeStr}</text>
                      </g>
                    );
                  })}

                  {/* Interactive Cursor crosshair HUD */}
                  {hoveredIdx !== null && hoverCoords && (
                    <g>
                      {/* Vertical line crosshair */}
                      <line 
                        x1={xMath.getValX(hoveredIdx)} 
                        y1="10" 
                        x2={xMath.getValX(hoveredIdx)} 
                        y2="380" 
                        stroke="#64748b" 
                        strokeWidth="1" 
                        strokeDasharray="4 4" 
                        opacity="0.75" 
                      />
                      {/* Horizontal line crosshair */}
                      <line 
                        x1="10" 
                        y1={hoverCoords.y} 
                        x2="920" 
                        y2={hoverCoords.y} 
                        stroke="#64748b" 
                        strokeWidth="1" 
                        strokeDasharray="4 4" 
                        opacity="0.75" 
                      />
                      {/* Pulse point at crosshair intersection */}
                      <circle 
                        cx={xMath.getValX(hoveredIdx)} 
                        cy={hoverCoords.y} 
                        r="4" 
                        fill="#00AE64" 
                        stroke="#ffffff" 
                        strokeWidth="1.5" 
                      />
                    </g>
                  )}
                </svg>
              )}
            </div>
            
            {/* Visual absolute backdrop overlay info */}
            <div className="absolute right-4 bottom-4 text-right flex items-center gap-1.5">
               <span className="w-1.5 h-1.5 rounded-full bg-[#00AE64] shrink-0 animate-ping" />
               <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-mono">Live Tick update: 1200ms interval</span>
            </div>
          </div>
          
          {/* Quick Informational Tool Tips block */}
          <div className="bg-[#121622] rounded-xl p-4 border border-slate-800 flex gap-3.5 text-slate-350">
             <Info className="w-5 h-5 text-[#00AE64] shrink-0 mt-0.5" />
             <div className="text-xs space-y-1">
                <span className="font-extrabold text-white block uppercase tracking-wider text-[10px]">Tips Analisis Taktis</span>
                <p className="leading-relaxed font-semibold">
                  Tingkatkan metrik visual dengan mengaktifkan indikator <strong>Moving Average (MA)</strong> atau <strong>Exponential Moving Average (EMA)</strong> untuk membaca trend garis resistensi, atau aktifkan momentum <strong>Relative Strength Index (RSI)</strong> untuk mendeteksi area jenuh beli (overbought) atau jenuh jual (oversold) secara presisi.
                </p>
             </div>
          </div>
        </div>

        {/* Right Tab: Execution Interface (Simulated buying & selling with AMM support) */}
        <div className="xl:col-span-1 space-y-6">
          <div className="bg-[#121622] border border-slate-800 rounded-xl p-5 shadow-2xl flex flex-col justify-between h-[650px]">
            <form onSubmit={handleOrderTrade} className="space-y-5">
              <div className="pb-3 border-b border-slate-800">
                <span className="text-[10px] text-purple-400 bg-purple-950/45 px-2 py-0.5 rounded font-black tracking-widest uppercase">EXECUTIVE DESK</span>
                <h3 className="text-base font-black text-white mt-1">Eksekusi Pasar AMM</h3>
              </div>

               {/* TAB BUY vs SELL */}
               <div className="grid grid-cols-2 gap-1 bg-[#0c101b] p-1 rounded-lg border border-slate-800">
                 <button
                   type="button"
                   onClick={() => setTradeAction('BUY')}
                   className={`py-2 rounded-md font-black text-xs transition-colors cursor-pointer uppercase tracking-wider ${
                     tradeAction === 'BUY' 
                       ? 'bg-[#00AE64] text-white' 
                       : 'text-slate-400 hover:text-white'
                   }`}
                 >
                   BUY
                 </button>
                 <button
                   type="button"
                   onClick={() => setTradeAction('SELL')}
                   className={`py-2 rounded-md font-black text-xs transition-colors cursor-pointer uppercase tracking-wider ${
                     tradeAction === 'SELL' 
                       ? 'bg-rose-600 text-white' 
                       : 'text-slate-400 hover:text-white'
                   }`}
                 >
                   SELL
                 </button>
               </div>

               {/* Current Balances info */}
               <div className="bg-[#0c101b] rounded-lg border border-slate-800 p-3.5 space-y-2">
                 <div className="flex justify-between items-center text-xs">
                   <span className="text-slate-500 font-bold">Saldo Virtual</span>
                   <span className="text-white font-extrabold font-mono">${(userProfile?.balance || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                 </div>
                 <div className="flex justify-between items-center text-xs">
                   <span className="text-slate-500 font-bold">Saldo Aset ({selectedSymbol})</span>
                   <span className="text-[#00AE64] font-extrabold font-mono">
                     {(userProfile?.assets?.[selectedSymbol] || 0).toLocaleString(undefined, { maximumFractionDigits: 8 })} Units
                   </span>
                 </div>
               </div>

               {/* Amount input block */}
               <div className="space-y-2">
                 <label className="text-[11px] uppercase tracking-wider font-extrabold text-slate-400 font-sans block">Jumlah Pembelian / Penjualan</label>
                 <div className="relative">
                   <input
                     type="number"
                     step="any"
                     value={tradeAmount}
                     onChange={(e) => setTradeAmount(e.target.value)}
                     placeholder={`0.00 ${selectedSymbol}`}
                     className="w-full bg-[#0c101b] border border-slate-800 rounded-lg p-3 text-sm font-black font-mono text-white focus:outline-none focus:border-[#00AE64] focus:ring-2 focus:ring-[#00AE64]/10 transition-all placeholder:text-slate-700"
                     required
                   />
                   <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                     <button
                       type="button"
                       onClick={() => {
                         if (!userProfile) return;
                         if (tradeAction === 'BUY') {
                           const maxBuyUnits = userProfile.balance / (selectedCoinData.price || 1.0);
                           setTradeAmount(Number(maxBuyUnits.toFixed(6)).toString());
                         } else {
                           const maxSellUnits = userProfile.assets?.[selectedSymbol] || 0;
                           setTradeAmount(maxSellUnits.toString());
                         }
                       }}
                       className="text-[9px] font-black tracking-wider bg-[#00AE64]/10 hover:bg-[#00AE64]/20 text-[#00AE64] px-1.5 py-0.5 rounded cursor-pointer transition-colors"
                     >
                       MAX
                     </button>
                     <span className="text-xs font-black text-slate-500 uppercase">{selectedSymbol}</span>
                   </div>
                 </div>
               </div>

               {/* Estimations pricing details */}
               {tradeAmount && !isNaN(parseFloat(tradeAmount)) && parseFloat(tradeAmount) > 0 && (
                  <div className="bg-[#0c101b]/50 rounded-lg p-3 border border-slate-802 text-xs space-y-1.5 font-bold">
                     <div className="flex justify-between text-slate-400">
                        <span>Harga Eksekusi Broker</span>
                        <span className="text-white font-mono">${(selectedCoinData.price || 1.0).toLocaleString(undefined, { maximumFractionDigits: 4 })}</span>
                     </div>
                     <div className="flex justify-between text-slate-400">
                        <span>Total Nilai Transaksi</span>
                        <span className="text-white font-mono">
                          ${(parseFloat(tradeAmount) * (selectedCoinData.price || 1.0)).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </span>
                     </div>
                  </div>
               )}

               {/* Trigger button */}
               <button
                 type="submit"
                 disabled={tradeLoading}
                 className={`w-full font-black py-4.5 rounded-lg shadow-lg hover:shadow-[#00AE64]/10 text-xs tracking-widest uppercase transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 ${
                   tradeAction === 'BUY'
                     ? 'bg-[#00AE64] hover:bg-[#009656] text-white'
                     : 'bg-rose-600 hover:bg-rose-700 text-white'
                 }`}
               >
                 {tradeLoading ? (
                   <>
                     <Loader2 className="w-4 h-4 animate-spin text-white" /> Memproses Transaksi...
                   </>
                 ) : (
                   `${tradeAction} ${selectedSymbol} SEKARANG`
                 )}
               </button>
            </form>

            {/* Error or Success notification banner inside execute sidebar */}
            <div className="min-h-[100px] flex flex-col justify-end">
              <AnimatePresence mode="wait">
                {message && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.96, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={`rounded-lg p-3.5 text-xs font-bold ${
                      message.type === 'success' 
                        ? 'bg-emerald-950/20 border border-emerald-500/20 text-emerald-400' 
                        : 'bg-rose-950/20 border border-rose-500/20 text-rose-450'
                    }`}
                  >
                     <div className="flex items-start gap-2">
                        {message.type === 'success' ? (
                          <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        ) : (
                          <BulletIcon className="w-4 h-4 text-rose-500 shrink-0 mt-0.5 transform rotate-180" />
                        )}
                        <span className="leading-relaxed">{message.text}</span>
                     </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
