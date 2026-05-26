/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LayoutGrid, User, Star, Briefcase, BookOpen, BarChart2, PieChart, Search, PlayCircle, GraduationCap, MoreHorizontal } from 'lucide-react';
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
    <nav className="bg-white border-b border-gray-200 overflow-x-auto no-scrollbar">
      <div className="max-w-[1400px] mx-auto px-4 flex items-center">
        {navItems.map((item) => (
          <button
            key={item.label}
            onClick={() => setActiveTab(item.label)}
            className={`flex items-center gap-2 px-3 py-3 font-medium whitespace-nowrap transition-colors relative h-12 flex-shrink-0 ${
              activeTab === item.label 
                ? 'text-[#00AE64] border-b-2 border-[#00AE64]' 
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <item.icon className="w-4 h-4" />
            <span className="text-[13px]">{item.label}</span>
            {activeTab === item.label && (
              <motion.div
                layoutId="nav-underline"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00AE64]"
              />
            )}
          </button>
        ))}
        <button className="p-3 text-gray-400 hover:text-gray-800 flex-shrink-0">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>
    </nav>
  );
}
