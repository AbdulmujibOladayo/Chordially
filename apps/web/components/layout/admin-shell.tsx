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
          <Link className="button button--secondary" href="/admin/bellabuks/sessions">Sessions</Link>
          <Link className="button button--secondary" href="/admin/bellabuks/users">Users</Link>
          <Link className="button button--secondary" href="/admin/bellabuks/audit">Audit trail</Link>
          <Link className="button button--secondary" href="/admin/login">Switch admin</Link>
        </nav>
      </section>
      {children}
    </main>
    <>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <main className="shell" id="main-content">
        <section className="hero">
          <p className="eyebrow" aria-hidden="true">Chordially Admin</p>
          <h1>{title}</h1>
          <p className="copy">{subtitle}</p>
          <nav className="nav" aria-label="Admin navigation">
            <Link className="button" href="/admin">Overview</Link>
            <Link className="button button--secondary" href="/admin/login">Switch admin</Link>
          </nav>
        </section>
        {children}
      </main>
    </>
  );
}
