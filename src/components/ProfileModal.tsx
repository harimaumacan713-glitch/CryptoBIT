import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useFirebase } from './FirebaseProvider';
import { updateProfile } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { X, Camera, Mail, Phone, Lock, User, CheckCircle2, LogOut, Loader2, ShieldCheck, Image as ImageIcon } from 'lucide-react';

export default function ProfileModal({ isOpen, onClose, onOpenVerification }: { isOpen: boolean; onClose: () => void; onOpenVerification?: () => void }) {
  const { user, logout, db, userProfile } = useFirebase();
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');
  
  const [displayName, setDisplayName] = useState(userProfile?.username || user?.displayName || '');
  const [photoURL, setPhotoURL] = useState(userProfile?.avatar || user?.photoURL || '');
  const [phoneNumber, setPhoneNumber] = useState(userProfile?.phoneNumber || '+62 812-3456-7890');
  const [email, setEmail] = useState(userProfile?.email || user?.email || '');
  
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Security states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Sync profile details if the context updates
  useEffect(() => {
    if (userProfile) {
      setDisplayName(userProfile.username || user?.displayName || '');
      setPhotoURL(userProfile.avatar || user?.photoURL || '');
      if (userProfile.phoneNumber) setPhoneNumber(userProfile.phoneNumber);
      if (userProfile.email) setEmail(userProfile.email);
    }
  }, [userProfile, user]);

  if (!isOpen || !user) return null;

  const handleProfileFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Batas Maksimal: Ukuran berkas gambar maksimal adalah 2MB!");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setPhotoURL(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerImageUpload = () => {
    document.getElementById('profile-picture-file')?.click();
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      // 1. Update Firebase Auth Profile
      await updateProfile(user, {
        displayName
      });

      // 2. Update Firestore User Document so all client states update in real-time
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        username: displayName,
        avatar: photoURL,
        phoneNumber: phoneNumber,
        email: email
      });
      
      setIsSaving(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (e: any) {
      console.error(e);
      alert("Gagal memperbarui profil: " + e.message);
      setIsSaving(false);
    }
  };

  const handleSaveSecurity = async () => {
    setIsSaving(true);
    // Mock saving password
    await new Promise(r => setTimeout(r, 1500));
    setCurrentPassword('');
    setNewPassword('');
    setIsSaving(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  const handleLogout = () => {
    logout();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white rounded-2xl shadow-2xl z-50 overflow-hidden border border-slate-200"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-slate-50">
              <div>
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <User className="text-[#00AE64]" />
                  Account Settings
                </h2>
                <p className="text-sm text-slate-500 mt-1">Manage your profile and security preferences</p>
              </div>
              <button onClick={onClose} className="p-2 text-slate-500 hover:text-slate-800 bg-slate-100 rounded-full hover:bg-slate-200 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col md:flex-row h-[500px]">
              {/* Sidebar */}
              <div className="w-full md:w-64 border-r border-slate-200 bg-slate-50/50 p-4 flex flex-col justify-between">
                <div className="space-y-2">
                  <button 
                    onClick={() => setActiveTab('profile')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold ${activeTab === 'profile' ? 'bg-[#00AE64]/10 text-[#00AE64] border border-[#00AE64]/20' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'}`}
                  >
                    <User className="w-5 h-5" />
                    Personal Info
                  </button>
                  <button 
                    onClick={() => setActiveTab('security')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold ${activeTab === 'security' ? 'bg-[#00AE64]/10 text-[#00AE64] border border-[#00AE64]/20' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'}`}
                  >
                    <Lock className="w-5 h-5" />
                    Security
                  </button>

                  {/* Verifikasi KYC Menu */}
                  <button 
                    onClick={() => {
                      onClose();
                      if (onOpenVerification) {
                        onOpenVerification();
                      }
                    }}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-amber-500/10 text-slate-500 hover:text-amber-700 border border-transparent hover:border-amber-500/20 transition-all font-semibold text-left"
                  >
                    <div className="flex items-center gap-3">
                      <ShieldCheck className="w-5 h-5 text-amber-500" />
                      <span>Verifikasi KYC</span>
                    </div>
                    {userProfile?.kycStatus === 'VERIFIED' ? (
                      <span className="bg-emerald-100 text-emerald-800 text-[9px] font-black uppercase px-2 py-0.5 rounded border border-emerald-200">AKTIF</span>
                    ) : userProfile?.kycStatus === 'UNDER_REVIEW' ? (
                      <span className="bg-blue-100 text-blue-800 text-[9px] font-black uppercase px-2 py-0.5 rounded border border-blue-200 font-bold">PROSES</span>
                    ) : (
                      <span className="bg-amber-100 text-amber-800 text-[9px] font-black uppercase px-2 py-0.5 rounded border border-amber-250 animate-pulse font-bold">BELUM</span>
                    )}
                  </button>
                </div>

                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 hover:text-red-700 transition-all font-semibold mt-auto border border-transparent hover:border-red-200"
                >
                  <LogOut className="w-5 h-5" />
                  Logout / Keluar
                </button>
              </div>

              {/* Content Area */}
              <div className="flex-1 p-8 overflow-y-auto relative no-scrollbar bg-white">
                
                <AnimatePresence>
                  {showSuccess && (
                     <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="absolute top-4 left-1/2 -translate-x-1/2 bg-[#00AE64] text-white px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 shadow-[0_4px_12px_rgba(0,174,100,0.25)] z-10 animate-bounce"
                     >
                       <CheckCircle2 className="w-4 h-4" /> Successfully Updated!
                     </motion.div>
                  )}
                </AnimatePresence>

                {activeTab === 'profile' && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                     <div className="flex flex-col items-center gap-4">
                       <div className="relative group cursor-pointer" onClick={triggerImageUpload}>
                         <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-slate-100 bg-slate-50 flex items-center justify-center shadow-sm">
                           {photoURL && photoURL !== "" ? (
                             <img src={photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                           ) : (
                             <User className="w-12 h-12 text-slate-300" />
                           )}
                         </div>
                         <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                           <Camera className="w-8 h-8 text-white" />
                         </div>
                       </div>
                       
                       {!userProfile?.isVerified && (
                         <div className="bg-amber-500/10 border border-amber-500/30 px-4 py-2 rounded-full flex items-center justify-center gap-3">
                           <span className="text-amber-600 text-xs font-bold uppercase tracking-wide">Belum Terverifikasi</span>
                           <button 
                             onClick={() => {
                               onClose();
                               if (onOpenVerification) {
                                 onOpenVerification();
                               } else {
                                 alert('Silakan hubungi admin untuk verifikasi akun.');
                               }
                             }}
                             className="bg-amber-500 text-white text-[10px] font-black uppercase px-3 py-1 rounded-md hover:bg-amber-400 transition"
                           >
                             Verifikasi Sekarang
                           </button>
                         </div>
                       )}

                       <button 
                         type="button"
                         onClick={triggerImageUpload}
                         className="text-xs text-slate-500 font-bold bg-slate-50 border border-slate-200 px-5 py-2.5 rounded-full hover:border-[#00AE64] hover:text-slate-800 transition-all flex items-center gap-2"
                       >
                         <ImageIcon className="w-4 h-4 text-[#00AE64]" /> Change Avatar
                       </button>
                       <input 
                         type="file"
                         id="profile-picture-file"
                         accept="image/*"
                         className="hidden"
                         onChange={handleProfileFileChange}
                       />
                     </div>

                     <div className="space-y-6">
                       <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                         <div className="space-y-1.5">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Full Name</label>
                           <div className="relative">
                             <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                             <input 
                               type="text" 
                               value={displayName}
                               onChange={(e) => setDisplayName(e.target.value)}
                               className="w-full bg-white border border-slate-200 rounded-lg py-3 pl-10 pr-4 text-sm text-slate-800 focus:outline-none focus:border-[#00AE64] transition-colors font-semibold"
                             />
                           </div>
                         </div>

                         <div className="space-y-1.5">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Email Address</label>
                           <div className="relative">
                             <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                             <input 
                               type="email" 
                               value={email}
                               onChange={(e) => setEmail(e.target.value)}
                               className="w-full bg-white border border-slate-200 rounded-lg py-3 pl-10 pr-4 text-sm text-slate-800 focus:outline-none focus:border-[#00AE64] transition-colors font-semibold"
                             />
                           </div>
                         </div>

                         <div className="space-y-1.5">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Phone Number</label>
                           <div className="relative">
                             <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                             <input 
                               type="tel" 
                               value={phoneNumber}
                               onChange={(e) => setPhoneNumber(e.target.value)}
                               className="w-full bg-white border border-slate-200 rounded-lg py-3 pl-10 pr-4 text-sm text-slate-800 focus:outline-none focus:border-[#00AE64] transition-colors font-semibold"
                             />
                           </div>
                         </div>
                       </div>
                     </div>

                     <button 
                       onClick={handleSaveProfile}
                       disabled={isSaving}
                       className="w-full bg-[#00AE64] hover:bg-emerald-600 text-white font-black py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-[#00AE64]/10"
                     >
                       {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save Changes"}
                     </button>
                  </motion.div>
                )}

                {activeTab === 'security' && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                     <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-150 rounded-xl">
                        <ShieldCheck className="w-8 h-8 text-blue-500 shrink-0" />
                        <div>
                          <p className="text-sm font-bold text-blue-800">Security Level: Strong</p>
                          <p className="text-xs text-blue-650">Your account is protected with Google Authentication.</p>
                        </div>
                     </div>

                     <h3 className="text-lg font-bold text-slate-800 mb-2">Change Password</h3>

                     <div className="space-y-4">
                       <div>
                         <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">Current Password</label>
                         <div className="relative">
                           <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                           <input 
                             type="password" 
                             value={currentPassword}
                             onChange={(e) => setCurrentPassword(e.target.value)}
                             placeholder="Enter current password"
                             className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 pl-10 pr-4 text-sm text-slate-800 focus:outline-none focus:border-[#00AE64] focus:ring-1 focus:ring-[#00AE64]"
                           />
                         </div>
                       </div>

                       <div>
                         <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">New Password</label>
                         <div className="relative">
                           <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                           <input 
                             type="password" 
                             value={newPassword}
                             onChange={(e) => setNewPassword(e.target.value)}
                             placeholder="Enter new password"
                             className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 pl-10 pr-4 text-sm text-slate-800 focus:outline-none focus:border-[#00AE64] focus:ring-1 focus:ring-[#00AE64]"
                           />
                         </div>
                       </div>
                     </div>

                     <button 
                       onClick={handleSaveSecurity}
                       disabled={isSaving || !currentPassword || !newPassword}
                       className="w-full mt-8 bg-[#00AE64] hover:bg-emerald-600 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                     >
                       {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Update Password"}
                     </button>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
