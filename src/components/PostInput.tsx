/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useFirebase } from './FirebaseProvider';
import { collection, addDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Image as ImageIcon, 
  Link as LinkIcon, 
  CheckCircle2, 
  Loader2, 
  Sparkles, 
  X, 
  Globe,
  FileImage
} from 'lucide-react';

export default function PostInput() {
  const { user, userProfile, db } = useFirebase();
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [showImageInput, setShowImageInput] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  if (!user || !userProfile) return null;

  const presetImages = [
    { name: 'Bull Market', url: 'https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=600&auto=format&fit=crop&q=60' },
    { name: 'Ethereum Glow', url: 'https://images.unsplash.com/photo-1622790694511-97cab97922c9?w=600&auto=format&fit=crop&q=60' },
    { name: 'Web3 Matrix', url: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=600&auto=format&fit=crop&q=60' },
    { name: 'Technical Chart', url: 'https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=600&auto=format&fit=crop&q=60' },
  ];

  const triggerToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !imageUrl.trim()) {
      triggerToast('error', "Oops! Konten postingan atau lampiran gambar tidak boleh kosong.");
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'posts'), {
        author: {
          uid: user.uid,
          name: userProfile.username || 'User',
          username: userProfile.username || 'user',
          avatar: userProfile.avatar || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${user.uid}`,
          isVerified: userProfile.isVerified || false
        },
        content: content.trim(),
        imageUrl: imageUrl.trim() || null,
        timestamp: 'Baru saja',
        createdAt: Date.now(),
        likes: 0,
        comments: 0,
        shares: 0
      });

      setContent('');
      setImageUrl('');
      setShowImageInput(false);
      triggerToast('success', "Ide Anda sukses dipublikasikan di Web3 Stream!");
    } catch (err: any) {
      console.error("Failed to add post", err);
      triggerToast('error', `Gagal mengirim postingan: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5 shadow-sm relative overflow-hidden">
      {/* Decorative background pulse for verified creators */}
      {userProfile.isVerified && (
        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
      )}

      <form onSubmit={handleCreatePost} className="space-y-4">
        <div className="flex gap-4 items-start">
          <div className="relative shrink-0">
            <div className="w-11 h-11 border border-emerald-100 bg-gray-50 rounded-full overflow-hidden shadow-inner">
              <img src={userProfile.avatar} alt="User Avatar" referrerPolicy="no-referrer" />
            </div>
            {userProfile.isVerified && (
              <span className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-blue-500 fill-blue-500 text-white" />
              </span>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={userProfile.isVerified ? "Bagikan insight pasar Web3 eksklusif Anda... (Akun Terverifikasi)" : "Bagikan opini, analisis teknis, atau ide koin kustom Anda..."}
              maxLength={400}
              rows={2}
              className="w-full text-sm text-gray-800 bg-transparent border-none focus:ring-0 focus:outline-none placeholder:text-gray-400 font-medium resize-none leading-relaxed"
            />
            
            {/* Real-time character count progress */}
            <div className="flex items-center justify-between pt-1 text-[10px] text-gray-400 border-b border-gray-100 pb-3 font-semibold uppercase tracking-wider">
              <span className="flex items-center gap-1.5 align-middle">
                <Globe className="w-3.5 h-3.5 text-[#00AE64]" />
                Publik • Seluruh Komunitas
              </span>
              <span>{content.length}/400 karakter</span>
            </div>
          </div>
        </div>

        {/* Selected Image preview */}
        {imageUrl && (
          <div className="relative rounded-lg overflow-hidden border border-gray-200 bg-gray-50 max-h-[220px]">
            <img src={imageUrl} alt="Lampiran Postingan" className="w-full h-full object-cover max-h-[220px]" referrerPolicy="no-referrer" />
            <button
              type="button"
              onClick={() => setImageUrl('')}
              className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors cursor-pointer"
              title="Batalkan gambar"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            <div className="absolute bottom-2 left-2 bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded text-[9px] text-white font-extrabold uppercase tracking-wide">
              🌄 Preview Lampiran
            </div>
          </div>
        )}

        {/* Image Input Panel (Toggled) */}
        <AnimatePresence>
          {showImageInput && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden space-y-3 bg-gray-50/50 rounded-xl p-3.5 border border-gray-100"
            >
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest flex items-center gap-1.5">
                  <LinkIcon className="w-3 h-3 text-[#00AE64]" /> URL Gambar/Grafik Pasar
                </label>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="Masukkan URL foto (HTTPS), contoh: https://images.unsplash.com/..."
                  className="w-full border border-gray-200 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-[#00AE64]/15 focus:border-[#00AE64] outline-none font-medium text-gray-800 transition-all bg-white"
                />
              </div>

              {/* Presets Choice */}
              <div className="space-y-1.5">
                <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest block">Atau pilih preset ilustrasi premium</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {presetImages.map((img) => (
                    <button
                      key={img.name}
                      type="button"
                      onClick={() => setImageUrl(img.url)}
                      className={`relative rounded-lg overflow-hidden border p-1 transition-all text-left bg-white select-none cursor-pointer ${
                        imageUrl === img.url ? 'border-[#00AE64] ring-2 ring-[#00AE64]/10 bg-emerald-50/20' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="h-10 w-full rounded-md overflow-hidden bg-gray-100">
                        <img src={img.url} alt={img.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                      <span className="text-[9px] font-black text-gray-700 block text-center mt-1 truncate">{img.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Bar */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowImageInput(!showImageInput)}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                showImageInput || imageUrl 
                  ? 'bg-emerald-50 text-[#00AE64] border border-emerald-100' 
                  : 'bg-white text-gray-600 border border-gray-250 hover:bg-gray-50'
              }`}
            >
              <ImageIcon className="w-4 h-4 text-[#00AE64]" />
              {imageUrl ? "Ubah Gambar" : "Lampirkan Gambar"}
            </button>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || (!content.trim() && !imageUrl.trim())}
            className="bg-[#00AE64] hover:bg-[#009656] disabled:opacity-40 text-white font-extrabold text-xs px-5 py-3 rounded-lg shadow-sm hover:shadow transition-all flex items-center gap-1.5 cursor-pointer disabled:bg-gray-150 disabled:text-gray-400"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Memposting...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Publikasikan Insight</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Live Toast overlays inside PostInput */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            className={`fixed bottom-6 left-1/2 -translate-x-1/2 min-w-[300px] max-w-[90%] px-4.5 py-3 rounded-xl shadow-xl border text-xs font-bold z-[1000] flex items-center gap-2.5 ${
              toast.type === 'success' 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            <div className={`w-2 h-2 rounded-full shrink-0 ${toast.type === 'success' ? 'bg-[#00AE64]' : 'bg-rose-500'}`} />
            <span className="flex-1 leading-normal">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
