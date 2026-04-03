import { getPortalSession } from "@/lib/auth/portal-auth";
import { db } from "@/lib/db";
import { suppliers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { compare, hash } from "bcryptjs";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await getPortalSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await db
      .select({
        id: suppliers.id,
        name: suppliers.name,
        email: suppliers.email,
        phone: suppliers.phone,
        contactPerson: suppliers.contactPerson,
        address: suppliers.address,
        scopes: suppliers.scopes,
        isRegistered: suppliers.isRegistered,
        createdAt: suppliers.createdAt,
        lastLogin: suppliers.lastLogin,
      })
      .from(suppliers)
      .where(eq(suppliers.id, session.supplierId))
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json({ error: "Supplier not found" }, { status: 404 });
    }

    return NextResponse.json({ supplier: result[0] });
  } catch {
    return NextResponse.json({ error: "Failed to load profile" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getPortalSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const updates: Record<string, unknown> = {};

    if (body.name !== undefined) updates.name = body.name.trim();
    if (body.phone !== undefined) updates.phone = body.phone?.trim() || null;
    if (body.contactPerson !== undefined) updates.contactPerson = body.contactPerson?.trim() || null;
    if (body.address !== undefined) updates.address = body.address?.trim() || null;
    if (body.scopes !== undefined) updates.scopes = Array.isArray(body.scopes) ? body.scopes : [];

    if (body.currentPassword && body.newPassword) {
      const supplierResult = await db
        .select({ password: suppliers.password })
        .from(suppliers)
        .where(eq(suppliers.id, session.supplierId))
        .limit(1);

      if (supplierResult.length === 0 || !supplierResult[0].password) {
        return NextResponse.json({ error: "Cannot change password" }, { status: 400 });
      }

      const isValid = await compare(body.currentPassword, supplierResult[0].password);
      if (!isValid) {
        return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
      }

      if (body.newPassword.length < 8) {
        return NextResponse.json(
          { error: "New password must be at least 8 characters" },
          { status: 400 },
        );
      }

      updates.password = await hash(body.newPassword, 12);
    }

    if (Object.keys(updates).length > 0) {
      await db
        .update(suppliers)
        .set(updates)
        .where(eq(suppliers.id, session.supplierId));
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
