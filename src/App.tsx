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
import { Clock, History, Flame, Diamond, Truck, Calendar, Headphones, MoreHorizontal, LayoutPanelLeft } from 'lucide-react';
import { useFirebase } from './components/FirebaseProvider';

export default function App() {
  const [activeTab, setActiveTab] = useState('Stream');
  const [hasCompletedSplash, setHasCompletedSplash] = useState(false);
  const { user, loading } = useFirebase();

  if (loading) {
     return <div className="min-h-screen bg-[#0A0E17]" />;
  }

  if (!hasCompletedSplash || !user) {
    return <SplashLoginScreen onLoginSuccess={() => setHasCompletedSplash(true)} />;
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-gray-900 font-sans selection:bg-[#00AE64]/30">
      <Header setActiveTab={setActiveTab} />
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="max-w-[1400px] mx-auto px-4 pb-12 flex gap-6">
        {/* Main Content Area */}
        <div className="flex-1 min-w-0">
          <TrendingStocks />
          
          {activeTab === 'Stream' ? (
            <>
              <div className="bg-gradient-to-r from-emerald-950 via-[#0A1810] to-[#0D1E15] rounded-sm p-6 mb-4 text-white relative overflow-hidden group border border-[#00AE64]/20 shadow-xl shadow-emerald-950/20">
                {/* Background Image overlay */}
                <img 
                  src="/src/assets/images/web3_banner_1779983854222.png" 
                  alt="Upcoming Web3 projects background" 
                  className="absolute inset-0 w-full h-full object-cover opacity-35 mix-blend-screen pointer-events-none select-none transition-transform duration-1000 group-hover:scale-105"
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
                  className="relative z-10 mt-4 bg-[#00AE64] hover:bg-[#009656] text-white font-bold text-xs px-5 py-2.5 rounded-sm transition-all shadow-lg shadow-emerald-950/40 hover:-translate-y-0.5 active:translate-y-0 duration-200 cursor-pointer"
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
          ) : (
            <div className="flex flex-col items-center justify-center p-20 bg-white border border-gray-200 rounded-sm shadow-sm mt-4">
               <h2 className="text-xl font-bold text-gray-400 uppercase tracking-widest">{activeTab} Section</h2>
               <p className="text-gray-400 text-sm mt-2">This feature is coming soon to CryptoBit.</p>
            </div>
          )}
        </div>

        {/* Right Utility Rail (Floating on desktop) */}
        <aside className="hidden xl:flex flex-col gap-5 py-4 border-l border-gray-200 pl-6 h-screen sticky top-16">
          <div className="flex flex-col gap-6 items-center">
             <div className="p-2 border border-gray-200 rounded-md bg-white shadow-sm cursor-pointer hover:bg-gray-50 transition-colors">
               <LayoutPanelLeft className="w-6 h-6 text-gray-700" />
               <p className="text-[10px] font-bold text-center mt-1 leading-tight">Virtual Area</p>
             </div>
             
             <div className="flex flex-col gap-6 text-gray-400">
               <Clock className="w-5 h-5 cursor-pointer hover:text-gray-900 transition-colors" />
               <History className="w-5 h-5 cursor-pointer hover:text-gray-900 transition-colors" />
               <Flame className="w-5 h-5 cursor-pointer hover:text-gray-900 transition-colors" />
               <Diamond className="w-5 h-5 cursor-pointer hover:text-gray-900 transition-colors" />
               <Truck className="w-5 h-5 cursor-pointer hover:text-gray-900 transition-colors" />
               <Calendar className="w-5 h-5 cursor-pointer hover:text-gray-900 transition-colors" />
               <Headphones className="w-5 h-5 cursor-pointer hover:text-gray-900 transition-colors" />
               <MoreHorizontal className="w-5 h-5 cursor-pointer hover:text-gray-900 transition-colors" />
             </div>
          </div>
        </aside>
      </main>

      {/* Footer Mobile Nav (Floating on mobile) */}
      <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur-lg border border-gray-200 px-6 py-3 rounded-full shadow-2xl flex gap-8 z-50">
        <Clock className="w-5 h-5 text-gray-500" />
        <Calendar className="w-5 h-5 text-gray-500" />
        <MoreHorizontal className="w-5 h-5 text-gray-500" />
      </div>
    </div>
  );
}
