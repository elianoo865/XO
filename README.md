# React Native XO (Tic-Tac-Toe) — Firebase Multiplayer (Expo + Firestore + Cloud Functions)

This repo is a **ready-to-deploy** full-stack multiplayer XO game:
- **Expo React Native app** (TypeScript)
- **Firebase Auth (anonymous)**
- **Firestore** rooms + queue
- **Cloud Functions (TypeScript)** for authoritative matchmaking + moves + rematch
- **Strict Firestore Security Rules** (clients cannot write board state)

> You can build an APK via **EAS Build** (recommended). This repo is set up for GitHub deployment.

---

## 1) Prereqs
- Node.js 18+
- Firebase CLI: `npm i -g firebase-tools`
- Expo CLI: `npm i -g expo`
- EAS CLI: `npm i -g eas-cli`

---

## 2) Create Firebase project
1. Create a Firebase project in console
2. Enable **Authentication → Sign-in method → Anonymous**
3. Create a **Firestore** database (Production mode)
4. Enable **Cloud Functions** (Blaze plan required for scheduled functions and most deployments)

---

## 3) Configure the app
Copy `.env.example` to `.env` and fill values from Firebase Web App config.

```bash
cp .env.example .env
```

---

## 4) Install dependencies
From repo root:
```bash
npm install
```

---

## 5) Deploy Firestore Rules
```bash
firebase login
firebase use --add
firebase deploy --only firestore:rules
```

---

## 6) Deploy Cloud Functions
```bash
cd functions
npm install
npm run build
cd ..
firebase deploy --only functions
```

---

## 7) Run the app
```bash
npm run start
```

---

## 8) Build APK (Android)
This project is configured for Expo EAS builds.

1) Login:
```bash
eas login
```

2) Configure (first time only):
```bash
eas build:configure
```

3) Build APK:
```bash
eas build -p android --profile apk
```

EAS will output a download link for the APK once complete.

---

## Notes
- **Client never writes** `rooms/{roomId}.board/turn/winner`. Only Cloud Functions update these fields.
- Presence: MVP uses a simple heartbeat on `users/{uid}.lastSeenAt`.
- Matchmaking uses a **scheduled function** that pairs users from `queue`.

---

## Repo Structure
```
/src               Expo app
/functions         Firebase Cloud Functions (TS)
/firestore.rules   Firestore security rules
/firebase.json     Firebase config
```

---

## Troubleshooting
- If callable functions error with permission, verify:
  - Anonymous auth enabled
  - Functions deployed to same project you selected
- If you cannot use scheduled functions, ensure Blaze plan is enabled.

