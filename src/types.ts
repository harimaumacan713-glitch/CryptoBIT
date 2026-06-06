/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type IPOStatus = 'Upcoming' | 'Live' | 'Listed' | 'Failed';
export type OrderStatus = 'Pending' | 'Success' | 'Refunded';

export interface CryptoData {
  id?: string;
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  sparkline: { value: number }[];
  color?: string;
  logo?: string;
}

export interface IPOCoin {
  id: string;
  name: string;
  symbol: string;
  totalSupply: number;
  logo: string;
  description: string;
  website: string;
  twitter?: string;
  initialPrice: number;
  listingDate: string;
  minBuy: number;
  maxBuy: number;
  targetFund: number;
  status: IPOStatus;
  soldCount: number;
  investorCount: number;
  creatorId: string;
  isVerified: boolean;
  isHot?: boolean;
  currentPrice?: number;
  volume24h?: number;
  marketCap?: number;
  sparkline?: { value: number }[];
  ipoStartTime?: string;
  ipoEndTime?: string;
  listingTime?: string;
  countdownDuration?: number;
  
  // Real-Time Exchange parameters
  circulatingSupply?: number;
  liquidity?: number;
  hardcap?: number;
  creatorWallet?: string;
  lockSupplyCreator?: number;
  usdPool?: number;
  tokenPool?: number;
  buyVolume?: number;
  sellVolume?: number;
}

export interface IPOOrder {
  id: string;
  userId: string;
  coinId: string;
  coinSymbol: string;
  amount: number;
  price: number;
  status: OrderStatus;
  listingDate: string;
  timestamp: string;
}

export interface OrderBookEntry {
  price: number;
  lot: string;
  freq: string;
}

export interface OrderBookData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  logo?: string;
  bids: OrderBookEntry[];
  offers: OrderBookEntry[];
  stats: {
    open: string;
    high: string;
    low: string;
    prev: string;
    lot: string;
    val: string;
  };
}

export interface UserProfile {
  id: string;
  username: string;
  avatar: string;
  balance: number;
  assets: Record<string, number>;
  assetsInvested?: Record<string, number>;
  isVerified: boolean;
  verificationStatus?: 'pending' | 'approved' | 'rejected' | 'none';
  walletAddress?: string;
  kycStatus?: 'NOT_SUBMITTED' | 'UNDER_REVIEW' | 'VERIFIED' | 'REJECTED';
  kycSubmittedAt?: string;
  kycDetails?: {
    fullName: string;
    idNumber: string;
    detectedName: string;
    detectedNumber: string;
    reason?: string;
    checks?: {
      nameMatched: boolean;
      numberMatched: boolean;
      isValidID: boolean;
    }
  };
}

export interface Post {
  id: string;
  author: {
    uid?: string;
    name: string;
    username: string;
    avatar: string;
    isVerified?: boolean;
  };
  content: string;
  imageUrl?: string;
  timestamp: string;
  likes: number;
  comments: number;
  shares: number;
}

export interface Comment {
  id: string;
  postId: string;
  author: {
    uid: string;
    name: string;
    avatar: string;
    isVerified?: boolean;
  };
  content: string;
  createdAt: number;
}

export interface AppNotification {
  id: string;
  recipientUid: string;
  sender: {
    uid: string;
    name: string;
    avatar: string;
  };
  type: 'comment' | 'message' | 'system';
  message: string;
  postId?: string;
  isRead: boolean;
  createdAt: number;
}

export interface ChatMessage {
  id: string;
  senderUid: string;
  senderName: string;
  senderAvatar: string;
  recipientUid: string;
  recipientName: string;
  recipientAvatar: string;
  content: string;
  createdAt: number;
  isRead?: boolean;
}

