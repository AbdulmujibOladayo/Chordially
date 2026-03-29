/**
 * Issue #76 – Implement artist media/profile enrichment
 *
 * File destination: apps/web/lib/artist-media.ts
 *
 * What this does:
 *  - Cookie-based persistence for artist media fields (demo layer)
 *  - Mirrors the ArtistMedia shape from the API store
 */

import { cookies } from "next/headers";

export interface SocialLinks {
  instagram?: string;
  twitter?: string;
  youtube?: string;
  website?: string;
}

export interface ArtistMediaDraft {
  profileImageUrl?: string;
  bannerUrl?: string;
  genreTags: string[];
  socialLinks: SocialLinks;
  introClipUrl?: string;
}

const cookieName = "chordially_artist_media";

const defaultMedia: ArtistMediaDraft = {
  genreTags: [],
  socialLinks: {},
};

export function getArtistMedia(): ArtistMediaDraft {
  const raw = cookies().get(cookieName)?.value;
  if (!raw) return defaultMedia;
  try {
    return JSON.parse(raw) as ArtistMediaDraft;
  } catch {
    return defaultMedia;
  }
}

export function setArtistMedia(media: ArtistMediaDraft) {
  cookies().set(cookieName, JSON.stringify(media), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
}
