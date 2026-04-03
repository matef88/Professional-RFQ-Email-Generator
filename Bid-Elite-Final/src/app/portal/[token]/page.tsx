import { notFound } from "next/navigation";
import RfqView, { RfqData, CompanyData } from "@/components/portal/rfq-view";
import PortalClientPage from "./portal-client";

interface PortalData {
  rfq: RfqData;
  supplier: { name: string; email: string };
  supplierStatus: string;
  quote: {
    id: string;
    totalAmount: string | null;
    currency: string | null;
    deliveryDays: number | null;
    validityDays: number | null;
    coverLetter: string | null;
    submittedAt: string;
  } | null;
  company: CompanyData | null;
}

export default async function PortalPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/portal/${token}`,
    { cache: "no-store" },
  );

  if (res.status === 404) {
    notFound();
  }

  if (!res.ok) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-gray-900">Something went wrong</h1>
          <p className="mt-2 text-gray-500">Please try again later.</p>
        </div>
      </div>
    );
  }

  const data: PortalData = await res.json();
  const isClosed = data.rfq.status === "closed";
  const hasQuoted = data.supplierStatus === "quoted";

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-lg font-bold text-gray-900">Request for Quotation</h1>
            <p className="text-sm text-gray-500">
              Invited as <span className="font-medium text-gray-700">{data.supplier.name}</span>
            </p>
          </div>
          {data.company && (
            <div className="text-right">
              <p className="font-semibold text-gray-900">{data.company.name}</p>
              {data.company.tagline && (
                <p className="text-xs text-gray-500">{data.company.tagline}</p>
              )}
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-8">
        <RfqView rfq={data.rfq} company={data.company} />

        <div className="mt-8">
          {isClosed ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-5 py-4 text-center">
              <svg className="mx-auto h-8 w-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <p className="mt-2 font-medium text-red-700">
                This RFQ is no longer accepting quotes
              </p>
            </div>
          ) : hasQuoted && data.quote ? (
            <div className="rounded-lg border border-green-200 bg-green-50 px-5 py-4">
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="font-medium text-green-700">
                  You have already submitted a quote on{" "}
                  {new Date(data.quote.submittedAt).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
              <PortalClientPage quote={data.quote} />
            </div>
          ) : (
            <a
              href={`/portal/${token}/submit`}
              className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-8 py-3 text-base font-medium text-white shadow-md transition-colors hover:bg-amber-700"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Submit Your Quote
            </a>
          )}
        </div>
      </main>

      <footer className="mt-auto border-t border-gray-200 bg-white py-4 text-center text-xs text-gray-500">
        Powered by {data.company?.name || "Bid Elite"}
      </footer>
    </div>
  );
}
