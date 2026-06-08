/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ChevronRight } from 'lucide-react';

export default function PromoBanner() {
  return (
    <div className="bg-white rounded-lg p-4 text-slate-800 flex items-center justify-between cursor-pointer hover:border-[#00AE64]/30 border border-slate-200 transition-all duration-300 group mb-4 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center p-2 border border-slate-100 shrink-0">
          <img src="https://stockbit.com/assets/favicon/apple-icon-180x180.png" alt="Stockbit" className="w-full h-full object-contain" />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase font-bold text-[#00AE64] tracking-widest bg-emerald-50 px-2 py-0.5 rounded">26 May 2026, 20.00 WIB</span>
          </div>
          <h3 className="font-extrabold text-sm tracking-tight text-slate-800 group-hover:text-[#00AE64] transition-colors">VIA X Pro Features: Web3 Technical Session</h3>
          <p className="text-[11px] text-slate-500 mt-0.5">VIA X Academy - Exclusive Developer Masterclass</p>
        </div>
      </div>
      <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-[#00AE64] group-hover:translate-x-1.5 transition-all" />
    </div>
  );
}
