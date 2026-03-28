export function getAdminSummary() {
  return {
    totalUsers: 142,
    totalArtists: 27,
    activeSessions: 6,
    recentTips: 34,
    recentUsers: [
      { name: "Ada Listener", role: "fan", status: "active" },
      { name: "Nova Chords", role: "artist", status: "live" },
      { name: "Ops Lead", role: "admin", status: "online" }
    ]
  };
}
