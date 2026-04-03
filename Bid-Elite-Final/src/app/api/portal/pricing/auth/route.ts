import { db } from "@/lib/db";
import { packageInvitations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { code } = await request.json();

    if (!code || typeof code !== "string") {
      return NextResponse.json({ error: "Access code is required" }, { status: 400 });
    }

    const invitation = await db
      .select()
      .from(packageInvitations)
      .where(eq(packageInvitations.authCode, code.toUpperCase().trim()))
      .limit(1);

    if (!invitation.length) {
      return NextResponse.json({ error: "Invalid or expired access code" }, { status: 401 });
    }

    const inv = invitation[0];

    await db
      .update(packageInvitations)
      .set({
        lastAccessedAt: new Date(),
        status: inv.status === "pending" ? "viewed" : inv.status,
      })
      .where(eq(packageInvitations.id, inv.id));

    return NextResponse.json({
      invitationId: inv.id,
      packageId: inv.packageId,
      authCode: inv.authCode,
      shareLink: inv.shareLink,
    });
  } catch (err) {
    console.error("Pricing auth error:", err);
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
  }
}
