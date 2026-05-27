import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useFirebase } from './FirebaseProvider';
import { updateProfile } from 'firebase/auth';
import { X, Camera, Mail, Phone, Lock, User, CheckCircle2, LogOut, Loader2, ShieldCheck } from 'lucide-react';

export default function ProfileModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { user, logout } = useFirebase();
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');
  
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [photoURL, setPhotoURL] = useState(user?.photoURL || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '+62 812-3456-7890');
  const [email, setEmail] = useState(user?.email || '');
  
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Security states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  if (!isOpen || !user) return null;

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      await updateProfile(user, {
        displayName,
        photoURL
      });
      // Mock saving phone/email
      await new Promise(r => setTimeout(r, 1000));
      
      setIsSaving(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (e) {
      console.error(e);
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
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-[#0A0E17] rounded-2xl shadow-2xl z-50 overflow-hidden border border-gray-800"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-800 bg-[#111827]">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <User className="text-[#00AE64]" />
                  Account Settings
                </h2>
                <p className="text-sm text-gray-400 mt-1">Manage your profile and security preferences</p>
              </div>
              <button onClick={onClose} className="p-2 text-gray-400 hover:text-white bg-gray-800 rounded-full hover:bg-gray-700 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col md:flex-row h-[500px]">
              {/* Sidebar */}
              <div className="w-full md:w-64 border-r border-gray-800 bg-[#111827]/50 p-4 flex flex-col justify-between">
                <div className="space-y-2">
                  <button 
                    onClick={() => setActiveTab('profile')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold ${activeTab === 'profile' ? 'bg-[#00AE64]/10 text-[#00AE64] border border-[#00AE64]/20' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
                  >
                    <User className="w-5 h-5" />
                    Personal Info
                  </button>
                  <button 
                    onClick={() => setActiveTab('security')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold ${activeTab === 'security' ? 'bg-[#00AE64]/10 text-[#00AE64] border border-[#00AE64]/20' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
                  >
                    <Lock className="w-5 h-5" />
                    Security
                  </button>
                </div>

                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-500 transition-all font-semibold mt-auto"
                >
                  <LogOut className="w-5 h-5" />
                  Sign Out
                </button>
              </div>

              {/* Content Area */}
              <div className="flex-1 p-8 overflow-y-auto relative no-scrollbar">
                
                <AnimatePresence>
                  {showSuccess && (
                     <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="absolute top-4 left-1/2 -translate-x-1/2 bg-[#00AE64] text-white px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 shadow-[0_0_20px_#00AE6450] z-10"
                     >
                       <CheckCircle2 className="w-4 h-4" /> Successfully Updated!
                     </motion.div>
                  )}
                </AnimatePresence>

                {activeTab === 'profile' && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                    <div className="flex flex-col items-center mb-8">
                      <div className="relative group">
                        <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-gray-800 bg-gray-900 flex items-center justify-center">
                          {photoURL ? (
                            <img src={photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <User className="w-10 h-10 text-gray-500" />
                          )}
                        </div>
                        <div className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                          <Camera className="w-6 h-6 text-white" />
                        </div>
                        <button className="absolute bottom-0 right-0 p-2 bg-[#00AE64] rounded-full text-white border-2 border-[#0A0E17] hover:scale-110 transition-transform">
                          <Camera className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-3 hover:text-[#00AE64] cursor-pointer">Change Image URL</p>
                       <input 
                          type="text" 
                          value={photoURL} 
                          onChange={(e) => setPhotoURL(e.target.value)}
                          placeholder="Image URL"
                          className="w-full max-w-[200px] mt-2 bg-gray-900 border border-gray-800 rounded p-1 text-xs text-center text-gray-300 focus:outline-none focus:border-[#00AE64]"
                        />
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1">Full Name</label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                          <input 
                            type="text" 
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            className="w-full bg-gray-900 border border-gray-800 rounded-lg py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-[#00AE64] focus:ring-1 focus:ring-[#00AE64]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1">Email Address</label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                          <input 
                            type="email" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-gray-900 border border-gray-800 rounded-lg py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-[#00AE64] focus:ring-1 focus:ring-[#00AE64]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1">Phone Number</label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                          <input 
                            type="tel" 
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            className="w-full bg-gray-900 border border-gray-800 rounded-lg py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-[#00AE64] focus:ring-1 focus:ring-[#00AE64]"
                          />
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={handleSaveProfile}
                      disabled={isSaving}
                      className="w-full mt-8 bg-[#00AE64] hover:bg-emerald-600 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                    >
                      {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save Changes"}
                    </button>
                  </motion.div>
                )}

                {activeTab === 'security' && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                    <div className="flex items-center gap-3 mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                       <ShieldCheck className="w-8 h-8 text-blue-500" />
                       <div>
                         <p className="text-sm font-bold text-white">Security Level: Strong</p>
                         <p className="text-xs text-gray-400">Your account is protected with Google Authentication.</p>
                       </div>
                    </div>

                    <h3 className="text-lg font-bold text-white mb-4">Change Password</h3>

                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1">Current Password</label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                          <input 
                            type="password" 
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            placeholder="Enter current password"
                            className="w-full bg-gray-900 border border-gray-800 rounded-lg py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-[#00AE64] focus:ring-1 focus:ring-[#00AE64]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1">New Password</label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                          <input 
                            type="password" 
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Enter new password"
                            className="w-full bg-gray-900 border border-gray-800 rounded-lg py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-[#00AE64] focus:ring-1 focus:ring-[#00AE64]"
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
