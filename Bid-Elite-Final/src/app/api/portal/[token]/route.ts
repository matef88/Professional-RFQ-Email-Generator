import { db } from "@/lib/db";
import { rfqs, rfqSuppliers, suppliers, quotes, companySettings } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params;

    const rsResult = await db
      .select({
        id: rfqSuppliers.id,
        rfqId: rfqSuppliers.rfqId,
        supplierId: rfqSuppliers.supplierId,
        status: rfqSuppliers.status,
        viewedAt: rfqSuppliers.viewedAt,
        quotedAt: rfqSuppliers.quotedAt,
        supplierName: suppliers.name,
        supplierEmail: suppliers.email,
        rfqPackageName: rfqs.packageName,
        rfqReference: rfqs.reference,
        rfqDeadline: rfqs.deadline,
        rfqDetails: rfqs.details,
        rfqPackageLink: rfqs.packageLink,
        rfqDocsLink: rfqs.docsLink,
        rfqStatus: rfqs.status,
      })
      .from(rfqSuppliers)
      .innerJoin(rfqs, eq(rfqSuppliers.rfqId, rfqs.id))
      .innerJoin(suppliers, eq(rfqSuppliers.supplierId, suppliers.id))
      .where(eq(rfqSuppliers.portalToken, token))
      .limit(1);

    if (rsResult.length === 0) {
      return NextResponse.json({ error: "Invalid portal link" }, { status: 404 });
    }

    const rs = rsResult[0];

    if (rs.status === "pending") {
      await db
        .update(rfqSuppliers)
        .set({ status: "viewed", viewedAt: new Date() })
        .where(eq(rfqSuppliers.id, rs.id));
    }

    const companyRows = await db.select().from(companySettings).limit(1);
    const company = companyRows[0] ?? null;

    const quoteRows = await db
      .select({
        id: quotes.id,
        totalAmount: quotes.totalAmount,
        currency: quotes.currency,
        deliveryDays: quotes.deliveryDays,
        validityDays: quotes.validityDays,
        coverLetter: quotes.coverLetter,
        submittedAt: quotes.submittedAt,
      })
      .from(quotes)
      .where(
        and(eq(quotes.rfqId, rs.rfqId), eq(quotes.supplierId, rs.supplierId)),
      )
      .limit(1);

    return NextResponse.json({
      rfq: {
        packageName: rs.rfqPackageName,
        reference: rs.rfqReference,
        deadline: rs.rfqDeadline,
        details: rs.rfqDetails,
        packageLink: rs.rfqPackageLink,
        docsLink: rs.rfqDocsLink,
        status: rs.rfqStatus,
      },
      supplier: {
        name: rs.supplierName,
        email: rs.supplierEmail,
      },
      supplierStatus: rs.status === "pending" ? "viewed" : rs.status,
      quote: quoteRows[0] ?? null,
      company: company
        ? {
            name: company.name,
            tagline: company.tagline,
            email: company.email,
            website: company.website,
            phone: company.phone,
            city: company.city,
            country: company.country,
            docsLink: company.docsLink,
            logoUrl: company.logoUrl,
          }
        : null,
    });
  } catch {
    return NextResponse.json({ error: "Failed to load RFQ" }, { status: 500 });
  }
}
