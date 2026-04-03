import { db } from "@/lib/db";
import { packages, rfqs } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { logAudit } from "@/lib/utils/audit";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rfqId = new URL(request.url).searchParams.get("rfqId");

    const query = db
      .select({
        id: packages.id,
        name: packages.name,
        description: packages.description,
        items: packages.items,
        rfqId: packages.rfqId,
        rfqPackageName: rfqs.packageName,
        rfqReference: rfqs.reference,
        createdAt: packages.createdAt,
        updatedAt: packages.updatedAt,
      })
      .from(packages)
      .leftJoin(rfqs, eq(packages.rfqId, rfqs.id));

    if (rfqId) {
      const result = await query.where(eq(packages.rfqId, rfqId));
      return NextResponse.json({ packages: result });
    }

    const result = await query.orderBy(desc(packages.createdAt));
    return NextResponse.json({ packages: result });
  } catch (err) {
    console.error("Packages GET error:", err);
    return NextResponse.json({ error: "Failed to fetch packages" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { rfqId, name, description, items } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Package name is required" }, { status: 400 });
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "At least one item is required" }, { status: 400 });
    }

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.description?.trim()) {
        return NextResponse.json({ error: `Item ${i + 1}: description is required` }, { status: 400 });
      }
      if (!item.quantity || Number(item.quantity) <= 0) {
        return NextResponse.json({ error: `Item ${i + 1}: quantity must be positive` }, { status: 400 });
      }
    }

    const result = await db
      .insert(packages)
      .values({
        rfqId: rfqId || null,
        name: name.trim(),
        description: description?.trim() || null,
        items: items.map((item: { itemNo?: string; description: string; unit?: string; quantity: number; remarks?: string }, idx: number) => ({
          itemNo: item.itemNo || String(idx + 1),
          description: String(item.description),
          unit: String(item.unit || "pcs"),
          quantity: Number(item.quantity),
          remarks: item.remarks ? String(item.remarks) : undefined,
        })),
        createdBy: session.user.id,
      })
      .returning();

    await logAudit({
      action: "package.created",
      entityType: "package",
      entityId: result[0].id,
      details: { name, rfqId: rfqId || null, itemCount: items.length },
    });

    return NextResponse.json({ package: result[0] }, { status: 201 });
  } catch (err) {
    console.error("Package POST error:", err);
    return NextResponse.json({ error: "Failed to create package" }, { status: 500 });
  }
}
