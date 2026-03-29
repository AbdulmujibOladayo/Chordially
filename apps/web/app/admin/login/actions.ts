"use server";

import { redirect } from "next/navigation";
import { setAdminSession } from "../../../lib/admin-auth";

export async function loginAsAdmin() {
  setAdminSession();
  redirect("/admin");
}
