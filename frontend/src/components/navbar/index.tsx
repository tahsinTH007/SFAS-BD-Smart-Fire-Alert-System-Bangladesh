"use client";
import React from "react";
import Link from "next/link";
import { Flame } from "lucide-react";
import { NotificationBell } from "./components/NotificationBell";
import { ProfileMenu } from "./components/ProfileMenu";
import { DashboardButton } from "./components/DashboardButton";

const Navbar = () => {
  return (
    <nav className="sticky top-0 z-1000 bg-linear-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 border-b-2 border-orange-500/30 dark:border-orange-600/20 shadow-lg shadow-black/20">
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-linear-to-r from-transparent via-orange-500 to-transparent opacity-70 animate-pulse" />

      <div className="absolute inset-0 bg-linear-to-b from-orange-500/5 to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="left-1/2 hidden lg:flex gap-3">
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-linear-to-r from-orange-500/10 to-red-500/10 border border-orange-500/30 dark:border-orange-600/20 backdrop-blur-sm">
              <Flame
                className="text-orange-500 dark:text-orange-400 animate-pulse"
                size={20}
              />
              <div className="flex flex-col">
                <h1 className="text-sm font-extrabold text-transparent bg-clip-text bg-linear-to-r from-orange-400 via-red-400 to-orange-500 tracking-wide">
                  SFAS-BD
                </h1>
                <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 tracking-wider uppercase">
                  Smart Fire Alert System
                </p>
              </div>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <DashboardButton />
            <NotificationBell />
            <ProfileMenu />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
