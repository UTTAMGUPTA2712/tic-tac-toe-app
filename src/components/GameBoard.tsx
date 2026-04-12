// src/components/GameBoard.tsx
import { X, Circle, Trophy, Users, RotateCcw } from "lucide-react";
import { useNakamaMatch } from "../hooks/useNakamaMatch";
import { getCurrentMatchId } from "../lib/nakama"; // ← Added this import

interface GameBoardProps {
  username: string;
}

export default function GameBoard({ username }: GameBoardProps) {
  const { gameState, mySymbol, makeMove, status } = useNakamaMatch(username);

  if (!gameState) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center gap-6">
        <div className="relative">
          <div className="w-20 h-20 border-8 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <Users
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-400"
            size={32}
          />
        </div>
        <div className="text-center">
          <p className="text-2xl font-semibold text-white mb-2">
            Waiting for Opponent
          </p>
          <p className="text-gray-400">{status}</p>
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

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-4">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center text-4xl font-bold shadow-lg
            ${mySymbol === "X" ? "bg-blue-600 text-white" : "bg-red-600 text-white"}`}>
            {mySymbol}
          </div>
          <div>
            <p className="text-sm text-gray-400">You are playing as</p>
            <p className="text-2xl font-bold text-white">{mySymbol}</p>
            <p className="text-sm text-gray-500 truncate max-w-[140px]">
              {username}
            </p>
          </div>
        </div>

        <div className="text-center">
          <div className="inline-flex items-center gap-2 bg-zinc-900 px-6 py-2.5 rounded-3xl text-sm font-medium">
            <Users size={20} className="text-gray-400" />
            VS
          </div>
        </div>

        <div className="flex items-center gap-4 text-right">
          <div>
            <p className="text-sm text-gray-400">Opponent</p>
            <p className="text-2xl font-bold text-white">
              {mySymbol === "X" ? "O" : "X"}
            </p>
          </div>
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center text-4xl font-bold shadow-lg
            ${mySymbol === "X" ? "bg-red-600 text-white" : "bg-blue-600 text-white"}`}>
            {mySymbol === "X" ? "O" : "X"}
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="mb-8 text-center">
        <div
          className={`inline-flex items-center gap-3 px-8 py-3 rounded-3xl text-lg font-semibold shadow-inner
          ${
            gameState.gameOver
              ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
              : isMyTurn
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : "bg-zinc-800 text-gray-400"
          }`}>
          {gameState.gameOver ? (
            <>
              <Trophy size={26} />
              {winnerSymbol ? `${winnerSymbol} Wins the Game!` : "It's a Draw!"}
            </>
          ) : isMyTurn ? (
            "Your Turn • Make a Move"
          ) : (
            "Waiting for Opponent's Move..."
          )}
        </div>
      </div>

      {/* Game Board */}
      <div className="relative bg-zinc-900 p-8 rounded-3xl shadow-2xl mb-10 border border-zinc-800">
        <div className="grid grid-cols-3 gap-4">
          {gameState.board.map((cell, index) => (
            <button
              key={index}
              onClick={() => handleCellClick(index)}
              disabled={!!cell || gameState.gameOver || !isMyTurn}
              className={`aspect-square rounded-2xl flex items-center justify-center transition-all duration-200 font-light
                ${
                  cell
                    ? "bg-zinc-800 cursor-default"
                    : "bg-zinc-950 hover:bg-zinc-900 active:scale-[0.97] border-2 border-zinc-700 hover:border-blue-500/50"
                }
                disabled:opacity-60`}>
              {cell === "X" && (
                <X size={88} className="text-blue-400 drop-shadow-lg" />
              )}
              {cell === "O" && (
                <Circle size={88} className="text-red-400 drop-shadow-lg" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="flex flex-col items-center gap-4 text-center">
        <p className="text-xs text-gray-500 font-mono">
          Match: {getCurrentMatchId()?.slice(0, 12)}...
        </p>

        {gameState.gameOver && (
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-3 bg-white hover:bg-gray-100 active:bg-gray-200 text-black font-semibold px-10 py-4 rounded-2xl transition-all shadow-xl">
            <RotateCcw size={20} />
            Play Again
          </button>
        )}
      </div>
    </div>
  );
}
