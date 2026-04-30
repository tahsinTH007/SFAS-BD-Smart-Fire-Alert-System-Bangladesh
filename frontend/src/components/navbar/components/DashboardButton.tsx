import React from "react";
import Link from "next/link";
import { LayoutDashboard } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const DashboardButton: React.FC = () => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link href="/dashboard">
            <button className="relative p-2.5 rounded-xl text-white/90 hover:text-white hover:bg-white/10 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800 transition-all duration-200 group">
              <LayoutDashboard size={22} strokeWidth={1.8} />
            </button>
          </Link>
        </TooltipTrigger>
        <TooltipContent
          className="bg-slate-800 text-slate-200 text-xs border-slate-700"
          sideOffset={5}
        >
          Dashboard
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
