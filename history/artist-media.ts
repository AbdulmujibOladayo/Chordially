/**
 * Issue #76 – Implement artist media/profile enrichment
 *
 * File destination: apps/web/app/artist/media/actions.ts
 */

"use server";

import { redirect } from "next/navigation";
import { setArtistMedia } from "../../../lib/artist-media";

function isSafeUrl(value: string | undefined): boolean {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export async function saveArtistMedia(formData: FormData) {
  const profileImageUrl = String(formData.get("profileImageUrl") ?? "").trim() || undefined;
  const bannerUrl = String(formData.get("bannerUrl") ?? "").trim() || undefined;
  const introClipUrl = String(formData.get("introClipUrl") ?? "").trim() || undefined;
  const instagram = String(formData.get("instagram") ?? "").trim() || undefined;
  const twitter = String(formData.get("twitter") ?? "").trim() || undefined;
  const youtube = String(formData.get("youtube") ?? "").trim() || undefined;
  const website = String(formData.get("website") ?? "").trim() || undefined;

  const rawTags = String(formData.get("genreTags") ?? "").trim();
  const genreTags = rawTags
    ? rawTags.split(",").map((t) => t.trim()).filter(Boolean).slice(0, 5)
    : [];

  // Reject malformed URLs before saving
  const urlsToCheck = [profileImageUrl, bannerUrl, introClipUrl, instagram, twitter, youtube, website];
  for (const url of urlsToCheck) {
    if (!isSafeUrl(url)) {
      redirect("/artist/media?error=invalid_url");
    }
  }

  setArtistMedia({
    profileImageUrl,
    bannerUrl,
    genreTags,
    socialLinks: { instagram, twitter, youtube, website },
    introClipUrl,
  });

  redirect("/artist/media?saved=1");
}
