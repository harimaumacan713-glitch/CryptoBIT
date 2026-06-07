import { CryptoData } from '../types';

export const WATCHLIST_COINS: CryptoData[] = [
  { symbol: 'BTC', name: 'Bitcoin', price: 92450.25, change: 1220.50, changePercent: 1.34, logo: 'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/btc.png', sparkline: [] },
  { symbol: 'ETH', name: 'Ethereum', price: 3412.50, change: -42.10, changePercent: -1.22, logo: 'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/eth.png', sparkline: [] },
  { symbol: 'SOL', name: 'Solana', price: 168.35, change: 8.50, changePercent: 5.32, logo: 'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/sol.png', sparkline: [] },
  { symbol: 'BNB', name: 'Binance Coin', price: 585.80, change: -2.30, changePercent: -0.39, logo: 'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/bnb.png', sparkline: [] },
  { symbol: 'XRP', name: 'XRP', price: 1.15, change: 0.05, changePercent: 4.54, logo: 'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/xrp.png', sparkline: [] },
  { symbol: 'DOGE', name: 'Dogecoin', price: 0.224, change: 0.012, changePercent: 5.66, logo: 'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/doge.png', sparkline: [] },
  { symbol: 'ADA', name: 'Cardano', price: 0.525, change: -0.008, changePercent: -1.50, logo: 'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/ada.png', sparkline: [] },
  { symbol: 'DOT', name: 'Polkadot', price: 9.25, change: 0.15, changePercent: 1.64, logo: 'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/dot.png', sparkline: [] },
  { symbol: 'LINK', name: 'Chainlink', price: 18.50, change: 0.85, changePercent: 4.81, logo: 'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/link.png', sparkline: [] },
  { symbol: 'MATIC', name: 'Polygon', price: 0.95, change: 0.02, changePercent: 2.15, logo: 'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/matic.png', sparkline: [] },
  { symbol: 'AVAX', name: 'Avalanche', price: 45.20, change: -1.20, changePercent: -2.58, logo: 'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/avax.png', sparkline: [] },
  { symbol: 'SHIB', name: 'Shiba Inu', price: 0.000028, change: 0.000001, changePercent: 4.12, logo: 'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/shib.png', sparkline: [] },
  { symbol: 'UNI', name: 'Uniswap', price: 12.45, change: 0.35, changePercent: 2.89, logo: 'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/uni.png', sparkline: [] },
  { symbol: 'TRX', name: 'TRON', price: 0.125, change: 0.005, changePercent: 4.16, logo: 'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/trx.png', sparkline: [] }
].map(c => ({
  ...c,
  sparkline: Array.from({ length: 20 }, (_, i) => ({ value: c.price * (1 + (Math.random() - 0.5) * 0.05) }))
}));
