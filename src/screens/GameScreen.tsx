import React, { useEffect, useMemo, useState } from "react";
import { View, Text, Pressable, StyleSheet, Alert } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../App";
import { subscribeRoom } from "../firebase/firestore";
import { useGameStore } from "../store/gameStore";
import { useAuthStore } from "../store/authStore";
import Board from "../components/Board";
import ResultModal from "../components/ResultModal";
import { fnMakeMove, fnRequestRematch, fnLeaveRoom } from "../firebase/functions";

type Props = NativeStackScreenProps<RootStackParamList, "Game">;

export default function GameScreen({ route, navigation }: Props) {
  const { roomId } = route.params;
  const uid = useAuthStore((s) => s.uid);
  const room = useGameStore((s) => s.room);
  const setRoom = useGameStore((s) => s.setRoom);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const unsub = subscribeRoom(roomId, (r) => {
      setRoom(r);
      if (!r) navigation.popToTop();
    });
    return unsub;
  }, [roomId, navigation, setRoom]);

  const myMark = useMemo(() => {
    if (!uid || !room) return null;
    if (room.players.X.uid === uid) return "X";
    if (room.players.O.uid === uid) return "O";
    return null;
  }, [uid, room]);

  const isMyTurn = room && myMark ? room.turn === myMark : false;

  const onPressCell = async (index: number) => {
    if (!room || !myMark) return;
    if (room.status !== "active") return;
    if (!isMyTurn) return;
    if (room.board[index] !== null) return;

    setPending(true);
    try {
      await fnMakeMove({ roomId, index });
    } catch (e: any) {
      Alert.alert("Move rejected", e?.message ?? "Invalid move");
    } finally {
      setPending(false);
    }
  };

  const resultTitle = useMemo(() => {
    if (!room?.winner) return "";
    if (room.winner === "draw") return "Draw";
    if (room.winner === myMark) return "You win!";
    return "You lose!";
  }, [room?.winner, myMark]);

  const onRematch = async () => {
    if (!room) return;
    try {
      const res: any = await fnRequestRematch({ roomId });
      const nextRoomId = res.data.nextRoomId as string | null;
      // If backend created next room, go there; otherwise wait.
      if (nextRoomId) {
        navigation.replace("Lobby", { roomId: nextRoomId });
      } else {
        Alert.alert("Rematch requested", "Waiting for opponent…");
      }
    } catch (e: any) {
      Alert.alert("Rematch failed", e?.message ?? "Try again");
    }
  };

  const onExit = async () => {
    try {
      await fnLeaveRoom({ roomId });
    } catch {}
    navigation.popToTop();
  };

  if (!room) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.h1}>Room {roomId}</Text>
      <Text style={styles.info}>
        You: {myMark ?? "?"} · Turn: {room.turn} {pending ? "· syncing…" : ""}
      </Text>

      <View style={{ marginTop: 18 }}>
        <Board board={room.board} disabled={!isMyTurn || pending || !!room.winner} onPressCell={onPressCell} />
      </View>

      <View style={styles.footer}>
        <Pressable style={styles.btnGhost} onPress={onExit}>
          <Text style={styles.btnText}>Leave</Text>
        </Pressable>
      </View>

      <ResultModal visible={!!room.winner} title={resultTitle} onRematch={onRematch} onExit={onExit} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 18, alignItems: "center", justifyContent: "center" },
  h1: { fontSize: 22, fontWeight: "800" },
  info: { marginTop: 8, opacity: 0.8 },
  footer: { width: "100%", marginTop: 18 },
  btnGhost: { backgroundColor: "#333", padding: 14, borderRadius: 14 },
  btnText: { color: "white", textAlign: "center", fontWeight: "700" }
});
