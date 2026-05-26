/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Search, ChevronDown, MessageSquare, Repeat2, Heart, Share2, CheckCircle2, MoreHorizontal } from 'lucide-react';
import { Post } from '../types';

const mockPosts: Post[] = [
  {
    id: '1',
    author: {
      name: 'crypto_analyst',
      username: 'crypto_analyst',
      avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=crypto',
      isVerified: true,
    },
    content: 'Analisis BTC pekan ini: Bitcoin sedang menguji resistance di level $65k. Jika berhasil breakout, target selanjutnya ada di level All-Time High. Perhatikan juga rotasi ke altcoins layer-1.',
    timestamp: '2 jam yang lalu',
    likes: 124,
    comments: 45,
    shares: 12
  },
  {
    id: '2',
    author: {
      name: 'Web3Master',
      username: 'web3_guru',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=web3',
    },
    content: 'Akumulasi Institusi di ETF Ethereum mulai terlihat signifikan hari ini. Apakah ini pertanda altseason akan segera dimulai? 🚀 #Ethereum #Web3',
    timestamp: '4 jam yang lalu',
    likes: 89,
    comments: 23,
    shares: 5
  }
];

export default function Feed() {
  return (
    <div className="bg-white border border-gray-200 rounded-sm shadow-sm overflow-hidden">
      {/* Feed Tabs */}
      <div className="border-b border-gray-100 flex items-center justify-between px-4 h-12">
        <div className="flex h-full">
          <button className="flex items-center gap-2 px-4 h-full text-[#00AE64] border-b-2 border-[#00AE64] text-sm font-bold">
             Stream
          </button>
          <button className="flex items-center gap-2 px-4 h-full text-gray-500 text-sm font-medium hover:text-gray-900 transition-colors">
            News
          </button>
          <button className="flex items-center gap-2 px-4 h-full text-gray-500 text-sm font-medium hover:text-gray-900 transition-colors">
            Research <span className="bg-[#00AE64] text-white text-[10px] px-1.5 py-0.5 rounded-full">5</span>
          </button>
        </div>
        <button className="p-2 text-gray-400 hover:text-gray-700">
          <Search className="w-4 h-4" />
        </button>
      </div>

      {/* Filter Chips */}
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex gap-2 overflow-x-auto no-scrollbar scroll-smooth">
          {['Ideas', 'Reports', 'Predictions', 'Polling', 'Insiders', 'Charts'].map((tag) => (
            <button key={tag} className="px-3 py-1 bg-gray-50 text-gray-600 rounded-sm text-[11px] font-medium border border-gray-200 hover:border-gray-300 hover:bg-gray-100 whitespace-nowrap">
              {tag}
            </button>
          ))}
        </div>
        <button className="flex items-center gap-1 text-gray-500 text-xs font-medium hover:text-gray-900">
          Followed <ChevronDown className="w-3 h-3" />
        </button>
      </div>

      {/* Posts List */}
      <div className="divide-y divide-gray-100">
        {mockPosts.map((post) => (
          <div key={post.id} className="p-4 hover:bg-gray-50 transition-colors">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 shrink-0">
                <img src={post.author.avatar} alt={post.author.name} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="font-bold text-sm text-gray-900">{post.author.name}</span>
                    {post.author.isVerified && <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 fill-blue-500 text-white" />}
                    <span className="text-gray-400 text-xs font-medium ml-1">· {post.timestamp}</span>
                  </div>
                  <button className="text-gray-400 hover:text-gray-600">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-sm text-gray-800 leading-relaxed mb-4">{post.content}</p>
                
                <div className="flex items-center gap-8">
                  <button className="flex items-center gap-1.5 text-gray-400 hover:text-[#00AE64] transition-colors group">
                    <MessageSquare className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-medium">{post.comments}</span>
                  </button>
                  <button className="flex items-center gap-1.5 text-gray-400 hover:text-blue-500 transition-colors group">
                    <Repeat2 className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                    <span className="text-xs font-medium">{post.shares}</span>
                  </button>
                  <button className="flex items-center gap-1.5 text-gray-400 hover:text-red-500 transition-colors group">
                    <Heart className="w-4 h-4 group-hover:scale-125 transition-transform" />
                    <span className="text-xs font-medium">{post.likes}</span>
                  </button>
                  <button className="flex items-center gap-1.5 text-gray-400 hover:text-blue-600 transition-colors group">
                    <Share2 className="w-4 h-4 group-hover:-rotate-12 transition-transform" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
