import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { quotes } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { logAudit, AUDIT_ACTIONS } from "@/lib/utils/audit";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    if (!userId) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { scores, totalScore } = body;

    if (scores !== undefined) {
      if (typeof scores !== "object" || scores === null) {
        return NextResponse.json(
          { error: "scores must be an object" },
          { status: 400 },
        );
      }

      for (const [, value] of Object.entries(scores)) {
        if (typeof value !== "number" || value < 0 || value > 100) {
          return NextResponse.json(
            { error: "Each score must be a number between 0 and 100" },
            { status: 400 },
          );
        }
      }
    }

    const existing = await db
      .select({ id: quotes.id })
      .from(quotes)
      .where(eq(quotes.id, id))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }

    const updates: Record<string, unknown> = {};

    if (scores !== undefined) {
      updates.scores = scores;
    }

    if (totalScore !== undefined) {
      updates.totalScore = String(totalScore);
    }

    if (Object.keys(updates).length > 0) {
      await db.update(quotes).set(updates).where(eq(quotes.id, id));
    }

    await logAudit({
      userId,
      action: AUDIT_ACTIONS.QUOTE_SCORED,
      entityType: "quote",
      entityId: id,
      details: { scores, totalScore },
    });

    return NextResponse.json({
      success: true,
      scores: scores ?? null,
      totalScore: totalScore ?? null,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to update scores" },
      { status: 500 },
    );
  }
}
