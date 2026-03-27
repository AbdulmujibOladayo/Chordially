import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chordially Session Detail",
  description: "Session detail page and draft tip intent flow."
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
