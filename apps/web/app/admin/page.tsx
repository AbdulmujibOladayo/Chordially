import { Shell } from "../../components/layout/shell";
import { Card } from "../../components/ui/card";
import { requireRole } from "../../lib/guards";

export default function AdminPage() {
  const user = requireRole(["admin"]);

  return (
    <Shell
      title="Admin shell."
      subtitle="A dedicated admin-only entry point with the same shared layout primitives used elsewhere in the app."
    >
      <Card title="Access granted">
        <p className="muted">
          {user.name} can view admin-only routes. Artist and fan sessions are redirected to the unauthorized page.
        </p>
      </Card>
    </Shell>
  );
}
