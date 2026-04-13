import { useEffect, useState } from "react";
import {
  clearStoredSession,
  connectSocket,
  createRoom,
  getConnectionInfo,
  joinRoom,
  joinMatch,
  loginUser,
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
              </div>
            </div>
          </div>
        ) : (
          <GameBoard username={username} roomId={currentRoomId} />
        )}
      </div>
    </div>
  );
}

export default App;
