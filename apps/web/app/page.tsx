import { Shell } from "../components/layout/shell";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";

export default function HomePage() {
  return (
    <Shell
      title="Shared web foundation for public, artist, and admin surfaces."
      subtitle="This branch adds reusable layout, form, and navigation primitives together with route-level role guards."
    >
      <div className="nav">
        <Button href="/login">Open demo login</Button>
        <Button href="/dashboard" variant="secondary">
          Dashboard
        </Button>
        <Button href="/admin" variant="secondary">
          Admin
        </Button>
      </div>
      <div className="grid grid--3">
        <Card title="Public">
          <p className="muted">
            Shared shell and cards for landing and discovery experiences.
          </p>
        </Card>
        <Card title="Artist">
          <p className="muted">
            Protected dashboard route for artist and admin roles.
          </p>
        </Card>
        <Card title="Admin">
          <p className="muted">
            Isolated admin route that rejects fan and artist-only sessions.
          </p>
        </Card>
      </div>
    </Shell>
  );
}
