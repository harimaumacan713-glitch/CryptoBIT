/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { CryptoData } from '../types';

export function useRealTimeCrypto(initialData: CryptoData[]) {
  const [data, setData] = useState<CryptoData[]>(initialData);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Binance WebSocket for individual symbol tickers
    // Format: wss://stream.binance.com:9443/ws/btcusdt@ticker/ethusdt@ticker...
    const streams = initialData.map(c => {
      // Fix for symbols like TON (which might be TONUSDT or something else on Binance)
      // Actually Binance has TONUSDT
      return `${c.symbol.toLowerCase()}usdt@ticker`;
    }).join('/');
    const url = `wss://stream.binance.com:9443/ws/${streams}`;

    ws.current = new WebSocket(url);

    ws.current.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      
      setData((prevData) =>
        prevData.map((crypto) => {
          // Binance symbol is e.g. "BTCUSDT"
          if (msg.s === `${crypto.symbol}USDT`) {
            const newPrice = parseFloat(msg.c); // current close price
            const changePercent = parseFloat(msg.P); // price change percent
            const change = parseFloat(msg.p); // price change

            // Update sparkline: remove first, add new at end (max 15 points)
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

  return data;
}
