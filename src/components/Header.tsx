/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Search, MessageSquare, Bell, User, ChevronDown } from 'lucide-react';

export default function Header() {
  return (
    <header className="h-16 border-b border-gray-200 bg-white sticky top-0 z-50">
      <div className="max-w-[1400px] mx-auto h-full px-4 flex items-center justify-between">
        <div className="flex items-center gap-6 flex-1">
          <div className="flex items-center gap-1 cursor-pointer">
            <span className="text-[#00AE64] font-extrabold text-2xl tracking-tighter italic">CryptoBit</span>
          </div>
          <div className="relative max-w-md w-full hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search for brand, symbol or username..."
              className="w-full bg-gray-100 border-none rounded-md py-2 pl-10 pr-4 text-sm focus:ring-1 focus:ring-[#00AE64] outline-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button className="hidden lg:block border border-[#00AE64] text-[#00AE64] text-xs font-semibold px-4 py-1.5 rounded hover:bg-[#00AE64]/5 transition-colors">
            Berlangganan Pro
          </button>
          
          <div className="flex items-center gap-2 border-l pl-4 h-8">
            <div className="relative cursor-pointer p-2 hover:bg-gray-100 rounded-full">
              <MessageSquare className="w-5 h-5 text-gray-600" />
              <span className="absolute top-1 right-1 bg-[#00AE64] text-white text-[10px] w-5 h-4 flex items-center justify-center rounded-full border-2 border-white">99+</span>
            </div>
            <div className="relative cursor-pointer p-2 hover:bg-gray-100 rounded-full">
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="absolute top-1 right-1 bg-[#00AE64] text-white text-[10px] w-5 h-4 flex items-center justify-center rounded-full border-2 border-white">76</span>
            </div>
            <div className="flex items-center gap-2 cursor-pointer p-1.5 hover:bg-gray-100 rounded-md ml-2 transition-colors">
              <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center overflow-hidden">
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" className="w-full h-full object-cover" />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs font-semibold text-gray-700 hidden sm:block">Virtual Area</span>
                <ChevronDown className="w-3 h-3 text-gray-500" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
