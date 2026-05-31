/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useFirebase } from './FirebaseProvider';
import { Rocket, ShieldCheck, Info, Globe, Twitter, ArrowRight, CheckCircle, Loader2, Sparkles, AlertTriangle, FileText, Upload, UserCheck, Wallet } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { doc, updateDoc } from 'firebase/firestore';

export default function Launchpad({ onComplete }: { onComplete: () => void }) {
  const { createCoin, user, login, clearAllUserCoins, userProfile, updateBalance, db } = useFirebase();
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
  const [grantClaimed, setGrantClaimed] = useState(false);
  const [grantLoading, setGrantLoading] = useState(false);

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
    if (!kycForm.fullName || !kycForm.idNumber) {
      alert("Nama Lengkap dan Nomor ID/Passport wajib diisi.");
      return;
    }
    setKycIsSubmitting(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { isVerified: true });
      alert("Verifikasi KYC Creator disetujui secara instan!");
    } catch (err: any) {
      alert("Verifikasi gagal: " + err.message);
    } finally {
      setKycIsSubmitting(false);
    }
  };

  const handleClaimGrant = async () => {
    if (!user) return;
    setGrantLoading(true);
    try {
      await updateBalance(2000000); // Give 2,000,000 USD virtual capital
      setGrantClaimed(true);
      alert("Aset Pendanaan Pengembang sebesar $2,000,000 Virtual USD berhasil dikreditkan ke wallet Anda!");
    } catch (err: any) {
      alert("Klaim pendanaan gagal: " + err.message);
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
      // Create coin
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
      <div className="flex flex-col items-center justify-center p-20 bg-white border border-gray-200 rounded-sm shadow-sm mt-4">
        <Rocket className="w-16 h-16 text-[#00AE64] mb-4 animate-bounce" />
        <h2 className="text-xl font-bold">Ready to Launch your Coin?</h2>
        <p className="text-gray-500 text-sm mt-2 mb-6">Please log in to start your Web3 project journey.</p>
        <button 
          onClick={login}
          className="bg-[#00AE64] text-white font-bold py-2 px-8 rounded-sm hover:bg-[#009656] transition-all"
        >
          Login with Google
        </button>
      </div>
    );
  }

  // Render Creator KYC form if they are not verified in Firestore
  if (userProfile && !userProfile.isVerified) {
    return (
      <div className="max-w-3xl mx-auto mt-6 space-y-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-sm p-5 flex gap-4 text-yellow-800">
          <AlertTriangle className="w-8 h-8 text-yellow-600 shrink-0" />
          <div>
            <h3 className="font-extrabold text-sm uppercase tracking-wide">SECURE KYC REQUIREMENTS MET</h3>
            <p className="text-xs mt-1 leading-relaxed">
              Sesuai kebijakan kepatuhan Anti-Bot, Anti-Spam, dan Penipuan, seluruh Creator diwajibkan untuk melewati verifikasi KYC (Know Your Customer) serta melakukan deposit likuiditas virtual minimum sebesar <strong>$1,000,000 virtual USD</strong> sebelum membuat koin custom baru di bursa utama.
            </p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-sm p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
            <UserCheck className="w-8 h-8 text-[#00AE64]" />
            <div>
              <h2 className="text-2xl font-black italic tracking-tighter text-gray-900 leading-none">CREATOR KYC PORTAL</h2>
              <p className="text-xs text-gray-400 font-bold mt-1 uppercase">Identitas & Legalitas Peninjauan Instan</p>
            </div>
          </div>

          {/* Quick balance enhancer to pay $1M liquidity */}
          <div className="bg-emerald-50/50 border border-emerald-100 p-5 rounded-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Developer Balance</span>
              <p className="text-2xl font-black text-gray-900">${(userProfile?.balance || 0).toLocaleString()}</p>
              <p className="text-xs text-slate-500">Saldo virtual Anda saat ini. Untuk pendanaan awal koin AMM, diperlukan deposit likuiditas $1,000,000.</p>
            </div>
            <button
              onClick={handleClaimGrant}
              disabled={grantLoading || grantClaimed}
              className="bg-gray-900 hover:bg-gray-800 text-white font-bold text-xs py-3 px-6 rounded-sm transition-all shrink-0 flex items-center gap-2 shadow shadow-black/10 duration-150 cursor-pointer disabled:opacity-50"
            >
              <Wallet className="w-4 h-4 text-[#00AE64]" />
              {grantLoading ? "Memproses..." : grantClaimed ? "Grant Pendanaan Berhasil!" : "Klaim $2,000,000 USD Grant"}
            </button>
          </div>

          <form onSubmit={handleKycSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-xs text-gray-500 uppercase">Nama Lengkap (Sesuai Passport/KTP)</label>
                <input 
                  type="text" 
                  value={kycForm.fullName}
                  onChange={(e) => setKycForm(p => ({ ...p, fullName: e.target.value }))}
                  placeholder="e.g. Satoshi Nakamoto" 
                  className="w-full border-gray-200 rounded-sm bg-gray-50 p-3 text-sm focus:bg-white focus:ring-1 focus:ring-[#00AE64] outline-none font-bold" 
                  required 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-xs text-gray-500 uppercase">Nomor Identitas (ID / Passport / KTP)</label>
                <input 
                  type="text" 
                  value={kycForm.idNumber}
                  onChange={(e) => setKycForm(p => ({ ...p, idNumber: e.target.value }))}
                  placeholder="e.g. A92837264" 
                  className="w-full border-gray-200 rounded-sm bg-gray-50 p-3 text-sm focus:bg-white focus:ring-1 focus:ring-[#00AE64] outline-none font-mono" 
                  required 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-xs text-gray-500 uppercase">Nama Perusahaan / Organisasi (Dapps)</label>
                <input 
                  type="text" 
                  value={kycForm.companyName}
                  onChange={(e) => setKycForm(p => ({ ...p, companyName: e.target.value }))}
                  placeholder="e.g. MetaChain Labs Ltd." 
                  className="w-full border-gray-200 rounded-sm bg-gray-50 p-3 text-sm focus:bg-white focus:ring-1 focus:ring-[#00AE64] outline-none" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-xs text-gray-500 uppercase">Nomor Registrasi Perusahaan / UEN Code</label>
                <input 
                  type="text" 
                  value={kycForm.companyReg}
                  onChange={(e) => setKycForm(p => ({ ...p, companyReg: e.target.value }))}
                  placeholder="e.g. SEC-2026-928" 
                  className="w-full border-gray-200 rounded-sm bg-gray-50 p-3 text-sm focus:bg-white focus:ring-1 focus:ring-[#00AE64] outline-none font-mono" 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-2">
              <div className="space-y-2">
                <span className="text-[10px] font-black text-xs text-gray-500 uppercase block">Unggah Foto Passport / KTP</span>
                <div 
                  onClick={() => setKycForm(p => ({ ...p, hasUploadedId: true }))}
                  className={`border-2 border-dashed rounded-sm p-6 text-center cursor-pointer transition-colors ${kycForm.hasUploadedId ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`}
                >
                  <Upload className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                  <p className="text-xs font-bold">{kycForm.hasUploadedId ? "✅ Passport_Scan.jpg Terlampir" : "Pilih atau Seret Foto ID Anda di sini"}</p>
                  <p className="text-[10px] text-gray-400 mt-1">Format gambar JPG, PNG maks. 5MB</p>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-black text-xs text-gray-500 uppercase block">Unggah Foto Selfie Verifikasi Wajah</span>
                <div 
                  onClick={() => setKycForm(p => ({ ...p, hasUploadedSelfie: true }))}
                  className={`border-2 border-dashed rounded-sm p-6 text-center cursor-pointer transition-colors ${kycForm.hasUploadedSelfie ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`}
                >
                  <Upload className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                  <p className="text-xs font-bold">{kycForm.hasUploadedSelfie ? "✅ Creator_Selfie_Live.png Terlampir" : "Unggah Selfie Sambil Memegang ID"}</p>
                  <p className="text-[10px] text-gray-400 mt-1">Kamera langsung atau foto beresolusi tajam</p>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={kycIsSubmitting}
              className="w-full bg-[#00AE64] hover:bg-[#009656] text-white font-extrabold uppercase py-4 rounded-sm shadow-xl shadow-[#00AE64]/20 text-xs tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {kycIsSubmitting ? (
                 <>
                   <Loader2 className="w-4 h-4 animate-spin text-white" /> Memvalidasi Enkripsi ID...
                 </>
              ) : "Kirim Pengajuan KYC & Verifikasi Akun"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto mt-6">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
         <div>
            <h1 className="text-3xl font-black italic tracking-tighter text-[#00AE64]">CRYPTOBIT LAUNCHPAD</h1>
            <p className="text-gray-500 text-sm">Issue your own token and reach thousands of investors in minutes.</p>
         </div>
         <button
           disabled={isClearing}
           onClick={handleClearAll}
           className="shrink-0 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 hover:border-red-300 font-bold text-xs px-4 py-2.5 rounded-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
         >
           {isClearing ? (
             <>
               <Loader2 className="w-3.5 h-3.5 animate-spin text-red-500" />
               Menghapus...
             </>
           ) : "Hapus Semua Koin Pengguna"}
         </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-sm shadow-sm overflow-hidden">
        {/* Progress Bar */}
        <div className="flex border-b border-gray-100">
          {[1, 2, 3].map((s) => (
             <div key={s} className={`flex-1 p-4 text-center border-r last:border-0 border-gray-100 transition-colors ${step >= s ? 'bg-[#00AE64]/5 relative' : 'bg-gray-50/50 grayscale'}`}>
                {step === s && <motion.div layoutId="step-highlight" className="absolute bottom-0 left-0 right-0 h-1 bg-[#00AE64]" />}
                <span className={`text-[10px] font-bold uppercase tracking-widest ${step >= s ? 'text-[#00AE64]' : 'text-gray-400'}`}>
                  {s === 1 ? 'Project Details' : s === 2 ? 'Listing Setup' : 'Success'}
                </span>
             </div>
          ))}
        </div>

        <div className="p-8">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div 
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-2 gap-6">
                     <div className="space-y-2">
                       <label className="text-xs font-bold text-gray-500 uppercase">Token Name</label>
                       <input name="name" value={formData.name} onChange={handleChange} placeholder="e.g. MetaChain" className="w-full border-gray-200 rounded-sm bg-gray-50 p-3 text-sm focus:ring-1 focus:ring-[#00AE64] outline-none" required />
                     </div>
                     <div className="space-y-2">
                       <label className="text-xs font-bold text-gray-500 uppercase">Symbol</label>
                       <input name="symbol" value={formData.symbol} onChange={handleChange} placeholder="e.g. MTC" className="w-full border-gray-200 rounded-sm bg-gray-50 p-3 text-sm focus:ring-1 focus:ring-[#00AE64] outline-none font-bold block uppercase" required />
                     </div>
                  </div>

                  <div className="grid grid-cols-3 gap-6">
                     <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase">Total Supply</label>
                        <input type="number" name="totalSupply" value={formData.totalSupply} onChange={handleChange} className="w-full border-gray-200 rounded-sm bg-gray-50 p-3 text-sm focus:ring-1 focus:ring-[#00AE64] outline-none font-bold font-mono" required />
                     </div>
                     <div className="space-y-2">
                        <label className="text-xs font-bold text-[#00AE64] uppercase flex items-center gap-1">Circulating Supply (60%)</label>
                        <input type="number" name="circulatingSupply" value={formData.circulatingSupply} onChange={handleChange} className="w-full border-emerald-200 rounded-sm bg-emerald-50/30 p-3 text-sm focus:ring-1 focus:ring-[#00AE64] outline-none font-bold font-mono" required />
                     </div>
                     <div className="space-y-2">
                        <label className="text-xs font-bold text-purple-600 uppercase">Locked Founder Vesting (40%)</label>
                        <input type="number" name="lockSupplyCreator" value={formData.lockSupplyCreator} disabled className="w-full border-purple-200 rounded-sm bg-purple-50/20 p-3 text-sm text-purple-700 font-bold font-mono" />
                     </div>
                  </div>

                  <div className="space-y-2">
                     <label className="text-xs font-bold text-gray-500 uppercase">Logo URL</label>
                     <input name="logo" value={formData.logo} onChange={handleChange} placeholder="Link to logo image (SVG, PNG)" className="w-full border-gray-200 rounded-sm bg-gray-50 p-3 text-sm focus:ring-1 focus:ring-[#00AE64] outline-none" />
                  </div>

                  <div className="space-y-2">
                     <label className="text-xs font-bold text-gray-500 uppercase">Description</label>
                     <textarea name="description" value={formData.description} onChange={handleChange} rows={4} placeholder="Describe your web3 vision..." className="w-full border-gray-200 rounded-sm bg-gray-50 p-3 text-sm focus:ring-1 focus:ring-[#00AE64] outline-none resize-none" required />
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                     <div className="relative">
                       <Globe className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                       <input name="website" value={formData.website} onChange={handleChange} placeholder="Website URL" className="w-full border-gray-200 rounded-sm bg-gray-50 p-3 pl-10 text-sm focus:ring-1 focus:ring-[#00AE64] outline-none" required />
                     </div>
                     <div className="relative">
                       <Twitter className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                       <input name="twitter" value={formData.twitter} onChange={handleChange} placeholder="Twitter / X Link" className="w-full border-gray-200 rounded-sm bg-gray-50 p-3 pl-10 text-sm focus:ring-1 focus:ring-[#00AE64] outline-none" />
                     </div>
                  </div>

                  <button 
                   onClick={() => {
                     if (!formData.name || !formData.symbol) {
                       alert("Mohon lengkapi Token Name dan Symbol koin terlebih dahulu.");
                       return;
                     }
                     setStep(2);
                   }}
                   className="w-full bg-[#00AE64] hover:bg-[#009656] text-white font-extrabold py-3.5 px-6 rounded-sm transition-all flex items-center justify-center gap-2 cursor-pointer text-xs uppercase tracking-wider"
                  >
                    Continue to Listing Setup <ArrowRight className="w-4 h-4" />
                  </button>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div 
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-2 gap-6">
                     <div className="space-y-2">
                       <label className="text-xs font-bold text-gray-500 uppercase">Initial Price (IPO Price in USD)</label>
                       <input type="number" step="0.001" name="initialPrice" value={formData.initialPrice} onChange={handleChange} className="w-full border-gray-200 rounded-sm bg-gray-50 p-3 text-sm font-bold font-mono" required />
                     </div>
                     <div className="space-y-2">
                       <label className="text-xs font-bold text-gray-500 uppercase">Listing / Countdown Finish Date</label>
                       <input type="datetime-local" name="listingDate" value={formData.listingDate} onChange={handleChange} className="w-full border-gray-200 rounded-sm bg-gray-50 p-3 text-sm font-bold font-mono" required />
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                     <div className="space-y-2">
                       <label className="text-xs font-bold text-gray-500 uppercase">Min. Purchase Limit (Tokens)</label>
                       <input type="number" name="minBuy" value={formData.minBuy} onChange={handleChange} className="w-full border-gray-200 rounded-sm bg-gray-50 p-3 text-sm font-bold font-mono" />
                     </div>
                     <div className="space-y-2">
                       <label className="text-xs font-bold text-gray-500 uppercase">Max. Purchase Limit (Tokens)</label>
                       <input type="number" name="maxBuy" value={formData.maxBuy} onChange={handleChange} className="w-full border-gray-200 rounded-sm bg-gray-50 p-3 text-sm font-bold font-mono" />
                     </div>
                  </div>

                  <div className="space-y-2 bg-neutral-950 text-white rounded-sm p-5 border border-neutral-800">
                     <label className="text-xs font-bold text-[#00AE64] uppercase flex items-center gap-1.5 mb-1 tracking-wider">
                        <Wallet className="w-4 h-4" /> Deposit Virtual USD AMM Pool Liquidity
                     </label>
                     <p className="text-[11px] text-gray-400 mb-3">likuiditas USD didepositkan ke penampung pasar bebas AMM koin Anda untuk mencegah gejolak tidak stabil.</p>
                     
                     <div className="relative">
                        <input 
                           type="number" 
                           name="liquidity" 
                           min={1000000}
                           value={formData.liquidity} 
                           onChange={handleChange} 
                           className="w-full bg-neutral-900 border border-neutral-700 rounded-sm p-4 text-xl font-bold font-mono text-white focus:outline-none focus:border-[#00AE64]" 
                           required
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400 uppercase">USD</span>
                     </div>
                     <div className="flex justify-between text-[11px] text-gray-400 mt-2 font-semibold">
                        <span>Minimum Mandatori deposit: $1,000,000</span>
                        <span className="text-[#00AE64]">Aset Terjamin: {(formData.liquidity / (formData.initialPrice || 0.1)).toLocaleString(undefined, { maximumFractionDigits: 0 })} Liquidity Tokens</span>
                     </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-100 p-4 rounded-sm flex gap-3">
                     <ShieldCheck className="w-6 h-6 text-blue-500 shrink-0" />
                     <div>
                       <p className="text-xs font-bold text-blue-800 uppercase">Real-Time Market Engine Verification</p>
                       <p className="text-xs text-blue-600 mt-1">Status koin custom Anda akan masuk ke status UPCOMING/LIVE di IPO CENTER. Trading langsung aktif saat Countdown IPO atau target hardcap tercapai.</p>
                     </div>
                  </div>

                  <div className="flex gap-4">
                     <button 
                       onClick={() => setStep(1)}
                       className="flex-1 border border-gray-200 text-gray-500 font-bold py-3 px-6 rounded-sm hover:bg-gray-50 transition-all cursor-pointer text-xs uppercase"
                     >
                       Back
                     </button>
                     <button 
                       onClick={handleSubmit}
                       disabled={isSubmitting}
                       className="flex-[2] bg-[#00AE64] text-white font-extrabold py-3 px-6 rounded-sm hover:bg-[#009656] shadow-lg shadow-[#00AE64]/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-xs uppercase"
                     >
                       {isSubmitting ? (
                         <>
                           <Loader2 className="w-5 h-5 animate-spin text-white" /> launching AMM contracts...
                         </>
                       ) : (
                         'Launch Token'
                       )}
                     </button>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div 
                  key="step3"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-10"
                >
                  <div className="w-20 h-20 bg-[#00AE64] rounded-full flex items-center justify-center mb-6 shadow-xl shadow-[#00AE64]/30">
                     <CheckCircle className="w-10 h-10 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Project Launched Successfully!</h2>
                  <p className="text-center text-gray-500 mt-2 max-w-sm text-sm">
                    Selamat! Koin custom <strong>{formData.name} ({formData.symbol.toUpperCase()})</strong> telah diinisialisasi likuiditasnya dan didaftarkan di IPO Center dalam status UPCOMING/LIVE!
                  </p>
                  <button 
                   onClick={onComplete}
                   className="mt-8 bg-[#00AE64] text-white font-extrabold py-3 px-8 rounded-sm hover:bg-[#009656] transition-all text-xs uppercase tracking-wide cursor-pointer"
                  >
                    View IPO CENTER Hub <ArrowRight className="w-4 h-4 ml-1 inline" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
