import { notFound } from "next/navigation";
import QuoteForm from "@/components/portal/quote-form";

export default async function SubmitQuotePage({
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

  const data = await res.json();

  if (data.rfq.status === "closed") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-gray-900">This RFQ is closed</h1>
          <p className="mt-2 text-gray-500">This RFQ is no longer accepting quotes.</p>
          <a
            href={`/portal/${token}`}
            className="mt-4 inline-block text-amber-600 hover:underline"
          >
            View RFQ Details
          </a>
        </div>
      </div>
    );
  }

  if (data.supplierStatus === "quoted") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-gray-900">Quote Already Submitted</h1>
          <p className="mt-2 text-gray-500">
            You have already submitted a quote for this RFQ.
          </p>
          <a
            href={`/portal/${token}`}
            className="mt-4 inline-block text-amber-600 hover:underline"
          >
            View RFQ Details
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto max-w-4xl px-6 py-4">
          <a
            href={`/portal/${token}`}
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to RFQ
          </a>
          <h1 className="mt-2 text-xl font-bold text-gray-900">
            Submit Quote for {data.rfq.packageName}
          </h1>
          {data.rfq.reference && (
            <p className="text-sm text-gray-500">Ref: {data.rfq.reference}</p>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-8">
        <QuoteForm token={token} packageName={data.rfq.packageName} />
      </main>
    </div>
  );
}
