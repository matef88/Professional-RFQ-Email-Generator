import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { companySettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const settings = await db.select().from(companySettings).limit(1);

    if (settings.length === 0) {
      return NextResponse.json({ settings: null });
    }

    return NextResponse.json({ settings: settings[0] });
  } catch {
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if ((session.user as { role?: string }).role !== "admin") {
      return NextResponse.json({ error: "Only admins can update settings" }, { status: 403 });
    }

    const body = await request.json();

    const existing = await db.select().from(companySettings).limit(1);

    if (existing.length === 0) {
      await db.insert(companySettings).values({
        name: body.name ?? "",
        shortName: body.shortName ?? "",
        tagline: body.tagline ?? null,
        email: body.email ?? null,
        website: body.website ?? null,
        phone: body.phone ?? null,
        city: body.city ?? null,
        country: body.country ?? null,
        docsLink: body.docsLink ?? null,
        logoUrl: body.logoUrl ?? null,
      });
    } else {
      await db
        .update(companySettings)
        .set({
          ...body,
          updatedAt: new Date(),
        })
        .where(eq(companySettings.id, existing[0].id));
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
