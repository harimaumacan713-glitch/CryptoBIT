/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { useFirebase } from './FirebaseProvider';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import PostComments from './PostComments';
import { 
  Search, 
  ChevronDown, 
  MessageSquare, 
  Repeat2, 
  Heart, 
  Share2, 
  CheckCircle2, 
  MoreHorizontal, 
  Loader2,
  RefreshCw,
  Newspaper,
  Zap,
  Flame,
  Globe,
  TrendingUp,
  TrendingDown,
  Sparkles,
  ArrowUpRight,
  Eye,
  AlertTriangle,
  Trash2
} from 'lucide-react';
import { Post } from '../types';

interface MarketTicker {
  symbol: string;
  name: string;
  price: number;
  change: number;
  isPositive: boolean;
  prefix?: string;
}

interface NewsArticle {
  id: string;
  category: 'Pasar Global' | 'Politik & Geopolitik' | 'Kebijakan & Regulasi' | 'Ekonomi Makro';
  title: string;
  summary: string;
  timestamp: string;
  impact: 'Bullish' | 'Bearish' | 'Neutral' | 'Volatile';
  source: string;
  views: number;
  likes: number;
  comments: number;
  imageUrl?: string;
}

const defaultMockPosts: Post[] = [
  {
    id: 'mock_1',
    author: {
      name: 'crypto_analyst',
      username: 'crypto_analyst',
      avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=crypto',
      isVerified: true,
    },
    content: 'Analisis BTC pekan ini: Bitcoin sedang menguji resistance di level $65k. Jika berhasil breakout, target selanjutnya ada di level All-Time High. Perhatikan juga rotasi ke altcoins layer-1.',
    imageUrl: 'https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=600&auto=format&fit=crop&q=60',
    timestamp: '2 jam yang lalu',
    likes: 124,
    comments: 45,
    shares: 12
  },
  {
    id: 'mock_2',
    author: {
      name: 'Web3Master',
      username: 'web3_guru',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=web3',
      isVerified: false
    },
    content: 'Akumulasi Institusi di ETF Ethereum mulai terlihat signifikan hari ini. Apakah ini pertanda altseason akan segera dimulai? #Ethereum #Web3',
    timestamp: '4 jam yang lalu',
    likes: 89,
    comments: 23,
    shares: 5
  }
];

// High quality initial news articles on Global Markets & Politics
const initialNewsArticles: NewsArticle[] = [
  {
    id: 'news_1',
    category: 'Pasar Global',
    title: 'The Fed Tegaskan Isyarat Pemangkasan Suku Bunga, Pasar Berjangka Wall Street Melonjak',
    summary: 'Rapat Federal Reserve memberikan isyarat optimis mengenai deflasi bertahap, memicu aliran modal masuk ke pasar berkembang Asia Tenggara including Indonesia.',
    timestamp: '2 menit yang lalu',
    impact: 'Bullish',
    source: 'Bloomberg Financial',
    views: 1420,
    likes: 38,
    comments: 11,
    imageUrl: 'https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=600&auto=format&fit=crop&q=60'
  },
  {
    id: 'news_7',
    category: 'Pasar Global',
    title: 'BREAKING: Whale Dompet Milik Investor Muda Transaksi Lebih dari 113 MILIAR Per Hari!',
    summary: 'Seorang investor muda Indonesia menjadi sorotan dunia kripto setelah dompet whale miliknya tercatat melakukan transaksi lebih dari $7 juta USD per hari, setara lebih dari Rp113 miliar.',
    timestamp: 'Baru saja',
    impact: 'Volatile',
    source: 'VIA X News',
    views: 1250,
    likes: 85,
    comments: 22,
    imageUrl: 'https://raw.githubusercontent.com/AI-Studio-Build/08618c6e-1fcf-4837-9a40-82d5c32f80dc/main/src/assets/images/whale_investor_news.png'
  },
  {
    id: 'news_2',
    category: 'Politik & Geopolitik',
    title: 'Eskalasi Geopolitik Baru di Selat Maritim Timur Tengah Mendorong Harga Minyak Brent Mendekati $86',
    summary: 'Ancaman penutupan jalur ekspor kritis oleh gugus patroli regional meningkatkan kekhawatiran gangguan pasok energi mentah jangka panjang ke belahan Asia Timur.',
    timestamp: '12 menit yang lalu',
    impact: 'Volatile',
    source: 'Reuters Desk',
    views: 954,
    likes: 24,
    comments: 8,
    imageUrl: 'https://images.unsplash.com/photo-1618042164219-62c820f10723?w=600&auto=format&fit=crop&q=60'
  },
  {
    id: 'news_3',
    category: 'Kebijakan & Regulasi',
    title: 'Uni Eropa Sepakat Percepat Implementasi Buku Putih AI Act Terhadap Korporasi Digital Raksasa',
    summary: 'Draf hukum komprehensif baru menetapkan denda berat dan penataan klasifikasi algoritma pintar untuk memitigasi misinformasi di media publik.',
    timestamp: '35 menit yang lalu',
    impact: 'Bearish',
    source: 'Financial Times',
    views: 712,
    likes: 19,
    comments: 4
  },
  {
    id: 'news_4',
    category: 'Ekonomi Makro',
    title: 'Surplus Neraca Dagang RI Hebat, Rupiah Sukses Menguat Terhadap Dolar AS',
    summary: 'Badan Pusat Statistik mengumumkan ekspor komoditas olahan industri baterai dan nikel melonjak prima, menyokong ketahanan posisi cadangan devisa nasional.',
    timestamp: '1 jam yang lalu',
    impact: 'Bullish',
    source: 'Antara Makro',
    views: 1205,
    likes: 56,
    comments: 15,
    imageUrl: 'https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=600&auto=format&fit=crop&q=60'
  },
  {
    id: 'news_5',
    category: 'Pasar Global',
    title: 'Rapat Parlemen AS Setujui Paket Alokasi Anggaran Energi Terbarukan Baru Senilai Ratusan Miliar',
    summary: 'Kebijakan anggaran hijau AS memicu lonjakan harga saham energi terbarukan global di perdagangan pagi ini, didorong sentimen pelonggaran kredit fiskal.',
    timestamp: '2 jam yang lalu',
    impact: 'Bullish',
    source: 'Wall Street Journal',
    views: 890,
    likes: 42,
    comments: 10
  },
  {
    id: 'news_6',
    category: 'Politik & Geopolitik',
    title: 'Negosiasi Bilateral Pajak Multi-Nasional Memasuki Kesepakatan Final Guna Mengurangi Hambatan Tarif Ekspor',
    summary: 'Pertemuan menteri luar negeri menelurkan draf standardisasi tarif perdagangan nikel dan kelapa sawit guna meredam volatilitas suplai regional.',
    timestamp: '3 jam yang lalu',
    impact: 'Neutral',
    source: 'CNBC Internasional',
    views: 654,
    likes: 15,
    comments: 3
  }
];

const breakingNewsPool: Omit<NewsArticle, 'id'>[] = [
  {
    category: 'Pasar Global',
    title: 'BREAKING: Indeks S&P 500 Tembus Rekor Tertinggi Baru Menyusul Laporan Pendapatan Fantastis Raksasa Teknologi',
    summary: 'Antusiasme pasar saham melesat melebih level batas psikologis perdagangan didorong oleh outlook proyeksi belanja server pintar yang luar biasa kokoh.',
    timestamp: 'Baru saja',
    impact: 'Bullish',
    source: 'Bloomberg Terminal',
    views: 340,
    likes: 18,
    comments: 5
  },
  {
    category: 'Politik & Geopolitik',
    title: 'BREAKING: Deklarasi Koalisi Stabilisasi Fiskal Terbentuk di Eropa Timur Usai Pemilu Selesai',
    summary: 'Hasil rekapitulasi suara melahirkan aliansi kerja sama baru yang fokus memperkuat ketahanan rantai suplai penyaluran gas regional.',
    timestamp: 'Baru saja',
    impact: 'Neutral',
    source: 'Associated Press',
    views: 480,
    likes: 22,
    comments: 7
  },
  {
    category: 'Kebijakan & Regulasi',
    title: 'BREAKING: IMF Rilis Rekomendasi Antisipasi Dampak Guncangan Likuiditas Global Tahun Depan',
    summary: 'Laporan komprehensif mendesak negara-negara berkembang untuk merekatkan instrumen lindung nilai obligasi terhadap fluktuasi nilai tukar devisa.',
    timestamp: 'Baru saja',
    impact: 'Volatile',
    source: 'IMF Media Relation',
    views: 620,
    likes: 31,
    comments: 12
  }
];

export default function Feed() {
  const { db, user, userProfile, realTimeCryptos, deletePost } = useFirebase();
  const [activeMainTab, setActiveMainTab] = useState<'stream' | 'news'>('stream');
  
  // Custom states for Social Feed (Stream Web3)
  const [dbPosts, setDbPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [likedPosts, setLikedPosts] = useState<Record<string, { liked: boolean; offset: number }>>({});
  const [showComments, setShowComments] = useState<Record<string, boolean>>({});
  const [locallyDeletedPostIds, setLocallyDeletedPostIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('locally_deleted_posts');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Custom states for Global Markets & Political News
  const [newsList, setNewsList] = useState<NewsArticle[]>(initialNewsArticles);
  const [newsFilter, setNewsFilter] = useState<'Semua' | 'Pasar Global' | 'Politik' | 'Regulasi' | 'Makro'>('Semua');
  const [newsSearchQuery, setNewsSearchQuery] = useState('');
  const [likedNewsTracker, setLikedNewsTracker] = useState<Record<string, boolean>>({});
  const [alertNotification, setAlertNotification] = useState<string | null>(null);

  // Fetch real-time crypto news from CoinTelegraph
  useEffect(() => {
    let active = true;
    const loadNews = async () => {
      try {
        const res = await fetch('https://api.rss2json.com/v1/api.json?rss_url=https://cointelegraph.com/rss');
        if (!res.ok) throw new Error('Network error');
        const data = await res.json();
        if (data && data.status === 'ok' && Array.isArray(data.items) && active) {
          const parsed: NewsArticle[] = data.items.map((item: any, idx: number) => {
            let imageUrl = item.thumbnail || (item.enclosure && item.enclosure.link) || '';
            
            if (!imageUrl && item.content) {
              const imgMatch = item.content.match(/<img[^>]+src="([^">]+)"/);
              if (imgMatch) imageUrl = imgMatch[1];
            }
            if (!imageUrl && item.description) {
              const imgMatch = item.description.match(/<img[^>]+src="([^">]+)"/);
              if (imgMatch) imageUrl = imgMatch[1];
            }

            if (!imageUrl) {
              const fallbacks = [
                'https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=600&auto=format&fit=crop&q=60',
                'https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=600&auto=format&fit=crop&q=60',
                'https://images.unsplash.com/photo-1618042164219-62c820f10723?w=600&auto=format&fit=crop&q=60'
              ];
              imageUrl = fallbacks[idx % fallbacks.length];
            }

            let summaryText = item.description || item.content || '';
            summaryText = summaryText.replace(/<[^>]*>/g, '').trim();
            if (summaryText.length > 180) {
              summaryText = summaryText.slice(0, 180) + '...';
            }

            let category: NewsArticle['category'] = 'Pasar Global';
            const titleLower = item.title.toLowerCase();
            if (titleLower.includes('regulation') || titleLower.includes('law') || titleLower.includes('sec') || titleLower.includes('govt') || titleLower.includes('regulasi') || titleLower.includes('kebijakan')) {
              category = 'Kebijakan & Regulasi';
            } else if (titleLower.includes('fed') || titleLower.includes('inflation') || titleLower.includes('economy') || titleLower.includes('suku bunga')) {
              category = 'Ekonomi Makro';
            } else if (titleLower.includes('geopolitic') || titleLower.includes('war') || titleLower.includes('election') || titleLower.includes('biden') || titleLower.includes('trump')) {
              category = 'Politik & Geopolitik';
            }

            let impact: NewsArticle['impact'] = 'Neutral';
            if (titleLower.includes('bull') || titleLower.includes('surge') || titleLower.includes('breakout') || titleLower.includes('rise') || titleLower.includes('gain') || titleLower.includes('up')) {
              impact = 'Bullish';
            } else if (titleLower.includes('drop') || titleLower.includes('plummet') || titleLower.includes('bear') || titleLower.includes('crash') || titleLower.includes('down') || titleLower.includes('loss')) {
              impact = 'Bearish';
            } else if (titleLower.includes('volat') || titleLower.includes('liquid') || titleLower.includes('whale') || titleLower.includes('mix')) {
              impact = 'Volatile';
            } else {
              const impacts: NewsArticle['impact'][] = ['Bullish', 'Bearish', 'Neutral', 'Volatile'];
              impact = impacts[Math.abs(item.title.length + idx) % impacts.length];
            }

            let relativeTime = 'Baru saja';
            try {
              const pubTime = new Date(item.pubDate).getTime();
              const diffMs = Date.now() - pubTime;
              const diffMins = Math.floor(diffMs / 60000);
              if (diffMins < 60) {
                relativeTime = `${Math.max(1, diffMins)} menit yang lalu`;
              } else {
                const diffHours = Math.floor(diffMins / 60);
                if (diffHours < 24) {
                  relativeTime = `${diffHours} jam yang lalu`;
                } else {
                  const diffDays = Math.floor(diffHours / 24);
                  relativeTime = `${diffDays} hari yang lalu`;
                }
              }
            } catch (e) {
              // ignore
            }

            return {
              id: item.guid || `news_${idx}_${Date.now()}`,
              category,
              title: item.title,
              summary: summaryText,
              timestamp: relativeTime,
              impact,
              source: item.author || 'CoinTelegraph',
              views: Math.floor(Math.random() * 1500) + 200,
              likes: Math.floor(Math.random() * 80) + 10,
              comments: Math.floor(Math.random() * 30) + 5,
              imageUrl,
              link: item.link
            };
          });
          setNewsList(parsed);
        }
      } catch (err) {
        console.error('Error fetching cointelegraph news:', err);
      }
    };

    loadNews();
    const interval = setInterval(loadNews, 45000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  // Real-time updates for Firestore user posts ('Stream Web3')
  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsList = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          author: {
            uid: data.author?.uid || '',
            name: data.author?.name || 'User',
            username: data.author?.username || 'user',
            avatar: data.author?.avatar || 'https://api.dicebear.com/7.x/pixel-art/svg?seed=default',
            isVerified: data.author?.isVerified || false
          },
          content: data.content || '',
          imageUrl: data.imageUrl || undefined,
          timestamp: data.timestamp || 'Baru saja',
          likes: data.likes || 0,
          comments: data.comments || 0,
          shares: data.shares || 0
        } as Post;
      });
      setDbPosts(postsList);
      setIsLoading(false);
    }, (error) => {
      console.error("Failed to subscribe to live posts feed", error);
      setIsLoading(false);
    });

    return unsubscribe;
  }, [db]);

  // Handler to like posts in Stream Web3
  const handleLikeClick = (postId: string) => {
    setLikedPosts(prev => {
      const current = prev[postId] || { liked: false, offset: 0 };
      const nextLiked = !current.liked;
      const nextOffset = nextLiked ? current.offset + 1 : current.offset - 1;
      return {
        ...prev,
        [postId]: { liked: nextLiked, offset: nextOffset }
      };
    });
  };

  // Handler to like news articles
  const handleLikeNews = (newsId: string) => {
    const isLiked = !!likedNewsTracker[newsId];
    setLikedNewsTracker(prev => ({
      ...prev,
      [newsId]: !isLiked
    }));
    setNewsList(prev => 
      prev.map(item => {
        if (item.id === newsId) {
          return {
            ...item,
            likes: isLiked ? item.likes - 1 : item.likes + 1
          };
        }
        return item;
      })
    );
  };

  // Handler to simulate real-time incoming breaking news about global markets or politics
  const handleInjectBreakingNews = () => {
    // Pick active random item from breaking news pools
    const randomIndex = Math.floor(Math.random() * breakingNewsPool.length);
    const item = breakingNewsPool[randomIndex];
    const generatedId = `news_live_${Date.now()}`;

    const newArticle: NewsArticle = {
      ...item,
      id: generatedId,
      timestamp: '1 menit yang lalu', // current
      views: Math.floor(Math.random() * 80) + 10,
      likes: 0,
      comments: 0
    };

    // Add to top of the list
    setNewsList(prev => [newArticle, ...prev]);
    
    // Trigger notification
    setAlertNotification(`BREAKING NEWS: ${newArticle.title}`);
    setTimeout(() => {
      setAlertNotification(null);
    }, 5500);
  };

  const handleDeletePost = async (postId: string, isCreatedByMe: boolean) => {
    if (isCreatedByMe) {
      try {
        await deletePost(postId);
      } catch (err: any) {
        console.warn("Firestore delete failed, using local fallback deletion:", err);
      }
    }
    const updated = [...locallyDeletedPostIds, postId];
    setLocallyDeletedPostIds(updated);
    try {
      localStorage.setItem('locally_deleted_posts', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
    setAlertNotification("Postingan berhasil dihapus!");
    setTimeout(() => {
      setAlertNotification(null);
    }, 3000);
  };

  // Combine stream dynamic posts with hardcoded premium ones
  const combinedPosts = [...dbPosts, ...defaultMockPosts].filter(post => !locallyDeletedPostIds.includes(post.id));

  // Filter global macro & political news based on user state
  const filteredNews = newsList.filter(article => {
    // 1. Tag filtering
    let matchesTag = true;
    if (newsFilter === 'Pasar Global') {
      matchesTag = article.category === 'Pasar Global';
    } else if (newsFilter === 'Politik') {
      matchesTag = article.category === 'Politik & Geopolitik';
    } else if (newsFilter === 'Regulasi') {
      matchesTag = article.category === 'Kebijakan & Regulasi';
    } else if (newsFilter === 'Makro') {
      matchesTag = article.category === 'Ekonomi Makro';
    }

    // 2. Search query filtering
    let matchesSearch = true;
    if (newsSearchQuery.trim()) {
      const q = newsSearchQuery.toLowerCase();
      matchesSearch = 
        article.title.toLowerCase().includes(q) || 
        article.summary.toLowerCase().includes(q) || 
        article.category.toLowerCase().includes(q);
    }

    return matchesTag && matchesSearch;
  });

  return (
    <div className="bg-[#121622] border border-slate-800 rounded-lg shadow-2xl overflow-hidden mb-8 relative">
      
      {/* Live Breaking News Notification Banner overlay */}
      {alertNotification && (
        <div className="bg-[#00AE64] text-white px-4 py-3 text-xs font-bold leading-relaxed flex items-center justify-between shadow-md transition-all gap-2 animate-bounce">
          <span className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-300 shrink-0 animate-pulse" />
            <span>{alertNotification}</span>
          </span>
          <button 
            type="button" 
            onClick={() => setAlertNotification(null)}
            className="bg-black/20 hover:bg-black/40 text-white rounded-full px-2 py-0.5 pointer-events-auto cursor-pointer text-[10px]"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Real-time Tickers Indicator Strip (Aesthetic design with live updates) */}
      <div className="bg-[#080b11] text-white py-2.5 px-3 flex items-center gap-4 text-xs overflow-x-auto no-scrollbar border-b border-slate-800/85 shrink-0 select-none">
        <div className="flex items-center gap-1.5 shrink-0 bg-[#00AE64]/10 border border-[#00AE64]/30 text-[#00AE64] text-[9px] font-black uppercase px-2 py-0.5 rounded tracking-wider">
          <span className="w-1.5 h-1.5 bg-[#00AE64] rounded-full animate-ping shrink-0" />
          <span>Real-time Ticker</span>
        </div>

        <div className="flex items-center gap-6">
          {realTimeCryptos && realTimeCryptos.map((t) => {
            const isPositive = (t.changePercent || 0) >= 0;
            return (
              <div key={t.symbol} className="flex items-center gap-1.5 shrink-0 font-mono text-[11px] font-medium">
                <span className="text-slate-300 font-sans font-black">{t.symbol}/USDT</span>
                <span className="text-slate-100 font-black">
                  ${t.price >= 1 ? t.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : t.price.toFixed(4)}
                </span>
                <span className={`inline-flex items-center text-[10px] font-black ${isPositive ? 'text-[#00AE64]' : 'text-rose-500'}`}>
                  {isPositive ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
                  {isPositive ? '+' : ''}{(t.changePercent || 0).toFixed(2)}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Feed & News Tabs Selector Switcher */}
      <div className="border-b border-slate-800 flex items-center justify-between px-4 h-14 bg-[#090b11]/80">
        <div className="flex h-full gap-1">
          <button 
            onClick={() => setActiveMainTab('stream')}
            className={`flex items-center gap-2 px-4 h-full text-xs sm:text-sm font-extrabold select-none transition-all border-b-2 cursor-pointer ${
              activeMainTab === 'stream'
                ? 'text-[#00AE64] border-[#00AE64]'
                : 'text-slate-400 hover:text-white border-transparent'
            }`}
          >
             Stream Web3
          </button>
          
          <button 
            onClick={() => setActiveMainTab('news')}
            className={`flex items-center gap-2.5 px-4 h-full text-xs sm:text-sm font-extrabold select-none transition-all border-b-2 cursor-pointer relative ${
              activeMainTab === 'news'
                ? 'text-[#00AE64] border-[#00AE64]'
                : 'text-slate-400 hover:text-white border-transparent'
            }`}
          >
             <Newspaper className="w-4 h-4" />
             News Live
             <span className="absolute top-2 right-1.5 flex h-2 w-2">
               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00AE64]/70 opacity-75"></span>
               <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00AE64]"></span>
             </span>
          </button>

          <button 
            type="button"
            className="flex items-center gap-2 px-4 h-full text-slate-500 text-xs sm:text-sm font-medium hover:text-white transition-colors select-none opacity-60 cursor-not-allowed"
            title="Segera Hadir"
          >
             Research <span className="bg-slate-800 text-slate-300 text-[10px] px-1.5 py-0.5 rounded-full font-black">Pro</span>
          </button>
        </div>
        
        <div className="flex items-center gap-2 text-slate-400">
          <Search className="w-4 h-4 cursor-pointer hover:text-white" />
        </div>
      </div>

      {/* --- RENDER TAB: STREAM WEB3 (Social posts) --- */}
      {activeMainTab === 'stream' && (
        <>
          {/* Stream Filter Chips */}
          <div className="p-4 border-b border-slate-800/85 flex items-center justify-between bg-[#121622]">
            <div className="flex gap-2 overflow-x-auto no-scrollbar scroll-smooth">
              {['Terkini', 'Ide Koin', 'Prediksi Harga', 'Poling Pasar', 'Akumulasi Whale'].map((tag, idx) => (
                <button 
                  key={tag} 
                  className={`px-3 py-1 rounded-sm text-[11px] font-bold border whitespace-nowrap select-none transition-all cursor-pointer ${
                    idx === 0 
                      ? 'bg-emerald-950/40 text-[#00AE64] border-emerald-500/20' 
                      : 'bg-[#181d2c] text-slate-400 border-slate-800 hover:border-slate-700 hover:text-white'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
            <button className="hidden sm:flex items-center gap-1 text-slate-400 text-xs font-bold hover:text-white">
              Mengikuti <ChevronDown className="w-3 h-3" />
            </button>
          </div>

          {/* Posts List rendering */}
          <div className="divide-y divide-slate-800 bg-[#121622]">
            {isLoading ? (
              <div className="p-10 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-6 h-6 text-[#00AE64] animate-spin" />
                <p className="text-xs text-slate-400 font-extrabold uppercase tracking-wider">Menghubungkan ke Web3 Ledger Feed...</p>
              </div>
            ) : combinedPosts.length === 0 ? (
              <div className="p-10 text-center">
                <p className="text-slate-555 text-sm font-medium">Belum ada ide yang diposting. Jadilah inisiator pertama!</p>
              </div>
            ) : (
              combinedPosts.map((post) => {
                const isCurrentUser = user && post.author.uid === user.uid;
                const isVerified = isCurrentUser ? (userProfile?.isVerified || false) : (post.author.isVerified || false);
                const verifiedName = isCurrentUser ? (userProfile?.username || post.author.name) : post.author.name;
                const verifiedAvatar = isCurrentUser ? (userProfile?.avatar || post.author.avatar) : post.author.avatar;

                const likeState = likedPosts[post.id] || { liked: false, offset: 0 };
                const effectiveLikes = Math.max(0, post.likes + likeState.offset);

                return (
                  <div key={post.id} className="p-4 hover:bg-[#181d2c]/40 transition-colors animate-fade-in">
                    <div className="flex gap-3">
                      <div className="relative shrink-0 select-none">
                        <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-800 bg-[#090b11] shadow-inner flex items-center justify-center">
                          <img src={verifiedAvatar} alt={verifiedName} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="font-extrabold text-sm text-slate-100 tracking-tight">{verifiedName}</span>
                            {isVerified && (
                              <span title="Akun Terverifikasi (Pro KYC)">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 fill-[#00AE64]/20 text-emerald-500 shrink-0" />
                              </span>
                            )}
                            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wide ml-1">· {post.timestamp}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={async (e) => {
                                e.stopPropagation();
                                await handleDeletePost(post.id, isCurrentUser);
                              }} 
                              className="text-slate-500 hover:text-rose-400 transition-colors p-1 hover:bg-rose-500/10 rounded" 
                              title="Hapus Postingan"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <button className="text-slate-500 hover:text-white transition-colors">
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <p className="text-sm text-slate-300 leading-relaxed font-semibold mb-3 whitespace-pre-line">{post.content}</p>
                        
                        {post.imageUrl && (
                          <div className="rounded-xl overflow-hidden border border-slate-800 bg-[#0c101b] mb-4 shadow-inner flex justify-center items-center">
                            <img 
                              src={post.imageUrl} 
                              alt="Gambaran Postingan Web3" 
                              className="max-w-full h-auto max-h-[500px] object-contain rounded-xl pointer-events-none select-none transition-transform duration-500 hover:scale-[1.005]"
                              referrerPolicy="no-referrer" 
                            />
                          </div>
                        )}
                        
                        <div className="flex items-center gap-8 text-slate-500">
                          <button 
                            onClick={() => setShowComments(prev => ({ ...prev, [post.id]: !prev[post.id] }))}
                            className={`flex items-center gap-1.5 transition-colors group cursor-pointer ${showComments[post.id] ? 'text-[#00AE64] font-extrabold' : 'hover:text-[#00AE64]'}`}
                          >
                            <MessageSquare className="w-4 h-4 group-hover:scale-110 transition-transform" />
                            <span className="text-[11px] font-bold">{post.comments}</span>
                          </button>
                          <button className="flex items-center gap-1.5 hover:text-emerald-500 transition-colors group cursor-pointer">
                            <Repeat2 className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                            <span className="text-[11px] font-bold">{post.shares}</span>
                          </button>
                          <button 
                            onClick={() => handleLikeClick(post.id)}
                            className={`flex items-center gap-1.5 transition-all group cursor-pointer duration-150 active:scale-90 ${
                              likeState.liked ? 'text-rose-500 font-extrabold' : 'hover:text-rose-500'
                            }`}
                          >
                            <Heart className={`w-4 h-4 transition-all ${likeState.liked ? 'fill-rose-500 text-rose-500 scale-110' : 'group-hover:scale-120'}`} />
                            <span className="text-[11px] font-bold">{effectiveLikes}</span>
                          </button>
                          <button className="flex items-center gap-1.5 hover:text-emerald-500 transition-colors group cursor-pointer">
                            <Share2 className="w-4 h-4 group-hover:-rotate-12 transition-transform" />
                          </button>
                        </div>
                        {showComments[post.id] && (
                          <PostComments 
                            postId={post.id} 
                            postAuthor={post.author} 
                            postContent={post.content} 
                          />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      {/* --- RENDER TAB: LIVE NEWS (Global Market & Political News Feed) --- */}
      {activeMainTab === 'news' && (
        <div className="bg-[#121622] min-h-[400px]">
          
          {/* Header Action Row */}
          <div className="p-4 bg-[#090b11] border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-black text-slate-100 tracking-tight flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-500 shrink-0 fill-orange-500" />
                Ledger News: Global & Geopolitik
              </h3>
              <p className="text-[11px] text-slate-400 font-semibold leading-none mt-1">
                Laporan geopolitik makroekonomi teraktual yang disuplai secara real-time oleh satelit anti-sensor.
              </p>
            </div>

            <div className="flex gap-2">
              <button 
                onClick={handleInjectBreakingNews}
                className="bg-slate-800 hover:bg-slate-700 text-slate-100 font-extrabold text-[10px] uppercase tracking-wider px-3 py-2 rounded-lg transition-all flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer flex-1 justify-center border border-slate-700"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Update Berita Pasar
              </button>
              
              <button 
                onClick={() => {
                  setNewsList(initialNewsArticles);
                  setNewsSearchQuery('');
                  setNewsFilter('Semua');
                }}
                className="border border-slate-800 bg-[#121622] hover:bg-[#181d2c] text-slate-300 font-extrabold text-[10px] uppercase px-3 py-2 rounded-lg transition-all flex items-center gap-1 shadow-sm active:scale-95 cursor-pointer"
                title="Reset/Refresh Berita"
              >
                <RefreshCw className="w-3 h-3" />
                Reset
              </button>
            </div>
          </div>

          {/* Search bar inside News tab */}
          <div className="p-3 border-b border-slate-800/80 bg-[#121622] flex items-center gap-2.5">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
              <input 
                type="text" 
                value={newsSearchQuery} 
                onChange={(e) => setNewsSearchQuery(e.target.value)}
                placeholder="Cari berita global, pemilu, saham, the fed, geopolitik..."
                className="w-full bg-[#0c0f17] border border-slate-800 rounded-lg py-2 pl-9 pr-4 text-xs font-medium text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-[#00AE64] focus:ring-1 focus:ring-[#00AE64]/10 focus:bg-[#080d15] transition-all"
              />
            </div>
          </div>

          {/* Tag Filter selection for News */}
          <div className="p-3 border-b border-slate-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar bg-[#121622]">
            {(['Semua', 'Pasar Global', 'Politik', 'Regulasi', 'Makro'] as const).map((tag) => (
              <button 
                key={tag}
                onClick={() => setNewsFilter(tag)}
                className={`px-3.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border whitespace-nowrap transition-all cursor-pointer ${
                  newsFilter === tag 
                    ? 'bg-[#00AE64] border-[#00AE64] text-white shadow-sm' 
                    : 'bg-[#181d2c] text-slate-400 border-slate-800 hover:border-slate-700 hover:text-white'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>

          {/* News articles listing wrapper */}
          <div className="divide-y divide-slate-800 bg-[#121622]">
            {filteredNews.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center justify-center gap-2.5">
                <AlertTriangle className="w-8 h-8 text-amber-500" />
                <p className="text-slate-200 text-sm font-bold">Tidak ada berita yang cocok!</p>
                <p className="text-xs text-slate-400 font-semibold max-w-sm">
                  Coba ubah kata kunci pencarian Anda atau kembalikan setelan filter kategori ke kategori "Semua".
                </p>
                <button 
                  onClick={() => { setNewsSearchQuery(''); setNewsFilter('Semua'); }}
                  className="mt-2 bg-[#00AE64] hover:bg-[#009656] text-white text-[10px] uppercase font-bold px-4 py-2.5 rounded-lg transition-all"
                >
                  Bersihkan Filter
                </button>
              </div>
            ) : (
              filteredNews.map((article) => {
                const liked = !!likedNewsTracker[article.id];
                
                return (
                  <div key={article.id} className="p-5 hover:bg-[#181d2c]/40 transition-colors animate-fade-in flex flex-col md:flex-row gap-5">
                    
                    {/* Embedded Illustration if available */}
                    {article.imageUrl && (
                      <div className="w-full md:w-[150px] h-[100px] rounded-lg overflow-hidden border border-slate-800 bg-[#0c101b] shrink-0 shadow-inner">
                        <img 
                          src={article.imageUrl} 
                          alt="Ilustrasi Berita" 
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300 select-none pointer-events-none"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    )}

                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        {/* Tags and timestamp indicators */}
                        <div className="flex items-center gap-2 mb-2 flex-wrap text-[9px] font-black uppercase tracking-wider">
                          <span className="text-slate-300 bg-slate-800 rounded px-2 py-0.5 leading-none">
                            {article.source}
                          </span>
                          <span className={`px-2 py-0.5 rounded leading-none ${
                            article.category === 'Pasar Global' ? 'text-indigo-400 bg-indigo-950/40 border border-indigo-505/20' :
                            article.category === 'Politik & Geopolitik' ? 'text-orange-400 bg-orange-950/40 border border-orange-505/20' :
                            article.category === 'Kebijakan & Regulasi' ? 'text-rose-400 bg-rose-950/40 border border-rose-505/20' :
                            'text-[#00AE64] bg-emerald-950/40 border border-emerald-505/20'
                          }`}>
                            {article.category}
                          </span>
                          
                          {/* Market Volatility/Impact Signal Tag */}
                          <span className={`px-2 py-0.5 rounded leading-none font-bold ${
                            article.impact === 'Bullish' ? 'text-[#00AE64] bg-emerald-950/40 border border-emerald-505/20' :
                            article.impact === 'Bearish' ? 'text-rose-400 bg-rose-950/40 border border-rose-505/20' :
                            article.impact === 'Volatile' ? 'text-[#FF8A00] bg-amber-950/45 border border-amber-500/20 animate-pulse' :
                            'text-slate-400 bg-slate-900 border border-slate-800'
                          }`}>
                            Impact: {article.impact}
                          </span>

                          <span className="text-slate-550 text-[10px] ml-auto font-medium">
                            {article.timestamp}
                          </span>
                        </div>

                        {/* Title & summary */}
                        <h4 className="text-sm font-black text-slate-100 mb-2 leading-snug tracking-tight hover:text-[#00AE64] cursor-pointer transition-colors">
                          {article.title}
                        </h4>
                        <p className="text-xs text-slate-400 leading-relaxed font-semibold mb-3">
                          {article.summary}
                        </p>
                      </div>

                      {/* Interaction Footer metadata */}
                      <div className="flex items-center justify-between text-slate-500 text-[10px] pt-1.5 border-t border-dashed border-slate-800/80">
                        <div className="flex items-center gap-4">
                          <button 
                            onClick={() => handleLikeNews(article.id)}
                            className={`flex items-center gap-1 transition-all ${liked ? 'text-rose-500 font-extrabold' : 'hover:text-rose-500'}`}
                          >
                            <Heart className={`w-3.5 h-3.5 ${liked ? 'fill-rose-500 text-rose-500 scale-105' : ''}`} />
                            <span className="font-bold">{article.likes}</span>
                          </button>

                          <span className="flex items-center gap-1">
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span className="font-bold">{article.comments}</span>
                          </span>

                          <span className="hidden sm:inline-flex items-center gap-1 text-slate-500/80">
                            <Eye className="w-3.5 h-3.5" />
                            <span className="font-semibold">{article.views.toLocaleString('id-ID')} views</span>
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button 
                            type="button"
                            onClick={() => {
                              setAlertNotification(`Sistem: Berita "${article.title}" berhasil disalin ke papan klip!`);
                              setTimeout(() => setAlertNotification(null), 3000);
                            }}
                            className="text-[10px] font-black uppercase text-slate-500 hover:text-white tracking-wider flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Share2 className="w-3 h-3" /> Bagikan
                          </button>
                          <a 
                            href="#news" 
                            onClick={(e) => {
                              e.preventDefault();
                              setAlertNotification(`Membuka Dokumen Referensi Berita Asli dari pihak ${article.source} secara aman...`);
                              setTimeout(() => setAlertNotification(null), 3000);
                            }}
                            className="bg-[#121622] hover:bg-[#181d2c] text-slate-300 border border-slate-800 px-2.5 py-1 rounded-md transition-colors flex items-center gap-0.5 font-bold"
                          >
                            Original <ArrowUpRight className="w-2.5 h-2.5 text-[#00AE64]" />
                          </a>
                        </div>
                      </div>

                    </div>
                  </div>
                );
              })
            )}
          </div>

        </div>
      )}

    </div>
  );
}
