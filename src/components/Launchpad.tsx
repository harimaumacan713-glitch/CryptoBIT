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
import VerificationModal from './VerificationModal';

export default function Launchpad({ onComplete }: { onComplete: () => void }) {
  const { createCoin, user, login, clearAllUserCoins, userProfile, updateBalance, db, verifyUser } = useFirebase();
  const [step, setStep] = useState(1); // 1 = details, 2 = listing, 3 = success
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [launchMode, setLaunchMode] = useState<'IPO' | 'DIRECT'>('IPO');
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  
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
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const triggerToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const getDefaultListingDate = () => {
    const defaultDate = new Date();
    defaultDate.setHours(defaultDate.getHours() + 2); // default to 2 hours from now
    defaultDate.setMinutes(defaultDate.getMinutes() - defaultDate.getTimezoneOffset());
    return defaultDate.toISOString().slice(0, 16);
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
    listingDate: getDefaultListingDate(),
    minBuy: 10,
    maxBuy: 1000,
    liquidity: 1000000, // minimum $1,000,000 liquidity
  });

  const handleClearAll = async () => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus semua koin buatan pengguna? Semua data koin tersebut akan dihapus secara permanen dari database.")) return;
    setIsClearing(true);
    try {
      await clearAllUserCoins();
      triggerToast('success', "Semua koin buatan pengguna berhasil dihapus dari database!");
      if (onComplete) onComplete();
    } catch (e: any) {
      triggerToast('error', "Gagal menghapus koin: " + e.message);
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
      triggerToast('error', "Nama Lengkap terlalu pendek! Harap sertakan nama asli yang valid.");
      return;
    }

    if (/^[0-9]+$/.test(cleanedName) || /^[a-zA-Z]\.?$/.test(cleanedName) || /[^a-zA-Z\s.]/.test(cleanedName)) {
      triggerToast('error', "Deteksi Fraud: Nama Lengkap tidak valid atau mengandung karakter dilarang!");
      return;
    }

    if (cleanedId.length < 8 || cleanedId.length > 20) {
      triggerToast('error', "Deteksi Fraud: Nomor ID / Passport harus berukuran 8 hingga 20 karakter.");
      return;
    }

    if (/^(.)\1+$/.test(cleanedId) || cleanedId === "12345678" || cleanedId === "123456789") {
      triggerToast('error', "Deteksi Fraud: Nomor ID tidak valid atau menggunakan angka palsu/reman.");
      return;
    }

    if (!kycForm.hasUploadedId) {
      triggerToast('error', "Dokumen Diperlukan: Harap unggah Foto Kartu Identitas.");
      return;
    }

    if (!kycForm.hasUploadedSelfie) {
      triggerToast('error', "Swafoto Diperlukan: Harap unggah Swafoto Diri pemohon.");
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

  const handleSubmit = async () => {
    if (formData.liquidity < 10) {
      triggerToast('error', "Deposit Likuiditas Minimum adalah $10 USD!");
      return;
    }
    if (!formData.name || !formData.symbol || !formData.listingDate) {
      triggerToast('error', "Mohon lengkapi semua parameter penting (Name, Symbol, Listing Date)!");
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
        status: launchMode === 'DIRECT' ? 'Listed' : 'Live'
      });
      setStep(3);
    } catch (err: any) {
      console.error(err);
      triggerToast('error', err.message || 'Gagal meluncurkan koin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center p-12 md:p-20 bg-white border border-slate-200 rounded-xl shadow-sm mt-6 max-w-xl mx-auto text-center animate-fadeIn">
        <div className="w-16 h-16 bg-[#00AE64]/10 rounded-full flex items-center justify-center mb-6 border border-slate-200">
          <Rocket className="w-8 h-8 text-[#00AE64] animate-pulse" />
        </div>
        <h2 className="text-xl md:text-2xl font-black text-slate-850 tracking-tight">Siap Luncurkan Koin Anda Sendiri?</h2>
        <p className="text-slate-500 text-sm mt-3 mb-8 max-w-sm font-semibold">Dapatkan akses instan untuk meluncurkan token baru dan menjangkau ribuan investor aktif dalam hitungan menit.</p>
        <button 
          onClick={login}
          className="w-full bg-[#00AE64] hover:bg-[#009656] text-white font-black py-4 px-8 rounded-lg shadow-sm hover:shadow-emerald-550/10 transition-all cursor-pointer flex items-center justify-center gap-2 text-xs uppercase tracking-wider"
        >
          Masuk dengan Google
        </button>
      </div>
    );
  }

  if (user.email !== 'dewanggamiliarder@gmail.com') {
    return (
      <div className="flex flex-col items-center justify-center p-12 md:p-20 bg-white border border-slate-200 rounded-xl shadow-sm mt-6 max-w-xl mx-auto text-center animate-fadeIn">
        <AlertTriangle className="w-12 h-12 text-rose-500 mb-4" />
        <h2 className="text-xl font-black text-slate-850">Akses Ditolak</h2>
        <p className="text-slate-500 text-sm mt-2 max-w-sm">Hanya akun dewanggamiliarder@gmail.com yang diberikan izin untuk membuat koin di VIA X.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto mt-6">
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
         <div>
            <div className="flex items-center gap-2">
              <span className="bg-[#00AE64]/10 text-[#00AE64] text-[10px] tracking-widest font-black uppercase px-2 py-0.5 rounded border border-[#00AE64]/20">WEB3 AMM CONTRACT</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-850 mt-1">VIA X LAUNCHPAD</h1>
            <p className="text-slate-500 text-xs md:text-sm mt-0.5 font-semibold">Terbitkan koin kustom Anda sendiri pada AMM Pool secara profesional tanpa kode pemrograman.</p>
         </div>
         <button
           disabled={isClearing}
           onClick={handleClearAll}
           className="shrink-0 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-extrabold text-xs px-4 py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 uppercase tracking-wider"
         >
           {isClearing ? (
             <>
               <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-500" />
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

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden mb-12">
        {/* Progress Bar */}
        <div className="flex border-b border-slate-200 bg-slate-50/50">
          {[1, 2, 3].map((s) => (
             <div key={s} className={`flex-1 py-4 px-3 text-center border-r last:border-0 border-slate-200 transition-colors ${step >= s ? 'bg-[#00AE64]/5 relative' : 'bg-slate-50/50 grayscale'}`}>
                {step === s && <motion.div layoutId="step-highlight" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00AE64]" />}
                <span className={`text-[10px] md:text-xs font-black uppercase tracking-widest flex items-center justify-center gap-1.5 ${step >= s ? 'text-[#00AE64]' : 'text-slate-400'}`}>
                  <span className={`w-4 h-4 rounded-full text-[9px] font-black flex items-center justify-center ${step >= s ? 'bg-[#00AE64] text-white' : 'bg-slate-200 text-slate-400'}`}>{s}</span>
                  <span className="hidden sm:inline">{s === 1 ? 'Detail Token' : s === 2 ? 'Pengaturan Listing' : 'Luncurkan'}</span>
                  <span className="sm:hidden">{s === 1 ? 'Detail' : s === 2 ? 'Listing' : 'Selesai'}</span>
                </span>
             </div>
          ))}
        </div>

        <div className="p-6 md:p-8 bg-white">
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
                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest block font-sans">Nama Token (Token Name)</label>
                        <input name="name" value={formData.name} onChange={handleChange} placeholder="Contoh: MetaChain Gold" className="w-full border border-slate-200 rounded-lg bg-slate-50/55 p-3 text-sm focus:bg-white focus:ring-2 focus:ring-[#00AE64]/10 focus:border-[#00AE64] outline-none text-slate-800 transition-all font-semibold placeholder:text-slate-400" required />
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest block font-sans">Simbol Koin (Ticker Symbol)</label>
                        <input name="symbol" value={formData.symbol} onChange={handleChange} placeholder="Contoh: MCG" className="w-full border border-slate-200 rounded-lg bg-slate-50/55 p-3 text-sm focus:bg-white focus:ring-2 focus:ring-[#00AE64]/10 focus:border-[#00AE64] outline-none text-slate-800 transition-all font-black uppercase tracking-wider placeholder:text-slate-400" required />
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                     <div className="space-y-1.5">
                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center justify-between font-sans">
                          Total Pasokan
                          <Coins className="w-3.5 h-3.5 text-slate-400" />
                        </label>
                        <input type="number" name="totalSupply" value={formData.totalSupply} onChange={handleChange} className="w-full border border-slate-200 rounded-lg bg-slate-50/55 p-3 text-sm focus:bg-white focus:ring-2 focus:ring-[#00AE64]/10 focus:border-[#00AE64] outline-none font-bold font-mono text-slate-800 transition-all" required />
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-xs font-black text-emerald-600 uppercase tracking-widest flex items-center justify-between font-sans">
                          Sirkulasi Publik (60%)
                          <Percent className="w-3.5 h-3.5 text-[#00AE64]" />
                        </label>
                        <input type="number" name="circulatingSupply" value={formData.circulatingSupply} onChange={handleChange} className="w-full border border-slate-200 rounded-lg bg-slate-50/55 p-3 text-sm focus:bg-white focus:ring-2 focus:ring-[#00AE64]/10 focus:border-[#00AE64] outline-none font-bold font-mono text-[#00AE64] transition-all" required />
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-xs font-black text-indigo-600 uppercase tracking-widest flex items-center justify-between font-sans">
                          Founder Lock (40%)
                          <Lock className="w-3.5 h-3.5 text-indigo-550" />
                        </label>
                        <input type="number" name="lockSupplyCreator" value={formData.lockSupplyCreator} disabled className="w-full border border-slate-200 rounded-lg bg-indigo-50/30 p-3 text-sm text-indigo-600 font-bold font-mono cursor-not-allowed" />
                     </div>
                  </div>

                  <div className="space-y-1.5">
                     <label className="text-xs font-black text-slate-500 uppercase tracking-widest block font-sans">URL Logo Koin (Kosongkan untuk otomatis)</label>
                     <input name="logo" value={formData.logo} onChange={handleChange} placeholder="https://domain.com/logo.png" className="w-full border border-slate-200 rounded-lg bg-slate-50/55 p-3 text-sm focus:bg-white focus:ring-2 focus:ring-[#00AE64]/10 focus:border-[#00AE64] outline-none text-slate-800 transition-all font-semibold placeholder:text-slate-400" />
                  </div>

                  <div className="space-y-1.5">
                     <label className="text-xs font-black text-slate-500 uppercase tracking-widest block font-sans">Deskripsi Proyek (Project Vision)</label>
                     <textarea name="description" value={formData.description} onChange={handleChange} rows={3} placeholder="Jelaskan mengenai visi, kegunaan utilitas, dan roadmap pengembangan koin kustom Anda secara ringkas..." className="w-full border border-slate-200 rounded-lg bg-slate-50/55 p-3 text-sm focus:bg-white focus:ring-2 focus:ring-[#00AE64]/10 focus:border-[#00AE64] outline-none text-slate-800 transition-all resize-none font-semibold leading-relaxed placeholder:text-slate-400" required />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                     <div className="relative">
                       <Globe className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                       <input name="website" value={formData.website} onChange={handleChange} placeholder="Situs Web Resmi (Website URL)" className="w-full border border-slate-200 rounded-lg bg-slate-50/55 p-3 pl-10 text-sm focus:bg-white focus:ring-2 focus:ring-[#00AE64]/10 focus:border-[#00AE64] outline-none text-slate-800 font-semibold transition-all placeholder:text-slate-400" required />
                     </div>
                     <div className="relative">
                       <Twitter className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                       <input name="twitter" value={formData.twitter} onChange={handleChange} placeholder="Akun Twitter / X Link" className="w-full border border-slate-200 rounded-lg bg-slate-50/55 p-3 pl-10 text-sm focus:bg-white focus:ring-2 focus:ring-[#00AE64]/10 focus:border-[#00AE64] outline-none text-slate-800 font-semibold transition-all placeholder:text-slate-400" />
                     </div>
                  </div>

                  <div className="pt-3">
                     <button 
                      type="button"
                      onClick={() => {
                        if (!formData.name || !formData.symbol) {
                          triggerToast('error', "Mohon lengkapi Token Name dan Symbol koin terlebih dahulu.");
                          return;
                        }
                        setStep(2);
                      }}
                      className="w-full bg-[#00AE64] hover:bg-[#009656] text-white font-black py-4 px-6 rounded-lg shadow-sm hover:shadow-emerald-500/10 transition-all flex items-center justify-center gap-2 cursor-pointer text-xs uppercase tracking-widest"
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
                  {/* Launch Mode Selection */}
                  <div className="space-y-1.5 p-4 bg-slate-50/55 border border-slate-200 rounded-xl">
                     <label className="text-xs font-black text-slate-500 uppercase tracking-widest block font-sans">Pilih Model Peluncuran Koin (Launch Mode)</label>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                        <button
                          type="button"
                          onClick={() => setLaunchMode('IPO')}
                          className={`p-3 rounded-lg border text-left font-bold transition-all flex flex-col justify-between cursor-pointer ${
                            launchMode === 'IPO' 
                              ? 'bg-emerald-50 border-[#00AE64] text-emerald-800 shadow-sm' 
                              : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                          }`}
                        >
                           <div>
                              <span className="font-extrabold text-[#00AE64] text-xs uppercase tracking-wider block">1. Open Crowdfund IPO</span>
                              <p className={`text-[10px] font-semibold normal-case mt-1.5 leading-relaxed ${launchMode === 'IPO' ? 'text-emerald-700/90' : 'text-slate-400'}`}>
                                Buka masa pre-order dan crowdfunding IPO sebelum masuk bursa utama.
                              </p>
                           </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => setLaunchMode('DIRECT')}
                          className={`p-3 rounded-lg border text-left font-bold transition-all flex flex-col justify-between cursor-pointer ${
                            launchMode === 'DIRECT' 
                              ? 'bg-[#00AE64]/5 border-[#00AE64] text-emerald-800 shadow-sm' 
                              : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                          }`}
                        >
                           <div>
                              <span className="font-extrabold text-blue-600 text-xs uppercase tracking-wider block">2. Direct Listing (Instan)</span>
                              <p className={`text-[10px] font-semibold normal-case mt-1.5 leading-relaxed ${launchMode === 'DIRECT' ? 'text-emerald-700/90' : 'text-slate-400'}`}>
                                Lewati pre-order! Koin akan langsung terdaftar di bursa AMM untuk transaksi jual/beli.
                              </p>
                           </div>
                        </button>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                     <div className="space-y-1.5">
                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest block font-sans">Harga Perdana IPO (Harga Awal dalam USD)</label>
                        <input type="number" step="0.001" name="initialPrice" value={formData.initialPrice} onChange={handleChange} className="w-full border border-slate-200 rounded-lg bg-slate-50/55 p-3 text-sm font-bold font-mono text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#00AE64]/10 focus:border-[#00AE64] outline-none transition-all placeholder:text-slate-400" required />
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center justify-between font-sans">
                          Tanggal Selesai Penawaran / Listing IPO
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        </label>
                        <input type="datetime-local" name="listingDate" value={formData.listingDate} onChange={handleChange} className="w-full border border-slate-200 rounded-lg bg-slate-50/55 p-3 text-sm font-bold font-mono text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#00AE64]/10 focus:border-[#00AE64] outline-none transition-all" required />
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                     <div className="space-y-1.5">
                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest block font-sans">Batas Minimum Pembelian User (Token {formData.symbol || 'MCG'})</label>
                        <input type="number" name="minBuy" value={formData.minBuy} onChange={handleChange} className="w-full border border-slate-200 rounded-lg bg-slate-50/55 p-3 text-sm font-bold font-mono text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#00AE64]/10 focus:border-[#00AE64] outline-none transition-all placeholder:text-slate-400" />
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest block font-sans">Batas Maksimum Pembelian User (Token {formData.symbol || 'MCG'})</label>
                        <input type="number" name="maxBuy" value={formData.maxBuy} onChange={handleChange} className="w-full border border-slate-200 rounded-lg bg-slate-50/55 p-3 text-sm font-bold font-mono text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#00AE64]/10 focus:border-[#00AE64] outline-none transition-all placeholder:text-slate-400" />
                     </div>
                  </div>

                  <div className="space-y-2 bg-emerald-50/30 text-slate-800 rounded-xl p-5 md:p-6 border border-slate-200">
                     <label className="text-xs font-black text-[#00AE64] uppercase flex items-center gap-1.5 mb-1 tracking-widest font-sans">
                        <Wallet className="w-4 h-4 text-emerald-500" /> JAMINAN LIKUIDITAS POOL DISPERSAL (AMM POOL)
                     </label>
                     <p className="text-[11px] text-slate-500 mb-4 leading-relaxed font-semibold">
                       Sistem secara wajib mempersiapkan Pool Likuiditas USD yang dipasangkan ke koin Anda pada pasar bursa AMM untuk menjamin likuiditas instan beli/jual dan memitigasi fluktuasi liar sesaat setelah terdaftar.
                     </p>
                     
                     <div className="relative">
                        <input 
                           type="number" 
                           name="liquidity" 
                           min={10}
                           value={formData.liquidity} 
                           onChange={handleChange} 
                           className="w-full bg-white border border-slate-200 rounded-lg p-3.5 pl-4 pr-16 text-xl font-bold font-mono text-slate-800 focus:outline-none focus:border-[#00AE64] transition-colors" 
                           required
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400 uppercase">USD</span>
                     </div>
                     <div className="flex flex-col sm:flex-row justify-between text-[11px] text-slate-500 mt-3 font-semibold gap-1">
                        <span>Deposit Likuiditas Minimum: $10 USD</span>
                        <span className="text-[#00AE64] font-bold">Token Likuiditas Pasar: {(formData.liquidity / (formData.initialPrice || 0.1)).toLocaleString(undefined, { maximumFractionDigits: 0 })} Token AMM</span>
                     </div>
                  </div>

                  <div className="bg-sky-50 border border-sky-100 p-4 rounded-xl flex gap-3 text-sky-800">
                     <ShieldCheck className="w-5 h-5 text-sky-500 shrink-0 mt-0.5" />
                     <div>
                       <p className="text-xs font-black uppercase tracking-widest text-sky-950 font-sans">VERIFIKASI PROSES LISTING OTOMATIS</p>
                       <p className="text-[11px] mt-1 leading-relaxed text-sky-700/95 font-semibold">
                         Koin kustom yang Anda rilis akan tercatat otomatis di bursa IPO CENTER dalam status UPCOMING/LIVE. Perdagangan pasar bebas akan otomatis dibuka jika waktu penawaran habis atau target pengumpulan dana (hardcap) terpenuhi.
                       </p>
                     </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                     <button
                       type="button" 
                       onClick={() => setStep(1)}
                       className="flex-1 border border-slate-200 text-slate-600 font-extrabold py-3.5 px-6 rounded-lg hover:bg-slate-50 transition-all cursor-pointer text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 bg-white"
                     >
                       <ArrowLeft className="w-3.5 h-3.5" /> Kembali
                     </button>
                     <button
                       type="button" 
                       onClick={handleSubmit}
                       disabled={isSubmitting}
                       className="flex-[2] bg-[#00AE64] text-white font-black py-3.5 px-6 rounded-lg hover:bg-[#009656] shadow-sm hover:shadow-emerald-500/10 transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-xs uppercase tracking-widest cursor-pointer mt-0"
                     >
                       {isSubmitting ? (
                         <>
                           <Loader2 className="w-4 h-4 animate-spin text-white animate-normal" /> Menjalankan Kontrak AMM...
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
                  <div className="w-16 h-16 bg-[#00AE64]/10 rounded-full flex items-center justify-center mb-5 border border-emerald-500/20">
                     <CheckCircle className="w-10 h-10 text-[#00AE64]" />
                  </div>
                  <h2 className="text-2xl font-black text-slate-800 tracking-tight">Koin Berhasil Diluncurkan!</h2>
                  <p className="text-sm text-slate-500 mt-2 max-w-md leading-relaxed font-semibold">
                    Selamat! Koin kustom pengembang <strong>{formData.name} ({formData.symbol.toUpperCase()})</strong> telah diinisialisasi jaminan likuiditasnya dan sekarang resmi didaftarkan di portal IPO Center!
                  </p>
                  <button 
                   type="button"
                   onClick={onComplete}
                   className="mt-8 bg-[#00AE64] hover:bg-[#009656] text-white font-black py-4 px-8 rounded-lg shadow-sm hover:shadow-emerald-500/10 transition-all text-xs uppercase tracking-widest cursor-pointer flex items-center gap-1.5"
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
            className={`fixed bottom-6 left-1/2 -translate-x-1/2 min-w-[280px] max-w-[90%] px-4 py-3 rounded-xl shadow-lg border text-xs font-bold z-[9999] flex items-center gap-2.5 ${
              toast.type === 'success' 
                ? 'bg-white border-emerald-200 text-emerald-850' 
                : 'bg-white border-rose-200 text-rose-850'
            }`}
          >
            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${toast.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
            <span className="flex-1 leading-normal text-slate-780">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
