import { notFound } from "next/navigation";
import { Shell } from "../../../components/layout/shell";
import { Card } from "../../../components/ui/card";
import { getSessionDetail } from "../../../lib/session-detail";
import { getTipIntent } from "../../../lib/tip-intent";
import { TipForm } from "./tip-form";

const isDemoMode = process.env.DEMO_MODE === "true";

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
      {isDemoMode && (
        <div style={{ background: "#2a1a00", border: "1px solid #f59e0b", borderRadius: "8px", padding: "0.6rem 1rem", marginBottom: "1rem", fontSize: "0.85rem", color: "#f59e0b" }}>
          ⚠ Demo mode active — payments are simulated and not submitted to the network.
        </div>
      )}
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
            <button className="button" type="submit">
              {isDemoMode ? "Simulate tip (demo)" : "Create tip intent"}
            </button>
          </form>
          {searchParams.intent === "1" && showIntent ? (
            <p className="muted">
              {isDemoMode ? "Mock tip confirmed" : "Draft intent created"} for {showIntent.amount} {showIntent.asset}.
              {isDemoMode ? " This is a demo record — no real transaction was submitted." : " Payment execution is intentionally deferred."}
            </p>
          ) : null}
          <TipForm
            artistSlug={session.slug}
            defaultAsset={session.walletAsset}
            showConfirmation={searchParams.intent === "1"}
            confirmedAmount={showIntent?.amount}
            confirmedAsset={showIntent?.asset}
          />
        </Card>
      </div>
    </Shell>
  );
}
