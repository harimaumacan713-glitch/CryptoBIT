import React, { useState, useEffect } from 'react';
import { Shield, TrendingUp, TrendingDown, DollarSign, Activity, AlertCircle, BarChart3, Newspaper } from 'lucide-react';
import { useFirebase } from './FirebaseProvider';

export default function FedDashboard() {
  const { user, db, coins } = useFirebase();
  const [loading, setLoading] = useState(true);

  // Simulation: Global Metrics
  const [metrics, setMetrics] = useState({
    marketCap: 452093847200,
    volume24h: 320492840,
    activeCoins: 0,
    sentiment: 72, // 0-100
  });

  useEffect(() => {
    // Basic aggregation from coin list
    if (coins && coins.length > 0) {
      setMetrics(prev => ({
        ...prev,
        activeCoins: coins.length,
        marketCap: coins.reduce((acc, c) => acc + (c.marketCap || 100000), 0)
      }));
      setLoading(false);
    }
  }, [coins]);

  const [activeSubTab, setActiveSubTab] = useState('Dashboard');

  return (
    <div className="p-6 bg-gray-50 min-h-screen text-slate-900 font-sans">
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="w-8 h-8 text-blue-900" />
            FEDERAL RESERVE DIGITAL SYSTEM
          </h1>
        </div>
        <div className="flex gap-2">
            {['Dashboard', 'FOMC', 'Reserve Bank', 'News'].map(tab => (
              <button 
                key={tab} 
                onClick={() => setActiveSubTab(tab)}
                className={`text-xs font-bold px-4 py-2 rounded uppercase ${activeSubTab === tab ? 'bg-blue-900 text-white' : 'bg-white border'}`}
              >
                {tab}
              </button>
            ))}
        </div>
      </header>

      {activeSubTab === 'Dashboard' && (
        <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                {[
                  { label: 'Total Market Cap', value: `$${(metrics.marketCap / 1e9).toFixed(2)}B`, Icon: DollarSign },
                  { label: '24h Volume', value: `$${(metrics.volume24h / 1e6).toFixed(2)}M`, Icon: Activity },
                  { label: 'Active Coins', value: metrics.activeCoins, Icon: BarChart3 },
                  { label: 'Market Sentiment', value: `${metrics.sentiment > 50 ? 'BULLISH' : 'BEARISH'} (${metrics.sentiment})`, Icon: metrics.sentiment > 50 ? TrendingUp : TrendingDown },
                ].map((item, i) => (
                  <div key={i} className="bg-white p-4 rounded shadow-sm border border-gray-200">
                    <div className="flex items-center gap-2 mb-2 text-gray-500">
                      <item.Icon className="w-4 h-4" />
                      <span className="text-xs uppercase tracking-wider">{item.label}</span>
                    </div>
                    <div className="text-xl font-black font-mono">{item.value}</div>
                  </div>
                ))}
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white p-6 rounded shadow-sm border border-gray-200">
                  <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
                    <Newspaper className="w-5 h-5 text-blue-900" />
                    FOMC & MARKET UPDATES
                  </h2>
                  <div className="space-y-4 text-sm">
                     <div className="border-l-4 border-blue-900 pl-4 py-2 bg-gray-50">
                       <span className="text-[10px] font-bold text-blue-900 uppercase">Policy Update</span>
                       <p className="font-medium">Market liquidity increased by 2% to stabilize volatility in low-cap assets.</p>
                     </div>
                  </div>
                </div>
                <div className="bg-white p-6 rounded shadow-sm border border-gray-200">
                  <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
                    <Shield className="w-5 h-5 text-gray-800" />
                    DIGITAL RESERVE BANK
                  </h2>
                  <div className="space-y-4 text-xs font-mono">
                    <div className="flex justify-between"><span>Liquidity Reserve</span> <span className="font-bold">$42,902,301</span></div>
                    <button className="w-full mt-4 bg-gray-900 text-white py-2 rounded text-xs font-bold uppercase hover:bg-gray-800">
                      Inject Liquidity
                    </button>
                  </div>
                </div>
            </div>
        </>
      )}
      {activeSubTab === 'FOMC' && <div>FOMC Content</div>}
      {/* ... */}
    </div>
  );
}
