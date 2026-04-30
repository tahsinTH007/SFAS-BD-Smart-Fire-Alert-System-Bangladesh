import React from "react";
import { CheckCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface BulkActionBarProps {
  selectedCount: number;
  onMarkSelectedRead: () => void;
  onDeleteSelected: () => void;
}

export const BulkActionBar: React.FC<BulkActionBarProps> = ({
  selectedCount,
  onMarkSelectedRead,
  onDeleteSelected,
}) => {
  if (selectedCount === 0) return null;

  return (
    <div className="flex items-center justify-between bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5">
      <span className="text-[12px] text-slate-400 font-medium">
        <span className="text-slate-200 font-bold">{selectedCount}</span>{" "}
        selected
      </span>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onMarkSelectedRead}
          className="text-sky-400 hover:text-sky-300 hover:bg-slate-800 text-[12px] gap-1.5 h-7 px-3"
        >
          <CheckCheck size={13} /> Mark Read
        </Button>
        <Separator orientation="vertical" className="h-5 border-slate-700" />
        <Button
          variant="ghost"
          size="sm"
          onClick={onDeleteSelected}
          className="text-red-400 hover:text-red-300 hover:bg-slate-800 text-[12px] gap-1.5 h-7 px-3"
        >
          <Trash2 size={13} /> Delete
        </Button>
      </div>
    </div>
  );
};
