import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { suppliers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { NextResponse } from "next/server";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const supplierResult = await db
      .select({
        id: suppliers.id,
        name: suppliers.name,
        email: suppliers.email,
        isRegistered: suppliers.isRegistered,
      })
      .from(suppliers)
      .where(eq(suppliers.id, id))
      .limit(1);

    if (supplierResult.length === 0) {
      return NextResponse.json({ error: "Supplier not found" }, { status: 404 });
    }

    const supplier = supplierResult[0];

    if (supplier.isRegistered) {
      return NextResponse.json(
        { error: "Supplier is already registered" },
        { status: 400 },
      );
    }

    const registrationToken = uuidv4();

    await db
      .update(suppliers)
      .set({ registrationToken })
      .where(eq(suppliers.id, id));

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const registrationUrl = `${baseUrl}/portal/register?token=${registrationToken}`;

    return NextResponse.json({
      registrationUrl,
      supplier: {
        id: supplier.id,
        name: supplier.name,
        email: supplier.email,
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to generate invitation" }, { status: 500 });
  }
}
