import Link from "next/link";
import { ReactNode } from "react";

export function AdminShell({
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
      <section className="hero">
        <p className="eyebrow">Chordially Admin</p>
        <h1>{title}</h1>
        <p className="copy">{subtitle}</p>
        <nav className="nav">
          <Link className="button" href="/admin">Overview</Link>
          <Link className="button button--secondary" href="/admin/login">Switch admin</Link>
        </nav>
      </section>
      {children}
    </main>
  );
}
