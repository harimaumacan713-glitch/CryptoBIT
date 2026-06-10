import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { useFirebase } from './FirebaseProvider';
import { Clock, CheckCircle2, XCircle, Search, FileText, AlertTriangle, Fingerprint } from 'lucide-react';
import { Deposit } from '../types';

export default function DepositAdmin() {
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const { db } = useFirebase();

  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, 'deposits'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const deps: Deposit[] = [];
      snap.forEach(d => {
        deps.push({ depositId: d.id, ...d.data() } as Deposit);
      });
      setDeposits(deps);
    });
    return () => unsub();
  }, [db]);

  const handleApprove = async (dep: Deposit) => {
    if (!db || !dep.depositId) return;
    if (confirm(`Approve deposit of Rp ${dep.amount.toLocaleString()} for ${dep.userName}?`)) {
      await updateDoc(doc(db, 'deposits', dep.depositId), {
        status: 'Verified',
        verifiedAt: new Date()
      });
    }
  };

  const handleReject = async (dep: Deposit) => {
    if (!db || !dep.depositId) return;
    if (confirm(`Reject deposit of Rp ${dep.amount.toLocaleString()} for ${dep.userName}?`)) {
      await updateDoc(doc(db, 'deposits', dep.depositId), {
        status: 'Rejected'
      });
    }
  };

  return (
    <div className="bg-[#0b0c10] min-h-screen p-6 rounded-2xl shadow-xl text-slate-200 font-sans border border-slate-800">
      <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-800">
        <div>
          <h2 className="text-2xl font-black italic tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400 uppercase">
            Admin Deposit Center
          </h2>
          <p className="text-sm font-medium text-slate-500 mt-1">Sistem Pemantauan OCR Fraud Detection Realtime</p>
        </div>
        <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 px-4 py-2 rounded-lg text-sm">
          <ShieldIcon className="w-5 h-5 text-emerald-500 animate-pulse" />
          <span className="font-mono font-bold text-slate-300">SYSTEM SECURE</span>
        </div>
      </div>

      <div className="grid gap-6">
        {deposits.map((dep) => (
          <div key={dep.depositId} className="bg-[#12141c] border border-slate-800 p-6 rounded-xl relative overflow-hidden flex flex-col xl:flex-row gap-6 shadow-2xl">
            {/* Left section: Info */}
            <div className="flex-1 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs uppercase font-extrabold tracking-widest text-[#00AE64] bg-[#00AE64]/10 px-2 py-0.5 rounded border border-[#00AE64]/20">ID: {dep.depositId}</span>
                    <span className="text-[10px] uppercase font-bold text-slate-500 font-mono tracking-wider">{dep.createdAt?.toDate().toLocaleString('id-ID')}</span>
                  </div>
                  <h3 className="text-xl font-black text-white">{dep.userName} <span className="text-slate-500 text-sm font-semibold">{dep.userId.slice(0, 8)}...</span></h3>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold font-mono text-white">Rp {dep.amount?.toLocaleString('id-ID')}</div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-widest font-black mt-1">Unique: {dep.uniqueCode}</div>
                </div>
              </div>

              {/* Status block */}
              <div className="p-3 bg-slate-900 rounded-lg flex items-center justify-between border border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Status:</span>
                  {dep.status === 'Verified' && <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded"><CheckCircle2 className="w-4 h-4"/> BERHASIL VERIFIKASI</span>}
                  {dep.status === 'Rejected' && <span className="flex items-center gap-1.5 text-xs font-bold text-rose-500 bg-rose-500/10 px-2 py-1 rounded"><XCircle className="w-4 h-4"/> DITOLAK: {(dep as any).rejectionReason || 'Alasan tidak diketahui'}</span>}
                  {dep.status === 'Pending' && <span className="flex items-center gap-1.5 text-xs font-bold text-amber-500 bg-amber-500/10 px-2 py-1 rounded"><Clock className="w-4 h-4"/> PENDING</span>}
                  {dep.status === 'Under Review' && <span className="flex items-center gap-1.5 text-xs font-bold text-amber-500 bg-amber-500/10 px-2 py-1 rounded"><AlertTriangle className="w-4 h-4"/> BUTUH TINJAUAN MANUAL</span>}
                </div>
                
                <div className="flex gap-2">
                   {dep.status !== 'Verified' && (
                     <button onClick={() => handleApprove(dep)} className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-[10px] uppercase px-3 py-1.5 rounded transition-colors active:scale-95 shadow-md">
                       Approve Manual
                     </button>
                   )}
                   {dep.status !== 'Rejected' && (
                     <button onClick={() => handleReject(dep)} className="bg-rose-500 hover:bg-rose-600 text-white font-black text-[10px] uppercase px-3 py-1.5 rounded transition-colors active:scale-95 shadow-md">
                       Tolak
                     </button>
                   )}
                </div>
              </div>

              {/* OCR Details block */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/50">
                  <span className="text-[9px] text-slate-500 uppercase tracking-widest font-black flex items-center gap-1"><FileText className="w-3 h-3"/> Bank Tujuan OCR</span>
                  <div className="text-xs font-mono font-bold text-slate-300 mt-1">{(dep as any).ocrResult?.detectedBank || '-'}</div>
                </div>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/50">
                  <span className="text-[9px] text-slate-500 uppercase tracking-widest font-black flex items-center gap-1"><FileText className="w-3 h-3"/> Rekening Tujuan OCR</span>
                  <div className={`text-xs font-mono font-bold mt-1 ${(dep as any).ocrResult?.detectedAccount === '559301025279537' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {(dep as any).ocrResult?.detectedAccount || '-'}
                  </div>
                </div>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/50">
                  <span className="text-[9px] text-slate-500 uppercase tracking-widest font-black flex items-center gap-1"><Search className="w-3 h-3"/> AI Confidence</span>
                  <div className={`text-xs font-mono font-bold mt-1 ${((dep as any).confidence || 0) > 0.9 ? 'text-emerald-400' : 'text-amber-500'}`}>
                    {(((dep as any).confidence || 0) * 100).toFixed(1)}%
                  </div>
                </div>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/50">
                  <span className="text-[9px] text-slate-500 uppercase tracking-widest font-black flex items-center gap-1"><Fingerprint className="w-3 h-3"/> Fraud Score</span>
                  <div className={`text-xs font-mono font-bold mt-1 ${((dep as any).fraudScore || 0) === 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                    {(dep as any).fraudScore || 0} / 100
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right section: Image */}
            <div className="xl:w-64 shrink-0 flex flex-col gap-2">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-black text-center border-b border-slate-800 pb-1">Lampiran Bukti</span>
              <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden h-40 flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity" onClick={() => window.open(dep.proofImage, '_blank')}>
                {dep.proofImage ? (
                  <img src={dep.proofImage} alt="Deposit Proof" className="w-full h-full object-cover select-none" />
                ) : (
                  <span className="text-xs text-slate-600 font-bold uppercase tracking-widest">No Image</span>
                )}
              </div>
            </div>
          </div>
        ))}
        {deposits.length === 0 && (
          <div className="text-center p-12 text-slate-500 font-bold tracking-widest text-sm uppercase">Belum ada deposit masuk.</div>
        )}
      </div>
    </div>
  );
}

function ShieldIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/>
      <path d="m9 12 2 2 4-4"/>
    </svg>
  );
}
