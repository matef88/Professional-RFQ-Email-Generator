import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";
import TeamClient from "./team-client";

export default async function TeamPage() {
  const session = await getServerSession(authOptions);

  if ((session?.user as { role?: string })?.role !== "admin") {
    redirect("/settings");
  }

  let teamMembers: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    createdAt: Date;
    lastLogin: Date | null;
  }> = [];

  try {
    teamMembers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
        lastLogin: users.lastLogin,
      })
      .from(users)
      .orderBy(desc(users.createdAt));
  } catch {
    // DB not connected yet
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/settings" className="text-xs text-text-muted hover:text-text-secondary">
          &larr; Settings
        </Link>
        <h1 className="mt-1 text-xl font-bold text-text-primary">Team Management</h1>
        <p className="text-sm text-text-muted">Manage team members and their roles</p>
      </div>

      <TeamClient members={teamMembers} currentUserId={(session?.user as { id?: string })?.id ?? ""} />
    </div>
  );
}
