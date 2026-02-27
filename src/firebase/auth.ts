import { signInAnonymously } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "./init";
import { useAuthStore } from "../store/authStore";

export async function bootstrapAuth() {
  const store = useAuthStore.getState();

  if (!auth.currentUser) {
    const cred = await signInAnonymously(auth);
    store.setUid(cred.user.uid);
  } else {
    store.setUid(auth.currentUser.uid);
  }

  const uid = auth.currentUser!.uid;
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      name: "Guest",
      createdAt: serverTimestamp(),
      lastSeenAt: serverTimestamp(),
      activeRoomId: null
    });
  } else {
    await updateDoc(ref, { lastSeenAt: serverTimestamp() });
  }

  // heartbeat every 25s (simple presence)
  store.startHeartbeat();
}
