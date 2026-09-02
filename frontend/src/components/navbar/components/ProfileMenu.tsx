"use client";

import React from "react";
import Link from "next/link";
import { useSelector } from "react-redux";
import { Clock, Radio, Settings, ShieldAlert, User } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { RootState } from "@/redux/store";
import { selectActiveStation } from "@/redux/slices/sessionSlice";

const SHIFT_LABEL: Record<string, string> = {
  day: "Day shift",
  night: "Night shift",
  rotating: "Rotating shift",
};

export const ProfileMenu: React.FC = () => {
  const operator = useSelector((s: RootState) => s.session.operator);
  const station = useSelector(selectActiveStation);

  const initials =
    operator.name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase() || "OP";

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          aria-label="Operator menu"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-red-600 text-sm font-bold text-white shadow-lg ring-2 ring-orange-500/40 ring-offset-2 ring-offset-slate-900 transition-all hover:ring-orange-400"
        >
          {initials}
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className="z-[10001] mt-2 w-72 rounded-xl border border-slate-700 bg-slate-900 p-0 shadow-2xl"
      >
        {/* Identity */}
        <div className="border-b border-slate-800 px-4 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-red-600 text-base font-bold text-white">
              {initials}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-slate-100">
                {operator.name}
              </p>
              <p className="truncate text-xs text-slate-400">{operator.rank}</p>
              <p className="mt-1 flex items-center gap-1.5 text-[10px] text-slate-500">
                <Clock size={9} />
                {SHIFT_LABEL[operator.shift] ?? operator.shift}
              </p>
            </div>
          </div>

          {station && (
            <div className="mt-3 flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950/50 px-2.5 py-1.5">
              <Radio size={11} className="shrink-0 text-orange-400" />
              <span className="truncate text-[11px] text-slate-300">
                {station.stationCode} — {station.name}
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-2">
          <Link
            href="/profile"
            className="flex w-full items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-slate-100"
          >
            <User size={15} className="text-slate-500" />
            My profile
          </Link>

          <Link
            href="/settings"
            className="mt-0.5 flex w-full items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-slate-100"
          >
            <Settings size={15} className="text-slate-500" />
            Settings
          </Link>
        </div>

        {/* There is no auth yet — say so rather than showing a fake logout. */}
        <div className="border-t border-slate-800 px-4 py-3">
          <p className="flex items-start gap-2 text-[10px] leading-relaxed text-slate-500">
            <ShieldAlert size={12} className="mt-px shrink-0 text-amber-500/70" />
            <span>
              No sign-in configured. This name is a label stored in this browser.
            </span>
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
};
