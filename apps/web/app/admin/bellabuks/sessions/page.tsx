// #115 – Admin session operations page
import { AdminShell } from "../../../../components/layout/admin-shell";
import { Card } from "../../../../components/ui/card";
import { requireAdmin } from "../../../../lib/admin-auth";

type SessionStatus = "DRAFT" | "LIVE" | "ENDED" | "CANCELLED";

interface SessionRow {
  id: string;
  title: string;
  artist: string;
  status: SessionStatus;
  totalTips: number;
  totalAmount: string;
  scheduledFor: string;
}

const SEED_SESSIONS: SessionRow[] = [
  { id: "s1", title: "Friday Night Vibes", artist: "Nova Chords", status: "LIVE", totalTips: 18, totalAmount: "420.00 XLM", scheduledFor: "2026-03-29" },
  { id: "s2", title: "Deep Bass Session", artist: "Bass Theory", status: "ENDED", totalTips: 11, totalAmount: "310.50 XLM", scheduledFor: "2026-03-28" },
  { id: "s3", title: "Sunset Acoustic", artist: "Echo Drift", status: "DRAFT", totalTips: 0, totalAmount: "0 XLM", scheduledFor: "2026-04-01" },
  { id: "s4", title: "Late Night Chords", artist: "Nova Chords", status: "CANCELLED", totalTips: 0, totalAmount: "0 XLM", scheduledFor: "2026-03-27" }
];

const statusChip: Record<SessionStatus, string> = {
  LIVE: "chip chip--success",
  ENDED: "chip",
  DRAFT: "chip",
  CANCELLED: "chip chip--danger"
};

export default function AdminSessionsPage() {
  requireAdmin();

  const live = SEED_SESSIONS.filter((s) => s.status === "LIVE").length;
  const ended = SEED_SESSIONS.filter((s) => s.status === "ENDED").length;
  const draft = SEED_SESSIONS.filter((s) => s.status === "DRAFT").length;

  return (
    <AdminShell
      title="Session operations"
      subtitle="Monitor and manage all artist sessions across the platform."
    >
      <div className="grid grid--3">
        <Card title="Live now">
          <p>{live}</p>
        </Card>
        <Card title="Ended">
          <p>{ended}</p>
        </Card>
        <Card title="Drafts">
          <p>{draft}</p>
        </Card>
      </div>

      <Card title="All sessions">
        {SEED_SESSIONS.map((s) => (
          <div
            key={s.id}
            style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #2e2b3a" }}
          >
            <div>
              <p style={{ margin: 0, color: "#f4f0ff", fontSize: "0.9rem", fontWeight: 600 }}>{s.title}</p>
              <p className="muted" style={{ margin: 0, fontSize: "0.8rem" }}>{s.artist} · {s.scheduledFor}</p>
            </div>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <span className="chip">{s.totalTips} tips</span>
              <span className="chip">{s.totalAmount}</span>
              <span className={statusChip[s.status]}>{s.status}</span>
            </div>
          </div>
        ))}
      </Card>
    </AdminShell>
  );
}
