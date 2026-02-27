import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../App";
import { fnCreatePrivateRoom, fnEnqueueMatchmaking } from "../firebase/functions";
import { useAuthStore } from "../store/authStore";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/init";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

export default function HomeScreen({ navigation }: Props) {
  const uid = useAuthStore((s) => s.uid);
  const [loading, setLoading] = useState(false);

  const onCreateRoom = async () => {
    setLoading(true);
    try {
      const res: any = await fnCreatePrivateRoom({ name: "Guest" });
      const roomId = res.data.roomId as string;
      navigation.navigate("Lobby", { roomId });
    } finally {
      setLoading(false);
    }
  };

  const onQuickMatch = async () => {
    if (!uid) return;
    setLoading(true);

    // Listen for match assignment via users/{uid}.activeRoomId
    const unsub = onSnapshot(doc(db, "users", uid), (snap) => {
      const data = snap.data() as any;
      const roomId = data?.activeRoomId;
      if (roomId) {
        unsub();
        setLoading(false);
        navigation.navigate("Lobby", { roomId });
      }
    });

    try {
      await fnEnqueueMatchmaking({ region: "global" });
    } catch (e) {
      unsub();
      setLoading(false);
      throw e;
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.h1}>XO Online</Text>

      <Pressable style={styles.btn} onPress={onQuickMatch} disabled={loading}>
        <Text style={styles.btnText}>Quick Match</Text>
      </Pressable>

      <Pressable style={styles.btn} onPress={onCreateRoom} disabled={loading}>
        <Text style={styles.btnText}>Create Private Room</Text>
      </Pressable>

      <Pressable style={[styles.btn, styles.btnGhost]} onPress={() => navigation.navigate("Join")} disabled={loading}>
        <Text style={styles.btnText}>Join With Code</Text>
      </Pressable>

      {loading ? <ActivityIndicator style={{ marginTop: 16 }} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 18 },
  h1: { fontSize: 34, fontWeight: "800", marginBottom: 22 },
  btn: {
    width: "100%",
    padding: 14,
    borderRadius: 14,
    backgroundColor: "black",
    marginTop: 12
  },
  btnGhost: { backgroundColor: "#333" },
  btnText: { color: "white", textAlign: "center", fontWeight: "700", fontSize: 16 }
});
