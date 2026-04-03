import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import type { EvaluationCriteria } from "@/lib/db/schema";

export interface ComparisonSupplier {
  id: string;
  supplierName: string;
  totalAmount: string | null;
  currency: string | null;
  deliveryDays: number | null;
  validityDays: number | null;
  status: string;
  notes: string | null;
  items: Array<{
    description: string;
    unit: string | null;
    quantity: string | null;
    unitPrice: string | null;
    totalPrice: string | null;
  }>;
  scores?: Record<string, number> | null;
  totalScore?: number | null;
  rank?: number | null;
}

export interface ComparisonData {
  rfqName: string;
  rfqReference: string | null;
  suppliers: ComparisonSupplier[];
  allItemDescriptions: string[];
  evaluationCriteria?: EvaluationCriteria[] | null;
}

function formatAmount(amount: string | null, currency: string | null): string {
  if (!amount) return "-";
  return `${currency ?? "USD"} ${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function exportToPdf(data: ComparisonData, filename: string) {
  const doc = new jsPDF({ orientation: "landscape" });

  doc.setFontSize(18);
  doc.setTextColor(217, 119, 6);
  doc.text("Elite Nexus", 14, 16);

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text("RFQ & Bidding Management Platform", 14, 22);

  doc.setFontSize(14);
  doc.setTextColor(0);
  doc.text(data.rfqName, 14, 32);

  if (data.rfqReference) {
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Ref: ${data.rfqReference}`, 14, 38);
  }

  doc.setFontSize(8);
  doc.setTextColor(130);
  doc.text(`Generated: ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`, 14, 43);

  if (data.evaluationCriteria && data.evaluationCriteria.length > 0) {
    doc.setFontSize(11);
    doc.setTextColor(0);
    doc.text("Evaluation Criteria", 14, 50);

    const criteriaHeaders = ["Criterion", "Weight", "Type"];
    const criteriaRows = data.evaluationCriteria.map((c) => [
      c.name,
      `${c.weight}%`,
      c.type.charAt(0).toUpperCase() + c.type.slice(1),
    ]);

    autoTable(doc, {
      startY: 53,
      head: [criteriaHeaders],
      body: criteriaRows,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [217, 119, 6] },
      margin: { left: 14 },
    });
  }

  const summaryStartY = ((doc as unknown as Record<string, unknown>).lastAutoTable as { finalY: number } | undefined)?.finalY ?? 58;
  doc.setFontSize(11);
  doc.setTextColor(0);
  doc.text("Supplier Summary & Rankings", 14, summaryStartY + 10);

  const hasScores = data.suppliers.some((s) => s.totalScore != null);
  const summaryHeaders = hasScores
    ? ["Rank", "Supplier", "Total Amount", "Currency", "Delivery", "Validity", "Score", "Status"]
    : ["Supplier", "Total Amount", "Currency", "Delivery Days", "Validity Days", "Status"];

  const summaryRows = data.suppliers.map((s) => {
    if (hasScores) {
      return [
        s.rank != null ? `#${s.rank}` : "-",
        s.supplierName,
        s.totalAmount ? Number(s.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "-",
        s.currency ?? "-",
        s.deliveryDays != null ? `${s.deliveryDays} days` : "-",
        s.validityDays != null ? `${s.validityDays} days` : "-",
        s.totalScore != null ? s.totalScore.toFixed(1) : "-",
        s.status.replace(/_/g, " "),
      ];
    }
    return [
      s.supplierName,
      s.totalAmount ? Number(s.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "-",
      s.currency ?? "-",
      s.deliveryDays != null ? String(s.deliveryDays) : "-",
      s.validityDays != null ? String(s.validityDays) : "-",
      s.status.replace(/_/g, " "),
    ];
  });

  autoTable(doc, {
    startY: summaryStartY + 14,
    head: [summaryHeaders],
    body: summaryRows,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [217, 119, 6] },
    margin: { left: 14 },
  });

  if (hasScores && data.evaluationCriteria && data.evaluationCriteria.length > 0) {
    const scoreStartY = ((doc as unknown as Record<string, unknown>).lastAutoTable as { finalY: number } | undefined)?.finalY ?? 120;
    doc.setFontSize(11);
    doc.text("Score Breakdown", 14, scoreStartY + 10);

    const scoreHeaders = ["Supplier", ...data.evaluationCriteria.map((c) => `${c.name} (${c.weight}%)`), "Total"];
    const scoreRows = data.suppliers.map((s) => [
      s.supplierName,
      ...data.evaluationCriteria!.map((c) => {
        const score = s.scores?.[c.name];
        return score != null ? String(score) : "-";
      }),
      s.totalScore != null ? s.totalScore.toFixed(1) : "-",
    ]);

    autoTable(doc, {
      startY: scoreStartY + 14,
      head: [scoreHeaders],
      body: scoreRows,
      styles: { fontSize: 7 },
      headStyles: { fillColor: [217, 119, 6] },
      margin: { left: 14 },
    });
  }

  if (data.allItemDescriptions.length > 0) {
    const itemStartY = ((doc as unknown as Record<string, unknown>).lastAutoTable as { finalY: number } | undefined)?.finalY ?? 140;
    doc.setFontSize(11);
    doc.text("Item-by-Item Comparison", 14, itemStartY + 10);

    const itemHeaders = ["Item", ...data.suppliers.map((s) => s.supplierName)];
    const itemRows = data.allItemDescriptions.map((desc) => {
      const row: string[] = [desc];
      for (const supplier of data.suppliers) {
        const item = supplier.items.find((i) => i.description === desc);
        row.push(item?.totalPrice ? Number(item.totalPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "-");
      }
      return row;
    });

    autoTable(doc, {
      startY: itemStartY + 14,
      head: [itemHeaders],
      body: itemRows,
      styles: { fontSize: 7 },
      headStyles: { fillColor: [217, 119, 6] },
      margin: { left: 14 },
    });
  }

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(130);
    doc.text("Elite Nexus | Riyadh | elite-n.com | bidding@elite-n.com", 14, doc.internal.pageSize.getHeight() - 8);
  }

  doc.save(filename);
}

export function exportToExcel(data: ComparisonData, filename: string) {
  const wb = XLSX.utils.book_new();

  const hasScores = data.suppliers.some((s) => s.totalScore != null);

  const summaryHeaders = hasScores
    ? ["Rank", "Supplier", "Total Amount", "Currency", "Delivery Days", "Validity Days", "Total Score", "Status", "Notes"]
    : ["Supplier", "Total Amount", "Currency", "Delivery Days", "Validity Days", "Status", "Notes"];

  const summaryData = [
    summaryHeaders,
    ...data.suppliers.map((s) => {
      if (hasScores) {
        return [
          s.rank ?? "",
          s.supplierName,
          s.totalAmount ? Number(s.totalAmount) : "",
          s.currency ?? "",
          s.deliveryDays ?? "",
          s.validityDays ?? "",
          s.totalScore ?? "",
          s.status.replace(/_/g, " "),
          s.notes ?? "",
        ];
      }
      return [
        s.supplierName,
        s.totalAmount ? Number(s.totalAmount) : "",
        s.currency ?? "",
        s.deliveryDays ?? "",
        s.validityDays ?? "",
        s.status.replace(/_/g, " "),
        s.notes ?? "",
      ];
    }),
  ];

  const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
  summaryWs["!cols"] = hasScores
    ? [{ wch: 6 }, { wch: 20 }, { wch: 15 }, { wch: 10 }, { wch: 14 }, { wch: 14 }, { wch: 12 }, { wch: 14 }, { wch: 30 }]
    : [{ wch: 20 }, { wch: 15 }, { wch: 10 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 30 }];
  XLSX.utils.book_append_sheet(wb, summaryWs, "Summary");

  if (data.evaluationCriteria && data.evaluationCriteria.length > 0) {
    const criteriaData = [
      ["Criterion", "Weight (%)", "Type"],
      ...data.evaluationCriteria.map((c) => [c.name, c.weight, c.type]),
    ];
    const criteriaWs = XLSX.utils.aoa_to_sheet(criteriaData);
    criteriaWs["!cols"] = [{ wch: 25 }, { wch: 12 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, criteriaWs, "Evaluation Criteria");
  }

  if (hasScores && data.evaluationCriteria && data.evaluationCriteria.length > 0) {
    const scoreHeaders = ["Supplier", ...data.evaluationCriteria.map((c) => `${c.name} (${c.weight}%)`), "Total Score"];
    const scoreRows = data.suppliers.map((s) => [
      s.supplierName,
      ...data.evaluationCriteria!.map((c) => s.scores?.[c.name] ?? ""),
      s.totalScore ?? "",
    ]);
    const scoreWs = XLSX.utils.aoa_to_sheet([scoreHeaders, ...scoreRows]);
    scoreWs["!cols"] = [
      { wch: 20 },
      ...data.evaluationCriteria.map(() => ({ wch: 15 })),
      { wch: 12 },
    ];
    XLSX.utils.book_append_sheet(wb, scoreWs, "Scores");
  }

  if (data.allItemDescriptions.length > 0) {
    const itemHeaders = ["Item Description", ...data.suppliers.map((s) => s.supplierName)];
    const itemRows = data.allItemDescriptions.map((desc) => {
      const row: (string | number)[] = [desc];
      for (const supplier of data.suppliers) {
        const item = supplier.items.find((i) => i.description === desc);
        row.push(item?.totalPrice ? Number(item.totalPrice) : "");
      }
      return row;
    });

    const itemWs = XLSX.utils.aoa_to_sheet([itemHeaders, ...itemRows]);
    itemWs["!cols"] = [{ wch: 30 }, ...data.suppliers.map(() => ({ wch: 15 }))];
    XLSX.utils.book_append_sheet(wb, itemWs, "Item Comparison");
  }

  for (const supplier of data.suppliers) {
    if (supplier.items.length > 0) {
      const sheetName = supplier.supplierName.substring(0, 31);
      const supplierData = [
        ["Description", "Unit", "Quantity", "Unit Price", "Total Price"],
        ...supplier.items.map((item) => [
          item.description,
          item.unit ?? "",
          item.quantity ? Number(item.quantity) : "",
          item.unitPrice ? Number(item.unitPrice) : "",
          item.totalPrice ? Number(item.totalPrice) : "",
        ]),
      ];

      const supplierWs = XLSX.utils.aoa_to_sheet(supplierData);
      supplierWs["!cols"] = [{ wch: 30 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 12 }];
      XLSX.utils.book_append_sheet(wb, supplierWs, sheetName);
    }
  }

  XLSX.writeFile(wb, filename);
}
