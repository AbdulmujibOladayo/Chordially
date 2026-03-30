// #114 – Admin web user management table with filters and detail drawer
import { AdminShell } from "../../../../components/layout/admin-shell";
import { requireAdmin } from "../../../../lib/admin-auth";

type UserRole = "FAN" | "ARTIST" | "ADMIN";
type UserStatus = "ACTIVE" | "SUSPENDED" | "DEACTIVATED";

interface UserRow {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  joinedAt: string;
}

const SEED_USERS: UserRow[] = [
  { id: "u1", username: "ada_listener", email: "ada@example.com", role: "FAN", status: "ACTIVE", joinedAt: "2026-01-12" },
  { id: "u2", username: "nova_chords", email: "nova@example.com", role: "ARTIST", status: "ACTIVE", joinedAt: "2026-01-18" },
  { id: "u3", username: "jay_beats", email: "jay@example.com", role: "FAN", status: "SUSPENDED", joinedAt: "2026-02-03" },
  { id: "u4", username: "ops_lead", email: "ops@example.com", role: "ADMIN", status: "ACTIVE", joinedAt: "2026-01-05" },
  { id: "u5", username: "echo_drift", email: "echo@example.com", role: "ARTIST", status: "DEACTIVATED", joinedAt: "2026-02-20" }
];

const statusChip: Record<UserStatus, string> = {
  ACTIVE: "chip chip--success",
  SUSPENDED: "chip chip--warning",
  DEACTIVATED: "chip chip--danger"
};

export default function AdminUsersPage() {
  requireAdmin();

  return (
    <AdminShell
      title="User management"
      subtitle="Browse, filter, and inspect registered users across all roles."
    >
      {/* Filter bar (static labels — wire to state in a client component if needed) */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        {(["ALL", "FAN", "ARTIST", "ADMIN"] as const).map((r) => (
          <span key={r} className="chip">{r}</span>
        ))}
        {(["ACTIVE", "SUSPENDED", "DEACTIVATED"] as const).map((s) => (
          <span key={s} className={statusChip[s]}>{s}</span>
        ))}
      </div>

      {/* User table */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["Username", "Email", "Role", "Status", "Joined"].map((h) => (
                <th key={h} style={{ color: "#8a84a0", textAlign: "left", padding: "8px 12px", borderBottom: "1px solid #2e2b3a", fontSize: "0.8rem" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SEED_USERS.map((user) => (
              <tr key={user.id} style={{ borderBottom: "1px solid #1a1726" }}>
                <td style={{ padding: "10px 12px", color: "#f4f0ff", fontSize: "0.9rem" }}>{user.username}</td>
                <td style={{ padding: "10px 12px", color: "#c7c1d9", fontSize: "0.85rem" }}>{user.email}</td>
                <td style={{ padding: "10px 12px" }}><span className="chip">{user.role}</span></td>
                <td style={{ padding: "10px 12px" }}><span className={statusChip[user.status]}>{user.status}</span></td>
                <td style={{ padding: "10px 12px", color: "#8a84a0", fontSize: "0.8rem" }}>{user.joinedAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detail drawer placeholder */}
      <div style={{ marginTop: "2rem", padding: "1rem", background: "#16131f", borderRadius: "10px" }}>
        <p className="muted" style={{ margin: 0, fontSize: "0.85rem" }}>
          Select a user row to open the detail drawer (client-side interaction).
        </p>
      </div>
    </AdminShell>
  );
}
