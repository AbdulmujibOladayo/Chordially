import { notFound } from "next/navigation";
import { Shell } from "../../../components/layout/shell";
import { Card } from "../../../components/ui/card";
import { StreamPlayer } from "../../../components/StreamPlayer";
import { listDiscoverySessions } from "../../../lib/discovery";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SocialLinks {
  instagram?: string;
  twitter?: string;
  youtube?: string;
  website?: string;
}

interface ArtistMedia {
  profileImageUrl?: string;
  bannerUrl?: string;
  genreTags: string[];
  socialLinks: SocialLinks;
  introClipUrl?: string;
}

interface StreamData {
  provider: "youtube" | "twitch" | "custom" | "none";
  embedUrl?: string | null;
}

// ─── Data fetchers ────────────────────────────────────────────────────────────

async function fetchArtistMedia(slug: string): Promise<ArtistMedia> {
  try {
    const res = await fetch(`http://localhost:3001/artists/${encodeURIComponent(slug)}/media`, {
      cache: "no-store",
    });
    if (!res.ok) return { genreTags: [], socialLinks: {} };
    return res.json();
  } catch {
    return { genreTags: [], socialLinks: {} };
  }
}

async function fetchStreamData(sessionId: string): Promise<StreamData> {
  try {
    const res = await fetch(`http://localhost:3001/sessions/${encodeURIComponent(sessionId)}/stream`, {
      cache: "no-store",
    });
    if (!res.ok) return { provider: "none" };
    return res.json();
  } catch {
    // Demo fallback – show a YouTube embed for sess-1
    if (sessionId === "sess-1") {
      return { provider: "youtube", embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ" };
    }
    if (sessionId === "sess-2") {
      return { provider: "twitch", embedUrl: "https://player.twitch.tv/?channel=streettempo&parent=localhost" };
    }
    return { provider: "none" };
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ArtistDetailPage({
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

  const [media, streamData] = await Promise.all([
    fetchArtistMedia(params.slug),
    fetchStreamData(session.id),
  ]);

  return (
    <Shell
      title={session.artistName}
      subtitle={session.isLive ? "Live now." : "Coming up."}
    >
      {/* Banner */}
      {media.bannerUrl ? (
        <div
          style={{
            width: "100%",
            height: 160,
            backgroundImage: `url(${media.bannerUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            borderRadius: 8,
            marginBottom: "1rem",
          }}
        />
      ) : null}

      {/* Artist header */}
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
        {media.profileImageUrl ? (
          <img
            src={media.profileImageUrl}
            alt={session.artistName}
            style={{ width: 72, height: 72, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
          />
        ) : null}
        <div>
          <h2 style={{ margin: 0 }}>{session.artistName}</h2>
          <div style={{ marginTop: "0.25rem" }}>
            <span className="chip">{session.city}</span>
            {(media.genreTags.length > 0 ? media.genreTags : session.genres).map((genre) => (
              <span className="chip" key={genre}>{genre}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Stream player */}
      <Card title={session.isLive ? "Live stream" : "Stream preview"}>
        <StreamPlayer
          provider={streamData.provider}
          embedUrl={streamData.embedUrl}
          isLive={session.isLive}
        />
      </Card>

      {/* Session info + social links */}
      <Card title={session.title}>
        <p className="muted">
          {session.isLive
            ? "This artist is live now."
            : `Starts: ${new Date(session.startsAt).toLocaleString()}`}
        </p>
        {Object.values(media.socialLinks).some(Boolean) ? (
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
            {media.socialLinks.instagram ? (
              <a className="button button--secondary" href={media.socialLinks.instagram} target="_blank" rel="noopener noreferrer">Instagram</a>
            ) : null}
            {media.socialLinks.twitter ? (
              <a className="button button--secondary" href={media.socialLinks.twitter} target="_blank" rel="noopener noreferrer">Twitter</a>
            ) : null}
            {media.socialLinks.youtube ? (
              <a className="button button--secondary" href={media.socialLinks.youtube} target="_blank" rel="noopener noreferrer">YouTube</a>
            ) : null}
            {media.socialLinks.website ? (
              <a className="button button--secondary" href={media.socialLinks.website} target="_blank" rel="noopener noreferrer">Website</a>
            ) : null}
          </div>
        ) : null}
      </Card>

      {/* Intro clip (when no live stream) */}
      {!session.isLive && media.introClipUrl ? (
        <Card title="Intro clip">
          <iframe
            src={media.introClipUrl}
            style={{ width: "100%", aspectRatio: "16/9", border: "none", borderRadius: 4 }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </Card>
      ) : null}
    </Shell>
  );
}