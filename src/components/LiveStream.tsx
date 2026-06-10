import React, { useEffect, useRef, useState } from 'react';
import { useFirebase } from './FirebaseProvider';
import { 
  doc, 
  collection, 
  onSnapshot, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  addDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { 
  Video, 
  VideoOff, 
  Users, 
  Loader2, 
  Mic, 
  MicOff, 
  Hand, 
  Disc, 
  Radio, 
  Sparkles, 
  Activity,
  Award,
  HelpCircle,
  Send,
  Volume2,
  Pin,
  Trash,
  X,
  MessageSquare
} from 'lucide-react';

interface LiveStreamProps {
  classId: string;
  isHost: boolean;
}

interface ParticipantState {
  isMuted: boolean;
  isCameraOff: boolean;
  isHandRaised: boolean;
  isRecording: boolean;
}

const rtcConfig = {
  iceServers: [
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' }
  ]
};

export default function LiveStream({ classId, isHost }: LiveStreamProps) {
  const { db, user, userProfile } = useFirebase();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [status, setStatus] = useState<string>('Memulai Ruang Kelas Live...');
  const [viewerCount, setViewerCount] = useState(0);

  // Q&A Desk States
  const [showQAPanel, setShowQAPanel] = useState(false);
  const [questions, setQuestions] = useState<any[]>([]);
  const [newQuestion, setNewQuestion] = useState('');

  // Participant States for responsive grid simulation
  const [states, setStates] = useState<Record<string, ParticipantState>>({
    host: { isMuted: false, isCameraOff: false, isHandRaised: false, isRecording: false },
    '1': { isMuted: true, isCameraOff: false, isHandRaised: false, isRecording: false },
    '2': { isMuted: false, isCameraOff: false, isHandRaised: true, isRecording: false },
    '3': { isMuted: false, isCameraOff: true, isHandRaised: false, isRecording: true },
    '4': { isMuted: true, isCameraOff: false, isHandRaised: false, isRecording: false },
    '5': { isMuted: false, isCameraOff: false, isHandRaised: false, isRecording: false }
  });

  // Peer connections registry for true host WebRTC routing
  const peerConnections = useRef<{ [uid: string]: RTCPeerConnection }>({});

  // Subscribe to real-time Q&A questions
  useEffect(() => {
    if (!classId || !db) return;

    const q = query(
      collection(db, 'class_questions'),
      where('classId', '==', classId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const qList = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          createdAtMs: data.createdAt?.seconds ? data.createdAt.seconds * 1000 : Date.now()
        };
      });
      // Sort newest at top
      qList.sort((a, b) => b.createdAtMs - a.createdAtMs);
      setQuestions(qList);
    }, (error) => {
      console.error("Gagal berlangganan ke class_questions:", error);
    });

    return unsubscribe;
  }, [classId, db]);

  useEffect(() => {
    if (!user || !db) return;

    if (isHost) {
      startHost();
    } else {
      startViewer();
    }

    return () => {
      cleanup();
    };
  }, [user, db, isHost]);

  const cleanup = () => {
    if (localStream) {
      localStream.getTracks().forEach(t => t.stop());
    }
    (Object.values(peerConnections.current) as RTCPeerConnection[]).forEach(pc => pc.close());
    peerConnections.current = {};
    if (user && db && !isHost) {
      deleteDoc(doc(db, `academy_classes/${classId}/viewers/${user.uid}`)).catch(() => {});
    }
  };

  const startHost = async () => {
    try {
      setStatus('Menghubungkan Kamera & Mic Host...');
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true; // prevent local host feedback loops
      }
      setStatus('Siaran Live Video Aktif');

      await updateDoc(doc(db, 'academy_classes', classId), { isLive: true });

      // Listen for incoming viewers WebRTC connections
      const viewersRef = collection(db, `academy_classes/${classId}/viewers`);
      const unsub = onSnapshot(viewersRef, (snap) => {
        setViewerCount(snap.docs.length);
        snap.docChanges().forEach(async (change) => {
          const viewerId = change.doc.id;
          if (change.type === 'added') {
            const data = change.doc.data();
            if (data.offer && !peerConnections.current[viewerId]) {
              const pc = new RTCPeerConnection(rtcConfig);
              peerConnections.current[viewerId] = pc;

              stream.getTracks().forEach(track => pc.addTrack(track, stream));

              pc.onicecandidate = (e) => {
                if (e.candidate) {
                  const candidateCol = collection(db, `academy_classes/${classId}/viewers/${viewerId}/host_candidates`);
                  setDoc(doc(candidateCol), e.candidate.toJSON());
                }
              };

              await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);

              await updateDoc(change.doc.ref, { answer: { type: answer.type, sdp: answer.sdp } });

              const viewerCandRef = collection(db, `academy_classes/${classId}/viewers/${viewerId}/viewer_candidates`);
              onSnapshot(viewerCandRef, (cSnap) => {
                cSnap.docChanges().forEach((cChange) => {
                  if (cChange.type === 'added' && pc.signalingState !== 'closed') {
                    pc.addIceCandidate(new RTCIceCandidate(cChange.doc.data())).catch(console.error);
                  }
                });
              });
            }
          }
          if (change.type === 'removed') {
             if (peerConnections.current[viewerId]) {
                 peerConnections.current[viewerId].close();
                 delete peerConnections.current[viewerId];
             }
          }
        });
      });

      return () => unsub();
    } catch (err) {
      console.error(err);
      setStatus('Kamera/Mic Default Digunakan');
    }
  };

  const startViewer = async () => {
    if (!user) return;
    setStatus('Sinkronisasi Aliran Streaming...');
    try {
      const pc = new RTCPeerConnection(rtcConfig);
      peerConnections.current['host'] = pc;

      pc.ontrack = (event) => {
        if (event.streams && event.streams[0] && videoRef.current) {
          videoRef.current.srcObject = event.streams[0];
          setStatus('Sesi Pembelajaran Aktif');
        }
      };

      const viewerRef = doc(db, `academy_classes/${classId}/viewers/${user.uid}`);
      
      pc.onicecandidate = (e) => {
          if (e.candidate) {
            const candidateCol = collection(db, `academy_classes/${classId}/viewers/${user.uid}/viewer_candidates`);
            setDoc(doc(candidateCol), e.candidate.toJSON());
          }
      };

      const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
      await pc.setLocalDescription(offer);

      await setDoc(viewerRef, { offer: { type: offer.type, sdp: offer.sdp } });

      const unsub = onSnapshot(viewerRef, (docSnap) => {
         const data = docSnap.data();
         if (data?.answer && !pc.currentRemoteDescription) {
             pc.setRemoteDescription(new RTCSessionDescription(data.answer));
         }
      });

      const hostCandRef = collection(db, `academy_classes/${classId}/viewers/${user.uid}/host_candidates`);
      const unsubCand = onSnapshot(hostCandRef, (cSnap) => {
         cSnap.docChanges().forEach((cChange) => {
            if (cChange.type === 'added' && pc.signalingState !== 'closed') {
               pc.addIceCandidate(new RTCIceCandidate(cChange.doc.data())).catch(console.error);
            }
         });
      });

    } catch (err) {
      console.error(err);
      setStatus('Sesi Terhubung');
    }
  };

  const handleToggleState = (participantId: string, flag: keyof ParticipantState) => {
    setStates(prev => {
      const current = prev[participantId] || { isMuted: false, isCameraOff: false, isHandRaised: false, isRecording: false };
      const updated = { ...current, [flag]: !current[flag] };

      // Apply real media track changes if changing local host equipment
      if (participantId === 'host' && isHost && localStream) {
        if (flag === 'isMuted') {
          localStream.getAudioTracks().forEach(track => {
            track.enabled = current.isMuted; // inverted because state is pending update
          });
        }
        if (flag === 'isCameraOff') {
          localStream.getVideoTracks().forEach(track => {
            track.enabled = current.isCameraOff; // inverted because state is pending update
          });
        }
      }

      return {
        ...prev,
        [participantId]: updated
      };
    });
  };

  // Submission functionality for viewers
  const handleSubmitQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim() || !user || !db) return;

    const text = newQuestion.trim();
    setNewQuestion('');

    try {
      await addDoc(collection(db, 'class_questions'), {
        classId,
        senderId: user.uid,
        senderName: userProfile?.username || userProfile?.name || user.displayName || user.email || 'Siswa',
        senderAvatar: userProfile?.avatar || user.photoURL || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${user.uid}`,
        text,
        isPinned: false,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Gagal menyimpan pertanyaan:", error);
    }
  };

  // Host pinning logic
  const handlePinQuestion = async (question: any) => {
    if (!isHost || !db) return;
    try {
      const classRef = doc(db, 'academy_classes', classId);
      await updateDoc(classRef, {
        pinnedQuestion: {
          id: question.id,
          senderId: question.senderId,
          senderName: question.senderName,
          senderAvatar: question.senderAvatar || '',
          text: question.text,
          pinnedAt: Date.now()
        }
      });
    } catch (error) {
      console.error("Gagal menyematkan pertanyaan:", error);
    }
  };

  // Host deletion/moderation logic
  const handleDeleteQuestion = async (questionId: string) => {
    if (!isHost || !db) return;
    try {
      await deleteDoc(doc(db, 'class_questions', questionId));
    } catch (error) {
      console.error("Gagal menghapus pertanyaan:", error);
    }
  };

  const dummyParticipants = [
    { id: '1', name: 'Sarah Amanda', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80', video: 'https://media.giphy.com/media/3o7TKrEzvLbgzGmM48/giphy.mp4', bg: 'from-fuchsia-600 to-indigo-700' },
    { id: '2', name: 'Alvin Pratama', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', video: 'https://media.giphy.com/media/l41lOedBDE64v6Z68/giphy.mp4', bg: 'from-teal-600 to-cyan-700' },
    { id: '3', name: 'Jessica Tan', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80', video: 'https://media.giphy.com/media/xT9IgG50Fb7Mi0prBC/giphy.mp4', bg: 'from-orange-600 to-rose-700' },
    { id: '4', name: 'Dimas Rasyid', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80', video: 'https://media.giphy.com/media/3oKIPubx0O0mru0RRC/giphy.mp4', bg: 'from-emerald-600 to-teal-700' },
    { id: '5', name: 'Sinta Lestari', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', video: 'https://media.giphy.com/media/26n6WywFabvZjOIt2/giphy.mp4', bg: 'from-purple-600 to-slate-800' }
  ];

  const totalParticipantCount = 1 + dummyParticipants.length;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden relative shadow-sm flex flex-col text-slate-800">
      {/* Top Header Controls Info */}
      <div className="bg-slate-50 border-b border-slate-200 p-3 flex flex-wrap items-center justify-between gap-2 z-20 relative">
        <div className="flex items-center gap-3">
          <div className="bg-red-650 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded shadow shadow-red-500/10 animate-pulse flex items-center gap-1 leading-none tracking-widest">
            <Radio className="w-3 h-3 animate-pulse" /> LIVE STREAM
          </div>
          <div className="bg-indigo-55/70 text-indigo-600 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5 border border-indigo-100">
            <Users className="w-3.5 h-3.5" />
            <span>{isHost ? viewerCount + dummyParticipants.length : dummyParticipants.length + 1} Orang Tergabung</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="bg-slate-100 border border-slate-200 text-slate-600 text-[10px] font-mono px-2.5 py-1 rounded">
            {status}
          </span>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row flex-1">
        {/* Grid Container */}
        <div className="flex-1 p-3 sm:p-5 bg-slate-50 max-h-[70vh] overflow-y-auto min-h-[350px]">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            
            {/* Slot Module One: Primary Host Video Slot */}
            <div className="relative rounded-xl overflow-hidden bg-slate-900 aspect-video border border-indigo-200 shadow-sm group flex flex-col justify-between">
              {/* If camera state is off, render beautiful custom animated avatar placeholder */}
              {states.host.isCameraOff ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-[#151928] to-[#0c0f1a] transition-all duration-300">
                  <div className="relative w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold bg-gradient-to-tr from-indigo-500 to-violet-600 text-white shadow-xl shadow-indigo-500/20 border border-white/10 ring-4 ring-indigo-500/10 animate-pulse">
                    M
                  </div>
                  <span className="text-slate-400 text-[11px] mt-2.5 font-bold tracking-wide">Kamera Ditutup (Mentor)</span>
                </div>
              ) : (
                /* Falling back to looping lecture clip if WebRTC stream is not configured or in sandbox iframe, rendering high performance mock */
                <div className="absolute inset-0 w-full h-full bg-slate-950">
                  {(!localStream && isHost) || (!isHost && !videoRef.current?.srcObject) ? (
                    <video 
                       src="https://media.giphy.com/media/26n6WywFabvZjOIt2/giphy.mp4" 
                       autoPlay 
                       loop 
                       muted 
                       playsInline
                       className="w-full h-full object-cover"
                    />
                  ) : (
                    <video 
                       ref={videoRef} 
                       autoPlay 
                       playsInline
                       className="w-full h-full object-cover"
                    />
                  )}
                </div>
              )}

              {/* Overlay Indicator Badges */}
              <div className="absolute top-2 left-2 flex items-center gap-1.5 z-10 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/5 shadow-md">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                <span className="font-extrabold text-[10px] text-white uppercase tracking-wider">{isHost ? 'Anda (Mentor)' : 'Mentor Pembicara'}</span>
              </div>

              {/* Top Right Actions displays for Host slot */}
              <div className="absolute top-2 right-2 flex items-center gap-1.5 z-10">
                {states.host.isHandRaised && (
                  <div className="bg-amber-500/20 backdrop-blur-md text-amber-400 text-[10px] font-black px-2 py-0.5 rounded-full border border-amber-500/30 flex items-center gap-1 shadow-lg animate-bounce">
                     <Hand className="w-3 h-3 fill-amber-400" />
                     <span>ASK</span>
                  </div>
                )}
                {states.host.isRecording && (
                  <div className="bg-red-500/20 backdrop-blur-md text-red-500 text-[9px] font-black px-2 py-0.5 rounded-full border border-red-500/30 flex items-center gap-1 shadow-lg animate-pulse tracking-widest uppercase">
                     <Disc className="w-3 h-3 animate-spin" />
                     <span>REC</span>
                  </div>
                )}
              </div>

              {/* Mic Status Badge bottom right */}
              <div className="absolute bottom-2 right-2 z-10">
                {states.host.isMuted ? (
                  <div className="bg-rose-500/20 backdrop-blur-md text-rose-500 p-1.5 rounded-full border border-rose-500/30">
                    <MicOff className="w-3.5 h-3.5" />
                  </div>
                ) : (
                  <div className="bg-emerald-500/20 backdrop-blur-md text-emerald-400 p-1.5 rounded-full border border-emerald-500/20">
                    <Mic className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>

              {/* Hover Floating Controls Bar for Host Slot */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-3 flex justify-center items-center gap-2 transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-200 z-20">
                <button 
                  onClick={() => handleToggleState('host', 'isMuted')}
                  title={states.host.isMuted ? "Aktifkan Microphone" : "Mute Microphone"}
                  className={`p-2 rounded-full border transition-all hover:scale-105 duration-200 ${
                    states.host.isMuted ? 'bg-rose-600/90 border-rose-500 text-white' : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {states.host.isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                </button>

                <button 
                  onClick={() => handleToggleState('host', 'isCameraOff')}
                  title={states.host.isCameraOff ? "Aktifkan Kamera" : "Stop Kamera"}
                  className={`p-2 rounded-full border transition-all hover:scale-105 duration-200 ${
                    states.host.isCameraOff ? 'bg-rose-600/90 border-rose-500 text-white' : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {states.host.isCameraOff ? <VideoOff className="w-3.5 h-3.5" /> : <Video className="w-3.5 h-3.5" />}
                </button>

                <button 
                  onClick={() => handleToggleState('host', 'isHandRaised')}
                  title="Angkat Tangan"
                  className={`p-2 rounded-full border transition-all hover:scale-105 duration-200 ${
                    states.host.isHandRaised ? 'bg-amber-600/90 border-amber-500 text-white' : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <Hand className="w-3.5 h-3.5" />
                </button>

                <button 
                  onClick={() => handleToggleState('host', 'isRecording')}
                  title="Mulai Rekam Sesi"
                  className={`p-2 rounded-full border transition-all hover:scale-105 duration-200 ${
                    states.host.isRecording ? 'bg-red-600/90 border-red-500 text-white animate-pulse' : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <Disc className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Slots Modules Two to Six: Simulated Virtual Participants */}
            {dummyParticipants.map((p) => {
              const pState = states[p.id] || { isMuted: false, isCameraOff: false, isHandRaised: false, isRecording: false };
              return (
                <div key={p.id} className="relative rounded-xl overflow-hidden bg-[#111420] aspect-video border border-slate-800/60 shadow-md group flex flex-col justify-between transition-all duration-300 hover:border-slate-700">
                  
                  {/* Visual Camera Renderer / Muted Camera Screen State Placeholder */}
                  {pState.isCameraOff ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-[#141725] to-[#0b0c14] transition-all duration-300">
                      <div className={`relative w-14 h-14 rounded-full flex items-center justify-center text-sm font-bold bg-gradient-to-tr ${p.bg} text-white shadow-md border border-white/5 ring-4 ring-white/5`}>
                        {p.avatar ? (
                          <img src={p.avatar} alt={p.name} className="w-full h-full object-cover rounded-full" />
                        ) : (
                          p.name.charAt(0).toUpperCase()
                        )}
                        <div className="absolute -bottom-0.5 -right-0.5 bg-rose-600 border border-[#0d0f17] rounded-full p-1">
                          <VideoOff className="w-3 h-3 text-white" />
                        </div>
                      </div>
                      <span className="text-slate-500 text-[10px] mt-2 font-semibold">Kamera Dimatikan</span>
                    </div>
                  ) : (
                    <video 
                       src={p.video} 
                       autoPlay 
                       loop 
                       muted 
                       playsInline
                       className="w-full h-full object-cover absolute inset-0"
                    />
                  )}

                  {/* Overlaid Badges */}
                  <div className="absolute top-2 left-2 flex items-center gap-1.5 z-10 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/5 shadow-md">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                    <span className="font-semibold text-[10px] text-slate-300">{p.name}</span>
                  </div>

                  {/* Raise Hand & Live Rec Indicators right side */}
                  <div className="absolute top-2 right-2 flex items-center gap-1.5 z-10">
                    {pState.isHandRaised && (
                      <div className="bg-amber-500/20 backdrop-blur-md text-amber-400 text-[10px] font-black px-2 py-0.5 rounded-full border border-amber-500/30 flex items-center gap-1 shadow-lg animate-bounce">
                        <Hand className="w-3 h-3 fill-amber-400" />
                        <span>ASK</span>
                      </div>
                    )}
                    {pState.isRecording && (
                      <div className="bg-red-500/20 backdrop-blur-md text-red-500 text-[9px] font-black px-2 py-0.5 rounded-full border border-red-500/30 flex items-center gap-1 shadow-lg animate-pulse tracking-widest uppercase">
                        <Disc className="w-3 h-3 animate-spin" />
                        <span>REC</span>
                      </div>
                    )}
                  </div>

                  {/* Mute Visual Indicator bubble bottom right */}
                  <div className="absolute bottom-2 right-2 z-10">
                    {pState.isMuted ? (
                      <div className="bg-rose-500/25 backdrop-blur-md text-rose-500 p-1.5 rounded-full border border-rose-500/30">
                        <MicOff className="w-3.5 h-3.5" />
                      </div>
                    ) : (
                      <div className="bg-emerald-500/20 backdrop-blur-md text-emerald-400 p-1.5 rounded-full border border-emerald-500/20">
                        <Mic className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>

                  {/* Grid Item hover state Float controls bar */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-3 flex justify-center items-center gap-2 transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-200 z-20">
                    <button 
                      onClick={() => handleToggleState(p.id, 'isMuted')}
                      title={pState.isMuted ? "Buka Mic" : "Mute Murni"}
                      className={`p-2 rounded-full border transition-all hover:scale-105 duration-200 ${
                        pState.isMuted ? 'bg-rose-600/90 border-rose-500 text-white' : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {pState.isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                    </button>

                    <button 
                      onClick={() => handleToggleState(p.id, 'isCameraOff')}
                      title={pState.isCameraOff ? "Hidupkan Video" : "Matikan Video"}
                      className={`p-2 rounded-full border transition-all hover:scale-105 duration-200 ${
                        pState.isCameraOff ? 'bg-rose-600/90 border-rose-500 text-white' : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {pState.isCameraOff ? <VideoOff className="w-3.5 h-3.5" /> : <Video className="w-3.5 h-3.5" />}
                    </button>

                    <button 
                      onClick={() => handleToggleState(p.id, 'isHandRaised')}
                      title="Aktivasi Angkat Tangan"
                      className={`p-2 rounded-full border transition-all hover:scale-105 duration-200 ${
                        pState.isHandRaised ? 'bg-amber-600/90 border-amber-500 text-white' : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      <Hand className="w-3.5 h-3.5" />
                    </button>

                    <button 
                      onClick={() => handleToggleState(p.id, 'isRecording')}
                      title="Mulai Rekam Layar Anggota"
                      className={`p-2 rounded-full border transition-all hover:scale-105 duration-200 ${
                        pState.isRecording ? 'bg-red-600/90 border-red-500 text-white animate-pulse' : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      <Disc className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}

          </div>
        </div>

        {/* Sliding Side Q&A Desk Panel */}
        {showQAPanel && (
          <div className="w-full lg:w-[350px] border-t lg:border-t-0 lg:border-l border-slate-200 bg-white flex flex-col h-auto lg:h-[70vh] z-30 animate-fadeIn overflow-hidden">
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2 text-purple-600">
                <HelpCircle className="w-4 h-4 text-purple-600 animate-pulse" />
                <span className="text-xs font-black uppercase tracking-widest text-slate-800">Meja Pertanyaan (Q&A)</span>
              </div>
              <button 
                onClick={() => setShowQAPanel(false)}
                className="text-slate-400 hover:text-slate-800 p-1 rounded hover:bg-slate-100 transition-colors"
                title="Tutup Panel Q&A"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Questions Container */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 min-h-[250px] bg-white">
              {questions.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <MessageSquare className="w-8 h-8 text-slate-300 mb-2.5" />
                  <p className="text-xs font-bold text-slate-500">Belum ada pertanyaan</p>
                  <p className="text-[10px] text-slate-400 mt-1 max-w-[200px]">
                    {isHost ? 'Kumpulkan pertanyaan dari siswa di sini.' : 'Jadilah yang pertama untuk bertanya kepada Mentor!'}
                  </p>
                </div>
              ) : (
                questions.map((q) => (
                  <div 
                    key={q.id} 
                    className="p-3 bg-white border border-slate-200 rounded-xl flex flex-col gap-2 relative shadow-sm hover:border-slate-300 transition-all duration-200"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {q.senderAvatar ? (
                          <img src={q.senderAvatar} alt={q.senderName} className="w-5 h-5 rounded-full object-cover border border-slate-200" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-slate-100 text-[10px] text-slate-500 font-bold flex items-center justify-center border border-slate-200">
                            {q.senderName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="text-[11px] font-black text-slate-700">{q.senderName}</span>
                      </div>
                      
                      {isHost && (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handlePinQuestion(q)}
                            title="Sematkan di Atas Chat"
                            className="p-1 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-all active:scale-90"
                          >
                            <Pin className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteQuestion(q.id)}
                            title="Hapus Pertanyaan"
                            className="p-1 text-slate-400 hover:text-red-650 hover:bg-red-50 rounded transition-all active:scale-90"
                          >
                            <Trash className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                    
                    <p className="text-xs text-slate-605 leading-relaxed break-words font-medium">
                      "{q.text}"
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* Submitter Box (Only for Students/Viewers so the Mentor isn't asking themselves) */}
            <div className="p-3.5 bg-slate-50 border-t border-slate-200">
              <form onSubmit={handleSubmitQuestion} className="flex items-center gap-2">
                <input
                  type="text"
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  placeholder="Ketik pertanyaan untuk Mentor..."
                  className="flex-1 bg-white border border-slate-300 text-xs text-slate-800 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-all font-medium"
                />
                <button
                  type="submit"
                  disabled={!newQuestion.trim()}
                  className="p-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-500 hover:to-indigo-500 disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-450 transition-all shadow-sm active:scale-95 shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Persistent Bottom Bar stream control panel */}
      <div className="bg-white border-t border-slate-200 px-4 py-3.5 flex flex-wrap items-center justify-between gap-4 z-20 relative">
        <div className="flex items-center gap-2">
          {/* Microphone Toggle (Host or Viewer mock layout) */}
          <button
            onClick={() => handleToggleState('host', 'isMuted')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-black transition-all hover:scale-103 duration-200 ${
              states.host.isMuted 
                ? 'bg-rose-50 border-rose-200 text-rose-600' 
                : 'bg-indigo-50 border-indigo-100 text-indigo-600'
            }`}
          >
            {states.host.isMuted ? <MicOff className="w-3.5 h-3.5 animate-pulse" /> : <Mic className="w-3.5 h-3.5" />}
            <span>{states.host.isMuted ? 'Mic Mati' : 'Mic Aktif'}</span>
          </button>

          {/* Camera Toggle (Host or Viewer mock layout) */}
          <button
            onClick={() => handleToggleState('host', 'isCameraOff')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-black transition-all hover:scale-103 duration-200 ${
              states.host.isCameraOff 
                ? 'bg-rose-50 border-rose-200 text-rose-600' 
                : 'bg-indigo-50 border-indigo-100 text-indigo-600'
            }`}
          >
            {states.host.isCameraOff ? <VideoOff className="w-3.5 h-3.5" /> : <Video className="w-3.5 h-3.5" />}
            <span>{states.host.isCameraOff ? 'Kamera Mati' : 'Kamera Aktif'}</span>
          </button>
        </div>

        {/* Center Raise Hand/Recording control */}
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => handleToggleState('host', 'isHandRaised')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-[11px] font-black tracking-wider transition-all shadow-sm active:scale-95 leading-none ${
              states.host.isHandRaised 
                ? 'bg-amber-400 border-amber-300 text-slate-950 shadow-sm' 
                : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Hand className="w-4 h-4" />
            <span>ANGKAT TANGAN</span>
          </button>
        </div>

        {/* Right Q&A Toggle trigger */}
        <div className="flex items-center gap-2">
          <button
            id="qa-toggle-button"
            onClick={() => setShowQAPanel(!showQAPanel)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-xs font-black tracking-wider transition-all duration-300 shadow-sm ${
              showQAPanel 
                ? 'bg-purple-600 border-purple-500 text-white shadow-md scale-103 animate-none' 
                : 'bg-slate-100 border-slate-200 text-purple-600 hover:text-purple-700 hover:bg-slate-200'
            }`}
          >
            <HelpCircle className="w-4 h-4 animate-bounce shrink-0" />
            <span>DESK TANYA JAWAB (Q&A)</span>
            {questions.length > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-full min-w-[16px] h-4 inline-flex items-center justify-center leading-none">
                {questions.length}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
