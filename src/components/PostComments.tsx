/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useFirebase } from './FirebaseProvider';
import { collection, onSnapshot, query, where, deleteDoc, doc } from 'firebase/firestore';
import { Comment, Post } from '../types';
import { Send, CheckCircle2, Loader2, MessageSquare, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PostCommentsProps {
  postId: string;
  postAuthor: {
    uid: string;
    name: string;
    username: string;
    avatar: string;
    isVerified?: boolean;
  };
  postContent: string;
}

export default function PostComments({ postId, postAuthor, postContent }: PostCommentsProps) {
  const { db, user, userProfile, addComment } = useFirebase();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'comments'), where('postId', '==', postId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          postId: data.postId,
          author: {
            uid: data.author?.uid || '',
            name: data.author?.name || 'User',
            avatar: data.author?.avatar || 'https://api.dicebear.com/7.x/pixel-art/svg?seed=default',
            isVerified: data.author?.isVerified || false
          },
          content: data.content || '',
          createdAt: data.createdAt || Date.now()
        } as Comment;
      }).sort((a, b) => a.createdAt - b.createdAt); // Order by older to newer
      setComments(list);
      setLoading(false);
    }, (error) => {
      console.error("Gagal mendengarkan komentar", error);
      setLoading(false);
    });

    return unsubscribe;
  }, [db, postId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await addComment(postId, postAuthor.uid, postContent, inputText.trim());
      setInputText('');
    } catch (err) {
      console.error("Gagal menambahkan komentar", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus komentar ini?")) return;
    try {
      await deleteDoc(doc(db, 'comments', commentId));
    } catch (err) {
      console.error("Gagal menghapus komentar", err);
    }
  };

  return (
    <div className="mt-4 pt-4 border-t border-slate-800/80 bg-[#090d16]/30 rounded-xl p-3 animate-fade-in">
      <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3.5 flex items-center gap-1.5">
        <MessageSquare className="w-3.5 h-3.5 text-[#00AE64]" />
        Komentar ({comments.length})
      </h4>

      {/* List Comments */}
      <div className="space-y-3 mb-4 max-h-[250px] overflow-y-auto no-scrollbar">
        {loading ? (
          <div className="py-4 flex justify-center items-center gap-2">
            <Loader2 className="w-4 h-4 text-[#00AE64] animate-spin" />
            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Memuat komentar...</span>
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-5 text-slate-500 font-semibold text-xs">
            Belum ada komentar untuk ide ini. Berikan dukungan pertama Anda!
          </div>
        ) : (
          <div className="space-y-3 pr-1">
            {comments.map((comment) => {
              const isCommentAuthor = user && comment.author.uid === user.uid;
              const formattedTime = new Date(comment.createdAt).toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div key={comment.id} className="flex gap-2.5 items-start p-2.5 rounded-lg bg-[#0e1220] border border-slate-900 hover:border-slate-800 transition-all">
                  <img 
                    src={comment.author.avatar} 
                    alt={comment.author.name} 
                    className="w-7 h-7 rounded-full border border-slate-800 bg-[#0c101b] shrink-0" 
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="font-extrabold text-[12px] text-slate-200 tracking-tight">{comment.author.name}</span>
                        {comment.author.isVerified && (
                          <CheckCircle2 className="w-3 h-3 text-emerald-500 fill-emerald-500/10 shrink-0" />
                        )}
                        <span className="text-slate-500 text-[9px] font-bold">· {formattedTime}</span>
                      </div>
                      {isCommentAuthor && (
                        <button 
                          onClick={() => handleDeleteComment(comment.id)}
                          className="text-slate-500 hover:text-rose-400 p-0.5 rounded transition-colors"
                          title="Hapus Komentar"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <p className="text-[12px] text-slate-300 font-medium leading-relaxed break-words whitespace-pre-line">
                      {comment.content}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add comment Form */}
      {user ? (
        <form onSubmit={handleSubmit} className="flex items-center gap-2 mt-3 p-1 bg-[#090c15] border border-slate-800 rounded-lg focus-within:border-[#00AE64] focus-within:ring-1 focus-within:ring-[#00AE64]/10 transition-all">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Tulis opini atau tanggapan Anda..."
            className="flex-1 bg-transparent border-none text-xs font-semibold text-slate-200 placeholder:text-slate-500 px-2 py-2 focus:outline-none focus:ring-0"
            maxLength={180}
            disabled={isSubmitting}
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isSubmitting}
            className="p-2 bg-[#00AE64] hover:bg-[#009656] disabled:bg-slate-800 disabled:opacity-40 text-white rounded-md transition-all cursor-pointer flex items-center justify-center shrink-0 shadow"
          >
            {isSubmitting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
          </button>
        </form>
      ) : (
        <div className="text-center py-2.5 text-xs text-slate-400 font-extrabold uppercase bg-slate-900/40 rounded-lg border border-slate-800">
          Silakan Login Terlebih Dahulu Untuk Memberikan Opini.
        </div>
      )}
    </div>
  );
}
