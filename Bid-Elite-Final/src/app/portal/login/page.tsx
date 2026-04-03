import { getPortalSession } from "@/lib/auth/portal-auth";
import { redirect } from "next/navigation";
import LoginClient from "./login-client";

export default async function PortalLoginPage() {
  const session = await getPortalSession();
  if (session) redirect("/portal/dashboard");

  return <LoginClient />;
}
