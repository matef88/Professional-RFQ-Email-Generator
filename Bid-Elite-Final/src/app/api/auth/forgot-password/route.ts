import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { randomBytes } from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase().trim()))
      .limit(1);

    if (user.length && user[0].password) {
      const resetToken = randomBytes(32).toString("hex");
      const resetTokenExpiry = new Date(Date.now() + 3600000);

      await db
        .update(users)
        .set({ resetToken, resetTokenExpiry })
        .where(eq(users.id, user[0].id));

      if (process.env.SMTP_HOST) {
        try {
          const { sendEmail } = await import("@/lib/email/smtp");
          const { renderHtmlEmail } = await import("@/lib/email/html-template");
          const baseUrl = process.env.NEXTAUTH_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
          const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;

          const textBody = `You requested a password reset for your Elite Nexus Bid Platform account.\n\nClick here to reset: ${resetUrl}\n\nThis link expires in 1 hour. If you didn't request this, ignore this email.`;

          await sendEmail({
            to: [email],
            subject: "Password Reset — Elite Nexus Bid Platform",
            text: textBody,
            html: renderHtmlEmail(textBody, "Password Reset"),
          });
        } catch (smtpErr) {
          console.error("Failed to send reset email via SMTP:", smtpErr);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Forgot password error:", err);
    return NextResponse.json({ success: true });
  }
}
