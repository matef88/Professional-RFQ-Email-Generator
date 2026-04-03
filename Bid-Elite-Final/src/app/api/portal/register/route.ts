import { db } from "@/lib/db";
import { suppliers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { hash } from "bcryptjs";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    const result = await db
      .select({
        id: suppliers.id,
        name: suppliers.name,
        email: suppliers.email,
        isRegistered: suppliers.isRegistered,
      })
      .from(suppliers)
      .where(eq(suppliers.registrationToken, token))
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Invalid or expired registration link" },
        { status: 404 },
      );
    }

    if (result[0].isRegistered) {
      return NextResponse.json(
        { error: "This account has already been registered" },
        { status: 400 },
      );
    }

    return NextResponse.json({
      supplier: {
        supplierId: result[0].id,
        name: result[0].name,
        email: result[0].email,
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to validate token" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, password } = body;

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token and password are required" },
        { status: 400 },
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 },
      );
    }

    const result = await db
      .select({
        id: suppliers.id,
        isRegistered: suppliers.isRegistered,
      })
      .from(suppliers)
      .where(eq(suppliers.registrationToken, token))
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Invalid or expired registration link" },
        { status: 404 },
      );
    }

    if (result[0].isRegistered) {
      return NextResponse.json(
        { error: "This account has already been registered" },
        { status: 400 },
      );
    }

    const hashedPassword = await hash(password, 12);

    await db
      .update(suppliers)
      .set({
        password: hashedPassword,
        isRegistered: true,
        registrationToken: null,
      })
      .where(eq(suppliers.id, result[0].id));

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
