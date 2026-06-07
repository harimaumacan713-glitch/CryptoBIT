/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export default function Sidebar() {
  return (
    <div className="w-full lg:w-[320px] shrink-0 space-y-4">
      {/* Desktop App Ad */}
      <div className="relative rounded-sm overflow-hidden bg-slate-900 aspect-[4/5] cursor-pointer group">
        <img 
          src="https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&q=80&w=600" 
          alt="Desktop App" 
          className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-overlay group-hover:scale-105 transition-all duration-700" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-6 flex flex-col justify-end">
          <p className="text-white text-lg font-bold leading-tight mb-4 uppercase tracking-tight">Download VIA X DESKTOP TERMINAL</p>
          <div className="flex gap-2">
            <button className="bg-white text-black text-[10px] px-3 py-1.5 rounded-sm font-bold hover:bg-gray-200 transition-colors uppercase">Get for Desktop</button>
          </div>
        </div>
      </div>
    </div>
  );
}

