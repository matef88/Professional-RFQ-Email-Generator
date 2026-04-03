import Link from "next/link";

export default async function SuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ quoteId?: string; amount?: string; currency?: string; items?: string }>;
}) {
  const { token } = await params;
  const sp = await searchParams;

  const amount = sp.amount || "0";
  const currency = sp.currency || "USD";
  const itemCount = sp.items || "0";
  const submittedAt = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-lg text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-900">Thank You!</h1>
        <p className="mt-2 text-gray-600">
          Your quote has been submitted successfully.
        </p>

        <div className="mt-8 rounded-lg border border-gray-200 bg-white p-6 text-left">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500">
            Submission Summary
          </h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">Total Amount</dt>
              <dd className="font-semibold text-gray-900">
                {currency} {Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </dd>
            </div>
            <div className="flex justify-between border-t border-gray-100 pt-3">
              <dt className="text-gray-500">Line Items</dt>
              <dd className="font-medium text-gray-900">{itemCount}</dd>
            </div>
            <div className="flex justify-between border-t border-gray-100 pt-3">
              <dt className="text-gray-500">Submitted</dt>
              <dd className="font-medium text-gray-900">{submittedAt}</dd>
            </div>
          </dl>
        </div>

        <p className="mt-6 text-sm text-gray-500">
          You will receive a confirmation email shortly.
        </p>

        <div className="mt-6">
          <Link
            href={`/portal/${token}`}
            className="inline-flex items-center gap-2 text-sm font-medium text-amber-600 hover:text-amber-700"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to RFQ Details
          </Link>
        </div>
      </div>
    </div>
  );
}
