import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chordially Web",
  description: "Role-aware web foundation for Chordially."
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
