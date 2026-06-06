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
import { Clock, History, Flame, Diamond, Truck, Calendar, Headphones, MoreHorizontal, LayoutPanelLeft } from 'lucide-react';
import { useFirebase } from './components/FirebaseProvider';
import { AnimatePresence } from 'motion/react';

export default function App() {
  const [activeTab, setActiveTab] = useState('Stream');
  const [hasCompletedSplash, setHasCompletedSplash] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [supportMessage, setSupportMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'support'; text: string }>>([
    { sender: 'support', text: 'Halo! Selamat datang di Pusat Bantuan KriptoBit Pro. Ada yang bisa kami bantu seputar bursa AMM, Chartbit, klaim dana beasiswa Academy, atau penawaran IPO hari ini?' }
  ]);
  const { user, loading } = useFirebase();

  if (loading) {
     return <div className="min-h-screen bg-[#0A0E17]" />;
  }

  if (!hasCompletedSplash || !user) {
    return <SplashLoginScreen onLoginSuccess={() => setHasCompletedSplash(true)} />;
  }

  return (
    <div className="min-h-screen bg-[#080B11] text-slate-100 font-sans selection:bg-[#00AE64]/30">
      <Header setActiveTab={setActiveTab} />
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="max-w-[1400px] mx-auto px-4 pb-12 flex gap-6">
        {/* Main Content Area */}
        <div className="flex-1 min-w-0">
          {activeTab === 'Stream' ? (
            <>
              <TrendingStocks />
              
              <div className="bg-gradient-to-r from-[#0d2217] via-[#09150f] to-[#0b101d] rounded-lg p-6 mb-4 text-white relative overflow-hidden group border border-[#00AE64]/20 shadow-xl shadow-black/40">
                {/* Background Image overlay */}
                <img 
                  src="/src/assets/images/web3_banner_1779983854222.png" 
                  alt="Upcoming Web3 projects background" 
                  className="absolute inset-0 w-full h-full object-cover opacity-25 mix-blend-screen pointer-events-none select-none transition-transform duration-1000 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                
                {/* Visual glassmorphism glow effect */}
                <div className="absolute top-0 right-0 w-80 h-80 bg-[#00AE64]/10 rounded-full blur-3xl pointer-events-none select-none -mr-20 -mt-20"></div>

                <div className="relative z-10">
                  <span className="bg-[#00AE64]/20 border border-[#00AE64]/30 backdrop-blur-md px-2.5 py-1 rounded text-[10px] font-extrabold uppercase tracking-widest mb-3 inline-block text-[#00AE64]">Featured Launch</span>
                  <h2 className="text-2xl font-black italic tracking-tighter leading-none mb-2">UPCOMING WEB3 PROJECTS</h2>
                  <p className="text-xs text-gray-300 max-w-sm font-medium leading-relaxed">Discover and invest in the next generation of blockchain innovation before they hit the open market.</p>
                </div>
                
                <button 
                  onClick={() => setActiveTab('Create Coin')}
                  className="relative z-10 mt-4 bg-[#00AE64] hover:bg-[#009656] text-white font-bold text-xs px-5 py-2.5 rounded-md transition-all shadow-lg hover:-translate-y-0.5 active:translate-y-0 duration-200 cursor-pointer"
                >
                  Create Your Token
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
            <div className="flex flex-col items-center justify-center p-20 bg-[#121622] border border-slate-800 rounded-lg shadow-sm mt-4">
               <h2 className="text-xl font-bold text-gray-400 uppercase tracking-widest">{activeTab} Section</h2>
               <p className="text-gray-400 text-sm mt-2">This feature is coming soon to CryptoBit.</p>
            </div>
          )}
        </div>

        {/* Right Utility Rail (Floating on desktop with interactive events) */}
        <aside className="hidden xl:flex flex-col gap-5 py-4 border-l border-slate-800 pl-6 h-screen sticky top-16">
          <div className="flex flex-col gap-6 items-center">
             <div 
               onClick={() => {
                 setActiveTab('Chartbit');
                 window.scrollTo({ top: 0, behavior: 'smooth' });
               }}
               className={`p-2 border rounded-md shadow-sm cursor-pointer transition-colors ${
                 activeTab === 'Chartbit' 
                   ? 'border-[#00AE64] bg-[#00AE64]/10' 
                   : 'border-slate-800 bg-[#121622] hover:bg-[#181d2c]'
               }`}
             >
                <LayoutPanelLeft className={`w-6 h-6 ${activeTab === 'Chartbit' ? 'text-[#00AE64]' : 'text-slate-350'}`} />
                <p className="text-[10px] font-bold text-center mt-1 leading-tight text-slate-400">Virtual Area</p>
             </div>
              
             <div className="flex flex-col gap-6">
                <Clock 
                  onClick={() => {
                    setActiveTab('Orderbook');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`w-5 h-5 cursor-pointer hover:text-[#00AE64] transition-colors ${activeTab === 'Orderbook' ? 'text-[#00AE64] scale-110' : 'text-slate-500'}`} 
                  title="Lihat Orderbook"
                />
                <History 
                  onClick={() => {
                    setActiveTab('Portfolio');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`w-5 h-5 cursor-pointer hover:text-[#00AE64] transition-colors ${activeTab === 'Portfolio' ? 'text-[#00AE64] scale-110' : 'text-slate-500'}`}
                  title="Portfolio Saya"
                />
                <Flame 
                  onClick={() => {
                    setActiveTab('Watchlist');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`w-5 h-5 cursor-pointer hover:text-[#00AE64] transition-colors ${activeTab === 'Watchlist' ? 'text-[#00AE64] scale-110' : 'text-slate-500'}`}
                  title="Watchlist Koin"
                />
                <Diamond 
                  onClick={() => {
                    setActiveTab('Academy');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`w-5 h-5 cursor-pointer hover:text-[#00AE64] transition-colors ${activeTab === 'Academy' ? 'text-[#00AE64] scale-110' : 'text-slate-500'}`}
                  title="Academy Web3"
                />
                <Truck 
                  onClick={() => {
                    setActiveTab('Create Coin');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`w-5 h-5 cursor-pointer hover:text-[#00AE64] transition-colors ${activeTab === 'Create Coin' ? 'text-[#00AE64] scale-110' : 'text-slate-500'}`}
                  title="Launchpad Baru"
                />
                <Calendar 
                  onClick={() => {
                    setActiveTab('Crypto IPO');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`w-5 h-5 cursor-pointer hover:text-[#00AE64] transition-colors ${activeTab === 'Crypto IPO' ? 'text-[#00AE64] scale-110' : 'text-slate-500'}`}
                  title="IPO Hub Calendar"
                />
                <Headphones 
                  onClick={() => setIsSupportOpen(prev => !prev)}
                  className={`w-5 h-5 cursor-pointer hover:text-[#00AE64] transition-colors ${isSupportOpen ? 'text-[#00AE64] scale-110' : 'text-slate-500'}`}
                  title="Customer Support Desk"
                />
                <MoreHorizontal 
                  onClick={() => {
                    setActiveTab('Profile');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`w-5 h-5 cursor-pointer hover:text-[#00AE64] transition-colors ${activeTab === 'Profile' ? 'text-[#00AE64]' : 'text-slate-500'}`}
                  title="Profil Sesi"
                />
             </div>
          </div>
        </aside>
      </main>

      {/* Footer Mobile Nav (Floating on mobile) */}
      <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#121622]/90 backdrop-blur-lg border border-slate-800 px-6 py-3 rounded-full shadow-2xl flex gap-8 z-55 items-center">
        <Clock 
          onClick={() => { setActiveTab('Orderbook'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          className={`w-5 h-5 cursor-pointer ${activeTab === 'Orderbook' ? 'text-[#00AE64]' : 'text-slate-405'}`} 
        />
        <Calendar 
          onClick={() => { setActiveTab('Crypto IPO'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          className={`w-5 h-5 cursor-pointer ${activeTab === 'Crypto IPO' ? 'text-[#00AE64]' : 'text-slate-405'}`} 
        />
        <LayoutPanelLeft
          onClick={() => { setActiveTab('Chartbit'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          className={`w-5 h-5 cursor-pointer ${activeTab === 'Chartbit' ? 'text-[#00AE64]' : 'text-slate-405'}`}
        />
        <MoreHorizontal 
          onClick={() => { setActiveTab('Profile'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          className={`w-5 h-5 cursor-pointer ${activeTab === 'Profile' ? 'text-[#00AE64]' : 'text-slate-405'}`} 
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
                  ✕
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
                    
                    if (cleanText.includes('beasiswa') || cleanText.includes('scholarship') || cleanText.includes('academy') || cleanText.includes('kuis') || cleanText.includes('lulus')) {
                       response = '💡 ACADEMY FAUCET TIPS: Untuk mengklaim bonus beasiswa belajar virtual sebesar $10,000 USD, silakan selesaikan 3 bab kurikulum di Academy tab serta jawab kuis evaluasinya dengan benar!';
                    } else if (cleanText.includes('ipo') || cleanText.includes('hardcap') || cleanText.includes('listed') || cleanText.includes('gagal')) {
                       response = '🚀 IPO HUB PROTOCOLS: Koin dalam status IPO Live akan beralih listed otomatis bila target Hardcap (pembelian 20% total pasokan) telah tercapai. Jika target dana gagal terpenuhi hingga hitung mundur usai, modal investor akan dikembalikan penuh (automated full refund) ke saldo Firebase!';
                    } else if (cleanText.includes('chart') || cleanText.includes('grafik') || cleanText.includes('indikator') || cleanText.includes('rsi') || cleanText.includes('ma')) {
                       response = '📊 CHARTBIT ADVISORY: Terminal bursa Chartbit menyuguhkan diagram garis real-time multi-indikator. Anda bisa memicu overlay Moving Average (MA), Exponential Moving Average (EMA), maupun RSI di panel instrumen.';
                    } else if (cleanText.includes('hancur') || cleanText.includes('dump') || cleanText.includes('manipulasi') || cleanText.includes('crash')) {
                       response = '🛡️ CRASH PROTECTION: Demi menjamin transparansi bursa retail, platform mengunci pencipta koin agar dilarang mendeposit / mendump koin bikinan melebihi 5% total supply sekaligus dalam satu waktu transaksi.';
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
    </div>
  );
}
