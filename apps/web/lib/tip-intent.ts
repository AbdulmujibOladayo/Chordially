import { cookies } from "next/headers";

export interface TipIntent {
  artistSlug: string;
  amount: string;
  asset: "XLM" | "USDC";
  note: string;
  status: "draft";
}

const cookieName = "chordially_tip_intent";

export function saveTipIntent(intent: TipIntent) {
  cookies().set(cookieName, JSON.stringify(intent), {
    httpOnly: true,
    sameSite: "lax",
    path: "/"
  });
}

export function getTipIntent() {
  const raw = cookies().get(cookieName)?.value;

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as TipIntent;
  } catch {
    return null;
  }
}
