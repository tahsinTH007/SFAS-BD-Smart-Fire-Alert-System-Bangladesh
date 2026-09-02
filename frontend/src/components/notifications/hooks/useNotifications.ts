"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/redux/store";
import {
  acknowledgeAlert,
  bulkAcknowledge,
  bulkMarkRead,
  bulkRemove,
  fetchAlerts,
  markAlertRead,
  removeAlert,
  resolveAlert,
} from "@/redux/slices/alertSlice";
import type { AlertResponse } from "@/api/types";
import type {
  FilterPriority,
  FilterReadStatus,
  Notification,
} from "../types/notification";

export type Priority = FilterPriority;
export type { FilterReadStatus };

function toNotification(alert: AlertResponse): Notification {
  return {
    id: String(alert.id),
    type: alert.type,
    priority: alert.priority,
    title: alert.title,
    message: alert.message,
    location: alert.location,
    reportedBy: alert.reportedBy,
    contactNumber: alert.contactNumber,
    timestamp: alert.timestamp,
    read: alert.read,
    acknowledged: alert.acknowledged,
    status: alert.status,
    riskScore: alert.riskScore,
    riskFactors: alert.riskFactors,
    deviceId: alert.deviceId,
    building: alert.building,
    incident: alert.incident,
  };
}

export const useNotifications = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { alerts, loading, error, mutating } = useSelector(
    (s: RootState) => s.alerts,
  );

  const [search, setSearch] = useState("");
  const [filterPriority, setFilterPriority] = useState<FilterPriority>("all");
  const [filterRead, setFilterRead] = useState<FilterReadStatus>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    void dispatch(fetchAlerts());
  }, [dispatch]);

  const notifications: Notification[] = useMemo(
    () => alerts.map(toNotification),
    [alerts],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return notifications.filter((n) => {
      if (filterPriority !== "all" && n.priority !== filterPriority)
        return false;
      if (filterRead === "read" && !n.read) return false;
      if (filterRead === "unread" && n.read) return false;
      if (filterStatus !== "all" && n.status !== filterStatus) return false;

      if (!q) return true;
      return [n.title, n.message, n.location, n.deviceId, n.incident]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [notifications, search, filterPriority, filterRead, filterStatus]);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const criticalUnread = notifications.filter(
    (n) => !n.read && n.priority === "critical",
  ).length;

  const counts = useMemo(
    () => ({
      critical: notifications.filter((n) => n.priority === "critical").length,
      important: notifications.filter((n) => n.priority === "important").length,
      info: notifications.filter((n) => n.priority === "info").length,
    }),
    [notifications],
  );

  const unreadCounts = useMemo(
    () => ({
      critical: notifications.filter(
        (n) => n.priority === "critical" && !n.read,
      ).length,
      important: notifications.filter(
        (n) => n.priority === "important" && !n.read,
      ).length,
      info: notifications.filter((n) => n.priority === "info" && !n.read).length,
    }),
    [notifications],
  );

  // ── Selection ──────────────────────────────────────────────────────────────

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds((prev) =>
      prev.size === filtered.length
        ? new Set()
        : new Set(filtered.map((n) => n.id)),
    );
  }, [filtered]);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  // ── Actions (all persisted through the API) ────────────────────────────────

  const markRead = useCallback(
    async (id: string) => {
      await dispatch(markAlertRead({ id, read: true }));
    },
    [dispatch],
  );

  const acknowledge = useCallback(
    async (id: string) => {
      const res = await dispatch(acknowledgeAlert(id));
      if (acknowledgeAlert.fulfilled.match(res)) toast.success("Alert acknowledged");
    },
    [dispatch],
  );

  const resolve = useCallback(
    async (id: string, note?: string) => {
      const res = await dispatch(resolveAlert({ id, note }));
      if (resolveAlert.fulfilled.match(res)) toast.success("Alert resolved");
    },
    [dispatch],
  );

  const deleteOne = useCallback(
    async (id: string) => {
      const res = await dispatch(removeAlert(id));
      if (removeAlert.fulfilled.match(res)) {
        toast.success("Alert deleted");
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    },
    [dispatch],
  );

  const markAllRead = useCallback(async () => {
    const ids = notifications.filter((n) => !n.read).map((n) => n.id);
    if (!ids.length) return;
    const res = await dispatch(bulkMarkRead(ids));
    if (bulkMarkRead.fulfilled.match(res)) {
      toast.success(`${ids.length} alert(s) marked read`);
    }
  }, [dispatch, notifications]);

  const markSelectedRead = useCallback(async () => {
    const ids = [...selectedIds];
    if (!ids.length) return;
    const res = await dispatch(bulkMarkRead(ids));
    if (bulkMarkRead.fulfilled.match(res)) {
      toast.success(`${ids.length} alert(s) marked read`);
      clearSelection();
    }
  }, [dispatch, selectedIds, clearSelection]);

  const acknowledgeSelected = useCallback(async () => {
    const ids = [...selectedIds];
    if (!ids.length) return;
    const res = await dispatch(bulkAcknowledge(ids));
    if (bulkAcknowledge.fulfilled.match(res)) {
      toast.success(`${ids.length} alert(s) acknowledged`);
      clearSelection();
    }
  }, [dispatch, selectedIds, clearSelection]);

  const deleteSelected = useCallback(async () => {
    const ids = [...selectedIds];
    if (!ids.length) return;
    const res = await dispatch(bulkRemove(ids));
    if (bulkRemove.fulfilled.match(res)) {
      toast.success(`${ids.length} alert(s) deleted`);
      clearSelection();
    }
  }, [dispatch, selectedIds, clearSelection]);

  const refresh = useCallback(() => dispatch(fetchAlerts()), [dispatch]);

  const clearSearch = useCallback(() => setSearch(""), []);

  return {
    notifications,
    filtered,

    search,
    filterPriority,
    filterRead,
    filterStatus,
    selectedIds,

    unreadCount,
    criticalUnread,
    counts,
    unreadCounts,

    loading,
    mutating,
    error,

    setSearch,
    setFilterPriority,
    setFilterRead,
    setFilterStatus,

    toggleSelect,
    selectAll,
    clearSelection,

    markAllRead,
    markSelectedRead,
    acknowledgeSelected,
    deleteSelected,

    acknowledge,
    resolve,
    markRead,
    deleteOne,

    refresh,
    clearSearch,
  };
};
