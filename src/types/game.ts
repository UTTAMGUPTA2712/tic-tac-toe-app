export interface Player {
  userId: string;
  username: string;
  symbol: "X" | "O";
}

export interface GameState {
  board: (string | null)[];
  currentPlayer: string;
  players: Record<string, Player>;
  winner: string | null;
  isDraw: boolean;
  gameOver: boolean;
  moveCount: number;
}

export enum OpCode {
  MOVE = 1,
  GAME_STATE = 2,
  GAME_OVER = 3,
  PLAYER_JOINED = 4,
  PLAYER_LEFT = 5,
  ERROR = 99,
}