/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MoreVertical, X, Clock, CheckCircle2, AlertCircle, Share2, Download, MessageCircle, Twitter } from 'lucide-react';
import { useState, useRef } from 'react';
import * as htmlToImage from 'html-to-image';
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
  const { orders, user, userProfile, tradeCrypto } = useFirebase();
  const cryptos = useRealTimeCrypto(WATCHLIST_COINS);
  const [activeTab, setActiveTab] = useState('Holdings');
  
  const [activeActionMenu, setActiveActionMenu] = useState<string | null>(null);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [isProcessingTitle, setIsProcessingTitle] = useState(false);
  const shareRef = useRef<HTMLDivElement>(null);

  const handleClosePosition = async () => {
    if (!selectedAsset) return;
    setIsProcessingTitle(true);
    try {
      await tradeCrypto('sell', selectedAsset.symbol, selectedAsset.balance, selectedAsset.price);
      setShowCloseModal(false);
      setSelectedAsset(null);
    } catch (e) {
      console.error(e);
      alert('Failed to close position.');
    }
    setIsProcessingTitle(false);
  };

  const handleDownloadImage = async () => {
    if (!shareRef.current) return;
    try {
      const dataUrl = await htmlToImage.toPng(shareRef.current, { 
        quality: 0.95, 
        pixelRatio: 2,
        skipFonts: true,
      });
      const link = document.createElement('a');
      link.download = `CryptoBit-Share-${selectedAsset.symbol}-${new Date().getTime()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to generate image', err);
    }
  };

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
                          <div className="flex items-center justify-center gap-2 relative">
                             <button 
                               onClick={() => setActiveActionMenu(activeActionMenu === symbol ? null : symbol)}
                               className="text-gray-400 hover:text-gray-700 p-1 rounded hover:bg-gray-100 transition-colors"
                             >
                               <MoreVertical className="w-5 h-5" />
                             </button>
                             {activeActionMenu === symbol && (
                               <>
                                 <div className="fixed inset-0 z-10" onClick={() => setActiveActionMenu(null)}></div>
                                 <div className="absolute right-8 top-0 mt-2 w-40 bg-[#1A1E29] rounded-lg shadow-xl overflow-hidden z-20 border border-gray-800">
                                   <button 
                                     onClick={() => {
                                        const entryPrice = invested > 0 ? (invested / balance) : 0;
                                        setSelectedAsset({ symbol, balance, price, currentVal, pl, percentage, invested, isPositive, entryPrice });
                                        setShowCloseModal(true);
                                        setActiveActionMenu(null);
                                     }}
                                     className="w-full text-left px-4 py-3 text-sm text-red-500 hover:bg-gray-800 font-bold transition-colors"
                                   >
                                     Close Position
                                   </button>
                                   <button 
                                     onClick={() => {
                                        const entryPrice = invested > 0 ? (invested / balance) : 0;
                                        setSelectedAsset({ symbol, balance, price, currentVal, pl, percentage, invested, isPositive, entryPrice });
                                        setShowShareModal(true);
                                        setActiveActionMenu(null);
                                     }}
                                     className="w-full text-left px-4 py-3 text-sm text-gray-200 hover:bg-gray-800 font-bold transition-colors border-t border-gray-800"
                                   >
                                     Share Result
                                   </button>
                                 </div>
                               </>
                             )}
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

      {showCloseModal && selectedAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1A1E29] rounded-2xl w-full max-w-sm border border-gray-800 shadow-2xl overflow-hidden text-white">
            <div className="p-5 border-b border-gray-800 flex justify-between items-center bg-gray-900/50">
               <h3 className="font-bold text-lg">Close {selectedAsset.symbol} Position</h3>
               <button onClick={() => setShowCloseModal(false)} className="text-gray-400 hover:text-white transition-colors">
                  <X className="w-5 h-5"/>
               </button>
            </div>
            <div className="p-6 space-y-4">
               <div className="flex justify-between items-end border-b border-gray-800 pb-4">
                  <span className="text-gray-400 text-sm">Amount</span>
                  <span className="font-mono text-lg font-bold">{selectedAsset.balance.toLocaleString()}</span>
               </div>
               <div className="flex justify-between items-end border-b border-gray-800 pb-4">
                  <span className="text-gray-400 text-sm">Market Price</span>
                  <span className="font-mono text-lg font-bold">${selectedAsset.price.toLocaleString(undefined, {maximumFractionDigits: 4})}</span>
               </div>
               <div className="flex justify-between items-end pb-2">
                  <span className="text-gray-400 text-sm">Est. PNL</span>
                  <span className={`font-mono text-lg font-black ${selectedAsset.isPositive ? 'text-[#00AE64]' : 'text-red-500'}`}>
                    {selectedAsset.isPositive ? '+' : ''}${selectedAsset.pl.toLocaleString(undefined, {maximumFractionDigits: 2})}
                  </span>
               </div>
            </div>
            <div className="flex gap-3 p-5 pt-0 bg-gray-900/30">
               <button onClick={() => setShowCloseModal(false)} className="flex-1 py-3 bg-gray-800 text-gray-300 font-bold rounded-lg hover:bg-gray-700 transition-colors">Cancel</button>
               <button onClick={handleClosePosition} disabled={isProcessingTitle} className="flex-1 py-3 bg-[#00AE64] text-white font-bold rounded-lg hover:bg-[#009c5a] transition-colors disabled:opacity-50">Confirm Close</button>
            </div>
          </div>
        </div>
      )}

      {showShareModal && selectedAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-sm flex flex-col items-center my-auto">
             <div className="w-full flex justify-end mb-4">
                <button onClick={() => setShowShareModal(false)} className="text-gray-400 hover:text-white bg-gray-800/50 p-2 rounded-full backdrop-blur transition-colors">
                  <X className="w-6 h-6"/>
                </button>
             </div>
             
             {/* THE SHARE CARD */}
             <div ref={shareRef} className="w-[340px] h-[580px] bg-[#0B0E14] rounded-[32px] overflow-hidden relative shadow-2xl border border-gray-800 flex flex-col mx-auto shrink-0 select-none">
                {/* Background effects */}
                <div className={`absolute top-0 left-0 w-full h-[400px] opacity-20 blur-[80px] rounded-full pointer-events-none translate-y-[-50%] ${selectedAsset.isPositive ? 'bg-[#00AE64]' : 'bg-red-500'}`}></div>
                <div className="absolute inset-0 opacity-10 pointer-events-none mix-blend-overlay" style={{backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)', backgroundSize: '24px 24px'}}></div>
                
                {/* Header */}
                <div className="pt-8 px-8 flex justify-between items-center relative z-10 w-full mb-6">
                   <div className="flex items-center gap-2">
                       <span className="text-white font-black tracking-tight text-xl">CRYPTO<span className="text-[#00AE64]">BIT</span></span>
                   </div>
                   <span className="bg-gray-800 text-gray-300 text-[10px] font-bold px-2 py-1 rounded tracking-widest uppercase">Futures</span>
                </div>

                {/* Main Content */}
                <div className="px-8 flex-1 relative z-10 flex flex-col">
                   <div className="flex justify-between items-start mb-6">
                     <div className="flex flex-col">
                        <div className="flex items-center gap-2 mb-1">
                           <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center overflow-hidden shrink-0 shadow-lg">
                             <img src={`https://api.dicebear.com/7.x/identicon/svg?seed=${selectedAsset.symbol}`} alt="icon" className="w-4 h-4 object-contain" />
                           </div>
                           <h2 className="text-white font-black text-2xl tracking-tighter">{selectedAsset.symbol}/USD</h2>
                        </div>
                        <span className={`inline-flex items-center text-[11px] font-black uppercase tracking-widest px-2 py-0.5 rounded-sm w-fit mt-1 ${selectedAsset.isPositive ? 'bg-[#00AE64]/20 text-[#00AE64]' : 'bg-red-500/20 text-red-500'}`}>
                           SPOT {selectedAsset.isPositive ? 'LONG' : 'SHORT'}
                        </span>
                     </div>
                   </div>

                   <div className="mb-6 flex-1 flex flex-col justify-center">
                     <span className={`font-black tracking-tighter leading-none ${selectedAsset.percentage >= 100 || selectedAsset.percentage <= -100 ? 'text-6xl' : 'text-7xl'} ${selectedAsset.isPositive ? 'text-[#00AE64]' : 'text-red-500'}`}>
                       {selectedAsset.isPositive ? '+' : ''}{selectedAsset.percentage.toFixed(2)}%
                     </span>
                     <span className={`font-mono font-bold mt-2 text-xl ${selectedAsset.isPositive ? 'text-[#00AE64]' : 'text-red-500'}`}>
                       {selectedAsset.isPositive ? '+' : ''}${selectedAsset.pl.toLocaleString(undefined, {maximumFractionDigits: 2})}
                     </span>
                   </div>

                   <div className="grid grid-cols-2 gap-4 mb-8">
                     <div>
                       <span className="text-gray-500 text-[10px] uppercase font-bold tracking-widest block mb-1">Entry Price</span>
                       <span className="text-white font-mono font-bold text-sm">${selectedAsset.entryPrice.toLocaleString(undefined, {maximumFractionDigits: 4})}</span>
                     </div>
                     <div>
                       <span className="text-gray-500 text-[10px] uppercase font-bold tracking-widest block mb-1">Current Price</span>
                       <span className="text-white font-mono font-bold text-sm">${selectedAsset.price.toLocaleString(undefined, {maximumFractionDigits: 4})}</span>
                     </div>
                   </div>
                </div>

                {/* Footer */}
                <div className="px-8 pb-8 pt-6 border-t border-gray-800/50 flex justify-between items-end relative z-10 bg-[#0B0E14]">
                   <div className="flex items-center gap-3">
                     <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`} alt="Avatar" className="w-10 h-10 rounded-full border-2 border-gray-700 bg-gray-800 shadow" />
                     <div className="flex flex-col">
                        <span className="text-gray-200 font-bold text-sm leading-tight">@{userProfile.username || user.email?.split('@')[0]}</span>
                        <span className="text-gray-500 text-[10px] font-medium tracking-wide">CryptoBit Elite Trader</span>
                     </div>
                   </div>
                   <div className="flex flex-col items-end">
                      <span className="text-gray-600 text-[10px] font-mono mb-1">{new Date().toLocaleDateString('en-GB', {day: '2-digit', month: 'short', year: 'numeric'})}</span>
                      <div className="w-10 h-10 rounded-sm bg-white p-1">
                         <img src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=https://cryptobit.app/user/${userProfile.username}`} alt="QR" className="w-full h-full object-contain opacity-90"/>
                      </div>
                   </div>
                </div>
             </div>

             {/* Share Actions */}
             <div className="mt-8 flex flex-wrap gap-4 w-full px-4 justify-center">
                <button onClick={handleDownloadImage} className="flex flex-col items-center gap-2 group">
                   <div className="w-12 h-12 rounded-xl bg-[#1A1E29] flex items-center justify-center border border-gray-800 text-gray-400 group-hover:bg-gray-800 group-hover:text-white transition-all shadow-lg active:scale-95">
                      <Download className="w-5 h-5"/>
                   </div>
                   <span className="text-xs font-bold text-gray-400 group-hover:text-gray-300">Save</span>
                </button>
                <button onClick={() => { navigator.clipboard.writeText('https://cryptobit.app'); alert('Link copied!'); }} className="flex flex-col items-center gap-2 group">
                   <div className="w-12 h-12 rounded-xl bg-[#1A1E29] flex items-center justify-center border border-gray-800 text-gray-400 group-hover:bg-gray-800 group-hover:text-white transition-all shadow-lg active:scale-95">
                      <Share2 className="w-5 h-5"/>
                   </div>
                   <span className="text-xs font-bold text-gray-400 group-hover:text-gray-300">Copy</span>
                </button>
                <a href={`https://twitter.com/intent/tweet?text=I%20just%20closed%20a%20killer%20position%20on%20CryptoBit!%20%24${selectedAsset.symbol}%20%0A%0AROI:%20${selectedAsset.percentage.toFixed(2)}%25%0APNL:%20%24${selectedAsset.pl.toLocaleString(undefined, {maximumFractionDigits: 2})}%0A%0AJoin%20me%20on%20CryptoBit!&url=https://cryptobit.app`} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 group">
                   <div className="w-12 h-12 rounded-xl bg-[#1A1E29] flex items-center justify-center border border-gray-800 text-[#1DA1F2] group-hover:bg-[#1DA1F2]/10 transition-all shadow-lg active:scale-95">
                      <Twitter className="w-5 h-5"/>
                   </div>
                   <span className="text-xs font-bold text-gray-400 group-hover:text-gray-300">Twitter</span>
                </a>
                <a href={`https://t.me/share/url?url=https://cryptobit.app&text=I%20just%20closed%20a%20position%20on%20CryptoBit!%20%24${selectedAsset.symbol}%0A%0AROI:%20${selectedAsset.percentage.toFixed(2)}%25%0APNL:%20%24${selectedAsset.pl.toLocaleString(undefined, {maximumFractionDigits: 2})}`} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 group">
                   <div className="w-12 h-12 rounded-xl bg-[#1A1E29] flex items-center justify-center border border-gray-800 text-[#0088cc] group-hover:bg-[#0088cc]/10 transition-all shadow-lg active:scale-95">
                      <MessageCircle className="w-5 h-5"/>
                   </div>
                   <span className="text-xs font-bold text-gray-400 group-hover:text-gray-300">Telegram</span>
                </a>
                <a href={`https://api.whatsapp.com/send?text=I%20just%20closed%20a%20position%20on%20CryptoBit!%20%24${selectedAsset.symbol}%0A%0AROI:%20${selectedAsset.percentage.toFixed(2)}%25%0APNL:%20%24${selectedAsset.pl.toLocaleString(undefined, {maximumFractionDigits: 2})}%0A%0Ahttps://cryptobit.app`} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 group">
                   <div className="w-12 h-12 rounded-xl bg-[#1A1E29] flex items-center justify-center border border-gray-800 text-[#25D366] group-hover:bg-[#25D366]/10 transition-all shadow-lg active:scale-95">
                      <MessageCircle className="w-5 h-5"/>
                   </div>
                   <span className="text-xs font-bold text-gray-400 group-hover:text-gray-300">WhatsApp</span>
                </a>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
