"use client";

import React, { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Plus, Search } from "lucide-react";
import { EmptyState, inputClass } from "./Primitives";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export interface Column<T> {
  key: string;
  header: string;
  /** Value used for sorting and search. */
  accessor?: (row: T) => string | number | null | undefined;
  render: (row: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
}

interface DataTableProps<T> {
  rows: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string;
  searchPlaceholder?: string;
  addLabel?: string;
  onAdd?: () => void;
  emptyIcon: LucideIcon;
  emptyTitle: string;
  emptyMessage: string;
  loading?: boolean;
  pageSize?: number;
}

export function DataTable<T>({
  rows,
  columns,
  rowKey,
  searchPlaceholder = "Search…",
  addLabel,
  onAdd,
  emptyIcon,
  emptyTitle,
  emptyMessage,
  loading,
  pageSize = 12,
}: DataTableProps<T>) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(1);

  const searchable = useMemo(
    () => columns.filter((c) => c.accessor),
    [columns],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) =>
      searchable.some((c) =>
        String(c.accessor?.(row) ?? "")
          .toLowerCase()
          .includes(q),
      ),
    );
  }, [rows, query, searchable]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    const col = columns.find((c) => c.key === sortKey);
    if (!col?.accessor) return filtered;

    return [...filtered].sort((a, b) => {
      const av = col.accessor!(a);
      const bv = col.accessor!(b);
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === "number" && typeof bv === "number") {
        return sortAsc ? av - bv : bv - av;
      }
      return sortAsc
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });
  }, [filtered, sortKey, sortAsc, columns]);

  const pages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, pages);
  const visible = sorted.slice((safePage - 1) * pageSize, safePage * pageSize);

  const toggleSort = (key: string) => {
    if (sortKey === key) setSortAsc((v) => !v);
    else {
      setSortKey(key);
      setSortAsc(true);
    }
    setPage(1);
  };

  return (
    <div className="flex flex-col">
      {/* Controls */}
      <div className="flex flex-col gap-3 border-b border-slate-800 p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            size={14}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-600"
          />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder={searchPlaceholder}
            className={`${inputClass} pl-9`}
            aria-label={searchPlaceholder}
          />
        </div>

        {onAdd && (
          <button
            onClick={onAdd}
            className="flex shrink-0 items-center justify-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-orange-500"
          >
            <Plus size={14} />
            {addLabel ?? "Add"}
          </button>
        )}
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={emptyIcon}
          title={loading ? "Loading…" : query ? "No matches" : emptyTitle}
          message={query ? "Try a different search term." : emptyMessage}
        />
      ) : (
        <>
          {/* Wide tables scroll inside their own container, never the page. */}
          <div className="sfas-scroll overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-800">
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      scope="col"
                      className={cn(
                        "px-4 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-slate-500",
                        col.className,
                      )}
                    >
                      {col.sortable && col.accessor ? (
                        <button
                          onClick={() => toggleSort(col.key)}
                          className="flex items-center gap-1 transition-colors hover:text-slate-300"
                        >
                          {col.header}
                          {sortKey === col.key ? (
                            sortAsc ? (
                              <ChevronUp size={11} />
                            ) : (
                              <ChevronDown size={11} />
                            )
                          ) : null}
                        </button>
                      ) : (
                        col.header
                      )}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-800/70">
                {visible.map((row) => (
                  <tr
                    key={rowKey(row)}
                    className="transition-colors hover:bg-slate-800/30"
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={cn("px-4 py-3 align-middle", col.className)}
                      >
                        {col.render(row)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-800 px-4 py-3">
              <p className="text-[11px] text-slate-500">
                Showing {(safePage - 1) * pageSize + 1}–
                {Math.min(safePage * pageSize, sorted.length)} of {sorted.length}
              </p>
              <div className="flex gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                  className="rounded-md border border-slate-700 px-2.5 py-1 text-[11px] text-slate-400 transition-colors hover:text-slate-200 disabled:opacity-40"
                >
                  Prev
                </button>
                <span className="px-2 py-1 text-[11px] tabular-nums text-slate-500">
                  {safePage} / {pages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(pages, p + 1))}
                  disabled={safePage === pages}
                  className="rounded-md border border-slate-700 px-2.5 py-1 text-[11px] text-slate-400 transition-colors hover:text-slate-200 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
