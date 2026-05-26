/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useFirebase } from './FirebaseProvider';
import { Rocket, ShieldCheck, Info, Globe, Twitter, ArrowRight, CheckCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Launchpad({ onComplete }: { onComplete: () => void }) {
  const { createCoin, user, login } = useFirebase();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    totalSupply: 1000000,
    logo: '',
    description: '',
    website: '',
    twitter: '',
    initialPrice: 0.1,
    listingDate: '',
    minBuy: 10,
    maxBuy: 1000,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await createCoin({
        ...formData,
        status: 'Upcoming',
        soldCount: 0,
        investorCount: 0,
        isVerified: false,
        targetFund: formData.totalSupply * formData.initialPrice * 0.2 // Example target
      });
      setStep(3);
    } catch (err) {
      console.error(err);
      alert('Failed to launch coin. Please login first.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center p-20 bg-white border border-gray-200 rounded-sm shadow-sm mt-4">
        <Rocket className="w-16 h-16 text-[#00AE64] mb-4 animate-bounce" />
        <h2 className="text-xl font-bold">Ready to Launch your Coin?</h2>
        <p className="text-gray-500 text-sm mt-2 mb-6">Please log in to start your Web3 project journey.</p>
        <button 
          onClick={login}
          className="bg-[#00AE64] text-white font-bold py-2 px-8 rounded-sm hover:bg-[#009656] transition-all"
        >
          Login with Google
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto mt-6">
      <div className="mb-8">
         <h1 className="text-3xl font-black italic tracking-tighter text-[#00AE64]">CRYPTOBIT LAUNCHPAD</h1>
         <p className="text-gray-500 text-sm">Issue your own token and reach thousands of investors in minutes.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-sm shadow-sm overflow-hidden">
        {/* Progress Bar */}
        <div className="flex border-b border-gray-100">
          {[1, 2, 3].map((s) => (
             <div key={s} className={`flex-1 p-4 text-center border-r last:border-0 border-gray-100 transition-colors ${step >= s ? 'bg-[#00AE64]/5 relative' : 'bg-gray-50/50 grayscale'}`}>
                {step === s && <motion.div layoutId="step-highlight" className="absolute bottom-0 left-0 right-0 h-1 bg-[#00AE64]" />}
                <span className={`text-[10px] font-bold uppercase tracking-widest ${step >= s ? 'text-[#00AE64]' : 'text-gray-400'}`}>
                  {s === 1 ? 'Project Details' : s === 2 ? 'IPO Setup' : 'Success'}
                </span>
             </div>
          ))}
        </div>

        <div className="p-8">
           <AnimatePresence mode="wait">
             {step === 1 && (
               <motion.div 
                 key="step1"
                 initial={{ opacity: 0, x: 20 }}
                 animate={{ opacity: 1, x: 0 }}
                 exit={{ opacity: 0, x: -20 }}
                 className="space-y-6"
               >
                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase">Token Name</label>
                      <input name="name" value={formData.name} onChange={handleChange} placeholder="e.g. MetaChain" className="w-full border-gray-200 rounded-sm bg-gray-50 p-3 text-sm focus:ring-1 focus:ring-[#00AE64] outline-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase">Symbol</label>
                      <input name="symbol" value={formData.symbol} onChange={handleChange} placeholder="e.g. MTC" className="w-full border-gray-200 rounded-sm bg-gray-50 p-3 text-sm focus:ring-1 focus:ring-[#00AE64] outline-none" />
                    </div>
                 </div>

                 <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase">Total Supply</label>
                    <input type="number" name="totalSupply" value={formData.totalSupply} onChange={handleChange} className="w-full border-gray-200 rounded-sm bg-gray-50 p-3 text-sm focus:ring-1 focus:ring-[#00AE64] outline-none" />
                 </div>

                 <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase">Logo URL</label>
                    <input name="logo" value={formData.logo} onChange={handleChange} placeholder="Link to logo image" className="w-full border-gray-200 rounded-sm bg-gray-50 p-3 text-sm focus:ring-1 focus:ring-[#00AE64] outline-none" />
                 </div>

                 <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase">Description</label>
                    <textarea name="description" value={formData.description} onChange={handleChange} rows={4} placeholder="Describe your web3 vision..." className="w-full border-gray-200 rounded-sm bg-gray-50 p-3 text-sm focus:ring-1 focus:ring-[#00AE64] outline-none resize-none" />
                 </div>

                 <div className="grid grid-cols-2 gap-6">
                    <div className="relative">
                      <Globe className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <input name="website" value={formData.website} onChange={handleChange} placeholder="Website" className="w-full border-gray-200 rounded-sm bg-gray-50 p-3 pl-10 text-sm focus:ring-1 focus:ring-[#00AE64] outline-none" />
                    </div>
                    <div className="relative">
                      <Twitter className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <input name="twitter" value={formData.twitter} onChange={handleChange} placeholder="Twitter / X" className="w-full border-gray-200 rounded-sm bg-gray-50 p-3 pl-10 text-sm focus:ring-1 focus:ring-[#00AE64] outline-none" />
                    </div>
                 </div>

                 <button 
                  onClick={() => setStep(2)}
                  className="w-full bg-[#00AE64] text-white font-bold py-3 px-6 rounded-sm hover:bg-[#009656] transition-all flex items-center justify-center gap-2"
                 >
                   Continue to IPO Setup <ArrowRight className="w-4 h-4" />
                 </button>
               </motion.div>
             )}

             {step === 2 && (
               <motion.div 
                 key="step2"
                 initial={{ opacity: 0, x: 20 }}
                 animate={{ opacity: 1, x: 0 }}
                 exit={{ opacity: 0, x: -20 }}
                 className="space-y-6"
               >
                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase">Initial Price (USD)</label>
                      <input type="number" step="0.001" name="initialPrice" value={formData.initialPrice} onChange={handleChange} className="w-full border-gray-200 rounded-sm bg-gray-50 p-3 text-sm" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase">Listing Date</label>
                      <input type="datetime-local" name="listingDate" value={formData.listingDate} onChange={handleChange} className="w-full border-gray-200 rounded-sm bg-gray-50 p-3 text-sm" />
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase">Min. Buy</label>
                      <input type="number" name="minBuy" value={formData.minBuy} onChange={handleChange} className="w-full border-gray-200 rounded-sm bg-gray-50 p-3 text-sm" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase">Max. Buy</label>
                      <input type="number" name="maxBuy" value={formData.maxBuy} onChange={handleChange} className="w-full border-gray-200 rounded-sm bg-gray-50 p-3 text-sm" />
                    </div>
                 </div>

                 <div className="bg-blue-50 border border-blue-100 p-4 rounded-sm flex gap-3">
                    <ShieldCheck className="w-6 h-6 text-blue-500 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-blue-800 uppercase">Company Verification</p>
                      <p className="text-xs text-blue-600 mt-1">Our team will verify your project credentials within 24 hours. Verified projects get 5x more exposure.</p>
                    </div>
                 </div>

                 <div className="flex gap-4">
                    <button 
                      onClick={() => setStep(1)}
                      className="flex-1 border border-gray-200 text-gray-500 font-bold py-3 px-6 rounded-sm hover:bg-gray-50 transition-all"
                    >
                      Back
                    </button>
                    <button 
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="flex-[2] bg-[#00AE64] text-white font-bold py-3 px-6 rounded-sm hover:bg-[#009656] shadow-lg shadow-[#00AE64]/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" /> Launching...
                        </>
                      ) : (
                        'Ajukan IPO Coin'
                      )}
                    </button>
                 </div>
               </motion.div>
             )}

             {step === 3 && (
               <motion.div 
                 key="step3"
                 initial={{ opacity: 0, scale: 0.9 }}
                 animate={{ opacity: 1, scale: 1 }}
                 className="flex flex-col items-center justify-center py-10"
               >
                 <div className="w-20 h-20 bg-[#00AE64] rounded-full flex items-center justify-center mb-6 shadow-xl shadow-[#00AE64]/30">
                    <CheckCircle className="w-10 h-10 text-white" />
                 </div>
                 <h2 className="text-2xl font-bold text-gray-900">Project Launched!</h2>
                 <p className="text-center text-gray-500 mt-2 max-w-sm">
                   Congratulations! <strong>{formData.name}</strong> is now live in the Upcoming Projects section.
                 </p>
                 <button 
                  onClick={onComplete}
                  className="mt-8 bg-black text-white font-bold py-3 px-8 rounded-sm hover:bg-gray-800 transition-all"
                 >
                   View IPO Center
                 </button>
               </motion.div>
             )}
           </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
