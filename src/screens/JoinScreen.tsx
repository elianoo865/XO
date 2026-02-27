import React, { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, Alert } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../App";
import { fnJoinPrivateRoom } from "../firebase/functions";

type Props = NativeStackScreenProps<RootStackParamList, "Join">;

export default function JoinScreen({ navigation }: Props) {
  const [roomId, setRoomId] = useState("");

  const onJoin = async () => {
    const id = roomId.trim();
    if (!id) return;
    try {
      await fnJoinPrivateRoom({ roomId: id, name: "Guest" });
      navigation.replace("Lobby", { roomId: id });
    } catch (e: any) {
      Alert.alert("Join failed", e?.message ?? "Could not join room");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Room Code</Text>
      <TextInput value={roomId} onChangeText={setRoomId} style={styles.input} autoCapitalize="none" />
      <Pressable style={styles.btn} onPress={onJoin}>
        <Text style={styles.btnText}>Join</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 18, justifyContent: "center" },
  label: { fontSize: 16, fontWeight: "700", marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 12 },
  btn: { padding: 14, borderRadius: 14, backgroundColor: "black" },
  btnText: { color: "white", textAlign: "center", fontWeight: "700" }
});
