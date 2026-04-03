import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { rfqs, quotes } from "@/lib/db/schema";
import { eq, count, and, sql, lte } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [unreadQuotesResult, approachingDeadlinesResult, pendingActionsResult] =
      await Promise.all([
        // Quotes submitted but not yet reviewed
        db
          .select({ count: count() })
          .from(quotes)
          .where(eq(quotes.status, "submitted")),

        // RFQs with deadline within 7 days (open/sent only)
        db
          .select({ count: count() })
          .from(rfqs)
          .where(
            and(
              sql`${rfqs.status} IN ('open', 'sent')`,
              lte(rfqs.deadline, sql`(CURRENT_DATE + INTERVAL '7 days')::date`),
              sql`${rfqs.deadline} >= CURRENT_DATE`
            )
          ),

        // Draft RFQs that need action (not yet sent)
        db
          .select({ count: count() })
          .from(rfqs)
          .where(eq(rfqs.status, "draft")),
      ]);

    return NextResponse.json({
      unreadQuotes: unreadQuotesResult[0]?.count ?? 0,
      approachingDeadlines: approachingDeadlinesResult[0]?.count ?? 0,
      pendingActions: pendingActionsResult[0]?.count ?? 0,
    });
  } catch {
    return NextResponse.json(
      { unreadQuotes: 0, approachingDeadlines: 0, pendingActions: 0 },
      { status: 200 }
    );
  }
}
