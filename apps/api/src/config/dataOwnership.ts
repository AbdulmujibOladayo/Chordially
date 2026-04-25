/**
 * CHORD-015 — Data Ownership Boundaries
 * Defines which store is the authoritative source of truth for each data class.
 */

export type DataStore = "mongodb" | "redis" | "blockchain";

export interface OwnershipRule {
  entity: string;
  owner: DataStore;
  /** Stores that may hold a derived/cached copy — never written to directly. */
  caches: DataStore[];
  ttlSeconds?: number;
}

export const DATA_OWNERSHIP: OwnershipRule[] = [
  { entity: "UserProfile",      owner: "mongodb",     caches: ["redis"],       ttlSeconds: 300 },
  { entity: "ArtistBalance",    owner: "blockchain",  caches: ["redis"],       ttlSeconds: 30  },
  { entity: "SessionState",     owner: "redis",       caches: [],              ttlSeconds: 3600 },
  { entity: "TipTransaction",   owner: "blockchain",  caches: ["mongodb"],                      },
  { entity: "Leaderboard",      owner: "redis",       caches: [],              ttlSeconds: 60  },
  { entity: "BackstagePassNFT", owner: "blockchain",  caches: ["mongodb"],                      },
  { entity: "AuditLog",         owner: "mongodb",     caches: [],                               },
];

/** Returns the authoritative store for a given entity name. */
export function getOwner(entity: string): DataStore {
  const rule = DATA_OWNERSHIP.find((r) => r.entity === entity);
  if (!rule) throw new Error(`No ownership rule defined for entity: ${entity}`);
  return rule.owner;
}

/** Returns true if the given store is allowed to serve reads for an entity. */
export function canRead(entity: string, store: DataStore): boolean {
  const rule = DATA_OWNERSHIP.find((r) => r.entity === entity);
  if (!rule) return false;
  return rule.owner === store || rule.caches.includes(store);
}
