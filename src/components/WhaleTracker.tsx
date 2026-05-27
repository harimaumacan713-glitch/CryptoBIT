import React, { useState, useEffect, useRef } from 'react';
import { useFirebase } from './FirebaseProvider';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowUpRight, ArrowDownRight, RefreshCw, Send, DollarSign } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { collection, query, onSnapshot } from 'firebase/firestore';

const formatWallet = (wallet: string) => {
  if (!wallet || wallet.length < 10) return wallet || '0x???';
  return `${wallet.substring(0, 6)}...${wallet.substring(wallet.length - 4)}`;
};

interface LiveTransaction {
  id: string;
  type: 'BUY' | 'SELL' | 'DEPOSIT' | 'WITHDRAW' | 'TRANSFER';
  coin: string;
  amount: number;
  wallet: string;
  timestamp: string;
  price?: number;
  usdValue: number;
}

export default function WhaleTracker() {
  const [liveTransactions, setLiveTransactions] = useState<LiveTransaction[]>([]);
  const { db } = useFirebase();
  const [filter, setFilter] = useState('All');
  
  // Ref for auto-scroll
  const listRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, 'liveTransactions'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let txs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LiveTransaction));
      txs = txs.filter(tx => tx.type === 'BUY' || tx.type === 'SELL');
      txs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setLiveTransactions(txs.slice(0, 100));
    });
    return () => unsubscribe();
  }, [db]);

  useEffect(() => {
    // Keep scrolled to top as we prepend new ones
    if (listRef.current) {
      listRef.current.scrollTop = 0;
    }
  }, [liveTransactions]);

  const filters = ['All', 'BUY', 'SELL', 'BTC', 'ETH'];

  const filteredTx = liveTransactions.filter(tx => {
    if (filter === 'All') return true;
    if (filter === 'BUY' || filter === 'SELL') {
      return tx.type === filter;
    }
    return tx.coin === filter;
  });

  const getIcon = (type: string) => {
    if (type === 'BUY') return <ArrowUpRight className="w-4 h-4 text-emerald-400" />;
    if (type === 'SELL') return <ArrowDownRight className="w-4 h-4 text-red-500" />;
    if (type === 'TRANSFER') return <Send className="w-4 h-4 text-blue-400" />;
    if (type === 'DEPOSIT') return <DollarSign className="w-4 h-4 text-blue-400" />;
    return <RefreshCw className="w-4 h-4 text-blue-400" />;
  };

  const getColor = (type: string) => {
    if (type === 'BUY') return 'text-emerald-400 border-emerald-400/20 bg-emerald-400/10';
    if (type === 'SELL') return 'text-red-500 border-red-500/20 bg-red-500/10';
    return 'text-blue-400 border-blue-400/20 bg-blue-400/10';
  };

  return (
    <div className="bg-[#0b0e14] border border-gray-800 rounded-xl overflow-hidden shadow-[0_0_30px_rgba(0,174,100,0.05)] w-full flex flex-col h-[480px]">
      <div className="p-4 border-b border-gray-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#00AE64]/10 blur-3xl -mr-16 -mt-16"></div>
        <h3 className="text-white font-bold text-base flex items-center gap-2 relative z-10 tracking-wide uppercase">
          <span className="w-2 h-2 rounded-full bg-[#00AE64] relative block">
             <span className="absolute inset-0 rounded-full bg-[#00AE64] animate-ping"></span>
          </span>
          Live Whale Tracker
        </h3>
        
        {/* Filters */}
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-hide relative z-10">
          {filters.map(f => (
            <button 
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 text-[10px] uppercase font-bold rounded-full whitespace-nowrap transition-colors flex-shrink-0 ${
                filter === f ? 'bg-[#00AE64] text-black' : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div ref={listRef} className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
        <AnimatePresence initial={false}>
          {filteredTx.map(tx => (
            <motion.div
              layout
              key={tx.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.3 }}
              className={`p-3 rounded-lg border flex flex-col gap-2 ${getColor(tx.type)} backdrop-blur-sm relative overflow-hidden group`}
            >
              <div className="absolute top-0 right-0 w-16 h-16 bg-current opacity-[0.03] rounded-full blur-xl -mr-8 -mt-8"></div>
              
              <div className="flex justify-between items-start z-10 relative">
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded-full bg-black/30 flex items-center justify-center">
                    <img src={`https://api.dicebear.com/7.x/identicon/svg?seed=${tx.coin}`} alt={tx.coin} className="w-4 h-4 opacity-80" />
                  </div>
                  <div>
                    <span className="text-xs font-black capitalize tracking-tight flex items-center gap-1">
                      {tx.type.toLowerCase()} {tx.coin}
                      {getIcon(tx.type)}
                    </span>
                    <span className="text-[10px] text-current/60 font-mono tracking-tight block">
                      {formatWallet(tx.wallet)}
                    </span>
                  </div>
                </div>
                
                <div className="text-right">
                   <div className="text-xs font-black tabular-nums tracking-tighter">
                     {tx.amount.toLocaleString(undefined, { maximumFractionDigits: 4 })} {tx.coin}
                   </div>
                   <div className="text-[10px] text-white/50 font-medium tabular-nums tracking-tighter mt-0.5 group-hover:text-current/80 transition-colors">
                     ${(tx.usdValue).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                   </div>
                </div>
              </div>
              
              <div className="flex justify-between items-end border-t border-current/10 pt-1.5 mt-0.5 z-10 relative">
                 <span className="text-[9px] font-bold text-white/30 uppercase cursor-help" title={tx.timestamp}>
                   {formatDistanceToNow(new Date(tx.timestamp), { addSuffix: true })}
                 </span>
              </div>
            </motion.div>
          ))}
          
          {filteredTx.length === 0 && (
             <div className="text-center py-10 text-gray-500 text-xs font-medium uppercase tracking-widest opacity-50">
               No transactions yet
             </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
