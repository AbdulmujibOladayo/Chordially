import type { CreatorProfileResponse } from "@chordially/shared"
import { apiFetch } from "./api-client"

export function getCreatorBySlug(
  slug: string
): Promise<CreatorProfileResponse> {
  return apiFetch<CreatorProfileResponse>(`/api/creators/${encodeURIComponent(slug)}`)
}
