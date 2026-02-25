# 🔥 Cloud Functions Deployment Guide

## Overview
Cloud Functions provide **server-side validation** for critical game operations, preventing:
- Gold manipulation in trades
- Leaderboard spoofing
- Impossible stat values
- Data tampering

---

## 📁 Files Created

```
Realm/
├── functions/
│   ├── index.js          # Cloud Functions code
│   └── package.json      # Dependencies
├── firestore.rules       # Security Rules
├── firebase.json         # Firebase config (create if missing)
└── index.html            # Updated client code
```

---

## 🚀 Deployment Steps

### 1. Install Firebase CLI

```bash
npm install -g firebase-tools
```

### 2. Login to Firebase

```bash
firebase login
```

### 3. Initialize Firebase Project

```bash
cd C:\Users\TrusxT\Desktop\Realm
firebase init
```

Select:
- **Functions**: Configure Cloud Functions
- **Firestore**: Configure Security Rules

Choose:
- **JavaScript** for Functions language
- **Use existing project**: `realm-tycoon`
- **Firestore rules file**: `firestore.rules` (already created)

### 4. Install Dependencies

```bash
cd functions
npm install
cd ..
```

### 5. Deploy Cloud Functions

```bash
firebase deploy --only functions
```

Expected output:
```
✔  functions[acceptTrade(eu-west1)]
✔  functions[createTrade(eu-west1)]
✔  functions[submitLeaderboardScore(eu-west1)]
✔  functions[reportSuspiciousActivity(eu-west1)]
✔  functions[detectSuspiciousPatterns(eu-west1)]
✔  functions[validatePlayerData(eu-west1)]
```

### 6. Deploy Firestore Rules

```bash
firebase deploy --only firestore:rules
```

### 7. Full Deployment (All)

```bash
firebase deploy
```

---

## 🔧 Available Cloud Functions

### Trade Functions

#### `createTrade(data)`
Create a trade with server-side validation.

```javascript
const createTrade = window.FB.functions.httpsCallable('createTrade');
const result = await createTrade({
    targetId: 'player123',
    offerGold: 1000,
    offerItem: {...},
    reqGold: 500
});
```

#### `acceptTrade(data)`
Accept a trade with **server-side gold verification**.

```javascript
const acceptTrade = window.FB.functions.httpsCallable('acceptTrade');
const result = await acceptTrade({
    tradeId: 'trd_123',
    targetId: 'player123'
});
```

### Leaderboard Functions

#### `submitLeaderboardScore(data)`
Submit score with validation against actual player stats.

```javascript
const submitScore = window.FB.functions.httpsCallable('submitLeaderboardScore');
await submitScore({
    category: 'gold',  // 'gold', 'crafts', or 'kills'
    value: 10000,
    playerName: 'PlayerName'
});
```

### Anti-Cheat Functions

#### `reportSuspiciousActivity(data)`
Report a player for cheating.

```javascript
const report = window.FB.functions.httpsCallable('reportSuspiciousActivity');
await report({
    reportedPlayerId: 'cheater123',
    reason: 'Impossible gold gain',
    evidence: { gold: 999999999 }
});
```

#### `validatePlayerData()`
Validate current player's data integrity.

```javascript
const validate = window.FB.functions.httpsCallable('validatePlayerData');
const result = await validate();
```

---

## 📋 Scheduled Functions

### `detectSuspiciousPatterns`
Runs **every hour** automatically. Detects:
- Impossible gold gain rates (>1M gold/hour)
- Impossible craft counts (>50K)
- Negative resources
- Inventory overflow

Creates auto-reports in `reports` collection.

---

## 🔒 Security Rules

The `firestore.rules` file enforces:
- Players can only modify their own data
- Market listings can only be cancelled by owner
- Trades can only be modified by participants
- Chat messages require authenticated user
- Inbox entries are playerId-validated

---

## 🐛 Troubleshooting

### Functions fail with "Permission denied"
**Solution:** Deploy Firestore rules first:
```bash
firebase deploy --only firestore:rules
```

### Functions fail with "HttpsError: Internal"
**Solution:** Check function logs:
```bash
firebase functions:log
```

### Client can't find functions
**Solution:** Ensure Firebase SDK includes functions:
```javascript
import { getFunctions } from "firebase/functions";
const functions = getFunctions(app);
```

### CORS errors
**Solution:** Functions are already configured for CORS. Check network tab.

---

## 📊 Monitoring

### View Function Logs
```bash
firebase functions:log
```

### View Specific Function
```bash
firebase functions:log --only acceptTrade
```

### View Reports Collection
Firebase Console → Firestore → `reports` collection

---

## ⚠️ Important Notes

1. **Fallback Mode**: Client code falls back to client-side validation if Cloud Functions are unavailable
2. **Rate Limits**: Cloud Functions have free tier limits (125K invocations/month)
3. **Cold Starts**: First invocation after idle period may take 1-2 seconds
4. **Region**: Functions deploy to `eu-west1` (closest to Turkey)

---

## 🎯 Next Steps

1. **Deploy** all functions
2. **Test** trade acceptance with manipulated gold
3. **Verify** leaderboard rejects impossible scores
4. **Monitor** reports collection for auto-detected cheats
5. **Adjust** thresholds in `detectSuspiciousPatterns` as needed

---

## 📞 Support

- Firebase Console: https://console.firebase.google.com/project/realm-tycoon
- Function Logs: `firebase functions:log`
- Firestore Rules Testing: Firebase Console → Firestore → Rules → Simulator
