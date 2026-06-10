/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ShieldCheck, Info } from 'lucide-react';

export default function Sidebar() {
  return (
    <div className="w-full lg:w-[320px] shrink-0 space-y-4">
      {/* Container Informasi Keamanan */}
      <div className="bg-slate-900 border border-slate-850 rounded-xl p-5 text-slate-100 shadow-sm">
        <div className="flex items-center gap-2.5 mb-4 text-[#00AE64]">
          <ShieldCheck className="w-5 h-5 shrink-0" />
          <h4 className="font-extrabold text-xs uppercase tracking-wider">Sistem Keamanan Terintegrasi</h4>
        </div>
        
        <p className="text-xs text-slate-300 leading-relaxed font-medium mb-4">
          Seluruh aktivitas perdagangan dan penayangan informasi pasar didukung oleh protokol enkripsi berstandar internasional. Selalu lakukan verifikasi mandiri sebelum bertransaksi.
        </p>
        
        <div className="border-t border-slate-800 pt-4 space-y-3">
          <div className="flex items-start gap-2.5">
            <div className="w-1.5 h-1.5 rounded-full bg-[#00AE64] mt-1.5 shrink-0" />
            <p className="text-[11px] text-slate-400 font-medium font-sans">Transaksi terenkripsi secara penuh nirkabel dan aman.</p>
          </div>
          <div className="flex items-start gap-2.5">
            <div className="w-1.5 h-1.5 rounded-full bg-[#00AE64] mt-1.5 shrink-0" />
            <p className="text-[11px] text-slate-400 font-medium font-sans">Layanan bantuan pelanggan aktif dan siap dihubungi secara langsung.</p>
          </div>
          <div className="flex items-start gap-2.5">
            <div className="w-1.5 h-1.5 rounded-full bg-[#00AE64] mt-1.5 shrink-0" />
            <p className="text-[11px] text-slate-400 font-medium font-sans">Akses eksklusif untuk publikasi insight pasar Web3.</p>
          </div>
        </div>
      </div>

      {/* Panduan Pengguna */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 text-slate-800 shadow-sm">
        <div className="flex items-center gap-2.5 mb-3 text-slate-950">
          <Info className="w-5 h-5 text-[#00AE64] shrink-0" />
          <h4 className="font-extrabold text-xs uppercase tracking-wider">Akses Multi-Device</h4>
        </div>
        
        <p className="text-xs text-slate-500 leading-relaxed font-normal font-sans">
          Aplikasi dioptimalkan secara dinamis untuk perangkat telepon genggam, tablet, maupun layar lebar. Navigasi menyesuaikan rasio layar secara instan demi kenyamanan optimal.
        </p>
      </div>
    </div>
  );
}

