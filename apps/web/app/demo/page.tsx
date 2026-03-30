// #129 – Demo script page for hackathon judges
import Link from "next/link";
import { Shell } from "../../components/layout/shell";
import { Card } from "../../components/ui/card";
import { DEMO_PERSONAS, DEMO_SCRIPT } from "../../lib/demo-personas";

const isDemoMode = process.env.DEMO_MODE === "true";

export default function DemoPage() {
  return (
    <Shell
      title="Demo guide"
      subtitle="Prebuilt personas and a guided script for judges. Run the full product story in under 5 minutes."
    >
      {isDemoMode && (
        <div style={{ background: "#2a1a00", border: "1px solid #f59e0b", borderRadius: "8px", padding: "0.6rem 1rem", marginBottom: "1.5rem", fontSize: "0.85rem", color: "#f59e0b" }}>
          ⚠ Demo mode active — payments are simulated. No real transactions will be submitted.
        </div>
      )}

      {/* Personas */}
      <Card title="Demo personas">
        <div className="grid grid--3" style={{ marginTop: "0.5rem" }}>
          {DEMO_PERSONAS.map((p) => (
            <div key={p.id} style={{ background: "#16131f", borderRadius: "10px", padding: "1rem" }}>
              <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
                <span className="chip">{p.role}</span>
                <span className="chip">{p.city}</span>
              </div>
              <p style={{ margin: 0, fontWeight: 600, color: "#f4f0ff" }}>{p.displayName}</p>
              <p className="muted" style={{ fontSize: "0.8rem", margin: "0.25rem 0 0.5rem" }}>{p.bio}</p>
              <p style={{ margin: 0, fontSize: "0.75rem", color: "#8a84a0" }}>
                {p.email} · pw: <code style={{ color: "#c7c1d9" }}>{p.demoPassword}</code>
              </p>
            </div>
          ))}
        </div>
      </Card>

      {/* Script */}
      <Card title="Demo script">
        <div style={{ marginTop: "0.5rem" }}>
          {DEMO_SCRIPT.map((step) => (
            <div key={step.step} style={{ display: "flex", gap: "1rem", padding: "0.75rem 0", borderBottom: "1px solid #2e2b3a", alignItems: "flex-start" }}>
              <span style={{ minWidth: "28px", height: "28px", borderRadius: "50%", background: "#2e2b3a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", color: "#c7c1d9", fontWeight: 700 }}>
                {step.step}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
                  <p style={{ margin: 0, fontWeight: 600, color: "#f4f0ff", fontSize: "0.9rem" }}>{step.title}</p>
                  <span className="chip">{step.persona}</span>
                  <Link href={step.path} style={{ fontSize: "0.75rem", color: "#8a84a0", fontFamily: "monospace" }}>{step.path}</Link>
                </div>
                <p className="muted" style={{ margin: "0.25rem 0 0", fontSize: "0.85rem" }}>{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </Shell>
  );
}
