import { Shell } from "../../components/layout/shell";
import { Badge } from "../../components/ui/badge";
import { Card } from "../../components/ui/card";
import { requireRole } from "../../lib/guards";

export default function DashboardPage() {
  const user = requireRole(["artist", "admin"]);

  return (
    <Shell
      title="Artist operations shell."
      subtitle="Accessible only to artist and admin roles, with a stable layout and tokenized styling for future dashboard pages."
    >
      <div className="grid grid--3">
        <Card title="Session access">
          <Badge>{user.role}</Badge>
          <p className="muted">Signed in as {user.name}.</p>
        </Card>
        <Card title="Design foundation">
          <p className="muted">
            Buttons, cards, badges, inputs, shells, and grid primitives are ready for reuse.
          </p>
        </Card>
        <Card title="Authorization">
          <p className="muted">
            Fans are redirected away from this route before any page content renders.
          </p>
        </Card>
      </div>
    </Shell>
  );
}
