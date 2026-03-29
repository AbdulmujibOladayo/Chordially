import { redirect } from "next/navigation";
import type { AppRole } from "./auth";
import { getSessionUser } from "./auth";

export function requireRole(allowedRoles: AppRole[]) {
  const user = getSessionUser();

  if (!user) {
    redirect("/login");
  }

  if (!allowedRoles.includes(user.role)) {
    redirect("/unauthorized");
  }

  return user;
}
