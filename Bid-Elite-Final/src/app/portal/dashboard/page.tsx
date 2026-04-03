import { getPortalSession } from "@/lib/auth/portal-auth";
import { redirect } from "next/navigation";
import DashboardClient from "./dashboard-client";

export default async function DashboardPage() {
  const session = await getPortalSession();
  if (!session) redirect("/portal/login");

  return <DashboardClient supplierName={session.name} />;
}
