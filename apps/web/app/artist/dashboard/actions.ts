"use server";

import { redirect } from "next/navigation";
import { getSessionDraft, saveSessionDraft } from "../../../lib/session-store";

export async function saveSession(formData: FormData) {
  const current = getSessionDraft();

  saveSessionDraft({
    ...current,
    title: String(formData.get("title") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    streamUrl: String(formData.get("streamUrl") ?? "").trim()
  });

  redirect("/artist/dashboard?saved=1");
}

export async function startSession() {
  const current = getSessionDraft();

  saveSessionDraft({
    ...current,
    status: "live",
    startedAt: new Date().toISOString(),
    endedAt: null
  });

  redirect("/artist/dashboard?started=1");
}

export async function endSession() {
  const current = getSessionDraft();

  saveSessionDraft({
    ...current,
    status: "ended",
    endedAt: new Date().toISOString()
  });

  redirect("/artist/dashboard?ended=1");
}
