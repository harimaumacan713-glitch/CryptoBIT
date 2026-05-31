/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Search, MessageSquare, Bell, User, ChevronDown } from 'lucide-react';
import { useFirebase } from './FirebaseProvider';
import { useState } from 'react';
import ProfileModal from './ProfileModal';

interface HeaderProps {
  setActiveTab?: (tab: string) => void;
}

export default function Header({ setActiveTab }: HeaderProps) {
  const { user } = useFirebase();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  return (
    <header className="h-16 border-b border-gray-200 bg-white sticky top-0 z-50">
      <ProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} />
      <div className="max-w-[1400px] mx-auto h-full px-4 flex items-center justify-between">
        <div className="flex items-center gap-6 flex-1">
          <div className="flex items-center gap-2 cursor-pointer group">
            <div className="w-8 h-8 bg-[#00AE64] rounded-lg flex items-center justify-center shadow-lg transform group-hover:scale-105 transition-transform">
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-white fill-current">
                <path d="M12,2L4.5,20.29L5.21,21L12,18L18.79,21L19.5,20.29L12,2Z" />
              </svg>
            </div>
            <span className="text-gray-900 font-extrabold text-2xl tracking-tighter italic">Crypto<span className="text-[#00AE64]">Bit</span></span>
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
            <div 
              onClick={() => {
                if (user && setActiveTab) {
                  setActiveTab('Profile');
                }
              }}
              className="flex items-center gap-2 cursor-pointer p-1.5 hover:bg-gray-100 rounded-md ml-2 transition-colors"
            >
              <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center overflow-hidden">
                {user?.photoURL && user.photoURL !== "" ? (
                  <img src={user.photoURL} alt="User" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <User className="w-4 h-4 text-blue-500" />
                )}
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs font-semibold text-gray-700 hidden sm:block">
                  {user?.displayName || 'Profile'}
                </span>
                <ChevronDown className="w-3 h-3 text-gray-500" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
