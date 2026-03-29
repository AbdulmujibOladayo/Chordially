/**
 * Issue #73 – Add fan tip history and receipt page
 *
 * File destination: apps/api/src/modules/tips/tip.store.ts
 *
 * What this does:
 *  - In-memory tip store (mirrors Prisma Tip model structure)
 *  - Pre-seeded with demo tips that match the existing mock sessions
 *  - Exports query helpers used by tip.routes.ts
 */

import crypto from "node:crypto";

// ─── Types ────────────────────────────────────────────────────────────────────

export type TipStatus = "DRAFT" | "PENDING" | "CONFIRMED" | "FAILED";
export type TipAssetCode = "XLM" | "USDC";

export interface StoredTip {
  id: string;
  fanId: string;
  fanName: string;
  sessionId: string;
  artistName: string;
  artistSlug: string;
  sessionTitle: string;
  amount: number;
  assetCode: TipAssetCode;
  status: TipStatus;
  txHash?: string;
  note?: string;
  createdAt: string;
  confirmedAt?: string;
}

// ─── In-memory store ──────────────────────────────────────────────────────────

const tips = new Map<string, StoredTip>();

// ─── Seed data (mirrors prisma/seed.ts sessions and users) ───────────────────

function seed() {
  const seedTips: StoredTip[] = [
    {
      id: "tip-1",
      fanId: "fan-1",
      fanName: "Ada Listener",
      sessionId: "sess-1",
      artistName: "Nova Chords",
      artistSlug: "nova-chords",
      sessionTitle: "Rooftop Rehearsal",
      amount: 10,
      assetCode: "XLM",
      status: "CONFIRMED",
      txHash: "abc123def456",
      note: "Keep it up!",
      createdAt: "2026-03-27T18:05:00.000Z",
      confirmedAt: "2026-03-27T18:05:12.000Z",
    },
    {
      id: "tip-2",
      fanId: "fan-1",
      fanName: "Ada Listener",
      sessionId: "sess-2",
      artistName: "Street Tempo",
      artistSlug: "street-tempo",
      sessionTitle: "Percussion & Brass Jam",
      amount: 5,
      assetCode: "USDC",
      status: "CONFIRMED",
      txHash: "789xyz000abc",
      createdAt: "2026-03-27T18:32:00.000Z",
      confirmedAt: "2026-03-27T18:32:09.000Z",
    },
    {
      id: "tip-3",
      fanId: "fan-1",
      fanName: "Ada Listener",
      sessionId: "sess-1",
      artistName: "Nova Chords",
      artistSlug: "nova-chords",
      sessionTitle: "Rooftop Rehearsal",
      amount: 2.5,
      assetCode: "XLM",
      status: "FAILED",
      createdAt: "2026-03-27T18:45:00.000Z",
    },
    {
      id: "tip-4",
      fanId: "fan-2",
      fanName: "Kwame Beats",
      sessionId: "sess-1",
      artistName: "Nova Chords",
      artistSlug: "nova-chords",
      sessionTitle: "Rooftop Rehearsal",
      amount: 20,
      assetCode: "XLM",
      status: "CONFIRMED",
      txHash: "deadbeef1234",
      note: "Love the vibe from Accra!",
      createdAt: "2026-03-27T18:10:00.000Z",
      confirmedAt: "2026-03-27T18:10:08.000Z",
    },
    {
      id: "tip-5",
      fanId: "fan-3",
      fanName: "Zara M.",
      sessionId: "sess-1",
      artistName: "Nova Chords",
      artistSlug: "nova-chords",
      sessionTitle: "Rooftop Rehearsal",
      amount: 15,
      assetCode: "XLM",
      status: "CONFIRMED",
      txHash: "cafe9876babe",
      createdAt: "2026-03-27T18:15:00.000Z",
      confirmedAt: "2026-03-27T18:15:05.000Z",
    },
    {
      id: "tip-6",
      fanId: "fan-2",
      fanName: "Kwame Beats",
      sessionId: "sess-2",
      artistName: "Street Tempo",
      artistSlug: "street-tempo",
      sessionTitle: "Percussion & Brass Jam",
      amount: 8,
      assetCode: "USDC",
      status: "CONFIRMED",
      txHash: "1111aaaa2222",
      createdAt: "2026-03-27T18:35:00.000Z",
      confirmedAt: "2026-03-27T18:35:11.000Z",
    },
  ];

  for (const tip of seedTips) {
    tips.set(tip.id, tip);
  }
}

seed();

// ─── Query helpers ────────────────────────────────────────────────────────────

/** All confirmed tips for a session, newest first – used by the live feed */
export function getTipsBySession(sessionId: string): StoredTip[] {
  return [...tips.values()]
    .filter((t) => t.sessionId === sessionId && t.status === "CONFIRMED")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export interface TipHistoryQuery {
  fanId: string;
  status?: TipStatus;
  from?: string; // ISO date
  to?: string;   // ISO date
}

/** All tips for a specific fan, newest first – used by the history page */
export function getTipHistoryByFan(query: TipHistoryQuery): StoredTip[] {
  return [...tips.values()]
    .filter((t) => {
      if (t.fanId !== query.fanId) return false;
      if (query.status && t.status !== query.status) return false;
      if (query.from && t.createdAt < query.from) return false;
      if (query.to && t.createdAt > query.to) return false;
      return true;
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export interface LeaderboardEntry {
  fanId: string;
  fanName: string;
  totalAmount: number;
  tipCount: number;
  rank: number;
}

/**
 * Aggregate confirmed tips per fan for a session and return ranked entries.
 * Ties are broken by earliest first tip (consistent ordering).
 */
export function getLeaderboard(sessionId: string): LeaderboardEntry[] {
  const confirmed = [...tips.values()].filter(
    (t) => t.sessionId === sessionId && t.status === "CONFIRMED"
  );

  const byFan = new Map<string, { name: string; total: number; count: number; firstAt: string }>();

  for (const tip of confirmed) {
    const existing = byFan.get(tip.fanId);
    if (existing) {
      existing.total += tip.amount;
      existing.count += 1;
      if (tip.createdAt < existing.firstAt) existing.firstAt = tip.createdAt;
    } else {
      byFan.set(tip.fanId, {
        name: tip.fanName,
        total: tip.amount,
        count: 1,
        firstAt: tip.createdAt,
      });
    }
  }

  const sorted = [...byFan.entries()]
    .map(([fanId, data]) => ({ fanId, fanName: data.name, totalAmount: data.total, tipCount: data.count, firstAt: data.firstAt }))
    .sort((a, b) => b.totalAmount - a.totalAmount || a.firstAt.localeCompare(b.firstAt));

  return sorted.map((entry, i) => ({
    fanId: entry.fanId,
    fanName: entry.fanName,
    totalAmount: entry.totalAmount,
    tipCount: entry.tipCount,
    rank: i + 1,
  }));
}

/** Add a tip (called after Stellar transaction is submitted) */
export function createTip(input: Omit<StoredTip, "id" | "createdAt">): StoredTip {
  const tip: StoredTip = {
    ...input,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  tips.set(tip.id, tip);
  return tip;
}

/** Mark a tip as confirmed (called on Stellar webhook / polling) */
export function confirmTip(tipId: string, txHash: string): StoredTip | null {
  const tip = tips.get(tipId);
  if (!tip) return null;
  tip.status = "CONFIRMED";
  tip.txHash = txHash;
  tip.confirmedAt = new Date().toISOString();
  return tip;
}
