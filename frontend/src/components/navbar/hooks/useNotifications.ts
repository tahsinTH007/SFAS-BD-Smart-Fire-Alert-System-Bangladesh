"use client";

import { useCallback, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/redux/store";
import {
  bulkMarkRead,
  fetchAlerts,
  markAlertRead,
} from "@/redux/slices/alertSlice";
import type { AlertResponse } from "@/api/types";
import type {
  Notification,
  Priority,
} from "@/components/notifications/types/notification";

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
  const { alerts, loading, error } = useSelector((s: RootState) => s.alerts);

  useEffect(() => {
    void dispatch(fetchAlerts());
  }, [dispatch]);

  const notifications = useMemo(
    () => alerts.map(toNotification),
    [alerts],
  );

  const unreadCount = notifications.filter((n) => !n.read).length;
  const criticalCount = notifications.filter(
    (n) => !n.read && n.priority === "critical",
  ).length;

  const markRead = useCallback(
    (id: string) => {
      void dispatch(markAlertRead({ id, read: true }));
    },
    [dispatch],
  );

  const markAllRead = useCallback(() => {
    const ids = notifications.filter((n) => !n.read).map((n) => n.id);
    if (ids.length) void dispatch(bulkMarkRead(ids));
  }, [dispatch, notifications]);

  /**
   * The bell shows only what still needs attention, newest first — a dropdown
   * listing hundreds of resolved alerts is not useful.
   */
  const groupedNotifications = useMemo(() => {
    const pending = notifications.filter(
      (n) => !n.read && n.status !== "resolved",
    );
    const byPriority = (p: Priority) =>
      pending.filter((n) => n.priority === p).slice(0, 8);

    return {
      critical: byPriority("critical"),
      important: byPriority("important"),
      info: byPriority("info"),
    };
  }, [notifications]);

  return {
    notifications,
    unreadCount,
    criticalCount,
    markRead,
    markAllRead,
    groupedNotifications,
    loading,
    error,
  };
};
