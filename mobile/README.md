# STEPUP STORIES — Cross-Platform Mobile Shopping App (Android & iOS)

Native-feeling React Native (Expo) shopping app for **STEPUP STORIES** (`https://stepup-stories.vercel.app/`), crafted in the brand's signature dark obsidian charcoal (`#07090B`) and warm champagne gold (`#D4B475`) aesthetic.

---

## 1. Features Included

### Shopping Experience
- **Home Screen ([HomeScreen.tsx](./src/screens/HomeScreen.tsx))**:
  - Octagonal STEPUP STORIES crest header with live Wishlist and Shopping Bag counters.
  - Curated Collections strip (`Everyday Icons`, `Modern Minimal`, `Signature`, `Automatic Classics`, `Limited Editions`).
  - Featured Watches & Collection spotlights with 1-tap Wishlist and Add to Bag.
- **Browse, Search & Filter ([CatalogScreen.tsx](./src/screens/CatalogScreen.tsx))**:
  - Real-time search across watch names, visible dial/strap details, and collections.
  - Filter by Collection and Indian Rupee (`₹`) price brackets (`Under ₹1,500`, `₹1,500 – ₹2,500`, `₹2,500 – ₹3,500`, `Above ₹3,500`).
  - Sort by `Featured`, `Price: Low → High`, `Price: High → Low`, and `Biggest Savings`.
- **Product Detail Page ([ProductDetailScreen.tsx](./src/screens/ProductDetailScreen.tsx))**:
  - Multi-photo studio gallery with interactive thumbnail strip using only the actual supplied watch photos.
  - Sale price (`₹`), original MRP (`₹`), and automatically calculated savings (`Save ₹...` and `% OFF`).
  - Visible-only descriptions and specifications (no invented movements, materials, water resistance, warranty, or unverified brand/limited-edition claims).
- **Wishlist, Cart & Indian Checkout ([WishlistScreen.tsx](./src/screens/WishlistScreen.tsx), [CartScreen.tsx](./src/screens/CartScreen.tsx), [CheckoutScreen.tsx](./src/screens/CheckoutScreen.tsx))**:
  - Quantity steppers with stock limit validation and itemized INR bill breakdown.
  - Supports both **Guest Checkout** and **Signed-In Account Checkout**.
  - **Indian Delivery Address Validation**: Full Name, `+91` 10-digit Indian mobile number (`^[6-9]\d{9}$`), 6-digit Indian PIN code (`^[1-9][0-9]{5}$`), House/Flat, Street/Locality, Landmark, City/District, and all 28 Indian States & 8 Union Territories.
- **Orders & Live Status Tracking ([OrdersScreen.tsx](./src/screens/OrdersScreen.tsx))**:
  - Visual 5-step order status progress bar (`Placed` → `Confirmed` → `Packed` → `Shipped` → `Delivered`).
  - Guest Order Lookup by Order Number (e.g. `SUS-...`) or 10-digit mobile number.

### Backend, Payments & Protected Store Admin
- **Website Backend + Firebase Integration**:
  - Reuses the website's catalog via `https://stepup-stories.vercel.app/api/mobile/catalog` ([route.ts](../src/app/api/mobile/catalog/route.ts)) and [seedCatalog.ts](./src/data/seedCatalog.ts).
  - Full Firebase configuration for Authentication, Firestore, Storage, and Cloud Functions ([firebase.ts](./src/services/firebase.ts), [firestore.rules](./firestore.rules), [storage.rules](./storage.rules), [functions/src/index.ts](./functions/src/index.ts)).
- **Protected Store Admin Area ([AdminScreen.tsx](./src/screens/AdminScreen.tsx))**:
  - Protected by Role-Based Access Control (`role === "admin"`).
  - Add or edit products, enforce the **Brand Verification Policy** (uses branded names only when `brand_verified` is confirmed; otherwise uses accurate generic descriptive names), manage stock quantities, and update customer/guest order statuses.
- **Cash on Delivery (COD) & Server-Side Razorpay Payments**:
  - Supports instant **Cash on Delivery (COD)** and **Razorpay Online Payments**.
  - **Zero Secrets in App**: `RAZORPAY_KEY_SECRET` and `RAZORPAY_WEBHOOK_SECRET` stay strictly on the server (Next.js API `/api/mobile/payments/razorpay/*` or Firebase Cloud Functions).
  - Clearly marked **TEST MODE** banner and sandbox payment sheet until live Razorpay credentials are configured.

---

## 2. Quick Start (Run Locally)

```bash
cd mobile
cp .env.example .env
npm install
npx expo start
```

- Press **`a`** to open on an Android Emulator (or scan the QR code with the **Expo Go** app on your Android phone).
- Press **`i`** to open on an iOS Simulator (macOS) or scan with the Camera app on iPhone.
- Press **`w`** to preview in a mobile viewport in your browser.

---

## 3. Firebase Setup Instructions

1. **Create a Firebase Project**:
   - Go to [Firebase Console](https://console.firebase.google.com/) and create a project (e.g., `stepup-stories-store`).
2. **Enable Authentication**:
   - Navigate to **Build → Authentication → Sign-in method** and enable **Email/Password**.
3. **Create Firestore Database & Storage**:
   - Go to **Build → Firestore Database** → Create database in production mode (`asia-south1` Mumbai recommended for India).
   - Go to **Build → Storage** → Get started.
4. **Add Web/Mobile App Credentials to `mobile/.env`**:
   - In **Project Settings → General → Your apps**, register a Web app and copy the config values into `mobile/.env`:
     ```env
     EXPO_PUBLIC_API_BASE_URL=https://stepup-stories.vercel.app
     EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSy...
     EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
     EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
     EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
     EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1234567890
     EXPO_PUBLIC_FIREBASE_APP_ID=1:1234567890:web:abcdef
     ```
5. **Deploy Firestore Rules, Storage Rules & Cloud Functions**:
   ```bash
   cd mobile
   npm install -g firebase-tools
   firebase login
   firebase use --add
   cd functions && npm install && npm run build && cd ..
   firebase deploy --only firestore:rules,storage,functions
   ```
6. **Grant Store Admin Role (RBAC)**:
   - In Firestore, open the `users/{your_uid}` document for your account and set:
     ```json
     {
       "role": "admin"
     }
     ```
   - Or invoke the `setAdminRole` Cloud Function to set the custom claim `{ admin: true }`.
   - *(For local testing before Firebase keys are configured, sign in on the Account tab using `admin@stepupstories.in` and any 6+ character password to access the Protected Store Admin Portal.)*

---

## 4. Razorpay Payment Configuration (Server-Side Only)

> **Security Rule**: Never put `RAZORPAY_KEY_SECRET` or `RAZORPAY_WEBHOOK_SECRET` inside `mobile/.env` or mobile source code. Keep secrets exclusively in your server environment variables.

### Option A: Configure on Next.js Website Backend (Vercel)
Add these environment variables in your Vercel Project Settings (`stepup-stories`):
```env
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_server_only_key_secret
```
- While `RAZORPAY_KEY_ID` starts with `rzp_test_` (or before keys are set), the app automatically displays a **`TEST MODE`** badge during checkout.
- When ready for live payments, replace with your live `rzp_live_...` key and secret in Vercel.

### Option B: Configure on Firebase Cloud Functions
Store the secrets in Firebase Secret Manager:
```bash
cd mobile
firebase functions:secrets:set RAZORPAY_KEY_ID
firebase functions:secrets:set RAZORPAY_KEY_SECRET
firebase functions:secrets:set RAZORPAY_WEBHOOK_SECRET
firebase deploy --only functions
```

---

## 5. Building for Android & iOS

### Build with EAS (Recommended for Android APK/AAB & iOS IPA)
1. Install EAS CLI and sign in:
   ```bash
   npm install -g eas-cli
   eas login
   ```
2. **Build Installable Android APK (Preview / Direct Install)**:
   ```bash
   cd mobile
   eas build -p android --profile preview
   ```
3. **Build Google Play Store Android App Bundle (`.aab`)**:
   ```bash
   cd mobile
   eas build -p android --profile production
   ```
4. **Build iOS App (`.ipa` for TestFlight / App Store or Simulator)**:
   ```bash
   cd mobile
   eas build -p ios --profile preview      # iOS Simulator build
   eas build -p ios --profile production   # App Store / TestFlight build
   ```

### Local Native Builds (Android Studio / Xcode)
```bash
cd mobile
npx expo prebuild
npx expo run:android   # Requires Android Studio & Android SDK
npx expo run:ios       # Requires macOS & Xcode
```
