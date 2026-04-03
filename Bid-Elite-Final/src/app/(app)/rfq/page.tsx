import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { rfqs, users } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { inArray } from "drizzle-orm";
import RfqSplitLayout from "@/components/rfq/rfq-split-layout";

export default async function RfqPage({
  searchParams,
}: {
  searchParams: Promise<{ selected?: string }>;
}) {
  await getServerSession(authOptions);

  const params = await searchParams;
  const selectedRfqId = params.selected ?? null;

  let rfqList: Array<{
    id: string;
    packageName: string;
    reference: string | null;
    deadline: string | null;
    template: string | null;
    status: string;
    createdBy: string | null;
    createdAt: Date;
    updatedAt: Date;
  }> = [];

  let creatorMap: Record<string, string> = {};

  try {
    rfqList = await db
      .select({
        id: rfqs.id,
        packageName: rfqs.packageName,
        reference: rfqs.reference,
        deadline: rfqs.deadline,
        template: rfqs.template,
        status: rfqs.status,
        createdBy: rfqs.createdBy,
        createdAt: rfqs.createdAt,
        updatedAt: rfqs.updatedAt,
      })
      .from(rfqs)
      .orderBy(desc(rfqs.createdAt));

    const creatorIds = [...new Set(rfqList.map((r) => r.createdBy).filter(Boolean))] as string[];

    if (creatorIds.length > 0) {
      const creators = await db
        .select({ id: users.id, name: users.name })
        .from(users)
        .where(inArray(users.id, creatorIds));

      creatorMap = Object.fromEntries(creators.map((c) => [c.id, c.name]));
    }
  } catch {
    // DB not connected yet
  }

  return (
    <RfqSplitLayout
      rfqs={rfqList}
      selectedRfqId={selectedRfqId}
      creatorMap={creatorMap}
    />
  );
}
