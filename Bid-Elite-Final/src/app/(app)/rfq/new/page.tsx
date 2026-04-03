import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { suppliers } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { getCompanySettings } from "@/lib/company";
import Link from "next/link";
import RfqForm from "@/components/rfq/rfq-form";

export default async function NewRfqPage() {
  await getServerSession(authOptions);

  let supplierList: Array<{ id: string; name: string; email: string; scopes: string[] | null }> = [];
  let companyData: { name: string; tagline: string | null; city: string | null; country: string | null; email: string | null } = {
    name: "Elite",
    tagline: null,
    city: null,
    country: null,
    email: null,
  };

  try {
    supplierList = await db
      .select({ id: suppliers.id, name: suppliers.name, email: suppliers.email, scopes: suppliers.scopes })
      .from(suppliers)
      .orderBy(desc(suppliers.createdAt));

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
  } catch {
    // DB not connected yet
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/rfq" className="text-xs text-text-muted hover:text-text-secondary">
          &larr; RFQs
        </Link>
        <h1 className="mt-1 text-xl font-bold text-text-primary">New RFQ</h1>
        <p className="text-sm text-text-muted">Create a new request for quotation</p>
      </div>

      <RfqForm suppliers={supplierList} company={companyData} />
    </div>
  );
}
