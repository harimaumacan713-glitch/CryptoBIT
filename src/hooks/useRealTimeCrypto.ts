/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { CryptoData, IPOCoin } from '../types';

export function useRealTimeCrypto(initialData: CryptoData[], customCoins?: IPOCoin[]) {
  const [data, setData] = useState<CryptoData[]>(initialData.map(item => ({ ...item, id: item.symbol + '-binance' })));
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Binance WebSocket for individual symbol tickers
    const streams = initialData.map(c => `${c.symbol.toLowerCase()}usdt@ticker`).join('/');
    const url = `wss://stream.binance.com:9443/ws/${streams}`;

    ws.current = new WebSocket(url);

    ws.current.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      
      setData((prevData) =>
        prevData.map((crypto) => {
          if (msg.s === `${crypto.symbol}USDT`) {
            const newPrice = parseFloat(msg.c);
            const changePercent = parseFloat(msg.P);
            const change = parseFloat(msg.p);

            const newSparkline = [...crypto.sparkline.slice(1), { value: newPrice }];
            
            return {
              ...crypto,
              price: newPrice,
              change: change,
              changePercent: changePercent,
              sparkline: newSparkline,
            };
          }
          return crypto;
        })
      );
    };

    ws.current.onerror = (err) => {
      console.error('Binance WebSocket Error:', err);
    };

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, []); // Only run on mount

  // Combine live Binance data with custom coins
  const customCoinsFormatted: CryptoData[] = [];
  if (customCoins) {
    customCoins.forEach(custom => {
      const initialSymbols = initialData.map(d => d.symbol.toUpperCase());
      const isBanned = ['BXC', 'QTX', 'ME'].includes(custom.symbol.toUpperCase());
      const isDuplicate = initialSymbols.includes(custom.symbol.toUpperCase());

      if (custom.status === 'Listed' && !isBanned && !isDuplicate) {
         // Create a compatible CryptoData object for listed custom coins
         const initialPrice = Number(custom.initialPrice) || 0;
         const price = Number(custom.currentPrice || custom.initialPrice) || 0;
         const change = price - initialPrice;
         const changePercent = initialPrice > 0 ? (change / initialPrice) * 100 : 0;
         
         const sparkline = custom.sparkline && custom.sparkline.length > 0 
            ? custom.sparkline 
            : Array(15).fill({value: price}); // fake history if none
         
         customCoinsFormatted.push({
           id: custom.id,
           symbol: custom.symbol,
           name: custom.name,
           price,
           change,
           changePercent,
           sparkline,
           logo: custom.logo || `https://api.dicebear.com/7.x/identicon/svg?seed=${custom.symbol}`
         });
      }
    });
  }
  
  const combinedData = Array.from(new Map([...data, ...customCoinsFormatted].map(item => [item.id, item])).values());

  return combinedData;
}
