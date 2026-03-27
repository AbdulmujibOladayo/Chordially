import { Shell } from "../components/layout/shell";
import { Card } from "../components/ui/card";

export default function HomePage() {
  return (
    <Shell
      title="Session detail and tip intent flow."
      subtitle="This branch adds the fan-facing session surface plus a draft tipping contract that can later hand off to real payment execution."
    >
      <Card title="Entry point">
        <a className="button" href="/sessions/nova-chords">Open session detail</a>
      </Card>
    </Shell>
  );
}
