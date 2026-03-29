/**
 * Issue #71 – Build the live tip feed component on web session pages
 *
 * File destination: apps/web/app/artists/[slug]/page.tsx  (replaces existing)
 *
 * Change summary:
 *  - Imports and renders <LiveTipFeed sessionId={session.id} /> for live sessions
 *  - Imports and renders <SupporterLeaderboard sessionId={session.id} /> (issue #72)
 *  - All existing discovery/shell logic preserved
 */

import { notFound } from "next/navigation";
import { Shell } from "../../../components/layout/shell";
import { Card } from "../../../components/ui/card";
import { listDiscoverySessions } from "../../../lib/discovery";
import { LiveTipFeed } from "../../../components/realtime/LiveTipFeed";
import { SupporterLeaderboard } from "../../../components/realtime/SupporterLeaderboard";

export default function ArtistDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const session = listDiscoverySessions({ status: "live", limit: 100 }).items
    .concat(listDiscoverySessions({ status: "upcoming", limit: 100 }).items)
    .find((item) => item.slug === params.slug);

  if (!session) {
    notFound();
  }

  return (
    <Shell
      title={session.artistName}
      subtitle="A lightweight destination page that discovery cards can safely link to today."
    >
      <Card title={session.title}>
        <div>
          <span className="chip">{session.city}</span>
          {session.genres.map((genre) => (
            <span className="chip" key={genre}>
              {genre}
            </span>
          ))}
        </div>
        <p className="muted">
          {session.isLive ? "This artist is live now." : "This artist has an upcoming set."}
        </p>
      </Card>

      {/* Real-time panels – only shown for live sessions */}
      {session.isLive && (
        <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 18, marginTop: 18 }}>
          <LiveTipFeed sessionId={session.id} />
          <SupporterLeaderboard sessionId={session.id} />
        </div>
      )}
    </Shell>
  );
}
