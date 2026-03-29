import { cookies } from "next/headers";

export type SessionStatus = "draft" | "live" | "ended";

export interface SessionDraft {
  title: string;
  description: string;
  streamUrl: string;
  status: SessionStatus;
  startedAt: string | null;
  endedAt: string | null;
}

const cookieName = "chordially_artist_session";

const defaultSession: SessionDraft = {
  title: "Late Night Loop Session",
  description: "Warm-up sets, audience requests, and a direct tip prompt between songs.",
  streamUrl: "https://example.com/live/nova",
  status: "draft",
  startedAt: null,
  endedAt: null
};

export function getSessionDraft() {
  const raw = cookies().get(cookieName)?.value;

  if (!raw) {
    return defaultSession;
  }

  try {
    return JSON.parse(raw) as SessionDraft;
  } catch {
    return defaultSession;
  }
}

export function saveSessionDraft(session: SessionDraft) {
  cookies().set(cookieName, JSON.stringify(session), {
    httpOnly: true,
    sameSite: "lax",
    path: "/"
  });
}
