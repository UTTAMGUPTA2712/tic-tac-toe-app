// src/hooks/useNakamaMatch.ts
import { useEffect, useState, useCallback } from "react";
import { getSocket, sendMove, sendRestart, requestSyncState } from "../lib/nakama";
import { GameState, OpCode } from "../types/game";

export const useNakamaMatch = (username: string) => {
  // ← Accept username as parameter
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [mySymbol, setMySymbol] = useState<"X" | "O" | null>(null);
  const [status, setStatus] = useState("Waiting for opponent...");

  const safeParse = (rawData: any): any => {
    if (!rawData) return null;
    let str =
      typeof rawData === "string" ? rawData : new TextDecoder().decode(rawData);
    try {
      return JSON.parse(str);
    } catch (e) {
      console.warn("Parse failed:", rawData);
      return null;
    }
  };

  const handleMatchData = useCallback(
    (matchData: any) => {
      const opCode = matchData.opCode ?? matchData.op_code;
      const parsed = safeParse(matchData.data);

      console.log(`📥 OpCode ${opCode} received`, parsed);

      switch (opCode) {
        case OpCode.PLAYER_JOINED:
          setStatus("✅ Game started! Both players joined.");
          if (parsed?.players) {
            const playersList = Object.values(parsed.players) as any[];
            const myPlayer = playersList.find(
              (p: any) => p.username === username,
            );
            if (myPlayer) {
              setMySymbol(myPlayer.symbol);
              console.log(`My symbol detected: ${myPlayer.symbol}`);
            }
          }
          break;

        case OpCode.GAME_STATE:
          if (parsed) {
            setGameState(parsed);
            // Update my symbol if not set yet
            if (!mySymbol && parsed.players) {
              const playersList = Object.values(parsed.players) as any[];
              const myPlayer = playersList.find(
                (p: any) => p.username === username,
              );
              if (myPlayer) setMySymbol(myPlayer.symbol);
            }
          }
          break;

        case OpCode.GAME_OVER:
          if (parsed) {
            setGameState((prev) =>
              prev ? { ...prev, ...parsed, gameOver: true } : null,
            );
            if (parsed.reason === "opponent_left") {
              setStatus("Opponent left. You win this game.");
            } else {
              setStatus(
                parsed.winner ? `Winner: ${parsed.winner}` : "It's a Draw!",
              );
            }
          }
          break;

        case OpCode.ERROR:
          setStatus(`Error: ${parsed?.msg || "Invalid move"}`);
          break;
      }
    },
    [username, mySymbol],
  );

  useEffect(() => {
    const socket = getSocket();
    if (socket) {
      socket.onmatchdata = handleMatchData;
      requestSyncState();

      // Retry sync while waiting to avoid missed initial broadcasts.
      if (!gameState) {
        const timer = setInterval(() => {
          requestSyncState();
        }, 1500);
        return () => clearInterval(timer);
      }
    }
  }, [handleMatchData, gameState]);

  const makeMove = useCallback(
    async (position: number) => {
      if (!gameState || gameState.gameOver) return;
      await sendMove(position);
    },
    [gameState],
  );

  const restartGame = useCallback(async () => {
    await sendRestart();
    setStatus("Restart requested...");
  }, []);

  return {
    gameState,
    mySymbol,
    makeMove,
    restartGame,
    status,
  };
};
