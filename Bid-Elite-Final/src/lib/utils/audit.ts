import { db } from "@/lib/db";
import { auditLog } from "@/lib/db/schema";
import { headers } from "next/headers";

export async function logAudit({
  userId,
  action,
  entityType,
  entityId,
  details,
  ipAddress,
}: {
  userId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
}): Promise<void> {
  const headersList = await headers();
  const ip = ipAddress ?? headersList.get("x-forwarded-for") ?? null;
  const ipAddr = ip?.split(",")[0]?.trim() ?? "unknown";

  await db.insert(auditLog).values({
    userId: userId ?? null,
    action,
    entityType,
    entityId,
    details: details ?? null,
    ipAddress: ipAddr,
  });
}

export const AUDIT_ACTIONS = {
  RFQ_CREATED: "rfq.created",
  RFQ_UPDATED: "rfq.updated",
  RFQ_SENT: "rfq.sent",
  RFQ_CLOSED: "rfq.closed",
  RFQ_AWARDED: "rfq.awarded",
  EMAIL_SENT: "email.sent",
  QUOTE_SUBMITTED: "quote.submitted",
  QUOTE_REVIEWED: "quote.reviewed",
  QUOTE_SCORED: "quote.scored",
  SUPPLIER_CREATED: "supplier.created",
  SUPPLIER_UPDATED: "supplier.updated",
  SETTINGS_UPDATED: "settings.updated",
} as const;
