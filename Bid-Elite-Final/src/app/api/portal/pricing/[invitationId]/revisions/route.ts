import { db } from "@/lib/db";
import { packageSubmissions, packageInvitations } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ invitationId: string }> },
) {
  try {
    const { invitationId } = await params;

    const invRows = await db
      .select({ id: packageInvitations.id })
      .from(packageInvitations)
      .where(eq(packageInvitations.id, invitationId))
      .limit(1);

    if (!invRows.length) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
    }

    const revisions = await db
      .select({
        id: packageSubmissions.id,
        revision: packageSubmissions.revision,
        prices: packageSubmissions.prices,
        totalAmount: packageSubmissions.totalAmount,
        currency: packageSubmissions.currency,
        submittedAt: packageSubmissions.submittedAt,
      })
      .from(packageSubmissions)
      .where(eq(packageSubmissions.invitationId, invitationId))
      .orderBy(desc(packageSubmissions.revision));

    return NextResponse.json({ revisions });
  } catch (err) {
    console.error("Revisions GET error:", err);
    return NextResponse.json({ error: "Failed to fetch revisions" }, { status: 500 });
  }
}
