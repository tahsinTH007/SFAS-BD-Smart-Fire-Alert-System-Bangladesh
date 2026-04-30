import React from "react";
import Link from "next/link";
import { LogOut, User, Settings, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const ProfileMenu: React.FC = () => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className="p-0 hover:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
        >
          <Avatar className="h-10 w-10 ring-2 ring-offset-2 ring-offset-slate-900 dark:ring-offset-slate-900 ring-orange-500/50 dark:ring-orange-600/40 cursor-pointer hover:ring-orange-500 dark:hover:ring-orange-500 transition-all shadow-lg">
            <AvatarImage src={""} alt={"User"} />
            <AvatarFallback className="bg-linear-to-br from-orange-500 to-red-600 text-white font-bold text-sm">
              A
            </AvatarFallback>
          </Avatar>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-64 p-0 rounded-xl shadow-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 mt-2 z-10001"
        align="end"
      >
        {/* Profile header */}
        <div className="relative px-4 py-4 border-b-2 border-slate-100 dark:border-slate-800 bg-linear-to-r from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 rounded-t-xl">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 ring-2 ring-white dark:ring-slate-800 shadow-lg">
              <AvatarFallback className="bg-linear-to-br from-orange-500 to-red-600 text-white text-base font-bold">
                A
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                Ashik Morsalin
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
                ashik.morsalin@sfas-bd.com
              </p>
              <div className="flex items-center gap-1.5 mt-1.5">
                <Shield
                  size={12}
                  className="text-green-600 dark:text-green-400"
                />
                <span className="text-[10px] font-semibold text-green-700 dark:text-green-400 uppercase tracking-wide">
                  Administrator
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-2">
          <Link href="/account">
            <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group">
              <User
                size={16}
                className="text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300"
              />
              My Profile
            </button>
          </Link>

          <Link href="/settings">
            <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group mt-0.5">
              <Settings
                size={16}
                className="text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300"
              />
              Settings
            </button>
          </Link>

          <div className="my-2 border-t border-slate-200 dark:border-slate-800"></div>

          <Link href="/">
            <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors group">
              <LogOut
                size={16}
                className="group-hover:translate-x-0.5 transition-transform"
              />
              Logout
            </button>
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
};
