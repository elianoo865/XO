import { doc, onSnapshot } from "firebase/firestore";
import { db } from "./init";
import type { RoomDoc } from "../types";

export function subscribeRoom(roomId: string, cb: (room: RoomDoc | null) => void) {
  const ref = doc(db, "rooms", roomId);
  return onSnapshot(ref, (snap) => {
    cb(snap.exists() ? (snap.data() as RoomDoc) : null);
  });
}
