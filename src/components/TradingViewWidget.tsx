import React, { useMemo } from 'react';

interface TradingViewWidgetProps {
  symbol: string;
  timeframe: string;
}

export default function TradingViewWidget({ symbol, timeframe }: TradingViewWidgetProps) {
  // Map our symbol to a standard TradingView exchange/pair format.
  // Assuming BINANCE as preferred exchange for external assets.
  const tvSymbol = `BINANCE:${symbol}USDT`;

  const intervalMap: Record<string, string> = {
    '1m': '1',
    '5m': '5',
    '15m': '15',
    '30m': '30',
    '1H': '60',
    '4H': '240',
    '1D': 'D',
    '1W': 'W',
    '1M': 'M'
  };
  const tvInterval = intervalMap[timeframe] || '1';

  return (
    <div className="h-96 w-full relative">
        <iframe
            src={`https://s.tradingview.com/widgetembed/?symbol=${tvSymbol}&theme=light&interval=${tvInterval}&hideideas=1&studies=%5B%5D&theme=light&style=1&timezone=Etc%2FUTC&hide_side_toolbar=0&withdateranges=1&allow_symbol_change=0&container_id=tradingview_widget`}
            width="100%"
            height="100%"
            frameBorder="0"
            style={{ border: 'none' }}
            allowFullScreen={true}
        />
    </div>
  );
}
