import React from "react";
import { View, Pressable, Text, StyleSheet } from "react-native";
import type { Cell } from "../types";

export default function Board({
  board,
  disabled,
  onPressCell
}: {
  board: Cell[];
  disabled?: boolean;
  onPressCell: (index: number) => void;
}) {
  return (
    <View style={styles.grid}>
      {board.map((cell, i) => (
        <Pressable
          key={i}
          style={[styles.cell, (i + 1) % 3 === 0 ? styles.cellEnd : null]}
          disabled={disabled}
          onPress={() => onPressCell(i)}
        >
          <Text style={styles.mark}>{cell ?? ""}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    width: 300,
    height: 300,
    flexDirection: "row",
    flexWrap: "wrap",
    borderWidth: 2,
    borderRadius: 16,
    overflow: "hidden"
  },
  cell: {
    width: 100,
    height: 100,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    alignItems: "center",
    justifyContent: "center"
  },
  cellEnd: { borderRightWidth: 0 },
  mark: { fontSize: 52, fontWeight: "700" }
});
