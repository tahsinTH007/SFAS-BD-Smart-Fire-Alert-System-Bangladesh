"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSelector } from "react-redux";
import {
  Bell,
  Building2,
  Flame,
  LayoutDashboard,
  MapPin,
  Menu,
  Radio,
  Settings,
  User,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";
import type { RootState } from "@/redux/store";
import { selectActiveStation } from "@/redux/slices/sessionSlice";
import { NotificationBell } from "./components/NotificationBell";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { ProfileMenu } from "./components/ProfileMenu";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Live map", icon: MapPin },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/notifications", label: "Alerts", icon: Bell },
  { href: "/profile", label: "My profile", icon: User },
  { href: "/settings", label: "Settings", icon: Settings },
];

const Navbar = () => {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const station = useSelector(selectActiveStation);
  const connected = useSelector((s: RootState) => s.telemetry.connected);

  // Close the drawer on navigation.
  useEffect(() => setMenuOpen(false), [pathname]);

  // Lock body scroll while the mobile drawer is open.
  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      <nav className="sticky top-0 z-[1000] border-b border-orange-500/20 bg-slate-900/95 shadow-lg shadow-black/20 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-3 sm:px-6">
          <div className="flex h-14 items-center justify-between gap-3 sm:h-16">
            {/* Brand + station */}
            <div className="flex min-w-0 items-center gap-3">
              <Link href="/" className="flex shrink-0 items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-orange-500/30 bg-gradient-to-br from-orange-500/20 to-red-600/20">
                  <Flame size={17} className="text-orange-400" />
                </span>
                <span className="hidden flex-col leading-tight sm:flex">
                  <span className="bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-sm font-extrabold tracking-wide text-transparent">
                    SFAS-BD
                  </span>
                  <span className="text-[9px] font-semibold uppercase tracking-widest text-slate-500">
                    Smart Fire Alert System
                  </span>
                </span>
              </Link>

              {/* Which station this console serves */}
              {station && (
                <Link
                  href="/settings"
                  className="flex min-w-0 items-center gap-1.5 rounded-lg border border-slate-700/70 bg-slate-800/50 px-2.5 py-1.5 transition-colors hover:border-slate-600"
                  title={`${station.name} — change in Settings`}
                >
                  <Radio size={11} className="shrink-0 text-orange-400" />
                  <span className="truncate text-[11px] font-bold text-slate-200">
                    {station.stationCode}
                  </span>
                  <span className="hidden truncate text-[11px] text-slate-500 lg:inline">
                    {station.name}
                  </span>
                </Link>
              )}
            </div>

            {/* Desktop nav */}
            <div className="hidden items-center gap-1 md:flex">
              {NAV.slice(0, 3).map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors",
                    isActive(href)
                      ? "bg-slate-800 text-slate-50"
                      : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200",
                  )}
                >
                  <Icon size={14} />
                  {label}
                </Link>
              ))}
            </div>

            {/* Right cluster */}
            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
              <span
                className={cn(
                  "hidden items-center gap-1.5 rounded-lg border px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider sm:flex",
                  connected
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                    : "border-slate-700 bg-slate-800/60 text-slate-500",
                )}
                title={connected ? "Live feed connected" : "Reconnecting"}
              >
                {connected ? <Wifi size={11} /> : <WifiOff size={11} />}
                {connected ? "Live" : "Offline"}
              </span>

              {/* Bell is mobile-only: on desktop the "Alerts" nav link already
                  leads to the full console, so the dropdown is redundant. */}
              <div className="md:hidden">
                <NotificationBell />
              </div>

              <div className="hidden items-center gap-2 md:flex">
                <ThemeToggle />
                <ProfileMenu />
              </div>

              <button
                onClick={() => setMenuOpen(true)}
                aria-label="Open menu"
                className="rounded-lg p-2 text-slate-300 transition-colors hover:bg-slate-800 md:hidden"
              >
                <Menu size={20} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile drawer */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-[10020] md:hidden"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
          />

          <div className="absolute right-0 top-0 flex h-full w-[82%] max-w-xs flex-col border-l border-slate-800 bg-slate-900 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 px-4 py-4">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-orange-500/30 bg-orange-500/10">
                  <Flame size={16} className="text-orange-400" />
                </span>
                <div>
                  <p className="text-sm font-bold text-slate-100">SFAS-BD</p>
                  <p className="text-[10px] text-slate-500">
                    {station?.stationCode ?? "No station"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setMenuOpen(false)}
                aria-label="Close menu"
                className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            {station && (
              <div className="border-b border-slate-800 px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-600">
                  Station
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-200">
                  {station.name}
                </p>
                <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-500">
                  <Building2 size={10} /> {station.buildingCount ?? 0} buildings ·{" "}
                  {station.deviceCount ?? 0} units
                </p>
              </div>
            )}

            <nav className="flex-1 overflow-y-auto p-3">
              {NAV.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "mb-1 flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition-colors",
                    isActive(href)
                      ? "bg-slate-800 text-slate-50"
                      : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200",
                  )}
                >
                  <Icon
                    size={17}
                    className={isActive(href) ? "text-orange-400" : ""}
                  />
                  {label}
                </Link>
              ))}
            </nav>

            <div className="border-t border-slate-800 px-4 py-3">
              <div className="mb-3">
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-600">
                  Theme
                </p>
                <ThemeToggle className="w-full justify-between" />
              </div>

              <span
                className={cn(
                  "flex items-center justify-center gap-2 rounded-lg border py-2 text-[11px] font-bold uppercase tracking-wider",
                  connected
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                    : "border-slate-700 text-slate-500",
                )}
              >
                {connected ? <Wifi size={12} /> : <WifiOff size={12} />}
                {connected ? "Live feed connected" : "Reconnecting…"}
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
