import { notFound } from "next/navigation";
import { Shell } from "../../../components/layout/shell";
import { Card } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { getSessionDetail } from "../../../lib/session-detail";
import { getTipIntent } from "../../../lib/tip-intent";
import { createTipIntent } from "./actions";

export default function SessionDetailPage({
  params,
  searchParams
}: {
  params: { slug: string };
  searchParams: { intent?: string };
}) {
  const session = getSessionDetail(params.slug);

  if (!session) {
    notFound();
  }

  const latestIntent = getTipIntent();
  const showIntent = latestIntent?.artistSlug === params.slug ? latestIntent : null;

  return (
    <Shell
      title={session.artistName}
      subtitle="A stable session detail contract with placeholder tipping UI and persisted draft intent state."
    >
      <div className="grid" style={{ gridTemplateColumns: "1.1fr 0.9fr" }}>
        <Card title={session.title}>
          <div>
            <span className="chip">{session.city}</span>
            <span className="chip">{session.streamStatus === "live" ? "Live now" : "Session ended"}</span>
            <span className="chip">Tips in {session.walletAsset}</span>
          </div>
          <p className="muted">{session.description}</p>
          <p className="muted">Real-time tip feed and transaction status will attach to this page in later branches.</p>
        </Card>
        <Card title="Tip draft">
          <form action={createTipIntent} className="stack">
            <input name="artistSlug" type="hidden" value={session.slug} />
            <label className="stack">
              <span>Amount</span>
              <Input defaultValue="5.00" name="amount" required />
            </label>
            <label className="stack">
              <span>Asset</span>
              <select className="select" defaultValue={session.walletAsset} name="asset">
                <option value="XLM">XLM</option>
                <option value="USDC">USDC</option>
              </select>
            </label>
            <label className="stack">
              <span>Message</span>
              <textarea className="textarea" defaultValue="For the encore." name="note" />
            </label>
            <button className="button" type="submit">Create tip intent</button>
          </form>
          {searchParams.intent === "1" && showIntent ? (
            <p className="muted">
              Draft intent created for {showIntent.amount} {showIntent.asset}. Payment execution is intentionally deferred.
            </p>
          ) : null}
        </Card>
      </div>
    </Shell>
  );
}
