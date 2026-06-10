/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { CryptoData, IPOCoin } from '../types';

export function useRealTimeCrypto(initialData: CryptoData[], customCoins?: IPOCoin[]) {
  const [cryptos, setCryptos] = useState<CryptoData[]>(() => {
    return initialData.map(item => ({ ...item, id: item.symbol + '-binance' }));
  });
  const ws = useRef<WebSocket | null>(null);
  const lastMessageTime = useRef<number>(Date.now());
  const httpFallbackActive = useRef<boolean>(false);

  // Connect to Binance WebSocket for instant live prices
  useEffect(() => {
    const streams = initialData.map(c => `${c.symbol.toLowerCase()}usdt@ticker`).join('/');
    // Use standard combined streams endpoint on stream.binance.com
    const url = `wss://stream.binance.com:9443/stream?streams=${streams}`;

    try {
      ws.current = new WebSocket(url);

      ws.current.onmessage = (event) => {
        try {
          let msg = JSON.parse(event.data);
          lastMessageTime.current = Date.now();
          httpFallbackActive.current = false;
          
          // Handle wrapped payload structure in combined streams
          if (msg.data) {
            msg = msg.data;
          }
          
          setCryptos((prevData) =>
            prevData.map((crypto) => {
              if (msg.s === `${crypto.symbol}USDT`) {
                const newPrice = parseFloat(msg.c);
                const changePercent = parseFloat(msg.P);
                const change = parseFloat(msg.p);

                const newSparkline = crypto.sparkline && crypto.sparkline.length > 0
                  ? [...crypto.sparkline.slice(1), { value: newPrice }]
                  : [{ value: newPrice }];
                
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
        } catch (err) {
          console.error('Failed to parse Binance WebSocket message:', err);
        }
      };

      ws.current.onerror = (err) => {
        console.warn('Binance WebSocket Error (Activating backup REST engine):', err);
        httpFallbackActive.current = true;
      };

      ws.current.onclose = () => {
        console.log('Binance WebSocket closed. Backup engine online.');
        httpFallbackActive.current = true;
      };
    } catch (e) {
      console.error('Error starting Binance WebSocket:', e);
      httpFallbackActive.current = true;
    }

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, []); // Run once on mount

  // Backup HTTP Poller: Queries actual Binance REST prices or CryptoCompare (CORS-friendly) if WebSocket is lagging/blocked
  useEffect(() => {
    const fetchLatestRestPrices = async () => {
      const now = Date.now();
      const wsActive = (now - lastMessageTime.current) < 5000;
      
      // Only poll if websocket is inactive or flagged
      if (wsActive && !httpFallbackActive.current) return;

      let fetchedData = false;
      try {
        const response = await fetch('https://api.binance.com/api/v3/ticker/24hr');
        if (response.ok) {
          const dataArr = await response.json();
          const tickerMap = new Map();
          
          dataArr.forEach((item: any) => {
            if (item.symbol.endsWith('USDT')) {
              tickerMap.set(item.symbol, item);
            }
          });

          setCryptos((prevData) =>
            prevData.map((crypto) => {
              const isCustom = !crypto.id?.endsWith('-binance');
              if (isCustom) return crypto;

              const targetSymbol = `${crypto.symbol}USDT`;
              const ticker = tickerMap.get(targetSymbol);
              if (ticker) {
                const newPrice = parseFloat(ticker.lastPrice);
                const changePercent = parseFloat(ticker.priceChangePercent);
                const change = parseFloat(ticker.priceChange);
                
                const newSparkline = crypto.sparkline && crypto.sparkline.length > 0
                  ? [...crypto.sparkline.slice(1), { value: newPrice }]
                  : [{ value: newPrice }];

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
          fetchedData = true;
        }
      } catch (err) {
        // Fallback to CORS-free Cryptocompare
      }

      if (!fetchedData) {
        try {
          const symbols = initialData.map(c => c.symbol.toUpperCase()).join(',');
          const ccRes = await fetch(`https://min-api.cryptocompare.com/data/pricemultifull?fsyms=${symbols}&tsyms=USD`);
          if (ccRes.ok) {
            const ccJson = await ccRes.json();
            if (ccJson.RAW) {
              setCryptos((prevData) =>
                prevData.map((crypto) => {
                  const isCustom = !crypto.id?.endsWith('-binance');
                  if (isCustom) return crypto;

                  const rawInfo = ccJson.RAW[crypto.symbol.toUpperCase()]?.USD;
                  if (rawInfo) {
                    const newPrice = rawInfo.PRICE;
                    const changePercent = rawInfo.CHANGEPCT24HOUR;
                    const change = rawInfo.CHANGE24HOUR;

                    const newSparkline = crypto.sparkline && crypto.sparkline.length > 0
                      ? [...crypto.sparkline.slice(1), { value: newPrice }]
                      : [{ value: newPrice }];

                    return {
                      ...crypto,
                      price: newPrice,
                      change,
                      changePercent,
                      sparkline: newSparkline,
                    };
                  }
                  return crypto;
                })
              );
            }
          }
        } catch (ccErr) {
          console.warn('Backup Cryptocompare pricing feed failed (Using local physics walker fallback):', ccErr);
        }
      }
    };

    // Poll every 6000ms to stay within rate limits but keep pricing fresh
    const pollInterval = setInterval(fetchLatestRestPrices, 6000);
    // Trigger immediate initial catch-up poller
    fetchLatestRestPrices();

    return () => clearInterval(pollInterval);
  }, []);

  // Sync custom listed coins from Firebase/State into the unified cryptos list
  useEffect(() => {
    if (!customCoins) return;

    setCryptos((prev) => {
      // 1. Filter out deleted or no longer listed custom coins
      const validCustomCoinIds = new Set(
        customCoins
          .filter(c => c.status === 'Listed' && !['BXC', 'QTX', 'ME'].includes(c.symbol.toUpperCase()))
          .map(c => c.id)
      );

      const nextCryptos = prev.filter(c => {
        if (!c.id?.endsWith('-binance')) {
          return validCustomCoinIds.has(c.id || '');
        }
        return true;
      });

      // 2. Add or update listed custom coins
      customCoins.forEach(custom => {
        const initialSymbols = initialData.map(d => d.symbol.toUpperCase());
        const isBanned = ['BXC', 'QTX', 'ME'].includes(custom.symbol.toUpperCase());
        const isDuplicate = initialSymbols.includes(custom.symbol.toUpperCase());

        if (custom.status === 'Listed' && !isBanned && !isDuplicate) {
          const idx = nextCryptos.findIndex(c => c.id === custom.id);
          const initialPrice = Number(custom.initialPrice) || 0.1;
          const dbPrice = Number(custom.currentPrice || custom.initialPrice) || 0.1;

          if (idx === -1) {
            // New listed custom coin, add it
            const change = dbPrice - initialPrice;
            const changePercent = initialPrice > 0 ? (change / initialPrice) * 100 : 0;
            const sparkline = custom.sparkline && custom.sparkline.length >= 5 
              ? [...custom.sparkline] 
              : Array.from({ length: 20 }, (_, i) => {
                  const ratio = i / 19;
                  const wave = Math.sin(i / 2) * 0.015 + Math.cos(i / 4) * 0.01;
                  const noise = (Math.random() - 0.5) * 0.01;
                  const val = dbPrice * (0.96 + (ratio * 0.04) + wave + noise);
                  return { value: Number(val) };
                });

            nextCryptos.push({
              id: custom.id,
              symbol: custom.symbol,
              name: custom.name,
              price: dbPrice,
              change,
              changePercent,
              sparkline,
              logo: custom.logo || `https://api.dicebear.com/7.x/identicon/svg?seed=${custom.symbol}`
            });
          } else {
            // Check if baseline dB price has moved significantly due to user trade
            const existing = nextCryptos[idx];
            if (Math.abs(existing.price - dbPrice) / dbPrice > 0.001) {
              const change = dbPrice - initialPrice;
              const changePercent = initialPrice > 0 ? (change / initialPrice) * 100 : 0;
              
              const updatedSparkline = [...(existing.sparkline || [])];
              updatedSparkline.push({ value: dbPrice });
              if (updatedSparkline.length > 40) {
                updatedSparkline.shift();
              }

              nextCryptos[idx] = {
                ...existing,
                price: dbPrice,
                change,
                changePercent,
                sparkline: updatedSparkline
              };
            }
          }
        }
      });

      return nextCryptos;
    });
  }, [customCoins, initialData]);

  // Unified high-fidelity background simulation loop for continuous live price ticks
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      const wsActive = (now - lastMessageTime.current) < 4000;

      setCryptos((prev) =>
        prev.map((crypto) => {
          const isCustom = !crypto.id?.endsWith('-binance');

          // If Binance WebSocket is alive and active, let WS handle standard cryptos
          if (wsActive && !isCustom) {
            return crypto;
          }

          // Otherwise, simulate organic random walk micro-fluctuations (keeps system continuously humming & responsive)
          const isBtc = crypto.symbol === 'BTC';
          const isEth = crypto.symbol === 'ETH';
          const maxSwing = isBtc ? 0.00018 : isEth ? 0.00025 : 0.00065; // swing limit multiplier
          const changePercentRandom = (Math.random() - 0.5) * maxSwing;

          const currentPrice = crypto.price || 0.1;
          const nextPrice = currentPrice * (1 + changePercentRandom);

          // Find baseline price to calculate updated percentage and value difference correctly
          const basePrice = currentPrice / (1 + (crypto.changePercent / 100));
          const nextChange = nextPrice - basePrice;
          const nextChangePercent = basePrice > 0 ? (nextChange / basePrice) * 100 : 0;

          const newSparkline = [...(crypto.sparkline || [])];
          if (newSparkline.length > 0) {
            newSparkline.push({ value: nextPrice });
            if (newSparkline.length > 30) {
              newSparkline.shift();
            }
          }

          return {
            ...crypto,
            price: nextPrice,
            change: nextChange,
            changePercent: nextChangePercent,
            sparkline: newSparkline,
          };
        })
      );
    }, 1200);

    return () => clearInterval(timer);
  }, []);

  return cryptos;
}
