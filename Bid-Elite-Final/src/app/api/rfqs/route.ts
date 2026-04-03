import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { rfqs, rfqSuppliers, rfqStatusEnum } from "@/lib/db/schema";
import { desc, eq, count, and, ilike } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const createdBy = searchParams.get("createdBy");
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "20");
    const offset = (page - 1) * limit;

    const conditions = [];
    if (status && rfqStatusEnum.enumValues.includes(status as typeof rfqStatusEnum.enumValues[number])) {
      conditions.push(eq(rfqs.status, status as typeof rfqStatusEnum.enumValues[number]));
    }
    if (search) conditions.push(ilike(rfqs.packageName, `%${search}%`));
    if (createdBy) conditions.push(eq(rfqs.createdBy, createdBy));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const result = await db
      .select({
        id: rfqs.id,
        packageName: rfqs.packageName,
        reference: rfqs.reference,
        deadline: rfqs.deadline,
        template: rfqs.template,
        status: rfqs.status,
        createdAt: rfqs.createdAt,
        updatedAt: rfqs.updatedAt,
        createdBy: rfqs.createdBy,
      })
      .from(rfqs)
      .where(whereClause)
      .orderBy(desc(rfqs.createdAt))
      .limit(limit)
      .offset(offset);

    const countResult = await db
      .select({ value: count() })
      .from(rfqs)
      .where(whereClause);

    return NextResponse.json({
      rfqs: result,
      total: countResult[0]?.value ?? 0,
      page,
      limit,
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch RFQs" }, { status: 500 });
  }
}

export async function POST(request: Request) {
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
    const { packageName, reference, deadline, template, details, packageLink, docsLink, supplierIds } = body;

    if (!packageName?.trim()) {
      return NextResponse.json({ error: "Package name is required" }, { status: 400 });
    }

    const result = await db
      .insert(rfqs)
      .values({
        packageName: packageName.trim(),
        reference: reference?.trim() || null,
        deadline: deadline || null,
        template: template || "standard",
        details: details?.trim() || null,
        packageLink: packageLink?.trim() || null,
        docsLink: docsLink?.trim() || null,
        createdBy: userId,
      })
      .returning({
        id: rfqs.id,
        packageName: rfqs.packageName,
        reference: rfqs.reference,
        deadline: rfqs.deadline,
        template: rfqs.template,
        status: rfqs.status,
        details: rfqs.details,
        packageLink: rfqs.packageLink,
        docsLink: rfqs.docsLink,
        createdBy: rfqs.createdBy,
        createdAt: rfqs.createdAt,
        updatedAt: rfqs.updatedAt,
      });

    const rfq = result[0];

    if (supplierIds?.length > 0) {
      await db.insert(rfqSuppliers).values(
        supplierIds.map((supplierId: string) => ({
          rfqId: rfq.id,
          supplierId,
          portalToken: crypto.randomUUID(),
        }))
      );
    }

    return NextResponse.json({ rfq }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create RFQ" }, { status: 500 });
  }
}
