/**
 * Issue #71 – Build the live tip feed component on web session pages
 *
 * File destination: apps/web/components/realtime/LiveTipFeed.tsx
 *
 * What this does:
 *  - "use client" component (needs useState, useEffect, socket.io-client)
 *  - On mount: loads recent confirmed tips via GET /sessions/:id/tips/feed
 *  - Connects to Socket.io and subscribes to the session room
 *  - Prepends new "tip:confirmed" events to the feed with a flash animation
 *  - Handles empty, loading, error, and reconnect states
 *  - Scoped strictly to the given sessionId prop
 *
 * Acceptance criteria covered:
 *  ✓ New confirmed tips appear without page refresh
 *  ✓ Feed is limited/scoped to the current session
 *  ✓ Empty and reconnect states are handled
 *
 * Usage (in apps/web/app/artists/[slug]/page.tsx):
 *   import { LiveTipFeed } from "../../../components/realtime/LiveTipFeed";
 *   <LiveTipFeed sessionId={session.id} />
 */

"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TipFeedItem {
  id: string;
  fanName: string;
  amount: number;
  assetCode: string;
  note?: string;
  confirmedAt: string;
  isNew?: boolean; // transient – used only for animation
}

interface LiveTipFeedProps {
  sessionId: string;
  /** Max items visible in the feed (default 20) */
  limit?: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

const API_URL =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_URL) ||
  "http://localhost:3001";

// ─── Component ────────────────────────────────────────────────────────────────

export function LiveTipFeed({ sessionId, limit = 20 }: LiveTipFeedProps) {
  const [tips, setTips] = useState<TipFeedItem[]>([]);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  // ── Initial load ────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function loadFeed() {
      try {
        const res = await fetch(
          `${API_URL}/sessions/${sessionId}/tips/feed?limit=${limit}`,
          { cache: "no-store" }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as { items: TipFeedItem[] };
        if (!cancelled) setTips(data.items);
      } catch (err) {
        if (!cancelled) setError("Could not load recent tips.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadFeed();
    return () => { cancelled = true; };
  }, [sessionId, limit]);

  // ── Socket.io subscription ──────────────────────────────────────────────────
  useEffect(() => {
    const socket = io(API_URL, { transports: ["websocket", "polling"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      setError(null);
      socket.emit("session:subscribe", sessionId);
    });

    socket.on("disconnect", () => {
      setConnected(false);
    });

    socket.on("connect_error", () => {
      setConnected(false);
      setError("Real-time connection unavailable — showing cached tips.");
    });

    socket.on("tip:confirmed", (tip: TipFeedItem) => {
      setTips((prev) => {
        // Deduplicate and prepend, capped at limit
        const deduped = prev.filter((t) => t.id !== tip.id);
        return [{ ...tip, isNew: true }, ...deduped].slice(0, limit);
      });

      // Remove animation flag after 1.5 s
      setTimeout(() => {
        setTips((prev) =>
          prev.map((t) => (t.id === tip.id ? { ...t, isNew: false } : t))
        );
      }, 1500);
    });

    return () => {
      socket.emit("session:unsubscribe", sessionId);
      socket.disconnect();
    };
  }, [sessionId, limit]);

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <section className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <p className="label" style={{ margin: 0 }}>Live tips</p>
        <span
          style={{
            fontSize: "0.72rem",
            padding: "2px 10px",
            borderRadius: 999,
            background: connected ? "rgba(74,222,128,0.15)" : "rgba(255,255,255,0.06)",
            color: connected ? "#4ade80" : "var(--muted)",
          }}
        >
          {connected ? "Live" : "Reconnecting…"}
        </span>
      </div>

      {error && (
        <p className="muted" style={{ fontSize: "0.82rem", marginBottom: 10 }}>
          {error}
        </p>
      )}

      {loading ? (
        <p className="muted">Loading…</p>
      ) : tips.length === 0 ? (
        <p className="muted">No tips yet — be the first to support!</p>
      ) : (
        <div className="stack">
          {tips.map((tip) => (
            <div
              key={tip.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "10px 14px",
                borderRadius: 14,
                border: "1px solid var(--line)",
                background: tip.isNew
                  ? "rgba(245,158,11,0.10)"
                  : "rgba(255,255,255,0.03)",
                transition: "background 0.6s ease",
              }}
            >
              <div>
                <span style={{ fontWeight: 600 }}>{tip.fanName}</span>
                {tip.note && (
                  <p className="muted" style={{ margin: "2px 0 0", fontSize: "0.8rem" }}>
                    &ldquo;{tip.note}&rdquo;
                  </p>
                )}
              </div>
              <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 12 }}>
                <span style={{ fontWeight: 700, color: "var(--accent)" }}>
                  {tip.amount} {tip.assetCode}
                </span>
                <p className="muted" style={{ margin: 0, fontSize: "0.72rem" }}>
                  {formatTime(tip.confirmedAt)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
