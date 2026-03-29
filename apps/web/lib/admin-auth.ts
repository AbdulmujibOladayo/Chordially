import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const cookieName = "chordially_admin";

export function isAdminAuthenticated() {
  return cookies().get(cookieName)?.value === "true";
}

export function requireAdmin() {
  if (!isAdminAuthenticated()) {
    redirect("/admin/login");
  }
}

export function setAdminSession() {
  cookies().set(cookieName, "true", {
    httpOnly: true,
    sameSite: "lax",
    path: "/"
  });
}
