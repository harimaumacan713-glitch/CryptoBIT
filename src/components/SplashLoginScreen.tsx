import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useFirebase } from './FirebaseProvider';
import { Globe2, ShieldCheck, Zap, Layers, ArrowRight } from 'lucide-react';

export default function SplashLoginScreen({ onLoginSuccess }: { onLoginSuccess: () => void }) {
  const { user, login, loading } = useFirebase();
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    // Show 3D animation for 3.5 seconds, then reveal login pane
    const timer = setTimeout(() => {
        setShowLogin(true);
    }, 3500);
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
    <div className="fixed inset-0 min-h-screen bg-[#0A0E17] flex items-center justify-center overflow-hidden z-[100]">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[20%] left-[20%] w-96 h-96 bg-[#00AE64]/20 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-[20%] right-[20%] w-96 h-96 bg-blue-500/20 rounded-full blur-[100px] animate-pulse delay-1000"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-5xl px-6">
        
        {/* Abstract 3D Central Graphic */}
        <motion.div 
          initial={{ scale: 0.8, opacity: 0, rotateY: 90 }}
          animate={{ scale: showLogin ? 0.6 : 1, opacity: 1, rotateY: 0, y: showLogin ? -100 : 0 }}
          transition={{ duration: 1.5, type: 'spring', bounce: 0.4 }}
          className="relative flex items-center justify-center"
        >
          {/* Core Sphere */}
          <motion.div 
             animate={{ rotate: 360 }}
             transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
             className="w-48 h-48 sm:w-64 sm:h-64 rounded-full border border-[#00AE64]/30 bg-gradient-to-tr from-[#00AE64]/20 to-transparent flex items-center justify-center backdrop-blur-md shadow-[0_0_50px_#00AE6440]"
          >
              <Globe2 className="w-24 h-24 text-[#00AE64] opacity-80" />
          </motion.div>
          
          {/* Orbiting Rings */}
          <motion.div 
             animate={{ rotateX: 360, rotateY: 360 }}
             transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
             className="absolute w-64 h-64 sm:w-80 sm:h-80 rounded-full border-t-2 border-l-2 border-blue-500/50"
             style={{ transformStyle: 'preserve-3d' }}
          />
          <motion.div 
             animate={{ rotateX: -360, rotateZ: 360 }}
             transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
             className="absolute w-72 h-72 sm:w-96 sm:h-96 rounded-full border-b-2 border-r-2 border-[#00AE64]/50"
             style={{ transformStyle: 'preserve-3d' }}
          />

          {/* Floating Elements */}
          <motion.div 
            animate={{ y: [-10, 10, -10] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -top-10 left-0 bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20 text-white flex items-center gap-2"
          >
             <Zap className="w-4 h-4 text-yellow-400" /> Web3 Native
          </motion.div>
          <motion.div 
            animate={{ y: [10, -10, 10] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -bottom-10 right-0 bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20 text-white flex items-center gap-2"
          >
             <ShieldCheck className="w-4 h-4 text-[#00AE64]" /> Bank-Grade Security
          </motion.div>
        </motion.div>

        {/* Title Text */}
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: showLogin ? -80 : 0 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="text-center mt-12"
        >
          <h1 className="text-5xl sm:text-7xl font-black italic tracking-tighter text-white mb-4 drop-shadow-2xl">
            Crypto<span className="text-[#00AE64]">Bit</span>
          </h1>
          <p className="text-gray-400 text-lg sm:text-xl font-medium tracking-wide">
            The Next Generation Digital Asset Exchange
          </p>
        </motion.div>

        {/* Login Pane */}
        <AnimatePresence>
          {showLogin && !user && (
            <motion.div 
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: -40, scale: 1 }}
              transition={{ duration: 0.5, type: 'spring' }}
              className="absolute bottom-10 sm:bottom-20 w-full max-w-md bg-[#111827]/80 backdrop-blur-xl p-8 rounded-2xl border border-gray-800 shadow-2xl"
            >
              <h2 className="text-2xl font-bold text-white mb-2 text-center">Secure Access</h2>
              <p className="text-sm text-gray-400 text-center mb-8">Authenticate to enter the trading terminal</p>

              <button 
                onClick={handleLogin}
                disabled={loading}
                className="w-full bg-white hover:bg-gray-100 text-gray-900 font-bold py-4 px-6 rounded-xl transition-all shadow-lg flex items-center justify-center gap-3 group relative overflow-hidden"
              >
                {/* Google Logo SVG */}
                <svg viewBox="0 0 24 24" className="w-5 h-5">
                   <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                   <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                   <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                   <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span>Continue with Google</span>
                <ArrowRight className="w-4 h-4 ml-2 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all absolute right-6" />
              </button>

              <div className="mt-6 flex items-center justify-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1"><Layers className="w-3 h-3"/> Decentralized</span>
                <span className="w-1 h-1 bg-gray-700 rounded-full"></span>
                <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3"/> SSL Secured</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading State Feedback */}
         <AnimatePresence>
          {loading && showLogin && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute bottom-20 text-[#00AE64] flex flex-col items-center gap-3"
            >
               <div className="w-8 h-8 border-2 border-[#00AE64] border-t-transparent rounded-full animate-spin"></div>
               <span className="text-sm font-bold tracking-widest uppercase">Connecting to Blockchain...</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
