import React, { useState, useEffect, useRef } from 'react';
import { useFirebase } from './FirebaseProvider';
import { doc, onSnapshot, updateDoc, setDoc, collection, query, addDoc, deleteDoc } from 'firebase/firestore';
import { Mic, Video, RadioReceiver, Activity, MonitorPlay, Zap, BarChart3, Presentation, TextSelect, FileAudio, AlertCircle, Users, MessageSquare } from 'lucide-react';
import { EconomicIntelligenceEngine } from '../services/EconomicIntelligenceEngine';

// Window augmentation for SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

const BOT_USERNAMES = [
  'Aris_CuanMax', 'CryptoGacor', 'Sultan_Soreang', 'Wulan_Invest', 'DewiTrader', 'Bambang_BCA', 
  'Rendi_HODL', 'IndoCryptoHub', 'Mikael_BTC', 'Angel_Rich', 'Vero_Aura', 'Putra_Sakti', 
  'Mega_Duit', 'Satria_Crypto', 'Rian_Moontalk', 'Yudi_Scalper', 'Taufik_Hodler', 'Sari_CuanLovers',
  'Andi_Bullish', 'Agus_MegaGain', 'Dian_Profit', 'Ratu_Altcoins', 'CryptoJagoan', 'CariCuanHariIni',
  'Pejuang_Rupiah', 'Cuanhunter', 'Bocah_FOMO', 'Anak_Saham', 'Trader_Santuy', 'Mbah_Cuandor',
  'Dedi_Koin', 'Rizky_Hype', 'Pratama_Bull', 'Santi_Cuan', 'Lina_Hodl', 'Bayu_Smart',
  'Indra_Gacor', 'Yoseph_Alt', 'Ferry_Richer', 'Sinta_Billionaire'
];

const BOT_COMMENTS_BULLISH = [
  'Suku bunga dipotong nih kayanya! 🚀',
  'Market langsung ijo semua! Gokil pimpinan!',
  'FAAS token to the moon! 🚀🚀🚀',
  'Gila ini analisisnya tajam banget.',
  'Udah borong di bawah tadi, untung bgt!',
  'Btc to 100k incoming!',
  'Beli sekarang atau nangis nanti di puncak? 😂',
  'This is absolutely massive news! Great presentation!',
  'Bullish sentiment is so strong right now.',
  'Siap-siap pasang jaring buy limit.',
  'Is this the bottom? Bull run season is starting!',
  'All in koin crypto jagoan kita sekarang.',
  'Adem bgt denger isyarat rate cut.',
  'GOKILLL TEMBUS TARGET!',
  'Serbuuu koin-koin favorit kita guys!',
];

const BOT_COMMENTS_BEARISH = [
  'Waduh inflasi naik lagi nih? 📉',
  'Market bakal dump dalem ini mah, siap-siap!',
  'Suku bunga ditahan atau naik nih kayanya, serem.',
  'Mending hold cash dulu gais, wait and see.',
  'Wah resesi beneran di depan mata?',
  'Langsung cut loss atau HODL ini? Pusing 😭',
  'Bear market is back. Time to short!',
  'Semuanya merah darah, market lagi pendarahan.',
  'Jangan tangkap pisau jatuh bro, ngeri.',
  'Waduh Powell ngomongnya agak hawkish ya hari ini.',
  'Duh porto gue kebakaran semua nih!',
  'Tarik dana sekarang sebelum makin parah!',
  'Ini sih beneran kiamat kecil di crypto.',
  'Tunggu bottom dulu baru masuk lagi.',
  'Jangan FOMO buy the dip kalau masih turun terus.'
];

const BOT_COMMENTS_NEUTRAL = [
  'Masih wait and see nih, belum ada sinyal kuat.',
  'Penjelasannya cukup stabil, makroekonomi masih aman.',
  'Market cenderung sideways ya abis pengumuman ini.',
  'Semoga kedepannya makin jelas arahnya kemana.',
  'Mantap kali live streaming VIP ini.',
  'Keren abis ekosistem VIA X ini, real-time banget!',
  'Let\'s go! Indonesian traders assemble! 🇮🇩',
  'Makasih infonya min, sangat membantu analisis market!',
  'Wah gokil penonton tembus lebih dari 2 juta orang live!',
  'Terus pantau chart gais, jangan lengah.',
  'Chairman is logic as always. No surprises here.',
  'Nunggu konfirmasi arah tren selanjutnya aja deh.',
  'Analisis data tenaga kerjanya cukup masuk akal.',
  'Tetap diversifikasi porto ya teman-teman.',
  'Cukup menenangkan, inflasi sepertinya terkendali.'
];

const getAvatarColor = (username: string) => {
  const colors = [
    'bg-red-500', 'bg-pink-500', 'bg-purple-500', 'bg-indigo-500',
    'bg-blue-500', 'bg-cyan-500', 'bg-teal-500', 'bg-emerald-500',
    'bg-green-500', 'bg-lime-500', 'bg-yellow-500', 'bg-amber-500',
    'bg-orange-500'
  ];
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

export default function FedBroadcast() {
  const { user, db, coins } = useFirebase();
  const isFounder = user?.email === 'dewanggamiliarder@gmail.com' || user?.email === 'dewanggamiliarde@gmail.com';

  const [isLive, setIsLive] = useState(false);
  const [broadcastData, setBroadcastData] = useState<any>({
     transcript: '',
     sentiment: 50,
     announcement: '',
     isLive: false,
     mode: 'camera'
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [recognitionActive, setRecognitionActive] = useState(false);
  const recognitionRef = useRef<any>(null);
  
  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const viewerId = useRef<string>(`viewer_${Date.now()}_${Math.floor(Math.random()*1000)}`);
  
  const [systemStatus, setSystemStatus] = useState({
        camera: 'Disconnected',
        microphone: 'Disconnected',
        speech: 'Idle',
        errors: [] as string[]
  });

  const addError = (err: string) => setSystemStatus(prev => ({...prev, errors: [...prev.errors, err]}));

  // Bot states & scroll ref
  const [botViewerCount, setBotViewerCount] = useState(2145890 + Math.floor(Math.random() * 50000));
  const [liveComments, setLiveComments] = useState<any[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to bottom disabled as requested
  // useEffect(() => {
  //   if (chatEndRef.current) {
  //     chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
  //   }
  // }, [liveComments]);

  // Handle active live chat and bot viewer counts
  const sentimentRef = useRef(broadcastData.sentiment || 50);
  useEffect(() => {
     sentimentRef.current = broadcastData.sentiment || 50;
  }, [broadcastData.sentiment]);

  useEffect(() => {
    if (!isLive) {
      setLiveComments([]);
      return;
    }

    // Populate initial comments
    const getCommentsArray = () => {
       const sentiment = sentimentRef.current;
       if (sentiment >= 60) return BOT_COMMENTS_BULLISH;
       if (sentiment <= 40) return BOT_COMMENTS_BEARISH;
       return BOT_COMMENTS_NEUTRAL;
    };

    const initialComments = Array.from({ length: 6 }).map((_, i) => {
      const idxUser = Math.floor(Math.random() * BOT_USERNAMES.length);
      const commentsArray = getCommentsArray();
      const idxComment = Math.floor(Math.random() * commentsArray.length);
      return {
        id: `init_${i}_${Date.now()}_${Math.random()}`,
        username: BOT_USERNAMES[idxUser],
        text: commentsArray[idxComment],
        avatarColor: getAvatarColor(BOT_USERNAMES[idxUser]),
        badge: Math.random() > 0.7 ? "VIP" : Math.random() > 0.85 ? "Top Trader" : null
      };
    });
    setLiveComments(initialComments);

    // Fluctuate viewer counts realistically based on impact events
    const viewerInterval = setInterval(() => {
      setBotViewerCount(prev => {
        // High sentiment volatility or extreme sentiment attracts more viewers quickly
        const sentimentDiff = Math.abs((sentimentRef.current) - 50);
        const hypeMultiplier = 1 + (sentimentDiff / 20); // up to 3.5x multiplier
        
        // Random organic movement between -2000 and +6500, skewed positive so it grows
        let change = Math.floor((Math.random() * 8500 - 2000) * hypeMultiplier); 
        
        const target = prev + change;
        // Floor it at 2 million for hype
        return target < 2000000 ? 2000000 + Math.floor(Math.random() * 10000) : target;
      });
    }, 3500);

    // Realistic organic chat streaming with recursive setTimeout
    let timeoutId: any;
    const streamComment = () => {
      const idxUser = Math.floor(Math.random() * BOT_USERNAMES.length);
      const commentsArray = getCommentsArray();
      const idxComment = Math.floor(Math.random() * commentsArray.length);
      const newComment = {
        id: `comment_${Date.now()}_${Math.random()}`,
        username: BOT_USERNAMES[idxUser],
        text: commentsArray[idxComment],
        avatarColor: getAvatarColor(BOT_USERNAMES[idxUser]),
        badge: Math.random() > 0.75 ? "VIP" : Math.random() > 0.88 ? "Top Trader" : null
      };

      setLiveComments(prev => {
        const updated = [...prev, newComment];
        if (updated.length > 50) {
          return updated.slice(updated.length - 35);
        }
        return updated;
      });

      // Rapid fire if sentiment is extreme (high volatility), slower if neutral
      const sentimentDiff = Math.abs((sentimentRef.current) - 50);
      const isExtreme = sentimentDiff > 20;

      // Random delay between 300ms to 2500ms
      const baseDelay = isExtreme ? Math.random() * 800 + 200 : Math.random() * 2000 + 800;
      timeoutId = setTimeout(streamComment, baseDelay);
    };

    // Start streaming
    timeoutId = setTimeout(streamComment, 1000);

    return () => {
      clearInterval(viewerInterval);
      clearTimeout(timeoutId);
    };
  }, [isLive]);

  // Auto start camera for founder
  useEffect(() => {
     if (isFounder && !localStream) {
         navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then(stream => {
                 setLocalStream(stream);
                 setSystemStatus(prev => ({...prev, camera: 'Connected', microphone: 'Connected'}));
                 if (videoRef.current) {
                     videoRef.current.srcObject = stream;
                 }
            })
            .catch(e => {
                 addError(`Camera/Mic Error: ${e.message}`);
                 setSystemStatus(prev => ({...prev, camera: 'Failed', microphone: 'Failed'}));
            });
     }
  }, [isFounder]);


  // Founder WebRTC Signaling
  useEffect(() => {
     if (!isFounder || !isLive || !localStream || !db) return;
     
     const q = query(collection(db, 'fed_viewers'));
     const unsub = onSnapshot(q, (snapshot) => {
        snapshot.docChanges().forEach(async (change) => {
           if (change.type === 'added') {
              const data = change.doc.data();
              if (data.offer && !peerConnections.current.has(change.doc.id)) {
                 const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
                 peerConnections.current.set(change.doc.id, pc);
                 
                 localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
                 
                 pc.onicecandidate = (event) => {
                    if (event.candidate) {
                       addDoc(collection(db, `fed_viewers/${change.doc.id}/candidates`), {
                          candidate: event.candidate.toJSON(),
                          type: 'broadcaster'
                       }).catch(e => console.error("Error adding candidate", e));
                    }
                 };

                 try {
                    await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
                    const answer = await pc.createAnswer();
                    await pc.setLocalDescription(answer);

                    try {
                       await updateDoc(doc(db, 'fed_viewers', change.doc.id), {
                          answer: { type: answer.type, sdp: answer.sdp }
                       });
                    } catch (e) {
                       console.warn("Could not update viewer document, it may have been deleted:", e);
                    }

                    onSnapshot(collection(db, `fed_viewers/${change.doc.id}/candidates`), (candSnap) => {
                       candSnap.docChanges().forEach((candChange) => {
                          if (candChange.type === 'added') {
                             const candData = candChange.doc.data();
                             if (candData.type === 'viewer') {
                                if (pc.signalingState !== 'closed' && pc.remoteDescription) {
                                   pc.addIceCandidate(new RTCIceCandidate(candData.candidate)).catch(e => console.error("error adding ICE cand", e));
                                }
                             }
                          }
                       })
                    });
                 } catch (err) {
                    console.error("Founder WebRTC Error for viewer", change.doc.id, err);
                 }
              }
           } else if (change.type === 'removed') {
              const pc = peerConnections.current.get(change.doc.id);
              if (pc) {
                 pc.close();
                 peerConnections.current.delete(change.doc.id);
              }
           }
        });
     });
     return () => unsub();
  }, [isFounder, isLive, localStream, db]);

  // Viewer WebRTC Signaling
  useEffect(() => {
     if (isFounder || !isLive || !db) return;
     let pc: RTCPeerConnection | null = null;
     let viewerDocRef: any = null;
     let unsubDoc: any = null;
     let unsubCand: any = null;

     const joinBroadcast = async () => {
        pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
        const iceQueue: any[] = [];
        
        pc.ontrack = (event) => {
           if (remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = event.streams[0];
           }
        };

        viewerDocRef = doc(db, 'fed_viewers', viewerId.current);

        pc.onicecandidate = (event) => {
           if (event.candidate) {
              addDoc(collection(db, `fed_viewers/${viewerId.current}/candidates`), {
                 candidate: event.candidate.toJSON(),
                 type: 'viewer'
              }).catch(e => console.error(e));
           }
        };

        try {
           // We add transceivers to receive audio/video
           pc.addTransceiver('video', { direction: 'recvonly' });
           pc.addTransceiver('audio', { direction: 'recvonly' });

           const offer = await pc.createOffer();
           await pc.setLocalDescription(offer);

           await setDoc(viewerDocRef, {
              offer: { type: offer.type, sdp: offer.sdp },
              createdAt: new Date().toISOString()
           });

           unsubDoc = onSnapshot(viewerDocRef, (snap) => {
              const data = snap.data();
              if (data && data.answer && pc!.signalingState !== 'stable') {
                 const answerDesc = new RTCSessionDescription(data.answer);
                 pc!.setRemoteDescription(answerDesc).then(() => {
                    while (iceQueue.length > 0) {
                       const cand = iceQueue.shift();
                       if (cand && pc && pc.signalingState !== 'closed') {
                          pc.addIceCandidate(new RTCIceCandidate(cand))
                            .catch(e => console.error("Error adding queued candidate", e));
                       }
                    }
                 }).catch(e => console.error("Error setting answer", e));
              }
           });

           unsubCand = onSnapshot(collection(db, `fed_viewers/${viewerId.current}/candidates`), (candSnap) => {
              candSnap.docChanges().forEach((candChange) => {
                 if (candChange.type === 'added') {
                    const candData = candChange.doc.data();
                    if (candData.type === 'broadcaster' && pc!.signalingState !== 'closed') {
                       if (pc!.remoteDescription) {
                          pc!.addIceCandidate(new RTCIceCandidate(candData.candidate)).catch(e => console.error(e));
                       } else {
                          iceQueue.push(candData.candidate);
                       }
                    }
                 }
              });
           });
        } catch (e) {
           console.error("Viewer WebRTC Error", e);
        }
     };

     joinBroadcast();

     return () => {
        if (pc) pc.close();
        if (unsubDoc) unsubDoc();
        if (unsubCand) unsubCand();
        if (viewerDocRef) deleteDoc(viewerDocRef).catch(e => console.error(e));
     }
  }, [isFounder, isLive, db]);

  // Sync with Firestore
  useEffect(() => {
    if (!db) return;
    const unsub = onSnapshot(doc(db, 'system', 'fed_broadcast'), (docSnap) => {
      if (docSnap.exists()) {
        setBroadcastData(docSnap.data());
        setIsLive(docSnap.data().isLive);
      } else {
         if (isFounder) {
             setDoc(doc(db, 'system', 'fed_broadcast'), {
                transcript: '',
                sentiment: 50,
                announcement: '',
                isLive: false,
                mode: 'camera',
                posStrength: 0,
                negStrength: 0
             });
         }
      }
    });
    return () => unsub();
  }, [db, isFounder]);

  const [assetImpacts, setAssetImpacts] = useState<any[]>([]);
  const [lastProcessedText, setLastProcessedText] = useState('');
  
  // UI for sentiment stats
  const [announcementSentiment, setAnnouncementSentiment] = useState({
      score: 50,
      bullishCount: 0,
      bearishCount: 0,
      coinsUpdated: 0
  });

  // Sentiment Analysis Logic
  const analyzeSentiment = (text: string) => {
      const lower = text.toLowerCase();
      let bullishCount = 0;
      let bearishCount = 0;
      
      ['liquidity', 'expansion', 'stimulus', 'growth', 'easing', 'bullish'].forEach(kw => {
          if (lower.includes(kw)) bullishCount++;
      });
      
      ['tightening', 'recession', 'inflation', 'crisis', 'collapse', 'bearish'].forEach(kw => {
          if (lower.includes(kw)) bearishCount++;
      });
      
      let score = 50;
      if (bullishCount > bearishCount) score = Math.min(100, 50 + (bullishCount * 10));
      else if (bearishCount > bullishCount) score = Math.max(0, 50 - (bearishCount * 10));
      
      return { score, bullishCount, bearishCount };
  };

  // Analyze announcement text changes
  useEffect(() => {
      if (!isFounder || !broadcastData.announcement || broadcastData.announcement === lastProcessedText) return;
      
      console.log("Banner text received:", broadcastData.announcement);
      
      const { score, bullishCount, bearishCount } = analyzeSentiment(broadcastData.announcement);
      
      console.log("Sentiment calculated:", score, "Bullish:", bullishCount, "Bearish:", bearishCount);
      
      // Update sentiment in firestore
      updateDoc(doc(db, 'system', 'fed_broadcast'), {
          sentiment: score
      }).then(() => console.log("Fed sentiment updated"));

      setAnnouncementSentiment({
          score,
          bullishCount,
          bearishCount,
          coinsUpdated: coins.filter(c => c.status === 'Listed').length
      });

      setLastProcessedText(broadcastData.announcement);
  }, [broadcastData.announcement, isFounder, db, coins, lastProcessedText]);

  // VIA X Economic Intelligence Engine
  useEffect(() => {
     if (!isLive || !db) return;
     const currentTranscript = (broadcastData.transcript || '').trim();
     if (!currentTranscript || currentTranscript === lastProcessedText) {
         return;
     }
     
     const timeout = setTimeout(async () => {
         const listedCoins = coins.filter(c => c.status === 'Listed');
         if (listedCoins.length === 0) return;

         setSystemStatus(prev => ({ ...prev, speech: 'Processing' }));

         try {
             const res = await fetch('/api/fed/analyze', {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify({ transcript: currentTranscript, coins: listedCoins })
             });

             if (!res.ok) {
                 throw new Error('Gemini API call returned status error');
             }

             const geminiResult = await res.json();
             
             const { impacts, batch } = EconomicIntelligenceEngine.processGeminiAnalysis(
                 geminiResult,
                 listedCoins,
                 db,
                 isFounder
             );

             setAssetImpacts(impacts);
             setLastProcessedText(currentTranscript);
             setSystemStatus(prev => ({ ...prev, speech: 'Running' }));

             if (isFounder) {
                 await updateDoc(doc(db, 'system', 'fed_broadcast'), {
                     sentiment: geminiResult.sentiment !== undefined ? Number(geminiResult.sentiment) : 50
                 });
                 if (batch) {
                     await batch.commit();
                 }
             }

         } catch (err: any) {
             console.warn("Falling back to local keyword analysis engine due to Gemini error:", err.message);
             
             const { impacts, batch, newSentiment } = EconomicIntelligenceEngine.processTranscript(
                 currentTranscript,
                 broadcastData.sentiment || 50,
                 listedCoins,
                 db,
                 isFounder
             );

             setAssetImpacts(impacts);
             setLastProcessedText(currentTranscript);
             setSystemStatus(prev => ({ ...prev, speech: 'Running' }));

             if (isFounder) {
                 await updateDoc(doc(db, 'system', 'fed_broadcast'), {
                     sentiment: newSentiment
                 });
                 if (batch) {
                     await batch.commit();
                 }
             }
         }
         
     }, 2000);
     
     return () => clearTimeout(timeout);
  }, [broadcastData.transcript, isLive, isFounder, db, coins, lastProcessedText]);

  const toggleLive = async () => {
    if (!isFounder || !db) return;
    
    if (!isLive) {
       // Start speech recognition only when LIVE
       try {
          const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
          if (!SpeechRecognition) {
              alert("Microphone not detected or Browser not supported.");
              return;
          }
          
          if (!recognitionRef.current) {
             const recognition = new SpeechRecognition();
             console.log("[SPEECH] Recognition initialized");
             recognition.continuous = true;
             recognition.interimResults = true;
             recognition.lang = 'en-US';             
             let finalTranscript = ''; // Start fresh

             recognition.onresult = (event: any) => {
                 setSystemStatus(prev => ({...prev, speech: 'Processing'}));
                 let interimTranscript = '';
                 for (let i = event.resultIndex; i < event.results.length; ++i) {
                     if (event.results[i].isFinal) {
                         finalTranscript += event.results[i][0].transcript + ' ';
                     } else {
                         interimTranscript += event.results[i][0].transcript;
                     }
                 }
                 
                 const fullTranscript = finalTranscript + interimTranscript;
                 setBroadcastData((prev: any) => ({ ...prev, transcript: fullTranscript }));
 
                 // VIA X Analysis
                 const lower = fullTranscript.toLowerCase();
                 let posStrength = 0;
                 let negStrength = 0;
                 
                 ['liquidity', 'expansion', 'stimulus', 'growth', 'easing', 'bullish'].forEach(kw => {
                     if (lower.includes(kw)) posStrength++;
                 });
                 
                 ['tightening', 'recession', 'inflation', 'crisis', 'collapse', 'bearish'].forEach(kw => {
                     if (lower.includes(kw)) negStrength++;
                 });
                 
                 let newSentiment = 50;
                 if (posStrength > negStrength) {
                     newSentiment = Math.min(100, 50 + (posStrength * 10)); 
                 } else if (negStrength > posStrength) {
                     newSentiment = Math.max(0, 50 - (negStrength * 10));
                 } else if (lower.includes('stabil') || lower.includes('moderat')) {
                     newSentiment = 50;
                 } else {
                     newSentiment = broadcastData.sentiment || 50;
                 }

                 // Update Firestore
                 updateDoc(doc(db, 'system', 'fed_broadcast'), {
                    transcript: fullTranscript,
                    sentiment: newSentiment,
                    posStrength,
                    negStrength
                 });
             };

             recognition.onerror = (e: any) => {
                 console.error("Speech Recognition Error:", e);
                 addError(`Speech Error: ${e.error}`);
                 setSystemStatus(prev => ({...prev, speech: 'Failed'}));
             };
             
             recognition.onstart = () => setSystemStatus(prev => ({...prev, speech: 'Running'}));
             recognition.onend = () => setSystemStatus(prev => ({...prev, speech: isLive ? 'Idle' : 'Stopped'}));
             
             recognition.start();
             recognitionRef.current = recognition;
             setRecognitionActive(true);
          }

          await updateDoc(doc(db, 'system', 'fed_broadcast'), { 
              isLive: true,
              transcript: '', 
              startedAt: new Date().toISOString() 
          });

       } catch(e) {
          console.error("Failed to start broadcast", e);
          alert("Microphone not detected or access denied.");
       }
    } else {
       if (recognitionRef.current) {
           recognitionRef.current.stop();
           recognitionRef.current = null;
           setRecognitionActive(false);
       }
       await updateDoc(doc(db, 'system', 'fed_broadcast'), { isLive: false });
    }
  };

  const getSentimentText = (score: number) => {
     if (score >= 80) return "Very Bullish";
     if (score >= 60) return "Bullish";
     if (score >= 40) return "Neutral";
     if (score >= 20) return "Bearish";
     return "Very Bearish";
  };
  
  const getSentimentColor = (score: number) => {
     if (score >= 80) return "text-emerald-500";
     if (score >= 60) return "text-green-400";
     if (score >= 40) return "text-slate-400";
     if (score >= 20) return "text-orange-500";
     return "text-rose-600";
  };

  return (
    <div className="p-6 bg-slate-950 min-h-screen text-slate-100 font-sans -mx-4 -mt-4 rounded-xl">
      <header className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2 text-white">
            <MonitorPlay className="w-7 h-7 text-blue-500" />
            FEDERAL RESERVE LIVE BROADCAST
          </h1>
          <p className="text-slate-400 text-xs mt-1 uppercase tracking-widest pl-9">
            VIA X Institutional Economic Command Center
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          {isLive && (
            <>
              {/* LIVE BADGE */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600/20 border border-red-500/50 rounded-full animate-pulse">
                 <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                 <span className="text-red-500 font-bold text-[11px] uppercase tracking-wider">LIVE</span>
              </div>
              
              {/* DYNAMIC VIEWER COUNT (TEMBUS 2 JUTA) */}
              <div className="flex items-center gap-2 px-3.5 py-1.5 bg-blue-500/10 border border-blue-500/30 rounded-full text-blue-400">
                 <Users className="w-4 h-4 text-blue-400" />
                 <span className="font-mono font-black text-xs">
                    {botViewerCount.toLocaleString('id-ID')} Penonton
                 </span>
              </div>
            </>
          )}
        </div>
      </header>

      {broadcastData.announcement && isLive && (
         <div className="mb-6 bg-blue-900/40 border-l-4 border-blue-500 p-4 rounded-r flex items-center gap-4">
            <AlertCircle className="text-blue-400 w-6 h-6 animate-pulse" />
            <div>
               <div className="text-blue-300 font-black text-xs uppercase tracking-widest">BREAKING: Federal Reserve VIA X Announces</div>
               <div className="text-white font-medium text-sm">{broadcastData.announcement}</div>
            </div>
         </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative">
         {/* Main Broadcast Screen */}
         <div className="lg:col-span-2 space-y-4">
            {/* Video / Audio Container */}
            <div className="relative aspect-video bg-black rounded-xl border border-slate-800 overflow-hidden flex items-center justify-center">
               {isLive ? (
                  <>
                    {isFounder ? (
                        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                    ) : (
                        broadcastData.mode === 'camera' ? (
                           <div className="relative w-full h-full flex items-center justify-center bg-slate-900">
                              <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover relative z-20" />
                              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1590283603385-18ff8676a6cf?w=1000&auto=format&fit=crop')] opacity-20 bg-cover bg-center"></div>
                              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/40">
                                  <MonitorPlay className="w-16 h-16 text-blue-500 mb-4 opacity-50" />
                                  <span className="text-slate-300 font-black tracking-widest text-sm uppercase">Connecting...</span>
                              </div>
                           </div>
                        ) : (
                           <div className="relative w-full h-full flex flex-col justify-center items-center bg-slate-900 p-8">
                              <video ref={remoteVideoRef} autoPlay playsInline className="hidden" />
                              <img src="https://images.unsplash.com/photo-1614028674026-a65e31bfd27c?w=400&h=400&fit=crop" className="w-32 h-32 rounded-full border-4 border-slate-700 shadow-2xl mb-6 opacity-80 mix-blend-luminosity" />
                              <div className="flex items-center gap-1">
                                 {[1,2,3,4,5,6,7].map(i => (
                                     <div key={i} className={`w-1.5 bg-blue-500 rounded-full animate-pulse`} style={{ height: `${Math.random() * 40 + 10}px`, animationDelay: `${i * 0.1}s` }}></div>
                                 ))}
                              </div>
                              <span className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-6">Audio Broadcast</span>
                           </div>
                        )
                    )}
                    <div className="absolute top-4 left-4 flex gap-2">
                       <div className="bg-red-600 px-3 py-1 text-white text-[10px] font-black tracking-widest uppercase rounded">● LIVE</div>
                       <div className="bg-black/60 backdrop-blur text-white px-3 py-1 text-[10px] font-bold tracking-widest uppercase rounded flex items-center gap-1.5 border border-white/10">
                          <Presentation className="w-3 h-3" />
                          CHAIRMAN DESK
                       </div>
                    </div>
                  </>
               ) : (
                  <div className="flex flex-col items-center justify-center text-slate-500">
                     <MonitorPlay className="w-16 h-16 mb-4 opacity-20" />
                     <span className="text-sm font-bold uppercase tracking-widest text-slate-600">OFFLINE</span>
                  </div>
               )}
            </div>

            {/* Split layout: Transcript & Live Chat */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {/* Transcript Box */}
               <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col h-[320px]">
                  <div className="flex justify-between items-center mb-3">
                     <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                        <TextSelect className="w-4 h-4" /> Live Transcript
                     </h3>
                     {isLive && <Activity className="w-4 h-4 text-emerald-500 animate-pulse" />}
                  </div>
                  <div className="font-mono text-xs text-slate-350 leading-relaxed flex-1 overflow-y-auto custom-scrollbar pr-1">
                     {systemStatus.microphone === 'Failed' ? (
                        <span className="text-rose-500 font-bold uppercase tracking-wide flex items-center gap-2 text-xs">
                           <AlertCircle className="w-4 h-4 animate-bounce" /> Microphone not detected
                        </span>
                     ) : (
                        broadcastData.transcript || (isLive ? <span className="text-blue-400 italic font-sans block mt-1 animate-pulse">Chairman sedang bersiap untuk menyampaikan analisis ekonomi makro...</span> : <span className="text-slate-700 italic">No active broadcast.</span>)
                     )}
                  </div>
               </div>

               {/* Live Chat Box */}
               <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col h-[320px] relative overflow-hidden">
                  <div className="flex justify-between items-center mb-3 border-b border-slate-800 pb-2">
                     <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-blue-400" /> Live Chat & Feedback
                     </h3>
                     {isLive && (
                        <span className="text-[10px] font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20 shrink-0">
                           {liveComments.length > 0 ? '● Active' : 'Waiting'}
                        </span>
                     )}
                  </div>
                  
                  <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2.5 pr-1 font-sans">
                     {isLive ? (
                        liveComments.map((comment) => (
                           <div key={comment.id} className="flex gap-2.5 text-xs items-start">
                              <div className={`w-6 h-6 rounded-full ${comment.avatarColor} text-white flex items-center justify-center font-bold text-[10px] shrink-0`}>
                                 {comment.username.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0 bg-slate-950/45 p-2 rounded border border-slate-800/50">
                                 <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-bold text-slate-300 truncate">@{comment.username}</span>
                                    {comment.badge && (
                                       <span className={`text-[8.5px] px-1.5 py-0.2 rounded font-black uppercase leading-none tracking-tight ${
                                          comment.badge === 'VIP' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                       }`}>
                                          {comment.badge}
                                       </span>
                                    )}
                                 </div>
                                 <p className="text-slate-300 mt-1 leading-snug break-words">{comment.text}</p>
                              </div>
                           </div>
                        ))
                     ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-500 py-6 text-center space-y-2">
                           <MessageSquare className="w-8 h-8 opacity-25" />
                           <p className="text-xs font-bold uppercase tracking-widest text-slate-600">Lobby Chat Offline</p>
                           <p className="text-[10px] text-slate-600 max-w-xs">Komponen interaksi penonton otomatis aktif saat The Fed menyiarkan konferensi pers ekonomi.</p>
                        </div>
                     )}
                     <div ref={chatEndRef} />
                  </div>
               </div>
            </div>
         </div>

         {/* Side Panel */}
         <div className="space-y-4">
            {/* SYSTEM STATUS PANEL */}
            <div className="bg-slate-950 border border-slate-700/50 rounded-xl p-4 shadow-inner">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-2">
                   <Activity className="w-3 h-3" /> System Status
                </h3>
                <div className="space-y-2 text-[10px] font-mono">
                   <div className="flex justify-between">
                      <span className="text-slate-400">Camera</span>
                      <span className={systemStatus.camera === 'Connected' ? 'text-emerald-500' : 'text-rose-500'}>{systemStatus.camera}</span>
                   </div>
                   <div className="flex justify-between">
                      <span className="text-slate-400">Microphone</span>
                      <span className={systemStatus.microphone === 'Connected' ? 'text-emerald-500' : 'text-rose-500'}>{systemStatus.microphone}</span>
                   </div>
                   <div className="flex justify-between">
                      <span className="text-slate-400">Speech</span>
                      <span className={systemStatus.speech === 'Running' ? 'text-blue-500' : systemStatus.speech === 'Failed' ? 'text-rose-500' : 'text-slate-500'}>{systemStatus.speech}</span>
                   </div>
                   {systemStatus.errors.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-800 text-rose-500 space-y-1">
                         {systemStatus.errors.map((err, i) => <div key={i}>{err}</div>)}
                      </div>
                   )}
                </div>
            </div>

            {/* Founder Controls (Only for Founder) */}
            {isFounder && (
               <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 shadow-lg relative overflow-hidden">
                  <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-blue-600/10 rounded-full blur-2xl"></div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-blue-400 mb-5 flex items-center gap-2">
                     <Zap className="w-4 h-4" /> Chairman Control Desk
                  </h3>
                  
                  <div className="space-y-4 relative z-10">
                     <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2">Mode Siaran</label>
                        <div className="grid grid-cols-2 gap-2">
                           <button 
                             onClick={() => !isLive && updateDoc(doc(db, 'system', 'fed_broadcast'), { mode: 'camera' })}
                             className={`p-2 rounded flex flex-col items-center justify-center gap-1 border transition-colors ${broadcastData.mode === 'camera' ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'} ${isLive && 'opacity-50 cursor-not-allowed'}`}
                             disabled={isLive}
                           >
                              <Video className="w-5 h-5" />
                              <span className="text-[9px] font-black uppercase">Video Langsung</span>
                           </button>
                           <button 
                             onClick={() => !isLive && updateDoc(doc(db, 'system', 'fed_broadcast'), { mode: 'audio' })}
                             className={`p-2 rounded flex flex-col items-center justify-center gap-1 border transition-colors ${broadcastData.mode === 'audio' ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'} ${isLive && 'opacity-50 cursor-not-allowed'}`}
                             disabled={isLive}
                           >
                              <Mic className="w-5 h-5" />
                              <span className="text-[9px] font-black uppercase">Audio Saja</span>
                           </button>
                        </div>
                     </div>

                     <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2">Pengumuman Ekonomi (Banner)</label>
                        <div className="flex gap-2">
                           <input 
                              type="text" 
                              value={broadcastData.announcement || ''}
                              onChange={(e) => updateDoc(doc(db, 'system', 'fed_broadcast'), { announcement: e.target.value })}
                              placeholder="Contoh: Liquidity Expansion"
                              className="w-full bg-slate-800 border border-slate-700 text-xs rounded px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 font-mono"
                           />
                        </div>
                     </div>

                     <button 
                        onClick={toggleLive}
                        className={`w-full py-3 rounded text-xs font-black uppercase tracking-widest transition-colors ${isLive ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-900/20' : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-900/20'}`}
                     >
                        {isLive ? 'Akhiri Siaran' : 'Mulai Siaran (GO LIVE)'}
                     </button>
                  </div>
               </div>
            )}

            {/* Live Sentiment Meter */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 relative overflow-hidden">
               <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" /> Live Market Sentiment
               </h3>
               
               <div className="flex flex-col items-center justify-center py-4">
                  <div className="text-4xl font-black font-mono tracking-tighter text-white mb-2">
                     {broadcastData.sentiment}
                  </div>
                  <div className={`text-sm font-black uppercase tracking-widest ${getSentimentColor(broadcastData.sentiment)}`}>
                     {getSentimentText(broadcastData.sentiment)}
                  </div>
               </div>

               {/* Meter UI */}
               <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden mt-2 relative">
                  <div 
                    className={`h-full absolute left-0 top-0 transition-all duration-1000 ${broadcastData.sentiment >= 50 ? 'bg-emerald-500' : 'bg-red-500'}`}
                    style={{ width: `${broadcastData.sentiment}%` }}
                  ></div>
                  <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-slate-600 z-10"></div>
               </div>
               <div className="flex justify-between text-[9px] font-bold text-slate-600 uppercase mt-2">
                  <span>Bearish</span>
                  <span>Neutral</span>
                  <span>Bullish</span>
               </div>
            </div>

            {/* Market Confidence Impact */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
               <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                  <Activity className="w-4 h-4" /> Market Confidence Impact
               </h3>
               <div className="space-y-4">
                  <div className="flex justify-between items-center">
                     <span className="text-xs text-slate-400 font-bold">Community Confidence</span>
                     <span className={`text-xs font-mono font-black ${broadcastData.sentiment >= 50 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {broadcastData.sentiment >= 50 ? '+' : ''}{((broadcastData.sentiment - 50) / 5).toFixed(1)}%
                     </span>
                  </div>
                  <div className="flex justify-between items-center">
                     <span className="text-xs text-slate-400 font-bold">Trading Interest</span>
                     <span className={`text-xs font-mono font-black ${broadcastData.sentiment >= 50 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {broadcastData.sentiment >= 50 ? '+' : ''}{((broadcastData.sentiment - 50) / 4).toFixed(1)}%
                     </span>
                  </div>
                  <div className="flex justify-between items-center">
                     <span className="text-xs text-slate-400 font-bold">Liquidity Expectations</span>
                     <span className={`text-xs font-mono font-black ${broadcastData.sentiment >= 50 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {broadcastData.sentiment >= 50 ? 'Expansive' : broadcastData.sentiment === 50 ? 'Stable' : 'Restrictive'}
                     </span>
                  </div>
               </div>
            </div>

            {/* Coin Reaction Monitor */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 max-h-[300px] overflow-y-auto custom-scrollbar">
               <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2 sticky top-0 bg-slate-900 pb-2 z-10">
                  <Zap className="w-4 h-4 text-emerald-400" /> Active Market Response
               </h3>
               <div className="space-y-3">
                  {assetImpacts.length > 0 ? (
                     assetImpacts.map((asset, idx) => (
                        <div key={idx} className="flex justify-between items-center p-3 bg-slate-950 rounded-lg border border-slate-800">
                           <div>
                              <div className="text-sm font-black text-white">{asset.symbol}</div>
                              <div className={`text-[9px] font-bold uppercase tracking-widest ${asset.rawScore >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                 {asset.sentiment}
                              </div>
                           </div>
                           <div className="text-right">
                              <div className={`text-sm font-mono font-black ${asset.rawScore >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                 {asset.impact}
                              </div>
                              {asset.newPrice && (
                                 <div className="text-[10px] text-slate-400 font-mono mt-1">
                                    ${asset.newPrice.toFixed(4)}
                                 </div>
                              )}
                           </div>
                        </div>
                     ))
                  ) : (
                     <div className="text-xs text-slate-500 text-center py-4 font-bold uppercase tracking-widest">
                        Listening for market impact...
                     </div>
                  )}
               </div>
            </div>

            {/* Archive Suggestion */}
            <div className="bg-slate-900 border border-slate-800 border-dashed rounded-xl p-4 flex items-center justify-between opacity-80 hover:opacity-100 transition-opacity cursor-pointer">
               <div className="flex items-center gap-3">
                  <FileAudio className="w-5 h-5 text-slate-500" />
                  <div>
                     <div className="text-xs font-bold text-slate-300">Broadcast Archive</div>
                     <div className="text-[10px] text-slate-500">View past press conferences</div>
                  </div>
               </div>
            </div>

         </div>
      </div>
    </div>
  );
}
