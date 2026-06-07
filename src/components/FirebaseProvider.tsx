/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, User, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, query, addDoc, serverTimestamp, setDoc, doc, updateDoc, runTransaction, getDoc, getDocs, where, deleteDoc } from 'firebase/firestore';
import { CryptoData, IPOCoin, IPOOrder, UserProfile, AppNotification, ChatMessage } from '../types';
import { useRealTimeCrypto } from '../hooks/useRealTimeCrypto';
import { WATCHLIST_COINS } from '../utils/constants';

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
  instantListCoin: (coinId: string) => Promise<void>;
  placeOrder: (order: Partial<IPOOrder>) => Promise<void>;
  updateBalance: (amount: number) => Promise<void>;
  transferBalance: (recipientEmail: string, amount: number) => Promise<void>;
  transferAsset: (recipientEmail: string, assetSymbol: string, amount: number) => Promise<void>;
  tradeCrypto: (action: 'buy' | 'sell', symbol: string, amount: number, price: number) => Promise<void>;
  clearAllUserCoins: () => Promise<void>;
  verifyUser: (userId: string, isVerified: boolean) => Promise<void>;
  deleteCoin: (coinId: string) => Promise<void>;
  deletePost: (postId: string) => Promise<void>;
  submitVerificationRequest: (fullData: any) => Promise<void>;
  realTimeCryptos: CryptoData[];
  notifications: AppNotification[];
  chats: ChatMessage[];
  addComment: (postId: string, postAuthorUid: string, postContent: string, content: string) => Promise<void>;
  sendChatMessage: (recipientUid: string, recipientName: string, recipientAvatar: string, content: string) => Promise<void>;
  markNotificationAsRead: (notificationId: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [dbCoins, setDbCoins] = useState<IPOCoin[]>([]);
  const [coins, setCoins] = useState<IPOCoin[]>([]);
  const [orders, setOrders] = useState<IPOOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [chats, setChats] = useState<ChatMessage[]>([]);
  const realTimeCryptos = useRealTimeCrypto(WATCHLIST_COINS, coins);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }
    const q = query(collection(db, 'notifications'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as AppNotification))
        .filter(n => n.recipientUid === user.uid)
        .sort((a, b) => b.createdAt - a.createdAt);
      setNotifications(list);
    }, (error) => {
      console.error("Notifications listener error", error);
    });
    return unsubscribe;
  }, [user]);

  useEffect(() => {
    if (!user) {
      setChats([]);
      return;
    }
    const q = query(collection(db, 'messages'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as ChatMessage))
        .filter(m => m.senderUid === user.uid || m.recipientUid === user.uid)
        .sort((a, b) => a.createdAt - b.createdAt); // newest at bottom for chat
      setChats(list);
    }, (error) => {
      console.error("Chats/messages listener error", error);
    });
    return unsubscribe;
  }, [user]);

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
        const data = docSnap.data();
        const assets = { ...(data.assets || {}) };
        const assetsInvested = { ...(data.assetsInvested || {}) };

        // Silently omit banned coins from client states
        ['BXC', 'QTX', 'ME'].forEach(symbol => {
          delete assets[symbol];
          delete assetsInvested[symbol];
        });

        setUserProfile({ id: docSnap.id, ...data, assets, assetsInvested } as UserProfile);
      } else {
        // Create initial profile
        setDoc(userRef, {
          username: user.displayName || 'User',
          avatar: user.photoURL || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${user.uid}`,
          email: user.email,
          balance: 0, // starting demo balance is 0 USD for new users
          assets: {},
          isVerified: false,
          hasClaimedVerificationReward: false,
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
      const coinList = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as IPOCoin))
        .filter(coin => coin.symbol && !['BXC', 'QTX', 'ME'].includes(coin.symbol.toUpperCase()));

      setDbCoins(coinList);
      setCoins(coinList);
    });
  }, []);

  // Automated epep coin, orderbook, and post cleanup to satisfy the user's delete request
  useEffect(() => {
    const cleanupUnwantedEpepAssets = async () => {
      try {
        console.log("Running auto-cleanup routine for epep-related assets...");
        
        // 1. Clean coins on firestore
        const coinsSnap = await getDocs(collection(db, 'coins'));
        for (const coinDoc of coinsSnap.docs) {
          const coinData = coinDoc.data();
          const nameLower = (coinData.name || "").toLowerCase();
          const symbolLower = (coinData.symbol || "").toLowerCase();
          
          if (nameLower.includes('epep') || symbolLower.includes('epep')) {
            console.log(`Cleaning up coin: ${coinData.name} (${coinDoc.id})`);
            await deleteDoc(coinDoc.ref);
            
            // Delete associated orders (orderbook of coin epep)
            const ordersSnap = await getDocs(query(collection(db, 'orders'), where('coinId', '==', coinDoc.id)));
            for (const orderDoc of ordersSnap.docs) {
              console.log(`Cleaning up orderbook order ${orderDoc.id}`);
              await deleteDoc(orderDoc.ref);
            }
          }
        }

        // 2. Clean posts on firestore
        const postsSnap = await getDocs(collection(db, 'posts'));
        for (const postDoc of postsSnap.docs) {
          const postData = postDoc.data();
          const contentLower = (postData.content || "").toLowerCase();
          const authorNameLower = (postData.author?.name || "").toLowerCase();
          
          if (contentLower.includes('epep') || authorNameLower.includes('epep')) {
            console.log(`Cleaning up post: ${postDoc.id}`);
            await deleteDoc(postDoc.ref);
          }
        }

        // 3. Clean user wallets and assets (remove epep coins from balances so there are no broken references)
        const usersSnap = await getDocs(collection(db, 'users'));
        for (const userDoc of usersSnap.docs) {
          const userData = userDoc.data();
          let changed = false;
          const assets = { ...(userData.assets || {}) };
          const assetsInvested = { ...(userData.assetsInvested || {}) };
          
          Object.keys(assets).forEach(key => {
            if (key.toLowerCase().includes('epep')) {
              delete assets[key];
              changed = true;
            }
          });
          Object.keys(assetsInvested).forEach(key => {
            if (key.toLowerCase().includes('epep')) {
              delete assetsInvested[key];
              changed = true;
            }
          });
          
          if (changed) {
            console.log(`Cleaning up asset balances for user document: ${userDoc.id}`);
            await updateDoc(userDoc.ref, { assets, assetsInvested });
          }
        }

        // 4. Clean trades (chart data) on firestore
        const tradesSnap = await getDocs(collection(db, 'trades'));
        for (const tradeDoc of tradesSnap.docs) {
          const tradeData = tradeDoc.data();
          const symbolLower = (tradeData.symbol || "").toLowerCase();
          if (symbolLower.includes('epep')) {
            console.log(`Cleaning up trade: ${tradeDoc.id}`);
            await deleteDoc(tradeDoc.ref);
          }
        }

        // 5. Clean live transactions on firestore
        const txsSnap = await getDocs(collection(db, 'liveTransactions'));
        for (const txDoc of txsSnap.docs) {
          const txData = txDoc.data();
          const coinLower = (txData.coin || "").toLowerCase();
          if (coinLower.includes('epep')) {
            console.log(`Cleaning up liveTransaction: ${txDoc.id}`);
            await deleteDoc(txDoc.ref);
          }
        }
      } catch (err) {
        console.error("Gagal menjalankan pembersihan epep", err);
      }
    };

    cleanupUnwantedEpepAssets();
  }, []);

  // Automated Listing or Failure check (Real-time AMM Pool setup and Automated full refunding for failures)
  useEffect(() => {
    if (dbCoins.length === 0) return;
    const interval = setInterval(() => {
      const now = new Date().getTime();
      dbCoins.forEach(async (coin) => {
         let targetStr = coin.listingDate || coin.ipoEndTime || coin.listingTime;
         let listingTime = targetStr ? new Date(targetStr).getTime() : NaN;
         if (isNaN(listingTime) && coin.countdownDuration && coin.ipoStartTime) {
            listingTime = new Date(coin.ipoStartTime).getTime() + coin.countdownDuration;
         }
         
         if (!isNaN(listingTime) && coin.status !== 'Listed' && coin.status !== 'Failed' && now >= listingTime) {
             const coinRef = doc(db, 'coins', coin.id);
             
             // 20% allocated for IPO, hardcap is total value of this allocation
             const hardcap = coin.hardcap || (coin.totalSupply * 0.2 * coin.initialPrice);
             const fundRaised = (coin.soldCount || 0) * coin.initialPrice;

             if (fundRaised >= hardcap) {
                 // Success IPO -> Transition to LISTED & build pool
                 const initialUsdPool = (coin.liquidity || 1000000) + fundRaised;
                 const initialTokenPool = initialUsdPool / coin.initialPrice;

                 await updateDoc(coinRef, {
                    status: 'Listed',
                    usdPool: initialUsdPool,
                    tokenPool: initialTokenPool,
                    liquidity: initialUsdPool,
                    currentPrice: coin.initialPrice,
                    sparkline: [{ value: coin.initialPrice }]
                 }).catch(console.error);
             } else {
                 // Failed IPO -> Mark status FAILED & execute automated full refund
                 await updateDoc(coinRef, { status: 'Failed' }).catch(console.error);

                 try {
                     const ordersSnap = await getDocs(query(collection(db, 'orders'), where('coinId', '==', coin.id)));
                     for (const orderDoc of ordersSnap.docs) {
                         const orderData = orderDoc.data();
                         if (orderData.status !== 'Refunded') {
                             const refundAmount = (orderData.amount || 0) * (orderData.price || 0);
                             await updateDoc(doc(db, 'orders', orderDoc.id), { status: 'Refunded' });

                             // Add balance back to user
                             const investorRef = doc(db, 'users', orderData.userId);
                             const investorSnap = await getDoc(investorRef);
                             if (investorSnap.exists()) {
                                 const currentBal = investorSnap.data().balance || 0;
                                 const currentAssets = investorSnap.data().assets || {};
                                 const currentAssetAmount = currentAssets[coin.symbol] || 0;
                                 const newAssetAmount = Math.max(0, currentAssetAmount - orderData.amount);

                                 await updateDoc(investorRef, {
                                     balance: currentBal + refundAmount,
                                     [`assets.${coin.symbol}`]: newAssetAmount
                                 });
                             }
                         }
                     }
                 } catch (err) {
                     console.error("Failed to perform automated refund for failed IPO coin:", err);
                 }
             }
         }
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [dbCoins]);

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
        .filter(order => order.userId === user.uid)
        .filter(order => order.coinSymbol && !['BXC', 'QTX', 'ME'].includes(order.coinSymbol.toUpperCase()));

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
    if (!userProfile) throw new Error('User profile not loaded');
    
    const reqLiquidity = Number(coinData.liquidity) || 1000000;
    // Deduct only up to available balance, removing financial blocker
    const deductAmount = Math.min(userProfile.balance, reqLiquidity);

    const nowISO = new Date().toISOString();
    let endISO = coinData.listingDate;
    if (!endISO || isNaN(new Date(endISO).getTime())) {
      // Default to 2 hours from now
      endISO = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
    } else {
      endISO = new Date(endISO).toISOString();
    }
    
    const startTimeStamp = new Date(nowISO).getTime();
    const endTimeStamp = new Date(endISO).getTime();
    const duration = Math.max(0, endTimeStamp - startTimeStamp);

    // Deduct what is available
    if (deductAmount > 0) {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        balance: userProfile.balance - deductAmount
      });
    }

    const isHotValue = (coinData.totalSupply || 10000000) > 50000000;
    const initialStatus = coinData.status || 'Upcoming';
    const isDirectListed = initialStatus === 'Listed';

    const usdPoolVal = reqLiquidity;
    const tokenPoolVal = reqLiquidity / (coinData.initialPrice || 0.1);

    const docRef = await addDoc(collection(db, 'coins'), {
      ...coinData,
      status: initialStatus,
      listingDate: endISO,
      listingTime: endISO,
      ipoStartTime: nowISO,
      ipoEndTime: endISO,
      countdownDuration: duration,
      creatorId: user.uid,
      soldCount: 0,
      investorCount: 0,
      isVerified: true,
      isHot: isHotValue,
      creatorWallet: userProfile.walletAddress || '0xUNKNOWN',
      usdPool: usdPoolVal, // initial pool USD
      tokenPool: tokenPoolVal, // initial token pool
      currentPrice: isDirectListed ? (coinData.initialPrice || 0.1) : null,
      sparkline: isDirectListed ? [{ value: coinData.initialPrice || 0.1 }] : [{ value: coinData.initialPrice || 0.1 }],
      timestamp: serverTimestamp()
    });

    if (deductAmount > 0) {
      await logLiveTransaction('DEPOSIT', coinData.symbol || 'UNK', deductAmount, 1, deductAmount, userProfile.walletAddress || '0xUNKNOWN');
    }
  };

  const instantListCoin = async (coinId: string) => {
    if (!user) throw new Error('Must be logged in');
    const coinRef = doc(db, 'coins', coinId);
    const coinSnap = await getDoc(coinRef);
    if (!coinSnap.exists()) throw new Error('Coin not found');
    const coinData = coinSnap.data();
    
    const fundRaised = (coinData.soldCount || 0) * (coinData.initialPrice || 0.1);
    const initialUsdPool = (coinData.liquidity || 1000000) + fundRaised;
    const initialTokenPool = initialUsdPool / (coinData.initialPrice || 0.1);

    await updateDoc(coinRef, {
      status: 'Listed',
      usdPool: initialUsdPool,
      tokenPool: initialTokenPool,
      liquidity: initialUsdPool,
      currentPrice: coinData.initialPrice || 0.1,
      sparkline: [{ value: coinData.initialPrice || 0.1 }]
    });

    await logLiveTransaction('DEPOSIT', coinData.symbol || 'UNK', initialUsdPool, 1, initialUsdPool, userProfile?.walletAddress || '0xUNKNOWN');
  };

  const logLiveTransaction = async (type: 'BUY' | 'SELL' | 'DEPOSIT' | 'WITHDRAW' | 'TRANSFER', coin: string, amount: number, price: number | undefined, usdValue: number, wallet: string) => {
    try {
      await addDoc(collection(db, 'liveTransactions'), {
        type, 
        coin, 
        amount, 
        price: price ?? null, 
        usdValue, 
        wallet, 
        timestamp: new Date().toISOString()
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

  const transferBalance = async (recipientIdentifier: string, amount: number) => {
    if (!user || !userProfile) throw new Error('Anda harus masuk terlebih dahulu');
    if (amount <= 0) throw new Error('Jumlah transfer harus lebih besar dari 0');
    if (userProfile.balance < amount) throw new Error('Saldo USD Anda tidak mencukupi untuk melakukan transfer');

    const cleanIdentifier = recipientIdentifier.trim();
    if (cleanIdentifier.toLowerCase() === userProfile.walletAddress?.toLowerCase() || cleanIdentifier.toLowerCase() === userProfile.email?.toLowerCase()) {
      throw new Error('Anda tidak dapat melakukan transfer ke akun Anda sendiri');
    }

    // Lookup recipient in users collection
    let recipientRef = query(collection(db, 'users'), where('walletAddress', '==', cleanIdentifier));
    let recipientSnap = await getDocs(recipientRef);
    
    if (recipientSnap.empty) {
      recipientRef = query(collection(db, 'users'), where('email', '==', cleanIdentifier));
      recipientSnap = await getDocs(recipientRef);
    }

    if (recipientSnap.empty) {
      throw new Error('Penerima tidak ditemukan! Pastikan alamat dompet (e-wallet) atau email sudah benar.');
    }

    const recipientDoc = recipientSnap.docs[0];
    const recipientId = recipientDoc.id;

    const senderRef = doc(db, 'users', user.uid);
    const targetRef = doc(db, 'users', recipientId);

    await runTransaction(db, async (transaction) => {
      const senderSnap = await transaction.get(senderRef);
      const targetSnap = await transaction.get(targetRef);

      if (!senderSnap.exists()) throw new Error('Data pengirim tidak terdaftar di database.');
      if (!targetSnap.exists()) throw new Error('Penerima tidak valid.');

      const currentSenderBal = senderSnap.data().balance || 0;
      if (currentSenderBal < amount) throw new Error('Saldo USD Anda tidak cukup untuk transfer.');

      const currentTargetBal = targetSnap.data().balance || 0;

      transaction.update(senderRef, { balance: currentSenderBal - amount });
      transaction.update(targetRef, { balance: currentTargetBal + amount });
    });

    await logLiveTransaction('TRANSFER', 'USD', amount, 1, amount, userProfile.walletAddress || '0xUNKNOWN');
  };

  const transferAsset = async (recipientIdentifier: string, assetSymbol: string, amount: number) => {
    if (!user || !userProfile) throw new Error('Anda harus masuk terlebih dahulu');
    if (amount <= 0) throw new Error('Jumlah transfer harus lebih besar dari 0');
    
    const currentAmount = userProfile.assets?.[assetSymbol] || 0;
    if (currentAmount < amount) throw new Error(`Aset ${assetSymbol} Anda tidak mencukupi`);

    const cleanIdentifier = recipientIdentifier.trim();
    if (cleanIdentifier.toLowerCase() === userProfile.walletAddress?.toLowerCase() || cleanIdentifier.toLowerCase() === userProfile.email?.toLowerCase()) {
      throw new Error('Anda tidak dapat melakukan transfer ke akun Anda sendiri');
    }

    // Lookup recipient in users collection
    let recipientRef = query(collection(db, 'users'), where('walletAddress', '==', cleanIdentifier));
    let recipientSnap = await getDocs(recipientRef);
    
    if (recipientSnap.empty) {
      recipientRef = query(collection(db, 'users'), where('email', '==', cleanIdentifier));
      recipientSnap = await getDocs(recipientRef);
    }

    if (recipientSnap.empty) {
      throw new Error('Penerima tidak ditemukan! Pastikan alamat dompet (e-wallet) atau email sudah benar.');
    }

    const recipientDoc = recipientSnap.docs[0];
    const recipientId = recipientDoc.id;

    const senderRef = doc(db, 'users', user.uid);
    const targetRef = doc(db, 'users', recipientId);

    await runTransaction(db, async (transaction) => {
      const senderSnap = await transaction.get(senderRef);
      const targetSnap = await transaction.get(targetRef);

      if (!senderSnap.exists()) throw new Error('Data pengirim tidak terdaftar di database.');
      if (!targetSnap.exists()) throw new Error('Penerima tidak valid.');

      const senderAssets = senderSnap.data().assets || {};
      const currentSenderAssetAmount = senderAssets[assetSymbol] || 0;
      if (currentSenderAssetAmount < amount) throw new Error(`Aset ${assetSymbol} Anda tidak mencukupi untuk transfer.`);

      const targetAssets = targetSnap.data().assets || {};
      const currentTargetAssetAmount = targetAssets[assetSymbol] || 0;

      transaction.update(senderRef, {
        [`assets.${assetSymbol}`]: currentSenderAssetAmount - amount
      });
      transaction.update(targetRef, {
        [`assets.${assetSymbol}`]: currentTargetAssetAmount + amount
      });
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

    // Update coin investor/sold count (REAL transactions) and check hardcap
    if (order.coinId) {
       const coinRef = doc(db, 'coins', order.coinId);
       const coin = coins.find(c => c.id === order.coinId);
       if (coin) {
         const newSoldCount = (coin.soldCount || 0) + (order.amount || 0);
         const hardcap = coin.totalSupply * 0.2; // 20% allocated for IPO
         let newStatus = coin.status;
         if (newSoldCount >= hardcap) {
           newStatus = 'Listed';
         }
         await updateDoc(coinRef, {
           soldCount: newSoldCount,
           investorCount: (coin.investorCount || 0) + 1,
           status: newStatus
         });
       }
    }
  };

  const tradeCrypto = async (action: 'buy' | 'sell', symbol: string, amount: number, price: number) => {
    if (!user || !userProfile) throw new Error('Must be logged in');

    let finalPrice = price;
    const customCoin = coins.find(c => c.symbol === symbol);

    let newLiquidity = 0;
    let newBuyVolume = 0;
    let newSellVolume = 0;
    let newInvestorCount = customCoin ? (customCoin.investorCount || 0) : 0;
    let usdPoolNew = 0;
    let tokenPoolNew = 0;

    if (customCoin && customCoin.status === 'Listed') {
       // Fetch latest coin state directly from Firestore for precise pool math
       const coinRef = doc(db, 'coins', customCoin.id);
       const coinSnap = await getDoc(coinRef);
       if (!coinSnap.exists()) throw new Error("Proyek koin tidak ditemukan");
       const coinData = coinSnap.data() as IPOCoin;

       const initialPriceValue = Number(coinData.initialPrice) || 0.1;
       let usdPool = Number(coinData.usdPool);
       let tokenPool = Number(coinData.tokenPool);
       
       if (!usdPool || !tokenPool) {
          // Fallback if pools aren't initialized yet
          usdPool = Number(coinData.liquidity) || 1000000;
          tokenPool = usdPool / initialPriceValue;
       }

       const k = usdPool * tokenPool;

       if (action === 'buy') {
          tokenPoolNew = tokenPool - amount;
          
          // Slippage & Depth protections
          if (tokenPoolNew <= tokenPool * 0.05) {
             throw new Error("GELOMBANG VOLATILITAS: Pembelian Anda terlalu besar! Likuiditas tidak mencukupi untuk memproses ukuran transaksi ini.");
          }

          usdPoolNew = k / tokenPoolNew;
          const totalCostUSD = usdPoolNew - usdPool;
          
          finalPrice = totalCostUSD / amount; // Average executed price under slippage
          newLiquidity = usdPoolNew;
          newBuyVolume = (Number(coinData.buyVolume) || 0) + totalCostUSD;
          newSellVolume = Number(coinData.sellVolume) || 0;

          const currentAssetAmount = userProfile.assets?.[symbol] || 0;
          if (currentAssetAmount === 0) {
            newInvestorCount = newInvestorCount + 1;
          }
       } else {
          // Crash protection: prevent the coin creator from dumping > 5% of total supply at once
          if (user.uid === coinData.creatorId && amount > (coinData.totalSupply * 0.05)) {
             throw new Error("CRASH PROTECTION ACTIVATED: Koki koin tidak diizinkan untuk menjual lebih dari 5% total supply dalam satu transaksi untuk melindungi investor ritel.");
          }

          tokenPoolNew = tokenPool + amount;
          usdPoolNew = k / tokenPoolNew;
          const totalReceivedUSD = usdPool - usdPoolNew;

          finalPrice = totalReceivedUSD / amount; // Average executed price under slippage
          newLiquidity = usdPoolNew;
          newSellVolume = (Number(coinData.sellVolume) || 0) + totalReceivedUSD;
          newBuyVolume = Number(coinData.buyVolume) || 0;

          const currentAssetAmount = userProfile.assets?.[symbol] || 0;
          if (amount >= currentAssetAmount) {
             newInvestorCount = Math.max(0, newInvestorCount - 1);
          }
       }
    }
    
    // Calculate total trade size in USD
    const totalCost = amount * finalPrice;
    const userRef = doc(db, 'users', user.uid);
    const currentAssetAmount = userProfile.assets?.[symbol] || 0;
    const currentInvested = userProfile.assetsInvested?.[symbol] || 0;

    if (action === 'buy') {
      if (userProfile.balance < totalCost) {
        throw new Error(`Saldo tidak mencukupi! Transaksi membutuhkan $${totalCost.toLocaleString(undefined, { maximumFractionDigits: 2 })} USD.`);
      }
      await updateDoc(userRef, {
        balance: userProfile.balance - totalCost,
        [`assets.${symbol}`]: currentAssetAmount + amount,
        [`assetsInvested.${symbol}`]: currentInvested + totalCost
      });
    } else {
      if (currentAssetAmount < amount) {
        throw new Error(`Aset Anda tidak mencukupi! Anda memiliki ${currentAssetAmount} ${symbol}.`);
      }
      
      const proportionSold = amount / currentAssetAmount;
      const soldInvestedAmount = currentInvested * proportionSold;
      
      await updateDoc(userRef, {
        balance: userProfile.balance + totalCost,
        [`assets.${symbol}`]: currentAssetAmount - amount,
        [`assetsInvested.${symbol}`]: currentInvested - soldInvestedAmount
      });
    }

    const sanitizedPrice = isNaN(finalPrice) || finalPrice <= 0 ? 0.001 : finalPrice;
    const sanitizedTotal = isNaN(totalCost) || totalCost < 0 ? 0 : totalCost;

    // Log the actual completed trade
    await addDoc(collection(db, 'trades'), {
      userId: user.uid,
      symbol,
      type: action.toUpperCase(),
      amount: Number(amount) || 0,
      price: sanitizedPrice,
      total: sanitizedTotal,
      timestamp: new Date().toISOString()
    });

    await logLiveTransaction(action.toUpperCase() as any, symbol, amount, sanitizedPrice, sanitizedTotal, userProfile.walletAddress || '0xUNKNOWN');

    if (customCoin && customCoin.status === 'Listed') {
       const coinRef = doc(db, 'coins', customCoin.id);
       const sparkline = customCoin.sparkline || [{ value: Number(customCoin.initialPrice) || 0.1 }];
       const nextMarginalPrice = usdPoolNew / tokenPoolNew;
       const newSparkline = [...sparkline, { value: nextMarginalPrice }];
       if (newSparkline.length > 30) newSparkline.shift();

       const sanitizedLiquidity = isNaN(newLiquidity) || newLiquidity < 0 ? 10 : newLiquidity;
       const sanitizedBuyVolume = isNaN(newBuyVolume) ? 0 : newBuyVolume;
       const sanitizedSellVolume = isNaN(newSellVolume) ? 0 : newSellVolume;
       const sanitizedInvestorCount = isNaN(newInvestorCount) ? 1 : newInvestorCount;
       const sanitizedMarketCap = (Number(customCoin.totalSupply) * nextMarginalPrice);
       const sanitizedVolume24h = isNaN(Number(customCoin.volume24h) || 0) ? sanitizedTotal : (Number(customCoin.volume24h) || 0) + sanitizedTotal;

       await updateDoc(coinRef, {
         currentPrice: nextMarginalPrice,
         usdPool: usdPoolNew,
         tokenPool: tokenPoolNew,
         sparkline: newSparkline,
         volume24h: sanitizedVolume24h,
         liquidity: sanitizedLiquidity,
         buyVolume: sanitizedBuyVolume,
         sellVolume: sanitizedSellVolume,
         investorCount: sanitizedInvestorCount,
         marketCap: sanitizedMarketCap
       });
    }
  };

  const clearAllUserCoins = async () => {
    try {
      const { deleteDoc, doc } = await import('firebase/firestore');
      const userCoins = dbCoins.filter(c => 
        c.creatorId && 
        c.creatorId !== 'company' && 
        c.creatorId !== 'demo'
      );
      for (const coin of userCoins) {
        if (coin.id) {
          await deleteDoc(doc(db, 'coins', coin.id));
        }
      }
    } catch (e) {
      console.error("Failed manual clear of user coins", e);
      throw e;
    }
  };

  const verifyUser = async (userId: string, isVerified: boolean) => {
    if (!user) {
      throw new Error('Unauthorized: Anda harus masuk terlebih dahulu untuk melakukan verifikasi.');
    }
    if (!userId) {
      throw new Error('Bad Request: User ID tidak boleh kosong.');
    }
    if (user.uid !== userId) {
      throw new Error('Unauthorized: Anda tidak diizinkan mengubah status verifikasi profil pengguna lain.');
    }

    try {
      const userRef = doc(db, 'users', userId);
      await runTransaction(db, async (transaction) => {
        const docSnap = await transaction.get(userRef);
        if (!docSnap.exists()) {
          throw new Error('Data pengguna tidak terdaftar di database.');
        }

        const data = docSnap.data();
        const currentVerified = data.isVerified || false;
        const currentBalance = data.balance || 0;
        const hasClaimed = data.hasClaimedVerificationReward || false;

        let updateData: any = { isVerified };

        if (isVerified && !currentVerified && !hasClaimed) {
          updateData.balance = currentBalance + 100;
          updateData.hasClaimedVerificationReward = true;
        }

        transaction.update(userRef, updateData);
      });
    } catch (err: any) {
      console.error("Gagal memperbarui status verifikasi", err);
      throw new Error(`Execution Error: Gagal memperbarui status verifikasi: ${err.message}`);
    }
  };

  const addComment = async (postId: string, postAuthorUid: string, postContent: string, content: string) => {
    if (!user || !userProfile) throw new Error("Unauthorized: Silakan login terlebih dahulu");
    if (!content.trim()) throw new Error("Komentar tidak boleh kosong.");

    try {
      const commentData = {
        postId,
        author: {
          uid: user.uid,
          name: userProfile.username || 'User',
          avatar: userProfile.avatar || "https://api.dicebear.com/7.x/pixel-art/svg?seed=default",
          isVerified: userProfile.isVerified || false
        },
        content: content.trim(),
        createdAt: Date.now()
      };
      await addDoc(collection(db, 'comments'), commentData);

      const postRef = doc(db, 'posts', postId);
      const postDoc = await getDoc(postRef);
      if (postDoc.exists()) {
        const currentComments = postDoc.data().comments || 0;
        await updateDoc(postRef, {
          comments: currentComments + 1
        });
      }

      if (postAuthorUid && postAuthorUid !== user.uid) {
        const notifData = {
          recipientUid: postAuthorUid,
          sender: {
            uid: user.uid,
            name: userProfile.username || 'User',
            avatar: userProfile.avatar || "https://api.dicebear.com/7.x/pixel-art/svg?seed=default"
          },
          type: 'comment',
          message: `mengomentari postingan Anda: "${content.trim()}"`,
          postId,
          isRead: false,
          createdAt: Date.now()
        };
        await addDoc(collection(db, 'notifications'), notifData);

        const chatData = {
          senderUid: user.uid,
          senderName: userProfile.username || 'User',
          senderAvatar: userProfile.avatar || "https://api.dicebear.com/7.x/pixel-art/svg?seed=default",
          recipientUid: postAuthorUid,
          recipientName: postDoc.exists() ? (postDoc.data().author?.name || 'User') : 'User',
          recipientAvatar: postDoc.exists() ? (postDoc.data().author?.avatar || "https://api.dicebear.com/7.x/pixel-art/svg?seed=default") : "https://api.dicebear.com/7.x/pixel-art/svg?seed=default",
          content: `[Komentar Post] Halo! Saya baru saja memberikan komentar di postingan Anda: "${content.trim()}"`,
          createdAt: Date.now(),
          isRead: false
        };
        await addDoc(collection(db, 'messages'), chatData);
      }
    } catch (err: any) {
      console.error("Gagal menambahkan komentar", err);
      throw err;
    }
  };

  const sendChatMessage = async (recipientUid: string, recipientName: string, recipientAvatar: string, content: string) => {
    if (!user || !userProfile) throw new Error("Unauthorized: Silakan login terlebih dahulu");
    if (!content.trim()) throw new Error("Pesan tidak boleh kosong.");

    try {
      const msgData = {
        senderUid: user.uid,
        senderName: userProfile.username || 'User',
        senderAvatar: userProfile.avatar || "https://api.dicebear.com/7.x/pixel-art/svg?seed=default",
        recipientUid,
        recipientName,
        recipientAvatar,
        content: content.trim(),
        createdAt: Date.now(),
        isRead: false
      };
      await addDoc(collection(db, 'messages'), msgData);

      const notifData = {
        recipientUid,
        sender: {
          uid: user.uid,
          name: userProfile.username || 'User',
          avatar: userProfile.avatar || "https://api.dicebear.com/7.x/pixel-art/svg?seed=default"
        },
        type: 'message',
        message: `mengirim pesan baru: "${content.trim().slice(0, 30)}${content.trim().length > 30 ? '...' : ''}"`,
        isRead: false,
        createdAt: Date.now()
      };
      await addDoc(collection(db, 'notifications'), notifData);
    } catch (err: any) {
      console.error("Gagal mengirim pesan chat", err);
      throw err;
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      const notifRef = doc(db, 'notifications', notificationId);
      await updateDoc(notifRef, { isRead: true });
    } catch (err) {
      console.error("Gagal menandai notifikasi telah dibaca", err);
    }
  };

  const markAllNotificationsAsRead = async () => {
    if (!user) return;
    try {
      const q = query(collection(db, 'notifications'), where('recipientUid', '==', user.uid), where('isRead', '==', false));
      const snap = await getDocs(q);
      const batchPromises = snap.docs.map(docSnap => updateDoc(docSnap.ref, { isRead: true }));
      await Promise.all(batchPromises);
    } catch (err) {
      console.error("Gagal menandai semua notifikasi", err);
    }
  };

  const deleteCoin = async (coinId: string) => {
    if (!user) throw new Error('Unauthorized');
    const coinRef = doc(db, 'coins', coinId);
    const coinSnap = await getDoc(coinRef);
    if (!coinSnap.exists() || coinSnap.data().creatorId !== user.uid) throw new Error('Unauthorized or coin not found');
    await deleteDoc(coinRef);
  };

  const deletePost = async (postId: string) => {
    if (!user) throw new Error('Unauthorized');
    const postRef = doc(db, 'posts', postId);
    const postSnap = await getDoc(postRef);
    if (!postSnap.exists() || postSnap.data().author?.uid !== user.uid) throw new Error('Unauthorized or post not found');
    await deleteDoc(postRef);
  };

  const submitVerificationRequest = async (fullData: any) => {
    if (!user) throw new Error('Unauthorized');
    await addDoc(collection(db, 'verification_requests'), {
      ...fullData,
      userId: user.uid,
      status: 'pending',
      createdAt: Date.now()
    });
    await updateDoc(doc(db, 'users', user.uid), {
      verificationStatus: 'pending'
    });
  };

  return (
    <FirebaseContext.Provider value={{
      user, userProfile, coins, orders, loading, db, login, logout,
      createCoin, instantListCoin, placeOrder, updateBalance, transferBalance, transferAsset, tradeCrypto, clearAllUserCoins, verifyUser,
      deleteCoin, deletePost, submitVerificationRequest,
      realTimeCryptos,
      notifications, chats, addComment, sendChatMessage, markNotificationAsRead, markAllNotificationsAsRead
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
