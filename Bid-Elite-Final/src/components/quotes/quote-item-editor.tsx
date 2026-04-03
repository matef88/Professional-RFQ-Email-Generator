"use client";

// quote-item-editor component

const UNIT_OPTIONS = [
  { value: "pcs", label: "Pieces (pcs)" },
  { value: "m", label: "Meters (m)" },
  { value: "m2", label: "Square Meters (m²)" },
  { value: "kg", label: "Kilograms (kg)" },
  { value: "ton", label: "Tons" },
  { value: "lot", label: "Lot" },
  { value: "set", label: "Set" },
  { value: "unit", label: "Unit" },
  { value: "lumpsum", label: "Lump Sum" },
  { value: "hr", label: "Hours (hr)" },
  { value: "day", label: "Days" },
  { value: "month", label: "Months" },
];

export interface LineItem {
  id: string;
  description: string;
  unit: string;
  quantity: string;
  unitPrice: string;
}

interface QuoteItemEditorProps {
  items: LineItem[];
  onChange: (items: LineItem[]) => void;
  readOnly?: boolean;
}

export default function QuoteItemEditor({
  items,
  onChange,
  readOnly = false,
}: QuoteItemEditorProps) {
  const addItem = () => {
    onChange([
      ...items,
      {
        id: crypto.randomUUID(),
        description: "",
        unit: "pcs",
        quantity: "",
        unitPrice: "",
      },
    ]);
  };

  const removeItem = (id: string) => {
    onChange(items.filter((item) => item.id !== id));
  };

  const updateItem = (id: string, field: keyof LineItem, value: string) => {
    onChange(
      items.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );
  };

  const getItemTotal = (item: LineItem) => {
    const qty = parseFloat(item.quantity) || 0;
    const price = parseFloat(item.unitPrice) || 0;
    return qty * price;
  };

  const grandTotal = items.reduce((sum, item) => sum + getItemTotal(item), 0);

  if (readOnly) {
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              <th className="pb-2 pr-4">Description</th>
              <th className="pb-2 pr-4">Unit</th>
              <th className="pb-2 pr-4 text-right">Qty</th>
              <th className="pb-2 pr-4 text-right">Unit Price</th>
              <th className="pb-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-gray-100">
                <td className="py-2 pr-4 text-gray-900">{item.description}</td>
                <td className="py-2 pr-4 text-gray-600">{item.unit}</td>
                <td className="py-2 pr-4 text-right text-gray-900">{item.quantity}</td>
                <td className="py-2 pr-4 text-right text-gray-900">{item.unitPrice}</td>
                <td className="py-2 text-right font-medium text-gray-900">
                  {getItemTotal(item).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={4} className="pt-3 text-right font-semibold text-gray-900">
                Total:
              </td>
              <td className="pt-3 text-right font-bold text-gray-900">
                {grandTotal.toFixed(2)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              <th className="pb-2 pr-2 font-medium">Description *</th>
              <th className="pb-2 pr-2 font-medium">Unit</th>
              <th className="pb-2 pr-2 font-medium text-right">Qty *</th>
              <th className="pb-2 pr-2 font-medium text-right">Unit Price *</th>
              <th className="pb-2 pr-2 font-medium text-right">Total</th>
              <th className="pb-2 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={item.id} className="border-b border-gray-100">
                <td className="py-2 pr-2">
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => updateItem(item.id, "description", e.target.value)}
                    placeholder={`Item ${index + 1}`}
                    className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm text-gray-900 placeholder-gray-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </td>
                <td className="py-2 pr-2">
                  <select
                    value={item.unit}
                    onChange={(e) => updateItem(item.id, "unit", e.target.value)}
                    className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm text-gray-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  >
                    {UNIT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="py-2 pr-2">
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateItem(item.id, "quantity", e.target.value)}
                    placeholder="0"
                    min="0"
                    step="any"
                    className="w-20 rounded border border-gray-300 px-2 py-1.5 text-right text-sm text-gray-900 placeholder-gray-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </td>
                <td className="py-2 pr-2">
                  <input
                    type="number"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(item.id, "unitPrice", e.target.value)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="w-28 rounded border border-gray-300 px-2 py-1.5 text-right text-sm text-gray-900 placeholder-gray-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </td>
                <td className="py-2 pr-2 text-right font-medium text-gray-900">
                  {getItemTotal(item).toFixed(2)}
                </td>
                <td className="py-2">
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="rounded p-1 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                      title="Remove item"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={addItem}
          className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-gray-300 px-3 py-1.5 text-sm text-gray-600 transition-colors hover:border-amber-400 hover:text-amber-600"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Item
        </button>

        <div className="text-sm">
          <span className="text-gray-500">Running Total: </span>
          <span className="text-lg font-bold text-gray-900">
            {grandTotal.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}
