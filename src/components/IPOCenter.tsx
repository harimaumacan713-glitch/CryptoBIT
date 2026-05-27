/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useFirebase } from './FirebaseProvider';
import { Timer, Users, Target, Activity, Zap, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { useState, useEffect } from 'react';

export default function IPOCenter() {
  const { coins, placeOrder, user, login } = useFirebase();
  const [selectedCoin, setSelectedCoin] = useState<string | null>(null);
  const [orderAmount, setOrderAmount] = useState(1);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  };

  const handlePreOrder = async (coinId: string, symbol: string, price: number, listingDate: string) => {
    if (!user) {
      login();
      return;
    }
    try {
      await placeOrder({
        coinId,
        coinSymbol: symbol,
        amount: orderAmount,
        price,
        status: 'Pending',
        listingDate
      });
      alert(`Pre-order for ${symbol} placed successfully! Check your IPO Orders in Portfolio.`);
      setSelectedCoin(null);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
      console.error(err);
    }
  };

  if (coins.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-20 bg-white border border-gray-200 rounded-sm shadow-sm mt-4">
        <Activity className="w-12 h-12 text-[#00AE64] mb-4 animate-pulse" />
        <h2 className="text-xl font-bold">No Active IPOs</h2>
        <p className="text-gray-500 text-sm mt-2">Check back later or launch your own coin!</p>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black italic tracking-tighter text-[#00AE64]">CRYPTO IPO CENTER</h2>
        <div className="flex gap-4">
           {['Upcoming', 'Live', 'Listed'].map(s => (
             <span key={s} className="text-[10px] font-bold text-gray-400 bg-gray-100 px-3 py-1 rounded-full uppercase tracking-widest">{s}</span>
           ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {coins.map((coin) => (
          <div key={coin.id} className="bg-white border border-gray-200 rounded-sm overflow-hidden flex flex-col shadow-sm hover:shadow-md transition-all group relative">
            {coin.isHot && (
              <div className="absolute top-0 right-0 bg-red-500 text-white text-[9px] font-bold px-3 py-1 rounded-bl-sm flex items-center gap-1 z-10 animate-pulse">
                <Zap className="w-3 h-3 fill-white" /> HOT PROJECT
              </div>
            )}
            
            <div className="p-6">
              <div className="flex gap-4 items-start mb-6">
                <div className="w-16 h-16 bg-gray-50 rounded-lg p-3 border border-gray-100 flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
                  <img src={coin.logo || `https://api.dicebear.com/7.x/identicon/svg?seed=${coin.symbol}`} alt={coin.name} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-gray-900 leading-none">{coin.name}</h3>
                    <span className="text-sm font-bold text-gray-400 uppercase">{coin.symbol}</span>
                    {coin.isVerified && <CheckCircle2 className="w-4 h-4 text-blue-500" />}
                  </div>
                  <p className="text-xs text-gray-500 mt-2 line-clamp-2 leading-relaxed">{coin.description}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1"><Zap className="w-3 h-3" /> IPO Price</p>
                  <p className="text-lg font-black text-[#00AE64]">{formatCurrency(coin.initialPrice)}</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1"><Users className="w-3 h-3" /> Investors</p>
                  <p className="text-lg font-black text-gray-700">{coin.investorCount?.toLocaleString() || 0}</p>
                </div>
                <div>
                   <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1"><Target className="w-3 h-3" /> Target</p>
                   <p className="text-lg font-black text-gray-700">{formatCurrency(coin.targetFund || 500000)}</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2 mb-6">
                <div className="flex justify-between items-end">
                   <p className="text-[10px] font-bold text-gray-500">Fundraising Progress</p>
                   <p className="text-xs font-black text-[#00AE64]">{Math.min(99, Math.round((coin.soldCount / (coin.totalSupply * 0.2)) * 100))}%</p>
                </div>
                <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                   <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (coin.soldCount / (coin.totalSupply * 0.2)) * 100)}%` }}
                    className="h-full bg-gradient-to-r from-[#00AE64] to-emerald-400 rounded-full"
                   />
                </div>
              </div>

              <div className="flex gap-4">
                 <div className="flex-1 bg-[#F9FAFB] border border-gray-100 p-3 rounded-sm flex flex-col justify-center">
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1"><Timer className="w-3 h-3" /> Listing In</p>
                    <Countdown listingDate={coin.listingDate} />
                 </div>
                 <button 
                  onClick={() => setSelectedCoin(coin.id)}
                  className="flex-1 bg-[#00AE64] text-white font-bold rounded-sm text-sm hover:bg-[#009656] shadow-lg shadow-[#00AE64]/20 transition-all uppercase tracking-tighter"
                 >
                   Pre-Order Coin
                 </button>
              </div>
            </div>
            
            {/* Modal-like Overlay for Ordering */}
            {selectedCoin === coin.id && (
              <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-20 p-6 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-200">
                 <button onClick={() => setSelectedCoin(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                    <AlertCircle className="w-5 h-5 rotate-45" />
                 </button>
                 <h4 className="text-lg font-black italic tracking-tighter mb-4">CONFIRM PRE-ORDER</h4>
                 <div className="w-full space-y-4 max-w-xs">
                    <div className="flex justify-between items-center bg-gray-50 p-3 rounded border border-gray-100">
                       <span className="text-xs text-gray-500 font-bold uppercase">Amount</span>
                       <div className="flex items-center gap-3">
                          <button onClick={() => setOrderAmount(Math.max(1, orderAmount - 1))} className="w-6 h-6 border rounded-full flex items-center justify-center font-bold">-</button>
                          <span className="font-black w-8 text-center">{orderAmount}</span>
                          <button onClick={() => setOrderAmount(orderAmount + 1)} className="w-6 h-6 border rounded-full flex items-center justify-center font-bold">+</button>
                       </div>
                    </div>
                    <div className="flex justify-between items-center px-1">
                       <span className="text-xs text-gray-500 font-bold uppercase">Total Cost</span>
                       <span className="font-black text-[#00AE64]">${(orderAmount * coin.initialPrice).toFixed(2)}</span>
                    </div>
                    <button 
                      onClick={() => handlePreOrder(coin.id, coin.symbol, coin.initialPrice, coin.listingDate)}
                      className="w-full bg-black text-white font-bold py-3 rounded-sm hover:bg-gray-800 shadow-xl"
                    >
                      CONFIRM ORDER
                    </button>
                 </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Countdown({ listingDate }: { listingDate: string }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });

  useEffect(() => {
    const target = new Date(listingDate).getTime();
    if (isNaN(target)) return;

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = target - now;

      if (distance < 0) {
        clearInterval(timer);
        setTimeLeft({ days: 0, hours: 0, mins: 0, secs: 0 });
        return;
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        mins: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        secs: Math.floor((distance % (1000 * 60)) / 1000)
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [listingDate]);

  return (
    <div className="flex gap-1.5">
       <div className="flex flex-col items-center">
         <span className="text-[14px] font-black leading-none">{timeLeft.days}</span>
         <span className="text-[8px] font-bold text-gray-400 uppercase">D</span>
       </div>
       <span className="text-gray-300 font-bold">:</span>
       <div className="flex flex-col items-center">
         <span className="text-[14px] font-black leading-none">{timeLeft.hours}</span>
         <span className="text-[8px] font-bold text-gray-400 uppercase">H</span>
       </div>
       <span className="text-gray-300 font-bold">:</span>
       <div className="flex flex-col items-center">
         <span className="text-[14px] font-black leading-none">{timeLeft.mins}</span>
         <span className="text-[8px] font-bold text-gray-400 uppercase">M</span>
       </div>
       <span className="text-gray-300 font-bold">:</span>
       <div className="flex flex-col items-center">
         <span className="text-[14px] font-black leading-none">{timeLeft.secs}</span>
         <span className="text-[8px] font-bold text-gray-400 uppercase">S</span>
       </div>
    </div>
  );
}
