import { db } from "@/lib/db";
import {
  packages,
  rfqs,
  packageInvitations,
  packageSubmissions,
} from "@/lib/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import PackagesListClient from "./packages-list-client";

export const dynamic = "force-dynamic";

export default async function PackagesPage() {
  await getServerSession(authOptions);

  let packageList: {
    id: string;
    name: string;
    description: string | null;
    rfqId: string | null;
    rfqPackageName: string | null;
    rfqReference: string | null;
    itemCount: number;
    createdAt: Date;
  }[] = [];

  const invitedCountMap: Record<string, number> = {};
  const submittedCountMap: Record<string, number> = {};

  try {
    const rows = await db
      .select({
        id: packages.id,
        name: packages.name,
        description: packages.description,
        rfqId: packages.rfqId,
        rfqPackageName: rfqs.packageName,
        rfqReference: rfqs.reference,
        items: packages.items,
        createdAt: packages.createdAt,
      })
      .from(packages)
      .leftJoin(rfqs, eq(packages.rfqId, rfqs.id))
      .orderBy(desc(packages.createdAt));

    packageList = rows.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      rfqId: r.rfqId,
      rfqPackageName: r.rfqPackageName,
      rfqReference: r.rfqReference,
      itemCount: Array.isArray(r.items) ? r.items.length : 0,
      createdAt: r.createdAt,
    }));

    if (packageList.length > 0) {
      const invCounts = await db
        .select({
          packageId: packageInvitations.packageId,
          count: sql<number>`count(*)::int`,
        })
        .from(packageInvitations)
        .groupBy(packageInvitations.packageId);

      for (const r of invCounts) {
        invitedCountMap[r.packageId] = r.count;
      }

      const subCounts = await db
        .select({
          packageId: packageSubmissions.packageId,
          count: sql<number>`count(distinct ${packageSubmissions.supplierId})::int`,
        })
        .from(packageSubmissions)
        .groupBy(packageSubmissions.packageId);

      for (const r of subCounts) {
        submittedCountMap[r.packageId] = r.count;
      }
    }
  } catch {
    // DB might not be connected yet
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-text-primary">Packages</h1>
        <p className="text-sm text-text-muted">
          Create BOQ packages and share with suppliers for pricing
        </p>
      </div>

      <PackagesListClient
        packages={packageList}
        invitedCountMap={invitedCountMap}
        submittedCountMap={submittedCountMap}
      />
    </div>
  );
}
