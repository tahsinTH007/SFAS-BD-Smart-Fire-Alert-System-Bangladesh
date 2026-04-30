import React from "react";
import { Flame } from "lucide-react";

export const FooterBranding: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between border-t border-slate-900">
      <div className="flex items-center gap-2">
        <Flame size={16} className="text-red-500" />
        <span className="text-[11px] font-bold text-slate-600 uppercase tracking-widest">
          SFAS-BD
        </span>
        <span className="text-[11px] text-slate-700">|</span>
        <span className="text-[10px] text-slate-700">
          Smart Fire Alert System – Bangladesh
        </span>
      </div>
      <span className="text-[10px] text-slate-700">
        © 2025 Bangladesh Fire Service
      </span>
    </div>
  );
};
