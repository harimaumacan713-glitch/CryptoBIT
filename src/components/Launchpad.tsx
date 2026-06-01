/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useFirebase } from './FirebaseProvider';
import { IPOCoin } from '../types';
import { 
  Rocket, 
  ShieldCheck, 
  Info, 
  Globe, 
  Twitter, 
  ArrowRight, 
  CheckCircle, 
  Loader2, 
  Sparkles, 
  AlertTriangle, 
  FileText, 
  Upload, 
  UserCheck, 
  Wallet, 
  Trash2, 
  ArrowLeft,
  Coins,
  Percent,
  Lock,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { doc, updateDoc } from 'firebase/firestore';

export default function Launchpad({ onComplete }: { onComplete: () => void }) {
  const { createCoin, user, login, clearAllUserCoins, userProfile, updateBalance, db, verifyUser } = useFirebase();
  const [step, setStep] = useState(1); // 1 = details, 2 = listing, 3 = success
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  
  // KYC simulated state
  const [kycForm, setKycForm] = useState({
    fullName: '',
    idNumber: '',
    companyName: '',
    companyReg: '',
    hasUploadedId: false,
    hasUploadedSelfie: false,
  });
  const [kycIsSubmitting, setKycIsSubmitting] = useState(false);
  const [kycStepText, setKycStepText] = useState("Kirim & Setujui Verifikasi KYC");
  const [grantClaimed, setGrantClaimed] = useState(false);
  const [grantLoading, setGrantLoading] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const triggerToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    totalSupply: 10000000,
    circulatingSupply: 6000000,
    lockSupplyCreator: 4000000,
    logo: '',
    description: '',
    website: '',
    twitter: '',
    initialPrice: 0.5,
    listingDate: '',
    minBuy: 10,
    maxBuy: 1000,
    liquidity: 1000000, // minimum $1,000,000 liquidity
  });

  const handleClearAll = async () => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus semua koin buatan pengguna? Semua data koin tersebut akan dihapus secara permanen dari database.")) return;
    setIsClearing(true);
    try {
      await clearAllUserCoins();
      alert("Semua koin buatan pengguna berhasil dihapus dari database!");
      if (onComplete) onComplete();
    } catch (e: any) {
      alert("Gagal menghapus koin: " + e.message);
    } finally {
      setIsClearing(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      // Keep creator locked supply adjusted
      if (name === 'totalSupply' || name === 'circulatingSupply') {
        const supply = Number(name === 'totalSupply' ? value : prev.totalSupply) || 0;
        const circ = Number(name === 'circulatingSupply' ? value : prev.circulatingSupply) || 0;
        updated.lockSupplyCreator = Math.max(0, supply - circ);
      }
      return updated;
    });
  };

  const handleKycSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const cleanedName = kycForm.fullName.trim();
    const cleanedId = kycForm.idNumber.trim();

    if (!cleanedName || !cleanedId) {
      triggerToast('error', "Nama Lengkap dan Nomor ID/Passport wajib diisi.");
      return;
    }

    if (cleanedName.length < 3) {
      triggerToast('error', "🚨 Nama Lengkap terlalu pendek! Harap sertakan nama asli yang valid.");
      return;
    }

    if (/^[0-9]+$/.test(cleanedName) || /^[a-zA-Z]\.?$/.test(cleanedName) || /[^a-zA-Z\s.]/.test(cleanedName)) {
      triggerToast('error', "🚨 Deteksi Fraud: Nama Lengkap tidak valid atau mengandung karakter dilarang!");
      return;
    }

    if (cleanedId.length < 8 || cleanedId.length > 20) {
      triggerToast('error', "🚨 Deteksi Fraud: Nomor ID / Passport harus berukuran 8 hingga 20 karakter.");
      return;
    }

    if (/^(.)\1+$/.test(cleanedId) || cleanedId === "12345678" || cleanedId === "123456789") {
      triggerToast('error', "🚨 Deteksi Fraud: Nomor ID tidak valid atau menggunakan angka palsu/reman.");
      return;
    }

    if (!kycForm.hasUploadedId) {
      triggerToast('error', "🚨 Dokumen Diperlukan: Harap unggah Foto Kartu Identitas.");
      return;
    }

    if (!kycForm.hasUploadedSelfie) {
      triggerToast('error', "🚨 Swafoto Diperlukan: Harap unggah Swafoto Diri pemohon.");
      return;
    }

    setKycIsSubmitting(true);
    try {
      setKycStepText("Membaca data identitas OCR...");
      await new Promise(r => setTimeout(r, 850));

      setKycStepText("Mengenkripsi data dengan Zero-Knowledge Proof...");
      await new Promise(r => setTimeout(r, 850));

      setKycStepText("Menyimpan identitas terenkripsi ke Ledger...");
      await new Promise(r => setTimeout(r, 850));

      await verifyUser(user.uid, true);
      triggerToast('success', "Akun Anda Berhasil Terverifikasi! Saldo Reward verifikasi $100 telah dikreditkan.");
    } catch (err: any) {
      triggerToast('error', "Verifikasi gagal: " + err.message);
    } finally {
      setKycIsSubmitting(false);
      setKycStepText("Kirim & Setujui Verifikasi KYC");
    }
  };

  const handleClaimGrant = async () => {
    if (!user) return;
    setGrantLoading(true);
    try {
      await updateBalance(2000000); // Give 2,000,000 USD virtual capital
      setGrantClaimed(true);
      triggerToast('success', "Aset Pendanaan Pengembang sebesar $2,000,000 Virtual USD berhasil dikreditkan ke wallet Anda!");
    } catch (err: any) {
      triggerToast('error', "Klaim pendanaan gagal: " + err.message);
    } finally {
      setGrantLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (formData.liquidity < 1000000) {
      alert("⚠️ Deposit Likuiditas Minimum adalah $1,000,000 virtual USD!");
      return;
    }
    if (!formData.name || !formData.symbol || !formData.listingDate) {
      alert("Mohon lengkapi semua parameter penting (Name, Symbol, Listing Date)!");
      return;
    }

    setIsSubmitting(true);
    try {
      const coinHardcap = Number(formData.circulatingSupply) * Number(formData.initialPrice) * 0.2; // 20% allocated for pre-order hardcap
      await createCoin({
        name: formData.name,
        symbol: formData.symbol.toUpperCase(),
        totalSupply: Number(formData.totalSupply),
        circulatingSupply: Number(formData.circulatingSupply),
        lockSupplyCreator: Number(formData.lockSupplyCreator),
        logo: formData.logo || `https://api.dicebear.com/7.x/identicon/svg?seed=${formData.symbol}`,
        description: formData.description,
        website: formData.website,
        twitter: formData.twitter,
        initialPrice: Number(formData.initialPrice),
        listingDate: formData.listingDate,
        minBuy: Number(formData.minBuy),
        maxBuy: Number(formData.maxBuy),
        liquidity: Number(formData.liquidity),
        targetFund: coinHardcap,
        status: 'Upcoming'
      });
      setStep(3);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Gagal meluncurkan koin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center p-12 md:p-20 bg-white border border-gray-100 rounded-xl shadow-lg shadow-gray-100/40 mt-6 max-w-xl mx-auto text-center">
        <div className="w-16 h-16 bg-[#00AE64]/10 rounded-full flex items-center justify-center mb-6">
          <Rocket className="w-8 h-8 text-[#00AE64] animate-pulse" />
        </div>
        <h2 className="text-xl md:text-2xl font-extrabold text-gray-900 tracking-tight">Siap Luncurkan Koin Anda Sendiri?</h2>
        <p className="text-gray-500 text-sm mt-3 mb-8 max-w-sm">Dapatkan akses instan untuk meluncurkan token baru dan menjangkau ribuan investor aktif dalam hitungan menit.</p>
        <button 
          onClick={login}
          className="w-full bg-[#00AE64] hover:bg-[#009656] text-white font-bold py-3.5 px-8 rounded-lg shadow-md shadow-[#00AE64]/10 hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          Masuk dengan Google
        </button>
      </div>
    );
  }

  // Render Creator KYC form if they are not verified in Firestore
  if (userProfile && !userProfile.isVerified) {
    return (
      <div className="max-w-3xl mx-auto mt-6 space-y-6">
        <div className="bg-amber-50 border border-amber-200/60 rounded-xl p-5 flex gap-4 text-amber-900">
          <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-extrabold text-xs uppercase tracking-wider">PERSYARATAN KEPATUHAN & ANTISIPASI PENIPUAN</h3>
            <p className="text-xs mt-1.5 leading-relaxed text-amber-800">
              Sesuai dengan standar kepatuhan Anti-Bot, Anti-Spam, serta memitigasi risiko penipuan (scam project), seluruh inisiator proyek diwajibkan menyelesaikan verifikasi identitas (KYC) dan menyediakan jaminan likuiditas awal minimal <strong>$1,000,000 Virtual USD</strong> sebelum mendaftarkan koin baru.
            </p>
          </div>
        </div>

        <div className="bg-white border border-gray-200/80 rounded-xl p-6 md:p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-4 border-b border-gray-100 pb-5">
            <div className="w-12 h-12 bg-[#00AE64]/10 rounded-xl flex items-center justify-center text-[#00AE64]">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight text-gray-950">PORTAL VERIFIKASI CREATOR KYC</h2>
              <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-wider">Identifikasi Pengembang & Keamanan Protokol</p>
            </div>
          </div>

          {/* Quick balance enhancer to pay $1M liquidity */}
          <div className="bg-[#00AE64]/5 border border-[#00AE64]/10 p-5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Saldo Pengembang Saat Ini</span>
              <p className="text-2xl font-black text-gray-950">${(userProfile?.balance || 0).toLocaleString()}</p>
              <p className="text-xs text-slate-500">Gunakan dana hibah di bawah untuk membiayai jaminan likuiditas AMM pool.</p>
            </div>
            <button
              onClick={handleClaimGrant}
              disabled={grantLoading || grantClaimed}
              className="bg-gray-900 hover:bg-gray-800 text-white font-bold text-xs py-3 px-5 rounded-lg transition-all shrink-0 flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              <Wallet className="w-3.5 h-3.5 text-[#00AE64]" />
              {grantLoading ? "Memproses..." : grantClaimed ? "Grant Berhasil Diambil!" : "Klaim Dana Hibah $2M USD"}
            </button>
          </div>

          <form onSubmit={handleKycSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wide">Nama Lengkap (Sesuai Identitas)</label>
                <input 
                  type="text" 
                  value={kycForm.fullName}
                  onChange={(e) => setKycForm(p => ({ ...p, fullName: e.target.value }))}
                  placeholder="Contoh: Satoshi Nakamoto" 
                  className="w-full border border-gray-200 rounded-lg bg-gray-50/50 p-3 text-sm focus:bg-white focus:ring-2 focus:ring-[#00AE64]/15 focus:border-[#00AE64] outline-none font-bold text-gray-900 transition-all" 
                  required 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wide">Nomor Identitas (ID / Passport / KTP)</label>
                <input 
                  type="text" 
                  value={kycForm.idNumber}
                  onChange={(e) => setKycForm(p => ({ ...p, idNumber: e.target.value }))}
                  placeholder="Contoh: A92837264 / 3201XXXXXXXX" 
                  className="w-full border border-gray-200 rounded-lg bg-gray-50/50 p-3 text-sm focus:bg-white focus:ring-2 focus:ring-[#00AE64]/15 focus:border-[#00AE64] outline-none font-mono text-gray-900 transition-all" 
                  required 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wide">Nama DApps / Organisasi (Opsional)</label>
                <input 
                  type="text" 
                  value={kycForm.companyName}
                  onChange={(e) => setKycForm(p => ({ ...p, companyName: e.target.value }))}
                  placeholder="Contoh: MetaChain Labs Ltd." 
                  className="w-full border border-gray-200 rounded-lg bg-gray-50/50 p-3 text-sm focus:bg-white focus:ring-2 focus:ring-[#00AE64]/15 focus:border-[#00AE64] outline-none text-gray-900 transition-all font-semibold" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wide">Nomor Registrasi Entitas (Opsional)</label>
                <input 
                  type="text" 
                  value={kycForm.companyReg}
                  onChange={(e) => setKycForm(p => ({ ...p, companyReg: e.target.value }))}
                  placeholder="Contoh: SEC-2026-928" 
                  className="w-full border border-gray-200 rounded-lg bg-gray-50/50 p-3 text-sm focus:bg-white focus:ring-2 focus:ring-[#00AE64]/15 focus:border-[#00AE64] outline-none font-mono text-gray-900 transition-all" 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wide block">Foto Kartu Identitas (KTP / Passport)</span>
                <div 
                  onClick={() => setKycForm(p => ({ ...p, hasUploadedId: true }))}
                  className={`border-2 border-dashed rounded-lg p-5 text-center cursor-pointer transition-all ${
                    kycForm.hasUploadedId 
                      ? 'bg-emerald-50/40 border-emerald-400 text-emerald-800' 
                      : 'bg-gray-50/50 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                  }`}
                >
                  <Upload className={`w-5 h-5 mx-auto mb-2 ${kycForm.hasUploadedId ? 'text-emerald-500' : 'text-gray-400'}`} />
                  <p className="text-xs font-bold">{kycForm.hasUploadedId ? "✅ File_Identitas.jpg Terlampir" : "Upload File Identitas Anda"}</p>
                  <p className="text-[10px] text-gray-400 mt-1">Mendukung format JPG, PNG maks. 5MB</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wide block">Foto Selfie Pendukung</span>
                <div 
                  onClick={() => setKycForm(p => ({ ...p, hasUploadedSelfie: true }))}
                  className={`border-2 border-dashed rounded-lg p-5 text-center cursor-pointer transition-all ${
                    kycForm.hasUploadedSelfie 
                      ? 'bg-emerald-50/40 border-emerald-400 text-emerald-800' 
                      : 'bg-gray-50/50 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                  }`}
                >
                  <Upload className={`w-5 h-5 mx-auto mb-2 ${kycForm.hasUploadedSelfie ? 'text-emerald-500' : 'text-gray-400'}`} />
                  <p className="text-xs font-bold">{kycForm.hasUploadedSelfie ? "✅ Selfie_Verifikasi.png Terlampir" : "Upload Selfie memegang KTP/Passport"}</p>
                  <p className="text-[10px] text-gray-400 mt-1">Pastikan wajah & data ID terbaca dengan jelas</p>
                </div>
              </div>
            </div>

            <button
              id="btn-submit-kyc"
              type="submit"
              disabled={kycIsSubmitting}
              className="w-full bg-[#00AE64] hover:bg-[#009656] text-white font-extrabold uppercase py-4 rounded-lg shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-xs tracking-wider"
            >
              {kycIsSubmitting ? (
                 <>
                   <Loader2 className="w-4 h-4 animate-spin text-white animate-normal" /> {kycStepText}
                 </>
              ) : "Kirim & Setujui Verifikasi KYC"}
            </button>
          </form>

          {/* Floating Toast Notification overlay for KYC */}
          <AnimatePresence>
            {toast && (
              <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                className={`fixed bottom-6 left-1/2 -translate-x-1/2 min-w-[280px] max-w-[90%] px-4 py-3 rounded-xl shadow-xl border text-xs font-semibold z-[9999] flex items-center gap-2.5 ${
                  toast.type === 'success' 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}
              >
                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${toast.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                <span className="flex-1 leading-normal">{toast.message}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto mt-6">
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-5">
         <div>
            <div className="flex items-center gap-2">
              <span className="bg-[#00AE64]/10 text-[#00AE64] text-[10px] tracking-widest font-black uppercase px-2 py-0.5 rounded">WEB3 PROTOCOL</span>
              <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded font-bold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> KYC Verified
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-gray-950 mt-1">CRYPTOBIT LAUNCHPAD</h1>
            <p className="text-gray-500 text-xs md:text-sm mt-0.5">Terbitkan koin kustom Anda sendiri pada AMM Pool secara profesional tanpa kode pemrograman.</p>
         </div>
         <button
           disabled={isClearing}
           onClick={handleClearAll}
           className="shrink-0 bg-red-50 hover:bg-red-100/80 text-red-600 border border-red-200 font-bold text-xs px-3.5 py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
         >
           {isClearing ? (
             <>
               <Loader2 className="w-3.5 h-3.5 animate-spin text-red-500" />
               Menghapus...
             </>
           ) : (
             <>
               <Trash2 className="w-3.5 h-3.5" />
               Hapus Semua Koin Kustom
             </>
           )}
         </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden mb-12">
        {/* Progress Bar */}
        <div className="flex border-b border-gray-100 bg-gray-50/50">
          {[1, 2, 3].map((s) => (
             <div key={s} className={`flex-1 py-4 px-3 text-center border-r last:border-0 border-gray-100 transition-colors ${step >= s ? 'bg-[#00AE64]/5 relative' : 'bg-gray-50/20 grayscale'}`}>
                {step === s && <motion.div layoutId="step-highlight" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00AE64]" />}
                <span className={`text-[10px] md:text-xs font-black uppercase tracking-widest flex items-center justify-center gap-1.5 ${step >= s ? 'text-[#00AE64]' : 'text-gray-400'}`}>
                  <span className={`w-4 h-4 rounded-full text-[9px] font-black flex items-center justify-center ${step >= s ? 'bg-[#00AE64] text-white' : 'bg-gray-200 text-gray-500'}`}>{s}</span>
                  <span className="hidden sm:inline">{s === 1 ? 'Detail Token' : s === 2 ? 'Pengaturan Listing' : 'Luncurkan'}</span>
                  <span className="sm:hidden">{s === 1 ? 'Detail' : s === 2 ? 'Listing' : 'Selesai'}</span>
                </span>
             </div>
          ))}
        </div>

        <div className="p-6 md:p-8">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div 
                  key="step1"
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -15 }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                     <div className="space-y-1.5">
                       <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Nama Token (Token Name)</label>
                       <input name="name" value={formData.name} onChange={handleChange} placeholder="Contoh: MetaChain Gold" className="w-full border border-gray-200 rounded-lg bg-gray-50/50 p-3 text-sm focus:bg-white focus:ring-2 focus:ring-[#00AE64]/15 focus:border-[#00AE64] outline-none text-gray-900 transition-all font-semibold" required />
                     </div>
                     <div className="space-y-1.5">
                       <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Simbol Koin (Ticker Symbol)</label>
                       <input name="symbol" value={formData.symbol} onChange={handleChange} placeholder="Contoh: MCG" className="w-full border border-gray-200 rounded-lg bg-gray-50/50 p-3 text-sm focus:bg-white focus:ring-2 focus:ring-[#00AE64]/15 focus:border-[#00AE64] outline-none text-gray-900 transition-all font-black uppercase tracking-wider" required />
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                     <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-600 uppercase tracking-wide flex items-center justify-between">
                          Total Pasokan
                          <Coins className="w-3.5 h-3.5 text-gray-400" />
                        </label>
                        <input type="number" name="totalSupply" value={formData.totalSupply} onChange={handleChange} className="w-full border border-gray-200 rounded-lg bg-gray-50/50 p-3 text-sm focus:bg-white focus:ring-2 focus:ring-[#00AE64]/15 focus:border-[#00AE64] outline-none font-bold font-mono text-gray-900 transition-all" required />
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-xs font-bold text-[#00AE64] uppercase tracking-wide flex items-center justify-between">
                          Sirkulasi Publik (60%)
                          <Percent className="w-3.5 h-3.5 text-[#00AE64]" />
                        </label>
                        <input type="number" name="circulatingSupply" value={formData.circulatingSupply} onChange={handleChange} className="w-full border border-emerald-100 rounded-lg bg-emerald-50/30 p-3 text-sm focus:bg-white focus:ring-2 focus:ring-[#00AE64]/15 focus:border-[#00AE64] outline-none font-bold font-mono text-emerald-800 transition-all" required />
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-xs font-bold text-indigo-600 uppercase tracking-wide flex items-center justify-between">
                          Founder Lock (40%)
                          <Lock className="w-3.5 h-3.5 text-indigo-400" />
                        </label>
                        <input type="number" name="lockSupplyCreator" value={formData.lockSupplyCreator} disabled className="w-full border border-indigo-100 rounded-lg bg-indigo-50/20 p-3 text-sm text-indigo-700 font-bold font-mono cursor-not-allowed" />
                     </div>
                  </div>

                  <div className="space-y-1.5">
                     <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">URL Logo Koin (Kosongkan untuk otomatis)</label>
                     <input name="logo" value={formData.logo} onChange={handleChange} placeholder="https://domain.com/logo.png" className="w-full border border-gray-200 rounded-lg bg-gray-50/50 p-3 text-sm focus:bg-white focus:ring-2 focus:ring-[#00AE64]/15 focus:border-[#00AE64] outline-none text-gray-900 transition-all" />
                  </div>

                  <div className="space-y-1.5">
                     <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Deskripsi Proyek (Project Vision)</label>
                     <textarea name="description" value={formData.description} onChange={handleChange} rows={3} placeholder="Jelaskan mengenai visi, kegunaan utilitas, dan roadmap pengembangan koin kustom Anda secara ringkas..." className="w-full border border-gray-200 rounded-lg bg-gray-50/50 p-3 text-sm focus:bg-white focus:ring-2 focus:ring-[#00AE64]/15 focus:border-[#00AE64] outline-none text-gray-900 transition-all resize-none font-medium leading-relaxed" required />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                     <div className="relative">
                       <Globe className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />
                       <input name="website" value={formData.website} onChange={handleChange} placeholder="Situs Web Resmi (Website URL)" className="w-full border border-gray-200 rounded-lg bg-gray-50/50 p-3 pl-10 text-sm focus:bg-white focus:ring-2 focus:ring-[#00AE64]/15 focus:border-[#00AE64] outline-none text-gray-900 font-medium transition-all" required />
                     </div>
                     <div className="relative">
                       <Twitter className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />
                       <input name="twitter" value={formData.twitter} onChange={handleChange} placeholder="Akun Twitter / X Link" className="w-full border border-gray-200 rounded-lg bg-gray-50/50 p-3 pl-10 text-sm focus:bg-white focus:ring-2 focus:ring-[#00AE64]/15 focus:border-[#00AE64] outline-none text-gray-900 font-medium transition-all" />
                     </div>
                  </div>

                  <div className="pt-3">
                    <button 
                     onClick={() => {
                       if (!formData.name || !formData.symbol) {
                         alert("Mohon lengkapi Token Name dan Symbol koin terlebih dahulu.");
                         return;
                       }
                       setStep(2);
                     }}
                     className="w-full bg-[#00AE64] hover:bg-[#009656] text-white font-extrabold py-4 px-6 rounded-lg shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer text-xs uppercase tracking-wider"
                    >
                      Lanjut ke Pengaturan Listing <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div 
                  key="step2"
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -15 }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                     <div className="space-y-1.5">
                       <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Harga Perdana IPO (Harga Awal dalam USD)</label>
                       <input type="number" step="0.001" name="initialPrice" value={formData.initialPrice} onChange={handleChange} className="w-full border border-gray-200 rounded-lg bg-gray-50/50 p-3 text-sm font-bold font-mono text-gray-900 focus:bg-white focus:ring-2 focus:ring-[#00AE64]/15 focus:border-[#00AE64] outline-none transition-all" required />
                     </div>
                     <div className="space-y-1.5">
                       <label className="text-xs font-bold text-gray-600 uppercase tracking-wide flex items-center justify-between">
                         Tanggal Selesai Penawaran / Listing IPO
                         <Calendar className="w-3.5 h-3.5 text-gray-400" />
                       </label>
                       <input type="datetime-local" name="listingDate" value={formData.listingDate} onChange={handleChange} className="w-full border border-gray-200 rounded-lg bg-gray-50/50 p-3 text-sm font-bold font-mono text-gray-900 focus:bg-white focus:ring-2 focus:ring-[#00AE64]/15 focus:border-[#00AE64] outline-none transition-all" required />
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                     <div className="space-y-1.5">
                       <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Batas Minimum Pembelian User (Token MCG)</label>
                       <input type="number" name="minBuy" value={formData.minBuy} onChange={handleChange} className="w-full border border-gray-200 rounded-lg bg-gray-50/50 p-3 text-sm font-bold font-mono text-gray-900 focus:bg-white focus:ring-2 focus:ring-[#00AE64]/15 focus:border-[#00AE64] outline-none transition-all" />
                     </div>
                     <div className="space-y-1.5">
                       <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Batas Maksimum Pembelian User (Token MCG)</label>
                       <input type="number" name="maxBuy" value={formData.maxBuy} onChange={handleChange} className="w-full border border-gray-200 rounded-lg bg-[#f9fafb] p-3 text-sm font-bold font-mono text-gray-950 focus:bg-white focus:ring-2 focus:ring-[#00AE64]/15 focus:border-[#00AE64] outline-none transition-all" />
                     </div>
                  </div>

                  <div className="space-y-2 bg-neutral-950 text-white rounded-xl p-5 md:p-6 border border-neutral-800">
                     <label className="text-xs font-bold text-[#00AE64] uppercase flex items-center gap-1.5 mb-1 tracking-wider">
                        <Wallet className="w-4 h-4 text-emerald-500" /> JAMINAN LIKUIDITAS POOL DISPERSAL (AMM POOL)
                     </label>
                     <p className="text-[11px] text-neutral-400 mb-4 leading-relaxed">
                       Sistem secara wajib mempersiapkan Pool Likuiditas USD yang dipasangkan ke koin Anda pada pasar bursa AMM untuk menjamin likuiditas instan beli/jual dan memitigasi fluktuasi liar sesaat setelah terdaftar.
                     </p>
                     
                     <div className="relative">
                        <input 
                           type="number" 
                           name="liquidity" 
                           min={1000000}
                           value={formData.liquidity} 
                           onChange={handleChange} 
                           className="w-full bg-neutral-900 border border-neutral-700/80 rounded-lg p-3.5 pl-4 pr-16 text-xl font-bold font-mono text-white focus:outline-none focus:border-[#00AE64] transition-colors" 
                           required
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400 uppercase">USD</span>
                     </div>
                     <div className="flex flex-col sm:flex-row justify-between text-[11px] text-gray-400 mt-3 font-semibold gap-1">
                        <span>Batas Minimum yang Diwajibkan: $1,000,000 USD</span>
                        <span className="text-[#00AE64] font-bold">Token Likuiditas Pasar: {(formData.liquidity / (formData.initialPrice || 0.1)).toLocaleString(undefined, { maximumFractionDigits: 0 })} Token AMM</span>
                     </div>
                  </div>

                  <div className="bg-sky-50 border border-sky-100/60 p-4 rounded-xl flex gap-3 text-sky-900">
                     <ShieldCheck className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
                     <div>
                       <p className="text-xs font-bold uppercase tracking-wider text-sky-950">VERIFIKASI PROSES LISTING OTOMATIS</p>
                       <p className="text-[11px] mt-1 leading-relaxed text-sky-800">
                         Koin kustom yang Anda rilis akan tercatat otomatis di bursa IPO CENTER dalam status UPCOMING/LIVE. Perdagangan pasar bebas akan otomatis dibuka jika waktu penawaran habis atau target pengumpulan dana (hardcap) terpenuhi.
                       </p>
                     </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                     <button 
                       onClick={() => setStep(1)}
                       className="flex-1 border border-gray-200 text-gray-500 font-bold py-3.5 px-6 rounded-lg hover:bg-gray-50 transition-all cursor-pointer text-xs uppercase tracking-wide flex items-center justify-center gap-1 bg-white"
                     >
                       <ArrowLeft className="w-3.5 h-3.5" /> Kembali
                     </button>
                     <button 
                       onClick={handleSubmit}
                       disabled={isSubmitting}
                       className="flex-[2] bg-[#00AE64] text-white font-extrabold py-3.5 px-6 rounded-lg hover:bg-[#009656] shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-xs uppercase tracking-wider cursor-pointer"
                     >
                       {isSubmitting ? (
                         <>
                           <Loader2 className="w-4 h-4 animate-spin text-white" /> Menjalankan Kontrak AMM...
                         </>
                       ) : (
                         'Luncurkan Token Sekarang'
                       )}
                     </button>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div 
                  key="step3"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-10 text-center"
                >
                  <div className="w-16 h-16 bg-[#00AE64]/10 rounded-full flex items-center justify-center mb-5">
                     <CheckCircle className="w-10 h-10 text-[#00AE64]" />
                  </div>
                  <h2 className="text-2xl font-black text-gray-950 tracking-tight">Koin Berhasil Diluncurkan!</h2>
                  <p className="text-sm text-gray-500 mt-2 max-w-md leading-relaxed">
                    Selamat! Koin kustom pengembang <strong>{formData.name} ({formData.symbol.toUpperCase()})</strong> telah diinisialisasi jaminan likuiditasnya dan sekarang resmi didaftarkan di portal IPO Center!
                  </p>
                  <button 
                   onClick={onComplete}
                   className="mt-8 bg-gray-900 hover:bg-gray-800 text-white font-extrabold py-3 px-8 rounded-lg shadow-sm hover:shadow transition-all text-xs uppercase tracking-wider cursor-pointer flex items-center gap-1.5"
                  >
                    Buka Dashboard IPO CENTER <ArrowRight className="w-4 h-4" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`fixed bottom-6 left-1/2 -translate-x-1/2 min-w-[280px] max-w-[90%] px-4 py-3 rounded-xl shadow-xl border text-xs font-semibold z-[9999] flex items-center gap-2.5 ${
              toast.type === 'success' 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${toast.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
            <span className="flex-1 leading-normal">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
