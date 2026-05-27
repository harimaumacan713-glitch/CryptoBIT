/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MoreVertical, X, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { useFirebase } from './FirebaseProvider';

const MOCK_PRICES: Record<string, number> = {
  'USD': 1,
  'BTC': 96345.75,
  'ETH': 2760.00,
  'USDT': 1.00,
  'AIX': 0.25,
  'META': 0.05,
  'NOVA': 1.25,
  'GRN': 0.1,
  'DFC': 0.5
};

import { useRealTimeCrypto } from '../hooks/useRealTimeCrypto';
import { WATCHLIST_COINS } from '../utils/constants';

export default function Portfolio() {
  const { orders, user, userProfile } = useFirebase();
  const cryptos = useRealTimeCrypto(WATCHLIST_COINS);
  const [activeTab, setActiveTab] = useState('Holdings');

  if (!user || !userProfile) {
    return (
      <div className="flex flex-col items-center justify-center p-20 bg-white border border-gray-200 rounded-sm shadow-sm mt-4">
        <Clock className="w-12 h-12 text-[#00AE64] mb-4 animate-pulse" />
        <h2 className="text-xl font-bold">Please Login</h2>
        <p className="text-gray-500 text-sm mt-2">Log in to view your portfolio and IPO orders.</p>
      </div>
    );
  }

  let totalInvested = 0;
  let totalCurrentValue = 0;

  // Compute portfolio metrics
  const holdEntries = (Object.entries(userProfile.assets || {}) as [string, number][]).filter(([_, amt]) => amt > 0);
  holdEntries.forEach(([symbol, balance]) => {
    const cryptoInfo = cryptos.find(c => c.symbol === symbol);
    const price = cryptoInfo ? cryptoInfo.price : (MOCK_PRICES[symbol] || 0.1);
    const invested = userProfile.assetsInvested?.[symbol] || (balance * (price * 0.9));
    const currentVal = balance * price;
    totalInvested += invested;
    totalCurrentValue += currentVal;
  });

  const totalPl = totalCurrentValue - totalInvested;
  const totalPlPercentage = totalInvested > 0 ? (totalPl / totalInvested) * 100 : 0;
  const isTotalPositive = totalPl >= 0;
  const totalEquity = userProfile.balance + totalCurrentValue;

  return (
    <div className="mt-4 space-y-4">
      {/* Tab Selectors */}
      <div className="flex border-b border-gray-200">
        {['Holdings', 'IPO Orders', 'History'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 text-xs font-bold uppercase tracking-widest relative transition-colors ${
              activeTab === tab ? 'text-[#00AE64]' : 'text-gray-400 hover:text-gray-700'
            }`}
          >
            {tab}
            {activeTab === tab && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00AE64]" />
            )}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 bg-white border border-gray-200 rounded-sm overflow-hidden divide-x divide-gray-100 shadow-sm">
        <div className="p-4 flex flex-col items-center justify-center">
          <span className="text-sm font-bold text-gray-900">${userProfile.balance.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
          <span className="text-[10px] text-gray-400 font-medium uppercase mt-1 tracking-tighter">Virtual Balance</span>
        </div>
        <div className="p-4 flex flex-col items-center justify-center">
          <span className="text-sm font-bold text-gray-900">${totalInvested.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
          <span className="text-[10px] text-gray-400 font-medium uppercase mt-1 tracking-tighter">Invested</span>
        </div>
        <div className="p-4 flex flex-col items-center justify-center">
          <span className="text-sm font-bold text-[#00AE64]">{orders.length}</span>
          <span className="text-[10px] text-gray-400 font-medium uppercase mt-1 tracking-tighter">IPO Orders</span>
        </div>
        <div className="p-4 flex flex-col items-center justify-center">
          <span className={`text-sm font-bold font-black ${isTotalPositive ? 'text-[#00AE64]' : 'text-red-500'}`}>
            {isTotalPositive ? '+' : ''}${totalPl.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} ({isTotalPositive ? '+' : ''}{totalPlPercentage.toFixed(2)}%)
          </span>
          <span className="text-[10px] text-gray-400 font-medium uppercase mt-1 tracking-tighter">Total P/L</span>
        </div>
        <div className="p-4 flex flex-col items-center justify-center">
          <span className="text-sm font-bold text-gray-900">${totalEquity.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
          <span className="text-[10px] text-gray-400 font-medium uppercase mt-1 tracking-tighter">Total Equity</span>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-sm shadow-sm overflow-hidden min-h-[400px]">
        {activeTab === 'Holdings' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100 italic">
                  <th className="px-4 py-3 text-[11px] font-black text-[#00AE64] uppercase">Symbol</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-gray-400 uppercase text-right">Balance</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-gray-400 uppercase text-right tracking-tight">Avg Price</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-gray-400 uppercase text-right tracking-tight">Curr Price</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-gray-400 uppercase text-right">Invested</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-gray-400 uppercase text-right">Potential P/L</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-gray-400 uppercase text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {Object.keys(userProfile.assets || {}).length === 0 ? (
                   <tr>
                     <td colSpan={7} className="py-20 text-center text-gray-400 text-sm italic">You don't hold any assets yet. Buy some in Crypto IPO.</td>
                   </tr>
                ) : (
                  (Object.entries(userProfile.assets || {}) as [string, number][]).filter(([_, amt]) => amt > 0).map(([symbol, balance]) => {
                    const cryptoInfo = cryptos.find(c => c.symbol === symbol);
                    const price = cryptoInfo ? cryptoInfo.price : (MOCK_PRICES[symbol] || 0.1);
                    const invested = userProfile.assetsInvested?.[symbol] || (balance * (price * 0.9)); 
                    const currentVal = balance * price;
                    const pl = currentVal - invested;
                    const percentage = invested > 0 ? (pl / invested) * 100 : 0;
                    const isPositive = pl >= 0;

                    return (
                      <tr key={symbol} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-gray-50 rounded-full border border-gray-100 p-1 flex items-center justify-center overflow-hidden">
                               <img src={cryptoInfo?.logo || `https://api.dicebear.com/7.x/identicon/svg?seed=${symbol}`} alt={symbol} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                            </div>
                            <span className="font-black text-sm text-gray-900">{symbol}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm font-bold text-gray-700 text-right tabular-nums">{balance.toLocaleString()}</td>
                        <td className="px-4 py-4 text-sm font-bold text-gray-700 text-right tabular-nums">${invested > 0 ? (invested / balance).toLocaleString(undefined, { maximumFractionDigits: 4 }) : 'N/A'}</td>
                        <td className="px-4 py-4 text-sm font-bold text-gray-700 text-right tabular-nums">${price.toLocaleString(undefined, { maximumFractionDigits: 4 })}</td>
                        <td className="px-4 py-4 text-sm font-bold text-gray-700 text-right tabular-nums">${invested.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                        <td className={`px-4 py-4 text-sm font-black text-right tabular-nums ${isPositive ? 'text-[#00AE64]' : 'text-red-500'}`}>
                          {isPositive ? '+' : ''}{pl.toLocaleString(undefined, { maximumFractionDigits: 2 })} ({isPositive ? '+' : ''}{percentage.toFixed(2)}%)
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-center gap-2">
                             <button className="text-gray-300 hover:text-gray-600"><MoreVertical className="w-4 h-4" /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'IPO Orders' && (
          <div className="p-0 overflow-x-auto">
             <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#00AE64]/5 border-b border-[#00AE64]/10 italic">
                  <th className="px-4 py-3 text-[11px] font-black text-[#00AE64] uppercase">Coin / Symbol</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-gray-400 uppercase text-right">Order Qty</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-gray-400 uppercase text-right">IPO Price</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-gray-400 uppercase text-right">Est. Listing</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-gray-400 uppercase text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-20 text-center text-gray-400 text-sm italic">You have no active IPO orders.</td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr key={order.id} className="hover:bg-[#00AE64]/5 transition-colors">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                           <div className="w-6 h-6 bg-[#00AE64]/10 rounded flex items-center justify-center text-[10px] font-black text-[#00AE64]">{order.coinSymbol[0]}</div>
                           <span className="font-black text-sm text-gray-900">{order.coinSymbol}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm font-bold text-gray-700 text-right tabular-nums">{order.amount.toLocaleString()}</td>
                      <td className="px-4 py-4 text-sm font-bold text-gray-700 text-right tabular-nums">${order.price.toFixed(3)}</td>
                      <td className="px-4 py-4 text-sm font-bold text-gray-500 text-right tabular-nums">{new Date(order.listingDate).toLocaleDateString()}</td>
                      <td className="px-4 py-4">
                         <div className="flex items-center justify-center">
                            <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${
                              order.status === 'Success' ? 'bg-[#00AE64] text-white' :
                              order.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {order.status}
                            </span>
                         </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'History' && (
           <div className="flex flex-col items-center justify-center h-full min-h-[300px]">
              <AlertCircle className="w-12 h-12 text-gray-200 mb-4" />
              <p className="text-gray-400 text-sm italic">No recent transactions found.</p>
           </div>
        )}
      </div>
    </div>
  );
}
