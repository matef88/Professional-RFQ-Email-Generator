import { db } from "@/lib/db";
import {
  packageInvitations,
  packages,
  packageSubmissions,
  suppliers,
} from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ invitationId: string }> },
) {
  try {
    const { invitationId } = await params;

    const invRows = await db
      .select({
        id: packageInvitations.id,
        packageId: packageInvitations.packageId,
        supplierId: packageInvitations.supplierId,
        authCode: packageInvitations.authCode,
        status: packageInvitations.status,
        supplierName: suppliers.name,
        supplierEmail: suppliers.email,
      })
      .from(packageInvitations)
      .innerJoin(suppliers, eq(packageInvitations.supplierId, suppliers.id))
      .where(eq(packageInvitations.id, invitationId))
      .limit(1);

    if (!invRows.length) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
    }

    const inv = invRows[0];

    const pkgRows = await db
      .select({
        id: packages.id,
        name: packages.name,
        description: packages.description,
        items: packages.items,
      })
      .from(packages)
      .where(eq(packages.id, inv.packageId))
      .limit(1);

    if (!pkgRows.length) {
      return NextResponse.json({ error: "Package not found" }, { status: 404 });
    }

    const submissions = await db
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

    return NextResponse.json({
      invitation: {
        id: inv.id,
        status: inv.status,
        supplierName: inv.supplierName,
        supplierEmail: inv.supplierEmail,
      },
      package: pkgRows[0],
      submissions,
      currentRevision: submissions.length > 0 ? submissions[0].revision : 0,
    });
  } catch (err) {
    console.error("Pricing GET error:", err);
    return NextResponse.json({ error: "Failed to load pricing data" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ invitationId: string }> },
) {
  try {
    const { invitationId } = await params;

    const invRows = await db
      .select({
        id: packageInvitations.id,
        packageId: packageInvitations.packageId,
        supplierId: packageInvitations.supplierId,
        status: packageInvitations.status,
      })
      .from(packageInvitations)
      .where(eq(packageInvitations.id, invitationId))
      .limit(1);

    if (!invRows.length) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
    }

    const inv = invRows[0];
    const body = await request.json();
    const { prices, currency } = body;

    if (!prices || !Array.isArray(prices) || prices.length === 0) {
      return NextResponse.json({ error: "Prices are required" }, { status: 400 });
    }

    for (let i = 0; i < prices.length; i++) {
      const p = prices[i];
      if (p.unitPrice === undefined || p.unitPrice === null || Number(p.unitPrice) < 0) {
        return NextResponse.json(
          { error: `Item ${i + 1}: unit price must be non-negative` },
          { status: 400 },
        );
      }
    }

    const totalAmount = prices.reduce(
      (sum: number, p: { totalPrice: number }) => sum + Number(p.totalPrice || 0),
      0,
    );

    // Determine revision number
    const existingSubs = await db
      .select({ revision: packageSubmissions.revision })
      .from(packageSubmissions)
      .where(eq(packageSubmissions.invitationId, invitationId))
      .orderBy(desc(packageSubmissions.revision))
      .limit(1);

    const nextRevision = existingSubs.length > 0 ? existingSubs[0].revision + 1 : 1;

    const result = await db
      .insert(packageSubmissions)
      .values({
        invitationId,
        supplierId: inv.supplierId,
        packageId: inv.packageId,
        revision: nextRevision,
        prices: prices.map((p: { itemNo: string; unitPrice: number; totalPrice: number; notes?: string }) => ({
          itemNo: String(p.itemNo),
          unitPrice: Number(p.unitPrice),
          totalPrice: Number(p.totalPrice),
          notes: p.notes || undefined,
        })),
        totalAmount: String(totalAmount.toFixed(2)),
        currency: currency || "SAR",
      })
      .returning();

    // Update invitation status
    const newStatus = nextRevision > 1 ? "revised" : "submitted";
    await db
      .update(packageInvitations)
      .set({ status: newStatus as "pending" | "viewed" | "submitted" | "revised" })
      .where(eq(packageInvitations.id, invitationId));

    return NextResponse.json(
      { submission: result[0], revision: nextRevision },
      { status: 201 },
    );
  } catch (err) {
    console.error("Pricing POST error:", err);
    return NextResponse.json({ error: "Failed to submit prices" }, { status: 500 });
  }
}
