export interface SessionDetail {
  slug: string;
  artistName: string;
  title: string;
  city: string;
  description: string;
  streamStatus: "live" | "ended";
  walletAsset: "XLM" | "USDC";
}

const sessions: SessionDetail[] = [
  {
    slug: "nova-chords",
    artistName: "Nova Chords",
    title: "Rooftop Rehearsal",
    city: "Lagos",
    description: "Live loop set with audience callouts and a direct tip prompt between sections.",
    streamStatus: "live",
    walletAsset: "XLM"
  },
  {
    slug: "street-tempo",
    artistName: "Street Tempo",
    title: "Percussion & Brass Jam",
    city: "Accra",
    description: "Layered percussion and brass improvisation with fan shout-outs.",
    streamStatus: "ended",
    walletAsset: "USDC"
  }
];

export function getSessionDetail(slug: string) {
  return sessions.find((session) => session.slug === slug) ?? null;
}
