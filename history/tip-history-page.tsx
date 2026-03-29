/**
 * Issue #73 – Add fan tip history and receipt page
 *
 * File destination: apps/web/app/tips/history/page.tsx
 *
 * What this does:
 *  - Server Component – guards to fan role via requireRole()
 *  - Fetches tip history from GET /tips/history (falls back to demo data
 *    if the API is unreachable so the page is always renderable)
 *  - Supports ?status= and ?from= / ?to= query-string filters
 *  - Shows each tip as a receipt card: artist, session, amount, status, date
 *  - CONFIRMED and FAILED tips are visually distinct
 *  - Links back to the artist's session context (/artists/:slug)
 *
 * Acceptance criteria covered:
 *  ✓ Fans can view past tips
 *  ✓ Confirmed and failed transactions are visibly distinct
 *  ✓ Receipt details link back to the artist/session context
 */

import Link from "next/link";
import { Shell } from "../../../components/layout/shell";
import { Card } from "../../../components/ui/card";
import { requireRole } from "../../../lib/guards";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TipItem {
  id: string;
  artistName: string;
  artistSlug: string;
  sessionTitle: string;
  amount: number;
  assetCode: string;
  status: "CONFIRMED" | "FAILED" | "PENDING" | "DRAFT";
  txHash?: string;
  note?: string;
  createdAt: string;
  confirmedAt?: string;
}

// ─── Demo fallback (matches tip.store.ts seed – fan-1 = Ada Listener) ─────────

const DEMO_TIPS: TipItem[] = [
  {
    id: "tip-1",
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
    artistName: "Nova Chords",
    artistSlug: "nova-chords",
    sessionTitle: "Rooftop Rehearsal",
    amount: 2.5,
    assetCode: "XLM",
    status: "FAILED",
    createdAt: "2026-03-27T18:45:00.000Z",
  },
];

// ─── Data fetching ────────────────────────────────────────────────────────────

async function fetchTipHistory(
  fanId: string,
  filters: { status?: string; from?: string; to?: string }
): Promise<TipItem[]> {
  const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);

  try {
    const res = await fetch(`${API_URL}/tips/history?${params}`, {
      headers: { "x-demo-fan-id": fanId }, // demo auth header until JWT is wired
      cache: "no-store",
    });
    if (!res.ok) return DEMO_TIPS;
    const data = (await res.json()) as { items: TipItem[] };
    return data.items;
  } catch {
    return DEMO_TIPS;
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusLabel(status: TipItem["status"]) {
  return status === "CONFIRMED"
    ? "Confirmed"
    : status === "FAILED"
    ? "Failed"
    : status === "PENDING"
    ? "Pending"
    : "Draft";
}

function statusStyle(status: TipItem["status"]): React.CSSProperties {
  if (status === "CONFIRMED") return { color: "#4ade80" };
  if (status === "FAILED") return { color: "#f87171" };
  return { color: "var(--muted)" };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function TipHistoryPage({
  searchParams,
}: {
  searchParams: { status?: string; from?: string; to?: string };
}) {
  const user = requireRole(["fan"]);
  const tips = await fetchTipHistory(user.id, searchParams);

  const totalConfirmed = tips
    .filter((t) => t.status === "CONFIRMED")
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <Shell
      title="Tip history"
      subtitle="A record of every tip you have sent. Confirmed tips are settled on the Stellar network."
    >
      {/* ── Filter bar ── */}
      <Card title="Filter">
        <form method="GET" className="nav">
          <select name="status" className="input" style={{ width: "auto" }} defaultValue={searchParams.status ?? ""}>
            <option value="">All statuses</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="FAILED">Failed</option>
            <option value="PENDING">Pending</option>
          </select>
          <input
            className="input"
            style={{ width: "auto" }}
            type="date"
            name="from"
            defaultValue={searchParams.from ?? ""}
            placeholder="From"
          />
          <input
            className="input"
            style={{ width: "auto" }}
            type="date"
            name="to"
            defaultValue={searchParams.to ?? ""}
            placeholder="To"
          />
          <button className="button button--secondary" type="submit">
            Apply
          </button>
          <Link href="/tips/history" className="button button--secondary">
            Clear
          </Link>
        </form>
      </Card>

      {/* ── Summary ── */}
      <Card title="Summary">
        <p className="muted">
          {tips.length} tip{tips.length !== 1 ? "s" : ""} found
          {" · "}
          <strong style={{ color: "var(--ink)" }}>
            {totalConfirmed.toFixed(2)} total confirmed
          </strong>
        </p>
      </Card>

      {/* ── Tip list ── */}
      {tips.length === 0 ? (
        <Card title="No tips yet">
          <p className="muted">You have not sent any tips matching this filter.</p>
        </Card>
      ) : (
        <div className="stack">
          {tips.map((tip) => (
            <div
              key={tip.id}
              className="card"
              style={{
                borderLeft: `3px solid ${
                  tip.status === "CONFIRMED"
                    ? "#4ade80"
                    : tip.status === "FAILED"
                    ? "#f87171"
                    : "var(--line)"
                }`,
              }}
            >
              {/* Row 1: artist + amount */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                <div>
                  <p className="label" style={{ marginBottom: 4 }}>
                    <Link href={`/artists/${tip.artistSlug}`} style={{ color: "var(--accent)" }}>
                      {tip.artistName}
                    </Link>
                  </p>
                  <p className="muted" style={{ margin: 0, fontSize: "0.9rem" }}>
                    {tip.sessionTitle}
                  </p>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: "1.1rem" }}>
                    {tip.amount} {tip.assetCode}
                  </p>
                  <p style={{ margin: 0, fontSize: "0.8rem", ...statusStyle(tip.status) }}>
                    {statusLabel(tip.status)}
                  </p>
                </div>
              </div>

              {/* Row 2: note */}
              {tip.note && (
                <p className="muted" style={{ margin: "8px 0 0", fontSize: "0.85rem" }}>
                  &ldquo;{tip.note}&rdquo;
                </p>
              )}

              {/* Row 3: dates + tx hash */}
              <div style={{ marginTop: 10, fontSize: "0.78rem", color: "var(--muted)" }}>
                <span>Sent {formatDate(tip.createdAt)}</span>
                {tip.confirmedAt && (
                  <span> · Confirmed {formatDate(tip.confirmedAt)}</span>
                )}
                {tip.txHash && (
                  <span> · Tx: <code style={{ fontSize: "inherit" }}>{tip.txHash.slice(0, 12)}…</code></span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Shell>
  );
}
