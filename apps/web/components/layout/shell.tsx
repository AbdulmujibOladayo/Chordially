import { ReactNode } from "react";

export function Shell({
  title,
  subtitle,
  children
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <main className="shell">
      <header className="hero">
        <p className="eyebrow">Chordially</p>
        <h1>{title}</h1>
        <p className="hero__copy">{subtitle}</p>
      </header>
      {children}
    </main>
  );
}
