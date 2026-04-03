import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { suppliers, rfqSuppliers, quotes } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { inArray } from "drizzle-orm";
import SupplierListClient from "./supplier-list-client";

export const dynamic = "force-dynamic";

export default async function SuppliersPage() {
  await getServerSession(authOptions);

  let supplierList: Array<{
    id: string;
    name: string;
    email: string;
    phone: string | null;
    contactPerson: string | null;
    category: string | null;
    scopes: string[] | null;
    isActive: boolean;
    createdAt: Date;
  }> = [];

  const rfqCountMap: Record<string, number> = {};
  const quoteCountMap: Record<string, number> = {};

  try {
      supplierList = await db
      .select({
        id: suppliers.id,
        name: suppliers.name,
        email: suppliers.email,
        phone: suppliers.phone,
        contactPerson: suppliers.contactPerson,
        category: suppliers.category,
        scopes: suppliers.scopes,
        isActive: suppliers.isActive,
        isRegistered: suppliers.isRegistered,
        createdAt: suppliers.createdAt,
      })
      .from(suppliers)
      .orderBy(desc(suppliers.createdAt));

    if (supplierList.length > 0) {
      const supplierIds = supplierList.map((s) => s.id);

      const rfqCounts = await db
        .select({
          supplierId: rfqSuppliers.supplierId,
          count: rfqSuppliers.id,
        })
        .from(rfqSuppliers)
        .where(inArray(rfqSuppliers.supplierId, supplierIds));

      for (const r of rfqCounts) {
        rfqCountMap[r.supplierId] = (rfqCountMap[r.supplierId] ?? 0) + 1;
      }

      const quoteCounts = await db
        .select({
          supplierId: quotes.supplierId,
          count: quotes.id,
        })
        .from(quotes)
        .where(inArray(quotes.supplierId, supplierIds));

      for (const q of quoteCounts) {
        quoteCountMap[q.supplierId] = (quoteCountMap[q.supplierId] ?? 0) + 1;
      }
    }
  } catch {
    // DB not connected yet
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-text-primary">Suppliers</h1>
        <p className="text-sm text-text-muted">Manage your supplier contacts</p>
      </div>

      <SupplierListClient
        suppliers={supplierList}
        rfqCountMap={rfqCountMap}
        quoteCountMap={quoteCountMap}
      />
    </div>
  );
}
