/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, User, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, query, addDoc, serverTimestamp, setDoc, doc, updateDoc, runTransaction, getDoc } from 'firebase/firestore';
import { IPOCoin, IPOOrder, UserProfile } from '../types';

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

const generateWalletAddress = () => {
  return '0x' + Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
};

interface LiveTransaction {
  id: string;
  type: 'BUY' | 'SELL' | 'DEPOSIT' | 'WITHDRAW' | 'TRANSFER';
  coin: string;
  amount: number;
  wallet: string;
  timestamp: string;
  price?: number;
  usdValue: number;
}

interface FirebaseContextType {
  user: User | null;
  userProfile: UserProfile | null;
  coins: IPOCoin[];
  orders: IPOOrder[];
  loading: boolean;
  db: any;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  createCoin: (coinData: Partial<IPOCoin>) => Promise<void>;
  placeOrder: (order: Partial<IPOOrder>) => Promise<void>;
  updateBalance: (amount: number) => Promise<void>;
  transferBalance: (recipientEmail: string, amount: number) => Promise<void>;
  transferAsset: (recipientEmail: string, assetSymbol: string, amount: number) => Promise<void>;
  tradeCrypto: (action: 'buy' | 'sell', symbol: string, amount: number, price: number) => Promise<void>;
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [coins, setCoins] = useState<IPOCoin[]>([]);
  const [orders, setOrders] = useState<IPOOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  // Listen for user profile
  useEffect(() => {
    if (!user) {
      setUserProfile(null);
      return;
    }
    
    const userRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        setUserProfile({ id: docSnap.id, ...docSnap.data() } as UserProfile);
      } else {
        // Create initial profile
        setDoc(userRef, {
          username: user.displayName || 'User',
          avatar: user.photoURL || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${user.uid}`,
          email: user.email,
          balance: 100000, // starting demo balance
          assets: {},
          isVerified: false,
          walletAddress: generateWalletAddress()
        });
      }
    });

    return unsubscribe;
  }, [user]);

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
        { name: 'Artificial Core', symbol: 'AIX', totalSupply: 100000000, initialPrice: 0.25, listingDate: new Date(Date.now() + 86400000 * 3).toISOString(), status: 'Live', isHot: true, description: 'Next-gen AI infrastructure for decentralized computing agents.', website: 'aix.io', targetFund: 2500000, soldCount: 1250000, investorCount: 450, creatorId: 'demo', isVerified: true, logo: 'https://unavatar.io/aix.io' },
        { name: 'Metaverse Nexus', symbol: 'META', totalSupply: 500000000, initialPrice: 0.05, listingDate: new Date(Date.now() + 86400000 * 7).toISOString(), status: 'Upcoming', isHot: false, description: 'Layer 2 scaling solution for the open metaverse and social dApps.', website: 'metachain.net', targetFund: 1000000, soldCount: 0, investorCount: 0, creatorId: 'demo', isVerified: true, logo: 'https://unavatar.io/metachain.net' },
        { name: 'Nova Protocol', symbol: 'NOVA', totalSupply: 25000000, initialPrice: 1.25, listingDate: new Date(Date.now() + 3600000 * 5).toISOString(), status: 'Live', isHot: true, description: 'Interoperable multi-chain hub for institutional finance.', website: 'nova-x.com', targetFund: 5000000, soldCount: 4850000, investorCount: 2200, creatorId: 'demo', isVerified: true, logo: 'https://unavatar.io/nova-x.com' },
        { name: 'EcoChain', symbol: 'GRN', totalSupply: 10000000, initialPrice: 0.1, listingDate: new Date(Date.now() + 86400000 * 12).toISOString(), status: 'Upcoming', isHot: false, description: 'Rewarding carbon-neutral actions through verified environmental credits.', website: 'green.earth', targetFund: 250000, soldCount: 0, investorCount: 0, creatorId: 'demo', isVerified: false, logo: 'https://unavatar.io/green.earth' },
        { name: 'DeFi Matrix', symbol: 'DFC', totalSupply: 75000000, initialPrice: 0.5, listingDate: new Date(Date.now() + 86400000 * 2).toISOString(), status: 'Live', isHot: false, description: 'Simplified algorithmic trading protocols for retail yield farmers.', website: 'deficore.finance', targetFund: 1500000, soldCount: 300000, investorCount: 120, creatorId: 'demo', isVerified: true, logo: 'https://unavatar.io/deficore.finance' }
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

  const logout = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error('Logout error', error);
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
      isVerified: false,
      walletAddress: generateWalletAddress()
    }, { merge: true });
  };

  const logLiveTransaction = async (type: 'BUY' | 'SELL' | 'DEPOSIT' | 'WITHDRAW' | 'TRANSFER', coin: string, amount: number, price: number | undefined, usdValue: number, wallet: string) => {
    try {
      await addDoc(collection(db, 'liveTransactions'), {
        type, coin, amount, price, usdValue, wallet, timestamp: new Date().toISOString()
      });
    } catch (e) {
      console.error('Failed to log live tx', e);
    }
  };

  const updateBalance = async (amount: number) => {
    if (!user || !userProfile) throw new Error('Must be logged in');
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, {
      balance: userProfile.balance + amount
    });
    const type = amount > 0 ? 'DEPOSIT' : 'WITHDRAW';
    await logLiveTransaction(type, 'USD', Math.abs(amount), 1, Math.abs(amount), userProfile.walletAddress || '0xUNKNOWN');
  };

  const transferBalance = async (recipientEmail: string, amount: number) => {
    if (!user || !userProfile) throw new Error('Must be logged in');
    if (userProfile.balance < amount) throw new Error('Insufficient balance');
    // For demo purposes, we will just deduct from sender, and skip recipient verification or complex queries.
    // In a real app we would use a Cloud Function or a secure transaction.
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, {
      balance: userProfile.balance - amount
    });
    await logLiveTransaction('TRANSFER', 'USD', amount, 1, amount, userProfile.walletAddress || '0xUNKNOWN');
  };

  const transferAsset = async (recipientEmail: string, assetSymbol: string, amount: number) => {
    if (!user || !userProfile) throw new Error('Must be logged in');
    const currentAmount = userProfile.assets?.[assetSymbol] || 0;
    if (currentAmount < amount) throw new Error('Insufficient asset balance');
    
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, {
      [`assets.${assetSymbol}`]: currentAmount - amount
    });
    await logLiveTransaction('TRANSFER', assetSymbol, amount, undefined, 0, userProfile.walletAddress || '0xUNKNOWN');
  };

  const placeOrder = async (order: Partial<IPOOrder>) => {
    if (!userProfile) throw new Error('Must be logged in');
    
    // Check balance and calculate cost
    const cost = (order.amount || 0) * (order.price || 0);
    if (userProfile.balance < cost) throw new Error('Insufficient balance to place order');

    // Deduct balance securely
    const userRef = doc(db, 'users', user.uid);
    const existingAsset = userProfile.assets?.[order.coinSymbol as string] || 0;
    const existingInvested = userProfile.assetsInvested?.[order.coinSymbol as string] || 0;
    
    await updateDoc(userRef, {
      balance: userProfile.balance - cost,
      [`assets.${order.coinSymbol}`]: existingAsset + (order.amount || 0),
      [`assetsInvested.${order.coinSymbol}`]: existingInvested + cost
    });

    await addDoc(collection(db, 'orders'), {
      ...order,
      userId: user.uid,
      timestamp: new Date().toISOString()
    });
    
    await logLiveTransaction('BUY', order.coinSymbol || 'UNK', order.amount || 0, order.price || 0, cost, userProfile.walletAddress || '0xUNKNOWN');

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

  const tradeCrypto = async (action: 'buy' | 'sell', symbol: string, amount: number, price: number) => {
    if (!user || !userProfile) throw new Error('Must be logged in');
    
    const totalCost = amount * price;
    const userRef = doc(db, 'users', user.uid);
    const currentAssetAmount = userProfile.assets?.[symbol] || 0;
    const currentInvested = userProfile.assetsInvested?.[symbol] || 0;

    if (action === 'buy') {
      if (userProfile.balance < totalCost) {
        throw new Error(`Insufficient balance. Requires $${totalCost.toLocaleString(undefined, { maximumFractionDigits: 2 })}`);
      }
      await updateDoc(userRef, {
        balance: userProfile.balance - totalCost,
        [`assets.${symbol}`]: currentAssetAmount + amount,
        [`assetsInvested.${symbol}`]: currentInvested + totalCost
      });
    } else {
      if (currentAssetAmount < amount) {
        throw new Error(`Insufficient ${symbol} assets. You have ${currentAssetAmount}.`);
      }
      
      // Compute the portion of the invested amount that is being sold
      const proportionSold = amount / currentAssetAmount;
      const soldInvestedAmount = currentInvested * proportionSold;
      
      await updateDoc(userRef, {
        balance: userProfile.balance + totalCost,
        [`assets.${symbol}`]: currentAssetAmount - amount,
        [`assetsInvested.${symbol}`]: currentInvested - soldInvestedAmount
      });
    }

    // Record trade history
    await addDoc(collection(db, 'trades'), {
      userId: user.uid,
      symbol,
      type: action,
      amount,
      price,
      total: totalCost,
      timestamp: new Date().toISOString()
    });

    await logLiveTransaction(action.toUpperCase() as any, symbol, amount, price, totalCost, userProfile.walletAddress || '0xUNKNOWN');
  };

  return (
    <FirebaseContext.Provider value={{
      user, userProfile, coins, orders, loading, db, login, logout,
      createCoin, placeOrder, updateBalance, transferBalance, transferAsset, tradeCrypto
    }}>
      {children}
    </FirebaseContext.Provider>
  );
}

export function useFirebase() {
  const context = useContext(FirebaseContext);
  if (!context) throw new Error('useFirebase must be used within FirebaseProvider');
  return context;
}
