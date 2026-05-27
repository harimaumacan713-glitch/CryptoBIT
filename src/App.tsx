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
              <div className="bg-gradient-to-r from-[#00AE64] to-emerald-900 rounded-sm p-6 mb-4 text-white relative overflow-hidden group">
                <div className="relative z-10">
                  <span className="bg-white/20 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest mb-2 inline-block">Featured Launch</span>
                  <h2 className="text-2xl font-black italic tracking-tighter leading-none mb-2">UPCOMING WEB3 PROJECTS</h2>
                  <p className="text-xs text-white/80 max-w-sm">Discover and invest in the next generation of blockchain innovation before they hit the open market.</p>
                </div>
                <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-20 pointer-events-none group-hover:scale-110 transition-transform duration-1000">
                   <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                     <path fill="#FFFFFF" d="M47.7,-63.1C59.9,-54.4,66.5,-37.4,69.5,-20.5C72.5,-3.6,71.9,13.2,65.6,28.6C59.3,44,47.3,58,32.3,65.8C17.3,73.5,-0.7,75,-16.9,69.6C-33.1,64.2,-47.5,51.8,-57.3,37.3C-67.1,22.8,-72.3,6.2,-70.6,-9.7C-68.9,-25.6,-60.2,-40.8,-48.1,-49.6C-36,-58.4,-20.5,-60.8,-2.6,-57.1C15.3,-53.4,35.5,-71.8,47.7,-63.1Z" transform="translate(100 100)" />
                   </svg>
                </div>
                <button 
                  onClick={() => setActiveTab('Crypto IPO')}
                  className="mt-4 bg-white text-[#00AE64] font-bold text-xs px-4 py-2 rounded-sm hover:bg-white/90 transition-colors shadow-lg"
                >
                  Browse Projects
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
