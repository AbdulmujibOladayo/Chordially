// #107 – Mobile authentication and session persistence
import { useState, useEffect } from "react";

const SESSION_KEY = "chordially_session";

interface Session {
  userId: string;
  username: string;
  role: "fan" | "artist";
  token: string;
}

interface AuthHook {
  session: Session | null;
  isLoading: boolean;
  login: (credentials: { username: string; password: string }) => Promise<void>;
  logout: () => void;
}

// Simple in-memory session store (replace with SecureStore/AsyncStorage in production)
const memoryStore = new Map<string, string>();

function saveSession(s: Session) {
  memoryStore.set(SESSION_KEY, JSON.stringify(s));
}

function loadSession(): Session | null {
  const raw = memoryStore.get(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

function clearSession() {
  memoryStore.delete(SESSION_KEY);
}

// Seed users for demo purposes
const SEED_USERS: Array<Session & { password: string }> = [
  { userId: "u-001", username: "ada", password: "pass123", role: "fan", token: "tok-ada" },
  { userId: "u-002", username: "nova", password: "pass123", role: "artist", token: "tok-nova" }
];

export function useAuth(): AuthHook {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = loadSession();
    setSession(stored);
    setIsLoading(false);
  }, []);

  async function login(credentials: { username: string; password: string }) {
    const match = SEED_USERS.find(
      (u) => u.username === credentials.username && u.password === credentials.password
    );
    if (!match) throw new Error("Invalid username or password");

    const { password: _, ...sessionData } = match;
    saveSession(sessionData);
    setSession(sessionData);
  }

  function logout() {
    clearSession();
    setSession(null);
  }

  return { session, isLoading, login, logout };
}
