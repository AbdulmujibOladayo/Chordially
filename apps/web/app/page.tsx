"use client"

import Link from "next/link"
import { useAuth } from "../lib/auth-context"

export default function HomePage() {
  const { user, isLoading, logout } = useAuth()

  if (isLoading) {
    return (
      <main>
        <p>Loading...</p>
      </main>
    )
  }

  if (!user) {
    return (
      <main>
        <h1>Chordially</h1>
        <p>
          <Link href="/login">Log in</Link> or{" "}
          <Link href="/register">create an account</Link> to get started.
        </p>
      </main>
    )
  }

  return (
    <main>
      <h1>Chordially</h1>
      <p>You are logged in as {user.email}.</p>
      <button type="button" onClick={logout}>
        Log out
      </button>
    </main>
  )
}
