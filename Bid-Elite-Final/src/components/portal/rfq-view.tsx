export interface RfqData {
  packageName: string;
  reference: string | null;
  deadline: string | null;
  details: string | null;
  packageLink: string | null;
  docsLink: string | null;
  status: string;
}

export interface CompanyData {
  name: string;
  tagline: string | null;
  email: string | null;
  website: string | null;
  phone: string | null;
  city: string | null;
  country: string | null;
  docsLink: string | null;
  logoUrl: string | null;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function RfqView({
  rfq,
  company,
}: {
  rfq: RfqData;
  company: CompanyData | null;
}) {
  const isClosed = rfq.status === "closed";
  const deadlineDate = formatDate(rfq.deadline);
  const isOverdue = rfq.deadline ? new Date(rfq.deadline + "T23:59:59") < new Date() : false;

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{rfq.packageName}</h1>
            {rfq.reference && (
              <p className="mt-1 text-sm text-gray-500">Ref: {rfq.reference}</p>
            )}
          </div>
          {company && (
            <div className="text-right">
              <p className="font-semibold text-gray-900">{company.name}</p>
              {company.tagline && (
                <p className="text-sm text-gray-500">{company.tagline}</p>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
            Submission Deadline
          </p>
          <p className={`mt-1 text-lg font-semibold ${isOverdue || isClosed ? "text-red-600" : "text-gray-900"}`}>
            {deadlineDate || "No deadline set"}
            {(isOverdue || isClosed) && (
              <span className="ml-2 text-sm font-normal text-red-600">
                ({isClosed ? "Closed" : "Overdue"})
              </span>
            )}
          </p>
        </div>

        {company && (
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Contact Information
            </p>
            <div className="mt-1 space-y-0.5 text-sm text-gray-700">
              {company.email && <p>{company.email}</p>}
              {company.phone && <p>{company.phone}</p>}
              {company.city && company.country && (
                <p>
                  {company.city}, {company.country}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {rfq.details && (
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">
            Requirements & Details
          </h2>
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
            {rfq.details}
          </div>
        </div>
      )}

      {(rfq.packageLink || rfq.docsLink || company?.docsLink) && (
        <div className="flex flex-wrap gap-3">
          {rfq.packageLink && (
            <a
              href={rfq.packageLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download Package Details
            </a>
          )}
          {(rfq.docsLink || company?.docsLink) && (
            <a
              href={rfq.docsLink || company!.docsLink!}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Company Documents
            </a>
          )}
        </div>
      )}
    </div>
  );
}
