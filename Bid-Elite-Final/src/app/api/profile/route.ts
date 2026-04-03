import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as { id?: string }).id;
    if (!userId) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const body = await request.json();
    const updates: Record<string, string> = {};

    if (body.name !== undefined && typeof body.name === "string" && body.name.trim()) {
      updates.name = body.name.trim();
    }
    if (body.email !== undefined && typeof body.email === "string" && body.email.trim()) {
      const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, body.email.trim())).limit(1);
      if (existing.length > 0 && existing[0].id !== userId) {
        return NextResponse.json({ error: "Email is already in use" }, { status: 409 });
      }
      updates.email = body.email.trim();
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    await db.update(users).set(updates).where(eq(users.id, userId));

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
