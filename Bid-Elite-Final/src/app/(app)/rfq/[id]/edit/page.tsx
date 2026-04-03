import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { rfqs, rfqSuppliers, suppliers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import RfqForm from "@/components/rfq/rfq-form";
import { getCompanySettings } from "@/lib/company";

export default async function EditRfqPage({ params }: { params: Promise<{ id: string }> }) {
  await getServerSession(authOptions);
  const { id } = await params;

  let rfqData: Record<string, unknown> | null = null;
  let existingSupplierIds: string[] = [];
  let supplierList: Array<{ id: string; name: string; email: string; scopes: string[] | null }> = [];
  let companyData: { name: string; tagline?: string | null; city?: string | null; country?: string | null; email?: string | null } | null = null;

  try {
    const rfqResult = await db.select().from(rfqs).where(eq(rfqs.id, id)).limit(1);

    if (rfqResult.length === 0) {
      notFound();
    }

    rfqData = rfqResult[0];

    if ((rfqData as { status: string }).status === "closed") {
      redirect(`/rfq/${id}`);
    }

    const links = await db
      .select({ supplierId: rfqSuppliers.supplierId })
      .from(rfqSuppliers)
      .where(eq(rfqSuppliers.rfqId, id));

    existingSupplierIds = links.map((l) => l.supplierId);

    supplierList = await db
      .select({ id: suppliers.id, name: suppliers.name, email: suppliers.email, scopes: suppliers.scopes })
      .from(suppliers);

    const company = await getCompanySettings();
    if (company) {
      companyData = {
        name: company.name,
        tagline: company.tagline,
        city: company.city,
        country: company.country,
        email: company.email,
      };
    }
  } catch (e) {
    if (e && typeof e === "object" && "digest" in e) throw e;
  }

  if (!rfqData) notFound();
  if (!companyData) companyData = { name: "Elite" };

  const rfq = rfqData as {
    id: string;
    packageName: string;
    reference: string | null;
    deadline: string | null;
    template: string | null;
    details: string | null;
    packageLink: string | null;
    docsLink: string | null;
  };

  return (
    <div className="space-y-6">
      <div>
        <Link href="/rfq" className="text-xs text-text-muted hover:text-text-secondary">
          &larr; RFQs
        </Link>
        <h1 className="mt-1 text-xl font-bold text-text-primary">Edit RFQ</h1>
        <p className="text-sm text-text-muted">{rfq.packageName}</p>
      </div>

      <RfqForm
        suppliers={supplierList}
        company={companyData}
        initialData={{
          id: rfq.id,
          packageName: rfq.packageName,
          reference: rfq.reference ?? "",
          deadline: rfq.deadline ?? "",
          template: rfq.template ?? "standard",
          details: rfq.details ?? "",
          packageLink: rfq.packageLink ?? "",
          docsLink: rfq.docsLink ?? "",
          supplierIds: existingSupplierIds,
        }}
      />
    </div>
  );
}
