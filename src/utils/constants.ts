import { CryptoData } from '../types';

export const WATCHLIST_COINS: CryptoData[] = [
  { symbol: 'BTC', name: 'Bitcoin', price: 64230.50, change: 1240.20, changePercent: 1.95, logo: 'https://static.okx.com/cdn/oksupport/asset/currency/icon/btc.png', sparkline: [] },
  { symbol: 'ETH', name: 'Ethereum', price: 3450.75, change: -45.20, changePercent: -1.29, logo: 'https://static.okx.com/cdn/oksupport/asset/currency/icon/eth.png', sparkline: [] },
  { symbol: 'SOL', name: 'Solana', price: 145.20, change: 12.40, changePercent: 9.32, logo: 'https://static.okx.com/cdn/oksupport/asset/currency/icon/sol.png', sparkline: [] },
  { symbol: 'BNB', name: 'Binance Coin', price: 590.30, change: 5.40, changePercent: 0.92, logo: 'https://static.okx.com/cdn/oksupport/asset/currency/icon/bnb.png', sparkline: [] },
  { symbol: 'XRP', name: 'XRP', price: 0.62, change: 0.01, changePercent: 1.45, logo: 'https://static.okx.com/cdn/oksupport/asset/currency/icon/xrp.png', sparkline: [] },
  { symbol: 'DOGE', name: 'Dogecoin', price: 0.16, change: 0.02, changePercent: 12.50, logo: 'https://static.okx.com/cdn/oksupport/asset/currency/icon/doge.png', sparkline: [] },
  { symbol: 'ADA', name: 'Cardano', price: 0.45, change: -0.01, changePercent: -2.10, logo: 'https://static.okx.com/cdn/oksupport/asset/currency/icon/ada.png', sparkline: [] },
  { symbol: 'TON', name: 'Toncoin', price: 7.20, change: 0.45, changePercent: 6.25, logo: 'https://static.okx.com/cdn/oksupport/asset/currency/icon/ton.png', sparkline: [] },
  { symbol: 'AVAX', name: 'Avalanche', price: 35.80, change: 2.10, changePercent: 6.23, logo: 'https://static.okx.com/cdn/oksupport/asset/currency/icon/avax.png', sparkline: [] },
  { symbol: 'LINK', name: 'Chainlink', price: 18.20, change: 0.50, changePercent: 2.80, logo: 'https://static.okx.com/cdn/oksupport/asset/currency/icon/link.png', sparkline: [] },
  { symbol: 'DOT', name: 'Polkadot', price: 7.20, change: -0.15, changePercent: -2.05, logo: 'https://static.okx.com/cdn/oksupport/asset/currency/icon/dot.png', sparkline: [] },
  { symbol: 'NEAR', name: 'NEAR Protocol', price: 5.40, change: 0.30, changePercent: 5.80, logo: 'https://static.okx.com/cdn/oksupport/asset/currency/icon/near.png', sparkline: [] }
].map(c => ({
  ...c,
  sparkline: Array.from({ length: 20 }, (_, i) => ({ value: c.price * (1 + (Math.random() - 0.5) * 0.05) }))
}));
