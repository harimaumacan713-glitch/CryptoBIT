import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useFirebase } from './FirebaseProvider';
import { ShieldCheck, Layers, ArrowRight, Wallet, Users, BarChart3, TrendingUp } from 'lucide-react';

// Highly-polished floating vector tokens to animate in 3D-space
const floatingTokens = [
  {
    id: 'btc',
    name: 'Bitcoin',
    symbol: '₿',
    color: '#F7931A',
    glowColor: 'rgba(247, 147, 26, 0.22)',
    size: 'w-14 h-14 sm:w-20 sm:h-20',
    initialX: '12%',
    initialY: '25%',
    duration: 8,
    delay: 0,
    icon: (
      <svg viewBox="0 0 24 24" className="w-1/2 h-1/2 text-[#F7931A]" fill="currentColor">
        <path d="M23.633 15.018c-.732 2.937-3.878 4.73-6.814 3.997l-.42-.107.085-.342.342-.1.085-.343-.448-.112.512-2.052.448.112-.426 1.71c1.884-.24 3.19-.944 3.633-2.72.356-1.428-.152-2.613-1.488-3.136.932-.218 1.547-.944 1.706-2.327.227-.912-.132-1.927-.992-2.302-.596-.26-1.5-.326-2.85-.382l.462-1.854-.424-.105-.448 1.798-.448-.112.448-1.798-.42-.105-.453 1.82a20.04 20.04 0 0 0-1.572-.271l.462-1.854-.424-.105-.448 1.8-.448-.112.448-1.8-.423-.105-.472 1.892c-1.077-.145-2.2-.284-3.32-.426l.46-1.848-.422-.105-.448 1.798-.448-.112.448-1.798-.42-.105-.455 1.823c-.767-.09-1.517-.184-2.222-.276l.462-1.854-.425-.105-.448 1.798-.448-.112.448-1.798-.42-.105-.46 1.846c-1.916-.242-3.364-.484-3.364-.484l-.089.356s1.011.233 1.011.233c.552.126.65.514.536.974l-1.282 5.15c.078.02.179.052.28.087l-.28-.07c-.1.311-.274.67-.536.63-.058-.009-.99-.23-.99-.23l-.18.723s.823.189 1.332.307c.41.095.534.39.432.8l-1.048 4.2c-.067.268-.218.421-.491.358-.05-.011-1.011-.233-1.011-.233l-.22.883s2.969.664 3.82.859c.703.16 1.222.096 1.545-.192A1.82 1.82 0 0 0 5.483 14.5c.348-.12.632-.34.823-.62.306-.447.382-1.05.21-1.737l-.54-2.164a6.52 6.52 0 0 1-.365-.417l.035.01c.218.064.552.128.914.192.427.075.767-.021.986-.239l.732-2.936c.079-.317.01-.54-.184-.668a1.21 1.21 0 0 0-.585-.116l-.28-.07c.184.043.342.08.472.112l1.048-4.2c.114-.459.213-.807-.052-.962-.074-.044-.99-.23-.99-.23l.18-.723s.823.189 1.332.307c.41.095.534.39.432.8l-1.048 4.2c-.067.268-.218.421-.491.358-.05-.011-1.011-.233-1.011-.233l-.22.883s2.969.664 3.82.859c.277.063.535.105.776.134l.115-.46c.114-.458.212-.806-.053-.961-.073-.044-.99-.23-.99-.23l.18-.723s.823.189 1.332.307c.41.095.534.39.432.8l-1.048 4.2c-.067.268-.218.421-.491.358-.05-.011-1.011-.233-1.011-.233l2.875.66c1.15.264 2.013.153 2.502-.38.39-.425.438-1.083.185-1.921-.301-1.205-1.127-1.894-2.315-1.944 1.137-.087 1.83-.564 2.103-1.657z" />
      </svg>
    )
  },
  {
    id: 'eth',
    name: 'Ethereum',
    symbol: 'Ξ',
    color: '#8C8CFC',
    glowColor: 'rgba(140, 140, 252, 0.22)',
    size: 'w-16 h-16 sm:w-24 sm:h-24',
    initialX: '75%',
    initialY: '18%',
    duration: 10,
    delay: 1,
    icon: (
      <svg viewBox="0 0 24 24" className="w-1/2 h-1/2 text-[#8C8CFC]" fill="currentColor">
        <path d="M11.944 17.806L5.587 14.05l6.357 3.756 6.356-3.756-6.356 3.756zm0-11.75l-6.287 10.45 6.287 3.655 6.287-3.655-6.287-10.45zm0-.67L19.38 15.3l-7.436 4.316-7.436-4.316 7.436-9.914zm0 .835l-5.617 9.38h11.234l-5.617-9.38z" />
      </svg>
    )
  },
  {
    id: 'usdt',
    name: 'Tether',
    symbol: '₮',
    color: '#00AE64',
    glowColor: 'rgba(0, 174, 100, 0.22)',
    size: 'w-12 h-12 sm:w-18 sm:h-18',
    initialX: '84%',
    initialY: '72%',
    duration: 9,
    delay: 2,
    icon: (
      <svg viewBox="0 0 24 24" className="w-1/2 h-1/2 text-[#00AE64]" fill="none" stroke="currentColor" strokeWidth="2.5">
        <circle cx="12" cy="12" r="10" />
        <path d="M7 8h10M12 8v9M9 13h6" strokeLinecap="round" />
      </svg>
    )
  },
  {
    id: 'sol',
    name: 'Solana',
    symbol: 'S',
    color: '#9945FF',
    glowColor: 'rgba(153, 69, 255, 0.2)',
    size: 'w-14 h-14 sm:w-16 sm:h-16',
    initialX: '8%',
    initialY: '66%',
    duration: 11,
    delay: 0.5,
    icon: (
      <svg viewBox="0 0 24 24" className="w-1/2 h-1/2 text-[#9945FF]" fill="currentColor">
        <path d="M4.3 19.3l2.8-2.8h12.6l-2.8 2.8H4.3zm12.6-9.8l2.8-2.8H7.1l-2.8 2.8h12.6zm0-4.8l2.8-2.8H7.1l-2.8 2.8h12.6z" />
      </svg>
    )
  }
];

export default function SplashLoginScreen({ onLoginSuccess }: { onLoginSuccess: () => void }) {
  const { user, login, loading } = useFirebase();
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    // Elegant transition loading wait
    const timer = setTimeout(() => {
      setShowLogin(true);
    }, 2800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (user && showLogin) {
      onLoginSuccess();
    }
  }, [user, showLogin, onLoginSuccess]);

  const handleLogin = async () => {
    try {
      await login();
      onLoginSuccess();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 min-h-screen bg-[#070A13] flex items-center justify-center overflow-x-hidden overflow-y-auto z-[100] font-sans selection:bg-[#00AE64]/30">
      
      {/* 1. CHROMELESS BACKGROUND ENGINE - NEON SCROLL, COLOR EMISSIONS & FALLBACK VIDEO */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none bg-[#060810]">
        
        {/* Ambient fallback/underlay video */}
        <video 
          autoPlay 
          loop 
          muted 
          playsInline 
          className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-30 select-none brightness-50"
          poster="/src/assets/images/web3_banner_1779983854222.png"
        >
          <source src="/src/assets/video.mp4" type="video/mp4" />
          <source src="/video.mp4" type="video/mp4" />
          <source src="/src/assets/images/video.mp4" type="video/mp4" />
          <source src="https://assets.mixkit.co/videos/preview/mixkit-city-traffic-in-the-night-with-skyscrapers-31215-large.mp4" type="video/mp4" />
        </video>
        
        {/* Pure CSS/SVG Infinite-scrolling 3D Perspective Grid - ALWAYS GORGEOUSLY RUNNING! */}
        <div className="absolute inset-0 opacity-[0.16]" style={{ perspective: '300px' }}>
          <motion.div 
            animate={{ y: [0, 50] }}
            transition={{ repeat: Infinity, ease: "linear", duration: 3.5 }}
            className="absolute inset-0 w-[200%] h-[200%] left-[-50%] top-[-50%] bg-[linear-gradient(to_bottom,transparent_96%,rgba(0,174,100,0.6)_96%),linear-gradient(to_right,transparent_96%,rgba(0,174,100,0.6)_96%)] bg-[size:50px_50px]"
            style={{ transformOrigin: 'center center', transform: 'rotateX(62deg)' }}
          />
        </div>

        {/* Dynamic slow gradient bloom lights drifting on the backing layer */}
        <motion.div 
          animate={{ 
            x: [0, 40, -30, 0],
            y: [0, -50, 30, 0],
            scale: [1, 1.15, 0.9, 1]
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[10%] left-[15%] w-80 h-80 sm:w-[500px] h-[500px] bg-[#00AE64]/15 rounded-full blur-[120px] sm:blur-[160px]"
        />
        <motion.div 
          animate={{ 
            x: [0, -30, 40, 0],
            y: [0, 40, -50, 0],
            scale: [1, 0.9, 1.12, 1]
          }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-[10%] right-[10%] w-80 h-80 sm:w-[500px] h-[500px] bg-indigo-500/15 rounded-full blur-[120px] sm:blur-[160px]"
        />

        {/* 3D Orbiting/Floating High-Tech Digital Tokens (Full Vector real-time 60fps movement) */}
        {floatingTokens.map((token) => (
          <motion.div
            key={token.id}
            initial={{ x: token.initialX, y: token.initialY, scale: 0.8, opacity: 0 }}
            animate={{ 
              y: [token.initialY, 'calc(' + token.initialY + ' - 18px)', 'calc(' + token.initialY + ' + 18px)', token.initialY],
              x: [token.initialX, 'calc(' + token.initialX + ' + 10px)', 'calc(' + token.initialX + ' - 10px)', token.initialX],
              rotate: [0, 10, -10, 0],
              opacity: [0.75, 0.95, 0.8, 0.75],
              scale: [0.95, 1.05, 0.95, 0.95]
            }}
            transition={{ 
              duration: token.duration, 
              repeat: Infinity, 
              ease: "easeInOut",
              delay: token.delay
            }}
            className={`absolute ${token.size} rounded-full backdrop-blur-[3px] border border-white/10 p-0.5 shadow-2xl flex items-center justify-center`}
            style={{ 
              backgroundColor: 'rgba(11, 15, 26, 0.45)',
              boxShadow: `0 10px 35px -5px ${token.glowColor}, inset 0 1px 3px rgba(255,255,255,0.15)`
            }}
          >
            {/* Dynamic slow spinner ring inside each coin */}
            <div className="absolute inset-1 rounded-full border border-dashed border-white/20 animate-[spin_16s_linear_infinite]" />
            {token.icon}
          </motion.div>
        ))}

        {/* Futuristic Grid Micro-particles flowing diagonally across the scene */}
        {[...Array(16)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: "-10%", y: "110%" }}
            animate={{ opacity: [0, 0.7, 0.7, 0], x: ["0%", "100%"], y: ["110%", "-10%"] }}
            transition={{ duration: 8 + Math.random() * 8, repeat: Infinity, delay: Math.random() * 6, ease: "linear" }}
            className="absolute bg-white text-[9px] font-mono pointer-events-none font-bold"
            style={{
              left: `${Math.random() * 100}%`,
              color: i % 2 === 0 ? '#00AE64' : '#8C8CFC',
            }}
          >
            {i % 3 === 0 ? "0101" : i % 3 === 1 ? "TX_OK" : "BTC_BLOCK"}
          </motion.div>
        ))}
      </div>

      {/* 2. MAIN SECURE CONTAINER - ADAPTIVE GRID LAYOUT (RESPONSIVE FOR PHONES!) */}
      <div className="relative z-10 w-full min-h-screen flex flex-col justify-between p-4 sm:p-6 md:p-10 pointer-events-none">
        
        {/* HEADER BRANDING AREA: Neat & Compact */}
        <header className="w-full flex items-center justify-between pointer-events-auto mt-2 sm:mt-0 px-2 sm:px-4">
          <div className="flex items-center gap-3">
            {/* Animated rotating decorative circular orbit in top-left as in the video context */}
            <div className="relative flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 shrink-0">
              <svg className="absolute w-full h-full text-emerald-400 animate-[spin_8s_linear_infinite]" viewBox="0 0 100 100">
                <circle 
                  cx="50" 
                  cy="50" 
                  r="42" 
                  stroke="currentColor" 
                  strokeWidth="5" 
                  strokeDasharray="6 10" 
                  fill="none" 
                  className="drop-shadow-[0_0_6px_rgba(16,185,129,0.5)]"
                />
              </svg>
              {/* Inner brand identity circle */}
              <div className="w-7 h-7 sm:w-8 h-8 rounded-full bg-[#00AE64] flex items-center justify-center shadow-md font-bold text-white z-10">
                <span className="italic font-extrabold text-[11px] sm:text-xs">CB</span>
              </div>
            </div>

            <div className="flex flex-col">
              <h1 className="text-lg sm:text-xl font-black italic tracking-tighter text-white leading-none">
                Crypto<span className="text-[#00AE64]">Bit</span>
              </h1>
              <span className="text-[8px] text-emerald-400/80 font-mono tracking-[0.15em] mt-0.5 uppercase hidden xs:block">Secure Terminal</span>
            </div>
          </div>

          <div className="text-[10px] sm:text-xs font-mono text-slate-400 bg-slate-900/60 border border-slate-800 px-3 py-1 rounded-full hidden sm:flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> NETWORK ACTIVE
          </div>
        </header>

        {/* BODY INTRO & ACCESS CARD SECTION - Side-by-side on desktop, vertical Stack on mobile */}
        <main className="w-full flex-1 flex flex-col lg:flex-row items-center justify-center lg:justify-between gap-8 sm:gap-12 md:gap-16 px-2 sm:px-6 my-6 sm:my-10 lg:my-0">
          
          {/* LEFT: CINEMATIC SCREEN CAPTIONS (NEAT & AUTOSCALED FOR PHONES) */}
          <section className="text-center lg:text-left flex flex-col items-center lg:items-start max-w-xl self-center pointer-events-none select-none">
            <motion.p 
              initial={{ opacity: 0, y: -15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-[9px] xs:text-[10px] sm:text-xs font-extrabold tracking-[0.3em] text-[#00AE64] drop-shadow-[0_2px_4px_rgba(0,174,100,0.3)] uppercase mb-2"
            >
              🚀 Welcome Crypto Bit Indonesia
            </motion.p>
            
            <motion.h2 
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black italic tracking-tighter text-white leading-none uppercase"
            >
              INVEST CRYPTO <br className="hidden lg:block" />
              <span className="text-white">SE-</span>
              <span className="text-red-500 font-extrabold drop-shadow-[0_2px_12px_rgba(239,68,68,0.5)]">INDONESIA</span>
            </motion.h2>

            <motion.p 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="text-[10px] xs:text-xs font-bold tracking-[0.16em] text-slate-100 uppercase mt-4 sm:mt-5 bg-gradient-to-r from-slate-900/80 to-[#121b29]/80 border border-white/5 py-2 px-4 rounded-xl shadow-lg inline-block"
            >
              ⭐ JOIN SESUAI MODAL KALIAN
            </motion.p>

            {/* Quick trust metrics under heading to look incredibly professional */}
            <div className="hidden sm:grid grid-cols-3 gap-6 mt-8 text-left border-t border-slate-800/60 pt-6">
              <div>
                <span className="block text-slate-400 text-[9px] uppercase tracking-wider font-semibold font-mono">Bursa Teratur</span>
                <span className="text-[#00AE64] font-black italic text-sm tracking-tight">100% AMM</span>
              </div>
              <div>
                <span className="block text-slate-400 text-[9px] uppercase tracking-wider font-semibold font-mono">Keamanan</span>
                <span className="text-white font-black italic text-sm tracking-tight">SSL SECURED</span>
              </div>
              <div>
                <span className="block text-slate-400 text-[9px] uppercase tracking-wider font-semibold font-mono">Komunitas</span>
                <span className="text-indigo-400 font-black italic text-sm tracking-tight">&gt; 12.5k Chat</span>
              </div>
            </div>
          </section>

          {/* RIGHT: THE LOGIN CARD WITH GORGEOUS GLASSMORPHISM (TAILORED FOR MOBILE SIZES!) */}
          <section className="w-full max-w-[328px] xs:max-w-[350px] sm:max-w-[380px] lg:max-w-[400px] pointer-events-auto self-center select-none">
            <AnimatePresence>
              {showLogin && !user && (
                <motion.div 
                  initial={{ opacity: 0, y: 40, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.6, type: 'spring', bounce: 0.15 }}
                  className="bg-[#0b0e1a]/85 border border-[#00AE64]/30 backdrop-blur-2xl p-5 xs:p-6 sm:p-8 rounded-2xl shadow-2xl relative overflow-hidden text-white"
                  style={{ boxShadow: '0 25px 60px -15px rgba(0, 174, 100, 0.15)' }}
                >
                  {/* Decorative faint glow inside card */}
                  <div className="absolute -top-12 -right-12 w-28 h-28 bg-[#00AE64]/10 rounded-full blur-2xl pointer-events-none" />

                  <h3 className="text-lg xs:text-xl font-extrabold text-white mb-1 flex items-center gap-2">
                    <span className="w-1.5 h-4 bg-[#00AE64] rounded-sm" /> Akses Terminal Trading
                  </h3>
                  <p className="text-[11px] sm:text-xs text-slate-400 mb-6">
                    Lakukan otentikasi aman untuk masuk bursa digital.
                  </p>

                  <div className="space-y-4">
                    {/* Google Sign In Call-To-Action Button */}
                    <button 
                      onClick={handleLogin}
                      disabled={loading}
                      className="w-full bg-white hover:bg-slate-100 active:scale-[0.98] text-slate-900 font-extrabold py-3 px-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-3 group relative overflow-hidden"
                    >
                      {/* Google Logo SVG */}
                      <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] sm:w-5 sm:h-5 shrink-0 select-none pointer-events-none">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                      <span className="text-xs sm:text-sm">Log In via Google Secure</span>
                      <ArrowRight className="w-3.5 h-3.5 ml-1 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all absolute right-4 hidden xs:block" />
                    </button>
                    
                    {/* Security Seals */}
                    <div className="bg-slate-900/60 border border-slate-800/80 p-3 rounded-xl space-y-2 mt-4">
                      <div className="flex items-center gap-2.5 text-[10px] text-slate-300">
                        <ShieldCheck className="w-4 h-4 text-[#00AE64] shrink-0" />
                        <span>SSL Encrypted Connection Actived</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-[10px] text-slate-300">
                        <Layers className="w-4 h-4 text-indigo-400 shrink-0" />
                        <span>Decentralized Auth Mechanism (Firebase)</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 border-t border-slate-900 pt-4 flex justify-between items-center text-[9px] text-slate-500 font-mono">
                    <span>VERS_PRO_v2.01</span>
                    <span>© CRYPTOBIT GLOBAL</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>

        </main>

        {/* BOTTOM GLOBAL FOOTER: Clean and Professional */}
        <footer className="w-full flex flex-col xs:flex-row items-center justify-between text-[10px] text-slate-500 border-t border-slate-800/40 pt-4 px-2 select-none pointer-events-auto">
          <div className="flex items-center gap-4">
            <span>Dikelola secara Desentralisasi</span>
            <span className="hidden xs:inline">•</span>
            <span>Regulated Market</span>
          </div>
          <div className="mt-2 xs:mt-0 font-mono">
            UTC CLOCK: {new Date().getUTCHours().toString().padStart(2, '0')}:{new Date().getUTCMinutes().toString().padStart(2, '0')} GMT
          </div>
        </footer>

        {/* LOADING DIALOG: Beautifully Custom centered spinner */}
        <AnimatePresence>
          {loading && showLogin && (
            <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-md flex items-center justify-center pointer-events-auto">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }} 
                animate={{ opacity: 1, scale: 1 }} 
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-[#0b0e1a] border border-[#00AE64]/30 p-6 rounded-2xl flex flex-col items-center gap-4 shadow-2xl max-w-xs text-center"
              >
                <div className="w-10 h-10 border-[3px] border-[#00AE64] border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs font-bold font-mono tracking-widest text-[#00AE64] uppercase animate-pulse">Menghubungkan Terminal...</span>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
