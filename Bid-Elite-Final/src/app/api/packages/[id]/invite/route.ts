import { db } from "@/lib/db";
import {
  packages,
  packageInvitations,
  suppliers,
  companySettings,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { logAudit } from "@/lib/utils/audit";
import { randomBytes } from "crypto";
import { isSmtpConfigured, sendEmail } from "@/lib/email/smtp";
import { renderHtmlEmail } from "@/lib/email/html-template";

function generateAuthCode(): string {
  return randomBytes(3).toString("hex").slice(0, 6).toUpperCase();
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { supplierIds } = await request.json();

    if (!supplierIds || !Array.isArray(supplierIds) || supplierIds.length === 0) {
      return NextResponse.json({ error: "supplierIds is required" }, { status: 400 });
    }

    const pkgRows = await db.select().from(packages).where(eq(packages.id, id)).limit(1);
    if (!pkgRows.length) {
      return NextResponse.json({ error: "Package not found" }, { status: 404 });
    }
    const pkg = pkgRows[0];

    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const created: { id: string; authCode: string; shareLink: string; supplierId: string; supplierName: string; supplierEmail: string }[] = [];

    for (const supplierId of supplierIds) {
      const supplierRows = await db
        .select({ name: suppliers.name, email: suppliers.email })
        .from(suppliers)
        .where(eq(suppliers.id, supplierId))
        .limit(1);
      if (!supplierRows.length) continue;

      const supplier = supplierRows[0];

      let authCode = generateAuthCode();
      // Ensure uniqueness
      const existingCode = await db
        .select({ id: packageInvitations.id })
        .from(packageInvitations)
        .where(eq(packageInvitations.authCode, authCode))
        .limit(1);
      if (existingCode.length) {
        authCode = generateAuthCode();
      }

      const shareLink = randomBytes(16).toString("hex");

      const invResult = await db
        .insert(packageInvitations)
        .values({
          packageId: id,
          supplierId,
          authCode,
          shareLink,
          sentAt: new Date(),
        })
        .returning({ id: packageInvitations.id });

      created.push({
        id: invResult[0].id,
        authCode,
        shareLink,
        supplierId,
        supplierName: supplier.name,
        supplierEmail: supplier.email,
      });

      if (isSmtpConfigured()) {
        try {
          const companyRows = await db.select().from(companySettings).limit(1);
          const companyName = companyRows[0]?.name || "Elite Nexus";

          const textBody = [
            `Dear ${supplier.name},`,
            "",
            `You have been invited to submit pricing for the package "${pkg.name}".`,
            pkg.description ? `\n${pkg.description}` : "",
            "",
            `Your unique access code is: ${authCode}`,
            "",
            `Please visit: ${baseUrl}/portal/pricing?code=${authCode}`,
            "",
            "If you have any questions, please contact the Bidding Team.",
            "",
            `Best regards,`,
            companyName,
          ].join("\n");

          const html = renderHtmlEmail(textBody, `Pricing Invitation - ${pkg.name}`);

          await sendEmail({
            to: [supplier.email],
            subject: `Pricing Invitation - ${pkg.name}`,
            text: textBody,
            html,
          });
        } catch (smtpErr) {
          console.error("Failed to send invitation email:", smtpErr);
        }
      }
    }

    await logAudit({
      action: "package.invite_sent",
      entityType: "package",
      entityId: id,
      details: { supplierCount: created.length, packageName: pkg.name },
    });

    // Return all invitations for this package
    const allInvitations = await db
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

    return NextResponse.json({ invitations: allInvitations });
  } catch (err) {
    console.error("Invite error:", err);
    return NextResponse.json({ error: "Failed to send invitations" }, { status: 500 });
  }
}
