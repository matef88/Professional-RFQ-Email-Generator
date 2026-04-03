import { getPortalSession } from "@/lib/auth/portal-auth";
import { redirect } from "next/navigation";
import ProfileClient from "./profile-client";

export default async function ProfilePage() {
  const session = await getPortalSession();
  if (!session) redirect("/portal/login");

  return <ProfileClient />;
}
