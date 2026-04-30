import { useState, useMemo, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import {
  fetchAlerts,
  updateAlert,
  deleteAlert,
} from "@/redux/slices/alertSlice";
import { AlertResponse } from "@/api/alertApi";
import { Notification } from "../types/notification";

export type Priority = "critical" | "important" | "info" | "all";
export type FilterReadStatus = "all" | "read" | "unread";

function mapAlertToNotification(alert: AlertResponse): Notification {
  return {
    id: String(alert.id),
    type: alert.type,
    priority: alert.priority,
    title: alert.title,
    message: alert.message,
    location: alert.location,
    reportedBy: alert.reportedBy ?? "Unknown",
    contactNumber: alert.contactNumber,
    timestamp: alert.timestamp,
    read: alert.read,
    acknowledged: alert.acknowledged,
  };
}

export const useNotifications = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { alerts, loading, error } = useSelector(
    (state: RootState) => state.alerts,
  );

  const notifications: Notification[] = useMemo(
    () => alerts.map(mapAlertToNotification),
    [alerts],
  );

  const [search, setSearch] = useState<string>("");
  const [filterPriority, setFilterPriority] = useState<Priority>("all");
  const [filterRead, setFilterRead] = useState<FilterReadStatus>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    dispatch(fetchAlerts());
  }, [dispatch]);

  const filtered = useMemo(() => {
    return notifications.filter((n) => {
      if (filterPriority !== "all" && n.priority !== filterPriority)
        return false;
      if (filterRead === "read" && !n.read) return false;
      if (filterRead === "unread" && n.read) return false;

      const searchLower = search.toLowerCase();
      if (
        search &&
        !(
          n.title.toLowerCase().includes(searchLower) ||
          n.message.toLowerCase().includes(searchLower) ||
          (n.location?.toLowerCase().includes(searchLower) ?? false)
        )
      )
        return false;

      return true;
    });
  }, [notifications, search, filterPriority, filterRead]);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const criticalUnread = notifications.filter(
    (n) => !n.read && n.priority === "critical",
  ).length;
  const counts = {
    critical: notifications.filter((n) => n.priority === "critical").length,
    important: notifications.filter((n) => n.priority === "important").length,
    info: notifications.filter((n) => n.priority === "info").length,
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((n) => String(n.id))));
    }
  };

  const markAllRead = () => {
    alerts.forEach((a) => {
      if (!a.read) dispatch(updateAlert({ ...a, read: true }));
    });
  };

  const markSelectedRead = () => {
    alerts.forEach((a) => {
      if (selectedIds.has(String(a.id)) && !a.read)
        dispatch(updateAlert({ ...a, read: true }));
    });
    setSelectedIds(new Set());
  };

  const acknowledge = (id: string) => {
    const alert = alerts.find((a) => a.id === id);
    if (alert)
      dispatch(updateAlert({ ...alert, acknowledged: true, read: true }));
  };

  const markRead = (id: string) => {
    const alert = alerts.find((a) => a.id === id);
    if (alert) dispatch(updateAlert({ ...alert, read: true }));
  };

  const deleteOne = (id: string) => {
    dispatch(deleteAlert(id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const deleteSelected = () => {
    selectedIds.forEach((id) => dispatch(deleteAlert(id)));
    setSelectedIds(new Set());
  };

  const clearSearch = () => setSearch("");

  return {
    notifications,
    filtered,

    search,
    filterPriority,
    filterRead,
    selectedIds,

    unreadCount,
    criticalUnread,
    counts,

    loading,
    error,

    setSearch,
    setFilterPriority,
    setFilterRead,

    toggleSelect,
    selectAll,
    markAllRead,
    markSelectedRead,
    acknowledge,
    markRead,
    deleteOne,
    deleteSelected,
    clearSearch,
  };
};
