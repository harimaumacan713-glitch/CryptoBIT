/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import Header from './components/Header';
import Navbar from './components/Navbar';
import TrendingStocks from './components/TrendingStocks';
import PromoBanner from './components/PromoBanner';
import PostInput from './components/PostInput';
import Feed from './components/Feed';
import Sidebar from './components/Sidebar';
import Portfolio from './components/Portfolio';
import Orderbook from './components/Orderbook';
import Launchpad from './components/Launchpad';
import IPOCenter from './components/IPOCenter';
import BrokerAnalysis from './components/BrokerAnalysis';
import Watchlist from './components/Watchlist';
import ProfilePage from './components/ProfilePage';
import SplashLoginScreen from './components/SplashLoginScreen';
import Chartbit from './components/Chartbit';
import Academy from './components/Academy';
import { Clock, History, Flame, Diamond, Truck, Calendar, Headphones, MoreHorizontal, LayoutPanelLeft, X, Trophy, Medal, Award, Sparkles, Crown, TrendingUp } from 'lucide-react';
import { useFirebase } from './components/FirebaseProvider';
import { AnimatePresence, motion } from 'motion/react';

export default function App() {
  const [activeTab, setActiveTab] = useState('Stream');
  const [hasCompletedSplash, setHasCompletedSplash] = useState(false);
  const [isWinnersModalOpen, setIsWinnersModalOpen] = useState(false);
  const [claimedBadge, setClaimedBadge] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [supportMessage, setSupportMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'support'; text: string }>>([
    { sender: 'support', text: 'Halo! Selamat datang di Pusat Bantuan KriptoBit Pro. Ada yang bisa kami bantu seputar bursa AMM, Chartbit, fitur diskusi Academy, atau penawaran IPO hari ini?' }
  ]);
  const { user, loading } = useFirebase();

  if (loading) {
     return <div className="min-h-screen bg-slate-50" />;
  }

  if (!hasCompletedSplash || !user) {
    return <SplashLoginScreen onLoginSuccess={() => setHasCompletedSplash(true)} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-[#00AE64]/30">
      <Header setActiveTab={setActiveTab} />
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="max-w-[1400px] mx-auto px-4 pb-12 flex gap-6">
        {/* Main Content Area */}
        <div className="flex-1 min-w-0">
          {activeTab === 'Stream' ? (
            <>
              <TrendingStocks />
              
              <div id="upcoming-web3-banner" className="bg-[#10061d] rounded-xl p-6 sm:p-8 mb-4 text-white relative overflow-hidden group border border-purple-500/20 shadow-2xl shadow-purple-950/25">
                {/* Background Poster Image */}
                <div className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-lighten pointer-events-none" style={{ backgroundImage: "url('/src/assets/images/web3_banner_1779983854222.png')" }}></div>
                
                {/* Highly reliable looping Award/Gold particles video */}
                <video 
                  autoPlay 
                  loop 
                  muted 
                  playsInline 
                  className="absolute inset-0 w-full h-full object-cover opacity-75 pointer-events-none select-none transition-all duration-1000 group-hover:scale-[1.03]"
                >
                  <source src="https://cdn.pixabay.com/video/2021/04/12/70831-537380922_large.mp4" type="video/mp4" />
                  <source src="https://cdn.pixabay.com/video/2016/11/14/6306-191599863_large.mp4" type="video/mp4" />
                </video>
                <div className="absolute inset-0 bg-gradient-to-t from-[#0e041a] via-transparent to-transparent"></div>

                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="bg-gradient-to-r from-amber-500/20 to-purple-500/20 border border-amber-400/30 backdrop-blur-md px-3 py-1 rounded text-[10px] font-extrabold uppercase tracking-widest inline-block text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.25)]">
                      Featured Event & Awards
                    </span>
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                  </div>
                  
                  <h2 className="text-2xl sm:text-3xl font-black italic tracking-tighter leading-none mb-2 bg-gradient-to-r from-white via-amber-100 to-amber-300 bg-clip-text text-transparent drop-shadow-[0_2px_8px_rgba(245,158,11,0.3)]">
                    VIA X GLOBAL AWARDS
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-200 max-w-md font-semibold leading-relaxed mb-1">
                    Apresiasi paling bergengsi bagi para legenda bursa VIA X yang mendominasi pasar AMM, mencetak ROI tertinggi, dan meluncurkan Launchpad tersukses musim ini!
                  </p>
                </div>
                
                <button 
                  onClick={() => setIsWinnersModalOpen(true)}
                  className="relative z-10 mt-5 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs uppercase tracking-wider px-6 py-3 rounded-lg transition-all shadow-[0_0_20px_rgba(245,158,11,0.4)] hover:shadow-[0_0_30px_rgba(245,158,11,0.6)] hover:-translate-y-0.5 active:translate-y-0 duration-200 cursor-pointer"
                >
                  Liat Pemenang
                </button>
              </div>
              <PromoBanner />
              <div className="flex flex-col lg:flex-row gap-6 items-start">
                <div className="flex-1 w-full min-w-0">
                  <PostInput />
                  <Feed />
                </div>
                <Sidebar />
              </div>
            </>
          ) : activeTab === 'Portfolio' ? (
            <Portfolio />
          ) : activeTab === 'Orderbook' ? (
            <Orderbook />
          ) : activeTab === 'Watchlist' ? (
            <Watchlist />
          ) : activeTab === 'Profile' ? (
            <ProfilePage />
          ) : activeTab === 'Create Coin' ? (
             <Launchpad onComplete={() => setActiveTab('Crypto IPO')} />
          ) : activeTab === 'Crypto IPO' ? (
             <IPOCenter />
          ) : activeTab === 'Broker Analysis' ? (
             <div className="mt-4"><BrokerAnalysis /></div>
          ) : activeTab === 'Chartbit' ? (
             <Chartbit />
          ) : activeTab === 'Academy' ? (
             <Academy />
          ) : (
            <div className="flex flex-col items-center justify-center p-20 bg-white border border-slate-200 rounded-lg shadow-sm mt-4">
               <h2 className="text-xl font-bold text-slate-400 uppercase tracking-widest">{activeTab} Section</h2>
               <p className="text-slate-500 text-sm mt-2">This feature is coming soon to VIA X.</p>
            </div>
          )}
        </div>

        {/* Right Utility Rail (Floating on desktop with interactive events) */}
        <aside className="hidden xl:flex flex-col gap-4 py-4 border-l border-slate-200 pl-6 h-screen sticky top-16">
          <div className="flex flex-col gap-6 items-center">
             <div 
               onClick={() => {
                 setActiveTab('Chartbit');
                 window.scrollTo({ top: 0, behavior: 'smooth' });
               }}
               className={`p-2 border rounded-md shadow-sm cursor-pointer transition-colors ${
                 activeTab === 'Chartbit' 
                   ? 'border-[#00AE64] bg-[#00AE64]/10' 
                   : 'border-slate-200 bg-white hover:bg-slate-50'
               }`}
             >
                <LayoutPanelLeft className={`w-6 h-6 ${activeTab === 'Chartbit' ? 'text-[#00AE64]' : 'text-slate-400'}`} />
                <p className="text-[10px] font-bold text-center mt-1 leading-tight text-slate-500">Dashboard Area</p>
             </div>
              
             <div className="flex flex-col gap-6">
                <Clock 
                  onClick={() => {
                    setActiveTab('Orderbook');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`w-5 h-5 cursor-pointer hover:text-[#00AE64] transition-colors ${activeTab === 'Orderbook' ? 'text-[#00AE64] scale-110' : 'text-slate-450'}`} 
                  title="Lihat Orderbook"
                />
                <History 
                  onClick={() => {
                    setActiveTab('Portfolio');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`w-5 h-5 cursor-pointer hover:text-[#00AE64] transition-colors ${activeTab === 'Portfolio' ? 'text-[#00AE64] scale-110' : 'text-slate-450'}`}
                  title="Portfolio Saya"
                />
                <Flame 
                  onClick={() => {
                    setActiveTab('Watchlist');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`w-5 h-5 cursor-pointer hover:text-[#00AE64] transition-colors ${activeTab === 'Watchlist' ? 'text-[#00AE64] scale-110' : 'text-slate-450'}`}
                  title="Watchlist Koin"
                />
                <Diamond 
                  onClick={() => {
                    setActiveTab('Academy');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`w-5 h-5 cursor-pointer hover:text-[#00AE64] transition-colors ${activeTab === 'Academy' ? 'text-[#00AE64] scale-110' : 'text-slate-450'}`}
                  title="Academy Web3"
                />
                <Truck 
                  onClick={() => {
                    setActiveTab('Create Coin');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`w-5 h-5 cursor-pointer hover:text-[#00AE64] transition-colors ${activeTab === 'Create Coin' ? 'text-[#00AE64] scale-110' : 'text-slate-450'}`}
                  title="Launchpad Baru"
                />
                <Calendar 
                  onClick={() => {
                    setActiveTab('Crypto IPO');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`w-5 h-5 cursor-pointer hover:text-[#00AE64] transition-colors ${activeTab === 'Crypto IPO' ? 'text-[#00AE64] scale-110' : 'text-slate-450'}`}
                  title="IPO Hub Calendar"
                />
                <Headphones 
                  onClick={() => setIsSupportOpen(prev => !prev)}
                  className={`w-5 h-5 cursor-pointer hover:text-[#00AE64] transition-colors ${isSupportOpen ? 'text-[#00AE64] scale-110' : 'text-slate-450'}`}
                  title="Customer Support Desk"
                />
                <MoreHorizontal 
                  onClick={() => {
                    setActiveTab('Profile');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`w-5 h-5 cursor-pointer hover:text-[#00AE64] transition-colors ${activeTab === 'Profile' ? 'text-[#00AE64]' : 'text-slate-450'}`}
                  title="Profil Sesi"
                />
             </div>
          </div>
        </aside>
      </main>

      {/* Footer Mobile Nav (Floating on mobile) */}
      <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 bg-white/95 border border-slate-200 px-6 py-3 rounded-full shadow-lg flex gap-8 z-55 items-center">
        <Clock 
          onClick={() => { setActiveTab('Orderbook'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          className={`w-5 h-5 cursor-pointer ${activeTab === 'Orderbook' ? 'text-[#00AE64]' : 'text-slate-450 hover:text-slate-700'}`} 
        />
        <Calendar 
          onClick={() => { setActiveTab('Crypto IPO'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          className={`w-5 h-5 cursor-pointer ${activeTab === 'Crypto IPO' ? 'text-[#00AE64]' : 'text-slate-450 hover:text-slate-700'}`} 
        />
        <LayoutPanelLeft
          onClick={() => { setActiveTab('Chartbit'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          className={`w-5 h-5 cursor-pointer ${activeTab === 'Chartbit' ? 'text-[#00AE64]' : 'text-slate-450 hover:text-slate-700'}`}
        />
        <MoreHorizontal 
          onClick={() => { setActiveTab('Profile'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          className={`w-5 h-5 cursor-pointer ${activeTab === 'Profile' ? 'text-[#00AE64]' : 'text-slate-450 hover:text-slate-700'}`} 
        />
      </div>

      {/* Floating Active support desk chat drawer */}
      <AnimatePresence>
        {isSupportOpen && (
          <div className="fixed bottom-20 right-6 sm:right-24 w-80 sm:w-96 bg-[#121622] text-white border border-slate-800 rounded-xl shadow-2xl z-55 overflow-hidden flex flex-col h-[400px]">
             {/* Header support bar */}
             <div className="p-3 bg-[#0c101b] border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                   <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                   <div>
                      <h4 className="text-xs font-black text-white leading-tight uppercase tracking-wider">KriptoBit Pro Support</h4>
                      <span className="text-[9px] text-[#00AE64] font-bold">100% Online, Ready to assist</span>
                   </div>
                </div>
                <button 
                  onClick={() => setIsSupportOpen(false)}
                  className="text-slate-500 hover:text-white font-bold text-xs"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
             </div>

             {/* Message feeds stream */}
             <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#080B11]/90">
                {chatMessages.map((msg, idx) => (
                  <div 
                    key={idx}
                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                     <div className={`p-2.5 rounded-lg text-xs leading-relaxed max-w-[85%] ${
                       msg.sender === 'user'
                         ? 'bg-[#00AE64] text-white font-bold rounded-tr-none'
                         : 'bg-[#181d2c] text-slate-200 font-semibold rounded-tl-none border border-slate-800'
                     }`}>
                        {msg.text}
                     </div>
                  </div>
                ))}
             </div>

             {/* Footer entry inputs */}
             <form 
               onSubmit={(e) => {
                 e.preventDefault();
                 if (!supportMessage.trim()) return;
                 const rawUserMsg = supportMessage;
                 const updatedMsgs = [...chatMessages, { sender: 'user', text: rawUserMsg }];
                 setChatMessages(updatedMsgs);
                 setSupportMessage('');

                 // Generate smart automated instant help replies
                 setTimeout(() => {
                    const cleanText = rawUserMsg.toLowerCase();
                    let response = 'Terima kasih atas laporan Anda! Pertanyaan Anda telah dicatat dalam sistem tiket darurat nomor #' + Math.floor(Math.random() * 900000 + 100000) + '. Tim technical support kami akan meninjau secepatnya.';
                    
                    if (cleanText.includes('kelas') || cleanText.includes('mentor') || cleanText.includes('academy') || cleanText.includes('gabung') || cleanText.includes('belajar')) {
                       response = 'ACADEMY HUB TIPS: Anda bisa menjadi Mentor dengan membangun Kelas sendiri, atau bergabung ke Kelas buatan trader lain untuk berdiskusi strategi market secara real-time!';
                    } else if (cleanText.includes('ipo') || cleanText.includes('hardcap') || cleanText.includes('listed') || cleanText.includes('gagal')) {
                       response = 'IPO HUB PROTOCOLS: Koin dalam status IPO Live akan beralih listed otomatis bila target Hardcap (pembelian 20% total pasokan) telah tercapai. Jika target dana gagal terpenuhi hingga hitung mundur usai, modal investor akan dikembalikan penuh (automated full refund) ke saldo Firebase!';
                    } else if (cleanText.includes('chart') || cleanText.includes('grafik') || cleanText.includes('indikator') || cleanText.includes('rsi') || cleanText.includes('ma')) {
                       response = 'CHARTBIT ADVISORY: Terminal bursa Chartbit menyuguhkan diagram garis real-time multi-indikator. Anda bisa memicu overlay Moving Average (MA), Exponential Moving Average (EMA), maupun RSI di panel instrumen.';
                    } else if (cleanText.includes('hancur') || cleanText.includes('dump') || cleanText.includes('manipulasi') || cleanText.includes('crash')) {
                       response = 'CRASH PROTECTION: Demi menjamin transparansi bursa retail, platform mengunci pencipta koin agar dilarang mendeposit / mendump koin bikinan melebihi 5% total supply sekaligus dalam satu waktu transaksi.';
                    }

                    setChatMessages(prev => [...prev, { sender: 'support', text: response }]);
                 }, 800);
               }} 
               className="p-2 border-t border-slate-800 bg-[#0c101b] flex gap-2"
             >
                <input
                  type="text"
                  placeholder="Ketik pertanyaan Anda..."
                  value={supportMessage}
                  onChange={(e) => setSupportMessage(e.target.value)}
                  className="flex-grow bg-[#121622] border border-slate-800 rounded px-3 py-1.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-[#00AE64]"
                />
                <button
                  type="submit"
                  className="bg-[#00AE64] hover:bg-[#009656] text-white px-3 py-1 text-xs font-bold rounded cursor-pointer transition-colors animate-pulse"
                >
                  Kirim
                </button>
             </form>
          </div>
        )}
      </AnimatePresence>

      {/* VIA X GLOBAL AWARDS WINNERS INTERACTIVE MODAL */}
      <AnimatePresence>
        {isWinnersModalOpen && (
          <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-xl z-[90] flex items-center justify-center p-4 overflow-y-auto">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", duration: 0.6 }}
              className="relative w-full max-w-4xl bg-gradient-to-b from-[#1b0a2a] via-[#10061e] to-[#080212] rounded-2xl border border-amber-500/30 overflow-hidden shadow-[0_0_50px_rgba(245,158,11,0.2)] max-h-[90vh] flex flex-col"
            >
              {/* Top Luxury Banner inside Modal */}
              <div className="relative p-6 sm:p-8 bg-[#10061e] border-b border-amber-500/20 shrink-0 overflow-hidden select-none">
                {/* Background Poster Image */}
                <div className="absolute inset-0 bg-cover bg-center opacity-25 mix-blend-lighten pointer-events-none" style={{ backgroundImage: "url('/src/assets/images/web3_banner_1779983854222.png')" }}></div>
                
                {/* Looping Award Video */}
                <video 
                  autoPlay 
                  loop 
                  muted 
                  playsInline 
                  className="absolute inset-0 w-full h-full object-cover opacity-65 pointer-events-none select-none"
                >
                  <source src="https://cdn.pixabay.com/video/2021/04/12/70831-537380922_large.mp4" type="video/mp4" />
                  <source src="https://cdn.pixabay.com/video/2016/11/14/6306-191599863_large.mp4" type="video/mp4" />
                </video>
                <div className="absolute inset-0 bg-gradient-to-t from-[#10061e] via-transparent to-transparent"></div>
                
                <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="bg-amber-400/10 text-amber-300 border border-amber-400/30 text-[9px] font-bold px-2 py-0.5 rounded tracking-widest uppercase">
                        CHAMPIONS HALL
                      </span>
                      <Sparkles className="w-4.5 h-4.5 text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black italic tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-500 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                      VIA X ANNUAL MEISTER AWARDS
                    </h2>
                    <p className="text-xs text-slate-300 font-semibold mt-1 max-w-xl">
                      Penghargaan kehormatan bagi para Elite Trader dan Web3 Pioneer yang berhasil mengukir rekor transaksi luar biasa di ekosistem bursa VIA X.
                    </p>
                  </div>
                  
                  <button 
                    onClick={() => setIsWinnersModalOpen(false)}
                    className="absolute sm:relative top-2 right-2 sm:top-0 sm:right-0 w-10 h-10 rounded-full bg-slate-900/80 hover:bg-amber-500 hover:text-black border border-slate-800 hover:border-amber-400/40 text-slate-300 flex items-center justify-center transition-all cursor-pointer font-bold duration-300 z-20"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Body Scroll Container */}
              <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#170827] via-[#090312] to-[#04010a]">
                
                {/* 1. Trading Cup ROI Champions Section (Podium view) */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Trophy className="w-6 h-6 text-amber-400" />
                      <h3 className="text-base sm:text-lg font-black text-white italic tracking-tight">TRADING CUP CHAMPIONSHIP</h3>
                    </div>
                    <span className="text-[11px] font-mono font-bold text-amber-400/80 px-2 py-0.5 rounded bg-amber-400/5 border border-amber-400/20">
                      Season 1: ROI Masters
                    </span>
                  </div>

                  {/* Podium Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end pt-2">
                    
                    {/* Rank 2 (Left) */}
                    <motion.div 
                      whileHover={{ y: -5 }}
                      className="bg-slate-950/60 p-5 rounded-xl border border-slate-800/80 relative flex flex-col items-center text-center order-2 md:order-1"
                    >
                      <div className="absolute top-3 left-3 flex items-center justify-center w-6 h-6 rounded-full bg-slate-400/20 text-slate-300 font-black text-xs">
                        2
                      </div>
                      <img 
                        src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=120"
                        alt="Rank 2 Winner" 
                        className="w-16 h-16 rounded-full border-2 border-slate-400 shadow-md object-cover mb-3"
                      />
                      <span className="text-slate-400 text-[10px] uppercase font-bold tracking-widest">Seline "Luna" Chen</span>
                      <h4 className="text-sm font-black text-white mt-0.5">@seline_luna</h4>
                      
                      <div className="mt-3 py-1 px-3 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                        <span className="text-xs font-black text-emerald-400 font-mono">+982.15% ROI</span>
                      </div>
                      
                      <div className="mt-3 text-[10px] text-slate-500 font-medium font-mono">
                        Volume: $1.2M USD • Hadiah: 5,000 USDT
                      </div>
                    </motion.div>

                    {/* Rank 1 (Center - Raised) */}
                    <motion.div 
                      whileHover={{ y: -5 }}
                      className="bg-slate-950/80 p-6 rounded-xl border-2 border-amber-400/60 relative flex flex-col items-center text-center order-1 md:order-2 md:-translate-y-2 shadow-lg shadow-amber-500/5"
                    >
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 px-3 py-0.5 rounded-full font-black text-[10px] tracking-wider uppercase flex items-center gap-1 shadow-md">
                        <Crown className="w-3 h-3 fill-slate-950" /> JUARA 1
                      </div>
                      
                      <img 
                        src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120" 
                        alt="Winner 1" 
                        className="w-20 h-20 rounded-full border-4 border-amber-400 shadow-xl object-cover mb-3"
                      />
                      <span className="text-amber-400 text-[10px] uppercase font-extrabold tracking-widest">Aditya "Axe" Wijaya</span>
                      <h4 className="text-base font-black text-white mt-0.5">@aditya_axe</h4>
                      
                      <div className="mt-3 py-1.5 px-4 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 rounded-full border border-amber-400/30">
                        <span className="text-sm font-black text-amber-300 font-mono flex items-center gap-1.5 justify-center">
                          <Sparkles className="w-4.5 h-4.5 text-amber-400" />
                          +1,245.42% ROI
                        </span>
                      </div>
                      
                      <div className="mt-3 text-[10px] text-slate-300 font-semibold bg-amber-500/10 border border-amber-500/20 rounded py-1 px-2.5 font-mono">
                        Vol: $840K USD <span className="text-amber-300">•</span> Hadiah: 10,000 USDT + Gold Trophy Badge
                      </div>
                    </motion.div>

                    {/* Rank 3 (Right) */}
                    <motion.div 
                      whileHover={{ y: -5 }}
                      className="bg-slate-950/60 p-5 rounded-xl border border-slate-800/80 relative flex flex-col items-center text-center order-3"
                    >
                      <div className="absolute top-3 right-3 flex items-center justify-center w-6 h-6 rounded-full bg-amber-700/20 text-amber-600 font-black text-xs">
                        3
                      </div>
                      <img 
                        src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120" 
                        alt="Rank 3 Winner" 
                        className="w-16 h-16 rounded-full border-2 border-amber-700 shadow-md object-cover mb-3"
                      />
                      <span className="text-slate-400 text-[10px] uppercase font-bold tracking-widest">Farhan Al-Farizi</span>
                      <h4 className="text-sm font-black text-white mt-0.5">@farhan_alfa</h4>
                      
                      <div className="mt-3 py-1 px-3 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                        <span className="text-xs font-black text-emerald-400 font-mono">+745.30% ROI</span>
                      </div>
                      
                      <div className="mt-3 text-[10px] text-slate-500 font-medium font-mono">
                        Volume: $620K USD • Hadiah: 2,500 USDT
                      </div>
                    </motion.div>
                  </div>

                  {/* Honorable mentions table scroll */}
                  <div className="mt-4 bg-[#0a0515]/80 rounded-xl border border-slate-800/80 overflow-hidden divide-y divide-slate-900">
                    <div className="p-3 bg-[#0d071c] text-[10px] font-bold text-slate-400 uppercase tracking-widest grid grid-cols-4 md:grid-cols-5 text-center leading-none">
                      <span className="text-left font-sans text-slate-400">Peringkat & User</span>
                      <span>Target ROI %</span>
                      <span className="hidden md:block">Volume Perdagangan</span>
                      <span>Hadiah Hiburan</span>
                      <span className="text-right">Aksi</span>
                    </div>

                    {[
                      { rank: 4, name: 'Giselle Amanda', user: 'giselle_a', roi: '+550.80%', volume: '$410,000', prize: '500 USD Bonus', img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb' },
                      { rank: 5, name: 'Rian Hidayat', user: 'rian_h', roi: '+412.11%', volume: '$980,000', prize: '300 USD Bonus', img: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7' },
                      { rank: 6, name: 'Jessica Laurens', user: 'jess_laurens', roi: '+389.04%', volume: '$350,000', prize: '100 USD Bonus', img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330' },
                    ].map((row, idx) => (
                      <div key={idx} className="p-3 text-xs font-semibold text-slate-300 grid grid-cols-4 md:grid-cols-5 items-center text-center hover:bg-slate-900/40 transition-colors">
                        <div className="flex items-center gap-2.5 text-left">
                          <span className="font-mono font-bold text-[11px] text-slate-500 w-4">#{row.rank}</span>
                          <img src={`${row.img}?auto=format&fit=crop&q=80&w=60`} alt={row.name} className="w-6 h-6 rounded-full object-cover border border-slate-700" />
                          <div className="flex flex-col min-w-0">
                            <span className="text-white truncate text-[11px] font-bold leading-tight">{row.name}</span>
                            <span className="text-slate-500 text-[10px] truncate leading-tight">@{row.user}</span>
                          </div>
                        </div>
                        <span className="font-mono font-bold text-emerald-400 text-[11px]">{row.roi}</span>
                        <span className="hidden md:block font-mono text-slate-400 font-medium text-[11px]">{row.volume}</span>
                        <span className="font-mono text-amber-300 text-[11px]">{row.prize}</span>
                        <div className="text-right">
                          <button 
                            onClick={() => {
                              alert(`Detail portofolio perdagangan investor @${row.user} dikunci demi privasi mutasi aset.`);
                            }}
                            className="bg-slate-900 border border-slate-800 text-slate-400 text-[9px] hover:text-white uppercase font-bold tracking-wider rounded py-1 px-2 hover:bg-slate-800 transition-colors cursor-pointer"
                          >
                            Stats
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Custom Launchpad MVP & Creator Honors Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-2">
                  <div className="bg-[#0b0413] p-5 rounded-xl border border-purple-500/15 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Award className="w-5 h-5 text-amber-400" />
                        <h4 className="text-sm font-black text-amber-200 uppercase tracking-wider">CREATOR OF THE SEASON</h4>
                      </div>
                      
                      <div className="flex gap-4 items-center">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center p-0.5 shadow-lg select-none">
                          <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center text-amber-400 text-xl font-black">
                            D
                          </div>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest leading-none block">LAUNCHPAD PROJECT OF THE MONTH</span>
                          <h5 className="text-white font-black text-lg leading-tight mt-0.5">DogeSpace (DGES)</h5>
                          <span className="text-slate-500 text-xs font-semibold">Oleh Creator: @doge_colonist</span>
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-300 font-medium mt-3.5 leading-relaxed">
                        Proyek Launchpad dengan pengumpulan masa IPO tersingkat dalam waktu kurang dari **2 jam** di bursa VIA X, menghimpun total modal **8,421 SOL/TON** dari 1,842 trader. Token listed melesat **4.2x lipat** pada hari pertama!
                      </p>
                    </div>

                    <div className="mt-5 border-t border-slate-900 pt-3 flex justify-between items-center text-xs">
                      <div>
                        <span className="text-slate-500 text-[10px] block font-bold uppercase tracking-wider">Total Raised</span>
                        <span className="text-amber-400 font-mono font-bold">100% Filled (8,421)</span>
                      </div>
                      <button 
                        onClick={() => {
                          setActiveTab('Crypto IPO');
                          setIsWinnersModalOpen(false);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[10px] uppercase tracking-wider rounded-md py-1.5 px-3 transition-colors cursor-pointer"
                      >
                        Buka IPO Center
                      </button>
                    </div>
                  </div>

                  {/* Gamer-Style Claim Reward Section */}
                  <div className="bg-[#04010a] p-5 rounded-xl border border-amber-500/15 flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-[40px] pointer-events-none"></div>
                    
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Medal className="w-5 h-5 text-amber-400" />
                        <h4 className="text-sm font-black text-white uppercase tracking-wider">Lencana Kehormatan Anda</h4>
                      </div>

                      <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">
                        User aktif ekosistem bursa VIA X yang lolos sistem kepatuhan web3 berhak mendaftarkan profil demi mengklaim lencana digital kehormatan **"Elite Trader Champion"**!
                      </p>

                      <div className="mt-4 flex items-center gap-3.5 bg-slate-950/60 p-3 rounded-lg border border-slate-850">
                        {claimedBadge ? (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-yellow-400 flex items-center justify-center shadow-lg text-slate-950 animate-bounce">
                            <Trophy className="w-5 h-5" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center border border-slate-800 text-slate-500">
                            <Medal className="w-5 h-5" />
                          </div>
                        )}
                        <div>
                          <h6 className="text-xs font-black text-white leading-tight">Elite Champion Digital Emblem</h6>
                          <p className="text-[10px] text-slate-400 font-medium">
                            {claimedBadge ? 'Lencana Berhasil Terklaim & Disematkan!' : 'Status: Tersedia untuk Diklaim'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5">
                      {claimedBadge ? (
                        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] px-3 py-2 rounded text-center font-bold animate-pulse">
                          🎉 Selamat! Lencana Kehormatan Anda telah diaktifkan secara transparan di VIA X blockchain database.
                        </div>
                      ) : (
                        <button 
                          onClick={() => setClaimedBadge(true)}
                          className="w-full bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-[11px] uppercase tracking-wider rounded py-2 transition-all cursor-pointer shadow-lg active:scale-98"
                        >
                          Klaim Lencana Sekarang
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* 3. Upcoming Event Calendar List */}
                <div className="bg-[#0b0514]/40 p-5 rounded-xl border border-slate-900">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5 leading-none">
                    <Calendar className="w-4 h-4 text-purple-400" /> EVENT TURNAMEN & JADWAL MENDATANG
                  </h4>
                  
                  <div className="space-y-3">
                    {[
                      { title: 'VIA X Summer Trading Cup 2026', desc: 'Registrasi terbuka dengan total hadiah pooled prize 100,000 USDT.', date: '15 June 2026', badge: 'Registrasi Segera' },
                      { title: 'Special Developer Academy Discussion', desc: 'Sesi kupas tuntas mitigasi sybil attack dalam sistem Automated Market Maker.', date: '26 May 2026', badge: 'Live Masterclass' }
                    ].map((evt, id) => (
                      <div key={id} className="p-3 bg-slate-950/40 rounded border border-slate-900 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                        <div>
                          <h5 className="text-xs font-black text-white leading-tight">{evt.title}</h5>
                          <p className="text-[10px] text-slate-400 font-semibold mt-0.5 leading-normal">{evt.desc}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[9px] font-mono font-bold text-purple-400 tracking-wider bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">{evt.date}</span>
                          <span className="text-[9px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">{evt.badge}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
              
              {/* Modal footer */}
              <div className="p-4 bg-slate-950 border-t border-amber-500/10 flex justify-between items-center text-[10px] font-mono text-slate-500 shrink-0">
                <span>VERIFIED_MEISTER_BLOCK_SECURE</span>
                <span>© VIA X CHAMPION HALL 2026</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
