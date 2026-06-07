/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useFirebase } from './FirebaseProvider';
import { 
  GraduationCap, Users, PlusCircle, ArrowLeft, MessageSquare, Send, BookOpen, Clock, Loader2, ShieldCheck, ChevronRight, Pin, Volume2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, doc, updateDoc, arrayUnion, arrayRemove, getDocs, where } from 'firebase/firestore';
import LiveStream from './LiveStream';

interface JoinRequest {
  userId: string;
  userName: string;
  userAvatar?: string;
  requestedAt: number;
}

interface AcademyClass {
  id: string;
  name: string;
  description: string;
  hostId: string;
  hostName: string;
  hostAvatar?: string;
  members: string[];
  joinRequests?: JoinRequest[];
  isLive?: boolean;
  createdAt: any;
  pinnedQuestion?: {
    id: string;
    senderId: string;
    senderName: string;
    senderAvatar?: string;
    text: string;
    pinnedAt: number;
  } | null;
}

interface ClassMessage {
  id: string;
  classId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  text: string;
  createdAt: any;
}

export default function Academy() {
  const { user, userProfile, db } = useFirebase();
  const [activeTab, setActiveTab] = useState<'browse' | 'my_classes' | 'notifications'>('browse');
  const [classes, setClasses] = useState<AcademyClass[]>([]);
  const [selectedClass, setSelectedClass] = useState<AcademyClass | null>(null);
  const [messages, setMessages] = useState<ClassMessage[]>([]);

  // Q&A Pinned Question auto-TTS voice tracker
  const [lastSpokenPinId, setLastSpokenPinId] = useState<string | null>(null);

  useEffect(() => {
    if (selectedClass?.pinnedQuestion && selectedClass.pinnedQuestion.id !== lastSpokenPinId) {
      setLastSpokenPinId(selectedClass.pinnedQuestion.id);
      
      if ('speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
          const textToSpeak = `Siswa ${selectedClass.pinnedQuestion.senderName} bertanya: ${selectedClass.pinnedQuestion.text}`;
          const utterance = new SpeechSynthesisUtterance(textToSpeak);
          utterance.lang = 'id-ID';
          utterance.rate = 0.95;
          window.speechSynthesis.speak(utterance);
        } catch (e) {
          console.error("TTS failed:", e);
        }
      }
    }
  }, [selectedClass?.pinnedQuestion, lastSpokenPinId]);
  
  // Create Class Modal
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newClassDesc, setNewClassDesc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Chat
  const [chatInput, setChatInput] = useState('');

  useEffect(() => {
    if (!db) return;
    
    const q = query(collection(db, 'academy_classes'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const clsData: AcademyClass[] = [];
      snap.forEach(doc => {
        clsData.push({ id: doc.id, ...doc.data() } as AcademyClass);
      });
      setClasses(clsData);
      
      // Update selected class if it was modified
      if (selectedClass) {
        const updated = clsData.find(c => c.id === selectedClass.id);
        if (updated) setSelectedClass(updated);
      }
    });
    return () => unsub();
  }, [db, selectedClass?.id]);

  useEffect(() => {
    if (!selectedClass || !db) return;
    
    const qMsg = query(collection(db, 'class_messages'), where('classId', '==', selectedClass.id));
    const unsub = onSnapshot(qMsg, (snap) => {
      const msgData: ClassMessage[] = [];
      snap.forEach(doc => {
        msgData.push({ id: doc.id, ...doc.data() } as ClassMessage);
      });
      // Sort messages by createdAt locally to avoid requiring composite index
      msgData.sort((a, b) => {
        if (!a.createdAt || !b.createdAt) return 0;
        return a.createdAt.toMillis() - b.createdAt.toMillis();
      });
      setMessages(msgData);
    });
    
    return () => unsub();
  }, [selectedClass?.id, db]);

  // Chat Bot Simulation Logic (real-time student interactions)
  useEffect(() => {
    if (!selectedClass || !db || !user || messages.length === 0) return;

    const FIRST_NAMES = [
      "Diana", "Rian", "Linda", "Hendry", "Bella", "Kevin", "Citra", "Rizky", "Clarissa", "Tommy", 
      "Fiona", "Farhan", "Budi", "Andi", "Joko", "Hendra", "Agus", "Bambang", "Wahyu", "Dwi", 
      "Eko", "Irfan", "Ryan", "Bobby", "Daniel", "David", "Eric", "Ivan", "Ken", "Michael", 
      "Richard", "Steven", "Victor", "Yusuf", "Zacky", "Achmad", "Guntur", "Satria", "Bagus", "Doni", 
      "Fajar", "Gilang", "Ilham", "Jaka", "Kiki", "Lukman", "Naufal", "Oki", "Panji", "Radit", 
      "Sandi", "Tegar", "Wisnu", "Ronald", "Arya", "Gibran", "Kaesang", "Fadli", "Anis", "Astri", 
      "Cici", "Desi", "Elsa", "Giska", "Intan", "Keisya", "Laras", "Nadya", "Olivia", "Rachel",
      "Sherly", "Tiara", "Utami", "Vira", "Wendy", "Yulia", "Ziva", "Ayu", "Dewi", "Fitri",
      "Indah", "Mega", "Nanda", "Rini", "Sari", "Sri", "Wulan", "Yani", "Zara", "Chelsea",
      "Pevita", "Maudy", "Cinta", "Aurelia", "Anya", "Giselle", "Jehan", "Prilly", "Raline", "Tatjana",
      "Velove", "Yuki", "Luna", "Sonia", "Agnes", "Raisa", "Isyana", "Lyodra", "Arif", "Hafiz",
      "Taufiq", "Yasser", "Zaky"
    ];

    const LAST_NAMES = [
      "Putri", "Hidayat", "Wijaya", "Lim", "Anastasia", "Sanjaya", "Lestari", "Ramadhan", "Amanda", "Sugiharto",
      "Agatha", "Alfarizi", "Harianto", "Susilo", "Gunawan", "Setiawan", "Pamungkas", "Cahyo", "Prasetyo", "Anggara",
      "Nugraha", "Hakim", "Nasution", "Christian", "Setiadi", "Chandra", "Syahputra", "Sugianto", "Gozali", "Halim",
      "Irawan", "Subagja", "Alatas", "Fauzi", "Prabowo", "Mulia", "Permadi", "Kusuma", "Pratama", "Bhaskara",
      "Sembiring", "Hartono", "Saputra", "Nugroho", "Kurniawan", "Setya", "Wardhana", "Mahendra", "Alamsyah", "Hartanto",
      "Prasetya", "Nurhadi", "Basuki", "Sulastri", "Wulandari", "Rahmawati", "Mayori", "Aurelia", "Sekar", "Almira",
      "Marinka", "Stefanie", "Handayani", "Wandira", "Sartika", "Melati", "Permatasari", "Rizki", "Febriana", "Septiani",
      "Clarissa", "Devanty", "Nuraini", "Kartika", "Nabilla", "Angelica", "Safitri", "Adeline", "Christina", "Natalia",
      "Santoso", "Melinda", "Simanjuntak"
    ];

    const UNSPLASH_IDS = [
      "1544005313-94ddf0286df2", "1506794778202-cad84cf45f1d", "1438761681033-6461ffad8d80", "1500048993953-d23a436266cf", "1524504388940-b1c1722653e1",
      "1539571696357-5a69c17a67c6", "1488426862026-3ee34a7d66df", "1552058544-f2b08422138a", "1554151228-14d9def656e4", "1560250097-0b93528c311a",
      "1567532939604-b6b5b0db2604", "1519085360753-af0119f7cbe7", "1508214751196-bcfd4ca60f91", "1531746020798-e6953c6e8e04", "1501196354995-cbb51c65aaea",
      "1522075469751-3a6694fb2f61", "1542909168-82c3e7fdca5c", "1545167622-3a6ac756afa4", "1573496359142-b8d87734a5a2", "1580489944761-15a19d654956",
      "1519345182560-3f2917c472ef", "1492562080023-ab3db95bfbce", "1489980508314-941910ded1f4", "1531427186611-ecfd6d936c79", "1520156473014-b92420944cc1",
      "1531123897727-8f129e1688ce", "1513956589380-bad6acb9b9d4", "1534308983496-4fabb1a015ee", "1544725176-8837dbffcd7b", "1521119983730-e8b1d4d12ecd",
      "1509305711197-6a1a2a19a3a9", "1535713875002-d1d0cf377fde", "1527988936033-f43f29a29a4b", "1570295999919-56ceb5ecca61", "1566492031773-4f4e44671857",
      "1502441738521-cb3130072177", "1514416486-96a91d11a21e", "1528892951276-764c15302309", "1519345182560-3f2917c472ef", "1545167622-3a6ac756afa4",
      "1531427186611-ecfd6d936c79", "1520156473014-b92420944cc1", "1508214751196-bcfd4ca60f91", "1531123897727-8f129e1688ce", "1513956589380-bad6acb9b9d4",
      "1534308983496-4fabb1a015ee", "1544725176-8837dbffcd7b", "1521119983730-e8b1d4d12ecd", "1509305711197-6a1a2a19a3a9", "1535713875002-d1d0cf377fde",
      "1527988936033-f43f29a29a4b", "1570295999919-56ceb5ecca61", "1566492031773-4f4e44671857", "1531746020798-e6953c6e8e04", "1501196354995-cbb51c65aaea",
      "1545167622-3a6ac756afa4", "1573496359142-b8d87734a5a2", "1580489944761-15a19d654956", "1519345182560-3f2917c472ef", "1492562080023-ab3db95bfbce",
      "1489980508314-941910ded1f4", "1531427186611-ecfd6d936c79", "1520156473014-b92420944cc1", "1531123897727-8f129e1688ce", "1513956589380-bad6acb9b9d4",
      "1534308983496-4fabb1a015ee", "1544725176-8837dbffcd7b", "1521119983730-e8b1d4d12ecd", "1509305711197-6a1a2a19a3a9", "1535713875002-d1d0cf377fde",
      "1527988936033-f43f29a29a4b", "1570295999919-56ceb5ecca61", "1566492031773-4f4e44671857", "1531746020798-e6953c6e8e04", "1544005313-94ddf0286df2",
      "1506794778202-cad84cf45f1d", "1438761681033-6461ffad8d80", "1500048993953-d23a436266cf", "1524504388940-b1c1722653e1", "1539571696357-5a69c17a67c6",
      "1488426862026-3ee34a7d66df", "1552058544-f2b08422138a", "1554151228-14d9def656e4", "1560250097-0b93528c311a", "1567532939604-b6b5b0db2604",
      "1519085360753-af0119f7cbe7", "1508214751196-bcfd4ca60f91", "1531746020798-e6953c6e8e04", "1501196354995-cbb51c65aaea", "1522075469751-3a6694fb2f61",
      "1542909168-82c3e7fdca5c", "1545167622-3a6ac756afa4", "1573496359142-b8d87734a5a2", "1580489944761-15a19d654956", "1519345182560-3f2917c472ef",
      "1492562080023-ab3db95bfbce", "1489980508314-941910ded1f4", "1531427186611-ecfd6d936c79", "1520156473014-b92420944cc1", "1531123897727-8f129e1688ce"
    ];

    // Generate exactly 110+ distinct personas
    const BOT_PERSONAS = UNSPLASH_IDS.map((photoId, idx) => {
      const first = FIRST_NAMES[idx % FIRST_NAMES.length];
      const last = LAST_NAMES[idx % LAST_NAMES.length];
      return {
        id: `bot-student-${idx}`,
        name: `${first} ${last}`,
        avatar: `https://images.unsplash.com/photo-${photoId}?w=150&auto=format&fit=crop&q=80`
      };
    });

    const BOT_DUMMY_CHATTER = [
      'Izin bertanya mentor, bagaimana cara mengendalikan psikologis saat emosi loss berturut-turut?',
      'Berita rilis data ekonomi AS nanti malam kiranya dampaknya seberapa signifikan ya?',
      'Materi hari ini bener-bener berbobot, terima kasih banyak mentor penjelasannya.',
      'Saya masih sering bingung bedain mana fakeout sama breakout yang valid.',
      'Ada grup sharing watchlist berkala juga ga ya di akademi ini?',
      'Luar biasa, cara penyampaian materinya sangat mudah dicerna bahkan buat pemula.',
      'Sinyal Buy-nya tadi di harga berapa ya Koh?',
      'Apakah pola double bottom di chart BTC ini sudah valid?',
      'Bagaimana cara menentukan stop loss yang ideal saat market volatile seperti ini?',
      'Rekomendasi indikator terbaik selain RSI dan MACD apa ya Kak?',
      'Mending hold spot atau main futures dengan leverage kecil ya untuk pemula?',
      'Gimana cara baca orderbook biar tahu letak bandar pasang jaring?',
      'Wah mantap penjelasannya Coach! Sangat mencerahkan.',
      'Apakah berita inflasi AS malam ini bakal bikin market crash lagi?',
      'Kira-kira target profit berikutnya untuk coin Launchpad baru tadi di berapa?',
      'Maaf mau tanya, divergen bullish itu validnya di timeframe berapa saja?',
      'Ini live streaming-nya lancar banget, suara mentor juga jernih.',
      'Setuju sih, mending cicil beli pas koreksi daripada FOMO beli di pucuk.',
      'Cara ngitung risk-to-reward ratio 1:2 yang pas gimana ya?',
      'Pernah denger liquidity sweep, itu maksudnya gimana ya Koh?',
      'Analisa tadi pagi mantep banget, target resistance-nya hampir kena presisi.',
      'Ada sesi tanya jawab khusus nggak setelah penjelasan materi beres?',
      'Mau tanya dong, untuk dana dingin minimal pemula mending mulai di berapa rupiah ya?',
      'Pasar lagi sideways bosenin gini emang enaknya dengerin sharing ilmu kayak gini.',
      'Belajar trading mandiri pusing bgt, untung join kelas live begini dapet arahan langsung.',
      'Gokil mentor, dapet setup bullish harmonic tadi langsung dipraktekin.',
      'Materi yang ini ngebuka mata banget dah, pantesan sering kena stoploss hunter kemarin.',
      'Untung ikut live malam ini, gak sia-sia begadang.',
      'Terima kasih banyak Koh atas sharing portonya, menginspirasi sekali!',
      'Iya nih, dari kemarin bingung setting MA yang bener di TF kecil.',
      'Bener bgt, psikologi emang 80% dari kesuksesan trading.',
      'Mau nanya, ada rekomendasi buku trading buat pemula ga?',
      'Sangat edukatif, suka banget cara mentor nge-breakdown market structure secara detail.',
      'Akhirnya ngerti konsep orderblock sama liquidity sweep.',
      'Mohon ijin sruput ilmunya suhu!',
      'Mending scalping 5 menit atau swing trading ya kalau sambil kerja kantoran?',
      'Baru gabung langsung dapet ilmu daging semua nih, mantap!',
      'Sinyal buy-nya nunggu retest support dulu ya brarti?',
      'Semoga besok pagi dapet setup mantap dari watchlist malam ini.',
      'Keren bgt visual slide materinya, gampang dipahami pemula.',
      'Maju terus akademi ini, bener-bener komunitas paling suportif!'
    ];

    const getKeywordAnswer = (userMessage: string): string | null => {
      const text = userMessage.toLowerCase();
      if (text.includes('buy') || text.includes('sell') || text.includes('beli') || text.includes('jual')) {
        const answers = [
          'Saya biasanya nunggu konfirmasi RSI dulu baru berani nembak buy/sell sih.',
          'Betul, manajemen risiko pas buy itu krusial bgt biar ga kejebak bull trap.',
          'Tadi ada yang buy di support bawah ga? Selamat ya yg dapet barang murah haha.',
          'Iya, mending cicil buy bertahap daripada langsung all-in sekali klik.'
        ];
        return answers[Math.floor(Math.random() * answers.length)];
      }
      if (text.includes('saham') || text.includes('crypto') || text.includes('btc') || text.includes('coin')) {
        const answers = [
          'Market crypto emang volatilitasnya luar biasa, cocok buat scalping cepat.',
          'Kalo saham mending fokus yang bluechip dulu ga sih buat pemula?',
          'Kemarin BTC sempat kena liquid sweep, untung stop loss sudah aman terpasang.',
          'Koin di bursa luar emang geraknya ngeri-ngeri sedap buat swing trading.'
        ];
        return answers[Math.floor(Math.random() * answers.length)];
      }
      if (text.includes('indikator') || text.includes('ema') || text.includes('rsi') || text.includes('macd') || text.includes('chart') || text.includes('fibo')) {
        const answers = [
          'EMA 20 sama EMA 50 emang combo maut buat tau arah tren utama.',
          'RSI kalau udah overbought di 4H mendingan wait and see dulu jangan fomo.',
          'Siap mentor, nanti saya coba praktekkan ditarik garis Fibonacci-nya.',
          'Trading visual pakai harmonic pattern juga lumayan akurat sih kalau di TF besar.'
        ];
        return answers[Math.floor(Math.random() * answers.length)];
      }
      if (text.includes('halo') || text.includes('sore') || text.includes('siang') || text.includes('malam') || text.includes('pagi') || text.includes('salam')) {
        const answers = [
          'Halo Kak! Salam kenal ya, siap belajar bareng di akademi ini.',
          'Halo rekan-rekan trader, salam profit dan selamat belajar!',
          'Salam kenal kak, mohon bimbingannya ya dari para senior di sini.',
          'Selamat bergabung rekan-rekan, mari kita serap ilmunya malam ini.'
        ];
        return answers[Math.floor(Math.random() * answers.length)];
      }
      return null;
    };

    const lastMsg = messages[messages.length - 1];
    if (!lastMsg) return;

    // RULE 1: AUTO-REPLY TO CONTEXTUAL USER MESSAGE
    const isLastMsgBot = lastMsg.senderId.startsWith('bot-');
    const isLastMsgMine = lastMsg.senderId === user.uid;

    if (!isLastMsgBot && isLastMsgMine) {
      // 55% probability to trigger an automatic student reply to make it feel natural (jangan spam)
      const shouldReply = Math.random() < 0.55;
      if (shouldReply) {
        const timer = setTimeout(async () => {
          const randomBot = BOT_PERSONAS[Math.floor(Math.random() * BOT_PERSONAS.length)];
          const keywordReply = getKeywordAnswer(lastMsg.text);
          const replyText = keywordReply || BOT_DUMMY_CHATTER[Math.floor(Math.random() * BOT_DUMMY_CHATTER.length)];

          try {
            await addDoc(collection(db, 'class_messages'), {
              classId: selectedClass.id,
              senderId: randomBot.id,
              senderName: randomBot.name,
              senderAvatar: randomBot.avatar,
              text: replyText,
              createdAt: serverTimestamp()
            });
          } catch (err) {
            console.error('Failed to post bot response:', err);
          }
        }, 3000 + Math.random() * 4000); // 3-7 seconds delay

        return () => clearTimeout(timer);
      }
    }

    // RULE 2: PERIODIC IDLE CLASS CHATTER
    // Runs for the host or the first member in list
    const isCurrentUserMentor = selectedClass.hostId === user.uid;
    const isFirstMember = selectedClass.members && selectedClass.members[0] === user.uid;
    
    if (isCurrentUserMentor || isFirstMember) {
      const intervalTimer = setInterval(async () => {
        // Only trigger if idle for 12 seconds to make it more interactive but realistic
        const now = Date.now();
        const lastMsgTime = lastMsg.createdAt?.toMillis ? lastMsg.createdAt.toMillis() : now;
        if (now - lastMsgTime < 12000) return;

        const randomBot = BOT_PERSONAS[Math.floor(Math.random() * BOT_PERSONAS.length)];
        const chatter = BOT_DUMMY_CHATTER[Math.floor(Math.random() * BOT_DUMMY_CHATTER.length)];

        try {
          await addDoc(collection(db, 'class_messages'), {
            classId: selectedClass.id,
            senderId: randomBot.id,
            senderName: randomBot.name,
            senderAvatar: randomBot.avatar,
            text: chatter,
            createdAt: serverTimestamp()
          });
        } catch (err) {
          console.error('Failed to post periodic bot message:', err);
        }
      }, 18000 + Math.random() * 15000); // Between 18 and 33 seconds to maintain high interaction but keep it clean

      return () => clearInterval(intervalTimer);
    }
  }, [selectedClass?.id, db, user, messages.length]);

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !userProfile || !newClassName.trim() || !newClassDesc.trim()) return;
    
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'academy_classes'), {
        name: newClassName.trim(),
        description: newClassDesc.trim(),
        hostId: user.uid,
        hostName: userProfile.username || 'Anonymous Instructor',
        hostAvatar: userProfile.avatar || '',
        members: [user.uid],
        createdAt: serverTimestamp()
      });
      setIsCreatingSession(false);
      setNewClassName('');
      setNewClassDesc('');
    } catch (err: any) {
      alert("Gagal membuat kelas: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoinClass = async (cls: AcademyClass) => {
    if (!user || !userProfile) {
      alert("Silakan masuk terlebih dahulu!");
      return;
    }
    
    // Check if already requested to prevent spam
    if (cls.joinRequests?.some(r => r.userId === user.uid)) {
      alert("Anda sudah mengirimkan permintaan bergabung. Harap tunggu persetujuan mentor.");
      return;
    }

    try {
      const classRef = doc(db, 'academy_classes', cls.id);
      const newRequest: JoinRequest = {
        userId: user.uid,
        userName: userProfile.username || 'Trader',
        userAvatar: userProfile.avatar || '',
        requestedAt: Date.now()
      };

      await updateDoc(classRef, {
        joinRequests: arrayUnion(newRequest)
      });
      alert("Permintaan bergabung telah dikirim ke mentor kelas.");
    } catch (err: any) {
      console.error(err);
      alert("Gagal mengirim permintaan.");
    }
  };

  const handleApproveRequest = async (classId: string, request: JoinRequest) => {
    try {
      const classRef = doc(db, 'academy_classes', classId);
      await updateDoc(classRef, {
        joinRequests: arrayRemove(request),
        members: arrayUnion(request.userId)
      });
    } catch (err: any) {
      console.error(err);
      alert("Gagal menyetujui permintaan.");
    }
  };

  const handleRejectRequest = async (classId: string, request: JoinRequest) => {
    try {
      const classRef = doc(db, 'academy_classes', classId);
      await updateDoc(classRef, {
        joinRequests: arrayRemove(request)
      });
    } catch (err: any) {
      console.error(err);
      alert("Gagal menolak permintaan.");
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !userProfile || !selectedClass || !chatInput.trim()) return;
    
    const text = chatInput.trim();
    setChatInput('');
    
    try {
      await addDoc(collection(db, 'class_messages'), {
        classId: selectedClass.id,
        senderId: user.uid,
        senderName: userProfile.username || 'Student',
        senderAvatar: userProfile.avatar || '',
        text: text,
        createdAt: serverTimestamp()
      });
    } catch (err) {
      console.error(err);
    }
  };

  // If viewing a class
  if (selectedClass) {
    const isMember = user && selectedClass.members.includes(user.uid);
    const isHost = user && selectedClass.hostId === user.uid;

    return (
      <div className="max-w-7xl mx-auto mt-4 space-y-6 pb-10 flex flex-col h-[85vh]">
        {/* Class Header */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 md:p-6 shadow-sm flex-shrink-0 text-slate-800">
          <button 
            onClick={() => setSelectedClass(null)}
            className="text-slate-500 hover:text-slate-900 flex items-center gap-1 text-xs font-bold mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar Kelas
          </button>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5 text-indigo-600">
                <BookOpen className="w-5 h-5 fill-current" />
                <span className="font-extrabold text-[10px] tracking-widest uppercase bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded border border-indigo-100">Live Class</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900">{selectedClass.name}</h1>
              <p className="text-slate-600 text-sm mt-1">{selectedClass.description}</p>
              
              {isHost && !selectedClass.isLive && (
                 <button 
                   onClick={async () => {
                     try {
                         await updateDoc(doc(db, 'academy_classes', selectedClass.id), { isLive: true });
                     } catch (err) {
                         console.error(err);
                     }
                   }}
                   className="mt-4 bg-red-650 hover:bg-red-600 text-white text-xs font-bold py-2 px-4 rounded animate-pulse"
                 >
                    Mulai Siaran Live Video
                 </button>
              )}
            </div>

            <div className="flex flex-col md:items-end gap-3">
              <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-lg text-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden shrink-0 border border-slate-300">
                    {selectedClass.hostAvatar ? (
                      <img src={selectedClass.hostAvatar} alt="Instructor" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-500 font-bold text-xs">
                        {selectedClass.hostName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-500 block">Mentor Kelas</span>
                    <span className="text-slate-800 font-bold text-xs">{selectedClass.hostName}</span>
                  </div>
                </div>
                <div className="w-[1px] h-8 bg-slate-200 mx-1" />
                <div className="text-right flex items-center gap-1.5 text-slate-600">
                  <Users className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold text-sm">{selectedClass.members.length}</span>
                </div>
              </div>
              
              {!isMember && (
                <button 
                  onClick={() => handleJoinClass(selectedClass)}
                  disabled={selectedClass.joinRequests?.some(r => r.userId === user?.uid)}
                  className={`font-extrabold py-2 px-6 rounded-lg text-sm w-full md:w-auto transition-colors ${
                    selectedClass.joinRequests?.some(r => r.userId === user?.uid)
                      ? 'bg-amber-500/10 text-amber-600 border border-amber-500/50 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                  }`}
                >
                  {selectedClass.joinRequests?.some(r => r.userId === user?.uid) ? 'Menunggu Persetujuan' : 'Bergabung ke Kelas'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Classroom Area */}
        {isMember ? (
          <div className="flex-1 flex flex-col md:flex-row gap-4 h-[calc(100vh-250px)]">
            
            {/* Live Stream Section */}
            {selectedClass.isLive && (
               <div className="flex-[2] flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-h-[300px]">
                   <div className="bg-slate-50 p-3 border-b border-slate-200 flex items-center justify-between gap-2">
                       <span className="text-xs font-bold text-slate-700 uppercase tracking-widest flex items-center gap-2">
                           <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div> Live Siaran
                       </span>
                       {isHost && (
                           <button 
                               onClick={async () => {
                                 await updateDoc(doc(db, 'academy_classes', selectedClass.id), { isLive: false });
                               }}
                               className="text-xs text-red-600 hover:text-red-500 font-bold"
                           >
                               Akhiri Siaran
                           </button>
                       )}
                   </div>
                   <div className="flex-1 p-4 overflow-y-auto">
                       <LiveStream classId={selectedClass.id} isHost={isHost} />
                   </div>
               </div>
            )}

            {/* Chat Section */}
            <div className={`${selectedClass.isLive ? 'flex-1' : 'flex-1'} bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col`}>
              <div className="bg-slate-50 p-3 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-slate-500" />
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-widest">Diskusi Ruang Kelas</span>
                </div>
                <div className="flex items-center gap-1.5 bg-indigo-50 text-indigo-600 text-[10px] font-extrabold px-2 py-0.5 rounded border border-indigo-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
                  Siswa Komunitas Aktif
                </div>
              </div>

              {/* Pinned Question Banner */}
              {selectedClass.pinnedQuestion && (
                <div className="bg-[#fff9e6] border-b border-amber-200 p-3.5 relative overflow-hidden shadow-sm animate-fadeIn flex flex-col gap-2.5 shrink-0">
                  <div className="absolute top-0 right-0 p-1 bg-amber-400 text-slate-900 font-black text-[9px] uppercase tracking-wider rounded-bl leading-none">
                    PERTANYAAN DISEMATKAN
                  </div>
                  
                  <div className="flex items-start gap-2.5">
                    <Pin className="w-4 h-4 text-amber-500 shrink-0 mt-0.5 animate-pulse" />
                    <div className="flex-1 min-w-0 pr-16 bg-transparent">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-xs font-extrabold text-slate-700">{selectedClass.pinnedQuestion.senderName}</span>
                        <span className="text-[10px] text-slate-500">bertanya:</span>
                      </div>
                      <p className="text-xs font-bold text-slate-900 leading-relaxed break-words">
                        "{selectedClass.pinnedQuestion.text}"
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 border-t border-amber-100 pt-2 bg-transparent">
                    <button
                      type="button"
                      onClick={() => {
                        if ('speechSynthesis' in window && selectedClass.pinnedQuestion) {
                          try {
                            window.speechSynthesis.cancel();
                            const utterance = new SpeechSynthesisUtterance(selectedClass.pinnedQuestion.text);
                            utterance.lang = 'id-ID';
                            utterance.rate = 0.95;
                            window.speechSynthesis.speak(utterance);
                          } catch (err) {
                            console.error(err);
                          }
                        }
                      }}
                      className="text-[10px] text-amber-600 hover:text-amber-700 font-extrabold flex items-center gap-1.5 transition-colors bg-transparent border-none cursor-pointer"
                    >
                      <Volume2 className="w-3.5 h-3.5 animate-pulse" />
                      <span>Dengarkan Ulang (TTS)</span>
                    </button>

                    {isHost && (
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await updateDoc(doc(db, 'academy_classes', selectedClass.id), {
                              pinnedQuestion: null
                            });
                          } catch (err) {
                            console.error(err);
                          }
                        }}
                        className="text-[10px] text-rose-600 hover:text-rose-700 font-bold transition-colors bg-transparent border-none cursor-pointer"
                      >
                        Lepas Sematan
                      </button>
                    )}
                  </div>
                </div>
              )}
              
              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-60">
                  <BookOpen className="w-12 h-12 text-slate-400 mb-3" />
                  <p className="text-slate-500 text-sm font-semibold mb-1">Belum ada diskusi di kelas ini.</p>
                  <p className="text-slate-400 text-xs">Jadilah yang pertama untuk menyapa!</p>
                </div>
              ) : (
                messages.map(msg => {
                  const isCurrent = user && msg.senderId === user.uid;
                  const msgDate = msg.createdAt ? new Date(msg.createdAt.toDate()) : new Date();
                  
                  return (
                     <div key={msg.id} className={`flex ${isCurrent ? 'justify-end' : 'justify-start'} gap-3 max-w-full`}>
                       {!isCurrent && (
                         <div className="w-8 h-8 rounded-full bg-slate-200 shrink-0 overflow-hidden border border-slate-300">
                           {msg.senderAvatar ? (
                              <img src={msg.senderAvatar} alt={msg.senderName} className="w-full h-full object-cover" />
                           ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-500 font-bold text-xs bg-slate-100">
                                {msg.senderName.charAt(0).toUpperCase()}
                              </div>
                           )}
                         </div>
                       )}
                       
                       <div className={`flex flex-col ${isCurrent ? 'items-end' : 'items-start'} max-w-[75%]`}>
                         <div className="flex items-center gap-2 mb-1">
                           <span className="text-[10px] font-bold text-slate-500">{msg.senderName}</span>
                           {selectedClass.hostId === msg.senderId && (
                             <span className="bg-indigo-100 text-indigo-600 text-[9px] px-1.5 py-0.5 rounded font-black uppercase">Mentor</span>
                           )}
                           <span className="text-[9px] text-slate-400">{msgDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                         </div>
                         <div className={`p-3 rounded-2xl text-sm ${
                           isCurrent 
                             ? 'bg-indigo-600 text-white rounded-br-none' 
                             : 'bg-slate-150 text-slate-800 rounded-tl-none border border-slate-200'
                         }`}>
                           {msg.text}
                         </div>
                       </div>
                     </div>
                  );
                })
              )}
            </div>

            {/* Chat Input */}
            <div className="bg-slate-50 p-4 border-t border-slate-205">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input 
                  type="text" 
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ketik pesan untuk diskusi kelas..."
                  className="flex-grow bg-white border border-slate-300 rounded-lg px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-400"
                />
                <button 
                  type="submit"
                  disabled={!chatInput.trim()}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white p-3 rounded-lg flex items-center justify-center transition-colors"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>
          </div>
          </div>
        ) : (
          <div className="flex-1 bg-white rounded-xl border border-slate-202 p-8 flex flex-col items-center justify-center text-center shadow-sm">
             <ShieldCheck className="w-16 h-16 text-slate-400 mb-4" />
             <h3 className="text-xl font-bold text-slate-800 mb-2">Akses Terbatas: Anggota Kelas Saja</h3>
             <p className="text-slate-500 text-sm max-w-md mb-6">Anda harus bergabung menjadi anggota kelas ini terlebih dahulu untuk melihat diskusi materi, anggota lain, dan belajar bersama.</p>
             <button 
               onClick={() => handleJoinClass(selectedClass)}
               disabled={selectedClass.joinRequests?.some(r => r.userId === user?.uid)}
               className={`font-extrabold py-3 px-8 rounded-lg shadow-md transition-colors ${
                 selectedClass.joinRequests?.some(r => r.userId === user?.uid)
                   ? 'bg-amber-500/10 text-amber-600 border border-amber-500/50 cursor-not-allowed shadow-none'
                   : 'bg-[#00AE64] hover:bg-emerald-600 text-white shadow-[#00AE64]/10'
               }`}
             >
               {selectedClass.joinRequests?.some(r => r.userId === user?.uid) ? 'Menunggu Persetujuan Mentor' : 'Bergabung Sekarang'}
             </button>
          </div>
        )}
      </div>
    );
  }

  // Browse View
  const myClasses = classes.filter(c => user && c.members.includes(user.uid));
  const publicClasses = classes.filter(c => !user || (!c.members.includes(user.uid) && c.hostId !== user.uid));
  const hostedClasses = classes.filter(c => user && c.hostId === user.uid);
  const totalPendingRequests = hostedClasses.reduce((sum, c) => sum + (c.joinRequests?.length || 0), 0);

  return (
    <div className="max-w-7xl mx-auto mt-4 space-y-6 pb-10">
      {/* Platform Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-[#00AE64]">
            <GraduationCap className="w-5 h-5 fill-current" />
            <span className="font-extrabold text-[10px] tracking-widest uppercase bg-[#00AE64]/10 px-2 py-0.5 rounded border border-[#00AE64]/20">Academy Hub</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black italic tracking-tighter text-slate-900 mt-1">USER-GENERATED LEARNING</h1>
          <p className="text-slate-600 text-xs md:text-sm">Bangun ekosistem belajar bersama, jadilah mentor, atau gabung kelas trader lain dari seluruh dunia.</p>
        </div>

        <button 
          onClick={() => {
            if (!user) alert("Masuk terlebih dahulu untuk membuat kelas!");
            else setIsCreatingSession(true);
          }}
          className="bg-[#00AE64] hover:bg-emerald-600 text-white font-extrabold px-5 py-3 rounded-xl flex items-center justify-center gap-2 text-sm shadow-lg shadow-[#00AE64]/10 transition-colors"
        >
          <PlusCircle className="w-5 h-5" />
          Buat Kelas Baru
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-slate-200 overflow-x-auto pb-1">
        <button 
          onClick={() => setActiveTab('browse')}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors px-2 shrink-0 ${activeTab === 'browse' ? 'border-[#00AE64] text-slate-900' : 'border-transparent text-slate-550 hover:text-slate-800'}`}
        >
          Jelajahi Kelas Publik
        </button>
        {user && (
          <button 
            onClick={() => setActiveTab('my_classes')}
            className={`pb-3 text-sm font-bold border-b-2 transition-colors px-2 shrink-0 ${activeTab === 'my_classes' ? 'border-[#00AE64] text-slate-900' : 'border-transparent text-slate-550 hover:text-slate-800'}`}
          >
            Kelas Saya ({myClasses.length})
          </button>
        )}
        {user && (
          <button 
            onClick={() => setActiveTab('notifications')}
            className={`pb-3 text-sm font-bold border-b-2 transition-colors px-2 shrink-0 flex items-center gap-2 ${activeTab === 'notifications' ? 'border-[#00AE64] text-slate-900' : 'border-transparent text-slate-550 hover:text-slate-800'}`}
          >
            Notifikasi Mentor
            {totalPendingRequests > 0 && (
              <span className="bg-amber-550 text-amber-900 text-[10px] px-1.5 py-0.5 rounded-full font-bold">{totalPendingRequests}</span>
            )}
          </button>
        )}
      </div>

      {/* Class/Notification List */}
      {activeTab === 'notifications' ? (
        <div className="space-y-4">
          {hostedClasses.map(cls => 
            cls.joinRequests?.map(req => (
              <div key={`${cls.id}-${req.userId}`} className="bg-white shadow-sm border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden shrink-0 border border-slate-300">
                    {req.userAvatar ? (
                      <img src={req.userAvatar} alt={req.userName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-500 font-bold text-sm">
                        {req.userName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="text-slate-800 text-sm">
                      <span className="font-bold">{req.userName}</span> <span className="text-slate-500">meminta bergabung ke kelas</span> <span className="text-indigo-650 font-bold">{cls.name}</span>
                    </h4>
                    <div className="flex items-center gap-1.5 text-slate-400 text-[10px] mt-1 font-mono">
                      <Clock className="w-3 h-3" />
                      {new Date(req.requestedAt).toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <button onClick={() => handleApproveRequest(cls.id, req)} className="flex-1 sm:flex-none bg-[#00AE64] hover:bg-emerald-600 text-white text-xs font-bold py-2 px-5 rounded-lg transition-colors shadow-lg shadow-[#00AE64]/10">Setujui</button>
                  <button onClick={() => handleRejectRequest(cls.id, req)} className="flex-1 sm:flex-none bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 text-xs font-bold py-2 px-5 rounded-lg transition-colors border border-rose-500/20">Tolak</button>
                </div>
              </div>
            ))
          )}
          {totalPendingRequests === 0 && (
            <div className="py-16 flex flex-col items-center justify-center text-center opacity-60">
              <ShieldCheck className="w-12 h-12 text-slate-300 mb-3" />
              <p className="text-slate-500 text-sm font-semibold mb-1">Tidak ada notifikasi</p>
              <p className="text-slate-400 text-xs">Belum ada permintaan masuk ke kelas Anda.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {(activeTab === 'browse' ? publicClasses : myClasses).map(cls => (
            <div 
              key={cls.id}
              onClick={() => setSelectedClass(cls)}
              className="bg-white rounded-xl border border-slate-202 p-5 hover:border-slate-400 hover:-translate-y-1 transition-all cursor-pointer shadow-sm group flex flex-col h-full animate-fade-in"
            >
              <div className="flex items-start justify-between mb-3 truncate gap-3">
                <h3 className="font-extrabold text-slate-800 text-lg truncate group-hover:text-indigo-650 transition-colors">{cls.name}</h3>
                <div className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1.5 shrink-0 border border-slate-200">
                  <Users className="w-3 h-3 text-emerald-600" />
                  {cls.members.length}
                </div>
              </div>
              
              <p className="text-slate-600 text-xs leading-relaxed line-clamp-3 mb-4 flex-1">
                {cls.description}
              </p>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-slate-200 shrink-0 overflow-hidden border border-slate-300">
                    {cls.hostAvatar ? (
                       <img src={cls.hostAvatar} alt={cls.hostName} className="w-full h-full object-cover" />
                    ) : (
                       <div className="w-full h-full flex items-center justify-center text-slate-500 font-bold text-[10px]">
                         {cls.hostName.charAt(0).toUpperCase()}
                       </div>
                    )}
                  </div>
                  <span className="text-[10px] font-bold text-slate-700 truncate max-w-[100px]">{cls.hostName}</span>
                </div>

                <div className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">
                  Masuk Kelas <ChevronRight className="w-3 h-3" />
                </div>
              </div>
            </div>
          ))}

          {(activeTab === 'browse' ? publicClasses : myClasses).length === 0 && (
            <div className="col-span-full py-16 flex flex-col items-center justify-center text-center opacity-60">
              <BookOpen className="w-12 h-12 text-slate-300 mb-3" />
              <p className="text-slate-500 text-sm font-semibold mb-1">
                {activeTab === 'browse' ? 'Belum ada kelas publik yang tersedia.' : 'Anda belum bergabung dengan kelas apa pun.'}
              </p>
              <p className="text-slate-400 text-xs">Jadilah mentor dan buat kelas pertama Anda!</p>
            </div>
          )}
        </div>
      )}

      {/* Create Class Modal */}
      <AnimatePresence>
        {isCreatingSession && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl border border-slate-200 shadow-2xl overflow-hidden max-w-lg w-full flex flex-col text-slate-800"
            >
              <div className="p-5 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <PlusCircle className="w-5 h-5 text-[#00AE64]" />
                    Mulai Kelas Baru
                  </h3>
                  <p className="text-[11px] font-medium text-slate-555 mt-0.5">Bangun komunitas belajar trader Anda sendiri.</p>
                </div>
              </div>
              
              <form onSubmit={handleCreateClass} className="p-5 space-y-4">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block mb-1">Nama / Judul Kelas</label>
                  <input 
                    type="text" 
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    placeholder="Contoh: Pemula Trading Altcoin Masterclass"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-sm text-slate-900 focus:outline-none focus:border-[#00AE64]"
                    maxLength={50}
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block mb-1">Deskripsi Tambahan</label>
                  <textarea 
                    value={newClassDesc}
                    onChange={(e) => setNewClassDesc(e.target.value)}
                    placeholder="Jelaskan secara singkat apa yang akan murid pelajari hari ini beserta materi/goals yang ingin dicapai..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-sm text-slate-900 focus:outline-none focus:border-[#00AE64] resize-none h-28"
                    maxLength={300}
                    required
                  />
                  <div className="text-right mt-1">
                    <span className="text-[10px] text-slate-400">{newClassDesc.length}/300</span>
                  </div>
                </div>

                <div className="pt-2 flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setIsCreatingSession(false)}
                    className="flex-1 px-4 py-3 border border-slate-300 text-slate-600 font-bold rounded-lg text-sm hover:bg-slate-50 transition-colors"
                  >
                    Batal
                  </button>
                  <button 
                    type="submit"
                    disabled={isSubmitting || !newClassName.trim() || !newClassDesc.trim()}
                    className="flex-1 px-4 py-3 bg-[#00AE64] hover:bg-emerald-600 text-white font-extrabold rounded-lg text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Buat Kelas'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

