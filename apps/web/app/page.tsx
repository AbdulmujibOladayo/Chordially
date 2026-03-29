import { AdminShell } from "../components/layout/admin-shell";
import { Card } from "../components/ui/card";

export default function HomePage() {
  return (
    <AdminShell
      title="Admin entry and overview shell."
      subtitle="This branch adds a protected admin entry point and a lightweight overview page that can merge before real admin APIs exist."
    >
      <Card title="Quick start">
        <a className="button" href="/admin/login">Open admin login</a>
      </Card>
    </AdminShell>
  );
}
