import React, { useState, useEffect } from 'react';
import { useFirebase } from './FirebaseProvider';
import { Calendar, Search, PlusCircle, Download, Upload, Send, Eye, TrendingUp, Coins, Wallet, X, Loader2, ArrowRight, Copy, Check, AlertTriangle, ArrowUpRight, Lock, Globe, Bell, Link2, Shield, Monitor, Share2, Ban, Trash2, User, PenSquare, ArrowLeft, CheckCircle2, ChevronRight, Camera, LogOut, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ProfileModal from './ProfileModal';
import VerificationModal from './VerificationModal';
import { useRealTimeCrypto } from '../hooks/useRealTimeCrypto';
import { WATCHLIST_COINS } from '../utils/constants';
import { doc, updateDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';

const TABS = ['Assets', 'History', 'Saved', 'Settings'];

const MOCK_PRICES: Record<string, number> = {
  'USD': 1,
  'BTC': 96345.75,
  'ETH': 2760.00,
  'USDT': 1.00
};

export default function ProfilePage() {
  const { user, userProfile, updateBalance, transferBalance, transferAsset, coins, db, logout } = useFirebase();
  const cryptos = useRealTimeCrypto(WATCHLIST_COINS, coins);
  const [activeTab, setActiveTab] = useState('Assets');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);

  // Settings tab states and handlers
  const [settingsSubTab, setSettingsSubTab] = useState<'profile' | 'password' | 'notification' | 'link_account' | 'privacy' | 'linked_devices' | 'share_trade' | 'blocked_list' | 'delete_account'>('profile');
  const [isEditingSettings, setIsEditingSettings] = useState(false);
  const [settingsName, setSettingsName] = useState('');
  const [settingsEmail, setSettingsEmail] = useState('');
  const [settingsBio, setSettingsBio] = useState('');
  const [settingsGender, setSettingsGender] = useState('');
  const [settingsWebsite, setSettingsWebsite] = useState('');
  const [settingsPhone, setSettingsPhone] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [showSettingsSuccess, setShowSettingsSuccess] = useState(false);

  useEffect(() => {
    if (userProfile && !isEditingSettings) {
      setSettingsName(userProfile.username || user?.displayName || 'Dewangga Miliarder');
      setSettingsEmail(userProfile.email || user?.email || 'dewanggamiliarder@gmail.com');
      setSettingsBio(userProfile.biography || '');
      setSettingsGender(userProfile.gender || 'Male');
      setSettingsWebsite(userProfile.website || 'https://viadesign.agency');
      setSettingsPhone(userProfile.phoneNumber || '6287719952733');
      setPhotoURL(userProfile.avatar || user?.photoURL || '');
    }
  }, [userProfile, user, isEditingSettings]);

  const triggerRightImageUpload = () => {
    document.getElementById('right-profile-picture-file')?.click();
  };

  const handleRightProfileFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      if (typeof reader.result === 'string') {
        setPhotoURL(reader.result);
        // Automatically save avatar back to Firebase!
        try {
          if (user && db) {
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, {
              avatar: reader.result
            });
            await updateProfile(user, {
              photoURL: reader.result
            });
            setShowSettingsSuccess(true);
            setTimeout(() => setShowSettingsSuccess(false), 4000);
          }
        } catch (err) {
          console.error("Failed to upload avatar", err);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveRightSettings = async () => {
    if (!user || !db) return;
    setIsSavingSettings(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        username: settingsName,
        email: settingsEmail,
        biography: settingsBio,
        gender: settingsGender,
        website: settingsWebsite,
        phoneNumber: settingsPhone
      });

      await updateProfile(user, {
        displayName: settingsName
      });

      setIsEditingSettings(false);
      setShowSettingsSuccess(true);
      setTimeout(() => setShowSettingsSuccess(false), 5000);
    } catch (err) {
      console.error("Error saving settings", err);
      alert('Gagal memperbarui profil: ' + (err as Error).message);
    } finally {
      setIsSavingSettings(false);
    }
  };
  
  // Transaction Modals State
  const [txModal, setTxModal] = useState<'Deposit' | 'Withdraw' | 'Transfer' | null>(null);
  const [txAmount, setTxAmount] = useState('');
  const [idrAmount, setIdrAmount] = useState<string>('');
  const [txRecipient, setTxRecipient] = useState('');
  const [txAsset, setTxAsset] = useState('USD');
  const [isProcessing, setIsProcessing] = useState(false);

  // Realistic Deposit Flow State variables
  const [depositStep, setDepositStep] = useState<'input' | 'payment_details' | 'upload' | 'verifying' | 'success'>('input');
  const [depositMethod, setDepositMethod] = useState<'bca' | 'mandiri' | 'qris' | 'gopay'>('bca');
  const [vaNumber, setVaNumber] = useState('');
  const [depositCode, setDepositCode] = useState(0);
  const [copiedVa, setCopiedVa] = useState(false);
  const [verifyingProgressText, setVerifyingProgressText] = useState('Menghubungkan ke gateway Bank Indonesia...');
  const [claimedBtcBonus, setClaimedBtcBonus] = useState(false);
  const [proofImage, setProofImage] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(1800); // 30 minutes

  useEffect(() => {
    let timer: any;
    if (depositStep === 'payment_details' && countdown > 0) {
      timer = setInterval(() => setCountdown(c => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [depositStep, countdown]);

  // Realistic Withdraw Flow State variables
  const [withdrawStep, setWithdrawStep] = useState<'input' | 'processing' | 'success'>('input');
  const [withdrawBank, setWithdrawBank] = useState<'bca' | 'mandiri' | 'bri' | 'bni'>('bca');
  const [withdrawAccountName, setWithdrawAccountName] = useState('');
  const [withdrawAccountNumber, setWithdrawAccountNumber] = useState('');

  const handleCopyAddress = () => {
    if (!userProfile?.walletAddress) return;
    try {
      navigator.clipboard.writeText(userProfile.walletAddress);
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    } catch (err) {
      const tempInput = document.createElement('input');
      tempInput.value = userProfile.walletAddress;
      document.body.appendChild(tempInput);
      tempInput.select();
      document.execCommand('copy');
      document.body.removeChild(tempInput);
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    }
  };

  if (!user || !userProfile) return null;

  // Calculate Asset Values
  const assetEntries = (Object.entries(userProfile.assets || {}) as [string, number][]).filter(([_, amount]) => amount > 0);
  
  // Add balance as an asset for the overall view calculation
  const totalBalanceValue = userProfile.balance || 0;
  
  const totalAssetsValue = assetEntries.reduce((total, [symbol, amount]) => {
    const cryptoInfo = cryptos.find(c => c.symbol === symbol);
    const price = cryptoInfo ? cryptoInfo.price : (MOCK_PRICES[symbol] || 0.1);
    return total + (amount * price);
  }, 0);

  const totalInvestedAssets = assetEntries.reduce((total, [symbol, amount]) => {
    const cryptoInfo = cryptos.find(c => c.symbol === symbol);
    const price = cryptoInfo ? cryptoInfo.price : (MOCK_PRICES[symbol] || 0.1);
    const invested = userProfile.assetsInvested?.[symbol] || (amount * price * 0.9);
    return total + invested;
  }, 0);

  const totalPortfolioValue = totalBalanceValue + totalAssetsValue;
  const portfolioPnl = totalAssetsValue - totalInvestedAssets;
  const portfolioPnlPercentage = totalInvestedAssets > 0 ? (portfolioPnl / totalInvestedAssets) * 100 : 0;
  const isPortfolioPositive = portfolioPnl >= 0;

  const currentBtcPrice = cryptos.find(c => c.symbol === 'BTC')?.price || MOCK_PRICES['BTC'];

  const handleTransaction = async () => {
    if (!txAmount || isNaN(Number(txAmount)) || Number(txAmount) <= 0) return alert('Invalid amount');
    
    setIsProcessing(true);
    try {
      const amount = Number(txAmount);
      if (txModal === 'Deposit') {
        if (depositStep === 'input') {
          if ((amount * 16350) < 999900) { // Add small tolerance due to rounding
            alert("Minimal deposit adalah Rp 1.000.000");
            setIsProcessing(false);
            return;
          }
          // Generate realistic billing details
          const uniqueFactor = Math.floor(Math.random() * 900) + 100;
          setDepositCode(uniqueFactor);
          
          setVaNumber("559301025279537");
          setDepositStep('payment_details');
          setIsProcessing(false);
          return;
        } else if (depositStep === 'payment_details') {
            setDepositStep('upload');
            setIsProcessing(false);
            return;
        } else if (depositStep === 'upload') {
            if (!proofImage) { alert('Harap upload bukti transfer'); setIsProcessing(false); return; }
          // Start simulated payment verification step
          setDepositStep('verifying');
          
          setVerifyingProgressText('AI OCR membaca bukti transfer...');
          
          try {
            const expectedAmountIdr = (Number(txAmount) * 16350) + depositCode;
            const targetAccountNumber = "559301025279537";

            const verifyRes = await fetch('/api/deposit/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                proofImageBase64: proofImage,
                expectedAmount: expectedAmountIdr,
                targetAccount: targetAccountNumber
              })
            });
            
            let verifyData;
            try {
              verifyData = await verifyRes.json();
            } catch (jsonErr) {
              console.error("JSON Parse error:", jsonErr);
              throw new Error("Gagal terhubung ke server AI. Server mengembalikan respon tidak valid (mungkin sedang restart/sibuk).");
            }
            
            if (verifyData.error) {
                alert(verifyData.error);
                setDepositStep('upload');
                setIsProcessing(false);
                return;
            }

            let finalStatus = verifyData.match ? 'Verified' : 'Rejected';
            if (!verifyData.success && !verifyData.error) finalStatus = 'Under Review'; // Fallback if API changed but still succeeded

            setVerifyingProgressText('Menyimpan hasil audit verification...');

            // Save to Firestore
            await addDoc(collection(db, 'deposits'), {
                userId: user.uid,
                userName: userProfile.username || 'Anonymous',
                amount: expectedAmountIdr,
                uniqueCode: depositCode,
                destinationBank: depositMethod,
                destinationAccount: targetAccountNumber,
                proofImage: proofImage,
                status: finalStatus,
                ocrResult: verifyData.ocrResult || null,
                fraudScore: verifyData.fraudScore || 0,
                rejectionReason: verifyData.rejectionReason || null,
                createdAt: serverTimestamp(),
                ...(finalStatus === 'Verified' ? { verifiedAt: serverTimestamp() } : {})
            });

            if (finalStatus === 'Verified') {
              const amount = Number(txAmount);
              const isBonus = !userProfile.hasDeposited && (amount * 16350 >= 1200000);
              setClaimedBtcBonus(isBonus);
              await updateBalance(amount);

              alert("AI Verification System: Bukti valid dan cocok. Deposit Berhasil!");
              setDepositStep('success');
            } else if (finalStatus === 'Rejected') {
              alert(`Deposit Ditolak oleh AI Fraud System: ${verifyData.rejectionReason || 'Bukti transfer tidak sesuai atau terindikasi kecurangan.'}`);
              setDepositStep('upload');
            } else {
              alert("Deposit membutuhkan tinjauan manual (Under Review).");
              setDepositStep('upload');
            }
          } catch (err: any) {
            console.error('Verify error', err);
            alert("Terjadi kesalahan sistem verifikasi AI.");
            setDepositStep('upload');
          }
          
          setIsProcessing(false);
          return;
        }
      } else if (txModal === 'Withdraw') {
        if (userProfile.balance < amount) throw new Error('Insufficient balance');
        
        if (withdrawStep === 'input') {
          if (!withdrawAccountName || !withdrawAccountNumber) {
            throw new Error('Nama dan Nomor Rekening wajib diisi');
          }
          setWithdrawStep('processing');
          setIsProcessing(false);
          
          await new Promise(resolve => setTimeout(resolve, 1500));
          setWithdrawStep('success');
          await updateBalance(-amount);
          return;
        }
      } else if (txModal === 'Transfer') {
        if (!txRecipient) throw new Error('Recipient required');
        if (txAsset === 'USD') {
          await transferBalance(txRecipient, amount);
        } else {
          await transferAsset(txRecipient, txAsset, amount);
        }
      }
      setTxModal(null);
      setTxAmount('');
      setTxRecipient('');
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 mt-4 w-full relative">
      <ProfileModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} onOpenVerification={() => { setIsEditModalOpen(false); setIsVerificationModalOpen(true); }} />
      <VerificationModal isOpen={isVerificationModalOpen} onClose={() => setIsVerificationModalOpen(false)} />

      {/* Transaction Modal */}
      <AnimatePresence>
        {txModal && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => !isProcessing && setTxModal(null)}
            >
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                onClick={e => e.stopPropagation()}
                className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
              >
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-900">
                    {txModal === 'Deposit' ? (
                      depositStep === 'payment_details' ? 'Rincian Pembayaran' :
                      depositStep === 'verifying' ? 'Verifikasi Sistem Gateway' :
                      depositStep === 'success' ? 'Deposit Berhasil' : 'Deposit Saldo Realistis'
                    ) : txModal === 'Withdraw' ? (
                      withdrawStep === 'processing' ? 'Proses Penarikan' :
                      withdrawStep === 'success' ? 'Penarikan Berhasil' : 'Penarikan Dana / Withdraw'
                    ) : `${txModal} Funds`}
                  </h3>
                  <button 
                    onClick={() => !isProcessing && setTxModal(null)} 
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-5 h-5"/>
                  </button>
                </div>
                
                <div className="p-6 space-y-4">
                  {txModal === 'Deposit' ? (
                    // ------------------ DEPOSIT FLOW ------------------
                    depositStep === 'input' ? (
                      <div className="space-y-4">
                        <div>
                          <label className="text-xs font-bold text-gray-500 uppercase block mb-1">
                            Nominal Deposit (IDR)
                          </label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">Rp</span>
                            <input 
                              type="number" 
                              value={idrAmount}
                              onChange={e => {
                                setIdrAmount(e.target.value);
                                setTxAmount(e.target.value ? (Number(e.target.value) / 16350).toFixed(2) : '');
                              }}
                              placeholder="1000000"
                              className="w-full border border-gray-200 rounded-lg p-4 pl-10 text-xl font-bold focus:border-[#00AE64] focus:ring-1 focus:ring-[#00AE64] outline-none text-gray-950"
                            />
                          </div>
                          
                          <div className="grid grid-cols-3 gap-2 mt-3">
                            {[1000000, 5000000, 10000000, 25000000, 50000000].map(amt => (
                              <button 
                                key={amt}
                                type="button"
                                onClick={() => { setIdrAmount(amt.toString()); setTxAmount((amt / 16350).toFixed(2)); }}
                                className={`text-[10px] font-bold p-2 rounded-lg border transition-colors ${Number(idrAmount) === amt ? 'bg-[#00AE64] text-white border-[#00AE64]' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}
                              >
                                {amt >= 1000000 ? `${amt / 1000000} Juta` : amt.toLocaleString('id-ID')}
                              </button>
                            ))}
                          </div>

                          {/* Live USD conversion preview */}
                          {idrAmount && !isNaN(Number(idrAmount)) && Number(idrAmount) > 0 && (
                            <div className="mt-3 bg-emerald-50/50 border border-emerald-100/50 p-2.5 rounded-lg flex justify-between text-xs text-gray-600">
                              <span>Setara USD (Kurs: Rp 16.350):</span>
                              <span className="font-mono font-bold text-[#00AE64]">
                                ${(Number(idrAmount) / 16350).toLocaleString('en-US', {maximumFractionDigits:2})}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Interactive Payment Methods List */}
                        <div>
                          <label className="text-xs font-bold text-gray-500 uppercase block mb-2">
                            Pilih Metode Pembayaran Realistis
                          </label>
                          <div className="grid grid-cols-2 gap-3">
                            <button
                              type="button"
                              onClick={() => setDepositMethod('bca')}
                              className={`p-3 border rounded-xl flex flex-col items-center justify-between transition-all text-left h-24 ${
                                depositMethod === 'bca' 
                                  ? 'border-[#00AE64] bg-emerald-50/20 text-[#00AE64] ring-2 ring-[#00AE64]/10' 
                                  : 'border-gray-200 hover:border-gray-300 bg-white text-gray-700'
                              }`}
                            >
                              <div className="w-full flex justify-between items-center">
                                <span className="bg-blue-800 text-white font-black text-[10px] px-2 py-0.5 rounded shadow-sm">BCA</span>
                                <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${depositMethod === 'bca' ? 'border-[#00AE64] bg-[#00AE64]' : 'border-gray-300'}`}>
                                  {depositMethod === 'bca' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                                </div>
                              </div>
                              <div className="w-full">
                                <span className="text-[11px] font-bold block leading-tight text-gray-800">Transfer Rekening</span>
                                <span className="text-[9px] text-gray-400 font-medium font-mono">BCA VA Instan</span>
                              </div>
                            </button>

                            <button
                              type="button"
                              onClick={() => setDepositMethod('mandiri')}
                              className={`p-3 border rounded-xl flex flex-col items-center justify-between transition-all text-left h-24 ${
                                depositMethod === 'mandiri' 
                                  ? 'border-[#00AE64] bg-emerald-50/20 text-[#00AE64] ring-2 ring-[#00AE64]/10' 
                                  : 'border-gray-200 hover:border-gray-300 bg-white text-gray-700'
                              }`}
                            >
                              <div className="w-full flex justify-between items-center">
                                <span className="bg-yellow-500 text-blue-950 font-black text-[10px] px-2 py-0.5 rounded shadow-sm">Mandiri</span>
                                <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${depositMethod === 'mandiri' ? 'border-[#00AE64] bg-[#00AE64]' : 'border-gray-300'}`}>
                                  {depositMethod === 'mandiri' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                                </div>
                              </div>
                              <div className="w-full">
                                <span className="text-[11px] font-bold block leading-tight text-gray-800">Transfer Rekening</span>
                                <span className="text-[9px] text-gray-400 font-medium font-mono">MANDIRI VA Instan</span>
                              </div>
                            </button>

                            <button
                              type="button"
                              onClick={() => setDepositMethod('qris')}
                              className={`p-3 border rounded-xl flex flex-col items-center justify-between transition-all text-left h-24 ${
                                depositMethod === 'qris' 
                                  ? 'border-[#00AE64] bg-emerald-50/20 text-[#00AE64] ring-2 ring-[#00AE64]/10' 
                                  : 'border-gray-200 hover:border-gray-300 bg-white text-gray-700'
                              }`}
                            >
                              <div className="w-full flex justify-between items-center">
                                <span className="bg-pink-600 text-white font-black text-[10px] px-2 py-0.5 rounded shadow-sm">QRIS</span>
                                <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${depositMethod === 'qris' ? 'border-[#00AE64] bg-[#00AE64]' : 'border-gray-300'}`}>
                                  {depositMethod === 'qris' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                                </div>
                              </div>
                              <div className="w-full">
                                <span className="text-[11px] font-bold block leading-tight text-gray-800">QRIS Pay Instant</span>
                                <span className="text-[9px] text-gray-400 font-medium font-mono">Gopay, OVO, Dana, LinkAja</span>
                              </div>
                            </button>

                            <button
                              type="button"
                              onClick={() => setDepositMethod('gopay')}
                              className={`p-3 border rounded-xl flex flex-col items-center justify-between transition-all text-left h-24 ${
                                depositMethod === 'gopay' 
                                  ? 'border-[#00AE64] bg-emerald-50/20 text-[#00AE64] ring-2 ring-[#00AE64]/10' 
                                  : 'border-gray-200 hover:border-gray-300 bg-white text-gray-700'
                              }`}
                            >
                              <div className="w-full flex justify-between items-center">
                                <span className="bg-blue-600 text-white font-black text-[10px] px-2 py-0.5 rounded shadow-sm">GoPay</span>
                                <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${depositMethod === 'gopay' ? 'border-[#00AE64] bg-[#00AE64]' : 'border-gray-300'}`}>
                                  {depositMethod === 'gopay' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                                </div>
                              </div>
                              <div className="w-full">
                                <span className="text-[11px] font-bold block leading-tight text-gray-800">GoPay E-Wallet</span>
                                <span className="text-[9px] text-gray-400 font-medium font-mono">Deeplink Terintegrasi</span>
                              </div>
                            </button>
                          </div>
                        </div>

                        {/* Informative Security Disclaimer */}
                        <p className="text-[10px] text-gray-400 bg-gray-50/70 p-2.5 rounded-lg border border-gray-150 leading-normal flex items-start gap-1.5">
                          <Lock className="w-4 h-4 text-emerald-500 shrink-0" />
                          <span>Harap perhatikan seluruh instruksi transfer dengan saksama. Integrasi API Gateway dipantau dan dana akan masuk secara otomatis setelah konfirmasi bank.</span>
                        </p>

                        <button 
                          onClick={handleTransaction}
                          disabled={isProcessing || !txAmount || Number(txAmount) <= 0}
                          className="w-full mt-2 bg-[#00AE64] hover:bg-emerald-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 select-none shadow-md"
                        >
                          <span>Lanjut ke Pembayaran</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    ) : depositStep === 'payment_details' ? (
                      <div className="space-y-4">
                        {/* Chosen Invoice Badge */}
                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-gray-700 flex justify-between items-center">
                          <div>
                            <span className="text-[10px] font-black tracking-wider text-gray-400 uppercase block">Metode Dipilih</span>
                            <span className="font-extrabold uppercase text-gray-900 font-mono text-sm">
                              {depositMethod === 'qris' ? 'QRIS INSTANT PAY' : `${depositMethod} Bank Transfer`}
                            </span>
                          </div>
                          <span className="text-xs bg-amber-50 text-amber-600 border border-amber-200 px-2 py-0.5 rounded-md font-bold animate-pulse">Menunggu Transfer</span>
                        </div>

                        {/* Amount Box */}
                        <div className="bg-gradient-to-tr from-gray-950 to-gray-900 border border-gray-800 rounded-xl p-5 text-center text-white relative overflow-hidden">
                          <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">MUTASI NOMINAL TRANSFER (EKSKlusif)</p>
                          <h2 className="text-2xl font-black text-amber-400 mt-1 font-mono tracking-normal">
                            Rp {((Number(txAmount) * 16350) + depositCode).toLocaleString('id-ID')}
                          </h2>
                          <div className="flex flex-col gap-1 items-center mt-2">
                             <div className="flex gap-2 justify-center items-center text-[10px] text-slate-400 font-semibold">
                               <span>Setara:</span> 
                               <span className="text-emerald-400 font-black">${Number(txAmount).toLocaleString()} USD</span>
                               <span>+ Kode Unik VA: Rp {depositCode} (Otomatis)</span>
                             </div>
                             <div className="bg-rose-500/20 text-rose-400 border border-rose-500/30 px-3 py-1 rounded-full text-[10px] font-bold mt-2 animate-pulse flex gap-1.5 items-center">
                               <Clock className="w-3 h-3" />
                               Selesaikan Pembayaran Dalam: {Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, '0')}
                             </div>
                          </div>
                        </div>

                        {/* VA and Instruction Steps */}
                        {depositMethod === 'qris' ? (
                          <div className="flex flex-col items-center gap-3 bg-white border border-gray-200 p-4 rounded-xl">
                            <span className="text-xs font-bold text-gray-700">Scan QRIS Resmi di Bawah ini:</span>
                            
                            {/* Realistic authentic Indonesian QRIS merchant template with scanning lasers */}
                            <div className="relative w-48 h-64 border border-gray-150 p-1.5 rounded-xl flex items-center justify-center bg-white overflow-hidden shadow-md select-none">
                              {/* Glowing green scanning line running vertically */}
                              <motion.div 
                                animate={{ y: [-15, 240, -15] }}
                                transition={{ repeat: Infinity, duration: 2.5, ease: "linear" }}
                                className="absolute left-0 right-0 h-1 bg-emerald-500/90 blur-sm z-10 pointer-events-none"
                              />
                              {/* Authentic QRIS template image */}
                              <img 
                                src="/src/assets/images/qris_real_template_1780672687883.png" 
                                alt="QRIS Merchant Payment" 
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-contain pointer-events-none rounded-lg"
                              />
                            </div>
                            
                            <span className="text-[10px] text-slate-500 font-mono font-bold tracking-wider bg-gray-100 px-3 py-1 rounded">QRIS ID: {vaNumber}</span>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <span className="text-xs font-bold text-gray-500 uppercase block mb-1">Nomor Rekening Pembayaran</span>
                            <div className="flex gap-2">
                              <div className="flex-1 bg-gray-100 border border-gray-200 rounded-lg p-3 font-mono font-extrabold text-gray-800 tracking-wider text-base select-all text-center flex items-center justify-center">
                                {vaNumber}
                              </div>
                              <button 
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(vaNumber);
                                  setCopiedVa(true);
                                  setTimeout(() => setCopiedVa(false), 2000);
                                }}
                                className="bg-gray-100 border border-gray-200 hover:bg-gray-200 px-4 rounded-lg flex items-center justify-center transition-colors text-gray-600 active:scale-95"
                              >
                                {copiedVa ? <Check className="w-5 h-5 text-emerald-600" /> : <Copy className="w-5 h-5" />}
                              </button>
                            </div>
                          </div>
                        )}

                        <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-left space-y-1.5">
                          <span className="text-[11px] font-bold text-gray-700 block border-b border-gray-200/60 pb-1">Instruksi Transfer:</span>
                          <ul className="text-[10px] text-gray-500 space-y-1 font-semibold leading-relaxed">
                            <li className="flex items-start gap-1">
                              <span className="text-[#00AE64]">1.</span> 
                              <span>Buka m-Banking atau aplikasi E-Wallet kesayangan Anda.</span>
                            </li>
                            <li className="flex items-start gap-1">
                              <span className="text-[#00AE64]">2.</span> 
                              <span>Pilih menu Transfer Antar Rekening, lalu masukkan nomor deposit di atas atau Scan QR Code.</span>
                            </li>
                            <li className="flex items-start gap-1">
                              <span className="text-[#00AE64]">3.</span> 
                              <span>Pastikan nominal transfer sama persis dengan yang tertera (termasuk kode unik).</span>
                            </li>
                            <li className="flex items-start gap-1">
                              <span className="text-[#00AE64]">4.</span> 
                              <span>Tekan tombol di bawah untuk memproses verifikasi dan sinkronisasi pembayaran secara langsung.</span>
                            </li>
                          </ul>
                        </div>
                        <div className="flex gap-3 pt-2">
                          <button 
                            type="button"
                            onClick={() => setDepositStep('input')}
                            className="flex-1 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold py-3.5 rounded-xl text-sm transition-all text-center shrink-0 active:scale-[0.98]"
                          >
                            Kembali
                          </button>
                          
                          <button 
                            onClick={handleTransaction}
                            className="flex-[2] bg-[#00AE64] hover:bg-emerald-600 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] select-none shadow-md"
                          >
                            <span>Saya Sudah Membayar</span>
                            <Check className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : depositStep === 'upload' ? (
                        <div className="space-y-4">
                            <h4 className="text-sm font-bold text-gray-900">Upload Bukti Transfer</h4>
                            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-[#00AE64] transition-colors"
                                 onClick={() => document.getElementById('deposit-proof-upload')?.click()}>
                                {proofImage ? <img src={proofImage} alt="Proof" className="max-h-40 rounded-lg"/> : <Upload className="w-10 h-10 text-gray-400 mb-2"/>}
                                <span className="text-xs text-gray-500 font-medium">Klik untuk upload bukti (JPG/PNG/PDF)</span>
                                <input type="file" id="deposit-proof-upload" className="hidden" accept="image/*,.pdf" onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if(file) {
                                        if (file.type.startsWith('image/')) {
                                            const img = new Image();
                                            img.onload = () => {
                                                const canvas = document.createElement('canvas');
                                                const MAX_WIDTH = 1000;
                                                const MAX_HEIGHT = 1400;
                                                let width = img.width;
                                                let height = img.height;

                                                if (width > height) {
                                                    if (width > MAX_WIDTH) {
                                                        height *= MAX_WIDTH / width;
                                                        width = MAX_WIDTH;
                                                    }
                                                } else {
                                                    if (height > MAX_HEIGHT) {
                                                        width *= MAX_HEIGHT / height;
                                                        height = MAX_HEIGHT;
                                                    }
                                                }
                                                canvas.width = width;
                                                canvas.height = height;
                                                const ctx = canvas.getContext('2d');
                                                ctx?.drawImage(img, 0, 0, width, height);
                                                setProofImage(canvas.toDataURL('image/jpeg', 0.8));
                                            };
                                            img.src = URL.createObjectURL(file);
                                        } else {
                                            const reader = new FileReader();
                                            reader.onloadend = () => setProofImage(reader.result as string);
                                            reader.readAsDataURL(file);
                                        }
                                    }
                                }}/>
                            </div>
                            <button 
                                onClick={handleTransaction}
                                disabled={!proofImage}
                                className="w-full bg-[#00AE64] text-white font-bold py-3.5 rounded-xl disabled:opacity-50"
                            >
                                Submit Bukti
                            </button>
                        </div>
                    ) : depositStep === 'verifying' ? (
                      <div className="py-10 flex flex-col items-center justify-center text-center space-y-5">
                        {/* Beautiful rotating radar simulation */}
                        <div className="relative w-24 h-24 flex items-center justify-center">
                          <div className="absolute inset-0 border-4 border-slate-100 rounded-full" />
                          <div className="absolute inset-0 border-4 border-t-[#00AE64] border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin" />
                          <div className="absolute inset-2 border border-dashed border-emerald-500/20 rounded-full animate-[spin_12s_linear_infinite]" />
                          <Wallet className="w-8 h-8 text-[#00AE64]" />
                        </div>
                        
                        <div className="space-y-1.5 px-4">
                          <h4 className="text-base font-extrabold text-gray-900 animate-pulse">Memverifikasi Pembayaran...</h4>
                          <p className="text-xs text-gray-500 font-mono h-4">
                            {verifyingProgressText}
                          </p>
                        </div>
                        
                        <div className="w-1/2 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                          <motion.div 
                            initial={{ width: '0%' }}
                            animate={{ width: '100%' }}
                            transition={{ duration: 3 }}
                            className="bg-[#00AE64] h-full"
                          />
                        </div>
                      </div>
                    ) : (
                      // depositStep === 'success'
                      <div className="py-8 flex flex-col items-center justify-center text-center space-y-4">
                        {/* Perfect success scale animation with green ring */}
                        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-[#00AE64]">
                          <Check className="w-8 h-8 stroke-[3]" />
                        </div>

                        <div className="space-y-1.5">
                          <h4 className="text-lg font-black text-gray-900 uppercase">Deposit Sukses Terakreditasi!</h4>
                          <p className="text-xs text-gray-500 px-6">
                            Sistem gateway berhasil menyinkronkan status mutasi Anda. Saldo trading telah dimasukkan ke wallet Anda secara seketika.
                          </p>
                        </div>

                        <div className="bg-gray-50 border border-gray-200/80 p-4 rounded-xl w-full text-left space-y-2">
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-400 font-semibold">Total Kredit Masuk</span>
                            <span className="text-[#00AE64] font-black italic">+${Number(txAmount).toLocaleString('en-US', {minimumFractionDigits: 2})} USD</span>
                          </div>
                          
                          {claimedBtcBonus && (
                            <div className="bg-amber-500/10 border-2 border-amber-500/30 p-3 rounded-lg text-left mt-2">
                              <span className="text-[9px] font-black uppercase text-amber-700 bg-amber-200/60 px-1.5 py-0.5 rounded">EVENT BONUS TERKLAIM</span>
                              <p className="text-xs font-bold text-amber-900 mt-1.5">
                                Selamat! Deposit Pertama Anda senilai <span className="text-[#00AE64]">Rp {(Number(txAmount) * 16350).toLocaleString('id-ID')} IDR</span> memenuhi syarat event!
                              </p>
                              <p className="text-[11px] text-amber-700 font-medium mt-1">
                                Bonus <span className="font-extrabold text-amber-600">1 BTC</span> telah ditambahkan ke portfolio wallet Anda secara instan. Terima kasih telah mendukung VIA X!
                              </p>
                            </div>
                          )}

                          <div className="flex justify-between text-xs border-t border-gray-200/50 pt-2">
                            <span className="text-gray-400 font-semibold">Status Reconciled</span>
                            <span className="text-gray-900 font-bold font-mono">200_OK_VERIFIED</span>
                          </div>
                        </div>

                        <button 
                          onClick={() => {
                            setTxModal(null);
                            setTxAmount('');
                            setClaimedBtcBonus(false);
                          }}
                          className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-4 rounded-xl transition-all active:scale-[0.98]"
                        >
                          Selesai & Kembali ke Terminal
                        </button>
                      </div>
                    )
                  ) : txModal === 'Withdraw' ? (
                    // ------------------ WITHDRAW FLOW ------------------
                    withdrawStep === 'input' ? (
                      <div className="space-y-4">
                        <div>
                          <label className="text-xs font-bold text-gray-500 uppercase block mb-1">
                            Bank Tujuan
                          </label>
                          <div className="grid grid-cols-4 gap-2 mb-4">
                            {(['bca', 'mandiri', 'bri', 'bni'] as const).map(bank => (
                              <button
                                key={bank}
                                type="button"
                                onClick={() => setWithdrawBank(bank)}
                                className={`py-3 rounded-lg border flex flex-col items-center justify-center font-bold text-xs uppercase transition-all ${
                                  withdrawBank === bank 
                                    ? 'border-[#00AE64] bg-emerald-50 text-[#00AE64] ring-2 ring-[#00AE64]/10' 
                                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                                }`}
                              >
                                {bank.toUpperCase()}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Nama Pemilik Rekening</label>
                            <input 
                              type="text" 
                              value={withdrawAccountName}
                              onChange={e => setWithdrawAccountName(e.target.value)}
                              placeholder="SESUAI KTP"
                              className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:border-[#00AE64] outline-none font-bold text-gray-900 uppercase"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Nomor Rekening</label>
                            <input 
                              type="text" 
                              value={withdrawAccountNumber}
                              onChange={e => setWithdrawAccountNumber(e.target.value)}
                              placeholder="0001234567"
                              className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:border-[#00AE64] outline-none font-mono font-bold text-gray-900"
                            />
                          </div>
                        </div>

                        <div className="pt-2">
                          <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Amount (USD)</label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
                            <input 
                              type="number" 
                              value={txAmount}
                              onChange={e => setTxAmount(e.target.value)}
                              placeholder="0.00"
                              className="w-full border border-gray-200 rounded-lg p-4 pl-8 text-xl font-bold focus:border-[#00AE64] outline-none text-gray-950"
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-2 text-right">
                            Available: <span className="font-bold text-gray-900">${userProfile.balance.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                          </p>
                        </div>
                        
                        <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg flex gap-2">
                          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                          <p className="text-[10px] text-amber-700 font-medium">
                            Nama akun penarikan harus sama dengan nama pemilik dompet terdaftar untuk menghindari delay AML (Anti Money Laundering). Setelan ini akan memakan waktu 1-3 hari kerja untuk tiba di Bank tujuan.
                          </p>
                        </div>

                        <button 
                          onClick={handleTransaction}
                          disabled={isProcessing || !txAmount || Number(txAmount) <= 0 || !withdrawAccountName || !withdrawAccountNumber}
                          className="w-full mt-4 bg-[#00AE64] hover:bg-emerald-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                        >
                          {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                            <>
                              <span>Tarik Dana ke Bank</span>
                              <ArrowRight className="w-4 h-4" />
                            </>
                          )}
                        </button>
                      </div>
                    ) : withdrawStep === 'processing' ? (
                      <div className="py-10 flex flex-col items-center justify-center text-center space-y-5">
                        <div className="relative w-20 h-20 flex items-center justify-center">
                          <div className="absolute inset-0 border-4 border-t-amber-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin" />
                          <ArrowUpRight className="w-8 h-8 text-amber-500" />
                        </div>
                        <div className="space-y-1.5 px-4">
                          <h4 className="text-base font-extrabold text-gray-900 animate-pulse">Memproses Penarikan Dana...</h4>
                          <p className="text-xs text-gray-500 font-medium">
                            Permintaan penarikan ke rekening {withdrawBank.toUpperCase()} Anda sedang diarahkan ke payment gateway...
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="py-8 flex flex-col items-center justify-center text-center space-y-4">
                        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-[#00AE64]">
                          <Check className="w-8 h-8 stroke-[3]" />
                        </div>
                        <div className="space-y-1.5">
                          <h4 className="text-lg font-black text-gray-900 uppercase">Permintaan Diterima</h4>
                          <p className="text-xs text-gray-500 px-4">
                            Dana sebesar <span className="font-bold text-gray-900">${txAmount}</span> sedang diproses ke rekening {withdrawBank.toUpperCase()} Anda. Saldo telah dipotong.
                          </p>
                        </div>
                        <button 
                          onClick={() => {
                            setTxModal(null);
                            setTxAmount('');
                            setWithdrawStep('input');
                          }}
                          className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-4 rounded-xl mt-4"
                        >
                          Selesai
                        </button>
                      </div>
                    )
                  ) : (
                    // ------------------ TRANSFER FLOW ------------------
                    <>
                      {txModal === 'Transfer' && (
                        <div className="flex flex-col gap-4">
                          <div className="flex gap-4">
                            <div className="w-[110px] shrink-0">
                              <label className="text-[11px] font-black text-gray-500 uppercase tracking-wider block mb-1">Pilih Aset</label>
                              <select 
                                value={txAsset} 
                                onChange={e => setTxAsset(e.target.value)}
                                className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:border-[#00AE64] focus:ring-1 focus:ring-[#00AE64] outline-none bg-white font-bold text-gray-800"
                              >
                                <option value="USD">USD</option>
                                {assetEntries.map(([symbol]) => (
                                  <option key={symbol} value={symbol}>{symbol}</option>
                                ))}
                              </select>
                            </div>
                            <div className="flex-1">
                              <label className="text-[11px] font-black text-gray-500 uppercase tracking-wider block mb-1">E-Wallet Address / Email Penerima</label>
                              <input 
                                type="text" 
                                value={txRecipient}
                                onChange={e => setTxRecipient(e.target.value)}
                                placeholder="Contoh: 0x8283956a85f11... atau email"
                                className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:border-[#00AE64] focus:ring-1 focus:ring-[#00AE64] outline-none font-mono font-semibold text-gray-900"
                              />
                            </div>
                          </div>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide leading-normal bg-gray-50 p-2.5 rounded-md border border-gray-150 flex items-start gap-1.5">
                            <span className="text-[#00AE64] font-black mr-1 text-[9px] border border-[#00AE64]/30 px-1 py-0.5 rounded bg-[#00AE64]/10">TIPS</span> 
                            <span>Anda dapat mentransfer dana secara instan ke pengguna lain menggunakan alamat e-wallet hex atau alamat email akun mereka.</span>
                          </p>
                        </div>
                      )}

                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Amount {txModal === 'Deposit' ? '(USD)' : ''}</label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">
                            {txModal !== 'Transfer' || txAsset === 'USD' ? '$' : ''}
                          </span>
                          <input 
                            type="number" 
                            value={txAmount}
                            onChange={e => setTxAmount(e.target.value)}
                            placeholder="0.00"
                            className={`w-full border border-gray-200 rounded-lg p-4 text-xl font-bold focus:border-[#00AE64] focus:ring-1 focus:ring-[#00AE64] outline-none text-gray-950 ${(txModal !== 'Transfer' || txAsset === 'USD') ? 'pl-8' : ''}`}
                          />
                        </div>
                        {txModal !== 'Deposit' && (
                          <p className="text-xs text-gray-500 mt-2 text-right">
                            Available: <span className="font-bold text-gray-900">
                              {txAsset === 'USD' || txModal !== 'Transfer' 
                                ? `$${userProfile.balance.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` 
                                : `${(userProfile.assets?.[txAsset] || 0).toLocaleString()} ${txAsset}`}
                            </span>
                          </p>
                        )}
                      </div>

                      <button 
                        onClick={handleTransaction}
                        disabled={isProcessing || !txAmount || Number(txAmount) <= 0}
                        className="w-full mt-4 bg-[#00AE64] hover:bg-emerald-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                      >
                        {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                          <>
                            <span className="capitalize">Confirm {txModal}</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Top Profile Card */}
      <div className="bg-white border border-gray-200 rounded-sm p-6 lg:p-10 flex flex-col md:flex-row items-center md:items-start justify-between gap-6 relative overflow-hidden">
        {/* Subtle background pattern */}
        <div className="absolute top-0 right-0 p-8 pt-16 opacity-5 pointer-events-none">
           <svg className="w-64 h-64" viewBox="0 0 100 100">
             <path d="M50 0 L100 50 L50 100 L0 50 Z" fill="currentColor" />
           </svg>
        </div>

        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 z-10 w-full">
          {/* Avatar */}
          <div className="w-28 h-28 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-white shadow-md bg-blue-100 flex-shrink-0 flex items-center justify-center">
            {user.photoURL && user.photoURL !== "" ? (
              <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
               <div className="w-full h-full bg-gradient-to-tr from-blue-300 to-blue-500 flex items-center justify-center text-white text-4xl font-bold">
                 {user.displayName?.charAt(0).toUpperCase() || 'U'}
               </div>
            )}
          </div>

          {/* User Info */}
          <div className="flex flex-col items-center md:items-start flex-1 w-full text-center md:text-left mt-2">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">{user.displayName || 'VIA X User'}</h1>
            <p className="text-gray-500 font-medium">@{user.displayName?.replace(/\s+/g, '').toLowerCase() || 'user'}</p>
            {userProfile.walletAddress && (
               <button 
                 onClick={handleCopyAddress}
                 className="mt-2 bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-md border border-gray-200 inline-flex items-center gap-2 cursor-pointer transition-all active:scale-[0.97] max-w-full overflow-hidden"
                 title="Salin Alamat Dompet"
               >
                 <Wallet className="w-3.5 h-3.5 text-gray-500 shrink-0 hover:text-[#00AE64]" />
                 <span className="font-mono text-xs text-gray-600 font-extrabold truncate">
                   {userProfile.walletAddress.length > 15 
                     ? `${userProfile.walletAddress.slice(0, 6)}...${userProfile.walletAddress.slice(-4)}` 
                     : userProfile.walletAddress}
                 </span>
                 {copiedAddress ? (
                   <span className="text-[10px] text-emerald-600 font-black flex items-center gap-0.5 ml-1 shrink-0">
                     <Check className="w-3 h-3 text-emerald-600" /> Tersalin!
                   </span>
                 ) : (
                   <Copy className="w-3 h-3 text-gray-400 hover:text-gray-600 ml-1 shrink-0" />
                 )}
               </button>
            )}

            <div className="flex items-center gap-4 sm:gap-6 mt-4">
              <div onClick={() => { setDepositStep('input'); setTxModal('Deposit'); }} className="flex flex-col items-center gap-1 cursor-pointer group">
                <div className="w-10 h-10 rounded-full bg-[#00AE64]/10 text-[#00AE64] flex items-center justify-center group-hover:bg-[#00AE64] group-hover:text-white transition-colors">
                  <Download className="w-5 h-5" />
                </div>
                <span className="text-gray-600 text-sm font-semibold group-hover:text-gray-900 transition-colors">Deposit</span>
              </div>
              <div onClick={() => { setWithdrawStep('input'); setTxModal('Withdraw'); }} className="flex flex-col items-center gap-1 cursor-pointer group">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-colors">
                  <Upload className="w-5 h-5" />
                </div>
                <span className="text-gray-600 text-sm font-semibold group-hover:text-gray-900 transition-colors">Withdraw</span>
              </div>
              <div onClick={() => { setTxAsset('USD'); setTxModal('Transfer'); }} className="flex flex-col items-center gap-1 cursor-pointer group">
                <div className="w-10 h-10 rounded-full bg-purple-500/10 text-purple-500 flex items-center justify-center group-hover:bg-purple-500 group-hover:text-white transition-colors">
                  <Send className="w-5 h-5" />
                </div>
                <span className="text-gray-600 text-sm font-semibold group-hover:text-gray-900 transition-colors">Transfer</span>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-4 text-gray-400 text-sm">
              <Calendar className="w-4 h-4" />
              <span>Joined {user.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }) : 'recently'}</span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="z-10 flex-shrink-0 mt-4 md:mt-0">
          <button 
            onClick={() => {
              setActiveTab('Settings');
              window.scrollTo({ top: 400, behavior: 'smooth' });
            }}
            className="px-5 py-2 rounded-sm border border-gray-300 text-sm font-semibold text-[#00AE64] hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            Edit Profile
          </button>
        </div>
      </div>

      {/* Tabs and Content Section */}
      <div className="bg-white border border-gray-200 rounded-sm overflow-hidden flex flex-col min-h-[500px]">
        {/* Tabs */}
        <div className="flex items-center justify-between border-b border-gray-100 px-2 lg:px-6 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-2 lg:gap-6 py-1">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative px-2 lg:px-4 py-4 text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab ? 'text-gray-900' : 'text-gray-400 hover:text-gray-700'
                }`}
              >
                {tab}
                {activeTab === tab && (
                  <motion.div
                    layoutId="profileTabIndicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00AE64]"
                  />
                )}
              </button>
            ))}
          </div>
          <button className="p-2 text-gray-400 hover:text-gray-700 ml-4">
            <Search className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'Assets' ? (
          <div className="p-6 lg:p-10 flex-1 bg-gray-50/30">
            {/* Total Balance Card */}
            <div className="bg-gradient-to-tr from-gray-900 via-[#111827] to-[#1f2937] rounded-2xl p-8 text-white relative overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.12)] mb-8 border border-gray-800">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <svg className="w-48 h-48 -mr-10 -mt-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                   <circle cx="12" cy="12" r="10"></circle>
                   <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"></path>
                   <path d="M12 18V6"></path>
                </svg>
              </div>
              <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-[#00AE64]/10 to-transparent pointer-events-none"></div>

              <div className="relative z-10 flex flex-col md:flex-row justify-between gap-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-gray-400 font-medium flex items-center gap-2">
                      <Wallet className="w-5 h-5 text-gray-500" /> Total Expected Value
                    </p>
                  </div>
                  <div className="flex items-end gap-4 mb-3">
                    <h2 className="text-4xl md:text-5xl font-black tracking-tighter">${totalPortfolioValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</h2>
                    <span className={`${isPortfolioPositive ? 'text-[#00AE64] bg-[#00AE64]/10' : 'text-red-500 bg-red-500/10'} font-bold text-lg pb-1.5 flex items-center gap-1 px-2 py-0.5 rounded-md`}>
                      <TrendingUp className={`w-4 h-4 ${!isPortfolioPositive && 'rotate-180'}`} /> {isPortfolioPositive ? '+' : ''}{portfolioPnlPercentage.toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-500 font-medium">
                    <span>≈ {(totalPortfolioValue / currentBtcPrice).toFixed(4)} BTC</span>
                  </div>
                </div>

                <div className="bg-white/5 rounded-xl border border-white/10 p-5 flex flex-col justify-center min-w-[200px]">
                  <p className="text-gray-400 text-sm font-medium mb-1">Available USD Balance</p>
                  <h3 className="text-2xl font-bold text-[#00AE64]">${totalBalanceValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</h3>
                </div>
              </div>
            </div>

            {/* EVENT TOP UP PERTAMA BANNER */}
            <div className={`p-5 rounded-2xl mb-8 border transition-all relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-4 ${
              userProfile.firstTopUpBonusClaimed 
                ? "bg-gradient-to-r from-emerald-500/5 via-teal-500/5 to-emerald-500/5 border-emerald-300/40"
                : "bg-gradient-to-r from-amber-500/10 via-yellow-500/5 to-amber-500/10 border-amber-300/60 shadow-[0_4px_15px_rgb(245,158,11,0.04)]"
            }`}>
              {/* Decorative Background Icon */}
              <div className="absolute -right-6 -bottom-6 opacity-5 pointer-events-none text-amber-500">
                <Coins className="w-32 h-32" />
              </div>

              <div className="flex gap-4 items-center sm:items-start text-center sm:text-left z-10 w-full sm:w-auto">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                  userProfile.firstTopUpBonusClaimed 
                    ? "bg-emerald-100 text-[#00AE64]"
                    : "bg-amber-100 text-amber-600 animate-pulse"
                }`}>
                  <Coins className="w-6 h-6 stroke-[2]" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded tracking-wider ${
                      userProfile.firstTopUpBonusClaimed 
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                    }`}>
                      {userProfile.firstTopUpBonusClaimed ? "EVENT SELESAI" : "EVENT UNTUK ANDA"}
                    </span>
                    <span className="text-gray-900 font-extrabold text-sm font-sans flex items-center gap-1.5">
                      Event Top-Up Pertama VIA X 🎁
                    </span>
                  </div>
                  
                  {userProfile.firstTopUpBonusClaimed ? (
                    <p className="text-xs text-gray-500 mt-1 font-semibold pb-0.5 max-w-xl">
                      Selamat! Anda telah berhasil mengklaim bonus <span className="font-bold text-amber-600">1 BTC</span> dari event deposit pertama VIA X. Wallet Anda telah dikreditkan secara instan!
                    </p>
                  ) : (
                    <p className="text-xs text-gray-600 mt-1 pb-0.5 max-w-xl font-semibold">
                      Lakukan top-up saldo pertama Anda senilai minimal <span className="font-extrabold text-gray-900">Rp 1.200.000</span> (setara <span className="font-extrabold text-[#00AE64]">$73.40 USD</span>) untuk mendapatkan bonus instan sebesar <span className="font-black text-amber-600 bg-amber-100/50 px-1 rounded">1 BTC</span> secara langsung!
                    </p>
                  )}
                </div>
              </div>

              {!userProfile.firstTopUpBonusClaimed && (
                <button 
                  onClick={() => { setDepositStep('input'); setTxModal('Deposit'); }}
                  className="z-10 group bg-amber-500 hover:bg-amber-600 active:scale-[0.97] transition-all font-black text-xs text-white py-3 px-5 rounded-xl shadow-md flex items-center gap-1.5 whitespace-nowrap self-stretch sm:self-center justify-center cursor-pointer"
                >
                  <span>Deposit Sekarang</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              )}
            </div>
            
            {/* Asset List */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                 <Coins className="w-5 h-5 text-[#00AE64]" /> Portfolio Assets
              </h3>
              <div className="flex gap-2">
                 <button className="px-3 py-1.5 text-xs font-bold bg-white border border-gray-200 rounded text-gray-600 hover:bg-gray-50">Filter</button>
                 <button className="px-3 py-1.5 text-xs font-bold bg-white border border-gray-200 rounded text-gray-600 hover:bg-gray-50">Export</button>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl overflow-x-auto no-scrollbar shadow-sm">
              <table className="w-full text-left border-collapse min-w-[360px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-[10px] xs:text-xs text-gray-500 uppercase tracking-widest">
                    <th className="py-3 px-3 sm:py-4 sm:px-6 font-bold">Asset</th>
                    <th className="py-3 px-2 sm:py-4 sm:px-6 font-bold text-right">Balance</th>
                    <th className="py-3 px-2 sm:py-4 sm:px-6 font-bold text-right flex-col text-right">Value (USD)</th>
                    <th className="py-3 px-3 sm:py-4 sm:px-6 font-bold text-right">Allocation</th>
                  </tr>
                </thead>
                <tbody>
                  {assetEntries.length > 0 ? assetEntries.map(([symbol, amount]) => {
                    const cryptoInfo = cryptos.find(c => c.symbol === symbol);
                    const price = cryptoInfo ? cryptoInfo.price : (MOCK_PRICES[symbol] || 0.1);
                    const value = amount * price;
                    const allocation = totalPortfolioValue > 0 ? (value / totalPortfolioValue) * 100 : 0;
                    
                    return (
                      <tr key={symbol} className="border-b border-gray-100 hover:bg-gray-50 transition-colors group cursor-pointer text-xs sm:text-sm">
                        <td className="py-3 px-3 sm:py-5 sm:px-6 flex items-center gap-2 sm:gap-4">
                          <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-full border border-gray-100 bg-white shadow-sm flex items-center justify-center overflow-hidden shrink-0">
                            {/* Fetch real logo or fallback image */}
                            <img src={cryptoInfo?.logo || `https://api.dicebear.com/7.x/identicon/svg?seed=${symbol}`} alt={symbol} className="w-5 h-5 sm:w-6 sm:h-6 object-contain" />
                          </div>
                          <div>
                            <span className="font-bold text-gray-900 block text-xs sm:text-sm group-hover:text-[#00AE64] transition-colors">{symbol} Token</span>
                            <span className="text-gray-500 text-[9px] sm:text-xs font-semibold uppercase tracking-wider">{symbol}</span>
                          </div>
                        </td>
                        <td className="py-3 px-2 sm:py-5 sm:px-6 text-right">
                          <span className="font-bold text-gray-900 block text-xs sm:text-sm">{amount.toLocaleString(undefined, {maximumFractionDigits: 4})}</span>
                          <span className="text-gray-500 text-[9px] sm:text-xs font-medium">Available</span>
                        </td>
                        <td className="py-3 px-2 sm:py-5 sm:px-6 text-right">
                          <span className="font-bold text-gray-900 block text-xs sm:text-sm">${value.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                        </td>
                        <td className="py-3 px-3 sm:py-5 sm:px-6">
                          <div className="flex flex-col items-end justify-center w-16 sm:w-24 ml-auto">
                            <span className="text-[10px] sm:text-xs font-bold text-gray-900 mb-1">{allocation.toFixed(1)}%</span>
                            <div className="w-full bg-gray-100 rounded-full h-1 sm:h-1.5 overflow-hidden">
                              <div className="bg-[#00AE64] h-1 sm:h-1.5 rounded-full" style={{ width: `${allocation}%` }}></div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-gray-500 font-medium text-xs sm:text-sm">
                        You do not hold any assets yet. Head over to the Watchlist to buy some tokens!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : activeTab === 'Settings' ? (
          <div className="p-3 sm:p-6 lg:p-8 bg-slate-50 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6">
             {/* Left Column: Settings list */}
             <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-5 h-fit">
                <h2 className="text-xl font-bold text-slate-800 tracking-tight px-1">Settings</h2>
                
                <div className="space-y-1">
                   {[
                      { id: 'profile', label: 'Public Profile', icon: Globe },
                      { id: 'password', label: 'Password', icon: Lock },
                      { id: 'notification', label: 'Notification', icon: Bell },
                      { id: 'link_account', label: 'Link Account', icon: Link2 },
                      { id: 'privacy', label: 'Privacy', icon: Shield },
                      { id: 'linked_devices', label: 'Linked Devices', icon: Monitor },
                      { id: 'share_trade', label: 'Share Trade', icon: Share2 },
                      { id: 'blocked_list', label: 'Blocked List', icon: Ban },
                      { id: 'delete_account', label: 'Delete Account', icon: Trash2 }
                       ,
                       { id: 'kyc', label: 'Verifikasi KYC', icon: Shield },
                       { id: 'logout', label: 'Logout / Keluar', icon: LogOut }
                   ].map((item) => {
                      const IconComponent = item.icon;
                      const isActive = settingsSubTab === item.id;
                      return (
                         <button
                            key={item.id}
                            onClick={() => {
                              if (item.id === 'kyc') {
                                setIsVerificationModalOpen(true);
                              } else if (item.id === 'logout') {
                                logout();
                              } else {
                                setSettingsSubTab(item.id as any);
                                setIsEditingSettings(false);
                              }
                            }}
                            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-left transition-all font-semibold text-sm ${
                               isActive 
                               ? 'bg-slate-100 text-slate-1000 border-r-4 border-[#00AE64]' 
                               : item.id === 'logout' ? 'text-rose-600 hover:bg-rose-50 hover:text-rose-700' : 'text-slate-650 hover:bg-slate-50 hover:text-slate-900'
                            }`}
                         >
                            <div className="flex items-center gap-3">
                               <IconComponent className={`w-4.5 h-4.5 ${isActive ? 'text-[#00AE64]' : item.id === 'logout' ? 'text-rose-500' : item.id === 'kyc' ? 'text-amber-500' : 'text-slate-400'}`} />
                               <span>{item.label}</span>
                            </div>
                            {isActive ? (
                                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                             ) : item.id === 'kyc' ? (
                                userProfile?.kycStatus === 'VERIFIED' ? (
                                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase px-2 py-0.5 rounded border border-emerald-200">AKTIF</span>
                                ) : userProfile?.kycStatus === 'UNDER_REVIEW' ? (
                                  <span className="bg-blue-100 text-blue-800 text-[10px] font-black uppercase px-2 py-0.5 rounded border border-blue-200 font-bold">PROSES</span>
                                ) : (
                                  <span className="bg-amber-100 text-amber-800 text-[10px] font-black uppercase px-2 py-0.5 rounded border border-amber-250 animate-pulse font-bold">BELUM</span>
                                )
                             ) : null}
                         </button>
                      );
                   })}
                </div>
             </div>

             {/* Right Column: Active Settings content */}
             <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col h-full min-h-[500px]">
                {settingsSubTab === 'profile' && (
                  <div className="space-y-6 flex flex-col h-full">
                     {/* Header */}
                     <div className="flex items-center justify-between pb-6 border-b border-slate-100">
                        <div className="flex items-center gap-4">
                           {/* Back arrow button */}
                           <button 
                             onClick={() => setActiveTab('Assets')}
                             className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500 hover:text-slate-800"
                             title="Back to portfolio"
                           >
                              <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
                           </button>

                           {/* Avatar Image inside special colored background */}
                           <div className="relative group">
                              <div className="w-14 h-14 rounded-full overflow-hidden border border-slate-200 bg-blue-500/10 flex items-center justify-center p-1 relative shadow-sm">
                                 {photoURL ? (
                                   <img src={photoURL} alt="Profile" className="w-full h-full object-cover rounded-full" referrerPolicy="no-referrer" />
                                 ) : (
                                    <div className="w-full h-full bg-blue-500/10 rounded-full flex items-center justify-center text-blue-600 font-bold text-lg uppercase">
                                       {settingsName?.charAt(0).toUpperCase() || 'U'}
                                    </div>
                                 )}
                                 {isEditingSettings && (
                                    <div 
                                      onClick={triggerRightImageUpload}
                                      className="absolute inset-x-0 bottom-0 bg-black/60 py-0.5 text-center cursor-pointer transition-opacity text-white flex items-center justify-center"
                                      title="Upload photo"
                                    >
                                       <Camera className="w-3.5 h-3.5" />
                                    </div>
                                 )}
                              </div>
                              <input 
                                 type="file"
                                 id="right-profile-picture-file"
                                 accept="image/*"
                                 className="hidden"
                                 onChange={handleRightProfileFileChange}
                              />
                           </div>

                           {/* Title and Handle text */}
                           <div>
                              <h3 className="text-base font-bold text-slate-800">My Public Profile</h3>
                              <p className="text-xs text-slate-500 font-semibold mt-0.5">@{settingsName?.replaceAll(" ", "").toLowerCase() || 'dewanggatreders'}</p>
                           </div>
                        </div>

                        {/* Edit or save state action */}
                        <div>
                           {isEditingSettings ? (
                              <button
                                onClick={handleSaveRightSettings}
                                disabled={isSavingSettings}
                                className="bg-[#00AE64] hover:bg-emerald-600 text-white font-extrabold text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-sm transition-all"
                              >
                                 {isSavingSettings ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-4 h-4 text-white" />}
                                 <span>Save Changes</span>
                              </button>
                           ) : (
                              <button
                                onClick={() => setIsEditingSettings(true)}
                                className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-400 hover:text-slate-700 bg-white shadow-sm rounded-lg transition-all"
                                title="Edit Profile Details"
                              >
                                 <PenSquare className="w-5 h-5 animate-pulse" />
                              </button>
                           )}
                        </div>
                     </div>

                     {/* Success alert notice */}
                     <AnimatePresence>
                        {showSettingsSuccess && (
                           <motion.div 
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl flex items-center gap-2 text-xs font-semibold"
                           >
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              <span>Profil Anda berhasil diperbarui di server blockchain & basis data Firebase!</span>
                           </motion.div>
                        )}
                     </AnimatePresence>

                     {/* Form Rows with thin underline dividers */}
                     <div className="space-y-6 flex-1">
                        {/* Name Input */}
                        <div className="border-b border-slate-100 pb-3">
                           <label className="text-[10px] font-black tracking-widest text-slate-400 uppercase block mb-1">Name</label>
                           {isEditingSettings ? (
                              <input 
                                 type="text" 
                                 value={settingsName}
                                 onChange={e => setSettingsName(e.target.value)}
                                 className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm text-slate-850 font-bold focus:outline-none focus:border-[#00AE64]"
                              />
                           ) : (
                              <span className="text-sm font-bold text-slate-800 block min-h-[20px]">{settingsName || 'Dewangga Miliarder'}</span>
                           )}
                        </div>

                        {/* Email Input */}
                        <div className="border-b border-slate-100 pb-3">
                           <label className="text-[10px] font-black tracking-widest text-slate-400 uppercase block mb-1">Email</label>
                           {isEditingSettings ? (
                              <input 
                                 type="email" 
                                 value={settingsEmail}
                                 onChange={e => setSettingsEmail(e.target.value)}
                                 className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm text-slate-850 font-bold focus:outline-none focus:border-[#00AE64]"
                              />
                           ) : (
                              <span className="text-sm font-bold text-slate-800 block min-h-[20px]">{settingsEmail || 'dewanggamiliarder@gmail.com'}</span>
                           )}
                        </div>

                        {/* Biography Input */}
                        <div className="border-b border-slate-100 pb-3">
                           <label className="text-[10px] font-black tracking-widest text-slate-400 uppercase block mb-1">Biography</label>
                           {isEditingSettings ? (
                              <textarea 
                                 value={settingsBio}
                                 onChange={e => setSettingsBio(e.target.value)}
                                 placeholder="Beri tahu bursa tentang dirimu..."
                                 className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm text-slate-855 font-bold focus:outline-none focus:border-[#00AE64] resize-none h-20"
                              />
                           ) : (
                              <span className={`text-sm block min-h-[20px] ${settingsBio ? 'font-bold text-slate-800' : 'text-slate-400 italic font-semibold'}`}>
                                 {settingsBio || 'Isi biografi Anda di sini.'}
                              </span>
                           )}
                        </div>

                        {/* Gender Input */}
                        <div className="border-b border-slate-100 pb-3">
                           <label className="text-[10px] font-black tracking-widest text-slate-400 uppercase block mb-1">Gender</label>
                           {isEditingSettings ? (
                              <select 
                                 value={settingsGender}
                                 onChange={e => setSettingsGender(e.target.value)}
                                 className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm text-slate-850 font-bold focus:outline-none focus:border-[#00AE64]"
                              >
                                 <option value="Male">Male</option>
                                 <option value="Female">Female</option>
                                 <option value="Other">Other</option>
                              </select>
                           ) : (
                              <span className={`text-sm block min-h-[20px] ${settingsGender ? 'font-bold text-slate-800' : 'text-slate-400 font-semibold'}`}>
                                 {settingsGender || 'Gender belum diatur'}
                              </span>
                           )}
                        </div>

                        {/* Website Input */}
                        <div className="border-b border-slate-100 pb-3">
                           <label className="text-[10px] font-black tracking-widest text-slate-400 uppercase block mb-1">Website</label>
                           {isEditingSettings ? (
                              <input 
                                 type="text" 
                                 value={settingsWebsite}
                                 onChange={e => setSettingsWebsite(e.target.value)}
                                 placeholder="e.g. https://viadesign.agency"
                                 className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm text-slate-850 font-bold focus:outline-none focus:border-[#00AE64]"
                              />
                           ) : (
                              <span className={`text-sm block min-h-[20px] ${settingsWebsite ? 'font-bold text-[#00AE64] hover:underline' : 'text-slate-400 font-semibold'}`}>
                                 {settingsWebsite ? (
                                    <a href={settingsWebsite.startsWith('http') ? settingsWebsite : `https://${settingsWebsite}`} target="_blank" rel="noopener noreferrer">{settingsWebsite}</a>
                                 ) : 'Belum ada website.'}
                              </span>
                           )}
                        </div>

                        {/* Phone Number Input */}
                        <div className="pb-3">
                           <label className="text-[10px] font-black tracking-widest text-slate-400 uppercase block mb-1">Phone Number</label>
                           {isEditingSettings ? (
                              <input 
                                 type="tel" 
                                 value={settingsPhone}
                                 onChange={e => setSettingsPhone(e.target.value)}
                                 className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm text-slate-855 font-bold focus:outline-none focus:border-[#00AE64]"
                              />
                           ) : (
                              <span className="text-sm font-bold text-slate-800 block font-mono min-h-[20px]">{settingsPhone || '6287719952733'}</span>
                           )}
                        </div>
                     </div>
                  </div>
                )}

                {/* Auxiliary Sub-tab Panels */}
                {settingsSubTab === 'password' && (
                  <div className="space-y-6">
                     <div className="border-b border-slate-100 pb-4">
                        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                           <Lock className="w-5 h-5 text-[#00AE64]" />
                           Ubah Kata Sandi
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">Perbarui kata sandi akun Anda untuk meningkatkan keamanan.</p>
                     </div>
                     <div className="space-y-4">
                        <div>
                           <label className="text-xs font-bold text-slate-500 block mb-1">Old Password</label>
                           <input type="password" placeholder="Masukkan kata sandi lama" className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-[#00AE64] font-semibold text-slate-800 bg-slate-50" />
                        </div>
                        <div>
                           <label className="text-xs font-bold text-slate-500 block mb-1">New Password</label>
                           <input type="password" placeholder="Masukkan kata sandi baru" className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-[#00AE64] font-semibold text-slate-800 bg-slate-50" />
                        </div>
                        <div>
                           <label className="text-xs font-bold text-slate-500 block mb-1">Confirm New Password</label>
                           <input type="password" placeholder="Konfirmasi kata sandi baru" className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-[#00AE64] font-semibold text-slate-800 bg-slate-50" />
                        </div>
                        <button onClick={() => {
                           alert('Password updated successfully! (Simulation only)');
                        }} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-sm py-3.5 rounded-xl transition-all">
                           Update Password
                        </button>
                     </div>
                  </div>
                )}

                {settingsSubTab === 'notification' && (
                  <div className="space-y-6">
                     <div className="border-b border-slate-100 pb-4">
                        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                           <Bell className="w-5 h-5 text-[#00AE64]" />
                           Notification Settings
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">Kelola preferensi pemberitahuan instan via x.</p>
                     </div>
                     <div className="space-y-4 divide-y divide-slate-100">
                        <div className="flex justify-between items-center py-3">
                           <div>
                              <p className="text-sm font-bold text-slate-800">Email Notifications</p>
                              <p className="text-xs text-slate-450">Receive trade receipts and reports via email</p>
                           </div>
                           <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-[#00AE64] focus:ring-[#00AE64] cursor-pointer" />
                        </div>
                        <div className="flex justify-between items-center py-3">
                           <div>
                              <p className="text-sm font-bold text-slate-800">Price Alerts</p>
                              <p className="text-xs text-slate-455">Get notified when watchlisted token prices change &gt; 5%</p>
                           </div>
                           <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-[#00AE64] focus:ring-[#00AE64] cursor-pointer" />
                        </div>
                        <div className="flex justify-between items-center py-3">
                           <div>
                              <p className="text-sm font-bold text-slate-800">New Feed Followers</p>
                              <p className="text-xs text-slate-455">Get notified when people follow you or reply to posts</p>
                           </div>
                           <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-[#00AE64] focus:ring-[#00AE64] cursor-pointer" />
                        </div>
                     </div>
                  </div>
                )}

                {settingsSubTab === 'link_account' && (
                  <div className="space-y-6">
                     <div className="border-b border-slate-100 pb-4">
                        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                           <Link2 className="w-5 h-5 text-[#00AE64]" />
                           Link Accounts
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">Tautkan akun sosial media &amp; dompet eksternal Anda.</p>
                     </div>
                     <div className="space-y-4">
                        <div className="flex justify-between items-center bg-slate-50 p-4 border border-slate-200 rounded-xl">
                           <div className="flex items-center gap-3">
                              <span className="text-xs bg-red-100 text-red-600 px-2.5 py-1 rounded-md font-bold uppercase">Google</span>
                              <div>
                                 <p className="text-xs font-bold text-slate-800">dewanggamiliarder@gmail.com</p>
                                 <p className="text-[10px] text-emerald-600 font-extrabold">TERHUBUNG &amp; SINKRON</p>
                              </div>
                           </div>
                           <span className="text-xs font-bold text-slate-400">Connected</span>
                        </div>
                        <div className="flex justify-between items-center bg-slate-50 p-4 border border-slate-200 rounded-xl">
                           <div className="flex items-center gap-3">
                              <span className="text-xs bg-blue-100 text-blue-600 px-2.5 py-1 rounded-md font-bold uppercase">Telegram</span>
                              <div>
                                 <p className="text-xs font-bold text-slate-800">Telegram Bot Integration</p>
                                 <p className="text-[10px] text-slate-400 font-semibold">Tautkan untuk sinyal instan</p>
                              </div>
                           </div>
                           <button className="bg-blue-600 text-white font-extrabold text-xs px-3.5 py-1.5 rounded-lg">Hubungkan</button>
                        </div>
                     </div>
                  </div>
                )}

                {settingsSubTab === 'privacy' && (
                  <div className="space-y-6">
                     <div className="border-b border-slate-100 pb-4">
                        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                           <Shield className="w-5 h-5 text-[#00AE64]" />
                           Privacy Settings
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">Kelola privasi data profil &amp; statistik trading Anda.</p>
                     </div>
                     <div className="space-y-4 divide-y divide-slate-100">
                        <div className="flex justify-between items-center py-3">
                           <div>
                              <p className="text-sm font-bold text-slate-800">Public Portfolio</p>
                              <p className="text-xs text-slate-455">Izinkan pengguna lain melihat alokasi koin di portofolio Anda</p>
                           </div>
                           <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-[#00AE64]" />
                        </div>
                        <div className="flex justify-between items-center py-3">
                           <div>
                              <p className="text-sm font-bold text-slate-800">Anonymize Profile Handle</p>
                              <p className="text-xs text-slate-455">Sembunyikan nama asli saat melakukan transaksi whale besar</p>
                           </div>
                           <input type="checkbox" className="w-4 h-4 rounded text-[#00AE64]" />
                        </div>
                     </div>
                  </div>
                )}

                {settingsSubTab === 'linked_devices' && (
                  <div className="space-y-6">
                     <div className="border-b border-slate-100 pb-4">
                        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                           <Monitor className="w-5 h-5 text-[#00AE64]" />
                           Linked Devices
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">Perangkat aktif yang terhubung dengan akun Anda.</p>
                     </div>
                     <div className="space-y-4">
                        <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl space-y-3">
                           <div className="flex justify-between items-start">
                              <div className="flex gap-3">
                                 <Monitor className="w-8 h-8 text-slate-500 bg-slate-200/50 p-1.5 rounded-lg" />
                                 <div>
                                    <p className="text-xs font-extrabold text-slate-800">Chrome on Windows Desktop (Current)</p>
                                    <p className="text-[10px] text-slate-400 font-mono">IP: 182.1.205.14 • Jakarta, Indonesia</p>
                                 </div>
                              </div>
                              <span className="text-[10px] bg-emerald-50 border border-emerald-200 text-emerald-600 px-2 py-0.5 rounded font-black uppercase">AKTIF</span>
                           </div>
                        </div>
                     </div>
                  </div>
                )}

                {settingsSubTab === 'share_trade' && (
                  <div className="space-y-6">
                     <div className="border-b border-slate-100 pb-4">
                        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                           <Share2 className="w-5 h-5 text-[#00AE64]" />
                           Automatic Share Settings
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">Bagikan kemenangan trading otomatis Anda ke khalayak.</p>
                     </div>
                     <div className="space-y-4">
                        <div className="flex justify-between items-center py-3">
                           <div>
                              <p className="text-sm font-bold text-slate-800">Share Buy/Sell to Feed</p>
                              <p className="text-xs text-slate-455">Post transactions automatically to VIA X Stream Feed</p>
                           </div>
                           <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-[#00AE64]" />
                        </div>
                     </div>
                  </div>
                )}

                {settingsSubTab === 'blocked_list' && (
                  <div className="space-y-6 text-center py-8">
                     <Ban className="w-12 h-12 text-slate-300 mx-auto animate-bounce" />
                     <div>
                        <h4 className="text-sm font-bold text-slate-800">Empty Blocked List</h4>
                        <p className="text-xs text-slate-400 mt-1">Anda tidak memblokir akun pengguna manapun saat ini.</p>
                     </div>
                  </div>
                )}

                {settingsSubTab === 'delete_account' && (
                  <div className="space-y-6">
                     <div className="border-b border-red-100 pb-4">
                        <h3 className="text-base font-bold text-red-650 flex items-center gap-2">
                           <Trash2 className="w-5 h-5 text-red-650" />
                           Delete Account (Bahaya!)
                        </h3>
                        <p className="text-xs text-red-400 mt-1">Hapus akun secara permanen dari ekosistem bursa VIA X.</p>
                     </div>
                     <div className="bg-red-50 border border-red-200 p-4 rounded-xl text-red-800 text-xs font-semibold leading-relaxed">
                        Tindakan ini tidak dapat dibatalkan! Semua aset binance/solana, sisa saldo USD, riwayat transaksi, dan IPO koin dalam portofolio Anda akan dihapus secara permanen.
                     </div>
                     <button onClick={() => {
                        if (confirm('Apakah Anda yakin ingin menghapus akun Anda secara permanen?')) {
                           alert('Tindakan ini dibatasi demi keamanan bursa.');
                        }
                     }} className="w-full bg-red-600 hover:bg-red-700 text-white font-extrabold text-sm py-4 rounded-xl transition-all shadow-md">
                        Delete Account Permanently
                     </button>
                  </div>
                )}
             </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gray-50/50">
            <div className="w-24 h-24 mb-4 text-[#00AE64] opacity-80 mt-10">
              <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M30 60 H70 V80 H30 Z" stroke="currentColor" strokeWidth="4" strokeLinejoin="round"/>
                <path d="M40 60 V50 C40 40 60 40 60 30" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M60 60 V50" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="4" strokeDasharray="4 8" />
                <path d="M45 70 H55" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
              </svg>
            </div>
            <p className="text-gray-500 font-medium mb-6">Belum ada {activeTab.toLowerCase()}</p>
            {activeTab !== 'Settings' && (
              <button className="flex items-center gap-2 px-6 py-2.5 rounded-sm border border-[#00AE64] text-[#00AE64] font-semibold hover:bg-[#00AE64]/5 transition-colors mb-20 bg-white">
                <PlusCircle className="w-4 h-4" />
                Tambah Data
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
