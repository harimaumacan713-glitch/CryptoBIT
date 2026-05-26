/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, User, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, query, addDoc, serverTimestamp, setDoc, doc, updateDoc } from 'firebase/firestore';
import { IPOCoin, IPOOrder } from '../types';

const firebaseConfig = {
  apiKey: "AIzaSyAm1t-K3LnK41NqaU1GF_ZfnwpYkyOSTbU",
  authDomain: "ewallet-crypto.firebaseapp.com",
  databaseURL: "https://ewallet-crypto-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "ewallet-crypto",
  storageBucket: "ewallet-crypto.firebasestorage.app",
  messagingSenderId: "877160112132",
  appId: "1:877160112132:web:569cef25a7c831d8845551",
  measurementId: "G-9QVYEQH05E"
};

interface FirebaseContextType {
  user: User | null;
  coins: IPOCoin[];
  orders: IPOOrder[];
  loading: boolean;
  login: () => Promise<void>;
  createCoin: (coinData: Partial<IPOCoin>) => Promise<void>;
  placeOrder: (order: Partial<IPOOrder>) => Promise<void>;
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [coins, setCoins] = useState<IPOCoin[]>([]);
  const [orders, setOrders] = useState<IPOOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  // Listen for coins
  useEffect(() => {
    const q = query(collection(db, 'coins'));
    return onSnapshot(q, (snapshot) => {
      const coinList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as IPOCoin));
      setCoins(coinList);
    });
  }, []);

  // Seed demo data if empty
  useEffect(() => {
    if (coins.length === 0 && !loading) {
      const demoCoins = [
        { name: 'AIX Coin', symbol: 'AIX', totalSupply: 100000000, initialPrice: 0.25, listingDate: new Date(Date.now() + 86400000 * 3).toISOString(), status: 'Live', isHot: true, description: 'Next-gen AI infrastructure for decentralized computing agents.', website: 'aix.io', targetFund: 2500000, soldCount: 1250000, investorCount: 450, creatorId: 'demo', isVerified: true, logo: 'https://api.dicebear.com/7.x/shapes/svg?seed=aix&backgroundColor=00AE64' },
        { name: 'MetaChain', symbol: 'META', totalSupply: 500000000, initialPrice: 0.05, listingDate: new Date(Date.now() + 86400000 * 7).toISOString(), status: 'Upcoming', isHot: false, description: 'Layer 2 scaling solution for the open metaverse and social dApps.', website: 'metachain.net', targetFund: 1000000, soldCount: 0, investorCount: 0, creatorId: 'demo', isVerified: true, logo: 'https://api.dicebear.com/7.x/shapes/svg?seed=meta&backgroundColor=627EEA' },
        { name: 'NovaX', symbol: 'NOVA', totalSupply: 25000000, initialPrice: 1.25, listingDate: new Date(Date.now() + 3600000 * 5).toISOString(), status: 'Live', isHot: true, description: 'Interoperable multi-chain hub for institutional finance.', website: 'nova-x.com', targetFund: 5000000, soldCount: 4850000, investorCount: 2200, creatorId: 'demo', isVerified: true, logo: 'https://api.dicebear.com/7.x/shapes/svg?seed=nova&backgroundColor=F3BA2F' },
        { name: 'GreenToken', symbol: 'GRN', totalSupply: 10000000, initialPrice: 0.1, listingDate: new Date(Date.now() + 86400000 * 12).toISOString(), status: 'Upcoming', isHot: false, description: 'Rewarding carbon-neutral actions through verified environmental credits.', website: 'green.earth', targetFund: 250000, soldCount: 0, investorCount: 0, creatorId: 'demo', isVerified: false, logo: 'https://api.dicebear.com/7.x/shapes/svg?seed=green&backgroundColor=34d399' },
        { name: 'DeFiCore', symbol: 'DFC', totalSupply: 75000000, initialPrice: 0.5, listingDate: new Date(Date.now() + 86400000 * 2).toISOString(), status: 'Live', isHot: false, description: 'Simplified algorithmic trading protocols for retail yield farmers.', website: 'deficore.finance', targetFund: 1500000, soldCount: 300000, investorCount: 120, creatorId: 'demo', isVerified: true, logo: 'https://api.dicebear.com/7.x/shapes/svg?seed=defi&backgroundColor=8b5cf6' }
      ];
      demoCoins.forEach(c => addDoc(collection(db, 'coins'), c));
    }
  }, [coins, loading]);

  // Listen for user orders
  useEffect(() => {
    if (!user) {
      setOrders([]);
      return;
    }
    const q = query(collection(db, 'orders'));
    return onSnapshot(q, (snapshot) => {
      const orderList = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as IPOOrder))
        .filter(order => order.userId === user.uid);
      setOrders(orderList);
    });
  }, [user]);

  const login = async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error('Login error', error);
      if (error.code === 'auth/unauthorized-domain') {
        const domain = window.location.hostname;
        alert(
          'DOMAIN TIDAK DIOTORISASI!\n\n' +
          'Firebase Anda menolak login dari domain ini. Silakan ikuti langkah ini:\n\n' +
          '1. Buka Firebase Console (ewallet-crypto)\n' +
          '2. Ke Authentication > Settings > Authorized domains\n' +
          '3. Tambahkan domain ini: ' + domain + '\n\n' +
          'Tanpa langkah ini, fitur Google Login tidak akan berfungsi.'
        );
      } else {
        alert('Gagal login: ' + error.message);
      }
    }
  };

  const createCoin = async (coinData: Partial<IPOCoin>) => {
    if (!user) throw new Error('Must be logged in');
    const docRef = await addDoc(collection(db, 'coins'), {
      ...coinData,
      creatorId: user.uid,
      soldCount: 0,
      investorCount: 0,
      isVerified: false,
      timestamp: serverTimestamp()
    });
    // Create companion user profile if doesnt exist
    await setDoc(doc(db, 'users', user.uid), {
      username: user.displayName || 'User',
      avatar: user.photoURL || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${user.uid}`,
      isVerified: false
    }, { merge: true });
  };

  const placeOrder = async (order: Partial<IPOOrder>) => {
    if (!user) throw new Error('Must be logged in');
    await addDoc(collection(db, 'orders'), {
      ...order,
      userId: user.uid,
      timestamp: new Date().toISOString()
    });
    
    // Update coin investor/sold count (Simulated real-time increment)
    if (order.coinId) {
       const coinRef = doc(db, 'coins', order.coinId);
       const coin = coins.find(c => c.id === order.coinId);
       if (coin) {
         await updateDoc(coinRef, {
           soldCount: (coin.soldCount || 0) + (order.amount || 0),
           investorCount: (coin.investorCount || 0) + 1
         });
       }
    }
  };

  return (
    <FirebaseContext.Provider value={{ user, coins, orders, loading, login, createCoin, placeOrder }}>
      {children}
    </FirebaseContext.Provider>
  );
}

export function useFirebase() {
  const context = useContext(FirebaseContext);
  if (!context) throw new Error('useFirebase must be used within FirebaseProvider');
  return context;
}
