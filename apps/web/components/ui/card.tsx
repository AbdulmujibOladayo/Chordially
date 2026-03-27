import { ReactNode } from "react";

export function Card({
  title,
  children
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="card">
      <p className="card__eyebrow">{title}</p>
      <div>{children}</div>
    </section>
  );
}
