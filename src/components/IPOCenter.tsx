/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useFirebase } from './FirebaseProvider';
import { IPOCoin } from '../types';
import { Zap, Coins, Globe, Twitter, Loader2, Sparkles, AlertCircle, ArrowUpRight, TrendingUp, Layers, Flame, Clock, CheckCircle2, XCircle, Rocket, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function IPOCenter() {
  const { coins, placeOrder, user, userProfile, login, instantListCoin, deleteCoin } = useFirebase();
  const [filter, setFilter] = useState<'All' | 'Live' | 'Upcoming' | 'Listed' | 'Failed'>('All');
  const [selectedCoin, setSelectedCoin] = useState<IPOCoin | null>(null);
  const [amount, setAmount] = useState<string>('');
  const [isOrdering, setIsOrdering] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [confirmingCoinId, setConfirmingCoinId] = useState<string | null>(null);
  const [loadingCoinId, setLoadingCoinId] = useState<string | null>(null);
  const [errorCoinId, setErrorCoinId] = useState<{[key: string]: string}>({});

  // Filter IPO Coins
  const filteredCoins = coins.filter(coin => {
    if (coin.symbol && ['BXC', 'QTX', 'ME'].includes(coin.symbol.toUpperCase())) return false;
    if (filter === 'All') return true;
    return coin.status === filter;
  });

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      login();
      return;
    }
    if (!selectedCoin || !amount || isNaN(Number(amount)) || Number(amount) <= 0) return;

    const qty = Number(amount);
    if (qty < (selectedCoin.minBuy || 1)) {
      alert(`Jumlah minimum pembelian adalah ${selectedCoin.minBuy} ${selectedCoin.symbol}`);
      return;
    }
    if (qty > (selectedCoin.maxBuy || 100000)) {
      alert(`Jumlah maksimum pembelian adalah ${selectedCoin.maxBuy} ${selectedCoin.symbol}`);
      return;
    }

    const totalCost = qty * selectedCoin.initialPrice;
    if (userProfile && userProfile.balance < totalCost) {
      alert(`Saldo tidak mencukupi! Anda memerlukan $${totalCost.toLocaleString()} tetapi hanya memiliki $${userProfile.balance.toLocaleString()}`);
      return;
    }

    setIsOrdering(true);
    try {
      await placeOrder({
        coinId: selectedCoin.id,
        coinSymbol: selectedCoin.symbol,
        amount: qty,
        price: selectedCoin.initialPrice,
        status: 'Success',
        listingDate: selectedCoin.listingDate || new Date(Date.now() + 86400000).toISOString()
      });
      setSuccessMsg(`Berhasil memesan ${qty.toLocaleString()} ${selectedCoin.symbol} senilai $${totalCost.toLocaleString()}`);
      setAmount('');
      setTimeout(() => {
        setSuccessMsg(null);
        setSelectedCoin(null);
      }, 3000);
    } catch (e: any) {
      alert("Pemesanan gagal: " + e.message);
    } finally {
      setIsOrdering(false);
    }
  };

  return (
    <div id="ipo-center-container" className="max-w-7xl mx-auto p-4 lg:p-6 space-y-6">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-6">
        <div>
          <div className="flex items-center gap-2 text-[#00AE64]">
            <Zap className="w-5 h-5 fill-current" />
            <span className="font-bold text-xs uppercase tracking-widest">Crypto Launchpad Hub</span>
          </div>
          <h1 className="text-3xl font-black italic tracking-tighter text-gray-900 mt-1">CRYPTO IPO CENTER</h1>
          <p className="text-gray-500 text-sm mt-1">Ikuti penawaran perdana (IPO) token kripto generasi baru sebelum didaftarkan di pasar bebas.</p>
        </div>

        {/* Filter buttons */}
        <div className="flex flex-wrap gap-1 bg-gray-50 p-1 rounded border border-gray-100">
          {(['All', 'Live', 'Upcoming', 'Listed', 'Failed'] as const).map(tab => {
            const getTabIcon = () => {
              switch (tab) {
                case 'All': return <Layers className="w-3.5 h-3.5" />;
                case 'Live': return <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500/20" />;
                case 'Upcoming': return <Clock className="w-3.5 h-3.5 text-amber-500" />;
                case 'Listed': return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />;
                case 'Failed': return <XCircle className="w-3.5 h-3.5 text-rose-500" />;
              }
            };

            const getTabLabel = () => {
              switch (tab) {
                case 'All': return 'Semua Proyek';
                case 'Live': return 'Live IPO';
                case 'Upcoming': return 'Segera Hadir';
                case 'Listed': return 'Terdaftar (Listed)';
                case 'Failed': return 'IPO Gagal (Failed)';
              }
            };

            return (
              <button
                id={`tab-ipo-${tab}`}
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-3 py-1.5 rounded-sm text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  filter === tab 
                    ? 'bg-white text-[#00AE64] shadow-sm font-extrabold' 
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {getTabIcon()}
                <span>{getTabLabel()}</span>
              </button>
            );
          })}
        </div>
      </div>

      <AnimatePresence mode="popLayout">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCoins.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="col-span-full py-20 flex flex-col items-center justify-center text-center bg-gray-50 border border-gray-200/60 rounded-sm"
            >
              <Coins className="w-12 h-12 text-gray-300 mb-3" />
              <p className="text-gray-900 font-bold">Tidak ada proyek koin ditemukan</p>
              <p className="text-gray-500 text-xs mt-1">Belum ada IPO token yang sesuai dengan filter yang dipilih.</p>
            </motion.div>
          ) : (
            filteredCoins.map(coin => {
              const hardcap = (coin.totalSupply || 100000000) * 0.2; // 20% allocation for IPO
              const progressPercentage = Math.min(100, Math.max(0, ((coin.soldCount || 0) / hardcap) * 100));
              const isListed = coin.status === 'Listed';
              const isLive = coin.status === 'Live';
              const isUpcoming = coin.status === 'Upcoming';

              return (
                <motion.div
                  id={`ipo-card-${coin.id}`}
                  key={coin.id}
                  layout
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="bg-white border border-gray-200 hover:border-[#00AE64]/50 rounded-sm p-5 shadow-sm transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Badge and Status */}
                    <div className="flex items-center justify-between mb-4">
                      <span className={`text-[9px] font-black tracking-widest uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                        isListed ? 'bg-gray-100 text-gray-600' :
                        coin.status === 'Failed' ? 'bg-red-50 text-red-600 border border-red-100' :
                        isLive ? 'bg-[#00AE64]/10 text-[#00AE64]' : 'bg-yellow-50 text-yellow-600'
                      }`}>
                        {coin.status === 'Live' ? (
                          <>
                            <span className="w-1 h-1 bg-[#00AE64] rounded-full animate-pulse" />
                            Live
                          </>
                        ) : coin.status === 'Failed' ? (
                          'Failed / Refunded'
                        ) : (
                          coin.status
                        )}
                      </span>
                      {coin.creatorId && coin.creatorId !== 'company' && coin.creatorId !== 'demo' && (
                        <span className="text-[10px] font-black text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">User Generated</span>
                      )}
                    </div>

                    {/* Logo and Name */}
                    <div className="flex items-center gap-3 mb-4">
                      <img 
                        src={coin.logo || `https://api.dicebear.com/7.x/identicon/svg?seed=${coin.symbol}`} 
                        alt={coin.name} 
                        className="w-12 h-12 rounded bg-gray-50 border border-gray-100 p-1 object-contain"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <h3 className="font-black text-gray-900 tracking-tight text-lg">{coin.name}</h3>
                        <span className="text-xs text-gray-400 font-bold uppercase tracking-wide">{coin.symbol}</span>
                      </div>
                    </div>

                    <p className="text-gray-500 text-xs line-clamp-3 mb-4 leading-relaxed">{coin.description || 'Proyek token revolusioner di ekosistem KriptoBit.'}</p>

                    {/* Financial Specs */}
                    <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-sm border border-gray-100/50 mb-4">
                      <div>
                        <span className="text-[9px] text-gray-400 font-bold uppercase block tracking-wider">Prices</span>
                        <span className="font-extrabold text-sm text-gray-900">${coin.initialPrice}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-gray-400 font-bold uppercase block tracking-wider">Total Supply</span>
                        <span className="font-extrabold text-sm text-gray-900">{(coin.totalSupply || 0).toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Allocation / Sales specs */}
                    <div className="space-y-2 mb-5">
                      <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
                        <span>IPO Terjual</span>
                        <span className="font-bold text-gray-900">
                          {Math.floor(coin.soldCount || 0).toLocaleString()} / {Math.floor(hardcap).toLocaleString()} {coin.symbol}
                        </span>
                      </div>
                      {/* Progress bar */}
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-[#00AE64] to-emerald-400 rounded-full transition-all duration-500"
                          style={{ width: `${progressPercentage}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-gray-400 font-bold">
                        <span>Min: {coin.minBuy || 1}</span>
                        <span>{progressPercentage.toFixed(1)}% Terisi</span>
                      </div>
                    </div>
                  </div>

                  {/* Operational actions */}
                  <div className="pt-2 border-t border-gray-50 flex items-center justify-between gap-3">
                    <div className="flex gap-2">
                      {coin.website && (
                        <a href={coin.website} target="_blank" rel="noreferrer" className="p-1.5 rounded-sm bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors">
                          <Globe className="w-4 h-4" />
                        </a>
                      )}
                      {coin.twitter && (
                        <a href={coin.twitter} target="_blank" rel="noreferrer" className="p-1.5 rounded-sm bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors">
                          <Twitter className="w-4 h-4" />
                        </a>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {user && user.uid === coin.creatorId && coin.status !== 'Listed' && coin.status !== 'Failed' && (
                        <button 
                          onClick={() => {
                            if (window.confirm("Apakah Anda yakin ingin menghapus koin ini? Tindakan ini tidak dapat dibatalkan.")) {
                              deleteCoin(coin.id);
                            }
                          }}
                          className="p-2.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/25 transition-all"
                          title="Hapus Koin"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                      {user && user.uid === coin.creatorId && coin.status !== 'Listed' && coin.status !== 'Failed' && (
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <button
                            id={`btn-instant-list-${coin.id}`}
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (loadingCoinId === coin.id) return;
                              
                              if (confirmingCoinId === coin.id) {
                                try {
                                  setLoadingCoinId(coin.id);
                                  setErrorCoinId(prev => ({ ...prev, [coin.id]: '' }));
                                  await instantListCoin(coin.id);
                                  setConfirmingCoinId(null);
                                  setSuccessToast(`Koin ${coin.name} (${coin.symbol}) berhasil diluncurkan ke bursa perdagangan secara instant!`);
                                  setTimeout(() => setSuccessToast(null), 4000);
                                } catch (err: any) {
                                  setErrorCoinId(prev => ({ ...prev, [coin.id]: err.message || 'Gagal meluncurkan koin' }));
                                  setConfirmingCoinId(null);
                                } finally {
                                  setLoadingCoinId(null);
                                }
                              } else {
                                setConfirmingCoinId(coin.id);
                                setTimeout(() => {
                                  setConfirmingCoinId(curr => curr === coin.id ? null : curr);
                                }, 4000);
                              }
                            }}
                            disabled={loadingCoinId === coin.id}
                            className={`text-[10px] font-black px-2.5 py-1.5 rounded-sm flex items-center gap-1 cursor-pointer tracking-wider transition-all select-none ${
                              loadingCoinId === coin.id
                                ? 'bg-gray-400 text-white cursor-wait'
                                : confirmingCoinId === coin.id
                                ? 'bg-amber-500 hover:bg-amber-600 font-extrabold text-white animate-pulse'
                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                            }`}
                          >
                            {loadingCoinId === coin.id ? (
                              <>
                                <Loader2 className="w-3 h-3 animate-spin text-white" /> PROSES...
                              </>
                            ) : confirmingCoinId === coin.id ? (
                              <>
                                <Rocket className="w-3 h-3 animate-bounce text-white" /> KLIK LAGI UNTUK LUNCURKAN
                              </>
                            ) : (
                              <>
                                <Rocket className="w-3 h-3 text-white" /> LISTING INSTAN
                              </>
                            )}
                          </button>
                          
                          {errorCoinId[coin.id] && (
                            <span className="text-[9px] font-bold text-rose-500 text-right mt-0.5 block max-w-[150px] truncate">
                              {errorCoinId[coin.id]}
                            </span>
                          )}
                        </div>
                      )}

                      <button
                        id={`btn-order-ipo-${coin.id}`}
                        disabled={isListed || coin.status === 'Failed'}
                        onClick={() => setSelectedCoin(coin)}
                        className={`text-xs font-black px-4 py-2 rounded-sm transition-all ${
                          (isListed || coin.status === 'Failed')
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200/50' 
                            : 'bg-[#00AE64]/10 text-[#00AE64] hover:bg-[#00AE64] hover:text-white border border-[#00AE64]/20 hover:border-transparent cursor-pointer'
                        }`}
                      >
                        {isListed ? 'Listed' : coin.status === 'Failed' ? 'Refunded' : isUpcoming ? 'Pesankan' : 'Beli IPO'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </AnimatePresence>

      {/* Buying Order Modal Modal */}
      <AnimatePresence>
        {selectedCoin && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white border border-gray-200 rounded-sm w-full max-w-md p-6 relative overflow-hidden"
            >
              <button
                id="btn-close-ipo-modal"
                onClick={() => setSelectedCoin(null)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 font-bold cursor-pointer text-sm"
              >
                X
              </button>

              {successMsg ? (
                <div className="py-8 flex flex-col items-center text-center justify-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#00AE64]">
                    <Sparkles className="w-6 h-6 animate-pulse" />
                  </div>
                  <h3 className="font-black text-gray-950 text-lg">Pemesanan Sukses!</h3>
                  <p className="text-gray-500 text-xs px-4">{successMsg}</p>
                </div>
              ) : (
                <form id="ipo-order-form" onSubmit={handleOrderSubmit} className="space-y-4">
                  <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                    <img 
                      src={selectedCoin.logo || `https://api.dicebear.com/7.x/identicon/svg?seed=${selectedCoin.symbol}`} 
                      alt={selectedCoin.symbol} 
                      className="w-10 h-10 rounded-sm object-contain"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <h3 className="font-extrabold text-gray-900 text-base">Trade IPO {selectedCoin.symbol}</h3>
                      <p className="text-xs text-gray-400 font-bold uppercase">{selectedCoin.name}</p>
                    </div>
                  </div>

                  {/* Specs & limits */}
                  <div className="grid grid-cols-2 gap-4 text-xs font-bold bg-neutral-50 p-3 rounded-sm">
                    <div>
                      <span className="text-gray-400 text-[10px] uppercase block mb-0.5">Harga IPO</span>
                      <span className="text-gray-900 font-mono">${selectedCoin.initialPrice}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 text-[10px] uppercase block mb-0.5">Min / Max Beli</span>
                      <span className="text-gray-900 font-mono">{selectedCoin.minBuy} / {selectedCoin.maxBuy}</span>
                    </div>
                  </div>

                  {userProfile && (
                    <div className="flex items-center justify-between text-xs font-bold px-1">
                      <span className="text-gray-400">Saldo Rekening Anda</span>
                      <span className="text-[#00AE64]">${userProfile.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}

                  {/* Amount Input */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Jumlah Pemesanan ({selectedCoin.symbol})</label>
                    <div className="relative">
                      <input
                        id="ipo-order-amount-input"
                        type="number"
                        step="any"
                        placeholder={`${selectedCoin.minBuy} - ${selectedCoin.maxBuy}`}
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 text-sm font-bold text-gray-900 focus:outline-none focus:border-[#00AE64] rounded-sm pr-24 focus:bg-white transition-all"
                        required
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (userProfile && selectedCoin) {
                              const maxBuyByBalance = userProfile.balance / selectedCoin.initialPrice;
                              const finalMax = Math.min(maxBuyByBalance, selectedCoin.maxBuy || 100000);
                              if (finalMax > 0) {
                                setAmount(Number(finalMax.toFixed(8)).toString());
                              } else {
                                setAmount('0');
                              }
                            }
                          }}
                          className="text-[10px] font-bold text-[#00AE64] bg-[#00AE64]/10 hover:bg-[#00AE64]/20 px-1.5 py-0.5 rounded cursor-pointer transition-all"
                        >
                          MAX
                        </button>
                        <span className="text-xs font-bold text-gray-400 uppercase">{selectedCoin.symbol}</span>
                      </div>
                    </div>
                  </div>

                  {/* Estimation info */}
                  {amount && !isNaN(Number(amount)) && Number(amount) > 0 && (
                    <div className="p-3 bg-[#00AE64]/5 border border-[#00AE64]/10 rounded-sm text-xs font-bold flex flex-col gap-1">
                      <div className="flex justify-between text-gray-500">
                        <span>Estimasi Total</span>
                        <span className="text-gray-900">${(Number(amount) * selectedCoin.initialPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  )}

                  {/* Warning */}
                  <div className="flex gap-2 p-3 bg-yellow-50 text-yellow-700 rounded-sm text-[11px] font-semibold">
                    <AlertCircle className="w-5 h-5 shrink-0 text-yellow-500" />
                    <span>Pemesanan IPO bersifat final dan tidak dapat dibatalkan. Koin akan didaftarkan otomatis ketika target dana terpenuhi atau waktu IPO usai.</span>
                  </div>

                  {/* Submit Button */}
                  <button
                    id="submit-ipo-order"
                    type="submit"
                    disabled={isOrdering}
                    className="w-full bg-[#00AE64] hover:bg-[#009656] text-white font-bold py-3.5 px-4 rounded-sm transition-all text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isOrdering ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Verifikasi Pemesanan...
                      </>
                    ) : (
                      'Kirim Pesanan IPO'
                    )}
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Floating Success Toast */}
      <AnimatePresence>
        {successToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 min-w-[320px] max-w-[95%] bg-neutral-900 border border-neutral-800 text-white px-5 py-4 rounded-lg shadow-2xl z-50 flex items-center gap-3.5"
          >
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <Rocket className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#00AE64]">LAUNCHPAD SYSTEM</p>
              <p className="text-xs text-neutral-300 font-semibold mt-0.5 leading-normal">{successToast}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
