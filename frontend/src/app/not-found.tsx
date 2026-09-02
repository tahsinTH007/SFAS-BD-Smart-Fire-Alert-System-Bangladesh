import Link from "next/link";
import { Flame, LayoutDashboard, MapPin, Search } from "lucide-react";

export default function NotFound() {
  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-slate-950 px-4 py-12">
      <div className="w-full max-w-lg text-center">
        <div className="relative mx-auto mb-6 flex h-24 w-24 items-center justify-center">
          <span className="absolute inset-0 animate-ping rounded-full bg-orange-500/10" />
          <span className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-orange-500/30 bg-orange-500/10">
            <Search size={32} className="text-orange-400" />
          </span>
        </div>

        <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-slate-600">
          Error 404
        </p>

        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-50 sm:text-4xl">
          This page isn&apos;t on the map
        </h1>

        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-400">
          The page you asked for doesn&apos;t exist. If you followed a link to an
          incident, it may have been resolved and cleared from the console.
        </p>

        <div className="mt-8 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-orange-500"
          >
            <MapPin size={15} /> Live map
          </Link>
          <Link
            href="/dashboard"
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-200 transition-colors hover:bg-slate-800"
          >
            <LayoutDashboard size={15} /> Dashboard
          </Link>
          <Link
            href="/notifications"
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-200 transition-colors hover:bg-slate-800"
          >
            <Flame size={15} /> Alerts
          </Link>
        </div>

        <p className="mt-10 text-[11px] text-slate-700">
          SFAS-BD · OGNIBORMO · Team HALCYON
        </p>
      </div>
    </main>
  );
}
