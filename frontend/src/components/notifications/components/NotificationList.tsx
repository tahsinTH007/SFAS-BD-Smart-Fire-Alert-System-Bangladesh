import React from "react";
import { BellOff } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Notification } from "../types/notification";
import { NotificationCard } from "./NotificationCard";

interface NotificationListProps {
  notifications: Notification[];
  selectedIds: Set<string>;
  onSelectAll: () => void;
  onToggleSelect: (id: string) => void;
  onAcknowledge: (id: string) => void;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
}

export const NotificationList: React.FC<NotificationListProps> = ({
  notifications,
  selectedIds,
  onSelectAll,
  onToggleSelect,
  onAcknowledge,
  onMarkRead,
  onDelete,
}) => {
  const allSelected =
    selectedIds.size === notifications.length && notifications.length > 0;

  return (
    <Card className="bg-slate-900 border-slate-800 rounded-xl overflow-hidden shadow-xl">
      {/* List header */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-slate-800 bg-slate-900/80">
        <Checkbox
          checked={allSelected}
          onCheckedChange={onSelectAll}
          className="border-slate-600 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
        />
        <span className="text-[11px] text-slate-600 font-semibold uppercase tracking-wider">
          {notifications.length} Notification
          {notifications.length !== 1 ? "s" : ""}
        </span>
        <div className="ml-auto flex items-center gap-2">
          <span className="flex items-center gap-1 text-[10px] text-slate-600">
            <span className="w-2 h-2 rounded-full bg-red-500" /> Critical
          </span>
          <span className="flex items-center gap-1 text-[10px] text-slate-600">
            <span className="w-2 h-2 rounded-full bg-amber-500" /> Important
          </span>
          <span className="flex items-center gap-1 text-[10px] text-slate-600">
            <span className="w-2 h-2 rounded-full bg-sky-500" /> Info
          </span>
        </div>
      </div>

      {/* Scrollable list */}
      <ScrollArea className="h-[70vh]">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-6">
            <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mb-4">
              <BellOff size={24} className="text-slate-600" />
            </div>
            <p className="text-sm text-slate-500 font-medium">
              No notifications found
            </p>
            <p className="text-xs text-slate-600 mt-1">
              Try adjusting your filters or search query.
            </p>
          </div>
        ) : (
          notifications.map((n) => (
            <NotificationCard
              key={n.id}
              notification={n}
              selected={selectedIds.has(n.id)}
              onSelect={onToggleSelect}
              onAcknowledge={onAcknowledge}
              onMarkRead={onMarkRead}
              onDelete={onDelete}
            />
          ))
        )}
      </ScrollArea>
    </Card>
  );
};
