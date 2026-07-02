import type { CreatorProfileResponse } from "../types/creator.js"
import type { FanProfileResponse } from "../types/fan.js"

export interface ProfileCompletenessResult {
  score: number
  missingFields: string[]
}

interface WeightedField {
  key: string
  weight: number
  filled: boolean
}

function computeFromFields(fields: WeightedField[]): ProfileCompletenessResult {
  const totalWeight = fields.reduce((sum, f) => sum + f.weight, 0)
  const earnedWeight = fields
    .filter((f) => f.filled)
    .reduce((sum, f) => sum + f.weight, 0)

  const score = Math.round((earnedWeight / totalWeight) * 100)
  const missingFields = fields.filter((f) => !f.filled).map((f) => f.key)

  return { score, missingFields }
}

export const creatorFieldLabels: Record<string, string> = {
  displayName: "Display name",
  bio: "Bio",
  avatarUrl: "Profile photo",
  genre: "Genre",
  location: "Location",
}

export const fanFieldLabels: Record<string, string> = {
  displayName: "Display name",
  avatarUrl: "Profile photo",
  genrePrefs: "Genre preferences",
}

export function computeCreatorCompleteness(
  profile: CreatorProfileResponse
): ProfileCompletenessResult {
  const fields: WeightedField[] = [
    { key: "displayName", weight: 20, filled: !!profile.displayName },
    { key: "bio", weight: 30, filled: !!profile.bio },
    { key: "avatarUrl", weight: 25, filled: !!profile.avatarUrl },
    { key: "genre", weight: 15, filled: !!profile.genre },
    { key: "location", weight: 10, filled: !!profile.location },
  ]

  return computeFromFields(fields)
}

export function computeFanCompleteness(
  profile: FanProfileResponse
): ProfileCompletenessResult {
  const fields: WeightedField[] = [
    { key: "displayName", weight: 30, filled: !!profile.displayName },
    { key: "avatarUrl", weight: 40, filled: !!profile.avatarUrl },
    { key: "genrePrefs", weight: 30, filled: profile.genrePrefs.length > 0 },
  ]

  return computeFromFields(fields)
}
