"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button from "@/components/ui/button";
import Badge from "@/components/ui/badge";
import Input from "@/components/ui/input";
import MultiSelect from "@/components/ui/multi-select";
import Modal from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { SUPPLIER_SCOPES } from "@/lib/constants/scopes";
import * as xlsx from "xlsx";

interface SupplierItem {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  contactPerson: string | null;
  category: string | null;
  scopes?: string[] | null;
  isActive: boolean;
  isRegistered?: boolean | null;
  createdAt: Date;
}

interface SupplierListClientProps {
  suppliers: SupplierItem[];
  rfqCountMap?: Record<string, number>;
  quoteCountMap?: Record<string, number>;
}

const SCOPE_COLORS: Record<string, string> = {
  ME: "bg-blue-500/15 text-blue-400",
  EE: "bg-yellow-500/15 text-yellow-400",
  CE: "bg-green-500/15 text-green-400",
  HVAC: "bg-red-500/15 text-red-400",
  Plumbing: "bg-cyan-500/15 text-cyan-400",
  "Fire Fighting": "bg-orange-500/15 text-orange-400",
  Structural: "bg-purple-500/15 text-purple-400",
  Finishing: "bg-pink-500/15 text-pink-400",
  Landscaping: "bg-emerald-500/15 text-emerald-400",
  "IT/ELV": "bg-indigo-500/15 text-indigo-400",
  General: "bg-gray-500/15 text-gray-400",
  Other: "bg-slate-500/15 text-slate-400",
};

function ScopeBadge({ scope }: { scope: string }) {
  const colorClass = SCOPE_COLORS[scope] ?? SCOPE_COLORS.Other;
  return (
    <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium ${colorClass}`}>
      {scope}
    </span>
  );
}

type SortField = 'name' | 'email' | 'rfq' | 'quote' | 'status';

export default function SupplierListClient({
  suppliers: initialSuppliers,
  rfqCountMap = {},
  quoteCountMap = {},
}: SupplierListClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [scopeFilter, setScopeFilter] = useState<string[]>([]);
  
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importPreview, setImportPreview] = useState<any[]>([]);

  const [sortField, setSortField] = useState<SortField>("name");
  const [sortAsc, setSortAsc] = useState(true);
  
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  const filtered = useMemo(() => {
    return initialSuppliers.filter((s) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !search ||
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        (s.category?.toLowerCase().includes(q) ?? false) ||
        (s.scopes?.some((sc) => sc.toLowerCase().includes(q)) ?? false);
      const matchesScope =
        scopeFilter.length === 0 ||
        (s.scopes?.some((sc) => scopeFilter.includes(sc)) ?? false);
      return matchesSearch && matchesScope;
    });
  }, [initialSuppliers, search, scopeFilter]);
  
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let aVal: any = a[sortField as keyof SupplierItem];
      let bVal: any = b[sortField as keyof SupplierItem];
      
      if (sortField === 'rfq') {
        aVal = rfqCountMap[a.id] ?? 0;
        bVal = rfqCountMap[b.id] ?? 0;
      } else if (sortField === 'quote') {
        aVal = quoteCountMap[a.id] ?? 0;
        bVal = quoteCountMap[b.id] ?? 0;
      } else if (sortField === 'status') {
        aVal = a.isActive ? 1 : 0;
        bVal = b.isActive ? 1 : 0;
      }

      if (aVal < bVal) return sortAsc ? -1 : 1;
      if (aVal > bVal) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [filtered, sortField, sortAsc, rfqCountMap, quoteCountMap]);

  const totalPages = Math.ceil(sorted.length / itemsPerPage);
  const paginated = sorted.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortAsc(!sortAsc);
    else { setSortField(field); setSortAsc(true); }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <span className="ml-1 opacity-20">↕</span>;
    return <span className="ml-1 text-accent">{sortAsc ? "↑" : "↓"}</span>;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = xlsx.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        const jsonData: any[] = xlsx.utils.sheet_to_json(worksheet);
        
        const preview = jsonData.map((row) => ({
           name: row["Name"] || row["Company Name"] || "",
           email: row["Email"] || "",
           phone: row["Phone"] || "",
           contactPerson: row["Contact Person"] || "",
           category: row["Category"] || "",
           scopes: row["Scopes"] ? String(row["Scopes"]).split(",").map(s => s.trim()) : [],
        })).filter(r => r.name && r.email);

        setImportPreview(preview);
        if (preview.length === 0) {
           toast("Could not find any rows with a valid Name and Email in the file.", "error");
        }
      } catch (err) {
        toast("Failed to parse the file.", "error");
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  const submitImport = async () => {
     if (importPreview.length === 0) return;
     setImporting(true);
     try {
       const res = await fetch("/api/suppliers/bulk-import", {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ suppliers: importPreview }),
       });
       const data = await res.json();
       if (!res.ok) {
          toast(data.error || "Failed to import", "error");
          return;
       }
       toast(`Successfully imported ${data.imported} and updated ${data.updated} suppliers!`, "success");
       setImportModalOpen(false);
       setImportPreview([]);
       router.refresh();
     } catch {
       toast("An unknown error occurred during import.", "error");
     } finally {
       setImporting(false);
     }
  };

  const downloadTemplate = () => {
    const ws = xlsx.utils.json_to_sheet([
      { "Name": "Example Corp", "Email": "contact@example.com", "Phone": "+123456789", "Contact Person": "John Doe", "Category": "General", "Scopes": "ME, EE" }
    ]);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, "Suppliers");
    xlsx.writeFile(wb, "supplier_import_template.xlsx");
  };

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-4">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row">
          <div className="flex-1">
            <Input
              placeholder="Search by name, email, or scope..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <div className="min-w-[200px]">
            <MultiSelect
              options={SUPPLIER_SCOPES}
              selectedValues={scopeFilter}
              onChange={(val) => { setScopeFilter(val); setPage(1); }}
              placeholder="Filter by scope..."
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setImportModalOpen(true)}>Import Excel</Button>
          <Link href="/suppliers/new">
            <Button>Add Supplier</Button>
          </Link>
        </div>
      </div>

      <div className="mb-2 text-xs text-text-dim text-right font-medium">
        Showing {(page - 1) * itemsPerPage + 1}-{Math.min(page * itemsPerPage, filtered.length)} of {filtered.length} suppliers
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-bg-secondary p-8 text-center text-sm text-text-dim">
          {initialSuppliers.length === 0
            ? "No suppliers yet. Add your first supplier to get started."
            : "No suppliers match your search."}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-bg-secondary">
          
          <div className="hidden sm:grid sm:grid-cols-12 sm:gap-4 px-5 py-3 border-b border-border bg-bg-elevated/20 text-xs font-semibold text-text-muted">
            <div className="col-span-3 cursor-pointer hover:text-text-primary" onClick={() => toggleSort('name')}>
              Name / Contact <SortIcon field="name" />
            </div>
            <div className="col-span-2 cursor-pointer hover:text-text-primary" onClick={() => toggleSort('email')}>
              Email <SortIcon field="email" />
            </div>
            <div className="col-span-2">Phone / Scopes</div>
            <div className="col-span-2 text-center cursor-pointer hover:text-text-primary" onClick={() => toggleSort('rfq')}>
              RFQs / Quotes <SortIcon field="rfq" />
            </div>
            <div className="col-span-3 text-right cursor-pointer hover:text-text-primary" onClick={() => toggleSort('status')}>
              Status <SortIcon field="status" />
            </div>
          </div>

          <div className="divide-y divide-border/50">
            {paginated.map((supplier) => (
              <div
                key={supplier.id}
                onClick={() => router.push(`/suppliers/${supplier.id}`)}
                className="group flex cursor-pointer items-center px-5 py-3 transition-colors hover:bg-bg-elevated/50 sm:grid sm:grid-cols-12 sm:gap-4"
              >
                <div className="col-span-3 min-w-0 flex-1 sm:flex-none">
                  <div className="flex items-center gap-2">
                    <div className="truncate text-sm font-medium text-text-primary">{supplier.name}</div>
                    {!supplier.phone && !supplier.contactPerson && (!supplier.scopes || supplier.scopes.length === 0) && (
                      <span className="shrink-0 inline-flex items-center rounded bg-warning/15 px-1.5 py-0.5 text-[10px] font-medium text-warning">
                        Incomplete
                      </span>
                    )}
                  </div>
                  {supplier.contactPerson && (
                    <div className="text-xs text-text-dim">{supplier.contactPerson}</div>
                  )}
                </div>
                
                <div className="col-span-2 hidden truncate text-xs text-text-secondary sm:block">
                  {supplier.email}
                </div>
                
                <div className="col-span-2 hidden sm:block">
                  <div className="truncate text-xs text-text-secondary mb-1">
                    {supplier.phone || "\u2014"}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {supplier.scopes && supplier.scopes.length > 0 ? (
                      supplier.scopes.slice(0, 3).map((sc) => <ScopeBadge key={sc} scope={sc} />)
                    ) : supplier.category ? (
                      <ScopeBadge scope={supplier.category} />
                    ) : (
                      <span className="text-xs text-text-dim">{"\u2014"}</span>
                    )}
                  </div>
                </div>
                
                <div className="col-span-2 hidden text-center sm:block">
                  <div className="text-xs text-text-secondary">
                    {rfqCountMap[supplier.id] ?? 0} RFQs
                  </div>
                  <div className="text-xs text-text-dim mt-0.5">
                    {quoteCountMap[supplier.id] ?? 0} Quotes
                  </div>
                </div>
                
                <div className="col-span-3 hidden sm:flex sm:items-center sm:justify-end sm:gap-3">
                  {supplier.isRegistered ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-success">
                      <span className="h-1.5 w-1.5 rounded-full bg-success"></span>
                      Portal
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-text-dim">
                      <span className="h-1.5 w-1.5 rounded-full bg-gray-400"></span>
                      No Portal
                    </span>
                  )}
                  <Badge variant={supplier.isActive ? "success" : "default"}>
                    {supplier.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-2 sm:hidden">
                  <Badge variant={supplier.isActive ? "success" : "default"}>
                    {supplier.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
          
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border px-5 py-3 bg-bg-elevated/10">
              <div className="flex items-center gap-2 text-xs text-text-dim">
                <button 
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)} 
                  className="px-2 py-1 border border-border rounded bg-bg-secondary hover:bg-bg-elevated disabled:opacity-50"
                  >
                    Prev
                </button>
                <div className="px-2 font-medium">Page {page} of {totalPages}</div>
                <button 
                  disabled={page === totalPages}
                  onClick={() => setPage(page + 1)}
                  className="px-2 py-1 border border-border rounded bg-bg-secondary hover:bg-bg-elevated disabled:opacity-50"
                  >
                    Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <Modal open={importModalOpen} onClose={() => setImportModalOpen(false)} title="Import Suppliers from Excel">
        <div className="space-y-4">
           {importPreview.length === 0 ? (
             <>
                <p className="text-sm border-b border-border text-text-secondary pb-4">
                  Upload an Excel or CSV file containing supplier information. Ensure the first row contains columns like Name, Email, Phone, Contact Person, Category, and Scopes.
                </p>
                <div className="flex flex-col gap-4 text-center">
                   <div className="border border-dashed border-border rounded-xl p-8 bg-bg-secondary">
                      <input type="file" id="excel-upload" className="hidden" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} />
                      <Button variant="secondary" onClick={() => document.getElementById("excel-upload")?.click()}>
                        Choose File to Upload
                      </Button>
                   </div>
                   <button type="button" onClick={downloadTemplate} className="text-xs text-accent hover:underline">
                      Download example template file
                   </button>
                </div>
             </>
           ) : (
             <>
                <p className="text-sm text-text-secondary">
                   Found {importPreview.length} valid suppliers in your upload. 
                   Duplicates will be updated automatically based on email address.
                </p>
                <div className="max-h-60 overflow-y-auto border border-border rounded-lg bg-bg-secondary divide-y divide-border/50">
                   {importPreview.map((s, idx) => (
                      <div key={idx} className="p-3 text-xs flex justify-between">
                         <div>
                           <div className="font-medium text-text-primary">{s.name}</div>
                           <div className="text-text-dim">{s.email}</div>
                         </div>
                         <div className="text-right">
                           <div className="text-text-secondary">{s.contactPerson || "-"}</div>
                           <div className="text-text-dim">{s.scopes?.length ? (s.scopes.length + " scopes") : "-"}</div>
                         </div>
                      </div>
                   ))}
                </div>
                <div className="flex justify-end gap-2 pt-2">
                   <Button variant="secondary" onClick={() => setImportPreview([])} disabled={importing}>Reset</Button>
                   <Button onClick={submitImport} disabled={importing}>
                      {importing ? "Importing..." : `Commit ${importPreview.length} Suppliers`}
                   </Button>
                </div>
             </>
           )}
        </div>
      </Modal>
    </>
  );
}
