# CryptoBit Exchange

Full-stack cryptocurrency exchange platform built with React, Tailwind CSS, and Firebase. Featuring real-time price tracking via Binance WebSocket API and a built-in Launchpad for Crypto IPOs.

## 🚀 Features

- **Real-Time Data**: Live price updates for BTC, ETH, SOL, and more using direct Binance WebSocket integration (no API key required).
- **Crypto IPO Launchpad**: Create and launch new tokens. Users can submit project details, supply, and IPO pricing.
- **IPO Center**: Browse upcoming and live projects, with real-time fundraising progress and automated countdown timers.
- **Full-Stack Firebase**:
    - **Authentication**: Google Social Login.
    - **Firestore**: Persistent storage for coins, orders, and user profiles.
    - **Security**: Robust Firestore rules for data integrity.
- **Interactive Orderbook**: Live synthetic orderbook visualization.
- **Portfolio Tracking**: Monitor your holdings and IPO subscriptions in one place.

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS.
- **Backend/Database**: Firebase (Auth & Firestore).
- **Animations**: Framer Motion.
- **Icons**: Lucide React.
- **Charts**: Recharts.
- **Data Source**: Binance WebSocket API.

## 📦 Installation

1. Clone the repository:
   ```bash
   git clone <your-repo-url>
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Firebase:
   Edit `src/components/FirebaseProvider.tsx` and ensure the `firebaseConfig` matches your Firebase project credentials.

4. Run development server:
   ```bash
   npm run dev
   ```

## 🔐 Deployment

This app is optimized for deployment on **Cloud Run** or any static hosting service (for the frontend). Note that because it uses a custom Firebase config, you must authorize your production domain in the Firebase Console under **Authentication > Settings > Authorized Domains**.

## 📄 License

Apache-2.0
