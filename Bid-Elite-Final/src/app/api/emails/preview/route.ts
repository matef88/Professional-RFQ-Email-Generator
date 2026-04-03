import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { NextResponse } from "next/server";
import { buildSubject, generateEmailBody, type EmailFormData } from "@/lib/email/render";
import { generateMailtoUrl } from "@/lib/email/mailto";
import { getCompanySettings } from "@/lib/company";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      template,
      packageName,
      reference,
      deadline,
      packageLink,
      docsLink,
      details,
      supplierEmail,
      supplierName,
    } = body;

    if (!packageName?.trim()) {
      return NextResponse.json({ error: "Package name is required" }, { status: 400 });
    }

    const company = await getCompanySettings();
    if (!company) {
      return NextResponse.json({ error: "Company settings not configured" }, { status: 400 });
    }

    const formData: EmailFormData = {
      template: template || "standard",
      packageName: packageName.trim(),
      reference: reference?.trim() || "",
      deadline: deadline || "",
      packageLink: packageLink?.trim() || "",
      docsLink: docsLink?.trim() || company.docsLink || "",
      details: details?.trim() || "",
    };

    const subject = buildSubject(
      formData.template,
      formData.packageName,
      formData.reference,
      formData.deadline,
    );

    const bodyText = generateEmailBody(
      formData,
      company,
      supplierName || "[Supplier Name]",
    );

    const mailtoUrl = supplierEmail
      ? generateMailtoUrl(supplierEmail, "", subject, bodyText)
      : "";

    return NextResponse.json({
      subject,
      bodyText,
      mailtoUrl,
    });
  } catch {
    return NextResponse.json({ error: "Failed to generate preview" }, { status: 500 });
  }
}
