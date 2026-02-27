import { create } from "zustand";
import type { RoomDoc } from "../types";

type GameState = {
  roomId: string | null;
  room: RoomDoc | null;
  setRoomId: (roomId: string | null) => void;
  setRoom: (room: RoomDoc | null) => void;
};

export const useGameStore = create<GameState>((set) => ({
  roomId: null,
  room: null,
  setRoomId: (roomId) => set({ roomId }),
  setRoom: (room) => set({ room })
}));
