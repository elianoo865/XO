import React, { useEffect } from "react";
import { View, Text, Pressable, StyleSheet, Alert } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../App";
import { subscribeRoom } from "../firebase/firestore";
import { useGameStore } from "../store/gameStore";
import { fnLeaveRoom } from "../firebase/functions";
import { useAuthStore } from "../store/authStore";

type Props = NativeStackScreenProps<RootStackParamList, "Lobby">;

export default function LobbyScreen({ route, navigation }: Props) {
  const { roomId } = route.params;
  const uid = useAuthStore((s) => s.uid);
  const room = useGameStore((s) => s.room);
  const setRoom = useGameStore((s) => s.setRoom);

  useEffect(() => {
    const unsub = subscribeRoom(roomId, (r) => {
      setRoom(r);
      if (r?.status === "active") {
        navigation.replace("Game", { roomId });
      }
    });
    return unsub;
  }, [roomId, navigation, setRoom]);

  const onExit = async () => {
    try {
      await fnLeaveRoom({ roomId });
    } catch {}
    navigation.popToTop();
  };

  const you =
    uid && room
      ? room.players.X.uid === uid
        ? "X"
        : room.players.O.uid === uid
          ? "O"
          : "?"
      : "?";

  return (
    <View style={styles.container}>
      <Text style={styles.h1}>Lobby</Text>
      <Text style={styles.code}>Room Code: {roomId}</Text>
      <Text style={styles.info}>You are: {you}</Text>

      <View style={styles.card}>
        <Text style={styles.player}>X: {room?.players?.X?.name ?? "—"}</Text>
        <Text style={styles.player}>O: {room?.players?.O?.name ?? "—"}</Text>
        <Text style={styles.status}>Status: {room?.status ?? "loading..."}</Text>
      </View>

      <Pressable style={styles.btnGhost} onPress={onExit}>
        <Text style={styles.btnText}>Leave</Text>
      </Pressable>

      <Text style={styles.hint}>Waiting for the second player…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 18, alignItems: "center", justifyContent: "center" },
  h1: { fontSize: 30, fontWeight: "800" },
  code: { marginTop: 8, fontSize: 16 },
  info: { marginTop: 6, fontSize: 16, fontWeight: "700" },
  card: {
    marginTop: 18,
    width: "100%",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1
  },
  player: { fontSize: 16, marginBottom: 6 },
  status: { fontSize: 14, opacity: 0.8, marginTop: 6 },
  btnGhost: { marginTop: 16, backgroundColor: "#333", padding: 14, borderRadius: 14, width: "100%" },
  btnText: { color: "white", textAlign: "center", fontWeight: "700" },
  hint: { marginTop: 14, opacity: 0.7 }
});
