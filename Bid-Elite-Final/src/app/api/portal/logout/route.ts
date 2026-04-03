import { clearPortalCookie } from "@/lib/auth/portal-auth";
import { NextResponse } from "next/server";

export async function POST() {
  await clearPortalCookie();
  return NextResponse.json({ success: true });
}
