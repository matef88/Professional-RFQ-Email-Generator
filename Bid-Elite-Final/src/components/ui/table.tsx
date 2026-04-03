import { ReactNode } from "react";

interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T) => ReactNode);
  className?: string;
  onSort?: () => void;
  sortDirection?: "asc" | "desc" | null;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
}

export default function Table<T extends Record<string, unknown>>({
  columns,
  data,
  onRowClick,
  emptyMessage = "No data found",
}: TableProps<T>) {
  function getCellValue(row: T, col: Column<T>): ReactNode {
    if (typeof col.accessor === "function") return col.accessor(row);
    return row[col.accessor] as ReactNode;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            {columns.map((col, i) => (
              <th
                key={i}
                className={`px-4 py-3 text-left text-xs font-medium text-text-muted ${col.className ?? ""}`}
              >
                {col.onSort ? (
                  <button onClick={col.onSort} className="flex items-center gap-1 hover:text-text-secondary">
                    {col.header}
                    {col.sortDirection === "asc" && " \u2191"}
                    {col.sortDirection === "desc" && " \u2193"}
                  </button>
                ) : (
                  col.header
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-text-dim">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, ri) => (
              <tr
                key={ri}
                onClick={() => onRowClick?.(row)}
                className={`border-b border-border/50 transition-colors hover:bg-bg-elevated/50 ${
                  onRowClick ? "cursor-pointer" : ""
                }`}
              >
                {columns.map((col, ci) => (
                  <td key={ci} className={`px-4 py-3 text-text-secondary ${col.className ?? ""}`}>
                    {getCellValue(row, col)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
