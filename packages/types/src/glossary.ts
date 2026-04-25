/**
 * Chordially Domain Glossary — CHORD-014
 * Single source of truth for core terminology across product, engineering, and blockchain layers.
 */

/** A registered creator who can open live sessions and receive tips. */
export interface Artist {
  id: string;
  stellarPublicKey: string;
  displayName: string;
  genre: string[];
}

/** A registered supporter who can join sessions and send tips. */
export interface Fan {
  id: string;
  stellarPublicKey: string;
  username: string;
  backstagePasses: string[]; // NFT asset codes
}

/** A live-streaming event opened by an Artist. */
export interface Session {
  id: string;
  artistId: string;
  startedAt: Date;
  endedAt?: Date;
  status: "live" | "ended" | "scheduled";
}

/** A discrete highlight within a Session (e.g. a song, a speech). */
export interface Moment {
  id: string;
  sessionId: string;
  label: string;
  timestampMs: number;
}

/** A micro-payment sent by a Fan to an Artist during a Session. */
export interface Tip {
  id: string;
  sessionId: string;
  fanId: string;
  artistId: string;
  amountXLM: number;
  assetCode: "XLM" | "USDC";
  stellarTxHash: string;
  confirmedAt: Date;
}

/** Mapping of domain terms to their canonical type for runtime validation. */
export const DOMAIN_TERMS = ["Artist", "Fan", "Session", "Moment", "Tip"] as const;
export type DomainTerm = (typeof DOMAIN_TERMS)[number];
