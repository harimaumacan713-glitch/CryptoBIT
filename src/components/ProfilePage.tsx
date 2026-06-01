import { useState } from 'react';
import { useFirebase } from './FirebaseProvider';
import { Calendar, Search, PlusCircle, Download, Upload, Send, Eye, TrendingUp, Coins, Wallet, X, Loader2, ArrowRight, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ProfileModal from './ProfileModal';
import { useRealTimeCrypto } from '../hooks/useRealTimeCrypto';
import { WATCHLIST_COINS } from '../utils/constants';

const TABS = ['Assets', 'History', 'Saved', 'Settings'];

const MOCK_PRICES: Record<string, number> = {
  'USD': 1,
  'BTC': 96345.75,
  'ETH': 2760.00,
  'USDT': 1.00
};

export default function ProfilePage() {
  const { user, userProfile, updateBalance, transferBalance, transferAsset, coins } = useFirebase();
  const cryptos = useRealTimeCrypto(WATCHLIST_COINS, coins);
  const [activeTab, setActiveTab] = useState('Assets');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);
  
  // Transaction Modals State
  const [txModal, setTxModal] = useState<'Deposit' | 'Withdraw' | 'Transfer' | null>(null);
  const [txAmount, setTxAmount] = useState('');
  const [txRecipient, setTxRecipient] = useState('');
  const [txAsset, setTxAsset] = useState('USD');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCopyAddress = () => {
    if (!userProfile?.walletAddress) return;
    try {
      navigator.clipboard.writeText(userProfile.walletAddress);
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    } catch (err) {
      const tempInput = document.createElement('input');
      tempInput.value = userProfile.walletAddress;
      document.body.appendChild(tempInput);
      tempInput.select();
      document.execCommand('copy');
      document.body.removeChild(tempInput);
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    }
  };

  if (!user || !userProfile) return null;

  // Calculate Asset Values
  const assetEntries = (Object.entries(userProfile.assets || {}) as [string, number][]).filter(([_, amount]) => amount > 0);
  
  // Add balance as an asset for the overall view calculation
  const totalBalanceValue = userProfile.balance || 0;
  
  const totalAssetsValue = assetEntries.reduce((total, [symbol, amount]) => {
    const cryptoInfo = cryptos.find(c => c.symbol === symbol);
    const price = cryptoInfo ? cryptoInfo.price : (MOCK_PRICES[symbol] || 0.1);
    return total + (amount * price);
  }, 0);

  const totalInvestedAssets = assetEntries.reduce((total, [symbol, amount]) => {
    const cryptoInfo = cryptos.find(c => c.symbol === symbol);
    const price = cryptoInfo ? cryptoInfo.price : (MOCK_PRICES[symbol] || 0.1);
    const invested = userProfile.assetsInvested?.[symbol] || (amount * price * 0.9);
    return total + invested;
  }, 0);

  const totalPortfolioValue = totalBalanceValue + totalAssetsValue;
  const portfolioPnl = totalAssetsValue - totalInvestedAssets;
  const portfolioPnlPercentage = totalInvestedAssets > 0 ? (portfolioPnl / totalInvestedAssets) * 100 : 0;
  const isPortfolioPositive = portfolioPnl >= 0;

  const currentBtcPrice = cryptos.find(c => c.symbol === 'BTC')?.price || MOCK_PRICES['BTC'];

  const handleTransaction = async () => {
    if (!txAmount || isNaN(Number(txAmount)) || Number(txAmount) <= 0) return alert('Invalid amount');
    
    setIsProcessing(true);
    try {
      const amount = Number(txAmount);
      if (txModal === 'Deposit') {
        await updateBalance(amount);
      } else if (txModal === 'Withdraw') {
        if (userProfile.balance < amount) throw new Error('Insufficient balance');
        await updateBalance(-amount);
      } else if (txModal === 'Transfer') {
        if (!txRecipient) throw new Error('Recipient required');
        if (txAsset === 'USD') {
          await transferBalance(txRecipient, amount);
        } else {
          await transferAsset(txRecipient, txAsset, amount);
        }
      }
      setTxModal(null);
      setTxAmount('');
      setTxRecipient('');
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 mt-4 w-full relative">
      <ProfileModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} />

      {/* Transaction Modal */}
      <AnimatePresence>
        {txModal && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => !isProcessing && setTxModal(null)}
            >
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                onClick={e => e.stopPropagation()}
                className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
              >
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-900">{txModal} Funds</h3>
                  <button onClick={() => setTxModal(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5"/></button>
                </div>
                
                <div className="p-6 space-y-4">
                  {txModal === 'Transfer' && (
                    <div className="flex flex-col gap-4">
                      <div className="flex gap-4">
                        <div className="w-[110px] shrink-0">
                          <label className="text-[11px] font-black text-gray-500 uppercase tracking-wider block mb-1">Pilih Aset</label>
                          <select 
                            value={txAsset} 
                            onChange={e => setTxAsset(e.target.value)}
                            className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:border-[#00AE64] focus:ring-1 focus:ring-[#00AE64] outline-none bg-white font-bold text-gray-800"
                          >
                            <option value="USD">USD</option>
                            {assetEntries.map(([symbol]) => (
                              <option key={symbol} value={symbol}>{symbol}</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex-1">
                          <label className="text-[11px] font-black text-gray-500 uppercase tracking-wider block mb-1">E-Wallet Address / Email Penerima</label>
                          <input 
                            type="text" 
                            value={txRecipient}
                            onChange={e => setTxRecipient(e.target.value)}
                            placeholder="Contoh: 0x8283956a85f11... atau email"
                            className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:border-[#00AE64] focus:ring-1 focus:ring-[#00AE64] outline-none font-mono font-semibold text-gray-900"
                          />
                        </div>
                      </div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide leading-normal bg-gray-50 p-2.5 rounded-md border border-gray-150 flex items-start gap-1.5">
                        <span className="text-[#00AE64]">💡</span> 
                        <span>Anda dapat mentransfer dana secara instan ke pengguna lain menggunakan alamat e-wallet hex atau alamat email akun mereka.</span>
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Amount {txModal === 'Deposit' ? '(USD)' : ''}</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">
                        {txModal !== 'Transfer' || txAsset === 'USD' ? '$' : ''}
                      </span>
                      <input 
                        type="number" 
                        value={txAmount}
                        onChange={e => setTxAmount(e.target.value)}
                        placeholder="0.00"
                        className={`w-full border border-gray-200 rounded-lg p-4 text-xl font-bold focus:border-[#00AE64] focus:ring-1 focus:ring-[#00AE64] outline-none ${(txModal !== 'Transfer' || txAsset === 'USD') ? 'pl-8' : ''}`}
                      />
                    </div>
                    {txModal !== 'Deposit' && (
                      <p className="text-xs text-gray-500 mt-2 text-right">
                        Available: <span className="font-bold text-gray-900">
                          {txAsset === 'USD' || txModal !== 'Transfer' 
                            ? `$${userProfile.balance.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` 
                            : `${(userProfile.assets?.[txAsset] || 0).toLocaleString()} ${txAsset}`}
                        </span>
                      </p>
                    )}
                  </div>

                  <button 
                    onClick={handleTransaction}
                    disabled={isProcessing || !txAmount || Number(txAmount) <= 0}
                    className="w-full mt-4 bg-[#00AE64] hover:bg-emerald-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                  >
                    {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                      <>
                        <span className="capitalize">Confirm {txModal}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Top Profile Card */}
      <div className="bg-white border border-gray-200 rounded-sm p-6 lg:p-10 flex flex-col md:flex-row items-center md:items-start justify-between gap-6 relative overflow-hidden">
        {/* Subtle background pattern */}
        <div className="absolute top-0 right-0 p-8 pt-16 opacity-5 pointer-events-none">
           <svg className="w-64 h-64" viewBox="0 0 100 100">
             <path d="M50 0 L100 50 L50 100 L0 50 Z" fill="currentColor" />
           </svg>
        </div>

        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 z-10 w-full">
          {/* Avatar */}
          <div className="w-28 h-28 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-white shadow-md bg-blue-100 flex-shrink-0 flex items-center justify-center">
            {user.photoURL && user.photoURL !== "" ? (
              <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
               <div className="w-full h-full bg-gradient-to-tr from-blue-300 to-blue-500 flex items-center justify-center text-white text-4xl font-bold">
                 {user.displayName?.charAt(0).toUpperCase() || 'U'}
               </div>
            )}
          </div>

          {/* User Info */}
          <div className="flex flex-col items-center md:items-start flex-1 w-full text-center md:text-left mt-2">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">{user.displayName || 'Cryptobit User'}</h1>
            <p className="text-gray-500 font-medium">@{user.displayName?.replace(/\s+/g, '').toLowerCase() || 'user'}</p>
            {userProfile.walletAddress && (
               <button 
                 onClick={handleCopyAddress}
                 className="mt-2 bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-md border border-gray-200 inline-flex items-center gap-2 cursor-pointer transition-all active:scale-[0.97]"
                 title="Salin Alamat Dompet"
               >
                 <Wallet className="w-3.5 h-3.5 text-gray-500 hover:text-[#00AE64]" />
                 <span className="font-mono text-xs text-gray-600 font-extrabold">{userProfile.walletAddress}</span>
                 {copiedAddress ? (
                   <span className="text-[10px] text-emerald-600 font-black flex items-center gap-0.5 ml-1">
                     <Check className="w-3 h-3 text-emerald-600" /> Tersalin!
                   </span>
                 ) : (
                   <Copy className="w-3 h-3 text-gray-400 hover:text-gray-600 ml-1" />
                 )}
               </button>
            )}

            <div className="flex items-center gap-6 mt-4">
              <div onClick={() => setTxModal('Deposit')} className="flex flex-col items-center gap-1 cursor-pointer group">
                <div className="w-10 h-10 rounded-full bg-[#00AE64]/10 text-[#00AE64] flex items-center justify-center group-hover:bg-[#00AE64] group-hover:text-white transition-colors">
                  <Download className="w-5 h-5" />
                </div>
                <span className="text-gray-600 text-sm font-semibold group-hover:text-gray-900 transition-colors">Deposit</span>
              </div>
              <div onClick={() => setTxModal('Withdraw')} className="flex flex-col items-center gap-1 cursor-pointer group">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-colors">
                  <Upload className="w-5 h-5" />
                </div>
                <span className="text-gray-600 text-sm font-semibold group-hover:text-gray-900 transition-colors">Withdraw</span>
              </div>
              <div onClick={() => { setTxAsset('USD'); setTxModal('Transfer'); }} className="flex flex-col items-center gap-1 cursor-pointer group">
                <div className="w-10 h-10 rounded-full bg-purple-500/10 text-purple-500 flex items-center justify-center group-hover:bg-purple-500 group-hover:text-white transition-colors">
                  <Send className="w-5 h-5" />
                </div>
                <span className="text-gray-600 text-sm font-semibold group-hover:text-gray-900 transition-colors">Transfer</span>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-4 text-gray-400 text-sm">
              <Calendar className="w-4 h-4" />
              <span>Joined {user.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }) : 'recently'}</span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="z-10 flex-shrink-0 mt-4 md:mt-0">
          <button 
            onClick={() => setIsEditModalOpen(true)}
            className="px-5 py-2 rounded-sm border border-gray-300 text-sm font-semibold text-[#00AE64] hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            Edit Profile
          </button>
        </div>
      </div>

      {/* Tabs and Content Section */}
      <div className="bg-white border border-gray-200 rounded-sm overflow-hidden flex flex-col min-h-[500px]">
        {/* Tabs */}
        <div className="flex items-center justify-between border-b border-gray-100 px-2 lg:px-6 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-2 lg:gap-6 py-1">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative px-2 lg:px-4 py-4 text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab ? 'text-gray-900' : 'text-gray-400 hover:text-gray-700'
                }`}
              >
                {tab}
                {activeTab === tab && (
                  <motion.div
                    layoutId="profileTabIndicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00AE64]"
                  />
                )}
              </button>
            ))}
          </div>
          <button className="p-2 text-gray-400 hover:text-gray-700 ml-4">
            <Search className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'Assets' ? (
          <div className="p-6 lg:p-10 flex-1 bg-gray-50/30">
            {/* Total Balance Card */}
            <div className="bg-gradient-to-tr from-gray-900 via-[#111827] to-[#1f2937] rounded-2xl p-8 text-white relative overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.12)] mb-8 border border-gray-800">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <svg className="w-48 h-48 -mr-10 -mt-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                   <circle cx="12" cy="12" r="10"></circle>
                   <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"></path>
                   <path d="M12 18V6"></path>
                </svg>
              </div>
              <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-[#00AE64]/10 to-transparent pointer-events-none"></div>

              <div className="relative z-10 flex flex-col md:flex-row justify-between gap-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-gray-400 font-medium flex items-center gap-2">
                      <Wallet className="w-5 h-5 text-gray-500" /> Total Expected Value
                    </p>
                  </div>
                  <div className="flex items-end gap-4 mb-3">
                    <h2 className="text-4xl md:text-5xl font-black tracking-tighter">${totalPortfolioValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</h2>
                    <span className={`${isPortfolioPositive ? 'text-[#00AE64] bg-[#00AE64]/10' : 'text-red-500 bg-red-500/10'} font-bold text-lg pb-1.5 flex items-center gap-1 px-2 py-0.5 rounded-md`}>
                      <TrendingUp className={`w-4 h-4 ${!isPortfolioPositive && 'rotate-180'}`} /> {isPortfolioPositive ? '+' : ''}{portfolioPnlPercentage.toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-500 font-medium">
                    <span>≈ {(totalPortfolioValue / currentBtcPrice).toFixed(4)} BTC</span>
                  </div>
                </div>

                <div className="bg-white/5 rounded-xl border border-white/10 p-5 flex flex-col justify-center min-w-[200px]">
                  <p className="text-gray-400 text-sm font-medium mb-1">Available USD Balance</p>
                  <h3 className="text-2xl font-bold text-[#00AE64]">${totalBalanceValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</h3>
                </div>
              </div>
            </div>
            
            {/* Asset List */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                 <Coins className="w-5 h-5 text-[#00AE64]" /> Portfolio Assets
              </h3>
              <div className="flex gap-2">
                 <button className="px-3 py-1.5 text-xs font-bold bg-white border border-gray-200 rounded text-gray-600 hover:bg-gray-50">Filter</button>
                 <button className="px-3 py-1.5 text-xs font-bold bg-white border border-gray-200 rounded text-gray-600 hover:bg-gray-50">Export</button>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 uppercase tracking-widest">
                    <th className="py-4 px-6 font-bold">Asset</th>
                    <th className="py-4 px-6 font-bold text-right">Balance</th>
                    <th className="py-4 px-6 font-bold text-right">Value (USD)</th>
                    <th className="py-4 px-6 font-bold text-right">Allocation</th>
                  </tr>
                </thead>
                <tbody>
                  {assetEntries.length > 0 ? assetEntries.map(([symbol, amount]) => {
                    const cryptoInfo = cryptos.find(c => c.symbol === symbol);
                    const price = cryptoInfo ? cryptoInfo.price : (MOCK_PRICES[symbol] || 0.1);
                    const value = amount * price;
                    const allocation = totalPortfolioValue > 0 ? (value / totalPortfolioValue) * 100 : 0;
                    
                    return (
                      <tr key={symbol} className="border-b border-gray-100 hover:bg-gray-50 transition-colors group cursor-pointer">
                        <td className="py-5 px-6 flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full border border-gray-100 bg-white shadow-sm flex items-center justify-center overflow-hidden shrink-0">
                            {/* Fetch real logo or fallback image */}
                            <img src={cryptoInfo?.logo || `https://api.dicebear.com/7.x/identicon/svg?seed=${symbol}`} alt={symbol} className="w-6 h-6 object-contain" />
                          </div>
                          <div>
                            <span className="font-bold text-gray-900 block text-sm group-hover:text-[#00AE64] transition-colors">{symbol} Token</span>
                            <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider">{symbol}</span>
                          </div>
                        </td>
                        <td className="py-5 px-6 text-right">
                          <span className="font-bold text-gray-900 block text-sm">{amount.toLocaleString(undefined, {maximumFractionDigits: 4})}</span>
                          <span className="text-gray-500 text-xs font-medium">Available</span>
                        </td>
                        <td className="py-5 px-6 text-right">
                          <span className="font-bold text-gray-900 block text-sm">${value.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                        </td>
                        <td className="py-5 px-6">
                          <div className="flex flex-col items-end justify-center w-24 ml-auto">
                            <span className="text-xs font-bold text-gray-900 mb-1">{allocation.toFixed(1)}%</span>
                            <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                              <div className="bg-[#00AE64] h-1.5 rounded-full" style={{ width: `${allocation}%` }}></div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-gray-500 font-medium">
                        You do not hold any assets yet. Head over to the Watchlist to buy some tokens!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gray-50/50">
            <div className="w-24 h-24 mb-4 text-[#00AE64] opacity-80 mt-10">
              <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M30 60 H70 V80 H30 Z" stroke="currentColor" strokeWidth="4" strokeLinejoin="round"/>
                <path d="M40 60 V50 C40 40 60 40 60 30" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M60 60 V50" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="4" strokeDasharray="4 8" />
                <path d="M45 70 H55" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
              </svg>
            </div>
            <p className="text-gray-500 font-medium mb-6">Belum ada {activeTab.toLowerCase()}</p>
            {activeTab !== 'Settings' && (
              <button className="flex items-center gap-2 px-6 py-2.5 rounded-sm border border-[#00AE64] text-[#00AE64] font-semibold hover:bg-[#00AE64]/5 transition-colors mb-20 bg-white">
                <PlusCircle className="w-4 h-4" />
                Tambah Data
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
