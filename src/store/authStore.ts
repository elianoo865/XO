import { create } from "zustand";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db, auth } from "../firebase/init";

type AuthState = {
  uid: string | null;
  initializing: boolean;
  heartbeatTimer: any | null;
  setUid: (uid: string) => void;
  setInitializing: (v: boolean) => void;
  startHeartbeat: () => void;
  stopHeartbeat: () => void;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  uid: null,
  initializing: true,
  heartbeatTimer: null,
  setUid: (uid) => set({ uid }),
  setInitializing: (v) => set({ initializing: v }),

  startHeartbeat: () => {
    const existing = get().heartbeatTimer;
    if (existing) return;

    const tick = async () => {
      const u = auth.currentUser;
      if (!u) return;
      try {
        await updateDoc(doc(db, "users", u.uid), { lastSeenAt: serverTimestamp() });
      } catch {}
    };

    tick();
    const timer = setInterval(tick, 25000);
    set({ heartbeatTimer: timer });
  },

  stopHeartbeat: () => {
    const t = get().heartbeatTimer;
    if (t) clearInterval(t);
    set({ heartbeatTimer: null });
  }
}));
