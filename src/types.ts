/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type IPOStatus = 'Upcoming' | 'Live' | 'Listed';
export type OrderStatus = 'Pending' | 'Success' | 'Refunded';

export interface CryptoData {
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

export interface Post {
  id: string;
  author: {
    name: string;
    username: string;
    avatar: string;
    isVerified?: boolean;
  };
  content: string;
  timestamp: string;
  likes: number;
  comments: number;
  shares: number;
}
