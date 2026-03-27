"use server";

import { redirect } from "next/navigation";
import { saveTipIntent } from "../../../lib/tip-intent";

export async function createTipIntent(formData: FormData) {
  const artistSlug = String(formData.get("artistSlug") ?? "").trim();

  saveTipIntent({
    artistSlug,
    amount: String(formData.get("amount") ?? "").trim(),
    asset: String(formData.get("asset") ?? "XLM").trim() as "XLM" | "USDC",
    note: String(formData.get("note") ?? "").trim(),
    status: "draft"
  });

  redirect(`/sessions/${artistSlug}?intent=1`);
}
