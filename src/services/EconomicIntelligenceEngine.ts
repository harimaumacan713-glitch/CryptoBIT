import { writeBatch, doc } from 'firebase/firestore';
import { IPOCoin } from '../types';

export class EconomicIntelligenceEngine {
    static processTranscript(
        transcript: string,
        currentSentiment: number,
        coins: IPOCoin[],
        db: any,
        isFounder: boolean
    ) {
        const lower = transcript.toLowerCase();
        
        let posStrength = 0;
        let negStrength = 0;
        
        const positiveKeywords = ['liquidity', 'expansion', 'stimulus', 'growth', 'easing', 'bullish'];
        const negativeKeywords = ['tightening', 'recession', 'inflation', 'crisis', 'collapse', 'bearish'];

        positiveKeywords.forEach(kw => {
            if (lower.includes(kw)) posStrength++;
        });
        
        negativeKeywords.forEach(kw => {
            if (lower.includes(kw)) negStrength++;
        });

        let newSentiment = 50;
        if (posStrength > negStrength) {
            newSentiment = Math.min(100, 50 + (posStrength * 10)); 
        } else if (negStrength > posStrength) {
            newSentiment = Math.max(0, 50 - (negStrength * 10));
        } else if (lower.includes('stabil') || lower.includes('moderat')) {
            newSentiment = 50;
        } else if (posStrength === 0 && negStrength === 0) {
            newSentiment = currentSentiment || 50;
        }

        const rawKwStr = posStrength > negStrength ? posStrength * 5 : -negStrength * 5; 
        const kwStrength = Math.max(-100, Math.min(100, rawKwStr));

        const batch = isFounder ? writeBatch(db) : null;
        const impacts: any[] = [];

        for (const coin of coins) {
            const commConf = 50 + (coin.holders?.length || 0) * 0.5;
            const tradingVolume = (Number(coin.buyVolume) || 0) + (Number(coin.sellVolume) || 0);
            const volumeScore = Math.min(100, (tradingVolume / 1000) * 10);
            const dirSentiment = (newSentiment - 50) * 2; 
            
            let impactScoreRaw = 0;
            const volatilityRandomizer = 0.8 + (Math.random() * 0.4); // 0.8x to 1.2x
            
            if (posStrength > negStrength) {
               // Base positive impact (1% to 15%)
               const baseImpact = 1 + (Math.min(15, posStrength * 2.5));
               const magnitudeMultiplier = 1 + ((Math.min(100, commConf) * 0.20 + volumeScore * 0.20) / 100); 
               impactScoreRaw = Math.min(25, baseImpact * magnitudeMultiplier * volatilityRandomizer); 
            } else if (negStrength > posStrength) {
               // Base negative impact (-1% to -15%)
               const baseImpact = -1 - (Math.min(15, negStrength * 2.5));
               const magnitudeMultiplier = 1 + ((Math.min(100, commConf) * 0.20 + volumeScore * 0.20) / 100); 
               impactScoreRaw = Math.max(-25, baseImpact * magnitudeMultiplier * volatilityRandomizer); 
            } else {
               // Neutral but with slight chop
               impactScoreRaw = (Math.random() * 2) - 1; // -1% to 1%
            }
            
            // To fulfill "trigger price updates", we will directly simulate a price shock here if founder.
            if (isFounder && batch && impactScoreRaw !== 0) {
                const currentPrice = Number(coin.currentPrice) || 0.1;
                const nextPrice = Math.max(0.0001, currentPrice * (1 + (impactScoreRaw / 100)));
                
                const currentUsd = Number(coin.usdPool) || Number(coin.liquidity) || 100000;
                const currentToken = Number(coin.tokenPool) || (currentUsd / currentPrice);
                
                // Shock percentage 
                const shockPct = impactScoreRaw / 100; // e.g. 10% = 0.1
                
                let priceShockToken = 0;
                if (shockPct > 0) {
                    priceShockToken = currentToken * shockPct * -0.5; // token decreases when people buy (bullish)
                } else {
                    priceShockToken = currentToken * Math.abs(shockPct) * 0.5; // token increases when people sell (bearish)
                }
                
                const tokenPoolNew = Math.max(currentToken * 0.05, currentToken + priceShockToken);
                const usdPoolNew = tokenPoolNew * nextPrice; 
                
                const sparkline = coin.sparkline || [];
                const newSparkline = [...sparkline, { value: nextPrice }].slice(-50);
                
                const history = coin.history1m || [];
                const lastHistory = history[history.length - 1];
                let newHistory1m = [...history];
                
                if (lastHistory) {
                   const updatedLastEntry = {
                      ...lastHistory,
                      close: nextPrice,
                      high: Math.max(lastHistory.high, nextPrice),
                      low: Math.min(lastHistory.low, nextPrice),
                      volume: lastHistory.volume + (usdPoolNew * Math.abs(shockPct))
                   };
                   newHistory1m[newHistory1m.length - 1] = updatedLastEntry;
                }
                
                const sanitizedMarketCap = (Number(coin.totalSupply || 10000000) * nextPrice);
                const volumeChange = usdPoolNew * Math.abs(shockPct);
                const sanitizedVolume24h = (Number(coin.volume24h) || 0) + volumeChange;

                batch.update(doc(db, 'coins', coin.id), {
                    marketImpact: impactScoreRaw,
                    currentPrice: nextPrice,
                    usdPool: usdPoolNew,
                    tokenPool: tokenPoolNew,
                    liquidity: Math.max(0, (coin.liquidity || 0) + (usdPoolNew - currentUsd)),
                    sparkline: newSparkline,
                    history1m: newHistory1m,
                    marketCap: sanitizedMarketCap,
                    volume24h: sanitizedVolume24h,
                    lastFedUpdate: new Date().toISOString()
                });
            }

            const impactDisplay = impactScoreRaw > 0 ? `+${impactScoreRaw.toFixed(1)}%` : `${impactScoreRaw.toFixed(1)}%`;
            const coinSentiment = impactScoreRaw === 0 ? 'Neutral' : impactScoreRaw >= 10 ? 'Very Bullish' : impactScoreRaw > 0 ? 'Bullish' : impactScoreRaw > -10 ? 'Bearish' : 'Very Bearish';
            
            impacts.push({
                symbol: coin.symbol,
                impact: impactDisplay,
                sentiment: coinSentiment,
                rawScore: impactScoreRaw,
                newPrice: (Number(coin.currentPrice) || 0.1) * (1 + (impactScoreRaw / 100))
            });
        }

        return { newSentiment, posStrength, negStrength, impacts, batch };
    }

    static processGeminiAnalysis(
        geminiData: { sentiment: number; impacts: { symbol: string; rawScore: number }[] },
        coins: IPOCoin[],
        db: any,
        isFounder: boolean
    ) {
        const { sentiment: newSentiment, impacts: geminiImpacts } = geminiData;
        const batch = isFounder ? writeBatch(db) : null;
        const impacts: any[] = [];

        for (const coin of coins) {
            // Find score for this coin or default to 0
            const geminiItem = geminiImpacts.find(i => i.symbol === coin.symbol);
            let impactScoreRaw = geminiItem ? Number(geminiItem.rawScore) : 0;
            
            // Add some realistic volatility
            if (impactScoreRaw !== 0) {
               const volatilityRandomizer = 0.8 + (Math.random() * 0.4); 
               impactScoreRaw = impactScoreRaw * volatilityRandomizer;
            } else {
               impactScoreRaw = (Math.random() * 1) - 0.5; // slight chop
            }
            
            if (isFounder && batch && impactScoreRaw !== 0) {
                const currentPrice = Number(coin.currentPrice) || 0.1;
                const nextPrice = Math.max(0.0001, currentPrice * (1 + (impactScoreRaw / 100)));
                
                const currentUsd = Number(coin.usdPool) || Number(coin.liquidity) || 100000;
                const currentToken = Number(coin.tokenPool) || (currentUsd / currentPrice);
                
                const shockPct = impactScoreRaw / 100;
                
                let priceShockToken = 0;
                if (shockPct > 0) {
                    priceShockToken = currentToken * shockPct * -0.5;
                } else {
                    priceShockToken = currentToken * Math.abs(shockPct) * 0.5;
                }
                
                const tokenPoolNew = Math.max(currentToken * 0.05, currentToken + priceShockToken);
                const usdPoolNew = tokenPoolNew * nextPrice; 
                
                const sparkline = coin.sparkline || [];
                const newSparkline = [...sparkline, { value: nextPrice }].slice(-50);
                
                const history = coin.history1m || [];
                const lastHistory = history[history.length - 1];
                let newHistory1m = [...history];
                
                if (lastHistory) {
                   const updatedLastEntry = {
                      ...lastHistory,
                      close: nextPrice,
                      high: Math.max(lastHistory.high, nextPrice),
                      low: Math.min(lastHistory.low, nextPrice),
                      volume: lastHistory.volume + (usdPoolNew * Math.abs(shockPct))
                   };
                   newHistory1m[newHistory1m.length - 1] = updatedLastEntry;
                }
                
                const sanitizedMarketCap = (Number(coin.totalSupply || 10000000) * nextPrice);
                const volumeChange = usdPoolNew * Math.abs(shockPct);
                const sanitizedVolume24h = (Number(coin.volume24h) || 0) + volumeChange;

                batch.update(doc(db, 'coins', coin.id), {
                    marketImpact: impactScoreRaw,
                    currentPrice: nextPrice,
                    usdPool: usdPoolNew,
                    tokenPool: tokenPoolNew,
                    liquidity: Math.max(0, (coin.liquidity || 0) + (usdPoolNew - currentUsd)),
                    sparkline: newSparkline,
                    history1m: newHistory1m,
                    marketCap: sanitizedMarketCap,
                    volume24h: sanitizedVolume24h,
                    lastFedUpdate: new Date().toISOString()
                });
            }

            const impactDisplay = impactScoreRaw > 0 ? `+${impactScoreRaw.toFixed(1)}%` : `${impactScoreRaw.toFixed(1)}%`;
            const coinSentiment = impactScoreRaw === 0 ? 'Neutral' : impactScoreRaw >= 10 ? 'Very Bullish' : impactScoreRaw > 0 ? 'Bullish' : impactScoreRaw > -10 ? 'Bearish' : 'Very Bearish';
            
            impacts.push({
                symbol: coin.symbol,
                impact: impactDisplay,
                sentiment: coinSentiment,
                rawScore: impactScoreRaw,
                newPrice: (Number(coin.currentPrice) || 0.1) * (1 + (impactScoreRaw / 100))
            });
        }

        return { impacts, batch };
    }
}
