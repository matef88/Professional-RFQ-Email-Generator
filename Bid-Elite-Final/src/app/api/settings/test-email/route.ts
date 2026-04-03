import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { NextResponse } from "next/server";
import { sendEmail, isSmtpConfigured } from "@/lib/email/smtp";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if ((session.user as { role?: string }).role !== "admin") {
      return NextResponse.json({ error: "Only admins can send test emails" }, { status: 403 });
    }

    if (!isSmtpConfigured()) {
      return NextResponse.json({ error: "SMTP is not configured" }, { status: 400 });
    }

    const body = await request.json();
    const testEmail = body.testEmail as string | undefined;

    if (!testEmail) {
      return NextResponse.json({ error: "Test email address is required" }, { status: 400 });
    }

    const result = await sendEmail({
      to: [testEmail],
      subject: "Bid Elite — SMTP Test Email",
      text: `This is a test email from Bid Elite (bid.elite-n.com).\n\nIf you received this email, your SMTP configuration is working correctly.\n\nSent at: ${new Date().toISOString()}`,
    });

    if (result.success) {
      return NextResponse.json({ success: true, messageId: result.messageId });
    }

    return NextResponse.json({ success: false, error: result.error }, { status: 500 });
  } catch {
    return NextResponse.json({ error: "Failed to send test email" }, { status: 500 });
  }
}
