import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import Link from "next/link";
import ProfileClient from "./profile-client";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/settings" className="text-xs text-text-muted hover:text-text-secondary">
          &larr; Settings
        </Link>
        <h1 className="mt-1 text-xl font-bold text-text-primary">Profile</h1>
        <p className="text-sm text-text-muted">Manage your personal information</p>
      </div>

      <ProfileClient
        initialName={session.user.name ?? ""}
        initialEmail={session.user.email ?? ""}
        role={(session.user as { role?: string }).role ?? "member"}
      />
    </div>
  );
}
