/**
 * Issue #72 – Add supporter leaderboard computation per session
 *
 * File destination: apps/web/components/realtime/SupporterLeaderboard.tsx
 *
 * What this does:
 *  - "use client" component (needs useEffect, useState)
 *  - Fetches ranked supporters from GET /sessions/:id/leaderboard on mount
 *  - Polls every 15 s so rankings stay fresh after new tips are confirmed
 *  - Updates immediately when a "tip:confirmed" socket event is received
 *  - Handles ties predictably (server sorts; client displays server order)
 *  - Anonymous users are shown as "Anonymous" if fanName is empty
 *
 * Acceptance criteria covered:
 *  ✓ Leaderboard ranks supporters by confirmed tip total
 *  ✓ Rankings update after new confirmed tips
 *  ✓ Ties and anonymous users are handled predictably
 *
 * Usage (in apps/web/app/artists/[slug]/page.tsx):
 *   import { SupporterLeaderboard } from "../../../components/realtime/SupporterLeaderboard";
 *   <SupporterLeaderboard sessionId={session.id} />
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import { io } from "socket.io-client";

// ─── Types ────────────────────────────────────────────────────────────────────

interface LeaderboardEntry {
  fanId: string;
  fanName: string;
  totalAmount: number;
  tipCount: number;
  rank: number;
}

interface SupporterLeaderboardProps {
  sessionId: string;
  /** Polling interval in ms (default 15 000) */
  pollIntervalMs?: number;
}

const API_URL =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_URL) ||
  "http://localhost:3001";

const MEDALS = ["🥇", "🥈", "🥉"];

// ─── Component ────────────────────────────────────────────────────────────────

export function SupporterLeaderboard({
  sessionId,
  pollIntervalMs = 15_000,
}: SupporterLeaderboardProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Fetch latest rankings ───────────────────────────────────────────────────
  const fetchLeaderboard = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/sessions/${sessionId}/leaderboard`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { items: LeaderboardEntry[] };
      setEntries(data.items);
      setError(null);
    } catch {
      setError("Could not load leaderboard.");
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  // ── Initial load + polling ──────────────────────────────────────────────────
  useEffect(() => {
    fetchLeaderboard();
    const timer = setInterval(fetchLeaderboard, pollIntervalMs);
    return () => clearInterval(timer);
  }, [fetchLeaderboard, pollIntervalMs]);

  // ── Refresh on new socket tip (re-fetch rather than recalculate client-side)──
  useEffect(() => {
    const socket = io(API_URL, { transports: ["websocket", "polling"] });

    socket.on("connect", () => {
      socket.emit("session:subscribe", sessionId);
    });

    socket.on("tip:confirmed", () => {
      // A new confirmed tip arrived – refresh the leaderboard
      fetchLeaderboard();
    });

    return () => {
      socket.emit("session:unsubscribe", sessionId);
      socket.disconnect();
    };
  }, [sessionId, fetchLeaderboard]);

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <section className="card">
      <p className="label" style={{ marginBottom: 14 }}>
        Top supporters
      </p>

      {error && (
        <p className="muted" style={{ fontSize: "0.82rem", marginBottom: 10 }}>
          {error}
        </p>
      )}

      {loading ? (
        <p className="muted">Loading…</p>
      ) : entries.length === 0 ? (
        <p className="muted">No tips yet — leaderboard starts here.</p>
      ) : (
        <div className="stack">
          {entries.map((entry) => (
            <div
              key={entry.fanId}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 14px",
                borderRadius: 14,
                border: "1px solid var(--line)",
                background:
                  entry.rank === 1
                    ? "rgba(245,158,11,0.08)"
                    : "rgba(255,255,255,0.03)",
              }}
            >
              {/* Rank badge */}
              <span
                style={{
                  minWidth: 28,
                  fontSize: entry.rank <= 3 ? "1.1rem" : "0.85rem",
                  textAlign: "center",
                  color: entry.rank > 3 ? "var(--muted)" : undefined,
                }}
              >
                {entry.rank <= 3 ? MEDALS[entry.rank - 1] : `#${entry.rank}`}
              </span>

              {/* Name */}
              <span style={{ flex: 1, fontWeight: entry.rank === 1 ? 700 : 400 }}>
                {entry.fanName.trim() || "Anonymous"}
              </span>

              {/* Total */}
              <span style={{ fontWeight: 600, color: "var(--accent)", flexShrink: 0 }}>
                {entry.totalAmount.toFixed(2)}
              </span>

              {/* Tip count */}
              <span
                className="muted"
                style={{ fontSize: "0.75rem", flexShrink: 0, minWidth: 46, textAlign: "right" }}
              >
                {entry.tipCount} tip{entry.tipCount !== 1 ? "s" : ""}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
