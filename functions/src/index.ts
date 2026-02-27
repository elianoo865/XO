import * as admin from "firebase-admin";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { logger } from "firebase-functions";
import { computeWinner, emptyBoard, Mark } from "./game";

admin.initializeApp();
const db = admin.firestore();

function requireAuth(request: any) {
  if (!request.auth?.uid) throw new HttpsError("unauthenticated", "Sign in required.");
  return request.auth.uid as string;
}

function now() {
  return admin.firestore.FieldValue.serverTimestamp();
}

function roomRef(roomId: string) {
  return db.collection("rooms").doc(roomId);
}

function userRef(uid: string) {
  return db.collection("users").doc(uid);
}

function queueRef(uid: string) {
  return db.collection("queue").doc(uid);
}

function randomMark(): Mark {
  return Math.random() < 0.5 ? "X" : "O";
}

export const createPrivateRoom = onCall(async (request) => {
  const uid = requireAuth(request);
  const name = (request.data?.name ?? "Guest") as string;

  const roomId = db.collection("rooms").doc().id;
  const creatorMark = "X"; // keep predictable; can randomize if you want
  const otherMark: Mark = creatorMark === "X" ? "O" : "X";

  const room = {
    roomId,
    type: "private" as const,
    status: "waiting" as const,
    players: {
      [creatorMark]: { uid, name, joinedAt: now(), connectedAt: now() },
      [otherMark]: { uid: "__empty__", name: "—", joinedAt: null, connectedAt: null }
    },
    board: emptyBoard(),
    turn: "X" as Mark,
    winner: null as Mark | "draw" | null,
    moveCount: 0,
    lastMove: null,
    rematch: { requestedByX: false, requestedByO: false, nextRoomId: null },
    createdAt: now(),
    updatedAt: now()
  };

  await db.runTransaction(async (tx) => {
    tx.set(roomRef(roomId), room);
    tx.set(userRef(uid), { activeRoomId: roomId, lastSeenAt: now() }, { merge: true });
  });

  return { roomId };
});

export const joinPrivateRoom = onCall(async (request) => {
  const uid = requireAuth(request);
  const roomId = (request.data?.roomId ?? "") as string;
  const name = (request.data?.name ?? "Guest") as string;
  if (!roomId) throw new HttpsError("invalid-argument", "roomId is required.");

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(roomRef(roomId));
    if (!snap.exists) throw new HttpsError("not-found", "Room not found.");
    const room = snap.data() as any;

    if (room.status !== "waiting") throw new HttpsError("failed-precondition", "Room is not joinable.");

    const xUid = room.players?.X?.uid;
    const oUid = room.players?.O?.uid;

    if (xUid === uid || oUid === uid) {
      // already in room; allow
      tx.set(userRef(uid), { activeRoomId: roomId, lastSeenAt: now() }, { merge: true });
      return;
    }

    // Find empty slot
    let slot: Mark | null = null;
    if (xUid === "__empty__") slot = "X";
    else if (oUid === "__empty__") slot = "O";

    if (!slot) throw new HttpsError("failed-precondition", "Room is full.");

    room.players[slot] = { uid, name, joinedAt: now(), connectedAt: now() };
    room.status = "active";
    room.updatedAt = now();

    tx.set(roomRef(roomId), room, { merge: true });
    tx.set(userRef(uid), { activeRoomId: roomId, lastSeenAt: now() }, { merge: true });
  });

  return { ok: true };
});

export const enqueueMatchmaking = onCall(async (request) => {
  const uid = requireAuth(request);
  const region = (request.data?.region ?? "global") as string;

  await queueRef(uid).set(
    {
      uid,
      region,
      enqueuedAt: admin.firestore.FieldValue.serverTimestamp()
    },
    { merge: true }
  );

  return { enqueued: true };
});

// Scheduled matchmaker every 5 seconds
export const matchmake = onSchedule("every 5 minutes", async () => {
  // NOTE: Firebase schedules minimum granularity is minutes.
  // We'll do matchmaking in batches, pairing many users each run.
  // If you want faster pairing, you can switch to Firestore trigger-based matching.

  const qSnap = await db.collection("queue").orderBy("enqueuedAt", "asc").limit(50).get();
  const users = qSnap.docs.map((d) => d.id);

  // Pair sequentially: (0,1), (2,3), ...
  for (let i = 0; i + 1 < users.length; i += 2) {
    const uidA = users[i];
    const uidB = users[i + 1];
    try {
      await createRoomFromQueuePair(uidA, uidB);
    } catch (e) {
      logger.warn("matchmake pair failed", { uidA, uidB, e });
    }
  }
});

async function createRoomFromQueuePair(uidA: string, uidB: string) {
  if (uidA === uidB) return;

  const roomId = db.collection("rooms").doc().id;
  const aMark = randomMark();
  const bMark: Mark = aMark === "X" ? "O" : "X";

  await db.runTransaction(async (tx) => {
    const [aUser, bUser] = await Promise.all([tx.get(userRef(uidA)), tx.get(userRef(uidB))]);
    const aName = (aUser.data()?.name ?? "Guest") as string;
    const bName = (bUser.data()?.name ?? "Guest") as string;

    // Ensure they are still queued
    const [qa, qb] = await Promise.all([tx.get(queueRef(uidA)), tx.get(queueRef(uidB))]);
    if (!qa.exists || !qb.exists) return;

    tx.set(roomRef(roomId), {
      roomId,
      type: "quick",
      status: "active",
      players: {
        [aMark]: { uid: uidA, name: aName, joinedAt: now(), connectedAt: now() },
        [bMark]: { uid: uidB, name: bName, joinedAt: now(), connectedAt: now() }
      },
      board: emptyBoard(),
      turn: "X",
      winner: null,
      moveCount: 0,
      lastMove: null,
      rematch: { requestedByX: false, requestedByO: false, nextRoomId: null },
      createdAt: now(),
      updatedAt: now()
    });

    tx.delete(queueRef(uidA));
    tx.delete(queueRef(uidB));

    tx.set(userRef(uidA), { activeRoomId: roomId, lastSeenAt: now() }, { merge: true });
    tx.set(userRef(uidB), { activeRoomId: roomId, lastSeenAt: now() }, { merge: true });
  });
}

export const makeMove = onCall(async (request) => {
  const uid = requireAuth(request);
  const roomId = (request.data?.roomId ?? "") as string;
  const index = Number(request.data?.index);

  if (!roomId) throw new HttpsError("invalid-argument", "roomId required.");
  if (!Number.isInteger(index) || index < 0 || index > 8) {
    throw new HttpsError("invalid-argument", "index must be 0..8");
  }

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(roomRef(roomId));
    if (!snap.exists) throw new HttpsError("not-found", "Room not found.");
    const room = snap.data() as any;

    if (room.status !== "active") throw new HttpsError("failed-precondition", "Room not active.");
    if (room.winner) throw new HttpsError("failed-precondition", "Game already finished.");

    const xUid = room.players?.X?.uid;
    const oUid = room.players?.O?.uid;

    let myMark: Mark | null = null;
    if (xUid === uid) myMark = "X";
    else if (oUid === uid) myMark = "O";

    if (!myMark) throw new HttpsError("permission-denied", "You are not a player in this room.");
    if (room.turn !== myMark) throw new HttpsError("failed-precondition", "Not your turn.");

    const board = (room.board ?? []) as Array<"X" | "O" | null>;
    if (board.length !== 9) throw new HttpsError("internal", "Corrupted board state.");
    if (board[index] !== null) throw new HttpsError("failed-precondition", "Cell already taken.");

    board[index] = myMark;
    const moveCount = Number(room.moveCount ?? 0) + 1;
    const winner = computeWinner(board);

    const nextTurn: Mark = myMark === "X" ? "O" : "X";

    tx.update(roomRef(roomId), {
      board,
      moveCount,
      winner: winner ?? null,
      turn: winner ? room.turn : nextTurn,
      lastMove: { by: myMark, index, at: now() },
      updatedAt: now()
    });

    tx.set(userRef(uid), { lastSeenAt: now() }, { merge: true });
  });

  return { ok: true };
});

export const requestRematch = onCall(async (request) => {
  const uid = requireAuth(request);
  const roomId = (request.data?.roomId ?? "") as string;
  if (!roomId) throw new HttpsError("invalid-argument", "roomId required.");

  const res = await db.runTransaction(async (tx) => {
    const snap = await tx.get(roomRef(roomId));
    if (!snap.exists) throw new HttpsError("not-found", "Room not found.");
    const room = snap.data() as any;

    const xUid = room.players?.X?.uid;
    const oUid = room.players?.O?.uid;
    if (uid !== xUid && uid !== oUid) throw new HttpsError("permission-denied", "Not a player.");

    const isX = uid === xUid;
    const rematch = room.rematch ?? { requestedByX: false, requestedByO: false, nextRoomId: null };
    if (isX) rematch.requestedByX = true;
    else rematch.requestedByO = true;

    let nextRoomId: string | null = rematch.nextRoomId ?? null;

    // If both requested and next room not created, create it
    if (rematch.requestedByX && rematch.requestedByO && !nextRoomId) {
      nextRoomId = db.collection("rooms").doc().id;

      tx.set(roomRef(nextRoomId), {
        roomId: nextRoomId,
        type: room.type ?? "private",
        status: "active",
        players: {
          X: room.players.X,
          O: room.players.O
        },
        board: emptyBoard(),
        turn: "X",
        winner: null,
        moveCount: 0,
        lastMove: null,
        rematch: { requestedByX: false, requestedByO: false, nextRoomId: null },
        createdAt: now(),
        updatedAt: now()
      });

      // point both users to new room
      tx.set(userRef(xUid), { activeRoomId: nextRoomId, lastSeenAt: now() }, { merge: true });
      tx.set(userRef(oUid), { activeRoomId: nextRoomId, lastSeenAt: now() }, { merge: true });

      rematch.nextRoomId = nextRoomId;
    }

    tx.update(roomRef(roomId), { rematch, updatedAt: now() });
    return { nextRoomId };
  });

  return res;
});

export const leaveRoom = onCall(async (request) => {
  const uid = requireAuth(request);
  const roomId = (request.data?.roomId ?? "") as string;
  if (!roomId) throw new HttpsError("invalid-argument", "roomId required.");

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(roomRef(roomId));
    if (!snap.exists) return;

    const room = snap.data() as any;
    const xUid = room.players?.X?.uid;
    const oUid = room.players?.O?.uid;

    // Clear activeRoomId for leaver
    tx.set(userRef(uid), { activeRoomId: null, lastSeenAt: now() }, { merge: true });

    // If game active, mark forfeit winner to the other
    if (room.status === "active" && !room.winner) {
      let winner: Mark | "draw" | null = null;
      if (uid === xUid) winner = "O";
      if (uid === oUid) winner = "X";
      if (winner) {
        tx.update(roomRef(roomId), { status: "finished", winner, updatedAt: now() });
      }
    }
  });

  return { ok: true };
});
