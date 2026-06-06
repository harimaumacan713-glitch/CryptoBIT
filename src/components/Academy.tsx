/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useFirebase } from './FirebaseProvider';
import { 
  GraduationCap, 
  BookOpen, 
  CheckCircle, 
  ArrowRight, 
  Coins, 
  Award, 
  Sparkles, 
  BookOpenCheck, 
  TrendingUp, 
  HelpCircle, 
  ShieldCheck, 
  AlertCircle,
  Clock,
  UserCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface QuizQuestion {
  question: string;
  options: string[];
  correctIdx: number;
}

interface CourseChapter {
  id: number;
  title: string;
  description: string;
  readingTime: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  content: string[];
  quiz: QuizQuestion[];
}

const CHAPTERS: CourseChapter[] = [
  {
    id: 1,
    title: 'Blockchain & Smart Contract Basics',
    description: 'Pahami dasar teknologi rantai blok, alamat dompet digital, dan bagaimana smart contract merevolusi bursa keuangan tradisional.',
    readingTime: '5 Menit',
    difficulty: 'Beginner',
    content: [
      'Blockchain adalah buku besar digital yang terdesentralisasi, tidak dapat diubah (immutable), dan didistribusikan ke ribuan komputer di seluruh dunia.',
      'Setiap blok dalam rantai berisi sejumlah transaksi dan hash kriptografis dari blok sebelumnya, menciptakan lapisan keamanan enkripsi yang sangat kokoh.',
      'Smart Contract adalah algoritma komputer otomatis yang berjalan langsung di atas blockchain untuk memproses transfer nilai tanpa membutuhkan perantara pihak ketiga.',
      'Saat Anda mendaftar di CryptoBit, platform membuatkan kunci publik dompet digital (wallet address) otomatis berkode "0x...", tempat Anda menyimpan saldo USD dan aset bursa.'
    ],
    quiz: [
      {
        question: 'Manakah dari berikut ini yang merupakan sifat dasar dari data di blockchain?',
        options: [
          'Mudah dimodifikasi oleh admin pusat',
          'Tergantung sepenuhnya pada server perbankan fisik',
          'Terdesentralisasi dan tidak mudah diubah (immutable)',
          'Hanya dapat diakses melalui browser berbayar'
        ],
        correctIdx: 2
      },
      {
        question: 'Siapakah yang menjalankan logika program otomatis atau kontrak pintar? (Smart Contract)',
        options: [
          'Layanan Bank Sentral',
          'Blockchain itu sendiri (tereksekusi otomatis)',
          'Instalasi broker manual lokal',
          'Pialang saham perorangan'
        ],
        correctIdx: 1
      }
    ]
  },
  {
    id: 2,
    title: 'Automated Market Makers (AMM) & Liquidity Pools',
    description: 'Pelajari formula rahasia k = x * y yang menggerakkan bursa koin independen di CryptoBit dan konsep slip bursa (slippage).',
    readingTime: '7 Menit',
    difficulty: 'Intermediate',
    content: [
      'Automated Market Maker (AMM) adalah protokol bursa desentralisasi yang menentukan harga aset menggunakan formula rumus matematika konstan.',
      'CryptoBit menggunakan rumus legendaris Uniswap V2: x * y = k, di mana "x" adalah jumlah token, "y" adalah nilai total USD pool, dan "k" adalah pengali likuiditas konstan.',
      'Likuiditas Pool adalah wadah token yang dibekukan oleh penyedia likuiditas (Liquidity Providers) untuk memfasilitasi trader bursa instan.',
      'Slippage adalah perubahan rasio harga koin akibat ukuran pembelian Anda yang sangat besar terhadap kedalaman pool likuiditas (slippage). Semakin kecil pool koin, semakin rentan terhadap getaran harga.'
    ],
    quiz: [
      {
        question: 'Formula manakah yang digunakan bursa AMM konstan di CryptoBit?',
        options: [
          'x + y = k',
          'x * y = k',
          'x / y = k',
          'x ^ y = k'
        ],
        correctIdx: 1
      },
      {
        question: 'Mengapa pembelian dalam jumlah sangat besar pada koin baru dapat menyebabkan perubahan harga melambung tinggi? (Slippage)',
        options: [
          'Karena admin bursa mengenakan pajak penalti secara manual',
          'Karena pasokan likuiditas pool mengalami pergeseran rasio penyeimbang secara instan akibat volume transaksi',
          'Karena komputer mendeteksi aksi hacking dompet',
          'Karena koin tersebut otomatis didelete dari server'
        ],
        correctIdx: 1
      }
    ]
  },
  {
    id: 3,
    title: 'Initial Coin Offerings (IPO) & Risk Systems',
    description: 'Kuasai model investasi awal di bursa IPO CryptoBit, proses verifikasi KYC, pengembalian dana bursa otomatis, dan crash protection.',
    readingTime: '6 Menit',
    difficulty: 'Advanced',
    content: [
      'Initial Coin Offering (IPO) adalah langkah penggalangan dana awal di mana token baru dikreditkan ke investor ritel sebelum terdaftar di bursa.',
      'Sistem IPO CryptoBit memiliki fitur otomatis pengembalian dana penuh (automated full refund) jika token gagal mencapai target pengumpulan modal (Hardcap) sebelum hitung mundur usai.',
      'Untuk meluncurkan koin sendiri di Launchpad, pencipta koin wajib melakukan verifikasi KYC (Know Your Customer) dan menyediakan deposit modal jaminan likuiditas minimum $1,000,000 USD virtual.',
      'Crash Protection diaktifkan untuk melarang koki / pembuat koin membuang lebih dari 5% pasokan total supply dalam satu order instan guna menghindari skenario manipulasi pasar.'
    ],
    quiz: [
      {
        question: 'Apa yang terjadi di CryptoBit jika bursa IPO token gagal mencapai target Hardcap?',
        options: [
          'Dana hangus diambil oleh platform',
          'Investor mendapat token separuh harga',
          'Sistem melakukan pengembalian dana 100% (automated full refund) ke saldo akun pengguna',
          'Proyek ditunda gratis selama 1 tahun'
        ],
        correctIdx: 2
      },
      {
        question: 'Berapakah batas penjualan maksimum sekali transaksi bagi pembuat koin untuk mencegah manipulasi? (Crash Protection)',
        options: [
          'Maksimal 50% dari total supply',
          'Maksimal 5% dari total supply',
          'Maksimal 90% dari total supply',
          'Bebas menjual kapan saja tanpa batas'
        ],
        correctIdx: 1
      }
    ]
  }
];

export default function Academy() {
  const { userProfile, updateBalance, user } = useFirebase();
  const [activeChapterIdx, setActiveChapterIdx] = useState<number>(0);
  const [chapterAnswers, setChapterAnswers] = useState<Record<number, Record<number, number>>>({});
  const [completedChapters, setCompletedChapters] = useState<number[]>([]);
  
  // Quiz evaluation
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);
  const [quizScore, setQuizScore] = useState<number | null>(null);

  // Faucet state
  const [faucetClaimed, setFaucetClaimed] = useState<boolean>(false);
  const [claiming, setClaiming] = useState<boolean>(false);

  const currentChapter = CHAPTERS[activeChapterIdx];

  const handleOptionSelect = (qIdx: number, optIdx: number) => {
    if (quizSubmitted) return; // locked

    setChapterAnswers(prev => {
      const existing = prev[activeChapterIdx] || {};
      return {
        ...prev,
        [activeChapterIdx]: {
          ...existing,
          [qIdx]: optIdx
        }
      };
    });
  };

  const checkQuizAnswers = () => {
    const answers = chapterAnswers[activeChapterIdx] || {};
    const totalQuestions = currentChapter.quiz.length;
    
    // Check if user answered all questions
    if (Object.keys(answers).length < totalQuestions) {
      alert("Silakan jawab semua pertanyaan kuis terlebih dahulu!");
      return;
    }

    let score = 0;
    currentChapter.quiz.forEach((q, idx) => {
      if (answers[idx] === q.correctIdx) {
        score++;
      }
    });

    setQuizScore(score);
    setQuizSubmitted(true);

    if (score === totalQuestions) {
      // Complete!
      if (!completedChapters.includes(activeChapterIdx)) {
        setCompletedChapters(prev => [...prev, activeChapterIdx]);
      }
    }
  };

  const handleNextChapter = () => {
    // Reset quiz panel state
    setQuizSubmitted(false);
    setQuizScore(null);
    if (activeChapterIdx < CHAPTERS.length - 1) {
      setActiveChapterIdx(prev => prev + 1);
    }
  };

  const claimFaucetReward = async () => {
    if (!user) {
      alert("Silakan masuk terlebih dahulu!");
      return;
    }
    if (completedChapters.length < CHAPTERS.length) {
      alert("Silakan selesaikan seluruh bab kuis di Academy dengan nilai sempurna terlebih dahulu!");
      return;
    }

    setClaiming(true);
    try {
      // Update firebase user balance directly by adding $10,000 USD virtual reward
      await updateBalance(10000);
      setFaucetClaimed(true);
    } catch (e: any) {
      alert("Gagal melakukan klaim deposit belajar: " + e.message);
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto mt-4 space-y-6 animate-fadeIn pb-10">
      
      {/* Academy Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2 text-[#00AE64]">
            <GraduationCap className="w-5 h-5 fill-current animate-bounce" />
            <span className="font-extrabold text-[10px] tracking-widest uppercase bg-[#00AE64]/10 px-2 py-0.5 rounded border border-[#00AE64]/20">CryptoBit Academy</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black italic tracking-tighter text-white mt-1">SECURE WEB3 TRADING SCHOOL</h1>
          <p className="text-slate-400 text-xs md:text-sm">Pelajari seluk-beluk desentralisasi kripto, raih kelulusan tes kuis, dan klaim beasiswa belajar virtual senilai $10,000 USD!</p>
        </div>

        {/* Graduation / Course Progress widgets */}
        <div className="flex items-center gap-3 bg-[#121622] border border-slate-800 p-3 rounded-xl">
           <div className="text-right">
              <span className="text-[9px] uppercase font-bold text-slate-500 block">Sertifikasi & Bab Lulus</span>
              <span className="text-white font-extrabold text-xs block mt-0.5">{completedChapters.length} / {CHAPTERS.length} Bab Selesai</span>
           </div>
           <div className="h-8 w-[1px] bg-slate-850" />
           {completedChapters.length === CHAPTERS.length ? (
              <span className="bg-emerald-500/15 text-[#00AE64] border border-emerald-500/20 text-[10px] font-black uppercase px-2.5 py-1 rounded">Certified Scholar</span>
           ) : (
              <span className="bg-slate-800 text-slate-400 border border-slate-700 text-[10px] font-black uppercase px-2.5 py-1 rounded">In Training</span>
           )}
        </div>
      </div>

      {/* Main split sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Side: Chapter list map */}
        <div className="lg:col-span-1 space-y-3.5">
          <div className="bg-[#121622] rounded-xl border border-slate-800 p-4">
             <span className="text-xs font-black text-slate-400 uppercase tracking-wider block mb-3">Silabus Kurikulum</span>
             <div className="space-y-2">
                {CHAPTERS.map((chapter, idx) => {
                  const isActive = activeChapterIdx === idx;
                  const isFinished = completedChapters.includes(idx);
                  return (
                    <div
                      key={chapter.id}
                      onClick={() => {
                        setActiveChapterIdx(idx);
                        setQuizSubmitted(false);
                        setQuizScore(null);
                      }}
                      className={`p-3.5 rounded-lg border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                        isActive
                          ? 'bg-[#00AE64]/10 border-[#00AE64]/50'
                          : 'bg-[#0c101b]/60 border-slate-800/80 hover:bg-slate-800/40'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                            chapter.difficulty === 'Beginner' ? 'bg-indigo-950/40 text-indigo-400' :
                            chapter.difficulty === 'Intermediate' ? 'bg-yellow-950/40 text-yellow-500' : 'bg-purple-950/40 text-purple-400'
                          }`}>{chapter.difficulty}</span>
                          <span className="text-[10px] font-bold text-slate-500">{chapter.readingTime} Baca</span>
                        </div>
                        <h4 className="font-extrabold text-xs text-white mt-1.5 leading-tight">{chapter.title}</h4>
                      </div>

                      {isFinished ? (
                        <CheckCircle className="w-5 h-5 text-[#00AE64] shrink-0" />
                      ) : (
                        <BookOpen className="w-4 h-4 text-slate-600 shrink-0" />
                      )}
                    </div>
                  );
                })}
             </div>
          </div>

          {/* Scholarship Claim Panel */}
          <div className="bg-gradient-to-br from-[#0c2419] to-[#081216] border border-[#00AE64]/30 rounded-xl p-5 shadow-xl relative overflow-hidden">
             {/* Glowing visual particle */}
             <div className="absolute right-0 bottom-0 bg-[#00AE64]/10 w-24 h-24 rounded-full blur-2xl" id="halo-glow-reward" />
             
             <div className="relative z-10 space-y-4">
                <div className="flex items-center gap-1.5 text-[#00AE64]">
                   <Coins className="w-5 h-5 fill-[#00AE64]/10 animate-spin" />
                   <h3 className="font-black italic tracking-tight text-white text-base">Faucet Beasiswa Siswa</h3>
                </div>
                <p className="text-slate-300 text-xs leading-relaxed font-semibold">
                   Selesaikan seluruh bab tes kuis di platform kelulusan bursa ini untuk menguji kemampuan keuangan Anda. Setelah lulus sempurna dari kurikulum, Anda berhak mencairkan saldo virtual sebesar <strong>$10,000 USD</strong> yang dikreditkan langsung ke saldo akun Firebase Anda!
                </p>

                {faucetClaimed ? (
                  <div className="bg-[#00AE64]/20 border border-[#00AE64]/40 p-3 rounded-lg text-xs font-bold text-center text-white flex flex-col items-center gap-1.5">
                     <Award className="w-6 h-6 text-yellow-400 animate-bounce" />
                     <span>Sertifikat & Hadiah $10,000 Berhasil Diklaim! Saldo Anda telah naik otomatis.</span>
                  </div>
                ) : (
                  <button
                    onClick={claimFaucetReward}
                    disabled={completedChapters.length < CHAPTERS.length || claiming}
                    className={`w-full font-black py-3 rounded-lg text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 ${
                      completedChapters.length === CHAPTERS.length
                        ? 'bg-[#00AE64] hover:bg-[#009656] text-white shadow-lg'
                        : 'bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed'
                    }`}
                  >
                     {claiming ? (
                       'Sedang Memproses Klaim...'
                     ) : (
                       <>
                         <Sparkles className="w-4 h-4" /> Klaim Beasiswa $10,000 USD
                       </>
                     )}
                  </button>
                )}
             </div>
          </div>
        </div>

        {/* Right Side: Chapter Reading & Quiz Panel */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Section 1: Study reading card */}
          <div className="bg-[#121622] rounded-xl border border-slate-800 p-6 shadow-xl space-y-4">
             <div className="flex items-center justify-between border-b border-slate-805/50 pb-3">
                <div className="flex items-center gap-2.5">
                   <div className="w-7 h-7 bg-indigo-950/40 rounded-md border border-indigo-500/20 flex items-center justify-center text-indigo-400 text-xs font-bold font-mono">
                     {currentChapter.id}
                   </div>
                   <h3 className="font-black text-white text-base">{currentChapter.title}</h3>
                </div>
                <span className="text-[10px] font-bold text-slate-450 uppercase tracking-widest">Reading Station</span>
             </div>

             <div className="space-y-3 pl-1 font-semibold text-slate-300 text-xs leading-relaxed">
                {currentChapter.content.map((point, id) => (
                  <div key={id} className="flex gap-2.5">
                     <div className="w-1.5 h-1.5 rounded-full bg-[#00AE64] shrink-0 mt-2" />
                     <span>{point}</span>
                  </div>
                ))}
             </div>
          </div>

          {/* Section 2: Interactive Quiz module */}
          <div className="bg-[#121622] rounded-xl border border-slate-800 p-6 shadow-xl space-y-5 relative">
             <div className="flex items-center justify-between border-b border-slate-805/50 pb-3">
                <div className="flex items-center gap-2">
                   <BookOpenCheck className="w-5 h-5 text-[#00AE64]" />
                   <h3 className="font-extrabold text-white text-sm uppercase tracking-tight">Kuis Evaluasi Bab {currentChapter.id}</h3>
                </div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tes Kelayakan</span>
             </div>

             <div className="space-y-6">
                {currentChapter.quiz.map((q, qIdx) => {
                  const selectedOptIdx = chapterAnswers[activeChapterIdx]?.[qIdx];
                  return (
                    <div key={qIdx} className="space-y-2.5">
                      <div className="flex items-start gap-2">
                         <span className="text-[11px] font-black font-mono text-[#00AE64] mt-0.5">Q{qIdx + 1}.</span>
                         <h4 className="text-xs font-extrabold text-slate-200 leading-normal">{q.question}</h4>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pl-3.5">
                         {q.options.map((option, optIdx) => {
                           const isSelected = selectedOptIdx === optIdx;
                           const isCorrect = optIdx === q.correctIdx;
                           
                           let borderClass = 'border-slate-800 bg-[#0c101b]/60 hover:bg-slate-800/20';
                           let badgeClass = 'text-slate-400';

                           if (isSelected) {
                              if (quizSubmitted) {
                                 borderClass = isCorrect 
                                   ? 'border-[#00AE64] bg-[#00AE64]/5 text-[#00AE64]' 
                                   : 'border-rose-600 bg-rose-600/5 text-rose-500';
                              } else {
                                 borderClass = 'border-[#00AE64] bg-[#00AE64]/5 text-[#00AE64]';
                              }
                           } else if (quizSubmitted && isCorrect) {
                              borderClass = 'border-[#00AE64] bg-[#00AE64]/5 text-[#00AE64] animate-pulse';
                           }

                           return (
                             <button
                               type="button"
                               key={optIdx}
                               onClick={() => handleOptionSelect(qIdx, optIdx)}
                               className={`p-3 rounded-lg text-left text-xs font-bold transition-all border flex items-center justify-between gap-2.5 ${borderClass}`}
                             >
                               <span className="leading-tight">{option}</span>
                               {isSelected && (
                                 <span className="text-[9px] font-mono whitespace-nowrap bg-[#00AE64]/10 px-1 rounded">Chosen</span>
                               )}
                             </button>
                           );
                         })}
                      </div>
                    </div>
                  );
                })}
             </div>

             {/* Quiz results submission bar */}
             <div className="pt-4 border-t border-slate-850 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                   {quizSubmitted && quizScore !== null && (
                     <div className="flex items-center gap-2.5">
                        {quizScore === currentChapter.quiz.length ? (
                          <>
                            <div className="flex items-center gap-1.5 text-[#00AE64] font-black text-xs">
                              <CheckCircle className="w-4.5 h-4.5 text-[#00AE64]" /> LULUS SEMPURNA ({quizScore}/{currentChapter.quiz.length})
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex items-center gap-1.5 text-rose-500 font-extrabold text-xs">
                              <AlertCircle className="w-4.5 h-4.5 text-rose-500" /> ANDA BELUM LULUS ({quizScore}/{currentChapter.quiz.length}). Coba pelajari isi bab lagi.
                            </div>
                          </>
                        )}
                     </div>
                   )}
                </div>

                <div className="flex gap-2">
                   {quizSubmitted ? (
                     <button
                       type="button"
                       onClick={() => {
                         setQuizSubmitted(false);
                         setQuizScore(null);
                         // Clear answers for this chapter
                         setChapterAnswers(prev => {
                            const updated = { ...prev };
                            delete updated[activeChapterIdx];
                            return updated;
                         });
                       }}
                       className="px-4 py-2.5 border border-slate-700 bg-slate-800 hover:bg-slate-700 font-bold rounded-lg text-xs leading-none cursor-pointer text-slate-300"
                     >
                       Coba Ulang
                     </button>
                   ) : (
                     <button
                       type="button"
                       onClick={checkQuizAnswers}
                       className="px-4 py-2.5 bg-[#00AE64] hover:bg-[#009656] text-white font-extrabold rounded-lg text-xs leading-none cursor-pointer flex items-center gap-1 shadow-md shadow-[#00AE64]/10"
                     >
                       Kirim Jawaban
                     </button>
                   )}

                   {completedChapters.includes(activeChapterIdx) && activeChapterIdx < CHAPTERS.length - 1 && (
                     <button
                       type="button"
                       onClick={handleNextChapter}
                       className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-lg text-xs leading-none cursor-pointer flex items-center gap-1"
                     >
                       Lanjut Bab Baru <ArrowRight className="w-3.5 h-3.5" />
                     </button>
                   )}
                </div>
             </div>
          </div>

        </div>

      </div>

    </div>
  );
}
