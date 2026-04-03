import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { suppliers } from "@/lib/db/schema";
import { desc, eq, and, ilike, count, or, sql, arrayContains } from "drizzle-orm";
import { NextResponse } from "next/server";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const category = searchParams.get("category");
    const scope = searchParams.get("scope");
    const isActive = searchParams.get("isActive");
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "20");
    const offset = (page - 1) * limit;

    const conditions = [];

    if (search) {
      conditions.push(
        or(
          ilike(suppliers.name, `%${search}%`),
          ilike(suppliers.email, `%${search}%`),
          ilike(suppliers.category, `%${search}%`)
        )!
      );
    }

    if (category) {
      conditions.push(eq(suppliers.category, category));
    }

    if (scope) {
      conditions.push(arrayContains(suppliers.scopes, [scope]));
    }

    if (isActive !== null && isActive !== "") {
      conditions.push(eq(suppliers.isActive, isActive === "true"));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const result = await db
      .select({
        id: suppliers.id,
        name: suppliers.name,
        email: suppliers.email,
        phone: suppliers.phone,
        contactPerson: suppliers.contactPerson,
        category: suppliers.category,
        scopes: suppliers.scopes,
        isActive: suppliers.isActive,
        createdAt: suppliers.createdAt,
      })
      .from(suppliers)
      .where(whereClause)
      .orderBy(desc(suppliers.createdAt))
      .limit(limit)
      .offset(offset);

    const countResult = await db
      .select({ value: count() })
      .from(suppliers)
      .where(whereClause);

    return NextResponse.json({
      suppliers: result,
      total: countResult[0]?.value ?? 0,
      page,
      limit,
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch suppliers" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    if (!userId) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const body = await request.json();
    const { name, email, phone, contactPerson, address, category, scopes, notes } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    if (!email?.trim()) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    if (!EMAIL_REGEX.test(email.trim())) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    const portalToken = crypto.randomUUID();

    const result = await db
      .insert(suppliers)
      .values({
        name: name.trim(),
        email: email.trim(),
        phone: phone?.trim() || null,
        contactPerson: contactPerson?.trim() || null,
        address: address?.trim() || null,
        category: category?.trim() || null,
        scopes: Array.isArray(scopes) ? scopes : [],
        notes: notes?.trim() || null,
        portalToken,
        createdBy: userId,
      })
      .returning({
        id: suppliers.id,
        name: suppliers.name,
        email: suppliers.email,
        phone: suppliers.phone,
        contactPerson: suppliers.contactPerson,
        address: suppliers.address,
        category: suppliers.category,
        scopes: suppliers.scopes,
        notes: suppliers.notes,
        portalToken: suppliers.portalToken,
        isActive: suppliers.isActive,
        createdAt: suppliers.createdAt,
      });

    return NextResponse.json({ supplier: result[0] }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create supplier" }, { status: 500 });
  }
}
