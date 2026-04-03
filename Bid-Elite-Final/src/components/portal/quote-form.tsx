"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import QuoteItemEditor, { LineItem } from "@/components/quotes/quote-item-editor";
import FileUpload from "@/components/portal/file-upload";

const CURRENCY_OPTIONS = [
  { value: "USD", label: "USD - US Dollar" },
  { value: "SAR", label: "SAR - Saudi Riyal" },
  { value: "EUR", label: "EUR - Euro" },
  { value: "GBP", label: "GBP - British Pound" },
  { value: "AED", label: "AED - UAE Dirham" },
];

interface QuoteFormProps {
  token: string;
  packageName: string;
}

interface UploadedFile {
  url: string;
  filename: string;
  size: number;
}

export default function QuoteForm({ token }: QuoteFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [coverLetter, setCoverLetter] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [items, setItems] = useState<LineItem[]>([
    { id: crypto.randomUUID(), description: "", unit: "pcs", quantity: "", unitPrice: "" },
  ]);
  const [deliveryDays, setDeliveryDays] = useState("");
  const [validityDays, setValidityDays] = useState("30");
  const [attachments, setAttachments] = useState<UploadedFile[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const validItems = items.filter(
      (item) => item.description.trim() && item.quantity && item.unitPrice,
    );

    if (validItems.length === 0) {
      setError("Please add at least one line item with description, quantity, and unit price.");
      return;
    }

    if (!deliveryDays || Number(deliveryDays) <= 0) {
      setError("Please enter a valid delivery period.");
      return;
    }

    if (!validityDays || Number(validityDays) <= 0) {
      setError("Please enter a valid quote validity period.");
      return;
    }

    const itemsTotal = validItems.reduce(
      (sum, item) => sum + Number(item.quantity) * Number(item.unitPrice),
      0,
    );

    setSubmitting(true);

    try {
      const res = await fetch(`/api/portal/${token}/quote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          coverLetter: coverLetter.trim() || undefined,
          totalAmount: itemsTotal.toFixed(2),
          currency,
          deliveryDays: Number(deliveryDays),
          validityDays: Number(validityDays),
          items: validItems.map((item) => ({
            description: item.description.trim(),
            unit: item.unit,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          })),
          attachments: attachments.map((f) => f.url),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to submit quote");
        setSubmitting(false);
        return;
      }

      router.push(`/portal/${token}/success?quoteId=${data.quote.id}&amount=${data.quote.totalAmount}&currency=${data.quote.currency}&items=${data.quote.itemCount}`);
    } catch {
      setError("An error occurred. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-lg border border-gray-200 bg-white p-5 space-y-4">
        <h2 className="text-base font-semibold text-gray-900">Cover Letter</h2>
        <textarea
          value={coverLetter}
          onChange={(e) => setCoverLetter(e.target.value)}
          rows={4}
          placeholder="Optional: Add a cover letter or message to the buyer..."
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
        />
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">Line Items</h2>
          <div className="flex items-center gap-2">
            <label htmlFor="currency" className="text-sm text-gray-600">
              Currency:
            </label>
            <select
              id="currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="rounded border border-gray-300 px-2 py-1 text-sm text-gray-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              {CURRENCY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <QuoteItemEditor items={items} onChange={setItems} />
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-5 space-y-4">
        <h2 className="text-base font-semibold text-gray-900">Delivery & Validity</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="deliveryDays" className="block text-sm font-medium text-gray-700">
              Delivery Days *
            </label>
            <input
              id="deliveryDays"
              type="number"
              value={deliveryDays}
              onChange={(e) => setDeliveryDays(e.target.value)}
              placeholder="e.g. 14"
              min="1"
              required
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
          <div>
            <label htmlFor="validityDays" className="block text-sm font-medium text-gray-700">
              Quote Validity (Days) *
            </label>
            <input
              id="validityDays"
              type="number"
              value={validityDays}
              onChange={(e) => setValidityDays(e.target.value)}
              placeholder="30"
              min="1"
              required
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-5 space-y-4">
        <h2 className="text-base font-semibold text-gray-900">Attachments</h2>
        <FileUpload files={attachments} onChange={setAttachments} />
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => router.push(`/portal/${token}`)}
          className="rounded-lg border border-gray-300 bg-white px-6 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? (
            <>
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Submitting...
            </>
          ) : (
            "Submit Quote"
          )}
        </button>
      </div>
    </form>
  );
}
