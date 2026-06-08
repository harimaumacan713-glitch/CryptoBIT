/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  Search, 
  MessageSquare, 
  Bell, 
  User, 
  ChevronDown, 
  ShieldCheck, 
  X, 
  Trash2, 
  Send, 
  CheckCheck, 
  ArrowLeft, 
  Inbox, 
  Loader2 
} from 'lucide-react';
import { useFirebase } from './FirebaseProvider';
import React, { useState, useMemo, useRef, useEffect } from 'react';
import ProfileModal from './ProfileModal';
import VerificationModal from './VerificationModal';
import { doc, updateDoc } from 'firebase/firestore';

interface HeaderProps {
  setActiveTab?: (tab: string) => void;
}

export default function Header({ setActiveTab }: HeaderProps) {
  const { 
    user, 
    userProfile, 
    db, 
    notifications, 
    chats, 
    sendChatMessage, 
    markNotificationAsRead, 
    markAllNotificationsAsRead 
  } = useFirebase();

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  
  // Custom panels states
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isChatsOpen, setIsChatsOpen] = useState(false);
  const [activeChatUid, setActiveChatUid] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [isSubmittingChat, setIsSubmittingChat] = useState(false);
  
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeChatUid, chats]);

  // Derived notification & chat stats
  const unreadNotifications = useMemo(() => {
    return notifications.filter(n => !n.isRead);
  }, [notifications]);

  const unreadChatsCount = useMemo(() => {
    if (!user) return 0;
    // Count messages addressed to us which are still unread
    return chats.filter(m => m.recipientUid === user.uid && !m.isRead).length;
  }, [chats, user]);

  // Group direct messages into conversation threads
  const conversationThreads = useMemo(() => {
    if (!user) return [];
    const threadsMap: Record<string, {
      contactUid: string;
      contactName: string;
      contactAvatar: string;
      messages: typeof chats;
      lastMessage: string;
      lastTimestamp: number;
      unreadCount: number;
    }> = {};

    chats.forEach((m) => {
      const isOurSent = m.senderUid === user.uid;
      const contactUid = isOurSent ? m.recipientUid : m.senderUid;
      const contactName = isOurSent ? m.recipientName : m.senderName;
      const contactAvatar = isOurSent ? m.recipientAvatar : m.senderAvatar;

      if (!threadsMap[contactUid]) {
        threadsMap[contactUid] = {
          contactUid,
          contactName,
          contactAvatar,
          messages: [],
          lastMessage: '',
          lastTimestamp: 0,
          unreadCount: 0
        };
      }

      threadsMap[contactUid].messages.push(m);
      threadsMap[contactUid].lastMessage = m.content;
      threadsMap[contactUid].lastTimestamp = m.createdAt;
      
      if (m.recipientUid === user.uid && !m.isRead) {
        threadsMap[contactUid].unreadCount += 1;
      }
    });

    return Object.values(threadsMap).sort((a, b) => b.lastTimestamp - a.lastTimestamp);
  }, [chats, user]);

  const activeThread = useMemo(() => {
    if (!activeChatUid || !user) return null;
    const threadMsgs = chats.filter(m => 
      (m.senderUid === user.uid && m.recipientUid === activeChatUid) ||
      (m.senderUid === activeChatUid && m.recipientUid === user.uid)
    );
    const firstOther = threadMsgs.find(m => m.senderUid !== user.uid);
    const fallbackName = firstOther ? firstOther.senderName : 'User';
    const fallbackAvatar = firstOther ? firstOther.senderAvatar : 'https://api.dicebear.com/7.x/pixel-art/svg?seed=default';

    return {
      contactUid: activeChatUid,
      contactName: fallbackName,
      contactAvatar: fallbackAvatar,
      messages: threadMsgs
    };
  }, [chats, activeChatUid, user]);

  // Mark messages in current thread as read
  useEffect(() => {
    if (!activeChatUid || !user || !chats.length) return;
    const unreadFromActive = chats.filter(m => m.senderUid === activeChatUid && m.recipientUid === user.uid && !m.isRead);
    unreadFromActive.forEach(async (m) => {
      try {
        const msgRef = doc(db, 'messages', m.id);
        await updateDoc(msgRef, { isRead: true });
      } catch (err) {
        console.error("Gagal menandai pesan chat sebagai dibaca", err);
      }
    });
  }, [activeChatUid, chats, user, db]);

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !activeChatUid || isSubmittingChat) return;

    setIsSubmittingChat(true);
    try {
      const activeContact = activeThread;
      if (activeContact) {
        await sendChatMessage(
          activeContact.contactUid,
          activeContact.contactName,
          activeContact.contactAvatar,
          chatInput.trim()
        );
        setChatInput('');
      }
    } catch (err) {
      console.error("Gagal mengirim pesan", err);
    } finally {
      setIsSubmittingChat(false);
    }
  };

  return (
    <header className="h-16 border-b border-slate-200 bg-white/95 backdrop-blur-md sticky top-0 z-50 text-slate-800 select-none shadow-sm">
      <ProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} onOpenVerification={() => { setIsProfileModalOpen(false); setIsVerificationModalOpen(true); }} />
      <VerificationModal isOpen={isVerificationModalOpen} onClose={() => setIsVerificationModalOpen(false)} />
      
      <div className="max-w-[1400px] mx-auto h-full px-4 flex items-center justify-between relative">
        <div className="flex items-center gap-6 flex-1">
          <div 
            onClick={() => { if (setActiveTab) setActiveTab('Markets'); }}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <div className="flex items-center gap-2">
              <svg viewBox="0 0 110 110" className="w-10 h-10 transform group-hover:scale-105 transition-all duration-300">
                <defs>
                  <linearGradient id="viaGradientHeader" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#1e3a8a" />
                    <stop offset="50%" stopColor="#2563eb" />
                    <stop offset="100%" stopColor="#06b6d4" />
                  </linearGradient>
                  <linearGradient id="iGradientHeader" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#06b6d4" />
                    <stop offset="100%" stopColor="#10b981" />
                  </linearGradient>
                </defs>
                
                {/* Big stylized "X" behind / below */}
                <path d="M35 55 L25 55 L42 85 L25 85 L35 85 L50 85 L65 85 L75 85 L58 85 L75 55 L65 55 Z" fill="none" />
                
                {/* Elegant 3D shaded X shape */}
                <path d="M32 82 L78 82 L60 52 L50 52 Z" fill="#e2e8f0" opacity="0.6" />
                <path d="M40 82 L70 82 L55 96 L45 96 Z" fill="#cbd5e1" />
                <path d="M25 82 L35 68 L50 90 L40 96 Z" fill="#f1f5f9" />
                <path d="M85 82 L75 68 L60 90 L70 96 Z" fill="#f1f5f9" />

                {/* V of VIA */}
                <path d="M12 25 L25 25 L35 52 L30 52 Z" fill="url(#viaGradientHeader)" />
                <path d="M25 25 L38 25 L45 52 L35 52 Z" fill="#2563eb" />
                
                {/* I of VIA */}
                <rect x="49" y="25" width="8" height="27" rx="1.5" fill="url(#iGradientHeader)" />
                
                {/* A of VIA */}
                <path d="M62 52 L70 25 L79 25 L88 52 L79 52 L77 43 L69 43 L67 52 Z M71 36 L75 36 L73 29 Z" fill="#64748b" />
              </svg>
              <span className="text-slate-950 font-black text-2xl tracking-tighter italic">VIA <span className="text-emerald-500">X</span></span>
            </div>
          </div>
          
          <div className="relative max-w-md w-full hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari emiten, koin, atau analis..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 pl-10 pr-4 text-sm text-slate-800 placeholder:text-slate-400 focus:ring-1 focus:ring-[#00AE64] focus:border-[#00AE64] outline-none transition-all"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          {userProfile?.isVerified ? (
            <button 
              onClick={() => setIsVerificationModalOpen(true)}
              className="hidden lg:flex items-center gap-1.5 border border-emerald-500/30 bg-emerald-50 text-[#00AE64] text-xs font-bold px-3.5 py-1.5 rounded-md hover:bg-emerald-100/50 transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Terverifikasi Pro
            </button>
          ) : (
            <button 
              onClick={() => setIsVerificationModalOpen(true)}
              className="hidden lg:flex items-center gap-1.5 border border-slate-200 text-slate-700 text-xs font-bold px-3.5 py-1.5 rounded-md hover:bg-slate-50 transition-colors cursor-pointer active:scale-95 duration-150"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Verifikasi Akun
            </button>
          )}
          
          <div className="flex items-center gap-1 sm:gap-2 border-l border-slate-200 pl-2 sm:pl-4 h-8 select-none">
            
            {/* --- REAL-TIME DIRECT MESSAGES (CHAT) TRIGGERS --- */}
            <div className="relative">
              <button 
                onClick={() => {
                  setIsChatsOpen(!isChatsOpen);
                  setIsNotificationsOpen(false);
                }}
                className={`p-1.5 sm:p-2 rounded-full transition-colors flex items-center justify-center cursor-pointer ${
                  isChatsOpen ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <MessageSquare className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
                {unreadChatsCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 sm:top-0.5 sm:right-0.5 bg-[#00AE64] text-white text-[9px] w-4.5 h-4 sm:w-5 sm:h-4 flex items-center justify-center rounded-full border border-white font-extrabold">
                    {unreadChatsCount}
                  </span>
                )}
              </button>

              {/* Chat Popover dropdown */}
              {isChatsOpen && (
                <div className="absolute right-[-80px] sm:right-0 mt-3 w-[310px] sm:w-[360px] bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden z-[999] flex flex-col max-h-[440px] text-slate-800">
                  <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {activeChatUid && (
                        <button 
                          onClick={() => setActiveChatUid(null)}
                          className="hover:text-slate-900 text-slate-605 p-1 rounded-full hover:bg-slate-200 transition-colors"
                        >
                          <ArrowLeft className="w-4 h-4" />
                        </button>
                      )}
                      <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">
                        {activeChatUid ? 'Pesan Langsung' : 'Kotak Obrolan'}
                      </h3>
                    </div>
                    <button 
                      onClick={() => setIsChatsOpen(false)}
                      className="text-slate-400 hover:text-slate-950 p-1 rounded-full hover:bg-slate-200"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Body */}
                  {activeChatUid ? (
                    /* ACTIVE CHAT SCREEN */
                    <div className="flex-1 flex flex-col bg-slate-50 h-[340px]">
                      {/* Contact Info Header */}
                      <div className="px-3.5 py-2.5 bg-white border-b border-slate-100 flex items-center gap-2">
                        <img 
                          src={activeThread?.contactAvatar} 
                          alt={activeThread?.contactName} 
                          className="w-7 h-7 rounded-full border border-slate-200 object-cover" 
                        />
                        <span className="font-extrabold text-xs text-slate-800 tracking-tight">{activeThread?.contactName}</span>
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 ml-auto" />
                      </div>

                      {/* Messages chain */}
                      <div className="flex-1 overflow-y-auto p-3.5 space-y-3 max-h-[230px]">
                        {activeThread?.messages.map((m) => {
                          const isMe = m.senderUid === user?.uid;
                          const formattedTime = new Date(m.createdAt).toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit'
                          });

                          return (
                            <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[80%] rounded-xl px-3 py-2 text-xs font-medium leading-relaxed shadow-sm ${
                                isMe 
                                  ? 'bg-[#00AE64] text-white rounded-tr-none' 
                                  : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                              }`}>
                                <p className="whitespace-pre-line">{m.content}</p>
                                <span className={`text-[8px] font-bold block text-right mt-1 ${isMe ? 'text-emerald-100' : 'text-slate-400'}`}>
                                  {formattedTime}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                        <div ref={chatBottomRef} />
                      </div>

                      {/* Reply Input Form */}
                      <form onSubmit={handleSendChatMessage} className="p-2 border-t border-slate-200 bg-white flex items-center gap-1.5">
                        <input
                          type="text"
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          placeholder="Ketik pesan..."
                          className="flex-1 bg-slate-50 text-xs text-slate-805 placeholder:text-slate-400 border border-slate-200 rounded-lg px-2.5 py-2 focus:outline-none focus:border-[#00AE64]"
                          maxLength={150}
                        />
                        <button
                          type="submit"
                          disabled={!chatInput.trim()}
                          className="p-2 bg-[#00AE64] hover:bg-[#009656] disabled:opacity-40 text-white rounded-lg transition-all cursor-pointer shadow shrink-0"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      </form>
                    </div>
                  ) : (
                    /* THREADS LIST SCREEN */
                    <div className="flex-1 overflow-y-auto divide-y divide-slate-100 max-h-[330px] min-h-[160px] bg-white">
                      {conversationThreads.length === 0 ? (
                        <div className="p-8 text-center text-slate-500 flex flex-col justify-center items-center gap-2">
                          <Inbox className="w-8 h-8 text-slate-300" />
                          <span className="text-xs font-extrabold uppercase tracking-widest text-slate-400">Inbox Kosong</span>
                          <p className="text-[10px] text-slate-450 max-w-[200px] leading-relaxed">
                            Pesan obrolan real-time akan tercatat di sini.
                          </p>
                        </div>
                      ) : (
                        conversationThreads.map((thread) => {
                          const lastDateStr = new Date(thread.lastTimestamp).toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit'
                          });

                          return (
                            <div 
                              key={thread.contactUid}
                              onClick={() => {
                                setActiveChatUid(thread.contactUid);
                              }}
                              className="p-3 flex items-center gap-3 hover:bg-slate-50 transition-all cursor-pointer select-none"
                            >
                              <div className="relative">
                                <img src={thread.contactAvatar} alt={thread.contactName} className="w-9 h-9 rounded-full border border-slate-200 shrink-0 object-cover bg-slate-100" />
                                {thread.unreadCount > 0 && (
                                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#00AE64] border border-white" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-0.5">
                                  <span className="font-extrabold text-[12px] text-slate-800 tracking-tight truncate">{thread.contactName}</span>
                                  <span className="text-[9px] font-bold text-slate-400 shrink-0">{lastDateStr}</span>
                                </div>
                                <p className={`text-[11px] truncate ${thread.unreadCount > 0 ? 'text-slate-900 font-extrabold' : 'text-slate-500 font-semibold'}`}>
                                  {thread.lastMessage}
                                </p>
                              </div>
                              {thread.unreadCount > 0 && (
                                <span className="bg-emerald-50 border border-emerald-100 text-[#00AE64] px-1.5 py-0.5 rounded-full text-[9px] font-black shrink-0">
                                  +{thread.unreadCount}
                                </span>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* --- NOTIFICATIONS (BELL) TRIGGERS --- */}
            <div className="relative">
              <button 
                onClick={() => {
                  setIsNotificationsOpen(!isNotificationsOpen);
                  setIsChatsOpen(false);
                }}
                className={`p-1.5 sm:p-2 rounded-full transition-colors flex items-center justify-center cursor-pointer ${
                  isNotificationsOpen ? 'bg-slate-100 text-slate-950' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-955'
                }`}
              >
                <Bell className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
                {unreadNotifications.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 sm:top-0.5 sm:right-0.5 bg-[#00AE64] text-white text-[9px] w-4.5 h-4 sm:w-5 sm:h-4 flex items-center justify-center rounded-full border border-white font-extrabold">
                    {unreadNotifications.length}
                  </span>
                )}
              </button>

              {/* Notifications Popover Dropdown */}
              {isNotificationsOpen && (
                <div className="absolute right-[-40px] sm:right-0 mt-3 w-[310px] sm:w-[350px] bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden z-[999] flex flex-col max-h-[440px] text-slate-800">
                  <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">
                      Notifikasi
                    </h3>
                    <div className="flex items-center gap-1.5">
                      {unreadNotifications.length > 0 && (
                        <button 
                          onClick={markAllNotificationsAsRead}
                          className="text-[9px] uppercase font-black bg-emerald-50 text-[#00AE64] hover:bg-emerald-100 px-2 py-1 rounded transition-colors text-right"
                        >
                          Selesai Semua
                        </button>
                      )}
                      <button 
                        onClick={() => setIsNotificationsOpen(false)}
                        className="text-slate-400 hover:text-slate-950 p-1 rounded-full hover:bg-slate-200"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Listing notifications from Firestore */}
                  <div className="overflow-y-auto divide-y divide-slate-100 max-h-[330px] min-h-[160px] bg-white">
                    {notifications.length === 0 ? (
                      <div className="p-10 text-center text-slate-400 flex flex-col justify-center items-center gap-2">
                        <Bell className="w-8 h-8 text-slate-300" />
                        <span className="text-xs font-extrabold uppercase tracking-widest text-slate-400">Belum Ada Pemberitahuan</span>
                        <p className="text-[10px] text-slate-450 max-w-[200px]">
                          Notifikasi aktivitas real-time akan muncul instan di panel ini.
                        </p>
                      </div>
                    ) : (
                      notifications.map((n) => {
                        const messageTimeStr = new Date(n.createdAt).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit'
                        });

                        return (
                          <div 
                            key={n.id}
                            onClick={() => {
                              markNotificationAsRead(n.id);
                              // Auto redirect to threads
                              if (n.type === 'comment' || n.type === 'message') {
                                setActiveChatUid(n.sender.uid);
                                setIsChatsOpen(true);
                                setIsNotificationsOpen(false);
                              }
                            }}
                            className={`p-3 flex items-start gap-2.5 transition-all cursor-pointer ${
                              n.isRead ? 'opacity-65 hover:bg-slate-50' : 'bg-slate-50 border-l-[3px] border-[#00AE64] hover:bg-slate-100'
                            }`}
                          >
                            <img src={n.sender.avatar} alt="Sender" className="w-7 h-7 rounded-full border border-slate-200 object-cover" />
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] text-slate-700 leading-normal font-medium">
                                <span className="font-extrabold text-slate-900">{n.sender.name}</span>{' '}
                                {n.message}
                              </p>
                              <span className="text-[8px] font-black text-slate-400 block mt-1">
                                {messageTimeStr}
                              </span>
                            </div>
                            {!n.isRead && (
                              <span className="w-1.5 h-1.5 bg-[#00AE64] rounded-full shrink-0 mt-2" />
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            <div 
              onClick={() => {
                if (user && setActiveTab) {
                  setActiveTab('Profile');
                }
              }}
              className="flex items-center gap-1 sm:gap-1.5 cursor-pointer p-1 sm:p-1.5 hover:bg-slate-100 rounded-md sm:ml-2 transition-colors text-slate-700"
            >
              <div className="w-6 h-6 sm:w-7 sm:h-7 bg-slate-100 rounded-full flex items-center justify-center overflow-hidden border border-slate-200">
                {user?.photoURL && user.photoURL !== "" ? (
                   <img src={user.photoURL} alt="User" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <User className="w-3.5 h-3.5 text-[#00AE64]" />
                )}
              </div>
              <div className="flex items-center gap-0.5 sm:gap-1">
                <span className="text-xs font-semibold text-slate-750 hidden sm:block">
                  {user?.displayName || 'Profile'}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
