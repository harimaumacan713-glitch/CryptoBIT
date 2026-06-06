import { CryptoData } from '../types';

export const WATCHLIST_COINS: CryptoData[] = [
  { symbol: 'BTC', name: 'Bitcoin', price: 92450.25, change: 1220.50, changePercent: 1.34, logo: 'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/btc.png', sparkline: [] },
  { symbol: 'ETH', name: 'Ethereum', price: 3412.50, change: -42.10, changePercent: -1.22, logo: 'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/eth.png', sparkline: [] },
  { symbol: 'SOL', name: 'Solana', price: 168.35, change: 8.50, changePercent: 5.32, logo: 'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/sol.png', sparkline: [] },
  { symbol: 'BNB', name: 'Binance Coin', price: 585.80, change: -2.30, changePercent: -0.39, logo: 'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/bnb.png', sparkline: [] },
  { symbol: 'XRP', name: 'XRP', price: 1.15, change: 0.05, changePercent: 4.54, logo: 'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/xrp.png', sparkline: [] },
  { symbol: 'DOGE', name: 'Dogecoin', price: 0.224, change: 0.012, changePercent: 5.66, logo: 'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/doge.png', sparkline: [] },
  { symbol: 'ADA', name: 'Cardano', price: 0.525, change: -0.008, changePercent: -1.50, logo: 'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/ada.png', sparkline: [] }
].map(c => ({
  ...c,
  sparkline: Array.from({ length: 20 }, (_, i) => ({ value: c.price * (1 + (Math.random() - 0.5) * 0.05) }))
}));
