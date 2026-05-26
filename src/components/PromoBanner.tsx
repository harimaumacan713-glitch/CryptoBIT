/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ChevronRight } from 'lucide-react';

export default function PromoBanner() {
  return (
    <div className="bg-[#6366F1] rounded-sm p-5 text-white flex items-center justify-between cursor-pointer hover:bg-[#6366F1]/95 transition-all group mb-4">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center p-2">
          <img src="https://stockbit.com/assets/favicon/apple-icon-180x180.png" alt="Stockbit" className="w-full h-full object-contain" />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[10px] uppercase font-bold text-white/80">26 May 2026, 20.00 WIB</span>
          </div>
          <h3 className="font-bold text-base">CryptoBit Pro Features : Web3 Technical Session</h3>
          <p className="text-xs text-white/80 mt-0.5">CryptoBit Academy</p>
        </div>
      </div>
      <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
    </div>
  );
}
