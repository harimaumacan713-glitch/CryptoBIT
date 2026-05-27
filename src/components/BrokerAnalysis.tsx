import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Activity, ArrowDownRight, ArrowUpRight, ArrowRight, BarChart2, Database, 
  Droplet, Eye, Globe2, Layers, LineChart, PieChart, 
  ShieldAlert, TrendingUp, Zap, Clock, ShieldCheck, 
  Wallet, SignalHigh, Flame, Search
} from 'lucide-react';
import { 
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, 
  ComposedChart, Legend, Line, LineChart as RechartsLineChart, 
  ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceLine
} from 'recharts';
import WhaleTracker from './WhaleTracker';

export default function BrokerAnalysis() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [realtimeData, setRealtimeData] = useState<any[]>([]);
  const [fearGreed, setFearGreed] = useState(65);
  const [exchangeFlow, setExchangeFlow] = useState<any[]>([]);

  useEffect(() => {
    // Simulate loading
    setTimeout(() => setIsLoaded(true), 1500);

    // Initial Data
    const initialRealtime = Array.from({ length: 60 }, (_, i) => ({
      time: new Date(Date.now() - (60 - i) * 1000).toISOString().split('T')[1].split('.')[0],
      price: 64000 + Math.random() * 500,
      volume: Math.random() * 100,
      accum: 50 + Math.random() * 20
    }));

    const initialFlow = Array.from({ length: 24 }, (_, i) => ({
      hour: `${i}:00`,
      inflow: Math.random() * 500 + 100,
      outflow: -(Math.random() * 400 + 100),
    }));

    setRealtimeData(initialRealtime);
    setExchangeFlow(initialFlow);

    // Realtime Updates
    const interval = setInterval(() => {
      setRealtimeData(prev => {
        const last = prev[prev.length - 1];
        const newPrice = last.price + (Math.random() - 0.5) * 100;
        const newPoint = {
          time: new Date().toISOString().split('T')[1].split('.')[0],
          price: newPrice,
          volume: Math.random() * 150,
          accum: last.accum + (Math.random() - 0.5) * 5
        };
        return [...prev.slice(1), newPoint];
      });

      setFearGreed(prev => {
        const next = prev + (Math.random() - 0.5) * 4;
        return Math.max(0, Math.min(100, next));
      });

    }, 2000);

    return () => clearInterval(interval);
  }, []);

  if (!isLoaded) {
    return (
      <div className="w-full h-full min-h-[800px] bg-[#0A0E17] rounded-xl flex items-center justify-center border border-gray-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="flex flex-col items-center gap-6 z-10">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-[#00AE64]/20 border-t-[#00AE64] rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Activity className="w-8 h-8 text-[#00AE64] animate-pulse" />
            </div>
          </div>
          <div className="flex flex-col items-center">
             <h2 className="text-xl font-bold text-white tracking-widest uppercase">Initializing Analytics</h2>
             <p className="text-gray-400 text-sm mt-2 flex items-center gap-2">
               Connecting to global data streams <span className="flex gap-1"><span className="w-1 h-1 bg-[#00AE64] rounded-full animate-bounce"></span><span className="w-1 h-1 bg-[#00AE64] rounded-full animate-bounce delay-100"></span><span className="w-1 h-1 bg-[#00AE64] rounded-full animate-bounce delay-200"></span></span>
             </p>
          </div>
        </div>
      </div>
    );
  }

  const getSentimentText = (fg: number) => {
    if (fg >= 75) return 'Extreme Greed';
    if (fg >= 55) return 'Greed';
    if (fg >= 45) return 'Neutral';
    if (fg >= 25) return 'Fear';
    return 'Extreme Fear';
  };

  const getSentimentColor = (fg: number) => {
    if (fg >= 55) return 'text-[#00AE64]';
    if (fg >= 45) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full bg-[#0A0E17] text-white p-6 rounded-xl border border-gray-800 shadow-2xl relative overflow-hidden"
    >
      {/* Background accents */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#00AE64]/10 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="flex items-center justify-between mb-8 relative z-10">
        <div>
          <h1 className="text-3xl font-black italic tracking-tighter uppercase flex items-center gap-3">
             <Globe2 className="text-[#00AE64] animate-pulse w-8 h-8" />
             Global Broker Analytics
          </h1>
          <p className="text-gray-400 text-sm mt-1 flex items-center gap-2">
             <span className="flex items-center gap-1 text-[#00AE64]">
               <span className="w-2 h-2 rounded-full bg-[#00AE64] animate-ping"></span>
               Live
             </span>
             Institutional & Market Data Stream (Low Latency)
          </p>
        </div>
        <div className="flex gap-4">
           <div className="bg-[#111827] border border-gray-800 px-4 py-2 rounded-lg flex flex-col items-end shadow-inner">
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Network Ping</span>
              <span className="text-[#00AE64] font-mono text-sm font-bold flex items-center gap-1">12ms <SignalHigh className="w-3 h-3"/></span>
           </div>
           <div className="bg-[#111827] border border-gray-800 px-4 py-2 rounded-lg flex flex-col items-end shadow-inner">
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Data nodes</span>
              <span className="text-blue-400 font-mono text-sm font-bold flex items-center gap-1">2,481 <Database className="w-3 h-3"/></span>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 relative z-10">
        
        {/* Main Chart Column (Span 3) */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Top Panel - Advanced Analytics Chart */}
          <div className="bg-[#111827]/80 backdrop-blur-md rounded-xl border border-gray-800 p-5 shadow-lg group relative overflow-hidden">
             {/* Glow effect on hover */}
             <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -rotate-45 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000 ease-out"></div>
             
             <div className="flex justify-between items-center mb-6">
                <div>
                   <h3 className="font-bold text-lg flex items-center gap-2 text-gray-100">
                     <LineChart className="w-5 h-5 text-blue-500"/>
                     Smart Money Flow & Trend Analysis
                   </h3>
                   <div className="flex gap-4 mt-2">
                      <div className="flex items-center gap-2">
                         <div className="w-2 h-2 rounded-full bg-[#00AE64]"></div>
                         <span className="text-xs text-gray-400 uppercase tracking-widest">Global Aggregated Price </span>
                      </div>
                      <div className="flex items-center gap-2">
                         <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                         <span className="text-xs text-gray-400 uppercase tracking-widest">Accumulation Index</span>
                      </div>
                   </div>
                </div>
                <div className="flex gap-2">
                  <button className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-xs font-bold rounded-md transition-colors">1M</button>
                  <button className="px-3 py-1 bg-[#2563EB] text-white text-xs font-bold rounded-md transition-colors shadow-lg shadow-blue-500/20">LIVE</button>
                </div>
             </div>

             <div className="h-[350px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                 <ComposedChart data={realtimeData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                   <defs>
                     <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="5%" stopColor="#00AE64" stopOpacity={0.3}/>
                       <stop offset="95%" stopColor="#00AE64" stopOpacity={0}/>
                     </linearGradient>
                     <linearGradient id="colorAccum" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                       <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                     </linearGradient>
                   </defs>
                   <CartesianGrid strokeDasharray="3 3" stroke="#2D3748" vertical={false} />
                   <XAxis dataKey="time" stroke="#4B5563" fontSize={10} tickMargin={10} minTickGap={30} />
                   <YAxis yAxisId="left" stroke="#4B5563" fontSize={10} domain={['auto', 'auto']} tickFormatter={(v) => `$${v.toLocaleString()}`} />
                   <YAxis yAxisId="right" orientation="right" stroke="#4B5563" fontSize={10} domain={['auto', 'auto']} />
                   <Tooltip 
                     contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                     itemStyle={{ color: '#fff' }}
                   />
                   <Area yAxisId="left" type="monotone" dataKey="price" stroke="#00AE64" strokeWidth={2} fillOpacity={1} fill="url(#colorPrice)" isAnimationActive={false} />
                   <Line yAxisId="right" type="monotone" dataKey="accum" stroke="#3B82F6" strokeWidth={2} dot={false} isAnimationActive={false} />
                   <Bar yAxisId="right" dataKey="volume" fill="#4B5563" opacity={0.3} barSize={4} />
                 </ComposedChart>
               </ResponsiveContainer>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Exchange Flow */}
            <div className="bg-[#111827]/80 backdrop-blur-md rounded-xl border border-gray-800 p-5 shadow-lg">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="font-bold text-sm flex items-center gap-2 text-gray-100">
                   <Droplet className="w-4 h-4 text-purple-500"/>
                   Exchange Net Flow
                 </h3>
                 <span className="text-[10px] bg-purple-500/10 text-purple-400 px-2 py-1 rounded font-mono">Binance + Coinbase</span>
              </div>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={exchangeFlow} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2D3748" vertical={false} />
                    <XAxis dataKey="hour" stroke="#4B5563" fontSize={9} />
                    <YAxis stroke="#4B5563" fontSize={9} />
                    <Tooltip cursor={{fill: '#1F2937'}} contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', color: '#fff', fontSize: '12px' }}/>
                    <ReferenceLine y={0} stroke="#4B5563" />
                    <Bar dataKey="inflow" fill="#00AE64" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="outflow" fill="#EF4444" radius={[0, 0, 2, 2]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-between mt-4 border-t border-gray-800 pt-3">
                 <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">Total Inflow (24h)</p>
                    <p className="font-bold text-sm text-[#00AE64] mt-0.5">+$1.24B</p>
                 </div>
                 <div className="text-right">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">Total Outflow (24h)</p>
                    <p className="font-bold text-sm text-red-500 mt-0.5">-$980M</p>
                 </div>
              </div>
            </div>

            {/* Smart Wallet Tracking / Trending Assets */}
            <div className="bg-[#111827]/80 backdrop-blur-md rounded-xl border border-gray-800 p-5 shadow-lg flex flex-col">
              <h3 className="font-bold text-sm flex items-center gap-2 text-gray-100 mb-4">
                <Flame className="w-4 h-4 text-orange-500"/>
                Top Market Activity (High Momentum)
              </h3>
              
              <div className="flex-1 space-y-4">
                 {[
                   { symbol: 'BTC', vol: '42.1B', trend: '+2.4%', type: 'Accumulation' },
                   { symbol: 'ETH', vol: '18.4B', trend: '+1.1%', type: 'Distribution' },
                   { symbol: 'SOL', vol: '8.2B', trend: '+8.4%', type: 'High Buying' },
                   { symbol: 'DOGE', vol: '4.1B', trend: '-1.4%', type: 'Neutral' },
                 ].map((coin, i) => (
                   <div key={i} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-800/50 transition-colors border border-transparent hover:border-gray-700 cursor-pointer">
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center font-bold text-[10px]">
                            {coin.symbol}
                         </div>
                         <div>
                            <p className="font-bold text-xs">{coin.symbol} <span className="text-gray-500 font-normal">/ USD</span></p>
                            <p className="text-[9px] text-gray-400 mt-0.5 flex flex-wrap gap-1 items-center">
                              Vol: {coin.vol}
                              <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
                              <span className={coin.type === 'Distribution' ? 'text-orange-400' : 'text-blue-400'}>{coin.type}</span>
                            </p>
                         </div>
                      </div>
                      <div className={`text-xs font-mono font-bold ${coin.trend.startsWith('+') ? 'text-[#00AE64]' : 'text-red-500'}`}>
                         {coin.trend}
                      </div>
                   </div>
                 ))}
              </div>
            </div>
          </div>

        </div>

        {/* Right Side Column */}
        <div className="space-y-6 flex flex-col h-full">
          
          {/* Market Sentiment (Fear & Greed) */}
          <div className="bg-[#111827]/80 backdrop-blur-md rounded-xl border border-gray-800 p-5 shadow-lg">
             <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-sm flex items-center gap-2 text-gray-100">
                  <PieChart className="w-4 h-4 text-emerald-400"/>
                  Market Sentiment
                </h3>
             </div>
             <div className="flex flex-col items-center py-4 relative">
                {/* Simulated Speedometer */}
                <div className="relative w-40 h-20 overflow-hidden">
                   <div className="absolute top-0 left-0 w-40 h-40 rounded-full border-[10px] border-gray-800 border-t-red-500 border-l-yellow-500 border-r-[#00AE64] border-b-transparent transform rotate-45 opacity-80"></div>
                   <div 
                     className="absolute bottom-0 left-[50%] w-0.5 h-16 bg-white origin-bottom transition-transform duration-500 ease-out"
                     style={{ transform: `translateX(-50%) rotate(${(fearGreed / 100) * 180 - 90}deg)` }}
                   >
                     <div className="w-2 h-2 rounded-full bg-white absolute -top-1 -left-[3px] shadow-[0_0_10px_#fff]"></div>
                   </div>
                </div>
                
                <div className="mt-4 text-center">
                   <p className={`text-2xl font-black ${getSentimentColor(fearGreed)} font-mono`}>
                     {Math.round(fearGreed)}
                   </p>
                   <p className="text-xs uppercase tracking-widest text-gray-400 font-bold mt-1">
                     {getSentimentText(fearGreed)}
                   </p>
                </div>

                {/* Pressure Meter */}
                <div className="w-full mt-6 space-y-2">
                   <div className="flex justify-between text-[10px] text-gray-400 uppercase font-bold">
                     <span>Selling Pressure</span>
                     <span>Buying Pressure</span>
                   </div>
                   <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden flex">
                      <div className="h-full bg-red-500 transition-all duration-500" style={{ width: `${100 - fearGreed}%` }}></div>
                      <div className="h-full bg-[#00AE64] transition-all duration-500" style={{ width: `${fearGreed}%` }}></div>
                   </div>
                </div>
             </div>
          </div>

          {/* Whale Activity Feed */}
          <div className="flex-1 flex flex-col min-h-[400px]">
             <WhaleTracker />
          </div>
        </div>

      </div>
    </motion.div>
  );
}