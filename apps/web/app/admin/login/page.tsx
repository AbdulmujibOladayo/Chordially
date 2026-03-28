import { AdminShell } from "../../../components/layout/admin-shell";
import { Card } from "../../../components/ui/card";
import { loginAsAdmin } from "./actions";

export default function AdminLoginPage() {
  return (
    <AdminShell
      title="Admin login"
      subtitle="Use this local entry point to review admin-only layouts and guard behavior before backend authentication is connected."
    >
      <Card title="Demo access">
        <form action={loginAsAdmin}>
          <button className="button" type="submit">Continue as admin</button>
        </form>
      </Card>
    </AdminShell>
  );
}
