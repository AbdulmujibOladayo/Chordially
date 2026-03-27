import { Shell } from "../../components/layout/shell";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";

export default function UnauthorizedPage() {
  return (
    <Shell
      title="You do not have access to that route."
      subtitle="Role guards redirect here when the current session does not satisfy a page requirement."
    >
      <Card title="Next step">
        <p className="muted">Switch to a different demo role to continue exploring protected areas.</p>
        <Button href="/login">Back to login</Button>
      </Card>
    </Shell>
  );
}
