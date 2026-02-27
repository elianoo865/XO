export type Mark = "X" | "O";
export type Cell = Mark | null;

export type PlayerInfo = {
  uid: string;
  name: string;
  joinedAt?: any;
  connectedAt?: any;
};

export type RoomDoc = {
  roomId: string;
  type: "quick" | "private";
  status: "waiting" | "active" | "finished";
  players: {
    X: PlayerInfo;
    O: PlayerInfo;
  };
  board: Cell[];
  turn: Mark;
  winner: Mark | "draw" | null;
  moveCount: number;
  lastMove: { by: Mark; index: number; at: any } | null;
  createdAt?: any;
  updatedAt?: any;
  rematch?: {
    requestedByX: boolean;
    requestedByO: boolean;
    nextRoomId: string | null;
  };
};
