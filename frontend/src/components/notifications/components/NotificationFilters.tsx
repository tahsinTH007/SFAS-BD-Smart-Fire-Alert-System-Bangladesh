import React from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Priority, FilterReadStatus } from "../types/notification";

interface NotificationFiltersProps {
  search: string;
  filterRead: FilterReadStatus;
  filterPriority: Priority | "all";
  onSearchChange: (value: string) => void;
  onFilterReadChange: (value: FilterReadStatus) => void;
  onClearSearch: () => void;
  onClearPriorityFilter: () => void;
}

export const NotificationFilters: React.FC<NotificationFiltersProps> = ({
  search,
  filterRead,
  filterPriority,
  onSearchChange,
  onFilterReadChange,
  onClearSearch,
  onClearPriorityFilter,
}) => {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Search */}
      <div className="relative flex-1 min-w-60">
        <Search
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600"
        />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search alerts, locations, reports…"
          className="pl-9 bg-slate-900 border-slate-700 text-slate-200 placeholder-slate-600 text-sm focus:border-red-800 focus:ring-0 rounded-lg h-9"
        />
        {search && (
          <button
            onClick={onClearSearch}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Read status filter */}
      <Select value={filterRead} onValueChange={onFilterReadChange}>
        <SelectTrigger className="w-36 bg-slate-900 border-slate-700 text-slate-300 text-sm rounded-lg h-9 focus:border-red-800 focus:ring-0">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-slate-900 border-slate-700">
          <SelectItem
            value="all"
            className="text-slate-300 text-sm focus:bg-slate-800"
          >
            All
          </SelectItem>
          <SelectItem
            value="unread"
            className="text-slate-300 text-sm focus:bg-slate-800"
          >
            Unread
          </SelectItem>
          <SelectItem
            value="read"
            className="text-slate-300 text-sm focus:bg-slate-800"
          >
            Read
          </SelectItem>
        </SelectContent>
      </Select>

      {/* Clear priority filter */}
      {filterPriority !== "all" && (
        <Button
          variant="outline"
          size="sm"
          onClick={onClearPriorityFilter}
          className="border-slate-700 text-slate-400 hover:text-slate-200 bg-slate-900 text-xs gap-1 h-9"
        >
          <X size={11} />
          Clear Filter
        </Button>
      )}
    </div>
  );
};
