import { db } from "@/lib/db";
import { suppliers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { compare } from "bcryptjs";
import { signPortalToken, setPortalCookie } from "@/lib/auth/portal-auth";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 },
      );
    }

    const result = await db
      .select({
        id: suppliers.id,
        name: suppliers.name,
        email: suppliers.email,
        password: suppliers.password,
        isRegistered: suppliers.isRegistered,
        isActive: suppliers.isActive,
      })
      .from(suppliers)
      .where(eq(suppliers.email, email.trim().toLowerCase()))
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 },
      );
    }

    const supplier = result[0];

    if (!supplier.isActive) {
      return NextResponse.json(
        { error: "Account is deactivated. Please contact the administrator." },
        { status: 403 },
      );
    }

    if (!supplier.isRegistered || !supplier.password) {
      return NextResponse.json(
        { error: "Account not set up. Please use your registration link to set a password first." },
        { status: 401 },
      );
    }

    const isValid = await compare(password, supplier.password);
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 },
      );
    }

    const token = await signPortalToken(supplier.id, supplier.email, supplier.name);
    await setPortalCookie(token);

    await db
      .update(suppliers)
      .set({ lastLogin: new Date() })
      .where(eq(suppliers.id, supplier.id));

    return NextResponse.json({
      success: true,
      supplier: {
        id: supplier.id,
        name: supplier.name,
        email: supplier.email,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 },
    );
  }
}
