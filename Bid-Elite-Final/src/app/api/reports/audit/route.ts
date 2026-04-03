import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { auditLog, users } from "@/lib/db/schema";
import { desc, eq, and, gte, lte, count } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get("entityType");
    const userId = searchParams.get("userId");
    const action = searchParams.get("action");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = 50;
    const offset = (page - 1) * limit;

    const conditions = [];
    if (entityType) conditions.push(eq(auditLog.entityType, entityType));
    if (userId) conditions.push(eq(auditLog.userId, userId));
    if (action) conditions.push(eq(auditLog.action, action));
    if (startDate) conditions.push(gte(auditLog.createdAt, new Date(startDate)));
    if (endDate) conditions.push(lte(auditLog.createdAt, new Date(endDate + "T23:59:59")));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const result = await db
      .select({
        id: auditLog.id,
        userId: auditLog.userId,
        action: auditLog.action,
        entityType: auditLog.entityType,
        entityId: auditLog.entityId,
        details: auditLog.details,
        ipAddress: auditLog.ipAddress,
        createdAt: auditLog.createdAt,
        userName: users.name,
        userEmail: users.email,
      })
      .from(auditLog)
      .leftJoin(users, eq(auditLog.userId, users.id))
      .where(whereClause)
      .orderBy(desc(auditLog.createdAt))
      .limit(limit)
      .offset(offset);

    let filteredResult = result;
    if (search) {
      const q = search.toLowerCase();
      filteredResult = result.filter(
        (r) =>
          r.action?.toLowerCase().includes(q) ||
          r.entityType?.toLowerCase().includes(q) ||
          r.userName?.toLowerCase().includes(q) ||
          r.userEmail?.toLowerCase().includes(q) ||
          r.entityId?.toLowerCase().includes(q) ||
          (r.details && JSON.stringify(r.details).toLowerCase().includes(q))
      );
    }

    const countResult = await db
      .select({ value: count() })
      .from(auditLog)
      .where(whereClause);

    const entityTypes = await db
      .selectDistinct({ entityType: auditLog.entityType })
      .from(auditLog);

    const actions = await db
      .selectDistinct({ action: auditLog.action })
      .from(auditLog);

    const allUsers = await db
      .select({ id: users.id, name: users.name, email: users.email })
      .from(users)
      .orderBy(users.name);

    return NextResponse.json({
      entries: filteredResult,
      total: countResult[0]?.value ?? 0,
      page,
      limit,
      filters: {
        entityTypes: entityTypes.map((e) => e.entityType),
        actions: actions.map((a) => a.action),
        users: allUsers,
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch audit log" }, { status: 500 });
  }
}
