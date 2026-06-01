/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useFirebase } from './FirebaseProvider';
import { doc, updateDoc } from 'firebase/firestore';
import { 
  X, 
  ShieldCheck, 
  UserCheck, 
  Upload, 
  Loader2, 
  CheckCircle, 
  AlertTriangle, 
  Wallet,
  ShieldAlert,
  ArrowRight,
  RefreshCw
} from 'lucide-react';

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 jam dalam milidetik

export default function VerificationModal({ isOpen, onClose }: VerificationModalProps) {
  const { user, userProfile, updateBalance, db, verifyUser } = useFirebase();
  const [kycForm, setKycForm] = useState({
    fullName: '',
    idNumber: '',
    hasUploadedId: false,
    hasUploadedSelfie: false,
  });
  const [idImageBase64, setIdImageBase64] = useState<string | null>(null);
  const [selfieImageBase64, setSelfieImageBase64] = useState<string | null>(null);

  const handleIdFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setIdImageBase64(reader.result);
          setKycForm(p => ({ ...p, hasUploadedId: true }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelfieFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setSelfieImageBase64(reader.result);
          setKycForm(p => ({ ...p, hasUploadedSelfie: true }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [kycStepText, setKycStepText] = useState("Ajukan Verifikasi Instan");
  const [grantClaimed, setGrantClaimed] = useState(false);
  const [grantLoading, setGrantLoading] = useState(false);
  
  // Custom Toast state
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Rejection state
  const [rejectedAt, setRejectedAt] = useState<number | null>(() => {
    if (!user) return null;
    const stored = localStorage.getItem(`kyc_rejected_${user.uid}`);
    return stored ? Number(stored) : null;
  });
  const [rejectionReason, setRejectionReason] = useState<string>(() => {
    if (!user) return "";
    return localStorage.getItem(`kyc_rejected_reason_${user.uid}`) || "Dokumen palsu atau terindikasi tidak valid oleh sistem anti-fraud.";
  });

  const [timeLeft, setTimeLeft] = useState<number>(0);

  React.useEffect(() => {
    if (!rejectedAt) {
      setTimeLeft(0);
      return;
    }
    const updateTimer = () => {
      const elapsed = Date.now() - rejectedAt;
      const remaining = COOLDOWN_MS - elapsed;
      if (remaining <= 0) {
        // Cooldown finished! Clear state.
        localStorage.removeItem(`kyc_rejected_${user?.uid}`);
        localStorage.removeItem(`kyc_rejected_reason_${user?.uid}`);
        setRejectedAt(null);
        setTimeLeft(0);
      } else {
        setTimeLeft(remaining);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [rejectedAt, user?.uid]);

  if (!isOpen || !user || !userProfile) return null;

  const triggerToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  const handleRejectKyc = (reason: string) => {
    const timestamp = Date.now();
    localStorage.setItem(`kyc_rejected_${user.uid}`, timestamp.toString());
    localStorage.setItem(`kyc_rejected_reason_${user.uid}`, reason);
    setRejectedAt(timestamp);
    setRejectionReason(reason);
    triggerToast('error', `🚨 Pengajuan Ditolak: ${reason}`);
  };

  const handleResetCooldown = () => {
    localStorage.removeItem(`kyc_rejected_${user.uid}`);
    localStorage.removeItem(`kyc_rejected_reason_${user.uid}`);
    setRejectedAt(null);
    setTimeLeft(0);
    triggerToast('success', "🔄 Simulasi: Periode tunggu berhasil di-reset! Anda sekarang bisa mendaftar ulang.");
  };

  const formatTimeLeft = (ms: number) => {
    if (ms <= 0) return "0 jam 0 menit 0 detik";
    const totalSecs = Math.floor(ms / 1000);
    const hours = Math.floor(totalSecs / 3600);
    const minutes = Math.floor((totalSecs % 3600) / 60);
    const seconds = totalSecs % 60;
    return `${hours} Jam ${minutes} Menit ${seconds} Detik`;
  };

  const handleKycSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const cleanedName = kycForm.fullName.trim();
    const cleanedId = kycForm.idNumber.trim();

    if (!cleanedName || !cleanedId) {
      triggerToast('error', "Nama Lengkap dan Nomor ID/Passport wajib diisi.");
      return;
    }

    if (cleanedName.length < 3) {
      handleRejectKyc("Nama Lengkap terlalu pendek. Harap sertakan nama asli lengkap yang valid.");
      return;
    }

    // Checking if contains digits or bad characters
    if (/^[0-9]+$/.test(cleanedName) || /[^a-zA-Z\s.]/.test(cleanedName) || cleanedName.toLowerCase() === "admin" || cleanedName.toLowerCase() === "reject") {
      handleRejectKyc("Terdeteksi upaya manipulasi atau nama palsu mengandung karakter ilegal.");
      return;
    }

    if (cleanedId.length < 8 || cleanedId.length > 20) {
      handleRejectKyc("Panjang nomor kartu identitas tidak sesuai standar regulasi finansial nasional.");
      return;
    }

    if (/^(.)\1+$/.test(cleanedId) || cleanedId === "12345678" || cleanedId === "123456789" || cleanedId === "00000000") {
      handleRejectKyc("Indikasi kuat dokumen palsu terdeteksi oleh modul kecerdasan buatan.");
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

    setIsSubmitting(true);
    
    try {
      // Step 1: Document OCR simulation
      setKycStepText("Membaca data identitas OCR...");
      await new Promise(r => setTimeout(r, 850));
      
      // Step 2: ZK Encryption checking simulation
      setKycStepText("Mengenkripsi data dengan Zero-Knowledge Proof...");
      await new Promise(r => setTimeout(r, 850));
      
      // Step 3: Blockchain signature signing simulation
      setKycStepText("Menyimpan identitas terenkripsi ke Ledger...");
      await new Promise(r => setTimeout(r, 850));

      await verifyUser(user.uid, true);
      
      triggerToast('success', "Akun Anda Berhasil Terverifikasi! Saldo Reward verifikasi $100 telah dikreditkan.");
    } catch (err: any) {
      triggerToast('error', "Verifikasi gagal: " + err.message);
    } finally {
      setIsSubmitting(false);
      setKycStepText("Ajukan Verifikasi Instan");
    }
  };

  const handleClaimGrant = async () => {
    setGrantLoading(true);
    try {
      await updateBalance(2000000); // Give 2,000,000 USD virtual capital
      setGrantClaimed(true);
      triggerToast('success', "Aset Pendanaan Pengembang sebesar $2,000,000 Virtual USD telah ditambahkan!");
    } catch (err: any) {
      triggerToast('error', "Klaim dana gagal: " + err.message);
    } finally {
      setGrantLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-fade-in"
          />
          {/* Main Modal */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-2xl shadow-2xl z-50 overflow-hidden border border-gray-100"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${userProfile.isVerified ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}>
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-gray-900 tracking-tight">Status Verifikasi Akun</h2>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">KYC & Identity Center</p>
                </div>
              </div>
              <button 
                onClick={onClose} 
                className="p-1 px-[5px] py-[5px] text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Area */}
            <div className="p-6">
              {userProfile.isVerified ? (
                // Verified view
                <div className="flex flex-col items-center text-center py-6 space-y-4">
                  <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center shadow-inner">
                    <CheckCircle className="w-9 h-9" />
                  </div>
                  <div>
                    <span className="bg-emerald-50 border border-emerald-100 text-[#00AE64] text-[10px] tracking-widest font-black uppercase px-2.5 py-1 rounded inline-flex items-center gap-1.5 shadow-sm">
                      <ShieldCheck className="w-3.5 h-3.5" /> Akun Terverifikasi (Pro)
                    </span>
                    <h3 className="text-lg font-black text-gray-950 mt-3 leading-none">KYC Verifikasi Sukses!</h3>
                    <p className="text-gray-500 text-xs mt-2.5 max-w-sm leading-relaxed">
                      Selamat, akun Anda telah lolos prosedur pengprüfung kepatuhan DApps. Anda sekarang memiliki hak istimewa penuh di ekosistem **CryptoBit**:
                    </p>
                  </div>

                  <div className="w-full bg-gray-50 border border-gray-150 rounded-xl p-4 text-left space-y-3 mt-2">
                    <div className="flex gap-2.5 text-xs">
                      <span className="text-[#00AE64] font-black">✔️</span>
                      <p className="text-gray-700 font-semibold leading-normal"><strong className="text-gray-950">Akses Launchpad:</strong> Kuasa rilis koin kustom dan rilis IPO baru.</p>
                    </div>
                    <div className="flex gap-2.5 text-xs">
                      <span className="text-[#00AE64] font-black">✔️</span>
                      <p className="text-gray-700 font-semibold leading-normal"><strong className="text-gray-950">Badge Terverifikasi:</strong> Badge centang biru di sebelah nama profil dan postingan Anda.</p>
                    </div>
                    <div className="flex gap-2.5 text-xs">
                      <span className="text-[#00AE64] font-black">✔️</span>
                      <p className="text-gray-700 font-semibold leading-normal"><strong className="text-gray-950">Limitasi Berkurang:</strong> Bebas biaya swap kustom, perlindungan slippage cerdas.</p>
                    </div>
                  </div>

                  <button 
                    onClick={onClose}
                    className="w-full bg-gray-900 hover:bg-gray-800 text-white font-extrabold text-xs uppercase py-3.5 rounded-lg transition-all shadow-sm cursor-pointer"
                  >
                    Tutup Dashboard
                  </button>
                </div>
              ) : rejectedAt && timeLeft > 0 ? (
                // Rejected view with countdown
                <div className="flex flex-col items-center text-center py-6 space-y-4">
                  <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center shadow-inner">
                    <ShieldAlert className="w-9 h-9" />
                  </div>
                  <div>
                    <span className="bg-rose-50 border border-rose-100 text-rose-700 text-[10px] tracking-widest font-black uppercase px-2.5 py-1 rounded inline-flex items-center gap-1.5 shadow-sm">
                      ⚠️ Pengajuan Ditolak (Rejected)
                    </span>
                    <h3 className="text-lg font-black text-gray-950 mt-3 leading-none">Verifikasi Gagal / Dibatalkan</h3>
                    <p className="text-rose-800 text-xs font-semibold bg-rose-50/60 border border-rose-100 p-3 rounded-xl mt-3.5 leading-relaxed max-w-sm mx-auto">
                      <strong>Alasan Sistem:</strong> {rejectionReason}
                    </p>
                    <p className="text-gray-500 text-[11px] mt-4 max-w-sm leading-relaxed font-semibold">
                      Sesuai dengan kebijakan penyaringan kepatuhan platform kami, Anda terdeteksi melakukan tindakan tidak wajar atau melanggar ketentuan pengajuan yang adil. Pengajuan ditangguhkan selama 24 jam.
                    </p>
                  </div>

                  <div className="w-full bg-slate-50 border border-slate-150 rounded-xl p-4 mt-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Dapat Mengajukan Ulang Dalam</span>
                    <p className="text-sm font-extrabold text-[#00AE64] font-mono tracking-wider">
                      {formatTimeLeft(timeLeft)}
                    </p>
                  </div>

                  <div className="w-full flex flex-col gap-2 pt-2">
                    <button 
                      onClick={onClose}
                      className="w-full bg-gray-900 hover:bg-gray-800 text-white font-extrabold text-xs uppercase py-3.5 rounded-lg transition-all shadow-sm cursor-pointer"
                    >
                      Kembali ke Dashboard
                    </button>
                    
                    <button
                      onClick={handleResetCooldown}
                      className="text-[9px] text-gray-400 hover:text-gray-700 flex items-center justify-center gap-1.5 transition-all mt-2 cursor-pointer font-extrabold uppercase tracking-wider"
                    >
                      <RefreshCw className="w-3 h-3" /> Bersihkan Cooldown (Simulasi Review)*
                    </button>
                  </div>
                </div>
              ) : (
                // Unverified view (Kyc form)
                <div className="space-y-4">
                  <div className="bg-amber-50 border border-amber-200/50 rounded-xl p-4 flex gap-3 text-amber-900">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <h4 className="font-extrabold text-[10px] uppercase tracking-wider text-amber-950 font-sans">Verifikasi Identitas Diperlukan</h4>
                      <p className="text-[11px] leading-relaxed text-amber-800 font-semibold">
                        Silakan isi identitas asli Anda di bawah. Masukkan nama <code className="bg-amber-100 px-1 py-0.5 rounded text-rose-700">reject</code> atau NIK <code className="bg-amber-100 px-1 py-0.5 rounded text-rose-700">12345678</code> untuk menyimulasikan penolakan 24 jam.
                      </p>
                    </div>
                  </div>

                  {/* Dev capital grant shortcut */}
                  <div className="bg-[#00AE64]/5 border border-[#00AE64]/10 p-4 rounded-xl flex items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Saldo Berjalan</span>
                      <p className="text-lg font-black text-gray-950">${(userProfile?.balance || 0).toLocaleString()}</p>
                    </div>
                    <button
                      onClick={handleClaimGrant}
                      disabled={grantLoading || grantClaimed}
                      type="button"
                      className="bg-gray-950 hover:bg-gray-800 text-white font-bold text-[10px] px-3.5 py-2.5 rounded-md transition-all shrink-0 flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-40 disabled:bg-gray-100 disabled:text-gray-400"
                    >
                      <Wallet className="w-3 h-3 text-[#00AE64]" />
                      {grantLoading ? "Memproses..." : grantClaimed ? "Grant Masuk!" : "Grant Dana $2M"}
                    </button>
                  </div>

                  <form onSubmit={handleKycSubmit} className="space-y-4 pt-1">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wide">Nama Lengkap (Sesuai Identitas)</label>
                      <input 
                        type="text" 
                        value={kycForm.fullName}
                        onChange={(e) => setKycForm(p => ({ ...p, fullName: e.target.value }))}
                        placeholder="Contoh: Satoshi Nakamoto" 
                        className="w-full border border-gray-200 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-[#00AE64]/15 focus:border-[#00AE64] outline-none font-bold text-gray-900 transition-all bg-gray-50/50 focus:bg-white" 
                        required 
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wide">Nomor Identitas (NIK KTP / No. Passport)</label>
                      <input 
                        type="text" 
                        value={kycForm.idNumber}
                        onChange={(e) => setKycForm(p => ({ ...p, idNumber: e.target.value }))}
                        placeholder="Contoh: 3201XXXXXXXX" 
                        className="w-full border border-gray-200 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-[#00AE64]/15 focus:border-[#00AE64] outline-none font-mono text-gray-900 transition-all bg-gray-50/50 focus:bg-white" 
                        required 
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      {/* Hidden Input File fields */}
                      <input 
                        type="file" 
                        id="kyc-id-file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleIdFileChange} 
                      />
                      <input 
                        type="file" 
                        id="kyc-selfie-file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleSelfieFileChange} 
                      />

                      <div 
                        onClick={() => document.getElementById('kyc-id-file')?.click()}
                        className={`border border-dashed rounded-lg p-3 text-center cursor-pointer transition-all ${
                          kycForm.hasUploadedId 
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-800' 
                            : 'bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-gray-300'
                        }`}
                      >
                        <Upload className="w-4 h-4 mx-auto mb-1 text-gray-400" />
                        <span className="text-[10px] font-bold block truncate">
                          {kycForm.hasUploadedId ? "✅ KTP Tersemat" : "Unggah KTP / Passport"}
                        </span>
                      </div>

                      <div 
                        onClick={() => document.getElementById('kyc-selfie-file')?.click()}
                        className={`border border-dashed rounded-lg p-3 text-center cursor-pointer transition-all ${
                          kycForm.hasUploadedSelfie 
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-800' 
                            : 'bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-gray-300'
                        }`}
                      >
                        <Upload className="w-4 h-4 mx-auto mb-1 text-gray-400" />
                        <span className="text-[10px] font-bold block truncate">
                          {kycForm.hasUploadedSelfie ? "✅ Swafoto Tersemat" : "Unggah Swafoto Diri"}
                        </span>
                      </div>
                    </div>

                    <button
                      id="btn-submit-kyc"
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-[#00AE64] hover:bg-[#009656] text-white font-extrabold uppercase py-3.5 rounded-lg shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-xs tracking-wider mt-4"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-white animate-normal" /> {kycStepText}
                        </>
                      ) : "Ajukan Verifikasi Instan"}
                    </button>
                  </form>
                </div>
              )}
            </div>
          </motion.div>

          {/* Floating Toast Notification overlay */}
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
        </>
      )}
    </AnimatePresence>
  );
}
