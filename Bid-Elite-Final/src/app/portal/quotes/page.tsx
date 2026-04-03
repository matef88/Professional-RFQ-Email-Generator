import { getPortalSession } from "@/lib/auth/portal-auth";
import { redirect } from "next/navigation";
import QuotesClient from "./quotes-client";

export default async function QuotesPage() {
  const session = await getPortalSession();
  if (!session) redirect("/portal/login");

  return <QuotesClient />;
}
