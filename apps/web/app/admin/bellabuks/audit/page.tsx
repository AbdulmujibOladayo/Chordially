// #128 – Audit trail admin page with filters by actor, action, and date
import { AdminShell } from "../../../../components/layout/admin-shell";
import { Card } from "../../../../components/ui/card";
import { requireAdmin } from "../../../../lib/admin-auth";
import { getAuditEvents } from "../../../../lib/audit-events";

interface AuditPageProps {
  searchParams: { actor?: string; action?: string; from?: string; to?: string; page?: string };
}

export default function AdminAuditPage({ searchParams }: AuditPageProps) {
  requireAdmin();

  const page = Math.max(1, Number(searchParams.page ?? 1));
  const limit = 20;
  const offset = (page - 1) * limit;

  const { items, total } = getAuditEvents({
    actor: searchParams.actor,
    action: searchParams.action,
    from: searchParams.from,
    to: searchParams.to,
    limit,
    offset
  });

  const totalPages = Math.ceil(total / limit);

  return (
    <AdminShell
      title="Audit trail"
      subtitle="Inspect moderation and operational events. Filters by actor, action, and date."
    >
      {/* Filter bar */}
      <form method="GET" style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
        <input className="input" name="actor" placeholder="Actor" defaultValue={searchParams.actor ?? ""} style={{ width: "140px" }} />
        <input className="input" name="action" placeholder="Action contains" defaultValue={searchParams.action ?? ""} style={{ width: "180px" }} />
        <input className="input" name="from" type="date" defaultValue={searchParams.from ?? ""} />
        <input className="input" name="to" type="date" defaultValue={searchParams.to ?? ""} />
        <button className="button" type="submit">Filter</button>
        <a className="button button--secondary" href="/admin/bellabuks/audit">Reset</a>
      </form>

      <Card title={`Events (${total})`}>
        {items.length === 0 ? (
          <p className="muted">No events match the current filters.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["Actor", "Method", "Action", "Path", "Time"].map((h) => (
                    <th key={h} style={{ color: "#8a84a0", textAlign: "left", padding: "8px 12px", borderBottom: "1px solid #2e2b3a", fontSize: "0.8rem" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((e) => (
                  <tr key={e.id} style={{ borderBottom: "1px solid #1a1726" }}>
                    <td style={{ padding: "10px 12px", color: "#f4f0ff", fontSize: "0.85rem" }}>{e.actor}</td>
                    <td style={{ padding: "10px 12px" }}><span className="chip">{e.method}</span></td>
                    <td style={{ padding: "10px 12px", color: "#c7c1d9", fontSize: "0.85rem" }}>{e.action}</td>
                    <td style={{ padding: "10px 12px", color: "#8a84a0", fontSize: "0.8rem", fontFamily: "monospace" }}>{e.path}</td>
                    <td style={{ padding: "10px 12px", color: "#8a84a0", fontSize: "0.8rem" }}>{new Date(e.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
          {page > 1 && (
            <a className="button button--secondary" href={`?${new URLSearchParams({ ...searchParams, page: String(page - 1) })}`}>← Prev</a>
          )}
          <span className="chip" style={{ alignSelf: "center" }}>Page {page} / {totalPages}</span>
          {page < totalPages && (
            <a className="button button--secondary" href={`?${new URLSearchParams({ ...searchParams, page: String(page + 1) })}`}>Next →</a>
          )}
        </div>
      )}
    </AdminShell>
  );
}
