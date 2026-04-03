"use client";

export default function PortalClientPage({
  quote,
}: {
  quote: {
    id: string;
    totalAmount: string | null;
    currency: string | null;
    deliveryDays: number | null;
    validityDays: number | null;
    submittedAt: string;
  };
}) {
  return (
    <div className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
      <div>
        <p className="text-green-600">Amount</p>
        <p className="font-semibold text-gray-900">
          {quote.currency || "USD"} {Number(quote.totalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </p>
      </div>
      <div>
        <p className="text-green-600">Delivery</p>
        <p className="font-semibold text-gray-900">{quote.deliveryDays} days</p>
      </div>
      <div>
        <p className="text-green-600">Validity</p>
        <p className="font-semibold text-gray-900">{quote.validityDays} days</p>
      </div>
    </div>
  );
}
