import { db } from "@/lib/db";
import {
  packages,
  packageInvitations,
  packageSubmissions,
  suppliers,
  rfqs,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const pkgRows = await db
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
      .leftJoin(rfqs, eq(packages.rfqId, rfqs.id))
      .where(eq(packages.id, id))
      .limit(1);

    if (!pkgRows.length) {
      return NextResponse.json({ error: "Package not found" }, { status: 404 });
    }

    const invitations = await db
      .select({
        id: packageInvitations.id,
        authCode: packageInvitations.authCode,
        shareLink: packageInvitations.shareLink,
        status: packageInvitations.status,
        sentAt: packageInvitations.sentAt,
        lastAccessedAt: packageInvitations.lastAccessedAt,
        supplierId: packageInvitations.supplierId,
        supplierName: suppliers.name,
        supplierEmail: suppliers.email,
      })
      .from(packageInvitations)
      .innerJoin(suppliers, eq(packageInvitations.supplierId, suppliers.id))
      .where(eq(packageInvitations.packageId, id));

    const submissions = await db
      .select({
        id: packageSubmissions.id,
        invitationId: packageSubmissions.invitationId,
        supplierId: packageSubmissions.supplierId,
        supplierName: suppliers.name,
        revision: packageSubmissions.revision,
        prices: packageSubmissions.prices,
        totalAmount: packageSubmissions.totalAmount,
        currency: packageSubmissions.currency,
        submittedAt: packageSubmissions.submittedAt,
      })
      .from(packageSubmissions)
      .innerJoin(suppliers, eq(packageSubmissions.supplierId, suppliers.id))
      .where(eq(packageSubmissions.packageId, id));

    return NextResponse.json({
      package: pkgRows[0],
      invitations,
      submissions,
    });
  } catch (err) {
    console.error("Package GET error:", err);
    return NextResponse.json({ error: "Failed to fetch package" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, description, items } = body;

    const existing = await db
      .select({ id: packages.id })
      .from(packages)
      .where(eq(packages.id, id))
      .limit(1);

    if (!existing.length) {
      return NextResponse.json({ error: "Package not found" }, { status: 404 });
    }

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (name !== undefined) updates.name = name.trim();
    if (description !== undefined) updates.description = description?.trim() || null;
    if (items !== undefined) {
      updates.items = items.map((item: { itemNo?: string; description: string; unit?: string; quantity: number; remarks?: string }, idx: number) => ({
        itemNo: item.itemNo || String(idx + 1),
        description: String(item.description),
        unit: String(item.unit || "pcs"),
        quantity: Number(item.quantity),
        remarks: item.remarks ? String(item.remarks) : undefined,
      }));
    }

    const result = await db
      .update(packages)
      .set(updates)
      .where(eq(packages.id, id))
      .returning();

    return NextResponse.json({ package: result[0] });
  } catch (err) {
    console.error("Package PATCH error:", err);
    return NextResponse.json({ error: "Failed to update package" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const hasSubmissions = await db
      .select({ id: packageSubmissions.id })
      .from(packageSubmissions)
      .where(eq(packageSubmissions.packageId, id))
      .limit(1);

    if (hasSubmissions.length) {
      return NextResponse.json(
        { error: "Cannot delete a package that has submissions" },
        { status: 400 },
      );
    }

    await db
      .delete(packageInvitations)
      .where(eq(packageInvitations.packageId, id));

    await db.delete(packages).where(eq(packages.id, id));

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Package DELETE error:", err);
    return NextResponse.json({ error: "Failed to delete package" }, { status: 500 });
  }
}
