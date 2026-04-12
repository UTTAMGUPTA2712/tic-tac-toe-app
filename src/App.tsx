import { useState } from "react";
import {
  authenticate,
  connectSocket,
  findOrCreateMatch,
  joinMatch,
} from "./lib/nakama";
import GameBoard from "./components/GameBoard";

function App() {
  const [username, setUsername] = useState(
    `Player${Math.floor(Math.random() * 9999)}`,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const startGame = async () => {
    if (!username.trim()) return;

    setIsLoading(true);
    setError("");

    try {
      const session = await authenticate(username);
      await connectSocket(session);
      const matchId = await findOrCreateMatch();
      await joinMatch(matchId);

      setIsLoggedIn(true);
      console.log("🎮 Game started successfully!");
    } catch (err: any) {
      console.error(err);
      setError(
        err.message ||
          "Failed to connect. Is the Nakama server running on localhost:7350?",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white overflow-hidden">
      {/* Background subtle grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#27272a_1px,transparent_1px)] bg-[length:30px_30px] opacity-30" />

      <div className="relative min-h-screen flex flex-col items-center justify-center p-6">
        {!isLoggedIn ? (
          // === Login Screen ===
          <div className="w-full max-w-md">
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-500/10 rounded-3xl mb-6 border border-blue-500/20">
                <span className="text-5xl">❌⭕</span>
              </div>
              <h1 className="text-6xl font-bold tracking-tighter mb-2">
                Tic Tac Toe
              </h1>
              <p className="text-2xl text-blue-400 font-medium">
                Nakama Multiplayer
              </p>
              <p className="text-zinc-400 mt-3">Real-time • Global • Instant</p>
            </div>

            <div className="bg-zinc-900/70 backdrop-blur-xl border border-zinc-700 rounded-3xl p-8 shadow-2xl">
              <div className="space-y-6">
                <div>
                  <label className="text-sm text-zinc-400 block mb-2">
                    Your Username
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter a cool username"
                    className="w-full bg-zinc-800 border border-zinc-700 focus:border-blue-500 rounded-2xl px-6 py-4 text-lg placeholder-zinc-500 focus:outline-none transition-all"
                    disabled={isLoading}
                  />
                </div>

                <button
                  onClick={startGame}
                  disabled={isLoading || !username.trim()}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:from-zinc-700 disabled:to-zinc-700 rounded-2xl text-xl font-semibold transition-all active:scale-[0.985] shadow-lg shadow-blue-500/30">
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-3">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Connecting to Nakama...
                    </span>
                  ) : (
                    "Play Online Now"
                  )}
                </button>

                {error && (
                  <div className="bg-red-950/50 border border-red-500/30 text-red-400 px-5 py-3 rounded-2xl text-sm">
                    {error}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-8 text-center text-xs text-zinc-500">
              Make sure Nakama server is running on{" "}
              <code className="bg-zinc-900 px-1.5 py-0.5 rounded">
                localhost:7350
              </code>
            </div>
          </div>
        ) : (
          <GameBoard username={username} />
        )}
      </div>
    </div>
  );
}

export default App;
