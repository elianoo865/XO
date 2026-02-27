export type Mark = "X" | "O";
export type Cell = Mark | null;

export const LINES: ReadonlyArray<readonly [number, number, number]> = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6]
];

export function computeWinner(board: Cell[]): Mark | "draw" | null {
  for (const [a, b, c] of LINES) {
    const v = board[a];
    if (v && v === board[b] && v === board[c]) return v;
  }
  const filled = board.every((c) => c !== null);
  return filled ? "draw" : null;
}

export function emptyBoard(): Cell[] {
  return Array.from({ length: 9 }, () => null);
}
