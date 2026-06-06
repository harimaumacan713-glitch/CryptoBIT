/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ChevronRight } from 'lucide-react';

export default function PromoBanner() {
  return (
    <div className="bg-gradient-to-r from-indigo-950 via-[#10132C] to-slate-950 rounded-lg p-5 text-white flex items-center justify-between cursor-pointer hover:border-[#00AE64]/30 border border-slate-800 transition-all duration-300 group mb-4 shadow-xl">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center p-2.5 shadow-2xl shrink-0">
          <img src="https://stockbit.com/assets/favicon/apple-icon-180x180.png" alt="Stockbit" className="w-full h-full object-contain" />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase font-bold text-[#00AE64] tracking-widest bg-[#00AE64]/10 px-2 py-0.5 rounded">26 May 2026, 20.00 WIB</span>
          </div>
          <h3 className="font-extrabold text-base tracking-tight text-white group-hover:text-[#00AE64] transition-colors">CryptoBit Pro Features : Web3 Technical Session</h3>
          <p className="text-xs text-slate-400 mt-1">CryptoBit Academy • Exclusive Developer Masterclass</p>
        </div>
      </div>
      <ChevronRight className="w-6 h-6 text-slate-400 group-hover:text-[#00AE64] group-hover:translate-x-1.5 transition-all" />
    </div>
  );
}
