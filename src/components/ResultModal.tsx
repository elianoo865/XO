import React from "react";
import { Modal, View, Text, Pressable, StyleSheet } from "react-native";

export default function ResultModal({
  visible,
  title,
  onRematch,
  onExit
}: {
  visible: boolean;
  title: string;
  onRematch: () => void;
  onExit: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>

          <Pressable style={styles.btn} onPress={onRematch}>
            <Text style={styles.btnText}>Rematch</Text>
          </Pressable>

          <Pressable style={[styles.btn, styles.btnGhost]} onPress={onExit}>
            <Text style={styles.btnText}>Exit</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center"
  },
  card: {
    width: 300,
    backgroundColor: "white",
    borderRadius: 18,
    padding: 16
  },
  title: { fontSize: 20, fontWeight: "700", marginBottom: 12, textAlign: "center" },
  btn: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: "black",
    marginTop: 10
  },
  btnGhost: { backgroundColor: "#333" },
  btnText: { color: "white", textAlign: "center", fontWeight: "700" }
});
