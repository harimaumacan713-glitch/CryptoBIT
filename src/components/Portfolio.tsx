/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MoreVertical, X, Clock, CheckCircle2, AlertCircle, Share2, Download, MessageCircle, Twitter } from 'lucide-react';
import { useState, useRef, useEffect, useMemo } from 'react';
import * as htmlToImage from 'html-to-image';
import { useFirebase } from './FirebaseProvider';
import { collection, query, onSnapshot, where } from 'firebase/firestore';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const MOCK_PRICES: Record<string, number> = {
  'USD': 1,
  'BTC': 96345.75,
  'ETH': 2760.00,
  'USDT': 1.00
};

export default function Portfolio() {
  const { orders, user, userProfile, tradeCrypto, coins, db, realTimeCryptos } = useFirebase();
  const cryptos = realTimeCryptos;
  const [activeTab, setActiveTab] = useState('Holdings');
  const [trades, setTrades] = useState<any[]>([]);

  useEffect(() => {
    if (!user || !db) return;
    const q = query(
      collection(db, 'trades'),
      where('userId', '==', user.uid)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((trade: any) => trade.symbol && !['BXC', 'QTX', 'ME'].includes(trade.symbol.toUpperCase()));

      list.sort((a: any, b: any) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
      setTrades(list);
    }, (err) => {
      console.error("Trades subscription failed", err);
    });
    return unsubscribe;
  }, [user, db]);
  
  const [activeActionMenu, setActiveActionMenu] = useState<string | null>(null);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);

  const liveSelectedAsset = useMemo(() => {
    if (!selectedAsset) return null;
    const cryptoInfo = cryptos.find(c => c.symbol === selectedAsset.symbol);
    const currentPrice = cryptoInfo ? cryptoInfo.price : (MOCK_PRICES[selectedAsset.symbol] || 0.1);
    const currentVal = selectedAsset.balance * currentPrice;
    const pl = currentVal - selectedAsset.invested;
    const percentage = selectedAsset.invested > 0 ? (pl / selectedAsset.invested) * 100 : 0;
    const isPositive = pl >= 0;

    return {
      ...selectedAsset,
      price: currentPrice,
      currentVal,
      pl,
      percentage,
      isPositive
    };
  }, [selectedAsset, cryptos]);

  const [isProcessingTitle, setIsProcessingTitle] = useState(false);
  const shareRef = useRef<HTMLDivElement>(null);

  const getShareText = () => {
    if (!liveSelectedAsset) return '';
    const sign = liveSelectedAsset.isPositive ? '🟢' : '🔴';
    const plusMinus = liveSelectedAsset.isPositive ? '+' : '';
    const formattedPl = liveSelectedAsset.isPositive 
      ? liveSelectedAsset.pl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : Math.abs(liveSelectedAsset.pl).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const formattedPrice = liveSelectedAsset.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 });
    const timestamp = new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });

    return `*▬▬▬▬▬▬▬ CRYPTOBIT CARD ▬▬▬▬▬▬▬*
🚀 *POSISI PERDAGANGAN BERHASIL DITUTUP*
📅 _${timestamp}_
*▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬*

🪙 *Aset:* $${liveSelectedAsset.symbol} / USD
📊 *ROI PNL:* *${plusMinus}${liveSelectedAsset.percentage.toFixed(2)}%* ${sign}
💵 *Keuntungan/Kerugian:* *${liveSelectedAsset.isPositive ? '+' : '-'}$${formattedPl} USD*
⚖️ *Sisa Saldo Unit:* ${liveSelectedAsset.balance.toLocaleString(undefined, { maximumFractionDigits: 6 })} ${liveSelectedAsset.symbol}
🎯 *Harga Eksekusi:* $${formattedPrice}

*▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬*
📱 _Buka & Mulai Berdagang Real-Time:_
👉 https://cryptobit.app`;
  };

  const handleShareImage = async () => {
    if (!shareRef.current || !liveSelectedAsset) return;
    try {
      const dataUrl = await htmlToImage.toPng(shareRef.current, { 
        quality: 0.95, 
        pixelRatio: 2,
        skipFonts: true,
      });
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const file = new File([blob], `CryptoBit-${liveSelectedAsset.symbol}.png`, { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `CryptoBit Trade Result: $${liveSelectedAsset.symbol}`,
          text: `Check out my trade result on CryptoBit!`,
        });
      } else {
        // Fallback for browsers that don't support file sharing
        const link = document.createElement('a');
        link.download = `CryptoBit-Share-${liveSelectedAsset.symbol}-${new Date().getTime()}.png`;
        link.href = dataUrl;
        link.click();
        alert('Browser tidak mendukung berbagi gambar secara langsung. Gambar telah diunduh!');                
      }
    } catch (err) {
      console.error('Failed to share image', err);
      alert('Gagal membagikan gambar.');
    }
  };

  const handleClosePosition = async () => {

    if (!liveSelectedAsset) return;
    setIsProcessingTitle(true);
    try {
      await tradeCrypto('sell', liveSelectedAsset.symbol, liveSelectedAsset.balance, liveSelectedAsset.price);
      setShowCloseModal(false);
      setSelectedAsset(null);
    } catch (e) {
      console.error(e);
      alert('Failed to close position.');
    }
    setIsProcessingTitle(false);
  };

  const handleDownloadImage = async () => {
    if (!shareRef.current || !liveSelectedAsset) return;
    try {
      const dataUrl = await htmlToImage.toPng(shareRef.current, { 
        quality: 0.95, 
        pixelRatio: 2,
        skipFonts: true,
      });
      const link = document.createElement('a');
      link.download = `CryptoBit-Share-${liveSelectedAsset.symbol}-${new Date().getTime()}.png`;
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
        <p className="text-gray-500 text-sm mt-2">Log in to view your portfolio and transaction history.</p>
      </div>
    );
  }

  let totalInvested = 0;
  let totalCurrentValue = 0;

  // Compute portfolio metrics memoized
  const holdEntries = useMemo(() => {
    return (Object.entries(userProfile.assets || {}) as [string, number][]).filter(([_, amt]) => amt > 0);
  }, [userProfile.assets]);

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

  const chartData = useMemo(() => {
    const data: Array<{ name: string; value: number; percentage: number; color: string }> = [];
    const colors = [
      '#00AE64', // CryptoBit Green
      '#3B82F6', // Blue
      '#8B5CF6', // Violet
      '#F59E0B', // Amber
      '#EC4899', // Pink
      '#6366F1', // Indigo
      '#EF4444', // Red
      '#14B8A6', // Teal
      '#06B6D4', // Cyan
      '#10B981', // Alternate Green
    ];

    const totalValue = userProfile.balance + totalCurrentValue;
    if (totalValue === 0) return [];

    let colorIndex = 0;

    // Add USD Cash first if balance exists
    if (userProfile.balance > 0) {
      data.push({
        name: 'USD Cash',
        value: userProfile.balance,
        percentage: (userProfile.balance / totalValue) * 100,
        color: '#64748B', // Cool Slate for cash
      });
    }

    // Add crypto assets
    holdEntries.forEach(([symbol, balance]) => {
      const cryptoInfo = cryptos.find(c => c.symbol === symbol);
      const price = cryptoInfo ? cryptoInfo.price : (MOCK_PRICES[symbol] || 0.1);
      const val = balance * price;
      if (val > 0) {
        data.push({
          name: symbol,
          value: val,
          percentage: (val / totalValue) * 100,
          color: colors[colorIndex % colors.length],
        });
        colorIndex++;
      }
    });

    // Sort by value descending
    return data.sort((a, b) => b.value - a.value);
  }, [userProfile.balance, totalCurrentValue, holdEntries, cryptos]);

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
          <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-gray-100">
            {/* Holdings Table Column */}
            <div className="flex-1 overflow-x-auto">
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
                       <td colSpan={7} className="py-20 text-center text-gray-400 text-sm italic">You don't hold any assets yet. Buy some in Watchlist or trade in the live stream.</td>
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

            {/* Allocation Donut Chart Sidebar (Right Column) */}
            <div className="w-full lg:w-96 p-6 flex flex-col bg-gray-50/20 shrink-0">
              <div className="mb-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-[#00AE64]">Asset Allocation</h3>
                <p className="text-[10px] text-gray-400 mt-0.5">Distribution of cash and crypto holdings</p>
              </div>

              {chartData.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <span className="text-xs text-gray-400 italic">No asset distribution data available</span>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Recharts Donut wrapper */}
                  <div className="h-44 w-full relative flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={75}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: any) => [`$${parseFloat(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'Value']}
                          contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '0.375rem', color: '#f8fafc', fontSize: '11px', fontWeight: 'bold' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>

                    {/* Donut center label display total equity */}
                    <div className="absolute flex flex-col items-center text-center pointer-events-none">
                      <span className="text-[9px] uppercase tracking-wider text-gray-400 font-bold font-sans">Total Equity</span>
                      <span className="text-xs font-black text-gray-900 tracking-tight">${totalEquity.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>

                  {/* List / Legend of holdings */}
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {chartData.map((item) => (
                      <div key={item.name} className="flex items-center justify-between text-xs p-2 rounded hover:bg-gray-100/50 transition-colors">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                          <span className="font-extrabold text-gray-700">{item.name}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-gray-900 block font-mono text-[11px]">${item.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          <span className="text-[10px] text-gray-400 font-bold block">{item.percentage.toFixed(1)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
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
                      <td className="px-4 py-4 text-sm font-bold text-gray-700 text-right tabular-nums">{(Number(order.amount) || 0).toLocaleString()}</td>
                      <td className="px-4 py-4 text-sm font-bold text-gray-700 text-right tabular-nums">${(Number(order.price) || 0).toFixed(3)}</td>
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
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100 italic">
                  <th className="px-4 py-3 text-[11px] font-black text-[#00AE64] uppercase">Token</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-gray-400 uppercase text-center">Type</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-gray-400 uppercase text-right">Amount</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-gray-400 uppercase text-right">Price</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-gray-400 uppercase text-right">Total</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-gray-400 uppercase text-right">Date & Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {trades.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-20 text-center text-gray-400 text-sm italic">You haven't made any listed token trades yet.</td>
                  </tr>
                ) : (
                  trades.map((trade) => {
                    const isBuy = String(trade.type).toUpperCase() === 'BUY';
                    return (
                      <tr key={trade.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-sm text-gray-900">{trade.symbol}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                            isBuy ? 'bg-[#00AE64]/10 text-[#00AE64]' : 'bg-red-50 text-red-500'
                          }`}>
                            {trade.type}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm font-semibold text-gray-700 text-right tabular-nums">
                          {(Number(trade.amount) || 0).toLocaleString(undefined, { maximumFractionDigits: 4 })}
                        </td>
                        <td className="px-4 py-4 text-sm font-semibold text-gray-700 text-right tabular-nums">
                          ${(Number(trade.price) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                        </td>
                        <td className="px-4 py-4 text-sm font-bold text-gray-900 text-right tabular-nums">
                          ${(Number(trade.total) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-4 text-xs font-medium text-gray-400 text-right tabular-nums">
                          {trade.timestamp ? new Date(trade.timestamp).toLocaleString() : 'N/A'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showCloseModal && liveSelectedAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1A1E29] rounded-2xl w-full max-w-sm border border-gray-800 shadow-2xl overflow-hidden text-white">
            <div className="p-5 border-b border-gray-800 flex justify-between items-center bg-gray-900/50">
               <h3 className="font-bold text-lg">Close {liveSelectedAsset.symbol} Position</h3>
               <button onClick={() => setShowCloseModal(false)} className="text-gray-400 hover:text-white transition-colors">
                  <X className="w-5 h-5"/>
               </button>
            </div>
            <div className="p-6 space-y-4">
               <div className="flex justify-between items-end border-b border-gray-800 pb-4">
                  <span className="text-gray-400 text-sm">Amount</span>
                  <span className="font-mono text-lg font-bold">{liveSelectedAsset.balance.toLocaleString()}</span>
               </div>
               <div className="flex justify-between items-end border-b border-gray-800 pb-4">
                  <span className="text-gray-400 text-sm">Market Price</span>
                  <span className="font-mono text-lg font-bold">${liveSelectedAsset.price.toLocaleString(undefined, {maximumFractionDigits: 4})}</span>
               </div>
               <div className="flex justify-between items-end pb-2">
                  <span className="text-gray-400 text-sm">Est. PNL</span>
                  <span className={`font-mono text-lg font-black ${liveSelectedAsset.isPositive ? 'text-[#00AE64]' : 'text-red-500'}`}>
                    {liveSelectedAsset.isPositive ? '+' : ''}${liveSelectedAsset.pl.toLocaleString(undefined, {maximumFractionDigits: 2})}
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

      {showShareModal && liveSelectedAsset && (
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
                <div className={`absolute top-0 left-0 w-full h-[400px] opacity-20 blur-[80px] rounded-full pointer-events-none translate-y-[-50%] ${liveSelectedAsset.isPositive ? 'bg-[#00AE64]' : 'bg-red-500'}`}></div>
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
                             <img src={cryptos.find(c => c.symbol === liveSelectedAsset.symbol)?.logo || `https://api.dicebear.com/7.x/identicon/svg?seed=${liveSelectedAsset.symbol}`} alt="icon" className="w-full h-full object-contain p-0.5" referrerPolicy="no-referrer" />
                           </div>
                           <h2 className="text-white font-black text-2xl tracking-tighter">{liveSelectedAsset.symbol}/USD</h2>
                        </div>
                        <span className={`inline-flex items-center text-[11px] font-black uppercase tracking-widest px-2 py-0.5 rounded-sm w-fit mt-1 ${liveSelectedAsset.isPositive ? 'bg-[#00AE64]/20 text-[#00AE64]' : 'bg-red-500/20 text-red-500'}`}>
                           SPOT {liveSelectedAsset.isPositive ? 'LONG' : 'SHORT'}
                        </span>
                     </div>
                   </div>

                   <div className="mb-6 flex-1 flex flex-col justify-center">
                     <span className={`font-black tracking-tighter leading-none ${liveSelectedAsset.percentage >= 100 || liveSelectedAsset.percentage <= -100 ? 'text-6xl' : 'text-7xl'} ${liveSelectedAsset.isPositive ? 'text-[#00AE64]' : 'text-red-500'}`}>
                       {liveSelectedAsset.isPositive ? '+' : ''}{liveSelectedAsset.percentage.toFixed(2)}%
                     </span>
                     <span className={`font-mono font-bold mt-2 text-xl ${liveSelectedAsset.isPositive ? 'text-[#00AE64]' : 'text-red-500'}`}>
                       {liveSelectedAsset.isPositive ? '+' : ''}${liveSelectedAsset.pl.toLocaleString(undefined, {maximumFractionDigits: 2})}
                     </span>
                   </div>

                   <div className="grid grid-cols-2 gap-4 mb-8">
                     <div>
                       <span className="text-gray-500 text-[10px] uppercase font-bold tracking-widest block mb-1">Entry Price</span>
                       <span className="text-white font-mono font-bold text-sm">${liveSelectedAsset.entryPrice.toLocaleString(undefined, {maximumFractionDigits: 4})}</span>
                     </div>
                     <div>
                       <span className="text-gray-500 text-[10px] uppercase font-bold tracking-widest block mb-1">Current Price</span>
                       <span className="text-white font-mono font-bold text-sm">${liveSelectedAsset.price.toLocaleString(undefined, {maximumFractionDigits: 4})}</span>
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
                <button onClick={() => { navigator.clipboard.writeText(getShareText()); alert('Info & link disalin ke clipboard!'); }} className="flex flex-col items-center gap-2 group">
                   <div className="w-12 h-12 rounded-xl bg-[#1A1E29] flex items-center justify-center border border-gray-800 text-gray-400 group-hover:bg-gray-800 group-hover:text-white transition-all shadow-lg active:scale-95">
                      <Share2 className="w-5 h-5"/>
                   </div>
                   <span className="text-xs font-bold text-gray-400 group-hover:text-gray-300">Copy</span>
                </button>
                <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(getShareText())}`} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 group">
                   <div className="w-12 h-12 rounded-xl bg-[#1A1E29] flex items-center justify-center border border-gray-800 text-[#1DA1F2] group-hover:bg-[#1DA1F2]/10 transition-all shadow-lg active:scale-95">
                      <Twitter className="w-5 h-5"/>
                   </div>
                   <span className="text-xs font-bold text-gray-400 group-hover:text-gray-300">Twitter</span>
                </a>
                <a href={`https://t.me/share/url?url=https://cryptobit.app&text=${encodeURIComponent(getShareText())}`} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 group">
                   <div className="w-12 h-12 rounded-xl bg-[#1A1E29] flex items-center justify-center border border-gray-800 text-[#0088cc] group-hover:bg-[#0088cc]/10 transition-all shadow-lg active:scale-95">
                      <MessageCircle className="w-5 h-5"/>
                   </div>
                   <span className="text-xs font-bold text-gray-400 group-hover:text-gray-300">Telegram</span>
                </a>
                 <button onClick={handleShareImage} className="flex flex-col items-center gap-2 group">
                    <div className="w-12 h-12 rounded-xl bg-[#1A1E29] flex items-center justify-center border border-gray-800 text-[#25D366] group-hover:bg-[#25D366]/10 transition-all shadow-lg active:scale-95">
                       <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                         <path d="M12.004 2c-5.52 0-9.98 4.46-9.98 9.98 0 1.76.46 3.42 1.25 4.89l-1.15 4.19 4.29-1.12c1.42.77 3.03 1.19 4.67 1.19 5.52 0 10-4.48 10-10C22.004 6.46 17.524 2 12.004 2zm5.7 13.92c-.22.63-1.16 1.17-1.61 1.21-.43.04-.84.21-2.73-.52-2.42-.94-3.98-3.41-4.1-3.58-.12-.17-1-1.31-1-2.51a2.76 2.76 0 0 1 .82-1.99c.26-.26.57-.33.77-.33h.62c.16 0 .39-.06.6.44s.74 1.8.81 1.94c.07.14.12.3.02.49-.09.19-.13.3-.27.46-.14.16-.29.36-.41.49-.14.14-.3.3-.13.59.17.3.77 1.26 1.66 2.05.88.79 1.62 1.03 1.92 1.17.3.14.47.12.65-.08.17-.2.76-.88.95-1.18.19-.3.39-.25.66-.14 1.29.6 1.68.8 1.93.91.25.11.34.16.39.25a1.91 1.91 0 0 1-.16 1.01z"/>
                      </svg>
                   </div>
                   <span className="text-xs font-bold text-gray-400 group-hover:text-gray-300">WhatsApp</span>
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
