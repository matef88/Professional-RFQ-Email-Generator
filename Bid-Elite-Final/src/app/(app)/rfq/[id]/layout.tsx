import Link from "next/link";
import { db } from "@/lib/db";
import { rfqs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export default async function RfqDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let packageName = "RFQ";
  try {
    const result = await db
      .select({ packageName: rfqs.packageName })
      .from(rfqs)
      .where(eq(rfqs.id, id))
      .limit(1);
    if (result.length > 0) {
      packageName = result[0].packageName;
    }
  } catch {
    // fall through with default name
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <Link
          href="/rfq"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-text-muted transition-colors hover:bg-bg-elevated hover:text-text-secondary"
          title="Back to RFQs"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 19.5 8.25 12l7.5-7.5"
            />
          </svg>
        </Link>
        <nav className="flex items-center gap-1.5 text-sm">
          <Link
            href="/"
            className="text-text-muted transition-colors hover:text-text-secondary"
          >
            Dashboard
          </Link>
          <span className="text-text-dim">/</span>
          <Link
            href="/rfq"
            className="text-text-muted transition-colors hover:text-text-secondary"
          >
            RFQs
          </Link>
          <span className="text-text-dim">/</span>
          <span className="text-text-primary font-medium">{packageName}</span>
        </nav>
      </div>
      {children}
    </div>
  );
}
