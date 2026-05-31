/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ChevronDown, Plus, Save, Maximize2, MoreVertical } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { useRealTimeCrypto } from '../hooks/useRealTimeCrypto';
import { useFirebase } from './FirebaseProvider';
import { OrderBookData } from '../types';

const initialOrderBooks: OrderBookData[] = [
  {
    symbol: 'BTC',
    price: 64230.50,
    change: -1240.20,
    changePercent: -1.89,
    logo: 'https://static.okx.com/cdn/oksupport/asset/currency/icon/btc.png',
    stats: {
      open: '65,470.70',
      high: '66,120.00',
      low: '63,900.50',
      prev: '65,470.70',
      lot: '2.25M',
      val: '1351.3B'
    },
    bids: [],
    offers: []
  },
  {
    symbol: 'ETH',
    price: 3450.75,
    change: 160.20,
    changePercent: 4.87,
    logo: 'https://static.okx.com/cdn/oksupport/asset/currency/icon/eth.png',
    stats: {
      open: '3,290.55',
      high: '3,510.00',
      low: '3,280.00',
      prev: '3,290.55',
      lot: '1.36M',
      val: '414.8B'
    },
    bids: [],
    offers: []
  },
  {
    symbol: 'SOL',
    price: 145.20,
    change: 5.40,
    changePercent: 3.86,
    logo: 'https://static.okx.com/cdn/oksupport/asset/currency/icon/sol.png',
    stats: {
      open: '139.80',
      high: '148.50',
      low: '138.20',
      prev: '139.80',
      lot: '386.98K',
      val: '28.4B'
    },
    bids: [],
    offers: []
  }
];

export default function Orderbook() {
  const { coins } = useFirebase();
  const initialCryptoData = useMemo(() => initialOrderBooks.map(ob => ({
    symbol: ob.symbol,
    name: ob.symbol,
    price: ob.price,
    change: ob.change,
    changePercent: ob.changePercent,
    sparkline: []
  })), []);

  const livePrices = useRealTimeCrypto(initialCryptoData, coins);

  const orderbooks = useMemo(() => {
    // Generate listed items dynamically, starting with initial ones
    const obs = [...initialOrderBooks];

    // Merge any custom user coins that have been listed
    coins.forEach(c => {
      if (c.status === 'Listed') {
        const symbol = c.symbol;
        if (!obs.some(o => o.symbol === symbol)) {
          const price = Number(c.currentPrice || c.initialPrice) || 0.1;
          const change = price - Number(c.initialPrice);
          const changePercent = Number(c.initialPrice) > 0 ? (change / Number(c.initialPrice)) * 100 : 0;
          obs.push({
            symbol: c.symbol,
            price: price,
            change: change,
            changePercent: changePercent,
            logo: c.logo || `https://api.dicebear.com/7.x/identicon/svg?seed=${c.symbol}`,
            stats: {
              open: Number(c.initialPrice).toLocaleString(undefined, { maximumFractionDigits: 3 }),
              high: (price * 1.05).toLocaleString(undefined, { maximumFractionDigits: 3 }),
              low: Math.max(0.00000001, price * 0.95).toLocaleString(undefined, { maximumFractionDigits: 3 }),
              prev: Number(c.initialPrice).toLocaleString(undefined, { maximumFractionDigits: 3 }),
              lot: (Number(c.volume24h || 0) / (price || 1)).toLocaleString(undefined, { maximumFractionDigits: 0 }),
              val: Number(c.volume24h || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })
            },
            bids: [],
            offers: []
          });
        }
      }
    });

    return obs.map(ob => {
      // Find customCoin attributes for trading pressure logic
      const customCoin = coins.find(c => c.symbol === ob.symbol);
      const buyVol = customCoin ? (Number(customCoin.buyVolume) || 0) : 0;
      const sellVol = customCoin ? (Number(customCoin.sellVolume) || 0) : 0;
      
      let buyWeight = 1.0;
      let sellWeight = 1.0;
      if (buyVol > 0 || sellVol > 0) {
        const totalVol = buyVol + sellVol;
        buyWeight = (buyVol / totalVol) * 2;
        sellWeight = (sellVol / totalVol) * 2;
      }

      const live = livePrices.find(p => p.symbol === ob.symbol) || ob;
      const price = live.price;
      
      // Generate synthetic bids/offers incorporating the buy/sell real volumes
      const bids = Array.from({ length: 7 }, (_, i) => ({
        freq: (Math.floor(Math.random() * 500 * buyWeight) + 50).toLocaleString(),
        lot: (Math.floor(Math.random() * 10000 * buyWeight) + 100).toLocaleString(),
        price: price - (i * (price * 0.0005))
      }));
      
      const offers = Array.from({ length: 7 }, (_, i) => ({
        freq: (Math.floor(Math.random() * 500 * sellWeight) + 50).toLocaleString(),
        lot: (Math.floor(Math.random() * 10000 * sellWeight) + 100).toLocaleString(),
        price: price + ((i + 1) * (price * 0.0005))
      }));

      return {
        ...ob,
        price,
        change: live.change,
        changePercent: live.changePercent,
        bids,
        offers
      };
    });
  }, [livePrices, coins]);

  return (
    <div className="mt-4 space-y-4">
      {/* Search/Controls Bar */}
      <div className="bg-white border border-gray-200 rounded-sm p-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-3 py-1 rounded transition-colors group">
          <span className="text-sm font-bold text-gray-800">Orderbook</span>
          <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 bg-[#00AE64] rounded-full mr-4 animate-pulse"></div>
          <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded transition-all">
            <Plus className="w-4 h-4" />
          </button>
          <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded transition-all border-l pl-3 ml-1">
            <Save className="w-4 h-4" />
          </button>
          <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded transition-all">
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Orderbook Cards Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {orderbooks.map((ob) => (
          <div key={ob.symbol} className="bg-white border border-gray-200 rounded-sm shadow-sm overflow-hidden flex flex-col">
            {/* Card Header */}
            <div className="p-4 border-b border-gray-50">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-gray-50 border border-gray-100 rounded px-2.5 py-2 flex items-center gap-3 min-w-[200px]">
                  <div className="w-5 h-5 bg-white rounded-full border border-gray-200 p-0.5 flex items-center justify-center overflow-hidden">
                    <img src={ob.logo} alt={ob.symbol} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                  </div>
                  <span className="font-bold text-sm text-gray-800">{ob.symbol}</span>
                  <div className="h-4 w-[1px] bg-gray-200"></div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm tabular-nums">{ob.price.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    <span className={`text-[10px] font-bold ${ob.change >= 0 ? 'text-[#00AE64]' : 'text-red-500'}`}>
                       {ob.change >= 0 ? '▲' : '▼'} {Math.abs(ob.change).toFixed(0)} ({ob.changePercent.toFixed(2)}%)
                    </span>
                  </div>
                </div>
                <button className="text-gray-300 hover:text-gray-500">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-y-3 gap-x-6">
                <StatItem label="Open" value={ob.stats.open} color="text-[#00AE64]" />
                <StatItem label="Prev" value={ob.stats.prev} color="text-yellow-600" />
                <StatItem label="Lot" value={ob.stats.lot} color="text-red-500" />
                
                <StatItem label="High" value={ob.stats.high} color="text-[#00AE64]" />
                <StatItem label="ARA" value="7,150" color="text-gray-400" />
                <StatItem label="Val" value={ob.stats.val} color="text-red-500" />
                
                <StatItem label="Low" value={ob.stats.low} color="text-red-500" />
                <StatItem label="ARB" value="5,230" color="text-gray-400" />
                <StatItem label="Avg" value="6,450" color="text-gray-400" />
                
                <StatItem label="F Buy" value="872.1 B" color="text-[#00AE64]" />
                <StatItem label="F Sell" value="1.2 T" color="text-red-500" />
                <StatItem label="Freq" value="33,584" color="text-gray-700" />
              </div>
            </div>

            {/* Depth Table */}
            <div className="flex-1 overflow-auto">
              <table className="w-full text-[10px] border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100 text-gray-400 font-bold">
                    <th className="px-2 py-2 text-center font-bold">Freq</th>
                    <th className="px-2 py-2 text-right font-bold">Lot</th>
                    <th className="px-2 py-2 text-right font-bold">Bid</th>
                    <th className="px-2 py-2 text-left font-bold pl-4 border-l border-gray-100">Offer</th>
                    <th className="px-2 py-2 text-left font-bold">Lot</th>
                    <th className="px-2 py-2 text-center font-bold">Freq</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                      <td className="px-2 py-1.5 text-center text-blue-500 font-medium tabular-nums">{ob.bids[i]?.freq}</td>
                      <td className="px-2 py-1.5 text-right text-gray-700 font-medium tabular-nums">{ob.bids[i]?.lot}</td>
                      <td className="px-2 py-1.5 text-right text-red-500 font-bold tabular-nums bg-red-50/20">{ob.bids[i]?.price.toLocaleString()}</td>
                      
                      <td className="px-2 py-1.5 text-left text-[#00AE64] font-bold tabular-nums pl-4 border-l border-gray-100 bg-[#00AE64]/5">{ob.offers[i]?.price.toLocaleString()}</td>
                      <td className="px-2 py-1.5 text-left text-gray-700 font-medium tabular-nums">{ob.offers[i]?.lot}</td>
                      <td className="px-2 py-1.5 text-center text-blue-500 font-medium tabular-nums">{ob.offers[i]?.freq}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatItem({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex items-center justify-between gap-1">
      <span className="text-[10px] text-gray-400 font-medium">{label}</span>
      <span className={`text-[10px] font-bold tabular-nums ${color}`}>{value}</span>
    </div>
  );
}
