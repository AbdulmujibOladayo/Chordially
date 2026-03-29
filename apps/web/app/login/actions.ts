"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { AppRole } from "../../lib/auth";

export async function loginAsRole(formData: FormData) {
  const role = formData.get("role");

  if (role !== "fan" && role !== "artist" && role !== "admin") {
    redirect("/unauthorized");
  }

  cookies().set("chordially_role", role satisfies AppRole, {
    httpOnly: true,
    sameSite: "lax",
    path: "/"
  });

  if (role === "admin") {
    redirect("/admin");
  }

  redirect("/dashboard");
}
