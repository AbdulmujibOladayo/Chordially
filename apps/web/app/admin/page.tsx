import { AdminShell } from "../../components/layout/admin-shell";
import { Card } from "../../components/ui/card";
import { requireAdmin } from "../../lib/admin-auth";
import { getAdminSummary } from "../../lib/admin-summary";

export default function AdminOverviewPage() {
  requireAdmin();

  const summary = getAdminSummary();

  return (
    <AdminShell
      title="Platform overview"
      subtitle="A protected admin summary surface with seeded metrics for users, artists, sessions, and recent activity."
    >
      <div className="grid grid--4">
        <Card title="Users">
          <p>{summary.totalUsers}</p>
        </Card>
        <Card title="Artists">
          <p>{summary.totalArtists}</p>
        </Card>
        <Card title="Live sessions">
          <p>{summary.activeSessions}</p>
        </Card>
        <Card title="Recent tips">
          <p>{summary.recentTips}</p>
        </Card>
      </div>
      <Card title="Latest accounts" >
        {summary.recentUsers.map((user) => (
          <div key={`${user.name}-${user.role}`}>
            <span className="chip">{user.role}</span>
            <span className="chip">{user.status}</span>
            <p className="muted">{user.name}</p>
          </div>
        ))}
      </Card>
    </AdminShell>
  );
}
