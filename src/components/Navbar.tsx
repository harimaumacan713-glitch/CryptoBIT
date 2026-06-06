/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LayoutGrid, User, Star, Briefcase, BookOpen, BarChart2, PieChart, Search, PlayCircle, GraduationCap, Film, MoreHorizontal } from 'lucide-react';
import { motion } from 'motion/react';

const navItems = [
  { icon: LayoutGrid, label: 'Stream' },
  { icon: User, label: 'Profile' },
  { icon: Star, label: 'Watchlist' },
  { icon: Briefcase, label: 'Portfolio' },
  { icon: BookOpen, label: 'Orderbook' },
  { icon: BarChart2, label: 'Chartbit' },
  { icon: PieChart, label: 'Crypto IPO' },
  { icon: Search, label: 'Create Coin' },
  { icon: PlayCircle, label: 'Broker Analysis' },
  { icon: GraduationCap, label: 'Academy' },
];

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Navbar({ activeTab, setActiveTab }: NavbarProps) {
  return (
    <nav className="bg-[#0c101b]/80 border-b border-slate-800/60 overflow-x-auto no-scrollbar backdrop-blur-md sticky top-16 z-40">
      <div className="max-w-[1400px] mx-auto px-4 flex items-center">
        {navItems.map((item) => (
          <button
            key={item.label}
            onClick={() => setActiveTab(item.label)}
            className={`flex items-center gap-2 px-3.5 py-3 font-semibold whitespace-nowrap transition-all relative h-12 flex-shrink-0 cursor-pointer ${
              activeTab === item.label 
                ? 'text-[#00AE64]' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <item.icon className={`w-4 h-4 transition-transform ${activeTab === item.label ? 'scale-110 text-[#00AE64]' : ''}`} />
            <span className="text-[12.5px] tracking-tight">{item.label}</span>
            {activeTab === item.label && (
              <motion.div
                layoutId="nav-underline"
                className="absolute bottom-0 left-1 right-1 h-0.5 bg-[#00AE64] rounded-full shadow-[0_0_8px_rgba(0,174,100,0.5)]"
              />
            )}
          </button>
        ))}
        <button className="p-3 text-slate-500 hover:text-white flex-shrink-0 transition-colors">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>
    </nav>
  );
}
