"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronDown, MapPin, RefreshCw, TriangleAlert } from "lucide-react";

/**
 * Route-level error boundary.
 *
 * The console is safety equipment: if a page crashes, an operator needs to be
 * told plainly that alerting may be affected and given a one-click recovery,
 * not a blank screen.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    // Surface in the browser console for whoever is debugging on site.
    console.error("Console error boundary caught:", error);
  }, [error]);

  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-slate-950 px-4 py-12">
      <div className="w-full max-w-xl">
        <div className="rounded-2xl border border-red-500/30 bg-slate-900/60 p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-red-500/40 bg-red-500/10">
              <TriangleAlert size={22} className="text-red-400" />
            </span>

            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-red-400/80">
                Something broke
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-50">
                This screen failed to load
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                The rest of the console is unaffected, but{" "}
                <span className="font-medium text-slate-300">
                  live alerts may not reach this tab
                </span>{" "}
                until it recovers. Retry, or move to another screen.
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
            <button
              onClick={reset}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-orange-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-orange-500"
            >
              <RefreshCw size={15} /> Retry
            </button>
            <Link
              href="/"
              className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-200 transition-colors hover:bg-slate-800"
            >
              <MapPin size={15} /> Live map
            </Link>
          </div>

          <button
            onClick={() => setShowDetail((v) => !v)}
            className="mt-5 flex w-full items-center justify-between rounded-lg border border-slate-800 px-3 py-2 text-[11px] font-semibold text-slate-500 transition-colors hover:text-slate-300"
          >
            Technical details
            <ChevronDown
              size={13}
              className={showDetail ? "rotate-180 transition-transform" : "transition-transform"}
            />
          </button>

          {showDetail && (
            <pre className="sfas-scroll mt-2 max-h-48 overflow-auto rounded-lg border border-slate-800 bg-slate-950 p-3 text-[11px] leading-relaxed text-slate-400">
              {error.message}
              {error.digest ? `\n\nDigest: ${error.digest}` : ""}
            </pre>
          )}
        </div>

        <p className="mt-6 text-center text-[11px] text-slate-700">
          If this keeps happening, check that the API is reachable.
        </p>
      </div>
    </main>
  );
}
