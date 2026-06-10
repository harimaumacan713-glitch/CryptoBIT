import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Activity, 
  AlertCircle, 
  BarChart3, 
  Newspaper,
  Calendar,
  Clock,
  HelpCircle,
  Info
} from 'lucide-react';
import { useFirebase } from './FirebaseProvider';

interface CalendarEvent {
  date: string;
  time: string;
  currency: string;
  impact: 'high' | 'medium' | 'low';
  event: string;
  actual: string;
  forecast: string;
  previous: string;
}

const forexFactoryEvents: CalendarEvent[] = [
  {
    date: 'Wednesday, June 10, 2026',
    time: '19:30',
    currency: 'USD',
    impact: 'high',
    event: 'CPI y/y (Consumer Price Index)',
    actual: '3.3%',
    forecast: '3.4%',
    previous: '3.4%'
  },
  {
    date: 'Wednesday, June 10, 2026',
    time: '19:30',
    currency: 'USD',
    impact: 'high',
    event: 'Core CPI m/m',
    actual: '0.2%',
    forecast: '0.3%',
    previous: '0.3%'
  },
  {
    date: 'Wednesday, June 10, 2026',
    time: '21:30',
    currency: 'USD',
    impact: 'medium',
    event: 'Crude Oil Inventories',
    actual: '1.2M',
    forecast: '-1.2M',
    previous: '-1.4M'
  },
  {
    date: 'Thursday, June 11, 2026',
    time: '19:30',
    currency: 'USD',
    impact: 'high',
    event: 'Core PPI m/m',
    actual: 'Pending',
    forecast: '0.1%',
    previous: '0.5%'
  },
  {
    date: 'Friday, June 12, 2026',
    time: '21:00',
    currency: 'USD',
    impact: 'low',
    event: 'Prelim UoM Consumer Sentiment',
    actual: 'Pending',
    forecast: '69.1',
    previous: '69.1'
  },
  {
    date: 'Tuesday, June 16, 2026',
    time: '19:30',
    currency: 'USD',
    impact: 'medium',
    event: 'Core Retail Sales m/m',
    actual: 'Pending',
    forecast: '0.2%',
    previous: '0.1%'
  },
  {
    date: 'Wednesday, June 17, 2026',
    time: '01:00',
    currency: 'USD',
    impact: 'high',
    event: 'FOMC Statement & Rate Decision',
    actual: 'Pending',
    forecast: '5.25%',
    previous: '5.25%'
  },
  {
    date: 'Wednesday, June 17, 2026',
    time: '01:00',
    currency: 'USD',
    impact: 'high',
    event: 'Federal Funds Rate',
    actual: 'Pending',
    forecast: '5.25%',
    previous: '5.25%'
  },
  {
    date: 'Wednesday, June 17, 2026',
    time: '01:30',
    currency: 'USD',
    impact: 'high',
    event: 'FOMC Press Conference (Powell Speaks)',
    actual: 'Pers Live',
    forecast: '-',
    previous: '-'
  },
  {
    date: 'Thursday, June 18, 2026',
    time: '19:30',
    currency: 'USD',
    impact: 'high',
    event: 'Philly Fed Manufacturing Index',
    actual: 'Pending',
    forecast: '2.5',
    previous: '1.8'
  },
  {
    date: 'Thursday, June 18, 2026',
    time: '19:30',
    currency: 'USD',
    impact: 'medium',
    event: 'Unemployment Claims',
    actual: 'Pending',
    forecast: '215K',
    previous: '229K'
  },
  {
    date: 'Friday, July 3, 2026',
    time: '19:30',
    currency: 'USD',
    impact: 'high',
    event: 'Non-Farm Employment Change (NFP)',
    actual: 'Pending',
    forecast: '175K',
    previous: '165K'
  },
  {
    date: 'Friday, July 3, 2026',
    time: '19:30',
    currency: 'USD',
    impact: 'high',
    event: 'Unemployment Rate',
    actual: 'Pending',
    forecast: '3.9%',
    previous: '4.0%'
  }
];

export default function FedDashboard() {
  const { coins } = useFirebase();
  const [metrics, setMetrics] = useState({
    marketCap: 452093847200,
    volume24h: 320492840,
    activeCoins: 0,
    sentiment: 72, // 0-100
  });

  useEffect(() => {
    if (coins && coins.length > 0) {
      setMetrics(prev => ({
        ...prev,
        activeCoins: coins.length,
        marketCap: coins.reduce((acc, c) => acc + (c.marketCap || 100000), 0)
      }));
    }
  }, [coins]);

  const [activeSubTab, setActiveSubTab] = useState('Forex Calendar');

  const getImpactStyle = (impact: 'high' | 'medium' | 'low') => {
    if (impact === 'high') {
      return {
        bg: 'bg-red-500',
        text: 'text-red-500',
        badge: 'bg-red-50 border-red-200 text-red-500'
      };
    }
    if (impact === 'medium') {
      return {
        bg: 'bg-orange-500',
        text: 'text-orange-500',
        badge: 'bg-orange-50 border-orange-200 text-orange-500'
      };
    }
    return {
      bg: 'bg-yellow-500',
      text: 'text-yellow-500',
      badge: 'bg-yellow-50 border-yellow-200 text-yellow-500'
    };
  };

  return (
    <div id="fed-dashboard-container" className="p-6 bg-slate-50 min-h-screen text-slate-900 font-sans">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-black flex items-center gap-2.5 text-slate-950">
            <Shield className="w-6 h-6 text-[#00AE64]" />
            FEDERAL RESERVE ECONOMIC CONTROL HUB
          </h1>
          <p className="text-xs text-slate-500 font-sans mt-1">
            Data Pengumuman Moneter, Suku Bunga FOMC, dan Kalender Dampak Makro Forex Factory.
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {['Forex Calendar', 'Dashboard', 'Reserve Bank', 'News'].map(tab => (
            <button 
              key={tab} 
              id={`fed-tab-${tab.toLowerCase().replace(' ', '-')}`}
              onClick={() => setActiveSubTab(tab)}
              className={`text-[10px] font-black px-4 py-2 rounded-lg tracking-wider uppercase transition-all duration-200 ${activeSubTab === tab ? 'bg-slate-950 text-white shadow-sm' : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </header>

      {/* Main Content Area */}
      {activeSubTab === 'Forex Calendar' && (
        <div className="space-y-6">
          {/* Calendar Header Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0 border border-red-500/10">
                  <Calendar className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-slate-950 uppercase tracking-wide">Real-time Kalender Forex Factory</h2>
                  <p className="text-xs text-slate-500">Mata uang rujukan utama global (USD) beserta tingkat risiko dampak pasar.</p>
                </div>
              </div>
              
              <div className="flex gap-4 text-xs font-semibold text-slate-650 border-l border-slate-150 pl-4 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 bg-red-500 rounded-sm"></div>
                  <span>High Impact (Merah)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 bg-orange-500 rounded-sm"></div>
                  <span>Medium (Oranye)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 bg-yellow-500 rounded-sm"></div>
                  <span>Low (Kuning)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Forex Factory Table */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <span className="text-xs font-black text-slate-800 uppercase tracking-widest">Jadwal Pengumuman & Rapat Moneter</span>
              <span className="text-[10px] font-bold text-slate-500 bg-slate-200/50 px-2.5 py-1 rounded">Waktu: WIB (GMT+7)</span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100/70 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-2.5 px-4 font-black">Tanggal</th>
                    <th className="py-2.5 px-4 font-black">Waktu</th>
                    <th className="py-2.5 px-2 font-black">Mata Uang</th>
                    <th className="py-2.5 px-3 font-black text-center">Dampak</th>
                    <th className="py-2.5 px-4 font-black min-w-[240px]">Acara / Data Ekonomi</th>
                    <th className="py-2.5 px-4 font-black text-right">Aktual</th>
                    <th className="py-2.5 px-4 font-black text-right">Konsensus</th>
                    <th className="py-2.5 px-4 font-black text-right">Sebelumnya</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 text-xs font-sans">
                  {forexFactoryEvents.map((item, idx) => {
                    const styles = getImpactStyle(item.impact);
                    const isPending = item.actual === 'Pending';
                    const isPersLive = item.actual === 'Pers Live';
                    
                    return (
                      <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-700 whitespace-nowrap">{item.date}</td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-600">{item.time}</td>
                        <td className="py-3 px-2 font-black text-slate-800 tracking-tight">{item.currency}</td>
                        <td className="py-3 px-3 text-center align-middle">
                          <span className={`inline-block w-4 h-3.5 rounded-sm ${styles.bg} border-0 shadow-sm`} title={`${item.impact.toUpperCase()} IMPACT`} />
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-900 leading-snug">
                          {item.event}
                        </td>
                        <td className="py-3 px-4 font-mono text-right">
                          {isPending ? (
                            <span className="text-[10px] font-bold bg-slate-100 border border-slate-200 text-slate-500 px-1.5 py-0.5 rounded">Pending</span>
                          ) : isPersLive ? (
                            <span className="text-[10px] font-black bg-red-600 text-white px-2 py-0.5 rounded animate-pulse shadow-sm">PERS LIVE</span>
                          ) : (
                            <span className="font-extrabold text-[#00AE64]">{item.actual}</span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600 text-right font-medium">{item.forecast}</td>
                        <td className="py-3 px-4 font-mono text-slate-600 text-right font-medium">{item.previous}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            <div className="p-4 bg-slate-50/50 border-t border-slate-100 text-[11px] text-slate-500 leading-relaxed font-sans font-medium">
              <div className="flex gap-2 items-start text-xs text-slate-650">
                <Info className="w-4 h-4 shrink-0 text-[#00AE64] mt-0.5" />
                <span>
                  <strong>Tip Trading Bergaransi:</strong> Tingkat volatilitas pasar biasanya melonjak drastis dalam jangka waktu rujukan rilis data berlabel <strong>Dampak Merah (High Impact)</strong>. Disarankan untuk memantau status secara teliti sebelum mengambil keputusan transaksi leverage.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'Dashboard' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Total Kapitalisasi Pasar', value: `$${(metrics.marketCap / 1e9).toFixed(2)}B`, Icon: DollarSign },
              { label: 'Volume Perdagangan 24j', value: `$${(metrics.volume24h / 1e6).toFixed(2)}M`, Icon: Activity },
              { label: 'Koin Terdaftar Aktif', value: metrics.activeCoins, Icon: BarChart3 },
              { label: 'Sentimen Pasar Moneter', value: `${metrics.sentiment > 50 ? 'BULLISH' : 'BEARISH'} (${metrics.sentiment})`, Icon: metrics.sentiment > 50 ? TrendingUp : TrendingDown },
            ].map((item, i) => (
              <div key={i} className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-2 mb-2 text-slate-500">
                  <item.Icon className="w-4 h-4 text-slate-400" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
                </div>
                <div className="text-lg font-black font-mono text-slate-900">{item.value}</div>
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h2 className="text-sm font-black flex items-center gap-2 mb-4 text-slate-900 uppercase tracking-wide">
                <Newspaper className="w-5 h-5 text-[#00AE64]" />
                Kebijakan Terkini FOMC & Makro Global
              </h2>
              <div className="space-y-4 text-xs font-sans">
                <div className="border-l-4 border-slate-900 pl-4 py-2.5 bg-slate-50 rounded-r-lg">
                  <span className="text-[9px] font-black text-slate-800 uppercase tracking-widest block mb-1">Rilis Kebijakan Moneter</span>
                  <p className="font-semibold text-slate-700 leading-relaxed">Likuiditas pasar keseluruhan disesuaikan guna menjaga kestabilan koin berkapitalisasi rendah dari aksi spekulasi berisiko tinggi.</p>
                </div>
                <div className="border-l-4 border-[#00AE64] pl-4 py-2.5 bg-slate-50 rounded-r-lg">
                  <span className="text-[9px] font-black text-[#00AE64] uppercase tracking-widest block mb-1 font-bold">Target Suku Bunga Utama</span>
                  <p className="font-semibold text-slate-700 leading-relaxed font-sans">Mayoritas anggota dewan gubernur sepakat menargetkan posisi batas atas suku bunga di kisaran 5.25% - 5.50% untuk meredam laju inflasi inti.</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between">
              <div>
                <h2 className="text-sm font-black flex items-center gap-2 mb-4 text-slate-900 uppercase tracking-wide">
                  <Shield className="w-5 h-5 text-slate-700" />
                  Dana Cadangan Likuiditas
                </h2>
                <div className="space-y-4 text-xs font-mono">
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-500 font-sans font-semibold">Bruto Cadangan</span> 
                    <span className="font-black text-slate-900">$42,902,301 USD</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-500 font-sans font-semibold">Status Alokasi</span> 
                    <span className="font-black text-[#00AE64]">Stabil & Aman</span>
                  </div>
                </div>
              </div>
              <div className="pt-4">
                <p className="text-[10px] text-slate-400 font-medium font-sans leading-relaxed mb-3">Dana cadangan didelegasikan secara otomatis oleh smart contract multi-sig berstandar tinggi.</p>
                <button className="w-full bg-slate-950 text-white py-2 rounded-lg text-xs font-black uppercase tracking-wider hover:bg-slate-800 transition-colors">
                  Periksa Hash Cadangan
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {activeSubTab === 'Reserve Bank' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm max-w-4xl">
          <h2 className="text-sm font-black uppercase tracking-wide flex items-center gap-2.5 mb-4 text-slate-950">
            <Shield className="w-5 h-5 text-[#00AE64]" />
            Federal Digital Reserve Bank System
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed mb-6 font-semibold">
            Pusat tata kelola kontrol neraca anggaran Federal Reserve digital. Melalui sistem ini, data penanaman modal nirkabel serta pengawasan sekuritas tervisualisasi secara transparan bagi publik.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 border border-slate-200 rounded-lg bg-slate-50/50">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Total Penyaluran Kredit</span>
              <span className="text-lg font-black font-mono text-slate-900">$12,854,902,300</span>
            </div>
            <div className="p-4 border border-slate-200 rounded-lg bg-slate-50/50">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Rasio Pinjaman Bergaransi</span>
              <span className="text-lg font-black font-mono text-slate-900">105.42%</span>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'News' && (
        <div className="space-y-4 max-w-4xl">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-sm font-black uppercase tracking-wide flex items-center gap-2 mb-4 text-slate-950">
              <Newspaper className="w-5 h-5 text-[#00AE64]" />
              Warta Makroekonomi & Geopolitik Global
            </h2>
            <div className="space-y-4 divide-y divide-slate-100 font-sans text-xs">
              <div className="pt-3">
                <span className="text-[9px] font-bold text-slate-400 uppercase">1 jam yang lalu · Reuters</span>
                <h3 className="font-bold text-slate-900 mt-0.5 text-xs">Ekspektasi Inflasi Konsumen AS Turun Mendorong Stimulus Eksternal Mengalir Menuju Bursa Berjangka</h3>
                <p className="text-slate-500 mt-1 leading-relaxed">Pengamat ekonomi memperkirakan laju suku bunga global yang lebih defensif pada semester kedua tahun ini menyusul pelemahan permintaan konsumsi barang non-esensial.</p>
              </div>
              <div className="pt-4">
                <span className="text-[9px] font-bold text-slate-400 uppercase">3 jam yang lalu · Wall Street Journal</span>
                <h3 className="font-bold text-slate-900 mt-0.5 text-xs">Aliansi Perdagangan Energi Regional Setuju Menjaga Cadangan Pasokan Minyak Mentah Jangka Menengah</h3>
                <p className="text-slate-500 mt-1 leading-relaxed">Pembatasan jumlah produksi minyak mentah ini dirancang guna mencegah jatuhnya harga acuan minyak WTI di tengah peningkatan produksi energi bersih alternatif.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
