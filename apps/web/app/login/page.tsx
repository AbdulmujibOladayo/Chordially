import { Shell } from "../../components/layout/shell";
import { Card } from "../../components/ui/card";
import { loginAsRole } from "./actions";

export default function LoginPage() {
  return (
    <Shell
      title="Choose a demo role."
      subtitle="This login flow is intentionally local so authorization guards can ship independently of backend auth work."
    >
      <Card title="Role switcher">
        <form action={loginAsRole} className="stack">
          <div className="auth-switcher">
            <button className="button button--primary" name="role" value="fan">
              Continue as fan
            </button>
            <button className="button button--secondary" name="role" value="artist">
              Continue as artist
            </button>
            <button className="button button--secondary" name="role" value="admin">
              Continue as admin
            </button>
          </div>
        </form>
      </Card>
    </Shell>
  );
}
