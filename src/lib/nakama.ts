import { Client, Session, Socket } from '@heroiclabs/nakama-js';

const SERVER_KEY = "defaultkey";
const HOST = "localhost";
const PORT = "7350";
const USE_SSL = false;

const client = new Client(SERVER_KEY, HOST, PORT, USE_SSL);

let currentSession: Session | null = null;
let currentSocket: Socket | null = null;
let currentMatchId: string | null = null;

export const getClient = () => client;
export const getSocket = () => currentSocket;
export const getCurrentMatchId = () => currentMatchId;

export const authenticate = async (username: string): Promise<Session> => {
  try {
    const deviceId = `device_${username}_${Date.now()}`;

    currentSession = await client.authenticateDevice(
      deviceId,
      true,        // create
      username,    // username
      {}           // vars
    );

    console.log(`✅ Authenticated: ${username} (deviceId: ${deviceId})`);
    return currentSession;
  } catch (error: any) {
    console.error("❌ Authentication failed:", error);
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
  currentMatchId = response.payload.matchId as string;
  console.log("✅ Match ID received:", currentMatchId);
  return currentMatchId;
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