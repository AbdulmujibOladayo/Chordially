// #128 – Audit event fetching for admin UI.
// In production this would call the API. For demo/SSR we use seeded data.

export interface AuditEvent {
  id: string;
  actor: string;
  action: string;
  path: string;
  method: string;
  createdAt: string;
}

const SEED_EVENTS: AuditEvent[] = [
  { id: "a1", actor: "ops_lead", action: "/auth/register", path: "/auth/register", method: "POST", createdAt: "2026-03-29T10:01:00.000Z" },
  { id: "a2", actor: "ops_lead", action: "/admin/users/u3/suspend", path: "/admin/users/u3/suspend", method: "PATCH", createdAt: "2026-03-29T10:15:00.000Z" },
  { id: "a3", actor: "nova_chords", action: "/sessions", path: "/sessions", method: "POST", createdAt: "2026-03-29T11:00:00.000Z" },
  { id: "a4", actor: "ada_listener", action: "/payments/prepare", path: "/payments/prepare", method: "POST", createdAt: "2026-03-29T11:05:00.000Z" },
  { id: "a5", actor: "ops_lead", action: "/admin/sessions/s4/cancel", path: "/admin/sessions/s4/cancel", method: "PATCH", createdAt: "2026-03-29T12:00:00.000Z" },
  { id: "a6", actor: "echo_drift", action: "/profile", path: "/profile", method: "POST", createdAt: "2026-03-29T13:30:00.000Z" },
  { id: "a7", actor: "ada_listener", action: "/payments/prepare", path: "/payments/prepare", method: "POST", createdAt: "2026-03-29T14:00:00.000Z" },
  { id: "a8", actor: "ops_lead", action: "/admin/users/u5/deactivate", path: "/admin/users/u5/deactivate", method: "PATCH", createdAt: "2026-03-29T15:00:00.000Z" }
];

export interface AuditQuery {
  actor?: string;
  action?: string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}

export function getAuditEvents(query: AuditQuery = {}) {
  let items = [...SEED_EVENTS];

  if (query.actor) items = items.filter((e) => e.actor.includes(query.actor!));
  if (query.action) items = items.filter((e) => e.action.includes(query.action!));
  if (query.from) items = items.filter((e) => e.createdAt >= query.from!);
  if (query.to) items = items.filter((e) => e.createdAt <= query.to! + "T23:59:59Z");

  const total = items.length;
  const offset = query.offset ?? 0;
  const limit = query.limit ?? 50;

  return { items: items.slice(offset, offset + limit), total };
}
