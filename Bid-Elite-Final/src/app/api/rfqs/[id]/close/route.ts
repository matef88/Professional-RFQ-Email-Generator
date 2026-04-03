import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { rfqs, auditLog } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as { id?: string }).id;
    const { id } = await params;

    const existing = await db.select({ status: rfqs.status }).from(rfqs).where(eq(rfqs.id, id)).limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: "RFQ not found" }, { status: 404 });
    }

    if (existing[0].status === "closed") {
      return NextResponse.json({ error: "RFQ is already closed" }, { status: 400 });
    }

    await db
      .update(rfqs)
      .set({ status: "closed", closedAt: new Date(), updatedAt: new Date() })
      .where(eq(rfqs.id, id));

    if (userId) {
      await db.insert(auditLog).values({
        userId,
        action: "rfq.closed",
        entityType: "rfq",
        entityId: id,
      });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to close RFQ" }, { status: 500 });
  }
}
