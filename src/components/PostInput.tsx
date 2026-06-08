/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
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
  FileImage,
  Upload
} from 'lucide-react';

export default function PostInput() {
  const { user, userProfile, db } = useFirebase();
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [showImageInput, setShowImageInput] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user || !userProfile) return null;

  const presetImages = [
    { name: 'Bull Market', url: 'https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=600&auto=format&fit=crop&q=60' },
    { name: 'Ethereum Glow', url: 'https://images.unsplash.com/photo-1622790694511-97cab97922c9?w=600&auto=format&fit=crop&q=60' },
    { name: 'Web3 Matrix', url: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=600&auto=format&fit=crop&q=60' },
    { name: 'Technical Chart', url: 'https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=600&auto=format&fit=crop&q=60' },
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          let width = img.width;
          let height = img.height;

          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.6);
          setImageUrl(compressedDataUrl);
          setShowImageInput(true);
        };
      };
      reader.readAsDataURL(file);
    }
  };

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
    <div className="bg-white border border-slate-200 rounded-xl p-4 mb-4 shadow-sm relative overflow-hidden">
      {/* Decorative background pulse for verified creators */}
      {userProfile.isVerified && (
        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
      )}

      <form onSubmit={handleCreatePost} className="space-y-4">
        <div className="flex gap-4 items-start">
          <div className="relative shrink-0">
            <div className="w-10 h-10 border border-slate-200 bg-slate-50 rounded-full overflow-hidden shadow-inner flex items-center justify-center">
              <img src={userProfile.avatar} alt="User Avatar" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
            </div>
            {userProfile.isVerified && (
              <span className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm flex items-center justify-center border border-slate-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 fill-emerald-500 text-white animate-pulse" />
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
              className="w-full text-xs text-slate-800 bg-transparent border-none focus:ring-0 focus:outline-none placeholder:text-slate-400 font-semibold resize-none leading-relaxed"
            />
            
            {/* Real-time character count progress */}
            <div className="flex items-center justify-between pt-1 text-[9px] text-slate-450 border-b border-slate-100 pb-2.5 font-semibold uppercase tracking-wider">
              <span className="flex items-center gap-1.5 align-middle">
                <Globe className="w-3.5 h-3.5 text-[#00AE64]" />
                Publik · Seluruh Komunitas
              </span>
              <span>{content.length}/400 karakter</span>
            </div>
          </div>
        </div>

        {/* Selected Image preview */}
        {imageUrl && (
          <div className="relative rounded-lg overflow-hidden border border-slate-200 bg-slate-50 flex justify-center items-center p-2">
            <img src={imageUrl} alt="Lampiran Postingan" className="max-w-full h-auto max-h-[350px] object-contain rounded" referrerPolicy="no-referrer" />
            <button
              type="button"
              onClick={() => setImageUrl('')}
              className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors cursor-pointer"
              title="Batalkan gambar"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded text-[9px] text-white font-extrabold uppercase tracking-wide border border-white/10">
              Preview Lampiran
            </div>
          </div>
        )}

        {/* Image Input Panel (Toggled) */}
        <input 
          type="file" 
          accept="image/*" 
          ref={fileInputRef} 
          onChange={handleFileUpload} 
          className="hidden" 
        />
        <AnimatePresence>
          {showImageInput && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden space-y-3 bg-slate-50 rounded-xl p-3 border border-slate-200"
            >
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-550 uppercase tracking-widest flex items-center gap-1.5">
                  <LinkIcon className="w-3 h-3 text-[#00AE64]" /> URL Gambar/Grafik Pasar
                </label>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="Masukkan URL foto (HTTPS), contoh: https://images.unsplash.com/..."
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-[#00AE64]/15 focus:border-[#00AE64] outline-none font-medium text-slate-800 transition-all bg-white"
                />
              </div>

              {/* Presets Choice */}
              <div className="space-y-1.5">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block font-sans">Atau pilih preset ilustrasi premium</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {presetImages.map((img) => (
                    <button
                      key={img.name}
                      type="button"
                      onClick={() => setImageUrl(img.url)}
                      className={`relative rounded-lg overflow-hidden border p-1 transition-all text-left bg-white select-none cursor-pointer ${
                        imageUrl === img.url ? 'border-[#00AE64] ring-2 ring-[#00AE64]/10 bg-emerald-50' : 'border-slate-200 hover:border-slate-350'
                      }`}
                    >
                      <div className="h-10 w-full rounded-md overflow-hidden bg-slate-50">
                        <img src={img.url} alt={img.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                      <span className="text-[9px] font-extrabold text-slate-650 block text-center mt-1 truncate">{img.name}</span>
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
              onClick={() => fileInputRef.current?.click()}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                imageUrl              
                  ? 'bg-emerald-50 text-[#00AE64] border border-emerald-500/20' 
                  : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <ImageIcon className="w-4 h-4 text-[#00AE64]" />
              {imageUrl ? "Ubah Gambar" : "Galeri/File"}
            </button>
            <button
              type="button"
              onClick={() => setShowImageInput(!showImageInput)}
              className={`flex items-center px-3.5 py-2.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                showImageInput 
                  ? 'bg-emerald-50 text-[#00AE64] border border-emerald-500/20' 
                  : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <LinkIcon className="w-4 h-4" />
            </button>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || (!content.trim() && !imageUrl.trim())}
            className="bg-[#00AE64] hover:bg-[#009656] disabled:opacity-40 text-white font-extrabold text-xs px-5 py-2.5 rounded-lg shadow-sm hover:shadow transition-all flex items-center gap-1.5 cursor-pointer disabled:bg-slate-100 disabled:text-slate-400"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Memposting...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-white" />
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
                ? 'bg-slate-900 border-emerald-500/30 text-emerald-400' 
                : 'bg-slate-900 border-rose-500/30 text-rose-400'
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
