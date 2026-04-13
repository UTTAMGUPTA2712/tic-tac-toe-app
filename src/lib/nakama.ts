import { Client, Session, Socket } from '@heroiclabs/nakama-js';

const SERVER_KEY = process.env.REACT_APP_NAKAMA_SERVER_KEY || "defaultkey";
const HOST = process.env.REACT_APP_NAKAMA_HOST || "localhost";
const PORT = process.env.REACT_APP_NAKAMA_PORT || "7350";
const USE_SSL = process.env.REACT_APP_NAKAMA_USE_SSL === "true";

const client = new Client(SERVER_KEY, HOST, PORT, USE_SSL);
const SESSION_TOKEN_KEY = "ttt_session_token";
const REFRESH_TOKEN_KEY = "ttt_refresh_token";
const USERNAME_KEY = "ttt_username";

let currentSession: Session | null = null;
let currentSocket: Socket | null = null;
let currentMatchId: string | null = null;

export const getClient = () => client;
export const getSocket = () => currentSocket;
export const getCurrentMatchId = () => currentMatchId;
export const getConnectionInfo = () => ({ host: HOST, port: PORT, useSSL: USE_SSL });

const parsePayload = (payload: any): any => {
  if (!payload) return {};
  if (typeof payload === "string") {
    try {
      return JSON.parse(payload);
    } catch (_e) {
      return {};
    }
  }
  return payload;
};

const persistSession = (session: Session, username: string) => {
  localStorage.setItem(SESSION_TOKEN_KEY, session.token);
  // @ts-ignore refresh token exists on runtime Session object
  localStorage.setItem(REFRESH_TOKEN_KEY, session.refresh_token || "");
  localStorage.setItem(USERNAME_KEY, username);
};

export const clearStoredSession = () => {
  localStorage.removeItem(SESSION_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USERNAME_KEY);
};

export const restoreSessionFromStorage = (): { session: Session | null; username: string } => {
  const token = localStorage.getItem(SESSION_TOKEN_KEY) || "";
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY) || "";
  const username = localStorage.getItem(USERNAME_KEY) || "";

  if (!token || !refreshToken) {
    return { session: null, username: "" };
  }

  try {
    const restored = Session.restore(token, refreshToken);
    currentSession = restored;
    return { session: restored, username };
  } catch (_err) {
    clearStoredSession();
    return { session: null, username: "" };
  }
};

export const signUpUser = async (
  username: string,
  password: string,
): Promise<Session> => {
  try {
    const email = `${username.toLowerCase()}@tictactoe.local`;
    currentSession = await client.authenticateEmail(
      email,
      password,
      true,
      username,
      {},
    );
    persistSession(currentSession, username);
    console.log(`✅ Signed up: ${username}`);
    return currentSession;
  } catch (error: any) {
    console.error("❌ Signup failed:", error);
    throw error;
  }
};

export const loginUser = async (
  username: string,
  password: string,
): Promise<Session> => {
  try {
    const email = `${username.toLowerCase()}@tictactoe.local`;
    currentSession = await client.authenticateEmail(
      email,
      password,
      false,
      username,
      {},
    );
    persistSession(currentSession, username);
    console.log(`✅ Logged in: ${username}`);
    return currentSession;
  } catch (error: any) {
    console.error("❌ Login failed:", error);
    throw error;
  }
};

export const connectSocket = async (session: Session): Promise<Socket> => {
  try {
    currentSocket = client.createSocket();
    await currentSocket.connect(session, true);
    console.log("✅ Socket connected successfully");
    return currentSocket;
  } catch (error: any) {
    console.error("❌ Socket connection failed:", error);
    throw error;
  }
};

export const findOrCreateMatch = async (): Promise<string> => {
  if (!currentSession) throw new Error("No active session");

  const response = await client.rpc(currentSession, "find_or_create_match", {}) as any;
  const payload = parsePayload(response.payload);
  currentMatchId = payload.matchId as string;
  console.log("✅ Match ID received:", currentMatchId);
  return currentMatchId;
};

export const createRoom = async (roomName?: string): Promise<string> => {
  if (!currentSession) throw new Error("No active session");

  const response = await client.rpc(
    currentSession,
    "create_room",
    { roomName: roomName || "" },
  ) as any;
  const payload = parsePayload(response.payload);
  return payload.matchId as string;
};

export const listRooms = async (): Promise<
  { matchId: string; playerCount: number; maxPlayers: number; label: string }[]
> => {
  if (!currentSession) throw new Error("No active session");

  const response = await client.rpc(currentSession, "list_rooms", {}) as any;
  const payload = parsePayload(response.payload);
  return (payload.rooms || []) as {
    matchId: string;
    playerCount: number;
    maxPlayers: number;
    label: string;
  }[];
};

export const joinRoom = async (matchId: string): Promise<string> => {
  if (!currentSession) throw new Error("No active session");

  const response = await client.rpc(
    currentSession,
    "join_room",
    { matchId },
  ) as any;
  const payload = parsePayload(response.payload);
  return payload.matchId as string;
};

export const joinMatch = async (matchId: string) => {
  if (!currentSocket) throw new Error("Socket not connected");

  const match = await currentSocket.joinMatch(matchId);
  currentMatchId = match.match_id;

  console.log("✅ Successfully joined match:", currentMatchId);
  return match;
};

export const sendMove = async (position: number) => {
  if (!currentSocket || !currentMatchId) {
    console.error("Cannot send move - no active match");
    return;
  }
  try {
    await currentSocket.sendMatchState(currentMatchId, 1, JSON.stringify({ position }));
    console.log(`📤 Move sent: position ${position}`);
  } catch (error) {
    console.error("Failed to send move:", error);
  }
};

export const sendRestart = async () => {
  if (!currentSocket || !currentMatchId) {
    console.error("Cannot restart - no active match");
    return;
  }
  try {
    await currentSocket.sendMatchState(currentMatchId, 6, JSON.stringify({}));
    console.log("🔁 Restart request sent");
  } catch (error) {
    console.error("Failed to restart:", error);
  }
};

export const requestSyncState = async () => {
  if (!currentSocket || !currentMatchId) {
    return;
  }
  try {
    await currentSocket.sendMatchState(currentMatchId, 7, JSON.stringify({}));
  } catch (error) {
    console.error("Failed to request sync state:", error);
  }
};