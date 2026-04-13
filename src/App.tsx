import { useEffect, useState } from "react";
import {
  clearStoredSession,
  connectSocket,
  createRoom,
  getLeaderboard,
  getMatchHistory,
  getConnectionInfo,
  joinRoom,
  joinMatch,
  leaveMatch,
  LeaderboardItem,
  loginUser,
  MatchHistoryItem,
  restoreSessionFromStorage,
  signUpUser,
} from "./lib/nakama";
import GameBoard from "./components/GameBoard";

type Stage = "auth" | "lobby" | "game";
type AuthMode = "signup" | "login";

function App() {
  const { host, port } = getConnectionInfo();
  const [stage, setStage] = useState<Stage>("auth");
  const [authMode, setAuthMode] = useState<AuthMode>("signup");
  const [username, setUsername] = useState(`player${Math.floor(Math.random() * 9999)}`);
  const [password, setPassword] = useState("");
  const [roomIdInput, setRoomIdInput] = useState("");
  const [currentRoomId, setCurrentRoomId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [history, setHistory] = useState<MatchHistoryItem[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);
  const [isStatsLoading, setIsStatsLoading] = useState(false);

  useEffect(() => {
    const restore = async () => {
      const { session, username: savedUsername } = restoreSessionFromStorage();
      if (!session) {
        setIsBootstrapping(false);
        return;
      }

      try {
        await connectSocket(session);
        if (savedUsername) {
          setUsername(savedUsername);
        }
        setStage("lobby");
      } catch (_err) {
        clearStoredSession();
      } finally {
        setIsBootstrapping(false);
      }
    };
    restore();
  }, []);

  const handleAuth = async () => {
    if (!username.trim() || !password.trim()) return;
    setIsLoading(true);
    setError("");

    try {
      const session =
        authMode === "signup"
          ? await signUpUser(username.trim(), password)
          : await loginUser(username.trim(), password);
      await connectSocket(session);
      setStage("lobby");
    } catch (err: any) {
      setError(err.message || "Authentication failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateRoom = async () => {
    setIsLoading(true);
    setError("");
    try {
      const roomId = await createRoom();
      await joinMatch(roomId);
      setCurrentRoomId(roomId);
      setStage("game");
    } catch (err: any) {
      setError(err.message || "Failed to create room.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!roomIdInput.trim()) return;
    setIsLoading(true);
    setError("");
    try {
      const roomId = await joinRoom(roomIdInput.trim());
      await joinMatch(roomId);
      setCurrentRoomId(roomId);
      setStage("game");
    } catch (err: any) {
      setError(err.message || "Failed to join room.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    setIsStatsLoading(true);
    try {
      const [historyRes, leaderboardRes] = await Promise.all([
        getMatchHistory(10),
        getLeaderboard(10),
      ]);
      setHistory(historyRes.records);
      setLeaderboard(leaderboardRes.records);
    } catch (err: any) {
      setError(err.message || "Failed to load leaderboard/history.");
    } finally {
      setIsStatsLoading(false);
    }
  };

  const handleExitGame = async () => {
    try {
      await leaveMatch();
    } catch (_err) {
      // ignore and continue to lobby
    }
    setCurrentRoomId("");
    setStage("lobby");
    loadStats();
  };

  useEffect(() => {
    if (stage === "lobby") {
      loadStats();
    }
  }, [stage]);

  return (
    <div className="app-shell">
      <div className="app-bg-pattern" />
      <div className="app-container">
        {isBootstrapping ? (
          <div className="login-card-wrap">
            <div className="login-card">
              <div className="field-stack">
                <div className="connection-hint">Restoring session...</div>
              </div>
            </div>
          </div>
        ) : stage === "auth" ? (
          <div className="login-card-wrap">
            <div className="login-title-wrap">
              <div className="logo-badge">
                <span>❌⭕</span>
              </div>
              <h1>Tic Tac Toe</h1>
              <p className="subtitle">Signup / Login</p>
              <p className="muted">No email verification required</p>
            </div>

            <div className="login-card">
              <div className="toggle-row">
                <button
                  className={`toggle-btn ${authMode === "signup" ? "active" : ""}`}
                  onClick={() => setAuthMode("signup")}
                  type="button"
                >
                  Sign Up
                </button>
                <button
                  className={`toggle-btn ${authMode === "login" ? "active" : ""}`}
                  onClick={() => setAuthMode("login")}
                  type="button"
                >
                  Login
                </button>
              </div>

              <div className="field-stack">
                <div>
                  <label className="input-label">Your Username</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter a cool username"
                    className="text-input"
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <label className="input-label">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="text-input"
                    disabled={isLoading}
                  />
                </div>

                <button
                  onClick={handleAuth}
                  disabled={isLoading || !username.trim() || !password.trim()}
                  className="primary-btn"
                >
                  {isLoading ? (
                    <span className="btn-content">
                      <div className="spinner" />
                      Connecting...
                    </span>
                  ) : (
                    authMode === "signup" ? "Create Account" : "Login"
                  )}
                </button>

                {error && (
                  <div className="error-box">{error}</div>
                )}
              </div>
            </div>

            <div className="connection-hint">
              Make sure Nakama server is running on{" "}
              <code>
                {host}:{port}
              </code>
            </div>
          </div>
        ) : stage === "lobby" ? (
          <div className="login-card-wrap">
            <div className="login-title-wrap">
              <h1>Game Lobby</h1>
              <p className="subtitle">Welcome, {username}</p>
            </div>

            <div className="login-card">
              <div className="field-stack">
                <button
                  className="primary-btn"
                  onClick={handleCreateRoom}
                  disabled={isLoading}
                >
                  Create Room
                </button>

                <div>
                  <label className="input-label">Room ID</label>
                  <input
                    type="text"
                    value={roomIdInput}
                    onChange={(e) => setRoomIdInput(e.target.value)}
                    placeholder="Paste room id"
                    className="text-input"
                    disabled={isLoading}
                  />
                </div>

                <button
                  className="secondary-btn full-btn"
                  onClick={handleJoinRoom}
                  disabled={isLoading || !roomIdInput.trim()}
                >
                  Join Room
                </button>

                {error && <div className="error-box">{error}</div>}

                <button
                  className="secondary-btn full-btn"
                  type="button"
                  onClick={loadStats}
                  disabled={isStatsLoading}
                >
                  {isStatsLoading ? "Refreshing..." : "Refresh Leaderboard/History"}
                </button>
              </div>
            </div>

            <div className="stats-grid">
              <div className="stats-card">
                <h3>Leaderboard</h3>
                {leaderboard.length === 0 ? (
                  <p className="muted-copy">
                    {isStatsLoading ? "Loading..." : "No leaderboard entries yet."}
                  </p>
                ) : (
                  <div className="stats-list">
                    {leaderboard.map((entry, idx) => (
                      <div className="stats-row" key={`${entry.ownerId}-${idx}`}>
                        <span>#{idx + 1} {entry.username}</span>
                        <span>
                          W:{entry.score} L:{Math.abs(entry.subscore)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="stats-card">
                <h3>Recent Matches</h3>
                {history.length === 0 ? (
                  <p className="muted-copy">
                    {isStatsLoading ? "Loading..." : "No matches recorded yet."}
                  </p>
                ) : (
                  <div className="stats-list">
                    {history.map((item, idx) => (
                      <div className="stats-row" key={`${item.matchId}-${idx}`}>
                        <span>
                          <span className={`result-pill ${item.result}`}>
                            {item.result.toUpperCase()}
                          </span>{" "}
                          vs {item.opponentUsername || "Unknown"}
                        </span>
                        <span>{new Date(item.playedAt).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <GameBoard
            username={username}
            roomId={currentRoomId}
            onExitGame={handleExitGame}
          />
        )}
      </div>
    </div>
  );
}

export default App;
