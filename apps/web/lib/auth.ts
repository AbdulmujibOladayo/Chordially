import { cookies } from "next/headers";

export type AppRole = "fan" | "artist" | "admin";

export interface SessionUser {
  id: string;
  name: string;
  role: AppRole;
}

const demoUsers: Record<AppRole, SessionUser> = {
  fan: { id: "fan-1", name: "Ada Listener", role: "fan" },
  artist: { id: "artist-1", name: "Nova Chords", role: "artist" },
  admin: { id: "admin-1", name: "Ops Lead", role: "admin" }
};

export function getDemoUser(role: AppRole) {
  return demoUsers[role];
}

export function getSessionUser(): SessionUser | null {
  const role = cookies().get("chordially_role")?.value as AppRole | undefined;

  if (!role || !(role in demoUsers)) {
    return null;
  }

  return demoUsers[role];
}
