// src/components/GameBoard.tsx
import { X, Circle, Trophy, Users, RotateCcw, LogOut } from "lucide-react";
import { useNakamaMatch } from "../hooks/useNakamaMatch";

interface GameBoardProps {
  username: string;
  roomId: string;
  onExitGame: () => Promise<void>;
}

export default function GameBoard({ username, roomId, onExitGame }: GameBoardProps) {
  const { gameState, mySymbol, makeMove, restartGame, status } = useNakamaMatch(username);

  if (!gameState) {
    return (
      <div className="board-shell waiting-shell">
        <div className="waiting-spinner-wrap">
          <div className="waiting-spinner"></div>
          <Users
            className="waiting-icon"
            size={28}
          />
        </div>
        <div className="waiting-text">
          <p>Waiting for Opponent</p>
          <span>{status}</span>
        </div>
        <div className="room-code-card">
          <span>Share this Room ID</span>
          <code>{roomId}</code>
        </div>
      </div>
    );
  }

  const isMyTurn =
    !gameState.gameOver &&
    gameState.currentPlayer ===
      Object.keys(gameState.players || {}).find(
        (key) => gameState.players[key].symbol === mySymbol,
      );

  const handleCellClick = (index: number) => {
    if (gameState.board[index] || gameState.gameOver || !isMyTurn) return;
    makeMove(index);
  };

  const winnerSymbol = gameState.winner;
  const playerCount = Object.keys(gameState.players || {}).length;
  const hasBothPlayers = playerCount === 2;

  return (
    <div className="board-shell">
      <div className="board-header">
        <div className="player-card">
          <div className={`player-badge ${mySymbol === "X" ? "x-badge" : "o-badge"}`}>
            {mySymbol || "?"}
          </div>
          <div className="player-copy">
            <span className="label">You</span>
            <strong>{mySymbol || "-"}</strong>
            <span className="name">{username}</span>
          </div>
        </div>

        <div className="vs-badge">
          <div>
            <Users size={16} />
            VS
          </div>
        </div>

        <div className="player-card right">
          <div className="player-copy">
            <span className="label">Opponent</span>
            <strong>{mySymbol === "X" ? "O" : "X"}</strong>
          </div>
          <div className={`player-badge ${mySymbol === "X" ? "o-badge" : "x-badge"}`}>
            {mySymbol === "X" ? "O" : "X"}
          </div>
        </div>
      </div>

      <div className="status-wrap">
        <div
          className={`status-pill ${
            gameState.gameOver
              ? "status-end"
              : isMyTurn
                ? "status-turn"
                : "status-wait"
          }`}
        >
          {gameState.gameOver ? (
            <>
              <Trophy size={18} />
              {winnerSymbol ? `${winnerSymbol} Wins the Game!` : "It's a Draw!"}
            </>
          ) : !hasBothPlayers ? (
            "Waiting for opponent to join..."
          ) : isMyTurn ? (
            "Your Turn • Make a Move"
          ) : (
            "Waiting for Opponent's Move..."
          )}
        </div>
      </div>

      <div className="board-grid-wrap">
        <div className="board-grid">
          {gameState.board.map((cell, index) => (
            <button
              key={index}
              onClick={() => handleCellClick(index)}
              disabled={!!cell || gameState.gameOver || !isMyTurn}
              className={`cell-btn ${cell ? "filled" : "empty"}`}
            >
              {cell === "X" && (
                <X size={52} className="icon-x" />
              )}
              {cell === "O" && (
                <Circle size={52} className="icon-o" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="board-footer">
        <p className="match-id">
          Room ID: {roomId}
        </p>

        <div className="footer-actions">
          {gameState.gameOver && (
            <button
              onClick={restartGame}
              className="secondary-btn"
            >
              <RotateCcw size={20} />
              Restart in Same Room
            </button>
          )}
          <button
            onClick={onExitGame}
            className="danger-btn"
            type="button"
          >
            <LogOut size={18} />
            Exit Game
          </button>
        </div>
      </div>
    </div>
  );
}
